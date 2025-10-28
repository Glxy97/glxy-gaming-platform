/**
 * Security Tests - Anti-Cheat System
 * Tests for cheat detection, false positives, and rate limiting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AntiCheatSystem } from '@/lib/anti-cheat'
import { CacheManager } from '@/lib/redis-server'

// Mock Redis/Cache Manager
vi.mock('@/lib/redis-server', () => ({
  CacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    increment: vi.fn()
  },
  CACHE_KEYS: {
    LAST_MOVE_TIME: 'last_move_time',
    CHEAT_SCORE: 'cheat_score',
    PLAYER_BAN: 'player_ban'
  },
  CACHE_TTL: {
    SHORT: 60,
    GAME_STATE: 300
  }
}))

vi.mock('@/lib/audit-logger', () => ({
  AuditLogger: {
    logGameAction: vi.fn()
  }
}))

describe('Anti-Cheat System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset Redis mocks
    vi.mocked(CacheManager.get).mockResolvedValue(null)
    vi.mocked(CacheManager.set).mockResolvedValue('OK')
    vi.mocked(CacheManager.increment).mockResolvedValue(1)
  })

  describe('Rate Limiting', () => {
    it('should detect rate limit violations', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 100
      }

      // Mock previous move was 100ms ago (should trigger rate limit)
      vi.mocked(CacheManager.get).mockResolvedValue(Date.now() - 100)

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(true)
      expect(result.reasons).toContain('Rate limit exceeded')
      expect(result.cheatScore).toBeGreaterThan(0)
    })

    it('should allow normal move rates', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 200
      }

      // Mock previous move was 500ms ago (normal rate)
      vi.mocked(CacheManager.get).mockResolvedValue(Date.now() - 500)

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(false)
      expect(result.reasons).not.toContain('Rate limit exceeded')
    })

    it('should handle first move correctly', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 150
      }

      // Mock no previous move
      vi.mocked(CacheManager.get).mockResolvedValue(null)

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(false)
      expect(result.reasons).not.toContain('Rate limit exceeded')
    })
  })

  describe('Reaction Time Analysis', () => {
    it('should detect impossibly fast reaction times', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 10 // Too fast for human
      }

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(true)
      expect(result.reasons).toContain('Implausibly fast reaction time')
      expect(result.cheatScore).toBeGreaterThan(0)
    })

    it('should allow normal reaction times', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 200 // Normal human reaction time
      }

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(false)
      expect(result.reasons).not.toContain('Implausibly fast reaction time')
    })

    it('should handle missing reaction time gracefully', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' }
        // No reactionTime
      }

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(false)
      expect(result.reasons).not.toContain('Implausibly fast reaction time')
    })
  })

  describe('Cheat Score System', () => {
    it('should accumulate cheat scores correctly', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 10 // Fast reaction
      }

      // Mock existing cheat score
      vi.mocked(CacheManager.get).mockResolvedValue(45) // Existing score
      vi.mocked(CacheManager.increment).mockResolvedValue(55) // New score

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.cheatScore).toBe(55)
      expect(result.suspicious).toBe(true)
    })

    it('should trigger appropriate actions based on cheat score', async () => {
      const testCases = [
        { score: 30, expectedAction: undefined },
        { score: 60, expectedAction: 'warn' },
        { score: 120, expectedAction: 'kick' },
        { score: 250, expectedAction: 'temp_ban' },
        { score: 600, expectedAction: 'ban' }
      ]

      for (const testCase of testCases) {
        const moveData = {
          gameType: 'tetris',
          moveType: 'move',
          timestamp: Date.now(),
          playerId: 'player123',
          gameId: 'game123',
          moveData: { action: 'move', direction: 'down' },
          reactionTime: 10
        }

        vi.mocked(CacheManager.get).mockResolvedValue(testCase.score - 10)
        vi.mocked(CacheManager.increment).mockResolvedValue(testCase.score)

        const result = await AntiCheatSystem.analyzeMove(moveData)

        expect(result.action).toBe(testCase.expectedAction)
      }
    })
  })

  describe('False Positive Prevention', () => {
    it('should not flag legitimate fast players', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 60 // Fast but possible for skilled players
      }

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(false)
      expect(result.action).toBeUndefined()
    })

    it('should handle network lag gracefully', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 500 // Slow due to network lag
      }

      const result = await AntiCheatSystem.analyzeMove(moveData)

      expect(result.suspicious).toBe(false)
      expect(result.reasons).not.toContain('Implausibly fast reaction time')
    })

    it('should allow burst movements during intense gameplay', async () => {
      // Simulate rapid moves during intense gameplay
      const moves = Array(5).fill(null).map((_, i) => ({
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now() + (i * 150), // 150ms between moves
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move', direction: 'down' },
        reactionTime: 100
      }))

      let suspiciousCount = 0
      for (const move of moves) {
        const result = await AntiCheatSystem.analyzeMove(move)
        if (result.suspicious) suspiciousCount++
      }

      // Should not flag all moves as suspicious
      expect(suspiciousCount).toBeLessThan(moves.length)
    })
  })

  describe('Game-Specific Detection', () => {
    it('should handle different game types correctly', async () => {
      const gameTypes = ['tetris', 'connect4', 'tictactoe', 'chess', 'uno']

      for (const gameType of gameTypes) {
        const moveData = {
          gameType,
          moveType: 'move',
          timestamp: Date.now(),
          playerId: 'player123',
          gameId: 'game123',
          moveData: { action: 'move' },
          reactionTime: 10 // Suspiciously fast
        }

        const result = await AntiCheatSystem.analyzeMove(moveData)

        expect(result.suspicious).toBe(true)
        expect(result.reasons).toContain('Implausibly fast reaction time')
      }
    })

    it('should track moves per game type separately', async () => {
      const tetrisMove = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move' },
        reactionTime: 10
      }

      const connect4Move = {
        gameType: 'connect4',
        moveType: 'drop_piece',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game456',
        moveData: { column: 3 },
        reactionTime: 10
      }

      // Both should be flagged independently
      const tetrisResult = await AntiCheatSystem.analyzeMove(tetrisMove)
      const connect4Result = await AntiCheatSystem.analyzeMove(connect4Move)

      expect(tetrisResult.suspicious).toBe(true)
      expect(connect4Result.suspicious).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      vi.mocked(CacheManager.get).mockRejectedValue(new Error('Redis connection failed'))

      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move' },
        reactionTime: 10
      }

      // Should not throw error
      await expect(AntiCheatSystem.analyzeMove(moveData)).resolves.toBeDefined()
    })

    it('should handle invalid move data gracefully', async () => {
      const invalidMoveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: null, // Invalid data
        reactionTime: 10
      }

      const result = await AntiCheatSystem.analyzeMove(invalidMoveData)

      expect(result).toBeDefined()
      expect(result.suspicious).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should process moves quickly', async () => {
      const moveData = {
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now(),
        playerId: 'player123',
        gameId: 'game123',
        moveData: { action: 'move' },
        reactionTime: 100
      }

      const startTime = Date.now()
      await AntiCheatSystem.analyzeMove(moveData)
      const endTime = Date.now()

      // Should process within 50ms
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should handle concurrent move analysis', async () => {
      const moves = Array(10).fill(null).map((_, i) => ({
        gameType: 'tetris',
        moveType: 'move',
        timestamp: Date.now() + i,
        playerId: `player${i}`,
        gameId: `game${i}`,
        moveData: { action: 'move' },
        reactionTime: 100
      }))

      const startTime = Date.now()
      const results = await Promise.all(moves.map(move => AntiCheatSystem.analyzeMove(move)))
      const endTime = Date.now()

      expect(results).toHaveLength(10)
      expect(endTime - startTime).toBeLessThan(200) // Should handle 10 concurrent moves quickly
    })
  })
})
