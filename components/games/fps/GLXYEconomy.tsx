// @ts-nocheck
'use client'

// TACTICAL ECONOMY SYSTEM - CS:GO/Valorant Inspired
export interface GLXYEconomyItem {
  id: string
  name: string
  category: 'weapon' | 'equipment' | 'utility' | 'armor' | 'grenade'
  price: number
  teamRestriction?: 'attackers' | 'defenders' | 'both'
  buyRestriction?: 'all' | 'ct' | 't'
  description: string
  icon: string
  canBuy: boolean
  prerequisite?: string[]
}

export interface BuyPhase {
  canBuy: boolean
  timeRemaining: number
  phase: 'buy' | 'freeze' | 'live'
  buyTime: number
  freezeTime: number
}

export interface PlayerEconomy {
  credits: number
  roundKills: number
  roundDeaths: number
  roundWins: number
  roundLosses: number
  killReward: number
  lossBonus: number
  plantBonus: number
  defuseBonus: number
  totalEarnings: number
}

export interface EconomySettings {
  startingCredits: number
  killReward: number
  headshotBonus: number
  assistBonus: number
  winRoundBonus: number
  loseRoundBase: number
  loseRoundStreak: number[]
  maxLossStreak: number
  plantDefuseBonus: number
  bombSiteBonus: number
  buyTime: number
}

// Economy Configuration
export const GLXY_ECONOMY_SETTINGS: EconomySettings = {
  startingCredits: 800,
  killReward: 300,
  headshotBonus: 150,
  assistBonus: 100,
  winRoundBonus: 3250,
  loseRoundBase: 1400,
  loseRoundStreak: [1900, 2400, 2900, 3400], // Streak bonuses
  maxLossStreak: 4,
  plantDefuseBonus: 300,
  bombSiteBonus: 150,
  buyTime: 20000 // 20 seconds buy time
}

