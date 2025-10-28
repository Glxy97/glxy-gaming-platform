// @ts-nocheck
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { BattleRoyaleMatchStatus, BattleRoyalePlayerStatus, BattleRoyaleItemType } from '@prisma/client';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GameConfig {
  zoneShrinkInterval: number; // seconds
  zoneDamagePerSecond: number;
  maxZoneRadius: number;
  minZoneRadius: number;
  lootSpawnInterval: number; // seconds
  vehicleRespawnTime: number; // seconds
  matchDuration: number; // seconds
}

export class BattleRoyaleMatchManager {
  private config: GameConfig;
  private zoneTimers: Map<string, NodeJS.Timeout> = new Map();
  private lootTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<GameConfig> = {}) {
    this.config = {
      zoneShrinkInterval: 60, // 1 minute
      zoneDamagePerSecond: 1,
      maxZoneRadius: 1000,
      minZoneRadius: 50,
      lootSpawnInterval: 30, // 30 seconds
      vehicleRespawnTime: 120, // 2 minutes
      matchDuration: 1800, // 30 minutes
      ...config,
    };
  }

  async startMatch(matchId: string): Promise<void> {
    try {
      // Update match status
      await prisma.battleRoyaleMatch.update({
        where: { id: matchId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          zoneCenterX: 0,
          zoneCenterY: 0,
          zoneRadius: this.config.maxZoneRadius,
          nextZoneTime: new Date(Date.now() + this.config.zoneShrinkInterval * 1000),
        },
      });

      // Initialize all players as alive
      await prisma.battleRoyalePlayer.updateMany({
        where: { matchId },
        data: { status: 'ALIVE' },
      });

      // Start zone system
      this.startZoneSystem(matchId);

      // Start loot spawning system
      this.startLootSystem(matchId);

      // Start match timer
      this.startMatchTimer(matchId);

      // Spawn initial loot
      await this.spawnInitialLoot(matchId);

      // Spawn vehicles
      await this.spawnVehicles(matchId);

      console.log(`Match ${matchId} started successfully`);

    } catch (error) {
      console.error('Error starting match:', error);
      throw error;
    }
  }

  async endMatch(matchId: string, reason: 'winner' | 'timeout' | 'cancelled'): Promise<void> {
    try {
      // Clear all timers
      this.clearTimers(matchId);

      // Update match status
      await prisma.battleRoyaleMatch.update({
        where: { id: matchId },
        data: {
          status: 'FINISHED',
          endedAt: new Date(),
        },
      });

      // Get all players and update their stats
      const players = await prisma.battleRoyalePlayer.findMany({
        where: { matchId },
        include: {
          user: true,
        },
      });

      // Calculate placements and update stats
      const sortedPlayers = this.calculatePlayerPlacements(players);

      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const placement = i + 1;

        // Update player stats
        await this.updatePlayerStats(player.userId, {
          matchesPlayed: 1,
          placement,
          kills: player.kills,
          assists: player.assists,
          damage: player.damage,
          timeSurvived: player.eliminatedAt && player.match.startedAt
            ? Math.floor((new Date(player.eliminatedAt).getTime() - new Date(player.match.startedAt).getTime()) / 1000)
            : 0,
        });

        // Award XP based on placement and performance
        const xpGained = this.calculateXPGain(placement, player.kills, player.damage);
        await this.awardXP(player.userId, xpGained);
      }

      // Notify clients via Redis
      await redis.publish(`br:match:${matchId}`, JSON.stringify({
        type: 'match_ended',
        reason,
        placements: sortedPlayers.map((p, i) => ({
          userId: p.userId,
          username: p.user.username,
          placement: i + 1,
          kills: p.kills,
          damage: p.damage,
        })),
      }));

      console.log(`Match ${matchId} ended with reason: ${reason}`);

    } catch (error) {
      console.error('Error ending match:', error);
      throw error;
    }
  }

  private startZoneSystem(matchId: string): void {
    const shrinkZone = async () => {
      try {
        const match = await prisma.battleRoyaleMatch.findUnique({
          where: { id: matchId },
          include: {
            players: true,
            zones: {
              orderBy: { zoneNumber: 'desc' },
              take: 1
            }
          },
        });

        if (!match || match.status !== 'IN_PROGRESS') {
          this.clearTimers(matchId);
          return;
        }

        // Calculate new zone parameters
        const newZone = this.calculateNextZone(match);

        // Create zone record
        await prisma.battleRoyaleZone.create({
          data: {
            matchId,
            zoneNumber: match.zones.length + 1,
            centerX: newZone.centerX,
            centerY: newZone.centerY,
            radius: newZone.radius,
            startTime: new Date(),
            endTime: new Date(Date.now() + this.config.zoneShrinkInterval * 1000),
            damage: this.config.zoneDamagePerSecond,
          },
        });

        // Update match
        await prisma.battleRoyaleMatch.update({
          where: { id: matchId },
          data: {
            zoneCenterX: newZone.centerX,
            zoneCenterY: newZone.centerY,
            zoneRadius: newZone.radius,
            zoneDamage: newZone.damage,
            nextZoneTime: newZone.endTime,
          },
        });

        // Apply zone damage to players outside the zone
        await this.applyZoneDamage(matchId, newZone);

        // Notify clients
        await redis.publish(`br:match:${matchId}`, JSON.stringify({
          type: 'zone_update',
          zone: newZone,
        }));

        // Check if zone is at minimum size
        if (newZone.radius <= this.config.minZoneRadius) {
          // Match should end soon
          const timeout = setTimeout(() => {
            this.endMatch(matchId, 'timeout');
          }, 60000); // 1 minute after minimum zone
          this.zoneTimers.set(matchId, timeout);
        } else {
          // Schedule next zone shrink
          const nextShrink = setTimeout(() => shrinkZone(), this.config.zoneShrinkInterval * 1000);
          this.zoneTimers.set(matchId, nextShrink);
        }

      } catch (error) {
        console.error('Error in zone system:', error);
      }
    };

    // Start first zone shrink after initial interval
    const firstShrink = setTimeout(() => shrinkZone(), this.config.zoneShrinkInterval * 1000);
    this.zoneTimers.set(matchId, firstShrink);
  }

  private calculateNextZone(currentMatch: any): any {
    // Calculate new zone center (can move randomly or towards center)
    const maxMovement = currentMatch.zoneRadius * 0.3;
    const newCenterX = currentMatch.zoneCenterX + (Math.random() - 0.5) * maxMovement * 2;
    const newCenterY = currentMatch.zoneCenterY + (Math.random() - 0.5) * maxMovement * 2;

    // Calculate new radius (shrinking)
    const shrinkFactor = 0.7; // Zone shrinks to 70% of previous size
    const newRadius = Math.max(
      this.config.minZoneRadius,
      currentMatch.zoneRadius * shrinkFactor
    );

    // Increase damage as zone gets smaller
    const newDamage = this.config.zoneDamagePerSecond * (1 + (1 - newRadius / this.config.maxZoneRadius));

    return {
      centerX: newCenterX,
      centerY: newCenterY,
      radius: newRadius,
      damage: Math.round(newDamage),
      endTime: new Date(Date.now() + this.config.zoneShrinkInterval * 1000),
    };
  }

  private async applyZoneDamage(matchId: string, zone: any): Promise<void> {
    try {
      const players = await prisma.battleRoyalePlayer.findMany({
        where: {
          matchId,
          status: 'ALIVE',
        },
      });

      for (const player of players) {
        const distance = Math.sqrt(
          Math.pow(player.positionX - zone.centerX, 2) +
          Math.pow(player.positionY - zone.centerY, 2)
        );

        if (distance > zone.radius) {
          // Player is outside the zone, apply damage
          const newHealth = Math.max(0, player.health - Math.ceil(zone.damage));

          await prisma.battleRoyalePlayer.update({
            where: { id: player.id },
            data: { health: newHealth },
          });

          if (newHealth <= 0) {
            // Player eliminated by zone
            await this.eliminatePlayer(player.id, 'zone');
          }

          // Notify clients
          await redis.publish(`br:match:${matchId}`, JSON.stringify({
            type: 'zone_damage',
            playerId: player.userId,
            damage: Math.ceil(zone.damage),
            remainingHealth: newHealth,
            isOutside: true,
          }));
        }
      }
    } catch (error) {
      console.error('Error applying zone damage:', error);
    }
  }

  private startLootSystem(matchId: string): void {
    const spawnLoot = async () => {
      try {
        const match = await prisma.battleRoyaleMatch.findUnique({
          where: { id: matchId },
        });

        if (!match || match.status !== 'IN_PROGRESS') {
          this.clearTimers(matchId);
          return;
        }

        // Spawn new loot items
        await this.spawnLootItems(matchId);

        // Schedule next loot spawn
        const nextSpawn = setTimeout(() => spawnLoot(), this.config.lootSpawnInterval * 1000);
        this.lootTimers.set(matchId, nextSpawn);

      } catch (error) {
        console.error('Error in loot system:', error);
      }
    };

    const firstSpawn = setTimeout(() => spawnLoot(), this.config.lootSpawnInterval * 1000);
    this.lootTimers.set(matchId, firstSpawn);
  }

  private async spawnInitialLoot(matchId: string): Promise<void> {
    const lootItems = this.generateLootItems(100); // Spawn 100 initial items
    const lootPromises = lootItems.map(item =>
      prisma.battleRoyaleLootSpawn.create({
        data: {
          matchId,
          positionX: item.position.x,
          positionY: item.position.y,
          positionZ: item.position.z,
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
        },
      })
    );

    await Promise.all(lootPromises);
  }

  private async spawnLootItems(matchId: string): Promise<void> {
    const lootItems = this.generateLootItems(10); // Spawn 10 new items
    const lootPromises = lootItems.map(item =>
      prisma.battleRoyaleLootSpawn.create({
        data: {
          matchId,
          positionX: item.position.x,
          positionY: item.position.y,
          positionZ: item.position.z,
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
        },
      })
    );

    await Promise.all(lootPromises);
  }

  private generateLootItems(count: number): any[] {
    const items = [];
    const itemTypes = Object.values(BattleRoyaleItemType);

    for (let i = 0; i < count; i++) {
      const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const itemId = this.getRandomItemId(itemType);

      items.push({
        position: {
          x: Math.random() * 2000 - 1000,
          y: Math.random() * 2000 - 1000,
          z: 0,
        },
        itemType,
        itemId,
        quantity: Math.floor(Math.random() * 5) + 1,
      });
    }

    return items;
  }

  private getRandomItemId(itemType: BattleRoyaleItemType): string {
    // This would typically use a comprehensive item database
    const itemDatabase: { [key in BattleRoyaleItemType]: string[] } = {
      [BattleRoyaleItemType.WEAPON]: ['pistol', 'rifle', 'shotgun', 'smg', 'sniper'],
      [BattleRoyaleItemType.ATTACHMENT]: ['scope_2x', 'scope_4x', 'silencer', 'extended_mag'],
      [BattleRoyaleItemType.AMMO]: ['light_ammo', 'medium_ammo', 'heavy_ammo', 'shotgun_ammo'],
      [BattleRoyaleItemType.MEDICAL]: ['bandage', 'medkit', 'first_aid', 'shield_potion'],
      [BattleRoyaleItemType.THROWABLE]: ['grenade', 'smoke', 'flashbang'],
      [BattleRoyaleItemType.ARMOR]: ['level1_armor', 'level2_armor', 'level3_armor'],
      [BattleRoyaleItemType.HELMET]: ['level1_helmet', 'level2_helmet', 'level3_helmet'],
      [BattleRoyaleItemType.BACKPACK]: ['small_backpack', 'medium_backpack', 'large_backpack'],
      [BattleRoyaleItemType.SCOPE]: ['red_dot', 'holo', 'acog'],
      [BattleRoyaleItemType.CONSUMABLE]: ['energy_drink', 'painkillers'],
      [BattleRoyaleItemType.MATERIAL]: ['wood', 'stone', 'metal'],
      [BattleRoyaleItemType.VEHICLE]: ['vehicle_key'],
      [BattleRoyaleItemType.SPECIAL]: ['legendary_item'],
    };

    const items = itemDatabase[itemType] || ['common_item'];
    return items[Math.floor(Math.random() * items.length)];
  }

  private async spawnVehicles(matchId: string): Promise<void> {
    const vehicleTypes = ['car', 'truck', 'motorcycle', 'boat'];
    const vehicleCount = 10; // Spawn 10 vehicles

    const vehiclePromises = [];
    for (let i = 0; i < vehicleCount; i++) {
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];

      vehiclePromises.push(
        prisma.battleRoyaleVehicle.create({
          data: {
            matchId,
            vehicleId: vehicleType,
            positionX: Math.random() * 2000 - 1000,
            positionY: Math.random() * 2000 - 1000,
            positionZ: 0,
            rotation: Math.random() * 360,
            health: 100,
            fuel: 100,
            occupied: false,
            locked: false,
          },
        })
      );
    }

    await Promise.all(vehiclePromises);
  }

  private startMatchTimer(matchId: string): void {
    const matchTimer = setTimeout(async () => {
      await this.endMatch(matchId, 'timeout');
    }, this.config.matchDuration * 1000);

    this.zoneTimers.set(matchId, matchTimer);
  }

  private async eliminatePlayer(playerId: string, cause: string): Promise<void> {
    await prisma.battleRoyalePlayer.update({
      where: { id: playerId },
      data: {
        status: 'ELIMINATED',
        eliminatedAt: new Date(),
      },
    });

    // Get player details for notification
    const player = await prisma.battleRoyalePlayer.findUnique({
      where: { id: playerId },
      include: { match: true },
    });

    if (player) {
      await redis.publish(`br:match:${player.matchId}`, JSON.stringify({
        type: 'player_eliminated',
        playerId: player.userId,
        cause,
      }));
    }
  }

  private calculatePlayerPlacements(players: any[]): any[] {
    // Sort by elimination time (later elimination = better placement)
    return players.sort((a, b) => {
      if (a.status === 'ALIVE' && b.status !== 'ALIVE') return -1;
      if (a.status !== 'ALIVE' && b.status === 'ALIVE') return 1;

      if (a.eliminatedAt && b.eliminatedAt) {
        return new Date(b.eliminatedAt).getTime() - new Date(a.eliminatedAt).getTime();
      }

      return b.kills - a.kills; // If same elimination time, kills as tiebreaker
    });
  }

  private async updatePlayerStats(userId: string, stats: any): Promise<void> {
    const playerStats = await prisma.battleRoyaleStats.findUnique({
      where: { userId },
    });

    if (playerStats) {
      await prisma.battleRoyaleStats.update({
        where: { userId },
        data: {
          totalMatches: { increment: stats.matchesPlayed },
          wins: { increment: stats.placement === 1 ? 1 : 0 },
          top10: { increment: stats.placement <= 10 ? 1 : 0 },
          totalKills: { increment: stats.kills },
          totalAssists: { increment: stats.assists },
          totalDamage: { increment: stats.damage },
          avgPlacement: ((playerStats.avgPlacement * playerStats.totalMatches) + stats.placement) / (playerStats.totalMatches + 1),
          totalTimePlayed: { increment: stats.timeSurvived },
          longestSurvival: Math.max(playerStats.longestSurvival, stats.timeSurvived),
          seasonMatches: { increment: stats.matchesPlayed },
          seasonWins: { increment: stats.placement === 1 ? 1 : 0 },
          seasonKills: { increment: stats.kills },
          bestKills: Math.max(playerStats.bestKills, stats.kills),
          bestDamage: Math.max(playerStats.bestDamage, stats.damage),
        },
      });
    } else {
      // Create new stats record
      await prisma.battleRoyaleStats.create({
        data: {
          userId,
          totalMatches: stats.matchesPlayed,
          wins: stats.placement === 1 ? 1 : 0,
          top10: stats.placement <= 10 ? 1 : 0,
          totalKills: stats.kills,
          totalAssists: stats.assists,
          totalDamage: stats.damage,
          avgPlacement: stats.placement,
          totalTimePlayed: stats.timeSurvived,
          longestSurvival: stats.timeSurvived,
          seasonMatches: stats.matchesPlayed,
          seasonWins: stats.placement === 1 ? 1 : 0,
          seasonKills: stats.kills,
          bestKills: stats.kills,
          bestDamage: stats.damage,
        },
      });
    }
  }

  private calculateXPGain(placement: number, kills: number, damage: number): number {
    const baseXP = 100; // Base XP for participating
    const placementXP = Math.max(0, (100 - placement) * 10); // Placement bonus
    const killXP = kills * 25; // XP per kill
    const damageXP = Math.floor(damage / 10); // XP per 10 damage

    return baseXP + placementXP + killXP + damageXP;
  }

  private async awardXP(userId: string, xpGained: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        globalXP: { increment: xpGained },
      },
    });

    // Also award seasonal XP
    await prisma.battleRoyaleStats.update({
      where: { userId },
      data: {
        seasonXP: { increment: xpGained },
      },
    });
  }

  private clearTimers(matchId: string): void {
    // Clear zone timers
    const zoneTimer = this.zoneTimers.get(matchId);
    if (zoneTimer) {
      clearTimeout(zoneTimer);
      this.zoneTimers.delete(matchId);
    }

    // Clear loot timers
    const lootTimer = this.lootTimers.get(matchId);
    if (lootTimer) {
      clearTimeout(lootTimer);
      this.lootTimers.delete(matchId);
    }
  }

  public getMatchStatus(matchId: string): Promise<any> {
    return prisma.battleRoyaleMatch.findUnique({
      where: { id: matchId },
      include: {
        players: true,
        zones: true,
        _count: {
          select: {
            players: true,
            lootSpawns: true,
            vehicles: true,
          },
        },
      },
    });
  }

  public async getPlayersInMatch(matchId: string): Promise<any[]> {
    return prisma.battleRoyalePlayer.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
            avatar: true,
          },
        },
      },
    });
  }

  public async getLootInMatch(matchId: string): Promise<any[]> {
    return prisma.battleRoyaleLootSpawn.findMany({
      where: { matchId, spawned: true },
    });
  }

  public async getVehiclesInMatch(matchId: string): Promise<any[]> {
    return prisma.battleRoyaleVehicle.findMany({
      where: { matchId },
    });
  }

  public async getActiveMatchCount(): Promise<number> {
    return prisma.battleRoyaleMatch.count({
      where: {
        status: 'IN_PROGRESS'
      }
    });
  }
}