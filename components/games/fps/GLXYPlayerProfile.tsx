// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

// Interfaces für Player Profile System
export interface PlayerProfile {
  id: string
  username: string
  email: string
  createdAt: Date
  lastLogin: Date
  totalPlaytime: number
  level: number
  experience: number
  prestige: number
  rank: string
  avatar: string
  banner: string
  title: string
  bio: string
  country: string
  timezone: string
  language: string
  preferences: {
    crosshair: CrosshairSettings
    keybinds: KeybindSettings
    audio: AudioSettings
    graphics: GraphicsSettings
    hud: HUDSettings
  }
  stats: PlayerStats
  achievements: Achievement[]
  loadouts: Loadout[]
  friends: Friend[]
  clans: ClanMember[]
  matchHistory: MatchHistory[]
  progression: ProgressionData
  reputation: ReputationData
}

export interface CrosshairSettings {
  style: 'dot' | 'cross' | 'circle' | 'custom'
  color: string
  size: number
  thickness: number
  opacity: number
  dotSize: number
  gap: number
  outline: boolean
  outlineColor: string
  dynamic: boolean
  movementError: boolean
  firingError: boolean
}

export interface KeybindSettings {
  forward: string
  backward: string
  left: string
  right: string
  jump: string
  crouch: string
  prone: string
  sprint: string
  walk: string
  reload: string
  use: string
  primaryWeapon: string
  secondaryWeapon: string
  melee: string
  tactical: string
  lethal: string
  scoreboard: string
  chat: string
  voiceChat: string
}

export interface AudioSettings {
  masterVolume: number
  musicVolume: number
    sfxVolume: number
  voiceVolume: number
  footstepVolume: number
  weaponVolume: number
  environmentVolume: number
  voiceChat: {
    enabled: boolean
    inputDevice: string
    outputDevice: string
    pushToTalk: boolean
    pushToTalkKey: string
    inputVolume: number
    outputVolume: number
    noiseSuppression: boolean
    echoCancellation: boolean
  }
}

export interface GraphicsSettings {
  quality: 'potato' | 'low' | 'medium' | 'high' | 'ultra' | 'cinematic'
  resolution: { width: number; height: number }
  fullscreen: boolean
  vsync: boolean
  frameRate: number
  fov: number
  brightness: number
  contrast: number
  shadows: 'off' | 'low' | 'medium' | 'high' | 'ultra'
  textures: 'low' | 'medium' | 'high' | 'ultra'
  antiAliasing: 'off' | 'fxaa' | 'msaa2x' | 'msaa4x' | 'msaa8x'
  postProcessing: boolean
  motionBlur: boolean
  depthOfField: boolean
}

export interface HUDSettings {
  showFPS: boolean
  showPing: boolean
  showTime: boolean
  showScore: boolean
  showAmmo: boolean
  showHealth: boolean
  showMinimap: boolean
  showKillfeed: boolean
  minimapSize: number
  minimapOpacity: number
  crosshairScale: number
  hitmarkerStyle: 'default' | 'minimal' | 'fancy'
  damageNumbers: boolean
  killConfirmation: boolean
}

export interface PlayerStats {
  overall: {
    kills: number
    deaths: number
    assists: number
    wins: number
    losses: number
    matches: number
    playtime: number
    score: number
    kd: number
    winRate: number
    accuracy: number
    headshotRate: number
    damageDealt: number
    damageTaken: number
    longestStreak: number
    averageLifeTime: number
    shots: number
    hits: number
  }
  byMode: Record<string, Partial<PlayerStats['overall']>>
  byMap: Record<string, Partial<PlayerStats['overall']>>
  byWeapon: Record<string, {
    kills: number
    shots: number
    hits: number
    headshots: number
    damage: number
    accuracy: number
  }>
  recent: {
    last10Matches: Partial<PlayerStats['overall']>
    last50Matches: Partial<PlayerStats['overall']>
    last100Matches: Partial<PlayerStats['overall']>
  }
  seasonal: Record<string, Partial<PlayerStats['overall']>>
  records: {
    mostKills: number
    mostDamage: number
    longestStreak: number
    fastestWin: number
    mostHeadshots: number
    highestAccuracy: number
    bestKD: number
    mostAssists: number
  }
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'combat' | 'teamplay' | 'progression' | 'special' | 'seasonal'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt?: Date
  reward: {
    experience: number
    title?: string
    avatar?: string
    banner?: string
  }
}

