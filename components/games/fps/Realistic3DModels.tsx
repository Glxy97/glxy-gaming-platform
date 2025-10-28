// @ts-nocheck
'use client'

import * as THREE from 'three'

// REALISTIC 3D MODELS FOR SPECIAL FORCES CLASSES
export interface ModelConfiguration {
  scale: number
  position: THREE.Vector3
  rotation: THREE.Euler
  materials: { [key: string]: THREE.Material }
  geometry: { [key: string]: THREE.BufferGeometry }
}

export class Realistic3DModeler {
  private scene: THREE.Scene
  private textureLoader: THREE.TextureLoader
  private models: Map<string, THREE.Group> = new Map()

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.textureLoader = new THREE.TextureLoader()
  }

  // Create realistic soldier model for each class
  createSoldierModel(classId: string, teamColor: string = '#4a5568'): THREE.Group {
    const group = new THREE.Group()
    group.name = `soldier_${classId}`

    // Base body configuration
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1.7, 8, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: teamColor,
      roughness: 0.8,
      metalness: 0.2
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.25
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Head with helmet
    const headGeometry = new THREE.SphereGeometry(0.25)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4d1ae, // Skin tone
      roughness: 0.9,
      metalness: 0.1
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 1.85
    group.add(head)

    // Add class-specific equipment
    switch (classId) {
      case 'assault_operator':
        this.addAssaultOperatorGear(group)
        break
      case 'recon_specialist':
        this.addReconSpecialistGear(group)
        break
      case 'marksman':
        this.addMarksmanGear(group)
        break
      case 'combat_engineer':
        this.addCombatEngineerGear(group)
        break
      case 'field_medic':
        this.addFieldMedicGear(group)
        break
    }

    // Add basic equipment for all classes
    this.addBasicEquipment(group)

    this.models.set(classId, group)
    return group
  }

  // ASSAULT OPERATOR - Point Man gear
  private addAssaultOperatorGear(group: THREE.Group): void {
    // Tactical helmet with night vision mount
    const helmetGeometry = new THREE.SphereGeometry(0.28)
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 2.0

    // NVG mount
    const nvgMountGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.05)
    const nvgMountMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    const nvgMount = new THREE.Mesh(nvgMountGeometry, nvgMountMaterial)
    nvgMount.position.set(0, 2.15, 0.25)
    helmet.add(nvgMount)

    group.add(helmet)

    // Tactical vest with pouches
    const vestGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.15)
    const vestMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3d1a, // Dark green
      roughness: 0.9,
      metalness: 0.1
    })
    const vest = new THREE.Mesh(vestGeometry, vestMaterial)
    vest.position.set(0, 1.3, 0.1)
    group.add(vest)

    // Magazine pouches
    for (let i = 0; i < 3; i++) {
      const pouchGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.08)
      const pouch = new THREE.Mesh(pouchGeometry, vestMaterial)
      pouch.position.set(-0.3 + i * 0.15, 1.2, 0.18)
      group.add(pouch)
    }

    // Breaching charge on chest
    const chargeGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.05)
    const chargeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const charge = new THREE.Mesh(chargeGeometry, chargeMaterial)
    charge.position.set(0.25, 1.1, 0.18)
    group.add(charge)
  }

  // RECON SPECIALIST - Scout gear
  private addReconSpecialistGear(group: THREE.Group): void {
    // Lightweight helmet with comms
    const helmetGeometry = new THREE.SphereGeometry(0.27)
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f, // Dark slate gray
      roughness: 0.7,
      metalness: 0.3
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 2.0

    // Communication headset
    const headsetGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.05)
    const headsetMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
    const headset = new THREE.Mesh(headsetGeometry, headsetMaterial)
    headset.position.set(0, 2.1, 0.27)
    helmet.add(headset)

    group.add(helmet)

    // Ghillie suit elements
    const ghillieMaterial = new THREE.MeshStandardMaterial({
      color: 0x556b2f,
      roughness: 0.95,
      metalness: 0.05
    })

    // Shoulder ghillie
    const shoulderGhillieGeometry = new THREE.ConeGeometry(0.3, 0.5, 6)
    const leftGhillie = new THREE.Mesh(shoulderGhillieGeometry, ghillieMaterial)
    leftGhillie.position.set(-0.4, 1.8, 0)
    leftGhillie.rotation.z = Math.PI / 4
    group.add(leftGhillie)

    const rightGhillie = new THREE.Mesh(shoulderGhillieGeometry, ghillieMaterial)
    rightGhillie.position.set(0.4, 1.8, 0)
    rightGhillie.rotation.z = -Math.PI / 4
    group.add(rightGhillie)

    // Backpack with surveillance gear
    const packGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.2)
    const packMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f4f })
    const backpack = new THREE.Mesh(packGeometry, packMaterial)
    backpack.position.set(0, 1.0, -0.3)
    group.add(backpack)

    // Binoculars on chest
    const binocularGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.08)
    const binocularMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
    const binoculars = new THREE.Mesh(binocularGeometry, binocularMaterial)
    binoculars.position.set(0.2, 1.15, 0.18)
    group.add(binoculars)
  }

  // MARKSMAN OPERATOR - Sniper gear
  private addMarksmanGear(group: THREE.Group): void {
    // Boonie hat with camouflage
    const hatGeometry = new THREE.ConeGeometry(0.35, 0.2, 8)
    const hatMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355, // Khaki
      roughness: 0.9,
      metalness: 0.1
    })
    const hat = new THREE.Mesh(hatGeometry, hatMaterial)
    hat.position.y = 2.1
    hat.rotation.z = Math.PI
    group.add(hat)

    // Ghillie suit hood
    const ghillieHoodGeometry = new THREE.SphereGeometry(0.32, 8, 6)
    const ghillieMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5d23,
      roughness: 0.95
    })
    const ghillieHood = new THREE.Mesh(ghillieHoodGeometry, ghillieMaterial)
    ghillieHood.position.y = 2.0
    ghillieHood.scale.y = 0.7
    group.add(ghillieHood)

    // Ghillie suit elements on body
    for (let i = 0; i < 8; i++) {
      const stripGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.3, 4)
      const strip = new THREE.Mesh(stripGeometry, ghillieMaterial)
      strip.position.set(
        (Math.random() - 0.5) * 0.8,
        1.0 + Math.random() * 0.6,
        (Math.random() - 0.5) * 0.3
      )
      strip.rotation.x = Math.random() * Math.PI
      strip.rotation.z = Math.random() * Math.PI
      group.add(strip)
    }

    // Bipod on leg
    const bipodGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.15)
    const bipodMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    const bipod = new THREE.Mesh(bipodGeometry, bipodMaterial)
    bipod.position.set(0.15, 0.5, 0.1)
    bipod.rotation.x = Math.PI / 2
    group.add(bipod)

    // Rangefinder pouch
    const rangefinderGeometry = new THREE.BoxGeometry(0.12, 0.18, 0.08)
    const rangefinderMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f4f })
    const rangefinder = new THREE.Mesh(rangefinderGeometry, rangefinderMaterial)
    rangefinder.position.set(-0.25, 1.1, 0.18)
    group.add(rangefinder)
  }

  // COMBAT ENGINEER - Demolitions gear
  private addCombatEngineerGear(group: THREE.Group): void {
    // Hard hat with visor
    const helmetGeometry = new THREE.SphereGeometry(0.3)
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Construction yellow
      roughness: 0.6,
      metalness: 0.4
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 2.0

    // Face shield
    const shieldGeometry = new THREE.BoxGeometry(0.5, 0.35, 0.02)
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.3
    })
    const faceShield = new THREE.Mesh(shieldGeometry, shieldMaterial)
    faceShield.position.set(0, 2.0, 0.28)
    helmet.add(faceShield)

    group.add(helmet)

    // Heavy tool belt
    const beltGeometry = new THREE.BoxGeometry(0.9, 0.1, 0.15)
    const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f4f })
    const belt = new THREE.Mesh(beltGeometry, beltMaterial)
    belt.position.set(0, 0.8, 0)
    group.add(belt)

    // Tool pouches
    const tools = ['hammer', 'wrench', 'pliers', 'screwdriver']
    tools.forEach((tool, index) => {
      const toolGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.06)
      const toolMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 })
      const toolMesh = new THREE.Mesh(toolGeometry, toolMaterial)
      toolMesh.position.set(-0.35 + index * 0.18, 0.75, 0.08)
      group.add(toolMesh)
    })

    // C4 explosives pack
    const c4Geometry = new THREE.BoxGeometry(0.15, 0.1, 0.08)
    const c4Material = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const c4 = new THREE.Mesh(c4Geometry, c4Material)
    c4.position.set(0.3, 1.0, 0.18)
    group.add(c4)

    // Detonator
    const detonatorGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.04)
    const detonatorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const detonator = new THREE.Mesh(detonatorGeometry, detonatorMaterial)
    detonator.position.set(0.3, 0.85, 0.18)
    group.add(detonator)
  }

  // FIELD MEDIC - Medical gear
  private addFieldMedicGear(group: THREE.Group): void {
    // Medical helmet with red cross
    const helmetGeometry = new THREE.SphereGeometry(0.28)
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff, // Dodger blue
      roughness: 0.7,
      metalness: 0.3
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 2.0

    // Red cross emblem
    const crossGeometryV = new THREE.BoxGeometry(0.02, 0.1, 0.02)
    const crossGeometryH = new THREE.BoxGeometry(0.1, 0.02, 0.02)
    const crossMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const crossV = new THREE.Mesh(crossGeometryV, crossMaterial)
    const crossH = new THREE.Mesh(crossGeometryH, crossMaterial)
    crossV.position.set(0, 2.15, 0.28)
    crossH.position.set(0, 2.15, 0.28)
    helmet.add(crossV, crossH)

    group.add(helmet)

    // Medical vest with red markings
    const vestGeometry = new THREE.BoxGeometry(0.75, 0.55, 0.15)
    const vestMaterial = new THREE.MeshStandardMaterial({
      color: 0x4169e1, // Royal blue
      roughness: 0.8,
      metalness: 0.2
    })
    const vest = new THREE.Mesh(vestGeometry, vestMaterial)
    vest.position.set(0, 1.3, 0.1)
    group.add(vest)

    // Medical kit on back
    const medkitGeometry = new THREE.BoxGeometry(0.25, 0.35, 0.15)
    const medkitMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const medkit = new THREE.Mesh(medkitGeometry, medkitMaterial)
    medkit.position.set(0, 1.1, -0.25)

    // Red cross on medkit
    const kitCrossV = new THREE.BoxGeometry(0.02, 0.2, 0.02)
    const kitCrossH = new THREE.BoxGeometry(0.2, 0.02, 0.02)
    const kitCrossV_mesh = new THREE.Mesh(kitCrossV, crossMaterial)
    const kitCrossH_mesh = new THREE.Mesh(kitCrossH, crossMaterial)
    kitCrossV_mesh.position.set(0, 0.1, 0.08)
    kitCrossH_mesh.position.set(0, 0.1, 0.08)
    medkit.add(kitCrossV_mesh, kitCrossH_mesh)

    group.add(medkit)

    // Defibrillator paddles
    const paddleGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.15)
    const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
    const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
    leftPaddle.position.set(-0.15, 0.9, 0.15)
    rightPaddle.position.set(0.15, 0.9, 0.15)
    group.add(leftPaddle, rightPaddle)

    // Tourniquet pouches
    for (let i = 0; i < 3; i++) {
      const tourniquetGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8)
      const tourniquetMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500 })
      const tourniquet = new THREE.Mesh(tourniquetGeometry, tourniquetMaterial)
      tourniquet.position.set(-0.2 + i * 0.1, 1.15, 0.18)
      tourniquet.rotation.x = Math.PI / 2
      group.add(tourniquet)
    }
  }

  // Basic equipment for all classes
  private addBasicEquipment(group: THREE.Group): void {
    // Combat boots
    const bootGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.3)
    const bootMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.9,
      metalness: 0.1
    })
    const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial)
    const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial)
    leftBoot.position.set(-0.08, 0.125, 0)
    rightBoot.position.set(0.08, 0.125, 0)
    group.add(leftBoot, rightBoot)

    // Gloves
    const gloveGeometry = new THREE.SphereGeometry(0.08, 6, 4)
    const gloveMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.8
    })
    const leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial)
    const rightGlove = new THREE.Mesh(gloveGeometry, gloveMaterial)
    leftGlove.position.set(-0.35, 1.1, 0)
    rightGlove.position.set(0.35, 1.1, 0)
    group.add(leftGlove, rightGlove)

    // Knee pads
    const kneePadGeometry = new THREE.SphereGeometry(0.1, 6, 4)
    const kneePadMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.3
    })
    const leftKneePad = new THREE.Mesh(kneePadGeometry, kneePadMaterial)
    const rightKneePad = new THREE.Mesh(kneePadGeometry, kneePadMaterial)
    leftKneePad.position.set(-0.1, 0.5, 0)
    rightKneePad.position.set(0.1, 0.5, 0)
    group.add(leftKneePad, rightKneePad)
  }

  // Create realistic weapon models
  createWeaponModel(weaponId: string): THREE.Group {
    const group = new THREE.Group()
    group.name = `weapon_${weaponId}`

    // Weapon configurations based on type
    const weapons: { [key: string]: any } = {
      'M4A1': { type: 'assault', length: 1.2, caliber: 0.0556, color: 0x2a2a2a },
      'SCAR-H': { type: 'assault', length: 1.3, caliber: 0.0762, color: 0x1a1a1a },
      'HK416': { type: 'assault', length: 1.15, caliber: 0.0556, color: 0x333333 },
      'M110 SASS': { type: 'sniper', length: 1.8, caliber: 0.0762, color: 0x1a1a1a },
      'M24 SWS': { type: 'sniper', length: 2.0, caliber: 0.0762, color: 0x2a2a2a },
      'M9 Beretta': { type: 'pistol', length: 0.4, caliber: 0.009, color: 0x1a1a1a },
      'Glock 19': { type: 'pistol', length: 0.35, caliber: 0.009, color: 0x333333 }
    }

    const weapon = weapons[weaponId]
    if (!weapon) return group

    this.createWeaponParts(group, weapon)

    return group
  }

  private createWeaponParts(group: THREE.Group, weapon: any): void {
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: weapon.color,
      roughness: 0.6,
      metalness: 0.8
    })

    const polymerMaterial = new THREE.MeshStandardMaterial({
      color: weapon.color,
      roughness: 0.8,
      metalness: 0.2
    })

    // Main receiver
    const receiverGeometry = new THREE.BoxGeometry(
      weapon.type === 'pistol' ? 0.15 : 0.6,
      weapon.type === 'pistol' ? 0.25 : 0.3,
      weapon.type === 'pistol' ? 0.08 : 0.15
    )
    const receiver = new THREE.Mesh(receiverGeometry, metalMaterial)
    receiver.position.x = weapon.type === 'pistol' ? 0 : weapon.length * 0.2
    receiver.position.y = 0
    group.add(receiver)

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(
      weapon.caliber / 2,
      weapon.caliber / 2,
      weapon.type === 'pistol' ? weapon.length * 0.6 : weapon.length * 0.4,
      8
    )
    const barrel = new THREE.Mesh(barrelGeometry, metalMaterial)
    barrel.rotation.z = Math.PI / 2
    barrel.position.x = weapon.type === 'pistol' ? weapon.length * 0.3 : weapon.length * 0.6
    group.add(barrel)

    // Grip/handle
    const gripGeometry = new THREE.BoxGeometry(
      weapon.type === 'pistol' ? 0.08 : 0.12,
      weapon.type === 'pistol' ? 0.35 : 0.5,
      weapon.type === 'pistol' ? 0.15 : 0.2
    )
    const grip = new THREE.Mesh(gripGeometry, polymerMaterial)
    grip.position.set(
      weapon.type === 'pistol' ? -0.1 : 0,
      weapon.type === 'pistol' ? -0.2 : -0.25,
      0
    )
    group.add(grip)

    // Magazine
    const magazineGeometry = new THREE.BoxGeometry(
      weapon.type === 'pistol' ? 0.06 : 0.08,
      weapon.type === 'pistol' ? 0.4 : 0.5,
      weapon.type === 'pistol' ? 0.25 : 0.35
    )
    const magazine = new THREE.Mesh(magazineGeometry, polymerMaterial)
    magazine.position.set(
      weapon.type === 'pistol' ? -0.08 : 0.05,
      weapon.type === 'pistol' ? -0.15 : 0.1,
      weapon.type === 'pistol' ? 0.12 : 0.18
    )
    group.add(magazine)

    // Add specific features based on weapon type
    if (weapon.type === 'sniper') {
      // Scope
      const scopeGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.15)
      const scope = new THREE.Mesh(scopeGeometry, metalMaterial)
      scope.position.set(weapon.length * 0.3, 0.15, 0)
      group.add(scope)

      // Bipod
      const bipodGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.1)
      const bipod = new THREE.Mesh(bipodGeometry, metalMaterial)
      bipod.position.set(weapon.length * 0.8, -0.15, 0)
      group.add(bipod)
    } else if (weapon.type === 'assault') {
      // Rail system
      const railGeometry = new THREE.BoxGeometry(0.6, 0.02, 0.02)
      const rail = new THREE.Mesh(railGeometry, metalMaterial)
      rail.position.set(weapon.length * 0.3, 0.15, 0)
      group.add(rail)

      // Handguard
      const handguardGeometry = new THREE.BoxGeometry(0.4, 0.12, 0.12)
      const handguard = new THREE.Mesh(handguardGeometry, polymerMaterial)
      handguard.position.set(weapon.length * 0.5, 0, 0)
      group.add(handguard)
    }
  }

  // Create equipment models
  createEquipmentModel(equipmentId: string): THREE.Group {
    const group = new THREE.Group()
    group.name = `equipment_${equipmentId}`

    switch (equipmentId) {
      case 'flashbang':
        this.createFlashbang(group)
        break
      case 'smoke_grenade':
        this.createSmokeGrenade(group)
        break
      case 'breach_charge':
        this.createBreachCharge(group)
        break
      case 'medical_kit':
        this.createMedicalKit(group)
        break
      case 'c4_explosives':
        this.createC4Explosives(group)
        break
      case 'defibrillator':
        this.createDefibrillator(group)
        break
      default:
        this.createGenericEquipment(group, equipmentId)
    }

    return group
  }

  private createFlashbang(group: THREE.Group): void {
    const bodyGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.rotation.z = Math.PI / 2
    group.add(body)

    // Spoon
    const spoonGeometry = new THREE.BoxGeometry(0.06, 0.01, 0.02)
    const spoonMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    const spoon = new THREE.Mesh(spoonGeometry, spoonMaterial)
    spoon.position.set(0.06, 0, 0)
    group.add(spoon)

    // Pin
    const pinGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8)
    const pinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 })
    const pin = new THREE.Mesh(pinGeometry, pinMaterial)
    pin.position.set(-0.06, 0, 0)
    pin.rotation.z = Math.PI / 2
    group.add(pin)
  }

  private createSmokeGrenade(group: THREE.Group): void {
    const bodyGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568, // Gray
      roughness: 0.8,
      metalness: 0.2
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.rotation.z = Math.PI / 2
    group.add(body)

    // Top holes for smoke
    for (let i = 0; i < 4; i++) {
      const holeGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6)
      const hole = new THREE.Mesh(holeGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }))
      hole.position.set(0.06, Math.sin(i * Math.PI / 2) * 0.02, Math.cos(i * Math.PI / 2) * 0.02)
      group.add(hole)
    }
  }

  private createBreachCharge(group: THREE.Group): void {
    const mainGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.04)
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown
      roughness: 0.9
    })
    const main = new THREE.Mesh(mainGeometry, mainMaterial)
    group.add(main)

    // Detonator
    const detonatorGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8)
    const detonatorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const detonator = new THREE.Mesh(detonatorGeometry, detonatorMaterial)
    detonator.position.set(0.08, 0, 0)
    detonator.rotation.z = Math.PI / 2
    group.add(detonator)

    // Adhesive backing
    const backingGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.04)
    const backingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
    const backing = new THREE.Mesh(backingGeometry, backingMaterial)
    backing.position.y = -0.05
    group.add(backing)
  }

  private createMedicalKit(group: THREE.Group): void {
    const caseGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.08)
    const caseMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.2
    })
    const caseMesh = new THREE.Mesh(caseGeometry, caseMaterial)
    group.add(caseMesh)

    // Red cross
    const crossMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const crossV = new THREE.BoxGeometry(0.02, 0.12, 0.01)
    const crossH = new THREE.BoxGeometry(0.12, 0.02, 0.01)
    const crossV_mesh = new THREE.Mesh(crossV, crossMaterial)
    const crossH_mesh = new THREE.Mesh(crossH, crossMaterial)
    crossV_mesh.position.set(0, 0, 0.041)
    crossH_mesh.position.set(0, 0, 0.041)
    group.add(crossV_mesh, crossH_mesh)

    // Clasp
    const claspGeometry = new THREE.BoxGeometry(0.04, 0.03, 0.02)
    const claspMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    const clasp = new THREE.Mesh(claspGeometry, claspMaterial)
    clasp.position.set(0, 0, 0.05)
    group.add(clasp)
  }

  private createC4Explosives(group: THREE.Group): void {
    const mainGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.05)
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9
    })
    const main = new THREE.Mesh(mainGeometry, mainMaterial)
    group.add(main)

    // Digital display
    const displayGeometry = new THREE.BoxGeometry(0.08, 0.03, 0.01)
    const displayMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3
    })
    const display = new THREE.Mesh(displayGeometry, displayMaterial)
    display.position.set(0, 0, 0.03)
    group.add(display)

    // Wires
    const wireColors = [0xff0000, 0x0000ff, 0xffff00]
    wireColors.forEach((color, index) => {
      const wireGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.06, 6)
      const wireMaterial = new THREE.MeshStandardMaterial({ color })
      const wire = new THREE.Mesh(wireGeometry, wireMaterial)
      wire.position.set(-0.04 + index * 0.04, -0.05, 0.02)
      wire.rotation.x = Math.PI / 4
      group.add(wire)
    })
  }

  private createDefibrillator(group: THREE.Group): void {
    const caseGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1)
    const caseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      roughness: 0.8,
      metalness: 0.2
    })
    const caseMesh = new THREE.Mesh(caseGeometry, caseMaterial)
    group.add(caseMesh)

    // Paddles
    const paddleGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.04)
    const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
    const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
    leftPaddle.position.set(-0.12, 0.15, 0)
    rightPaddle.position.set(0.12, 0.15, 0)
    group.add(leftPaddle, rightPaddle)

    // Power indicator
    const indicatorGeometry = new THREE.SphereGeometry(0.015, 6, 4)
    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    })
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
    indicator.position.set(0, 0.11, 0.06)
    group.add(indicator)
  }

  private createGenericEquipment(group: THREE.Group, equipmentId: string): void {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8,
      metalness: 0.2
    })
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)
  }

  // Get model by ID
  getModel(modelId: string): THREE.Group | null {
    return this.models.get(modelId) || null
  }

  // Remove model from scene
  removeModel(modelId: string): void {
    const model = this.models.get(modelId)
    if (model) {
      this.scene.remove(model)
      this.models.delete(modelId)
    }
  }

  // Clear all models
  clearAllModels(): void {
    this.models.forEach((model) => {
      this.scene.remove(model)
    })
    this.models.clear()
  }
}

export default Realistic3DModeler