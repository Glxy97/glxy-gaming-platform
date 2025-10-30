/**
 * 🔫 BASE WEAPON - ERWEITERT MIT PHYSICS ENGINE RAYCASTING
 */

import * as THREE from 'three'
import type { WeaponData } from './data/WeaponData'

// ============================================================
// INTERFACES
// ============================================================

export interface WeaponState {
  currentAmmo: number
  totalAmmo: number
  isReloading: boolean
  lastShotTime: number
  consecutiveShots: number
}

export interface ShootResult {
  success: boolean
  damage: number
  origin: THREE.Vector3
  direction: THREE.Vector3
}

// ============================================================
// BASE WEAPON CLASS - ERWEITERT
// ============================================================

export class BaseWeapon {
  // Weapon Data
  protected readonly data: WeaponData
  
  // Weapon State
  protected state: WeaponState
  
  // Scene References
  protected scene?: THREE.Scene
  protected camera?: THREE.Camera
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(weaponData: WeaponData) {
    this.data = weaponData
    this.state = {
      currentAmmo: weaponData.magazineSize,
      totalAmmo: weaponData.maxTotalAmmo,
      isReloading: false,
      lastShotTime: 0,
      consecutiveShots: 0
    }
  }
  
  // ============================================================
  // SHOOTING - OHNE EIGENES RAYCASTING
  // ============================================================
  
  /**
   * VEREINFACHT: Kein eigenes Raycasting mehr, das macht der WeaponManager
   */
  shoot(origin: THREE.Vector3, direction: THREE.Vector3): ShootResult {
    if (!this.canShoot()) {
      return {
        success: false,
        damage: 0,
        origin,
        direction
      }
    }
    
    // Ammo verbrauchen
    this.consumeAmmo()
    
    // Spray Pattern anwenden
    const sprayOffset = this.calculateSprayOffset()
    const finalDirection = direction.clone().add(sprayOffset).normalize()
    
    return {
      success: true,
      damage: this.data.damage,
      origin,
      direction: finalDirection
    }
  }
  
  // ============================================================
  // AMMO & RELOADING
  // ============================================================
  
  canShoot(): boolean {
    const fireDelay = 60000 / this.data.fireRate // ms zwischen Schüssen
    const timeSinceShot = Date.now() - this.state.lastShotTime
    
    return !this.state.isReloading && 
           this.state.currentAmmo > 0 && 
           timeSinceShot >= fireDelay
  }
  
  canReload(): boolean {
    return !this.state.isReloading && 
           this.state.currentAmmo < this.data.magazineSize && 
           this.state.totalAmmo > 0
  }
  
  consumeAmmo(): void {
    this.state.currentAmmo--
    this.state.lastShotTime = Date.now()
    this.state.consecutiveShots++
  }
  
  async reload(): Promise<void> {
    if (!this.canReload()) return
    
    this.state.isReloading = true
    
    // Reload Zeit
    const reloadTime = this.state.currentAmmo > 0 ? 
      this.data.tacticalReloadTime : 
      this.data.reloadTime
    
    await new Promise(resolve => setTimeout(resolve, reloadTime * 1000))
    
    // Ammo Transfer
    const ammoNeeded = this.data.magazineSize - this.state.currentAmmo
    const ammoToAdd = Math.min(ammoNeeded, this.state.totalAmmo)
    
    this.state.currentAmmo += ammoToAdd
    this.state.totalAmmo -= ammoToAdd
    this.state.isReloading = false
    this.state.consecutiveShots = 0
  }
  
  // ============================================================
  // SPRAY & RECOIL
  // ============================================================
  
  private calculateSprayOffset(): THREE.Vector3 {
    // Spray wird stärker mit mehr aufeinanderfolgenden Schüssen
    const sprayMultiplier = Math.min(this.state.consecutiveShots * 0.02, 0.2)
    
    return new THREE.Vector3(
      (Math.random() - 0.5) * sprayMultiplier,
      (Math.random() - 0.5) * sprayMultiplier,
      (Math.random() - 0.5) * sprayMultiplier
    )
  }
  
  getRecoil(): THREE.Vector3 {
    // Recoil für Camera/View
    const recoil = this.data.recoil
    const multiplier = 1 + (this.state.consecutiveShots * 0.1)
    
    return new THREE.Vector3(
      recoil.x * multiplier,
      recoil.y * multiplier,
      recoil.z * multiplier
    )
  }
  
  // ============================================================
  // UPDATE
  // ============================================================
  
  update(deltaTime: number): void {
    // Reset Spray nach Pause
    const timeSinceShot = Date.now() - this.state.lastShotTime
    if (timeSinceShot > 300) {
      this.state.consecutiveShots = 0
    }
  }
  
  // ============================================================
  // SETTERS
  // ============================================================
  
  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }
  
  setCamera(camera: THREE.Camera): void {
    this.camera = camera
  }
  
  // ============================================================
  // GETTERS
  // ============================================================
  
  getData(): Readonly<WeaponData> {
    return this.data
  }
  
  getState(): Readonly<WeaponState> {
    return this.state
  }
  
  getCurrentAmmo(): number {
    return this.state.currentAmmo
  }
  
  getTotalAmmo(): number {
    return this.state.totalAmmo
  }
  
  isReloading(): boolean {
    return this.state.isReloading
  }
  
  getName(): string {
    return this.data.name
  }
  
  getId(): string {
    return this.data.id
  }
  
  getType(): string {
    return this.data.type
  }
  
  getAmmoString(): string {
    return `${this.state.currentAmmo} / ${this.state.totalAmmo}`
  }
}

// ============================================================
// WEAPON DATA TYPE (VEREINFACHT)
// ============================================================

export enum WeaponType {
  PISTOL = 'pistol',
  RIFLE = 'rifle',
  SMG = 'smg',
  SNIPER = 'sniper',
  SHOTGUN = 'shotgun',
  MELEE = 'melee'
}

export default BaseWeapon
