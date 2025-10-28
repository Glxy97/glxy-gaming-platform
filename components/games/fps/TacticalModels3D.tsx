// @ts-nocheck
import * as THREE from 'three'

/**
 * GLXY Tactical Operations - Realistic 3D Models
 * Military-grade 3D models based on actual special forces equipment
 * No sci-fi elements - only modern military equipment (2010s-2020s)
 */

export interface TacticalModelConfig {
  classType: 'assault' | 'recon' | 'marksman' | 'engineer' | 'medic'
  position: THREE.Vector3
  teamColor: 'blue' | 'tan' | 'green' | 'gray'
}

export class TacticalModelManager {
  private scene: THREE.Scene
  private textureLoader: THREE.TextureLoader
  private models: Map<string, THREE.Group> = new Map()

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.textureLoader = new THREE.TextureLoader()
  }

  // Get the scene reference
  getScene(): THREE.Scene {
    return this.scene
  }

  // Create realistic military materials
  private createTacticalMaterial(config: {
    color?: number
    roughness?: number
    metalness?: number
    fabric?: boolean
    polymer?: boolean
    emissive?: number
    emissiveIntensity?: number
  }): THREE.MeshStandardMaterial {
    const {
      color = 0x2a2a2a,
      roughness = 0.7,
      metalness = 0.3,
      fabric = false,
      polymer = false,
      emissive,
      emissiveIntensity = 0
    } = config

    const materialConfig: any = {
      color,
      roughness: fabric ? 0.9 : (polymer ? 0.4 : roughness),
      metalness: fabric ? 0.1 : (polymer ? 0.2 : metalness)
    }

    if (emissive !== undefined) {
      materialConfig.emissive = emissive
      materialConfig.emissiveIntensity = emissiveIntensity
    }

    return new THREE.MeshStandardMaterial(materialConfig)
  }

  // ASSAULT OPERATOR - Point Man / Entry Specialist
  createAssaultOperator(config: TacticalModelConfig): THREE.Group {
    const operatorGroup = new THREE.Group()

    // Base body - Modern combat uniform
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1.4, 8, 16)
    const bodyMaterial = this.createTacticalMaterial({
      color: 0x1e3a2e, // Dark green military uniform
      fabric: true
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.9
    body.castShadow = true
    operatorGroup.add(body)

    // Tactical helmet with NVG mount (Ops-Core FAST style)
    const helmetGeometry = new THREE.SphereGeometry(0.32, 16, 16)
    const helmetMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.7
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 1.65
    helmet.scale.y = 0.7 // Flattened for realistic helmet shape
    operatorGroup.add(helmet)

    // NVG mount plate on helmet
    const nvgMountGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.1)
    const nvgMountMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.4,
      metalness: 0.8
    })
    const nvgMount = new THREE.Mesh(nvgMountGeometry, nvgMountMaterial)
    nvgMount.position.set(0, 1.8, 0.25)
    operatorGroup.add(nvgMount)

    // Heavy tactical vest (Plate Carrier style)
    const vestGeometry = new THREE.BoxGeometry(0.9, 0.7, 0.15)
    const vestMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a, // Coyote brown
      roughness: 0.8,
      metalness: 0.1
    })
    const vest = new THREE.Mesh(vestGeometry, vestMaterial)
    vest.position.y = 1.0
    vest.position.z = 0.15
    operatorGroup.add(vest)

    // Magazine pouches on vest
    const magPouchGeometry = new THREE.BoxGeometry(0.25, 0.4, 0.08)
    const magPouchMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.7
    })

    // Triple mag pouch setup
    for (let i = 0; i < 3; i++) {
      const magPouch = new THREE.Mesh(magPouchGeometry, magPouchMaterial)
      magPouch.position.set(-0.2 + i * 0.2, 0.95, 0.23)
      operatorGroup.add(magPouch)
    }

    // Breach charge on chest
    const breachChargeGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.05)
    const breachChargeMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.6
    })
    const breachCharge = new THREE.Mesh(breachChargeGeometry, breachChargeMaterial)
    breachCharge.position.y = 1.2
    breachCharge.position.z = 0.23
    operatorGroup.add(breachCharge)

    // Detonator for breach charge
    const detonatorGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.04)
    const detonatorMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      polymer: true
    })
    const detonator = new THREE.Mesh(detonatorGeometry, detonatorMaterial)
    detonator.position.y = 1.25
    detonator.position.z = 0.23
    detonator.position.x = 0.2
    operatorGroup.add(detonator)

    // Combat boots
    const bootGeometry = new THREE.BoxGeometry(0.18, 0.15, 0.35)
    const bootMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.9
    })

    const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial)
    leftBoot.position.set(-0.12, -0.4, 0.05)
    operatorGroup.add(leftBoot)

    const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial)
    rightBoot.position.set(0.12, -0.4, 0.05)
    operatorGroup.add(rightBoot)

    // Knee pads
    const kneePadGeometry = new THREE.CapsuleGeometry(0.1, 0.15, 6, 12)
    const kneePadMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.7
    })

    const leftKneePad = new THREE.Mesh(kneePadGeometry, kneePadMaterial)
    leftKneePad.position.set(-0.15, -0.25, 0)
    operatorGroup.add(leftKneePad)

    const rightKneePad = new THREE.Mesh(kneePadGeometry, kneePadMaterial)
    rightKneePad.position.set(0.15, -0.25, 0)
    operatorGroup.add(rightKneePad)

    // M4A1 rifle with attachments
    const m4a1Group = this.createM4A1Rifle()
    m4a1Group.position.set(0.6, 0.8, 0.1)
    m4a1Group.rotation.z = -Math.PI / 6
    operatorGroup.add(m4a1Group)

    // Tactical gloves
    const gloveGeometry = new THREE.SphereGeometry(0.08, 8, 8)
    const gloveMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    })

    const leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial)
    leftGlove.position.set(-0.4, 0.6, 0)
    leftGlove.scale.set(1, 0.6, 1.5)
    operatorGroup.add(leftGlove)

    const rightGlove = new THREE.Mesh(gloveGeometry, gloveMaterial)
    rightGlove.position.set(0.4, 0.6, 0)
    rightGlove.scale.set(1, 0.6, 1.5)
    operatorGroup.add(rightGlove)

    operatorGroup.position.copy(config.position)
    operatorGroup.userData = {
      classType: 'assault',
      teamColor: config.teamColor,
      modelType: 'tactical_operator'
    }

    return operatorGroup
  }

  // M4A1 Rifle with realistic attachments
  private createM4A1Rifle(): THREE.Group {
    const rifleGroup = new THREE.Group()

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12)
    const barrelMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.9
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.z = Math.PI / 2
    rifleGroup.add(barrel)

    // Receiver (M4 style)
    const receiverGeometry = new THREE.BoxGeometry(0.7, 0.35, 0.25)
    const receiverMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.4,
      metalness: 0.7
    })
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
    rifleGroup.add(receiver)

    // Picatinny rail system
    const railGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.05)
    const railMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.8
    })
    const mainRail = new THREE.Mesh(railGeometry, railMaterial)
    mainRail.position.y = 0.2
    rifleGroup.add(mainRail)

    // Backup sights
    const rearSightGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.08)
    const sightMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3
    })
    const rearSight = new THREE.Mesh(rearSightGeometry, sightMaterial)
    rearSight.position.set(-0.2, 0.25, 0)
    rifleGroup.add(rearSight)

    // Forward grip (vertical grip)
    const gripGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.08)
    const gripMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      polymer: true
    })
    const forwardGrip = new THREE.Mesh(gripGeometry, gripMaterial)
    forwardGrip.position.set(0.4, -0.15, 0)
    rifleGroup.add(forwardGrip)

    // Magazine (30-round STANAG)
    const magazineGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.18)
    const magazineMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      polymer: true
    })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.y = -0.15
    rifleGroup.add(magazine)

    // Stock (adjustable M4 stock)
    const stockGeometry = new THREE.BoxGeometry(0.5, 0.25, 0.15)
    const stockMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      polymer: true
    })
    const stock = new THREE.Mesh(stockGeometry, stockMaterial)
    stock.position.x = -0.55
    rifleGroup.add(stock)

    // Pistol grip
    const pistolGripGeometry = new THREE.BoxGeometry(0.12, 0.35, 0.1)
    const pistolGripMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      polymer: true
    })
    const pistolGrip = new THREE.Mesh(pistolGripGeometry, pistolGripMaterial)
    pistolGrip.position.y = -0.2
    rifleGroup.add(pistolGrip)

    return rifleGroup
  }

  // RECON SPECIALIST - Scout / Forward Observer
  createReconSpecialist(config: TacticalModelConfig): THREE.Group {
    const reconGroup = new THREE.Group()

    // Lightweight tactical uniform
    const bodyGeometry = new THREE.CapsuleGeometry(0.32, 1.5, 8, 16)
    const bodyMaterial = this.createTacticalMaterial({
      color: 0x3a5f3a, // Multicam green pattern
      fabric: true
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.95
    body.castShadow = true
    reconGroup.add(body)

    // Lightweight helmet with comms headset
    const helmetGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const helmetMaterial = this.createTacticalMaterial({
      color: 0x4a5f4a,
      roughness: 0.7
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 1.7
    helmet.scale.y = 0.7
    reconGroup.add(helmet)

    // Communications headset
    const headsetGeometry = new THREE.BoxGeometry(0.6, 0.08, 0.12)
    const headsetMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.5
    })
    const headset = new THREE.Mesh(headsetGeometry, headsetMaterial)
    headset.position.y = 1.65
    reconGroup.add(headset)

    // Boom microphone
    const micGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.02)
    const micMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.4
    })
    const microphone = new THREE.Mesh(micGeometry, micMaterial)
    microphone.position.set(-0.3, 1.65, 0.2)
    microphone.rotation.z = Math.PI / 4
    reconGroup.add(microphone)

    // Ghillie suit elements (camouflage strips)
    const ghillieMaterial = this.createTacticalMaterial({
      color: 0x4a6741,
      roughness: 0.9
    })

    for (let i = 0; i < 8; i++) {
      const ghillieStripGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.02)
      const ghillieStrip = new THREE.Mesh(ghillieStripGeometry, ghillieMaterial)
      const angle = (i / 8) * Math.PI * 2
      ghillieStrip.position.set(
        Math.cos(angle) * 0.6,
        1.8 + Math.random() * 0.2,
        Math.sin(angle) * 0.6
      )
      ghillieStrip.rotation.z = (Math.random() - 0.5) * Math.PI / 4
      ghillieStrip.rotation.x = (Math.random() - 0.5) * Math.PI / 4
      reconGroup.add(ghillieStrip)
    }

    // Lightweight chest rig
    const chestRigGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1)
    const chestRigMaterial = this.createTacticalMaterial({
      color: 0x3a5f3a,
      fabric: true
    })
    const chestRig = new THREE.Mesh(chestRigGeometry, chestRigMaterial)
    chestRig.position.y = 1.0
    chestRig.position.z = 0.12
    reconGroup.add(chestRig)

    // Surveillance backpack
    const backpackGeometry = new THREE.BoxGeometry(0.35, 0.5, 0.2)
    const backpackMaterial = this.createTacticalMaterial({
      color: 0x4a5f4a,
      roughness: 0.8
    })
    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial)
    backpack.position.y = 1.3
    backpack.position.z = -0.2
    reconGroup.add(backpack)

    // Binoculars on chest
    const binocularsGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.12)
    const binocularsMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3
    })
    const binoculars = new THREE.Mesh(binocularsGeometry, binocularsMaterial)
    binoculars.position.y = 1.1
    binoculars.position.z = 0.18
    reconGroup.add(binoculars)

    // M110 SASS sniper rifle
    const m110Group = this.createM110SASS()
    m110Group.position.set(0.7, 0.8, 0.1)
    m110Group.rotation.z = -Math.PI / 6
    reconGroup.add(m110Group)

    reconGroup.position.copy(config.position)
    reconGroup.userData = {
      classType: 'recon',
      teamColor: config.teamColor,
      modelType: 'tactical_operator'
    }

    return reconGroup
  }

  // M110 SASS (Semi-Automatic Sniper System)
  private createM110SASS(): THREE.Group {
    const sniperGroup = new THREE.Group()

    // Heavy barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 16)
    const barrelMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.9
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.z = Math.PI / 2
    sniperGroup.add(barrel)

    // Sniper receiver
    const receiverGeometry = new THREE.BoxGeometry(0.9, 0.4, 0.3)
    const receiverMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.8
    })
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
    sniperGroup.add(receiver)

    // Scope rail (20 MOA rail)
    const scopeRailGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.05)
    const scopeRailMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.2
    })
    const scopeRail = new THREE.Mesh(scopeRailGeometry, scopeRailMaterial)
    scopeRail.position.y = 0.25
    sniperGroup.add(scopeRail)

    // Variable power scope (3.5-21x)
    const scopeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16)
    const scopeMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.2
    })
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial)
    scope.position.set(0.2, 0.3, 0)
    scope.rotation.z = Math.PI / 2
    sniperGroup.add(scope)

    // Scope lens caps
    const lensCapGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16)
    const lensCapMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.6
    })

    const frontLensCap = new THREE.Mesh(lensCapGeometry, lensCapMaterial)
    frontLensCap.position.set(0.5, 0.3, 0)
    frontLensCap.rotation.z = Math.PI / 2
    sniperGroup.add(frontLensCap)

    // Bipod (deployable)
    const bipodLegGeometry = new THREE.BoxGeometry(0.04, 0.3, 0.04)
    const bipodMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.4
    })

    const leftLeg = new THREE.Mesh(bipodLegGeometry, bipodMaterial)
    leftLeg.position.set(0.6, -0.2, 0.15)
    leftLeg.rotation.x = Math.PI / 6
    sniperGroup.add(leftLeg)

    const rightLeg = new THREE.Mesh(bipodLegGeometry, bipodMaterial)
    rightLeg.position.set(0.6, -0.2, -0.15)
    rightLeg.rotation.x = -Math.PI / 6
    sniperGroup.add(rightLeg)

    // Magazine (20-round)
    const magazineGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.2)
    const magazineMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      polymer: true
    })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.y = -0.1
    sniperGroup.add(magazine)

    return sniperGroup
  }

  // Create complete tactical environment
  createTacticalEnvironment(): void {
    // Create realistic battlefield environment
    this.createConcreteBarriers()
    this.createSandbagPositions()
    this.createWatchtowers()
    this.createMilitaryVehicles()
    this.createUrbanStructures()
  }

  private createConcreteBarriers(): void {
    const barrierPositions = [
      { x: 20, z: 15 },
      { x: -25, z: 20 },
      { x: 15, z: -30 },
      { x: -20, z: -25 },
      { x: 0, z: 35 }
    ]

    barrierPositions.forEach(pos => {
      const barrierGeometry = new THREE.BoxGeometry(4, 2, 0.8)
      const barrierMaterial = this.createTacticalMaterial({
        color: 0x808080,
        roughness: 0.9
      })
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial)
      barrier.position.set(pos.x, 1, pos.z)
      barrier.castShadow = true
      barrier.receiveShadow = true
      this.scene.add(barrier)
    })
  }

  private createSandbagPositions(): void {
    const sandbagPositions = [
      { x: 10, z: 10 },
      { x: -15, z: 15 },
      { x: 25, z: -20 },
      { x: -30, z: -10 }
    ]

    sandbagPositions.forEach(pos => {
      for (let i = 0; i < 6; i++) {
        const sandbagGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.5)
        const sandbagMaterial = this.createTacticalMaterial({
          color: 0x8B7355,
          roughness: 1
        })
        const sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial)
        sandbag.position.set(pos.x + (i % 2) * 0.3, 0.15 + Math.floor(i / 2) * 0.3, pos.z + Math.floor(i / 2) * 0.5)
        sandbag.castShadow = true
        this.scene.add(sandbag)
      }
    })
  }

  private createWatchtowers(): void {
    const towerPositions = [
      { x: 40, z: 40 },
      { x: -45, z: 35 }
    ]

    towerPositions.forEach(pos => {
      const towerGroup = new THREE.Group()

      // Tower structure
      for (let i = 0; i < 8; i++) {
        const legGeometry = new THREE.BoxGeometry(0.3, 5, 0.3)
        const legMaterial = this.createTacticalMaterial({
          color: 0x2a2a2a,
          roughness: 0.8
        })
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        const angle = (i / 4) * Math.PI * 2
        leg.position.set(
          Math.cos(angle) * 2,
          2.5,
          Math.sin(angle) * 2
        )
        towerGroup.add(leg)
      }

      towerGroup.position.set(pos.x, 0, pos.z)
      this.scene.add(towerGroup)
    })
  }

  private createMilitaryVehicles(): void {
    // HMMWV/MRAP style vehicles
    const vehiclePositions = [
      { x: 30, z: -40 },
      { x: -35, z: 30 }
    ]

    vehiclePositions.forEach(pos => {
      const vehicleGroup = new THREE.Group()

      // Vehicle body
      const bodyGeometry = new THREE.BoxGeometry(5, 1.8, 2.5)
      const bodyMaterial = this.createTacticalMaterial({
        color: 0x4a5f4a, // Military green
        roughness: 0.7
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.position.y = 1.5
      vehicleGroup.add(body)

      // Wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12)
      const wheelMaterial = this.createTacticalMaterial({
        color: 0x1a1a1a,
        roughness: 0.8
      })

      const wheelPositions = [
        { x: -1.5, z: 1 },
        { x: 1.5, z: 1 },
        { x: -1.5, z: -1 },
        { x: 1.5, z: -1 }
      ]

      wheelPositions.forEach(wheelPos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
        wheel.position.set(wheelPos.x, 0.6, wheelPos.z)
        wheel.rotation.z = Math.PI / 2
        vehicleGroup.add(wheel)
      })

      vehicleGroup.position.set(pos.x, 0, pos.z)
      this.scene.add(vehicleGroup)
    })
  }

  private createUrbanStructures(): void {
    // Simple urban buildings
    const buildingPositions = [
      { x: 50, z: 0, width: 8, depth: 8, height: 15 },
      { x: -55, z: 0, width: 6, depth: 10, height: 12 },
      { x: 0, z: 55, width: 10, depth: 6, height: 18 }
    ]

    buildingPositions.forEach(building => {
      const buildingGeometry = new THREE.BoxGeometry(building.width, building.height, building.depth)
      const buildingMaterial = this.createTacticalMaterial({
        color: 0x696969,
        roughness: 0.8
      })
      const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial)
      buildingMesh.position.set(building.x, building.height / 2, building.z)
      buildingMesh.castShadow = true
      buildingMesh.receiveShadow = true
      this.scene.add(buildingMesh)
    })
  }

  // MARKSMAN OPERATOR - Designated Marksman
  createMarksmanOperator(config: TacticalModelConfig): THREE.Group {
    const marksmanGroup = new THREE.Group()

    // Lightweight combat uniform
    const bodyGeometry = new THREE.CapsuleGeometry(0.33, 1.6, 8, 16)
    const bodyMaterial = this.createTacticalMaterial({
      color: 0x4a5f3a, // Woodland camo
      fabric: true
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.0
    body.castShadow = true
    marksmanGroup.add(body)

    // Boonie hat with camouflage
    const boonieGeometry = new THREE.ConeGeometry(0.35, 0.2, 16)
    const boonieMaterial = this.createTacticalMaterial({
      color: 0x5a6f4a,
      roughness: 0.8,
      fabric: true
    })
    const boonieHat = new THREE.Mesh(boonieGeometry, boonieMaterial)
    boonieHat.position.y = 1.75
    boonieHat.rotation.z = Math.PI
    marksmanGroup.add(boonieHat)

    // Ghillie hood with camouflage strips
    const ghillieHoodGeometry = new THREE.CapsuleGeometry(0.38, 0.4, 8, 16)
    const ghillieHoodMaterial = this.createTacticalMaterial({
      color: 0x3a5f2a,
      roughness: 0.9
    })
    const ghillieHood = new THREE.Mesh(ghillieHoodGeometry, ghillieHoodMaterial)
    ghillieHood.position.y = 1.6
    marksmanGroup.add(ghillieHood)

    // Extended camouflage strips on ghillie hood
    const camoStripMaterial = this.createTacticalMaterial({
      color: 0x4a6741,
      roughness: 0.95
    })

    for (let i = 0; i < 12; i++) {
      const stripGeometry = new THREE.BoxGeometry(0.02, 0.4, 0.02)
      const strip = new THREE.Mesh(stripGeometry, camoStripMaterial)
      const angle = (i / 12) * Math.PI * 2
      strip.position.set(
        Math.cos(angle) * 0.45,
        1.7 + Math.random() * 0.3,
        Math.sin(angle) * 0.45
      )
      strip.rotation.x = (Math.random() - 0.5) * Math.PI / 3
      strip.rotation.z = (Math.random() - 0.5) * Math.PI / 3
      marksmanGroup.add(strip)
    }

    // Lightweight chest rig
    const chestRigGeometry = new THREE.BoxGeometry(0.75, 0.55, 0.08)
    const chestRigMaterial = this.createTacticalMaterial({
      color: 0x4a5f3a,
      fabric: true
    })
    const chestRig = new THREE.Mesh(chestRigGeometry, chestRigMaterial)
    chestRig.position.y = 1.05
    chestRig.position.z = 0.1
    marksmanGroup.add(chestRig)

    // Bipod on leg (deployable shooting support)
    const legBipodGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.1)
    const legBipodMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.4,
      metalness: 0.7
    })
    const legBipod = new THREE.Mesh(legBipodGeometry, legBipodMaterial)
    legBipod.position.set(-0.25, -0.3, 0.1)
    marksmanGroup.add(legBipod)

    // Rangefinder pouch
    const rangefinderPouchGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.06)
    const rangefinderPouchMaterial = this.createTacticalMaterial({
      color: 0x3a4f3a,
      roughness: 0.8
    })
    const rangefinderPouch = new THREE.Mesh(rangefinderPouchGeometry, rangefinderPouchMaterial)
    rangefinderPouch.position.y = 1.1
    rangefinderPouch.position.z = 0.15
    marksmanGroup.add(rangefinderPouch)

    // M24 SWS sniper rifle
    const m24Group = this.createM24SWS()
    m24Group.position.set(0.8, 0.9, 0.1)
    m24Group.rotation.z = -Math.PI / 5
    marksmanGroup.add(m24Group)

    marksmanGroup.position.copy(config.position)
    marksmanGroup.userData = {
      classType: 'marksman',
      teamColor: config.teamColor,
      modelType: 'tactical_operator'
    }

    return marksmanGroup
  }

  // M24 SWS (Sniper Weapon System)
  private createM24SWS(): THREE.Group {
    const m24Group = new THREE.Group()

    // Heavy match-grade barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16)
    const barrelMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.15,
      metalness: 0.95
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.z = Math.PI / 2
    m24Group.add(barrel)

    // Bolt-action receiver
    const receiverGeometry = new THREE.BoxGeometry(0.8, 0.35, 0.28)
    const receiverMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.25,
      metalness: 0.85
    })
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
    m24Group.add(receiver)

    // Bolt handle
    const boltGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.08)
    const boltMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.2
    })
    const bolt = new THREE.Mesh(boltGeometry, boltMaterial)
    bolt.position.set(0.1, 0.2, 0.15)
    bolt.rotation.z = Math.PI / 4
    m24Group.add(bolt)

    // Tactical rail system
    const railGeometry = new THREE.BoxGeometry(0.7, 0.04, 0.04)
    const railMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.2
    })
    const rail = new THREE.Mesh(railGeometry, railMaterial)
    rail.position.y = 0.22
    m24Group.add(rail)

    // High-power scope (10x-42x)
    const scopeGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.8, 16)
    const scopeMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.15
    })
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial)
    scope.position.set(0.3, 0.28, 0)
    scope.rotation.z = Math.PI / 2
    m24Group.add(scope)

    // Scope rings
    const scopeRingGeometry = new THREE.TorusGeometry(0.09, 0.02, 8, 16)
    const scopeRingMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.3
    })

    const frontRing = new THREE.Mesh(scopeRingGeometry, scopeRingMaterial)
    frontRing.position.set(0.1, 0.28, 0)
    frontRing.rotation.x = Math.PI / 2
    m24Group.add(frontRing)

    const rearRing = new THREE.Mesh(scopeRingGeometry, scopeRingMaterial)
    rearRing.position.set(0.5, 0.28, 0)
    rearRing.rotation.x = Math.PI / 2
    m24Group.add(rearRing)

    // Adjustable bipod (Harris style)
    const bipodBaseGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.15)
    const bipodBaseMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.4
    })
    const bipodBase = new THREE.Mesh(bipodBaseGeometry, bipodBaseMaterial)
    bipodBase.position.set(0.9, -0.05, 0)
    m24Group.add(bipodBase)

    // Bipod legs
    const bipodLegGeometry = new THREE.BoxGeometry(0.03, 0.4, 0.03)
    const bipodLegMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.4
    })

    const leftBipodLeg = new THREE.Mesh(bipodLegGeometry, bipodLegMaterial)
    leftBipodLeg.position.set(0.9, -0.3, 0.1)
    leftBipodLeg.rotation.x = Math.PI / 6
    m24Group.add(leftBipodLeg)

    const rightBipodLeg = new THREE.Mesh(bipodLegGeometry, bipodLegMaterial)
    rightBipodLeg.position.set(0.9, -0.3, -0.1)
    rightBipodLeg.rotation.x = -Math.PI / 6
    m24Group.add(rightBipodLeg)

    // 5-round internal magazine
    const magazineGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.15)
    const magazineMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3
    })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.y = -0.05
    m24Group.add(magazine)

    // Cheek rest
    const cheekRestGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.12)
    const cheekRestMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.6
    })
    const cheekRest = new THREE.Mesh(cheekRestGeometry, cheekRestMaterial)
    cheekRest.position.set(-0.3, 0.15, 0)
    m24Group.add(cheekRest)

    return m24Group
  }

  // COMBAT ENGINEER - Combat Engineer / Demolitions
  createCombatEngineer(config: TacticalModelConfig): THREE.Group {
    const engineerGroup = new THREE.Group()

    // Combat uniform
    const bodyGeometry = new THREE.CapsuleGeometry(0.36, 1.4, 8, 16)
    const bodyMaterial = this.createTacticalMaterial({
      color: 0x4a4a4a, // Gray combat uniform
      fabric: true
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.9
    body.castShadow = true
    engineerGroup.add(body)

    // Yellow construction helmet with visor
    const helmetGeometry = new THREE.SphereGeometry(0.34, 16, 16)
    const helmetMaterial = this.createTacticalMaterial({
      color: 0xffd700, // Yellow construction helmet
      roughness: 0.6
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 1.7
    helmet.scale.y = 0.7
    engineerGroup.add(helmet)

    // Protective visor
    const visorGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.05)
    const visorMaterial = this.createTacticalMaterial({
      color: 0x333333,
      roughness: 0.1,
      metalness: 0.9
    })
    const visor = new THREE.Mesh(visorGeometry, visorMaterial)
    visor.position.y = 1.6
    visor.position.z = 0.25
    visor.rotation.x = Math.PI / 6
    engineerGroup.add(visor)

    // Heavy tool belt with actual tools
    const toolBeltGeometry = new THREE.BoxGeometry(0.9, 0.12, 0.15)
    const toolBeltMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.8
    })
    const toolBelt = new THREE.Mesh(toolBeltGeometry, toolBeltMaterial)
    toolBelt.position.y = 0.6
    toolBelt.position.z = 0.05
    engineerGroup.add(toolBelt)

    // Hammer on tool belt
    const hammerGeometry = new THREE.BoxGeometry(0.12, 0.25, 0.04)
    const hammerMaterial = this.createTacticalMaterial({
      color: 0x8B4513, // Wooden handle
      roughness: 0.8
    })
    const hammer = new THREE.Mesh(hammerGeometry, hammerMaterial)
    hammer.position.set(-0.3, 0.65, 0.1)
    hammer.rotation.z = Math.PI / 8
    engineerGroup.add(hammer)

    // Wrench on tool belt
    const wrenchGeometry = new THREE.BoxGeometry(0.08, 0.22, 0.02)
    const wrenchMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.4,
      metalness: 0.8
    })
    const wrench = new THREE.Mesh(wrenchGeometry, wrenchMaterial)
    wrench.position.set(0, 0.65, 0.1)
    engineerGroup.add(wrench)

    // Pliers on tool belt
    const pliersGeometry = new THREE.BoxGeometry(0.06, 0.18, 0.03)
    const pliersMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3
    })
    const pliers = new THREE.Mesh(pliersGeometry, pliersMaterial)
    pliers.position.set(0.3, 0.65, 0.1)
    engineerGroup.add(pliers)

    // C4 explosives with detonator
    const c4Geometry = new THREE.BoxGeometry(0.2, 0.12, 0.08)
    const c4Material = this.createTacticalMaterial({
      color: 0xdaa520, // C4 clay color
      roughness: 0.6
    })
    const c4 = new THREE.Mesh(c4Geometry, c4Material)
    c4.position.y = 1.1
    c4.position.z = 0.15
    engineerGroup.add(c4)

    // Digital display on C4
    const displayGeometry = new THREE.BoxGeometry(0.12, 0.06, 0.02)
    const displayMaterial = this.createTacticalMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3
    })
    const display = new THREE.Mesh(displayGeometry, displayMaterial)
    display.position.y = 1.1
    display.position.z = 0.19
    engineerGroup.add(display)

    // Wires on C4
    const wireGeometry = new THREE.BoxGeometry(0.05, 0.02, 0.01)
    const wireMaterial = this.createTacticalMaterial({
      color: 0xff0000, // Red wire
      roughness: 0.4
    })
    const wire = new THREE.Mesh(wireGeometry, wireMaterial)
    wire.position.set(0.08, 1.14, 0.16)
    engineerGroup.add(wire)

    // Detonator device
    const detonatorDeviceGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.04)
    const detonatorDeviceMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.5
    })
    const detonatorDevice = new THREE.Mesh(detonatorDeviceGeometry, detonatorDeviceMaterial)
    detonatorDevice.position.y = 1.15
    detonatorDevice.position.z = 0.15
    detonatorDevice.position.x = 0.3
    engineerGroup.add(detonatorDevice)

    // Safety switch on detonator
    const switchGeometry = new THREE.BoxGeometry(0.02, 0.04, 0.01)
    const switchMaterial = this.createTacticalMaterial({
      color: 0xff0000,
      roughness: 0.3
    })
    const safetySwitch = new THREE.Mesh(switchGeometry, switchMaterial)
    safetySwitch.position.y = 1.17
    safetySwitch.position.z = 0.17
    safetySwitch.position.x = 0.3
    engineerGroup.add(safetySwitch)

    // SCAR-H rifle
    const scarhGroup = this.createSCARH()
    scarhGroup.position.set(0.7, 0.8, 0.1)
    scarhGroup.rotation.z = -Math.PI / 6
    engineerGroup.add(scarhGroup)

    engineerGroup.position.copy(config.position)
    engineerGroup.userData = {
      classType: 'engineer',
      teamColor: config.teamColor,
      modelType: 'tactical_operator'
    }

    return engineerGroup
  }

  // SCAR-H (Special Operations Forces Combat Rifle - Heavy)
  private createSCARH(): THREE.Group {
    const scarhGroup = new THREE.Group()

    // Heavy barrel (7.62mm)
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.3, 12)
    const barrelMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.9
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.z = Math.PI / 2
    scarhGroup.add(barrel)

    // SCAR receiver
    const receiverGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3)
    const receiverMaterial = this.createTacticalMaterial({
      color: 0x3a3a3a, // Flat dark earth
      roughness: 0.4,
      metalness: 0.7
    })
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
    scarhGroup.add(receiver)

    // Folding stock
    const stockGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.15)
    const stockMaterial = this.createTacticalMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      polymer: true
    })
    const stock = new THREE.Mesh(stockGeometry, stockMaterial)
    stock.position.x = -0.5
    scarhGroup.add(stock)

    // Picatinny rails
    const railGeometry = new THREE.BoxGeometry(0.7, 0.04, 0.04)
    const railMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3
    })
    const mainRail = new THREE.Mesh(railGeometry, railMaterial)
    mainRail.position.y = 0.25
    scarhGroup.add(mainRail)

    // 20-round magazine (7.62mm)
    const magazineGeometry = new THREE.BoxGeometry(0.12, 0.6, 0.22)
    const magazineMaterial = this.createTacticalMaterial({
      color: 0x3a3a3a,
      polymer: true
    })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.y = -0.15
    scarhGroup.add(magazine)

    // Pistol grip
    const pistolGripGeometry = new THREE.BoxGeometry(0.14, 0.38, 0.12)
    const pistolGripMaterial = this.createTacticalMaterial({
      color: 0x3a3a3a,
      polymer: true
    })
    const pistolGrip = new THREE.Mesh(pistolGripGeometry, pistolGripMaterial)
    pistolGrip.position.y = -0.22
    scarhGroup.add(pistolGrip)

    return scarhGroup
  }

  // FIELD MEDIC - Combat Medic / Medical Specialist
  createFieldMedic(config: TacticalModelConfig): THREE.Group {
    const medicGroup = new THREE.Group()

    // Medical uniform
    const bodyGeometry = new THREE.CapsuleGeometry(0.34, 1.5, 8, 16)
    const bodyMaterial = this.createTacticalMaterial({
      color: 0x2a4a6a, // Blue tactical uniform
      fabric: true
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.95
    body.castShadow = true
    medicGroup.add(body)

    // Blue helmet with red cross emblem
    const helmetGeometry = new THREE.SphereGeometry(0.32, 16, 16)
    const helmetMaterial = this.createTacticalMaterial({
      color: 0x4169e1, // UN blue
      roughness: 0.6
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 1.68
    helmet.scale.y = 0.7
    medicGroup.add(helmet)

    // Red cross emblem on helmet
    const crossGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.02)
    const crossMaterial = this.createTacticalMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.2
    })
    const helmetCross = new THREE.Mesh(crossGeometry, crossMaterial)
    helmetCross.position.y = 1.68
    helmetCross.position.z = 0.32
    medicGroup.add(helmetCross)

    // Medical vest with red markings
    const vestGeometry = new THREE.BoxGeometry(0.85, 0.65, 0.12)
    const vestMaterial = this.createTacticalMaterial({
      color: 0x4169e1,
      roughness: 0.7
    })
    const vest = new THREE.Mesh(vestGeometry, vestMaterial)
    vest.position.y = 1.0
    vest.position.z = 0.14
    medicGroup.add(vest)

    // Red crosses on vest
    for (let i = 0; i < 2; i++) {
      const vestCross = new THREE.Mesh(crossGeometry, crossMaterial)
      vestCross.position.set(-0.2 + i * 0.4, 1.0, 0.2)
      medicGroup.add(vestCross)
    }

    // Medical kit on back with red cross
    const medKitGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.18)
    const medKitMaterial = this.createTacticalMaterial({
      color: 0x2a4a6a,
      roughness: 0.8
    })
    const medKit = new THREE.Mesh(medKitGeometry, medKitMaterial)
    medKit.position.y = 1.3
    medKit.position.z = -0.2
    medicGroup.add(medKit)

    // Red cross on medical kit
    const kitCross = new THREE.Mesh(crossGeometry, crossMaterial)
    kitCross.position.y = 1.3
    kitCross.position.z = -0.3
    kitCross.scale.set(1.2, 1.2, 1)
    medicGroup.add(kitCross)

    // Defibrillator paddles
    const paddleGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.08)
    const paddleMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.8
    })

    const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
    leftPaddle.position.set(-0.25, 0.7, 0.2)
    leftPaddle.rotation.z = Math.PI / 4
    medicGroup.add(leftPaddle)

    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
    rightPaddle.position.set(0.25, 0.7, 0.2)
    rightPaddle.rotation.z = -Math.PI / 4
    medicGroup.add(rightPaddle)

    // Power indicator on defibrillator
    const indicatorGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    const indicatorMaterial = this.createTacticalMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8
    })
    const powerIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
    powerIndicator.position.y = 0.75
    powerIndicator.position.z = 0.25
    medicGroup.add(powerIndicator)

    // Tourniquet pouches
    const tourniquetGeometry = new THREE.BoxGeometry(0.1, 0.18, 0.06)
    const tourniquetMaterial = this.createTacticalMaterial({
      color: 0xff0000,
      roughness: 0.8
    })

    for (let i = 0; i < 3; i++) {
      const tourniquet = new THREE.Mesh(tourniquetGeometry, tourniquetMaterial)
      tourniquet.position.set(-0.25 + i * 0.25, 0.85, 0.18)
      medicGroup.add(tourniquet)
    }

    // M4 Carbine rifle
    const m4CarbineGroup = this.createM4Carbine()
    m4CarbineGroup.position.set(0.6, 0.8, 0.1)
    m4CarbineGroup.rotation.z = -Math.PI / 6
    medicGroup.add(m4CarbineGroup)

    medicGroup.position.copy(config.position)
    medicGroup.userData = {
      classType: 'medic',
      teamColor: config.teamColor,
      modelType: 'tactical_operator'
    }

    return medicGroup
  }

  // M4 Carbine (Medical version)
  private createM4Carbine(): THREE.Group {
    const m4Group = new THREE.Group()

    // Carbine length barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 12)
    const barrelMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.9
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.z = Math.PI / 2
    m4Group.add(barrel)

    // M4 receiver
    const receiverGeometry = new THREE.BoxGeometry(0.65, 0.32, 0.25)
    const receiverMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.4,
      metalness: 0.7
    })
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial)
    m4Group.add(receiver)

    // Collapsible stock
    const stockGeometry = new THREE.BoxGeometry(0.4, 0.22, 0.12)
    const stockMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      polymer: true
    })
    const stock = new THREE.Mesh(stockGeometry, stockMaterial)
    stock.position.x = -0.45
    m4Group.add(stock)

    // Magazine (30-round)
    const magazineGeometry = new THREE.BoxGeometry(0.1, 0.45, 0.18)
    const magazineMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      polymer: true
    })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.y = -0.12
    m4Group.add(magazine)

    // Pistol grip
    const pistolGripGeometry = new THREE.BoxGeometry(0.12, 0.32, 0.1)
    const pistolGripMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      polymer: true
    })
    const pistolGrip = new THREE.Mesh(pistolGripGeometry, pistolGripMaterial)
    pistolGrip.position.y = -0.18
    m4Group.add(pistolGrip)

    return m4Group
  }

  // TACTICAL EQUIPMENT MODELS
  createTacticalEquipment(): Map<string, THREE.Group> {
    const equipment = new Map<string, THREE.Group>()

    // Flashbang grenade with spoon and pin
    const flashbangGroup = new THREE.Group()
    const flashbangBodyGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16)
    const flashbangBodyMaterial = this.createTacticalMaterial({
      color: 0x1a1a1a,
      roughness: 0.4
    })
    const flashbangBody = new THREE.Mesh(flashbangBodyGeometry, flashbangBodyMaterial)
    flashbangBody.rotation.z = Math.PI / 2
    flashbangGroup.add(flashbangBody)

    // Spoon
    const spoonGeometry = new THREE.BoxGeometry(0.06, 0.02, 0.01)
    const spoonMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3
    })
    const spoon = new THREE.Mesh(spoonGeometry, spoonMaterial)
    spoon.position.set(-0.06, 0, 0)
    flashbangGroup.add(spoon)

    // Pin
    const pinGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.08)
    const pinMaterial = this.createTacticalMaterial({
      color: 0xffd700,
      roughness: 0.3
    })
    const pin = new THREE.Mesh(pinGeometry, pinMaterial)
    pin.position.set(0, 0, 0.05)
    pin.rotation.x = Math.PI / 2
    flashbangGroup.add(pin)

    equipment.set('flashbang', flashbangGroup)

    // Smoke grenade with emission holes
    const smokeGroup = new THREE.Group()
    const smokeBodyGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.13, 16)
    const smokeBodyMaterial = this.createTacticalMaterial({
      color: 0x4a5f2a, // Olive drab
      roughness: 0.6
    })
    const smokeBody = new THREE.Mesh(smokeBodyGeometry, smokeBodyMaterial)
    smokeBody.rotation.z = Math.PI / 2
    smokeGroup.add(smokeBody)

    // Emission holes
    const holeGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8)
    const holeMaterial = this.createTacticalMaterial({
      color: 0x000000
    })

    for (let i = 0; i < 6; i++) {
      const hole = new THREE.Mesh(holeGeometry, holeMaterial)
      const angle = (i / 6) * Math.PI * 2
      hole.position.set(Math.cos(angle) * 0.045, 0, Math.sin(angle) * 0.045)
      smokeGroup.add(hole)
    }

    equipment.set('smoke', smokeGroup)

    // Medical kit with red cross and clasp
    const medicalKitGroup = new THREE.Group()
    const kitBoxGeometry = new THREE.BoxGeometry(0.25, 0.18, 0.12)
    const kitBoxMaterial = this.createTacticalMaterial({
      color: 0xffffff,
      roughness: 0.7
    })
    const kitBox = new THREE.Mesh(kitBoxGeometry, kitBoxMaterial)
    medicalKitGroup.add(kitBox)

    // Red cross on medical kit
    const kitCrossGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.02)
    const kitCrossMaterial = this.createTacticalMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.2
    })
    const kitCross = new THREE.Mesh(kitCrossGeometry, kitCrossMaterial)
    kitCross.position.z = 0.07
    medicalKitGroup.add(kitCross)

    // Clasp
    const claspGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.03)
    const claspMaterial = this.createTacticalMaterial({
      color: 0x2a2a2a,
      roughness: 0.3
    })
    const clasp = new THREE.Mesh(claspGeometry, claspMaterial)
    clasp.position.set(0, 0, 0.07)
    medicalKitGroup.add(clasp)

    equipment.set('medical_kit', medicalKitGroup)

    return equipment
  }

  public dispose(): void {
    this.models.forEach(model => {
      this.scene.remove(model)
    })
    this.models.clear()
  }
}

export default TacticalModelManager