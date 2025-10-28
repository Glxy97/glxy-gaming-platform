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
  Gamepad2, Play, Pause, RotateCw, ArrowDown, ArrowLeft, ArrowRight,
  Users, Trophy, Clock, Target, Zap, Flame, Star, Crown, Award,
  Volume2, VolumeX, Settings, Maximize, Minimize
} from 'lucide-react'

// Enhanced types with modern gaming features
type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
type CellType = TetrominoType | 'ghost' | 'spark' | null
type PowerUpType = 'line_clear' | 'freeze_enemy' | 'speed_boost' | 'double_score'
type ParticleType = 'explosion' | 'sparkle' | 'line_clear' | 'combo'

interface Particle {
  id: string
  x: number
  y: number
  type: ParticleType
  color: string
  life: number
  velocity: { x: number; y: number }
  scale: number
}

interface PowerUp {
  type: PowerUpType
  icon: string
  color: string
  duration?: number
  description: string
}

interface EnhancedTetromino {
  type: TetrominoType
  shape: boolean[][]
  x: number
  y: number
  color: string
  shadowY: number // Ghost piece position
  rotation: number
}

interface ComboSystem {
  count: number
  multiplier: number
  timer: number
  active: boolean
}

interface GameStats {
  score: number
  level: number
  lines: number
  time: number
  pps: number // Pieces per second
  apm: number // Actions per minute
  efficiency: number // % perfect drops
  combos: number
  maxCombo: number
  totalPieces: number
  perfectClears: number
}

interface EnhancedGameState {
  players: {
    [playerId: string]: {
      id: string
      username: string
      board: CellType[][]
      currentPiece: EnhancedTetromino | null
      nextPieces: TetrominoType[] // Multiple next pieces
      heldPiece: TetrominoType | null
      canHold: boolean
      stats: GameStats
      isAlive: boolean
      isReady: boolean
      powerUps: PowerUp[]
      combo: ComboSystem
      attacks: number // Garbage lines to send
      avatar: string | null
      streak: number
      rank: number
    }
  }
  gameStatus: 'waiting' | 'starting' | 'playing' | 'paused' | 'finished'
  winner: string | null
  roomId: string
  gameMode: 'classic' | 'modern' | 'battle' | 'ultra' | 'zen'
  timeLeft: number
  spectators: number
}

// Enhanced constants
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const VISIBLE_HEIGHT = 20
const BUFFER_HEIGHT = 4 // Hidden rows at top

const LEVEL_SPEEDS = [
  1000, 793, 618, 473, 355, 262, 190, 135, 94, 64,
  43, 28, 18, 11, 7, 4, 2, 1, 1, 1
]

const NEXT_PIECES_COUNT = 5
const COMBO_THRESHOLD = 4

// Modern Tetromino system (7-bag randomizer)
class TetrominoBag {
  private bag: TetrominoType[] = []
  private currentIndex = 0

  constructor() {
    this.refillBag()
  }

  private refillBag() {
    const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    // Fisher-Yates shuffle
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pieces[i], pieces[j]] = [pieces[j], pieces[i]]
    }
    this.bag = pieces
    this.currentIndex = 0
  }

  next(): TetrominoType {
    if (this.currentIndex >= this.bag.length) {
      this.refillBag()
    }
    return this.bag[this.currentIndex++]
  }

  peek(count: number = 1): TetrominoType[] {
    const result: TetrominoType[] = []
    let tempIndex = this.currentIndex
    let tempBag = [...this.bag]

    for (let i = 0; i < count; i++) {
      if (tempIndex >= tempBag.length) {
        const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
        for (let j = pieces.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1))
          ;[pieces[j], pieces[k]] = [pieces[k], pieces[j]]
        }
        tempBag = pieces
        tempIndex = 0
      }
      result.push(tempBag[tempIndex++])
    }
    return result
  }
}

