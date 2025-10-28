// @ts-nocheck
"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/lib/socket-client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Brain, Zap, Clock, Target, Trophy, Star, Award, Users,
  Volume2, VolumeX, Settings, Eye, RotateCcw, Lightbulb, Cpu,
  TrendingUp, Activity, ChevronRight, BookOpen, Play, Pause
} from 'lucide-react'

// Chess Engine Types
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type PieceColor = 'white' | 'black'
type GameMode = 'pvp' | 'bot' | 'online'
type BotDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved: boolean
  id: string
}

interface Position {
  rank: number // 0-7 (1-8)
  file: number // 0-7 (a-h)
}

interface ChessMove {
  from: Position
  to: Position
  piece: ChessPiece
  capturedPiece?: ChessPiece
  promotion?: PieceType
  castling?: 'kingside' | 'queenside'
  enPassant?: boolean
  check?: boolean
  checkmate?: boolean
  notation: string
  timestamp: number
}

interface GameState {
  board: (ChessPiece | null)[][]
  currentPlayer: PieceColor
  moveHistory: ChessMove[]
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished'
  winner: PieceColor | 'draw' | null
  gameMode: GameMode
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  canCastle: {
    white: { kingside: boolean; queenside: boolean }
    black: { kingside: boolean; queenside: boolean }
  }
  enPassantTarget?: Position
  fiftyMoveCounter: number
  roomId?: string
  players: {
    white?: { id: string; username: string; rating?: number }
    black?: { id: string; username: string; rating?: number }
  }
  spectators: number
  timeControl: {
    white: number
    black: number
    increment: number
  }
  botDifficulty?: BotDifficulty
  isBotThinking: boolean
}

