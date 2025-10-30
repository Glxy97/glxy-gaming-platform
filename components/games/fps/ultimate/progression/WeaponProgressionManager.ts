/**
 * 🔫 WEAPON PROGRESSION MANAGER
 * 
 * Manages weapon levels, XP, unlocks, and challenges
 * Wie CoD Modern Warfare Weapon Progression System
 */

import {
  WeaponProgression,
  WeaponLevelUpEvent,
  WeaponKillEvent,
  WeaponXPSource,
  WEAPON_XP_VALUES,
  getXPForLevel,
  UnlockReward
} from '../types/WeaponProgressionTypes'

// ============================================================================
// WEAPON PROGRESSION MANAGER
// ============================================================================

export class WeaponProgressionManager {
  // Progression Data (persisted)
  private weaponProgressions: Map<string, WeaponProgression> = new Map()
  
  // Event Callbacks
  private onLevelUpCallbacks: Array<(event: WeaponLevelUpEvent) => void> = []
  private onUnlockCallbacks: Array<(reward: UnlockReward) => void> = []
  
  constructor() {
    console.log('🔫 WeaponProgressionManager initialized')
    this.loadProgressions()
  }

  // ============================================================================
  // PROGRESSION TRACKING
  // ============================================================================

  /**
   * Get or create progression for weapon
   */
  getProgression(weaponId: string): WeaponProgression {
    if (!this.weaponProgressions.has(weaponId)) {
      const newProgression = this.createNewProgression(weaponId)
      this.weaponProgressions.set(weaponId, newProgression)
    }
    return this.weaponProgressions.get(weaponId)!
  }

  /**
   * Create new progression entry
   */
  private createNewProgression(weaponId: string): WeaponProgression {
    return {
      weaponId,
      level: 1,
      currentXP: 0,
      nextLevelXP: getXPForLevel(1),
      kills: 0,
      headshots: 0,
      totalShots: 0,
      shotsHit: 0,
      accuracy: 0,
      longestKillDistance: 0,
      killStreak: 0,
      multikills: 0,
      unlockedAttachments: [],
      unlockedSkins: [],
      unlockedCharms: [],
      masteryLevel: 'bronze',
      completedChallenges: []
    }
  }

  // ============================================================================
  // XP & LEVELING
  // ============================================================================

  /**
   * Award XP to weapon
   */
  awardXP(weaponId: string, amount: number, source?: string): void {
    const progression = this.getProgression(weaponId)
    
    // Add XP
    progression.currentXP += amount
    
    console.log(`💰 ${weaponId} +${amount} XP (${progression.currentXP}/${progression.nextLevelXP}) [${source || 'unknown'}]`)
    
    // Check for level up
    while (progression.currentXP >= progression.nextLevelXP && progression.level < 50) {
      this.levelUp(weaponId)
    }
    
    this.saveProgressions()
  }

  /**
   * Level up weapon
   */
  private levelUp(weaponId: string): void {
    const progression = this.getProgression(weaponId)
    const oldLevel = progression.level
    
    // Level up
    progression.level++
    progression.currentXP -= progression.nextLevelXP
    progression.nextLevelXP = getXPForLevel(progression.level)
    
    console.log(`⬆️ ${weaponId} LEVEL UP! ${oldLevel} → ${progression.level}`)
    
    // Get unlock rewards
    const rewards = this.getUnlockRewardsForLevel(weaponId, progression.level)
    
    // Apply unlocks
    rewards.forEach(reward => {
      switch (reward.type) {
        case 'attachment':
          if (!progression.unlockedAttachments.includes(reward.item.id)) {
            progression.unlockedAttachments.push(reward.item.id)
            console.log(`🔓 Unlocked: ${reward.item.name}`)
            this.fireUnlockEvent(reward)
          }
          break
        case 'skin':
          if (!progression.unlockedSkins.includes(reward.item.id)) {
            progression.unlockedSkins.push(reward.item.id)
            console.log(`🎨 Unlocked: ${reward.item.name}`)
            this.fireUnlockEvent(reward)
          }
          break
        case 'charm':
          if (!progression.unlockedCharms.includes(reward.item.id)) {
            progression.unlockedCharms.push(reward.item.id)
            console.log(`✨ Unlocked: ${reward.item.name}`)
            this.fireUnlockEvent(reward)
          }
          break
      }
    })
    
    // Fire level up event
    this.fireLevelUpEvent({
      weaponId,
      oldLevel,
      newLevel: progression.level,
      rewards
    })
    
    this.saveProgressions()
  }

