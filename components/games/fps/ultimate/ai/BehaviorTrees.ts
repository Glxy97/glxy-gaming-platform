/**
 * 🧠 AI BEHAVIOR TREES
 * 
 * Definiert intelligente AI-Verhaltensweisen für verschiedene Enemy Classes
 * Tactical, Rush, Defensive, Sniper, Berserker
 */

import * as THREE from 'three'
import { EnemyBehavior, EnemyClassConfig } from './EnemyClasses'

// ============================================================================
// BEHAVIOR TREE TYPES
// ============================================================================

export interface BehaviorContext {
  // Enemy State
  enemyPosition: THREE.Vector3
  enemyHealth: number
  enemyMaxHealth: number
  isInCover: boolean
  hasLineOfSight: boolean
  
  // Player State
  playerPosition: THREE.Vector3
  distanceToPlayer: number
  lastSeenPlayerPosition?: THREE.Vector3
  timeSinceLastSeen: number
  
  // Combat State
  currentWeapon: any
  ammo: number
  isReloading: boolean
  timeSinceLastShot: number
  
  // Team State
  nearbyAllies: THREE.Vector3[]
  nearbyEnemies: THREE.Vector3[]
  
  // Environment
  scene: THREE.Scene
  coverPoints: THREE.Vector3[]
  flankingRoutes: THREE.Vector3[]
  
  // Time
  deltaTime: number
  timestamp: number
}

export interface BehaviorAction {
  type: ActionType
  target?: THREE.Vector3
  priority: number
  duration?: number
}

export enum ActionType {
  // Movement
  MOVE_TO = 'move_to',
  RUSH = 'rush',
  RETREAT = 'retreat',
  TAKE_COVER = 'take_cover',
  FLANK = 'flank',
  HOLD_POSITION = 'hold_position',
  
  // Combat
  SHOOT = 'shoot',
  RELOAD = 'reload',
  THROW_GRENADE = 'throw_grenade',
  THROW_FLASHBANG = 'throw_flashbang',
  
  // Communication
  CALL_BACKUP = 'call_backup',
  ALERT_ALLIES = 'alert_allies',
  
  // Special
  USE_ABILITY = 'use_ability',
  SUPPRESS_FIRE = 'suppress_fire',
  AIM_LASER = 'aim_laser',
  
  // Utility
  PATROL = 'patrol',
  SEARCH = 'search',
  WAIT = 'wait'
}

// ============================================================================
// BEHAVIOR TREE MANAGER
// ============================================================================

export class BehaviorTreeManager {
  private behaviors: Map<EnemyBehavior, BehaviorTreeFunction> = new Map()

  constructor() {
    // Register all behaviors
    this.behaviors.set(EnemyBehavior.RUSH, this.rushBehavior.bind(this))
    this.behaviors.set(EnemyBehavior.TACTICAL, this.tacticalBehavior.bind(this))
    this.behaviors.set(EnemyBehavior.DEFENSIVE, this.defensiveBehavior.bind(this))
    this.behaviors.set(EnemyBehavior.SNIPER, this.sniperBehavior.bind(this))
    this.behaviors.set(EnemyBehavior.BERSERKER, this.berserkerBehavior.bind(this))
    
    console.log('🧠 BehaviorTreeManager initialized with 5 behaviors')
  }

  /**
   * Execute behavior tree for enemy
   */
  executeBehavior(
    behavior: EnemyBehavior,
    config: EnemyClassConfig,
    context: BehaviorContext
  ): BehaviorAction {
    const behaviorFunc = this.behaviors.get(behavior)
    if (!behaviorFunc) {
      console.warn(`Unknown behavior: ${behavior}`)
      return { type: ActionType.HOLD_POSITION, priority: 0 }
    }
    
    return behaviorFunc(config, context)
  }

  // ============================================================================
  // RUSH BEHAVIOR (Grunt, Rusher)
  // ============================================================================

