import * as THREE from 'three'

export interface WeaponStats {
  damage: number
  fireRate: number
  accuracy: number
  range: number
  magazineSize: number
  reloadTime: number
  recoil: {
    horizontal: number
    vertical: number
    recovery: number
  }
  spread: {
    min: number
    max: number
    increase: number
    decrease: number
  }
  penetration: number
  specialEffects: string[]
}

export interface AmmoType {
  id: string
  name: string
  damage: number
  velocity: number
  dropOff: number
  armorPenetration: number
  effects: string[]
}

export interface WeaponModification {
  id: string
  name: string
  type: 'barrel' | 'sight' | 'grip' | 'magazine' | 'muzzle'
  stats: Partial<WeaponStats>
  requirements: string[]
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface IntelligentWeapon {
  id: string
  name: string
  type: 'pistol' | 'smg' | 'assault_rifle' | 'sniper' | 'shotgun' | 'heavy'
  baseStats: WeaponStats
  currentStats: WeaponStats
  ammoType: AmmoType
  currentAmmo: number
  totalAmmo: number
  modifications: WeaponModification[]
  experience: number
  level: number
  heat: number
  jamChance: number
  condition: number
  aiAssisted: boolean
  smartTargeting: boolean
}

export class IntelligentWeaponSystem {
  private weapons: IntelligentWeapon[] = []
  private ammoTypes: AmmoType[] = []
  private modifications: WeaponModification[] = []
  private weaponLearning: WeaponLearningSystem
  private adaptiveAI: AdaptiveWeaponAI
  private ballisticComputer: BallisticComputer

  constructor() {
    this.initializeAmmoTypes()
    this.initializeModifications()
    this.weaponLearning = new WeaponLearningSystem()
    this.adaptiveAI = new AdaptiveWeaponAI()
    this.ballisticComputer = new BallisticComputer()
    this.initializeWeapons()
  }

  private initializeAmmoTypes(): void {
    this.ammoTypes = [
      {
        id: '9mm',
        name: '9mm Parabellum',
        damage: 25,
        velocity: 380,
        dropOff: 0.15,
        armorPenetration: 0.3,
        effects: ['standard']
      },
      {
        id: '5_56mm',
        name: '5.56mm NATO',
        damage: 35,
        velocity: 920,
        dropOff: 0.08,
        armorPenetration: 0.6,
        effects: ['penetrating']
      },
      {
        id: '7_62mm',
        name: '7.62mm NATO',
        damage: 45,
        velocity: 780,
        dropOff: 0.12,
        armorPenetration: 0.8,
        effects: ['heavy']
      },
      {
        id: '12_gauge',
        name: '12 Gauge Buckshot',
        damage: 80,
        velocity: 400,
        dropOff: 0.25,
        armorPenetration: 0.4,
        effects: ['spread', 'stopping_power']
      },
      {
        id: '50_cal',
        name: '.50 BMG',
        damage: 120,
        velocity: 850,
        dropOff: 0.05,
        armorPenetration: 0.95,
        effects: ['armor_piercing', 'explosive']
      }
    ]
  }

  private initializeModifications(): void {
    this.modifications = [
      {
        id: 'extended_barrel',
        name: 'Extended Barrel',
        type: 'barrel',
        stats: {
          accuracy: 0.15,
          range: 0.2,
          damage: 0.1
        },
        requirements: ['level_5'],
        rarity: 'rare'
      },
      {
        id: 'advanced_sight',
        name: 'Advanced Sight',
        type: 'sight',
        stats: {
          accuracy: 0.25,
          range: 0.3
        },
        requirements: ['level_3'],
        rarity: 'common'
      },
      {
        id: 'ergonomic_grip',
        name: 'Ergonomic Grip',
        type: 'grip',
        stats: {
          recoil: { horizontal: -0.2, vertical: -0.2, recovery: 0.15 },
          spread: { min: -0.1, max: -0.1, increase: -0.15, decrease: 0.1 }
        },
        requirements: ['level_2'],
        rarity: 'common'
      },
      {
        id: 'extended_mag',
        name: 'Extended Magazine',
        type: 'magazine',
        stats: {
          magazineSize: 0.5
        },
        requirements: ['level_4'],
        rarity: 'rare'
      },
      {
        id: 'suppressor',
        name: 'Suppressor',
        type: 'muzzle',
        stats: {
          accuracy: 0.1,
          range: 0.1,
          recoil: { horizontal: -0.1, vertical: -0.1, recovery: 0.05 }
        },
        requirements: ['level_6'],
        rarity: 'epic'
      }
    ]
  }

