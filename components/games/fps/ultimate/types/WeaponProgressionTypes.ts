/**
 * 🔫 WEAPON PROGRESSION TYPES
 * 
 * Weapon Level System mit Unlocks und Attachments
 * Wie CoD Modern Warfare / Warzone
 */

// ============================================================================
// WEAPON PROGRESSION
// ============================================================================

export interface WeaponProgression {
  weaponId: string
  
  // Level & XP
  level: number // 1-50
  currentXP: number
  nextLevelXP: number
  
  // Stats
  kills: number
  headshots: number
  totalShots: number
  shotsHit: number
  accuracy: number // Calculated: (shotsHit / totalShots) * 100
  
  // Performance
  longestKillDistance: number
  killStreak: number
  multikills: number
  
  // Unlocks
  unlockedAttachments: string[] // Attachment IDs
  unlockedSkins: string[] // Skin IDs
  unlockedCharms: string[] // Charm IDs
  
  // Mastery
  masteryLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'obsidian'
  completedChallenges: string[] // Challenge IDs
}

// ============================================================================
// WEAPON ATTACHMENTS
// ============================================================================

export interface WeaponAttachment {
  id: string
  name: string
  displayName: string
  description: string
  
  // Category
  type: AttachmentType
  category: AttachmentCategory
  
  // Unlock
  unlockLevel: number // Weapon level required
  unlockChallenge?: WeaponChallenge
  
  // Visual
  modelPath?: string // 3D Model aus Weapon Pack
  icon?: string
  
  // Stats Modifiers
  statModifiers: AttachmentStatModifiers
  
  // Compatibility
  compatibleWeapons?: string[] // If undefined, compatible with all
  incompatibleSlots?: AttachmentType[] // Can't use with these
}

export enum AttachmentType {
  OPTIC = 'optic',
  BARREL = 'barrel',
  MUZZLE = 'muzzle',
  GRIP = 'grip',
  STOCK = 'stock',
  MAGAZINE = 'magazine',
  UNDERBARREL = 'underbarrel',
  LASER = 'laser',
  PERK = 'perk'
}

export enum AttachmentCategory {
  SIGHT = 'sight',
  MUZZLE_DEVICE = 'muzzle_device',
  BARREL_EXTENSION = 'barrel_extension',
  GRIP_ATTACHMENT = 'grip',
  STOCK_ATTACHMENT = 'stock',
  AMMO = 'ammo',
  ACCESSORY = 'accessory'
}

export interface AttachmentStatModifiers {
  // Damage & Range
  damageMultiplier?: number // 0.9 - 1.1
  rangeMultiplier?: number // 0.8 - 1.3
  penetration?: number // +/- absolute value
  
  // Accuracy & Control
  accuracyBonus?: number // +/- absolute %
  recoilMultiplier?: number // 0.7 - 1.2 (lower = less recoil)
  spreadMultiplier?: number // 0.8 - 1.3
  
  // Handling
  adsSpeed?: number // 0.7 - 1.3 (multiplier)
  sprintToFireTime?: number // 0.8 - 1.2
  movementSpeed?: number // 0.9 - 1.1
  
  // Ammo & Reload
  magazineCapacity?: number // +/- absolute
  reserveAmmo?: number // +/- absolute
  reloadSpeed?: number // 0.8 - 1.2 (multiplier)
  
  // Fire Rate
  fireRateMultiplier?: number // 0.9 - 1.1
  
  // Special
  silenced?: boolean // Hide from minimap
  tracerRounds?: boolean // Visual effect
  explosiveRounds?: boolean // Extra damage
}

// ============================================================================
// WEAPON CHALLENGES
// ============================================================================

export interface WeaponChallenge {
  id: string
  name: string
  description: string
  
  // Requirements
  requirement: ChallengeRequirement
  
  // Rewards
  reward: ChallengeReward
  
  // Progress
  currentProgress: number
  targetProgress: number
  isCompleted: boolean
}

export interface ChallengeRequirement {
  type: ChallengeType
  count: number
  conditions?: ChallengeCondition[]
}

