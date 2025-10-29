/**
 * Content Security Policy (CSP) Middleware
 * Enhanced security headers for XSS protection
 */

import { NextResponse } from 'next/server'

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' ws: wss: https:",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  
  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS (HTTP Strict Transport Security)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  return response
}

/**
 * CSP for API routes
 */
export function addAPISecurityHeaders(response: NextResponse): NextResponse {
  // More restrictive CSP for API routes
  const csp = [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'none'",
    "img-src 'none'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

/**
 * CSP for WebSocket connections
 */
export function addWebSocketSecurityHeaders(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data: https://r2cdn.perplexity.ai https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' ws: wss: blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "worker-src 'self' blob:"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  
  return response
}

/**
 * CSP for PDF viewer
 */
export function addPDFViewerSecurityHeaders(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "frame-src 'self'",
    "object-src 'self'",
    "worker-src 'self' blob:"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  
  return response
}

/**
 * Validate and sanitize request headers
 */
export function sanitizeHeaders(headers: Headers): Headers {
  const sanitizedHeaders = new Headers()
  
  // Only allow safe headers
  const allowedHeaders = [
    'content-type',
    'authorization',
    'user-agent',
    'accept',
    'accept-language',
    'accept-encoding',
    'cache-control',
    'connection',
    'host',
    'referer',
    'origin',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-real-ip'
  ]
  
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (allowedHeaders.includes(lowerKey)) {
      // Sanitize header values
      const sanitizedValue = value
        .replace(/[<>\"'&]/g, '') // Remove dangerous characters
        .substring(0, 1000) // Limit length
      
      sanitizedHeaders.set(key, sanitizedValue)
    }
  })
  
  return sanitizedHeaders
}

/**
 * Rate limiting headers
 */
export function addRateLimitHeaders(response: NextResponse, limit: number, remaining: number, resetTime: number): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  
  return response
}

/**
 * CORS headers for API routes
 */
export function addCORSHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    'https://glxy.at',
    'https://www.glxy.at',
    'http://localhost:3000',
    'http://localhost:3001'
  ]
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    response.headers.set('Access-Control-Allow-Origin', 'https://glxy.at')
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}
