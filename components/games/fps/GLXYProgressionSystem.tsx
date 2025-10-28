// @ts-nocheck
'use client'

// PROGRESSION SYSTEM - XP, RANKS, ACHIEVEMENTS, UNLOCKS!
export interface PlayerProfile {
  playerId: string
  playerName: string
  level: number
  experience: number
  experienceToNext: number
  totalExperience: number
  rank: PlayerRank
  prestige: number
  title: string
  avatar: string
  joinDate: Date
  lastActive: Date
  playTime: number // Total play time in minutes
  wins: number
  losses: number
  kills: number
  deaths: number
  assists: number
  headshots: number
  longestStreak: number
  accuracy: number
  damageDealt: number
  damageTaken: number
  objectivesCaptured: number
  score: number
  kdr: number
  winRate: number
}

export interface PlayerRank {
  id: string
  name: string
  level: number
  minExperience: number
  maxExperience: number
  color: string
  icon: string
  privileges: string[]
  rewards: {
    credits: number
    unlocks: string[]
    cosmetics: string[]
    titles: string[]
  }
  description: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: 'combat' | 'tactical' | 'teamwork' | 'survival' | 'specialist' | 'milestone' | 'seasonal' | 'hidden'
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  isHidden: boolean
  isCompleted: boolean
  progress: number
  maxProgress: number
  rewards: {
    experience: number
    credits: number
    cosmetics: string[]
    titles: string[]
    badges: string[]
  }
  requirements: AchievementRequirement[]
  completedDate?: Date
  completionStats?: any
}

export interface AchievementRequirement {
  type: 'kills' | 'headshots' | 'wins' | 'losses' | 'deaths' | 'kdr' | 'accuracy' | 'damage' | 'objectives' |
         'playtime' | 'streak' | 'multi_kill' | 'clutch' | 'first_blood' | 'last_man_standing' |
         'weapon_master' | 'class_specialist' | 'mode_veteran' | 'seasonal_event' | 'custom'
  value: number
  requirement?: string
  weapon?: string
  class?: string
  mode?: string
  map?: string
  timeframe?: 'match' | 'session' | 'day' | 'week' | 'season' | 'lifetime'
  operator?: 'and' | 'or'
}

export interface Challenge {
  id: string
  name: string
  description: string
  type: 'daily' | 'weekly' | 'seasonal' | 'event'
  isActive: boolean
  startDate: Date
  endDate: Date
  requirements: AchievementRequirement[]
  rewards: {
    experience: number
    credits: number
    cosmetics: string[]
  }
  progress: number
  maxProgress: number
  isCompleted: boolean
  timesCompleted: number
}

export interface UnlockSystem {
  weapons: Map<string, UnlockRequirement>
  attachments: Map<string, UnlockRequirement>
  cosmetics: Map<string, UnlockRequirement>
  classes: Map<string, UnlockRequirement>
  modes: Map<string, UnlockRequirement>
  achievements: Map<string, UnlockRequirement>
}

export interface UnlockRequirement {
  type: 'level' | 'experience' | 'rank' | 'achievement' | 'challenge' | 'season_pass' | 'purchase'
  value: number
  requirement: string
  isMet: boolean
  unlockedDate?: Date
}

export interface SeasonPass {
  id: string
  name: string
  season: number
  isActive: boolean
  startDate: Date
  endDate: Date
  freeRewards: SeasonReward[]
  premiumRewards: SeasonReward[]
  currentLevel: number
  maxLevel: number
  experience: number
  experienceToNext: number
  isPremium: boolean
}

export interface SeasonReward {
  level: number
  type: 'credits' | 'cosmetic' | 'weapon' | 'attachment' | 'title' | 'badge' | 'avatar' | 'frame'
  item: string
  quantity?: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface StatisticTracker {
  weaponStats: Map<string, WeaponStats>
  modeStats: Map<string, ModeStats>
  classStats: Map<string, ClassStats>
  mapStats: Map<string, MapStats>
  sessionStats: SessionStats
  lifetimeStats: LifetimeStats
}

export interface WeaponStats {
  weaponId: string
  kills: number
  deaths: number
  shots: number
  hits: number
  headshots: number
  damage: number
  accuracy: number
  kdr: number
  timeUsed: number
  unlocks: string[]
  experience: number
  level: number
  favorites: {
    mostKills: string
    bestAccuracy: string
    mostUsed: string
  }
}

export interface ModeStats {
  modeId: string
  matches: number
  wins: number
  losses: number
  winRate: number
  avgScore: number
  bestScore: number
  kdr: number
  objectives: number
  playTime: number
  favoriteWeapon: string
}

export interface ClassStats {
  classId: string
  matches: number
  wins: number
  losses: number
  winRate: number
  kdr: number
  objectives: number
  playTime: number
  abilityUses: number
  ultimateUses: number
  efficiency: number
}

export interface MapStats {
  mapId: string
  matches: number
  wins: number
  losses: number
  winRate: number
  avgScore: number
  bestScore: number
  kdr: number
  objectives: number
  playTime: number
  favoriteWeapon: string
}

export interface SessionStats {
  sessionStart: Date
  sessionDuration: number
  kills: number
  deaths: number
  assists: number
  headshots: number
  damage: number
  score: number
  longestStreak: number
  bestPlay: string
  weaponsUsed: string[]
  challengesCompleted: string[]
}

export interface LifetimeStats {
  totalPlayTime: number
  totalMatches: number
  totalWins: number
  totalLosses: number
  totalKills: number
  totalDeaths: number
  totalHeadshots: number
  totalAssists: number
  totalDamage: number
  totalScore: number
  bestStreak: number
  bestMatch: string
  favoriteWeapon: string
  favoriteMode: string
  favoriteClass: string
  achievementsCompleted: number
  totalExperience: number
}

export class GLXYProgressionSystem {
  private playerProfile: PlayerProfile
  private achievements: Map<string, Achievement>
  private challenges: Map<string, Challenge>
  private ranks: PlayerRank[]
  private unlockSystem: UnlockSystem
  private statistics: StatisticTracker
  private seasonPass: SeasonPass
  private notificationCallbacks: Map<string, Function>

