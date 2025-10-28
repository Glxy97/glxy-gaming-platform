// @ts-nocheck
'use client'

import * as THREE from 'three'

// ADVANCED WEAPON CUSTOMIZATION SYSTEM - EPIC GUN CUSTOMIZATION!
export interface WeaponAttachment {
  id: string
  name: string
  type: 'scope' | 'barrel' | 'magazine' | 'grip' | 'stock' | 'muzzle' | 'laser' | 'light' | 'skin' | 'charm'
  slot: string
  stats: WeaponStats
  visualModel?: THREE.Object3D
  unlockLevel: number
  cost: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  description: string
  restrictions?: string[] // Weapons this can be attached to
  effects?: {
    soundModifier?: string
    muzzleFlash?: THREE.Color
    trailColor?: THREE.Color
    particleEffect?: string
  }
}

export interface WeaponStats {
  damage: number
  fireRate: number
  range: number
  accuracy: number
  stability: number
  mobility: number
  recoilControl: number
  magazineSize: number
  reloadSpeed: number
  drawSpeed: number
  armorPenetration: number
  suppressor: boolean
  fireModes: ('semi' | 'burst' | 'auto')[]
}

export interface RecoilPattern {
  points: THREE.Vector2[]
  recoveryTime: number
  kickback: THREE.Vector3
  spread: number
  patternName: string
}

export interface CustomizedWeapon {
  baseWeapon: string
  name: string
  attachments: Map<string, WeaponAttachment>
  stats: WeaponStats
  recoilPattern: RecoilPattern
  visualModel: THREE.Group
  skin: WeaponSkin | null
  charms: WeaponAttachment[]
  killCounter: number
  headshotCounter: number
  experience: number
  level: number
}

export interface WeaponSkin {
  id: string
  name: string
  baseColor: THREE.Color
  pattern: 'solid' | 'camo' | 'digital' | 'urban' | 'arctic' | 'desert' | 'neon' | 'dragon' | 'tiger'
  patternColor: THREE.Color
  finish: 'matte' | 'glossy' | 'metallic' | 'carbon' | 'pearlescent'
  wear: number // 0-1, affects appearance
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlockLevel: number
  cost: number
  animated?: boolean
  specialEffects?: string[]
}

export class GLXYWeaponCustomization {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private weapons: Map<string, CustomizedWeapon>
  private availableAttachments: Map<string, WeaponAttachment>
  private availableSkins: Map<string, WeaponSkin>
  private attachmentModels: Map<string, THREE.Object3D>
  private recoilPatterns: Map<string, RecoilPattern>
  private currentWeapon: string | null = null

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene
    this.camera = camera
    this.weapons = new Map()
    this.availableAttachments = new Map()
    this.availableSkins = new Map()
    this.attachmentModels = new Map()
    this.recoilPatterns = new Map()

