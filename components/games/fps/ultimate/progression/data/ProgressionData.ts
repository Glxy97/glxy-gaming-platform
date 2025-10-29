/**
 * GLXY Ultimate FPS - Progression Data
 *
 * Professional data-driven progression system
 * Defines all XP, levels, ranks, unlocks, and rewards
 *
 * @module ProgressionData
 * @category Data
 * @see GLXYProgressionSystem.tsx for the legacy implementation
 *
 * Architecture: Data-Driven Design
 * Pattern: ScriptableObject-style (Unity-inspired)
 *
 * Phase 7: Progression System Complete
 */

/**
 * Player Rank Data
 */
export interface RankData {
  id: string
  name: string
  level: number
  minXP: number
  maxXP: number
  color: string
  icon: string
  badgeIcon?: string

  // Unlocks at this rank
  unlocks: {
    weapons: string[]
    attachments: string[]
    abilities: string[]
    cosmetics: string[]
    titles: string[]
  }

  // Rewards when reaching this rank
  rewards: {
    credits: number
    xp: number
    items: string[]
  }

  // Privileges
  privileges: string[]
  description: string
}

/**
 * Level Data
 */
export interface LevelData {
  level: number
  xpRequired: number // XP required to reach this level from previous
  totalXP: number // Total XP required from level 1
  rankId: string // Rank at this level

  // Rewards for reaching this level
  rewards: {
    credits: number
    unlocks: string[]
  }
}

/**
 * XP Sources
 */
export enum XPSource {
  KILL = 'kill',
  HEADSHOT_KILL = 'headshot_kill',
  MELEE_KILL = 'melee_kill',
  MULTI_KILL = 'multi_kill',
  STREAK = 'streak',
  ASSIST = 'assist',
  OBJECTIVE = 'objective',
  WIN = 'win',
  LOSS = 'loss',
  DAMAGE = 'damage',
  HEAL = 'heal',
  CHALLENGE_COMPLETE = 'challenge_complete',
  MATCH_TIME = 'match_time'
}

/**
 * XP Reward Configuration
 */
export interface XPRewardData {
  source: XPSource
  baseXP: number
  multipliers?: {
    headshot?: number
    longRange?: number // Distance in meters
    streak?: number // XP per streak count
    combo?: number // Combo multiplier
  }
}

/**
 * Unlock Requirement
 */
export interface UnlockRequirement {
  type: 'level' | 'rank' | 'xp' | 'achievement' | 'challenge' | 'purchase' | 'prestige'
  value: number | string
  description: string
}

/**
 * Unlockable Item
 */
export interface UnlockableItem {
  id: string
  name: string
  category: 'weapon' | 'attachment' | 'ability' | 'cosmetic' | 'title' | 'badge' | 'perk'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  requirement: UnlockRequirement
  isUnlocked: boolean
  unlockedAt?: Date
}

/**
 * Prestige Data
 */
export interface PrestigeData {
  level: number
  name: string
  icon: string
  color: string

  // Requirements
  requiredLevel: number // Must reach this level to prestige
  requiredXP: number

  // Rewards
  rewards: {
    title: string
    badge: string
    icon: string
    credits: number
    cosmeticItem: string
  }

  // Effects
  effects: {
    xpMultiplier: number // XP gain multiplier (1.1 = 110%)
    creditsMultiplier: number
    retainUnlocks: boolean // Whether to keep unlocks after prestige
  }

  description: string
}

/**
 * Currency Types
 */
export enum CurrencyType {
  CREDITS = 'credits', // Main currency
  PREMIUM = 'premium', // Premium currency (real money)
  TOKENS = 'tokens', // Event tokens
  DUST = 'dust' // Crafting material
}

/**
 * Currency Reward
 */
export interface CurrencyReward {
  type: CurrencyType
  amount: number
  source: string
}

// =============================================================================
// XP & LEVELING DATA
// =============================================================================

/**
 * XP Curve Type
 */
export enum XPCurveType {
  LINEAR = 'linear', // Consistent XP per level
  EXPONENTIAL = 'exponential', // Exponentially increasing
  LOGARITHMIC = 'logarithmic', // Slows down at higher levels
  CUSTOM = 'custom' // Custom curve
}

/**
 * Calculate XP Required for Level
 * Formula: baseXP * (level^exponent) + (level * increment)
 */
