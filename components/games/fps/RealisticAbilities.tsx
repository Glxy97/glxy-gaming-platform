// @ts-nocheck
'use client'

// REALISTIC SPECIAL FORCES ABILITIES - No Sci-Fi, No Robots, Just Modern Military Tech
export interface RealisticAbility {
  id: string
  name: string
  description: string
  icon: string
  cooldown: number
  duration: number
  uses: number
  type: 'active' | 'passive'
  equipment: string
  realism: number // 1-10 scale of military realism
}

export interface RealisticLoadout {
  primary: string[]
  secondary: string[]
  equipment: string[]
  tactical: string[]
  utility: string[]
}

// REALISTIC SPECIAL FORCES CLASSES
export const REALISTIC_CLASSES = [
  {
    id: 'assault_operator',
    name: 'ASSAULT OPERATOR',
    role: 'Point Man / Entry Specialist',
    icon: '🔫',
    primaryColor: '#2d3748',
    secondaryColor: '#4a5568',
    description: 'Modern military assault specialist. Entry point specialist and close quarters expert.',
    health: 110,
    armor: 60,
    speed: 1.0,
    loadout: {
      primary: ['M4A1', 'SCAR-H', 'HK416'],
      secondary: ['Glock 19', 'SIG P226'],
      equipment: ['Flashbang', 'Smoke Grenade', 'Breach Charge'],
      tactical: ['Red Dot Sight', 'Tactical Light'],
      utility: ['Extra Ammo', 'Med Kit']
    } as RealisticLoadout,
    abilities: [
      {
        id: 'dynamic_entry',
        name: 'Dynamic Entry',
        description: 'Coordinated door breach with concussion effect. Military standard room clearing technique.',
        icon: '🚪',
        cooldown: 25000,
        duration: 3000,
        uses: 3,
        type: 'active',
        equipment: 'Breach Charge',
        realism: 9
      },
      {
        id: 'suppressive_fire',
        name: 'Suppressive Fire',
        description: 'Lay down accurate suppressive fire to pin enemies. Trained military fire discipline.',
        icon: '🔥',
        cooldown: 15000,
        duration: 5000,
        uses: -1,
        type: 'active',
        equipment: 'Assault Rifle',
        realism: 10
      },
      {
        id: 'combat_medic',
        name: 'Combat Medic',
        description: 'Advanced first aid training. Can stabilize downed teammates in combat.',
        icon: '⚕️',
        cooldown: 30000,
        duration: 4000,
        uses: 2,
        type: 'active',
        equipment: 'Medical Kit',
        realism: 8
      }
    ] as RealisticAbility[]
  },
  {
    id: 'recon_specialist',
    name: 'RECON SPECIALIST',
    role: 'Scout / Forward Observer',
    icon: '👁️',
    primaryColor: '#2b6cb0',
    secondaryColor: '#3182ce',
    description: 'Elite reconnaissance operator. Stealth infiltration and information gathering expert.',
    health: 90,
    armor: 30,
    speed: 1.2,
    loadout: {
      primary: ['M110 SASS', 'Mk 14 EBR', 'SCAR-PR'],
      secondary: ['M9 Beretta', 'Glock 17'],
      equipment: ['Binoculars', 'Spotting Scope', 'Signal Flare'],
      tactical: ['Thermal Scope', 'Laser Designator'],
      utility: ['Radio Jammer', 'Silencer']
    } as RealisticLoadout,
    abilities: [
      {
        id: 'thermal_vision',
        name: 'Thermal Vision',
        description: 'Military-grade thermal imaging device. Detects heat signatures through walls and smoke.',
        icon: '🌡️',
        cooldown: 20000,
        duration: 8000,
        uses: 2,
        type: 'active',
        equipment: 'Thermal Scope',
        realism: 9
      },
      {
        id: 'silent_movement',
        name: 'Silent Movement',
        description: 'Advanced stealth techniques. Move silently through buildings and terrain.',
        icon: '🤫',
        cooldown: 18000,
        duration: 10000,
        uses: 3,
        type: 'active',
        equipment: 'Tactical Boots',
        realism: 8
      },
      {
        id: 'forward_observer',
        name: 'Forward Observer',
        description: 'Mark enemy positions for team. Military forward observer training.',
        icon: '📍',
        cooldown: 25000,
        duration: 15000,
        uses: -1,
        type: 'active',
        equipment: 'Radio',
        realism: 10
      }
    ] as RealisticAbility[]
  },
  {
    id: 'marksman',
    name: 'MARKSMAN OPERATOR',
    role: 'Designated Marksman / Counter-Sniper',
    icon: '🎯',
    primaryColor: '#744210',
    secondaryColor: '#975a16',
    description: 'Expert marksman with specialized long-range training. Precision engagement specialist.',
    health: 85,
    armor: 25,
    speed: 0.9,
    loadout: {
      primary: ['M24 SWS', 'M2010 ESR', 'AWM'],
      secondary: ['M1911', 'Glock 21'],
      equipment: ['Rangefinder', 'Spotting Scope', 'Ballistic Calculator'],
      tactical: ['High-Power Scope', 'Bipod'],
      utility: ['Camouflage Net', 'Wind Meter']
    } as RealisticLoadout,
    abilities: [
      {
        id: 'steady_aim',
        name: 'Steady Aim',
        description: 'Military marksmanship breathing control. Eliminates sway for precision shots.',
        icon: '🎯',
        cooldown: 12000,
        duration: 4000,
        uses: 4,
        type: 'active',
        equipment: 'Bipod',
        realism: 10
      },
      {
        id: 'ballistic_calculation',
        name: 'Ballistic Calculation',
        description: 'Military ballistic computer integration. Accounts for wind, distance, and bullet drop.',
        icon: '📐',
        cooldown: 15000,
        duration: 6000,
        uses: 3,
        type: 'active',
        equipment: 'Ballistic Calculator',
        realism: 9
      },
      {
        id: 'overwatch_position',
        name: 'Overwatch Position',
        description: 'Establish superior firing position. Military tactical positioning training.',
        icon: '🏔️',
        cooldown: 30000,
        duration: 12000,
        uses: 2,
        type: 'active',
        equipment: 'Climbing Gear',
        realism: 8
      }
    ] as RealisticAbility[]
  },
  {
    id: 'combat_engineer',
    name: 'COMBAT ENGINEER',
    role: 'Combat Engineer / Demolitions',
    icon: '🔧',
    primaryColor: '#6b7280',
    secondaryColor: '#9ca3af',
    description: 'Military combat engineer. Fortification and demolition specialist.',
    health: 100,
    armor: 80,
    speed: 0.85,
    loadout: {
      primary: ['M16A4', 'FAMAS G2', 'Steyr AUG'],
      secondary: ['M9 Beretta', 'USP45'],
      equipment: ['C4 Explosives', 'Claymore Mines', 'Tool Kit'],
      tactical: ['Shotgun Attachment', 'Grip Pod'],
      utility: ['Sandbags', 'Barbed Wire', 'Repair Kit']
    } as RealisticLoadout,
    abilities: [
      {
        id: 'deploy_cover',
        name: 'Deploy Cover',
        description: 'Construct tactical fortifications using military engineering equipment.',
        icon: '🛡️',
        cooldown: 35000,
        duration: 20000,
        uses: 3,
        type: 'active',
        equipment: 'Sandbags',
        realism: 9
      },
      {
        id: 'demolitions_expert',
        name: 'Demolitions Expert',
        description: 'Military demolitions training. Plant and detonate charges for tactical advantage.',
        icon: '💣',
        cooldown: 40000,
        duration: 5000,
        uses: 2,
        type: 'active',
        equipment: 'C4 Explosives',
        realism: 10
      },
      {
        id: 'field_repair',
        name: 'Field Repair',
        description: 'Military engineering skills. Repair equipment and reinforce structures.',
        icon: '🔧',
        cooldown: 45000,
        duration: 8000,
        uses: 2,
        type: 'active',
        equipment: 'Tool Kit',
        realism: 8
      }
    ] as RealisticAbility[]
  },
  {
    id: 'field_medic',
    name: 'FIELD MEDIC',
    role: 'Combat Medic / Medical Specialist',
    icon: '🏥',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    description: 'Military combat medic. Advanced trauma care and medical evacuation specialist.',
    health: 95,
    armor: 40,
    speed: 1.1,
    loadout: {
      primary: ['M4 Carbine', 'G36C', 'AUG A3'],
      secondary: ['Glock 19', 'SIG P226'],
      equipment: ['Medical Kit', 'Defibrillator', 'Tourniquet'],
      tactical: ['Red Dot Sight', 'Tactical Light'],
      utility: ['Bandages', 'Painkillers', 'Splint Kit']
    } as RealisticLoadout,
    abilities: [
      {
        id: 'advanced_medical',
        name: 'Advanced Medical',
        description: 'Military trauma care. Stabilize critical wounds and prevent casualties.',
        icon: '⚕️',
        cooldown: 20000,
        duration: 5000,
        uses: 3,
        type: 'active',
        equipment: 'Medical Kit',
        realism: 9
      },
      {
        id: 'combat_resuscitation',
        name: 'Combat Resuscitation',
        description: 'Field emergency procedures. Revive critically wounded teammates.',
        icon: '⚡',
        cooldown: 45000,
        duration: 3000,
        uses: 2,
        type: 'active',
        equipment: 'Defibrillator',
        realism: 8
      },
      {
        id: 'preventive_care',
        name: 'Preventive Care',
        description: 'Military preventive medicine. Improve team combat effectiveness.',
        icon: '💉',
        cooldown: 30000,
        duration: 10000,
        uses: 2,
        type: 'active',
        equipment: 'Stimulant Kit',
        realism: 7
      }
    ] as RealisticAbility[]
  }
]

