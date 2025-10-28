"use client"

import { useState, useEffect } from 'react'
import { useSocket } from '@/lib/socket-client'
import { GameType } from '@/lib/game-state-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, Play, Search, Plus, Gamepad2 } from 'lucide-react'

interface GameRoom {
  id: string
  name: string
  gameType: GameType
  status: 'waiting' | 'playing' | 'finished'
  currentPlayers: number
  maxPlayers: number
  host: {
    id: string
    username: string
    avatar?: string
  }
  isPublic: boolean
  createdAt: string
}

interface RoomBrowserProps {
  gameType?: GameType
  onRoomJoin?: (roomId: string) => void
  onRoomCreate?: (roomData: any) => void
}

export function RoomBrowser({ gameType, onRoomJoin, onRoomCreate }: RoomBrowserProps) {
  const { socket, isConnected } = useSocket()
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  useEffect(() => {
    if (socket && isConnected) {
      // Request available rooms
      socket.emit('rooms:list', { gameType })

      // Listen for room updates
      socket.on('rooms:list', handleRoomsList)
      socket.on('room:created', handleRoomCreated)
      socket.on('room:updated', handleRoomUpdated)
      socket.on('room:deleted', handleRoomDeleted)

      return () => {
        socket.off('rooms:list', handleRoomsList)
        socket.off('room:created', handleRoomCreated)
        socket.off('room:updated', handleRoomUpdated)
        socket.off('room:deleted', handleRoomDeleted)
      }
    }
    
    // Return cleanup function even when socket is not connected
    return () => {}
  }, [socket, isConnected, gameType])

  const handleRoomsList = (data: { rooms: GameRoom[] }) => {
    setRooms(data.rooms)
    setLoading(false)
  }

  const handleRoomCreated = (room: GameRoom) => {
    setRooms(prev => [room, ...prev])
  }

  const handleRoomUpdated = (room: GameRoom) => {
    setRooms(prev => prev.map(r => r.id === room.id ? room : r))
  }

  const handleRoomDeleted = (data: { roomId: string }) => {
    setRooms(prev => prev.filter(r => r.id !== data.roomId))
  }

  const handleJoinRoom = (roomId: string) => {
    if (onRoomJoin) {
      onRoomJoin(roomId)
    }
  }

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return

    const roomData = {
      name: newRoomName.trim(),
      gameType: gameType || 'TETRIS',
      settings: {
        maxPlayers: 2,
        isPublic: true
      }
    }

    if (onRoomCreate) {
      onRoomCreate(roomData)
    }

    setNewRoomName('')
    setShowCreateForm(false)
  }

  const filteredRooms = rooms.filter(room => {
    if (gameType && room.gameType !== gameType) return false
    if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return room.isPublic && room.status === 'waiting'
  })

  const getGameTypeIcon = (type: GameType) => {
    switch (type) {
      case 'TETRIS':
        return '🧩'
      case 'CONNECT4':
        return '🔴'
      default:
        return '🎮'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-green-500'
      case 'playing':
        return 'bg-yellow-500'
      case 'finished':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Verbindung zum Server wird hergestellt...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Spielräume</h2>
          <p className="text-muted-foreground">
            Tritt einem Spiel bei oder erstelle einen neuen Raum
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Raum erstellen
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Spielräume durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Room Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neuen Raum erstellen</CardTitle>
            <CardDescription>
              Erstelle einen neuen Multiplayer-Raum für {gameType || 'Spiele'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raumname</label>
              <Input
                placeholder="Mein Spielraum"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
                Erstellen
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gaming-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Spielräume...</p>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Keine Spielräume gefunden</p>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Keine Räume entsprechen deiner Suche.' : 'Erstelle einen neuen Raum um zu beginnen.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ersten Raum erstellen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getGameTypeIcon(room.gameType)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{room.name}</h3>
                        <Badge variant="secondary">{room.gameType}</Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(room.status)}`} />
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.currentPlayers}/{room.maxPlayers}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(room.createdAt).toLocaleTimeString()}
                        </div>
                        <span>Host: {room.host.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={room.status === 'waiting' ? 'default' : 'secondary'}>
                      {room.status === 'waiting' ? 'Wartend' :
                       room.status === 'playing' ? 'Spielt' : 'Beendet'}
                    </Badge>

                    <Button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Beitreten
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default RoomBrowser