  private initializeWeapons(): void {
    this.weapons = [
      {
        id: 'smart_pistol',
        name: 'Smart Pistol',
        type: 'pistol',
        baseStats: {
          damage: 25,
          fireRate: 300,
          accuracy: 0.7,
          range: 25,
          magazineSize: 12,
          reloadTime: 1.5,
          recoil: { horizontal: 0.2, vertical: 0.3, recovery: 0.8 },
          spread: { min: 0.02, max: 0.08, increase: 0.01, decrease: 0.02 },
          penetration: 0.3,
          specialEffects: ['smart_targeting', 'tracking']
        },
        currentStats: {} as WeaponStats,
        ammoType: this.ammoTypes[0],
        currentAmmo: 12,
        totalAmmo: 60,
        modifications: [],
        experience: 0,
        level: 1,
        heat: 0,
        jamChance: 0.01,
        condition: 100,
        aiAssisted: true,
        smartTargeting: true
      },
      {
        id: 'tactical_ar',
        name: 'Tactical Assault Rifle',
        type: 'assault_rifle',
        baseStats: {
          damage: 35,
          fireRate: 600,
          accuracy: 0.8,
          range: 100,
          magazineSize: 30,
          reloadTime: 2.0,
          recoil: { horizontal: 0.3, vertical: 0.4, recovery: 0.7 },
          spread: { min: 0.03, max: 0.12, increase: 0.02, decrease: 0.03 },
          penetration: 0.6,
          specialEffects: ['burst_fire', 'adaptive_recoil']
        },
        currentStats: {} as WeaponStats,
        ammoType: this.ammoTypes[1],
        currentAmmo: 30,
        totalAmmo: 120,
        modifications: [],
        experience: 0,
        level: 1,
        heat: 0,
        jamChance: 0.005,
        condition: 100,
        aiAssisted: true,
        smartTargeting: true
      },
      {
        id: 'precision_sniper',
        name: 'Precision Sniper',
        type: 'sniper',
        baseStats: {
          damage: 120,
          fireRate: 30,
          accuracy: 0.95,
          range: 500,
          magazineSize: 5,
          reloadTime: 3.0,
          recoil: { horizontal: 0.1, vertical: 0.8, recovery: 0.9 },
          spread: { min: 0.001, max: 0.01, increase: 0.001, decrease: 0.01 },
          penetration: 0.9,
          specialEffects: ['ballistic_calculator', 'wind_compensation']
        },
        currentStats: {} as WeaponStats,
        ammoType: this.ammoTypes[4],
        currentAmmo: 5,
        totalAmmo: 25,
        modifications: [],
        experience: 0,
        level: 1,
        heat: 0,
        jamChance: 0.001,
        condition: 100,
        aiAssisted: true,
        smartTargeting: true
      }
    ]

    // Initialize current stats
    this.weapons.forEach(weapon => {
      this.updateWeaponStats(weapon)
    })
  }

  private updateWeaponStats(weapon: IntelligentWeapon): void {
    // Start with base stats
    weapon.currentStats = { ...weapon.baseStats }
    
    // Apply modification bonuses
    weapon.modifications.forEach(mod => {
      this.applyModification(weapon.currentStats, mod.stats)
    })
    
    // Apply level bonuses
    const levelBonus = (weapon.level - 1) * 0.05
    weapon.currentStats.damage *= (1 + levelBonus)
    weapon.currentStats.accuracy *= (1 + levelBonus)
    weapon.currentStats.range *= (1 + levelBonus)
    
    // Apply condition penalty
    const conditionMultiplier = weapon.condition / 100
    weapon.currentStats.damage *= conditionMultiplier
    weapon.currentStats.accuracy *= conditionMultiplier
    weapon.currentStats.fireRate *= conditionMultiplier
  }