    this.initializeAttachments()
    this.initializeSkins()
    this.initializeRecoilPatterns()
    this.createAttachmentModels()
  }

  // Initialize available attachments
  private initializeAttachments(): void {
    // Scopes
    this.availableAttachments.set('reflex_sight', {
      id: 'reflex_sight',
      name: 'Reflex Sight',
      type: 'scope',
      slot: 'optic',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 15,
        stability: 0,
        mobility: -5,
        recoilControl: 5,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 1,
      cost: 500,
      rarity: 'common',
      description: 'Red dot sight for fast target acquisition'
    })

    this.availableAttachments.set('holographic_sight', {
      id: 'holographic_sight',
      name: 'Holographic Sight',
      type: 'scope',
      slot: 'optic',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 5,
        accuracy: 20,
        stability: 5,
        mobility: -5,
        recoilControl: 10,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 5,
      cost: 1500,
      rarity: 'uncommon',
      description: 'Advanced holographic reticle with improved accuracy'
    })

    this.availableAttachments.set('4x_scope', {
      id: '4x_scope',
      name: '4x Scope',
      type: 'scope',
      slot: 'optic',
      stats: {
        damage: 0,
        fireRate: -10,
        range: 50,
        accuracy: 35,
        stability: 10,
        mobility: -15,
        recoilControl: 20,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 5,
        suppressor: false,
        fireModes: ['semi', 'burst']
      },
      unlockLevel: 10,
      cost: 3000,
      rarity: 'rare',
      description: 'Medium range scope with 4x magnification'
    })

    this.availableAttachments.set('8x_scope', {
      id: '8x_scope',
      name: '8x Scope',
      type: 'scope',
      slot: 'optic',
      stats: {
        damage: 0,
        fireRate: -20,
        range: 100,
        accuracy: 50,
        stability: 15,
        mobility: -25,
        recoilControl: 30,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 10,
        suppressor: false,
        fireModes: ['semi']
      },
      unlockLevel: 15,
      cost: 6000,
      rarity: 'epic',
      description: 'Long range scope with 8x magnification'
    })

    // Barrels
    this.availableAttachments.set('extended_barrel', {
      id: 'extended_barrel',
      name: 'Extended Barrel',
      type: 'barrel',
      slot: 'barrel',
      stats: {
        damage: 5,
        fireRate: -5,
        range: 30,
        accuracy: 10,
        stability: 15,
        mobility: -10,
        recoilControl: 20,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 10,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 3,
      cost: 1200,
      rarity: 'common',
      description: 'Longer barrel for improved range and accuracy'
    })

    this.availableAttachments.set('compensator', {
      id: 'compensator',
      name: 'Muzzle Compensator',
      type: 'barrel',
      slot: 'muzzle',
      stats: {
        damage: 0,
        fireRate: 0,
        range: -5,
        accuracy: -5,
        stability: 20,
        mobility: -5,
        recoilControl: 35,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 4,
      cost: 800,
      rarity: 'common',
      description: 'Reduces muzzle climb for better recoil control'
    })

    this.availableAttachments.set('silencer', {
      id: 'silencer',
      name: 'Suppressor',
      type: 'barrel',
      slot: 'muzzle',
      stats: {
        damage: -10,
        fireRate: 0,
        range: -15,
        accuracy: 5,
        stability: 10,
        mobility: -5,
        recoilControl: 15,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: -5,
        suppressor: true,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 6,
      cost: 2000,
      rarity: 'uncommon',
      description: 'Silences weapon shots and hides muzzle flash',
      effects: {
        soundModifier: 'silenced',
        muzzleFlash: new THREE.Color(0x000000)
      }
    })

    // Magazines
    this.availableAttachments.set('extended_mag', {
      id: 'extended_mag',
      name: 'Extended Magazine',
      type: 'magazine',
      slot: 'magazine',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 0,
        stability: -5,
        mobility: -10,
        recoilControl: 0,
        magazineSize: 50,
        reloadSpeed: -15,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 8,
      cost: 1800,
      rarity: 'uncommon',
      description: 'Increases magazine capacity by 50%'
    })

    this.availableAttachments.set('speed_mag', {
      id: 'speed_mag',
      name: 'Speed Magazine',
      type: 'magazine',
      slot: 'magazine',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 0,
        stability: 0,
        mobility: 0,
        recoilControl: 0,
        magazineSize: 0,
        reloadSpeed: 25,
        drawSpeed: 10,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 7,
      cost: 1500,
      rarity: 'uncommon',
      description: 'Faster reload and weapon deployment'
    })

    // Grips
    this.availableAttachments.set('vertical_grip', {
      id: 'vertical_grip',
      name: 'Vertical Grip',
      type: 'grip',
      slot: 'underbarrel',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 10,
        stability: 25,
        mobility: -5,
        recoilControl: 20,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 5,
      cost: 1000,
      rarity: 'common',
      description: 'Improves vertical recoil control'
    })

    this.availableAttachments.set('angled_grip', {
      id: 'angled_grip',
      name: 'Angled Grip',
      type: 'grip',
      slot: 'underbarrel',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 5,
        stability: 15,
        mobility: 5,
        recoilControl: 15,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 15,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 6,
      cost: 1200,
      rarity: 'uncommon',
      description: 'Faster weapon deployment with good recoil control'
    })

    // Lasers & Lights
    this.availableAttachments.set('tactical_laser', {
      id: 'tactical_laser',
      name: 'Tactical Laser',
      type: 'laser',
      slot: 'underbarrel',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 20,
        stability: 0,
        mobility: 0,
        recoilControl: 5,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 9,
      cost: 2500,
      rarity: 'rare',
      description: 'Improves hip fire accuracy and target acquisition',
      effects: {
        particleEffect: 'laser_beam'
      }
    })

    this.availableAttachments.set('tactical_light', {
      id: 'tactical_light',
      name: 'Tactical Light',
      type: 'light',
      slot: 'underbarrel',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 5,
        stability: 0,
        mobility: 0,
        recoilControl: 0,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 2,
      cost: 700,
      rarity: 'common',
      description: 'Illuminates dark areas',
      effects: {
        particleEffect: 'light_cone'
      }
    })

    // Skins
    this.availableAttachments.set('digital_camo', {
      id: 'digital_camo',
      name: 'Digital Camo',
      type: 'skin',
      slot: 'skin',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 0,
        stability: 0,
        mobility: 0,
        recoilControl: 0,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 1,
      cost: 1000,
      rarity: 'uncommon',
      description: 'Digital camouflage pattern'
    })

    this.availableAttachments.set('carbon_fiber', {
      id: 'carbon_fiber',
      name: 'Carbon Fiber',
      type: 'skin',
      slot: 'skin',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 0,
        stability: 0,
        mobility: 5,
        recoilControl: 0,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 12,
      cost: 5000,
      rarity: 'epic',
      description: 'Lightweight carbon fiber finish',
      effects: {
        particleEffect: 'carbon_sparkle'
      }
    })

    // Charms
    this.availableAttachments.set('skull_charm', {
      id: 'skull_charm',
      name: 'Skull Charm',
      type: 'charm',
      slot: 'charm',
      stats: {
        damage: 0,
        fireRate: 0,
        range: 0,
        accuracy: 0,
        stability: 0,
        mobility: 0,
        recoilControl: 0,
        magazineSize: 0,
        reloadSpeed: 0,
        drawSpeed: 0,
        armorPenetration: 0,
        suppressor: false,
        fireModes: ['semi', 'burst', 'auto']
      },
      unlockLevel: 20,
      cost: 10000,
      rarity: 'legendary',
      description: 'Intimidating skull charm for your weapon'
    })
  }

  // Initialize skins
  private initializeSkins(): void {
    const skins: WeaponSkin[] = [
      {
        id: 'arctic_camo',
        name: 'Arctic Camo',
        baseColor: new THREE.Color(0xE0E0E0),
        pattern: 'arctic',
        patternColor: new THREE.Color(0xFFFFFF),
        finish: 'matte',
        wear: 0,
        rarity: 'uncommon',
        unlockLevel: 3,
        cost: 2000
      },
      {
        id: 'desert_tan',
        name: 'Desert Tan',
        baseColor: new THREE.Color(0xD2B48C),
        pattern: 'desert',
        patternColor: new THREE.Color(0xC19A6B),
        finish: 'matte',
        wear: 0,
        rarity: 'common',
        unlockLevel: 1,
        cost: 800
      },
      {
        id: 'urban_gray',
        name: 'Urban Gray',
        baseColor: new THREE.Color(0x708090),
        pattern: 'urban',
        patternColor: new THREE.Color(0x696969),
        finish: 'metallic',
        wear: 0,
        rarity: 'common',
        unlockLevel: 2,
        cost: 1200
      },
      {
        id: 'neon_blue',
        name: 'Neon Blue',
        baseColor: new THREE.Color(0x1E90FF),
        pattern: 'neon',
        patternColor: new THREE.Color(0x00BFFF),
        finish: 'glossy',
        wear: 0,
        rarity: 'epic',
        unlockLevel: 15,
        cost: 8000,
        animated: true,
        specialEffects: ['neon_glow', 'pulse']
      },
      {
        id: 'dragon_red',
        name: 'Dragon Red',
        baseColor: new THREE.Color(0x8B0000),
        pattern: 'dragon',
        patternColor: new THREE.Color(0xFF4500),
        finish: 'metallic',
        wear: 0,
        rarity: 'legendary',
        unlockLevel: 25,
        cost: 15000,
        animated: true,
        specialEffects: ['dragon_particles', 'fire_ember']
      },
      {
        id: 'carbon_black',
        name: 'Carbon Black',
        baseColor: new THREE.Color(0x1C1C1C),
        pattern: 'solid',
        patternColor: new THREE.Color(0x1C1C1C),
        finish: 'carbon',
        wear: 0,
        rarity: 'epic',
        unlockLevel: 10,
        cost: 6000
      },
      {
        id: 'gold_plated',
        name: 'Gold Plated',
        baseColor: new THREE.Color(0xFFD700),
        pattern: 'solid',
        patternColor: new THREE.Color(0xFFA500),
        finish: 'pearlescent',
        wear: 0,
        rarity: 'legendary',
        unlockLevel: 30,
        cost: 25000,
        animated: true,
        specialEffects: ['gold_shimmer', 'luxury_glow']
      }
    ]

    skins.forEach(skin => {
      this.availableSkins.set(skin.id, skin)
    })
  }

  // Initialize recoil patterns
  private initializeRecoilPatterns(): void {
    const patterns: RecoilPattern[] = [
      {
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.02, -0.15),
          new THREE.Vector2(-0.01, -0.25),
          new THREE.Vector2(0.01, -0.35),
          new THREE.Vector2(0, -0.40)
        ],
        recoveryTime: 0.3,
        kickback: new THREE.Vector3(0, 0.4, 0.1),
        spread: 0.02,
        patternName: 'balanced'
      },
      {
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.05, -0.20),
          new THREE.Vector2(-0.03, -0.35),
          new THREE.Vector2(0.02, -0.45),
          new THREE.Vector2(0, -0.50)
        ],
        recoveryTime: 0.4,
        kickback: new THREE.Vector3(0, 0.5, 0.15),
        spread: 0.03,
        patternName: 'aggressive'
      },
      {
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.01, -0.10),
          new THREE.Vector2(-0.005, -0.18),
          new THREE.Vector2(0.005, -0.25),
          new THREE.Vector2(0, -0.28)
        ],
        recoveryTime: 0.2,
        kickback: new THREE.Vector3(0, 0.28, 0.08),
        spread: 0.015,
        patternName: 'controlled'
      },
      {
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.03, -0.12),
          new THREE.Vector2(-0.02, -0.22),
          new THREE.Vector2(0.04, -0.32),
          new THREE.Vector2(-0.01, -0.38),
          new THREE.Vector2(0.02, -0.42)
        ],
        recoveryTime: 0.35,
        kickback: new THREE.Vector3(0, 0.42, 0.12),
        spread: 0.025,
        patternName: 'unpredictable'
      }
    ]

    patterns.forEach(pattern => {
      this.recoilPatterns.set(pattern.patternName, pattern)
    })
  }

  // Create attachment models
  private createAttachmentModels(): void {
    // Create simple geometric representations for attachments
    // In a real implementation, these would be detailed 3D models

    // Reflex sight
    const reflexSightGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.1)
    const reflexSightMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const reflexSight = new THREE.Mesh(reflexSightGeometry, reflexSightMaterial)
    this.attachmentModels.set('reflex_sight', reflexSight)

    // Scope
    const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.15, 8)
    const scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 })
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial)
    scope.rotation.z = Math.PI / 2
    this.attachmentModels.set('4x_scope', scope)

    // Silencer
    const silencerGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 8)
    const silencerMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    const silencer = new THREE.Mesh(silencerGeometry, silencerMaterial)
    silencer.rotation.z = Math.PI / 2
    this.attachmentModels.set('silencer', silencer)

    // Grip
    const gripGeometry = new THREE.BoxGeometry(0.05, 0.08, 0.1)
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    const grip = new THREE.Mesh(gripGeometry, gripMaterial)
    this.attachmentModels.set('vertical_grip', grip)

    // Laser
    const laserGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.08)
    const laserMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })
    const laser = new THREE.Mesh(laserGeometry, laserMaterial)
    this.attachmentModels.set('tactical_laser', laser)
  }

  // Create base weapon
  createBaseWeapon(weaponId: string, weaponName: string, baseStats: WeaponStats): void {
    const baseRecoilPattern = this.recoilPatterns.get('balanced')!

    const weapon: CustomizedWeapon = {
      baseWeapon: weaponId,
      name: weaponName,
      attachments: new Map(),
      stats: { ...baseStats },
      recoilPattern: baseRecoilPattern,
      visualModel: new THREE.Group(),
      skin: null,
      charms: [],
      killCounter: 0,
      headshotCounter: 0,
      experience: 0,
      level: 1
    }

    this.weapons.set(weaponId, weapon)
  }

  // Customize weapon with attachments
  customizeWeapon(weaponId: string, attachmentId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const attachment = this.availableAttachments.get(attachmentId)

    if (!weapon || !attachment) return false

    // Check if attachment is compatible
    if (attachment.restrictions && !attachment.restrictions.includes(weapon.baseWeapon)) {
      return false
    }

    // Remove existing attachment in the same slot
    const existingAttachment = Array.from(weapon.attachments.values())
      .find(att => att.slot === attachment.slot)

    if (existingAttachment) {
      weapon.attachments.delete(existingAttachment.id)
      // Remove visual model
      const existingModel = this.attachmentModels.get(existingAttachment.id)
      if (existingModel && weapon.visualModel.children.includes(existingModel)) {
        weapon.visualModel.remove(existingModel)
      }
    }

    // Add new attachment
    weapon.attachments.set(attachmentId, attachment)

    // Update weapon stats
    this.updateWeaponStats(weapon)

    // Update visual model
    this.updateWeaponVisuals(weapon)

    // Update recoil pattern
    this.updateRecoilPattern(weapon)

    return true
  }

  // Remove attachment from weapon
  removeAttachment(weaponId: string, attachmentId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const attachment = weapon?.attachments.get(attachmentId)

    if (!weapon || !attachment) return false

    weapon.attachments.delete(attachmentId)

    // Update weapon stats
    this.updateWeaponStats(weapon)

    // Update visual model
    this.updateWeaponVisuals(weapon)

    // Update recoil pattern
    this.updateRecoilPattern(weapon)

    return true
  }

  // Apply skin to weapon
  applySkin(weaponId: string, skinId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const skin = this.availableSkins.get(skinId)

    if (!weapon || !skin) return false

    weapon.skin = skin
    this.updateWeaponVisuals(weapon)

    return true
  }

  // Add charm to weapon
  addCharm(weaponId: string, charmId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const charm = this.availableAttachments.get(charmId)

    if (!weapon || !charm || charm.type !== 'charm') return false

    if (weapon.charms.length >= 3) {
      // Remove oldest charm
      const oldCharm = weapon.charms.shift()!
      weapon.attachments.delete(oldCharm.id)
    }

    weapon.charms.push(charm)
    weapon.attachments.set(charmId, charm)
    this.updateWeaponVisuals(weapon)

    return true
  }

  // Update weapon stats based on attachments
  private updateWeaponStats(weapon: CustomizedWeapon): void {
    // Reset to base stats (would be stored separately)
    const baseStats = this.getBaseStats(weapon.baseWeapon)
    let stats = { ...baseStats }

    // Apply attachment stat modifiers
    weapon.attachments.forEach(attachment => {
      stats = this.addStats(stats, attachment.stats)
    })

    weapon.stats = stats
  }

  // Get base stats for weapon
  private getBaseStats(weaponId: string): WeaponStats {
    // This would contain the original base stats for each weapon
    // For now, return default stats
    return {
      damage: 35,
      fireRate: 600,
      range: 100,
      accuracy: 70,
      stability: 60,
      mobility: 80,
      recoilControl: 50,
      magazineSize: 30,
      reloadSpeed: 2.5,
      drawSpeed: 0.8,
      armorPenetration: 20,
      suppressor: false,
      fireModes: ['semi', 'auto']
    }
  }

  // Add two stat objects together
  private addStats(base: WeaponStats, modifier: WeaponStats): WeaponStats {
    return {
      damage: base.damage + modifier.damage,
      fireRate: base.fireRate + modifier.fireRate,
      range: base.range + modifier.range,
      accuracy: base.accuracy + modifier.accuracy,
      stability: base.stability + modifier.stability,
      mobility: base.mobility + modifier.mobility,
      recoilControl: base.recoilControl + modifier.recoilControl,
      magazineSize: base.magazineSize + modifier.magazineSize,
      reloadSpeed: base.reloadSpeed + modifier.reloadSpeed,
      drawSpeed: base.drawSpeed + modifier.drawSpeed,
      armorPenetration: base.armorPenetration + modifier.armorPenetration,
      suppressor: base.suppressor || modifier.suppressor,
      fireModes: modifier.fireModes.length > 0 ? modifier.fireModes : base.fireModes
    }
  }

  // Update weapon visuals
  private updateWeaponVisuals(weapon: CustomizedWeapon): void {
    // Clear existing visuals
    while (weapon.visualModel.children.length > 0) {
      weapon.visualModel.remove(weapon.visualModel.children[0])
    }

    // Apply skin if present
    if (weapon.skin) {
      this.applySkinToModel(weapon.visualModel, weapon.skin)
    }

    // Add attachment models
    weapon.attachments.forEach(attachment => {
      const model = this.attachmentModels.get(attachment.id)
      if (model) {
        const clonedModel = model.clone()
        this.positionAttachmentModel(clonedModel, attachment.slot)
        weapon.visualModel.add(clonedModel)
      }
    })

    // Add charm models
    weapon.charms.forEach(charm => {
      const model = this.attachmentModels.get(charm.id)
      if (model) {
        const clonedModel = model.clone()
        clonedModel.position.set(0.1, 0, 0.2) // Charm position
        weapon.visualModel.add(clonedModel)
      }
    })
  }

  // Apply skin to 3D model
  private applySkinToModel(model: THREE.Group, skin: WeaponSkin): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial

        // Apply base color
        material.color = skin.baseColor

        // Apply finish properties
        switch (skin.finish) {
          case 'metallic':
            material.metalness = 0.8
            material.roughness = 0.2
            break
          case 'glossy':
            material.roughness = 0.1
            break
          case 'matte':
            material.roughness = 0.9
            break
          case 'carbon':
            material.color = new THREE.Color(0x1a1a1a)
            material.roughness = 0.7
            break
          case 'pearlescent':
            material.metalness = 0.3
            material.roughness = 0.3
            break
        }

        // Apply wear
        if (skin.wear > 0) {
          material.roughness += skin.wear * 0.5
          material.metalness *= (1 - skin.wear * 0.3)
        }
      }
    })

    // Apply pattern
    this.applyPatternToModel(model, skin)
  }

  // Apply pattern to model
  private applyPatternToModel(model: THREE.Group, skin: WeaponSkin): void {
    // Create pattern texture based on skin pattern type
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')!

    switch (skin.pattern) {
      case 'digital':
        this.createDigitalPattern(context, skin.patternColor)
        break
      case 'camo':
        this.createCamoPattern(context, skin.patternColor)
        break
      case 'urban':
        this.createUrbanPattern(context, skin.patternColor)
        break
      case 'arctic':
        this.createArcticPattern(context, skin.patternColor)
        break
      case 'desert':
        this.createDesertPattern(context, skin.patternColor)
        break
      case 'neon':
        this.createNeonPattern(context, skin.patternColor)
        break
      case 'dragon':
        this.createDragonPattern(context, skin.patternColor)
        break
      case 'tiger':
        this.createTigerPattern(context, skin.patternColor)
        break
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial

        // Create new material with pattern
        const patternMaterial = new THREE.MeshStandardMaterial({
          color: material.color,
          map: texture,
          roughness: material.roughness,
          metalness: material.metalness || 0
        })

        child.material = patternMaterial
      }
    })
  }

  // Pattern creation methods
  private createDigitalPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.fillStyle = hex

    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * 32) * 16
      const y = Math.floor(Math.random() * 32) * 16
      context.fillRect(x, y, 8, 8)
    }
  }

  private createCamoPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.fillStyle = hex

    for (let i = 0; i < 50; i++) {
      context.beginPath()
      context.arc(
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 30 + 10,
        0,
        Math.PI * 2
      )
      context.fill()
    }
  }

  private createUrbanPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.fillStyle = hex

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const width = Math.random() * 100 + 20
      const height = Math.random() * 100 + 20

      context.fillRect(x, y, width, height)
    }
  }

  private createArcticPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.fillStyle = hex

    for (let i = 0; i < 30; i++) {
      context.beginPath()
      const x = Math.random() * 512
      const y = Math.random() * 512
      const size = Math.random() * 5 + 2

      // Draw snowflake pattern
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI) / 3
        context.moveTo(x, y)
        context.lineTo(
          x + Math.cos(angle) * size,
          y + Math.sin(angle) * size
        )
      }
      context.strokeStyle = hex
      context.stroke()
    }
  }

  private createDesertPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.fillStyle = hex

    for (let i = 0; i < 60; i++) {
      context.beginPath()
      context.moveTo(Math.random() * 512, Math.random() * 512)
      context.lineTo(Math.random() * 512, Math.random() * 512)
      context.lineTo(Math.random() * 512, Math.random() * 512)
      context.closePath()
      context.fill()
    }
  }

  private createNeonPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.strokeStyle = hex
    context.lineWidth = 3

    for (let i = 0; i < 20; i++) {
      context.beginPath()
      context.moveTo(Math.random() * 512, Math.random() * 512)

      for (let j = 0; j < 5; j++) {
        context.lineTo(Math.random() * 512, Math.random() * 512)
      }

      context.stroke()
    }
  }

  private createDragonPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.fillStyle = hex

    // Create dragon scale pattern
    for (let y = 0; y < 512; y += 20) {
      for (let x = 0; x < 512; x += 20) {
        if ((x + y) % 40 === 0) {
          context.beginPath()
          context.arc(x + 10, y + 10, 8, 0, Math.PI * 2)
          context.fill()
        }
      }
    }
  }

  private createTigerPattern(context: CanvasRenderingContext2D, color: THREE.Color): void {
    const hex = '#' + color.getHexString()
    context.fillStyle = hex

    // Create tiger stripe pattern
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const width = Math.random() * 100 + 50
      const height = Math.random() * 10 + 5

      context.save()
      context.translate(x, y)
      context.rotate(Math.random() * Math.PI)
      context.fillRect(-width/2, -height/2, width, height)
      context.restore()
    }
  }

  // Position attachment model on weapon
  private positionAttachmentModel(model: THREE.Object3D, slot: string): void {
    switch (slot) {
      case 'optic':
        model.position.set(0, 0.05, -0.2)
        break
      case 'barrel':
        model.position.set(0, 0, 0.3)
        break
      case 'muzzle':
        model.position.set(0, 0, 0.4)
        break
      case 'underbarrel':
        model.position.set(0, -0.08, 0.1)
        break
      case 'magazine':
        model.position.set(0, -0.15, 0.05)
        break
      case 'stock':
        model.position.set(0, 0, -0.3)
        break
      default:
        model.position.set(0, 0, 0)
    }
  }

  // Update recoil pattern based on attachments
  private updateRecoilPattern(weapon: CustomizedWeapon): void {
    const basePattern = this.recoilPatterns.get('balanced')!
    let pattern = { ...basePattern }

    // Modify pattern based on attachments
    weapon.attachments.forEach(attachment => {
      if (attachment.stats.recoilControl > 15) {
        // Better recoil control - more predictable pattern
        pattern.kickback.multiplyScalar(0.8)
        pattern.spread *= 0.8
        pattern.recoveryTime *= 0.9
      } else if (attachment.stats.recoilControl > 5) {
        // Some recoil control
        pattern.kickback.multiplyScalar(0.9)
        pattern.spread *= 0.9
      }

      if (attachment.stats.stability > 15) {
        // High stability - less random movement
        pattern.recoveryTime *= 0.85
      }
    })

    weapon.recoilPattern = pattern
  }

  // Get recoil pattern for weapon
  getRecoilPattern(weaponId: string): RecoilPattern | null {
    const weapon = this.weapons.get(weaponId)
    return weapon ? weapon.recoilPattern : null
  }

  // Calculate recoil for shot
  calculateRecoil(weaponId: string, shotCount: number): THREE.Vector2 {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return new THREE.Vector2(0, 0)

    const pattern = weapon.recoilPattern
    const pointIndex = Math.min(shotCount, pattern.points.length - 1)
    const basePoint = pattern.points[pointIndex]

    // Add some randomness
    const randomSpread = new THREE.Vector2(
      (Math.random() - 0.5) * pattern.spread,
      (Math.random() - 0.5) * pattern.spread
    )

    return basePoint.clone().add(randomSpread)
  }

  // Get weapon stats
  getWeaponStats(weaponId: string): WeaponStats | null {
    const weapon = this.weapons.get(weaponId)
    return weapon ? weapon.stats : null
  }

  // Get weapon attachments
  getWeaponAttachments(weaponId: string): WeaponAttachment[] {
    const weapon = this.weapons.get(weaponId)
    return weapon ? Array.from(weapon.attachments.values()) : []
  }

  // Get available attachments for slot
  getAvailableAttachments(slot?: string): WeaponAttachment[] {
    let attachments = Array.from(this.availableAttachments.values())

    if (slot) {
      attachments = attachments.filter(att => att.slot === slot)
    }

    return attachments.sort((a, b) => {
      const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5 }
      return rarityOrder[a.rarity] - rarityOrder[b.rarity]
    })
  }

  // Get available skins
  getAvailableSkins(): WeaponSkin[] {
    return Array.from(this.availableSkins.values()).sort((a, b) => {
      const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5 }
      return rarityOrder[a.rarity] - rarityOrder[b.rarity]
    })
  }

  // Get weapon level and experience
  getWeaponLevel(weaponId: string): { level: number; experience: number; experienceToNext: number } | null {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return null

    const experienceToNext = weapon.level * 1000 // 1000 XP per level

    return {
      level: weapon.level,
      experience: weapon.experience,
      experienceToNext
    }
  }

  // Add weapon experience
  addWeaponExperience(weaponId: string, experience: number, isHeadshot: boolean = false): void {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return

    // Bonus experience for headshots
    const bonusExperience = isHeadshot ? experience * 0.5 : 0
    const totalExperience = experience + bonusExperience

    weapon.experience += totalExperience

    // Check for level up
    const experienceNeeded = weapon.level * 1000
    if (weapon.experience >= experienceNeeded) {
      weapon.experience -= experienceNeeded
      weapon.level++
      console.log(`${weapon.name} leveled up to ${weapon.level}!`)
    }
  }

  // Register weapon kill
  registerWeaponKill(weaponId: string, isHeadshot: boolean = false): void {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return

    weapon.killCounter++
    if (isHeadshot) {
      weapon.headshotCounter++
    }

    // Add experience for kill
    this.addWeaponExperience(weaponId, 100, isHeadshot)
  }

  // Get weapon statistics
  getWeaponStatistics(weaponId: string): {
    kills: number
    headshots: number
    headshotPercentage: number
    level: number
    experience: number
  } | null {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return null

    return {
      kills: weapon.killCounter,
      headshots: weapon.headshotCounter,
      headshotPercentage: weapon.killCounter > 0 ?
        (weapon.headshotCounter / weapon.killCounter) * 100 : 0,
      level: weapon.level,
      experience: weapon.experience
    }
  }

  // Set current weapon
  setCurrentWeapon(weaponId: string): void {
    this.currentWeapon = weaponId
  }

  // Get current weapon
  getCurrentWeapon(): CustomizedWeapon | null {
    return this.currentWeapon ? this.weapons.get(this.currentWeapon) || null : null
  }

  // Check if attachment is unlocked
  isAttachmentUnlocked(attachmentId: string, playerLevel: number): boolean {
    const attachment = this.availableAttachments.get(attachmentId)
    return attachment ? playerLevel >= attachment.unlockLevel : false
  }

  // Check if skin is unlocked
  isSkinUnlocked(skinId: string, playerLevel: number): boolean {
    const skin = this.availableSkins.get(skinId)
    return skin ? playerLevel >= skin.unlockLevel : false
  }

  // Clean up
  cleanup(): void {
    this.weapons.clear()
    this.availableAttachments.clear()
    this.availableSkins.clear()
    this.attachmentModels.clear()
    this.recoilPatterns.clear()
  }
}

export default GLXYWeaponCustomization