  constructor(playerId: string, playerName: string) {
    this.playerProfile = this.createPlayerProfile(playerId, playerName)
    this.achievements = new Map()
    this.challenges = new Map()
    this.ranks = []
    this.unlockSystem = this.createUnlockSystem()
    this.statistics = this.createStatisticsTracker()
    this.seasonPass = this.createSeasonPass()
    this.notificationCallbacks = new Map()

    this.initializeRanks()
    this.initializeAchievements()
    this.initializeChallenges()
  }

  // Create player profile
  private createPlayerProfile(playerId: string, playerName: string): PlayerProfile {
    return {
      playerId,
      playerName,
      level: 1,
      experience: 0,
      experienceToNext: 1000,
      totalExperience: 0,
      rank: this.getRankByLevel(1),
      prestige: 0,
      title: 'Recruit',
      avatar: 'default',
      joinDate: new Date(),
      lastActive: new Date(),
      playTime: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      headshots: 0,
      longestStreak: 0,
      accuracy: 0,
      damageDealt: 0,
      damageTaken: 0,
      objectivesCaptured: 0,
      score: 0,
      kdr: 0,
      winRate: 0
    }
  }

  // Create unlock system
  private createUnlockSystem(): UnlockSystem {
    return {
      weapons: new Map(),
      attachments: new Map(),
      cosmetics: new Map(),
      classes: new Map(),
      modes: new Map(),
      achievements: new Map()
    }
  }

  // Create statistics tracker
  private createStatisticsTracker(): StatisticTracker {
    return {
      weaponStats: new Map(),
      modeStats: new Map(),
      classStats: new Map(),
      mapStats: new Map(),
      sessionStats: {
        sessionStart: new Date(),
        sessionDuration: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        headshots: 0,
        damage: 0,
        score: 0,
        longestStreak: 0,
        bestPlay: '',
        weaponsUsed: [],
        challengesCompleted: []
      },
      lifetimeStats: {
        totalPlayTime: 0,
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        totalKills: 0,
        totalDeaths: 0,
        totalHeadshots: 0,
        totalAssists: 0,
        totalDamage: 0,
        totalScore: 0,
        bestStreak: 0,
        bestMatch: '',
        favoriteWeapon: '',
        favoriteMode: '',
        favoriteClass: '',
        achievementsCompleted: 0,
        totalExperience: 0
      }
    }
  }

  // Create season pass
  private createSeasonPass(): SeasonPass {
    return {
      id: 'season_1',
      name: 'Operation GLXY Alpha',
      season: 1,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      freeRewards: this.createSeasonRewards(false),
      premiumRewards: this.createSeasonRewards(true),
      currentLevel: 1,
      maxLevel: 100,
      experience: 0,
      experienceToNext: 1000,
      isPremium: false
    }
  }