// Buy Menu Items
export const GLXY_BUY_ITEMS: GLXYEconomyItem[] = [
  // PRIMARY WEAPONS
  {
    id: 'glxy_assault_rifle',
    name: 'AR-15 Tactical',
    category: 'weapon',
    price: 2700,
    description: 'Versatile assault rifle, good for all ranges',
    icon: '🔫',
    canBuy: true
  },
  {
    id: 'glxy_battle_rifle',
    name: 'BR-16 Marksman',
    category: 'weapon',
    price: 3100,
    description: 'High damage, accurate at medium-long range',
    icon: '🎯',
    canBuy: true
  },
  {
    id: 'glxy_smg',
    name: 'SMG-9',
    category: 'weapon',
    price: 1800,
    description: 'Fast firing, excellent for close combat',
    icon: '🔫',
    canBuy: true
  },
  {
    id: 'glxy_shotgun',
    name: 'SG-12 Combat',
    category: 'weapon',
    price: 2000,
    description: 'Devastating at close range',
    icon: '🔫',
    canBuy: true
  },
  {
    id: 'glxy_sniper_rifle',
    name: 'SR-50 Intervention',
    category: 'weapon',
    price: 4750,
    description: 'One shot kill, requires precision',
    icon: '🎯',
    canBuy: true
  },
  {
    id: 'glxy_lmg',
    name: 'LMG-249 SAW',
    category: 'weapon',
    price: 5200,
    description: 'Suppressive fire, large magazine',
    icon: '🔫',
    canBuy: true
  },

  // SECONDARY WEAPONS
  {
    id: 'glxy_heavy_pistol',
    name: 'HP-50 Desert',
    category: 'weapon',
    price: 800,
    description: 'High damage pistol',
    icon: '🔫',
    canBuy: true
  },
  {
    id: 'glxy_machine_pistol',
    name: 'MP-18 Auto',
    category: 'weapon',
    price: 600,
    description: 'Full-auto pistol',
    icon: '🔫',
    canBuy: true
  },

  // ARMOR
  {
    id: 'kevlar_vest',
    name: 'Kevlar Vest',
    category: 'armor',
    price: 650,
    description: 'Reduces incoming bullet damage by 30%',
    icon: '🛡️',
    canBuy: true
  },
  {
    id: 'helmet',
    name: 'Tactical Helmet',
    category: 'armor',
    price: 1000,
    description: 'Protects against headshots, requires Kevlar Vest',
    icon: '⛑️',
    canBuy: true,
    prerequisite: ['kevlar_vest']
  },
  {
    id: 'heavy_armor',
    name: 'Heavy Armor Kit',
    category: 'armor',
    price: 2000,
    description: 'Maximum protection, reduces movement speed',
    icon: '🛡️',
    canBuy: true
  },

  // UTILITY/GRENADES
  {
    id: 'frag_grenade',
    name: 'Fragmentation Grenade',
    category: 'grenade',
    price: 300,
    description: 'Standard explosive grenade',
    icon: '💣',
    canBuy: true
  },
  {
    id: 'smoke_grenade',
    name: 'Smoke Grenade',
    category: 'grenade',
    price: 250,
    description: 'Creates smoke cover for tactical movement',
    icon: '🌫️',
    canBuy: true
  },
  {
    id: 'flash_grenade',
    name: 'Flashbang',
    category: 'grenade',
    price: 200,
    description: 'Blinds enemies in area',
    icon: '⚡',
    canBuy: true
  },
  {
    id: 'molotov',
    name: 'Molotov Cocktail',
    category: 'grenade',
    price: 400,
    description: 'Creates fire area that damages enemies',
    icon: '🔥',
    canBuy: true
  },
  {
    id: 'decoy_grenade',
    name: 'Decoy Grenade',
    category: 'grenade',
    price: 50,
    description: 'Emits fake gunfire sounds',
    icon: '🎭',
    canBuy: true
  },

  // EQUIPMENT
  {
    id: 'defuse_kit',
    name: 'Defuse Kit',
    category: 'equipment',
    price: 400,
    teamRestriction: 'defenders',
    description: 'Defuse bomb faster',
    icon: '🔧',
    canBuy: true
  },
  {
    id: 'rescue_kit',
    name: 'Rescue Kit',
    category: 'equipment',
    price: 400,
    teamRestriction: 'attackers',
    description: 'Rescue hostages faster',
    icon: '🏥',
    canBuy: true
  },
  {
    id: 'tactical_shield',
    name: 'Tactical Shield',
    category: 'equipment',
    price: 1600,
    description: 'Portable ballistic shield',
    icon: '🛡️',
    canBuy: true
  },

  // CLASS-SPECIFIC EQUIPMENT
  {
    id: 'medkit',
    name: 'Medical Kit',
    category: 'equipment',
    price: 800,
    description: 'Heal 50 health points instantly',
    icon: '🏥',
    canBuy: true
  },
  {
    id: 'ammo_pack',
    name: 'Ammo Pack',
    category: 'equipment',
    price: 600,
    description: 'Reserve ammunition for all weapons',
    icon: '📦',
    canBuy: true
  },
  {
    id: 'motion_sensor',
    name: 'Motion Sensor',
    category: 'equipment',
    price: 1000,
    description: 'Detect enemy movement in area',
    icon: '📡',
    canBuy: true
  }
]

// Economy Manager
export class GLXYEconomyManager {
  private playerEconomy: PlayerEconomy
  private buyPhase: BuyPhase
  private roundLossStreak: number
  private teamSide: 'attackers' | 'defenders'
  private purchasedItems: string[] = []

  constructor(teamSide: 'attackers' | 'defenders') {
    this.teamSide = teamSide
    this.roundLossStreak = 0
    this.playerEconomy = {
      credits: GLXY_ECONOMY_SETTINGS.startingCredits,
      roundKills: 0,
      roundDeaths: 0,
      roundWins: 0,
      roundLosses: 0,
      killReward: 0,
      lossBonus: 0,
      plantBonus: 0,
      defuseBonus: 0,
      totalEarnings: 0
    }

    this.buyPhase = {
      canBuy: true,
      timeRemaining: GLXY_ECONOMY_SETTINGS.buyTime,
      phase: 'buy',
      buyTime: GLXY_ECONOMY_SETTINGS.buyTime,
      freezeTime: 15000 // 15 seconds freeze time
    }
  }

