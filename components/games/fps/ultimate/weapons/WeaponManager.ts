/**
 * 🏭 WEAPON MANAGER
 * Central manager for weapon inventory, switching, and creation
 * Uses Factory Pattern for weapon instantiation
 */

import * as THREE from 'three'
import type { WeaponData } from './data/WeaponData'
import { WeaponType } from './data/WeaponData'
import { WeaponLoader } from './data/WeaponLoader'
import { BaseWeapon } from './BaseWeapon'
import { AssaultRifle } from './types/AssaultRifle'
import { SniperRifle } from './types/SniperRifle'
import { Pistol } from './types/Pistol'

// ============================================================
// TYPES
// ============================================================

export interface WeaponSwitchEvent {
  from: BaseWeapon | null
  to: BaseWeapon
  timestamp: number
}

export type WeaponManagerEventCallback = (event: WeaponSwitchEvent) => void

// ============================================================
// WEAPON MANAGER CLASS
// ============================================================

export class WeaponManager {
  // Inventory
  private inventory: Map<string, BaseWeapon> = new Map()
  private inventoryOrder: string[] = [] // For cycling through weapons
  
  // Current state
  private currentWeapon: BaseWeapon | null = null
  private lastWeaponId: string | null = null
  private isSwitching: boolean = false
  
  // Event callbacks
  private onSwitchCallbacks: WeaponManagerEventCallback[] = []
  
