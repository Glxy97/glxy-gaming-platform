// @ts-nocheck
/**
 * TicTacToe Game Validator
 * Server-side validation for TicTacToe game moves and logic
 */

export interface TicTacToeBoard {
  grid: (string | null)[]
  size: number
}

export interface TicTacToeMove {
  index: number
  playerId: string
}

export interface ValidationResult {
  valid: boolean
  reason?: string
  correctedMove?: TicTacToeMove
}

export class TicTacToeValidator {
  static readonly BOARD_SIZE = 9 // 3x3 grid
  static readonly WIN_CONDITION = 3

  /**
   * Validate a TicTacToe move
   */
  static validateMove(move: TicTacToeMove, board: TicTacToeBoard, currentPlayer: string): ValidationResult {
    try {
      // Validate board dimensions
      if (!this.validateBoardDimensions(board)) {
        return { valid: false, reason: 'Invalid board dimensions' }
      }

      // Validate index
      if (!this.validateIndex(move.index)) {
        return { valid: false, reason: 'Invalid cell index' }
      }

      // Check if cell is empty
      if (!this.isCellEmpty(move.index, board)) {
        return { valid: false, reason: 'Cell already occupied' }
      }

      // Validate player turn
      if (move.playerId !== currentPlayer) {
        return { valid: false, reason: 'Not your turn' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, reason: 'Validation error: ' + error }
    }
  }

  /**
   * Validate board dimensions
   */
  private static validateBoardDimensions(board: TicTacToeBoard): boolean {
    return board.size === this.BOARD_SIZE && 
           board.grid.length === this.BOARD_SIZE
  }

  /**
   * Validate cell index
   */
  private static validateIndex(index: number): boolean {
    return Number.isInteger(index) && 
           index >= 0 && 
           index < this.BOARD_SIZE
  }

  /**
   * Check if cell is empty
   */
  private static isCellEmpty(index: number, board: TicTacToeBoard): boolean {
    return board.grid[index] === null
  }

  /**
   * Check for winner after a move
   */
  static checkWinner(board: TicTacToeBoard, playerId: string): boolean {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ]

    for (const combo of winningCombinations) {
      const [a, b, c] = combo
      if (board.grid[a] === playerId && 
          board.grid[b] === playerId && 
          board.grid[c] === playerId) {
        return true
      }
    }

    return false
  }

  /**
   * Check if board is full (draw condition)
   */
  static isBoardFull(board: TicTacToeBoard): boolean {
    return board.grid.every(cell => cell !== null)
  }

  /**
   * Apply move to board
   */
  static applyMove(board: TicTacToeBoard, move: TicTacToeMove): TicTacToeBoard {
    const newBoard = {
      ...board,
      grid: [...board.grid]
    }

    newBoard.grid[move.index] = move.playerId
    return newBoard
  }

  /**
   * Get all possible moves
   */
  static getPossibleMoves(board: TicTacToeBoard): number[] {
    const moves: number[] = []
    
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      if (board.grid[i] === null) {
        moves.push(i)
      }
    }

    return moves
  }

  /**
   * Validate game state
   */
  static validateGameState(board: TicTacToeBoard): ValidationResult {
    // Check for invalid pieces (more than 2 players)
    const players = new Set<string>()
    
    for (const cell of board.grid) {
      if (cell !== null) {
        players.add(cell)
      }
    }

    if (players.size > 2) {
      return { valid: false, reason: 'Too many players on board' }
    }

    // Check for impossible game state (both players winning)
    const playerArray = Array.from(players)
    if (playerArray.length === 2) {
      const [player1, player2] = playerArray
      if (this.checkWinner(board, player1) && this.checkWinner(board, player2)) {
        return { valid: false, reason: 'Impossible game state: both players winning' }
      }
    }

    return { valid: true }
  }

  /**
   * Calculate move score for AI
   */
  static calculateMoveScore(board: TicTacToeBoard, index: number, playerId: string): number {
    if (!this.isCellEmpty(index, board)) return -1000 // Invalid move

    const testBoard = this.applyMove(board, { index, playerId })
    
    // Check if this move wins
    if (this.checkWinner(testBoard, playerId)) {
      return 1000
    }

    // Check if opponent can win next turn
    const opponentId = this.getOpponentId(board, playerId)
    const possibleMoves = this.getPossibleMoves(testBoard)
    
    for (const moveIndex of possibleMoves) {
      const opponentBoard = this.applyMove(testBoard, { index: moveIndex, playerId: opponentId })
      
      if (this.checkWinner(opponentBoard, opponentId)) {
        return -500 // Block opponent
      }
    }

    // Center preference
    if (index === 4) {
      return 10
    }

    // Corner preference
    if ([0, 2, 6, 8].includes(index)) {
      return 5
    }

    return 0
  }

  /**
   * Get opponent ID
   */
  private static getOpponentId(board: TicTacToeBoard, playerId: string): string {
    const players = new Set<string>()
    
    for (const cell of board.grid) {
      if (cell !== null) {
        players.add(cell)
      }
    }

    const playerArray = Array.from(players)
    return playerArray.find(id => id !== playerId) || 'opponent'
  }

  /**
   * Check for immediate win opportunity
   */
  static findWinningMove(board: TicTacToeBoard, playerId: string): number | null {
    const possibleMoves = this.getPossibleMoves(board)
    
    for (const index of possibleMoves) {
      const testBoard = this.applyMove(board, { index, playerId })
      if (this.checkWinner(testBoard, playerId)) {
        return index
      }
    }

    return null
  }

  /**
   * Check for immediate loss (opponent can win)
   */
  static findBlockingMove(board: TicTacToeBoard, playerId: string): number | null {
    const opponentId = this.getOpponentId(board, playerId)
    return this.findWinningMove(board, opponentId)
  }

  /**
   * Get game status
   */
  static getGameStatus(board: TicTacToeBoard): 'playing' | 'draw' | 'winner' {
    const players = new Set<string>()
    
    for (const cell of board.grid) {
      if (cell !== null) {
        players.add(cell)
      }
    }

    const playerArray = Array.from(players)
    
    // Check for winner
    for (const playerId of playerArray) {
      if (this.checkWinner(board, playerId)) {
        return 'winner'
      }
    }

    // Check for draw
    if (this.isBoardFull(board)) {
      return 'draw'
    }

    return 'playing'
  }

  /**
   * Get winner if game is over
   */
  static getWinner(board: TicTacToeBoard): string | null {
    const players = new Set<string>()
    
    for (const cell of board.grid) {
      if (cell !== null) {
        players.add(cell)
      }
    }

    const playerArray = Array.from(players)
    
    for (const playerId of playerArray) {
      if (this.checkWinner(board, playerId)) {
        return playerId
      }
    }

    return null
  }
}
