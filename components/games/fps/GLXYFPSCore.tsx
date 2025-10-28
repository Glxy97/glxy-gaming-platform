// @ts-nocheck
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

// Projectile interface
interface Projectile {
  mesh: THREE.Mesh
  direction: THREE.Vector3
  speed: number
  damage: number
  isPlayerProjectile: boolean
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
}

// GLXY FPS Core Engine - Complete 3D FPS Implementation
export class GLXYFPSCore {
  private container!: HTMLElement
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private clock!: THREE.Clock

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

  // Projectiles
  private projectiles: Projectile[] = []

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
      ammo: this.weapons.map(w => w.maxAmmo)
    }

    this.init()
    this.setupEventListeners()
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

      // Random spawn position away from player
      const angle = (i / count) * Math.PI * 2
      const distance = 30 + Math.random() * 20
      enemy.position.set(
        Math.cos(angle) * distance,
        2,
        Math.sin(angle) * distance
      )
      enemy.castShadow = true

      this.scene.add(enemy)

      this.enemies.push({
        mesh: enemy,
        position: enemy.position.clone(),
        health: 100,
        maxHealth: 100,
        speed: 2 + Math.random(),
        lastShot: 0,
        isAlive: true,
        color: new THREE.Color(0xff0000)
      })
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

    // Boundary check
    const boundary = 90
    this.player.position.x = Math.max(-boundary, Math.min(boundary, this.player.position.x))
    this.player.position.z = Math.max(-boundary, Math.min(boundary, this.player.position.z))
  }

  private updateEnemies(deltaTime: number) {
    this.enemies.forEach((enemy, index) => {
      if (!enemy.isAlive) return

      // Simple AI: move towards player
      const direction = new THREE.Vector3()
      direction.subVectors(this.player.position, enemy.position)
      const distance = direction.length()

      if (distance > 5) { // Keep distance
        direction.normalize()
        enemy.position.add(direction.multiplyScalar(enemy.speed * deltaTime))
        enemy.mesh.position.copy(enemy.position)
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
    this.projectiles = this.projectiles.filter(projectile => {
      projectile.mesh.position.add(projectile.direction.multiplyScalar(projectile.speed * deltaTime))

      // Check collision with enemies
      if (projectile.isPlayerProjectile) {
        for (const enemy of this.enemies) {
          if (!enemy.isAlive) continue

          const distance = projectile.mesh.position.distanceTo(enemy.position)
          if (distance < 2) {
            // Apply damage using Number constructor to avoid TypeScript issues
            enemy.health = Number(enemy.health) - Number(projectile.damage)
            const healthRatio = Number(enemy.health) / Number(enemy.maxHealth)
            ;(enemy.mesh.material as THREE.MeshStandardMaterial).color.setHSL(0, 1 - healthRatio, 0.5) // Color change based on health

            if (enemy.health <= 0) {
              enemy.isAlive = false
              enemy.mesh.visible = false
              this.gameState.kills++
              this.gameState.score += 100
            }

            this.scene.remove(projectile.mesh)
            return false
          }
        }
      } else {
        // Check collision with player
        const distance = projectile.mesh.position.distanceTo(this.player.position)
        if (distance < 2) {
          this.playerHit(projectile.damage)
          this.scene.remove(projectile.mesh)
          return false
        }
      }

      // Remove if out of bounds
      if (Math.abs(projectile.mesh.position.x) > 100 ||
          Math.abs(projectile.mesh.position.z) > 100) {
        this.scene.remove(projectile.mesh)
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

    // Create projectile
    const projectileGeometry = new THREE.SphereGeometry(0.1)
    const projectileMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    })
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial)

    projectile.position.copy(this.player.position)
    this.scene.add(projectile)

    // Calculate direction based on camera rotation
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)

    this.projectiles.push({
      mesh: projectile,
      direction: direction,
      speed: 50,
      damage: weapon.damage,
      isPlayerProjectile: true
    })

    this.player.ammo[this.player.currentWeapon]--

    // Update stats
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        ammo: this.player.ammo[this.player.currentWeapon],
        currentWeapon: weapon.name
      })
    }
  }

  private enemyShoot(enemy: any) {
    const projectileGeometry = new THREE.SphereGeometry(0.1)
    const projectileMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    })
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial)

    projectile.position.copy(enemy.position)
    this.scene.add(projectile)

    const direction = new THREE.Vector3()
    direction.subVectors(this.player.position, enemy.position)
    direction.normalize()

    this.projectiles.push({
      mesh: projectile,
      direction: direction,
      speed: 30,
      damage: 20,
      isPlayerProjectile: false
    })
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

    const deltaTime = this.clock.getDelta()

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