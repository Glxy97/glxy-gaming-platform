// @ts-nocheck
/**
 * GLXY Enhanced Movement Controller
 * Advanced physics-based movement system with smooth controls and improved mechanics
 */

import * as THREE from 'three'

export interface MovementConfig {
  // Base movement speeds
  walkSpeed: number
  runSpeed: number
  sprintSpeed: number

  // Acceleration and friction
  acceleration: number
  deceleration: number
  airControl: number
  friction: number

  // Jump mechanics
  jumpHeight: number
  jumpVelocity: number
  gravity: number
  fallMultiplier: number
  lowJumpMultiplier: number

  // Coyote time and jump buffering
  coyoteTime: number
  jumpBufferTime: number

  // Ground detection
  groundCheckDistance: number
  groundCheckRadius: number
  slopeLimit: number

  // Advanced movement
  wallJumpEnabled: boolean
  wallJumpForce: THREE.Vector3
  doubleJumpEnabled: boolean
  doubleJumpHeight: number

  // Dash mechanics
  dashEnabled: boolean
  dashSpeed: number
  dashDuration: number
  dashCooldown: number

  // Stamina system
  staminaEnabled: boolean
  maxStamina: number
  staminaRunCost: number
  staminaSprintCost: number
  staminaJumpCost: number
  staminaDashCost: number
  staminaRegenRate: number
}

export interface MovementState {
  // Current velocities
  velocity: THREE.Vector3
  horizontalVelocity: THREE.Vector3
  verticalVelocity: THREE.Vector3

  // Ground state
  isGrounded: boolean
  groundNormal: THREE.Vector3
  groundPoint: THREE.Vector3
  slopeAngle: number

  // Movement states
  isWalking: boolean
  isRunning: boolean
  isSprinting: boolean
  isJumping: boolean
  isFalling: boolean
  isSliding: boolean
  isWallSliding: boolean

  // Advanced states
  canDoubleJump: boolean
  isDashing: boolean
  dashTimer: number
  dashCooldownTimer: number

  // Stamina
  currentStamina: number
  isStaminaDepleted: boolean

  // Timers
  coyoteTimer: number
  jumpBufferTimer: number
  lastJumpTime: number
}

export class EnhancedMovementController {
  private config: MovementConfig
  private state: MovementState
  private mesh: THREE.Mesh | THREE.Group

  // Input tracking
  private inputDirection = new THREE.Vector3()
  private rawInput = new THREE.Vector3()

  // Physics calculation helpers
  private moveDirection = new THREE.Vector3()
  private targetVelocity = new THREE.Vector3()
  private accelerationVector = new THREE.Vector3()

  // Collision detection
  private raycaster = new THREE.Raycaster()
  private groundCheckSphere = new THREE.Sphere(new THREE.Vector3(), 0.5)
  private groundContactPoints: THREE.Vector3[] = []

  constructor(mesh: THREE.Mesh | THREE.Group, config: Partial<MovementConfig> = {}) {
    this.mesh = mesh

    // Default configuration
    this.config = {
      walkSpeed: 3,
      runSpeed: 6,
      sprintSpeed: 10,
      acceleration: 20,
      deceleration: 25,
      airControl: 0.3,
      friction: 10,
      jumpHeight: 2.2,
      jumpVelocity: 8,
      gravity: 20,
      fallMultiplier: 3,
      lowJumpMultiplier: 2.5,
      coyoteTime: 0.15,
      jumpBufferTime: 0.2,
      groundCheckDistance: 0.3,
      groundCheckRadius: 0.3,
      slopeLimit: 45,
      wallJumpEnabled: true,
      wallJumpForce: new THREE.Vector3(8, 12, 0),
      doubleJumpEnabled: true,
      doubleJumpHeight: 3,
      dashEnabled: true,
      dashSpeed: 20,
      dashDuration: 0.2,
      dashCooldown: 1.5,
      staminaEnabled: true,
      maxStamina: 100,
      staminaRunCost: 10,
      staminaSprintCost: 25,
      staminaJumpCost: 15,
      staminaDashCost: 30,
      staminaRegenRate: 20,
      ...config
    }

    // Initialize state
    this.state = {
      velocity: new THREE.Vector3(),
      horizontalVelocity: new THREE.Vector3(),
      verticalVelocity: new THREE.Vector3(),
      isGrounded: false,
      groundNormal: new THREE.Vector3(0, 1, 0),
      groundPoint: new THREE.Vector3(),
      slopeAngle: 0,
      isWalking: false,
      isRunning: false,
      isSprinting: false,
      isJumping: false,
      isFalling: false,
      isSliding: false,
      isWallSliding: false,
      canDoubleJump: true,
      isDashing: false,
      dashTimer: 0,
      dashCooldownTimer: 0,
      currentStamina: this.config.maxStamina,
      isStaminaDepleted: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      lastJumpTime: 0
    }
  }

