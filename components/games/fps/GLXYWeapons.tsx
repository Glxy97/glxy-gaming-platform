// @ts-nocheck
'use client'

import * as THREE from 'three'

// EXTENSIVE WEAPON ARSENAL - Inspired by CS:GO, Valorant, CoD, Battlefield
export interface GLXYWeapon {
  id: string
  name: string
  type: WeaponType
  category: string
  damage: number
  fireRate: number
  range: number
  accuracy: number
  recoil: number
  magazineSize: number
  reserveAmmo: number
  reloadTime: number
  price: number
  unlockLevel: number
  fireMode: 'semi' | 'auto' | 'burst' | 'charge' | 'bolt' | 'single'
  specialProperties?: string[]
  attachments?: WeaponAttachment[]
  skinTiers?: WeaponSkinTier[]
}

export interface WeaponAttachment {
  id: string
  name: string
  type: 'barrel' | 'optic' | 'underbarrel' | 'magazine' | 'stock' | 'laser'
  effect: AttachmentEffect
  unlockLevel: number
}

export interface AttachmentEffect {
  damage?: number
  accuracy?: number
  recoil?: number
  range?: number
  fireRate?: number
  magazineSize?: number
}

export interface WeaponSkinTier {
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  price: number
  visualEffects: string[]
}

export type WeaponType =
  | 'assault_rifle'
  | 'submachine_gun'
  | 'shotgun'
  | 'sniper_rifle'
  | 'light_machine_gun'
  | 'pistol'
  | 'revolver'
  | 'machine_pistol'
  | 'marksman_rifle'
  | 'combat_shotgun'
  | 'energy_weapon'
  | 'melee'
  | 'grenade_launcher'
  | 'rocket_launcher'

