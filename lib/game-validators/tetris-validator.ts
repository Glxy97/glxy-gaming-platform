// @ts-nocheck
/**
 * Tetris Game Validator
 * Server-side validation for Tetris game moves and logic
 */

export interface TetrisPiece {
  shape: number[][]
  x: number
  y: number
  type: string
}

export interface TetrisBoard {
  grid: (string | null)[][]
  width: number
  height: number
}

export interface TetrisMove {
  piece: TetrisPiece
  board: TetrisBoard
  action: 'move' | 'rotate' | 'drop' | 'hard_drop'
  direction?: 'left' | 'right' | 'down'
}

export interface ValidationResult {
  valid: boolean
  reason?: string
  correctedMove?: TetrisMove
}

export class TetrisValidator {
  static readonly BOARD_WIDTH = 10
  static readonly BOARD_HEIGHT = 20

  /**
   * Validate a Tetris move
   */
  static validateMove(move: TetrisMove, currentBoard: TetrisBoard): ValidationResult {
    try {
      // Validate board dimensions
      if (!this.validateBoardDimensions(move.board)) {
        return { valid: false, reason: 'Invalid board dimensions' }
      }

      // Validate piece structure
      if (!this.validatePieceStructure(move.piece)) {
        return { valid: false, reason: 'Invalid piece structure' }
      }

      // Check if piece is within bounds
      if (!this.isPieceInBounds(move.piece, move.board)) {
        return { valid: false, reason: 'Piece out of bounds' }
      }

      // Check for collisions
      if (this.hasCollision(move.piece, move.board)) {
        return { valid: false, reason: 'Piece collision detected' }
      }

      // Validate move type
      if (!this.validateMoveType(move.action, move.direction)) {
        return { valid: false, reason: 'Invalid move type' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, reason: 'Validation error: ' + error }
    }
  }

  /**
   * Validate board dimensions
   */
  private static validateBoardDimensions(board: TetrisBoard): boolean {
    return board.width === this.BOARD_WIDTH && 
           board.height === this.BOARD_HEIGHT &&
           board.grid.length === this.BOARD_HEIGHT &&
           board.grid.every(row => row.length === this.BOARD_WIDTH)
  }

  /**
   * Validate piece structure
   */
  private static validatePieceStructure(piece: TetrisPiece): boolean {
    if (!piece.shape || !Array.isArray(piece.shape)) return false
    if (typeof piece.x !== 'number' || typeof piece.y !== 'number') return false
    if (!piece.type || typeof piece.type !== 'string') return false

    // Check if shape is valid (non-empty 2D array)
    if (piece.shape.length === 0) return false
    if (piece.shape.some(row => !Array.isArray(row) || row.length === 0)) return false

    return true
  }

  /**
   * Check if piece is within board bounds
   */
  private static isPieceInBounds(piece: TetrisPiece, board: TetrisBoard): boolean {
    const { shape, x, y } = piece

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const boardX = x + col
          const boardY = y + row

          if (boardX < 0 || boardX >= board.width || 
              boardY < 0 || boardY >= board.height) {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * Check for piece collisions
   */
  private static hasCollision(piece: TetrisPiece, board: TetrisBoard): boolean {
    const { shape, x, y } = piece

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const boardX = x + col
          const boardY = y + row

          if (board.grid[boardY][boardX] !== null) {
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * Validate move type and direction
   */
  private static validateMoveType(action: string, direction?: string): boolean {
    const validActions = ['move', 'rotate', 'drop', 'hard_drop']
    if (!validActions.includes(action)) return false

    if (action === 'move' && direction) {
      const validDirections = ['left', 'right', 'down']
      return validDirections.includes(direction)
    }

    return true
  }

  /**
   * Calculate score for lines cleared
   */
  static calculateScore(linesCleared: number, level: number, combo: number): number {
    const baseScores = [0, 40, 100, 300, 1200] // Single, Double, Triple, Tetris
    const baseScore = baseScores[linesCleared] || 0
    const levelMultiplier = level + 1
    const comboBonus = combo * 50

    return (baseScore * levelMultiplier) + comboBonus
  }

  /**
   * Calculate attack lines for battle mode
   */
  static calculateAttackLines(linesCleared: number, combo: number): number {
    let attackLines = 0

    switch (linesCleared) {
      case 1: attackLines = 0; break
      case 2: attackLines = 1; break
      case 3: attackLines = 2; break
      case 4: attackLines = 4; break // Tetris!
      default: attackLines = 0
    }

    // Add combo bonus
    if (combo > 0) {
      attackLines += Math.floor(combo / 2)
    }

    return attackLines
  }

  /**
   * Validate lines cleared event
   */
  static validateLinesCleared(linesCleared: number, board: TetrisBoard): ValidationResult {
    if (linesCleared < 0 || linesCleared > 4) {
      return { valid: false, reason: 'Invalid lines cleared count' }
    }

    // Count actual full lines
    const actualFullLines = this.countFullLines(board)
    
    if (actualFullLines !== linesCleared) {
      return { valid: false, reason: `Mismatch: claimed ${linesCleared}, actual ${actualFullLines}` }
    }

    return { valid: true }
  }

  /**
   * Count full lines in board
   */
  private static countFullLines(board: TetrisBoard): number {
    let count = 0
    
    for (let row = 0; row < board.height; row++) {
      if (board.grid[row].every(cell => cell !== null)) {
        count++
      }
    }

    return count
  }

  /**
   * Validate game over condition
   */
  static validateGameOver(board: TetrisBoard): boolean {
    // Check if any piece is in the top row
    for (let col = 0; col < board.width; col++) {
      if (board.grid[0][col] !== null) {
        return true
      }
    }

    return false
  }

  /**
   * Generate corrected move if possible
   */
  static generateCorrectedMove(move: TetrisMove, currentBoard: TetrisBoard): TetrisMove | null {
    // Try to find a valid position for the piece
    const { piece } = move
    
    // Try moving left/right to find valid position
    for (let offset = -2; offset <= 2; offset++) {
      const correctedPiece = { ...piece, x: piece.x + offset }
      const testMove = { ...move, piece: correctedPiece }
      
      if (this.validateMove(testMove, currentBoard).valid) {
        return testMove
      }
    }

    return null
  }
}
