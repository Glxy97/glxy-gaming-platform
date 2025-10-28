// Client-side Redis utilities (no actual Redis connection)
// This file provides type definitions and mock implementations for client-side usage

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 5 * 60,        // 5 minutes
  MEDIUM: 30 * 60,      // 30 minutes
  LONG: 2 * 60 * 60,    // 2 hours
  DAY: 24 * 60 * 60,    // 24 hours
  WEEK: 7 * 24 * 60 * 60, // 7 days
  PERMANENT: -1         // No expiration
} as const

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

// Mock implementations for client-side usage
export class CacheManager {
  static async get<T>(key: string): Promise<T | null> {
    // Client-side cache operations should use browser storage or state management
    return null
  }

  static async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    // Client-side cache operations should use browser storage or state management
    return false
  }

  static async del(key: string | string[]): Promise<boolean> {
    return false
  }

  static async exists(key: string): Promise<boolean> {
    return false
  }

  static async setWithTTL<T>(key: string, value: T, ttl: number): Promise<boolean> {
    return this.set(key, value, ttl)
  }

  static async getTTL(key: string): Promise<number> {
    return -1
  }

  static async incr(key: string, ttl?: number): Promise<number> {
    return 0
  }

  static async deletePattern(pattern: string): Promise<number> {
    return 0
  }

  static async hget<T>(key: string, field: string): Promise<T | null> {
    return null
  }

  static async hset<T>(key: string, field: string, value: T, ttl?: number): Promise<boolean> {
    return false
  }

  static async lpush<T>(key: string, ...values: T[]): Promise<number> {
    return 0
  }

  static async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    return []
  }

  static async sadd(key: string, ...members: string[]): Promise<number> {
    return 0
  }

  static async srem(key: string, ...members: string[]): Promise<number> {
    return 0
  }

  static async smembers(key: string): Promise<string[]> {
    return []
  }

  static async zadd(key: string, score: number, member: string): Promise<number> {
    return 0
  }

  static async zrevrange(key: string, start: number, stop: number, withScores: boolean = false): Promise<string[]> {
    return []
  }
}

// Mock rate limiter for client-side
export class RateLimiter {
  static async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    identifier?: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // Client-side rate limiting should be handled by the server
    return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs }
  }
}

// Mock health check for client-side
export const checkRedisHealth = async (): Promise<boolean> => {
  return false
}

// No actual Redis instance on client-side
export const redis = null as any

export default redis