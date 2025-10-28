/**
 * GLXY Gaming Platform - Game Engine
 * Core game engine for Battle Royale with physics, collision detection, and game state management
 */

import { logger } from './logger'
import { audioManager } from './audio-manager'

export interface GameState {
  id: string
  name: string
  status: 'waiting' | 'starting' | 'playing' | 'finished'
  players: Player[]
  map: GameMap
  startTime?: Date
  endTime?: Date
  winner?: Player
  gameMode: 'battle-royale' | 'team-deathmatch' | 'solo'
  maxPlayers: number
  currentPlayers: number
  settings: GameSettings
}

export interface Player {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  health: number
  maxHealth: number
  armor: number
  weapons: Weapon[]
  isAlive: boolean
  isSpectating: boolean
  team?: string
  stats: PlayerStats
  input: PlayerInput
  lastUpdate: number
}

export interface Weapon {
  id: string
  name: string
  type: 'melee' | 'ranged' | 'explosive'
  damage: number
  range: number
  fireRate: number
  ammo: number
  maxAmmo: number
  reloadTime: number
  recoil: { x: number; y: number; z: number }
  soundEffects: {
    fire: string
    reload: string
    hit: string
    empty: string
  }
}

export interface GameMap {
  id: string
  name: string
  size: { width: number; height: number; depth: number }
  spawnPoints: SpawnPoint[]
  obstacles: Obstacle[]
  loot: LootItem[]
  safeZone: SafeZone
  storm: Storm
}

export interface SpawnPoint {
  id: string
  position: { x: number; y: number; z: number }
  team?: string
  isActive: boolean
}

export interface Obstacle {
  id: string
  type: 'building' | 'rock' | 'tree' | 'vehicle'
  position: { x: number; y: number; z: number }
  size: { width: number; height: number; depth: number }
  health: number
  isDestructible: boolean
}

export interface LootItem {
  id: string
  type: 'weapon' | 'ammo' | 'health' | 'armor' | 'utility'
  position: { x: number; y: number; z: number }
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  properties: Record<string, any>
}

export interface SafeZone {
  center: { x: number; y: number; z: number }
  radius: number
  damage: number
  shrinkRate: number
  nextShrinkTime: number
}

export interface Storm {
  center: { x: number; y: number; z: number }
  radius: number
  damage: number
  speed: number
  direction: number
}

export interface GameSettings {
  gameMode: 'battle-royale' | 'team-deathmatch' | 'solo'
  maxPlayers: number
  mapSize: 'small' | 'medium' | 'large'
  dayNightCycle: boolean
  weather: 'clear' | 'rain' | 'fog' | 'storm'
  lootSpawnRate: number
  stormSpeed: 'normal' | 'fast' | 'extreme'
  friendlyFire: boolean
}

export interface PlayerStats {
  kills: number
  deaths: number
  damage: number
  accuracy: number
  survivalTime: number
  rank: number
  xp: number
  level: number
}

export interface PlayerInput {
  moveForward: boolean
  moveBackward: boolean
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  crouch: boolean
  prone: boolean
  sprint: boolean
  fire: boolean
  reload: boolean
  aim: { x: number; y: number }
  switchWeapon: number
  interact: boolean
  emote: string
}

export interface CollisionResult {
  hasCollision: boolean
  normal?: { x: number; y: number; z: number }
  penetration: number
  damage: number
}

class GameEngine {
  private gameState: GameState | null = null
  private players: Map<string, Player> = new Map()
  private gameMap: GameMap | null = null
  private physics: PhysicsEngine
  private collisionDetector: CollisionDetector
  private lastUpdateTime: number = 0
  private updateInterval: number = 1000 / 60 // 60 FPS
  private isRunning: boolean = false

  constructor() {
    this.physics = new PhysicsEngine()
    this.collisionDetector = new CollisionDetector()
  }

