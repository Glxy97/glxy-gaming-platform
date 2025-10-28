import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders, addAPISecurityHeaders, addWebSocketSecurityHeaders, addPDFViewerSecurityHeaders } from '@/lib/csp-middleware'

/**
 * Next.js Middleware - Edge Runtime Compatible
 *
 * Handles basic route protection without importing database code.
 * Full authentication checks happen server-side in API routes and pages.
 *
 * Protected routes:
 * - /web-adobe/* (except /web-adobe-demo)
 * - /dashboard/*
 * - /profile/*
 * - /admin/*
 *
 * Public routes:
 * - /auth/* (sign-in, sign-up, etc.)
 * - /web-adobe-demo
 * - /api/auth/* (NextAuth routes)
 * - Static files (/_next/*, /favicon.ico, etc.)
 */

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public routes that don't need authentication
  const publicRoutes = [
    '/web-adobe-demo',
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/setup-username', // OAuth username setup
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/api/public',
  ]

  // Check if route is public
  const isPublic = publicRoutes.some(route => path.startsWith(route))
  if (isPublic) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Protected routes that require authentication
  const protectedPaths = ['/web-adobe', '/dashboard', '/profile', '/admin']
  const isProtected = protectedPaths.some(route => path.startsWith(route))

  if (isProtected) {
    // Check for session cookie (simple check, full auth happens server-side)
    // NextAuth v5 uses 'authjs' prefix for cookie names
    const sessionToken =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value

    if (!sessionToken) {
      // Redirect to sign-in page with callback URL
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', path)
      const response = NextResponse.redirect(signInUrl)
      return addSecurityHeaders(response)
    }
  }

  // Add appropriate security headers based on route type
  let response = NextResponse.next()
  
  if (path.startsWith('/api/')) {
    response = addAPISecurityHeaders(response)
  } else if (path.startsWith('/web-adobe')) {
    response = addPDFViewerSecurityHeaders(response)
  } else if (path.startsWith('/multiplayer') || path.startsWith('/games')) {
    response = addWebSocketSecurityHeaders(response)
  } else {
    response = addSecurityHeaders(response)
  }

  return response
}

/**
 * Matcher configuration
 *
 * Defines which routes should be processed by this middleware.
 * Excludes static files and internal Next.js routes for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
