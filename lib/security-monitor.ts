import { redis } from '@/lib/redis-server'
import { prisma } from '@/lib/db'
import { getClientIP } from '@/lib/rate-limit'

export interface SecurityEvent {
  type: 'login_failure' | 'suspicious_activity' | 'account_lockout' | 'password_reset' | 'mfa_failure' | 'brute_force' | 'sql_injection' | 'xss_attempt'
  userId?: string
  email?: string
  ip: string
  userAgent?: string
  details: Record<string, any>
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ThreatDetectionRule {
  name: string
  pattern: RegExp | string
  action: 'log' | 'block' | 'alert'
  severity: SecurityEvent['severity']
}

// Advanced threat detection rules
export const THREAT_DETECTION_RULES: ThreatDetectionRule[] = [
  // SQL Injection attempts
  {
    name: 'SQL Injection',
    pattern: /(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+set|exec\s+|xp_|sp_|'.*or.*'.*=.*')/i,
    action: 'block',
    severity: 'critical'
  },

  // XSS attempts
  {
    name: 'XSS Attempt',
    pattern: /(<script|javascript:|onload=|onerror=|onclick=|<iframe|<object|<embed)/i,
    action: 'block',
    severity: 'high'
  },

  // Path traversal
  {
    name: 'Path Traversal',
    pattern: /(\.\.\/|\.\.\\|..%2f|..%5c)/i,
    action: 'block',
    severity: 'high'
  },

  // Command injection
  {
    name: 'Command Injection',
    pattern: /(\||\&|\;|\$\(|\`|<\(|>\()/,
    action: 'block',
    severity: 'critical'
  },

  // Suspicious user agents
  {
    name: 'Suspicious User Agent',
    pattern: /(sqlmap|nmap|nikto|w3af|acunetix|burp|owasp|zap)/i,
    action: 'alert',
    severity: 'medium'
  }
]

class SecurityMonitor {
  private static instance: SecurityMonitor
  private alertThreshold = {
    low: 100,
    medium: 50,
    high: 10,
    critical: 1
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in Redis for real-time monitoring (expire after 30 days)
      const eventKey = `security_event:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
      await redis.setex(eventKey, 30 * 24 * 60 * 60, JSON.stringify(event))

      // Store in database for long-term analysis
      await prisma.securityEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          email: event.email,
          ip: event.ip,
          userAgent: event.userAgent || null,
          details: event.details,
          severity: event.severity,
          createdAt: event.timestamp
        }
      }).catch(error => {
        // If the table doesn't exist, just log to console
        console.error('Database security event logging failed:', error)
      })

      // Check if we need to trigger alerts
      await this.checkAlertThresholds(event)

      // Update IP reputation
      await this.updateIPReputation(event.ip, event.severity)

    } catch (error) {
      console.error('Security event logging failed:', error)
    }
  }

  async checkThreatDetection(input: string, ip: string, userAgent?: string): Promise<ThreatDetectionRule[]> {
    const detectedThreats: ThreatDetectionRule[] = []

    for (const rule of THREAT_DETECTION_RULES) {
      if (typeof rule.pattern === 'string') {
        if (input.toLowerCase().includes(rule.pattern.toLowerCase())) {
          detectedThreats.push(rule)
        }
      } else {
        if (rule.pattern.test(input)) {
          detectedThreats.push(rule)
        }
      }
    }

    // Log any detected threats
    for (const threat of detectedThreats) {
      await this.logSecurityEvent({
        type: threat.name.toLowerCase().includes('sql') ? 'sql_injection' : 'xss_attempt',
        ip,
        userAgent,
        details: {
          detectedPattern: threat.name,
          input: input.substring(0, 500), // Truncate for privacy
          rule: threat.name
        },
        timestamp: new Date(),
        severity: threat.severity
      })
    }

    return detectedThreats
  }

  async checkBruteForceAttack(ip: string, email?: string): Promise<{ isAttack: boolean; attackLevel: string }> {
    try {
      const timeWindows = [
        { duration: 60, threshold: 10, level: 'low' },      // 10 attempts in 1 minute
        { duration: 300, threshold: 25, level: 'medium' },   // 25 attempts in 5 minutes
        { duration: 3600, threshold: 50, level: 'high' }     // 50 attempts in 1 hour
      ]

      for (const window of timeWindows) {
        const key = email ? `login_attempts:${email}:${window.duration}` : `login_attempts:${ip}:${window.duration}`
        const attempts = await redis.get(key)

        if (attempts && parseInt(attempts) >= window.threshold) {
          // Log brute force attack
          await this.logSecurityEvent({
            type: 'brute_force',
            email,
            ip,
            details: {
              attempts: parseInt(attempts),
              timeWindow: window.duration,
              threshold: window.threshold
            },
            timestamp: new Date(),
            severity: window.level as SecurityEvent['severity']
          })

          return { isAttack: true, attackLevel: window.level }
        }
      }

      return { isAttack: false, attackLevel: 'none' }
    } catch (error) {
      console.error('Brute force detection error:', error)
      return { isAttack: false, attackLevel: 'none' }
    }
  }

