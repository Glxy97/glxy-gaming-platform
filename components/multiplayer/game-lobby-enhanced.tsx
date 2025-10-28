"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { CyberpunkBackground } from '@/components/ui/cyberpunk-background'
import { useSocket } from '@/lib/socket-client'
import MultiplayerTetris from '@/components/games/tetris/multiplayer-tetris'
import MultiplayerConnect4 from '@/components/games/connect4/multiplayer-connect4'
import MultiplayerTicTacToe from '@/components/games/tictactoe/multiplayer-tictactoe'
import {
  Gamepad2,
  Play,
  Users,
  Plus,
  Grid3X3,
  Target,
  Hash,
  Clock,
  RefreshCw,
  Search
} from 'lucide-react'

type GameType = 'tetris' | 'connect4' | 'tictactoe'

interface Room {
  id: string
  name: string
  gameType: GameType
  hostId: string
  host: {
    id: string
    username: string
    avatar?: string
  }
  players: Array<{
    id: string
    user: {
      id: string
      username: string
      avatar?: string
    }
    isReady: boolean
  }>
  maxPlayers: number
  isPublic: boolean
  settings: any
  status: 'waiting' | 'playing' | 'finished'
  createdAt: string
}

const GAME_CONFIG = {
  tetris: {
    name: 'Tetris',
    icon: Grid3X3,
    color: 'purple',
    maxPlayers: 4,
    description: 'Klassisches Block-Puzzle mit Multiplayer-Wertung'
  },
  connect4: {
    name: 'Connect 4',
    icon: Target,
    color: 'blue',
    maxPlayers: 2,
    description: 'Strategisches Vier-Gewinnt-Spiel'
  },
  tictactoe: {
    name: 'Tic Tac Toe',
    icon: Hash,
    color: 'indigo',
    maxPlayers: 2,
    description: 'Schnelles Drei-in-einer-Reihe-Spiel'
  }
}

