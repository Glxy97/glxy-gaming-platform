// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// Interfaces für Server Administration
export interface ServerConfig {
  id: string
  name: string
  map: string
  mode: string
  maxPlayers: number
  currentPlayers: number
  port: number
  region: string
  password?: string
  isRanked: boolean
  isPrivate: boolean
  rules: {
    friendlyFire: boolean
    autoBalance: boolean
    roundTime: number
    scoreLimit: number
  }
  performance: {
    tickRate: number
    maxLatency: number
    bandwidthLimit: number
    compressionEnabled: boolean
  }
  moderation: {
    allowVoting: boolean
    kickThreshold: number
    banDuration: number
    chatFilter: boolean
  }
}

export interface ServerPlayer {
  id: string
  username: string
  ip: string
  ping: number
  score: number
  kills: number
  deaths: number
  team: 'red' | 'blue' | 'spectator'
  isConnected: boolean
  isMuted: boolean
  isBanned: boolean
  joinTime: Date
  lastActive: Date
  warnings: number
  violations: {
    teamKilling: number
    cheating: number
    afk: number
    toxicity: number
  }
}

export interface ServerStats {
  uptime: number
  totalConnections: number
  activeConnections: number
  bandwidthUsage: {
    inbound: number
    outbound: number
  }
  cpuUsage: number
  memoryUsage: number
  tickRate: number
  averageLatency: number
  packetLoss: number
}

export interface ServerLog {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  userId?: string
  category: 'connection' | 'gameplay' | 'moderation' | 'system' | 'security'
  data?: any
}

// Server Admin Klasse
export class GLXYServerAdmin {
  private socket: Socket | null = null
  private isConnected = false
  private config: ServerConfig | null = null
  private players: Map<string, ServerPlayer> = new Map()
  private stats: ServerStats | null = null
  private logs: ServerLog[] = []
  private maxLogEntries = 1000

  // Admin Berechtigungen
  private permissions = {
    kick: true,
    ban: true,
    mute: true,
    changeMap: true,
    changeSettings: true,
    viewStats: true,
    manageBans: true,
    restart: true,
    shutdown: true
  }

  constructor(
    private serverUrl: string,
    private adminKey: string,
    private onPlayerConnected?: (player: ServerPlayer) => void,
    private onPlayerDisconnected?: (playerId: string) => void,
    private onConfigUpdated?: (config: ServerConfig) => void
  ) {}

