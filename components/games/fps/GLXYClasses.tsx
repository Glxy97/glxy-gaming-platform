// @ts-nocheck
'use client'

import * as THREE from 'three'

// GLXY TACTICAL CLASSES - Inspired by CS:GO, Valorant, CoD, Battlefield
export interface GLXYClass {
  id: string
  name: string
  description: string
  icon: string
  primaryColor: string
  secondaryColor: string
  health: number
  armor: number
  speed: number
  abilities: ClassAbility[]
  equipment: Equipment[]
  startingWeapons: string[]
  ultimateAbility: UltimateAbility
}

export interface ClassAbility {
  id: string
  name: string
  description: string
  icon: string
  cooldown: number
  duration: number
  uses: number
  type: 'active' | 'passive'
  cost?: number
}

export interface UltimateAbility {
  id: string
  name: string
  description: string
  icon: string
  cooldown: number
  duration: number
  chargeRequired: number
  type: 'offensive' | 'defensive' | 'utility'
}

export interface Equipment {
  id: string
  name: string
  type: 'grenade' | 'tactical' | 'support' | 'utility' | 'defensive'
  icon: string
  uses: number
  cooldown: number
  description: string
}

// TACTICAL CLASSES - 5 EPIC Roles Including SHARPSHOOTER!
export const GLXY_CLASSES: GLXYClass[] = [
  {
    id: 'assault',
    name: 'VANGUARD',
    description: 'Aggressive frontline assault specialist with enhanced firepower',
    icon: '🔥',
    primaryColor: '#ff6b35',
    secondaryColor: '#ff9558',
    health: 120,
    armor: 50,
    speed: 1.0,
    abilities: [
      {
        id: 'adrenaline_rush',
        name: 'Adrenaline Rush',
        description: 'Temporary speed and damage boost',
        icon: '⚡',
        cooldown: 20000,
        duration: 5000,
        uses: 2,
        type: 'active'
      },
      {
        id: 'breach_charge',
        name: 'Breach Charge',
        description: 'Deployable explosive for breaching fortified positions',
        icon: '💥',
        cooldown: 15000,
        duration: 3000,
        uses: 1,
        type: 'active'
      }
    ],
    equipment: [
      {
        id: 'frag_grenade',
        name: 'Fragmentation Grenade',
        type: 'grenade',
        icon: '🔥',
        uses: 2,
        cooldown: 5000,
        description: 'Standard explosive grenade'
      },
      {
        id: 'stim_pack',
        name: 'Stim Pack',
        type: 'support',
        icon: '💉',
        uses: 1,
        cooldown: 30000,
        description: 'Instant health restoration'
      }
    ],
    startingWeapons: ['glxy_assault_rifle', 'glxy_pistol'],
    ultimateAbility: {
      id: 'berserker_rage',
      name: 'Berserker Rage',
      description: 'Become nearly invincible with unlimited ammo and enhanced damage',
      icon: '🔥',
      cooldown: 90000,
      duration: 8000,
      chargeRequired: 7,
      type: 'offensive'
    }
  },
  {
    id: 'support',
    name: 'MEDIC',
    description: 'Combat medic with healing abilities and support equipment',
    icon: '🏥',
    primaryColor: '#4ecdc4',
    secondaryColor: '#44a3aa',
    health: 100,
    armor: 25,
    speed: 1.1,
    abilities: [
      {
        id: 'healing_aura',
        name: 'Healing Aura',
        description: 'Area-of-effect healing for allies',
        icon: '✨',
        cooldown: 25000,
        duration: 6000,
        uses: 3,
        type: 'active'
      },
      {
        id: 'revive_kit',
        name: 'Revive Kit',
        description: 'Quick revive downed teammates',
        icon: '⚡',
        cooldown: 45000,
        duration: 3000,
        uses: 2,
        type: 'active'
      },
      {
        id: 'passive_healing',
        name: 'Combat Medic',
        description: 'Passively regenerate health slowly',
        icon: '💚',
        cooldown: 0,
        duration: 0,
        uses: -1,
        type: 'passive'
      }
    ],
    equipment: [
      {
        id: 'medkit',
        name: 'Medical Kit',
        type: 'support',
        icon: '🏥',
        uses: 3,
        cooldown: 10000,
        description: 'Heal 50 health points'
      },
      {
        id: 'defibrillator',
        name: 'Defibrillator',
        type: 'support',
        icon: '⚡',
        uses: 1,
        cooldown: 60000,
        description: 'Revive fallen teammates'
      },
      {
        id: 'smoke_grenade',
        name: 'Smoke Grenade',
        type: 'tactical',
        icon: '🌫️',
        uses: 2,
        cooldown: 8000,
        description: 'Create smoke cover for tactical movement'
      }
    ],
    startingWeapons: ['glxy_smg', 'glxy_pistol'],
    ultimateAbility: {
      id: 'mass_resurrection',
      name: 'Mass Resurrection',
      description: 'Revive all nearby fallen teammates instantly',
      icon: '🌟',
      cooldown: 120000,
      duration: 3000,
      chargeRequired: 8,
      type: 'defensive'
    }
  },
  {
    id: 'recon',
    name: 'GHOST',
    description: 'Stealth reconnaissance expert with information warfare capabilities',
    icon: '👻',
    primaryColor: '#6c5ce7',
    secondaryColor: '#a29bfe',
    health: 90,
    armor: 15,
    speed: 1.3,
    abilities: [
      {
        id: 'thermal_vision',
        name: 'Thermal Vision',
        description: 'See enemies through walls for limited time',
        icon: '👁️',
        cooldown: 30000,
        duration: 8000,
        uses: 2,
        type: 'active'
      },
      {
        id: 'silent_step',
        name: 'Silent Step',
        description: 'Move silently without making footsteps',
        icon: '🤫',
        cooldown: 20000,
        duration: 10000,
        uses: 3,
        type: 'active'
      }
    ],
    equipment: [
      {
        id: 'motion_sensor',
        name: 'Motion Sensor',
        type: 'utility',
        icon: '📡',
        uses: 2,
        cooldown: 15000,
        description: 'Detect enemy movement in area'
      },
      {
        id: 'flash_grenade',
        name: 'Flash Grenade',
        type: 'tactical',
        icon: '⚡',
        uses: 2,
        cooldown: 6000,
        description: 'Blind enemies in area'
      },
      {
        id: 'camo_device',
        name: 'Camo Device',
        type: 'utility',
        icon: '🎭',
        uses: 1,
        cooldown: 45000,
        description: 'Temporary invisibility'
      }
    ],
    startingWeapons: ['glxy_sniper_rifle', 'glxy_silenced_pistol'],
    ultimateAbility: {
      id: 'ghost_mode',
      name: 'Ghost Mode',
      description: 'Become completely invisible and undetectable for duration',
      icon: '👻',
      cooldown: 100000,
      duration: 12000,
      chargeRequired: 6,
      type: 'utility'
    }
  },
  {
    id: 'engineer',
    name: 'BUILDER',
    description: 'Defensive specialist with fortification and deployment abilities',
    icon: '🔧',
    primaryColor: '#fdcb6e',
    secondaryColor: '#f39c12',
    health: 110,
    armor: 75,
    speed: 0.9,
    abilities: [
      {
        id: 'deploy_turret',
        name: 'Auto Turret',
        description: 'Deploy automated defense turret',
        icon: '🤖',
        cooldown: 35000,
        duration: 20000,
        uses: 2,
        type: 'active'
      },
      {
        id: 'reinforce',
        name: 'Reinforce',
        description: 'Strengthen defensive positions',
        icon: '🛡️',
        cooldown: 25000,
        duration: 15000,
        uses: 3,
        type: 'active'
      }
    ],
    equipment: [
      {
        id: 'c4_explosive',
        name: 'C4 Explosive',
        type: 'grenade',
        icon: '💣',
        uses: 2,
        cooldown: 20000,
        description: 'Remote detonated explosive'
      },
      {
        id: 'barbed_wire',
        name: 'Barbed Wire',
        type: 'utility',
        icon: '⚠️',
        uses: 3,
        cooldown: 12000,
        description: 'Slow down enemies in area'
      },
      {
        id: 'shield_generator',
        name: 'Shield Generator',
        type: 'defensive',
        icon: '🛡️',
        uses: 1,
        cooldown: 60000,
        description: 'Create protective energy shield'
      }
    ],
    startingWeapons: ['glxy_shotgun', 'glxy_heavy_pistol'],
    ultimateAbility: {
      id: 'fortress_mode',
      name: 'Fortress Mode',
      description: 'Deploy impenetrable fortress with multiple turrets and defenses',
      icon: '🏰',
      cooldown: 150000,
      duration: 15000,
      chargeRequired: 10,
      type: 'defensive'
    }
  },
  {
    id: 'sharpshooter',
    name: 'SHARPSHOOTER',
    description: 'Elite marksman with supernatural precision and deadly long-range capabilities',
    icon: '🎯',
    primaryColor: '#ffd700',
    secondaryColor: '#ffed4e',
    health: 85,
    armor: 10,
    speed: 1.0,
    abilities: [
      {
        id: 'steady_aim',
        name: 'Steady Aim',
        description: 'Eliminate recoil and sway for perfect accuracy',
        icon: '🎯',
        cooldown: 12000,
        duration: 4000,
        uses: 3,
        type: 'active'
      },
      {
        id: 'eagle_eye',
        name: 'Eagle Eye',
        description: 'Enhanced zoom and visibility through smoke and walls',
        icon: '👁️',
        cooldown: 18000,
        duration: 6000,
        uses: 2,
        type: 'active'
      },
      {
        id: 'calculated_shot',
        name: 'Calculated Shot',
        description: 'Next shot is guaranteed critical hit with tracking',
        icon: '📐',
        cooldown: 25000,
        duration: 3000,
        uses: 1,
        type: 'active'
      },
      {
        id: 'passive_tracker',
        name: 'Hunter Instinct',
        description: 'See enemy footsteps and predict movement patterns',
        icon: '🐺',
        cooldown: 0,
        duration: 0,
        uses: -1,
        type: 'passive'
      }
    ],
    equipment: [
      {
        id: 'armor_piercing_rounds',
        name: 'Armor Piercing Rounds',
        type: 'utility',
        icon: '💎',
        uses: 10,
        cooldown: 0,
        description: 'Ignore enemy armor for 5 shots'
      },
      {
        id: 'spotting_scope',
        name: 'Spotting Scope',
        type: 'utility',
        icon: '📡',
        uses: 3,
        cooldown: 20000,
        description: 'Reveal enemies on minimap for team'
      },
      {
        id: 'long_range_sensor',
        name: 'Long Range Sensor',
        type: 'utility',
        icon: '📡',
        uses: 2,
        cooldown: 30000,
        description: 'Detect enemies at extreme range'
      }
    ],
    startingWeapons: ['glxy_sniper_rifle', 'glxy_heavy_pistol'],
    ultimateAbility: {
      id: 'god_mode_precision',
      name: 'GOD MODE PRECISION',
      description: 'Become the ultimate predator: unlimited ammo, perfect accuracy, wall hacks, and instant kill shots',
      icon: '⚡',
      cooldown: 180000,
      duration: 10000,
      chargeRequired: 8,
      type: 'offensive'
    }
  }
]

