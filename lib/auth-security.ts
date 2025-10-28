import * as bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
// FIX: Import server-side Redis instead of client-side mock
import { redis, CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/redis-server'
import { getToken } from 'next-auth/jwt'

// Security constants
const BCRYPT_ROUNDS = 12 // Increased from default 10
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes in milliseconds
const PASSWORD_MIN_LENGTH = 8

// Importiere shared Password Validator
import { validatePassword, type PasswordValidationResult } from './password-validator'

// Enhanced Password Policy - Security Hardened
// DEPRECATED: Verwende validatePassword() aus password-validator.ts
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const result = validatePassword(password)
  return {
    isValid: result.isValid,
    errors: result.errors
  }
}

// Enhanced password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS)
}

// Account lockout management
export const checkAccountLockout = async (email: string): Promise<{ isLocked: boolean; remainingTime?: number }> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      loginAttempts: true,
      lockedUntil: true
    }
  })

  if (!user) {
    return { isLocked: false }
  }

  // Check if account is currently locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingTime = user.lockedUntil.getTime() - Date.now()
    return { isLocked: true, remainingTime }
  }

  // Reset lockout if time has passed
  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    await prisma.user.update({
      where: { email },
      data: {
        loginAttempts: 0,
        lockedUntil: null
      }
    })
  }

  return { isLocked: false }
}

// Handle failed login attempt
export const handleFailedLogin = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      loginAttempts: true
    }
  })

  if (!user) return

  const newAttempts = (user.loginAttempts || 0) + 1

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock the account
    await prisma.user.update({
      where: { email },
      data: {
        loginAttempts: newAttempts,
        lockedUntil: new Date(Date.now() + LOCKOUT_TIME)
      }
    })
  } else {
    // Increment attempts
    await prisma.user.update({
      where: { email },
      data: {
        loginAttempts: newAttempts
      }
    })
  }
}

// Handle successful login
export const handleSuccessfulLogin = async (email: string): Promise<void> => {
  await prisma.user.update({
    where: { email },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date()
    }
  })
}

// Enhanced Rate limiting for login attempts (per IP) - Redis-based implementation with null-safety
export const checkLoginRateLimit = async (ip: string): Promise<{ allowed: boolean; remainingTime?: number }> => {
  const key = `login_rate_limit:${ip}`
  const maxAttempts = 10 // Reduced from 50
  const windowMs = 5 * 60 * 1000 // 5 minutes

  try {
    // NULL-SAFETY CHECK: Redis might not be available
    if (!redis) {
      console.warn('[AUTH-SECURITY] Redis client is null - skipping rate limit check (allowing request)')
      return {
        allowed: true,
        remainingTime: 0
      }
    }

    // Check Redis connection status
    const redisStatus = redis.status
    if (redisStatus !== 'ready' && redisStatus !== 'connect' && redisStatus !== 'connecting') {
      console.warn(`[AUTH-SECURITY] Redis not ready (status: ${redisStatus}) - allowing request without rate limiting`)
      return {
        allowed: true,
        remainingTime: 0
      }
    }

    const current = await redis.get(key)
    const attempts = current ? parseInt(current) : 0

    if (attempts >= maxAttempts) {
      const ttl = await redis.ttl(key)
      return {
        allowed: false,
        remainingTime: ttl * 1000 // Convert to milliseconds
      }
    }

    // Increment attempts
    await redis.multi()
      .incr(key)
      .expire(key, Math.floor(windowMs / 1000))
      .exec()

    return {
      allowed: true,
      remainingTime: 0
    }
  } catch (error) {
    console.error('[AUTH-SECURITY] Redis rate limit error:', error)
    // Fail open - allow request if Redis is down (security trade-off for availability)
    return {
      allowed: true,
      remainingTime: 0
    }
  }
}

// Erweiterte Input-Sanitisierung zum XSS-Schutz
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .replace(/[<>"/\\&'`]/g, '') // Entferne gefährliche Zeichen
    .replace(/\s+/g, ' ') // Normalisiere Leerzeichen
    .substring(0, 1000) // Begrenze Länge gegen DoS
}

// HTML-Entitäten-Kodierung für sichere Ausgabe
export const escapeHtml = (text: string): string => {
  if (typeof text !== 'string') return ''

  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (s) => map[s] || s)
}

