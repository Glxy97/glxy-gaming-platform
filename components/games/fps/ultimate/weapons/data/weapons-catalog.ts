/**
 * 🔫 WEAPONS CATALOG
 * Complete weapon arsenal for GLXY Ultimate FPS
 * Integrated from GLXYWeapons.tsx (Oct 29, 2025)
 *
 * @remarks
 * This catalog contains all 20 weapons from the GLXY arsenal,
 * converted to the new WeaponData format with professional
 * recoil patterns, spread mechanics, and sound/visual systems.
 */

import type { WeaponData } from './WeaponData'
import { FireMode, WeaponType } from './WeaponData'

// ============================================================
// HELPER FUNCTIONS FOR DEFAULT VALUES
// ============================================================

/**
 * Generate default recoil pattern
 * Simpler weapons have more vertical recoil
 */
function generateDefaultRecoilPattern(weaponType: WeaponType, fireRate: number) {
  const shots = 30
  const vertical: number[] = []
  const horizontal: number[] = []

  // Base recoil strength (lower fireRate = higher per-shot recoil)
  const verticalBase = weaponType === 'sniper' ? 8 : weaponType === 'rifle' ? 3 : 2
  const horizontalBase = weaponType === 'sniper' ? 2 : 1

  for (let i = 0; i < shots; i++) {
    // Vertical: increases then plateaus
    const vertMult = Math.min(1 + i * 0.05, 2.0)
    vertical.push(verticalBase * vertMult)

    // Horizontal: random left/right drift
    const horizontalDrift = (Math.random() - 0.5) * 2 * horizontalBase
    horizontal.push(horizontalDrift)
  }

  return { vertical, horizontal }
}

/**
 * Get default sound paths based on weapon type
 */
function getDefaultSoundPaths(weaponId: string, weaponType: WeaponType) {
  const typeFolder = weaponType === 'rifle' ? 'rifles' :
                     weaponType === 'sniper' ? 'snipers' :
                     weaponType === 'pistol' ? 'pistols' :
                     weaponType === 'smg' ? 'smgs' :
                     weaponType === 'shotgun' ? 'shotguns' : 'default'

  return {
    fire: `/sounds/weapons/${typeFolder}/${weaponId}_fire.mp3`,
    reload_mag_out: `/sounds/weapons/${typeFolder}/${weaponId}_mag_out.mp3`,
    reload_mag_in: `/sounds/weapons/${typeFolder}/${weaponId}_mag_in.mp3`,
    reload_rack: `/sounds/weapons/${typeFolder}/${weaponId}_rack.mp3`,
    dry_fire: `/sounds/weapons/generic/dry_fire.mp3`,
    switch: `/sounds/weapons/generic/weapon_switch.mp3`
  }
}

// ============================================================
// WEAPON CATALOG - ASSAULT RIFLES
// ============================================================

const GLXY_AR15_TACTICAL: WeaponData = {
  // Identification
  id: 'glxy_ar15_tactical',
  name: 'GLXY AR-15 Tactical',
  type: WeaponType.RIFLE,
  category: 'Assault Rifles',
  description: 'Versatile assault rifle with balanced stats and armor penetration',

  // Progression & Economy
  price: 2700,
  unlockLevel: 1,
  specialProperties: ['armor_penetration'],

  // Visuals
  modelPath: '/models/weapons/rifles/ar15_tactical.glb',
  viewmodelPosition: { x: 0.3, y: -0.2, z: -0.4 },
  adsPosition: { x: 0, y: -0.15, z: -0.3 },
  viewmodelScale: 1.0,

  // Ammunition
  magazineSize: 30,
  maxTotalAmmo: 120,
  reloadTime: 2.5,
  tacticalReloadTime: 2.0,
  usesAmmo: true,

  // Shooting
  fireRate: 667,
  fireMode: [FireMode.FULL_AUTO, FireMode.SEMI_AUTO],
  damage: 35,
  headshotMultiplier: 2.0,
  range: 60,
  accuracy: 85,
  penetration: 40,

  // Recoil
  recoilPattern: generateDefaultRecoilPattern(WeaponType.RIFLE, 667),
  recoilRecoverySpeed: 5.0,
  firstShotMultiplier: 0.8,
  adsRecoilMultiplier: 0.6,

  // Spread
  baseSpread: 0.002,
  movementSpreadMultiplier: 1.5,
  adsSpreadMultiplier: 0.3,
  crouchSpreadMultiplier: 0.7,
  jumpSpreadMultiplier: 3.0,

  // ADS
  adsFOV: 50,
  adsSpeed: 8.0,
  adsMovementPenalty: 0.7,
  adsEnabled: true,

  // Effects
  muzzleFlashIntensity: 6,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 900,

  // Audio
  soundPaths: getDefaultSoundPaths('glxy_ar15_tactical', WeaponType.RIFLE),

  // Gameplay
  weight: 3.5,
  switchSpeed: 0.6,
  inspectTime: 2.0
}

