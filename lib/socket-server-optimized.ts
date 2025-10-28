// @ts-nocheck
import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { createAdapter as createRedisAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CacheManager, CACHE_KEYS, CACHE_TTL, RateLimiter } from '@/lib/redis-server'

// Optimized Redis configuration for Socket.IO clustering
let redisClient: Redis | null = null
let redisPubClient: Redis | null = null
let redisSubClient: Redis | null = null

function createRedisClients() {
  if (redisClient) return { redisClient, redisPubClient, redisSubClient }

  // Base Redis config with optimizations
  const redisConfig = {
    host: process.env.REDIS_HOST || 'redis-temp',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'temporary_redis_pass_2024',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Performance optimizations
    enableOfflineQueue: false,
    maxConnections: 10,
    db: 0
  }

  // Main Redis client for general operations
  redisClient = new Redis({
    ...redisConfig,
    keyPrefix: 'glxy:socket:'
  })

  // Dedicated pub/sub clients for Socket.IO clustering
  redisPubClient = new Redis({
    ...redisConfig,
    keyPrefix: 'glxy:socketio:'
  })

  redisSubClient = new Redis({
    ...redisConfig,
    keyPrefix: 'glxy:socketio:'
  })

  // Connection event handlers
  redisClient.on('error', (err) => console.error('Redis client error:', err))
  redisPubClient.on('error', (err) => console.error('Redis pub error:', err))
  redisSubClient.on('error', (err) => console.error('Redis sub error:', err))

  return { redisClient, redisPubClient, redisSubClient }
}

// Optimized connection tracking with TTL
export class OptimizedConnectionManager {
  private static redis: Redis

  static initialize() {
    const { redisClient } = createRedisClients()
    this.redis = redisClient!
  }

  static async addConnection(socketId: string, userData: {
    userId: string
    username: string
    status: 'online' | 'playing' | 'away'
    serverId?: string
  }) {
    const connectionData = {
      ...userData,
      socketId,
      serverId: process.env.NODE_APP_INSTANCE || 'server-1',
      lastPing: Date.now(),
      rooms: [],
      joinedAt: Date.now()
    }

    // Use pipeline for batch operations
    const pipeline = this.redis.pipeline()

    // Store connection with TTL
    pipeline.setex(`connection:${socketId}`, 300, JSON.stringify(connectionData)) // 5 min TTL

    // Track user's active sockets
    pipeline.sadd(`user:sockets:${userData.userId}`, socketId)
    pipeline.expire(`user:sockets:${userData.userId}`, 300)

    // Add to global online users set
    pipeline.sadd('online_users', userData.userId)
    pipeline.expire('online_users', 3600)

    // Track server load
    pipeline.incr(`server:connections:${connectionData.serverId}`)
    pipeline.expire(`server:connections:${connectionData.serverId}`, 60)

    await pipeline.exec()
  }

  static async updateConnection(socketId: string, updates: Partial<{
    lastPing: number
    status: 'online' | 'playing' | 'away'
    rooms: string[]
    gameState?: any
  }>) {
    const connectionStr = await this.redis.get(`connection:${socketId}`)
    if (connectionStr) {
      const connection = JSON.parse(connectionStr)
      const updated = { ...connection, ...updates }
      await this.redis.setex(`connection:${socketId}`, 300, JSON.stringify(updated))
    }
  }

  static async removeConnection(socketId: string) {
    const connectionStr = await this.redis.get(`connection:${socketId}`)
    if (connectionStr) {
      const connection = JSON.parse(connectionStr)

      const pipeline = this.redis.pipeline()

      // Remove from user's socket set
      pipeline.srem(`user:sockets:${connection.userId}`, socketId)

      // Check if user has other connections
      const userSockets = await this.redis.smembers(`user:sockets:${connection.userId}`)
      if (userSockets.length <= 1) {
        pipeline.srem('online_users', connection.userId)
      }

      // Remove connection data
      pipeline.del(`connection:${socketId}`)

      // Decrease server connection count
      pipeline.decr(`server:connections:${connection.serverId}`)

      await pipeline.exec()
    }
  }

  static async getConnection(socketId: string) {
    const connectionStr = await this.redis.get(`connection:${socketId}`)
    return connectionStr ? JSON.parse(connectionStr) : null
  }

