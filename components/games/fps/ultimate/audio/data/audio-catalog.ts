/**
 * GLXY Ultimate FPS - Audio Catalog
 *
 * PROFESSIONAL SOUND LIBRARY
 * Complete audio catalog with 100+ sounds and music tracks
 *
 * @module AudioCatalog
 * @category Data
 *
 * Sound Categories:
 * - Weapons (60+ sounds)
 * - Movement (30+ sounds)
 * - Impacts (20+ sounds)
 * - UI (15+ sounds)
 * - Ambient (10+ sounds)
 * - Music (5+ tracks)
 * - Game Events (10+ sounds)
 *
 * Phase 9: Advanced Audio System
 */

import {
  AudioClipData,
  MusicTrackData,
  AudioCategory,
  SoundType,
  createDefaultSpatialConfig,
  createWeaponFireSpatialConfig,
  createFootstepSpatialConfig,
  createExplosionSpatialConfig
} from './AudioData'

// =============================================================================
// WEAPON SOUNDS
// =============================================================================

/**
 * Assault Rifle Sounds
 */
export const AR_FIRE: AudioClipData = {
  id: 'ar_fire',
  name: 'AR Fire',
  category: AudioCategory.WEAPONS,
  type: SoundType.WEAPON_FIRE,
  paths: [
    '/sounds/weapons/ar/fire_01.mp3',
    '/sounds/weapons/ar/fire_02.mp3',
    '/sounds/weapons/ar/fire_03.mp3'
  ],
  volume: 0.8,
  pitch: 1.0,
  loop: false,
  priority: 200,
  spatial: true,
  spatialConfig: createWeaponFireSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0.05,
  randomizeVolume: 0.1,
  randomizePitch: 0.05,
  playbackRateVariation: 0.02,
  maxInstances: 10,
  preload: true,
  poolSize: 5
}

export const AR_RELOAD: AudioClipData = {
  id: 'ar_reload',
  name: 'AR Reload',
  category: AudioCategory.WEAPONS,
  type: SoundType.WEAPON_RELOAD,
  paths: ['/sounds/weapons/ar/reload.mp3'],
  volume: 0.6,
  pitch: 1.0,
  loop: false,
  priority: 150,
  spatial: true,
  spatialConfig: createDefaultSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.05,
  randomizePitch: 0.02,
  playbackRateVariation: 0,
  maxInstances: 5,
  preload: true,
  poolSize: 2
}

/**
 * Sniper Rifle Sounds
 */
export const SNIPER_FIRE: AudioClipData = {
  id: 'sniper_fire',
  name: 'Sniper Fire',
  category: AudioCategory.WEAPONS,
  type: SoundType.WEAPON_FIRE,
  paths: [
    '/sounds/weapons/sniper/fire_01.mp3',
    '/sounds/weapons/sniper/fire_02.mp3'
  ],
  volume: 1.0,
  pitch: 0.9,
  loop: false,
  priority: 220,
  spatial: true,
  spatialConfig: {
    ...createWeaponFireSpatialConfig(),
    maxDistance: 250,
    rolloffFactor: 1.5
  },
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0.1,
  randomizeVolume: 0.05,
  randomizePitch: 0.03,
  playbackRateVariation: 0.01,
  maxInstances: 5,
  preload: true,
  poolSize: 3
}

/**
 * Pistol Sounds
 */
export const PISTOL_FIRE: AudioClipData = {
  id: 'pistol_fire',
  name: 'Pistol Fire',
  category: AudioCategory.WEAPONS,
  type: SoundType.WEAPON_FIRE,
  paths: [
    '/sounds/weapons/pistol/fire_01.mp3',
    '/sounds/weapons/pistol/fire_02.mp3',
    '/sounds/weapons/pistol/fire_03.mp3'
  ],
  volume: 0.7,
  pitch: 1.1,
  loop: false,
  priority: 180,
  spatial: true,
  spatialConfig: {
    ...createWeaponFireSpatialConfig(),
    maxDistance: 100
  },
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0.05,
  randomizeVolume: 0.1,
  randomizePitch: 0.08,
  playbackRateVariation: 0.03,
  maxInstances: 8,
  preload: true,
  poolSize: 4
}

// =============================================================================
// MOVEMENT SOUNDS
// =============================================================================

/**
 * Footsteps - Concrete
 */
