// @ts-nocheck
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

// Object Pool für Projektile
class ProjectilePool {
  private pool: THREE.Mesh[] = []
  private activeProjectiles = new Map<THREE.Mesh, Projectile>()
  private scene: THREE.Scene
  private maxPoolSize = 100

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initializePool()
  }

  private initializePool() {
    const geometry = new THREE.SphereGeometry(0.1)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    })

    for (let i = 0; i < this.maxPoolSize; i++) {
      const projectile = new THREE.Mesh(geometry, material.clone())
      projectile.visible = false
      this.pool.push(projectile)
    }
  }

  getProjectile(): THREE.Mesh | null {
    const projectile = this.pool.pop()
    if (projectile) {
      projectile.visible = true
      this.scene.add(projectile)
      return projectile
    }
    return null
  }

  releaseProjectile(projectile: THREE.Mesh) {
    projectile.visible = false
    this.scene.remove(projectile)
    this.activeProjectiles.delete(projectile)
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(projectile)
    }
  }

  setProjectileData(mesh: THREE.Mesh, data: Projectile) {
    this.activeProjectiles.set(mesh, data)
  }

  getProjectileData(mesh: THREE.Mesh): Projectile | undefined {
    return this.activeProjectiles.get(mesh)
  }
}

// Projectile interface
interface Projectile {
  mesh: THREE.Mesh
  direction: THREE.Vector3
  speed: number
  damage: number
  isPlayerProjectile: boolean
  boundingBox?: THREE.Box3
}

// Enemy interface
interface Enemy {
  mesh: THREE.Mesh
  position: THREE.Vector3
  health: number
  maxHealth: number
  speed: number
  lastShot: number
  isAlive: boolean
  color: THREE.Color
  boundingBox: THREE.Box3
}

// Spatial Hashing für effiziente Kollisionserkennung
class SpatialHash {
  private cellSize: number
  private grid: Map<string, Set<any>> = new Map()

  constructor(cellSize: number = 10) {
    this.cellSize = cellSize
  }

  private getKey(x: number, z: number): string {
    const cx = Math.floor(x / this.cellSize)
    const cz = Math.floor(z / this.cellSize)
    return `${cx},${cz}`
  }

  insert(obj: any, position: THREE.Vector3) {
    const key = this.getKey(position.x, position.z)
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set())
    }
    this.grid.get(key)!.add(obj)
  }

  remove(obj: any, position: THREE.Vector3) {
    const key = this.getKey(position.x, position.z)
    const cell = this.grid.get(key)
    if (cell) {
      cell.delete(obj)
      if (cell.size === 0) {
        this.grid.delete(key)
      }
    }
  }

  getNearby(position: THREE.Vector3, radius: number): any[] {
    const nearby: any[] = []
    const minX = position.x - radius
    const maxX = position.x + radius
    const minZ = position.z - radius
    const maxZ = position.z + radius

    for (let x = minX; x <= maxX; x += this.cellSize) {
      for (let z = minZ; z <= maxZ; z += this.cellSize) {
        const key = this.getKey(x, z)
        const cell = this.grid.get(key)
        if (cell) {
          nearby.push(...cell)
        }
      }
    }
    return nearby
  }

  clear() {
    this.grid.clear()
  }
}

// Spawn Zones für randomisierte Enemy-Spawns
interface SpawnZone {
  center: THREE.Vector3
  radius: number
  minDistance: number
}

// GLXY FPS Core Engine - Optimierte Version
export class GLXYFPSCore {
  private container!: HTMLElement
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private clock!: THREE.Clock
  
  // Object Pooling
  private projectilePool!: ProjectilePool
  
  // Spatial Hashing
  private spatialHash!: SpatialHash
  
  // Spawn Zones
  private spawnZones: SpawnZone[] = []
  
  // Player
  private player: {
    position: THREE.Vector3
    rotation: THREE.Euler
    velocity: THREE.Vector3
    health: number
    armor: number
    isAlive: boolean
    currentWeapon: number
    ammo: { [key: number]: number }
    boundingBox: THREE.Box3
  }

  // Input
  private keys: Set<string> = new Set()
  private mouse = { x: 0, y: 0, locked: false }
  private isPointerLocked = false

