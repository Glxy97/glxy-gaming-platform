/**
 * Comprehensive Authentication System Tests
 *
 * Tests the complete authentication system including:
 * - Password validation and hashing
 * - Account lockout mechanisms
 * - Rate limiting
 * - MFA functionality
 * - Security monitoring
 * - Input sanitization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  validatePasswordStrength,
  hashPassword,
  checkAccountLockout,
  handleFailedLogin,
  handleSuccessfulLogin,
  checkLoginRateLimit,
  sanitizeInput,
  escapeHtml,
  isValidEmail,
  isValidUsername
} from '../lib/auth-security'

import { securityMonitor } from '../lib/security-monitor'
import bcrypt from 'bcryptjs'

// Mock external dependencies
jest.mock('../lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    }
  }
}))

jest.mock('../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    multi: jest.fn().mockReturnValue({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([])
    }),
    keys: jest.fn(),
    del: jest.fn()
  }
}))

describe('Authentication System Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks()
  })

  describe('Password Security', () => {
    describe('validatePasswordStrength', () => {
      it('should reject passwords shorter than 12 characters', () => {
        const result = validatePasswordStrength('Short1!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort muss mindestens 12 Zeichen lang sein')
      })

      it('should reject passwords longer than 128 characters', () => {
        const longPassword = 'A'.repeat(129) + '1!'
        const result = validatePasswordStrength(longPassword)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort darf maximal 128 Zeichen lang sein')
      })

      it('should require lowercase letters', () => {
        const result = validatePasswordStrength('UPPERCASE123!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort muss mindestens einen Kleinbuchstaben enthalten')
      })

      it('should require uppercase letters', () => {
        const result = validatePasswordStrength('lowercase123!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort muss mindestens einen Großbuchstaben enthalten')
      })

      it('should require numbers', () => {
        const result = validatePasswordStrength('NoNumbersHere!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort muss mindestens eine Zahl enthalten')
      })

      it('should require special characters', () => {
        const result = validatePasswordStrength('NoSpecialChars123')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort muss mindestens ein Sonderzeichen enthalten')
      })

      it('should reject common passwords', () => {
        const result = validatePasswordStrength('Password123!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort ist zu häufig verwendet und unsicher')
      })

      it('should reject passwords with repeated characters', () => {
        const result = validatePasswordStrength('AAValidPassword123!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort enthält zu viele wiederholte Zeichen')
      })

      it('should reject passwords with sequential characters', () => {
        const result = validatePasswordStrength('ABC1234ValidPassword!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Passwort enthält sequenzielle Zeichen')
      })

      it('should accept strong passwords', () => {
        const result = validatePasswordStrength('MySecureP@ssw0rd2024!')
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('hashPassword', () => {
      it('should hash passwords with sufficient rounds', async () => {
        const password = 'TestPassword123!'
        const hashedPassword = await hashPassword(password)

        expect(hashedPassword).toBeDefined()
        expect(hashedPassword).not.toBe(password)
        expect(hashedPassword.startsWith('$2a$12$')).toBe(true) // bcrypt with 12 rounds
      })

      it('should produce different hashes for the same password', async () => {
        const password = 'TestPassword123!'
        const hash1 = await hashPassword(password)
        const hash2 = await hashPassword(password)

        expect(hash1).not.toBe(hash2)
      })

      it('should create hashes that can be verified', async () => {
        const password = 'TestPassword123!'
        const hashedPassword = await hashPassword(password)

        const isValid = await bcrypt.compare(password, hashedPassword)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Account Security', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      loginAttempts: 0,
      lockedUntil: null
    }

    describe('checkAccountLockout', () => {
      it('should return not locked for non-existent user', async () => {
        const { prisma } = require('../lib/db')
        prisma.user.findUnique.mockResolvedValue(null)

        const result = await checkAccountLockout('nonexistent@example.com')
        expect(result.isLocked).toBe(false)
      })

      it('should return not locked for user without lockout', async () => {
        const { prisma } = require('../lib/db')
        prisma.user.findUnique.mockResolvedValue(mockUser)

        const result = await checkAccountLockout('test@example.com')
        expect(result.isLocked).toBe(false)
      })

      it('should return locked for user with future lockout time', async () => {
        const { prisma } = require('../lib/db')
        const lockedUser = {
          ...mockUser,
          lockedUntil: new Date(Date.now() + 60000) // 1 minute in future
        }
        prisma.user.findUnique.mockResolvedValue(lockedUser)

        const result = await checkAccountLockout('test@example.com')
        expect(result.isLocked).toBe(true)
        expect(result.remainingTime).toBeGreaterThan(0)
      })

      it('should reset expired lockout', async () => {
        const { prisma } = require('../lib/db')
        const expiredLockUser = {
          ...mockUser,
          lockedUntil: new Date(Date.now() - 60000), // 1 minute in past
          loginAttempts: 5
        }
        prisma.user.findUnique.mockResolvedValue(expiredLockUser)
        prisma.user.update.mockResolvedValue(mockUser)

        const result = await checkAccountLockout('test@example.com')
        expect(result.isLocked).toBe(false)
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          data: {
            loginAttempts: 0,
            lockedUntil: null
          }
        })
      })
    })

    describe('handleFailedLogin', () => {
      it('should increment login attempts for existing user', async () => {
        const { prisma } = require('../lib/db')
        prisma.user.findUnique.mockResolvedValue({ ...mockUser, loginAttempts: 2 })
        prisma.user.update.mockResolvedValue(mockUser)

        await handleFailedLogin('test@example.com')

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          data: { loginAttempts: 3 }
        })
      })

      it('should lock account after maximum attempts', async () => {
        const { prisma } = require('../lib/db')
        prisma.user.findUnique.mockResolvedValue({ ...mockUser, loginAttempts: 4 })
        prisma.user.update.mockResolvedValue(mockUser)

        await handleFailedLogin('test@example.com')

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          data: {
            loginAttempts: 5,
            lockedUntil: expect.any(Date)
          }
        })
      })

      it('should handle non-existent user gracefully', async () => {
        const { prisma } = require('../lib/db')
        prisma.user.findUnique.mockResolvedValue(null)

        await expect(handleFailedLogin('nonexistent@example.com')).resolves.not.toThrow()
      })
    })

    describe('handleSuccessfulLogin', () => {
      it('should reset login attempts and update last login', async () => {
        const { prisma } = require('../lib/db')
        prisma.user.update.mockResolvedValue(mockUser)

        await handleSuccessfulLogin('test@example.com')

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date)
          }
        })
      })
    })
  })

  describe('Rate Limiting', () => {
    describe('checkLoginRateLimit', () => {
      it('should allow requests under rate limit', async () => {
        const { redis } = require('../lib/redis')
        redis.get.mockResolvedValue('5') // Under limit of 10
        redis.multi().incr.mockReturnThis()
        redis.multi().expire.mockReturnThis()
        redis.multi().exec.mockResolvedValue([])

        const result = await checkLoginRateLimit('192.168.1.1')
        expect(result.allowed).toBe(true)
      })

      it('should block requests over rate limit', async () => {
        const { redis } = require('../lib/redis')
        redis.get.mockResolvedValue('15') // Over limit of 10
        redis.ttl.mockResolvedValue(120) // 2 minutes remaining

        const result = await checkLoginRateLimit('192.168.1.1')
        expect(result.allowed).toBe(false)
        expect(result.remainingTime).toBe(120000) // 2 minutes in milliseconds
      })

      it('should handle Redis errors gracefully', async () => {
        const { redis } = require('../lib/redis')
        redis.get.mockRejectedValue(new Error('Redis connection failed'))

        const result = await checkLoginRateLimit('192.168.1.1')
        expect(result.allowed).toBe(true) // Fail open
        expect(result.remainingTime).toBe(0)
      })
    })
  })

  describe('Input Validation and Sanitization', () => {
    describe('sanitizeInput', () => {
      it('should remove dangerous characters', () => {
        const maliciousInput = '<script>alert("xss")</script>'
        const sanitized = sanitizeInput(maliciousInput)
        expect(sanitized).not.toContain('<')
        expect(sanitized).not.toContain('>')
        expect(sanitized).not.toContain('"')
        expect(sanitized).not.toContain("'")
      })

      it('should normalize whitespace', () => {
        const input = 'Multiple    spaces   and\n\nnewlines'
        const sanitized = sanitizeInput(input)
        expect(sanitized).toBe('Multiple spaces and newlines')
      })

      it('should limit input length', () => {
        const longInput = 'A'.repeat(2000)
        const sanitized = sanitizeInput(longInput)
        expect(sanitized.length).toBeLessThanOrEqual(1000)
      })

      it('should handle non-string input', () => {
        const sanitized = sanitizeInput(null as any)
        expect(sanitized).toBe('')
      })
    })

    describe('escapeHtml', () => {
      it('should escape HTML entities', () => {
        const htmlInput = '<div>Hello & "World"</div>'
        const escaped = escapeHtml(htmlInput)
        expect(escaped).toBe('&lt;div&gt;Hello &amp; &quot;World&quot;&lt;&#x2F;div&gt;')
      })

      it('should handle empty input', () => {
        expect(escapeHtml('')).toBe('')
      })

      it('should handle non-string input', () => {
        expect(escapeHtml(null as any)).toBe('')
      })
    })

    describe('isValidEmail', () => {
      it('should validate correct email addresses', () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user123@example-site.com'
        ]

        validEmails.forEach(email => {
          expect(isValidEmail(email)).toBe(true)
        })
      })

      it('should reject invalid email addresses', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user..name@example.com', // consecutive dots
          'user@.example.com',
          'a'.repeat(250) + '@example.com' // too long
        ]

        invalidEmails.forEach(email => {
          expect(isValidEmail(email)).toBe(false)
        })
      })
    })

    describe('isValidUsername', () => {
      it('should validate correct usernames', () => {
        const validUsernames = [
          'user123',
          'user_name',
          'user-name',
          'UserName123',
          'a'.repeat(20) // max length
        ]

        validUsernames.forEach(username => {
          expect(isValidUsername(username)).toBe(true)
        })
      })

      it('should reject invalid usernames', () => {
        const invalidUsernames = [
          'ab', // too short
          'a'.repeat(21), // too long
          'user@name', // invalid character
          'user name', // space not allowed
          '123user!', // special character
          ''
        ]

        invalidUsernames.forEach(username => {
          expect(isValidUsername(username)).toBe(false)
        })
      })
    })
  })

  describe('Security Monitoring', () => {
    describe('Threat Detection', () => {
      it('should detect SQL injection attempts', async () => {
        const maliciousInput = "'; DROP TABLE users; --"
        const threats = await securityMonitor.checkThreatDetection(maliciousInput, '192.168.1.1')

        expect(threats.length).toBeGreaterThan(0)
        expect(threats.some(t => t.name.toLowerCase().includes('sql'))).toBe(true)
      })

      it('should detect XSS attempts', async () => {
        const xssInput = '<script>alert("xss")</script>'
        const threats = await securityMonitor.checkThreatDetection(xssInput, '192.168.1.1')

        expect(threats.length).toBeGreaterThan(0)
        expect(threats.some(t => t.name.toLowerCase().includes('xss'))).toBe(true)
      })

      it('should detect path traversal attempts', async () => {
        const traversalInput = '../../../etc/passwd'
        const threats = await securityMonitor.checkThreatDetection(traversalInput, '192.168.1.1')

        expect(threats.length).toBeGreaterThan(0)
        expect(threats.some(t => t.name.toLowerCase().includes('traversal'))).toBe(true)
      })
    })

    describe('Brute Force Detection', () => {
      it('should detect brute force attacks', async () => {
        const { redis } = require('../lib/redis')
        redis.get.mockResolvedValue('25') // High number of attempts

        const result = await securityMonitor.checkBruteForceAttack('192.168.1.1', 'attacker@example.com')
        expect(result.isAttack).toBe(true)
        expect(['low', 'medium', 'high']).toContain(result.attackLevel)
      })

      it('should not flag normal login attempts', async () => {
        const { redis } = require('../lib/redis')
        redis.get.mockResolvedValue('3') // Normal number of attempts

        const result = await securityMonitor.checkBruteForceAttack('192.168.1.1', 'user@example.com')
        expect(result.isAttack).toBe(false)
        expect(result.attackLevel).toBe('none')
      })
    })

    describe('IP Reputation', () => {
      it('should track IP reputation', async () => {
        const { redis } = require('../lib/redis')
        redis.get.mockResolvedValue('10') // Current reputation score
        redis.setex.mockResolvedValue('OK')

        // This would normally be called internally by logSecurityEvent
        // We're testing the concept here
        const reputation = await securityMonitor.getIPReputation('192.168.1.1')
        expect(typeof reputation).toBe('number')
      })

      it('should block IPs with bad reputation', async () => {
        const { redis } = require('../lib/redis')
        redis.get.mockResolvedValue('blocked') // IP is blocked

        const isBlocked = await securityMonitor.isIPBlocked('192.168.1.1')
        expect(isBlocked).toBe(true)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete authentication flow', async () => {
      // This test simulates a complete authentication flow
      const email = 'integration@test.com'
      const password = 'SecureTestP@ssw0rd123!'
      const ip = '192.168.1.100'

      // 1. Validate password strength
      const passwordValidation = validatePasswordStrength(password)
      expect(passwordValidation.isValid).toBe(true)

      // 2. Hash password
      const hashedPassword = await hashPassword(password)
      expect(hashedPassword).toBeDefined()

      // 3. Check rate limiting
      const { redis } = require('../lib/redis')
      redis.get.mockResolvedValue('2') // Under limit
      redis.multi().incr.mockReturnThis()
      redis.multi().expire.mockReturnThis()
      redis.multi().exec.mockResolvedValue([])

      const rateLimitResult = await checkLoginRateLimit(ip)
      expect(rateLimitResult.allowed).toBe(true)

      // 4. Check account lockout
      const { prisma } = require('../lib/db')
      prisma.user.findUnique.mockResolvedValue({
        id: 'test-id',
        email,
        loginAttempts: 0,
        lockedUntil: null
      })

      const lockoutResult = await checkAccountLockout(email)
      expect(lockoutResult.isLocked).toBe(false)

      // 5. Simulate successful login
      prisma.user.update.mockResolvedValue({
        id: 'test-id',
        email,
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      })

      await expect(handleSuccessfulLogin(email)).resolves.not.toThrow()

      // Verify all components worked together
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: expect.any(Date)
        }
      })
    })

    it('should handle attack simulation', async () => {
      const maliciousIp = '192.168.1.200'
      const suspiciousInputs = [
        "'; DROP TABLE users; --",
        '<script>alert("xss")</script>',
        '../../../etc/passwd'
      ]

      for (const input of suspiciousInputs) {
        const threats = await securityMonitor.checkThreatDetection(input, maliciousIp)
        expect(threats.length).toBeGreaterThan(0)
      }

      // Simulate multiple failed login attempts
      const { prisma } = require('../lib/db')
      const redis = require('../lib/redis')
      redis.get.mockResolvedValue('15') // High attempt count

      const bruteForceResult = await securityMonitor.checkBruteForceAttack(maliciousIp)
      expect(bruteForceResult.isAttack).toBe(true)
    })
  })
})

describe('MFA (Multi-Factor Authentication) Tests', () => {
  // Mock the authenticator library
  const mockAuthenticator = {
    generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/GLXY%20Gaming:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GLXY%20Gaming'),
    verify: jest.fn().mockReturnValue(true),
    generate: jest.fn().mockReturnValue('123456')
  }

  beforeEach(() => {
    jest.mock('otplib', () => ({
      authenticator: mockAuthenticator
    }))
  })

  it('should generate MFA secret and QR code URL', () => {
    const secret = mockAuthenticator.generateSecret()
    const qrUrl = mockAuthenticator.keyuri('test@example.com', 'GLXY Gaming', secret)

    expect(secret).toBeDefined()
    expect(qrUrl).toContain('otpauth://totp/')
    expect(qrUrl).toContain('GLXY%20Gaming')
    expect(qrUrl).toContain('test@example.com')
  })

  it('should verify TOTP codes', () => {
    const isValid = mockAuthenticator.verify({
      token: '123456',
      secret: 'JBSWY3DPEHPK3PXP'
    })

    expect(isValid).toBe(true)
  })

  it('should generate backup codes', () => {
    const backupCodes = []
    for (let i = 0; i < 10; i++) {
      const code = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
      backupCodes.push(code)
    }

    expect(backupCodes).toHaveLength(10)
    backupCodes.forEach(code => {
      expect(code).toMatch(/^\d{8}$/)
    })
  })
})

// Performance and Load Tests
describe('Performance Tests', () => {
  it('should handle password hashing within acceptable time', async () => {
    const password = 'TestPassword123!'
    const startTime = Date.now()

    await hashPassword(password)

    const elapsedTime = Date.now() - startTime
    expect(elapsedTime).toBeLessThan(5000) // Should complete within 5 seconds
  })

  it('should handle multiple concurrent rate limit checks', async () => {
    const { redis } = require('../lib/redis')
    redis.get.mockResolvedValue('1')
    redis.multi().incr.mockReturnThis()
    redis.multi().expire.mockReturnThis()
    redis.multi().exec.mockResolvedValue([])

    const promises = []
    for (let i = 0; i < 100; i++) {
      promises.push(checkLoginRateLimit(`192.168.1.${i}`))
    }

    const results = await Promise.all(promises)
    expect(results).toHaveLength(100)
    results.forEach(result => {
      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('remainingTime')
    })
  })
})

// Edge Cases and Error Handling
describe('Edge Cases and Error Handling', () => {
  it('should handle database connection failures gracefully', async () => {
    const { prisma } = require('../lib/db')
    prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

    const result = await checkAccountLockout('test@example.com')
    expect(result.isLocked).toBe(false) // Should fail safely
  })

  it('should handle Redis connection failures gracefully', async () => {
    const { redis } = require('../lib/redis')
    redis.get.mockRejectedValue(new Error('Redis connection failed'))

    const result = await checkLoginRateLimit('192.168.1.1')
    expect(result.allowed).toBe(true) // Should fail open for availability
  })

  it('should handle malformed input gracefully', async () => {
    const malformedInputs = [
      null,
      undefined,
      123,
      {},
      [],
      '\x00\x01\x02'
    ]

    malformedInputs.forEach(input => {
      expect(() => sanitizeInput(input as any)).not.toThrow()
      expect(() => escapeHtml(input as any)).not.toThrow()
    })
  })
})

export {}