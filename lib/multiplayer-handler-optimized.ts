// @ts-nocheck
/**
 * GLXY Gaming Platform - Optimized Multiplayer Game Handler
 * Enhanced with performance monitoring, state synchronization, and connection resilience
 */

import { Socket } from 'socket.io-client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore, GameType, GameMode, Player } from './game-state-manager'
import {
  OptimizedEventEmitter,
  OptimizedRoomManager,
  ClientPerformanceMonitor,
  useOptimizedSocket
} from './socket-client-optimized'

// Enhanced game state interface with versioning
export interface OptimizedGameState {
  roomId: string
  gameType: GameType
  players: Player[]
  gameState: any
  status: 'waiting' | 'playing' | 'paused' | 'finished'
  currentPlayer?: string
  host: Player
  version: number // For conflict resolution
  lastUpdate: number
  checksum?: string // For data integrity
}

// Game move with enhanced metadata
export interface OptimizedGameMove {
  playerId: string
  type: string
  data: any
  timestamp: number
  sequence: number // For ordering
  version: number // Game state version when move was made
  checksum?: string
}

// Performance-optimized state synchronization
export class GameStateSynchronizer {
  private localState: OptimizedGameState | null = null
  private pendingMoves: OptimizedGameMove[] = []
  private lastSyncTime = 0
  private syncInterval: NodeJS.Timeout | null = null
  private conflictResolution: 'client' | 'server' | 'timestamp' = 'server'

  constructor(private roomId: string, private eventEmitter: OptimizedEventEmitter) {
    this.startSyncInterval()
  }

  setLocalState(state: OptimizedGameState) {
    this.localState = state
    this.lastSyncTime = Date.now()
  }

  addPendingMove(move: OptimizedGameMove) {
    this.pendingMoves.push(move)

    // Limit pending moves to prevent memory bloat
    if (this.pendingMoves.length > 100) {
      this.pendingMoves = this.pendingMoves.slice(-50)
    }
  }

  async applyRemoteMove(move: OptimizedGameMove): Promise<boolean> {
    const startTime = Date.now()

    try {
      if (!this.localState) return false

      // Check if move is already applied (duplicate prevention)
      if (this.pendingMoves.some(m =>
        m.sequence === move.sequence && m.playerId === move.playerId
      )) {
        return false
      }

      // Version conflict detection
      if (move.version !== this.localState.version) {
        console.warn('Game state version mismatch:', {
          local: this.localState.version,
          remote: move.version
        })

        // Request state reconciliation
        await this.requestStateSync()
        return false
      }

      // Apply move to local state
      const newState = this.applyMoveToState(this.localState, move)
      if (newState) {
        this.localState = newState
        ClientPerformanceMonitor.recordLatency('move_apply', Date.now() - startTime)
        return true
      }

      return false
    } catch (error) {
      console.error('Error applying remote move:', error)
      ClientPerformanceMonitor.recordLatency('move_apply_error', Date.now() - startTime)
      return false
    }
  }

  private applyMoveToState(state: OptimizedGameState, move: OptimizedGameMove): OptimizedGameState | null {
    // Game-specific move application logic
    switch (state.gameType) {
      case 'TETRIS':
        return this.applyTetrisMove(state, move)
      case 'CONNECT4':
        return this.applyConnect4Move(state, move)
      case 'TICTACTOE':
        return this.applyTicTacToeMove(state, move)
      default:
        return null
    }
  }

  private applyTetrisMove(state: OptimizedGameState, move: OptimizedGameMove): OptimizedGameState | null {
    const newGameState = { ...state.gameState }

    switch (move.type) {
      case 'piece_move':
        newGameState.currentPiece = move.data.piece
        newGameState.currentPosition = move.data.position
        break
      case 'lines_cleared':
        newGameState.clearedLines = [...(newGameState.clearedLines || []), ...move.data.lines]
        newGameState.score = (newGameState.score || 0) + (move.data.count * 100)
        break
      case 'attack_lines':
        // Add attack lines to opponent
        if (move.playerId !== state.currentPlayer) {
          newGameState.attackLines = (newGameState.attackLines || 0) + move.data.count
        }
        break
      default:
        return null
    }

    return {
      ...state,
      gameState: newGameState,
      version: state.version + 1,
      lastUpdate: Date.now()
    }
  }

