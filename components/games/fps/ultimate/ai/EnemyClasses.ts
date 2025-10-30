/**
 * 🤖 ENEMY CLASSES
 * 
 * Definiert verschiedene Enemy-Typen mit unterschiedlichen Stats und Behaviors
 * Nutzt die verschiedenen Character Models aus AssetDatabase
 */

import { CHARACTER_ASSETS } from '../assets/AssetDatabase'

// ============================================================================
// ENEMY CLASS TYPES
// ============================================================================

export enum EnemyClass {
  GRUNT = 'grunt',          // Basic infantry
  ELITE = 'elite',          // Tactical operators
  HEAVY = 'heavy',          // Tank enemies
  SNIPER = 'sniper',        // Long-range specialists
  RUSHER = 'rusher',        // Fast close-range
  BOSS = 'boss'             // Special bosses
}

export enum EnemyBehavior {
  RUSH = 'rush',            // Charge at player
  TACTICAL = 'tactical',    // Use cover, flank
  DEFENSIVE = 'defensive',  // Hold position
  SNIPER = 'sniper',        // Long-range, hide
  BERSERKER = 'berserker'   // Aggressive, no cover
}

// ============================================================================
// ENEMY CONFIG
// ============================================================================

export interface EnemyClassConfig {
  class: EnemyClass
  name: string
  description: string
  
  // Models (from AssetDatabase)
  possibleModels: string[] // Asset IDs
  
  // Stats
  health: number
  maxHealth: number
  armor: number
  damage: number
  movementSpeed: number
  
  // Combat
  accuracy: number // 0-100
  fireRate: number // Multiplier
  reactionTime: number // Milliseconds
  aggressionLevel: number // 0-1
  
  // AI Behavior
  behavior: EnemyBehavior
  usesGrenade: boolean
  usesFlashbang: boolean
  callsBackup: boolean
  canFlank: boolean
  preferredRange: { min: number; max: number }
  
  // Loot Drops
  lootTable: LootDrop[]
  
  // XP & Score
  xpReward: number
  scoreReward: number
  
  // Special Abilities
  specialAbilities?: EnemySpecialAbility[]
}

export interface LootDrop {
  type: 'ammo' | 'health' | 'armor' | 'weapon' | 'grenade'
  itemId?: string
  amount?: number
  dropChance: number // 0-1
}

export interface EnemySpecialAbility {
  id: string
  name: string
  cooldown: number
  effect: any
}

// ============================================================================
// ENEMY CLASS DEFINITIONS
// ============================================================================

export const GRUNT_CONFIG: EnemyClassConfig = {
  class: EnemyClass.GRUNT,
  name: 'Grunt',
  description: 'Basic infantry enemy',
  
  // Models: Basic models (soldier, military)
  possibleModels: ['soldier_basic', 'military_basic', 'terrorist_1k'],
  
  // Stats
  health: 100,
  maxHealth: 100,
  armor: 0,
  damage: 25,
  movementSpeed: 1.0,
  
  // Combat
  accuracy: 60,
  fireRate: 1.0,
  reactionTime: 800,
  aggressionLevel: 0.6,
  
  // AI
  behavior: EnemyBehavior.RUSH,
  usesGrenade: false,
  usesFlashbang: false,
  callsBackup: false,
  canFlank: false,
  preferredRange: { min: 5, max: 30 },
  
  // Loot
  lootTable: [
    { type: 'ammo', amount: 30, dropChance: 0.8 },
    { type: 'health', amount: 25, dropChance: 0.3 }
  ],
  
  // Rewards
  xpReward: 100,
  scoreReward: 100
}

export const ELITE_CONFIG: EnemyClassConfig = {
  class: EnemyClass.ELITE,
  name: 'Elite Operator',
  description: 'Tactical operator with advanced AI',
  
  // Models: High-quality tactical models
  possibleModels: ['tactical_operator_1k', 'ghost_1k', 'reznov_1k', 'comoff_1k'],
  
  // Stats
  health: 150,
  maxHealth: 150,
  armor: 50,
  damage: 35,
  movementSpeed: 1.1,
  
  // Combat
  accuracy: 75,
  fireRate: 1.1,
  reactionTime: 500,
  aggressionLevel: 0.7,
  
  // AI
  behavior: EnemyBehavior.TACTICAL,
  usesGrenade: true,
  usesFlashbang: true,
  callsBackup: true,
  canFlank: true,
  preferredRange: { min: 10, max: 50 },
  
  // Loot
  lootTable: [
    { type: 'ammo', amount: 60, dropChance: 0.9 },
    { type: 'health', amount: 50, dropChance: 0.5 },
    { type: 'armor', amount: 25, dropChance: 0.4 },
    { type: 'grenade', amount: 1, dropChance: 0.3 }
  ],
  
  // Rewards
  xpReward: 200,
  scoreReward: 200
}

