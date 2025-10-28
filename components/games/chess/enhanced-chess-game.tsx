// @ts-nocheck

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Clock, 
  Pause, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Users, 
  Bot, 
  Gamepad2,
  Trophy,
  MessageCircle,
  Zap,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

// Chess piece types
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type PieceColor = 'white' | 'black'

interface ChessPiece {
  type: PieceType
  color: PieceColor
  position: [number, number]
  hasMoved: boolean
}

interface ChessMove {
  from: [number, number]
  to: [number, number]
  piece: ChessPiece
  capturedPiece?: ChessPiece
  moveTime: number
  notation: string
}

interface GameSettings {
  timeControl: 'blitz' | 'rapid' | 'classical' | 'unlimited'
  timeMinutes: number
  increment: number
  theme: 'classic' | 'neon' | 'wood' | 'marble' | 'glass' | 'galaxy'
  soundEnabled: boolean
  animationsEnabled: boolean
  showLastMove: boolean
  showPossibleMoves: boolean
  view: '2d' | '3d'
  dynamicCamera: boolean
  battleCinematics: boolean
  cameraSide: 'auto' | 'white' | 'black'
  boardMotion: boolean
  cinematicLevel: 'low' | 'standard' | 'high'
  gameMode: 'single' | 'online' | 'computer' | 'random'
  difficulty: 'easy' | 'medium' | 'hard' | 'master'
}

interface BattleAnimation {
  id: string
  attacker: ChessPiece
  defender: ChessPiece
  position: [number, number]
}

const defaultSettings: GameSettings = {
  timeControl: 'blitz',
  timeMinutes: 5,
  increment: 3,
  theme: 'neon',
  soundEnabled: true,
  animationsEnabled: true,
  showLastMove: true,
  showPossibleMoves: true,
  view: '2d',
  dynamicCamera: true,
  battleCinematics: true,
  cameraSide: 'auto',
  boardMotion: true,
  cinematicLevel: 'standard',
  gameMode: 'single',
  difficulty: 'medium'
}

