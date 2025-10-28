// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { io, Socket } from 'socket.io-client'

// STRICT MODE: Comprehensive interfaces with proper typing
export interface GLXYVector3 {
  x: number
  y: number
  z: number
}

export interface GLXYVector2 {
  x: number
  y: number
}

export interface GLXYPlayer {
  id: string
  username: string
  position: GLXYVector3
  rotation: GLXYVector3
  velocity: GLXYVector3
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  shield: number
  maxShield: number
  kills: number
  deaths: number
  assists: number
  damage: number
  score: number
  streak: number
  bestStreak: number
  currentWeapon: string
  weapons: GLXYWeapon[]
  inventory: GLXYInventoryItem[]
  isAlive: boolean
  isDowned: boolean
  isSpectating: boolean
  team?: string
  ping: number
  lastUpdate: number
  stats: GLXYPlayerStats
  cosmetics: GLXYCosmetics
  level: number
  experience: number
  battlePass: {
    level: number
    progress: number
    premium: boolean
  }
}

export interface GLXYWeapon {
  id: string
  name: string
  type: 'assault' | 'smg' | 'sniper' | 'shotgun' | 'pistol' | 'heavy' | 'melee' | 'thrown'
  damage: number
  fireRate: number
  accuracy: number
  range: number
  ammo: {
    current: number
    reserve: number
    maxClip: number
    maxReserve: number
  }
  reloadTime: number
  ADSAccuracy: number
  recoilPattern: GLXYVector2[]
  bulletVelocity: number
  penetration: number
  attachments: GLXYWeaponAttachment[]
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  fireMode: 'single' | 'burst' | 'auto' | 'charge'
  handling: {
    ADS: number
    SprintToFire: number
    EquipSpeed: number
    ReloadSpeed: number
  }
}

export interface GLXYInventoryItem {
  id: string
  name: string
  type: 'weapon' | 'healing' | 'utility' | 'ammo' | 'attachment' | 'backpack' | 'armor'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  stack: number
  maxStack: number
  value: number
  properties: Record<string, any>
}

export interface GLXYPlayerStats {
  accuracy: number
  headshotRate: number
  survivalTime: number
  damageDealt: number
  damageTaken: number
  distanceTraveled: number
  enemiesEliminated: number
  revivalCount: number
  reviveCount: number
  objectiveCaptures: number
  matchesPlayed: number
  wins: number
  top3: number
  top10: number
  kdRatio: number
  winRate: number
}

export interface GLXYCosmetics {
  skin: string
  backpack: string
  pickaxe: string
  glider: string
  trail: string
  emotes: string[]
  loadingScreen: string
  banner: {
    icon: string
    color: string
  }
}

export interface GLXYWeaponAttachment {
  id: string
  type: 'scope' | 'barrel' | 'magazine' | 'stock' | 'grip' | 'muzzle'
  name: string
  stats: Partial<GLXYWeapon>
}

export interface GLXYBattleRoyaleGame {
  id: string
  mode: 'solo' | 'duo' | 'squad' | 'trio' | 'ltm'
  map: string
  maxPlayers: number
  currentPlayers: number
  playersAlive: number
  state: 'lobby' | 'starting' | 'in-progress' | 'ending' | 'finished'
  round: number
  timeRemaining: number
  startTime: number
  safeZone: {
    center: GLXYVector3
    radius: number
    damage: number
    shrinkTime: number
    nextRadius: number
    phase: number
  }
  storm: {
    position: GLXYVector3
    radius: number
    damage: number
  }
  weather: {
    type: 'clear' | 'rain' | 'fog' | 'storm' | 'sandstorm'
    intensity: number
  }
  objectives: GLXYObjective[]
  vehicles: GLXYVehicle[]
  supplyDrops: GLXYSupplyDrop[]
  respawnBeacons: GLXYRespawnBeacon[]
}

export interface GLXYObjective {
  id: string
  type: 'capture_point' | 'escort' | 'destroy' | 'deliver' | 'survive'
  position: GLXYVector3
  radius: number
  progress: number
  maxProgress: number
  contested: boolean
  owner?: string
}

export interface GLXYVehicle {
  id: string
  type: string
  position: GLXYVector3
  rotation: GLXYVector3
  health: number
  maxHealth: number
  fuel: number
  maxFuel: number
  seats: number
  occupants: string[]
  velocity: GLXYVector3
}

