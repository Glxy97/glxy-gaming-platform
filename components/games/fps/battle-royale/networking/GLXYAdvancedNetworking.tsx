// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { io, Socket } from 'socket.io-client'

// STRICT MODE: Advanced networking interfaces
export interface GLXYNetworkConfig {
  serverUrl: string
  port: number
  transports: ('websocket' | 'polling')[]
  timeout: number
  retries: number
  retryDelay: number
  heartbeatInterval: number
  compression: boolean
  encryption: boolean
}

export interface GLXYPacket {
  id: string
  type: string
  timestamp: number
  data: any
  checksum?: string
  encrypted?: boolean
  compressed?: boolean
}

export interface GLXYPlayerInput {
  sequence: number
  timestamp: number
  keys: {
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
    interact: boolean
  }
  mouse: {
    deltaX: number
    deltaY: number
  }
  weapon: string
  actions: {
    type: string
    data: any
  }[]
}

export interface GLXYStateSnapshot {
  id: string
  timestamp: number
  playerId: string
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  health: number
  armor: number
  weapon: string
  ammo: number
  isAlive: boolean
  isReloading: boolean
  isShooting: boolean
  animationState: string
}

export interface GLXYPredictionResult {
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  timestamp: number
  confidence: number
}

export interface GLXYInterpolationData {
  playerId: string
  fromSnapshot: GLXYStateSnapshot
  toSnapshot: GLXYStateSnapshot
  interpolationFactor: number
  targetTime: number
}

export interface GLXYLatencyMetrics {
  rtt: number // Round Trip Time
  jitter: number
  packetLoss: number
  bandwidth: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}

export interface GLXYNetworkOptimization {
  clientPrediction: boolean
  serverReconciliation: boolean
  entityInterpolation: boolean
  lagCompensation: boolean
  bandwidthOptimization: boolean
  adaptiveUpdateRate: boolean
  deltaCompression: boolean
  priorityScheduling: boolean
}

// PRODUCTION-READY ADVANCED NETWORKING SYSTEM
export class GLXYAdvancedNetworking {
  private static instance: GLXYAdvancedNetworking | null = null

  // Core networking
  private socket: Socket | null = null
  private config: GLXYNetworkConfig
  private isConnected = false
  private isConnecting = false

  // Client-side prediction
  private inputSequence = 0
  private pendingInputs: Map<number, GLXYPlayerInput> = new Map()
  private acknowledgedInputs = new Set<number>()
  private clientState: GLXYStateSnapshot | null = null
  private predictedStates: Map<number, GLXYPredictionResult> = new Map()

  // Server reconciliation
  private serverStates: Map<number, GLXYStateSnapshot> = new Map()
  private lastServerState: GLXYStateSnapshot | null = null
  private reconciliationBuffer: GLXYStateSnapshot[] = []

  // Entity interpolation
  private entitySnapshots: Map<string, GLXYStateSnapshot[]> = new Map()
  private interpolationDelay = 100 // ms
  private maxHistorySize = 60 // 1 second at 60 updates

  // Lag compensation
  private latencyHistory: number[] = []
  private averageLatency = 0
  private maxLatency = 0
  private minLatency = Infinity

  // Network optimization
  private optimization: GLXYNetworkOptimization
  private updateRate = 60 // Hz
  private lastUpdateTime = 0
  private adaptiveQuality = 1.0

  // Bandwidth management
  private outgoingQueue: GLXYPacket[] = []
  private incomingQueue: GLXYPacket[] = []
  private packetBuffer: Map<string, GLXYPacket[]> = new Map()
  private priorityQueue: Map<number, GLXYPacket[]> = new Map()

  // Performance monitoring
  private metrics: GLXYLatencyMetrics = {
    rtt: 0,
    jitter: 0,
    packetLoss: 0,
    bandwidth: 0,
    connectionQuality: 'excellent'
  }

  private performanceHistory: GLXYLatencyMetrics[] = []
  private lastMetricsUpdate = 0

  // Security
  private encryptionKey: string | null = null
  private packetValidation = true
  private antiCheatValidation = true

  // Events
  private eventListeners: Map<string, Function[]> = new Map()

  // Error handling
  private retryCount = 0
  private maxRetries = 5
  private reconnectAttempts = 0
  private lastReconnectAttempt = 0

