/**
 * Weapon Types for GLXY Ultimate FPS
 * 
 * @module WeaponTypes
 * @description Comprehensive type definitions for weapons, attachments, and ballistics
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { Vector2, Vector3 } from 'three'

// ============================================================================
// WEAPON CATEGORIES
// ============================================================================

/**
 * Weapon type categories
 */
export type WeaponType = 
  | 'pistol'
  | 'smg'
  | 'assault-rifle'
  | 'sniper'
  | 'shotgun'
  | 'lmg'
  | 'launcher'
  | 'melee'
  | 'special'

/**
 * Fire modes
 */
export type FireMode = 
  | 'semi-auto'    // One shot per click
  | 'burst'        // 3-round burst
  | 'auto'         // Full automatic
  | 'pump'         // Manual pump action
  | 'bolt'         // Manual bolt action

// ============================================================================
// WEAPON INTERFACE
// ============================================================================

/**
 * Complete weapon definition
 */
export interface Weapon {
  /** Unique weapon ID */
  id: string
  
  /** Display name */
  name: string
  
  /** Weapon category */
  type: WeaponType
  
  /** Fire mode */
  fireMode: FireMode
  
  /** Base damage per shot */
  damage: number
  
  /** Fire rate (milliseconds between shots) */
  fireRate: number
  
  /** Magazine capacity */
  magSize: number
  
  /** Reserve ammo */
  reserveAmmo: number
  
  /** Reload time (seconds) */
  reloadTime: number
  
  /** Base accuracy (0-1) */
  accuracy: number
  
  /** Recoil pattern (x, y) */
  recoil: Vector2
  
  /** Range (units) */
  range: number
  
  /** Damage falloff start distance */
  falloffStart: number
  
  /** Damage falloff end distance */
  falloffEnd: number
  
  /** Minimum damage after falloff */
  minDamage: number
  
  /** Aim Down Sights time (seconds) */
  adsTime: number
  
  /** Movement speed multiplier while equipped */
  movementSpeed: number
  
  /** Headshot damage multiplier */
  headshotMultiplier: number
  
  /** Current attachments */
  attachments?: WeaponAttachments
  
  /** Available attachment slots */
  attachmentSlots: AttachmentSlot[]
  
  /** 3D model path */
  modelPath?: string
  
  /** Sounds */
  sounds?: WeaponSounds
  
  /** Visual effects */
  effects?: WeaponEffects
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

/**
 * Attachment slots
 */
export type AttachmentSlot = 
  | 'optic'
  | 'barrel'
  | 'magazine'
  | 'grip'
  | 'stock'
  | 'laser'
  | 'muzzle'
  | 'underbarrel'

/**
 * All weapon attachments
 */
export interface WeaponAttachments {
  optic?: Optic
  barrel?: Barrel
  magazine?: Magazine
  grip?: Grip
  stock?: Stock
  laser?: Laser
  muzzle?: Muzzle
  underbarrel?: Underbarrel
}

/**
 * Optic attachment
 */
export interface Optic {
  id: string
  name: string
  zoomLevel: number
  adsTimeModifier: number
  reticle: string
}

/**
 * Barrel attachment
 */
export interface Barrel {
  id: string
  name: string
  rangeModifier: number
  accuracyModifier: number
  damageModifier: number
  suppressedSound: boolean
}

/**
 * Magazine attachment
 */
export interface Magazine {
  id: string
  name: string
  capacityModifier: number
  reloadTimeModifier: number
  movementSpeedModifier: number
}

/**
 * Grip attachment
 */
export interface Grip {
  id: string
  name: string
  recoilModifier: number
  adsTimeModifier: number
  stabilityBonus: number
}

/**
 * Stock attachment
 */
export interface Stock {
  id: string
  name: string
  recoilModifier: number
  movementSpeedModifier: number
  adsTimeModifier: number
}

/**
 * Laser attachment
 */
export interface Laser {
  id: string
  name: string
  hipfireAccuracyBonus: number
  visibleToEnemies: boolean
  color: number
}

/**
 * Muzzle attachment
 */
export interface Muzzle {
  id: string
  name: string
  recoilModifier: number
  soundModifier: number
  flashSuppression: boolean
  rangePenalty: number
}

/**
 * Underbarrel attachment
 */
export interface Underbarrel {
  id: string
  name: string
  type: 'grenade-launcher' | 'shotgun' | 'grip'
  ammo?: number
  stabilityBonus: number
}

// ============================================================================
// WEAPON STATE
// ============================================================================

/**
 * Current weapon state
 */
export interface WeaponState {
  /** Current ammo in magazine */
  currentAmmo: number
  
