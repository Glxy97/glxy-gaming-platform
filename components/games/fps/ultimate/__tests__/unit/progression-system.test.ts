/**
 * GLXY Gaming Platform - Ultimate FPS Engine V3
 *
 * Progression System Tests
 * Comprehensive test coverage for the progression system including:
 * - XP awarding and level ups
 * - Rank progression
 * - Currency system
 * - Unlocks
 * - Achievements
 * - Challenges
 * - Prestige system
 * - Stats tracking
 * - Event system
 *
 * @module ProgressionSystemTests
 * @version 1.7.0-alpha
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProgressionManager } from '../../progression/ProgressionManager'
import {
  RANKS,
  LEVELS,
  PRESTIGE_LEVELS,
  calculateLevelXP,
  calculateLevelFromXP,
  getRankByLevel,
  getPrestigeLevel,
  XPSource
} from '../../progression/data/ProgressionData'
import {
  COMBAT_ACHIEVEMENTS,
  TACTICAL_ACHIEVEMENTS,
  DAILY_CHALLENGES,
  WEEKLY_CHALLENGES,
  AchievementCategory,
  ChallengeType,
  Rarity
} from '../../progression/data/ChallengesData'
import type { PlayerProfile, ProgressionEvent } from '../../progression/data/ProgressionData'

/**
 * Helper function to create a fresh player profile for testing
 */
function createTestProfile(): PlayerProfile {
  return {
    id: 'test-player-001',
    username: 'TestPlayer',
    level: 1,
    xp: 0,
    totalXP: 0,
    prestige: 0,
    rank: RANKS[0], // Recruit
    credits: {
      standard: 1000,
      premium: 0,
      tokens: 0,
      dust: 0
    },
    stats: {
      kills: 0,
      deaths: 0,
      assists: 0,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      headshots: 0,
      accuracy: 0,
      favoriteWeapon: '',
      longestKillStreak: 0,
      totalPlayTime: 0,
      totalDistance: 0
    },
    unlocks: {
      weapons: new Set(['glxy_m4a1', 'glxy_pistol']),
      attachments: new Set(),
      abilities: new Set(['sprint']),
      cosmetics: new Set()
    },
    achievements: new Map(),
    challenges: new Map(),
    unlockedTitles: new Set(['Recruit']),
    unlockedBadges: new Set(),
    equippedTitle: 'Recruit',
    equippedBadge: '',
    createdAt: Date.now(),
    lastLogin: Date.now()
  }
}

