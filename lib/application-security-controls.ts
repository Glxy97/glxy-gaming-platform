/**
 * Application Security Controls für GLXY Gaming Platform
 * Enterprise-grade Application-Level Security Implementation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { headers } from 'next/headers'

// Rate Limiting System
export class AdvancedRateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number; blocked: boolean }>()
  private static blockedIPs = new Set<string>()

  static async checkRateLimit(
    identifier: string,
    limits: {
      requests: number
      windowMs: number
      blockDurationMs?: number
    }
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    blocked: boolean
  }> {
    const now = Date.now()
    const record = this.requests.get(identifier)

    // Check if IP is permanently blocked
    if (this.blockedIPs.has(identifier)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (limits.blockDurationMs || 3600000),
        blocked: true
      }
    }

    if (!record || now > record.resetTime) {
      // Reset or initialize
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + limits.windowMs,
        blocked: false
      })

      return {
        allowed: true,
        remaining: limits.requests - 1,
        resetTime: now + limits.windowMs,
        blocked: false
      }
    }

    record.count++

    if (record.count > limits.requests) {
      // Rate limit exceeded
      record.blocked = true

      // If blocking is enabled, add to blocked list
      if (limits.blockDurationMs) {
        this.blockedIPs.add(identifier)
        setTimeout(() => {
          this.blockedIPs.delete(identifier)
        }, limits.blockDurationMs)
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        blocked: true
      }
    }

    return {
      allowed: true,
      remaining: limits.requests - record.count,
      resetTime: record.resetTime,
      blocked: false
    }
  }

  // Adaptive rate limiting based on behavior
  static async adaptiveRateLimit(
    identifier: string,
    baseRules: { requests: number; windowMs: number },
    riskScore: number = 0
  ) {
    // Adjust limits based on risk score
    const adjustedLimits = {
      requests: Math.max(1, Math.floor(baseRules.requests * (1 - riskScore / 100))),
      windowMs: baseRules.windowMs,
      blockDurationMs: riskScore > 80 ? 3600000 : undefined // 1 hour block for high risk
    }

    return this.checkRateLimit(identifier, adjustedLimits)
  }

  // IP reputation scoring
  static calculateIPReputation(ip: string, userAgent: string): number {
    let riskScore = 0

    // Check for known bad patterns
    const suspiciousUserAgents = [
      'scanner', 'bot', 'crawler', 'curl', 'wget', 'python', 'postman'
    ]

    if (suspiciousUserAgents.some(pattern =>
      userAgent.toLowerCase().includes(pattern))) {
      riskScore += 30
    }

    // Check request frequency from this IP
    const record = this.requests.get(ip)
    if (record && record.count > 50) {
      riskScore += 25
    }

    // Geographic checks (simplified)
    // In production: Use IP geolocation service
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1') {
      riskScore -= 20 // Local/trusted networks
    }

    return Math.max(0, Math.min(100, riskScore))
  }
}

// Web Application Firewall (WAF)
export class WebApplicationFirewall {
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(\'|(\'\')|(\-\-)|(\;)|(\|)|(\*)|(\%))/,
    /(\bor\b.*\=.*\=|\band\b.*\=.*\=)/i,
    /(script|javascript|vbscript|iframe|object|embed|form)/i
  ]

  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*\s+on\w+\s*=/gi
  ]

  private static readonly COMMAND_INJECTION_PATTERNS = [
    /(\||&|;|\$\(|\`|<|>)/,
    /(nc|ncat|netcat|curl|wget|python|perl|php|ruby)/i,
    /(\/bin\/|\/usr\/bin\/|\/etc\/passwd|\/etc\/shadow)/i
  ]

  static analyzeRequest(request: {
    url: string
    method: string
    headers: Record<string, string>
    body?: string
    queryParams: URLSearchParams
    ip: string
  }): {
    threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
    threats: string[]
    shouldBlock: boolean
    score: number
  } {
    const threats: string[] = []
    let score = 0

    // Analyze URL
    const urlThreats = this.scanForThreats(request.url)
    threats.push(...urlThreats.threats)
    score += urlThreats.score

    // Analyze query parameters
    for (const [key, value] of request.queryParams) {
      const paramThreats = this.scanForThreats(`${key}=${value}`)
      threats.push(...paramThreats.threats.map(t => `Query param ${key}: ${t}`))
      score += paramThreats.score
    }

    // Analyze request body
    if (request.body) {
      const bodyThreats = this.scanForThreats(request.body)
      threats.push(...bodyThreats.threats.map(t => `Request body: ${t}`))
      score += bodyThreats.score
    }

    // Analyze headers
    const dangerousHeaders = ['x-forwarded-for', 'user-agent', 'referer']
    dangerousHeaders.forEach(header => {
      const value = request.headers[header]
      if (value) {
        const headerThreats = this.scanForThreats(value)
        threats.push(...headerThreats.threats.map(t => `Header ${header}: ${t}`))
        score += headerThreats.score
      }
    })

    // Request method analysis
    if (['TRACE', 'TRACK', 'CONNECT'].includes(request.method.toUpperCase())) {
      threats.push('Potentially dangerous HTTP method')
      score += 30
    }

    // Determine threat level
    let threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'
    if (score >= 80) threatLevel = 'critical'
    else if (score >= 60) threatLevel = 'high'
    else if (score >= 40) threatLevel = 'medium'
    else if (score >= 20) threatLevel = 'low'

    return {
      threatLevel,
      threats,
      shouldBlock: threatLevel === 'critical' || threatLevel === 'high',
      score
    }
  }

  private static scanForThreats(input: string): { threats: string[]; score: number } {
    const threats: string[] = []
    let score = 0

    // SQL Injection detection
    this.SQL_INJECTION_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push('SQL injection attempt detected')
        score += 40
      }
    })

    // XSS detection
    this.XSS_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push('Cross-site scripting (XSS) attempt detected')
        score += 35
      }
    })

    // Command injection detection
    this.COMMAND_INJECTION_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push('Command injection attempt detected')
        score += 45
      }
    })

    // Path traversal detection
    if (input.includes('../') || input.includes('..\\') || input.includes('%2e%2e')) {
      threats.push('Path traversal attempt detected')
      score += 30
    }

    // Large input detection
    if (input.length > 10000) {
      threats.push('Suspiciously large input detected')
      score += 20
    }

    return { threats, score }
  }
}

// Session Security Management
export class SessionSecurityManager {
  private static activeSessions = new Map<string, {
    userId: string
    createdAt: Date
    lastActivity: Date
    ipAddress: string
    userAgent: string
    deviceFingerprint: string
    riskScore: number
  }>()

  static createSecureSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint: string
  ): {
    sessionId: string
    expiresAt: Date
    csrfToken: string
  } {
    const sessionId = this.generateSecureSessionId()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    const csrfToken = this.generateCSRFToken()

    this.activeSessions.set(sessionId, {
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      deviceFingerprint,
      riskScore: 0
    })

    return { sessionId, expiresAt, csrfToken }
  }

  static validateSession(
    sessionId: string,
    currentIP: string,
    currentUserAgent: string,
    currentFingerprint: string
  ): {
    valid: boolean
    reason?: string
    riskScore: number
  } {
    const session = this.activeSessions.get(sessionId)

    if (!session) {
      return { valid: false, reason: 'Session not found', riskScore: 100 }
    }

    let riskScore = session.riskScore

    // Check session age
    const sessionAge = Date.now() - session.createdAt.getTime()
    if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
      return { valid: false, reason: 'Session expired', riskScore: 0 }
    }

    // Check inactivity
    const inactiveTime = Date.now() - session.lastActivity.getTime()
    if (inactiveTime > 2 * 60 * 60 * 1000) { // 2 hours
      return { valid: false, reason: 'Session inactive', riskScore: 0 }
    }

    // IP address validation
    if (session.ipAddress !== currentIP) {
      riskScore += 40
    }

    // User agent validation
    if (session.userAgent !== currentUserAgent) {
      riskScore += 30
    }

    // Device fingerprint validation
    if (session.deviceFingerprint !== currentFingerprint) {
      riskScore += 50
    }

    // Update session activity
    session.lastActivity = new Date()
    session.riskScore = riskScore

    // High risk sessions should be terminated
    if (riskScore >= 80) {
      this.activeSessions.delete(sessionId)
      return { valid: false, reason: 'High risk session terminated', riskScore }
    }

    return { valid: true, riskScore }
  }

  private static generateSecureSessionId(): string {
    return randomBytes(32).toString('hex')
  }

  private static generateCSRFToken(): string {
    return randomBytes(24).toString('base64url')
  }

  static invalidateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId)
  }

  static invalidateAllUserSessions(userId: string): number {
    let invalidated = 0
    for (const [sessionId, session] of this.activeSessions) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId)
        invalidated++
      }
    }
    return invalidated
  }
}

// CSRF Protection
export class CSRFProtection {
  private static validTokens = new Map<string, {
    sessionId: string
    createdAt: Date
    used: boolean
  }>()

  static generateToken(sessionId: string): string {
    const token = randomBytes(32).toString('base64url')

    this.validTokens.set(token, {
      sessionId,
      createdAt: new Date(),
      used: false
    })

    // Clean up expired tokens
    this.cleanupExpiredTokens()

    return token
  }

  static validateToken(token: string, sessionId: string): boolean {
    const tokenData = this.validTokens.get(token)

    if (!tokenData) {
      return false
    }

    // Check if token belongs to session
    if (tokenData.sessionId !== sessionId) {
      return false
    }

    // Check if token has been used (single use)
    if (tokenData.used) {
      return false
    }

    // Check token age (15 minutes max)
    const tokenAge = Date.now() - tokenData.createdAt.getTime()
    if (tokenAge > 15 * 60 * 1000) {
      this.validTokens.delete(token)
      return false
    }

    // Mark as used
    tokenData.used = true

    return true
  }

  private static cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [token, data] of this.validTokens) {
      const age = now - data.createdAt.getTime()
      if (age > 15 * 60 * 1000 || data.used) {
        this.validTokens.delete(token)
      }
    }
  }
}

// Security Event Logger
export class SecurityEventLogger {
  static async logSecurityEvent(event: {
    type: 'authentication' | 'authorization' | 'input_validation' | 'rate_limit' | 'waf_block' | 'session_anomaly'
    severity: 'info' | 'warning' | 'error' | 'critical'
    userId?: string
    ipAddress: string
    userAgent: string
    details: Record<string, any>
    timestamp?: Date
  }): Promise<void> {
    const logEntry = {
      id: randomBytes(16).toString('hex'),
      timestamp: event.timestamp || new Date(),
      ...event
    }

    // Console logging (in production: send to logging service)
    const emoji = this.getSeverityEmoji(event.severity)
    console.log(`${emoji} [SECURITY] ${event.type.toUpperCase()}:`, {
      severity: event.severity,
      ip: event.ipAddress,
      user: event.userId || 'anonymous',
      details: event.details
    })

    // Store in database (in production)
    // await this.storeSecurityEvent(logEntry)

    // Send alerts for critical events
    if (event.severity === 'critical') {
      await this.sendSecurityAlert(logEntry)
    }
  }

  private static getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'info': return 'ℹ️'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'critical': return '🚨'
      default: return '📝'
    }
  }

  private static async sendSecurityAlert(event: any): Promise<void> {
    // In production: Send to security team via email/Slack/PagerDuty
    console.error('🚨 CRITICAL SECURITY ALERT:', event)
  }
}

// Application Security Middleware
export class SecurityMiddleware {
  static async processRequest(
    request: NextRequest
  ): Promise<{
    allowed: boolean
    response?: NextResponse
    securityHeaders: Record<string, string>
  }> {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''

    // 1. Rate limiting check
    const riskScore = AdvancedRateLimiter.calculateIPReputation(ip, userAgent)
    const rateLimitResult = await AdvancedRateLimiter.adaptiveRateLimit(
      ip,
      { requests: 100, windowMs: 60000 }, // 100 requests per minute
      riskScore
    )

    if (!rateLimitResult.allowed) {
      await SecurityEventLogger.logSecurityEvent({
        type: 'rate_limit',
        severity: 'warning',
        ipAddress: ip,
        userAgent,
        details: { riskScore, remaining: rateLimitResult.remaining }
      })

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        ),
        securityHeaders: {}
      }
    }

    // 2. WAF analysis
    const url = request.url
    const queryParams = new URL(url).searchParams
    let body = ''

    try {
      if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
        body = await request.text()
      }
    } catch {
      // Ignore body parsing errors
    }

    const wafResult = WebApplicationFirewall.analyzeRequest({
      url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      queryParams,
      ip
    })

    if (wafResult.shouldBlock) {
      await SecurityEventLogger.logSecurityEvent({
        type: 'waf_block',
        severity: wafResult.threatLevel === 'critical' ? 'critical' : 'error',
        ipAddress: ip,
        userAgent,
        details: {
          threats: wafResult.threats,
          score: wafResult.score,
          url: url
        }
      })

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Request blocked by security policy' },
          { status: 403 }
        ),
        securityHeaders: {}
      }
    }

    // 3. Generate security headers
    const securityHeaders = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }

    return {
      allowed: true,
      securityHeaders
    }
  }

  private static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           '127.0.0.1'
  }
}

export default {
  AdvancedRateLimiter,
  WebApplicationFirewall,
  SessionSecurityManager,
  CSRFProtection,
  SecurityEventLogger,
  SecurityMiddleware
}