  /**
   * Set movement input from player controls
   */
  public setMovementInput(x: number, z: number): void {
    this.rawInput.set(x, 0, z)

    // Normalize diagonal movement to prevent faster diagonal movement
    if (this.rawInput.length() > 1) {
      this.rawInput.normalize()
    }

    this.updateInputDirection()
  }

  /**
   * Update input direction based on camera orientation
   */
  private updateInputDirection(): void {
    if (this.rawInput.length() === 0) {
      this.inputDirection.set(0, 0, 0)
      return
    }

    // Get camera orientation (assuming camera is available globally or passed in)
    const camera = this.getCamera()
    if (camera) {
      // Calculate forward and right vectors relative to camera
      const forward = new THREE.Vector3()
      const right = new THREE.Vector3()

      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()

      right.crossVectors(forward, new THREE.Vector3(0, 1, 0))

      // Combine input with camera direction
      this.inputDirection.copy(forward).multiplyScalar(-this.rawInput.z)
      this.inputDirection.addScaledVector(right, this.rawInput.x)
      this.inputDirection.normalize()
    } else {
      // Fallback to world space input
      this.inputDirection.copy(this.rawInput)
    }
  }

  /**
   * Get the active camera (implementation depends on your setup)
   */
  private getCamera(): THREE.Camera | null {
    // This needs to be adapted based on your game's camera system
    return (window as any).camera || null
  }

  /**
   * Request a jump
   */
  public jump(): void {
    this.state.jumpBufferTimer = this.config.jumpBufferTime
  }

  /**
   * Request a dash
   */
  public dash(): void {
    if (!this.config.dashEnabled) return
    if (this.state.dashCooldownTimer > 0) return
    if (this.config.staminaEnabled && this.state.currentStamina < this.config.staminaDashCost) return

    this.state.isDashing = true
    this.state.dashTimer = this.config.dashDuration
    this.state.dashCooldownTimer = this.config.dashCooldown

    if (this.config.staminaEnabled) {
      this.state.currentStamina -= this.config.staminaDashCost
    }

    // Apply dash impulse in input direction
    if (this.inputDirection.length() > 0) {
      this.state.velocity.copy(this.inputDirection).multiplyScalar(this.config.dashSpeed)
    } else {
      // Dash forward if no input
      const forward = new THREE.Vector3(0, 0, -1)
      if (this.getCamera()) {
        this.getCamera()!.getWorldDirection(forward)
        forward.y = 0
        forward.normalize()
      }
      this.state.velocity.copy(forward).multiplyScalar(this.config.dashSpeed)
    }
  }

  /**
   * Toggle sprint
   */
  public setSprinting(sprinting: boolean): void {
    this.state.isSprinting = sprinting && !this.state.isStaminaDepleted
  }

  /**
   * Main update loop
   */
  public update(deltaTime: number): void {
    // Update timers
    this.updateTimers(deltaTime)

    // Update ground detection
    this.updateGroundDetection()

    // Handle jump input and coyote time
    this.handleJumpInput()

    // Calculate target velocity based on input and state
    this.calculateTargetVelocity()

    // Apply acceleration/deceleration
    this.applyAcceleration(deltaTime)

    // Apply gravity
    this.applyGravity(deltaTime)

    // Handle sliding on slopes
    this.handleSliding()

    // Update position
    this.updatePosition(deltaTime)

    // Update stamina
    this.updateStamina(deltaTime)

    // Update animation states
    this.updateAnimationStates()
  }