// REALISTIC ABILITY MANAGER
export class RealisticAbilityManager {
  private selectedClass: typeof REALISTIC_CLASSES[0] | null = null
  private abilityCooldowns: { [key: string]: number } = {}
  private activeAbilities: { [key: string]: boolean } = {}
  private equipmentLoadout: { [key: string]: string[] } = {}

  constructor() {
    this.abilityCooldowns = {}
    this.activeAbilities = {}
    this.equipmentLoadout = {}
  }

  selectClass(classId: string): boolean {
    const cls = REALISTIC_CLASSES.find(c => c.id === classId)
    if (cls) {
      this.selectedClass = cls
      this.setupLoadout(cls)
      return true
    }
    return false
  }

  private setupLoadout(cls: typeof REALISTIC_CLASSES[0]): void {
    this.equipmentLoadout = {
      primary: [cls.loadout.primary[0]], // Select first primary weapon
      secondary: [cls.loadout.secondary[0]], // Select first secondary weapon
      equipment: cls.loadout.equipment,
      tactical: cls.loadout.tactical,
      utility: cls.loadout.utility
    }
  }

  getSelectedClass(): typeof REALISTIC_CLASSES[0] | null {
    return this.selectedClass
  }

  getLoadout(): { [key: string]: string[] } {
    return this.equipmentLoadout
  }

