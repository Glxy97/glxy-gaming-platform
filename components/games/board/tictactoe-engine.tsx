// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { CyberpunkBackground } from '@/components/ui/cyberpunk-background'
import {
  Gamepad2,
  Play,
  RotateCcw,
  Trophy,
  Target,
  Clock,
  User,
  Bot,
  Users
} from 'lucide-react'
import { useSocket } from '@/components/providers/socket-provider'
import { toast } from 'sonner'

type Player = 'X' | 'O'
type CellState = Player | null
type GameMode = 'ai' | 'local' | 'online'
type Difficulty = 'easy' | 'medium' | 'hard'

interface GameState {
  board: CellState[]
  currentPlayer: Player
  winner: Player | null
  isDraw: boolean
  isGameOver: boolean
  moves: number
  startTime: number
  endTime: number | null
}

interface GameStats {
  wins: number
  losses: number
  draws: number
  totalGames: number
  winRate: number
  avgMovesPerGame: number
  bestTime: number | null
}

interface TicTacToeEngineProps {
  roomId?: string
  gameMode?: GameMode
  botDifficulty?: Difficulty
  onLeaveRoom?: () => void
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
]

export function TicTacToeEngine({
  roomId,
  gameMode = 'ai',
  botDifficulty = 'medium',
  onLeaveRoom
}: TicTacToeEngineProps) {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    isDraw: false,
    isGameOver: false,
    moves: 0,
    startTime: 0,
    endTime: null
  })

  const [isThinking, setIsThinking] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    winRate: 0,
    avgMovesPerGame: 0,
    bestTime: null
  })

  const gameStartedRef = useRef(false)
  const socket = useSocket()
  const [onlineState, setOnlineState] = useState<any | null>(null)

  // Initialize new game
  const initializeGame = useCallback(() => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      isDraw: false,
      isGameOver: false,
      moves: 0,
      startTime: Date.now(),
      endTime: null
    })
    gameStartedRef.current = true
    setIsThinking(false)
  }, [])

  // Check for winner
  const checkWinner = useCallback((board: CellState[]): Player | null => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }, [])

  // Check if board is full (draw)
  const isBoardFull = useCallback((board: CellState[]): boolean => {
    return board.every(cell => cell !== null)
  }, [])

  // Get available moves
  const getAvailableMoves = useCallback((board: CellState[]): number[] => {
    return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1)
  }, [])

  // Minimax algorithm for AI
  const minimax = useCallback((board: CellState[], depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity): number => {
    const winner = checkWinner(board)

    if (winner === 'O') return 10 - depth // AI wins
    if (winner === 'X') return depth - 10 // Human wins
    if (isBoardFull(board)) return 0 // Draw

    const availableMoves = getAvailableMoves(board)

    if (isMaximizing) {
      let maxEval = -Infinity
      for (const move of availableMoves) {
        board[move] = 'O'
        const eval_score = minimax(board, depth + 1, false, alpha, beta)
        board[move] = null
        maxEval = Math.max(maxEval, eval_score)
        alpha = Math.max(alpha, eval_score)
        if (beta <= alpha) break // Alpha-beta pruning
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const move of availableMoves) {
        board[move] = 'X'
        const eval_score = minimax(board, depth + 1, true, alpha, beta)
        board[move] = null
        minEval = Math.min(minEval, eval_score)
        beta = Math.min(beta, eval_score)
        if (beta <= alpha) break // Alpha-beta pruning
      }
      return minEval
    }
  }, [checkWinner, isBoardFull, getAvailableMoves])

  // Get AI move
  const getAIMove = useCallback((board: CellState[]): number => {
    const availableMoves = getAvailableMoves(board)
    if (availableMoves.length === 0) return -1

    // Different difficulty levels
    if (botDifficulty === 'easy') {
      // 70% random, 30% optimal
      if (Math.random() < 0.7) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
      }
    } else if (botDifficulty === 'medium') {
      // 50% random, 50% optimal
      if (Math.random() < 0.5) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
      }
    }

    // Hard difficulty or fallback: use minimax
    let bestScore = -Infinity
    let bestMove = availableMoves[0]

    for (const move of availableMoves) {
      board[move] = 'O'
      const score = minimax(board, 0, false)
      board[move] = null

      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }, [getAvailableMoves, botDifficulty, minimax])

  // Handle human move
  const makeMove = useCallback((index: number) => {
    if (gameState.board[index] !== null || gameState.isGameOver || isThinking) return

    // Online mode: send move to server
    if (gameMode === 'online' && socket && roomId) {
      // socket.emit('game:move', { roomId, move: { type: 'place', position: index } })
      return
    }

    const newBoard = [...gameState.board]
    newBoard[index] = gameState.currentPlayer

    const winner = checkWinner(newBoard)
    const isDraw = !winner && isBoardFull(newBoard)
    const isGameOver = winner !== null || isDraw

    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      isDraw,
      isGameOver,
      moves: gameState.moves + 1,
      endTime: isGameOver ? Date.now() : null
    }

    setGameState(newGameState)

    // Update stats if game ended
    if (isGameOver) {
      gameStartedRef.current = false
      updateGameStats(newGameState)
    }
  }, [gameState, isThinking, checkWinner, isBoardFull, gameMode, socket, roomId])

  // Update game statistics
  const updateGameStats = useCallback((finalGameState: GameState) => {
    setGameStats(prev => {
      const newTotalGames = prev.totalGames + 1
      const gameTime = finalGameState.endTime! - finalGameState.startTime

      let newWins = prev.wins
      let newLosses = prev.losses
      let newDraws = prev.draws

      if (finalGameState.isDraw) {
        newDraws++
      } else if (finalGameState.winner === 'X') {
        if (gameMode === 'ai') {
          newWins++ // Human player is always X in AI mode
        } else {
          newWins++ // Player X wins in local mode
        }
      } else {
        if (gameMode === 'ai') {
          newLosses++ // AI wins
        } else {
          newLosses++ // Player O wins in local mode
        }
      }

      const newWinRate = newTotalGames > 0 ? Math.round((newWins / newTotalGames) * 100) : 0
      const newBestTime = prev.bestTime
        ? (finalGameState.winner === 'X' ? Math.min(prev.bestTime, gameTime) : prev.bestTime)
        : (finalGameState.winner === 'X' ? gameTime : null)

      return {
        wins: newWins,
        losses: newLosses,
        draws: newDraws,
        totalGames: newTotalGames,
        winRate: newWinRate,
        avgMovesPerGame: Math.round(((prev.avgMovesPerGame * prev.totalGames) + finalGameState.moves) / newTotalGames),
        bestTime: newBestTime
      }
    })
  }, [gameMode])

  // AI move effect
  useEffect(() => {
    let aiMoveTimeout: NodeJS.Timeout | null = null

    if (
      gameMode === 'ai' &&
      gameState.currentPlayer === 'O' &&
      !gameState.isGameOver &&
      gameStartedRef.current
    ) {
      setIsThinking(true)

      aiMoveTimeout = setTimeout(() => {
        const aiMove = getAIMove([...gameState.board])
        if (aiMove !== -1) {
          makeMove(aiMove)
        }
        setIsThinking(false)
      }, botDifficulty === 'easy' ? 300 : botDifficulty === 'medium' ? 600 : 1000)
    }

    return () => {
      if (aiMoveTimeout) {
        clearTimeout(aiMoveTimeout)
      }
    }
  }, [gameState.currentPlayer, gameState.isGameOver, gameMode, botDifficulty, getAIMove, makeMove, gameState.board])

  // Online mode socket effects
  useEffect(() => {
    if (gameMode !== 'online' || !roomId || !socket) return

    // socket.emit('game:join', { roomId, gameType: 'tictactoe' })

    const onState = (s: any) => {
      setOnlineState(s)
      if (s.board) {
        setGameState(prev => ({
          ...prev,
          board: s.board,
          currentPlayer: s.currentPlayer || 'X',
          winner: s.winner || null,
          isGameOver: s.isGameOver || false,
          isDraw: s.isDraw || false
        }))
      }
    }

    const onError = (e: any) => toast.error(e?.message || 'Tic-Tac-Toe Error')

    // socket.on('game:state', onState)
    // socket.on('error', onError)

    return () => {
      // socket.off('game:state', onState)
      // socket.off('error', onError)
    }
  }, [gameMode, roomId, socket])

  const onlineStart = () => {
    if (!socket || !roomId) return
    // socket.emit('game:start', { roomId })
    gameStartedRef.current = true
  }

  // Render game board
  const renderBoard = () => {
    return (
      <div className="grid grid-cols-3 gap-3 w-80 h-80 mx-auto">
        {gameState.board.map((cell, index) => (
          <motion.button
            key={index}
            onClick={() => makeMove(index)}
            disabled={cell !== null || gameState.isGameOver || isThinking}
            className="w-24 h-24 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center text-5xl font-bold transition-all hover:bg-gray-700 hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            whileHover={{ scale: cell === null && !gameState.isGameOver && !isThinking ? 1.05 : 1 }}
            whileTap={{ scale: cell === null && !gameState.isGameOver && !isThinking ? 0.95 : 1 }}
          >
            {cell && (
              <motion.span
                className={cell === 'X' ? 'text-blue-400' : 'text-red-400'}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {cell}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    )
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <CyberpunkBackground intensity={0.3} />

      <div className="relative z-10 container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="w-8 h-8 text-indigo-400" />
            GLXY TIC TAC TOE
          </h1>
          <p className="text-gray-300">
            {gameMode === 'ai' && `Playing against AI (${botDifficulty})`}
            {gameMode === 'local' && 'Local 2-Player Mode'}
            {gameMode === 'online' && 'Online Multiplayer Mode'}
          </p>
        </div>

        {/* Online Mode Controls */}
        {gameMode === 'online' && (
          <Card className="mb-6 bg-black/50 border-green-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400 text-sm">Online Mode</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={socket?.isConnected ? 'default' : 'secondary'}>
                  {socket?.isConnected ? 'Connected' : 'Offline'}
                </Badge>
                <span className="text-white">Room: {roomId || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onlineStart} disabled={!roomId || !socket?.isConnected}>
                  Start Online Game
                </Button>
              </div>
              {onlineState && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Current Player: {onlineState.currentPlayer} • Players: {onlineState.players?.length || 0}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto">
          {/* Game Board */}
          <div className="flex-1">
            <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-6">
                  {/* Current Player Indicator */}
                  {gameStartedRef.current && !gameState.isGameOver && (
                    <motion.div
                      className="flex items-center gap-3 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-2">
                        <motion.span
                          className={`text-3xl font-bold ${gameState.currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'}`}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          {gameState.currentPlayer}
                        </motion.span>
                        <span className="text-white font-semibold">
                          {gameMode === 'ai'
                            ? (gameState.currentPlayer === 'X' ? 'Your Turn' : 'AI is thinking...')
                            : gameMode === 'online'
                            ? `Player ${gameState.currentPlayer}'s Turn`
                            : `Player ${gameState.currentPlayer} is up`
                          }
                        </span>
                        {isThinking && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Game Board */}
                  {renderBoard()}

                  {/* Game Controls */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={gameMode === 'online' ? onlineStart : initializeGame}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {gameStartedRef.current ? 'New Game' : 'Start Game'}
                    </Button>

                    {gameStartedRef.current && gameMode !== 'online' && (
                      <Button
                        onClick={initializeGame}
                        variant="outline"
                        className="border-orange-500 text-orange-400 hover:bg-orange-500/20"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    )}

                    {onLeaveRoom && (
                      <Button
                        onClick={onLeaveRoom}
                        variant="outline"
                        className="border-gray-500 text-gray-400 hover:bg-gray-500/20"
                      >
                        Leave Game
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-80 space-y-4">
            {/* Game Stats */}
            {gameMode !== 'online' && (
              <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-indigo-400 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Game Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{gameStats.wins}</div>
                      <div className="text-sm text-gray-400">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{gameStats.losses}</div>
                      <div className="text-sm text-gray-400">Losses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{gameStats.draws}</div>
                      <div className="text-sm text-gray-400">Draws</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{gameStats.totalGames}</div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                  </div>

                  {gameStats.totalGames > 0 && (
                    <div className="pt-3 border-t border-gray-700 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Win Rate:</span>
                        <span className="text-green-400">{gameStats.winRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Avg Moves:</span>
                        <span className="text-blue-400">{gameStats.avgMovesPerGame}</span>
                      </div>
                      {gameStats.bestTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Best Time:</span>
                          <span className="text-purple-400">{formatTime(gameStats.bestTime)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Current Game Info */}
            {gameStartedRef.current && (
              <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-indigo-400 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Current Game
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Moves:</span>
                    <span className="text-white">{gameState.moves}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(
                        (gameState.endTime || Date.now()) - gameState.startTime
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Mode:</span>
                    <Badge variant="outline" className="border-indigo-400 text-indigo-300">
                      {gameMode === 'ai' ? `AI (${botDifficulty})` :
                       gameMode === 'online' ? 'Online' : 'Local 2P'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How to Play */}
            <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-indigo-400">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-300 space-y-2">
                <p>• Click on an empty square to place your symbol</p>
                <p>• Connect 3 symbols in a row to win</p>
                <p>• Connections can be horizontal, vertical, or diagonal</p>
                <p>• Block your opponent while building your own connections</p>
                <p>• The game ends with a win or draw</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Over Modal */}
        {gameState.isGameOver && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-gray-900 border-indigo-500 max-w-md mx-4">
                <CardHeader>
                  <CardTitle className="text-center">
                    {gameState.isDraw ? (
                      <span className="text-yellow-400">It's a Draw!</span>
                    ) : (
                      <span className={gameState.winner === 'X' ? 'text-blue-400' : 'text-red-400'}>
                        {gameMode === 'ai'
                          ? (gameState.winner === 'X' ? 'You Win!' : 'AI Wins!')
                          : `Player ${gameState.winner} Wins!`
                        }
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="space-y-2">
                    <p className="text-white">
                      Game completed in <span className="text-blue-400 font-bold">{gameState.moves}</span> moves
                    </p>
                    <p className="text-white">
                      Time: <span className="text-purple-400 font-mono">
                        {formatTime(gameState.endTime! - gameState.startTime)}
                      </span>
                    </p>
                  </div>
                  <Button
                    onClick={gameMode === 'online' ? onlineStart : initializeGame}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Play Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}