export default function GameLobbyEnhanced() {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()

  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedGame, setSelectedGame] = useState<GameType>('tetris')
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'waiting' | 'playing'>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!isConnected) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Failed to load rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  // Create room
  const createRoom = useCallback(async () => {
    if (!socket || !session?.user?.id || !roomName.trim()) return

    const gameConfig = GAME_CONFIG[selectedGame]

    socket.emit('room:create', {
      name: roomName.trim(),
      gameType: selectedGame,
      settings: {
        maxPlayers: gameConfig.maxPlayers,
        isPublic: true
      }
    })

    setRoomName('')
    setIsCreatingRoom(false)
  }, [socket, session?.user?.id, roomName, selectedGame])

  // Join room
  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !session?.user?.id) return

    socket.emit('room:join', { roomId })
    setCurrentRoom(roomId)
  }, [socket, session?.user?.id])

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socket || !currentRoom) return

    socket.emit('room:leave', { roomId: currentRoom })
    setCurrentRoom(null)
  }, [socket, currentRoom])

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleRoomJoined = (data: any) => {
      setCurrentRoom(data.roomId)
      loadRooms() // Refresh room list
    }

    const handleRoomLeft = (data: any) => {
      if (data.roomId === currentRoom) {
        setCurrentRoom(null)
      }
      loadRooms() // Refresh room list
    }

    const handleRoomUpdated = (data: any) => {
      setRooms(prev => prev.map(room =>
        room.id === data.room.id ? { ...room, ...data.room } : room
      ))
    }

    socket.on('room:joined', handleRoomJoined)
    socket.on('room:left', handleRoomLeft)
    socket.on('room:updated', handleRoomUpdated)

    return () => {
      socket.off('room:joined', handleRoomJoined)
      socket.off('room:left', handleRoomLeft)
      socket.off('room:updated', handleRoomUpdated)
    }
  }, [socket, isConnected, currentRoom, loadRooms])

  // Load rooms on mount and connection
  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.host.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || room.status === filter
    return matchesSearch && matchesFilter
  })

  // If in a room, show the game component
  if (currentRoom) {
    const room = rooms.find(r => r.id === currentRoom)
    if (room) {
      switch (room.gameType) {
        case 'tetris':
          return <MultiplayerTetris roomId={currentRoom} onLeaveRoom={leaveRoom} />
        case 'connect4':
          return <MultiplayerConnect4 roomId={currentRoom} onLeaveRoom={leaveRoom} />
        case 'tictactoe':
          return <MultiplayerTicTacToe roomId={currentRoom} onLeaveRoom={leaveRoom} />
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <CyberpunkBackground intensity={0.3} />

      <div className="relative z-10 container mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="w-8 h-8 text-purple-400" />
            MULTIPLAYER LOBBY
          </h1>
          <p className="text-gray-300">Finde Spieler und erstelle Räume für deine Lieblingsspiele</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Verbunden' : 'Getrennt'}
            </Badge>
            <Badge className="bg-blue-600">
              <Users className="w-4 h-4 mr-1" />
              {filteredRooms.length} Räume
            </Badge>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Game Selection & Room Creation */}
          <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Neuen Raum erstellen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Game Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(GAME_CONFIG) as [GameType, typeof GAME_CONFIG.tetris][]).map(([gameType, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={gameType}
                      onClick={() => setSelectedGame(gameType)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedGame === gameType
                          ? `border-${config.color}-500 bg-${config.color}-500/20`
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-6 h-6 text-${config.color}-400`} />
                        <h3 className="font-semibold text-white">{config.name}</h3>
                      </div>
                      <p className="text-sm text-gray-300">{config.description}</p>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Max. {config.maxPlayers} Spieler
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Room Creation Form */}
              {isCreatingRoom ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Raum-Name eingeben..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                    className="flex-1"
                  />
                  <Button onClick={createRoom} disabled={!roomName.trim()}>
                    <Play className="w-4 h-4 mr-2" />
                    Erstellen
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingRoom(false)}>
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsCreatingRoom(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Raum für {GAME_CONFIG[selectedGame].name} erstellen
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Room Search & Filter */}
          <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Räume durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    size="sm"
                  >
                    Alle
                  </Button>
                  <Button
                    variant={filter === 'waiting' ? 'default' : 'outline'}
                    onClick={() => setFilter('waiting')}
                    size="sm"
                  >
                    Wartend
                  </Button>
                  <Button
                    variant={filter === 'playing' ? 'default' : 'outline'}
                    onClick={() => setFilter('playing')}
                    size="sm"
                  >
                    Laufend
                  </Button>
                  <Button variant="outline" onClick={loadRooms} size="sm" disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Keine Räume gefunden</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Versuche eine andere Suche' : 'Erstelle den ersten Raum!'}
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const gameConfig = GAME_CONFIG[room.gameType]
                const Icon = gameConfig.icon

                return (
                  <Card key={room.id} className="bg-black/50 border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Room Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 text-${gameConfig.color}-400`} />
                            <h3 className="font-semibold text-white truncate">{room.name}</h3>
                          </div>
                          <Badge
                            variant={room.status === 'waiting' ? 'default' : room.status === 'playing' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {room.status === 'waiting' ? 'Wartend' : room.status === 'playing' ? 'Laufend' : 'Beendet'}
                          </Badge>
                        </div>

                        {/* Game Info */}
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>{gameConfig.name}</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {room.players.length}/{room.maxPlayers}
                          </div>
                        </div>

                        {/* Host & Time */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Host: {room.host.username}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(room.createdAt).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Players */}
                        <div className="space-y-1">
                          {room.players.map((player) => (
                            <div key={player.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-300">{player.user.username}</span>
                              <Badge variant={player.isReady ? 'default' : 'outline'} className="text-xs">
                                {player.isReady ? 'Bereit' : 'Nicht bereit'}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        {/* Join Button */}
                        <Button
                          onClick={() => joinRoom(room.id)}
                          disabled={room.status !== 'waiting' || room.players.length >= room.maxPlayers}
                          className="w-full"
                          size="sm"
                        >
                          {room.status !== 'waiting' ? 'Spiel läuft' :
                           room.players.length >= room.maxPlayers ? 'Voll' : 'Beitreten'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}