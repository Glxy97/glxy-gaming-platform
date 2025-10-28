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

type Player = 'X' | 'O'
type CellState = Player | null

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

interface MultiplayerGameState {
  players: {
    [playerId: string]: {
      id: string
      username: string
      symbol: Player
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

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
]

interface MultiplayerTicTacToeProps {
  roomId: string
  onLeaveRoom: () => void
}

export default function MultiplayerTicTacToe({ roomId, onLeaveRoom }: MultiplayerTicTacToeProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()

  // Local game state
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

  // Multiplayer state
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerGameState>({
    players: {},
    gameState: gameState,
    gameStatus: 'waiting',
    winner: null,
    roomId
  })

  const [isReady, setIsReady] = useState(false)
  const [mySymbol, setMySymbol] = useState<Player | null>(null)

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

  // Handle move
  const makeMove = useCallback((index: number) => {
    if (!socket || !session?.user?.id || gameState.isGameOver) return
    if (multiplayerState.gameStatus !== 'playing') return
    if (multiplayerState.currentTurn !== session.user.id) return
    if (mySymbol === null || gameState.board[index] !== null) return

    const newBoard = [...gameState.board]
    newBoard[index] = mySymbol

    const winner = checkWinner(newBoard)
    const isDraw = !winner && isBoardFull(newBoard)
    const isGameOver = winner !== null || isDraw

    const moveData = {
      index,
      symbol: mySymbol,
      board: newBoard,
      winner,
      isDraw,
      isGameOver,
      moves: gameState.moves + 1
    }

    // Send move to server
    socket.emit('game:move', {
      roomId,
      move: {
        type: 'tictactoe_move',
        ...moveData
      }
    })

  }, [socket, session?.user?.id, gameState, multiplayerState, mySymbol, checkWinner, isBoardFull, roomId])

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

        // Set my symbol
        if (data.players && session?.user?.id && data.players[session.user.id]) {
          setMySymbol(data.players[session.user.id].symbol)
        }
      }
    }

    const handleGameMove = (data: any) => {
      if (data.roomId === roomId && data.move) {
        const { move } = data

        if (move.type === 'tictactoe_move') {
          setGameState(prev => ({
            ...prev,
            board: move.board,
            currentPlayer: move.symbol === 'X' ? 'O' : 'X',
            winner: move.winner,
            isDraw: move.isDraw,
            isGameOver: move.isGameOver,
            moves: move.moves,
            endTime: move.isGameOver ? Date.now() : null
          }))

          if (move.isGameOver) {
            setMultiplayerState(prev => ({
              ...prev,
              gameStatus: 'finished',
              winner: move.winner ? data.playerId : null
            }))
          }
        } else if (move.type === 'game_start') {
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
    socket.emit('game:join', { roomId, gameType: 'tictactoe' })

    return () => {
      socket.off('game:state_update', handleGameState)
      socket.off('game:move', handleGameMove)
    }
  }, [socket, isConnected, roomId, session?.user?.id])

  // Render game board
  const renderBoard = () => {
    const isMyTurn = multiplayerState.currentTurn === session?.user?.id && multiplayerState.gameStatus === 'playing'

    return (
      <div className="grid grid-cols-3 gap-3 w-80 h-80 mx-auto">
        {gameState.board.map((cell, index) => (
          <button
            key={index}
            onClick={() => makeMove(index)}
            disabled={cell !== null || !isMyTurn || gameState.isGameOver}
            className={`w-24 h-24 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center text-4xl font-bold transition-all ${
              isMyTurn && !cell && !gameState.isGameOver
                ? 'hover:bg-gray-700 hover:border-gray-500 cursor-pointer'
                : 'cursor-not-allowed opacity-60'
            }`}
          >
            {cell && (
              <span className={cell === 'X' ? 'text-blue-400' : 'text-red-400'}>
                {cell}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const currentPlayerInfo = gameState.currentPlayer && multiplayerState.players ?
    Object.values(multiplayerState.players).find(p => p.symbol === gameState.currentPlayer) : null

  const myInfo = session?.user?.id ? multiplayerState.players[session.user.id] : null
  const opponentInfo = Object.values(multiplayerState.players).find(p => p.id !== session?.user?.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <CyberpunkBackground intensity={0.3} />

      <div className="relative z-10 container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="w-8 h-8 text-indigo-400" />
            MULTIPLAYER TIC TAC TOE
          </h1>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-indigo-600">
              <Users className="w-4 h-4 mr-1" />
              {Object.keys(multiplayerState.players).length} Spieler
            </Badge>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Verbunden' : 'Getrennt'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto">
          {/* Game Board */}
          <div className="flex-1">
            <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-6">
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
                        <span className={`text-2xl font-bold ${gameState.currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'}`}>
                          {gameState.currentPlayer}
                        </span>
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
            <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-indigo-400 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Spieler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myInfo && (
                  <div className="flex items-center justify-between p-2 bg-indigo-900/30 rounded">
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${myInfo.symbol === 'X' ? 'text-blue-400' : 'text-red-400'}`}>
                        {myInfo.symbol || '?'}
                      </span>
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
                      <span className={`text-xl font-bold ${opponentInfo.symbol === 'X' ? 'text-blue-400' : 'text-red-400'}`}>
                        {opponentInfo.symbol || '?'}
                      </span>
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
              <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-indigo-400 flex items-center gap-2">
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
                    <Badge variant="outline" className="border-indigo-400 text-indigo-300">
                      Multiplayer
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How to Play */}
            <Card className="bg-black/50 border-indigo-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-indigo-400">Spielregeln</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-300 space-y-2">
                <p>• Klicke auf ein leeres Feld, um dein Zeichen zu setzen</p>
                <p>• Verbinde 3 Zeichen in einer Reihe, um zu gewinnen</p>
                <p>• Verbindungen können horizontal, vertikal oder diagonal sein</p>
                <p>• Blockiere deinen Gegner und baue eigene Verbindungen auf</p>
                <p>• Das Spiel endet mit einem Sieg oder Unentschieden</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Over Modal */}
        {multiplayerState.gameStatus === 'finished' && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="bg-gray-900 border-indigo-500 max-w-md mx-4">
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
                <Button onClick={onLeaveRoom} className="bg-indigo-600 hover:bg-indigo-700">
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