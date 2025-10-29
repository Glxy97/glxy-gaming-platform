/**
 * 🔫 WEAPONS MODULE
 * Central export point for weapon system
 */

// Core classes
export { BaseWeapon } from './BaseWeapon'
export { WeaponManager } from './WeaponManager'
export type { WeaponState, ShootResult } from './BaseWeapon'
export type { WeaponSwitchEvent, WeaponManagerEventCallback } from './WeaponManager'

// Weapon types
export { AssaultRifle } from './types/AssaultRifle'
export { SniperRifle } from './types/SniperRifle'
export { Pistol } from './types/Pistol'

// Data system
export type { WeaponData, RecoilPattern, WeaponPositionData, WeaponSoundPaths } from './data/WeaponData'
export { WeaponType, FireMode, toVector3, toEuler, getFireDelay, validateWeaponData } from './data/WeaponData'
export { WeaponLoader, loadWeapon, loadWeapons } from './data/WeaponLoader'