export const HEAVY_CONFIG: EnemyClassConfig = {
  class: EnemyClass.HEAVY,
  name: 'Heavy',
  description: 'Tank enemy with high HP and damage',
  
  // Models: Large models (criminal, police suit)
  possibleModels: ['criminal_4k', 'police_suit_4k'],
  
  // Stats
  health: 300,
  maxHealth: 300,
  armor: 100,
  damage: 50,
  movementSpeed: 0.7,
  
  // Combat
  accuracy: 50,
  fireRate: 0.8,
  reactionTime: 1000,
  aggressionLevel: 0.8,
  
  // AI
  behavior: EnemyBehavior.DEFENSIVE,
  usesGrenade: true,
  usesFlashbang: false,
  callsBackup: true,
  canFlank: false,
  preferredRange: { min: 0, max: 40 },
  
  // Loot
  lootTable: [
    { type: 'ammo', amount: 100, dropChance: 1.0 },
    { type: 'health', amount: 75, dropChance: 0.8 },
    { type: 'armor', amount: 50, dropChance: 0.7 }
  ],
  
  // Rewards
  xpReward: 300,
  scoreReward: 300,
  
  // Special: Suppressive fire
  specialAbilities: [
    {
      id: 'suppressive_fire',
      name: 'Suppressive Fire',
      cooldown: 30,
      effect: { duration: 5, fireRateBonus: 2.0 }
    }
  ]
}

export const SNIPER_CONFIG: EnemyClassConfig = {
  class: EnemyClass.SNIPER,
  name: 'Sniper',
  description: 'Long-range specialist',
  
  // Models: Sniper-looking models
  possibleModels: ['ghost_1k', 'reznov_1k'],
  
  // Stats
  health: 80,
  maxHealth: 80,
  armor: 0,
  damage: 100,
  movementSpeed: 1.0,
  
  // Combat
  accuracy: 90,
  fireRate: 0.4,
  reactionTime: 600,
  aggressionLevel: 0.3,
  
  // AI
  behavior: EnemyBehavior.SNIPER,
  usesGrenade: false,
  usesFlashbang: false,
  callsBackup: true,
  canFlank: false,
  preferredRange: { min: 40, max: 100 },
  
  // Loot
  lootTable: [
    { type: 'ammo', itemId: 'sniper_ammo', amount: 20, dropChance: 0.9 },
    { type: 'health', amount: 25, dropChance: 0.4 }
  ],
  
  // Rewards
  xpReward: 250,
  scoreReward: 250,
  
  // Special: Laser sight (warns player)
  specialAbilities: [
    {
      id: 'laser_sight',
      name: 'Laser Sight',
      cooldown: 0,
      effect: { visible: true, damageBonus: 1.2 }
    }
  ]
}

export const RUSHER_CONFIG: EnemyClassConfig = {
  class: EnemyClass.RUSHER,
  name: 'Rusher',
  description: 'Fast aggressive enemy',
  
  // Models: Fast-looking models
  possibleModels: ['terrorist_2k'],
  
  // Stats
  health: 75,
  maxHealth: 75,
  armor: 0,
  damage: 30,
  movementSpeed: 1.4,
  
  // Combat
  accuracy: 50,
  fireRate: 1.3,
  reactionTime: 400,
  aggressionLevel: 1.0,
  
  // AI
  behavior: EnemyBehavior.BERSERKER,
  usesGrenade: true,
  usesFlashbang: false,
  callsBackup: false,
  canFlank: false,
  preferredRange: { min: 0, max: 15 },
  
  // Loot
  lootTable: [
    { type: 'ammo', amount: 40, dropChance: 0.7 },
    { type: 'grenade', amount: 1, dropChance: 0.5 }
  ],
  
  // Rewards
  xpReward: 150,
  scoreReward: 150,
  
  // Special: Speed boost on low HP
  specialAbilities: [
    {
      id: 'adrenaline_rush',
      name: 'Adrenaline Rush',
      cooldown: 0,
      effect: { triggerHP: 25, speedBonus: 1.5, damageBonus: 1.3 }
    }
  ]
}

