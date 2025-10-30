/**
 * 🔫 WEAPON MANAGER - ERWEITERTE VERSION MIT RAYCASTING
 */

import * as THREE from 'three'
import type { WeaponData } from './data/WeaponData'
import { WeaponType } from './data/WeaponData'
import { BaseWeapon } from './BaseWeapon'
import { PhysicsEngine } from '../physics/PhysicsEngine'

// ============================================================
// TYPES
// ============================================================

export interface WeaponSwitchEvent {
  from: BaseWeapon | null
  to: BaseWeapon
  timestamp: number
}

export interface ShootResult {
  success: boolean
  origin: THREE.Vector3
  direction: THREE.Vector3
  damage: number
  weapon: BaseWeapon
  hit?: THREE.Intersection
}

export type WeaponSwitchCallback = (event: WeaponSwitchEvent) => void
export type WeaponFireCallback = (result: ShootResult) => void

// ============================================================
// WEAPON MANAGER CLASS - ERWEITERT
// ============================================================

export class WeaponManager {
  // Inventory
  private inventory: Map<string, BaseWeapon> = new Map()
  private currentWeapon: BaseWeapon | null = null
  
  // Physics Integration
  private physicsEngine: PhysicsEngine | null = null
  
  // Callbacks
  private onSwitchCallbacks: WeaponSwitchCallback[] = []
  private onFireCallbacks: WeaponFireCallback[] = []
  
  // Scene references
  private scene?: THREE.Scene
  private camera?: THREE.Camera

  // ============================================================
  // INITIALIZATION
  // ============================================================

  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  setCamera(camera: THREE.Camera): void {
    this.camera = camera
  }
  
  /**
   * NEU: Physics Engine für Raycasting setzen
   */
  setPhysicsEngine(engine: PhysicsEngine): void {
    this.physicsEngine = engine
    console.log('🔫 WeaponManager: Physics Engine connected for raycasting')
  }

  // ============================================================
  // WEAPON MANAGEMENT
  // ============================================================

  async addWeapon(weaponId: string, weaponData?: WeaponData): Promise<BaseWeapon> {
    // Simplified weapon creation
    const weapon = new BaseWeapon(weaponData || this.getDefaultWeaponData(weaponId))
    
    if (this.scene) weapon.setScene(this.scene)
    if (this.camera) weapon.setCamera(this.camera)
    
    this.inventory.set(weaponId, weapon)
    
    if (this.inventory.size === 1) {
      this.currentWeapon = weapon
    }
    
    return weapon
  }
  
  private getDefaultWeaponData(weaponId: string): WeaponData {
    // Standard Waffen-Daten
    return {
      id: weaponId,
      name: weaponId,
      type: WeaponType.RIFLE,
      damage: 30,
      fireRate: 600,
      magazineSize: 30,
      maxTotalAmmo: 120,
      reloadTime: 2.5,
      tacticalReloadTime: 1.8,
      range: 1000,
      accuracy: 85,
      recoil: { x: 0.1, y: 0.3, z: 0 },
      sprayPattern: [],
      switchSpeed: 0.5,
      adsSpeed: 0.2,
      adsZoom: 1.5,
      viewmodelPosition: { x: 0.3, y: -0.2, z: -0.5 },
      adsPosition: { x: 0, y: -0.1, z: -0.3 },
      sounds: {
        fire: 'rifle_fire',
        reload: 'rifle_reload',
        empty: 'rifle_empty'
      }
    }
  }

  // ============================================================
  // WEAPON SWITCHING
  // ============================================================

  async switchWeapon(weaponId: string): Promise<boolean> {
    const weapon = this.inventory.get(weaponId)
    if (!weapon || weapon === this.currentWeapon) {
      return false
    }

    const previousWeapon = this.currentWeapon
    this.currentWeapon = weapon

    // Fire event
    this.onSwitchCallbacks.forEach(cb => cb({
      from: previousWeapon,
      to: weapon,
      timestamp: Date.now()
    }))

    return true
  }

  // ============================================================
  // SHOOTING WITH RAYCASTING
  // ============================================================

  /**
   * ERWEITERT: Nutzt jetzt PhysicsEngine.raycast() statt eigenes Raycasting
   */
  shoot(origin?: THREE.Vector3, direction?: THREE.Vector3): ShootResult | null {
    if (!this.currentWeapon || !this.currentWeapon.canShoot()) {
      return null
    }

    // Use camera position/direction if not provided
    const shootOrigin = origin || this.camera?.position || new THREE.Vector3()
    const shootDirection = direction || this.getShootDirection()

    // Consume ammo
    this.currentWeapon.consumeAmmo()

    // RAYCASTING mit PhysicsEngine
    let hit: THREE.Intersection | undefined
    
    if (this.physicsEngine) {
      const rayResult = this.physicsEngine.raycast(
        shootOrigin,
        shootDirection,
        this.currentWeapon.getData().range
      )
      
      if (rayResult.hit) {
        hit = {
          distance: rayResult.distance,
          point: rayResult.point,
          object: rayResult.object?.mesh || new THREE.Object3D(),
          face: null,
          faceIndex: 0,
          uv: null,
          uv1: null,
          normal: rayResult.normal,
          instanceId: undefined
        }
      }
    } else if (this.scene) {
      // Fallback: Eigenes Raycasting wenn keine PhysicsEngine
      const raycaster = new THREE.Raycaster(
        shootOrigin, 
        shootDirection, 
        0, 
        this.currentWeapon.getData().range
      )
      const intersects = raycaster.intersectObjects(this.scene.children, true)
      hit = intersects[0]
    }

    const result: ShootResult = {
      success: true,
      origin: shootOrigin,
      direction: shootDirection,
      damage: this.currentWeapon.getData().damage,
      weapon: this.currentWeapon,
      hit
    }

    // Fire callbacks
    this.onFireCallbacks.forEach(cb => cb(result))

    return result
  }
  
  private getShootDirection(): THREE.Vector3 {
    if (this.camera) {
      const direction = new THREE.Vector3()
      this.camera.getWorldDirection(direction)
      return direction
    }
    return new THREE.Vector3(0, 0, -1)
  }

  // ============================================================
  // WEAPON ACTIONS
  // ============================================================

  async reload(): Promise<void> {
    if (this.currentWeapon && this.currentWeapon.canReload()) {
      await this.currentWeapon.reload()
    }
  }

  update(deltaTime: number): void {
    if (this.currentWeapon) {
      this.currentWeapon.update(deltaTime)
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  getCurrentWeapon(): BaseWeapon | null {
    return this.currentWeapon
  }

  getWeapon(weaponId: string): BaseWeapon | null {
    return this.inventory.get(weaponId) || null
  }

  // ============================================================
  // EVENTS
  // ============================================================

  onWeaponSwitch(callback: WeaponSwitchCallback): void {
    this.onSwitchCallbacks.push(callback)
  }

  /**
   * NEU: Fire Event mit ShootResult statt nur Weapon
   */
  onFire(callback: WeaponFireCallback): void {
    this.onFireCallbacks.push(callback)
  }
}