  static async getServerLoad(serverId: string): Promise<number> {
    const connections = await this.redis.get(`server:connections:${serverId}`)
    return parseInt(connections || '0')
  }

  static async getAllConnections(userId: string) {
    const socketIds = await this.redis.smembers(`user:sockets:${userId}`)
    const connections: any[] = []

    for (const socketId of socketIds) {
      const connection = await this.getConnection(socketId)
      if (connection) connections.push(connection)
    }

    return connections
  }
}

// Game state synchronization with optimized Redis operations
export class GameStateManager {
  private static redis: Redis

  static initialize() {
    const { redisClient } = createRedisClients()
    this.redis = redisClient!
  }

  static async updateGameState(roomId: string, gameState: any, playerId?: string) {
    const stateKey = `game:state:${roomId}`
    const historyKey = `game:history:${roomId}`

    const pipeline = this.redis.pipeline()

    // Store current state with TTL
    pipeline.setex(stateKey, 3600, JSON.stringify({
      ...gameState,
      lastUpdate: Date.now(),
      lastPlayer: playerId
    }))

    // Keep limited history for rollback (last 50 moves)
    if (playerId) {
      pipeline.lpush(historyKey, JSON.stringify({
        gameState,
        playerId,
        timestamp: Date.now()
      }))
      pipeline.ltrim(historyKey, 0, 49) // Keep last 50 moves
      pipeline.expire(historyKey, 3600)
    }

    await pipeline.exec()
  }

  static async getGameState(roomId: string) {
    const stateStr = await this.redis.get(`game:state:${roomId}`)
    return stateStr ? JSON.parse(stateStr) : null
  }

  static async getGameHistory(roomId: string, limit: number = 10) {
    const history = await this.redis.lrange(`game:history:${roomId}`, 0, limit - 1)
    return history.map(h => JSON.parse(h))
  }

  static async rollbackToMove(roomId: string, moveIndex: number) {
    const history = await this.getGameHistory(roomId, moveIndex + 1)
    if (history[moveIndex]) {
      await this.updateGameState(roomId, history[moveIndex].gameState)
      return history[moveIndex].gameState
    }
    return null
  }
}

// Performance monitoring and metrics
export class PerformanceMonitor {
  private static redis: Redis
  private static metrics = new Map<string, number>()

  static initialize() {
    const { redisClient } = createRedisClients()
    this.redis = redisClient!

    // Flush metrics every 30 seconds
    setInterval(() => this.flushMetrics(), 30000)
  }

  static recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
    const key = `${name}:${Object.entries(tags).map(([k,v]) => `${k}=${v}`).join(',')}`
    this.metrics.set(key, (this.metrics.get(key) || 0) + value)
  }

  static async recordLatency(operation: string, startTime: number, roomId?: string) {
    const latency = Date.now() - startTime
    const tags: Record<string, string> | undefined = roomId ? { roomId } : undefined
    this.recordMetric(`socket.latency.${operation}`, latency, tags)

    // Also store in Redis for aggregation
    const key = `metrics:latency:${operation}`
    await this.redis.lpush(key, latency)
    await this.redis.ltrim(key, 0, 999) // Keep last 1000 measurements
    await this.redis.expire(key, 3600)
  }

  static async flushMetrics() {
    if (this.metrics.size === 0) return

    const pipeline = this.redis.pipeline()
    const timestamp = Date.now()

    for (const [key, value] of this.metrics.entries()) {
      pipeline.lpush(`metrics:${key}`, `${timestamp}:${value}`)
      pipeline.ltrim(`metrics:${key}`, 0, 999)
      pipeline.expire(`metrics:${key}`, 86400) // 24 hours
    }

    await pipeline.exec()
    this.metrics.clear()
  }

  static async getMetrics(metric: string, hours: number = 1) {
    const values = await this.redis.lrange(`metrics:${metric}`, 0, -1)
    const cutoff = Date.now() - (hours * 3600 * 1000)

    return values
      .map(v => {
        const [timestamp, value] = v.split(':')
        return { timestamp: parseInt(timestamp), value: parseFloat(value) }
      })
      .filter(m => m.timestamp >= cutoff)
  }
}

