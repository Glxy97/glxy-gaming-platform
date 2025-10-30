/**
 * 🎯 WEAPON RECOIL SYSTEM
 * 
 * Per-Weapon Recoil Patterns, Spray Control, Recovery
 * Lernbare Patterns wie in CS:GO / Valorant
 */

import * as THREE from 'three'

// =============================================================================
// RECOIL PATTERN DEFINITION
// =============================================================================

export interface RecoilPattern {
  weaponId: string
  pattern: THREE.Vector2[] // X/Y offsets for each shot
  recoveryRate: number // How fast recoil recovers (per second)
  maxRecoil: THREE.Vector2 // Maximum recoil accumulation
  aimPunchMultiplier: number // Visual punch multiplier
  firstShotMultiplier: number // First shot accuracy bonus
}

// =============================================================================
// PREDEFINED RECOIL PATTERNS
// =============================================================================

export const RECOIL_PATTERNS: Record<string, RecoilPattern> = {
  // Pistols - Low, controllable recoil
  'pistol': {
    weaponId: 'pistol',
    pattern: [
      new THREE.Vector2(0, 0.5),     // Shot 1: Straight up
      new THREE.Vector2(-0.1, 0.6),  // Shot 2: Slight left
      new THREE.Vector2(0.1, 0.7),   // Shot 3: Slight right
      new THREE.Vector2(-0.05, 0.6), // Shot 4: Left
      new THREE.Vector2(0.05, 0.6),  // Shot 5: Right
    ],
    recoveryRate: 8.0,
    maxRecoil: new THREE.Vector2(3, 6),
    aimPunchMultiplier: 0.3,
    firstShotMultiplier: 0.8
  },

  // Assault Rifles - Moderate, learnable pattern
  'assault': {
    weaponId: 'assault',
    pattern: [
      new THREE.Vector2(0, 1.0),      // Shot 1-3: Vertical
      new THREE.Vector2(0, 1.2),
      new THREE.Vector2(0, 1.4),
      new THREE.Vector2(-0.3, 1.3),   // Shot 4-8: Pull left
      new THREE.Vector2(-0.5, 1.2),
      new THREE.Vector2(-0.6, 1.0),
      new THREE.Vector2(-0.5, 0.8),
      new THREE.Vector2(-0.3, 0.6),
      new THREE.Vector2(0.2, 0.8),    // Shot 9-15: Swing right
      new THREE.Vector2(0.5, 0.9),
      new THREE.Vector2(0.7, 0.8),
      new THREE.Vector2(0.8, 0.7),
      new THREE.Vector2(0.6, 0.6),
      new THREE.Vector2(0.4, 0.5),
      new THREE.Vector2(0.2, 0.4),
    ],
    recoveryRate: 5.0,
    maxRecoil: new THREE.Vector2(8, 15),
    aimPunchMultiplier: 0.5,
    firstShotMultiplier: 0.9
  },

  // SMG - High fire rate, moderate recoil
  'smg': {
    weaponId: 'smg',
    pattern: [
      new THREE.Vector2(0, 0.6),
      new THREE.Vector2(0, 0.7),
      new THREE.Vector2(-0.2, 0.8),
      new THREE.Vector2(-0.3, 0.7),
      new THREE.Vector2(-0.4, 0.6),
      new THREE.Vector2(-0.3, 0.5),
      new THREE.Vector2(0.2, 0.6),
      new THREE.Vector2(0.4, 0.7),
      new THREE.Vector2(0.5, 0.6),
      new THREE.Vector2(0.4, 0.5),
      new THREE.Vector2(0.2, 0.4),
      new THREE.Vector2(0, 0.3),
    ],
    recoveryRate: 6.0,
    maxRecoil: new THREE.Vector2(6, 10),
    aimPunchMultiplier: 0.4,
    firstShotMultiplier: 0.85
  },

  // Sniper - High single shot recoil, fast recovery
  'sniper': {
    weaponId: 'sniper',
    pattern: [
      new THREE.Vector2(0, 3.0),     // Massive vertical kick
      new THREE.Vector2(-0.5, 2.5),
      new THREE.Vector2(0.5, 2.5),
    ],
    recoveryRate: 10.0,
    maxRecoil: new THREE.Vector2(10, 20),
    aimPunchMultiplier: 1.0,
    firstShotMultiplier: 1.0
  },

  // Shotgun - Heavy recoil, slow recovery
  'shotgun': {
    weaponId: 'shotgun',
    pattern: [
      new THREE.Vector2(0, 2.5),
      new THREE.Vector2(-0.3, 2.2),
      new THREE.Vector2(0.3, 2.2),
      new THREE.Vector2(0, 2.0),
    ],
    recoveryRate: 4.0,
    maxRecoil: new THREE.Vector2(5, 15),
    aimPunchMultiplier: 0.8,
    firstShotMultiplier: 0.95
  },

  // LMG - Heavy sustained recoil
  'lmg': {
    weaponId: 'lmg',
    pattern: [
      new THREE.Vector2(0, 1.5),
      new THREE.Vector2(0, 1.6),
      new THREE.Vector2(0, 1.7),
      new THREE.Vector2(-0.4, 1.5),
      new THREE.Vector2(-0.6, 1.4),
      new THREE.Vector2(-0.7, 1.2),
      new THREE.Vector2(-0.6, 1.0),
      new THREE.Vector2(-0.4, 0.9),
      new THREE.Vector2(0, 0.8),
      new THREE.Vector2(0.3, 0.9),
      new THREE.Vector2(0.6, 1.0),
      new THREE.Vector2(0.8, 1.1),
      new THREE.Vector2(0.7, 1.0),
      new THREE.Vector2(0.5, 0.9),
      new THREE.Vector2(0.3, 0.8),
    ],
    recoveryRate: 3.0,
    maxRecoil: new THREE.Vector2(10, 20),
    aimPunchMultiplier: 0.6,
    firstShotMultiplier: 0.85
  }
}