  // Scene references
  private scene?: THREE.Scene
  private camera?: THREE.Camera

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Set scene reference (for raycasting)
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene
    console.log('🔫 WeaponManager: Scene set')
  }

  /**
   * Set camera reference (for shooting origin)
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera
    console.log('🔫 WeaponManager: Camera set')
  }

  // ============================================================
  // WEAPON MANAGEMENT
  // ============================================================

  /**
   * Add weapon to inventory
   * @param weaponId - Weapon identifier (e.g., "m4a1")
   * @returns Promise<BaseWeapon>
   */
  async addWeapon(weaponId: string): Promise<BaseWeapon> {
    console.log(`🔫 Adding weapon: ${weaponId}`)
    
    // Check if already in inventory
    if (this.inventory.has(weaponId)) {
      console.log(`⚠️ Weapon ${weaponId} already in inventory`)
      return this.inventory.get(weaponId)!
    }

    try {
      // Load weapon data
      const weaponData = await WeaponLoader.loadWeapon(weaponId)
      
      // Create weapon instance (Factory Pattern)
      const weapon = this.createWeapon(weaponData)
      
      // Set references
      if (this.scene) weapon.setScene(this.scene)
      if (this.camera) weapon.setCamera(this.camera)
      
      // Add to inventory
      this.inventory.set(weaponId, weapon)
      this.inventoryOrder.push(weaponId)
      
      console.log(`✅ Weapon added: ${weapon.getName()}`)
      
      // If this is the first weapon, equip it
      if (this.inventory.size === 1) {
        await this.switchWeapon(weaponId)
      }
      
      return weapon
      
    } catch (error) {
      console.error(`❌ Failed to add weapon ${weaponId}:`, error)
      throw error
    }
  }

  /**
   * Add multiple weapons at once
   */
  async addWeapons(weaponIds: string[]): Promise<BaseWeapon[]> {
    console.log(`🔫 Adding ${weaponIds.length} weapons...`)
    const promises = weaponIds.map(id => this.addWeapon(id))
    return Promise.all(promises)
  }

  /**
   * Remove weapon from inventory
   */
  removeWeapon(weaponId: string): boolean {
    if (!this.inventory.has(weaponId)) {
      console.warn(`⚠️ Cannot remove weapon ${weaponId}: Not in inventory`)
      return false
    }

    // Don't remove if it's the current weapon
    if (this.currentWeapon?.getId() === weaponId) {
      console.warn(`⚠️ Cannot remove current weapon`)
      return false
    }

    this.inventory.delete(weaponId)
    this.inventoryOrder = this.inventoryOrder.filter(id => id !== weaponId)
    
    console.log(`🗑️ Weapon removed: ${weaponId}`)
    return true
  }

  // ============================================================
  // WEAPON SWITCHING
  // ============================================================

  /**
   * Switch to weapon by ID
   */
  async switchWeapon(weaponId: string): Promise<boolean> {
    if (this.isSwitching) {
      console.log('⚠️ Already switching weapon')
      return false
    }

    const weapon = this.inventory.get(weaponId)
    if (!weapon) {
      console.error(`❌ Weapon not found: ${weaponId}`)
      return false
    }

    if (this.currentWeapon?.getId() === weaponId) {
      console.log('⚠️ Already using this weapon')
      return false
    }

    console.log(`🔄 Switching to: ${weapon.getName()}`)
    
    this.isSwitching = true
    const previousWeapon = this.currentWeapon

    try {
      // Lower current weapon (if any)
      if (this.currentWeapon) {
        await this.lowerWeapon(this.currentWeapon)
        this.lastWeaponId = this.currentWeapon.getId()
      }

      // Switch to new weapon
      this.currentWeapon = weapon

      // Raise new weapon
      await this.raiseWeapon(weapon)

      // Fire event
      this.fireWeaponSwitchEvent(previousWeapon, weapon)

      console.log(`✅ Switched to: ${weapon.getName()}`)
      return true

    } catch (error) {
      console.error('❌ Weapon switch failed:', error)
      return false
    } finally {
      this.isSwitching = false
    }
  }

  /**
   * Switch to weapon by index in inventory
   */
  async switchToIndex(index: number): Promise<boolean> {
    if (index < 0 || index >= this.inventoryOrder.length) {
      console.warn(`⚠️ Invalid weapon index: ${index}`)
      return false
    }

    const weaponId = this.inventoryOrder[index]
    return await this.switchWeapon(weaponId)
  }

  /**
   * Switch to next weapon (mouse wheel down / number keys)
   */
  async switchToNext(): Promise<boolean> {
    if (this.inventoryOrder.length === 0) return false

    const currentIndex = this.getCurrentWeaponIndex()
    const nextIndex = (currentIndex + 1) % this.inventoryOrder.length
    
    return await this.switchToIndex(nextIndex)
  }

  /**
   * Switch to previous weapon (mouse wheel up)
   */
  async switchToPrevious(): Promise<boolean> {
    if (this.inventoryOrder.length === 0) return false

    const currentIndex = this.getCurrentWeaponIndex()
    const prevIndex = (currentIndex - 1 + this.inventoryOrder.length) % this.inventoryOrder.length
    
    return await this.switchToIndex(prevIndex)
  }

  /**
   * Quick switch to last used weapon (Q-key)
   */
  async quickSwitch(): Promise<boolean> {
    if (!this.lastWeaponId) {
      console.log('⚠️ No last weapon to switch to')
      return false
    }

    return await this.switchWeapon(this.lastWeaponId)
  }

  /**
   * Mouse wheel handler
   */
  async onMouseWheel(delta: number): Promise<void> {
    if (delta > 0) {
      await this.switchToNext()
    } else if (delta < 0) {
      await this.switchToPrevious()
    }
  }

  // ============================================================
  // WEAPON ACTIONS
  // ============================================================

  /**
   * Shoot current weapon
   */
  shoot(origin: THREE.Vector3, direction: THREE.Vector3) {
    if (!this.currentWeapon) {
      console.warn('⚠️ No weapon equipped')
      return null
    }

    if (this.isSwitching) {
      console.log('⚠️ Cannot shoot while switching')
      return null
    }

    return this.currentWeapon.shoot(origin, direction)
  }

  /**
   * Reload current weapon
   */
  async reload(): Promise<void> {
    if (!this.currentWeapon) {
      console.warn('⚠️ No weapon equipped')
      return
    }

    if (this.isSwitching) {
      console.log('⚠️ Cannot reload while switching')
      return
    }

    await this.currentWeapon.reload()
  }

  /**
   * Update current weapon (called every frame)
   */
  update(deltaTime: number): void {
    if (this.currentWeapon) {
      this.currentWeapon.update(deltaTime)
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Get current weapon
   */
  getCurrentWeapon(): BaseWeapon | null {
    return this.currentWeapon
  }

  /**
   * Get weapon by ID
   */
  getWeapon(weaponId: string): BaseWeapon | null {
    return this.inventory.get(weaponId) || null
  }

  /**
   * Get all weapons
   */
  getAllWeapons(): BaseWeapon[] {
    return Array.from(this.inventory.values())
  }

  /**
   * Get inventory order
   */
  getInventoryOrder(): string[] {
    return [...this.inventoryOrder]
  }

  /**
   * Get current weapon index
   */
  getCurrentWeaponIndex(): number {
    if (!this.currentWeapon) return -1
    return this.inventoryOrder.indexOf(this.currentWeapon.getId())
  }

  /**
   * Is switching?
   */
  isSwitchingWeapon(): boolean {
    return this.isSwitching
  }

  /**
   * Has weapon?
   */
  hasWeapon(weaponId: string): boolean {
    return this.inventory.has(weaponId)
  }

  // ============================================================
  // FACTORY PATTERN
  // ============================================================

  /**
   * Create weapon instance based on type (Factory Method)
   */
  private createWeapon(data: WeaponData): BaseWeapon {
    console.log(`🏭 Creating weapon: ${data.name} (${data.type})`)

    switch (data.type) {
      case WeaponType.RIFLE:
      case WeaponType.SMG:
        return new AssaultRifle(data)
      
      case WeaponType.SNIPER:
        return new SniperRifle(data)
      
      case WeaponType.PISTOL:
        return new Pistol(data)
      
      case WeaponType.SHOTGUN:
        // TODO: Create Shotgun class
        console.warn('⚠️ Shotgun class not implemented, using Pistol')
        return new Pistol(data)
      
      case WeaponType.MELEE:
        // TODO: Create Melee class
        console.warn('⚠️ Melee class not implemented, using Pistol')
        return new Pistol(data)
      
      default:
        console.warn(`⚠️ Unknown weapon type: ${data.type}, defaulting to Pistol`)
        return new Pistol(data)
    }
  }

  // ============================================================
  // ANIMATIONS
  // ============================================================

  /**
   * Lower weapon animation
   */
  private async lowerWeapon(weapon: BaseWeapon): Promise<void> {
    const duration = weapon.getData().switchSpeed * 1000
    await new Promise(resolve => setTimeout(resolve, duration * 0.5))
    console.log(`⬇️ ${weapon.getName()} lowered`)
  }

  /**
   * Raise weapon animation
   */
  private async raiseWeapon(weapon: BaseWeapon): Promise<void> {
    const duration = weapon.getData().switchSpeed * 1000
    await new Promise(resolve => setTimeout(resolve, duration * 0.5))
    console.log(`⬆️ ${weapon.getName()} raised`)
  }

  // ============================================================
  // EVENTS
  // ============================================================

  /**
   * Register callback for weapon switch events
   */
  onWeaponSwitch(callback: WeaponManagerEventCallback): void {
    this.onSwitchCallbacks.push(callback)
  }

  /**
   * Fire weapon switch event
   */
  private fireWeaponSwitchEvent(from: BaseWeapon | null, to: BaseWeapon): void {
    const event: WeaponSwitchEvent = {
      from,
      to,
      timestamp: Date.now()
    }

    this.onSwitchCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('❌ Error in weapon switch callback:', error)
      }
    })
  }
}