  public async connect(): Promise<boolean> {
    try {
      this.socket = io(this.serverUrl, {
        auth: {
          adminKey: this.adminKey,
          type: 'admin'
        },
        transports: ['websocket']
      })

      this.setupSocketListeners()

      await this.waitForConnection()
      await this.authenticate()
      await this.fetchInitialData()

      console.log('🔧 Server Admin connected successfully!')
      return true
    } catch (error) {
      console.error('Failed to connect to server admin:', error)
      return false
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
  }

  // Spieler Management
  public async kickPlayer(playerId: string, reason: string): Promise<boolean> {
    if (!this.socket || !this.permissions.kick) return false

    try {
      this.socket.emit('adminKick', { playerId, reason })
      this.addLog('info', `Kicked player ${playerId}: ${reason}`, 'moderation', { playerId, reason })
      return true
    } catch (error) {
      console.error('Failed to kick player:', error)
      return false
    }
  }

  public async banPlayer(playerId: string, reason: string, duration: number = 86400000): Promise<boolean> {
    if (!this.socket || !this.permissions.ban) return false

    try {
      this.socket.emit('adminBan', { playerId, reason, duration })
      this.addLog('warning', `Banned player ${playerId} for ${duration}ms: ${reason}`, 'moderation', { playerId, reason, duration })
      return true
    } catch (error) {
      console.error('Failed to ban player:', error)
      return false
    }
  }

  public async mutePlayer(playerId: string, duration: number = 300000): Promise<boolean> {
    if (!this.socket || !this.permissions.mute) return false

    try {
      this.socket.emit('adminMute', { playerId, duration })
      this.addLog('info', `Muted player ${playerId} for ${duration}ms`, 'moderation', { playerId, duration })
      return true
    } catch (error) {
      console.error('Failed to mute player:', error)
      return false
    }
  }

  public async warnPlayer(playerId: string, reason: string): Promise<boolean> {
    if (!this.socket) return false

    try {
      this.socket.emit('adminWarn', { playerId, reason })
      this.addLog('info', `Warned player ${playerId}: ${reason}`, 'moderation', { playerId, reason })
      return true
    } catch (error) {
      console.error('Failed to warn player:', error)
      return false
    }
  }

  // Server Konfiguration
  public async updateConfig(config: Partial<ServerConfig>): Promise<boolean> {
    if (!this.socket || !this.permissions.changeSettings) return false

    try {
      this.socket.emit('adminUpdateConfig', config)
      this.addLog('info', 'Updated server configuration', 'system', config)
      return true
    } catch (error) {
      console.error('Failed to update config:', error)
      return false
    }
  }

  public async changeMap(mapName: string): Promise<boolean> {
    if (!this.socket || !this.permissions.changeMap) return false

    try {
      this.socket.emit('adminChangeMap', { map: mapName })
      this.addLog('info', `Changed map to ${mapName}`, 'gameplay', { map: mapName })
      return true
    } catch (error) {
      console.error('Failed to change map:', error)
      return false
    }
  }

  public async restartServer(delay: number = 30000): Promise<boolean> {
    if (!this.socket || !this.permissions.restart) return false

    try {
      this.socket.emit('adminRestart', { delay })
      this.addLog('warning', `Server restart scheduled in ${delay}ms`, 'system', { delay })
      return true
    } catch (error) {
      console.error('Failed to restart server:', error)
      return false
    }
  }

  public async shutdownServer(reason: string, delay: number = 60000): Promise<boolean> {
    if (!this.socket || !this.permissions.shutdown) return false

    try {
      this.socket.emit('adminShutdown', { reason, delay })
      this.addLog('error', `Server shutdown scheduled: ${reason} in ${delay}ms`, 'system', { reason, delay })
      return true
    } catch (error) {
      console.error('Failed to shutdown server:', error)
      return false
    }
  }

  // Nachrichten an Spieler
  public async broadcastMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<boolean> {
    if (!this.socket) return false

    try {
      this.socket.emit('adminBroadcast', { message, type })
      this.addLog('info', `Broadcast message: ${message}`, 'system', { message, type })
      return true
    } catch (error) {
      console.error('Failed to broadcast message:', error)
      return false
    }
  }

  public async sendMessage(playerId: string, message: string): Promise<boolean> {
    if (!this.socket) return false

    try {
      this.socket.emit('adminMessage', { playerId, message })
      this.addLog('info', `Sent message to ${playerId}: ${message}`, 'system', { playerId, message })
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }

  // Daten abrufen
  public getConfig(): ServerConfig | null {
    return this.config
  }

  public getPlayers(): ServerPlayer[] {
    return Array.from(this.players.values())
  }

  public getStats(): ServerStats | null {
    return this.stats
  }

  public getLogs(category?: string, level?: string): ServerLog[] {
    let filteredLogs = this.logs

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  public getPlayer(playerId: string): ServerPlayer | undefined {
    return this.players.get(playerId)
  }

  // Privates
  private setupSocketListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.isConnected = true
      console.log('Admin socket connected')
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
      console.log('Admin socket disconnected')
    })

    this.socket.on('playerConnected', (player: ServerPlayer) => {
      this.players.set(player.id, player)
      if (this.onPlayerConnected) {
        this.onPlayerConnected(player)
      }
      this.addLog('info', `Player connected: ${player.username}`, 'connection', { playerId: player.id })
    })

    this.socket.on('playerDisconnected', (playerId: string) => {
      const player = this.players.get(playerId)
      this.players.delete(playerId)
      if (this.onPlayerDisconnected) {
        this.onPlayerDisconnected(playerId)
      }
      this.addLog('info', `Player disconnected: ${player?.username}`, 'connection', { playerId })
    })

    this.socket.on('playerUpdated', (player: ServerPlayer) => {
      this.players.set(player.id, player)
    })

    this.socket.on('configUpdated', (config: ServerConfig) => {
      this.config = config
      if (this.onConfigUpdated) {
        this.onConfigUpdated(config)
      }
    })

    this.socket.on('statsUpdated', (stats: ServerStats) => {
      this.stats = stats
    })

    this.socket.on('logMessage', (log: ServerLog) => {
      this.addLog(log.level, log.message, log.category, log.data, log.userId)
    })

    this.socket.on('error', (error: any) => {
      console.error('Admin socket error:', error)
      this.addLog('error', `Admin error: ${error.message}`, 'system', error)
    })
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 10000)

