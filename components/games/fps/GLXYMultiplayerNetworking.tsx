// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { io, Socket } from 'socket.io-client'

// Particle interface for death effect
interface ParticleMesh extends THREE.Mesh {
  velocity: THREE.Vector3
}

// Interfaces for multiplayer networking
export interface NetworkPlayer {
  id: string
  username: string
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  health: number
  armor: number
  score: number
  kills: number
  deaths: number
  team: 'red' | 'blue' | 'spectator'
  weapon: string
  isAlive: boolean
  isShooting: boolean
  isReloading: boolean
  ammo: {
    current: number
    reserve: number
  }
  animations: {
    state: 'idle' | 'running' | 'jumping' | 'shooting' | 'reloading' | 'dead'
    time: number
  }
  ping: number
  lastUpdate: number
  model?: THREE.Group
  boundingBox?: THREE.Box3
}

export interface NetworkProjectile {
  id: string
  ownerId: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  damage: number
  weaponType: string
  lifetime: number
  trail?: THREE.Line
}

export interface NetworkEvent {
  id: string
  type: 'player_hit' | 'player_killed' | 'weapon_fired' | 'grenade_thrown' | 'objective_captured' | 'game_state_change'
  data: any
  timestamp: number
  position?: THREE.Vector3
}

export interface GameState {
  mode: 'deathmatch' | 'team deathmatch' | 'capture the flag' | 'search and destroy' | 'battle royale'
  timeRemaining: number
  round: number
  score: {
    red: number
    blue: number
  }
  objectives: any[]
  status: 'waiting' | 'in-progress' | 'finished' | 'intermission'
  winner?: 'red' | 'blue' | 'draw'
}

export interface LatencyOptimizer {
  enabled: boolean
  interpolationDelay: number
  extrapolationEnabled: boolean
  clientPrediction: boolean
  serverReconciliation: boolean
  bufferSize: number
  compressionEnabled: boolean
}

// Main Multiplayer Networking Class
export class GLXYMultiplayerNetworking {
  private socket: Socket | null = null
  private localPlayer: NetworkPlayer | null = null
  private remotePlayers: Map<string, NetworkPlayer> = new Map()
  private projectiles: Map<string, NetworkProjectile> = new Map()
  private events: NetworkEvent[] = []
  private gameState: GameState | null = null

  // Network optimization
  private latencyOptimizer: LatencyOptimizer = {
    enabled: true,
    interpolationDelay: 100, // ms
    extrapolationEnabled: true,
    clientPrediction: true,
    serverReconciliation: true,
    bufferSize: 60,
    compressionEnabled: true
  }

  // State buffers for interpolation
  private playerStateBuffer: Map<string, NetworkPlayer[]> = new Map()
  private projectileBuffer: Map<string, NetworkProjectile[]> = new Map()
  private inputSequence: number = 0
  private acknowledgedInputs: number = 0

  // Performance monitoring
  private networkStats = {
    packetsSent: 0,
    packetsReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    averagePing: 0,
    packetLoss: 0,
    jitter: 0
  }