  /**
   * Initialize a new game
   */
  initializeGame(gameSettings: GameSettings): GameState {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate game map
    this.gameMap = this.generateGameMap(gameSettings.mapSize)
    
    // Create game state
    this.gameState = {
      id: gameId,
      name: `GLXY Battle Royale #${Math.floor(Math.random() * 1000)}`,
      status: 'waiting',
      players: [],
      map: this.gameMap,
      gameMode: gameSettings.gameMode,
      maxPlayers: gameSettings.maxPlayers,
      currentPlayers: 0,
      settings: gameSettings
    }

    logger.info('Game initialized', { gameId, gameMode: gameSettings.gameMode })
    
    return this.gameState
  }

  /**
   * Start the game
   */
  startGame(): void {
    if (!this.gameState) {
      throw new Error('Game not initialized')
    }

    this.gameState.status = 'starting'
    this.gameState.startTime = new Date()
    this.isRunning = true

    // Play start sound
    audioManager.playSoundEffect('game_start', { volume: 0.8 })

    // Start game loop
    this.startGameLoop()

    logger.info('Game started', { gameId: this.gameState.id })
  }

  /**
   * Add a player to the game
   */
  addPlayer(playerData: Omit<Player, 'stats' | 'lastUpdate'>): Player {
    if (!this.gameState) {
      throw new Error('Game not initialized')
    }

    const player: Player = {
      ...playerData,
      id: playerData.id,
      stats: {
        kills: 0,
        deaths: 0,
        damage: 0,
        accuracy: 0,
        survivalTime: 0,
        rank: 1,
        xp: 0,
        level: 1
      },
      lastUpdate: Date.now()
    }

    // Find spawn point
    const spawnPoint = this.findAvailableSpawnPoint()
    player.position = { ...spawnPoint.position }
    player.health = player.maxHealth
    player.isAlive = true

    this.players.set(player.id, player)
    this.gameState.players.push(player)
    this.gameState.currentPlayers = this.players.size

    logger.info('Player added', { playerId: player.id, playerName: player.name })

    return player
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): void {
    const player = this.players.get(playerId)
    if (!player) return

    player.isAlive = false
    this.players.delete(playerId)
    
    // Update game state
    if (this.gameState) {
      this.gameState.players = this.gameState.players.filter(p => p.id !== playerId)
      this.gameState.currentPlayers = this.players.size
    }

    logger.info('Player removed', { playerId, playerName: player.name })
  }

  /**
   * Update player input
   */
  updatePlayerInput(playerId: string, input: PlayerInput): void {
    const player = this.players.get(playerId)
    if (!player || !player.isAlive) return

    player.input = input
    player.lastUpdate = Date.now()

    // Process input
    this.processPlayerInput(player)
  }

  /**
   * Process player input and update player state
   */
  private processPlayerInput(player: Player): void {
    const deltaTime = this.updateInterval / 1000 // Convert to seconds

    // Calculate movement
    let moveVector = { x: 0, y: 0, z: 0 }
    
    if (player.input.moveForward) moveVector.z -= 1
    if (player.input.moveBackward) moveVector.z += 1
    if (player.input.moveLeft) moveVector.x -= 1
    if (player.input.moveRight) moveVector.x += 1

    // Apply movement speed
    const moveSpeed = player.input.sprint ? 8 : 5 // units per second
    moveVector.x *= moveSpeed * deltaTime
    moveVector.z *= moveSpeed * deltaTime

    // Update position
    player.position.x += moveVector.x
    player.position.z += moveVector.z

    // Update rotation based on aim
    if (player.input.aim.x !== 0 || player.input.aim.y !== 0) {
      player.rotation.y = Math.atan2(player.input.aim.y, player.input.aim.x)
    }

    // Handle jumping
    if (player.input.jump && player.position.y === 0) {
      player.velocity.y = 10 // Jump velocity
      audioManager.playSoundEffect('jump', { volume: 0.5, spatial: true, position: player.position })
    }

    // Handle crouching/prone
    if (player.input.crouch) {
      // Reduce player size and movement speed
      // Implementation depends on game specifics
    }

    // Handle weapon actions
    if (player.input.fire) {
      this.fireWeapon(player)
    }

    if (player.input.reload) {
      this.reloadWeapon(player)
    }

    if (player.input.switchWeapon !== 0) {
      this.switchWeapon(player, player.input.switchWeapon)
    }
  }

