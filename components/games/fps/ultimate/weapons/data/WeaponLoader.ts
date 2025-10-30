/**
 * 🔫 WEAPON LOADER
 * Lädt Weapon Data aus JSON-Dateien
 * Data-Driven Architecture - Keine Code-Änderungen für neue Waffen!
 */

import type { WeaponData } from './WeaponData'
import { validateWeaponData, DEFAULT_WEAPON_DATA } from './WeaponData'

// ============================================================
// WEAPON LOADER CLASS
// ============================================================

export class WeaponLoader {
  private static cache: Map<string, WeaponData> = new Map()
  private static basePath = '/data/weapons'

  /**
   * Load weapon data from JSON file
   * @param weaponId - Weapon identifier (e.g., "m4a1")
   * @returns Promise<WeaponData>
   */
  static async loadWeapon(weaponId: string): Promise<WeaponData> {
    // Check cache first
    if (this.cache.has(weaponId)) {
      // Silent cache hit - no console spam
      return this.cache.get(weaponId)!
    }

    // Fallback weapon data factory
    const createFallback = (): WeaponData => ({
      id: weaponId,
      name: weaponId.replace(/_/g, ' ').toUpperCase(),
      type: 'Assault Rifle',
      category: 'Primary',
      rarity: 'Common',
      damage: 30,
      fireRate: 600,
      reloadTime: 2.5,
      magazineSize: 30,
      reserveAmmo: 120,
      range: 50,
      accuracy: 0.8,
      recoil: 0.3,
      handling: 0.7,
      mobility: 0.8,
      bulletSpeed: 800,
      penetration: 0.3,
      fireModes: ['auto', 'burst', 'semi'],
      defaultFireMode: 'auto',
      description: `Fallback weapon: ${weaponId}`,
      unlockLevel: 1,
      price: 0,
      isUnlocked: true
    })

    try {
      // Construct path
      const path = `${this.basePath}/${weaponId}.json`
      
      // Silent loading - no console spam
      
      // Fetch JSON
      const response = await fetch(path)
      
      if (!response.ok) {
        // Silent fallback - no console spam
        return createFallback()
      }
      
      const rawData = await response.json()
      
      // Merge with defaults
      const weaponData = this.mergeWithDefaults(rawData)
      
      // Validate
      if (!validateWeaponData(weaponData)) {
        return createFallback()
      }
      
      // Cache
      this.cache.set(weaponId, weaponData)
      
      // Silent success - no console spam
      return weaponData
      
    } catch (error) {
      // Silent error handling - return fallback instead of throwing
      return createFallback()
    }
  }

  /**
   * Load multiple weapons at once
   * @param weaponIds - Array of weapon identifiers
   * @returns Promise<WeaponData[]>
   */
  static async loadWeapons(weaponIds: string[]): Promise<WeaponData[]> {
    // Silent batch loading - no console spam
    
    const promises = weaponIds.map(id => this.loadWeapon(id))
    const weapons = await Promise.all(promises)
    
    // Silent success - no console spam
    return weapons
  }

  /**
   * Preload all weapons from a manifest
   * @param manifestPath - Path to weapons manifest JSON
   */
  static async preloadFromManifest(manifestPath: string = '/data/weapons/manifest.json'): Promise<WeaponData[]> {
    try {
      const response = await fetch(manifestPath)
      const manifest: { weapons: string[] } = await response.json()
      
      console.log(`📋 Preloading ${manifest.weapons.length} weapons from manifest`)
      return await this.loadWeapons(manifest.weapons)
      
    } catch (error) {
      console.error('❌ Error loading manifest:', error)
      return []
    }
  }

  /**
   * Merge raw JSON data with default values
   */
  private static mergeWithDefaults(rawData: any): WeaponData {
    return {
      ...DEFAULT_WEAPON_DATA,
      ...rawData
    } as WeaponData
  }

  /**
   * Clear cache (useful for hot-reloading in dev)
   */
  static clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Weapon cache cleared')
  }

  /**
   * Get cached weapon data (no loading)
   */
  static getCached(weaponId: string): WeaponData | null {
    return this.cache.get(weaponId) || null
  }

  /**
   * Get all cached weapons
   */
  static getAllCached(): WeaponData[] {
    return Array.from(this.cache.values())
  }

  /**
   * Set custom base path for weapon data files
   */
  static setBasePath(path: string): void {
    this.basePath = path
    console.log(`📁 Weapon data path set to: ${path}`)
  }
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Quick load single weapon
 */
export async function loadWeapon(weaponId: string): Promise<WeaponData> {
  return WeaponLoader.loadWeapon(weaponId)
}

/**
 * Quick load multiple weapons
 */
export async function loadWeapons(weaponIds: string[]): Promise<WeaponData[]> {
  return WeaponLoader.loadWeapons(weaponIds)
}