// COMPREHENSIVE WEAPON COLLECTION
export const GLXY_WEAPONS: GLXYWeapon[] = [
  // ASSAULT RIFLES - CS:GO AK-47, M4A4 inspired
  {
    id: 'glxy_assault_rifle',
    name: 'GLXY AR-15 Tactical',
    type: 'assault_rifle',
    category: 'Assault Rifles',
    damage: 35,
    fireRate: 667,
    range: 60,
    accuracy: 85,
    recoil: 65,
    magazineSize: 30,
    reserveAmmo: 120,
    reloadTime: 2.5,
    price: 2700,
    unlockLevel: 1,
    fireMode: 'auto',
    specialProperties: ['armor_penetration'],
    attachments: [
      {
        id: 'ar_silencer',
        name: 'Tactical Silencer',
        type: 'barrel',
        effect: { damage: -5, recoil: -15, accuracy: 10 },
        unlockLevel: 3
      },
      {
        id: 'ar_scope',
        name: '4x Tactical Scope',
        type: 'optic',
        effect: { accuracy: 25, recoil: 5, range: 30 },
        unlockLevel: 5
      }
    ]
  },
  {
    id: 'glxy_battle_rifle',
    name: 'GLXY BR-16 Marksman',
    type: 'marksman_rifle',
    category: 'Battle Rifles',
    damage: 55,
    fireRate: 400,
    range: 80,
    accuracy: 92,
    recoil: 75,
    magazineSize: 20,
    reserveAmmo: 80,
    reloadTime: 3.0,
    price: 3100,
    unlockLevel: 10,
    fireMode: 'semi',
    specialProperties: ['headshot_multiplier', 'long_range']
  },
  {
    id: 'glxy_carbine',
    name: 'GLXY C-8 Carbine',
    type: 'assault_rifle',
    category: 'Assault Rifles',
    damage: 28,
    fireRate: 800,
    range: 45,
    accuracy: 78,
    recoil: 45,
    magazineSize: 35,
    reserveAmmo: 140,
    reloadTime: 2.2,
    price: 2400,
    unlockLevel: 4,
    fireMode: 'auto',
    specialProperties: ['light_weight', 'fast_handling']
  },

  // SUBMACHINE GUNS - MP5, P90 inspired
  {
    id: 'glxy_smg',
    name: 'GLXY SMG-9',
    type: 'submachine_gun',
    category: 'Submachine Guns',
    damage: 22,
    fireRate: 1000,
    range: 30,
    accuracy: 72,
    recoil: 35,
    magazineSize: 40,
    reserveAmmo: 160,
    reloadTime: 2.0,
    price: 1800,
    unlockLevel: 2,
    fireMode: 'auto',
    specialProperties: ['close_range', 'high_mobility']
  },
  {
    id: 'glxy_pdw',
    name: 'GLXY PDW-45',
    type: 'submachine_gun',
    category: 'Submachine Guns',
    damage: 18,
    fireRate: 1200,
    range: 25,
    accuracy: 68,
    recoil: 30,
    magazineSize: 50,
    reserveAmmo: 200,
    reloadTime: 1.8,
    price: 1600,
    unlockLevel: 6,
    fireMode: 'auto',
    specialProperties: ['extreme_rate', 'low_recoil']
  },
  {
    id: 'glxy_tactical_smg',
    name: 'GLXY TAC-SMG',
    type: 'submachine_gun',
    category: 'Submachine Guns',
    damage: 25,
    fireRate: 900,
    range: 35,
    accuracy: 80,
    recoil: 40,
    magazineSize: 30,
    reserveAmmo: 120,
    reloadTime: 2.1,
    price: 2200,
    unlockLevel: 8,
    fireMode: 'burst',
    specialProperties: ['burst_fire', 'balanced']
  },

  // SHOTGUNS - Pump-action, Semi-auto inspired
  {
    id: 'glxy_shotgun',
    name: 'GLXY SG-12 Combat',
    type: 'shotgun',
    category: 'Shotguns',
    damage: 120,
    fireRate: 120,
    range: 15,
    accuracy: 60,
    recoil: 85,
    magazineSize: 8,
    reserveAmmo: 32,
    reloadTime: 4.0,
    price: 2000,
    unlockLevel: 3,
    fireMode: 'semi',
    specialProperties: ['spread_shot', 'close_power']
  },
  {
    id: 'glxy_auto_shotgun',
    name: 'GLXY AS-24 Auto',
    type: 'combat_shotgun',
    category: 'Shotguns',
    damage: 90,
    fireRate: 300,
    range: 18,
    accuracy: 55,
    recoil: 70,
    magazineSize: 12,
    reserveAmmo: 48,
    reloadTime: 3.5,
    price: 2800,
    unlockLevel: 12,
    fireMode: 'auto',
    specialProperties: ['auto_fire', 'pellet_storm']
  },

  // SNIPER RIFLES - AWP, Kar98k inspired
  {
    id: 'glxy_sniper_rifle',
    name: 'GLXY SR-50 Intervention',
    type: 'sniper_rifle',
    category: 'Sniper Rifles',
    damage: 180,
    fireRate: 45,
    range: 150,
    accuracy: 98,
    recoil: 95,
    magazineSize: 5,
    reserveAmmo: 20,
    reloadTime: 4.5,
    price: 4750,
    unlockLevel: 15,
    fireMode: 'bolt',
    specialProperties: ['one_shot_kill', 'extreme_range', 'high_power']
  },
  {
    id: 'glxy_marksman_rifle',
    name: 'GLXY MSR-762',
    type: 'marksman_rifle',
    category: 'Sniper Rifles',
    damage: 85,
    fireRate: 180,
    range: 100,
    accuracy: 94,
    recoil: 70,
    magazineSize: 10,
    reserveAmmo: 40,
    reloadTime: 3.8,
    price: 3200,
    unlockLevel: 11,
    fireMode: 'semi',
    specialProperties: ['semi_auto', 'versatile']
  },
  {
    id: 'glxy_light_sniper',
    name: 'GLXY LSR-556',
    type: 'marksman_rifle',
    category: 'Sniper Rifles',
    damage: 65,
    fireRate: 250,
    range: 75,
    accuracy: 90,
    recoil: 55,
    magazineSize: 15,
    reserveAmmo: 60,
    reloadTime: 3.2,
    price: 2600,
    unlockLevel: 7,
    fireMode: 'semi',
    specialProperties: ['light_weight', 'quick_scoping']
  },

  // LIGHT MACHINE GUNS - M249, RPK inspired
  {
    id: 'glxy_lmg',
    name: 'GLXY LMG-249 SAW',
    type: 'light_machine_gun',
    category: 'Light Machine Guns',
    damage: 45,
    fireRate: 750,
    range: 70,
    accuracy: 70,
    recoil: 80,
    magazineSize: 100,
    reserveAmmo: 200,
    reloadTime: 6.0,
    price: 5200,
    unlockLevel: 18,
    fireMode: 'auto',
    specialProperties: ['suppressive_fire', 'large_ammo', 'deployable']
  },
  {
    id: 'glxy_support_lmg',
    name: 'GLXY SLM-RPK',
    type: 'light_machine_gun',
    category: 'Light Machine Guns',
    damage: 38,
    fireRate: 700,
    range: 60,
    accuracy: 75,
    recoil: 65,
    magazineSize: 75,
    reserveAmmo: 150,
    reloadTime: 4.5,
    price: 4100,
    unlockLevel: 14,
    fireMode: 'auto',
    specialProperties: ['mobile_support', 'moderate_recoil']
  },

  // PISTOLS - Glock, Deagle inspired
  {
    id: 'glxy_pistol',
    name: 'GLXY P-19 Sidearm',
    type: 'pistol',
    category: 'Pistols',
    damage: 25,
    fireRate: 400,
    range: 20,
    accuracy: 75,
    recoil: 25,
    magazineSize: 17,
    reserveAmmo: 68,
    reloadTime: 1.5,
    price: 500,
    unlockLevel: 1,
    fireMode: 'semi',
    specialProperties: ['reliable', 'fast_fire']
  },
  {
    id: 'glxy_heavy_pistol',
    name: 'GLXY HP-50 Desert',
    type: 'revolver',
    category: 'Pistols',
    damage: 65,
    fireRate: 180,
    range: 25,
    accuracy: 82,
    recoil: 55,
    magazineSize: 7,
    reserveAmmo: 28,
    reloadTime: 2.8,
    price: 800,
    unlockLevel: 5,
    fireMode: 'semi',
    specialProperties: ['high_damage', 'low_capacity']
  },
  {
    id: 'glxy_machine_pistol',
    name: 'GLXY MP-18 Auto',
    type: 'machine_pistol',
    category: 'Pistols',
    damage: 18,
    fireRate: 900,
    range: 15,
    accuracy: 65,
    recoil: 35,
    magazineSize: 25,
    reserveAmmo: 100,
    reloadTime: 1.8,
    price: 600,
    unlockLevel: 3,
    fireMode: 'auto',
    specialProperties: ['full_auto_pistol', 'close_range']
  },
  {
    id: 'glxy_tactical_pistol',
    name: 'GLXY TP-92 Tactical',
    type: 'pistol',
    category: 'Pistols',
    damage: 32,
    fireRate: 300,
    range: 22,
    accuracy: 85,
    recoil: 30,
    magazineSize: 12,
    reserveAmmo: 48,
    reloadTime: 2.0,
    price: 700,
    unlockLevel: 4,
    fireMode: 'semi',
    specialProperties: ['high_accuracy', 'tactical']
  },

  // ENERGY WEAPERS - Sci-fi inspired
  {
    id: 'glxy_plasma_rifle',
    name: 'GLXY PR-1 Plasma',
    type: 'energy_weapon',
    category: 'Energy Weapons',
    damage: 40,
    fireRate: 600,
    range: 55,
    accuracy: 88,
    recoil: 20,
    magazineSize: 40,
    reserveAmmo: 120,
    reloadTime: 2.5,
    price: 4500,
    unlockLevel: 20,
    fireMode: 'auto',
    specialProperties: ['energy_damage', 'no_ammo_pickup', 'heat_buildup']
  },
  {
    id: 'glxy_railgun',
    name: 'GLXY RG-X Railgun',
    type: 'energy_weapon',
    category: 'Energy Weapons',
    damage: 200,
    fireRate: 60,
    range: 120,
    accuracy: 96,
    recoil: 100,
    magazineSize: 1,
    reserveAmmo: 10,
    reloadTime: 5.0,
    price: 6500,
    unlockLevel: 25,
    fireMode: 'charge',
    specialProperties: ['charge_fire', 'penetration', 'delayed_shot']
  },

  // SPECIAL WEAPONS - Rocket launchers, grenade launchers
  {
    id: 'glxy_rocket_launcher',
    name: 'GLXY RL-8 Havoc',
    type: 'rocket_launcher',
    category: 'Explosives',
    damage: 250,
    fireRate: 30,
    range: 80,
    accuracy: 60,
    recoil: 110,
    magazineSize: 1,
    reserveAmmo: 5,
    reloadTime: 8.0,
    price: 8000,
    unlockLevel: 30,
    fireMode: 'single',
    specialProperties: ['explosive', 'splash_damage', 'slow_reload']
  }
]