  private applyModification(stats: WeaponStats, modStats: Partial<WeaponStats>): void {
    Object.keys(modStats).forEach(key => {
      const statKey = key as keyof WeaponStats
      const modValue = modStats[statKey]
      
      if (typeof modValue === 'object' && modValue !== null) {
        // Handle nested objects like recoil and spread
        Object.keys(modValue).forEach(subKey => {
          const subStatKey = subKey as keyof typeof modValue
          if (stats[statKey] && typeof stats[statKey] === 'object') {
            (stats[statKey] as any)[subStatKey] += (modValue as any)[subStatKey]
          }
        })
      } else if (typeof modValue === 'number') {
        // Handle numeric values with proper type safety
        if (statKey === 'magazineSize') {
          stats[statKey] = Math.floor(stats[statKey] * (1 + modValue))
        } else if (statKey === 'damage' || statKey === 'fireRate' || statKey === 'accuracy' || statKey === 'range' || statKey === 'reloadTime' || statKey === 'penetration') {
          // These are simple numeric properties
          (stats as Record<string, any>)[statKey] += modValue
        }
        // For complex object properties (recoil, spread, specialEffects), the += operator doesn't make sense
        // and TypeScript correctly prevents this operation
      }
    })
  }

  public fireWeapon(weaponId: string, targetPosition: THREE.Vector3, playerPosition: THREE.Vector3): FireResult {
    const weapon = this.weapons.find(w => w.id === weaponId)
    if (!weapon || weapon.currentAmmo <= 0) {
      return { success: false, reason: 'no_ammo' }
    }
    
    // Check for jam
    if (Math.random() < weapon.jamChance) {
      weapon.jamChance = Math.min(0.5, weapon.jamChance + 0.01)
      return { success: false, reason: 'jammed' }
    }
    
    // Calculate fire result
    const result = this.calculateFireResult(weapon, targetPosition, playerPosition)
    
    // Update weapon state
    weapon.currentAmmo--
    weapon.heat += 0.1
    weapon.condition -= 0.01
    
    // Add experience
    weapon.experience += result.hit ? 10 : 1
    this.checkWeaponLevelUp(weapon)
    
    // Learn from this shot
    this.weaponLearning.learnFromShot(weapon, result)
    
    return result
  }

  private calculateFireResult(weapon: IntelligentWeapon, targetPosition: THREE.Vector3, playerPosition: THREE.Vector3): FireResult {
    const distance = playerPosition.distanceTo(targetPosition)
    const accuracy = this.calculateAccuracy(weapon, distance)
    const damage = this.calculateDamage(weapon, distance)
    
    // AI-assisted targeting
    let adjustedTarget = targetPosition.clone()
    if (weapon.aiAssisted && weapon.smartTargeting) {
      adjustedTarget = this.adaptiveAI.adjustTarget(weapon, targetPosition, playerPosition, accuracy)
    }
    
    // Ballistic calculation
    const ballisticData = this.ballisticComputer.calculateTrajectory(
      playerPosition, 
      adjustedTarget, 
      weapon.ammoType.velocity,
      weapon.ammoType.dropOff
    )
    
    // Check hit
    const hitRoll = Math.random()
    const hit = hitRoll < accuracy
    
    return {
      success: true,
      hit: hit,
      damage: hit ? damage : 0,
      accuracy: accuracy,
      distance: distance,
      ballisticData: ballisticData,
      heatGenerated: 0.1,
      targetPosition: adjustedTarget
    }
  }

  private calculateAccuracy(weapon: IntelligentWeapon, distance: number): number {
    let accuracy = weapon.currentStats.accuracy
    
    // Distance penalty
    const distancePenalty = Math.max(0, (distance - weapon.currentStats.range) / weapon.currentStats.range)
    accuracy *= (1 - distancePenalty * 0.5)
    
    // Heat penalty
    const heatPenalty = weapon.heat * 0.3
    accuracy *= (1 - heatPenalty)
    
    // Condition penalty
    const conditionPenalty = (100 - weapon.condition) / 100 * 0.2
    accuracy *= (1 - conditionPenalty)
    
    // AI assistance bonus
    if (weapon.aiAssisted) {
      accuracy *= (1 + 0.1 * weapon.level)
    }
    
    return Math.max(0.1, Math.min(0.95, accuracy))
  }

