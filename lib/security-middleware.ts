/**
 * GLXY Gaming Platform - Security Middleware
 * Enhanced security controls and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-server'
import { sanitizeInput, escapeHtml } from '@/lib/auth-security'

// Security configuration
const SECURITY_CONFIG = {
  rateLimit: {
    api: { max: 100, window: 60 * 1000 }, // 100 requests per minute
    auth: { max: 5, window: 60 * 1000 },   // 5 login attempts per minute
    admin: { max: 10, window: 60 * 1000 }  // 10 admin requests per minute
  },
  blocked: {
    ips: new Set<string>(),
    userAgents: [
      'sqlmap', 'nikto', 'nmap', 'masscan', 'zap',
      'burpsuite', 'w3af', 'dirbuster', 'gobuster'
    ]
  },
  suspicious: {
    patterns: [
      /\b(union|select|insert|update|delete|drop|exec|script)\b/i,
      /<script|javascript:|onload=|onerror=/i,
      /\.\.\//,
      /%2e%2e%2f/i,
      /etc\/passwd|etc\/shadow/i
    ]
  }
}

/**
 * Enhanced Rate Limiting with Redis
 */
export async function rateLimitCheck(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const current = await redis.get(key)
    const requests = current ? parseInt(current) : 0

    if (requests >= max) {
      const ttl = await redis.ttl(key)
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (ttl * 1000)
      }
    }

    const newCount = await redis.incr(key)
    if (newCount === 1) {
      await redis.expire(key, Math.floor(windowMs / 1000))
    }

    return {
      allowed: true,
      remaining: max - newCount,
      resetTime: Date.now() + windowMs
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open - allow request if Redis is down
    return { allowed: true, remaining: max, resetTime: Date.now() + windowMs }
  }
}

/**
 * IP-based blocking and monitoring
 */
export async function checkIPSecurity(ip: string): Promise<{
  blocked: boolean
  suspicious: boolean
  reason?: string
}> {
  // Check if IP is explicitly blocked
  if (SECURITY_CONFIG.blocked.ips.has(ip)) {
    return { blocked: true, suspicious: true, reason: 'IP explicitly blocked' }
  }

  // Check for known malicious IP patterns
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip === '127.0.0.1') {
    // Allow internal IPs
    return { blocked: false, suspicious: false }
  }

  try {
    // Check Redis for IP reputation
    const reputation = await redis.get(`ip_reputation:${ip}`)
    if (reputation) {
      const data = JSON.parse(reputation)
      if (data.blocked) {
        return { blocked: true, suspicious: true, reason: data.reason }
      }
      if (data.suspicious_requests > 10) {
        return { blocked: false, suspicious: true, reason: 'High suspicious activity' }
      }
    }
  } catch (error) {
    console.error('IP security check failed:', error)
  }

  return { blocked: false, suspicious: false }
}

/**
 * User Agent Analysis
 */
export function analyzeUserAgent(userAgent: string): {
  blocked: boolean
  suspicious: boolean
  reason?: string
} {
  if (!userAgent) {
    return { blocked: false, suspicious: true, reason: 'No user agent' }
  }

  const ua = userAgent.toLowerCase()

  // Check for security tools
  for (const tool of SECURITY_CONFIG.blocked.userAgents) {
    if (ua.includes(tool)) {
      return { blocked: true, suspicious: true, reason: `Security tool detected: ${tool}` }
    }
  }

  // Check for suspicious patterns
  if (ua.length < 10 || ua.length > 500) {
    return { blocked: false, suspicious: true, reason: 'Unusual user agent length' }
  }

  if (!/mozilla|chrome|safari|firefox|edge/i.test(ua)) {
    return { blocked: false, suspicious: true, reason: 'Non-standard user agent' }
  }

  return { blocked: false, suspicious: false }
}

/**
 * Request Content Analysis
 */
export function analyzeRequestContent(url: string, body?: string): {
  blocked: boolean
  suspicious: boolean
  reason?: string
} {
  // Check URL for suspicious patterns
  for (const pattern of SECURITY_CONFIG.suspicious.patterns) {
    if (pattern.test(url)) {
      return { blocked: true, suspicious: true, reason: 'Suspicious URL pattern' }
    }
  }

  // Check body content if present
  if (body) {
    for (const pattern of SECURITY_CONFIG.suspicious.patterns) {
      if (pattern.test(body)) {
        return { blocked: true, suspicious: true, reason: 'Suspicious content pattern' }
      }
    }
  }

  return { blocked: false, suspicious: false }
}

