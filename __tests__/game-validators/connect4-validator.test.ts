/**
 * Game Validator Tests - Connect4
 * Tests for Connect4 game logic validation and server-side calculations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Connect4Validator } from '@/lib/game-validators/connect4-validator'

describe('Connect4 Validator', () => {
  describe('validateMove', () => {
    it('should validate valid column moves', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const move = {
        column: 3,
        playerId: 'player1'
      }

      const result = Connect4Validator.validateMove(move, board, 'player1')
      expect(result.valid).toBe(true)
    })

    it('should reject moves outside column bounds', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const invalidMoves = [
        { column: -1, playerId: 'player1' },
        { column: 7, playerId: 'player1' },
        { column: 10, playerId: 'player1' }
      ]

      invalidMoves.forEach(move => {
        const result = Connect4Validator.validateMove(move, board, 'player1')
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('column')
      })
    })

    it('should reject moves to full columns', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Fill column 0 completely
      for (let y = 0; y < 6; y++) {
        board.grid[y][0] = 'player1'
      }

      const move = {
        column: 0,
        playerId: 'player2'
      }

      const result = Connect4Validator.validateMove(move, board, 'player2')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('full')
    })

    it('should reject moves from wrong player', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const move = {
        column: 3,
        playerId: 'player1'
      }

      const result = Connect4Validator.validateMove(move, board, 'player2')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('turn')
    })

    it('should handle partial column fills correctly', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Partially fill column 3
      board.grid[5][3] = 'player1'
      board.grid[4][3] = 'player2'

      const move = {
        column: 3,
        playerId: 'player1'
      }

      const result = Connect4Validator.validateMove(move, board, 'player1')
      expect(result.valid).toBe(true)
    })
  })

  describe('findLowestEmptyRow', () => {
    it('should find correct row for empty column', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const row = Connect4Validator.findLowestEmptyRow(3, board)
      expect(row).toBe(5) // Bottom row (0-indexed from top)
    })

    it('should find correct row for partially filled column', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Fill bottom 3 rows of column 3
      board.grid[5][3] = 'player1'
      board.grid[4][3] = 'player2'
      board.grid[3][3] = 'player1'

      const row = Connect4Validator.findLowestEmptyRow(3, board)
      expect(row).toBe(2) // Next empty row
    })

    it('should return -1 for full column', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Fill entire column 3
      for (let y = 0; y < 6; y++) {
        board.grid[y][3] = 'player1'
      }

      const row = Connect4Validator.findLowestEmptyRow(3, board)
      expect(row).toBe(-1) // No empty row
    })

    it('should handle invalid column numbers', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const invalidColumns = [-1, 7, 10]

      invalidColumns.forEach(column => {
        const row = Connect4Validator.findLowestEmptyRow(column, board)
        expect(row).toBe(-1)
      })
    })
  })

  describe('applyMove', () => {
    it('should apply move to correct position', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const move = {
        column: 3,
        playerId: 'player1',
        row: 5
      }

      const result = Connect4Validator.applyMove(board, move)
      
      expect(result.grid[5][3]).toBe('player1')
      expect(result.grid[4][3]).toBe(null)
    })

    it('should apply multiple moves correctly', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Apply first move
      const move1 = {
        column: 3,
        playerId: 'player1',
        row: 5
      }
      let result = Connect4Validator.applyMove(board, move1)

      // Apply second move
      const move2 = {
        column: 3,
        playerId: 'player2',
        row: 4
      }
      result = Connect4Validator.applyMove(result, move2)

      expect(result.grid[5][3]).toBe('player1')
      expect(result.grid[4][3]).toBe('player2')
      expect(result.grid[3][3]).toBe(null)
    })

    it('should not modify original board', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const originalGrid = JSON.parse(JSON.stringify(board.grid))

      const move = {
        column: 3,
        playerId: 'player1',
        row: 5
      }

      Connect4Validator.applyMove(board, move)

      // Original board should be unchanged
      expect(board.grid).toEqual(originalGrid)
    })
  })

  describe('checkWinner', () => {
    it('should detect horizontal win', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Create horizontal win for player1
      board.grid[5][0] = 'player1'
      board.grid[5][1] = 'player1'
      board.grid[5][2] = 'player1'
      board.grid[5][3] = 'player1'

      const result = Connect4Validator.checkWinner(board, 5, 3, 'player1')
      expect(result).toBe(true)
    })

    it('should detect vertical win', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Create vertical win for player2
      board.grid[2][3] = 'player2'
      board.grid[3][3] = 'player2'
      board.grid[4][3] = 'player2'
      board.grid[5][3] = 'player2'

      const result = Connect4Validator.checkWinner(board, 5, 3, 'player2')
      expect(result).toBe(true)
    })

    it('should detect diagonal win (top-left to bottom-right)', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Create diagonal win for player1
      board.grid[2][0] = 'player1'
      board.grid[3][1] = 'player1'
      board.grid[4][2] = 'player1'
      board.grid[5][3] = 'player1'

      const result = Connect4Validator.checkWinner(board, 5, 3, 'player1')
      expect(result).toBe(true)
    })

    it('should detect diagonal win (top-right to bottom-left)', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Create diagonal win for player2
      board.grid[2][6] = 'player2'
      board.grid[3][5] = 'player2'
      board.grid[4][4] = 'player2'
      board.grid[5][3] = 'player2'

      const result = Connect4Validator.checkWinner(board, 5, 3, 'player2')
      expect(result).toBe(true)
    })

    it('should not detect win for incomplete lines', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Only 3 in a row
      board.grid[5][0] = 'player1'
      board.grid[5][1] = 'player1'
      board.grid[5][2] = 'player1'

      const result = Connect4Validator.checkWinner(board, 5, 2, 'player1')
      expect(result).toBe(false)
    })

    it('should not detect win for mixed players', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Mixed players in a line
      board.grid[5][0] = 'player1'
      board.grid[5][1] = 'player2'
      board.grid[5][2] = 'player1'
      board.grid[5][3] = 'player1'

      const result = Connect4Validator.checkWinner(board, 5, 3, 'player1')
      expect(result).toBe(false)
    })

    it('should handle edge cases correctly', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Win at edge of board
      board.grid[5][3] = 'player1'
      board.grid[5][4] = 'player1'
      board.grid[5][5] = 'player1'
      board.grid[5][6] = 'player1'

      const result = Connect4Validator.checkWinner(board, 5, 6, 'player1')
      expect(result).toBe(true)
    })
  })

  describe('isBoardFull', () => {
    it('should detect full board', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Fill entire board
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 7; x++) {
          board.grid[y][x] = 'player1'
        }
      }

      const result = Connect4Validator.isBoardFull(board)
      expect(result).toBe(true)
    })

    it('should detect non-full board', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Leave one empty space
      board.grid[0][0] = null

      const result = Connect4Validator.isBoardFull(board)
      expect(result).toBe(false)
    })

    it('should detect empty board', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const result = Connect4Validator.isBoardFull(board)
      expect(result).toBe(false)
    })

    it('should detect partially filled board', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Fill bottom half
      for (let y = 3; y < 6; y++) {
        for (let x = 0; x < 7; x++) {
          board.grid[y][x] = 'player1'
        }
      }

      const result = Connect4Validator.isBoardFull(board)
      expect(result).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid board dimensions', () => {
      const invalidBoard = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 0,
        height: 6
      }

      const move = {
        column: 3,
        playerId: 'player1'
      }

      const result = Connect4Validator.validateMove(move, invalidBoard, 'player1')
      expect(result.valid).toBe(false)
    })

    it('should handle null board', () => {
      const move = {
        column: 3,
        playerId: 'player1'
      }

      const result = Connect4Validator.validateMove(move, null as any, 'player1')
      expect(result.valid).toBe(false)
    })

    it('should handle invalid player IDs', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const move = {
        column: 3,
        playerId: null as any
      }

      const result = Connect4Validator.validateMove(move, board, 'player1')
      expect(result.valid).toBe(false)
    })

    it('should handle malformed board grid', () => {
      const malformedBoard = {
        grid: null,
        width: 7,
        height: 6
      }

      const move = {
        column: 3,
        playerId: 'player1'
      }

      const result = Connect4Validator.validateMove(move, malformedBoard as any, 'player1')
      expect(result.valid).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should validate moves quickly', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      const move = {
        column: 3,
        playerId: 'player1'
      }

      const startTime = Date.now()
      const result = Connect4Validator.validateMove(move, board, 'player1')
      const endTime = Date.now()

      expect(result.valid).toBe(true)
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should check winner efficiently', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Create a win condition
      board.grid[5][0] = 'player1'
      board.grid[5][1] = 'player1'
      board.grid[5][2] = 'player1'
      board.grid[5][3] = 'player1'

      const startTime = Date.now()
      const result = Connect4Validator.checkWinner(board, 5, 3, 'player1')
      const endTime = Date.now()

      expect(result).toBe(true)
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should handle complex board states efficiently', () => {
      const board = {
        grid: Array(6).fill(null).map(() => Array(7).fill(null)),
        width: 7,
        height: 6
      }

      // Fill most of the board
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 7; x++) {
          if (Math.random() > 0.2) {
            board.grid[y][x] = Math.random() > 0.5 ? 'player1' : 'player2'
          }
        }
      }

      const startTime = Date.now()
      const result = Connect4Validator.isBoardFull(board)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})
