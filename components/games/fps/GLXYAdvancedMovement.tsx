// @ts-nocheck
'use client'

import * as THREE from 'three'

// ADVANCED MOVEMENT SYSTEM - Making it INSANELY EPIC!
export interface MovementState {
  isRunning: boolean
  isSliding: boolean
  isWallRunning: boolean
  isDoubleJumping: boolean
  isGliding: boolean
  isDodging: boolean
  isClimbing: boolean
  isZiplining: boolean
  isGrinding: boolean
  stamina: number
  maxStamina: number
  speed: number
  baseSpeed: number
  currentBoost: number
  airTime: number
  comboCount: number
  lastAction: number
}

export interface MovementAbility {
  id: string
  name: string
  description: string
  icon: string
  staminaCost: number
  cooldown: number
  duration: number
  unlockLevel: number
  type: 'movement' | 'defensive' | 'offensive'
}

export class GLXYAdvancedMovement {
  private state: MovementState
  private abilities: MovementAbility[]
  private unlockedAbilities: string[]
  private camera: THREE.PerspectiveCamera
  private characterController: any
  private scene: THREE.Scene

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.state = {
      isRunning: false,
      isSliding: false,
      isWallRunning: false,
      isDoubleJumping: false,
      isGliding: false,
      isDodging: false,
      isClimbing: false,
      isZiplining: false,
      isGrinding: false,
      stamina: 100,
      maxStamina: 100,
      speed: 1.0,
      baseSpeed: 1.0,
      currentBoost: 0,
      airTime: 0,
      comboCount: 0,
      lastAction: 0
    }

    this.camera = camera
    this.scene = scene

    this.abilities = [
      {
        id: 'super_sprint',
        name: 'Super Sprint',
        description: 'Enhanced speed with afterburners',
        icon: '⚡',
        staminaCost: 20,
        cooldown: 3000,
        duration: 2000,
        unlockLevel: 1,
        type: 'movement'
      },
      {
        id: 'slide_kick',
        name: 'Slide Kick',
        description: 'Slide and kick enemies for knockback',
        icon: '🦵',
        staminaCost: 15,
        cooldown: 2000,
        duration: 1000,
        unlockLevel: 2,
        type: 'offensive'
      },
      {
        id: 'wall_run',
        name: 'Wall Run',
        description: 'Run on walls for tactical repositioning',
        icon: '🏃',
        staminaCost: 25,
        cooldown: 4000,
        duration: 3000,
        unlockLevel: 3,
        type: 'movement'
      },
      {
        id: 'double_jump',
        name: 'Double Jump',
        description: 'Extra jump for aerial combat',
        icon: '🦘',
        staminaCost: 10,
        cooldown: 1000,
        duration: 500,
        unlockLevel: 4,
        type: 'movement'
      },
      {
        id: 'glide',
        name: 'Glide',
        description: 'Deploy glider for controlled descent',
        icon: '🪂',
        staminaCost: 5,
        cooldown: 5000,
        duration: 4000,
        unlockLevel: 5,
        type: 'movement'
      },
      {
        id: 'dodge_roll',
        name: 'Dodge Roll',
        description: 'Quick evasive maneuver with invincibility frames',
        icon: '🌀',
        staminaCost: 20,
        cooldown: 2500,
        duration: 800,
        unlockLevel: 6,
        type: 'defensive'
      },
      {
        id: 'power_slide',
        name: 'Power Slide',
        description: 'Long slide with speed boost at end',
        icon: '💨',
        staminaCost: 30,
        cooldown: 4000,
        duration: 2000,
        unlockLevel: 7,
        type: 'movement'
      },
      {
        id: 'super_jump',
        name: 'Super Jump',
        description: 'Massive vertical jump with damage on landing',
        icon: '🚀',
        staminaCost: 35,
        cooldown: 6000,
        duration: 1000,
        unlockLevel: 8,
        type: 'offensive'
      },
      {
        id: 'grapple_hook',
        name: 'Grapple Hook',
        description: 'Swing through the environment like Spider-Man',
        icon: '🪝',
        staminaCost: 15,
        cooldown: 2000,
        duration: 3000,
        unlockLevel: 9,
        type: 'movement'
      },
      {
        id: 'blink_dash',
        name: 'Blink Dash',
        description: 'Teleport short distance instantly',
        icon: '✨',
        staminaCost: 40,
        cooldown: 4000,
        duration: 200,
        unlockLevel: 10,
        type: 'movement'
      }
    ]