  // Initialize ranks
  private initializeRanks(): void {
    this.ranks = [
      {
        id: 'recruit',
        name: 'Recruit',
        level: 1,
        minExperience: 0,
        maxExperience: 999,
        color: '#888888',
        icon: '🎖️',
        privileges: ['Basic weapons', 'Default loadouts'],
        rewards: { credits: 100, unlocks: ['glxy_m4a1'], cosmetics: [], titles: [] },
        description: 'Welcome to GLXY Tactical Operations'
      },
      {
        id: 'private',
        name: 'Private',
        level: 2,
        minExperience: 1000,
        maxExperience: 2999,
        color: '#CD7F32',
        icon: '⭐',
        privileges: ['Basic attachments', 'Custom loadouts'],
        rewards: { credits: 200, unlocks: ['reflex_sight'], cosmetics: [], titles: [] },
        description: 'Beginning to understand the battlefield'
      },
      {
        id: 'corporal',
        name: 'Corporal',
        level: 3,
        minExperience: 3000,
        maxExperience: 5999,
        color: '#4682B4',
        icon: '🎖️',
        privileges: ['Advanced attachments', 'Weapon skins'],
        rewards: { credits: 300, unlocks: ['holographic_sight'], cosmetics: ['camo_pattern'], titles: [] },
        description: 'Proven combat capability'
      },
      {
        id: 'sergeant',
        name: 'Sergeant',
        level: 4,
        minExperience: 6000,
        maxExperience: 9999,
        color: '#32CD32',
        icon: '🏅',
        privileges: ['Elite weapons', 'Special equipment'],
        rewards: { credits: 500, unlocks: ['glxy_sniper'], cosmetics: ['digital_camo'], titles: ['Sergeant'] },
        description: 'Leadership qualities emerging'
      },
      {
        id: 'lieutenant',
        name: 'Lieutenant',
        level: 5,
        minExperience: 10000,
        maxExperience: 14999,
        color: '#8B4513',
        icon: '🎖️',
        privileges: ['All weapons', 'Tactical gadgets'],
        rewards: { credits: 800, unlocks: ['proximity_mine'], cosmetics: ['urban_camo'], titles: ['Lieutenant'] },
        description: 'Tactical expert'
      },
      {
        id: 'captain',
        name: 'Captain',
        level: 6,
        minExperience: 15000,
        maxExperience: 24999,
        color: '#DAA520',
        icon: '🌟',
        privileges: ['VIP weapons', 'Custom titles'],
        rewards: { credits: 1200, unlocks: ['recon_drone'], cosmetics: ['carbon_fiber'], titles: ['Captain', 'Leader'] },
        description: 'Elite tactical operator'
      },
      {
        id: 'major',
        name: 'Major',
        level: 7,
        minExperience: 25000,
        maxExperience: 49999,
        color: '#FF6347',
        icon: '🏆',
        privileges: ['Master weapons', 'Exclusive cosmetics'],
        rewards: { credits: 2000, unlocks: ['legendary_weapons'], cosmetics: ['dragon_red'], titles: ['Major', 'Warrior'] },
        description: 'Master of warfare'
      },
      {
        id: 'colonel',
        name: 'Colonel',
        level: 8,
        minExperience: 50000,
        maxExperience: 99999,
        color: '#9370DB',
        icon: '👑',
        privileges: ['Legendary weapons', 'Unique titles'],
        rewards: { credits: 3500, unlocks: ['mythic_weapons'], cosmetics: ['gold_plated'], titles: ['Colonel', 'Commander'] },
        description: 'Legendary tactical commander'
      },
      {
        id: 'general',
        name: 'General',
        level: 9,
        minExperience: 100000,
        maxExperience: 199999,
        color: '#FF4500',
        icon: '🎖️',
        privileges: ['All content', 'Special recognition'],
        rewards: { credits: 5000, unlocks: ['all_content'], cosmetics: ['exclusive_items'], titles: ['General', 'Legend'] },
        description: 'GLXY Legend'
      },
      {
        id: 'marshal',
        name: 'Marshal',
        level: 10,
        minExperience: 200000,
        maxExperience: Infinity,
        color: '#FFD700',
        icon: '🌟',
        privileges: ['Developer access', 'Special privileges'],
        rewards: { credits: 10000, unlocks: ['developer_weapons'], cosmetics: ['cosmic_items'], titles: ['Marshal', 'GLXY Master'] },
        description: 'Supreme tactical mastery'
      }
    ]
  }

  // Initialize achievements
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Combat Achievements
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Get your first kill',
        category: 'combat',
        icon: '🩸',
        rarity: 'common',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 1,
        rewards: { experience: 100, credits: 50, cosmetics: [], titles: [], badges: [] },
        requirements: [
          { type: 'kills', value: 1, timeframe: 'match' }
        ]
      },
      {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Get 100 headshots',
        category: 'combat',
        icon: '🎯',
        rarity: 'uncommon',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 100,
        rewards: { experience: 500, credits: 200, cosmetics: [], titles: ['Sharpshooter'], badges: [] },
        requirements: [
          { type: 'headshots', value: 100, timeframe: 'lifetime' }
        ]
      },
      {
        id: 'exterminator',
        name: 'Exterminator',
        description: 'Get 1000 kills',
        category: 'combat',
        icon: '💀',
        rarity: 'rare',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 1000,
        rewards: { experience: 2000, credits: 1000, cosmetics: [], titles: ['Exterminator'], badges: [] },
        requirements: [
          { type: 'kills', value: 1000, timeframe: 'lifetime' }
        ]
      },
      {
        id: 'god_mode',
        name: 'God Mode',
        description: 'Get a 50 kill streak',
        category: 'combat',
        icon: '⚡',
        rarity: 'legendary',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 50,
        rewards: { experience: 5000, credits: 2500, cosmetics: [], titles: ['God Mode'], badges: [] },
        requirements: [
          { type: 'streak', value: 50, timeframe: 'match' }
        ]
      },

      // Tactical Achievements
      {
        id: 'tactical_genius',
        name: 'Tactical Genius',
        description: 'Win 50 matches without dying',
        category: 'tactical',
        icon: '🧠',
        rarity: 'epic',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 50,
        rewards: { experience: 3000, credits: 1500, cosmetics: [], titles: ['Tactical Genius'], badges: [] },
        requirements: [
          { type: 'wins', value: 50, timeframe: 'match' },
          { type: 'deaths', value: 0, timeframe: 'match', operator: 'and' }
        ]
      },
      {
        id: 'objective_master',
        name: 'Objective Master',
        description: 'Capture 500 objectives',
        category: 'tactical',
        icon: '🎯',
        rarity: 'rare',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 500,
        rewards: { experience: 1500, credits: 750, cosmetics: [], titles: [], badges: [] },
        requirements: [
          { type: 'objectives', value: 500, timeframe: 'lifetime' }
        ]
      },

      // Specialist Achievements
      {
        id: 'weapon_master',
        name: 'Weapon Master',
        description: 'Master every weapon',
        category: 'specialist',
        icon: '🔫',
        rarity: 'epic',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 15,
        rewards: { experience: 4000, credits: 2000, cosmetics: [], titles: ['Weapon Master'], badges: [] },
        requirements: Array(15).fill(null).map((_, i) => ({
          type: 'weapon_master' as const,
          value: 1,
          timeframe: 'lifetime' as const,
          weapon: `weapon_${i}`
        }))
      },
      {
        id: 'class_specialist',
        name: 'Class Specialist',
        description: 'Win 20 matches with each class',
        category: 'specialist',
        icon: '🎖️',
        rarity: 'rare',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 20,
        rewards: { experience: 2000, credits: 1000, cosmetics: [], titles: ['Class Specialist'], badges: [] },
        requirements: Array(5).fill(null).flatMap((_, classIndex) => [
          { type: 'wins' as const, value: 20, timeframe: 'lifetime' as const, class: `class_${classIndex}` }
        ])
      },

