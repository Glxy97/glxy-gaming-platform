/**
 * Movement Controller Interface
 * 
 * @module IMovementController
 * @description Interface for managing player movement and physics
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { Vector3 } from 'three'

/**
 * Interface for Movement Control
 * 
 * @interface IMovementController
 * @description Defines the contract for player movement, sprint, slide, crouch, etc.
 * 
 * @example
 * ```typescript
 * class MovementController implements IMovementController {
 *   // Implementation...
 * }
 * ```
 */
export interface IMovementController {
  // ============================================================================
  // PROPERTIES
  // ============================================================================
  
  /**
   * Get current movement speed
   * @readonly
   */
  readonly speed: number
  
  /**
   * Get current velocity
   * @readonly
   */
  readonly velocity: Vector3
  
  /**
   * Get base movement speed
   * @readonly
   */
  readonly baseSpeed: number
  
  /**
   * Get current stamina (0-100)
   * @readonly
   */
  readonly stamina: number
  
  // ============================================================================
  // MOVEMENT STATE
  // ============================================================================
  
  /**
   * Check if sprinting
   * @readonly
   */
  readonly isSprinting: boolean
  
  /**
   * Check if crouching
   * @readonly
   */
  readonly isCrouching: boolean
  
  /**
   * Check if sliding
   * @readonly
   */
  readonly isSliding: boolean
  
  /**
   * Check if jumping
   * @readonly
   */
  readonly isJumping: boolean
  
  /**
   * Check if in air
   * @readonly
   */
  readonly isInAir: boolean
  
  /**
   * Check if grounded
   * @readonly
   */
  readonly isGrounded: boolean
  
  // ============================================================================
  // BASIC MOVEMENT
  // ============================================================================
  
  /**
   * Move in direction
   * 
   * @param direction - Movement direction (normalized)
   * @param deltaTime - Time since last update (seconds)
   * 
   * @example
   * ```typescript
   * // Move forward
   * controller.move(new Vector3(0, 0, -1), 0.016)
   * ```
   */
  move(direction: Vector3, deltaTime: number): void
  
  /**
   * Stop all movement
   */
  stop(): void
  
  /**
   * Set movement speed multiplier
   * 
   * @param multiplier - Speed multiplier (1.0 = normal)
   */
  setSpeedMultiplier(multiplier: number): void
  
  // ============================================================================
  // SPRINT
  // ============================================================================
  
  /**
   * Start sprinting
   * 
   * @returns True if sprint started successfully
   * 
   * @remarks
   * Sprint may fail if:
   * - Stamina is too low
   * - Currently reloading
   * - Currently crouching
   */
  sprint(enable: boolean): boolean
  
  /**
   * Check if can sprint
   * 
   * @returns True if sprint is possible
   */
  canSprint(): boolean
  
  // ============================================================================
  // CROUCH
  // ============================================================================
  
  /**
   * Start/stop crouching
   * 
   * @param enable - Whether to crouch
   * @returns True if crouch state changed
   */
  crouch(enable: boolean): boolean
  
  /**
   * Toggle crouch
   */
  toggleCrouch(): void
  
  // ============================================================================
  // SLIDE
  // ============================================================================
  
  /**
   * Initiate slide
   * 
   * @returns True if slide started
   * 
   * @remarks
   * Slide requirements:
   * - Must be sprinting
   * - Must be grounded
   * - Must have minimum velocity
   */
  slide(): boolean
  
  /**
   * Check if can slide
   * 
   * @returns True if slide is possible
   */
  canSlide(): boolean
  
  // ============================================================================
  // JUMP
  // ============================================================================
  
  /**
   * Jump
   * 
   * @returns True if jump succeeded
   * 
   * @remarks
   * Jump requirements:
   * - Must be grounded
   * - Not currently jumping
   */
  jump(): boolean
  
  /**
   * Check if can jump
   * 
   * @returns True if jump is possible
   */
  canJump(): boolean
  
  // ============================================================================
  // STAMINA
  // ============================================================================
  
  /**
   * Get stamina percentage (0-100)
   * 
   * @returns Current stamina
   */
  getStamina(): number
  
  /**
   * Set stamina
   * 
   * @param value - Stamina value (0-100)
   */
  setStamina(value: number): void
  
  /**
   * Regenerate stamina
   * 
   * @param deltaTime - Time since last update (seconds)
   */
  regenerateStamina(deltaTime: number): void
  
  /**
   * Drain stamina
   * 
   * @param amount - Amount to drain
   */
  drainStamina(amount: number): void
  
  // ============================================================================
  // PHYSICS
  // ============================================================================
  
  /**
   * Apply force to player
   * 
   * @param force - Force vector
   * 
   * @example
   * ```typescript
   * // Knockback
   * controller.applyForce(new Vector3(0, 5, 10))
   * ```
   */
  applyForce(force: Vector3): void
  
  /**
   * Apply impulse to player
   * 
   * @param impulse - Impulse vector
   */
  applyImpulse(impulse: Vector3): void
  
  /**
   * Set gravity
   * 
   * @param gravity - Gravity value (default: -9.81)
   */
  setGravity(gravity: number): void
  
  /**
   * Enable/disable physics
   * 
   * @param enabled - Whether physics is enabled
   */
  setPhysicsEnabled(enabled: boolean): void
  
  // ============================================================================
  // GROUND CHECK
  // ============================================================================
  
  /**
   * Check if player is grounded
   * 
   * @returns True if player is on ground
   */
  checkGrounded(): boolean
  
  /**
   * Get ground normal
   * 
   * @returns Ground normal vector
   */
  getGroundNormal(): Vector3 | null
  
  // ============================================================================
  // EVENTS & LISTENERS
  // ============================================================================
  
  /**
   * Register listener for sprint state change
   * 
   * @param callback - Function to call when sprint state changes
   * @returns Unsubscribe function
   */
  onSprintChange(callback: (isSprinting: boolean) => void): () => void
  
  /**
   * Register listener for crouch state change
   * 
   * @param callback - Function to call when crouch state changes
   * @returns Unsubscribe function
   */
  onCrouchChange(callback: (isCrouching: boolean) => void): () => void
  
  /**
   * Register listener for jump event
   * 
   * @param callback - Function to call when player jumps
   * @returns Unsubscribe function
   */
  onJump(callback: () => void): () => void
  
  /**
   * Register listener for landing event
   * 
   * @param callback - Function to call when player lands
   * @returns Unsubscribe function
   */
  onLand(callback: () => void): () => void
  
  // ============================================================================
  // UTILITIES
  // ============================================================================
  
  /**
   * Update movement (call every frame)
   * 
   * @param deltaTime - Time since last update (seconds)
   */
  update(deltaTime: number): void
  
  /**
   * Reset to default state
   */
  reset(): void
  
  /**
   * Cleanup resources
   */
  destroy(): void
}

