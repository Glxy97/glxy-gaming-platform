'use client'

import * as THREE from 'three'
import type { ModelManager } from './ModelManager'
import type { InputManager } from './InputManager'
import type { SpatialHashGrid, BoundingBoxSystem } from './OptimizationModules'
import type { PhysicsEngine } from '../physics/PhysicsEngine'
import type { EffectsManager } from '../effects/EffectsManager'
import type { AbilitySystem } from '../characters/AbilitySystem'
import type { EnemyAIManager } from './EnemyAIManager'
import type { HitMarkerSystem, DamageIndicatorSystem } from './FPSFeatures'
import type { DynamicCrosshair, KillStreakDisplay, LowHealthVignette, SprintFOV, LandingShake } from '../features/QuickFeatures'
import type { RecoilManager } from '../weapons/RecoilSystem'
import type { HitboxSystemManager } from '../systems/HitboxSystem'
import type { AdvancedVisualFeedbackManager } from '../features/AdvancedVisualFeedback'
import type { FPSGameModeManager } from '../modes/GameModeSystem'
import type { MapInteractionManager } from '../systems/MapInteractionSystem'
import type { KillFeedManager } from '../ui/KillFeedManager'
import type { GrenadeSystem } from '../weapons/GrenadeSystem'
import type { FireDamageManager } from '../weapons/AmmoSystem'
import type { ScopeSystem } from '../weapons/ScopeSystem'
import type { MovementController } from '../movement/MovementController'
import type { FootstepManager } from '../audio/FootstepManager'
import type { MovementFeelManager } from '../features/MovementFeelEnhancements'
import type { AudioManager } from '../audio/AudioManager'
import type { PlayableCharacter } from '../types/CharacterTypes'
import { updateHealthBar } from './FPSFeatures'
import type { GameState } from './GameFlowManager'

export interface UltimateEnemy {
  id: string
  mesh: THREE.Group
  aiController: any
  physicsObject: any
  health: number
  maxHealth: number
  healthBar?: THREE.Object3D
  currentPath?: THREE.Vector3[]
  pathIndex?: number
  lastPathUpdateTime?: number
}

export interface UpdateLoopDependencies {
  // Core
  clock: THREE.Clock
  camera: THREE.Camera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer

  // Game State
  gameState: GameState
  player: {
    position: THREE.Vector3
    mesh: THREE.Object3D
    stats: {
      health: number
      maxHealth: number
      armor: number
    }
  }
  enemies: UltimateEnemy[]
  selectedCharacter: PlayableCharacter

  // Managers
  modelManager: ModelManager
  inputManager: InputManager
  spatialGrid: SpatialHashGrid
  boundingBoxSystem: BoundingBoxSystem
  physicsEngine: PhysicsEngine
  effectsManager: EffectsManager
  abilitySystem: AbilitySystem
  enemyAIManager: EnemyAIManager
  hitMarkerSystem: HitMarkerSystem
  damageIndicatorSystem: DamageIndicatorSystem
  dynamicCrosshair: DynamicCrosshair
  killStreakDisplay: KillStreakDisplay
  lowHealthVignette: LowHealthVignette
  recoilManager: RecoilManager
  hitboxManager: HitboxSystemManager
  advancedVisualFeedback: AdvancedVisualFeedbackManager
  fpsGameModeManager: FPSGameModeManager
  mapInteractionManager: MapInteractionManager
  killFeedManager: KillFeedManager
  grenadeSystem: GrenadeSystem
  fireDamageManager: FireDamageManager
  sprintFOV: SprintFOV
  scopeSystem: ScopeSystem
  landingShake: LandingShake
  movementController: MovementController
  footstepManager: FootstepManager
  movementFeelManager: MovementFeelManager
  audioManager?: AudioManager

  // Canvas
  overlayCanvas: HTMLCanvasElement

  // Callbacks
  onEnemyDeath: (enemy: UltimateEnemy) => void
  onUpdateHUD: () => void

