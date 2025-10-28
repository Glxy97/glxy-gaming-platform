// @ts-nocheck
/**
 * GLXY FPS Enhanced - Netcode Improvements System
 * Advanced networking with lag compensation, client-side prediction, and server reconciliation
 */

import * as THREE from 'three'

export interface NetworkMetrics {
  ping: number
  jitter: number
  packetLoss: number
  bandwidth: number
  serverTime: number
  clientTime: number
  timeDelta: number
  packetsSent: number
  packetsReceived: number
  bytesSent: number
  bytesReceived: number
  retransmissions: number
  outOfOrderPackets: number
  duplicatePackets: number
}

export interface NetworkConfig {
  tickRate: number
  updateRate: number
  sendRate: number
  bufferSize: number
  maxRetransmissions: number
  timeoutMs: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
  interpolationDelay: number
  extrapolationEnabled: boolean
  lagCompensationEnabled: boolean
  clientSidePrediction: boolean
  serverReconciliation: boolean
  priorityUpdates: boolean
  deltaCompression: boolean
}

export interface NetworkPlayer {
  id: string
  username: string
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  health: number
  armor: number
  currentWeapon: number
  ammo: { [key: number]: number }
  score: number
  kills: number
  deaths: number
  isAlive: boolean
  isSprinting: boolean
  isAiming: boolean
  isShooting: boolean
  lastUpdate: number
  latency: number
  interpolationBuffer: any[]
  predictedState: any
  reconciledState: any
}

export interface InputState {
  sequence: number
  timestamp: number
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean
  sprint: boolean
  aim: boolean
  shoot: boolean
  reload: boolean
  weaponSwitch: number
  mouseX: number
  mouseY: number
  processed: boolean
}

export interface GameStateSnapshot {
  sequence: number
  timestamp: number
  players: Map<string, NetworkPlayer>
  projectiles: any[]
  events: any[]
  worldState: any
}

export interface NetworkPacket {
  type: 'input' | 'state' | 'event' | 'heartbeat' | 'connect' | 'disconnect' | 'chat' | 'reliable'
  sequence: number
  timestamp: number
  data: any
  priority: 'low' | 'normal' | 'high' | 'critical'
  reliable: boolean
  compressed: boolean
  encrypted: boolean
}

export class GLXYNetcodeImprovements {
  private ws: WebSocket | null = null
  private config: NetworkConfig
  private metrics: NetworkMetrics
  private players: Map<string, NetworkPlayer> = new Map()
  private localPlayer: NetworkPlayer | null = null
  private inputQueue: InputState[] = []
  private unacknowledgedInputs: Map<number, InputState> = new Map()
  private stateBuffer: GameStateSnapshot[] = []
  private interpolationBuffer: Map<string, any[]> = new Map()
  private eventQueue: any[] = []
  private packetBuffer: Map<number, NetworkPacket> = new Map()
  private reliablePackets: Map<number, NetworkPacket> = new Map()
  private sequenceNumber: number = 0
  private lastInputSequence: number = 0
  private lastStateSequence: number = 0
  private serverTimeDelta: number = 0
  private rtt: number = 0
  private jitterBuffer: number[] = []
  private bandwidthMeasurements: number[] = []
  private connected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private connectionCallbacks: {
    onConnect?: () => void
    onDisconnect?: () => void
    onPlayerJoin?: (player: NetworkPlayer) => void
    onPlayerLeave?: (playerId: string) => void
    onGameState?: (state: GameStateSnapshot) => void
    onEvent?: (event: any) => void
    onError?: (error: any) => void
  } = {}

  constructor(config?: Partial<NetworkConfig>) {
    this.config = this.createDefaultConfig()
    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.metrics = this.initializeMetrics()
    this.startNetworkLoop()
  }

