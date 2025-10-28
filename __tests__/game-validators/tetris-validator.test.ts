/**
 * Game Validator Tests - Tetris
 * Tests for Tetris game logic validation and server-side calculations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TetrisValidator } from '@/lib/game-validators/tetris-validator'

describe('Tetris Validator', () => {
  describe('validateMove', () => {
    it('should validate piece placement within board boundaries', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const piece = {
        shape: [
          [1, 1],
          [1, 1]
        ],
        x: 0,
        y: 0,
        type: 'O'
      }

      const move = {
        piece,
        board,
        action: 'move',
        direction: 'down'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(true)
    })

    it('should reject moves outside board boundaries', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const piece = {
        shape: [
          [1, 1],
          [1, 1]
        ],
        x: 9, // Too far right
        y: 0,
        type: 'O'
      }

      const move = {
        piece,
        board,
        action: 'move',
        direction: 'right'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('boundary')
    })

    it('should detect collisions with existing pieces', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Place some blocks at the bottom
      board.grid[19][0] = 'filled'
      board.grid[19][1] = 'filled'

      const piece = {
        shape: [
          [1, 1],
          [1, 1]
        ],
        x: 0,
        y: 18, // Would collide with existing blocks
        type: 'O'
      }

      const move = {
        piece,
        board,
        action: 'move',
        direction: 'down'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('collision')
    })

    it('should validate different piece types', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

      pieceTypes.forEach(type => {
        const piece = {
          shape: [[1]], // Simplified shape for testing
          x: 5,
          y: 0,
          type
        }

        const move = {
          piece,
          board,
          action: 'move',
          direction: 'down'
        }

        const result = TetrisValidator.validateMove(move, board)
        expect(result.valid).toBe(true)
      })
    })

    it('should validate rotation moves', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const piece = {
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ],
        x: 4,
        y: 0,
        type: 'T'
      }

      const move = {
        piece,
        board,
        action: 'rotate',
        direction: 'clockwise'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(true)
    })

    it('should reject rotation when it would cause collision', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Place blocks that would block rotation
      board.grid[0][6] = 'filled'
      board.grid[1][6] = 'filled'

      const piece = {
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ],
        x: 4,
        y: 0,
        type: 'T'
      }

      const move = {
        piece,
        board,
        action: 'rotate',
        direction: 'clockwise'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('collision')
    })
  })

  describe('validateLinesCleared', () => {
    it('should validate correct number of lines cleared', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Fill bottom row completely
      for (let x = 0; x < 10; x++) {
        board.grid[19][x] = 'filled'
      }

      const result = TetrisValidator.validateLinesCleared(1, board)
      expect(result.valid).toBe(true)
    })

    it('should reject incorrect line clear claims', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Only partially fill bottom row
      board.grid[19][0] = 'filled'
      board.grid[19][1] = 'filled'

      const result = TetrisValidator.validateLinesCleared(1, board)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('line')
    })

    it('should validate multiple line clears', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Fill last two rows completely
      for (let y = 18; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          board.grid[y][x] = 'filled'
        }
      }

      const result = TetrisValidator.validateLinesCleared(2, board)
      expect(result.valid).toBe(true)
    })

    it('should reject Tetris (4 lines) when only 3 are filled', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Fill last 3 rows completely
      for (let y = 17; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          board.grid[y][x] = 'filled'
        }
      }

      const result = TetrisValidator.validateLinesCleared(4, board)
      expect(result.valid).toBe(false)
    })
  })

  describe('calculateScore', () => {
    it('should calculate correct score for single line clear', () => {
      const score = TetrisValidator.calculateScore(1, 1, 0)
      expect(score).toBe(40) // 40 * level
    })

    it('should calculate correct score for double line clear', () => {
      const score = TetrisValidator.calculateScore(2, 1, 0)
      expect(score).toBe(100) // 100 * level
    })

    it('should calculate correct score for triple line clear', () => {
      const score = TetrisValidator.calculateScore(3, 1, 0)
      expect(score).toBe(300) // 300 * level
    })

    it('should calculate correct score for Tetris (4 lines)', () => {
      const score = TetrisValidator.calculateScore(4, 1, 0)
      expect(score).toBe(1200) // 1200 * level
    })

    it('should scale score with level', () => {
      const level1Score = TetrisValidator.calculateScore(1, 1, 0)
      const level5Score = TetrisValidator.calculateScore(1, 5, 0)
      
      expect(level5Score).toBe(level1Score * 5)
    })

    it('should handle combo scoring', () => {
      const noComboScore = TetrisValidator.calculateScore(1, 1, 0)
      const comboScore = TetrisValidator.calculateScore(1, 1, 2)
      
      expect(comboScore).toBeGreaterThan(noComboScore)
    })

    it('should handle edge cases', () => {
      expect(TetrisValidator.calculateScore(0, 1, 0)).toBe(0)
      expect(TetrisValidator.calculateScore(5, 1, 0)).toBe(0) // Invalid line count
      expect(TetrisValidator.calculateScore(1, 0, 0)).toBe(0) // Invalid level
    })
  })

  describe('calculateAttackLines', () => {
    it('should calculate correct attack lines for single clear', () => {
      const attackLines = TetrisValidator.calculateAttackLines(1, 0)
      expect(attackLines).toBe(0) // Single line clear doesn't send attack
    })

    it('should calculate correct attack lines for double clear', () => {
      const attackLines = TetrisValidator.calculateAttackLines(2, 0)
      expect(attackLines).toBe(1)
    })

    it('should calculate correct attack lines for triple clear', () => {
      const attackLines = TetrisValidator.calculateAttackLines(3, 0)
      expect(attackLines).toBe(2)
    })

    it('should calculate correct attack lines for Tetris', () => {
      const attackLines = TetrisValidator.calculateAttackLines(4, 0)
      expect(attackLines).toBe(4)
    })

    it('should add combo bonus to attack lines', () => {
      const noComboAttack = TetrisValidator.calculateAttackLines(2, 0)
      const comboAttack = TetrisValidator.calculateAttackLines(2, 1)
      
      expect(comboAttack).toBeGreaterThan(noComboAttack)
    })

    it('should handle T-Spin attack lines', () => {
      // T-Spin single should send 2 attack lines
      const tSpinAttack = TetrisValidator.calculateAttackLines(1, 0, true)
      expect(tSpinAttack).toBe(2)
    })
  })

  describe('validateGameOver', () => {
    it('should detect game over when pieces reach top', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Place piece at top of board
      board.grid[0][5] = 'filled'

      const result = TetrisValidator.validateGameOver(board)
      expect(result).toBe(true)
    })

    it('should not detect game over when board is clear', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const result = TetrisValidator.validateGameOver(board)
      expect(result).toBe(false)
    })

    it('should detect game over with pieces near top', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Place pieces in second row
      for (let x = 0; x < 10; x++) {
        board.grid[1][x] = 'filled'
      }

      const result = TetrisValidator.validateGameOver(board)
      expect(result).toBe(true)
    })

    it('should handle partial top row correctly', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Only partially fill top row
      board.grid[0][0] = 'filled'
      board.grid[0][1] = 'filled'

      const result = TetrisValidator.validateGameOver(board)
      expect(result).toBe(false) // Not game over yet
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid piece shapes', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const invalidPiece = {
        shape: null,
        x: 0,
        y: 0,
        type: 'INVALID'
      }

      const move = {
        piece: invalidPiece,
        board,
        action: 'move',
        direction: 'down'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(false)
    })

    it('should handle invalid board dimensions', () => {
      const invalidBoard = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 0, // Invalid width
        height: 20
      }

      const piece = {
        shape: [[1]],
        x: 0,
        y: 0,
        type: 'I'
      }

      const move = {
        piece,
        board: invalidBoard,
        action: 'move',
        direction: 'down'
      }

      const result = TetrisValidator.validateMove(move, invalidBoard)
      expect(result.valid).toBe(false)
    })

    it('should handle negative coordinates', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const piece = {
        shape: [[1]],
        x: -1, // Negative x
        y: 0,
        type: 'I'
      }

      const move = {
        piece,
        board,
        action: 'move',
        direction: 'down'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(false)
    })

    it('should handle very large coordinates', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const piece = {
        shape: [[1]],
        x: 1000, // Very large x
        y: 0,
        type: 'I'
      }

      const move = {
        piece,
        board,
        action: 'move',
        direction: 'down'
      }

      const result = TetrisValidator.validateMove(move, board)
      expect(result.valid).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should validate moves quickly', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      const piece = {
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ],
        x: 4,
        y: 0,
        type: 'T'
      }

      const move = {
        piece,
        board,
        action: 'move',
        direction: 'down'
      }

      const startTime = Date.now()
      const result = TetrisValidator.validateMove(move, board)
      const endTime = Date.now()

      expect(result.valid).toBe(true)
      expect(endTime - startTime).toBeLessThan(10) // Should be very fast
    })

    it('should handle complex board states efficiently', () => {
      const board = {
        grid: Array(20).fill(null).map(() => Array(10).fill(null)),
        width: 10,
        height: 20
      }

      // Fill most of the board with pieces
      for (let y = 10; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          if (Math.random() > 0.3) {
            board.grid[y][x] = 'filled'
          }
        }
      }

      const piece = {
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ],
        x: 4,
        y: 8,
        type: 'T'
      }

      const move = {
        piece,
        board,
        action: 'move',
        direction: 'down'
      }

      const startTime = Date.now()
      const result = TetrisValidator.validateMove(move, board)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(50) // Should still be fast
    })
  })
})