  // Weapons
  private weapons = [
    { name: 'GLXY M4A1', damage: 35, fireRate: 750, maxAmmo: 30, range: 100 },
    { name: 'GLXY Quantum Rifle', damage: 50, fireRate: 900, maxAmmo: 40, range: 80 },
    { name: 'GLXY Sniper Elite', damage: 120, fireRate: 30, maxAmmo: 5, range: 200 },
    { name: 'GLXY Desert Eagle', damage: 65, fireRate: 180, maxAmmo: 12, range: 60 },
    { name: 'GLXY Heavy Machine Gun', damage: 80, fireRate: 600, maxAmmo: 100, range: 120 }
  ]

  // Enemies
  private enemies: Enemy[] = []

  // Projectiles (verwenden jetzt Pool)
  private activeProjectiles: Projectile[] = []
  
  // Performance
  private maxDeltaTime = 0.1 // Max 100ms pro Frame

  // Game state
  private gameState = {
    score: 0,
    kills: 0,
    deaths: 0,
    wave: 1,
    isGameActive: false,
    roundTime: 0
  }

  // Animation
  private animationId: number | null = null
  private onGameEnd?: (result: any) => void
  private onStatsUpdate?: (stats: any) => void

  constructor(container: HTMLElement, onGameEnd?: (result: any) => void, onStatsUpdate?: (stats: any) => void) {
    this.container = container
    this.onGameEnd = onGameEnd
    this.onStatsUpdate = onStatsUpdate
    this.clock = new THREE.Clock()

    // Initialize player
    this.player = {
      position: new THREE.Vector3(0, 1.6, 0),
      rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
      velocity: new THREE.Vector3(),
      health: 100,
      armor: 50,
      isAlive: true,
      currentWeapon: 0,
      ammo: this.weapons.reduce((acc, w, i) => ({ ...acc, [i]: w.maxAmmo }), {}),
      boundingBox: new THREE.Box3()
    }

    // Initialize spawn zones
    this.initializeSpawnZones()

    this.init()
    this.setupEventListeners()
  }

  private initializeSpawnZones() {
    // Erstelle mehrere zufällige Spawn-Zonen
    this.spawnZones = [
      { center: new THREE.Vector3(50, 0, 50), radius: 20, minDistance: 30 },
      { center: new THREE.Vector3(-50, 0, 50), radius: 20, minDistance: 30 },
      { center: new THREE.Vector3(50, 0, -50), radius: 20, minDistance: 30 },
      { center: new THREE.Vector3(-50, 0, -50), radius: 20, minDistance: 30 },
      { center: new THREE.Vector3(70, 0, 0), radius: 15, minDistance: 40 },
      { center: new THREE.Vector3(-70, 0, 0), radius: 15, minDistance: 40 },
      { center: new THREE.Vector3(0, 0, 70), radius: 15, minDistance: 40 },
      { center: new THREE.Vector3(0, 0, -70), radius: 15, minDistance: 40 }
    ]
  }

  private init() {
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200)

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.copy(this.player.position)

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setClearColor(0x1a1a2e)
    this.container.appendChild(this.renderer.domElement)

    // Initialize systems
    this.projectilePool = new ProjectilePool(this.scene)
    this.spatialHash = new SpatialHash(10)

    this.createEnvironment()
    this.createPlayer()
    this.spawnEnemies(3) // Start with 3 enemies

    // Start game
    this.gameState.isGameActive = true
    this.animate()