  canUseAbility(abilityId: string): boolean {
    if (!this.selectedClass) return false

    const ability = this.selectedClass.abilities.find(a => a.id === abilityId)
    if (!ability) return false

    // Check if ability is on cooldown
    if (this.abilityCooldowns[abilityId] && this.abilityCooldowns[abilityId] > Date.now()) {
      return false
    }

    return true
  }

  useAbility(abilityId: string): boolean {
    if (!this.canUseAbility(abilityId)) return false

    const ability = this.selectedClass!.abilities.find(a => a.id === abilityId)
    if (!ability) return false

    // Set cooldown
    this.abilityCooldowns[abilityId] = Date.now() + ability.cooldown

    // Activate ability if it has duration
    if (ability.duration > 0) {
      this.activeAbilities[abilityId] = true
      setTimeout(() => {
        this.activeAbilities[abilityId] = false
      }, ability.duration)
    }

    return true
  }

  getAbilityStatus(abilityId: string): {
    canUse: boolean
    cooldownRemaining: number
    isActive: boolean
    ability: RealisticAbility | null
  } {
    if (!this.selectedClass) {
      return {
        canUse: false,
        cooldownRemaining: 0,
        isActive: false,
        ability: null
      }
    }

    const ability = this.selectedClass.abilities.find(a => a.id === abilityId)
    if (!ability) {
      return {
        canUse: false,
        cooldownRemaining: 0,
        isActive: false,
        ability: null
      }
    }

    const cooldownEnd = this.abilityCooldowns[abilityId] || 0
    const cooldownRemaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000))
    const isActive = this.activeAbilities[abilityId] || false

    return {
      canUse: cooldownRemaining === 0,
      cooldownRemaining,
      isActive,
      ability
    }
  }

  getAllAbilityStatuses(): { [key: string]: any } {
    if (!this.selectedClass) return {}

    const statuses: { [key: string]: any } = {}
    this.selectedClass.abilities.forEach(ability => {
      statuses[ability.id] = this.getAbilityStatus(ability.id)
    })

    return statuses
  }

  // Get realistic military description
  getRealisticDescription(): string {
    if (!this.selectedClass) return ""

    return `Military ${this.selectedClass.role.toLowerCase()}. Trained in modern special forces tactics and equipment. No experimental technology - only proven military hardware and techniques used by elite units worldwide.`
  }

  // Get equipment list for UI
  getEquipmentList(): { category: string, items: string[] }[] {
    if (!this.selectedClass) return []

    const loadout = this.selectedClass.loadout
    return [
      { category: 'Primary Weapons', items: loadout.primary },
      { category: 'Secondary Weapons', items: loadout.secondary },
      { category: 'Equipment', items: loadout.equipment },
      { category: 'Tactical Gear', items: loadout.tactical },
      { category: 'Utility Items', items: loadout.utility }
    ]
  }
}

export default RealisticAbilityManager