  private rushBehavior(config: EnemyClassConfig, ctx: BehaviorContext): BehaviorAction {
    // Decision Tree:
    // 1. If low HP → Charge aggressively (suicide rush)
    // 2. If has LOS → Shoot while moving
    // 3. If close → Shoot
    // 4. Otherwise → Rush to player

    const healthPercent = ctx.enemyHealth / ctx.enemyMaxHealth
    
    // 1. Low HP → Berserker rush
    if (healthPercent < 0.3) {
      return {
        type: ActionType.RUSH,
        target: ctx.playerPosition,
        priority: 10
      }
    }
    
    // 2. Has LOS and in range → Shoot
    if (ctx.hasLineOfSight && ctx.distanceToPlayer < 40) {
      return {
        type: ActionType.SHOOT,
        target: ctx.playerPosition,
        priority: 8
      }
    }
    
    // 3. Close range → Shoot
    if (ctx.distanceToPlayer < 15) {
      return {
        type: ActionType.SHOOT,
        target: ctx.playerPosition,
        priority: 9
      }
    }
    
    // 4. Default → Rush to player
    return {
      type: ActionType.RUSH,
      target: ctx.playerPosition,
      priority: 7
    }
  }

  // ============================================================================
  // TACTICAL BEHAVIOR (Elite)
  // ============================================================================

  private tacticalBehavior(config: EnemyClassConfig, ctx: BehaviorContext): BehaviorAction {
    // Decision Tree:
    // 1. If low HP → Retreat to cover and call backup
    // 2. If no cover → Find cover
    // 3. If can flank → Execute flank
    // 4. If has LOS from cover → Shoot
    // 5. If too close → Retreat to preferred range
    // 6. If grenade available and player static → Throw grenade
    // 7. Otherwise → Move to tactical position

    const healthPercent = ctx.enemyHealth / ctx.enemyMaxHealth
    const inPreferredRange = ctx.distanceToPlayer >= config.preferredRange.min && 
                             ctx.distanceToPlayer <= config.preferredRange.max
    
    // 1. Low HP → Retreat and call backup
    if (healthPercent < 0.4) {
      if (config.callsBackup && Math.random() < 0.5) {
        return {
          type: ActionType.CALL_BACKUP,
          priority: 10
        }
      }
      
      const coverPoint = this.findNearestCover(ctx)
      if (coverPoint) {
        return {
          type: ActionType.RETREAT,
          target: coverPoint,
          priority: 10
        }
      }
    }
    
    // 2. No cover → Find cover
    if (!ctx.isInCover) {
      const coverPoint = this.findNearestCover(ctx)
      if (coverPoint) {
        return {
          type: ActionType.TAKE_COVER,
          target: coverPoint,
          priority: 8
        }
      }
    }
    
    // 3. Can flank → Execute
    if (config.canFlank && this.canFlank(ctx)) {
      const flankRoute = this.findFlankingRoute(ctx)
      if (flankRoute) {
        return {
          type: ActionType.FLANK,
          target: flankRoute,
          priority: 9
        }
      }
    }
    
    // 4. Has LOS from cover → Shoot
    if (ctx.hasLineOfSight && ctx.isInCover && inPreferredRange) {
      return {
        type: ActionType.SHOOT,
        target: ctx.playerPosition,
        priority: 9
      }
    }
    
    // 5. Too close → Retreat
    if (ctx.distanceToPlayer < config.preferredRange.min) {
      return {
        type: ActionType.RETREAT,
        target: this.calculateRetreatPosition(ctx, config),
        priority: 7
      }
    }
    
    // 6. Grenade opportunity
    if (config.usesGrenade && this.isGrenadeOpportunity(ctx)) {
      return {
        type: ActionType.THROW_GRENADE,
        target: ctx.playerPosition,
        priority: 8
      }
    }
    
    // 7. Default → Move to tactical position
    return {
      type: ActionType.MOVE_TO,
      target: this.findTacticalPosition(ctx, config),
      priority: 6
    }
  }

  // ============================================================================
  // DEFENSIVE BEHAVIOR (Heavy)
  // ============================================================================