const GLXY_BR16_MARKSMAN: WeaponData = {
  id: 'glxy_br16_marksman',
  name: 'GLXY BR-16 Marksman',
  type: WeaponType.RIFLE,
  category: 'Battle Rifles',
  description: 'Semi-automatic battle rifle with high damage and accuracy',

  price: 3100,
  unlockLevel: 10,
  specialProperties: ['headshot_multiplier', 'long_range'],

  modelPath: '/models/weapons/rifles/br16_marksman.glb',
  viewmodelPosition: { x: 0.35, y: -0.2, z: -0.4 },
  adsPosition: { x: 0, y: -0.15, z: -0.3 },

  magazineSize: 20,
  maxTotalAmmo: 80,
  reloadTime: 3.0,
  tacticalReloadTime: 2.5,
  usesAmmo: true,

  fireRate: 400,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 55,
  headshotMultiplier: 2.5,
  range: 80,
  accuracy: 92,
  penetration: 50,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.RIFLE, 400),
  recoilRecoverySpeed: 6.0,
  firstShotMultiplier: 0.9,
  adsRecoilMultiplier: 0.5,

  baseSpread: 0.001,
  movementSpreadMultiplier: 1.8,
  adsSpreadMultiplier: 0.2,
  crouchSpreadMultiplier: 0.6,
  jumpSpreadMultiplier: 4.0,

  adsFOV: 45,
  adsSpeed: 7.0,
  adsMovementPenalty: 0.6,
  adsEnabled: true,

  muzzleFlashIntensity: 7,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 950,

  soundPaths: getDefaultSoundPaths('glxy_br16_marksman', WeaponType.RIFLE),

  weight: 4.2,
  switchSpeed: 0.7,
  inspectTime: 2.0
}

const GLXY_C8_CARBINE: WeaponData = {
  id: 'glxy_c8_carbine',
  name: 'GLXY C-8 Carbine',
  type: WeaponType.RIFLE,
  category: 'Assault Rifles',
  description: 'Lightweight carbine with high fire rate and mobility',

  price: 2400,
  unlockLevel: 4,
  specialProperties: ['light_weight', 'fast_handling'],

  modelPath: '/models/weapons/rifles/c8_carbine.glb',
  viewmodelPosition: { x: 0.28, y: -0.18, z: -0.38 },
  adsPosition: { x: 0, y: -0.15, z: -0.3 },

  magazineSize: 35,
  maxTotalAmmo: 140,
  reloadTime: 2.2,
  tacticalReloadTime: 1.8,
  usesAmmo: true,

  fireRate: 800,
  fireMode: [FireMode.FULL_AUTO],
  damage: 28,
  headshotMultiplier: 2.0,
  range: 45,
  accuracy: 78,
  penetration: 30,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.RIFLE, 800),
  recoilRecoverySpeed: 6.5,
  firstShotMultiplier: 0.7,
  adsRecoilMultiplier: 0.65,

  baseSpread: 0.0025,
  movementSpreadMultiplier: 1.3,
  adsSpreadMultiplier: 0.35,
  crouchSpreadMultiplier: 0.7,
  jumpSpreadMultiplier: 2.8,

  adsFOV: 52,
  adsSpeed: 9.0,
  adsMovementPenalty: 0.75,
  adsEnabled: true,

  muzzleFlashIntensity: 5,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 880,

  soundPaths: getDefaultSoundPaths('glxy_c8_carbine', WeaponType.RIFLE),

  weight: 3.0,
  switchSpeed: 0.5,
  inspectTime: 2.0
}

// ============================================================
// WEAPON CATALOG - SUBMACHINE GUNS
// ============================================================

const GLXY_SMG9: WeaponData = {
  id: 'glxy_smg9',
  name: 'GLXY SMG-9',
  type: WeaponType.SMG,
  category: 'Submachine Guns',
  description: 'Fast-firing SMG ideal for close-range engagements',

  price: 1800,
  unlockLevel: 2,
  specialProperties: ['close_range', 'high_mobility'],

  modelPath: '/models/weapons/smgs/smg9.glb',
  viewmodelPosition: { x: 0.25, y: -0.2, z: -0.35 },
  adsPosition: { x: 0, y: -0.15, z: -0.28 },

  magazineSize: 40,
  maxTotalAmmo: 160,
  reloadTime: 2.0,
  tacticalReloadTime: 1.6,
  usesAmmo: true,

  fireRate: 1000,
  fireMode: [FireMode.FULL_AUTO],
  damage: 22,
  headshotMultiplier: 1.8,
  range: 30,
  accuracy: 72,
  penetration: 15,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SMG, 1000),
  recoilRecoverySpeed: 7.0,
  firstShotMultiplier: 0.6,
  adsRecoilMultiplier: 0.7,

  baseSpread: 0.003,
  movementSpreadMultiplier: 1.2,
  adsSpreadMultiplier: 0.4,
  crouchSpreadMultiplier: 0.65,
  jumpSpreadMultiplier: 2.5,

  adsFOV: 55,
  adsSpeed: 10.0,
  adsMovementPenalty: 0.85,
  adsEnabled: true,

  muzzleFlashIntensity: 4,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 800,

  soundPaths: getDefaultSoundPaths('glxy_smg9', WeaponType.SMG),

  weight: 2.5,
  switchSpeed: 0.4,
  inspectTime: 1.8
}