    // Game timer
    this.startGameTimer()
  }

  private createEnvironment() {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.scene.add(ground)

    // Create GLXY styled obstacles
    this.createGLXYObstacles()

    // Add some GLXY branded elements
    this.createGLXYElements()
  }

  private createGLXYObstacles() {
    const obstaclePositions = [
      { x: 20, z: 20 },
      { x: -20, z: 20 },
      { x: 30, z: -15 },
      { x: -15, z: -30 },
      { x: 0, z: 40 },
      { x: 40, z: 0 }
    ]

    obstaclePositions.forEach((pos, index) => {
      const size = 5 + Math.random() * 5
      const geometry = new THREE.BoxGeometry(size, 8, size)
      const material = new THREE.MeshStandardMaterial({
        color: 0xff9500, // GLXY Orange
        roughness: 0.7,
        metalness: 0.3
      })
      const obstacle = new THREE.Mesh(geometry, material)
      obstacle.position.set(pos.x, 4, pos.z)
      obstacle.castShadow = true
      obstacle.receiveShadow = true
      this.scene.add(obstacle)

      // Add GLXY logo to obstacles
      this.addGLXYLogo(obstacle, size)
    })
  }

  private addGLXYLogo(obstacle: THREE.Mesh, size: number) {
    // Create a simple GLXY text effect using geometry
    const logoGeometry = new THREE.BoxGeometry(size * 0.8, 0.1, size * 0.3)
    const logoMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    })
    const logo = new THREE.Mesh(logoGeometry, logoMaterial)
    logo.position.set(0, size/2 + 0.1, 0)
    obstacle.add(logo)
  }

  private createGLXYElements() {
    // GLXY Sky elements
    const skyGeometry = new THREE.BoxGeometry(500, 500, 500)
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      side: THREE.BackSide
    })
    const sky = new THREE.Mesh(skyGeometry, skyMaterial)
    this.scene.add(sky)

    // Add some floating GLXY particles
    for (let i = 0; i < 50; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.5)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff9500,
        transparent: true,
        opacity: 0.6
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 20 + 5,
        (Math.random() - 0.5) * 100
      )
      this.scene.add(particle)
    }
  }

  private createPlayer() {
    // Player is represented by the camera, but we can add a simple body model
    const playerGeometry = new THREE.CapsuleGeometry(0.3, 1.6, 4, 8)
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    })
    const playerBody = new THREE.Mesh(playerGeometry, playerMaterial)
    playerBody.position.copy(this.player.position)
    
    // Update player bounding box
    this.player.boundingBox.setFromObject(playerBody)
    
    this.scene.add(playerBody)
  }

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      const enemyGeometry = new THREE.BoxGeometry(2, 4, 2)
      const enemyMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.5
      })
      const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial)

      // Zufällige Spawn-Position aus Spawn-Zones
      const spawnZone = this.spawnZones[Math.floor(Math.random() * this.spawnZones.length)]
      const angle = Math.random() * Math.PI * 2
      const distance = spawnZone.minDistance + Math.random() * spawnZone.radius
      
      enemy.position.set(
        spawnZone.center.x + Math.cos(angle) * distance,
        2,
        spawnZone.center.z + Math.sin(angle) * distance
      )
      enemy.castShadow = true

      this.scene.add(enemy)

      const boundingBox = new THREE.Box3().setFromObject(enemy)
      
      const enemyData: Enemy = {
        mesh: enemy,
        position: enemy.position.clone(),
        health: 100,
        maxHealth: 100,
        speed: 2 + Math.random(),
        lastShot: 0,
        isAlive: true,
        color: new THREE.Color(0xff0000),
        boundingBox: boundingBox
      }
      
      this.enemies.push(enemyData)
      
      // Füge zur Spatial Hash hinzu
      this.spatialHash.insert(enemyData, enemy.position)
    }
  }

  private setupEventListeners() {
    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase())

      // Weapon switching
      if (e.key >= '1' && e.key <= '5') {
        this.player.currentWeapon = parseInt(e.key) - 1
      }

      // Reload
      if (e.key.toLowerCase() === 'r') {
        this.reloadWeapon()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase())
    }

    // Mouse controls
    const handleMouseMove = (e: MouseEvent) => {
      if (this.isPointerLocked) {
        this.player.rotation.y -= e.movementX * 0.002
        this.player.rotation.x -= e.movementY * 0.002
        this.player.rotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.player.rotation.x))
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        this.shoot()
      }
    }

    const handleMouseClick = () => {
      if (!this.isPointerLocked) {
        this.container.requestPointerLock()
      }
    }

    // Pointer lock events
    const handlePointerLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === this.container
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('click', handleMouseClick)
    document.addEventListener('pointerlockchange', handlePointerLockChange)

    // Window resize
    const handleResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
  }

  private updatePlayer(deltaTime: number) {
    if (!this.player.isAlive) return

    const moveSpeed = 10 // m/s
    const moveVector = new THREE.Vector3()

    // WASD movement
    if (this.keys.has('w')) moveVector.z -= 1
    if (this.keys.has('s')) moveVector.z += 1
    if (this.keys.has('a')) moveVector.x -= 1
    if (this.keys.has('d')) moveVector.x += 1

    // Apply movement relative to camera rotation
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y)
    moveVector.normalize()
    moveVector.multiplyScalar(moveSpeed * deltaTime)

    // Update position
    this.player.position.add(moveVector)

    // Update camera
    this.camera.position.copy(this.player.position)
    this.camera.rotation.copy(this.player.rotation)

    // Update bounding box
    this.player.boundingBox.setFromCenterAndSize(
      this.player.position,
      new THREE.Vector3(1, 2, 1)
    )

    // Boundary check
    const boundary = 90
    this.player.position.x = Math.max(-boundary, Math.min(boundary, this.player.position.x))
    this.player.position.z = Math.max(-boundary, Math.min(boundary, this.player.position.z))
  }

  private updateEnemies(deltaTime: number) {
    // Update spatial hash
    this.spatialHash.clear()
    
    this.enemies.forEach((enemy, index) => {
      if (!enemy.isAlive) return

      // Update spatial hash
      this.spatialHash.insert(enemy, enemy.position)

      // Simple AI: move towards player
      const direction = new THREE.Vector3()
      direction.subVectors(this.player.position, enemy.position)
      const distance = direction.length()

      if (distance > 5) { // Keep distance
        direction.normalize()
        const oldPosition = enemy.position.clone()
        enemy.position.add(direction.multiplyScalar(enemy.speed * deltaTime))
        enemy.mesh.position.copy(enemy.position)
        
        // Update bounding box
        enemy.boundingBox.setFromObject(enemy.mesh)
      }

      // Shoot at player
      const now = Date.now()
      if (distance < 30 && now - enemy.lastShot > 2000) {
        this.enemyShoot(enemy)
        enemy.lastShot = now
      }
    })
  }

  private updateProjectiles(deltaTime: number) {
    const projectilesToRemove: Projectile[] = []
    
    this.activeProjectiles = this.activeProjectiles.filter(projectile => {
      projectile.mesh.position.add(projectile.direction.clone().multiplyScalar(projectile.speed * deltaTime))

      // Update bounding box
      if (projectile.boundingBox) {
        projectile.boundingBox.setFromCenterAndSize(
          projectile.mesh.position,
          new THREE.Vector3(0.2, 0.2, 0.2)
        )
      }

      // Check collision with enemies using spatial hash
      if (projectile.isPlayerProjectile) {
        const nearbyEnemies = this.spatialHash.getNearby(projectile.mesh.position, 5)
        
        for (const enemy of nearbyEnemies) {
          if (!enemy.isAlive) continue

          // Bessere Kollisionserkennung mit Bounding Boxes
          if (projectile.boundingBox && enemy.boundingBox.intersectsBox(projectile.boundingBox)) {
            // Apply damage
            enemy.health = Number(enemy.health) - Number(projectile.damage)
            const healthRatio = Number(enemy.health) / Number(enemy.maxHealth)
            ;(enemy.mesh.material as THREE.MeshStandardMaterial).color.setHSL(0, 1 - healthRatio, 0.5)

            if (enemy.health <= 0) {
              enemy.isAlive = false
              enemy.mesh.visible = false
              this.gameState.kills++
              this.gameState.score += 100
              
              // Entferne aus spatial hash
              this.spatialHash.remove(enemy, enemy.position)
            }

            // Release projectile to pool
            this.projectilePool.releaseProjectile(projectile.mesh)
            return false
          }
        }
      } else {
        // Check collision with player using bounding boxes
        if (projectile.boundingBox && this.player.boundingBox.intersectsBox(projectile.boundingBox)) {
          this.playerHit(projectile.damage)
          this.projectilePool.releaseProjectile(projectile.mesh)
          return false
        }
      }

      // Remove if out of bounds
      if (Math.abs(projectile.mesh.position.x) > 100 ||
          Math.abs(projectile.mesh.position.z) > 100) {
        this.projectilePool.releaseProjectile(projectile.mesh)
        return false
      }

      return true
    })
  }

  private shoot() {
    const weapon = this.weapons[this.player.currentWeapon]
    if (this.player.ammo[this.player.currentWeapon] <= 0) {
      this.reloadWeapon()
      return
    }

    const now = Date.now()
    const fireRate = 1000 / (weapon.fireRate / 60)

    // Get projectile from pool
    const projectileMesh = this.projectilePool.getProjectile()
    if (!projectileMesh) return // Pool exhausted

    projectileMesh.position.copy(this.player.position)
    
    // Set color based on player/enemy
    (projectileMesh.material as THREE.MeshStandardMaterial).color.set(0xffff00)
    (projectileMesh.material as THREE.MeshStandardMaterial).emissive.set(0xffff00)

    // Calculate direction based on camera rotation
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)

    const projectileData: Projectile = {
      mesh: projectileMesh,
      direction: direction,
      speed: 50,
      damage: weapon.damage,
      isPlayerProjectile: true,
      boundingBox: new THREE.Box3().setFromCenterAndSize(
        projectileMesh.position,
        new THREE.Vector3(0.2, 0.2, 0.2)
      )
    }

    this.projectilePool.setProjectileData(projectileMesh, projectileData)
    this.activeProjectiles.push(projectileData)

    this.player.ammo[this.player.currentWeapon]--

    // Update stats
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        ammo: this.player.ammo[this.player.currentWeapon],
        currentWeapon: weapon.name
      })
    }
  }

  private enemyShoot(enemy: Enemy) {
    const projectileMesh = this.projectilePool.getProjectile()
    if (!projectileMesh) return // Pool exhausted

    projectileMesh.position.copy(enemy.position)
    
    // Set color for enemy projectile
    (projectileMesh.material as THREE.MeshStandardMaterial).color.set(0xff0000)
    (projectileMesh.material as THREE.MeshStandardMaterial).emissive.set(0xff0000)

    const direction = new THREE.Vector3()
    direction.subVectors(this.player.position, enemy.position)
    direction.normalize()

    const projectileData: Projectile = {
      mesh: projectileMesh,
      direction: direction,
      speed: 30,
      damage: 20,
      isPlayerProjectile: false,
      boundingBox: new THREE.Box3().setFromCenterAndSize(
        projectileMesh.position,
        new THREE.Vector3(0.2, 0.2, 0.2)
      )
    }

    this.projectilePool.setProjectileData(projectileMesh, projectileData)
    this.activeProjectiles.push(projectileData)
  }

  private reloadWeapon() {
    const weapon = this.weapons[this.player.currentWeapon]
    this.player.ammo[this.player.currentWeapon] = weapon.maxAmmo

    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        ammo: this.player.ammo[this.player.currentWeapon],
        currentWeapon: weapon.name,
        isReloading: true
      })
    }
  }

  private playerHit(damage: number) {
    // Apply damage to armor first
    if (this.player.armor > 0) {
      const armorDamage = Math.min(damage, this.player.armor)
      this.player.armor -= armorDamage
      damage -= armorDamage
    }

    this.player.health -= damage
    this.player.health = Math.max(0, this.player.health)

    if (this.player.health <= 0) {
      this.player.isAlive = false
      this.gameState.deaths++
      this.respawnPlayer()
    }

    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        health: this.player.health,
        armor: this.player.armor
      })
    }
  }

  private respawnPlayer() {
    setTimeout(() => {
      this.player.position.set(0, 1.6, 0)
      this.player.health = 100
      this.player.armor = 50
      this.player.isAlive = true
    }, 3000) // 3 second respawn
  }

  private startGameTimer() {
    setInterval(() => {
      if (this.gameState.isGameActive) {
        this.gameState.roundTime += 1000

        // End game after 5 minutes
        if (this.gameState.roundTime >= 300000) {
          this.endGame()
        }

        // Spawn new wave every 60 seconds
        if (this.gameState.roundTime % 60000 === 0) {
          this.gameState.wave++
          this.spawnEnemies(2 + this.gameState.wave)
        }
      }
    }, 1000)
  }

  private endGame() {
    this.gameState.isGameActive = false

    if (this.onGameEnd) {
      this.onGameEnd({
        won: this.player.isAlive,
        kills: this.gameState.kills,
        deaths: this.gameState.deaths,
        headshots: Math.floor(this.gameState.kills * 0.25),
        score: this.gameState.score,
        bestStreak: this.gameState.kills,
        timeAlive: this.gameState.roundTime / 1000
      })
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate())

    // Delta time mit Capping
    let deltaTime = this.clock.getDelta()
    deltaTime = Math.min(deltaTime, this.maxDeltaTime)

    if (this.gameState.isGameActive) {
      this.updatePlayer(deltaTime)
      this.updateEnemies(deltaTime)
      this.updateProjectiles(deltaTime)
    }

    this.renderer.render(this.scene, this.camera)
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement)
    }

    this.renderer.dispose()
    
    // Clean up spatial hash
    this.spatialHash.clear()
  }

  public getGameState() {
    return {
      ...this.gameState,
      player: {
        health: this.player.health,
        armor: this.player.armor,
        ammo: this.player.ammo,
        currentWeapon: this.player.currentWeapon,
        isAlive: this.player.isAlive
      }
    }
  }
}