  private createDefaultConfig(): NetworkConfig {
    return {
      tickRate: 60,
      updateRate: 60,
      sendRate: 30,
      bufferSize: 60, // 1 second at 60 FPS
      maxRetransmissions: 5,
      timeoutMs: 3000,
      compressionEnabled: true,
      encryptionEnabled: true,
      interpolationDelay: 100, // 100ms
      extrapolationEnabled: true,
      lagCompensationEnabled: true,
      clientSidePrediction: true,
      serverReconciliation: true,
      priorityUpdates: true,
      deltaCompression: true
    }
  }

  private initializeMetrics(): NetworkMetrics {
    return {
      ping: 0,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      serverTime: 0,
      clientTime: Date.now(),
      timeDelta: 0,
      packetsSent: 0,
      packetsReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      retransmissions: 0,
      outOfOrderPackets: 0,
      duplicatePackets: 0
    }
  }

  private startNetworkLoop(): void {
    // Input processing loop
    setInterval(() => {
      this.processInputs()
      this.sendInputBatch()
    }, 1000 / this.config.sendRate)

    // State update loop
    setInterval(() => {
      this.processStateUpdates()
      this.interpolatePlayerStates()
    }, 1000 / this.config.updateRate)

    // Metrics update loop
    setInterval(() => {
      this.updateNetworkMetrics()
    }, 1000)

    // Cleanup loop
    setInterval(() => {
      this.cleanupOldPackets()
      this.cleanupOldStates()
    }, 5000)

    // Heartbeat loop
    setInterval(() => {
      this.sendHeartbeat()
    }, 30000)
  }

  public connect(serverUrl: string, playerData: Partial<NetworkPlayer>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl)