  private calculateDamage(weapon: IntelligentWeapon, distance: number): number {
    let damage = weapon.currentStats.damage
    
    // Distance drop-off
    const dropOffFactor = Math.max(0, 1 - (distance / weapon.currentStats.range) * weapon.ammoType.dropOff)
    damage *= dropOffFactor
    
    // Random variation
    damage *= (0.9 + Math.random() * 0.2)
    
    // Critical hit chance
    if (Math.random() < 0.1) {
      damage *= 1.5
    }
    
    return Math.round(damage)
  }

  private checkWeaponLevelUp(weapon: IntelligentWeapon): void {
    const expNeeded = weapon.level * 100
    if (weapon.experience >= expNeeded) {
      weapon.level++
      weapon.experience -= expNeeded
      this.updateWeaponStats(weapon)
      console.log(`Weapon ${weapon.name} leveled up to ${weapon.level}!`)
    }
  }

  public reloadWeapon(weaponId: string): boolean {
    const weapon = this.weapons.find(w => w.id === weaponId)
    if (!weapon || weapon.totalAmmo <= 0) {
      return false
    }
    
    const ammoNeeded = weapon.baseStats.magazineSize - weapon.currentAmmo
    const ammoToReload = Math.min(ammoNeeded, weapon.totalAmmo)
    
    weapon.currentAmmo += ammoToReload
    weapon.totalAmmo -= ammoToReload
    weapon.heat = Math.max(0, weapon.heat - 0.2)
    
    return true
  }

  public addModification(weaponId: string, modId: string): boolean {
    const weapon = this.weapons.find(w => w.id === weaponId)
    const modification = this.modifications.find(m => m.id === modId)
    
    if (!weapon || !modification) {
      return false
    }
    
    // Check requirements
    if (!this.checkModRequirements(weapon, modification)) {
      return false
    }
    
    // Remove existing modification of same type
    weapon.modifications = weapon.modifications.filter(mod => mod.type !== modification.type)
    
    // Add new modification
    weapon.modifications.push(modification)
    this.updateWeaponStats(weapon)
    
    return true
  }

  private checkModRequirements(weapon: IntelligentWeapon, modification: WeaponModification): boolean {
    return modification.requirements.every(req => {
      switch (req) {
        case 'level_2':
          return weapon.level >= 2
        case 'level_3':
          return weapon.level >= 3
        case 'level_4':
          return weapon.level >= 4
        case 'level_5':
          return weapon.level >= 5
        case 'level_6':
          return weapon.level >= 6
        default:
          return true
      }
    })
  }

  public getWeaponRecommendation(playerStyle: PlayerStyle, situation: CombatSituation): IntelligentWeapon {
    return this.adaptiveAI.recommendWeapon(this.weapons, playerStyle, situation)
  }

  public maintainWeapon(weaponId: string): void {
    const weapon = this.weapons.find(w => w.id === weaponId)
    if (!weapon) return
    
    weapon.condition = Math.min(100, weapon.condition + 20)
    weapon.jamChance = Math.max(0.001, weapon.jamChance - 0.005)
    this.updateWeaponStats(weapon)
  }

  public getWeapons(): IntelligentWeapon[] {
    return this.weapons
  }

  public getWeapon(weaponId: string): IntelligentWeapon | undefined {
    return this.weapons.find(w => w.id === weaponId)
  }
}

// Supporting classes
export interface FireResult {
  success: boolean
  hit?: boolean
  damage?: number
  accuracy?: number
  distance?: number
  ballisticData?: BallisticData
  heatGenerated?: number
  targetPosition?: THREE.Vector3
  reason?: string
}

export interface BallisticData {
  trajectory: THREE.Vector3[]
  impactPoint: THREE.Vector3
  flightTime: number
  drop: number
  windAdjustment: THREE.Vector3
}

export interface PlayerStyle {
  aggression: number
  accuracy: number
  preferredRange: 'close' | 'medium' | 'long'
  playStyle: 'aggressive' | 'defensive' | 'balanced'
}

export interface CombatSituation {
  enemyCount: number
  enemyDistance: number
  environment: 'close_quarters' | 'urban' | 'open' | 'mixed'
  urgency: 'low' | 'medium' | 'high'
}

class WeaponLearningSystem {
  private shotHistory: Map<string, ShotData[]> = new Map()
  
