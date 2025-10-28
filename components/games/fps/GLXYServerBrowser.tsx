// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { io, Socket } from 'socket.io-client'

// Interfaces
export interface ServerInfo {
  id: string
  name: string
  map: string
  mode: 'deathmatch' | 'team deathmatch' | 'capture the flag' | 'search and destroy' | 'battle royale'
  maxPlayers: number
  currentPlayers: number
  ping: number
  region: string
  hasPassword: boolean
  isRanked: boolean
  isVoted: boolean
  hostName: string
  uptime: number
  score: {
    team1: number
    team2: number
  }
  gameStatus: 'waiting' | 'in-progress' | 'finished'
  rules: {
    friendlyFire: boolean
    autoBalance: boolean
    roundTime: number
    scoreLimit: number
  }
  mods: string[]
  version: string
  tags: string[]
}

export interface RoomSettings {
  name: string
  map: string
  mode: ServerInfo['mode']
  maxPlayers: number
  password?: string
  isRanked: boolean
  isPrivate: boolean
  rules: {
    friendlyFire: boolean
    autoBalance: boolean
    roundTime: number
    scoreLimit: number
  }
  mods: string[]
}

export interface PlayerProfile {
  id: string
  username: string
  level: number
  rank: string
  avatar: string
  stats: {
    kills: number
    deaths: number
    wins: number
    losses: number
    kd: number
    winRate: number
  }
  prestige: number
  achievements: string[]
  loadout: {
    primary: string
    secondary: string
    melee: string
    tactical: string
    lethal: string
  }
}

export interface QuickMatchPreferences {
  modes: ServerInfo['mode'][]
  maps: string[]
  region: string
  maxPing: number
  rankedOnly: boolean
  hideFull: boolean
  hidePassword: boolean
  minPlayers: number
}