      // Milestone Achievements
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Play 100 matches',
        category: 'milestone',
        icon: '⏰',
        rarity: 'uncommon',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 100,
        rewards: { experience: 1000, credits: 500, cosmetics: [], titles: ['Veteran'], badges: [] },
        requirements: [
          { type: 'playtime', value: 100, timeframe: 'match' }
        ]
      },
      {
        id: 'survivor',
        name: 'Survivor',
        description: 'Play for 100 hours',
        category: 'milestone',
        icon: '⏳',
        rarity: 'common',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 6000,
        rewards: { experience: 2000, credits: 1000, cosmetics: [], titles: ['Survivor'], badges: [] },
        requirements: [
          { type: 'playtime', value: 6000, timeframe: 'lifetime' }
        ]
      },

      // Hidden Achievements
      {
        id: 'ninja',
        name: 'Ninja',
        description: 'Get 10 kills without being detected',
        category: 'hidden',
        icon: '🥷',
        rarity: 'legendary',
        isHidden: true,
        isCompleted: false,
        progress: 0,
        maxProgress: 10,
        rewards: { experience: 3000, credits: 1500, cosmetics: ['ninja_suit'], titles: ['Ninja'], badges: [] },
        requirements: [
          { type: 'kills', value: 10, timeframe: 'match' },
          { type: 'custom', value: 1, requirement: 'undetected_kills', operator: 'and' }
        ]
      },
      {
        id: 'one_shot_one_kill',
        name: 'One Shot, One Kill',
        description: 'Get 100 one-shot kills',
        category: 'hidden',
        icon: '💥',
        rarity: 'epic',
        isHidden: false,
        isCompleted: false,
        progress: 0,
        maxProgress: 100,
        rewards: { experience: 2500, credits: 1200, cosmetics: [], titles: ['One Shot'], badges: [] },
        requirements: [
          { type: 'custom', value: 100, requirement: 'one_shot_kills', timeframe: 'lifetime' }
        ]
      }
    ]

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement)
    })
  }

  // Initialize challenges
  private initializeChallenges(): void {
    // Daily Challenges
    const dailyChallenges: Challenge[] = [
      {
        id: 'daily_kills_10',
        name: 'Daily Hunter',
        description: 'Get 10 kills today',
        type: 'daily',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requirements: [
          { type: 'kills', value: 10, timeframe: 'day' }
        ],
        rewards: { experience: 200, credits: 100, cosmetics: [] },
        progress: 0,
        maxProgress: 10,
        isCompleted: false,
        timesCompleted: 0
      },
      {
        id: 'daily_headshots_5',
        name: 'Daily Marksman',
        description: 'Get 5 headshots today',
        type: 'daily',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requirements: [
          { type: 'headshots', value: 5, timeframe: 'day' }
        ],
        rewards: { experience: 300, credits: 150, cosmetics: [] },
        progress: 0,
        maxProgress: 5,
        isCompleted: false,
        timesCompleted: 0
      },
      {
        id: 'daily_wins_3',
        name: 'Daily Winner',
        description: 'Win 3 matches today',
        type: 'daily',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requirements: [
          { type: 'wins', value: 3, timeframe: 'day' }
        ],
        rewards: { experience: 400, credits: 200, cosmetics: [] },
        progress: 0,
        maxProgress: 3,
        isCompleted: false,
        timesCompleted: 0
      }
    ]

    // Weekly Challenges
    const weeklyChallenges: Challenge[] = [
      {
        id: 'weekly_damage_5000',
        name: 'Damage Dealer',
        description: 'Deal 5000 damage this week',
        type: 'weekly',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requirements: [
          { type: 'damage', value: 5000, timeframe: 'week' }
        ],
        rewards: { experience: 1000, credits: 500, cosmetics: [] },
        progress: 0,
        maxProgress: 5000,
        isCompleted: false,
        timesCompleted: 0
      },
      {
        id: 'weekly_accuracy_70',
        name: 'Precision Master',
        description: 'Maintain 70% accuracy this week',
        type: 'weekly',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requirements: [
          { type: 'accuracy', value: 70, timeframe: 'week' }
        ],
        rewards: { experience: 800, credits: 400, cosmetics: [] },
        progress: 0,
        maxProgress: 70,
        isCompleted: false,
        timesCompleted: 0
      }
    ]

    dailyChallenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge)
    })

    weeklyChallenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge)
    })
  }

  // Create season rewards
  private createSeasonRewards(isPremium: boolean): SeasonReward[] {
    const rewards: SeasonReward[] = []

    for (let level = 1; level <= 100; level++) {
      // Free rewards
      rewards.push({
        level,
        type: 'credits',
        item: 'credits',
        quantity: isPremium ? 200 : 100,
        rarity: 'common'
      })

      if (level % 5 === 0) {
        rewards.push({
          level,
          type: 'cosmetic',
          item: `skin_level_${level}`,
          rarity: isPremium ? 'rare' : 'common'
        })
      }

      // Premium rewards
      if (isPremium) {
        rewards.push({
          level,
          type: 'credits',
          item: 'credits',
          quantity: 300,
          rarity: 'uncommon'
        })

        if (level % 3 === 0) {
          rewards.push({
            level,
            type: 'cosmetic',
            item: `premium_skin_level_${level}`,
            rarity: 'epic'
          })
        }

        if (level % 10 === 0) {
          rewards.push({
            level,
            type: 'weapon',
            item: 'season_weapon',
            rarity: 'legendary'
          })
        }
      }
    }

    return rewards
  }

  // Get rank by level
  private getRankByLevel(level: number): PlayerRank {
    for (let i = this.ranks.length - 1; i >= 0; i--) {
      if (level >= this.ranks[i].level) {
        return this.ranks[i]
      }
    }
    return this.ranks[0]
  }

  // Add experience
  addExperience(amount: number, source: string = 'unknown'): void {
    const oldLevel = this.playerProfile.level
    this.playerProfile.experience += amount
    this.playerProfile.totalExperience += amount

    // Check for level up
    while (this.playerProfile.experience >= this.playerProfile.experienceToNext) {
      this.levelUp()
    }

    // Update season pass
    if (this.seasonPass.isActive) {
      this.addSeasonPassExperience(amount)
    }

    // Check achievements
    this.checkAchievements()

    // Notify about experience gain
    this.notifyExperienceGain(amount, source)

    // Save profile
    this.saveProfile()
  }

  // Level up
  private levelUp(): void {
    const oldLevel = this.playerProfile.level
    this.playerProfile.level++
    this.playerProfile.experience -= this.playerProfile.experienceToNext
    this.playerProfile.experienceToNext = this.calculateExperienceToNext(this.playerProfile.level)
    this.playerProfile.rank = this.getRankByLevel(this.playerProfile.level)

    // Grant rank rewards
    const rank = this.playerProfile.rank
    this.playerProfile.wins += rank.rewards.credits

    // Check for unlocked content
    rank.rewards.unlocks.forEach(unlock => {
      this.unlockContent(unlock)
    })

    // Notify about level up
    this.notifyLevelUp(oldLevel, this.playerProfile.level)
  }

  // Calculate experience to next level
  private calculateExperienceToNext(level: number): number {
    const baseXP = 1000
    const growthRate = 1.2
    return Math.floor(baseXP * Math.pow(growthRate, level - 1))
  }

  // Update match statistics
  updateMatchStats(stats: {
    kills?: number
    deaths?: number
    assists?: number
    headshots?: number
    damage?: number
    score?: number
    objectives?: number
    mode?: string
    class?: string
    map?: string
    weapons?: string[]
    result?: 'win' | 'loss' | 'draw'
    duration?: number
  }): void {
    const updates = {
      wins: stats.result === 'win' ? 1 : 0,
      losses: stats.result === 'loss' ? 1 : 0,
      kills: stats.kills || 0,
      deaths: stats.deaths || 0,
      assists: stats.assists || 0,
      headshots: stats.headshots || 0,
      damageDealt: stats.damage || 0,
      score: stats.score || 0,
      objectivesCaptured: stats.objectives || 0
    }

    // Update profile
    this.playerProfile.wins += updates.wins
    this.playerProfile.losses += updates.losses
    this.playerProfile.kills += updates.kills
    this.playerProfile.deaths += updates.deaths
    this.playerProfile.assists += updates.assists
    this.playerProfile.headshots += updates.headshots
    this.playerProfile.damageDealt += updates.damageDealt
    this.playerProfile.score += updates.score
    this.playerProfile.objectivesCaptured += updates.objectivesCaptured

    // Update KDR
    this.playerProfile.kdr = this.playerProfile.deaths > 0 ?
      this.playerProfile.kills / this.playerProfile.deaths : 0

    // Update win rate
    const totalMatches = this.playerProfile.wins + this.playerProfile.losses
    this.playerProfile.winRate = totalMatches > 0 ?
      (this.playerProfile.wins / totalMatches) * 100 : 0

    // Update accuracy
    const totalShots = this.getTotalShots()
    this.playerProfile.accuracy = totalShots > 0 ?
      (this.getTotalHits() / totalShots) * 100 : 0

    // Update longest streak
    if (stats.kills && stats.kills > this.playerProfile.longestStreak) {
      this.playerProfile.longestStreak = stats.kills
    }

    // Update weapon statistics
    if (stats.weapons) {
      stats.weapons.forEach(weaponId => {
        this.updateWeaponStats(weaponId, {
          kills: updates.kills,
          deaths: updates.deaths,
          headshots: updates.headshots,
          damage: updates.damageDealt
        })
      })
    }

    // Update mode statistics
    if (stats.mode) {
      this.updateModeStats(stats.mode, updates)
    }

    // Update class statistics
    if (stats.class) {
      this.updateClassStats(stats.class, updates)
    }

    // Update session statistics
    this.updateSessionStats(updates)

    // Update lifetime statistics
    this.updateLifetimeStats(updates, stats.duration || 0)

    // Add experience based on performance
    const experienceGained = this.calculateExperienceFromMatch(updates)
    this.addExperience(experienceGained, 'match')

    // Check challenges
    this.checkChallenges()

    // Save profile
    this.saveProfile()
  }

  // Update weapon statistics
  private updateWeaponStats(weaponId: string, updates: Partial<WeaponStats>): void {
    if (!this.statistics.weaponStats.has(weaponId)) {
      this.statistics.weaponStats.set(weaponId, {
        weaponId,
        kills: 0,
        deaths: 0,
        shots: 0,
        hits: 0,
        headshots: 0,
        damage: 0,
        accuracy: 0,
        kdr: 0,
        timeUsed: 0,
        unlocks: [],
        experience: 0,
        level: 1,
        favorites: {
          mostKills: '',
          bestAccuracy: '',
          mostUsed: ''
        }
      })
    }

    const stats = this.statistics.weaponStats.get(weaponId)!
    stats.kills += updates.kills || 0
    stats.deaths += updates.deaths || 0
    stats.headshots += updates.headshots || 0
    stats.damage += updates.damage || 0

    // Update KDR
    stats.kdr = stats.deaths > 0 ? stats.kills / stats.deaths : 0

    // Add weapon experience
    const weaponXP = (updates.kills || 0) * 10 + (updates.headshots || 0) * 20 + (updates.damage || 0) * 0.1
    stats.experience += weaponXP

    // Check for weapon level up
    const weaponLevelXP = stats.level * 100
    if (stats.experience >= weaponLevelXP) {
      stats.level++
      stats.experience -= weaponLevelXP
      this.unlockWeaponContent(stats.weaponId, stats.level)
    }

    // Update favorites
    if (stats.kills > stats.level * 10) {
      stats.favorites.mostKills = weaponId
    }
  }

  // Update mode statistics
  private updateModeStats(modeId: string, updates: any): void {
    if (!this.statistics.modeStats.has(modeId)) {
      this.statistics.modeStats.set(modeId, {
        modeId,
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgScore: 0,
        bestScore: 0,
        kdr: 0,
        objectives: 0,
        playTime: 0,
        favoriteWeapon: ''
      })
    }

    const stats = this.statistics.modeStats.get(modeId)!
    stats.matches += 1
    stats.wins += updates.wins || 0
    stats.losses += updates.losses || 0
    stats.objectives += updates.objectivesCaptured || 0

    // Update win rate
    stats.winRate = (stats.wins / stats.matches) * 100

    // Update average score
    stats.avgScore = (stats.avgScore * (stats.matches - 1) + (updates.score || 0)) / stats.matches

    // Update best score
    if ((updates.score || 0) > stats.bestScore) {
      stats.bestScore = updates.score || 0
    }

    // Update KDR
    stats.kdr = this.playerProfile.kdr
  }

  // Update class statistics
  private updateClassStats(classId: string, updates: any): void {
    if (!this.statistics.classStats.has(classId)) {
      this.statistics.classStats.set(classId, {
        classId,
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        kdr: 0,
        objectives: 0,
        playTime: 0,
        abilityUses: 0,
        ultimateUses: 0,
        efficiency: 0
      })
    }

    const stats = this.statistics.classStats.get(classId)!
    stats.matches += 1
    stats.wins += updates.wins || 0
    stats.losses += updates.losses || 0
    stats.objectives += updates.objectivesCaptured || 0

    // Update win rate
    stats.winRate = (stats.wins / stats.matches) * 100

    // Update KDR
    stats.kdr = this.playerProfile.kdr

    // Update efficiency
    stats.efficiency = ((updates.kills || 0) + (updates.assists || 0)) / (stats.matches || 1)
  }

  // Update session statistics
  private updateSessionStats(updates: any): void {
    this.statistics.sessionStats.kills += updates.kills || 0
    this.statistics.sessionStats.deaths += updates.deaths || 0
    this.statistics.sessionStats.assists += updates.assists || 0
    this.statistics.sessionStats.headshots += updates.headshots || 0
    this.statistics.sessionStats.damage += updates.damageDealt || 0
    this.statistics.sessionStats.score += updates.score || 0

    if (updates.kills > this.statistics.sessionStats.longestStreak) {
      this.statistics.sessionStats.longestStreak = updates.kills
    }
  }

  // Update lifetime statistics
  private updateLifetimeStats(updates: any, duration: number): void {
    this.statistics.lifetimeStats.totalMatches += 1
    this.statistics.lifetimeStats.totalWins += updates.wins || 0
    this.statistics.lifetimeStats.totalLosses += updates.losses || 0
    this.statistics.lifetimeStats.totalKills += updates.kills || 0
    this.statistics.lifetimeStats.totalDeaths += updates.deaths || 0
    this.statistics.lifetimeStats.totalAssists += updates.assists || 0
    this.statistics.lifetimeStats.totalHeadshots += updates.headshots || 0
    this.statistics.lifetimeStats.totalDamage += updates.damageDealt || 0
    this.statistics.lifetimeStats.totalScore += updates.score || 0
    this.statistics.lifetimeStats.totalPlayTime += duration / 60 // Convert to minutes

    if (updates.kills > this.statistics.lifetimeStats.bestStreak) {
      this.statistics.lifetimeStats.bestStreak = updates.kills
      this.statistics.lifetimeStats.bestMatch = `K: ${updates.kills} D: ${updates.deaths} S: ${updates.score}`
    }

    this.statistics.lifetimeStats.achievementsCompleted = this.getCompletedAchievementsCount()
    this.statistics.lifetimeStats.totalExperience = this.playerProfile.totalExperience
  }

  // Calculate experience from match
  private calculateExperienceFromMatch(stats: any): number {
    let experience = 0

    // Base experience for participation
    experience += 50

    // Experience for kills
    experience += stats.kills * 25

    // Bonus for headshots
    experience += stats.headshots * 50

    // Experience for assists
    experience += stats.assists * 15

    // Experience for objectives
    experience += stats.objectivesCaptured * 30

    // Experience for score
    experience += Math.floor(stats.score * 0.1)

    // Bonus for wins
    if (stats.result === 'win') {
      experience += 200
    }

    // Bonus for high performance
    if (stats.kdr > 3) {
      experience += 100
    }

    if (stats.accuracy > 80) {
      experience += 150
    }

    return experience
  }

  // Get total shots
  private getTotalShots(): number {
    let totalShots = 0
    this.statistics.weaponStats.forEach(stats => {
      totalShots += stats.shots
    })
    return totalShots
  }

  // Get total hits
  private getTotalHits(): number {
    let totalHits = 0
    this.statistics.weaponStats.forEach(stats => {
      totalHits += stats.hits
    })
    return totalHits
  }

  // Add season pass experience
  private addSeasonPassExperience(amount: number): void {
    if (!this.seasonPass.isPremium) return

    this.seasonPass.experience += amount

    // Check for level up
    while (this.seasonPass.experience >= this.seasonPass.experienceToNext) {
      this.seasonPass.currentLevel++
      this.seasonPass.experience -= this.seasonPass.experienceToNext
      this.seasonPass.experienceToNext = this.seasonPass.currentLevel * 1000

      // Grant rewards
      this.grantSeasonPassRewards(this.seasonPass.currentLevel)
    }
  }

  // Grant season pass rewards
  private grantSeasonPassRewards(level: number): void {
    // Grant free rewards
    const freeRewards = this.seasonPass.freeRewards.filter(r => r.level === level)
    freeRewards.forEach(reward => {
      this.grantReward(reward)
    })

    // Grant premium rewards
    if (this.seasonPass.isPremium) {
      const premiumRewards = this.seasonPass.premiumRewards.filter(r => r.level === level)
      premiumRewards.forEach(reward => {
        this.grantReward(reward)
      })
    }
  }

  // Grant reward
  private grantReward(reward: SeasonReward): void {
    switch (reward.type) {
      case 'credits':
        this.playerProfile.wins += reward.quantity || 1
        break
      case 'weapon':
        this.unlockContent(reward.item)
        break
      case 'attachment':
        this.unlockContent(reward.item)
        break
      case 'cosmetic':
        this.unlockContent(reward.item)
        break
      case 'title':
        this.playerProfile.title = reward.item
        break
      case 'badge':
        // Add badge to profile
        break
    }
  }

  // Unlock content
  private unlockContent(contentId: string): void {
    // Add to unlocked content
    console.log(`Unlocked content: ${contentId}`)
  }

  // Unlock weapon content
  private unlockWeaponContent(weaponId: string, level: number): void {
    const unlocks = [
      { level: 2, content: 'extended_barrel' },
      { level: 3, content: 'holographic_sight' },
      { level: 5, content: 'silencer' },
      { level: 8, content: '8x_scope' }
    ]

    unlocks.forEach(unlock => {
      if (level === unlock.level) {
        this.unlockContent(unlock.content)
      }
    })
  }

  // Check achievements
  private checkAchievements(): void {
    this.achievements.forEach((achievement, id) => {
      if (achievement.isCompleted) return

      const progress = this.calculateAchievementProgress(achievement)
      achievement.progress = progress

      if (progress >= achievement.maxProgress) {
        this.completeAchievement(id)
      }
    })
  }

  // Calculate achievement progress
  private calculateAchievementProgress(achievement: Achievement): number {
    let progress = 0

    achievement.requirements.forEach(req => {
      let reqProgress = 0

      switch (req.type) {
        case 'kills':
          reqProgress = this.playerProfile.kills
          break
        case 'headshots':
          reqProgress = this.playerProfile.headshots
          break
        case 'wins':
          reqProgress = this.playerProfile.wins
          break
        case 'losses':
          reqProgress = this.playerProfile.losses
          break
        case 'kdr':
          reqProgress = this.playerProfile.kdr * 100
          break
        case 'accuracy':
          reqProgress = this.playerProfile.accuracy
          break
        case 'damage':
          reqProgress = Math.floor(this.playerProfile.damageDealt)
          break
        case 'objectives':
          reqProgress = this.playerProfile.objectivesCaptured
          break
        case 'streak':
          reqProgress = this.playerProfile.longestStreak
          break
        case 'playtime':
          reqProgress = Math.floor(this.statistics.lifetimeStats.totalPlayTime)
          break
      }

      progress = Math.max(progress, reqProgress)
    })

    return progress
  }

  // Complete achievement
  private completeAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId)
    if (!achievement || achievement.isCompleted) return

    achievement.isCompleted = true
    achievement.completedDate = new Date()

    // Grant rewards
    this.addExperience(achievement.rewards.experience, 'achievement')
    this.playerProfile.wins += achievement.rewards.credits

    // Grant cosmetics
    achievement.rewards.cosmetics.forEach(cosmetic => {
      this.unlockContent(cosmetic)
    })

    // Grant titles
    achievement.rewards.titles.forEach(title => {
      if (!this.playerProfile.title || this.playerProfile.title === 'Recruit') {
        this.playerProfile.title = title
      }
    })

    // Notify about achievement completion
    this.notifyAchievementCompleted(achievement)

    // Save profile
    this.saveProfile()
  }

  // Check challenges
  private checkChallenges(): void {
    this.challenges.forEach((challenge, id) => {
      if (challenge.isCompleted) return

      const progress = this.calculateChallengeProgress(challenge)
      challenge.progress = progress

      if (progress >= challenge.maxProgress) {
        this.completeChallenge(id)
      }
    })
  }

  // Calculate challenge progress
  private calculateChallengeProgress(challenge: Challenge): number {
    let progress = 0

    challenge.requirements.forEach(req => {
      let reqProgress = 0

      switch (req.type) {
        case 'kills':
          if (req.timeframe === 'day') {
            // Would need daily tracking
            reqProgress = challenge.progress
          } else if (req.timeframe === 'week') {
            // Would need weekly tracking
            reqProgress = challenge.progress
          } else if (req.timeframe === 'lifetime') {
            reqProgress = this.playerProfile.kills
          }
          break
        case 'headshots':
          if (req.timeframe === 'day') {
            reqProgress = challenge.progress
          } else if (req.timeframe === 'week') {
            reqProgress = challenge.progress
          } else if (req.timeframe === 'lifetime') {
            reqProgress = this.playerProfile.headshots
          }
          break
        case 'wins':
          if (req.timeframe === 'day') {
            reqProgress = challenge.progress
          } else if (req.timeframe === 'week') {
            reqProgress = challenge.progress
          } else if (req.timeframe === 'lifetime') {
            reqProgress = this.playerProfile.wins
          }
          break
        case 'damage':
          if (req.timeframe === 'week') {
            reqProgress = challenge.progress
          } else if (req.timeframe === 'lifetime') {
            reqProgress = this.playerProfile.damageDealt
          }
          break
        case 'accuracy':
          if (req.timeframe === 'week') {
            reqProgress = challenge.progress
          } else if (req.timeframe === 'lifetime') {
            reqProgress = this.playerProfile.accuracy
          }
          break
      }

      progress = Math.max(progress, reqProgress)
    })

    return progress
  }

  // Complete challenge
  private completeChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId)
    if (!challenge || challenge.isCompleted) return

    challenge.isCompleted = true
    challenge.timesCompleted++

    // Grant rewards
    this.addExperience(challenge.rewards.experience, 'challenge')
    this.playerProfile.wins += challenge.rewards.credits

    // Grant cosmetics
    challenge.rewards.cosmetics.forEach(cosmetic => {
      this.unlockContent(cosmetic)
    })

    // Notify about challenge completion
    this.notifyChallengeCompleted(challenge)

    // Reset daily challenges
    if (challenge.type === 'daily') {
      this.resetDailyChallenge(challengeId)
    }

    // Reset weekly challenges
    if (challenge.type === 'weekly') {
      this.resetWeeklyChallenge(challengeId)
    }

    // Save profile
    this.saveProfile()
  }

  // Reset daily challenge
  private resetDailyChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) return

    challenge.progress = 0
    challenge.isCompleted = false
    challenge.startDate = new Date()
    challenge.endDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  }

  // Reset weekly challenge
  private resetWeeklyChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) return

    challenge.progress = 0
    challenge.isCompleted = false
    challenge.startDate = new Date()
    challenge.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }

  // Get completed achievements count
  private getCompletedAchievementsCount(): number {
    let count = 0
    this.achievements.forEach(achievement => {
      if (achievement.isCompleted) count++
    })
    return count
  }

  // Get player profile
  getPlayerProfile(): PlayerProfile {
    return { ...this.playerProfile }
  }

  // Get achievements
  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  // Get completed achievements
  getCompletedAchievements(): Achievement[] {
    return this.getAchievements().filter(a => a.isCompleted)
  }

  // Get active challenges
  getActiveChallenges(): Challenge[] {
    const now = new Date()
    return Array.from(this.challenges.values()).filter(challenge =>
      challenge.isActive && challenge.endDate > now
    )
  }

  // Get ranks
  getRanks(): PlayerRank[] {
    return [...this.ranks]
  }

  // Get current rank
  getCurrentRank(): PlayerRank {
    return this.playerProfile.rank
  }

  // Get statistics
  getStatistics(): StatisticTracker {
    return {
      weaponStats: new Map(this.statistics.weaponStats),
      modeStats: new Map(this.statistics.modeStats),
      classStats: new Map(this.statistics.classStats),
      mapStats: new Map(this.statistics.mapStats),
      sessionStats: { ...this.statistics.sessionStats },
      lifetimeStats: { ...this.statistics.lifetimeStats }
    }
  }

  // Get season pass
  getSeasonPass(): SeasonPass {
    return { ...this.seasonPass }
  }

  // Set notification callback
  setNotificationCallback(type: string, callback: Function): void {
    this.notificationCallbacks.set(type, callback)
  }

  // Notify experience gain
  private notifyExperienceGain(amount: number, source: string): void {
    const callback = this.notificationCallbacks.get('experience')
    if (callback) {
      callback({ amount, source })
    }
  }

  // Notify level up
  private notifyLevelUp(oldLevel: number, newLevel: number): void {
    const callback = this.notificationCallbacks.get('levelup')
    if (callback) {
      callback({ oldLevel, newLevel, rank: this.playerProfile.rank })
    }
  }

  // Notify achievement completed
  private notifyAchievementCompleted(achievement: Achievement): void {
    const callback = this.notificationCallbacks.get('achievement')
    if (callback) {
      callback(achievement)
    }
  }

  // Notify challenge completed
  private notifyChallengeCompleted(challenge: Challenge): void {
    const callback = this.notificationCallbacks.get('challenge')
    if (callback) {
      callback(challenge)
    }
  }

  // Save profile
  private saveProfile(): void {
    // In a real implementation, save to backend
    console.log('Saving player profile...')
  }

  // Load profile
  loadProfile(): void {
    // In a real implementation, load from backend
    console.log('Loading player profile...')
  }

  // Clean up
  cleanup(): void {
    this.achievements.clear()
    this.challenges.clear()
    this.statistics.weaponStats.clear()
    this.statistics.modeStats.clear()
    this.statistics.classStats.clear()
    this.statistics.mapStats.clear()
    this.notificationCallbacks.clear()
  }
}

export default GLXYProgressionSystem