const GLXY_PDW45: WeaponData = {
  id: 'glxy_pdw45',
  name: 'GLXY PDW-45',
  type: WeaponType.SMG,
  category: 'Submachine Guns',
  description: 'Extremely high fire rate PDW with manageable recoil',

  price: 1600,
  unlockLevel: 6,
  specialProperties: ['extreme_rate', 'low_recoil'],

  modelPath: '/models/weapons/smgs/pdw45.glb',
  viewmodelPosition: { x: 0.22, y: -0.18, z: -0.32 },
  adsPosition: { x: 0, y: -0.14, z: -0.26 },

  magazineSize: 50,
  maxTotalAmmo: 200,
  reloadTime: 1.8,
  tacticalReloadTime: 1.5,
  usesAmmo: true,

  fireRate: 1200,
  fireMode: [FireMode.FULL_AUTO],
  damage: 18,
  headshotMultiplier: 1.8,
  range: 25,
  accuracy: 68,
  penetration: 10,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SMG, 1200),
  recoilRecoverySpeed: 8.0,
  firstShotMultiplier: 0.5,
  adsRecoilMultiplier: 0.75,

  baseSpread: 0.0035,
  movementSpreadMultiplier: 1.1,
  adsSpreadMultiplier: 0.45,
  crouchSpreadMultiplier: 0.7,
  jumpSpreadMultiplier: 2.3,

  adsFOV: 56,
  adsSpeed: 11.0,
  adsMovementPenalty: 0.9,
  adsEnabled: true,

  muzzleFlashIntensity: 3,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 780,

  soundPaths: getDefaultSoundPaths('glxy_pdw45', WeaponType.SMG),

  weight: 2.2,
  switchSpeed: 0.35,
  inspectTime: 1.7
}

const GLXY_TAC_SMG: WeaponData = {
  id: 'glxy_tac_smg',
  name: 'GLXY TAC-SMG',
  type: WeaponType.SMG,
  category: 'Submachine Guns',
  description: 'Tactical SMG with burst fire mode for improved accuracy',

  price: 2200,
  unlockLevel: 8,
  specialProperties: ['burst_fire', 'balanced'],

  modelPath: '/models/weapons/smgs/tac_smg.glb',
  viewmodelPosition: { x: 0.26, y: -0.19, z: -0.34 },
  adsPosition: { x: 0, y: -0.15, z: -0.27 },

  magazineSize: 30,
  maxTotalAmmo: 120,
  reloadTime: 2.1,
  tacticalReloadTime: 1.7,
  usesAmmo: true,

  fireRate: 900,
  fireMode: [FireMode.BURST, FireMode.SEMI_AUTO],
  damage: 25,
  headshotMultiplier: 1.9,
  range: 35,
  accuracy: 80,
  penetration: 18,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SMG, 900),
  recoilRecoverySpeed: 6.8,
  firstShotMultiplier: 0.7,
  adsRecoilMultiplier: 0.65,

  baseSpread: 0.0028,
  movementSpreadMultiplier: 1.25,
  adsSpreadMultiplier: 0.38,
  crouchSpreadMultiplier: 0.68,
  jumpSpreadMultiplier: 2.6,

  adsFOV: 54,
  adsSpeed: 9.5,
  adsMovementPenalty: 0.8,
  adsEnabled: true,

  muzzleFlashIntensity: 4,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 820,

  soundPaths: getDefaultSoundPaths('glxy_tac_smg', WeaponType.SMG),

  weight: 2.8,
  switchSpeed: 0.42,
  inspectTime: 1.9
}

// ============================================================
// WEAPON CATALOG - SHOTGUNS
// ============================================================

const GLXY_SG12_COMBAT: WeaponData = {
  id: 'glxy_sg12_combat',
  name: 'GLXY SG-12 Combat',
  type: WeaponType.SHOTGUN,
  category: 'Shotguns',
  description: 'Pump-action shotgun with devastating close-range power',

  price: 2000,
  unlockLevel: 3,
  specialProperties: ['spread_shot', 'close_power'],

  modelPath: '/models/weapons/shotguns/sg12_combat.glb',
  viewmodelPosition: { x: 0.32, y: -0.22, z: -0.42 },
  adsPosition: { x: 0, y: -0.16, z: -0.32 },

  magazineSize: 8,
  maxTotalAmmo: 32,
  reloadTime: 4.0,
  tacticalReloadTime: 3.5,
  usesAmmo: true,

  fireRate: 120,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 120,
  headshotMultiplier: 1.5,
  range: 15,
  accuracy: 60,
  penetration: 25,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SHOTGUN, 120),
  recoilRecoverySpeed: 4.0,
  firstShotMultiplier: 1.0,
  adsRecoilMultiplier: 0.8,

  baseSpread: 0.08,  // Wide spread for pellets
  movementSpreadMultiplier: 1.3,
  adsSpreadMultiplier: 0.6,
  crouchSpreadMultiplier: 0.75,
  jumpSpreadMultiplier: 2.0,

  adsFOV: 58,
  adsSpeed: 6.0,
  adsMovementPenalty: 0.65,
  adsEnabled: true,

  muzzleFlashIntensity: 8,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  tracerSpeed: 600,

  soundPaths: getDefaultSoundPaths('glxy_sg12_combat', WeaponType.SHOTGUN),

  weight: 4.0,
  switchSpeed: 0.65,
  inspectTime: 2.2
}

