/**
 * 🔫 BASE WEAPON CLASS
 * Abstract base class für alle Waffen
 * Composition over Inheritance - Shared Logic hier, Specific Logic in Derived Classes
 */

import * as THREE from 'three'
import type { WeaponData } from './data/WeaponData'
import { getFireDelay, toVector3 } from './data/WeaponData'

// ============================================================
// INTERFACES
// ============================================================

export interface WeaponState {
  currentAmmo: number
  totalAmmo: number
  isReloading: boolean
  lastShotTime: number
  consecutiveShots: number
  timeSinceLastShot: number
}

export interface ShootResult {
  success: boolean
  hit?: THREE.Intersection
  damage: number
  origin: THREE.Vector3
  direction: THREE.Vector3
}

// ============================================================
// BASE WEAPON CLASS
// ============================================================

export abstract class BaseWeapon {
  // Weapon Data (immutable blueprint)
  protected readonly data: WeaponData
  
  // Weapon State (mutable runtime state)
  protected state: WeaponState
  
  // Scene References
  protected scene?: THREE.Scene
  protected camera?: THREE.Camera
  protected weaponModel?: THREE.Group
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(weaponData: WeaponData) {
    this.data = weaponData
    this.state = this.initializeState()
  }
  
  /**
   * Initialize weapon state
   */
  private initializeState(): WeaponState {
    return {
      currentAmmo: this.data.magazineSize,
      totalAmmo: this.data.maxTotalAmmo,
      isReloading: false,
      lastShotTime: 0,
      consecutiveShots: 0,
      timeSinceLastShot: 0
    }
  }
  
  // ============================================================
  // ABSTRACT METHODS (must be implemented by derived classes)
  // ============================================================
  
  /**
   * Shoot the weapon
   * @param origin - Shooting origin (camera position)
   * @param direction - Shooting direction (camera forward)
   * @returns ShootResult
   */
  abstract shoot(origin: THREE.Vector3, direction: THREE.Vector3): ShootResult
  
  /**
   * Reload the weapon
   * @returns Promise<void>
   */
  abstract reload(): Promise<void>
  
  // ============================================================
  // SHARED LOGIC (available to all weapons)
  // ============================================================
  
  /**
   * Check if weapon can shoot
   */
  canShoot(): boolean {
    const fireDelay = getFireDelay(this.data.fireRate)
    const timeSinceShot = Date.now() - this.state.lastShotTime
    
    return !this.state.isReloading 
      && this.state.currentAmmo > 0 
      && timeSinceShot >= fireDelay
  }
  
  /**
   * Consume ammo after shooting
   */
  protected consumeAmmo(): void {
    this.state.currentAmmo--
    this.state.lastShotTime = Date.now()
    this.state.consecutiveShots++
  }
  
  /**
   * Reset spray counter after pause
   */
  resetSpray(): void {
    const timeSinceShot = Date.now() - this.state.lastShotTime
    if (timeSinceShot > 300) {
      this.state.consecutiveShots = 0
    }
  }
  
  /**
   * Update weapon (called every frame)
   */
  update(deltaTime: number): void {
    this.state.timeSinceLastShot = Date.now() - this.state.lastShotTime
    this.resetSpray()
  }
  
  /**
   * Check if reload is possible
   */
  canReload(): boolean {
    return !this.state.isReloading 
      && this.state.currentAmmo < this.data.magazineSize 
      && this.state.totalAmmo > 0
  }
  
  /**
   * Transfer ammo from reserve to magazine
   */
  protected transferAmmo(): void {
    const ammoNeeded = this.data.magazineSize - this.state.currentAmmo
    const ammoToAdd = Math.min(ammoNeeded, this.state.totalAmmo)
    
    this.state.currentAmmo += ammoToAdd
    this.state.totalAmmo -= ammoToAdd
  }
  
  /**
   * Get reload time (tactical vs. empty)
   */
  protected getReloadTime(): number {
    return this.state.currentAmmo > 0 
      ? this.data.tacticalReloadTime 
      : this.data.reloadTime
  }
  
