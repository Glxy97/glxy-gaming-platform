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
  Crown, Brain, Zap, Clock, Target, Trophy, Star, Award,
  Volume2, VolumeX, Settings, Eye, RotateCcw, Lightbulb,
  TrendingUp, Activity, ChevronRight, BookOpen, Cpu
} from 'lucide-react'

// Enhanced Chess types for AI integration
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type PieceColor = 'white' | 'black'
type GamePhase = 'opening' | 'middlegame' | 'endgame'
type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'grandmaster'

interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved: boolean
  enPassantTarget?: boolean
  id: string
}

interface Position {
  file: number // 0-7 (a-h)
  rank: number // 0-7 (1-8)
}

interface Move {
  from: Position
  to: Position
  piece: ChessPiece
  capturedPiece?: ChessPiece
  promotion?: PieceType
  castling?: 'kingside' | 'queenside'
  enPassant?: boolean
  check?: boolean
  checkmate?: boolean
  stalemate?: boolean
  notation: string
}

interface EvaluationMetrics {
  material: number
  position: number
  pawnStructure: number
  kingSafety: number
  activity: number
  total: number
  mate?: number // Moves to mate
}

interface AIAnalysis {
  bestMove: Move | null
  evaluation: EvaluationMetrics
  principalVariation: Move[]
  depth: number
  nodesSearched: number
  timeSpent: number
  opening?: string
  threats: string[]
  suggestions: string[]
}

interface GameAnalytics {
  moveAccuracy: number[]
  timeSpent: number[]
  blunders: number
  mistakes: number
  inaccuracies: number
  brilliantMoves: number
  bookMoves: number
  averageCentipawnLoss: number
  openingName?: string
  gamePhase: GamePhase
  complexity: number
}

interface ChessGameState {
  board: (ChessPiece | null)[][]
  currentPlayer: PieceColor
  moveHistory: Move[]
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished'
  winner: PieceColor | 'draw' | null
  gameMode: 'pvp' | 'ai' | 'analysis' | 'puzzle'
  timeControl: {
    white: number
    black: number
    increment: number
  }
  aiDifficulty: Difficulty
  roomId: string
  spectators: number
  isCheck: boolean
  availableMoves: Move[]
  lastMove?: Move
  fiftyMoveRule: number
  repetitionCount: number
}

// Chess AI Engine using minimax with alpha-beta pruning
class ChessAI {
  private transpositionTable = new Map<string, any>()
  private killerMoves: Move[][] = []
  private historyHeuristic: number[][][][] = []
  private pieceSquareTables: Record<PieceType, number[][]> = {
    king: [], queen: [], rook: [], bishop: [], knight: [], pawn: []
  }

  constructor() {
    this.initializePieceSquareTables()
    this.initializeKillerMoves()
    this.initializeHistoryHeuristic()
  }

  private initializePieceSquareTables() {
    // Piece-square tables for positional evaluation
    this.pieceSquareTables.pawn = [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5,  5, 10, 25, 25, 10,  5,  5],
      [0,  0,  0, 20, 20,  0,  0,  0],
      [5, -5,-10,  0,  0,-10, -5,  5],
      [5, 10, 10,-20,-20, 10, 10,  5],
      [0,  0,  0,  0,  0,  0,  0,  0]
    ]

    this.pieceSquareTables.knight = [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ]

    this.pieceSquareTables.bishop = [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10, 10, 10, 10, 10, 10, 10,-10],
      [-10,  5,  0,  0,  0,  0,  5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ]

    this.pieceSquareTables.rook = [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [5, 10, 10, 10, 10, 10, 10,  5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [0,  0,  0,  5,  5,  0,  0,  0]
    ]

    this.pieceSquareTables.queen = [
      [-20,-10,-10, -5, -5,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5,  5,  5,  5,  0,-10],
      [-5,  0,  5,  5,  5,  5,  0, -5],
      [0,  0,  5,  5,  5,  5,  0, -5],
      [-10,  5,  5,  5,  5,  5,  0,-10],
      [-10,  0,  5,  0,  0,  0,  0,-10],
      [-20,-10,-10, -5, -5,-10,-10,-20]
    ]

    this.pieceSquareTables.king = [
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [20, 20,  0,  0,  0,  0, 20, 20],
      [20, 30, 10,  0,  0, 10, 30, 20]
    ]
  }

  private initializeKillerMoves() {
    this.killerMoves = Array(20).fill(null).map(() => [])
  }