const GLXY_AS24_AUTO: WeaponData = {
  id: 'glxy_as24_auto',
  name: 'GLXY AS-24 Auto',
  type: WeaponType.SHOTGUN,
  category: 'Shotguns',
  description: 'Full-auto combat shotgun for sustained close-quarters combat',

  price: 2800,
  unlockLevel: 12,
  specialProperties: ['auto_fire', 'pellet_storm'],

  modelPath: '/models/weapons/shotguns/as24_auto.glb',
  viewmodelPosition: { x: 0.34, y: -0.22, z: -0.42 },
  adsPosition: { x: 0, y: -0.16, z: -0.32 },

  magazineSize: 12,
  maxTotalAmmo: 48,
  reloadTime: 3.5,
  tacticalReloadTime: 3.0,
  usesAmmo: true,

  fireRate: 300,
  fireMode: [FireMode.FULL_AUTO],
  damage: 90,
  headshotMultiplier: 1.5,
  range: 18,
  accuracy: 55,
  penetration: 20,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SHOTGUN, 300),
  recoilRecoverySpeed: 4.5,
  firstShotMultiplier: 0.9,
  adsRecoilMultiplier: 0.75,

  baseSpread: 0.07,
  movementSpreadMultiplier: 1.4,
  adsSpreadMultiplier: 0.65,
  crouchSpreadMultiplier: 0.8,
  jumpSpreadMultiplier: 2.2,

  adsFOV: 58,
  adsSpeed: 6.5,
  adsMovementPenalty: 0.6,
  adsEnabled: true,

  muzzleFlashIntensity: 7,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: false,
  tracerSpeed: 620,

  soundPaths: getDefaultSoundPaths('glxy_as24_auto', WeaponType.SHOTGUN),

  weight: 4.2,
  switchSpeed: 0.7,
  inspectTime: 2.3
}

// ============================================================
// WEAPON CATALOG - SNIPER RIFLES
// ============================================================

const GLXY_SR50_INTERVENTION: WeaponData = {
  id: 'glxy_sr50_intervention',
  name: 'GLXY SR-50 Intervention',
  type: WeaponType.SNIPER,
  category: 'Sniper Rifles',
  description: 'Bolt-action sniper rifle with extreme range and one-shot kill potential',

  price: 4750,
  unlockLevel: 15,
  specialProperties: ['one_shot_kill', 'extreme_range', 'high_power'],

  modelPath: '/models/weapons/snipers/sr50_intervention.glb',
  viewmodelPosition: { x: 0.38, y: -0.22, z: -0.45 },
  adsPosition: { x: 0, y: -0.14, z: -0.28 },

  magazineSize: 5,
  maxTotalAmmo: 20,
  reloadTime: 4.5,
  tacticalReloadTime: 4.0,
  usesAmmo: true,

  fireRate: 45,
  fireMode: [FireMode.SEMI_AUTO],  // Bolt-action simulated
  damage: 180,
  headshotMultiplier: 3.0,
  range: 150,
  accuracy: 98,
  penetration: 80,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SNIPER, 45),
  recoilRecoverySpeed: 3.0,
  firstShotMultiplier: 1.0,
  adsRecoilMultiplier: 0.9,

  baseSpread: 0.0005,
  movementSpreadMultiplier: 3.0,
  adsSpreadMultiplier: 0.1,
  crouchSpreadMultiplier: 0.5,
  jumpSpreadMultiplier: 5.0,

  adsFOV: 30,
  adsSpeed: 5.0,
  adsMovementPenalty: 0.5,
  adsEnabled: true,

  muzzleFlashIntensity: 9,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 1000,

  soundPaths: getDefaultSoundPaths('glxy_sr50_intervention', WeaponType.SNIPER),

  weight: 6.5,
  switchSpeed: 0.9,
  inspectTime: 2.5
}

const GLXY_MSR762: WeaponData = {
  id: 'glxy_msr762',
  name: 'GLXY MSR-762',
  type: WeaponType.SNIPER,
  category: 'Sniper Rifles',
  description: 'Semi-automatic marksman rifle for versatile long-range combat',

  price: 3200,
  unlockLevel: 11,
  specialProperties: ['semi_auto', 'versatile'],

  modelPath: '/models/weapons/snipers/msr762.glb',
  viewmodelPosition: { x: 0.36, y: -0.21, z: -0.43 },
  adsPosition: { x: 0, y: -0.14, z: -0.28 },

  magazineSize: 10,
  maxTotalAmmo: 40,
  reloadTime: 3.8,
  tacticalReloadTime: 3.2,
  usesAmmo: true,

  fireRate: 180,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 85,
  headshotMultiplier: 2.5,
  range: 100,
  accuracy: 94,
  penetration: 60,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SNIPER, 180),
  recoilRecoverySpeed: 4.5,
  firstShotMultiplier: 0.85,
  adsRecoilMultiplier: 0.7,

  baseSpread: 0.001,
  movementSpreadMultiplier: 2.5,
  adsSpreadMultiplier: 0.15,
  crouchSpreadMultiplier: 0.55,
  jumpSpreadMultiplier: 4.5,

  adsFOV: 35,
  adsSpeed: 6.5,
  adsMovementPenalty: 0.55,
  adsEnabled: true,

  muzzleFlashIntensity: 8,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 980,

  soundPaths: getDefaultSoundPaths('glxy_msr762', WeaponType.SNIPER),

  weight: 5.5,
  switchSpeed: 0.75,
  inspectTime: 2.3
}