// Main Server Browser Component
export const GLXYServerBrowser: React.FC = () => {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([])
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedMode, setSelectedMode] = useState('all')
  const [showPasswordOnly, setShowPasswordOnly] = useState(false)
  const [showRankedOnly, setShowRankedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'players' | 'ping' | 'name' | 'uptime'>('players')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null)

  // Create Room Modal State
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    name: '',
    map: 'dust2',
    mode: 'team deathmatch',
    maxPlayers: 10,
    password: '',
    isRanked: false,
    isPrivate: false,
    rules: {
      friendlyFire: false,
      autoBalance: true,
      roundTime: 300,
      scoreLimit: 75
    },
    mods: []
  })

  // Quick Match Modal State
  const [showQuickMatch, setShowQuickMatch] = useState(false)
  const [quickMatchSearching, setQuickMatchSearching] = useState(false)
  const [quickMatchPreferences, setQuickMatchPreferences] = useState<QuickMatchPreferences>({
    modes: ['team deathmatch', 'deathmatch'],
    maps: [],
    region: 'europe',
    maxPing: 100,
    rankedOnly: false,
    hideFull: true,
    hidePassword: false,
    minPlayers: 4
  })

  // Join Room Modal State
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [joinPassword, setJoinPassword] = useState('')
  const [joiningServer, setJoiningServer] = useState(false)

  // Maps and modes configuration
  const availableMaps = [
    { id: 'dust2', name: 'Dust II', image: '/maps/dust2.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'mirage', name: 'Mirage', image: '/maps/mirage.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'inferno', name: 'Inferno', image: '/maps/inferno.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'cache', name: 'Cache', image: '/maps/cache.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'overpass', name: 'Overpass', image: '/maps/overpass.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'vertigo', name: 'Vertigo', image: '/maps/vertigo.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'ancient', name: 'Ancient', image: '/maps/ancient.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'nuke', name: 'Nuke', image: '/maps/nuke.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'train', name: 'Train', image: '/maps/train.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'office', name: 'Office', image: '/maps/office.jpg', modes: ['hostage', 'team deathmatch'] },
    { id: 'italy', name: 'Italy', image: '/maps/italy.jpg', modes: ['hostage', 'team deathmatch'] },
    { id: 'assault', name: 'Assault', image: '/maps/assault.jpg', modes: ['hostage', 'team deathmatch'] },
    { id: 'militia', name: 'Militia', image: '/maps/militia.jpg', modes: ['hostage', 'team deathmatch'] },
    { id: 'aztec', name: 'Aztec', image: '/maps/aztec.jpg', modes: ['bomb', 'team deathmatch'] },
    { id: 'cobblestone', name: 'Cobblestone', image: '/maps/cobblestone.jpg', modes: ['bomb', 'team deathmatch'] }
  ]

  const gameModes = [
    { id: 'deathmatch', name: 'Deathmatch', icon: '⚔️', description: 'Free for all combat' },
    { id: 'team deathmatch', name: 'Team Deathmatch', icon: '👥', description: 'Team vs team combat' },
    { id: 'capture the flag', name: 'Capture the Flag', icon: '🚩', description: 'Steal enemy flag' },
    { id: 'search and destroy', name: 'Search & Destroy', icon: '💣', description: 'Bomb plant/defuse' },
    { id: 'battle royale', name: 'Battle Royale', icon: '👑', description: 'Last player standing' }
  ]

  const regions = [
    { id: 'europe', name: 'Europe', flag: '🇪🇺' },
    { id: 'north america', name: 'North America', flag: '🇺🇸' },
    { id: 'south america', name: 'South America', flag: '🇧🇷' },
    { id: 'asia', name: 'Asia', flag: '🇯🇵' },
    { id: 'oceania', name: 'Oceania', flag: '🇦🇺' },
    { id: 'middle east', name: 'Middle East', flag: '🇸🇦' },
    { id: 'africa', name: 'Africa', flag: '🇿🇦' }
  ]

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('', {
      path: '/api/socket/io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      upgrade: true
    })

    newSocket.on('connect', () => {
      setConnectionStatus('connected')
      console.log('Connected to server browser')
    })

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected')
      console.log('Disconnected from server browser')
    })

    newSocket.on('serversUpdated', (updatedServers: ServerInfo[]) => {
      setServers(updatedServers)
      setIsLoading(false)
    })

    newSocket.on('serverJoined', (serverId: string) => {
      console.log(`Joined server: ${serverId}`)
      // Transition to game screen
    })

    newSocket.on('quickMatchFound', (serverInfo: ServerInfo) => {
      setQuickMatchSearching(false)
      setSelectedServer(serverInfo)
      setShowJoinRoom(true)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  // Fetch servers periodically
  useEffect(() => {
    if (socket && connectionStatus === 'connected') {
      fetchServers()

      const interval = setInterval(() => {
        fetchServers()
      }, 30000) // Refresh every 30 seconds

      setRefreshInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    }

    return () => {} // Return empty cleanup function for else case
  }, [socket, connectionStatus])

  // Filter and sort servers
  useEffect(() => {
    let filtered = servers.filter(server => {
      // Search query filter
      if (searchQuery && !server.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !server.hostName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Region filter
      if (selectedRegion !== 'all' && server.region !== selectedRegion) {
        return false
      }

      // Mode filter
      if (selectedMode !== 'all' && server.mode !== selectedMode) {
        return false
      }

      // Password filter
      if (showPasswordOnly && !server.hasPassword) {
        return false
      }

      // Ranked filter
      if (showRankedOnly && !server.isRanked) {
        return false
      }

      return true
    })

    // Sort servers
    filtered.sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'players':
          compareValue = a.currentPlayers - b.currentPlayers
          break
        case 'ping':
          compareValue = a.ping - b.ping
          break
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'uptime':
          compareValue = a.uptime - b.uptime
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredServers(filtered)
  }, [servers, searchQuery, selectedRegion, selectedMode, showPasswordOnly, showRankedOnly, sortBy, sortOrder])

  const fetchServers = useCallback(async () => {
    try {
      const response = await fetch('/api/servers')
      const data = await response.json()
      setServers(data)
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    }
  }, [])

  const createRoom = useCallback(async () => {
    if (!socket || !roomSettings.name.trim()) return

    try {
      socket.emit('createRoom', roomSettings)
      setShowCreateRoom(false)
      // Reset room settings
      setRoomSettings({
        name: '',
        map: 'dust2',
        mode: 'team deathmatch',
        maxPlayers: 10,
        password: '',
        isRanked: false,
        isPrivate: false,
        rules: {
          friendlyFire: false,
          autoBalance: true,
          roundTime: 300,
          scoreLimit: 75
        },
        mods: []
      })
    } catch (error) {
      console.error('Failed to create room:', error)
    }
  }, [socket, roomSettings])

  const joinServer = useCallback(async (serverId: string, password?: string) => {
    if (!socket) return

    setJoiningServer(true)

    try {
      socket.emit('joinServer', { serverId, password })
      setShowJoinRoom(false)
      setJoinPassword('')
    } catch (error) {
      console.error('Failed to join server:', error)
      setJoiningServer(false)
    }
  }, [socket])

  const startQuickMatch = useCallback(async () => {
    if (!socket) return

    setQuickMatchSearching(true)

    try {
      socket.emit('quickMatch', quickMatchPreferences)
    } catch (error) {
      console.error('Failed to start quick match:', error)
      setQuickMatchSearching(false)
    }
  }, [socket, quickMatchPreferences])

  const getServerStatusColor = (status: ServerInfo['gameStatus']) => {
    switch (status) {
      case 'waiting': return 'text-green-400'
      case 'in-progress': return 'text-yellow-400'
      case 'finished': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getPingColor = (ping: number) => {
    if (ping < 50) return 'text-green-400'
    if (ping < 100) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getPlayerCountColor = (current: number, max: number) => {
    const ratio = current / max
    if (ratio < 0.5) return 'text-green-400'
    if (ratio < 0.8) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
              GLXY Server Browser
            </h1>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' :
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                  'bg-red-400'
                }`} />
                <span className="text-sm">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>
              <div className="text-gray-400">
                {filteredServers.length} servers found
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowQuickMatch(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105"
            >
              Quick Match
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Create Room
            </button>
            <button
              onClick={fetchServers}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search servers..."
                className="w-full px-4 py-2 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.flag} {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Game Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Modes</option>
                {gameModes.map(mode => (
                  <option key={mode.id} value={mode.id}>
                    {mode.icon} {mode.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-')
                  setSortBy(sort as any)
                  setSortOrder(order as any)
                }}
                className="w-full px-4 py-2 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="players-desc">Players (High to Low)</option>
                <option value="players-asc">Players (Low to High)</option>
                <option value="ping-asc">Ping (Low to High)</option>
                <option value="ping-desc">Ping (High to Low)</option>
                <option value="name-asc">Name (A to Z)</option>
                <option value="name-desc">Name (Z to A)</option>
                <option value="uptime-desc">Uptime (Long to Short)</option>
                <option value="uptime-asc">Uptime (Short to Long)</option>
              </select>
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswordOnly}
                onChange={(e) => setShowPasswordOnly(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Password Protected</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRankedOnly}
                onChange={(e) => setShowRankedOnly(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Ranked Only</span>
            </label>
          </div>
        </div>

        {/* Server List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-400">Loading servers...</p>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl">
              <p className="text-gray-400">No servers found matching your criteria</p>
            </div>
          ) : (
            filteredServers.map(server => (
              <div
                key={server.id}
                className={`bg-gray-800/50 backdrop-blur rounded-xl p-4 hover:bg-gray-700/50 transition-all cursor-pointer border-2 ${
                  selectedServer?.id === server.id ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => setSelectedServer(server)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{server.name}</h3>
                      {server.hasPassword && <span className="text-yellow-400">🔒</span>}
                      {server.isRanked && <span className="text-purple-400">🏆</span>}
                      <span className={`text-sm ${getServerStatusColor(server.gameStatus)}`}>
                        {server.gameStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span>{regions.find(r => r.id === server.region)?.flag} {server.region}</span>
                      <span>{gameModes.find(m => m.id === server.mode)?.icon} {server.mode}</span>
                      <span>🗺️ {server.map}</span>
                      <span>👤 {server.hostName}</span>
                      <span className={getPingColor(server.ping)}>📶 {server.ping}ms</span>
                      <span>⏱️ {Math.floor(server.uptime / 60)}min</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPlayerCountColor(server.currentPlayers, server.maxPlayers)}`}>
                        {server.currentPlayers}/{server.maxPlayers}
                      </div>
                      <div className="text-xs text-gray-400">Players</div>
                    </div>

                    {server.currentPlayers < server.maxPlayers && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedServer(server)
                          if (server.hasPassword) {
                            setShowJoinRoom(true)
                          } else {
                            joinServer(server.id)
                          }
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                        disabled={joiningServer}
                      >
                        {joiningServer ? 'Joining...' : 'Join'}
                      </button>
                    )}

                    {server.currentPlayers >= server.maxPlayers && (
                      <button
                        disabled
                        className="px-6 py-2 bg-gray-600 rounded-lg font-semibold cursor-not-allowed"
                      >
                        Full
                      </button>
                    )}
                  </div>
                </div>

                {/* Score Display for active games */}
                {server.gameStatus === 'in-progress' && (server.score.team1 > 0 || server.score.team2 > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-400">Team 1: {server.score.team1}</span>
                      <span className="text-red-400">Team 2: {server.score.team2}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomSettings.name}
                  onChange={(e) => setRoomSettings({...roomSettings, name: e.target.value})}
                  placeholder="Enter room name..."
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Map</label>
                  <select
                    value={roomSettings.map}
                    onChange={(e) => setRoomSettings({...roomSettings, map: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableMaps.map(map => (
                      <option key={map.id} value={map.id}>{map.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Game Mode</label>
                  <select
                    value={roomSettings.mode}
                    onChange={(e) => setRoomSettings({...roomSettings, mode: e.target.value as any})}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {gameModes.map(mode => (
                      <option key={mode.id} value={mode.id}>
                        {mode.icon} {mode.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Max Players</label>
                  <input
                    type="number"
                    min="2"
                    max="32"
                    value={roomSettings.maxPlayers}
                    onChange={(e) => setRoomSettings({...roomSettings, maxPlayers: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password (Optional)</label>
                  <input
                    type="password"
                    value={roomSettings.password}
                    onChange={(e) => setRoomSettings({...roomSettings, password: e.target.value})}
                    placeholder="Leave empty for public"
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomSettings.isRanked}
                    onChange={(e) => setRoomSettings({...roomSettings, isRanked: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Ranked Match</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomSettings.isPrivate}
                    onChange={(e) => setRoomSettings({...roomSettings, isPrivate: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Private Room</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomSettings.rules.friendlyFire}
                    onChange={(e) => setRoomSettings({
                      ...roomSettings,
                      rules: {...roomSettings.rules, friendlyFire: e.target.checked}
                    })}
                    className="w-4 h-4 rounded"
                  />
                  <span>Friendly Fire</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomSettings.rules.autoBalance}
                    onChange={(e) => setRoomSettings({
                      ...roomSettings,
                      rules: {...roomSettings.rules, autoBalance: e.target.checked}
                    })}
                    className="w-4 h-4 rounded"
                  />
                  <span>Auto Balance</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createRoom}
                disabled={!roomSettings.name.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Match Modal */}
      {showQuickMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-6">Quick Match</h2>

            {quickMatchSearching ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg mb-2">Finding match...</p>
                <p className="text-gray-400">Searching for best available server</p>
                <button
                  onClick={() => setQuickMatchSearching(false)}
                  className="mt-6 px-6 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Modes</label>
                  <div className="space-y-2">
                    {gameModes.map(mode => (
                      <label key={mode.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quickMatchPreferences.modes.includes(mode.id as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuickMatchPreferences({
                                ...quickMatchPreferences,
                                modes: [...quickMatchPreferences.modes, mode.id as any]
                              })
                            } else {
                              setQuickMatchPreferences({
                                ...quickMatchPreferences,
                                modes: quickMatchPreferences.modes.filter(m => m !== mode.id)
                              })
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span>{mode.icon} {mode.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <select
                    value={quickMatchPreferences.region}
                    onChange={(e) => setQuickMatchPreferences({...quickMatchPreferences, region: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {regions.map(region => (
                      <option key={region.id} value={region.id}>
                        {region.flag} {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Ping: {quickMatchPreferences.maxPing}ms</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={quickMatchPreferences.maxPing}
                    onChange={(e) => setQuickMatchPreferences({...quickMatchPreferences, maxPing: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={startQuickMatch}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    Start Search
                  </button>
                  <button
                    onClick={() => setShowQuickMatch(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinRoom && selectedServer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Join Server</h2>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">{selectedServer.name}</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>🗺️ {selectedServer.map}</p>
                <p>{gameModes.find(m => m.id === selectedServer.mode)?.icon} {selectedServer.mode}</p>
                <p>👥 {selectedServer.currentPlayers}/{selectedServer.maxPlayers} players</p>
                <p>📶 {selectedServer.ping}ms</p>
              </div>
            </div>

            {selectedServer.hasPassword && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter server password..."
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => joinServer(selectedServer.id, selectedServer.hasPassword ? joinPassword : undefined)}
                disabled={selectedServer.hasPassword && !joinPassword.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Server
              </button>
              <button
                onClick={() => {
                  setShowJoinRoom(false)
                  setJoinPassword('')
                }}
                className="flex-1 px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GLXYServerBrowser