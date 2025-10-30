/**
 * GLXY Ultimate FPS - Challenges & Achievements Data
 *
 * Professional achievement and challenge system data
 * Defines all achievements, challenges, and rewards
 *
 * @module ChallengesData
 * @category Data
 * @see GLXYProgressionSystem.tsx for the legacy implementation
 *
 * Architecture: Data-Driven Design
 * Pattern: ScriptableObject-style (Unity-inspired)
 *
 * Phase 7: Progression System Complete
 */

/**
 * Challenge/Achievement Requirement Types
 */
export enum RequirementType {
  KILLS = 'kills',
  HEADSHOTS = 'headshots',
  DEATHS = 'deaths',
  ASSISTS = 'assists',
  WINS = 'wins',
  LOSSES = 'losses',
  MATCHES = 'matches',
  KDR = 'kdr',
  ACCURACY = 'accuracy',
  DAMAGE = 'damage',
  HEAL = 'heal',
  OBJECTIVES = 'objectives',
  PLAYTIME = 'playtime',
  STREAK = 'streak',
  MULTI_KILL = 'multi_kill',
  MELEE_KILL = 'melee_kill',
  EXPLOSION_KILL = 'explosion_kill',
  FIRST_BLOOD = 'first_blood',
  LAST_MAN_STANDING = 'last_man_standing',
  CLUTCH = 'clutch',
  WEAPON_MASTER = 'weapon_master',
  CLASS_SPECIALIST = 'class_specialist',
  MODE_VETERAN = 'mode_veteran',
  DISTANCE = 'distance',
  COMBO = 'combo',
  CONSECUTIVE = 'consecutive',
  CUSTOM = 'custom'
}

/**
 * Challenge/Achievement Requirement
 */
export interface ChallengeRequirement {
  type: RequirementType
  value: number
  description?: string

  // Specific conditions
  weapon?: string
  weaponType?: string
  class?: string
  mode?: string
  map?: string
  timeframe?: 'match' | 'session' | 'day' | 'week' | 'season' | 'lifetime'
  operator?: 'and' | 'or'

  // Progression tracking
  currentValue?: number
  isCompleted?: boolean
}

/**
 * Achievement Category
 */
export enum AchievementCategory {
  COMBAT = 'combat',
  TACTICAL = 'tactical',
  TEAMWORK = 'teamwork',
  SURVIVAL = 'survival',
  SPECIALIST = 'specialist',
  MILESTONE = 'milestone',
  SEASONAL = 'seasonal',
  HIDDEN = 'hidden',
  MASTERY = 'mastery'
}

/**
 * Rarity Levels
 */
export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

/**
 * Achievement Rewards
 */
export interface AchievementRewards {
  xp: number
  credits: number
  cosmetics: string[]
  titles: string[]
  badges: string[]
  weapons?: string[]
  attachments?: string[]
}

/**
 * Achievement Data
 */
export interface AchievementData {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: Rarity
  icon: string
  isHidden: boolean

  // Requirements
  requirements: ChallengeRequirement[]

  // Rewards
  rewards: AchievementRewards

  // Progression
  progress: number
  maxProgress: number
  isCompleted: boolean
  completedDate?: Date

  // Display
  color?: string
  glowEffect?: boolean
}

/**
 * Challenge Type
 */
export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SEASONAL = 'seasonal',
  EVENT = 'event',
  LIMITED_TIME = 'limited_time'
}

/**
 * Challenge Data
 */
export interface ChallengeData {
  id: string
  name: string
  description: string
  type: ChallengeType
  category: AchievementCategory

  // Active period
  isActive: boolean
  startDate: Date
  endDate: Date

  // Requirements
  requirements: ChallengeRequirement[]

  // Rewards
  rewards: {
    xp: number
    credits: number
    cosmetics: string[]
    badges?: string[]
  }

  // Progression
  progress: number
  maxProgress: number
  isCompleted: boolean
  timesCompleted: number // For repeatable challenges

  // Display
  icon: string
  color?: string
  priority: number // Higher = shown first
}

// =============================================================================
// COMBAT ACHIEVEMENTS
// =============================================================================

/**
 * Combat Achievements (15 achievements)
 */
