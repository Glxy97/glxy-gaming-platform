/**
 * Enhanced Authentication Security Layer
 * Zusätzliche Sicherheitsmaßnahmen für die GLXY Gaming Platform
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'

// Enhanced Password Policy Configuration
export const ENHANCED_PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true,
  passwordHistoryCount: 5, // Remember last 5 passwords
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
}

// Common weak passwords (subset - in production use a comprehensive list)
const COMMON_WEAK_PASSWORDS = new Set([
  'password123', 'admin123', 'qwerty123', 'letmein123',
  'welcome123', 'password1', 'admin1234', 'qwerty1234',
  'gaming123', 'glxy123', 'user123', 'test123'
])

// Device fingerprinting for anomaly detection
export async function generateDeviceFingerprint(request: Request): Promise<string> {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''

  const fingerprintData = `${userAgent}:${acceptLanguage}:${acceptEncoding}`
  return createHash('sha256').update(fingerprintData).digest('hex')
}

// Advanced password validation
export function validatePasswordStrength(password: string, userInfo?: {
  email?: string
  username?: string
  name?: string
}): {
  isValid: boolean
  score: number
  issues: string[]
} {
  const issues: string[] = []
  let score = 0

  // Basic length check
  if (password.length < ENHANCED_PASSWORD_POLICY.minLength) {
    issues.push(`Passwort muss mindestens ${ENHANCED_PASSWORD_POLICY.minLength} Zeichen lang sein`)
  } else {
    score += 20
  }

  if (password.length > ENHANCED_PASSWORD_POLICY.maxLength) {
    issues.push(`Passwort darf maximal ${ENHANCED_PASSWORD_POLICY.maxLength} Zeichen lang sein`)
  }

  // Character variety checks
  if (!/[A-Z]/.test(password)) {
    issues.push('Passwort muss mindestens einen Großbuchstaben enthalten')
  } else {
    score += 15
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Passwort muss mindestens einen Kleinbuchstaben enthalten')
  } else {
    score += 15
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Passwort muss mindestens eine Zahl enthalten')
  } else {
    score += 15
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Passwort muss mindestens ein Sonderzeichen enthalten')
  } else {
    score += 15
  }

  // Check for common weak passwords
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    issues.push('Dieses Passwort ist zu häufig verwendet und unsicher')
    score -= 30
  }

  // Check for user information in password
  if (userInfo) {
    const userInfoLower = [
      userInfo.email?.split('@')[0]?.toLowerCase(),
      userInfo.username?.toLowerCase(),
      userInfo.name?.toLowerCase()
    ].filter(Boolean)

    for (const info of userInfoLower) {
      if (info && password.toLowerCase().includes(info)) {
        issues.push('Passwort darf keine persönlichen Informationen enthalten')
        score -= 20
        break
      }
    }
  }

  // Bonus points for length and complexity
  if (password.length >= 16) score += 10
  if (password.length >= 20) score += 10

  // Check for patterns
  if (!/(.)\1{2,}/.test(password)) { // No 3+ repeated characters
    score += 5
  } else {
    issues.push('Passwort sollte keine wiederholten Zeichen enthalten')
  }

  // Entropy calculation (simplified)
  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.6) {
    score += 10 // Good character diversity
  }

  return {
    isValid: issues.length === 0 && score >= 70,
    score: Math.max(0, Math.min(100, score)),
    issues
  }
}

// Session security enhancement
export interface SecuritySession {
  id: string
  userId: string
  deviceFingerprint: string
  ipAddress: string
  userAgent: string
  createdAt: Date
  lastActiveAt: Date
  isActive: boolean
  trustLevel: 'low' | 'medium' | 'high'
}

// Geographic anomaly detection
export async function detectLocationAnomaly(
  userId: string,
  currentIP: string
): Promise<{
  isAnomalous: boolean
  confidence: number
  reason?: string
}> {
  try {
    // Get user's recent login locations (last 30 days)
    const recentLogins = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLogin: true }
    })

    // In a real implementation, you would:
    // 1. Use IP geolocation service to get location
    // 2. Compare with historical login patterns
    // 3. Calculate distance and time differences
    // 4. Apply machine learning models for anomaly detection

    // Simplified implementation
    // This is a placeholder - implement with real geolocation service
    const isNewLocation = true // Placeholder logic

    if (isNewLocation) {
      return {
        isAnomalous: true,
        confidence: 0.7,
        reason: 'Login from new geographic location detected'
      }
    }

    return {
      isAnomalous: false,
      confidence: 0.1
    }
  } catch (error) {
    console.error('Location anomaly detection error:', error)
    return {
      isAnomalous: false,
      confidence: 0
    }
  }
}

// Behavioral analysis
export async function analyzeUserBehavior(
  userId: string,
  loginTime: Date,
  deviceFingerprint: string
): Promise<{
  riskScore: number
  factors: string[]
}> {
  const factors: string[] = []
  let riskScore = 0

  try {
    // Time-based analysis
    const hour = loginTime.getHours()
    if (hour >= 2 && hour <= 6) {
      factors.push('Unusual login time (late night/early morning)')
      riskScore += 15
    }

    // Frequency analysis
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    // Check login frequency (simplified)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLogin: true }
    })

    if (user?.lastLogin) {
      const timeSinceLastLogin = loginTime.getTime() - user.lastLogin.getTime()

      // Multiple logins in short time
      if (timeSinceLastLogin < 5 * 60 * 1000) { // Less than 5 minutes
        factors.push('Multiple rapid login attempts')
        riskScore += 20
      }
    }

    // Device consistency
    // In production, you would store and compare device fingerprints
    // This is a simplified check

    return {
      riskScore: Math.min(100, riskScore),
      factors
    }
  } catch (error) {
    console.error('Behavior analysis error:', error)
    return {
      riskScore: 0,
      factors: ['Analysis unavailable']
    }
  }
}

// Multi-factor authentication enhancement
export async function requireStepUpAuth(
  userId: string,
  riskScore: number
): Promise<boolean> {
  // Step-up authentication based on risk score
  if (riskScore >= 50) {
    return true // Require additional authentication
  }

  // Check if user has MFA enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true }
  })

  return user?.mfaEnabled || false
}

// Password breach checking (simplified)
export async function checkPasswordBreach(passwordHash: string): Promise<boolean> {
  // In production, integrate with HaveIBeenPwned API or similar service
  // This is a placeholder implementation

  try {
    // Hash the first 5 characters for k-anonymity
    const prefix = passwordHash.substring(0, 5)

    // In real implementation:
    // 1. Hash the password with SHA-1
    // 2. Send first 5 chars to HaveIBeenPwned API
    // 3. Check if full hash appears in response

    return false // Placeholder - assume not breached
  } catch (error) {
    console.error('Password breach check error:', error)
    return false
  }
}

// Security event logging
export async function logSecurityEvent(event: {
  type: 'login_success' | 'login_failure' | 'password_change' | 'mfa_enabled' | 'suspicious_activity'
  userId?: string
  ipAddress: string
  userAgent: string
  details?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}) {
  try {
    // In production, send to security monitoring system
    console.log('🔐 Security Event:', {
      timestamp: new Date().toISOString(),
      ...event
    })

    // Store in database for audit trail
    // You could create a security_events table for this

  } catch (error) {
    console.error('Security event logging error:', error)
  }
}

// Privilege escalation protection
export function validatePrivilegeEscalation(
  currentUserLevel: number,
  requestedAction: string,
  targetUserId?: string
): {
  allowed: boolean
  reason?: string
} {
  // Admin actions require level 10+
  const adminActions = ['delete_user', 'modify_roles', 'access_admin_panel']

  if (adminActions.includes(requestedAction) && currentUserLevel < 10) {
    return {
      allowed: false,
      reason: 'Insufficient privileges for admin action'
    }
  }

  // Users cannot modify other users' data (except admins)
  if (targetUserId && currentUserLevel < 10) {
    return {
      allowed: false,
      reason: 'Cannot modify other users\' data'
    }
  }

  return { allowed: true }
}

// Session hijacking protection
export function validateSessionIntegrity(
  sessionToken: string,
  expectedFingerprint: string,
  currentFingerprint: string,
  expectedIP: string,
  currentIP: string
): {
  valid: boolean
  reason?: string
} {
  // Device fingerprint validation
  if (expectedFingerprint !== currentFingerprint) {
    return {
      valid: false,
      reason: 'Device fingerprint mismatch - possible session hijacking'
    }
  }

  // IP address validation (with some tolerance for mobile users)
  // In production, implement more sophisticated IP validation
  if (expectedIP !== currentIP) {
    // Could implement geo-distance checking here
    console.warn('IP address changed in session:', { expectedIP, currentIP })
  }

  return { valid: true }
}

export default {
  validatePasswordStrength,
  generateDeviceFingerprint,
  detectLocationAnomaly,
  analyzeUserBehavior,
  requireStepUpAuth,
  checkPasswordBreach,
  logSecurityEvent,
  validatePrivilegeEscalation,
  validateSessionIntegrity,
  ENHANCED_PASSWORD_POLICY
}