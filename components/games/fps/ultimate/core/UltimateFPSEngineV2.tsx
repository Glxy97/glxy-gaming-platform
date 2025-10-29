// @ts-nocheck
'use client'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GameModeManager } from './GameModeManager'
import type { GameMode } from '../types/GameTypes'
import { WeaponManager } from '../weapons/WeaponManager'
import type { BaseWeapon } from '../weapons/BaseWeapon'

/**
 * 🎮 GLXY ULTIMATE FPS ENGINE V2
 * 
 * FIXES:
 * ✅ First-Person Weapon Model
 * ✅ Player Hands
 * ✅ Death Logic (Respawn)
 * ✅ Bessere Enemy Models
 * ✅ Health clamping (nie unter 0)
 * ✅ V11: Professional Game Mode System Integrated! 🎯
 */

// ============================================================
// INTERFACES (Same as V1)
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
  position: THREE.Vector3
  velocity: THREE.Vector3
  health: number
  maxHealth: number
  speed: number
  damage: number
  lastShot: number
  isAlive: boolean
  color: THREE.Color
  targetPlayer: boolean
}

export interface UltimateProjectile {
  id: string
  mesh: THREE.Mesh
  direction: THREE.Vector3
  speed: number
  damage: number
  range: number
  distanceTraveled: number
  isPlayerProjectile: boolean
  trailMeshes: THREE.Mesh[]
}

export interface UltimateParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
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
}

export interface UltimatePlayerStats {
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  speed: number
  currentWeaponIndex: number
  isReloading: boolean
  isSprinting: boolean
  isCrouching: boolean
  isAiming: boolean
  isDead: boolean
  isInvincible: boolean // Spawnschutz!
}

// ============================================================
// ULTIMATE FPS ENGINE V2 CLASS
// ============================================================

export class UltimateFPSEngineV2 {
  // Scene & Rendering
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private clock: THREE.Clock
  private gltfLoader: GLTFLoader

  // 🎮 GAME MODE SYSTEM (V12 - Professional Integration!)
  public gameModeManager: GameModeManager

  // Player
  private player: {
    position: THREE.Vector3
    rotation: THREE.Euler
    velocity: THREE.Vector3
    stats: UltimatePlayerStats
  }

  // ============================================================
  // WEAPONS: V16 OLD (DISABLED - Kept for rollback safety)
  // ============================================================
  /* V16 OLD - DISABLED
  private weapons: UltimateWeapon[]
  private projectiles: UltimateProjectile[] = []
  private lastShotTime: number = 0
  */

  // ============================================================
  // WEAPONS: V17 NEW (Modular Architecture)
  // ============================================================
  private weaponManager: WeaponManager
  private projectiles: UltimateProjectile[] = []

  // First-Person Weapon View
  private weaponModel?: THREE.Group
  private playerHands?: THREE.Group
  private modelCache: Map<string, THREE.Group> = new Map()

  // Enemies
  private enemies: UltimateEnemy[] = []
  private maxEnemies: number = 10
  private enemySpawnRate: number = 3000

  // Particles & Effects
  private particles: UltimateParticle[] = []
  private muzzleFlash?: THREE.PointLight

  // Input
  private keys: Set<string> = new Set()
  private mouse = { x: 0, y: 0, sensitivity: 0.002 }
  private isPointerLocked = false

  // Game State
  private gameState: UltimateGameState
  private animationId: number | null = null

  // Callbacks
  private onStatsUpdate?: (stats: any) => void
  private onGameEnd?: (result: any) => void