// Weapon Manager Class
export class GLXYWeaponManager {
  private playerLoadout: PlayerLoadout
  private weaponInventory: string[]
  private weaponLevels: { [key: string]: number }
  private weaponXP: { [key: string]: number }
  private equippedAttachments: { [key: string]: string[] } = {}

  constructor() {
    this.playerLoadout = {
      primary: 'glxy_assault_rifle',
      secondary: 'glxy_pistol',
      melee: 'glxy_combat_knife',
      tactical: ['glxy_frag_grenade'],
      lethal: []
    }
    this.weaponInventory = ['glxy_pistol'] // Start with basic pistol
    this.weaponLevels = {}
    this.weaponXP = {}

    // Initialize weapon levels
    GLXY_WEAPONS.forEach(weapon => {
      this.weaponLevels[weapon.id] = 1
      this.weaponXP[weapon.id] = 0
    })
  }

  getLoadout(): PlayerLoadout {
    return this.playerLoadout
  }

  setLoadout(slot: keyof PlayerLoadout, weaponId: string): boolean {
    if (this.isWeaponUnlocked(weaponId)) {
      if (slot === 'tactical' || slot === 'lethal') {
        (this.playerLoadout[slot] as string[]).push(weaponId)
      } else {
        (this.playerLoadout as any)[slot] = weaponId
      }
      return true
    }
    return false
  }