// Class Manager
export class GLXYClassManager {
  private selectedClass: GLXYClass | null = null
  private classLevel: { [key: string]: number } = {}
  private classXP: { [key: string]: number } = {}
  private unlockedAbilities: { [key: string]: string[] } = {}

  constructor() {
    // Initialize class progress
    GLXY_CLASSES.forEach(cls => {
      this.classLevel[cls.id] = 1
      this.classXP[cls.id] = 0
      this.unlockedAbilities[cls.id] = [cls.abilities[0].id] // Start with first ability
    })
  }

  selectClass(classId: string): GLXYClass | null {
    const cls = GLXY_CLASSES.find(c => c.id === classId)
    if (cls) {
      this.selectedClass = cls
      return cls
    }
    return null
  }

  getSelectedClass(): GLXYClass | null {
    return this.selectedClass
  }

  getClassLevel(classId: string): number {
    return this.classLevel[classId] || 1
  }

  getClassXP(classId: string): number {
    return this.classXP[classId] || 0
  }

  addClassXP(classId: string, xp: number): void {
    this.classXP[classId] = (this.classXP[classId] || 0) + xp

    // Check for level up
    const currentLevel = this.classLevel[classId] || 1
    const xpNeeded = currentLevel * 1000

    if (this.classXP[classId] >= xpNeeded) {
      this.levelUpClass(classId)
    }
  }

