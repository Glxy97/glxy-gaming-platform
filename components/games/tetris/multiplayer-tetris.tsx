// @ts-nocheck
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { CyberpunkBackground } from '@/components/ui/cyberpunk-background'
import { useSocket } from '@/lib/socket-client'
import {
  Gamepad2,
  Play,
  Pause,
  RotateCw,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Users,
  Trophy,
  Clock,
  Target
} from 'lucide-react'

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
type CellType = TetrominoType | null

interface Tetromino {
  type: TetrominoType
  shape: boolean[][]
  x: number
  y: number
  color: string
}

interface GameStats {
  score: number
  level: number
  lines: number
  time: number
}

interface MultiplayerGameState {
  players: {
    [playerId: string]: {
      id: string
      username: string
      board: CellType[][]
      currentPiece: Tetromino | null
      nextPiece: TetrominoType | null
      stats: GameStats
      isAlive: boolean
      isReady: boolean
    }
  }
  gameStatus: 'waiting' | 'starting' | 'playing' | 'finished'
  winner: string | null
  roomId: string
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_DROP_TIME = 1000

const TETROMINO_SHAPES: Record<TetrominoType, boolean[][]> = {
  I: [[true, true, true, true]],
  O: [[true, true], [true, true]],
  T: [[false, true, false], [true, true, true]],
  S: [[false, true, true], [true, true, false]],
  Z: [[true, true, false], [false, true, true]],
  J: [[true, false, false], [true, true, true]],
  L: [[false, false, true], [true, true, true]]
}

const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00ffff',
  O: '#ffff00',
  T: '#800080',
  S: '#00ff00',
  Z: '#ff0000',
  J: '#0000ff',
  L: '#ffa500'
}

interface MultiplayerTetrisProps {
  roomId: string
  onLeaveRoom: () => void
}

