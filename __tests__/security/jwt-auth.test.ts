/**
 * Security Tests - JWT Authentication
 * Tests for JWT token verification and authentication security
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { verifyAuth } from '@/lib/auth-security'

// Mock environment variables
const mockEnv = {
  NEXTAUTH_SECRET: 'test-secret-key-for-jwt-verification'
}

describe('JWT Authentication Security', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_SECRET', mockEnv.NEXTAUTH_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('verifyAuth', () => {
    it('should return null for missing authorization header', async () => {
      const mockReq = {
        headers: {}
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should return null for invalid authorization header format', async () => {
      const mockReq = {
        headers: {
          authorization: 'InvalidFormat token123'
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should return null for missing Bearer prefix', async () => {
      const mockReq = {
        headers: {
          authorization: 'token123'
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should return null for invalid JWT token', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should return null for expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: 'user123', email: 'test@example.com' },
        mockEnv.NEXTAUTH_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      )

      const mockReq = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should return null for JWT token with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { id: 'user123', email: 'test@example.com' },
        'wrong-secret',
        { expiresIn: '1h' }
      )

      const mockReq = {
        headers: {
          authorization: `Bearer ${wrongSecretToken}`
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should return user data for valid JWT token', async () => {
      const validToken = jwt.sign(
        { 
          id: 'user123', 
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER'
        },
        mockEnv.NEXTAUTH_SECRET,
        { expiresIn: '1h' }
      )

      const mockReq = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      })
    })

    it('should handle malformed JWT tokens gracefully', async () => {
      const malformedTokens = [
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'Bearer not-a-jwt-token',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'Bearer '
      ]

      for (const token of malformedTokens) {
        const mockReq = {
          headers: {
            authorization: token
          }
        }

        const result = await verifyAuth(mockReq)
        expect(result).toBeNull()
      }
    })

    it('should handle missing NEXTAUTH_SECRET gracefully', async () => {
      vi.unstubAllEnvs()
      
      const validToken = jwt.sign(
        { id: 'user123', email: 'test@example.com' },
        'some-secret',
        { expiresIn: '1h' }
      )

      const mockReq = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should validate token structure and required fields', async () => {
      // Token without required fields
      const incompleteToken = jwt.sign(
        { email: 'test@example.com' }, // Missing id
        mockEnv.NEXTAUTH_SECRET,
        { expiresIn: '1h' }
      )

      const mockReq = {
        headers: {
          authorization: `Bearer ${incompleteToken}`
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull()
    })

    it('should handle concurrent token verification', async () => {
      const validToken = jwt.sign(
        { id: 'user123', email: 'test@example.com' },
        mockEnv.NEXTAUTH_SECRET,
        { expiresIn: '1h' }
      )

      const mockReq = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      }

      // Test concurrent calls
      const promises = Array(10).fill(null).map(() => verifyAuth(mockReq))
      const results = await Promise.all(promises)

      // All should return the same valid result
      results.forEach(result => {
        expect(result).toEqual({
          id: 'user123',
          email: 'test@example.com'
        })
      })
    })
  })

  describe('Security Edge Cases', () => {
    it('should not be vulnerable to timing attacks', async () => {
      const validToken = jwt.sign(
        { id: 'user123', email: 'test@example.com' },
        mockEnv.NEXTAUTH_SECRET,
        { expiresIn: '1h' }
      )

      const invalidToken = 'invalid-token'

      const mockReqValid = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      }

      const mockReqInvalid = {
        headers: {
          authorization: `Bearer ${invalidToken}`
        }
      }

      // Measure execution time for both cases
      const startValid = Date.now()
      await verifyAuth(mockReqValid)
      const timeValid = Date.now() - startValid

      const startInvalid = Date.now()
      await verifyAuth(mockReqInvalid)
      const timeInvalid = Date.now() - startInvalid

      // Times should be similar (within reasonable margin)
      const timeDiff = Math.abs(timeValid - timeInvalid)
      expect(timeDiff).toBeLessThan(100) // Less than 100ms difference
    })

    it('should handle very large tokens gracefully', async () => {
      // Create a token with large payload
      const largePayload = {
        id: 'user123',
        email: 'test@example.com',
        data: 'x'.repeat(10000) // Large data field
      }

      const largeToken = jwt.sign(
        largePayload,
        mockEnv.NEXTAUTH_SECRET,
        { expiresIn: '1h' }
      )

      const mockReq = {
        headers: {
          authorization: `Bearer ${largeToken}`
        }
      }

      const result = await verifyAuth(mockReq)
      expect(result).toBeNull() // Should reject large tokens
    })
  })
})