  /**
   * Update all timers
   */
  private updateTimers(deltaTime: number): void {
    this.state.coyoteTimer = Math.max(0, this.state.coyoteTimer - deltaTime)
    this.state.jumpBufferTimer = Math.max(0, this.state.jumpBufferTimer - deltaTime)
    this.state.dashTimer = Math.max(0, this.state.dashTimer - deltaTime)
    this.state.dashCooldownTimer = Math.max(0, this.state.dashCooldownTimer - deltaTime)

    if (this.state.dashTimer <= 0) {
      this.state.isDashing = false
    }
  }

  /**
   * Check ground detection with multiple contact points
   */
  private updateGroundDetection(): void {
    const position = this.mesh.position
    this.groundContactPoints = []

    // Check multiple points around the character for more reliable ground detection
    const checkPoints = [
      new THREE.Vector3(0, 0, 0), // Center
      new THREE.Vector3(0.2, 0, 0.2), // Front-right
      new THREE.Vector3(-0.2, 0, 0.2), // Front-left
      new THREE.Vector3(0.2, 0, -0.2), // Back-right
      new THREE.Vector3(-0.2, 0, -0.2) // Back-left
    ]

    let wasGrounded = this.state.isGrounded
    this.state.isGrounded = false
    this.state.groundPoint.set(0, 0, 0)
    this.state.groundNormal.set(0, 1, 0)

    for (const point of checkPoints) {
      const checkPos = position.clone().add(point)
      this.raycaster.set(checkPos, new THREE.Vector3(0, -1, 0))

      const intersects = this.raycaster.intersectObjects(this.getGroundColliders())

      if (intersects.length > 0 && intersects[0].distance <= this.config.groundCheckDistance) {
        this.state.isGrounded = true
        this.state.groundPoint.copy(intersects[0].point)
        this.state.groundNormal.copy(intersects[0].face!.normal)
        this.groundContactPoints.push(intersects[0].point)

        // Calculate slope angle
        this.state.slopeAngle = THREE.MathUtils.radToDeg(
          Math.acos(this.state.groundNormal.dot(new THREE.Vector3(0, 1, 0)))
        )
        break
      }
    }

    // Update coyote timer when leaving ground
    if (wasGrounded && !this.state.isGrounded) {
      this.state.coyoteTimer = this.config.coyoteTime
    }

    // Reset jump state when landing
    if (!wasGrounded && this.state.isGrounded) {
      this.state.isJumping = false
      this.state.isFalling = false
      this.state.canDoubleJump = true
      this.state.isWallSliding = false

      // Land with small impact effect
      if (this.state.verticalVelocity.y < -5) {
        this.onLandImpact()
      }
    }
  }

  /**
   * Get ground colliders (implementation depends on your game)
   */
  private getGroundColliders(): THREE.Object3D[] {
    // This should return all objects that can be considered ground
    return (window as any).groundColliders || []
  }

  /**
   * Handle jump input with coyote time and buffering
   */
  private handleJumpInput(): void {
    if (this.state.jumpBufferTimer > 0) {
      const canJump = this.state.isGrounded || this.state.coyoteTimer > 0

      if (canJump || (this.config.doubleJumpEnabled && !this.state.canDoubleJump)) {
        this.performJump()
        this.state.jumpBufferTimer = 0
      }
    }
  }

  /**
   * Execute jump with varying heights based on input
   */
  private performJump(): void {
    if (this.config.staminaEnabled && this.state.currentStamina < this.config.staminaJumpCost) {
      return
    }

    // Check for double jump
    if (!this.state.isGrounded && this.state.coyoteTimer <= 0 && this.config.doubleJumpEnabled && !this.state.canDoubleJump) {
      this.state.verticalVelocity.y = Math.sqrt(2 * this.config.gravity * this.config.doubleJumpHeight)
      this.state.canDoubleJump = false
      this.onDoubleJump()
      return
    }

    // Regular jump
    this.state.verticalVelocity.y = this.config.jumpVelocity
    this.state.isJumping = true
    this.state.isFalling = false
    this.state.lastJumpTime = Date.now()

    if (this.config.staminaEnabled) {
      this.state.currentStamina -= this.config.staminaJumpCost
    }

    this.onJump()
  }

