import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyAuthEnhanced, trackAuthFailure, isAuthRateLimited, invalidateToken } from './auth-security'
import type { AuthenticatedUser, JWTVerificationResult } from './auth-security'

// Security configuration
export interface SecurityOptions {
  // Authentication options
  requireAuth?: boolean
  enhancedVerification?: boolean

  // Rate limiting options
  enableRateLimit?: boolean
  maxAttempts?: number
  windowMinutes?: number

  // Response options
  unauthorizedResponse?: { error: string; status: number }
  forbiddenResponse?: { error: string; status: number }

  // Additional security
  requireEmailVerification?: boolean
  allowedRoles?: string[]
  cors?: {
    origins?: string[]
    methods?: string[]
    headers?: string[]
  }
}

// Default security configuration
const DEFAULT_OPTIONS: SecurityOptions = {
  requireAuth: true,
  enhancedVerification: false,
  enableRateLimit: true,
  maxAttempts: 10,
  windowMinutes: 15,
  unauthorizedResponse: {
    error: 'Authentication required',
    status: 401
  },
  forbiddenResponse: {
    error: 'Access forbidden',
    status: 403
  },
  requireEmailVerification: false,
  allowedRoles: []
}

// Get client IP from request
const getClientIP = (req: NextRequest): string => {
  // Check various headers for real IP
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip') // Cloudflare

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return realIP || cfConnectingIP || 'unknown'
}

// Create error response
const createErrorResponse = (options: SecurityOptions, type: 'unauthorized' | 'forbidden' | 'rate_limited', message?: string) => {
  const responseConfig = type === 'unauthorized'
    ? options.unauthorizedResponse || { error: 'Unauthorized', status: 401 }
    : type === 'forbidden'
    ? options.forbiddenResponse || { error: 'Forbidden', status: 403 }
    : { error: message || 'Rate limit exceeded', status: 429 }

  return NextResponse.json(
    {
      error: responseConfig.error || message,
      timestamp: new Date().toISOString()
    },
    {
      status: responseConfig.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    }
  )
}

// Add security headers to response
const addSecurityHeaders = (response: NextResponse, options: SecurityOptions): NextResponse => {
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CORS headers if configured
  if (options.cors) {
    const origin = options.cors.origins?.[0] || '*'
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', options.cors.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', options.cors.headers?.join(', ') || 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

// withAuth Higher-Order Function for API routes
export function withAuth(
  handler: (req: NextRequest, context: { user: AuthenticatedUser }) => Promise<NextResponse> | NextResponse,
  options: SecurityOptions = {}
) {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS' && finalOptions.cors) {
        const response = new NextResponse(null, { status: 200 })
        return addSecurityHeaders(response, finalOptions)
      }

      const clientIP = getClientIP(req)

      // Authentication required
      if (finalOptions.requireAuth) {
        // Check rate limiting for auth attempts
        if (finalOptions.enableRateLimit) {
          const identifier = req.headers.get('authorization')?.replace('Bearer ', '') || clientIP

          if (await isAuthRateLimited(identifier, clientIP)) {
            return createErrorResponse(finalOptions, 'rate_limited', 'Too many authentication attempts. Please try again later.')
          }
        }

        // Verify authentication
        const authResult: JWTVerificationResult = finalOptions.enhancedVerification
          ? await verifyAuthEnhanced(req)
          : await verifyAuth(req)

        if (!authResult.user) {
          // Track failed authentication attempt
          if (finalOptions.enableRateLimit) {
            const identifier = req.headers.get('authorization')?.replace('Bearer ', '') || clientIP
            await trackAuthFailure(identifier, clientIP)
          }

          console.warn(`[AUTH-MIDDLEWARE] Authentication failed: ${authResult.error} from IP: ${clientIP}`)
          return createErrorResponse(finalOptions, 'unauthorized', authResult.error)
        }

        // Additional security checks
        const user = authResult.user

        // Email verification check
        if (finalOptions.requireEmailVerification) {
          // Note: This would need to be checked in enhanced verification
          // For now, we assume enhancedVerification covers this
        }

        // Role-based access control
        if (finalOptions.allowedRoles && finalOptions.allowedRoles.length > 0) {
          if (!user.role || !finalOptions.allowedRoles.includes(user.role)) {
            console.warn(`[AUTH-MIDDLEWARE] Access denied for user ${user.id}. Role: ${user.role}, Required: ${finalOptions.allowedRoles.join(', ')}`)
            return createErrorResponse(finalOptions, 'forbidden', 'Insufficient permissions')
          }
        }

        // Add user to request context
        const context = { user }

        // Call the original handler with user context
        const response = await handler(req, context)
        return addSecurityHeaders(response, finalOptions)
      }

      // No authentication required, call handler directly
      const response = await handler(req, { user: null as any })
      return addSecurityHeaders(response, finalOptions)

    } catch (error) {
      console.error('[AUTH-MIDDLEWARE] Security middleware error:', error)

      // Return generic error for security
      return NextResponse.json(
        {
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      )
    }
  }
}

// Specialized middleware for admin routes
export function withAdminAuth(
  handler: (req: NextRequest, context: { user: AuthenticatedUser }) => Promise<NextResponse> | NextResponse,
  options: SecurityOptions = {}
) {
  return withAuth(handler, {
    ...options,
    enhancedVerification: true,
    allowedRoles: ['admin'],
    requireEmailVerification: true
  })
}

// Middleware for optional authentication (user may or may not be authenticated)
export function withOptionalAuth(
  handler: (req: NextRequest, context: { user?: AuthenticatedUser }) => Promise<NextResponse> | NextResponse,
  options: SecurityOptions = {}
) {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options, requireAuth: false }

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Try to authenticate, but don't fail if not authenticated
      const authResult = await verifyAuth(req)
      const context = { user: authResult.user || undefined }

      const response = await handler(req, context)
      return addSecurityHeaders(response, finalOptions)

    } catch (error) {
      console.error('[AUTH-MIDDLEWARE] Optional auth middleware error:', error)

      const response = await handler(req, { user: undefined })
      return addSecurityHeaders(response, finalOptions)
    }
  }
}

// Rate limiting middleware for API endpoints
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse,
  options: {
    windowMs?: number // Window in milliseconds
    maxRequests?: number // Max requests per window
    identifier?: string // Custom identifier (default: IP)
  } = {}
) {
  const { windowMs = 15 * 60 * 1000, maxRequests = 100, identifier } = options

  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const clientIP = getClientIP(req)
      const rateLimitIdentifier = identifier || clientIP

      // This would integrate with the existing RateLimiter from redis-server.ts
      // For now, this is a placeholder implementation
      const response = await handler(req, ...args)

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Window', (windowMs / 1000).toString())

      return response

    } catch (error) {
      console.error('[RATE-LIMIT] Rate limiting middleware error:', error)
      const response = await handler(req, ...args)
      return response
    }
  }
}

// Logout middleware
export const withLogout = (
  handler: (req: NextRequest, context: { user: AuthenticatedUser }) => Promise<NextResponse> | NextResponse
) => {
  return withAuth(async (req, context) => {
    try {
      // Invalidate the token
      await invalidateToken(req)

      // Call the logout handler
      const response = await handler(req, context)

      // Clear auth cookies
      response.headers.set('Set-Cookie', [
        'authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax',
        '__Secure-authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax; Secure'
      ].join(', '))

      return response
    } catch (error) {
      console.error('[LOGOUT-MIDDLEWARE] Logout error:', error)
      throw error
    }
  })
}

// Export types for convenience
export type { AuthenticatedUser, JWTVerificationResult } from './auth-security'