/**
 * Log Security Event
 */
export async function logSecurityEvent(
  event: {
    type: 'blocked' | 'suspicious' | 'rate_limited' | 'auth_failure'
    ip: string
    userAgent?: string
    url: string
    reason: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }
): Promise<void> {
  try {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    }

    // Store in Redis for immediate analysis
    await redis.lpush('security_events', JSON.stringify(logEntry))
    await redis.expire('security_events', 7 * 24 * 60 * 60) // 7 days

    // Console logging for development
    console.warn(`🚨 Security Event [${event.severity.toUpperCase()}]:`, logEntry)

    // TODO: Integrate with external SIEM/monitoring system

  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Update IP Reputation
 */
export async function updateIPReputation(
  ip: string,
  event: 'suspicious' | 'blocked' | 'auth_failure'
): Promise<void> {
  try {
    const key = `ip_reputation:${ip}`
    const existing = await redis.get(key)

    let data = existing ? JSON.parse(existing) : {
      ip,
      first_seen: Date.now(),
      suspicious_requests: 0,
      blocked_requests: 0,
      auth_failures: 0,
      blocked: false
    }

    data.last_seen = Date.now()

    switch (event) {
      case 'suspicious':
        data.suspicious_requests++
        break
      case 'blocked':
        data.blocked_requests++
        break
      case 'auth_failure':
        data.auth_failures++
        break
    }

    // Auto-block IPs with high suspicious activity
    if (data.suspicious_requests > 20 || data.blocked_requests > 5 || data.auth_failures > 10) {
      data.blocked = true
      SECURITY_CONFIG.blocked.ips.add(ip)
    }

    await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(data)) // 7 days TTL

  } catch (error) {
    console.error('Failed to update IP reputation:', error)
  }
}

/**
 * Main Security Middleware Function
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const url = request.url
  const pathname = request.nextUrl.pathname

  // 1. IP Security Check
  const ipCheck = await checkIPSecurity(ip)
  if (ipCheck.blocked) {
    await logSecurityEvent({
      type: 'blocked',
      ip,
      userAgent,
      url,
      reason: ipCheck.reason || 'IP blocked',
      severity: 'high'
    })

    return new NextResponse('Access Denied', { status: 403 })
  }

  // 2. User Agent Analysis
  const uaCheck = analyzeUserAgent(userAgent)
  if (uaCheck.blocked) {
    await logSecurityEvent({
      type: 'blocked',
      ip,
      userAgent,
      url,
      reason: uaCheck.reason || 'User agent blocked',
      severity: 'medium'
    })

    await updateIPReputation(ip, 'blocked')
    return new NextResponse('Access Denied', { status: 403 })
  }

  // 3. Request Content Analysis
  const contentCheck = analyzeRequestContent(url)
  if (contentCheck.blocked) {
    await logSecurityEvent({
      type: 'blocked',
      ip,
      userAgent,
      url,
      reason: contentCheck.reason || 'Suspicious content',
      severity: 'high'
    })

    await updateIPReputation(ip, 'blocked')
    return new NextResponse('Access Denied', { status: 403 })
  }

  // 4. Rate Limiting based on path
  let rateLimitConfig = SECURITY_CONFIG.rateLimit.api
  if (pathname.startsWith('/admin')) {
    rateLimitConfig = SECURITY_CONFIG.rateLimit.admin
  } else if (pathname.startsWith('/api/auth')) {
    rateLimitConfig = SECURITY_CONFIG.rateLimit.auth
  }

  const rateLimitKey = `rate_limit:${pathname.split('/')[1]}:${ip}`
  const rateLimit = await rateLimitCheck(
    rateLimitKey,
    rateLimitConfig.max,
    rateLimitConfig.window
  )

  if (!rateLimit.allowed) {
    await logSecurityEvent({
      type: 'rate_limited',
      ip,
      userAgent,
      url,
      reason: 'Rate limit exceeded',
      severity: 'medium'
    })

    return new NextResponse('Rate Limit Exceeded', {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': rateLimitConfig.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })
  }

  // 5. Log suspicious but allowed requests
  if (ipCheck.suspicious || uaCheck.suspicious || contentCheck.suspicious) {
    await logSecurityEvent({
      type: 'suspicious',
      ip,
      userAgent,
      url,
      reason: ipCheck.reason || uaCheck.reason || contentCheck.reason || 'General suspicion',
      severity: 'low'
    })

    await updateIPReputation(ip, 'suspicious')
  }

  // Request allowed - continue
  return null
}