export function calculateLevelXP(
  level: number,
  baseXP: number = 1000,
  exponent: number = 1.15,
  increment: number = 100
): number {
  if (level === 1) return 0
  return Math.floor(baseXP * Math.pow(level, exponent) + (level * increment))
}

/**
 * Generate Level Data (1-100)
 */
export function generateLevelData(maxLevel: number = 100): LevelData[] {
  const levels: LevelData[] = []
  let totalXP = 0

  for (let level = 1; level <= maxLevel; level++) {
    const xpRequired = calculateLevelXP(level)
    totalXP += xpRequired

    levels.push({
      level,
      xpRequired,
      totalXP,
      rankId: getRankIdForLevel(level),
      rewards: {
        credits: Math.floor(level * 50 + level * level * 5),
        unlocks: getUnlocksForLevel(level)
      }
    })
  }

  return levels
}

/**
 * Get Rank ID for Level
 */
function getRankIdForLevel(level: number): string {
  if (level < 5) return 'recruit'
  if (level < 10) return 'private'
  if (level < 20) return 'corporal'
  if (level < 30) return 'sergeant'
  if (level < 40) return 'lieutenant'
  if (level < 50) return 'captain'
  if (level < 60) return 'major'
  if (level < 80) return 'colonel'
  if (level < 100) return 'general'
  return 'marshal'
}

/**
 * Get Unlocks for Level
 */
function getUnlocksForLevel(level: number): string[] {
  const unlocks: string[] = []

  // Weapons unlock every 5 levels
  if (level % 5 === 0 && level <= 50) {
    unlocks.push(`weapon_tier_${Math.floor(level / 5)}`)
  }

  // Attachments unlock every 3 levels
  if (level % 3 === 0 && level <= 60) {
    unlocks.push(`attachment_tier_${Math.floor(level / 3)}`)
  }

  // Abilities unlock every 10 levels
  if (level % 10 === 0 && level <= 100) {
    unlocks.push(`ability_tier_${Math.floor(level / 10)}`)
  }

  return unlocks
}

// =============================================================================
// RANK DATA
// =============================================================================

/**
 * All Player Ranks (10 Ranks)
 */