    this.unlockedAbilities = ['super_sprint', 'slide_kick'] // Start with basic abilities
  }

  // Get current movement state
  getMovementState(): MovementState {
    return { ...this.state }
  }

  // Execute movement ability
  executeAbility(abilityId: string, direction?: THREE.Vector3): boolean {
    const ability = this.abilities.find(a => a.id === abilityId)
    if (!ability || !this.unlockedAbilities.includes(abilityId)) {
      return false
    }

    // Check stamina
    if (this.state.stamina < ability.staminaCost) {
      return false
    }

    // Execute specific ability
    switch (abilityId) {
      case 'super_sprint':
        this.executeSuperSprint()
        break
      case 'slide_kick':
        this.executeSlideKick(direction)
        break
      case 'wall_run':
        this.executeWallRun(direction)
        break
      case 'double_jump':
        this.executeDoubleJump()
        break
      case 'glide':
        this.executeGlide()
        break
      case 'dodge_roll':
        this.executeDodgeRoll(direction)
        break
      case 'power_slide':
        this.executePowerSlide(direction)
        break
      case 'super_jump':
        this.executeSuperJump()
        break
      case 'grapple_hook':
        this.executeGrappleHook(direction)
        break
      case 'blink_dash':
        this.executeBlinkDash(direction)
        break
    }

    // Consume stamina
    this.state.stamina -= ability.staminaCost
    this.state.lastAction = Date.now()
    this.state.comboCount++

    return true
  }

  private executeSuperSprint(): void {
    this.state.isRunning = true
    this.state.speed = this.state.baseSpeed * 2.5
    this.state.currentBoost = 1.5

    // Create speed effect
    this.createSpeedEffect()

    setTimeout(() => {
      this.state.isRunning = false
      this.state.speed = this.state.baseSpeed
      this.state.currentBoost = 0
    }, 2000)
  }

  private executeSlideKick(direction?: THREE.Vector3): void {
    this.state.isSliding = true
    this.state.speed = this.state.baseSpeed * 1.8

    // Create slide effect
    this.createSlideEffect()

    if (direction) {
      // Apply slide momentum
      const slideVector = direction.clone().multiplyScalar(10)
      // Apply to character controller
    }

    setTimeout(() => {
      this.state.isSliding = false
      this.state.speed = this.state.baseSpeed
    }, 1000)
  }

  private executeWallRun(direction?: THREE.Vector3): void {
    if (!direction) return

    this.state.isWallRunning = true
    this.state.airTime = 0

    // Create wall run effect
    this.createWallRunEffect()

    // Check for nearby wall
    const wallDirection = this.findNearbyWall(direction)
    if (wallDirection) {
      // Run along wall
      const runVector = wallDirection.clone().multiplyScalar(8)

      setTimeout(() => {
        this.state.isWallRunning = false
      }, 3000)
    }
  }

  private executeDoubleJump(): void {
    if (!this.state.isDoubleJumping) {
      this.state.isDoubleJumping = true
      this.state.airTime = 0

      // Create double jump effect
      this.createDoubleJumpEffect()

      // Apply jump force
      const jumpVector = new THREE.Vector3(0, 15, 0)
      // Apply to character controller

      setTimeout(() => {
        this.state.isDoubleJumping = false
      }, 2000)
    }
  }

  private executeGlide(): void {
    if (this.state.airTime > 0.5) { // Only glide when in air
      this.state.isGliding = true

      // Create glider effect
      this.createGliderEffect()

      // Slow descent
      // Modify gravity for character

      setTimeout(() => {
        this.state.isGliding = false
      }, 4000)
    }
  }

  private executeDodgeRoll(direction?: THREE.Vector3): void {
    this.state.isDodging = true

    // Create dodge effect
    this.createDodgeEffect()

    if (direction) {
      const dodgeVector = direction.clone().multiplyScalar(12)
      // Apply to character controller
    }

    // Make player temporarily invincible
    this.state.currentBoost = 2.0

    setTimeout(() => {
      this.state.isDodging = false
      this.state.currentBoost = 0
    }, 800)
  }

  private executePowerSlide(direction?: THREE.Vector3): void {
    this.state.isSliding = true
    this.state.speed = this.state.baseSpeed * 2.2

    // Create power slide effect
    this.createPowerSlideEffect()

    setTimeout(() => {
      this.state.isSliding = false
      this.state.speed = this.state.baseSpeed * 1.3 // Speed boost after slide
      setTimeout(() => {
        this.state.speed = this.state.baseSpeed
      }, 1000)
    }, 2000)
  }

  private executeSuperJump(): void {
    // Create super jump effect
    this.createSuperJumpEffect()

    // Apply massive jump force
    const jumpVector = new THREE.Vector3(0, 25, 0)
    // Apply to character controller

    // Create shockwave on landing
    this.scheduleLandingEffect()
  }

  private executeGrappleHook(direction?: THREE.Vector3): void {
    if (!direction) return

    this.state.isZiplining = true

    // Create grapple effect
    this.createGrappleEffect(direction)

    // Swing physics
    // Implement pendulum motion

    setTimeout(() => {
      this.state.isZiplining = false
    }, 3000)
  }

  private executeBlinkDash(direction?: THREE.Vector3): void {
    if (!direction) return

    // Create blink effect
    this.createBlinkEffect()

    // Teleport player
    const blinkDistance = 10
    const newPosition = this.camera.position.clone().add(
      direction.clone().multiplyScalar(blinkDistance)
    )

    // Instant teleport with afterimage effect
    this.createAfterimageEffect(this.camera.position)
    this.camera.position.copy(newPosition)

    setTimeout(() => {
      // Remove afterimage
    }, 500)
  }

  // Update movement state
  update(deltaTime: number): void {
    // Regenerate stamina
    if (this.state.stamina < this.state.maxStamina) {
      this.state.stamina = Math.min(
        this.state.maxStamina,
        this.state.stamina + deltaTime * 10
      )
    }

    // Update air time
    if (this.state.airTime > 0) {
      this.state.airTime += deltaTime
    }

    // Decay combo count
    if (Date.now() - this.state.lastAction > 3000) {
      this.state.comboCount = Math.max(0, this.state.comboCount - 1)
    }

    // Handle physics for current states
    if (this.state.isGliding) {
      // Apply gliding physics
    }

    if (this.state.isWallRunning) {
      // Apply wall running physics
    }

    if (this.state.isZiplining) {
      // Apply zipline physics
    }
  }

  // Visual effects
  private createSpeedEffect(): void {
    // Create speed lines and particles
    for (let i = 0; i < 20; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)

      particle.position.copy(this.camera.position)
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        -Math.random() * 3
      ))

      this.scene.add(particle)

      // Animate and remove
      setTimeout(() => {
        this.scene.remove(particle)
      }, 1000)
    }
  }

  private createSlideEffect(): void {
    // Create slide dust and sparks
    const dustGeometry = new THREE.PlaneGeometry(4, 2)
    const dustMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6
    })
    const dust = new THREE.Mesh(dustGeometry, dustMaterial)
    dust.position.copy(this.camera.position)
    dust.position.y -= 1
    dust.rotation.x = -Math.PI / 2
    this.scene.add(dust)

    setTimeout(() => {
      this.scene.remove(dust)
    }, 2000)
  }

  private createWallRunEffect(): void {
    // Create wall run particles
  }

  private createDoubleJumpEffect(): void {
    // Create double jump energy burst
    for (let i = 0; i < 10; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.2)
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)

      particle.position.copy(this.camera.position)
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ))

      this.scene.add(particle)

      setTimeout(() => {
        this.scene.remove(particle)
      }, 1000)
    }
  }

  private createGliderEffect(): void {
    // Create glider wings
  }

  private createDodgeEffect(): void {
    // Create dodge blur effect
  }

  private createPowerSlideEffect(): void {
    // Create enhanced slide effect with fire
  }

  private createSuperJumpEffect(): void {
    // Create jump launch effect
  }

  private createGrappleEffect(direction: THREE.Vector3): void {
    // Create grapple line
  }

  private createBlinkEffect(): void {
    // Create teleportation effect
  }

  private createAfterimageEffect(position: THREE.Vector3): void {
    // Create player afterimage
  }

  private scheduleLandingEffect(): void {
    // Schedule shockwave for landing
  }

  // Helper methods
  private findNearbyWall(direction: THREE.Vector3): THREE.Vector3 | null {
    // Raycast to find nearby wall
    // Return wall normal if found
    return null
  }

  // Unlock abilities
  unlockAbility(abilityId: string): boolean {
    const ability = this.abilities.find(a => a.id === abilityId)
    if (ability && !this.unlockedAbilities.includes(abilityId)) {
      this.unlockedAbilities.push(abilityId)
      return true
    }
    return false
  }

  getUnlockedAbilities(): MovementAbility[] {
    return this.abilities.filter(a => this.unlockedAbilities.includes(a.id))
  }

  canUseAbility(abilityId: string): boolean {
    const ability = this.abilities.find(a => a.id === abilityId)
    return ability ?
      this.unlockedAbilities.includes(abilityId) &&
      this.state.stamina >= ability.staminaCost :
      false
  }
}

export default GLXYAdvancedMovement