// SQL-Injection-Schutz durch gefährliche Zeichen entfernen
export const sanitizeSqlInput = (input: string): string => {
  if (typeof input !== 'string') return ''

  return input
    .replace(/['"`;\\]/g, '') // SQL gefährliche Zeichen
    .replace(/(--)|(\/\*)|(\*\/)/g, '') // SQL Kommentare
    .trim()
    .substring(0, 255)
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  // Reject consecutive dots
  if (email.includes('..')) return false

  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

// Username validation
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  return usernameRegex.test(username)
}

// JWT token verification for API routes
export interface AuthenticatedUser {
  id: string
  email: string
  username?: string | null
  name?: string | null
  image?: string | null
  role?: string
  iat?: number
  exp?: number
}

export interface JWTVerificationResult {
  user: AuthenticatedUser | null
  error?: string
  cached?: boolean
}

// Core JWT verification with NextAuth v5 getToken()
export const verifyAuth = async (req: Request): Promise<JWTVerificationResult> => {
  try {
    // First, try to get token from Authorization header
    const authHeader = req.headers.get('authorization')
    let token: string | undefined = undefined

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // If no token in header, try cookies (NextAuth default)
    if (!token) {
      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader)
        const sessionTokenName = process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token'
        token = cookies[sessionTokenName]
      }
    }

    if (!token) {
      return { user: null, error: 'No token provided' }
    }

    // Check cache first for performance
    const cacheKey = CACHE_KEYS.SESSION(token)
    const cachedUser = await CacheManager.get<AuthenticatedUser>(cacheKey)
    if (cachedUser) {
      // Verify token hasn't expired
      if (cachedUser.exp && cachedUser.exp > Math.floor(Date.now() / 1000)) {
        return { user: cachedUser, cached: true }
      }
      // Token expired, remove from cache
      await CacheManager.del(cacheKey)
    }

    // Verify JWT with NextAuth
    const jwtToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    })

    if (!jwtToken) {
      return { user: null, error: 'Invalid or expired token' }
    }

    // Validate required fields
    if (!jwtToken.id || !jwtToken.email) {
      return { user: null, error: 'Invalid token payload' }
    }

    const user: AuthenticatedUser = {
      id: jwtToken.id as string,
      email: jwtToken.email as string,
      username: jwtToken.username as string | null,
      name: jwtToken.name as string | null,
      image: jwtToken.picture as string | null,
      iat: jwtToken.iat as number,
      exp: jwtToken.exp as number
    }

    // Cache the verified user (short TTL for security)
    const cacheTTL = Math.min(
      (user.exp ? user.exp - Math.floor(Date.now() / 1000) : 300), // Use token expiry or 5 minutes
      1800 // Max 30 minutes cache
    )
    await CacheManager.set(cacheKey, user, Math.max(cacheTTL, 60)) // Min 1 minute cache

    return { user }

  } catch (error) {
    console.error('[JWT-VERIFY] Auth verification error:', error)
    return { user: null, error: 'Token verification failed' }
  }
}

// Helper function to parse cookies
const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...value] = cookie.split('=')
    if (name && value.length > 0) {
      cookies[name.trim()] = value.join('=').trim()
    }
  })
  return cookies
}

// Enhanced verification with additional security checks
export const verifyAuthEnhanced = async (req: Request): Promise<JWTVerificationResult> => {
  const result = await verifyAuth(req)

  if (!result.user) {
    return result
  }

  try {
    // Additional security: Verify user still exists and is active
    const dbUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        image: true,
        emailVerified: true,
        lockedUntil: true,
        lastLogin: true
      }
    })

    if (!dbUser) {
      return { user: null, error: 'User not found' }
    }

    // Check if account is locked
    if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
      return { user: null, error: 'Account is locked' }
    }

    // Check email verification
    if (!dbUser.emailVerified) {
      return { user: null, error: 'Email not verified' }
    }

    // Update user object with latest DB data
    result.user.username = dbUser.username
    result.user.name = dbUser.name
    result.user.image = dbUser.image

    return result

  } catch (error) {
    console.error('[JWT-VERIFY] Enhanced verification error:', error)
    return { user: null, error: 'Enhanced verification failed' }
  }
}

// Legacy function for backward compatibility
export const verifyAuthLegacy = async (req: any): Promise<{ id: string; email: string; username: string; role?: string } | null> => {
  const result = await verifyAuth(req)
  if (result.user) {
    return {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username || '',
      role: result.user.role
    }
  }
  return null
}

// Token invalidation for logout
export const invalidateToken = async (req: Request): Promise<void> => {
  try {
    const authHeader = req.headers.get('authorization')
    let token: string | undefined = undefined

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader)
        const sessionTokenName = process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token'
        token = cookies[sessionTokenName]
      }
    }

    if (token) {
      const cacheKey = CACHE_KEYS.SESSION(token)
      await CacheManager.del(cacheKey)

      // Also invalidate user-related cache
      if (redis) {
        // Try to get user ID from token before deletion
        const result = await verifyAuth(req)
        if (result.user) {
          const userId = result.user.id
          // Invalidate user-specific cache keys
          await CacheManager.del([
            CACHE_KEYS.USER_PROFILE(userId),
            CACHE_KEYS.USER_STATS(userId),
            CACHE_KEYS.USER_PERMISSIONS(userId)
          ])
        }
      }
    }
  } catch (error) {
    console.error('[JWT-VERIFY] Token invalidation error:', error)
  }
}

// Rate limiting for failed auth attempts
export const trackAuthFailure = async (identifier: string, ip: string): Promise<void> => {
  try {
    // Track failed attempts by identifier (email/token) and IP
    const identifierKey = `auth_failure:${identifier}`
    const ipKey = `auth_failure_ip:${ip}`

    // Increment counters with 15-minute window
    if (redis) {
      await Promise.all([
        redis.incr(identifierKey),
        redis.expire(identifierKey, 15 * 60), // 15 minutes
        redis.incr(ipKey),
        redis.expire(ipKey, 15 * 60) // 15 minutes
      ])
    }
  } catch (error) {
    console.error('[JWT-VERIFY] Auth failure tracking error:', error)
  }
}

// Check if identifier/IP is rate limited
export const isAuthRateLimited = async (identifier: string, ip: string): Promise<boolean> => {
  try {
    if (!redis) return false

    const [identifierAttempts, ipAttempts] = await Promise.all([
      redis.get(`auth_failure:${identifier}`),
      redis.get(`auth_failure_ip:${ip}`)
    ])

    const maxAttempts = 10 // Block after 10 failed attempts
    const attempts = Math.max(
      parseInt(identifierAttempts || '0'),
      parseInt(ipAttempts || '0')
    )

    return attempts >= maxAttempts
  } catch (error) {
    console.error('[JWT-VERIFY] Rate limit check error:', error)
    return false // Fail open
  }
}