  /**
   * Fire player's weapon
   */
  private fireWeapon(player: Player): void {
    if (player.weapons.length === 0) return

    const activeWeapon = player.weapons.find(w => w.ammo > 0)
    if (!activeWeapon) return

    // Check fire rate
    const now = Date.now()
    const lastFireTime = player.lastUpdate || 0
    
    if (now - lastFireTime < (1000 / activeWeapon.fireRate)) return

    // Fire weapon
    activeWeapon.ammo--
    
    // Calculate bullet trajectory
    const bulletDirection = {
      x: Math.sin(player.rotation.y),
      y: 0,
      z: Math.cos(player.rotation.y)
    }

    // Play sound effect
    audioManager.playSoundEffect(activeWeapon.soundEffects.fire, {
      volume: 0.7,
      spatial: true,
      position: player.position
    })

    // Apply recoil
    player.velocity.x += bulletDirection.x * activeWeapon.recoil.x
    player.velocity.z += bulletDirection.z * activeWeapon.recoil.z

    // Check for hit
    this.checkWeaponHit(player, bulletDirection, activeWeapon)

    logger.debug('Weapon fired', { 
      playerId: player.id, 
      weaponId: activeWeapon.id, 
      ammo: activeWeapon.ammo 
    })
  }

  /**
   * Reload player's weapon
   */
  private reloadWeapon(player: Player): void {
    const activeWeapon = player.weapons.find(w => w.ammo < w.maxAmmo)
    if (!activeWeapon) return

    // Play reload sound
    audioManager.playSoundEffect(activeWeapon.soundEffects.reload, {
      volume: 0.6,
      spatial: true,
      position: player.position
    })

    // Reload weapon (async operation)
    setTimeout(() => {
      activeWeapon.ammo = activeWeapon.maxAmmo
      logger.debug('Weapon reloaded', { 
        playerId: player.id, 
        weaponId: activeWeapon.id 
      })
    }, activeWeapon.reloadTime)
  }

  /**
   * Switch player's weapon
   */
  private switchWeapon(player: Player, direction: number): void {
    if (player.weapons.length <= 1) return

    const currentIndex = player.weapons.findIndex(w => w.ammo > 0)
    if (currentIndex === -1) return

    const newIndex = (currentIndex + direction + player.weapons.length) % player.weapons.length
    // Play weapon switch sound
    audioManager.playSoundEffect('weapon_switch', {
      volume: 0.4,
      spatial: true,
      position: player.position
    })

    logger.debug('Weapon switched', { 
      playerId: player.id, 
      fromWeapon: player.weapons[currentIndex]?.id, 
      toWeapon: player.weapons[newIndex]?.id 
    })
  }

  /**
   * Check if weapon hit anything
   */
  private checkWeaponHit(player: Player, direction: { x: number; y: number; z: number }, weapon: Weapon): void {
    // Simple raycast for demonstration
    const maxRange = weapon.range
    const stepSize = 1
    
    for (let distance = 0; distance < maxRange; distance += stepSize) {
      const checkPoint = {
        x: player.position.x + direction.x * distance,
        y: player.position.y + direction.y * distance,
        z: player.position.z + direction.z * distance
      }

      // Check collision with other players
      for (const [id, otherPlayer] of this.players.entries()) {
        if (id !== player.id && otherPlayer.isAlive) {
          const collision = this.collisionDetector.checkSphereCollision(
            checkPoint,
            0.5, // Bullet radius
            otherPlayer.position,
            1 // Player radius
          )

          if (collision.hasCollision) {
            // Hit detected
            this.applyDamage(otherPlayer, weapon.damage)
            
            // Play hit sound
            audioManager.playSoundEffect(weapon.soundEffects.hit, {
              volume: 0.8,
              spatial: true,
              position: otherPlayer.position
            })

            logger.debug('Weapon hit', { 
              attackerId: player.id, 
              targetId: otherPlayer.id, 
              damage: weapon.damage 
            })

            return
          }
        }
      }

      // Check collision with obstacles
      if (this.gameState && this.gameState.map) {
        for (const obstacle of this.gameState.map.obstacles) {
          const collision = this.collisionDetector.checkBoxCollision(
            checkPoint,
            { width: 0.5, height: 0.5, depth: 0.5 },
            obstacle.position,
            obstacle.size
          )

          if (collision.hasCollision) {
            // Hit obstacle
            if (obstacle.isDestructible) {
              obstacle.health -= weapon.damage
            
              if (obstacle.health <= 0) {
                // Remove obstacle
                const index = this.gameState.map.obstacles.indexOf(obstacle)
                if (index > -1) {
                  this.gameState.map.obstacles.splice(index, 1)
                }
                
                // Play destruction sound
                audioManager.playSoundEffect('obstacle_destroy', {
                  volume: 0.9,
                  spatial: true,
                  position: obstacle.position
                })
              }
            }

            return
          }
        }
      }
    }
  }

