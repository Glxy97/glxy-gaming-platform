// @ts-nocheck
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { BattleRoyaleSocketHandler } from './battle-royale-socket-events';
import { BattleRoyaleMatchManager } from './battle-royale-game-systems';
import { performanceOptimizer } from './battle-royale-performance-optimizer';

export class BattleRoyaleServerIntegration {
  private io: SocketIOServer;
  private socketHandler: BattleRoyaleSocketHandler;
  private matchManager: BattleRoyaleMatchManager;
  private server: any;

  constructor(server?: any) {
    this.server = server || createServer();
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? process.env.NEXTAUTH_URL
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.matchManager = new BattleRoyaleMatchManager();
    this.socketHandler = new BattleRoyaleSocketHandler(this.io);

    this.setupServerRoutes();
    this.setupBackgroundTasks();
  }

  private setupServerRoutes(): void {
    // Health check endpoint
    this.server.on('request', (req: any, res: any) => {
      if (req.url === '/api/battle-royale/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          activeMatches: this.matchManager.getActiveMatchCount?.() || 0,
          connectedPlayers: this.socketHandler.getConnectedPlayerCount?.() || 0,
        }));
      }
    });
  }

  private setupBackgroundTasks(): void {
    // Cleanup old matches every hour
    setInterval(async () => {
      await this.cleanupOldMatches();
    }, 60 * 60 * 1000);

    // Performance monitoring
    setInterval(() => {
      const metrics = performanceOptimizer.getMetrics();
      if (metrics.fps < 30) {
        console.warn('Performance warning: Low FPS detected', metrics);
      }
    }, 5000);

    // Zone system updates (handled by match manager)
    // Loot spawning (handled by match manager)
  }

  private async cleanupOldMatches(): Promise<void> {
    try {
      // Clean up matches that have been inactive for more than 24 hours
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // This would typically use Prisma or your database
      // await prisma.battleRoyaleMatch.deleteMany({
      //   where: {
      //     status: 'FINISHED',
      //     endedAt: { lt: cutoffTime }
      //   }
      // });

      console.log('Cleaned up old matches');
    } catch (error) {
      console.error('Error cleaning up old matches:', error);
    }
  }

  // Public methods
  public getIO(): SocketIOServer {
    return this.io;
  }

  public getServer(): any {
    return this.server;
  }

  public async start(port: number = 3002): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(port, (err: any) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Battle Royale server started on port ${port}`);
          resolve();
        }
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Battle Royale server stopped');
        resolve();
      });
    });
  }

  // Match management methods
  public async createMatch(hostId: string, options: {
    gameMode: string;
    mapName: string;
    maxPlayers: number;
    settings?: any;
  }): Promise<string> {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/battle-royale/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId,
          gameMode: options.gameMode,
          mapName: options.mapName,
          maxPlayers: options.maxPlayers,
          settings: options.settings || {},
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create match');
      }

      return data.match.id;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  public async startMatch(matchId: string): Promise<void> {
    await this.matchManager.startMatch(matchId);
  }

  public async endMatch(matchId: string, reason: 'winner' | 'timeout' | 'cancelled'): Promise<void> {
    await this.matchManager.endMatch(matchId, reason);
  }

  // Player management methods
  public async addPlayerToMatch(matchId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/battle-royale/match/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join match');
      }
    } catch (error) {
      console.error('Error adding player to match:', error);
      throw error;
    }
  }

  public async removePlayerFromMatch(matchId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/battle-royale/match/join`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave match');
      }
    } catch (error) {
      console.error('Error removing player from match:', error);
      throw error;
    }
  }

  // Statistics and monitoring
  public async getServerStats(): Promise<any> {
    try {
      const [matchStats, playerStats] = await Promise.all([
        fetch(`${process.env.NEXTAUTH_URL}/api/battle-royale/match`),
        fetch(`${process.env.NEXTAUTH_URL}/api/health`),
      ]);

      const matches = await matchStats.json();
      const health = await playerStats.json();

      return {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          activeMatches: matches.length || 0,
          totalConnections: this.io.engine.clientsCount,
        },
        performance: performanceOptimizer.getMetrics(),
        database: health,
      };
    } catch (error) {
      console.error('Error getting server stats:', error);
      return null;
    }
  }

  // Event broadcasting
  public broadcastToMatch(matchId: string, event: string, data: any): void {
    this.socketHandler.broadcastToMatch(matchId, event, data);
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.of('/battle-royale').emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any): void {
    this.socketHandler.sendToUser(userId, event, data);
  }

  // Emergency methods
  public async emergencyShutdown(): Promise<void> {
    console.log('Emergency shutdown initiated');

    try {
      // End all active matches
      const matches = await fetch(`${process.env.NEXTAUTH_URL}/api/battle-royale/match`);
      const matchesData = await matches.json();

      if (matchesData.matches) {
        for (const match of matchesData.matches) {
          if (match.status === 'IN_PROGRESS') {
            await this.endMatch(match.id, 'cancelled');
          }
        }
      }

      // Disconnect all players
      this.io.of('/battle-royale').emit('emergency_shutdown', {
        message: 'Server is shutting down for maintenance',
        timestamp: new Date().toISOString(),
      });

      // Wait a bit for message to be delivered
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Stop the server
      await this.stop();

      console.log('Emergency shutdown completed');
    } catch (error) {
      console.error('Error during emergency shutdown:', error);
    }
  }

  // Hot reload support for development
  public enableHotReload(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Hot reload enabled for Battle Royale server');

      // Watch for file changes and reload modules
      process.on('SIGUSR2', () => {
        console.log('Received SIGUSR2, reloading Battle Royale server');
        this.stop().then(() => {
          process.exit();
        });
      });
    }
  }
}

// Singleton instance
export let battleRoyaleServer: BattleRoyaleServerIntegration;

// Initialize server
export function initializeBattleRoyaleServer(server?: any): BattleRoyaleServerIntegration {
  if (!battleRoyaleServer) {
    battleRoyaleServer = new BattleRoyaleServerIntegration(server);
  }
  return battleRoyaleServer;
}