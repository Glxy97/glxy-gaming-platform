/**
 * 🔫 WEAPON CATALOG
 * 
 * Complete Arsenal - 15 Weapons
 */

import {
  WeaponType,
  FireMode,
  WeaponRarity,
  type WeaponData
} from './WeaponData'

// ============================================================================
// 🔫 PISTOLS
// ============================================================================

export const PISTOL_GLOCK: WeaponData = {
  id: 'glock_17',
  name: 'Glock 17',
  description: 'Austrian 9mm semi-automatic pistol',
  type: WeaponType.PISTOL,
  fireMode: FireMode.SEMI_AUTO,
  rarity: WeaponRarity.COMMON,
  
  // Stats
  damage: 30,
  fireRate: 400,
  range: 30,
  accuracy: 75,
  reloadTime: 1.5,
  magazineSize: 17,
  maxTotalAmmo: 102,
  
  // Spread & Recoil
  baseSpread: 0.02,
  maxSpread: 0.15,
  spreadIncrease: 0.03,
  spreadDecrease: 0.05,
  recoilPattern: [0, 0.15],
  recoilMultiplier: 1.0,
  recoilRecoverySpeed: 8.0,
  
  // ADSSettings
  adsSpeed: 0.2,
  adsFovMultiplier: 0.9,
  adsMovementMultiplier: 0.9,
  adsEnabled: true,
  
  // Visuals
  viewmodelScale: 1.2,
  muzzleFlashIntensity: 3,
  muzzleFlashColor: '#ff8800',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  
  weight: 0.7,
  switchSpeed: 0.4,
  headshotMultiplier: 2.5
}

export const PISTOL_DEAGLE: WeaponData = {
  id: 'desert_eagle',
  name: 'Desert Eagle',
  description: 'Powerful .50 AE hand cannon',
  type: WeaponType.PISTOL,
  fireMode: FireMode.SEMI_AUTO,
  rarity: WeaponRarity.EPIC,
  
  damage: 75,
  fireRate: 200,
  range: 50,
  accuracy: 80,
  reloadTime: 2.2,
  magazineSize: 7,
  maxTotalAmmo: 35,
  
  baseSpread: 0.01,
  maxSpread: 0.12,
  spreadIncrease: 0.04,
  spreadDecrease: 0.03,
  recoilPattern: [0, 0.3],
  recoilMultiplier: 1.5,
  recoilRecoverySpeed: 5.0,
  
  adsSpeed: 0.25,
  adsFovMultiplier: 0.85,
  adsMovementMultiplier: 0.85,
  adsEnabled: true,
  
  viewmodelScale: 1.3,
  muzzleFlashIntensity: 8,
  muzzleFlashColor: '#ffaa00',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  
  weight: 2.0,
  switchSpeed: 0.5,
  headshotMultiplier: 3.0,
  penetration: 50
}

// ============================================================================
// 🔫 ASSAULT RIFLES
// ============================================================================

export const AR_M4A1: WeaponData = {
  id: 'm4a1',
  name: 'M4A1',
  description: 'US military standard carbine',
  type: WeaponType.RIFLE,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.RARE,
  
  damage: 35,
  fireRate: 800,
  range: 60,
  accuracy: 85,
  reloadTime: 2.3,
  magazineSize: 30,
  maxTotalAmmo: 180,
  
  baseSpread: 0.015,
  maxSpread: 0.1,
  spreadIncrease: 0.02,
  spreadDecrease: 0.08,
  recoilPattern: [0.05, 0.2, -0.03, 0.18, 0.04, 0.16],
  recoilMultiplier: 1.0,
  recoilRecoverySpeed: 7.0,
  
  adsSpeed: 0.3,
  adsFovMultiplier: 0.75,
  adsMovementMultiplier: 0.7,
  adsEnabled: true,
  
  viewmodelScale: 1.0,
  muzzleFlashIntensity: 5,
  muzzleFlashColor: '#ff9900',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 900,
  
  weight: 3.5,
  switchSpeed: 0.6,
  headshotMultiplier: 2.0
}

export const AR_AK47: WeaponData = {
  id: 'ak47',
  name: 'AK-47',
  description: 'Soviet assault rifle',
  type: WeaponType.RIFLE,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.RARE,
  
  damage: 40,
  fireRate: 600,
  range: 65,
  accuracy: 70,
  reloadTime: 2.5,
  magazineSize: 30,
  maxTotalAmmo: 150,
  
  baseSpread: 0.02,
  maxSpread: 0.15,
  spreadIncrease: 0.03,
  spreadDecrease: 0.07,
  recoilPattern: [0.08, 0.25, -0.05, 0.22, 0.07, 0.2],
  recoilMultiplier: 1.3,
  recoilRecoverySpeed: 6.0,
  
  adsSpeed: 0.35,
  adsFovMultiplier: 0.75,
  adsMovementMultiplier: 0.65,
  adsEnabled: true,
  
  viewmodelScale: 1.1,
  muzzleFlashIntensity: 6,
  muzzleFlashColor: '#ffaa00',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 850,
  
  weight: 4.3,
  switchSpeed: 0.7,
  headshotMultiplier: 2.0,
  penetration: 40
}

