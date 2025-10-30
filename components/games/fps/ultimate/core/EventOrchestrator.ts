// NO @ts-nocheck - Type-safe event orchestration
'use client'

import * as THREE from 'three'

// Manager Imports
import { WeaponManager } from '../weapons/WeaponManager'
import { ProgressionManager, ProgressionEventType } from '../progression/ProgressionManager'
import { XPSource } from '../progression/data/ProgressionData'
import { MapManager, MapEventType } from '../maps/MapManager'
import { AudioManager, AudioEventType } from '../audio/AudioManager'
import { UIManager, UIEventType } from '../ui/UIManager'
import { NetworkManager, NetworkEventType } from '../networking/NetworkManager'
import { AbilitySystem } from '../characters/AbilitySystem'
import { WeaponProgressionManager } from '../progression/WeaponProgressionManager'
import { FPSGameModeManager } from '../modes/GameModeSystem'
import { GameFlowManager } from './GameFlowManager'
import { EffectsManager } from '../effects/EffectsManager'
import { VisualEffectsManager } from '../effects/VisualEffectsManager'
import { RecoilManager } from '../weapons/RecoilSystem'
import { DynamicCrosshair } from '../features/QuickFeatures'
import { NotificationType, createNotificationTemplate } from '../ui/data/UIData'
import { getWeaponSound } from '../audio/SoundLibrary'
import type { PlayableCharacter } from '../types/CharacterTypes'
import type { GameState } from './GameFlowManager'
import type { UltimateEnemy, UltimateGameState, UltimatePlayerStats } from './UltimateFPSEngineV4'

/**
 * 🎯 EVENT ORCHESTRATOR
 *
 * Centralizes all event setup and management for the FPS Engine.
 * Extracted from UltimateFPSEngineV4 (~570 LOC removed from main engine)
 *
 * Responsibilities:
 * - Setup all system events (Weapon, Progression, Map, Audio, UI, Network)
 * - Handle cross-system event communication
 * - Manage key bindings
 * - Apply settings changes
 */
export class EventOrchestrator {
  // Manager References
  private weaponManager: WeaponManager
  private progressionManager: ProgressionManager
  private mapManager: MapManager
  private audioManager: AudioManager
  private uiManager: UIManager
  private networkManager?: NetworkManager
  private abilitySystem: AbilitySystem
  private weaponProgressionManager: WeaponProgressionManager
  private fpsGameModeManager: FPSGameModeManager
  private gameFlowManager: GameFlowManager
  private effectsManager: EffectsManager
  private visualEffectsManager: VisualEffectsManager
  private recoilManager: RecoilManager
  private dynamicCrosshair: DynamicCrosshair

  // Game State References
  private player: {
    mesh: THREE.Group
    position: THREE.Vector3
    rotation: THREE.Euler
    stats: UltimatePlayerStats
  }
  private gameState: UltimateGameState
  private enemies: UltimateEnemy[]
  private camera: THREE.PerspectiveCamera
  private ground: THREE.Mesh
  private obstacles: THREE.Mesh[]
  private weaponModel: THREE.Group | null
  private selectedCharacter: PlayableCharacter
  private reserveAmmo: Map<string, number>

  // Callbacks
  private onEnemyDeath: (enemy: UltimateEnemy) => void
  private onKill: (data: any) => void
  private onEnvironmentHit: (intersection: THREE.Intersection) => void
  private onBulletHit: (event: any) => void
  private onUpdateHUD: () => void
  private onUpdateScoreboard: () => void
  private onCreateWeaponModel: () => Promise<void>
  private onNetworkStateUpdate: (data: any) => void
  private onSetupMapInScene: (mapData: any) => void
  private onSetSelectedCharacter: (character: PlayableCharacter) => void
  private uiRenderCallback?: (state: GameState, data: any) => void
  private showScoreboard: boolean = false

  // Original key handler reference
  private originalKeyDown?: (e: KeyboardEvent) => void