      this.socket.on('connect', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  private async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'))
        return
      }

      this.socket.emit('adminAuth', { adminKey: this.adminKey })

      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'))
      }, 5000)

      this.socket.once('adminAuthSuccess', () => {
        clearTimeout(timeout)
        resolve()
      })

      this.socket.once('adminAuthError', (error: string) => {
        clearTimeout(timeout)
        reject(new Error(error))
      })
    })
  }

  private async fetchInitialData(): Promise<void> {
    if (!this.socket) return

    // Konfiguration abrufen
    this.socket.emit('adminGetConfig')
    this.socket.once('configData', (config: ServerConfig) => {
      this.config = config
    })

    // Spielerliste abrufen
    this.socket.emit('adminGetPlayers')
    this.socket.once('playersData', (players: ServerPlayer[]) => {
      players.forEach(player => {
        this.players.set(player.id, player)
      })
    })

    // Statistiken abrufen
    this.socket.emit('adminGetStats')
    this.socket.once('statsData', (stats: ServerStats) => {
      this.stats = stats
    })

    // Logs abrufen
    this.socket.emit('adminGetLogs')
    this.socket.once('logsData', (logs: ServerLog[]) => {
      this.logs = logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }))
    })
  }

  private addLog(
    level: 'info' | 'warning' | 'error' | 'debug',
    message: string,
    category: 'connection' | 'gameplay' | 'moderation' | 'system' | 'security',
    data?: any,
    userId?: string
  ): void {
    const log: ServerLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      category,
      data,
      userId
    }

    this.logs.push(log)

    // Logs limitieren
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries)
    }
  }
}

// React Hook für Server Admin
export const useGLXYServerAdmin = (
  serverUrl: string,
  adminKey: string
) => {
  const [admin, setAdmin] = useState<GLXYServerAdmin | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [players, setPlayers] = useState<ServerPlayer[]>([])
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [logs, setLogs] = useState<ServerLog[]>([])

  useEffect(() => {
    if (serverUrl && adminKey) {
      const serverAdmin = new GLXYServerAdmin(
        serverUrl,
        adminKey,
        (player) => setPlayers(prev => [...prev, player]),
        (playerId) => setPlayers(prev => prev.filter(p => p.id !== playerId)),
        (newConfig) => setConfig(newConfig)
      )

      serverAdmin.connect().then(connected => {
        if (connected) {
          setAdmin(serverAdmin)
          setIsConnected(true)
        }
      })

      const updateInterval = setInterval(() => {
        setConfig(serverAdmin.getConfig())
        setPlayers(serverAdmin.getPlayers())
        setStats(serverAdmin.getStats())
        setLogs(serverAdmin.getLogs())
      }, 1000)

      return () => {
        clearInterval(updateInterval)
        serverAdmin.disconnect()
      }
    }

    return () => {} // Return empty cleanup function for else case
  }, [serverUrl, adminKey])

  return {
    admin,
    isConnected,
    config,
    players,
    stats,
    logs,
    kickPlayer: (playerId: string, reason: string) => admin?.kickPlayer(playerId, reason),
    banPlayer: (playerId: string, reason: string, duration?: number) => admin?.banPlayer(playerId, reason, duration),
    mutePlayer: (playerId: string, duration?: number) => admin?.mutePlayer(playerId, duration),
    warnPlayer: (playerId: string, reason: string) => admin?.warnPlayer(playerId, reason),
    updateConfig: (config: Partial<ServerConfig>) => admin?.updateConfig(config),
    changeMap: (mapName: string) => admin?.changeMap(mapName),
    restartServer: (delay?: number) => admin?.restartServer(delay),
    shutdownServer: (reason: string, delay?: number) => admin?.shutdownServer(reason, delay),
    broadcastMessage: (message: string, type?: 'info' | 'warning' | 'error') => admin?.broadcastMessage(message, type),
    sendMessage: (playerId: string, message: string) => admin?.sendMessage(playerId, message)
  }
}

