/**
 * 🎯 HITBOX SYSTEM
 * 
 * Separate Hitboxes für Head/Body/Legs
 * Damage Multipliers pro Zone
 * Präzises Hit Detection
 */

import * as THREE from 'three'

// =============================================================================
// HITBOX TYPES
// =============================================================================

export enum HitboxZone {
  HEAD = 'head',
  NECK = 'neck',
  CHEST = 'chest',
  STOMACH = 'stomach',
  ARMS = 'arms',
  LEGS = 'legs'
}

export interface HitboxZoneConfig {
  zone: HitboxZone
  damageMultiplier: number
  size: THREE.Vector3 // Width, Height, Depth
  offset: THREE.Vector3 // Offset from character center
  debugColor: number // Color for debug visualization
}

export interface HitResult {
  hit: boolean
  zone: HitboxZone | null
  damageMultiplier: number
  point: THREE.Vector3
  distance: number
}

// =============================================================================
// HITBOX CONFIGURATIONS
// =============================================================================

export const HITBOX_CONFIGS: Record<HitboxZone, HitboxZoneConfig> = {
  [HitboxZone.HEAD]: {
    zone: HitboxZone.HEAD,
    damageMultiplier: 4.0, // 4x damage (instant kill potential)
    size: new THREE.Vector3(0.25, 0.3, 0.25), // Small head hitbox
    offset: new THREE.Vector3(0, 1.6, 0), // Top of character
    debugColor: 0xff0000 // Red
  },
  [HitboxZone.NECK]: {
    zone: HitboxZone.NECK,
    damageMultiplier: 2.5, // 2.5x damage
    size: new THREE.Vector3(0.2, 0.15, 0.2),
    offset: new THREE.Vector3(0, 1.35, 0),
    debugColor: 0xff8800 // Orange
  },
  [HitboxZone.CHEST]: {
    zone: HitboxZone.CHEST,
    damageMultiplier: 1.0, // Normal damage
    size: new THREE.Vector3(0.4, 0.5, 0.3),
    offset: new THREE.Vector3(0, 0.9, 0),
    debugColor: 0x00ff00 // Green
  },
  [HitboxZone.STOMACH]: {
    zone: HitboxZone.STOMACH,
    damageMultiplier: 1.0, // Normal damage
    size: new THREE.Vector3(0.35, 0.3, 0.25),
    offset: new THREE.Vector3(0, 0.5, 0),
    debugColor: 0x00ff88 // Light Green
  },
  [HitboxZone.ARMS]: {
    zone: HitboxZone.ARMS,
    damageMultiplier: 0.75, // 25% less damage
    size: new THREE.Vector3(0.5, 0.6, 0.2), // Wide to cover both arms
    offset: new THREE.Vector3(0, 0.8, 0),
    debugColor: 0x0088ff // Blue
  },
  [HitboxZone.LEGS]: {
    zone: HitboxZone.LEGS,
    damageMultiplier: 0.75, // 25% less damage
    size: new THREE.Vector3(0.3, 0.8, 0.2),
    offset: new THREE.Vector3(0, 0.4, 0),
    debugColor: 0x8800ff // Purple
  }
}

// =============================================================================
// HITBOX CLASS
// =============================================================================

export class Hitbox {
  public zone: HitboxZone
  public box: THREE.Box3
  public mesh: THREE.Mesh | null = null // Debug visualization
  private config: HitboxZoneConfig
  private parentPosition: THREE.Vector3

  constructor(zone: HitboxZone, parentPosition: THREE.Vector3) {
    this.zone = zone
    this.config = HITBOX_CONFIGS[zone]
    this.parentPosition = parentPosition
    this.box = new THREE.Box3()
    this.updateBox()
  }

  /**
   * Update hitbox position based on parent
   */
  updateBox(): void {
    const center = this.parentPosition.clone().add(this.config.offset)
    const halfSize = this.config.size.clone().multiplyScalar(0.5)
    
    this.box.min.copy(center).sub(halfSize)
    this.box.max.copy(center).add(halfSize)
  }

  /**
   * Check if ray intersects this hitbox
   */
  raycast(ray: THREE.Ray): { intersects: boolean; distance: number; point: THREE.Vector3 } {
    const target = new THREE.Vector3()
    const intersectPoint = ray.intersectBox(this.box, target)
    
    if (intersectPoint) {
      return {
        intersects: true,
        distance: ray.origin.distanceTo(intersectPoint),
        point: intersectPoint
      }
    }
    
    return {
      intersects: false,
      distance: Infinity,
      point: new THREE.Vector3()
    }
  }

  /**
   * Get damage multiplier for this zone
   */
  getDamageMultiplier(): number {
    return this.config.damageMultiplier
  }

  /**
   * Create debug visualization
   */
  createDebugMesh(scene: THREE.Scene): void {
    const geometry = new THREE.BoxGeometry(
      this.config.size.x,
      this.config.size.y,
      this.config.size.z
    )
    const material = new THREE.MeshBasicMaterial({
      color: this.config.debugColor,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.parentPosition).add(this.config.offset)
    this.mesh.userData.isDebug = true
    scene.add(this.mesh)
  }

  /**
   * Update debug mesh position
   */
  updateDebugMesh(): void {
    if (this.mesh) {
      this.mesh.position.copy(this.parentPosition).add(this.config.offset)
    }
  }

  /**
   * Remove debug mesh
   */
  removeDebugMesh(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh)
      this.mesh.geometry.dispose()
      ;(this.mesh.material as THREE.Material).dispose()
      this.mesh = null
    }
  }
}

