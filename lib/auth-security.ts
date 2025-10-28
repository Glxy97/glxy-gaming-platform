import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'
// FIX: Import server-side Redis instead of client-side mock
import { redis } from '@/lib/redis-server'

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
    .replace(/union\s+select/gi, '') // UNION SELECT attacks
    .replace(/drop\s+table/gi, '') // DROP TABLE attacks
    .replace(/delete\s+from/gi, '') // DELETE attacks
    .replace(/insert\s+into/gi, '') // INSERT attacks
    .replace(/update\s+set/gi, '') // UPDATE attacks
    .trim()
    .substring(0, 255)
}

// Enhanced input validation for different contexts with DOMPurify
import DOMPurify from 'isomorphic-dompurify'

export const validateAndSanitizeInput = {
  search: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    return sanitizeSqlInput(input).substring(0, 100)
  },
  
  email: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    return input.trim().toLowerCase().substring(0, 254)
  },
  
  username: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    return input.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20)
  },
  
  filename: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    return input.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 255)
  },

  chatMessage: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    // Allow some formatting but prevent XSS
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
      ALLOWED_ATTR: []
    }).substring(0, 500)
  },
  
  richText: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    // For PDF fields, etc.
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em'],
      ALLOWED_ATTR: ['class']
    })
  },

  htmlContent: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    // More permissive for trusted content
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'class', 'target']
    })
  },

  strict: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    // Most restrictive - only plain text
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })
  }
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
export const verifyAuth = async (req: any): Promise<{ id: string; email: string; username: string; role?: string } | null> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const secret = process.env.NEXTAUTH_SECRET

    if (!secret) {
      console.error('NEXTAUTH_SECRET not configured')
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, secret) as any

    // Validate token structure
    if (!decoded.id || !decoded.email) {
      console.error('Invalid token structure')
      return null
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.error('Token expired')
      return null
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { role: true, username: true }
    })

    if (!user) {
      console.error('User not found in database')
      return null
    }

    return {
      id: decoded.id,
      email: decoded.email,
      username: user.username || '',
      role: user.role || 'USER'
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}