  /**
   * Apply damage to a player
   */
  private applyDamage(player: Player, damage: number): void {
    // Calculate damage after armor
    const actualDamage = Math.max(1, damage - player.armor)
    player.health -= actualDamage
    player.stats.damage += actualDamage

    // Check if player is dead
    if (player.health <= 0) {
      player.health = 0
      player.isAlive = false
      player.stats.deaths++
      
      // Play death sound
      audioManager.playSoundEffect('player_death', {
        volume: 1.0,
        spatial: true,
        position: player.position
      })

      logger.info('Player died', { 
        playerId: player.id, 
        playerName: player.name, 
        damage: actualDamage 
      })

      // Check for game over
      this.checkGameOver()
    }
  }

  /**
   * Check if game is over
   */
  private checkGameOver(): void {
    if (!this.gameState) return

    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive)
    
    if (alivePlayers.length <= 1) {
      // Game over
      this.gameState.status = 'finished'
      this.gameState.endTime = new Date()
      
      if (alivePlayers.length === 1) {
        this.gameState.winner = alivePlayers[0]
        if (this.gameState.winner) {
          this.gameState.winner.stats.kills++
          this.gameState.winner.stats.xp += 1000 // Winner bonus
        }
      }

      // Stop game loop
      this.isRunning = false

      // Play game over sound
      audioManager.playSoundEffect('game_over', { volume: 0.9 })

      logger.info('Game over', { 
        gameId: this.gameState.id, 
        winner: this.gameState.winner?.name,
        duration: this.gameState.endTime && this.gameState.startTime 
          ? this.gameState.endTime.getTime() - this.gameState.startTime.getTime() 
          : 0
      })
    }
  }

  /**
   * Find available spawn point
   */
  private findAvailableSpawnPoint(): SpawnPoint {
    if (!this.gameState) {
      throw new Error('Game not initialized')
    }

    const availableSpawnPoints = this.gameState.map.spawnPoints.filter(sp => sp.isActive)
    
    if (availableSpawnPoints.length === 0) {
      // Fallback to any spawn point
      const fallbackSpawnPoint = this.gameState.map.spawnPoints[0]
      if (!fallbackSpawnPoint) {
        throw new Error('No spawn points available')
      }
      return fallbackSpawnPoint
    }

    // Find spawn point farthest from other players
    let bestSpawnPoint: SpawnPoint | undefined = undefined
    let maxDistance = 0

    for (const spawnPoint of availableSpawnPoints) {
      let minDistance = Infinity

      for (const player of this.players.values()) {
        if (player.isAlive) {
          const distance = this.calculateDistance(spawnPoint.position, player.position)
          minDistance = Math.min(minDistance, distance)
        }
      }

      if (minDistance > maxDistance) {
        maxDistance = minDistance
        bestSpawnPoint = spawnPoint
      }
    }

    // Ensure we always return a valid spawn point
    if (bestSpawnPoint) {
      return bestSpawnPoint
    }
    
    // Fallback to first available spawn point
    const fallbackSpawnPoint = availableSpawnPoints[0]
    if (!fallbackSpawnPoint) {
      throw new Error('No spawn points available')
    }
    return fallbackSpawnPoint
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const dz = pos2.z - pos1.z
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Generate game map
   */
  private generateGameMap(size: 'small' | 'medium' | 'large'): GameMap {
    const mapSizes = {
      small: { width: 1000, height: 1000, depth: 100 },
      medium: { width: 2000, height: 2000, depth: 200 },
      large: { width: 4000, height: 4000, depth: 300 }
    }

    const mapSize = mapSizes[size]
    
    // Generate spawn points
    const spawnPoints: SpawnPoint[] = []
    const spawnPointCount = size === 'small' ? 20 : size === 'medium' ? 40 : 60
    
    for (let i = 0; i < spawnPointCount; i++) {
      spawnPoints.push({
        id: `spawn_${i}`,
        position: {
          x: Math.random() * mapSize.width,
          y: 0,
          z: Math.random() * mapSize.depth
        },
        isActive: true
      })
    }

    // Generate obstacles
    const obstacles: Obstacle[] = []
    const obstacleCount = size === 'small' ? 30 : size === 'medium' ? 60 : 100
    
    for (let i = 0; i < obstacleCount; i++) {
      obstacles.push({
        id: `obstacle_${i}`,
        type: ['building', 'rock', 'tree'][Math.floor(Math.random() * 3)] as any,
        position: {
          x: Math.random() * mapSize.width,
          y: 0,
          z: Math.random() * mapSize.depth
        },
        size: {
          width: 20 + Math.random() * 40,
          height: 10 + Math.random() * 20,
          depth: 20 + Math.random() * 40
        },
        health: 100,
        isDestructible: Math.random() > 0.5
      })
    }

    // Generate loot
    const loot: LootItem[] = []
    const lootCount = size === 'small' ? 50 : size === 'medium' ? 100 : 200
    
    for (let i = 0; i < lootCount; i++) {
      loot.push({
        id: `loot_${i}`,
        type: ['weapon', 'ammo', 'health', 'armor', 'utility'][Math.floor(Math.random() * 5)] as any,
        position: {
          x: Math.random() * mapSize.width,
          y: 0,
          z: Math.random() * mapSize.depth
        },
        rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 5)] as any,
        properties: this.generateLootProperties()
      })
    }

    // Generate safe zone
    const safeZone: SafeZone = {
      center: { x: mapSize.width / 2, y: 0, z: mapSize.depth / 2 },
      radius: mapSize.width / 4,
      damage: 0,
      shrinkRate: 0.1,
      nextShrinkTime: Date.now() + 60000 // Start shrinking after 1 minute
    }

    // Generate storm
    const storm: Storm = {
      center: { x: mapSize.width / 2, y: 0, z: mapSize.depth / 2 },
      radius: mapSize.width / 2,
      damage: 1,
      speed: 0.5,
      direction: 0
    }

    return {
      id: `map_${Date.now()}`,
      name: `GLXY Map #${Math.floor(Math.random() * 1000)}`,
      size: mapSize,
      spawnPoints,
      obstacles,
      loot,
      safeZone,
      storm
    }
  }

  /**
   * Generate loot properties
   */
  private generateLootProperties(): Record<string, any> {
    const lootTypes = {
      weapon: () => ({
        damage: 10 + Math.random() * 40,
        range: 50 + Math.random() * 100,
        fireRate: 5 + Math.random() * 10,
        ammo: 20 + Math.floor(Math.random() * 30),
        maxAmmo: 50 + Math.floor(Math.random() * 50),
        reloadTime: 1000 + Math.random() * 2000,
        recoil: { x: Math.random() * 2 - 1, y: 0, z: Math.random() * 2 - 1 }
      }),
      ammo: () => ({
        count: 10 + Math.floor(Math.random() * 40),
        caliber: ['9mm', '.45ACP', '5.56mm'][Math.floor(Math.random() * 3)]
      }),
      health: () => ({
        heal: 20 + Math.random() * 30,
        type: ['medkit', 'bandage', 'painkillers'][Math.floor(Math.random() * 3)]
      }),
      armor: () => ({
        protection: 5 + Math.random() * 15,
        durability: 50 + Math.random() * 50,
        weight: 5 + Math.random() * 10
      }),
      utility: () => ({
        effect: ['speed_boost', 'shield', 'invisibility'][Math.floor(Math.random() * 3)],
        duration: 10000 + Math.random() * 20000
      })
    }

    const lootType = ['weapon', 'ammo', 'health', 'armor', 'utility'][Math.floor(Math.random() * 5)] as keyof typeof lootTypes
    return lootTypes[lootType]()
  }

  /**
   * Start game loop
   */
  private startGameLoop(): void {
    this.lastUpdateTime = Date.now()
    
    const gameLoop = () => {
      if (!this.isRunning) return

      const now = Date.now()
      const deltaTime = now - this.lastUpdateTime

      if (deltaTime >= this.updateInterval) {
        this.update(deltaTime / 1000)
        this.lastUpdateTime = now
      }

      requestAnimationFrame(gameLoop)
    }

    requestAnimationFrame(gameLoop)
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    if (!this.gameState || this.gameState.status !== 'playing') return

    // Update physics
    this.physics.update(this.players, deltaTime, this.gameState.map)

    // Update storm
    this.updateStorm(deltaTime)

    // Update safe zone
    this.updateSafeZone(deltaTime)

    // Check player collisions
    this.checkPlayerCollisions()

    // Update player stats
    this.updatePlayerStats(deltaTime)
  }

  /**
   * Update storm
   */
  private updateStorm(deltaTime: number): void {
    if (!this.gameState) return

    const storm = this.gameState.map.storm
    
    // Move storm
    storm.radius -= storm.speed * deltaTime
    storm.radius = Math.max(50, storm.radius) // Minimum radius

    // Apply storm damage to players outside safe zone
    for (const player of this.players.values()) {
      if (!player.isAlive) continue

      const distanceToStormCenter = this.calculateDistance(player.position, storm.center)
      const distanceToSafeZone = this.calculateDistance(player.position, this.gameState.map.safeZone.center)
      
      if (distanceToStormCenter < storm.radius && distanceToSafeZone > this.gameState.map.safeZone.radius) {
        // Player is in storm but outside safe zone
        this.applyDamage(player, storm.damage * deltaTime)
      }
    }
  }

  /**
   * Update safe zone
   */
  private updateSafeZone(deltaTime: number): void {
    if (!this.gameState) return

    const safeZone = this.gameState.map.safeZone
    const now = Date.now()
    
    if (now >= safeZone.nextShrinkTime) {
      safeZone.radius -= safeZone.shrinkRate * deltaTime
      safeZone.radius = Math.max(50, safeZone.radius) // Minimum radius
      safeZone.nextShrinkTime = now + 10000 // Shrink every 10 seconds
    }
  }

  /**
   * Check player collisions
   */
  private checkPlayerCollisions(): void {
    const playerArray = Array.from(this.players.values())
    
    for (let i = 0; i < playerArray.length; i++) {
      for (let j = i + 1; j < playerArray.length; j++) {
        const player1 = playerArray[i]
        const player2 = playerArray[j]
        
        if (!player1 || !player2 || !player1.isAlive || !player2.isAlive) continue
        
        const collision = this.collisionDetector.checkSphereCollision(
          player1.position,
          1, // Player radius
          player2.position,
          1
        )
        
        if (collision.hasCollision) {
          // Simple collision response
          const direction = {
            x: player2.position.x - player1.position.x,
            z: player2.position.z - player1.position.z
          }
          
          const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z)
          const normal = {
            x: direction.x / distance,
            z: direction.z / distance
          }
          
          // Push players apart
          const pushForce = 0.5
          player1.position.x -= normal.x * pushForce
          player1.position.z -= normal.z * pushForce
          player2.position.x += normal.x * pushForce
          player2.position.z += normal.z * pushForce
        }
      }
    }
  }

  /**
   * Update player stats
   */
  private updatePlayerStats(deltaTime: number): void {
    for (const player of this.players.values()) {
      if (!player.isAlive) continue
      
      player.stats.survivalTime += deltaTime
    }
  }

  /**
   * Get current game state
   */
  getGameState(): GameState | null {
    return this.gameState
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return Array.from(this.players.values())
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId)
  }

  /**
   * Stop the game
   */
  stopGame(): void {
    this.isRunning = false
    
    if (this.gameState) {
      this.gameState.status = 'finished'
      this.gameState.endTime = new Date()
    }

    logger.info('Game stopped', { gameId: this.gameState?.id })
  }
}