// Chess Bot Engine (No API needed!)
class LocalChessBot {
  private readonly PIECE_VALUES = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000
  }

  private readonly POSITION_TABLES = {
    pawn: [
      [0,   0,   0,   0,   0,   0,   0,   0],
      [50,  50,  50,  50,  50,  50,  50,  50],
      [10,  10,  20,  30,  30,  20,  10,  10],
      [5,   5,  10,  25,  25,  10,   5,   5],
      [0,   0,   0,  20,  20,   0,   0,   0],
      [5,  -5, -10,   0,   0, -10,  -5,   5],
      [5,  10,  10, -20, -20,  10,  10,   5],
      [0,   0,   0,   0,   0,   0,   0,   0]
    ],
    knight: [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20,   0,   0,   0,   0, -20, -40],
      [-30,   0,  10,  15,  15,  10,   0, -30],
      [-30,   5,  15,  20,  20,  15,   5, -30],
      [-30,   0,  15,  20,  20,  15,   0, -30],
      [-30,   5,  10,  15,  15,  10,   5, -30],
      [-40, -20,   0,   5,   5,   0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    bishop: [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10,   0,   0,   0,   0,   0,   0, -10],
      [-10,   0,   5,  10,  10,   5,   0, -10],
      [-10,   5,   5,  10,  10,   5,   5, -10],
      [-10,   0,  10,  10,  10,  10,   0, -10],
      [-10,  10,  10,  10,  10,  10,  10, -10],
      [-10,   5,   0,   0,   0,   0,   5, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    rook: [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [5, 10, 10, 10, 10, 10, 10,  5],
      [-5, 0,  0,  0,  0,  0,  0, -5],
      [-5, 0,  0,  0,  0,  0,  0, -5],
      [-5, 0,  0,  0,  0,  0,  0, -5],
      [-5, 0,  0,  0,  0,  0,  0, -5],
      [-5, 0,  0,  0,  0,  0,  0, -5],
      [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    queen: [
      [-20, -10, -10,  -5,  -5, -10, -10, -20],
      [-10,   0,   0,   0,   0,   0,   0, -10],
      [-10,   0,   5,   5,   5,   5,   0, -10],
      [-5,    0,   5,   5,   5,   5,   0,  -5],
      [0,     0,   5,   5,   5,   5,   0,  -5],
      [-10,   5,   5,   5,   5,   5,   0, -10],
      [-10,   0,   5,   0,   0,   0,   0, -10],
      [-20, -10, -10,  -5,  -5, -10, -10, -20]
    ],
    king: [
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-20, -30, -30, -40, -40, -30, -30, -20],
      [-10, -20, -20, -20, -20, -20, -20, -10],
      [20,   20,   0,   0,   0,   0,  20,  20],
      [20,   30,  10,   0,   0,  10,  30,  20]
    ]
  }

  // 🤖 GET BEST MOVE - The Brain of the Bot
  public async getBestMove(
    gameState: GameState,
    difficulty: BotDifficulty = 'medium'
  ): Promise<ChessMove | null> {
    const botColor = this.getBotColor(gameState)
    const depth = this.getDifficultyDepth(difficulty)
    const timeLimit = this.getDifficultyTime(difficulty)

    console.log(`🤖 Bot (${botColor}) is thinking... Difficulty: ${difficulty}, Depth: ${depth}`)

    const startTime = Date.now()
    const validMoves = this.getAllValidMoves(gameState.board, botColor, gameState)

    if (validMoves.length === 0) {
      console.log('❌ No valid moves available for bot')
      return null
    }

    // Easy difficulty: Random move with some logic
    if (difficulty === 'easy') {
      const captures = validMoves.filter(move => move.capturedPiece)
      if (captures.length > 0 && Math.random() > 0.3) {
        return captures[Math.floor(Math.random() * captures.length)]
      }
      return validMoves[Math.floor(Math.random() * validMoves.length)]
    }

    let bestMove = validMoves[0]
    let bestScore = botColor === 'white' ? -Infinity : Infinity

    // Minimax with alpha-beta pruning
    for (const move of validMoves) {
      if (Date.now() - startTime > timeLimit) break

      const newGameState = this.makeMove(gameState, move)
      const score = this.minimax(
        newGameState,
        depth - 1,
        -Infinity,
        Infinity,
        botColor === 'black', // Maximizing player
        startTime,
        timeLimit
      )

      if (botColor === 'white' && score > bestScore) {
        bestScore = score
        bestMove = move
      } else if (botColor === 'black' && score < bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    const thinkTime = Date.now() - startTime
    console.log(`🧠 Bot found best move: ${bestMove.notation} (Score: ${bestScore}, Time: ${thinkTime}ms)`)

    return bestMove
  }

  private getBotColor(gameState: GameState): PieceColor {
    // In bot mode, bot plays black by default
    if (gameState.gameMode === 'bot') {
      return 'black'
    }

    // In online mode, determine bot color based on players
    if (!gameState.players.white) return 'white'
    if (!gameState.players.black) return 'black'

    return 'black' // Default
  }

  private getDifficultyDepth(difficulty: BotDifficulty): number {
    switch (difficulty) {
      case 'easy': return 2
      case 'medium': return 4
      case 'hard': return 6
      case 'expert': return 8
      default: return 4
    }
  }

  private getDifficultyTime(difficulty: BotDifficulty): number {
    switch (difficulty) {
      case 'easy': return 500
      case 'medium': return 2000
      case 'hard': return 5000
      case 'expert': return 10000
      default: return 2000
    }
  }

  private minimax(
    gameState: GameState,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean,
    startTime: number,
    timeLimit: number
  ): number {
    // Time limit check
    if (Date.now() - startTime > timeLimit) {
      return this.evaluatePosition(gameState)
    }

    if (depth === 0 || gameState.gameStatus === 'finished') {
      return this.evaluatePosition(gameState)
    }

    const currentColor = maximizingPlayer ? 'black' : 'white'
    const moves = this.getAllValidMoves(gameState.board, currentColor, gameState)

    if (moves.length === 0) {
      if (this.isInCheck(gameState.board, currentColor)) {
        return maximizingPlayer ? -9999 : 9999 // Checkmate
      }
      return 0 // Stalemate
    }

    if (maximizingPlayer) {
      let maxEval = -Infinity
      for (const move of moves) {
        const newGameState = this.makeMove(gameState, move)
        const eval_score = this.minimax(newGameState, depth - 1, alpha, beta, false, startTime, timeLimit)
        maxEval = Math.max(maxEval, eval_score)
        alpha = Math.max(alpha, eval_score)
        if (beta <= alpha) break // Alpha-beta pruning
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const move of moves) {
        const newGameState = this.makeMove(gameState, move)
        const eval_score = this.minimax(newGameState, depth - 1, alpha, beta, true, startTime, timeLimit)
        minEval = Math.min(minEval, eval_score)
        beta = Math.min(beta, eval_score)
        if (beta <= alpha) break // Alpha-beta pruning
      }
      return minEval
    }
  }

  private evaluatePosition(gameState: GameState): number {
    let score = 0

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = gameState.board[rank][file]
        if (piece) {
          const pieceValue = this.PIECE_VALUES[piece.type]
          const positionValue = this.POSITION_TABLES[piece.type]?.[rank]?.[file] || 0

          if (piece.color === 'white') {
            score += pieceValue + positionValue
          } else {
            score -= pieceValue + positionValue
          }
        }
      }
    }

    // Additional evaluation factors
    score += this.evaluateKingSafety(gameState)
    score += this.evaluateCenterControl(gameState)
    score += this.evaluatePawnStructure(gameState)

    return score
  }

  private evaluateKingSafety(gameState: GameState): number {
    // Simplified king safety evaluation
    return 0 // TODO: Implement detailed king safety
  }

  private evaluateCenterControl(gameState: GameState): number {
    let score = 0
    const centerSquares = [
      {rank: 3, file: 3}, {rank: 3, file: 4},
      {rank: 4, file: 3}, {rank: 4, file: 4}
    ]

    for (const square of centerSquares) {
      const piece = gameState.board[square.rank][square.file]
      if (piece) {
        const value = piece.type === 'pawn' ? 20 : 10
        score += piece.color === 'white' ? value : -value
      }
    }

    return score
  }

  private evaluatePawnStructure(gameState: GameState): number {
    // Simplified pawn structure evaluation
    return 0 // TODO: Implement detailed pawn structure analysis
  }

  // 🎯 MOVE GENERATION
  public getAllValidMoves(
    board: (ChessPiece | null)[][],
    color: PieceColor,
    gameState: GameState
  ): ChessMove[] {
    const moves: ChessMove[] = []

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === color) {
          const pieceMoves = this.getPieceMoves(board, {rank, file}, piece, gameState)
          moves.push(...pieceMoves)
        }
      }
    }

    // Filter out moves that would put own king in check
    return moves.filter(move => {
      const newGameState = this.makeMove(gameState, move)
      return !this.isInCheck(newGameState.board, color)
    })
  }

  private getPieceMoves(
    board: (ChessPiece | null)[][],
    from: Position,
    piece: ChessPiece,
    gameState: GameState
  ): ChessMove[] {
    switch (piece.type) {
      case 'pawn': return this.getPawnMoves(board, from, piece, gameState)
      case 'knight': return this.getKnightMoves(board, from, piece)
      case 'bishop': return this.getBishopMoves(board, from, piece)
      case 'rook': return this.getRookMoves(board, from, piece)
      case 'queen': return this.getQueenMoves(board, from, piece)
      case 'king': return this.getKingMoves(board, from, piece, gameState)
      default: return []
    }
  }

  private getPawnMoves(
    board: (ChessPiece | null)[][],
    from: Position,
    piece: ChessPiece,
    gameState: GameState
  ): ChessMove[] {
    const moves: ChessMove[] = []
    const direction = piece.color === 'white' ? 1 : -1
    const startRank = piece.color === 'white' ? 1 : 6

    // Forward move
    const oneStep = { rank: from.rank + direction, file: from.file }
    if (this.isValidSquare(oneStep) && !board[oneStep.rank][oneStep.file]) {
      moves.push(this.createMove(from, oneStep, piece))

      // Two-step from starting position
      if (from.rank === startRank) {
        const twoStep = { rank: from.rank + 2 * direction, file: from.file }
        if (!board[twoStep.rank][twoStep.file]) {
          moves.push(this.createMove(from, twoStep, piece))
        }
      }
    }

    // Captures
    for (const fileOffset of [-1, 1]) {
      const capturePos = { rank: from.rank + direction, file: from.file + fileOffset }
      if (this.isValidSquare(capturePos)) {
        const target = board[capturePos.rank][capturePos.file]
        if (target && target.color !== piece.color) {
          moves.push(this.createMove(from, capturePos, piece, target))
        }

        // En passant
        if (gameState.enPassantTarget &&
            capturePos.rank === gameState.enPassantTarget.rank &&
            capturePos.file === gameState.enPassantTarget.file) {
          const enPassantMove = this.createMove(from, capturePos, piece)
          enPassantMove.enPassant = true
          moves.push(enPassantMove)
        }
      }
    }

    return moves
  }

  private getKnightMoves(board: (ChessPiece | null)[][], from: Position, piece: ChessPiece): ChessMove[] {
    const moves: ChessMove[] = []
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ]

    for (const [rankDelta, fileDelta] of knightMoves) {
      const to = { rank: from.rank + rankDelta, file: from.file + fileDelta }
      if (this.isValidSquare(to)) {
        const target = board[to.rank][to.file]
        if (!target || target.color !== piece.color) {
          moves.push(this.createMove(from, to, piece, target))
        }
      }
    }

    return moves
  }

  private getBishopMoves(board: (ChessPiece | null)[][], from: Position, piece: ChessPiece): ChessMove[] {
    return this.getSlidingMoves(board, from, piece, [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ])
  }

  private getRookMoves(board: (ChessPiece | null)[][], from: Position, piece: ChessPiece): ChessMove[] {
    return this.getSlidingMoves(board, from, piece, [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ])
  }

  private getQueenMoves(board: (ChessPiece | null)[][], from: Position, piece: ChessPiece): ChessMove[] {
    return this.getSlidingMoves(board, from, piece, [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ])
  }

  private getSlidingMoves(
    board: (ChessPiece | null)[][],
    from: Position,
    piece: ChessPiece,
    directions: [number, number][]
  ): ChessMove[] {
    const moves: ChessMove[] = []

    for (const [rankDir, fileDir] of directions) {
      for (let i = 1; i < 8; i++) {
        const to = { rank: from.rank + i * rankDir, file: from.file + i * fileDir }
        if (!this.isValidSquare(to)) break

        const target = board[to.rank][to.file]
        if (!target) {
          moves.push(this.createMove(from, to, piece))
        } else {
          if (target.color !== piece.color) {
            moves.push(this.createMove(from, to, piece, target))
          }
          break
        }
      }
    }

    return moves
  }

  private getKingMoves(
    board: (ChessPiece | null)[][],
    from: Position,
    piece: ChessPiece,
    gameState: GameState
  ): ChessMove[] {
    const moves: ChessMove[] = []
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]

    for (const [rankDelta, fileDelta] of kingMoves) {
      const to = { rank: from.rank + rankDelta, file: from.file + fileDelta }
      if (this.isValidSquare(to)) {
        const target = board[to.rank][to.file]
        if (!target || target.color !== piece.color) {
          moves.push(this.createMove(from, to, piece, target))
        }
      }
    }

    // Castling
    if (!piece.hasMoved && !this.isInCheck(board, piece.color)) {
      const canCastle = gameState.canCastle[piece.color]

      // Kingside castling
      if (canCastle.kingside) {
        const kingsideRook = board[from.rank][7]
        if (kingsideRook && !kingsideRook.hasMoved &&
            !board[from.rank][5] && !board[from.rank][6]) {
          const castlingMove = this.createMove(from, {rank: from.rank, file: 6}, piece)
          castlingMove.castling = 'kingside'
          moves.push(castlingMove)
        }
      }

      // Queenside castling
      if (canCastle.queenside) {
        const queensideRook = board[from.rank][0]
        if (queensideRook && !queensideRook.hasMoved &&
            !board[from.rank][1] && !board[from.rank][2] && !board[from.rank][3]) {
          const castlingMove = this.createMove(from, {rank: from.rank, file: 2}, piece)
          castlingMove.castling = 'queenside'
          moves.push(castlingMove)
        }
      }
    }

    return moves
  }

  // 🛠️ UTILITY METHODS
  private createMove(
    from: Position,
    to: Position,
    piece: ChessPiece,
    capturedPiece?: ChessPiece | null
  ): ChessMove {
    return {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
      notation: this.moveToAlgebraic(from, to, piece, capturedPiece),
      timestamp: Date.now()
    }
  }

  private moveToAlgebraic(
    from: Position,
    to: Position,
    piece: ChessPiece,
    captured?: ChessPiece | null
  ): string {
    const files = 'abcdefgh'
    const toSquare = files[to.file] + (to.rank + 1)

    let notation = ''
    if (piece.type !== 'pawn') {
      notation += piece.type.charAt(0).toUpperCase()
    }

    if (captured) {
      if (piece.type === 'pawn') {
        notation += files[from.file]
      }
      notation += 'x'
    }

    notation += toSquare
    return notation
  }

  public makeMove(gameState: GameState, move: ChessMove): GameState {
    const newBoard = gameState.board.map(row => [...row])
    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'white' ? 'black' : 'white',
      moveHistory: [...gameState.moveHistory, move]
    }

    // Apply the move
    newBoard[move.to.rank][move.to.file] = { ...move.piece, hasMoved: true }
    newBoard[move.from.rank][move.from.file] = null

    // Handle special moves
    if (move.castling) {
      // Move rook for castling
      if (move.castling === 'kingside') {
        const rook = newBoard[move.from.rank][7]
        if (rook) {
          newBoard[move.from.rank][5] = { ...rook, hasMoved: true }
          newBoard[move.from.rank][7] = null
        }
      } else {
        const rook = newBoard[move.from.rank][0]
        if (rook) {
          newBoard[move.from.rank][3] = { ...rook, hasMoved: true }
          newBoard[move.from.rank][0] = null
        }
      }
    }

    if (move.enPassant) {
      // Remove captured pawn
      const captureRank = move.piece.color === 'white' ? move.to.rank - 1 : move.to.rank + 1
      newBoard[captureRank][move.to.file] = null
    }

    // Update game state
    newGameState.isCheck = this.isInCheck(newBoard, newGameState.currentPlayer)

    return newGameState
  }

  private isValidSquare(pos: Position): boolean {
    return pos.rank >= 0 && pos.rank < 8 && pos.file >= 0 && pos.file < 8
  }

  private isInCheck(board: (ChessPiece | null)[][], color: PieceColor): boolean {
    const king = this.findKing(board, color)
    if (!king) return false

    const opponentColor = color === 'white' ? 'black' : 'white'

    // Check if any opponent piece can attack the king
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === opponentColor) {
          if (this.canAttackSquare(board, {rank, file}, king, piece)) {
            return true
          }
        }
      }
    }

    return false
  }

  private findKing(board: (ChessPiece | null)[][], color: PieceColor): Position | null {
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece?.type === 'king' && piece.color === color) {
          return { rank, file }
        }
      }
    }
    return null
  }

  private canAttackSquare(
    board: (ChessPiece | null)[][],
    from: Position,
    target: Position,
    piece: ChessPiece
  ): boolean {
    // Simplified attack check - in production this would be more detailed
    const rankDiff = Math.abs(target.rank - from.rank)
    const fileDiff = Math.abs(target.file - from.file)

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? 1 : -1
        return target.rank === from.rank + direction && fileDiff === 1

      case 'knight':
        return (rankDiff === 2 && fileDiff === 1) || (rankDiff === 1 && fileDiff === 2)

      case 'bishop':
        return rankDiff === fileDiff && this.isPathClear(board, from, target)

      case 'rook':
        return (rankDiff === 0 || fileDiff === 0) && this.isPathClear(board, from, target)

      case 'queen':
        return (rankDiff === fileDiff || rankDiff === 0 || fileDiff === 0) && this.isPathClear(board, from, target)

      case 'king':
        return rankDiff <= 1 && fileDiff <= 1

      default:
        return false
    }
  }

  private isPathClear(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
    const rankStep = to.rank > from.rank ? 1 : to.rank < from.rank ? -1 : 0
    const fileStep = to.file > from.file ? 1 : to.file < from.file ? -1 : 0

    let currentRank = from.rank + rankStep
    let currentFile = from.file + fileStep

    while (currentRank !== to.rank || currentFile !== to.file) {
      if (board[currentRank][currentFile]) {
        return false
      }
      currentRank += rankStep
      currentFile += fileStep
    }

    return true
  }
}