  // Rendering components
  abilityHUDRenderer: any
  minimapRenderer: any
  ammoHUDRenderer: any
  ammoSystem: any
  grenadeHUDRenderer: any
  currentGrenadeType: any
  scopeOverlayRenderer: any
  showScoreboard: boolean
  scoreboardManager: any
}

/**
 * 🔄 UPDATE LOOP MANAGER
 *
 * Manages the entire game update loop:
 * - System updates (physics, effects, AI, etc.)
 * - Overlay rendering (HUD, crosshair, minimap, etc.)
 * - Camera effects (FOV, shake, bob)
 * - Audio updates
 */
export class UpdateLoopManager {
  private deps: UpdateLoopDependencies
  private lastGroundedState: boolean = false

  constructor(dependencies: UpdateLoopDependencies) {
    this.deps = dependencies
  }

  /**
   * Main game update loop
   */
  public update(): void {
    // Game-Updates nur wenn aktiv
    if (this.deps.gameState.isGameActive && !this.deps.gameState.isPaused) {
      const deltaTime = Math.min(this.deps.clock.getDelta(), 0.1) // Clamp to prevent physics explosion
      this.deps.gameState.roundTime += deltaTime

      this.updateSystems(deltaTime)
      this.updateCameraEffects(deltaTime)
      this.renderOverlays()
      this.updateAudio()
      this.finalizeUpdate()
    } else {
      // Auch wenn pausiert: Hit Markers & Damage Indicators rendern
      this.renderPausedOverlays()
    }

    // ✅ KRITISCH: Rendering IMMER (auch wenn pausiert)
    this.deps.renderer.render(this.deps.scene, this.deps.camera)
  }

  /**
   * Update all game systems
   */
  private updateSystems(deltaTime: number): void {
    // Animation Mixers Update (nur für sichtbare Models)
    this.deps.modelManager.updateAnimationMixers(deltaTime, this.deps.camera)

    // Update player movement via InputManager
    this.deps.inputManager.updatePlayerMovement(deltaTime)

    // PERFORMANCE: Spatial Grid für Player-Updates
    this.deps.spatialGrid.update({
      id: 'player',
      position: this.deps.player.position,
      radius: 1.5,
      type: 'player',
      data: this.deps.player
    })

    // Bounding Box Update für Player
    this.deps.boundingBoxSystem.updateBox('player', this.deps.player.mesh)

    // Update physics
    this.deps.physicsEngine.update(deltaTime)

    // Update effects
    this.deps.effectsManager.update(deltaTime)

    // ⚡ Update Ability System with Game State
    if (this.deps.abilitySystem) {
      this.deps.abilitySystem.setGameState(
        this.deps.player.mesh,
        {
          current: this.deps.player.stats.health,
          max: this.deps.player.stats.maxHealth,
          armor: this.deps.player.stats.armor
        },
        this.deps.enemies.map(e => ({
          mesh: e.mesh,
          health: e.health,
          id: e.id
        }))
      )
    }

    // 🆕 Update Character Ability System
    this.deps.abilitySystem.update(deltaTime)

    // 🆕 Charge Ultimate over time (if character has passive charge)
    if (this.deps.selectedCharacter.abilities.ultimate.chargeOverTime > 0) {
      this.deps.abilitySystem.chargeUltimate(deltaTime, 'time')
    }

    // 🤖 Update enemies via EnemyAIManager
    this.deps.enemyAIManager.update(deltaTime)

    // ✅ Update & Render Hit Markers & Damage Indicators
    this.deps.hitMarkerSystem.update(deltaTime)
    this.deps.damageIndicatorSystem.update(deltaTime)

    // 💡 Update Quick Features
    this.deps.dynamicCrosshair.update(deltaTime)
    this.deps.killStreakDisplay.update(deltaTime)
    this.deps.lowHealthVignette.update(this.deps.player.stats.health / this.deps.player.stats.maxHealth, deltaTime)

    // 🎯 Update Recoil System (Recovery)
    this.deps.recoilManager.update(deltaTime)

    // 🎯 Update Hitbox System
    this.deps.hitboxManager.update()

    // 🎨 Update Advanced Visual Feedback
    this.deps.advancedVisualFeedback.update(deltaTime)

    // 🎮 Update Game Mode
    this.deps.fpsGameModeManager.update(deltaTime)

    // 🗺️ Update Map Interactions
    this.deps.mapInteractionManager.update(deltaTime)

    // 📋 Update Kill Feed
    this.deps.killFeedManager.update()

    // 💣 Update Grenades
    this.deps.grenadeSystem.update(deltaTime)

    // 💥 Update Fire Damage
    this.deps.fireDamageManager.update((entityId, damage) => {
      const enemy = this.deps.enemies.find(e => e.id === entityId)
      if (enemy && enemy.health > 0) {
        enemy.health = Math.max(0, enemy.health - damage)

        // Update health bar
        if (enemy.healthBar) {
          updateHealthBar(enemy.healthBar, enemy.health, enemy.maxHealth)
        }

        // Check if killed by fire
        if (enemy.health <= 0) {
          this.deps.onEnemyDeath(enemy)
        }
      }
    })
  }