  private defensiveBehavior(config: EnemyClassConfig, ctx: BehaviorContext): BehaviorAction {
    // Decision Tree:
    // 1. If HP < 50% and can heal → Use ability
    // 2. If player too close → Suppressive fire
    // 3. If in preferred range → Shoot
    // 4. If not in good position → Find defensive position
    // 5. If surrounded → Call backup
    // 6. Otherwise → Hold position and shoot

    const healthPercent = ctx.enemyHealth / ctx.enemyMaxHealth
    
    // 1. Low HP → Use defensive ability
    if (healthPercent < 0.5 && config.specialAbilities) {
      return {
        type: ActionType.USE_ABILITY,
        priority: 10
      }
    }
    
    // 2. Player too close → Suppressive fire
    if (ctx.distanceToPlayer < 20) {
      return {
        type: ActionType.SUPPRESS_FIRE,
        target: ctx.playerPosition,
        priority: 9
      }
    }
    
    // 3. In range → Shoot
    if (ctx.hasLineOfSight && ctx.distanceToPlayer < config.preferredRange.max) {
      return {
        type: ActionType.SHOOT,
        target: ctx.playerPosition,
        priority: 8
      }
    }
    
    // 4. Bad position → Find defensive spot
    if (!this.isGoodDefensivePosition(ctx)) {
      return {
        type: ActionType.MOVE_TO,
        target: this.findDefensivePosition(ctx),
        priority: 7
      }
    }
    
    // 5. Surrounded → Call backup
    if (ctx.nearbyEnemies.length > 2 && config.callsBackup) {
      return {
        type: ActionType.CALL_BACKUP,
        priority: 8
      }
    }
    
    // 6. Default → Hold and shoot
    return {
      type: ActionType.HOLD_POSITION,
      priority: 6
    }
  }

  // ============================================================================
  // SNIPER BEHAVIOR
  // ============================================================================

  private sniperBehavior(config: EnemyClassConfig, ctx: BehaviorContext): BehaviorAction {
    // Decision Tree:
    // 1. If spotted (player looking) → Relocate
    // 2. If no vantage point → Find one
    // 3. If player in range and has LOS → Aim and shoot
    // 4. If player too close → Retreat to long range
    // 5. If allies engaged → Provide covering fire
    // 6. Otherwise → Wait and observe

    // 1. If spotted → Relocate
    if (this.isSpotted(ctx)) {
      return {
        type: ActionType.RETREAT,
        target: this.findVantagePoint(ctx),
        priority: 10
      }
    }
    
    // 2. No vantage point → Find one
    if (!this.isAtVantagePoint(ctx)) {
      return {
        type: ActionType.MOVE_TO,
        target: this.findVantagePoint(ctx),
        priority: 9
      }
    }
    
    // 3. In range → Aim laser and shoot
    if (ctx.hasLineOfSight && 
        ctx.distanceToPlayer >= config.preferredRange.min &&
        ctx.distanceToPlayer <= config.preferredRange.max) {
      return {
        type: ActionType.AIM_LASER,
        target: ctx.playerPosition,
        priority: 10
      }
    }
    
    // 4. Too close → Retreat
    if (ctx.distanceToPlayer < config.preferredRange.min) {
      return {
        type: ActionType.RETREAT,
        target: this.findVantagePoint(ctx),
        priority: 9
      }
    }
    
    // 5. Allies engaged → Support
    if (ctx.nearbyAllies.length > 0 && ctx.hasLineOfSight) {
      return {
        type: ActionType.SHOOT,
        target: ctx.playerPosition,
        priority: 7
      }
    }
    
    // 6. Default → Wait
    return {
      type: ActionType.WAIT,
      priority: 5
    }
  }

  // ============================================================================
  // BERSERKER BEHAVIOR (Rusher with low HP)
  // ============================================================================