export enum ChallengeType {
  KILLS = 'kills',
  HEADSHOTS = 'headshots',
  LONGSHOTS = 'longshots',
  POINTBLANKS = 'pointblanks',
  HIPFIRE = 'hipfire',
  ADS = 'ads',
  MOUNTED = 'mounted',
  CROUCHING = 'crouching',
  SLIDING = 'sliding',
  MULTIKILLS = 'multikills',
  KILLSTREAKS = 'killstreaks',
  NO_ATTACHMENTS = 'no_attachments',
  NO_DEATHS = 'no_deaths'
}

export interface ChallengeCondition {
  type: string
  value: any
}

export interface ChallengeReward {
  type: 'attachment' | 'skin' | 'charm' | 'xp' | 'mastery'
  itemId?: string
  amount?: number
}

// ============================================================================
// WEAPON SKINS
// ============================================================================

export interface WeaponSkin {
  id: string
  name: string
  displayName: string
  description: string
  
  // Visuals
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mastery'
  textureSet?: {
    baseColor?: string
    normal?: string
    metallic?: string
    roughness?: string
  }
  
  // Unlock
  unlockLevel?: number
  unlockChallenge?: string
  cost?: number // Credits
  
  // Effects
  animated?: boolean
  reactive?: boolean // Changes on kills
  killEffect?: string // Special effect on kill
}

// ============================================================================
// WEAPON LOADOUT
// ============================================================================

export interface WeaponLoadout {
  weaponId: string
  
  // Equipped Attachments (max 5 slots)
  attachments: {
    optic?: WeaponAttachment
    barrel?: WeaponAttachment
    muzzle?: WeaponAttachment
    grip?: WeaponAttachment
    stock?: WeaponAttachment
    magazine?: WeaponAttachment
    underbarrel?: WeaponAttachment
    laser?: WeaponAttachment
    perk?: WeaponAttachment
  }
  
  // Equipped Cosmetics
  skin?: WeaponSkin
  charm?: WeaponCharm
  
  // Calculated Stats (with all attachments)
  finalStats: WeaponStatsWithAttachments
}

export interface WeaponCharm {
  id: string
  name: string
  description: string
  model?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockLevel?: number
}

export interface WeaponStatsWithAttachments {
  damage: number
  fireRate: number
  range: number
  accuracy: number
  recoil: number
  adsSpeed: number
  movementSpeed: number
  magazineCapacity: number
}

// ============================================================================
// PROGRESSION EVENTS
// ============================================================================

export interface WeaponLevelUpEvent {
  weaponId: string
  oldLevel: number
  newLevel: number
  rewards: UnlockReward[]
}

export interface UnlockReward {
  type: 'attachment' | 'skin' | 'charm' | 'challenge'
  item: WeaponAttachment | WeaponSkin | WeaponCharm | WeaponChallenge
  message: string
}

export interface WeaponKillEvent {
  weaponId: string
  isHeadshot: boolean
  distance: number
  isHipfire: boolean
  isADS: boolean
  isCrouching: boolean
  isSliding: boolean
  isMultikill: boolean
  xpEarned: number
}

// ============================================================================
// XP SYSTEM
// ============================================================================

export interface WeaponXPSource {
  type: 'kill' | 'headshot' | 'longshot' | 'multikill' | 'challenge' | 'match'
  baseXP: number
  multiplier: number
}

export const WEAPON_XP_VALUES: Record<string, number> = {
  kill: 100,
  headshot: 50, // Bonus
  longshot: 75, // Bonus
  pointblank: 50, // Bonus
  multikill: 100, // Per extra kill
  hipfire: 25, // Bonus
  mounted: 25, // Bonus
  crouching: 25, // Bonus
  sliding: 50, // Bonus
  wallbang: 100, // Bonus
  challenge_complete: 500,
  match_complete: 200
}

/**
 * Calculate XP required for next level
 */
export function getXPForLevel(level: number): number {
  // Exponential curve: 1000 * 1.08^(level-1)
  return Math.floor(1000 * Math.pow(1.08, level - 1))
}

/**
 * Calculate total XP for reaching a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i)
  }
  return total
}