/**
 * Physics Engine
 * Handles physics calculations for the game
 */
class PhysicsEngine {
  private gravity: number = -9.8
  private friction: number = 0.8

  /**
   * Update physics for all players
   */
  update(players: Map<string, Player>, deltaTime: number, gameMap: GameMap): void {
    for (const player of players.values()) {
      if (!player.isAlive) continue

      // Apply gravity
      player.velocity.y += this.gravity * deltaTime

      // Apply friction
      player.velocity.x *= (1 - this.friction * deltaTime)
      player.velocity.z *= (1 - this.friction * deltaTime)

      // Update position
      player.position.x += player.velocity.x * deltaTime
      player.position.y += player.velocity.y * deltaTime
      player.position.z += player.velocity.z * deltaTime

      // Ground collision
      if (player.position.y < 0) {
        player.position.y = 0
        player.velocity.y = 0
      }

      // Map boundaries
      if (player.position.x < 0) {
        player.position.x = 0
        player.velocity.x = 0
      }
      if (player.position.x > gameMap.size.width) {
        player.position.x = gameMap.size.width
        player.velocity.x = 0
      }
      if (player.position.z < 0) {
        player.position.z = 0
        player.velocity.z = 0
      }
      if (player.position.z > gameMap.size.depth) {
        player.position.z = gameMap.size.depth
        player.velocity.z = 0
      }
    }
  }
}

