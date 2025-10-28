/**
 * Production Socket.IO Server - Simplified for compilation
 * Provides real-time gaming functionality without complex dependencies
 */

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'

// Game room storage (in-memory for production)
const activeRooms = new Map<string, any>()
const activeUsers = new Map<string, any>()

interface GameMessage {
  type: string
  data: any
  timestamp: number
  userId?: string
  roomId?: string
}

export function createSocketServer(httpServer: HTTPServer) {
  console.info('[socket] Creating production Socket.IO server...')

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    transports: ['websocket', 'polling'],
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://glxy.at', 'https://www.glxy.at']
        : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // Connection handling
  io.on('connection', (socket) => {
    console.info(`[socket] User connected: ${socket.id}`)

    // Store user info
    activeUsers.set(socket.id, {
      id: socket.id,
      connected: new Date(),
      lastActivity: new Date()
    })

    // Room management
    socket.on('room:create', (data) => {
      try {
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const room = {
          id: roomId,
          name: data.name || `Room ${roomId.substr(-6)}`,
          game: data.game || 'chess',
          players: [{ id: socket.id, isHost: true }],
          maxPlayers: data.maxPlayers || 2,
          status: 'waiting',
          createdAt: new Date()
        }

        activeRooms.set(roomId, room)
        socket.join(roomId)

        socket.emit('room:created', { roomId, room })
        console.info(`[socket] Room created: ${roomId} by ${socket.id}`)
      } catch (error) {
        console.error('[socket] Room creation error:', error)
        socket.emit('error', { message: 'Failed to create room' })
      }
    })

    socket.on('room:join', (data) => {
      try {
        const { roomId } = data
        const room = activeRooms.get(roomId)

        if (!room) {
          socket.emit('error', { message: 'Room not found' })
          return
        }

        if (room.players.length >= room.maxPlayers) {
          socket.emit('error', { message: 'Room is full' })
          return
        }

        // Add player to room
        room.players.push({ id: socket.id, isHost: false })
        if (room.players.length === room.maxPlayers) {
          room.status = 'playing'
        }

        socket.join(roomId)
        socket.emit('room:joined', { room })
        io.to(roomId).emit('room:updated', { room })

        console.info(`[socket] User ${socket.id} joined room ${roomId}`)
      } catch (error) {
        console.error('[socket] Room join error:', error)
        socket.emit('error', { message: 'Failed to join room' })
      }
    })

    socket.on('room:leave', () => {
      try {
        // Find and remove user from all rooms
        for (const [roomId, room] of activeRooms.entries()) {
          const playerIndex = room.players.findIndex((p: { id: string; isHost?: boolean }) => p.id === socket.id)
          if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1)

            if (room.players.length === 0) {
              // Delete empty room
              activeRooms.delete(roomId)
              console.info(`[socket] Empty room deleted: ${roomId}`)
            } else {
              // Make next player host if host left
              if (room.players[playerIndex]?.isHost && room.players.length > 0) {
                room.players[0].isHost = true
              }
              io.to(roomId).emit('room:updated', { room })
            }

            socket.leave(roomId)
            console.info(`[socket] User ${socket.id} left room ${roomId}`)
            break
          }
        }
      } catch (error) {
        console.error('[socket] Room leave error:', error)
      }
    })

    socket.on('room:list', () => {
      try {
        const publicRooms = Array.from(activeRooms.values())
          .filter(room => room.status === 'waiting')
          .map(room => ({
            id: room.id,
            name: room.name,
            game: room.game,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers
          }))

        socket.emit('room:list', { rooms: publicRooms })
      } catch (error) {
        console.error('[socket] Room list error:', error)
      }
    })

    // Game actions
    socket.on('game:action', (data) => {
      try {
        const { roomId, action, gameState } = data

        if (!roomId) {
          socket.emit('error', { message: 'Room ID required' })
          return
        }

        // Broadcast game action to room
        socket.to(roomId).emit('game:action', {
          action,
          gameState,
          userId: socket.id,
          timestamp: Date.now()
        })

        console.info(`[socket] Game action in ${roomId} by ${socket.id}:`, action)
      } catch (error) {
        console.error('[socket] Game action error:', error)
        socket.emit('error', { message: 'Game action failed' })
      }
    })

    // Chat functionality
    socket.on('chat:message', (data) => {
      try {
        const { roomId, message } = data

        if (!roomId || !message) {
          socket.emit('error', { message: 'Room ID and message required' })
          return
        }

        const chatMessage: GameMessage = {
          type: 'chat',
          data: { message, userId: socket.id },
          timestamp: Date.now(),
          userId: socket.id,
          roomId
        }

        io.to(roomId).emit('chat:message', chatMessage)
        console.info(`[socket] Chat message in ${roomId} from ${socket.id}`)
      } catch (error) {
        console.error('[socket] Chat message error:', error)
      }
    })

    // System ping/pong
    socket.on('ping', (data) => {
      socket.emit('pong', {
        timestamp: Date.now(),
        data: data || null
      })
    })

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      console.info(`[socket] User disconnected: ${socket.id}, reason: ${reason}`)

      // Clean up user from rooms
      for (const [roomId, room] of activeRooms.entries()) {
        const playerIndex = room.players.findIndex((p: { id: string; isHost?: boolean }) => p.id === socket.id)
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1)

          if (room.players.length === 0) {
            activeRooms.delete(roomId)
          } else {
            if (room.players[playerIndex]?.isHost && room.players.length > 0) {
              room.players[0].isHost = true
            }
            io.to(roomId).emit('room:updated', { room })
          }

          io.to(roomId).emit('user:disconnected', { userId: socket.id })
          break
        }
      }

      // Remove from active users
      activeUsers.delete(socket.id)
    })

    // Error handling
    socket.on('error', (error) => {
      console.error(`[socket] Socket error for ${socket.id}:`, error)
    })
  })

  // Global error handling
  io.on('error', (error) => {
    console.error('[socket] Global socket error:', error)
  })

  console.info('[socket] Production Socket.IO server created successfully')
  return io
}

// Export room management functions for API routes
export function getRoomList() {
  return Array.from(activeRooms.values())
    .filter(room => room.status === 'waiting')
    .map(room => ({
      id: room.id,
      name: room.name,
      game: room.game,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers
    }))
}

export function getRoomById(roomId: string) {
  return activeRooms.get(roomId)
}

export function getActiveUserCount() {
  return activeUsers.size
}

// Default export for compatibility
export default createSocketServer