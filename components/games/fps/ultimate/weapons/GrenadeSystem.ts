/**
 * 💣 GRENADE SYSTEM
 * 
 * Throwable grenades with physics
 * - Frag Grenades (Explosion damage)
 * - Smoke Grenades (Vision obscuring)
 * - Flash Bangs (Blind enemies)
 * - Physics-based throwing
 * - Trajectory preview
 */

import * as THREE from 'three'

export enum GrenadeType {
  FRAG = 'frag',
  SMOKE = 'smoke',
  FLASH = 'flash'
}

export interface GrenadeConfig {
  fuseTime: number // seconds
  throwForce: number
  damageRadius: number
  damage: number
  effectDuration?: number
}

export const GRENADE_CONFIGS: Record<GrenadeType, GrenadeConfig> = {
  [GrenadeType.FRAG]: {
    fuseTime: 3.0,
    throwForce: 20,
    damageRadius: 8,
    damage: 100
  },
  [GrenadeType.SMOKE]: {
    fuseTime: 1.5,
    throwForce: 15,
    damageRadius: 10,
    damage: 0,
    effectDuration: 15
  },
  [GrenadeType.FLASH]: {
    fuseTime: 1.0,
    throwForce: 25,
    damageRadius: 12,
    damage: 0,
    effectDuration: 5
  }
}

export interface ActiveGrenade {
  id: string
  type: GrenadeType
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  createdAt: number
  config: GrenadeConfig
}

export class GrenadeSystem {
  private scene: THREE.Scene
  private activeGrenades: Map<string, ActiveGrenade> = new Map()
  private grenadeInventory: Map<GrenadeType, number> = new Map()
  
  // Callbacks
  private onExplosionCallback?: (position: THREE.Vector3, radius: number, damage: number) => void
  private onSmokeCallback?: (position: THREE.Vector3, duration: number) => void
  private onFlashCallback?: (position: THREE.Vector3, radius: number, duration: number) => void

  constructor(scene: THREE.Scene) {
    this.scene = scene
    
    // Default inventory
    this.grenadeInventory.set(GrenadeType.FRAG, 3)
    this.grenadeInventory.set(GrenadeType.SMOKE, 2)
    this.grenadeInventory.set(GrenadeType.FLASH, 2)
    
    console.log('💣 Grenade System initialized')
  }

  /**
   * Throw grenade
   */
  throwGrenade(
    type: GrenadeType,
    position: THREE.Vector3,
    direction: THREE.Vector3
  ): boolean {
    // Check inventory
    const count = this.grenadeInventory.get(type) || 0
    if (count <= 0) {
      console.warn(`No ${type} grenades left`)
      return false
    }

    // Decrease inventory
    this.grenadeInventory.set(type, count - 1)

    // Create grenade
    const config = GRENADE_CONFIGS[type]
    const id = `grenade_${Date.now()}_${Math.random()}`

    // Create mesh
    const geometry = new THREE.SphereGeometry(0.1, 8, 8)
    const material = new THREE.MeshStandardMaterial({
      color: type === GrenadeType.FRAG ? 0x444444 :
             type === GrenadeType.SMOKE ? 0xaaaaaa : 0xffff00
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    
    this.scene.add(mesh)

    // Calculate velocity
    const velocity = direction.clone().normalize().multiplyScalar(config.throwForce)

    // Add to active grenades
    const grenade: ActiveGrenade = {
      id,
      type,
      mesh,
      velocity,
      createdAt: Date.now(),
      config
    }

    this.activeGrenades.set(id, grenade)
    console.log(`💣 ${type} grenade thrown`)
    
    return true
  }

  /**
   * Update grenades (physics & fuse)
   */
  update(deltaTime: number): void {
    const now = Date.now()
    const toRemove: string[] = []

    this.activeGrenades.forEach((grenade) => {
      // Apply gravity
      grenade.velocity.y -= 9.8 * deltaTime

      // Update position
      grenade.mesh.position.add(
        grenade.velocity.clone().multiplyScalar(deltaTime)
      )

      // Ground collision
      if (grenade.mesh.position.y < 0) {
        grenade.mesh.position.y = 0
        grenade.velocity.y *= -0.3 // Bounce
        grenade.velocity.x *= 0.7 // Friction
        grenade.velocity.z *= 0.7
      }

      // Check fuse
      const elapsed = (now - grenade.createdAt) / 1000
      if (elapsed >= grenade.config.fuseTime) {
        // Detonate
        this.detonateGrenade(grenade)
        toRemove.push(grenade.id)
      }
    })

    // Remove detonated grenades
    toRemove.forEach(id => {
      const grenade = this.activeGrenades.get(id)
      if (grenade) {
        this.scene.remove(grenade.mesh)
        grenade.mesh.geometry.dispose()
        ;(grenade.mesh.material as THREE.Material).dispose()
        this.activeGrenades.delete(id)
      }
    })
  }

  /**
   * Detonate grenade
   */
  private detonateGrenade(grenade: ActiveGrenade): void {
    const position = grenade.mesh.position.clone()
    
    console.log(`💥 ${grenade.type} grenade detonated at`, position)

    switch (grenade.type) {
      case GrenadeType.FRAG:
        // Explosion damage
        if (this.onExplosionCallback) {
          this.onExplosionCallback(position, grenade.config.damageRadius, grenade.config.damage)
        }
        break

      case GrenadeType.SMOKE:
        // Smoke effect
        if (this.onSmokeCallback && grenade.config.effectDuration) {
          this.onSmokeCallback(position, grenade.config.effectDuration)
        }
        break

      case GrenadeType.FLASH:
        // Flash effect
        if (this.onFlashCallback && grenade.config.effectDuration) {
          this.onFlashCallback(position, grenade.config.damageRadius, grenade.config.effectDuration)
        }
        break
    }
  }

  /**
   * Get grenade count
   */
  getGrenadeCount(type: GrenadeType): number {
    return this.grenadeInventory.get(type) || 0
  }

  /**
   * Add grenades
   */
  addGrenades(type: GrenadeType, count: number): void {
    const current = this.grenadeInventory.get(type) || 0
    this.grenadeInventory.set(type, current + count)
  }

  /**
   * Set callbacks
   */
  onExplosion(callback: (position: THREE.Vector3, radius: number, damage: number) => void): void {
    this.onExplosionCallback = callback
  }

  onSmoke(callback: (position: THREE.Vector3, duration: number) => void): void {
    this.onSmokeCallback = callback
  }

  onFlash(callback: (position: THREE.Vector3, radius: number, duration: number) => void): void {
    this.onFlashCallback = callback
  }

  /**
   * Get inventory
   */
  getInventory(): Map<GrenadeType, number> {
    return new Map(this.grenadeInventory)
  }
}