export const RANKS: RankData[] = [
  {
    id: 'recruit',
    name: 'Recruit',
    level: 1,
    minXP: 0,
    maxXP: 999,
    color: '#888888',
    icon: '🎖️',
    badgeIcon: 'shield-outline',
    unlocks: {
      weapons: ['glxy_m4a1', 'glxy_pistol'],
      attachments: [],
      abilities: ['sprint'],
      cosmetics: [],
      titles: ['Recruit']
    },
    rewards: {
      credits: 100,
      xp: 0,
      items: []
    },
    privileges: ['Basic weapons', 'Basic movement'],
    description: 'Welcome to GLXY Tactical Operations. Begin your journey here.'
  },
  {
    id: 'private',
    name: 'Private',
    level: 5,
    minXP: 1000,
    maxXP: 4999,
    color: '#CD7F32',
    icon: '⭐',
    badgeIcon: 'star-outline',
    unlocks: {
      weapons: ['glxy_ak47', 'glxy_shotgun'],
      attachments: ['reflex_sight', 'foregrip'],
      abilities: ['slide'],
      cosmetics: ['basic_camo'],
      titles: ['Private', 'Soldier']
    },
    rewards: {
      credits: 250,
      xp: 500,
      items: ['starter_pack']
    },
    privileges: ['Basic attachments', 'Custom loadouts'],
    description: 'You have proven yourself in combat. Continue the fight.'
  },
  {
    id: 'corporal',
    name: 'Corporal',
    level: 10,
    minXP: 5000,
    maxXP: 14999,
    color: '#4682B4',
    icon: '🎖️',
    badgeIcon: 'award',
    unlocks: {
      weapons: ['glxy_sniper', 'glxy_smg'],
      attachments: ['holographic_sight', 'suppressor', 'extended_mag'],
      abilities: ['crouch_boost', 'wall_run'],
      cosmetics: ['digital_camo', 'stripe_pattern'],
      titles: ['Corporal', 'Fighter']
    },
    rewards: {
      credits: 500,
      xp: 1000,
      items: ['tactical_pack']
    },
    privileges: ['Advanced attachments', 'Weapon skins', 'Advanced movement'],
    description: 'A proven fighter with growing tactical expertise.'
  },
  {
    id: 'sergeant',
    name: 'Sergeant',
    level: 20,
    minXP: 15000,
    maxXP: 34999,
    color: '#32CD32',
    icon: '🏅',
    badgeIcon: 'medal',
    unlocks: {
      weapons: ['glxy_lmg', 'glxy_dmr'],
      attachments: ['acog_scope', 'compensator', 'heavy_barrel'],
      abilities: ['double_jump', 'mantle'],
      cosmetics: ['urban_camo', 'forest_camo', 'chrome_finish'],
      titles: ['Sergeant', 'Squad Leader', 'Marksman']
    },
    rewards: {
      credits: 1000,
      xp: 2000,
      items: ['veteran_pack']
    },
    privileges: ['Elite weapons', 'Special equipment', 'Squad leadership'],
    description: 'Leadership qualities are emerging. You command respect.'
  },
  {
    id: 'lieutenant',
    name: 'Lieutenant',
    level: 30,
    minXP: 35000,
    maxXP: 64999,
    color: '#8B4513',
    icon: '🎖️',
    badgeIcon: 'shield-check',
    unlocks: {
      weapons: ['glxy_carbine', 'glxy_battle_rifle'],
      attachments: ['thermal_scope', 'bipod', 'laser_sight'],
      abilities: ['vault', 'glide'],
      cosmetics: ['desert_camo', 'woodland_camo', 'gold_accent'],
      titles: ['Lieutenant', 'Tactician', 'Officer']
    },
    rewards: {
      credits: 2000,
      xp: 3000,
      items: ['elite_pack']
    },
    privileges: ['All weapons', 'Tactical gadgets', 'Advanced perks'],
    description: 'Tactical expert with proven leadership capabilities.'
  },
  {
    id: 'captain',
    name: 'Captain',
    level: 40,
    minXP: 65000,
    maxXP: 114999,
    color: '#DAA520',
    icon: '🌟',
    badgeIcon: 'crown',
    unlocks: {
      weapons: ['glxy_marksman_rifle', 'glxy_heavy_sniper'],
      attachments: ['variable_zoom', 'match_trigger', 'skeleton_stock'],
      abilities: ['power_slide', 'super_jump'],
      cosmetics: ['carbon_fiber', 'titanium', 'platinum'],
      titles: ['Captain', 'Commander', 'Leader']
    },
    rewards: {
      credits: 3500,
      xp: 5000,
      items: ['legendary_pack']
    },
    privileges: ['VIP weapons', 'Custom titles', 'Exclusive content'],
    description: 'Elite tactical operator. Few reach this level.'
  },
  {
    id: 'major',
    name: 'Major',
    level: 50,
    minXP: 115000,
    maxXP: 199999,
    color: '#FF6347',
    icon: '🏆',
    badgeIcon: 'trophy',
    unlocks: {
      weapons: ['glxy_exotic_ar', 'glxy_exotic_sniper'],
      attachments: ['mastercraft_scope', 'elite_barrel', 'pro_stock'],
      abilities: ['blink_dash', 'phase_shift'],
      cosmetics: ['dragon_red', 'phoenix_gold', 'obsidian'],
      titles: ['Major', 'Warrior', 'Champion']
    },
    rewards: {
      credits: 5000,
      xp: 10000,
      items: ['master_pack']
    },
    privileges: ['Master weapons', 'Exclusive cosmetics', 'Prestige access'],
    description: 'Master of warfare. A true champion of GLXY.'
  },
  {
    id: 'colonel',
    name: 'Colonel',
    level: 60,
    minXP: 200000,
    maxXP: 349999,
    color: '#9370DB',
    icon: '👑',
    badgeIcon: 'crown-outline',
    unlocks: {
      weapons: ['glxy_legendary_ar', 'glxy_legendary_sniper'],
      attachments: ['legendary_optics', 'mythic_barrel'],
      abilities: ['time_dilation', 'ghost_mode'],
      cosmetics: ['diamond', 'ruby', 'sapphire'],
      titles: ['Colonel', 'Commander', 'Legend']
    },
    rewards: {
      credits: 10000,
      xp: 20000,
      items: ['legendary_weapons_pack']
    },
    privileges: ['Legendary weapons', 'Unique titles', 'Developer recognition'],
    description: 'Legendary tactical commander. Your name is known.'
  },
  {
    id: 'general',
    name: 'General',
    level: 80,
    minXP: 350000,
    maxXP: 599999,
    color: '#FF4500',
    icon: '🎖️',
    badgeIcon: 'military-tech',
    unlocks: {
      weapons: ['glxy_mythic_weapons'],
      attachments: ['mythic_attachments'],
      abilities: ['ultimate_abilities'],
      cosmetics: ['mythic_skins'],
      titles: ['General', 'Legend', 'Master']
    },
    rewards: {
      credits: 25000,
      xp: 50000,
      items: ['mythic_pack']
    },
    privileges: ['All content', 'Special recognition', 'Beta access'],
    description: 'GLXY Legend. You are among the elite few.'
  },
  {
    id: 'marshal',
    name: 'Marshal',
    level: 100,
    minXP: 600000,
    maxXP: Infinity,
    color: '#FFD700',
    icon: '🌟',
    badgeIcon: 'emoji-events',
    unlocks: {
      weapons: ['glxy_developer_weapons'],
      attachments: ['developer_attachments'],
      abilities: ['developer_abilities'],
      cosmetics: ['cosmic_skins', 'infinite_glory'],
      titles: ['Marshal', 'GLXY Master', 'Supreme Commander']
    },
    rewards: {
      credits: 100000,
      xp: 0,
      items: ['developer_pack', 'ultimate_reward']
    },
    privileges: ['Developer access', 'Special privileges', 'Eternal glory'],
    description: 'Supreme tactical mastery. You have reached the pinnacle.'
  }
]

