/**
 * Security Tests - Role-Based Access Control
 * Tests for admin access control and role-based permissions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkAdminAccess } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

vi.mock('@/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/audit-logger', () => ({
  AuditLogger: {
    logAdminAction: vi.fn()
  }
}))

describe('Role-Based Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAdminAccess', () => {
    it('should deny access when no session exists', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'No active session'
      })
    })

    it('should deny access when session has no user', async () => {
      vi.mocked(auth).mockResolvedValue({})

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'No active session'
      })
    })

    it('should deny access when session user has no id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com' }
      })

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'Invalid session data'
      })
    })

    it('should deny access when session user has no email', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123' }
      })

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'Invalid session data'
      })
    })

    it('should deny access when user not found in database', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'User not found in database'
      })
    })

    it('should deny access for USER role', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER'
      })

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'Insufficient privileges - user role: USER'
      })
    })

    it('should grant access for ADMIN role', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        username: 'admin',
        role: 'ADMIN'
      })

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: true,
        user: {
          id: 'user123',
          email: 'test@example.com',
          username: 'admin',
          role: 'ADMIN'
        }
      })
    })

    it('should grant access for MODERATOR role', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        username: 'moderator',
        role: 'MODERATOR'
      })

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: true,
        user: {
          id: 'user123',
          email: 'test@example.com',
          username: 'moderator',
          role: 'MODERATOR'
        }
      })
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'))

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'System error during access check'
      })
    })

    it('should handle auth errors gracefully', async () => {
      vi.mocked(auth).mockRejectedValue(new Error('Auth error'))

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: false,
        reason: 'System error during access check'
      })
    })

    it('should handle missing username gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        username: null,
        role: 'ADMIN'
      })

      const result = await checkAdminAccess()

      expect(result).toEqual({
        hasAccess: true,
        user: {
          id: 'user123',
          email: 'test@example.com',
          username: undefined,
          role: 'ADMIN'
        }
      })
    })
  })

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy: ADMIN > MODERATOR > USER', async () => {
      const roles = ['USER', 'MODERATOR', 'ADMIN']
      const expectedAccess = [false, true, true]

      for (let i = 0; i < roles.length; i++) {
        vi.clearAllMocks()
        
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user123', email: 'test@example.com' }
        })
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
          role: roles[i]
        })

        const result = await checkAdminAccess()
        expect(result.hasAccess).toBe(expectedAccess[i])
      }
    })
  })

  describe('Security Considerations', () => {
    it('should not expose sensitive user data in error messages', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER'
      })

      const result = await checkAdminAccess()

      // Should not expose internal user data
      expect(result.reason).not.toContain('user123')
      expect(result.reason).not.toContain('test@example.com')
      expect(result.reason).toContain('USER') // Role is safe to expose
    })

    it('should handle concurrent access checks', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        username: 'admin',
        role: 'ADMIN'
      })

      // Test concurrent calls
      const promises = Array(5).fill(null).map(() => checkAdminAccess())
      const results = await Promise.all(promises)

      // All should return the same result
      results.forEach(result => {
        expect(result.hasAccess).toBe(true)
        expect(result.user?.role).toBe('ADMIN')
      })
    })

    it('should validate role values are from enum', async () => {
      const invalidRoles = ['INVALID', 'SUPER_ADMIN', 'GUEST', '']

      for (const role of invalidRoles) {
        vi.clearAllMocks()
        
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user123', email: 'test@example.com' }
        })
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
          role: role as any
        })

        const result = await checkAdminAccess()
        expect(result.hasAccess).toBe(false)
      }
    })
  })
})
