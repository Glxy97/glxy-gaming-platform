/**
 * Integration Tests - Socket Handlers
 * Tests for Socket.IO game handlers with anti-cheat integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Server as SocketIOServer } from 'socket.io'
import { registerTetrisHandlers, registerConnect4Handlers } from '@/lib/game-socket-handlers'
import { AntiCheatSystem } from '@/lib/anti-cheat'
import { TetrisValidator, Connect4Validator } from '@/lib/game-validators'

// Mock dependencies
vi.mock('@/lib/anti-cheat')
vi.mock('@/lib/game-validators/tetris-validator')
vi.mock('@/lib/game-validators/connect4-validator')
vi.mock('@/lib/redis-server')
vi.mock('@/lib/audit-logger')

describe('Socket Handler Integration Tests', () => {
  let mockIO: any
  let mockSocket: any

  beforeEach(() => {
    // Create mock Socket.IO server
    mockIO = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
      sockets: {
        sockets: new Map()
      }
    }

    // Create mock socket
    mockSocket = {
      id: 'socket123',
      emit: vi.fn(),
      disconnect: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      to: vi.fn().mockReturnThis(),
      handshake: {
        auth: {
          userId: 'user123'
        }
      }
    }

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('Tetris Socket Handlers', () => {
    beforeEach(() => {
      // Mock anti-cheat system
      vi.mocked(AntiCheatSystem.analyzeMove).mockResolvedValue({
        suspicious: false,
        cheatScore: 0,
        reasons: [],
        action: undefined
      })

      // Mock Tetris validator
      vi.mocked(TetrisValidator.validateMove).mockReturnValue({
        valid: true,
        reason: undefined
      })
      vi.mocked(TetrisValidator.validateLinesCleared).mockReturnValue({
        valid: true,
        reason: undefined
      })
      vi.mocked(TetrisValidator.calculateScore).mockReturnValue(100)
      vi.mocked(TetrisValidator.calculateAttackLines).mockReturnValue(0)
      vi.mocked(TetrisValidator.validateGameOver).mockReturnValue(false)
    })

    it('should handle valid tetris move', async () => {
      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      // Register handlers
      registerTetrisHandlers(mockIO, mockSocket)

      // Simulate tetris:move event
      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Verify anti-cheat was called
      expect(AntiCheatSystem.analyzeMove).toHaveBeenCalledWith({
        gameType: 'tetris',
        moveType: 'move',
        timestamp: expect.any(Number),
        playerId: 'user123',
        gameId: 'room123',
        moveData: moveData.move,
        reactionTime: 150
      })

      // Verify validator was called
      expect(TetrisValidator.validateMove).toHaveBeenCalled()
    })

    it('should handle suspicious tetris move', async () => {
      // Mock suspicious move
      vi.mocked(AntiCheatSystem.analyzeMove).mockResolvedValue({
        suspicious: true,
        cheatScore: 75,
        reasons: ['Rate limit exceeded'],
        action: 'warn'
      })

      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 10 // Suspiciously fast
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Verify warning was emitted
      expect(mockSocket.emit).toHaveBeenCalledWith('warning', {
        reason: 'Suspicious activity detected',
        score: 75
      })
    })

    it('should kick player for severe cheating', async () => {
      // Mock severe cheating
      vi.mocked(AntiCheatSystem.analyzeMove).mockResolvedValue({
        suspicious: true,
        cheatScore: 150,
        reasons: ['Multiple violations detected'],
        action: 'kick'
      })

      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 5 // Impossible reaction time
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Verify kick was emitted and socket disconnected
      expect(mockSocket.emit).toHaveBeenCalledWith('kicked', {
        reason: 'Suspicious activity detected'
      })
      expect(mockSocket.disconnect).toHaveBeenCalled()
    })

    it('should handle invalid tetris move', async () => {
      // Mock invalid move
      vi.mocked(TetrisValidator.validateMove).mockReturnValue({
        valid: false,
        reason: 'Collision detected'
      })

      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Verify error was emitted
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_MOVE',
        reason: 'Collision detected'
      })
    })

    it('should handle game over condition', async () => {
      // Mock game over
      vi.mocked(TetrisValidator.validateGameOver).mockReturnValue(true)

      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Verify game over was emitted
      expect(mockIO.to).toHaveBeenCalledWith('room123')
      expect(mockIO.emit).toHaveBeenCalledWith('tetris:game_over', {
        gameState: expect.any(Object)
      })
    })
  })

  describe('Connect4 Socket Handlers', () => {
    beforeEach(() => {
      // Mock anti-cheat system
      vi.mocked(AntiCheatSystem.analyzeMove).mockResolvedValue({
        suspicious: false,
        cheatScore: 0,
        reasons: [],
        action: undefined
      })

      // Mock Connect4 validator
      vi.mocked(Connect4Validator.validateMove).mockReturnValue({
        valid: true,
        reason: undefined,
        correctedMove: undefined
      })
      vi.mocked(Connect4Validator.findLowestEmptyRow).mockReturnValue(5)
      vi.mocked(Connect4Validator.applyMove).mockReturnValue({
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      })
      vi.mocked(Connect4Validator.checkWinner).mockReturnValue(false)
      vi.mocked(Connect4Validator.isBoardFull).mockReturnValue(false)
    })

    it('should handle valid connect4 move', async () => {
      const moveData = {
        roomId: 'room123',
        column: 3,
        playerId: 'user123',
        reactionTime: 200
      }

      registerConnect4Handlers(mockIO, mockSocket)

      const connect4Handler = mockSocket.listeners('connect4:drop_piece')[0]
      await connect4Handler(moveData)

      // Verify anti-cheat was called
      expect(AntiCheatSystem.analyzeMove).toHaveBeenCalledWith({
        gameType: 'connect4',
        moveType: 'drop_piece',
        timestamp: expect.any(Number),
        playerId: 'user123',
        gameId: 'room123',
        moveData: { column: 3 },
        reactionTime: 200
      })

      // Verify validator was called
      expect(Connect4Validator.validateMove).toHaveBeenCalled()
    })

    it('should handle invalid connect4 move', async () => {
      // Mock invalid move
      vi.mocked(Connect4Validator.validateMove).mockReturnValue({
        valid: false,
        reason: 'Column is full',
        correctedMove: undefined
      })

      const moveData = {
        roomId: 'room123',
        column: 3,
        playerId: 'user123',
        reactionTime: 200
      }

      registerConnect4Handlers(mockIO, mockSocket)

      const connect4Handler = mockSocket.listeners('connect4:drop_piece')[0]
      await connect4Handler(moveData)

      // Verify error was emitted
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_MOVE',
        reason: 'Column is full'
      })
    })

    it('should handle connect4 win condition', async () => {
      // Mock win condition
      vi.mocked(Connect4Validator.checkWinner).mockReturnValue(true)

      const moveData = {
        roomId: 'room123',
        column: 3,
        playerId: 'user123',
        reactionTime: 200
      }

      registerConnect4Handlers(mockIO, mockSocket)

      const connect4Handler = mockSocket.listeners('connect4:drop_piece')[0]
      await connect4Handler(moveData)

      // Verify game over was emitted
      expect(mockIO.to).toHaveBeenCalledWith('room123')
      expect(mockIO.emit).toHaveBeenCalledWith('connect4:game_over', {
        winner: 'user123',
        gameState: expect.any(Object)
      })
    })

    it('should handle connect4 draw condition', async () => {
      // Mock draw condition
      vi.mocked(Connect4Validator.isBoardFull).mockReturnValue(true)

      const moveData = {
        roomId: 'room123',
        column: 3,
        playerId: 'user123',
        reactionTime: 200
      }

      registerConnect4Handlers(mockIO, mockSocket)

      const connect4Handler = mockSocket.listeners('connect4:drop_piece')[0]
      await connect4Handler(moveData)

      // Verify draw was emitted
      expect(mockIO.to).toHaveBeenCalledWith('room123')
      expect(mockIO.emit).toHaveBeenCalledWith('connect4:game_over', {
        winner: null,
        gameState: expect.any(Object)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle anti-cheat system errors gracefully', async () => {
      // Mock anti-cheat error
      vi.mocked(AntiCheatSystem.analyzeMove).mockRejectedValue(new Error('Anti-cheat error'))

      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Should not crash, but may emit error
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'MOVE_FAILED'
      })
    })

    it('should handle validator errors gracefully', async () => {
      // Mock validator error
      vi.mocked(TetrisValidator.validateMove).mockImplementation(() => {
        throw new Error('Validator error')
      })

      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Should handle error gracefully
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'MOVE_FAILED'
      })
    })

    it('should handle missing game state gracefully', async () => {
      const moveData = {
        roomId: 'nonexistent',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Should emit game not found error
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'GAME_NOT_FOUND'
      })
    })
  })

  describe('Performance', () => {
    it('should handle moves quickly', async () => {
      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]

      const startTime = Date.now()
      await tetrisMoveHandler(moveData)
      const endTime = Date.now()

      // Should process within 100ms
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle concurrent moves efficiently', async () => {
      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 150
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]

      const startTime = Date.now()
      const promises = Array(10).fill(null).map(() => tetrisMoveHandler(moveData))
      await Promise.all(promises)
      const endTime = Date.now()

      // Should handle 10 concurrent moves within 500ms
      expect(endTime - startTime).toBeLessThan(500)
    })
  })

  describe('Security Integration', () => {
    it('should integrate anti-cheat with all game moves', async () => {
      const games = [
        { handler: registerTetrisHandlers, event: 'tetris:move' },
        { handler: registerConnect4Handlers, event: 'connect4:drop_piece' }
      ]

      for (const game of games) {
        vi.clearAllMocks()
        
        game.handler(mockIO, mockSocket)
        
        const handler = mockSocket.listeners(game.event)[0]
        await handler({ roomId: 'room123', playerId: 'user123' })

        // Verify anti-cheat was called
        expect(AntiCheatSystem.analyzeMove).toHaveBeenCalled()
      }
    })

    it('should log security events for suspicious activity', async () => {
      // Mock suspicious activity
      vi.mocked(AntiCheatSystem.analyzeMove).mockResolvedValue({
        suspicious: true,
        cheatScore: 100,
        reasons: ['Suspicious pattern detected'],
        action: 'kick'
      })

      const moveData = {
        roomId: 'room123',
        move: {
          action: 'move',
          direction: 'down',
          piece: { x: 5, y: 10, type: 'I' }
        },
        playerId: 'user123',
        reactionTime: 5
      }

      registerTetrisHandlers(mockIO, mockSocket)

      const tetrisMoveHandler = mockSocket.listeners('tetris:move')[0]
      await tetrisMoveHandler(moveData)

      // Verify audit logging was called (mocked in setup)
      // This would be verified through the AuditLogger mock
    })
  })
})