  /**
   * Get unlock rewards for specific level
   */
  private getUnlockRewardsForLevel(weaponId: string, level: number): UnlockReward[] {
    const rewards: UnlockReward[] = []
    
    // Attachments every 5 levels
    if (level % 5 === 0 && level <= 40) {
      rewards.push({
        type: 'attachment',
        item: {
          id: `${weaponId}_attachment_${level}`,
          name: `Level ${level} Attachment`,
          displayName: `Level ${level} Attachment`,
          description: 'Unlocked by leveling up'
        } as any,
        message: `New attachment unlocked at level ${level}!`
      })
    }
    
    // Skins at specific levels
    if (level === 10) {
      rewards.push({
        type: 'skin',
        item: {
          id: `${weaponId}_skin_woodland`,
          name: 'Woodland Camo',
          displayName: 'Woodland Camo',
          rarity: 'common'
        } as any,
        message: 'Woodland Camo unlocked!'
      })
    }
    if (level === 20) {
      rewards.push({
        type: 'skin',
        item: {
          id: `${weaponId}_skin_urban`,
          name: 'Urban Camo',
          displayName: 'Urban Camo',
          rarity: 'rare'
        } as any,
        message: 'Urban Camo unlocked!'
      })
    }
    if (level === 30) {
      rewards.push({
        type: 'skin',
        item: {
          id: `${weaponId}_skin_digital`,
          name: 'Digital Camo',
          displayName: 'Digital Camo',
          rarity: 'epic'
        } as any,
        message: 'Digital Camo unlocked!'
      })
    }
    if (level === 40) {
      rewards.push({
        type: 'skin',
        item: {
          id: `${weaponId}_skin_gold`,
          name: 'Gold',
          displayName: 'Gold',
          rarity: 'legendary'
        } as any,
        message: 'GOLD CAMO unlocked!'
      })
    }
    if (level === 50) {
      rewards.push({
        type: 'skin',
        item: {
          id: `${weaponId}_skin_diamond`,
          name: 'Diamond',
          displayName: 'Diamond',
          rarity: 'mastery'
        } as any,
        message: 'DIAMOND CAMO unlocked!'
      })
    }
    
    return rewards
  }

  // ============================================================================
  // KILL TRACKING
  // ============================================================================

  /**
   * Register a kill with weapon
   */
  registerKill(event: WeaponKillEvent): void {
    const progression = this.getProgression(event.weaponId)
    
    // Update stats
    progression.kills++
    if (event.isHeadshot) {
      progression.headshots++
    }
    if (event.distance > progression.longestKillDistance) {
      progression.longestKillDistance = event.distance
    }
    if (event.isMultikill) {
      progression.multikills++
    }
    
    // Award XP
    let totalXP = event.xpEarned || WEAPON_XP_VALUES.kill
    
    // Bonus XP
    if (event.isHeadshot) totalXP += WEAPON_XP_VALUES.headshot
    if (event.distance > 50) totalXP += WEAPON_XP_VALUES.longshot
    if (event.distance < 5) totalXP += WEAPON_XP_VALUES.pointblank
    if (event.isHipfire) totalXP += WEAPON_XP_VALUES.hipfire
    if (event.isCrouching) totalXP += WEAPON_XP_VALUES.crouching
    if (event.isSliding) totalXP += WEAPON_XP_VALUES.sliding
    if (event.isMultikill) totalXP += WEAPON_XP_VALUES.multikill
    
    this.awardXP(event.weaponId, totalXP, 'kill')
    
    this.saveProgressions()
  }

  /**
   * Register shots fired and hit
   */
  registerShots(weaponId: string, shotsFired: number, shotsHit: number): void {
    const progression = this.getProgression(weaponId)
    
    progression.totalShots += shotsFired
    progression.shotsHit += shotsHit
    
    // Recalculate accuracy
    if (progression.totalShots > 0) {
      progression.accuracy = (progression.shotsHit / progression.totalShots) * 100
    }
    
    this.saveProgressions()
  }

  // ============================================================================
  // MASTERY SYSTEM
  // ============================================================================