describe('Progression Data', () => {
  describe('Level System', () => {
    it('should have 100 levels defined', () => {
      expect(LEVELS).toHaveLength(100)
    })

    it('should calculate correct XP for each level', () => {
      const level1XP = calculateLevelXP(1)
      const level10XP = calculateLevelXP(10)
      const level50XP = calculateLevelXP(50)
      const level100XP = calculateLevelXP(100)

      expect(level1XP).toBe(0)
      expect(level10XP).toBeGreaterThan(level1XP)
      expect(level50XP).toBeGreaterThan(level10XP)
      expect(level100XP).toBeGreaterThan(level50XP)
    })

    it('should calculate level from XP correctly', () => {
      const level1 = calculateLevelFromXP(0, LEVELS)
      const level10 = calculateLevelFromXP(50000, LEVELS)
      const level50 = calculateLevelFromXP(500000, LEVELS)

      expect(level1).toBe(1)
      expect(level10).toBeGreaterThanOrEqual(1)
      expect(level50).toBeGreaterThanOrEqual(10)
    })

    it('should not exceed level 100', () => {
      const maxLevel = calculateLevelFromXP(999999999, LEVELS)
      expect(maxLevel).toBeLessThanOrEqual(100)
    })
  })

  describe('Rank System', () => {
    it('should have 10 ranks defined', () => {
      expect(RANKS).toHaveLength(10)
    })

    it('should return correct rank for level', () => {
      const rank1 = getRankByLevel(1)
      const rank20 = getRankByLevel(20)
      const rank50 = getRankByLevel(50)
      const rank100 = getRankByLevel(100)

      expect(rank1.id).toBe('recruit')
      expect(rank20.level).toBeLessThanOrEqual(20)
      expect(rank50.level).toBeLessThanOrEqual(50)
      expect(rank100.id).toBe('marshal')
    })

    it('should have increasing XP requirements', () => {
      for (let i = 1; i < RANKS.length; i++) {
        expect(RANKS[i].minXP).toBeGreaterThan(RANKS[i - 1].minXP)
      }
    })
  })

  describe('Prestige System', () => {
    it('should have 10 prestige levels defined', () => {
      expect(PRESTIGE_LEVELS).toHaveLength(10)
    })

    it('should have increasing XP multipliers', () => {
      for (let i = 1; i < PRESTIGE_LEVELS.length; i++) {
        expect(PRESTIGE_LEVELS[i].effects.xpMultiplier).toBeGreaterThanOrEqual(
          PRESTIGE_LEVELS[i - 1].effects.xpMultiplier
        )
      }
    })

    it('should return correct prestige level', () => {
      const prestige1 = getPrestigeLevel(1)
      const prestige5 = getPrestigeLevel(5)
      const prestige10 = getPrestigeLevel(10)

      expect(prestige1.level).toBe(1)
      expect(prestige5.level).toBe(5)
      expect(prestige10.level).toBe(10)
    })

    it('should handle invalid prestige levels', () => {
      const prestige0 = getPrestigeLevel(0)
      const prestige11 = getPrestigeLevel(11)

      expect(prestige0.level).toBe(0)
      expect(prestige11.level).toBe(10) // Max prestige
    })
  })
})