// Enhanced TETROMINO_SHAPES with rotation system
const TETROMINO_SHAPES: Record<TetrominoType, boolean[][][]> = {
  I: [
    [[false, false, false, false], [true, true, true, true], [false, false, false, false], [false, false, false, false]],
    [[false, false, true, false], [false, false, true, false], [false, false, true, false], [false, false, true, false]],
    [[false, false, false, false], [false, false, false, false], [true, true, true, true], [false, false, false, false]],
    [[false, true, false, false], [false, true, false, false], [false, true, false, false], [false, true, false, false]]
  ],
  O: [
    [[true, true], [true, true]],
    [[true, true], [true, true]],
    [[true, true], [true, true]],
    [[true, true], [true, true]]
  ],
  T: [
    [[false, true, false], [true, true, true], [false, false, false]],
    [[false, true, false], [false, true, true], [false, true, false]],
    [[false, false, false], [true, true, true], [false, true, false]],
    [[false, true, false], [true, true, false], [false, true, false]]
  ],
  S: [
    [[false, true, true], [true, true, false], [false, false, false]],
    [[false, true, false], [false, true, true], [false, false, true]],
    [[false, false, false], [false, true, true], [true, true, false]],
    [[true, false, false], [true, true, false], [false, true, false]]
  ],
  Z: [
    [[true, true, false], [false, true, true], [false, false, false]],
    [[false, false, true], [false, true, true], [false, true, false]],
    [[false, false, false], [true, true, false], [false, true, true]],
    [[false, true, false], [true, true, false], [true, false, false]]
  ],
  J: [
    [[true, false, false], [true, true, true], [false, false, false]],
    [[false, true, true], [false, true, false], [false, true, false]],
    [[false, false, false], [true, true, true], [false, false, true]],
    [[false, true, false], [false, true, false], [true, true, false]]
  ],
  L: [
    [[false, false, true], [true, true, true], [false, false, false]],
    [[false, true, false], [false, true, false], [false, true, true]],
    [[false, false, false], [true, true, true], [true, false, false]],
    [[true, true, false], [false, true, false], [false, true, false]]
  ]
}

const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00ffff', // Cyan
  O: '#ffff00', // Yellow
  T: '#a000ff', // Purple
  S: '#00ff00', // Green
  Z: '#ff0000', // Red
  J: '#0066ff', // Blue
  L: '#ff6600', // Orange
}

const POWER_UPS: Record<PowerUpType, PowerUp> = {
  line_clear: {
    type: 'line_clear',
    icon: '💥',
    color: '#ff4444',
    description: 'Clear random lines from enemies'
  },
  freeze_enemy: {
    type: 'freeze_enemy',
    icon: '❄️',
    color: '#44aaff',
    duration: 5000,
    description: 'Freeze enemy for 5 seconds'
  },
  speed_boost: {
    type: 'speed_boost',
    icon: '⚡',
    color: '#ffff44',
    duration: 10000,
    description: 'Double speed for 10 seconds'
  },
  double_score: {
    type: 'double_score',
    icon: '💎',
    color: '#ff44ff',
    duration: 15000,
    description: 'Double score for 15 seconds'
  }
}

interface EnhancedTetrisEngineProps {
  roomId: string
  gameMode: 'classic' | 'modern' | 'battle' | 'ultra' | 'zen'
  onLeaveRoom: () => void
}