const GLXY_LSR556: WeaponData = {
  id: 'glxy_lsr556',
  name: 'GLXY LSR-556',
  type: WeaponType.SNIPER,
  category: 'Sniper Rifles',
  description: 'Lightweight marksman rifle optimized for quick-scoping',

  price: 2600,
  unlockLevel: 7,
  specialProperties: ['light_weight', 'quick_scoping'],

  modelPath: '/models/weapons/snipers/lsr556.glb',
  viewmodelPosition: { x: 0.34, y: -0.2, z: -0.41 },
  adsPosition: { x: 0, y: -0.14, z: -0.28 },

  magazineSize: 15,
  maxTotalAmmo: 60,
  reloadTime: 3.2,
  tacticalReloadTime: 2.7,
  usesAmmo: true,

  fireRate: 250,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 65,
  headshotMultiplier: 2.2,
  range: 75,
  accuracy: 90,
  penetration: 45,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SNIPER, 250),
  recoilRecoverySpeed: 5.5,
  firstShotMultiplier: 0.75,
  adsRecoilMultiplier: 0.65,

  baseSpread: 0.0015,
  movementSpreadMultiplier: 2.0,
  adsSpreadMultiplier: 0.2,
  crouchSpreadMultiplier: 0.6,
  jumpSpreadMultiplier: 4.0,

  adsFOV: 40,
  adsSpeed: 8.5,
  adsMovementPenalty: 0.65,
  adsEnabled: true,

  muzzleFlashIntensity: 7,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 940,

  soundPaths: getDefaultSoundPaths('glxy_lsr556', WeaponType.SNIPER),

  weight: 4.8,
  switchSpeed: 0.65,
  inspectTime: 2.1
}

// ============================================================
// WEAPON CATALOG - LIGHT MACHINE GUNS
// ============================================================

const GLXY_LMG249_SAW: WeaponData = {
  id: 'glxy_lmg249_saw',
  name: 'GLXY LMG-249 SAW',
  type: WeaponType.RIFLE,  // Closest type
  category: 'Light Machine Guns',
  description: 'Heavy support weapon with massive ammunition capacity',

  price: 5200,
  unlockLevel: 18,
  specialProperties: ['suppressive_fire', 'large_ammo', 'deployable'],

  modelPath: '/models/weapons/lmgs/lmg249_saw.glb',
  viewmodelPosition: { x: 0.4, y: -0.25, z: -0.48 },
  adsPosition: { x: 0, y: -0.18, z: -0.35 },

  magazineSize: 100,
  maxTotalAmmo: 200,
  reloadTime: 6.0,
  tacticalReloadTime: 5.5,
  usesAmmo: true,

  fireRate: 750,
  fireMode: [FireMode.FULL_AUTO],
  damage: 45,
  headshotMultiplier: 1.8,
  range: 70,
  accuracy: 70,
  penetration: 50,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.RIFLE, 750),
  recoilRecoverySpeed: 3.5,
  firstShotMultiplier: 1.0,
  adsRecoilMultiplier: 0.75,

  baseSpread: 0.004,
  movementSpreadMultiplier: 2.0,
  adsSpreadMultiplier: 0.5,
  crouchSpreadMultiplier: 0.6,
  jumpSpreadMultiplier: 3.5,

  adsFOV: 52,
  adsSpeed: 4.0,
  adsMovementPenalty: 0.5,
  adsEnabled: true,

  muzzleFlashIntensity: 7,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 850,

  soundPaths: getDefaultSoundPaths('glxy_lmg249_saw', WeaponType.RIFLE),

  weight: 7.5,
  switchSpeed: 1.0,
  inspectTime: 2.8
}

const GLXY_SLM_RPK: WeaponData = {
  id: 'glxy_slm_rpk',
  name: 'GLXY SLM-RPK',
  type: WeaponType.RIFLE,
  category: 'Light Machine Guns',
  description: 'Mobile support weapon with balanced stats',

  price: 4100,
  unlockLevel: 14,
  specialProperties: ['mobile_support', 'moderate_recoil'],

  modelPath: '/models/weapons/lmgs/slm_rpk.glb',
  viewmodelPosition: { x: 0.38, y: -0.23, z: -0.45 },
  adsPosition: { x: 0, y: -0.17, z: -0.33 },

  magazineSize: 75,
  maxTotalAmmo: 150,
  reloadTime: 4.5,
  tacticalReloadTime: 4.0,
  usesAmmo: true,

  fireRate: 700,
  fireMode: [FireMode.FULL_AUTO],
  damage: 38,
  headshotMultiplier: 1.9,
  range: 60,
  accuracy: 75,
  penetration: 40,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.RIFLE, 700),
  recoilRecoverySpeed: 4.5,
  firstShotMultiplier: 0.9,
  adsRecoilMultiplier: 0.7,

  baseSpread: 0.0035,
  movementSpreadMultiplier: 1.7,
  adsSpreadMultiplier: 0.45,
  crouchSpreadMultiplier: 0.65,
  jumpSpreadMultiplier: 3.2,

  adsFOV: 54,
  adsSpeed: 5.5,
  adsMovementPenalty: 0.6,
  adsEnabled: true,

  muzzleFlashIntensity: 6,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 870,

  soundPaths: getDefaultSoundPaths('glxy_slm_rpk', WeaponType.RIFLE),

  weight: 6.2,
  switchSpeed: 0.85,
  inspectTime: 2.5
}