  /**
   * Update mastery level
   */
  updateMastery(weaponId: string): void {
    const progression = this.getProgression(weaponId)
    
    // Bronze: Level 10
    if (progression.level >= 10 && progression.masteryLevel === 'bronze') {
      progression.masteryLevel = 'silver'
      console.log(`🥈 ${weaponId} - Silver Mastery achieved!`)
    }
    
    // Silver: Level 20 + 100 kills
    if (progression.level >= 20 && progression.kills >= 100 && progression.masteryLevel === 'silver') {
      progression.masteryLevel = 'gold'
      console.log(`🥇 ${weaponId} - Gold Mastery achieved!`)
    }
    
    // Gold: Level 30 + 500 kills + 50% accuracy
    if (progression.level >= 30 && progression.kills >= 500 && progression.accuracy >= 50 && progression.masteryLevel === 'gold') {
      progression.masteryLevel = 'platinum'
      console.log(`💎 ${weaponId} - Platinum Mastery achieved!`)
    }
    
    // Platinum: Level 40 + 1000 kills + 60% accuracy
    if (progression.level >= 40 && progression.kills >= 1000 && progression.accuracy >= 60 && progression.masteryLevel === 'platinum') {
      progression.masteryLevel = 'diamond'
      console.log(`💠 ${weaponId} - Diamond Mastery achieved!`)
    }
    
    // Diamond: Level 50 + 2500 kills + 70% accuracy
    if (progression.level >= 50 && progression.kills >= 2500 && progression.accuracy >= 70 && progression.masteryLevel === 'diamond') {
      progression.masteryLevel = 'obsidian'
      console.log(`⚫ ${weaponId} - Obsidian Mastery achieved!`)
    }
    
    this.saveProgressions()
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getLevel(weaponId: string): number {
    return this.getProgression(weaponId).level
  }

  getCurrentXP(weaponId: string): number {
    return this.getProgression(weaponId).currentXP
  }

  getNextLevelXP(weaponId: string): number {
    return this.getProgression(weaponId).nextLevelXP
  }

  getKills(weaponId: string): number {
    return this.getProgression(weaponId).kills
  }

  getHeadshots(weaponId: string): number {
    return this.getProgression(weaponId).headshots
  }

  getAccuracy(weaponId: string): number {
    return this.getProgression(weaponId).accuracy
  }

  getMasteryLevel(weaponId: string): string {
    return this.getProgression(weaponId).masteryLevel
  }

  isAttachmentUnlocked(weaponId: string, attachmentId: string): boolean {
    return this.getProgression(weaponId).unlockedAttachments.includes(attachmentId)
  }

  isSkinUnlocked(weaponId: string, skinId: string): boolean {
    return this.getProgression(weaponId).unlockedSkins.includes(skinId)
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  private loadProgressions(): void {
    try {
      const saved = localStorage.getItem('weaponProgressions')
      if (saved) {
        const data = JSON.parse(saved)
        this.weaponProgressions = new Map(Object.entries(data))
        console.log(`📁 Loaded ${this.weaponProgressions.size} weapon progressions`)
      }
    } catch (error) {
      console.warn('Failed to load weapon progressions:', error)
    }
  }

  private saveProgressions(): void {
    try {
      const data = Object.fromEntries(this.weaponProgressions)
      localStorage.setItem('weaponProgressions', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save weapon progressions:', error)
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  onLevelUp(callback: (event: WeaponLevelUpEvent) => void): void {
    this.onLevelUpCallbacks.push(callback)
  }

  onUnlock(callback: (reward: UnlockReward) => void): void {
    this.onUnlockCallbacks.push(callback)
  }

  private fireLevelUpEvent(event: WeaponLevelUpEvent): void {
    this.onLevelUpCallbacks.forEach(cb => cb(event))
  }

  private fireUnlockEvent(reward: UnlockReward): void {
    this.onUnlockCallbacks.forEach(cb => cb(reward))
  }

  // ============================================================================
  // DEBUG & ADMIN
  // ============================================================================

  /**
   * Reset progression for weapon
   */
  resetProgression(weaponId: string): void {
    this.weaponProgressions.delete(weaponId)
    this.saveProgressions()
    console.log(`🗑️ Reset progression for ${weaponId}`)
  }

  /**
   * Set level (for testing)
   */
  setLevel(weaponId: string, level: number): void {
    const progression = this.getProgression(weaponId)
    progression.level = Math.max(1, Math.min(50, level))
    progression.nextLevelXP = getXPForLevel(progression.level)
    this.saveProgressions()
    console.log(`🎚️ Set ${weaponId} to level ${progression.level}`)
  }

  /**
   * Get all progressions (for stats/leaderboards)
   */
  getAllProgressions(): WeaponProgression[] {
    return Array.from(this.weaponProgressions.values())
  }

  /**
   * Get total stats across all weapons
   */
  getTotalStats() {
    const all = this.getAllProgressions()
    return {
      totalKills: all.reduce((sum, p) => sum + p.kills, 0),
      totalHeadshots: all.reduce((sum, p) => sum + p.headshots, 0),
      totalShots: all.reduce((sum, p) => sum + p.totalShots, 0),
      averageAccuracy: all.reduce((sum, p) => sum + p.accuracy, 0) / (all.length || 1),
      maxLevel: Math.max(...all.map(p => p.level), 1),
      weaponsMaxLevel: all.filter(p => p.level === 50).length
    }
  }
}