  learnFromShot(weapon: IntelligentWeapon, result: FireResult): void {
    if (!this.shotHistory.has(weapon.id)) {
      this.shotHistory.set(weapon.id, [])
    }
    
    const shotData: ShotData = {
      timestamp: Date.now(),
      distance: result.distance || 0,
      hit: result.hit || false,
      accuracy: result.accuracy || 0,
      damage: result.damage || 0,
      heat: weapon.heat,
      condition: weapon.condition
    }
    
    this.shotHistory.get(weapon.id)!.push(shotData)
    
    // Analyze patterns and adapt weapon
    this.analyzePatterns(weapon)
  }
  
  private analyzePatterns(weapon: IntelligentWeapon): void {
    const history = this.shotHistory.get(weapon.id) || []
    if (history.length < 10) return
    
    const recentShots = history.slice(-20)
    const hitRate = recentShots.filter(shot => shot.hit).length / recentShots.length
    const avgDistance = recentShots.reduce((sum, shot) => sum + shot.distance, 0) / recentShots.length
    const avgAccuracy = recentShots.reduce((sum, shot) => sum + shot.accuracy, 0) / recentShots.length
    
    // Adapt weapon based on performance
    if (hitRate > 0.8) {
      // Player is performing well, increase difficulty slightly
      weapon.jamChance = Math.min(0.02, weapon.jamChance + 0.001)
    } else if (hitRate < 0.3) {
      // Player is struggling, provide assistance
      weapon.jamChance = Math.max(0.001, weapon.jamChance - 0.002)
    }
  }
}

class AdaptiveWeaponAI {
  recommendWeapon(weapons: IntelligentWeapon[], playerStyle: PlayerStyle, situation: CombatSituation): IntelligentWeapon {
    let bestWeapon = weapons[0]
    let bestScore = 0
    
    weapons.forEach(weapon => {
      const score = this.calculateWeaponScore(weapon, playerStyle, situation)
      if (score > bestScore) {
        bestScore = score
        bestWeapon = weapon
      }
    })
    
    return bestWeapon
  }
  
  private calculateWeaponScore(weapon: IntelligentWeapon, playerStyle: PlayerStyle, situation: CombatSituation): number {
    let score = 0
    
    // Range suitability
    const rangeScore = this.getRangeScore(weapon.type, playerStyle.preferredRange)
    score += rangeScore * 0.3
    
    // Playstyle compatibility
    const styleScore = this.getStyleScore(weapon, playerStyle.playStyle)
    score += styleScore * 0.3
    
    // Situation suitability
    const situationScore = this.getSituationScore(weapon, situation)
    score += situationScore * 0.4
    
    return score
  }
  
  private getRangeScore(weaponType: string, preferredRange: string): number {
    const rangeMap = {
      'pistol': { close: 0.9, medium: 0.6, long: 0.2 },
      'smg': { close: 0.8, medium: 0.7, long: 0.3 },
      'assault_rifle': { close: 0.7, medium: 0.9, long: 0.7 },
      'sniper': { close: 0.3, medium: 0.6, long: 0.9 },
      'shotgun': { close: 0.9, medium: 0.4, long: 0.1 },
      'heavy': { close: 0.6, medium: 0.8, long: 0.6 }
    }
    
    const weaponRange = rangeMap[weaponType as keyof typeof rangeMap];
    return weaponRange?.[preferredRange as keyof typeof weaponRange] || 0.5
  }
  
