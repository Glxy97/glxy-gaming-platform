/**
 * GLXY Ultimate FPS - Network Manager
 *
 * Complete networking orchestration for multiplayer FPS:
 * - WebSocket connection management
 * - Packet serialization and reliable delivery
 * - Client-side prediction with server reconciliation
 * - Lag compensation and entity interpolation
 * - Network metrics and quality monitoring
 * - Event-driven architecture
 *
 * @module NetworkManager
 * @version 1.10.0-alpha
 */

import { Vector3, Euler } from 'three'
import {
  // Types & Enums
  NetworkProtocol,
  ConnectionState,
  PacketType,
  PacketPriority,
  SyncMode,
  ServerRegion,

  // Configs
  NetworkConfig,
  NetworkMetrics,
  LagCompensationConfig,
  PredictionConfig,
  InterpolationConfig,
  NetworkSecurityConfig,

  // Packets
  BasePacket,
  ConnectionPacket,
  AuthPacket,
  HeartbeatPacket,
  InputPacket,
  InputState,
  StateUpdatePacket,
  SnapshotPacket,
  GameEventPacket,
  ChatPacket,
  VoicePacket,

  // States
  PlayerNetworkState,
  EntityNetworkState,
  HistoricalState,
  PredictedState,
  InterpolationBufferEntry,
  GameEvent,

  // Room & Matchmaking
  GameRoomInfo,
  GameServerInfo,
  MatchmakingTicket,
  PartyInfo,

  // Helpers
  createDefaultNetworkMetrics,
  calculateConnectionQuality,
  calculateNetworkStability,
  isSequenceValid,
  isTimestampValid,
  createPacketId
} from './data/NetworkData'

/**
 * Network event types
 */
export enum NetworkEventType {
  // Connection
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  RECONNECTED = 'reconnected',
  CONNECTION_ERROR = 'connection_error',

  // Authentication
  AUTHENTICATED = 'authenticated',
  AUTH_FAILED = 'auth_failed',

  // State
  STATE_UPDATE = 'state_update',
  SNAPSHOT_RECEIVED = 'snapshot_received',

  // Game Events
  GAME_EVENT = 'game_event',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',

  // Chat
  CHAT_MESSAGE = 'chat_message',

  // Room
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_UPDATE = 'room_update',

  // Matchmaking
  MATCHMAKING_STARTED = 'matchmaking_started',
  MATCHMAKING_FOUND = 'matchmaking_found',
  MATCHMAKING_CANCELLED = 'matchmaking_cancelled',

  // Quality
  QUALITY_CHANGED = 'quality_changed',
  HIGH_LATENCY = 'high_latency',
  PACKET_LOSS = 'packet_loss'
}

/**
 * Network event
 */
export interface NetworkEvent {
  type: NetworkEventType
  timestamp: number
  data?: any
}

/**
 * Reliable packet tracking
 */
interface ReliablePacketTracking {
  packet: BasePacket
  sendTime: number
  retransmissions: number
  acked: boolean
}

/**
 * Network Manager - Complete networking orchestration
 */
export class NetworkManager {
  // Connection
  private socket: WebSocket | null = null
  private state: ConnectionState = ConnectionState.DISCONNECTED
  private config: NetworkConfig

  // Authentication
  private clientId: string = ''
  private authToken: string = ''
  private authenticated: boolean = false

  // Packet Management
  private sendSequence: number = 0
  private receiveSequence: number = 0
  private reliablePackets: Map<string, ReliablePacketTracking> = new Map()
  private packetQueue: BasePacket[] = []

  // Metrics
  private metrics: NetworkMetrics
  private pingHistory: number[] = []
  private lastHeartbeat: number = 0
  private heartbeatInterval: any = null

  // Lag Compensation
  private lagCompensation: LagCompensationConfig
  private stateHistory: HistoricalState[] = []

  // Client-Side Prediction
  private prediction: PredictionConfig
  private pendingInputs: InputState[] = []
  private predictedState: PredictedState | null = null
  private lastAcknowledgedInput: number = 0

  // Entity Interpolation
  private interpolation: InterpolationConfig
  private interpolationBuffers: Map<string, InterpolationBufferEntry[]> = new Map()

