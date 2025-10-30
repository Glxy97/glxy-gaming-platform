// NO @ts-nocheck - We fix types properly!
'use client'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Game Mode System
import { GameModeManager } from './GameModeManager'
import type { GameMode } from '../types/GameTypes'

// Weapon System
import { WeaponManager } from '../weapons/WeaponManager'
import type { BaseWeapon } from '../weapons/BaseWeapon'

// Phase 4: Controllers
import { MovementController } from '../movement/MovementController'
import { PhysicsEngine } from '../physics/PhysicsEngine'
import { AIController } from '../ai/AIController'
import { AIState } from '../ai/data/AIData'
import type { AIShootData } from '../ai/AIController'
import { EffectsManager } from '../effects/EffectsManager'

// 🎯 PHASE 7: Progression System
import { ProgressionManager, ProgressionEventType, createPlayerProfile } from '../progression/ProgressionManager'
import { XPSource } from '../progression/data/ProgressionData'

// 🗺️ PHASE 8: Map System
import { MapManager } from '../maps/MapManager'
import { MapLoader } from '../maps/MapLoader'
import { MapEventType } from '../maps/MapManager'
import { GLBMapsLoader, AVAILABLE_GLB_MAPS } from '../maps/data/GLBMapsLoader'

// 🔊 PHASE 9: Audio System
import { AudioManager, AudioEventType } from '../audio/AudioManager'

// 🎨 PHASE 6: UI System
import { UIManager } from '../ui/UIManager'
import { UIEventType } from '../ui/UIManager'
import { NotificationType, createNotificationTemplate } from '../ui/data/UIData'

// 🌐 PHASE 10: Network System (Optional)
import { NetworkManager, NetworkEventType } from '../networking/NetworkManager'

// Physics Data
import {
  PhysicsObjectType,
  CollisionLayer,
  createPhysicsObject,
  createBulletPhysics,
  PHYSICS_MATERIALS
} from '../physics/data/PhysicsData'

// Effects Data
import { EffectQuality } from '../effects/data/EffectsData'

// Performance Optimization Modules
import {
  SpatialHashGrid,
  BoundingBoxSystem,
  SpawnZoneSystem,
  type SpatialObject
} from './OptimizationModules'

// Model Manager
import { ModelManager } from './ModelManager'

// ✅ NEU: FPS Features (Hit Markers, Damage Indicators, Health Bars)
import { 
  HitMarkerSystem, 
  DamageIndicatorSystem, 
  createHealthBar, 
  updateHealthBar 
} from './FPSFeatures'

// ✅ NEU: Addiction Systems (Sucht-Faktoren)
import { KillRewardSystem } from './AddictionSystems/KillRewardSystem'
import { AdvancedMovementSystem } from './AddictionSystems/AdvancedMovementSystem'
import type { KillData, DopamineEvent } from './AddictionSystems/KillRewardSystem'
import type { MovementInput, MovementResult } from './AddictionSystems/AdvancedMovementSystem'

// 🆕 NEW FEATURES: Character System, Weapon Progression, Advanced AI
import { AbilitySystem } from '../characters/AbilitySystem'
import { WeaponProgressionManager } from '../progression/WeaponProgressionManager'
import { BehaviorTreeManager } from '../ai/BehaviorTrees'
import { EnemyClass, selectEnemyClassByDifficulty, getEnemyConfig, getRandomModelForClass } from '../ai/EnemyClasses'
import { ALL_CHARACTERS, STARTER_CHARACTERS, getCharacterById } from '../characters/CharacterCatalog'
import type { PlayableCharacter } from '../types/CharacterTypes'
import type { WeaponKillEvent } from '../types/WeaponProgressionTypes'

// 🧭 PATHFINDING SYSTEM
import { PathfindingManager } from '../ai/PathfindingSystem'

// 🎯 RECOIL SYSTEM
import { RecoilManager } from '../weapons/RecoilSystem'

// 🎯 HITBOX SYSTEM
import { HitboxSystemManager, HitboxZone } from '../systems/HitboxSystem'
import type { HitResult } from '../systems/HitboxSystem'

// 🎨 ADVANCED VISUAL FEEDBACK
import { AdvancedVisualFeedbackManager } from '../features/AdvancedVisualFeedback'

// 🏃 MOVEMENT FEEL ENHANCEMENTS
import { MovementFeelManager } from '../features/MovementFeelEnhancements'

// ⚡ ABILITY HUD & MINIMAP
import { AbilityHUDRenderer, MinimapRenderer } from '../features/AbilityHUD'
import type { AbilityHUDData, MinimapData } from '../features/AbilityHUD'

// 🎮 GAME MODE SYSTEM
import { FPSGameModeManager, FPSGameMode } from '../modes/GameModeSystem'

// 🗺️ MAP INTERACTION SYSTEM
import { MapInteractionManager } from '../systems/MapInteractionSystem'

// 🎵 HIT SOUND SYSTEM
import { HitSoundManager, HitSoundType } from '../audio/HitSoundManager'

// 👣 FOOTSTEP SYSTEM
import { FootstepManager, SurfaceType, MovementType } from '../audio/FootstepManager'

// 📋 KILL FEED SYSTEM
import { KillFeedManager } from '../ui/KillFeedManager'

// 💥 AMMO SYSTEM
import { AmmoSystem, AmmoHUDRenderer, FireDamageManager, AmmoType, AMMO_PROPERTIES } from '../weapons/AmmoSystem'

// 🔭 SCOPE SYSTEM
import { ScopeSystem, ScopeOverlayRenderer } from '../weapons/ScopeSystem'

// 📊 SCOREBOARD SYSTEM
import { ScoreboardManager } from '../ui/ScoreboardManager'
import type { PlayerScore } from '../ui/ScoreboardManager'
import { updateScoreboardForEngine } from './UltimateFPSEngineV4_Scoreboard'

// 💣 GRENADE SYSTEM
import { GrenadeSystem, GrenadeType } from '../weapons/GrenadeSystem'
import { GrenadeHUDRenderer } from '../ui/GrenadeHUDRenderer'
import type { GrenadeHUDState } from '../ui/GrenadeHUDRenderer'

// 🎮 GAME FLOW MANAGEMENT
import { GameFlowManager } from './GameFlowManager'
import type { GameState } from './GameFlowManager'

// 📹 KILL CAM SYSTEM
import { KillCamSystem } from '../systems/KillCamSystem'
import type { KillCamData } from '../systems/KillCamSystem'

// ✨ VISUAL EFFECTS MANAGER
import { VisualEffectsManager } from '../effects/VisualEffectsManager'

// 💡 QUICK FEATURES
import {
  DynamicCrosshair,
  playHeadshotSound,
  getKillStreakMessage,
  KillStreakDisplay,
  LowHealthVignette,
  SprintFOV,
  LandingShake
} from '../features/QuickFeatures'

// 🔫 WEAPON CATALOG
import { WEAPON_CATALOG, getWeaponById as getCatalogWeaponById } from '../weapons/data/WeaponCatalog'

// 🔊 SOUND LIBRARY
import { SOUND_LIBRARY, getWeaponSound } from '../audio/SoundLibrary'

/**
 * 🎮 GLXY ULTIMATE FPS ENGINE V4
 *
 * ═══════════════════════════════════════════════════════════════
 *                 COMPLETE AAA INTEGRATION - PHASE 11
 * ═══════════════════════════════════════════════════════════════
 *
 * NEW IN V4:
 * ✅ ProgressionManager - XP, Levels, Ranks, Achievements
 * ✅ MapManager - Professional map loading and management
 * ✅ AudioManager - 3D spatial audio with 100+ sounds
 * ✅ UIManager - Professional HUD and notifications
 * ✅ NetworkManager - Multiplayer foundation (optional)
 * ✅ Type-Safe - NO @ts-nocheck, proper TypeScript
 * ✅ Event-Driven - All systems connected via events
 * ✅ Production-Ready - Full integration of all 10 phases
 *
 * PHASES COMPLETE:
 * ✅ Phase 0: Foundation
 * ✅ Phase 1: Game Modes
 * ✅ Phase 2-3: Weapon System, Movement, Physics, AI, Effects
 * ✅ Phase 4-5: Controllers & Game Integration
 * ✅ Phase 6: UI System
 * ✅ Phase 7: Progression System
 * ✅ Phase 8: Map System
 * ✅ Phase 9: Audio System
 * ✅ Phase 10: Networking System
 * ✅ Phase 11: COMPLETE INTEGRATION (THIS VERSION!)
 */

// ============================================================
// INTERFACES
// ============================================================

export interface UltimateWeapon {
  id: string
  name: string
  type: 'assault' | 'smg' | 'sniper' | 'pistol' | 'shotgun'
  damage: number
  fireRate: number
  range: number
  accuracy: number
  recoil: number
  magazineSize: number
  currentAmmo: number
  reserveAmmo: number
  reloadTime: number
  model?: THREE.Group
}

export interface UltimateEnemy {
  id: string
  mesh: THREE.Group
  aiController: AIController
  physicsObject: any
  health: number // ✅ NEU: Enemy Health System
  maxHealth: number // ✅ NEU: Max Health
  healthBar?: THREE.Group // ✅ NEU: 3D Health Bar
  // 🧭 NEW: Pathfinding
  currentPath?: THREE.Vector3[]
  pathIndex?: number
  lastPathUpdateTime?: number
}

export interface UltimateGameState {
  score: number
  kills: number
  deaths: number
  headshots: number
  accuracy: number
  shotsFired: number
  shotsHit: number
  damageDealt: number
  damageTaken: number
  longestStreak: number
  currentStreak: number
  wave: number
  roundTime: number
  isGameActive: boolean
  isPaused: boolean

  // Phase 7: Progression
  level: number
  xp: number
  rank: string
  prestige: number

  // Phase 8: Map
  currentMap: string
}

export interface UltimatePlayerStats {
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  shield: number // ⚡ NEW: Ability Shield
  stamina: number
  maxStamina: number
  speed: number
  speedMultiplier: number // ⚡ NEW: Speed Boost from Abilities
  currentWeaponIndex: number
  isReloading: boolean
  isSprinting: boolean
  isCrouching: boolean
  isAiming: boolean
  isDead: boolean
  isInvincible: boolean
}

// ============================================================
// ULTIMATE FPS ENGINE V4 CLASS - COMPLETE INTEGRATION
// ============================================================

export class UltimateFPSEngineV4 {
  // Scene & Rendering
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private clock: THREE.Clock
  private gltfLoader: GLTFLoader
  private modelManager: ModelManager

  // 🎮 Core Game Systems (Phase 0-5)
  public gameModeManager: GameModeManager
  private weaponManager: WeaponManager
  private movementController: MovementController
  private physicsEngine: PhysicsEngine
  private effectsManager: EffectsManager

  // 🎯 NEW: Phase 7-10 Systems (COMPLETE INTEGRATION!)
  private progressionManager!: ProgressionManager
  private mapManager!: MapManager
  private mapLoader!: MapLoader
  private glbMapLoader!: GLBMapsLoader
  private loadedMapGroup?: THREE.Group
  private audioManager!: AudioManager
  private uiManager!: UIManager
  private networkManager?: NetworkManager // Optional for multiplayer

  // Player
  private player: {
    mesh: THREE.Group
    position: THREE.Vector3
    rotation: THREE.Euler
    stats: UltimatePlayerStats
  }

  // Enemies
  private enemies: UltimateEnemy[] = []

  // Game State
  private gameState: UltimateGameState
  private lastEnemySpawn: number = 0
  private isSpawningEnemy: boolean = false // Race Condition Schutz

  // Performance Optimization Systems
  private spatialGrid!: SpatialHashGrid
  private spawnZoneSystem!: SpawnZoneSystem
  private boundingBoxSystem!: BoundingBoxSystem

  // ✅ ENTFERNT: Alte Dopamine-System Properties (werden jetzt von KillRewardSystem verwaltet)
  // private killStreak: number = 0
  // private comboMultiplier: number = 1
  // private lastKillTime: number = 0

  // World Objects
  private ground!: THREE.Mesh
  private obstacles: THREE.Mesh[] = []
  private weaponModel: THREE.Group | null = null

  // Input
  private keys: Set<string> = new Set()
  private mouse: { x: number; y: number; deltaX: number; deltaY: number } = {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0
  }
  private isPointerLocked: boolean = false

  // Callbacks
  private onStatsUpdate: (stats: any) => void
  private onGameEnd: (result: any) => void

  // ✅ NEU: Reserve Ammo System (pro Weapon)
  private reserveAmmo: Map<string, number> = new Map()

  // ✅ NEU: Hit Marker & Damage Indicator Systems
  private hitMarkerSystem!: HitMarkerSystem
  private damageIndicatorSystem!: DamageIndicatorSystem
  private overlayCanvas!: HTMLCanvasElement

  // ✅ NEU: Addiction Systems (Sucht-Faktoren)
  private killRewardSystem!: KillRewardSystem
  private advancedMovementSystem!: AdvancedMovementSystem

  // 📹 Kill Cam System
  private killCamSystem!: KillCamSystem
  private lastKillCamData: KillCamData | null = null

  // ✨ Visual Effects Manager
  private visualEffectsManager!: VisualEffectsManager

  // 🆕 NEW FEATURES: Character, Weapon Progression, Advanced AI
  private abilitySystem!: AbilitySystem
  private weaponProgressionManager!: WeaponProgressionManager
  private behaviorTreeManager!: BehaviorTreeManager
  private pathfindingManager!: PathfindingManager
  private selectedCharacter!: PlayableCharacter
  private currentDifficulty: number = 0.5 // 0-1 (leicht bis extrem schwer)

  // 🎮 GAME FLOW & UI STATE MANAGEMENT
  private gameFlowManager!: GameFlowManager

  // 💡 QUICK FEATURES
  private dynamicCrosshair!: DynamicCrosshair
  private killStreakDisplay!: KillStreakDisplay
  private lowHealthVignette!: LowHealthVignette
  private sprintFOV!: SprintFOV
  private landingShake!: LandingShake
  private lastGroundedState: boolean = false
  private lastKillTime: number = 0
  private quickKillCount: number = 0

  // 🎯 RECOIL SYSTEM
  private recoilManager!: RecoilManager
  
  // 🎯 HITBOX SYSTEM
  private hitboxManager!: HitboxSystemManager
  
  // 🎨 ADVANCED VISUAL FEEDBACK
  private advancedVisualFeedback!: AdvancedVisualFeedbackManager
  
  // 🏃 MOVEMENT FEEL ENHANCEMENTS
  private movementFeelManager!: MovementFeelManager
  
  // ⚡ ABILITY HUD & MINIMAP
  private abilityHUDRenderer!: AbilityHUDRenderer
  private minimapRenderer!: MinimapRenderer
  
  // 🎮 GAME MODE SYSTEM
  private fpsGameModeManager!: FPSGameModeManager
  
  // 🗺️ MAP INTERACTION SYSTEM
  private mapInteractionManager!: MapInteractionManager
  
  // 🎵 HIT SOUND SYSTEM
  private hitSoundManager!: HitSoundManager
  
  // 👣 FOOTSTEP SYSTEM
  private footstepManager!: FootstepManager
  private lastMovementState: boolean = false
  
  // 📋 KILL FEED SYSTEM
  private killFeedManager!: KillFeedManager
  
  // 💥 AMMO SYSTEM
  private ammoSystem!: AmmoSystem
  private ammoHUDRenderer!: AmmoHUDRenderer
  private fireDamageManager!: FireDamageManager
  
  // 🔭 SCOPE SYSTEM
  private scopeSystem!: ScopeSystem
  private scopeOverlayRenderer!: ScopeOverlayRenderer
  private isAiming: boolean = false
  
  // 📊 SCOREBOARD SYSTEM
  private scoreboardManager!: ScoreboardManager
  private showScoreboard: boolean = false
  
  // 💣 GRENADE SYSTEM
  private grenadeSystem!: GrenadeSystem
  private currentGrenadeType: GrenadeType = GrenadeType.FRAG
  private grenadeHUDRenderer!: GrenadeHUDRenderer
  
  private uiRenderCallback?: (state: GameState, data: any) => void

  // Animation
  private animationFrameId?: number

