// @ts-nocheck
/**
 * GLXY FPS Enhanced - Weapon Balancing System
 * Dynamic weapon balancing with real-time adjustments and data-driven metrics
 */

import * as THREE from 'three'

export interface WeaponStats {
  id: string
  name: string
  type: 'assault' | 'smg' | 'sniper' | 'shotgun' | 'pistol' | 'heavy' | 'melee' | 'special'
  damage: number
  fireRate: number
  range: number
  accuracy: number
  recoil: number
  magazineSize: number
  reserveAmmo: number
  reloadTime: number
  aimDownSightTime: number
  movementSpeed: number
  penetration: number
  headshotMultiplier: number
  limbDamageMultiplier: number
  effectiveRange: number
  bulletVelocity: number
  bulletDrop: number
  spread: {
    hip: number
    ads: number
    moving: number
    jumping: number
  }
  recoilPattern: {
    horizontal: number
    vertical: number
    randomness: number
    recovery: number
  }
  handling: {
    equipTime: number
    unequipTime: number
    sprintToFireTime: number
    jumpToFireTime: number
  }
  unlockLevel: number
  cost: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  tags: string[]
}

export interface WeaponPerformanceMetrics {
  weaponId: string
  totalKills: number
  totalShots: number
  totalHits: number
  totalDamage: number
  headshots: number
  bodyshots: number
  limbshots: number
  averageKillDistance: number
  averageKillTime: number
  timeToKill: number
  killsPerMinute: number
  accuracy: number
  headshotPercentage: number
  damagePerSecond: number
  effectivenessScore: number
  popularityScore: number
  winRateWithWeapon: number
  usageCount: number
  lastUpdated: number
}

export interface BalanceAdjustment {
  weaponId: string
  timestamp: number
  type: 'buff' | 'nerf' | 'rework'
  changes: {
    damage?: { old: number; new: number; reason: string }
    fireRate?: { old: number; new: number; reason: string }
    accuracy?: { old: number; new: number; reason: string }
    recoil?: { old: number; new: number; reason: string }
    range?: { old: number; new: number; reason: string }
    magazineSize?: { old: number; new: number; reason: string }
    reloadTime?: { old: number; new: number; reason: string }
  }
  reason: string
  impact: 'minor' | 'moderate' | 'major'
  autoAdjustment: boolean
}

export interface WeaponBalanceConfig {
  autoBalancingEnabled: boolean
  balanceInterval: number // in hours
  minSampleSize: number
  performanceThreshold: number
  maxAdjustmentPercentage: number
  targetWinRate: number
  targetPickRate: number
  targetKDR: number
  categories: {
    assault: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
    smg: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
    sniper: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
    shotgun: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
    pistol: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
    heavy: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
    melee: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
    special: { targetDamage: number; targetFireRate: number; targetAccuracy: number }
  }
}

export class GLXYWeaponBalancing {
  private weapons: Map<string, WeaponStats> = new Map()
  private performanceMetrics: Map<string, WeaponPerformanceMetrics> = new Map()
  private balanceHistory: BalanceAdjustment[] = []
  private config: WeaponBalanceConfig
  private lastBalanceUpdate: number = 0
  private isBalancing: boolean = false
  private balanceCallbacks: {
    onWeaponAdjusted?: (adjustment: BalanceAdjustment) => void
    onBalanceComplete?: (results: BalanceAdjustment[]) => void
    onMetricUpdate?: (weaponId: string, metrics: WeaponPerformanceMetrics) => void
  } = {}

  constructor(config?: Partial<WeaponBalanceConfig>) {
    this.config = this.createDefaultConfig()
    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.initializeWeapons()
    this.startAutoBalancing()
  }