  private applyConnect4Move(state: OptimizedGameState, move: OptimizedGameMove): OptimizedGameState | null {
    const newGameState = { ...state.gameState }

    switch (move.type) {
      case 'column_drop':
        const board = newGameState.board || Array(6).fill(null).map(() => Array(7).fill(null))
        const column = move.data.column

        // Find lowest empty row in column
        for (let row = 5; row >= 0; row--) {
          if (!board[row][column]) {
            board[row][column] = move.playerId
            break
          }
        }

        newGameState.board = board
        newGameState.lastMove = { row: -1, column, player: move.playerId } // Row will be calculated
        break
      default:
        return null
    }

    return {
      ...state,
      gameState: newGameState,
      version: state.version + 1,
      lastUpdate: Date.now()
    }
  }

  private applyTicTacToeMove(state: OptimizedGameState, move: OptimizedGameMove): OptimizedGameState | null {
    const newGameState = { ...state.gameState }

    switch (move.type) {
      case 'place_mark':
        const board = newGameState.board || Array(3).fill(null).map(() => Array(3).fill(null))
        const { row, col } = move.data

        if (board[row][col] === null) {
          board[row][col] = move.playerId
          newGameState.board = board
          newGameState.lastMove = { row, col, player: move.playerId }
        }
        break
      default:
        return null
    }

    return {
      ...state,
      gameState: newGameState,
      version: state.version + 1,
      lastUpdate: Date.now()
    }
  }

  private async requestStateSync() {
    try {
      await this.eventEmitter.emit('game:sync_request', {
        roomId: this.roomId,
        localVersion: this.localState?.version || 0
      })
    } catch (error) {
      console.error('Failed to request state sync:', error)
    }
  }

  private startSyncInterval() {
    this.syncInterval = setInterval(() => {
      this.reconcilePendingMoves()
    }, 1000) // Reconcile every second
  }

  private reconcilePendingMoves() {
    if (this.pendingMoves.length === 0) return

    // Remove old pending moves (older than 30 seconds)
    const cutoff = Date.now() - 30000
    this.pendingMoves = this.pendingMoves.filter(move => move.timestamp >= cutoff)

    // Log if we have many pending moves (might indicate sync issues)
    if (this.pendingMoves.length > 10) {
      console.warn(`High number of pending moves: ${this.pendingMoves.length}`)
      ClientPerformanceMonitor.recordLatency('pending_moves_high', this.pendingMoves.length)
    }
  }

  getLocalState(): OptimizedGameState | null {
    return this.localState
  }

  getPendingMovesCount(): number {
    return this.pendingMoves.length
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.pendingMoves = []
    this.localState = null
  }
}

// Enhanced multiplayer handler with optimized performance
export class OptimizedMultiplayerHandler {
  private socket: Socket
  private eventEmitter: OptimizedEventEmitter
  private roomManager: OptimizedRoomManager
  private stateSynchronizer: GameStateSynchronizer | null = null
  protected gameStore: any
  private performanceMetrics = {
    messagesPerSecond: 0,
    averageLatency: 0,
    connectionUptime: 0,
    lastMessageTime: 0
  }
  private metricsInterval: NodeJS.Timeout | null = null

  constructor(socket: Socket) {
    this.socket = socket
    this.eventEmitter = new OptimizedEventEmitter(socket)
    this.roomManager = new OptimizedRoomManager(socket)
    this.gameStore = useGameStore.getState()

    this.setupEventListeners()
    this.startPerformanceMonitoring()
  }