  private getStyleScore(weapon: IntelligentWeapon, playStyle: string): number {
    const styleMap = {
      'aggressive': { high_fire_rate: 0.8, high_damage: 0.6 },
      'defensive': { high_accuracy: 0.8, long_range: 0.7 },
      'balanced': { all_around: 0.8 }
    }
    
    // Calculate score based on weapon stats
    let score = 0.5
    
    if (playStyle === 'aggressive') {
      score += (weapon.currentStats.fireRate / 1000) * 0.3
      score += (weapon.currentStats.damage / 100) * 0.2
    } else if (playStyle === 'defensive') {
      score += weapon.currentStats.accuracy * 0.3
      score += (weapon.currentStats.range / 500) * 0.2
    }
    
    return Math.min(1, score)
  }
  
  private getSituationScore(weapon: IntelligentWeapon, situation: CombatSituation): number {
    let score = 0.5
    
    // Enemy count consideration
    if (situation.enemyCount > 5) {
      score += weapon.currentStats.fireRate / 1000 * 0.2
      score += weapon.baseStats.magazineSize / 50 * 0.2
    }
    
    // Environment consideration
    if (situation.environment === 'close_quarters') {
      if (weapon.type === 'shotgun' || weapon.type === 'smg') {
        score += 0.3
      }
    } else if (situation.environment === 'open') {
      if (weapon.type === 'sniper' || weapon.type === 'assault_rifle') {
        score += 0.3
      }
    }
    
    // Urgency consideration
    if (situation.urgency === 'high') {
      score += weapon.currentStats.damage / 100 * 0.2
    }
    
    return Math.min(1, score)
  }
  
  adjustTarget(weapon: IntelligentWeapon, target: THREE.Vector3, playerPosition: THREE.Vector3, accuracy: number): THREE.Vector3 {
    const adjustedTarget = target.clone()
    
    // Calculate lead for moving targets
    const leadDistance = this.calculateLeadDistance(weapon, target, playerPosition)
    
    // Adjust for bullet drop
    const dropAdjustment = this.calculateDropAdjustment(weapon, playerPosition.distanceTo(target))
    
    // Apply AI assistance
    const assistanceFactor = Math.min(0.5, weapon.level * 0.05)
    const randomFactor = (1 - accuracy) * (1 - assistanceFactor)
    
    adjustedTarget.x += (Math.random() - 0.5) * randomFactor
    adjustedTarget.y += dropAdjustment
    adjustedTarget.z += (Math.random() - 0.5) * randomFactor
    
    return adjustedTarget
  }
  
  private calculateLeadDistance(weapon: IntelligentWeapon, target: THREE.Vector3, playerPosition: THREE.Vector3): number {
    // Simplified lead calculation
    const distance = playerPosition.distanceTo(target)
    const flightTime = distance / weapon.ammoType.velocity
    return flightTime * 5 // Assume target moving at 5 units/second
  }
  
  private calculateDropAdjustment(weapon: IntelligentWeapon, distance: number): number {
    const drop = 0.5 * 9.81 * Math.pow(distance / weapon.ammoType.velocity, 2)
    return drop * 0.1 // Scale factor
  }
}

class BallisticComputer {
  calculateTrajectory(start: THREE.Vector3, target: THREE.Vector3, velocity: number, dropOff: number): BallisticData {
    const trajectory: THREE.Vector3[] = []
    const distance = start.distanceTo(target)
    const direction = target.clone().sub(start).normalize()
    
    // Calculate bullet drop
    const flightTime = distance / velocity
    const drop = 0.5 * 9.81 * flightTime * flightTime * dropOff
    
    // Generate trajectory points
    const steps = 10
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const point = start.clone().add(direction.clone().multiplyScalar(distance * t))
      point.y -= drop * t * t
      trajectory.push(point)
    }
    
    // Calculate impact point with drop
    const impactPoint = target.clone()
    impactPoint.y -= drop
    
    return {
      trajectory,
      impactPoint,
      flightTime,
      drop,
      windAdjustment: new THREE.Vector3(0, 0, 0) // Simplified - no wind for now
    }
  }
}

interface ShotData {
  timestamp: number
  distance: number
  hit: boolean
  accuracy: number
  damage: number
  heat: number
  condition: number
}