  /**
   * Calculate target velocity based on input and state
   */
  private calculateTargetVelocity(): void {
    if (this.state.isDashing) {
      // During dash, ignore input
      return
    }

    this.targetVelocity.set(0, 0, 0)

    if (this.inputDirection.length() > 0) {
      let moveSpeed = this.config.walkSpeed

      // Determine movement speed based on state
      if (this.state.isSprinting && !this.state.isStaminaDepleted) {
        moveSpeed = this.config.sprintSpeed
      } else if (this.state.isRunning || this.inputDirection.length() > 0.5) {
        moveSpeed = this.config.runSpeed
      }

      this.targetVelocity.copy(this.inputDirection).multiplyScalar(moveSpeed)
    }
  }

  /**
   * Apply smooth acceleration and deceleration
   */
  private applyAcceleration(deltaTime: number): void {
    if (this.state.isDashing) {
      // Reduce dash velocity over time
      this.state.velocity.multiplyScalar(0.9)
      return
    }

    const acceleration = this.state.isGrounded ? this.config.acceleration : this.config.acceleration * this.config.airControl
    const deceleration = this.config.deceleration

    // Calculate acceleration vector
    this.accelerationVector.subVectors(this.targetVelocity, this.state.horizontalVelocity)

    if (this.accelerationVector.length() > 0.01) {
      // Apply acceleration
      const accelForce = Math.min(acceleration * deltaTime, this.accelerationVector.length())
      this.accelerationVector.normalize().multiplyScalar(accelForce)
      this.state.horizontalVelocity.add(this.accelerationVector)
    } else {
      // Apply deceleration when no input
      if (this.targetVelocity.length() === 0) {
        const decelForce = Math.min(deceleration * deltaTime, this.state.horizontalVelocity.length())
        this.state.horizontalVelocity.multiplyScalar(Math.max(0, 1 - decelForce / this.state.horizontalVelocity.length()))
      }
    }

    // Combine horizontal and vertical velocities
    this.state.velocity.x = this.state.horizontalVelocity.x
    this.state.velocity.z = this.state.horizontalVelocity.z
  }

  /**
   * Apply gravity with better falling physics
   */
  private applyGravity(deltaTime: number): void {
    if (this.state.isGrounded) {
      if (this.state.verticalVelocity.y < 0) {
        this.state.verticalVelocity.y = 0
      }
    } else {
      // Apply gravity with multipliers for better feel
      if (this.state.verticalVelocity.y < 0) {
        // Falling - apply fall multiplier for faster descent
        this.state.verticalVelocity.y -= this.config.gravity * this.config.fallMultiplier * deltaTime
      } else if (this.state.verticalVelocity.y > 0 && !this.state.isJumping) {
        // Rising after jump apex - apply low jump multiplier
        this.state.verticalVelocity.y -= this.config.gravity * this.config.lowJumpMultiplier * deltaTime
      } else {
        // Normal gravity
        this.state.verticalVelocity.y -= this.config.gravity * deltaTime
      }
    }

    this.state.velocity.y = this.state.verticalVelocity.y
  }

  /**
   * Handle sliding on steep slopes
   */
  private handleSliding(): void {
    if (!this.state.isGrounded || this.state.slopeAngle <= this.config.slopeLimit) {
      this.state.isSliding = false
      return
    }

    this.state.isSliding = true

    // Calculate slide direction
    const slideDirection = new THREE.Vector3()
    slideDirection.crossVectors(this.state.groundNormal, new THREE.Vector3(0, 1, 0))
    slideDirection.crossVectors(this.state.groundNormal, slideDirection)
    slideDirection.normalize()

    // Apply slide force
    const slideForce = Math.sin(THREE.MathUtils.degToRad(this.state.slopeAngle)) * this.config.gravity
    this.state.velocity.addScaledVector(slideDirection, slideForce * 0.016)
  }

