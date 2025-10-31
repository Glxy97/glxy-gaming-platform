// NO @ts-nocheck - Type-safe collision handling
'use client'

import * as THREE from 'three'
import { PhysicsEngine } from '../physics/PhysicsEngine'
import { CollisionLayer } from '../physics/data/PhysicsData'
import { EffectsManager } from '../effects/EffectsManager'
import { VisualEffectsManager } from '../effects/VisualEffectsManager'
import { AudioManager } from '../audio/AudioManager'
import { HitMarkerSystem, DamageIndicatorSystem } from './FPSFeatures'
import { AdvancedVisualFeedbackManager } from '../features/AdvancedVisualFeedback'
import { HitboxSystemManager, HitboxZone } from '../systems/HitboxSystem'
import { MapInteractionManager } from '../systems/MapInteractionSystem'
import type { BaseWeapon } from '../weapons/BaseWeapon'
import type { GameEnemy, UltimatePlayerStats } from './UltimateFPSEngineV4'

/**
 * 💥 COLLISION HANDLER
 *
 * Centralized collision and damage handling.
 * Extracted from UltimateFPSEngineV4 (~300 LOC)
 *
 * Responsibilities:
 * - Bullet hit detection and damage
 * - Environment hit effects
 * - Player damage handling
 * - Hit markers and visual feedback
 */
export class CollisionHandler {
  // Dependencies
  private physicsEngine: PhysicsEngine
  private effectsManager: EffectsManager
  private visualEffectsManager: VisualEffectsManager
  private audioManager: AudioManager
  private hitMarkerSystem: HitMarkerSystem
  private damageIndicatorSystem: DamageIndicatorSystem
  private advancedVisualFeedback: AdvancedVisualFeedbackManager
  private hitboxManager: HitboxSystemManager
  private mapInteractionManager: MapInteractionManager

  // Game State References
  private player: {
    mesh: THREE.Group
    position: THREE.Vector3
    stats: UltimatePlayerStats
  }
  private gameState: {
    shotsHit: number
    damageTaken: number
    headshots: number
  }
  private camera: THREE.PerspectiveCamera

  // Callbacks
  private onEnemyHit: (enemy: GameEnemy, damage: number, isHeadshot: boolean, hitPoint: THREE.Vector3) => void
  private onScreenFlash: (type: 'red' | 'white') => void

  constructor(deps: {
    physicsEngine: PhysicsEngine
    effectsManager: EffectsManager
    visualEffectsManager: VisualEffectsManager
    audioManager: AudioManager
    hitMarkerSystem: HitMarkerSystem
    damageIndicatorSystem: DamageIndicatorSystem
    advancedVisualFeedback: AdvancedVisualFeedbackManager
    hitboxManager: HitboxSystemManager
    mapInteractionManager: MapInteractionManager
    player: { mesh: THREE.Group; position: THREE.Vector3; stats: UltimatePlayerStats }
    gameState: { shotsHit: number; damageTaken: number; headshots: number }
    camera: THREE.PerspectiveCamera
    onEnemyHit: (enemy: GameEnemy, damage: number, isHeadshot: boolean, hitPoint: THREE.Vector3) => void
    onScreenFlash: (type: 'red' | 'white') => void
  }) {
    this.physicsEngine = deps.physicsEngine
    this.effectsManager = deps.effectsManager
    this.visualEffectsManager = deps.visualEffectsManager
    this.audioManager = deps.audioManager
    this.hitMarkerSystem = deps.hitMarkerSystem
    this.damageIndicatorSystem = deps.damageIndicatorSystem
    this.advancedVisualFeedback = deps.advancedVisualFeedback
    this.hitboxManager = deps.hitboxManager
    this.mapInteractionManager = deps.mapInteractionManager
    this.player = deps.player
    this.gameState = deps.gameState
    this.camera = deps.camera
    this.onEnemyHit = deps.onEnemyHit
    this.onScreenFlash = deps.onScreenFlash
  }