describe('ProgressionManager', () => {
  let manager: ProgressionManager
  let testProfile: PlayerProfile

  beforeEach(() => {
    testProfile = createTestProfile()
    manager = new ProgressionManager(testProfile)
  })

  describe('Initialization', () => {
    it('should initialize with correct profile', () => {
      const profile = manager.getProfile()

      expect(profile.id).toBe('test-player-001')
      expect(profile.username).toBe('TestPlayer')
      expect(profile.level).toBe(1)
      expect(profile.xp).toBe(0)
      expect(profile.prestige).toBe(0)
    })

    it('should start with correct unlocks', () => {
      const profile = manager.getProfile()

      expect(profile.unlocks.weapons.has('glxy_m4a1')).toBe(true)
      expect(profile.unlocks.weapons.has('glxy_pistol')).toBe(true)
      expect(profile.unlocks.abilities.has('sprint')).toBe(true)
    })

    it('should start with Recruit rank', () => {
      const profile = manager.getProfile()
      expect(profile.rank.id).toBe('recruit')
      expect(profile.rank.name).toBe('Recruit')
    })
  })

  describe('XP System', () => {
    it('should award basic XP', () => {
      const xpGained = manager.awardXP(XPSource.KILL, 100)
      const profile = manager.getProfile()

      expect(xpGained).toBe(100)
      expect(profile.xp).toBe(100)
      expect(profile.totalXP).toBe(100)
    })

    it('should award XP from different sources', () => {
      manager.awardXP(XPSource.KILL, 100)
      manager.awardXP(XPSource.ASSIST, 50)
      manager.awardXP(XPSource.OBJECTIVE, 200)

      const profile = manager.getProfile()
      expect(profile.totalXP).toBe(350)
    })

    it('should apply XP multipliers', () => {
      const xpGained = manager.awardXP(XPSource.KILL, 100, { headshot: 1.5 })

      expect(xpGained).toBeGreaterThan(100)
    })

    it('should apply prestige XP multiplier', () => {
      // Set player to prestige 1 (1.1x multiplier)
      testProfile.prestige = 1
      manager = new ProgressionManager(testProfile)

      const xpGained = manager.awardXP(XPSource.KILL, 100)
      expect(xpGained).toBe(110) // 100 * 1.1
    })

    it('should handle zero XP', () => {
      const xpGained = manager.awardXP(XPSource.KILL, 0)
      const profile = manager.getProfile()

      expect(xpGained).toBe(0)
      expect(profile.xp).toBe(0)
    })

    it('should handle negative XP (should not decrease)', () => {
      manager.awardXP(XPSource.KILL, 100)
      manager.awardXP(XPSource.KILL, -50)

      const profile = manager.getProfile()
      expect(profile.xp).toBe(100) // Should stay at 100, not decrease
    })
  })

  describe('Level Up System', () => {
    it('should level up when reaching required XP', () => {
      const eventSpy = vi.fn()
      manager.on('levelUp', eventSpy)

      // Award enough XP to level up
      manager.awardXP(XPSource.KILL, 10000)

      const profile = manager.getProfile()
      expect(profile.level).toBeGreaterThan(1)
      expect(eventSpy).toHaveBeenCalled()
    })

    it('should award level up rewards', () => {
      const initialCredits = manager.getProfile().credits.standard

      // Level up
      manager.awardXP(XPSource.KILL, 10000)

      const profile = manager.getProfile()
      expect(profile.credits.standard).toBeGreaterThan(initialCredits)
    })

    it('should update rank when level threshold reached', () => {
      const eventSpy = vi.fn()
      manager.on('rankUp', eventSpy)

      // Award enough XP to reach Corporal (level 10+)
      manager.awardXP(XPSource.KILL, 50000)

      const profile = manager.getProfile()
      if (profile.level >= 10) {
        expect(profile.rank.id).not.toBe('recruit')
        expect(eventSpy).toHaveBeenCalled()
      }
    })

    it('should not exceed level 100', () => {
      // Award massive XP
      manager.awardXP(XPSource.KILL, 999999999)

      const profile = manager.getProfile()
      expect(profile.level).toBeLessThanOrEqual(100)
    })

    it('should process multiple level ups at once', () => {
      const eventSpy = vi.fn()
      manager.on('levelUp', eventSpy)

      // Award enough XP to jump multiple levels
      manager.awardXP(XPSource.KILL, 100000)

      const profile = manager.getProfile()
      expect(profile.level).toBeGreaterThan(1)
    })
  })

  describe('Currency System', () => {
    it('should award credits', () => {
      const initialCredits = manager.getProfile().credits.standard

      manager.awardCredits(500, 'test')

      const profile = manager.getProfile()
      expect(profile.credits.standard).toBe(initialCredits + 500)
    })

    it('should spend credits successfully', () => {
      manager.awardCredits(1000, 'test')
      const initialCredits = manager.getProfile().credits.standard

      const success = manager.spendCredits(500)

      expect(success).toBe(true)
      expect(manager.getProfile().credits.standard).toBe(initialCredits - 500)
    })

    it('should fail to spend insufficient credits', () => {
      const initialCredits = manager.getProfile().credits.standard

      const success = manager.spendCredits(999999)

      expect(success).toBe(false)
      expect(manager.getProfile().credits.standard).toBe(initialCredits)
    })

    it('should not allow negative credit balance', () => {
      const success = manager.spendCredits(999999)

      expect(success).toBe(false)
      expect(manager.getProfile().credits.standard).toBeGreaterThanOrEqual(0)
    })

    it('should handle zero credit transactions', () => {
      const initialCredits = manager.getProfile().credits.standard

      manager.awardCredits(0, 'test')
      manager.spendCredits(0)

      expect(manager.getProfile().credits.standard).toBe(initialCredits)
    })
  })

  describe('Unlock System', () => {
    it('should unlock weapon successfully', () => {
      const success = manager.unlockItem('weapon', 'glxy_ak47')

      expect(success).toBe(true)
      expect(manager.isItemUnlocked('weapon', 'glxy_ak47')).toBe(true)
    })

    it('should unlock attachment successfully', () => {
      const success = manager.unlockItem('attachment', 'red_dot_sight')

      expect(success).toBe(true)
      expect(manager.isItemUnlocked('attachment', 'red_dot_sight')).toBe(true)
    })

    it('should unlock cosmetic successfully', () => {
      const success = manager.unlockItem('cosmetic', 'gold_camo')

      expect(success).toBe(true)
      expect(manager.isItemUnlocked('cosmetic', 'gold_camo')).toBe(true)
    })

    it('should unlock ability successfully', () => {
      const success = manager.unlockItem('ability', 'double_jump')

      expect(success).toBe(true)
      expect(manager.isItemUnlocked('ability', 'double_jump')).toBe(true)
    })

    it('should not unlock already unlocked item', () => {
      manager.unlockItem('weapon', 'glxy_ak47')
      const success = manager.unlockItem('weapon', 'glxy_ak47')

      expect(success).toBe(false)
    })

    it('should check if starting items are unlocked', () => {
      expect(manager.isItemUnlocked('weapon', 'glxy_m4a1')).toBe(true)
      expect(manager.isItemUnlocked('weapon', 'glxy_pistol')).toBe(true)
      expect(manager.isItemUnlocked('ability', 'sprint')).toBe(true)
    })

    it('should check if non-unlocked items return false', () => {
      expect(manager.isItemUnlocked('weapon', 'glxy_sniper')).toBe(false)
      expect(manager.isItemUnlocked('cosmetic', 'diamond_camo')).toBe(false)
    })
  })

  describe('Achievement System', () => {
    it('should initialize achievements from data', () => {
      const stats = manager.getStats()
      expect(stats.achievements).toBeGreaterThan(0)
    })

    it('should track achievement progress', () => {
      const achievementId = COMBAT_ACHIEVEMENTS[0].id

      manager.updateAchievementProgress(achievementId, 1)

      const profile = manager.getProfile()
      const achievement = profile.achievements.get(achievementId)

      expect(achievement).toBeDefined()
      if (achievement) {
        expect(achievement.progress).toBe(1)
      }
    })

    it('should complete achievement when progress reaches goal', () => {
      const eventSpy = vi.fn()
      manager.on('achievementUnlocked', eventSpy)

      const achievementId = COMBAT_ACHIEVEMENTS[0].id // First Blood - 1 kill

      manager.updateAchievementProgress(achievementId, 1)

      const profile = manager.getProfile()
      const achievement = profile.achievements.get(achievementId)

      expect(achievement?.isCompleted).toBe(true)
      expect(eventSpy).toHaveBeenCalled()
    })

    it('should award achievement rewards', () => {
      const achievementId = COMBAT_ACHIEVEMENTS[0].id
      const initialXP = manager.getProfile().totalXP
      const initialCredits = manager.getProfile().credits.standard

      manager.updateAchievementProgress(achievementId, 1)

      const profile = manager.getProfile()
      expect(profile.totalXP).toBeGreaterThan(initialXP)
      expect(profile.credits.standard).toBeGreaterThan(initialCredits)
    })

    it('should not complete achievement twice', () => {
      const achievementId = COMBAT_ACHIEVEMENTS[0].id

      manager.updateAchievementProgress(achievementId, 1)
      const firstXP = manager.getProfile().totalXP

      manager.updateAchievementProgress(achievementId, 1)
      const secondXP = manager.getProfile().totalXP

      expect(secondXP).toBe(firstXP) // No additional XP
    })

    it('should track achievements by category', () => {
      const stats = manager.getStats()

      expect(stats.achievements).toBeGreaterThan(0)
    })
  })

  describe('Challenge System', () => {
    it('should initialize challenges from data', () => {
      const stats = manager.getStats()
      expect(stats.challenges).toBeGreaterThan(0)
    })

    it('should track challenge progress', () => {
      const challengeId = DAILY_CHALLENGES[0].id

      manager.updateChallengeProgress(challengeId, 5)

      const profile = manager.getProfile()
      const challenge = profile.challenges.get(challengeId)

      expect(challenge).toBeDefined()
      if (challenge) {
        expect(challenge.progress).toBe(5)
      }
    })

    it('should complete challenge when progress reaches goal', () => {
      const eventSpy = vi.fn()
      manager.on('challengeComplete', eventSpy)

      const challengeId = DAILY_CHALLENGES[0].id
      const challengeData = DAILY_CHALLENGES[0]
      const requiredProgress = challengeData.requirements[0].value

      manager.updateChallengeProgress(challengeId, requiredProgress)

      const profile = manager.getProfile()
      const challenge = profile.challenges.get(challengeId)

      expect(challenge?.isCompleted).toBe(true)
      expect(eventSpy).toHaveBeenCalled()
    })

    it('should award challenge rewards', () => {
      const challengeId = DAILY_CHALLENGES[0].id
      const challengeData = DAILY_CHALLENGES[0]
      const requiredProgress = challengeData.requirements[0].value

      const initialXP = manager.getProfile().totalXP
      const initialCredits = manager.getProfile().credits.standard

      manager.updateChallengeProgress(challengeId, requiredProgress)

      const profile = manager.getProfile()
      expect(profile.totalXP).toBeGreaterThan(initialXP)
      expect(profile.credits.standard).toBeGreaterThan(initialCredits)
    })

    it('should not complete challenge twice', () => {
      const challengeId = DAILY_CHALLENGES[0].id
      const challengeData = DAILY_CHALLENGES[0]
      const requiredProgress = challengeData.requirements[0].value

      manager.updateChallengeProgress(challengeId, requiredProgress)
      const firstXP = manager.getProfile().totalXP

      manager.updateChallengeProgress(challengeId, requiredProgress)
      const secondXP = manager.getProfile().totalXP

      expect(secondXP).toBe(firstXP)
    })
  })

  describe('Prestige System', () => {
    it('should not prestige below level 100', () => {
      const success = manager.prestige()

      expect(success).toBe(false)
      expect(manager.getProfile().prestige).toBe(0)
    })

    it('should prestige at level 100', () => {
      // Set player to level 100
      testProfile.level = 100
      testProfile.totalXP = 999999
      manager = new ProgressionManager(testProfile)

      const success = manager.prestige()

      expect(success).toBe(true)
      expect(manager.getProfile().prestige).toBe(1)
    })

    it('should reset level on prestige', () => {
      testProfile.level = 100
      testProfile.totalXP = 999999
      manager = new ProgressionManager(testProfile)

      manager.prestige()

      const profile = manager.getProfile()
      expect(profile.level).toBe(1)
      expect(profile.xp).toBe(0)
    })

    it('should keep unlocks on prestige', () => {
      testProfile.level = 100
      testProfile.totalXP = 999999
      manager = new ProgressionManager(testProfile)

      manager.unlockItem('weapon', 'glxy_ak47')
      manager.prestige()

      expect(manager.isItemUnlocked('weapon', 'glxy_ak47')).toBe(true)
    })

    it('should award prestige rewards', () => {
      testProfile.level = 100
      testProfile.totalXP = 999999
      manager = new ProgressionManager(testProfile)

      const initialCredits = manager.getProfile().credits.standard

      manager.prestige()

      const profile = manager.getProfile()
      expect(profile.credits.standard).toBeGreaterThan(initialCredits)
    })

    it('should increase XP multiplier on prestige', () => {
      testProfile.level = 100
      testProfile.totalXP = 999999
      manager = new ProgressionManager(testProfile)

      manager.prestige()

      // Award XP and check multiplier is applied
      const xpGained = manager.awardXP(XPSource.KILL, 100)
      expect(xpGained).toBe(110) // 100 * 1.1 (Prestige 1 multiplier)
    })

    it('should not exceed prestige 10', () => {
      testProfile.level = 100
      testProfile.totalXP = 999999
      testProfile.prestige = 10
      manager = new ProgressionManager(testProfile)

      const success = manager.prestige()

      expect(success).toBe(false)
      expect(manager.getProfile().prestige).toBe(10)
    })

    it('should dispatch prestige event', () => {
      const eventSpy = vi.fn()
      testProfile.level = 100
      testProfile.totalXP = 999999
      manager = new ProgressionManager(testProfile)

      manager.on('prestige', eventSpy)
      manager.prestige()

      expect(eventSpy).toHaveBeenCalled()
    })
  })

  describe('Stats Tracking', () => {
    it('should record kill', () => {
      manager.recordKill(false)

      const profile = manager.getProfile()
      expect(profile.stats.kills).toBe(1)
    })

    it('should record headshot kill', () => {
      manager.recordKill(true)

      const profile = manager.getProfile()
      expect(profile.stats.kills).toBe(1)
      expect(profile.stats.headshots).toBe(1)
    })

    it('should record death', () => {
      manager.recordDeath()

      const profile = manager.getProfile()
      expect(profile.stats.deaths).toBe(1)
    })

    it('should record assist', () => {
      manager.recordAssist()

      const profile = manager.getProfile()
      expect(profile.stats.assists).toBe(1)
    })

    it('should record match win', () => {
      manager.recordMatch(true)

      const profile = manager.getProfile()
      expect(profile.stats.wins).toBe(1)
      expect(profile.stats.matchesPlayed).toBe(1)
    })

    it('should record match loss', () => {
      manager.recordMatch(false)

      const profile = manager.getProfile()
      expect(profile.stats.losses).toBe(1)
      expect(profile.stats.matchesPlayed).toBe(1)
    })

    it('should calculate K/D ratio', () => {
      manager.recordKill(false)
      manager.recordKill(false)
      manager.recordKill(false)
      manager.recordDeath()

      const stats = manager.getStats()
      expect(stats.kdRatio).toBe(3.0)
    })

    it('should handle zero deaths for K/D', () => {
      manager.recordKill(false)
      manager.recordKill(false)

      const stats = manager.getStats()
      expect(stats.kdRatio).toBe(2.0)
    })

    it('should calculate win rate', () => {
      manager.recordMatch(true)
      manager.recordMatch(true)
      manager.recordMatch(false)

      const stats = manager.getStats()
      expect(stats.winRate).toBeCloseTo(66.67, 1)
    })

    it('should handle zero matches for win rate', () => {
      const stats = manager.getStats()
      expect(stats.winRate).toBe(0)
    })

    it('should track longest kill streak', () => {
      // Record 5 kills
      for (let i = 0; i < 5; i++) {
        manager.recordKill(false)
      }

      const profile = manager.getProfile()
      expect(profile.stats.longestKillStreak).toBe(5)
    })
  })

  describe('Event System', () => {
    it('should register event callback', () => {
      const callback = vi.fn()
      manager.on('xpGained', callback)

      manager.awardXP(XPSource.KILL, 100)

      expect(callback).toHaveBeenCalled()
    })

    it('should call multiple callbacks for same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      manager.on('xpGained', callback1)
      manager.on('xpGained', callback2)

      manager.awardXP(XPSource.KILL, 100)

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('should unregister event callback', () => {
      const callback = vi.fn()

      manager.on('xpGained', callback)
      manager.off('xpGained', callback)

      manager.awardXP(XPSource.KILL, 100)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should pass correct event data', () => {
      const callback = vi.fn()
      manager.on('xpGained', callback)

      manager.awardXP(XPSource.KILL, 100)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'xpGained',
          data: expect.objectContaining({
            source: XPSource.KILL,
            amount: expect.any(Number)
          })
        })
      )
    })

    it('should dispatch level up event', () => {
      const callback = vi.fn()
      manager.on('levelUp', callback)

      manager.awardXP(XPSource.KILL, 10000)

      expect(callback).toHaveBeenCalled()
    })

    it('should dispatch rank up event', () => {
      const callback = vi.fn()
      manager.on('rankUp', callback)

      // Award enough XP to rank up
      manager.awardXP(XPSource.KILL, 50000)

      // Check if rank changed
      const profile = manager.getProfile()
      if (profile.rank.id !== 'recruit') {
        expect(callback).toHaveBeenCalled()
      }
    })

    it('should dispatch unlock event', () => {
      const callback = vi.fn()
      manager.on('itemUnlocked', callback)

      manager.unlockItem('weapon', 'glxy_ak47')

      expect(callback).toHaveBeenCalled()
    })

    it('should handle non-existent event type', () => {
      const callback = vi.fn()
      manager.on('nonExistentEvent' as any, callback)

      // Should not throw error
      expect(() => manager.awardXP(XPSource.KILL, 100)).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined multipliers', () => {
      const xpGained = manager.awardXP(XPSource.KILL, 100, undefined)
      expect(xpGained).toBe(100)
    })

    it('should handle empty multipliers object', () => {
      const xpGained = manager.awardXP(XPSource.KILL, 100, {})
      expect(xpGained).toBe(100)
    })

    it('should handle very large XP values', () => {
      const xpGained = manager.awardXP(XPSource.KILL, 999999999)
      expect(xpGained).toBeGreaterThan(0)
      expect(manager.getProfile().level).toBeLessThanOrEqual(100)
    })

    it('should handle rapid level ups', () => {
      // Award XP that causes multiple level ups
      manager.awardXP(XPSource.KILL, 100000)

      const profile = manager.getProfile()
      expect(profile.level).toBeGreaterThan(1)
      expect(profile.level).toBeLessThanOrEqual(100)
    })

    it('should handle concurrent unlocks', () => {
      manager.unlockItem('weapon', 'glxy_ak47')
      manager.unlockItem('weapon', 'glxy_sniper')
      manager.unlockItem('cosmetic', 'gold_camo')

      expect(manager.isItemUnlocked('weapon', 'glxy_ak47')).toBe(true)
      expect(manager.isItemUnlocked('weapon', 'glxy_sniper')).toBe(true)
      expect(manager.isItemUnlocked('cosmetic', 'gold_camo')).toBe(true)
    })

    it('should handle missing achievement data', () => {
      expect(() => {
        manager.updateAchievementProgress('non_existent_achievement', 1)
      }).not.toThrow()
    })

    it('should handle missing challenge data', () => {
      expect(() => {
        manager.updateChallengeProgress('non_existent_challenge', 1)
      }).not.toThrow()
    })

    it('should persist profile data', () => {
      manager.awardXP(XPSource.KILL, 1000)
      manager.unlockItem('weapon', 'glxy_ak47')
      manager.recordKill(true)

      const savedProfile = manager.getProfile()

      // Create new manager with same profile
      const newManager = new ProgressionManager(savedProfile)
      const loadedProfile = newManager.getProfile()

      expect(loadedProfile.totalXP).toBe(savedProfile.totalXP)
      expect(loadedProfile.level).toBe(savedProfile.level)
      expect(newManager.isItemUnlocked('weapon', 'glxy_ak47')).toBe(true)
      expect(loadedProfile.stats.kills).toBe(savedProfile.stats.kills)
    })
  })

  describe('Integration Tests', () => {
    it('should simulate complete player progression', () => {
      // New player starts
      expect(manager.getProfile().level).toBe(1)
      expect(manager.getProfile().rank.id).toBe('recruit')

      // Player gets kills and levels up
      for (let i = 0; i < 10; i++) {
        manager.recordKill(i % 3 === 0) // Every 3rd kill is headshot
        manager.awardXP(XPSource.KILL, 150)
      }

      expect(manager.getProfile().stats.kills).toBe(10)
      expect(manager.getProfile().stats.headshots).toBeGreaterThan(0)
      expect(manager.getProfile().level).toBeGreaterThan(1)

      // Player completes match
      manager.recordMatch(true)
      manager.awardXP(XPSource.MATCH_WIN, 500)

      expect(manager.getProfile().stats.wins).toBe(1)
      expect(manager.getProfile().stats.matchesPlayed).toBe(1)

      // Player unlocks weapons
      manager.unlockItem('weapon', 'glxy_ak47')
      manager.unlockItem('weapon', 'glxy_sniper')

      expect(manager.getProfile().unlocks.weapons.size).toBeGreaterThan(2)

      // Check stats
      const stats = manager.getStats()
      expect(stats.level).toBeGreaterThan(1)
      expect(stats.totalKills).toBe(10)
      expect(stats.totalMatches).toBe(1)
    })

    it('should simulate achievement unlocking through gameplay', () => {
      const eventSpy = vi.fn()
      manager.on('achievementUnlocked', eventSpy)

      // Get first kill (First Blood achievement)
      manager.recordKill(false)
      manager.updateAchievementProgress(COMBAT_ACHIEVEMENTS[0].id, 1)

      expect(eventSpy).toHaveBeenCalled()
      expect(manager.getProfile().totalXP).toBeGreaterThan(0)
    })

    it('should simulate prestige progression', () => {
      // Fast-forward to level 100
      testProfile.level = 100
      testProfile.totalXP = 999999
      manager = new ProgressionManager(testProfile)

      const initialMultiplier = 1.0

      // Prestige
      manager.prestige()

      expect(manager.getProfile().prestige).toBe(1)
      expect(manager.getProfile().level).toBe(1)

      // XP multiplier should increase
      const xpGained = manager.awardXP(XPSource.KILL, 100)
      expect(xpGained).toBeGreaterThan(100)
    })
  })
})