export interface Loadout {
  id: string
  name: string
  primary: WeaponLoadout
  secondary: WeaponLoadout
  melee: WeaponLoadout
  tactical: TacticalEquipment
  lethal: LethalEquipment
  perks: Perk[]
  fieldUpgrade: FieldUpgrade
  killstreaks: Killstreak[]
}

export interface WeaponLoadout {
  id: string
  attachments: WeaponAttachment[]
  camo: string
  charm: string
  killCounter: boolean
}

export interface TacticalEquipment {
  id: string
  count: number
}

export interface LethalEquipment {
  id: string
  count: number
}

export interface Perk {
  id: string
  name: string
  description: string
  icon: string
}

export interface FieldUpgrade {
  id: string
  name: string
  description: string
}

export interface Killstreak {
  id: string
  name: string
  description: string
  killsRequired: number
}

export interface WeaponAttachment {
  slot: string
  id: string
  name: string
}

export interface Friend {
  id: string
  username: string
  avatar: string
  status: 'online' | 'offline' | 'ingame' | 'away'
  currentActivity?: string
  lastSeen: Date
  friendshipLevel: number
  isFavorite: boolean
  isBlocked: boolean
  mutualFriends: number
  clans: string[]
}

export interface ClanMember {
  id: string
  name: string
  tag: string
  role: 'leader' | 'coleader' | 'officer' | 'member' | 'recruit'
  joinedAt: Date
  contribution: number
  isActive: boolean
}

export interface MatchHistory {
  id: string
  mode: string
  map: string
  result: 'win' | 'loss' | 'draw'
  score: number
  kills: number
  deaths: number
  assists: number
  accuracy: number
  headshots: number
  damage: number
  timePlayed: number
  timestamp: Date
  teammates: string[]
  enemies: string[]
  bestKill: {
    distance: number
    weapon: string
    headshot: boolean
  }
}

export interface ProgressionData {
  currentLevel: number
  currentExp: number
  expToNext: number
  totalExp: number
  prestige: number
  maxPrestige: number
  unlocks: Unlock[]
}

export interface Unlock {
  id: string
  name: string
  type: 'weapon' | 'attachment' | 'perk' | 'equipment' | 'cosmetic'
  level: number
  unlocked: boolean
  unlockedAt?: Date
}

export interface ReputationData {
  score: number
  level: string
  badges: string[]
  reports: {
    received: number
    resolved: number
    active: number
  }
  commendations: {
    leadership: number
    teamwork: number
    skill: number
    sportsmanship: number
  }
  sanctions: {
    warnings: number
    mutes: number
    kicks: number
    bans: number
  }
}

// Haupt Player Profile Klasse
export class GLXYPlayerProfile {
  private profile: PlayerProfile | null = null
  private storageKey = 'glxy_player_profile'
  private cloudSyncEnabled = false
  private autoSave = true
  private lastSave = 0
  private saveInterval = 30000 // 30 seconds

  constructor(
    private playerId: string,
    private onProfileUpdated?: (profile: PlayerProfile) => void,
    private onStatsUpdated?: (stats: PlayerStats) => void,
    private onAchievementUnlocked?: (achievement: Achievement) => void
  ) {
    this.loadProfile()
    this.startAutoSave()
  }

  public async createProfile(username: string, email: string): Promise<PlayerProfile> {
    const newProfile: PlayerProfile = {
      id: this.playerId,
      username,
      email,
      createdAt: new Date(),
      lastLogin: new Date(),
      totalPlaytime: 0,
      level: 1,
      experience: 0,
      prestige: 0,
      rank: 'Recruit',
      avatar: '/avatars/default.png',
      banner: '/banners/default.png',
      title: 'Newcomer',
      bio: '',
      country: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      preferences: this.getDefaultPreferences(),
      stats: this.getDefaultStats(),
      achievements: [],
      loadouts: this.getDefaultLoadouts(),
      friends: [],
      clans: [],
      matchHistory: [],
      progression: {
        currentLevel: 1,
        currentExp: 0,
        expToNext: 1000,
        totalExp: 0,
        prestige: 0,
        maxPrestige: 10,
        unlocks: []
      },
      reputation: {
        score: 1000,
        level: 'Neutral',
        badges: ['New Player'],
        reports: {
          received: 0,
          resolved: 0,
          active: 0
        },
        commendations: {
          leadership: 0,
          teamwork: 0,
          skill: 0,
          sportsmanship: 0
        },
        sanctions: {
          warnings: 0,
          mutes: 0,
          kicks: 0,
          bans: 0
        }
      }
    }

    this.profile = newProfile
    await this.saveProfile()
    this.onProfileUpdated?.(newProfile)

    return newProfile
  }

