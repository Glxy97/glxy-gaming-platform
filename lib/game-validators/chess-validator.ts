// @ts-nocheck
/**
 * Chess Game Validator
 * Server-side validation for Chess game moves and logic
 * Note: This is a simplified validator. For production, consider using chess.js library
 */

export interface ChessPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
  color: 'white' | 'black'
}

export interface ChessBoard {
  grid: (ChessPiece | null)[][]
  turn: 'white' | 'black'
  castlingRights: {
    white: { kingside: boolean; queenside: boolean }
    black: { kingside: boolean; queenside: boolean }
  }
  enPassantTarget: string | null
  halfMoveClock: number
  fullMoveNumber: number
}

export interface ChessMove {
  from: string // e.g., "e2"
  to: string   // e.g., "e4"
  piece: ChessPiece
  promotion?: 'queen' | 'rook' | 'bishop' | 'knight'
  capturedPiece?: ChessPiece
  isCheck?: boolean
  isCheckmate?: boolean
  isStalemate?: boolean
}

export interface ValidationResult {
  valid: boolean
  reason?: string
  correctedMove?: ChessMove
}

export class ChessValidator {
  static readonly BOARD_SIZE = 8

  /**
   * Validate a Chess move
   */
  static validateMove(move: ChessMove, board: ChessBoard, playerColor: 'white' | 'black'): ValidationResult {
    try {
      // Validate board dimensions
      if (!this.validateBoardDimensions(board)) {
        return { valid: false, reason: 'Invalid board dimensions' }
      }

      // Validate move format
      if (!this.validateMoveFormat(move)) {
        return { valid: false, reason: 'Invalid move format' }
      }

      // Validate player turn
      if (board.turn !== playerColor) {
        return { valid: false, reason: 'Not your turn' }
      }

      // Validate piece ownership
      if (move.piece.color !== playerColor) {
        return { valid: false, reason: 'Not your piece' }
      }

      // Convert algebraic notation to coordinates
      const fromPos = this.algebraicToCoords(move.from)
      const toPos = this.algebraicToCoords(move.to)

      if (!fromPos || !toPos) {
        return { valid: false, reason: 'Invalid position notation' }
      }

      // Validate piece at source
      const sourcePiece = board.grid[fromPos.row][fromPos.col]
      if (!sourcePiece || sourcePiece.type !== move.piece.type || sourcePiece.color !== move.piece.color) {
        return { valid: false, reason: 'Piece mismatch at source' }
      }

      // Basic move validation (simplified)
      if (!this.isBasicMoveValid(move, board, fromPos, toPos)) {
        return { valid: false, reason: 'Invalid move pattern' }
      }

      // Check if move puts own king in check
      const testBoard = this.applyMove(board, move)
      if (this.isKingInCheck(testBoard, playerColor)) {
        return { valid: false, reason: 'Move puts own king in check' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, reason: 'Validation error: ' + error }
    }
  }

  /**
   * Validate board dimensions
   */
  private static validateBoardDimensions(board: ChessBoard): boolean {
    return board.grid.length === this.BOARD_SIZE &&
           board.grid.every(row => row.length === this.BOARD_SIZE)
  }

  /**
   * Validate move format
   */
  private static validateMoveFormat(move: ChessMove): boolean {
    // Basic format validation
    if (!move.from || !move.to || !move.piece) return false
    if (move.from.length !== 2 || move.to.length !== 2) return false
    
    // Validate piece type
    const validTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king']
    if (!validTypes.includes(move.piece.type)) return false
    
    // Validate piece color
    if (!['white', 'black'].includes(move.piece.color)) return false

    return true
  }

  /**
   * Convert algebraic notation to coordinates
   */
  private static algebraicToCoords(algebraic: string): { row: number; col: number } | null {
    if (algebraic.length !== 2) return null
    
    const col = algebraic.charCodeAt(0) - 97 // a=0, b=1, etc.
    const row = 8 - parseInt(algebraic[1]) // 8=0, 7=1, etc.
    
    if (col < 0 || col >= 8 || row < 0 || row >= 8) return null
    
    return { row, col }
  }

  /**
   * Basic move validation (simplified)
   */
  private static isBasicMoveValid(move: ChessMove, board: ChessBoard, from: { row: number; col: number }, to: { row: number; col: number }): boolean {
    const piece = move.piece
    const rowDiff = Math.abs(to.row - from.row)
    const colDiff = Math.abs(to.col - from.col)

    // Check if destination is occupied by own piece
    const destPiece = board.grid[to.row][to.col]
    if (destPiece && destPiece.color === piece.color) {
      return false
    }

    // Basic piece movement patterns (simplified)
    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(move, board, from, to, rowDiff, colDiff)
      case 'rook':
        return this.isValidRookMove(from, to, rowDiff, colDiff)
      case 'knight':
        return this.isValidKnightMove(rowDiff, colDiff)
      case 'bishop':
        return this.isValidBishopMove(from, to, rowDiff, colDiff)
      case 'queen':
        return this.isValidQueenMove(from, to, rowDiff, colDiff)
      case 'king':
        return this.isValidKingMove(rowDiff, colDiff)
      default:
        return false
    }
  }

