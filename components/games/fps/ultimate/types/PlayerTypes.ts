/**
 * Player Types for GLXY Ultimate FPS
 * 
 * @module PlayerTypes
 * @description Comprehensive type definitions for players, stats, and inventory
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { Vector3, Euler } from 'three'
import { Weapon, Loadout } from './WeaponTypes'

// ============================================================================
// PLAYER
// ============================================================================

/**
 * Complete player definition
 */
export interface Player {
  /** Unique player ID */
  id: string
  
  /** Display name */
  name: string
  
  /** Team ID (undefined = FFA) */
  team?: number
  
  /** Current health (0-maxHealth) */
  health: number
  
  /** Maximum health */
  maxHealth: number
  
  /** Current armor (0-100) */
  armor: number
  
  /** Position in world */
  position: Vector3
  
  /** Rotation (pitch, yaw, roll) */
  rotation: Euler
  
  /** Velocity */
  velocity: Vector3
  
  /** Is player alive */
  isAlive: boolean
  
  /** Is player invincible (spawn protection) */
  isInvincible: boolean
  
  /** Invincibility timer */
  invincibilityTimer: number
  
  /** Player inventory */
  inventory: Inventory
  
  /** Player stats */
  stats: PlayerStats
  
  /** Player class (if class-based mode) */
  class?: PlayerClass
  
  /** Player state */
  state: PlayerState
  
  /** Player settings/preferences */
  settings: PlayerSettings
  
  /** Network info (for multiplayer) */
  network?: NetworkInfo
}

// ============================================================================
// INVENTORY
// ============================================================================

/**
 * Player inventory
 */
export interface Inventory {
  /** All weapons player has */
  weapons: Weapon[]
  
  /** Currently equipped weapon index */
  currentWeaponIndex: number
  
  /** Currently equipped weapon */
  currentWeapon: Weapon
  
  /** Full loadout */
  loadout: Loadout
  
  /** Equipment */
  equipment: Equipment[]
  
  /** Money/currency */
  money: number
}

/**
 * Equipment item
 */
export interface Equipment {
  id: string
  name: string
  type: EquipmentType
  count: number
  maxCount: number
}

export type EquipmentType = 
  | 'frag-grenade'
  | 'flash-grenade'
  | 'smoke-grenade'
  | 'molotov'
  | 'stun-grenade'
  | 'medkit'
  | 'armor-plate'

// ============================================================================
// PLAYER STATS
// ============================================================================

/**
 * Player statistics
 */
export interface PlayerStats {
  /** Total kills */
  kills: number
  
  /** Total deaths */
  deaths: number
  
  /** Total assists */
  assists: number
  
  /** Headshots */
  headshots: number
  
  /** Accuracy (0-1) */
  accuracy: number
  
  /** Shots fired */
  shotsFired: number
  
  /** Shots hit */
  shotsHit: number
  
  /** Damage dealt */
  damageDealt: number
  
  /** Damage taken */
  damageTaken: number
  
  /** Score/points */
  score: number
  
  /** Current kill streak */
  killStreak: number
  
  /** Best kill streak */
  bestKillStreak: number
  
  /** Distance traveled (units) */
  distanceTraveled: number
  
  /** Time alive (seconds) */
  timeAlive: number
  
  /** K/D Ratio */
  kd: number
  
  /** K/D/A Ratio */
  kda: number
  
  /** XP (for progression) */
  xp: number
  
  /** Level */
  level: number
}

// ============================================================================
// PLAYER STATE
// ============================================================================

/**
 * Current player state/status
 */
export interface PlayerState {
  /** Is sprinting */
  isSprinting: boolean
  
  /** Is crouching */
  isCrouching: boolean
  
  /** Is jumping */
  isJumping: boolean
  
  /** Is sliding */
  isSliding: boolean
  
  /** Is aiming down sights */
  isADS: boolean
  
  /** Is reloading */
  isReloading: boolean
  
  /** Is switching weapon */
  isSwitchingWeapon: boolean
  
  /** Is using equipment */
  isUsingEquipment: boolean
  
  /** Is in air */
  isInAir: boolean
  
  /** Is on ladder */
  isOnLadder: boolean
  
  /** Is stunned */
  isStunned: boolean
  
  /** Is blinded */
  isBlinded: boolean
  
  /** Is bleeding */
  isBleeding: boolean
  
  /** Is on fire */
  isOnFire: boolean
  
  /** Stamina (0-100) */
  stamina: number
  
  /** Status effects */
  statusEffects: StatusEffect[]
}

/**
 * Status effect
 */
export interface StatusEffect {
  type: StatusEffectType
  duration: number
  intensity: number
  source?: string
}

export type StatusEffectType = 
  | 'bleed'
  | 'burn'
  | 'stun'
  | 'blind'
  | 'slow'
  | 'poison'
  | 'regen'
  | 'shield'

// ============================================================================
// PLAYER CLASS
// ============================================================================

/**
 * Player class (for class-based modes)
 */
export interface PlayerClass {
  id: string
  name: string
  description: string
  icon: string
  
  /** Base stats */
  health: number
  armor: number
  speed: number
  
  /** Starting weapons */
  startingWeapons: string[]
  
  /** Unique ability */
  ability: ClassAbility
  
  /** Passive perks */
  passives: string[]
}

export type ClassType = 
  | 'assault'
  | 'sniper'
  | 'medic'
  | 'engineer'
  | 'heavy'
  | 'scout'

/**
 * Class ability
 */
export interface ClassAbility {
  id: string
  name: string
  description: string
  cooldown: number
  duration: number
  effect: string
}

// ============================================================================
// PLAYER SETTINGS
// ============================================================================

/**
 * Player settings/preferences
 */
export interface PlayerSettings {
  /** Mouse sensitivity */
  sensitivity: number
  
  /** FOV */
  fov: number
  
  /** Crosshair settings */
  crosshair: CrosshairSettings
  
  /** Audio settings */
  audio: AudioSettings
  
  /** Graphics settings */
  graphics: GraphicsSettings
  
  /** Control bindings */
  controls: ControlBindings
}

export interface CrosshairSettings {
  type: 'dot' | 'cross' | 'circle' | 'dynamic'
  color: string
  size: number
  thickness: number
  gap: number
  opacity: number
}

export interface AudioSettings {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  voiceVolume: number
}

export interface GraphicsSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra'
  shadows: boolean
  particles: boolean
  postProcessing: boolean
  antiAliasing: boolean
  vsync: boolean
}

export interface ControlBindings {
  forward: string
  backward: string
  left: string
  right: string
  jump: string
  crouch: string
  sprint: string
  reload: string
  switchWeapon: string
  aim: string
  shoot: string
  melee: string
  useEquipment: string
  scoreboard: string
}

// ============================================================================
// NETWORK (for multiplayer)
// ============================================================================

/**
 * Network information
 */
export interface NetworkInfo {
  /** Connection ID */
  connectionId: string
  
  /** Ping (ms) */
  ping: number
  
  /** Packet loss (0-1) */
  packetLoss: number
  
  /** Is connected */
  isConnected: boolean
  
  /** Last update timestamp */
  lastUpdate: number
}

// ============================================================================
// PLAYER ACTIONS
// ============================================================================

/**
 * Player input/action
 */
export interface PlayerAction {
  type: PlayerActionType
  timestamp: number
  data?: any
}

export type PlayerActionType = 
  | 'move'
  | 'look'
  | 'shoot'
  | 'reload'
  | 'switch-weapon'
  | 'jump'
  | 'crouch'
  | 'sprint'
  | 'use-equipment'
  | 'chat'

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  Vector3,
  Euler
}

