// @ts-nocheck
/**
 * GLXY Gaming AI Opponent System
 * Advanced AI for all games with difficulty levels, learning capabilities, and realistic behavior
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// AI Difficulty Levels
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master'

// AI Personality Types
export type AIPersonality = 'aggressive' | 'defensive' | 'balanced' | 'random' | 'adaptive'

// Game-specific AI interfaces
interface AIState {
  difficulty: AIDifficulty
  personality: AIPersonality
  reactionTime: number
  errorRate: number
  learningEnabled: boolean
  moveHistory: any[]
  performance: {
    wins: number
    losses: number
    moves: number
    avgThinkTime: number
  }
}

// Base AI Class
export abstract class BaseAIOpponent {
  protected state: AIState
  protected thinking = false
  protected thinkTimer: NodeJS.Timeout | null = null

  constructor(
    protected gameId: string,
    difficulty: AIDifficulty = 'medium',
    personality: AIPersonality = 'balanced'
  ) {
    this.state = this.initializeState(difficulty, personality)
  }

  private initializeState(difficulty: AIDifficulty, personality: AIPersonality): AIState {
    const difficultySettings = {
      easy: { reactionTime: 2000, errorRate: 0.3 },
      medium: { reactionTime: 1200, errorRate: 0.15 },
      hard: { reactionTime: 600, errorRate: 0.05 },
      expert: { reactionTime: 300, errorRate: 0.02 },
      master: { reactionTime: 150, errorRate: 0.01 }
    }

    const settings = difficultySettings[difficulty]

    return {
      difficulty,
      personality,
      reactionTime: settings.reactionTime,
      errorRate: settings.errorRate,
      learningEnabled: difficulty !== 'easy',
      moveHistory: [],
      performance: {
        wins: 0,
        losses: 0,
        moves: 0,
        avgThinkTime: settings.reactionTime
      }
    }
  }

  // Abstract methods to be implemented by game-specific AI
  abstract calculateBestMove(gameState: any): any
  abstract makeMove(move: any): void
  abstract isValidMove(move: any, gameState: any): boolean

  // Public AI interface
  async makeAIMove(gameState: any): Promise<any> {
    if (this.thinking) return null

    this.thinking = true
    const startTime = Date.now()

    return new Promise((resolve) => {
      const thinkTime = this.calculateThinkTime()

      this.thinkTimer = setTimeout(() => {
        try {
          const bestMove = this.calculateBestMove(gameState)

          // Add errors based on difficulty
          if (Math.random() < this.state.errorRate) {
            const randomMove = this.getRandomMove(gameState)
            resolve(randomMove)
          } else {
            resolve(bestMove)
          }

          this.recordMove(bestMove, Date.now() - startTime)
        } catch (error) {
          console.error('AI move calculation failed:', error)
          const fallbackMove = this.getRandomMove(gameState)
          resolve(fallbackMove)
        } finally {
          this.thinking = false
        }
      }, thinkTime)
    })
  }

  protected calculateThinkTime(): number {
    const baseTime = this.state.reactionTime
    const variation = Math.random() * 0.4 - 0.2 // Â±20% variation
    const personalityModifier = this.getPersonalityModifier()

    return Math.max(100, baseTime * (1 + variation) * personalityModifier)
  }

  private getPersonalityModifier(): number {
    switch (this.state.personality) {
      case 'aggressive': return 0.8 // Thinks faster, more reckless
      case 'defensive': return 1.3 // Thinks slower, more careful
      case 'balanced': return 1.0
      case 'random': return 0.5 + Math.random() // Unpredictable
      case 'adaptive': return 0.9 + (this.state.performance.wins / Math.max(1, this.state.performance.losses)) * 0.2
      default: return 1.0
    }
  }

  protected getRandomMove(gameState: any): any {
    // To be implemented by specific AI classes
    return null
  }

  protected recordMove(move: any, thinkTime: number): void {
    this.state.moveHistory.push({
      move,
      thinkTime,
      timestamp: Date.now()
    })

    this.state.performance.moves++
    this.state.performance.avgThinkTime =
      (this.state.performance.avgThinkTime * (this.state.performance.moves - 1) + thinkTime) /
      this.state.performance.moves

    // Limit history size
    if (this.state.moveHistory.length > 1000) {
      this.state.moveHistory = this.state.moveHistory.slice(-500)
    }
  }

  // Learning and adaptation
  learnFromGame(result: 'win' | 'lose', moves: any[]): void {
    if (!this.state.learningEnabled) return

    if (result === 'win') {
      this.state.performance.wins++
    } else {
      this.state.performance.losses++
    }

    // Adjust difficulty based on performance
    this.adjustDifficulty()
  }

  private adjustDifficulty(): void {
    const winRate = this.state.performance.wins / Math.max(1, this.state.performance.wins + this.state.performance.losses)

    if (winRate > 0.7 && this.state.difficulty !== 'master') {
      // AI is winning too much, make it harder
      this.upgradeDifficulty()
    } else if (winRate < 0.3 && this.state.difficulty !== 'easy') {
      // AI is losing too much, make it easier
      this.downgradeDifficulty()
    }
  }

  private upgradeDifficulty(): void {
    const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard', 'expert', 'master']
    const currentIndex = difficulties.indexOf(this.state.difficulty)

    if (currentIndex < difficulties.length - 1) {
      this.state.difficulty = difficulties[currentIndex + 1]
      const newSettings = this.initializeState(this.state.difficulty, this.state.personality)
      this.state.reactionTime = newSettings.reactionTime
      this.state.errorRate = newSettings.errorRate
    }
  }

  private downgradeDifficulty(): void {
    const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard', 'expert', 'master']
    const currentIndex = difficulties.indexOf(this.state.difficulty)

    if (currentIndex > 0) {
      this.state.difficulty = difficulties[currentIndex - 1]
      const newSettings = this.initializeState(this.state.difficulty, this.state.personality)
      this.state.reactionTime = newSettings.reactionTime
      this.state.errorRate = newSettings.errorRate
    }
  }

  // Utility methods
  isThinking(): boolean {
    return this.thinking
  }

  cancelMove(): void {
    if (this.thinkTimer) {
      clearTimeout(this.thinkTimer)
      this.thinkTimer = null
    }
    this.thinking = false
  }

  getState(): AIState {
    return { ...this.state }
  }

  setDifficulty(difficulty: AIDifficulty): void {
    this.state.difficulty = difficulty
    const newSettings = this.initializeState(difficulty, this.state.personality)
    this.state.reactionTime = newSettings.reactionTime
    this.state.errorRate = newSettings.errorRate
  }

  setPersonality(personality: AIPersonality): void {
    this.state.personality = personality
  }
}

// TicTacToe AI
export class TicTacToeAI extends BaseAIOpponent {
  constructor(gameId: string, difficulty: AIDifficulty = 'medium') {
    super(gameId, difficulty, 'balanced')
  }

  calculateBestMove(gameState: any): any {
    const { board, currentPlayer } = gameState

    // Minimax algorithm for optimal play
    const bestMove = this.minimax(board, currentPlayer, 0)
    return bestMove.move
  }

  private minimax(board: any[][], player: string, depth: number): { score: number, move: any } {
    const winner = this.checkWinner(board)

    if (winner === 'O') return { score: 10 - depth, move: null }
    if (winner === 'X') return { score: depth - 10, move: null }
    if (this.isBoardFull(board)) return { score: 0, move: null }

    const moves = this.getAvailableMoves(board)
    let bestMove = null
    let bestScore = player === 'O' ? -Infinity : Infinity

    for (const move of moves) {
      const newBoard = this.makeBoardCopy(board)
      newBoard[move.row][move.col] = player

      const result = this.minimax(newBoard, player === 'O' ? 'X' : 'O', depth + 1)

      if (player === 'O') {
        if (result.score > bestScore) {
          bestScore = result.score
          bestMove = move
        }
      } else {
        if (result.score < bestScore) {
          bestScore = result.score
          bestMove = move
        }
      }
    }

    return { score: bestScore, move: bestMove }
  }

  private checkWinner(board: any[][]): string | null {
    // Check rows, columns, and diagonals
    const lines = [
      // Rows
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      // Columns
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      // Diagonals
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]]
    ]

    for (const line of lines) {
      const [a, b, c] = line.map(([row, col]) => board[row][col])
      if (a && a === b && b === c) return a
    }

    return null
  }

  private isBoardFull(board: any[][]): boolean {
    return board.every(row => row.every(cell => cell !== null))
  }

  private getAvailableMoves(board: any[][]): any[] {
    const moves = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          moves.push({ row, col })
        }
      }
    }
    return moves
  }

  private makeBoardCopy(board: any[][]): any[][] {
    return board.map(row => [...row])
  }

  protected getRandomMove(gameState: any): any {
    const { board } = gameState
    const availableMoves = this.getAvailableMoves(board)
    return availableMoves[Math.floor(Math.random() * availableMoves.length)]
  }

  isValidMove(move: any, gameState: any): boolean {
    const { board } = gameState
    return board[move.row] && board[move.row][move.col] === null
  }

  makeMove(move: any): void {
    // This would be handled by the game component
  }
}

// Connect4 AI
export class Connect4AI extends BaseAIOpponent {
  constructor(gameId: string, difficulty: AIDifficulty = 'medium') {
    super(gameId, difficulty, 'defensive')
  }

  calculateBestMove(gameState: any): any {
    const { board, currentPlayer } = gameState

    // Use minimax with alpha-beta pruning for Connect4
    const depth = this.getDifficultyDepth()
    const bestMove = this.minimax(board, depth, true, -Infinity, Infinity)

    return bestMove.column
  }

  private getDifficultyDepth(): number {
    switch (this.state.difficulty) {
      case 'easy': return 2
      case 'medium': return 4
      case 'hard': return 6
      case 'expert': return 8
      case 'master': return 10
      default: return 4
    }
  }

  private minimax(board: any[][], depth: number, maximizing: boolean, alpha: number, beta: number): { score: number, column: number } {
    const winner = this.checkWinner(board)

    if (winner === 'O') return { score: 1000, column: -1 }
    if (winner === 'X') return { score: -1000, column: -1 }
    if (depth === 0 || this.isBoardFull(board)) {
      return { score: this.evaluateBoard(board), column: -1 }
    }

    let bestColumn = -1
    let bestScore = maximizing ? -Infinity : Infinity

    for (let col = 0; col < 7; col++) {
      if (this.isValidColumn(col, board)) {
        const newBoard = this.makeBoardCopy(board)
        this.dropPiece(newBoard, col, maximizing ? 'O' : 'X')

        const result = this.minimax(newBoard, depth - 1, !maximizing, alpha, beta)

        if (maximizing) {
          if (result.score > bestScore) {
            bestScore = result.score
            bestColumn = col
          }
          alpha = Math.max(alpha, bestScore)
        } else {
          if (result.score < bestScore) {
            bestScore = result.score
            bestColumn = col
          }
          beta = Math.min(beta, bestScore)
        }

        if (beta <= alpha) {
          break // Alpha-beta pruning
        }
      }
    }

    return { score: bestScore, column: bestColumn }
  }

  private evaluateBoard(board: any[][]): number {
    let score = 0

    // Center column preference
    for (let row = 0; row < 6; row++) {
      if (board[row][3] === 'O') score += 3
      if (board[row][3] === 'X') score -= 3
    }

    // Evaluate all possible 4-in-a-row combinations
    score += this.evaluateLines(board, 'O')
    score -= this.evaluateLines(board, 'X')

    return score
  }

  private evaluateLines(board: any[][], player: string): number {
    let score = 0

    // Check horizontal, vertical, and diagonal lines
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ]

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] !== player) continue

        for (const [dr, dc] of directions) {
          const lineScore = this.evaluateLine(board, row, col, dr, dc, player)
          score += lineScore
        }
      }
    }

    return score
  }

  private evaluateLine(board: any[][], row: number, col: number, dr: number, dc: number, player: string): number {
    let count = 0
    let openEnds = 0

    for (let i = 0; i < 4; i++) {
      const newRow = row + i * dr
      const newCol = col + i * dc

      if (newRow < 0 || newRow >= 6 || newCol < 0 || newCol >= 7) break

      if (board[newRow][newCol] === player) {
        count++
      } else if (board[newRow][newCol] === null) {
        openEnds++
      } else {
        break
      }
    }

    if (count === 4) return 1000
    if (count === 3 && openEnds === 2) return 100
    if (count === 2 && openEnds === 2) return 10
    if (count === 1 && openEnds === 2) return 1

    return 0
  }

  private checkWinner(board: any[][]): string | null {
    // Similar to TicTacToe but for 6x7 Connect4 board
    // Implementation would check for 4 in a row
    return null // Simplified for brevity
  }

  private isBoardFull(board: any[][]): boolean {
    return board[0].every(cell => cell !== null)
  }

  private isValidColumn(col: number, board: any[][]): boolean {
    return board[0][col] === null
  }

  private dropPiece(board: any[][], col: number, player: string): void {
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] === null) {
        board[row][col] = player
        break
      }
    }
  }

  private makeBoardCopy(board: any[][]): any[][] {
    return board.map(row => [...row])
  }

  protected getRandomMove(gameState: any): any {
    const { board } = gameState
    const availableColumns = []

    for (let col = 0; col < 7; col++) {
      if (this.isValidColumn(col, board)) {
        availableColumns.push(col)
      }
    }

    return availableColumns[Math.floor(Math.random() * availableColumns.length)]
  }

  isValidMove(move: any, gameState: any): boolean {
    const { board } = gameState
    return this.isValidColumn(move, board)
  }

  makeMove(move: any): void {
    // This would be handled by the game component
  }
}

// Tetris AI
export class TetrisAI extends BaseAIOpponent {
  constructor(gameId: string, difficulty: AIDifficulty = 'medium') {
    super(gameId, difficulty, 'aggressive')
  }

  calculateBestMove(gameState: any): any {
    const { currentPiece, board, nextPieces } = gameState

    // Evaluate all possible positions and rotations for current piece
    let bestMove = null
    let bestScore = -Infinity

    for (let rotation = 0; rotation < 4; rotation++) {
      const rotatedPiece = this.rotatePiece(currentPiece, rotation)

      for (let x = 0; x < 10; x++) {
        const y = this.getDropPosition(board, rotatedPiece, x)

        if (this.isValidPosition(board, rotatedPiece, x, y)) {
          const testBoard = this.simulateMove(board, rotatedPiece, x, y)
          const score = this.evaluatePosition(testBoard, nextPieces[0])

          if (score > bestScore) {
            bestScore = score
            bestMove = {
              rotation,
              position: { x, y },
              hardDrop: true
            }
          }
        }
      }
    }

    return bestMove
  }

  private rotatePiece(piece: any, rotation: number): any {
    // Rotate piece rotation times
    let rotated = { ...piece }
    for (let i = 0; i < rotation; i++) {
      rotated = this.rotateOnce(rotated)
    }
    return rotated
  }

  private rotateOnce(piece: any): any {
    // Implement piece rotation logic
    return piece // Simplified
  }

  private getDropPosition(board: any[][], piece: any, x: number): number {
    let y = 0
    while (this.isValidPosition(board, piece, x, y + 1)) {
      y++
    }
    return y
  }

  private isValidPosition(board: any[][], piece: any, x: number, y: number): boolean {
    // Check if piece can be placed at position
    // Implementation would check piece bounds and collisions
    return true // Simplified
  }

  private simulateMove(board: any[][], piece: any, x: number, y: number): any[][] {
    const newBoard = board.map(row => [...row])

    // Place piece on board
    // Implementation would place piece cells

    return newBoard
  }

  private evaluatePosition(board: any[][], nextPiece: any): number {
    let score = 0

    // Factors to consider:
    // - Lines cleared
    // - Height of stacked pieces
    // - Holes created
    // - Well depth
    // - Surface roughness

    const linesCleared = this.countCompletedLines(board)
    score += linesCleared * 1000

    const maxHeight = this.getMaxHeight(board)
    score -= maxHeight * 10

    const holes = this.countHoles(board)
    score -= holes * 50

    const wellDepth = this.getWellDepth(board)
    score += wellDepth * 20

    return score
  }

  private countCompletedLines(board: any[][]): number {
    let lines = 0
    for (let y = 0; y < 20; y++) {
      if (board[y].every(cell => cell !== null)) {
        lines++
      }
    }
    return lines
  }

  private getMaxHeight(board: any[][]): number {
    for (let y = 0; y < 20; y++) {
      if (board[y].some(cell => cell !== null)) {
        return 20 - y
      }
    }
    return 0
  }

  private countHoles(board: any[][]): number {
    let holes = 0
    for (let x = 0; x < 10; x++) {
      let foundBlock = false
      for (let y = 0; y < 20; y++) {
        if (board[y][x] !== null) {
          foundBlock = true
        } else if (foundBlock) {
          holes++
        }
      }
    }
    return holes
  }

  private getWellDepth(board: any[][]): number {
    let maxDepth = 0
    for (let x = 0; x < 10; x++) {
      let depth = 0
      for (let y = 0; y < 20; y++) {
        if (board[y][x] === null) {
          depth++
        }
      }
      maxDepth = Math.max(maxDepth, depth)
    }
    return maxDepth
  }

  protected getRandomMove(gameState: any): any {
    const { currentPiece, board } = gameState

    // Random valid position
    for (let rotation = 0; rotation < 4; rotation++) {
      const rotatedPiece = this.rotatePiece(currentPiece, rotation)

      for (let x = 0; x < 10; x++) {
        const y = this.getDropPosition(board, rotatedPiece, x)
        if (this.isValidPosition(board, rotatedPiece, x, y)) {
          return {
            rotation,
            position: { x, y },
            hardDrop: true
          }
        }
      }
    }

    return null
  }

  isValidMove(move: any, gameState: any): boolean {
    const { board } = gameState
    return this.isValidPosition(board, gameState.currentPiece, move.position.x, move.position.y)
  }

  makeMove(move: any): void {
    // This would be handled by the game component
  }
}

// Chess AI (simplified)
export class ChessAI extends BaseAIOpponent {
  constructor(gameId: string, difficulty: AIDifficulty = 'medium') {
    super(gameId, difficulty, 'adaptive')
  }

  calculateBestMove(gameState: any): any {
    // Simplified chess AI - would use proper chess evaluation in production
    const { board, currentPlayer } = gameState

    // Get all legal moves
    const legalMoves = this.getLegalMoves(board, currentPlayer)

    if (legalMoves.length === 0) return null

    // Score each move
    let bestMove = null
    let bestScore = currentPlayer === 'white' ? -Infinity : Infinity

    for (const move of legalMoves) {
      const score = this.evaluateMove(board, move, currentPlayer)

      if (currentPlayer === 'white' && score > bestScore) {
        bestScore = score
        bestMove = move
      } else if (currentPlayer === 'black' && score < bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }

  private getLegalMoves(board: any[][], player: string): any[] {
    // Simplified - would implement proper chess rules
    const moves = []

    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        if (board[fromRow][fromCol] && board[fromRow][fromCol].color === player) {
          // Generate moves for this piece
          const pieceMoves = this.getPieceMoves(board, fromRow, fromCol, player)
          moves.push(...pieceMoves)
        }
      }
    }

    return moves
  }

  private getPieceMoves(board: any[][], fromRow: number, fromCol: number, player: string): any[] {
    // Simplified piece movement generation
    const moves: any[] = []
    const piece = board[fromRow][fromCol]

    if (!piece) return moves

    // Generate moves based on piece type
    switch (piece.type) {
      case 'pawn':
        // Pawn moves
        const direction = player === 'white' ? -1 : 1
        const newRow = fromRow + direction

        if (newRow >= 0 && newRow < 8) {
          if (!board[newRow][fromCol]) {
            moves.push({ from: { row: fromRow, col: fromCol }, to: { row: newRow, col: fromCol } })
          }

          // Capture moves
          for (const colOffset of [-1, 1]) {
            const newCol = fromCol + colOffset
            if (newCol >= 0 && newCol < 8 && board[newRow][newCol] && board[newRow][newCol].color !== player) {
              moves.push({ from: { row: fromRow, col: fromCol }, to: { row: newRow, col: newCol } })
            }
          }
        }
        break

      // Other pieces would be implemented similarly
    }

    return moves
  }

  private evaluateMove(board: any[][], move: any, player: string): number {
    let score = 0

    // Piece values
    const pieceValues = {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 5,
      queen: 9,
      king: 100
    }

    // Check if move captures a piece
    const targetPiece = board[move.to.row][move.to.col]
    if (targetPiece && targetPiece.type) {
      score += pieceValues[targetPiece.type as keyof typeof pieceValues] || 0
    }

    // Position evaluation (simplified)
    score += Math.random() * 0.1 // Small random factor

    return score
  }

  protected getRandomMove(gameState: any): any {
    const { board, currentPlayer } = gameState
    const legalMoves = this.getLegalMoves(board, currentPlayer)
    return legalMoves[Math.floor(Math.random() * legalMoves.length)]
  }

  isValidMove(move: any, gameState: any): boolean {
    const { board, currentPlayer } = gameState
    const legalMoves = this.getLegalMoves(board, currentPlayer)
    return legalMoves.some(legalMove =>
      legalMove.from.row === move.from.row &&
      legalMove.from.col === move.from.col &&
      legalMove.to.row === move.to.row &&
      legalMove.to.col === move.to.col
    )
  }

  makeMove(move: any): void {
    // This would be handled by the game component
  }
}

// AI Factory
export function createAIOpponent(gameType: string, gameId: string, difficulty: AIDifficulty = 'medium'): BaseAIOpponent {
  switch (gameType.toLowerCase()) {
    case 'tictactoe':
      return new TicTacToeAI(gameId, difficulty)
    case 'connect4':
      return new Connect4AI(gameId, difficulty)
    case 'tetris':
      return new TetrisAI(gameId, difficulty)
    case 'chess':
      return new ChessAI(gameId, difficulty)
    default:
      return new TicTacToeAI(gameId, difficulty) // Default fallback
  }
}

// React Hook for AI opponents
export function useAIOpponent(gameType: string, gameId: string, difficulty: AIDifficulty = 'medium') {
  const [ai] = useState(() => createAIOpponent(gameType, gameId, difficulty))
  const [isThinking, setIsThinking] = useState(false)

  const makeAIMove = useCallback(async (gameState: any) => {
    setIsThinking(true)
    try {
      const move = await ai.makeAIMove(gameState)
      setIsThinking(false)
      return move
    } catch (error) {
      console.error('AI move failed:', error)
      setIsThinking(false)
      return null
    }
  }, [ai])

  const cancelMove = useCallback(() => {
    ai.cancelMove()
    setIsThinking(false)
  }, [ai])

  const updateDifficulty = useCallback((newDifficulty: AIDifficulty) => {
    ai.setDifficulty(newDifficulty)
  }, [ai])

  const learnFromGame = useCallback((result: 'win' | 'lose', moves: any[]) => {
    ai.learnFromGame(result, moves)
  }, [ai])

  return {
    ai,
    isThinking,
    makeAIMove,
    cancelMove,
    updateDifficulty,
    learnFromGame,
    getAIState: () => ai.getState()
  }
}