  private createDefaultConfig(): WeaponBalanceConfig {
    return {
      autoBalancingEnabled: true,
      balanceInterval: 24, // 24 hours
      minSampleSize: 1000,
      performanceThreshold: 0.15,
      maxAdjustmentPercentage: 0.25,
      targetWinRate: 0.5,
      targetPickRate: 0.1,
      targetKDR: 1.0,
      categories: {
        assault: { targetDamage: 35, targetFireRate: 600, targetAccuracy: 0.75 },
        smg: { targetDamage: 25, targetFireRate: 800, targetAccuracy: 0.65 },
        sniper: { targetDamage: 120, targetFireRate: 30, targetAccuracy: 0.95 },
        shotgun: { targetDamage: 80, targetFireRate: 120, targetAccuracy: 0.45 },
        pistol: { targetDamage: 45, targetFireRate: 180, targetAccuracy: 0.80 },
        heavy: { targetDamage: 60, targetFireRate: 450, targetAccuracy: 0.70 },
        melee: { targetDamage: 100, targetFireRate: 60, targetAccuracy: 0.95 },
        special: { targetDamage: 75, targetFireRate: 300, targetAccuracy: 0.85 }
      }
    }
  }

  private initializeWeapons(): void {
    // Initialize with default weapon stats
    const defaultWeapons: WeaponStats[] = [
      {
        id: 'glxy_m4a1',
        name: 'GLXY M4A1 Elite',
        type: 'assault',
        damage: 35,
        fireRate: 750,
        range: 100,
        accuracy: 0.85,
        recoil: 0.3,
        magazineSize: 30,
        reserveAmmo: 150,
        reloadTime: 2.5,
        aimDownSightTime: 0.25,
        movementSpeed: 0.95,
        penetration: 0.4,
        headshotMultiplier: 2.0,
        limbDamageMultiplier: 0.8,
        effectiveRange: 60,
        bulletVelocity: 800,
        bulletDrop: 0.1,
        spread: {
          hip: 0.08,
          ads: 0.02,
          moving: 0.12,
          jumping: 0.25
        },
        recoilPattern: {
          horizontal: 0.15,
          vertical: 0.25,
          randomness: 0.1,
          recovery: 0.8
        },
        handling: {
          equipTime: 0.5,
          unequipTime: 0.4,
          sprintToFireTime: 0.3,
          jumpToFireTime: 0.4
        },
        unlockLevel: 1,
        cost: 0,
        rarity: 'common',
        tags: ['assault', 'versatile', 'balanced']
      },
      {
        id: 'glxy_ak47',
        name: 'GLXY AK-47 Vanguard',
        type: 'assault',
        damage: 45,
        fireRate: 600,
        range: 90,
        accuracy: 0.75,
        recoil: 0.45,
        magazineSize: 30,
        reserveAmmo: 150,
        reloadTime: 2.8,
        aimDownSightTime: 0.3,
        movementSpeed: 0.92,
        penetration: 0.6,
        headshotMultiplier: 2.2,
        limbDamageMultiplier: 0.85,
        effectiveRange: 50,
        bulletVelocity: 715,
        bulletDrop: 0.15,
        spread: {
          hip: 0.10,
          ads: 0.03,
          moving: 0.15,
          jumping: 0.30
        },
        recoilPattern: {
          horizontal: 0.25,
          vertical: 0.35,
          randomness: 0.15,
          recovery: 0.6
        },
        handling: {
          equipTime: 0.6,
          unequipTime: 0.5,
          sprintToFireTime: 0.4,
          jumpToFireTime: 0.5
        },
        unlockLevel: 5,
        cost: 1200,
        rarity: 'uncommon',
        tags: ['assault', 'high_damage', 'high_recoil']
      },
      {
        id: 'glxy_awp',
        name: 'GLXY AWP Phantom',
        type: 'sniper',
        damage: 120,
        fireRate: 30,
        range: 200,
        accuracy: 0.98,
        recoil: 0.8,
        magazineSize: 5,
        reserveAmmo: 25,
        reloadTime: 4.0,
        aimDownSightTime: 0.6,
        movementSpeed: 0.8,
        penetration: 0.9,
        headshotMultiplier: 3.0,
        limbDamageMultiplier: 0.7,
        effectiveRange: 150,
        bulletVelocity: 1200,
        bulletDrop: 0.05,
        spread: {
          hip: 0.15,
          ads: 0.001,
          moving: 0.12,
          jumping: 0.20
        },
        recoilPattern: {
          horizontal: 0.05,
          vertical: 0.4,
          randomness: 0.02,
          recovery: 0.9
        },
        handling: {
          equipTime: 0.8,
          unequipTime: 0.6,
          sprintToFireTime: 0.7,
          jumpToFireTime: 0.9
        },
        unlockLevel: 15,
        cost: 3500,
        rarity: 'epic',
        tags: ['sniper', 'one_shot', 'long_range']
      },
      {
        id: 'glxy_mp5',
        name: 'GLXY MP5 Shadow',
        type: 'smg',
        damage: 25,
        fireRate: 900,
        range: 40,
        accuracy: 0.70,
        recoil: 0.2,
        magazineSize: 40,
        reserveAmmo: 200,
        reloadTime: 2.0,
        aimDownSightTime: 0.2,
        movementSpeed: 1.0,
        penetration: 0.2,
        headshotMultiplier: 1.8,
        limbDamageMultiplier: 0.75,
        effectiveRange: 25,
        bulletVelocity: 400,
        bulletDrop: 0.2,
        spread: {
          hip: 0.06,
          ads: 0.02,
          moving: 0.08,
          jumping: 0.18
        },
        recoilPattern: {
          horizontal: 0.08,
          vertical: 0.15,
          randomness: 0.05,
          recovery: 0.9
        },
        handling: {
          equipTime: 0.3,
          unequipTime: 0.2,
          sprintToFireTime: 0.15,
          jumpToFireTime: 0.25
        },
        unlockLevel: 3,
        cost: 800,
        rarity: 'common',
        tags: ['smg', 'close_quarters', 'high_fire_rate']
      },
      {
        id: 'glxy_pump_shotgun',
        name: 'GLXY Pump-Action Havoc',
        type: 'shotgun',
        damage: 80,
        fireRate: 120,
        range: 25,
        accuracy: 0.45,
        recoil: 0.6,
        magazineSize: 8,
        reserveAmmo: 40,
        reloadTime: 3.5,
        aimDownSightTime: 0.35,
        movementSpeed: 0.9,
        penetration: 0.3,
        headshotMultiplier: 1.5,
        limbDamageMultiplier: 0.9,
        effectiveRange: 15,
        bulletVelocity: 300,
        bulletDrop: 0.3,
        spread: {
          hip: 0.20,
          ads: 0.12,
          moving: 0.25,
          jumping: 0.35
        },
        recoilPattern: {
          horizontal: 0.2,
          vertical: 0.3,
          randomness: 0.1,
          recovery: 0.7
        },
        handling: {
          equipTime: 0.7,
          unequipTime: 0.5,
          sprintToFireTime: 0.4,
          jumpToFireTime: 0.6
        },
        unlockLevel: 8,
        cost: 1800,
        rarity: 'rare',
        tags: ['shotgun', 'close_quarters', 'high_damage']
      },
      {
        id: 'glxy_desert_eagle',
        name: 'GLXY Desert Eagle X',
        type: 'pistol',
        damage: 65,
        fireRate: 180,
        range: 35,
        accuracy: 0.90,
        recoil: 0.5,
        magazineSize: 7,
        reserveAmmo: 35,
        reloadTime: 2.2,
        aimDownSightTime: 0.18,
        movementSpeed: 0.98,
        penetration: 0.5,
        headshotMultiplier: 2.5,
        limbDamageMultiplier: 0.8,
        effectiveRange: 20,
        bulletVelocity: 450,
        bulletDrop: 0.12,
        spread: {
          hip: 0.04,
          ads: 0.01,
          moving: 0.06,
          jumping: 0.12
        },
        recoilPattern: {
          horizontal: 0.12,
          vertical: 0.25,
          randomness: 0.08,
          recovery: 0.85
        },
        handling: {
          equipTime: 0.2,
          unequipTime: 0.15,
          sprintToFireTime: 0.12,
          jumpToFireTime: 0.2
        },
        unlockLevel: 2,
        cost: 500,
        rarity: 'common',
        tags: ['pistol', 'high_damage', 'sidearm']
      }
    ]

    defaultWeapons.forEach(weapon => {
      this.weapons.set(weapon.id, weapon)
      this.performanceMetrics.set(weapon.id, this.initializeMetrics(weapon.id))
    })
  }

