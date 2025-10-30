// NO @ts-nocheck - Type-safe input management
'use client'

import * as THREE from 'three'
import { MovementController } from '../movement/MovementController'
import { AdvancedMovementSystem } from './AddictionSystems/AdvancedMovementSystem'
import { FootstepManager, MovementType } from '../audio/FootstepManager'
import { ScopeSystem } from '../weapons/ScopeSystem'
import { GrenadeSystem, GrenadeType } from '../weapons/GrenadeSystem'
import { AbilitySystem } from '../characters/AbilitySystem'
import type { UltimatePlayerStats } from './UltimateFPSEngineV4'

/**
 * 🎮 INPUT MANAGER
 *
 * Centralized input handling for keyboard and mouse.
 * Extracted from UltimateFPSEngineV4 (~180 LOC)
 *
 * Responsibilities:
 * - Keyboard input (WASD, jump, crouch, etc.)
 * - Mouse input (look, shoot, aim)
 * - Player movement updates
 * - Input state management
 */
export class InputManager {
  // Input State
  private keys: Set<string> = new Set()
  private mouse: { x: number; y: number; deltaX: number; deltaY: number } = {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0
  }
  private isPointerLocked: boolean = false

  // Dependencies
  private camera: THREE.PerspectiveCamera
  private player: {
    mesh: THREE.Group
    position: THREE.Vector3
    rotation: THREE.Euler
    stats: UltimatePlayerStats
  }
  private movementController: MovementController
  private advancedMovementSystem: AdvancedMovementSystem
  private footstepManager: FootstepManager
  private scopeSystem: ScopeSystem
  private grenadeSystem: GrenadeSystem
  private abilitySystem: AbilitySystem
  private ground: THREE.Mesh
  private scene: THREE.Scene

  // Callbacks
  private onShoot: () => void
  private onReload: () => void
  private onWeaponSwitch: (index: number) => void
  private onGrenadeThrow: () => void

  // Sensitivity
  private mouseSensitivity: number = 0.002

  constructor(deps: {
    camera: THREE.PerspectiveCamera
    player: { mesh: THREE.Group; position: THREE.Vector3; rotation: THREE.Euler; stats: UltimatePlayerStats }
    movementController: MovementController
    advancedMovementSystem: AdvancedMovementSystem
    footstepManager: FootstepManager
    scopeSystem: ScopeSystem
    grenadeSystem: GrenadeSystem
    abilitySystem: AbilitySystem
    ground: THREE.Mesh
    scene: THREE.Scene
    onShoot: () => void
    onReload: () => void
    onWeaponSwitch: (index: number) => void
    onGrenadeThrow: () => void
  }) {
    this.camera = deps.camera
    this.player = deps.player
    this.movementController = deps.movementController
    this.advancedMovementSystem = deps.advancedMovementSystem
    this.footstepManager = deps.footstepManager
    this.scopeSystem = deps.scopeSystem
    this.grenadeSystem = deps.grenadeSystem
    this.abilitySystem = deps.abilitySystem
    this.ground = deps.ground
    this.scene = deps.scene
    this.onShoot = deps.onShoot
    this.onReload = deps.onReload
    this.onWeaponSwitch = deps.onWeaponSwitch
    this.onGrenadeThrow = deps.onGrenadeThrow
  }