export const AR_SCAR: WeaponData = {
  id: 'scar_h',
  name: 'SCAR-H',
  description: 'Heavy battle rifle',
  type: WeaponType.RIFLE,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.EPIC,
  
  damage: 45,
  fireRate: 625,
  range: 70,
  accuracy: 80,
  reloadTime: 2.4,
  magazineSize: 20,
  maxTotalAmmo: 100,
  
  baseSpread: 0.012,
  maxSpread: 0.12,
  spreadIncrease: 0.025,
  spreadDecrease: 0.08,
  recoilPattern: [0.06, 0.22, -0.04, 0.2, 0.05, 0.18],
  recoilMultiplier: 1.2,
  recoilRecoverySpeed: 6.5,
  
  adsSpeed: 0.35,
  adsFovMultiplier: 0.7,
  adsMovementMultiplier: 0.65,
  adsEnabled: true,
  
  viewmodelScale: 1.05,
  muzzleFlashIntensity: 6,
  muzzleFlashColor: '#ff9500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 950,
  
  weight: 4.0,
  switchSpeed: 0.65,
  headshotMultiplier: 2.2,
  penetration: 50
}

// ============================================================================
// 🔫 SMGs
// ============================================================================

export const SMG_MP5: WeaponData = {
  id: 'mp5',
  name: 'MP5',
  description: 'German 9mm submachine gun',
  type: WeaponType.SMG,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.RARE,
  
  damage: 28,
  fireRate: 800,
  range: 35,
  accuracy: 75,
  reloadTime: 2.0,
  magazineSize: 30,
  maxTotalAmmo: 180,
  
  baseSpread: 0.02,
  maxSpread: 0.12,
  spreadIncrease: 0.025,
  spreadDecrease: 0.1,
  recoilPattern: [0.03, 0.15, -0.02, 0.14, 0.03, 0.13],
  recoilMultiplier: 0.8,
  recoilRecoverySpeed: 9.0,
  
  adsSpeed: 0.25,
  adsFovMultiplier: 0.8,
  adsMovementMultiplier: 0.85,
  adsEnabled: true,
  
  viewmodelScale: 1.0,
  muzzleFlashIntensity: 4,
  muzzleFlashColor: '#ff8800',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  
  weight: 2.5,
  switchSpeed: 0.45,
  headshotMultiplier: 1.8
}

export const SMG_UMP45: WeaponData = {
  id: 'ump45',
  name: 'UMP45',
  description: 'Universal Machine Pistol',
  type: WeaponType.SMG,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.RARE,
  
  damage: 32,
  fireRate: 650,
  range: 40,
  accuracy: 78,
  reloadTime: 2.2,
  magazineSize: 25,
  maxTotalAmmo: 150,
  
  baseSpread: 0.018,
  maxSpread: 0.11,
  spreadIncrease: 0.022,
  spreadDecrease: 0.09,
  recoilPattern: [0.04, 0.17, -0.025, 0.16, 0.04, 0.15],
  recoilMultiplier: 0.9,
  recoilRecoverySpeed: 8.0,
  
  adsSpeed: 0.27,
  adsFovMultiplier: 0.8,
  adsMovementMultiplier: 0.8,
  adsEnabled: true,
  
  viewmodelScale: 1.05,
  muzzleFlashIntensity: 4,
  muzzleFlashColor: '#ff8800',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  
  weight: 2.3,
  switchSpeed: 0.45,
  headshotMultiplier: 1.9
}

export const SMG_P90: WeaponData = {
  id: 'p90',
  name: 'P90',
  description: 'Belgian 5.7mm PDW',
  type: WeaponType.SMG,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.EPIC,
  
  damage: 26,
  fireRate: 900,
  range: 38,
  accuracy: 72,
  reloadTime: 2.8,
  magazineSize: 50,
  maxTotalAmmo: 200,
  
  baseSpread: 0.025,
  maxSpread: 0.14,
  spreadIncrease: 0.028,
  spreadDecrease: 0.11,
  recoilPattern: [0.02, 0.12, -0.015, 0.11, 0.02, 0.10],
  recoilMultiplier: 0.7,
  recoilRecoverySpeed: 10.0,
  
  adsSpeed: 0.22,
  adsFovMultiplier: 0.82,
  adsMovementMultiplier: 0.88,
  adsEnabled: true,
  
  viewmodelScale: 1.0,
  muzzleFlashIntensity: 3,
  muzzleFlashColor: '#ff7700',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  
  weight: 2.6,
  switchSpeed: 0.4,
  headshotMultiplier: 1.7,
  penetration: 35
}