  /**
   * 💥 Handle Bullet Hit (Main collision handler)
   */
  public handleBulletHit(event: {
    point: THREE.Vector3
    normal: THREE.Vector3
    object: THREE.Object3D
    damage: number
    weapon: BaseWeapon
  }): void {
    // Check if enemy hit using hitbox system
    const hitResult = this.hitboxManager.checkHit(event.point, 0.5)

    if (hitResult) {
      // Enemy hit detected
      const enemyId = hitResult.characterId
      const zone = hitResult.zone
      const isHeadshot = zone === HitboxZone.HEAD

      // Calculate damage multiplier based on hit zone
      let damageMultiplier = 1.0
      switch (zone) {
        case HitboxZone.HEAD:
          damageMultiplier = 3.0
          break
        case HitboxZone.CHEST:
          damageMultiplier = 1.5
          break
        case HitboxZone.LEGS:
          damageMultiplier = 0.8
          break
        default:
          damageMultiplier = 1.0
      }

      const finalDamage = event.damage * damageMultiplier

      // Hit marker
      this.hitMarkerSystem.addHitMarker(isHeadshot)

      // Visual feedback
      this.advancedVisualFeedback.showDamageNumber(finalDamage, event.point, this.camera, isHeadshot)

      // Effects
      if (isHeadshot) {
        this.effectsManager.spawnBloodSplatter(event.point, event.normal, true)
        this.audioManager?.playSound('hit_headshot', event.point)
      } else {
        this.effectsManager.spawnBloodSplatter(event.point, event.normal)
        this.audioManager?.playSound('hit_flesh', event.point)
      }

      // Game state
      this.gameState.shotsHit++
      if (isHeadshot) {
        this.gameState.headshots++
      }

      // Notify enemy damage (delegate to EnemyAIManager)
      // Note: Enemy reference needs to be found from hitResult.characterId
      // This is handled by the callback
      this.onEnemyHit(hitResult as any, finalDamage, isHeadshot, event.point)
    } else {
      // Environment hit
      this.handleEnvironmentHit({
        point: event.point,
        face: { normal: event.normal } as THREE.Face,
        object: event.object
      } as THREE.Intersection)
    }
  }

  /**
   * 🌍 Handle Environment Hit
   */
  public handleEnvironmentHit(intersection: THREE.Intersection): void {
    // Visual effects
    const material = intersection.object.userData.material || 'concrete'
    this.visualEffectsManager.createImpactEffect(
      intersection.point,
      intersection.face?.normal || new THREE.Vector3(0, 1, 0),
      material as 'metal' | 'concrete' | 'wood'
    )

    // Legacy effects
    this.effectsManager.spawnEffect('bullet_impact', intersection.point)

    // Map interaction damage
    this.mapInteractionManager.handleBulletImpact(intersection.object, 25)

    // Bullet hole decal
    this.advancedVisualFeedback.createBulletHole(
      intersection.point,
      intersection.face?.normal || new THREE.Vector3(0, 1, 0),
      material as 'metal' | 'concrete' | 'wood'
    )

    // Sound
    const soundId = material === 'metal' ? 'impact_metal' :
                    material === 'wood' ? 'impact_wood' : 'impact_concrete'
    this.audioManager?.playSound(soundId, intersection.point)
  }

  /**
   * 🩸 Handle Player Hit
   */
  public handlePlayerHit(damage: number, direction?: THREE.Vector3): void {
    // Armor reduction
    let actualDamage = damage
    if (this.player.stats.armor > 0) {
      const armorReduction = Math.min(this.player.stats.armor, damage * 0.5)
      actualDamage = damage - armorReduction
      this.player.stats.armor = Math.max(0, this.player.stats.armor - armorReduction)
    }

    this.player.stats.health -= actualDamage
    this.gameState.damageTaken += actualDamage

    // Damage indicator
    if (direction) {
      this.damageIndicatorSystem.addDamageIndicator(direction, actualDamage)
    }

    // Red screen flash
    this.onScreenFlash('red')

    // Death check handled by main engine
  }

  /**
   * 🔫 Handle AI Shoot (Enemy shoots player)
   */
  public handleAIShoot(shootData: {
    origin: THREE.Vector3
    direction: THREE.Vector3
    damage: number
  }): void {
    // Raycast to player
    const rayResult = this.physicsEngine.raycast(
      shootData.origin,
      shootData.direction,
      1000,
      [CollisionLayer.PLAYER]
    )

    if (rayResult.hit) {
      // Player hit
      const directionToPlayer = new THREE.Vector3()
        .subVectors(this.player.position, shootData.origin)
        .normalize()
      this.handlePlayerHit(shootData.damage || 10, directionToPlayer)

      // Effects
      this.effectsManager.spawnBloodSplatter(
        rayResult.point,
        rayResult.normal || new THREE.Vector3(0, 1, 0)
      )
    }

    // Muzzle flash
    this.effectsManager.spawnMuzzleFlash(shootData.origin, shootData.direction)
    this.audioManager?.playSound('enemy_fire', shootData.origin)
  }
}