  // Environment
  private ground?: THREE.Mesh
  private obstacles: THREE.Mesh[] = []

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    container: HTMLElement,
    onStatsUpdate?: (stats: any) => void,
    onGameEnd?: (result: any) => void
  ) {
    this.container = container
    this.onStatsUpdate = onStatsUpdate
    this.onGameEnd = onGameEnd
    this.clock = new THREE.Clock()
    this.gltfLoader = new GLTFLoader()

    // 🎯 PROFESSIONELL: Initialize Game Mode Manager
    this.gameModeManager = new GameModeManager()
    
    // 🔗 INTELLIGENT: Connect Mode Change Events
    this.gameModeManager.onModeChange((mode: GameMode) => {
      console.log(`🎮 Ultimate FPS: Mode changed to ${mode}`)
      // Future: Reset game state when mode changes
      this.resetForNewMode(mode)
    })

    // Initialize Player
    this.player = {
      position: new THREE.Vector3(0, 1.6, 5),
      rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
      velocity: new THREE.Vector3(),
      stats: {
        health: 100,
        maxHealth: 100,
        armor: 50,
        maxArmor: 100,
        speed: 5,
        currentWeaponIndex: 0,
        isReloading: false,
        isSprinting: false,
        isCrouching: false,
        isAiming: false,
        isDead: false,
        isInvincible: false // Initial kein Spawnschutz
      }
    }

    // ============================================================
    // V16 OLD - DISABLED (Kept for rollback safety)
    // ============================================================
    /* V16 OLD - Initialize Weapons (DISABLED)
    this.weapons = [
      {
        id: 'glxy_m4a1',
        name: 'GLXY M4A1 Tactical',
        type: 'assault',
        damage: 35,
        fireRate: 667,
        range: 100,
        accuracy: 85,
        recoil: 0.05,
        magazineSize: 30,
        currentAmmo: 30,
        reserveAmmo: 120,
        reloadTime: 2.5
      },
      {
        id: 'glxy_awp',
        name: 'GLXY AWP Sniper',
        type: 'sniper',
        damage: 120,
        fireRate: 30,
        range: 200,
        accuracy: 98,
        recoil: 0.15,
        magazineSize: 5,
        currentAmmo: 5,
        reserveAmmo: 20,
        reloadTime: 3.5
      },
      {
        id: 'glxy_desert_eagle',
        name: 'GLXY Desert Eagle',
        type: 'pistol',
        damage: 65,
        fireRate: 180,
        range: 60,
        accuracy: 80,
        recoil: 0.08,
        magazineSize: 7,
        currentAmmo: 7,
        reserveAmmo: 35,
        reloadTime: 2.0
      }
    ]
    */

    // ============================================================
    // V17 NEW - Initialize WeaponManager (Modular Architecture)
    // ============================================================
    this.weaponManager = new WeaponManager()
    console.log('🔫 WeaponManager initialized (V17 Modular)')

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
      isGameActive: false,
      isPaused: false
    }

    // Initialize Scene (async to load models)
    this.init().then(() => {
      this.setupEventListeners()
      this.startGame()
    })
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  private async init(): Promise<void> {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200)
    this.scene.background = new THREE.Color(0x1a1a2e)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.copy(this.player.position)
    this.camera.rotation.copy(this.player.rotation)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.container.appendChild(this.renderer.domElement)

    // Add Camera to Scene (CRITICAL for child objects!)
    this.scene.add(this.camera)

    // Lighting
    this.createLighting()

    // Environment
    this.createEnvironment()

    // ============================================================
    // V17 NEW - Setup WeaponManager (Modular Architecture)
    // ============================================================
    await this.setupWeaponManager()

    // ============================================================
    // V16 OLD - DISABLED (Kept for rollback safety)
    // ============================================================
    /* V16 OLD - Weapon Model & Hands (DISABLED)
    await this.createWeaponModel()
    this.createPlayerHands()
    */

    // Muzzle Flash Light
    this.muzzleFlash = new THREE.PointLight(0xffa500, 0, 10)
    this.camera.add(this.muzzleFlash)
    this.muzzleFlash.position.set(0.2, -0.15, -0.3)
  }

  private createLighting(): void {
    const ambient = new THREE.AmbientLight(0x404040, 0.8)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(50, 100, 50)
    sun.castShadow = true
    sun.shadow.camera.left = -100
    sun.shadow.camera.right = 100
    sun.shadow.camera.top = 100
    sun.shadow.camera.bottom = -100
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    this.scene.add(sun)

    const hemisphere = new THREE.HemisphereLight(0x4488ff, 0x002244, 0.6)
    this.scene.add(hemisphere)
  }

  private createEnvironment(): void {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
      metalness: 0.2
    })
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.receiveShadow = true
    this.scene.add(this.ground)

    this.createObstacles()
    this.createSkybox()
  }

  private createObstacles(): void {
    const colors = [0x8b4513, 0x654321, 0xa0522d, 0x8b0000, 0x006400]

    for (let i = 0; i < 20; i++) {
      const width = 2 + Math.random() * 3
      const height = 2 + Math.random() * 4
      const depth = 2 + Math.random() * 3

      const geometry = new THREE.BoxGeometry(width, height, depth)
      const material = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.7,
        metalness: 0.3
      })

      const obstacle = new THREE.Mesh(geometry, material)
      obstacle.position.set(
        (Math.random() - 0.5) * 80,
        height / 2,
        (Math.random() - 0.5) * 80
      )
      obstacle.castShadow = true
      obstacle.receiveShadow = true

      this.obstacles.push(obstacle)
      this.scene.add(obstacle)
    }
  }

  private createSkybox(): void {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32)
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      side: THREE.BackSide,
      fog: false
    })
    const sky = new THREE.Mesh(skyGeometry, skyMaterial)
    this.scene.add(sky)
  }

  // ============================================================
  // V17 NEW - WEAPON MANAGER SETUP (Modular Architecture)
  // ============================================================

  private async setupWeaponManager(): Promise<void> {
    console.log('🔫 Setting up WeaponManager (V17 Modular)...')
    
    // Set scene and camera references
    this.weaponManager.setScene(this.scene)
    this.weaponManager.setCamera(this.camera)
    
    try {
      // Load all 3 weapons (JSON + 3D Models)
      console.log('📦 Loading weapons: m4a1, awp, deagle...')
      await this.weaponManager.addWeapons(['m4a1', 'awp', 'deagle'])
      
      // First weapon is auto-equipped by WeaponManager
      console.log('✅ All weapons loaded!')
      
      // Create player hands (reuse V16 method for now)
      this.createPlayerHands()
      
      // Load weapon model for current weapon
      await this.loadCurrentWeaponModel()
      
    } catch (error) {
      console.error('❌ Failed to setup WeaponManager:', error)
      // Fallback to V16 system if modular system fails
      console.warn('⚠️ Falling back to V16 weapon system...')
      // Uncomment V16 code in init() to re-enable fallback
    }
  }

  /**
   * Load 3D model for currently equipped weapon
   */
  private async loadCurrentWeaponModel(): Promise<void> {
    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon) {
      console.warn('⚠️ No weapon equipped')
      return
    }

    const weaponData = weapon.getData()
    console.log(`🔫 Loading 3D model: ${weaponData.modelPath}`)

    try {
      // Check cache first
      let modelScene: THREE.Group
      if (this.modelCache.has(weaponData.modelPath)) {
        modelScene = this.modelCache.get(weaponData.modelPath)!.clone()
        console.log(`✅ Model loaded from cache: ${weaponData.modelPath}`)
      } else {
        // Load GLB model
        const gltf = await this.gltfLoader.loadAsync(weaponData.modelPath)
        modelScene = gltf.scene
        this.modelCache.set(weaponData.modelPath, gltf.scene.clone())
        console.log(`✅ Model loaded & cached: ${weaponData.modelPath}`)
      }

      this.weaponModel = modelScene

      // Apply position/scale from weapon data
      const pos = weaponData.viewmodelPosition
      const scale = weaponData.viewmodelScale || 1.0
      
      this.weaponModel.scale.set(scale, scale, scale)
      this.weaponModel.position.set(pos.x, pos.y, pos.z)
      
      // Apply rotation if defined
      if (weaponData.viewmodelRotation) {
        const rot = weaponData.viewmodelRotation
        this.weaponModel.rotation.set(rot.x, rot.y, rot.z)
      }

      // Apply gunmetal material
      this.weaponModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          const weaponMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.3,
            emissive: 0x111111,
            side: THREE.DoubleSide
          })
          
          ;(child as THREE.Mesh).material = weaponMaterial
        }
      })

      this.camera.add(this.weaponModel)
      console.log(`✅ Weapon model equipped: ${weaponData.name}`)

    } catch (error) {
      console.error(`❌ Failed to load weapon model:`, error)
      // Create fallback weapon
      this.createFallbackWeapon()
    }
  }

  // ============================================================
  // V16 OLD - WEAPON MODEL (DISABLED - Kept for rollback safety)
  // ============================================================

  /* V16 OLD - DISABLED
  private async createWeaponModel(): Promise<void> {
    // Load professional 3D weapon model based on current weapon
    const currentWeapon = this.weapons[this.player.stats.currentWeaponIndex]
    let modelPath = '/models/weapons/ak47.glb' // Default M4A1 = AK47 (better model!)

    if (currentWeapon.id === 'glxy_awp') {
      modelPath = '/models/weapons/awp.glb'
    } else if (currentWeapon.id === 'glxy_desert_eagle') {
      modelPath = '/models/weapons/pistol.glb'
    }
    
    console.log(`🔫 Loading weapon model: ${modelPath} for ${currentWeapon.name}`)

    try {
      // Check cache first
      let modelScene: THREE.Group
      if (this.modelCache.has(modelPath)) {
        // Clone cached model for reuse
        modelScene = this.modelCache.get(modelPath)!.clone()
        console.log(`✅ Weapon model loaded from cache: ${modelPath}`)
      } else {
        // Load new model
        const gltf = await this.gltfLoader.loadAsync(modelPath)
        modelScene = gltf.scene
        
        // Cache original
        this.modelCache.set(modelPath, gltf.scene.clone())
        console.log(`✅ Weapon model loaded & cached: ${modelPath}`)
      }

      this.weaponModel = modelScene

      // 🔥 FIX V16: FPS-STANDARD Weapon Positioning (wie Call of Duty / CS:GO!)
      // Waffen müssen 25-30% des Bildschirms füllen!
      
      if (currentWeapon.id === 'glxy_awp') {
        // AWP: Sniper Rifle - GROSS und NAH!
        this.weaponModel.scale.set(0.6, 0.6, 0.6) // 3x größer!
        this.weaponModel.position.set(0.35, -0.25, -0.2) // Viel näher zur Kamera!
        this.weaponModel.rotation.set(-0.05, -Math.PI / 2, 0)
        console.log('🎯 AWP: FPS-Standard (0.6 scale, z=-0.2)')
      } else if (currentWeapon.id === 'glxy_desert_eagle') {
        // Deagle: Pistole - groß aber kompakt
        this.weaponModel.scale.set(0.7, 0.7, 0.7) // Größer!
        this.weaponModel.position.set(0.2, -0.3, -0.2) // Näher!
        this.weaponModel.rotation.set(0, -Math.PI / 2, 0)
        console.log('🔫 Deagle: FPS-Standard (0.7 scale, z=-0.2)')
      } else {
        // M4A1 / AK47: Assault Rifles - DOMINANT im Bild!
        this.weaponModel.scale.set(0.65, 0.65, 0.65) // Viel größer!
        this.weaponModel.position.set(0.3, -0.25, -0.18) // Viel näher!
        this.weaponModel.rotation.set(-0.03, -Math.PI / 2, 0)
        console.log('🔫 M4A1: FPS-Standard (0.65 scale, z=-0.18)')
      }

      // FIX MATERIALS: Apply realistic weapon colors
      this.weaponModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          // Create COLORED weapon material (fix white texture issue!)
          const weaponMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,        // Dark gunmetal gray
            metalness: 0.9,          // Very metallic
            roughness: 0.3,          // Slightly rough
            emissive: 0x111111,      // Slight glow
            side: THREE.DoubleSide
          })
          
          // Apply material to ALL meshes
          ;(child as THREE.Mesh).material = weaponMaterial
        }
      })
      
      console.log('✅ Weapon materials fixed - Applied gunmetal color')

      this.camera.add(this.weaponModel)
      
      console.log(`✅ GLB Weapon added to camera - Scale: 0.4, Pos: (0.05, -0.2, -0.4)`)
      console.log(`Weapon children count: ${this.weaponModel.children.length}`)
    } catch (error) {
      console.error(`❌ Failed to load weapon model ${modelPath}:`, error)
      // Fallback to simple geometry
      this.createFallbackWeapon()
    }
  }
  */ // END V16 OLD createWeaponModel

  // ============================================================
  // V17 ACTIVE - createFallbackWeapon (Reused from V16)
  // ============================================================
  private createFallbackWeapon(): void {
    // PROFESSIONAL-LOOKING Fallback Rifle
    this.weaponModel = new THREE.Group()
    
    // Main Body (GUNMETAL GRAY - like real weapon!)
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.5)
    const gunmetalMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,      // Dark gray
      emissive: 0x050505,
      metalness: 0.9,
      roughness: 0.3
    })
    const body = new THREE.Mesh(bodyGeometry, gunmetalMaterial)
    body.castShadow = true
    this.weaponModel.add(body)
    
    // Barrel (Darker metal)
    const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 16)
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      emissive: 0x000000,
      metalness: 1.0,
      roughness: 0.2
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.05, -0.35)
    barrel.castShadow = true
    this.weaponModel.add(barrel)
    
    // Magazine (ORANGE accent - for visibility!)
    const magGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.08)
    const magMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcc5500,
      metalness: 0.5,
      roughness: 0.6
    })
    const mag = new THREE.Mesh(magGeometry, magMaterial)
    mag.position.set(0, -0.12, 0.05)
    mag.castShadow = true
    this.weaponModel.add(mag)
    
    // Stock (Kolben)
    const stockGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.15)
    const stock = new THREE.Mesh(stockGeometry, gunmetalMaterial)
    stock.position.set(0, 0, 0.3)
    stock.castShadow = true
    this.weaponModel.add(stock)
    
    // Sight (Red dot on top)
    const sightGeometry = new THREE.BoxGeometry(0.02, 0.03, 0.04)
    const sightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    })
    const sight = new THREE.Mesh(sightGeometry, sightMaterial)
    sight.position.set(0, 0.08, -0.1)
    this.weaponModel.add(sight)
    
    // 🔥 V16: Position: FPS-Standard (M4A1-Position)
    this.weaponModel.scale.set(0.65, 0.65, 0.65) // FPS-Standard!
    this.weaponModel.position.set(0.3, -0.25, -0.18) // Groß und nah!
    this.weaponModel.rotation.set(-0.03, -Math.PI / 2, 0)
    
    // Add to camera
    this.camera.add(this.weaponModel)
    
    console.log('⚠️ FALLBACK WEAPON CREATED - Professional-looking rifle (Gunmetal + Orange)')
  }

  private createPlayerHands(): void {
    this.playerHands = new THREE.Group()

    // 🔥 V16: VISIBLE hands for FPS-Standard weapons!
    // Left Hand (holding weapon from left)
    const leftHandGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.08) // Größer!
    const handMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac, 
      roughness: 0.7,
      metalness: 0.1
    })
    const leftHand = new THREE.Mesh(leftHandGeometry, handMaterial)
    leftHand.position.set(-0.1, -0.3, -0.15) // Näher zur Kamera!
    leftHand.castShadow = true
    this.playerHands.add(leftHand)

    // Right Hand (holding weapon from right)
    const rightHand = new THREE.Mesh(leftHandGeometry.clone(), handMaterial)
    rightHand.position.set(0.2, -0.3, -0.15) // Näher zur Kamera!
    rightHand.castShadow = true
    this.playerHands.add(rightHand)

    // Forearm (left) - Größer und sichtbarer!
    const forearmGeometry = new THREE.BoxGeometry(0.06, 0.2, 0.06) // Größer!
    const leftForearm = new THREE.Mesh(forearmGeometry, handMaterial)
    leftForearm.position.set(-0.1, -0.15, -0.12)
    leftForearm.rotation.z = 0.15
    this.playerHands.add(leftForearm)

    // Forearm (right) - Größer und sichtbarer!
    const rightForearm = new THREE.Mesh(forearmGeometry.clone(), handMaterial)
    rightForearm.position.set(0.2, -0.15, -0.12)
    rightForearm.rotation.z = -0.15
    this.playerHands.add(rightForearm)

    this.camera.add(this.playerHands)
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.renderer.domElement.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.renderer.domElement.addEventListener('contextmenu', this.handleContextMenu)
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this))
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code)

    if (e.code >= 'Digit1' && e.code <= 'Digit9') {
      const index = parseInt(e.code.replace('Digit', '')) - 1
      if (index < this.weapons.length && index !== this.player.stats.currentWeaponIndex) {
        this.switchWeapon(index)
      }
    }

    if (e.code === 'KeyR') {
      this.reloadWeapon()
    }
  }

  // ============================================================
  // V17 NEW - SWITCH WEAPON (Modular Weapon System)
  // ============================================================
  
  private async switchWeapon(newIndex: number): Promise<void> {
    // Switch weapon via WeaponManager
    const success = await this.weaponManager.switchToIndex(newIndex)
    
    if (!success) {
      console.warn(`⚠️ Failed to switch to weapon index ${newIndex}`)
      return
    }

    // Update player stats (for UI compatibility)
    this.player.stats.currentWeaponIndex = newIndex
    
    // Remove old weapon model
    if (this.weaponModel) {
      this.camera.remove(this.weaponModel)
    }
    
    // Load new weapon model
    await this.loadCurrentWeaponModel()
    
    const weapon = this.weaponManager.getCurrentWeapon()
    console.log(`🔫 Switched to: ${weapon?.getName()}`)
  }

  /* V16 OLD - DISABLED
  private async switchWeapon(newIndex: number): Promise<void> {
    this.player.stats.currentWeaponIndex = newIndex
    
    // Remove old weapon model
    if (this.weaponModel) {
      this.camera.remove(this.weaponModel)
    }
    
    // Load new weapon model
    await this.createWeaponModel()
    
    console.log(`🔫 Switched to: ${this.weapons[newIndex].name}`)
  }
  */

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code)
  }

  private isMouseDown = false

  private handleMouseDown(e: MouseEvent): void {
    if (!this.isPointerLocked) {
      this.renderer.domElement.requestPointerLock()
      return
    }

    if (this.player.stats.isDead) return

    // Left Click (Button 0) = Shoot (Auto-fire)
    if (e.button === 0) {
      this.isMouseDown = true
      this.shoot()
    }

    // Right Click (Button 2) = Toggle ADS
    if (e.button === 2) {
      this.player.stats.isAiming = !this.player.stats.isAiming
      
      if (this.player.stats.isAiming) {
        this.camera.fov = 45 // Zoom in
      } else {
        this.camera.fov = 75 // Zoom out
      }
      this.camera.updateProjectionMatrix()
      
      console.log(`🎯 ADS: ${this.player.stats.isAiming ? 'ON' : 'OFF'}`)
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.isMouseDown = false
    }
  }

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault() // Prevent right-click menu
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPointerLocked || this.player.stats.isDead) return

    this.player.rotation.y -= e.movementX * this.mouse.sensitivity
    this.player.rotation.x -= e.movementY * this.mouse.sensitivity
    this.player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.rotation.x))
  }

  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  // ============================================================
  // GAME LOOP
  // ============================================================

  private startGame(): void {
    this.gameState.isGameActive = true
    this.animate()
    this.startGameTimer()
  }

  private animate = (): void => {
    if (!this.gameState.isGameActive) return

    this.animationId = requestAnimationFrame(this.animate)
    const deltaTime = this.clock.getDelta()

    if (!this.player.stats.isDead) {
      this.updatePlayer(deltaTime)
      
      // Auto-Fire: Shoot while mouse is held down
      if (this.isMouseDown && this.isPointerLocked) {
        this.shoot()
      }
    }

    this.updateEnemies(deltaTime)
    this.updateProjectiles(deltaTime)
    this.updateParticles(deltaTime)
    this.checkCollisions()
    this.spawnEnemiesIfNeeded()
    this.updateWeaponAnimation(deltaTime)

    this.renderer.render(this.scene, this.camera)

    if (this.onStatsUpdate) {
      // V17: Get weapon from WeaponManager
      const weapon = this.weaponManager.getCurrentWeapon()
      const weaponData = weapon?.getData()
      
      this.onStatsUpdate({
        ...this.player.stats,
        ...this.gameState,
        currentWeapon: weaponData ? {
          id: weaponData.id,
          name: weaponData.name,
          type: weaponData.type,
          damage: weaponData.damage,
          fireRate: weaponData.fireRate,
          range: weaponData.range,
          accuracy: weaponData.accuracy,
          recoil: 0, // Legacy field
          magazineSize: weaponData.magazineSize,
          currentAmmo: weapon!.getCurrentAmmo(),
          reserveAmmo: weapon!.getTotalAmmo(),
          reloadTime: weaponData.reloadTime
        } : null
      })
    }
  }

  private startGameTimer(): void {
    setInterval(() => {
      if (this.gameState.isGameActive && !this.gameState.isPaused) {
        this.gameState.roundTime++
      }
    }, 1000)
  }

  private updateWeaponAnimation(deltaTime: number): void {
    if (!this.weaponModel) return

    // V17: Get weapon from WeaponManager
    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon) return

    const weaponData = weapon.getData()

    // ADS Position (Aim Down Sights) - REALISTIC!
    if (this.player.stats.isAiming && !this.player.stats.isDead) {
      // Use ADS position from weapon data
      const adsPos = weaponData.adsPosition
      this.weaponModel.position.set(adsPos.x, adsPos.y, adsPos.z)
      this.weaponModel.rotation.set(0, -Math.PI / 2, 0)
    } else {
      // Hip Fire Position - Use viewmodel position from weapon data
      const hipPos = weaponData.viewmodelPosition
      const hipRot = weaponData.viewmodelRotation || { x: 0, y: -Math.PI / 2, z: 0 }
      
      this.weaponModel.position.set(hipPos.x, hipPos.y, hipPos.z)
      this.weaponModel.rotation.set(hipRot.x, hipRot.y, hipRot.z)
      
      // Weapon Bob while moving
      const isMoving = this.keys.has('KeyW') || this.keys.has('KeyS') || this.keys.has('KeyA') || this.keys.has('KeyD')
      
      if (isMoving && !this.player.stats.isDead) {
        const time = this.clock.getElapsedTime()
        this.weaponModel.position.y += Math.sin(time * 10) * 0.015
        this.weaponModel.position.x += Math.cos(time * 5) * 0.008
      }
    }
  }

  // ============================================================
  // PLAYER UPDATE
  // ============================================================

  private updatePlayer(deltaTime: number): void {
    const moveSpeed = this.player.stats.speed * deltaTime

    const forward = new THREE.Vector3(
      Math.sin(this.player.rotation.y),
      0,
      Math.cos(this.player.rotation.y)
    )
    const right = new THREE.Vector3(
      Math.cos(this.player.rotation.y),
      0,
      -Math.sin(this.player.rotation.y)
    )

    this.player.velocity.set(0, 0, 0)

    if (this.keys.has('KeyW')) this.player.velocity.add(forward.multiplyScalar(-moveSpeed))
    if (this.keys.has('KeyS')) this.player.velocity.add(forward.multiplyScalar(moveSpeed))
    if (this.keys.has('KeyA')) this.player.velocity.add(right.multiplyScalar(-moveSpeed))
    if (this.keys.has('KeyD')) this.player.velocity.add(right.multiplyScalar(moveSpeed))

    this.player.position.add(this.player.velocity)
    this.camera.position.copy(this.player.position)
    this.camera.rotation.copy(this.player.rotation)
  }

  // ============================================================
  // WEAPON SYSTEM
  // ============================================================

  // ============================================================
  // V17 NEW - SHOOT (Modular Weapon System)
  // ============================================================
  
  private shoot(): void {
    if (this.player.stats.isReloading || this.player.stats.isDead) return

    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon) {
      console.warn('⚠️ No weapon equipped')
      return
    }

    if (!weapon.canShoot()) {
      // Auto-reload if out of ammo
      if (weapon.getCurrentAmmo() <= 0) {
        this.reloadWeapon()
      }
      return
    }

    // Get camera position and direction
    const origin = this.camera.position.clone()
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)

    // Weapon shoots itself (handles damage, raycasting internally)
    const result = weapon.shoot(origin, direction)

    if (result && result.success) {
      this.gameState.shotsFired++

      // Create visual projectile (for now, until we have bullet tracers)
      this.createProjectile()
      this.createMuzzleFlash()

      // Apply recoil to camera
      const weaponData = weapon.getData()
      this.player.rotation.x += weaponData.recoilVertical * 0.01 * (Math.random() - 0.5)
      this.player.rotation.y += weaponData.recoilHorizontal * 0.01 * (Math.random() - 0.5)

      // Weapon Kickback Animation
      if (this.weaponModel) {
        const kickbackAmount = 0.08
        this.weaponModel.position.z += kickbackAmount
        
        setTimeout(() => {
          if (this.weaponModel) {
            // Reset to weapon's viewmodel position
            const pos = weapon.getData().viewmodelPosition
            this.weaponModel.position.z = pos.z
          }
        }, 80)
      }
    }
  }

  /* V16 OLD - DISABLED
  private shoot(): void {
    if (this.player.stats.isReloading || this.player.stats.isDead) return

    const weapon = this.weapons[this.player.stats.currentWeaponIndex]
    if (!weapon || weapon.currentAmmo <= 0) {
      this.reloadWeapon()
      return
    }

    const now = Date.now()
    const fireInterval = 60000 / weapon.fireRate

    if (now - this.lastShotTime < fireInterval) return

    this.lastShotTime = now
    weapon.currentAmmo--
    this.gameState.shotsFired++

    this.createProjectile()
    this.createMuzzleFlash()

    // Recoil
    this.player.rotation.x += weapon.recoil * (Math.random() - 0.5)
    this.player.rotation.y += weapon.recoil * (Math.random() - 0.5) * 0.5

    // Weapon Kickback Animation
    if (this.weaponModel) {
      const kickbackAmount = 0.08
      this.weaponModel.position.z += kickbackAmount
      
      setTimeout(() => {
        // 🔥 V16: Reset to FPS-Standard weapon positions!
        if (this.weaponModel) {
          const currentWeapon = this.weapons[this.player.stats.currentWeaponIndex]
          if (currentWeapon.id === 'glxy_awp') {
            this.weaponModel.position.z = -0.2 // AWP FPS-Standard!
          } else if (currentWeapon.id === 'glxy_desert_eagle') {
            this.weaponModel.position.z = -0.2 // Deagle FPS-Standard!
          } else {
            this.weaponModel.position.z = -0.18 // M4A1 FPS-Standard!
          }
        }
      }, 80)
    }
  }
  */

  private createProjectile(): void {
    // V17: Get weapon from WeaponManager
    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon) return

    const weaponData = weapon.getData()

    const geometry = new THREE.SphereGeometry(0.05, 8, 8)
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00, emissive: 0xffff00 })
    const mesh = new THREE.Mesh(geometry, material)
    
    // Start from camera position (eye level)
    mesh.position.copy(this.camera.position)

    // Get camera's forward direction
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)
    
    // Add accuracy spread (V17: Use weaponData)
    const spread = (1 - weaponData.accuracy / 100) * 0.05
    if (spread > 0) {
      direction.x += (Math.random() - 0.5) * spread
      direction.y += (Math.random() - 0.5) * spread
      direction.z += (Math.random() - 0.5) * spread
      direction.normalize()
    }

    const projectile: UltimateProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      mesh,
      direction,
      speed: 150, // Faster projectiles
      damage: weaponData.damage,
      range: weaponData.range,
      distanceTraveled: 0,
      isPlayerProjectile: true,
      trailMeshes: []
    }

    this.projectiles.push(projectile)
    this.scene.add(mesh)
    
    console.log(`💥 Projectile created at`, mesh.position, `direction:`, direction)
  }

  private createMuzzleFlash(): void {
    if (!this.muzzleFlash) return
    this.muzzleFlash.intensity = 5
    setTimeout(() => {
      if (this.muzzleFlash) this.muzzleFlash.intensity = 0
    }, 50)
  }

  // ============================================================
  // V17 NEW - RELOAD (Modular Weapon System)
  // ============================================================
  
  private async reloadWeapon(): Promise<void> {
    if (this.player.stats.isReloading || this.player.stats.isDead) return

    const weapon = this.weaponManager.getCurrentWeapon()
    if (!weapon || !weapon.canReload()) return

    this.player.stats.isReloading = true
    console.log(`🔄 Reloading ${weapon.getName()}...`)

    // Weapon handles reload internally (ammo transfer, timing)
    await weapon.reload()

    this.player.stats.isReloading = false
    console.log(`✅ ${weapon.getName()} reloaded!`)
  }

  /* V16 OLD - DISABLED
  private reloadWeapon(): void {
    if (this.player.stats.isReloading || this.player.stats.isDead) return

    const weapon = this.weapons[this.player.stats.currentWeaponIndex]
    if (!weapon || weapon.reserveAmmo <= 0 || weapon.currentAmmo === weapon.magazineSize) return

    this.player.stats.isReloading = true

    setTimeout(() => {
      const ammoNeeded = weapon.magazineSize - weapon.currentAmmo
      const ammoToAdd = Math.min(ammoNeeded, weapon.reserveAmmo)
      weapon.currentAmmo += ammoToAdd
      weapon.reserveAmmo -= ammoToAdd
      this.player.stats.isReloading = false
    }, weapon.reloadTime * 1000)
  }
  */

  // ============================================================
  // ENEMY SYSTEM (IMPROVED MODELS - FIX #4)
  // ============================================================

  private spawnEnemiesIfNeeded(): void {
    if (this.enemies.filter(e => e.isAlive).length < this.maxEnemies) {
      if (Math.random() < 0.01) {
        this.spawnEnemy()
      }
    }
  }

  private async spawnEnemy(): Promise<void> {
    // PROFESSIONAL: 6 diverse enemy types!
    const enemyTypes = [
      { path: '/models/characters/terrorist.glb', color: 0xff3333, name: 'Terrorist', hp: 100, speed: 3 },
      { path: '/models/characters/police.glb', color: 0x3333ff, name: 'Police', hp: 80, speed: 4 },
      { path: '/models/characters/military.glb', color: 0x33ff33, name: 'Military', hp: 150, speed: 2.5 },
      { path: '/models/characters/soldier.glb', color: 0x8b4513, name: 'Soldier', hp: 100, speed: 3 },
      { path: '/models/characters/zombie.glb', color: 0x9933ff, name: 'Zombie', hp: 50, speed: 2 },
    ]
    
    // Select random enemy type
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
    const modelPath = enemyType.path
    
    try {
      // Check cache first
      let enemyGroup: THREE.Group
      if (this.modelCache.has(modelPath)) {
        enemyGroup = this.modelCache.get(modelPath)!.clone()
        console.log(`✅ Enemy model loaded from cache: ${modelPath}`)
      } else {
        const gltf = await this.gltfLoader.loadAsync(modelPath)
        enemyGroup = gltf.scene
        this.modelCache.set(modelPath, gltf.scene.clone())
        console.log(`✅ Enemy model loaded & cached: ${modelPath}`)
      }

      // 🔥 FIX: Scale to REALISTIC size (viel kleiner!)
      enemyGroup.scale.set(0.08, 0.08, 0.08) // Noch kleiner für realistische Größe!
      
      // 🔥 FIX: Debug - zeige alle Meshes im Modell
      console.log(`🔍 Analyzing ${enemyType.name} model structure:`)
      let meshCount = 0
      enemyGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshCount++
          const mesh = child as THREE.Mesh
          const bbox = new THREE.Box3().setFromObject(mesh)
          const size = new THREE.Vector3()
          bbox.getSize(size)
          console.log(`  Mesh ${meshCount}: Size = (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`)
          
          // 🔥 FIX: Verstecke sehr große Meshes (wahrscheinlich Container)
          // Wenn ein Mesh viel größer ist als die anderen, ist es wahrscheinlich ein unsichtbarer Container
          const maxDimension = Math.max(size.x, size.y, size.z)
          if (maxDimension > 5) {
            console.log(`  ❌ Hiding large container mesh (size: ${maxDimension.toFixed(2)})`)
            mesh.visible = false
            return
          }
        }
      })
      console.log(`  Total meshes: ${meshCount}`)
      
      // FIX MATERIALS: Apply COLORED enemy materials based on type
      enemyGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.visible) { // Nur sichtbare Meshes
          child.castShadow = true
          child.receiveShadow = true
          
          // Use enemy type color
          const enemyMaterial = new THREE.MeshStandardMaterial({
            color: enemyType.color,
            metalness: 0.3,
            roughness: 0.7,
            emissive: enemyType.color,
            emissiveIntensity: 0.1,
            side: THREE.DoubleSide
          })
          
          ;(child as THREE.Mesh).material = enemyMaterial
        }
      })
      
      console.log(`✅ Enemy spawned: ${enemyType.name} (HP: ${enemyType.hp}, Speed: ${enemyType.speed})`)

      // 🔥 FIX V16: Berechne korrekte Y-Position basierend auf Bounding Box!
      // Problem: Modelle haben unterschiedliche Pivot-Points (manche am Kopf, manche am Fuß)
      const bbox = new THREE.Box3().setFromObject(enemyGroup)
      const modelHeight = bbox.max.y - bbox.min.y
      const pivotOffset = -bbox.min.y // Offset von Pivot zum Boden
      
      console.log(`📏 Model: Height=${modelHeight.toFixed(2)}, PivotOffset=${pivotOffset.toFixed(2)}`)
      
      const angle = Math.random() * Math.PI * 2
      const distance = 20 + Math.random() * 30
      enemyGroup.position.set(
        this.player.position.x + Math.cos(angle) * distance,
        pivotOffset, // 🔥 FIX: Korrigiere Pivot-Offset!
        this.player.position.z + Math.sin(angle) * distance
      )
      
      console.log(`✅ Enemy placed on ground (y=${pivotOffset.toFixed(2)})`)

      // Face the player
      const dirToPlayer = new THREE.Vector3().subVectors(this.player.position, enemyGroup.position)
      enemyGroup.rotation.y = Math.atan2(dirToPlayer.x, dirToPlayer.z)

      const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5)

      const enemy: UltimateEnemy = {
        id: `enemy_${Date.now()}_${Math.random()}`,
        mesh: enemyGroup,
        position: enemyGroup.position.clone(),
        velocity: new THREE.Vector3(),
        health: enemyType.hp,
        maxHealth: enemyType.hp,
        speed: enemyType.speed,
        damage: 10 + (enemyType.hp / 10), // Stronger enemies = more damage
        lastShot: 0,
        isAlive: true,
        color: new THREE.Color(enemyType.color),
        targetPlayer: true
      }

      this.enemies.push(enemy)
      this.scene.add(enemyGroup)
      console.log(`✅ Enemy spawned: ${modelPath}`)
    } catch (error) {
      console.error(`❌ Failed to load enemy model:`, error)
      // Fallback to simple geometry
      this.spawnFallbackEnemy()
    }
  }

  private spawnFallbackEnemy(): void {
    // Fallback simple enemy if model fails
    const enemyGroup = new THREE.Group()
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.6, 0.4)
    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.8
    body.castShadow = true
    enemyGroup.add(body)

    const angle = Math.random() * Math.PI * 2
    const distance = 20 + Math.random() * 30
    enemyGroup.position.set(
      this.player.position.x + Math.cos(angle) * distance,
      0,
      this.player.position.z + Math.sin(angle) * distance
    )

    const enemy: UltimateEnemy = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      mesh: enemyGroup,
      position: enemyGroup.position.clone(),
      velocity: new THREE.Vector3(),
      health: enemyType.hp,
      maxHealth: enemyType.hp,
      speed: enemyType.speed,
      damage: 10 + (enemyType.hp / 10),
      lastShot: 0,
      isAlive: true,
      color: new THREE.Color(enemyType.color),
      targetPlayer: true
    }

    this.enemies.push(enemy)
    this.scene.add(enemyGroup)
  }

  private updateEnemies(deltaTime: number): void {
    this.enemies.forEach(enemy => {
      if (!enemy.isAlive) return

      // Calculate direction from mesh position (more accurate)
      const direction = new THREE.Vector3()
        .subVectors(this.player.position, enemy.mesh.position)
        .normalize()

      enemy.velocity.copy(direction).multiplyScalar(enemy.speed * deltaTime)
      enemy.mesh.position.add(enemy.velocity)
      
      // Rotate to face player (only Y axis for standing upright)
      const lookAtPos = this.player.position.clone()
      lookAtPos.y = enemy.mesh.position.y // Keep level
      enemy.mesh.lookAt(lookAtPos)
      
      // Sync position reference
      enemy.position.copy(enemy.mesh.position)

      // Shoot at player
      const distanceToPlayer = enemy.position.distanceTo(this.player.position)
      if (distanceToPlayer < 20 && Date.now() - enemy.lastShot > 2000 && !this.player.stats.isDead) {
        this.enemyShoot(enemy)
        enemy.lastShot = Date.now()
      }
    })
  }

  private enemyShoot(enemy: UltimateEnemy): void {
    const geometry = new THREE.SphereGeometry(0.03, 6, 6)
    const material = new THREE.MeshBasicMaterial({ color: enemy.color })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(enemy.position)

    const direction = new THREE.Vector3()
      .subVectors(this.player.position, enemy.position)
      .normalize()

    const projectile: UltimateProjectile = {
      id: `enemy_proj_${Date.now()}_${Math.random()}`,
      mesh,
      direction,
      speed: 20,
      damage: enemy.damage,
      range: 50,
      distanceTraveled: 0,
      isPlayerProjectile: false,
      trailMeshes: []
    }

    this.projectiles.push(projectile)
    this.scene.add(mesh)
  }

  // ============================================================
  // PROJECTILE UPDATE
  // ============================================================

  private updateProjectiles(deltaTime: number): void {
    this.projectiles.forEach((projectile, index) => {
      const distance = projectile.speed * deltaTime
      projectile.mesh.position.add(projectile.direction.clone().multiplyScalar(distance))
      projectile.distanceTraveled += distance

      if (projectile.distanceTraveled > projectile.range) {
        this.scene.remove(projectile.mesh)
        this.projectiles.splice(index, 1)
      }
    })
  }

  // ============================================================
  // COLLISION DETECTION (FIX #3 - DEATH LOGIC)
  // ============================================================

  private checkCollisions(): void {
    // Projectile vs Enemy
    this.projectiles.forEach((projectile, pIndex) => {
      if (!projectile.isPlayerProjectile) return

      this.enemies.forEach((enemy, eIndex) => {
        if (!enemy.isAlive) return

        // 🔥 FIX: Berechne die tatsächliche Mesh-Position (nicht nur Container)
        let enemyWorldPos = new THREE.Vector3()
        
        // Finde das erste sichtbare Mesh im Enemy
        let foundMesh = false
        enemy.mesh.traverse((child) => {
          if (!foundMesh && (child as THREE.Mesh).isMesh) {
            child.getWorldPosition(enemyWorldPos)
            foundMesh = true
          }
        })
        
        // Fallback zur Container-Position wenn kein Mesh gefunden
        if (!foundMesh) {
          enemyWorldPos = enemy.position
        }
        
        const distance = projectile.mesh.position.distanceTo(enemyWorldPos)
        if (distance < 0.6) { // 🔥 FIX: Kleinerer Radius wegen kleinerer Models
          enemy.health -= projectile.damage
          this.gameState.shotsHit++
          this.gameState.damageDealt += projectile.damage

          this.createBloodEffect(enemyWorldPos.clone())
          this.scene.remove(projectile.mesh)
          this.projectiles.splice(pIndex, 1)

          if (enemy.health <= 0) {
            this.killEnemy(enemy, eIndex)
          }
        }
      })
    })

    // Enemy Projectile vs Player
    this.projectiles.forEach((projectile, index) => {
      if (projectile.isPlayerProjectile || this.player.stats.isDead || this.player.stats.isInvincible) return // 🛡️ Spawnschutz!

      const distance = projectile.mesh.position.distanceTo(this.player.position)
      if (distance < 0.5) {
        this.player.stats.health -= projectile.damage
        this.gameState.damageTaken += projectile.damage

        // CLAMP HEALTH (FIX #3)
        this.player.stats.health = Math.max(0, this.player.stats.health)

        this.scene.remove(projectile.mesh)
        this.projectiles.splice(index, 1)

        // CHECK DEATH (FIX #3)
        if (this.player.stats.health <= 0 && !this.player.stats.isDead) {
          this.handlePlayerDeath()
        }
      }
    })
  }

  private killEnemy(enemy: UltimateEnemy, index: number): void {
    enemy.isAlive = false
    this.scene.remove(enemy.mesh)
    this.enemies.splice(index, 1)

    this.gameState.kills++
    this.gameState.currentStreak++
    this.gameState.score += 100

    if (this.gameState.currentStreak > this.gameState.longestStreak) {
      this.gameState.longestStreak = this.gameState.currentStreak
    }

    if (this.gameState.shotsFired > 0) {
      this.gameState.accuracy = (this.gameState.shotsHit / this.gameState.shotsFired) * 100
    }

    this.createExplosionEffect(enemy.position.clone())
  }

  private handlePlayerDeath(): void {
    this.player.stats.isDead = true
    this.gameState.deaths++
    this.gameState.currentStreak = 0

    console.log('💀 Player died! Respawning in 3 seconds...')

    // Respawn after 3 seconds
    setTimeout(() => {
      // Reset Player Stats
      this.player.stats.health = this.player.stats.maxHealth
      this.player.stats.armor = this.player.stats.maxArmor
      this.player.stats.isDead = false
      this.player.stats.isAiming = false
      this.player.stats.isReloading = false
      this.player.stats.isInvincible = true // 🛡️ SPAWNSCHUTZ AKTIVIERT!
      
      // Reset Camera FOV (if was ADS)
      this.camera.fov = 75
      this.camera.updateProjectionMatrix()
      
      // Respawn at CONSISTENT Spawn Point (FEST!)
      this.player.position.set(0, 1.6, 10) // Mitte, Augenhöhe, weiter hinten
      this.player.rotation.set(0, 0, 0) // Blick nach vorne
      this.player.velocity.set(0, 0, 0) // Bewegung stoppen
      
      // Spawnschutz nach 3 Sekunden entfernen
      setTimeout(() => {
        this.player.stats.isInvincible = false
        console.log('🛡️ Spawnschutz deaktiviert!')
      }, 3000)
      
      // Update camera immediately
      this.camera.position.copy(this.player.position)
      this.camera.rotation.copy(this.player.rotation)
      
      // V17: Refill ALL Weapons via WeaponManager
      const allWeapons = this.weaponManager.getAllWeapons()
      allWeapons.forEach(weapon => {
        weapon.refillAmmo()
      })
      
      // Reset to first weapon
      this.player.stats.currentWeaponIndex = 0
      this.weaponManager.switchToIndex(0)
      
      console.log('✅ Player respawned with full ammo!')
    }, 3000)
  }

  // ============================================================
  // PARTICLE EFFECTS
  // ============================================================

  private createBloodEffect(position: THREE.Vector3): void {
    for (let i = 0; i < 10; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 6, 6)
      const material = new THREE.MeshBasicMaterial({ color: 0x8b0000 })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)

      const particle: UltimateParticle = {
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ),
        life: 1,
        maxLife: 1
      }

      this.particles.push(particle)
      this.scene.add(mesh)
    }
  }

  private createExplosionEffect(position: THREE.Vector3): void {
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8)
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5)
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)

      const particle: UltimateParticle = {
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 5,
          (Math.random() - 0.5) * 5
        ),
        life: 1.5,
        maxLife: 1.5
      }

      this.particles.push(particle)
      this.scene.add(mesh)
    }
  }

  private updateParticles(deltaTime: number): void {
    this.particles.forEach((particle, index) => {
      particle.life -= deltaTime
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))
      particle.velocity.y -= 9.8 * deltaTime

      const opacity = particle.life / particle.maxLife
      if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
        particle.mesh.material.opacity = opacity
        particle.mesh.material.transparent = true
      }

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        this.particles.splice(index, 1)
      }
    })
  }

  // ============================================================
  // GAME MODE INTEGRATION (V12)
  // ============================================================

  /**
   * Reset game for new mode
   * 
   * @param mode - New game mode
   * @remarks
   * NACHDENKEN: Was muss beim Mode-Wechsel resettet werden?
   * - Player position & health
   * - Enemies
   * - Projectiles
   * - Game stats
   */
  private resetForNewMode(mode: GameMode): void {
    // PROFESSIONELL: Get config for new mode
    const config = this.gameModeManager.getModeConfig(mode)
    
    // INTELLIGENT: Reset player based on mode config
    this.player.position.set(0, 1.6, 10)
    this.player.stats.health = config.startingHealth
    this.player.stats.maxHealth = config.startingHealth
    this.player.stats.armor = config.startingArmor
    this.player.stats.isDead = false
    this.player.stats.isInvincible = false
    
    // KORREKT: Clear enemies
    this.enemies.forEach(enemy => {
      if (enemy.mesh) {
        this.scene.remove(enemy.mesh)
      }
    })
    this.enemies = []
    
    // LOGISCH: Clear projectiles
    this.projectiles.forEach(proj => {
      if (proj.mesh) {
        this.scene.remove(proj.mesh)
      }
      proj.trailMeshes.forEach(trail => this.scene.remove(trail))
    })
    this.projectiles = []
    
    // RICHTIG: Reset game state
    this.gameState.wave = 1
    this.gameState.kills = 0
    this.gameState.deaths = 0
    this.gameState.score = 0
    this.gameState.currentStreak = 0
    
    console.log(`🎯 Game reset for mode: ${mode}`)
  }

  /**
   * Get current game mode
   * 
   * @returns Current game mode
   * @remarks
   * PROFESSIONELL: Public API für React Component
   */
  public getCurrentMode(): GameMode {
    return this.gameModeManager.currentMode
  }

  /**
   * Change game mode
   * 
   * @param mode - New game mode
   * @remarks
   * INTELLIGENT: Public API für UI
   */
  public changeGameMode(mode: GameMode): void {
    this.gameModeManager.changeMode(mode)
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  public destroy(): void {
    this.gameState.isGameActive = false
    if (this.animationId) cancelAnimationFrame(this.animationId)

    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    window.removeEventListener('resize', this.handleResize.bind(this))

    // 🎯 PROFESSIONELL: Cleanup Game Mode Manager
    if (this.gameModeManager) {
      this.gameModeManager.destroy()
    }

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })

    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}