  // ============================================================
  // GETTERS & SETTERS
  // ============================================================
  
  /**
   * Get weapon data
   */
  getData(): Readonly<WeaponData> {
    return this.data
  }
  
  /**
   * Get weapon state
   */
  getState(): Readonly<WeaponState> {
    return this.state
  }
  
  /**
   * Get current ammo
   */
  getCurrentAmmo(): number {
    return this.state.currentAmmo
  }
  
  /**
   * Get total ammo (reserve)
   */
  getTotalAmmo(): number {
    return this.state.totalAmmo
  }
  
  /**
   * Get magazine size
   */
  getMagazineSize(): number {
    return this.data.magazineSize
  }
  
  /**
   * Is reloading?
   */
  isReloading(): boolean {
    return this.state.isReloading
  }
  
  /**
   * Get consecutive shots (for spray control)
   */
  getConsecutiveShots(): number {
    return this.state.consecutiveShots
  }
  
  /**
   * Set scene reference
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }
  
  /**
   * Set camera reference
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera
  }
  
  /**
   * Set weapon model reference
   */
  setWeaponModel(model: THREE.Group): void {
    this.weaponModel = model
  }
  
  /**
   * Add ammo (pickup)
   */
  addAmmo(amount: number): void {
    const maxTotal = this.data.maxTotalAmmo
    this.state.totalAmmo = Math.min(this.state.totalAmmo + amount, maxTotal)
  }
  
  /**
   * Refill all ammo
   */
  refillAmmo(): void {
    this.state.currentAmmo = this.data.magazineSize
    this.state.totalAmmo = this.data.maxTotalAmmo
  }
  
  // ============================================================
  // UTILITY METHODS
  // ============================================================
  
  /**
   * Get weapon info string (for HUD)
   */
  getAmmoString(): string {
    return `${this.state.currentAmmo} / ${this.state.totalAmmo}`
  }
  
  /**
   * Get weapon name
   */
  getName(): string {
    return this.data.name
  }
  
  /**
   * Get weapon ID
   */
  getId(): string {
    return this.data.id
  }
  
  /**
   * Get weapon type
   */
  getType(): string {
    return this.data.type
  }
  
  /**
   * Get weapon viewmodel position
   */
  getViewmodelPosition(): THREE.Vector3 {
    return toVector3(this.data.viewmodelPosition)
  }
  
  /**
   * Get weapon ADS position
   */
  getADSPosition(): THREE.Vector3 {
    return toVector3(this.data.adsPosition)
  }
  
  /**
   * Perform raycast (shared utility)
   */
  protected performRaycast(
    origin: THREE.Vector3, 
    direction: THREE.Vector3, 
    maxDistance: number = this.data.range
  ): THREE.Intersection | null {
    if (!this.scene) {
      console.warn('⚠️ Cannot raycast: Scene not set')
      return null
    }
    
    const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance)
    
    // Set camera for sprite raycasting (if available)
    if (this.camera) {
      raycaster.camera = this.camera
    }
    
    // Safety check: Ensure scene.children exists
    if (!this.scene || !this.scene.children || !Array.isArray(this.scene.children) || this.scene.children.length === 0) {
      return null
    }
    
    // Try-catch for raycasting (objects might have invalid geometry/matrixWorld)
    let intersects: THREE.Intersection[] = []
    try {
      intersects = raycaster.intersectObjects(this.scene.children, true)
    } catch (error) {
      // Invalid geometry or matrixWorld in scene
      console.warn('⚠️ Raycasting error in weapon:', error)
      return null
    }
    
    // Return first hit (if any)
    return intersects.length > 0 ? intersects[0] : null
  }
  
  /**
   * Log weapon info
   */
  log(message: string): void {
    console.log(`🔫 [${this.data.name}] ${message}`)
  }
  
  /**
   * Log weapon error
   */
  logError(message: string): void {
    console.error(`❌ [${this.data.name}] ${message}`)
  }
}