// =============================================================================
// CHARACTER HITBOX MANAGER
// =============================================================================

export class CharacterHitboxManager {
  private hitboxes: Map<HitboxZone, Hitbox> = new Map()
  private characterPosition: THREE.Vector3
  private characterMesh: THREE.Object3D
  private debugEnabled: boolean = false

  constructor(characterMesh: THREE.Object3D) {
    this.characterMesh = characterMesh
    this.characterPosition = characterMesh.position
    this.initializeHitboxes()
  }

  /**
   * Initialize all hitboxes
   */
  private initializeHitboxes(): void {
    // Create hitboxes in priority order (head first for faster checks)
    const zoneOrder: HitboxZone[] = [
      HitboxZone.HEAD,
      HitboxZone.NECK,
      HitboxZone.CHEST,
      HitboxZone.STOMACH,
      HitboxZone.ARMS,
      HitboxZone.LEGS
    ]

    zoneOrder.forEach(zone => {
      this.hitboxes.set(zone, new Hitbox(zone, this.characterPosition))
    })
  }

  /**
   * Update all hitboxes (call every frame or when character moves)
   */
  update(): void {
    this.hitboxes.forEach(hitbox => {
      hitbox.updateBox()
      if (this.debugEnabled) {
        hitbox.updateDebugMesh()
      }
    })
  }

  /**
   * Raycast against all hitboxes (returns best hit)
   */
  raycast(origin: THREE.Vector3, direction: THREE.Vector3): HitResult {
    const ray = new THREE.Ray(origin, direction.normalize())
    
    let closestHit: HitResult = {
      hit: false,
      zone: null,
      damageMultiplier: 1.0,
      point: new THREE.Vector3(),
      distance: Infinity
    }

    // Check all hitboxes, prioritize closest hit
    this.hitboxes.forEach(hitbox => {
      const result = hitbox.raycast(ray)
      
      if (result.intersects && result.distance < closestHit.distance) {
        closestHit = {
          hit: true,
          zone: hitbox.zone,
          damageMultiplier: hitbox.getDamageMultiplier(),
          point: result.point,
          distance: result.distance
        }
      }
    })

    return closestHit
  }

  /**
   * Enable debug visualization
   */
  enableDebug(scene: THREE.Scene): void {
    this.debugEnabled = true
    this.hitboxes.forEach(hitbox => hitbox.createDebugMesh(scene))
  }

  /**
   * Disable debug visualization
   */
  disableDebug(scene: THREE.Scene): void {
    this.debugEnabled = false
    this.hitboxes.forEach(hitbox => hitbox.removeDebugMesh(scene))
  }

  /**
   * Cleanup
   */
  destroy(scene: THREE.Scene): void {
    if (this.debugEnabled) {
      this.disableDebug(scene)
    }
    this.hitboxes.clear()
  }
}

// =============================================================================
// GLOBAL HITBOX MANAGER (for all characters)
// =============================================================================

export class HitboxSystemManager {
  private characterHitboxes: Map<string, CharacterHitboxManager> = new Map()
  private scene: THREE.Scene | null = null
  private debugEnabled: boolean = false

  /**
   * Set scene reference
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  /**
   * Register a character for hitbox tracking
   */
  registerCharacter(id: string, mesh: THREE.Object3D): void {
    if (!this.characterHitboxes.has(id)) {
      const manager = new CharacterHitboxManager(mesh)
      
      if (this.debugEnabled && this.scene) {
        manager.enableDebug(this.scene)
      }
      
      this.characterHitboxes.set(id, manager)
      // Silent registration - no console spam
    }
  }

  /**
   * Unregister a character
   */
  unregisterCharacter(id: string): void {
    const manager = this.characterHitboxes.get(id)
    if (manager && this.scene) {
      manager.destroy(this.scene)
      this.characterHitboxes.delete(id)
    }
  }

  /**
   * Update all character hitboxes
   */
  update(): void {
    this.characterHitboxes.forEach(manager => manager.update())
  }

  /**
   * Raycast against a specific character
   */
  raycastCharacter(characterId: string, origin: THREE.Vector3, direction: THREE.Vector3): HitResult {
    const manager = this.characterHitboxes.get(characterId)
    
    if (!manager) {
      return {
        hit: false,
        zone: null,
        damageMultiplier: 1.0,
        point: new THREE.Vector3(),
        distance: Infinity
      }
    }
    
    return manager.raycast(origin, direction)
  }

  /**
   * Enable debug visualization for all characters
   */
  enableDebug(): void {
    if (!this.scene) {
      console.warn('⚠️ Scene not set, cannot enable hitbox debug')
      return
    }
    
    this.debugEnabled = true
    this.characterHitboxes.forEach(manager => manager.enableDebug(this.scene!))
    console.log('🎯 Hitbox Debug: ENABLED')
  }

  /**
   * Disable debug visualization
   */
  disableDebug(): void {
    if (!this.scene) return
    
    this.debugEnabled = false
    this.characterHitboxes.forEach(manager => manager.disableDebug(this.scene!))
    console.log('🎯 Hitbox Debug: DISABLED')
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.scene) {
      this.characterHitboxes.forEach(manager => manager.destroy(this.scene!))
    }
    this.characterHitboxes.clear()
  }
}