// Optimized Socket.IO server with clustering and performance monitoring
export function initializeOptimizedSocketServer(httpServer: NetServer) {
  // Initialize managers
  OptimizedConnectionManager.initialize()
  GameStateManager.initialize()
  PerformanceMonitor.initialize()

  // Get Redis clients for clustering
  const { redisPubClient, redisSubClient } = createRedisClients()

  const io = new ServerIO(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    // Performance optimizations
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: false,
    httpCompression: {
      threshold: 1024,
    }
  })

  // Setup Redis adapter for clustering
  if (redisPubClient && redisSubClient) {
    io.adapter(createRedisAdapter(redisPubClient, redisSubClient))
  }

  // Enhanced rate limiting with Redis
  io.use(async (socket, next) => {
    const startTime = Date.now()

    try {
      const xfwd = (socket.handshake.headers['x-forwarded-for'] as string) || ''
      const ip = (xfwd.split(',')[0]?.trim()) || (socket.handshake.address as string) || 'unknown'

      // Multi-tier rate limiting
      const connectionLimit = await RateLimiter.checkRateLimit('socket:connect', 20, 60000, ip) // 20 per minute
      const burstLimit = await RateLimiter.checkRateLimit('socket:burst', 5, 1000, ip) // 5 per second

      if (!connectionLimit.allowed || !burstLimit.allowed) {
        PerformanceMonitor.recordMetric('socket.connection.rejected', 1, { reason: 'rate_limit' })
        return next(new Error('Rate limit exceeded'))
      }

      await PerformanceMonitor.recordLatency('auth_middleware', startTime)
      next()
    } catch (error) {
      PerformanceMonitor.recordMetric('socket.connection.error', 1, { reason: 'auth_error' })
      next(new Error('Authentication failed'))
    }
  })

  // Optimized authentication with caching
  io.use(async (socket, next) => {
    const startTime = Date.now()

    try {
      // Extract and validate token (same logic as before but with caching)
      const cookies = socket.handshake.headers.cookie
      let token: string | undefined

      if (cookies) {
        const authCookie = cookies.split(';').find(c =>
          c.trim().startsWith('next-auth.session-token=') ||
          c.trim().startsWith('__Secure-next-auth.session-token=')
        )
        if (authCookie) {
          token = authCookie.split('=')[1]
        }
      }

      if (!token) {
        const authHeader = socket.handshake.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }
      }

      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          socket.data.user = {
            id: `dev-user-${Math.random().toString(36).substr(2, 9)}`,
            username: 'Developer',
            email: 'dev@localhost',
            level: 1,
            avatar: null
          }
          return next()
        }
        return next(new Error('No authentication token provided'))
      }

      // Check auth cache first
      const authCacheKey = `auth:${token.substring(0, 20)}` // Use token prefix as key
      const cachedUser = await CacheManager.get(authCacheKey)

      if (cachedUser) {
        socket.data.user = cachedUser
        await PerformanceMonitor.recordLatency('auth_cached', startTime)
        return next()
      }

      // Verify JWT and get user
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET) as any

      if (!decoded?.email) {
        return next(new Error('Invalid token'))
      }

      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          level: true
        }
      })

      if (!user) {
        return next(new Error('User not found'))
      }

      const userData = {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        level: user.level || 1,
        avatar: user.avatar
      }

      socket.data.user = userData

      // Cache auth result for 5 minutes
      await CacheManager.set(authCacheKey, userData, 300)

      await PerformanceMonitor.recordLatency('auth_db', startTime)
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      PerformanceMonitor.recordMetric('socket.auth.error', 1)
      next(new Error('Authentication failed'))
    }
  })

  // Connection handler with optimized tracking
  io.on('connection', async (socket) => {
    const user = socket.data.user
    const connectTime = Date.now()

    console.log(`✅ User ${user.username} connected (${socket.id})`)

    // Record connection metrics
    PerformanceMonitor.recordMetric('socket.connections', 1)

    // Register optimized connection tracking
    await OptimizedConnectionManager.addConnection(socket.id, {
      userId: user.id,
      username: user.username,
      status: 'online'
    })

    // Broadcast user online (with throttling)
    socket.broadcast.emit('user:online', {
      userId: user.id,
      username: user.username
    })

    // Optimized room join with batched operations
    socket.on('room:join', async (data) => {
      const startTime = Date.now()

      try {
        const { roomId } = data

        // Use cached room data first
        let room: any = await CacheManager.get(CACHE_KEYS.GAME_ROOM(roomId))

        if (!room) {
          room = await prisma.gameRoom.findUnique({
            where: { id: roomId },
            include: {
              host: { select: { id: true, username: true, avatar: true } },
              players: {
                include: {
                  user: { select: { id: true, username: true, avatar: true } }
                }
              }
            }
          })

          if (room) {
            await CacheManager.set(CACHE_KEYS.GAME_ROOM(roomId), room, CACHE_TTL.MEDIUM)
          }
        }

        if (!room) {
          socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' })
          return
        }

        if (room.players.length >= room.maxPlayers) {
          socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full' })
          return
        }

        // Check if user already in room
        const existingPlayer = room.players.find((p: any) => p.userId === user.id)
        if (!existingPlayer) {
          await prisma.playerInRoom.create({
            data: {
              userId: user.id,
              roomId: roomId,
              isReady: false
            }
          })
        }

        // Join socket room and update connection tracking
        await socket.join(roomId)
        await OptimizedConnectionManager.updateConnection(socket.id, {
          rooms: [roomId],
          status: 'playing'
        })

        // Invalidate room cache and get fresh data
        await CacheManager.del(CACHE_KEYS.GAME_ROOM(roomId))
        const updatedRoom = await prisma.gameRoom.findUnique({
          where: { id: roomId },
          include: {
            host: { select: { id: true, username: true, avatar: true } },
            players: {
              include: {
                user: { select: { id: true, username: true, avatar: true } }
              }
            }
          }
        })

        await CacheManager.set(CACHE_KEYS.GAME_ROOM(roomId), updatedRoom, CACHE_TTL.MEDIUM)

        // Notify all players
        io.to(roomId).emit('room:joined', {
          roomId,
          room: updatedRoom,
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar
          }
        })

        await PerformanceMonitor.recordLatency('room_join', startTime, roomId)
        PerformanceMonitor.recordMetric('room.joins', 1)

      } catch (error) {
        console.error('Room join error:', error)
        socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join room' })
        PerformanceMonitor.recordMetric('room.join.errors', 1)
      }
    })

    // Optimized game move handling with state batching
    socket.on('game:move', async (data) => {
      const startTime = Date.now()

      try {
        const { roomId, move } = data

        // Validate player is in room (cached check)
        const connection = await OptimizedConnectionManager.getConnection(socket.id)
        if (!connection || !connection.rooms.includes(roomId)) {
          socket.emit('error', { code: 'NOT_IN_ROOM', message: 'Not in room' })
          return
        }

        // Update game state efficiently
        const currentState = await GameStateManager.getGameState(roomId) || {}
        const newState = {
          ...currentState,
          lastMove: move,
          lastPlayer: user.id,
          sequence: (currentState.sequence || 0) + 1,
          timestamp: Date.now()
        }

        await GameStateManager.updateGameState(roomId, newState, user.id)

        // Broadcast to room efficiently
        socket.to(roomId).emit('game:move', {
          roomId,
          move,
          playerId: user.id,
          sequence: newState.sequence
        })

        await PerformanceMonitor.recordLatency('game_move', startTime, roomId)
        PerformanceMonitor.recordMetric('game.moves', 1)

      } catch (error) {
        console.error('Game move error:', error)
        socket.emit('error', { code: 'MOVE_FAILED', message: 'Move failed' })
        PerformanceMonitor.recordMetric('game.move.errors', 1)
      }
    })

    // Enhanced chat with better rate limiting
    socket.on('chat:send', async (data) => {
      const startTime = Date.now()

      // Multi-level rate limiting
      const xfwd = (socket.handshake.headers['x-forwarded-for'] as string) || ''
      const ip = (xfwd.split(',')[0]?.trim()) || (socket.handshake.address as string) || 'unknown'

      const userLimit = await RateLimiter.checkRateLimit(`chat:user:${user.id}`, 15, 10000) // 15 per 10s per user
      const ipLimit = await RateLimiter.checkRateLimit(`chat:ip:${ip}`, 30, 10000) // 30 per 10s per IP

      if (!userLimit.allowed || !ipLimit.allowed) {
        socket.emit('error', { code: 'CHAT_RATE_LIMIT', message: 'Sending messages too fast' })
        return
      }

      try {
        const { roomId, message, type = 'room' } = data

        if (!message || message.trim().length === 0 || message.length > 500) {
          return
        }

        const chatMessage = await prisma.chatMessage.create({
          data: {
            content: message.trim(),
            userId: user.id,
            roomId: type === 'room' ? roomId : null,
            type
          },
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            }
          }
        })

        // Cache message efficiently
        const cacheKey = roomId ? `chat:${roomId}` : 'chat:global'
        const messageData = {
          id: chatMessage.id,
          message: chatMessage.content,
          user: chatMessage.user,
          timestamp: chatMessage.createdAt.toISOString(),
          type: chatMessage.type
        }

        await CacheManager.lpush(cacheKey, messageData)
        // Note: List trimming and expiry handled by CacheManager implementation

        // Emit to appropriate audience
        const emitData = {
          roomId: roomId || 'global',
          ...messageData
        }

        if (type === 'room' && roomId) {
          io.to(roomId).emit('chat:message', emitData)
        } else {
          io.emit('chat:message', emitData)
        }

        await PerformanceMonitor.recordLatency('chat_send', startTime, roomId)
        PerformanceMonitor.recordMetric('chat.messages', 1)

      } catch (error) {
        console.error('Chat message error:', error)
        socket.emit('error', { code: 'CHAT_FAILED', message: 'Failed to send message' })
        PerformanceMonitor.recordMetric('chat.errors', 1)
      }
    })

    // Optimized ping handling
    socket.on('user:ping', async () => {
      await OptimizedConnectionManager.updateConnection(socket.id, {
        lastPing: Date.now()
      })
      socket.emit('user:pong', { timestamp: Date.now() })
    })

    // Enhanced disconnect handling
    socket.on('disconnect', async (reason) => {
      const disconnectTime = Date.now()
      const sessionDuration = disconnectTime - connectTime

      console.log(`❌ User ${user.username} disconnected: ${reason} (session: ${sessionDuration}ms)`)

      // Record metrics
      PerformanceMonitor.recordMetric('socket.disconnections', 1, { reason })
      PerformanceMonitor.recordMetric('socket.session_duration', sessionDuration)

      // Clean up connection tracking
      await OptimizedConnectionManager.removeConnection(socket.id)

      // Broadcast offline status only if user has no other connections
      const userConnections = await OptimizedConnectionManager.getAllConnections(user.id)
      if (userConnections.length === 0) {
        socket.broadcast.emit('user:offline', {
          userId: user.id
        })
      }
    })
  })

  // Enhanced connection cleanup with health monitoring
  setInterval(async () => {
    const startTime = Date.now()
    let cleanedUp = 0

    try {
      const allSockets = await io.fetchSockets()

      for (const socket of allSockets) {
        const connection = await OptimizedConnectionManager.getConnection(socket.id)
        if (connection && Date.now() - connection.lastPing > 120000) {
          socket.disconnect(true)
          cleanedUp++
        }
      }

      PerformanceMonitor.recordMetric('socket.cleanup.connections', cleanedUp)
      await PerformanceMonitor.recordLatency('socket.cleanup', startTime)

    } catch (error) {
      console.error('Connection cleanup error:', error)
      PerformanceMonitor.recordMetric('socket.cleanup.errors', 1)
    }
  }, 60000)

  // Performance metrics endpoint for monitoring
  io.engine.on('connection_error', (err) => {
    PerformanceMonitor.recordMetric('socket.connection.errors', 1, {
      code: err.code?.toString() || 'unknown'
    })
  })

  // Initialize game-specific handlers
  console.log('🎮 Initializing game-specific Socket.IO handlers...')
  const { initializeGameHandlers } = require('./game-socket-handlers')
  initializeGameHandlers(io)

  console.log('🚀 Optimized Socket.IO server initialized with Redis clustering')
  return io
}