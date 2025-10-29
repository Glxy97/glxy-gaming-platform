/**
 * Weapon Manager Interface
 * 
 * @module IWeaponManager
 * @description Interface for managing weapons, switching, and shooting
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { Weapon, WeaponState, HitResult } from '../../types/WeaponTypes'

/**
 * Interface for Weapon Management
 * 
 * @interface IWeaponManager
 * @description Defines the contract for weapon handling, switching, and shooting
 * 
 * @example
 * ```typescript
 * class WeaponManager implements IWeaponManager {
 *   // Implementation...
 * }
 * ```
 */
export interface IWeaponManager {
  // ============================================================================
  // PROPERTIES
  // ============================================================================
  
  /**
   * Get current weapon
   * @readonly
   */
  readonly currentWeapon: Weapon
  
  /**
   * Get all available weapons
   * @readonly
   */
  readonly weapons: Weapon[]
  
  /**
   * Get current weapon state
   * @readonly
   */
  readonly weaponState: WeaponState
  
  /**
   * Get current weapon index
   * @readonly
   */
  readonly currentWeaponIndex: number
  
  // ============================================================================
  // WEAPON SWITCHING
  // ============================================================================
  
  /**
   * Switch to weapon by index
   * 
   * @param index - Weapon index (0-based)
   * @throws {Error} If index is out of bounds
   * 
   * @example
   * ```typescript
   * manager.switchWeapon(1) // Switch to secondary weapon
   * ```
   */
  switchWeapon(index: number): void
  
  /**
   * Switch to next weapon
   */
  switchToNextWeapon(): void
  
  /**
   * Switch to previous weapon
   */
  switchToPreviousWeapon(): void
  
  /**
   * Switch to weapon by ID
   * 
   * @param weaponId - Weapon ID
   * @throws {Error} If weapon not found
   */
  switchToWeaponById(weaponId: string): void
  
  // ============================================================================
  // SHOOTING
  // ============================================================================
  
  /**
   * Fire current weapon
   * 
   * @returns Hit result if shot was fired
   * @returns undefined if shot could not be fired
   * 
   * @example
   * ```typescript
   * const result = manager.shoot()
   * if (result?.hit) {
   *   console.log(`Hit ${result.entityType} at ${result.distance}m`)
   * }
   * ```
   */
  shoot(): HitResult | undefined
  
  /**
   * Start continuous fire (for automatic weapons)
   */
  startShooting(): void
  
  /**
   * Stop continuous fire
   */
  stopShooting(): void
  
  /**
   * Check if can shoot
   * 
   * @returns True if weapon can fire
   * 
   * @remarks
   * Checks:
   * - Has ammo
   * - Not reloading
   * - Fire rate cooldown passed
   * - Not switching weapons
   */
  canShoot(): boolean
  
  // ============================================================================
  // RELOADING
  // ============================================================================
  
  /**
   * Reload current weapon
   * 
   * @returns Promise that resolves when reload complete
   * 
   * @example
   * ```typescript
   * await manager.reload()
   * console.log('Reload complete!')
   * ```
   */
  reload(): Promise<void>
  
  /**
   * Check if can reload
   * 
   * @returns True if weapon can be reloaded
   */
  canReload(): boolean
  
  /**
   * Check if currently reloading
   * 
   * @returns True if reloading
   */
  isReloading(): boolean
  
  // ============================================================================
  // AIM DOWN SIGHTS
  // ============================================================================
  
  /**
   * Enter ADS mode
   */
  aimDownSights(): void
  
  /**
   * Exit ADS mode
   */
  exitADS(): void
  
  /**
   * Toggle ADS mode
   */
  toggleADS(): void
  
  /**
   * Check if currently aiming
   * 
   * @returns True if in ADS mode
   */
  isAiming(): boolean
  
  // ============================================================================
  // AMMO MANAGEMENT
  // ============================================================================
  
  /**
   * Get current ammo count
   * 
   * @returns Current ammo in magazine
   */
  getCurrentAmmo(): number
  
  /**
   * Get reserve ammo count
   * 
   * @returns Reserve ammo
   */
  getReserveAmmo(): number
  
  /**
   * Add ammo to current weapon
   * 
   * @param amount - Amount of ammo to add
   */
  addAmmo(amount: number): void
  
  /**
   * Set infinite ammo mode
   * 
   * @param enabled - Whether infinite ammo is enabled
   */
  setInfiniteAmmo(enabled: boolean): void
  
  // ============================================================================
  // WEAPON MANAGEMENT
  // ============================================================================
  
  /**
   * Add weapon to inventory
   * 
   * @param weapon - Weapon to add
   * @param setCurrent - Whether to switch to this weapon
   * 
   * @example
   * ```typescript
   * manager.addWeapon(awp, true) // Add AWP and switch to it
   * ```
   */
  addWeapon(weapon: Weapon, setCurrent?: boolean): void
  
  /**
   * Remove weapon from inventory
   * 
   * @param weaponId - Weapon ID to remove
   * @throws {Error} If trying to remove last weapon
   */
  removeWeapon(weaponId: string): void
  
  /**
   * Get weapon by ID
   * 
   * @param weaponId - Weapon ID
   * @returns Weapon or undefined if not found
   */
  getWeaponById(weaponId: string): Weapon | undefined
  
  // ============================================================================
  // EVENTS & LISTENERS
  // ============================================================================
  
  /**
   * Register listener for weapon change
   * 
   * @param callback - Function to call when weapon changes
   * @returns Unsubscribe function
   */
  onWeaponChange(callback: (weapon: Weapon) => void): () => void
  
  /**
   * Register listener for shoot event
   * 
   * @param callback - Function to call when weapon fires
   * @returns Unsubscribe function
   */
  onShoot(callback: (result: HitResult) => void): () => void
  
  /**
   * Register listener for reload event
   * 
   * @param callback - Function to call when reload starts/ends
   * @returns Unsubscribe function
   */
  onReload(callback: (isReloading: boolean) => void): () => void
  
  // ============================================================================
  // UTILITIES
  // ============================================================================
  
  /**
   * Get weapon stats for UI display
   * 
   * @param weaponId - Optional weapon ID (defaults to current)
   * @returns Calculated weapon stats
   */
  getWeaponStats(weaponId?: string): {
    damageRating: number
    fireRateRating: number
    accuracyRating: number
    rangeRating: number
    mobilityRating: number
  }
  
  /**
   * Update weapon (for animations, effects, etc.)
   * 
   * @param deltaTime - Time since last update (seconds)
   */
  update(deltaTime: number): void
  
  /**
   * Cleanup resources
   */
  destroy(): void
}