  private lastPingTime: number = 0
  private pingHistory: number[] = []

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private onPlayerJoined?: (player: NetworkPlayer) => void,
    private onPlayerLeft?: (playerId: string) => void,
    private onGameStateChanged?: (state: GameState) => void
  ) {}

  public async connect(serverUrl: string, playerId: string, username: string): Promise<boolean> {
    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        query: {
          playerId,
          username
        }
      })

      this.setupSocketListeners()
      await this.waitForConnection()

      console.log('Connected to multiplayer server')
      return true
    } catch (error) {
      console.error('Failed to connect to multiplayer server:', error)
      return false
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.remotePlayers.clear()
    this.projectiles.clear()
    this.events = []
  }

  public sendPlayerUpdate(position: THREE.Vector3, rotation: THREE.Euler, velocity: THREE.Vector3, inputs: any): void {
    if (!this.socket || !this.localPlayer) return

    const updateData = {
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      rotation: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z
      },
      velocity: {
        x: velocity.x,
        y: velocity.y,
        z: velocity.z
      },
      inputs,
      sequence: this.inputSequence++,
      timestamp: Date.now()
    }

    // Client-side prediction
    if (this.latencyOptimizer.clientPrediction) {
      this.predictLocalPlayerState(updateData)
    }

    this.socket.emit('playerUpdate', updateData)
    this.networkStats.packetsSent++
  }

  public shootWeapon(direction: THREE.Vector3, weaponType: string): void {
    if (!this.socket || !this.localPlayer) return

    const shootData = {
      position: this.localPlayer.position,
      direction: {
        x: direction.x,
        y: direction.y,
        z: direction.z
      },
      weaponType,
      timestamp: Date.now()
    }

    this.socket.emit('weaponFire', shootData)
  }

  public throwGrenade(position: THREE.Vector3, velocity: THREE.Vector3, grenadeType: string): void {
    if (!this.socket || !this.localPlayer) return

    const grenadeData = {
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      velocity: {
        x: velocity.x,
        y: velocity.y,
        z: velocity.z
      },
      grenadeType,
      timestamp: Date.now()
    }

    this.socket.emit('grenadeThrow', grenadeData)
  }

  public hitPlayer(targetId: string, damage: number, hitLocation: string, weaponType: string): void {
    if (!this.socket) return

    const hitData = {
      targetId,
      damage,
      hitLocation,
      weaponType,
      timestamp: Date.now()
    }

    this.socket.emit('playerHit', hitData)
  }

  public update(deltaTime: number): void {
    // Update remote players with interpolation
    this.updateRemotePlayers(deltaTime)

    // Update projectiles
    this.updateProjectiles(deltaTime)

    // Process network events
    this.processEvents()

    // Clean up old data
    this.cleanupOldData()

    // Update network stats
    this.updateNetworkStats()
  }

  private setupSocketListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.startPingMeasurement()
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('initialState', (data: any) => {
      this.handleInitialState(data)
    })

    this.socket.on('playerJoined', (playerData: any) => {
      this.handlePlayerJoined(playerData)
    })

    this.socket.on('playerLeft', (playerId: string) => {
      this.handlePlayerLeft(playerId)
    })

    this.socket.on('playerUpdate', (updateData: any) => {
      this.handlePlayerUpdate(updateData)
    })

    this.socket.on('weaponFire', (fireData: any) => {
      this.handleWeaponFire(fireData)
    })

    this.socket.on('grenadeThrow', (grenadeData: any) => {
      this.handleGrenadeThrow(grenadeData)
    })

    this.socket.on('playerHit', (hitData: any) => {
      this.handlePlayerHit(hitData)
    })

    this.socket.on('playerKilled', (killData: any) => {
      this.handlePlayerKilled(killData)
    })

    this.socket.on('gameStateUpdate', (gameState: GameState) => {
      this.handleGameStateUpdate(gameState)
    })

    this.socket.on('serverReconciliation', (ackData: any) => {
      this.handleServerReconciliation(ackData)
    })

    this.socket.on('ping', (callback: Function) => {
      callback()
      this.updatePing()
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
      }, 10000)

      this.socket.on('connect', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  private handleInitialState(data: any): void {
    this.localPlayer = data.localPlayer
    this.gameState = data.gameState

    // Initialize remote players
    data.remotePlayers.forEach((player: any) => {
      const networkPlayer = this.createNetworkPlayer(player)
      this.remotePlayers.set(player.id, networkPlayer)
      if (this.onPlayerJoined) {
        this.onPlayerJoined(networkPlayer)
      }
    })
  }

  private handlePlayerJoined(playerData: any): void {
    const networkPlayer = this.createNetworkPlayer(playerData)
    this.remotePlayers.set(playerData.id, networkPlayer)

    if (this.onPlayerJoined) {
      this.onPlayerJoined(networkPlayer)
    }
  }

  private handlePlayerLeft(playerId: string): void {
    const player = this.remotePlayers.get(playerId)
    if (player && player.model) {
      this.scene.remove(player.model)
    }

    this.remotePlayers.delete(playerId)
    this.playerStateBuffer.delete(playerId)

    if (this.onPlayerLeft) {
      this.onPlayerLeft(playerId)
    }
  }

  private handlePlayerUpdate(updateData: any): void {
    const { playerId, ...updates } = updateData

    if (playerId === this.localPlayer?.id) {
      // Handle server reconciliation for local player
      if (this.latencyOptimizer.serverReconciliation) {
        this.reconcileWithServer(updates)
      }
      return
    }

    // Add to state buffer for interpolation
    if (!this.playerStateBuffer.has(playerId)) {
      this.playerStateBuffer.set(playerId, [])
    }

    const buffer = this.playerStateBuffer.get(playerId)!
    buffer.push({
      ...this.remotePlayers.get(playerId),
      ...updates,
      lastUpdate: Date.now()
    } as NetworkPlayer)

    // Keep buffer size limited
    if (buffer.length > this.latencyOptimizer.bufferSize) {
      buffer.shift()
    }
  }

  private handleWeaponFire(fireData: any): void {
    // Create visual effects for weapon fire
    this.createMuzzleFlash(fireData.position, fireData.direction)

    // Add to events
    this.events.push({
      id: `weapon_fire_${Date.now()}`,
      type: 'weapon_fired',
      data: fireData,
      timestamp: Date.now(),
      position: new THREE.Vector3(fireData.position.x, fireData.position.y, fireData.position.z)
    })
  }

  private handleGrenadeThrow(grenadeData: any): void {
    // Create grenade projectile
    const projectile: NetworkProjectile = {
      id: `grenade_${Date.now()}_${Math.random()}`,
      ownerId: grenadeData.playerId,
      position: new THREE.Vector3(grenadeData.position.x, grenadeData.position.y, grenadeData.position.z),
      velocity: new THREE.Vector3(grenadeData.velocity.x, grenadeData.velocity.y, grenadeData.velocity.z),
      damage: grenadeData.damage || 0,
      weaponType: grenadeData.grenadeType,
      lifetime: 5000, // 5 seconds
      trail: this.createProjectileTrail()
    }

    this.projectiles.set(projectile.id, projectile)
    this.scene.add(projectile.trail!)
  }

  private handlePlayerHit(hitData: any): void {
    // Create hit effects
    this.createHitEffect(hitData.position, hitData.damage)

    // Update player health
    const targetPlayer = this.remotePlayers.get(hitData.targetId)
    if (targetPlayer) {
      targetPlayer.health = Math.max(0, targetPlayer.health - hitData.damage)

      if (targetPlayer.health <= 0 && targetPlayer.isAlive) {
        targetPlayer.isAlive = false
        targetPlayer.animations.state = 'dead'
      }
    }

    // Add to events
    this.events.push({
      id: `player_hit_${Date.now()}`,
      type: 'player_hit',
      data: hitData,
      timestamp: Date.now(),
      position: new THREE.Vector3(hitData.position.x, hitData.position.y, hitData.position.z)
    })
  }

  private handlePlayerKilled(killData: any): void {
    // Create death effects
    this.createDeathEffect(killData.position)

    // Update player stats
    const victim = this.remotePlayers.get(killData.victimId)
    const killer = this.remotePlayers.get(killData.killerId)

    if (victim) {
      victim.isAlive = false
      victim.deaths++
      victim.animations.state = 'dead'
    }

    if (killer) {
      killer.kills++
      killer.score += killData.points || 100
    }

    // Add to events
    this.events.push({
      id: `player_killed_${Date.now()}`,
      type: 'player_killed',
      data: killData,
      timestamp: Date.now(),
      position: new THREE.Vector3(killData.position.x, killData.position.y, killData.position.z)
    })
  }

  private handleGameStateUpdate(gameState: GameState): void {
    this.gameState = gameState

    if (this.onGameStateChanged) {
      this.onGameStateChanged(gameState)
    }
  }

  private handleServerReconciliation(ackData: any): void {
    this.acknowledgedInputs = Math.max(this.acknowledgedInputs, ackData.sequence)

    // Replay inputs since acknowledged sequence
    if (this.latencyOptimizer.clientPrediction) {
      this.replayInputs(ackData.sequence)
    }
  }

  private updateRemotePlayers(deltaTime: number): void {
    const renderTime = Date.now() - this.latencyOptimizer.interpolationDelay

    this.playerStateBuffer.forEach((buffer, playerId) => {
      if (buffer.length < 2) return

      // Find states to interpolate between
      let prevState: NetworkPlayer | null = null
      let nextState: NetworkPlayer | null = null

      for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i].lastUpdate <= renderTime && buffer[i + 1].lastUpdate >= renderTime) {
          prevState = buffer[i]
          nextState = buffer[i + 1]
          break
        }
      }

      if (prevState && nextState) {
        // Interpolate position
        const t = (renderTime - prevState.lastUpdate) / (nextState.lastUpdate - prevState.lastUpdate)
        const player = this.remotePlayers.get(playerId)

        if (player) {
          // Position interpolation
          player.position.lerpVectors(prevState.position, nextState.position, t)

          // Rotation interpolation
          player.rotation.x = THREE.MathUtils.lerp(prevState.rotation.x, nextState.rotation.x, t)
          player.rotation.y = THREE.MathUtils.lerp(prevState.rotation.y, nextState.rotation.y, t)
          player.rotation.z = THREE.MathUtils.lerp(prevState.rotation.z, nextState.rotation.z, t)

          // Update visual model
          if (player.model) {
            player.model.position.copy(player.position)
            player.model.rotation.copy(player.rotation)
          }
        }
      }
    })
  }

  private updateProjectiles(deltaTime: number): void {
    this.projectiles.forEach((projectile, id) => {
      // Update position
      projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime))

      // Apply gravity
      projectile.velocity.y -= 9.8 * deltaTime

      // Update trail
      if (projectile.trail) {
        projectile.trail.geometry.setFromPoints([
          projectile.position.clone().add(projectile.velocity.clone().normalize().multiplyScalar(-0.5)),
          projectile.position
        ])
      }

      // Check lifetime
      projectile.lifetime -= deltaTime * 1000
      if (projectile.lifetime <= 0) {
        this.scene.remove(projectile.trail!)
        this.projectiles.delete(id)
      }
    })
  }

  private processEvents(): void {
    // Process events in chronological order
    this.events.sort((a, b) => a.timestamp - b.timestamp)

    this.events = this.events.filter(event => {
      // Process event based on type
      switch (event.type) {
        case 'player_hit':
          // Event already handled in handlePlayerHit
          return false
        case 'player_killed':
          // Event already handled in handlePlayerKilled
          return false
        case 'weapon_fired':
          // Event already handled in handleWeaponFire
          return false
        default:
          return Date.now() - event.timestamp < 5000 // Keep events for 5 seconds
      }
    })
  }

  private cleanupOldData(): void {
    // Clean old state buffer data
    this.playerStateBuffer.forEach((buffer, playerId) => {
      const cutoff = Date.now() - 1000 // Keep 1 second of history
      this.playerStateBuffer.set(playerId, buffer.filter(state => state.lastUpdate > cutoff))
    })
  }

  private createNetworkPlayer(playerData: any): NetworkPlayer {
    return {
      id: playerData.id,
      username: playerData.username,
      position: new THREE.Vector3(playerData.position.x, playerData.position.y, playerData.position.z),
      rotation: new THREE.Euler(playerData.rotation.x, playerData.rotation.y, playerData.rotation.z),
      velocity: new THREE.Vector3(playerData.velocity.x, playerData.velocity.y, playerData.velocity.z),
      health: playerData.health || 100,
      armor: playerData.armor || 0,
      score: playerData.score || 0,
      kills: playerData.kills || 0,
      deaths: playerData.deaths || 0,
      team: playerData.team || 'spectator',
      weapon: playerData.weapon || 'pistol',
      isAlive: playerData.isAlive !== false,
      isShooting: false,
      isReloading: false,
      ammo: {
        current: playerData.ammo?.current || 30,
        reserve: playerData.ammo?.reserve || 90
      },
      animations: {
        state: 'idle',
        time: 0
      },
      ping: 0,
      lastUpdate: Date.now()
    }
  }

  private predictLocalPlayerState(updateData: any): void {
    // Store input for potential replay
    // This would be implemented based on the specific game mechanics
  }

  private reconcileWithServer(updates: any): void {
    // Reconcile client-predicted state with server state
    if (this.localPlayer) {
      this.localPlayer.position = new THREE.Vector3(updates.position.x, updates.position.y, updates.position.z)
      this.localPlayer.rotation = new THREE.Euler(updates.rotation.x, updates.rotation.y, updates.rotation.z)
      this.localPlayer.velocity = new THREE.Vector3(updates.velocity.x, updates.velocity.y, updates.velocity.z)
    }
  }

  private replayInputs(fromSequence: number): void {
    // Replay inputs from the specified sequence
    // This would be implemented based on the specific input system
  }

  private startPingMeasurement(): void {
    setInterval(() => {
      if (this.socket) {
        this.lastPingTime = Date.now()
        this.socket.emit('ping')
      }
    }, 5000)
  }

  private updatePing(): void {
    const ping = Date.now() - this.lastPingTime
    this.pingHistory.push(ping)

    if (this.pingHistory.length > 10) {
      this.pingHistory.shift()
    }

    this.networkStats.averagePing = this.pingHistory.reduce((a, b) => a + b, 0) / this.pingHistory.length

    // Update interpolation delay based on ping
    this.latencyOptimizer.interpolationDelay = Math.max(50, this.networkStats.averagePing * 0.5)
  }

  private updateNetworkStats(): void {
    // Update packet loss, jitter, etc.
    // This would involve tracking received packets vs expected packets
  }

  private createMuzzleFlash(position: any, direction: any): void {
    // Create visual muzzle flash effect
    const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    })
    const flash = new THREE.Mesh(flashGeometry, flashMaterial)

    flash.position.set(position.x, position.y, position.z)
    this.scene.add(flash)

    // Remove after short duration
    setTimeout(() => {
      this.scene.remove(flash)
    }, 100)
  }

  private createHitEffect(position: any, damage: number): void {
    // Create visual hit effect
    const hitGeometry = new THREE.SphereGeometry(0.2, 8, 8)
    const hitMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.6
    })
    const hit = new THREE.Mesh(hitGeometry, hitMaterial)

    hit.position.set(position.x, position.y, position.z)
    this.scene.add(hit)

    // Remove after duration based on damage
    setTimeout(() => {
      this.scene.remove(hit)
    }, 300 + damage * 10)
  }

  private createDeathEffect(position: any): void {
    // Create death effect
    const particleCount = 20
    const particles: ParticleMesh[] = []

    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.8
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial) as unknown as ParticleMesh

      particle.position.set(position.x, position.y, position.z)
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 3,
        (Math.random() - 0.5) * 5
      )

      this.scene.add(particle)
      particles.push(particle)
    }

    // Animate and remove particles
    let time = 0
    const animate = () => {
      time += 0.016

      particles.forEach(particle => {
        particle.position.add(particle.velocity.clone().multiplyScalar(0.016))
        particle.velocity.y -= 9.8 * 0.016
        ;(particle.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - time * 0.5)
      })

      if (time < 2) {
        requestAnimationFrame(animate)
      } else {
        particles.forEach(particle => this.scene.remove(particle))
      }
    }
    animate()
  }

  private createProjectileTrail(): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    ])
    const material = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.6
    })
    return new THREE.Line(geometry, material)
  }

  // Getters for network stats
  public getNetworkStats() {
    return { ...this.networkStats }
  }

  public getLocalPlayer(): NetworkPlayer | null {
    return this.localPlayer
  }

  public getRemotePlayers(): NetworkPlayer[] {
    return Array.from(this.remotePlayers.values())
  }

  public getGameState(): GameState | null {
    return this.gameState
  }

  public getEvents(): NetworkEvent[] {
    return [...this.events]
  }

  public isConnected(): boolean {
    return this.socket?.connected || false
  }
}