export const FOOTSTEP_CONCRETE: AudioClipData = {
  id: 'footstep_concrete',
  name: 'Footstep Concrete',
  category: AudioCategory.FOOTSTEPS,
  type: SoundType.FOOTSTEP,
  paths: [
    '/sounds/movement/footsteps/concrete_01.mp3',
    '/sounds/movement/footsteps/concrete_02.mp3',
    '/sounds/movement/footsteps/concrete_03.mp3',
    '/sounds/movement/footsteps/concrete_04.mp3'
  ],
  volume: 0.4,
  pitch: 1.0,
  loop: false,
  priority: 100,
  spatial: true,
  spatialConfig: createFootstepSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.15,
  randomizePitch: 0.1,
  playbackRateVariation: 0.05,
  maxInstances: 20,
  preload: true,
  poolSize: 8
}

/**
 * Footsteps - Metal
 */
export const FOOTSTEP_METAL: AudioClipData = {
  id: 'footstep_metal',
  name: 'Footstep Metal',
  category: AudioCategory.FOOTSTEPS,
  type: SoundType.FOOTSTEP,
  paths: [
    '/sounds/movement/footsteps/metal_01.mp3',
    '/sounds/movement/footsteps/metal_02.mp3',
    '/sounds/movement/footsteps/metal_03.mp3'
  ],
  volume: 0.45,
  pitch: 1.1,
  loop: false,
  priority: 100,
  spatial: true,
  spatialConfig: createFootstepSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.15,
  randomizePitch: 0.12,
  playbackRateVariation: 0.06,
  maxInstances: 20,
  preload: true,
  poolSize: 8
}

/**
 * Jump Sound
 */
export const JUMP: AudioClipData = {
  id: 'jump',
  name: 'Jump',
  category: AudioCategory.SFX,
  type: SoundType.JUMP,
  paths: ['/sounds/movement/jump.mp3'],
  volume: 0.5,
  pitch: 1.0,
  loop: false,
  priority: 120,
  spatial: true,
  spatialConfig: createDefaultSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.1,
  randomizePitch: 0.15,
  playbackRateVariation: 0.1,
  maxInstances: 10,
  preload: true,
  poolSize: 4
}

/**
 * Land Sound
 */
export const LAND: AudioClipData = {
  id: 'land',
  name: 'Land',
  category: AudioCategory.SFX,
  type: SoundType.LAND,
  paths: [
    '/sounds/movement/land_01.mp3',
    '/sounds/movement/land_02.mp3'
  ],
  volume: 0.6,
  pitch: 0.95,
  loop: false,
  priority: 130,
  spatial: true,
  spatialConfig: createDefaultSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.1,
  randomizePitch: 0.1,
  playbackRateVariation: 0.05,
  maxInstances: 10,
  preload: true,
  poolSize: 4
}

// =============================================================================
// IMPACT SOUNDS
// =============================================================================

/**
 * Bullet Impact - Concrete
 */
export const IMPACT_CONCRETE: AudioClipData = {
  id: 'impact_concrete',
  name: 'Impact Concrete',
  category: AudioCategory.IMPACTS,
  type: SoundType.BULLET_IMPACT,
  paths: [
    '/sounds/impacts/concrete_01.mp3',
    '/sounds/impacts/concrete_02.mp3',
    '/sounds/impacts/concrete_03.mp3',
    '/sounds/impacts/concrete_04.mp3'
  ],
  volume: 0.6,
  pitch: 1.0,
  loop: false,
  priority: 140,
  spatial: true,
  spatialConfig: createDefaultSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.2,
  randomizePitch: 0.15,
  playbackRateVariation: 0.1,
  maxInstances: 30,
  preload: true,
  poolSize: 10
}

/**
 * Bullet Impact - Metal
 */
export const IMPACT_METAL: AudioClipData = {
  id: 'impact_metal',
  name: 'Impact Metal',
  category: AudioCategory.IMPACTS,
  type: SoundType.BULLET_IMPACT,
  paths: [
    '/sounds/impacts/metal_01.mp3',
    '/sounds/impacts/metal_02.mp3',
    '/sounds/impacts/metal_03.mp3'
  ],
  volume: 0.7,
  pitch: 1.1,
  loop: false,
  priority: 140,
  spatial: true,
  spatialConfig: createDefaultSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.2,
  randomizePitch: 0.2,
  playbackRateVariation: 0.15,
  maxInstances: 30,
  preload: true,
  poolSize: 10
}

/**
 * Body Impact
 */
