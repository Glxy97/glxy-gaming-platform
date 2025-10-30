/**
 * 🎮 SUCHT-FAKTOR #2: ADVANCED MOVEMENT-SYSTEM
 * Wallrun & Sliding wie Apex/Titanfall
 * 
 * ✅ BESTE PERFORMANCE: Direkter THREE.Raycaster für Wallrun
 * - Wird 60x/Sekunde aufgerufen → Performance kritisch!
 * - Braucht keine Physics-Daten → Direkter Raycaster optimal
 * - Raycaster wiederverwenden (nicht neu erstellen!)
 * - Cache für Wall-Checks (nur alle 2 Frames)
 * - Nur Welt-Objekte prüfen (nicht alle Scene-Kinder)
 */

import * as THREE from 'three'

// ============================================================
// TYPES
// ============================================================

export interface MovementInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean
  sprint: boolean
}

export interface MovementResult {
  position: THREE.Vector3
  effects: MovementEffect[]
  speed: number
  state: MovementState
}

export interface MovementEffect {
  type: string
  intensity: number
  angle?: number
}

export interface MovementState {
  isSliding: boolean
  isWallRunning: boolean
  wallRunSide: 'left' | 'right' | null
  slideSpeed: number
  momentum: THREE.Vector3
  bunnyHopChain: number
}

// ============================================================
// ADVANCED MOVEMENT SYSTEM
// ============================================================

export class AdvancedMovementSystem {
  private camera: THREE.Camera
  private scene: THREE.Scene | null = null
  
  // ✅ BESTE PERFORMANCE: Raycaster wiederverwenden (nicht neu erstellen!)
  private leftRaycaster: THREE.Raycaster
  private rightRaycaster: THREE.Raycaster
  
  // ✅ BESTE PERFORMANCE: Wall-Check Cache (nur alle 2 Frames neu prüfen)
  private wallCheckCache: {
    canWallRun: boolean
    side: 'left' | 'right' | null
    timestamp: number
  } = { canWallRun: false, side: null, timestamp: 0 }
  private readonly WALL_CHECK_CACHE_DURATION = 33 // ~2 Frames bei 60fps
  
  // ✅ BESTE PERFORMANCE: Nur Welt-Objekte für Wall-Check (nicht alle!)
  private worldObjects: THREE.Object3D[] = []
  
  // Movement States
  private state: MovementState = {
    isSliding: false,
    isWallRunning: false,
    wallRunSide: null,
    slideSpeed: 0,
    momentum: new THREE.Vector3(),
    bunnyHopChain: 0
  }
  
  // Movement Config
  private config = {
    baseSpeed: 8,
    sprintSpeed: 12,
    slideSpeed: 16,
    wallRunSpeed: 14,
    maxMomentum: 20,
    slideBoost: 1.5,
    wallJumpForce: 12,
    bunnyHopWindow: 300, // ms
    perfectBunnyHopBoost: 1.15,
    slideFriction: 0.98,
    wallCheckDistance: 2,
    wallCheckCacheEnabled: true // Performance-Optimierung
  }

  private lastJumpTime = 0

  constructor(camera: THREE.Camera) {
    this.camera = camera
    // ✅ BESTE PERFORMANCE: Raycaster einmal erstellen, wiederverwenden
    this.leftRaycaster = new THREE.Raycaster()
    this.rightRaycaster = new THREE.Raycaster()
    this.leftRaycaster.far = this.config.wallCheckDistance
    this.rightRaycaster.far = this.config.wallCheckDistance
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene
    // ✅ BESTE PERFORMANCE: Nur Welt-Objekte sammeln (Ground, Walls, etc.)
    this.updateWorldObjects()
  }

  /**
   * ✅ BESTE PERFORMANCE: Sammle nur relevante Objekte für Wall-Check
   */
  private updateWorldObjects(): void {
    if (!this.scene) return
    
    this.worldObjects = []
    this.scene.traverse((object) => {
      // Nur statische Objekte (Ground, Walls, etc.)
      if (object.userData?.type === 'GROUND' || 
          object.userData?.type === 'WALL' ||
          object.userData?.type === 'OBSTACLE' ||
          (object instanceof THREE.Mesh && object.userData?.isStatic)) {
        this.worldObjects.push(object)
      }
    })
    
    // Fallback: Wenn keine gefilterten Objekte, alle verwenden
    if (this.worldObjects.length === 0) {
      this.worldObjects = this.scene.children
    }
  }

  update(deltaTime: number, input: MovementInput, playerPosition: THREE.Vector3): MovementResult {
    let velocity = new THREE.Vector3()
    
    // SLIDE MECHANIK (wie Apex Legends)
    if (input.crouch && this.state.momentum.length() > 10) {
      this.startSlide()
    }
    
    if (this.state.isSliding) {
      velocity = this.updateSlide(deltaTime, input)
    }
    
    // WALLRUN (wie Titanfall)
    if (this.scene) {
      const wallCheck = this.checkWalls(playerPosition)
      if (wallCheck.canWallRun && input.sprint) {
        this.startWallRun(wallCheck.side)
      }
      
      if (this.state.isWallRunning) {
        velocity = this.updateWallRun(deltaTime, input)
      }
    }
    
    // BUNNY HOP (wie CS:GO)
    if (input.jump) {
      const now = Date.now()
      const timeSinceLastJump = now - this.lastJumpTime
      
      if (timeSinceLastJump < this.config.bunnyHopWindow && velocity.length() > 0) {
        // Perfect Bunny Hop!
        this.state.bunnyHopChain++
        const boost = Math.pow(this.config.perfectBunnyHopBoost, Math.min(this.state.bunnyHopChain, 5))
        velocity.multiplyScalar(boost)
      } else {
        this.state.bunnyHopChain = 0
      }
      
      this.lastJumpTime = now
    }
    
    // MOMENTUM SYSTEM
    if (velocity.length() > 0) {
      this.state.momentum.lerp(velocity, deltaTime * 5)
    }
    velocity.add(this.state.momentum.clone().multiplyScalar(0.95))
    
    // Clamp max speed
    if (velocity.length() > this.config.maxMomentum) {
      velocity.normalize().multiplyScalar(this.config.maxMomentum)
    }
    
    return {
      position: velocity.multiplyScalar(deltaTime),
      effects: this.getMovementEffects(),
      speed: velocity.length(),
      state: { ...this.state }
    }
  }

