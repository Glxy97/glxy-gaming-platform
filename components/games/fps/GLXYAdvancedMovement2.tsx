// @ts-nocheck
'use client'

import * as THREE from 'three'

// ADVANCED MOVEMENT 2.0 - PARKOUR & TACTICAL MOVEMENT!
export interface Movement2State {
  isRunning: boolean
  isSliding: boolean
  isWallRunning: boolean
  isWallClimbing: boolean
  isMantling: boolean
  isVaulting: boolean
  isDoubleJumping: boolean
  isGliding: boolean
  isDodging: boolean
  isSlidingToCover: boolean
  isBreaching: boolean
  isParkourRunning: boolean
  stamina: number
  maxStamina: number
  speed: number
  baseSpeed: number
  currentBoost: number
  airTime: number
  comboCount: number
  lastAction: number
  wallRunDirection: 'left' | 'right' | 'up' | null
  mantleProgress: number
  vaultProgress: number
  coverTarget: THREE.Vector3 | null
  breachTarget: THREE.Vector3 | null
}

export interface Movement2Settings {
  enableParkour: boolean
  enableWallClimbing: boolean
  enableMantling: boolean
  enableVaulting: boolean
  enableSlideToCover: boolean
  enableBreaching: boolean
  enableDoubleJump: boolean
  enableGliding: boolean
  staminaCostMultiplier: number
  speedMultiplier: number
  airControlMultiplier: number
  autoMantleHeight: number
  vaultHeightMax: number
  wallRunMinSpeed: number
  slideDuration: number
  coverDetectionRange: number
}

export interface Movement2Ability {
  id: string
  name: string
  description: string
  icon: string
  staminaCost: number
  cooldown: number
  duration: number
  unlockLevel: number
  type: 'movement' | 'defensive' | 'offensive' | 'tactical'
  settings: Movement2Settings
}