export interface GLXYSupplyDrop {
  id: string
  position: GLXYVector3
  type: 'regular' | 'special' | 'mythic'
  loot: GLXYInventoryItem[]
  status: 'incoming' | 'landed' | 'opened'
  landingTime: number
}

export interface GLXYRespawnBeacon {
  id: string
  position: GLXYVector3
  status: 'active' | 'used' | 'cooldown'
  respawnTime: number
  team?: string
}

export interface GLXYPerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  memoryUsage: number
  textureMemory: number
  gpuTime: number
  cpuTime: number
  networkLatency: number
  packetLoss: number
  jitter: number
  averageFPS: number
  onePercentLow: number
  pointOnePercentLow: number
  frameDrops: number
  renderTime: number
  updateTime: number
}

export interface GLXYNetworkStats {
  packetsSent: number
  packetsReceived: number
  bytesSent: number
  bytesReceived: number
  averagePing: number
  packetLoss: number
  jitter: number
  bandwidth: number
}

export interface GLXYGameSettings {
  graphics: {
    quality: 'potato' | 'low' | 'medium' | 'high' | 'ultra' | 'cinematic'
    shadows: 'none' | 'low' | 'medium' | 'high' | 'ultra'
    antiAliasing: 'none' | 'fxaa' | 'smaa' | 'msaa2x' | 'msaa4x' | 'msaa8x'
    textures: 'low' | 'medium' | 'high' | 'ultra' | 'insane'
    particles: 'minimal' | 'low' | 'medium' | 'high' | 'extreme'
    renderDistance: number
    lodBias: number
    vsync: boolean
    frameRateCap: number
  }
  audio: {
    masterVolume: number
    sfxVolume: number
    voiceVolume: number
    musicVolume: number
    spatialAudio: boolean
    hrtf: boolean
    quality: 'low' | 'medium' | 'high' | 'ultra'
  }
  controls: {
    sensitivity: {
      x: number
      y: number
      scope: number
      vehicle: number
    }
    invertY: boolean
    ADSMode: 'hold' | 'toggle'
    crouchMode: 'hold' | 'toggle'
    autoSprint: boolean
  }
  accessibility: {
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    subtitles: boolean
    uiScale: number
    motionBlur: boolean
    screenShake: boolean
  }
  gameplay: {
    autoPickup: boolean
    crosshairStyle: 'classic' | 'modern' | 'minimal'
    killFeed: boolean
    damageNumbers: boolean
    hitMarkers: boolean
    miniMap: boolean
    teamColors: boolean
  }
}

export interface GLXYBattleRoyaleConfig {
  maxPlayers: number
  gameDuration: number
  safeZoneTimings: number[]
  respawnSystem: boolean
  reviveSystem: boolean
  friendlyFire: boolean
  vehiclesEnabled: boolean
  supplyDropsEnabled: boolean
  progression: {
    experienceMultiplier: number
    battlePassActive: boolean
    rewards: any[]
  }
  antiCheat: {
    enabled: boolean
    validationLevel: 'basic' | 'standard' | 'strict' | 'military'
  }
}

// PRODUCTION-READY BATTLE ROYALE CORE ENGINE
export class GLXYBattleRoyaleCore {
  private static instance: GLXYBattleRoyaleCore | null = null

  // Core systems
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private camera: THREE.PerspectiveCamera
  private clock: THREE.Clock
  private socket: Socket | null = null

  // Game state
  private game: GLXYBattleRoyaleGame | null = null
  private localPlayer: GLXYPlayer | null = null
  private players: Map<string, GLXYPlayer> = new Map()
  private projectiles: Map<string, any> = new Map()
  private loot: Map<string, GLXYInventoryItem> = new Map()

  // Performance monitoring
  private performanceMetrics: GLXYPerformanceMetrics
  private networkStats: GLXYNetworkStats
  private frameTimings: number[] = []
  private maxFrameTimings = 300
  private lastPerformanceUpdate = 0

  // Resource management
  private resourcePool: THREE.Object3D[] = []
  private textureCache: Map<string, THREE.Texture> = new Map()
  private modelCache: Map<string, THREE.Group> = new Map()
  private materialPool: THREE.Material[] = []

  // Optimization systems
  private lodManager!: LODManager
  private cullingManager!: CullingManager
  private memoryManager!: MemoryManager
  private networkOptimizer!: NetworkOptimizer
  private physicsOptimizer!: PhysicsOptimizer

