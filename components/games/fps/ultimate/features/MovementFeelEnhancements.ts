/**
 * 🏃 MOVEMENT FEEL ENHANCEMENTS
 * 
 * Professional movement feel für FPS games
 * - Acceleration Curves
 * - Air Control
 * - Camera Bob
 * - Ground Friction
 */

import * as THREE from 'three'

// =============================================================================
// ACCELERATION SYSTEM
// =============================================================================

export interface AccelerationConfig {
  maxSpeed: number
  accelerationRate: number // Units per second²
  decelerationRate: number // Units per second²
  airAccelerationMultiplier: number // 0-1 (how much control in air)
}

export class AccelerationSystem {
  private velocity: THREE.Vector3 = new THREE.Vector3()
  private targetVelocity: THREE.Vector3 = new THREE.Vector3()
  private config: AccelerationConfig

  constructor(config?: Partial<AccelerationConfig>) {
    this.config = {
      maxSpeed: 6,
      accelerationRate: 30,
      decelerationRate: 40,
      airAccelerationMultiplier: 0.3,
      ...config
    }
  }

  /**
   * Set target velocity (from input)
   */
  setTargetVelocity(direction: THREE.Vector3, isGrounded: boolean): void {
    this.targetVelocity.copy(direction).multiplyScalar(
      this.config.maxSpeed
    )
    
    // Reduce control in air
    if (!isGrounded) {
      this.targetVelocity.multiplyScalar(this.config.airAccelerationMultiplier)
    }
  }

  /**
   * Update velocity with acceleration
   */
  update(deltaTime: number, isGrounded: boolean): THREE.Vector3 {
    // Determine if accelerating or decelerating
    const targetSpeed = this.targetVelocity.length()
    const currentSpeed = this.velocity.length()
    
    if (targetSpeed > 0.01) {
      // Accelerating towards target
      const rate = isGrounded ? this.config.accelerationRate : this.config.accelerationRate * this.config.airAccelerationMultiplier
      
      this.velocity.lerp(this.targetVelocity, Math.min(rate * deltaTime, 1.0))
    } else {
      // Decelerating to stop
      const decayFactor = Math.exp(-this.config.decelerationRate * deltaTime)
      this.velocity.multiplyScalar(decayFactor)
      
      // Stop completely if very slow
      if (this.velocity.length() < 0.01) {
        this.velocity.set(0, 0, 0)
      }
    }
    
    return this.velocity.clone()
  }

  /**
   * Get current velocity
   */
  getVelocity(): THREE.Vector3 {
    return this.velocity.clone()
  }

  /**
   * Reset velocity
   */
  reset(): void {
    this.velocity.set(0, 0, 0)
    this.targetVelocity.set(0, 0, 0)
  }
}

// =============================================================================
// AIR CONTROL SYSTEM
// =============================================================================

export class AirControlSystem {
  private airStrafeSpeed: number = 0.5 // Speed in air
  private airFriction: number = 0.98 // Air resistance (0-1)

  /**
   * Apply air control to velocity
   */
  applyAirControl(
    velocity: THREE.Vector3,
    inputDirection: THREE.Vector3,
    deltaTime: number
  ): THREE.Vector3 {
    // Apply strafe acceleration
    const strafeForce = inputDirection.clone().multiplyScalar(this.airStrafeSpeed * deltaTime)
    velocity.add(strafeForce)
    
    // Apply air friction
    velocity.multiplyScalar(this.airFriction)
    
    return velocity
  }
}

// =============================================================================
// CAMERA BOB SYSTEM
// =============================================================================

export class CameraBobSystem {
  private bobAmount: number = 0.02 // Vertical bob amount
  private bobFrequency: number = 10 // Bob frequency (Hz)
  private bobPhase: number = 0 // Current phase
  private isActive: boolean = false
  private currentBobOffset: THREE.Vector3 = new THREE.Vector3()

  constructor(bobAmount: number = 0.02, bobFrequency: number = 10) {
    this.bobAmount = bobAmount
    this.bobFrequency = bobFrequency
  }