  private initializeHistoryHeuristic() {
    this.historyHeuristic = Array(8).fill(null).map(() =>
      Array(8).fill(null).map(() =>
        Array(8).fill(null).map(() =>
          Array(8).fill(0)
        )
      )
    )
  }

  public getBestMove(
    board: (ChessPiece | null)[][],
    color: PieceColor,
    depth: number = 6,
    timeLimit: number = 5000
  ): AIAnalysis {
    const startTime = Date.now()
    const analysis: AIAnalysis = {
      bestMove: null,
      evaluation: { material: 0, position: 0, pawnStructure: 0, kingSafety: 0, activity: 0, total: 0 },
      principalVariation: [],
      depth,
      nodesSearched: 0,
      timeSpent: 0,
      threats: [],
      suggestions: []
    }

    try {
      const result = this.minimax(board, depth, -Infinity, Infinity, color === 'white', startTime, timeLimit)
      analysis.bestMove = result.bestMove
      analysis.evaluation = this.evaluatePosition(board, color)
      analysis.nodesSearched = result.nodesSearched
      analysis.timeSpent = Date.now() - startTime

      // Generate threats and suggestions
      analysis.threats = this.findThreats(board, color)
      analysis.suggestions = this.generateSuggestions(board, analysis.evaluation)

    } catch (error) {
      console.error('AI Analysis error:', error)
    }

    return analysis
  }

  private minimax(
    board: (ChessPiece | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    startTime: number,
    timeLimit: number,
    nodesSearched: number = 0
  ): { bestMove: Move | null; score: number; nodesSearched: number } {

    // Time management
    if (Date.now() - startTime > timeLimit) {
      throw new Error('Time limit exceeded')
    }

    nodesSearched++

    // Base case
    if (depth === 0) {
      return {
        bestMove: null,
        score: this.quiescenceSearch(board, alpha, beta, isMaximizing, 3),
        nodesSearched
      }
    }

    const moves = this.generateMoves(board, isMaximizing ? 'white' : 'black')
    if (moves.length === 0) {
      // Checkmate or stalemate
      if (this.isInCheck(board, isMaximizing ? 'white' : 'black')) {
        return { bestMove: null, score: isMaximizing ? -9999 + (6 - depth) : 9999 - (6 - depth), nodesSearched }
      } else {
        return { bestMove: null, score: 0, nodesSearched } // Stalemate
      }
    }

    // Move ordering for better alpha-beta pruning
    const orderedMoves = this.orderMoves(moves, board)

    let bestMove: Move | null = null
    let bestScore = isMaximizing ? -Infinity : Infinity

    for (const move of orderedMoves) {
      const newBoard = this.makeMove(board, move)
      const result = this.minimax(newBoard, depth - 1, alpha, beta, !isMaximizing, startTime, timeLimit, nodesSearched)
      nodesSearched = result.nodesSearched

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score
          bestMove = move
        }
        alpha = Math.max(alpha, bestScore)
      } else {
        if (result.score < bestScore) {
          bestScore = result.score
          bestMove = move
        }
        beta = Math.min(beta, bestScore)
      }

      // Alpha-beta pruning
      if (beta <= alpha) {
        // Update history heuristic
        this.historyHeuristic[move.from.file][move.from.rank][move.to.file][move.to.rank] += depth * depth
        break
      }
    }

