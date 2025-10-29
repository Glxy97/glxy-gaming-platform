/**
 * 🔫 WEAPON DATA SYSTEM
 * Data-Driven Architecture für FPS-Waffen
 * Basiert auf Industry Best Practices (ScriptableObject-Style)
 */

import * as THREE from 'three'

// ============================================================
// ENUMS
// ============================================================

export enum WeaponType {
  PISTOL = 'pistol',
  RIFLE = 'rifle',
  SNIPER = 'sniper',
  SHOTGUN = 'shotgun',
  SMG = 'smg',
  MELEE = 'melee'
}

export enum FireMode {
  SEMI_AUTO = 'SEMI_AUTO',
  BURST = 'BURST',
  FULL_AUTO = 'FULL_AUTO'
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * Recoil Pattern - CS:GO-Style
 */
export interface RecoilPattern {
  vertical: number[]    // Upward kick per shot (30 values for full spray)
  horizontal: number[]  // Horizontal drift (30 values)
}

/**
 * Weapon Position Data
 */
export interface WeaponPositionData {
  x: number
  y: number
  z: number
}

/**
 * Weapon Sound Paths
 */
export interface WeaponSoundPaths {
  fire: string
  reload_mag_out: string
  reload_mag_in: string
  reload_rack: string
  dry_fire: string
  switch: string
}

/**
 * Main Weapon Data Blueprint
 * This is the core data structure that defines a weapon
 */
export interface WeaponData {
  // ============================================================
  // IDENTIFICATION
  // ============================================================
  id: string                    // Unique identifier (e.g., "m4a1")
  name: string                  // Display name (e.g., "M4A1 Carbine")
  type: WeaponType             // Weapon category
  description?: string          // Optional flavor text

  // ============================================================
  // VISUALS
  // ============================================================
  modelPath: string                        // Path to 3D model (.glb)
  viewmodelPosition: WeaponPositionData   // Hip-fire position
  adsPosition: WeaponPositionData         // ADS position
  viewmodelRotation?: WeaponPositionData  // Optional rotation offset
  viewmodelScale?: number                 // Optional scale (default: 1.0)

  // ============================================================
  // AMMUNITION
  // ============================================================
  magazineSize: number          // Shots per magazine
  maxTotalAmmo: number         // Total reserve ammo
  reloadTime: number           // Empty reload time (seconds)
  tacticalReloadTime: number   // Tactical reload (with bullet in chamber)
  usesAmmo: boolean            // False for melee weapons

  // ============================================================
  // SHOOTING
  // ============================================================
  fireRate: number             // Rounds per minute (RPM)
  fireMode: FireMode[]         // Available fire modes
  damage: number               // Base damage per shot
  headshotMultiplier: number   // Damage multiplier for headshots
  range: number                // Effective range (meters)
  accuracy: number             // Base accuracy (0-100)
  penetration: number          // Wall penetration power (0-100)

  // ============================================================
  // RECOIL
  // ============================================================
  recoilPattern: RecoilPattern         // Spray pattern
  recoilRecoverySpeed: number         // How fast camera recovers
  firstShotMultiplier: number         // First shot recoil multiplier
  adsRecoilMultiplier: number         // Recoil reduction when ADS

  // ============================================================
  // SPREAD
  // ============================================================
  baseSpread: number                  // Base spread angle (radians)
  movementSpreadMultiplier: number    // Spread increase when moving
  adsSpreadMultiplier: number         // Spread reduction when ADS
  crouchSpreadMultiplier: number      // Spread reduction when crouching
  jumpSpreadMultiplier: number        // Spread increase when jumping

  // ============================================================
  // ADS (AIM DOWN SIGHTS)
  // ============================================================
  adsFOV: number                      // Field of view when ADS
  adsSpeed: number                    // Transition speed (higher = faster)
  adsMovementPenalty: number          // Movement speed multiplier (0.6 = 60% speed)
  adsEnabled: boolean                 // Some weapons don't have ADS

  // ============================================================
  // EFFECTS
  // ============================================================
  muzzleFlashIntensity: number        // Light intensity (0-10)
  muzzleFlashColor: string            // Hex color (e.g., "#ffa500")
  shellEjectionEnabled: boolean       // Eject shell casings?
  tracerEnabled: boolean              // Show bullet tracers?
  tracerSpeed: number                 // Tracer travel speed (m/s)

  // ============================================================
  // AUDIO
  // ============================================================
  soundPaths: WeaponSoundPaths        // Paths to all sound files

  // ============================================================
  // GAMEPLAY
  // ============================================================
  weight: number                      // Affects movement speed (kg)
  switchSpeed: number                 // Time to switch to this weapon (seconds)
  inspectTime: number                 // Duration of inspect animation (seconds)
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert WeaponPositionData to THREE.Vector3
 */
export function toVector3(pos: WeaponPositionData): THREE.Vector3 {
  return new THREE.Vector3(pos.x, pos.y, pos.z)
}

/**
 * Convert WeaponPositionData to THREE.Euler
 */
export function toEuler(rot: WeaponPositionData): THREE.Euler {
  return new THREE.Euler(rot.x, rot.y, rot.z, 'YXZ')
}

/**
 * Calculate fire delay from RPM
 */
export function getFireDelay(fireRate: number): number {
  return 60000 / fireRate // milliseconds
}

/**
 * Validate WeaponData (basic checks)
 */
export function validateWeaponData(data: WeaponData): boolean {
  if (!data.id || !data.name || !data.type) {
    console.error('❌ Weapon missing required fields: id, name, or type')
    return false
  }
  
  if (data.magazineSize <= 0 || data.maxTotalAmmo < 0) {
    console.error('❌ Invalid ammo values')
    return false
  }
  
  if (data.fireRate <= 0 || data.damage <= 0) {
    console.error('❌ Invalid combat values')
    return false
  }
  
  return true
}

// ============================================================
// DEFAULT VALUES (Fallbacks)
// ============================================================

export const DEFAULT_WEAPON_DATA: Partial<WeaponData> = {
  description: 'Standard weapon',
  viewmodelScale: 1.0,
  headshotMultiplier: 2.0,
  penetration: 20,
  recoilRecoverySpeed: 5.0,
  firstShotMultiplier: 0.8,
  adsRecoilMultiplier: 0.7,
  movementSpreadMultiplier: 1.5,
  adsSpreadMultiplier: 0.4,
  crouchSpreadMultiplier: 0.7,
  jumpSpreadMultiplier: 3.0,
  adsEnabled: true,
  muzzleFlashIntensity: 5,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 800,
  weight: 3.5,
  switchSpeed: 0.5,
  inspectTime: 2.0
}