  private initializeMetrics(weaponId: string): WeaponPerformanceMetrics {
    return {
      weaponId,
      totalKills: 0,
      totalShots: 0,
      totalHits: 0,
      totalDamage: 0,
      headshots: 0,
      bodyshots: 0,
      limbshots: 0,
      averageKillDistance: 0,
      averageKillTime: 0,
      timeToKill: 0,
      killsPerMinute: 0,
      accuracy: 0,
      headshotPercentage: 0,
      damagePerSecond: 0,
      effectivenessScore: 0,
      popularityScore: 0,
      winRateWithWeapon: 0,
      usageCount: 0,
      lastUpdated: Date.now()
    }
  }

  private startAutoBalancing(): void {
    if (!this.config.autoBalancingEnabled) return

    setInterval(() => {
      const now = Date.now()
      const hoursSinceLastBalance = (now - this.lastBalanceUpdate) / (1000 * 60 * 60)

      if (hoursSinceLastBalance >= this.config.balanceInterval) {
        this.performAutoBalance()
      }
    }, 1000 * 60 * 60) // Check every hour
  }

  public recordWeaponUsage(weaponId: string, usageData: {
    shots?: number
    hits?: number
    damage?: number
    kills?: number
    headshots?: number
    bodyshots?: number
    limbshots?: number
    distance?: number
    timeToKill?: number
    matchWon?: boolean
    matchDuration?: number
  }): void {
    const metrics = this.performanceMetrics.get(weaponId)
    if (!metrics) return

    if (usageData.shots) metrics.totalShots += usageData.shots
    if (usageData.hits) metrics.totalHits += usageData.hits
    if (usageData.damage) metrics.totalDamage += usageData.damage
    if (usageData.kills) metrics.totalKills += usageData.kills
    if (usageData.headshots) metrics.headshots += usageData.headshots
    if (usageData.bodyshots) metrics.bodyshots += usageData.bodyshots
    if (usageData.limbshots) metrics.limbshots += usageData.limbshots
    if (usageData.distance && usageData.kills) {
      metrics.averageKillDistance = (metrics.averageKillDistance * (metrics.totalKills - usageData.kills) + usageData.distance) / metrics.totalKills
    }
    if (usageData.timeToKill && usageData.kills) {
      metrics.timeToKill = (metrics.timeToKill * (metrics.totalKills - usageData.kills) + usageData.timeToKill) / metrics.totalKills
    }

    metrics.usageCount++
    metrics.lastUpdated = Date.now()

    this.updateDerivedMetrics(weaponId)
    this.balanceCallbacks.onMetricUpdate?.(weaponId, metrics)
  }