  isWeaponUnlocked(weaponId: string): boolean {
    return this.weaponInventory.includes(weaponId)
  }

  unlockWeapon(weaponId: string): boolean {
    const weapon = GLXY_WEAPONS.find(w => w.id === weaponId)
    if (weapon && !this.isWeaponUnlocked(weaponId)) {
      this.weaponInventory.push(weaponId)
      return true
    }
    return false
  }

  addWeaponXP(weaponId: string, xp: number): void {
    if (!this.isWeaponUnlocked(weaponId)) return

    this.weaponXP[weaponId] = (this.weaponXP[weaponId] || 0) + xp
    const currentLevel = this.weaponLevels[weaponId] || 1
    const xpNeeded = currentLevel * 500

    if (this.weaponXP[weaponId] >= xpNeeded) {
      this.levelUpWeapon(weaponId)
    }
  }

  private levelUpWeapon(weaponId: string): void {
    this.weaponLevels[weaponId] = (this.weaponLevels[weaponId] || 1) + 1
    this.weaponXP[weaponId] = 0
  }

  getWeaponLevel(weaponId: string): number {
    return this.weaponLevels[weaponId] || 1
  }

  equipAttachment(weaponId: string, attachmentId: string): boolean {
    const weapon = GLXY_WEAPONS.find(w => w.id === weaponId)
    if (!weapon) return false

    const attachment = weapon.attachments?.find(a => a.id === attachmentId)
    if (!attachment || this.getWeaponLevel(weaponId) < attachment.unlockLevel) {
      return false
    }

    if (!this.equippedAttachments[weaponId]) {
      this.equippedAttachments[weaponId] = []
    }

    // Remove existing attachment of same type
    this.equippedAttachments[weaponId] = this.equippedAttachments[weaponId].filter(id => {
      const existing = weapon.attachments?.find(a => a.id === id)
      return existing?.type !== attachment.type
    })

    this.equippedAttachments[weaponId].push(attachmentId)
    return true
  }