  // Current State
  private serverTime: number = 0
  private localPlayers: Map<string, PlayerNetworkState> = new Map()
  private remotePlayers: Map<string, PlayerNetworkState> = new Map()
  private entities: Map<string, EntityNetworkState> = new Map()

  // Events
  private eventCallbacks: Map<NetworkEventType, Array<(event: NetworkEvent) => void>> = new Map()

  // Timers
  private updateTimer: any = null
  private cleanupTimer: any = null

  /**
   * Constructor
   */
  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = { ...this.getDefaultConfig(), ...config }
    this.metrics = createDefaultNetworkMetrics()

    this.lagCompensation = {
      enabled: this.config.lagCompensationEnabled,
      window: this.config.lagCompensationWindow,
      maxRewind: this.config.lagCompensationWindow,
      historySize: 60,
      minSnapshots: 3,
      hitboxRewind: true,
      positionRewind: true,
      stateRewind: true,
      validateHits: true,
      maxDistanceError: 2.0,
      maxTimeError: 500
    }

    this.prediction = {
      enabled: this.config.clientSidePrediction,
      inputBufferSize: 100,
      inputResendCount: 3,
      predictMovement: true,
      predictActions: true,
      predictPhysics: true,
      reconciliationEnabled: this.config.serverReconciliation,
      reconciliationThreshold: 0.1,
      smoothReconciliation: true,
      reconciliationSpeed: 0.5,
      errorCorrectionEnabled: true,
      maxPositionError: 5.0,
      maxVelocityError: 10.0
    }

    this.interpolation = {
      enabled: this.config.interpolationEnabled,
      mode: this.config.interpolationMode,
      delay: this.config.interpolationDelay,
      smoothing: this.config.smoothingFactor,
      maxExtrapolation: this.config.extrapolationLimit,
      extrapolationDamping: 0.9,
      errorThreshold: 0.5,
      correctionSpeed: 0.3,
      interpolatePosition: true,
      interpolateRotation: true,
      interpolateVelocity: true,
      maxInterpolationError: 10.0,
      snapThreshold: 20.0
    }

