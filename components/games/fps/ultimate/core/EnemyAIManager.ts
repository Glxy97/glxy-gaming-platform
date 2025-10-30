// NO @ts-nocheck - Type-safe enemy AI management
'use client'

import * as THREE from 'three'
import { AIController } from '../ai/AIController'
import type { AIShootData } from '../ai/AIController'
import { AIState } from '../ai/data/AIData'
import { PhysicsEngine } from '../physics/PhysicsEngine'
import { CollisionLayer } from '../physics/data/PhysicsData'
import { EffectsManager } from '../effects/EffectsManager'
import { AudioManager } from '../audio/AudioManager'
import { ModelManager } from './ModelManager'
import { BehaviorTreeManager } from '../ai/BehaviorTrees'
import { PathfindingManager } from '../ai/PathfindingSystem'
import { HitboxSystemManager } from '../systems/HitboxSystem'
import { SpatialHashGrid, BoundingBoxSystem, SpawnZoneSystem, type SpatialObject } from './OptimizationModules'
import { selectEnemyClassByDifficulty, getEnemyConfig, EnemyClass } from '../ai/EnemyClasses'
import { createHealthBar, updateHealthBar } from './FPSFeatures'
import type { UltimateEnemy, UltimatePlayerStats } from './UltimateFPSEngineV4'

/**
 * 🤖 ENEMY AI MANAGER
 *
 * Centralized enemy AI management system.
 * Extracted from UltimateFPSEngineV4 (~810 LOC)
 *
 * Responsibilities:
 * - Enemy spawning with LOD optimization
 * - AI behavior and pathfinding
 * - Enemy health and death management
 * - Combat AI (shooting, behavior trees)
 * - Performance optimization (spatial grid, bounding boxes)
 */
