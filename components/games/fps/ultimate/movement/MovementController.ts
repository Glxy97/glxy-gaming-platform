/**
 * 🏃 MOVEMENT CONTROLLER
 * Professional FPS Movement System Implementation
 *
 * @remarks
 * Implements IMovementController with advanced features:
 * - 10 Movement Abilities (Enhanced Sprint → Blink Dash)
 * - 14 Movement States (Idle → Dodging)
 * - Stamina System (100 stamina, regeneration)
 * - Parkour System (Wall Run, Mantle, Vault, Glide)
 * - Physics Integration
 * - Event System
 *
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import * as THREE from 'three'
import { IMovementController } from '../core/interfaces/IMovementController'
import {
  MovementState,
  MovementSettings,
  MovementStateData,
  MovementAbilityData,
  WallInfo,
  WallRunDirection,
  ObstacleTarget,
  DEFAULT_MOVEMENT_SETTINGS,
  MOVEMENT_ABILITIES,
  calculateMovementSpeed,
  hasEnoughStamina,
  canPerformAction,
  createDefaultMovementState,
  getMovementAbilityById
} from './data/MovementData'

// ============================================================
// TYPES
// ============================================================

type MovementCallback = () => void
type SprintCallback = (isSprinting: boolean) => void
type CrouchCallback = (isCrouching: boolean) => void

// ============================================================
// MOVEMENT CONTROLLER
// ============================================================

export class MovementController implements IMovementController {
  // Configuration
  private settings: MovementSettings
  private state: MovementStateData
  private activeAbility: MovementAbilityData | null = null

  // Physics
  private gravity: number = -9.81
  private physicsEnabled: boolean = true
  private groundNormal: THREE.Vector3 | null = null

  // Timers
  private slideStartTime: number = 0
  private mantleStartTime: number = 0
  private vaultStartTime: number = 0
  private abilityStartTime: number = 0
  private lastAbilityUse: Map<string, number> = new Map()

  // Event Callbacks
  private sprintCallbacks: SprintCallback[] = []
  private crouchCallbacks: CrouchCallback[] = []
  private jumpCallbacks: MovementCallback[] = []
  private landCallbacks: MovementCallback[] = []

  // Raycasting for ground/wall detection
  private raycaster: THREE.Raycaster
  private scene: THREE.Scene | null = null
  private playerMesh: THREE.Object3D | null = null

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(settings: Partial<MovementSettings> = {}) {
    this.settings = { ...DEFAULT_MOVEMENT_SETTINGS, ...settings }
    this.state = createDefaultMovementState()
    this.raycaster = new THREE.Raycaster()
  }

  // ============================================================
  // PROPERTIES
  // ============================================================

  get speed(): number {
    return this.state.speed
  }

  get velocity(): THREE.Vector3 {
    return this.state.velocity.clone()
  }

  get baseSpeed(): number {
    return this.state.baseSpeed
  }

  get stamina(): number {
    return this.state.stamina
  }

  get isSprinting(): boolean {
    return this.state.isSprinting
  }

  get isCrouching(): boolean {
    return this.state.isCrouching
  }

  get isSliding(): boolean {
    return this.state.isSliding
  }

  get isJumping(): boolean {
    return this.state.isJumping
  }

  get isInAir(): boolean {
    return !this.state.isGrounded
  }

  get isGrounded(): boolean {
    return this.state.isGrounded
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Set scene for raycasting
   */
  public setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  /**
   * Set player mesh for raycasting
   */
  public setPlayerMesh(mesh: THREE.Object3D): void {
    this.playerMesh = mesh
  }

  // ============================================================
  // BASIC MOVEMENT
  // ============================================================

  public move(direction: THREE.Vector3, deltaTime: number): void {
    if (this.state.isMantling || this.state.isVaulting) {
      return // Can't move during mantle/vault
    }

    // Normalize direction
    const moveDir = direction.clone().normalize()

    // Calculate current speed
    const currentSpeed = calculateMovementSpeed(this.state, this.settings)

    // Apply air control if in air
    const speedMultiplier = this.state.isGrounded
      ? 1.0
      : this.settings.airControlMultiplier

    // Update velocity
    this.state.velocity.x = moveDir.x * currentSpeed * speedMultiplier
    this.state.velocity.z = moveDir.z * currentSpeed * speedMultiplier

    // Update speed
    this.state.speed = currentSpeed

    // Update movement direction
    this.state.moveDirection.copy(moveDir)

    // Update state
    if (moveDir.length() > 0.1) {
      if (this.state.isSprinting) {
        this.state.currentState = MovementState.SPRINTING
      } else if (this.state.isRunning) {
        this.state.currentState = MovementState.RUNNING
      } else {
        this.state.currentState = MovementState.WALKING
      }
    } else if (this.state.isGrounded) {
      this.state.currentState = MovementState.IDLE
    }
  }

  public stop(): void {
    this.state.velocity.x = 0
    this.state.velocity.z = 0
    this.state.speed = 0
    this.state.moveDirection.set(0, 0, 0)

    if (this.state.isGrounded) {
      this.state.currentState = MovementState.IDLE
    }
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.settings.speedMultiplier = Math.max(0, multiplier)
  }

  // ============================================================
  // SPRINT
  // ============================================================

  public sprint(enable: boolean): boolean {
    if (enable) {
      if (!this.canSprint()) {
        return false
      }

      this.state.isSprinting = true
      this.state.isRunning = false
      this.state.currentState = MovementState.SPRINTING

      // Notify listeners
      this.sprintCallbacks.forEach(cb => cb(true))

      return true
    } else {
      this.state.isSprinting = false
      if (this.state.moveDirection.length() > 0.1) {
        this.state.isRunning = true
        this.state.currentState = MovementState.RUNNING
      }

      // Notify listeners
      this.sprintCallbacks.forEach(cb => cb(false))

      return true
    }
  }

  public canSprint(): boolean {
    return (
      this.state.isGrounded &&
      !this.state.isCrouching &&
      !this.state.isSliding &&
      !this.state.isMantling &&
      !this.state.isVaulting &&
      hasEnoughStamina(this.state.stamina, this.settings.sprintStaminaCost, this.settings)
    )
  }

  // ============================================================
  // CROUCH
  // ============================================================

  public crouch(enable: boolean): boolean {
    if (enable) {
      if (this.state.isSprinting) {
        this.sprint(false)
      }

      this.state.isCrouching = true
      this.state.currentState = MovementState.CROUCHING

      // Notify listeners
      this.crouchCallbacks.forEach(cb => cb(true))

      return true
    } else {
      this.state.isCrouching = false

      if (this.state.moveDirection.length() > 0.1) {
        this.state.isRunning = true
        this.state.currentState = MovementState.RUNNING
      } else {
        this.state.currentState = MovementState.IDLE
      }

      // Notify listeners
      this.crouchCallbacks.forEach(cb => cb(false))

      return true
    }
  }

  public toggleCrouch(): void {
    this.crouch(!this.state.isCrouching)
  }

  // ============================================================
  // SLIDE
  // ============================================================

  public slide(): boolean {
    if (!this.canSlide()) {
      return false
    }

    // Check stamina
    if (!hasEnoughStamina(this.state.stamina, this.settings.slideStaminaCost, this.settings)) {
      return false
    }

    // Start slide
    this.state.isSliding = true
    this.state.isSprinting = false
    this.state.isCrouching = true
    this.state.currentState = MovementState.SLIDING
    this.slideStartTime = Date.now()

    // Drain stamina
    this.drainStamina(this.settings.slideStaminaCost)

    return true
  }

  public canSlide(): boolean {
    return (
      this.state.isGrounded &&
      this.state.isSprinting &&
      this.state.speed >= this.settings.wallRunMinSpeed &&
      !this.state.isSliding &&
      !this.state.isMantling &&
      !this.state.isVaulting
    )
  }

  // ============================================================
  // JUMP
  // ============================================================

  public jump(): boolean {
    if (!this.canJump()) {
      return false
    }

    // Check stamina
    if (!hasEnoughStamina(this.state.stamina, this.settings.jumpStaminaCost, this.settings)) {
      return false
    }

    // Apply jump force
    const jumpForce = this.state.isDoubleJumping
      ? this.settings.doubleJumpForce
      : this.settings.jumpForce

    this.state.velocity.y = jumpForce
    this.state.isJumping = true
    this.state.isGrounded = false
    this.state.currentState = MovementState.JUMPING
    this.state.lastJumpTime = Date.now()

    // Drain stamina
    this.drainStamina(this.settings.jumpStaminaCost)

    // Notify listeners
    this.jumpCallbacks.forEach(cb => cb())

    return true
  }

  public canJump(): boolean {
    if (this.state.isGrounded && !this.state.isJumping) {
      return true
    }

    // Double jump
    if (
      this.settings.enableDoubleJump &&
      this.state.isJumping &&
      !this.state.isDoubleJumping &&
      this.state.airTime > 0.1
    ) {
      return true
    }

    // Wall jump
    if (this.state.isWallRunning && this.settings.enableWallRunning) {
      return true
    }

    return false
  }

  // ============================================================
  // ADVANCED MOVEMENT - WALL RUN
  // ============================================================

  private updateWallRun(deltaTime: number): void {
    if (!this.settings.enableWallRunning) {
      return
    }

    const wallInfo = this.detectWall()

    if (wallInfo && this.state.speed >= this.settings.wallRunMinSpeed) {
      if (!this.state.isWallRunning) {
        // Start wall run
        this.state.isWallRunning = true
        this.state.wallRunDirection = wallInfo.direction
        this.state.currentState = MovementState.WALL_RUNNING
      }

      // Apply wall run velocity
      this.state.velocity.y = Math.max(this.state.velocity.y, -2.0) // Reduce fall speed

      // Drain stamina
      const staminaCost = this.settings.wallRunStaminaCost * deltaTime
      this.drainStamina(staminaCost)
    } else if (this.state.isWallRunning) {
      // End wall run
      this.state.isWallRunning = false
      this.state.wallRunDirection = null
    }
  }

  private detectWall(): WallInfo | null {
    if (!this.scene || !this.playerMesh) {
      return null
    }

    const directions = [
      new THREE.Vector3(1, 0, 0),  // Right
      new THREE.Vector3(-1, 0, 0)  // Left
    ]

    for (const dir of directions) {
      this.raycaster.set(this.playerMesh.position, dir)
      this.raycaster.far = 1.5 // Wall detection range

      const intersects = this.raycaster.intersectObjects(this.scene.children, true)

      if (intersects.length > 0 && intersects[0].distance < 1.0) {
        return {
          normal: intersects[0].face?.normal.clone() || new THREE.Vector3(0, 0, 1),
          direction: dir.x > 0 ? WallRunDirection.RIGHT : WallRunDirection.LEFT,
          isClimbable: true,
          distance: intersects[0].distance,
          contactPoint: intersects[0].point
        }
      }
    }

    return null
  }

  // ============================================================
  // ADVANCED MOVEMENT - MANTLE & VAULT
  // ============================================================

  private updateMantleVault(deltaTime: number): void {
    if (!this.settings.enableMantling && !this.settings.enableVaulting) {
      return
    }

    // Check for obstacle
    const obstacle = this.detectObstacle()

    if (obstacle) {
      if (obstacle.height <= this.settings.autoMantleHeight && this.settings.enableMantling) {
        this.startMantle(obstacle)
      } else if (obstacle.height <= this.settings.vaultHeightMax && this.settings.enableVaulting) {
        this.startVault(obstacle)
      }
    }

    // Update active mantle/vault
    if (this.state.isMantling) {
      this.updateMantle(deltaTime)
    } else if (this.state.isVaulting) {
      this.updateVault(deltaTime)
    }
  }

  private detectObstacle(): ObstacleTarget | null {
    if (!this.scene || !this.playerMesh) {
      return null
    }

    const forwardDir = new THREE.Vector3(0, 0, -1)
    forwardDir.applyEuler(this.playerMesh.rotation)

    this.raycaster.set(this.playerMesh.position, forwardDir)
    this.raycaster.far = 1.5

    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0 && intersects[0].distance < 1.2) {
      const hitPoint = intersects[0].point
      const height = hitPoint.y - this.playerMesh.position.y

      if (height > 0.5 && height <= this.settings.vaultHeightMax) {
        return {
          position: hitPoint,
          height,
          edge: hitPoint.clone().add(new THREE.Vector3(0, height, 0)),
          normal: intersects[0].face?.normal || new THREE.Vector3(0, 1, 0)
        }
      }
    }

    return null
  }

  private startMantle(obstacle: ObstacleTarget): void {
    this.state.isMantling = true
    this.state.mantleProgress = 0
    this.state.currentState = MovementState.MANTLING
    this.mantleStartTime = Date.now()
  }

  private startVault(obstacle: ObstacleTarget): void {
    this.state.isVaulting = true
    this.state.vaultProgress = 0
    this.state.currentState = MovementState.VAULTING
    this.vaultStartTime = Date.now()
  }

  private updateMantle(deltaTime: number): void {
    const elapsed = (Date.now() - this.mantleStartTime) / 1000
    this.state.mantleProgress = Math.min(1.0, elapsed / this.settings.mantleDuration)

    if (this.state.mantleProgress >= 1.0) {
      this.state.isMantling = false
      this.state.mantleProgress = 0
      this.state.currentState = MovementState.IDLE
    }
  }

  private updateVault(deltaTime: number): void {
    const elapsed = (Date.now() - this.vaultStartTime) / 1000
    this.state.vaultProgress = Math.min(1.0, elapsed / this.settings.vaultDuration)

    if (this.state.vaultProgress >= 1.0) {
      this.state.isVaulting = false
      this.state.vaultProgress = 0
      this.state.currentState = MovementState.IDLE
    }
  }

  // ============================================================
  // ADVANCED MOVEMENT - GLIDING
  // ============================================================

  private updateGliding(deltaTime: number): void {
    if (!this.settings.enableGliding) {
      return
    }

    if (this.state.isGliding) {
      // Apply glide fall speed
      this.state.velocity.y = Math.max(this.state.velocity.y, -this.settings.glideFallSpeed)
    }
  }

  public startGlide(): boolean {
    if (!this.settings.enableGliding || this.state.isGrounded) {
      return false
    }

    if (!canPerformAction(this.state, 'glide')) {
      return false
    }

    this.state.isGliding = true
    this.state.currentState = MovementState.GLIDING
    return true
  }

  public stopGlide(): void {
    this.state.isGliding = false
  }

  // ============================================================
  // MOVEMENT ABILITIES
  // ============================================================

  public activateAbility(abilityId: string): boolean {
    const ability = getMovementAbilityById(abilityId)

    if (!ability) {
      console.warn(`Movement ability "${abilityId}" not found`)
      return false
    }

    // Check cooldown
    const lastUse = this.lastAbilityUse.get(abilityId) || 0
    const timeSinceUse = Date.now() - lastUse

    if (timeSinceUse < ability.cooldown) {
      return false
    }

    // Check stamina
    if (!hasEnoughStamina(this.state.stamina, ability.staminaCost, this.settings)) {
      return false
    }

    // Activate ability
    this.activeAbility = ability
    this.abilityStartTime = Date.now()
    this.lastAbilityUse.set(abilityId, Date.now())

    // Drain stamina
    this.drainStamina(ability.staminaCost)

    // Apply ability effects
    this.applyAbilityEffects(ability)

    return true
  }

  private applyAbilityEffects(ability: MovementAbilityData): void {
    // Speed multiplier
    if (ability.speedMultiplier) {
      this.settings.speedMultiplier *= ability.speedMultiplier
    }

    // Stamina cost multiplier
    if (ability.staminaCostMultiplier) {
      this.settings.staminaCostMultiplier *= ability.staminaCostMultiplier
    }

    // Air control multiplier
    if (ability.airControlMultiplier) {
      this.settings.airControlMultiplier *= ability.airControlMultiplier
    }

    // Enable/disable features
    if (ability.enableParkour !== undefined) {
      this.settings.enableParkour = ability.enableParkour
    }
    if (ability.enableWallClimbing !== undefined) {
      this.settings.enableWallClimbing = ability.enableWallClimbing
    }
    if (ability.enableMantling !== undefined) {
      this.settings.enableMantling = ability.enableMantling
    }
    if (ability.enableVaulting !== undefined) {
      this.settings.enableVaulting = ability.enableVaulting
    }
    if (ability.enableDoubleJump !== undefined) {
      this.settings.enableDoubleJump = ability.enableDoubleJump
    }
    if (ability.enableGliding !== undefined) {
      this.settings.enableGliding = ability.enableGliding
    }
  }

  private updateAbility(deltaTime: number): void {
    if (!this.activeAbility) {
      return
    }

    const elapsed = Date.now() - this.abilityStartTime

    if (elapsed >= this.activeAbility.duration) {
      this.deactivateAbility()
    }
  }

  private deactivateAbility(): void {
    if (!this.activeAbility) {
      return
    }

    // Reset settings to defaults
    this.settings = { ...DEFAULT_MOVEMENT_SETTINGS }
    this.activeAbility = null
  }

  // ============================================================
  // STAMINA
  // ============================================================

  public getStamina(): number {
    return this.state.stamina
  }

  public setStamina(value: number): void {
    this.state.stamina = Math.max(0, Math.min(this.state.maxStamina, value))
  }

  public regenerateStamina(deltaTime: number): void {
    if (this.state.stamina < this.state.maxStamina) {
      const regen = this.settings.staminaRegenRate * deltaTime
      this.setStamina(this.state.stamina + regen)
    }
  }

  public drainStamina(amount: number): void {
    this.setStamina(this.state.stamina - amount)
  }

  // ============================================================
  // PHYSICS
  // ============================================================

  public applyForce(force: THREE.Vector3): void {
    if (!this.physicsEnabled) {
      return
    }

    this.state.velocity.add(force)
  }

  public applyImpulse(impulse: THREE.Vector3): void {
    if (!this.physicsEnabled) {
      return
    }

    this.state.velocity.add(impulse)
  }

  public setGravity(gravity: number): void {
    this.gravity = gravity
  }

  public setPhysicsEnabled(enabled: boolean): void {
    this.physicsEnabled = enabled
  }

  // ============================================================
  // GROUND CHECK
  // ============================================================

  public checkGrounded(): boolean {
    if (!this.scene || !this.playerMesh) {
      return this.state.isGrounded
    }

    const downDir = new THREE.Vector3(0, -1, 0)
    this.raycaster.set(this.playerMesh.position, downDir)
    this.raycaster.far = 0.2

    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0) {
      const wasInAir = !this.state.isGrounded
      this.state.isGrounded = true
      this.state.isJumping = false
      this.state.isDoubleJumping = false
      this.state.airTime = 0

      if (intersects[0].face) {
        this.groundNormal = intersects[0].face.normal.clone()
      }

      // Landing event
      if (wasInAir) {
        this.landCallbacks.forEach(cb => cb())
      }

      return true
    } else {
      this.state.isGrounded = false
      this.groundNormal = null
      return false
    }
  }

  public getGroundNormal(): THREE.Vector3 | null {
    return this.groundNormal ? this.groundNormal.clone() : null
  }

  // ============================================================
  // EVENTS & LISTENERS
  // ============================================================

  public onSprintChange(callback: SprintCallback): () => void {
    this.sprintCallbacks.push(callback)
    return () => {
      const index = this.sprintCallbacks.indexOf(callback)
      if (index > -1) {
        this.sprintCallbacks.splice(index, 1)
      }
    }
  }

  public onCrouchChange(callback: CrouchCallback): () => void {
    this.crouchCallbacks.push(callback)
    return () => {
      const index = this.crouchCallbacks.indexOf(callback)
      if (index > -1) {
        this.crouchCallbacks.splice(index, 1)
      }
    }
  }

  public onJump(callback: MovementCallback): () => void {
    this.jumpCallbacks.push(callback)
    return () => {
      const index = this.jumpCallbacks.indexOf(callback)
      if (index > -1) {
        this.jumpCallbacks.splice(index, 1)
      }
    }
  }

  public onLand(callback: MovementCallback): () => void {
    this.landCallbacks.push(callback)
    return () => {
      const index = this.landCallbacks.indexOf(callback)
      if (index > -1) {
        this.landCallbacks.splice(index, 1)
      }
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================

  public update(deltaTime: number): void {
    // Update ground check
    this.checkGrounded()

    // Update air time
    if (!this.state.isGrounded) {
      this.state.airTime += deltaTime
    }

    // Apply gravity
    if (this.physicsEnabled && !this.state.isGrounded) {
      this.state.velocity.y += this.gravity * deltaTime
    }

    // Update stamina
    if (this.state.isSprinting) {
      const staminaCost = this.settings.sprintStaminaCost * deltaTime
      this.drainStamina(staminaCost)

      // Stop sprinting if stamina depleted
      if (this.state.stamina <= 0) {
        this.sprint(false)
      }
    } else {
      this.regenerateStamina(deltaTime)
    }

    // Update slide
    if (this.state.isSliding) {
      const elapsed = (Date.now() - this.slideStartTime) / 1000
      if (elapsed >= this.settings.slideDuration) {
        this.state.isSliding = false
        this.state.isCrouching = false
        this.state.currentState = MovementState.IDLE
      }
    }

    // Update advanced movement
    this.updateWallRun(deltaTime)
    this.updateMantleVault(deltaTime)
    this.updateGliding(deltaTime)
    this.updateAbility(deltaTime)

    // Update last action time
    this.state.lastAction = Date.now()
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  public reset(): void {
    this.state = createDefaultMovementState()
    this.settings = { ...DEFAULT_MOVEMENT_SETTINGS }
    this.activeAbility = null
    this.lastAbilityUse.clear()
  }

  public destroy(): void {
    // Clear all callbacks
    this.sprintCallbacks = []
    this.crouchCallbacks = []
    this.jumpCallbacks = []
    this.landCallbacks = []

    // Clear references
    this.scene = null
    this.playerMesh = null
    this.activeAbility = null
    this.lastAbilityUse.clear()
  }
}