export default function MultiplayerTetris({ roomId, onLeaveRoom }: MultiplayerTetrisProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()

  // Local game state
  const [board, setBoard] = useState<CellType[][]>(() =>
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  )
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null)
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null)
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    level: 1,
    lines: 0,
    time: 0
  })

  // Multiplayer state
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerGameState>({
    players: {},
    gameStatus: 'waiting',
    winner: null,
    roomId
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [dropTime, setDropTime] = useState(INITIAL_DROP_TIME)
  const [isReady, setIsReady] = useState(false)

  const gameLoopRef = useRef<NodeJS.Timeout>()
  const gameTimeRef = useRef<NodeJS.Timeout>()

  const getRandomTetromino = useCallback((): TetrominoType => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    return types[Math.floor(Math.random() * types.length)]
  }, [])

  const createTetromino = useCallback((type: TetrominoType): Tetromino => {
    return {
      type,
      shape: TETROMINO_SHAPES[type],
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINO_SHAPES[type][0].length / 2),
      y: 0,
      color: TETROMINO_COLORS[type]
    }
  }, [])

  const rotatePiece = useCallback((piece: Tetromino): Tetromino => {
    const rotatedShape = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    )
    return { ...piece, shape: rotatedShape }
  }, [])

  const isValidPosition = useCallback((piece: Tetromino, newX: number, newY: number, newShape?: boolean[][]): boolean => {
    const shape = newShape || piece.shape

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = newX + x
          const boardY = newY + y

          if (
            boardX < 0 ||
            boardX >= BOARD_WIDTH ||
            boardY >= BOARD_HEIGHT ||
            (boardY >= 0 && board[boardY][boardX])
          ) {
            return false
          }
        }
      }
    }
    return true
  }, [board])

  const placePiece = useCallback((piece: Tetromino): CellType[][] => {
    const newBoard = board.map(row => [...row])

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x
          const boardY = piece.y + y
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.type
          }
        }
      }
    }
    return newBoard
  }, [board])

  const clearLines = useCallback((newBoard: CellType[][]): { board: CellType[][], linesCleared: number } => {
    const fullLines: number[] = []

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        fullLines.push(y)
      }
    }

    if (fullLines.length === 0) {
      return { board: newBoard, linesCleared: 0 }
    }

    const clearedBoard = newBoard.filter((_, index) => !fullLines.includes(index))
    const emptyLines = Array(fullLines.length).fill(null).map(() => Array(BOARD_WIDTH).fill(null))

    return {
      board: [...emptyLines, ...clearedBoard],
      linesCleared: fullLines.length
    }
  }, [])

  const updateScore = useCallback((linesCleared: number) => {
    if (linesCleared === 0) return

    const linePoints = [0, 40, 100, 300, 1200]
    const points = linePoints[linesCleared] * gameStats.level

    setGameStats(prev => {
      const newLines = prev.lines + linesCleared
      const newLevel = Math.floor(newLines / 10) + 1
      const newScore = prev.score + points

      setDropTime(Math.max(50, INITIAL_DROP_TIME - (newLevel - 1) * 100))

      return {
        ...prev,
        score: newScore,
        level: newLevel,
        lines: newLines
      }
    })
  }, [gameStats.level])

  const dropPiece = useCallback(() => {
    if (!currentPiece || isPaused || !isPlaying) return

    if (isValidPosition(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(prev => prev ? { ...prev, y: prev.y + 1 } : null)
    } else {
      // Piece landed
      const newBoard = placePiece(currentPiece)
      const { board: clearedBoard, linesCleared } = clearLines(newBoard)

      setBoard(clearedBoard)
      updateScore(linesCleared)

      // Send game state to other players
      if (socket && session?.user?.id) {
        socket.emit('game:move', {
          roomId,
          move: {
            type: 'piece_placed',
            board: clearedBoard,
            linesCleared,
            stats: {
              ...gameStats,
              lines: gameStats.lines + linesCleared
            }
          }
        })
      }

      // Spawn next piece
      if (nextPiece) {
        const newPiece = createTetromino(nextPiece)
        if (isValidPosition(newPiece, newPiece.x, newPiece.y)) {
          setCurrentPiece(newPiece)
          setNextPiece(getRandomTetromino())
        } else {
          // Game over for this player
          setIsPlaying(false)
          if (socket) {
            socket.emit('game:move', {
              roomId,
              move: {
                type: 'game_over',
                playerId: session?.user?.id
              }
            })
          }
        }
      }
    }
  }, [currentPiece, isPaused, isPlaying, isValidPosition, placePiece, clearLines, updateScore, nextPiece, createTetromino, getRandomTetromino, socket, roomId, session?.user?.id, gameStats])

  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || isPaused || !isPlaying) return

    let newX = currentPiece.x
    let newY = currentPiece.y

    switch (direction) {
      case 'left':
        newX -= 1
        break
      case 'right':
        newX += 1
        break
      case 'down':
        newY += 1
        break
    }

    if (isValidPosition(currentPiece, newX, newY)) {
      setCurrentPiece(prev => prev ? { ...prev, x: newX, y: newY } : null)
    } else if (direction === 'down') {
      dropPiece()
    }
  }, [currentPiece, isPaused, isPlaying, isValidPosition, dropPiece])

  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || isPaused || !isPlaying) return

    const rotated = rotatePiece(currentPiece)
    if (isValidPosition(currentPiece, currentPiece.x, currentPiece.y, rotated.shape)) {
      setCurrentPiece(rotated)
    }
  }, [currentPiece, isPaused, isPlaying, rotatePiece, isValidPosition])

  const toggleReady = useCallback(() => {
    if (!socket || !session?.user?.id) return

    const newReadyState = !isReady
    setIsReady(newReadyState)

    socket.emit('game:move', {
      roomId,
      move: {
        type: 'player_ready',
        playerId: session.user.id,
        isReady: newReadyState
      }
    })
  }, [socket, session?.user?.id, isReady, roomId])

  const startGame = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)))
    setGameStats({ score: 0, level: 1, lines: 0, time: 0 })
    setIsPlaying(true)
    setIsPaused(false)
    setDropTime(INITIAL_DROP_TIME)

    const firstPiece = getRandomTetromino()
    setCurrentPiece(createTetromino(firstPiece))
    setNextPiece(getRandomTetromino())
  }, [getRandomTetromino, createTetromino])

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleGameState = (data: any) => {
      if (data.roomId === roomId) {
        setMultiplayerState(prev => ({
          ...prev,
          ...data
        }))
      }
    }

    const handleGameMove = (data: any) => {
      if (data.roomId === roomId && data.move) {
        const { move } = data

        if (move.type === 'game_start') {
          startGame()
        } else if (move.type === 'player_ready') {
          setMultiplayerState(prev => ({
            ...prev,
            players: {
              ...prev.players,
              [move.playerId]: {
                ...prev.players[move.playerId],
                isReady: move.isReady
              }
            }
          }))
        }
      }
    }

    socket.on('game:state_update', handleGameState)
    socket.on('game:move', handleGameMove)

    // Join the game room
    socket.emit('game:join', { roomId, gameType: 'tetris' })

    return () => {
      socket.off('game:state_update', handleGameState)
      socket.off('game:move', handleGameMove)
    }
  }, [socket, isConnected, roomId, startGame])

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused) {
      gameLoopRef.current = setInterval(dropPiece, dropTime)
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current)
        }
      }
    }
    return undefined
  }, [isPlaying, isPaused, dropTime, dropPiece])

  // Game timer
  useEffect(() => {
    if (isPlaying && !isPaused) {
      gameTimeRef.current = setInterval(() => {
        setGameStats(prev => ({ ...prev, time: prev.time + 1 }))
      }, 1000)
      return () => {
        if (gameTimeRef.current) {
          clearInterval(gameTimeRef.current)
        }
      }
    }
    return undefined
  }, [isPlaying, isPaused])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isPlaying || isPaused) return

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault()
          movePiece('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault()
          movePiece('right')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault()
          movePiece('down')
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          event.preventDefault()
          rotatePieceHandler()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isPaused, movePiece, rotatePieceHandler])

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])

    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardX = currentPiece.x + x
            const boardY = currentPiece.y + y
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className="w-5 h-5 border border-gray-700"
            style={{
              backgroundColor: cell ? TETROMINO_COLORS[cell] : 'transparent',
              boxShadow: cell ? 'inset 0 0 0 1px rgba(255,255,255,0.3)' : 'none'
            }}
          />
        ))}
      </div>
    ))
  }

  const renderOpponentBoard = (playerId: string, playerData: any) => {
    if (!playerData?.board) return null

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-sm font-medium text-white">{playerData.username}</span>
          <Badge variant="outline" className="text-xs">
            {playerData.stats?.score || 0}
          </Badge>
        </div>
        <div className="bg-black/80 p-2 rounded border border-gray-700">
          {playerData.board.map((row: CellType[], y: number) => (
            <div key={y} className="flex">
              {row.map((cell: CellType, x: number) => (
                <div
                  key={`${x}-${y}`}
                  className="w-2 h-2 border border-gray-800"
                  style={{
                    backgroundColor: cell ? TETROMINO_COLORS[cell] : 'transparent'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const otherPlayers = Object.entries(multiplayerState.players).filter(
    ([playerId]) => playerId !== session?.user?.id
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <CyberpunkBackground intensity={0.3} />

      <div className="relative z-10 container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="w-8 h-8 text-purple-400" />
            MULTIPLAYER TETRIS
          </h1>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-blue-600">
              <Users className="w-4 h-4 mr-1" />
              {Object.keys(multiplayerState.players).length} Spieler
            </Badge>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Verbunden' : 'Getrennt'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
          {/* Main Game Board */}
          <div className="flex-1">
            <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  {/* Game Status */}
                  {multiplayerState.gameStatus === 'waiting' && (
                    <div className="mb-4 text-center">
                      <p className="text-white mb-2">Warten auf Spieler...</p>
                      <Button
                        onClick={toggleReady}
                        className={isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
                      >
                        {isReady ? 'Bereit!' : 'Bereit werden'}
                      </Button>
                    </div>
                  )}

                  <div className="bg-black/80 p-4 rounded-lg border border-gray-700">
                    {renderBoard()}
                  </div>

                  {/* Game Controls */}
                  <div className="mt-4 flex gap-2">
                    <Button onClick={onLeaveRoom} variant="outline" className="bg-red-600/20 border-red-400 text-red-200">
                      Raum verlassen
                    </Button>
                  </div>

                  {/* Mobile Controls */}
                  <div className="mt-4 lg:hidden">
                    <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
                      <div></div>
                      <Button
                        variant="outline"
                        size="sm"
                        onTouchStart={() => rotatePieceHandler()}
                        className="bg-purple-600/20 border-purple-400 text-purple-200"
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                      <div></div>

                      <Button
                        variant="outline"
                        size="sm"
                        onTouchStart={() => movePiece('left')}
                        className="bg-blue-600/20 border-blue-400 text-blue-200"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onTouchStart={() => movePiece('down')}
                        className="bg-red-600/20 border-red-400 text-red-200"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onTouchStart={() => movePiece('right')}
                        className="bg-blue-600/20 border-blue-400 text-blue-200"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-80 space-y-4">
            {/* My Stats */}
            <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Meine Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Punkte</span>
                    <span className="text-yellow-400 font-bold">{gameStats.score.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Level</span>
                    <Badge variant="outline" className="border-purple-400 text-purple-300">
                      {gameStats.level}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Linien</span>
                    <span className="text-green-400 font-bold">{gameStats.lines}</span>
                  </div>
                  <Progress
                    value={(gameStats.lines % 10) * 10}
                    className="h-2 bg-gray-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Zeit</span>
                    <span className="text-blue-400 font-mono">{formatTime(gameStats.time)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opponent Boards */}
            {otherPlayers.length > 0 && (
              <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gegner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {otherPlayers.map(([playerId, playerData]) =>
                    renderOpponentBoard(playerId, playerData)
                  )}
                </CardContent>
              </Card>
            )}

            {/* Controls Help */}
            <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-purple-400">Steuerung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-gray-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Bewegen:</span>
                    <span className="text-blue-400">← → ↓ oder A D S</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drehen:</span>
                    <span className="text-purple-400">↑ oder W oder Leertaste</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Over Modal */}
        {multiplayerState.gameStatus === 'finished' && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="bg-gray-900 border-purple-500 max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-center">
                  {multiplayerState.winner === session?.user?.id ? (
                    <span className="text-green-400">Du hast gewonnen!</span>
                  ) : (
                    <span className="text-red-400">Spiel beendet</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-white">Endpunktestand: <span className="text-yellow-400 font-bold">{gameStats.score.toLocaleString()}</span></p>
                  <p className="text-white">Erreichte Stufe: <span className="text-purple-400 font-bold">{gameStats.level}</span></p>
                  <p className="text-white">Linien gelöscht: <span className="text-green-400 font-bold">{gameStats.lines}</span></p>
                </div>
                <Button onClick={onLeaveRoom} className="bg-blue-600 hover:bg-blue-700">
                  Zum Hauptmenü
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}