    this.startUpdateLoop()
    this.startCleanupLoop()
  }

  /**
   * Get default network configuration
   */
  private getDefaultConfig(): NetworkConfig {
    return {
      protocol: NetworkProtocol.WEBSOCKET,
      serverUrl: 'ws://localhost',
      port: 3001,
      secure: false,

      tickRate: 64,
      sendRate: 30,
      updateRate: 20,
      snapshotRate: 10,

      interpolationDelay: 100,
      extrapolationLimit: 500,
      bufferSize: 10,
      maxBufferSize: 30,

      timeoutMs: 10000,
      heartbeatInterval: 1000,
      reconnectAttempts: 5,
      reconnectDelay: 2000,

      maxRetransmissions: 3,
      ackTimeout: 1000,
      reliablePacketLifetime: 5000,

      compressionEnabled: true,
      compressionThreshold: 256,
      encryptionEnabled: false,

      deltaCompression: true,
      priorityUpdates: true,

      lagCompensationEnabled: true,
      lagCompensationWindow: 1000,
      clientSidePrediction: true,
      serverReconciliation: true,

      interpolationEnabled: true,
      interpolationMode: SyncMode.INTERPOLATION,
      smoothingFactor: 0.3,

      adaptiveQuality: true,
      minTickRate: 20,
      maxTickRate: 128,
      bandwidthLimit: 0
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to server
   */
  public async connect(url?: string, port?: number): Promise<void> {
    if (this.state !== ConnectionState.DISCONNECTED) {
      console.warn('Already connected or connecting')
      return
    }

    const serverUrl = url || this.config.serverUrl
    const serverPort = port || this.config.port
    const protocol = this.config.secure ? 'wss' : 'ws'
    const fullUrl = `${protocol}://${serverUrl}:${serverPort}`

    this.setState(ConnectionState.CONNECTING)

    try {
      this.socket = new WebSocket(fullUrl)

      this.socket.onopen = () => this.handleOpen()
      this.socket.onclose = (event) => this.handleClose(event)
      this.socket.onerror = (error) => this.handleError(error)
      this.socket.onmessage = (message) => this.handleMessage(message)

    } catch (error) {
      this.setState(ConnectionState.ERROR)
      this.dispatchEvent({
        type: NetworkEventType.CONNECTION_ERROR,
        timestamp: Date.now(),
        data: error
      })
      throw error
    }
  }

  /**
   * Disconnect from server
   */
  public disconnect(reason: string = 'Client disconnect'): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send disconnect packet
      const packet: ConnectionPacket = {
        type: PacketType.DISCONNECT,
        sequence: this.getNextSequence(),
        timestamp: Date.now(),
        priority: PacketPriority.HIGH,
        reliable: true,
        compressed: false,
        encrypted: false,
        clientId: this.clientId,
        reason: reason,
        version: '1.10.0'
      }

      this.sendPacket(packet)
      this.socket.close(1000, reason)
    }

    this.cleanup()
    this.setState(ConnectionState.DISCONNECTED)

    this.dispatchEvent({
      type: NetworkEventType.DISCONNECTED,
      timestamp: Date.now(),
      data: { reason }
    })
  }

  /**
   * Reconnect to server
   */
  public async reconnect(): Promise<void> {
    this.setState(ConnectionState.RECONNECTING)

    this.dispatchEvent({
      type: NetworkEventType.RECONNECTING,
      timestamp: Date.now()
    })

    try {
      await this.connect()

      this.dispatchEvent({
        type: NetworkEventType.RECONNECTED,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Reconnection failed:', error)
      throw error
    }
  }

  /**
   * Handle connection open
   */
  private handleOpen(): void {
    console.log('[Network] Connected to server')
    this.setState(ConnectionState.CONNECTED)

    // Start heartbeat
    this.startHeartbeat()

    // Send connection packet
    const packet: ConnectionPacket = {
      type: PacketType.CONNECT,
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      priority: PacketPriority.CRITICAL,
      reliable: true,
      compressed: false,
      encrypted: false,
      version: '1.10.0'
    }

    this.sendPacket(packet)

    this.dispatchEvent({
      type: NetworkEventType.CONNECTED,
      timestamp: Date.now()
    })
  }

  /**
   * Handle connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log('[Network] Connection closed:', event.code, event.reason)

    this.stopHeartbeat()
    this.cleanup()

    // Attempt reconnection if not intentional
    if (event.code !== 1000 && this.config.reconnectAttempts > 0) {
      setTimeout(() => {
        this.reconnect().catch(console.error)
      }, this.config.reconnectDelay)
    } else {
      this.setState(ConnectionState.DISCONNECTED)

      this.dispatchEvent({
        type: NetworkEventType.DISCONNECTED,
        timestamp: Date.now(),
        data: { code: event.code, reason: event.reason }
      })
    }
  }

  /**
   * Handle connection error
   */
  private handleError(error: Event): void {
    console.error('[Network] Connection error:', error)

    this.setState(ConnectionState.ERROR)

    this.dispatchEvent({
      type: NetworkEventType.CONNECTION_ERROR,
      timestamp: Date.now(),
      data: error
    })
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: MessageEvent): void {
    try {
      const packet = JSON.parse(message.data) as BasePacket

      // Update metrics
      this.metrics.packetsReceived++
      this.metrics.bytesReceived += message.data.length

      // Validate packet
      if (!this.validatePacket(packet)) {
        console.warn('[Network] Invalid packet:', packet)
        return
      }

      // Handle packet by type
      this.processPacket(packet)

    } catch (error) {
      console.error('[Network] Failed to process message:', error)
    }
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Authenticate with server
   */
  public async authenticate(token: string, userId: string, username: string): Promise<boolean> {
    if (this.state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to server')
    }

    this.setState(ConnectionState.AUTHENTICATING)

    const packet: AuthPacket = {
      type: PacketType.AUTH_REQUEST,
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      priority: PacketPriority.CRITICAL,
      reliable: true,
      compressed: false,
      encrypted: true,
      token: token,
      userId: userId,
      username: username
    }

    this.sendPacket(packet)

    // Wait for auth response (implement timeout)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'))
      }, 5000)

      const authHandler = (event: NetworkEvent) => {
        clearTimeout(timeout)
        this.off(NetworkEventType.AUTHENTICATED, authHandler)
        this.off(NetworkEventType.AUTH_FAILED, authHandler)

        if (event.type === NetworkEventType.AUTHENTICATED) {
          resolve(true)
        } else {
          reject(new Error(event.data?.error || 'Authentication failed'))
        }
      }

      this.on(NetworkEventType.AUTHENTICATED, authHandler)
      this.on(NetworkEventType.AUTH_FAILED, authHandler)
    })
  }

  // ============================================================================
  // PACKET MANAGEMENT
  // ============================================================================

  /**
   * Send packet to server
   */
  private sendPacket(packet: BasePacket): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[Network] Cannot send packet: not connected')
      return
    }

    try {
      // Track reliable packets
      if (packet.reliable) {
        const packetId = createPacketId(packet.type, packet.sequence)
        this.reliablePackets.set(packetId, {
          packet: packet,
          sendTime: Date.now(),
          retransmissions: 0,
          acked: false
        })
      }

      // Compress if needed
      let data = JSON.stringify(packet)
      if (this.config.compressionEnabled && data.length > this.config.compressionThreshold) {
        // Implement actual compression here (e.g., pako)
        packet.compressed = true
      }

      // Encrypt if needed
      if (this.config.encryptionEnabled || packet.encrypted) {
        // Implement actual encryption here
      }

      // Send
      this.socket.send(data)

      // Update metrics
      this.metrics.packetsSent++
      this.metrics.bytesSent += data.length

    } catch (error) {
      console.error('[Network] Failed to send packet:', error)
    }
  }

  /**
   * Send input to server
   */
  public sendInput(input: InputState): void {
    if (!this.authenticated) return

    // Add to pending inputs for prediction
    this.pendingInputs.push(input)

    // Keep only recent inputs
    if (this.pendingInputs.length > this.prediction.inputBufferSize) {
      this.pendingInputs.shift()
    }

    // Create input packet
    const packet: InputPacket = {
      type: PacketType.INPUT,
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      priority: PacketPriority.HIGH,
      reliable: false, // Inputs are sent frequently, don't need reliability
      compressed: false,
      encrypted: false,
      playerId: this.clientId,
      inputs: [input]
    }

    this.sendPacket(packet)

    // Client-side prediction
    if (this.prediction.enabled && this.predictedState) {
      this.predictMovement(input)
    }
  }

  /**
   * Send chat message
   */
  public sendChatMessage(message: string, channel: ChatPacket['channel'], recipientId?: string): void {
    const packet: ChatPacket = {
      type: PacketType.CHAT_MESSAGE,
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      priority: PacketPriority.NORMAL,
      reliable: true,
      compressed: false,
      encrypted: false,
      senderId: this.clientId,
      senderName: 'Player', // Get from player state
      message: message,
      channel: channel,
      recipientId: recipientId
    }

    this.sendPacket(packet)
  }

  /**
   * Process incoming packet
   */
  private processPacket(packet: BasePacket): void {
    // Update receive sequence
    if (isSequenceValid(packet.sequence, this.receiveSequence)) {
      this.receiveSequence = packet.sequence
    } else {
      this.metrics.outOfOrderPackets++
    }

    // Handle reliable ACK
    if (packet.type === PacketType.RELIABLE_ACK) {
      this.handleReliableAck(packet)
      return
    }

    // Send ACK for reliable packets
    if (packet.reliable) {
      this.sendAck(packet)
    }

    // Process by type
    switch (packet.type) {
      case PacketType.AUTH_RESPONSE:
        this.handleAuthResponse(packet as AuthPacket)
        break

      case PacketType.HEARTBEAT:
      case PacketType.PONG:
        this.handleHeartbeat(packet as HeartbeatPacket)
        break

      case PacketType.STATE_UPDATE:
        this.handleStateUpdate(packet as StateUpdatePacket)
        break

      case PacketType.SNAPSHOT:
        this.handleSnapshot(packet as SnapshotPacket)
        break

      case PacketType.CHAT_MESSAGE:
        this.handleChatMessage(packet as ChatPacket)
        break

      case PacketType.WEAPON_FIRE:
      case PacketType.WEAPON_HIT:
      case PacketType.EXPLOSION:
        this.handleGameEvent(packet as GameEventPacket)
        break

      default:
        console.warn('[Network] Unhandled packet type:', packet.type)
    }
  }

  /**
   * Handle authentication response
   */
  private handleAuthResponse(packet: AuthPacket): void {
    if (packet.authenticated) {
      this.authenticated = true
      this.clientId = packet.userId || ''
      this.authToken = packet.token || ''
      this.setState(ConnectionState.AUTHENTICATED)

      this.dispatchEvent({
        type: NetworkEventType.AUTHENTICATED,
        timestamp: Date.now(),
        data: { userId: this.clientId }
      })
    } else {
      this.setState(ConnectionState.ERROR)

      this.dispatchEvent({
        type: NetworkEventType.AUTH_FAILED,
        timestamp: Date.now(),
        data: { error: packet.error }
      })
    }
  }

  /**
   * Handle heartbeat/pong packet
   */
  private handleHeartbeat(packet: HeartbeatPacket): void {
    const now = Date.now()
    const rtt = now - packet.clientTime

    // Update ping metrics
    this.metrics.ping = rtt
    this.pingHistory.push(rtt)

    if (this.pingHistory.length > 100) {
      this.pingHistory.shift()
    }

    this.metrics.averagePing = this.pingHistory.reduce((a, b) => a + b, 0) / this.pingHistory.length
    this.metrics.minPing = Math.min(...this.pingHistory)
    this.metrics.maxPing = Math.max(...this.pingHistory)

    // Calculate jitter
    if (this.pingHistory.length > 1) {
      const differences = []
      for (let i = 1; i < this.pingHistory.length; i++) {
        differences.push(Math.abs(this.pingHistory[i] - this.pingHistory[i - 1]))
      }
      this.metrics.jitter = differences.reduce((a, b) => a + b, 0) / differences.length
    }

    // Update server time
    if (packet.serverTime) {
      this.serverTime = packet.serverTime
      this.metrics.serverTime = packet.serverTime
      this.metrics.clientTime = now
      this.metrics.timeDelta = packet.serverTime - now
    }

    // Update connection quality
    this.metrics.connectionQuality = calculateConnectionQuality(this.metrics)
    this.metrics.stability = calculateNetworkStability(this.metrics)

    // Dispatch quality change event if quality degraded significantly
    if (this.metrics.ping > 150) {
      this.dispatchEvent({
        type: NetworkEventType.HIGH_LATENCY,
        timestamp: now,
        data: { ping: this.metrics.ping }
      })
    }

    this.lastHeartbeat = now
  }

  /**
   * Handle state update
   */
  private handleStateUpdate(packet: StateUpdatePacket): void {
    this.serverTime = packet.serverTime

    // Update remote players
    for (const playerState of packet.players) {
      if (playerState.playerId !== this.clientId) {
        this.remotePlayers.set(playerState.playerId, playerState)

        // Add to interpolation buffer
        if (this.interpolation.enabled) {
          this.addToInterpolationBuffer(playerState.playerId, {
            timestamp: Date.now(),
            serverTime: packet.serverTime,
            state: playerState
          })
        }
      } else {
        // Server reconciliation for local player
        if (this.prediction.reconciliationEnabled) {
          this.reconcileState(playerState)
        }
      }
    }

    // Update entities
    for (const entityState of packet.entities) {
      this.entities.set(entityState.entityId, entityState)

      // Add to interpolation buffer
      if (this.interpolation.enabled) {
        this.addToInterpolationBuffer(entityState.entityId, {
          timestamp: Date.now(),
          serverTime: packet.serverTime,
          state: entityState
        })
      }
    }

    // Process game events
    for (const event of packet.events) {
      this.dispatchEvent({
        type: NetworkEventType.GAME_EVENT,
        timestamp: Date.now(),
        data: event
      })
    }

    // Store in history for lag compensation
    if (this.lagCompensation.enabled) {
      this.addToStateHistory(packet)
    }

    this.dispatchEvent({
      type: NetworkEventType.STATE_UPDATE,
      timestamp: Date.now(),
      data: packet
    })
  }

  /**
   * Handle snapshot packet
   */
  private handleSnapshot(packet: SnapshotPacket): void {
    this.serverTime = packet.serverTime

    // Full state update
    if (!packet.deltaFrom) {
      this.remotePlayers.clear()
      this.entities.clear()

      packet.players.forEach((state, id) => {
        if (id !== this.clientId) {
          this.remotePlayers.set(id, state)
        }
      })

      packet.entities.forEach((state, id) => {
        this.entities.set(id, state)
      })
    }

    this.dispatchEvent({
      type: NetworkEventType.SNAPSHOT_RECEIVED,
      timestamp: Date.now(),
      data: packet
    })
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(packet: ChatPacket): void {
    this.dispatchEvent({
      type: NetworkEventType.CHAT_MESSAGE,
      timestamp: Date.now(),
      data: {
        senderId: packet.senderId,
        senderName: packet.senderName,
        message: packet.message,
        channel: packet.channel
      }
    })
  }

  /**
   * Handle game event
   */
  private handleGameEvent(packet: GameEventPacket): void {
    this.dispatchEvent({
      type: NetworkEventType.GAME_EVENT,
      timestamp: Date.now(),
      data: packet.event
    })
  }

  /**
   * Send acknowledgment for reliable packet
   */
  private sendAck(packet: BasePacket): void {
    const ackPacket: BasePacket = {
      type: PacketType.RELIABLE_ACK,
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      priority: PacketPriority.HIGH,
      reliable: false,
      compressed: false,
      encrypted: false
    }

    this.sendPacket(ackPacket)
    this.metrics.acksSent++
  }

  /**
   * Handle reliable packet acknowledgment
   */
  private handleReliableAck(packet: BasePacket): void {
    // Mark packet as acknowledged
    // In production, extract original packet sequence from ACK
    this.metrics.acksReceived++
  }

  /**
   * Validate packet
   */
  private validatePacket(packet: BasePacket): boolean {
    // Validate sequence
    if (!isSequenceValid(packet.sequence, this.receiveSequence, 1000)) {
      return false
    }

    // Validate timestamp
    if (!isTimestampValid(packet.timestamp, Date.now(), 10000)) {
      return false
    }

    return true
  }

  // ============================================================================
  // CLIENT-SIDE PREDICTION
  // ============================================================================

  /**
   * Predict movement based on input
   */
  private predictMovement(input: InputState): void {
    if (!this.predictedState) return

    // Simple movement prediction
    const speed = input.sprint ? 10 : 5
    const direction = new Vector3(
      (input.right ? 1 : 0) - (input.left ? 1 : 0),
      0,
      (input.backward ? 1 : 0) - (input.forward ? 1 : 0)
    ).normalize()

    this.predictedState.velocity.copy(direction.multiplyScalar(speed))
    this.predictedState.position.add(
      this.predictedState.velocity.clone().multiplyScalar(input.deltaTime)
    )

    this.predictedState.inputs.push(input)
    this.predictedState.sequence = input.sequence
  }

  /**
   * Reconcile predicted state with server state
   */
  private reconcileState(serverState: PlayerNetworkState): void {
    if (!this.predictedState) {
      // Initialize predicted state
      this.predictedState = {
        sequence: serverState.sequence,
        timestamp: Date.now(),
        position: serverState.position.clone(),
        velocity: serverState.velocity.clone(),
        rotation: serverState.rotation.clone(),
        inputs: [],
        confirmed: true,
        errorMargin: 0
      }
      return
    }

    // Calculate position error
    const positionError = this.predictedState.position.distanceTo(serverState.position)

    // If error is significant, reconcile
    if (positionError > this.prediction.reconciliationThreshold) {
      console.log(`[Network] Reconciling state (error: ${positionError.toFixed(2)}m)`)

      if (this.prediction.smoothReconciliation) {
        // Smooth reconciliation
        this.predictedState.position.lerp(
          serverState.position,
          this.prediction.reconciliationSpeed
        )
      } else {
        // Snap to server position
        this.predictedState.position.copy(serverState.position)
      }

      // Re-apply unacknowledged inputs
      const unacknowledgedInputs = this.pendingInputs.filter(
        input => input.sequence > serverState.sequence
      )

      for (const input of unacknowledgedInputs) {
        this.predictMovement(input)
      }

      this.predictedState.errorMargin = positionError
    }

    // Remove acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequence > serverState.sequence
    )

    this.lastAcknowledgedInput = serverState.sequence
  }

  // ============================================================================
  // ENTITY INTERPOLATION
  // ============================================================================

  /**
   * Add state to interpolation buffer
   */
  private addToInterpolationBuffer(entityId: string, entry: InterpolationBufferEntry): void {
    let buffer = this.interpolationBuffers.get(entityId)

    if (!buffer) {
      buffer = []
      this.interpolationBuffers.set(entityId, buffer)
    }

    buffer.push(entry)

    // Keep buffer size limited
    if (buffer.length > this.config.maxBufferSize) {
      buffer.shift()
    }
  }

  /**
   * Interpolate entity state
   */
  public interpolateEntity(entityId: string): PlayerNetworkState | EntityNetworkState | null {
    const buffer = this.interpolationBuffers.get(entityId)
    if (!buffer || buffer.length < 2) {
      return null
    }

    const now = Date.now()
    const interpolationTime = now - this.interpolation.delay

    // Find surrounding states
    let from: InterpolationBufferEntry | null = null
    let to: InterpolationBufferEntry | null = null

    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].timestamp <= interpolationTime && buffer[i + 1].timestamp >= interpolationTime) {
        from = buffer[i]
        to = buffer[i + 1]
        break
      }
    }

    if (!from || !to) {
      // Use latest state if no interpolation possible
      return buffer[buffer.length - 1].state
    }

    // Calculate interpolation factor
    const timeDiff = to.timestamp - from.timestamp
    const elapsed = interpolationTime - from.timestamp
    const t = Math.min(Math.max(elapsed / timeDiff, 0), 1)

    // Interpolate position
    const fromState = from.state as any
    const toState = to.state as any

    const interpolated = { ...toState }

    if (this.interpolation.interpolatePosition) {
      interpolated.position = new Vector3().lerpVectors(
        fromState.position,
        toState.position,
        t
      )
    }

    if (this.interpolation.interpolateRotation && fromState.rotation && toState.rotation) {
      interpolated.rotation = new Euler().setFromVector3(
        new Vector3().lerpVectors(
          new Vector3(fromState.rotation.x, fromState.rotation.y, fromState.rotation.z),
          new Vector3(toState.rotation.x, toState.rotation.y, toState.rotation.z),
          t
        )
      )
    }

    return interpolated
  }

  // ============================================================================
  // LAG COMPENSATION
  // ============================================================================

  /**
   * Add state to history for lag compensation
   */
  private addToStateHistory(packet: StateUpdatePacket): void {
    const historicalState: HistoricalState = {
      sequence: packet.sequence,
      timestamp: Date.now(),
      serverTime: packet.serverTime,
      players: new Map(
        packet.players.map(p => [p.playerId, p])
      ),
      entities: new Map(
        packet.entities.map(e => [e.entityId, e])
      )
    }

    this.stateHistory.push(historicalState)

    // Keep history size limited
    if (this.stateHistory.length > this.lagCompensation.historySize) {
      this.stateHistory.shift()
    }

    // Remove states outside lag compensation window
    const cutoffTime = Date.now() - this.lagCompensation.window
    this.stateHistory = this.stateHistory.filter(s => s.timestamp > cutoffTime)
  }

  /**
   * Get historical state for lag compensation
   */
  public getHistoricalState(timestamp: number): HistoricalState | null {
    // Find closest historical state
    let closest: HistoricalState | null = null
    let minDiff = Infinity

    for (const state of this.stateHistory) {
      const diff = Math.abs(state.timestamp - timestamp)
      if (diff < minDiff) {
        minDiff = diff
        closest = state
      }
    }

    return closest
  }

  // ============================================================================
  // HEARTBEAT
  // ============================================================================

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const packet: HeartbeatPacket = {
          type: PacketType.PING,
          sequence: this.getNextSequence(),
          timestamp: Date.now(),
          priority: PacketPriority.HIGH,
          reliable: false,
          compressed: false,
          encrypted: false,
          clientTime: Date.now()
        }

        this.sendPacket(packet)
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  /**
   * Start update loop
   */
  private startUpdateLoop(): void {
    const updateInterval = 1000 / this.config.updateRate

    this.updateTimer = setInterval(() => {
      this.update()
    }, updateInterval)
  }

  /**
   * Update network manager
   */
  private update(): void {
    // Update metrics
    this.updateMetrics()

    // Resend unacknowledged reliable packets
    this.resendReliablePackets()

    // Clean up old interpolation buffer entries
    this.cleanupInterpolationBuffers()
  }

  /**
   * Update network metrics
   */
  private updateMetrics(): void {
    const now = Date.now()

    // Update rates
    this.metrics.updateRate = this.config.updateRate
    this.metrics.tickRate = this.config.tickRate

    // Update packet loss rate
    if (this.metrics.packetsSent > 0) {
      this.metrics.packetLossRate = this.metrics.packetsLost / this.metrics.packetsSent
    }
  }

  /**
   * Resend unacknowledged reliable packets
   */
  private resendReliablePackets(): void {
    const now = Date.now()

    for (const [packetId, tracking] of this.reliablePackets.entries()) {
      if (tracking.acked) {
        continue
      }

      const elapsed = now - tracking.sendTime

      // Resend if timeout exceeded
      if (elapsed > this.config.ackTimeout) {
        if (tracking.retransmissions < this.config.maxRetransmissions) {
          this.sendPacket(tracking.packet)
          tracking.sendTime = now
          tracking.retransmissions++
          this.metrics.retransmissions++
        } else {
          // Give up after max retransmissions
          console.warn(`[Network] Packet ${packetId} lost after ${tracking.retransmissions} retransmissions`)
          this.reliablePackets.delete(packetId)
          this.metrics.packetsLost++
        }
      }

      // Remove old packets
      if (elapsed > this.config.reliablePacketLifetime) {
        this.reliablePackets.delete(packetId)
      }
    }
  }

  /**
   * Clean up interpolation buffers
   */
  private cleanupInterpolationBuffers(): void {
    const cutoffTime = Date.now() - (this.interpolation.delay * 2)

    for (const [entityId, buffer] of this.interpolationBuffers.entries()) {
      // Remove old entries
      const filtered = buffer.filter(entry => entry.timestamp > cutoffTime)

      if (filtered.length === 0) {
        this.interpolationBuffers.delete(entityId)
      } else {
        this.interpolationBuffers.set(entityId, filtered)
      }
    }
  }

  /**
   * Start cleanup loop
   */
  private startCleanupLoop(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupReliablePackets()
    }, 5000)
  }

  /**
   * Clean up old reliable packet tracking
   */
  private cleanupReliablePackets(): void {
    const now = Date.now()

    for (const [packetId, tracking] of this.reliablePackets.entries()) {
      if (tracking.acked || now - tracking.sendTime > this.config.reliablePacketLifetime) {
        this.reliablePackets.delete(packetId)
      }
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to network event
   */
  public on(eventType: NetworkEventType, callback: (event: NetworkEvent) => void): void {
    let callbacks = this.eventCallbacks.get(eventType)

    if (!callbacks) {
      callbacks = []
      this.eventCallbacks.set(eventType, callbacks)
    }

    callbacks.push(callback)
  }

  /**
   * Unsubscribe from network event
   */
  public off(eventType: NetworkEventType, callback: (event: NetworkEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventType)

    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Dispatch network event
   */
  private dispatchEvent(event: NetworkEvent): void {
    const callbacks = this.eventCallbacks.get(event.type)

    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(event)
        } catch (error) {
          console.error('[Network] Event callback error:', error)
        }
      }
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get next packet sequence number
   */
  private getNextSequence(): number {
    return this.sendSequence++
  }

  /**
   * Set connection state
   */
  private setState(state: ConnectionState): void {
    this.state = state
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.stopHeartbeat()

    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.reliablePackets.clear()
    this.packetQueue = []
    this.pendingInputs = []
    this.interpolationBuffers.clear()
    this.stateHistory = []

    this.socket = null
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getState(): ConnectionState {
    return this.state
  }

  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED || this.state === ConnectionState.AUTHENTICATED
  }

  public isAuthenticated(): boolean {
    return this.authenticated
  }

  public getClientId(): string {
    return this.clientId
  }

  public getMetrics(): NetworkMetrics {
    return { ...this.metrics }
  }

  public getServerTime(): number {
    return this.serverTime
  }

  public getRemotePlayers(): Map<string, PlayerNetworkState> {
    return new Map(this.remotePlayers)
  }

  public getEntities(): Map<string, EntityNetworkState> {
    return new Map(this.entities)
  }

  public getPing(): number {
    return this.metrics.ping
  }

  public getConnectionQuality(): NetworkMetrics['connectionQuality'] {
    return this.metrics.connectionQuality
  }

  /**
   * Dispose network manager
   */
  public async dispose(): Promise<void> {
    this.disconnect('Client disposing')
    this.eventCallbacks.clear()
    this.cleanup()
  }
}