  // Get current economy state
  getEconomy(): PlayerEconomy {
    return { ...this.playerEconomy }
  }

  getCredits(): number {
    return this.playerEconomy.credits
  }

  getBuyPhase(): BuyPhase {
    return { ...this.buyPhase }
  }

  // Buy items
  canBuyItem(itemId: string): { canBuy: boolean; reason?: string } {
    const item = GLXY_BUY_ITEMS.find(i => i.id === itemId)
    if (!item) {
      return { canBuy: false, reason: 'Item not found' }
    }

    // Check buy phase
    if (!this.buyPhase.canBuy || this.buyPhase.phase !== 'buy') {
      return { canBuy: false, reason: 'Cannot buy during this phase' }
    }

    // Check credits
    if (this.playerEconomy.credits < item.price) {
      return { canBuy: false, reason: 'Insufficient credits' }
    }

    // Check team restriction
    if (item.teamRestriction && item.teamRestriction !== 'both' && item.teamRestriction !== this.teamSide) {
      return { canBuy: false, reason: 'Item not available for your team' }
    }

    // Check prerequisites
    if (item.prerequisite) {
      for (const prereq of item.prerequisite) {
        if (!this.purchasedItems.includes(prereq)) {
          return { canBuy: false, reason: `Requires ${prereq}` }
        }
      }
    }

    // Check if already purchased (for one-time items)
    if (this.purchasedItems.includes(itemId) && ['armor', 'equipment'].includes(item.category)) {
      return { canBuy: false, reason: 'Already purchased' }
    }

    return { canBuy: true }
  }

  buyItem(itemId: string): { success: boolean; remainingCredits?: number; reason?: string } {
    const canBuy = this.canBuyItem(itemId)
    if (!canBuy.canBuy) {
      return { success: false, reason: canBuy.reason }
    }

    const item = GLXY_BUY_ITEMS.find(i => i.id === itemId)
    if (!item) {
      return { success: false, reason: 'Item not found' }
    }

    // Deduct credits
    this.playerEconomy.credits -= item.price
    this.purchasedItems.push(itemId)

    return {
      success: true,
      remainingCredits: this.playerEconomy.credits
    }
  }

  // Award credits for various actions
  awardKill(isHeadshot: boolean = false): void {
    const baseReward = GLXY_ECONOMY_SETTINGS.killReward
    const headshotBonus = isHeadshot ? GLXY_ECONOMY_SETTINGS.headshotBonus : 0

    this.playerEconomy.killReward += baseReward + headshotBonus
    this.playerEconomy.roundKills++
  }

  awardAssist(): void {
    this.playerEconomy.killReward += GLXY_ECONOMY_SETTINGS.assistBonus
  }

  awardPlant(): void {
    this.playerEconomy.plantBonus += GLXY_ECONOMY_SETTINGS.plantDefuseBonus
  }

  awardDefuse(): void {
    this.playerEconomy.defuseBonus += GLXY_ECONOMY_SETTINGS.plantDefuseBonus
  }

  // Round end processing
  processRoundWin(won: boolean): void {
    if (won) {
      this.playerEconomy.credits += GLXY_ECONOMY_SETTINGS.winRoundBonus
      this.playerEconomy.roundWins++
      this.roundLossStreak = 0
    } else {
      const lossBonus = this.calculateLossBonus()
      this.playerEconomy.credits += lossBonus
      this.playerEconomy.roundLosses++
      this.roundLossStreak++
    }

    // Add kill bonuses
    this.playerEconomy.credits += this.playerEconomy.killReward
    this.playerEconomy.credits += this.playerEconomy.plantBonus
    this.playerEconomy.credits += this.playerEconomy.defuseBonus

    this.playerEconomy.totalEarnings = this.playerEconomy.credits
  }