        this.ws.onopen = () => {
          console.log('🌐 Connected to GLXY game server')
          this.connected = true
          this.reconnectAttempts = 0
          this.sendConnectionPacket(playerData)
          this.connectionCallbacks.onConnect?.()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from GLXY game server')
          this.connected = false
          this.connectionCallbacks.onDisconnect?.()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('🚫 WebSocket error:', error)
          this.connectionCallbacks.onError?.(error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  public disconnect(): void {
    if (this.ws) {
      this.sendDisconnectionPacket()
      this.ws.close()
      this.ws = null
    }
    this.connected = false
  }

  private sendConnectionPacket(playerData: Partial<NetworkPlayer>): void {
    const packet: NetworkPacket = {
      type: 'connect',
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      data: playerData,
      priority: 'high',
      reliable: true,
      compressed: this.config.compressionEnabled,
      encrypted: this.config.encryptionEnabled
    }

    this.sendPacket(packet)
  }

  private sendDisconnectionPacket(): void {
    const packet: NetworkPacket = {
      type: 'disconnect',
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      data: { playerId: this.localPlayer?.id },
      priority: 'normal',
      reliable: false,
      compressed: false,
      encrypted: false
    }

    this.sendPacket(packet)
  }

  private handleMessage(data: string): void {
    try {
      const packet: NetworkPacket = JSON.parse(data)

      if (packet.compressed) {
        packet.data = this.decompressData(packet.data)
      }

      if (packet.encrypted) {
        packet.data = this.decryptData(packet.data)
      }

      this.metrics.packetsReceived++
      this.metrics.bytesReceived += data.length

      // Handle out-of-order packets
      if (packet.sequence < this.lastStateSequence && packet.type === 'state') {
        this.metrics.outOfOrderPackets++
        return
      }

      // Handle duplicate packets
      if (this.packetBuffer.has(packet.sequence)) {
        this.metrics.duplicatePackets++
        return
      }

      this.packetBuffer.set(packet.sequence, packet)

      switch (packet.type) {
        case 'state':
          this.handleStatePacket(packet)
          break
        case 'event':
          this.handleEventPacket(packet)
          break
        case 'heartbeat':
          this.handleHeartbeatPacket(packet)
          break
        case 'reliable':
          this.handleReliablePacket(packet)
          break
        case 'connect':
          this.handleConnectPacket(packet)
          break
        case 'disconnect':
          this.handleDisconnectPacket(packet)
          break
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  private handleStatePacket(packet: NetworkPacket): void {
    const state: GameStateSnapshot = packet.data
    this.lastStateSequence = packet.sequence
    this.stateBuffer.push(state)

    // Keep only recent states
    if (this.stateBuffer.length > this.config.bufferSize) {
      this.stateBuffer.shift()
    }

    // Update server time delta
    this.updateServerTimeDelta(packet.timestamp)

    // Process server reconciliation
    if (this.config.serverReconciliation) {
      this.processServerReconciliation(state)
    }

    this.connectionCallbacks.onGameState?.(state)
  }

  private handleEventPacket(packet: NetworkPacket): void {
    const event = packet.data
    this.eventQueue.push(event)
    this.connectionCallbacks.onEvent?.(event)
  }

  private handleHeartbeatPacket(packet: NetworkPacket): void {
    this.updateRTT(packet.timestamp)
    this.sendHeartbeatResponse(packet.sequence)
  }

  private handleReliablePacket(packet: NetworkPacket): void {
    // Send acknowledgment
    this.sendAcknowledgment(packet.sequence)

    // Process reliable packet
    this.handleMessage(JSON.stringify(packet.data))
  }

  private handleConnectPacket(packet: NetworkPacket): void {
    const player: NetworkPlayer = packet.data
    this.players.set(player.id, player)
    this.connectionCallbacks.onPlayerJoin?.(player)
  }

  private handleDisconnectPacket(packet: NetworkPacket): void {
    const playerId = packet.data.playerId
    this.players.delete(playerId)
    this.connectionCallbacks.onPlayerLeave?.(playerId)
  }

  private updateServerTimeDelta(serverTimestamp: number): void {
    const clientTime = Date.now()
    const oneWayLatency = this.rtt / 2
    this.serverTimeDelta = (serverTimestamp + oneWayLatency) - clientTime
    this.metrics.serverTime = serverTimestamp
    this.metrics.clientTime = clientTime
    this.metrics.timeDelta = this.serverTimeDelta
  }

  private updateRTT(timestamp: number): void {
    const now = Date.now()
    this.rtt = now - timestamp
    this.metrics.ping = Math.round(this.rtt)

    // Update jitter
    this.jitterBuffer.push(this.metrics.ping)
    if (this.jitterBuffer.length > 10) {
      this.jitterBuffer.shift()
    }

    if (this.jitterBuffer.length > 1) {
      const jitter = this.calculateJitter(this.jitterBuffer)
      this.metrics.jitter = Math.round(jitter)
    }
  }

  private calculateJitter(samples: number[]): number {
    let sum = 0
    for (let i = 1; i < samples.length; i++) {
      sum += Math.abs(samples[i] - samples[i - 1])
    }
    return sum / (samples.length - 1)
  }

  private sendHeartbeat(): void {
    if (!this.connected) return

    const packet: NetworkPacket = {
      type: 'heartbeat',
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      data: {},
      priority: 'low',
      reliable: false,
      compressed: false,
      encrypted: false
    }

    this.sendPacket(packet)
  }

  private sendHeartbeatResponse(sequence: number): void {
    const packet: NetworkPacket = {
      type: 'heartbeat',
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      data: { responseTo: sequence },
      priority: 'low',
      reliable: false,
      compressed: false,
      encrypted: false
    }

    this.sendPacket(packet)
  }

  private sendAcknowledgment(sequence: number): void {
    const packet: NetworkPacket = {
      type: 'reliable',
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      data: { ack: sequence },
      priority: 'high',
      reliable: false,
      compressed: false,
      encrypted: false
    }

    this.sendPacket(packet)
  }

  public sendInput(input: Partial<InputState>): void {
    if (!this.connected || !this.localPlayer) return

    const inputState: InputState = {
      sequence: this.getNextInputSequence(),
      timestamp: Date.now(),
      forward: input.forward || false,
      backward: input.backward || false,
      left: input.left || false,
      right: input.right || false,
      jump: input.jump || false,
      crouch: input.crouch || false,
      sprint: input.sprint || false,
      aim: input.aim || false,
      shoot: input.shoot || false,
      reload: input.reload || false,
      weaponSwitch: input.weaponSwitch || -1,
      mouseX: input.mouseX || 0,
      mouseY: input.mouseY || 0,
      processed: false
    }

    this.inputQueue.push(inputState)
    this.unacknowledgedInputs.set(inputState.sequence, inputState)

    // Client-side prediction
    if (this.config.clientSidePrediction && this.localPlayer) {
      this.predictMovement(inputState)
    }
  }

  private getNextInputSequence(): number {
    return ++this.lastInputSequence
  }

  private predictMovement(input: InputState): void {
    if (!this.localPlayer) return

    // Simple movement prediction
    const speed = input.sprint ? 8 : input.crouch ? 2 : 5
    const moveVector = new THREE.Vector3()

    if (input.forward) moveVector.z -= 1
    if (input.backward) moveVector.z += 1
    if (input.left) moveVector.x -= 1
    if (input.right) moveVector.x += 1

    moveVector.normalize().multiplyScalar(speed * 0.016) // 60 FPS

    this.localPlayer.position.add(moveVector)
    this.localPlayer.rotation.y -= input.mouseX * 0.002
  }

  private processInputs(): void {
    // Process pending inputs
    this.inputQueue.forEach(input => {
      if (!input.processed) {
        // Process input for local player
        input.processed = true
      }
    })
  }

  private sendInputBatch(): void {
    if (!this.connected || this.inputQueue.length === 0) return

    const inputs = this.inputQueue.splice(0, 10) // Send max 10 inputs per packet

    const packet: NetworkPacket = {
      type: 'input',
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      data: { inputs },
      priority: 'high',
      reliable: true,
      compressed: this.config.compressionEnabled,
      encrypted: this.config.encryptionEnabled
    }

    this.sendPacket(packet)
  }

  private processServerReconciliation(state: GameStateSnapshot): void {
    if (!this.localPlayer) return

    const serverPlayer = state.players.get(this.localPlayer.id)
    if (!serverPlayer) return

    // Find last acknowledged input
    const lastAckedInput = this.findLastAcknowledgedInput(serverPlayer.position)
    if (lastAckedInput === null) return

    // Remove acknowledged inputs
    this.unacknowledgedInputs.forEach((input, sequence) => {
      if (sequence <= lastAckedInput) {
        this.unacknowledgedInputs.delete(sequence)
      }
    })

    // Reconcile position
    const positionError = this.localPlayer.position.distanceTo(serverPlayer.position)
    if (positionError > 0.1) {
      // Apply correction
      this.localPlayer.position.copy(serverPlayer.position)
      this.localPlayer.rotation.copy(serverPlayer.rotation)

      // Replay unacknowledged inputs
      this.replayInputs(lastAckedInput)
    }
  }

  private findLastAcknowledgedInput(serverPosition: THREE.Vector3): number | null {
    let lastAckedInput: number | null = null

    this.unacknowledgedInputs.forEach((input, sequence) => {
      if (input.timestamp <= Date.now() - this.rtt) {
        lastAckedInput = sequence
      }
    })

    return lastAckedInput
  }

  private replayInputs(fromSequence: number): void {
    if (!this.localPlayer) return

    // Reset to last known server state
    const currentState = { ...this.localPlayer }

    // Replay inputs
    this.unacknowledgedInputs.forEach((input, sequence) => {
      if (sequence > fromSequence) {
        this.predictMovement(input)
      }
    })
  }

  private interpolatePlayerStates(): void {
    const renderTime = Date.now() - this.config.interpolationDelay

    this.players.forEach((player, playerId) => {
      if (playerId === this.localPlayer?.id) return // Don't interpolate local player

      const buffer = this.interpolationBuffer.get(playerId) || []
      if (buffer.length < 2) return

      // Find two states to interpolate between
      const state1 = buffer.find(s => s.timestamp <= renderTime)
      const state2 = buffer.find(s => s.timestamp > renderTime)

      if (state1 && state2) {
        const t = (renderTime - state1.timestamp) / (state2.timestamp - state1.timestamp)
        player.position.lerpVectors(state1.position, state2.position, t)
        // Convert Euler rotations to quaternions for smooth interpolation
        const quat1 = new THREE.Quaternion().setFromEuler(state1.rotation)
        const quat2 = new THREE.Quaternion().setFromEuler(state2.rotation)
        const resultQuat = new THREE.Quaternion().slerpQuaternions(quat1, quat2, t)
        player.rotation.setFromQuaternion(resultQuat)
      }
    })
  }

  private processStateUpdates(): void {
    // Update interpolation buffers
    this.stateBuffer.forEach(state => {
      state.players.forEach((player, playerId) => {
        const buffer = this.interpolationBuffer.get(playerId) || []
        buffer.push({
          timestamp: state.timestamp,
          position: player.position.clone(),
          rotation: player.rotation.clone(),
          velocity: player.velocity.clone()
        })

        // Keep only recent states
        if (buffer.length > 60) {
          buffer.shift()
        }

        this.interpolationBuffer.set(playerId, buffer)
      })
    })
  }

  private updateNetworkMetrics(): void {
    // Calculate packet loss
    const totalPackets = this.metrics.packetsSent + this.metrics.packetsReceived
    if (totalPackets > 0) {
      this.metrics.packetLoss = Math.round((this.metrics.retransmissions / totalPackets) * 100)
    }

    // Calculate bandwidth
    this.bandwidthMeasurements.push(this.metrics.bytesReceived)
    if (this.bandwidthMeasurements.length > 10) {
      this.bandwidthMeasurements.shift()
    }

    if (this.bandwidthMeasurements.length > 0) {
      const averageBytes = this.bandwidthMeasurements.reduce((a, b) => a + b, 0) / this.bandwidthMeasurements.length
      this.metrics.bandwidth = Math.round(averageBytes * 8 / 1024) // Convert to kbps
    }
  }

  private cleanupOldPackets(): void {
    const cutoffTime = Date.now() - this.config.timeoutMs

    this.packetBuffer.forEach((packet, sequence) => {
      if (packet.timestamp < cutoffTime) {
        this.packetBuffer.delete(sequence)
      }
    })

    this.reliablePackets.forEach((packet, sequence) => {
      if (packet.timestamp < cutoffTime) {
        this.reliablePackets.delete(sequence)
      }
    })
  }

  private cleanupOldStates(): void {
    const cutoffTime = Date.now() - this.config.bufferSize * 16.67 // Convert to ms

    this.stateBuffer = this.stateBuffer.filter(state => state.timestamp > cutoffTime)
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      // Reconnection logic would go here
    }, delay)
  }

  private sendPacket(packet: NetworkPacket): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    try {
      let data = JSON.stringify(packet)

      // Compress if enabled
      if (packet.compressed) {
        data = this.compressData(data)
      }

      // Encrypt if enabled
      if (packet.encrypted) {
        data = this.encryptData(data)
      }

      this.ws.send(data)
      this.metrics.packetsSent++
      this.metrics.bytesSent += data.length

      // Store reliable packets for retransmission
      if (packet.reliable) {
        this.reliablePackets.set(packet.sequence, packet)
      }
    } catch (error) {
      console.error('Error sending packet:', error)
    }
  }

  private compressData(data: string): string {
    // Simple compression - in a real implementation, use proper compression library
    return btoa(data)
  }

  private decompressData(data: string): string {
    // Simple decompression - in a real implementation, use proper compression library
    try {
      return atob(data)
    } catch {
      return data
    }
  }

  private encryptData(data: string): string {
    // Simple encryption - in a real implementation, use proper encryption
    return btoa(data)
  }

  private decryptData(data: string): string {
    // Simple decryption - in a real implementation, use proper encryption
    try {
      return atob(data)
    } catch {
      return data
    }
  }

  private getNextSequence(): number {
    return ++this.sequenceNumber
  }

  public setLocalPlayer(player: NetworkPlayer): void {
    this.localPlayer = player
    this.players.set(player.id, player)
  }

  public getPlayer(playerId: string): NetworkPlayer | undefined {
    return this.players.get(playerId)
  }

  public getAllPlayers(): NetworkPlayer[] {
    return Array.from(this.players.values())
  }

  public getLocalPlayer(): NetworkPlayer | null {
    return this.localPlayer
  }

  public getMetrics(): NetworkMetrics {
    return { ...this.metrics }
  }

  public getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'terrible' {
    const ping = this.metrics.ping
    const jitter = this.metrics.jitter
    const packetLoss = this.metrics.packetLoss

    if (ping < 50 && jitter < 10 && packetLoss < 1) return 'excellent'
    if (ping < 100 && jitter < 20 && packetLoss < 2) return 'good'
    if (ping < 150 && jitter < 30 && packetLoss < 5) return 'fair'
    if (ping < 250 && jitter < 50 && packetLoss < 10) return 'poor'
    return 'terrible'
  }

  public isConnected(): boolean {
    return this.connected
  }

  public getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (!this.ws) return 'disconnected'

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'disconnected'
      case WebSocket.CLOSED: return this.reconnectAttempts > 0 ? 'reconnecting' : 'disconnected'
      default: return 'disconnected'
    }
  }