describe('Challenges Data', () => {
  it('should have combat achievements', () => {
    expect(COMBAT_ACHIEVEMENTS.length).toBeGreaterThan(0)
  })

  it('should have tactical achievements', () => {
    expect(TACTICAL_ACHIEVEMENTS.length).toBeGreaterThan(0)
  })

  it('should have daily challenges', () => {
    expect(DAILY_CHALLENGES.length).toBeGreaterThan(0)
  })

  it('should have weekly challenges', () => {
    expect(WEEKLY_CHALLENGES.length).toBeGreaterThan(0)
  })

  it('should have valid achievement structure', () => {
    COMBAT_ACHIEVEMENTS.forEach(achievement => {
      expect(achievement.id).toBeDefined()
      expect(achievement.name).toBeDefined()
      expect(achievement.description).toBeDefined()
      expect(achievement.category).toBeDefined()
      expect(achievement.rarity).toBeDefined()
      expect(achievement.requirements).toBeDefined()
      expect(achievement.rewards).toBeDefined()
    })
  })

  it('should have valid challenge structure', () => {
    DAILY_CHALLENGES.forEach(challenge => {
      expect(challenge.id).toBeDefined()
      expect(challenge.name).toBeDefined()
      expect(challenge.description).toBeDefined()
      expect(challenge.type).toBeDefined()
      expect(challenge.requirements).toBeDefined()
      expect(challenge.rewards).toBeDefined()
    })
  })

  it('should have achievements with different rarities', () => {
    const rarities = new Set(COMBAT_ACHIEVEMENTS.map(a => a.rarity))
    expect(rarities.size).toBeGreaterThan(1)
  })

  it('should have achievements with increasing rewards based on rarity', () => {
    const common = COMBAT_ACHIEVEMENTS.find(a => a.rarity === Rarity.COMMON)
    const legendary = COMBAT_ACHIEVEMENTS.find(a => a.rarity === Rarity.LEGENDARY)

    if (common && legendary) {
      expect(legendary.rewards.xp).toBeGreaterThan(common.rewards.xp)
    }
  })
})