  /**
   * Update character position
   */
  private updatePosition(deltaTime: number): void {
    // Apply velocity to position
    const movement = this.state.velocity.clone().multiplyScalar(deltaTime)
    this.mesh.position.add(movement)

    // Update mesh orientation to match movement direction
    if (this.state.horizontalVelocity.length() > 0.5 && !this.state.isDashing) {
      const lookDirection = this.state.horizontalVelocity.clone().normalize()
      lookDirection.y = 0
      this.mesh.lookAt(this.mesh.position.clone().add(lookDirection))
    }
  }

  /**
   * Update stamina system
   */
  private updateStamina(deltaTime: number): void {
    if (!this.config.staminaEnabled) return

    // Regenerate stamina when not consuming
    if (!this.state.isRunning && !this.state.isSprinting && !this.state.isJumping && !this.state.isDashing) {
      this.state.currentStamina = Math.min(
        this.config.maxStamina,
        this.state.currentStamina + this.config.staminaRegenRate * deltaTime
      )
    }

    // Consume stamina for sprinting
    if (this.state.isSprinting && this.state.isGrounded) {
      this.state.currentStamina -= this.config.staminaSprintCost * deltaTime
      if (this.state.currentStamina <= 0) {
        this.state.currentStamina = 0
        this.state.isStaminaDepleted = true
        this.state.isSprinting = false
      }
    }

    // Reset stamina depleted state when recovered
    if (this.state.isStaminaDepleted && this.state.currentStamina >= this.config.maxStamina * 0.3) {
      this.state.isStaminaDepleted = false
    }
  }

  /**
   * Update animation states
   */
  private updateAnimationStates(): void {
    const speed = this.state.horizontalVelocity.length()

    this.state.isWalking = speed > 0.1 && speed <= this.config.walkSpeed
    this.state.isRunning = speed > this.config.walkSpeed && speed <= this.config.runSpeed
    this.state.isFalling = !this.state.isGrounded && this.state.verticalVelocity.y < -1
  }

  // Event callbacks (can be overridden by game-specific code)
  protected onJump(): void {
    console.log('Jump!')
  }

  protected onDoubleJump(): void {
    console.log('Double Jump!')
  }

  protected onLandImpact(): void {
    console.log('Land!')
  }

  // Public getters for current state
  public getVelocity(): THREE.Vector3 {
    return this.state.velocity.clone()
  }

  public getIsGrounded(): boolean {
    return this.state.isGrounded
  }

  public getIsJumping(): boolean {
    return this.state.isJumping
  }

  public getIsFalling(): boolean {
    return this.state.isFalling
  }

  public getIsSprinting(): boolean {
    return this.state.isSprinting
  }

  public getIsDashing(): boolean {
    return this.state.isDashing
  }

  public getCurrentStamina(): number {
    return this.state.currentStamina
  }

  public getMaxStamina(): number {
    return this.config.maxStamina
  }

  public getMovementSpeed(): number {
    return this.state.horizontalVelocity.length()
  }

  public getGroundNormal(): THREE.Vector3 {
    return this.state.groundNormal.clone()
  }

  public getSlopeAngle(): number {
    return this.state.slopeAngle
  }

  // Public setters for configuration
  public setConfig(config: Partial<MovementConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // Reset to initial state
  public reset(): void {
    this.state.velocity.set(0, 0, 0)
    this.state.horizontalVelocity.set(0, 0, 0)
    this.state.verticalVelocity.set(0, 0, 0)
    this.state.currentStamina = this.config.maxStamina
    this.state.isStaminaDepleted = false
    this.state.isDashing = false
    this.state.dashTimer = 0
    this.state.dashCooldownTimer = 0
    this.state.canDoubleJump = true
  }

  // Cleanup
  public dispose(): void {
    // Clean up any resources
    this.groundContactPoints = []
  }
}

export default EnhancedMovementController