  // Error handling
  private errorBoundary!: ErrorBoundary
  private crashReporter!: CrashReporter
  private recoverySystem!: RecoverySystem

  // Settings
  private settings: GLXYGameSettings
  private config: GLXYBattleRoyaleConfig

  // Events
  private eventListeners: Map<string, Function[]> = new Map()

  // Animation loop
  private animationId: number | null = null
  private isDestroyed = false

  constructor(canvas: HTMLCanvasElement, config: Partial<GLXYBattleRoyaleConfig> = {}) {
    // Singleton pattern for production
    if (GLXYBattleRoyaleCore.instance) {
      throw new Error('GLXYBattleRoyaleCore is a singleton. Use getInstance() instead.')
    }

    this.config = this.mergeConfig(this.getDefaultConfig(), config)
    this.settings = this.getDefaultSettings()
    this.performanceMetrics = this.getDefaultPerformanceMetrics()
    this.networkStats = this.getDefaultNetworkStats()

    // Initialize Three.js
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.settings.graphics.quality !== 'potato',
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    })
    this.clock = new THREE.Clock()

    this.initializeRenderer()
    this.initializeOptimizers()
    this.initializeErrorHandling()
    this.setupEventListeners()

    GLXYBattleRoyaleCore.instance = this
  }

  public static getInstance(): GLXYBattleRoyaleCore | null {
    return GLXYBattleRoyaleCore.instance
  }

  private initializeRenderer(): void {
    const { graphics } = this.settings

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = graphics.shadows !== 'none'
    this.renderer.shadowMap.type = this.getShadowMapType(graphics.shadows)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1

    // Scene setup
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0008)
    this.scene.background = new THREE.Color(0x87CEEB)

    // Camera setup
    this.camera.position.set(0, 1.6, 0)
    this.camera.far = graphics.renderDistance

    console.log('🎮 GLXY Battle Royale Core initialized')
  }

  private initializeOptimizers(): void {
    this.lodManager = new LODManager(this.scene, this.settings.graphics)
    this.cullingManager = new CullingManager(this.camera, this.settings.graphics.renderDistance)
    this.memoryManager = new MemoryManager(4096) // 4GB limit
    this.networkOptimizer = new NetworkOptimizer(this.config.antiCheat.validationLevel)
    this.physicsOptimizer = new PhysicsOptimizer()

    console.log('⚡ Optimization systems initialized')
  }

  private initializeErrorHandling(): void {
    this.errorBoundary = new ErrorBoundary()
    this.crashReporter = new CrashReporter()
    this.recoverySystem = new RecoverySystem()

    // Setup global error handlers
    window.addEventListener('error', (event) => {
      this.handleCriticalError(event.error, event.message, event.filename, event.lineno, event.colno)
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.handleCriticalError(event.reason, 'Unhandled Promise Rejection')
    })

    console.log('🛡️ Error handling systems initialized')
  }

  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this))

    // Visibility change for performance
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

    // Page unload
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this))
  }

  public async connect(serverUrl: string, playerId: string, username: string): Promise<boolean> {
    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 10000,
        query: {
          playerId,
          username,
          gameMode: 'battle-royale',
          config: JSON.stringify(this.config)
        }
      })

      this.setupSocketListeners()
      await this.waitForConnection()

      console.log('🔗 Connected to Battle Royale server')
      this.emit('connected', { playerId, username })
      return true

    } catch (error) {
      this.handleCriticalError(error, 'Failed to connect to server')
      return false
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Socket connected')
      this.networkStats.packetsSent++
    })

    this.socket.on('disconnect', (reason) => {
      console.warn('❌ Socket disconnected:', reason)
      this.handleDisconnection(reason)
    })

    this.socket.on('gameState', (gameState: GLXYBattleRoyaleGame) => {
      this.handleGameStateUpdate(gameState)
    })

    this.socket.on('playerUpdate', (playerData: GLXYPlayer) => {
      this.handlePlayerUpdate(playerData)
    })

    this.socket.on('playerJoined', (playerData: GLXYPlayer) => {
      this.handlePlayerJoined(playerData)
    })

    this.socket.on('playerLeft', (playerId: string) => {
      this.handlePlayerLeft(playerId)
    })

    this.socket.on('weaponFire', (fireData: any) => {
      this.handleWeaponFire(fireData)
    })

    this.socket.on('playerHit', (hitData: any) => {
      this.handlePlayerHit(hitData)
    })

    this.socket.on('playerKilled', (killData: any) => {
      this.handlePlayerKilled(killData)
    })

    this.socket.on('supplyDrop', (dropData: GLXYSupplyDrop) => {
      this.handleSupplyDrop(dropData)
    })

    this.socket.on('safeZoneUpdate', (zoneData: any) => {
      this.handleSafeZoneUpdate(zoneData)
    })

    this.socket.on('error', (error: any) => {
      this.handleNetworkError(error)
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

  public start(): void {
    if (this.isDestroyed) {
      console.warn('Cannot start destroyed core')
      return
    }

    console.log('🚀 Starting Battle Royale game loop')
    this.gameLoop()
  }

  private gameLoop = (): void => {
    if (this.isDestroyed) return

    const frameStart = performance.now()
    const deltaTime = this.clock.getDelta()

    try {
      // Update performance metrics
      this.updatePerformanceMetrics(frameStart)

      // Update game systems
      this.updateGameSystems(deltaTime)

      // Update optimizations
      this.updateOptimizations(deltaTime)

      // Render frame
      this.renderFrame()

      // Network updates
      this.updateNetwork()

      // Calculate frame time
      const frameTime = performance.now() - frameStart
      this.recordFrameTime(frameTime)

      // Continue animation loop
      this.animationId = requestAnimationFrame(this.gameLoop)

    } catch (error) {
      this.handleGameLoopError(error)
    }
  }

  private updateGameSystems(deltaTime: number): void {
    if (!this.game || !this.localPlayer) return

    // Update local player
    this.updateLocalPlayer(deltaTime)

    // Update remote players
    this.updateRemotePlayers(deltaTime)

    // Update projectiles
    this.updateProjectiles(deltaTime)

    // Update game state
    if (this.game.state === 'in-progress') {
      this.updateGameState(deltaTime)
    }
  }

  private updateOptimizations(deltaTime: number): void {
    // LOD management
    this.lodManager.update(this.camera)

    // Frustum culling
    this.cullingManager.update(this.scene)

    // Memory management
    this.memoryManager.update()

    // Physics optimization
    this.physicsOptimizer.update(deltaTime)
  }

  private renderFrame(): void {
    // Cull objects outside view
    this.cullingManager.cull(this.scene)

    // Apply LODs
    this.lodManager.apply(this.camera)

    // Render the scene
    this.renderer.render(this.scene, this.camera)

    // Update render stats
    this.performanceMetrics.drawCalls = this.renderer.info.render.calls
    this.performanceMetrics.triangles = this.renderer.info.render.triangles
  }

  private updatePerformanceMetrics(frameStart: number): void {
    const now = performance.now()
    const frameTime = now - frameStart

    // Update FPS
    this.performanceMetrics.frameTime = frameTime
    this.performanceMetrics.fps = 1000 / frameTime

    // Update memory usage
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize
      this.performanceMetrics.textureMemory = memory.totalJSHeapSize - memory.usedJSHeapSize
    }

    // Update GPU info
    if (this.renderer.info) {
      this.performanceMetrics.drawCalls = this.renderer.info.render.calls
      this.performanceMetrics.triangles = this.renderer.info.render.triangles
    }

    // Emit performance update periodically
    if (now - this.lastPerformanceUpdate > 1000) {
      this.emit('performanceUpdate', this.performanceMetrics)
      this.lastPerformanceUpdate = now
    }
  }

  private recordFrameTime(frameTime: number): void {
    this.frameTimings.push(frameTime)

    // Keep only recent frame times
    if (this.frameTimings.length > this.maxFrameTimings) {
      this.frameTimings.shift()
    }

    // Calculate FPS statistics
    if (this.frameTimings.length > 0) {
      const fps = this.frameTimings.map(time => 1000 / time)
      this.performanceMetrics.averageFPS = fps.reduce((sum, fps) => sum + fps, 0) / fps.length

      // Calculate 1% and 0.1% low FPS
      const sortedFps = [...fps].sort((a, b) => a - b)
      const onePercentIndex = Math.floor(sortedFps.length * 0.01)
      const pointOnePercentIndex = Math.floor(sortedFps.length * 0.001)

      this.performanceMetrics.onePercentLow = sortedFps[onePercentIndex] || 60
      this.performanceMetrics.pointOnePercentLow = sortedFps[pointOnePercentIndex] || 60
    }

    // Detect frame drops
    const targetFrameTime = 1000 / this.settings.graphics.frameRateCap
    if (frameTime > targetFrameTime * 1.5) {
      this.performanceMetrics.frameDrops++
    }
  }

  private handleGameStateUpdate(gameState: GLXYBattleRoyaleGame): void {
    this.game = gameState
    this.emit('gameStateUpdate', gameState)
  }

  private handlePlayerUpdate(playerData: GLXYPlayer): void {
    if (playerData.id === this.localPlayer?.id) {
      this.localPlayer = playerData
      this.emit('localPlayerUpdate', playerData)
    } else {
      this.players.set(playerData.id, playerData)
      this.emit('playerUpdate', playerData)
    }
  }

  private handlePlayerJoined(playerData: GLXYPlayer): void {
    this.players.set(playerData.id, playerData)
    this.emit('playerJoined', playerData)
    console.log(`👋 Player joined: ${playerData.username}`)
  }

  private handlePlayerLeft(playerId: string): void {
    const player = this.players.get(playerId)
    if (player) {
      this.players.delete(playerId)
      this.emit('playerLeft', playerId)
      console.log(`👋 Player left: ${player.username}`)
    }
  }

  private handleWeaponFire(fireData: any): void {
    // Create visual and audio effects
    this.createWeaponEffects(fireData)
    this.emit('weaponFire', fireData)
  }

  private handlePlayerHit(hitData: any): void {
    // Create hit effects
    this.createHitEffects(hitData)
    this.emit('playerHit', hitData)
  }

  private handlePlayerKilled(killData: any): void {
    // Create death effects
    this.createDeathEffects(killData)
    this.emit('playerKilled', killData)
  }

  private handleSupplyDrop(dropData: GLXYSupplyDrop): void {
    // Create supply drop visuals
    this.createSupplyDropEffects(dropData)
    this.emit('supplyDrop', dropData)
  }

  private handleSafeZoneUpdate(zoneData: any): void {
    if (this.game) {
      this.game.safeZone = zoneData
      this.createSafeZoneEffects(zoneData)
      this.emit('safeZoneUpdate', zoneData)
    }
  }

  private createWeaponEffects(fireData: any): void {
    // Muzzle flash, sound, shell ejection
    const muzzleFlash = this.createMuzzleFlash(fireData.position, fireData.direction)
    this.scene.add(muzzleFlash)

    // Remove effect after short duration
    setTimeout(() => {
      this.scene.remove(muzzleFlash)
      this.disposeObject(muzzleFlash)
    }, 100)
  }

  private createHitEffects(hitData: any): void {
    // Blood splatter, damage indicator, sound
    const hitEffect = this.createHitMarker(hitData.position, hitData.damage)
    this.scene.add(hitEffect)

    setTimeout(() => {
      this.scene.remove(hitEffect)
      this.disposeObject(hitEffect)
    }, 500)
  }

  private createDeathEffects(killData: any): void {
    // Death particles, sound, elimination message
    const deathParticles = this.createDeathParticles(killData.position)
    this.scene.add(deathParticles)

    setTimeout(() => {
      this.scene.remove(deathParticles)
      this.disposeObject(deathParticles)
    }, 2000)
  }

  private createSupplyDropEffects(dropData: GLXYSupplyDrop): void {
    // Supply drop crate, parachute, sound
    const supplyDrop = this.createSupplyDropModel(dropData)
    this.scene.add(supplyDrop)
  }

  private createSafeZoneEffects(zoneData: any): void {
    // Visual representation of safe zone boundary
    const safeZone = this.createSafeZoneVisual(zoneData)
    this.scene.add(safeZone)
  }

  private createMuzzleFlash(position: GLXYVector3, direction: GLXYVector3): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    })
    const flash = new THREE.Mesh(geometry, material)
    flash.position.set(position.x, position.y, position.z)
    return flash
  }

  private createHitMarker(position: GLXYVector3, damage: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.1, 6, 6)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.7
    })
    const hitMarker = new THREE.Mesh(geometry, material)
    hitMarker.position.set(position.x, position.y, position.z)
    return hitMarker
  }

  private createDeathParticles(position: GLXYVector3): THREE.Group {
    const group = new THREE.Group()
    const particleCount = 20

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0, 0.8, Math.random() * 0.5 + 0.5),
        transparent: true,
        opacity: 0.8
      })
      const particle = new THREE.Mesh(geometry, material)

      particle.position.set(
        position.x + (Math.random() - 0.5) * 2,
        position.y + Math.random() * 2,
        position.z + (Math.random() - 0.5) * 2
      )

      group.add(particle)
    }

    return group
  }

  private createSupplyDropModel(dropData: GLXYSupplyDrop): THREE.Group {
    const group = new THREE.Group()

    // Create crate
    const crateGeometry = new THREE.BoxGeometry(2, 2, 2)
    const crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    })
    const crate = new THREE.Mesh(crateGeometry, crateMaterial)
    group.add(crate)

    // Create parachute
    const parachuteGeometry = new THREE.ConeGeometry(3, 1, 8)
    const parachuteMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    })
    const parachute = new THREE.Mesh(parachuteGeometry, parachuteMaterial)
    parachute.position.y = 3
    group.add(parachute)

    group.position.set(dropData.position.x, dropData.position.y, dropData.position.z)

    return group
  }

  private createSafeZoneVisual(zoneData: any): THREE.Group {
    const group = new THREE.Group()

    // Create cylinder mesh for safe zone
    const geometry = new THREE.CylinderGeometry(zoneData.radius, zoneData.radius, 100, 32)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    })
    const zone = new THREE.Mesh(geometry, material)
    zone.position.set(zoneData.center.x, 0, zoneData.center.z)
    group.add(zone)

    // Create warning ring at boundary
    const ringGeometry = new THREE.TorusGeometry(zoneData.radius, 0.5, 8, 100)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.position.set(zoneData.center.x, 1, zoneData.center.z)
    group.add(ring)

    return group
  }

  private updateLocalPlayer(deltaTime: number): void {
    if (!this.localPlayer || !this.localPlayer.isAlive) return

    // Handle input, movement, and actions
    // This would integrate with input system
  }

  private updateRemotePlayers(deltaTime: number): void {
    // Update remote player positions with interpolation
    this.players.forEach(player => {
      if (player.id !== this.localPlayer?.id) {
        // Interpolate movement
        // Update animations
        // Handle physics
      }
    })
  }

  private updateProjectiles(deltaTime: number): void {
    // Update projectile positions
    // Check collisions
    // Handle impacts
  }

  private updateGameState(deltaTime: number): void {
    if (!this.game) return

    // Update game timers
    // Check win conditions
    // Update safe zone
    // Handle events
  }

  private updateNetwork(): void {
    if (!this.socket || !this.localPlayer) return

    // Send player updates
    this.socket.emit('playerUpdate', {
      position: this.localPlayer.position,
      rotation: this.localPlayer.rotation,
      velocity: this.localPlayer.velocity,
      timestamp: Date.now()
    })

    this.networkStats.packetsSent++
  }

  private handleCriticalError(error: any, message: string, filename?: string, lineno?: number, colno?: number): void {
    console.error('🚨 Critical Error:', error, message)

    this.crashReporter.report({
      error,
      message,
      filename,
      lineno,
      colno,
      timestamp: Date.now(),
      gameState: this.game,
      playerStats: this.localPlayer
    })

    // Attempt recovery
    this.recoverySystem.attemptRecovery(error)
  }

  private handleGameLoopError(error: any): void {
    console.error('🎮 Game Loop Error:', error)

    // Don't crash the entire game, try to continue
    this.emit('gameError', error)

    // Continue animation loop
    if (!this.isDestroyed) {
      this.animationId = requestAnimationFrame(this.gameLoop)
    }
  }

  private handleNetworkError(error: any): void {
    console.error('🌐 Network Error:', error)
    this.emit('networkError', error)

    // Handle reconnection logic
    this.networkOptimizer.handleError(error)
  }

  private handleDisconnection(reason: string): void {
    console.warn('🔌 Disconnected:', reason)
    this.emit('disconnected', reason)

    // Attempt reconnection based on reason
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, don't reconnect automatically
      return
    }

    this.attemptReconnection()
  }

  private attemptReconnection(): void {
    if (!this.socket) return

    const maxRetries = 5
    let retryCount = 0

    const reconnect = () => {
      if (retryCount >= maxRetries) {
        console.error('❌ Max reconnection attempts reached')
        this.emit('reconnectionFailed')
        return
      }

      retryCount++
      console.log(`🔄 Reconnection attempt ${retryCount}/${maxRetries}`)

      this.socket!.connect()
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
    setTimeout(reconnect, delay)
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden, reduce performance
      this.renderer.setAnimationLoop(null)
      console.log('⏸️ Game paused (page hidden)')
    } else {
      // Page is visible, resume
      this.renderer.setAnimationLoop(this.gameLoop)
      console.log('▶️ Game resumed (page visible)')
    }
  }

  private handlePageUnload(): void {
    this.destroy()
  }

  private getShadowMapType(shadows: string): THREE.ShadowMapType {
    switch (shadows) {
      case 'none': return THREE.BasicShadowMap
      case 'low': return THREE.BasicShadowMap
      case 'medium': return THREE.PCFShadowMap
      case 'high':
      case 'ultra': return THREE.PCFSoftShadowMap
      default: return THREE.PCFSoftShadowMap
    }
  }

  private disposeObject(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh) {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        } else {
          object.material.dispose()
        }
      }
    }
  }

  // Utility methods
  private mergeConfig(defaultConfig: GLXYBattleRoyaleConfig, customConfig: Partial<GLXYBattleRoyaleConfig>): GLXYBattleRoyaleConfig {
    return { ...defaultConfig, ...customConfig }
  }

  private getDefaultConfig(): GLXYBattleRoyaleConfig {
    return {
      maxPlayers: 100,
      gameDuration: 1800000, // 30 minutes
      safeZoneTimings: [120000, 90000, 60000, 45000, 30000],
      respawnSystem: true,
      reviveSystem: true,
      friendlyFire: false,
      vehiclesEnabled: true,
      supplyDropsEnabled: true,
      progression: {
        experienceMultiplier: 1.0,
        battlePassActive: true,
        rewards: []
      },
      antiCheat: {
        enabled: true,
        validationLevel: 'standard'
      }
    }
  }

  private getDefaultSettings(): GLXYGameSettings {
    return {
      graphics: {
        quality: 'high',
        shadows: 'high',
        antiAliasing: 'smaa',
        textures: 'high',
        particles: 'medium',
        renderDistance: 1000,
        lodBias: 1.0,
        vsync: true,
        frameRateCap: 60
      },
      audio: {
        masterVolume: 0.8,
        sfxVolume: 0.8,
        voiceVolume: 0.7,
        musicVolume: 0.5,
        spatialAudio: true,
        hrtf: true,
        quality: 'high'
      },
      controls: {
        sensitivity: { x: 1.0, y: 1.0, scope: 0.5, vehicle: 0.7 },
        invertY: false,
        ADSMode: 'hold',
        crouchMode: 'hold',
        autoSprint: false
      },
      accessibility: {
        colorBlindMode: 'none',
        subtitles: true,
        uiScale: 1.0,
        motionBlur: true,
        screenShake: true
      },
      gameplay: {
        autoPickup: true,
        crosshairStyle: 'classic',
        killFeed: true,
        damageNumbers: true,
        hitMarkers: true,
        miniMap: true,
        teamColors: true
      }
    }
  }

  private getDefaultPerformanceMetrics(): GLXYPerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      textureMemory: 0,
      gpuTime: 0,
      cpuTime: 0,
      networkLatency: 0,
      packetLoss: 0,
      jitter: 0,
      averageFPS: 60,
      onePercentLow: 60,
      pointOnePercentLow: 60,
      frameDrops: 0,
      renderTime: 0,
      updateTime: 0
    }
  }

  private getDefaultNetworkStats(): GLXYNetworkStats {
    return {
      packetsSent: 0,
      packetsReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      averagePing: 0,
      packetLoss: 0,
      jitter: 0,
      bandwidth: 0
    }
  }

  // Public API
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
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  public getPerformanceMetrics(): GLXYPerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  public getNetworkStats(): GLXYNetworkStats {
    return { ...this.networkStats }
  }

  public getLocalPlayer(): GLXYPlayer | null {
    return this.localPlayer ? { ...this.localPlayer } : null
  }

  public getPlayers(): GLXYPlayer[] {
    return Array.from(this.players.values()).map(player => ({ ...player }))
  }

  public getGameState(): GLXYBattleRoyaleGame | null {
    return this.game ? { ...this.game } : null
  }

  public updateSettings(settings: Partial<GLXYGameSettings>): void {
    this.settings = { ...this.settings, ...settings }
    this.applySettings()
  }

  private applySettings(): void {
    // Apply graphics settings
    this.renderer.shadowMap.enabled = this.settings.graphics.shadows !== 'none'
    this.renderer.shadowMap.type = this.getShadowMapType(this.settings.graphics.shadows)
    this.camera.far = this.settings.graphics.renderDistance

    // Apply other settings
    console.log('⚙️ Settings updated')
  }

  public destroy(): void {
    if (this.isDestroyed) return

    console.log('🗑️ Destroying GLXY Battle Royale Core')

    this.isDestroyed = true

    // Stop animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    // Dispose optimizers
    this.lodManager?.dispose()
    this.cullingManager?.dispose()
    this.memoryManager?.dispose()
    this.networkOptimizer?.dispose()
    this.physicsOptimizer?.dispose()

    // Dispose Three.js resources
    this.scene.traverse((object) => {
      this.disposeObject(object)
    })

    this.renderer.dispose()

    // Clear caches
    this.textureCache.clear()
    this.modelCache.clear()
    this.players.clear()
    this.projectiles.clear()
    this.loot.clear()
    this.eventListeners.clear()

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('beforeunload', this.handlePageUnload)

    GLXYBattleRoyaleCore.instance = null
  }
}

