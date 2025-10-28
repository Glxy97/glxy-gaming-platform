// @ts-nocheck
import { io, Socket } from 'socket.io-client'
import { useState, useEffect, useCallback, useRef } from 'react'

// Optimized Socket.IO client configuration
interface OptimizedSocketConfig {
  maxReconnectionAttempts?: number
  reconnectionDelay?: number
  reconnectionDelayMax?: number
  timeout?: number
  enableCompression?: boolean
  enableBinaryData?: boolean
}

// Performance monitoring for client-side operations
class ClientPerformanceMonitor {
  private static metrics = new Map<string, number[]>()
  private static maxMetricHistory = 100

  static recordLatency(operation: string, latency: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }

    const metrics = this.metrics.get(operation)!
    metrics.push(latency)

    // Keep only recent metrics
    if (metrics.length > this.maxMetricHistory) {
      metrics.splice(0, metrics.length - this.maxMetricHistory)
    }
  }

  static getAverageLatency(operation: string): number {
    const metrics = this.metrics.get(operation)
    if (!metrics || metrics.length === 0) return 0

    return metrics.reduce((sum, val) => sum + val, 0) / metrics.length
  }

  static getMetricsSummary() {
    const summary: Record<string, { avg: number, count: number, last: number }> = {}

    for (const [operation, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        summary[operation] = {
          avg: Math.round(metrics.reduce((sum, val) => sum + val, 0) / metrics.length),
          count: metrics.length,
          last: metrics[metrics.length - 1]
        }
      }
    }

    return summary
  }
}

// Connection state manager with automatic recovery
class ConnectionManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimeout: NodeJS.Timeout | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private lastPingTime = 0
  private isManuallyDisconnected = false

  constructor(private config: OptimizedSocketConfig = {}) {
    this.maxReconnectAttempts = config.maxReconnectionAttempts || 5
    this.reconnectDelay = config.reconnectionDelay || 1000
  }

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket
    }

    this.isManuallyDisconnected = false

    this.socket = io('', {
      path: '/api/socket/io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false, // We handle reconnection manually
      timeout: this.config.timeout || 20000,
      forceNew: false, // Reuse existing connections
      // Performance optimizations
      upgrade: true,
      rememberUpgrade: true,
    })

    this.setupEventHandlers()
    this.setupPingMonitoring()

    return this.socket
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('🟢 Socket connected:', this.socket!.id)
      this.reconnectAttempts = 0
      this.clearReconnectTimeout()

      // Record connection time
      const connectTime = Date.now() - this.lastPingTime
      if (this.lastPingTime > 0) {
        ClientPerformanceMonitor.recordLatency('connection_restore', connectTime)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason)

      // Only attempt reconnection for certain disconnect reasons
      if (!this.isManuallyDisconnected && this.shouldReconnect(reason)) {
        this.scheduleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message)
      ClientPerformanceMonitor.recordLatency('connection_error', Date.now())

      if (!this.isManuallyDisconnected) {
        this.scheduleReconnect()
      }
    })

    // Enhanced ping/pong monitoring
    this.socket.on('user:pong', (data) => {
      if (this.lastPingTime > 0) {
        const latency = Date.now() - this.lastPingTime
        ClientPerformanceMonitor.recordLatency('ping', latency)
      }
    })
  }

  private shouldReconnect(reason: string): boolean {
    const reconnectableReasons = [
      'io server disconnect',
      'io client disconnect',
      'ping timeout',
      'transport close',
      'transport error'
    ]
    return reconnectableReasons.includes(reason)
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔴 Max reconnection attempts reached')
      return
    }

    this.clearReconnectTimeout()

    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      30000
    )

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private setupPingMonitoring() {
    this.clearPingInterval()

    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.lastPingTime = Date.now()
        this.socket.emit('user:ping')
      }
    }, 30000) // Ping every 30 seconds
  }

  private clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  disconnect() {
    this.isManuallyDisconnected = true
    this.clearReconnectTimeout()
    this.clearPingInterval()

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getConnectionState() {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      transport: this.socket?.io.engine?.transport?.name,
      performance: ClientPerformanceMonitor.getMetricsSummary()
    }
  }
}

// Singleton connection manager
let connectionManager: ConnectionManager | null = null

export function getOptimizedSocket(config?: OptimizedSocketConfig): Socket {
  if (!connectionManager) {
    connectionManager = new ConnectionManager(config)
  }

  return connectionManager.connect()
}

// Optimized React hook with performance monitoring
export function useOptimizedSocket(config?: OptimizedSocketConfig) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<{
    connected: boolean
    socketId: string | undefined | null
    reconnectAttempts: number
    transport: string | undefined | null
    performance: Record<string, { avg: number; count: number; last: number }> | {}
  }>({
    connected: false,
    socketId: null,
    reconnectAttempts: 0,
    transport: null,
    performance: {}
  })

  const connectionManagerRef = useRef<ConnectionManager | null>(null)

  useEffect(() => {
    if (!connectionManagerRef.current) {
      connectionManagerRef.current = new ConnectionManager(config)
    }

    const manager = connectionManagerRef.current
    const socketInstance = manager.connect()
    setSocket(socketInstance)

    const onConnect = () => {
      setIsConnected(true)
      setConnectionError(null)
      setConnectionState(manager.getConnectionState())
    }

    const onDisconnect = () => {
      setIsConnected(false)
      setConnectionState(manager.getConnectionState())
    }

    const onError = (error: Error) => {
      setConnectionError(error.message)
      setConnectionState(manager.getConnectionState())
    }

    socketInstance.on('connect', onConnect)
    socketInstance.on('disconnect', onDisconnect)
    socketInstance.on('connect_error', onError)

    // Set initial state
    setIsConnected(socketInstance.connected)
    setConnectionState(manager.getConnectionState())

    // Update connection state periodically
    const stateUpdateInterval = setInterval(() => {
      setConnectionState(manager.getConnectionState())
    }, 5000)

    return () => {
      clearInterval(stateUpdateInterval)
      socketInstance.off('connect', onConnect)
      socketInstance.off('disconnect', onDisconnect)
      socketInstance.off('connect_error', onError)
    }
  }, [])

  const reconnect = useCallback(() => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.disconnect()
      const newSocket = connectionManagerRef.current.connect()
      setSocket(newSocket)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  return {
    socket,
    isConnected,
    connectionError,
    connectionState,
    reconnect,
    disconnect
  }
}