// =============================================================================
// RECOIL STATE
// =============================================================================

export interface RecoilState {
  currentRecoil: THREE.Vector2 // Current accumulated recoil
  shotsFired: number // Number of shots in current burst
  lastShotTime: number // Timestamp of last shot
  targetRecoil: THREE.Vector2 // Target recoil for smooth interpolation
}

// =============================================================================
// RECOIL CONTROLLER
// =============================================================================

export class RecoilController {
  private pattern: RecoilPattern
  private state: RecoilState
  private camera: THREE.Camera | null = null
  
  // Camera rotation before recoil (for recovery)
  private baseRotation: THREE.Euler = new THREE.Euler()
  private isRecovering: boolean = false

  constructor(weaponId: string) {
    this.pattern = RECOIL_PATTERNS[weaponId] || RECOIL_PATTERNS['pistol']
    this.state = {
      currentRecoil: new THREE.Vector2(0, 0),
      shotsFired: 0,
      lastShotTime: 0,
      targetRecoil: new THREE.Vector2(0, 0)
    }
  }

  /**
   * Set camera reference
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera
    this.baseRotation.copy(camera.rotation)
  }

  /**
   * Apply recoil for a shot
   */
  applyRecoil(): THREE.Vector2 {
    if (!this.camera) return new THREE.Vector2(0, 0)

    // Get pattern offset for this shot
    const patternIndex = Math.min(this.state.shotsFired, this.pattern.pattern.length - 1)
    const patternOffset = this.pattern.pattern[patternIndex].clone()

    // Apply first shot multiplier
    if (this.state.shotsFired === 0) {
      patternOffset.multiplyScalar(this.pattern.firstShotMultiplier)
    }

    // Add to accumulated recoil
    this.state.currentRecoil.add(patternOffset)

    // Clamp to max recoil
    this.state.currentRecoil.x = THREE.MathUtils.clamp(
      this.state.currentRecoil.x,
      -this.pattern.maxRecoil.x,
      this.pattern.maxRecoil.x
    )
    this.state.currentRecoil.y = THREE.MathUtils.clamp(
      this.state.currentRecoil.y,
      0,
      this.pattern.maxRecoil.y
    )

    // Convert to radians for camera rotation
    const recoilRadians = new THREE.Vector2(
      THREE.MathUtils.degToRad(this.state.currentRecoil.x) * this.pattern.aimPunchMultiplier,
      THREE.MathUtils.degToRad(this.state.currentRecoil.y) * this.pattern.aimPunchMultiplier
    )

    // Apply to camera
    this.camera.rotation.x -= recoilRadians.y // Pitch (vertical)
    this.camera.rotation.y += recoilRadians.x // Yaw (horizontal)

    // Update state
    this.state.shotsFired++
    this.state.lastShotTime = Date.now()
    this.isRecovering = false

    return patternOffset
  }