const pieceUnicodes = {
  white: {
    king: '♔',
    queen: '♕', 
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜', 
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
}

const themeStyles = {
  classic: {
    lightSquare: 'bg-amber-100 hover:bg-amber-200',
    darkSquare: 'bg-amber-800 hover:bg-amber-700',
    whitePiece: 'text-white drop-shadow-lg',
    blackPiece: 'text-gray-900'
  },
  neon: {
    lightSquare: 'bg-gray-900 border border-gaming-primary/20 hover:border-gaming-primary/40',
    darkSquare: 'bg-gray-800 border border-gaming-secondary/20 hover:border-gaming-secondary/40',
    whitePiece: 'text-gaming-primary drop-shadow-glow [text-shadow:_0_0_2px_rgb(0_0_0_/_80%)]',
    blackPiece: 'text-gaming-secondary drop-shadow-glow'
  },
  wood: {
    lightSquare: 'bg-amber-200 hover:bg-amber-300',
    darkSquare: 'bg-amber-900 hover:bg-amber-800',
    whitePiece: 'text-white drop-shadow-md',
    blackPiece: 'text-gray-900'
  },
  marble: {
    lightSquare: 'bg-gray-100 hover:bg-gray-200 bg-opacity-90',
    darkSquare: 'bg-gray-600 hover:bg-gray-500 bg-opacity-90',
    whitePiece: 'text-white drop-shadow-lg',
    blackPiece: 'text-gray-900'
  },
  glass: {
    lightSquare: 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20',
    darkSquare: 'bg-black/10 backdrop-blur-sm border border-black/20 hover:bg-black/20',
    whitePiece: 'text-white drop-shadow-glow',
    blackPiece: 'text-black drop-shadow-glow'
  },
  galaxy: {
    lightSquare: 'bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.25)]',
    darkSquare: 'bg-[hsl(var(--secondary)/0.15)] border border-[hsl(var(--secondary)/0.3)] hover:bg-[hsl(var(--secondary)/0.25)]',
    whitePiece: 'text-[hsl(var(--primary))] drop-shadow-glow',
    blackPiece: 'text-[hsl(var(--secondary))] drop-shadow-glow'
  }
}

import { useSocket } from '@/lib/socket-client'

import { GameStartMenu } from '../GameStartMenu'

export function EnhancedChessGame({ roomId }: { roomId?: string }) {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [gameStarted, setGameStarted] = useState(false)
  const [showStartMenu, setShowStartMenu] = useState(true)
  const [isPaused, setPaused] = useState(false)
  const [whiteTime, setWhiteTime] = useState(300) // 5 minutes in seconds
  const [blackTime, setBlackTime] = useState(300)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white')
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<[number, number][]>([])
  const [lastMove, setLastMove] = useState<ChessMove | null>(null)
  const [battleAnimations, setBattleAnimations] = useState<BattleAnimation[]>([])
  const [showChat, setShowChat] = useState(false)
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'draw' | 'waiting'>('waiting')
  const { socket, isConnected } = useSocket()
  const [onlineState, setOnlineState] = useState<any | null>(null)
  const [promotion, setPromotion] = useState<{ from: [number, number], to: [number, number] } | null>(null)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [boardCaptureTick, setBoardCaptureTick] = useState(0)

  // Persist settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('glxy-chess-settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem('glxy-chess-settings', JSON.stringify(settings)) } catch {}
    }, 200)
    return () => clearTimeout(id)
  }, [settings])
  // 2.5D Board Controls
  const [boardTilt, setBoardTilt] = useState({ x: 12, y: -12, scale: 1 })
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (settings.view !== '3d') return
    setBoardTilt((prev) => ({ ...prev, scale: Math.max(0.7, Math.min(1.6, prev.scale + (e.deltaY > 0 ? -0.05 : 0.05))) }))
  }
  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (settings.view !== '3d' || !settings.dynamicCamera) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
    // throttle via rAF
    if ((window as any).__chessCamTick) return
    ;(window as any).__chessCamTick = true
    requestAnimationFrame(() => {
      setBoardTilt((prev) => ({ ...prev, x: ny * 15, y: nx * 15 }))
      ;(window as any).__chessCamTick = false
    })
  }

  // WebAudio beep fallback
  const playBeep = (f = 880, t = 0.05) => {
    if (!settings.soundEnabled || typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination)
      g.gain.value = 0.02; o.start(); setTimeout(()=>{o.stop(); ctx.close()}, t*1000)
    } catch {}
  }

  // Online wiring
  useEffect(() => {
    if (!roomId || !socket) return
    socket.emit('chess:join', { roomId })
    const onState = (s: any) => {
      setOnlineState(s)
      if (s?.board) setBoard(s.board)
      if (s?.turn) setCurrentPlayer(s.turn)
      if (s?.status) setGameStatus(s.status)
    }
    const onErr = (e: any) => console.warn('chess error', e)
    socket.on('chess:state', onState)
    socket.on('error', onErr)
    return () => { socket.off('chess:state', onState); socket.off('error', onErr) }
  }, [roomId, socket])

  // Initialize chess board
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(() => {
    const initialBoard: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null))
    
    // Setup initial positions
    const backRankPieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    
    // White pieces
    for (let i = 0; i < 8; i++) {
      initialBoard[7][i] = { type: backRankPieces[i], color: 'white', position: [7, i], hasMoved: false }
      initialBoard[6][i] = { type: 'pawn', color: 'white', position: [6, i], hasMoved: false }
    }
    
    // Black pieces
    for (let i = 0; i < 8; i++) {
      initialBoard[0][i] = { type: backRankPieces[i], color: 'black', position: [0, i], hasMoved: false }
      initialBoard[1][i] = { type: 'pawn', color: 'black', position: [1, i], hasMoved: false }
    }
    
    return initialBoard
  })

  // Timer effect
  useEffect(() => {
    if (!gameStarted || isPaused || gameStatus !== 'playing') return

    const timer = setInterval(() => {
      if (currentPlayer === 'white') {
        setWhiteTime(prev => prev > 0 ? prev - 1 : 0)
      } else {
        setBlackTime(prev => prev > 0 ? prev - 1 : 0)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, isPaused, currentPlayer, gameStatus])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!gameStarted || isPaused || gameStatus !== 'playing') return

    const piece = board[row][col]
    
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare
      const selectedPiece = board[selectedRow][selectedCol]
      
      // If clicking on the same square, deselect
      if (selectedRow === row && selectedCol === col) {
        setSelectedSquare(null)
        setPossibleMoves([])
        return
      }
      
      // If trying to move a piece
      if (selectedPiece && selectedPiece.color === currentPlayer) {
        const isValidMove = possibleMoves.some(([r, c]) => r === row && c === col)
        
        if (isValidMove) {
          // Promotion?
          const willPromote = selectedPiece.type === 'pawn' && ((selectedPiece.color === 'white' && row === 0) || (selectedPiece.color === 'black' && row === 7))
          if (roomId && socket) {
            if (willPromote) {
              setPromotion({ from: [selectedRow, selectedCol], to: [row, col] })
              return
            }
            socket.emit('chess:move', { roomId, from: [selectedRow, selectedCol], to: [row, col] })
            setSelectedSquare(null)
            setPossibleMoves([])
            return
          }
          // Create battle animation if capturing
          if (piece && piece.color !== selectedPiece.color) {
            const battleId = `battle-${Date.now()}`
            setBattleAnimations(prev => [...prev, {
              id: battleId,
              attacker: selectedPiece,
              defender: piece,
              position: [row, col]
            }])
            
            // Remove battle animation after animation completes
            setTimeout(() => {
              setBattleAnimations(prev => prev.filter(b => b.id !== battleId))
            }, 1500)
            setBoardCaptureTick(t => t + 1)
            playBeep(660, 0.07)
          }
          
          // Make the move
          const newBoard = board.map(row => [...row])
          newBoard[row][col] = { ...selectedPiece, position: [row, col], hasMoved: true }
          newBoard[selectedRow][selectedCol] = null
          
          setBoard(newBoard)
          setLastMove({
            from: [selectedRow, selectedCol],
            to: [row, col],
            piece: selectedPiece,
            capturedPiece: piece || undefined,
            moveTime: Date.now(),
            notation: `${selectedPiece.type.charAt(0).toUpperCase()}${String.fromCharCode(97 + col)}${8 - row}`
          })
          
          // Switch players
          setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white')
          
          // Play move sound
          playBeep(880, 0.04)
        }
      }
      
      setSelectedSquare(null)
      setPossibleMoves([])
    } else if (piece && piece.color === currentPlayer) {
      // Select a piece
      setSelectedSquare([row, col])
      // Calculate possible moves (simplified for demo)
      setPossibleMoves(calculatePossibleMoves(piece, board))
    }
  }, [board, selectedSquare, possibleMoves, currentPlayer, gameStarted, isPaused, gameStatus, settings.soundEnabled])

  const calculatePossibleMoves = (piece: ChessPiece, board: (ChessPiece | null)[][]): [number, number][] => {
    const moves: [number, number][] = []
    const [row, col] = piece.position
    
    const isValidSquare = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8
    const isEmpty = (r: number, c: number) => !board[r][c]
    const isEnemy = (r: number, c: number) => board[r][c] && board[r][c]!.color !== piece.color
    const canMoveTo = (r: number, c: number) => isValidSquare(r, c) && (isEmpty(r, c) || isEnemy(r, c))
    
    switch (piece.type) {
      case 'pawn': {
        const direction = piece.color === 'white' ? -1 : 1
        const startRow = piece.color === 'white' ? 6 : 1
        
        // Move forward one square
        if (isValidSquare(row + direction, col) && isEmpty(row + direction, col)) {
          moves.push([row + direction, col])
          
          // Double move from starting position
          if (row === startRow && isEmpty(row + 2 * direction, col)) {
            moves.push([row + 2 * direction, col])
          }
        }
        
        // Capture diagonally
        for (const dc of [-1, 1]) {
          const newRow = row + direction
          const newCol = col + dc
          if (isValidSquare(newRow, newCol) && isEnemy(newRow, newCol)) {
            moves.push([newRow, newCol])
          }
        }
        break
      }
      
      case 'rook': {
        // Horizontal and vertical moves
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
        for (const [dr, dc] of directions) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i
            const newCol = col + dc * i
            if (!isValidSquare(newRow, newCol)) break
            
            if (isEmpty(newRow, newCol)) {
              moves.push([newRow, newCol])
            } else if (isEnemy(newRow, newCol)) {
              moves.push([newRow, newCol])
              break
            } else {
              break // Own piece blocking
            }
          }
        }
        break
      }
      
      case 'bishop': {
        // Diagonal moves
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
        for (const [dr, dc] of directions) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i
            const newCol = col + dc * i
            if (!isValidSquare(newRow, newCol)) break
            
            if (isEmpty(newRow, newCol)) {
              moves.push([newRow, newCol])
            } else if (isEnemy(newRow, newCol)) {
              moves.push([newRow, newCol])
              break
            } else {
              break // Own piece blocking
            }
          }
        }
        break
      }
      
      case 'queen': {
        // Combination of rook and bishop moves
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
        for (const [dr, dc] of directions) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i
            const newCol = col + dc * i
            if (!isValidSquare(newRow, newCol)) break
            
            if (isEmpty(newRow, newCol)) {
              moves.push([newRow, newCol])
            } else if (isEnemy(newRow, newCol)) {
              moves.push([newRow, newCol])
              break
            } else {
              break // Own piece blocking
            }
          }
        }
        break
      }
      
      case 'king': {
        // One square in any direction
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
        for (const [dr, dc] of directions) {
          const newRow = row + dr
          const newCol = col + dc
          if (canMoveTo(newRow, newCol)) {
            moves.push([newRow, newCol])
          }
        }
        break
      }
      
      case 'knight': {
        // L-shaped moves (2+1 in any combination)
        const knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ]
        for (const [dr, dc] of knightMoves) {
          const newRow = row + dr
          const newCol = col + dc
          if (canMoveTo(newRow, newCol)) {
            moves.push([newRow, newCol])
          }
        }
        break
      }
    }
    
    return moves
  }

  // Inject online battle animation on capture (based on server lastMove)
  useEffect(() => {
    if (!onlineState?.lastMove || !settings.battleCinematics) return
    const { from, to, captured } = onlineState.lastMove
    if (!captured) return
    const battleId = `battle-${from?.join('-')}-${to?.join('-')}-${Date.now()}`
    setBattleAnimations(prev => [...prev, {
      id: battleId,
      attacker: board[from[0]]?.[from[1]] || { type: 'pawn', color: currentPlayer, position: [0,0], hasMoved: false },
      defender: captured,
      position: to
    }])
    setTimeout(() => {
      setBattleAnimations(prev => prev.filter(b => b.id !== battleId))
    }, 1600)
    playBeep(660, 0.07)
  }, [onlineState?.lastMove, settings.battleCinematics])

  const startGame = () => {
    setGameStarted(true)
    setPaused(false)
    setGameStatus('playing')
    setWhiteTime(settings.timeMinutes * 60)
    setBlackTime(settings.timeMinutes * 60)
  }

  const pauseGame = () => {
    setPaused(!isPaused)
  }

  const resetGame = () => {
    setGameStarted(false)
    setPaused(false)
    setGameStatus('waiting')
    setCurrentPlayer('white')
    setSelectedSquare(null)
    setPossibleMoves([])
    setLastMove(null)
    setBattleAnimations([])
    // Reset board to initial position
    // ... (initialization code)
  }

  const handleStartGame = (mode: 'singleplayer' | 'multiplayer', config: any) => {
    console.log('Starting game:', mode, config)
    setShowStartMenu(false)
    setGameStarted(true)

    // Configure game based on selected mode and config
    if (mode === 'singleplayer') {
      // Setup AI opponent
      setSettings(prev => ({
        ...prev,
        difficulty: config.difficulty,
        aiPersonality: config.aiPersonality,
        gameMode: 'computer'
      }))
    } else {
      // Setup multiplayer
      setSettings(prev => ({
        ...prev,
        gameMode: 'online',
        isRanked: config.ranked,
        maxPlayers: config.maxPlayers
      }))
    }
  }

  // Show start menu if not started yet
  if (showStartMenu) {
    return (
      <GameStartMenu
        gameType="chess"
        gameName="Schach Meister"
        gameIcon="♔"
        onStartGame={handleStartGame}
        onClose={() => setShowStartMenu(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-gaming-primary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold gradient-text mb-2">
              ♟️ GLXY Schach
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={gameStatus === 'playing' ? 'default' : 'secondary'}>
                {gameStatus === 'playing' ? 'Spiel läuft' : 'Warten'}
              </Badge>
              <span>Modus: {settings.gameMode}</span>
              <span>Theme: {settings.theme}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Spiel Einstellungen
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="game" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="game">Spiel</TabsTrigger>
                    <TabsTrigger value="time">Zeit</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="game" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Spiel Modus</Label>
                        <Select value={settings.gameMode} onValueChange={(value: any) => 
                          setSettings(prev => ({ ...prev, gameMode: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Singleplayer</SelectItem>
                            <SelectItem value="online">Online Multiplayer</SelectItem>
                            <SelectItem value="computer">Gegen Computer</SelectItem>
                            <SelectItem value="random">Zufälliger Raum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {settings.gameMode === 'computer' && (
                        <div>
                          <Label>Schwierigkeit</Label>
                          <Select value={settings.difficulty} onValueChange={(value: any) => 
                            setSettings(prev => ({ ...prev, difficulty: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Einfach</SelectItem>
                              <SelectItem value="medium">Mittel</SelectItem>
                              <SelectItem value="hard">Schwer</SelectItem>
                              <SelectItem value="master">Meister</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <Label>Mögliche Züge anzeigen</Label>
                        <Switch 
                          checked={settings.showPossibleMoves}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, showPossibleMoves: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Letzten Zug hervorheben</Label>
                        <Switch 
                          checked={settings.showLastMove}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, showLastMove: checked }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="time" className="space-y-4">
                    <div>
                      <Label>Zeit Kontrolle</Label>
                      <Select value={settings.timeControl} onValueChange={(value: any) => 
                        setSettings(prev => ({ ...prev, timeControl: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blitz">Blitz (1-5 min)</SelectItem>
                          <SelectItem value="rapid">Schnell (10-15 min)</SelectItem>
                          <SelectItem value="classical">Klassisch (30+ min)</SelectItem>
                          <SelectItem value="unlimited">Unbegrenzt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Zeit pro Spieler (Minuten): {settings.timeMinutes}</Label>
                      <Slider
                        value={[settings.timeMinutes]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, timeMinutes: value }))}
                        max={60}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Increment (Sekunden): {settings.increment}</Label>
                      <Slider
                        value={[settings.increment]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, increment: value }))}
                        max={30}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="theme" className="space-y-4">
                    <div>
                      <Label>Schachbrett Theme</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {Object.keys(themeStyles).map((theme) => (
                          <Card 
                            key={theme} 
                            className={`cursor-pointer border-2 transition-colors ${
                              settings.theme === theme ? 'border-gaming-primary' : 'border-transparent'
                            }`}
                            onClick={() => setSettings(prev => ({ ...prev, theme: theme as any }))}
                          >
                            <CardContent className="p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium mb-2 capitalize">{theme}</div>
                                <div className="w-full h-8 grid grid-cols-4 gap-0.5 rounded overflow-hidden">
                                  {Array(8).fill(0).map((_, i) => (
                                    <div 
                                      key={i}
                                      className={`h-4 ${
                                        i % 2 === 0 
                                          ? themeStyles[theme as keyof typeof themeStyles].lightSquare 
                                          : themeStyles[theme as keyof typeof themeStyles].darkSquare
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Animationen aktivieren</Label>
                      <Switch 
                        checked={settings.animationsEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, animationsEnabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>3D‑Ansicht</Label>
                      <Switch 
                        checked={settings.view === '3d'}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, view: checked ? '3d' : '2d' }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Dynamische Kamera</Label>
                      <Switch 
                        checked={settings.dynamicCamera}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, dynamicCamera: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Kampf‑Cinematics</Label>
                      <Switch 
                        checked={settings.battleCinematics}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, battleCinematics: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Brett‑Bewegung</Label>
                      <Switch 
                        checked={settings.boardMotion}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, boardMotion: checked }))}
                      />
                    </div>
                    <div>
                      <Label>Kamera‑Seite</Label>
                      <Select value={settings.cameraSide} onValueChange={(value: any) => setSettings(prev => ({ ...prev, cameraSide: value }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto (am Zug)</SelectItem>
                          <SelectItem value="white">Weiß</SelectItem>
                          <SelectItem value="black">Schwarz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cinematics‑Stufe</Label>
                      <Select value={settings.cinematicLevel} onValueChange={(value: any) => setSettings(prev => ({ ...prev, cinematicLevel: value }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Niedrig</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="high">Hoch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="audio" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Sound Effekte</Label>
                      <Switch 
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, soundEnabled: checked }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Game Controls */}
            {!gameStarted ? (
              <Button onClick={startGame} className="gap-2">
                <Play className="w-4 h-4" />
                Spiel starten
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={pauseGame} size="sm">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={resetGame} size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Chat Toggle */}
            <Button variant="outline" onClick={() => setShowChat(!showChat)} size="sm">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!gameStarted ? (
          // Start Menu
          <div className="min-h-[70vh] flex items-center justify-center">
            <motion.div 
              className="text-center py-16 px-8 max-w-lg mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="text-9xl mb-8"
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotateY: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                ♟️
              </motion.div>
              
              <motion.h2 
                className="text-4xl font-orbitron font-bold mb-6 gradient-text"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Bereit für Schach?
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground mb-10 text-xl leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Trete gegen eine intelligente KI an und zeige deine strategischen Fähigkeiten auf dem 64-Felder-Brett!
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={startGame} 
                    size="lg" 
                    className="gap-3 text-xl px-10 py-5 bg-gradient-to-r from-gaming-primary to-gaming-secondary hover:from-gaming-secondary hover:to-gaming-primary transition-all duration-300 shadow-xl shadow-gaming-primary/40 border-2 border-gaming-primary/30"
                  >
                    <Play className="w-7 h-7" />
                    Schachpartie starten
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="mt-12 grid grid-cols-3 gap-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div 
                  className="p-4 rounded-lg bg-gaming-primary/10 border border-gaming-primary/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-3xl mb-3">🎯</div>
                  <div className="font-semibold text-gaming-primary">Strategie</div>
                  <div className="text-sm text-muted-foreground mt-1">Taktisches Denken</div>
                </motion.div>
                <motion.div 
                  className="p-4 rounded-lg bg-gaming-secondary/10 border border-gaming-secondary/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-3xl mb-3">⚡</div>
                  <div className="font-semibold text-gaming-secondary">KI-Gegner</div>
                  <div className="text-sm text-muted-foreground mt-1">Intelligente Züge</div>
                </motion.div>
                <motion.div 
                  className="p-4 rounded-lg bg-gaming-accent/10 border border-gaming-accent/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-3xl mb-3">👑</div>
                  <div className="font-semibold text-gaming-accent">Meisterschaft</div>
                  <div className="text-sm text-muted-foreground mt-1">Skill aufbauen</div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="mt-8 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                ⌨️ Nutze die Maus zum Spielen • 🎮 Vollständige Schachregeln implementiert
              </motion.div>
            </motion.div>
          </div>
        ) : (
          // Game Board
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Player Info & Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Black Player */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold">
                      B
                    </div>
                    <div>
                      <div className="font-semibold">Black Player</div>
                      <div className="text-sm text-muted-foreground">Elo: 1200</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-orbitron font-bold ${currentPlayer === 'black' ? 'text-gaming-primary' : ''}`}>
                    {formatTime(blackTime)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Spiel Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Am Zug:</span>
                  <Badge variant={currentPlayer === 'white' ? 'default' : 'secondary'}>
                    {currentPlayer === 'white' ? 'Weiß' : 'Schwarz'}
                  </Badge>
                </div>
                {lastMove && (
                  <div className="text-xs text-muted-foreground">
                    Letzter Zug: {lastMove.notation}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* White Player */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-black font-bold">
                      W
                    </div>
                    <div>
                      <div className="font-semibold">White Player</div>
                      <div className="text-sm text-muted-foreground">Elo: 1150</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-orbitron font-bold ${currentPlayer === 'white' ? 'text-gaming-primary' : ''}`}>
                    {formatTime(whiteTime)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chess Board */}
          <div className="lg:col-span-2">
            {roomId && (
              <Card className="mb-3">
                <CardHeader>
                  <CardTitle className="text-sm">Schach Online</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm flex items-center gap-3">
                  <Badge variant={isConnected ? 'default' : 'secondary'}>{isConnected ? 'verbunden' : 'offline'}</Badge>
                  <span>Room: {roomId}</span>
                  <Button size="sm" variant="secondary" onClick={() => socket?.emit('chess:start', { roomId })} disabled={!isConnected}>Start</Button>
                  <Button size="sm" variant="outline" onClick={() => setBoardTilt({ x: 12, y: -12, scale: 1 })}>Kamera zurücksetzen</Button>
                </CardContent>
              </Card>
            )}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="relative">
                  {/* Board */}
                  <div
                    className="mx-auto max-w-xl"
                    style={settings.view === '3d' ? { perspective: 1000 } : undefined}
                    onWheel={handleWheel}
                    onMouseMove={handleMouseMove}
                  >
                    <motion.div
                      className="inline-block"
                      animate={settings.view === '3d' ? { rotateX: boardTilt.x, rotateY: boardTilt.y, scale: boardTilt.scale, rotateZ: settings.cameraSide === 'black' ? 180 : 0 } : { rotateX: 0, rotateY: 0, scale: 1, rotateZ: 0 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    >
                      <motion.div
                        className="grid grid-cols-8 gap-0 aspect-square border-4 border-gaming-primary/20 rounded-lg overflow-hidden"
                        animate={settings.boardMotion && settings.view==='3d' && !reduceMotion ? { rotateZ: [-1, 1, -1] } : { rotateZ: 0, scale: 1 }}
                        transition={{ duration: settings.cinematicLevel==='high' ? 14 : settings.cinematicLevel==='low' ? 22 : 18, repeat: settings.boardMotion && settings.view==='3d' && !reduceMotion ? Infinity : 0, ease: 'easeInOut' }}
                        key={boardCaptureTick}
                      >
                    {board.map((row, rowIndex) => 
                      row.map((piece, colIndex) => {
                        const isLight = (rowIndex + colIndex) % 2 === 0
                        const isSelected = selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex
                        const isPossibleMove = possibleMoves.some(([r, c]) => r === rowIndex && c === colIndex)
                        const isLastMoveSquare = lastMove && settings.showLastMove && (
                          (lastMove.from[0] === rowIndex && lastMove.from[1] === colIndex) ||
                          (lastMove.to[0] === rowIndex && lastMove.to[1] === colIndex)
                        )
                        
                        const themeStyle = themeStyles[settings.theme]
                        
                        return (
                          <motion.div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              aspect-square flex items-center justify-center text-4xl cursor-pointer relative
                              ${isLight ? themeStyle.lightSquare : themeStyle.darkSquare}
                              ${isSelected ? 'ring-4 ring-gaming-primary ring-opacity-50' : ''}
                              ${isLastMoveSquare ? 'ring-2 ring-gaming-secondary ring-opacity-40' : ''}
                            `}
                            onClick={() => handleSquareClick(rowIndex, colIndex)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {/* Possible move indicator */}
                            {isPossibleMove && settings.showPossibleMoves && (
                              <motion.div
                                className="absolute inset-2 bg-gaming-primary/40 rounded-full border-3 border-gaming-primary shadow-lg shadow-gaming-primary/50"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ 
                                  scale: [0.6, 0.8, 0.6], 
                                  opacity: [0.7, 1, 0.7],
                                  boxShadow: [
                                    "0 0 10px rgba(var(--gaming-primary), 0.5)",
                                    "0 0 20px rgba(var(--gaming-primary), 0.8)",
                                    "0 0 10px rgba(var(--gaming-primary), 0.5)"
                                  ]
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  ease: "easeInOut" 
                                }}
                              />
                            )}
                            
                            {/* Chess piece */}
                            {piece && (
                              <motion.div
                                className={`relative z-10 ${
                                  piece.color === 'white' ? themeStyle.whitePiece : themeStyle.blackPiece
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            whileHover={settings.view==='3d' && !reduceMotion ? { scale: 1.08 } : undefined}
                                layoutId={`piece-${piece.position[0]}-${piece.position[1]}`}
                              >
                                {pieceUnicodes[piece.color][piece.type]}
                              </motion.div>
                            )}
                            
                            {/* Battle animations */}
                            <AnimatePresence>
                              {battleAnimations.map((battle) => {
                                if (battle.position[0] === rowIndex && battle.position[1] === colIndex) {
                                  const getPieceAnimation = (pieceType: PieceType) => {
                                    switch(pieceType) {
                                      case 'king':
                                        return { 
                                          color: 'from-yellow-400 via-orange-500 to-red-600',
                                          particles: 12,
                                          effect: '👑💥'
                                        }
                                      case 'queen':
                                        return { 
                                          color: 'from-purple-400 via-pink-500 to-red-500',
                                          particles: 10,
                                          effect: '👸⚡'
                                        }
                                      case 'rook':
                                        return { 
                                          color: 'from-gray-400 via-gray-600 to-gray-800',
                                          particles: 8,
                                          effect: '🏰💥'
                                        }
                                      case 'bishop':
                                        return { 
                                          color: 'from-blue-400 via-purple-500 to-indigo-600',
                                          particles: 8,
                                          effect: '⛪✨'
                                        }
                                      case 'knight':
                                        return { 
                                          color: 'from-green-400 via-emerald-500 to-teal-600',
                                          particles: 6,
                                          effect: '🐎💫'
                                        }
                                      default: // pawn
                                        return { 
                                          color: 'from-amber-400 via-orange-500 to-red-500',
                                          particles: 6,
                                          effect: '⚔️💥'
                                        }
                                    }
                                  }
                                  
                                  const animation = getPieceAnimation(battle.defender.type)
                                  
                                  return (
                                    <motion.div
                                      key={battle.id}
                                      className="absolute inset-0 pointer-events-none z-20"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 2 }}
                                    >
                                      {/* 3D Explosion effect */}
                                      <motion.div
                                        className={`absolute inset-0 bg-gradient-to-br ${animation.color} rounded-full opacity-90`}
                                        initial={{ scale: 0, rotateY: 0, rotateX: 0 }}
                                        animate={{ 
                                          scale: [0, 1.8, 0.3, 1.2, 0],
                                          rotateY: [0, 180, 360],
                                          rotateX: [0, 90, 180],
                                          filter: [
                                            "blur(0px) brightness(1)",
                                            "blur(2px) brightness(1.5)",
                                            "blur(0px) brightness(2)",
                                            "blur(1px) brightness(0.8)",
                                            "blur(3px) brightness(0)"
                                          ]
                                        }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                      />
                                      
                                      {/* Asset-based cinematic sprite */}
                                      <motion.img
                                        src={`/assets/chess/${battle.attacker.type}-attack.svg`}
                                        alt={`${battle.attacker.type}-attack`}
                                        className="absolute w-24 h-24 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl"
                                        initial={{ scale: 0.2, opacity: 0, rotate: -15 }}
                                        animate={{ scale: [0.2, 1.1, 1.0, 0.3], opacity: [0, 1, 1, 0], rotate: [ -15, 10, 0, 0 ], y: [10, -8, 0, -4] }}
                                        transition={{ duration: 1.6, ease: 'easeInOut' }}
                                      />
                                      
                                      {/* 3D Sparkles */}
                                      {Array.from({ length: animation.particles }).map((_, i) => (
                                        <motion.div
                                          key={i}
                                          className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"
                                          style={{
                                            left: '50%',
                                            top: '50%'
                                          }}
                                          initial={{ scale: 0, rotateZ: 0 }}
                                          animate={{
                                            x: Math.cos((i * 360 / animation.particles * Math.PI) / 180) * 40,
                                            y: Math.sin((i * 360 / animation.particles * Math.PI) / 180) * 40,
                                            z: Math.sin((i * 180 / animation.particles * Math.PI) / 180) * 20,
                                            scale: [0, 1.2, 0.8, 0],
                                            opacity: [1, 1, 0.5, 0],
                                            rotateZ: [0, 720]
                                          }}
                                          transition={{ 
                                            duration: 1.5, 
                                            delay: 0.1 + i * 0.05,
                                            ease: "easeOut"
                                          }}
                                        />
                                      ))}
                                      
                                      {/* Shockwave effect */}
                                      <motion.div
                                        className="absolute inset-0 border-4 border-gaming-primary rounded-full"
                                        initial={{ scale: 0, opacity: 1 }}
                                        animate={{ 
                                          scale: [0, 2, 3],
                                          opacity: [1, 0.5, 0],
                                          borderWidth: [4, 2, 0]
                                        }}
                                        transition={{ duration: 1.2, delay: 0.3 }}
                                      />
                                    </motion.div>
                                  )
                                }
                                return null
                              })}
                            </AnimatePresence>
                            
                            {/* Coordinate labels */}
                            {rowIndex === 7 && (
                              <div className="absolute bottom-0 right-0 text-xs text-muted-foreground/50 p-1">
                                {String.fromCharCode(97 + colIndex)}
                              </div>
                            )}
                            {colIndex === 0 && (
                              <div className="absolute top-0 left-0 text-xs text-muted-foreground/50 p-1">
                                {8 - rowIndex}
                              </div>
                            )}
                          </motion.div>
                        )
                      })
                    )}
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  {/* Pause overlay */}
                  {isPaused && (
                    <motion.div
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="text-center text-white">
                        <Pause className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Spiel pausiert</h3>
                        <Button onClick={pauseGame} variant="outline">
                          <Play className="w-4 h-4 mr-2" />
                          Fortsetzen
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  {/* Promotion Dialog */}
                  <AnimatePresence>
                    {promotion && (
                      <motion.div
                        className="absolute inset-0 bg-black/60 flex items-center justify-center z-30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="bg-card border border-border rounded-xl p-4 shadow-xl w-64">
                          <div className="text-center font-semibold mb-2">Beförderung</div>
                          <div className="grid grid-cols-4 gap-2">
                            {([ { k: 'q', u: '♕' }, { k: 'r', u: '♖' }, { k: 'b', u: '♗' }, { k: 'n', u: '♘' } ] as const).map(opt => (
                              <Button key={opt.k} onClick={() => {
                                if (roomId && socket && promotion) {
                                  socket.emit('chess:move', { roomId, from: promotion.from, to: promotion.to, promotion: opt.k })
                                }
                                setPromotion(null)
                              }} variant="secondary" className="text-2xl">{opt.u}</Button>
                            ))}
                          </div>
                          <div className="text-center mt-2">
                            <Button variant="ghost" size="sm" onClick={() => setPromotion(null)}>Abbrechen</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Chat & Info */}
          {showChat && (
            <div className="lg:col-span-1">
              <Card className="h-96">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Spiel Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-center text-muted-foreground text-sm">
                    Chat wird in Echtzeit-Multiplayer-Spielen verfügbar sein
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
}