/**
 * Collision Detector
 * Handles collision detection between game objects
 */
class CollisionDetector {
  /**
   * Check sphere collision
   */
  checkSphereCollision(
    pos1: { x: number; y: number; z: number },
    radius1: number,
    pos2: { x: number; y: number; z: number },
    radius2: number
  ): CollisionResult {
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const dz = pos2.z - pos1.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const combinedRadius = radius1 + radius2

    return {
      hasCollision: distance < combinedRadius,
      normal: {
        x: dx / distance,
        y: dy / distance,
        z: dz / distance
      },
      penetration: combinedRadius - distance,
      damage: 0
    }
  }

  /**
   * Check box collision
   */
  checkBoxCollision(
    pos1: { x: number; y: number; z: number },
    size1: { width: number; height: number; depth: number },
    pos2: { x: number; y: number; z: number },
    size2: { width: number; height: number; depth: number }
  ): CollisionResult {
    const halfWidth1 = size1.width / 2
    const halfHeight1 = size1.height / 2
    const halfDepth1 = size1.depth / 2
    const halfWidth2 = size2.width / 2
    const halfHeight2 = size2.height / 2
    const halfDepth2 = size2.depth / 2

    const dx = Math.abs(pos1.x - pos2.x)
    const dy = Math.abs(pos1.y - pos2.y)
    const dz = Math.abs(pos1.z - pos2.z)

    const overlapX = halfWidth1 + halfWidth2 - dx
    const overlapY = halfHeight1 + halfHeight2 - dy
    const overlapZ = halfDepth1 + halfDepth2 - dz

    return {
      hasCollision: overlapX > 0 && overlapY > 0 && overlapZ > 0,
      penetration: Math.min(overlapX, overlapY, overlapZ),
      damage: 0
    }
  }
}

// Singleton instance
export const gameEngine = new GameEngine()

// Export types for use in other modules