  private setupEventListeners() {
    // Enhanced room events with performance tracking
    this.socket.on('room:joined', (data) => {
      const startTime = Date.now()
      this.handleRoomJoined(data)
      ClientPerformanceMonitor.recordLatency('room_joined_handle', Date.now() - startTime)
    })

    this.socket.on('room:updated', (data) => {
      const startTime = Date.now()
      this.handleRoomUpdated(data)
      ClientPerformanceMonitor.recordLatency('room_updated_handle', Date.now() - startTime)
    })

    // Optimized game events
    this.socket.on('game:state_update', (data) => {
      const startTime = Date.now()
      this.handleGameStateUpdate(data)
      ClientPerformanceMonitor.recordLatency('game_state_update_handle', Date.now() - startTime)
    })

    this.socket.on('game:move', (data) => {
      const startTime = Date.now()
      this.handleGameMove(data)
      ClientPerformanceMonitor.recordLatency('game_move_handle', Date.now() - startTime)
      this.updateMessageMetrics()
    })

    // Enhanced error handling
    this.socket.on('error', (error) => {
      this.handleError(error)
      ClientPerformanceMonitor.recordLatency('error_handle', Date.now())
    })

    // State synchronization events
    this.socket.on('game:sync_response', (data) => {
      this.handleStateSyncResponse(data)
    })
  }

  private startPerformanceMonitoring() {
    this.metricsInterval = setInterval(() => {
      this.calculatePerformanceMetrics()
    }, 5000) // Update every 5 seconds
  }

  private calculatePerformanceMetrics() {
    this.performanceMetrics = {
      messagesPerSecond: this.performanceMetrics.messagesPerSecond, // Updated in real-time
      averageLatency: ClientPerformanceMonitor.getAverageLatency('game_move'),
      connectionUptime: this.socket.connected ? Date.now() - (this.socket as any).connectedAt || 0 : 0,
      lastMessageTime: this.performanceMetrics.lastMessageTime
    }
  }

  private updateMessageMetrics() {
    this.performanceMetrics.lastMessageTime = Date.now()
    // Simple messages per second calculation (could be enhanced)
    this.performanceMetrics.messagesPerSecond =
      this.performanceMetrics.messagesPerSecond * 0.9 + 0.1 // Exponential moving average
  }