export const BOSS_CONFIG: EnemyClassConfig = {
  class: EnemyClass.BOSS,
  name: 'Boss',
  description: 'Powerful boss enemy',
  
  // Models: Best models (8K if available)
  possibleModels: ['criminal_8k', 'ghost_4k', 'tactical_operator_4k'],
  
  // Stats
  health: 500,
  maxHealth: 500,
  armor: 150,
  damage: 75,
  movementSpeed: 0.9,
  
  // Combat
  accuracy: 80,
  fireRate: 1.2,
  reactionTime: 400,
  aggressionLevel: 0.9,
  
  // AI
  behavior: EnemyBehavior.TACTICAL,
  usesGrenade: true,
  usesFlashbang: true,
  callsBackup: true,
  canFlank: true,
  preferredRange: { min: 10, max: 60 },
  
  // Loot
  lootTable: [
    { type: 'ammo', amount: 200, dropChance: 1.0 },
    { type: 'health', amount: 100, dropChance: 1.0 },
    { type: 'armor', amount: 100, dropChance: 1.0 },
    { type: 'weapon', itemId: 'legendary_drop', dropChance: 0.5 }
  ],
  
  // Rewards
  xpReward: 1000,
  scoreReward: 1000,
  
  // Special: Multiple abilities
  specialAbilities: [
    {
      id: 'armor_regen',
      name: 'Armor Regeneration',
      cooldown: 20,
      effect: { amount: 50, duration: 5 }
    },
    {
      id: 'call_reinforcements',
      name: 'Call Reinforcements',
      cooldown: 60,
      effect: { count: 3, enemyClass: 'grunt' }
    },
    {
      id: 'rage_mode',
      name: 'Rage Mode',
      cooldown: 45,
      effect: { duration: 10, damageBonus: 2.0, speedBonus: 1.5 }
    }
  ]
}

// ============================================================================
// ENEMY CLASS CATALOG
// ============================================================================

export const ENEMY_CLASS_CATALOG: Record<EnemyClass, EnemyClassConfig> = {
  [EnemyClass.GRUNT]: GRUNT_CONFIG,
  [EnemyClass.ELITE]: ELITE_CONFIG,
  [EnemyClass.HEAVY]: HEAVY_CONFIG,
  [EnemyClass.SNIPER]: SNIPER_CONFIG,
  [EnemyClass.RUSHER]: RUSHER_CONFIG,
  [EnemyClass.BOSS]: BOSS_CONFIG
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get enemy config by class
 */
export function getEnemyConfig(enemyClass: EnemyClass): EnemyClassConfig {
  return ENEMY_CLASS_CATALOG[enemyClass]
}

/**
 * Get random model for enemy class
 */
export function getRandomModelForClass(enemyClass: EnemyClass): string {
  const config = getEnemyConfig(enemyClass)
  const randomIndex = Math.floor(Math.random() * config.possibleModels.length)
  return config.possibleModels[randomIndex]
}

/**
 * Select enemy class based on difficulty
 */
export function selectEnemyClassByDifficulty(difficulty: number): EnemyClass {
  // difficulty: 0-1
  const rand = Math.random()
  
  if (difficulty < 0.2) {
    // Easy: 90% Grunt, 10% Rusher
    return rand < 0.9 ? EnemyClass.GRUNT : EnemyClass.RUSHER
  } else if (difficulty < 0.4) {
    // Medium: 60% Grunt, 30% Elite, 10% Rusher
    if (rand < 0.6) return EnemyClass.GRUNT
    if (rand < 0.9) return EnemyClass.ELITE
    return EnemyClass.RUSHER
  } else if (difficulty < 0.6) {
    // Hard: 40% Grunt, 40% Elite, 15% Heavy, 5% Sniper
    if (rand < 0.4) return EnemyClass.GRUNT
    if (rand < 0.8) return EnemyClass.ELITE
    if (rand < 0.95) return EnemyClass.HEAVY
    return EnemyClass.SNIPER
  } else if (difficulty < 0.8) {
    // Very Hard: 20% Grunt, 40% Elite, 20% Heavy, 15% Rusher, 5% Sniper
    if (rand < 0.2) return EnemyClass.GRUNT
    if (rand < 0.6) return EnemyClass.ELITE
    if (rand < 0.8) return EnemyClass.HEAVY
    if (rand < 0.95) return EnemyClass.RUSHER
    return EnemyClass.SNIPER
  } else {
    // Extreme: 10% Grunt, 40% Elite, 25% Heavy, 15% Rusher, 10% Sniper
    if (rand < 0.1) return EnemyClass.GRUNT
    if (rand < 0.5) return EnemyClass.ELITE
    if (rand < 0.75) return EnemyClass.HEAVY
    if (rand < 0.9) return EnemyClass.RUSHER
    return EnemyClass.SNIPER
  }
}

/**
 * Get loot drops for enemy
 */
export function generateLootDrops(enemyClass: EnemyClass): LootDrop[] {
  const config = getEnemyConfig(enemyClass)
  const drops: LootDrop[] = []
  
  config.lootTable.forEach(loot => {
    if (Math.random() < loot.dropChance) {
      drops.push(loot)
    }
  })
  
  return drops
}

