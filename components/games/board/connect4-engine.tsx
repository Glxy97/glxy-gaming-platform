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
  Bot
} from 'lucide-react'
import { useSocket } from '@/components/providers/socket-provider'
import { toast } from 'sonner'

type Player = 1 | 2
type CellState = Player | null
type GameMode = 'ai' | 'local' | 'online'
type Difficulty = 'easy' | 'medium' | 'hard'

interface GameState {
  board: CellState[][]
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
  avgMovesPerGame: number
  bestTime: number | null
}

interface Connect4EngineProps {
  roomId?: string
  gameMode?: GameMode
  botDifficulty?: Difficulty
  onLeaveRoom?: () => void
}

const BOARD_ROWS = 6
const BOARD_COLS = 7
const CONNECT_COUNT = 4

const PLAYER_COLORS = {
  1: '#ff4444', // Red
  2: '#ffff44'  // Yellow
}

const PLAYER_NAMES = {
  1: 'Red',
  2: 'Yellow'
}

export function Connect4Engine({
  roomId,
  gameMode = 'ai',
  botDifficulty = 'medium',
  onLeaveRoom
}: Connect4EngineProps) {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null)),
    currentPlayer: 1,
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
    avgMovesPerGame: 0,
    bestTime: null
  })

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const gameStartedRef = useRef(false)
  const socket = useSocket()
  const [onlineState, setOnlineState] = useState<any | null>(null)

  // Initialize new game
  const initializeGame = useCallback(() => {
    setGameState({
      board: Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null)),
      currentPlayer: 1,
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
  const checkWinner = useCallback((board: CellState[][], row: number, col: number, player: Player): boolean => {
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal /
      [1, -1]   // Diagonal \
    ]

    for (const [dRow, dCol] of directions) {
      let count = 1 // Count the current piece

      // Check in positive direction
      for (let i = 1; i < CONNECT_COUNT; i++) {
        const newRow = row + i * dRow
        const newCol = col + i * dCol
        if (
          newRow >= 0 && newRow < BOARD_ROWS &&
          newCol >= 0 && newCol < BOARD_COLS &&
          board[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }

      // Check in negative direction
      for (let i = 1; i < CONNECT_COUNT; i++) {
        const newRow = row - i * dRow
        const newCol = col - i * dCol
        if (
          newRow >= 0 && newRow < BOARD_ROWS &&
          newCol >= 0 && newCol < BOARD_COLS &&
          board[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }

      if (count >= CONNECT_COUNT) {
        return true
      }
    }

    return false
  }, [])

  // Check if board is full (draw)
  const isBoardFull = useCallback((board: CellState[][]): boolean => {
    return board[0].every(cell => cell !== null)
  }, [])

  // Get valid columns for moves
  const getValidColumns = useCallback((board: CellState[][]): number[] => {
    return Array.from({ length: BOARD_COLS }, (_, i) => i)
      .filter(col => board[0][col] === null)
  }, [])

  // Drop piece in column
  const dropPiece = useCallback((board: CellState[][], col: number, player: Player): { newBoard: CellState[][], row: number } | null => {
    if (board[0][col] !== null) return null

    const newBoard = board.map(row => [...row])
    let dropRow = -1

    // Find the lowest empty row in the column
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = player
        dropRow = row
        break
      }
    }

    return dropRow !== -1 ? { newBoard, row: dropRow } : null
  }, [])

  // AI Move calculation
  const evaluateBoard = useCallback((board: CellState[][], player: Player): number => {
    let score = 0
    const opponent = player === 1 ? 2 : 1

    // Check all possible 4-in-a-row positions
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        for (const [dRow, dCol] of directions) {
          const window: CellState[] = []
          let valid = true

          for (let i = 0; i < CONNECT_COUNT; i++) {
            const r = row + i * dRow
            const c = col + i * dCol
            if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
              window.push(board[r][c])
            } else {
              valid = false
              break
            }
          }

          if (valid) {
            const playerCount = window.filter(cell => cell === player).length
            const opponentCount = window.filter(cell => cell === opponent).length
            const emptyCount = window.filter(cell => cell === null).length

            if (opponentCount === 0) {
              if (playerCount === 4) score += 1000
              else if (playerCount === 3 && emptyCount === 1) score += 100
              else if (playerCount === 2 && emptyCount === 2) score += 10
              else if (playerCount === 1 && emptyCount === 3) score += 1
            } else if (playerCount === 0) {
              if (opponentCount === 3 && emptyCount === 1) score -= 80
              else if (opponentCount === 2 && emptyCount === 2) score -= 8
            }
          }
        }
      }
    }

    return score
  }, [])

  const minimax = useCallback((board: CellState[][], depth: number, alpha: number, beta: number, isMaximizing: boolean, player: Player): number => {
    const opponent = player === 1 ? 2 : 1
    const validCols = getValidColumns(board)

    // Check terminal states
    if (depth === 0 || validCols.length === 0) {
      return evaluateBoard(board, player)
    }

    // Check for immediate wins/losses
    for (const col of validCols) {
      const result = dropPiece(board, col, isMaximizing ? player : opponent)
      if (result) {
        if (checkWinner(result.newBoard, result.row, col, isMaximizing ? player : opponent)) {
          return isMaximizing ? 1000 - depth : -1000 + depth
        }
      }
    }

    if (isMaximizing) {
      let maxEval = -Infinity
      for (const col of validCols) {
        const result = dropPiece(board, col, player)
        if (result) {
          const eval_score = minimax(result.newBoard, depth - 1, alpha, beta, false, player)
          maxEval = Math.max(maxEval, eval_score)
          alpha = Math.max(alpha, eval_score)
          if (beta <= alpha) break
        }
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const col of validCols) {
        const result = dropPiece(board, col, opponent)
        if (result) {
          const eval_score = minimax(result.newBoard, depth - 1, alpha, beta, true, player)
          minEval = Math.min(minEval, eval_score)
          beta = Math.min(beta, eval_score)
          if (beta <= alpha) break
        }
      }
      return minEval
    }
  }, [getValidColumns, dropPiece, checkWinner, evaluateBoard])

  const getAIMove = useCallback((board: CellState[][], player: Player): number => {
    const validCols = getValidColumns(board)
    if (validCols.length === 0) return -1

    const depthMap = {
      easy: 2,
      medium: 4,
      hard: 6
    }

    const depth = depthMap[botDifficulty]
    let bestCol = validCols[0]
    let bestScore = -Infinity

    // Check for immediate winning move
    for (const col of validCols) {
      const result = dropPiece(board, col, player)
      if (result && checkWinner(result.newBoard, result.row, col, player)) {
        return col
      }
    }

    // Check for blocking opponent's winning move
    const opponent = player === 1 ? 2 : 1
    for (const col of validCols) {
      const result = dropPiece(board, col, opponent)
      if (result && checkWinner(result.newBoard, result.row, col, opponent)) {
        return col
      }
    }

    // Use minimax for best move
    for (const col of validCols) {
      const result = dropPiece(board, col, player)
      if (result) {
        const score = minimax(result.newBoard, depth - 1, -Infinity, Infinity, false, player)
        if (score > bestScore) {
          bestScore = score
          bestCol = col
        }
      }
    }

    return bestCol
  }, [getValidColumns, dropPiece, checkWinner, minimax, botDifficulty])

  // Handle human move
  const makeMove = useCallback((col: number) => {
    if (gameState.isGameOver || isThinking) return

    // Online mode: send move to server
    if (gameMode === 'online' && socket && roomId) {
      // TODO: Implement // socket.emit functionality
      // // socket.emit('game:move', { roomId, move: { type: 'drop', column: col } })
      console.warn('Online mode not fully implemented')
      return
    }

    const result = dropPiece(gameState.board, col, gameState.currentPlayer)
    if (!result) return

    const { newBoard, row } = result
    const isWinner = checkWinner(newBoard, row, col, gameState.currentPlayer)
    const isDraw = !isWinner && isBoardFull(newBoard)
    const isGameOver = isWinner || isDraw

    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
      winner: isWinner ? gameState.currentPlayer : null,
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
  }, [gameState, isThinking, dropPiece, checkWinner, isBoardFull, gameMode, socket, roomId])

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
      } else if (finalGameState.winner === 1) {
        if (gameMode === 'ai') {
          newWins++ // Human player is always player 1 in AI mode
        } else {
          newWins++ // Player 1 wins in local mode
        }
      } else {
        if (gameMode === 'ai') {
          newLosses++ // AI wins
        } else {
          newLosses++ // Player 2 wins in local mode
        }
      }

      const newBestTime = prev.bestTime
        ? (finalGameState.winner === 1 ? Math.min(prev.bestTime, gameTime) : prev.bestTime)
        : (finalGameState.winner === 1 ? gameTime : null)

      return {
        wins: newWins,
        losses: newLosses,
        draws: newDraws,
        totalGames: newTotalGames,
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
      gameState.currentPlayer === 2 &&
      !gameState.isGameOver &&
      gameStartedRef.current
    ) {
      setIsThinking(true)

      aiMoveTimeout = setTimeout(() => {
        const aiCol = getAIMove(gameState.board, 2)
        if (aiCol !== -1) {
          makeMove(aiCol)
        }
        setIsThinking(false)
      }, botDifficulty === 'easy' ? 500 : botDifficulty === 'medium' ? 1000 : 1500)
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

    // socket.emit('game:join', { roomId, gameType: 'connect4' })

    const onState = (s: any) => {
      setOnlineState(s)
      if (s.board) {
        setGameState(prev => ({
          ...prev,
          board: s.board,
          currentPlayer: s.currentPlayer || 1,
          winner: s.winner || null,
          isGameOver: s.isGameOver || false,
          isDraw: s.isDraw || false
        }))
      }
    }

    const onError = (e: any) => toast.error(e?.message || 'Connect4 Error')

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
      <div className="bg-blue-800 p-4 rounded-lg border-4 border-blue-600 shadow-lg">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: BOARD_COLS }, (_, col) => (
            <div key={col} className="flex flex-col gap-2">
              {/* Column header for move preview */}
              <div
                className="h-12 w-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-200/20 transition-colors"
                onMouseEnter={() => setHoveredColumn(col)}
                onMouseLeave={() => setHoveredColumn(null)}
                onClick={() => makeMove(col)}
              >
                {hoveredColumn === col && !gameState.isGameOver && !isThinking && gameState.board[0][col] === null && (
                  <motion.div
                    className="w-10 h-10 rounded-full border-2"
                    style={{
                      backgroundColor: PLAYER_COLORS[gameState.currentPlayer],
                      opacity: 0.7
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  />
                )}
              </div>

              {/* Column cells */}
              {Array.from({ length: BOARD_ROWS }, (_, row) => (
                <motion.div
                  key={`${row}-${col}`}
                  className="w-12 h-12 bg-blue-900 rounded-full border-2 border-blue-700 flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-colors"
                  onClick={() => makeMove(col)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {gameState.board[row][col] && (
                    <motion.div
                      className="w-10 h-10 rounded-full border-2 border-white/30 shadow-lg"
                      style={{ backgroundColor: PLAYER_COLORS[gameState.board[row][col]!] }}
                      initial={{ scale: 0, y: -50 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <CyberpunkBackground intensity={0.3} />

      <div className="relative z-10 container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="w-8 h-8 text-blue-400" />
            GLXY CONNECT 4
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

        <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
          {/* Game Board */}
          <div className="flex-1">
            <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  {/* Current Player Indicator */}
                  {gameStartedRef.current && !gameState.isGameOver && (
                    <motion.div
                      className="flex items-center gap-3 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white/30"
                          style={{ backgroundColor: PLAYER_COLORS[gameState.currentPlayer] }}
                        />
                        <span className="text-white font-semibold">
                          {gameMode === 'ai'
                            ? (gameState.currentPlayer === 1 ? 'Your Turn' : `AI is thinking...`)
                            : gameMode === 'online'
                            ? `Player ${gameState.currentPlayer}'s Turn`
                            : `${PLAYER_NAMES[gameState.currentPlayer]}'s Turn`
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
              <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
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
                        <span className="text-green-400">
                          {Math.round((gameStats.wins / gameStats.totalGames) * 100)}%
                        </span>
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
              <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
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
                    <Badge variant="outline" className="border-blue-400 text-blue-300">
                      {gameMode === 'ai' ? `AI (${botDifficulty})` :
                       gameMode === 'online' ? 'Online' : 'Local 2P'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How to Play */}
            <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-blue-400">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-300 space-y-2">
                <p>• Click any column to drop your piece</p>
                <p>• Connect 4 pieces in a row to win</p>
                <p>• Connections can be horizontal, vertical, or diagonal</p>
                <p>• Block your opponent while building your own connections</p>
                <p>• The game ends when someone gets 4 in a row or the board is full</p>
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
              <Card className="bg-gray-900 border-blue-500 max-w-md mx-4">
                <CardHeader>
                  <CardTitle className="text-center">
                    {gameState.isDraw ? (
                      <span className="text-yellow-400">It's a Draw!</span>
                    ) : (
                      <span className={gameState.winner === 1 ? 'text-red-400' : 'text-yellow-400'}>
                        {gameMode === 'ai'
                          ? (gameState.winner === 1 ? 'You Win!' : 'AI Wins!')
                          : `${PLAYER_NAMES[gameState.winner!]} Wins!`
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