  private updateDerivedMetrics(weaponId: string): void {
    const metrics = this.performanceMetrics.get(weaponId)
    if (!metrics) return

    // Calculate accuracy
    metrics.accuracy = metrics.totalShots > 0 ? metrics.totalHits / metrics.totalShots : 0

    // Calculate headshot percentage
    metrics.headshotPercentage = metrics.totalKills > 0 ? metrics.headshots / metrics.totalKills : 0

    // Calculate damage per second
    const weapon = this.weapons.get(weaponId)
    if (weapon) {
      const dps = (weapon.damage * weapon.fireRate) / 60
      metrics.damagePerSecond = dps * metrics.accuracy
    }

    // Calculate effectiveness score
    metrics.effectivenessScore = this.calculateEffectivenessScore(weaponId)

    // Calculate popularity score
    const totalUsage = Array.from(this.performanceMetrics.values()).reduce((sum, m) => sum + m.usageCount, 0)
    metrics.popularityScore = totalUsage > 0 ? metrics.usageCount / totalUsage : 0
  }

  private calculateEffectivenessScore(weaponId: string): number {
    const metrics = this.performanceMetrics.get(weaponId)
    const weapon = this.weapons.get(weaponId)
    if (!metrics || !weapon) return 0

    // Weight different factors
    const accuracyWeight = 0.2
    const damageWeight = 0.25
    const fireRateWeight = 0.15
    const rangeWeight = 0.1
    const handlingWeight = 0.1
    const popularityWeight = 0.1
    const winRateWeight = 0.1

    const accuracyScore = metrics.accuracy
    const damageScore = Math.min(weapon.damage / 120, 1) // Normalize to max damage
    const fireRateScore = Math.min(weapon.fireRate / 900, 1) // Normalize to max fire rate
    const rangeScore = Math.min(weapon.effectiveRange / 150, 1) // Normalize to max range
    const handlingScore = (1 - weapon.recoil) * weapon.movementSpeed
    const popularityScore = metrics.popularityScore
    const winRateScore = metrics.winRateWithWeapon

    const effectivenessScore =
      accuracyScore * accuracyWeight +
      damageScore * damageWeight +
      fireRateScore * fireRateWeight +
      rangeScore * rangeWeight +
      handlingScore * handlingWeight +
      popularityScore * popularityWeight +
      winRateScore * winRateWeight

    return Math.min(effectivenessScore, 1)
  }

