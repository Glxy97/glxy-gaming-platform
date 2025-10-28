'use client'

/**
 * CONNECT4 2025 - The Ultimate Four-in-a-Row Experience
 *
 * Features:
 * - Modern Glassmorphism UI
 * - Smooth Column-Drop Animations (Framer Motion)
 * - Victory Celebration with Confetti
 * - Sound Integration
 * - Minimax AI (Easy/Medium/Hard)
 * - Multiplayer Ready
 * - 3D-Style Pieces with Glow Effects
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2, Play, RotateCcw, Trophy, Target, Users, Bot,
  Volume2, VolumeX, Crown, Zap, Star
} from 'lucide-react'
import { useGameAudio } from '@/lib/game-audio-system'
import { toast } from 'sonner'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type Player = 1 | 2
type CellState = Player | null
type GameMode = 'ai' | 'local' | 'online'
type Difficulty = 'easy' | 'medium' | 'hard'

const BOARD_ROWS = 6
const BOARD_COLS = 7
const CONNECT_COUNT = 4

const PLAYER_COLORS = {
  1: { primary: '#ff4444', glow: '#ff8888', name: 'Red' },
  2: { primary: '#ffff44', glow: '#ffff88', name: 'Yellow' }
}

interface GameState {
  board: CellState[][]
  currentPlayer: Player
  winner: Player | null
  isDraw: boolean
  isGameOver: boolean
  winningCells: [number, number][]
  score: { player1: number; player2: number }
}

interface ConfettiParticle {
  id: number
  x: number
  y: number
  color: string
  velocity: { x: number; y: number }
  rotation: number
  life: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Connect4_2025Props {
  roomId?: string
  gameMode?: GameMode
  botDifficulty?: Difficulty
  onLeaveRoom?: () => void
}

export function Connect4_2025({
  roomId,
  gameMode = 'ai',
  botDifficulty = 'medium',
  onLeaveRoom
}: Connect4_2025Props) {
  const { playSound, updateSettings } = useGameAudio()

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null)),
    currentPlayer: 1,
    winner: null,
    isDraw: false,
    isGameOver: false,
    winningCells: [],
    score: { player1: 0, player2: 0 }
  })

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([])
  const [dropAnimation, setDropAnimation] = useState<{ col: number; row: number } | null>(null)

  // Refs
  const animationFrame = useRef<number>()

  // ============================================================================
  // GAME LOGIC
  // ============================================================================

  // Check for winner
  const checkWinner = useCallback((board: CellState[][], row: number, col: number, player: Player): [number, number][] => {
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal \
      [1, -1]   // Diagonal /
    ]

    for (const direction of directions) {
      const [dRow, dCol] = direction
      if (dRow === undefined || dCol === undefined) continue
      
      const cells: [number, number][] = [[row, col]]

      // Check positive direction
      for (let i = 1; i < CONNECT_COUNT; i++) {
        const newRow = row + i * dRow
        const newCol = col + i * dCol
        if (
          newRow >= 0 && newRow < BOARD_ROWS &&
          newCol >= 0 && newCol < BOARD_COLS &&
          board[newRow][newCol] === player
        ) {
          cells.push([newRow, newCol])
        } else break
      }

      // Check negative direction
      for (let i = 1; i < CONNECT_COUNT; i++) {
        const newRow = row - i * dRow
        const newCol = col - i * dCol
        if (
          newRow >= 0 && newRow < BOARD_ROWS &&
          newCol >= 0 && newCol < BOARD_COLS &&
          board[newRow][newCol] === player
        ) {
          cells.push([newRow, newCol])
        } else break
      }

      if (cells.length >= CONNECT_COUNT) {
        return cells
      }
    }

    return []
  }, [])

  // Check if board is full
  const isBoardFull = useCallback((board: CellState[][]): boolean => {
    return board[0].every(cell => cell !== null)
  }, [])

  // Drop piece in column
  const dropPiece = useCallback((col: number, player: Player): boolean => {
    const newBoard = gameState.board.map(row => [...row])

    // Check if column is full
    if (newBoard[0][col] !== null) return false

    // Find lowest empty row
    let row = -1
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (!newBoard[r][col]) {
        row = r
        break
      }
    }

    if (row === -1) return false // Column full

    // Animate drop
    setDropAnimation({ col, row })
    playSound('piece_drop')

    // Place piece after animation
    setTimeout(() => {
      newBoard[row][col] = player

      // Check for winner
      const winningCells = checkWinner(newBoard, row, col, player)
      const isDraw = winningCells.length === 0 && isBoardFull(newBoard)

      if (winningCells.length > 0) {
        // Victory!
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          winner: player,
          isGameOver: true,
          winningCells,
          score: {
            ...prev.score,
            [`player${player}`]: prev.score[`player${player}` as keyof typeof prev.score] + 1
          }
        }))

        playSound('victory')
        createConfetti(col)
        toast.success(`${PLAYER_COLORS[player].name} Wins!`, {
          description: `${winningCells.length} in a row! 🎉`
        })

      } else if (isDraw) {
        // Draw
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          isDraw: true,
          isGameOver: true
        }))

        playSound('draw')
        toast.info("It's a Draw!", {
          description: "Board is full! 🤝"
        })

      } else {
        // Next turn
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          currentPlayer: prev.currentPlayer === 1 ? 2 : 1
        }))

        playSound('piece_place')
      }

      setDropAnimation(null)
    }, 500)

    return true
  }, [gameState.board, checkWinner, isBoardFull, playSound])

  // AI Move (Minimax Algorithm)
  const getAIMove = useCallback((board: CellState[][], difficulty: Difficulty): number => {
    const availableCols = Array.from({ length: BOARD_COLS }, (_, i) => i)
      .filter(col => board[0][col] === null)

    if (availableCols.length === 0) return -1

    // Easy: Random move
    if (difficulty === 'easy') {
      return availableCols[Math.floor(Math.random() * availableCols.length)]
    }

    // Medium/Hard: Minimax with depth limit
    const depth = difficulty === 'medium' ? 4 : 6

    let bestScore = -Infinity
    let bestCol = availableCols[0]

    for (const col of availableCols) {
      const newBoard = board.map(row => [...row])
      let row = -1
      for (let r = BOARD_ROWS - 1; r >= 0; r--) {
        if (!newBoard[r][col]) {
          row = r
          break
        }
      }

      if (row === -1) continue

      newBoard[row][col] = 2 // AI is player 2
      const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false)

      if (score > bestScore) {
        bestScore = score
        bestCol = col
      }
    }

    return bestCol
  }, [])

  // Minimax algorithm with alpha-beta pruning
  const minimax = (board: CellState[][], depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    // Check terminal states
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (board[row][col]) {
          const winning = checkWinner(board, row, col, board[row][col]!)
          if (winning.length > 0) {
            return board[row][col] === 2 ? 1000 - depth : -1000 + depth
          }
        }
      }
    }

    if (isBoardFull(board) || depth === 0) {
      return 0
    }

    const availableCols = Array.from({ length: BOARD_COLS }, (_, i) => i)
      .filter(col => board[0][col] === null)

    if (isMaximizing) {
      let maxEval = -Infinity
      for (const col of availableCols) {
        const newBoard = board.map(row => [...row])
        let row = -1
        for (let r = BOARD_ROWS - 1; r >= 0; r--) {
          if (!newBoard[r][col]) {
            row = r
            break
          }
        }
        if (row === -1) continue

        newBoard[row][col] = 2
        const eval_ = minimax(newBoard, depth - 1, alpha, beta, false)
        maxEval = Math.max(maxEval, eval_)
        alpha = Math.max(alpha, eval_)
        if (beta <= alpha) break
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const col of availableCols) {
        const newBoard = board.map(row => [...row])
        let row = -1
        for (let r = BOARD_ROWS - 1; r >= 0; r--) {
          if (!newBoard[r][col]) {
            row = r
            break
          }
        }
        if (row === -1) continue

        newBoard[row][col] = 1
        const eval_ = minimax(newBoard, depth - 1, alpha, beta, true)
        minEval = Math.min(minEval, eval_)
        beta = Math.min(beta, eval_)
        if (beta <= alpha) break
      }
      return minEval
    }
  }

  // Handle column click
  const handleColumnClick = (col: number) => {
    if (gameState.isGameOver || dropAnimation || isThinking) return

    const success = dropPiece(col, gameState.currentPlayer)
    if (!success) {
      toast.error('Column is full!')
      return
    }
  }

  // AI Turn
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (gameMode === 'ai' &&
        gameState.currentPlayer === 2 &&
        !gameState.isGameOver &&
        !dropAnimation &&
        !isThinking) {

      setIsThinking(true)

      timer = setTimeout(() => {
        const col = getAIMove(gameState.board, botDifficulty)
        if (col !== -1) {
          const success = dropPiece(col, 2)
          if (!success) {
            // If the AI can't make a valid move, switch back to player
            setGameState(prev => ({
              ...prev,
              currentPlayer: 1
            }))
          }
        } else {
          // No valid moves available, switch back to player
          setGameState(prev => ({
            ...prev,
            currentPlayer: 1
          }))
        }
        setIsThinking(false)
      }, 800)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
        setIsThinking(false)
      }
    }
  }, [gameState.currentPlayer, gameState.isGameOver, gameMode, isThinking, dropAnimation, botDifficulty, getAIMove])

  // ============================================================================
  // CONFETTI SYSTEM
  // ============================================================================

  const createConfetti = (col: number) => {
    const newConfetti: ConfettiParticle[] = []
    const centerX = col * 100 + 50

    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: Math.random(),
        x: centerX + (Math.random() - 0.5) * 100,
        y: 300,
        color: ['#ff4444', '#ffff44', '#44ff44', '#4444ff', '#ff44ff', '#44ffff'][Math.floor(Math.random() * 6)],
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: -Math.random() * 15 - 5
        },
        rotation: Math.random() * 360,
        life: 1
      })
    }

    setConfetti(newConfetti)
  }

  // Animate confetti
  useEffect(() => {
    if (confetti.length === 0) return

    const animate = () => {
      setConfetti(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocity.x,
          y: particle.y + particle.velocity.y,
          velocity: {
            x: particle.velocity.x * 0.98,
            y: particle.velocity.y + 0.5 // Gravity
          },
          rotation: particle.rotation + 5,
          life: particle.life - 0.01
        }))
        .filter(particle => particle.life > 0)
      )

      animationFrame.current = requestAnimationFrame(animate)
    }

    animationFrame.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [confetti.length])

  // ============================================================================
  // GAME CONTROLS
  // ============================================================================

  const startNewGame = () => {
    setGameState({
      board: Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null)),
      currentPlayer: 1,
      winner: null,
      isDraw: false,
      isGameOver: false,
      winningCells: [],
      score: gameState.score
    })
    setConfetti([])
    playSound('game_start')
  }

  const resetScore = () => {
    setGameState(prev => ({
      ...prev,
      score: { player1: 0, player2: 0 }
    }))
    toast.success('Score reset!')
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-yellow-900 to-orange-900 p-4">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            🔴 CONNECT 4 - 2025 🟡
          </h1>
          <p className="text-gray-200">Four in a Row - Modern Edition</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Score */}
          <Card className="bg-black/40 backdrop-blur-xl border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-red-300">
                <Trophy className="h-4 w-4" />
                SCOREBOARD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                  <span className="text-red-300 font-semibold">Red</span>
                </div>
                <Badge className="bg-red-500/30 border-red-400 text-white">
                  {gameState.score.player1}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50" />
                  <span className="text-yellow-300 font-semibold">
                    {gameMode === 'ai' ? 'AI' : 'Yellow'}
                  </span>
                </div>
                <Badge className="bg-yellow-500/30 border-yellow-400 text-white">
                  {gameState.score.player2}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={resetScore}
                className="w-full border-orange-500 text-orange-300 hover:bg-orange-500/10"
              >
                Reset Score
              </Button>
            </CardContent>
          </Card>

          {/* Center: Game Board */}
          <div className="space-y-4">

            {/* Current Turn */}
            <Card className="bg-black/60 backdrop-blur-xl border-2 border-yellow-500/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full shadow-xl animate-pulse"
                    style={{
                      backgroundColor: PLAYER_COLORS[gameState.currentPlayer].primary,
                      boxShadow: `0 0 20px ${PLAYER_COLORS[gameState.currentPlayer].glow}`
                    }}
                  />
                  <span className="text-white font-bold">
                    {gameState.isGameOver
                      ? gameState.winner
                        ? `${PLAYER_COLORS[gameState.winner].name} Wins!`
                        : "It's a Draw!"
                      : isThinking
                        ? 'AI is thinking...'
                        : `${PLAYER_COLORS[gameState.currentPlayer].name}'s Turn`
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Game Board */}
            <Card className="bg-blue-900/60 backdrop-blur-xl border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20">
              <CardContent className="p-6">
                <div className="relative">
                  {/* Board Grid */}
                  <div className="grid gap-2">
                    {Array.from({ length: BOARD_ROWS }).map((_, row) => (
                      <div key={row} className="grid grid-cols-7 gap-2">
                        {Array.from({ length: BOARD_COLS }).map((_, col) => {
                          const cell = gameState.board[row][col]
                          const isWinning = gameState.winningCells.some(([r, c]) => r === row && c === col)

                          return (
                            <motion.div
                              key={`${row}-${col}`}
                              className="relative w-16 h-16 bg-blue-800/60 rounded-lg border-2 border-blue-700/50 cursor-pointer hover:bg-blue-700/40 transition-all"
                              onMouseEnter={() => !gameState.isGameOver && setHoveredColumn(col)}
                              onMouseLeave={() => setHoveredColumn(null)}
                              onClick={() => handleColumnClick(col)}
                              whileHover={{ scale: hoveredColumn === col && row === 0 ? 1.1 : 1 }}
                            >
                              {/* Cell Piece */}
                              <AnimatePresence>
                                {cell && (
                                  <motion.div
                                    initial={{ scale: 0, y: -200 }}
                                    animate={{
                                      scale: isWinning ? [1, 1.2, 1] : 1,
                                      y: 0
                                    }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 200,
                                      damping: 15,
                                      repeat: isWinning ? Infinity : 0,
                                      repeatDelay: 0.5
                                    }}
                                    className="absolute inset-1 rounded-full shadow-2xl"
                                    style={{
                                      backgroundColor: PLAYER_COLORS[cell].primary,
                                      boxShadow: `0 0 ${isWinning ? 30 : 15}px ${PLAYER_COLORS[cell].glow}, inset 0 0 15px rgba(255,255,255,0.3)`
                                    }}
                                  />
                                )}
                              </AnimatePresence>

                              {/* Hover Preview */}
                              {hoveredColumn === col && row === 0 && !gameState.isGameOver && !cell && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 0.5 }}
                                  className="absolute inset-1 rounded-full"
                                  style={{
                                    backgroundColor: PLAYER_COLORS[gameState.currentPlayer].primary
                                  }}
                                />
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Confetti */}
                  {confetti.map(particle => (
                    <div
                      key={particle.id}
                      className="absolute w-2 h-2 rounded-sm pointer-events-none"
                      style={{
                        left: particle.x,
                        top: particle.y,
                        backgroundColor: particle.color,
                        transform: `rotate(${particle.rotation}deg)`,
                        opacity: particle.life,
                        boxShadow: `0 0 10px ${particle.color}`
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={startNewGame}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Play className="mr-2 h-4 w-4" />
                New Game
              </Button>
            </div>

          </div>

          {/* Right: Info */}
          <Card className="bg-black/40 backdrop-blur-xl border-yellow-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-yellow-300">
                <Target className="h-4 w-4" />
                HOW TO PLAY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <div>
                <div className="font-semibold text-yellow-400 mb-1">🎯 Goal</div>
                <p>Connect 4 pieces of your color in a row - horizontally, vertically, or diagonally!</p>
              </div>

              <div>
                <div className="font-semibold text-red-400 mb-1">🎮 Controls</div>
                <p>Click on any column to drop your piece. It will fall to the lowest available spot.</p>
              </div>

              <div>
                <div className="font-semibold text-orange-400 mb-1">🤖 AI Difficulty</div>
                <Badge variant="outline" className="mr-1 border-green-500 text-green-300">Easy</Badge>
                <Badge variant="outline" className="mr-1 border-yellow-500 text-yellow-300">Medium</Badge>
                <Badge variant="outline" className="border-red-500 text-red-300">Hard</Badge>
              </div>

              <div>
                <div className="font-semibold text-purple-400 mb-1">✨ Features</div>
                <ul className="space-y-1 text-xs">
                  <li>• Smooth drop animations</li>
                  <li>• Victory celebrations</li>
                  <li>• Sound effects</li>
                  <li>• Score tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}
