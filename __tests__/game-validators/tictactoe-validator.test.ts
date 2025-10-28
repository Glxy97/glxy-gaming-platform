/**
 * Game Validator Tests - TicTacToe
 * Tests for TicTacToe game logic validation and server-side calculations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TicTacToeValidator } from '@/lib/game-validators/tictactoe-validator'

describe('TicTacToe Validator', () => {
  describe('validateMove', () => {
    it('should validate valid moves', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      const move = {
        row: 1,
        col: 1,
        playerId: 'player1'
      }

      const result = TicTacToeValidator.validateMove(move, board, 'player1')
      expect(result.valid).toBe(true)
    })

    it('should reject moves outside board boundaries', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      const invalidMoves = [
        { row: -1, col: 1, playerId: 'player1' },
        { row: 3, col: 1, playerId: 'player1' },
        { row: 1, col: -1, playerId: 'player1' },
        { row: 1, col: 3, playerId: 'player1' }
      ]

      invalidMoves.forEach(move => {
        const result = TicTacToeValidator.validateMove(move, board, 'player1')
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('boundary')
      })
    })

    it('should reject moves to occupied cells', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Occupy center cell
      board.grid[1][1] = 'player1'

      const move = {
        row: 1,
        col: 1,
        playerId: 'player2'
      }

      const result = TicTacToeValidator.validateMove(move, board, 'player2')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('occupied')
    })

    it('should reject moves from wrong player', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      const move = {
        row: 1,
        col: 1,
        playerId: 'player1'
      }

      const result = TicTacToeValidator.validateMove(move, board, 'player2')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('turn')
    })

    it('should handle all valid positions', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Test all 9 positions
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const move = {
            row,
            col,
            playerId: 'player1'
          }

          const result = TicTacToeValidator.validateMove(move, board, 'player1')
          expect(result.valid).toBe(true)
        }
      }
    })
  })

  describe('checkWinner', () => {
    it('should detect horizontal win', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Create horizontal win for player1
      board.grid[1][0] = 'player1'
      board.grid[1][1] = 'player1'
      board.grid[1][2] = 'player1'

      const result = TicTacToeValidator.checkWinner(board, 'player1')
      expect(result).toBe(true)
    })

    it('should detect vertical win', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Create vertical win for player2
      board.grid[0][1] = 'player2'
      board.grid[1][1] = 'player2'
      board.grid[2][1] = 'player2'

      const result = TicTacToeValidator.checkWinner(board, 'player2')
      expect(result).toBe(true)
    })

    it('should detect diagonal win (top-left to bottom-right)', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Create diagonal win for player1
      board.grid[0][0] = 'player1'
      board.grid[1][1] = 'player1'
      board.grid[2][2] = 'player1'

      const result = TicTacToeValidator.checkWinner(board, 'player1')
      expect(result).toBe(true)
    })

    it('should detect diagonal win (top-right to bottom-left)', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Create diagonal win for player2
      board.grid[0][2] = 'player2'
      board.grid[1][1] = 'player2'
      board.grid[2][0] = 'player2'

      const result = TicTacToeValidator.checkWinner(board, 'player2')
      expect(result).toBe(true)
    })

    it('should not detect win for incomplete lines', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Only 2 in a row
      board.grid[1][0] = 'player1'
      board.grid[1][1] = 'player1'

      const result = TicTacToeValidator.checkWinner(board, 'player1')
      expect(result).toBe(false)
    })

    it('should not detect win for mixed players', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Mixed players in a line
      board.grid[1][0] = 'player1'
      board.grid[1][1] = 'player2'
      board.grid[1][2] = 'player1'

      const result = TicTacToeValidator.checkWinner(board, 'player1')
      expect(result).toBe(false)
    })

    it('should handle edge cases correctly', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Win at edge of board
      board.grid[0][0] = 'player1'
      board.grid[0][1] = 'player1'
      board.grid[0][2] = 'player1'

      const result = TicTacToeValidator.checkWinner(board, 'player1')
      expect(result).toBe(true)
    })

    it('should handle multiple win conditions', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Create both horizontal and vertical wins
      board.grid[0][0] = 'player1'
      board.grid[0][1] = 'player1'
      board.grid[0][2] = 'player1'
      board.grid[1][0] = 'player1'
      board.grid[2][0] = 'player1'

      const result = TicTacToeValidator.checkWinner(board, 'player1')
      expect(result).toBe(true)
    })
  })

  describe('isBoardFull', () => {
    it('should detect full board', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Fill entire board
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          board.grid[y][x] = 'player1'
        }
      }

      const result = TicTacToeValidator.isBoardFull(board)
      expect(result).toBe(true)
    })

    it('should detect non-full board', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Leave one empty space
      board.grid[0][0] = null

      const result = TicTacToeValidator.isBoardFull(board)
      expect(result).toBe(false)
    })

    it('should detect empty board', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      const result = TicTacToeValidator.isBoardFull(board)
      expect(result).toBe(false)
    })

    it('should detect partially filled board', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Fill some cells
      board.grid[0][0] = 'player1'
      board.grid[0][1] = 'player2'
      board.grid[1][1] = 'player1'

      const result = TicTacToeValidator.isBoardFull(board)
      expect(result).toBe(false)
    })

    it('should handle mixed player fills', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Fill board with mixed players
      board.grid[0][0] = 'player1'
      board.grid[0][1] = 'player2'
      board.grid[0][2] = 'player1'
      board.grid[1][0] = 'player2'
      board.grid[1][1] = 'player1'
      board.grid[1][2] = 'player2'
      board.grid[2][0] = 'player1'
      board.grid[2][1] = 'player2'
      board.grid[2][2] = 'player1'

      const result = TicTacToeValidator.isBoardFull(board)
      expect(result).toBe(true)
    })
  })

  describe('Game Scenarios', () => {
    it('should handle complete game with winner', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Simulate a game
      board.grid[0][0] = 'player1'
      board.grid[0][1] = 'player2'
      board.grid[1][1] = 'player1'
      board.grid[0][2] = 'player2'
      board.grid[2][2] = 'player1' // player1 wins diagonally

      const hasWinner = TicTacToeValidator.checkWinner(board, 'player1')
      const isFull = TicTacToeValidator.isBoardFull(board)

      expect(hasWinner).toBe(true)
      expect(isFull).toBe(false)
    })

    it('should handle complete game with draw', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Simulate a draw game
      board.grid[0][0] = 'player1'
      board.grid[0][1] = 'player2'
      board.grid[0][2] = 'player1'
      board.grid[1][0] = 'player2'
      board.grid[1][1] = 'player1'
      board.grid[1][2] = 'player2'
      board.grid[2][0] = 'player2'
      board.grid[2][1] = 'player1'
      board.grid[2][2] = 'player2'

      const hasWinner1 = TicTacToeValidator.checkWinner(board, 'player1')
      const hasWinner2 = TicTacToeValidator.checkWinner(board, 'player2')
      const isFull = TicTacToeValidator.isBoardFull(board)

      expect(hasWinner1).toBe(false)
      expect(hasWinner2).toBe(false)
      expect(isFull).toBe(true)
    })

    it('should handle early win scenarios', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Early win in 3 moves
      board.grid[0][0] = 'player1'
      board.grid[1][0] = 'player2'
      board.grid[0][1] = 'player1'
      board.grid[1][1] = 'player2'
      board.grid[0][2] = 'player1' // player1 wins

      const hasWinner = TicTacToeValidator.checkWinner(board, 'player1')
      const isFull = TicTacToeValidator.isBoardFull(board)

      expect(hasWinner).toBe(true)
      expect(isFull).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid board dimensions', () => {
      const invalidBoard = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 0,
        height: 3
      }

      const move = {
        row: 1,
        col: 1,
        playerId: 'player1'
      }

      const result = TicTacToeValidator.validateMove(move, invalidBoard, 'player1')
      expect(result.valid).toBe(false)
    })

    it('should handle null board', () => {
      const move = {
        row: 1,
        col: 1,
        playerId: 'player1'
      }

      const result = TicTacToeValidator.validateMove(move, null as any, 'player1')
      expect(result.valid).toBe(false)
    })

    it('should handle invalid player IDs', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      const move = {
        row: 1,
        col: 1,
        playerId: null as any
      }

      const result = TicTacToeValidator.validateMove(move, board, 'player1')
      expect(result.valid).toBe(false)
    })

    it('should handle malformed board grid', () => {
      const malformedBoard = {
        grid: null,
        width: 3,
        height: 3
      }

      const move = {
        row: 1,
        col: 1,
        playerId: 'player1'
      }

      const result = TicTacToeValidator.validateMove(move, malformedBoard as any, 'player1')
      expect(result.valid).toBe(false)
    })

    it('should handle non-square boards', () => {
      const nonSquareBoard = {
        grid: Array(3).fill(null).map(() => Array(4).fill(null)),
        width: 4,
        height: 3
      }

      const move = {
        row: 1,
        col: 3,
        playerId: 'player1'
      }

      const result = TicTacToeValidator.validateMove(move, nonSquareBoard, 'player1')
      expect(result.valid).toBe(true) // Should still work for non-square boards
    })
  })

  describe('Performance', () => {
    it('should validate moves quickly', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      const move = {
        row: 1,
        col: 1,
        playerId: 'player1'
      }

      const startTime = Date.now()
      const result = TicTacToeValidator.validateMove(move, board, 'player1')
      const endTime = Date.now()

      expect(result.valid).toBe(true)
      expect(endTime - startTime).toBeLessThan(5)
    })

    it('should check winner efficiently', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      // Create a win condition
      board.grid[1][0] = 'player1'
      board.grid[1][1] = 'player1'
      board.grid[1][2] = 'player1'

      const startTime = Date.now()
      const result = TicTacToeValidator.checkWinner(board, 'player1')
      const endTime = Date.now()

      expect(result).toBe(true)
      expect(endTime - startTime).toBeLessThan(5)
    })

    it('should handle multiple operations efficiently', () => {
      const board = {
        grid: Array(3).fill(null).map(() => Array(3).fill(null)),
        width: 3,
        height: 3
      }

      const startTime = Date.now()

      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        TicTacToeValidator.isBoardFull(board)
        TicTacToeValidator.checkWinner(board, 'player1')
      }

      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})
