export interface PlayerStats {
  playerId: string
  playerName: string
  kills: number
  deaths: number
  assists: number
  score: number
  headshots: number
  shotsHit: number
  shotsFired: number
  damageDealt: number
  damageTaken: number
  accuracy: number
  killDeathRatio: number
  playTime: number
  longestKillStreak: number
  currentKillStreak: number
  weaponsUsed: Map<string, number>
  achievements: string[]
  rank: string
  level: number
  experience: number
}

export interface MatchStats {
  matchId: string
  gameMode: string
  startTime: number
  endTime: number
  duration: number
  players: Map<string, PlayerStats>
  winner: string
  teamScores: Map<string, number>
  map: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'combat' | 'accuracy' | 'survival' | 'teamwork' | 'special'
  requirement: {
    type: 'kills' | 'headshots' | 'accuracy' | 'survival' | 'streak' | 'team'
    value: number
    condition?: string
  }
  reward: {
    experience: number
    title?: string
    badge?: string
  }
}

export class StatsManager {
  private playerStats: Map<string, PlayerStats> = new Map()
  private matchHistory: MatchStats[] = []
  private achievements: Map<string, Achievement> = new Map()
  private globalStats: Map<string, any> = new Map()

  constructor() {
    this.initializeAchievements()
    this.initializeRanks()
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Combat Achievements
      {
        id: 'first_kill',
        name: 'Erster Kill',
        description: 'Erziele deinen ersten Kill',
        icon: '🎯',
        category: 'combat',
        requirement: { type: 'kills', value: 1 },
        reward: { experience: 50 }
      },
      {
        id: 'killer',
        name: 'Killer',
        description: 'Erziele 10 Kills in einem Match',
        icon: '⚔️',
        category: 'combat',
        requirement: { type: 'kills', value: 10, condition: 'single_match' },
        reward: { experience: 200 }
      },
      {
        id: 'massacre',
        name: 'Massaker',
        description: 'Erziele 25 Kills in einem Match',
        icon: '💀',
        category: 'combat',
        requirement: { type: 'kills', value: 25, condition: 'single_match' },
        reward: { experience: 500, title: 'Massaker' }
      },

      // Accuracy Achievements
      {
        id: 'sharpshooter',
        name: 'Scharfschütze',
        description: 'Erziele 50% Genauigkeit in einem Match',
        icon: '🎪',
        category: 'accuracy',
        requirement: { type: 'accuracy', value: 50, condition: 'single_match' },
        reward: { experience: 150 }
      },
      {
        id: 'headhunter',
        name: 'Kopfjäger',
        description: 'Erziele 10 Headshots',
        icon: '🎯',
        category: 'accuracy',
        requirement: { type: 'headshots', value: 10 },
        reward: { experience: 300 }
      },

      // Survival Achievements
      {
        id: 'survivor',
        name: 'Überlebender',
        description: 'Überlebe 5 Minuten ohne zu sterben',
        icon: '🛡️',
        category: 'survival',
        requirement: { type: 'survival', value: 300 },
        reward: { experience: 100 }
      },
      {
        id: 'invincible',
        name: 'Unbesiegbar',
        description: 'Gewinne ein Match ohne zu sterben',
        icon: '👑',
        category: 'survival',
        requirement: { type: 'survival', value: 1, condition: 'no_death' },
        reward: { experience: 1000, title: 'Unbesiegbar' }
      },

      // Streak Achievements
      {
        id: 'streak_5',
        name: 'Raserei',
        description: 'Erziele eine 5-Kill-Serie',
        icon: '🔥',
        category: 'special',
        requirement: { type: 'streak', value: 5 },
        reward: { experience: 250 }
      },
      {
        id: 'streak_10',
        name: 'Unbarmherzig',
        description: 'Erziele eine 10-Kill-Serie',
        icon: '💥',
        category: 'special',
        requirement: { type: 'streak', value: 10 },
        reward: { experience: 500, title: 'Unbarmherzig' }
      },

      // Team Achievements
      {
        id: 'team_player',
        name: 'Teamspieler',
        description: 'Erziele 20 Assists',
        icon: '🤝',
        category: 'teamwork',
        requirement: { type: 'team', value: 20 },
        reward: { experience: 200 }
      }
    ]

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement)
    })
  }

  private initializeRanks(): void {
    // Initialize rank system
    const ranks = [
      { name: 'Rekrut', level: 1, experience: 0 },
      { name: 'Gefreiter', level: 2, experience: 100 },
      { name: 'Unteroffizier', level: 3, experience: 300 },
      { name: 'Feldwebel', level: 4, experience: 600 },
      { name: 'Leutnant', level: 5, experience: 1000 },
      { name: 'Hauptmann', level: 6, experience: 1500 },
      { name: 'Major', level: 7, experience: 2200 },
      { name: 'Oberst', level: 8, experience: 3000 },
      { name: 'General', level: 9, experience: 4000 },
      { name: 'Legendär', level: 10, experience: 5500 }
    ]

    ranks.forEach(rank => {
      this.globalStats.set(`rank_${rank.level}`, rank)
    })
  }

  public initializePlayer(playerId: string, playerName: string): void {
    if (this.playerStats.has(playerId)) return

    const stats: PlayerStats = {
      playerId,
      playerName,
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0,
      headshots: 0,
      shotsHit: 0,
      shotsFired: 0,
      damageDealt: 0,
      damageTaken: 0,
      accuracy: 0,
      killDeathRatio: 0,
      playTime: 0,
      longestKillStreak: 0,
      currentKillStreak: 0,
      weaponsUsed: new Map(),
      achievements: [],
      rank: 'Rekrut',
      level: 1,
      experience: 0
    }

    this.playerStats.set(playerId, stats)
  }

  public onPlayerKill(killerId: string, victimId: string, weaponId: string, isHeadshot: boolean = false): void {
    const killerStats = this.playerStats.get(killerId)
    const victimStats = this.playerStats.get(victimId)

    if (!killerStats || !victimStats) return

    // Update killer stats
    killerStats.kills++
    killerStats.score += 100
    killerStats.experience += 25
    killerStats.currentKillStreak++
    
    if (killerStats.currentKillStreak > killerStats.longestKillStreak) {
      killerStats.longestKillStreak = killerStats.currentKillStreak
    }

    if (isHeadshot) {
      killerStats.headshots++
      killerStats.experience += 10
    }

    // Track weapon usage
    const weaponCount = killerStats.weaponsUsed.get(weaponId) || 0
    killerStats.weaponsUsed.set(weaponId, weaponCount + 1)

    // Update victim stats
    victimStats.deaths++
    victimStats.currentKillStreak = 0

    // Update ratios
    this.updatePlayerStats(killerId)
    this.updatePlayerStats(victimId)

    // Check achievements
    this.checkAchievements(killerId)

    console.log(`Kill: ${killerStats.playerName} killed ${victimStats.playerName} with ${weaponId}`)
  }

  public onPlayerAssist(playerId: string, weaponId: string): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    stats.assists++
    stats.score += 50
    stats.experience += 15

    // Track weapon usage
    const weaponCount = stats.weaponsUsed.get(weaponId) || 0
    stats.weaponsUsed.set(weaponId, weaponCount + 1)

    this.updatePlayerStats(playerId)
    this.checkAchievements(playerId)

    console.log(`Assist: ${stats.playerName} got an assist`)
  }

  public onPlayerShot(playerId: string, hit: boolean, damage: number = 0): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    stats.shotsFired++
    
    if (hit) {
      stats.shotsHit++
      stats.damageDealt += damage
    }

    this.updatePlayerStats(playerId)
  }

  public onPlayerDamage(playerId: string, damage: number): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    stats.damageTaken += damage
    this.updatePlayerStats(playerId)
  }

  public onPlayerScore(playerId: string, points: number, reason: string): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    stats.score += points
    stats.experience += Math.floor(points / 4) // 25% of score as experience

    this.updatePlayerStats(playerId)
    this.checkAchievements(playerId)

    console.log(`Score: ${stats.playerName} earned ${points} points for ${reason}`)
  }

  private updatePlayerStats(playerId: string): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    // Calculate accuracy
    stats.accuracy = stats.shotsFired > 0 ? (stats.shotsHit / stats.shotsFired) * 100 : 0

    // Calculate K/D ratio
    stats.killDeathRatio = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills

    // Update rank based on experience
    this.updatePlayerRank(playerId)
  }

  private updatePlayerRank(playerId: string): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    let newLevel = 1
    let newRank = 'Rekrut'

    for (let level = 10; level >= 1; level--) {
      const rankData = this.globalStats.get(`rank_${level}`)
      if (rankData && stats.experience >= rankData.experience) {
        newLevel = level
        newRank = rankData.name
        break
      }
    }

    stats.level = newLevel
    stats.rank = newRank
  }

  private checkAchievements(playerId: string): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    this.achievements.forEach((achievement, achievementId) => {
      if (stats.achievements.includes(achievementId)) return

      let unlocked = false

      switch (achievement.requirement.type) {
        case 'kills':
          if (achievement.requirement.condition === 'single_match') {
            // This would need match-specific tracking
            unlocked = false // TODO: Implement match-specific tracking
          } else {
            unlocked = stats.kills >= achievement.requirement.value
          }
          break

        case 'headshots':
          unlocked = stats.headshots >= achievement.requirement.value
          break

        case 'accuracy':
          if (achievement.requirement.condition === 'single_match') {
            // TODO: Implement match-specific tracking
            unlocked = false
          } else {
            unlocked = stats.accuracy >= achievement.requirement.value
          }
          break

        case 'streak':
          unlocked = stats.longestKillStreak >= achievement.requirement.value
          break

        case 'team':
          unlocked = stats.assists >= achievement.requirement.value
          break
      }

      if (unlocked) {
        this.unlockAchievement(playerId, achievementId)
      }
    })
  }

  private unlockAchievement(playerId: string, achievementId: string): void {
    const stats = this.playerStats.get(playerId)
    const achievement = this.achievements.get(achievementId)
    
    if (!stats || !achievement || stats.achievements.includes(achievementId)) return

    stats.achievements.push(achievementId)
    stats.experience += achievement.reward.experience

    // Apply title reward
    if (achievement.reward.title) {
      // TODO: Implement title system
      console.log(`${stats.playerName} earned title: ${achievement.reward.title}`)
    }

    this.updatePlayerRank(playerId)

    console.log(`Achievement unlocked: ${stats.playerName} - ${achievement.name}`)
  }

  public startMatch(matchId: string, gameMode: string, map: string): void {
    // Reset current kill streaks for all players
    this.playerStats.forEach(stats => {
      stats.currentKillStreak = 0
    })

    console.log(`Match started: ${matchId} - ${gameMode} on ${map}`)
  }

  public endMatch(matchId: string, gameMode: string, winner: string, map: string): void {
    const matchStats: MatchStats = {
      matchId,
      gameMode,
      startTime: Date.now() - 600000, // Assume 10 minute match
      endTime: Date.now(),
      duration: 600000,
      players: new Map(this.playerStats),
      winner,
      teamScores: new Map(), // TODO: Implement team scoring
      map
    }

    this.matchHistory.push(matchStats)
    console.log(`Match ended: ${matchId} - Winner: ${winner}`)
  }

  public getPlayerStats(playerId: string): PlayerStats | null {
    return this.playerStats.get(playerId) || null
  }

  public getLeaderboard(limit: number = 10): PlayerStats[] {
    return Array.from(this.playerStats.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  public getMatchHistory(limit: number = 10): MatchStats[] {
    return this.matchHistory.slice(-limit)
  }

  public getPlayerAchievements(playerId: string): Achievement[] {
    const stats = this.playerStats.get(playerId)
    if (!stats) return []

    return stats.achievements.map(achievementId => 
      this.achievements.get(achievementId)!
    ).filter(Boolean)
  }

  public getAvailableAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  public getGlobalStats(): any {
    const totalPlayers = this.playerStats.size
    const totalKills = Array.from(this.playerStats.values()).reduce((sum, stats) => sum + stats.kills, 0)
    const totalDeaths = Array.from(this.playerStats.values()).reduce((sum, stats) => sum + stats.deaths, 0)
    const totalMatches = this.matchHistory.length

    return {
      totalPlayers,
      totalKills,
      totalDeaths,
      totalMatches,
      averageKDR: totalDeaths > 0 ? totalKills / totalDeaths : 0
    }
  }

  public exportStats(playerId: string): string {
    const stats = this.playerStats.get(playerId)
    if (!stats) return ''

    return JSON.stringify({
      player: stats.playerName,
      rank: stats.rank,
      level: stats.level,
      experience: stats.experience,
      kills: stats.kills,
      deaths: stats.deaths,
      assists: stats.assists,
      score: stats.score,
      accuracy: stats.accuracy.toFixed(1),
      killDeathRatio: stats.killDeathRatio.toFixed(2),
      headshots: stats.headshots,
      longestKillStreak: stats.longestKillStreak,
      achievements: stats.achievements.length,
      weaponsUsed: Object.fromEntries(stats.weaponsUsed)
    }, null, 2)
  }

  public resetPlayerStats(playerId: string): void {
    const stats = this.playerStats.get(playerId)
    if (!stats) return

    // Reset all stats except experience and achievements
    stats.kills = 0
    stats.deaths = 0
    stats.assists = 0
    stats.score = 0
    stats.headshots = 0
    stats.shotsHit = 0
    stats.shotsFired = 0
    stats.damageDealt = 0
    stats.damageTaken = 0
    stats.accuracy = 0
    stats.killDeathRatio = 0
    stats.playTime = 0
    stats.longestKillStreak = 0
    stats.currentKillStreak = 0
    stats.weaponsUsed.clear()

    this.updatePlayerStats(playerId)
  }

  public dispose(): void {
    this.playerStats.clear()
    this.matchHistory = []
    this.achievements.clear()
    this.globalStats.clear()
  }
}