  /**
   * Update camera effects (FOV, shake, bob)
   */
  private updateCameraEffects(deltaTime: number): void {
    // 💡 Sprint FOV
    let newFOV = this.deps.sprintFOV.update(deltaTime)

    // 🔭 Scope FOV (overrides sprint FOV if scoped)
    const scopeFOV = this.deps.scopeSystem.update(deltaTime)
    if (this.deps.scopeSystem.getIsScoped()) {
      newFOV = scopeFOV
    }

    if ((this.deps.camera as THREE.PerspectiveCamera).fov !== newFOV) {
      (this.deps.camera as THREE.PerspectiveCamera).fov = newFOV
      ;(this.deps.camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }

    // 💡 Landing Shake
    this.deps.landingShake.update(deltaTime)
    const isGrounded = this.deps.movementController.isGrounded
    if (isGrounded && !this.lastGroundedState) {
      // Just landed
      const velocity = this.deps.movementController.velocity
      this.deps.landingShake.trigger(velocity.y)

      // 👣 Landing Sound
      if (this.deps.scene && this.deps.scene.children && Array.isArray(this.deps.scene.children) && this.deps.scene.children.length > 0) {
        const surface = this.deps.footstepManager.detectSurface(this.deps.player.position, this.deps.scene)
        this.deps.footstepManager.playLand(surface, this.deps.player.position, Math.min(Math.abs(velocity.y) / 10, 1))
      }
    }
    this.lastGroundedState = isGrounded

    // Apply landing shake to camera
    if (this.deps.landingShake.isShaking()) {
      const shakeOffset = this.deps.landingShake.getShakeOffset()
      this.deps.camera.rotation.x += shakeOffset.y
      this.deps.camera.rotation.y += shakeOffset.x
    }

    // 🏃 Apply Camera Bob
    const cameraBobOffset = this.deps.movementFeelManager.getCameraBobOffset()
    this.deps.camera.position.y += cameraBobOffset.y
    this.deps.camera.position.x += cameraBobOffset.x
  }

  /**
   * Render all overlays (HUD, crosshair, minimap, etc.)
   */
  private renderOverlays(): void {
    const ctx = this.deps.overlayCanvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, this.deps.overlayCanvas.width, this.deps.overlayCanvas.height)

    // Hit Markers & Damage Indicators
    this.deps.hitMarkerSystem.render()
    this.deps.damageIndicatorSystem.render()

    // 💡 Render Quick Features
    const centerX = this.deps.overlayCanvas.width / 2
    const centerY = this.deps.overlayCanvas.height / 2

    // Dynamic Crosshair
    this.deps.dynamicCrosshair.render(ctx, centerX, centerY)

    // Kill Streak Display
    this.deps.killStreakDisplay.render(ctx, centerX, centerY)

    // Low HP Vignette
    this.deps.lowHealthVignette.render(ctx, this.deps.overlayCanvas.width, this.deps.overlayCanvas.height)

    // 🎨 Render Advanced Visual Feedback (Screen Flash, Damage Numbers)
    this.deps.advancedVisualFeedback.render(ctx, this.deps.overlayCanvas.width, this.deps.overlayCanvas.height)

    // ⚡ Render Ability HUD
    const abilityHUDData = {
      activeName: this.deps.selectedCharacter.abilities.active.name,
      activeCooldown: this.deps.abilitySystem.getActiveAbilityState()?.cooldownRemaining || 0,
      activeMaxCooldown: this.deps.selectedCharacter.abilities.active.cooldown,
      activeCharges: this.deps.abilitySystem.getActiveAbilityState()?.chargesRemaining || 1,
      activeKey: 'E',
      ultimateName: this.deps.selectedCharacter.abilities.ultimate.name,
      ultimateCharge: (this.deps.abilitySystem.getUltimateAbilityState()?.charge || 0) / this.deps.selectedCharacter.abilities.ultimate.chargeRequired * 100,
      ultimateKey: 'Q',
      ultimateReady: this.deps.abilitySystem.getUltimateAbilityState()?.isReady || false
    }
    this.deps.abilityHUDRenderer.render(ctx, abilityHUDData)

    // ⚡ Render Minimap
    const minimapData = {
      playerPosition: this.deps.player.position,
      playerRotation: this.deps.camera.rotation.y,
      enemies: this.deps.enemies.map(e => ({
        position: e.mesh.position,
        distance: e.mesh.position.distanceTo(this.deps.player.position)
      })),
      mapSize: { width: 200, height: 200 }
    }
    this.deps.minimapRenderer.render(ctx, minimapData)

    // 📋 Render Kill Feed
    this.deps.killFeedManager.render(ctx, this.deps.overlayCanvas.width, this.deps.overlayCanvas.height)

    // 💥 Render Ammo Type HUD (bottom-left)
    const ammoState = this.deps.ammoSystem.getState()
    this.deps.ammoHUDRenderer.render(ctx, ammoState, 20, this.deps.overlayCanvas.height - 100)

    // 💣 Render Grenade HUD (bottom-left, below ammo)
    const grenadeState = {
      currentType: this.deps.currentGrenadeType,
      inventory: this.deps.grenadeSystem.getInventory()
    }
    this.deps.grenadeHUDRenderer.render(ctx, grenadeState, 20, this.deps.overlayCanvas.height - 240)

    // 🔭 Render Scope Overlay (if scoped with overlay)
    if (this.deps.scopeSystem.hasOverlay()) {
      this.deps.scopeOverlayRenderer.render(
        ctx,
        this.deps.overlayCanvas.width,
        this.deps.overlayCanvas.height,
        this.deps.scopeSystem.getZoomLevel()
      )
    }

    // 📊 Render Scoreboard (if shown)
    if (this.deps.showScoreboard) {
      this.deps.scoreboardManager.render(ctx, this.deps.overlayCanvas.width, this.deps.overlayCanvas.height)
    }
  }

  /**
   * Render minimal overlays when paused
   */
  private renderPausedOverlays(): void {
    const ctx = this.deps.overlayCanvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, this.deps.overlayCanvas.width, this.deps.overlayCanvas.height)
    this.deps.hitMarkerSystem.render()
    this.deps.damageIndicatorSystem.render()
  }

  /**
   * Update audio listener position
   */
  private updateAudio(): void {
    this.deps.audioManager?.updateListener(
      this.deps.camera.position,
      this.deps.camera.getWorldDirection(new THREE.Vector3()),
      new THREE.Vector3(0, 1, 0)
    )
  }

  /**
   * Finalize update (spawn enemies, update HUD)
   */
  private finalizeUpdate(): void {
    // 🤖 Auto-spawn enemies via EnemyAIManager
    this.deps.enemyAIManager.autoSpawn()

    // Update HUD
    this.deps.onUpdateHUD()
  }
}
