// @ts-nocheck
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { CyberpunkBackground } from '@/components/ui/cyberpunk-background'
import { useSocket } from '@/lib/socket-client'
import {
  Gamepad2,
  Play,
  Users,
  Trophy,
  Clock,
  Target,
  RotateCcw
} from 'lucide-react'

type Player = 1 | 2
type CellState = Player | null

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

interface MultiplayerGameState {
  players: {
    [playerId: string]: {
      id: string
      username: string
      playerNumber: Player
      isReady: boolean
      avatar?: string
    }
  }
  gameState: GameState
  gameStatus: 'waiting' | 'starting' | 'playing' | 'finished'
  winner: string | null
  roomId: string
  currentTurn?: string
}

const BOARD_ROWS = 6
const BOARD_COLS = 7
const CONNECT_COUNT = 4

const PLAYER_COLORS = {
  1: '#ff4444', // Red
  2: '#ffff44'  // Yellow
}

const PLAYER_NAMES = {
  1: 'Rot',
  2: 'Gelb'
}

interface MultiplayerConnect4Props {
  roomId: string
  onLeaveRoom: () => void
}

export default function MultiplayerConnect4({ roomId, onLeaveRoom }: MultiplayerConnect4Props) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()

  // Local game state
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

  // Multiplayer state
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerGameState>({
    players: {},
    gameState: gameState,
    gameStatus: 'waiting',
    winner: null,
    roomId
  })

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [myPlayerNumber, setMyPlayerNumber] = useState<Player | null>(null)

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

  // Handle move
  const makeMove = useCallback((col: number) => {
    if (!socket || !session?.user?.id || gameState.isGameOver) return
    if (multiplayerState.gameStatus !== 'playing') return
    if (multiplayerState.currentTurn !== session.user.id) return
    if (myPlayerNumber === null) return

    const result = dropPiece(gameState.board, col, myPlayerNumber)
    if (!result) return

    const { newBoard, row } = result
    const isWinner = checkWinner(newBoard, row, col, myPlayerNumber)
    const isDraw = !isWinner && isBoardFull(newBoard)
    const isGameOver = isWinner || isDraw

    const moveData = {
      col,
      player: myPlayerNumber,
      board: newBoard,
      isWinner,
      isDraw,
      isGameOver,
      moves: gameState.moves + 1
    }

    // Send move to server
    socket.emit('game:move', {
      roomId,
      move: {
        type: 'connect4_move',
        ...moveData
      }
    })

  }, [socket, session?.user?.id, gameState, multiplayerState, myPlayerNumber, dropPiece, checkWinner, isBoardFull, roomId])

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

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleGameState = (data: any) => {
      if (data.roomId === roomId) {
        setMultiplayerState(prev => ({
          ...prev,
          ...data
        }))

        if (data.gameState) {
          setGameState(data.gameState)
        }

        // Set my player number
        if (data.players && session?.user?.id && data.players[session.user.id]) {
          setMyPlayerNumber(data.players[session.user.id].playerNumber)
        }
      }
    }

    const handleGameMove = (data: any) => {
      if (data.roomId === roomId && data.move) {
        const { move } = data

        if (move.type === 'connect4_move') {
          setGameState(prev => ({
            ...prev,
            board: move.board,
            currentPlayer: move.player === 1 ? 2 : 1,
            winner: move.isWinner ? move.player : null,
            isDraw: move.isDraw,
            isGameOver: move.isGameOver,
            moves: move.moves,
            endTime: move.isGameOver ? Date.now() : null
          }))

          if (move.isGameOver) {
            setMultiplayerState(prev => ({
              ...prev,
              gameStatus: 'finished',
              winner: move.isWinner ? data.playerId : null
            }))
          }
        } else if (move.type === 'game_start') {
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
          setMultiplayerState(prev => ({
            ...prev,
            gameStatus: 'playing'
          }))
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
    socket.emit('game:join', { roomId, gameType: 'connect4' })

    return () => {
      socket.off('game:state_update', handleGameState)
      socket.off('game:move', handleGameMove)
    }
  }, [socket, isConnected, roomId, session?.user?.id])

  // Render game board
  const renderBoard = () => {
    const isMyTurn = multiplayerState.currentTurn === session?.user?.id && multiplayerState.gameStatus === 'playing'

    return (
      <div className="bg-blue-800 p-4 rounded-lg border-4 border-blue-600 shadow-lg">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: BOARD_COLS }, (_, col) => (
            <div key={col} className="flex flex-col gap-2">
              {/* Column header for move preview */}
              <div
                className={`h-12 w-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center transition-colors ${
                  isMyTurn ? 'cursor-pointer hover:bg-gray-200/20' : 'cursor-not-allowed opacity-50'
                }`}
                onMouseEnter={() => isMyTurn && setHoveredColumn(col)}
                onMouseLeave={() => setHoveredColumn(null)}
                onClick={() => isMyTurn && makeMove(col)}
              >
                {hoveredColumn === col && isMyTurn && myPlayerNumber && gameState.board[0][col] === null && (
                  <div
                    className="w-10 h-10 rounded-full border-2"
                    style={{
                      backgroundColor: PLAYER_COLORS[myPlayerNumber],
                      opacity: 0.7
                    }}
                  />
                )}
              </div>

              {/* Column cells */}
              {Array.from({ length: BOARD_ROWS }, (_, row) => (
                <div
                  key={`${row}-${col}`}
                  className={`w-12 h-12 bg-blue-900 rounded-full border-2 border-blue-700 flex items-center justify-center transition-colors ${
                    isMyTurn ? 'cursor-pointer hover:bg-blue-800' : ''
                  }`}
                  onClick={() => isMyTurn && makeMove(col)}
                >
                  {gameState.board[row][col] && (
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white/30 shadow-lg"
                      style={{ backgroundColor: PLAYER_COLORS[gameState.board[row][col]!] }}
                    />
                  )}
                </div>
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

  const currentPlayerInfo = gameState.currentPlayer && multiplayerState.players ?
    Object.values(multiplayerState.players).find(p => p.playerNumber === gameState.currentPlayer) : null

  const myInfo = session?.user?.id ? multiplayerState.players[session.user.id] : null
  const opponentInfo = Object.values(multiplayerState.players).find(p => p.id !== session?.user?.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <CyberpunkBackground intensity={0.3} />

      <div className="relative z-10 container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="w-8 h-8 text-blue-400" />
            MULTIPLAYER CONNECT 4
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
          {/* Game Board */}
          <div className="flex-1">
            <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
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

                  {/* Current Player Indicator */}
                  {multiplayerState.gameStatus === 'playing' && currentPlayerInfo && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white/30"
                          style={{ backgroundColor: PLAYER_COLORS[gameState.currentPlayer] }}
                        />
                        <span className="text-white font-semibold">
                          {currentPlayerInfo.id === session?.user?.id ? 'Du bist dran' : `${currentPlayerInfo.username} ist dran`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Game Board */}
                  {renderBoard()}

                  {/* Game Controls */}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={onLeaveRoom} variant="outline" className="bg-red-600/20 border-red-400 text-red-200">
                      Raum verlassen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-80 space-y-4">
            {/* Players */}
            <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Spieler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myInfo && (
                  <div className="flex items-center justify-between p-2 bg-blue-900/30 rounded">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: myInfo.playerNumber ? PLAYER_COLORS[myInfo.playerNumber] : '#gray' }}
                      />
                      <span className="text-white font-medium">{myInfo.username} (Du)</span>
                    </div>
                    <Badge variant={myInfo.isReady ? 'default' : 'outline'}>
                      {myInfo.isReady ? 'Bereit' : 'Nicht bereit'}
                    </Badge>
                  </div>
                )}

                {opponentInfo && (
                  <div className="flex items-center justify-between p-2 bg-purple-900/30 rounded">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: opponentInfo.playerNumber ? PLAYER_COLORS[opponentInfo.playerNumber] : '#gray' }}
                      />
                      <span className="text-white font-medium">{opponentInfo.username}</span>
                    </div>
                    <Badge variant={opponentInfo.isReady ? 'default' : 'outline'}>
                      {opponentInfo.isReady ? 'Bereit' : 'Nicht bereit'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Game Info */}
            {multiplayerState.gameStatus === 'playing' && (
              <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Aktuelles Spiel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Züge:</span>
                    <span className="text-white">{gameState.moves}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Zeit:</span>
                    <span className="text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(
                        (gameState.endTime || Date.now()) - gameState.startTime
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Modus:</span>
                    <Badge variant="outline" className="border-blue-400 text-blue-300">
                      Multiplayer
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How to Play */}
            <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-blue-400">Spielregeln</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-300 space-y-2">
                <p>• Klicke auf eine Spalte, um deinen Spielstein zu platzieren</p>
                <p>• Verbinde 4 Steine in einer Reihe, um zu gewinnen</p>
                <p>• Verbindungen können horizontal, vertikal oder diagonal sein</p>
                <p>• Blockiere deinen Gegner und baue eigene Verbindungen auf</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Over Modal */}
        {multiplayerState.gameStatus === 'finished' && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="bg-gray-900 border-blue-500 max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-center">
                  {gameState.isDraw ? (
                    <span className="text-yellow-400">Unentschieden!</span>
                  ) : multiplayerState.winner === session?.user?.id ? (
                    <span className="text-green-400">Du hast gewonnen!</span>
                  ) : (
                    <span className="text-red-400">Du hast verloren!</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-white">
                    Spiel beendet nach <span className="text-blue-400 font-bold">{gameState.moves}</span> Zügen
                  </p>
                  <p className="text-white">
                    Spieldauer: <span className="text-purple-400 font-mono">
                      {formatTime(gameState.endTime! - gameState.startTime)}
                    </span>
                  </p>
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