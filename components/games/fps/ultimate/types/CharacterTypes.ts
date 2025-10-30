/**
 * 👤 CHARACTER SYSTEM - Type Definitions
 * 
 * Definiert spielbare Charaktere mit Abilities und Stats
 * Nutzt die 40+ Professional Character Models aus AssetDatabase
 */

import * as THREE from 'three'

// ============================================================================
// ABILITY TYPES
// ============================================================================

/**
 * Passive Ability - Immer aktiv
 */
export interface CharacterPassive {
  id: string
  name: string
  description: string
  icon?: string
  
  // Stat Modifiers
  modifiers: {
    movementSpeed?: number // Multiplier (1.0 = normal, 1.2 = +20%)
    health?: number // Additive (+50 HP)
    armor?: number // Additive (+50 Armor)
    stamina?: number // Additive (+20 Stamina)
    reloadSpeed?: number // Multiplier (1.2 = +20% faster)
    weaponSwapSpeed?: number // Multiplier
    noiseReduction?: number // 0-1 (0.5 = 50% quieter)
    damageMultiplier?: number // Multiplier
    accuracyBonus?: number // Additive
    healthRegen?: number // HP per second
  }
}

/**
 * Active Ability - Cooldown-based
 */
export interface CharacterActive {
  id: string
  name: string
  description: string
  icon?: string
  
  // Mechanics
  cooldown: number // Seconds
  duration: number // Seconds
  charges?: number // Optional multi-charge (z.B. 2 Blinks)
  
  // Effect Type
  type: 'mobility' | 'vision' | 'defensive' | 'offensive' | 'utility' | 'support'
  
  // Effect Data (varies by type)
  effect: ActiveAbilityEffect
}

export interface ActiveAbilityEffect {
  // Mobility
  speedBoost?: number | { multiplier: number; radius: number; duration: number } // Multiplier or team boost
  dash?: { distance: number; direction: 'forward' | 'any' }
  teleport?: { range: number }
  
  // Vision
  wallhack?: { range: number; showEnemies: boolean }
  scan?: { radius: number; duration: number }
  
  // Defensive
  shield?: { health: number; duration: number }
  invisibility?: { duration: number; movementPenalty: number }
  heal?: { amount: number; overtime: boolean }
  
  // Offensive
  damage?: { amount: number; radius: number }
  stun?: { duration: number; radius: number }
  
  // Utility
  revive?: { speed: number }
  deployable?: { type: string; duration: number }
}

/**
 * Ultimate Ability - Charge-based (wie Overwatch)
 */
export interface CharacterUltimate {
  id: string
  name: string
  description: string
  icon?: string
  voiceLine?: string // "It's High Noon!"
  
  // Charge System
  chargeRequired: number // Points needed (100-200)
  chargeFromDamage: number // Charge per damage dealt
  chargeFromKills: number // Charge per kill
  chargeOverTime: number // Charge per second
  
  // Effect
  type: 'offensive' | 'defensive' | 'support' | 'mobility' | 'utility'
  duration: number
  effect: UltimateAbilityEffect
}

export interface UltimateAbilityEffect {
  // Offensive
  airstrike?: { radius: number; damage: number; delay: number }
  orbital?: { radius: number; damage: number }
  turret?: { health: number; damage: number; duration: number }
  damage?: { amount: number; radius: number }
  
  // Defensive
  dome?: { radius: number; duration: number }
  fortify?: { damageReduction: number; duration: number }
  
  // Support
  healingField?: { radius: number; healPerSecond: number; duration: number }
  supplyDrop?: { ammo: boolean; health: boolean; armor: boolean }
  reviveBeacon?: { range: number; duration: number }
  
  // Mobility
  speedBoost?: { multiplier: number; radius: number; duration: number }
  teleporter?: { duration: number }
}

// ============================================================================
// CHARACTER DEFINITION
// ============================================================================

/**
 * Playable Character
 */
export interface PlayableCharacter {
  // Identity
  id: string
  name: string
  displayName: string // Lokalisierter Name
  description: string
  lore?: string
  
  // Visual
  modelId: string // ID aus AssetDatabase (z.B. 'tactical_operator_4k')
  icon?: string
  portrait?: string
  
  // Rarity/Unlock
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockLevel?: number // Spieler-Level required
  unlockCost?: number // Credits required
  isUnlocked: boolean
  