// ============================================================
// WEAPON CATALOG - PISTOLS
// ============================================================

const GLXY_P19_SIDEARM: WeaponData = {
  id: 'glxy_p19_sidearm',
  name: 'GLXY P-19 Sidearm',
  type: WeaponType.PISTOL,
  category: 'Pistols',
  description: 'Reliable sidearm with fast fire rate',

  price: 500,
  unlockLevel: 1,
  specialProperties: ['reliable', 'fast_fire'],

  modelPath: '/models/weapons/pistols/p19_sidearm.glb',
  viewmodelPosition: { x: 0.2, y: -0.18, z: -0.3 },
  adsPosition: { x: 0, y: -0.13, z: -0.22 },

  magazineSize: 17,
  maxTotalAmmo: 68,
  reloadTime: 1.5,
  tacticalReloadTime: 1.2,
  usesAmmo: true,

  fireRate: 400,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 25,
  headshotMultiplier: 2.0,
  range: 20,
  accuracy: 75,
  penetration: 15,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.PISTOL, 400),
  recoilRecoverySpeed: 8.0,
  firstShotMultiplier: 0.6,
  adsRecoilMultiplier: 0.7,

  baseSpread: 0.003,
  movementSpreadMultiplier: 1.2,
  adsSpreadMultiplier: 0.5,
  crouchSpreadMultiplier: 0.75,
  jumpSpreadMultiplier: 2.5,

  adsFOV: 58,
  adsSpeed: 12.0,
  adsMovementPenalty: 0.9,
  adsEnabled: true,

  muzzleFlashIntensity: 4,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 750,

  soundPaths: getDefaultSoundPaths('glxy_p19_sidearm', WeaponType.PISTOL),

  weight: 1.2,
  switchSpeed: 0.3,
  inspectTime: 1.5
}

const GLXY_HP50_DESERT: WeaponData = {
  id: 'glxy_hp50_desert',
  name: 'GLXY HP-50 Desert',
  type: WeaponType.PISTOL,
  category: 'Pistols',
  description: 'High-powered revolver with devastating damage',

  price: 800,
  unlockLevel: 5,
  specialProperties: ['high_damage', 'low_capacity'],

  modelPath: '/models/weapons/pistols/hp50_desert.glb',
  viewmodelPosition: { x: 0.22, y: -0.19, z: -0.32 },
  adsPosition: { x: 0, y: -0.14, z: -0.24 },

  magazineSize: 7,
  maxTotalAmmo: 28,
  reloadTime: 2.8,
  tacticalReloadTime: 2.5,
  usesAmmo: true,

  fireRate: 180,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 65,
  headshotMultiplier: 2.5,
  range: 25,
  accuracy: 82,
  penetration: 35,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.PISTOL, 180),
  recoilRecoverySpeed: 6.0,
  firstShotMultiplier: 1.0,
  adsRecoilMultiplier: 0.75,

  baseSpread: 0.002,
  movementSpreadMultiplier: 1.4,
  adsSpreadMultiplier: 0.4,
  crouchSpreadMultiplier: 0.7,
  jumpSpreadMultiplier: 3.0,

  adsFOV: 56,
  adsSpeed: 10.0,
  adsMovementPenalty: 0.85,
  adsEnabled: true,

  muzzleFlashIntensity: 6,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 800,

  soundPaths: getDefaultSoundPaths('glxy_hp50_desert', WeaponType.PISTOL),

  weight: 1.8,
  switchSpeed: 0.4,
  inspectTime: 1.7
}

const GLXY_MP18_AUTO: WeaponData = {
  id: 'glxy_mp18_auto',
  name: 'GLXY MP-18 Auto',
  type: WeaponType.PISTOL,
  category: 'Pistols',
  description: 'Full-auto machine pistol for close quarters',

  price: 600,
  unlockLevel: 3,
  specialProperties: ['full_auto_pistol', 'close_range'],

  modelPath: '/models/weapons/pistols/mp18_auto.glb',
  viewmodelPosition: { x: 0.18, y: -0.17, z: -0.28 },
  adsPosition: { x: 0, y: -0.12, z: -0.2 },

  magazineSize: 25,
  maxTotalAmmo: 100,
  reloadTime: 1.8,
  tacticalReloadTime: 1.5,
  usesAmmo: true,

  fireRate: 900,
  fireMode: [FireMode.FULL_AUTO],
  damage: 18,
  headshotMultiplier: 1.8,
  range: 15,
  accuracy: 65,
  penetration: 10,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.PISTOL, 900),
  recoilRecoverySpeed: 9.0,
  firstShotMultiplier: 0.5,
  adsRecoilMultiplier: 0.75,

  baseSpread: 0.0035,
  movementSpreadMultiplier: 1.1,
  adsSpreadMultiplier: 0.55,
  crouchSpreadMultiplier: 0.7,
  jumpSpreadMultiplier: 2.2,

  adsFOV: 60,
  adsSpeed: 13.0,
  adsMovementPenalty: 0.95,
  adsEnabled: true,

  muzzleFlashIntensity: 3,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 720,

  soundPaths: getDefaultSoundPaths('glxy_mp18_auto', WeaponType.PISTOL),

  weight: 1.5,
  switchSpeed: 0.25,
  inspectTime: 1.4
}