export const COMBAT_ACHIEVEMENTS: AchievementData[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Get your first kill',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.COMMON,
    icon: '🩸',
    isHidden: false,
    requirements: [
      { type: RequirementType.KILLS, value: 1, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 100,
      credits: 50,
      cosmetics: [],
      titles: ['First Blood'],
      badges: ['first_blood_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    color: '#FF4444'
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Get 100 headshots',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.UNCOMMON,
    icon: '🎯',
    isHidden: false,
    requirements: [
      { type: RequirementType.HEADSHOTS, value: 100, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 500,
      credits: 250,
      cosmetics: [],
      titles: ['Sharpshooter'],
      badges: ['sharpshooter_badge']
    },
    progress: 0,
    maxProgress: 100,
    isCompleted: false,
    color: '#FFA500'
  },
  {
    id: 'headhunter',
    name: 'Headhunter',
    description: 'Get 500 headshots',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.RARE,
    icon: '🎯',
    isHidden: false,
    requirements: [
      { type: RequirementType.HEADSHOTS, value: 500, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 2000,
      credits: 1000,
      cosmetics: ['precision_camo'],
      titles: ['Headhunter'],
      badges: ['headhunter_badge']
    },
    progress: 0,
    maxProgress: 500,
    isCompleted: false,
    color: '#8B4513'
  },
  {
    id: 'exterminator',
    name: 'Exterminator',
    description: 'Get 1,000 kills',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.RARE,
    icon: '💀',
    isHidden: false,
    requirements: [
      { type: RequirementType.KILLS, value: 1000, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 3000,
      credits: 1500,
      cosmetics: [],
      titles: ['Exterminator'],
      badges: ['exterminator_badge']
    },
    progress: 0,
    maxProgress: 1000,
    isCompleted: false,
    color: '#8B0000'
  },
  {
    id: 'death_dealer',
    name: 'Death Dealer',
    description: 'Get 10,000 kills',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.EPIC,
    icon: '☠️',
    isHidden: false,
    requirements: [
      { type: RequirementType.KILLS, value: 10000, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 10000,
      credits: 5000,
      cosmetics: ['death_dealer_skin'],
      titles: ['Death Dealer', 'Reaper'],
      badges: ['death_dealer_badge']
    },
    progress: 0,
    maxProgress: 10000,
    isCompleted: false,
    color: '#4B0082',
    glowEffect: true
  },
  {
    id: 'killing_spree',
    name: 'Killing Spree',
    description: 'Get a 10 kill streak',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.UNCOMMON,
    icon: '🔥',
    isHidden: false,
    requirements: [
      { type: RequirementType.STREAK, value: 10, timeframe: 'match' }
    ],
    rewards: {
      xp: 750,
      credits: 375,
      cosmetics: [],
      titles: ['On Fire'],
      badges: ['streak_10_badge']
    },
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    color: '#FF6347'
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Get a 25 kill streak',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.EPIC,
    icon: '⚡',
    isHidden: false,
    requirements: [
      { type: RequirementType.STREAK, value: 25, timeframe: 'match' }
    ],
    rewards: {
      xp: 3000,
      credits: 1500,
      cosmetics: ['unstoppable_trail'],
      titles: ['Unstoppable'],
      badges: ['streak_25_badge']
    },
    progress: 0,
    maxProgress: 25,
    isCompleted: false,
    color: '#FFD700',
    glowEffect: true
  },
  {
    id: 'god_mode',
    name: 'God Mode',
    description: 'Get a 50 kill streak',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.LEGENDARY,
    icon: '👑',
    isHidden: false,
    requirements: [
      { type: RequirementType.STREAK, value: 50, timeframe: 'match' }
    ],
    rewards: {
      xp: 10000,
      credits: 5000,
      cosmetics: ['god_mode_aura'],
      titles: ['God Mode', 'Immortal'],
      badges: ['god_mode_badge']
    },
    progress: 0,
    maxProgress: 50,
    isCompleted: false,
    color: '#FF00FF',
    glowEffect: true
  },
  {
    id: 'double_kill',
    name: 'Double Kill',
    description: 'Get a double kill',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.COMMON,
    icon: '✌️',
    isHidden: false,
    requirements: [
      { type: RequirementType.MULTI_KILL, value: 2, timeframe: 'match' }
    ],
    rewards: {
      xp: 200,
      credits: 100,
      cosmetics: [],
      titles: [],
      badges: []
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false
  },
  {
    id: 'triple_kill',
    name: 'Triple Kill',
    description: 'Get a triple kill',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.UNCOMMON,
    icon: '🔫',
    isHidden: false,
    requirements: [
      { type: RequirementType.MULTI_KILL, value: 3, timeframe: 'match' }
    ],
    rewards: {
      xp: 400,
      credits: 200,
      cosmetics: [],
      titles: ['Triple Threat'],
      badges: []
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false
  },
  {
    id: 'quad_kill',
    name: 'Quad Kill',
    description: 'Get a quad kill',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.RARE,
    icon: '💥',
    isHidden: false,
    requirements: [
      { type: RequirementType.MULTI_KILL, value: 4, timeframe: 'match' }
    ],
    rewards: {
      xp: 800,
      credits: 400,
      cosmetics: [],
      titles: ['Quad Master'],
      badges: ['quad_kill_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false
  },
  {
    id: 'team_wipe',
    name: 'Team Wipe',
    description: 'Get a team wipe (5+ kills)',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.EPIC,
    icon: '💣',
    isHidden: false,
    requirements: [
      { type: RequirementType.MULTI_KILL, value: 5, timeframe: 'match' }
    ],
    rewards: {
      xp: 1500,
      credits: 750,
      cosmetics: ['team_wipe_emblem'],
      titles: ['Team Wiper'],
      badges: ['team_wipe_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'longshot',
    name: 'Longshot',
    description: 'Get a kill from 100+ meters',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.UNCOMMON,
    icon: '🎯',
    isHidden: false,
    requirements: [
      { type: RequirementType.DISTANCE, value: 100, timeframe: 'match', description: 'Kill from 100m+' }
    ],
    rewards: {
      xp: 500,
      credits: 250,
      cosmetics: [],
      titles: ['Sniper'],
      badges: []
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false
  },
  {
    id: 'across_the_map',
    name: 'Across the Map',
    description: 'Get a kill from 250+ meters',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.LEGENDARY,
    icon: '🌟',
    isHidden: false,
    requirements: [
      { type: RequirementType.DISTANCE, value: 250, timeframe: 'match', description: 'Kill from 250m+' }
    ],
    rewards: {
      xp: 5000,
      credits: 2500,
      cosmetics: ['legendary_sniper_camo'],
      titles: ['Long Distance', 'Deadeye'],
      badges: ['across_map_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'melee_master',
    name: 'Melee Master',
    description: 'Get 100 melee kills',
    category: AchievementCategory.COMBAT,
    rarity: Rarity.RARE,
    icon: '🔪',
    isHidden: false,
    requirements: [
      { type: RequirementType.MELEE_KILL, value: 100, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 2000,
      credits: 1000,
      cosmetics: ['melee_master_knife'],
      titles: ['Melee Master', 'Blade'],
      badges: ['melee_master_badge']
    },
    progress: 0,
    maxProgress: 100,
    isCompleted: false
  }
]

// =============================================================================
// TACTICAL ACHIEVEMENTS
// =============================================================================

/**
 * Tactical Achievements (10 achievements)
 */
export const TACTICAL_ACHIEVEMENTS: AchievementData[] = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first match',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.COMMON,
    icon: '🏆',
    isHidden: false,
    requirements: [
      { type: RequirementType.WINS, value: 1, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 200,
      credits: 100,
      cosmetics: [],
      titles: ['Winner'],
      badges: ['first_win_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Win 100 matches',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.RARE,
    icon: '🏅',
    isHidden: false,
    requirements: [
      { type: RequirementType.WINS, value: 100, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 5000,
      credits: 2500,
      cosmetics: ['champion_skin'],
      titles: ['Champion'],
      badges: ['champion_badge']
    },
    progress: 0,
    maxProgress: 100,
    isCompleted: false
  },
  {
    id: 'flawless_victory',
    name: 'Flawless Victory',
    description: 'Win a match without dying',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.EPIC,
    icon: '💎',
    isHidden: false,
    requirements: [
      { type: RequirementType.WINS, value: 1, timeframe: 'match' },
      { type: RequirementType.DEATHS, value: 0, timeframe: 'match', operator: 'and' }
    ],
    rewards: {
      xp: 3000,
      credits: 1500,
      cosmetics: ['flawless_emblem'],
      titles: ['Flawless'],
      badges: ['flawless_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'objective_master',
    name: 'Objective Master',
    description: 'Capture 500 objectives',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.RARE,
    icon: '🎯',
    isHidden: false,
    requirements: [
      { type: RequirementType.OBJECTIVES, value: 500, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 2500,
      credits: 1250,
      cosmetics: [],
      titles: ['Objective Master'],
      badges: ['objective_master_badge']
    },
    progress: 0,
    maxProgress: 500,
    isCompleted: false
  },
  {
    id: 'clutch_master',
    name: 'Clutch Master',
    description: 'Win 1v3+ clutch situations 25 times',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.LEGENDARY,
    icon: '⚡',
    isHidden: false,
    requirements: [
      { type: RequirementType.CLUTCH, value: 25, timeframe: 'lifetime', description: '1v3+ clutches' }
    ],
    rewards: {
      xp: 7500,
      credits: 3750,
      cosmetics: ['clutch_master_skin'],
      titles: ['Clutch King', 'Ice Cold'],
      badges: ['clutch_master_badge']
    },
    progress: 0,
    maxProgress: 25,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'first_blood_hunter',
    name: 'First Blood Hunter',
    description: 'Get first blood in 50 matches',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.UNCOMMON,
    icon: '🩸',
    isHidden: false,
    requirements: [
      { type: RequirementType.FIRST_BLOOD, value: 50, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 1500,
      credits: 750,
      cosmetics: [],
      titles: ['First Blood Hunter'],
      badges: []
    },
    progress: 0,
    maxProgress: 50,
    isCompleted: false
  },
  {
    id: 'last_stand',
    name: 'Last Stand',
    description: 'Be the last player alive and win 10 times',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.EPIC,
    icon: '🛡️',
    isHidden: false,
    requirements: [
      { type: RequirementType.LAST_MAN_STANDING, value: 10, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 4000,
      credits: 2000,
      cosmetics: ['last_stand_badge_icon'],
      titles: ['Last Stand', 'Survivor'],
      badges: ['last_stand_badge']
    },
    progress: 0,
    maxProgress: 10,
    isCompleted: false
  },
  {
    id: 'high_accuracy',
    name: 'Precision Expert',
    description: 'Maintain 80% accuracy over 100 matches',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.LEGENDARY,
    icon: '🎯',
    isHidden: false,
    requirements: [
      { type: RequirementType.ACCURACY, value: 80, timeframe: 'lifetime', description: '80%+ accuracy' },
      { type: RequirementType.MATCHES, value: 100, timeframe: 'lifetime', operator: 'and' }
    ],
    rewards: {
      xp: 10000,
      credits: 5000,
      cosmetics: ['precision_expert_skin'],
      titles: ['Precision Expert', 'Marksman'],
      badges: ['precision_badge']
    },
    progress: 0,
    maxProgress: 100,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'tactical_genius',
    name: 'Tactical Genius',
    description: 'Win 50 matches with 5+ K/D ratio',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.EPIC,
    icon: '🧠',
    isHidden: false,
    requirements: [
      { type: RequirementType.WINS, value: 50, timeframe: 'lifetime' },
      { type: RequirementType.KDR, value: 5, timeframe: 'match', operator: 'and' }
    ],
    rewards: {
      xp: 5000,
      credits: 2500,
      cosmetics: [],
      titles: ['Tactical Genius', 'Mastermind'],
      badges: ['tactical_genius_badge']
    },
    progress: 0,
    maxProgress: 50,
    isCompleted: false
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Win 20 matches after being down 0-5',
    category: AchievementCategory.TACTICAL,
    rarity: Rarity.LEGENDARY,
    icon: '🔄',
    isHidden: false,
    requirements: [
      { type: RequirementType.CUSTOM, value: 20, timeframe: 'lifetime', description: 'Comeback from 0-5 deficit' }
    ],
    rewards: {
      xp: 8000,
      credits: 4000,
      cosmetics: ['comeback_king_skin'],
      titles: ['Comeback King', 'Never Give Up'],
      badges: ['comeback_king_badge']
    },
    progress: 0,
    maxProgress: 20,
    isCompleted: false,
    glowEffect: true
  }
]

// =============================================================================
// SPECIALIST ACHIEVEMENTS
// =============================================================================

/**
 * Specialist Achievements (5 achievements)
 */
export const SPECIALIST_ACHIEVEMENTS: AchievementData[] = [
  {
    id: 'weapon_master',
    name: 'Weapon Master',
    description: 'Get 100 kills with every weapon type',
    category: AchievementCategory.SPECIALIST,
    rarity: Rarity.EPIC,
    icon: '🔫',
    isHidden: false,
    requirements: [
      { type: RequirementType.WEAPON_MASTER, value: 100, timeframe: 'lifetime', description: '100 kills per weapon' }
    ],
    rewards: {
      xp: 10000,
      credits: 5000,
      cosmetics: ['weapon_master_skin'],
      titles: ['Weapon Master', 'Arsenal'],
      badges: ['weapon_master_badge']
    },
    progress: 0,
    maxProgress: 100,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'class_specialist',
    name: 'Class Specialist',
    description: 'Win 50 matches with each class',
    category: AchievementCategory.SPECIALIST,
    rarity: Rarity.RARE,
    icon: '🎖️',
    isHidden: false,
    requirements: [
      { type: RequirementType.CLASS_SPECIALIST, value: 50, timeframe: 'lifetime', description: '50 wins per class' }
    ],
    rewards: {
      xp: 5000,
      credits: 2500,
      cosmetics: [],
      titles: ['Class Specialist', 'Versatile'],
      badges: ['class_specialist_badge']
    },
    progress: 0,
    maxProgress: 50,
    isCompleted: false
  },
  {
    id: 'mode_veteran',
    name: 'Mode Veteran',
    description: 'Win 25 matches in each game mode',
    category: AchievementCategory.SPECIALIST,
    rarity: Rarity.RARE,
    icon: '🏅',
    isHidden: false,
    requirements: [
      { type: RequirementType.MODE_VETERAN, value: 25, timeframe: 'lifetime', description: '25 wins per mode' }
    ],
    rewards: {
      xp: 4000,
      credits: 2000,
      cosmetics: [],
      titles: ['Mode Veteran', 'All-Rounder'],
      badges: ['mode_veteran_badge']
    },
    progress: 0,
    maxProgress: 25,
    isCompleted: false
  },
  {
    id: 'sniper_elite',
    name: 'Sniper Elite',
    description: 'Get 500 headshots with sniper rifles',
    category: AchievementCategory.SPECIALIST,
    rarity: Rarity.EPIC,
    icon: '🎯',
    isHidden: false,
    requirements: [
      { type: RequirementType.HEADSHOTS, value: 500, timeframe: 'lifetime', weaponType: 'sniper' }
    ],
    rewards: {
      xp: 5000,
      credits: 2500,
      cosmetics: ['sniper_elite_camo'],
      titles: ['Sniper Elite', 'Deadeye'],
      badges: ['sniper_elite_badge']
    },
    progress: 0,
    maxProgress: 500,
    isCompleted: false
  },
  {
    id: 'explosives_expert',
    name: 'Explosives Expert',
    description: 'Get 250 explosion kills',
    category: AchievementCategory.SPECIALIST,
    rarity: Rarity.RARE,
    icon: '💣',
    isHidden: false,
    requirements: [
      { type: RequirementType.EXPLOSION_KILL, value: 250, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 3000,
      credits: 1500,
      cosmetics: [],
      titles: ['Explosives Expert', 'Demolitionist'],
      badges: ['explosives_expert_badge']
    },
    progress: 0,
    maxProgress: 250,
    isCompleted: false
  }
]

// =============================================================================
// MILESTONE ACHIEVEMENTS
// =============================================================================

/**
 * Milestone Achievements (5 achievements)
 */
export const MILESTONE_ACHIEVEMENTS: AchievementData[] = [
  {
    id: 'rookie',
    name: 'Rookie',
    description: 'Play 10 matches',
    category: AchievementCategory.MILESTONE,
    rarity: Rarity.COMMON,
    icon: '🎮',
    isHidden: false,
    requirements: [
      { type: RequirementType.MATCHES, value: 10, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 500,
      credits: 250,
      cosmetics: [],
      titles: ['Rookie'],
      badges: []
    },
    progress: 0,
    maxProgress: 10,
    isCompleted: false
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Play 100 matches',
    category: AchievementCategory.MILESTONE,
    rarity: Rarity.UNCOMMON,
    icon: '⏰',
    isHidden: false,
    requirements: [
      { type: RequirementType.MATCHES, value: 100, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 2000,
      credits: 1000,
      cosmetics: [],
      titles: ['Veteran'],
      badges: ['veteran_badge']
    },
    progress: 0,
    maxProgress: 100,
    isCompleted: false
  },
  {
    id: 'grizzled_veteran',
    name: 'Grizzled Veteran',
    description: 'Play 1,000 matches',
    category: AchievementCategory.MILESTONE,
    rarity: Rarity.EPIC,
    icon: '🎖️',
    isHidden: false,
    requirements: [
      { type: RequirementType.MATCHES, value: 1000, timeframe: 'lifetime' }
    ],
    rewards: {
      xp: 10000,
      credits: 5000,
      cosmetics: ['grizzled_veteran_skin'],
      titles: ['Grizzled Veteran', 'Old Guard'],
      badges: ['grizzled_veteran_badge']
    },
    progress: 0,
    maxProgress: 1000,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'time_served',
    name: 'Time Served',
    description: 'Play for 100 hours',
    category: AchievementCategory.MILESTONE,
    rarity: Rarity.RARE,
    icon: '⏳',
    isHidden: false,
    requirements: [
      { type: RequirementType.PLAYTIME, value: 6000, timeframe: 'lifetime', description: '100 hours' }
    ],
    rewards: {
      xp: 5000,
      credits: 2500,
      cosmetics: [],
      titles: ['Time Served', 'Dedicated'],
      badges: ['time_served_badge']
    },
    progress: 0,
    maxProgress: 6000,
    isCompleted: false
  },
  {
    id: 'no_life',
    name: 'Dedicated',
    description: 'Play for 1,000 hours',
    category: AchievementCategory.MILESTONE,
    rarity: Rarity.LEGENDARY,
    icon: '♾️',
    isHidden: false,
    requirements: [
      { type: RequirementType.PLAYTIME, value: 60000, timeframe: 'lifetime', description: '1000 hours' }
    ],
    rewards: {
      xp: 50000,
      credits: 25000,
      cosmetics: ['dedication_skin'],
      titles: ['Dedicated', 'No Life', 'GLXY Addict'],
      badges: ['dedication_badge']
    },
    progress: 0,
    maxProgress: 60000,
    isCompleted: false,
    glowEffect: true
  }
]

// =============================================================================
// HIDDEN ACHIEVEMENTS
// =============================================================================

/**
 * Hidden Achievements (5 achievements)
 */
export const HIDDEN_ACHIEVEMENTS: AchievementData[] = [
  {
    id: 'ninja',
    name: 'Ninja',
    description: '???',
    category: AchievementCategory.HIDDEN,
    rarity: Rarity.LEGENDARY,
    icon: '🥷',
    isHidden: true,
    requirements: [
      { type: RequirementType.CUSTOM, value: 10, timeframe: 'match', description: '10 undetected kills in one match' }
    ],
    rewards: {
      xp: 5000,
      credits: 2500,
      cosmetics: ['ninja_suit'],
      titles: ['Ninja', 'Silent Assassin'],
      badges: ['ninja_badge']
    },
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: '???',
    category: AchievementCategory.HIDDEN,
    rarity: Rarity.MYTHIC,
    icon: '💎',
    isHidden: true,
    requirements: [
      { type: RequirementType.CUSTOM, value: 1, timeframe: 'match', description: 'Win with 30+ kills, 0 deaths, 100% accuracy' }
    ],
    rewards: {
      xp: 25000,
      credits: 12500,
      cosmetics: ['perfect_game_skin'],
      titles: ['Perfect', 'Perfection'],
      badges: ['perfect_game_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    glowEffect: true,
    color: '#FF1493'
  },
  {
    id: 'david_vs_goliath',
    name: 'David vs Goliath',
    description: '???',
    category: AchievementCategory.HIDDEN,
    rarity: Rarity.LEGENDARY,
    icon: '🎯',
    isHidden: true,
    requirements: [
      { type: RequirementType.CUSTOM, value: 1, timeframe: 'match', description: 'Win 1v5 clutch' }
    ],
    rewards: {
      xp: 10000,
      credits: 5000,
      cosmetics: [],
      titles: ['David', 'Giant Slayer'],
      badges: ['david_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    glowEffect: true
  },
  {
    id: 'ghost',
    name: 'Ghost',
    description: '???',
    category: AchievementCategory.HIDDEN,
    rarity: Rarity.EPIC,
    icon: '👻',
    isHidden: true,
    requirements: [
      { type: RequirementType.CUSTOM, value: 1, timeframe: 'match', description: 'Complete match without being seen by enemies' }
    ],
    rewards: {
      xp: 4000,
      credits: 2000,
      cosmetics: ['ghost_camo'],
      titles: ['Ghost'],
      badges: ['ghost_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false
  },
  {
    id: 'overkill',
    name: 'Overkill',
    description: '???',
    category: AchievementCategory.HIDDEN,
    rarity: Rarity.EPIC,
    icon: '💥',
    isHidden: true,
    requirements: [
      { type: RequirementType.CUSTOM, value: 1, timeframe: 'match', description: 'Get 100+ kills in single match' }
    ],
    rewards: {
      xp: 7500,
      credits: 3750,
      cosmetics: [],
      titles: ['Overkill', 'Unstoppable Force'],
      badges: ['overkill_badge']
    },
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    glowEffect: true
  }
]

// =============================================================================
// ALL ACHIEVEMENTS
// =============================================================================

/**
 * All Achievements Combined
 */
export const ALL_ACHIEVEMENTS: AchievementData[] = [
  ...COMBAT_ACHIEVEMENTS,
  ...TACTICAL_ACHIEVEMENTS,
  ...SPECIALIST_ACHIEVEMENTS,
  ...MILESTONE_ACHIEVEMENTS,
  ...HIDDEN_ACHIEVEMENTS
]

// =============================================================================
// CHALLENGES
// =============================================================================

/**
 * Daily Challenges (5 challenges)
 */
export const DAILY_CHALLENGES: ChallengeData[] = [
  {
    id: 'daily_kills_10',
    name: 'Daily Hunter',
    description: 'Get 10 kills today',
    type: ChallengeType.DAILY,
    category: AchievementCategory.COMBAT,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.KILLS, value: 10, timeframe: 'day' }
    ],
    rewards: {
      xp: 250,
      credits: 125,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🎯',
    priority: 1
  },
  {
    id: 'daily_headshots_5',
    name: 'Daily Marksman',
    description: 'Get 5 headshots today',
    type: ChallengeType.DAILY,
    category: AchievementCategory.COMBAT,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.HEADSHOTS, value: 5, timeframe: 'day' }
    ],
    rewards: {
      xp: 300,
      credits: 150,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🎯',
    priority: 2
  },
  {
    id: 'daily_wins_3',
    name: 'Daily Winner',
    description: 'Win 3 matches today',
    type: ChallengeType.DAILY,
    category: AchievementCategory.TACTICAL,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.WINS, value: 3, timeframe: 'day' }
    ],
    rewards: {
      xp: 500,
      credits: 250,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🏆',
    priority: 3
  },
  {
    id: 'daily_objectives_5',
    name: 'Daily Objective',
    description: 'Capture 5 objectives today',
    type: ChallengeType.DAILY,
    category: AchievementCategory.TACTICAL,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.OBJECTIVES, value: 5, timeframe: 'day' }
    ],
    rewards: {
      xp: 350,
      credits: 175,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🎯',
    priority: 4
  },
  {
    id: 'daily_playtime',
    name: 'Daily Grind',
    description: 'Play for 1 hour today',
    type: ChallengeType.DAILY,
    category: AchievementCategory.MILESTONE,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.PLAYTIME, value: 60, timeframe: 'day' }
    ],
    rewards: {
      xp: 200,
      credits: 100,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 60,
    isCompleted: false,
    timesCompleted: 0,
    icon: '⏰',
    priority: 5
  }
]

/**
 * Weekly Challenges (5 challenges)
 */
export const WEEKLY_CHALLENGES: ChallengeData[] = [
  {
    id: 'weekly_damage_10000',
    name: 'Damage Dealer',
    description: 'Deal 10,000 damage this week',
    type: ChallengeType.WEEKLY,
    category: AchievementCategory.COMBAT,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.DAMAGE, value: 10000, timeframe: 'week' }
    ],
    rewards: {
      xp: 1500,
      credits: 750,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 10000,
    isCompleted: false,
    timesCompleted: 0,
    icon: '💥',
    priority: 1
  },
  {
    id: 'weekly_wins_10',
    name: 'Weekly Champion',
    description: 'Win 10 matches this week',
    type: ChallengeType.WEEKLY,
    category: AchievementCategory.TACTICAL,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.WINS, value: 10, timeframe: 'week' }
    ],
    rewards: {
      xp: 2000,
      credits: 1000,
      cosmetics: [],
      badges: ['weekly_champion']
    },
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🏆',
    priority: 2
  },
  {
    id: 'weekly_headshots_50',
    name: 'Weekly Sharpshooter',
    description: 'Get 50 headshots this week',
    type: ChallengeType.WEEKLY,
    category: AchievementCategory.COMBAT,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.HEADSHOTS, value: 50, timeframe: 'week' }
    ],
    rewards: {
      xp: 1800,
      credits: 900,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 50,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🎯',
    priority: 3
  },
  {
    id: 'weekly_accuracy',
    name: 'Precision Weekly',
    description: 'Maintain 75% accuracy this week',
    type: ChallengeType.WEEKLY,
    category: AchievementCategory.TACTICAL,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.ACCURACY, value: 75, timeframe: 'week' }
    ],
    rewards: {
      xp: 2500,
      credits: 1250,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 75,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🎯',
    priority: 4
  },
  {
    id: 'weekly_objectives_25',
    name: 'Weekly Tactician',
    description: 'Capture 25 objectives this week',
    type: ChallengeType.WEEKLY,
    category: AchievementCategory.TACTICAL,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requirements: [
      { type: RequirementType.OBJECTIVES, value: 25, timeframe: 'week' }
    ],
    rewards: {
      xp: 1600,
      credits: 800,
      cosmetics: []
    },
    progress: 0,
    maxProgress: 25,
    isCompleted: false,
    timesCompleted: 0,
    icon: '🎯',
    priority: 5
  }
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get Achievement by ID
 */
export function getAchievement(id: string): AchievementData | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id)
}

/**
 * Get Achievements by Category
 */
export function getAchievementsByCategory(category: AchievementCategory): AchievementData[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category)
}

/**
 * Get Achievements by Rarity
 */
export function getAchievementsByRarity(rarity: Rarity): AchievementData[] {
  return ALL_ACHIEVEMENTS.filter(a => a.rarity === rarity)
}

/**
 * Get Visible Achievements (non-hidden)
 */
export function getVisibleAchievements(): AchievementData[] {
  return ALL_ACHIEVEMENTS.filter(a => !a.isHidden)
}

/**
 * Get Completed Achievements
 */
export function getCompletedAchievements(achievements: AchievementData[]): AchievementData[] {
  return achievements.filter(a => a.isCompleted)
}

/**
 * Get Challenge by ID
 */
export function getChallenge(id: string): ChallengeData | undefined {
  return [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES].find(c => c.id === id)
}

/**
 * Get Active Challenges
 */
export function getActiveChallenges(): ChallengeData[] {
  const now = Date.now()
  return [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES].filter(
    c => c.isActive && now >= c.startDate.getTime() && now <= c.endDate.getTime()
  )
}

/**
 * Get Daily Challenges
 */
export function getDailyChallenges(): ChallengeData[] {
  return DAILY_CHALLENGES.filter(c => c.isActive)
}

/**
 * Get Weekly Challenges
 */
export function getWeeklyChallenges(): ChallengeData[] {
  return WEEKLY_CHALLENGES.filter(c => c.isActive)
}

/**
 * Calculate Achievement Completion Percentage
 */
export function calculateAchievementCompletion(achievements: AchievementData[]): number {
  const completed = achievements.filter(a => a.isCompleted).length
  return (completed / achievements.length) * 100
}

/**
 * Get Total XP from Achievements
 */
export function getTotalAchievementXP(achievements: AchievementData[]): number {
  return achievements.reduce((total, a) => total + (a.isCompleted ? a.rewards.xp : 0), 0)
}

/**
 * Get Total Credits from Achievements
 */
export function getTotalAchievementCredits(achievements: AchievementData[]): number {
  return achievements.reduce((total, a) => total + (a.isCompleted ? a.rewards.credits : 0), 0)
}
