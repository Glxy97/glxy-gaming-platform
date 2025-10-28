// @ts-nocheck
// ========================================
// GLXY Gaming Platform - Enhanced Middleware
// Includes /docs Protection + Existing Security
// ========================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurityHeaders, applyAdminSecurityHeaders, applyAuthSecurityHeaders, applyAPISecurityHeaders } from './lib/security-headers'
import { protectDocsRoute, rateLimitDocsAccess } from './middleware-docs-protection'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internal routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // ========================================
  // NEW: /docs Protection
  // ========================================
  if (pathname.startsWith('/docs')) {
    // 1. Rate Limiting Check
    const rateLimitResponse = rateLimitDocsAccess(request)
    if (rateLimitResponse) return rateLimitResponse

    // 2. Authentication & Authorization Check
    const docsProtectionResponse = await protectDocsRoute(request)
    if (docsProtectionResponse) return docsProtectionResponse
  }

  // ========================================
  // Existing /admin Protection
  // ========================================
  if (pathname.startsWith('/admin')) {
    const hasSessionCookie = request.cookies.has('__Secure-next-auth.session-token') ||
                             request.cookies.has('next-auth.session-token')
    if (!hasSessionCookie) {
      const url = new URL('/auth/signin?from=admin', request.url)
      return NextResponse.redirect(url)
    }
  }

  // Create response
  const response = NextResponse.next()

  // Apply security headers based on route type
  if (pathname.startsWith('/api/')) {
    return applyAPISecurityHeaders(response)
  } else if (pathname.startsWith('/admin')) {
    return applyAdminSecurityHeaders(response)
  } else if (pathname.startsWith('/auth')) {
    return applyAuthSecurityHeaders(response)
  } else {
    // Apply standard security headers with Next.js compatibility
    return applySecurityHeaders(response, {
      csp: {
        enableNonce: true,
        customDirectives: {
          // Next.js specific directives for proper functionality
          'script-src': process.env.NODE_ENV === 'development'
            ? "'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://va.vercel-scripts.com"
            : "'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://va.vercel-scripts.com",
          'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
          'worker-src': "'self' blob:",
          'img-src': "'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://github.com https://glxy.at",
          'font-src': "'self' https://fonts.gstatic.com data:",
          'connect-src': "'self' wss: ws: https://api.github.com https://accounts.google.com https://oauth2.googleapis.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
          'frame-src': "'self' https://accounts.google.com https://github.com",
          'form-action': "'self' https://github.com https://accounts.google.com",
          'base-uri': "'self'",
          'object-src': "'none'",
          'media-src': "'self' blob: data:",
          'manifest-src': "'self'",
          'child-src': "'self' blob:",
        }
      }
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs',
}
