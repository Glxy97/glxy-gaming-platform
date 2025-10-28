/**
 * Comprehensive Security Headers & Policies für GLXY Gaming Platform
 * Enterprise-grade Security Policy Implementation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// Content Security Policy Builder
export class CSPBuilder {
  private directives: Map<string, string[]> = new Map()
  private nonce: string

  constructor() {
    this.nonce = randomBytes(16).toString('base64')
    this.initializeDefaults()
  }

  private initializeDefaults(): void {
    this.directives.set('default-src', ["'self'"])
    this.directives.set('object-src', ["'none'"])
    this.directives.set('base-uri', ["'self'"])
    this.directives.set('form-action', ["'self'"])
  }

  addDirective(directive: string, sources: string[]): this {
    const existing = this.directives.get(directive) || []
    this.directives.set(directive, [...existing, ...sources])
    return this
  }

  addNonceSource(directive: string): this {
    const existing = this.directives.get(directive) || []
    existing.push(`'nonce-${this.nonce}'`)
    this.directives.set(directive, existing)
    return this
  }

  addHashSource(directive: string, content: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'): this {
    const hash = createHash(algorithm).update(content).digest('base64')
    const existing = this.directives.get(directive) || []
    existing.push(`'${algorithm}-${hash}'`)
    this.directives.set(directive, existing)
    return this
  }

  build(): { policy: string; nonce: string } {
    const policyParts: string[] = []

    for (const [directive, sources] of this.directives) {
      policyParts.push(`${directive} ${sources.join(' ')}`)
    }

    return {
      policy: policyParts.join('; '),
      nonce: this.nonce
    }
  }

  // Vordefinierte Policy für Gaming-Platform
  static buildGamingPlatformCSP(nonce?: string): { policy: string; nonce: string } {
    const builder = new CSPBuilder()

    if (nonce) {
      builder.nonce = nonce
    }

    return builder
      // Script sources
      .addDirective('script-src', [
        "'self'",
        "'strict-dynamic'",
        'https://apis.google.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com'
      ])
      .addNonceSource('script-src')

      // Style sources
      .addDirective('style-src', [
        "'self'",
        'https://fonts.googleapis.com'
      ])
      .addNonceSource('style-src')

      // Image sources
      .addDirective('img-src', [
        "'self'",
        'data:',
        'blob:',
        'https:',
        '*.gravatar.com',
        '*.githubusercontent.com'
      ])

      // Font sources
      .addDirective('font-src', [
        "'self'",
        'https://fonts.gstatic.com'
      ])

      // Connection sources (für API calls)
      .addDirective('connect-src', [
        "'self'",
        'wss:',
        'https:',
        'https://api.github.com',
        'https://accounts.google.com'
      ])

      // Frame sources
      .addDirective('frame-src', [
        "'self'",
        'https://www.google.com',
        'https://accounts.google.com'
      ])

      // Worker sources
      .addDirective('worker-src', [
        "'self'",
        'blob:'
      ])

      // Manifest source
      .addDirective('manifest-src', ["'self'"])

      // Media sources
      .addDirective('media-src', [
        "'self'",
        'blob:',
        'data:'
      ])

      // Additional security directives
      .addDirective('upgrade-insecure-requests', [])
      .addDirective('block-all-mixed-content', [])

      .build()
  }
}

// Comprehensive Security Headers
export class SecurityHeaders {
  static getEnhancedHeaders(request?: NextRequest): Record<string, string> {
    const csp = CSPBuilder.buildGamingPlatformCSP()

    return {
      // Content Security Policy
      'Content-Security-Policy': csp.policy,

      // Strict Transport Security
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

      // Frame Options
      'X-Frame-Options': 'DENY',

      // Content Type Options
      'X-Content-Type-Options': 'nosniff',

      // XSS Protection
      'X-XSS-Protection': '1; mode=block',

      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions Policy (Feature Policy)
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
        'ambient-light-sensor=()',
        'autoplay=(self)',
        'encrypted-media=(self)',
        'fullscreen=(self)',
        'picture-in-picture=(self)'
      ].join(', '),

      // Cross-Origin Policies
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',

      // Server Information Hiding
      'Server': '',
      'X-Powered-By': '',

      // Cache Control für sensitive Seiten
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',

      // Additional Security Headers
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-Download-Options': 'noopen',
      'X-DNS-Prefetch-Control': 'off',

      // CSP Nonce für dynamische Inhalte
      'X-CSP-Nonce': csp.nonce
    }
  }

  // Route-spezifische Header
  static getRouteSpecificHeaders(route: string): Record<string, string> {
    const baseHeaders = this.getEnhancedHeaders()

    // Admin-spezifische Header
    if (route.startsWith('/admin') || route.startsWith('/console')) {
      return {
        ...baseHeaders,
        'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload; always',

        // Erweiterte CSP für Admin-Bereiche
        'Content-Security-Policy': baseHeaders['Content-Security-Policy'] + '; report-uri /api/csp-violations'
      }
    }

    // API-spezifische Header
    if (route.startsWith('/api')) {
      return {
        ...baseHeaders,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Type': 'application/json; charset=utf-8',

        // API Rate Limiting Headers
        'X-RateLimit-Policy': 'general=50/min; api=30/min; auth=10/min'
      }
    }

    // Gaming-spezifische Header
    if (route.startsWith('/games')) {
      return {
        ...baseHeaders,
        // Erlaube WebGL und Gaming-Features
        'Permissions-Policy': baseHeaders['Permissions-Policy'] + ', gamepad=(self), webxr=(self)'
      }
    }

    return baseHeaders
  }
}

// Security.txt Implementation
export const SECURITY_TXT_CONTENT = `Contact: security@glxy.at
Contact: mailto:security@glxy.at
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Encryption: https://glxy.at/.well-known/pgp-key.txt
Acknowledgments: https://glxy.at/security/hall-of-fame
Preferred-Languages: en, de
Canonical: https://glxy.at/.well-known/security.txt
Policy: https://glxy.at/security/disclosure-policy

# GLXY Gaming Platform Security Information
#
# We take security seriously. If you discover a security vulnerability,
# please report it to us through one of the contact methods above.
#
# Please provide:
# - Detailed description of the vulnerability
# - Steps to reproduce
# - Potential impact assessment
# - Your contact information for follow-up
#
# We commit to:
# - Acknowledge receipt within 24 hours
# - Provide regular updates on our investigation
# - Credit you in our hall of fame (if desired)
# - Work with you on responsible disclosure
#
# Bounty Program: We offer rewards for valid security reports
# Scope: *.glxy.at, API endpoints, mobile applications
# Out of Scope: Social engineering, physical attacks, DoS attacks
`

// Robots.txt für Sicherheit
export const ROBOTS_TXT_CONTENT = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /console*/
Disallow: /api/
Disallow: /.well-known/
Disallow: /private/
Disallow: /internal/
Disallow: /logs/
Disallow: /backup/
Disallow: /temp/
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /*.sql$
Disallow: /*.bak$

# Security-sensitive areas
Disallow: /auth/
Disallow: /profile/settings/
Disallow: /account/

# Crawl-delay for bots
Crawl-delay: 1

# Sitemap
Sitemap: https://glxy.at/sitemap.xml

# Security note: This file helps prevent accidental exposure
# of sensitive areas to search engine crawlers
`

// Middleware für Security Headers
export function securityHeadersMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const pathname = request.nextUrl.pathname

  // Hole route-spezifische Header
  const headers = SecurityHeaders.getRouteSpecificHeaders(pathname)

  // Wende Header auf Response an
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      response.headers.set(key, value)
    }
  }

  // Entferne potentiell gefährliche Header
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  return response
}

// CSP Violation Reporting
export interface CSPViolationReport {
  documentUri: string
  referrer: string
  violatedDirective: string
  effectiveDirective: string
  originalPolicy: string
  blockedUri: string
  statusCode: number
  sourceFile?: string
  lineNumber?: number
  columnNumber?: number
}

export class CSPViolationHandler {
  static async processViolation(report: CSPViolationReport): Promise<void> {
    // Filtere bekannte false-positives
    if (this.isKnownFalsePositive(report)) {
      return
    }

    // Bewerte Schweregrad
    const severity = this.assessSeverity(report)

    // Logge Violation
    console.warn('🚫 CSP Violation:', {
      severity,
      directive: report.violatedDirective,
      blockedUri: report.blockedUri,
      source: report.sourceFile,
      timestamp: new Date().toISOString()
    })

    // Bei kritischen Violations: Sofortige Benachrichtigung
    if (severity === 'critical') {
      await this.sendSecurityAlert(report)
    }

    // Speichere für Analyse
    await this.storeViolation(report, severity)
  }

  private static isKnownFalsePositive(report: CSPViolationReport): boolean {
    const falsePositives = [
      'chrome-extension:',
      'moz-extension:',
      'safari-extension:',
      'data:text/html,chromewebdata'
    ]

    return falsePositives.some(pattern =>
      report.blockedUri.startsWith(pattern)
    )
  }

  private static assessSeverity(report: CSPViolationReport): 'low' | 'medium' | 'high' | 'critical' {
    // Kritisch: Inline-Script-Versuche
    if (report.violatedDirective.includes('script-src') &&
        report.blockedUri === 'inline') {
      return 'critical'
    }

    // Hoch: Externe unerlaubte Domains
    if (report.blockedUri.startsWith('http') &&
        !report.blockedUri.includes('glxy.at')) {
      return 'high'
    }

    // Medium: Style-Violations
    if (report.violatedDirective.includes('style-src')) {
      return 'medium'
    }

    return 'low'
  }

  private static async sendSecurityAlert(report: CSPViolationReport): Promise<void> {
    // In Produktion: Sende an Security-Team
    console.error('🔥 CRITICAL CSP VIOLATION - Immediate attention required!', report)
  }

  private static async storeViolation(
    report: CSPViolationReport,
    severity: string
  ): Promise<void> {
    // In Produktion: Speichere in Security-Database
    // Für Trending-Analyse und Pattern-Detection
  }
}

// Feature Policy Helper
export class FeaturePolicy {
  private static readonly GAMING_FEATURES = [
    'gamepad',
    'webxr',
    'accelerometer',
    'gyroscope',
    'magnetometer'
  ]

  private static readonly MEDIA_FEATURES = [
    'camera',
    'microphone',
    'speaker-selection'
  ]

  private static readonly PAYMENT_FEATURES = [
    'payment'
  ]

  static buildPolicy(
    enableGaming: boolean = true,
    enableMedia: boolean = false,
    enablePayments: boolean = false
  ): string {
    const policies: string[] = []

    // Gaming-Features
    if (enableGaming) {
      this.GAMING_FEATURES.forEach(feature => {
        policies.push(`${feature}=(self)`)
      })
    } else {
      this.GAMING_FEATURES.forEach(feature => {
        policies.push(`${feature}=()`)
      })
    }

    // Media-Features
    if (enableMedia) {
      this.MEDIA_FEATURES.forEach(feature => {
        policies.push(`${feature}=(self)`)
      })
    } else {
      this.MEDIA_FEATURES.forEach(feature => {
        policies.push(`${feature}=()`)
      })
    }

    // Payment-Features
    if (enablePayments) {
      this.PAYMENT_FEATURES.forEach(feature => {
        policies.push(`${feature}=(self)`)
      })
    } else {
      this.PAYMENT_FEATURES.forEach(feature => {
        policies.push(`${feature}=()`)
      })
    }

    // Immer deaktivierte Features
    const alwaysDisabled = [
      'usb=()',
      'serial=()',
      'midi=()',
      'bluetooth=()',
      'ambient-light-sensor=()',
      'document-domain=()'
    ]

    policies.push(...alwaysDisabled)

    return policies.join(', ')
  }
}

export default {
  CSPBuilder,
  SecurityHeaders,
  SECURITY_TXT_CONTENT,
  ROBOTS_TXT_CONTENT,
  securityHeadersMiddleware,
  CSPViolationHandler,
  FeaturePolicy
}