  public getProfile(): PlayerProfile | null {
    return this.profile
  }

  public updateProfile(updates: Partial<PlayerProfile>): void {
    if (!this.profile) return

    this.profile = { ...this.profile, ...updates }
    this.profile.lastLogin = new Date()

    if (this.autoSave) {
      this.saveProfile()
    }

    this.onProfileUpdated?.(this.profile)
  }

  public async updateStats(matchData: Partial<PlayerStats['overall']>): Promise<void> {
    if (!this.profile) return

    // Update overall stats
    if (this.profile && this.profile.stats && this.profile.stats.overall) {
      const overallStats = this.profile.stats.overall
      Object.keys(matchData).forEach(key => {
        if (typeof matchData[key as keyof PlayerStats['overall']] === 'number') {
          (overallStats as any)[key] += (matchData as any)[key]
        }
      })
    }

    // Calculate derived stats
    this.profile.stats.overall.kd = this.profile.stats.overall.deaths > 0
      ? this.profile.stats.overall.kills / this.profile.stats.overall.deaths
      : this.profile.stats.overall.kills

    this.profile.stats.overall.winRate = this.profile.stats.overall.matches > 0
      ? (this.profile.stats.overall.wins / this.profile.stats.overall.matches) * 100
      : 0

    this.profile.stats.overall.accuracy = this.profile.stats.overall.shots > 0
      ? (this.profile.stats.overall.hits / this.profile.stats.overall.shots) * 100
      : 0

    // Update playtime
    this.profile.totalPlaytime += matchData.playtime || 0

    // Add experience
    const expGained = this.calculateExperience(matchData)
    this.addExperience(expGained)

    // Check for achievements
    await this.checkAchievements()

    // Update level and rank
    this.updateLevelAndRank()

    await this.saveProfile()
    this.onStatsUpdated?.(this.profile.stats)
  }

  public addExperience(amount: number): void {
    if (!this.profile) return

    this.profile.experience += amount
    this.profile.progression.currentExp += amount
    this.profile.progression.totalExp += amount

    // Check for level up
    while (this.profile.progression.currentExp >= this.profile.progression.expToNext) {
      this.profile.progression.currentExp -= this.profile.progression.expToNext
      this.profile.progression.currentLevel++
      this.profile.level = this.profile.progression.currentLevel

      // Update exp requirement for next level
      this.profile.progression.expToNext = this.calculateExpForLevel(this.profile.progression.currentLevel + 1)

      console.log(`🎉 Level up! You are now level ${this.profile.level}`)
    }
  }

  public addMatchToHistory(match: MatchHistory): void {
    if (!this.profile) return

    this.profile.matchHistory.unshift(match)

    // Keep only last 100 matches
    if (this.profile.matchHistory.length > 100) {
      this.profile.matchHistory = this.profile.matchHistory.slice(0, 100)
    }

    // Update recent stats
    this.updateRecentStats()
  }