const GLXY_TP92_TACTICAL: WeaponData = {
  id: 'glxy_tp92_tactical',
  name: 'GLXY TP-92 Tactical',
  type: WeaponType.PISTOL,
  category: 'Pistols',
  description: 'Precision tactical pistol with high accuracy',

  price: 700,
  unlockLevel: 4,
  specialProperties: ['high_accuracy', 'tactical'],

  modelPath: '/models/weapons/pistols/tp92_tactical.glb',
  viewmodelPosition: { x: 0.21, y: -0.18, z: -0.31 },
  adsPosition: { x: 0, y: -0.13, z: -0.23 },

  magazineSize: 12,
  maxTotalAmmo: 48,
  reloadTime: 2.0,
  tacticalReloadTime: 1.7,
  usesAmmo: true,

  fireRate: 300,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 32,
  headshotMultiplier: 2.2,
  range: 22,
  accuracy: 85,
  penetration: 20,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.PISTOL, 300),
  recoilRecoverySpeed: 7.5,
  firstShotMultiplier: 0.7,
  adsRecoilMultiplier: 0.65,

  baseSpread: 0.0025,
  movementSpreadMultiplier: 1.25,
  adsSpreadMultiplier: 0.45,
  crouchSpreadMultiplier: 0.72,
  jumpSpreadMultiplier: 2.7,

  adsFOV: 57,
  adsSpeed: 11.0,
  adsMovementPenalty: 0.88,
  adsEnabled: true,

  muzzleFlashIntensity: 4,
  muzzleFlashColor: '#ffa500',
  shellEjectionEnabled: true,
  tracerEnabled: true,
  tracerSpeed: 770,

  soundPaths: getDefaultSoundPaths('glxy_tp92_tactical', WeaponType.PISTOL),

  weight: 1.4,
  switchSpeed: 0.32,
  inspectTime: 1.6
}

// ============================================================
// WEAPON CATALOG - ENERGY WEAPONS
// ============================================================

const GLXY_PR1_PLASMA: WeaponData = {
  id: 'glxy_pr1_plasma',
  name: 'GLXY PR-1 Plasma',
  type: WeaponType.RIFLE,
  category: 'Energy Weapons',
  description: 'Experimental plasma rifle with energy-based ammunition',

  price: 4500,
  unlockLevel: 20,
  specialProperties: ['energy_damage', 'no_ammo_pickup', 'heat_buildup'],

  modelPath: '/models/weapons/energy/pr1_plasma.glb',
  viewmodelPosition: { x: 0.32, y: -0.21, z: -0.4 },
  adsPosition: { x: 0, y: -0.15, z: -0.3 },

  magazineSize: 40,
  maxTotalAmmo: 120,
  reloadTime: 2.5,
  tacticalReloadTime: 2.2,
  usesAmmo: true,

  fireRate: 600,
  fireMode: [FireMode.FULL_AUTO],
  damage: 40,
  headshotMultiplier: 1.8,
  range: 55,
  accuracy: 88,
  penetration: 35,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.RIFLE, 600),
  recoilRecoverySpeed: 6.5,
  firstShotMultiplier: 0.5,
  adsRecoilMultiplier: 0.6,

  baseSpread: 0.0018,
  movementSpreadMultiplier: 1.4,
  adsSpreadMultiplier: 0.32,
  crouchSpreadMultiplier: 0.68,
  jumpSpreadMultiplier: 2.8,

  adsFOV: 52,
  adsSpeed: 8.5,
  adsMovementPenalty: 0.72,
  adsEnabled: true,

  muzzleFlashIntensity: 10,
  muzzleFlashColor: '#00ffff',  // Cyan for plasma
  shellEjectionEnabled: false,
  tracerEnabled: true,
  tracerSpeed: 1200,

  soundPaths: getDefaultSoundPaths('glxy_pr1_plasma', WeaponType.RIFLE),

  weight: 3.8,
  switchSpeed: 0.6,
  inspectTime: 2.2
}

const GLXY_RGX_RAILGUN: WeaponData = {
  id: 'glxy_rgx_railgun',
  name: 'GLXY RG-X Railgun',
  type: WeaponType.SNIPER,
  category: 'Energy Weapons',
  description: 'Charge-based railgun with extreme penetration',

  price: 6500,
  unlockLevel: 25,
  specialProperties: ['charge_fire', 'penetration', 'delayed_shot'],

  modelPath: '/models/weapons/energy/rgx_railgun.glb',
  viewmodelPosition: { x: 0.4, y: -0.23, z: -0.46 },
  adsPosition: { x: 0, y: -0.15, z: -0.3 },

  magazineSize: 1,
  maxTotalAmmo: 10,
  reloadTime: 5.0,
  tacticalReloadTime: 4.8,
  usesAmmo: true,

  fireRate: 60,
  fireMode: [FireMode.SEMI_AUTO],  // Charge simulated
  damage: 200,
  headshotMultiplier: 2.5,
  range: 120,
  accuracy: 96,
  penetration: 100,

  recoilPattern: generateDefaultRecoilPattern(WeaponType.SNIPER, 60),
  recoilRecoverySpeed: 2.5,
  firstShotMultiplier: 1.0,
  adsRecoilMultiplier: 0.95,

  baseSpread: 0.0003,
  movementSpreadMultiplier: 4.0,
  adsSpreadMultiplier: 0.08,
  crouchSpreadMultiplier: 0.45,
  jumpSpreadMultiplier: 6.0,

  adsFOV: 25,
  adsSpeed: 4.0,
  adsMovementPenalty: 0.4,
  adsEnabled: true,

  muzzleFlashIntensity: 12,
  muzzleFlashColor: '#00ff00',  // Green for railgun
  shellEjectionEnabled: false,
  tracerEnabled: true,
  tracerSpeed: 2000,

  soundPaths: getDefaultSoundPaths('glxy_rgx_railgun', WeaponType.SNIPER),

  weight: 8.0,
  switchSpeed: 1.1,
  inspectTime: 2.8
}

