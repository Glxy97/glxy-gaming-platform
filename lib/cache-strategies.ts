import { CacheManager, CACHE_KEYS, CACHE_TTL } from './redis-server'

export interface CacheStrategy {
  name: string
  description: string
  ttl: number
  refreshInterval?: number
  staleWhileRevalidate?: boolean
}

export const CACHE_STRATEGIES = {
  // Gaming-specific strategies
  LEADERBOARD: {
    name: 'leaderboard',
    description: 'High-frequency read, moderate write leaderboard data',
    ttl: CACHE_TTL.MEDIUM,
    refreshInterval: 5 * 60, // 5 minutes
    staleWhileRevalidate: true
  },

  USER_PROFILE: {
    name: 'user-profile',
    description: 'User profile data with moderate updates',
    ttl: CACHE_TTL.LONG,
    refreshInterval: 30 * 60, // 30 minutes
    staleWhileRevalidate: false
  },

  GAME_STATE: {
    name: 'game-state',
    description: 'Real-time game state with frequent updates',
    ttl: CACHE_TTL.SHORT,
    refreshInterval: 30, // 30 seconds
    staleWhileRevalidate: true
  },

  STATIC_CONTENT: {
    name: 'static-content',
    description: 'Theme presets, achievements, configs',
    ttl: CACHE_TTL.DAY,
    refreshInterval: CACHE_TTL.DAY,
    staleWhileRevalidate: false
  },

  SESSION_DATA: {
    name: 'session-data',
    description: 'User session and authentication data',
    ttl: CACHE_TTL.LONG,
    refreshInterval: 60 * 60, // 1 hour
    staleWhileRevalidate: false
  }
} as const

export class CacheStrategyManager {

  // Cache warming strategies
  static async warmCriticalData(): Promise<void> {
    console.log('🔥 Starting cache warming for critical data...')

    try {
      await Promise.all([
        this.warmLeaderboards(),
        this.warmStaticContent(),
        this.warmActiveRooms()
      ])

      console.log('✅ Cache warming completed successfully')
    } catch (error) {
      console.error('❌ Cache warming failed:', error)
    }
  }

  private static async warmLeaderboards(): Promise<void> {
    const gameTypes = ['chess', 'checkers', 'reversi', 'connect4']

    for (const gameType of gameTypes) {
      const cacheKey = CACHE_KEYS.LEADERBOARD(gameType)
      const exists = await CacheManager.exists(cacheKey)

      if (!exists) {
        // Placeholder data for warming - in production, fetch from DB
        const leaderboardData = await this.fetchLeaderboardData(gameType)
        await CacheManager.set(cacheKey, leaderboardData, CACHE_TTL.MEDIUM)
        console.log(`🏆 Warmed leaderboard cache for: ${gameType}`)
      }
    }
  }

  private static async warmStaticContent(): Promise<void> {
    const staticKeys = [
      CACHE_KEYS.FEATURE_FLAGS,
      'theme:presets:all',
      'achievements:config',
      'game:rules:all'
    ]

    for (const key of staticKeys) {
      const exists = await CacheManager.exists(key)

      if (!exists) {
        const data = await this.fetchStaticContent(key)
        await CacheManager.set(key, data, CACHE_TTL.DAY)
        console.log(`📋 Warmed static content cache: ${key}`)
      }
    }
  }

  private static async warmActiveRooms(): Promise<void> {
    const gameTypes = ['chess', 'checkers', 'reversi', 'connect4']

    for (const gameType of gameTypes) {
      const cacheKey = CACHE_KEYS.GAME_ROOMS_LIST(gameType)
      const exists = await CacheManager.exists(cacheKey)

      if (!exists) {
        const roomsData = await this.fetchActiveRooms(gameType)
        await CacheManager.set(cacheKey, roomsData, CACHE_TTL.SHORT)
        console.log(`🎮 Warmed active rooms cache for: ${gameType}`)
      }
    }
  }

  // Intelligent cache invalidation
  static async invalidateUserRelatedData(userId: string): Promise<number> {
    const patterns = [
      CACHE_KEYS.USER_PROFILE(userId),
      CACHE_KEYS.USER_STATS(userId),
      CACHE_KEYS.USER_PERMISSIONS(userId),
      CACHE_KEYS.ACHIEVEMENTS(userId),
      CACHE_KEYS.USER_STATUS(userId)
    ]

    let invalidatedCount = 0
    for (const pattern of patterns) {
      const success = await CacheManager.del(pattern)
      if (success) invalidatedCount++
    }

    console.log(`🗑️ Invalidated ${invalidatedCount} user-related cache entries for user: ${userId}`)
    return invalidatedCount
  }

  static async invalidateGameRelatedData(gameType: string, roomId?: string): Promise<number> {
    const patterns = [
      CACHE_KEYS.LEADERBOARD(gameType),
      CACHE_KEYS.GAME_ROOMS_LIST(gameType),
      CACHE_KEYS.GAME_CONFIG(gameType)
    ]

    if (roomId) {
      patterns.push(
        CACHE_KEYS.GAME_ROOM(roomId),
        CACHE_KEYS.GAME_STATE(roomId),
        CACHE_KEYS.GAME_MOVES(roomId),
        CACHE_KEYS.CHAT_HISTORY(roomId),
        CACHE_KEYS.ROOM_PRESENCE(roomId)
      )
    }

    let invalidatedCount = 0
    for (const pattern of patterns) {
      const success = await CacheManager.del(pattern)
      if (success) invalidatedCount++
    }

    console.log(`🎯 Invalidated ${invalidatedCount} game-related cache entries for: ${gameType}${roomId ? ` (room: ${roomId})` : ''}`)
    return invalidatedCount
  }