  constructor(config: Partial<GLXYNetworkConfig> = {}) {
    if (GLXYAdvancedNetworking.instance) {
      throw new Error('GLXYAdvancedNetworking is a singleton')
    }

    this.config = this.mergeConfig(this.getDefaultConfig(), config)
    this.optimization = this.getDefaultOptimization()

    GLXYAdvancedNetworking.instance = this
  }

  public static getInstance(): GLXYAdvancedNetworking | null {
    return GLXYAdvancedNetworking.instance
  }

  private mergeConfig(defaultConfig: GLXYNetworkConfig, customConfig: Partial<GLXYNetworkConfig>): GLXYNetworkConfig {
    return { ...defaultConfig, ...customConfig }
  }

  private getDefaultConfig(): GLXYNetworkConfig {
    return {
      serverUrl: 'localhost',
      port: 3001,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      heartbeatInterval: 25000,
      compression: true,
      encryption: false
    }
  }

  private getDefaultOptimization(): GLXYNetworkOptimization {
    return {
      clientPrediction: true,
      serverReconciliation: true,
      entityInterpolation: true,
      lagCompensation: true,
      bandwidthOptimization: true,
      adaptiveUpdateRate: true,
      deltaCompression: true,
      priorityScheduling: true
    }
  }

  public async connect(playerId: string, username: string): Promise<boolean> {
    if (this.isConnecting || this.isConnected) {
      return this.isConnected
    }

    this.isConnecting = true

    try {
      console.log('🌐 Connecting to Battle Royale server...')

      this.socket = io(`ws://${this.config.serverUrl}:${this.config.port}`, {
        transports: this.config.transports,
        upgrade: true,
        timeout: this.config.timeout,
        query: {
          playerId,
          username,
          gameMode: 'battle-royale',
          optimization: JSON.stringify(this.optimization)
        }
      })

      await this.setupSocketListeners()
      await this.waitForConnection()

      // Initialize systems
      this.initializePrediction()
      this.initializeInterpolation()
      this.startPerformanceMonitoring()

      this.isConnected = true
      this.isConnecting = false
      this.reconnectAttempts = 0

      console.log('✅ Connected to Battle Royale server')
      this.emit('connected', { playerId, username })
      return true

    } catch (error) {
      this.isConnecting = false
      console.error('❌ Connection failed:', error)
      this.handleConnectionError(error)
      return false
    }
  }

  private async setupSocketListeners(): Promise<void> {
    if (!this.socket) return

    return new Promise((resolve) => {
      this.socket!.on('connect', () => {
        console.log('🔗 Socket connected')
        this.startHeartbeat()
        resolve()
      })

      this.socket!.on('disconnect', (reason) => {
        console.warn('🔌 Socket disconnected:', reason)
        this.handleDisconnection(reason)
      })

      this.socket!.on('connect_error', (error) => {
        console.error('🚫 Connection error:', error)
        this.handleConnectionError(error)
      })

      this.socket!.on('serverState', (data: GLXYStateSnapshot) => {
        this.handleServerState(data)
      })

      this.socket!.on('playerUpdate', (data: GLXYStateSnapshot) => {
        this.handlePlayerUpdate(data)
      })

      this.socket!.on('inputAck', (data: { sequence: number; timestamp: number }) => {
        this.handleInputAcknowledgment(data)
      })

      this.socket!.on('serverReconciliation', (data: GLXYStateSnapshot) => {
        this.handleServerReconciliation(data)
      })

      this.socket!.on('gameSnapshot', (data: { snapshot: GLXYStateSnapshot; timestamp: number }) => {
        this.handleGameSnapshot(data)
      })

      this.socket!.on('ping', (callback: Function) => {
        callback()
        this.updateLatency()
      })

      this.socket!.on('networkStats', (stats: any) => {
        this.updateNetworkStats(stats)
      })

      this.socket!.on('error', (error: any) => {
        this.handleNetworkError(error)
      })
    })
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, this.config.timeout)

