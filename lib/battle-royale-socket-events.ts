// @ts-nocheck
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import getServerSession from 'next-auth';
import { auth } from '@/lib/auth';

export interface BattleRoyaleSocketData {
  userId: string;
  matchId?: string;
  username?: string;
  level?: number;
  avatar?: string;
  isAuthenticated: boolean;
}

export class BattleRoyaleSocketHandler {
  private io: SocketIOServer;
  private matches: Map<string, Set<string>> = new Map(); // matchId -> Set of socketIds
  private playerSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.of('/battle-royale').use(this.authenticateSocket.bind(this));
    this.io.of('/battle-royale').on('connection', this.handleConnection.bind(this));
  }

  private async authenticateSocket(socket: Socket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token with NextAuth session
      const session = await this.verifyToken(token);
      if (!session?.user?.id) {
        return next(new Error('Invalid authentication token'));
      }

      const userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          username: true,
          level: true,
          avatar: true,
        },
      });

      if (!userData) {
        return next(new Error('User not found'));
      }

      socket.data = {
        userId: userData.id,
        username: userData.username,
        level: userData.level,
        avatar: userData.avatar,
        isAuthenticated: true,
      } as BattleRoyaleSocketData;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  private async verifyToken(token: string) {
    // This would typically verify a JWT token
    // For now, we'll use a simplified approach
    try {
      // In production, implement proper JWT verification
      return { user: { id: token } }; // Simplified for development
    } catch (error) {
      return null;
    }
  }

  private async handleConnection(socket: Socket) {
    const socketData = socket.data as BattleRoyaleSocketData;
    console.log(`Battle Royale client connected: ${socketData.username} (${socketData.userId})`);

    // Track player socket
    this.playerSockets.set(socketData.userId, socket.id);

    // Setup event listeners for this socket
    this.setupSocketEventListeners(socket);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Battle Royale server',
      user: {
        id: socketData.userId,
        username: socketData.username,
        level: socketData.level,
        avatar: socketData.avatar,
      },
    });

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnection(socket));
  }

  private setupSocketEventListeners(socket: Socket) {
    const socketData = socket.data as BattleRoyaleSocketData;

    // Match-related events
    socket.on('join_match', (data) => this.handleJoinMatch(socket, data));
    socket.on('leave_match', (data) => this.handleLeaveMatch(socket, data));
    socket.on('match_list', () => this.handleMatchList(socket));

    // In-game events
    socket.on('player_position', (data) => this.handlePlayerPosition(socket, data));
    socket.on('player_action', (data) => this.handlePlayerAction(socket, data));
    socket.on('chat_message', (data) => this.handleChatMessage(socket, data));

    // Matchmaking events
    socket.on('join_queue', (data) => this.handleJoinQueue(socket, data));
    socket.on('leave_queue', () => this.handleLeaveQueue(socket));

    // Spectator events
    socket.on('spectate_match', (data) => this.handleSpectateMatch(socket, data));
    socket.on('stop_spectating', () => this.handleStopSpectating(socket));
  }

  private async handleJoinMatch(socket: Socket, data: { matchCode: string }) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;

      // Validate match code and check if user can join
      const match = await prisma.battleRoyaleMatch.findUnique({
        where: { matchCode: data.matchCode.toUpperCase() },
        include: {
          players: {
            include: {
              user: {
                select: { id: true, username: true, level: true, avatar: true },
              },
            },
          },
        },
      });

      if (!match) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }

      if (match.status !== 'WAITING' && match.status !== 'STARTING') {
        socket.emit('error', { message: 'Match is not accepting players' });
        return;
      }

      // Check if player is already in match
      const existingPlayer = match.players.find(p => p.userId === socketData.userId);
      if (!existingPlayer) {
        socket.emit('error', { message: 'Not joined in this match' });
        return;
      }

      // Join socket room for this match
      const roomName = `match:${match.id}`;
      socket.join(roomName);

      // Track player in match
      if (!this.matches.has(match.id)) {
        this.matches.set(match.id, new Set());
      }
      this.matches.get(match.id)!.add(socket.id);

      // Update socket data with current match
      socketData.matchId = match.id;

      // Send match data to player
      socket.emit('match_joined', {
        match: {
          id: match.id,
          matchCode: match.matchCode,
          gameMode: match.gameMode,
          mapName: match.mapName,
          status: match.status,
          maxPlayers: match.maxPlayers,
          currentPlayers: match.currentPlayers,
          alivePlayers: match.alivePlayers,
          settings: match.settings,
        },
        players: match.players.map(p => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          level: p.user.level,
          avatar: p.user.avatar,
          status: p.status,
          health: p.health,
          shield: p.shield,
          positionX: p.positionX,
          positionY: p.positionY,
          positionZ: p.positionZ,
          kills: p.kills,
          assists: p.assists,
        })),
      });

      // Notify other players
      socket.to(roomName).emit('player_connected', {
        player: {
          id: socketData.userId,
          username: socketData.username,
          level: socketData.level,
          avatar: socketData.avatar,
        },
      });

    } catch (error) {
      console.error('Error handling join match:', error);
      socket.emit('error', { message: 'Failed to join match' });
    }
  }

  private async handleLeaveMatch(socket: Socket, data: { matchId?: string }) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;
      const matchId = data.matchId || socketData.matchId;

      if (!matchId) {
        socket.emit('error', { message: 'Not in a match' });
        return;
      }

      const roomName = `match:${matchId}`;
      socket.leave(roomName);

      // Remove player from match tracking
      if (this.matches.has(matchId)) {
        this.matches.get(matchId)!.delete(socket.id);
        if (this.matches.get(matchId)!.size === 0) {
          this.matches.delete(matchId);
        }
      }

      // Update socket data
      socketData.matchId = undefined;

      // Notify other players
      socket.to(roomName).emit('player_disconnected', {
        userId: socketData.userId,
      });

      socket.emit('match_left', { message: 'Left match successfully' });

    } catch (error) {
      console.error('Error handling leave match:', error);
      socket.emit('error', { message: 'Failed to leave match' });
    }
  }

  private async handleMatchList(socket: Socket) {
    try {
      const matches = await prisma.battleRoyaleMatch.findMany({
        where: {
          status: { in: ['WAITING', 'STARTING'] },
        },
        include: {
          host: {
            select: { id: true, username: true, level: true, avatar: true },
          },
          _count: {
            select: { players: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      socket.emit('match_list', {
        matches: matches.map(match => ({
          id: match.id,
          matchCode: match.matchCode,
          gameMode: match.gameMode,
          mapName: match.mapName,
          status: match.status,
          maxPlayers: match.maxPlayers,
          currentPlayers: match._count.players,
          host: match.host,
          createdAt: match.createdAt,
        })),
      });

    } catch (error) {
      console.error('Error handling match list:', error);
      socket.emit('error', { message: 'Failed to fetch match list' });
    }
  }

  private async handlePlayerPosition(socket: Socket, data: {
    positionX: number;
    positionY: number;
    positionZ: number;
    rotation: number;
  }) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;

      if (!socketData.matchId) {
        return; // Not in a match
      }

      // Update player position in database
      await prisma.battleRoyalePlayer.updateMany({
        where: {
          matchId: socketData.matchId,
          userId: socketData.userId,
          status: 'ALIVE',
        },
        data: {
          positionX: data.positionX,
          positionY: data.positionY,
          positionZ: data.positionZ,
          rotation: data.rotation,
        },
      });

      // Broadcast position to other players in the match
      socket.to(`match:${socketData.matchId}`).emit('player_position_update', {
        playerId: socketData.userId,
        positionX: data.positionX,
        positionY: data.positionY,
        positionZ: data.positionZ,
        rotation: data.rotation,
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error('Error handling player position:', error);
    }
  }

  private async handlePlayerAction(socket: Socket, data: {
    action: string;
    [key: string]: any;
  }) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;

      if (!socketData.matchId) {
        return; // Not in a match
      }

      // Process the action based on type
      switch (data.action) {
        case 'shoot':
          await this.handleShootAction(socket, data);
          break;
        case 'pickup_item':
          await this.handlePickupItemAction(socket, data);
          break;
        case 'use_item':
          await this.handleUseItemAction(socket, data);
          break;
        case 'vehicle_action':
          await this.handleVehicleAction(socket, data);
          break;
        default:
          console.warn(`Unknown player action: ${data.action}`);
      }

    } catch (error) {
      console.error('Error handling player action:', error);
      socket.emit('error', { message: 'Failed to process action' });
    }
  }

  private async handleShootAction(socket: Socket, data: any) {
    const socketData = socket.data as BattleRoyaleSocketData;

    // Broadcast shot to all players in match
    this.io.to(`match:${socketData.matchId}`).emit('shot_fired', {
      playerId: socketData.userId,
      weaponId: data.weaponId,
      targetX: data.targetX,
      targetY: data.targetY,
      targetZ: data.targetZ,
      hit: data.hit,
      damage: data.damage,
      targetPlayerId: data.targetPlayerId,
    });
  }

  private async handlePickupItemAction(socket: Socket, data: any) {
    const socketData = socket.data as BattleRoyaleSocketData;

    // Broadcast item pickup
    this.io.to(`match:${socketData.matchId}`).emit('item_picked_up', {
      playerId: socketData.userId,
      itemType: data.itemType,
      itemId: data.itemId,
      quantity: data.quantity,
      lootSpawnId: data.lootSpawnId,
    });
  }

  private async handleUseItemAction(socket: Socket, data: any) {
    const socketData = socket.data as BattleRoyaleSocketData;

    // Broadcast item usage
    this.io.to(`match:${socketData.matchId}`).emit('item_used', {
      playerId: socketData.userId,
      itemType: data.itemType,
      itemId: data.itemId,
      result: data.result,
    });
  }

  private async handleVehicleAction(socket: Socket, data: any) {
    const socketData = socket.data as BattleRoyaleSocketData;

    // Broadcast vehicle action
    this.io.to(`match:${socketData.matchId}`).emit('vehicle_action', {
      playerId: socketData.userId,
      vehicleId: data.vehicleId,
      action: data.action,
      result: data.result,
    });
  }

  private async handleChatMessage(socket: Socket, data: {
    message: string;
    type: 'match' | 'global';
  }) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;

      if (data.type === 'match' && socketData.matchId) {
        // Match chat
        this.io.to(`match:${socketData.matchId}`).emit('chat_message', {
          userId: socketData.userId,
          username: socketData.username,
          message: data.message,
          type: 'match',
          timestamp: Date.now(),
        });
      } else if (data.type === 'global') {
        // Global chat (could be implemented later)
        this.io.of('/battle-royale').emit('chat_message', {
          userId: socketData.userId,
          username: socketData.username,
          message: data.message,
          type: 'global',
          timestamp: Date.now(),
        });
      }

    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }

  private async handleJoinQueue(socket: Socket, data: {
    gameMode: string;
    preferences?: any;
  }) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;

      // Add user to matchmaking queue
      await redis.sadd('br:matchmaking:queue', JSON.stringify({
        userId: socketData.userId,
        username: socketData.username,
        level: socketData.level,
        gameMode: data.gameMode,
        preferences: data.preferences || {},
        timestamp: Date.now(),
      }));

      socket.emit('queue_joined', {
        gameMode: data.gameMode,
        queueSize: await redis.scard('br:matchmaking:queue'),
      });

      // Notify matchmaking service
      await redis.publish('br:matchmaking', JSON.stringify({
        type: 'player_joined_queue',
        player: {
          userId: socketData.userId,
          username: socketData.username,
          level: socketData.level,
          gameMode: data.gameMode,
        },
      }));

    } catch (error) {
      console.error('Error handling join queue:', error);
      socket.emit('error', { message: 'Failed to join queue' });
    }
  }

  private async handleLeaveQueue(socket: Socket) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;

      // Remove user from queue
      const queueItems = await redis.smembers('br:matchmaking:queue');
      const userQueueItems = queueItems.filter((item: string) => {
        const parsed = JSON.parse(item);
        return parsed.userId === socketData.userId;
      });

      if (userQueueItems.length > 0) {
        await redis.srem('br:matchmaking:queue', ...userQueueItems);
      }

      socket.emit('queue_left', {
        message: 'Left matchmaking queue',
      });

    } catch (error) {
      console.error('Error handling leave queue:', error);
      socket.emit('error', { message: 'Failed to leave queue' });
    }
  }

  private async handleSpectateMatch(socket: Socket, data: { matchCode: string }) {
    try {
      const socketData = socket.data as BattleRoyaleSocketData;

      // Find match
      const match = await prisma.battleRoyaleMatch.findUnique({
        where: { matchCode: data.matchCode.toUpperCase() },
        include: {
          players: {
            include: {
              user: {
                select: { id: true, username: true, level: true, avatar: true },
              },
            },
          },
        },
      });

      if (!match) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }

      if (match.status !== 'IN_PROGRESS') {
        socket.emit('error', { message: 'Match is not in progress' });
        return;
      }

      // Join spectator room
      const roomName = `spectate:${match.id}`;
      socket.join(roomName);

      // Send current match state to spectator
      socket.emit('spectating_match', {
        match: {
          id: match.id,
          matchCode: match.matchCode,
          gameMode: match.gameMode,
          mapName: match.mapName,
          status: match.status,
          alivePlayers: match.alivePlayers,
          zoneCenterX: match.zoneCenterX,
          zoneCenterY: match.zoneCenterY,
          zoneRadius: match.zoneRadius,
          zoneDamage: match.zoneDamage,
        },
        players: match.players.map(p => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          level: p.user.level,
          avatar: p.user.avatar,
          status: p.status,
          health: p.health,
          shield: p.shield,
          positionX: p.positionX,
          positionY: p.positionY,
          positionZ: p.positionZ,
          kills: p.kills,
          assists: p.assists,
        })),
      });

    } catch (error) {
      console.error('Error handling spectate match:', error);
      socket.emit('error', { message: 'Failed to spectate match' });
    }
  }

  private async handleStopSpectating(socket: Socket) {
    try {
      // Leave all spectate rooms
      const rooms = Array.from(socket.rooms).filter(room => room.startsWith('spectate:'));
      rooms.forEach(room => socket.leave(room));

      socket.emit('stopped_spectating', {
        message: 'Stopped spectating',
      });

    } catch (error) {
      console.error('Error handling stop spectating:', error);
    }
  }

  private async handleDisconnection(socket: Socket) {
    const socketData = socket.data as BattleRoyaleSocketData;
    console.log(`Battle Royale client disconnected: ${socketData.username} (${socketData.userId})`);

    // Remove from player tracking
    this.playerSockets.delete(socketData.userId);

    // Handle leaving match if player was in one
    if (socketData.matchId) {
      await this.handleLeaveMatch(socket, { matchId: socketData.matchId });
    }

    // Remove from matchmaking queue
    try {
      const queueItems = await redis.smembers('br:matchmaking:queue');
      const userQueueItems = queueItems.filter((item: string) => {
        const parsed = JSON.parse(item);
        return parsed.userId === socketData.userId;
      });

      if (userQueueItems.length > 0) {
        await redis.srem('br:matchmaking:queue', ...userQueueItems);
      }
    } catch (error) {
      console.error('Error removing from queue on disconnect:', error);
    }
  }

  // Public methods for external services
  public async broadcastToMatch(matchId: string, event: string, data: any) {
    this.io.to(`match:${matchId}`).emit(event, data);
  }

  public async broadcastToSpectators(matchId: string, event: string, data: any) {
    this.io.to(`spectate:${matchId}`).emit(event, data);
  }

  public async sendToUser(userId: string, event: string, data: any) {
    const socketId = this.playerSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public getMatchPlayerCount(matchId: string): number {
    return this.matches.get(matchId)?.size || 0;
  }

  public isUserOnline(userId: string): boolean {
    return this.playerSockets.has(userId);
  }

  public getConnectedPlayerCount(): number {
    return this.playerSockets.size;
  }
}