  private levelUpClass(classId: string): void {
    this.classLevel[classId] = (this.classLevel[classId] || 1) + 1
    this.classXP[classId] = 0

    // Unlock new abilities at certain levels
    const cls = GLXY_CLASSES.find(c => c.id === classId)
    if (cls) {
      const currentLevel = this.classLevel[classId]

      if (currentLevel === 3 && cls.abilities.length > 1) {
        this.unlockedAbilities[classId].push(cls.abilities[1].id)
      }

      if (currentLevel === 5 && cls.abilities.length > 2) {
        this.unlockedAbilities[classId].push(cls.abilities[2].id)
      }
    }
  }

  getUnlockedAbilities(classId: string): string[] {
    return this.unlockedAbilities[classId] || []
  }

  canUseAbility(classId: string, abilityId: string): boolean {
    return this.getUnlockedAbilities(classId).includes(abilityId)
  }

  // Create class-specific 3D model
  createClassModel(cls: GLXYClass, scene: THREE.Scene): THREE.Group {
    const group = new THREE.Group()

    // Base body (varies by class)
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.6, 8, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: cls.primaryColor,
      roughness: 0.7,
      metalness: 0.3
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.2
    group.add(body)

    // Class-specific helmet/accessories
    const helmetGeometry = new THREE.SphereGeometry(0.4)
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: cls.secondaryColor,
      roughness: 0.5,
      metalness: 0.5
    })
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
    helmet.position.y = 2.0

    // Add class-specific visual elements
    switch (cls.id) {
      case 'assault':
        // Add shoulder pads
        const padGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.8)
        const leftPad = new THREE.Mesh(padGeometry, helmetMaterial)
        leftPad.position.set(-0.4, 1.8, 0)
        const rightPad = new THREE.Mesh(padGeometry, helmetMaterial)
        rightPad.position.set(0.4, 1.8, 0)
        group.add(leftPad, rightPad)
        break

      case 'support':
        // Add medical cross
        const crossGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.1)
        const crossMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        const cross = new THREE.Mesh(crossGeometry, crossMaterial)
        cross.position.set(0, 1.5, 0.5)
        group.add(cross)
        break

      case 'recon':
        // Add visor/goggles
        const visorGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.3)
        const visorMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.7
        })
        const visor = new THREE.Mesh(visorGeometry, visorMaterial)
        visor.position.set(0, 2.0, 0.35)
        group.add(visor)
        break

      case 'engineer':
        // Add tool belt
        const beltGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8)
        const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
        const belt = new THREE.Mesh(beltGeometry, beltMaterial)
        belt.position.set(0, 0.8, 0)
        group.add(belt)
        break

      case 'sharpshooter':
        // Add tactical ghillie elements
        const ghillieGeometry = new THREE.ConeGeometry(0.6, 0.8, 8)
        const ghillieMaterial = new THREE.MeshStandardMaterial({
          color: 0x2d4a2b,
          roughness: 0.9
        })
        const ghillie = new THREE.Mesh(ghillieGeometry, ghillieMaterial)
        ghillie.position.set(0, 2.3, 0)
        ghillie.rotation.z = Math.PI
        group.add(ghillie)

        // Add advanced scope system
        const scopeRailGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.05)
        const scopeRailMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          metalness: 0.9
        })
        const scopeRail = new THREE.Mesh(scopeRailGeometry, scopeRailMaterial)
        scopeRail.position.set(0, 1.8, 0.15)
        group.add(scopeRail)

        // Add multiple optics
        const mainScopeGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.2)
        const mainScopeMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.3,
          metalness: 0.8
        })
        const mainScope = new THREE.Mesh(mainScopeGeometry, mainScopeMaterial)
        mainScope.position.set(0.1, 1.9, 0.2)
        group.add(mainScope)

        // Add laser sight
        const laserGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6)
        const laserMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.8
        })
        const laser = new THREE.Mesh(laserGeometry, laserMaterial)
        laser.rotation.z = Math.PI / 2
        laser.position.set(-0.2, 1.6, 0.1)
        group.add(laser)
        break
    }

    group.add(helmet)

    return group
  }

  // Get class stats for UI
  getClassStats(classId: string): any {
    const cls = GLXY_CLASSES.find(c => c.id === classId)
    if (!cls) return null

    return {
      name: cls.name,
      level: this.getClassLevel(classId),
      xp: this.getClassXP(classId),
      xpToNext: this.getClassLevel(classId) * 1000,
      health: cls.health,
      armor: cls.armor,
      speed: cls.speed,
      abilities: cls.abilities.filter(ability =>
        this.canUseAbility(classId, ability.id)
      )
    }
  }
}

export default GLXYClassManager