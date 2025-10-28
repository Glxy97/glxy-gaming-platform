// @ts-nocheck
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

/**
 * Optimized Database Connection Management for GLXY Gaming Platform
 * Enhanced Prisma configuration with connection pooling, monitoring, and performance optimizations
 */

// Database URL management with Docker secrets support
function getDatabaseUrl(): string {
  // Try to read from Docker secret file first
  if (process.env.DATABASE_URL_FILE && fs.existsSync(process.env.DATABASE_URL_FILE)) {
    try {
      const dbUrl = fs.readFileSync(process.env.DATABASE_URL_FILE, 'utf8').trim()
      console.log('✅ Using database URL from secret file')
      return dbUrl
    } catch (error) {
      console.error('Failed to read database URL from secret file:', error)
    }
  }

  // Fallback to environment variable
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL or DATABASE_URL_FILE must be provided')
  }

  return dbUrl
}

// Enhanced Prisma configuration for production performance
const createPrismaClient = (): PrismaClient => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  return new PrismaClient({
    // Enhanced logging configuration
    log: [
      ...(isDevelopment ? [
        { emit: 'event' as const, level: 'query' as const },
        { emit: 'event' as const, level: 'info' as const },
        { emit: 'event' as const, level: 'warn' as const },
        { emit: 'event' as const, level: 'error' as const }
      ] : [
        { emit: 'event' as const, level: 'warn' as const },
        { emit: 'event' as const, level: 'error' as const }
      ])
    ],

    // Optimized datasource configuration
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },

    // Error formatting for better debugging
    errorFormat: isDevelopment ? 'pretty' : 'minimal',

    // Transaction configuration for gaming platform
    transactionOptions: {
      maxWait: 5000,        // Maximum time to wait for a transaction slot (5s)
      timeout: 10000,       // Maximum time a transaction can run (10s)
      isolationLevel: 'ReadCommitted' // Optimal for gaming data consistency
    }
  })
}

// Global instance management to prevent connection leaks
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  connectionCount?: number
}

// Connection monitoring
let connectionMetrics = {
  totalQueries: 0,
  slowQueries: 0,
  errorCount: 0,
  lastConnected: new Date(),
  connectionPoolSize: 0
}

// Create optimized Prisma client
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Setup event listeners for performance monitoring
if (!globalForPrisma.prisma) {
  // Query performance monitoring
  // @ts-expect-error - Prisma event types are complex
  prisma.$on('query', (e: any) => {
    connectionMetrics.totalQueries++

    if (e.duration > 1000) { // Queries taking more than 1 second
      connectionMetrics.slowQueries++

      if (process.env.NODE_ENV === 'development') {
        console.warn(`🐌 Slow query detected (${e.duration}ms):`, {
          query: e.query.substring(0, 100) + '...',
          params: e.params,
          duration: e.duration
        })
      }
    }

    // Log extremely slow queries in production
    if (e.duration > 5000) {
      console.error(`🚨 Critical slow query (${e.duration}ms):`, {
        query: e.query.substring(0, 200),
        timestamp: new Date().toISOString()
      })
    }
  })

  // Info level events
  // @ts-expect-error - Prisma event types are complex
  prisma.$on('info', (e: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ Prisma Info:', e.message)
    }
  })

  // Warning level events
  // @ts-expect-error - Prisma event types are complex
  prisma.$on('warn', (e: any) => {
    console.warn('⚠️ Prisma Warning:', e.message)
  })

  // Error level events
  // @ts-expect-error - Prisma event types are complex
  prisma.$on('error', (e: any) => {
    connectionMetrics.errorCount++
    console.error('❌ Prisma Error:', e.message)
  })

  // Store globally in development to prevent re-initialization
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
}

/**
 * Connection Health Monitoring
 */
export class DatabaseConnectionMonitor {