  /**
   * Update camera bob
   */
  update(
    deltaTime: number,
    isMoving: boolean,
    movementSpeed: number,
    isGrounded: boolean
  ): THREE.Vector3 {
    if (!isGrounded) {
      // Reset bob in air
      this.bobPhase = 0
      this.currentBobOffset.set(0, 0, 0)
      return this.currentBobOffset
    }

    if (isMoving && movementSpeed > 0.1) {
      this.isActive = true
      
      // Update phase
      this.bobPhase += this.bobFrequency * deltaTime * movementSpeed
      
      // Calculate bob offset
      const verticalBob = Math.sin(this.bobPhase) * this.bobAmount
      const horizontalBob = Math.cos(this.bobPhase * 0.5) * this.bobAmount * 0.5
      
      this.currentBobOffset.set(
        horizontalBob,
        verticalBob,
        0
      )
    } else {
      // Smooth return to center
      this.currentBobOffset.multiplyScalar(0.95)
      
      if (this.currentBobOffset.length() < 0.001) {
        this.currentBobOffset.set(0, 0, 0)
        this.bobPhase = 0
        this.isActive = false
      }
    }
    
    return this.currentBobOffset.clone()
  }

  /**
   * Get current bob offset
   */
  getBobOffset(): THREE.Vector3 {
    return this.currentBobOffset.clone()
  }

  /**
   * Reset bob
   */
  reset(): void {
    this.bobPhase = 0
    this.currentBobOffset.set(0, 0, 0)
    this.isActive = false
  }
}

// =============================================================================
// GROUND FRICTION SYSTEM
// =============================================================================

export class GroundFrictionSystem {
  private frictionCoefficient: number = 0.85 // 0-1 (higher = more friction)

  /**
   * Apply ground friction to velocity
   */
  applyFriction(
    velocity: THREE.Vector3,
    isGrounded: boolean,
    deltaTime: number
  ): THREE.Vector3 {
    if (!isGrounded) return velocity

    // Apply friction (exponential decay)
    const frictionFactor = Math.pow(this.frictionCoefficient, deltaTime * 60)
    velocity.x *= frictionFactor
    velocity.z *= frictionFactor
    
    // Stop completely if very slow
    if (Math.abs(velocity.x) < 0.01) velocity.x = 0
    if (Math.abs(velocity.z) < 0.01) velocity.z = 0
    
    return velocity
  }

  /**
   * Set friction coefficient
   */
  setFriction(coefficient: number): void {
    this.frictionCoefficient = THREE.MathUtils.clamp(coefficient, 0, 1)
  }
}

// =============================================================================
// MAIN MOVEMENT FEEL MANAGER
// =============================================================================

export class MovementFeelManager {
  private acceleration: AccelerationSystem
  private airControl: AirControlSystem
  private cameraBob: CameraBobSystem
  private groundFriction: GroundFrictionSystem
  
  // State tracking
  private lastMoveDirection: THREE.Vector3 = new THREE.Vector3()
  private lastMovementSpeed: number = 0

  constructor() {
    this.acceleration = new AccelerationSystem()
    this.airControl = new AirControlSystem()
    this.cameraBob = new CameraBobSystem()
    this.groundFriction = new GroundFrictionSystem()
  }

  /**
   * Process movement input with feel enhancements
   */
  processMovement(
    inputDirection: THREE.Vector3,
    isGrounded: boolean,
    deltaTime: number
  ): {
    velocity: THREE.Vector3
    cameraBobOffset: THREE.Vector3
  } {
    // Set target velocity from input
    this.acceleration.setTargetVelocity(inputDirection, isGrounded)
    
    // Update velocity with acceleration
    let velocity = this.acceleration.update(deltaTime, isGrounded)
    
    // Apply air control if not grounded
    if (!isGrounded && inputDirection.length() > 0) {
      velocity = this.airControl.applyAirControl(velocity, inputDirection, deltaTime)
    }
    
    // Apply ground friction
    if (isGrounded) {
      velocity = this.groundFriction.applyFriction(velocity, isGrounded, deltaTime)
    }
    
    // Calculate camera bob
    const isMoving = velocity.length() > 0.1
    const movementSpeed = velocity.length()
    const cameraBobOffset = this.cameraBob.update(deltaTime, isMoving, movementSpeed, isGrounded)
    
    // Store state
    this.lastMoveDirection.copy(inputDirection)
    this.lastMovementSpeed = movementSpeed
    
    return {
      velocity,
      cameraBobOffset
    }
  }

  /**
   * Get camera bob offset
   */
  getCameraBobOffset(): THREE.Vector3 {
    return this.cameraBob.getBobOffset()
  }

  /**
   * Reset all systems
   */
  reset(): void {
    this.acceleration.reset()
    this.cameraBob.reset()
  }
}