// Server Admin UI Component
export const GLXYServerAdminUI: React.FC<{
  serverUrl: string
  adminKey: string
}> = ({ serverUrl, adminKey }) => {
  const {
    admin,
    isConnected,
    config,
    players,
    stats,
    logs,
    kickPlayer,
    banPlayer,
    mutePlayer,
    warnPlayer,
    updateConfig,
    changeMap,
    restartServer,
    shutdownServer,
    broadcastMessage
  } = useGLXYServerAdmin(serverUrl, adminKey)

  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'config' | 'logs'>('overview')
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [logFilter, setLogFilter] = useState({ category: '', level: '' })
  const [showPlayerActions, setShowPlayerActions] = useState(false)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Connecting to server admin...</p>
        </div>
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">
              🔧 GLXY Server Administration
            </h1>
            <p className="text-gray-400">
              Server: {config?.name} | Status: <span className="text-green-400">Online</span>
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => broadcastMessage('Server restart in 5 minutes!', 'warning')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            >
              ⚠️ Notify Restart
            </button>
            <button
              onClick={() => restartServer(300000)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              🔄 Restart Server
            </button>
            <button
              onClick={() => shutdownServer('Scheduled maintenance', 300000)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              ⛔ Shutdown Server
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex space-x-1">
          {(['overview', 'players', 'config', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Server Statistics</h2>
              {stats && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime:</span>
                    <span>{formatTime(stats.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Connections:</span>
                    <span>{stats.activeConnections}/{stats.totalConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPU Usage:</span>
                    <span className={stats.cpuUsage > 80 ? 'text-red-400' : 'text-green-400'}>
                      {stats.cpuUsage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Usage:</span>
                    <span className={stats.memoryUsage > 80 ? 'text-red-400' : 'text-green-400'}>
                      {stats.memoryUsage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tick Rate:</span>
                    <span className={stats.tickRate < 50 ? 'text-red-400' : 'text-green-400'}>
                      {stats.tickRate} Hz
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Latency:</span>
                    <span className={stats.averageLatency > 150 ? 'text-red-400' : 'text-green-400'}>
                      {stats.averageLatency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Packet Loss:</span>
                    <span className={stats.packetLoss > 5 ? 'text-red-400' : 'text-green-400'}>
                      {stats.packetLoss.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bandwidth In:</span>
                    <span>{formatBytes(stats.bandwidthUsage.inbound)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bandwidth Out:</span>
                    <span>{formatBytes(stats.bandwidthUsage.outbound)}/s</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Quick Actions</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Broadcast Message</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter message..."
                      className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement
                          if (target.value.trim()) {
                            broadcastMessage(target.value)
                            target.value = ''
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Enter message..."]') as HTMLInputElement
                        if (input?.value.trim()) {
                          broadcastMessage(input.value)
                          input.value = ''
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Change Map</label>
                  <div className="flex space-x-2">
                    <select
                      className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          changeMap(e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Select map...</option>
                      <option value="dust2">Dust II</option>
                      <option value="mirage">Mirage</option>
                      <option value="inferno">Inferno</option>
                      <option value="cache">Cache</option>
                      <option value="overpass">Overpass</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Danger Zone</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => restartServer(30000)}
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                    >
                      🔄 Restart in 30s
                    </button>
                    <button
                      onClick={() => shutdownServer('Emergency shutdown', 10000)}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      ⛔ Emergency Shutdown
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Player Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2">Username</th>
                    <th className="text-left py-2">Team</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">K/D</th>
                    <th className="text-left py-2">Ping</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    <tr key={player.id} className="border-b border-gray-700">
                      <td className="py-2">{player.username}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          player.team === 'red' ? 'bg-red-600' :
                          player.team === 'blue' ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                          {player.team}
                        </span>
                      </td>
                      <td className="py-2">{player.score}</td>
                      <td className="py-2">
                        {player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : '0.00'}
                      </td>
                      <td className="py-2">
                        <span className={player.ping > 150 ? 'text-red-400' : 'text-green-400'}>
                          {player.ping}ms
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex space-x-1">
                          {player.isMuted && <span className="px-2 py-1 bg-yellow-600 rounded text-xs">Muted</span>}
                          {player.warnings > 0 && <span className="px-2 py-1 bg-orange-600 rounded text-xs">{player.warnings}W</span>}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => warnPlayer(player.id, 'Warning from admin')}
                            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs transition-colors"
                          >
                            Warn
                          </button>
                          <button
                            onClick={() => mutePlayer(player.id, 300000)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                          >
                            Mute
                          </button>
                          <button
                            onClick={() => kickPlayer(player.id, 'Kicked by admin')}
                            className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs transition-colors"
                          >
                            Kick
                          </button>
                          <button
                            onClick={() => banPlayer(player.id, 'Banned by admin', 86400000)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && config && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Server Configuration</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-300">Basic Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Server Name</label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => updateConfig({ name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Players</label>
                    <input
                      type="number"
                      value={config.maxPlayers}
                      onChange={(e) => updateConfig({ maxPlayers: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Tick Rate</label>
                    <input
                      type="number"
                      value={config.performance.tickRate}
                      onChange={(e) => updateConfig({
                        performance: { ...config.performance, tickRate: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-300">Game Rules</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.rules.friendlyFire}
                      onChange={(e) => updateConfig({
                        rules: { ...config.rules, friendlyFire: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span>Friendly Fire</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.rules.autoBalance}
                      onChange={(e) => updateConfig({
                        rules: { ...config.rules, autoBalance: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span>Auto Balance</span>
                  </label>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Round Time (seconds)</label>
                    <input
                      type="number"
                      value={config.rules.roundTime}
                      onChange={(e) => updateConfig({
                        rules: { ...config.rules, roundTime: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-400">Server Logs</h2>
              <div className="flex space-x-2">
                <select
                  value={logFilter.category}
                  onChange={(e) => setLogFilter(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-1 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="connection">Connection</option>
                  <option value="gameplay">Gameplay</option>
                  <option value="moderation">Moderation</option>
                  <option value="system">System</option>
                  <option value="security">Security</option>
                </select>
                <select
                  value={logFilter.level}
                  onChange={(e) => setLogFilter(prev => ({ ...prev, level: e.target.value }))}
                  className="px-3 py-1 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.slice(0, 100).map(log => (
                <div
                  key={log.id}
                  className={`p-2 rounded text-sm font-mono ${
                    log.level === 'error' ? 'bg-red-900/30 text-red-400' :
                    log.level === 'warning' ? 'bg-yellow-900/30 text-yellow-400' :
                    log.level === 'info' ? 'bg-blue-900/30 text-blue-400' :
                    'bg-gray-700/30 text-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="text-xs px-1 py-0.5 bg-gray-700 rounded">
                      {log.category}
                    </span>
                    <span>{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GLXYServerAdmin