export class EnemyAIManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private enemies: UltimateEnemy[] = []

  // Dependencies
  private physicsEngine: PhysicsEngine
  private effectsManager: EffectsManager
  private audioManager: AudioManager
  private modelManager: ModelManager
  private behaviorTreeManager: BehaviorTreeManager
  private pathfindingManager: PathfindingManager
  private hitboxManager: HitboxSystemManager

  // Optimization Systems
  private spatialGrid: SpatialHashGrid
  private boundingBoxSystem: BoundingBoxSystem
  private spawnZoneSystem: SpawnZoneSystem

  // Player Reference
  private player: {
    mesh: THREE.Group
    position: THREE.Vector3
    stats: UltimatePlayerStats
  }

  // Spawn Control
  private lastEnemySpawn: number = 0
  private isSpawningEnemy: boolean = false
  private maxEnemies: number = 10
  private spawnInterval: number = 3000 // ms
  private currentDifficulty: number = 0.5

  // Callbacks
  private onPlayerHit: (damage: number, direction?: THREE.Vector3) => void
  private onEnemyKilled: (enemy: UltimateEnemy, killData: any) => void

  constructor(deps: {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    player: { mesh: THREE.Group; position: THREE.Vector3; stats: UltimatePlayerStats }
    physicsEngine: PhysicsEngine
    effectsManager: EffectsManager
    audioManager: AudioManager
    modelManager: ModelManager
    behaviorTreeManager: BehaviorTreeManager
    pathfindingManager: PathfindingManager
    hitboxManager: HitboxSystemManager
    spatialGrid: SpatialHashGrid
    boundingBoxSystem: BoundingBoxSystem
    spawnZoneSystem: SpawnZoneSystem
    onPlayerHit: (damage: number, direction?: THREE.Vector3) => void
    onEnemyKilled: (enemy: UltimateEnemy, killData: any) => void
  }) {
    this.scene = deps.scene
    this.camera = deps.camera
    this.player = deps.player
    this.physicsEngine = deps.physicsEngine
    this.effectsManager = deps.effectsManager
    this.audioManager = deps.audioManager
    this.modelManager = deps.modelManager
    this.behaviorTreeManager = deps.behaviorTreeManager
    this.pathfindingManager = deps.pathfindingManager
    this.hitboxManager = deps.hitboxManager
    this.spatialGrid = deps.spatialGrid
    this.boundingBoxSystem = deps.boundingBoxSystem
    this.spawnZoneSystem = deps.spawnZoneSystem
    this.onPlayerHit = deps.onPlayerHit
    this.onEnemyKilled = deps.onEnemyKilled
  }

  /**
   * Get all enemies
   */
  public getEnemies(): UltimateEnemy[] {
    return this.enemies
  }

  /**
   * Set difficulty level (0-1)
   */
  public setDifficulty(difficulty: number): void {
    this.currentDifficulty = Math.max(0, Math.min(1, difficulty))
  }

  /**
   * Set max enemies
   */
  public setMaxEnemies(max: number): void {
    this.maxEnemies = max
  }

  /**
   * Set spawn interval
   */
  public setSpawnInterval(interval: number): void {
    this.spawnInterval = interval
  }

  /**
   * Update all enemies (called every frame)
   */
  public update(deltaTime: number): void {
    this.updateEnemies(deltaTime)
    this.updateEnemyHealthBars()
  }

  /**
   * Auto-spawn enemies if needed
   */
  public autoSpawn(): void {
    if (!this.isSpawningEnemy && Date.now() - this.lastEnemySpawn > this.spawnInterval) {
      if (this.enemies.length < this.maxEnemies) {
        this.isSpawningEnemy = true
        this.spawnEnemy()
          .then(() => {
            this.lastEnemySpawn = Date.now()
            this.isSpawningEnemy = false
          })
          .catch((err) => {
            console.error('Spawn enemy error:', err)
            this.isSpawningEnemy = false
          })
      }
    }
  }

  /**
   * 🤖 Update All Enemies
   */
  private updateEnemies(deltaTime: number): void {
    const MAX_UPDATE_DISTANCE = 100
    const UPDATE_RATE_NEAR = 1.0    // Full update
    const UPDATE_RATE_FAR = 0.5     // Half update rate

    for (const enemy of this.enemies) {
      const distance = enemy.mesh.position.distanceTo(this.player.position)

      // LOD: Skip updates for very far enemies
      if (distance > MAX_UPDATE_DISTANCE) continue

      // LOD: Update rate based on distance
      const updateRate = distance < 50 ? UPDATE_RATE_NEAR : UPDATE_RATE_FAR

      // AI Update
      enemy.aiController.update(deltaTime * updateRate)

      // Check if stunned
      if ((enemy as any).stunned && Date.now() < (enemy as any).stunnedUntil) {
        continue // Skip movement if stunned
      }

      // Behavior Tree AI (if available)
      const action = this.behaviorTreeManager.evaluate(enemy, this.player.mesh, distance)

      if (action) {
        this.executeBehaviorAction(enemy, action, deltaTime * updateRate)
      } else {
        // Pathfinding-based Movement
        this.updateEnemyPathfinding(enemy, deltaTime * updateRate, distance)

        // Face player (only when close)
        if (distance <= 50) {
          enemy.mesh.lookAt(this.player.position)
        }

        // AI Shooting (only when close)
        if (distance <= 30) {
          const currentState = enemy.aiController.getCurrentState()
          if (currentState === AIState.ENGAGING) {
            enemy.aiController.shootAtPlayer()
          }
        }
      }

      // Spatial Grid Update
      this.spatialGrid.update({
        id: enemy.id,
        position: enemy.mesh.position,
        radius: 1.5,
        type: 'enemy',
        data: enemy
      })

      // Bounding Box Update (only when close)
      if (distance <= 50) {
        this.boundingBoxSystem.updateBox(enemy.id, enemy.mesh)
      }

      // Player Position for AI
      enemy.aiController.setPlayerPosition(this.player.position)
    }
  }

  /**
   * 🧭 Update Enemy Pathfinding Movement
   */
  private updateEnemyPathfinding(enemy: UltimateEnemy, deltaTime: number, distanceToPlayer: number): void {
    const PATH_UPDATE_INTERVAL = 2.0
    const PATH_NODE_REACH_DISTANCE = 2.0
    const MOVE_SPEED = 2.0

    const now = Date.now() / 1000

    // Initialize pathfinding properties
    if (!enemy.lastPathUpdateTime) {
      enemy.lastPathUpdateTime = 0
      enemy.pathIndex = 0
    }

    // Update path periodically or if no path exists
    const needsNewPath =
      !enemy.currentPath ||
      enemy.currentPath.length === 0 ||
      (now - (enemy.lastPathUpdateTime || 0)) > PATH_UPDATE_INTERVAL

    if (needsNewPath) {
      const path = this.pathfindingManager.findPath(
        enemy.mesh.position,
        this.player.position
      )

      if (path.length > 0) {
        enemy.currentPath = path
        enemy.pathIndex = 0
        enemy.lastPathUpdateTime = now
      } else {
        enemy.currentPath = undefined
      }
    }

    // Follow current path
    if (enemy.currentPath && enemy.currentPath.length > 0 && enemy.pathIndex !== undefined) {
      const targetWaypoint = enemy.currentPath[enemy.pathIndex]
      const direction = new THREE.Vector3()
        .subVectors(targetWaypoint, enemy.mesh.position)

      const distanceToWaypoint = direction.length()
      direction.normalize()

      // Move towards waypoint
      enemy.mesh.position.add(direction.multiplyScalar(MOVE_SPEED * deltaTime))

      // Check if waypoint reached
      if (distanceToWaypoint < PATH_NODE_REACH_DISTANCE) {
        enemy.pathIndex++

        if (enemy.pathIndex >= enemy.currentPath.length) {
          enemy.currentPath = undefined
          enemy.pathIndex = 0
        }
      }
    } else {
      // Fallback: Direct movement towards player
      const direction = new THREE.Vector3()
        .subVectors(this.player.position, enemy.mesh.position)
        .normalize()

      enemy.mesh.position.add(direction.multiplyScalar(MOVE_SPEED * deltaTime))
    }
  }

  /**
   * 🆕 Execute Behavior Action from Behavior Tree
   */
  private executeBehaviorAction(enemy: UltimateEnemy, action: any, deltaTime: number): void {
    if (!action) return

    const distance = enemy.mesh.position.distanceTo(this.player.position)

    switch (action.type) {
      case 'move_to':
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          enemy.mesh.position.add(direction.multiplyScalar(2 * deltaTime))
          enemy.mesh.lookAt(action.target)
        }
        break

      case 'rush':
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          enemy.mesh.position.add(direction.multiplyScalar(4 * deltaTime))
          enemy.mesh.lookAt(action.target)
        }
        break

      case 'retreat':
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          enemy.mesh.position.add(direction.multiplyScalar(3 * deltaTime))
        }
        break

      case 'shoot':
        if (distance <= 50) {
          const currentState = enemy.aiController.getCurrentState()
          if (currentState === AIState.ENGAGING) {
            enemy.aiController.shootAtPlayer()
          }
        }
        break

      case 'take_cover':
      case 'flank':
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          const speed = action.type === 'flank' ? 3 : 2.5
          enemy.mesh.position.add(direction.multiplyScalar(speed * deltaTime))
        }
        break

      case 'hold_position':
        enemy.mesh.lookAt(this.player.position)
        break

      case 'suppress_fire':
        if (distance <= 40) {
          enemy.aiController.shootAtPlayer()
        }
        break

      case 'aim_laser':
        enemy.mesh.lookAt(this.player.position)
        if (distance >= 40 && distance <= 100) {
          enemy.aiController.shootAtPlayer()
        }
        break

      case 'wait':
        // Do nothing
        break

      default:
        // Fallback: Move towards player
        const direction = new THREE.Vector3()
          .subVectors(this.player.position, enemy.mesh.position)
          .normalize()
        enemy.mesh.position.add(direction.multiplyScalar(2 * deltaTime))
        enemy.mesh.lookAt(this.player.position)
    }
  }

  /**
   * 🤖 Spawn Enemy
   */
  public async spawnEnemy(): Promise<void> {
    if (this.enemies.length >= this.maxEnemies) return

    // Get spawn position using SpawnZoneSystem
    let spawnPos: THREE.Vector3
    const spawnZonePos = this.spawnZoneSystem.getSpawnPosition(
      this.player.position,
      []
    )

    if (spawnZonePos) {
      spawnPos = new THREE.Vector3(
        spawnZonePos.x + (Math.random() - 0.5) * 10,
        0,
        spawnZonePos.z + (Math.random() - 0.5) * 10
      )
    } else {
      // Fallback: Random spawn position (far from player)
      do {
        spawnPos = new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          0,
          (Math.random() - 0.5) * 80
        )
      } while (spawnPos.distanceTo(this.player.position) < 20)
    }

    const enemyId = `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      // Load enemy model with LOD optimization
      const distance = spawnPos.distanceTo(this.player.position)
      const enemyModel = await this.modelManager.loadEnemyCharacter('tactical_operator_optimized', distance)
      const enemyInstance = enemyModel.clone()

      // Scale calculation
      const bbox = new THREE.Box3().setFromObject(enemyInstance)
      const size = new THREE.Vector3()
      bbox.getSize(size)

      const targetHeight = 1.7
      let scale = targetHeight / size.y
      scale = Math.max(0.08, Math.min(0.15, scale))

      enemyInstance.scale.set(scale, scale, scale)

      // Ground positioning
      const scaledBbox = new THREE.Box3().setFromObject(enemyInstance)
      const groundOffset = -scaledBbox.min.y

      // Hide container meshes
      enemyInstance.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const meshBbox = new THREE.Box3().setFromObject(mesh)
          const meshSize = new THREE.Vector3()
          meshBbox.getSize(meshSize)

          const maxDimension = Math.max(meshSize.x, meshSize.y, meshSize.z)
          if (maxDimension > 5) {
            mesh.visible = false
            return
          }

          mesh.castShadow = true
          mesh.receiveShadow = true
        }
      })

      const enemyGroup = new THREE.Group()
      enemyGroup.add(enemyInstance)
      enemyGroup.position.set(spawnPos.x, groundOffset, spawnPos.z)
      enemyGroup.userData = { type: 'ENEMY', id: enemyId }
      this.scene.add(enemyGroup)

      // Select enemy class based on difficulty
      const enemyClass = selectEnemyClassByDifficulty(this.currentDifficulty)
      const enemyConfig = getEnemyConfig(enemyClass)

      // Create AI controller
      const aiController = new AIController('aggressive_assault', 'regular', enemyGroup)
      aiController.setScene(this.scene)
      aiController.setPlayerPosition(this.player.position)

      const enemy: UltimateEnemy = {
        id: enemyGroup.userData.id,
        mesh: enemyGroup,
        aiController: aiController,
        physicsObject: null,
        health: enemyConfig.health,
        maxHealth: enemyConfig.maxHealth,
        healthBar: undefined
      }

      // Store enemy class
      enemyGroup.userData.enemyClass = enemyClass
      enemyGroup.userData.enemyConfig = enemyConfig

      // Create health bar
      const healthBar = createHealthBar(enemy.maxHealth)
      enemyGroup.add(healthBar)
      enemy.healthBar = healthBar
      updateHealthBar(healthBar, enemy.health, enemy.maxHealth)

      // Register hitboxes
      this.hitboxManager.registerCharacter(enemy.id, enemyGroup)

      // AI Shoot Event
      aiController.onShoot((shootData) => {
        this.handleAIShoot(enemy, shootData)
      })

      // AI Death Event
      aiController.onDeath(() => {
        this.handleEnemyDeath(enemy)
      })

      this.enemies.push(enemy)

      // Spatial Grid
      this.spatialGrid.insert({
        id: enemy.id,
        position: new THREE.Vector3(spawnPos.x, groundOffset, spawnPos.z),
        radius: 1.5,
        type: 'enemy',
        data: enemy
      })

      // Bounding Box
      this.boundingBoxSystem.createBox(enemy.id, enemyInstance)

      // Play spawn sound
      this.audioManager?.playSound('enemy_spawn', enemyGroup.position)
    } catch (error) {
      console.error('Failed to spawn enemy:', error)
    }
  }

  /**
   * 💀 Handle Enemy Death
   */
  public handleEnemyDeath(enemy: UltimateEnemy): void {
    // Remove from spatial grid
    const nearby = this.spatialGrid.getNearby(enemy.mesh.position, 5)
    const spatialObject = nearby.find(obj => obj.id === enemy.id)
    if (spatialObject) {
      this.spatialGrid.remove(spatialObject)
    }
    this.boundingBoxSystem.removeBox(enemy.id)

    // Hitbox unregister
    this.hitboxManager.unregisterCharacter(enemy.id)

    // Health bar cleanup
    if (enemy.healthBar) {
      enemy.mesh.remove(enemy.healthBar)
      enemy.healthBar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.geometry.dispose()
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose()
          }
        }
      })
    }

    // Animation mixer cleanup
    this.modelManager.removeAnimationMixer(`enemy-${enemy.id}`)
  }

  /**
   * 🔫 Handle AI Shoot
   */
  private handleAIShoot(enemy: UltimateEnemy, shootData: AIShootData): void {
    // Raycast to player
    const rayResult = this.physicsEngine.raycast(
      shootData.origin,
      shootData.direction,
      1000,
      [CollisionLayer.PLAYER]
    )

    if (rayResult.hit) {
      // Player hit
      const directionToPlayer = new THREE.Vector3()
        .subVectors(this.player.position, shootData.origin)
        .normalize()
      this.onPlayerHit(shootData.damage || 10, directionToPlayer)

      // Effects
      this.effectsManager.spawnBloodSplatter(
        rayResult.point,
        rayResult.normal || new THREE.Vector3(0, 1, 0)
      )
    }

    // Muzzle flash
    this.effectsManager.spawnMuzzleFlash(shootData.origin, shootData.direction)
    this.audioManager?.playSound('enemy_fire', shootData.origin)
  }

  /**
   * ❤️ Update Enemy Health Bars
   */
  private updateEnemyHealthBars(): void {
    for (const enemy of this.enemies) {
      if (enemy.healthBar) {
        enemy.healthBar.lookAt(this.camera.position)
        updateHealthBar(enemy.healthBar, enemy.health, enemy.maxHealth)
      }
    }
  }

  /**
   * 🎯 Damage Enemy
   */
  public damageEnemy(enemy: UltimateEnemy, damage: number): boolean {
    enemy.health -= damage

    if (enemy.healthBar) {
      updateHealthBar(enemy.healthBar, enemy.health, enemy.maxHealth)
    }

    if (enemy.health <= 0) {
      this.handleEnemyDeath(enemy)
      return true // Enemy killed
    }

    return false // Enemy still alive
  }

  /**
   * 🧹 Cleanup
   */
  public dispose(): void {
    // Remove all enemies
    for (const enemy of this.enemies) {
      this.handleEnemyDeath(enemy)
      this.scene.remove(enemy.mesh)
    }
    this.enemies = []
  }
}