  constructor(deps: {
    weaponManager: WeaponManager
    progressionManager: ProgressionManager
    mapManager: MapManager
    audioManager: AudioManager
    uiManager: UIManager
    networkManager?: NetworkManager
    abilitySystem: AbilitySystem
    weaponProgressionManager: WeaponProgressionManager
    fpsGameModeManager: FPSGameModeManager
    gameFlowManager: GameFlowManager
    effectsManager: EffectsManager
    visualEffectsManager: VisualEffectsManager
    recoilManager: RecoilManager
    dynamicCrosshair: DynamicCrosshair
    player: any
    gameState: UltimateGameState
    enemies: UltimateEnemy[]
    camera: THREE.PerspectiveCamera
    ground: THREE.Mesh
    obstacles: THREE.Mesh[]
    weaponModel: THREE.Group | null
    selectedCharacter: PlayableCharacter
    reserveAmmo: Map<string, number>
    onEnemyDeath: (enemy: UltimateEnemy) => void
    onKill: (data: any) => void
    onEnvironmentHit: (intersection: THREE.Intersection) => void
    onBulletHit: (event: any) => void
    onUpdateHUD: () => void
    onUpdateScoreboard: () => void
    onCreateWeaponModel: () => Promise<void>
    onNetworkStateUpdate: (data: any) => void
    onSetupMapInScene: (mapData: any) => void
    onSetSelectedCharacter: (character: PlayableCharacter) => void
  }) {
    this.weaponManager = deps.weaponManager
    this.progressionManager = deps.progressionManager
    this.mapManager = deps.mapManager
    this.audioManager = deps.audioManager
    this.uiManager = deps.uiManager
    this.networkManager = deps.networkManager
    this.abilitySystem = deps.abilitySystem
    this.weaponProgressionManager = deps.weaponProgressionManager
    this.fpsGameModeManager = deps.fpsGameModeManager
    this.gameFlowManager = deps.gameFlowManager
    this.effectsManager = deps.effectsManager
    this.visualEffectsManager = deps.visualEffectsManager
    this.recoilManager = deps.recoilManager
    this.dynamicCrosshair = deps.dynamicCrosshair
    this.player = deps.player
    this.gameState = deps.gameState
    this.enemies = deps.enemies
    this.camera = deps.camera
    this.ground = deps.ground
    this.obstacles = deps.obstacles
    this.weaponModel = deps.weaponModel
    this.selectedCharacter = deps.selectedCharacter
    this.reserveAmmo = deps.reserveAmmo
    this.onEnemyDeath = deps.onEnemyDeath
    this.onKill = deps.onKill
    this.onEnvironmentHit = deps.onEnvironmentHit
    this.onBulletHit = deps.onBulletHit
    this.onUpdateHUD = deps.onUpdateHUD
    this.onUpdateScoreboard = deps.onUpdateScoreboard
    this.onCreateWeaponModel = deps.onCreateWeaponModel
    this.onNetworkStateUpdate = deps.onNetworkStateUpdate
    this.onSetupMapInScene = deps.onSetupMapInScene
    this.onSetSelectedCharacter = deps.onSetSelectedCharacter
  }

  /**
   * Initialize all event listeners
   */
  public initializeAllEvents(): void {
    console.log('🎯 EventOrchestrator: Initializing all events...')

    this.setupWeaponProgressionEvents()
    this.setupGameModeEvents()
    this.setupAbilityCallbacks()
    this.setupGameFlowEvents()
    this.setupProgressionEvents()
    this.setupMapEvents()
    this.setupAudioEvents()
    this.setupWeaponManagerEvents()
    this.setupUIEvents()
    this.setupNetworkEvents()

    console.log('✅ EventOrchestrator: All events initialized!')
  }

  /**
   * 🔫 Setup Weapon Progression Events
   */
  private setupWeaponProgressionEvents(): void {
    // Level Up Event
    this.weaponProgressionManager.onLevelUp((event) => {
      console.log(`🔫 Weapon Level Up! ${event.weaponId} → Level ${event.newLevel}`)

      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(
          NotificationType.ACHIEVEMENT,
          `${event.weaponId} reached Level ${event.newLevel}!`,
          { duration: 3 }
        )
      )

      // Show unlocked rewards
      event.rewards.forEach(reward => {
        this.uiManager?.showNotification(
          createNotificationTemplate(
            NotificationType.ACHIEVEMENT,
            `🔓 Unlocked: ${reward.item.name}`,
            { duration: 4 }
          )
        )
      })

      // Play sound
      this.audioManager?.playSound('weapon_level_up', this.player.position)
    })