  public on(event: string, callback: Function): void {
    switch (event) {
      case 'connect':
        this.connectionCallbacks.onConnect = callback as () => void
        break
      case 'disconnect':
        this.connectionCallbacks.onDisconnect = callback as () => void
        break
      case 'playerJoin':
        this.connectionCallbacks.onPlayerJoin = callback as (player: NetworkPlayer) => void
        break
      case 'playerLeave':
        this.connectionCallbacks.onPlayerLeave = callback as (playerId: string) => void
        break
      case 'gameState':
        this.connectionCallbacks.onGameState = callback as (state: GameStateSnapshot) => void
        break
      case 'event':
        this.connectionCallbacks.onEvent = callback as (event: any) => void
        break
      case 'error':
        this.connectionCallbacks.onError = callback as (error: any) => void
        break
    }
  }

  public sendEvent(event: any): void {
    if (!this.connected) return

    const packet: NetworkPacket = {
      type: 'event',
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      data: event,
      priority: 'normal',
      reliable: event.reliable || false,
      compressed: this.config.compressionEnabled,
      encrypted: this.config.encryptionEnabled
    }

    this.sendPacket(packet)
  }

  public sendChatMessage(message: string): void {
    this.sendEvent({
      type: 'chat',
      message,
      timestamp: Date.now()
    })
  }

  public enableLagCompensation(enabled: boolean): void {
    this.config.lagCompensationEnabled = enabled
  }

  public enableClientSidePrediction(enabled: boolean): void {
    this.config.clientSidePrediction = enabled
  }

  public enableServerReconciliation(enabled: boolean): void {
    this.config.serverReconciliation = enabled
  }

  public setInterpolationDelay(delayMs: number): void {
    this.config.interpolationDelay = Math.max(0, Math.min(500, delayMs))
  }

  public setTickRate(tickRate: number): void {
    this.config.tickRate = Math.max(20, Math.min(120, tickRate))
  }

  public dispose(): void {
    this.disconnect()
    this.players.clear()
    this.inputQueue.length = 0
    this.unacknowledgedInputs.clear()
    this.stateBuffer.length = 0
    this.interpolationBuffer.clear()
    this.eventQueue.length = 0
    this.packetBuffer.clear()
    this.reliablePackets.clear()
  }
}

export default GLXYNetcodeImprovements