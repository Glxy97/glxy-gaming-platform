// @ts-nocheck
import * as THREE from 'three'

// Advanced 3D Model System for GLXY FPS - Making it EPIC!

export class GLXYModelManager {
  private scene: THREE.Scene
  private textureLoader: THREE.TextureLoader
  private models: Map<string, THREE.Group> = new Map()

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.textureLoader = new THREE.TextureLoader()
  }

  // Create Epic Player Model with GLXY Branding
  createGLXYPlayer(position: THREE.Vector3): THREE.Group {
    const playerGroup = new THREE.Group()

    // Body - Modern tactical outfit
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.8
    body.castShadow = true
    playerGroup.add(body)

    // GLXY Tactical Vest
    const vestGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1)
    const vestMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.8
    })
    const vest = new THREE.Mesh(vestGeometry, vestMaterial)
    vest.position.y = 0.9
    vest.position.z = 0.15
    playerGroup.add(vest)

    // GLXY Logo on Vest
    const logoGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.02)
    const logoMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9500, // GLXY Orange
      emissive: 0xff9500,
      emissiveIntensity: 0.3
    })
    const logo = new THREE.Mesh(logoGeometry, logoMaterial)
    logo.position.y = 0.9
    logo.position.z = 0.16
    playerGroup.add(logo)

    // Helmet with GLXY Branding
    const helmetGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.7
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 1.4
    helmet.scale.y = 0.8
    playerGroup.add(helmet)

    // GLXY Visor
    const visorGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.05)
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 1,
      roughness: 0.1
    })
    const visor = new THREE.Mesh(visorGeometry, visorMaterial)
    visor.position.y = 1.35
    visor.position.z = 0.2
    playerGroup.add(visor)

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 6, 12)
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    })

    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.35, 0.8, 0)
    leftArm.rotation.z = Math.PI / 8
    playerGroup.add(leftArm)

    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.35, 0.8, 0)
    rightArm.rotation.z = -Math.PI / 8
    playerGroup.add(rightArm)

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.1, 0.8, 6, 12)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    })

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.15, 0, 0)
    playerGroup.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.15, 0, 0)
    playerGroup.add(rightLeg)

    // Tactical Backpack
    const packGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2)
    const packMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.4
    })
    const pack = new THREE.Mesh(packGeometry, packMaterial)
    pack.position.y = 1.2
    pack.position.z = -0.2
    playerGroup.add(pack)

    playerGroup.position.copy(position)
    return playerGroup
  }

  // Create Epic Enemy Models
  createGLXYEnemy(position: THREE.Vector3, type: 'soldier' | 'elite' | 'boss' = 'soldier'): THREE.Group {
    const enemyGroup = new THREE.Group()

    if (type === 'soldier') {
      // Standard Enemy Soldier
      const bodyGeometry = new THREE.CapsuleGeometry(0.28, 1.1, 6, 12)
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B0000, // Dark Red
        roughness: 0.8,
        metalness: 0.2
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.position.y = 0.75
      body.castShadow = true
      enemyGroup.add(body)

      // Enemy Helmet
      const helmetGeometry = new THREE.SphereGeometry(0.23, 12, 12)
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.5,
        metalness: 0.5
      })
      const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
      helmet.position.y = 1.3
      enemyGroup.add(helmet)

      // Enemy Weapon
      const weaponGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.08)
      const weaponMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.4,
        metalness: 0.8
      })
      const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial)
      weapon.position.set(0.5, 0.8, 0.1)
      weapon.rotation.z = -Math.PI / 4
      enemyGroup.add(weapon)

    } else if (type === 'elite') {
      // Elite Enemy - Bigger and more detailed
      const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1.3, 8, 16)
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x4B0082, // Indigo
        roughness: 0.6,
        metalness: 0.4,
        emissive: 0x4B0082,
        emissiveIntensity: 0.1
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.position.y = 0.85
      body.castShadow = true
      enemyGroup.add(body)

      // Elite Helmet with Glow
      const helmetGeometry = new THREE.SphereGeometry(0.3, 16, 16)
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F4F4F,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x4B0082,
        emissiveIntensity: 0.2
      })
      const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
      helmet.position.y = 1.4
      enemyGroup.add(helmet)

      // Shoulder Pads
      const padGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.15)
      const padMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F4F4F,
        roughness: 0.4,
        metalness: 0.6
      })

      const leftPad = new THREE.Mesh(padGeometry, padMaterial)
      leftPad.position.set(-0.35, 0.95, 0)
      enemyGroup.add(leftPad)

      const rightPad = new THREE.Mesh(padGeometry, padMaterial)
      rightPad.position.set(0.35, 0.95, 0)
      enemyGroup.add(rightPad)

    } else if (type === 'boss') {
      // Boss Enemy - Huge and intimidating
      const bodyGeometry = new THREE.CapsuleGeometry(0.5, 2, 12, 24)
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B0000,
        roughness: 0.5,
        metalness: 0.5,
        emissive: 0xFF0000,
        emissiveIntensity: 0.2
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.position.y = 1.5
      body.castShadow = true
      enemyGroup.add(body)

      // Boss Helmet with Horns
      const helmetGeometry = new THREE.SphereGeometry(0.4, 16, 16)
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0xFF0000,
        emissiveIntensity: 0.3
      })
      const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
      helmet.position.y = 2.2
      enemyGroup.add(helmet)

      // Boss Horns
      const hornGeometry = new THREE.ConeGeometry(0.1, 0.5, 8)
      const hornMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        roughness: 0.3,
        metalness: 0.7
      })

      const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial)
      leftHorn.position.set(-0.25, 2.5, 0)
      leftHorn.rotation.z = -Math.PI / 6
      enemyGroup.add(leftHorn)

      const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial)
      rightHorn.position.set(0.25, 2.5, 0)
      rightHorn.rotation.z = Math.PI / 6
      enemyGroup.add(rightHorn)

      // Boss Weapon - Heavy Machine Gun
      const weaponGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.2)
      const weaponMaterial = new THREE.MeshStandardMaterial({
        color: 0x1C1C1C,
        roughness: 0.3,
        metalness: 0.8
      })
      const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial)
      weapon.position.set(0.8, 1.5, 0.2)
      weapon.rotation.z = -Math.PI / 6
      enemyGroup.add(weapon)
    }

    enemyGroup.position.copy(position)
    return enemyGroup
  }

  // Create Epic Weapon Models
  createGLXYWeapon(type: 'm4a1' | 'quantum' | 'sniper' | 'pistol' | 'heavy'): THREE.Group {
    const weaponGroup = new THREE.Group()

    if (type === 'm4a1') {
      // GLXY M4A1 - Tactical Assault Rifle
      const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12)
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        roughness: 0.3,
        metalness: 0.8
      })
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
      barrel.rotation.z = Math.PI / 2
      weaponGroup.add(barrel)

      // Receiver
      const receiverGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3)
      const receiverMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.7
      })
      const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
      weaponGroup.add(receiver)

      // GLXY Logo on Receiver
      const logoGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.05)
      const logoMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9500,
        emissive: 0xff9500,
        emissiveIntensity: 0.5
      })
      const logo = new THREE.Mesh(logoGeometry, logoMaterial)
      logo.position.z = 0.18
      weaponGroup.add(logo)

      // Stock
      const stockGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.2)
      const stockMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6,
        metalness: 0.4
      })
      const stock = new THREE.Mesh(stockGeometry, stockMaterial)
      stock.position.x = -0.6
      weaponGroup.add(stock)

      // Grip
      const gripGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.1)
      const gripMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F2F2F,
        roughness: 0.8,
        metalness: 0.2
      })
      const grip = new THREE.Mesh(gripGeometry, gripMaterial)
      grip.position.y = -0.2
      weaponGroup.add(grip)

      // Magazine
      const magazineGeometry = new THREE.BoxGeometry(0.12, 0.5, 0.2)
      const magazineMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6,
        metalness: 0.4
      })
      const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
      magazine.position.y = -0.15
      weaponGroup.add(magazine)

    } else if (type === 'quantum') {
      // GLXY Quantum Rifle - Futuristic Energy Weapon
      const barrelGeometry = new THREE.CylinderGeometry(0.06, 0.08, 1.4, 16)
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x4169E1,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x4169E1,
        emissiveIntensity: 0.3
      })
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
      barrel.rotation.z = Math.PI / 2
      weaponGroup.add(barrel)

      // Energy Core
      const coreGeometry = new THREE.SphereGeometry(0.15, 16, 16)
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FFFF,
        roughness: 0,
        metalness: 1,
        emissive: 0x00FFFF,
        emissiveIntensity: 0.8
      })
      const core = new THREE.Mesh(coreGeometry, coreMaterial)
      core.position.set(0.2, 0, 0)
      weaponGroup.add(core)

      // Receiver with GLXY Tech
      const receiverGeometry = new THREE.BoxGeometry(0.9, 0.5, 0.4)
      const receiverMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F4F4F,
        roughness: 0.2,
        metalness: 0.9
      })
      const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
      weaponGroup.add(receiver)

      // GLXY Tech Lines
      const techGeometry = new THREE.BoxGeometry(0.02, 0.4, 0.01)
      const techMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9500,
        emissive: 0xff9500,
        emissiveIntensity: 1
      })
      for (let i = 0; i < 3; i++) {
        const techLine = new THREE.Mesh(techGeometry, techMaterial)
        techLine.position.set(-0.2 + i * 0.2, 0, 0.21)
        weaponGroup.add(techLine)
      }

    } else if (type === 'sniper') {
      // GLXY Sniper Elite - Long Range Precision
      const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 12)
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.2,
        metalness: 0.9
      })
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
      barrel.rotation.z = Math.PI / 2
      weaponGroup.add(barrel)

      // Suppressor
      const suppressorGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12)
      const suppressorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.4,
        metalness: 0.7
      })
      const suppressor = new THREE.Mesh(suppressorGeometry, suppressorMaterial)
      suppressor.position.x = 1.2
      suppressor.rotation.z = Math.PI / 2
      weaponGroup.add(suppressor)

      // Scope
      const scopeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16)
      const scopeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F2F2F,
        roughness: 0.1,
        metalness: 0.9
      })
      const scope = new THREE.Mesh(scopeGeometry, scopeMaterial)
      scope.position.set(0, 0.15, 0)
      scope.rotation.z = Math.PI / 2
      weaponGroup.add(scope)

      // GLXY Scope Lens
      const lensGeometry = new THREE.CircleGeometry(0.06, 16)
      const lensMaterial = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        roughness: 0,
        metalness: 1,
        emissive: 0x87CEEB,
        emissiveIntensity: 0.3
      })
      const lens = new THREE.Mesh(lensGeometry, lensMaterial)
      lens.position.set(0, 0.15, 0.21)
      lens.rotation.y = Math.PI / 2
      weaponGroup.add(lens)

    } else if (type === 'pistol') {
      // GLXY Desert Eagle - Powerful Sidearm
      const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8)
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        roughness: 0.3,
        metalness: 0.8
      })
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
      barrel.rotation.z = Math.PI / 2
      weaponGroup.add(barrel)

      // Slide
      const slideGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.25)
      const slideMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.2,
        metalness: 0.9
      })
      const slide = new THREE.Mesh(slideGeometry, slideMaterial)
      weaponGroup.add(slide)

      // Grip
      const gripGeometry = new THREE.BoxGeometry(0.12, 0.25, 0.15)
      const gripMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F2F2F,
        roughness: 0.8,
        metalness: 0.2
      })
      const grip = new THREE.Mesh(gripGeometry, gripMaterial)
      grip.position.y = -0.15
      weaponGroup.add(grip)

      // Trigger Guard
      const guardGeometry = new THREE.TorusGeometry(0.12, 0.02, 8, 12)
      const guardMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        roughness: 0.4,
        metalness: 0.7
      })
      const guard = new THREE.Mesh(guardGeometry, guardMaterial)
      guard.position.y = -0.05
      guard.rotation.x = Math.PI / 2
      weaponGroup.add(guard)

    } else if (type === 'heavy') {
      // GLXY Heavy Machine Gun - Devastating Firepower
      const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 12)
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.8
      })
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
      barrel.rotation.z = Math.PI / 2
      weaponGroup.add(barrel)

      // Heat Shield
      const shieldGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8)
      const shieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F2F2F,
        roughness: 0.4,
        metalness: 0.7
      })
      const shield = new THREE.Mesh(shieldGeometry, shieldMaterial)
      shield.position.x = 0.3
      shield.rotation.z = Math.PI / 2
      weaponGroup.add(shield)

      // Ammo Belt
      for (let i = 0; i < 5; i++) {
        const bulletGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8)
        const bulletMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B7355,
          roughness: 0.8,
          metalness: 0.3
        })
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial)
        bullet.position.set(0.4, -0.2 + i * 0.05, 0.1)
        bullet.rotation.z = Math.PI / 2
        weaponGroup.add(bullet)
      }

      // Bipod
      const legGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.05)
      const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        roughness: 0.5,
        metalness: 0.6
      })

      const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
      leftLeg.position.set(-0.3, -0.4, 0.2)
      weaponGroup.add(leftLeg)

      const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
      rightLeg.position.set(0.3, -0.4, 0.2)
      weaponGroup.add(rightLeg)
    }

    return weaponGroup
  }

  // Create Epic Environment Models
  createGLXYEnvironment(): void {
    // Create GLXY Tower Structures
    this.createGLXYTower(30, 30, 15)
    this.createGLXYTower(-25, 40, 12)
    this.createGLXYTower(45, -20, 18)

    // Create GLXY Crates
    this.createGLXYCrate(15, 10, 2)
    this.createGLXYCrate(-20, -15, 2)
    this.createGLXYCrate(35, 35, 1.5)

    // Create GLXY Barriers
    this.createGLXYBarrier(0, 25, 8)
    this.createGLXYBarrier(-30, 0, 8)
    this.createGLXYBarrier(20, -30, 8)

    // Create GLXY Floating Platforms
    this.createGLXYPlatform(10, -10, 6, 5)
    this.createGLXYPlatform(-15, 20, 8, 3)
    this.createGLXYPlatform(40, 15, 10, 7)

    // Create GLXY Energy Crystals
    for (let i = 0; i < 10; i++) {
      this.createGLXYCrystal(
        (Math.random() - 0.5) * 80,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * 80
      )
    }

    // Create GLXY Neon Signs
    this.createGLXYNeonSign(0, 0, 'GLXY ARENA')
    this.createGLXYNeonSign(25, 25, 'FPS ZONE')
    this.createGLXYNeonSign(-30, -25, 'ELITE MODE')
  }

  private createGLXYTower(x: number, z: number, height: number): void {
    const towerGroup = new THREE.Group()

    // Tower Base
    const baseGeometry = new THREE.BoxGeometry(8, 1, 8)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.3
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.5
    base.castShadow = true
    towerGroup.add(base)

    // Tower Structure
    const towerGeometry = new THREE.BoxGeometry(6, height, 6)
    const towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.5,
      emissive: 0xff9500,
      emissiveIntensity: 0.1
    })
    const tower = new THREE.Mesh(towerGeometry, towerMaterial)
    tower.position.y = height / 2 + 1
    tower.castShadow = true
    towerGroup.add(tower)

    // GLXY Logo Sides
    for (let i = 0; i < 4; i++) {
      const logoGeometry = new THREE.BoxGeometry(4, 3, 0.1)
      const logoMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9500,
        emissive: 0xff9500,
        emissiveIntensity: 0.5
      })
      const logo = new THREE.Mesh(logoGeometry, logoMaterial)
      logo.position.setFromMatrixPosition(
        new THREE.Matrix4().makeRotationY(i * Math.PI / 2)
          .multiply(new THREE.Matrix4().makeTranslation(0, height / 2 + 1, 3.1))
      )
      towerGroup.add(logo)
    }

    // Top Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8)
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    })
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
    antenna.position.y = height + 3
    towerGroup.add(antenna)

    // Top Light
    const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8)
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1
    })
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.y = height + 5.5
    towerGroup.add(light)

    towerGroup.position.set(x, 0, z)
    this.scene.add(towerGroup)
  }

  private createGLXYCrate(x: number, z: number, size: number): void {
    const crateGroup = new THREE.Group()

    // Main Crate
    const crateGeometry = new THREE.BoxGeometry(size, size, size)
    const crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    })
    const crate = new THREE.Mesh(crateGeometry, crateMaterial)
    crate.position.y = size / 2
    crate.castShadow = true
    crateGroup.add(crate)

    // GLXY Logo on all sides
    const logoGeometry = new THREE.BoxGeometry(size * 0.6, size * 0.4, 0.05)
    const logoMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9500,
      emissive: 0xff9500,
      emissiveIntensity: 0.3
    })

    for (let i = 0; i < 4; i++) {
      const logo = new THREE.Mesh(logoGeometry, logoMaterial)
      logo.position.setFromMatrixPosition(
        new THREE.Matrix4().makeRotationY(i * Math.PI / 2)
          .multiply(new THREE.Matrix4().makeTranslation(0, size / 2, size / 2 + 0.05))
      )
      crateGroup.add(logo)
    }

    crateGroup.position.set(x, 0, z)
    this.scene.add(crateGroup)
  }

  private createGLXYBarrier(x: number, z: number, length: number): void {
    const barrierGeometry = new THREE.BoxGeometry(length, 2, 0.5)
    const barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.4
    })
    const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial)
    barrier.position.set(x, 1, z)
    barrier.castShadow = true
    barrier.receiveShadow = true

    // Warning Stripes
    for (let i = 0; i < length; i += 1) {
      const stripeGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.55)
      const stripeMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xff9500 : 0x000000,
        emissive: i % 2 === 0 ? 0xff9500 : 0x000000,
        emissiveIntensity: 0.2
      })
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial)
      stripe.position.set(x - length/2 + i + 0.5, 1, z)
      barrier.add(stripe)
    }

    this.scene.add(barrier)
  }

  private createGLXYPlatform(x: number, z: number, width: number, height: number): void {
    const platformGeometry = new THREE.BoxGeometry(width, 0.5, width)
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      metalness: 0.5,
      emissive: 0xff9500,
      emissiveIntensity: 0.1
    })
    const platform = new THREE.Mesh(platformGeometry, platformMaterial)
    platform.position.set(x, height, z)
    platform.castShadow = true
    platform.receiveShadow = true

    // Floating Effect Support Pillars
    for (let i = 0; i < 4; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, height, 8)
      const pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.7
      })
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
      const angle = (i / 4) * Math.PI * 2
      pillar.position.set(
        x + Math.cos(angle) * width * 0.4,
        height / 2,
        z + Math.sin(angle) * width * 0.4
      )
      platform.add(pillar)
    }

    this.scene.add(platform)
  }

  private createGLXYCrystal(x: number, y: number, z: number): void {
    const crystalGeometry = new THREE.OctahedronGeometry(1, 0)
    const crystalMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      roughness: 0,
      metalness: 1,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    })
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial)
    crystal.position.set(x, y, z)
    crystal.castShadow = true

    // Add rotation animation
    crystal.userData = { rotationSpeed: 0.01 + Math.random() * 0.02 }

    this.scene.add(crystal)
  }

  private createGLXYNeonSign(x: number, z: number, text: string): void {
    const signGroup = new THREE.Group()

    // Sign Backboard
    const backboardGeometry = new THREE.BoxGeometry(8, 2, 0.2)
    const backboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.9
    })
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial)
    backboard.position.y = 4
    signGroup.add(backboard)

    // Neon Border
    const borderGeometry = new THREE.BoxGeometry(8.4, 2.4, 0.1)
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9500,
      emissive: 0xff9500,
      emissiveIntensity: 1
    })
    const border = new THREE.Mesh(borderGeometry, borderMaterial)
    border.position.y = 4
    border.position.z = 0.1
    signGroup.add(border)

    // Neon Text (simplified as glowing rectangles)
    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8
    })

    for (let i = 0; i < text.length; i++) {
      const charGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.05)
      const char = new THREE.Mesh(charGeometry, textMaterial)
      char.position.set(-3.5 + i * 0.7, 4, 0.15)
      signGroup.add(char)
    }

    // Support Pole
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.6
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 2
    signGroup.add(pole)

    signGroup.position.set(x, 0, z)
    this.scene.add(signGroup)
  }
}

export default GLXYModelManager