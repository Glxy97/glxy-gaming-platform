'use client'

import { toast } from 'sonner'
import {
  getClientSocket,
  type ClientSocket,
  type SocketAPI,
  createSocketAPI,
} from './socket-client'

export type ListenerPayload = {
  socket: ClientSocket | null
  socketAPI: SocketAPI | null
  isConnected: boolean
  connectionError: string | null
  reconnectAttempts: number
}

class SocketManager {
  private static instance: SocketManager | null = null

  private socket: ClientSocket | null = null
  private socketAPI: SocketAPI | null = null

  private isConnected = false
  private isConnecting = false
  private connectionError: string | null = null
  private reconnectAttempts = 0

  private listeners = new Set<(data: ListenerPayload) => void>()
  private currentUserId: string | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  private constructor() {}

  /** Baut die Verbindung (idempotent) auf. Führt Cleanup aus, wenn noch Reste existieren. */
  connect(userId: string) {
    if (this.isConnected || this.isConnecting) return

    // Vorsichtshalber alte Verbindung/Listener säubern
    if (this.socket) {
      this.teardown()
    }

    this.isConnecting = true
    this.currentUserId = userId
    this.connectionError = null
    this.reconnectAttempts = 0
    this.notifyListeners()

    // Singleton-Client verwenden (verhindert Doppelverbindungen)
    this.socket = getClientSocket()
    this.socketAPI = createSocketAPI(this.socket)

    // ---- Events ----
    this.socket.on('connect', () => {
      this.isConnected = true
      this.isConnecting = false
      this.connectionError = null
      this.reconnectAttempts = 0
      this.notifyListeners()

      // Heartbeat/Ping
      if (this.pingInterval) clearInterval(this.pingInterval)
      this.pingInterval = setInterval(() => {
        if (this.socket?.connected) {
          this.socketAPI?.ping({ ts: Date.now(), userId: this.currentUserId })
        }
      }, 30_000)

      // Einmaliger Cleanup beim Disconnect (für Ping)
      this.socket!.once('disconnect', () => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval)
          this.pingInterval = null
        }
      })
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
      this.isConnecting = false
      this.connectionError = reason || this.connectionError
      this.notifyListeners()
    })

    this.socket.on('connect_error', (err: any) => {
      this.isConnected = false
      this.isConnecting = false
      this.connectionError = err?.message ?? 'unknown error'
      this.notifyListeners()
      // Einmaliges Toasting (nicht auf jeder Reconnect-Schleife spammen)
      toast.error(`Socket error: ${this.connectionError}`)
    })

    this.socket.on('reconnect_attempt', () => {
      this.isConnected = false
      this.isConnecting = true
      this.reconnectAttempts += 1
      this.notifyListeners()
    })

    this.socket.on('reconnect', () => {
      this.isConnected = true
      this.isConnecting = false
      this.connectionError = null
      this.notifyListeners()
    })

    this.socket.on('reconnect_error', (err: any) => {
      this.isConnected = false
      this.isConnecting = true
      this.connectionError = err?.message ?? 'reconnect error'
      this.notifyListeners()
    })

    this.socket.on('reconnect_failed', () => {
      this.isConnected = false
      this.isConnecting = false
      if (!this.connectionError) this.connectionError = 'reconnect failed'
      this.notifyListeners()
      toast.error('Socket reconnect failed')
    })
  }

  /** Trennt die Verbindung und räumt auf. */
  disconnect() {
    this.teardown()
    this.notifyListeners()
  }

  /** Aktuellen Zustand abrufen. */
  getSnapshot(): ListenerPayload {
    return this.snapshot()
  }

  /** Listener registrieren (z. B. für React-Context/Hook). */
  addListener(cb: (data: ListenerPayload) => void) {
    this.listeners.add(cb)
    // Sofortiger Snapshot für neuen Listener
    cb(this.snapshot())
  }

  /** Listener entfernen. */
  removeListener(cb: (data: ListenerPayload) => void) {
    this.listeners.delete(cb)
  }

  // ---------- intern ----------

  private teardown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    // Event-Handler sauber entfernen, falls gewünscht:
    // (socket.io-Client hat keine globale "removeAllListeners" Typ-API, daher disconnect reicht meist)
    this.socket?.disconnect()

    this.socket = null
    this.socketAPI = null
    this.isConnected = false
    this.isConnecting = false
  }

  private snapshot(): ListenerPayload {
    return {
      socket: this.socket,
      socketAPI: this.socketAPI,
      isConnected: this.isConnected,
      connectionError: this.connectionError,
      reconnectAttempts: this.reconnectAttempts,
    }
  }

  private notifyListeners() {
    const s = this.snapshot()
    for (const cb of this.listeners) cb(s)
  }
}

// Sowohl Default- als auch Named-Export anbieten
export default SocketManager
export { SocketManager }