    return { bestMove, score: bestScore, nodesSearched }
  }

  private quiescenceSearch(
    board: (ChessPiece | null)[][],
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    depth: number
  ): number {
    const standPat = this.evaluateBoard(board)

    if (depth === 0) return standPat

    if (isMaximizing) {
      if (standPat >= beta) return beta
      alpha = Math.max(alpha, standPat)
    } else {
      if (standPat <= alpha) return alpha
      beta = Math.min(beta, standPat)
    }

    // Only search captures and checks in quiescence
    const captures = this.generateCaptures(board, isMaximizing ? 'white' : 'black')

    for (const capture of captures) {
      const newBoard = this.makeMove(board, capture)
      const score = this.quiescenceSearch(newBoard, alpha, beta, !isMaximizing, depth - 1)

      if (isMaximizing) {
        alpha = Math.max(alpha, score)
        if (alpha >= beta) break
      } else {
        beta = Math.min(beta, score)
        if (beta <= alpha) break
      }
    }

    return isMaximizing ? alpha : beta
  }

  private evaluatePosition(board: (ChessPiece | null)[][], color: PieceColor): EvaluationMetrics {
    const metrics: EvaluationMetrics = {
      material: 0,
      position: 0,
      pawnStructure: 0,
      kingSafety: 0,
      activity: 0,
      total: 0
    }

    // Material count
    metrics.material = this.evaluateMaterial(board, color)

    // Positional evaluation
    metrics.position = this.evaluatePosition_Internal(board, color)

    // Pawn structure
    metrics.pawnStructure = this.evaluatePawnStructure(board, color)

    // King safety
    metrics.kingSafety = this.evaluateKingSafety(board, color)

    // Piece activity
    metrics.activity = this.evaluateActivity(board, color)

    metrics.total = metrics.material + metrics.position + metrics.pawnStructure + metrics.kingSafety + metrics.activity

    return metrics
  }

  private evaluateBoard(board: (ChessPiece | null)[][]): number {
    let score = 0
    const pieceValues = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 }

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece) {
          const pieceValue = pieceValues[piece.type]
          const positionalValue = this.pieceSquareTables[piece.type][rank][file]

          if (piece.color === 'white') {
            score += pieceValue + positionalValue
          } else {
            score -= pieceValue + positionalValue
          }
        }
      }
    }

    return score
  }

  private evaluateMaterial(board: (ChessPiece | null)[][], color: PieceColor): number {
    const pieceValues = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0 }
    let material = 0

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece) {
          const value = pieceValues[piece.type]
          if (piece.color === color) {
            material += value
          } else {
            material -= value
          }
        }
      }
    }

    return material
  }

  private evaluatePosition_Internal(board: (ChessPiece | null)[][], color: PieceColor): number {
    let positional = 0

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece) {
          const tableValue = this.pieceSquareTables[piece.type][
            piece.color === 'white' ? rank : 7 - rank
          ][file]

          if (piece.color === color) {
            positional += tableValue
          } else {
            positional -= tableValue
          }
        }
      }
    }

    return positional
  }

  private evaluatePawnStructure(board: (ChessPiece | null)[][], color: PieceColor): number {
    let score = 0
    const pawns: { white: { rank: number; file: number }[]; black: { rank: number; file: number }[] } = {
      white: [],
      black: []
    }

    // Collect pawn positions
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece?.type === 'pawn') {
          pawns[piece.color].push({ rank, file })
        }
      }
    }

    // Evaluate pawn structure
    for (const pawnColor of ['white', 'black'] as PieceColor[]) {
      const colorPawns = pawns[pawnColor]
      const multiplier = pawnColor === color ? 1 : -1

      // Doubled pawns penalty
      const fileGroups = colorPawns.reduce((acc, pawn) => {
        acc[pawn.file] = (acc[pawn.file] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      for (const count of Object.values(fileGroups)) {
        if (count > 1) {
          score += multiplier * -20 * (count - 1)
        }
      }

      // Isolated pawns penalty
      for (const pawn of colorPawns) {
        const hasAdjacentFile = colorPawns.some(p =>
          Math.abs(p.file - pawn.file) === 1
        )
        if (!hasAdjacentFile) {
          score += multiplier * -15
        }
      }

      // Passed pawns bonus
      for (const pawn of colorPawns) {
        const isPassedPawn = !pawns[pawnColor === 'white' ? 'black' : 'white'].some(enemyPawn => {
          if (Math.abs(enemyPawn.file - pawn.file) <= 1) {
            return pawnColor === 'white'
              ? enemyPawn.rank >= pawn.rank
              : enemyPawn.rank <= pawn.rank
          }
          return false
        })

        if (isPassedPawn) {
          const rankBonus = pawnColor === 'white' ? pawn.rank + 1 : 8 - pawn.rank
          score += multiplier * rankBonus * 10
        }
      }
    }

    return score
  }

  private evaluateKingSafety(board: (ChessPiece | null)[][], color: PieceColor): number {
    let safety = 0

    const king = this.findKing(board, color)
    if (!king) return -1000

    // Pawn shield evaluation
    const shieldRank = color === 'white' ? king.rank - 1 : king.rank + 1
    if (shieldRank >= 0 && shieldRank < 8) {
      for (let file = Math.max(0, king.file - 1); file <= Math.min(7, king.file + 1); file++) {
        const piece = board[shieldRank][file]
        if (piece?.type === 'pawn' && piece.color === color) {
          safety += 10
        } else {
          safety -= 15 // Open file penalty
        }
      }
    }

    // King exposure in center penalty
    if (king.file >= 3 && king.file <= 4 && king.rank >= 3 && king.rank <= 4) {
      safety -= 50
    }

    return safety
  }

  private evaluateActivity(board: (ChessPiece | null)[][], color: PieceColor): number {
    let activity = 0

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === color) {
          const moves = this.generatePieceMoves(board, { rank, file })
          const multiplier = piece.color === color ? 1 : -1
          activity += multiplier * moves.length * 2

          // Central square control bonus
          const centerDistance = Math.abs(3.5 - file) + Math.abs(3.5 - rank)
          activity += multiplier * Math.max(0, 4 - centerDistance)
        }
      }
    }

    return activity
  }

  private findThreats(board: (ChessPiece | null)[][], color: PieceColor): string[] {
    const threats: string[] = []
    const opponentColor = color === 'white' ? 'black' : 'white'

    // Find pieces under attack
    const attackedSquares = this.getAttackedSquares(board, opponentColor)

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === color) {
          if (attackedSquares.some(pos => pos.rank === rank && pos.file === file)) {
            threats.push(`${piece.type} on ${String.fromCharCode(97 + file)}${rank + 1} is under attack`)
          }
        }
      }
    }

    // Check for discovered attacks, pins, forks, etc.
    if (this.isInCheck(board, color)) {
      threats.push('King is in check')
    }

    return threats
  }

  private generateSuggestions(board: (ChessPiece | null)[][], evaluation: EvaluationMetrics): string[] {
    const suggestions: string[] = []

    if (evaluation.material < -200) {
      suggestions.push('Focus on piece activity and tactical opportunities')
    }

    if (evaluation.kingSafety < -30) {
      suggestions.push('Improve king safety with pawn moves or castling')
    }

    if (evaluation.activity < 0) {
      suggestions.push('Activate your pieces with better positioning')
    }

    if (evaluation.pawnStructure < -50) {
      suggestions.push('Avoid further pawn weaknesses')
    }

    return suggestions
  }

  // Helper methods
  private generateMoves(board: (ChessPiece | null)[][], color: PieceColor): Move[] {
    const moves: Move[] = []

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === color) {
          const pieceMoves = this.generatePieceMoves(board, { rank, file })
          moves.push(...pieceMoves)
        }
      }
    }

    return moves.filter(move => !this.wouldBeInCheck(board, move, color))
  }

  private generatePieceMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    const moves: Move[] = []
    const piece = board[from.rank][from.file]
    if (!piece) return moves

    switch (piece.type) {
      case 'pawn':
        moves.push(...this.generatePawnMoves(board, from))
        break
      case 'knight':
        moves.push(...this.generateKnightMoves(board, from))
        break
      case 'bishop':
        moves.push(...this.generateBishopMoves(board, from))
        break
      case 'rook':
        moves.push(...this.generateRookMoves(board, from))
        break
      case 'queen':
        moves.push(...this.generateQueenMoves(board, from))
        break
      case 'king':
        moves.push(...this.generateKingMoves(board, from))
        break
    }

    return moves
  }

  private generatePawnMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    const moves: Move[] = []
    const piece = board[from.rank][from.file]!
    const direction = piece.color === 'white' ? -1 : 1
    const startRank = piece.color === 'white' ? 6 : 1

    // Forward moves
    const oneStep = { rank: from.rank + direction, file: from.file }
    if (this.isValidSquare(oneStep) && !board[oneStep.rank][oneStep.file]) {
      moves.push(this.createMove(from, oneStep, piece))

      // Two-step move from starting position
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
      }
    }

    return moves
  }

  private generateKnightMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    const moves: Move[] = []
    const piece = board[from.rank][from.file]!
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

  private generateBishopMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    const moves: Move[] = []
    const piece = board[from.rank][from.file]!
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

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

  private generateRookMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    const moves: Move[] = []
    const piece = board[from.rank][from.file]!
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]

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

  private generateQueenMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    return [
      ...this.generateBishopMoves(board, from),
      ...this.generateRookMoves(board, from)
    ]
  }

  private generateKingMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    const moves: Move[] = []
    const piece = board[from.rank][from.file]!
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

    // Castling (simplified)
    if (!piece.hasMoved && !this.isInCheck(board, piece.color)) {
      // Add castling moves logic here
    }

    return moves
  }

  private generateCaptures(board: (ChessPiece | null)[][], color: PieceColor): Move[] {
    return this.generateMoves(board, color).filter(move => move.capturedPiece)
  }

  private orderMoves(moves: Move[], board: (ChessPiece | null)[][]): Move[] {
    return moves.sort((a, b) => {
      // Prioritize captures
      if (a.capturedPiece && !b.capturedPiece) return -1
      if (!a.capturedPiece && b.capturedPiece) return 1

      // MVV-LVA for captures
      if (a.capturedPiece && b.capturedPiece) {
        const aValue = this.getPieceValue(a.capturedPiece) - this.getPieceValue(a.piece) / 10
        const bValue = this.getPieceValue(b.capturedPiece) - this.getPieceValue(b.piece) / 10
        return bValue - aValue
      }

      // History heuristic
      const aHistory = this.historyHeuristic[a.from.file][a.from.rank][a.to.file][a.to.rank]
      const bHistory = this.historyHeuristic[b.from.file][b.from.rank][b.to.file][b.to.rank]
      return bHistory - aHistory
    })
  }

  private makeMove(board: (ChessPiece | null)[][], move: Move): (ChessPiece | null)[][] {
    const newBoard = board.map(row => [...row])
    newBoard[move.to.rank][move.to.file] = { ...move.piece, hasMoved: true }
    newBoard[move.from.rank][move.from.file] = null
    return newBoard
  }

  private createMove(
    from: Position,
    to: Position,
    piece: ChessPiece,
    captured?: ChessPiece | null
  ): Move {
    return {
      from,
      to,
      piece,
      capturedPiece: captured || undefined,
      notation: this.generateNotation(from, to, piece, captured)
    }
  }

  private generateNotation(from: Position, to: Position, piece: ChessPiece, captured?: ChessPiece | null): string {
    const files = 'abcdefgh'
    const fromSquare = files[from.file] + (from.rank + 1)
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

  private isValidSquare(pos: Position): boolean {
    return pos.rank >= 0 && pos.rank < 8 && pos.file >= 0 && pos.file < 8
  }

  private isInCheck(board: (ChessPiece | null)[][], color: PieceColor): boolean {
    const king = this.findKing(board, color)
    if (!king) return false

    const opponentColor = color === 'white' ? 'black' : 'white'
    const attackedSquares = this.getAttackedSquares(board, opponentColor)

    return attackedSquares.some(pos => pos.rank === king.rank && pos.file === king.file)
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

  private getAttackedSquares(board: (ChessPiece | null)[][], color: PieceColor): Position[] {
    const attacked: Position[] = []

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === color) {
          const moves = this.generatePieceMoves(board, { rank, file })
          attacked.push(...moves.map(move => move.to))
        }
      }
    }

    return attacked
  }

  private wouldBeInCheck(board: (ChessPiece | null)[][], move: Move, color: PieceColor): boolean {
    const testBoard = this.makeMove(board, move)
    return this.isInCheck(testBoard, color)
  }

  private getPieceValue(piece: ChessPiece): number {
    const values = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 }
    return values[piece.type]
  }
}