// =============================================================================
// XP REWARDS DATA
// =============================================================================

/**
 * XP Rewards for Actions
 */
export const XP_REWARDS: XPRewardData[] = [
  {
    source: XPSource.KILL,
    baseXP: 100,
    multipliers: {
      headshot: 1.5,
      longRange: 0.2, // +20% per 10m
      streak: 10 // +10 XP per streak count
    }
  },
  {
    source: XPSource.HEADSHOT_KILL,
    baseXP: 150
  },
  {
    source: XPSource.MELEE_KILL,
    baseXP: 200
  },
  {
    source: XPSource.MULTI_KILL,
    baseXP: 300,
    multipliers: {
      combo: 1.5 // 150% per additional kill
    }
  },
  {
    source: XPSource.STREAK,
    baseXP: 50,
    multipliers: {
      streak: 25 // +25 XP per streak count
    }
  },
  {
    source: XPSource.ASSIST,
    baseXP: 50
  },
  {
    source: XPSource.OBJECTIVE,
    baseXP: 200
  },
  {
    source: XPSource.WIN,
    baseXP: 1000
  },
  {
    source: XPSource.LOSS,
    baseXP: 250
  },
  {
    source: XPSource.DAMAGE,
    baseXP: 1 // 1 XP per 10 damage
  },
  {
    source: XPSource.HEAL,
    baseXP: 1 // 1 XP per 10 healing
  },
  {
    source: XPSource.CHALLENGE_COMPLETE,
    baseXP: 500 // Base, actual from challenge
  },
  {
    source: XPSource.MATCH_TIME,
    baseXP: 10 // 10 XP per minute
  }
]

// =============================================================================
// PRESTIGE DATA
// =============================================================================

/**
 * Prestige Levels (10 Prestige Levels)
 */