  private async checkAlertThresholds(event: SecurityEvent): Promise<void> {
    try {
      const timeWindow = 3600 // 1 hour
      const key = `security_alerts:${event.severity}:${timeWindow}`

      const currentCount = await redis.incr(key)
      await redis.expire(key, timeWindow)

      const threshold = this.alertThreshold[event.severity]

      if (currentCount >= threshold) {
        await this.triggerSecurityAlert(event.severity, currentCount, timeWindow)
      }
    } catch (error) {
      console.error('Alert threshold check failed:', error)
    }
  }

  private async triggerSecurityAlert(severity: SecurityEvent['severity'], count: number, timeWindow: number): Promise<void> {
    const alertMessage = `Security Alert: ${count} ${severity} security events in the last ${timeWindow / 60} minutes`

    console.warn(`🚨 ${alertMessage}`)

    // Here you could integrate with:
    // - Email notifications
    // - Slack/Discord webhooks
    // - PagerDuty or similar alerting services
    // - SMS notifications for critical alerts

    // Store alert in Redis for dashboard
    const alertKey = `security_alert:${Date.now()}`
    await redis.setex(alertKey, 24 * 60 * 60, JSON.stringify({
      severity,
      count,
      timeWindow,
      message: alertMessage,
      timestamp: new Date().toISOString()
    }))
  }

  private async updateIPReputation(ip: string, severity: SecurityEvent['severity']): Promise<void> {
    try {
      const reputationKey = `ip_reputation:${ip}`
      const scoreMap = { low: 1, medium: 3, high: 7, critical: 15 }

      const currentScore = await redis.get(reputationKey) || '0'
      const newScore = parseInt(currentScore) + scoreMap[severity]

      // Store for 7 days
      await redis.setex(reputationKey, 7 * 24 * 60 * 60, newScore.toString())

      // Auto-block IPs with very bad reputation
      if (newScore >= 50) {
        const blockKey = `blocked_ip:${ip}`
        await redis.setex(blockKey, 24 * 60 * 60, 'auto_blocked') // Block for 24 hours

        await this.logSecurityEvent({
          type: 'suspicious_activity',
          ip,
          details: {
            reason: 'Auto-blocked due to bad reputation',
            reputationScore: newScore,
            action: 'ip_blocked'
          },
          timestamp: new Date(),
          severity: 'high'
        })
      }
    } catch (error) {
      console.error('IP reputation update failed:', error)
    }
  }

  async isIPBlocked(ip: string): Promise<boolean> {
    try {
      const blockKey = `blocked_ip:${ip}`
      const blocked = await redis.get(blockKey)
      return !!blocked
    } catch (error) {
      console.error('IP block check failed:', error)
      return false
    }
  }

  async getIPReputation(ip: string): Promise<number> {
    try {
      const reputationKey = `ip_reputation:${ip}`
      const score = await redis.get(reputationKey)
      return parseInt(score || '0')
    } catch (error) {
      console.error('IP reputation check failed:', error)
      return 0
    }
  }

  async getSecurityMetrics(timeWindow: number = 3600): Promise<{
    totalEvents: number
    eventsBySeverity: Record<string, number>
    topThreats: string[]
    suspiciousIPs: string[]
  }> {
    try {
      // This would require scanning Redis keys or querying the database
      // Implementation depends on your specific data structure

      return {
        totalEvents: 0,
        eventsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        topThreats: [],
        suspiciousIPs: []
      }
    } catch (error) {
      console.error('Security metrics retrieval failed:', error)
      return {
        totalEvents: 0,
        eventsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        topThreats: [],
        suspiciousIPs: []
      }
    }
  }
}

export const securityMonitor = SecurityMonitor.getInstance()

// Helper function to be used in API routes
export async function validateSecurityMiddleware(
  input: string,
  ip: string,
  userAgent?: string
): Promise<{ allowed: boolean; threats: ThreatDetectionRule[] }> {

  // Check if IP is blocked
  const isBlocked = await securityMonitor.isIPBlocked(ip)
  if (isBlocked) {
    return { allowed: false, threats: [] }
  }

  // Check for threats in input
  const threats = await securityMonitor.checkThreatDetection(input, ip, userAgent)
  const shouldBlock = threats.some(threat => threat.action === 'block')

  return { allowed: !shouldBlock, threats }
}