  public unlockAchievement(achievementId: string): void {
    if (!this.profile) return

    const achievement = this.profile.achievements.find(a => a.id === achievementId)
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true
      achievement.unlockedAt = new Date()

      // Apply rewards
      this.addExperience(achievement.reward.experience)

      if (achievement.reward.title) {
        this.profile.title = achievement.reward.title
      }

      this.onAchievementUnlocked?.(achievement)
      console.log(`🏆 Achievement unlocked: ${achievement.name}`)
    }
  }

  public addFriend(friend: Friend): void {
    if (!this.profile) return

    const existingFriend = this.profile.friends.find(f => f.id === friend.id)
    if (!existingFriend) {
      this.profile.friends.push(friend)
    }
  }

  public removeFriend(friendId: string): void {
    if (!this.profile) return

    this.profile.friends = this.profile.friends.filter(f => f.id !== friendId)
  }

  public updateLoadout(loadout: Loadout): void {
    if (!this.profile) return

    const index = this.profile.loadouts.findIndex(l => l.id === loadout.id)
    if (index >= 0) {
      this.profile.loadouts[index] = loadout
    } else {
      this.profile.loadouts.push(loadout)
    }
  }

  public async saveProfile(): Promise<void> {
    if (!this.profile) return

    try {
      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(this.profile))

      // Cloud sync (if enabled)
      if (this.cloudSyncEnabled) {
        await this.syncToCloud()
      }

      this.lastSave = Date.now()
      console.log('💾 Profile saved successfully')
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  public async loadProfile(): Promise<void> {
    try {
      // Load from localStorage
      const savedProfile = localStorage.getItem(this.storageKey)
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        // Convert dates back to Date objects
        profile.createdAt = new Date(profile.createdAt)
        profile.lastLogin = new Date(profile.lastLogin)
        profile.matchHistory = profile.matchHistory.map((match: any) => ({
          ...match,
          timestamp: new Date(match.timestamp)
        }))

        this.profile = profile
        console.log('📂 Profile loaded successfully')
      } else {
        console.log('No existing profile found')
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  public exportProfile(): string {
    if (!this.profile) return ''

    return JSON.stringify(this.profile, null, 2)
  }

  public importProfile(profileData: string): boolean {
    try {
      const importedProfile = JSON.parse(profileData)

      // Validate profile structure
      if (!this.validateProfile(importedProfile)) {
        return false
      }

      this.profile = importedProfile
      this.saveProfile()
      if (this.profile) {
        this.onProfileUpdated?.(this.profile)
      }

      console.log('📥 Profile imported successfully')
      return true
    } catch (error) {
      console.error('Failed to import profile:', error)
      return false
    }
  }

  // Private methods
  private getDefaultPreferences(): PlayerProfile['preferences'] {
    return {
      crosshair: {
        style: 'cross',
        color: '#00ff00',
        size: 2,
        thickness: 1,
        opacity: 0.8,
        dotSize: 1,
        gap: 4,
        outline: false,
        outlineColor: '#000000',
        dynamic: false,
        movementError: false,
        firingError: false
      },
      keybinds: {
        forward: 'KeyW',
        backward: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        jump: 'Space',
        crouch: 'KeyC',
        prone: 'KeyZ',
        sprint: 'ShiftLeft',
        walk: 'AltLeft',
        reload: 'KeyR',
        use: 'KeyE',
        primaryWeapon: 'Digit1',
        secondaryWeapon: 'Digit2',
        melee: 'KeyV',
        tactical: 'Digit4',
        lethal: 'Digit5',
        scoreboard: 'Tab',
        chat: 'KeyT',
        voiceChat: 'KeyV'
      },
      audio: {
        masterVolume: 0.8,
        musicVolume: 0.6,
        sfxVolume: 0.8,
        voiceVolume: 0.9,
        footstepVolume: 0.7,
        weaponVolume: 0.9,
        environmentVolume: 0.6,
        voiceChat: {
          enabled: true,
          inputDevice: 'default',
          outputDevice: 'default',
          pushToTalk: false,
          pushToTalkKey: 'KeyV',
          inputVolume: 0.8,
          outputVolume: 0.8,
          noiseSuppression: true,
          echoCancellation: true
        }
      },
      graphics: {
        quality: 'high',
        resolution: { width: 1920, height: 1080 },
        fullscreen: true,
        vsync: false,
        frameRate: 144,
        fov: 90,
        brightness: 1.0,
        contrast: 1.0,
        shadows: 'high',
        textures: 'high',
        antiAliasing: 'msaa4x',
        postProcessing: true,
        motionBlur: false,
        depthOfField: false
      },
      hud: {
        showFPS: true,
        showPing: true,
        showTime: true,
        showScore: true,
        showAmmo: true,
        showHealth: true,
        showMinimap: true,
        showKillfeed: true,
        minimapSize: 150,
        minimapOpacity: 0.8,
        crosshairScale: 1.0,
        hitmarkerStyle: 'default',
        damageNumbers: true,
        killConfirmation: true
      }
    }
  }

  private getDefaultStats(): PlayerStats {
    return {
      overall: {
        kills: 0,
        deaths: 0,
        assists: 0,
        wins: 0,
        losses: 0,
        matches: 0,
        playtime: 0,
        score: 0,
        kd: 0,
        winRate: 0,
        accuracy: 0,
        headshotRate: 0,
        damageDealt: 0,
        damageTaken: 0,
        longestStreak: 0,
        averageLifeTime: 0,
        shots: 0,
        hits: 0
      },
      byMode: {},
      byMap: {},
      byWeapon: {},
      recent: {
        last10Matches: {
          kills: 0,
          deaths: 0,
          assists: 0,
          wins: 0,
          losses: 0
        },
        last50Matches: {
          kills: 0,
          deaths: 0,
          assists: 0,
          wins: 0,
          losses: 0
        },
        last100Matches: {
          kills: 0,
          deaths: 0,
          assists: 0,
          wins: 0,
          losses: 0
        }
      },
      seasonal: {},
      records: {
        mostKills: 0,
        mostDamage: 0,
        longestStreak: 0,
        fastestWin: 0,
        mostHeadshots: 0,
        highestAccuracy: 0,
        bestKD: 0,
        mostAssists: 0
      }
    }
  }

  private getDefaultLoadouts(): Loadout[] {
    return [
      {
        id: 'default',
        name: 'Default Loadout',
        primary: {
          id: 'm4a1',
          attachments: [],
          camo: 'default',
          charm: '',
          killCounter: true
        },
        secondary: {
          id: 'pistol',
          attachments: [],
          camo: 'default',
          charm: '',
          killCounter: false
        },
        melee: {
          id: 'knife',
          attachments: [],
          camo: 'default',
          charm: '',
          killCounter: false
        },
        tactical: {
          id: 'flashbang',
          count: 2
        },
        lethal: {
          id: 'frag',
          count: 1
        },
        perks: [],
        fieldUpgrade: {
          id: 'ammo_box',
          name: 'Ammo Box',
          description: 'Resupplies ammunition'
        },
        killstreaks: []
      }
    ]
  }

  private calculateExperience(matchData: Partial<PlayerStats['overall']>): number {
    let baseExp = 100

    // Performance bonuses
    if (matchData.kills) baseExp += matchData.kills * 10
    if (matchData.assists) baseExp += matchData.assists * 5
    if (matchData.damageDealt) baseExp += Math.floor(matchData.damageDealt / 100)
    if (matchData.wins) baseExp += matchData.wins * 50

    // Multipliers
    if (matchData.kd && matchData.kd > 2.0) baseExp *= 1.5
    if (matchData.accuracy && matchData.accuracy > 50) baseExp *= 1.2

    return Math.floor(baseExp)
  }

  private calculateExpForLevel(level: number): number {
    return Math.floor(1000 * Math.pow(1.1, level - 1))
  }

  private updateLevelAndRank(): void {
    if (!this.profile) return

    const level = this.profile.level
    let rank = 'Recruit'

    if (level >= 100) rank = 'General'
    else if (level >= 80) rank = 'Colonel'
    else if (level >= 60) rank = 'Major'
    else if (level >= 40) rank = 'Captain'
    else if (level >= 30) rank = 'Lieutenant'
    else if (level >= 20) rank = 'Sergeant'
    else if (level >= 10) rank = 'Corporal'
    else if (level >= 5) rank = 'Private'

    this.profile.rank = rank
  }

  private updateRecentStats(): void {
    if (!this.profile) return

    const recent = this.profile.matchHistory.slice(0, 10)
    const stats = recent.reduce((acc, match) => {
      acc.kills += match.kills
      acc.deaths += match.deaths
      acc.assists += match.assists
      acc.wins += match.result === 'win' ? 1 : 0
      acc.losses += match.result === 'loss' ? 1 : 0
      return acc
    }, { kills: 0, deaths: 0, assists: 0, wins: 0, losses: 0 })

    this.profile.stats.recent.last10Matches = stats
  }

  private async checkAchievements(): Promise<void> {
    if (!this.profile) return

    const achievements = [
      {
        id: 'first_kill',
        name: 'First Blood',
        description: 'Get your first kill',
        icon: '🎯',
        category: 'combat' as const,
        rarity: 'common' as const,
        progress: Math.min(this.profile.stats.overall.kills, 1),
        maxProgress: 1,
        unlocked: false,
        reward: { experience: 50 }
      },
      {
        id: 'kill_streak_5',
        name: 'Killing Spree',
        description: 'Get 5 kills in a row',
        icon: '🔥',
        category: 'combat' as const,
        rarity: 'rare' as const,
        progress: Math.min(this.profile.stats.overall.longestStreak, 5),
        maxProgress: 5,
        unlocked: false,
        reward: { experience: 100 }
      },
      {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Achieve 50% headshot rate',
        icon: '🎩',
        category: 'combat' as const,
        rarity: 'epic' as const,
        progress: Math.min(this.profile.stats.overall.headshotRate, 50),
        maxProgress: 50,
        unlocked: false,
        reward: { experience: 200, title: 'Sharpshooter' }
      }
    ]

    for (const achievement of achievements) {
      const existing = this.profile.achievements.find(a => a.id === achievement.id)
      if (!existing) {
        this.profile.achievements.push(achievement)
      } else if (!existing.unlocked && achievement.progress >= achievement.maxProgress) {
        this.unlockAchievement(achievement.id)
      }
    }
  }

  private async syncToCloud(): Promise<void> {
    // Cloud sync implementation would go here
    console.log('☁️ Syncing profile to cloud...')
  }

  private validateProfile(profile: any): boolean {
    return profile &&
           profile.id &&
           profile.username &&
           profile.stats &&
           profile.preferences
  }

  private startAutoSave(): void {
    if (!this.autoSave) return

    setInterval(() => {
      if (this.profile && Date.now() - this.lastSave > this.saveInterval) {
        this.saveProfile()
      }
    }, this.saveInterval)
  }

  // Getters
  public getStats(): PlayerStats | null {
    return this.profile?.stats || null
  }

  public getAchievements(): Achievement[] {
    return this.profile?.achievements || []
  }

  public getLoadouts(): Loadout[] {
    return this.profile?.loadouts || []
  }

  public getFriends(): Friend[] {
    return this.profile?.friends || []
  }

  public getMatchHistory(): MatchHistory[] {
    return this.profile?.matchHistory || []
  }
}

// React Hook für Player Profile
export const useGLXYPlayerProfile = (
  playerId: string,
  onProfileUpdated?: (profile: PlayerProfile) => void,
  onStatsUpdated?: (stats: PlayerStats) => void,
  onAchievementUnlocked?: (achievement: Achievement) => void
) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [profileManager] = useState(() => new GLXYPlayerProfile(
    playerId,
    onProfileUpdated,
    onStatsUpdated,
    onAchievementUnlocked
  ))

  useEffect(() => {
    const loadedProfile = profileManager.getProfile()
    if (loadedProfile) {
      setProfile(loadedProfile)
    }

    // Set up profile update listener
    const handleProfileUpdate = (updatedProfile: PlayerProfile) => {
      setProfile(updatedProfile)
      onProfileUpdated?.(updatedProfile)
    }

    return () => {
      // Cleanup if needed
    }
  }, [profileManager, onProfileUpdated])

  return {
    profile,
    profileManager,
    createProfile: (username: string, email: string) => profileManager.createProfile(username, email),
    updateProfile: (updates: Partial<PlayerProfile>) => profileManager.updateProfile(updates),
    updateStats: (matchData: Partial<PlayerStats['overall']>) => profileManager.updateStats(matchData),
    addExperience: (amount: number) => profileManager.addExperience(amount),
    addMatchToHistory: (match: MatchHistory) => profileManager.addMatchToHistory(match),
    unlockAchievement: (achievementId: string) => profileManager.unlockAchievement(achievementId),
    saveProfile: () => profileManager.saveProfile(),
    exportProfile: () => profileManager.exportProfile(),
    importProfile: (data: string) => profileManager.importProfile(data)
  }
}

export default GLXYPlayerProfile