  /**
   * Update recoil recovery
   */
  update(deltaTime: number): void {
    if (!this.camera) return

    const timeSinceLastShot = (Date.now() - this.state.lastShotTime) / 1000

    // Start recovery after 0.1s without shooting
    if (timeSinceLastShot > 0.1) {
      this.isRecovering = true
    }

    if (this.isRecovering) {
      // Recover recoil towards zero
      const recoveryAmount = this.pattern.recoveryRate * deltaTime

      // X-axis recovery (horizontal)
      if (Math.abs(this.state.currentRecoil.x) > 0.01) {
        const xSign = Math.sign(this.state.currentRecoil.x)
        this.state.currentRecoil.x -= xSign * Math.min(Math.abs(this.state.currentRecoil.x), recoveryAmount)
      } else {
        this.state.currentRecoil.x = 0
      }

      // Y-axis recovery (vertical)
      if (this.state.currentRecoil.y > 0.01) {
        this.state.currentRecoil.y -= Math.min(this.state.currentRecoil.y, recoveryAmount)
      } else {
        this.state.currentRecoil.y = 0
      }

      // Reset shot counter if fully recovered
      if (this.state.currentRecoil.length() < 0.1) {
        this.state.shotsFired = 0
        this.isRecovering = false
      }
    }
  }

  /**
   * Force reset recoil (e.g., on weapon switch)
   */
  reset(): void {
    this.state.currentRecoil.set(0, 0)
    this.state.targetRecoil.set(0, 0)
    this.state.shotsFired = 0
    this.isRecovering = false
  }

  /**
   * Get current recoil for crosshair expansion
   */
  getCurrentRecoil(): THREE.Vector2 {
    return this.state.currentRecoil.clone()
  }

  /**
   * Get recoil intensity (0-1) for effects
   */
  getRecoilIntensity(): number {
    const maxLength = Math.sqrt(
      this.pattern.maxRecoil.x * this.pattern.maxRecoil.x +
      this.pattern.maxRecoil.y * this.pattern.maxRecoil.y
    )
    return Math.min(this.state.currentRecoil.length() / maxLength, 1.0)
  }

  /**
   * Change weapon pattern
   */
  setWeapon(weaponId: string): void {
    this.pattern = RECOIL_PATTERNS[weaponId] || RECOIL_PATTERNS['pistol']
    this.reset()
  }
}

// =============================================================================
// RECOIL MANAGER (Singleton)
// =============================================================================

export class RecoilManager {
  private controllers: Map<string, RecoilController> = new Map()
  private activeController: RecoilController | null = null
  private camera: THREE.Camera | null = null

  /**
   * Set camera reference
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera
    this.controllers.forEach(controller => controller.setCamera(camera))
  }

  /**
   * Get or create recoil controller for weapon
   */
  getController(weaponId: string): RecoilController {
    if (!this.controllers.has(weaponId)) {
      const controller = new RecoilController(weaponId)
      if (this.camera) {
        controller.setCamera(this.camera)
      }
      this.controllers.set(weaponId, controller)
    }
    return this.controllers.get(weaponId)!
  }

  /**
   * Set active weapon
   */
  setActiveWeapon(weaponId: string): void {
    this.activeController = this.getController(weaponId)
  }

  /**
   * Apply recoil for active weapon
   */
  applyRecoil(): THREE.Vector2 {
    if (!this.activeController) {
      console.warn('⚠️ No active recoil controller')
      return new THREE.Vector2(0, 0)
    }
    return this.activeController.applyRecoil()
  }

  /**
   * Update all controllers
   */
  update(deltaTime: number): void {
    this.controllers.forEach(controller => controller.update(deltaTime))
  }

  /**
   * Get active controller
   */
  getActiveController(): RecoilController | null {
    return this.activeController
  }

  /**
   * Reset all controllers
   */
  resetAll(): void {
    this.controllers.forEach(controller => controller.reset())
  }
}