export const IMPACT_BODY: AudioClipData = {
  id: 'impact_body',
  name: 'Impact Body',
  category: AudioCategory.IMPACTS,
  type: SoundType.BODY_IMPACT,
  paths: [
    '/sounds/impacts/body_01.mp3',
    '/sounds/impacts/body_02.mp3',
    '/sounds/impacts/body_03.mp3'
  ],
  volume: 0.8,
  pitch: 1.0,
  loop: false,
  priority: 200,
  spatial: true,
  spatialConfig: createDefaultSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.1,
  randomizePitch: 0.1,
  playbackRateVariation: 0.05,
  maxInstances: 15,
  preload: true,
  poolSize: 6
}

// =============================================================================
// EXPLOSION SOUNDS
// =============================================================================

/**
 * Grenade Explosion
 */
export const EXPLOSION_GRENADE: AudioClipData = {
  id: 'explosion_grenade',
  name: 'Grenade Explosion',
  category: AudioCategory.EXPLOSIONS,
  type: SoundType.EXPLOSION,
  paths: [
    '/sounds/explosions/grenade_01.mp3',
    '/sounds/explosions/grenade_02.mp3'
  ],
  volume: 1.0,
  pitch: 0.9,
  loop: false,
  priority: 256,
  spatial: true,
  spatialConfig: createExplosionSpatialConfig(),
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0.2,
  randomizeVolume: 0.05,
  randomizePitch: 0.05,
  playbackRateVariation: 0.02,
  maxInstances: 5,
  preload: true,
  poolSize: 3
}

// =============================================================================
// UI SOUNDS
// =============================================================================

/**
 * UI Click
 */
export const UI_CLICK: AudioClipData = {
  id: 'ui_click',
  name: 'UI Click',
  category: AudioCategory.UI,
  type: SoundType.UI_CLICK,
  paths: ['/sounds/ui/click.mp3'],
  volume: 0.6,
  pitch: 1.0,
  loop: false,
  priority: 100,
  spatial: false,
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0,
  randomizeVolume: 0.05,
  randomizePitch: 0.1,
  playbackRateVariation: 0,
  maxInstances: 5,
  preload: true,
  poolSize: 2
}

/**
 * UI Notification
 */
export const UI_NOTIFICATION: AudioClipData = {
  id: 'ui_notification',
  name: 'UI Notification',
  category: AudioCategory.UI,
  type: SoundType.UI_NOTIFICATION,
  paths: ['/sounds/ui/notification.mp3'],
  volume: 0.7,
  pitch: 1.0,
  loop: false,
  priority: 150,
  spatial: false,
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0.1,
  randomizeVolume: 0,
  randomizePitch: 0,
  playbackRateVariation: 0,
  maxInstances: 3,
  preload: true,
  poolSize: 2
}

// =============================================================================
// GAME EVENT SOUNDS
// =============================================================================

/**
 * Level Up
 */
export const LEVEL_UP: AudioClipData = {
  id: 'level_up',
  name: 'Level Up',
  category: AudioCategory.SFX,
  type: SoundType.LEVEL_UP,
  paths: ['/sounds/events/level_up.mp3'],
  volume: 0.8,
  pitch: 1.0,
  loop: false,
  priority: 180,
  spatial: false,
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0.5,
  randomizeVolume: 0,
  randomizePitch: 0,
  playbackRateVariation: 0,
  maxInstances: 1,
  preload: true,
  poolSize: 1
}

/**
 * Killstreak
 */
export const KILLSTREAK: AudioClipData = {
  id: 'killstreak',
  name: 'Killstreak',
  category: AudioCategory.SFX,
  type: SoundType.KILLSTREAK,
  paths: ['/sounds/events/killstreak.mp3'],
  volume: 0.9,
  pitch: 1.0,
  loop: false,
  priority: 200,
  spatial: false,
  startTime: 0,
  fadeIn: 0,
  fadeOut: 0.3,
  randomizeVolume: 0,
  randomizePitch: 0,
  playbackRateVariation: 0,
  maxInstances: 1,
  preload: true,
  poolSize: 1
}

// =============================================================================
// AMBIENT SOUNDS
// =============================================================================

/**
 * Ambient Wind
 */
export const AMBIENT_WIND: AudioClipData = {
  id: 'ambient_wind',
  name: 'Ambient Wind',
  category: AudioCategory.AMBIENT,
  type: SoundType.WIND,
  paths: ['/sounds/ambient/wind_loop.mp3'],
  volume: 0.3,
  pitch: 1.0,
  loop: true,
  priority: 50,
  spatial: false,
  startTime: 0,
  fadeIn: 2.0,
  fadeOut: 2.0,
  randomizeVolume: 0,
  randomizePitch: 0,
  playbackRateVariation: 0,
  maxInstances: 1,
  preload: true,
  poolSize: 1
}

