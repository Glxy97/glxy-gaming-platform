// @ts-nocheck
'use client'

import * as THREE from 'three'

// TACTICAL EQUIPMENT SYSTEM - GRANDES, GADGETS, MELEE, HEALING!
export interface TacticalEquipment {
  id: string
  name: string
  type: 'grenade' | 'smoke' | 'flash' | 'molotov' | 'proximity_mine' | 'claymore' | 'c4' | 'emp' |
         'drone' | 'motion_sensor' | 'thermal_vision' | 'medkit' | 'bandage' | 'defibrillator' |
         'combat_knife' | 'tactical_machete' | 'throwing_knife' | 'stun_gun' | 'grappling_hook'
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  slot: 'grenade' | 'equipment' | 'melee' | 'healing'
  quantity: number
  maxQuantity: number
  cooldown: number
  cooldownRemaining: number
  activationTime: number // Time to activate/throw
  duration: number // Effect duration
  radius: number // Effect radius
  damage?: number
  healing?: number
  effects: EquipmentEffect[]
  unlockLevel: number
  cost: number
  requirements?: {
    playerLevel?: number
    class?: string[]
    gameMode?: string[]
  }
  visualModel?: THREE.Object3D
  soundEffects: string[]
}

export interface EquipmentEffect {
  type: 'damage' | 'heal' | 'blind' | 'deafen' | 'slow' | 'stun' | 'reveal' | 'disarm' |
         'explosion' | 'fire' | 'smoke' | 'emp' | 'poison' | 'mark' | 'shield' | 'speed_boost'
  value: number
  duration: number
  radius?: number
  stacks?: boolean
}

export interface GrenadePhysics {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  angularVelocity: THREE.Euler
  gravity: number
  bounceCount: number
  maxBounces: number
  isCooking: boolean
  cookingTime: number
  throwPower: number
}

export interface DroneController {
  isActive: boolean
  position: THREE.Vector3
  rotation: THREE.Euler
  battery: number
  maxBattery: number
  speed: number
  height: number
  camera: THREE.PerspectiveCamera
  nightVision: boolean
  thermalVision: boolean
  controls: {
    forward: boolean
    backward: boolean
    left: boolean
    right: boolean
    up: boolean
    down: boolean
    boost: boolean
  }
}

export interface MineSystem {
  position: THREE.Vector3
  type: 'proximity' | 'tripwire' | 'pressure' | 'remote' | 'directional'
  isArmed: boolean
  triggerRadius: number
  triggerCondition: any
  damage: number
  visualModel: THREE.Object3D
  triggerEffect: string[]
}

