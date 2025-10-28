/**
 * Enhanced Security Middleware für GLXY Gaming Platform
 * Production-ready security controls mit comprehensive protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { SecurityMiddleware } from '@/lib/application-security-controls'
import { securityHeadersMiddleware } from '@/lib/security-policies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and API health checks
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/api/health'
  ) {
    return NextResponse.next()
  }

  try {
    // Apply security controls
    const securityResult = await SecurityMiddleware.processRequest(request)

    if (!securityResult.allowed) {
      // Request blocked by security controls
      return securityResult.response!
    }

    // Continue with request
    const response = NextResponse.next()

    // Apply security headers
    const enhancedResponse = securityHeadersMiddleware(request, response)

    // Add additional security headers from security controls
    for (const [key, value] of Object.entries(securityResult.securityHeaders)) {
      enhancedResponse.headers.set(key, value)
    }

    // Admin area additional security
    if (pathname.startsWith('/admin') || pathname.startsWith('/console')) {
      enhancedResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
      enhancedResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    }

    // API security headers
    if (pathname.startsWith('/api')) {
      enhancedResponse.headers.set('X-Content-Type-Options', 'nosniff')
      enhancedResponse.headers.set('X-Frame-Options', 'DENY')
    }

    return enhancedResponse

  } catch (error) {
    console.error('Security middleware error:', error)

    // Fail securely - block request on middleware error
    return NextResponse.json(
      { error: 'Security validation failed' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health checks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
}