  // Enhanced room management
  async createRoom(gameType: GameType, name?: string, settings?: any): Promise<string> {
    const startTime = Date.now()

    try {
      const roomId = await this.roomManager.createRoom(gameType, {
        name: name || `${gameType} Game`,
        maxPlayers: 2,
        isPublic: true,
        ...settings
      })

      // Initialize state synchronizer for the new room
      this.stateSynchronizer = new GameStateSynchronizer(roomId, this.eventEmitter)

      ClientPerformanceMonitor.recordLatency('create_room', Date.now() - startTime)
      return roomId
    } catch (error) {
      ClientPerformanceMonitor.recordLatency('create_room_error', Date.now() - startTime)
      throw error
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    const startTime = Date.now()

    try {
      await this.roomManager.joinRoom(roomId)

      // Initialize state synchronizer for the joined room
      this.stateSynchronizer = new GameStateSynchronizer(roomId, this.eventEmitter)

      ClientPerformanceMonitor.recordLatency('join_room', Date.now() - startTime)
    } catch (error) {
      ClientPerformanceMonitor.recordLatency('join_room_error', Date.now() - startTime)
      throw error
    }
  }

  async leaveRoom(): Promise<void> {
    const startTime = Date.now()

    try {
      await this.roomManager.leaveRoom()

      // Clean up state synchronizer
      if (this.stateSynchronizer) {
        this.stateSynchronizer.destroy()
        this.stateSynchronizer = null
      }

      ClientPerformanceMonitor.recordLatency('leave_room', Date.now() - startTime)
    } catch (error) {
      ClientPerformanceMonitor.recordLatency('leave_room_error', Date.now() - startTime)
      throw error
    }
  }

  // Optimized move handling with batching
  private moveBatch: OptimizedGameMove[] = []
  private batchTimeout: NodeJS.Timeout | null = null

  async makeMove(move: Omit<OptimizedGameMove, 'timestamp' | 'sequence' | 'version'>): Promise<void> {
    const currentRoom = this.roomManager.getCurrentRoom()
    if (!currentRoom) {
      throw new Error('Not in a room')
    }

    const localState = this.stateSynchronizer?.getLocalState()
    const enhancedMove: OptimizedGameMove = {
      ...move,
      timestamp: Date.now(),
      sequence: Date.now(), // Use timestamp as sequence for now
      version: localState?.version || 0
    }

    // Add to local pending moves
    this.stateSynchronizer?.addPendingMove(enhancedMove)

    // Batch moves for performance (send multiple moves together)
    this.moveBatch.push(enhancedMove)

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.sendMoveBatch(currentRoom)
    }, 16) // ~60fps batching
  }

  private async sendMoveBatch(roomId: string) {
    if (this.moveBatch.length === 0) return

    const startTime = Date.now()
    const moves = [...this.moveBatch]
    this.moveBatch = []

    try {
      if (moves.length === 1) {
        // Single move - send normally
        await this.eventEmitter.emit('game:move', {
          roomId,
          move: moves[0]
        })
      } else {
        // Multiple moves - send as batch
        await this.eventEmitter.emit('game:move_batch', {
          roomId,
          moves
        })
      }

      ClientPerformanceMonitor.recordLatency('send_moves', Date.now() - startTime)
    } catch (error) {
      console.error('Failed to send move batch:', error)
      ClientPerformanceMonitor.recordLatency('send_moves_error', Date.now() - startTime)

      // Re-queue failed moves
      this.moveBatch.unshift(...moves)
    }
  }

  // Enhanced event handlers
  private handleRoomJoined(data: any) {
    console.log('Room joined:', data)

    const players = data.room.players.map((p: any) => ({
      id: p.user.id,
      name: p.user.username,
      avatar: p.user.avatar,
      isReady: p.isReady
    }))

    this.gameStore.setPlayers(players)

    // Initialize local game state
    if (this.stateSynchronizer) {
      const gameState: OptimizedGameState = {
        roomId: data.roomId,
        gameType: data.room.gameType,
        players,
        gameState: data.room.gameData || {},
        status: data.room.status || 'waiting',
        host: players.find((p: Player) => p.id === data.room.hostId) || players[0],
        version: 0,
        lastUpdate: Date.now()
      }

      this.stateSynchronizer.setLocalState(gameState)
    }
  }

  private handleRoomUpdated(data: any) {
    console.log('Room updated:', data)
    // Handle room updates efficiently
  }

  private handleGameStateUpdate(data: any) {
    if (!this.stateSynchronizer) return

    const { gameState, version } = data
    const currentState = this.stateSynchronizer.getLocalState()

    if (currentState && version > currentState.version) {
      // Update local state with server state
      const updatedState = {
        ...currentState,
        gameState,
        version,
        lastUpdate: Date.now()
      }

      this.stateSynchronizer.setLocalState(updatedState)
      this.gameStore.updateGameMetadata({
        multiplayerState: updatedState,
        lastSync: Date.now()
      })
    }
  }

  private async handleGameMove(data: any) {
    if (!this.stateSynchronizer) return

    const { move } = data
    const applied = await this.stateSynchronizer.applyRemoteMove(move)

    if (applied) {
      // Update game store with the applied move
      this.gameStore.updateGameMetadata({
        lastOpponentMove: move,
        lastMoveTime: Date.now()
      })
    }
  }

  private handleStateSyncResponse(data: any) {
    if (!this.stateSynchronizer) return

    const { gameState, version } = data
    const syncedState: OptimizedGameState = {
      ...gameState,
      version,
      lastUpdate: Date.now()
    }

    this.stateSynchronizer.setLocalState(syncedState)
    console.log('Game state synchronized with server')
  }

  private handleError(error: any) {
    console.error('Multiplayer error:', error)
    // Enhanced error handling could include automatic recovery
  }

  // Utility methods
  getCurrentRoom(): string | null {
    return this.roomManager.getCurrentRoom()
  }

  isInRoom(): boolean {
    return this.roomManager.isInRoom()
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      pendingMoves: this.stateSynchronizer?.getPendingMovesCount() || 0,
      clientMetrics: ClientPerformanceMonitor.getMetricsSummary()
    }
  }

  getConnectionState() {
    return {
      connected: this.socket.connected,
      socketId: this.socket.id,
      roomId: this.getCurrentRoom(),
      lastSync: this.stateSynchronizer?.getLocalState()?.lastUpdate || 0
    }
  }

  disconnect(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    if (this.stateSynchronizer) {
      this.stateSynchronizer.destroy()
      this.stateSynchronizer = null
    }

    this.socket.disconnect()
  }
}

