// ========================================
// GLXY Gaming Platform - /docs Protection
// Security Implementation für /docs Route
// ========================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Middleware Extension für /docs Protection
 *
 * Sicherheitsstrategie:
 * 1. /docs/public/* → Alle eingeloggten User
 * 2. /docs/internal/* → Nur Admins
 * 3. /docs/security/* → Nur Admins
 * 4. Audit Logging für alle /docs Zugriffe
 */

export async function protectDocsRoute(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Nur /docs Routes verarbeiten
  if (!pathname.startsWith('/docs')) {
    return null // Other middleware handles this
  }

  // ========================================
  // 1. AUTHENTICATION CHECK
  // ========================================
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Kein Token = Nicht eingeloggt → Redirect zu Login
  if (!token) {
    const loginUrl = new URL('/auth/signin', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    loginUrl.searchParams.set('from', 'docs')

    console.log(`[DOCS-SECURITY] Unauthenticated access attempt to ${pathname}`)
    return NextResponse.redirect(loginUrl)
  }

  // ========================================
  // 2. AUTHORIZATION CHECK (Role-Based)
  // ========================================

  // Extract user info from token
  const userId = token.sub as string
  const userEmail = token.email as string
  const userRole = (token.role as string) || 'user'
  const isAdmin = userRole === 'admin'

  // Protected paths that require admin role
  const adminOnlyPaths = ['/docs/internal', '/docs/security']
  const isAdminPath = adminOnlyPaths.some(path => pathname.startsWith(path))

  if (isAdminPath && !isAdmin) {
    console.log(`[DOCS-SECURITY] Unauthorized access attempt to ${pathname} by ${userEmail} (role: ${userRole})`)

    // Non-Admin versucht Admin-Docs zu öffnen → Redirect zu public docs
    const deniedUrl = new URL('/docs/public', request.url)
    return NextResponse.redirect(deniedUrl)
  }

  // ========================================
  // 3. AUDIT LOGGING
  // ========================================

  // Log all /docs access for security monitoring
  const auditEntry = {
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    userRole,
    path: pathname,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    granted: true
  }

  // In production: Send to monitoring/SIEM system
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service (e.g., Logstash, Datadog, Sentry)
    console.log('[DOCS-AUDIT]', JSON.stringify(auditEntry))
  }

  // ========================================
  // 4. SECURITY HEADERS für /docs
  // ========================================

  const response = NextResponse.next()

  // Prevent caching of protected docs
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Docs-Access-Level', isAdmin ? 'admin' : 'user')

  // Content Security Policy for docs viewer
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';"
  )

  return response
}

/**
 * Check if user has admin role
 * Helper function for role verification
 */
export async function checkAdminRole(request: NextRequest): Promise<boolean> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token) return false

  const userRole = (token.role as string) || 'user'
  return userRole === 'admin'
}

/**
 * Environment-based protection (alternative strategy)
 *
 * Use this if you want /docs only accessible in development:
 */
export function protectDocsInProduction(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/docs')) {
    return null
  }

  // In Production: Disable /docs completely
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DOCS !== 'true') {
    console.log(`[DOCS-SECURITY] /docs access blocked in production: ${pathname}`)
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  // In Development: Continue with normal protection
  return null
}

/**
 * Rate Limiting für /docs (prevent enumeration attacks)
 */
const docsAccessCache = new Map<string, { count: number; resetAt: number }>()

export function rateLimitDocsAccess(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/docs')) {
    return null
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const WINDOW_MS = 60 * 1000 // 1 minute
  const MAX_REQUESTS = 30 // 30 requests per minute

  const cached = docsAccessCache.get(ip)

  if (cached && cached.resetAt > now) {
    // Within rate limit window
    if (cached.count >= MAX_REQUESTS) {
      console.log(`[DOCS-SECURITY] Rate limit exceeded for ${ip}`)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    cached.count++
  } else {
    // New window
    docsAccessCache.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  }

  // Cleanup old entries
  if (docsAccessCache.size > 1000) {
    for (const [key, value] of docsAccessCache.entries()) {
      if (value.resetAt < now) {
        docsAccessCache.delete(key)
      }
    }
  }

  return null
}
