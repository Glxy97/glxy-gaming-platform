/**
 * GLXY Ultimate FPS - Server Browser
 *
 * Server discovery, filtering, and management:
 * - Server list retrieval and caching
 * - Advanced filtering (region, mode, ping, players)
 * - Favorites system
 * - Quick join functionality
 * - Server health monitoring
 * - Room browsing
 *
 * @module ServerBrowser
 * @version 1.10.0-alpha
 */

import {
  GameServerInfo,
  ServerRegion,
  ServerBrowserFilters,
  GameRoomInfo,
  RoomCreationSettings,
  NetworkManager
} from './NetworkManager'
import {
  PacketType,
  PacketPriority
} from './data/NetworkData'

/**
 * Server browser event types
 */
export enum ServerBrowserEventType {
  SERVERS_UPDATED = 'servers_updated',
  SERVER_ADDED = 'server_added',
  SERVER_REMOVED = 'server_removed',
  SERVER_PING_UPDATED = 'server_ping_updated',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_LIST_UPDATED = 'room_list_updated',
  FILTER_CHANGED = 'filter_changed',
  FAVORITE_ADDED = 'favorite_added',
  FAVORITE_REMOVED = 'favorite_removed'
}

/**
 * Server browser event
 */
export interface ServerBrowserEvent {
  type: ServerBrowserEventType
  timestamp: number
  data?: any
}

/**
 * Sort options
 */
export enum SortOption {
  NAME = 'name',
  PLAYERS = 'players',
  PING = 'ping',
  REGION = 'region',
  MODE = 'mode',
  MAP = 'map'
}

/**
 * Server Browser - Server discovery and management
 */
export class ServerBrowser {
  private networkManager: NetworkManager
  private servers: Map<string, GameServerInfo> = new Map()
  private rooms: Map<string, GameRoomInfo> = new Map()
  private favorites: Set<string> = new Set()
  private filters: ServerBrowserFilters = {}
  private currentServer: GameServerInfo | null = null
  private currentRoom: GameRoomInfo | null = null

  // Caching
  private lastServerListUpdate: number = 0
  private serverListCacheDuration: number = 10000 // 10 seconds
  private lastRoomListUpdate: number = 0
  private roomListCacheDuration: number = 5000 // 5 seconds

  // Refresh
  private autoRefresh: boolean = false
  private refreshInterval: any = null
  private refreshRate: number = 30000 // 30 seconds

  // Ping tracking
  private pingTimers: Map<string, any> = new Map()

  // Events
  private eventCallbacks: Map<ServerBrowserEventType, Array<(event: ServerBrowserEvent) => void>> = new Map()

  /**
   * Constructor
   */
  constructor(networkManager: NetworkManager, autoRefresh: boolean = true) {
    this.networkManager = networkManager
    this.autoRefresh = autoRefresh

    this.loadFavorites()

    if (this.autoRefresh) {
      this.startAutoRefresh()
    }
  }

  // ============================================================================
  // SERVER LIST
  // ============================================================================

  /**
   * Get server list from network
   */
  public async getServers(forceRefresh: boolean = false): Promise<GameServerInfo[]> {
    const now = Date.now()

    // Return cached list if still valid
    if (!forceRefresh && now - this.lastServerListUpdate < this.serverListCacheDuration) {
      return Array.from(this.servers.values())
    }

    // Request server list from network
    // In production, this would send a packet to master server
    await this.requestServerList()

    this.lastServerListUpdate = now

    return Array.from(this.servers.values())
  }

  /**
   * Request server list from network
   */
  private async requestServerList(): Promise<void> {
    // Send request packet
    // In production, implement packet sending through NetworkManager

    // For now, simulate with mock data
    await this.simulateServerListResponse()
  }

