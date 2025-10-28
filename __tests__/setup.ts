/**
 * Test Setup File
 * Global test configuration and mocks
 */

import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-key-for-jwt-verification')
vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db')

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn()
    },
    securityEvent: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    gameRoom: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    pdfDocument: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

// Mock Redis/Cache Manager
vi.mock('@/lib/redis-server', () => ({
  CacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    increment: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn()
  },
  CACHE_KEYS: {
    LAST_MOVE_TIME: 'last_move_time',
    CHEAT_SCORE: 'cheat_score',
    PLAYER_BAN: 'player_ban',
    GAME_STATE: 'game_state'
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
    GAME_STATE: 300
  }
}))

// Mock NextAuth
vi.mock('@/auth', () => ({
  auth: vi.fn()
}))

// Mock Audit Logger
vi.mock('@/lib/audit-logger', () => ({
  AuditLogger: {
    log: vi.fn(),
    logAuth: vi.fn(),
    logRoleChange: vi.fn(),
    logUserAction: vi.fn(),
    logGameAction: vi.fn(),
    logAdminAction: vi.fn(),
    logPDFAction: vi.fn(),
    logSecurityEvent: vi.fn(),
    getAuditLogs: vi.fn(),
    getAuditStats: vi.fn()
  }
}))

// Mock Socket.IO
vi.mock('socket.io', () => ({
  Server: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    to: vi.fn(() => ({
      emit: vi.fn()
    }))
  }))
}))

// Mock DOMPurify
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((input) => input.replace(/<script[^>]*>.*?<\/script>/gi, ''))
  }
}))

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
    ...overrides
  }),
  
  createMockSession: (overrides = {}) => ({
    user: {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User'
    },
    ...overrides
  }),
  
  createMockBoard: (width = 3, height = 3) => ({
    grid: Array(height).fill(null).map(() => Array(width).fill(null)),
    width,
    height
  }),
  
  createMockTetrisBoard: () => ({
    grid: Array(20).fill(null).map(() => Array(10).fill(null)),
    width: 10,
    height: 20
  }),
  
  createMockConnect4Board: () => ({
    grid: Array(6).fill(null).map(() => Array(7).fill(null)),
    width: 7,
    height: 6
  })
}

// Console error suppression for tests
const originalConsoleError = console.error
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Error:'))
  ) {
    return
  }
  originalConsoleError(...args)
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})
