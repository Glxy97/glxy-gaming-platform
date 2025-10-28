import { NextRequest, NextResponse } from 'next/server'
import { CacheManager, CACHE_KEYS, CACHE_TTL } from './redis'

export interface CacheConfig {
  ttl: number
  tags: string[]
  vary?: string[]
  compress?: boolean
  staleWhileRevalidate?: number
}

export interface CacheContext {
  userId?: string
  gameType?: string
  roomId?: string
  endpoint: string
}

// Default cache configurations for different endpoint types
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  'leaderboards': {
    ttl: CACHE_TTL.MEDIUM,
    tags: ['leaderboards'],
    staleWhileRevalidate: CACHE_TTL.SHORT,
    compress: true
  },
  'user-profile': {
    ttl: CACHE_TTL.LONG,
    tags: ['user', 'profile'],
    vary: ['user'],
    compress: false
  },
  'game-stats': {
    ttl: CACHE_TTL.MEDIUM,
    tags: ['game', 'stats'],
    vary: ['user', 'game'],
    compress: true
  },
  'rooms-list': {
    ttl: CACHE_TTL.SHORT,
    tags: ['rooms', 'game'],
    vary: ['game'],
    compress: true
  },
  'achievements': {
    ttl: CACHE_TTL.LONG,
    tags: ['achievements', 'user'],
    vary: ['user'],
    compress: false
  },
  'tournaments': {
    ttl: CACHE_TTL.MEDIUM,
    tags: ['tournaments'],
    compress: true
  },
  'theme-presets': {
    ttl: CACHE_TTL.DAY,
    tags: ['theme'],
    compress: false
  },
  'notifications': {
    ttl: CACHE_TTL.SHORT,
    tags: ['notifications', 'user'],
    vary: ['user'],
    compress: false
  }
}

export class ApiCacheManager {

  static generateCacheKey(context: CacheContext, config: CacheConfig): string {
    const baseKey = `api:${context.endpoint}`
    const variations: string[] = []

    if (config.vary?.includes('user') && context.userId) {
      variations.push(`user:${context.userId}`)
    }

    if (config.vary?.includes('game') && context.gameType) {
      variations.push(`game:${context.gameType}`)
    }

    if (config.vary?.includes('room') && context.roomId) {
      variations.push(`room:${context.roomId}`)
    }

    const suffix = variations.length > 0 ? `:${variations.join(':')}` : ''
    return `${baseKey}${suffix}:v1`
  }

  static async get<T>(context: CacheContext, config: CacheConfig): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(context, config)
      const data = await CacheManager.get<T>(cacheKey)

      if (data) {
        // Track cache hit
        await this.trackCacheMetrics(context.endpoint, 'hit')
        return data
      }

      // Track cache miss
      await this.trackCacheMetrics(context.endpoint, 'miss')
      return null
    } catch (error) {
      console.error('API Cache get error:', error)
      return null
    }
  }

  static async set<T>(
    context: CacheContext,
    config: CacheConfig,
    data: T
  ): Promise<boolean> {
    try {
      const cacheKey = this.generateCacheKey(context, config)

      // Compress large objects if configured
      const processedData = config.compress ? await this.compressData(data) : data

      const success = await CacheManager.set(cacheKey, processedData, config.ttl)

      if (success) {
        // Add cache tags for invalidation
        await this.addCacheTags(cacheKey, config.tags)

        // Track cache write
        await this.trackCacheMetrics(context.endpoint, 'write')
      }

      return success
    } catch (error) {
      console.error('API Cache set error:', error)
      return false
    }
  }

  static async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let invalidatedCount = 0

      for (const tag of tags) {
        const tagKey = `cache:tag:${tag}`
        const cacheKeys = await CacheManager.smembers(tagKey)

        if (cacheKeys.length > 0) {
          await CacheManager.del(cacheKeys)
          await CacheManager.del(tagKey)
          invalidatedCount += cacheKeys.length
        }
      }

      // Log invalidation for monitoring
      await this.logInvalidation(tags, invalidatedCount)

      return invalidatedCount
    } catch (error) {
      console.error('Cache invalidation error:', error)
      return 0
    }
  }

  static async warmCache(endpoints: string[]): Promise<void> {
    try {
      for (const endpoint of endpoints) {
        // This would trigger background cache warming
        await this.scheduleWarmup(endpoint)
      }
    } catch (error) {
      console.error('Cache warming error:', error)
    }
  }

  private static async compressData<T>(data: T): Promise<T> {
    // For now, return as-is. In production, implement compression
    // using libraries like 'lz-string' or 'brotli'
    return data
  }

  private static async addCacheTags(cacheKey: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `cache:tag:${tag}`
        await CacheManager.sadd(tagKey, cacheKey)
        // Set expiration for tag tracking - handled by CacheManager.set
      }
    } catch (error) {
      console.error('Error adding cache tags:', error)
    }
  }

  private static async trackCacheMetrics(endpoint: string, type: 'hit' | 'miss' | 'write'): Promise<void> {
    try {
      const metricKey = CACHE_KEYS.API_METRICS(`${endpoint}:${type}`)
      await CacheManager.incr(metricKey, CACHE_TTL.DAY)
    } catch (error) {
      console.error('Error tracking cache metrics:', error)
    }
  }

  private static async logInvalidation(tags: string[], count: number): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        tags,
        invalidatedCount: count
      }

      await CacheManager.lpush(CACHE_KEYS.INVALIDATION_LOG, logEntry)
      // Keep only last 1000 entries - handled by CacheManager implementation
    } catch (error) {
      console.error('Error logging cache invalidation:', error)
    }
  }

  private static async scheduleWarmup(endpoint: string): Promise<void> {
    // Placeholder for cache warming logic
    // In production, this would trigger background jobs
    console.log(`Scheduling cache warmup for: ${endpoint}`)
  }
}