export const PRESTIGE_LEVELS: PrestigeData[] = [
  {
    level: 1,
    name: 'Prestige I',
    icon: '⭐',
    color: '#4169E1',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige I',
      badge: 'prestige_1_badge',
      icon: 'prestige_1_icon',
      credits: 10000,
      cosmeticItem: 'prestige_1_skin'
    },
    effects: {
      xpMultiplier: 1.1, // +10% XP
      creditsMultiplier: 1.1, // +10% Credits
      retainUnlocks: true
    },
    description: 'Begin your journey anew with enhanced rewards.'
  },
  {
    level: 2,
    name: 'Prestige II',
    icon: '⭐⭐',
    color: '#32CD32',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige II',
      badge: 'prestige_2_badge',
      icon: 'prestige_2_icon',
      credits: 20000,
      cosmeticItem: 'prestige_2_skin'
    },
    effects: {
      xpMultiplier: 1.2, // +20% XP
      creditsMultiplier: 1.2,
      retainUnlocks: true
    },
    description: 'Your dedication is unmatched. Greater rewards await.'
  },
  {
    level: 3,
    name: 'Prestige III',
    icon: '⭐⭐⭐',
    color: '#FF8C00',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige III',
      badge: 'prestige_3_badge',
      icon: 'prestige_3_icon',
      credits: 30000,
      cosmeticItem: 'prestige_3_skin'
    },
    effects: {
      xpMultiplier: 1.3, // +30% XP
      creditsMultiplier: 1.3,
      retainUnlocks: true
    },
    description: 'Elite status achieved. Your legend grows.'
  },
  {
    level: 4,
    name: 'Prestige IV',
    icon: '🌟',
    color: '#9370DB',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige IV',
      badge: 'prestige_4_badge',
      icon: 'prestige_4_icon',
      credits: 40000,
      cosmeticItem: 'prestige_4_skin'
    },
    effects: {
      xpMultiplier: 1.4, // +40% XP
      creditsMultiplier: 1.4,
      retainUnlocks: true
    },
    description: 'Master level reached. Few can match your skill.'
  },
  {
    level: 5,
    name: 'Prestige V',
    icon: '🌟🌟',
    color: '#FF1493',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige V',
      badge: 'prestige_5_badge',
      icon: 'prestige_5_icon',
      credits: 50000,
      cosmeticItem: 'prestige_5_skin'
    },
    effects: {
      xpMultiplier: 1.5, // +50% XP
      creditsMultiplier: 1.5,
      retainUnlocks: true
    },
    description: 'Legendary status. Your name echoes through GLXY.'
  },
  {
    level: 6,
    name: 'Prestige VI',
    icon: '💎',
    color: '#00CED1',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige VI - Diamond',
      badge: 'prestige_6_badge',
      icon: 'prestige_6_icon',
      credits: 75000,
      cosmeticItem: 'diamond_skin'
    },
    effects: {
      xpMultiplier: 1.75, // +75% XP
      creditsMultiplier: 1.75,
      retainUnlocks: true
    },
    description: 'Diamond tier. Unbreakable dedication.'
  },
  {
    level: 7,
    name: 'Prestige VII',
    icon: '👑',
    color: '#FFD700',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige VII - Crown',
      badge: 'prestige_7_badge',
      icon: 'prestige_7_icon',
      credits: 100000,
      cosmeticItem: 'crown_skin'
    },
    effects: {
      xpMultiplier: 2.0, // +100% XP (2x)
      creditsMultiplier: 2.0,
      retainUnlocks: true
    },
    description: 'Crowned champion. You reign supreme.'
  },
  {
    level: 8,
    name: 'Prestige VIII',
    icon: '🔥',
    color: '#FF4500',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige VIII - Phoenix',
      badge: 'prestige_8_badge',
      icon: 'prestige_8_icon',
      credits: 150000,
      cosmeticItem: 'phoenix_skin'
    },
    effects: {
      xpMultiplier: 2.5, // +150% XP (2.5x)
      creditsMultiplier: 2.5,
      retainUnlocks: true
    },
    description: 'Phoenix tier. Reborn from the ashes, stronger than ever.'
  },
  {
    level: 9,
    name: 'Prestige IX',
    icon: '🌌',
    color: '#9400D3',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige IX - Cosmic',
      badge: 'prestige_9_badge',
      icon: 'prestige_9_icon',
      credits: 250000,
      cosmeticItem: 'cosmic_skin'
    },
    effects: {
      xpMultiplier: 3.0, // +200% XP (3x)
      creditsMultiplier: 3.0,
      retainUnlocks: true
    },
    description: 'Cosmic level. You transcend mortal limits.'
  },
  {
    level: 10,
    name: 'Prestige X',
    icon: '♾️',
    color: '#FFFFFF',
    requiredLevel: 100,
    requiredXP: 600000,
    rewards: {
      title: 'Prestige X - Infinite',
      badge: 'prestige_max_badge',
      icon: 'prestige_max_icon',
      credits: 500000,
      cosmeticItem: 'infinite_skin'
    },
    effects: {
      xpMultiplier: 5.0, // +400% XP (5x)
      creditsMultiplier: 5.0,
      retainUnlocks: true
    },
    description: 'INFINITE. Maximum prestige reached. You are eternal.'
  }
]

