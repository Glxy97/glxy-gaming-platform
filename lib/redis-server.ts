import Redis from 'ioredis'

// Detect build phase to avoid noisy Redis connects during next build
const NEXT_PHASE = process.env.NEXT_PHASE || ''
const IS_BUILD_PHASE = NEXT_PHASE.includes('build') || process.env.SKIP_REDIS === 'true' || process.env.DISABLE_REDIS === 'true'

// Redis configuration
let REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const REDIS_PASSWORD = process.env.REDIS_PASSWORD

// Read Redis URL from Docker secret file if available (server-side only)
if (process.env.REDIS_URL_FILE) {
  try {
    const fs = require('fs')
    if (fs.existsSync(process.env.REDIS_URL_FILE)) {
      REDIS_URL = fs.readFileSync(process.env.REDIS_URL_FILE, 'utf8').trim()
      console.log(`✅ Using Redis URL from secret file: ${REDIS_URL.replace(/:[^:@]+@/, ':***@')}`)
    } else {
      console.warn(`⚠️ Redis URL secret file not found: ${process.env.REDIS_URL_FILE}`)
    }
  } catch (error) {
    console.error('Failed to read Redis URL from secret file:', error)
  }
}

// Create Redis client with enhanced connection pooling and retry logic
export const redis = new Redis(REDIS_URL, {
  password: REDIS_PASSWORD,
  enableReadyCheck: false,
  // Always lazy connect to prevent attempts during import-time
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: process.env.NODE_ENV === 'production' ? 10000 : 3000,
  commandTimeout: 5000,
  // Always enable offline queue to prevent crashes
  enableOfflineQueue: true,
  // Enhanced connection pooling
  family: 4,
  db: 0,
  // Improved retry strategy
  maxRetriesPerRequest: 3,
  // Connection management
  enableAutoPipelining: true,
  // Health monitoring
  keyPrefix: process.env.NODE_ENV === 'development' ? 'dev:' : 'prod:',
})

// Enhanced connection event handlers with automatic reconnection
redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('ready', () => {
  console.log('🚀 Redis ready to receive commands')
})

redis.on('error', (error) => {
  if (IS_BUILD_PHASE) {
    // Suppress noisy errors during build
    console.warn('ℹ️ Redis connection suppressed during build')
    return
  }
  console.error('❌ Redis connection error:', error)
  // Don't exit process on Redis errors - let it retry
  // Prevent uncaught exceptions from crashing the process
  ;(error as any).handled = true
})

redis.on('close', () => {
  console.log('🔌 Redis connection closed')
})

redis.on('reconnecting', (delay: number) => {
  console.log(`🔄 Redis reconnecting in ${delay}ms`)
})

redis.on('end', () => {
  console.log('🔚 Redis connection ended')
})

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('📤 Gracefully closing Redis connection...')
  await redis.quit()
})

process.on('SIGTERM', async () => {
  console.log('📤 Gracefully closing Redis connection...')
  await redis.quit()
})

// Enhanced cache keys with versioning for invalidation
export const CACHE_KEYS = {
  // User-related keys
  USER_PROFILE: (userId: string) => `user:profile:v2:${userId}`,
  USER_STATS: (userId: string) => `user:stats:v2:${userId}`,
  USER_PERMISSIONS: (userId: string) => `user:permissions:v1:${userId}`,
  USER_SOCKETS: (userId: string) => `user:sockets:${userId}`,

  // Game-related keys
  GAME_ROOM: (roomId: string) => `room:v2:${roomId}`,
  GAME_ROOMS_LIST: (gameType: string) => `rooms:list:v2:${gameType}`,
  GAME_STATE: (roomId: string) => `game:state:v2:${roomId}`,
  GAME_MOVES: (roomId: string) => `game:moves:${roomId}`,

  // Leaderboards with game-specific caching
  LEADERBOARD: (gameType: string) => `leaderboard:v2:${gameType}`,
  LEADERBOARD_GLOBAL: 'leaderboard:global:v1',
  WEEKLY_LEADERBOARD: (gameType: string) => `leaderboard:weekly:${gameType}`,

  // Social features
  ACHIEVEMENTS: (userId: string) => `user:achievements:v1:${userId}`,
  CHAT_HISTORY: (roomId: string) => `chat:history:v1:${roomId}`,
  CHAT_GLOBAL: 'chat:global:v1',

  // Real-time features
  ONLINE_USERS: 'users:online:v1',
  USER_STATUS: (userId: string) => `user:status:${userId}`,
  ROOM_PRESENCE: (roomId: string) => `room:presence:${roomId}`,

  // Rate limiting and security
  RATE_LIMIT: (key: string) => `rate_limit:v2:${key}`,
  SESSION: (sessionId: string) => `session:v1:${sessionId}`,
  LOGIN_ATTEMPTS: (identifier: string) => `login:attempts:${identifier}`,

  // Performance monitoring
  API_METRICS: (endpoint: string) => `metrics:api:${endpoint}`,
  SOCKET_METRICS: 'metrics:socket:connections',

  // Feature flags and configuration
  FEATURE_FLAGS: 'config:features:v1',
  GAME_CONFIG: (gameType: string) => `config:game:${gameType}`,

  // Caching metadata
  CACHE_STATS: 'cache:stats:v1',
  INVALIDATION_LOG: 'cache:invalidation:log'
} as const

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 5 * 60,        // 5 minutes
  MEDIUM: 30 * 60,      // 30 minutes
  LONG: 2 * 60 * 60,    // 2 hours
  DAY: 24 * 60 * 60,    // 24 hours
  WEEK: 7 * 24 * 60 * 60, // 7 days
  PERMANENT: -1         // No expiration
} as const

