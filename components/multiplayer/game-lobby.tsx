"use client"

import { useState, useEffect } from 'react'
import { useSocket } from '@/lib/socket-client'
import { GameType } from '@/lib/game-state-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Crown,
  Check,
  Clock,
  MessageCircle,
  Send,
  Settings,
  Play,
  LogOut,
  Copy,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Player {
  id: string
  username: string
  avatar?: string
  isReady: boolean
  isHost: boolean
}

interface ChatMessage {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  message: string
  timestamp: string
}

interface GameLobbyProps {
  roomId: string
  gameType: GameType
  onGameStart?: () => void
  onLeaveRoom?: () => void
}

export function GameLobby({ roomId, gameType, onGameStart, onLeaveRoom }: GameLobbyProps) {
  const { socket, isConnected } = useSocket()
  const [players, setPlayers] = useState<Player[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [gameStarting, setGameStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (socket && isConnected && roomId) {
      // Listen for room events
      socket.on('room:updated', handleRoomUpdated)
      socket.on('room:player_ready', handlePlayerReady)
      socket.on('game:started', handleGameStarted)
      socket.on('chat:message', handleChatMessage)
      socket.on('room:left', handlePlayerLeft)

      // Request current room state
      socket.emit('room:get_state', { roomId })

      return () => {
        socket.off('room:updated', handleRoomUpdated)
        socket.off('room:player_ready', handlePlayerReady)
        socket.off('game:started', handleGameStarted)
        socket.off('chat:message', handleChatMessage)
        socket.off('room:left', handlePlayerLeft)
      }
    }
    
    // Return cleanup function even when socket is not connected
    return () => {}
  }, [socket, isConnected, roomId])

  const handleRoomUpdated = (data: any) => {
    if (data.roomId === roomId) {
      setRoomName(data.room.name)
      setPlayers(data.room.players.map((p: any) => ({
        id: p.user.id,
        username: p.user.username,
        avatar: p.user.avatar,
        isReady: p.isReady,
        isHost: p.user.id === data.room.hostId
      })))

      // Check if current user is host
      const currentUser = data.room.players.find((p: any) => p.user.id === socket?.id)
      setIsHost(currentUser?.user.id === data.room.hostId)
    }
  }

  const handlePlayerReady = (data: any) => {
    if (data.roomId === roomId) {
      setPlayers(prev => prev.map(p =>
        p.id === data.userId ? { ...p, isReady: data.isReady } : p
      ))
    }
  }

  const handleGameStarted = (data: any) => {
    if (data.roomId === roomId) {
      setGameStarting(false)
      if (onGameStart) {
        onGameStart()
      }
    }
  }

  const handleChatMessage = (data: any) => {
    if (data.roomId === roomId) {
      setMessages(prev => [...prev, {
        id: data.id,
        user: data.user,
        message: data.message,
        timestamp: data.timestamp
      }])
    }
  }

  const handlePlayerLeft = (data: any) => {
    if (data.roomId === roomId) {
      setPlayers(prev => prev.filter(p => p.id !== data.userId))
    }
  }

  const toggleReady = () => {
    if (socket) {
      const newReadyState = !isReady
      setIsReady(newReadyState)
      socket.emit('room:ready', {
        roomId,
        isReady: newReadyState
      })
    }
  }

  const startGame = () => {
    if (socket && isHost) {
      const allPlayersReady = players.every(p => p.isReady || p.isHost)
      const minPlayers = 2

      if (players.length < minPlayers) {
        toast.error(`Mindestens ${minPlayers} Spieler erforderlich`)
        return
      }

      if (!allPlayersReady) {
        toast.error('Alle Spieler müssen bereit sein')
        return
      }

      setGameStarting(true)
      socket.emit('game:start', { roomId })
    }
  }

  const sendMessage = () => {
    if (socket && newMessage.trim()) {
      socket.emit('chat:send', {
        roomId,
        message: newMessage.trim(),
        type: 'room'
      })
      setNewMessage('')
    }
  }

  const leaveRoom = () => {
    if (socket) {
      socket.emit('room:leave', { roomId })
      if (onLeaveRoom) {
        onLeaveRoom()
      }
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    toast.success('Raum-ID kopiert!')
    setTimeout(() => setCopied(false), 2000)
  }

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

  const allPlayersReady = players.length >= 2 && players.every(p => p.isReady || p.isHost)

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Lobby Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Room Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getGameTypeIcon(gameType)}</span>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {roomName || 'Spielraum'}
                    <Badge variant="secondary">{gameType}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    Raum-ID: {roomId}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyRoomId}
                      className="h-6 px-2"
                    >
                      {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={leaveRoom} className="gap-2">
                <LogOut className="w-4 h-4" />
                Verlassen
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Spieler ({players.length}/2)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback>
                        {player.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.username}</span>
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.isReady ? (
                      <Badge variant="default" className="gap-1">
                        <Check className="w-3 h-3" />
                        Bereit
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" />
                        Wartet
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 2 - players.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center justify-center p-3 border-2 border-dashed border-muted rounded-lg">
                  <span className="text-muted-foreground">Warten auf Spieler...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ready/Start Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isHost && (
                  <Button
                    onClick={toggleReady}
                    variant={isReady ? "default" : "outline"}
                    className="gap-2"
                  >
                    {isReady ? (
                      <>
                        <Check className="w-4 h-4" />
                        Bereit
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Bereit werden
                      </>
                    )}
                  </Button>
                )}

                {isHost && (
                  <Button
                    onClick={startGame}
                    disabled={!allPlayersReady || gameStarting}
                    className="gap-2"
                  >
                    {gameStarting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Startet...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Spiel starten
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                {!allPlayersReady && players.length >= 2 && 'Alle Spieler müssen bereit sein'}
                {players.length < 2 && 'Warten auf mehr Spieler...'}
                {allPlayersReady && isHost && 'Bereit zum Starten!'}
                {allPlayersReady && !isHost && 'Warten auf Host...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Sidebar */}
      <div className="space-y-4">
        <Card className="h-[500px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3 p-3">
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={msg.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {msg.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{msg.user.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Nachricht eingeben..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default GameLobby