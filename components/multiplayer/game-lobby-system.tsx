// @ts-nocheck
'use client'

/**
 * GLXY Gaming Lobby - Comprehensive Multiplayer Hub
 * Features:
 * - Real-time chat system
 * - Friends list and online status
 * - Game invitations
 * - Voice chat integration
 * - Spectator mode
 * - Room management
 * - Player profiles and stats
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Users, UserPlus, Settings, Mic, MicOff, Video, VideoOff,
  Phone, PhoneOff, Monitor, Crown, Shield, Swords, Zap, Star,
  Trophy, Clock, Send, Heart, Smile, Paperclip, MoreVertical,
  Volume2, VolumeX, Bell, BellOff, Search, Filter, ChevronDown,
  User, Gamepad2, Eye, LogOut, Check, X, AlertCircle, Globe
} from 'lucide-react'
import { useOptimizedSocket } from '@/lib/socket-client-optimized'
import { useOptimizedMultiplayer } from '@/lib/multiplayer-handler-optimized'
import { toast } from 'sonner'

// Types
interface Player {
  id: string
  username: string
  avatar?: string
  status: 'online' | 'offline' | 'away' | 'ingame'
  currentActivity?: string
  rank?: string
  level?: number
  stats?: {
    wins: number
    losses: number
    winRate: number
    favoriteGame: string
  }
  isFriend?: boolean
  isBlocked?: boolean
  isInVoiceChat?: boolean
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  type: 'text' | 'system' | 'invitation' | 'achievement'
  metadata?: any
}

interface GameInvitation {
  id: string
  fromPlayer: Player
  gameType: string
  roomName: string
  roomId: string
  timestamp: number
}

interface VoiceChannel {
  id: string
  name: string
  users: Player[]
  isLocked: boolean
  maxUsers: number
}

interface GameRoom {
  id: string
  name: string
  gameType: string
  host: Player
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'spectating'
  spectators: Player[]
  isPublic: boolean
  settings: any
  chat: ChatMessage[]
}

const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  away: 'bg-yellow-500',
  ingame: 'bg-purple-500'
}

const GAME_TYPES = [
  { id: 'FPS', name: 'FPS Enhanced Epic', icon: '🎯' },
  { id: 'TETRIS', name: 'Tetris Battle 2025', icon: '🧱' },
  { id: 'CONNECT4', name: 'Connect 4 2025', icon: '🔴' },
  { id: 'TICTACTOE', name: 'TicTacToe Engine', icon: '❌' },
  { id: 'UNO', name: 'UNO Online', icon: '🎴' },
  { id: 'CHESS', name: 'Enhanced Chess', icon: '♟️' },
  { id: 'RACING', name: 'Ultimate Racing 3D', icon: '🏎️' }
]

export function GameLobbySystem({ roomId, onLeave, onSpectate }: {
  roomId?: string
  onLeave?: () => void
  onSpectate?: (roomId: string) => void
}) {
  const { data: session } = useSession()
  const { socket, isConnected } = useOptimizedSocket()
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [friends, setFriends] = useState<Player[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [invitations, setInvitations] = useState<GameInvitation[]>([])
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([])
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    // Room events
    socket.on('room:updated', (data) => {
      if (data.room?.id === roomId) {
        setCurrentRoom(data.room)
      }
    })

    socket.on('room:chat_message', (message) => {
      setChatMessages(prev => [...prev, message])
    })

    socket.on('room:player_joined', (data) => {
      const systemMessage: ChatMessage = {
        id: `system_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        content: `${data.player?.username} joined the room`,
        timestamp: Date.now(),
        type: 'system'
      }
      setChatMessages(prev => [...prev, systemMessage])
    })

    socket.on('room:player_left', (data) => {
      const systemMessage: ChatMessage = {
        id: `system_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        content: `${data.playerName} left the room`,
        timestamp: Date.now(),
        type: 'system'
      }
      setChatMessages(prev => [...prev, systemMessage])
    })

    // Friend events
    socket.on('friend:online', (friend) => {
      setFriends(prev => prev.map(f =>
        f.id === friend.id ? { ...f, status: 'online' } : f
      ))
    })

    socket.on('friend:offline', (friendId) => {
      setFriends(prev => prev.map(f =>
        f.id === friendId ? { ...f, status: 'offline' } : f
      ))
    })

    socket.on('friend:request', (request) => {
      toast(`${request.username} wants to be your friend!`, {
        action: {
          label: 'Accept',
          onClick: () => acceptFriendRequest(request.id)
        }
      })
    })

    // Invitation events
    socket.on('invitation:received', (invitation) => {
      setInvitations(prev => [invitation, ...prev])
      toast(`Game invitation from ${invitation.fromPlayer.username}`, {
        action: {
          label: 'Join',
          onClick: () => acceptInvitation(invitation.id)
        }
      })
    })

    // Voice chat events
    socket.on('voice:channel_joined', (channelId) => {
      setCurrentVoiceChannel(channelId)
    })

    socket.on('voice:channel_left', () => {
      setCurrentVoiceChannel(null)
    })

    // Fetch initial data
    if (roomId) {
      socket.emit('room:join', { roomId })
    }

    return () => {
      socket.off('room:updated')
      socket.off('room:chat_message')
      socket.off('room:player_joined')
      socket.off('room:player_left')
      socket.off('friend:online')
      socket.off('friend:offline')
      socket.off('friend:request')
      socket.off('invitation:received')
      socket.off('voice:channel_joined')
      socket.off('voice:channel_left')
    }
  }, [socket, isConnected, roomId])

  // Fetch friends and online players
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // Mock data - would fetch from API
        const mockFriends: Player[] = [
          {
            id: '1',
            username: 'ProGamer123',
            avatar: '/avatars/1.jpg',
            status: 'online',
            rank: 'Diamond',
            level: 42,
            stats: { wins: 156, losses: 89, winRate: 63.6, favoriteGame: 'FPS' },
            isFriend: true,
            isInVoiceChat: true
          },
          {
            id: '2',
            username: 'ChessMaster',
            avatar: '/avatars/2.jpg',
            status: 'ingame',
            currentActivity: 'Playing Chess',
            rank: 'Grandmaster',
            level: 58,
            stats: { wins: 234, losses: 45, winRate: 83.9, favoriteGame: 'CHESS' },
            isFriend: true
          },
          {
            id: '3',
            username: 'TetrisKing',
            avatar: '/avatars/3.jpg',
            status: 'away',
            rank: 'Elite',
            level: 35,
            stats: { wins: 189, losses: 67, winRate: 73.8, favoriteGame: 'TETRIS' },
            isFriend: true
          }
        ]
        setFriends(mockFriends)
      } catch (error) {
        console.error('Failed to fetch friends:', error)
      }
    }

    const fetchOnlinePlayers = async () => {
      try {
        // Mock data - would fetch from API
        const mockPlayers: Player[] = [
          { id: '4', username: 'NewPlayer99', status: 'online', rank: 'Bronze', level: 5 },
          { id: '5', username: 'SpeedRunner', status: 'online', rank: 'Gold', level: 28 },
          { id: '6', username: 'CasualGamer', status: 'offline', rank: 'Silver', level: 15 }
        ]
        setOnlinePlayers(mockPlayers)
      } catch (error) {
        console.error('Failed to fetch online players:', error)
      }
    }

    fetchFriends()
    fetchOnlinePlayers()
  }, [])

  // Chat functions
  const sendMessage = useCallback(() => {
    if (!messageInput.trim() || !socket) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: session?.user?.id || 'unknown',
      senderName: session?.user?.name || 'Anonymous',
      content: messageInput.trim(),
      timestamp: Date.now(),
      type: 'text'
    }

    if (roomId) {
      socket.emit('room:send_message', { roomId, message })
    } else {
      socket.emit('global:send_message', message)
    }

    setChatMessages(prev => [...prev, message])
    setMessageInput('')
  }, [messageInput, socket, roomId, session])

  // Friend functions
  const sendFriendRequest = useCallback((playerId: string) => {
    if (!socket) return
    socket.emit('friend:request_send', { playerId })
    toast('Friend request sent!')
  }, [socket])

  const acceptFriendRequest = useCallback((requestId: string) => {
    if (!socket) return
    socket.emit('friend:request_accept', { requestId })
    toast('Friend request accepted!')
  }, [socket])

  // Invitation functions
  const sendInvitation = useCallback((playerId: string, gameType: string) => {
    if (!socket || !currentRoom) return

    const invitation: GameInvitation = {
      id: `inv_${Date.now()}`,
      fromPlayer: {
        id: session?.user?.id || 'unknown',
        username: session?.user?.name || 'Anonymous'
      } as Player,
      gameType,
      roomName: currentRoom.name,
      roomId: currentRoom.id,
      timestamp: Date.now()
    }

    socket.emit('invitation:send', { toPlayerId: playerId, invitation })
    toast('Invitation sent!')
  }, [socket, currentRoom, session])

  const acceptInvitation = useCallback((invitationId: string) => {
    const invitation = invitations.find(inv => inv.id === invitationId)
    if (invitation) {
      window.location.href = `/game/${invitation.gameType}?roomId=${invitation.roomId}`
    }
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
  }, [invitations])

  // Voice chat functions
  const joinVoiceChannel = useCallback((channelId: string) => {
    if (!socket) return
    socket.emit('voice:channel_join', { channelId })
  }, [socket])

  const leaveVoiceChannel = useCallback(() => {
    if (!socket) return
    socket.emit('voice:channel_leave')
  }, [socket])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
    // Would integrate with actual voice chat API
  }, [])

  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => !prev)
    if (!isDeafened) {
      setIsMuted(true)
    }
    // Would integrate with actual voice chat API
  }, [isDeafened])

  // Filtered players
  const filteredFriends = useMemo(() => {
    return friends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [friends, searchQuery])

  const filteredOnlinePlayers = useMemo(() => {
    return onlinePlayers.filter(player =>
      player.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !friends.some(friend => friend.id === player.id)
    )
  }, [onlinePlayers, friends, searchQuery])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getGameTypeInfo = (gameTypeId: string) => {
    return GAME_TYPES.find(type => type.id === gameTypeId) || GAME_TYPES[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Game Lobby
            </h1>
            {currentRoom && (
              <Badge className="bg-purple-600 text-white">
                {getGameTypeInfo(currentRoom.gameType)?.icon} {currentRoom.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Voice Controls */}
            <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2">
              <Button
                size="sm"
                variant={currentVoiceChannel ? "default" : "outline"}
                onClick={currentVoiceChannel ? leaveVoiceChannel : () => joinVoiceChannel('general')}
                className="h-8 w-8 p-0"
              >
                {currentVoiceChannel ? <Phone className="h-4 w-4" /> : <PhoneOff className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "outline"}
                onClick={toggleMute}
                className="h-8 w-8 p-0"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant={isDeafened ? "destructive" : "outline"}
                onClick={toggleDeafen}
                className="h-8 w-8 p-0"
              >
                {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Notifications */}
            <Button size="sm" variant="outline" className="relative">
              <Bell className="h-4 w-4" />
              {invitations.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
              )}
            </Button>

            {/* Leave Lobby */}
            {onLeave && (
              <Button size="sm" variant="outline" onClick={onLeave}>
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Friends & Players */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/60 border-purple-500/20 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Friends List */}
            <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between text-white">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Friends ({filteredFriends.filter(f => f.status !== 'offline').length})
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <UserPlus className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64">
                  <div className="space-y-1 p-2">
                    {filteredFriends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-black ${STATUS_COLORS[friend.status]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white font-medium truncate">
                              {friend.username}
                            </p>
                            {friend.isInVoiceChat && <Mic className="h-3 w-3 text-green-400" />}
                          </div>
                          {friend.rank && (
                            <p className="text-xs text-gray-400">{friend.rank} • Level {friend.level}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {friend.status === 'online' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => sendInvitation(friend.id, currentRoom?.gameType || 'TETRIS')}
                            >
                              <Gamepad2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Online Players */}
            <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <Globe className="h-4 w-4" />
                  Online ({filteredOnlinePlayers.filter(p => p.status === 'online').length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-48">
                  <div className="space-y-1 p-2">
                    {filteredOnlinePlayers.map((player) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{player.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-black ${STATUS_COLORS[player.status]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {player.username}
                          </p>
                          {player.rank && (
                            <p className="text-xs text-gray-400">{player.rank}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => sendFriendRequest(player.id)}
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Chat */}
          <div className="lg:col-span-2">
            <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30 h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {currentRoom ? `Room: ${currentRoom.name}` : 'Global Chat'}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentRoom && (
                      <>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          {currentRoom.players.length}/{currentRoom.maxPlayers} Players
                        </Badge>
                        {onSpectate && (
                          <Button size="sm" variant="outline" onClick={() => onSpectate(currentRoom.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Spectate
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.type === 'system' ? (
                          <div className="text-center">
                            <span className="text-xs text-gray-500 bg-black/40 rounded-full px-3 py-1">
                              {message.content}
                            </span>
                          </div>
                        ) : (
                          <div className={`max-w-[80%] ${message.senderId === session?.user?.id ? 'order-2' : 'order-1'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {message.senderId !== session?.user?.id && (
                                <span className="text-xs text-gray-400">{message.senderName}</span>
                              )}
                              <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                            </div>
                            <div className={`rounded-lg p-3 ${
                              message.senderId === session?.user?.id
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-white/10 text-white'
                            }`}>
                              {message.content}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-purple-500/20">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        ref={chatInputRef}
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        className="bg-black/60 border-purple-500/20 text-white pr-10"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Smile className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Room Info & Invitations */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Room */}
            {currentRoom && (
              <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Room Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Game</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getGameTypeInfo(currentRoom.gameType).icon}</span>
                      <span className="text-white font-medium">
                        {getGameTypeInfo(currentRoom.gameType).name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Players ({currentRoom.players.length})</p>
                    <div className="space-y-2">
                      {currentRoom.players.map((player) => (
                        <div key={player.id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback className="text-xs">{player.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">{player.username}</p>
                            {player.id === currentRoom.host.id && (
                              <Badge className="text-xs bg-yellow-600">Host</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentRoom.spectators.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Spectators ({currentRoom.spectators.length})</p>
                      <div className="space-y-1">
                        {currentRoom.spectators.map((spectator) => (
                          <div key={spectator.id} className="flex items-center gap-2 opacity-60">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs text-gray-300 truncate">{spectator.username}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game Invitations */}
            {invitations.length > 0 && (
              <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Game Invitations ({invitations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {invitations.map((invitation) => {
                    const gameType = getGameTypeInfo(invitation.gameType)
                    return (
                      <motion.div
                        key={invitation.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-white/5 rounded-lg border border-purple-500/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">{gameType.icon}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => setInvitations(prev => prev.filter(inv => inv.id !== invitation.id))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-white font-medium mb-1">
                          {invitation.fromPlayer.username}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          invites you to {gameType.name}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => acceptInvitation(invitation.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-500 text-red-500 hover:bg-red-500/20"
                            onClick={() => setInvitations(prev => prev.filter(inv => inv.id !== invitation.id))}
                          >
                            Decline
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Stats
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Find Players
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}