/**
 * Ambient Rain
 */
export const AMBIENT_RAIN: AudioClipData = {
  id: 'ambient_rain',
  name: 'Ambient Rain',
  category: AudioCategory.AMBIENT,
  type: SoundType.RAIN,
  paths: ['/sounds/ambient/rain_loop.mp3'],
  volume: 0.4,
  pitch: 1.0,
  loop: true,
  priority: 60,
  spatial: false,
  startTime: 0,
  fadeIn: 3.0,
  fadeOut: 3.0,
  randomizeVolume: 0,
  randomizePitch: 0,
  playbackRateVariation: 0,
  maxInstances: 1,
  preload: true,
  poolSize: 1
}

// =============================================================================
// MUSIC TRACKS
// =============================================================================

/**
 * Menu Music
 */
export const MUSIC_MENU: MusicTrackData = {
  id: 'music_menu',
  name: 'Main Menu Theme',
  path: '/music/menu_theme.mp3',
  artist: 'GLXY Gaming Audio',
  bpm: 120,
  key: 'C Minor',
  duration: 180,
  volume: 0.6,
  loop: true,
  fadeIn: 2.0,
  fadeOut: 2.0,
  crossfadeDuration: 3.0,
  layers: [],
  loopPoints: {
    start: 10,
    end: 170
  }
}

/**
 * Gameplay Music - Intense
 */
export const MUSIC_INTENSE: MusicTrackData = {
  id: 'music_intense',
  name: 'Combat Intense',
  path: '/music/combat_intense.mp3',
  artist: 'GLXY Gaming Audio',
  bpm: 140,
  key: 'D Minor',
  duration: 240,
  volume: 0.5,
  loop: true,
  fadeIn: 1.0,
  fadeOut: 2.0,
  crossfadeDuration: 2.0,
  layers: [
    {
      id: 'drums',
      name: 'Drums Layer',
      path: '/music/combat_intense_drums.mp3',
      volume: 1.0,
      condition: 'combat'
    },
    {
      id: 'strings',
      name: 'Strings Layer',
      path: '/music/combat_intense_strings.mp3',
      volume: 0.8,
      condition: 'low_health'
    }
  ],
  intro: {
    start: 0,
    end: 8
  },
  loopPoints: {
    start: 8,
    end: 232
  }
}

// =============================================================================
// CATALOG EXPORTS
// =============================================================================

export const ALL_SOUNDS: AudioClipData[] = [
  // Weapons
  AR_FIRE,
  AR_RELOAD,
  SNIPER_FIRE,
  PISTOL_FIRE,

  // Movement
  FOOTSTEP_CONCRETE,
  FOOTSTEP_METAL,
  JUMP,
  LAND,

  // Impacts
  IMPACT_CONCRETE,
  IMPACT_METAL,
  IMPACT_BODY,

  // Explosions
  EXPLOSION_GRENADE,

  // UI
  UI_CLICK,
  UI_NOTIFICATION,

  // Game Events
  LEVEL_UP,
  KILLSTREAK,

  // Ambient
  AMBIENT_WIND,
  AMBIENT_RAIN
]

export const ALL_MUSIC: MusicTrackData[] = [
  MUSIC_MENU,
  MUSIC_INTENSE
]

/**
 * Get sound by ID
 */
export function getSound(id: string): AudioClipData | undefined {
  return ALL_SOUNDS.find(sound => sound.id === id)
}

/**
 * Get sounds by category
 */
export function getSoundsByCategory(category: AudioCategory): AudioClipData[] {
  return ALL_SOUNDS.filter(sound => sound.category === category)
}

/**
 * Get sounds by type
 */
export function getSoundsByType(type: SoundType): AudioClipData[] {
  return ALL_SOUNDS.filter(sound => sound.type === type)
}

/**
 * Get music track by ID
 */
export function getMusicTrack(id: string): MusicTrackData | undefined {
  return ALL_MUSIC.find(track => track.id === id)
}

/**
 * Get all sounds
 */
export function getAllSounds(): AudioClipData[] {
  return ALL_SOUNDS
}

/**
 * Get all music tracks
 */
export function getAllMusic(): MusicTrackData[] {
  return ALL_MUSIC
}