export class GLXYTacticalEquipment {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private physicsEngine: any
  private equipment: Map<string, TacticalEquipment[]>
  private activeEquipment: Map<string, any>
  private throwables: Map<string, GrenadePhysics[]>
  private drones: Map<string, DroneController>
  private mines: Map<string, MineSystem>
  private playerPosition: THREE.Vector3
  private playerLevel: number
  private playerClass: string
  private equipmentModels: Map<string, THREE.Object3D>
  private soundEffects: Map<string, HTMLAudioElement>
  private visualEffects: Map<string, any>

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, physicsEngine?: any) {
    this.scene = scene
    this.camera = camera
    this.physicsEngine = physicsEngine
    this.equipment = new Map()
    this.activeEquipment = new Map()
    this.throwables = new Map()
    this.drones = new Map()
    this.mines = new Map()
    this.playerPosition = new THREE.Vector3()
    this.playerLevel = 1
    this.playerClass = 'vanguard'
    this.equipmentModels = new Map()
    this.soundEffects = new Map()
    this.visualEffects = new Map()

    this.initializeEquipment()
    this.createEquipmentModels()
    this.loadSoundEffects()
    this.createVisualEffects()
  }

  // Initialize available equipment
  private initializeEquipment(): void {
    const equipment: TacticalEquipment[] = [
      // Grenades
      {
        id: 'frag_grenade',
        name: 'Fragmentation Grenade',
        type: 'grenade',
        description: 'Standard explosive grenade with shrapnel damage',
        icon: '💣',
        rarity: 'common',
        slot: 'grenade',
        quantity: 2,
        maxQuantity: 3,
        cooldown: 0,
        cooldownRemaining: 0,
        activationTime: 0.5,
        duration: 0,
        radius: 5,
        damage: 80,
        effects: [
          { type: 'damage', value: 80, duration: 0, radius: 5 },
          { type: 'explosion', value: 1, duration: 0, radius: 5 }
        ],
        unlockLevel: 1,
        cost: 200,
        soundEffects: ['grenade_pin', 'grenade_throw', 'explosion']
      },
      {
        id: 'smoke_grenade',
        name: 'Smoke Grenade',
        type: 'smoke',
        description: 'Creates a thick smoke screen for concealment',
        icon: '🌫️',
        rarity: 'common',
        slot: 'grenade',
        quantity: 2,
        maxQuantity: 3,
        cooldown: 0,
        cooldownRemaining: 0,
        activationTime: 0.5,
        duration: 15,
        radius: 8,
        effects: [
          { type: 'smoke', value: 1, duration: 15, radius: 8 },
          { type: 'blind', value: 0.5, duration: 3, radius: 8 }
        ],
        unlockLevel: 1,
        cost: 150,
        soundEffects: ['grenade_pin', 'grenade_throw', 'smoke_deploy']
      },
      {
        id: 'flash_grenade',
        name: 'Flashbang',
        type: 'flash',
        description: 'Disorients enemies with bright flash and loud bang',
        icon: '⚡',
        rarity: 'uncommon',
        slot: 'grenade',
        quantity: 1,
        maxQuantity: 2,
        cooldown: 0,
        cooldownRemaining: 0,
        activationTime: 0.3,
        duration: 0,
        radius: 12,
        effects: [
          { type: 'blind', value: 1, duration: 5, radius: 12 },
          { type: 'deafen', value: 1, duration: 3, radius: 12 }
        ],
        unlockLevel: 3,
        cost: 400,
        soundEffects: ['grenade_pin', 'grenade_throw', 'flashbang_explosion']
      },
      {
        id: 'molotov',
        name: 'Molotov Cocktail',
        type: 'molotov',
        description: 'Creates a fire area that damages enemies over time',
        icon: '🔥',
        rarity: 'uncommon',
        slot: 'grenade',
        quantity: 1,
        maxQuantity: 2,
        cooldown: 0,
        cooldownRemaining: 0,
        activationTime: 0.4,
        duration: 8,
        radius: 4,
        damage: 60,
        effects: [
          { type: 'fire', value: 15, duration: 8, radius: 4, stacks: true },
          { type: 'damage', value: 60, duration: 0, radius: 4 }
        ],
        unlockLevel: 5,
        cost: 600,
        soundEffects: ['molotov_throw', 'glass_break', 'fire_ignite']
      },
      {
        id: 'emp_grenade',
        name: 'EMP Grenade',
        type: 'emp',
        description: 'Disables electronic equipment and abilities',
        icon: '🔌',
        rarity: 'rare',
        slot: 'grenade',
        quantity: 1,
        maxQuantity: 2,
        cooldown: 0,
        cooldownRemaining: 0,
        activationTime: 0.5,
        duration: 10,
        radius: 8,
        effects: [
          { type: 'emp', value: 1, duration: 10, radius: 8 },
          { type: 'disarm', value: 1, duration: 5, radius: 8 }
        ],
        unlockLevel: 8,
        cost: 1200,
        soundEffects: ['emp_throw', 'emp_explosion', 'electronic_fizz']
      },

      // Mines and Traps
      {
        id: 'proximity_mine',
        name: 'Proximity Mine',
        type: 'proximity_mine',
        description: 'Explodes when enemies get close',
        icon: '💥',
        rarity: 'uncommon',
        slot: 'equipment',
        quantity: 2,
        maxQuantity: 3,
        cooldown: 5000,
        cooldownRemaining: 0,
        activationTime: 2,
        duration: 0,
        radius: 5,
        damage: 100,
        effects: [
          { type: 'damage', value: 100, duration: 0, radius: 5 },
          { type: 'explosion', value: 1, duration: 0, radius: 5 }
        ],
        unlockLevel: 6,
        cost: 800,
        soundEffects: ['mine_place', 'mine_arm', 'explosion']
      },
      {
        id: 'claymore',
        name: 'Claymore Mine',
        type: 'claymore',
        description: 'Directional explosive trap with shrapnel',
        icon: '🎯',
        rarity: 'rare',
        slot: 'equipment',
        quantity: 1,
        maxQuantity: 2,
        cooldown: 7000,
        cooldownRemaining: 0,
        activationTime: 3,
        duration: 0,
        radius: 8,
        damage: 120,
        effects: [
          { type: 'damage', value: 120, duration: 0, radius: 8 },
          { type: 'explosion', value: 1.5, duration: 0, radius: 8 }
        ],
        unlockLevel: 10,
        cost: 1500,
        soundEffects: ['claymore_place', 'claymore_arm', 'claymore_explosion']
      },
      {
        id: 'c4_explosive',
        name: 'C4 Explosive',
        type: 'c4',
        description: 'Remote detonated explosive charge',
        icon: '💣',
        rarity: 'epic',
        slot: 'equipment',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 10000,
        cooldownRemaining: 0,
        activationTime: 2,
        duration: 0,
        radius: 10,
        damage: 200,
        effects: [
          { type: 'damage', value: 200, duration: 0, radius: 10 },
          { type: 'explosion', value: 2, duration: 0, radius: 10 }
        ],
        unlockLevel: 12,
        cost: 2500,
        soundEffects: ['c4_place', 'c4_arm', 'c4_detonate', 'explosion']
      },

      // Tactical Gadgets
      {
        id: 'recon_drone',
        name: 'Recon Drone',
        type: 'drone',
        description: 'Remote-controlled drone for surveillance',
        icon: '🚁',
        rarity: 'epic',
        slot: 'equipment',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 30000,
        cooldownRemaining: 0,
        activationTime: 2,
        duration: 60,
        radius: 0,
        effects: [
          { type: 'reveal', value: 1, duration: 60, radius: 50 }
        ],
        unlockLevel: 15,
        cost: 4000,
        requirements: { class: ['ghost', 'sharpshooter'] },
        soundEffects: ['drone_deploy', 'drone_fly', 'drone_recall']
      },
      {
        id: 'motion_sensor',
        name: 'Motion Sensor',
        type: 'motion_sensor',
        description: 'Detects enemy movement in radius',
        icon: '📡',
        rarity: 'uncommon',
        slot: 'equipment',
        quantity: 2,
        maxQuantity: 3,
        cooldown: 15000,
        cooldownRemaining: 0,
        activationTime: 2,
        duration: 30,
        radius: 15,
        effects: [
          { type: 'reveal', value: 1, duration: 30, radius: 15 },
          { type: 'mark', value: 1, duration: 5, radius: 15 }
        ],
        unlockLevel: 7,
        cost: 1000,
        soundEffects: ['sensor_place', 'sensor_arm', 'sensor_alert']
      },
      {
        id: 'thermal_vision',
        name: 'Thermal Vision Goggles',
        type: 'thermal_vision',
        description: 'See enemies through walls and smoke',
        icon: '👁️',
        rarity: 'rare',
        slot: 'equipment',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 20000,
        cooldownRemaining: 0,
        activationTime: 1,
        duration: 20,
        radius: 0,
        effects: [
          { type: 'reveal', value: 1, duration: 20, radius: 100 }
        ],
        unlockLevel: 9,
        cost: 2000,
        soundEffects: ['thermal_activate', 'thermal_deactivate', 'thermal_scan']
      },

      // Healing Equipment
      {
        id: 'medkit',
        name: 'Medical Kit',
        type: 'medkit',
        description: 'Fully restores health',
        icon: '🏥',
        rarity: 'common',
        slot: 'healing',
        quantity: 1,
        maxQuantity: 2,
        cooldown: 10000,
        cooldownRemaining: 0,
        activationTime: 3,
        duration: 0,
        radius: 0,
        healing: 100,
        effects: [
          { type: 'heal', value: 100, duration: 0 }
        ],
        unlockLevel: 1,
        cost: 300,
        soundEffects: ['medkit_open', 'heal_apply']
      },
      {
        id: 'bandage',
        name: 'Bandage',
        type: 'bandage',
        description: 'Quickly restore partial health',
        icon: '🩹',
        rarity: 'common',
        slot: 'healing',
        quantity: 3,
        maxQuantity: 5,
        cooldown: 5000,
        cooldownRemaining: 0,
        activationTime: 1.5,
        duration: 0,
        radius: 0,
        healing: 25,
        effects: [
          { type: 'heal', value: 25, duration: 0 }
        ],
        unlockLevel: 1,
        cost: 100,
        soundEffects: ['bandage_apply', 'heal_minor']
      },
      {
        id: 'defibrillator',
        name: 'Defibrillator',
        type: 'defibrillator',
        description: 'Revive downed teammates instantly',
        icon: '⚡',
        rarity: 'rare',
        slot: 'healing',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 45000,
        cooldownRemaining: 0,
        activationTime: 4,
        duration: 0,
        radius: 0,
        healing: 100,
        effects: [
          { type: 'heal', value: 100, duration: 0 },
          { type: 'stun', value: 1, duration: 0.5, radius: 2 }
        ],
        unlockLevel: 11,
        cost: 3000,
        requirements: { class: ['medic'] },
        soundEffects: ['defib_charge', 'defib_shock', 'defib_success']
      },

      // Melee Weapons
      {
        id: 'combat_knife',
        name: 'Combat Knife',
        type: 'combat_knife',
        description: 'Fast melee weapon for close combat',
        icon: '🔪',
        rarity: 'common',
        slot: 'melee',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 800,
        cooldownRemaining: 0,
        activationTime: 0,
        duration: 0,
        radius: 1,
        damage: 40,
        effects: [
          { type: 'damage', value: 40, duration: 0, radius: 1 },
          { type: 'stun', value: 0.5, duration: 0.5, radius: 1 }
        ],
        unlockLevel: 1,
        cost: 150,
        soundEffects: ['knife_swing', 'knife_hit', 'knife_sheathe']
      },
      {
        id: 'tactical_machete',
        name: 'Tactical Machete',
        type: 'tactical_machete',
        description: 'Heavy melee weapon with high damage',
        icon: '⚔️',
        rarity: 'uncommon',
        slot: 'melee',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 1200,
        cooldownRemaining: 0,
        activationTime: 0,
        duration: 0,
        radius: 1.5,
        damage: 70,
        effects: [
          { type: 'damage', value: 70, duration: 0, radius: 1.5 },
          { type: 'stun', value: 1, duration: 0.8, radius: 1.5 }
        ],
        unlockLevel: 4,
        cost: 500,
        soundEffects: ['machete_swing', 'machete_hit', 'machete_sheathe']
      },
      {
        id: 'throwing_knife',
        name: 'Throwing Knife',
        type: 'throwing_knife',
        description: 'Ranged melee weapon for silent kills',
        icon: '🗡️',
        rarity: 'rare',
        slot: 'melee',
        quantity: 3,
        maxQuantity: 5,
        cooldown: 2000,
        cooldownRemaining: 0,
        activationTime: 0.3,
        duration: 0,
        radius: 0,
        damage: 60,
        effects: [
          { type: 'damage', value: 60, duration: 0, radius: 0 }
        ],
        unlockLevel: 7,
        cost: 800,
        soundEffects: ['throw_knife', 'knife_impact', 'knife_thud']
      },

      // Special Equipment
      {
        id: 'stun_gun',
        name: 'Taser',
        type: 'stun_gun',
        description: 'Non-lethal weapon that incapacitates enemies',
        icon: '🔌',
        rarity: 'uncommon',
        slot: 'equipment',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 5000,
        cooldownRemaining: 0,
        activationTime: 0,
        duration: 0,
        radius: 8,
        effects: [
          { type: 'stun', value: 1, duration: 3, radius: 8 },
          { type: 'disarm', value: 1, duration: 2, radius: 8 }
        ],
        unlockLevel: 6,
        cost: 1200,
        soundEffects: ['taser_fire', 'electric_arc', 'electric_impact']
      },
      {
        id: 'grappling_hook',
        name: 'Grappling Hook',
        type: 'grappling_hook',
        description: 'Quickly reposition to high places',
        icon: '🪝',
        rarity: 'epic',
        slot: 'equipment',
        quantity: 1,
        maxQuantity: 1,
        cooldown: 15000,
        cooldownRemaining: 0,
        activationTime: 0,
        duration: 2,
        radius: 0,
        effects: [
          { type: 'speed_boost', value: 2, duration: 2, radius: 0 }
        ],
        unlockLevel: 10,
        cost: 3000,
        requirements: { class: ['ghost', 'vanguard'] },
        soundEffects: ['grappling_fire', 'grappling_attach', 'grappling_retract']
      }
    ]

    // Organize equipment by slot
    equipment.forEach(item => {
      if (!this.equipment.has(item.slot)) {
        this.equipment.set(item.slot, [])
      }
      this.equipment.get(item.slot)!.push(item)
    })
  }

  // Create equipment models
  private createEquipmentModels(): void {
    // Create simple 3D models for equipment
    // In a real implementation, these would be detailed 3D models

    // Grenade model
    const grenadeGeometry = new THREE.SphereGeometry(0.08, 8, 8)
    const grenadeMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })
    const grenade = new THREE.Mesh(grenadeGeometry, grenadeMaterial)
    this.equipmentModels.set('grenade', grenade)

    // Mine model
    const mineGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.03, 6)
    const mineMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const mine = new THREE.Mesh(mineGeometry, mineMaterial)
    mine.rotation.x = Math.PI / 2
    this.equipmentModels.set('mine', mine)

    // Drone model
    const droneGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3)
    const droneMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 })
    const drone = new THREE.Mesh(droneGeometry, droneMaterial)
    this.equipmentModels.set('drone', drone)

    // Medkit model
    const medkitGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.08)
    const medkitMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
    const medkit = new THREE.Mesh(medkitGeometry, medkitMaterial)
    this.equipmentModels.set('medkit', medkit)

    // Knife model
    const knifeGeometry = new THREE.BoxGeometry(0.02, 0.15, 0.005)
    const knifeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 })
    const knife = new THREE.Mesh(knifeGeometry, knifeMaterial)
    this.equipmentModels.set('knife', knife)
  }

  // Load sound effects
  private loadSoundEffects(): void {
    const soundTypes = [
      'grenade_pin', 'grenade_throw', 'explosion', 'smoke_deploy', 'flashbang_explosion',
      'molotov_throw', 'glass_break', 'fire_ignite', 'emp_throw', 'emp_explosion',
      'mine_place', 'mine_arm', 'claymore_place', 'claymore_arm', 'c4_place', 'c4_arm',
      'c4_detonate', 'drone_deploy', 'drone_fly', 'drone_recall', 'sensor_place',
      'sensor_arm', 'sensor_alert', 'thermal_activate', 'thermal_scan', 'medkit_open',
      'heal_apply', 'bandage_apply', 'defib_charge', 'defib_shock', 'knife_swing',
      'knife_hit', 'knife_sheathe', 'machete_swing', 'taser_fire', 'electric_arc',
      'grappling_fire', 'grappling_attach', 'grappling_retract'
    ]

    soundTypes.forEach(type => {
      const audio = new Audio()
      // In a real implementation, load actual audio files
      this.soundEffects.set(type, audio)
    })
  }

  // Create visual effects
  private createVisualEffects(): void {
    // Explosion effect
    this.visualEffects.set('explosion', {
      particleCount: 50,
      colors: [0xff4500, 0xffa500, 0xffff00],
      speed: 15,
      size: 0.1
    })

    // Smoke effect
    this.visualEffects.set('smoke', {
      particleCount: 100,
      colors: [0x888888, 0x999999, 0xaaaaaa],
      speed: 2,
      size: 0.3
    })

    // Fire effect
    this.visualEffects.set('fire', {
      particleCount: 30,
      colors: [0xff4500, 0xff6347, 0xffa500],
      speed: 5,
      size: 0.05
    })

    // Flash effect
    this.visualEffects.set('flash', {
      particleCount: 20,
      colors: [0xffffff, 0xffffcc, 0xffff99],
      speed: 20,
      size: 0.2
    })
  }

  // Update player info
  updatePlayerInfo(position: THREE.Vector3, level: number, playerClass: string): void {
    this.playerPosition = position.clone()
    this.playerLevel = level
    this.playerClass = playerClass
  }

  // Use equipment
  useEquipment(equipmentId: string, targetPosition?: THREE.Vector3, targetDirection?: THREE.Vector3): boolean {
    const equipment = this.findEquipment(equipmentId)
    if (!equipment) return false

    // Check cooldown
    if (equipment.cooldownRemaining > 0) return false

    // Check requirements
    if (!this.checkRequirements(equipment)) return false

    // Check quantity
    if (equipment.quantity <= 0) return false

    // Use equipment based on type
    let success = false

    switch (equipment.type) {
      case 'grenade':
      case 'smoke':
      case 'flash':
      case 'molotov':
      case 'emp':
        success = this.throwGrenade(equipment, targetPosition, targetDirection)
        break
      case 'proximity_mine':
      case 'claymore':
        success = this.placeMine(equipment, targetPosition, targetDirection)
        break
      case 'c4':
        success = this.placeC4(equipment, targetPosition)
        break
      case 'drone':
        success = this.deployDrone(equipment)
        break
      case 'motion_sensor':
      case 'thermal_vision':
        success = this.activateGadget(equipment, targetPosition)
        break
      case 'medkit':
      case 'bandage':
      case 'defibrillator':
        success = this.useHealing(equipment)
        break
      case 'combat_knife':
      case 'tactical_machete':
        success = this.useMelee(equipment)
        break
      case 'throwing_knife':
        success = this.throwKnife(equipment, targetPosition, targetDirection)
        break
      case 'stun_gun':
        success = this.useStunGun(equipment, targetPosition, targetDirection)
        break
      case 'grappling_hook':
        success = this.useGrapplingHook(equipment, targetPosition)
        break
    }

    if (success) {
      equipment.quantity--
      equipment.cooldownRemaining = equipment.cooldown
      this.playSound(equipment.soundEffects[0])
    }

    return success
  }

  // Find equipment by ID
  private findEquipment(equipmentId: string): TacticalEquipment | null {
    for (const equipmentList of this.equipment.values()) {
      const equipment = equipmentList.find(eq => eq.id === equipmentId)
      if (equipment) return equipment
    }
    return null
  }

  // Check equipment requirements
  private checkRequirements(equipment: TacticalEquipment): boolean {
    if (equipment.requirements?.playerLevel && this.playerLevel < equipment.requirements.playerLevel) {
      return false
    }

    if (equipment.requirements?.class && !equipment.requirements.class.includes(this.playerClass)) {
      return false
    }

    return true
  }

  // Throw grenade
  private throwGrenade(grenade: TacticalEquipment, targetPosition?: THREE.Vector3, targetDirection?: THREE.Vector3): boolean {
    const throwDirection = targetDirection || this.camera.getWorldDirection(new THREE.Vector3())
    const throwPower = 15

    const grenadePhysics: GrenadePhysics = {
      position: this.playerPosition.clone(),
      velocity: throwDirection.clone().multiplyScalar(throwPower),
      rotation: new THREE.Euler(),
      angularVelocity: new THREE.Euler(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1),
      gravity: 9.8,
      bounceCount: 0,
      maxBounces: 2,
      isCooking: false,
      cookingTime: 0,
      throwPower
    }

    // Add to throwables
    if (!this.throwables.has(grenade.id)) {
      this.throwables.set(grenade.id, [])
    }
    this.throwables.get(grenade.id)!.push(grenadePhysics)

    // Create visual model
    const model = this.equipmentModels.get('grenade')?.clone()
    if (model) {
      model.position.copy(grenadePhysics.position)
      this.scene.add(model)
      ;(grenadePhysics as any).visualModel = model
    }

    // Schedule explosion
    setTimeout(() => {
      this.detonateGrenade(grenade, grenadePhysics.position)
      if (model) {
        this.scene.remove(model)
      }
    }, grenade.activationTime * 1000 + 2000)

    return true
  }

  // Place mine
  private placeMine(mine: TacticalEquipment, targetPosition?: THREE.Vector3, targetDirection?: THREE.Vector3): boolean {
    const position = targetPosition || this.playerPosition.clone()

    const mineSystem: MineSystem = {
      position,
      type: mine.type === 'proximity_mine' ? 'proximity' : 'directional',
      isArmed: false,
      triggerRadius: mine.radius,
      triggerCondition: null,
      damage: mine.damage || 0,
      visualModel: this.equipmentModels.get('mine')?.clone() || new THREE.Mesh(),
      triggerEffect: mine.soundEffects
    }

    if (mineSystem.visualModel) {
      mineSystem.visualModel.position.copy(position)
      this.scene.add(mineSystem.visualModel)
    }

    // Arm mine after delay
    setTimeout(() => {
      mineSystem.isArmed = true
      this.playSound('mine_arm')
    }, mine.activationTime * 1000)

    this.mines.set(mine.id + '_' + Date.now(), mineSystem)
    return true
  }

  // Place C4
  private placeC4(c4: TacticalEquipment, targetPosition?: THREE.Vector3): boolean {
    const position = targetPosition || this.playerPosition.clone()

    // C4 is remote detonated, so store it differently
    const c4Data = {
      position,
      isPlanted: true,
      damage: c4.damage || 0,
      radius: c4.radius,
      visualModel: this.equipmentModels.get('mine')?.clone() || new THREE.Mesh()
    }

    if (c4Data.visualModel) {
      c4Data.visualModel.position.copy(position)
      c4Data.visualModel.scale.set(1.5, 1.5, 1.5) // Make C4 slightly larger
      this.scene.add(c4Data.visualModel)
    }

    this.activeEquipment.set(c4.id, c4Data)
    return true
  }

  // Deploy drone
  private deployDrone(drone: TacticalEquipment): boolean {
    const droneController: DroneController = {
      isActive: true,
      position: this.playerPosition.clone(),
      rotation: new THREE.Euler(),
      battery: 100,
      maxBattery: 100,
      speed: 10,
      height: 5,
      camera: new THREE.PerspectiveCamera(75, 1, 0.1, 100),
      nightVision: false,
      thermalVision: false,
      controls: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        boost: false
      }
    }

    droneController.position.y += droneController.height
    this.drones.set(drone.id, droneController)

    // Schedule drone recall
    setTimeout(() => {
      this.recallDrone(drone.id)
    }, drone.duration * 1000)

    return true
  }

  // Activate gadget
  private activateGadget(gadget: TacticalEquipment, targetPosition?: THREE.Vector3): boolean {
    const position = targetPosition || this.playerPosition.clone()

    switch (gadget.type) {
      case 'motion_sensor':
        return this.placeMotionSensor(gadget, position)
      case 'thermal_vision':
        return this.activateThermalVision(gadget)
      default:
        return false
    }
  }

  // Place motion sensor
  private placeMotionSensor(sensor: TacticalEquipment, position: THREE.Vector3): boolean {
    const sensorData = {
      position,
      isActive: true,
      radius: sensor.radius,
      duration: sensor.duration,
      visualModel: this.equipmentModels.get('mine')?.clone() || new THREE.Mesh()
    }

    if (sensorData.visualModel) {
      sensorData.visualModel.position.copy(position)
      sensorData.visualModel.scale.set(0.5, 0.5, 0.5)
      this.scene.add(sensorData.visualModel)
    }

    this.activeEquipment.set(sensor.id, sensorData)

    // Schedule sensor deactivation
    setTimeout(() => {
      this.deactivateEquipment(sensor.id)
    }, sensor.duration * 1000)

    return true
  }

  // Activate thermal vision
  private activateThermalVision(thermal: TacticalEquipment): boolean {
    const thermalData = {
      isActive: true,
      duration: thermal.duration,
      visualEffect: 'thermal_vision'
    }

    this.activeEquipment.set(thermal.id, thermalData)

    // Apply visual effect to camera
    this.applyThermalVisionEffect(true)

    // Schedule deactivation
    setTimeout(() => {
      this.deactivateEquipment(thermal.id)
      this.applyThermalVisionEffect(false)
    }, thermal.duration * 1000)

    return true
  }

  // Use healing
  private useHealing(healing: TacticalEquipment): boolean {
    // In a real implementation, this would heal the player
    console.log(`Healing ${healing.healing} health with ${healing.name}`)

    // Create healing effect
    this.createHealingEffect(this.playerPosition)

    return true
  }

  // Use melee
  private useMelee(melee: TacticalEquipment): boolean {
    // Perform melee attack
    const attackDirection = this.camera.getWorldDirection(new THREE.Vector3())
    const attackRange = melee.radius || 1

    // Create melee effect
    this.createMeleeEffect(this.playerPosition, attackDirection)

    // Check for hits (would be done with raycasting in real implementation)
    console.log(`Melee attack with ${melee.name} for ${melee.damage} damage`)

    return true
  }

  // Throw knife
  private throwKnife(knife: TacticalEquipment, targetPosition?: THREE.Vector3, targetDirection?: THREE.Vector3): boolean {
    const throwDirection = targetDirection || this.camera.getWorldDirection(new THREE.Vector3())
    const throwPower = 20

    const knifePhysics: GrenadePhysics = {
      position: this.playerPosition.clone(),
      velocity: throwDirection.clone().multiplyScalar(throwPower),
      rotation: new THREE.Euler(),
      angularVelocity: new THREE.Euler(0, 0, Math.PI * 4), // Spinning knife
      gravity: 9.8,
      bounceCount: 0,
      maxBounces: 1,
      isCooking: false,
      cookingTime: 0,
      throwPower
    }

    // Add to throwables
    if (!this.throwables.has(knife.id)) {
      this.throwables.set(knife.id, [])
    }
    this.throwables.get(knife.id)!.push(knifePhysics)

    // Create visual model
    const model = this.equipmentModels.get('knife')?.clone()
    if (model) {
      model.position.copy(knifePhysics.position)
      model.rotation.copy(knifePhysics.rotation)
      this.scene.add(model)
      ;(knifePhysics as any).visualModel = model
    }

    return true
  }

  // Use stun gun
  private useStunGun(stunGun: TacticalEquipment, targetPosition?: THREE.Vector3, targetDirection?: THREE.Vector3): boolean {
    const shootDirection = targetDirection || this.camera.getWorldDirection(new THREE.Vector3())
    const shootRange = stunGun.radius || 8

    // Create lightning effect
    this.createLightningEffect(this.playerPosition, shootDirection, shootRange)

    // Check for hits (would be done with raycasting in real implementation)
    console.log(`Stun gun fired for ${shootRange} meters`)

    return true
  }

  // Use grappling hook
  private useGrapplingHook(grappling: TacticalEquipment, targetPosition?: THREE.Vector3): boolean {
    if (!targetPosition) return false

    const hookDirection = targetPosition.clone().sub(this.playerPosition).normalize()
    const hookDistance = this.playerPosition.distanceTo(targetPosition)

    // Create grappling line effect
    this.createGrapplingLineEffect(this.playerPosition, targetPosition)

    // Apply grappling force to player
    const grapplingForce = hookDirection.clone().multiplyScalar(15)
    console.log(`Grappling hook fired ${hookDistance} meters`)

    return true
  }

  // Detonate grenade
  private detonateGrenade(grenade: TacticalEquipment, position: THREE.Vector3): void {
    // Create explosion effect
    this.createExplosionEffect(position, grenade.radius || 5)

    // Apply effects to nearby entities
    this.applyEquipmentEffects(grenade.effects, position)

    // Play sound
    this.playSound('explosion')
  }

  // Apply equipment effects
  private applyEquipmentEffects(effects: EquipmentEffect[], position: THREE.Vector3): void {
    effects.forEach(effect => {
      switch (effect.type) {
        case 'damage':
          this.applyDamageEffect(position, effect.value, effect.radius || 0)
          break
        case 'heal':
          this.applyHealEffect(position, effect.value, effect.radius || 0)
          break
        case 'blind':
          this.applyBlindEffect(position, effect.value, effect.radius || 0, effect.duration)
          break
        case 'deafen':
          this.applyDeafenEffect(position, effect.value, effect.radius || 0, effect.duration)
          break
        case 'stun':
          this.applyStunEffect(position, effect.value, effect.radius || 0, effect.duration)
          break
        case 'smoke':
          this.createSmokeEffect(position, effect.radius || 5, effect.duration)
          break
        case 'fire':
          this.createFireEffect(position, effect.radius || 3, effect.duration)
          break
        case 'emp':
          this.applyEMPEffect(position, effect.value, effect.radius || 5, effect.duration)
          break
        case 'reveal':
          this.applyRevealEffect(position, effect.value, effect.radius || 10, effect.duration)
          break
      }
    })
  }

  // Create explosion effect
  private createExplosionEffect(position: THREE.Vector3, radius: number): void {
    const effect = this.visualEffects.get('explosion')
    if (!effect) return

    for (let i = 0; i < effect.particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(effect.size * Math.random())
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: effect.colors[Math.floor(Math.random() * effect.colors.length)],
        transparent: true,
        opacity: 1
      })

      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.copy(position)

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * effect.speed,
        Math.random() * effect.speed,
        (Math.random() - 0.5) * effect.speed
      )

      particle.userData.velocity = velocity
      particle.userData.lifetime = 1.0

      this.scene.add(particle)

      // Animate particle
      this.animateParticle(particle)
    }

    // Add screen shake
    this.addScreenShake(radius * 0.1)
  }

  // Create smoke effect
  private createSmokeEffect(position: THREE.Vector3, radius: number, duration: number): void {
    const smokeGeometry = new THREE.SphereGeometry(radius)
    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    })

    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial)
    smoke.position.copy(position)
    this.scene.add(smoke)

    // Animate smoke expansion and fade
    const startTime = Date.now()
    const animateSmoke = () => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > duration) {
        this.scene.remove(smoke)
        return
      }

      const progress = elapsed / duration
      smoke.scale.set(1 + progress, 1 + progress, 1 + progress)
      smoke.material.opacity = 0.3 * (1 - progress)

      requestAnimationFrame(animateSmoke)
    }
    animateSmoke()
  }

  // Create fire effect
  private createFireEffect(position: THREE.Vector3, radius: number, duration: number): void {
    const effect = this.visualEffects.get('fire')
    if (!effect) return

    for (let i = 0; i < effect.particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(effect.size * 0.5)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: effect.colors[Math.floor(Math.random() * effect.colors.length)],
        transparent: true,
        opacity: 0.8
      })

      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.copy(position)
      particle.position.y += Math.random() * 2

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * effect.speed * 0.5,
        (Math.random() - 0.5) * 2
      )

      particle.userData.velocity = velocity
      particle.userData.lifetime = duration

      this.scene.add(particle)
      this.animateParticle(particle)
    }
  }

  // Create flash effect
  private createFlashEffect(position: THREE.Vector3, radius: number): void {
    const flashGeometry = new THREE.SphereGeometry(radius)
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    })

    const flash = new THREE.Mesh(flashGeometry, flashMaterial)
    flash.position.copy(position)
    this.scene.add(flash)

    // Quick fade out
    const startTime = Date.now()
    const animateFlash = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > 200) {
        this.scene.remove(flash)
        return
      }

      flash.material.opacity = 1 - (elapsed / 200)
      requestAnimationFrame(animateFlash)
    }
    animateFlash()
  }

  // Create lightning effect
  private createLightningEffect(start: THREE.Vector3, direction: THREE.Vector3, range: number): void {
    const endPosition = start.clone().add(direction.clone().multiplyScalar(range))

    const lightningGeometry = new THREE.BufferGeometry()
    const points = []

    points.push(start.x, start.y, start.z)

    let currentPoint = start.clone()
    for (let i = 0; i < 5; i++) {
      currentPoint.add(direction.clone().multiplyScalar(range / 5))
      currentPoint.x += (Math.random() - 0.5) * 0.5
      currentPoint.y += (Math.random() - 0.5) * 0.5
      currentPoint.z += (Math.random() - 0.5) * 0.5

      points.push(currentPoint.x, currentPoint.y, currentPoint.z)
    }

    lightningGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))

    const lightningMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 3,
      transparent: true,
      opacity: 0.9
    })

    const lightning = new THREE.Line(lightningGeometry, lightningMaterial)
    this.scene.add(lightning)

    // Quick fade
    setTimeout(() => {
      this.scene.remove(lightning)
    }, 100)

    this.playSound('electric_arc')
  }

  // Create grappling line effect
  private createGrapplingLineEffect(start: THREE.Vector3, end: THREE.Vector3): void {
    const lineGeometry = new THREE.BufferGeometry()
    const points = [start.x, start.y, start.z, end.x, end.y, end.z]
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x888888,
      linewidth: 2
    })

    const line = new THREE.Line(lineGeometry, lineMaterial)
    this.scene.add(line)

    // Remove after a moment
    setTimeout(() => {
      this.scene.remove(line)
    }, 2000)
  }

  // Create healing effect
  private createHealingEffect(position: THREE.Vector3): void {
    for (let i = 0; i < 20; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8
      })

      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.copy(position)
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ))

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3,
        (Math.random() - 0.5) * 2
      )

      particle.userData.velocity = velocity
      particle.userData.lifetime = 2.0

      this.scene.add(particle)
      this.animateParticle(particle)
    }
  }

  // Create melee effect
  private createMeleeEffect(position: THREE.Vector3, direction: THREE.Vector3): void {
    const strikeGeometry = new THREE.BoxGeometry(0.1, 0.1, 1)
    const strikeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    })

    const strike = new THREE.Mesh(strikeGeometry, strikeMaterial)
    strike.position.copy(position)
    strike.lookAt(position.clone().add(direction))

    this.scene.add(strike)

    // Quick fade
    setTimeout(() => {
      this.scene.remove(strike)
    }, 200)
  }

  // Animate particle
  private animateParticle(particle: THREE.Mesh): void {
    const animate = () => {
      if (particle.userData.lifetime <= 0) {
        this.scene.remove(particle)
        return
      }

      const velocity = particle.userData.velocity
      particle.position.add(velocity.clone().multiplyScalar(0.016))

      // Apply gravity
      velocity.y -= 9.8 * 0.016

      particle.userData.lifetime -= 0.016

      // Fade out
      if (particle.material instanceof THREE.MeshBasicMaterial) {
        particle.material.opacity = Math.max(0, particle.userData.lifetime)
      }

      requestAnimationFrame(animate)
    }
    animate()
  }

  // Add screen shake
  private addScreenShake(intensity: number): void {
    // In a real implementation, this would shake the camera
    console.log(`Screen shake with intensity ${intensity}`)
  }

  // Apply damage effect
  private applyDamageEffect(position: THREE.Vector3, damage: number, radius: number): void {
    console.log(`Damage effect: ${damage} damage in ${radius}m radius at ${position.toString()}`)
  }

  // Apply heal effect
  private applyHealEffect(position: THREE.Vector3, healing: number, radius: number): void {
    console.log(`Heal effect: ${healing} healing in ${radius}m radius at ${position.toString()}`)
  }

  // Apply blind effect
  private applyBlindEffect(position: THREE.Vector3, intensity: number, radius: number, duration: number): void {
    console.log(`Blind effect: intensity ${intensity} for ${duration}s in ${radius}m radius`)
  }

  // Apply deafen effect
  private applyDeafenEffect(position: THREE.Vector3, intensity: number, radius: number, duration: number): void {
    console.log(`Deafen effect: intensity ${intensity} for ${duration}s in ${radius}m radius`)
  }

  // Apply stun effect
  private applyStunEffect(position: THREE.Vector3, intensity: number, radius: number, duration: number): void {
    console.log(`Stun effect: intensity ${intensity} for ${duration}s in ${radius}m radius`)
  }

  // Apply EMP effect
  private applyEMPEffect(position: THREE.Vector3, intensity: number, radius: number, duration: number): void {
    console.log(`EMP effect: intensity ${intensity} for ${duration}s in ${radius}m radius`)
  }

  // Apply reveal effect
  private applyRevealEffect(position: THREE.Vector3, intensity: number, radius: number, duration: number): void {
    console.log(`Reveal effect: intensity ${intensity} for ${duration}s in ${radius}m radius`)
  }

  // Apply thermal vision effect
  private applyThermalVisionEffect(active: boolean): void {
    console.log(`Thermal vision ${active ? 'activated' : 'deactivated'}`)
  }

  // Recall drone
  private recallDrone(droneId: string): void {
    const drone = this.drones.get(droneId)
    if (drone) {
      drone.isActive = false
      this.drones.delete(droneId)
      this.playSound('drone_recall')
    }
  }

  // Deactivate equipment
  private deactivateEquipment(equipmentId: string): void {
    const equipment = this.activeEquipment.get(equipmentId)
    if (equipment) {
      if (equipment.visualModel) {
        this.scene.remove(equipment.visualModel)
      }
      this.activeEquipment.delete(equipmentId)
    }
  }

  // Play sound effect
  private playSound(soundName: string): void {
    const sound = this.soundEffects.get(soundName)
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(e => console.log('Sound play failed:', e))
    }
  }

  // Update equipment systems
  update(deltaTime: number): void {
    // Update throwables physics
    this.updateThrowables(deltaTime)

    // Update cooldowns
    this.updateCooldowns(deltaTime)

    // Update drones
    this.updateDrones(deltaTime)

    // Update mines
    this.updateMines()

    // Update active equipment
    this.updateActiveEquipment(deltaTime)
  }

  // Update throwables physics
  private updateThrowables(deltaTime: number): void {
    this.throwables.forEach((throwableList, equipmentId) => {
      for (let i = throwableList.length - 1; i >= 0; i--) {
        const throwable = throwableList[i]

        // Apply physics
        throwable.velocity.y -= throwable.gravity * deltaTime
        throwable.position.add(throwable.velocity.clone().multiplyScalar(deltaTime))
        throwable.rotation.x += throwable.angularVelocity.x * deltaTime
        throwable.rotation.y += throwable.angularVelocity.y * deltaTime
        throwable.rotation.z += throwable.angularVelocity.z * deltaTime

        // Update visual model position
        if ((throwable as any).visualModel) {
          (throwable as any).visualModel.position.copy(throwable.position)
          (throwable as any).visualModel.rotation.copy(throwable.rotation)
        }

        // Check for ground collision
        if (throwable.position.y <= 0) {
          throwable.position.y = 0
          throwable.velocity.y *= -0.3 // Bounce
          throwable.velocity.x *= 0.8 // Friction
          throwable.velocity.z *= 0.8

          throwable.bounceCount++
          if (throwable.bounceCount >= throwable.maxBounces) {
            throwable.velocity.set(0, 0, 0)
          }
        }
      }
    })
  }

  // Update cooldowns
  private updateCooldowns(deltaTime: number): void {
    for (const equipmentList of this.equipment.values()) {
      equipmentList.forEach(equipment => {
        if (equipment.cooldownRemaining > 0) {
          equipment.cooldownRemaining = Math.max(0, equipment.cooldownRemaining - deltaTime * 1000)
        }
      })
    }
  }

  // Update drones
  private updateDrones(deltaTime: number): void {
    this.drones.forEach((drone, droneId) => {
      if (!drone.isActive) return

      // Update battery
      drone.battery -= deltaTime * 5 // Drain 5% per second
      if (drone.battery <= 0) {
        this.recallDrone(droneId)
        return
      }

      // Update position based on controls
      const moveVector = new THREE.Vector3()
      if (drone.controls.forward) moveVector.z -= 1
      if (drone.controls.backward) moveVector.z += 1
      if (drone.controls.left) moveVector.x -= 1
      if (drone.controls.right) moveVector.x += 1
      if (drone.controls.up) moveVector.y += 1
      if (drone.controls.down) moveVector.y -= 1

      if (moveVector.length() > 0) {
        moveVector.normalize()
        const speed = drone.controls.boost ? drone.speed * 2 : drone.speed
        drone.position.add(moveVector.multiplyScalar(speed * deltaTime))
      }

      // Keep drone at minimum height
      if (drone.position.y < drone.height) {
        drone.position.y = drone.height
      }
    })
  }

  // Update mines
  private updateMines(): void {
    this.mines.forEach((mine, mineId) => {
      if (!mine.isArmed) return

      // Check for enemies in trigger radius
      const enemies = this.getEnemiesInRange(mine.position, mine.triggerRadius)
      if (enemies.length > 0) {
        this.detonateMine(mine)
        this.mines.delete(mineId)
      }
    })
  }

  // Update active equipment
  private updateActiveEquipment(deltaTime: number): void {
    this.activeEquipment.forEach((equipment, equipmentId) => {
      if (equipment.duration) {
        equipment.duration -= deltaTime
        if (equipment.duration <= 0) {
          this.deactivateEquipment(equipmentId)
        }
      }
    })
  }

  // Get enemies in range
  private getEnemiesInRange(position: THREE.Vector3, radius: number): any[] {
    // In a real implementation, this would check for actual enemies
    return []
  }

  // Detonate mine
  private detonateMine(mine: MineSystem): void {
    this.createExplosionEffect(mine.position, mine.triggerRadius)
    this.applyDamageEffect(mine.position, mine.damage, mine.triggerRadius)
    this.playSound('explosion')

    if (mine.visualModel) {
      this.scene.remove(mine.visualModel)
    }
  }

  // Get equipment for slot
  getEquipmentForSlot(slot: string): TacticalEquipment[] {
    return this.equipment.get(slot) || []
  }

  // Get equipment by ID
  getEquipment(equipmentId: string): TacticalEquipment | null {
    return this.findEquipment(equipmentId)
  }

  // Check if equipment is unlocked
  isEquipmentUnlocked(equipmentId: string): boolean {
    const equipment = this.findEquipment(equipmentId)
    return equipment ? this.checkRequirements(equipment) : false
  }

  // Restock equipment
  restockEquipment(equipmentId: string, amount: number): boolean {
    const equipment = this.findEquipment(equipmentId)
    if (!equipment) return false

    equipment.quantity = Math.min(equipment.quantity + amount, equipment.maxQuantity)
    return true
  }

  // Clean up
  cleanup(): void {
    // Clear all active equipment
    this.throwables.clear()
    this.drones.clear()
    this.mines.clear()
    this.activeEquipment.clear()

    // Remove all visual models from scene
    this.scene.children.forEach(child => {
      if (child.userData.isEquipment) {
        this.scene.remove(child)
      }
    })

    // Clear references
    this.equipment.clear()
    this.equipmentModels.clear()
    this.soundEffects.clear()
    this.visualEffects.clear()
  }
}

export default GLXYTacticalEquipment