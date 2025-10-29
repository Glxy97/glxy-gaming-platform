// @ts-nocheck
'use client'

import * as THREE from 'three'

/**
 * 🎮 GLXY ULTIMATE FPS ENGINE
 * 
 * Die perfekte Kombination aus allen besten FPS-Features:
 * - GLXYFPSCore: Solide Three.js Basis
 * - FPSGameEnhanced: Professionelles UI/UX
 * - TacticalFPSGame: Klassen-System
 * - GLXYWeapons: Umfangreiches Waffen-Arsenal
 * - GLXYVisualEffects: Cinematic Effects
 * - GLXYProgressionSystem: Süchtig machende Progression
 * 
 * ZIEL: Das süchtig machendste Browser-FPS aller Zeiten!
 */

// ============================================================
// INTERFACES & TYPES
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
  mesh: THREE.Mesh
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
}

// ============================================================
// ULTIMATE FPS ENGINE CLASS
// ============================================================

export class UltimateFPSEngine {
  // Scene & Rendering
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private clock: THREE.Clock

  // Player
  private player: {
    position: THREE.Vector3
    rotation: THREE.Euler
    velocity: THREE.Vector3
    stats: UltimatePlayerStats
  }

  // Weapons
  private weapons: UltimateWeapon[]
  private projectiles: UltimateProjectile[] = []
  private lastShotTime: number = 0

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
        isAiming: false
      }
    }

    // Initialize Weapons (Best from GLXYWeapons)
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

    // Initialize Scene
    this.init()
    this.setupEventListeners()
    this.startGame()
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  private init(): void {
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

    // Lighting
    this.createLighting()

    // Environment
    this.createEnvironment()

    // Muzzle Flash Light
    this.muzzleFlash = new THREE.PointLight(0xffa500, 0, 10)
    this.scene.add(this.muzzleFlash)
  }

  private createLighting(): void {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0x404040, 0.8)
    this.scene.add(ambient)

    // Directional Light (Sun)
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

    // Hemisphere Light
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

    // Create Cover Objects
    this.createObstacles()

    // Skybox
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
  // EVENT LISTENERS
  // ============================================================

  private setupEventListeners(): void {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))

    // Mouse
    this.renderer.domElement.addEventListener('click', this.handleClick.bind(this))
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this))
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))

    // Window Resize
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code)

    // Weapon Switching
    if (e.code >= 'Digit1' && e.code <= 'Digit9') {
      const index = parseInt(e.code.replace('Digit', '')) - 1
      if (index < this.weapons.length) {
        this.player.stats.currentWeaponIndex = index
      }
    }

    // Reload
    if (e.code === 'KeyR') {
      this.reloadWeapon()
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code)
  }

  private handleClick(): void {
    if (!this.isPointerLocked) {
      this.renderer.domElement.requestPointerLock()
    } else {
      this.shoot()
    }
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPointerLocked) return

    this.player.rotation.y -= e.movementX * this.mouse.sensitivity
    this.player.rotation.x -= e.movementY * this.mouse.sensitivity

    // Clamp vertical rotation
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

    this.updatePlayer(deltaTime)
    this.updateEnemies(deltaTime)
    this.updateProjectiles(deltaTime)
    this.updateParticles(deltaTime)
    this.checkCollisions()
    this.spawnEnemiesIfNeeded()

    this.renderer.render(this.scene, this.camera)

    // Update Stats Callback
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        ...this.player.stats,
        ...this.gameState,
        currentWeapon: this.weapons[this.player.stats.currentWeaponIndex]
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

  // ============================================================
  // PLAYER UPDATE
  // ============================================================

  private updatePlayer(deltaTime: number): void {
    const moveSpeed = this.player.stats.speed * deltaTime

    // Movement
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

    // Update Camera
    this.camera.position.copy(this.player.position)
    this.camera.rotation.copy(this.player.rotation)
  }

  // ============================================================
  // WEAPON SYSTEM
  // ============================================================

  private shoot(): void {
    if (this.player.stats.isReloading) return

    const weapon = this.weapons[this.player.stats.currentWeaponIndex]
    if (!weapon || weapon.currentAmmo <= 0) {
      // Auto-reload if empty
      this.reloadWeapon()
      return
    }

    const now = Date.now()
    const fireInterval = 60000 / weapon.fireRate // Convert RPM to ms

    if (now - this.lastShotTime < fireInterval) return

    this.lastShotTime = now
    weapon.currentAmmo--
    this.gameState.shotsFired++

    // Create Projectile
    this.createProjectile()

    // Muzzle Flash
    this.createMuzzleFlash()

    // Recoil Effect (Camera Shake)
    this.player.rotation.x += weapon.recoil * (Math.random() - 0.5)
    this.player.rotation.y += weapon.recoil * (Math.random() - 0.5) * 0.5
  }

  private createProjectile(): void {
    const weapon = this.weapons[this.player.stats.currentWeaponIndex]

    // Projectile Mesh
    const geometry = new THREE.SphereGeometry(0.05, 8, 8)
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.copy(this.player.position)

    // Direction with accuracy spread
    const spread = (1 - weapon.accuracy / 100) * 0.1
    const direction = new THREE.Vector3(
      Math.sin(this.player.rotation.y) + (Math.random() - 0.5) * spread,
      -Math.tan(this.player.rotation.x) + (Math.random() - 0.5) * spread,
      Math.cos(this.player.rotation.y) + (Math.random() - 0.5) * spread
    ).normalize()

    const projectile: UltimateProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      mesh,
      direction,
      speed: 100,
      damage: weapon.damage,
      range: weapon.range,
      distanceTraveled: 0,
      isPlayerProjectile: true,
      trailMeshes: []
    }

    this.projectiles.push(projectile)
    this.scene.add(mesh)
  }

  private createMuzzleFlash(): void {
    if (!this.muzzleFlash) return

    this.muzzleFlash.position.copy(this.player.position)
    this.muzzleFlash.intensity = 5

    setTimeout(() => {
      if (this.muzzleFlash) {
        this.muzzleFlash.intensity = 0
      }
    }, 50)
  }

  private reloadWeapon(): void {
    if (this.player.stats.isReloading) return

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

  // ============================================================
  // ENEMY SYSTEM
  // ============================================================

  private spawnEnemiesIfNeeded(): void {
    if (this.enemies.filter(e => e.isAlive).length < this.maxEnemies) {
      if (Math.random() < 0.01) { // 1% chance per frame
        this.spawnEnemy()
      }
    }
  }

  private spawnEnemy(): void {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16)
    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
    const mesh = new THREE.Mesh(geometry, material)

    // Random spawn position (far from player)
    const angle = Math.random() * Math.PI * 2
    const distance = 20 + Math.random() * 30
    mesh.position.set(
      this.player.position.x + Math.cos(angle) * distance,
      0.5,
      this.player.position.z + Math.sin(angle) * distance
    )

    mesh.castShadow = true

    const enemy: UltimateEnemy = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      mesh,
      position: mesh.position.clone(),
      velocity: new THREE.Vector3(),
      health: 100,
      maxHealth: 100,
      speed: 1 + Math.random() * 2,
      damage: 10,
      lastShot: 0,
      isAlive: true,
      color,
      targetPlayer: true
    }

    this.enemies.push(enemy)
    this.scene.add(mesh)
  }

  private updateEnemies(deltaTime: number): void {
    this.enemies.forEach(enemy => {
      if (!enemy.isAlive) return

      // Move towards player
      const direction = new THREE.Vector3()
        .subVectors(this.player.position, enemy.position)
        .normalize()

      enemy.velocity.copy(direction).multiplyScalar(enemy.speed * deltaTime)
      enemy.position.add(enemy.velocity)
      enemy.mesh.position.copy(enemy.position)

      // Shoot at player (if close enough)
      const distanceToPlayer = enemy.position.distanceTo(this.player.position)
      if (distanceToPlayer < 20 && Date.now() - enemy.lastShot > 2000) {
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

      // Remove if out of range
      if (projectile.distanceTraveled > projectile.range) {
        this.scene.remove(projectile.mesh)
        this.projectiles.splice(index, 1)
      }
    })
  }

  // ============================================================
  // COLLISION DETECTION
  // ============================================================

  private checkCollisions(): void {
    // Projectile vs Enemy
    this.projectiles.forEach((projectile, pIndex) => {
      if (!projectile.isPlayerProjectile) return

      this.enemies.forEach((enemy, eIndex) => {
        if (!enemy.isAlive) return

        const distance = projectile.mesh.position.distanceTo(enemy.position)
        if (distance < 0.5) {
          // Hit!
          enemy.health -= projectile.damage
          this.gameState.shotsHit++
          this.gameState.damageDealt += projectile.damage

          // Blood Effect
          this.createBloodEffect(enemy.position.clone())

          // Remove projectile
          this.scene.remove(projectile.mesh)
          this.projectiles.splice(pIndex, 1)

          // Kill enemy if dead
          if (enemy.health <= 0) {
            this.killEnemy(enemy, eIndex)
          }
        }
      })
    })

    // Enemy Projectile vs Player
    this.projectiles.forEach((projectile, index) => {
      if (projectile.isPlayerProjectile) return

      const distance = projectile.mesh.position.distanceTo(this.player.position)
      if (distance < 0.5) {
        // Player hit!
        this.player.stats.health -= projectile.damage
        this.gameState.damageTaken += projectile.damage

        // Remove projectile
        this.scene.remove(projectile.mesh)
        this.projectiles.splice(index, 1)

        // Check player death
        if (this.player.stats.health <= 0) {
          this.handlePlayerDeath()
        }
      }
    })
  }

  private killEnemy(enemy: UltimateEnemy, index: number): void {
    enemy.isAlive = false
    this.scene.remove(enemy.mesh)
    this.enemies.splice(index, 1)

    // Update Stats
    this.gameState.kills++
    this.gameState.currentStreak++
    this.gameState.score += 100

    if (this.gameState.currentStreak > this.gameState.longestStreak) {
      this.gameState.longestStreak = this.gameState.currentStreak
    }

    // Calculate Accuracy
    if (this.gameState.shotsFired > 0) {
      this.gameState.accuracy = (this.gameState.shotsHit / this.gameState.shotsFired) * 100
    }

    // Explosion Effect
    this.createExplosionEffect(enemy.position.clone())
  }

  private handlePlayerDeath(): void {
    this.gameState.deaths++
    this.gameState.currentStreak = 0

    // Respawn after 3 seconds
    setTimeout(() => {
      this.player.stats.health = this.player.stats.maxHealth
      this.player.position.set(0, 1.6, 5)
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
      
      // Gravity
      particle.velocity.y -= 9.8 * deltaTime

      // Fade out
      const opacity = particle.life / particle.maxLife
      if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
        particle.mesh.material.opacity = opacity
        particle.mesh.material.transparent = true
      }

      // Remove if dead
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        this.particles.splice(index, 1)
      }
    })
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  public destroy(): void {
    this.gameState.isGameActive = false

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    window.removeEventListener('resize', this.handleResize.bind(this))

    // Dispose Three.js objects
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

