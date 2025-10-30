/**
 * 🎨 ADVANCED VISUAL FEEDBACK
 * 
 * Enhanced visual feedback systems für FPS Game Feel
 * - Screen Flash on Hit
 * - Bullet Holes (Decals)
 * - Enhanced Kill Effects
 * - Damage Direction Indicators
 */

import * as THREE from 'three'

// =============================================================================
// SCREEN FLASH SYSTEM (On Taking Damage)
// =============================================================================

export class ScreenFlashSystem {
  private canvas: HTMLCanvasElement
  private flashAlpha: number = 0
  private flashColor: string = 'red'
  private flashDuration: number = 0
  private flashTimer: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Trigger screen flash (e.g., when taking damage)
   */
  trigger(color: string = 'red', intensity: number = 0.5, duration: number = 0.3): void {
    this.flashColor = color
    this.flashAlpha = Math.min(intensity, 1.0)
    this.flashDuration = duration
    this.flashTimer = 0
  }

  /**
   * Update flash fade-out
   */
  update(deltaTime: number): void {
    if (this.flashAlpha > 0) {
      this.flashTimer += deltaTime
      
      // Fade out
      if (this.flashTimer < this.flashDuration) {
        this.flashAlpha = (1 - (this.flashTimer / this.flashDuration)) * this.flashAlpha
      } else {
        this.flashAlpha = 0
      }
    }
  }

  /**
   * Render flash overlay
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor
      ctx.globalAlpha = this.flashAlpha
      ctx.fillRect(0, 0, width, height)
      ctx.globalAlpha = 1.0
    }
  }
}

// =============================================================================
// BULLET HOLE SYSTEM (Decals)
// =============================================================================

export interface BulletHole {
  mesh: THREE.Mesh
  createdAt: number
  lifetime: number
}

export class BulletHoleSystem {
  private scene: THREE.Scene
  private bulletHoles: BulletHole[] = []
  private maxBulletHoles: number = 100
  private bulletHoleLifetime: number = 30 // seconds

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  /**
   * Create bullet hole decal at hit point
   */
  createBulletHole(
    point: THREE.Vector3,
    normal: THREE.Vector3,
    surface: 'concrete' | 'metal' | 'wood' = 'concrete'
  ): void {
    // Create bullet hole geometry
    const size = 0.05 + Math.random() * 0.03
    const geometry = new THREE.PlaneGeometry(size, size)
    
    // Material based on surface type
    let color = 0x333333
    if (surface === 'metal') color = 0x222222
    if (surface === 'wood') color = 0x442200
    
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    
    // Position at hit point (slightly offset from surface to prevent z-fighting)
    mesh.position.copy(point).add(normal.clone().multiplyScalar(0.01))
    
    // Rotate to face normal
    mesh.lookAt(point.clone().add(normal))
    
    // Random rotation for variety
    mesh.rotateZ(Math.random() * Math.PI * 2)
    
    this.scene.add(mesh)
    
    // Store bullet hole
    const bulletHole: BulletHole = {
      mesh,
      createdAt: Date.now() / 1000,
      lifetime: this.bulletHoleLifetime
    }
    
    this.bulletHoles.push(bulletHole)
    
    // Remove oldest if exceeding max
    if (this.bulletHoles.length > this.maxBulletHoles) {
      const oldest = this.bulletHoles.shift()
      if (oldest) {
        this.scene.remove(oldest.mesh)
        oldest.mesh.geometry.dispose()
        ;(oldest.mesh.material as THREE.Material).dispose()
      }
    }
  }

  /**
   * Update and cleanup old bullet holes
   */
  update(currentTime: number): void {
    // Remove expired bullet holes
    this.bulletHoles = this.bulletHoles.filter(hole => {
      if (currentTime - hole.createdAt > hole.lifetime) {
        this.scene.remove(hole.mesh)
        hole.mesh.geometry.dispose()
        ;(hole.mesh.material as THREE.Material).dispose()
        return false
      }
      return true
    })
  }

  /**
   * Clear all bullet holes
   */
  clear(): void {
    this.bulletHoles.forEach(hole => {
      this.scene.remove(hole.mesh)
      hole.mesh.geometry.dispose()
      ;(hole.mesh.material as THREE.Material).dispose()
    })
    this.bulletHoles = []
  }
}

// =============================================================================
// KILL EFFECT SYSTEM
// =============================================================================

export class KillEffectSystem {
  private scene: THREE.Scene
  private camera: THREE.Camera

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene
    this.camera = camera
  }

  /**
   * Create kill effect at enemy position
   */
  createKillEffect(position: THREE.Vector3, isHeadshot: boolean = false): void {
    // Particle burst
    this.createParticleBurst(position, isHeadshot ? 0xff0000 : 0xffaa00, isHeadshot ? 30 : 20)
    
    // Screen shake (handled externally via camera)
    // TODO: Trigger screen shake via event
  }

  /**
   * Create particle burst effect
   */
  private createParticleBurst(position: THREE.Vector3, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.05)
      const material = new THREE.MeshBasicMaterial({ color })
      const particle = new THREE.Mesh(geometry, material)
      
      particle.position.copy(position)
      
      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      )
      
      particle.userData.velocity = velocity
      particle.userData.lifetime = 1.0
      particle.userData.createdAt = Date.now() / 1000
      particle.userData.isParticle = true
      
      this.scene.add(particle)
      
      // Auto-remove after lifetime
      setTimeout(() => {
        this.scene.remove(particle)
        geometry.dispose()
        material.dispose()
      }, 1000)
    }
  }

  /**
   * Update particles (gravity + movement)
   */
  update(deltaTime: number): void {
    this.scene.traverse((obj) => {
      if (obj.userData.isParticle) {
        const velocity = obj.userData.velocity as THREE.Vector3
        if (velocity) {
          // Apply gravity
          velocity.y -= 9.8 * deltaTime
          
          // Move particle
          obj.position.add(velocity.clone().multiplyScalar(deltaTime))
          
          // Fade out
          const age = (Date.now() / 1000) - obj.userData.createdAt
          const material = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial
          material.opacity = 1.0 - (age / obj.userData.lifetime)
          material.transparent = true
        }
      }
    })
  }
}