  /**
   * Setup event listeners
   */
  public setupEventListeners(): void {
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousemove', this.onMouseMove)

    // Pointer lock
    document.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        document.body.requestPointerLock()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === document.body
    })
  }

  /**
   * Remove event listeners
   */
  public removeEventListeners(): void {
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousemove', this.onMouseMove)
  }

  /**
   * Key Down Handler
   */
  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase())

    // Weapon switching
    if (e.key >= '1' && e.key <= '5') {
      this.onWeaponSwitch(parseInt(e.key) - 1)
    }

    // Reload
    if (e.key.toLowerCase() === 'r') {
      this.onReload()
    }

    // Grenade switch
    if (e.key.toLowerCase() === 'g') {
      const current = this.grenadeSystem.getCurrentGrenadeType()
      const types = Object.values(GrenadeType)
      const nextIndex = (types.indexOf(current) + 1) % types.length
      this.grenadeSystem.selectGrenadeType(types[nextIndex])
    }

    // Abilities
    if (e.key.toLowerCase() === 'e') {
      this.abilitySystem.useActiveAbility()
    }
    if (e.key.toLowerCase() === 'q') {
      this.abilitySystem.useUltimateAbility()
    }
  }

  /**
   * Key Up Handler
   */
  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase())
  }

  /**
   * Mouse Down Handler
   */
  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) { // Left click - Shoot
      this.onShoot()
    } else if (e.button === 2) { // Right click - Aim
      this.player.stats.isAiming = true
      this.scopeSystem.startAiming()
    } else if (e.button === 1) { // Middle click - Grenade
      this.onGrenadeThrow()
    }
  }

  /**
   * Mouse Up Handler
   */
  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 2) {
      this.player.stats.isAiming = false
      this.scopeSystem.stopAiming()
    }
  }

  /**
   * Mouse Move Handler
   */
  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isPointerLocked) return

    this.mouse.deltaX = e.movementX * this.mouseSensitivity
    this.mouse.deltaY = e.movementY * this.mouseSensitivity

    // Apply rotation
    this.player.rotation.y -= this.mouse.deltaX
    this.camera.rotation.x -= this.mouse.deltaY

    // Clamp vertical rotation
    this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x))
  }

  /**
   * Update player movement (called every frame)
   */
  public updatePlayerMovement(deltaTime: number): void {
    if (this.player.stats.isDead) return

    // Movement input
    const moveInput = {
      forward: this.keys.has('w') || this.keys.has('arrowup'),
      backward: this.keys.has('s') || this.keys.has('arrowdown'),
      left: this.keys.has('a') || this.keys.has('arrowleft'),
      right: this.keys.has('d') || this.keys.has('arrowright'),
      jump: this.keys.has(' '),
      crouch: this.keys.has('control') || this.keys.has('c'),
      sprint: this.keys.has('shift')
    }

    // Update sprint state
    this.player.stats.isSprinting = moveInput.sprint && moveInput.forward && !this.player.stats.isCrouching

    // Movement controller
    this.movementController.update(moveInput, this.player.rotation.y, deltaTime)

    // Advanced movement system
    const advancedResult = this.advancedMovementSystem.update(deltaTime, {
      ...moveInput,
      velocity: this.movementController.velocity
    }, this.player.position)

    // Apply advanced movement
    if (advancedResult.isWallRunning || advancedResult.isSliding) {
      this.player.position.add(advancedResult.velocity)
    } else {
      this.player.position.copy(this.movementController.position)
    }

    // Camera position sync
    this.camera.position.copy(this.player.position)
    this.camera.position.y += 1.6 // Eye height

    // Player mesh sync
    this.player.mesh.position.copy(this.player.position)
    this.player.mesh.rotation.y = this.player.rotation.y

    // Footsteps
    if (this.movementController.velocity.length() > 0.1 && this.movementController.isGrounded) {
      const movementType = this.player.stats.isSprinting ? MovementType.SPRINT :
                          this.player.stats.isCrouching ? MovementType.CROUCH : MovementType.WALK
      const surface = this.footstepManager.detectSurface(this.player.position, this.scene)
      this.footstepManager.playFootstep(surface, this.player.position, movementType)
    }

    // Map boundaries
    const mapSize = 100
    this.player.position.x = Math.max(-mapSize, Math.min(mapSize, this.player.position.x))
    this.player.position.z = Math.max(-mapSize, Math.min(mapSize, this.player.position.z))
  }

  /**
   * Set mouse sensitivity
   */
  public setMouseSensitivity(sensitivity: number): void {
    this.mouseSensitivity = sensitivity
  }

  /**
   * Check if key is pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase())
  }

  /**
   * Get mouse delta
   */
  public getMouseDelta(): { x: number; y: number } {
    return { x: this.mouse.deltaX, y: this.mouse.deltaY }
  }
}