  // Cache analytics and monitoring
  static async getCacheStatistics(): Promise<any> {
    try {
      const stats = {
        totalKeys: 0,
        keysByPattern: {} as Record<string, number>,
        hitRates: {} as Record<string, number>,
        memorUsage: 0,
        uptime: 0
      }

      // Get total key count
      const allKeys = await CacheManager.redis.keys('*')
      stats.totalKeys = allKeys.length

      // Analyze key patterns
      const patterns = ['user:', 'room:', 'game:', 'leaderboard:', 'cache:', 'session:']
      for (const pattern of patterns) {
        const keys = await CacheManager.redis.keys(`*${pattern}*`)
        stats.keysByPattern[pattern] = keys.length
      }

      // Get Redis info
      const info = await CacheManager.redis.info('memory')
      const memoryMatch = info.match(/used_memory:(\d+)/)
      if (memoryMatch) {
        stats.memorUsage = parseInt(memoryMatch[1])
      }

      return stats
    } catch (error) {
      console.error('Error getting cache statistics:', error)
      return null
    }
  }

  static async getEndpointCacheMetrics(endpoint: string): Promise<any> {
    try {
      const hitKey = CACHE_KEYS.API_METRICS(`${endpoint}:hit`)
      const missKey = CACHE_KEYS.API_METRICS(`${endpoint}:miss`)
      const writeKey = CACHE_KEYS.API_METRICS(`${endpoint}:write`)

      const [hitsResult, missesResult, writesResult] = await Promise.all([
        CacheManager.get<number>(hitKey),
        CacheManager.get<number>(missKey),
        CacheManager.get<number>(writeKey)
      ])

      const hits = hitsResult ?? 0
      const misses = missesResult ?? 0
      const writes = writesResult ?? 0

      const total = hits + misses
      const hitRate = total > 0 ? (hits / total) * 100 : 0

      return {
        endpoint,
        hits,
        misses,
        writes,
        total,
        hitRate: Math.round(hitRate * 100) / 100
      }
    } catch (error) {
      console.error('Error getting endpoint cache metrics:', error)
      return null
    }
  }

  // Background cache maintenance
  static async performMaintenance(): Promise<void> {
    console.log('🔧 Starting cache maintenance...')

    try {
      await Promise.all([
        this.cleanupExpiredKeys(),
        this.optimizeMemoryUsage(),
        this.updateCacheStats()
      ])

      console.log('✅ Cache maintenance completed')
    } catch (error) {
      console.error('❌ Cache maintenance failed:', error)
    }
  }

  private static async cleanupExpiredKeys(): Promise<void> {
    // Redis handles TTL automatically, but we can clean up orphaned data
    // Note: CacheManager is a mock implementation, this is a placeholder
    console.log('🧹 Cache cleanup - skipped (mock implementation)')
  }

  private static async optimizeMemoryUsage(): Promise<void> {
    // Memory optimization is handled by Redis/CacheManager
    // Note: CacheManager is a mock implementation, this is a placeholder
    console.log('💾 Memory optimization - skipped (mock implementation)')
  }

  private static async updateCacheStats(): Promise<void> {
    const stats = await this.getCacheStatistics()

    if (stats) {
      await CacheManager.set(CACHE_KEYS.CACHE_STATS, stats, CACHE_TTL.MEDIUM)
      console.log(`📊 Updated cache statistics: ${stats.totalKeys} total keys`)
    }
  }

  // Helper methods for cache warming (placeholders)
  private static async fetchLeaderboardData(gameType: string): Promise<any> {
    // In production, this would fetch from database
    return {
      gameType,
      players: [],
      lastUpdate: new Date().toISOString()
    }
  }

  private static async fetchStaticContent(key: string): Promise<any> {
    // In production, this would fetch from database or external APIs
    return {
      key,
      data: {},
      version: '1.0',
      lastUpdate: new Date().toISOString()
    }
  }

  private static async fetchActiveRooms(gameType: string): Promise<any> {
    // In production, this would fetch from database
    return {
      gameType,
      rooms: [],
      total: 0,
      lastUpdate: new Date().toISOString()
    }
  }
}

// Scheduled cache maintenance
export class CacheScheduler {
  private static intervals: NodeJS.Timeout[] = []

  static startScheduledTasks(): void {
    console.log('⏰ Starting cache scheduled tasks...')

    // Cache warming every hour
    const warmingInterval = setInterval(() => {
      CacheStrategyManager.warmCriticalData()
    }, 60 * 60 * 1000) // 1 hour

    // Cache maintenance every 6 hours
    const maintenanceInterval = setInterval(() => {
      CacheStrategyManager.performMaintenance()
    }, 6 * 60 * 60 * 1000) // 6 hours

    // Cache statistics update every 15 minutes
    const statsInterval = setInterval(async () => {
      const stats = await CacheStrategyManager.getCacheStatistics()
      if (stats) {
        await CacheManager.set(CACHE_KEYS.CACHE_STATS, stats, CACHE_TTL.MEDIUM)
      }
    }, 15 * 60 * 1000) // 15 minutes

    this.intervals = [warmingInterval, maintenanceInterval, statsInterval]
  }

  static stopScheduledTasks(): void {
    console.log('⏹️ Stopping cache scheduled tasks...')
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
  }
}

// Export commonly used functions
export const warmCache = CacheStrategyManager.warmCriticalData
export const invalidateUserCache = CacheStrategyManager.invalidateUserRelatedData
export const invalidateGameCache = CacheStrategyManager.invalidateGameRelatedData
export const getCacheStats = CacheStrategyManager.getCacheStatistics