interface AIChessEngineProps {
  roomId: string
  gameMode: 'pvp' | 'ai' | 'analysis' | 'puzzle'
  aiDifficulty: Difficulty
  timeControl?: { base: number; increment: number }
  onLeaveRoom: () => void
}

export function AIChessEngine({
  roomId,
  gameMode = 'ai',
  aiDifficulty = 'intermediate',
  timeControl = { base: 600, increment: 5 },
  onLeaveRoom
}: AIChessEngineProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()

  // Game state
  const [gameState, setGameState] = useState<ChessGameState>({
    board: initializeBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    gameStatus: 'waiting',
    winner: null,
    gameMode,
    timeControl: { white: timeControl.base * 1000, black: timeControl.base * 1000, increment: timeControl.increment * 1000 },
    aiDifficulty,
    roomId,
    spectators: 0,
    isCheck: false,
    availableMoves: [],
    fiftyMoveRule: 0,
    repetitionCount: 0
  })

  // AI state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(gameMode === 'analysis')
  const [gameAnalytics, setGameAnalytics] = useState<GameAnalytics>({
    moveAccuracy: [],
    timeSpent: [],
    blunders: 0,
    mistakes: 0,
    inaccuracies: 0,
    brilliantMoves: 0,
    bookMoves: 0,
    averageCentipawnLoss: 0,
    gamePhase: 'opening',
    complexity: 50
  })

  // UI state
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [highlightedMoves, setHighlightedMoves] = useState<Position[]>([])
  const [showHints, setShowHints] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // AI Engine
  const aiEngine = useRef(new ChessAI())
  const analysisWorker = useRef<Worker | null>(null)

  // Initialize board
  function initializeBoard(): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null))

    // Set up initial position
    const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

    for (let file = 0; file < 8; file++) {
      // Black pieces (top - rows 0-1)
      board[0][file] = { type: backRank[file], color: 'black', hasMoved: false, id: `black-${backRank[file]}-${file}` }
      board[1][file] = { type: 'pawn', color: 'black', hasMoved: false, id: `black-pawn-${file}` }

      // White pieces (bottom - rows 6-7)
      board[7][file] = { type: backRank[file], color: 'white', hasMoved: false, id: `white-${backRank[file]}-${file}` }
      board[6][file] = { type: 'pawn', color: 'white', hasMoved: false, id: `white-pawn-${file}` }
    }

    return board
  }

  // Get piece symbol
  const getPieceSymbol = useCallback((piece: ChessPiece): string => {
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    }
    return symbols[piece.color][piece.type]
  }, [])

  // Handle square click
  const handleSquareClick = useCallback((rank: number, file: number) => {
    const position = { rank, file }

    if (gameState.gameStatus !== 'playing') return
    if (gameMode === 'ai' && gameState.currentPlayer === 'black') return // AI's turn

    if (selectedSquare) {
      // Try to make a move
      const isValidMove = highlightedMoves.some(move =>
        move.rank === rank && move.file === file
      )

      if (isValidMove) {
        const move = gameState.availableMoves.find(m =>
          m.from.rank === selectedSquare.rank &&
          m.from.file === selectedSquare.file &&
          m.to.rank === rank &&
          m.to.file === file
        )

        if (move && socket) {
          socket.emit('game:move', { roomId, move })
        }
      }

      setSelectedSquare(null)
      setHighlightedMoves([])
    } else {
      // Select a piece
      const piece = gameState.board[rank][file]
      if (piece && piece.color === gameState.currentPlayer) {
        setSelectedSquare(position)

        // Highlight available moves
        const availableMoves = gameState.availableMoves.filter(move =>
          move.from.rank === rank && move.from.file === file
        ).map(move => move.to)

        setHighlightedMoves(availableMoves)
      }
    }
  }, [gameState, selectedSquare, highlightedMoves, socket, roomId, gameMode])

  // AI move calculation
  const calculateAIMove = useCallback(async () => {
    if (gameState.currentPlayer === 'white' || gameMode !== 'ai') return

    setIsAnalyzing(true)

    try {
      const depth = {
        beginner: 3,
        intermediate: 5,
        advanced: 7,
        expert: 9,
        grandmaster: 11
      }[aiDifficulty]

      const timeLimit = {
        beginner: 1000,
        intermediate: 3000,
        advanced: 5000,
        expert: 8000,
        grandmaster: 15000
      }[aiDifficulty]

      const analysis = aiEngine.current.getBestMove(
        gameState.board,
        'black',
        depth,
        timeLimit
      )

      setAiAnalysis(analysis)

      if (analysis.bestMove && socket) {
        // Add some delay for dramatic effect
        setTimeout(() => {
          socket.emit('game:move', { roomId, move: analysis.bestMove })
        }, Math.random() * 1000 + 500)
      }
    } catch (error) {
      console.error('AI calculation error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [gameState, aiDifficulty, socket, roomId, gameMode])

  // Run AI analysis in analysis mode
  const runAnalysis = useCallback(async () => {
    if (gameMode !== 'analysis') return

    setIsAnalyzing(true)

    try {
      const analysis = aiEngine.current.getBestMove(
        gameState.board,
        gameState.currentPlayer,
        8,
        10000
      )
      setAiAnalysis(analysis)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [gameState, gameMode])

  // Effects
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameMode === 'ai' && gameState.currentPlayer === 'black') {
      calculateAIMove()
    }
  }, [gameState.currentPlayer, gameState.gameStatus, calculateAIMove])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    if (gameMode === 'analysis' && gameState.gameStatus === 'playing') {
      timeoutId = setTimeout(runAnalysis, 500)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [gameState.board, runAnalysis])

  // Socket events
  useEffect(() => {
    if (!socket) return

    socket.on('game:state', (data: ChessGameState) => {
      setGameState(data)
    })

    socket.on('game:move', (data: { move: Move }) => {
      // Update move analytics
      const moveTime = Date.now() // In real implementation, track actual time
      setGameAnalytics(prev => ({
        ...prev,
        timeSpent: [...prev.timeSpent, moveTime],
        moveAccuracy: [...prev.moveAccuracy, calculateMoveAccuracy(data.move)]
      }))
    })

    return () => {
      socket.off('game:state')
      socket.off('game:move')
    }
  }, [socket])

  // Initialize game
  useEffect(() => {
    if (socket && session?.user) {
      socket.emit('game:join', { roomId, gameType: 'chess' })
    }
  }, [socket, session, roomId])

  const calculateMoveAccuracy = (move: Move): number => {
    // Simplified accuracy calculation
    return Math.random() * 100 // In real implementation, compare with engine
  }

  const getSquareColor = useCallback((rank: number, file: number): string => {
    const isLight = (rank + file) % 2 === 0
    const isSelected = selectedSquare?.rank === rank && selectedSquare?.file === file
    const isHighlighted = highlightedMoves.some(pos => pos.rank === rank && pos.file === file)
    const isLastMove = gameState.lastMove && (
      (gameState.lastMove.from.rank === rank && gameState.lastMove.from.file === file) ||
      (gameState.lastMove.to.rank === rank && gameState.lastMove.to.file === file)
    )

    if (isSelected) return 'bg-yellow-400'
    if (isHighlighted) return 'bg-green-400 opacity-70'
    if (isLastMove) return 'bg-blue-400 opacity-50'
    return isLight ? 'bg-amber-100' : 'bg-amber-800'
  }, [selectedSquare, highlightedMoves, gameState.lastMove])

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
              ♔ AI Chess Engine
            </h1>
            <div className="flex items-center gap-4 text-sm text-amber-700">
              <span>Mode: {gameMode.toUpperCase()}</span>
              {gameMode === 'ai' && <span>AI: {aiDifficulty}</span>}
              <Badge variant="outline" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                {gameState.spectators} Spectators
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            {gameMode === 'analysis' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onLeaveRoom}>
              Leave
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Game Info & Timer */}
          <div className="order-2 xl:order-1 space-y-4">
            <Card className="bg-white/50 backdrop-blur border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-amber-900">Game Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-amber-700">Current Turn:</span>
                  <Badge className={gameState.currentPlayer === 'white' ? 'bg-white text-black' : 'bg-black text-white'}>
                    {gameState.currentPlayer === 'white' ? '♔ White' : '♚ Black'}
                  </Badge>
                </div>

                {gameState.isCheck && (
                  <motion.div
                    className="bg-red-100 border border-red-300 rounded-lg p-2"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                  >
                    <div className="flex items-center gap-2 text-red-700">
                      <Trophy className="h-4 w-4" />
                      <span className="font-bold">CHECK!</span>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-amber-700">White:</span>
                    <span className="font-mono">
                      {Math.floor(gameState.timeControl.white / 1000 / 60)}:
                      {String(Math.floor((gameState.timeControl.white / 1000) % 60)).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Black:</span>
                    <span className="font-mono">
                      {Math.floor(gameState.timeControl.black / 1000 / 60)}:
                      {String(Math.floor((gameState.timeControl.black / 1000) % 60)).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {(gameMode === 'analysis' || aiAnalysis) && (
              <Card className="bg-blue-50/50 backdrop-blur border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis
                    {isAnalyzing && <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiAnalysis && (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-blue-700">Evaluation:</span>
                          <div className="font-bold text-blue-900">
                            {aiAnalysis.evaluation.total > 0 ? '+' : ''}{(aiAnalysis.evaluation.total / 100).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-700">Depth:</span>
                          <div className="font-bold text-blue-900">{aiAnalysis.depth}</div>
                        </div>
                        <div>
                          <span className="text-blue-700">Nodes:</span>
                          <div className="font-bold text-blue-900">{aiAnalysis.nodesSearched.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-blue-700">Time:</span>
                          <div className="font-bold text-blue-900">{aiAnalysis.timeSpent}ms</div>
                        </div>
                      </div>

                      {aiAnalysis.bestMove && (
                        <div>
                          <span className="text-blue-700 text-sm">Best Move:</span>
                          <div className="font-bold text-blue-900 text-lg">
                            {aiAnalysis.bestMove.notation}
                          </div>
                        </div>
                      )}

                      {aiAnalysis.threats.length > 0 && (
                        <div>
                          <span className="text-red-700 text-sm font-bold">Threats:</span>
                          <ul className="text-xs text-red-600 mt-1">
                            {aiAnalysis.threats.slice(0, 3).map((threat, i) => (
                              <li key={i}>• {threat}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.suggestions.length > 0 && (
                        <div>
                          <span className="text-green-700 text-sm font-bold">Suggestions:</span>
                          <ul className="text-xs text-green-600 mt-1">
                            {aiAnalysis.suggestions.slice(0, 3).map((suggestion, i) => (
                              <li key={i}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game Analytics */}
            <Card className="bg-purple-50/50 backdrop-blur border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-purple-700">Moves:</span>
                    <span className="font-bold ml-2">{gameState.moveHistory.length}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Phase:</span>
                    <span className="font-bold ml-2 capitalize">{gameAnalytics.gamePhase}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Accuracy:</span>
                    <span className="font-bold ml-2">
                      {gameAnalytics.moveAccuracy.length > 0
                        ? (gameAnalytics.moveAccuracy.reduce((a, b) => a + b, 0) / gameAnalytics.moveAccuracy.length).toFixed(1)
                        : '—'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-700">Blunders:</span>
                    <span className="font-bold ml-2 text-red-600">{gameAnalytics.blunders}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chess Board */}
          <div className="order-1 xl:order-2 col-span-1 xl:col-span-2">
            <Card className="bg-white/80 backdrop-blur border-amber-300 shadow-2xl">
              <CardContent className="p-6">
                <div className="bg-amber-900 p-4 rounded-lg shadow-inner">
                  <div className="grid grid-cols-8 gap-0 border-2 border-amber-800">
                    {gameState.board.map((row, rank) =>
                      row.map((piece, file) => (
                        <motion.div
                          key={`${rank}-${file}`}
                          className={`
                            aspect-square flex items-center justify-center cursor-pointer
                            text-4xl md:text-5xl lg:text-6xl font-bold select-none
                            hover:opacity-80 transition-all duration-200
                            ${getSquareColor(rank, file)}
                          `}
                          onClick={() => handleSquareClick(rank, file)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {piece && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              className="drop-shadow-md"
                            >
                              {getPieceSymbol(piece)}
                            </motion.span>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Board coordinates */}
                <div className="flex justify-between mt-2 px-4 text-amber-700 text-sm font-bold">
                  {'abcdefgh'.split('').map(file => (
                    <span key={file}>{file}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Move History & Controls */}
          <div className="order-3 space-y-4">
            <Card className="bg-white/50 backdrop-blur border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-amber-900">Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {gameState.moveHistory.length === 0 ? (
                      <p className="text-amber-600 text-sm">No moves yet</p>
                    ) : (
                      gameState.moveHistory.map((move, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-1 hover:bg-amber-100 rounded text-sm"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <span className="text-amber-700 font-bold w-6">
                            {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}
                          </span>
                          <span className="flex-1 font-mono">{move.notation}</span>
                          {move.check && <span className="text-red-600">✓</span>}
                          {move.checkmate && <span className="text-red-600">✓✓</span>}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Controls */}
            <Card className="bg-white/50 backdrop-blur border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-amber-900">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {gameMode === 'analysis' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Position'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowHints(!showHints)}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {showHints ? 'Hide' : 'Show'} Hints
                </Button>

                {gameState.gameStatus === 'finished' && (
                  <Button
                    className="w-full"
                    onClick={() => window.location.reload()}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    New Game
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Over Modal */}
        {gameState.gameStatus === 'finished' && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-white border-amber-300 w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-amber-900">
                  {gameState.winner === 'draw' ? '🤝 Draw!' :
                   gameState.winner === 'white' ? '♔ White Wins!' : '♚ Black Wins!'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-amber-700">Total Moves</div>
                    <div className="font-bold">{gameState.moveHistory.length}</div>
                  </div>
                  <div>
                    <div className="text-amber-700">Game Time</div>
                    <div className="font-bold">
                      {Math.floor((600000 - gameState.timeControl.white - gameState.timeControl.black) / 60000)}m
                    </div>
                  </div>
                  <div>
                    <div className="text-amber-700">Accuracy</div>
                    <div className="font-bold">
                      {gameAnalytics.moveAccuracy.length > 0
                        ? (gameAnalytics.moveAccuracy.reduce((a, b) => a + b, 0) / gameAnalytics.moveAccuracy.length).toFixed(1)
                        : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-amber-700">Best Move</div>
                    <div className="font-bold">{gameAnalytics.brilliantMoves} ✨</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" onClick={() => window.location.reload()}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                  <Button variant="outline" className="w-full" onClick={onLeaveRoom}>
                    Leave Room
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