  /**
   * Simulate server list response (for development)
   */
  private async simulateServerListResponse(): Promise<void> {
    // Mock server data
    const mockServers: GameServerInfo[] = [
      {
        id: 'server-eu-1',
        name: 'GLXY EU Official #1',
        description: 'Official European server',
        address: '51.15.228.123',
        port: 3001,
        region: ServerRegion.EUROPE,
        isOnline: true,
        isPasswordProtected: false,
        version: '1.10.0',
        currentPlayers: 18,
        maxPlayers: 32,
        currentRooms: 3,
        maxRooms: 10,
        tickRate: 64,
        ping: 25,
        stability: 0.98,
        gameMode: 'Team Deathmatch',
        mapName: 'Urban Warfare',
        antiCheatEnabled: true,
        vac: true,
        isOfficial: true,
        isRanked: true,
        allowsMods: false,
        startedAt: Date.now() - 3600000,
        lastUpdate: Date.now()
      },
      {
        id: 'server-na-1',
        name: 'GLXY NA Official #1',
        description: 'Official North American server',
        address: '192.241.129.45',
        port: 3001,
        region: ServerRegion.NORTH_AMERICA,
        isOnline: true,
        isPasswordProtected: false,
        version: '1.10.0',
        currentPlayers: 24,
        maxPlayers: 32,
        currentRooms: 5,
        maxRooms: 10,
        tickRate: 64,
        ping: 95,
        stability: 0.95,
        gameMode: 'Free For All',
        mapName: 'Desert Storm',
        antiCheatEnabled: true,
        vac: true,
        isOfficial: true,
        isRanked: true,
        allowsMods: false,
        startedAt: Date.now() - 7200000,
        lastUpdate: Date.now()
      },
      {
        id: 'server-asia-1',
        name: 'GLXY Asia Community #1',
        description: 'Community server in Asia',
        address: '47.52.180.92',
        port: 3001,
        region: ServerRegion.ASIA,
        isOnline: true,
        isPasswordProtected: false,
        version: '1.10.0',
        currentPlayers: 12,
        maxPlayers: 24,
        currentRooms: 2,
        maxRooms: 8,
        tickRate: 32,
        ping: 180,
        stability: 0.88,
        gameMode: 'Gun Game',
        mapName: 'Warehouse District',
        antiCheatEnabled: false,
        vac: false,
        isOfficial: false,
        isRanked: false,
        allowsMods: true,
        startedAt: Date.now() - 1800000,
        lastUpdate: Date.now()
      }
    ]

    // Add to servers map
    for (const server of mockServers) {
      this.servers.set(server.id, server)
    }

    this.dispatchEvent({
      type: ServerBrowserEventType.SERVERS_UPDATED,
      timestamp: Date.now(),
      data: { servers: mockServers }
    })
  }

  /**
   * Get filtered servers
   */
  public getFilteredServers(filters?: ServerBrowserFilters): GameServerInfo[] {
    const appliedFilters = filters || this.filters
    let servers = Array.from(this.servers.values())

    // Apply region filter
    if (appliedFilters.region) {
      servers = servers.filter(s => s.region === appliedFilters.region)
    }

    // Apply game mode filter
    if (appliedFilters.gameMode) {
      servers = servers.filter(s => s.gameMode === appliedFilters.gameMode)
    }

    // Apply map filter
    if (appliedFilters.mapName) {
      servers = servers.filter(s => s.mapName === appliedFilters.mapName)
    }

    // Apply player count filters
    if (appliedFilters.notFull) {
      servers = servers.filter(s => s.currentPlayers < s.maxPlayers)
    }

    if (appliedFilters.notEmpty) {
      servers = servers.filter(s => s.currentPlayers > 0)
    }

    if (appliedFilters.hasPlayers) {
      servers = servers.filter(s => s.currentPlayers > 0 && s.currentPlayers < s.maxPlayers)
    }

    if (appliedFilters.minPlayers !== undefined) {
      servers = servers.filter(s => s.currentPlayers >= appliedFilters.minPlayers!)
    }

    if (appliedFilters.maxPlayers !== undefined) {
      servers = servers.filter(s => s.currentPlayers <= appliedFilters.maxPlayers!)
    }

    // Apply performance filters
    if (appliedFilters.maxPing !== undefined) {
      servers = servers.filter(s => s.ping <= appliedFilters.maxPing!)
    }

    if (appliedFilters.minStability !== undefined) {
      servers = servers.filter(s => s.stability >= appliedFilters.minStability!)
    }

    // Apply feature filters
    if (appliedFilters.official !== undefined) {
      servers = servers.filter(s => s.isOfficial === appliedFilters.official)
    }

    if (appliedFilters.ranked !== undefined) {
      servers = servers.filter(s => s.isRanked === appliedFilters.ranked)
    }

    if (appliedFilters.passwordProtected !== undefined) {
      servers = servers.filter(s => s.isPasswordProtected === appliedFilters.passwordProtected)
    }

    if (appliedFilters.antiCheat !== undefined) {
      servers = servers.filter(s => s.antiCheatEnabled === appliedFilters.antiCheat)
    }

    // Apply search query
    if (appliedFilters.searchQuery) {
      const query = appliedFilters.searchQuery.toLowerCase()
      servers = servers.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    if (appliedFilters.sortBy) {
      servers.sort((a, b) => {
        let compareValue = 0

        switch (appliedFilters.sortBy) {
          case 'name':
            compareValue = a.name.localeCompare(b.name)
            break
          case 'players':
            compareValue = a.currentPlayers - b.currentPlayers
            break
          case 'ping':
            compareValue = a.ping - b.ping
            break
          case 'region':
            compareValue = a.region.localeCompare(b.region)
            break
          case 'mode':
            compareValue = a.gameMode.localeCompare(b.gameMode)
            break
        }

        return appliedFilters.sortOrder === 'desc' ? -compareValue : compareValue
      })
    }

    return servers
  }

  /**
   * Set filters
   */
  public setFilters(filters: ServerBrowserFilters): void {
    this.filters = filters

    this.dispatchEvent({
      type: ServerBrowserEventType.FILTER_CHANGED,
      timestamp: Date.now(),
      data: { filters }
    })
  }

  /**
   * Clear filters
   */
  public clearFilters(): void {
    this.filters = {}

    this.dispatchEvent({
      type: ServerBrowserEventType.FILTER_CHANGED,
      timestamp: Date.now(),
      data: { filters: {} }
    })
  }

  /**
   * Get server by ID
   */
  public getServer(serverId: string): GameServerInfo | null {
    return this.servers.get(serverId) || null
  }

  /**
   * Ping server
   */
  public async pingServer(serverId: string): Promise<number> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }

    // Simulate ping measurement
    const startTime = Date.now()

    // In production, send actual ping packet
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))

    const ping = Date.now() - startTime

    // Update server ping
    server.ping = ping
    server.lastUpdate = Date.now()

    this.dispatchEvent({
      type: ServerBrowserEventType.SERVER_PING_UPDATED,
      timestamp: Date.now(),
      data: { serverId, ping }
    })

    return ping
  }

  /**
   * Ping all servers
   */
  public async pingAllServers(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(id =>
      this.pingServer(id).catch(err => {
        console.error(`Failed to ping server ${id}:`, err)
        return -1
      })
    )

    await Promise.all(promises)
  }

  // ============================================================================
  // FAVORITES
  // ============================================================================

  /**
   * Add server to favorites
   */
  public addFavorite(serverId: string): void {
    this.favorites.add(serverId)
    this.saveFavorites()

    this.dispatchEvent({
      type: ServerBrowserEventType.FAVORITE_ADDED,
      timestamp: Date.now(),
      data: { serverId }
    })
  }

  /**
   * Remove server from favorites
   */
  public removeFavorite(serverId: string): void {
    this.favorites.delete(serverId)
    this.saveFavorites()

    this.dispatchEvent({
      type: ServerBrowserEventType.FAVORITE_REMOVED,
      timestamp: Date.now(),
      data: { serverId }
    })
  }

  /**
   * Check if server is favorite
   */
  public isFavorite(serverId: string): boolean {
    return this.favorites.has(serverId)
  }

  /**
   * Get favorite servers
   */
  public getFavoriteServers(): GameServerInfo[] {
    return Array.from(this.favorites)
      .map(id => this.servers.get(id))
      .filter(s => s !== undefined) as GameServerInfo[]
  }

  /**
   * Load favorites from storage
   */
  private loadFavorites(): void {
    try {
      const stored = localStorage.getItem('glxy_fps_favorite_servers')
      if (stored) {
        const ids = JSON.parse(stored) as string[]
        this.favorites = new Set(ids)
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
  }

  /**
   * Save favorites to storage
   */
  private saveFavorites(): void {
    try {
      const ids = Array.from(this.favorites)
      localStorage.setItem('glxy_fps_favorite_servers', JSON.stringify(ids))
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }

  // ============================================================================
  // ROOM BROWSING
  // ============================================================================

  /**
   * Get room list for server
   */
  public async getRooms(serverId: string, forceRefresh: boolean = false): Promise<GameRoomInfo[]> {
    const now = Date.now()

    // Return cached list if still valid
    if (!forceRefresh && now - this.lastRoomListUpdate < this.roomListCacheDuration) {
      return Array.from(this.rooms.values()).filter(r => r.serverId === serverId)
    }

    // Request room list
    await this.requestRoomList(serverId)

    this.lastRoomListUpdate = now

    return Array.from(this.rooms.values()).filter(r => r.serverId === serverId)
  }

  /**
   * Request room list from server
   */
  private async requestRoomList(serverId: string): Promise<void> {
    // Send request packet
    // In production, implement packet sending

    // For now, simulate with mock data
    await this.simulateRoomListResponse(serverId)
  }

  /**
   * Simulate room list response (for development)
   */
  private async simulateRoomListResponse(serverId: string): Promise<void> {
    // Mock room data
    const mockRooms: GameRoomInfo[] = [
      {
        roomId: `room-${serverId}-1`,
        serverId: serverId,
        name: 'Pro Players Only',
        hostId: 'player-123',
        gameMode: 'Team Deathmatch',
        mapName: 'Urban Warfare',
        maxPlayers: 16,
        status: 'waiting',
        isPublic: true,
        isPasswordProtected: false,
        players: new Map([
          ['player-123', 'Team A'],
          ['player-456', 'Team A'],
          ['player-789', 'Team B']
        ]),
        spectators: new Set(),
        bots: 0,
        createdAt: Date.now() - 300000,
        settings: {
          friendlyFire: false,
          respawnTime: 5
        }
      },
      {
        roomId: `room-${serverId}-2`,
        serverId: serverId,
        name: 'Casual Fun',
        hostId: 'player-999',
        gameMode: 'Free For All',
        mapName: 'Desert Storm',
        maxPlayers: 12,
        status: 'playing',
        isPublic: true,
        isPasswordProtected: false,
        players: new Map([
          ['player-999', 'FFA'],
          ['player-888', 'FFA'],
          ['player-777', 'FFA'],
          ['player-666', 'FFA']
        ]),
        spectators: new Set(['player-555']),
        bots: 4,
        createdAt: Date.now() - 600000,
        startedAt: Date.now() - 300000,
        settings: {
          scoreLimit: 30,
          timeLimit: 10
        }
      }
    ]

    // Add to rooms map
    for (const room of mockRooms) {
      this.rooms.set(room.roomId, room)
    }

    this.dispatchEvent({
      type: ServerBrowserEventType.ROOM_LIST_UPDATED,
      timestamp: Date.now(),
      data: { serverId, rooms: mockRooms }
    })
  }

  /**
   * Get room by ID
   */
  public getRoom(roomId: string): GameRoomInfo | null {
    return this.rooms.get(roomId) || null
  }

  /**
   * Create room
   */
  public async createRoom(serverId: string, settings: RoomCreationSettings): Promise<GameRoomInfo> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }

    // Send create room packet
    // In production, implement packet sending

    // For now, simulate
    const room: GameRoomInfo = {
      roomId: `room-${serverId}-${Date.now()}`,
      serverId: serverId,
      name: settings.name,
      hostId: this.networkManager.getClientId(),
      gameMode: settings.gameMode,
      mapName: settings.mapName,
      maxPlayers: settings.maxPlayers,
      status: 'waiting',
      isPublic: settings.isPublic,
      isPasswordProtected: !!settings.password,
      players: new Map([[this.networkManager.getClientId(), 'Team A']]),
      spectators: new Set(),
      bots: settings.botCount || 0,
      createdAt: Date.now(),
      settings: settings.customSettings || {}
    }

    this.rooms.set(room.roomId, room)
    this.currentRoom = room

    return room
  }

  /**
   * Join room
   */
  public async joinRoom(roomId: string, password?: string): Promise<void> {
    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error(`Room ${roomId} not found`)
    }

    if (room.players.size >= room.maxPlayers) {
      throw new Error('Room is full')
    }

    if (room.isPasswordProtected && !password) {
      throw new Error('Password required')
    }

    // Send join room packet
    // In production, implement packet sending

    // For now, simulate
    room.players.set(this.networkManager.getClientId(), 'Team A')
    this.currentRoom = room

    this.dispatchEvent({
      type: ServerBrowserEventType.ROOM_JOINED,
      timestamp: Date.now(),
      data: { roomId, room }
    })
  }

  /**
   * Leave room
   */
  public async leaveRoom(): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('Not in a room')
    }

    const roomId = this.currentRoom.roomId

    // Send leave room packet
    // In production, implement packet sending

    // For now, simulate
    this.currentRoom.players.delete(this.networkManager.getClientId())
    this.currentRoom = null

    this.dispatchEvent({
      type: ServerBrowserEventType.ROOM_LEFT,
      timestamp: Date.now(),
      data: { roomId }
    })
  }

  // ============================================================================
  // QUICK JOIN
  // ============================================================================

  /**
   * Quick join - find and join best available server
   */
  public async quickJoin(preferences?: {
    region?: ServerRegion
    gameMode?: string
    maxPing?: number
  }): Promise<GameRoomInfo> {
    // Get servers
    const servers = await this.getServers()

    // Filter by preferences
    let filtered = servers

    if (preferences?.region) {
      filtered = filtered.filter(s => s.region === preferences.region)
    }

    if (preferences?.gameMode) {
      filtered = filtered.filter(s => s.gameMode === preferences.gameMode)
    }

    if (preferences?.maxPing) {
      filtered = filtered.filter(s => s.ping <= preferences.maxPing)
    }

    // Filter out full servers
    filtered = filtered.filter(s => s.currentPlayers < s.maxPlayers)

    // Sort by best conditions (low ping, high players, official)
    filtered.sort((a, b) => {
      const scoreA = (a.isOfficial ? 100 : 0) + (100 - a.ping) + (a.currentPlayers * 2)
      const scoreB = (b.isOfficial ? 100 : 0) + (100 - b.ping) + (b.currentPlayers * 2)
      return scoreB - scoreA
    })

    if (filtered.length === 0) {
      throw new Error('No available servers found')
    }

    // Get best server
    const bestServer = filtered[0]

    // Get rooms
    const rooms = await this.getRooms(bestServer.id)

    // Filter joinable rooms
    const joinableRooms = rooms.filter(r =>
      r.status === 'waiting' &&
      r.players.size < r.maxPlayers &&
      !r.isPasswordProtected
    )

    if (joinableRooms.length === 0) {
      // Create new room
      return await this.createRoom(bestServer.id, {
        name: `Quick Match ${Date.now()}`,
        gameMode: bestServer.gameMode,
        mapName: bestServer.mapName,
        maxPlayers: 16,
        isPublic: true,
        allowSpectators: true,
        allowBots: false
      })
    }

    // Join first available room
    const room = joinableRooms[0]
    await this.joinRoom(room.roomId)

    return room
  }

  // ============================================================================
  // AUTO REFRESH
  // ============================================================================

  /**
   * Start auto-refresh
   */
  public startAutoRefresh(): void {
    if (this.refreshInterval) {
      return
    }

    this.autoRefresh = true
    this.refreshInterval = setInterval(() => {
      this.getServers(true).catch(console.error)
    }, this.refreshRate)
  }

  /**
   * Stop auto-refresh
   */
  public stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }

    this.autoRefresh = false
  }

  /**
   * Set refresh rate
   */
  public setRefreshRate(rateMs: number): void {
    this.refreshRate = rateMs

    if (this.autoRefresh) {
      this.stopAutoRefresh()
      this.startAutoRefresh()
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to event
   */
  public on(eventType: ServerBrowserEventType, callback: (event: ServerBrowserEvent) => void): void {
    let callbacks = this.eventCallbacks.get(eventType)

    if (!callbacks) {
      callbacks = []
      this.eventCallbacks.set(eventType, callbacks)
    }

    callbacks.push(callback)
  }

  /**
   * Unsubscribe from event
   */
  public off(eventType: ServerBrowserEventType, callback: (event: ServerBrowserEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventType)

    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Dispatch event
   */
  private dispatchEvent(event: ServerBrowserEvent): void {
    const callbacks = this.eventCallbacks.get(event.type)

    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(event)
        } catch (error) {
          console.error('[ServerBrowser] Event callback error:', error)
        }
      }
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getServerCount(): number {
    return this.servers.size
  }

  public getRoomCount(): number {
    return this.rooms.size
  }

  public getCurrentServer(): GameServerInfo | null {
    return this.currentServer
  }

  public getCurrentRoom(): GameRoomInfo | null {
    return this.currentRoom
  }

  public getFilters(): ServerBrowserFilters {
    return { ...this.filters }
  }

  /**
   * Dispose server browser
   */
  public dispose(): void {
    this.stopAutoRefresh()
    this.pingTimers.forEach(timer => clearTimeout(timer))
    this.pingTimers.clear()
    this.eventCallbacks.clear()
    this.servers.clear()
    this.rooms.clear()
  }
}
