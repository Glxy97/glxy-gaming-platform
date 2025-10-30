/**
 * 🔥 ULTIMATE FPS ENGINE V5 - ADDICTION EDITION
 * 
 * DAS GEILSTE WEB-FPS-SPIEL ALLER ZEITEN!
 * 
 * Features die süchtig machen:
 * - Physische Projektile mit Bullet-Time
 * - Zerstörbare Umgebung
 * - Wallrun & Sliding Mechaniken  
 * - Kill-Cam System
 * - Dopamin-Reward-System
 * - Skill-Based Matchmaking
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { 
  ProjectilePool,
  SpatialHashGrid,
  BoundingBoxSystem,
  SpawnZoneSystem
} from './OptimizationModules'

// ============================================================
// 🎯 SUCHT-FAKTOR #1: SATISFYING KILL-SYSTEM
// ============================================================

export class KillRewardSystem {
  private comboMultiplier = 1
  private lastKillTime = 0
  private killStreak = 0
  private dopamineEvents: DopamineEvent[] = []
  
  // Satisfying Sound-Stack
  private killSounds = [
    'kill_normal',      // 1 Kill
    'kill_double',      // 2 Kills
    'kill_triple',      // 3 Kills  
    'kill_mega',        // 4 Kills
    'kill_monster',     // 5 Kills
    'kill_godlike',     // 6+ Kills
  ]

  // Visual Rewards
  private screenEffects = {
    bloodSplash: { duration: 0.2, intensity: 1.0 },
    screenShake: { duration: 0.3, intensity: 5 },
    chromatic: { duration: 0.1, intensity: 0.01 },
    slowMotion: { duration: 0.5, scale: 0.3 },
    zoomPunch: { duration: 0.2, intensity: 1.1 }
  }

  registerKill(killData: KillData): DopamineEvent {
    const now = Date.now()
    const timeSinceLastKill = now - this.lastKillTime
    
    // COMBO-SYSTEM - Schnelle Kills = Mehr Punkte
    if (timeSinceLastKill < 3000) {
      this.comboMultiplier = Math.min(this.comboMultiplier + 0.5, 10)
      this.killStreak++
    } else {
      this.comboMultiplier = 1
      this.killStreak = 1
    }
    
    this.lastKillTime = now
    
    // Berechne Belohnungen
    const baseScore = 100
    const headshotBonus = killData.isHeadshot ? 50 : 0
    const distanceBonus = Math.floor(killData.distance / 10) * 10
    const comboBonus = Math.floor(baseScore * (this.comboMultiplier - 1))
    
    const totalScore = Math.floor(
      (baseScore + headshotBonus + distanceBonus + comboBonus) * this.comboMultiplier
    )
    
    // DOPAMIN-TRIGGER
    const event: DopamineEvent = {
      type: this.getKillType(killData),
      score: totalScore,
      streak: this.killStreak,
      multiplier: this.comboMultiplier,
      timestamp: now,
      effects: this.calculateEffects(killData, this.killStreak),
      sound: this.killSounds[Math.min(this.killStreak - 1, this.killSounds.length - 1)],
      message: this.getKillMessage(killData, this.killStreak)
    }
    
    this.dopamineEvents.push(event)
    return event
  }

  private getKillType(data: KillData): KillType {
    if (data.isHeadshot && data.distance > 50) return 'LONGSHOT_HEADSHOT'
    if (data.isHeadshot) return 'HEADSHOT'
    if (data.isWallbang) return 'WALLBANG'
    if (data.isMidair) return 'MIDAIR'
    if (data.isNoScope) return 'NOSCOPE'
    if (data.distance > 75) return 'LONGSHOT'
    return 'NORMAL'
  }

  private calculateEffects(data: KillData, streak: number): ScreenEffect[] {
    const effects: ScreenEffect[] = []
    
    // Base Kill Effect
    effects.push({
      type: 'screenShake',
      intensity: 0.1 * Math.min(streak, 5),
      duration: 0.2
    })
    
    // Headshot = Slow Motion
    if (data.isHeadshot) {
      effects.push({
        type: 'slowMotion',
        intensity: 0.3,
        duration: 0.5
      })
      effects.push({
        type: 'chromatic',
        intensity: 0.02,
        duration: 0.15
      })
    }
    
    // Multi-Kill = Screen Flash
    if (streak > 1) {
      effects.push({
        type: 'screenFlash',
        intensity: 0.3 * Math.min(streak / 3, 1),
        duration: 0.1,
        color: this.getStreakColor(streak)
      })
    }
    
    // Ultra Kill = Zoom Punch
    if (streak >= 5) {
      effects.push({
        type: 'zoomPunch',
        intensity: 1.15,
        duration: 0.3
      })
    }
    
    return effects
  }

  private getStreakColor(streak: number): THREE.Color {
    const colors = [
      0xFFFFFF, // 1 - White
      0xFFFF00, // 2 - Yellow  
      0xFF8800, // 3 - Orange
      0xFF0000, // 4 - Red
      0xFF00FF, // 5 - Magenta
      0x00FFFF, // 6+ - Cyan
    ]
    return new THREE.Color(colors[Math.min(streak - 1, colors.length - 1)])
  }

  private getKillMessage(data: KillData, streak: number): string {
    const messages = {
      1: ['KILL!', 'ELIMINATED!', 'TAKEN DOWN!'],
      2: ['DOUBLE KILL!', 'MULTI-KILL!'],
      3: ['TRIPLE KILL!', 'HAT TRICK!'],
      4: ['MEGA KILL!', 'DOMINATING!'],
      5: ['MONSTER KILL!', 'UNSTOPPABLE!'],
      6: ['GODLIKE!', 'LEGENDARY!'],
      7: ['HOLY SHIT!', 'BEYOND GODLIKE!']
    }
    
    const streakMessages = messages[Math.min(streak, 7)] || messages[7]
    const randomMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)]
    
    // Special Messages
    if (data.isHeadshot && data.distance > 100) return '🎯 INSANE HEADSHOT!'
    if (data.isWallbang) return '💥 WALLBANG!'
    if (data.isMidair) return '🚀 AIRSHOT!'
    if (streak >= 10) return '👑 BOW DOWN TO THE KING!'
    
    return randomMessage
  }
}

// ============================================================
// 🎮 SUCHT-FAKTOR #2: MOVEMENT-SYSTEM (wie Apex/Titanfall)
// ============================================================

export class AdvancedMovementSystem {
  private player: any
  private camera: THREE.Camera
  
  // Movement States
  private state = {
    isSliding: false,
    isWallRunning: false,
    wallRunSide: null as 'left' | 'right' | null,
    slideSpeed: 0,
    momentum: new THREE.Vector3(),
    airControl: 0.3,
    bunnyHopChain: 0,
    lastJumpTime: 0
  }
  
  // Movement Config
  private config = {
    baseSpeed: 8,
    sprintSpeed: 12,
    slideSpeed: 16,
    wallRunSpeed: 14,
    maxMomentum: 20,
    slideBoost: 1.5,
    wallJumpForce: 12,
    bunnyHopWindow: 300, // ms
    perfectBunnyHopBoost: 1.15
  }

  update(deltaTime: number, input: MovementInput): MovementResult {
    let velocity = new THREE.Vector3()
    
    // SLIDE MECHANIK (wie Apex Legends)
    if (input.crouch && this.state.momentum.length() > 10) {
      this.startSlide()
    }
    
    if (this.state.isSliding) {
      velocity = this.updateSlide(deltaTime, input)
    }
    
    // WALLRUN (wie Titanfall)
    const wallCheck = this.checkWalls()
    if (wallCheck.canWallRun && input.sprint) {
      this.startWallRun(wallCheck.side)
    }
    
    if (this.state.isWallRunning) {
      velocity = this.updateWallRun(deltaTime, input)
    }
    
    // BUNNY HOP (wie CS:GO)
    if (input.jump) {
      const now = Date.now()
      const timeSinceLastJump = now - this.state.lastJumpTime
      
      if (timeSinceLastJump < this.config.bunnyHopWindow) {
        // Perfect Bunny Hop!
        this.state.bunnyHopChain++
        const boost = Math.pow(this.config.perfectBunnyHopBoost, Math.min(this.state.bunnyHopChain, 5))
        velocity.multiplyScalar(boost)
        
        // Effekt für Perfect Hop
        this.triggerPerfectHopEffect()
      } else {
        this.state.bunnyHopChain = 0
      }
      
      this.state.lastJumpTime = now
    }
    
    // MOMENTUM SYSTEM
    this.state.momentum.lerp(velocity, deltaTime * 5)
    velocity.add(this.state.momentum.multiplyScalar(0.95))
    
    // Clamp max speed
    if (velocity.length() > this.config.maxMomentum) {
      velocity.normalize().multiplyScalar(this.config.maxMomentum)
    }
    
    return {
      position: velocity.multiplyScalar(deltaTime),
      effects: this.getMovementEffects(),
      speed: velocity.length(),
      state: {...this.state}
    }
  }

  private startSlide(): void {
    if (this.state.isSliding) return
    
    this.state.isSliding = true
    this.state.slideSpeed = this.state.momentum.length() * this.config.slideBoost
    
    // Kamera-Effekt
    this.triggerSlideEffect()
  }

  private updateSlide(deltaTime: number, input: MovementInput): THREE.Vector3 {
    const slideDir = this.state.momentum.clone().normalize()
    this.state.slideSpeed *= 0.98 // Friction
    
    if (this.state.slideSpeed < 5 || !input.crouch) {
      this.state.isSliding = false
    }
    
    return slideDir.multiplyScalar(this.state.slideSpeed)
  }

  private startWallRun(side: 'left' | 'right'): void {
    this.state.isWallRunning = true
    this.state.wallRunSide = side
    
    // Kamera-Tilt für Style
    this.triggerWallRunEffect(side)
  }

  private updateWallRun(deltaTime: number, input: MovementInput): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
    forward.y = 0
    forward.normalize()
    
    // Wall Jump
    if (input.jump) {
      const jumpDir = new THREE.Vector3()
      if (this.state.wallRunSide === 'left') {
        jumpDir.x = 1
      } else {
        jumpDir.x = -1
      }
      jumpDir.y = 1
      jumpDir.normalize().multiplyScalar(this.config.wallJumpForce)
      
      this.state.isWallRunning = false
      this.state.momentum.add(jumpDir)
      
      // Epic Wall Jump Effect
      this.triggerWallJumpEffect()
      
      return jumpDir
    }
    
    return forward.multiplyScalar(this.config.wallRunSpeed)
  }

  private checkWalls(): { canWallRun: boolean, side: 'left' | 'right' } {
    // Raycast nach links und rechts
    // TODO: Implementiere Raycast-Check
    return { canWallRun: false, side: 'left' }
  }

  private triggerSlideEffect(): void {
    // FOV Punch, Camera Tilt, Speed Lines
  }

  private triggerWallRunEffect(side: 'left' | 'right'): void {
    // Camera Tilt, Blur Edges, Speed Effect
  }

  private triggerWallJumpEffect(): void {
    // Screen Shake, FOV Change, Particle Burst
  }

  private triggerPerfectHopEffect(): void {
    // Sound Queue, Visual Indicator, Speed Lines
  }

  private getMovementEffects(): MovementEffect[] {
    const effects: MovementEffect[] = []
    
    if (this.state.isSliding) {
      effects.push({ type: 'motionBlur', intensity: 0.3 })
      effects.push({ type: 'speedLines', intensity: 0.5 })
      effects.push({ type: 'cameraTilt', angle: -15 })
    }
    
    if (this.state.isWallRunning) {
      const tilt = this.state.wallRunSide === 'left' ? -20 : 20
      effects.push({ type: 'cameraTilt', angle: tilt })
      effects.push({ type: 'edgeBlur', intensity: 0.4 })
    }
    
    if (this.state.bunnyHopChain > 2) {
      effects.push({ type: 'fovPunch', intensity: 1.1 })
      effects.push({ type: 'speedLines', intensity: 0.7 })
    }
    
    return effects
  }
}

// ============================================================
// 💥 SUCHT-FAKTOR #3: WAFFEN MIT CHARAKTER
// ============================================================

export class WeaponPersonalitySystem {
  private weapons = {
    'DECIMATOR': {
      name: 'The Decimator',
      type: 'shotgun',
      personality: 'brutal',
      damage: 120,
      fireRate: 60,
      projectileCount: 8,
      spread: 0.1,
      knockback: 15,
      screenShake: 0.3,
      muzzleFlashScale: 2.0,
      sound: 'weapon_decimator',
      killMessage: 'DELETED',
      specialEffect: 'bodyExplode',
      unlockRequirement: { kills: 100 },
      mastery: {
        kills: 0,
        headshots: 0,
        level: 1,
        nextReward: 'goldSkin'
      }
    },
    
    'VAPORIZER': {
      name: 'The Vaporizer',
      type: 'energy',
      personality: 'precise',
      damage: 80,
      fireRate: 180,
      chargeTime: 1.5,
      beamWidth: 0.05,
      penetration: 3, // Geht durch 3 Gegner
      disintegrationEffect: true,
      sound: 'weapon_vaporizer',
      killMessage: 'VAPORIZED',
      specialEffect: 'disintegrate',
      unlockRequirement: { headshots: 50 }
    },
    
    'HELLSTORM': {
      name: 'Hellstorm Launcher',
      type: 'explosive',
      personality: 'chaotic',
      damage: 200,
      splashDamage: 100,
      splashRadius: 10,
      fireRate: 30,
      projectileType: 'rocket',
      projectileSpeed: 30,
      rocketTrail: true,
      cameraShakeRadius: 20,
      sound: 'weapon_hellstorm',
      killMessage: 'OBLITERATED',
      specialEffect: 'nuclearExplosion',
      unlockRequirement: { multiKills: 20 }
    },
    
    'PHANTOM': {
      name: 'Phantom Blade',
      type: 'melee_ranged',
      personality: 'stealthy',
      damage: 150,
      fireRate: 120,
      projectileType: 'blade',
      projectileSpeed: 60,
      projectileReturn: true, // Kommt zurück wie Boomerang
      silenced: true,
      invisibleProjectile: false, // Wird nach 10m unsichtbar
      backstabMultiplier: 3,
      sound: 'weapon_phantom_swoosh',
      killMessage: 'SLICED',
      specialEffect: 'dismember',
      unlockRequirement: { stealthKills: 30 }
    },
    
    'THUNDERBOLT': {
      name: 'Thunderbolt Rifle',
      type: 'electric',
      personality: 'technical',
      damage: 60,
      fireRate: 600,
      chainLightning: true,
      chainTargets: 3,
      chainDamage: 30,
      stunDuration: 0.5,
      overchargeMode: true, // Hält man Feuer, lädt es auf
      sound: 'weapon_thunderbolt',
      killMessage: 'ELECTROCUTED',
      specialEffect: 'electricDischarge',
      unlockRequirement: { chainKills: 15 }
    }
  }

  // Waffen-Fortschritt tracken
  private weaponMastery = new Map<string, WeaponMastery>()

  updateWeaponMastery(weaponId: string, event: MasteryEvent): MasteryReward | null {
    const mastery = this.weaponMastery.get(weaponId) || this.createNewMastery(weaponId)
    
    // Update Stats
    mastery.totalKills += event.kills || 0
    mastery.headshots += event.headshots || 0
    mastery.accuracy = (mastery.shotsHit / mastery.shotsFired) * 100
    
    // Check Level Up
    const xpGained = this.calculateWeaponXP(event)
    mastery.currentXP += xpGained
    
    if (mastery.currentXP >= mastery.nextLevelXP) {
      return this.levelUpWeapon(weaponId, mastery)
    }
    
    return null
  }

  private levelUpWeapon(weaponId: string, mastery: WeaponMastery): MasteryReward {
    mastery.level++
    mastery.currentXP = 0
    mastery.nextLevelXP = mastery.level * 1000
    
    // Unlock Rewards
    const rewards: MasteryReward = {
      level: mastery.level,
      unlocked: []
    }
    
    // Level-basierte Belohnungen
    switch(mastery.level) {
      case 5:
        rewards.unlocked.push({ type: 'skin', id: 'carbon_fiber' })
        break
      case 10:
        rewards.unlocked.push({ type: 'attachment', id: 'extended_mag' })
        break
      case 15:
        rewards.unlocked.push({ type: 'skin', id: 'gold_plated' })
        break
      case 20:
        rewards.unlocked.push({ type: 'attachment', id: 'explosive_rounds' })
        break
      case 25:
        rewards.unlocked.push({ type: 'skin', id: 'diamond' })
        break
      case 30:
        rewards.unlocked.push({ type: 'killEffect', id: 'disintegration' })
        break
    }
    
    return rewards
  }

  private calculateWeaponXP(event: MasteryEvent): number {
    let xp = 0
    xp += (event.kills || 0) * 100
    xp += (event.headshots || 0) * 50
    xp += (event.multiKills || 0) * 200
    xp += (event.longShots || 0) * 150
    return xp
  }
}

// ============================================================
// 🏆 SUCHT-FAKTOR #4: PROGRESSION & UNLOCKS
// ============================================================

export class AddictionProgressionSystem {
  private playerProfile = {
    level: 1,
    prestige: 0,
    totalXP: 0,
    nextLevelXP: 1000,
    
    // Currencies
    credits: 0,
    premiumCurrency: 0,
    
    // Stats für Leaderboards
    stats: {
      totalKills: 0,
      totalDeaths: 0,
      totalHeadshots: 0,
      totalPlayTime: 0,
      winRate: 0,
      kdRatio: 0,
      accuracy: 0,
      favoriteWeapon: '',
      longestKillStreak: 0,
      totalDamageDealt: 0
    },
    
    // Unlocks
    unlockedWeapons: ['assault_rifle'],
    unlockedSkins: [],
    unlockedEmotes: [],
    unlockedTitles: [],
    unlockedBadges: [],
    
    // Daily/Weekly Challenges
    challenges: {
      daily: [],
      weekly: [],
      seasonal: []
    },
    
    // Battle Pass
    battlePass: {
      tier: 1,
      xp: 0,
      isPremium: false,
      rewards: []
    }
  }

  // Loot Box System (wie Overwatch)
  private lootBoxSystem = {
    common: { chance: 0.6, items: ['basic_skins', 'voice_lines'] },
    rare: { chance: 0.3, items: ['animated_skins', 'emotes'] },
    epic: { chance: 0.09, items: ['weapon_skins', 'character_skins'] },
    legendary: { chance: 0.01, items: ['reactive_skins', 'finishers'] }
  }

  awardXP(amount: number, source: string): LevelUpReward | null {
    this.playerProfile.totalXP += amount
    
    // Multiplier für First Win of the Day, Double XP Events etc
    const multiplier = this.getXPMultiplier()
    const finalXP = Math.floor(amount * multiplier)
    
    // Check Level Up
    if (this.playerProfile.totalXP >= this.playerProfile.nextLevelXP) {
      return this.levelUp()
    }
    
    return null
  }

  private levelUp(): LevelUpReward {
    this.playerProfile.level++
    const previousLevel = this.playerProfile.level - 1
    
    // Exponential XP Curve
    this.playerProfile.nextLevelXP = Math.floor(1000 * Math.pow(1.15, this.playerProfile.level))
    
    const reward: LevelUpReward = {
      newLevel: this.playerProfile.level,
      unlockedItems: [],
      credits: 100 * this.playerProfile.level,
      lootBoxes: 0
    }
    
    // Milestone Rewards
    if (this.playerProfile.level % 5 === 0) {
      reward.lootBoxes = 1
    }
    
    if (this.playerProfile.level % 10 === 0) {
      reward.unlockedItems.push({
        type: 'weapon',
        id: this.getUnlockableWeapon(this.playerProfile.level)
      })
    }
    
    if (this.playerProfile.level === 50) {
      // Prestige verfügbar!
      reward.prestigeAvailable = true
    }
    
    return reward
  }

  // Daily Login Bonus (Sucht-Mechanik #1)
  checkDailyLogin(): DailyReward {
    const lastLogin = localStorage.getItem('lastLogin')
    const today = new Date().toDateString()
    
    if (lastLogin !== today) {
      const streak = this.calculateLoginStreak()
      localStorage.setItem('lastLogin', today)
      localStorage.setItem('loginStreak', streak.toString())
      
      return {
        day: streak,
        credits: 100 * Math.min(streak, 7),
        xpBoost: streak >= 7 ? 2.0 : 1.0 + (streak * 0.1),
        specialReward: streak % 7 === 0 ? 'legendary_lootbox' : null
      }
    }
    
    return null
  }

  // Challenge System (Sucht-Mechanik #2)
  generateDailyChallenges(): Challenge[] {
    return [
      {
        id: 'daily_kills_25',
        name: 'Eliminator',
        description: 'Get 25 kills',
        progress: 0,
        target: 25,
        reward: { xp: 500, credits: 100 },
        timeLeft: this.getTimeUntilReset()
      },
      {
        id: 'daily_headshots_10',
        name: 'Marksman',
        description: 'Get 10 headshots',
        progress: 0,
        target: 10,
        reward: { xp: 750, credits: 150 },
        timeLeft: this.getTimeUntilReset()
      },
      {
        id: 'daily_win_3',
        name: 'Victor',
        description: 'Win 3 matches',
        progress: 0,
        target: 3,
        reward: { xp: 1000, lootbox: 'rare' },
        timeLeft: this.getTimeUntilReset()
      }
    ]
  }

  // Battle Pass (Sucht-Mechanik #3)
  updateBattlePass(xp: number): BattlePassReward | null {
    this.playerProfile.battlePass.xp += xp
    const xpPerTier = 1000
    
    if (this.playerProfile.battlePass.xp >= xpPerTier) {
      this.playerProfile.battlePass.tier++
      this.playerProfile.battlePass.xp = 0
      
      return this.getBattlePassReward(this.playerProfile.battlePass.tier)
    }
    
    return null
  }

  private getBattlePassReward(tier: number): BattlePassReward {
    const rewards = {
      free: this.getFreeBattlePassReward(tier),
      premium: this.playerProfile.battlePass.isPremium ? 
        this.getPremiumBattlePassReward(tier) : null
    }
    
    return rewards
  }
}

// ============================================================
// 🎨 SUCHT-FAKTOR #5: JUICE & POLISH
// ============================================================

export class JuicyEffectsSystem {
  private composer: EffectComposer
  private bloomPass: UnrealBloomPass
  
  // Screen Effects Stack
  private activeEffects: ActiveEffect[] = []
  
  // Particle Systems
  private particleSystems = {
    blood: new BloodParticleSystem(),
    sparks: new SparkParticleSystem(),
    smoke: new SmokeParticleSystem(),
    fire: new FireParticleSystem(),
    energy: new EnergyParticleSystem()
  }

  // Hit Marker System
  createHitMarker(position: THREE.Vector3, damage: number, isHeadshot: boolean): void {
    const color = isHeadshot ? 0xFF0000 : 0xFFFFFF
    const size = isHeadshot ? 1.5 : 1.0
    const duration = isHeadshot ? 0.5 : 0.3
    
    // Damage Numbers (wie Borderlands)
    this.spawnDamageNumber(position, damage, color, size)
    
    // Hit Confirm Sound
    const pitch = isHeadshot ? 1.5 : 1.0
    this.playHitSound(pitch)
    
    // Screen Effect
    if (isHeadshot) {
      this.addScreenEffect({
        type: 'redFlash',
        intensity: 0.3,
        duration: 0.15
      })
    }
    
    // Crosshair Animation
    this.animateCrosshair(isHeadshot)
  }

  // Killing Blow Effects
  createKillEffect(victim: THREE.Object3D, weaponType: string): void {
    const position = victim.position.clone()
    
    switch(weaponType) {
      case 'explosive':
        this.createGibEffect(victim)
        this.screenShake(1.0, 0.5)
        break
        
      case 'energy':
        this.createDisintegrationEffect(victim)
        this.addChromaticAberration(0.05, 0.3)
        break
        
      case 'fire':
        this.createBurningEffect(victim)
        this.addHeatDistortion(position, 2.0)
        break
        
      default:
        this.createBloodExplosion(position)
        this.screenShake(0.3, 0.2)
    }
  }

  // Combo Visual Feedback
  showComboFeedback(combo: number): void {
    // Farbe wird intensiver mit höherem Combo
    const intensity = Math.min(combo / 10, 1.0)
    const hue = 60 - (combo * 10) // Von Gelb zu Rot
    
    // Screen Edge Glow
    this.addEdgeGlow(hue, intensity)
    
    // Speed Lines bei hohem Combo
    if (combo >= 3) {
      this.addSpeedLines(intensity)
    }
    
    // FOV Punch bei Combo
    this.fovPunch(1 + (combo * 0.02))
  }

  // Environmental Destruction
  createEnvironmentalDamage(impact: THREE.Vector3, weapon: string): void {
    // Bullet Holes
    this.createBulletHole(impact)
    
    // Debris Particles
    this.particleSystems.sparks.emit(impact, 20)
    
    // Decals
    this.createDecal(impact, weapon)
    
    // Sound
    this.playImpactSound(impact, 'concrete')
  }

  // Ultra-Satisfying Reload
  createReloadEffects(weapon: any): void {
    // Magazine Drop Physics
    this.dropMagazine(weapon.position)
    
    // Satisfying Click Sound
    this.playReloadSound(weapon.type)
    
    // Haptic Feedback (wenn Controller)
    this.triggerHaptic(0.2, 100)
    
    // UI Animation
    this.animateAmmoCounter()
  }
}

// ============================================================
// 🌐 SUCHT-FAKTOR #6: MULTIPLAYER & SOCIAL
// ============================================================

export class SocialAddictionSystem {
  // Emote System
  private emotes = {
    'default_dance': { animation: 'dance', duration: 3 },
    'tbag': { animation: 'tbag', duration: 1 },
    'gg': { animation: 'gg', duration: 2 },
    'toxic': { animation: 'toxic', duration: 2.5 }
  }

  // Kill Cam System
  async playKillCam(killData: KillCamData): Promise<void> {
    // 5 Sekunden vor dem Kill zeigen
    const replayDuration = 5000
    const slowMoDuration = 1000
    
    // Zeitlupe beim Kill
    await this.replayFromPerspective(killData.killer, replayDuration)
    await this.slowMotionReplay(killData.moment, slowMoDuration)
    
    // Zeige Statistiken
    this.showKillStats(killData)
  }

  // Play of the Game
  recordHighlight(event: HighlightEvent): void {
    // Automatisch beste Momente aufnehmen
    if (event.score > this.currentBestPlay.score) {
      this.currentBestPlay = {
        player: event.player,
        score: event.score,
        timestamp: Date.now(),
        duration: 10000,
        type: event.type // 'multikill', 'clutch', 'ace'
      }
    }
  }

  // Taunts nach Kill
  playTaunt(type: 'voice' | 'emote'): void {
    // Automatische Taunts nach Epic Kills
    const taunts = [
      'Ez game ez life',
      'Sit down!',
      'Deleted!',
      'Next!'
    ]
    // Display über Leiche
  }

  // Clan/Squad System
  private squadBonuses = {
    xpBoost: 1.2, // 20% mehr XP in Squad
    reviveEnabled: true,
    sharedChallenges: true,
    voiceChat: true
  }
}

// ============================================================
// 🎯 INTEGRATION IN ENGINE V4
// ============================================================

export class UltimateFPSEngineV5 extends UltimateFPSEngineV4 {
  // Neue Sucht-Systeme
  private killRewardSystem!: KillRewardSystem
  private movementSystem!: AdvancedMovementSystem  
  private weaponPersonality!: WeaponPersonalitySystem
  private progression!: AddictionProgressionSystem
  private juicyEffects!: JuicyEffectsSystem
  private socialSystem!: SocialAddictionSystem

  // Performance-Systeme
  private projectilePool!: ProjectilePool
  private spatialGrid!: SpatialHashGrid
  private boundingBoxSystem!: BoundingBoxSystem
  private spawnZoneSystem!: SpawnZoneSystem

  constructor(container: HTMLElement, ...args: any[]) {
    super(container, ...args)
    
    console.log('🔥 INITIALIZING ADDICTION ENGINE V5...')
    
    // Initialize Addiction Systems
    this.killRewardSystem = new KillRewardSystem()
    this.movementSystem = new AdvancedMovementSystem()
    this.weaponPersonality = new WeaponPersonalitySystem()
    this.progression = new AddictionProgressionSystem()
    this.juicyEffects = new JuicyEffectsSystem()
    this.socialSystem = new SocialAddictionSystem()
    
    // Initialize Performance Systems
    this.projectilePool = new ProjectilePool(this.scene)
    this.spatialGrid = new SpatialHashGrid(10)
    this.boundingBoxSystem = new BoundingBoxSystem()
    this.spawnZoneSystem = new SpawnZoneSystem()
    
    console.log('🎮 ADDICTION ENGINE V5 READY!')
    console.log('💉 DOPAMINE SYSTEMS: ACTIVE')
    console.log('🚀 PERFORMANCE: OPTIMIZED')
    console.log('🔥 GAMEPLAY: ADDICTIVE AF')
  }

  // Override shoot für mehr JUICE
  protected shootWeapon(): void {
    const weapon = this.weaponPersonality.weapons[this.currentWeaponId]
    
    // Physische Projektile für ALLE Waffen (sichtbar = geiler)
    const projectile = this.projectilePool.getProjectile(true)
    if (!projectile) return
    
    // Weapon-spezifische Effekte
    this.juicyEffects.createMuzzleFlash(weapon)
    this.juicyEffects.screenShake(weapon.screenShake)
    
    // Rest der Shoot-Logik...
    super.shootWeapon()
  }

  // Override kill für DOPAMIN
  protected onEnemyKilled(enemy: any, weapon: any): void {
    const killData = {
      victim: enemy,
      weapon: weapon,
      distance: this.player.position.distanceTo(enemy.position),
      isHeadshot: Math.random() > 0.7, // TODO: Echte Headshot-Detection
      isWallbang: false,
      isMidair: !this.player.isGrounded,
      isNoScope: !this.player.isAiming
    }
    
    // DOPAMIN-EXPLOSION
    const dopamineEvent = this.killRewardSystem.registerKill(killData)
    
    // Zeige alle Effekte
    this.showKillEffects(dopamineEvent)
    
    // Update Progression
    this.progression.awardXP(dopamineEvent.score, 'kill')
    
    // Weapon Mastery
    this.weaponPersonality.updateWeaponMastery(weapon.id, {
      kills: 1,
      headshots: killData.isHeadshot ? 1 : 0
    })
  }

  private showKillEffects(event: DopamineEvent): void {
    // Screen Effects
    event.effects.forEach(effect => {
      this.juicyEffects.applyScreenEffect(effect)
    })
    
    // Sound
    this.audioManager.playSound(event.sound)
    
    // UI
    this.uiManager.showKillMessage(event.message)
    this.uiManager.showScore(`+${event.score}`)
    
    // Combo Indicator
    if (event.multiplier > 1) {
      this.uiManager.showCombo(event.multiplier)
    }
  }
}

// ============================================================
// TYPES
// ============================================================

interface DopamineEvent {
  type: KillType
  score: number
  streak: number
  multiplier: number
  timestamp: number
  effects: ScreenEffect[]
  sound: string
  message: string
}

interface KillData {
  victim: any
  weapon: any
  distance: number
  isHeadshot: boolean
  isWallbang: boolean
  isMidair: boolean
  isNoScope: boolean
}

type KillType = 'NORMAL' | 'HEADSHOT' | 'LONGSHOT' | 'WALLBANG' | 
                'MIDAIR' | 'NOSCOPE' | 'LONGSHOT_HEADSHOT'

interface ScreenEffect {
  type: string
  intensity: number
  duration: number
  color?: THREE.Color
}

interface MovementInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean
  sprint: boolean
}

interface MovementResult {
  position: THREE.Vector3
  effects: MovementEffect[]
  speed: number
  state: any
}

interface MovementEffect {
  type: string
  intensity: number
  angle?: number
}

// ... weitere Interfaces

/**
 * 🎮 DAS WARS! 
 * 
 * Mit diesem System wird das Spiel:
 * - SÜCHTIG MACHEND durch Dopamin-Mechaniken
 * - SMOOTH durch optimierte Performance
 * - GEIL durch Movement-System wie Apex
 * - BEFRIEDIGEND durch Progression
 * - VIRAL durch Social Features
 * 
 * = DAS BESTE WEB-FPS-SPIEL! 🔥
 */