  // Abilities
  abilities: {
    passive: CharacterPassive
    active: CharacterActive
    ultimate: CharacterUltimate
  }
  
  // Stats Modifiers (Base Stats werden modifiziert)
  stats: CharacterStats
  
  // Progression
  level: number // Character-spezifisches Level (1-100)
  xp: number
  matchesPlayed: number
  kills: number
  wins: number
}

/**
 * Character Stats Modifiers
 */
export interface CharacterStats {
  // Movement
  movementSpeed: number // 0.8 - 1.2 (multiplier)
  sprintSpeed: number // 0.8 - 1.2
  crouchSpeed: number // 0.8 - 1.2
  jumpHeight: number // 0.9 - 1.1
  
  // Health & Armor
  maxHealth: number // 80 - 120 (additive to base 100)
  maxArmor: number // 0 - 100 (additive to base 0)
  healthRegen: number // HP per second
  
  // Stamina
  maxStamina: number // 80 - 120 (additive to base 100)
  staminaRegen: number // Per second
  
  // Combat
  damageMultiplier: number // 0.9 - 1.1
  recoilMultiplier: number // 0.8 - 1.0 (lower = less recoil)
  accuracyBonus: number // 0 - 10 (additive %)
  
  // Other
  noiseLevel: number // 0.5 - 1.5 (sound radius multiplier)
  reviveSpeed: number // 0.8 - 1.5 (multiplier)
}

// ============================================================================
// CHARACTER STATE (Runtime)
// ============================================================================

/**
 * Character State during gameplay
 */
export interface CharacterState {
  // Current Character
  character: PlayableCharacter
  
  // Ability States
  activeAbility: {
    cooldownRemaining: number
    chargesRemaining: number
    isActive: boolean
    activatedAt: number
  }
  
  ultimateAbility: {
    charge: number // 0-100%
    isReady: boolean
    isActive: boolean
    activatedAt: number
  }
  
  // Applied Modifiers
  currentModifiers: CharacterStats
}

// ============================================================================
// CHARACTER SELECTION
// ============================================================================

/**
 * Character Selection Data
 */
export interface CharacterSelectionState {
  availableCharacters: PlayableCharacter[]
  selectedCharacter: PlayableCharacter | null
  unlockedCharacters: Set<string>
  favoriteCharacters: Set<string>
  
  // Filters
  filterByRole: 'all' | 'offense' | 'defense' | 'support'
  filterByRarity: 'all' | 'common' | 'rare' | 'epic' | 'legendary'
  sortBy: 'name' | 'level' | 'rarity' | 'recent'
}

// ============================================================================
// CHARACTER PROGRESSION
// ============================================================================

/**
 * Character Progression Data
 */
export interface CharacterProgression {
  characterId: string
  
  // XP & Level
  level: number // 1-100
  currentXP: number
  nextLevelXP: number
  
  // Stats
  matchesPlayed: number
  wins: number
  losses: number
  kills: number
  deaths: number
  assists: number
  
  // Performance
  averageScore: number
  winRate: number
  kdRatio: number
  
  // Ability Usage
  activeAbilityUses: number
  ultimateUses: number
  
  // Unlocks
  unlockedSkins: string[]
  unlockedEmotes: string[]
  unlockedVoiceLines: string[]
}

// ============================================================================
// EVENTS
// ============================================================================

export interface CharacterAbilityEvent {
  characterId: string
  abilityType: 'passive' | 'active' | 'ultimate'
  abilityId: string
  timestamp: number
  success: boolean
  target?: THREE.Vector3
}

export interface CharacterLevelUpEvent {
  characterId: string
  oldLevel: number
  newLevel: number
  rewards: CharacterReward[]
}

export interface CharacterReward {
  type: 'skin' | 'emote' | 'voiceline' | 'badge' | 'credits'
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type CharacterRole = 'offense' | 'defense' | 'support' | 'balanced'
export type CharacterDifficulty = 'easy' | 'medium' | 'hard'

/**
 * Character Class (für UI Grouping)
 */
export enum CharacterClass {
  ASSAULT = 'assault',       // Offensive, High Damage
  TANK = 'tank',            // Defensive, High HP
  SUPPORT = 'support',      // Healing, Utility
  RECON = 'recon',         // Vision, Intel
  SPECIALIST = 'specialist' // Unique Mechanics
}