// =============================================================================
// ENHANCED DAMAGE NUMBERS
// =============================================================================

export interface DamageNumber {
  value: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  lifetime: number
  createdAt: number
  color: string
  isCritical: boolean
}

export class EnhancedDamageNumberSystem {
  private canvas: HTMLCanvasElement
  private camera: THREE.Camera
  private damageNumbers: DamageNumber[] = []
  private maxNumbers: number = 50

  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera) {
    this.canvas = canvas
    this.camera = camera
  }

  /**
   * Add damage number
   */
  addDamageNumber(
    damage: number,
    position: THREE.Vector3,
    isCritical: boolean = false
  ): void {
    const damageNumber: DamageNumber = {
      value: Math.round(damage),
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        1.5 + Math.random(),
        (Math.random() - 0.5) * 0.5
      ),
      lifetime: 2.0,
      createdAt: Date.now() / 1000,
      color: isCritical ? '#ff0000' : '#ffffff',
      isCritical
    }
    
    this.damageNumbers.push(damageNumber)
    
    // Remove oldest if exceeding max
    if (this.damageNumbers.length > this.maxNumbers) {
      this.damageNumbers.shift()
    }
  }

  /**
   * Update damage numbers
   */
  update(deltaTime: number): void {
    const currentTime = Date.now() / 1000
    
    this.damageNumbers = this.damageNumbers.filter(num => {
      // Update position
      num.position.add(num.velocity.clone().multiplyScalar(deltaTime))
      
      // Apply gravity to velocity
      num.velocity.y -= 2 * deltaTime
      
      // Check lifetime
      return (currentTime - num.createdAt) < num.lifetime
    })
  }

  /**
   * Render damage numbers
   */
  render(ctx: CanvasRenderingContext2D): void {
    const currentTime = Date.now() / 1000
    
    this.damageNumbers.forEach(num => {
      // Project 3D position to 2D screen
      const screenPos = num.position.clone().project(this.camera)
      
      // Convert to canvas coordinates
      const x = (screenPos.x + 1) * this.canvas.width / 2
      const y = (-screenPos.y + 1) * this.canvas.height / 2
      
      // Check if in front of camera
      if (screenPos.z > 1) return
      
      // Calculate fade-out alpha
      const age = currentTime - num.createdAt
      const alpha = 1.0 - (age / num.lifetime)
      
      // Draw damage number
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.font = num.isCritical ? 'bold 32px Arial' : 'bold 24px Arial'
      ctx.fillStyle = num.color
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.textAlign = 'center'
      
      const text = `-${num.value}`
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
      
      ctx.restore()
    })
  }
}

// =============================================================================
// MAIN VISUAL FEEDBACK MANAGER
// =============================================================================

export class AdvancedVisualFeedbackManager {
  private screenFlash: ScreenFlashSystem
  private bulletHoles: BulletHoleSystem
  private killEffects: KillEffectSystem
  private damageNumbers: EnhancedDamageNumberSystem

  constructor(
    overlayCanvas: HTMLCanvasElement,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.screenFlash = new ScreenFlashSystem(overlayCanvas)
    this.bulletHoles = new BulletHoleSystem(scene)
    this.killEffects = new KillEffectSystem(scene, camera)
    this.damageNumbers = new EnhancedDamageNumberSystem(overlayCanvas, camera)
  }

  /**
   * Trigger screen flash (e.g., on taking damage)
   */
  flashScreen(color: string = 'red', intensity: number = 0.5, duration: number = 0.3): void {
    this.screenFlash.trigger(color, intensity, duration)
  }

  /**
   * Create bullet hole at impact point
   */
  createBulletHole(point: THREE.Vector3, normal: THREE.Vector3, surface: 'concrete' | 'metal' | 'wood' = 'concrete'): void {
    this.bulletHoles.createBulletHole(point, normal, surface)
  }

  /**
   * Create kill effect
   */
  createKillEffect(position: THREE.Vector3, isHeadshot: boolean = false): void {
    this.killEffects.createKillEffect(position, isHeadshot)
  }

  /**
   * Show damage number
   */
  showDamageNumber(damage: number, position: THREE.Vector3, isCritical: boolean = false): void {
    this.damageNumbers.addDamageNumber(damage, position, isCritical)
  }

  /**
   * Update all systems
   */
  update(deltaTime: number): void {
    this.screenFlash.update(deltaTime)
    this.bulletHoles.update(Date.now() / 1000)
    this.killEffects.update(deltaTime)
    this.damageNumbers.update(deltaTime)
  }

  /**
   * Render overlay effects
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.screenFlash.render(ctx, width, height)
    this.damageNumbers.render(ctx)
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.bulletHoles.clear()
  }
}