interface UltimateChessEngineProps {
  gameMode: GameMode
  botDifficulty?: BotDifficulty
  roomId?: string
  onLeaveRoom: () => void
}

export function UltimateChessEngine({
  gameMode = 'bot',
  botDifficulty = 'medium',
  roomId,
  onLeaveRoom
}: UltimateChessEngineProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()

  // Initialize game state
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: initializeBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    gameStatus: gameMode === 'online' ? 'waiting' : 'playing',
    winner: null,
    gameMode,
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    canCastle: {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    },
    fiftyMoveCounter: 0,
    roomId,
    players: {},
    spectators: 0,
    timeControl: { white: 600000, black: 600000, increment: 5000 },
    botDifficulty,
    isBotThinking: false
  }))

  // UI state
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [highlightedMoves, setHighlightedMoves] = useState<Position[]>([])
  const [availableMoves, setAvailableMoves] = useState<ChessMove[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showCoordinates, setShowCoordinates] = useState(true)

  // Bot instance
  const chessBot = useRef(new LocalChessBot())
  const botThinkingTimeout = useRef<NodeJS.Timeout>()

  // Initialize chess board
  function initializeBoard(): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null))

    const pieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

    for (let file = 0; file < 8; file++) {
      // White pieces
      board[0][file] = { type: pieces[file], color: 'white', hasMoved: false, id: `w${pieces[file]}${file}` }
      board[1][file] = { type: 'pawn', color: 'white', hasMoved: false, id: `wpawn${file}` }

      // Black pieces
      board[7][file] = { type: pieces[file], color: 'black', hasMoved: false, id: `b${pieces[file]}${file}` }
      board[6][file] = { type: 'pawn', color: 'black', hasMoved: false, id: `bpawn${file}` }
    }

    return board
  }

  // Get piece Unicode symbol
  const getPieceSymbol = useCallback((piece: ChessPiece): string => {
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    }
    return symbols[piece.color][piece.type]
  }, [])

  // Calculate available moves for selected piece
  const calculateAvailableMoves = useCallback((position: Position): ChessMove[] => {
    const piece = gameState.board[position.rank][position.file]
    if (!piece || piece.color !== gameState.currentPlayer) return []

    return chessBot.current.getAllValidMoves(gameState.board, piece.color, gameState)
      .filter(move => move.from.rank === position.rank && move.from.file === position.file)
  }, [gameState])

  // Handle square click
  const handleSquareClick = useCallback((rank: number, file: number) => {
    if (gameState.gameStatus !== 'playing') return

    // Don't allow moves when it's bot's turn
    if (gameMode === 'bot' && gameState.currentPlayer === 'black') return

    // Don't allow moves when bot is thinking
    if (gameState.isBotThinking) return

    const clickedPosition = { rank, file }
    const clickedPiece = gameState.board[rank][file]

    if (selectedSquare) {
      // Try to make a move
      const targetMove = availableMoves.find(move =>
        move.to.rank === rank && move.to.file === file
      )

      if (targetMove) {
        makeMove(targetMove)
      } else if (clickedPiece && clickedPiece.color === gameState.currentPlayer) {
        // Select different piece
        setSelectedSquare(clickedPosition)
        const moves = calculateAvailableMoves(clickedPosition)
        setAvailableMoves(moves)
        setHighlightedMoves(moves.map(m => m.to))
      } else {
        // Deselect
        setSelectedSquare(null)
        setAvailableMoves([])
        setHighlightedMoves([])
      }
    } else {
      // Select a piece
      if (clickedPiece && clickedPiece.color === gameState.currentPlayer) {
        setSelectedSquare(clickedPosition)
        const moves = calculateAvailableMoves(clickedPosition)
        setAvailableMoves(moves)
        setHighlightedMoves(moves.map(m => m.to))
      }
    }
  }, [gameState, selectedSquare, availableMoves, calculateAvailableMoves, gameMode])

  // Make a move
  const makeMove = useCallback((move: ChessMove) => {
    console.log(`Making move: ${move.notation}`)

    setGameState(prevState => {
      const newState = chessBot.current.makeMove(prevState, move)
      return newState
    })

    // Clear selection
    setSelectedSquare(null)
    setAvailableMoves([])
    setHighlightedMoves([])

    // Send move to server for online games
    if (gameMode === 'online' && socket && roomId) {
      socket.emit('game:move', { roomId, move })
    }

    // Play sound
    if (soundEnabled) {
      // TODO: Play move sound
    }
  }, [gameMode, socket, roomId, soundEnabled])

  // 🤖 BOT MOVE EXECUTION - This is the key part!
  const executeBotMove = useCallback(async () => {
    if (gameState.gameStatus !== 'playing') return
    if (gameMode !== 'bot') return
    if (gameState.currentPlayer !== 'black') return
    if (gameState.isBotThinking) return

    console.log('🤖 Bot turn - starting to think...')

    setGameState(prev => ({ ...prev, isBotThinking: true }))

    try {
      // Add thinking delay for realism
      const thinkingTime = botDifficulty === 'easy' ? 500 :
                           botDifficulty === 'medium' ? 1500 :
                           botDifficulty === 'hard' ? 3000 : 5000

      botThinkingTimeout.current = setTimeout(async () => {
        const bestMove = await chessBot.current.getBestMove(gameState, botDifficulty)

        if (bestMove) {
          console.log(`🎯 Bot plays: ${bestMove.notation}`)
          makeMove(bestMove)
        } else {
          console.log('❌ Bot has no valid moves')
        }

        setGameState(prev => ({ ...prev, isBotThinking: false }))
      }, thinkingTime)

    } catch (error) {
      console.error('❌ Bot move error:', error)
      setGameState(prev => ({ ...prev, isBotThinking: false }))
    }
  }, [gameState, gameMode, botDifficulty, makeMove])

  // 🎯 CRUCIAL: Execute bot move when it's bot's turn
  useEffect(() => {
    if (gameState.gameStatus === 'playing' &&
        gameMode === 'bot' &&
        gameState.currentPlayer === 'black' &&
        !gameState.isBotThinking) {
      executeBotMove()
    }

    return () => {
      if (botThinkingTimeout.current) {
        clearTimeout(botThinkingTimeout.current)
      }
    }
  }, [gameState.currentPlayer, gameState.gameStatus, executeBotMove])

  // Socket events for online play
  useEffect(() => {
    if (!socket || gameMode !== 'online') return

    socket.on('game:state', (newGameState: GameState) => {
      setGameState(newGameState)
    })

    socket.on('game:move', (data: { move: ChessMove }) => {
      setGameState(prevState => chessBot.current.makeMove(prevState, data.move))
    })

    // Join room
    if (roomId) {
      socket.emit('game:join', { roomId, gameType: 'chess' })
    }

    return () => {
      socket.off('game:state')
      socket.off('game:move')
    }
  }, [socket, gameMode, roomId])

  // Get square styling
  const getSquareClass = useCallback((rank: number, file: number): string => {
    const isLight = (rank + file) % 2 === 0
    const isSelected = selectedSquare?.rank === rank && selectedSquare?.file === file
    const isHighlighted = highlightedMoves.some(pos => pos.rank === rank && pos.file === file)
    const isLastMove = gameState.moveHistory.length > 0 && (() => {
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1]
      return (lastMove.from.rank === rank && lastMove.from.file === file) ||
             (lastMove.to.rank === rank && lastMove.to.file === file)
    })()

    let classes = 'aspect-square flex items-center justify-center cursor-pointer transition-all duration-200 '

    if (isSelected) {
      classes += 'bg-yellow-400 shadow-lg '
    } else if (isHighlighted) {
      classes += 'bg-green-400 opacity-80 '
    } else if (isLastMove) {
      classes += 'bg-blue-300 '
    } else {
      classes += isLight ? 'bg-amber-100 hover:bg-amber-200 ' : 'bg-amber-800 hover:bg-amber-700 '
    }

    return classes
  }, [selectedSquare, highlightedMoves, gameState.moveHistory])

  // Get current turn indicator
  const getCurrentTurnText = useCallback((): string => {
    if (gameState.isBotThinking) return '🤖 Bot is thinking...'
    if (gameState.gameStatus === 'waiting') return 'Waiting for opponent...'
    if (gameState.gameStatus === 'finished') return 'Game Over'

    const playerName = gameState.currentPlayer === 'white' ? 'White' :
                      (gameMode === 'bot' && gameState.currentPlayer === 'black') ? 'Bot' : 'Black'

    return `${playerName} to move`
  }, [gameState, gameMode])

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to play Chess</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 mb-2">
              ♔ Ultimate Chess Engine
            </h1>
            <div className="flex items-center gap-4 text-sm text-amber-700">
              <span>Mode: {gameMode.toUpperCase()}</span>
              {gameMode === 'bot' && <span>Bot: {botDifficulty.toUpperCase()}</span>}
              {gameMode === 'online' && roomId && <span>Room: {roomId}</span>}
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {Object.keys(gameState.players).length + gameState.spectators} Online
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCoordinates(!showCoordinates)}
            >
              <Target className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onLeaveRoom}>
              Leave
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Game Status */}
          <div className="order-2 xl:order-1 space-y-4">
            <Card className="bg-white/60 backdrop-blur border-amber-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-900">Game Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-900">
                    {getCurrentTurnText()}
                  </div>
                  {gameState.isBotThinking && (
                    <div className="flex justify-center mt-2">
                      <div className="animate-spin h-6 w-6 border-3 border-amber-600 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>

                {gameState.isCheck && (
                  <motion.div
                    className="bg-red-100 border border-red-300 rounded-lg p-3"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                      <Crown className="h-5 w-5" />
                      <span>CHECK!</span>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">White:</span>
                    <span className="font-mono font-bold">
                      {Math.floor(gameState.timeControl.white / 60000)}:
                      {String(Math.floor((gameState.timeControl.white % 60000) / 1000)).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Black:</span>
                    <span className="font-mono font-bold">
                      {Math.floor(gameState.timeControl.black / 60000)}:
                      {String(Math.floor((gameState.timeControl.black % 60000) / 1000)).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bot Info */}
            {gameMode === 'bot' && (
              <Card className="bg-blue-50/60 backdrop-blur border-blue-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Chess Bot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Difficulty:</span>
                    <Badge className="bg-blue-600 text-white">{botDifficulty.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Status:</span>
                    <span className={gameState.isBotThinking ? 'text-orange-600 font-bold' : 'text-green-600'}>
                      {gameState.isBotThinking ? 'Thinking...' : 'Ready'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Playing as:</span>
                    <span className="font-bold">♚ Black</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Move History */}
            <Card className="bg-white/60 backdrop-blur border-amber-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-900">Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto">
                  {gameState.moveHistory.length === 0 ? (
                    <p className="text-amber-600 text-sm text-center">No moves yet</p>
                  ) : (
                    <div className="space-y-1">
                      {gameState.moveHistory.map((move, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-2 p-1 hover:bg-amber-100 rounded text-sm"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <span className="text-amber-700 font-bold w-8">
                            {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}
                          </span>
                          <span className="flex-1 font-mono font-bold">{move.notation}</span>
                          {move.check && <span className="text-red-600">+</span>}
                          {move.checkmate && <span className="text-red-600">#</span>}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chess Board */}
          <div className="order-1 xl:order-2 col-span-1 xl:col-span-2">
            <Card className="bg-white/80 backdrop-blur border-amber-400 shadow-2xl">
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-amber-900 to-amber-800 p-4 rounded-lg shadow-inner">
                  <div className="grid grid-cols-8 gap-0 border-4 border-amber-700 rounded overflow-hidden">
                    {gameState.board.map((row, rank) =>
                      row.map((piece, file) => (
                        <motion.div
                          key={`${rank}-${file}`}
                          className={getSquareClass(7 - rank, file)}
                          onClick={() => handleSquareClick(7 - rank, file)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {piece && (
                            <motion.span
                              className="text-4xl md:text-5xl lg:text-6xl select-none drop-shadow-lg"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                                delay: (rank * 8 + file) * 0.02
                              }}
                            >
                              {getPieceSymbol(piece)}
                            </motion.span>
                          )}

                          {/* Move hint dots */}
                          {highlightedMoves.some(pos => pos.rank === 7 - rank && pos.file === file) && !piece && (
                            <div className="w-4 h-4 bg-green-600 rounded-full opacity-60" />
                          )}

                          {/* Attack indicators */}
                          {highlightedMoves.some(pos => pos.rank === 7 - rank && pos.file === file) && piece && (
                            <div className="absolute inset-0 border-4 border-red-500 rounded" />
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Coordinates */}
                  {showCoordinates && (
                    <div className="flex justify-between mt-2 px-4 text-amber-200 text-sm font-bold">
                      {'abcdefgh'.split('').map(file => (
                        <span key={file}>{file}</span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game Controls */}
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSquare(null)
                  setAvailableMoves([])
                  setHighlightedMoves([])
                }}
                disabled={!selectedSquare}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>

              {gameState.gameStatus === 'finished' && (
                <Button
                  onClick={() => window.location.reload()}
                >
                  <Play className="h-4 w-4 mr-2" />
                  New Game
                </Button>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="order-3 space-y-4">
            <Card className="bg-white/60 backdrop-blur border-amber-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-900">Game Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Moves:</span>
                  <span className="font-bold">{gameState.moveHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Captures:</span>
                  <span className="font-bold">
                    {gameState.moveHistory.filter(m => m.capturedPiece).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Checks:</span>
                  <span className="font-bold">
                    {gameState.moveHistory.filter(m => m.check).length}
                  </span>
                </div>
                {gameMode === 'online' && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Online:</span>
                    <Badge variant={isConnected ? 'default' : 'destructive'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available moves for selected piece */}
            {selectedSquare && availableMoves.length > 0 && (
              <Card className="bg-green-50/60 backdrop-blur border-green-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-900">Available Moves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    {availableMoves.slice(0, 16).map((move, index) => (
                      <motion.div
                        key={index}
                        className="bg-green-200 rounded px-2 py-1 text-center font-mono font-bold cursor-pointer hover:bg-green-300"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => makeMove(move)}
                      >
                        {move.notation}
                      </motion.div>
                    ))}
                  </div>
                  {availableMoves.length > 16 && (
                    <p className="text-xs text-green-700 mt-2 text-center">
                      +{availableMoves.length - 16} more moves
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Game Over Modal */}
        {gameState.gameStatus === 'finished' && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-white border-amber-400 w-full max-w-lg mx-4">
              <CardHeader>
                <CardTitle className="text-center text-3xl text-amber-900">
                  {gameState.winner === 'draw' ? '🤝 Draw!' :
                   gameState.winner === 'white' ? '♔ White Wins!' : '♚ Black Wins!'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-amber-700">Total Moves</div>
                    <div className="font-bold text-2xl">{gameState.moveHistory.length}</div>
                  </div>
                  <div>
                    <div className="text-amber-700">Captures</div>
                    <div className="font-bold text-2xl">
                      {gameState.moveHistory.filter(m => m.capturedPiece).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-amber-700">Checks</div>
                    <div className="font-bold text-2xl">
                      {gameState.moveHistory.filter(m => m.check).length}
                    </div>
                  </div>
                </div>

                {gameMode === 'bot' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 mb-2">🤖 Bot Performance</h3>
                    <p className="text-sm text-blue-700">
                      You played against the <strong>{botDifficulty}</strong> bot.
                      {gameState.winner === 'white' ? ' Excellent victory!' :
                       gameState.winner === 'black' ? ' The bot played well!' :
                       ' A well-fought draw!'}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button className="w-full text-lg py-3" onClick={() => window.location.reload()}>
                    <Play className="h-5 w-5 mr-2" />
                    Play Again
                  </Button>
                  <Button variant="outline" className="w-full" onClick={onLeaveRoom}>
                    Leave Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}