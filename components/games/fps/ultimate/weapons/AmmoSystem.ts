/**
 * 💥 AMMO SYSTEM
 * 
 * Different ammo types for strategic gameplay
 * - Standard: Balanced
 * - Hollow Point: +damage, -penetration
 * - Armor Piercing: -damage, +penetration
 * - Incendiary: Fire damage over time
 */

export enum AmmoType {
  STANDARD = 'standard',
  HOLLOW_POINT = 'hollow_point',
  ARMOR_PIERCING = 'armor_piercing',
  INCENDIARY = 'incendiary'
}

export interface AmmoProperties {
  damageMultiplier: number
  penetration: number // 0-1 (chance to penetrate cover)
  specialEffect?: 'fire' | 'explosive' | 'shock'
  effectDuration?: number // seconds
  effectDamage?: number // damage per second
  description: string
  color: string
}

export const AMMO_PROPERTIES: Record<AmmoType, AmmoProperties> = {
  [AmmoType.STANDARD]: {
    damageMultiplier: 1.0,
    penetration: 0.3,
    description: 'Balanced ammunition',
    color: '#ffffff'
  },
  [AmmoType.HOLLOW_POINT]: {
    damageMultiplier: 1.25,
    penetration: 0.1,
    description: '+25% damage, -70% penetration',
    color: '#ff8800'
  },
  [AmmoType.ARMOR_PIERCING]: {
    damageMultiplier: 0.85,
    penetration: 0.8,
    description: '-15% damage, +150% penetration',
    color: '#00ff88'
  },
  [AmmoType.INCENDIARY]: {
    damageMultiplier: 1.0,
    penetration: 0.3,
    specialEffect: 'fire',
    effectDuration: 3,
    effectDamage: 5,
    description: 'Burns for 5 DMG/sec for 3 seconds',
    color: '#ff4400'
  }
}

export interface AmmoState {
  currentType: AmmoType
  availableTypes: AmmoType[]
}

export class AmmoSystem {
  private currentType: AmmoType = AmmoType.STANDARD
  private availableTypes: AmmoType[]
  private onAmmoChangeCallback?: (newType: AmmoType) => void

  constructor(availableTypes: AmmoType[] = Object.values(AmmoType)) {
    this.availableTypes = availableTypes
    console.log('💥 Ammo System initialized with types:', availableTypes)
  }

  /**
   * Get current ammo type
   */
  getCurrentType(): AmmoType {
    return this.currentType
  }

  /**
   * Set ammo type
   */
  setAmmoType(type: AmmoType): boolean {
    if (!this.availableTypes.includes(type)) {
      console.warn(`Ammo type ${type} not available`)
      return false
    }

    this.currentType = type
    console.log(`💥 Ammo type changed to: ${type}`)
    
    if (this.onAmmoChangeCallback) {
      this.onAmmoChangeCallback(type)
    }

    return true
  }

  /**
   * Cycle to next ammo type
   */
  cycleAmmoType(): AmmoType {
    const currentIndex = this.availableTypes.indexOf(this.currentType)
    const nextIndex = (currentIndex + 1) % this.availableTypes.length
    const nextType = this.availableTypes[nextIndex]
    
    this.setAmmoType(nextType)
    return nextType
  }

  /**
   * Get ammo properties
   */
  getProperties(type?: AmmoType): AmmoProperties {
    const targetType = type || this.currentType
    return AMMO_PROPERTIES[targetType]
  }

  /**
   * Calculate final damage with current ammo
   */
  calculateDamage(baseDamage: number, type?: AmmoType): number {
    const props = this.getProperties(type)
    return baseDamage * props.damageMultiplier
  }

  /**
   * Check if shot penetrates cover
   */
  checkPenetration(type?: AmmoType): boolean {
    const props = this.getProperties(type)
    return Math.random() < props.penetration
  }

  /**
   * Get available types
   */
  getAvailableTypes(): AmmoType[] {
    return [...this.availableTypes]
  }

  /**
   * Add ammo type
   */
  addAmmoType(type: AmmoType): void {
    if (!this.availableTypes.includes(type)) {
      this.availableTypes.push(type)
      console.log(`💥 Unlocked ammo type: ${type}`)
    }
  }

  /**
   * Set callback for ammo change
   */
  onAmmoChange(callback: (newType: AmmoType) => void): void {
    this.onAmmoChangeCallback = callback
  }

  /**
   * Get ammo state
   */
  getState(): AmmoState {
    return {
      currentType: this.currentType,
      availableTypes: [...this.availableTypes]
    }
  }
}

// =============================================================================
// AMMO HUD RENDERER
// =============================================================================

export class AmmoHUDRenderer {
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Render ammo type indicator
   */
  render(ctx: CanvasRenderingContext2D, ammoState: AmmoState, x: number, y: number): void {
    const props = AMMO_PROPERTIES[ammoState.currentType]

    ctx.save()

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(x, y, 200, 80)

    // Border
    ctx.strokeStyle = props.color
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, 200, 80)

    // Ammo Type Name
    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = props.color
    ctx.textAlign = 'left'
    ctx.fillText(this.formatAmmoName(ammoState.currentType), x + 10, y + 25)

    // Description
    ctx.font = '12px Arial'
    ctx.fillStyle = '#cccccc'
    ctx.fillText(props.description, x + 10, y + 45)

    // Cycle Hint
    ctx.font = '10px Arial'
    ctx.fillStyle = '#999999'
    ctx.fillText('Press [T] to cycle', x + 10, y + 65)

    ctx.restore()
  }

  /**
   * Format ammo name
   */
  private formatAmmoName(type: AmmoType): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
}

// =============================================================================
// FIRE DAMAGE EFFECT (for Incendiary ammo)
// =============================================================================

export interface BurningEntity {
  id: string
  damagePerTick: number
  duration: number
  startTime: number
}

export class FireDamageManager {
  private burningEntities: Map<string, BurningEntity> = new Map()
  private lastTickTime: number = Date.now()
  private tickRate: number = 1000 // 1 second

  /**
   * Apply fire damage to entity
   */
  applyFireDamage(entityId: string, damagePerSecond: number, duration: number): void {
    this.burningEntities.set(entityId, {
      id: entityId,
      damagePerTick: damagePerSecond,
      duration: duration,
      startTime: Date.now()
    })
    console.log(`🔥 ${entityId} is burning! (${damagePerSecond} DMG/sec for ${duration}s)`)
  }

  /**
   * Update (tick damage)
   */
  update(onDamage: (entityId: string, damage: number) => void): void {
    const now = Date.now()
    
    // Tick damage
    if (now - this.lastTickTime >= this.tickRate) {
      this.burningEntities.forEach((burning, entityId) => {
        const elapsed = (now - burning.startTime) / 1000
        
        if (elapsed < burning.duration) {
          // Apply damage
          onDamage(entityId, burning.damagePerTick)
          console.log(`🔥 ${entityId} takes ${burning.damagePerTick} fire damage`)
        } else {
          // Duration expired
          this.burningEntities.delete(entityId)
          console.log(`🔥 ${entityId} is no longer burning`)
        }
      })
      
      this.lastTickTime = now
    }
  }

  /**
   * Check if entity is burning
   */
  isBurning(entityId: string): boolean {
    return this.burningEntities.has(entityId)
  }

  /**
   * Stop burning
   */
  stopBurning(entityId: string): void {
    this.burningEntities.delete(entityId)
  }

  /**
   * Get all burning entities
   */
  getBurningEntities(): string[] {
    return Array.from(this.burningEntities.keys())
  }
}

