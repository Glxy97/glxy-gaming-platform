import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CacheManager, CACHE_KEYS, CACHE_TTL, RateLimiter } from '@/lib/redis-server'
import { initializeWebAdobeNamespace } from '@/lib/socket-handlers/web-adobe'
import { createRedisClients, closeRedisClients, isRedisAvailable } from '@/lib/redis-config'

// Active connections map for tracking socket connections
const activeConnections = new Map<string, {
  userId: string;
  username: string;
  rooms: Set<string>;
  lastPing: number;
  status: 'online' | 'playing' | 'away';
}>();

export type NextApiResponseServerIO = {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Socket.io event interfaces
export interface ServerToClientEvents {
  // Room events
  'room:joined': (data: { roomId: string; room: any; user: any }) => void
  'room:left': (data: { roomId: string; userId: string }) => void
  'room:updated': (data: { room: any }) => void
  'room:player_ready': (data: { roomId: string; userId: string; isReady: boolean }) => void

  // Game events
  'game:started': (data: { roomId: string; gameState: any }) => void
  'game:state': (data: unknown) => void
  'game:state_update': (data: { roomId: string; gameState: any }) => void
  'game:move': (data: { roomId: string; move: any }) => void
  'game:ended': (data: { roomId: string; winner: string; reason: string; stats: any }) => void
  'game:join': (data: any) => void
  'game:start': (data: any) => void

  // Chat events
  'chat:message': (data: { roomId: string; message: any }) => void
  'chat:typing': (data: { roomId: string; userId: string; isTyping: boolean }) => void

  // User events
  'user:online': (data: { userId: string; username: string }) => void
  'user:offline': (data: { userId: string }) => void
  'user:status': (data: { userId: string; status: 'online' | 'playing' | 'away' }) => void
  'user:ping': () => void

  // System events
  'system:notification': (data: { type: string; message: string }) => void
  'system:maintenance': (data: { message: string; startTime: number }) => void

  // Error events
  'error': (data: { code: string; message: string }) => void
}

export interface ClientToServerEvents {
  // Room events
  'room:join': (data: { roomId: string }) => void
  'room:leave': (data: { roomId: string }) => void
  'room:create': (data: { name: string; gameType: string; settings?: any }) => void
  'room:ready': (data: { roomId: string; isReady: boolean }) => void

  // Game events
  'game:join': (data: { roomId: string; gameType?: string }) => void
  'game:start': (data: { roomId: string }) => void
  'game:move': (data: { roomId: string; move: any }) => void
  'game:forfeit': (data: { roomId: string }) => void
  'game:pause': (data: { roomId: string }) => void
  'game:resume': (data: { roomId: string }) => void

  // UNO legacy adapter events
  'uno:join': (data: any) => void
  'uno:start': (data: any) => void
  'uno:move': (data: any) => void

  // Chat events
  'chat:send': (data: { roomId?: string; message: string; type?: string }) => void
  'chat:typing': (data: { roomId: string; isTyping: boolean }) => void

  // User events
  'user:ping': () => void
  'user:status': (data: { status: 'online' | 'playing' | 'away' }) => void
}

// Redis-backed connection management for clustering
export class ConnectionManager {
  static async addConnection(socketId: string, userData: {
    userId: string
    username: string
    status: 'online' | 'playing' | 'away'
  }) {
    const connectionData = {
      ...userData,
      socketId,
      lastPing: Date.now(),
      rooms: []
    }

    await CacheManager.set(
      `connection:${socketId}`,
      connectionData,
      CACHE_TTL.MEDIUM
    )

    // Track user's active sockets (for multi-tab support)
    await CacheManager.sadd(`user:sockets:${userData.userId}`, socketId)
  }

  static async updateConnection(socketId: string, updates: Partial<{
    lastPing: number
    status: 'online' | 'playing' | 'away'
    rooms: string[]
  }>) {
    const existing = await CacheManager.get<any>(`connection:${socketId}`)
    if (existing) {
      await CacheManager.set(
        `connection:${socketId}`,
        { ...existing, ...updates },
        CACHE_TTL.MEDIUM
      )
    }
  }

  static async removeConnection(socketId: string) {
    const connection = await CacheManager.get<any>(`connection:${socketId}`)
    if (connection) {
      // Remove from user's socket set
      await CacheManager.srem(`user:sockets:${connection.userId}`, socketId)

      // Check if user has other active connections
      const userSockets = await CacheManager.smembers(`user:sockets:${connection.userId}`)
      if (userSockets.length === 0) {
        await CacheManager.srem(CACHE_KEYS.ONLINE_USERS, connection.userId)
      }

      // Remove connection data
      await CacheManager.del(`connection:${socketId}`)
    }
  }

  static async getConnection(socketId: string) {
    return await CacheManager.get<any>(`connection:${socketId}`)
  }
}

// Singleton-Instanz für Dev-Reload
async function ensureSingletonIO(httpServer: NetServer) {
  const g: any = globalThis as any
  if (g.__glxy_io) return g.__glxy_io as ServerIO<ClientToServerEvents, ServerToClientEvents>

  const io = new ServerIO<ClientToServerEvents, ServerToClientEvents>(httpServer, {
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
  })

  // Initialize Redis Adapter for horizontal scaling
  const redisAvailable = await isRedisAvailable()
  
  if (redisAvailable) {
    try {
      const redisClients = await createRedisClients()
      
      if (redisClients) {
        const { pubClient, subClient } = redisClients
        
        // Use Redis adapter for multi-server support
        io.adapter(createAdapter(pubClient as any, subClient as any))
        
        console.log('✅ Socket.IO Redis Adapter enabled - Multi-server scaling active')
        console.log('📡 Rooms and events will be synchronized across all server instances')
        
        // Store clients for cleanup
        ;(io as any)._redisClients = redisClients
        
        // Setup graceful shutdown
        const cleanup = async () => {
          console.log('🧹 Cleaning up Redis connections...')
          await closeRedisClients()
        }
        
        process.on('SIGTERM', cleanup)
        process.on('SIGINT', cleanup)
      } else {
        console.warn('⚠️  Redis adapter initialization failed - Running in single-server mode')
      }
    } catch (error) {
      console.error('❌ Redis adapter setup error:', error)
      console.warn('⚠️  Falling back to single-server mode (no Redis adapter)')
    }
  } else {
    console.warn('⚠️  Redis not available - Socket.IO running in single-server mode')
    console.warn('   For horizontal scaling, ensure Redis is running and configured')
  }

  g.__glxy_io = io
  return io
}

export const initializeSocketServer = async (httpServer: NetServer) => {
  const io = await ensureSingletonIO(httpServer)

  // Skip if already initialized
  if ((io as any)._glxy_initialized) return io
  ;(io as any)._glxy_initialized = true

  // Initialize Web-Adobe Namespace
  initializeWebAdobeNamespace(io)

  // Basic connection rate limiting per IP
  io.use(async (socket, next) => {
    try {
      const xfwd = (socket.handshake.headers['x-forwarded-for'] as string) || ''
      const ip = (xfwd.split(',')[0]?.trim()) || (socket.handshake.address as string) || 'unknown'
      const rl = await RateLimiter.checkRateLimit('socket:connect', 10, 60_000, ip)
      if (!rl.allowed) {
        return next(new Error('Too many connection attempts'))
      }
      return next()
    } catch (e) {
      return next(new Error('Rate limit check failed'))
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Extract token from cookie or authorization header
      const cookies = socket.handshake.headers.cookie
      let token: string | undefined

      if (cookies) {
        // Parse NextAuth session token
        const authCookie = cookies.split(';').find(c => c.trim().startsWith('next-auth.session-token=') || c.trim().startsWith('__Secure-next-auth.session-token='))
        if (authCookie) {
          token = authCookie.split('=')[1]
        }
      }

      // Fallback to authorization header
      if (!token) {
        const authHeader = socket.handshake.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }
      }

      if (!token) {
        // In development, allow unauthenticated connections for testing
        if (process.env.NODE_ENV === 'development') {
          socket.data.user = {
            id: 'dev-user',
            username: 'Developer',
            email: 'dev@localhost',
            level: 1,
            avatar: null
          }
          return next()
        }
        return next(new Error('No authentication token provided'))
      }

      // Verify JWT token manually
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET) as any

      if (!decoded?.email) {
        return next(new Error('Invalid token'))
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true
        }
      })

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.data.user = {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        avatar: user.avatar
      }

      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user
    console.log(`✅ User ${user.username} connected (${socket.id})`)

    // Register active connection
    activeConnections.set(socket.id, {
      userId: user.id,
      username: user.username,
      rooms: new Set(),
      lastPing: Date.now(),
      status: 'online'
    })

    // Cache online user and track socket mapping
    CacheManager.sadd(CACHE_KEYS.ONLINE_USERS, user.id)
    CacheManager.sadd(CACHE_KEYS.USER_SOCKETS(user.id), socket.id)

    // Broadcast user online status
    socket.broadcast.emit('user:online', {
      userId: user.id,
      username: user.username
    })

    // Room management
    socket.on('room:join', async (data) => {
      try {
        const { roomId } = data

        // Validate room exists
        const room = await prisma.gameRoom.findUnique({
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

        if (!room) {
          socket.emit('error', { code: 'ERROR', message: 'An error occurred' })
          return
        }

        // Check room capacity
        if (room.players.length >= room.maxPlayers) {
          socket.emit('error', { code: 'ERROR', message: 'An error occurred' })
          return
        }

        // Check if user already in room
        const existingPlayer = room.players.find(p => p.userId === user.id)
        if (!existingPlayer) {
          // Add user to room
          await prisma.playerInRoom.create({
            data: {
              userId: user.id,
              roomId: roomId,
              isReady: false
            }
          })
        }

        // Join socket room
        await socket.join(roomId)
        activeConnections.get(socket.id)?.rooms.add(roomId)

        // Update room cache
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

        // Notify all players in room
        io.to(roomId).emit('room:joined', {
          roomId,
          room: updatedRoom,
          user: {
            id: user.id,
            username: true,
            avatar: user.avatar
          }
        })

      } catch (error) {
        console.error('Room join error:', error)
        socket.emit('error', { code: 'ERROR', message: 'An error occurred' })
      }
    })

    socket.on('room:leave', async (data) => {
      try {
        const { roomId } = data

        // Remove from database
        await prisma.playerInRoom.deleteMany({
          where: {
            userId: user.id,
            roomId: roomId
          }
        })

        // Leave socket room
        await socket.leave(roomId)
        activeConnections.get(socket.id)?.rooms.delete(roomId)

        // Clear room cache
        await CacheManager.del(CACHE_KEYS.GAME_ROOM(roomId))

        // Notify room
        socket.to(roomId).emit('room:left', {
          roomId,
          userId: user.id
        })

      } catch (error) {
        console.error('Room leave error:', error)
      }
    })

    socket.on('room:create', async (data) => {
      try {
        const { name, gameType, settings = {} } = data

        // Create room in database
        const room = await prisma.gameRoom.create({
          data: {
            name,
            gameType,
            hostId: user.id,
            settings,
            maxPlayers: settings.maxPlayers || 2,
            isPublic: settings.isPublic !== false
          },
          include: {
            host: { select: { id: true, username: true, avatar: true } },
            players: {
              include: {
                user: { select: { id: true, username: true, avatar: true } }
              }
            }
          }
        })

        // Auto-join creator
        await prisma.playerInRoom.create({
          data: {
            userId: user.id,
            roomId: room.id,
            isReady: false
          }
        })

        // Join socket room
        await socket.join(room.id)
        activeConnections.get(socket.id)?.rooms.add(room.id)

        // Cache room
        await CacheManager.set(CACHE_KEYS.GAME_ROOM(room.id), room, CACHE_TTL.MEDIUM)

        // Response to creator
        socket.emit('room:joined', {
          roomId: room.id,
          room,
          user: {
            id: user.id,
            username: true,
            avatar: user.avatar
          }
        })

      } catch (error) {
        console.error('Room create error:', error)
        socket.emit('error', { code: 'ERROR', message: 'An error occurred' })
      }
    })

    // Chat system
    socket.on('chat:send', async (data) => {
      // Per-IP burst limit for chat messages
      const xfwd = (socket.handshake.headers['x-forwarded-for'] as string) || ''
      const ip = (xfwd.split(',')[0]?.trim()) || (socket.handshake.address as string) || 'unknown'
      const chatLimit = await RateLimiter.checkRateLimit('socket:chat', 20, 10_000, ip)
      if (!chatLimit.allowed) {
        socket.emit('error', { code: 'RATE_LIMIT', message: 'You are sending messages too fast' })
        return
      }
      try {
        const { roomId, message, type = 'room' } = data

        if (!message || message.trim().length === 0) {
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

        // Cache recent messages
        const cacheKey = roomId ? CACHE_KEYS.CHAT_HISTORY(roomId) : 'chat:global'
        await CacheManager.lpush(cacheKey, {
          id: chatMessage.id,
          message: chatMessage.content,
          user: chatMessage.user,
          timestamp: chatMessage.createdAt,
          type: chatMessage.type
        })

        // Emit to appropriate audience
        const emitData = {
          roomId: roomId || 'global',
          message: chatMessage.content,
          user: chatMessage.user,
          timestamp: chatMessage.createdAt.toISOString(),
          id: chatMessage.id
        }

        if (type === 'room' && roomId) {
          io.to(roomId).emit('chat:message', emitData)
        } else {
          io.emit('chat:message', emitData)
        }

      } catch (error) {
        console.error('Chat message error:', error)
        socket.emit('error', { code: 'ERROR', message: 'An error occurred' })
      }
    })

    // Game state management
    socket.on('game:move', async (data) => {
      try {
        const { roomId, move } = data

        // Validate player is in room
        const playerInRoom = await prisma.playerInRoom.findFirst({
          where: {
            userId: user.id,
            roomId
          }
        })

        if (!playerInRoom) {
          socket.emit('error', { code: 'ERROR', message: 'An error occurred' })
          return
        }

        // Get current game state
        let gameState = await CacheManager.get(CACHE_KEYS.GAME_STATE(roomId))

        // Apply move using unified helper
        await applyMove(roomId, move)

        // Get updated state and broadcast
        const updatedGameState = await getRoomState(roomId)
        io.to(roomId).emit('game:state_update', updatedGameState as any)

      } catch (error) {
        console.error('Game move error:', error)
        socket.emit('error', { code: 'ERROR', message: 'An error occurred' })
      }
    })

    // Vereinheitlichte Game-Events (nach MASTER-PROMPT)
    socket.on('game:join', async (data) => {
      try {
        const { roomId, gameType } = data || {}
        if (!roomId) return
        await socket.join(roomId)
        const roomState = await getRoomState(roomId)
        socket.emit('game:state', roomState)
      } catch (e) {
        socket.emit('error', { code: 'ERROR', message: 'Ein Fehler ist aufgetreten' })
      }
    })

    socket.on('game:start', async (data) => {
      try {
        const { roomId } = data || {}
        if (!roomId) return
        await startMatch(roomId)
        const roomState = await getRoomState(roomId)
        io.to(roomId).emit('game:state', roomState)
      } catch (e) {
        socket.emit('error', { code: 'ERROR', message: 'Ein Fehler ist aufgetreten' })
      }
    })

    // UNO-Adapter für Alt-Clients
    socket.on('uno:join', (data) => socket.emit('game:join', data))
    socket.on('uno:start', (data) => socket.emit('game:start', data))
    socket.on('uno:move', (data) => socket.emit('game:move', data))







    // Ping/Pong for connection health
    socket.on('user:ping', () => {
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.lastPing = Date.now()
      }
      socket.emit('user:ping')
    })

    // Disconnect handling
    socket.on('disconnect', async (reason) => {
      console.log(`❌ User ${user.username} disconnected: ${reason}`)

      const connection = activeConnections.get(socket.id)
      if (connection) {
        // Leave all rooms
        for (const roomId of connection.rooms) {
          await socket.leave(roomId)
          socket.to(roomId).emit('room:left', {
            roomId,
            userId: user.id
          })
        }

        // Remove socket mapping and possibly online status
        await CacheManager.srem(CACHE_KEYS.USER_SOCKETS(user.id), socket.id)
        // If user has no sockets left, mark offline
        const remaining = await CacheManager.smembers(CACHE_KEYS.USER_SOCKETS(user.id))
        if (remaining.length === 0) {
          await CacheManager.srem(CACHE_KEYS.ONLINE_USERS, user.id)
        }
        activeConnections.delete(socket.id)

        // Broadcast offline status
        socket.broadcast.emit('user:offline', {
          userId: user.id
        })
      }
    })
  })

  // Cleanup inactive connections
  setInterval(() => {
    const now = Date.now()
    const timeout = 120000 // 2 minutes

    for (const [socketId, connection] of activeConnections.entries()) {
      if (now - connection.lastPing > timeout) {
        const socket = io.sockets.sockets.get(socketId)
        if (socket) {
          socket.disconnect(true)
        }
        activeConnections.delete(socketId)
      }
    }
  }, 60000) // Check every minute

  return io
}

// Hilfsfunktionen für vereinheitlichte Game-Events
async function getRoomState(roomId: string): Promise<unknown> {
  try {
    const gameState = await CacheManager.get(CACHE_KEYS.GAME_STATE(roomId))
    const room = await CacheManager.get(CACHE_KEYS.GAME_ROOM(roomId))
    return { roomId, gameState, room }
  } catch {
    return { roomId, gameState: null, room: null }
  }
}

async function startMatch(roomId: string): Promise<void> {
  try {
    const initialState = {
      status: 'started',
      startedAt: Date.now(),
      currentPlayer: null
    }
    await CacheManager.set(CACHE_KEYS.GAME_STATE(roomId), initialState, CACHE_TTL.LONG)
  } catch (e) {
    console.error('Start match error:', e)
  }
}

async function applyMove(roomId: string, move: unknown): Promise<void> {
  try {
    const currentState = await CacheManager.get(CACHE_KEYS.GAME_STATE(roomId)) || {}
    const updatedState = {
      ...currentState,
      lastMove: move,
      timestamp: Date.now()
    }
    await CacheManager.set(CACHE_KEYS.GAME_STATE(roomId), updatedState, CACHE_TTL.LONG)
  } catch (e) {
    console.error('Apply move error:', e)
  }
}
