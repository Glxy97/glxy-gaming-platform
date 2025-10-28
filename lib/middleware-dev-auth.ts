// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// Development Basic Auth Middleware
export function withDevAuth(request: NextRequest) {
  // Only apply in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.next()
  }

  // Skip auth for API routes that need to work without auth
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    // Development credentials
    const DEV_USER = process.env.DEV_AUTH_USER || 'glxy'
    const DEV_PASS = process.env.DEV_AUTH_PASS || 'dev2024!'

    if (user === DEV_USER && pwd === DEV_PASS) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Development Access Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="GLXY Development"',
    },
  })
}