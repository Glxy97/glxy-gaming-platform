// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Request, Response } from 'express'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  Users,
  Wifi,
  Settings,
  Shield,
  Clock,
  Globe,
  Lock,
  Unlock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Copy,
  Share2,
  Download,
  Upload,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  MessageSquare,
  UserCheck,
  UserX,
  Zap,
  Trophy,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
  HardDrive,
  Database,
  Router,
  ShieldCheck,
  Key,
  Link,
  MapPin,
  Navigation,
  Compass
} from 'lucide-react'

export interface ServerConfig {
  id: string
  name: string
  description: string
  maxPlayers: number
  currentPlayers: number
  gameMode: string
  map: string
  password: string
  isPrivate: boolean
  isRanked: boolean
  isDedicated: boolean
  hostName: string
  hostId: string
  port: number
  region: string
  address: string
  ping: number
  tickRate: number
  compressionEnabled: boolean
  voiceChatEnabled: boolean
  textChatEnabled: boolean
  spectatorMode: boolean
  recording: boolean
  autoBalance: boolean
  friendlyFire: boolean
  respawnTime: number
  roundTime: number
  maxRounds: number
  scoreLimit: number
  timeLimit: number
  customSettings: Record<string, any>
}

export interface ServerStats {
  cpu: number
  memory: number
  bandwidth: number
  packetsIn: number
  packetsOut: number
  uptime: number
  fps: number
  ping: number
  playerCount: number
  spectatorCount: number
  totalPlayers: number
  totalSpectators: number
}

export interface PlayerConnection {
  id: string
  playerName: string
  playerId: string
  address: string
  port: number
  ping: number
  joinTime: number
  team: string
  class: string
  score: number
  kills: number
  deaths: number
  assists: number
  isActive: boolean
  isSpectating: boolean
  isMuted: boolean
  isKicked: boolean
  isBanned: boolean
  customData: Record<string, any>
}

export interface ServerMessage {
  id: string
  timestamp: number
  type: 'chat' | 'system' | 'admin' | 'kill' | 'death' | 'score' | 'objective' | 'warning' | 'error'
  sender: string
  content: string
  target?: string
  data?: any
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface RoomSettings {
  name: string
  description: string
  maxPlayers: number
  gameMode: string
  map: string
  password: string
  isPrivate: boolean
  isRanked: boolean
  friendlyFire: boolean
  autoBalance: boolean
  spectatorMode: boolean
  voiceChat: boolean
  textChat: boolean
  recording: boolean
  respawnTime: number
  roundTime: number
  maxRounds: number
  scoreLimit: number
  timeLimit: number
  customRules: Record<string, any>
}

export class GLXYOnlineServer {
  private config: ServerConfig
  private stats: ServerStats
  private connections: Map<string, PlayerConnection> = new Map()
  private messages: ServerMessage[] = []
  private isRunning: boolean = false
  private startTime: number = 0
  private tickCount: number = 0
  private lastTickTime: number = 0

  private webSocketServer?: any
  private httpServer?: any
  private socketIOServer?: any
  private database?: any

  private onPlayerJoin?: (connection: PlayerConnection) => void
  private onPlayerLeave?: (connection: PlayerConnection) => void
  private onMessage?: (message: ServerMessage) => void
  private onStatsUpdate?: (stats: ServerStats) => void
  private onError?: (error: Error) => void

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      id: this.generateServerId(),
      name: 'GLXY Server',
      description: 'GLXY FPS Epic Multiplayer Server',
      maxPlayers: 16,
      currentPlayers: 0,
      gameMode: 'team_deathmatch',
      map: 'urban_combat',
      password: '',
      isPrivate: false,
      isRanked: false,
      isDedicated: true,
      hostName: 'GLXY Dedicated Server',
      hostId: this.generateHostId(),
      port: 7777,
      region: 'EU-Central',
      address: 'localhost',
      ping: 0,
      tickRate: 60,
      compressionEnabled: true,
      voiceChatEnabled: true,
      textChatEnabled: true,
      spectatorMode: true,
      recording: false,
      autoBalance: true,
      friendlyFire: false,
      respawnTime: 5000,
      roundTime: 300000,
      maxRounds: 10,
      scoreLimit: 100,
      timeLimit: 0,
      customSettings: {},
      ...config
    }