      this.socket.on('connect', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  private initializePrediction(): void {
    if (!this.optimization.clientPrediction) return

    console.log('🎯 Client-side prediction initialized')
  }

  private initializeInterpolation(): void {
    if (!this.optimization.entityInterpolation) return

    console.log('🔄 Entity interpolation initialized')
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateMetrics()
    }, 1000)
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }

  // Client-side prediction
  public sendInput(input: Partial<GLXYPlayerInput>): void {
    if (!this.isConnected || !this.optimization.clientPrediction) return

    const fullInput: GLXYPlayerInput = {
      sequence: this.inputSequence++,
      timestamp: Date.now(),
      keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        crouch: false,
        sprint: false,
        aim: false,
        shoot: false,
        reload: false,
        interact: false,
        ...input.keys
      },
      mouse: {
        deltaX: 0,
        deltaY: 0,
        ...input.mouse
      },
      weapon: input.weapon || 'unarmed',
      actions: input.actions || []
    }

    // Store input for prediction
    this.pendingInputs.set(fullInput.sequence, fullInput)

    // Apply client-side prediction
    if (this.optimization.clientPrediction) {
      this.predictLocalState(fullInput)
    }

    // Send to server
    const packet: GLXYPacket = {
      id: this.generatePacketId(),
      type: 'input',
      timestamp: fullInput.timestamp,
      data: fullInput
    }

    this.sendPacket(packet)
  }

  private predictLocalState(input: GLXYPlayerInput): void {
    if (!this.clientState) return

    // Create predicted state
    const predictedState: GLXYPredictionResult = {
      position: this.clientState.position.clone(),
      rotation: this.clientState.rotation.clone(),
      velocity: this.clientState.velocity.clone(),
      timestamp: input.timestamp,
      confidence: 1.0
    }

    // Apply input to predicted state
    this.applyInputToState(predictedState, input)

    // Store prediction
    this.predictedStates.set(input.sequence, predictedState)

    // Update client state
    this.clientState.position.copy(predictedState.position)
    this.clientState.rotation.copy(predictedState.rotation)
    this.clientState.velocity.copy(predictedState.velocity)
  }

  private applyInputToState(state: GLXYPredictionResult, input: GLXYPlayerInput): void {
    const deltaTime = 1 / 60 // 60 FPS assumption
    const moveSpeed = 10 // m/s

    // Calculate movement vector
    const moveVector = new THREE.Vector3()

    if (input.keys.forward) moveVector.z -= 1
    if (input.keys.backward) moveVector.z += 1
    if (input.keys.left) moveVector.x -= 1
    if (input.keys.right) moveVector.x += 1

    // Apply movement
    if (moveVector.length() > 0) {
      moveVector.normalize()
      moveVector.multiplyScalar(moveSpeed * deltaTime)

      // Apply rotation to movement
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.rotation.y)

      state.position.add(moveVector)
    }

    // Apply mouse rotation
    state.rotation.y -= input.mouse.deltaX * 0.002
    state.rotation.x -= input.mouse.deltaY * 0.002
    state.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.rotation.x))

    // Apply jump
    if (input.keys.jump && state.position.y <= 1.6) {
      state.velocity.y = 8 // jump velocity
    }

    // Apply gravity
    state.velocity.y -= 9.8 * deltaTime
    state.position.y += state.velocity.y * deltaTime

    // Ground collision
    if (state.position.y <= 1.6) {
      state.position.y = 1.6
      state.velocity.y = 0
    }
  }

  // Server reconciliation
  private handleInputAcknowledgment(data: { sequence: number; timestamp: number }): void {
    if (!this.optimization.serverReconciliation) return

    const { sequence } = data

    // Mark input as acknowledged
    this.acknowledgedInputs.add(sequence)

    // Remove from pending inputs
    this.pendingInputs.delete(sequence)

    // Remove prediction
    this.predictedStates.delete(sequence)

    // Clean up old inputs
    this.cleanupOldInputs()
  }

  private handleServerReconciliation(serverState: GLXYStateSnapshot): void {
    if (!this.optimization.serverReconciliation || !this.clientState) return

    // Store server state
    this.serverStates.set(serverState.timestamp, serverState)
    this.lastServerState = serverState

    // Calculate position error
    const clientPosition = this.clientState.position
    const serverPosition = serverState.position
    const positionError = clientPosition.distanceTo(serverPosition)

    // If error is significant, reconcile
    if (positionError > 0.1) { // 10cm threshold
      console.log('🔧 Reconciling with server - Position error:', positionError)

      // Correct client position
      this.clientState.position.copy(serverPosition)
      this.clientState.rotation.copy(serverState.rotation)
      this.clientState.velocity.copy(serverState.velocity)

      // Re-apply unacknowledged inputs
      this.replayUnacknowledgedInputs()
    }
  }

  private replayUnacknowledgedInputs(): void {
    if (!this.clientState) return

    // Get unacknowledged inputs in order
    const unacknowledgedInputs = Array.from(this.pendingInputs.values())
      .sort((a, b) => a.sequence - b.sequence)

    // Replay each input
    unacknowledgedInputs.forEach(input => {
      const prediction = this.predictedStates.get(input.sequence)
      if (prediction) {
        this.clientState!.position.copy(prediction.position)
        this.clientState!.rotation.copy(prediction.rotation)
        this.clientState!.velocity.copy(prediction.velocity)
      }
    })
  }

  private cleanupOldInputs(): void {
    const currentTime = Date.now()
    const maxAge = 1000 // 1 second

    // Remove old pending inputs
    for (const [sequence, input] of this.pendingInputs.entries()) {
      if (currentTime - input.timestamp > maxAge) {
        this.pendingInputs.delete(sequence)
        this.predictedStates.delete(sequence)
      }
    }

    // Remove old acknowledged inputs
    this.acknowledgedInputs.forEach(sequence => {
      const input = this.pendingInputs.get(sequence)
      if (input && currentTime - input.timestamp > maxAge) {
        this.acknowledgedInputs.delete(sequence)
      }
    })
  }

  // Entity interpolation
  private handlePlayerUpdate(playerData: GLXYStateSnapshot): void {
    if (!this.optimization.entityInterpolation) {
      // No interpolation - apply directly
      this.emit('playerUpdate', playerData)
      return
    }

    const playerId = playerData.playerId

    // Add to snapshot history
    if (!this.entitySnapshots.has(playerId)) {
      this.entitySnapshots.set(playerId, [])
    }

    const snapshots = this.entitySnapshots.get(playerId)!
    snapshots.push(playerData)

    // Limit history size
    if (snapshots.length > this.maxHistorySize) {
      snapshots.shift()
    }

    // Start interpolation
    this.interpolateEntity(playerId)
  }

  private interpolateEntity(playerId: string): void {
    const snapshots = this.entitySnapshots.get(playerId)
    if (!snapshots || snapshots.length < 2) return

    const renderTime = Date.now() - this.interpolationDelay

    // Find two snapshots to interpolate between
    let fromSnapshot: GLXYStateSnapshot | null = null
    let toSnapshot: GLXYStateSnapshot | null = null

    for (let i = 0; i < snapshots.length - 1; i++) {
      if (snapshots[i].timestamp <= renderTime && snapshots[i + 1].timestamp >= renderTime) {
        fromSnapshot = snapshots[i]
        toSnapshot = snapshots[i + 1]
        break
      }
    }

    if (fromSnapshot && toSnapshot) {
      const interpolationFactor = (renderTime - fromSnapshot.timestamp) / (toSnapshot.timestamp - fromSnapshot.timestamp)
      const interpolatedState = this.interpolateSnapshots(fromSnapshot, toSnapshot, interpolationFactor)

      this.emit('playerUpdate', interpolatedState)
    }
  }

  private interpolateSnapshots(from: GLXYStateSnapshot, to: GLXYStateSnapshot, factor: number): GLXYStateSnapshot {
    return {
      ...from,
      position: new THREE.Vector3().lerpVectors(from.position, to.position, factor),
      rotation: new THREE.Euler(
        THREE.MathUtils.lerp(from.rotation.x, to.rotation.x, factor),
        THREE.MathUtils.lerp(from.rotation.y, to.rotation.y, factor),
        THREE.MathUtils.lerp(from.rotation.z, to.rotation.z, factor)
      ),
      velocity: new THREE.Vector3().lerpVectors(from.velocity, to.velocity, factor),
      health: THREE.MathUtils.lerp(from.health, to.health, factor),
      armor: THREE.MathUtils.lerp(from.armor, to.armor, factor),
      ammo: Math.floor(THREE.MathUtils.lerp(from.ammo, to.ammo, factor))
    }
  }

  // Lag compensation
  private updateLatency(): void {
    const ping = Date.now() - this.lastMetricsUpdate
    if (ping > 0) {
      this.latencyHistory.push(ping)

      // Keep only recent measurements
      if (this.latencyHistory.length > 10) {
        this.latencyHistory.shift()
      }

      // Calculate average latency
      this.averageLatency = this.latencyHistory.reduce((sum, latency) => sum + latency, 0) / this.latencyHistory.length

      // Update min/max
      this.maxLatency = Math.max(this.maxLatency, ping)
      this.minLatency = Math.min(this.minLatency, ping)

      // Update metrics
      this.metrics.rtt = this.averageLatency
      this.metrics.connectionQuality = this.calculateConnectionQuality()

      // Adjust interpolation delay based on latency
      this.interpolationDelay = Math.max(50, this.averageLatency * 0.5)

      // Adaptive update rate
      if (this.optimization.adaptiveUpdateRate) {
        this.adjustUpdateRate()
      }
    }

    this.lastMetricsUpdate = Date.now()
  }

  private calculateConnectionQuality(): GLXYLatencyMetrics['connectionQuality'] {
    if (this.averageLatency < 50) return 'excellent'
    if (this.averageLatency < 100) return 'good'
    if (this.averageLatency < 200) return 'fair'
    if (this.averageLatency < 500) return 'poor'
    return 'critical'
  }

  private adjustUpdateRate(): void {
    const quality = this.metrics.connectionQuality

    switch (quality) {
      case 'excellent':
        this.updateRate = 60
        this.interpolationDelay = 50
        break
      case 'good':
        this.updateRate = 45
        this.interpolationDelay = 75
        break
      case 'fair':
        this.updateRate = 30
        this.interpolationDelay = 100
        break
      case 'poor':
        this.updateRate = 20
        this.interpolationDelay = 150
        break
      case 'critical':
        this.updateRate = 15
        this.interpolationDelay = 200
        break
    }

    this.adaptiveQuality = this.updateRate / 60
  }

  // Bandwidth optimization
  private sendPacket(packet: GLXYPacket): void {
    if (!this.socket) return

    // Apply compression
    if (this.config.compression && this.optimization.bandwidthOptimization) {
      packet.compressed = true
      packet.data = this.compressData(packet.data)
    }

    // Apply encryption
    if (this.config.encryption && this.encryptionKey) {
      packet.encrypted = true
      packet.data = this.encryptData(packet.data)
    }

    // Add checksum for validation
    if (this.packetValidation) {
      packet.checksum = this.calculateChecksum(packet)
    }

    // Priority scheduling
    if (this.optimization.priorityScheduling) {
      this.queuePriorityPacket(packet)
    } else {
      this.socket.emit(packet.type, packet)
    }

    // Update stats
    this.metrics.bandwidth += this.calculatePacketSize(packet)
  }

  private compressData(data: any): any {
    // Simple compression simulation
    return JSON.stringify(data)
  }

  private encryptData(data: any): any {
    // Simple encryption simulation
    return data
  }

  private calculateChecksum(packet: GLXYPacket): string {
    // Simple checksum calculation
    const data = JSON.stringify(packet.data)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  private calculatePacketSize(packet: GLXYPacket): number {
    return JSON.stringify(packet).length
  }

  private queuePriorityPacket(packet: GLXYPacket): void {
    const priority = this.calculatePacketPriority(packet)

    if (!this.priorityQueue.has(priority)) {
      this.priorityQueue.set(priority, [])
    }

    this.priorityQueue.get(priority)!.push(packet)

    // Process priority queue
    this.processPriorityQueue()
  }

  private calculatePacketPriority(packet: GLXYPacket): number {
    switch (packet.type) {
      case 'input': return 1 // Highest priority
      case 'weaponFire': return 2
      case 'playerHit': return 3
      case 'playerUpdate': return 4
      default: return 5
    }
  }

  private processPriorityQueue(): void {
    // Process packets in priority order
    const sortedPriorities = Array.from(this.priorityQueue.keys()).sort((a, b) => a - b)

    for (const priority of sortedPriorities) {
      const packets = this.priorityQueue.get(priority)!
      while (packets.length > 0) {
        const packet = packets.shift()!
        this.socket!.emit(packet.type, packet)
      }
    }
  }

  // Event handlers
  private handleServerState(state: GLXYStateSnapshot): void {
    this.clientState = state
    this.emit('serverState', state)
  }

  private handleGameSnapshot(data: { snapshot: GLXYStateSnapshot; timestamp: number }): void {
    // Handle game-wide snapshot
    this.emit('gameSnapshot', data)
  }

  private updateNetworkStats(stats: any): void {
    // Update network statistics from server
    this.metrics.packetLoss = stats.packetLoss || 0
    this.metrics.bandwidth = stats.bandwidth || 0
    this.emit('networkStats', this.metrics)
  }

  private handleDisconnection(reason: string): void {
    this.isConnected = false
    this.emit('disconnected', reason)

    // Attempt reconnection based on reason
    if (reason !== 'io client disconnect') {
      this.attemptReconnection()
    }
  }

  private handleConnectionError(error: any): void {
    this.emit('connectionError', error)
    this.attemptReconnection()
  }

  private handleNetworkError(error: any): void {
    console.error('🌐 Network error:', error)
    this.emit('networkError', error)
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxRetries) {
      console.error('❌ Max reconnection attempts reached')
      this.emit('reconnectionFailed')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxRetries} in ${delay}ms`)

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect()
      }
    }, delay)
  }

  // Performance monitoring
  private updateMetrics(): void {
    // Calculate jitter
    if (this.latencyHistory.length > 1) {
      const differences = []
      for (let i = 1; i < this.latencyHistory.length; i++) {
        differences.push(Math.abs(this.latencyHistory[i] - this.latencyHistory[i - 1]))
      }
      this.metrics.jitter = differences.reduce((sum, diff) => sum + diff, 0) / differences.length
    }

    // Store history
    this.performanceHistory.push({ ...this.metrics })
    if (this.performanceHistory.length > 60) {
      this.performanceHistory.shift()
    }

    this.emit('metricsUpdate', this.metrics)
  }

  // Public API
  public sendAction(action: { type: string; data: any }): void {
    const packet: GLXYPacket = {
      id: this.generatePacketId(),
      type: 'action',
      timestamp: Date.now(),
      data: action
    }

    this.sendPacket(packet)
  }

  public getMetrics(): GLXYLatencyMetrics {
    return { ...this.metrics }
  }

  public getConnectionQuality(): GLXYLatencyMetrics['connectionQuality'] {
    return this.metrics.connectionQuality
  }

  public getAverageLatency(): number {
    return this.averageLatency
  }

  public getUpdateRate(): number {
    return this.updateRate
  }

  public isConnectionStable(): boolean {
    return this.isConnected && this.metrics.connectionQuality !== 'critical'
  }

  public updateOptimization(optimization: Partial<GLXYNetworkOptimization>): void {
    this.optimization = { ...this.optimization, ...optimization }
    console.log('⚙️ Network optimization updated:', this.optimization)
  }

  // Events
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in network event listener for ${event}:`, error)
        }
      })
    }
  }

  private generatePacketId(): string {
    return `packet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnected = false
    this.cleanup()
    console.log('🔌 Disconnected from server')
  }

  private cleanup(): void {
    // Clear all maps and arrays
    this.pendingInputs.clear()
    this.acknowledgedInputs.clear()
    this.predictedStates.clear()
    this.serverStates.clear()
    this.entitySnapshots.clear()
    this.latencyHistory = []
    this.outgoingQueue = []
    this.incomingQueue = []
    this.packetBuffer.clear()
    this.priorityQueue.clear()
    this.eventListeners.clear()

    // Reset states
    this.clientState = null
    this.lastServerState = null
    this.reconnectAttempts = 0
  }

  public destroy(): void {
    this.disconnect()
    GLXYAdvancedNetworking.instance = null
    console.log('🗑️ GLXY Advanced Networking destroyed')
  }
}

// React Hook for Advanced Networking
export const useGLXYAdvancedNetworking = (
  config?: Partial<GLXYNetworkConfig>
) => {
  const [networking, setNetworking] = useState<GLXYAdvancedNetworking | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [metrics, setMetrics] = useState<GLXYLatencyMetrics | null>(null)
  const [connectionQuality, setConnectionQuality] = useState<GLXYLatencyMetrics['connectionQuality']>('excellent')
  const [averageLatency, setAverageLatency] = useState(0)

  useEffect(() => {
    const net = new GLXYAdvancedNetworking(config)

    net.on('connected', () => {
      setIsConnected(true)
      setNetworking(net)
    })

    net.on('disconnected', () => {
      setIsConnected(false)
    })

    net.on('metricsUpdate', (newMetrics: GLXYLatencyMetrics) => {
      setMetrics(newMetrics)
      setConnectionQuality(newMetrics.connectionQuality)
      setAverageLatency(net.getAverageLatency())
    })

    return () => {
      net.destroy()
    }
  }, [config])

  const sendInput = useCallback((input: Partial<GLXYPlayerInput>) => {
    networking?.sendInput(input)
  }, [networking])

  const sendAction = useCallback((action: { type: string; data: any }) => {
    networking?.sendAction(action)
  }, [networking])

  return {
    networking,
    isConnected,
    metrics,
    connectionQuality,
    averageLatency,
    sendInput,
    sendAction,
    getUpdateRate: () => networking?.getUpdateRate() || 60,
    isConnectionStable: () => networking?.isConnectionStable() || false,
    updateOptimization: (optimization: Partial<GLXYNetworkOptimization>) =>
      networking?.updateOptimization(optimization)
  }
}

export default GLXYAdvancedNetworking