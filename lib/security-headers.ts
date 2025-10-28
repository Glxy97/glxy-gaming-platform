/**
 * GLXY Gaming Platform - Security Headers Utility
 * Centralized security headers management
 */

import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export interface SecurityHeadersConfig {
  csp?: {
    enableNonce?: boolean
    reportUri?: string
    reportOnly?: boolean
    customDirectives?: Record<string, string>
  }
  hsts?: {
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  additionalHeaders?: Record<string, string>
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateCSPNonce(): string {
  try {
    // Node.js environment (middleware runs on server)
    const bytes = randomBytes(16)
    return bytes.toString('base64').replace(/[+/=]/g, '')
  } catch (error) {
    // Fallback for environments without crypto
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }
}

/**
 * Generate Content Security Policy header value
 */
export function generateCSP(config: SecurityHeadersConfig['csp'] = {}): {
  headerValue: string
  nonce?: string
} {
  const nonce = config.enableNonce ? generateCSPNonce() : undefined
  const nonceStr = nonce ? ` 'nonce-${nonce}'` : ''

  const defaultDirectives = {
    'default-src': "'self'",
    'script-src': `'self'${nonceStr} https://apis.google.com https://accounts.google.com`,
    'worker-src': "'self' blob:",
    'style-src': `'self'${nonceStr} https://fonts.googleapis.com`,
    'img-src': "'self' data: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://github.com",
    'font-src': "'self' https://fonts.gstatic.com",
    'connect-src': "'self' wss: https://api.github.com https://accounts.google.com https://oauth2.googleapis.com",
    'frame-src': "'self' https://accounts.google.com https://github.com",
    'form-action': "'self' https://github.com https://accounts.google.com",
    'base-uri': "'self'",
    'object-src': "'none'",
    'media-src': "'none'",
    'manifest-src': "'self'",
    'upgrade-insecure-requests': '',
    'block-all-mixed-content': ''
  }

  // Merge with custom directives
  const directives = { ...defaultDirectives, ...config.customDirectives }

  // Add report URI if specified
  if (config.reportUri) {
    directives['report-uri'] = config.reportUri
  }

  // Build CSP string
  const cspValue = Object.entries(directives)
    .map(([key, value]) => value ? `${key} ${value}` : key)
    .join('; ')

  return {
    headerValue: cspValue,
    nonce
  }
}

/**
 * Apply comprehensive security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {

  // 1. Content Security Policy
  const cspConfig = config.csp || { enableNonce: true }
  const { headerValue: cspValue, nonce } = generateCSP(cspConfig)

  const cspHeaderName = cspConfig.reportOnly ?
    'Content-Security-Policy-Report-Only' :
    'Content-Security-Policy'

  response.headers.set(cspHeaderName, cspValue)

  // 2. HTTP Strict Transport Security
  const hstsConfig = config.hsts || {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }

  const hstsValue = [
    `max-age=${hstsConfig.maxAge}`,
    hstsConfig.includeSubDomains && 'includeSubDomains',
    hstsConfig.preload && 'preload'
  ].filter(Boolean).join('; ')

  response.headers.set('Strict-Transport-Security', hstsValue)

  // 3. Core Security Headers
  const securityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), usb=(), bluetooth=(), payment=(), accelerometer=(), gyroscope=(), magnetometer=()',

    // Remove server information
    'Server': '',

    // Prevent caching of sensitive pages
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  }

  // Apply core headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // 4. Additional custom headers
  if (config.additionalHeaders) {
    Object.entries(config.additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  // 5. Store nonce in response for use in components
  if (nonce) {
    response.headers.set('X-CSP-Nonce', nonce)
  }

  return response
}

/**
 * Security headers for API routes
 */
export function applyAPISecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response, {
    csp: {
      enableNonce: false,
      customDirectives: {
        'default-src': "'none'",
        'frame-ancestors': "'none'"
      }
    },
    additionalHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive'
    }
  })
}

/**
 * Security headers for admin pages
 */
export function applyAdminSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response, {
    csp: {
      enableNonce: true,
      customDirectives: {
        'script-src': process.env.NODE_ENV === 'development'
          ? "'self' 'unsafe-eval' 'unsafe-inline'"
          : "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline'",
        'worker-src': "'self' blob:",
        'img-src': "'self' data: blob:",
        'font-src': "'self' data:",
        'connect-src': "'self' wss: ws:",
        'media-src': "'self' blob: data:",
        'child-src': "'self' blob:"
      }
    },
    additionalHeaders: {
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

/**
 * Security headers for authentication pages
 */
export function applyAuthSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response, {
    csp: {
      enableNonce: true,
      customDirectives: {
        'script-src': process.env.NODE_ENV === 'development'
          ? "'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com"
          : "'self' 'unsafe-inline' https://accounts.google.com",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'img-src': "'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
        'font-src': "'self' https://fonts.gstatic.com data:",
        'connect-src': "'self' https://accounts.google.com https://oauth2.googleapis.com",
        'frame-src': "'self' https://accounts.google.com",
        'frame-ancestors': "'none'",
        'form-action': "'self' https://accounts.google.com https://github.com"
      }
    },
    additionalHeaders: {
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-cache, no-store, must-revalidate, private'
    }
  })
}

/**
 * Get CSP nonce from request headers (for React components)
 */
export function getCSPNonce(headers: Headers): string | undefined {
  return headers.get('X-CSP-Nonce') || undefined
}