export class GLXYAdvancedMovement2 {
  private state!: Movement2State
  private abilities!: Movement2Ability[]
  private unlockedAbilities!: string[]
  private camera!: THREE.PerspectiveCamera
  private characterController!: any
  private scene!: THREE.Scene
  private physicsEngine!: any
  private settings!: Movement2Settings
  private raycasters!: Map<string, THREE.Raycaster>
  private movementVectors!: Map<string, THREE.Vector3>
  private animations!: Map<string, any>
  private soundEffects!: Map<string, HTMLAudioElement>

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, physicsEngine?: any) {
    this.state = {
      isRunning: false,
      isSliding: false,
      isWallRunning: false,
      isWallClimbing: false,
      isMantling: false,
      isVaulting: false,
      isDoubleJumping: false,
      isGliding: false,
      isDodging: false,
      isSlidingToCover: false,
      isBreaching: false,
      isParkourRunning: false,
      stamina: 100,
      maxStamina: 100,
      speed: 1.0,
      baseSpeed: 1.0,
      currentBoost: 0,
      airTime: 0,
      comboCount: 0,
      lastAction: 0,
      wallRunDirection: null,
      mantleProgress: 0,
      vaultProgress: 0,
      coverTarget: null,
      breachTarget: null
    }

    this.camera = camera
    this.scene = scene
    this.physicsEngine = physicsEngine

    // Default settings
    this.settings = {
      enableParkour: true,
      enableWallClimbing: true,
      enableMantling: true,
      enableVaulting: true,
      enableSlideToCover: true,
      enableBreaching: true,
      enableDoubleJump: true,
      enableGliding: true,
      staminaCostMultiplier: 1.0,
      speedMultiplier: 1.0,
      airControlMultiplier: 1.0,
      autoMantleHeight: 1.2,
      vaultHeightMax: 2.0,
      wallRunMinSpeed: 3.0,
      slideDuration: 1.5,
      coverDetectionRange: 5.0
    }

    // Initialize raycasters for different movement checks
    this.raycasters = new Map()
    this.movementVectors = new Map()
    this.animations = new Map()
    this.soundEffects = new Map()

    this.initializeRaycasters()
    this.loadSoundEffects()
    this.createAbilities()
  }

  // Initialize raycasters for movement detection
  private initializeRaycasters() {
    // Forward raycaster for wall detection
    this.raycasters.set('forward', new THREE.Raycaster())
    this.raycasters.set('downward', new THREE.Raycaster())
    this.raycasters.set('left', new THREE.Raycaster())
    this.raycasters.set('right', new THREE.Raycaster())
    this.raycasters.set('upward', new THREE.Raycaster())

    // Movement vectors
    this.movementVectors.set('forward', new THREE.Vector3())
    this.movementVectors.set('right', new THREE.Vector3())
    this.movementVectors.set('up', new THREE.Vector3())
  }

  // Load sound effects
  private loadSoundEffects() {
    // In a real implementation, you would load actual audio files
    const effects = [
      'jump', 'double_jump', 'wall_run', 'land', 'slide', 'mantle', 'vault',
      'breach', 'dodge', 'glide_deploy', 'glide_retract', 'stamina_depleted'
    ]

    effects.forEach(effect => {
      // Create placeholder audio objects
      const audio = new Audio()
      this.soundEffects.set(effect, audio)
    })
  }

  // Create movement abilities
  private createAbilities() {
    this.abilities = [
      {
        id: 'enhanced_sprint',
        name: 'Enhanced Sprint',
        description: 'Faster sprint with auto-mantling capabilities',
        icon: '⚡',
        staminaCost: 15,
        cooldown: 1000,
        duration: 3000,
        unlockLevel: 1,
        type: 'movement',
        settings: { ...this.settings, speedMultiplier: 1.8 }
      },
      {
        id: 'parkour_master',
        name: 'Parkour Master',
        description: 'Advanced parkour with fluid movement chains',
        icon: '🏃',
        staminaCost: 25,
        cooldown: 2000,
        duration: 5000,
        unlockLevel: 2,
        type: 'movement',
        settings: {
          ...this.settings,
          enableParkour: true,
          enableWallClimbing: true,
          enableMantling: true,
          enableVaulting: true,
          speedMultiplier: 1.3,
          staminaCostMultiplier: 0.8
        }
      },
      {
        id: 'tactical_breacher',
        name: 'Tactical Breacher',
        description: 'Break through doors and create tactical advantages',
        icon: '🚪',
        staminaCost: 30,
        cooldown: 4000,
        duration: 1000,
        unlockLevel: 3,
        type: 'tactical',
        settings: {
          ...this.settings,
          enableBreaching: true,
          speedMultiplier: 2.0
        }
      },
      {
        id: 'ghost_runner',
        name: 'Ghost Runner',
        description: 'Silent movement with enhanced cover abilities',
        icon: '👻',
        staminaCost: 20,
        cooldown: 3000,
        duration: 4000,
        unlockLevel: 4,
        type: 'defensive',
        settings: {
          ...this.settings,
          enableSlideToCover: true,
          enableGliding: true,
          staminaCostMultiplier: 0.7
        }
      },
      {
        id: 'acrobat_elite',
        name: 'Acrobat Elite',
        description: 'Master of aerial movement and advanced maneuvers',
        icon: '🤸',
        staminaCost: 35,
        cooldown: 5000,
        duration: 6000,
        unlockLevel: 5,
        type: 'movement',
        settings: {
          ...this.settings,
          enableDoubleJump: true,
          enableWallClimbing: true,
          airControlMultiplier: 1.5,
          autoMantleHeight: 1.8,
          vaultHeightMax: 2.5
        }
      }
    ]

    this.unlockedAbilities = ['enhanced_sprint', 'parkour_master']
  }

  // Update movement settings
  updateSettings(newSettings: Partial<Movement2Settings>) {
    this.settings = { ...this.settings, ...newSettings }
    console.log('Movement settings updated:', this.settings)
  }

  // Get current settings
  getSettings(): Movement2Settings {
    return { ...this.settings }
  }

  // Get current movement state
  getMovementState(): Movement2State {
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
      this.playSound('stamina_depleted')
      return false
    }

    // Apply ability settings temporarily
    const originalSettings = { ...this.settings }
    this.settings = { ...this.settings, ...ability.settings }

    // Execute specific ability
    switch (abilityId) {
      case 'enhanced_sprint':
        this.executeEnhancedSprint(direction)
        break
      case 'parkour_master':
        this.executeParkourMaster(direction)
        break
      case 'tactical_breacher':
        this.executeTacticalBreacher(direction)
        break
      case 'ghost_runner':
        this.executeGhostRunner(direction)
        break
      case 'acrobat_elite':
        this.executeAcrobatElite(direction)
        break
    }

    // Restore original settings after duration
    setTimeout(() => {
      this.settings = originalSettings
    }, ability.duration)

    // Consume stamina
    this.state.stamina -= ability.staminaCost
    this.state.lastAction = Date.now()
    this.state.comboCount++

    return true
  }

  // Enhanced sprint with auto-mantling
  private executeEnhancedSprint(direction?: THREE.Vector3): void {
    this.state.isRunning = true
    this.state.isParkourRunning = true
    this.state.speed = this.state.baseSpeed * this.settings.speedMultiplier

    // Create speed effect
    this.createSpeedEffect()

    // Check for auto-mantling opportunities
    if (this.settings.enableMantling) {
      this.checkForAutoMantle()
    }

    setTimeout(() => {
      this.state.isRunning = false
      this.state.isParkourRunning = false
      this.state.speed = this.state.baseSpeed
    }, 3000)
  }

  // Parkour master movement
  private executeParkourMaster(direction?: THREE.Vector3): void {
    this.state.isParkourRunning = true
    this.state.speed = this.state.baseSpeed * this.settings.speedMultiplier

    // Enhanced parkour capabilities
    this.enableParkourMode()

    setTimeout(() => {
      this.state.isParkourRunning = false
      this.state.speed = this.state.baseSpeed
      this.disableParkourMode()
    }, 5000)
  }

  // Tactical breaching
  private executeTacticalBreacher(direction?: THREE.Vector3): void {
    if (!direction || !this.settings.enableBreaching) return

    const breachTarget = this.findBreachingTarget(direction)
    if (breachTarget) {
      this.state.isBreaching = true
      this.state.breachTarget = breachTarget

      // Execute breach
      this.performBreach(breachTarget, direction)

      setTimeout(() => {
        this.state.isBreaching = false
        this.state.breachTarget = null
      }, 1000)
    }
  }

  // Ghost runner - silent movement
  private executeGhostRunner(direction?: THREE.Vector3): void {
    this.state.isRunning = true
    this.state.speed = this.state.baseSpeed * this.settings.speedMultiplier

    // Silent movement mode
    this.enableSilentMovement()

    setTimeout(() => {
      this.state.isRunning = false
      this.state.speed = this.state.baseSpeed
      this.disableSilentMovement()
    }, 4000)
  }

  // Acrobat elite - aerial movement
  private executeAcrobatElite(direction?: THREE.Vector3): void {
    this.state.isParkourRunning = true
    this.state.speed = this.state.baseSpeed * this.settings.speedMultiplier

    // Enhanced aerial capabilities
    this.enableAerialMode()

    setTimeout(() => {
      this.state.isParkourRunning = false
      this.state.speed = this.state.baseSpeed
      this.disableAerialMode()
    }, 6000)
  }

  // Jump with advanced movement
  jump(direction?: THREE.Vector3): boolean {
    if (this.state.stamina < 10) return false

    // Check for wall climbing
    if (this.settings.enableWallClimbing && this.checkForWallClimb(direction)) {
      return true
    }

    // Check for mantling
    if (this.settings.enableMantling && this.checkForMantle(direction)) {
      return true
    }

    // Check for vaulting
    if (this.settings.enableVaulting && this.checkForVault(direction)) {
      return true
    }

    // Regular jump
    this.performJump(direction)
    this.state.stamina -= 10

    return true
  }

  // Double jump
  doubleJump(direction?: THREE.Vector3): boolean {
    if (!this.settings.enableDoubleJump || this.state.isDoubleJumping) return false
    if (this.state.stamina < 15) return false

    this.state.isDoubleJumping = true
    this.state.airTime = 0

    // Create double jump effect
    this.createDoubleJumpEffect()

    // Apply jump force
    const jumpVector = new THREE.Vector3(0, 12, 0)
    if (direction) {
      jumpVector.x += direction.x * 3
      jumpVector.z += direction.z * 3
    }

    this.playSound('double_jump')
    this.state.stamina -= 15

    setTimeout(() => {
      this.state.isDoubleJumping = false
    }, 1000)

    return true
  }

  // Wall run
  wallRun(direction?: THREE.Vector3): boolean {
    if (!direction) return false

    const wallInfo = this.findNearbyWall(direction)
    if (!wallInfo) return false

    this.state.isWallRunning = true
    this.state.wallRunDirection = wallInfo.direction
    this.state.airTime = 0

    // Create wall run effect
    this.createWallRunEffect(wallInfo.normal)

    // Apply wall running physics
    this.applyWallRunPhysics(wallInfo.normal, wallInfo.direction)

    this.playSound('wall_run')

    setTimeout(() => {
      this.state.isWallRunning = false
      this.state.wallRunDirection = null
    }, 3000)

    return true
  }

  // Slide
  slide(direction?: THREE.Vector3): boolean {
    if (this.state.isSliding) return false
    if (this.state.stamina < 20) return false

    this.state.isSliding = true
    this.state.speed = this.state.baseSpeed * 1.5

    // Check for slide-to-cover
    if (this.settings.enableSlideToCover) {
      const coverTarget = this.findNearbyCover(direction)
      if (coverTarget) {
        this.executeSlideToCover(coverTarget)
        return true
      }
    }

    // Regular slide
    this.executeSlide(direction)

    setTimeout(() => {
      this.state.isSliding = false
      this.state.speed = this.state.baseSpeed
    }, this.settings.slideDuration * 1000)

    this.state.stamina -= 20
    return true
  }

  // Glide
  glide(): boolean {
    if (!this.settings.enableGliding) return false
    if (this.state.airTime < 0.5) return false // Only glide when in air
    if (this.state.stamina < 5) return false

    this.state.isGliding = true

    // Create glider effect
    this.createGliderEffect()

    // Slow descent
    this.applyGlidingPhysics()

    this.playSound('glide_deploy')

    return true
  }

  // Check for auto-mantle
  private checkForAutoMantle(): boolean {
    const forwardVector = this.getForwardVector()
    const mantleTarget = this.findMantleTarget(forwardVector)

    if (mantleTarget && mantleTarget.height <= this.settings.autoMantleHeight) {
      this.executeMantle(mantleTarget)
      return true
    }

    return false
  }

  // Check for wall climb
  private checkForWallClimb(direction?: THREE.Vector3): boolean {
    if (!this.settings.enableWallClimbing) return false

    const forwardVector = direction || this.getForwardVector()
    const wallInfo = this.findNearbyWall(forwardVector)

    if (wallInfo && wallInfo.isClimbable) {
      this.executeWallClimb(wallInfo)
      return true
    }

    return false
  }

  // Check for mantle
  private checkForMantle(direction?: THREE.Vector3): boolean {
    if (!this.settings.enableMantling) return false

    const forwardVector = direction || this.getForwardVector()
    const mantleTarget = this.findMantleTarget(forwardVector)

    if (mantleTarget) {
      this.executeMantle(mantleTarget)
      return true
    }

    return false
  }

  // Check for vault
  private checkForVault(direction?: THREE.Vector3): boolean {
    if (!this.settings.enableVaulting) return false

    const forwardVector = direction || this.getForwardVector()
    const vaultTarget = this.findVaultTarget(forwardVector)

    if (vaultTarget && vaultTarget.height <= this.settings.vaultHeightMax) {
      this.executeVault(vaultTarget)
      return true
    }

    return false
  }

  // Find nearby wall
  private findNearbyWall(direction: THREE.Vector3): { normal: THREE.Vector3; direction: 'left' | 'right' | 'up'; isClimbable: boolean } | null {
    const raycaster = this.raycasters.get('forward')!
    raycaster.set(this.camera.position, direction.normalize())

    const intersects = raycaster.intersectObjects(this.scene.children, true)
    if (intersects.length > 0 && intersects[0].distance < 2) {
      const normal = intersects[0].face!.normal.clone()
      normal.transformDirection(intersects[0].object.matrixWorld)

      // Determine wall direction based on normal
      let wallDirection: 'left' | 'right' | 'up'
      if (Math.abs(normal.y) > 0.7) {
        wallDirection = 'up'
      } else {
        // Check if wall is to left or right
        const right = this.getRightVector()
        if (normal.dot(right) > 0) {
          wallDirection = 'right'
        } else {
          wallDirection = 'left'
        }
      }

      // Check if wall is climbable (rough surface, not too steep)
      const isClimbable = Math.abs(normal.y) < 0.8

      return { normal, direction: wallDirection, isClimbable }
    }

    return null
  }

  // Find mantle target
  private findMantleTarget(direction: THREE.Vector3): { position: THREE.Vector3; height: number; edge: THREE.Vector3 } | null {
    const raycaster = this.raycasters.get('forward')!
    raycaster.set(this.camera.position, direction.normalize())

    const intersects = raycaster.intersectObjects(this.scene.children, true)
    if (intersects.length > 0 && intersects[0].distance < 2) {
      const hitPoint = intersects[0].point
      const height = hitPoint.y - this.camera.position.y

      if (height > 0.5 && height < this.settings.autoMantleHeight) {
        return {
          position: hitPoint,
          height,
          edge: hitPoint
        }
      }
    }

    return null
  }

  // Find vault target
  private findVaultTarget(direction: THREE.Vector3): { position: THREE.Vector3; height: number; edge: THREE.Vector3 } | null {
    // Similar to mantle but for lower obstacles
    const raycaster = this.raycasters.get('forward')!
    const startPosition = this.camera.position.clone()
    startPosition.y += 0.5 // Hip height

    raycaster.set(startPosition, direction.normalize())

    const intersects = raycaster.intersectObjects(this.scene.children, true)
    if (intersects.length > 0 && intersects[0].distance < 2) {
      const hitPoint = intersects[0].point
      const height = hitPoint.y - this.camera.position.y

      if (height > 0.3 && height < this.settings.vaultHeightMax) {
        return {
          position: hitPoint,
          height,
          edge: hitPoint
        }
      }
    }

    return null
  }

  // Find breaching target
  private findBreachingTarget(direction: THREE.Vector3): THREE.Vector3 | null {
    const raycaster = this.raycasters.get('forward')!
    raycaster.set(this.camera.position, direction.normalize())

    const intersects = raycaster.intersectObjects(this.scene.children, true)
    if (intersects.length > 0 && intersects[0].distance < 2) {
      const object = intersects[0].object
      // Check if object is breachable (door, window, weak wall)
      if (object.userData.isBreakable || object.userData.isDoor) {
        return intersects[0].point
      }
    }

    return null
  }

  // Find nearby cover
  private findNearbyCover(direction?: THREE.Vector3): THREE.Vector3 | null {
    const searchDirection = direction || this.getForwardVector()
    const raycaster = this.raycasters.get('forward')!

    // Cast multiple rays to find cover
    for (let i = 1; i <= this.settings.coverDetectionRange; i += 0.5) {
      const searchPos = this.camera.position.clone().add(searchDirection.clone().multiplyScalar(i))
      raycaster.set(searchPos, new THREE.Vector3(0, -1, 0))

      const intersects = raycaster.intersectObjects(this.scene.children, true)
      if (intersects.length > 0 && intersects[0].distance < 2) {
        return intersects[0].point
      }
    }

    return null
  }

  // Execute mantle
  private executeMantle(mantleTarget: { position: THREE.Vector3; height: number; edge: THREE.Vector3 }): void {
    this.state.isMantling = true
    this.state.mantleProgress = 0

    // Create mantle effect
    this.createMantleEffect(mantleTarget.edge)

    // Animate mantle
    const startPosition = this.camera.position.clone()
    const endPosition = mantleTarget.position.clone()
    endPosition.y += 1.5 // Camera height

    const duration = 800
    const startTime = Date.now()

    const animateMantle = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Smooth interpolation
      const easeProgress = this.easeInOutCubic(progress)
      this.camera.position.lerpVectors(startPosition, endPosition, easeProgress)

      this.state.mantleProgress = progress

      if (progress < 1) {
        requestAnimationFrame(animateMantle)
      } else {
        this.state.isMantling = false
        this.state.mantleProgress = 0
        this.playSound('land')
      }
    }

    animateMantle()
    this.playSound('mantle')
  }

  // Execute vault
  private executeVault(vaultTarget: { position: THREE.Vector3; height: number; edge: THREE.Vector3 }): void {
    this.state.isVaulting = true
    this.state.vaultProgress = 0

    // Create vault effect
    this.createVaultEffect(vaultTarget.edge)

    // Animate vault with arc trajectory
    const startPosition = this.camera.position.clone()
    const endPosition = vaultTarget.position.clone()
    endPosition.y += 1.5
    endPosition.add(this.getForwardVector().multiplyScalar(1))

    const duration = 600
    const startTime = Date.now()

    const animateVault = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Arc trajectory
      const easeProgress = this.easeInOutCubic(progress)
      const height = Math.sin(progress * Math.PI) * 2 // Arc height

      const currentPos = new THREE.Vector3()
      currentPos.lerpVectors(startPosition, endPosition, easeProgress)
      currentPos.y += height

      this.camera.position.copy(currentPos)
      this.state.vaultProgress = progress

      if (progress < 1) {
        requestAnimationFrame(animateVault)
      } else {
        this.state.isVaulting = false
        this.state.vaultProgress = 0
        this.playSound('land')
      }
    }

    animateVault()
    this.playSound('vault')
  }

  // Execute wall climb
  private executeWallClimb(wallInfo: { normal: THREE.Vector3; direction: 'left' | 'right' | 'up'; isClimbable: boolean }): void {
    this.state.isWallClimbing = true

    // Create climbing effect
    this.createClimbingEffect(wallInfo.normal)

    // Apply climbing physics
    const climbVector = new THREE.Vector3(0, 5, 0) // Upward movement
    const lateralVector = wallInfo.normal.clone().multiplyScalar(-0.5) // Stick to wall

    const climbForce = climbVector.add(lateralVector)

    // Apply to character controller
    if (this.characterController) {
      this.characterController.move(climbForce)
    }

    this.playSound('wall_run')

    setTimeout(() => {
      this.state.isWallClimbing = false
    }, 2000)
  }

  // Execute slide to cover
  private executeSlideToCover(coverTarget: THREE.Vector3): void {
    this.state.isSlidingToCover = true
    this.state.coverTarget = coverTarget

    // Create slide effect
    this.createSlideEffect()

    // Animate slide to cover
    const startPosition = this.camera.position.clone()
    const slideDirection = coverTarget.clone().sub(startPosition).normalize()
    const distance = startPosition.distanceTo(coverTarget)

    const duration = Math.min(distance * 200, 1500)
    const startTime = Date.now()

    const animateSlideToCover = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeProgress = this.easeOutQuad(progress)
      const currentPos = startPosition.clone().add(slideDirection.clone().multiplyScalar(distance * easeProgress))

      // Lower camera during slide
      currentPos.y -= Math.sin(progress * Math.PI) * 0.5

      this.camera.position.copy(currentPos)

      if (progress < 1) {
        requestAnimationFrame(animateSlideToCover)
      } else {
        this.state.isSlidingToCover = false
        this.state.coverTarget = null
        this.playSound('land')
      }
    }

    animateSlideToCover
    this.playSound('slide')
  }

  // Perform breach
  private performBreach(breachTarget: THREE.Vector3, direction: THREE.Vector3): void {
    // Create breach effect
    this.createBreachingEffect(breachTarget)

    // Apply explosive force to breachable object
    this.applyExplosiveForce(breachTarget, direction, 10)

    // Push player forward
    const pushForce = direction.clone().multiplyScalar(8)
    if (this.characterController) {
      this.characterController.move(pushForce)
    }

    this.playSound('breach')
  }

  // Regular jump
  private performJump(direction?: THREE.Vector3): void {
    const jumpVector = new THREE.Vector3(0, 8, 0)
    if (direction) {
      jumpVector.x += direction.x * 2
      jumpVector.z += direction.z * 2
    }

    if (this.characterController) {
      this.characterController.move(jumpVector)
    }

    this.state.airTime = 0
    this.playSound('jump')
  }

  // Execute slide
  private executeSlide(direction?: THREE.Vector3): void {
    const slideDirection = direction || this.getForwardVector()
    const slideForce = slideDirection.clone().multiplyScalar(15)

    if (this.characterController) {
      this.characterController.move(slideForce)
    }

    this.createSlideEffect()
    this.playSound('slide')
  }

  // Apply wall run physics
  private applyWallRunPhysics(normal: THREE.Vector3, direction: 'left' | 'right' | 'up'): void {
    const runForce = new THREE.Vector3()

    switch (direction) {
      case 'left':
      case 'right':
        // Horizontal wall run
        const horizontalDirection = new THREE.Vector3()
        horizontalDirection.crossVectors(normal, new THREE.Vector3(0, 1, 0))
        runForce.copy(horizontalDirection).multiplyScalar(8)
        break
      case 'up':
        // Vertical wall run
        runForce.set(0, 5, 0)
        break
    }

    // Apply force to character controller
    if (this.characterController) {
      this.characterController.move(runForce)
    }
  }

  // Apply gliding physics
  private applyGlidingPhysics(): void {
    // Reduce gravity and add forward momentum
    const glideForce = new THREE.Vector3(0, -2, 0) // Reduced gravity
    const forwardForce = this.getForwardVector().multiplyScalar(3)

    if (this.characterController) {
      this.characterController.move(glideForce.add(forwardForce))
    }
  }

  // Apply explosive force
  private applyExplosiveForce(position: THREE.Vector3, direction: THREE.Vector3, force: number): void {
    // In a real implementation, this would interact with the physics engine
    console.log(`Applying explosive force at ${position.toString()} with direction ${direction.toString()}`)
  }

  // Enable parkour mode
  private enableParkourMode(): void {
    // Enhanced detection ranges and reduced stamina costs
    this.settings.staminaCostMultiplier *= 0.7
    this.settings.autoMantleHeight *= 1.2
    this.settings.vaultHeightMax *= 1.2
  }

  // Disable parkour mode
  private disableParkourMode(): void {
    // Reset to original values
    this.settings.staminaCostMultiplier = 1.0
    this.settings.autoMantleHeight = 1.2
    this.settings.vaultHeightMax = 2.0
  }

  // Enable silent movement
  private enableSilentMovement(): void {
    // Reduce sound effects and visibility
    // In a real implementation, this would affect enemy detection
  }

  // Disable silent movement
  private disableSilentMovement(): void {
    // Reset sound and visibility
  }

  // Enable aerial mode
  private enableAerialMode(): void {
    // Enhanced air control and double jump capabilities
    this.settings.airControlMultiplier *= 1.5
  }

  // Disable aerial mode
  private disableAerialMode(): void {
    // Reset air control
    this.settings.airControlMultiplier = 1.0
  }

  // Update movement state
  update(deltaTime: number): void {
    // Regenerate stamina
    if (this.state.stamina < this.state.maxStamina) {
      this.state.stamina = Math.min(
        this.state.maxStamina,
        this.state.stamina + deltaTime * 15
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
    if (this.state.isWallRunning) {
      this.updateWallRunning(deltaTime)
    }

    if (this.state.isWallClimbing) {
      this.updateWallClimbing(deltaTime)
    }

    if (this.state.isGliding) {
      this.updateGliding(deltaTime)
    }

    // Update animations
    this.updateAnimations(deltaTime)
  }

  // Update wall running
  private updateWallRunning(deltaTime: number): void {
    // Check if still near wall
    const direction = this.getForwardVector()
    const wallInfo = this.findNearbyWall(direction)

    if (!wallInfo || wallInfo.direction !== this.state.wallRunDirection) {
      this.state.isWallRunning = false
      this.state.wallRunDirection = null
      return
    }

    // Apply continuous wall run force
    this.applyWallRunPhysics(wallInfo.normal, wallInfo.direction)
  }

  // Update wall climbing
  private updateWallClimbing(deltaTime: number): void {
    // Continue climbing if stamina available
    if (this.state.stamina > 0) {
      this.state.stamina -= deltaTime * 10
      const climbForce = new THREE.Vector3(0, 3, 0)

      if (this.characterController) {
        this.characterController.move(climbForce)
      }
    } else {
      this.state.isWallClimbing = false
    }
  }

  // Update gliding
  private updateGliding(deltaTime: number): void {
    // Continue gliding if stamina available
    if (this.state.stamina > 0) {
      this.state.stamina -= deltaTime * 5
      this.applyGlidingPhysics()
    } else {
      this.state.isGliding = false
      this.playSound('glide_retract')
    }
  }

  // Update animations
  private updateAnimations(deltaTime: number): void {
    // Update animation states based on current movement
    // In a real implementation, this would update 3D model animations
  }

  // Get forward vector
  private getForwardVector(): THREE.Vector3 {
    const forward = new THREE.Vector3()
    this.camera.getWorldDirection(forward)
    return forward
  }

  // Get right vector
  private getRightVector(): THREE.Vector3 {
    const forward = this.getForwardVector()
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0))
    return right.normalize()
  }

  // Easing functions
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t)
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

  private createMantleEffect(edge: THREE.Vector3): void {
    // Create mantle spark effect
    for (let i = 0; i < 10; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05)
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)

      particle.position.copy(edge)
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ))

      this.scene.add(particle)

      setTimeout(() => {
        this.scene.remove(particle)
      }, 800)
    }
  }

  private createVaultEffect(edge: THREE.Vector3): void {
    // Create vault motion blur effect
    // In a real implementation, this would be a post-processing effect
  }

  private createWallRunEffect(normal: THREE.Vector3): void {
    // Create wall run particles
    for (let i = 0; i < 15; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.03)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.7
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)

      particle.position.copy(this.camera.position)
      particle.position.add(normal.clone().multiplyScalar(-0.5))

      this.scene.add(particle)

      setTimeout(() => {
        this.scene.remove(particle)
      }, 1200)
    }
  }

  private createClimbingEffect(normal: THREE.Vector3): void {
    // Create climbing dust and scrape effects
  }

  private createSlideEffect(): void {
    // Create slide dust and sparks
    const dustGeometry = new THREE.PlaneGeometry(2, 1)
    const dustMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6
    })
    const dust = new THREE.Mesh(dustGeometry, dustMaterial)
    dust.position.copy(this.camera.position)
    dust.position.y -= 0.5
    dust.rotation.x = -Math.PI / 2
    this.scene.add(dust)

    setTimeout(() => {
      this.scene.remove(dust)
    }, 1500)
  }

  private createBreachingEffect(position: THREE.Vector3): void {
    // Create explosive breaching effect
    for (let i = 0; i < 30; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1)
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: 0xff4500,
        emissiveIntensity: 1
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)

      particle.position.copy(position)
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ))

      this.scene.add(particle)

      setTimeout(() => {
        this.scene.remove(particle)
      }, 2000)
    }
  }

  private createDoubleJumpEffect(): void {
    // Create double jump energy burst
    for (let i = 0; i < 12; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.15)
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
    // Create glider wings visual effect
    // In a real implementation, this would show actual glider wings
  }

  // Play sound effect
  private playSound(soundName: string): void {
    const sound = this.soundEffects.get(soundName)
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(e => console.log('Sound play failed:', e))
    }
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

  getUnlockedAbilities(): Movement2Ability[] {
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

export default GLXYAdvancedMovement2