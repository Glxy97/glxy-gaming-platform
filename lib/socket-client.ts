import { io, Socket } from 'socket.io-client'
import { useState, useEffect } from 'react'

let socket: Socket | null = null

/** Singleton-Factory für den Socket.IO-Client. */
export function getClientSocket(): Socket {
  if (socket) return socket

  // Socket.IO Client für Multiplayer Gaming
  // Basis-URL leer lassen → Browser nimmt aktuelle Origin
  socket = io('', {
    path: '/api/socket/io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true, // Auto-connect für Multiplayer
    reconnection: true, // Aktiviert für stabile Verbindung
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  })

  // socket.on('connect', () => console.info('[io] connected', socket?.id))
  // socket.on('disconnect', (reason) => console.warn('[io] disconnected:', reason))
  // socket.on('connect_error', (err) => console.error('[io] error:', err?.message))

  return socket
}

// ---------------------------------------------------------------------------
// React Hook für Socket.IO
// ---------------------------------------------------------------------------

export function useSocket() {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    const socket = getClientSocket()
    setSocketInstance(socket)

    const onConnect = () => {
      setIsConnected(true)
      setConnectionError(null)
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }

    const onError = (error: Error) => {
      setConnectionError(error.message)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onError)

    // Set initial state
    setIsConnected(socket.connected)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onError)
    }
  }, [])

  return {
    socket: socketInstance,
    isConnected,
    connectionError
  }
}

// ---------------------------------------------------------------------------
// Zusätzliche Typen & Wrapper, damit alte Importe (ClientSocket, SocketAPI,
// createSocketAPI) weiter funktionieren.
// ---------------------------------------------------------------------------

/** Typalias für den Socket-Client (abgeleitet von getClientSocket). */
export type ClientSocket = ReturnType<typeof getClientSocket>

/** Minimal-API (Events abonnieren/emittieren, disconnect, ping). */
export type SocketAPI = {
  on: ClientSocket['on']
  emit: ClientSocket['emit']
  disconnect: () => void
  ping: (payload?: unknown) => void
}

/** Erstellt ein vereinfachtes SocketAPI-Objekt auf Basis eines aktiven Sockets. */
export function createSocketAPI(s: ClientSocket): SocketAPI {
  return {
    on: s.on.bind(s),
    emit: s.emit.bind(s),
    disconnect: () => s.disconnect(),
    ping: (payload?: unknown) => s.emit('ping', payload),
  }
}