// ============================================================================
// 🔫 SNIPER RIFLES
// ============================================================================

export const SNIPER_AWP: WeaponData = {
  id: 'awp',
  name: 'AWP',
  description: 'Arctic Warfare Police',
  type: WeaponType.SNIPER,
  fireMode: FireMode.BOLT_ACTION,
  rarity: WeaponRarity.LEGENDARY,
  
  damage: 115,
  fireRate: 41, // Bolt action
  range: 200,
  accuracy: 98,
  reloadTime: 3.5,
  magazineSize: 10,
  maxTotalAmmo: 30,
  
  baseSpread: 0.001,
  maxSpread: 0.05,
  spreadIncrease: 0.01,
  spreadDecrease: 0.02,
  recoilPattern: [0, 0.4],
  recoilMultiplier: 2.0,
  recoilRecoverySpeed: 4.0,
  
  adsSpeed: 0.5,
  adsFovMultiplier: 0.4,
  adsMovementMultiplier: 0.5,
  adsEnabled: true,
  
  viewmodelScale: 1.2,
  muzzleFlashIntensity: 10,
  muzzleFlashColor: '#ffcc00',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 1200,
  
  weight: 6.5,
  switchSpeed: 1.0,
  headshotMultiplier: 1.5, // Already one-shot kill
  penetration: 100
}

export const SNIPER_BARRETT: WeaponData = {
  id: 'barrett_50cal',
  name: 'Barrett .50 Cal',
  description: 'Anti-material rifle',
  type: WeaponType.SNIPER,
  fireMode: FireMode.SEMI_AUTO,
  rarity: WeaponRarity.LEGENDARY,
  
  damage: 120,
  fireRate: 60,
  range: 250,
  accuracy: 95,
  reloadTime: 4.0,
  magazineSize: 5,
  maxTotalAmmo: 20,
  
  baseSpread: 0.002,
  maxSpread: 0.06,
  spreadIncrease: 0.015,
  spreadDecrease: 0.018,
  recoilPattern: [0, 0.5],
  recoilMultiplier: 2.5,
  recoilRecoverySpeed: 3.5,
  
  adsSpeed: 0.6,
  adsFovMultiplier: 0.35,
  adsMovementMultiplier: 0.45,
  adsEnabled: true,
  
  viewmodelScale: 1.3,
  muzzleFlashIntensity: 12,
  muzzleFlashColor: '#ffdd00',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 1400,
  
  weight: 13.0,
  switchSpeed: 1.2,
  headshotMultiplier: 1.3,
  penetration: 150
}

// ============================================================================
// 🔫 SHOTGUNS
// ============================================================================

export const SHOTGUN_REMINGTON: WeaponData = {
  id: 'remington_870',
  name: 'Remington 870',
  description: 'Pump-action shotgun',
  type: WeaponType.SHOTGUN,
  fireMode: FireMode.SINGLE,
  rarity: WeaponRarity.COMMON,
  
  damage: 20, // Per pellet (8 pellets = 160 total)
  fireRate: 60, // Pump action
  range: 15,
  accuracy: 40,
  reloadTime: 0.5, // Per shell
  magazineSize: 8,
  maxTotalAmmo: 32,
  
  baseSpread: 0.15,
  maxSpread: 0.3,
  spreadIncrease: 0.05,
  spreadDecrease: 0.03,
  recoilPattern: [0, 0.35],
  recoilMultiplier: 1.5,
  recoilRecoverySpeed: 4.0,
  
  adsSpeed: 0.4,
  adsFovMultiplier: 0.85,
  adsMovementMultiplier: 0.7,
  adsEnabled: true,
  
  viewmodelScale: 1.1,
  muzzleFlashIntensity: 7,
  muzzleFlashColor: '#ff9900',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  
  weight: 3.8,
  switchSpeed: 0.7,
  headshotMultiplier: 1.5,
  pelletCount: 8
}

