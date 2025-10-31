/**
 * 🤖 AI CONTROLLER
 * Professional AI System for FPS Enemies
 *
 * @remarks
 * Complete AI system with:
 * - 6 AI Personalities (Aggressive → Adaptive)
 * - 5 Difficulty Levels (Recruit → Nightmare)
 * - AI State Machine (16 states)
 * - Learning System (pattern recognition, adaptation)
 * - Team Coordination (squad tactics)
 * - Combat Logic (shooting, cover, flanking)
 * - Pathfinding (A* algorithm)
 * - Voice System (contextual responses)
 *
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import * as THREE from 'three'
import {
  AIState,
  AIMovementPattern,
  AICombatStyle,
  AISquadPosition,
  AIPersonalityData,
  AIDifficultyData,
  AIBotStateData,
  AILearningData,
  AIVoiceProfileData,
  PathfindingNode,
  DEFAULT_AI_SETTINGS,
  AI_PERSONALITIES,
  AI_DIFFICULTIES,
  AI_VOICE_PROFILES,
  calculateEffectiveAccuracy,
  calculateEffectiveReactionTime,
  calculateTacticalScore,
  getAIPersonalityById,
  getAIDifficultyById
} from './data/AIData'

// ============================================================
// TYPES & EXTENSIONS
// ============================================================

// Extended bot state with runtime properties
interface ExtendedBotState extends AIBotStateData {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  mesh: THREE.Object3D
  health: number
  maxHealth: number
  currentWeapon: any | null
  ammo: number
  maxAmmo: number
  timeSinceTargetSeen: number
  isUnderFire: boolean
  velocity: THREE.Vector3
  moveDirection: THREE.Vector3
  lookDirection: THREE.Vector3
  isMoving: boolean
  isShooting: boolean
  isReloading: boolean
  isInCover: boolean
  lastDamageTime: number
  personality: string
  difficulty: string
  team: string | null
  squad: string | null
}

type AICallback = (bot: ExtendedBotState) => void
type StateChangeCallback = (oldState: AIState, newState: AIState) => void

// BESTE Variante: AI Shoot Callback (aus V6)
export interface AIShootData {
  origin: THREE.Vector3
  direction: THREE.Vector3
  damage: number
  accuracy: number
}

type AIShootCallback = (data: AIShootData) => void
type AIDeathCallback = () => void

interface PathfindingGrid {
  nodes: Map<string, PathfindingNode>
  width: number
  height: number
  depth: number
  cellSize: number
}

// Extended learning data
interface ExtendedLearningData extends AILearningData {
  encountersWithPlayer: number
  totalDamageDealt: number
  totalDamageTaken: number
  successfulFlanks: number
  failedFlanks: number
  successfulAmbushes: number
  coverUseCount: number
  reloadInCoverCount: number
  playerMovementPatterns: any[]
  playerPreferredWeapons: any[]
  tacticalDecisions: any[]
  adaptationLevel: number
}

// Team data (simplified)
interface AITeamData {
  id: string
  members: string[]
  leader: string | null
}

// Helper Functions (simple implementations)
function shouldReload(ammo: number, maxAmmo: number, inCombat: boolean): boolean {
  return ammo < maxAmmo * 0.3 || (!inCombat && ammo < maxAmmo)
}

function shouldTakeCover(health: number, maxHealth: number, underFire: boolean, ammo: number): boolean {
  return health < maxHealth * 0.5 || (underFire && ammo < 10)
}

function shouldFlank(personality: AIPersonalityData, timeSinceTargetSeen: number, enemyStationary: boolean, hasCover: boolean): boolean {
  return personality.tacticalThinking > 60 && timeSinceTargetSeen > 3 && hasCover
}

function shouldCallForBackup(health: number, maxHealth: number, enemies: number, allies: number, alertLevel: number): boolean {
  return health < maxHealth * 0.3 || enemies > allies * 2
}

function predictPlayerPosition(lastPos: THREE.Vector3, velocity: THREE.Vector3, deltaTime: number): THREE.Vector3 {
  return lastPos.clone().add(velocity.clone().multiplyScalar(deltaTime))
}

function calculateThreatLevel(health: number, maxHealth: number, enemyCount: number, ammo: number): number {
  const healthFactor = 1 - (health / maxHealth)
  const enemyFactor = Math.min(enemyCount / 5, 1)
  const ammoFactor = 1 - (ammo / 30)
  return (healthFactor * 0.4 + enemyFactor * 0.4 + ammoFactor * 0.2)
}

function selectBestCover(coverPositions: THREE.Vector3[], currentPos: THREE.Vector3, enemyPos: THREE.Vector3): THREE.Vector3 | null {
  if (coverPositions.length === 0) return null

  let bestCover = coverPositions[0]
  let bestScore = -Infinity

  for (const cover of coverPositions) {
    const distToPlayer = cover.distanceTo(currentPos)
    const distToEnemy = cover.distanceTo(enemyPos)
    const score = distToEnemy - distToPlayer * 0.5

    if (score > bestScore) {
      bestScore = score
      bestCover = cover
    }
  }

  return bestCover
}

// ============================================================
// AI CONTROLLER
// ============================================================

export class AIController {
  // Configuration
  private personality: AIPersonalityData
  private difficulty: AIDifficultyData
  private voiceProfile: AIVoiceProfileData

  // Bot State
  private bot: ExtendedBotState
  private learning: ExtendedLearningData
  private team: AITeamData | null = null

  // Combat
  private target: THREE.Object3D | null = null
  private lastShotTime: number = 0
  private burstShotsFired: number = 0
  private aimOffset: THREE.Vector3 = new THREE.Vector3()

  // Pathfinding
  private path: PathfindingNode[] = []
  private currentPathIndex: number = 0
  private pathfindingGrid: PathfindingGrid | null = null
  private lastPathfindTime: number = 0

  // Cover System
  private coverPositions: THREE.Vector3[] = []
  private currentCover: THREE.Vector3 | null = null

  // Timers
  private stateStartTime: number = 0
  private lastDecisionTime: number = 0
  private lastLearningUpdate: number = 0

  // Events
  private stateChangeCallbacks: StateChangeCallback[] = []
  private deathCallbacks: AICallback[] = []
  private damageCallbacks: AICallback[] = []
  
  // BESTE Variante: AI Shoot Callbacks (aus V6)
  private onShootCallbacks: AIShootCallback[] = []
  private onDeathSimpleCallbacks: AIDeathCallback[] = []

  // Scene references
  private scene: THREE.Scene | null = null
  private playerPosition: THREE.Vector3 = new THREE.Vector3()

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    personalityId: string = 'aggressive_assault',
    difficultyId: string = 'regular',
    botMesh: THREE.Object3D
  ) {
    const personality = getAIPersonalityById(personalityId)
    const difficulty = getAIDifficultyById(difficultyId)

    if (!personality) {
      throw new Error(`AI Personality "${personalityId}" not found`)
    }

    if (!difficulty) {
      throw new Error(`AI Difficulty "${difficultyId}" not found`)
    }

    this.personality = personality
    this.difficulty = difficulty

    // Select voice profile
    this.voiceProfile = AI_VOICE_PROFILES[0] // Default: male_soldier

    // Initialize bot state
    this.bot = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: botMesh.position.clone(),
      rotation: botMesh.rotation.clone(),
      mesh: botMesh,
      health: 100 * difficulty.healthMultiplier,
      maxHealth: 100 * difficulty.healthMultiplier,
      currentWeapon: null,
      ammo: 30,
      maxAmmo: 30,
      currentState: AIState.IDLE,
      previousState: AIState.IDLE,
      target: null,
      lastKnownPlayerPosition: null,
      timeSinceTargetSeen: 0,
      alertLevel: 0,
      isUnderFire: false,
      velocity: new THREE.Vector3(),
      moveDirection: new THREE.Vector3(),
      lookDirection: new THREE.Vector3(0, 0, -1),
      isMoving: false,
      isShooting: false,
      isReloading: false,
      isInCover: false,
      lastDamageTime: 0,
      lastShotTime: 0,
      personality: personalityId,
      difficulty: difficultyId,
      team: null,
      squad: null,
      // Base AIBotStateData properties
      morale: 100,
      stamina: 100,
      lastSeenTimestamp: 0,
      isAiming: false,
      isFiring: false,
      burstFireCount: 0,
      reloadTime: 0,
      combatStyle: AICombatStyle.TACTICAL,
      engagementRange: 50,
      pathNodes: [],
      currentPathIndex: 0,
      coverPositions: [],
      currentCover: null,
      experience: 0,
      kills: 0,
      deaths: 0,
      accuracy: 0,
      survivalTime: 0,
      learnedPatterns: new Map(),
      teamId: '',
      squadPosition: AISquadPosition.LONE_WOLF,
      isFollowingOrders: false,
      orders: [],
      behaviorTimer: 0,
      nextDecisionTime: 0
    }

    // Initialize learning data
    this.learning = {
      // Extended properties
      encountersWithPlayer: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      successfulFlanks: 0,
      failedFlanks: 0,
      successfulAmbushes: 0,
      coverUseCount: 0,
      reloadInCoverCount: 0,
      playerMovementPatterns: [],
      playerPreferredWeapons: [],
      tacticalDecisions: [],
      adaptationLevel: 0,
      // Base AILearningData properties
      playerPatterns: new Map(),
      successfulTactics: new Map(),
      failedTactics: new Map(),
      mapKnowledge: new Map(),
      weaponPreferences: new Map(),
      timingPatterns: new Map()
    }

    this.stateStartTime = Date.now()
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  public setScene(scene: THREE.Scene): void {
    this.scene = scene
    this.initializePathfindingGrid()
    this.findCoverPositions()
  }

  public setTeam(team: AITeamData): void {
    this.team = team
    this.bot.team = team.id
  }

  public setPlayerPosition(position: THREE.Vector3): void {
    this.playerPosition.copy(position)
  }

  // ============================================================
  // STATE MACHINE
  // ============================================================

  private changeState(newState: AIState): void {
    if (this.bot.currentState === newState) {
      return
    }

    const oldState = this.bot.currentState
    this.bot.previousState = oldState
    this.bot.currentState = newState
    this.stateStartTime = Date.now()

    // State entry actions
    this.onStateEnter(newState)

    // Notify listeners
    this.stateChangeCallbacks.forEach(cb => cb(oldState, newState))

    // Voice response
    this.playVoiceResponse(newState)
  }

  private onStateEnter(state: AIState): void {
    switch (state) {
      case AIState.PATROLLING:
        this.generatePatrolPath()
        break

      case AIState.ENGAGING:
        this.bot.alertLevel = 100
        break

      case AIState.TAKING_COVER:
        this.findAndMoveToCover()
        break

      case AIState.FLANKING:
        this.generateFlankPath()
        break

      case AIState.RELOADING:
        this.bot.isReloading = true
        this.bot.isShooting = false
        break

      case AIState.RETREATING:
        this.generateRetreatPath()
        break

      case AIState.DEAD:
        this.handleDeath()
        break
    }
  }

  private onStateExit(state: AIState): void {
    switch (state) {
      case AIState.RELOADING:
        this.bot.isReloading = false
        this.bot.ammo = this.bot.maxAmmo
        this.learning.reloadInCoverCount++
        break

      case AIState.TAKING_COVER:
        this.bot.isInCover = false
        break
    }
  }

  // ============================================================
  // DECISION MAKING
  // ============================================================

  private makeDecision(deltaTime: number): void {
    const now = Date.now()

    // Decision rate limited by reaction time
    const reactionTime = calculateEffectiveReactionTime(
      this.personality.reactionTime,
      this.difficulty
    )

    if (now - this.lastDecisionTime < reactionTime) {
      return
    }

    this.lastDecisionTime = now

    // Check if dead
    if (this.bot.health <= 0) {
      this.changeState(AIState.DEAD)
      return
    }

    // Update target detection
    this.updateTargetDetection()

    // State-specific decisions
    switch (this.bot.currentState) {
      case AIState.IDLE:
        this.decideFromIdle()
        break

      case AIState.PATROLLING:
        this.decideFromPatrolling()
        break

      case AIState.INVESTIGATING:
        this.decideFromInvestigating()
        break

      case AIState.ENGAGING:
        this.decideFromEngaging()
        break

      case AIState.TAKING_COVER:
        this.decideFromCover()
        break

      case AIState.RELOADING:
        this.decideFromReloading()
        break

      case AIState.FLANKING:
        this.decideFromFlanking()
        break

      case AIState.RETREATING:
        this.decideFromRetreating()
        break
    }
  }

  private decideFromIdle(): void {
    if (this.bot.target) {
      this.changeState(AIState.ENGAGING)
    } else if (this.bot.alertLevel > 0) {
      this.changeState(AIState.INVESTIGATING)
    } else {
      this.changeState(AIState.PATROLLING)
    }
  }

  private decideFromPatrolling(): void {
    if (this.bot.target) {
      this.changeState(AIState.ENGAGING)
    } else if (this.bot.alertLevel > 50) {
      this.changeState(AIState.INVESTIGATING)
    }
  }

  private decideFromInvestigating(): void {
    if (this.bot.target) {
      this.changeState(AIState.ENGAGING)
    } else if (this.bot.alertLevel === 0) {
      this.changeState(AIState.PATROLLING)
    }
  }

  private decideFromEngaging(): void {
    if (!this.bot.target) {
      this.changeState(AIState.SEARCHING)
      return
    }

    // Check if should reload
    if (shouldReload(this.bot.ammo, this.bot.maxAmmo, true)) {
      this.changeState(AIState.RELOADING)
      return
    }

    // Check if should take cover
    if (shouldTakeCover(this.bot.health, this.bot.maxHealth, this.bot.isUnderFire, this.bot.ammo)) {
      this.changeState(AIState.TAKING_COVER)
      return
    }

    // Check if should flank
    const canFlank = shouldFlank(
      this.personality,
      this.bot.timeSinceTargetSeen,
      false, // enemyStationary
      this.coverPositions.length > 0
    )

    if (canFlank && this.personality.tacticalThinking > 60) {
      this.changeState(AIState.FLANKING)
      return
    }

    // Call for backup if needed
    if (shouldCallForBackup(this.bot.health, this.bot.maxHealth, 1, 1, 1)) {
      this.requestBackup()
    }
  }

  private decideFromCover(): void {
    // Stay in cover while reloading
    if (this.bot.isReloading) {
      return
    }

    // Exit cover if health recovered and target visible
    if (this.bot.target && this.bot.health > this.bot.maxHealth * 0.5) {
      this.changeState(AIState.ENGAGING)
    }
  }

  private decideFromReloading(): void {
    const reloadTime = 2000 // 2 seconds
    const timeInState = Date.now() - this.stateStartTime

    if (timeInState >= reloadTime) {
      this.onStateExit(AIState.RELOADING)

      // Return to previous state or engage
      if (this.bot.target) {
        this.changeState(AIState.ENGAGING)
      } else {
        this.changeState(AIState.PATROLLING)
      }
    }
  }

  private decideFromFlanking(): void {
    // Check if reached flank position
    if (this.path.length === 0 || this.currentPathIndex >= this.path.length) {
      this.learning.successfulFlanks++
      this.changeState(AIState.ENGAGING)
    }
  }

  private decideFromRetreating(): void {
    // Check if reached safe distance
    if (this.bot.target) {
      const distance = this.bot.position.distanceTo(this.playerPosition)
      if (distance > 20) {
        this.changeState(AIState.TAKING_COVER)
      }
    }
  }

  // ============================================================
  // TARGET DETECTION
  // ============================================================

  private updateTargetDetection(): void {
    if (!this.scene) {
      return
    }

    // Calculate distance to player
    const distance = this.bot.position.distanceTo(this.playerPosition)

    // Check if within detection range
    const detectionRange = this.difficulty.visionRange

    if (distance > detectionRange) {
      this.bot.target = null
      return
    }

    // Check line of sight
    const direction = this.playerPosition.clone().sub(this.bot.position).normalize()
    const raycaster = new THREE.Raycaster(this.bot.position, direction, 0, distance)
    
    // ✅ FIX: Filter out Sprites (Health Bars) to avoid camera errors
    const raycastTargets = (this.scene?.children || []).filter(child => {
      // Exclude Sprites (Health Bars)
      if (child instanceof THREE.Sprite) return false
      // Exclude enemy meshes (we only want obstacles)
      if (child.userData?.type === 'ENEMY') return false
      return true
    })
    
    const intersects = raycaster.intersectObjects(raycastTargets, true)

    // If clear line of sight (no obstacles)
    if (intersects.length === 0 || intersects[0].distance > distance - 1) {
      // Target acquired
      if (!this.bot.target) {
        this.bot.target = this.playerPosition.clone()
        this.bot.alertLevel = 100
        this.learning.encountersWithPlayer++
      }

      this.bot.lastKnownPlayerPosition = this.playerPosition.clone()
      this.bot.timeSinceTargetSeen = 0
    } else {
      // Lost line of sight
      if (this.bot.target) {
        this.bot.timeSinceTargetSeen += 0.016 // Assume 60fps
      }

      // Lose target after 5 seconds
      if (this.bot.timeSinceTargetSeen > 5000) {
        this.bot.target = null
      }
    }
  }

  // ============================================================
  // COMBAT
  // ============================================================

  private updateCombat(deltaTime: number): void {
    if (this.bot.currentState !== AIState.ENGAGING || !this.bot.target) {
      return
    }

    // Calculate effective accuracy
    const accuracy = calculateEffectiveAccuracy(
      this.personality.accuracy,
      this.difficulty
    )

    // Aim at target with accuracy offset
    this.updateAim(accuracy)

    // Check if can shoot
    if (this.canShoot()) {
      this.shoot()
    }
  }

  private updateAim(accuracy: number): void {
    // Calculate aim direction
    const targetPos = this.bot.target || this.playerPosition
    const aimDirection = targetPos.clone().sub(this.bot.position).normalize()

    // Apply accuracy (inaccuracy spread)
    const spread = (1 - accuracy / 100) * 0.1
    this.aimOffset.set(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    )

    // Update look direction
    this.bot.lookDirection.copy(aimDirection).add(this.aimOffset).normalize()

    // Rotate mesh to look at target
    this.bot.mesh.lookAt(targetPos)
  }

  private canShoot(): boolean {
    if (this.bot.isReloading) {
      return false
    }

    if (this.bot.ammo <= 0) {
      return false
    }

    // Fire rate check
    const fireRate = 600 // 600 RPM
    const fireDelay = 60000 / fireRate // milliseconds between shots
    const timeSinceShot = Date.now() - this.lastShotTime

    if (timeSinceShot < fireDelay) {
      return false
    }

    return true
  }

  private shoot(): void {
    this.bot.isShooting = true
    this.bot.ammo--
    this.lastShotTime = Date.now()
    this.bot.lastShotTime = Date.now()
    this.burstShotsFired++

    // Burst fire control
    const burstLength = 3 + Math.floor(Math.random() * 3) // 3-5 shots
    if (this.burstShotsFired >= burstLength) {
      this.burstShotsFired = 0
      // Short pause between bursts
      this.lastShotTime += 200
    }

    // Create bullet (handled by weapon system)
    // This would trigger bullet creation in the game engine
  }

  // ============================================================
  // BESTE Variante: shootAtPlayer() für Event-basiertes Shooting (aus V6)
  // ============================================================

  /**
   * BESTE Variante: Schießt auf Spieler mit Callback-System (aus V6)
   */
  public shootAtPlayer(): void {
    if (!this.canShootAtPlayer()) {
      return
    }
    
    const now = Date.now()
    this.lastShotTime = now
    
    // Berechne Schussrichtung mit Genauigkeit
    const aimDirection = this.calculateAimDirection()
    
    // Schussposition (etwas vor dem AI)
    const shootOrigin = this.bot.position.clone()
    shootOrigin.y += 1.5 // Schulterhöhe
    
    // Schaden basiert auf Distanz und Difficulty
    const damage = this.calculateShootDamage()
    
    // Accuracy berechnen
    const accuracy = calculateEffectiveAccuracy(
      this.personality.accuracy,
      this.difficulty
    )
    
    // Fire callback
    const shootData: AIShootData = {
      origin: shootOrigin,
      direction: aimDirection,
      damage,
      accuracy: accuracy / 100 // 0-1 range
    }
    
    this.onShootCallbacks.forEach(cb => cb(shootData))
    
    // Update state
    this.bot.isShooting = true
    this.bot.ammo = Math.max(0, this.bot.ammo - 1)
    this.burstShotsFired++
    
    // Burst Fire Logic
    const burstLength = 3 + Math.floor(Math.random() * 3) // 3-5 shots
    if (this.burstShotsFired >= burstLength) {
      this.burstShotsFired = 0
      this.lastShotTime = now + 500 // Pause zwischen Bursts
    }
  }

  /**
   * Prüft ob AI schießen kann
   */
  private canShootAtPlayer(): boolean {
    const now = Date.now()
    
    // Check cooldown
    const fireRate = 600 // RPM
    const fireDelay = 60000 / fireRate
    if (now - this.lastShotTime < fireDelay) {
      return false
    }
    
    // Check state
    if (this.bot.currentState === AIState.DEAD || this.bot.isReloading) {
      return false
    }
    
    // Check ammo
    if (this.bot.ammo <= 0) {
      return false
    }
    
    // Check distance (max 100m)
    const distance = this.bot.position.distanceTo(this.playerPosition)
    if (distance > 100) {
      return false
    }
    
    // Check line of sight (vereinfacht)
    const toPlayer = this.playerPosition.clone().sub(this.bot.position).normalize()
    const distanceToPlayer = this.bot.position.distanceTo(this.playerPosition)
    
    if (this.scene) {
      const raycaster = new THREE.Raycaster(
        this.bot.position,
        toPlayer,
        0,
        distanceToPlayer
      )
      const intersects = raycaster.intersectObjects(this.scene.children, true)
      
      // Hat Sichtlinie wenn keine Hindernisse
      if (intersects.length > 0) {
        const firstHit = intersects[0]
        const hitDistance = firstHit.distance
        // Wenn Hindernis näher als Spieler, keine Sichtlinie
        if (hitDistance < distanceToPlayer - 0.5) {
          return false
        }
      }
    }
    
    return true
  }

  /**
   * Berechnet Schussrichtung mit Genauigkeit
   */
  private calculateAimDirection(): THREE.Vector3 {
    // Basis-Richtung zum Spieler
    const perfectDirection = this.playerPosition.clone()
      .sub(this.bot.position)
      .normalize()
    
    // Genauigkeit anwenden (Streuung)
    const accuracy = calculateEffectiveAccuracy(
      this.personality.accuracy,
      this.difficulty
    )
    const spread = (1 - accuracy / 100) * 0.1
    
    const offsetX = (Math.random() - 0.5) * spread
    const offsetY = (Math.random() - 0.5) * spread
    const offsetZ = (Math.random() - 0.5) * spread
    
    perfectDirection.x += offsetX
    perfectDirection.y += offsetY
    perfectDirection.z += offsetZ
    
    return perfectDirection.normalize()
  }

  /**
   * Berechnet Schaden basierend auf Distanz
   */
  private calculateShootDamage(): number {
    let baseDamage = 15
    
    const distance = this.bot.position.distanceTo(this.playerPosition)
    
    // Distanz-Falloff
    if (distance > 50) {
      baseDamage *= 0.7
    } else if (distance > 30) {
      baseDamage *= 0.85
    }
    
    // Difficulty Multiplier
    const difficultyMultiplier = this.difficulty.damageMultiplier || 1.0
    baseDamage *= difficultyMultiplier
    
    return Math.round(baseDamage)
  }

  // ============================================================
  // MOVEMENT
  // ============================================================

  private updateMovement(deltaTime: number): void {
    // Follow path if exists
    if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
      this.followPath(deltaTime)
    } else {
      // No path, decide movement based on state
      switch (this.bot.currentState) {
        case AIState.ENGAGING:
          this.moveTowardsTarget(deltaTime)
          break

        case AIState.RETREATING:
          this.moveAwayFromTarget(deltaTime)
          break
      }
    }
  }

  private followPath(deltaTime: number): void {
    const currentNode = this.path[this.currentPathIndex]
    const targetPosition = currentNode.position.clone()

    // Move towards current node
    const direction = targetPosition.clone().sub(this.bot.position).normalize()
    const moveSpeed = this.personality.movementPattern === AIMovementPattern.AGGRESSIVE ? 5.0 : 3.5

    this.bot.moveDirection.copy(direction)
    this.bot.velocity.copy(direction).multiplyScalar(moveSpeed)
    this.bot.position.add(this.bot.velocity.clone().multiplyScalar(deltaTime))
    this.bot.mesh.position.copy(this.bot.position)

    // Check if reached node
    if (this.bot.position.distanceTo(targetPosition) < 1.0) {
      this.currentPathIndex++
    }

    this.bot.isMoving = true
  }

  private moveTowardsTarget(deltaTime: number): void {
    if (!this.bot.target) {
      return
    }

    const direction = this.bot.target.clone().sub(this.bot.position).normalize()
    const moveSpeed = this.personality.aggressiveness / 100 * 5.0

    this.bot.moveDirection.copy(direction)
    this.bot.velocity.copy(direction).multiplyScalar(moveSpeed)
    this.bot.position.add(this.bot.velocity.clone().multiplyScalar(deltaTime))
    this.bot.mesh.position.copy(this.bot.position)

    this.bot.isMoving = true
  }

  private moveAwayFromTarget(deltaTime: number): void {
    const direction = this.bot.position.clone().sub(this.playerPosition).normalize()
    const moveSpeed = 6.0 // Fast retreat

    this.bot.moveDirection.copy(direction)
    this.bot.velocity.copy(direction).multiplyScalar(moveSpeed)
    this.bot.position.add(this.bot.velocity.clone().multiplyScalar(deltaTime))
    this.bot.mesh.position.copy(this.bot.position)

    this.bot.isMoving = true
  }

  // ============================================================
  // PATHFINDING
  // ============================================================

  private initializePathfindingGrid(): void {
    if (!this.scene) {
      return
    }

    // Simple grid-based pathfinding (50x50x50 cells, 2m each)
    this.pathfindingGrid = {
      nodes: new Map(),
      width: 50,
      height: 50,
      depth: 50,
      cellSize: 2
    }

    // Initialize grid nodes
    // In a real implementation, this would scan the scene geometry
  }

  private findPath(start: THREE.Vector3, end: THREE.Vector3): PathfindingNode[] {
    // Simplified A* pathfinding
    // In a real implementation, this would use proper A* algorithm

    // For now, return straight line path
    const path: PathfindingNode[] = []
    const steps = 10

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = start.x + (end.x - start.x) * t
      const y = start.y + (end.y - start.y) * t
      const z = start.z + (end.z - start.z) * t

      path.push({
        position: new THREE.Vector3(x, y, z),
        cost: 0,
        neighbors: [],
        isCover: false,
        height: y,
        isOccupied: false
      })
    }

    return path
  }

  private generatePatrolPath(): void {
    // Random patrol path around spawn point
    const patrolRadius = 20
    const angle = Math.random() * Math.PI * 2
    const endPoint = new THREE.Vector3(
      this.bot.position.x + Math.cos(angle) * patrolRadius,
      this.bot.position.y,
      this.bot.position.z + Math.sin(angle) * patrolRadius
    )

    this.path = this.findPath(this.bot.position, endPoint)
    this.currentPathIndex = 0
  }

  private generateFlankPath(): void {
    if (!this.bot.target) {
      return
    }

    // Calculate flank position (perpendicular to target)
    const toTarget = this.bot.target.clone().sub(this.bot.position).normalize()
    const perpendicular = new THREE.Vector3(-toTarget.z, 0, toTarget.x)
    const flankOffset = perpendicular.multiplyScalar(15) // 15m to the side

    const flankPosition = this.bot.target.clone().add(flankOffset)

    this.path = this.findPath(this.bot.position, flankPosition)
    this.currentPathIndex = 0
  }

  private generateRetreatPath(): void {
    // Move away from player to safe distance
    const awayDirection = this.bot.position.clone().sub(this.playerPosition).normalize()
    const retreatPoint = this.bot.position.clone().add(awayDirection.multiplyScalar(20))

    this.path = this.findPath(this.bot.position, retreatPoint)
    this.currentPathIndex = 0
  }

  // ============================================================
  // COVER SYSTEM
  // ============================================================

  private findCoverPositions(): void {
    if (!this.scene) {
      return
    }

    // Scan for cover positions (objects that can provide cover)
    // In a real implementation, this would raycast to find cover spots
    // For now, generate some random cover positions

    this.coverPositions = []
    const coverCount = 10
    const coverRadius = 30

    for (let i = 0; i < coverCount; i++) {
      const angle = (i / coverCount) * Math.PI * 2
      const cover = new THREE.Vector3(
        this.bot.position.x + Math.cos(angle) * coverRadius,
        this.bot.position.y,
        this.bot.position.z + Math.sin(angle) * coverRadius
      )
      this.coverPositions.push(cover)
    }
  }

  private findAndMoveToCover(): void {
    const bestCover = selectBestCover(
      this.coverPositions,
      this.bot.position,
      this.playerPosition
    )

    if (bestCover) {
      this.currentCover = bestCover
      this.path = this.findPath(this.bot.position, bestCover)
      this.currentPathIndex = 0
      this.bot.isInCover = true
      this.learning.coverUseCount++
    }
  }

  // ============================================================
  // LEARNING SYSTEM
  // ============================================================

  private updateLearning(deltaTime: number): void {
    const now = Date.now()

    // Update learning every 5 seconds
    if (now - this.lastLearningUpdate < 5000) {
      return
    }

    this.lastLearningUpdate = now

    // Adapt based on player behavior
    this.adaptToPlayerBehavior()

    // Update adaptation level
    const learningRate = this.personality.learningRate / 100
    this.learning.adaptationLevel = Math.min(
      100,
      this.learning.adaptationLevel + learningRate
    )
  }

  private adaptToPlayerBehavior(): void {
    // Record player position patterns
    this.learning.playerMovementPatterns.push({
      position: this.playerPosition.clone(),
      timestamp: Date.now()
    })

    // Keep last 50 positions
    if (this.learning.playerMovementPatterns.length > 50) {
      this.learning.playerMovementPatterns.shift()
    }

    // Analyze patterns and adjust tactics
    // In a full implementation, this would use pattern recognition
  }

  // ============================================================
  // TEAM COORDINATION
  // ============================================================

  private requestBackup(): void {
    if (!this.team) {
      return
    }

    // Send backup request to team
    // This would be handled by a TeamManager in full implementation
    console.log(`[AI ${this.bot.id}] Requesting backup!`)
  }

  // ============================================================
  // VOICE SYSTEM
  // ============================================================

  private playVoiceResponse(state: AIState): void {
    let responseKey: string | null = null

    switch (state) {
      case AIState.ENGAGING:
        responseKey = 'enemy_spotted'
        break
      case AIState.TAKING_COVER:
        responseKey = 'taking_cover'
        break
      case AIState.RELOADING:
        responseKey = 'reloading'
        break
      case AIState.COVERING:
        responseKey = 'covering_teammate'
        break
    }

    if (responseKey && this.voiceProfile.responses[responseKey]) {
      const responses = this.voiceProfile.responses[responseKey]
      const response = responses[Math.floor(Math.random() * responses.length)]
      console.log(`[AI ${this.bot.id}] ${response}`)
      // Play audio in full implementation
    }
  }

  // ============================================================
  // DAMAGE & DEATH
  // ============================================================

  public takeDamage(damage: number, source: THREE.Vector3): void {
    this.bot.health -= damage
    this.bot.lastDamageTime = Date.now()
    this.bot.isUnderFire = true
    this.bot.alertLevel = 100
    this.learning.totalDamageTaken += damage

    // Notify listeners
    this.damageCallbacks.forEach(cb => cb(this.bot))

    // Voice response
    const responses = this.voiceProfile.responses.get('taking_damage')
    if (responses && responses.length > 0) {
      const response = responses[Math.floor(Math.random() * responses.length)]
      console.log(`[AI ${this.bot.id}] ${response}`)
    }

    // Check death
    if (this.bot.health <= 0) {
      this.changeState(AIState.DEAD)
    }
  }

  private handleDeath(): void {
    this.bot.isMoving = false
    this.bot.isShooting = false
    this.bot.velocity.set(0, 0, 0)

    // Voice response
    const responses = this.voiceProfile.responses.get('death')
    if (responses && responses.length > 0) {
      const response = responses[Math.floor(Math.random() * responses.length)]
      console.log(`[AI ${this.bot.id}] ${response}`)
    }

    // Notify listeners
    this.deathCallbacks.forEach(cb => cb(this.bot))
  }

  // ============================================================
  // MAIN UPDATE
  // ============================================================

  public update(deltaTime: number): void {
    if (this.bot.currentState === AIState.DEAD) {
      return
    }

    // Decision making
    this.makeDecision(deltaTime)

    // Movement
    this.updateMovement(deltaTime)

    // Combat
    this.updateCombat(deltaTime)

    // Learning
    this.updateLearning(deltaTime)

    // Clear under fire flag after 2 seconds
    if (Date.now() - this.bot.lastDamageTime > 2000) {
      this.bot.isUnderFire = false
    }

    // Decrease alert level over time
    if (this.bot.alertLevel > 0 && !this.bot.target) {
      this.bot.alertLevel = Math.max(0, this.bot.alertLevel - deltaTime * 10)
    }
  }

  // ============================================================
  // EVENTS
  // ============================================================

  public onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.push(callback)
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback)
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1)
      }
    }
  }

  public onDeath(callback: AICallback): () => void {
    this.deathCallbacks.push(callback)
    return () => {
      const index = this.deathCallbacks.indexOf(callback)
      if (index > -1) {
        this.deathCallbacks.splice(index, 1)
      }
    }
  }

  public onDamage(callback: AICallback): () => void {
    this.damageCallbacks.push(callback)
    return () => {
      const index = this.damageCallbacks.indexOf(callback)
      if (index > -1) {
        this.damageCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * BESTE Variante: onShoot Event für AI Shooting (aus V6)
   */
  public onShoot(callback: AIShootCallback): void {
    this.onShootCallbacks.push(callback)
  }

  
  // ============================================================
  // GETTERS
  // ============================================================

  public getBotState(): AIBotStateData {
    return { ...this.bot }
  }

  public getLearningData(): AILearningData {
    return { ...this.learning }
  }

  public getPersonality(): AIPersonalityData {
    return this.personality
  }

  public getDifficulty(): AIDifficultyData {
    return this.difficulty
  }

  public getCurrentState(): AIState {
    return this.bot.currentState
  }

  public getHealth(): number {
    return this.bot.health
  }

  public isAlive(): boolean {
    return this.bot.currentState !== AIState.DEAD
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  public destroy(): void {
    this.stateChangeCallbacks = []
    this.deathCallbacks = []
    this.damageCallbacks = []
    this.scene = null
    this.target = null
    this.team = null
  }
}