// ============================================================
// WEAPON CATALOG - SPECIAL WEAPONS
// ============================================================

const GLXY_RL8_HAVOC: WeaponData = {
  id: 'glxy_rl8_havoc',
  name: 'GLXY RL-8 Havoc',
  type: WeaponType.RIFLE,  // Closest type
  category: 'Explosives',
  description: 'Rocket launcher with massive splash damage',

  price: 8000,
  unlockLevel: 30,
  specialProperties: ['explosive', 'splash_damage', 'slow_reload'],

  modelPath: '/models/weapons/special/rl8_havoc.glb',
  viewmodelPosition: { x: 0.45, y: -0.28, z: -0.5 },
  adsPosition: { x: 0, y: -0.2, z: -0.38 },

  magazineSize: 1,
  maxTotalAmmo: 5,
  reloadTime: 8.0,
  tacticalReloadTime: 7.5,
  usesAmmo: true,

  fireRate: 30,
  fireMode: [FireMode.SEMI_AUTO],
  damage: 250,
  headshotMultiplier: 1.0,  // Explosive doesn't benefit from headshots
  range: 80,
  accuracy: 60,
  penetration: 0,  // Doesn't penetrate, explodes on impact

  recoilPattern: generateDefaultRecoilPattern(WeaponType.RIFLE, 30),
  recoilRecoverySpeed: 2.0,
  firstShotMultiplier: 1.5,
  adsRecoilMultiplier: 0.9,

  baseSpread: 0.01,
  movementSpreadMultiplier: 2.5,
  adsSpreadMultiplier: 0.7,
  crouchSpreadMultiplier: 0.8,
  jumpSpreadMultiplier: 3.5,

  adsFOV: 55,
  adsSpeed: 3.0,
  adsMovementPenalty: 0.45,
  adsEnabled: true,

  muzzleFlashIntensity: 15,
  muzzleFlashColor: '#ff4500',  // Red-orange for rocket
  shellEjectionEnabled: false,
  tracerEnabled: true,
  tracerSpeed: 400,  // Slow rocket speed

  soundPaths: getDefaultSoundPaths('glxy_rl8_havoc', WeaponType.RIFLE),

  weight: 10.0,
  switchSpeed: 1.5,
  inspectTime: 3.0
}

// ============================================================
// EXPORT CATALOG
// ============================================================

/**
 * Complete weapon catalog
 * All 20 weapons available in GLXY Ultimate FPS
 *
 * @remarks
 * Integrated from GLXYWeapons.tsx on Oct 29, 2025
 * All weapons professionally converted to WeaponData format
 */
export const WEAPONS_CATALOG: WeaponData[] = [
  // Assault Rifles (3)
  GLXY_AR15_TACTICAL,
  GLXY_BR16_MARKSMAN,
  GLXY_C8_CARBINE,

  // Submachine Guns (3)
  GLXY_SMG9,
  GLXY_PDW45,
  GLXY_TAC_SMG,

  // Shotguns (2)
  GLXY_SG12_COMBAT,
  GLXY_AS24_AUTO,

  // Sniper Rifles (3)
  GLXY_SR50_INTERVENTION,
  GLXY_MSR762,
  GLXY_LSR556,

  // Light Machine Guns (2)
  GLXY_LMG249_SAW,
  GLXY_SLM_RPK,

  // Pistols (4)
  GLXY_P19_SIDEARM,
  GLXY_HP50_DESERT,
  GLXY_MP18_AUTO,
  GLXY_TP92_TACTICAL,

  // Energy Weapons (2)
  GLXY_PR1_PLASMA,
  GLXY_RGX_RAILGUN,

  // Special Weapons (1)
  GLXY_RL8_HAVOC
]

/**
 * Get weapon by ID
 */
export function getWeaponById(id: string): WeaponData | undefined {
  return WEAPONS_CATALOG.find(w => w.id === id)
}

/**
 * Get weapons by type
 */
export function getWeaponsByType(type: WeaponType): WeaponData[] {
  return WEAPONS_CATALOG.filter(w => w.type === type)
}

/**
 * Get weapons by category
 */
export function getWeaponsByCategory(category: string): WeaponData[] {
  return WEAPONS_CATALOG.filter(w => w.category === category)
}

/**
 * Get weapons unlocked at level
 */
export function getWeaponsAtLevel(level: number): WeaponData[] {
  return WEAPONS_CATALOG.filter(w => (w.unlockLevel || 1) <= level)
}