// Cache middleware factory
export function withCache<T>(
  endpointType: string,
  handler: (req: NextRequest, context: CacheContext) => Promise<T>
) {
  return async (req: NextRequest, routeParams?: any): Promise<NextResponse> => {
    try {
      const config = CACHE_CONFIGS[endpointType]

      if (!config) {
        // No cache config, execute handler directly
        const result = await handler(req, { endpoint: endpointType })
        return NextResponse.json(result)
      }

      // Extract context from request
      const context = await extractCacheContext(req, endpointType, routeParams)

      // Try cache first (only for GET requests)
      if (req.method === 'GET') {
        const cachedData = await ApiCacheManager.get<T>(context, config)

        if (cachedData) {
          const response = NextResponse.json(cachedData)
          response.headers.set('X-Cache', 'HIT')
          response.headers.set('Cache-Control', `max-age=${config.ttl}`)
          return response
        }
      }

      // Execute handler
      const result = await handler(req, context)

      // Cache result for GET requests
      if (req.method === 'GET' && result) {
        await ApiCacheManager.set(context, config, result)
      }

      // Invalidate cache for mutations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        await ApiCacheManager.invalidateByTags(config.tags)
      }

      const response = NextResponse.json(result)
      response.headers.set('X-Cache', 'MISS')
      response.headers.set('Cache-Control', `max-age=${config.ttl}`)

      return response

    } catch (error) {
      console.error('Cache middleware error:', error)
      // Fall back to executing handler without caching
      const result = await handler(req, { endpoint: endpointType })
      return NextResponse.json(result)
    }
  }
}

async function extractCacheContext(
  req: NextRequest,
  endpoint: string,
  routeParams?: any
): Promise<CacheContext> {
  const context: CacheContext = { endpoint }

  // Extract user ID from session/auth
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    // Parse user ID from JWT or session
    // This would be implemented based on your auth system
    context.userId = await extractUserIdFromAuth(authHeader)
  }

  // Extract context from URL params and query
  const url = new URL(req.url)
  const searchParams = url.searchParams

  context.gameType = searchParams.get('gameType') || routeParams?.gameType
  context.roomId = searchParams.get('roomId') || routeParams?.roomId

  return context
}

async function extractUserIdFromAuth(authHeader: string): Promise<string | undefined> {
  try {
    // This would integrate with your actual auth system
    // For now, return undefined
    return undefined
  } catch (error) {
    console.error('Error extracting user ID from auth:', error)
    return undefined
  }
}

// Prebuilt cache decorators for common patterns
export const withLeaderboardCache = (handler: any) => withCache('leaderboards', handler)
export const withUserProfileCache = (handler: any) => withCache('user-profile', handler)
export const withGameStatsCache = (handler: any) => withCache('game-stats', handler)
export const withRoomsListCache = (handler: any) => withCache('rooms-list', handler)
export const withAchievementsCache = (handler: any) => withCache('achievements', handler)
export const withTournamentsCache = (handler: any) => withCache('tournaments', handler)
export const withThemePresetsCache = (handler: any) => withCache('theme-presets', handler)
export const withNotificationsCache = (handler: any) => withCache('notifications', handler)