  private calculateLossBonus(): number {
    const streak = Math.min(this.roundLossStreak, GLXY_ECONOMY_SETTINGS.maxLossStreak)
    if (streak === 0) {
      return GLXY_ECONOMY_SETTINGS.loseRoundBase
    }

    return GLXY_ECONOMY_SETTINGS.loseRoundStreak[streak - 1] || GLXY_ECONOMY_SETTINGS.loseRoundStreak[GLXY_ECONOMY_SETTINGS.loseRoundStreak.length - 1]
  }

  // Start new round
  startNewRound(): void {
    // Clear round-specific earnings
    this.playerEconomy.killReward = 0
    this.playerEconomy.plantBonus = 0
    this.playerEconomy.defuseBonus = 0
    this.playerEconomy.roundKills = 0
    this.playerEconomy.roundDeaths = 0

    // Reset purchased items
    this.purchasedItems = []

    // Start buy phase
    this.buyPhase.canBuy = true
    this.buyPhase.phase = 'buy'
    this.buyPhase.timeRemaining = this.buyPhase.buyTime
  }

  // Update buy phase timer
  updateBuyPhase(deltaTime: number): void {
    if (this.buyPhase.phase === 'buy') {
      this.buyPhase.timeRemaining -= deltaTime

      if (this.buyPhase.timeRemaining <= 0) {
        this.buyPhase.phase = 'freeze'
        this.buyPhase.timeRemaining = this.buyPhase.freezeTime
        this.buyPhase.canBuy = false
      }
    } else if (this.buyPhase.phase === 'freeze') {
      this.buyPhase.timeRemaining -= deltaTime

      if (this.buyPhase.timeRemaining <= 0) {
        this.buyPhase.phase = 'live'
      }
    }
  }

  // Get available items for current player
  getAvailableItems(): GLXYEconomyItem[] {
    return GLXY_BUY_ITEMS.filter(item => {
      // Filter by team restriction
      if (item.teamRestriction && item.teamRestriction !== 'both' && item.teamRestriction !== this.teamSide) {
        return false
      }

      // Check if player can afford
      if (this.playerEconomy.credits < item.price) {
        return false
      }

      // Check prerequisites
      if (item.prerequisite) {
        const hasPrereqs = item.prerequisite.every(prereq => this.purchasedItems.includes(prereq))
        if (!hasPrereqs) {
          return false
        }
      }

      return true
    })
  }

  // Economy recommendations
  getRecommendedLoadout(): GLXYEconomyItem[] {
    const credits = this.playerEconomy.credits
    const recommendations: GLXYEconomyItem[] = []

    // Basic loadout
    if (credits >= 2700) {
      recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'glxy_assault_rifle')!)
      recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'kevlar_vest')!)
      if (credits >= 3350) {
        recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'helmet')!)
      }
    } else if (credits >= 1800) {
      recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'glxy_smg')!)
      recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'kevlar_vest')!)
    } else if (credits >= 800) {
      recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'glaxy_heavy_pistol')!)
    }

    // Add utility based on remaining credits
    const remainingCredits = credits - recommendations.reduce((sum, item) => sum + item.price, 0)

    if (remainingCredits >= 300) {
      recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'frag_grenade')!)
    } else if (remainingCredits >= 250) {
      recommendations.push(GLXY_BUY_ITEMS.find(item => item.id === 'smoke_grenade')!)
    }

    return recommendations
  }

  // Get economy statistics
  getEconomyStats(): {
    totalRounds: number
    winRate: number
    kdr: number
    avgCreditsPerRound: number
    totalEarnings: number
  } {
    const totalRounds = this.playerEconomy.roundWins + this.playerEconomy.roundLosses
    const winRate = totalRounds > 0 ? (this.playerEconomy.roundWins / totalRounds) * 100 : 0
    const kdr = this.playerEconomy.roundDeaths > 0 ? this.playerEconomy.roundKills / this.playerEconomy.roundDeaths : this.playerEconomy.roundKills
    const avgCreditsPerRound = totalRounds > 0 ? this.playerEconomy.totalEarnings / totalRounds : 0

    return {
      totalRounds,
      winRate,
      kdr,
      avgCreditsPerRound,
      totalEarnings: this.playerEconomy.totalEarnings
    }
  }
}

export default GLXYEconomyManager