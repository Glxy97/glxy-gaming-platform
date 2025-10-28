// @ts-nocheck
/**
 * GLXY Gaming Platform - Advanced Rate Limiting
 * Enterprise-grade rate limiting with Redis backend
 */

import { redis } from '@/lib/redis-server'
import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  onLimitReached?: (request: NextRequest, response: Response) => void
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
  totalHits: number
}

// Predefined rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many API requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful logins
  },

  // Registration endpoint
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: 'Too many registration attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password resets per hour
    message: 'Too many password reset attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 admin requests per minute
    message: 'Too many admin requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // File uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many upload attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Game actions
  game: {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 game actions per minute
    message: 'Too many game actions, please slow down.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Chat/messages
  chat: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: 'Too many messages, please wait before sending another.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Webhook endpoints
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 webhook calls per minute
    message: 'Too many webhook calls, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  }
}

// Advanced key generators for different scenarios
export const KEY_GENERATORS = {
  // IP-based limiting
  byIP: (request: NextRequest): string => {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() :
                request.headers.get('x-real-ip') ||
                'unknown'
    return `rate_limit:ip:${ip}`
  },

  // User-based limiting (for authenticated requests)
  byUser: (request: NextRequest): string => {
    // This would need to be implemented based on your auth system
    const userId = request.headers.get('x-user-id') || 'anonymous'
    return `rate_limit:user:${userId}`
  },

  // IP + User combined limiting
  byIPAndUser: (request: NextRequest): string => {
    const ip = KEY_GENERATORS.byIP(request)
    const user = KEY_GENERATORS.byUser(request)
    return `${ip}:${user}`
  },

  // Endpoint-specific limiting
  byEndpoint: (request: NextRequest): string => {
    const ip = KEY_GENERATORS.byIP(request)
    const pathname = new URL(request.url).pathname
    return `${ip}:${pathname}`
  },

  // Custom key for authentication failures
  byAuthFailures: (request: NextRequest): string => {
    const ip = KEY_GENERATORS.byIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    return `auth_failures:${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 16)}`
  }
}

/**
 * Advanced rate limiting with Redis
 */
export async function advancedRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = config.keyGenerator ? config.keyGenerator(request) : KEY_GENERATORS.byIP(request)
  const now = Date.now()
  const windowStart = now - config.windowMs

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart)

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`)

    // Count requests in window
    pipeline.zcard(key)

    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 1)

    const results = await pipeline.exec()
    const totalHits = results?.[2]?.[1] as number || 0

    const allowed = totalHits <= config.max
    const remaining = Math.max(0, config.max - totalHits)
    const resetTime = now + config.windowMs

    const result: RateLimitResult = {
      allowed,
      limit: config.max,
      remaining,
      resetTime,
      totalHits
    }

    if (!allowed) {
      result.retryAfter = Math.ceil((resetTime - now) / 1000)
    }

    // Call callback if limit reached
    if (!allowed && config.onLimitReached) {
      config.onLimitReached(request, new Response())
    }

    return result

  } catch (error) {
    console.error('Rate limiting failed:', error)

    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      limit: config.max,
      remaining: config.max - 1,
      resetTime: now + config.windowMs,
      totalHits: 1
    }
  }
}

/**
 * Simple rate limiting wrapper for common use cases
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const now = Date.now()
    const windowStart = now - windowMs

    // Remove expired entries
    await redis.zremrangebyscore(key, 0, windowStart)

    // Count current requests
    const current = await redis.zcard(key)

    if (current >= max) {
      const ttl = await redis.ttl(key)
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (ttl * 1000)
      }
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`)
    await redis.expire(key, Math.ceil(windowMs / 1000) + 1)

    return {
      allowed: true,
      remaining: max - current - 1,
      resetTime: now + windowMs
    }

  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open
    return { allowed: true, remaining: max, resetTime: Date.now() + windowMs }
  }
}

/**
 * Apply rate limiting to API routes
 */
export async function applyRateLimit(
  request: NextRequest,
  configKey: keyof typeof RATE_LIMIT_CONFIGS
): Promise<{ allowed: boolean; response?: Response }> {
  const config = RATE_LIMIT_CONFIGS[configKey]

  const result = await advancedRateLimit(request, config)

  if (!result.allowed) {
    const response = new Response(
      JSON.stringify({
        error: config.message || 'Rate limit exceeded',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': (result.retryAfter || 60).toString()
        }
      }
    )

    return { allowed: false, response }
  }

  return { allowed: true }
}

/**
 * Progressive rate limiting for authentication failures
 */
export async function progressiveAuthRateLimit(
  request: NextRequest,
  attemptCount: number
): Promise<RateLimitResult> {
  // Increase penalty based on failure count
  const baseWindow = 15 * 60 * 1000 // 15 minutes
  const baseMax = 5

  const windowMs = baseWindow * Math.pow(2, Math.min(attemptCount - 1, 5)) // Exponential backoff
  const max = Math.max(1, Math.floor(baseMax / Math.pow(1.5, Math.min(attemptCount - 1, 3))))

  return advancedRateLimit(request, {
    windowMs,
    max,
    message: `Too many authentication attempts. Please wait ${Math.ceil(windowMs / 60000)} minutes.`,
    keyGenerator: KEY_GENERATORS.byAuthFailures
  })
}

/**
 * Global rate limiting for DDoS protection
 */
export async function globalRateLimit(request: NextRequest): Promise<boolean> {
  const key = `global_rate:${new Date().getMinutes()}`
  const maxGlobalRequests = 1000 // Global limit per minute

  try {
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, 60) // 1 minute
    }

    return current <= maxGlobalRequests
  } catch (error) {
    console.error('Global rate limiting failed:', error)
    return true // Fail open
  }
}

/**
 * Rate limiting middleware for Next.js middleware
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<{ allowed: boolean; response?: Response }> {
  // Global DDoS protection
  if (!(await globalRateLimit(request))) {
    return {
      allowed: false,
      response: new Response('Service temporarily unavailable', { status: 503 })
    }
  }

  const pathname = new URL(request.url).pathname

  // Apply specific rate limits based on path
  if (pathname.startsWith('/api/auth')) {
    return applyRateLimit(request, 'auth')
  } else if (pathname.startsWith('/api/admin')) {
    return applyRateLimit(request, 'admin')
  } else if (pathname.startsWith('/api/upload')) {
    return applyRateLimit(request, 'upload')
  } else if (pathname.startsWith('/api/chat')) {
    return applyRateLimit(request, 'chat')
  } else if (pathname.startsWith('/api/webhook')) {
    return applyRateLimit(request, 'webhook')
  } else if (pathname.startsWith('/api/')) {
    return applyRateLimit(request, 'api')
  }

  return { allowed: true }
}