// =============================================================================
// UNLOCKABLE ITEMS
// =============================================================================

/**
 * Sample Unlockable Weapons
 */
export const UNLOCKABLE_WEAPONS: UnlockableItem[] = [
  {
    id: 'glxy_m4a1',
    name: 'M4A1',
    category: 'weapon',
    rarity: 'common',
    requirement: { type: 'level', value: 1, description: 'Available at Level 1' },
    isUnlocked: true
  },
  {
    id: 'glxy_ak47',
    name: 'AK-47',
    category: 'weapon',
    rarity: 'common',
    requirement: { type: 'level', value: 5, description: 'Reach Level 5' },
    isUnlocked: false
  },
  {
    id: 'glxy_sniper',
    name: 'Sniper Rifle',
    category: 'weapon',
    rarity: 'uncommon',
    requirement: { type: 'level', value: 10, description: 'Reach Level 10' },
    isUnlocked: false
  },
  {
    id: 'glxy_lmg',
    name: 'LMG',
    category: 'weapon',
    rarity: 'rare',
    requirement: { type: 'level', value: 20, description: 'Reach Level 20' },
    isUnlocked: false
  },
  {
    id: 'glxy_exotic_ar',
    name: 'Exotic AR',
    category: 'weapon',
    rarity: 'epic',
    requirement: { type: 'level', value: 50, description: 'Reach Level 50' },
    isUnlocked: false
  },
  {
    id: 'glxy_legendary_sniper',
    name: 'Legendary Sniper',
    category: 'weapon',
    rarity: 'legendary',
    requirement: { type: 'level', value: 60, description: 'Reach Level 60' },
    isUnlocked: false
  },
  {
    id: 'glxy_mythic_ar',
    name: 'Mythic AR',
    category: 'weapon',
    rarity: 'mythic',
    requirement: { type: 'level', value: 80, description: 'Reach Level 80' },
    isUnlocked: false
  }
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get Rank by Level
 */
export function getRankByLevel(level: number): RankData {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].level) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}

/**
 * Get Rank by XP
 */
export function getRankByXP(xp: number): RankData {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}

/**
 * Get XP Reward for Action
 */
export function getXPReward(source: XPSource, multipliers?: Record<string, number>): number {
  const rewardData = XP_REWARDS.find(r => r.source === source)
  if (!rewardData) return 0

  let xp = rewardData.baseXP

  // Apply multipliers
  if (multipliers && rewardData.multipliers) {
    for (const [key, value] of Object.entries(multipliers)) {
      if (rewardData.multipliers[key as keyof typeof rewardData.multipliers]) {
        const mult = rewardData.multipliers[key as keyof typeof rewardData.multipliers]
        if (typeof mult === 'number') {
          xp += mult * value
        }
      }
    }
  }

  return Math.floor(xp)
}

/**
 * Calculate Level from XP
 */
export function calculateLevelFromXP(xp: number, levels: LevelData[]): number {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].totalXP) {
      return levels[i].level
    }
  }
  return 1
}

/**
 * Calculate XP to Next Level
 */
export function calculateXPToNextLevel(currentXP: number, levels: LevelData[]): number {
  const currentLevel = calculateLevelFromXP(currentXP, levels)
  const nextLevel = Math.min(currentLevel + 1, levels.length)
  const nextLevelData = levels.find(l => l.level === nextLevel)

  if (!nextLevelData) return 0
  return nextLevelData.totalXP - currentXP
}

/**
 * Get Prestige Level by Number
 */
export function getPrestigeLevel(prestigeLevel: number): PrestigeData | undefined {
  return PRESTIGE_LEVELS.find(p => p.level === prestigeLevel)
}

/**
 * Check if Item is Unlocked
 */
export function isItemUnlocked(item: UnlockableItem, playerLevel: number, playerXP: number): boolean {
  const { requirement } = item

  switch (requirement.type) {
    case 'level':
      return playerLevel >= Number(requirement.value)
    case 'xp':
      return playerXP >= Number(requirement.value)
    case 'rank':
      const rankData = RANKS.find(r => r.id === requirement.value)
      return rankData ? playerLevel >= rankData.level : false
    default:
      return false
  }
}

/**
 * Format XP Number
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`
  }
  return xp.toString()
}

/**
 * Format Credits Number
 */
export function formatCredits(credits: number): string {
  return formatXP(credits) // Same format
}
