'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  error: string | null
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // FIXED: Path muss EXAKT mit Server übereinstimmen
    // Server: path: '/api/socket/io'
    // Client: path: '/api/socket/io' (NICHT /api/socketio!)
    const socketInstance = io({
      path: '/api/socket/io',  // FIX: war vorher '/api/socketio'
      addTrailingSlash: false,
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
      setError(null)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      setError(err.message)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.close()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected, error }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = (roomId?: string): SocketContextType & {
  joinRoom: (roomId: string) => void,
  leaveRoom: (roomId: string) => void
} => {
  const context = useContext(SocketContext)

  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }

  const joinRoom = (roomId: string) => {
    if (context.socket && context.isConnected) {
      context.socket.emit('join-room', roomId)
    }
  }

  const leaveRoom = (roomId: string) => {
    if (context.socket && context.isConnected) {
      context.socket.emit('leave-room', roomId)
    }
  }

  // Auto-join room if roomId provided
  useEffect(() => {
    if (roomId && context.socket && context.isConnected) {
      joinRoom(roomId)
    }
  }, [roomId, context.socket, context.isConnected])

  return {
    ...context,
    joinRoom,
    leaveRoom
  }
}