export const SHOTGUN_SPAS12: WeaponData = {
  id: 'spas_12',
  name: 'SPAS-12',
  description: 'Combat shotgun',
  type: WeaponType.SHOTGUN,
  fireMode: FireMode.SEMI_AUTO,
  rarity: WeaponRarity.EPIC,
  
  damage: 18, // Per pellet (8 pellets = 144 total)
  fireRate: 200,
  range: 18,
  accuracy: 45,
  reloadTime: 0.45, // Per shell
  magazineSize: 8,
  maxTotalAmmo: 40,
  
  baseSpread: 0.14,
  maxSpread: 0.28,
  spreadIncrease: 0.045,
  spreadDecrease: 0.04,
  recoilPattern: [0, 0.3],
  recoilMultiplier: 1.3,
  recoilRecoverySpeed: 5.0,
  
  adsSpeed: 0.38,
  adsFovMultiplier: 0.85,
  adsMovementMultiplier: 0.72,
  adsEnabled: true,
  
  viewmodelScale: 1.1,
  muzzleFlashIntensity: 6,
  muzzleFlashColor: '#ff9900',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  
  weight: 4.4,
  switchSpeed: 0.72,
  headshotMultiplier: 1.6,
  pelletCount: 8
}

// ============================================================================
// 🔫 LMGs
// ============================================================================

export const LMG_M249: WeaponData = {
  id: 'm249',
  name: 'M249 SAW',
  description: 'Squad Automatic Weapon',
  type: WeaponType.LMG,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.EPIC,
  
  damage: 38,
  fireRate: 750,
  range: 80,
  accuracy: 70,
  reloadTime: 5.5,
  magazineSize: 100,
  maxTotalAmmo: 300,
  
  baseSpread: 0.025,
  maxSpread: 0.2,
  spreadIncrease: 0.015,
  spreadDecrease: 0.05,
  recoilPattern: [0.06, 0.2, -0.04, 0.19, 0.05, 0.18, -0.03, 0.17],
  recoilMultiplier: 1.1,
  recoilRecoverySpeed: 5.5,
  
  adsSpeed: 0.55,
  adsFovMultiplier: 0.7,
  adsMovementMultiplier: 0.55,
  adsEnabled: true,
  
  viewmodelScale: 1.0,
  muzzleFlashIntensity: 6,
  muzzleFlashColor: '#ff9900',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 900,
  
  weight: 7.5,
  switchSpeed: 1.0,
  headshotMultiplier: 1.8,
  penetration: 45
}

export const LMG_PKM: WeaponData = {
  id: 'pkm',
  name: 'PKM',
  description: 'Soviet machine gun',
  type: WeaponType.LMG,
  fireMode: FireMode.FULL_AUTO,
  rarity: WeaponRarity.LEGENDARY,
  
  damage: 42,
  fireRate: 650,
  range: 85,
  accuracy: 68,
  reloadTime: 6.0,
  magazineSize: 100,
  maxTotalAmmo: 300,
  
  baseSpread: 0.028,
  maxSpread: 0.22,
  spreadIncrease: 0.018,
  spreadDecrease: 0.045,
  recoilPattern: [0.07, 0.22, -0.045, 0.21, 0.06, 0.2, -0.04, 0.19],
  recoilMultiplier: 1.25,
  recoilRecoverySpeed: 5.0,
  
  adsSpeed: 0.6,
  adsFovMultiplier: 0.7,
  adsMovementMultiplier: 0.5,
  adsEnabled: true,
  
  viewmodelScale: 1.05,
  muzzleFlashIntensity: 7,
  muzzleFlashColor: '#ffaa00',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 950,
  
  weight: 9.0,
  switchSpeed: 1.1,
  headshotMultiplier: 1.9,
  penetration: 50
}

// ============================================================================
// 🔫 WEAPON CATALOG
// ============================================================================

export const WEAPON_CATALOG: WeaponData[] = [
  // Pistols
  PISTOL_GLOCK,
  PISTOL_DEAGLE,
  
  // Assault Rifles
  AR_M4A1,
  AR_AK47,
  AR_SCAR,
  
  // SMGs
  SMG_MP5,
  SMG_UMP45,
  SMG_P90,
  
  // Sniper Rifles
  SNIPER_AWP,
  SNIPER_BARRETT,
  
  // Shotguns
  SHOTGUN_REMINGTON,
  SHOTGUN_SPAS12,
  
  // LMGs
  LMG_M249,
  LMG_PKM
]

/**
 * Get weapon by ID
 */
export function getWeaponById(id: string): WeaponData | undefined {
  return WEAPON_CATALOG.find(weapon => weapon.id === id)
}

/**
 * Get weapons by type
 */
export function getWeaponsByType(type: WeaponType): WeaponData[] {
  return WEAPON_CATALOG.filter(weapon => weapon.type === type)
}

/**
 * Get weapons by rarity
 */
export function getWeaponsByRarity(rarity: WeaponRarity): WeaponData[] {
  return WEAPON_CATALOG.filter(weapon => weapon.rarity === rarity)
}

export default WEAPON_CATALOG