  private berserkerBehavior(config: EnemyClassConfig, ctx: BehaviorContext): BehaviorAction {
    // Decision Tree:
    // 1. ALWAYS rush to player
    // 2. Shoot while moving
    // 3. Throw grenade when close
    // 4. NO RETREAT, NO COVER

    const healthPercent = ctx.enemyHealth / ctx.enemyMaxHealth
    
    // Low HP → Even more aggressive
    if (healthPercent < 0.3) {
      if (config.specialAbilities && config.specialAbilities[0]?.id === 'adrenaline_rush') {
        return {
          type: ActionType.USE_ABILITY,
          priority: 10
        }
      }
    }
    
    // Close range → Grenade
    if (ctx.distanceToPlayer < 10 && config.usesGrenade) {
      return {
        type: ActionType.THROW_GRENADE,
        target: ctx.playerPosition,
        priority: 9
      }
    }
    
    // Has LOS → Shoot while rushing
    if (ctx.hasLineOfSight) {
      return {
        type: ActionType.SHOOT,
        target: ctx.playerPosition,
        priority: 8
      }
    }
    
    // Default → RUSH!
    return {
      type: ActionType.RUSH,
      target: ctx.playerPosition,
      priority: 10
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private findNearestCover(ctx: BehaviorContext): THREE.Vector3 | null {
    if (ctx.coverPoints.length === 0) return null
    
    // Find nearest cover point
    let nearest: THREE.Vector3 | null = null
    let minDist = Infinity
    
    ctx.coverPoints.forEach(cover => {
      const dist = ctx.enemyPosition.distanceTo(cover)
      if (dist < minDist) {
        minDist = dist
        nearest = cover
      }
    })
    
    return nearest
  }

  private canFlank(ctx: BehaviorContext): boolean {
    // Check if flanking is possible
    return ctx.flankingRoutes.length > 0 && 
           ctx.distanceToPlayer > 15 &&
           ctx.timeSinceLastSeen < 5
  }

  private findFlankingRoute(ctx: BehaviorContext): THREE.Vector3 | null {
    if (ctx.flankingRoutes.length === 0) return null
    
    // Select random flanking route
    const randomIndex = Math.floor(Math.random() * ctx.flankingRoutes.length)
    return ctx.flankingRoutes[randomIndex]
  }

  private calculateRetreatPosition(ctx: BehaviorContext, config: EnemyClassConfig): THREE.Vector3 {
    // Calculate position away from player
    const direction = new THREE.Vector3()
      .subVectors(ctx.enemyPosition, ctx.playerPosition)
      .normalize()
    
    return ctx.enemyPosition.clone().add(direction.multiplyScalar(config.preferredRange.min))
  }

  private findTacticalPosition(ctx: BehaviorContext, config: EnemyClassConfig): THREE.Vector3 {
    // Find position in preferred range with cover
    const nearestCover = this.findNearestCover(ctx)
    if (nearestCover) return nearestCover
    
    // Fallback: Position at preferred range
    const direction = new THREE.Vector3()
      .subVectors(ctx.enemyPosition, ctx.playerPosition)
      .normalize()
    
    const targetRange = (config.preferredRange.min + config.preferredRange.max) / 2
    return ctx.playerPosition.clone().add(direction.multiplyScalar(targetRange))
  }

  private isGrenadeOpportunity(ctx: BehaviorContext): boolean {
    // Check if player is stationary and in range
    return ctx.distanceToPlayer > 10 && 
           ctx.distanceToPlayer < 30 &&
           ctx.hasLineOfSight
  }

  private isGoodDefensivePosition(ctx: BehaviorContext): boolean {
    // Check if current position is defensible
    return ctx.isInCover || 
           (ctx.nearbyAllies.length > 0 && ctx.distanceToPlayer > 15)
  }

  private findDefensivePosition(ctx: BehaviorContext): THREE.Vector3 {
    // Find position with cover and good sightlines
    const nearestCover = this.findNearestCover(ctx)
    if (nearestCover) return nearestCover
    
    // Fallback: Position near allies
    if (ctx.nearbyAllies.length > 0) {
      return ctx.nearbyAllies[0]
    }
    
    return ctx.enemyPosition
  }

  private isSpotted(ctx: BehaviorContext): boolean {
    // Check if player is looking at sniper
    // TODO: Implement actual line-of-sight check from player camera
    return ctx.hasLineOfSight && ctx.distanceToPlayer < 50 && Math.random() < 0.1
  }

  private isAtVantagePoint(ctx: BehaviorContext): boolean {
    // Check if at good sniper position
    return ctx.isInCover && ctx.distanceToPlayer > 40
  }

  private findVantagePoint(ctx: BehaviorContext): THREE.Vector3 {
    // Find elevated position with long sightlines
    const coverPoint = this.findNearestCover(ctx)
    if (coverPoint && ctx.enemyPosition.distanceTo(coverPoint) > 40) {
      return coverPoint
    }
    
    // Fallback: Position far from player
    const direction = new THREE.Vector3()
      .subVectors(ctx.enemyPosition, ctx.playerPosition)
      .normalize()
    
    return ctx.playerPosition.clone().add(direction.multiplyScalar(60))
  }
}

type BehaviorTreeFunction = (config: EnemyClassConfig, ctx: BehaviorContext) => BehaviorAction

