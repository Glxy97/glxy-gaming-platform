// @ts-nocheck
/**
 * Connect4 Game Validator
 * Server-side validation for Connect4 game moves and logic
 */

export interface Connect4Board {
  grid: (string | null)[][]
  width: number
  height: number
}

export interface Connect4Move {
  column: number
  playerId: string
  row?: number // Calculated server-side
}

export interface ValidationResult {
  valid: boolean
  reason?: string
  correctedMove?: Connect4Move
}

export class Connect4Validator {
  static readonly BOARD_WIDTH = 7
  static readonly BOARD_HEIGHT = 6
  static readonly WIN_CONDITION = 4

  /**
   * Validate a Connect4 move
   */
  static validateMove(move: Connect4Move, board: Connect4Board, currentPlayer: string): ValidationResult {
    try {
      // Validate board dimensions
      if (!this.validateBoardDimensions(board)) {
        return { valid: false, reason: 'Invalid board dimensions' }
      }

      // Validate column
      if (!this.validateColumn(move.column)) {
        return { valid: false, reason: 'Invalid column' }
      }

      // Check if column is full
      if (this.isColumnFull(move.column, board)) {
        return { valid: false, reason: 'Column is full' }
      }

      // Validate player turn
      if (move.playerId !== currentPlayer) {
        return { valid: false, reason: 'Not your turn' }
      }

      // Calculate and validate row
      const row = this.findLowestEmptyRow(move.column, board)
      if (row === -1) {
        return { valid: false, reason: 'No empty row found' }
      }

      const correctedMove = { ...move, row }

      return { valid: true, correctedMove }
    } catch (error) {
      return { valid: false, reason: 'Validation error: ' + error }
    }
  }

  /**
   * Validate board dimensions
   */
  private static validateBoardDimensions(board: Connect4Board): boolean {
    return board.width === this.BOARD_WIDTH && 
           board.height === this.BOARD_HEIGHT &&
           board.grid.length === this.BOARD_HEIGHT &&
           board.grid.every(row => row.length === this.BOARD_WIDTH)
  }

  /**
   * Validate column index
   */
  private static validateColumn(column: number): boolean {
    return Number.isInteger(column) && 
           column >= 0 && 
           column < this.BOARD_WIDTH
  }

  /**
   * Check if column is full
   */
  private static isColumnFull(column: number, board: Connect4Board): boolean {
    return board.grid[0][column] !== null
  }

  /**
   * Find lowest empty row in column
   */
  private static findLowestEmptyRow(column: number, board: Connect4Board): number {
    for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
      if (board.grid[row][column] === null) {
        return row
      }
    }
    return -1
  }

  /**
   * Check for winner after a move
   */
  static checkWinner(board: Connect4Board, row: number, col: number, playerId: string): boolean {
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal \
      [1, -1]   // Diagonal /
    ]

    for (const [dRow, dCol] of directions) {
      let count = 1

      // Check positive direction
      for (let i = 1; i < this.WIN_CONDITION; i++) {
        const newRow = row + i * dRow
        const newCol = col + i * dCol
        if (this.isValidPosition(newRow, newCol) && 
            board.grid[newRow][newCol] === playerId) {
          count++
        } else break
      }

      // Check negative direction
      for (let i = 1; i < this.WIN_CONDITION; i++) {
        const newRow = row - i * dRow
        const newCol = col - i * dCol
        if (this.isValidPosition(newRow, newCol) && 
            board.grid[newRow][newCol] === playerId) {
          count++
        } else break
      }

      if (count >= this.WIN_CONDITION) {
        return true
      }
    }

    return false
  }

  /**
   * Check if position is valid
   */
  private static isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.BOARD_HEIGHT && 
           col >= 0 && col < this.BOARD_WIDTH
  }

  /**
   * Check if board is full (draw condition)
   */
  static isBoardFull(board: Connect4Board): boolean {
    for (let col = 0; col < this.BOARD_WIDTH; col++) {
      if (board.grid[0][col] === null) {
        return false
      }
    }
    return true
  }

  /**
   * Apply move to board
   */
  static applyMove(board: Connect4Board, move: Connect4Move): Connect4Board {
    const newBoard = {
      ...board,
      grid: board.grid.map(row => [...row])
    }

    const row = this.findLowestEmptyRow(move.column, board)
    if (row !== -1) {
      newBoard.grid[row][move.column] = move.playerId
    }

    return newBoard
  }

  /**
   * Generate all possible moves
   */
  static getPossibleMoves(board: Connect4Board): number[] {
    const moves: number[] = []
    
    for (let col = 0; col < this.BOARD_WIDTH; col++) {
      if (!this.isColumnFull(col, board)) {
        moves.push(col)
      }
    }

    return moves
  }

  /**
   * Validate game state
   */
  static validateGameState(board: Connect4Board): ValidationResult {
    // Check for invalid pieces (more than 2 players)
    const players = new Set<string>()
    
    for (let row = 0; row < this.BOARD_HEIGHT; row++) {
      for (let col = 0; col < this.BOARD_WIDTH; col++) {
        const piece = board.grid[row][col]
        if (piece !== null) {
          players.add(piece)
        }
      }
    }

    if (players.size > 2) {
      return { valid: false, reason: 'Too many players on board' }
    }

    // Check for floating pieces (pieces above empty spaces)
    for (let col = 0; col < this.BOARD_WIDTH; col++) {
      let foundPiece = false
      for (let row = 0; row < this.BOARD_HEIGHT; row++) {
        const piece = board.grid[row][col]
        if (piece !== null) {
          foundPiece = true
        } else if (foundPiece) {
          return { valid: false, reason: 'Floating piece detected' }
        }
      }
    }

    return { valid: true }
  }

  /**
   * Calculate move score for AI
   */
  static calculateMoveScore(board: Connect4Board, column: number, playerId: string): number {
    const row = this.findLowestEmptyRow(column, board)
    if (row === -1) return -1000 // Invalid move

    const testBoard = this.applyMove(board, { column, playerId, row })
    
    // Check if this move wins
    if (this.checkWinner(testBoard, row, column, playerId)) {
      return 1000
    }

    // Check if opponent can win next turn
    const opponentId = this.getOpponentId(board, playerId)
    const possibleMoves = this.getPossibleMoves(testBoard)
    
    for (const moveCol of possibleMoves) {
      const moveRow = this.findLowestEmptyRow(moveCol, testBoard)
      const opponentBoard = this.applyMove(testBoard, { column: moveCol, playerId: opponentId, row: moveRow })
      
      if (this.checkWinner(opponentBoard, moveRow, moveCol, opponentId)) {
        return -500 // Block opponent
      }
    }

    // Center column preference
    if (column === Math.floor(this.BOARD_WIDTH / 2)) {
      return 10
    }

    return 0
  }

  /**
   * Get opponent ID
   */
  private static getOpponentId(board: Connect4Board, playerId: string): string {
    const players = new Set<string>()
    
    for (let row = 0; row < this.BOARD_HEIGHT; row++) {
      for (let col = 0; col < this.BOARD_WIDTH; col++) {
        const piece = board.grid[row][col]
        if (piece !== null) {
          players.add(piece)
        }
      }
    }

    const playerArray = Array.from(players)
    return playerArray.find(id => id !== playerId) || 'opponent'
  }
}