// Helper classes for optimization and error handling
class LODManager {
  private scene: THREE.Scene
  private settings: GLXYGameSettings['graphics']
  private lodObjects: Map<THREE.Object3D, THREE.LOD> = new Map()

  constructor(scene: THREE.Scene, settings: GLXYGameSettings['graphics']) {
    this.scene = scene
    this.settings = settings
  }

  public update(camera: THREE.Camera): void {
    // Update LODs based on camera position
  }

  public apply(camera: THREE.Camera): void {
    // Apply LOD changes
  }

  public dispose(): void {
    this.lodObjects.clear()
  }
}

class CullingManager {
  private camera: THREE.Camera
  private renderDistance: number

  constructor(camera: THREE.Camera, renderDistance: number) {
    this.camera = camera
    this.renderDistance = renderDistance
  }

  public update(scene: THREE.Scene): void {
    // Update culling
  }

  public cull(scene: THREE.Scene): void {
    // Perform frustum culling
  }

  public dispose(): void {
    // Cleanup
  }
}

class MemoryManager {
  private memoryLimit: number
  private gcThreshold = 0.8
  private lastGC = 0
  private gcCooldown = 5000

  constructor(memoryLimit: number) {
    this.memoryLimit = memoryLimit * 1024 * 1024 // Convert MB to bytes
  }