  public getWeaponStats(weaponId: string): WeaponStats | undefined {
    return this.weapons.get(weaponId)
  }

  public getWeaponMetrics(weaponId: string): WeaponPerformanceMetrics | undefined {
    return this.performanceMetrics.get(weaponId)
  }

  public getAllWeapons(): WeaponStats[] {
    return Array.from(this.weapons.values())
  }

  public getWeaponsByType(type: WeaponStats['type']): WeaponStats[] {
    return Array.from(this.weapons.values()).filter(weapon => weapon.type === type)
  }

  public getWeaponsByRarity(rarity: WeaponStats['rarity']): WeaponStats[] {
    return Array.from(this.weapons.values()).filter(weapon => weapon.rarity === rarity)
  }

  public calculateTimeToKill(weaponId: string, targetDistance: number, isMoving: boolean): number {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return Infinity

    // Calculate accuracy at distance
    const distanceAccuracy = this.calculateAccuracyAtDistance(weaponId, targetDistance)
    const movementPenalty = isMoving ? 0.7 : 1.0
    const effectiveAccuracy = distanceAccuracy * movementPenalty

    // Calculate effective damage per shot
    const effectiveDamage = weapon.damage * effectiveAccuracy

    // Calculate time to kill
    const shotsNeeded = Math.ceil(100 / effectiveDamage) // Assuming 100 HP target
    const timeBetweenShots = 1000 / weapon.fireRate
    const ttk = shotsNeeded * timeBetweenShots

    return ttk
  }

  private calculateAccuracyAtDistance(weaponId: string, distance: number): number {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return 0

    const effectiveRange = weapon.effectiveRange
    const rangeFactor = Math.max(0, 1 - (distance / effectiveRange) * 0.5)

    return weapon.accuracy * rangeFactor
  }