  getEquippedAttachments(weaponId: string): string[] {
    return this.equippedAttachments[weaponId] || []
  }

  getWeaponStats(weaponId: string): GLXYWeapon | null {
    const weapon = GLXY_WEAPONS.find(w => w.id === weaponId)
    if (!weapon) return null

    // Apply attachment bonuses
    let modifiedWeapon = { ...weapon }
    const attachments = this.getEquippedAttachments(weaponId)

    attachments.forEach(attachmentId => {
      const attachment = weapon.attachments?.find(a => a.id === attachmentId)
      if (attachment?.effect) {
        Object.keys(attachment.effect).forEach(stat => {
          const value = attachment.effect[stat as keyof AttachmentEffect] || 0
          const weaponStat = stat as keyof GLXYWeapon
          if (typeof modifiedWeapon[weaponStat] === 'number') {
            (modifiedWeapon as any)[weaponStat] += value
          }
        })
      }
    })

    return modifiedWeapon
  }

  // Create 3D weapon model
  createWeaponModel(weapon: GLXYWeapon): THREE.Group {
    const group = new THREE.Group()

    // Main weapon body
    const bodyGeometry = new THREE.BoxGeometry(
      weapon.type.includes('rifle') ? 1.2 : 0.8,
      0.3,
      0.15
    )
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.8
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    group.add(body)

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8)
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.9
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.z = Math.PI / 2
    barrel.position.x = 0.6
    group.add(barrel)

    // Grip
    const gripGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.2)
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    })
    const grip = new THREE.Mesh(gripGeometry, gripMaterial)
    grip.position.set(-0.2, -0.3, 0)
    group.add(grip)

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.3)
    const magMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.6
    })
    const magazine = new THREE.Mesh(magGeometry, magMaterial)
    magazine.position.set(-0.1, -0.2, 0.1)
    group.add(magazine)

    // Add type-specific visual elements
    switch (weapon.type) {
      case 'sniper_rifle':
        // Add scope
        const scopeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.15)
        const scopeMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.2,
          metalness: 0.8
        })
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial)
        scope.position.set(0.2, 0.1, 0)
        group.add(scope)
        break

      case 'shotgun':
        // Add pump
        const pumpGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.12)
        const pumpMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          roughness: 0.5
        })
        const pump = new THREE.Mesh(pumpGeometry, pumpMaterial)
        pump.position.set(0.3, 0, 0)
        group.add(pump)
        break

      case 'energy_weapon':
        // Add energy cell
        const cellGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6)
        const cellMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff
        })
        const energyCell = new THREE.Mesh(cellGeometry, cellMaterial)
        energyCell.rotation.z = Math.PI / 2
        energyCell.position.set(-0.3, 0, 0.2)
        group.add(energyCell)
        break
    }

    return group
  }
}

export interface PlayerLoadout {
  primary: string
  secondary: string
  melee: string
  tactical: string[]
  lethal: string[]
}

export default GLXYWeaponManager