  /** Reserve ammo */
  reserveAmmo: number
  
  /** Is reloading */
  isReloading: boolean
  
  /** Is aiming down sights */
  isADS: boolean
  
  /** Last shot timestamp */
  lastShotTime: number
  
  /** Heat level (for overheating weapons) */
  heat: number
  
  /** Weapon condition (0-1, 1 = perfect) */
  condition: number
}

// ============================================================================
// BALLISTICS
// ============================================================================

/**
 * Projectile/bullet properties
 */
export interface Projectile {
  /** Position */
  position: Vector3
  
  /** Direction */
  direction: Vector3
  
  /** Velocity */
  velocity: number
  
  /** Damage */
  damage: number
  
  /** Owner (player ID) */
  owner: string
  
  /** Weapon ID */
  weaponId: string
  
  /** Distance traveled */
  distanceTraveled: number
  
  /** Is tracer visible */
  isTracer: boolean
  
  /** Timestamp */
  timestamp: number
}

/**
 * Hit result
 */
export interface HitResult {
  /** Did hit something */
  hit: boolean
  
  /** Hit position */
  position?: Vector3
  
  /** Hit entity ID */
  entityId?: string
  
  /** Hit entity type */
  entityType?: 'player' | 'enemy' | 'environment'
  
  /** Is headshot */
  isHeadshot: boolean
  
  /** Damage dealt */
  damage: number
  
  /** Distance to target */
  distance: number
}

// ============================================================================
// SOUNDS & EFFECTS
// ============================================================================

/**
 * Weapon sounds
 */
export interface WeaponSounds {
  fire: string
  reload: string
  empty: string
  switch: string
  ads: string
}

/**
 * Weapon visual effects
 */
export interface WeaponEffects {
  muzzleFlash: boolean
  shellEject: boolean
  bulletTracer: boolean
  recoilAnimation: boolean
}

// ============================================================================
// WEAPON STATS (for display/comparison)
// ============================================================================

/**
 * Calculated weapon stats for UI display
 */
export interface WeaponStats {
  /** Damage rating (0-100) */
  damageRating: number
  
  /** Fire rate rating (0-100) */
  fireRateRating: number
  
  /** Accuracy rating (0-100) */
  accuracyRating: number
  
  /** Range rating (0-100) */
  rangeRating: number
  
  /** Mobility rating (0-100) */
  mobilityRating: number
  
  /** Control rating (0-100) */
  controlRating: number
  
  /** Overall rating (0-100) */
  overallRating: number
}

// ============================================================================
// LOADOUT
// ============================================================================

/**
 * Player weapon loadout
 */
export interface Loadout {
  /** Primary weapon */
  primary: Weapon
  
  /** Secondary weapon */
  secondary: Weapon
  
  /** Melee weapon */
  melee?: Weapon
  
  /** Lethal equipment */
  lethal?: Equipment
  
  /** Tactical equipment */
  tactical?: Equipment
  
  /** Perks */
  perks?: Perk[]
}

/**
 * Equipment (grenades, etc.)
 */
export interface Equipment {
  id: string
  name: string
  type: 'frag' | 'flash' | 'smoke' | 'molotov' | 'stun'
  count: number
  maxCount: number
  damage?: number
  radius: number
  duration: number
}

/**
 * Perks/abilities
 */
export interface Perk {
  id: string
  name: string
  description: string
  type: 'passive' | 'active'
  effect: string
  cooldown?: number
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  Vector2,
  Vector3
}