  public performAutoBalance(): BalanceAdjustment[] {
    if (!this.config.autoBalancingEnabled || this.isBalancing) return []

    this.isBalancing = true
    const adjustments: BalanceAdjustment[] = []

    try {
      this.weapons.forEach((weapon, weaponId) => {
        const metrics = this.performanceMetrics.get(weaponId)
        if (!metrics || metrics.usageCount < this.config.minSampleSize) return

        const adjustment = this.analyzeWeaponBalance(weaponId, weapon, metrics)
        if (adjustment) {
          adjustments.push(adjustment)
          this.applyBalanceAdjustment(adjustment)
        }
      })

      this.lastBalanceUpdate = Date.now()
      console.log(`🎯 Auto-balance completed: ${adjustments.length} weapons adjusted`)
      this.balanceCallbacks.onBalanceComplete?.(adjustments)

    } catch (error) {
      console.error('Error during auto-balance:', error)
    } finally {
      this.isBalancing = false
    }

    return adjustments
  }

  private analyzeWeaponBalance(weaponId: string, weapon: WeaponStats, metrics: WeaponPerformanceMetrics): BalanceAdjustment | null {
    const targetStats = this.config.categories[weapon.type]
    if (!targetStats) return null

    const changes: BalanceAdjustment['changes'] = {}
    let adjustmentType: 'buff' | 'nerf' | 'rework' = 'buff'

    // Analyze damage
    const targetDamage = targetStats.targetDamage
    const damageRatio = weapon.damage / targetDamage
    if (damageRatio < 0.8) {
      changes.damage = {
        old: weapon.damage,
        new: Math.round(weapon.damage * 1.1),
        reason: 'Below target damage for weapon type'
      }
    } else if (damageRatio > 1.2) {
      changes.damage = {
        old: weapon.damage,
        new: Math.round(weapon.damage * 0.9),
        reason: 'Above target damage for weapon type'
      }
      adjustmentType = 'nerf'
    }

    // Analyze fire rate
    const targetFireRate = targetStats.targetFireRate
    const fireRateRatio = weapon.fireRate / targetFireRate
    if (fireRateRatio < 0.8) {
      changes.fireRate = {
        old: weapon.fireRate,
        new: Math.round(weapon.fireRate * 1.1),
        reason: 'Below target fire rate for weapon type'
      }
    } else if (fireRateRatio > 1.2) {
      changes.fireRate = {
        old: weapon.fireRate,
        new: Math.round(weapon.fireRate * 0.9),
        reason: 'Above target fire rate for weapon type'
      }
      adjustmentType = 'nerf'
    }

    // Analyze accuracy based on performance metrics
    if (metrics.accuracy < 0.3 && weapon.accuracy < 0.6) {
      changes.accuracy = {
        old: weapon.accuracy,
        new: Math.min(weapon.accuracy * 1.15, 0.95),
        reason: 'Low accuracy in gameplay data'
      }
    } else if (metrics.accuracy > 0.8 && weapon.accuracy > 0.8) {
      changes.accuracy = {
        old: weapon.accuracy,
        new: Math.max(weapon.accuracy * 0.85, 0.5),
        reason: 'High accuracy in gameplay data'
      }
      adjustmentType = 'nerf'
    }

    // Analyze recoil based on performance
    if (metrics.effectivenessScore < 0.3 && weapon.recoil > 0.4) {
      changes.recoil = {
        old: weapon.recoil,
        new: Math.max(weapon.recoil * 0.8, 0.1),
        reason: 'Low effectiveness with high recoil'
      }
    } else if (metrics.effectivenessScore > 0.8 && weapon.recoil < 0.2) {
      changes.recoil = {
        old: weapon.recoil,
        new: Math.min(weapon.recoil * 1.2, 0.8),
        reason: 'High effectiveness with low recoil'
      }
      adjustmentType = 'nerf'
    }

    // Analyze usage rate
    if (metrics.popularityScore < 0.05) { // Very low usage
      if (!changes.damage) {
        changes.damage = {
          old: weapon.damage,
          new: Math.round(weapon.damage * 1.05),
          reason: 'Very low usage rate'
        }
      }
    } else if (metrics.popularityScore > 0.25) { // Very high usage
      if (!changes.damage && !changes.fireRate) {
        changes.fireRate = {
          old: weapon.fireRate,
          new: Math.round(weapon.fireRate * 0.95),
          reason: 'Very high usage rate'
        }
        adjustmentType = 'nerf'
      }
    }

    // Return adjustment if there are changes
    if (Object.keys(changes).length > 0) {
      const impact = Object.keys(changes).length > 2 ? 'major' :
                   Object.keys(changes).length > 1 ? 'moderate' : 'minor'

      return {
        weaponId,
        timestamp: Date.now(),
        type: adjustmentType,
        changes,
        reason: this.generateBalanceReason(changes, metrics),
        impact,
        autoAdjustment: true
      }
    }

    return null
  }