    this.stats = {
      cpu: 0,
      memory: 0,
      bandwidth: 0,
      packetsIn: 0,
      packetsOut: 0,
      uptime: 0,
      fps: 60,
      ping: 0,
      playerCount: 0,
      spectatorCount: 0,
      totalPlayers: 0,
      totalSpectators: 0
    }

    console.log('🖥️ GLXY Online Server: Initialized!')
  }

  private generateServerId(): string {
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateHostId(): string {
    return `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public async start(): Promise<boolean> {
    if (this.isRunning) {
      console.warn('Server is already running')
      return false
    }

    try {
      console.log('🚀 Starting GLXY Online Server...')

      // Start HTTP server
      await this.startHTTPServer()

      // Start WebSocket server
      await this.startWebSocketServer()

      // Start Socket.IO server
      await this.startSocketIOServer()

      // Initialize database
      await this.initializeDatabase()

      // Start game loop
      this.startGameLoop()

      this.isRunning = true
      this.startTime = Date.now()

      console.log(`✅ GLXY Online Server started successfully!`)
      console.log(`📡 Server Address: ${this.config.address}:${this.config.port}`)
      console.log(`🎮 Game Mode: ${this.config.gameMode}`)
      console.log(`🗺️ Map: ${this.config.map}`)
      console.log(`👥 Max Players: ${this.config.maxPlayers}`)

      return true
    } catch (error) {
      console.error('❌ Failed to start server:', error)
      if (this.onError) {
        this.onError(error as Error)
      }
      return false
    }
  }

  private async startHTTPServer(): Promise<void> {
    const http = require('http')
    const express = require('express')
    const cors = require('cors')
    const path = require('path')

    const app = express()

    // Middleware
    app.use(cors())
    app.use(express.json())
    app.use(express.static(path.join(__dirname, 'public')))

    // Server info endpoint
    app.get('/api/server/info', (req: Request, res: Response) => {
      res.json({
        ...this.config,
        ...this.stats,
        uptime: Date.now() - this.startTime,
        isRunning: this.isRunning,
        playerCount: this.connections.size,
        messageHistory: this.messages.slice(-50)
      })
    })

    // Players endpoint
    app.get('/api/server/players', (req: Request, res: Response) => {
      const players = Array.from(this.connections.values()).map(conn => ({
        id: conn.id,
        playerName: conn.playerName,
        team: conn.team,
        class: conn.class,
        score: conn.score,
        kills: conn.kills,
        deaths: conn.deaths,
        assists: conn.assists,
        ping: conn.ping,
        isActive: conn.isActive,
        isSpectating: conn.isSpectating,
        joinTime: conn.joinTime
      }))
      res.json(players)
    })

    // Messages endpoint
    app.get('/api/server/messages', (req: Request, res: Response) => {
      res.json(this.messages.slice(-100))
    })

    // Create server
    this.httpServer = http.createServer(app)

    // Start listening
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, this.config.address, (error?: any) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  private async startWebSocketServer(): Promise<void> {
    const ws = require('ws')

    this.webSocketServer = new ws.Server({
      port: this.config.port + 1,
      host: this.config.address
    })

    this.webSocketServer.on('connection', (ws: any, req: any) => {
      this.handleWebSocketConnection(ws, req)
    })

    console.log(`📡 WebSocket Server started on ${this.config.address}:${this.config.port + 1}`)
  }

  private handleWebSocketConnection(ws: any, req: any): void {
    const connectionId = this.generateConnectionId()
    const clientAddress = req.socket.remoteAddress

    console.log(`🔗 New WebSocket connection: ${connectionId} from ${clientAddress}`)

    // Handle connection messages
    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data)
        this.handleWebSocketMessage(connectionId, message)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    })

    // Handle disconnection
    ws.on('close', () => {
      console.log(`❌ WebSocket disconnected: ${connectionId}`)
      this.handleWebSocketDisconnection(connectionId)
    })

    // Store connection
    const connection: PlayerConnection = {
      id: connectionId,
      playerName: 'Player',
      playerId: connectionId,
      address: clientAddress,
      port: 0,
      ping: 0,
      joinTime: Date.now(),
      team: 'spectators',
      class: 'spectator',
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      isActive: false,
      isSpectating: true,
      isMuted: false,
      isKicked: false,
      isBanned: false,
      customData: {}
    }

    this.connections.set(connectionId, connection)
  }

  private handleWebSocketMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    switch (message.type) {
      case 'join':
        this.handlePlayerJoin(connectionId, message.data)
        break
      case 'leave':
        this.handlePlayerLeave(connectionId)
        break
      case 'chat':
        this.handleChatMessage(connectionId, message.data)
        break
      case 'stats':
        this.handleStatsUpdate(connectionId, message.data)
        break
      case 'ping':
        this.handlePingMessage(connectionId)
        break
      default:
        console.log(`Unknown message type: ${message.type}`)
    }
  }

  private handleWebSocketDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    if (connection.isActive) {
      // Notify other players
      this.broadcastSystemMessage({
        id: this.generateMessageId(),
        type: 'system',
        content: `${connection.playerName} has left the game`,
        sender: 'System',
        timestamp: Date.now(),
        priority: 'medium'
      })

      // Update stats
      this.config.currentPlayers--
      this.updatePlayerCount()
    }

    this.connections.delete(connectionId)
  }

  private async startSocketIOServer(): Promise<void> {
    const { Server } = require('socket.io')
    const httpServer = this.httpServer

    this.socketIOServer = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    this.socketIOServer.on('connection', (socket: any) => {
      console.log(`🔌 New Socket.IO connection: ${socket.id}`)

      // Handle room joining
      socket.on('joinRoom', (roomData: any) => {
        this.handleSocketJoinRoom(socket, roomData)
      })

      // Handle game actions
      socket.on('gameAction', (action: any) => {
        this.handleGameAction(socket, action)
      })

      // Handle chat
      socket.on('chat', (message: any) => {
        this.handleSocketChat(socket, message)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ Socket.IO disconnected: ${socket.id}`)
      })
    })

    console.log(`🔌 Socket.IO Server started`)
  }

  private handleSocketJoinRoom(socket: any, roomData: any): void {
    const { playerName, roomCode, password } = roomData

    // Validate room join
    if (this.config.isPrivate && password !== this.config.password) {
      socket.emit('error', { message: 'Invalid password' })
      return
    }

    if (this.config.currentPlayers >= this.config.maxPlayers) {
      socket.emit('error', { message: 'Server is full' })
      return
    }

    // Create player connection
    const connection: PlayerConnection = {
      id: socket.id,
      playerName,
      playerId: socket.id,
      address: socket.handshake.address,
      port: 0,
      ping: 0,
      joinTime: Date.now(),
      team: this.assignTeam(),
      class: 'vanguard',
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      isActive: true,
      isSpectating: false,
      isMuted: false,
      isKicked: false,
      isBanned: false,
      customData: {}
    }

    this.connections.set(socket.id, connection)
    this.config.currentPlayers++

    // Join room
    socket.join(`server_${this.config.id}`)

    // Send server info
    socket.emit('serverInfo', {
      ...this.config,
      players: Array.from(this.connections.values()),
      playerInfo: connection
    })

    // Notify other players
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${playerName} has joined the game`,
      sender: 'System',
      timestamp: Date.now(),
      priority: 'medium'
    })

    // Update stats
    this.updatePlayerCount()

    if (this.onPlayerJoin) {
      this.onPlayerJoin(connection)
    }
  }

  private handleGameAction(socket: any, action: any): void {
    const connection = this.connections.get(socket.id)
    if (!connection || !connection.isActive) return

    switch (action.type) {
      case 'move':
        this.handlePlayerMove(socket.id, action.data)
        break
      case 'shoot':
        this.handlePlayerShoot(socket.id, action.data)
        break
      case 'kill':
        this.handlePlayerKill(socket.id, action.data)
        break
      case 'chat':
        this.handlePlayerChat(socket.id, action.data)
        break
      case 'spectate':
        this.handlePlayerSpectate(socket.id, action.data)
        break
      default:
        console.log(`Unknown game action: ${action.type}`)
    }

    // Broadcast to other players
    socket.broadcast.emit('gameAction', action)
  }

  private handleSocketChat(socket: any, message: any): void {
    const connection = this.connections.get(socket.id)
    if (!connection || !connection.isActive || connection.isMuted) return

    const serverMessage: ServerMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      type: 'chat',
      sender: connection.playerName,
      content: message.content,
      priority: 'medium'
    }

    this.messages.push(serverMessage)
    this.broadcastMessage(serverMessage)

    if (this.onMessage) {
      this.onMessage(serverMessage)
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Initialize database connection
      // This would connect to your database (MongoDB, PostgreSQL, etc.)
      console.log('💾 Database initialized')
    } catch (error) {
      console.warn('Database not available, using memory storage')
    }
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      if (!this.isRunning) return

      const currentTime = Date.now()
      const deltaTime = currentTime - this.lastTickTime
      this.lastTickTime = currentTime

      // Update server stats
      this.updateServerStats()

      // Process game logic
      this.processGameLogic(deltaTime)

      // Broadcast server state
      this.broadcastServerState()

      // Schedule next tick
      setTimeout(gameLoop, 1000 / this.config.tickRate)
    }

    gameLoop()
  }

  private updateServerStats(): void {
    // Update CPU usage (simulated)
    this.stats.cpu = Math.random() * 80 + 10

    // Update memory usage (simulated)
    if ((performance as any).memory) {
      this.stats.memory = (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }

    // Update bandwidth
    this.stats.bandwidth = this.stats.packetsIn + this.stats.packetsOut

    // Update ping (average of all players)
    if (this.connections.size > 0) {
      const totalPing = Array.from(this.connections.values())
        .filter(conn => conn.isActive)
        .reduce((sum, conn) => sum + conn.ping, 0)
      this.stats.ping = totalPing / this.connections.size
    }

    // Update player counts
    this.stats.playerCount = Array.from(this.connections.values())
      .filter(conn => conn.isActive && !conn.isSpectating).length
    this.stats.spectatorCount = Array.from(this.connections.values())
      .filter(conn => conn.isSpectating).length

    // Update totals
    this.stats.totalPlayers = Array.from(this.connections.values()).length
    this.stats.totalSpectators = Array.from(this.connections.values())
      .filter(conn => conn.isSpectating).length

    // Update uptime
    this.stats.uptime = Date.now() - this.startTime

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.stats)
    }
  }

  private processGameLogic(deltaTime: number): void {
    this.tickCount++

    // Update player positions
    this.updatePlayerPositions(deltaTime)

    // Check win conditions
    this.checkWinConditions()

    // Process respawns
    this.processRespawns(deltaTime)

    // Update game timer
    this.updateGameTimer(deltaTime)
  }

  private updatePlayerPositions(deltaTime: number): void {
    // This would update player positions based on their input
    // For now, we'll simulate movement
    this.connections.forEach((connection) => {
      if (connection.isActive && !connection.isSpectating) {
        // Simulate position update
        // In a real implementation, this would come from client input
      }
    })
  }

  private checkWinConditions(): void {
    // Check for score limit
    if (this.config.scoreLimit > 0) {
      const players = Array.from(this.connections.values())
        .filter(conn => conn.isActive && !conn.isSpectating)
        .sort((a, b) => b.score - a.score)

      if (players.length > 0 && players[0].score >= this.config.scoreLimit) {
        this.endRound(players[0].team)
      }
    }

    // Check for time limit
    if (this.config.timeLimit > 0) {
      const elapsed = Date.now() - this.startTime
      if (elapsed >= this.config.timeLimit) {
        this.endRound('draw')
      }
    }
  }

  private processRespawns(deltaTime: number): void {
    // Process player respawns
    this.connections.forEach((connection) => {
      if (connection.isActive && connection.deaths > 0) {
        // Check respawn timer
        const respawnTime = connection.joinTime + this.config.respawnTime
        if (Date.now() >= respawnTime) {
          // Respawn player
          connection.deaths = 0
          connection.score = 0
          connection.joinTime = Date.now()

          this.broadcastSystemMessage({
        id: this.generateMessageId(),
            type: 'system',
            content: `${connection.playerName} has respawned`,
            sender: 'System',
            timestamp: Date.now(),
            priority: 'low'
          })
        }
      }
    })
  }

  private updateGameTimer(deltaTime: number): void {
    // Update round timer
    // This would track the current round time
  }

  private endRound(winner: string): void {
    // Create end round message
    const endMessage = this.generateMessageId()
    const roundResult: ServerMessage = {
      id: endMessage,
      timestamp: Date.now(),
      type: 'system',
      sender: 'System',
      content: winner === 'draw' ? 'Round ended in a draw!' : `Team ${winner} wins the round!`,
      data: {
        winner,
        roundEndTime: Date.now(),
        finalScores: Array.from(this.connections.values()).map(conn => ({
          playerName: conn.playerName,
          team: conn.team,
          score: conn.score,
          kills: conn.kills,
          deaths: conn.deaths,
          assists: conn.assists
        }))
      },
      priority: 'high'
    }

    this.messages.push(roundResult)
    this.broadcastMessage(roundResult)

    // Reset player stats for new round
    this.connections.forEach((connection) => {
      if (connection.isActive) {
        connection.score = 0
        connection.kills = 0
        connection.deaths = 0
        connection.assists = 0
        connection.joinTime = Date.now()
      }
    })

    // Notify all clients about round end
    this.socketIOServer?.emit('roundEnd', {
      winner,
      nextRoundIn: 10000, // 10 seconds until next round
      finalScores: roundResult.data?.finalScores
    })

    console.log(`🏁 Round ended. Winner: ${winner}`)
  }

  private broadcastServerState(): void {
    const serverState = {
      ...this.config,
      ...this.stats,
      players: Array.from(this.connections.values()).map(conn => ({
        id: conn.id,
        playerName: conn.playerName,
        team: conn.team,
        class: conn.class,
        score: conn.score,
        kills: conn.kills,
        deaths: conn.deaths,
        assists: conn.assists,
        ping: conn.ping,
        isActive: conn.isActive,
        isSpectating: conn.isSpectating
      })),
      tickCount: this.tickCount,
      timestamp: Date.now()
    }

    // Broadcast to all connected clients
    this.socketIOServer?.emit('serverState', serverState)
  }

  private handlePlayerJoin(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Update player info
    connection.playerName = data.playerName || connection.playerName
    connection.playerId = data.playerId || connection.playerId
    connection.team = this.assignTeam()
    connection.class = data.class || 'vanguard'
    connection.isActive = true
    connection.isSpectating = false

    // Reset stats
    connection.score = 0
    connection.kills = 0
    connection.deaths = 0
    connection.assists = 0

    // Notify other players
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${connection.playerName} has joined the game`,
      sender: 'System',
      timestamp: Date.now(),
      priority: 'medium'
    })

    // Update player count
    this.updatePlayerCount()

    if (this.onPlayerJoin) {
      this.onPlayerJoin(connection)
    }
  }

  private handlePlayerLeave(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isActive) return

    connection.isActive = false

    // Notify other players
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${connection.playerName} has left the game`,
      sender: 'System',
      timestamp: Date.now(),
      priority: 'medium'
    })

    // Update player count
    this.config.currentPlayers--
    this.updatePlayerCount()

    if (this.onPlayerLeave) {
      this.onPlayerLeave(connection)
    }
  }

  private handlePlayerMove(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isActive) return

    // Update player position
    // This would update the player's position in the game world
    connection.customData.position = data.position
  }

  private handlePlayerShoot(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isActive) return

    // Handle shooting logic
    // This would process the shot, check for hits, etc.
  }

  private handlePlayerKill(connectionId: string, data: any): void {
    const killer = this.connections.get(connectionId)
    const victim = this.connections.get(data.victimId)

    if (!killer || !victim) return

    // Update stats
    killer.kills++
    killer.score += 100
    victim.deaths++

    // Create kill message
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      timestamp: Date.now(),
      type: 'kill',
      sender: killer.playerName,
      content: `killed ${victim.playerName}`,
      data: {
        weapon: data.weapon,
        headshot: data.headshot,
        distance: data.distance
      },
      priority: 'high'
    })

    if (this.onMessage) {
      this.onMessage(this.messages[this.messages.length - 1])
    }
  }

  private handlePlayerChat(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isActive || connection.isMuted) return

    const message: ServerMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      type: 'chat',
      sender: connection.playerName,
      content: data.content,
      priority: 'medium'
    }

    this.messages.push(message)
    this.broadcastMessage(message)

    if (this.onMessage) {
      this.onMessage(message)
    }
  }

  private handlePlayerSpectate(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.isSpectating = data.isSpectating

    if (connection.isSpectating) {
      this.broadcastSystemMessage({
        id: this.generateMessageId(),
        type: 'system',
        content: `${connection.playerName} is now spectating`,
        sender: 'System',
        timestamp: Date.now(),
        priority: 'low'
      })
    }
  }

  private handleChatMessage(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isActive) return

    const message: ServerMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      type: 'chat',
      sender: connection.playerName,
      content: data.content,
      priority: 'medium'
    }

    this.messages.push(message)
    this.broadcastMessage(message)

    if (this.onMessage) {
      this.onMessage(message)
    }
  }

  private handleStatsUpdate(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Update player stats
    Object.assign(connection, data)

    // Update server stats
    this.updatePlayerCount()
  }

  private handlePingMessage(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Calculate ping
    connection.ping = Date.now() - connection.joinTime

    // Send pong response
    // This would send a pong response back to the client
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private assignTeam(): string {
    const teams = ['alpha', 'bravo', 'charlie', 'delta']
    const teamCounts = teams.reduce((counts, team) => {
      counts[team] = Array.from(this.connections.values())
        .filter(conn => conn.team === team)
        .length
      return counts
    }, {} as Record<string, number>)

    // Find team with fewest players
    let minTeam = teams[0]
    let minCount = teamCounts[minTeam] || 0

    for (const team of teams) {
      if ((teamCounts[team] || 0) < minCount) {
        minTeam = team
        minCount = teamCounts[team] || 0
      }
    }

    return minTeam
  }

  private updatePlayerCount(): void {
    this.stats.playerCount = Array.from(this.connections.values())
      .filter(conn => conn.isActive && !conn.isSpectating).length
  }

  private broadcastSystemMessage(message: ServerMessage): void {
    this.messages.push(message)
    this.socketIOServer?.emit('message', message)
  }

  private broadcastMessage(message: ServerMessage): void {
    this.messages.push(message)
    this.socketIOServer?.emit('message', message)
  }

  public async stop(): Promise<boolean> {
    if (!this.isRunning) {
      console.warn('Server is not running')
      return false
    }

    try {
      console.log('🛑 Stopping GLXY Online Server...')

      // Stop game loop
      this.isRunning = false

      // Close all connections
      this.connections.forEach((connection) => {
        connection.isActive = false
      })

      // Close servers
      this.socketIOServer?.close()
      this.webSocketServer?.close()
      this.httpServer?.close()

      // Clear data
      this.connections.clear()
      this.messages = []

      console.log('✅ GLXY Online Server stopped successfully!')
      return true
    } catch (error) {
      console.error('❌ Failed to stop server:', error)
      return false
    }
  }

  public updateConfig(updates: Partial<ServerConfig>): void {
    Object.assign(this.config, updates)
    this.socketIOServer?.emit('serverConfig', this.config)
  }

  public kickPlayer(connectionId: string, reason?: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    connection.isKicked = true
    connection.isActive = false

    // Create kick message
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${connection.playerName} has been kicked${reason ? `: ${reason}` : ''}`,
      sender: 'System',
      timestamp: Date.now(),
      priority: 'high'
    })

    // Remove connection
    this.connections.delete(connectionId)
    this.config.currentPlayers--
    this.updatePlayerCount()

    if (this.onPlayerLeave) {
      this.onPlayerLeave(connection)
    }

    return true
  }

  public banPlayer(connectionId: string, reason?: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    connection.isBanned = true
    connection.isActive = false

    // Create ban message
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${connection.playerName} has been banned${reason ? `: ${reason}` : ''}`,
      sender: 'System',
      timestamp: Date.now(),
      priority: 'high'
    })

    // Remove connection
    this.connections.delete(connectionId)
    this.config.currentPlayers--
    this.updatePlayerCount()

    // Store ban in database
    // This would store the ban in your database

    if (this.onPlayerLeave) {
      this.onPlayerLeave(connection)
    }

    return true
  }

  public mutePlayer(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    connection.isMuted = true

    // Create mute message
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${connection.playerName} has been muted`,
      sender: 'System',
      timestamp: Date.now(),
      priority: 'low'
    })

    return true
  }

  public unmutePlayer(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    connection.isMuted = false

    // Create unmute message
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${connection.playerName} has been unmuted`,
      sender: 'server',
      timestamp: Date.now(),
      priority: 'low'
    })

    return true
  }

  public changeTeam(connectionId: string, team: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isActive) return false

    const oldTeam = connection.team
    connection.team = team

    // Create team change message
    this.broadcastSystemMessage({
        id: this.generateMessageId(),
      type: 'system',
      content: `${connection.playerName} has changed from ${oldTeam} to ${team}`,
      sender: 'System',
      timestamp: Date.now(),
      priority: 'medium'
    })

    return true
  }

  public sendMessage(message: string, type: 'info' | 'warning' | 'error' = 'info', priority: ServerMessage['priority'] = 'medium'): void {
    // Convert type to match ServerMessage interface
    const messageType: ServerMessage['type'] = type === 'info' ? 'system' : type
    const systemMessage: ServerMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      type: messageType,
      sender: 'System',
      content: message,
      priority
    }

    this.messages.push(systemMessage)
    this.broadcastMessage(systemMessage)

    if (this.onMessage) {
      this.onMessage(systemMessage)
    }
  }

  public getConfig(): ServerConfig {
    return { ...this.config }
  }

  public getStats(): ServerStats {
    return { ...this.stats }
  }

  public getConnections(): PlayerConnection[] {
    return Array.from(this.connections.values())
  }

  public getMessages(): ServerMessage[] {
    return [...this.messages]
  }

  public isServerRunning(): boolean {
    return this.isRunning
  }

  public getConnectionCount(): number {
    return this.connections.size
  }

  public getPlayerCount(): number {
    return this.stats.playerCount
  }

  public getSpectatorCount(): number {
    return this.stats.spectatorCount
  }

  // Event handlers
  public on(event: 'playerJoin' | 'playerLeave' | 'message' | 'statsUpdate' | 'error', callback: Function): void {
    switch (event) {
      case 'playerJoin':
        this.onPlayerJoin = callback as (connection: PlayerConnection) => void
        break
      case 'playerLeave':
        this.onPlayerLeave = callback as (connection: PlayerConnection) => void
        break
      case 'message':
        this.onMessage = callback as (message: ServerMessage) => void
        break
      case 'statsUpdate':
        this.onStatsUpdate = callback as (stats: ServerStats) => void
        break
      case 'error':
        this.onError = callback as (error: Error) => void
        break
    }
  }

  public off(event: 'playerJoin' | 'playerLeave' | 'message' | 'statsUpdate' | 'error', callback?: Function): void {
    switch (event) {
      case 'playerJoin':
        this.onPlayerJoin = undefined
        break
      case 'playerLeave':
        this.onPlayerLeave = undefined
        break
      case 'message':
        this.onMessage = undefined
        break
      case 'statsUpdate':
        this.onStatsUpdate = undefined
        break
      case 'error':
        this.onError = undefined
        break
    }
  }

  public dispose(): void {
    this.stop().then(() => {
      this.connections.clear()
      this.messages = []
      this.onPlayerJoin = undefined
      this.onPlayerLeave = undefined
      this.onMessage = undefined
      this.onStatsUpdate = undefined
      this.onError = undefined
      console.log('🗑️ GLXY Online Server disposed')
    })
  }
}

export default GLXYOnlineServer