// Cache utility functions
export class CacheManager {
  // Expose raw client where explicitly needed
  static redis = redis as any

  // Generic get with JSON parsing
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  // Generic set with JSON stringification
  static async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      if (ttl === CACHE_TTL.PERMANENT) {
        await redis.set(key, serialized)
      } else {
        await redis.setex(key, ttl, serialized)
      }
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }

  // Delete cache key
  static async del(key: string | string[]): Promise<boolean> {
    try {
      await redis.del(Array.isArray(key) ? key : [key])
      return true
    } catch (error) {
      console.error(`Cache delete error for key(s) ${key}:`, error)
      return false
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(key)
      return exists === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  // Set with expiration
  static async setWithTTL<T>(key: string, value: T, ttl: number): Promise<boolean> {
    return this.set(key, value, ttl)
  }

  // Get TTL for a key
  static async getTTL(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error)
      return -1
    }
  }

  // Increment counter
  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redis.incr(key)
      if (ttl && value === 1) {
        await redis.expire(key, ttl)
      }
      return value
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error)
      return 0
    }
  }

  // Pattern-based key deletion
  static async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        return await redis.del(...keys)
      }
      return 0
    } catch (error) {
      console.error(`Cache pattern delete error for pattern ${pattern}:`, error)
      return 0
    }
  }

  // Hash operations
  static async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await redis.hget(key, field)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Cache hget error for key ${key}, field ${field}:`, error)
      return null
    }
  }

  static async hset<T>(key: string, field: string, value: T, ttl?: number): Promise<boolean> {
    try {
      await redis.hset(key, field, JSON.stringify(value))
      if (ttl) {
        await redis.expire(key, ttl)
      }
      return true
    } catch (error) {
      console.error(`Cache hset error for key ${key}, field ${field}:`, error)
      return false
    }
  }

  // List operations for real-time features
  static async lpush<T>(key: string, ...values: T[]): Promise<number> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v))
      return await redis.lpush(key, ...serializedValues)
    } catch (error) {
      console.error(`Cache lpush error for key ${key}:`, error)
      return 0
    }
  }

  static async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      const values = await redis.lrange(key, start, stop)
      return values.map(v => JSON.parse(v))
    } catch (error) {
      console.error(`Cache lrange error for key ${key}:`, error)
      return []
    }
  }

  // Set operations for online users
  static async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.sadd(key, ...members)
    } catch (error) {
      console.error(`Cache sadd error for key ${key}:`, error)
      return 0
    }
  }

  static async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.srem(key, ...members)
    } catch (error) {
      console.error(`Cache srem error for key ${key}:`, error)
      return 0
    }
  }

  static async smembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key)
    } catch (error) {
      console.error(`Cache smembers error for key ${key}:`, error)
      return []
    }
  }

  // Sorted sets for leaderboards
  static async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await redis.zadd(key, score, member)
    } catch (error) {
      console.error(`Cache zadd error for key ${key}:`, error)
      return 0
    }
  }

  static async zrevrange(key: string, start: number, stop: number, withScores: boolean = false): Promise<string[]> {
    try {
      if (withScores) {
        return await redis.zrevrange(key, start, stop, 'WITHSCORES')
      }
      return await redis.zrevrange(key, start, stop)
    } catch (error) {
      console.error(`Cache zrevrange error for key ${key}:`, error)
      return []
    }
  }
}

// Rate limiting with Redis
export class RateLimiter {
  static async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    identifier?: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const rateLimitKey = CACHE_KEYS.RATE_LIMIT(`${key}:${identifier || 'default'}`)

    try {
      const current = await redis.incr(rateLimitKey)

      if (current === 1) {
        await redis.pexpire(rateLimitKey, windowMs)
      }

      const ttl = await redis.pttl(rateLimitKey)
      const resetTime = Date.now() + ttl

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail open in case of Redis errors
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs }
    }
  }
}

// Health check
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

export default redis