  /**
   * Validate pawn move
   */
  private static isValidPawnMove(move: ChessMove, board: ChessBoard, from: { row: number; col: number }, to: { row: number; col: number }, rowDiff: number, colDiff: number): boolean {
    const piece = move.piece
    const direction = piece.color === 'white' ? -1 : 1
    const startRow = piece.color === 'white' ? 6 : 1

    // Forward move
    if (colDiff === 0) {
      if (board.grid[to.row][to.col] !== null) return false // Can't capture forward
      
      if (rowDiff === 1 && to.row === from.row + direction) return true
      if (rowDiff === 2 && from.row === startRow && to.row === from.row + 2 * direction) return true
    }
    
    // Diagonal capture
    if (colDiff === 1 && rowDiff === 1) {
      const destPiece = board.grid[to.row][to.col]
      if (destPiece && destPiece.color !== piece.color) return true
      
      // En passant (simplified)
      if (move.capturedPiece && move.capturedPiece.type === 'pawn') return true
    }

    return false
  }

  /**
   * Validate rook move
   */
  private static isValidRookMove(from: { row: number; col: number }, to: { row: number; col: number }, rowDiff: number, colDiff: number): boolean {
    return (rowDiff === 0 && colDiff > 0) || (colDiff === 0 && rowDiff > 0)
  }

  /**
   * Validate knight move
   */
  private static isValidKnightMove(rowDiff: number, colDiff: number): boolean {
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
  }

  /**
   * Validate bishop move
   */
  private static isValidBishopMove(from: { row: number; col: number }, to: { row: number; col: number }, rowDiff: number, colDiff: number): boolean {
    return rowDiff === colDiff && rowDiff > 0
  }

  /**
   * Validate queen move
   */
  private static isValidQueenMove(from: { row: number; col: number }, to: { row: number; col: number }, rowDiff: number, colDiff: number): boolean {
    return this.isValidRookMove(from, to, rowDiff, colDiff) || this.isValidBishopMove(from, to, rowDiff, colDiff)
  }

  /**
   * Validate king move
   */
  private static isValidKingMove(rowDiff: number, colDiff: number): boolean {
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0)
  }

  /**
   * Apply move to board
   */
  static applyMove(board: ChessBoard, move: ChessMove): ChessBoard {
    const newBoard = {
      ...board,
      grid: board.grid.map(row => [...row]),
      turn: board.turn === 'white' ? 'black' : 'white' as 'white' | 'black'
    }

    const fromPos = this.algebraicToCoords(move.from)!
    const toPos = this.algebraicToCoords(move.to)!

    // Move piece
    newBoard.grid[toPos.row][toPos.col] = move.piece
    newBoard.grid[fromPos.row][fromPos.col] = null

    return newBoard
  }

  /**
   * Check if king is in check
   */
  static isKingInCheck(board: ChessBoard, kingColor: 'white' | 'black'): boolean {
    // Find king position
    let kingPos: { row: number; col: number } | null = null
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.grid[row][col]
        if (piece && piece.type === 'king' && piece.color === kingColor) {
          kingPos = { row, col }
          break
        }
      }
      if (kingPos) break
    }

    if (!kingPos) return false

    // Check if any opponent piece can attack the king
    const opponentColor = kingColor === 'white' ? 'black' : 'white'
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.grid[row][col]
        if (piece && piece.color === opponentColor) {
          // Simplified check - in production, use proper attack detection
          const distance = Math.abs(row - kingPos.row) + Math.abs(col - kingPos.col)
          if (distance === 1 && piece.type === 'king') return true
        }
      }
    }

    return false
  }

  /**
   * Check for checkmate
   */
  static isCheckmate(board: ChessBoard, playerColor: 'white' | 'black'): boolean {
    if (!this.isKingInCheck(board, playerColor)) return false

    // Check if any move can get out of check
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.grid[row][col]
        if (piece && piece.color === playerColor) {
          // Try all possible moves for this piece
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const testMove: ChessMove = {
                from: this.coordsToAlgebraic({ row, col }),
                to: this.coordsToAlgebraic({ row: toRow, col: toCol }),
                piece
              }

              const testBoard = this.applyMove(board, testMove)
              if (!this.isKingInCheck(testBoard, playerColor)) {
                return false // Found a move that gets out of check
              }
            }
          }
        }
      }
    }

    return true
  }

  /**
   * Convert coordinates to algebraic notation
   */
  private static coordsToAlgebraic(pos: { row: number; col: number }): string {
    const col = String.fromCharCode(97 + pos.col)
    const row = (8 - pos.row).toString()
    return col + row
  }

  /**
   * Validate time control
   */
  static validateTimeControl(timeControl: { white: number; black: number }, playerColor: 'white' | 'black', moveTime: number): boolean {
    const playerTime = playerColor === 'white' ? timeControl.white : timeControl.black
    return playerTime >= moveTime
  }

  /**
   * Calculate time remaining after move
   */
  static calculateTimeRemaining(timeControl: { white: number; black: number }, playerColor: 'white' | 'black', moveTime: number): { white: number; black: number } {
    const newTimeControl = { ...timeControl }
    
    if (playerColor === 'white') {
      newTimeControl.white = Math.max(0, timeControl.white - moveTime)
    } else {
      newTimeControl.black = Math.max(0, timeControl.black - moveTime)
    }

    return newTimeControl
  }
}