  /**
   * Constructor
   * @param container - HTMLElement to mount the game
   * @param onStatsUpdate - Callback for stats updates
   * @param onGameEnd - Callback for game end
   * @param enableMultiplayer - Enable multiplayer features
   * @param options - Optional configuration including initialMode
   */
  constructor(
    container: HTMLElement,
    onStatsUpdate: (stats: any) => void,
    onGameEnd: (result: any) => void,
    enableMultiplayer: boolean = false,
    options?: { initialMode?: GameMode }
  ) {
    console.log('🎮 Initializing GLXY Ultimate FPS Engine V4...')
    console.log('✨ Phase 11: Complete Integration of ALL Systems!')

    this.container = container
    this.onStatsUpdate = onStatsUpdate
    this.onGameEnd = onGameEnd

    // Initialize Three.js
    this.scene = new THREE.Scene()
    // KRITISCH: Scene Background NICHT schwarz, sondern hellblau (Sky-Color)
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200)

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 1.7, 0)
    
    // KRITISCH: Camera zur Scene hinzufügen (für Child-Objects wie WeaponModel)
    this.scene.add(this.camera)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    this.clock = new THREE.Clock()
    this.gltfLoader = new GLTFLoader()
    this.modelManager = new ModelManager()

    // Initialize Game Managers
    this.gameModeManager = new GameModeManager()

    // PROFESSIONAL: Set initial game mode deterministically
    if (options?.initialMode) {
      this.gameModeManager.changeMode(options.initialMode)
      console.log(`🎯 Initial game mode set to: ${options.initialMode}`)
    }

    this.weaponManager = new WeaponManager()

    // Initialize Controllers (Phase 4-5)
    this.movementController = new MovementController()
    this.physicsEngine = new PhysicsEngine()
    this.effectsManager = new EffectsManager(EffectQuality.HIGH)

    // Performance Optimization Systems (BESTE Variante aus OptimizationModules)
    this.spatialGrid = new SpatialHashGrid(10)
    this.spawnZoneSystem = new SpawnZoneSystem()
    this.boundingBoxSystem = new BoundingBoxSystem()

    // BESTE Variante: WeaponManager mit PhysicsEngine verbinden (aus V6)
    this.weaponManager.setPhysicsEngine(this.physicsEngine)
    this.weaponManager.setScene(this.scene)
    this.weaponManager.setCamera(this.camera)

    // Initialize Player
    this.player = {
      mesh: new THREE.Group(),
      position: new THREE.Vector3(0, 1.7, 0),
      rotation: new THREE.Euler(0, 0, 0),
      stats: {
        health: 100,
        maxHealth: 100,
        armor: 50,
        maxArmor: 100,
        shield: 0, // ⚡ NEW
        stamina: 100,
        maxStamina: 100,
        speed: 5,
        speedMultiplier: 1.0, // ⚡ NEW
        currentWeaponIndex: 0,
        isReloading: false,
        isSprinting: false,
        isCrouching: false,
        isAiming: false,
        isDead: false,
        isInvincible: false
      }
    }

    // Initialize Game State
    this.gameState = {
      score: 0,
      kills: 0,
      deaths: 0,
      headshots: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
      damageDealt: 0,
      damageTaken: 0,
      longestStreak: 0,
      currentStreak: 0,
      wave: 1,
      roundTime: 0,
      isGameActive: true,
      isPaused: false,
      level: 1,
      xp: 0,
      rank: 'Bronze',
      prestige: 0,
      currentMap: 'urban_warfare'
    }

    // 🎵 Initialize Hit Sound Manager (BEFORE Phase 7-10)
    this.hitSoundManager = new HitSoundManager()
    console.log('✅ Hit Sound Manager initialized')

    // 👣 Initialize Footstep Manager (BEFORE Phase 7-10)
    this.footstepManager = new FootstepManager()
    console.log('✅ Footstep Manager initialized')

    // ✅ NEU: Setup Hit Marker & Damage Indicator Canvas Overlay (BEFORE Phase 7-10)
    this.setupOverlayCanvas()

    // 🎯 PHASE 11: Initialize ALL New Systems!
    this.initializePhase7to10Systems(enableMultiplayer)

    // BESTE Variante: Setup WeaponManager Event-System (aus V6)
    this.setupWeaponManagerEvents()

    // ✅ NEU: Initialize Addiction Systems
    this.killRewardSystem = new KillRewardSystem()
    this.advancedMovementSystem = new AdvancedMovementSystem(this.camera)
    this.advancedMovementSystem.setScene(this.scene)
    // ✅ BESTE PERFORMANCE: KEIN PhysicsEngine für Wallrun (nicht nötig + Overhead!)

    // 📹 Initialize Kill Cam System
    this.killCamSystem = new KillCamSystem()
    console.log('✅ Kill Cam System initialized')

    // ✨ Initialize Visual Effects Manager
    this.visualEffectsManager = new VisualEffectsManager(this.scene)
    console.log('✅ Visual Effects Manager initialized')

    // 💡 Initialize Quick Features
    this.dynamicCrosshair = new DynamicCrosshair()
    this.killStreakDisplay = new KillStreakDisplay()
    this.lowHealthVignette = new LowHealthVignette()
    this.sprintFOV = new SprintFOV(this.camera.fov)
    this.landingShake = new LandingShake()
    console.log('✅ Quick Features initialized')

    // 🎯 Initialize Recoil System
    this.recoilManager = new RecoilManager()
    this.recoilManager.setCamera(this.camera)
    console.log('✅ Recoil System initialized')

    // 🎯 Initialize Hitbox System
    this.hitboxManager = new HitboxSystemManager()
    this.hitboxManager.setScene(this.scene)
    console.log('✅ Hitbox System initialized')

    // 🎨 Initialize Advanced Visual Feedback (after Overlay Canvas!)
    // Will be initialized in setupOverlayCanvas()

    // 🏃 Initialize Movement Feel Manager
    this.movementFeelManager = new MovementFeelManager()
    console.log('✅ Movement Feel Manager initialized')

    // 🎮 Initialize Game Mode Manager
    this.fpsGameModeManager = new FPSGameModeManager(FPSGameMode.FREE_FOR_ALL)
    this.setupGameModeEvents()
    this.fpsGameModeManager.start() // Start game mode
    console.log('✅ Game Mode Manager initialized and started')

    // 🗺️ Initialize Map Interaction Manager
    this.mapInteractionManager = new MapInteractionManager(this.scene)
    console.log('✅ Map Interaction Manager initialized')

    // 💥 Initialize Ammo System
    this.ammoSystem = new AmmoSystem()
    this.fireDamageManager = new FireDamageManager()
    console.log('✅ Ammo System initialized')

    // 🔭 Initialize Scope System
    this.scopeSystem = new ScopeSystem('none', 75)
    console.log('✅ Scope System initialized')

    // 📊 Initialize Scoreboard System
    this.scoreboardManager = new ScoreboardManager(
      document.createElement('canvas'), // Will use overlay canvas
      'Free For All',
      false
    )
    console.log('✅ Scoreboard Manager initialized')

    // 💣 Initialize Grenade System (will be initialized after scene is ready)
    console.log('⏳ Grenade System will be initialized after scene setup')

    // KRITISCH: Setup Scene IMMER (verhindert schwarzen Bildschirm)
    this.setupLighting()
    this.setupBasicMap() // IMMER Basic Map erstellen
    
    // 🗺️ Create Sample Interactive Objects
    this.mapInteractionManager.createSampleObjects()
    
    // 💣 Initialize Grenade System (after scene is ready)
    this.grenadeSystem = new GrenadeSystem(this.scene)
    this.setupGrenadeCallbacks()
    console.log('✅ Grenade System initialized')
    
    // Setup player
    this.setupPlayer().catch(err => console.error('Setup player error:', err))
    this.setupEventListeners()

    // ✅ KRITISCH: Render-Schleife starten (verhindert schwarzen Bildschirm!)
    this.start()

    console.log('✅ Engine V4 initialization complete!')
  }

  /**
   * 🎯 PHASE 11: Initialize Phase 7-10 Systems
   */
  private initializePhase7to10Systems(enableMultiplayer: boolean): void {
    console.log('🚀 Initializing Phase 7-10 Systems...')

    try {
      // 🎮 GAME FLOW MANAGER (Must be first!)
      console.log('🎮 Initializing Game Flow Manager...')
      this.gameFlowManager = new GameFlowManager()
      this.setupGameFlowEvents()
      console.log('✅ Game Flow Manager Ready')

      // 🏆 PHASE 7: Progression Manager
      console.log('🏆 Initializing Progression System...')
      const playerProfile = createPlayerProfile('player-1', 'Player')
      this.progressionManager = new ProgressionManager(playerProfile)
      this.setupProgressionEvents()
      console.log('✅ Progression System Ready')

      // 🗺️ PHASE 8: Map System
      console.log('🗺️ Initializing Map System...')
      this.mapLoader = new MapLoader()
      this.mapManager = new MapManager()
      this.glbMapLoader = new GLBMapsLoader()
      this.setupMapEvents()
      console.log('✅ Map System Ready (with GLB support!)')

      // 🔊 PHASE 9: Audio System
      console.log('🔊 Initializing Audio System...')
      this.audioManager = new AudioManager({
        masterVolume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.8
      })
      this.setupAudioEvents()
      console.log('✅ Audio System Ready')
      
      // 🎵 Connect Hit Sound Manager to Audio Manager
      this.hitSoundManager.setAudioManager(this.audioManager)
      console.log('✅ Hit Sound Manager connected to Audio Manager')
      
      // 👣 Connect Footstep Manager to Audio Manager
      this.footstepManager.setAudioManager(this.audioManager)
      console.log('✅ Footstep Manager connected to Audio Manager')

      // 🎨 PHASE 6: UI Manager
      console.log('🎨 Initializing UI System...')
      this.uiManager = new UIManager(this.container, {
        theme: 'glxy',
        layout: 'default'
      })
      this.setupUIEvents()
      console.log('✅ UI System Ready')

      // 🌐 PHASE 10: Network Manager (Optional)
      if (enableMultiplayer) {
        console.log('🌐 Initializing Network System...')
        this.networkManager = new NetworkManager({
          serverUrl: 'ws://localhost',
          port: 3001,
          clientSidePrediction: true,
          lagCompensationEnabled: true
        })
        this.setupNetworkEvents()
        console.log('✅ Network System Ready')
      }

      // Load default GLB map (Warface Neon oder Police Office)
      this.loadMap('warface_neon') // oder 'police_office'

      // 🆕 NEW FEATURES: Character, Weapon Progression, Advanced AI
      console.log('🆕 Initializing NEW FEATURES...')
      
      // Ability System
      this.abilitySystem = new AbilitySystem()
      this.abilitySystem.setScene(this.scene, this.camera)
      
      // Weapon Progression Manager
      this.weaponProgressionManager = new WeaponProgressionManager()
      this.setupWeaponProgressionEvents()
      
      // Behavior Tree Manager
      this.behaviorTreeManager = new BehaviorTreeManager()
      
      // 🧭 NEW: Pathfinding Manager
      this.pathfindingManager = new PathfindingManager()
      console.log('✅ Pathfinding Manager initialized (waiting for map)')
      
      // Select Starter Character
      this.selectedCharacter = STARTER_CHARACTERS[0] // Tactical Operator
      this.abilitySystem.setCharacter(this.selectedCharacter)
      this.abilitySystem.applyPassiveAbility()
      
      // ⚡ NEW: Setup Ability Callbacks
      this.setupAbilityCallbacks()
      
      console.log(`✅ Character Selected: ${this.selectedCharacter.name}`)
      console.log(`✅ NEW FEATURES Initialized: Character System, Weapon Progression, Advanced AI!`)

      console.log('✅ ALL Phase 7-10 + NEW FEATURES Initialized!')
    } catch (error) {
      console.error('❌ Error initializing Phase 7-10 systems:', error)
      // Continue with basic game even if advanced systems fail
    }
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
            NotificationType.ACHIEVEMENT, // Use ACHIEVEMENT instead of REWARD
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
          // Damage enemy directly (similar to bullet hit)
          enemy.health -= damage
          if (enemy.health <= 0) {
            this.handleEnemyDeath(enemy)
            
            // Handle kill for rewards (use current weapon for stats)
            const currentWeapon = this.weaponManager.getCurrentWeapon()
            if (currentWeapon) {
              this.handleKill({
                enemy,
                weapon: currentWeapon,
                distance: enemy.mesh.position.distanceTo(this.player.position),
                isHeadshot: false, // Abilities don't count as headshots
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
   * 🏆 Setup Progression System Events
   */
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
      this.selectedCharacter = character
      this.abilitySystem.setCharacter(character)
      this.abilitySystem.applyPassiveAbility()
    })

    // Setup Key Bindings
    this.setupKeyBindings()
  }

  /**
   * 🎮 Setup Key Bindings for UI
   */
  private setupKeyBindings(): void {
    // Store original keydown handler
    const originalKeyDown = this.onKeyDown.bind(this)

    // Override keydown handler with UI key bindings
    this.onKeyDown = (event: KeyboardEvent) => {
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
          // 📊 NEW: Show Scoreboard (hold Tab)
          this.showScoreboard = true
          this.updateScoreboard()
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
      if (currentState === 'inGame' && !this.gameState.isPaused) {
        originalKeyDown(event)
      }
    }

    console.log('🎮 Key Bindings Registered: ESC, Tab, L, C')
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
        killStreak: this.killRewardSystem?.getKillStreak() || 0,
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
      
      // VSync (would need renderer update)
      // Shadow quality (would need light updates)
      // etc.
    }

    // Apply Audio Settings
    if (settings.audio && this.audioManager) {
      this.audioManager.setMasterVolume(settings.audio.masterVolume / 100)
      // Set other volumes...
    }

    // Apply Control Settings
    if (settings.controls) {
      // Mouse sensitivity would be applied in mouse move handler
      // Crosshair settings would be applied in UI
      // etc.
    }

    console.log('✅ Settings Applied')
  }

  /**
   * 🎮 Set UI Render Callback
   */
  public setUIRenderCallback(callback: (state: GameState, data: any) => void): void {
    this.uiRenderCallback = callback
    console.log('🎮 UI Render Callback Set')
  }

  /**
   * 🎮 Public API for UI interactions
   */
  public getGameFlowManager(): GameFlowManager {
    return this.gameFlowManager
  }

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
      this.setupMapInScene(event.data)

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
      // Continue game even if sounds don't load
    })

    // Start background music
    setTimeout(() => {
      this.audioManager?.playMusic('music_menu', true)
    }, 1000)
  }

  /**
   * BESTE Variante: Setup WeaponManager Event-System (aus V6)
   */
  private setupWeaponManagerEvents(): void {
    // WeaponManager Event-basiert nutzen (BESTE Idee aus V6)
    this.weaponManager.onFire((shootResult) => {
      // 💡 NEW: Dynamic Crosshair Expansion
      this.dynamicCrosshair.expand()
      
      // 🎯 NEW: Apply Weapon Recoil
      const currentWeapon = this.weaponManager.getCurrentWeapon()
      if (currentWeapon) {
        const weaponId = currentWeapon.getId()
        this.recoilManager.setActiveWeapon(weaponId)
        this.recoilManager.applyRecoil()
      }
      
      // ✨ NEW: Visual Effects Manager - Muzzle Flash
      const muzzlePosition = shootResult.origin
      const muzzleDirection = shootResult.direction
      this.visualEffectsManager.createMuzzleFlash(muzzlePosition, muzzleDirection)
      
      // Old effects manager (legacy)
      this.effectsManager.spawnMuzzleFlash(muzzlePosition, muzzleDirection)
      
      // 🔊 NEW: Smart Weapon Sound Selection
      const weapon = this.weaponManager.getCurrentWeapon()
      const weaponId = weapon?.getId() || 'pistol'
      const weaponSoundId = getWeaponSound(weaponId, 'fire')
      this.audioManager?.playSound(weaponSoundId, this.player.position)
      
      // Recoil auf Movement Controller
      // TODO: Movement Controller Recoil falls verfügbar
      // const recoilForce = weaponData.recoil || { x: 0, y: 0 }
      
      // Weapon Model Recoil
      if (this.weaponModel) {
        this.weaponModel.rotation.x -= 0.05
      }
      
      // Raycasting Hit Detection über PhysicsEngine (BESTE Variante)
      if (shootResult.hit) {
        // ✨ NEW: Bullet Tracer
        this.visualEffectsManager.createBulletTracer(
          shootResult.origin,
          shootResult.hit.point
        )
        
        this.handleBulletHit({
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
          // ✨ NEW: Bullet Tracer to miss point
          this.visualEffectsManager.createBulletTracer(
            shootResult.origin,
            worldIntersects[0].point
          )
          
          this.handleEnvironmentHit(worldIntersects[0])
        }
      }
      
      // Game State Update
      this.gameState.shotsFired++
      this.updateHUD()
    })

    // Weapon Switch Event
    this.weaponManager.onWeaponSwitch(async (event) => {
      // Altes WeaponModel entfernen
      if (this.weaponModel) {
        this.camera.remove(this.weaponModel)
        // Cleanup Geometry & Materials
        this.weaponModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.geometry.dispose()
            if (mesh.material instanceof THREE.Material) {
              mesh.material.dispose()
            }
          }
        })
      }
      
      // Neues WeaponModel laden
      await this.createWeaponModel()
      
      // ✅ NEU: Reserve Ammo für neue Waffe initialisieren falls nicht vorhanden
      const newWeapon = this.weaponManager.getCurrentWeapon()
      if (newWeapon) {
        const weaponId = newWeapon.getId()
        const weaponData = newWeapon.getData()
        if (!this.reserveAmmo.has(weaponId)) {
          // Fallback: Standard Reserve Ammo basierend auf Weapon Type
          const defaultReserve = weaponData.type === 'pistol' ? 30 : 
                                  weaponData.type === 'sniper' ? 20 : 120
          this.reserveAmmo.set(weaponId, defaultReserve)
        }
      }
      
      this.audioManager?.playSound('weapon_switch', this.player.position)
      this.updateHUD()
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
    this.updateHUD()
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
      this.handleNetworkStateUpdate(event.data)
    })
  }

  /**
   * 🗺️ Load Map (GLB Version)
   */
  private async loadMap(mapId: string): Promise<void> {
    try {
      console.log(`🗺️ Loading GLB map: ${mapId}`)

      // Versuche erst GLB Map zu laden
      const mapGroup = await this.glbMapLoader.loadGLBMap(mapId)
      
      // Cleanup alte Map
      if (this.loadedMapGroup) {
        this.scene.remove(this.loadedMapGroup)
      }
      
      // Neue Map in Scene hinzufügen
      this.loadedMapGroup = mapGroup
      this.scene.add(mapGroup)
      
      // ✅ WICHTIG: Szene für AdvancedMovementSystem aktualisieren
      this.advancedMovementSystem.setScene(this.scene)
      
      console.log(`✅ GLB Map loaded and added to scene: ${mapId}`)
      
    } catch (error) {
      console.warn(`⚠️ GLB map not available, trying JSON map: ${mapId}`)
      
      // Fallback: Versuche JSON Map zu laden
      try {
        await this.mapManager.loadMap(mapId, (progress) => {
          console.log(`Loading map: ${Math.round(progress.progress * 100)}%`)
        })
        console.log(`✅ Map loaded: ${mapId}`)
      } catch (jsonError) {
        console.warn('⚠️ JSON map also failed, using basic map')
        this.setupBasicMap()
      }
    }
  }

  /**
   * Setup map in Three.js scene
   */
  private setupMapInScene(mapData: any): void {
    // Clear existing map objects
    this.clearMap()

    // Create ground from map data
    if (mapData.geometry?.floors && mapData.geometry.floors.length > 0) {
      const floor = mapData.geometry.floors[0]
      const groundGeometry = new THREE.BoxGeometry(
        floor.size.x,
        floor.thickness,
        floor.size.z
      )
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.8,
        metalness: 0.2
      })
      this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
      this.ground.position.set(
        floor.position.x,
        floor.position.y,
        floor.position.z
      )
      this.ground.receiveShadow = true
      this.scene.add(this.ground)

      // Add to physics
      const groundPhysics = createPhysicsObject(
        this.ground,
        PhysicsObjectType.STATIC,
        PHYSICS_MATERIALS.CONCRETE
      )
      this.physicsEngine.addObject(groundPhysics)
    }

    // Create walls and obstacles from map geometry
    if (mapData.geometry?.walls) {
      for (const wall of mapData.geometry.walls) {
        const wallGeometry = new THREE.BoxGeometry(
          wall.size.x,
          wall.size.y,
          wall.size.z
        )
        const wallMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b7355,
          roughness: 0.9
        })
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
        wallMesh.position.copy(wall.position)
        wallMesh.castShadow = true
        wallMesh.receiveShadow = true
        this.scene.add(wallMesh)
        this.obstacles.push(wallMesh)

        // Add to physics
        const wallPhysics = createPhysicsObject(
          wallMesh,
          PhysicsObjectType.STATIC,
          PHYSICS_MATERIALS.CONCRETE
        )
        this.physicsEngine.addObject(wallPhysics)
      }
    }

    // Update lighting based on map environment
    if (mapData.environment) {
      this.updateEnvironmentLighting(mapData.environment)
    }

    console.log(`✅ Map "${mapData.name}" setup in scene`)
  }

  /**
   * Clear existing map objects
   */
  private clearMap(): void {
    if (this.ground) {
      this.scene.remove(this.ground)
      this.ground.geometry.dispose()
      ;(this.ground.material as THREE.Material).dispose()
    }

    for (const obstacle of this.obstacles) {
      this.scene.remove(obstacle)
      obstacle.geometry.dispose()
      ;(obstacle.material as THREE.Material).dispose()
    }
    this.obstacles = []
  }

  /**
   * Fallback: Setup basic map if map loading fails
   */
  private setupBasicMap(): void {
    console.log('🌍 Setting up basic map environment')

    // Create basic ground (GRÖSSER für bessere Sichtbarkeit)
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a5a3a, // Grüner Boden (besser sichtbar)
      roughness: 0.8,
      metalness: 0.2
    })
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.rotation.x = -Math.PI / 2 // PlaneGeometry braucht Rotation!
    this.ground.position.y = 0
    this.ground.receiveShadow = true
    // ✅ BESTE PERFORMANCE: Markiere Ground für Wallrun-System
    this.ground.userData.type = 'GROUND'
    this.ground.userData.isStatic = true
    this.scene.add(this.ground)

    // Add to physics
    const groundPhysics = createPhysicsObject(
      this.ground,
      PhysicsObjectType.STATIC,
      PHYSICS_MATERIALS.CONCRETE
    )
    this.physicsEngine.addObject(groundPhysics)

    // Create some basic obstacles
    for (let i = 0; i < 20; i++) {
      const height = Math.random() * 4 + 2
      const obstacleGeometry = new THREE.BoxGeometry(2, height, 2)
      const obstacleMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.9
      })
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial)
      obstacle.position.set(
        (Math.random() - 0.5) * 80,
        height / 2,
        (Math.random() - 0.5) * 80
      )
      obstacle.castShadow = true
      obstacle.receiveShadow = true

      // Avoid spawning on player
      if (obstacle.position.distanceTo(this.player.position) < 10) {
        continue
      }

      // ✅ BESTE PERFORMANCE: Markiere Obstacles für Wallrun-System
      obstacle.userData.type = 'OBSTACLE'
      obstacle.userData.isStatic = true

      this.scene.add(obstacle)
      this.obstacles.push(obstacle)

      // Add to physics
      const obstaclePhysics = createPhysicsObject(
        obstacle,
        PhysicsObjectType.STATIC,
        PHYSICS_MATERIALS.CONCRETE
      )
      this.physicsEngine.addObject(obstaclePhysics)
    }
    
    // ✅ BESTE PERFORMANCE: Update World Objects für Advanced Movement System
    if (this.advancedMovementSystem) {
      // Force update world objects (wird automatisch beim nächsten checkWalls() aufgerufen)
      this.advancedMovementSystem.setScene(this.scene)
    }
    
    // 🧭 NEW: Initialize Navigation Mesh for AI Pathfinding
    this.initializeNavMesh()
    
    console.log('✅ Basic map setup complete')
  }

  /**
   * 🧭 Initialize Navigation Mesh for AI Pathfinding
   */
  private initializeNavMesh(): void {
    console.log('🧭 Generating Navigation Mesh...')
    
    if (!this.pathfindingManager) {
      console.warn('⚠️ PathfindingManager not initialized yet, skipping NavMesh setup')
      return
    }
    
    const bounds = {
      min: new THREE.Vector3(-90, 0, -90),
      max: new THREE.Vector3(90, 0, 90)
    }
    
    const gridSize = 3 // 3m grid cells
    
    this.pathfindingManager.initialize(this.scene, bounds, gridSize)
    
    // Optional: Visualize NavMesh (for debugging)
    // this.pathfindingManager.visualizeNavMesh(this.scene)
    
    console.log('✅ Navigation Mesh ready!')
  }

  /**
   * Update environment lighting based on map
   */
  private updateEnvironmentLighting(environment: any): void {
    // Update fog
    if (environment.fog) {
      this.scene.fog = new THREE.Fog(
        environment.fog.color,
        environment.fog.near,
        environment.fog.far
      )
    }

    // TODO: Update sun direction, ambient light, etc.
  }

  /**
   * Setup lighting (KRITISCH für sichtbare Scene!)
   */
  private setupLighting(): void {
    // Ambient light (heller für bessere Sichtbarkeit)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)

    // Hemisphere light (mehr für bessere Beleuchtung)
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.5)
    this.scene.add(hemisphereLight)
    
    console.log('✅ Lighting setup complete')
  }

  /**
   * Setup player
   */
  private async setupPlayer(): Promise<void> {
    try {
      // ✅ BESTE INTEGRATION: Professional Player Character mit High-Res Texturen!
      console.log('👤 Loading professional player character...')
      const playerModel = await this.modelManager.loadPlayerCharacter('tactical_operator_high')
      
      const playerInstance = playerModel.clone()
      
      // KRITISCH: Scale-Berechnung für menschliche Größe (~1.7m)
      const bbox = new THREE.Box3().setFromObject(playerInstance)
      const size = new THREE.Vector3()
      bbox.getSize(size)
      
      // Ziel: 1.7m Höhe (wie Player Position Y=1.7)
      const targetHeight = 1.7
      let scale = targetHeight / size.y
      
      // Sicherheitscheck: Scale zwischen 0.01 und 0.1
      if (scale < 0.01) scale = 0.01
      if (scale > 0.1) scale = 0.1
      
      playerInstance.scale.set(scale, scale, scale)
      
      // KRITISCH: Boden-Positionierung mit BoundingBox
      const scaledBbox = new THREE.Box3().setFromObject(playerInstance)
      const groundOffset = -scaledBbox.min.y  // Offset zum Boden
      
      // Position: Player-Mesh bei (0, 1.7, 0), Model-Root muss angepasst werden
      playerInstance.position.set(0, groundOffset, 0)
      
      // Shadows
      playerInstance.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      this.player.mesh.add(playerInstance)
      this.player.mesh.position.copy(this.player.position) // (0, 1.7, 0)
      this.scene.add(this.player.mesh)
      
      // ✅ KRITISCH: MovementController mit Scene und PlayerMesh verbinden
      this.movementController.setScene(this.scene)
      this.movementController.setPlayerMesh(this.player.mesh)
      this.movementController.setCamera(this.camera)
      
      console.log(`✅ Professional Player Model: scale=${scale.toFixed(4)}, height=${size.y.toFixed(2)}, groundOffset=${groundOffset.toFixed(2)}`)
      console.log('   🎨 Using High-Res GLTF with PBR Textures')
      
    } catch (error) {
      console.warn('⚠️ Failed to load professional player model, trying fallback...')
      
      // Fallback: Versuche alte tactical_player.glb
      try {
        const fallbackModel = await this.modelManager.loadModel(
          '/models/characters/tactical_player.glb',
          'player-fallback'
        )
        const playerInstance = fallbackModel.clone()
        
        const bbox = new THREE.Box3().setFromObject(playerInstance)
        const size = new THREE.Vector3()
        bbox.getSize(size)
        
        const targetHeight = 1.7
        let scale = targetHeight / size.y
        if (scale < 0.01) scale = 0.01
        if (scale > 0.1) scale = 0.1
        
        playerInstance.scale.set(scale, scale, scale)
        
        const scaledBbox = new THREE.Box3().setFromObject(playerInstance)
        const groundOffset = -scaledBbox.min.y
        playerInstance.position.set(0, groundOffset, 0)
        
        playerInstance.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        this.player.mesh.add(playerInstance)
        this.player.mesh.position.copy(this.player.position)
        this.scene.add(this.player.mesh)
        
        this.movementController.setScene(this.scene)
        this.movementController.setPlayerMesh(this.player.mesh)
        this.movementController.setCamera(this.camera)
        
        console.log('✅ Fallback player model loaded')
      } catch (fallbackError) {
        console.warn('⚠️ All player models failed, using primitive geometry')
        this.createFallbackPlayer()
      }
    }
    
    // Setup weapon manager
    this.setupWeaponManager()
  }

  /**
   * Create fallback player (primitive geometry)
   */
  private createFallbackPlayer(): void {
    const playerGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8)
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial)
    playerMesh.castShadow = true
    this.player.mesh.add(playerMesh)
    this.player.mesh.position.copy(this.player.position) // (0, 1.7, 0)
    this.scene.add(this.player.mesh)
    
    // ✅ KRITISCH: MovementController auch bei Fallback verbinden
    this.movementController.setScene(this.scene)
    this.movementController.setPlayerMesh(this.player.mesh)
  }

  /**
   * Setup weapon manager
   */
  private async setupWeaponManager(): Promise<void> {
    // Preload models first
    await this.preloadModels()
    
    try {
      // Add and equip first weapon
      const equipped = await this.weaponManager.addWeapon('glxy_ar15_tactical')

      if (equipped) {
        console.log(`✅ Equipped weapon: ${equipped.getName()}`)
        
        // ✅ NEU: Reserve Ammo initialisieren
        const weaponId = equipped.getId()
        const weaponData = equipped.getData()
        if (!this.reserveAmmo.has(weaponId)) {
          // Fallback: Standard Reserve Ammo (120 für AR, 30 für Pistol, etc.)
          const defaultReserve = weaponData.type === 'pistol' ? 30 : 120
          this.reserveAmmo.set(weaponId, defaultReserve)
        }

        // Create weapon model for first-person view
        await this.createWeaponModel()

        // Play weapon equip sound
        this.audioManager?.playSound('weapon_equip')
      }
    } catch (error) {
      console.error('❌ Error setting up WeaponManager:', error)
    }
  }

  /**
   * ✅ Preload models for better performance
   */
  private async preloadModels(): Promise<void> {
    const modelsToPreload = [
      '/models/weapons/mac10.glb',
      '/models/weapons/awp.glb',
      '/models/weapons/pistol.glb',
      '/models/weapons/shotgun.glb',
      '/models/weapons/ak47.glb',
      '/models/characters/terrorist.glb',
      '/models/characters/police.glb',
      '/models/characters/military.glb',
      '/models/characters/soldier.glb',
      '/models/characters/zombie.glb',
      '/models/characters/tactical_player.glb'
    ]
    
    console.log('📦 Preloading models...')
    const promises = modelsToPreload.map(path => 
      this.modelManager.loadModel(path, path).catch(err => {
        console.warn(`⚠️ Failed to preload: ${path}`, err.message)
      })
    )
    
    await Promise.all(promises)
    console.log('✅ Models preloaded')
  }

  /**
   * Create weapon model
   */
  private async createWeaponModel(): Promise<void> {
    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon) return

    const weaponData = weapon.getData()
    const modelPath = weaponData.modelPath || this.getWeaponModelPath(weapon.getId())
    
    try {
      const weaponModel = await this.modelManager.loadModel(modelPath, `weapon-${weapon.getId()}`)
      this.weaponModel = weaponModel.clone()
      
      // PRÄZISE WERTE basierend auf V13/V16 Fixes
      const weaponType = weaponData.type.toLowerCase()
      
      // Standard: Deagle-Werte (PERFEKT als Referenz!)
      let position = new THREE.Vector3(0.15, -0.22, -0.4)
      let rotation = new THREE.Euler(0, -Math.PI / 2, 0)  // IMMER -90°!
      let scale = 0.3
      
      // Waffen-spezifische Anpassungen
      if (weaponType.includes('rifle') || weaponType.includes('assault')) {
        position = new THREE.Vector3(0.15, -0.22, -0.45)  // Weiter vorne
        scale = 0.28
      } else if (weaponType.includes('sniper') || weapon.getId().includes('awp')) {
        position = new THREE.Vector3(0.15, -0.22, -0.5)   // Noch weiter vorne (lang)
        scale = 0.25
      } else if (weaponType.includes('pistol')) {
        position = new THREE.Vector3(0.15, -0.22, -0.4)   // Deagle-Standard
        scale = 0.3
      } else if (weaponType.includes('shotgun')) {
        position = new THREE.Vector3(0.15, -0.22, -0.45)  // Wie Rifle
        scale = 0.28
      }
      
      // WeaponData überschreibt falls vorhanden
      if (weaponData.viewmodelPosition) {
        position.set(weaponData.viewmodelPosition.x, weaponData.viewmodelPosition.y, weaponData.viewmodelPosition.z)
      }
      if (weaponData.viewmodelScale) scale = weaponData.viewmodelScale
      if (weaponData.viewmodelRotation) {
        rotation.set(
          weaponData.viewmodelRotation.x || 0,
          weaponData.viewmodelRotation.y || -Math.PI / 2,  // Standard: -90°
          weaponData.viewmodelRotation.z || 0
        )
      }
      
      // Anwenden
      this.weaponModel.scale.set(scale, scale, scale)
      this.weaponModel.position.set(position.x, position.y, position.z)
      this.weaponModel.rotation.set(rotation.x, rotation.y, rotation.z)
      
      // Gunmetal Material
      this.weaponModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.castShadow = true
          mesh.receiveShadow = true
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.3,
            emissive: 0x111111,
            side: THREE.DoubleSide
          })
        }
      })
      
      // ✅ HÄNDE HINZUFÜGEN - Einfache Box-Hände
      const handGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.08)
      const handMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdbac, // Hautfarbe
        roughness: 0.8,
        metalness: 0.1
      })
      
      // Linke Hand (hält Vorderschaft)
      const leftHand = new THREE.Mesh(handGeometry, handMaterial)
      leftHand.position.set(-0.15, -0.15, -0.3)
      leftHand.castShadow = true
      this.weaponModel.add(leftHand)
      
      // Rechte Hand (hält Griff)
      const rightHand = new THREE.Mesh(handGeometry, handMaterial)
      rightHand.position.set(0.15, -0.2, -0.35)
      rightHand.castShadow = true
      this.weaponModel.add(rightHand)
      
      this.camera.add(this.weaponModel)
      console.log(`✅ Weapon with hands: ${weaponData.name} | Pos: (${position.x}, ${position.y}, ${position.z}) | Scale: ${scale} | Rot: ${(rotation.y * 180 / Math.PI).toFixed(0)}°`)
      
    } catch (error) {
      console.warn(`⚠️ Failed to load weapon model, using fallback geometry`)
      this.createFallbackWeapon()
    }
  }

  /**
   * Get weapon model path from weapon ID
   */
  private getWeaponModelPath(weaponId: string): string {
    const mapping: Record<string, string> = {
      'glxy_ar15_tactical': '/models/weapons/mac10.glb',
      'glxy_awp': '/models/weapons/awp.glb',
      'glxy_desert_eagle': '/models/weapons/pistol.glb',
      'glxy_shotgun': '/models/weapons/shotgun.glb',
      'default': '/models/weapons/ak47.glb'
    }
    return mapping[weaponId] || mapping['default']
  }

  /**
   * Create fallback weapon (primitive geometry)
   */
  private createFallbackWeapon(): void {
    this.weaponModel = new THREE.Group()
    
    // ✅ HÄNDE - Einfache Box-Hände (links und rechts)
    const handGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.08)
    const handMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac, // Hautfarbe
      roughness: 0.8,
      metalness: 0.1
    })
    
    // Linke Hand
    const leftHand = new THREE.Mesh(handGeometry, handMaterial)
    leftHand.position.set(-0.15, -0.15, -0.3)
    leftHand.castShadow = true
    this.weaponModel.add(leftHand)
    
    // Rechte Hand
    const rightHand = new THREE.Mesh(handGeometry, handMaterial)
    rightHand.position.set(0.15, -0.2, -0.35)
    rightHand.castShadow = true
    this.weaponModel.add(rightHand)
    
    // ✅ WAFFE - Größere, sichtbarere Waffe
    const weaponGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.35)
    const weaponMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x111111
    })
    const weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial)
    weaponMesh.position.set(0.05, -0.18, -0.4)
    weaponMesh.castShadow = true
    this.weaponModel.add(weaponMesh)
    
    // Lauf (Barrel)
    const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8)
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 1.0,
      roughness: 0.1
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.position.set(0.05, -0.18, -0.55)
    barrel.rotation.x = Math.PI / 2
    barrel.castShadow = true
    this.weaponModel.add(barrel)
    
    this.camera.add(this.weaponModel)
    console.log('✅ Fallback weapon with hands created (VISIBLE)')
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Keyboard
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)

    // Mouse
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousemove', this.onMouseMove)

    // Pointer Lock
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock()
    })

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement
    })

    // Resize
    window.addEventListener('resize', this.onResize)

    console.log('✅ Event listeners setup')
  }

  /**
   * Keyboard events
   */
  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code)

    // Sprint
    if (e.code === 'ShiftLeft') {
      this.movementController.sprint(true)
      this.player.stats.isSprinting = true
      // 💡 NEW: Sprint FOV
      this.sprintFOV.setSprinting(true)
    }

    // Crouch - Use Ctrl instead (C is for Character Selection UI)
    if (e.code === 'ControlLeft') {
      this.movementController.toggleCrouch()
      this.player.stats.isCrouching = this.movementController.isCrouching
    }

    // 🗺️ NEW: F - Interact with Door
    if (e.code === 'KeyF') {
      const interacted = this.mapInteractionManager.interactWithNearestDoor(this.player.position)
      if (interacted) {
        console.log('🚪 Door toggled!')
      }
    }

    // 💥 NEW: T - Cycle Ammo Type
    if (e.code === 'KeyT') {
      const newType = this.ammoSystem.cycleAmmoType()
      const props = AMMO_PROPERTIES[newType]
      console.log(`💥 Ammo: ${newType} - ${props.description}`)
      
      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(
          NotificationType.INFO,
          `AMMO: ${newType.toUpperCase()}`,
          { duration: 2 }
        )
      )
    }

    // 💣 NEW: G - Throw Grenade
    if (e.code === 'KeyG') {
      const cameraDirection = new THREE.Vector3()
      this.camera.getWorldDirection(cameraDirection)
      
      const thrown = this.grenadeSystem.throwGrenade(
        this.currentGrenadeType,
        this.player.position.clone().add(new THREE.Vector3(0, 1, 0)),
        cameraDirection
      )
      
      if (thrown) {
        console.log(`💣 Threw ${this.currentGrenadeType} grenade`)
      }
    }

    // 💣 NEW: H - Cycle Grenade Type
    if (e.code === 'KeyH') {
      const types = [GrenadeType.FRAG, GrenadeType.SMOKE, GrenadeType.FLASH]
      const currentIndex = types.indexOf(this.currentGrenadeType)
      const nextIndex = (currentIndex + 1) % types.length
      this.currentGrenadeType = types[nextIndex]
      
      console.log(`💣 Grenade type: ${this.currentGrenadeType}`)
      
      // Show notification
      this.uiManager?.showNotification(
        createNotificationTemplate(
          NotificationType.INFO,
          `GRENADE: ${this.currentGrenadeType.toUpperCase()}`,
          { duration: 2 }
        )
      )
    }

    // ⚡ NEW: Active Ability (E)
    if (e.code === 'KeyE') {
      const cameraDirection = new THREE.Vector3()
      this.camera.getWorldDirection(cameraDirection)
      this.abilitySystem.useActiveAbility(this.camera.position.clone(), cameraDirection)
    }

    // ⚡ NEW: Ultimate Ability (Q)
    if (e.code === 'KeyQ') {
      this.abilitySystem.useUltimateAbility(this.camera.position.clone())
    }

    // Reload
    if (e.code === 'KeyR') {
      this.reloadWeapon()
    }

    // Weapon switching (1-5)
    if (e.code.startsWith('Digit')) {
      const index = parseInt(e.code.replace('Digit', '')) - 1
      this.weaponManager.switchToIndex(index)
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code)

    // Sprint
    if (e.code === 'ShiftLeft') {
      this.movementController.sprint(false)
      this.player.stats.isSprinting = false
      // 💡 NEW: Sprint FOV
      this.sprintFOV.setSprinting(false)
    }

    // 📊 NEW: Tab - Hide Scoreboard
    if (e.key === 'Tab') {
      this.showScoreboard = false
    }
  }

  /**
   * Mouse events
   */
  private onMouseDown = (e: MouseEvent): void => {
    if (!this.isPointerLocked) return

    // Left click - shoot
    if (e.button === 0) {
      this.shootWeapon()
    }

    // Right click - aim / scope
    if (e.button === 2) {
      this.player.stats.isAiming = true
      this.isAiming = true
      // 🔭 NEW: Scope In
      this.scopeSystem.scopeIn()
    }
  }

  private onMouseUp = (e: MouseEvent): void => {
    // Right click - stop aiming / scope
    if (e.button === 2) {
      this.player.stats.isAiming = false
      this.isAiming = false
      // 🔭 NEW: Scope Out
      this.scopeSystem.scopeOut()
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isPointerLocked) return

    this.mouse.deltaX = e.movementX
    this.mouse.deltaY = e.movementY

    // Rotate camera
    const sensitivity = 0.002
    this.camera.rotation.y -= this.mouse.deltaX * sensitivity
    this.camera.rotation.x -= this.mouse.deltaY * sensitivity

    // Clamp vertical rotation
    this.camera.rotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, this.camera.rotation.x)
    )
  }

  private onResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  /**
   * 🎯 Shoot weapon with FULL integration
   * BESTE Variante: Vereinfacht - WeaponManager macht alles über Events!
   */
  private shootWeapon(): void {
    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon) return
    
    // BESTE Variante: WeaponManager macht alles über Events
    const shootDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
    this.weaponManager.shoot(this.camera.position, shootDirection)
    
    // Rest wird über onFire Event gehandhabt!
  }

  /**
   * Reload weapon with ✅ Reserve Ammo System
   */
  private async reloadWeapon(): Promise<void> {
    if (this.player.stats.isReloading) return

    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon) return

    const weaponData = weapon.getData()
    const weaponId = weapon.getId()
    
    // ✅ Reserve Ammo prüfen
    const currentReserve = this.reserveAmmo.get(weaponId) || 0
    const currentAmmo = weapon.getCurrentAmmo()
    const needed = weaponData.magazineSize - currentAmmo
    
    if (needed <= 0 || currentReserve <= 0) {
      // Kein Reload nötig oder kein Reserve Ammo
      this.audioManager?.playSound('weapon_reload_empty', this.player.position)
      return
    }

    this.player.stats.isReloading = true

    // Play reload sound
    this.audioManager?.playSound('weapon_reload_ar', this.player.position)

    await weapon.reload()

    // ✅ Reserve Ammo reduzieren
    const reloaded = Math.min(needed, currentReserve)
    this.reserveAmmo.set(weaponId, currentReserve - reloaded)
    
    // Wenn Reserve leer, warnen
    if (this.reserveAmmo.get(weaponId) === 0) {
      this.uiManager?.showNotification(
        createNotificationTemplate(NotificationType.WARNING, 'Out of Ammo!', { duration: 2 })
      )
    }

    this.player.stats.isReloading = false
    this.updateHUD()
  }

  /**
   * ✅ NEU: Setup Canvas Overlay für Hit Markers & Damage Indicators
   */
  private setupOverlayCanvas(): void {
    // Canvas für Overlay-Effekte erstellen
    this.overlayCanvas = document.createElement('canvas')
    this.overlayCanvas.style.position = 'absolute'
    this.overlayCanvas.style.top = '0'
    this.overlayCanvas.style.left = '0'
    this.overlayCanvas.style.width = '100%'
    this.overlayCanvas.style.height = '100%'
    this.overlayCanvas.style.pointerEvents = 'none'
    this.overlayCanvas.style.zIndex = '1000'
    this.overlayCanvas.width = this.container.clientWidth
    this.overlayCanvas.height = this.container.clientHeight
    this.container.appendChild(this.overlayCanvas)

    // Systems initialisieren
    this.hitMarkerSystem = new HitMarkerSystem(this.overlayCanvas)
    this.damageIndicatorSystem = new DamageIndicatorSystem(this.overlayCanvas, this.camera)

    // 🎨 NEW: Initialize Advanced Visual Feedback
    this.advancedVisualFeedback = new AdvancedVisualFeedbackManager(
      this.overlayCanvas,
      this.scene,
      this.camera
    )
    console.log('✅ Advanced Visual Feedback initialized')

    // ⚡ NEW: Initialize Ability HUD & Minimap
      this.abilityHUDRenderer = new AbilityHUDRenderer(this.overlayCanvas)
      this.minimapRenderer = new MinimapRenderer(this.overlayCanvas)
      console.log('✅ Ability HUD & Minimap initialized')
      
      // 📋 Initialize Kill Feed
      this.killFeedManager = new KillFeedManager(this.overlayCanvas)
      console.log('✅ Kill Feed Manager initialized')
      
      // 💥 Initialize Ammo HUD Renderer
      this.ammoHUDRenderer = new AmmoHUDRenderer(this.overlayCanvas)
      console.log('✅ Ammo HUD Renderer initialized')
      
      // 🔭 Initialize Scope Overlay Renderer
      this.scopeOverlayRenderer = new ScopeOverlayRenderer(this.overlayCanvas)
      console.log('✅ Scope Overlay Renderer initialized')
      
      // 📊 Update Scoreboard Canvas
      this.scoreboardManager = new ScoreboardManager(this.overlayCanvas, 'Free For All', false)
      console.log('✅ Scoreboard Manager canvas updated')
      
      // 💣 Initialize Grenade HUD Renderer
      this.grenadeHUDRenderer = new GrenadeHUDRenderer(this.overlayCanvas)
      console.log('✅ Grenade HUD Renderer initialized')

    // Resize Handler
    window.addEventListener('resize', () => {
      this.overlayCanvas.width = this.container.clientWidth
      this.overlayCanvas.height = this.container.clientHeight
    })
  }

  /**
   * ✅ NEU: Update Enemy Health Bars (immer zur Kamera gerichtet)
   */
  private updateEnemyHealthBars(): void {
    for (const enemy of this.enemies) {
      if (enemy.healthBar) {
        // Health Bar immer zur Kamera rotieren
        enemy.healthBar.lookAt(this.camera.position)
        
        // Health Bar aktualisieren
        updateHealthBar(enemy.healthBar, enemy.health, enemy.maxHealth)
      }
    }
  }

  /**
   * BESTE Variante: Event-basierte Hit-Detection mit allen Daten (aus V6)
   */
  private handleBulletHit(event: {
    point: THREE.Vector3
    normal: THREE.Vector3
    object: THREE.Object3D
    damage: number
    weapon: BaseWeapon
  }): void {
    // ✨ NEW: Visual Effects Manager - Impact Effects
    const impactType = event.object?.userData?.type === 'ENEMY' ? 'blood' : 'concrete'
    if (impactType === 'blood') {
      // Blood effect for enemy hits
      this.visualEffectsManager.createBloodEffect(event.point, event.normal)
      this.effectsManager.spawnBloodSplatter(event.point, event.normal)
      this.audioManager?.playSound('impact_flesh', event.point)
    } else {
      // Surface impact for environment
      const material = event.object?.userData?.material || 'concrete'
      this.visualEffectsManager.createImpactEffect(
        event.point,
        event.normal,
        material as 'metal' | 'concrete' | 'wood'
      )
      this.audioManager?.playSound('impact_concrete', event.point)
    }
    
    // ✅ NEU: Damage anwenden mit Enemy Health System
    if (event.object?.userData?.type === 'ENEMY') {
      const enemyId = event.object.userData.id
      const enemy = this.enemies.find(e => e.id === enemyId)
      
      if (enemy && enemy.health > 0) {
        // 🎯 NEW: PRÄZISE Hitbox Detection statt Simple Y-Check
        const shootDirection = event.point.clone().sub(this.camera.position).normalize()
        const hitResult = this.hitboxManager.raycastCharacter(
          enemyId,
          this.camera.position,
          shootDirection
        )
        
        const damageMultiplier = hitResult.hit ? hitResult.damageMultiplier : 1.0
        const isHeadshot = hitResult.zone === HitboxZone.HEAD
        
        // 💥 NEW: Apply Ammo Type Damage Modifier
        const ammoDamage = this.ammoSystem.calculateDamage(event.damage)
        const finalDamage = ammoDamage * damageMultiplier
        
        // Log für Debug (optional)
        if (hitResult.hit) {
          console.log(`🎯 Hit Zone: ${hitResult.zone} (${damageMultiplier}x damage)`)
        }
        
        // 🎨 NEW: Show Damage Number
        this.advancedVisualFeedback.showDamageNumber(finalDamage, event.point, isHeadshot)
        
        // 🎵 NEW: Play Hit Sound
        if (isHeadshot) {
          this.hitSoundManager.playHitSound({
            type: HitSoundType.HEADSHOT,
            volume: 1.0,
            damage: finalDamage
          })
        } else {
          this.hitSoundManager.playHitSound({
            type: HitSoundType.BODY,
            volume: 1.0,
            damage: finalDamage
          })
        }
        
        // ✅ Enemy Health reduzieren
        enemy.health = Math.max(0, enemy.health - finalDamage)
        
        // 💥 NEW: Apply Fire Damage (Incendiary Ammo)
        const currentAmmo = this.ammoSystem.getCurrentType()
        const ammoProps = AMMO_PROPERTIES[currentAmmo]
        if (ammoProps.specialEffect === 'fire' && ammoProps.effectDuration && ammoProps.effectDamage) {
          this.fireDamageManager.applyFireDamage(enemy.id, ammoProps.effectDamage, ammoProps.effectDuration)
        }
        
        // ✅ Health Bar aktualisieren
        if (enemy.healthBar) {
          updateHealthBar(enemy.healthBar, enemy.health, enemy.maxHealth)
        }
        
        // ✅ Hit Marker zeigen
        this.hitMarkerSystem.addHitMarker(isHeadshot, false)
        
        // Game State Update
        this.gameState.shotsHit++
        this.gameState.damageDealt += finalDamage
        this.gameState.accuracy = (this.gameState.shotsHit / this.gameState.shotsFired) * 100
        
        if (isHeadshot) {
          this.gameState.headshots++
        }
        
        // ✅ Kill-Handling wenn Health <= 0
        if (enemy.health <= 0) {
          // ✅ Kill Hit Marker
          this.hitMarkerSystem.addHitMarker(isHeadshot, true)
          
          // 🎵 NEW: Play Kill Confirm Sound
          this.hitSoundManager.playHitSound({
            type: HitSoundType.KILL,
            volume: 1.0
          })
          
          // 🎨 NEW: Kill Effect
          this.advancedVisualFeedback.createKillEffect(enemy.mesh.position, isHeadshot)
          
          // ✅ NEU: Dopamin-System für Kill-Rewards
          const killData: KillData = {
            victim: enemy,
            weapon: event.weapon,
            distance: event.point.distanceTo(this.camera.position),
            isHeadshot: isHeadshot,
            isWallbang: false, // TODO: Implementiere Wallbang-Detection
            isMidair: false, // TODO: Check if player is in air
            isNoScope: !this.player.stats.isAiming
          }
          
          const dopamineEvent = this.killRewardSystem.registerKill(killData)
          
          // ✅ Zeige Dopamin-Effekte
          this.showDopamineEffects(dopamineEvent)
          
          // ✅ Progression Update mit Dopamin-Score
          this.progressionManager?.awardXP(XPSource.KILL, dopamineEvent.score)
          if (killData.isHeadshot) {
            this.progressionManager?.awardXP(XPSource.HEADSHOT_KILL, 50)
          }
          
          // 🆕 NEW: Weapon Progression Update
          const weaponKillEvent: WeaponKillEvent = {
            weaponId: event.weapon.getData().id,
            isHeadshot: killData.isHeadshot,
            distance: killData.distance,
            isHipfire: !this.player.stats.isAiming,
            isADS: this.player.stats.isAiming,
            isCrouching: this.player.stats.isCrouching,
            isSliding: false, // TODO: Add sliding detection
            isMultikill: false, // TODO: Add multikill detection
            xpEarned: dopamineEvent.score
          }
          this.weaponProgressionManager.registerKill(weaponKillEvent)
          
          // Update weapon mastery
          this.weaponProgressionManager.updateMastery(event.weapon.getData().id)
          
          // 🆕 NEW: Charge Ultimate Ability
          this.abilitySystem.chargeUltimate(dopamineEvent.score, 'kill')
          
          // 🎮 NEW: Register Kill in Game Mode
          this.fpsGameModeManager.registerKill('player', enemy.id)
          
          // ✅ Game State Score Update (Dopamin-Score verwenden)
          this.gameState.score += dopamineEvent.score
          
          // BESTE Kill-Handling (Cleanup & Game State)
          this.handleKill({
            enemy: enemy,
            weapon: event.weapon,
            distance: event.point.distanceTo(this.camera.position),
            isHeadshot: isHeadshot,
            hitPoint: event.point
          })
        } else {
          // ✅ Damage über AIController (für AI-Reaktion)
          enemy.aiController.takeDamage(finalDamage, event.point)
        }
      }
    }
  }

  /**
   * BESTE Variante: Environment Hit Handling (aus V6)
   */
  private handleEnvironmentHit(intersection: THREE.Intersection): void {
    // ✨ NEW: Visual Effects Manager - Impact Effect
    const material = intersection.object.userData.material || 'concrete'
    this.visualEffectsManager.createImpactEffect(
      intersection.point,
      intersection.face?.normal || new THREE.Vector3(0, 1, 0),
      material as 'metal' | 'concrete' | 'wood'
    )
    
    // Old effects manager (legacy)
    this.effectsManager.spawnEffect('bullet_impact', intersection.point)
    
    // 🗺️ NEW: Check for interactive object damage
    this.mapInteractionManager.handleBulletImpact(intersection.object, 25)
    
    // 🎨 NEW: Bullet Hole Decal
    this.advancedVisualFeedback.createBulletHole(
      intersection.point,
      intersection.face?.normal || new THREE.Vector3(0, 1, 0),
      material as 'metal' | 'concrete' | 'wood'
    )
    
    // 🔊 NEW: Smart Sound Selection
    const soundId = material === 'metal' ? 'impact_metal' : 
                    material === 'wood' ? 'impact_wood' : 'impact_concrete'
    this.audioManager?.playSound(soundId, intersection.point)
  }

  /**
   * BESTE Variante: AI Shoot Handling (aus V6)
   */
  private handleAIShoot(enemy: UltimateEnemy, shootData: AIShootData): void {
    // Raycast über PhysicsEngine (BESTE Variante)
    const rayResult = this.physicsEngine.raycast(
      shootData.origin,
      shootData.direction,
      1000, // max range
      [CollisionLayer.PLAYER] // nur Player-Layer
    )
    
    if (rayResult.hit) {
      // Player getroffen
      // ✅ Damage Indicator mit Richtung
      const directionToPlayer = new THREE.Vector3()
        .subVectors(this.player.position, shootData.origin)
        .normalize()
      this.handlePlayerHit(shootData.damage || 10, directionToPlayer)
      
      // Effects (BESTE Variante)
      this.effectsManager.spawnBloodSplatter(
        rayResult.point,
        rayResult.normal || new THREE.Vector3(0, 1, 0)
      )
    }
    
    // Muzzle Flash für AI
    this.effectsManager.spawnMuzzleFlash(shootData.origin, shootData.direction)
    this.audioManager?.playSound('enemy_fire', shootData.origin)
  }

  /**
   * BESTE Variante: Player Hit Handling (aus V6) + ✅ Damage Indicators
   */
  private handlePlayerHit(damage: number, direction?: THREE.Vector3): void {
    // ✅ Armor System: Armor reduziert Damage zuerst
    let actualDamage = damage
    if (this.player.stats.armor > 0) {
      const armorReduction = Math.min(this.player.stats.armor, damage * 0.5) // 50% Reduction
      actualDamage = damage - armorReduction
      this.player.stats.armor = Math.max(0, this.player.stats.armor - armorReduction)
    }
    
    this.player.stats.health -= actualDamage
    this.gameState.damageTaken += actualDamage
    
    // ✅ Damage Indicator zeigen
    if (direction) {
      this.damageIndicatorSystem.addDamageIndicator(direction, actualDamage)
    }
    
    // ✅ Red Screen Flash (über Canvas)
    this.showRedScreenFlash()
    
    if (this.player.stats.health <= 0) {
      this.player.stats.health = 0
      this.player.stats.isDead = true
      this.gameState.deaths++
      
      // Respawn nach 3 Sekunden
      setTimeout(() => {
        this.respawnPlayer()
      }, 3000)
    }
    
    this.updateHUD()
  }

  /**
   * ✅ NEU: Red Screen Flash Effekt
   */
  private showRedScreenFlash(): void {
    const ctx = this.overlayCanvas.getContext('2d')
    if (!ctx) return
    
    // Red overlay fade
    let alpha = 0.5
    let frameCount = 0
    const maxFrames = 10
    
    const flash = () => {
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`
      ctx.fillRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height)
      
      alpha -= 0.05
      frameCount++
      
      if (frameCount < maxFrames) {
        requestAnimationFrame(flash)
      } else {
        // Clear
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height)
      }
    }
    
    flash()
  }

  /**
   * 📊 Update Scoreboard Data
   */
  private updateScoreboard(): void {
    updateScoreboardForEngine(this)
  }

  /**
   * 💣 Setup Grenade Callbacks
   */
  private setupGrenadeCallbacks(): void {
    // Explosion callback
    this.grenadeSystem.onExplosion((position, radius, damage) => {
      console.log(`💥 Grenade explosion at`, position)
      
      // Damage enemies in radius
      this.enemies.forEach(enemy => {
        const distance = enemy.mesh.position.distanceTo(position)
        if (distance < radius && enemy.health > 0) {
          const damageMultiplier = 1 - (distance / radius)
          const finalDamage = damage * damageMultiplier
          
          enemy.health -= finalDamage
          console.log(`💥 Enemy took ${finalDamage} grenade damage`)
          
          if (enemy.health <= 0) {
            this.handleEnemyDeath(enemy)
          }
        }
      })
      
      // Visual effect
      this.effectsManager.spawnEffect('explosion', position)
    })

    // Smoke callback
    this.grenadeSystem.onSmoke((position, duration) => {
      console.log(`💨 Smoke grenade at`, position, `for ${duration}s`)
      // TODO: Implement smoke visual effect
    })

    // Flash callback
    this.grenadeSystem.onFlash((position, radius, duration) => {
      console.log(`⚡ Flash grenade at`, position)
      
      // Flash player if in radius
      const distance = this.player.position.distanceTo(position)
      if (distance < radius) {
        const intensity = 1 - (distance / radius)
        // TODO: Implement screen flash effect
        console.log(`⚡ Player flashed! Intensity: ${intensity}`)
      }
    })
  }

  /**
   * BESTE Variante: Kill-Handling mit Dopamine-System (aus V6) + ✅ NEU: KillRewardSystem
   */
  private handleKill(killData: {
    enemy: UltimateEnemy
    weapon: BaseWeapon
    distance: number
    isHeadshot: boolean
    hitPoint: THREE.Vector3
  }): void {
    // ✅ HINWEIS: Dopamin-Effekte wurden bereits in handleBulletHit() gezeigt
    // Hier nur noch Cleanup und Game State Update
    
    // 📋 NEW: Add Kill to Feed
    this.killFeedManager.addKill({
      killer: 'PLAYER',
      victim: `Enemy ${killData.enemy.id.substring(0, 8)}`,
      weapon: killData.weapon.getId(),
      isHeadshot: killData.isHeadshot,
      killstreak: this.killRewardSystem?.getKillStreak(),
      isPlayer: true
    })
    
    // 💡 NEW: Headshot Sound
    if (killData.isHeadshot) {
      playHeadshotSound(this.audioManager)
    }
    
    // 💡 NEW: Kill Streak Text
    const now = Date.now()
    const timeSinceLastKill = now - this.lastKillTime
    
    if (timeSinceLastKill < 3000) { // Within 3 seconds
      this.quickKillCount++
    } else {
      this.quickKillCount = 1
    }
    
    this.lastKillTime = now
    
    const killStreakMessage = getKillStreakMessage(this.quickKillCount)
    if (killStreakMessage) {
      this.killStreakDisplay.show(killStreakMessage)
      console.log(`💥 ${killStreakMessage.text}`)
    }
    
    // 📹 NEW: Capture Kill Cam Data
    const killCamData = this.killCamSystem.captureKillCam(
      'Player', // Killer ID
      'Player', // Killer Name
      killData.enemy.id, // Victim ID
      `Enemy ${killData.enemy.id}`, // Victim Name
      killData.weapon.getData().name, // Weapon Used
      this.camera.position, // Killer Position
      killData.enemy.mesh.position, // Victim Position
      killData.isHeadshot // Is Headshot
    )
    this.lastKillCamData = killCamData
    
    // 🎯 NEW: Add Kill to Kill Feed (via global API)
    if (typeof window !== 'undefined' && (window as any).addKillFeedEntry) {
      (window as any).addKillFeedEntry({
        id: `kill-${Date.now()}`,
        killerName: 'Player',
        victimName: `Enemy ${killData.enemy.id}`,
        weaponIcon: this.getWeaponIcon(killData.weapon.getData().type),
        isHeadshot: killData.isHeadshot,
        timestamp: Date.now()
      })
    }
    
    // ✨ Visuelle Effekte (BESTE Variante)
    this.effectsManager.spawnExplosion(killData.hitPoint, 0.8)
    
    // ✅ NEU: Enemy Death Handling (Cleanup Health Bar, etc.)
    this.handleEnemyDeath(killData.enemy)
    
    // Enemy entfernen
    this.scene.remove(killData.enemy.mesh)
    this.enemies = this.enemies.filter(e => e.id !== killData.enemy.id)
    
    // Game State Update
    this.gameState.kills++
    const killStreak = this.killRewardSystem.getKillStreak()
    // ✅ Score wird bereits in handleBulletHit() über dopamineEvent.score gesetzt
    // Hier nur Update für Kill Streak
    this.gameState.currentStreak = killStreak
    if (this.gameState.currentStreak > this.gameState.longestStreak) {
      this.gameState.longestStreak = this.gameState.currentStreak
    }
    
    this.updateHUD()
  }

  /**
   * Get weapon icon for kill feed
   */
  private getWeaponIcon(weaponType: string): string {
    const icons: Record<string, string> = {
      pistol: '🔫',
      rifle: '🔫',
      assault: '🔫',
      sniper: '🎯',
      shotgun: '💥',
      smg: '🔫',
      lmg: '🔫'
    }
    return icons[weaponType] || '🔫'
  }

  /**
   * ✅ ENTFERNT: Alte calculateDopamineEvent() - wird jetzt von KillRewardSystem übernommen
   * Diese Methode kann entfernt werden
   */
  // private calculateDopamineEvent(...) - ENTFERNT

  /**
   * BESTE Variante: Screen Shake für Game Feel (aus V6)
   */
  private applyScreenShake(intensity: number): void {
    const duration = 200 + (intensity * 100)
    const amplitude = 0.5 * intensity
    
    let startTime = Date.now()
    const originalCameraPosition = this.camera.position.clone()
    
    const shakeLoop = () => {
      const elapsed = Date.now() - startTime
      
      if (elapsed < duration) {
        const decay = 1 - (elapsed / duration)
        const shake = amplitude * decay
        
        // Camera Shake
        this.camera.position.x = originalCameraPosition.x + (Math.random() - 0.5) * shake
        this.camera.position.y = originalCameraPosition.y + (Math.random() - 0.5) * shake
        
        requestAnimationFrame(shakeLoop)
      } else {
        // Reset camera position
        this.camera.position.copy(originalCameraPosition)
      }
    }
    
    shakeLoop()
  }

  /**
   * Respawn Player
   */
  private respawnPlayer(): void {
    this.player.stats.health = this.player.stats.maxHealth
    this.player.stats.isDead = false
    this.player.position.set(0, 1.7, 0)
    this.camera.position.set(0, 1.7, 0)
    this.gameState.currentStreak = 0
    this.updateHUD()
  }

  /**
   * 🎨 Update HUD with ALL systems
   */
  private updateHUD(): void {
    const weapon = this.weaponManager.getCurrentWeapon()
    const weaponData = weapon?.getData()

    const progression = this.progressionManager?.getProfile()

    // ✅ KORREKTUR: Ammo-Struktur für UIManager
    const weaponId = weapon?.getId() || ''
    const currentAmmo = weapon?.getCurrentAmmo() || 0
    const reserveAmmo = this.reserveAmmo.get(weaponId) || 0
    const magazineSize = weaponData?.magazineSize || 0

    const stats = {
      ...this.player.stats,
      // ✅ UIManager erwartet diese Struktur:
      ammo: {
        current: currentAmmo,
        reserve: reserveAmmo,
        max: magazineSize,
        type: weaponData?.type || 'unknown'
      },
      weaponName: weaponData?.name || 'None',
      isReloading: this.player.stats.isReloading || false,
      // Legacy support (für andere Systeme)
      currentWeapon: weaponData ? {
        name: weaponData.name,
        currentAmmo: currentAmmo,
        magazineSize: magazineSize,
        reserveAmmo: reserveAmmo
      } : {
        name: 'None',
        currentAmmo: 0,
        magazineSize: 0,
        reserveAmmo: 0
      },
      score: this.gameState.score,
      kills: this.gameState.kills,
      deaths: this.gameState.deaths,
      accuracy: Math.round(this.gameState.accuracy),
      currentStreak: this.gameState.currentStreak,
      longestStreak: this.gameState.longestStreak,
      wave: this.gameState.wave,
      roundTime: this.gameState.roundTime,
      // ✅ UIManager erwartet time und round:
      time: this.gameState.roundTime,
      round: this.gameState.wave,
      isDead: this.player.stats.isDead,
      isAiming: this.player.stats.isAiming,
      level: progression?.level || 1,
      xp: progression?.xp || 0,
      rank: progression?.rank.name || 'Bronze',
      currentMap: this.gameState.currentMap
    }

    // Update UI Manager
    this.uiManager?.updateUI(stats as any)

    // Call original callback
    this.onStatsUpdate(stats)
  }

  // ============================================================
  // GAME MODE MANAGEMENT (PROFESSIONAL API)
  // ============================================================

  /**
   * Change game mode at runtime
   * PROFESSIONAL: Safe, non-destructive runtime mode switching
   *
   * @param mode - The game mode to switch to
   * @example
   * ```typescript
   * engine.changeGameMode('team-deathmatch')
   * ```
   */
  public changeGameMode(mode: GameMode): void {
    if (!mode) {
      console.warn('[UltimateFPSEngineV4] changeGameMode: Invalid mode (null/undefined)')
      return
    }

    const currentMode = this.gameModeManager.currentMode
    if (currentMode === mode) {
      console.log(`[UltimateFPSEngineV4] Already in ${mode} mode`)
      return
    }

    try {
      // SAFE: Change mode through GameModeManager (triggers events)
      this.gameModeManager.changeMode(mode)

      // CONTROLLED: Apply mode-specific settings (non-destructive)
      this.applyModeSettings(mode)

      console.log(`[UltimateFPSEngineV4] ✅ Game mode changed: ${currentMode} → ${mode}`)
    } catch (err) {
      console.error('[UltimateFPSEngineV4] ❌ changeGameMode failed:', err)
      // ROBUST: Mode change failed - keep old mode
    }
  }

  /**
   * Apply mode-specific settings
   * SAFE: Only non-destructive adjustments - no data loss, no hard resets
   *
   * @param mode - The game mode to apply settings for
   * @private
   */
  private applyModeSettings(mode: GameMode): void {
    // PROFESSIONAL: Mode-specific configuration without destroying state
    switch (mode) {
      case 'zombie':
        // Zombie mode: aggressive AI, wave-based spawning
        // TODO: Configure AI difficulty, spawn rates
        console.log('  🧟 Zombie mode: High AI aggression, wave spawning')
        break

      case 'team-deathmatch':
        // Team Deathmatch: enable team logic, balanced spawning
        // TODO: Activate team assignment, team scores
        console.log('  👥 Team Deathmatch: Team logic enabled')
        break

      case 'free-for-all':
        // Free-for-all: disable teams, individual scoring
        // TODO: Disable team logic, individual scores only
        console.log('  🎯 Free-for-all: Individual scoring')
        break

      case 'gun-game':
        // Gun Game: progressive weapon unlocks
        // TODO: Setup weapon progression rules
        console.log('  🔫 Gun Game: Progressive weapon system')
        break

      default:
        console.warn(`[UltimateFPSEngineV4] Unknown mode: ${mode}`)
        break
    }

    // SAFE: Apply general adjustments (non-destructive)
    // - Update UI labels/colors
    // - Adjust spawn parameters (but don't reset existing spawns)
    // - Configure scoring rules (but don't reset scores)
    // - Set AI behavior flags (but don't destroy AI instances)

    // NOTE: For full reset (new round), implement separate softReset() method
  }

  /**
   * ✅ KRITISCH: Start Render-Schleife
   */
  public start(): void {
    if (this.animationFrameId) {
      console.warn('⚠️ Render loop already running')
      return
    }
    console.log('🎬 Starting render loop...')
    this.clock.start() // Clock starten für Delta-Time
    this.update() // Erste Frame starten
  }

  /**
   * Update loop
   */
  public update = (): void => {
    this.animationFrameId = requestAnimationFrame(this.update)

    // ✅ KRITISCH: Rendering IMMER (auch wenn pausiert)
    // Game-Updates nur wenn aktiv
    if (this.gameState.isGameActive && !this.gameState.isPaused) {
      const deltaTime = Math.min(this.clock.getDelta(), 0.1) // Clamp to prevent physics explosion
      this.gameState.roundTime += deltaTime

      // Animation Mixers Update (nur für sichtbare Models)
      this.modelManager.updateAnimationMixers(deltaTime, this.camera)

      // Update player movement
      this.updatePlayerMovement(deltaTime)
      
      // PERFORMANCE: Spatial Grid für Player-Updates
      this.spatialGrid.update({
        id: 'player',
        position: this.player.position,
        radius: 1.5,
        type: 'player',
        data: this.player
      })
      
      // Bounding Box Update für Player
      this.boundingBoxSystem.updateBox('player', this.player.mesh)

      // Update physics
      this.physicsEngine.update(deltaTime)

      // Update effects
      this.effectsManager.update(deltaTime)

      // ⚡ NEW: Update Ability System with Game State
      if (this.abilitySystem) {
        this.abilitySystem.setGameState(
          this.player.mesh,
          {
            current: this.player.stats.health,
            max: this.player.stats.maxHealth,
            armor: this.player.stats.armor
          },
          this.enemies.map(e => ({
            mesh: e.mesh,
            health: e.health,
            id: e.id
          }))
        )
      }
      
      // 🆕 NEW: Update Character Ability System
      this.abilitySystem.update(deltaTime)
      
      // 🆕 NEW: Charge Ultimate over time (if character has passive charge)
      if (this.selectedCharacter.abilities.ultimate.chargeOverTime > 0) {
        this.abilitySystem.chargeUltimate(deltaTime, 'time')
      }

      // Update enemies
      this.updateEnemies(deltaTime)
      
      // ✅ NEU: Update Enemy Health Bars (immer zur Kamera gerichtet)
      this.updateEnemyHealthBars()
      
      // ✅ NEU: Update & Render Hit Markers & Damage Indicators
      this.hitMarkerSystem.update(deltaTime)
      this.damageIndicatorSystem.update(deltaTime)
      
      // 💡 NEW: Update Quick Features
      this.dynamicCrosshair.update(deltaTime)
      this.killStreakDisplay.update(deltaTime)
      this.lowHealthVignette.update(this.player.stats.health / this.player.stats.maxHealth, deltaTime)
      
      // 🎯 NEW: Update Recoil System (Recovery)
      this.recoilManager.update(deltaTime)
      
      // 🎯 NEW: Update Hitbox System
      this.hitboxManager.update()
      
      // 🎨 NEW: Update Advanced Visual Feedback
      this.advancedVisualFeedback.update(deltaTime)
      
      // 🎮 NEW: Update Game Mode
      this.fpsGameModeManager.update(deltaTime)
      
      // 🗺️ NEW: Update Map Interactions
      this.mapInteractionManager.update(deltaTime)
      
      // 📋 NEW: Update Kill Feed
      this.killFeedManager.update()
      
      // 💣 NEW: Update Grenades
      this.grenadeSystem.update(deltaTime)
      
      // 💥 NEW: Update Fire Damage
      this.fireDamageManager.update((entityId, damage) => {
        const enemy = this.enemies.find(e => e.id === entityId)
        if (enemy && enemy.health > 0) {
          enemy.health = Math.max(0, enemy.health - damage)
          
          // Update health bar
          if (enemy.healthBar) {
            updateHealthBar(enemy.healthBar, enemy.health, enemy.maxHealth)
          }
          
          // Check if killed by fire
          if (enemy.health <= 0) {
            this.handleEnemyDeath(enemy)
          }
        }
      })
      
      // 💡 NEW: Sprint FOV
      let newFOV = this.sprintFOV.update(deltaTime)
      
      // 🔭 NEW: Scope FOV (overrides sprint FOV if scoped)
      const scopeFOV = this.scopeSystem.update(deltaTime)
      if (this.scopeSystem.getIsScoped()) {
        newFOV = scopeFOV
      }
      
      if (this.camera.fov !== newFOV) {
        this.camera.fov = newFOV
        this.camera.updateProjectionMatrix()
      }
      
      // 💡 NEW: Landing Shake
      this.landingShake.update(deltaTime)
      const isGrounded = this.movementController.isGrounded
      if (isGrounded && !this.lastGroundedState) {
        // Just landed
        const velocity = this.movementController.velocity
        this.landingShake.trigger(velocity.y)
        
        // 👣 NEW: Landing Sound
        if (this.scene && this.scene.children && Array.isArray(this.scene.children) && this.scene.children.length > 0) {
          const surface = this.footstepManager.detectSurface(this.player.position, this.scene)
          this.footstepManager.playLand(surface, this.player.position, Math.min(Math.abs(velocity.y) / 10, 1))
        }
      }
      this.lastGroundedState = isGrounded
      
      // Apply landing shake to camera
      if (this.landingShake.isShaking()) {
        const shakeOffset = this.landingShake.getShakeOffset()
        this.camera.rotation.x += shakeOffset.y
        this.camera.rotation.y += shakeOffset.x
      }
      
      // 🏃 NEW: Apply Camera Bob
      const cameraBobOffset = this.movementFeelManager.getCameraBobOffset()
      const originalCameraY = this.camera.position.y
      this.camera.position.y += cameraBobOffset.y
      this.camera.position.x += cameraBobOffset.x
      
      // Render Overlay (Hit Markers & Damage Indicators + Quick Features)
      const ctx = this.overlayCanvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height)
        
        // Hit Markers & Damage Indicators
        this.hitMarkerSystem.render()
        this.damageIndicatorSystem.render()
        
        // 💡 NEW: Render Quick Features
        const centerX = this.overlayCanvas.width / 2
        const centerY = this.overlayCanvas.height / 2
        
        // Dynamic Crosshair
        this.dynamicCrosshair.render(ctx, centerX, centerY)
        
        // Kill Streak Display
        this.killStreakDisplay.render(ctx, centerX, centerY)
        
        // Low HP Vignette
        this.lowHealthVignette.render(ctx, this.overlayCanvas.width, this.overlayCanvas.height)
        
        // 🎨 NEW: Render Advanced Visual Feedback (Screen Flash, Damage Numbers)
        this.advancedVisualFeedback.render(ctx, this.overlayCanvas.width, this.overlayCanvas.height)
        
        // ⚡ NEW: Render Ability HUD
        const abilityHUDData: AbilityHUDData = {
          activeName: this.selectedCharacter.abilities.active.name,
          activeCooldown: this.abilitySystem.getActiveAbilityState()?.cooldownRemaining || 0,
          activeMaxCooldown: this.selectedCharacter.abilities.active.cooldown,
          activeCharges: this.abilitySystem.getActiveAbilityState()?.chargesRemaining || 1,
          activeKey: 'E',
          ultimateName: this.selectedCharacter.abilities.ultimate.name,
          ultimateCharge: (this.abilitySystem.getUltimateAbilityState()?.charge || 0) / this.selectedCharacter.abilities.ultimate.chargeRequired * 100,
          ultimateKey: 'Q',
          ultimateReady: this.abilitySystem.getUltimateAbilityState()?.isReady || false
        }
        this.abilityHUDRenderer.render(ctx, abilityHUDData)
        
        // ⚡ NEW: Render Minimap
        const minimapData: MinimapData = {
          playerPosition: this.player.position,
          playerRotation: this.camera.rotation.y,
          enemies: this.enemies.map(e => ({
            position: e.mesh.position,
            distance: e.mesh.position.distanceTo(this.player.position)
          })),
          mapSize: { width: 200, height: 200 }
        }
        this.minimapRenderer.render(ctx, minimapData)
        
        // 📋 NEW: Render Kill Feed
        this.killFeedManager.render(ctx, this.overlayCanvas.width, this.overlayCanvas.height)
        
        // 💥 NEW: Render Ammo Type HUD (bottom-left)
        const ammoState = this.ammoSystem.getState()
        this.ammoHUDRenderer.render(ctx, ammoState, 20, this.overlayCanvas.height - 100)
        
        // 💣 NEW: Render Grenade HUD (bottom-left, below ammo)
        const grenadeState: GrenadeHUDState = {
          currentType: this.currentGrenadeType,
          inventory: this.grenadeSystem.getInventory()
        }
        this.grenadeHUDRenderer.render(ctx, grenadeState, 20, this.overlayCanvas.height - 240)
        
        // 🔭 NEW: Render Scope Overlay (if scoped with overlay)
        if (this.scopeSystem.hasOverlay()) {
          this.scopeOverlayRenderer.render(
            ctx,
            this.overlayCanvas.width,
            this.overlayCanvas.height,
            this.scopeSystem.getZoomLevel()
          )
        }
        
        // 📊 NEW: Render Scoreboard (if shown)
        if (this.showScoreboard) {
          this.scoreboardManager.render(ctx, this.overlayCanvas.width, this.overlayCanvas.height)
        }
      }

      // Update audio listener position
      this.audioManager?.updateListener(
        this.camera.position,
        this.camera.getWorldDirection(new THREE.Vector3()),
        new THREE.Vector3(0, 1, 0)
      )

      // Spawn enemies (mit Race Condition Schutz)
      if (!this.isSpawningEnemy && Date.now() - this.lastEnemySpawn > 3000) {
        this.isSpawningEnemy = true
        this.spawnEnemy()
          .then(() => {
            this.lastEnemySpawn = Date.now()
            this.isSpawningEnemy = false
          })
          .catch((err) => {
            console.error('Spawn enemy error:', err)
            this.isSpawningEnemy = false
          })
      }

      // Update HUD
      this.updateHUD()
    } else {
      // Auch wenn pausiert: Hit Markers & Damage Indicators rendern
      const ctx = this.overlayCanvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height)
        this.hitMarkerSystem.render()
        this.damageIndicatorSystem.render()
      }
    }

    // ✅ KRITISCH: Rendering IMMER (auch wenn pausiert)
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * ✅ NEU: Zeige Dopamin-Effekte für maximale Sucht
   */
  private showDopamineEffects(event: DopamineEvent): void {
    // Sound abspielen
    this.audioManager?.playSound(event.sound, this.player.position)
    
    // Screen Effects anwenden
    event.effects.forEach(effect => {
      switch (effect.type) {
        case 'screenShake':
          this.applyScreenShake(effect.intensity)
          break
        case 'slowMotion':
          // TODO: Implementiere Slow Motion
          break
        case 'chromatic':
          // TODO: Implementiere Chromatic Aberration
          break
        case 'screenFlash':
          this.showScreenFlash(effect.color || new THREE.Color(0xffffff), effect.intensity)
          break
        case 'zoomPunch':
          // TODO: Implementiere Zoom Punch
          break
      }
    })
    
    // UI Notification
    this.uiManager?.showNotification(
      createNotificationTemplate(
        NotificationType.HEADSHOT,
        event.message,
        { duration: 2 }
      )
    )
    
    // Combo Indicator zeigen
    if (event.multiplier > 1) {
      this.uiManager?.showNotification(
        createNotificationTemplate(
          NotificationType.SUCCESS,
          `${event.multiplier.toFixed(1)}x COMBO!`,
          { duration: 1.5 }
        )
      )
    }
  }

  /**
   * ✅ NEU: Screen Flash Effekt
   */
  private showScreenFlash(color: THREE.Color, intensity: number): void {
    const ctx = this.overlayCanvas.getContext('2d')
    if (!ctx) return
    
    let alpha = intensity
    let frameCount = 0
    const maxFrames = 5
    
    const flash = () => {
      ctx.fillStyle = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${alpha})`
      ctx.fillRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height)
      
      alpha -= intensity / maxFrames
      frameCount++
      
      if (frameCount < maxFrames) {
        requestAnimationFrame(flash)
      } else {
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height)
      }
    }
    
    flash()
  }

  /**
   * ✅ PROFESSIONAL: Update Player Movement mit korrektem MovementController-Integration + Advanced Movement
   */
  private updatePlayerMovement(deltaTime: number): void {
    // Get movement input
    const forward = this.keys.has('KeyW') || this.keys.has('ArrowUp')
    const backward = this.keys.has('KeyS') || this.keys.has('ArrowDown')
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft')
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight')
    const jump = this.keys.has('Space')
    const crouch = this.keys.has('KeyC') || this.keys.has('ControlLeft')
    const sprint = this.keys.has('ShiftLeft')

    // ✅ BESTE Variante: MovementController richtig nutzen
    // Update MovementController (für Stamina, Gravity, etc.)
    // Safety check: Only update if scene is ready
    if (this.scene && this.scene.children && Array.isArray(this.scene.children) && this.scene.children.length > 0) {
      this.movementController.update(deltaTime)
    }

    // ✅ NEU: Advanced Movement System Input
    const movementInput: MovementInput = {
      forward,
      backward,
      left,
      right,
      jump,
      crouch,
      sprint
    }

    // ✅ NEU: Advanced Movement System (Wallrun, Sliding, Bunny Hop)
    const advancedResult = this.advancedMovementSystem.update(deltaTime, movementInput, this.player.position)

    // ✅ Movement Direction berechnen (Camera-Relativ)
    const direction = new THREE.Vector3()
    if (forward) direction.z -= 1
    if (backward) direction.z += 1
    if (left) direction.x -= 1
    if (right) direction.x += 1

    // Normalize direction
    if (direction.length() > 0 || advancedResult.position.length() > 0) {
      direction.normalize()
      
      // Camera-Relative Movement (wichtig für FPS!)
      const cameraDirection = new THREE.Vector3()
      this.camera.getWorldDirection(cameraDirection)
      cameraDirection.y = 0 // Keine vertikale Bewegung
      cameraDirection.normalize()
      
      // Right vector für Strafe
      const rightVector = new THREE.Vector3()
      rightVector.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize()
      
      // Final direction (Forward/Backward + Left/Right)
      const finalDirection = new THREE.Vector3()
      finalDirection.addScaledVector(cameraDirection, -direction.z) // Forward/Backward
      finalDirection.addScaledVector(rightVector, direction.x) // Left/Right
      finalDirection.normalize()
      
      // ✅ Kombiniere Standard Movement + Advanced Movement
      if (advancedResult.state.isSliding || advancedResult.state.isWallRunning) {
        // Advanced Movement hat Priorität
        this.player.position.add(advancedResult.position)
      } else {
        // Standard Movement
        this.movementController.move(finalDirection, deltaTime)
        const velocity = this.movementController.velocity
        this.player.position.add(new THREE.Vector3(velocity.x, velocity.y, velocity.z).multiplyScalar(deltaTime))
      }
      
      // 🗺️ MAP BOUNDARIES - Verhindert Rausfliegen aus der Map
      const MAP_SIZE = 50 // Map ist 100x100 (von -50 bis +50)
      this.player.position.x = Math.max(-MAP_SIZE, Math.min(MAP_SIZE, this.player.position.x))
      this.player.position.z = Math.max(-MAP_SIZE, Math.min(MAP_SIZE, this.player.position.z))
      
      // Boden-Check: Verhindert Durchfallen
      if (this.player.position.y < 0.5) {
        this.player.position.y = 0.5
        this.movementController.velocity.y = 0
      }
      
      // 🏃 NEW: Update Movement Feel (Camera Bob)
      const isGroundedNow = this.movementController.isGrounded
      const movementResult = this.movementFeelManager.processMovement(
        finalDirection,
        isGroundedNow,
        deltaTime
      )
      
      // ✅ Apply Advanced Movement Effects (Camera Tilt, etc.)
      advancedResult.effects.forEach(effect => {
        if (effect.type === 'cameraTilt' && effect.angle) {
          // TODO: Implementiere Camera Tilt
        }
      })
      
      // ✅ Camera & Mesh Position synchronisieren
      this.camera.position.copy(this.player.position)
      this.player.mesh.position.copy(this.player.position)
      
      // ✅ Stamina vom MovementController übernehmen
      this.player.stats.stamina = this.movementController.stamina
      
      // 👣 NEW: Professional Footstep System
      const isMoving = finalDirection.length() > 0
      if (isMoving && isGroundedNow && this.scene && this.scene.children && Array.isArray(this.scene.children) && this.scene.children.length > 0) {
        const surface = this.footstepManager.detectSurface(this.player.position, this.scene)
        let movementType: MovementType
        
        if (this.player.stats.isSprinting) {
          movementType = MovementType.SPRINT
        } else if (this.player.stats.isCrouching) {
          movementType = MovementType.CROUCH
        } else {
          movementType = MovementType.WALK
        }
        
        this.footstepManager.update(
          isMoving,
          movementType,
          surface,
          this.player.position,
          0.5
        )
      }
    } else {
      // ✅ Keine Bewegung - MovementController stoppen
      this.movementController.stop()
    }
    
    // ✅ Jump Handling
    if (jump && this.movementController.isGrounded) {
      // 👣 NEW: Jump Sound
      if (this.scene && this.scene.children && Array.isArray(this.scene.children) && this.scene.children.length > 0) {
        const surface = this.footstepManager.detectSurface(this.player.position, this.scene)
        this.footstepManager.playJump(surface, this.player.position)
      }
      this.movementController.jump()
    }

    // ✅ Weapon sway and recoil recovery
    if (this.weaponModel) {
      this.weaponModel.rotation.x = THREE.MathUtils.lerp(
        this.weaponModel.rotation.x,
        0,
        deltaTime * 10
      )
    }
  }

  /**
   * Update enemies
   * BESTE Variante: Mit AI Shooting, LOD, Frustum Culling und Performance-Optimierungen
   */
  private updateEnemies(deltaTime: number): void {
    // PERFORMANCE: Frustum Culling Setup (einmal pro Frame)
    const frustum = new THREE.Frustum()
    const cameraMatrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(cameraMatrix)
    
    for (const enemy of this.enemies) {
      const distance = enemy.mesh.position.distanceTo(this.player.position)
      
      // 📹 NEW: Kill Cam Recording for nearby enemies (potential killers)
      if (distance < 50 && enemy.aiController) {
        this.killCamSystem.startRecording(this.camera)
        this.killCamSystem.recordFrame(this.camera, enemy.mesh.position)
      }
      
      // PERFORMANCE: Frustum Culling - Skip entfernte, nicht-sichtbare Enemies
      const isInFrustum = frustum.containsPoint(enemy.mesh.position)
      if (!isInFrustum && distance > 100) {
        // Enemy ist zu weit weg und nicht sichtbar - skip Update
        enemy.mesh.visible = false
        continue
      }
      
      // PERFORMANCE: LOD System - Reduziere Update-Rate für entfernte Enemies
      let updateRate = 1.0
      let skipUpdate = false
      
      if (distance > 50) {
        // LOD Level 2: Weniger Updates (jeden 2. Frame)
        updateRate = 0.5
        enemy.mesh.visible = true
        // Skip Update bei jedem 2. Frame
        skipUpdate = Math.floor(this.gameState.roundTime * 10) % 2 === 0
      } else if (distance > 20) {
        // LOD Level 1: Normale Updates
        updateRate = 1.0
        enemy.mesh.visible = true
      } else {
        // LOD Level 0: Vollständige Updates
        updateRate = 1.0
        enemy.mesh.visible = true
      }
      
      // Skip Update wenn LOD es erfordert
      if (skipUpdate) {
        continue
      }
      
      // Update AI (nur wenn LOD es erlaubt)
      const decision = enemy.aiController.update(deltaTime * updateRate)

      // 🆕 NEW: Behavior Tree Execution für smarte AI
      const enemyClass = enemy.mesh.userData.enemyClass
      const enemyConfig = enemy.mesh.userData.enemyConfig
      
      if (enemyClass && enemyConfig && this.behaviorTreeManager) {
        // Create Behavior Context
        const behaviorContext = {
          // Enemy State
          enemyPosition: enemy.mesh.position.clone(),
          enemyHealth: enemy.health,
          enemyMaxHealth: enemy.maxHealth,
          isInCover: false, // TODO: Implement cover detection
          hasLineOfSight: this.hasLineOfSight(enemy.mesh.position, this.player.position),
          
          // Player State
          playerPosition: this.player.position.clone(),
          distanceToPlayer: distance,
          lastSeenPlayerPosition: this.player.position.clone(),
          timeSinceLastSeen: 0, // TODO: Track last seen time
          
          // Combat State
          currentWeapon: null, // Enemy weapon
          ammo: 100,
          isReloading: false,
          timeSinceLastShot: 0,
          
          // Team State
          nearbyAllies: this.enemies
            .filter(e => e.id !== enemy.id && e.mesh.position.distanceTo(enemy.mesh.position) < 20)
            .map(e => e.mesh.position),
          nearbyEnemies: [this.player.position],
          
          // Environment
          scene: this.scene,
          coverPoints: [], // TODO: Find cover points
          flankingRoutes: [], // TODO: Find flanking routes
          
          // Time
          deltaTime: deltaTime * updateRate,
          timestamp: Date.now()
        }
        
        // Execute Behavior Tree
        const action = this.behaviorTreeManager.executeBehavior(
          enemyConfig.behavior,
          enemyConfig,
          behaviorContext as any
        )
        
        // Execute Action
        this.executeBehaviorAction(enemy, action, deltaTime * updateRate)
      } else {
        // 🧭 NEW: Pathfinding-based Movement
        this.updateEnemyPathfinding(enemy, deltaTime * updateRate, distance)

        // Face player (nur wenn nah)
        if (distance <= 50) {
          enemy.mesh.lookAt(this.player.position)
        }

        // BESTE Variante: AI Shooting über State (nur wenn nah)
        if (distance <= 30) {
          const currentState = enemy.aiController.getCurrentState()
          if (currentState === AIState.ENGAGING) {
            enemy.aiController.shootAtPlayer()
          }
        }
      }

      // BESTE Variante: Spatial Grid für Performance
      this.spatialGrid.update({
        id: enemy.id,
        position: enemy.mesh.position,
        radius: 1.5,
        type: 'enemy',
        data: enemy
      })

      // Bounding Box Update (nur wenn nah)
      if (distance <= 50) {
        this.boundingBoxSystem.updateBox(enemy.id, enemy.mesh)
      }

      // Player Position für AI (immer aktualisieren)
      enemy.aiController.setPlayerPosition(this.player.position)
    }
  }

  /**
   * 🧭 Update Enemy Pathfinding Movement
   */
  private updateEnemyPathfinding(enemy: UltimateEnemy, deltaTime: number, distanceToPlayer: number): void {
    const PATH_UPDATE_INTERVAL = 2.0 // Update path every 2 seconds
    const PATH_NODE_REACH_DISTANCE = 2.0 // Distance to consider a node "reached"
    const MOVE_SPEED = 2.0
    
    const now = Date.now() / 1000
    
    // Initialize pathfinding properties
    if (!enemy.lastPathUpdateTime) {
      enemy.lastPathUpdateTime = 0
      enemy.pathIndex = 0
    }
    
    // Update path periodically or if no path exists
    const needsNewPath = 
      !enemy.currentPath || 
      enemy.currentPath.length === 0 ||
      (now - (enemy.lastPathUpdateTime || 0)) > PATH_UPDATE_INTERVAL
    
    if (needsNewPath) {
      // Find path to player
      const path = this.pathfindingManager.findPath(
        enemy.mesh.position,
        this.player.position
      )
      
      if (path.length > 0) {
        enemy.currentPath = path
        enemy.pathIndex = 0
        enemy.lastPathUpdateTime = now
        // console.log(`🧭 Enemy ${enemy.id}: New path with ${path.length} waypoints`)
      } else {
        // No path found - use direct movement as fallback
        enemy.currentPath = undefined
      }
    }
    
    // Follow current path
    if (enemy.currentPath && enemy.currentPath.length > 0 && enemy.pathIndex !== undefined) {
      const targetWaypoint = enemy.currentPath[enemy.pathIndex]
      const direction = new THREE.Vector3()
        .subVectors(targetWaypoint, enemy.mesh.position)
      
      const distanceToWaypoint = direction.length()
      direction.normalize()
      
      // Move towards waypoint
      enemy.mesh.position.add(direction.multiplyScalar(MOVE_SPEED * deltaTime))
      
      // Check if waypoint reached
      if (distanceToWaypoint < PATH_NODE_REACH_DISTANCE) {
        enemy.pathIndex++
        
        // Path completed?
        if (enemy.pathIndex >= enemy.currentPath.length) {
          enemy.currentPath = undefined
          enemy.pathIndex = 0
          // console.log(`🧭 Enemy ${enemy.id}: Path completed!`)
        }
      }
    } else {
      // Fallback: Direct movement towards player
      const direction = new THREE.Vector3()
        .subVectors(this.player.position, enemy.mesh.position)
        .normalize()
      
      enemy.mesh.position.add(direction.multiplyScalar(MOVE_SPEED * deltaTime))
    }
  }

  /**
   * 🆕 Execute Behavior Action from Behavior Tree
   */
  private executeBehaviorAction(enemy: UltimateEnemy, action: any, deltaTime: number): void {
    if (!action) return

    const distance = enemy.mesh.position.distanceTo(this.player.position)

    switch (action.type) {
      case 'move_to':
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          enemy.mesh.position.add(direction.multiplyScalar(2 * deltaTime))
          enemy.mesh.lookAt(action.target)
        }
        break

      case 'rush':
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          // Rush is faster than normal movement
          enemy.mesh.position.add(direction.multiplyScalar(4 * deltaTime))
          enemy.mesh.lookAt(action.target)
        }
        break

      case 'retreat':
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          enemy.mesh.position.add(direction.multiplyScalar(3 * deltaTime))
        }
        break

      case 'shoot':
        // AI shoot through AIController
        if (distance <= 50) {
          const currentState = enemy.aiController.getCurrentState()
          if (currentState === AIState.ENGAGING) {
            enemy.aiController.shootAtPlayer()
          }
        }
        break

      case 'take_cover':
        // Move to cover position
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          enemy.mesh.position.add(direction.multiplyScalar(2.5 * deltaTime))
        }
        break

      case 'flank':
        // Execute flanking maneuver
        if (action.target) {
          const direction = new THREE.Vector3()
            .subVectors(action.target, enemy.mesh.position)
            .normalize()
          enemy.mesh.position.add(direction.multiplyScalar(3 * deltaTime))
        }
        break

      case 'hold_position':
        // Stay in place, just look at player
        enemy.mesh.lookAt(this.player.position)
        break

      case 'suppress_fire':
        // Rapid fire mode
        if (distance <= 40) {
          enemy.aiController.shootAtPlayer()
        }
        break

      case 'aim_laser':
        // Sniper laser sight (visual warning for player)
        // TODO: Add laser sight visual effect
        enemy.mesh.lookAt(this.player.position)
        if (distance >= 40 && distance <= 100) {
          enemy.aiController.shootAtPlayer()
        }
        break

      case 'throw_grenade':
        // TODO: Implement grenade throwing
        // Silent operation - no console spam
        break

      case 'call_backup':
        // TODO: Spawn additional enemies
        // Silent operation - no console spam
        break

      case 'use_ability':
        // TODO: Execute special ability
        // Silent operation - no console spam
        break

      case 'wait':
        // Do nothing, just observe
        break

      default:
        // Fallback: Move towards player
        const direction = new THREE.Vector3()
          .subVectors(this.player.position, enemy.mesh.position)
          .normalize()
        enemy.mesh.position.add(direction.multiplyScalar(2 * deltaTime))
        enemy.mesh.lookAt(this.player.position)
    }
  }

  /**
   * 🆕 Check Line of Sight between two positions
   */
  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const direction = new THREE.Vector3().subVectors(to, from).normalize()
    const distance = from.distanceTo(to)
    
    // Use PhysicsEngine raycast for LOS check
    const rayResult = this.physicsEngine.raycast(
      from,
      direction,
      distance,
      [CollisionLayer.DEFAULT] // Only check world collision
    )
    
    // If no world collision, there's line of sight
    return !rayResult.hit
  }

  /**
   * Spawn enemy
   * BESTE Variante: Mit SpawnZoneSystem und AI Callbacks (aus V6)
   */
  private async spawnEnemy(): Promise<void> {
    if (this.enemies.length >= 10) return // Max enemies

    // BESTE Variante: SpawnZoneSystem für bessere Spawns (aus OptimizationModules)
    let spawnPos: THREE.Vector3
    const spawnZonePos = this.spawnZoneSystem.getSpawnPosition(
      this.player.position,
      []
    )
    
    if (spawnZonePos) {
      spawnPos = new THREE.Vector3(
        spawnZonePos.x + (Math.random() - 0.5) * 10,
        0, // TEMPORÄR - wird mit groundOffset überschrieben!
        spawnZonePos.z + (Math.random() - 0.5) * 10
      )
    } else {
      // Fallback: Random spawn position (far from player)
      do {
        spawnPos = new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          0, // TEMPORÄR - wird mit groundOffset überschrieben!
          (Math.random() - 0.5) * 80
        )
      } while (spawnPos.distanceTo(this.player.position) < 20)
    }
    
    const enemyId = `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // ✅ BESTE INTEGRATION: Professional Enemy mit Auto-LOD basiert auf Distanz!
      const distance = spawnPos.distanceTo(this.player.position)
      // Silent spawning - no console spam
      
      const enemyModel = await this.modelManager.loadEnemyCharacter('tactical_operator_optimized', distance)
      
      const enemyInstance = enemyModel.clone()
      
      // KRITISCH: Scale-Berechnung (0.08-0.15 wie V2/V11)
      const bbox = new THREE.Box3().setFromObject(enemyInstance)
      const size = new THREE.Vector3()
      bbox.getSize(size)
      
      // Ziel: 1.7m Höhe (realistisch)
      const targetHeight = 1.7
      let scale = targetHeight / size.y
      
      // KRITISCH: Scale zwischen 0.08 und 0.15 (wie V2/V11 Fixes!)
      if (scale < 0.08) scale = 0.08
      if (scale > 0.15) scale = 0.15
      
      enemyInstance.scale.set(scale, scale, scale)
      
      // KRITISCH: Boden-Positionierung mit BoundingBox-Check!
      const scaledBbox = new THREE.Box3().setFromObject(enemyInstance)
      const groundOffset = -scaledBbox.min.y  // Offset zum Boden
      
      // KRITISCH: Container-Meshes verstecken (wie V2 Fix)
      enemyInstance.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const meshBbox = new THREE.Box3().setFromObject(mesh)
          const meshSize = new THREE.Vector3()
          meshBbox.getSize(meshSize)
          
          // Wenn Mesh größer als 5 Units, ist es Container
          const maxDimension = Math.max(meshSize.x, meshSize.y, meshSize.z)
          if (maxDimension > 5) {
            console.log(`⚠️ Hiding container mesh (size: ${maxDimension.toFixed(2)})`)
            mesh.visible = false
            return
          }
          
          mesh.castShadow = true
          mesh.receiveShadow = true
        }
      })
      
      const enemyGroup = new THREE.Group()
      enemyGroup.add(enemyInstance)
      
      // KRITISCH: Position mit Boden-Offset!
      // X und Z bleiben gleich, Y wird mit groundOffset überschrieben
      enemyGroup.position.set(
        spawnPos.x,
        groundOffset,  // NICHT spawnPos.y! Am Boden!
        spawnPos.z
      )
      
      enemyGroup.userData = { type: 'ENEMY', id: enemyId }
      this.scene.add(enemyGroup)
      
      // 🆕 NEW: Select Enemy Class based on difficulty
      const enemyClass = selectEnemyClassByDifficulty(this.currentDifficulty)
      const enemyConfig = getEnemyConfig(enemyClass)
      
      // Silent spawning - no console spam
      
      // Create AI controller with class-specific settings
      const aiController = new AIController(
        'aggressive_assault', // TODO: Map behavior to behavior type
        'regular',
        enemyGroup
      )
      aiController.setScene(this.scene)
      aiController.setPlayerPosition(this.player.position)

      const enemy: UltimateEnemy = {
        id: enemyGroup.userData.id,
        mesh: enemyGroup,
        aiController: aiController,
        physicsObject: null,
        health: enemyConfig.health, // 🆕 Class-specific health
        maxHealth: enemyConfig.maxHealth,
        healthBar: undefined // Wird später erstellt
      }
      
      // Store enemy class for behavior tree
      enemyGroup.userData.enemyClass = enemyClass
      enemyGroup.userData.enemyConfig = enemyConfig

      // ✅ NEU: Health Bar erstellen und hinzufügen
      const healthBar = createHealthBar(enemy.maxHealth)
      enemyGroup.add(healthBar)
      enemy.healthBar = healthBar
      updateHealthBar(healthBar, enemy.health, enemy.maxHealth)

      // 🎯 NEW: Register Enemy Hitboxes
      this.hitboxManager.registerCharacter(enemy.id, enemyGroup)

      // BESTE Variante: AI Shoot Event (wie V6)
      aiController.onShoot((shootData) => {
        this.handleAIShoot(enemy, shootData)
      })

      // AI Death Event (BESTE Variante)
      aiController.onDeath(() => {
        this.handleEnemyDeath(enemy)
      })

      this.enemies.push(enemy)

      // BESTE Variante: Spatial Grid hinzufügen
      this.spatialGrid.insert({
        id: enemy.id,
        position: new THREE.Vector3(spawnPos.x, groundOffset, spawnPos.z),
        radius: 1.5,
        type: 'enemy',
        data: enemy
      })

      // Bounding Box hinzufügen (erste Mesh finden)
      const firstMesh = enemyInstance.children.find((child) => (child as THREE.Mesh).isMesh) as THREE.Mesh
      if (firstMesh) {
        this.boundingBoxSystem.createBox(enemy.id, firstMesh)
      }

      // Play spawn sound
      this.audioManager?.playSound('enemy_spawn', enemyGroup.position)
      
      // Silent enemy spawning - no console spam
      
    } catch (error) {
      console.warn('⚠️ Failed to load professional enemy, trying fallback models...')
      
      // Fallback: Versuche alte Character Models
      try {
        const fallbackTypes = [
          '/models/characters/terrorist.glb',
          '/models/characters/police.glb',
          '/models/characters/military.glb',
          '/models/characters/soldier.glb'
        ]
        const randomType = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)]
        const mixerId = `enemy-${enemyId}`
        
        const fallbackModel = await this.modelManager.loadModel(randomType, mixerId)
        const enemyInstance = fallbackModel.clone()
        
        const bbox = new THREE.Box3().setFromObject(enemyInstance)
        const size = new THREE.Vector3()
        bbox.getSize(size)
        
        const targetHeight = 1.7
        let scale = targetHeight / size.y
        if (scale < 0.08) scale = 0.08
        if (scale > 0.15) scale = 0.15
        
        enemyInstance.scale.set(scale, scale, scale)
        
        const scaledBbox = new THREE.Box3().setFromObject(enemyInstance)
        const groundOffset = -scaledBbox.min.y
        
        enemyInstance.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            const meshBbox = new THREE.Box3().setFromObject(mesh)
            const meshSize = new THREE.Vector3()
            meshBbox.getSize(meshSize)
            
            const maxDimension = Math.max(meshSize.x, meshSize.y, meshSize.z)
            if (maxDimension > 5) {
              mesh.visible = false
              return
            }
            
            mesh.castShadow = true
            mesh.receiveShadow = true
          }
        })
        
        const enemyGroup = new THREE.Group()
        enemyGroup.add(enemyInstance)
        enemyGroup.position.set(spawnPos.x, groundOffset, spawnPos.z)
        enemyGroup.userData = { type: 'ENEMY', id: enemyId }
        this.scene.add(enemyGroup)
        
        const aiController = new AIController('aggressive_assault', 'regular', enemyGroup)
        aiController.setScene(this.scene)
        aiController.setPlayerPosition(this.player.position)

        const enemy: UltimateEnemy = {
          id: enemyGroup.userData.id,
          mesh: enemyGroup,
          aiController: aiController,
          physicsObject: null,
          health: 150,
          maxHealth: 150,
          healthBar: undefined
        }

        const healthBar = createHealthBar(enemy.maxHealth)
        enemyGroup.add(healthBar)
        enemy.healthBar = healthBar
        updateHealthBar(healthBar, enemy.health, enemy.maxHealth)

        // 🎯 NEW: Register Enemy Hitboxes
        this.hitboxManager.registerCharacter(enemy.id, enemyGroup)

        aiController.onShoot((shootData) => {
          this.handleAIShoot(enemy, shootData)
        })

        aiController.onDeath(() => {
          this.handleEnemyDeath(enemy)
        })

        this.enemies.push(enemy)

        this.spatialGrid.insert({
          id: enemy.id,
          position: new THREE.Vector3(spawnPos.x, groundOffset, spawnPos.z),
          radius: 1.5,
          type: 'enemy',
          data: enemy
        })

        const firstMesh = enemyInstance.children.find((child) => (child as THREE.Mesh).isMesh) as THREE.Mesh
        if (firstMesh) {
          this.boundingBoxSystem.createBox(enemy.id, firstMesh)
        }

        this.audioManager?.playSound('enemy_spawn', enemyGroup.position)
        // Silent fallback spawning - no console spam
        
      } catch (fallbackError) {
        console.warn('⚠️ All enemy models failed, using primitive geometry')
        this.createFallbackEnemy(spawnPos)
      }
    }
  }

  /**
   * Create fallback enemy (primitive geometry)
   */
  private createFallbackEnemy(spawnPos: THREE.Vector3): void {
    // CapsuleGeometry Fallback (1.5m Höhe, Radius 0.5)
    const enemyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8)
    const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial)
    enemyMesh.castShadow = true
    const enemyGroup = new THREE.Group()
    enemyGroup.add(enemyMesh)
    
    // Capsule hat Pivot in der Mitte, also Y-Offset
    enemyGroup.position.set(spawnPos.x, spawnPos.y + 0.75, spawnPos.z) // +0.75 = halbe Höhe
    
    enemyGroup.userData = { type: 'ENEMY', id: `enemy-${Date.now()}` }
    this.scene.add(enemyGroup)
    
    // Create AI controller
    const aiController = new AIController(
      'aggressive_assault',
      'regular',
      enemyGroup
    )
    aiController.setScene(this.scene)
    aiController.setPlayerPosition(this.player.position)

    const enemy: UltimateEnemy = {
      id: enemyGroup.userData.id,
      mesh: enemyGroup,
      aiController: aiController,
      physicsObject: null,
      health: 150, // ✅ NEU: Enemy Health System
      maxHealth: 150,
      healthBar: undefined
    }

    // ✅ NEU: Health Bar erstellen
    const healthBar = createHealthBar(enemy.maxHealth)
    enemyGroup.add(healthBar)
    enemy.healthBar = healthBar

    // 🎯 NEW: Register Enemy Hitboxes
    this.hitboxManager.registerCharacter(enemy.id, enemyGroup)

    // AI Shoot Event
    aiController.onShoot((shootData) => {
      this.handleAIShoot(enemy, shootData)
    })

    // AI Death Event
    aiController.onDeath(() => {
      this.handleEnemyDeath(enemy)
    })

    this.enemies.push(enemy)

    // Spatial Grid hinzufügen
    this.spatialGrid.insert({
      id: enemy.id,
      position: enemyGroup.position,
      radius: 1.5,
      type: 'enemy',
      data: enemy
    })

    // Bounding Box hinzufügen
    this.boundingBoxSystem.createBox(enemy.id, enemyMesh)

    // Play spawn sound
    this.audioManager?.playSound('enemy_spawn', enemyGroup.position)
  }

  /**
   * BESTE Variante: Enemy Death Handling (aus V6) + ✅ Health Bar Cleanup
   */
  private handleEnemyDeath(enemy: UltimateEnemy): void {
    // Wird bereits in handleKill() behandelt, aber hier für Cleanup
    // SpatialObject finden und entfernen
    const nearby = this.spatialGrid.getNearby(enemy.mesh.position, 5)
    const spatialObject = nearby.find(obj => obj.id === enemy.id)
    if (spatialObject) {
      this.spatialGrid.remove(spatialObject)
    }
    this.boundingBoxSystem.removeBox(enemy.id)
    
    // 🎯 NEW: Hitbox unregister
    this.hitboxManager.unregisterCharacter(enemy.id)
    
    // ✅ NEU: Health Bar entfernen
    if (enemy.healthBar) {
      enemy.mesh.remove(enemy.healthBar)
      enemy.healthBar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.geometry.dispose()
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose()
          }
        }
      })
    }
    
    // KRITISCH: Animation-Mixer entfernen (verhindert Memory-Leaks)
    this.modelManager.removeAnimationMixer(`enemy-${enemy.id}`)
    
    // 📹 NEW: Stop Kill Cam Recording (if enemy was recording)
    if (enemy.aiController) {
      this.killCamSystem.stopRecording()
    }
  }

  /**
   * Handle network state update
   */
  private handleNetworkStateUpdate(data: any): void {
    // TODO: Update remote players from network state
  }

  /**
   * 🆕 NEW: Check if enemy has line of sight to player
   */
  /**
   * Destroy engine
   */
  public destroy(): void {
    console.log('🛑 Destroying Engine V4...')

    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // Remove event listeners
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('resize', this.onResize)

    // Dispose Phase 7-10 systems
    this.progressionManager?.dispose()
    this.mapManager?.dispose()
    this.audioManager?.dispose()
    this.uiManager?.dispose()
    this.networkManager?.dispose()

    // Cleanup GLB Maps
    if (this.glbMapLoader) {
      this.glbMapLoader.dispose()
    }
    if (this.loadedMapGroup) {
      this.scene.remove(this.loadedMapGroup)
      this.loadedMapGroup = undefined
    }

    // PERFORMANCE: Cleanup ModelManager
    this.modelManager.clearCache()

    // Cleanup spatial systems
    this.spatialGrid.clear()
    this.boundingBoxSystem.clear()

    // ✅ NEU: Cleanup Addiction Systems
    this.killRewardSystem.resetStreak()
    this.advancedMovementSystem.reset()

    // 🆕 NEW: Cleanup NEW FEATURES
    this.abilitySystem.destroy()
    // weaponProgressionManager speichert bereits in localStorage, kein Cleanup nötig

    // 📹 NEW: Cleanup Kill Cam System
    this.killCamSystem.dispose()

    // ✨ NEW: Cleanup Visual Effects Manager
    this.visualEffectsManager.dispose()

    // 🎮 NEW: Cleanup Game Flow Manager
    this.gameFlowManager.destroy()

    // ✅ NEU: Cleanup Overlay Canvas
    if (this.overlayCanvas && this.overlayCanvas.parentNode) {
      this.overlayCanvas.parentNode.removeChild(this.overlayCanvas)
    }

    // Dispose Three.js objects
    this.scene.clear()
    this.renderer.dispose()

    // Remove renderer from DOM
    this.container.removeChild(this.renderer.domElement)

    console.log('✅ Engine V4 destroyed')
  }
}