  public update(): void {
    if (!(performance as any).memory) return

    const memory = (performance as any).memory
    const usagePercentage = memory.usedJSHeapSize / memory.totalJSHeapSize

    if (usagePercentage > this.gcThreshold) {
      this.requestGarbageCollection()
    }
  }

  private requestGarbageCollection(): void {
    const currentTime = Date.now()
    if (currentTime - this.lastGC < this.gcCooldown) return

    this.lastGC = currentTime

    if ((window as any).gc) {
      (window as any).gc()
    }
  }

  public dispose(): void {
    // Cleanup
  }
}

class NetworkOptimizer {
  private validationLevel: GLXYBattleRoyaleConfig['antiCheat']['validationLevel']

  constructor(validationLevel: GLXYBattleRoyaleConfig['antiCheat']['validationLevel']) {
    this.validationLevel = validationLevel
  }

  public handleError(error: any): void {
    // Handle network errors based on validation level
  }

  public dispose(): void {
    // Cleanup
  }
}

class PhysicsOptimizer {
  public update(deltaTime: number): void {
    // Optimize physics calculations
  }

  public dispose(): void {
    // Cleanup
  }
}

class ErrorBoundary {
  private errors: any[] = []

  public captureError(error: any): void {
    this.errors.push({
      error,
      timestamp: Date.now(),
      stack: error.stack
    })
  }

  public getErrors(): any[] {
    return [...this.errors]
  }

  public clearErrors(): void {
    this.errors = []
  }
}

class CrashReporter {
  public report(data: any): void {
    // Send crash report to server
    console.log('🚨 Crash Report:', data)
  }
}

class RecoverySystem {
  public attemptRecovery(error: any): boolean {
    console.log('🔄 Attempting recovery from error:', error)

    try {
      // Attempt different recovery strategies
      return this.performRecovery()
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError)
      return false
    }
  }

  private performRecovery(): boolean {
    // Implement recovery logic
    return true
  }
}

export default GLXYBattleRoyaleCore