export function EnhancedTetrisEngine({
  roomId,
  gameMode = 'modern',
  onLeaveRoom
}: EnhancedTetrisEngineProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()

  // Game state
  const [gameState, setGameState] = useState<EnhancedGameState>({
    players: {},
    gameStatus: 'waiting',
    winner: null,
    roomId,
    gameMode,
    timeLeft: gameMode === 'ultra' ? 120000 : -1, // 2 minutes for ultra
    spectators: 0
  })

  // Local player state
  const [localPlayer, setLocalPlayer] = useState<string>('')
  const [isSpectating, setIsSpectating] = useState(false)

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(true)

  // UI state
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  // Game mechanics
  const tetrominoBag = useRef(new TetrominoBag())
  const gameLoop = useRef<NodeJS.Timeout>()
  const inputBuffer = useRef<string[]>([])
  const lastInputTime = useRef(0)

  // Performance optimization with useMemo
  const boardRenderer = useMemo(() => {
    const player = gameState.players[localPlayer]
    if (!player) return null

    return renderBoard(player.board, player.currentPiece)
  }, [gameState.players, localPlayer])

  // Enhanced game engine functions
  const createTetromino = useCallback((type: TetrominoType): EnhancedTetromino => {
    const shape = TETROMINO_SHAPES[type][0]
    const tetromino: EnhancedTetromino = {
      type,
      shape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
      color: TETROMINO_COLORS[type],
      shadowY: 0,
      rotation: 0
    }

    // Calculate shadow position
    tetromino.shadowY = calculateShadowPosition(player.board, tetromino)
    return tetromino
  }, [])

  const calculateShadowPosition = useCallback((board: CellType[][], piece: EnhancedTetromino): number => {
    let shadowY = piece.y
    while (isValidPosition(board, { ...piece, y: shadowY + 1 })) {
      shadowY++
    }
    return shadowY
  }, [])

  const isValidPosition = useCallback((board: CellType[][], piece: EnhancedTetromino): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x
          const boardY = piece.y + y

          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false
          }

          if (boardY >= 0 && board[boardY][boardX] && board[boardY][boardX] !== 'ghost') {
            return false
          }
        }
      }
    }
    return true
  }, [])

  const rotatePiece = useCallback((piece: EnhancedTetromino, direction: 1 | -1): EnhancedTetromino | null => {
    const newRotation = (piece.rotation + direction + 4) % 4
    const newShape = TETROMINO_SHAPES[piece.type][newRotation]
    const rotatedPiece = { ...piece, shape: newShape, rotation: newRotation }

    // Super Rotation System (SRS) - try different offsets
    const offsets = getSRSOffsets(piece.type, piece.rotation, newRotation)

    for (const [dx, dy] of offsets) {
      const testPiece = { ...rotatedPiece, x: piece.x + dx, y: piece.y + dy }
      if (isValidPosition(gameState.players[localPlayer].board, testPiece)) {
        return { ...testPiece, shadowY: calculateShadowPosition(gameState.players[localPlayer].board, testPiece) }
      }
    }

    return null // Rotation failed
  }, [gameState.players, localPlayer])

  const getSRSOffsets = useCallback((type: TetrominoType, from: number, to: number): [number, number][] => {
    // Simplified SRS offsets - in production, this would be more comprehensive
    return [
      [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1]
    ]
  }, [])

  const clearLines = useCallback((board: CellType[][]): { newBoard: CellType[][]; linesCleared: number; clearedRows: number[] } => {
    const clearedRows: number[] = []
    const newBoard = board.filter((row, index) => {
      const isFull = row.every(cell => cell !== null && cell !== 'ghost')
      if (isFull) {
        clearedRows.push(index)
      }
      return !isFull
    })

    // Add empty rows at top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null))
    }

    return { newBoard, linesCleared: clearedRows.length, clearedRows }
  }, [])

  const calculateScore = useCallback((linesCleared: number, level: number, combo: number, spin: boolean = false): number => {
    const baseScores = [0, 100, 300, 500, 800] // Single, Double, Triple, Tetris
    let score = (baseScores[linesCleared] || 0) * (level + 1)

    if (spin && linesCleared > 0) {
      score *= 1.5 // T-spin bonus
    }

    if (combo > 0) {
      score += combo * 50
    }

    return Math.floor(score)
  }, [])

  const addParticles = useCallback((x: number, y: number, type: ParticleType, count: number = 5) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `${Date.now()}-${i}`,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        type,
        color: ['#ff4444', '#44ff44', '#4444ff', '#ffff44'][Math.floor(Math.random() * 4)],
        life: 1,
        velocity: {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200 - 100
        },
        scale: 0.5 + Math.random() * 0.5
      })
    }

    setParticles(prev => [...prev, ...newParticles])
  }, [])

  // Enhanced input handling with buffering
  const handleInput = useCallback((action: string) => {
    const now = Date.now()

    // Input buffering for responsive controls
    inputBuffer.current.push(action)
    if (inputBuffer.current.length > 10) {
      inputBuffer.current.shift()
    }

    const player = gameState.players[localPlayer]
    if (!player || !player.currentPiece) return

    let newPiece = { ...player.currentPiece }
    let moved = false

    switch (action) {
      case 'move-left':
        newPiece.x -= 1
        if (isValidPosition(player.board, newPiece)) {
          moved = true
        }
        break
      case 'move-right':
        newPiece.x += 1
        if (isValidPosition(player.board, newPiece)) {
          moved = true
        }
        break
      case 'soft-drop':
        newPiece.y += 1
        if (isValidPosition(player.board, newPiece)) {
          moved = true
        }
        break
      case 'hard-drop':
        newPiece.y = newPiece.shadowY
        moved = true
        // Lock piece immediately
        setTimeout(() => handleInput('lock'), 0)
        break
      case 'rotate-cw':
        const rotatedCW = rotatePiece(newPiece, 1)
        if (rotatedCW) {
          newPiece = rotatedCW
          moved = true
        }
        break
      case 'rotate-ccw':
        const rotatedCCW = rotatePiece(newPiece, -1)
        if (rotatedCCW) {
          newPiece = rotatedCCW
          moved = true
        }
        break
      case 'hold':
        if (player.canHold) {
          socket?.emit('game:move', {
            roomId,
            move: { type: 'hold' }
          })
        }
        return
    }

    if (moved) {
      newPiece.shadowY = calculateShadowPosition(player.board, newPiece)

      socket?.emit('game:move', {
        roomId,
        move: {
          type: 'piece-update',
          piece: newPiece,
          action
        }
      })
    }

    lastInputTime.current = now
  }, [gameState.players, localPlayer, socket, roomId])

  // Keyboard controls with modern input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStatus !== 'playing') return

      const keyMap: Record<string, string> = {
        'ArrowLeft': 'move-left',
        'ArrowRight': 'move-right',
        'ArrowDown': 'soft-drop',
        'ArrowUp': 'rotate-cw',
        ' ': 'hard-drop',
        'Space': 'hard-drop',
        'KeyZ': 'rotate-ccw',
        'KeyX': 'rotate-cw',
        'KeyC': 'hold',
        'Shift': 'hold',
        'Control': 'hold'
      }

      const action = keyMap[e.code] || keyMap[e.key]
      if (action) {
        e.preventDefault()
        handleInput(action)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleInput, gameState.gameStatus])

  // Particle system animation
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.velocity.x * 0.016,
        y: particle.y + particle.velocity.y * 0.016,
        life: particle.life - 0.02,
        velocity: {
          x: particle.velocity.x * 0.98,
          y: particle.velocity.y + 9.81 * 0.016 // Gravity
        }
      })).filter(particle => particle.life > 0))
    }

    const interval = setInterval(animateParticles, 16)
    return () => clearInterval(interval)
  }, [])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    socket.on('game:state', (data: EnhancedGameState) => {
      setGameState(data)
    })

    socket.on('game:line-clear', (data: { playerId: string; lines: number; position: { x: number; y: number } }) => {
      if (data.playerId === localPlayer) {
        addParticles(data.position.x, data.position.y, 'line_clear', data.lines * 3)
      }
    })

    socket.on('game:combo', (data: { playerId: string; combo: number; position: { x: number; y: number } }) => {
      if (data.playerId === localPlayer && data.combo >= COMBO_THRESHOLD) {
        addParticles(data.position.x, data.position.y, 'combo', data.combo)
      }
    })

    return () => {
      socket.off('game:state')
      socket.off('game:line-clear')
      socket.off('game:combo')
    }
  }, [socket, localPlayer])

  // Join room on component mount
  useEffect(() => {
    if (socket && session?.user) {
      setLocalPlayer(session.user.id!)
      socket.emit('game:join', { roomId, gameType: 'tetris' })
    }
  }, [socket, session, roomId])

  // Board rendering with enhanced graphics
  const renderBoard = useCallback((board: CellType[][], currentPiece: EnhancedTetromino | null) => {
    const displayBoard = board.map(row => [...row])

    // Render ghost piece
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardX = currentPiece.x + x
            const boardY = currentPiece.shadowY + y
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              if (!displayBoard[boardY][boardX]) {
                displayBoard[boardY][boardX] = 'ghost'
              }
            }
          }
        }
      }

      // Render current piece
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
          <motion.div
            key={`${x}-${y}`}
            className={`
              w-6 h-6 border border-gray-600
              ${getCellClass(cell)}
              ${cell === 'ghost' ? 'opacity-30' : ''}
            `}
            style={{
              backgroundColor: cell && cell !== 'ghost' ? TETROMINO_COLORS[cell as TetrominoType] : 'transparent'
            }}
            initial={cell ? { scale: 0.8, opacity: 0 } : false}
            animate={cell ? { scale: 1, opacity: cell === 'ghost' ? 0.3 : 1 } : false}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>
    ))
  }, [])

  const getCellClass = useCallback((cell: CellType): string => {
    if (!cell) return 'bg-gray-900'
    if (cell === 'ghost') return 'bg-white'
    if (cell === 'spark') return 'bg-yellow-400 animate-pulse'
    return 'bg-opacity-90 shadow-md'
  }, [])

  const renderNextPieces = useCallback((nextPieces: TetrominoType[]) => {
    return nextPieces.slice(0, NEXT_PIECES_COUNT).map((type, index) => (
      <motion.div
        key={index}
        className="mb-2"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1 }}
      >
        <div className="grid gap-px bg-gray-700 p-1 rounded">
          {TETROMINO_SHAPES[type][0].map((row, y) => (
            <div key={y} className="flex gap-px">
              {row.map((cell, x) => (
                <div
                  key={x}
                  className={`w-3 h-3 ${cell ? 'opacity-80' : 'bg-transparent'}`}
                  style={{
                    backgroundColor: cell ? TETROMINO_COLORS[type] : 'transparent'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    ))
  }, [])

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to play Tetris</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const player = gameState.players[localPlayer]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      {/* Particle System */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <AnimatePresence>
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: particle.color,
                left: particle.x,
                top: particle.y
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: particle.scale,
                opacity: particle.life,
                x: particle.velocity.x,
                y: particle.velocity.y
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🧩 Enhanced Tetris Engine
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>Mode: {gameMode.toUpperCase()}</span>
              <span>Room: {roomId}</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {Object.keys(gameState.players).length} Players
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
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onLeaveRoom}>
              Leave
            </Button>
          </div>
        </div>

        {gameState.gameStatus === 'waiting' && (
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gray-800/50 border-blue-500/50 backdrop-blur">
              <CardContent className="p-8">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-white mb-4">Waiting for players...</h2>
                <div className="flex justify-center gap-4">
                  {Object.values(gameState.players).map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-white">{p.username}</span>
                      {p.isReady && <Badge className="bg-green-600">Ready</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {gameState.gameStatus === 'playing' && player && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Hold piece */}
            <div className="order-2 xl:order-1">
              <Card className="bg-gray-800/50 border-purple-500/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-300">Hold</CardTitle>
                </CardHeader>
                <CardContent>
                  {player.heldPiece && (
                    <div className="grid gap-px bg-gray-700 p-2 rounded">
                      {TETROMINO_SHAPES[player.heldPiece][0].map((row, y) => (
                        <div key={y} className="flex gap-px">
                          {row.map((cell, x) => (
                            <div
                              key={x}
                              className={`w-4 h-4 ${cell ? 'opacity-80' : 'bg-transparent'} ${!player.canHold ? 'opacity-30' : ''}`}
                              style={{
                                backgroundColor: cell ? TETROMINO_COLORS[player.heldPiece!] : 'transparent'
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="mt-4 bg-gray-800/50 border-blue-500/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-300">Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Score:</span>
                    <span className="text-white font-bold">{player.stats.score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Level:</span>
                    <span className="text-white">{player.stats.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Lines:</span>
                    <span className="text-white">{player.stats.lines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">PPS:</span>
                    <span className="text-white">{player.stats.pps.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Combo:</span>
                    <span className={`font-bold ${player.combo.active ? 'text-yellow-400' : 'text-white'}`}>
                      {player.combo.count}x
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Game board */}
            <div className="order-1 xl:order-2 col-span-1 xl:col-span-2">
              <Card className="bg-black/50 border-green-500/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="bg-black p-4 rounded border-2 border-gray-600">
                    {boardRenderer}
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="mt-4 grid grid-cols-2 gap-2 xl:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onTouchStart={() => handleInput('move-left')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onTouchStart={() => handleInput('move-right')}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onTouchStart={() => handleInput('rotate-cw')}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onTouchStart={() => handleInput('hard-drop')}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Next pieces */}
            <div className="order-3">
              <Card className="bg-gray-800/50 border-orange-500/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-300">Next</CardTitle>
                </CardHeader>
                <CardContent>
                  {player.nextPieces && renderNextPieces(player.nextPieces)}
                </CardContent>
              </Card>

              {/* Power-ups */}
              {gameMode === 'battle' && player.powerUps.length > 0 && (
                <Card className="mt-4 bg-gray-800/50 border-red-500/50 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-300">Power-ups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {player.powerUps.map((powerUp, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <span className="text-lg">{powerUp.icon}</span>
                          <span className="text-xs text-gray-300">{powerUp.description}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Multiplayer view */}
        {gameState.gameStatus === 'playing' && Object.keys(gameState.players).length > 1 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4">Other Players</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(gameState.players)
                .filter(p => p.id !== localPlayer)
                .map(opponent => (
                  <motion.div
                    key={opponent.id}
                    className="relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: opponent.isAlive ? 1 : 0.5, scale: 1 }}
                  >
                    <Card className={`
                      bg-gray-800/30 backdrop-blur border
                      ${opponent.isAlive ? 'border-blue-500/50' : 'border-red-500/50'}
                    `}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">
                            {opponent.username}
                          </span>
                          <div className="flex items-center gap-2">
                            {opponent.rank <= 3 && (
                              <div className="flex items-center gap-1">
                                <Crown className="h-3 w-3 text-yellow-400" />
                                <span className="text-xs text-yellow-400">#{opponent.rank}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {opponent.stats.score.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-px bg-gray-900 p-1 rounded">
                          {renderBoard(opponent.board, opponent.currentPiece)}
                        </div>

                        <div className="mt-2 flex justify-between text-xs text-gray-400">
                          <span>L{opponent.stats.level}</span>
                          <span>{opponent.stats.lines} lines</span>
                          <span>{opponent.combo.active ? `${opponent.combo.count}x` : '—'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Game finished */}
        {gameState.gameStatus === 'finished' && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-gray-900 border-yellow-500 w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-yellow-400">
                  {gameState.winner === localPlayer ? '🎉 Victory!' : '💀 Game Over'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {player && (
                  <div className="space-y-4">
                    <div className="text-4xl font-bold text-white">
                      {player.stats.score.toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Lines</div>
                        <div className="text-white font-bold">{player.stats.lines}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Level</div>
                        <div className="text-white font-bold">{player.stats.level}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Max Combo</div>
                        <div className="text-white font-bold">{player.stats.maxCombo}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Efficiency</div>
                        <div className="text-white font-bold">{player.stats.efficiency.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-6 space-y-2">
                  <Button className="w-full" onClick={() => window.location.reload()}>
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

        {/* Controls reference */}
        <Card className="mt-8 bg-gray-800/30 border-gray-600 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-white">Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Movement</div>
                <div className="text-white">← → ↓ Arrow Keys</div>
              </div>
              <div>
                <div className="text-gray-400">Rotate</div>
                <div className="text-white">↑ Arrow / Z / X</div>
              </div>
              <div>
                <div className="text-gray-400">Hard Drop</div>
                <div className="text-white">Space</div>
              </div>
              <div>
                <div className="text-gray-400">Hold</div>
                <div className="text-white">C / Shift</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
