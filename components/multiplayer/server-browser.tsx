// @ts-nocheck
'use client'

/**
 * GLXY Gaming Server Browser - Comprehensive Multiplayer Hub
 * Features:
 * - Server discovery and filtering
 * - Room creation and management
 * - Matchmaking system
 * - Real-time player counts
 * - Performance metrics
 * - Chat integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2, Users, Search, Plus, Play, Clock, Zap, Globe,
  Trophy, MessageSquare, Settings, RefreshCw, Shield, Wifi,
  Star, TrendingUp, Filter, ChevronRight, UserCheck, Eye
} from 'lucide-react'
import { useOptimizedSocket } from '@/lib/socket-client-optimized'
import { useOptimizedMultiplayer } from '@/lib/multiplayer-handler-optimized'
import { toast } from 'sonner'

// Types
interface GameServer {
  id: string
  name: string
  address: string
  region: string
  players: number
  maxPlayers: number
  rooms: number
  gameTypes: string[]
  latency: number
  isOnline: boolean
}

interface GameRoom {
  id: string
  name: string
  gameType: string
  players: number
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  isPublic: boolean
  host: string
  createdAt: number
  settings: any
}

interface MatchmakingTicket {
  ticket: string
  gameType: string
  status: 'searching' | 'found' | 'cancelled'
  joinedAt: number
}

const GAME_TYPES = [
  { id: 'FPS', name: 'FPS Enhanced Epic', icon: '🎯', color: 'bg-red-500' },
  { id: 'TETRIS', name: 'Tetris Battle 2025', icon: '🧱', color: 'bg-cyan-500' },
  { id: 'CONNECT4', name: 'Connect 4 2025', icon: '🔴', color: 'bg-yellow-500' },
  { id: 'TICTACTOE', name: 'TicTacToe Engine', icon: '❌', color: 'bg-blue-500' },
  { id: 'UNO', name: 'UNO Online', icon: '🎴', color: 'bg-green-500' },
  { id: 'CHESS', name: 'Enhanced Chess', icon: '♟️', color: 'bg-purple-500' },
  { id: 'RACING', name: 'Ultimate Racing 3D', icon: '🏎️', color: 'bg-orange-500' }
]

const REGIONS = ['EU', 'NA', 'ASIA', 'SA', 'OCE']

export function ServerBrowser() {
  const { data: session } = useSession()
  const { socket, isConnected, connectionState } = useOptimizedSocket({
    enableCompression: true,
    maxReconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  // State
  const [servers, setServers] = useState<GameServer[]>([])
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [selectedGameType, setSelectedGameType] = useState<string>('ALL')
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [matchmakingTickets, setMatchmakingTickets] = useState<MatchmakingTicket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Create room form state
  const [newRoomSettings, setNewRoomSettings] = useState({
    name: '',
    gameType: 'TETRIS',
    maxPlayers: 2,
    isPublic: true,
    gameMode: 'standard'
  })

  // Fetch servers and rooms
  const fetchServers = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/server/browser')
      const data = await response.json()
      setServers(data.servers || [])
    } catch (error) {
      console.error('Failed to fetch servers:', error)
      toast.error('Failed to fetch servers')
    } finally {
      setRefreshing(false)
    }
  }, [])

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/rooms')
      const data = await response.json()
      setRooms(data || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }, [])

  // Initialize and setup socket listeners
  useEffect(() => {
    if (!isConnected || !socket) return

    // Room management listeners
    socket.on('room:created', (data) => {
      toast.success(`Room "${data.room.name}" created!`)
      fetchRooms()
      setShowCreateRoom(false)
    })

    socket.on('room:joined', (data) => {
      toast.success(`Joined room: ${data.room.name}`)
    })

    socket.on('room:player_joined', (data) => {
      toast.info(`${data.player?.playerName || 'A player'} joined the room`)
      fetchRooms()
    })

    socket.on('room:player_left', (data) => {
      toast.info('A player left the room')
      fetchRooms()
    })

    socket.on('room:list_updated', () => {
      fetchRooms()
    })

    // Matchmaking listeners
    socket.on('matchmaking:joined', (data) => {
      setMatchmakingTickets(prev => [...prev, {
        ...data,
        gameType: selectedGameType,
        status: 'searching',
        joinedAt: Date.now()
      }])
      toast.info('Searching for opponent...')
    })

    socket.on('matchmaking:found', (data) => {
      setMatchmakingTickets(prev =>
        prev.map(ticket =>
          ticket.ticket === data.ticket
            ? { ...ticket, status: 'found' }
            : ticket
        )
      )
      toast.success('Match found! Loading game...')
    })

    socket.on('matchmaking:left', (data) => {
      setMatchmakingTickets(prev =>
        prev.filter(ticket => ticket.ticket !== data.ticket)
      )
      toast.info('Left matchmaking queue')
    })

    // Error handling
    socket.on('error', (error) => {
      toast.error(error.message || 'An error occurred')
    })

    // Initial fetch
    fetchServers()
    fetchRooms()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchServers()
      fetchRooms()
    }, 10000) // Update every 10 seconds

    return () => {
      clearInterval(interval)
      socket.off('room:created')
      socket.off('room:joined')
      socket.off('room:player_joined')
      socket.off('room:player_left')
      socket.off('room:list_updated')
      socket.off('matchmaking:joined')
      socket.off('matchmaking:found')
      socket.off('matchmaking:left')
      socket.off('error')
    }
  }, [isConnected, socket, fetchServers, fetchRooms, selectedGameType])

  // Filter servers and rooms
  const filteredServers = useMemo(() => {
    return servers.filter(server => {
      const matchesGameType = selectedGameType === 'ALL' ||
        server.gameTypes.includes(selectedGameType)
      const matchesRegion = selectedRegion === 'ALL' ||
        server.region === selectedRegion
      const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.address.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesGameType && matchesRegion && matchesSearch
    })
  }, [servers, selectedGameType, selectedRegion, searchQuery])

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesGameType = selectedGameType === 'ALL' || room.gameType === selectedGameType
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesGameType && matchesSearch
    })
  }, [rooms, selectedGameType, searchQuery])

  // Actions
  const createRoom = useCallback(async () => {
    if (!socket || !isConnected) {
      toast.error('Not connected to server')
      return
    }

    try {
      socket.emit('room:create', newRoomSettings)
    } catch (error) {
      console.error('Failed to create room:', error)
      toast.error('Failed to create room')
    }
  }, [socket, isConnected, newRoomSettings])

  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to server')
      return
    }

    socket.emit('room:join', { roomId })
  }, [socket, isConnected])

  const joinMatchmaking = useCallback((gameType: string) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to server')
      return
    }

    socket.emit('matchmaking:join', { gameType })
  }, [socket, isConnected])

  const leaveMatchmaking = useCallback((ticket: string) => {
    if (!socket || !isConnected) return

    socket.emit('matchmaking:leave')
    setMatchmakingTickets(prev => prev.filter(t => t.ticket !== ticket))
  }, [socket, isConnected])

  const getGameTypeInfo = (gameTypeId: string) => {
    return GAME_TYPES.find(type => type.id === gameTypeId) || GAME_TYPES[0]
  }

  const getServerHealth = (server: GameServer) => {
    const playerRatio = server.players / server.maxPlayers
    if (playerRatio > 0.8) return { color: 'text-red-500', text: 'Full' }
    if (playerRatio > 0.5) return { color: 'text-yellow-500', text: 'Busy' }
    return { color: 'text-green-500', text: 'Good' }
  }

  const formatLatency = (latency: number) => {
    if (latency < 50) return { color: 'text-green-500', text: `${latency}ms` }
    if (latency < 100) return { color: 'text-yellow-500', text: `${latency}ms` }
    return { color: 'text-red-500', text: `${latency}ms` }
  }

  const formatUptime = (createdAt: number) => {
    const diff = Date.now() - createdAt
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ago`
    return `${minutes}m ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            🌐 GLXY Server Browser
          </h1>
          <p className="text-gray-300 flex items-center justify-center gap-2">
            <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
            {isConnected ? 'Connected' : 'Disconnected'} •
            {connectionState.socketId && ` ID: ${connectionState.socketId.substring(0, 8)}...`}
          </p>
        </motion.div>

        {/* Filters and Search */}
        <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search servers or rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/60 border-purple-500/20 text-white"
                />
              </div>

              {/* Game Type Filter */}
              <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                <SelectTrigger className="bg-black/60 border-purple-500/20 text-white">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-purple-500/30">
                  <SelectItem value="ALL">All Games</SelectItem>
                  {GAME_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Region Filter */}
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="bg-black/60 border-purple-500/20 text-white">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-purple-500/30">
                  <SelectItem value="ALL">All Regions</SelectItem>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Refresh Button */}
              <Button
                onClick={() => {
                  fetchServers()
                  fetchRooms()
                }}
                disabled={refreshing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="servers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border-purple-500/30">
            <TabsTrigger value="servers" className="text-white data-[state=active]:bg-purple-600">
              <Globe className="h-4 w-4 mr-2" />
              Servers
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-white data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="matchmaking" className="text-white data-[state=active]:bg-purple-600">
              <Zap className="h-4 w-4 mr-2" />
              Matchmaking
            </TabsTrigger>
          </TabsList>

          {/* Servers Tab */}
          <TabsContent value="servers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredServers.map((server) => {
                const health = getServerHealth(server)
                const latency = formatLatency(server.latency)
                const gameTypeInfo = getGameTypeInfo(server.gameTypes[0] || 'FPS')

                return (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{server.name}</h3>
                            <p className="text-gray-400 text-sm">{server.address}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`${gameTypeInfo.color} text-white`}>
                              {gameTypeInfo.icon} {gameTypeInfo.name}
                            </Badge>
                            <Badge variant="outline" className={health.color}>
                              {health.text}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">Players</span>
                            </div>
                            <div className="text-white font-semibold">
                              {server.players}/{server.maxPlayers}
                            </div>
                            <Progress
                              value={(server.players / server.maxPlayers) * 100}
                              className="h-2 mt-1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Wifi className="h-4 w-4" />
                              <span className="text-sm">Latency</span>
                            </div>
                            <div className={`font-semibold ${latency.color}`}>
                              {latency.text}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Gamepad2 className="h-3 w-3" />
                              {server.rooms} rooms
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {server.region}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            disabled={!server.isOnline}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                          >
                            {server.isOnline ? 'Connect' : 'Offline'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Available Rooms</h2>
              <Button
                onClick={() => setShowCreateRoom(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRooms.map((room) => {
                const gameTypeInfo = getGameTypeInfo(room.gameType)
                const isJoinable = room.status === 'waiting' && room.players < room.maxPlayers

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{room.name}</h3>
                            <p className="text-gray-400 text-sm">
                              Created {formatUptime(room.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`${gameTypeInfo.color} text-white`}>
                              {gameTypeInfo.icon} {gameTypeInfo.name}
                            </Badge>
                            <Badge variant={
                              room.status === 'waiting' ? 'default' :
                              room.status === 'playing' ? 'destructive' : 'secondary'
                            }>
                              {room.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">Players</span>
                            </div>
                            <div className="text-white font-semibold">
                              {room.players}/{room.maxPlayers}
                            </div>
                            <Progress
                              value={(room.players / room.maxPlayers) * 100}
                              className="h-2 mt-1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Shield className="h-4 w-4" />
                              <span className="text-sm">Mode</span>
                            </div>
                            <div className="text-white font-semibold capitalize">
                              {room.settings?.gameMode || 'Standard'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {room.isPublic ? 'Public' : 'Private'}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Host
                            </span>
                          </div>
                          <Button
                            size="sm"
                            disabled={!isJoinable}
                            onClick={() => joinRoom(room.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                          >
                            {isJoinable ? 'Join' : room.status === 'playing' ? 'In Game' : 'Full'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Create Room Modal */}
            <AnimatePresence>
              {showCreateRoom && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                  onClick={() => setShowCreateRoom(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-black/90 backdrop-blur-xl border-purple-500/30 rounded-lg p-6 max-w-md w-full mx-4"
                  >
                    <h3 className="text-2xl font-bold text-white mb-4">Create Room</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Room Name</label>
                        <Input
                          value={newRoomSettings.name}
                          onChange={(e) => setNewRoomSettings(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter room name..."
                          className="bg-black/60 border-purple-500/20 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Game Type</label>
                        <Select
                          value={newRoomSettings.gameType}
                          onValueChange={(value) => setNewRoomSettings(prev => ({ ...prev, gameType: value }))}
                        >
                          <SelectTrigger className="bg-black/60 border-purple-500/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 border-purple-500/30">
                            {GAME_TYPES.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center gap-2">
                                  <span>{type.icon}</span>
                                  <span>{type.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Max Players</label>
                        <Select
                          value={newRoomSettings.maxPlayers.toString()}
                          onValueChange={(value) => setNewRoomSettings(prev => ({ ...prev, maxPlayers: parseInt(value) }))}
                        >
                          <SelectTrigger className="bg-black/60 border-purple-500/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 border-purple-500/30">
                            <SelectItem value="2">2 Players</SelectItem>
                            <SelectItem value="4">4 Players</SelectItem>
                            <SelectItem value="8">8 Players</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={newRoomSettings.isPublic}
                          onChange={(e) => setNewRoomSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="isPublic" className="text-gray-300 text-sm">
                          Public room (visible in server browser)
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={() => setShowCreateRoom(false)}
                        variant="outline"
                        className="border-gray-500 text-gray-300 hover:bg-gray-500/20"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createRoom}
                        disabled={!newRoomSettings.name.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Create Room
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Matchmaking Tab */}
          <TabsContent value="matchmaking" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Quick Match</h2>
              <p className="text-gray-300">Get matched with players of similar skill level</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {GAME_TYPES.map((gameType) => (
                <motion.div
                  key={gameType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: GAME_TYPES.indexOf(gameType) * 0.1 }}
                >
                  <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all">
                    <CardContent className="p-6 text-center">
                      <div className="text-6xl mb-4">{gameType.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{gameType.name}</h3>
                      <p className="text-gray-400 mb-6">Competitive {gameType.name.toLowerCase()} matches</p>

                      <Button
                        onClick={() => joinMatchmaking(gameType.id)}
                        disabled={matchmakingTickets.some(t => t.gameType === gameType.id)}
                        className={`w-full ${gameType.color} hover:opacity-90 disabled:opacity-50`}
                      >
                        {matchmakingTickets.some(t => t.gameType === gameType.id) ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Find Match
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Active Matchmaking Tickets */}
            {matchmakingTickets.length > 0 && (
              <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Active Matchmaking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {matchmakingTickets.map((ticket) => {
                      const gameTypeInfo = getGameTypeInfo(ticket.gameType)
                      const searchTime = Math.floor((Date.now() - ticket.joinedAt) / 1000)

                      return (
                        <div
                          key={ticket.ticket}
                          className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-purple-500/20"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">{gameTypeInfo.icon}</div>
                            <div>
                              <h4 className="text-white font-semibold">{gameTypeInfo.name}</h4>
                              <p className="text-gray-400 text-sm">
                                Searching for {searchTime}s...
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => leaveMatchmaking(ticket.ticket)}
                            className="border-red-500 text-red-500 hover:bg-red-500/20"
                          >
                            Cancel
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}