    // Unlock Event
    this.weaponProgressionManager.onUnlock((reward) => {
      console.log(`🔓 Unlocked: ${reward.type} - ${reward.item.name}`)
    })
  }

  /**
   * 🎮 Setup Game Mode Events
   */
  private setupGameModeEvents(): void {
    // Game End Event
    this.fpsGameModeManager.onGameEnd((winnerId) => {
      console.log(`🏆 GAME OVER! Winner: ${winnerId}`)

      // Show victory screen
      this.uiManager?.showNotification(
        createNotificationTemplate(
          NotificationType.ACHIEVEMENT,
          `🏆 ${winnerId} WINS!`,
          { duration: 5 }
        )
      )
    })

    // Score Change Event
    this.fpsGameModeManager.onScoreChange((team, score) => {
      console.log(`📊 Score Update: ${team} = ${score}`)
    })
  }

  /**
   * ⚡ Setup Ability System Callbacks
   */
  private setupAbilityCallbacks(): void {
    // Speed Boost
    this.abilitySystem.onSpeedBoost = (multiplier: number, duration: number) => {
      console.log(`🏃 Speed Boost: ${multiplier}x for ${duration}s`)
      this.player.stats.speedMultiplier = multiplier

      setTimeout(() => {
        this.player.stats.speedMultiplier = 1.0
        console.log('Speed boost ended')
      }, duration * 1000)
    }

    // Dash
    this.abilitySystem.onDash = (direction: THREE.Vector3, distance: number) => {
      console.log(`💨 Dash: ${distance}m`)
      this.player.position.add(direction)
      this.camera.position.add(direction)
    }

    // Teleport
    this.abilitySystem.onTeleport = (targetPosition: THREE.Vector3) => {
      console.log(`✨ Teleport to ${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)}, ${targetPosition.z.toFixed(1)}`)
      this.player.position.copy(targetPosition)
      this.camera.position.copy(targetPosition)
    }

    // Heal
    this.abilitySystem.onHeal = (amount: number) => {
      const oldHealth = this.player.stats.health
      this.player.stats.health = Math.min(this.player.stats.health + amount, this.player.stats.maxHealth)
      const actualHeal = this.player.stats.health - oldHealth
      console.log(`❤️ Healed ${actualHeal.toFixed(0)} HP (${oldHealth.toFixed(0)} → ${this.player.stats.health.toFixed(0)})`)

      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(
          NotificationType.INFO,
          `+${actualHeal.toFixed(0)} HP`,
          { duration: 2 }
        )
      )
    }

    // Shield
    this.abilitySystem.onShield = (health: number, duration: number) => {
      console.log(`🛡️ Shield: ${health} HP for ${duration}s`)
      this.player.stats.shield = health

      setTimeout(() => {
        this.player.stats.shield = 0
        console.log('Shield expired')
      }, duration * 1000)
    }

    // Damage (AOE)
    this.abilitySystem.onDamage = (targets: string[], damage: number) => {
      console.log(`💥 Dealing ${damage} damage to ${targets.length} enemies`)
      targets.forEach(targetId => {
        const enemy = this.enemies.find(e => e.id === targetId)
        if (enemy) {
          // Damage enemy directly
          enemy.health -= damage
          if (enemy.health <= 0) {
            this.onEnemyDeath(enemy)

            // Handle kill for rewards
            const currentWeapon = this.weaponManager.getCurrentWeapon()
            if (currentWeapon) {
              this.onKill({
                enemy,
                weapon: currentWeapon,
                distance: enemy.mesh.position.distanceTo(this.player.position),
                isHeadshot: false,
                hitPoint: enemy.mesh.position
              })
            }
          }
        }
      })
    }

    // Stun
    this.abilitySystem.onStun = (targets: string[], duration: number) => {
      console.log(`⚡ Stunning ${targets.length} enemies for ${duration}s`)
      targets.forEach(targetId => {
        const enemy = this.enemies.find(e => e.id === targetId)
        if (enemy) {
          // Add stunned property
          (enemy as any).stunned = true
          ;(enemy as any).stunnedUntil = Date.now() + (duration * 1000)

          // Visual effect: Flash yellow
          enemy.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const originalColor = (child.material as any).color?.clone()
              ;(child.material as any).color = new THREE.Color(0xffff00)

              setTimeout(() => {
                if (originalColor) {
                  ;(child.material as any).color = originalColor
                }
                (enemy as any).stunned = false
              }, duration * 1000)
            }
          })
        }
      })
    }

    console.log('⚡ Ability Callbacks Setup Complete!')
  }

  /**
   * 🎮 Setup Game Flow Events & Key Bindings
   */
  private setupGameFlowEvents(): void {
    // Listen to state changes
    this.gameFlowManager.on('stateChange', (event: any) => {
      console.log(`🎮 State Change: ${event.from} → ${event.to}`)

      // Pause/Resume game based on state
      if (event.isPaused && !this.gameState.isPaused) {
        this.gameState.isPaused = true
      } else if (!event.isPaused && this.gameState.isPaused) {
        this.gameState.isPaused = false
      }

      // Trigger UI render callback
      if (this.uiRenderCallback) {
        this.uiRenderCallback(event.to, this.getUIData())
      }
    })

    // Listen to settings changes
    this.gameFlowManager.on('settingsChanged', (settings: any) => {
      console.log('⚙️ Settings Changed:', settings)
      this.applySettings(settings)
    })

    // Listen to character selection
    this.gameFlowManager.on('characterSelected', (character: PlayableCharacter) => {
      console.log(`👤 Character Selected: ${character.displayName}`)
      this.onSetSelectedCharacter(character)
      this.abilitySystem.setCharacter(character)
      this.abilitySystem.applyPassiveAbility()
    })

    // Setup Key Bindings
    this.setupKeyBindings()
  }

  /**
   * 🎮 Setup Key Bindings for UI
   */
  public setupKeyBindings(): void {
    console.log('🎮 Key Bindings Registered: ESC, Tab, L, C')
  }

  /**
   * 🎮 Override Key Handler (to be called from main engine)
   */
  public createKeyHandler(originalKeyDown: (e: KeyboardEvent) => void): (e: KeyboardEvent) => void {
    this.originalKeyDown = originalKeyDown

    return (event: KeyboardEvent) => {
      const currentState = this.gameFlowManager.getCurrentState()

      // ESC - Toggle Pause Menu (only in-game)
      if (event.key === 'Escape') {
        event.preventDefault()
        if (currentState === 'inGame') {
          this.gameFlowManager.pauseGame()
        } else if (currentState === 'paused') {
          this.gameFlowManager.resumeGame()
        }
        return
      }

      // Tab - Show Scoreboard (only in-game)
      if (event.key === 'Tab') {
        event.preventDefault()
        if (currentState === 'inGame' && !this.gameState.isPaused) {
          this.showScoreboard = true
          this.onUpdateScoreboard()
        }
        return
      }

      // L - Show Loadout (only in-game or paused)
      if (event.key === 'l' || event.key === 'L') {
        if (currentState === 'inGame' || currentState === 'paused') {
          this.gameFlowManager.showLoadout()
        }
        return
      }

      // C - Show Character Selection (only in-game or paused)
      if (event.key === 'c' || event.key === 'C') {
        if (currentState === 'inGame' || currentState === 'paused') {
          this.gameFlowManager.showCharacterSelect()
        }
        return
      }

      // If not a UI key, call original handler (only if in-game and not paused)
      if (currentState === 'inGame' && !this.gameState.isPaused && this.originalKeyDown) {
        this.originalKeyDown(event)
      }
    }
  }

  /**
   * 🎮 Get UI Data for rendering
   */
  private getUIData(): any {
    return {
      playerLevel: this.gameState.level,
      playerXP: this.gameState.xp,
      playerName: 'Player',
      selectedCharacter: this.selectedCharacter,
      stats: {
        kills: this.gameState.kills,
        deaths: this.gameState.deaths,
        headshots: this.gameState.headshots || 0,
        accuracy: this.gameState.accuracy || 0,
        score: this.gameState.score,
        xpEarned: this.gameState.xp,
        longestKillDistance: 0,
        killStreak: 0, // Would need killRewardSystem reference
        damageDealt: 0
      },
      matchTime: this.gameState.roundTime,
      victory: false,
      weaponProgressionManager: this.weaponProgressionManager,
      availableWeapons: ['pistol', 'assault', 'sniper', 'smg', 'shotgun'],
      settings: this.gameFlowManager.getSettings()
    }
  }

  /**
   * 🎮 Apply Settings
   */
  private applySettings(settings: any): void {
    // Apply Graphics Settings
    if (settings.graphics) {
      // FOV
      if (settings.graphics.fov) {
        this.camera.fov = settings.graphics.fov
        this.camera.updateProjectionMatrix()
      }
    }

    // Apply Audio Settings
    if (settings.audio && this.audioManager) {
      this.audioManager.setMasterVolume(settings.audio.masterVolume / 100)
    }

    // Apply Control Settings would be handled in main engine

    console.log('✅ Settings Applied')
  }

  /**
   * 🏆 Setup Progression System Events
   */
  private setupProgressionEvents(): void {
    // Level Up
    this.progressionManager.on(ProgressionEventType.LEVEL_UP, (event) => {
      console.log(`🎉 Level Up! Now level ${event.data.level}`)

      // Play level up sound
      this.audioManager?.playSound('level_up', this.player.position)

      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(NotificationType.LEVEL_UP, `Level ${event.data.level}!`, {
          duration: 3
        })
      )

      // Update game state
      this.gameState.level = event.data.level
    })

    // Rank Up
    this.progressionManager.on(ProgressionEventType.RANK_UP, (event) => {
      console.log(`🏆 Rank Up! Now ${event.data.rank}`)

      // Play rank up sound
      this.audioManager?.playSound('rank_up', this.player.position)

      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(NotificationType.UNLOCK, `Rank Up: ${event.data.rank}!`, {
          duration: 5
        })
      )

      // Update game state
      this.gameState.rank = event.data.rank
    })

    // Achievement Unlocked
    this.progressionManager.on(ProgressionEventType.ACHIEVEMENT_UNLOCKED, (event) => {
      console.log(`🎖️ Achievement Unlocked: ${event.data.achievement.name}`)

      // Play achievement sound
      this.audioManager?.playSound('achievement_unlock', this.player.position)

      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(NotificationType.ACHIEVEMENT, `Achievement: ${event.data.achievement.name}`, {
          duration: 5
        })
      )
    })

    // Challenge Completed
    this.progressionManager.on(ProgressionEventType.CHALLENGE_COMPLETE, (event) => {
      console.log(`✅ Challenge Completed: ${event.data.challenge.name}`)

      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(NotificationType.SUCCESS, `Challenge Complete: ${event.data.challenge.name}`, {
          duration: 3
        })
      )
    })
  }

  /**
   * 🗺️ Setup Map System Events
   */
  private setupMapEvents(): void {
    // Map Loaded
    this.mapManager.on(MapEventType.MAP_LOADED, (event) => {
      console.log(`✅ Map Loaded: ${event.data.mapId}`)

      // Update game state
      this.gameState.currentMap = event.data.mapId

      // Setup map in scene
      this.onSetupMapInScene(event.data)

      // Play ambient sounds for map
      const mapData = event.data
      if (mapData.ambientSound) {
        this.audioManager?.playSound(mapData.ambientSound, undefined, 0.3, 1)
      }
    })

    // Objective Captured
    this.mapManager.on(MapEventType.OBJECTIVE_CAPTURED, (event) => {
      console.log(`🎯 Objective Captured: ${event.data.objectiveId}`)

      // Award XP
      this.progressionManager?.awardXP(XPSource.OBJECTIVE, 300)

      // Play capture sound
      this.audioManager?.playSound('objective_captured', this.player.position)

      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(NotificationType.SUCCESS, 'Objective Captured!', {
          duration: 3
        })
      )
    })
  }

  /**
   * 🔊 Setup Audio System Events
   */
  private setupAudioEvents(): void {
    // Settings Changed
    this.audioManager.on(AudioEventType.SETTINGS_CHANGED, (event) => {
      console.log(`🔊 Audio Settings Changed`)
    })

    // Load all sounds (silent loading to reduce console spam)
    this.audioManager.loadAllSounds().catch(error => {
      console.warn('⚠️ Some sounds failed to load:', error)
    })

    // Start background music
    setTimeout(() => {
      this.audioManager?.playMusic('music_menu', true)
    }, 1000)
  }

  /**
   * 🔫 Setup WeaponManager Event-System
   */
  private setupWeaponManagerEvents(): void {
    // WeaponManager Event-basiert nutzen
    this.weaponManager.onFire((shootResult) => {
      // Dynamic Crosshair Expansion
      this.dynamicCrosshair.expand()

      // Apply Weapon Recoil
      const currentWeapon = this.weaponManager.getCurrentWeapon()
      if (currentWeapon) {
        const weaponId = currentWeapon.getId()
        this.recoilManager.setActiveWeapon(weaponId)
        this.recoilManager.applyRecoil()
      }

      // Visual Effects Manager - Muzzle Flash
      const muzzlePosition = shootResult.origin
      const muzzleDirection = shootResult.direction
      this.visualEffectsManager.createMuzzleFlash(muzzlePosition, muzzleDirection)

      // Old effects manager (legacy)
      this.effectsManager.spawnMuzzleFlash(muzzlePosition, muzzleDirection)

      // Smart Weapon Sound Selection
      const weapon = this.weaponManager.getCurrentWeapon()
      const weaponId = weapon?.getId() || 'pistol'
      const weaponSoundId = getWeaponSound(weaponId, 'fire')
      this.audioManager?.playSound(weaponSoundId, this.player.position)

      // Weapon Model Recoil
      if (this.weaponModel) {
        this.weaponModel.rotation.x -= 0.05
      }

      // Raycasting Hit Detection
      if (shootResult.hit) {
        // Bullet Tracer
        this.visualEffectsManager.createBulletTracer(
          shootResult.origin,
          shootResult.hit.point
        )

        this.onBulletHit({
          point: shootResult.hit.point,
          normal: shootResult.hit.normal || new THREE.Vector3(0, 1, 0),
          object: shootResult.hit.object,
          damage: shootResult.damage,
          weapon: shootResult.weapon
        })
      } else {
        // Missed shot - Environment Hit
        const raycaster = new THREE.Raycaster(shootResult.origin, shootResult.direction)
        const worldIntersects = raycaster.intersectObjects([this.ground, ...this.obstacles], true)
        if (worldIntersects.length > 0) {
          // Bullet Tracer to miss point
          this.visualEffectsManager.createBulletTracer(
            shootResult.origin,
            worldIntersects[0].point
          )

          this.onEnvironmentHit(worldIntersects[0])
        }
      }

      // Game State Update
      this.gameState.shotsFired++
      this.onUpdateHUD()
    })

    // Weapon Switch Event
    this.weaponManager.onWeaponSwitch(async (event) => {
      // Remove old weapon model (handled in callback)
      await this.onCreateWeaponModel()

      // Initialize reserve ammo for new weapon
      const newWeapon = this.weaponManager.getCurrentWeapon()
      if (newWeapon) {
        const weaponId = newWeapon.getId()
        const weaponData = newWeapon.getData()
        if (!this.reserveAmmo.has(weaponId)) {
          const defaultReserve = weaponData.type === 'pistol' ? 30 :
                                  weaponData.type === 'sniper' ? 20 : 120
          this.reserveAmmo.set(weaponId, defaultReserve)
        }
      }

      this.audioManager?.playSound('weapon_switch', this.player.position)
      this.onUpdateHUD()
    })
  }

  /**
   * 🎨 Setup UI System Events
   */
  private setupUIEvents(): void {
    // Theme Changed
    this.uiManager.on(UIEventType.THEME_CHANGED, (event) => {
      console.log(`🎨 UI Theme: ${event.data.theme}`)
    })

    // Initial HUD setup
    this.onUpdateHUD()
  }

  /**
   * 🌐 Setup Network System Events (Optional)
   */
  private setupNetworkEvents(): void {
    if (!this.networkManager) return

    // Connected
    this.networkManager.on(NetworkEventType.CONNECTED, (event) => {
      console.log('🌐 Connected to server')

      this.uiManager?.showNotification(
        createNotificationTemplate(NotificationType.INFO, 'Connected to server', {
          duration: 2
        })
      )
    })

    // Player Joined
    this.networkManager.on(NetworkEventType.PLAYER_JOINED, (event) => {
      console.log(`👤 Player joined: ${event.data.playerId}`)
    })

    // State Update
    this.networkManager.on(NetworkEventType.STATE_UPDATE, (event) => {
      // Handle remote player updates
      this.onNetworkStateUpdate(event.data)
    })
  }

  /**
   * Set UI Render Callback
   */
  public setUIRenderCallback(callback: (state: GameState, data: any) => void): void {
    this.uiRenderCallback = callback
    console.log('🎮 UI Render Callback Set')
  }

  /**
   * Update references (for mutable state)
   */
  public updateReferences(updates: {
    weaponModel?: THREE.Group | null
    selectedCharacter?: PlayableCharacter
  }): void {
    if (updates.weaponModel !== undefined) {
      this.weaponModel = updates.weaponModel
    }
    if (updates.selectedCharacter !== undefined) {
      this.selectedCharacter = updates.selectedCharacter
    }
  }
}