  private startSlide(): void {
    if (this.state.isSliding) return
    
    this.state.isSliding = true
    this.state.slideSpeed = this.state.momentum.length() * this.config.slideBoost
  }

  private updateSlide(deltaTime: number, input: MovementInput): THREE.Vector3 {
    const slideDir = this.state.momentum.clone().normalize()
    this.state.slideSpeed *= this.config.slideFriction
    
    if (this.state.slideSpeed < 5 || !input.crouch) {
      this.state.isSliding = false
    }
    
    return slideDir.multiplyScalar(this.state.slideSpeed)
  }

  private startWallRun(side: 'left' | 'right'): void {
    this.state.isWallRunning = true
    this.state.wallRunSide = side
  }

  private updateWallRun(deltaTime: number, input: MovementInput): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
    forward.y = 0
    forward.normalize()
    
    // Wall Jump
    if (input.jump) {
      const jumpDir = new THREE.Vector3()
      if (this.state.wallRunSide === 'left') {
        jumpDir.x = 1
      } else {
        jumpDir.x = -1
      }
      jumpDir.y = 1
      jumpDir.normalize().multiplyScalar(this.config.wallJumpForce)
      
      this.state.isWallRunning = false
      this.state.momentum.add(jumpDir)
      
      return jumpDir
    }
    
    return forward.multiplyScalar(this.config.wallRunSpeed)
  }

  private checkWalls(playerPosition: THREE.Vector3): { canWallRun: boolean, side: 'left' | 'right' } {
    if (!this.scene) return { canWallRun: false, side: 'left' }
    
    // ✅ BESTE PERFORMANCE: Cache-Check (nur alle 2 Frames neu prüfen)
    const now = performance.now()
    if (this.config.wallCheckCacheEnabled && 
        (now - this.wallCheckCache.timestamp) < this.WALL_CHECK_CACHE_DURATION) {
      return {
        canWallRun: this.wallCheckCache.canWallRun,
        side: this.wallCheckCache.side || 'left'
      }
    }
    
    // ✅ BESTE PERFORMANCE: Direkter THREE.Raycaster (kein PhysicsEngine-Overhead!)
    // Wird 60x/Sekunde aufgerufen → Performance kritisch!
    const leftDirection = new THREE.Vector3(-1, 0, 0)
    const rightDirection = new THREE.Vector3(1, 0, 0)
    
    // ✅ BESTE PERFORMANCE: Raycaster wiederverwenden (nicht neu erstellen!)
    this.leftRaycaster.set(playerPosition, leftDirection)
    const leftIntersects = this.leftRaycaster.intersectObjects(
      this.worldObjects.length > 0 ? this.worldObjects : this.scene.children, 
      true
    )
    
    this.rightRaycaster.set(playerPosition, rightDirection)
    const rightIntersects = this.rightRaycaster.intersectObjects(
      this.worldObjects.length > 0 ? this.worldObjects : this.scene.children,
      true
    )
    
    // Prüfe Links
    let canWallRun = false
    let side: 'left' | 'right' | null = null
    
    if (leftIntersects.length > 0 && leftIntersects[0].distance < this.config.wallCheckDistance) {
      canWallRun = true
      side = 'left'
    } else if (rightIntersects.length > 0 && rightIntersects[0].distance < this.config.wallCheckDistance) {
      canWallRun = true
      side = 'right'
    }
    
    // ✅ BESTE PERFORMANCE: Cache aktualisieren
    this.wallCheckCache = {
      canWallRun,
      side,
      timestamp: now
    }
    
    return { canWallRun, side: side || 'left' }
  }

  private getMovementEffects(): MovementEffect[] {
    const effects: MovementEffect[] = []
    
    if (this.state.isSliding) {
      effects.push({ type: 'motionBlur', intensity: 0.3 })
      effects.push({ type: 'speedLines', intensity: 0.5 })
      effects.push({ type: 'cameraTilt', angle: -15, intensity: 1 })
    }
    
    if (this.state.isWallRunning) {
      const tilt = this.state.wallRunSide === 'left' ? -20 : 20
      effects.push({ type: 'cameraTilt', angle: tilt, intensity: 1 })
      effects.push({ type: 'edgeBlur', intensity: 0.4 })
    }
    
    if (this.state.bunnyHopChain > 2) {
      effects.push({ type: 'fovPunch', intensity: 1.1 })
      effects.push({ type: 'speedLines', intensity: 0.7 })
    }
    
    return effects
  }

  reset(): void {
    this.state.isSliding = false
    this.state.isWallRunning = false
    this.state.wallRunSide = null
    this.state.slideSpeed = 0
    this.state.momentum.set(0, 0, 0)
    this.state.bunnyHopChain = 0
    // Cache zurücksetzen
    this.wallCheckCache = { canWallRun: false, side: null, timestamp: 0 }
  }
}