  private generateBalanceReason(changes: BalanceAdjustment['changes'], metrics: WeaponPerformanceMetrics): string {
    const reasons: string[] = []

    if (changes.damage) reasons.push('damage adjusted')
    if (changes.fireRate) reasons.push('fire rate adjusted')
    if (changes.accuracy) reasons.push('accuracy adjusted')
    if (changes.recoil) reasons.push('recoil adjusted')

    return `Automatic balance: ${reasons.join(', ')} (effectiveness: ${Math.round(metrics.effectivenessScore * 100)}%)`
  }

  private applyBalanceAdjustment(adjustment: BalanceAdjustment): void {
    const weapon = this.weapons.get(adjustment.weaponId)
    if (!weapon) return

    // Apply changes
    if (adjustment.changes.damage) {
      weapon.damage = adjustment.changes.damage.new
    }
    if (adjustment.changes.fireRate) {
      weapon.fireRate = adjustment.changes.fireRate.new
    }
    if (adjustment.changes.accuracy) {
      weapon.accuracy = adjustment.changes.accuracy.new
    }
    if (adjustment.changes.recoil) {
      weapon.recoil = adjustment.changes.recoil.new
    }

    // Store in history
    this.balanceHistory.push(adjustment)
    if (this.balanceHistory.length > 100) {
      this.balanceHistory.shift()
    }

    this.balanceCallbacks.onWeaponAdjusted?.(adjustment)
  }

  public manualBalanceAdjustment(weaponId: string, changes: BalanceAdjustment['changes'], reason: string): void {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return

    const adjustment: BalanceAdjustment = {
      weaponId,
      timestamp: Date.now(),
      type: 'rework',
      changes,
      reason,
      impact: 'major',
      autoAdjustment: false
    }

    this.applyBalanceAdjustment(adjustment)
  }

  public getBalanceHistory(): BalanceAdjustment[] {
    return [...this.balanceHistory]
  }

  public getBalanceHistoryForWeapon(weaponId: string): BalanceAdjustment[] {
    return this.balanceHistory.filter(adj => adj.weaponId === weaponId)
  }

  public getWeaponRankings(): { weaponId: string; score: number; weapon: WeaponStats }[] {
    const rankings = Array.from(this.weapons.entries()).map(([weaponId, weapon]) => {
      const metrics = this.performanceMetrics.get(weaponId)
      const score = metrics ? metrics.effectivenessScore : 0
      return { weaponId, score, weapon }
    })

    return rankings.sort((a, b) => b.score - a.score)
  }