  static async checkHealth(): Promise<{
    isHealthy: boolean
    metrics: typeof connectionMetrics & { connectionTime?: number }
    connectionTest: boolean
    poolInfo?: any
  }> {
    try {
      // Test basic connectivity
      const startTime = Date.now()
      await prisma.$executeRaw`SELECT 1`
      const connectionTime = Date.now() - startTime

      // Get connection pool information
      const poolInfo = await this.getPoolInformation()

      return {
        isHealthy: connectionTime < 100 && connectionMetrics.errorCount < 10,
        metrics: {
          totalQueries: connectionMetrics.totalQueries,
          slowQueries: connectionMetrics.slowQueries,
          errorCount: connectionMetrics.errorCount,
          lastConnected: connectionMetrics.lastConnected,
          connectionPoolSize: connectionMetrics.connectionPoolSize,
          connectionTime
        },
        connectionTest: true,
        poolInfo
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      return {
        isHealthy: false,
        metrics: connectionMetrics,
        connectionTest: false
      }
    }
  }

  static async getPoolInformation() {
    try {
      const result = await prisma.$queryRaw<Array<{
        total_connections: bigint
        active_connections: bigint
        idle_connections: bigint
        max_connections: number
      }>>`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          setting::int as max_connections
        FROM pg_stat_activity, pg_settings
        WHERE datname = current_database()
          AND name = 'max_connections'
        GROUP BY setting
      `

      const stats = result[0]
      return {
        total: Number(stats.total_connections),
        active: Number(stats.active_connections),
        idle: Number(stats.idle_connections),
        maxConnections: stats.max_connections,
        utilizationPercent: (Number(stats.total_connections) / stats.max_connections) * 100
      }
    } catch (error) {
      console.error('Failed to get pool information:', error)
      return null
    }
  }

  static getMetrics() {
    return connectionMetrics
  }

  static resetMetrics() {
    connectionMetrics = {
      totalQueries: 0,
      slowQueries: 0,
      errorCount: 0,
      lastConnected: new Date(),
      connectionPoolSize: 0
    }
  }
}

/**
 * Gaming-specific database utilities
 */
export class GamingDatabaseUtils {

  /**
   * Optimized leaderboard query with pagination
   */
  static async getGameLeaderboard(
    gameType: string,
    limit: number = 50,
    offset: number = 0,
    sortBy: 'rating' | 'wins' | 'games_played' = 'rating'
  ) {
    const orderBy = {
      rating: { rating: 'desc' as const },
      wins: { gamesWon: 'desc' as const },
      games_played: { gamesPlayed: 'desc' as const }
    }[sortBy]

    // TODO: Implement proper GameStats model with all required fields
    // For now, return empty array as placeholder
    return []
  }

  /**
   * Optimized user stats aggregation
   */
  static async getUserStatsAggregated(userId: string) {
    // TODO: Implement proper GameStats model with all required fields
    // For now, return empty array as placeholder
    return []
  }

  /**
   * Efficient room listing with player counts
   */
  static async getActiveRooms(gameType?: string, limit: number = 20) {
    return await prisma.gameRoom.findMany({
      where: {
        status: { in: ['waiting', 'playing'] },
        ...(gameType && { gameType })
      },
      select: {
        id: true,
        name: true,
        gameType: true,
        status: true,
        maxPlayers: true,
        isPublic: true,
        createdAt: true,
        host: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            players: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  /**
   * Batch update game statistics (for performance)
   */
  static async updateGameStatsBatch(updates: Array<{
    userId: string
    gameType: string
    result: 'win' | 'loss' | 'draw'
    rating?: number
    gameTime?: number
    score?: number
  }>) {
    // TODO: Implement proper GameStats model with all required fields
    // For now, return empty array as placeholder
    return []
  }
}

/**
 * Enhanced error handling for database operations
 */
export class DatabaseErrorHandler {

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        // Check if error is retryable
        if (this.isRetryableError(error) && attempt < maxRetries) {
          console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
          continue
        }

        throw error
      }
    }

    throw lastError!
  }

  private static isRetryableError(error: any): boolean {
    const retryableErrors = [
      'P2024', // Timed out fetching a new connection from the connection pool
      'P2034', // Transaction failed due to a write conflict or a deadlock
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ]

    const errorCode = error?.code || error?.message
    return retryableErrors.some(code =>
      errorCode && errorCode.toString().includes(code)
    )
  }
}

/**
 * Graceful shutdown handling
 */
export async function gracefulDatabaseShutdown(): Promise<void> {
  console.log('📤 Gracefully shutting down database connections...')

  try {
    await prisma.$disconnect()
    console.log('✅ Database connections closed successfully')
  } catch (error) {
    console.error('❌ Error during database shutdown:', error)
  }
}

// Setup graceful shutdown handlers (only in Node.js runtime, not Edge)
// Edge Runtime doesn't support process.on, so we check for its availability
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('SIGINT', gracefulDatabaseShutdown)
  process.on('SIGTERM', gracefulDatabaseShutdown)

  // Cleanup on unexpected exit
  process.on('beforeExit', (code) => {
    if (code !== 0) {
      console.log('🔄 Unexpected exit detected, cleaning up database connections...')
      gracefulDatabaseShutdown()
    }
  })
}

export default prisma