// Game-specific optimized handlers
export class OptimizedTetrisMultiplayer extends OptimizedMultiplayerHandler {
  async sendPieceMove(position: { x: number; y: number }, piece: any): Promise<void> {
    await this.makeMove({
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'piece_move',
      data: { position, piece }
    })
  }

  async sendLineCleared(lines: number[]): Promise<void> {
    await this.makeMove({
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'lines_cleared',
      data: { lines, count: lines.length }
    })
  }

  async sendAttackLines(count: number): Promise<void> {
    await this.makeMove({
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'attack_lines',
      data: { count }
    })
  }
}

export class OptimizedConnect4Multiplayer extends OptimizedMultiplayerHandler {
  async sendColumnDrop(column: number): Promise<void> {
    await this.makeMove({
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'column_drop',
      data: { column }
    })
  }
}

// Factory function for creating optimized handlers
export function createOptimizedMultiplayerHandler(socket: Socket, gameType: GameType): OptimizedMultiplayerHandler {
  switch (gameType) {
    case 'TETRIS':
      return new OptimizedTetrisMultiplayer(socket)
    case 'CONNECT4':
      return new OptimizedConnect4Multiplayer(socket)
    default:
      return new OptimizedMultiplayerHandler(socket)
  }
}

// Enhanced React hook with performance monitoring
export function useOptimizedMultiplayer(gameType: GameType) {
  const { socket, isConnected, connectionState } = useOptimizedSocket({
    enableCompression: true,
    maxReconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  const [handler, setHandler] = useState<OptimizedMultiplayerHandler | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState({})
  const [gameState, setGameState] = useState<OptimizedGameState | null>(null)

  // Initialize handler when socket is available
  useEffect(() => {
    if (socket && isConnected) {
      const multiplayerHandler = createOptimizedMultiplayerHandler(socket, gameType)
      setHandler(multiplayerHandler)

      return () => {
        multiplayerHandler.disconnect()
      }
    }
    return undefined
  }, [socket, isConnected, gameType])

  // Update performance metrics periodically
  useEffect(() => {
    if (!handler) return

    const updateMetrics = () => {
      setPerformanceMetrics(handler.getPerformanceMetrics())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)

    return () => clearInterval(interval)
  }, [handler])

  // Performance-optimized callbacks
  const joinRoom = useCallback(async (roomId: string) => {
    if (handler) {
      await handler.joinRoom(roomId)
    }
  }, [handler])

  const createRoom = useCallback(async (name?: string, settings?: any) => {
    if (handler) {
      return await handler.createRoom(gameType, name, settings)
    }
    throw new Error('Handler not ready')
  }, [handler, gameType])

  const leaveRoom = useCallback(async () => {
    if (handler) {
      await handler.leaveRoom()
    }
  }, [handler])

  return {
    handler,
    isConnected,
    connectionState,
    performanceMetrics,
    gameState,
    joinRoom,
    createRoom,
    leaveRoom,
    currentRoom: handler?.getCurrentRoom(),
    isInRoom: handler?.isInRoom() || false
  }
}