  public getMetaReport(): {
    topWeapons: { weaponId: string; usageRate: number; winRate: number }[]
    underperformingWeapons: { weaponId: string; issues: string[] }[]
    overperformingWeapons: { weaponId: string; issues: string[] }[]
    recommendations: string[]
  } {
    const topWeapons: { weaponId: string; usageRate: number; winRate: number }[] = []
    const underperformingWeapons: { weaponId: string; issues: string[] }[] = []
    const overperformingWeapons: { weaponId: string; issues: string[] }[] = []
    const recommendations: string[] = []

    this.performanceMetrics.forEach((metrics, weaponId) => {
      if (metrics.usageCount < this.config.minSampleSize) return

      const weapon = this.weapons.get(weaponId)
      if (!weapon) return

      // Top weapons by usage
      if (metrics.popularityScore > 0.15) {
        topWeapons.push({
          weaponId,
          usageRate: metrics.popularityScore,
          winRate: metrics.winRateWithWeapon
        })
      }

      // Underperforming weapons
      const issues: string[] = []
      if (metrics.effectivenessScore < 0.3) issues.push('low effectiveness')
      if (metrics.accuracy < 0.2) issues.push('low accuracy')
      if (metrics.popularityScore < 0.05) issues.push('low usage')
      if (metrics.winRateWithWeapon < 0.4) issues.push('low win rate')

      if (issues.length > 0) {
        underperformingWeapons.push({ weaponId, issues })
      }

      // Overperforming weapons
      const overIssues: string[] = []
      if (metrics.effectivenessScore > 0.8) overIssues.push('high effectiveness')
      if (metrics.popularityScore > 0.3) overIssues.push('high usage')
      if (metrics.winRateWithWeapon > 0.6) overIssues.push('high win rate')

      if (overIssues.length > 0) {
        overperformingWeapons.push({ weaponId, issues: overIssues })
      }
    })

    // Generate recommendations
    if (underperformingWeapons.length > 0) {
      recommendations.push(`Consider buffing ${underperformingWeapons.length} underperforming weapons`)
    }
    if (overperformingWeapons.length > 0) {
      recommendations.push(`Consider nerfing ${overperformingWeapons.length} overperforming weapons`)
    }
    if (topWeapons.length < 3) {
      recommendations.push('Meta lacks diversity - consider balancing to increase variety')
    }

    return {
      topWeapons: topWeapons.sort((a, b) => b.usageRate - a.usageRate),
      underperformingWeapons,
      overperformingWeapons,
      recommendations
    }
  }

  public exportBalanceData(): string {
    const data = {
      weapons: Array.from(this.weapons.values()),
      metrics: Array.from(this.performanceMetrics.values()),
      balanceHistory: this.balanceHistory,
      config: this.config,
      exportDate: Date.now()
    }

    return JSON.stringify(data, null, 2)
  }

  public importBalanceData(data: string): void {
    try {
      const parsed = JSON.parse(data)

      if (parsed.weapons) {
        this.weapons.clear()
        parsed.weapons.forEach((weapon: WeaponStats) => {
          this.weapons.set(weapon.id, weapon)
        })
      }

      if (parsed.metrics) {
        this.performanceMetrics.clear()
        parsed.metrics.forEach((metrics: WeaponPerformanceMetrics) => {
          this.performanceMetrics.set(metrics.weaponId, metrics)
        })
      }

      if (parsed.balanceHistory) {
        this.balanceHistory = parsed.balanceHistory
      }

      if (parsed.config) {
        this.config = { ...this.config, ...parsed.config }
      }

      console.log('✅ Balance data imported successfully')
    } catch (error) {
      console.error('❌ Error importing balance data:', error)
    }
  }

  public resetWeaponStats(weaponId: string): void {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return

    // Reset to default values based on weapon type
    const defaults = this.config.categories[weapon.type]
    if (defaults) {
      weapon.damage = defaults.targetDamage
      weapon.fireRate = defaults.targetFireRate
      weapon.accuracy = defaults.targetAccuracy
    }

    console.log(`🔄 Reset ${weapon.name} to default stats`)
  }

  public on(event: string, callback: Function): void {
    switch (event) {
      case 'weaponAdjusted':
        this.balanceCallbacks.onWeaponAdjusted = callback as (adjustment: BalanceAdjustment) => void
        break
      case 'balanceComplete':
        this.balanceCallbacks.onBalanceComplete = callback as (results: BalanceAdjustment[]) => void
        break
      case 'metricUpdate':
        this.balanceCallbacks.onMetricUpdate = callback as (weaponId: string, metrics: WeaponPerformanceMetrics) => void
        break
    }
  }

  public dispose(): void {
    this.weapons.clear()
    this.performanceMetrics.clear()
    this.balanceHistory.length = 0
    this.isBalancing = false
  }
}

export default GLXYWeaponBalancing