// Enhanced event emitter with automatic retries and queuing
export class OptimizedEventEmitter {
  private socket: Socket
  private eventQueue: Array<{ event: string, data: any, retries: number }> = []
  private maxRetries = 3
  private retryDelay = 1000

  constructor(socket: Socket) {
    this.socket = socket

    // Process queued events when reconnected
    this.socket.on('connect', () => {
      this.processEventQueue()
    })
  }

  emit(event: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()

      if (!this.socket.connected) {
        this.queueEvent(event, data)
        resolve()
        return
      }

      // Set up acknowledgment with timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Event ${event} timeout`))
      }, 10000)

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout)
        const latency = Date.now() - startTime
        ClientPerformanceMonitor.recordLatency(`emit_${event}`, latency)

        if (response?.error) {
          reject(new Error(response.error))
        } else {
          resolve()
        }
      })
    })
  }

  private queueEvent(event: string, data: any) {
    this.eventQueue.push({ event, data, retries: 0 })

    // Limit queue size
    if (this.eventQueue.length > 50) {
      this.eventQueue.shift()
    }
  }

  private async processEventQueue() {
    const queue = [...this.eventQueue]
    this.eventQueue = []

    for (const { event, data, retries } of queue) {
      try {
        await this.emit(event, data)
      } catch (error) {
        if (retries < this.maxRetries) {
          setTimeout(() => {
            this.queueEvent(event, { ...data, retries: retries + 1 })
          }, this.retryDelay * (retries + 1))
        } else {
          console.error(`Failed to emit ${event} after ${this.maxRetries} retries:`, error)
        }
      }
    }
  }

  getQueueSize(): number {
    return this.eventQueue.length
  }

  clearQueue() {
    this.eventQueue = []
  }
}

// Room management with local state synchronization
export class OptimizedRoomManager {
  private eventEmitter: OptimizedEventEmitter
  private currentRoom: string | null = null
  private roomState: any = null
  private lastSyncTime = 0

  constructor(socket: Socket) {
    this.eventEmitter = new OptimizedEventEmitter(socket)
    this.setupEventListeners(socket)
  }

  private setupEventListeners(socket: Socket) {
    socket.on('room:joined', (data) => {
      this.currentRoom = data.roomId
      this.roomState = data.room
      this.lastSyncTime = Date.now()
    })

    socket.on('room:updated', (data) => {
      if (data.roomId === this.currentRoom) {
        this.roomState = { ...this.roomState, ...data.updates }
        this.lastSyncTime = Date.now()
      }
    })

    socket.on('room:left', (data) => {
      if (data.roomId === this.currentRoom) {
        this.currentRoom = null
        this.roomState = null
      }
    })
  }

  async joinRoom(roomId: string): Promise<void> {
    const startTime = Date.now()

    try {
      await this.eventEmitter.emit('room:join', { roomId })
      ClientPerformanceMonitor.recordLatency('room_join', Date.now() - startTime)
    } catch (error) {
      ClientPerformanceMonitor.recordLatency('room_join_error', Date.now() - startTime)
      throw error
    }
  }

  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return

    const startTime = Date.now()

    try {
      await this.eventEmitter.emit('room:leave', { roomId: this.currentRoom })
      ClientPerformanceMonitor.recordLatency('room_leave', Date.now() - startTime)
    } catch (error) {
      ClientPerformanceMonitor.recordLatency('room_leave_error', Date.now() - startTime)
      throw error
    }
  }

  async createRoom(gameType: string, settings: any = {}): Promise<string> {
    const startTime = Date.now()

    try {
      await this.eventEmitter.emit('room:create', {
        name: `${gameType} Game`,
        gameType,
        settings
      })

      ClientPerformanceMonitor.recordLatency('room_create', Date.now() - startTime)

      // Wait for room joined event
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Room creation timeout'))
        }, 10000)

        const handleRoomJoined = (data: any) => {
          clearTimeout(timeout)
          resolve(data.roomId)
        }

        // This would need to be set up properly with the socket instance
        // For now, return the current room or throw
        if (this.currentRoom) {
          clearTimeout(timeout)
          resolve(this.currentRoom)
        } else {
          reject(new Error('Room creation failed'))
        }
      })
    } catch (error) {
      ClientPerformanceMonitor.recordLatency('room_create_error', Date.now() - startTime)
      throw error
    }
  }

  getCurrentRoom(): string | null {
    return this.currentRoom
  }

  getRoomState(): any {
    return this.roomState
  }

  getLastSyncTime(): number {
    return this.lastSyncTime
  }

  isInRoom(): boolean {
    return this.currentRoom !== null
  }
}

// Export performance monitoring for debugging
export { ClientPerformanceMonitor }

// Legacy compatibility
export function createSocketAPI(socket: Socket) {
  const eventEmitter = new OptimizedEventEmitter(socket)

  return {
    on: socket.on.bind(socket),
    emit: (event: string, data?: any) => eventEmitter.emit(event, data),
    disconnect: () => socket.disconnect(),
    ping: () => eventEmitter.emit('user:ping', {}),
  }
}