// React Hook for Multiplayer Networking
export const useGLXYMultiplayer = (
  scene: THREE.Scene,
  camera: THREE.Camera,
  serverUrl?: string,
  playerId?: string,
  username?: string
) => {
  const [networking, setNetworking] = useState<GLXYMultiplayerNetworking | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [players, setPlayers] = useState<NetworkPlayer[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [networkStats, setNetworkStats] = useState<any>(null)

  useEffect(() => {
    if (scene && camera && serverUrl && playerId && username) {
      const net = new GLXYMultiplayerNetworking(
        scene,
        camera,
        (player) => setPlayers(prev => [...prev, player]),
        (playerId) => setPlayers(prev => prev.filter(p => p.id !== playerId)),
        (state) => setGameState(state)
      )

      net.connect(serverUrl, playerId, username).then(connected => {
        if (connected) {
          setNetworking(net)
          setIsConnected(true)
        }
      })

      return () => {
        net.disconnect()
      }
    }
    return undefined;
  }, [scene, camera, serverUrl, playerId, username])

  useEffect(() => {
    if (networking) {
      const updateInterval = setInterval(() => {
        networking.update(1/60) // 60 FPS update
        setNetworkStats(networking.getNetworkStats())
      }, 16)

      return () => clearInterval(updateInterval)
    }
    return undefined;
  }, [networking])

  return {
    networking,
    isConnected,
    players,
    gameState,
    networkStats,
    sendPlayerUpdate: (pos: THREE.Vector3, rot: THREE.Euler, vel: THREE.Vector3, inputs: any) =>
      networking?.sendPlayerUpdate(pos, rot, vel, inputs),
    shootWeapon: (dir: THREE.Vector3, weapon: string) =>
      networking?.shootWeapon(dir, weapon),
    throwGrenade: (pos: THREE.Vector3, vel: THREE.Vector3, type: string) =>
      networking?.throwGrenade(pos, vel, type),
    hitPlayer: (targetId: string, damage: number, location: string, weapon: string) =>
      networking?.hitPlayer(targetId, damage, location, weapon)
  }
}

export default GLXYMultiplayerNetworking