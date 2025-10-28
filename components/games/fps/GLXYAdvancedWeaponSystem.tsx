// @ts-nocheck
/**
 * GLXY Advanced Weapon System - Phase 2 Implementation
 * Weapon Attachments, Customization, Ballistics, and Skins
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Zap,
  Shield,
  Settings,
  Package,
  Wrench,
  Eye,
  TrendingUp,
  Award,
  Star,
  Lock,
  Unlock,
  RefreshCw,
  Crosshair,
  Gauge,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Weapon Attachment Types
export interface WeaponAttachment {
  id: string
  name: string
  type: 'scope' | 'barrel' | 'grip' | 'stock' | 'magazine' | 'muzzle' | 'laser' | 'sight'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  stats: {
    accuracy?: number
    damage?: number
    range?: number
    fireRate?: number
    recoilControl?: number
    reloadSpeed?: number
    magazineSize?: number
    mobility?: number
    aimSpeed?: number
    stability?: number
  }
  description: string
  unlockLevel?: number
  cost?: number
  isUnlocked: boolean
  equipped: boolean
  weaponCompatibility: string[]
  skin?: WeaponSkin
}

// Weapon Skin System
export interface WeaponSkin {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  texture: string
  normalMap?: string
  roughnessMap?: string
  metallicMap?: string
  emissiveMap?: string
  particleEffects?: string[]
  soundEffects?: string[]
  killEffect?: string
  inspectAnimation?: string
  unlockLevel?: number
  cost?: number
  isUnlocked: boolean
  isEquipped: boolean
}

// Advanced Weapon Configuration
export interface AdvancedWeaponConfig {
  id: string
  name: string
  category: 'assault' | 'sniper' | 'shotgun' | 'smg' | 'lmg' | 'pistol' | 'melee' | 'explosive'
  baseStats: {
    damage: number
    fireRate: number
    accuracy: number
    range: number
    reloadTime: number
    magazineSize: number
    reserveAmmo: number
    recoil: {
      horizontal: number
      vertical: number
      pattern: 'linear' | 'exponential' | 'random' | 'complex'
    }
    penetration: number
    mobility: number
    bulletVelocity: number
    bulletDrop: number
  }
  attachments: WeaponAttachment[]
  equippedAttachments: Map<string, WeaponAttachment>
  skins: WeaponSkin[]
  equippedSkin: WeaponSkin | null
  weaponLevel: number
  experience: number
  masteryLevel: number
  killCount: number
  headshotCount: number
  unlockLevel: number
  isUnlocked: boolean
  isFavorite: boolean
  customLoadouts: WeaponLoadout[]
}

// Weapon Loadout System
export interface WeaponLoadout {
  id: string
  name: string
  weaponId: string
  attachments: Map<string, string> // attachment type -> attachment id
  skin: string | null
  stats: {
    kills: number
    deaths: number
    kd: number
    headshots: number
    accuracy: number
    damageDealt: number
    timeUsed: number
  }
  isActive: boolean
  isDefault: boolean
}

// Ballistics Data
export interface BallisticsData {
  bullet: {
    mass: number // kg
    diameter: number // mm
    velocity: number // m/s
    energy: number // Joules
    ballisticCoefficient: number
  }
  trajectory: {
    points: { x: number; y: number; z: number; time: number }[]
    drop: number
    drift: number
    velocity: number[]
  }
  penetration: {
    wood: number
    steel: number
    concrete: number
    body: number
  }
  damage: {
    base: number
    falloffStart: number
    falloffEnd: number
    minDamage: number
    multiplier: {
      head: number
      chest: number
      stomach: number
      limbs: number
    }
  }
}

// Recoil Pattern System
export interface RecoilPattern {
  type: 'linear' | 'exponential' | 'random' | 'complex'
  points: { x: number; y: number; time: number }[]
  recoverySpeed: number
  influenceFactors: {
    movement: number
    stance: { standing: number; crouching: number; proning: number }
    attachments: Map<string, number>
  }
}

// Weapon Comparison System
export interface WeaponComparison {
  weapons: string[]
  categories: ('damage' | 'fireRate' | 'accuracy' | 'range' | 'mobility' | 'control')[]
  weights: Map<string, number>
  scores: Map<string, number>
  recommendation: {
    bestOverall: string
    bestFor: {
      closeRange: string
      mediumRange: string
      longRange: string
      beginners: string
      aggressive: string
      defensive: string
    }
  }
}

export class GLXYAdvancedWeaponSystem {
  private weapons: Map<string, AdvancedWeaponConfig> = new Map()
  private weaponSkins: Map<string, WeaponSkin> = new Map()
  private weaponAttachments: Map<string, WeaponAttachment> = new Map()
  private loadouts: Map<string, WeaponLoadout> = new Map()
  private ballisticsData: Map<string, BallisticsData> = new Map()
  private recoilPatterns: Map<string, RecoilPattern> = new Map()

  private currentWeaponId: string | null = null
  private isCustomizationMode = false
  private activeLoadoutId: string | null = null

  constructor() {
    this.initializeWeapons()
    this.initializeAttachments()
    this.initializeSkins()
    this.initializeBallisticsData()
    this.initializeRecoilPatterns()
  }

  private initializeWeapons(): void {
    const weapons: AdvancedWeaponConfig[] = [
      {
        id: 'ak74_enhanced',
        name: 'AK-74 Enhanced',
        category: 'assault',
        baseStats: {
          damage: 32,
          fireRate: 650,
          accuracy: 75,
          range: 80,
          reloadTime: 2.5,
          magazineSize: 30,
          reserveAmmo: 150,
          recoil: {
            horizontal: 0.8,
            vertical: 1.2,
            pattern: 'complex'
          },
          penetration: 0.3,
          mobility: 85,
          bulletVelocity: 900,
          bulletDrop: 9.8
        },
        attachments: [],
        equippedAttachments: new Map(),
        skins: [],
        equippedSkin: null,
        weaponLevel: 1,
        experience: 0,
        masteryLevel: 1,
        killCount: 0,
        headshotCount: 0,
        unlockLevel: 1,
        isUnlocked: true,
        isFavorite: false,
        customLoadouts: []
      },
      {
        id: 'm4a1_tactical',
        name: 'M4A1 Tactical',
        category: 'assault',
        baseStats: {
          damage: 28,
          fireRate: 750,
          accuracy: 85,
          range: 75,
          reloadTime: 2.2,
          magazineSize: 30,
          reserveAmmo: 150,
          recoil: {
            horizontal: 0.6,
            vertical: 0.9,
            pattern: 'linear'
          },
          penetration: 0.25,
          mobility: 90,
          bulletVelocity: 880,
          bulletDrop: 9.8
        },
        attachments: [],
        equippedAttachments: new Map(),
        skins: [],
        equippedSkin: null,
        weaponLevel: 1,
        experience: 0,
        masteryLevel: 1,
        killCount: 0,
        headshotCount: 0,
        unlockLevel: 5,
        isUnlocked: false,
        isFavorite: false,
        customLoadouts: []
      },
      {
        id: 'awp_intervention',
        name: 'AWP Intervention',
        category: 'sniper',
        baseStats: {
          damage: 120,
          fireRate: 41,
          accuracy: 95,
          range: 100,
          reloadTime: 3.8,
          magazineSize: 5,
          reserveAmmo: 25,
          recoil: {
            horizontal: 0.2,
            vertical: 3.5,
            pattern: 'linear'
          },
          penetration: 0.85,
          mobility: 60,
          bulletVelocity: 1200,
          bulletDrop: 9.8
        },
        attachments: [],
        equippedAttachments: new Map(),
        skins: [],
        equippedSkin: null,
        weaponLevel: 1,
        experience: 0,
        masteryLevel: 1,
        killCount: 0,
        headshotCount: 0,
        unlockLevel: 15,
        isUnlocked: false,
        isFavorite: false,
        customLoadouts: []
      },
      {
        id: 'spas_12',
        name: 'SPAS-12',
        category: 'shotgun',
        baseStats: {
          damage: 95,
          fireRate: 120,
          accuracy: 60,
          range: 25,
          reloadTime: 4.0,
          magazineSize: 8,
          reserveAmmo: 40,
          recoil: {
            horizontal: 1.5,
            vertical: 2.0,
            pattern: 'random'
          },
          penetration: 0.1,
          mobility: 75,
          bulletVelocity: 400,
          bulletDrop: 9.8
        },
        attachments: [],
        equippedAttachments: new Map(),
        skins: [],
        equippedSkin: null,
        weaponLevel: 1,
        experience: 0,
        masteryLevel: 1,
        killCount: 0,
        headshotCount: 0,
        unlockLevel: 8,
        isUnlocked: false,
        isFavorite: false,
        customLoadouts: []
      }
    ]

    weapons.forEach(weapon => {
      this.weapons.set(weapon.id, weapon)
    })
  }

  private initializeAttachments(): void {
    const attachments: WeaponAttachment[] = [
      // Scopes
      {
        id: 'red_dot_sight',
        name: 'Red Dot Sight',
        type: 'sight',
        rarity: 'common',
        stats: {
          accuracy: 5,
          aimSpeed: 10
        },
        description: 'Basic red dot sight for improved target acquisition',
        unlockLevel: 2,
        cost: 500,
        isUnlocked: true,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical', 'spas_12']
      },
      {
        id: 'acog_4x',
        name: 'ACOG 4x Scope',
        type: 'scope',
        rarity: 'rare',
        stats: {
          accuracy: 15,
          range: 20,
          aimSpeed: -5,
          mobility: -10
        },
        description: '4x magnified scope for medium to long range engagements',
        unlockLevel: 10,
        cost: 2000,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical']
      },
      {
        id: 'sniper_12x',
        name: 'Sniper 12x Scope',
        type: 'scope',
        rarity: 'epic',
        stats: {
          accuracy: 25,
          range: 40,
          aimSpeed: -15,
          mobility: -20
        },
        description: 'High power scope for extreme long range shooting',
        unlockLevel: 20,
        cost: 5000,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['awp_intervention']
      },
      // Barrels
      {
        id: 'compensator',
        name: 'Muzzle Compensator',
        type: 'muzzle',
        rarity: 'uncommon',
        stats: {
          recoilControl: 15,
          accuracy: 5,
          range: 5
        },
        description: 'Reduces vertical recoil and muzzle climb',
        unlockLevel: 3,
        cost: 800,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical']
      },
      {
        id: 'silencer',
        name: 'Suppressor',
        type: 'muzzle',
        rarity: 'rare',
        stats: {
          damage: -5,
          range: 10,
          accuracy: 5,
          mobility: 5
        },
        description: 'Reduces muzzle flash and sound',
        unlockLevel: 7,
        cost: 1500,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical', 'spas_12']
      },
      // Grips
      {
        id: 'vertical_grip',
        name: 'Vertical Grip',
        type: 'grip',
        rarity: 'common',
        stats: {
          recoilControl: 10,
          stability: 5
        },
        description: 'Improves recoil control and weapon stability',
        unlockLevel: 1,
        cost: 300,
        isUnlocked: true,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical']
      },
      {
        id: 'angled_grip',
        name: 'Angled Grip',
        type: 'grip',
        rarity: 'uncommon',
        stats: {
          recoilControl: 5,
          aimSpeed: 10,
          stability: 5
        },
        description: 'Faster aiming speed with moderate recoil control',
        unlockLevel: 5,
        cost: 1000,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical']
      },
      // Magazines
      {
        id: 'extended_mag',
        name: 'Extended Magazine',
        type: 'magazine',
        rarity: 'uncommon',
        stats: {
          magazineSize: 50,
          reloadSpeed: -10,
          mobility: -5
        },
        description: 'Increases magazine capacity by 50%',
        unlockLevel: 4,
        cost: 1200,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical', 'spas_12']
      },
      {
        id: 'fast_mag',
        name: 'Fast Magazine',
        type: 'magazine',
        rarity: 'rare',
        stats: {
          reloadSpeed: 25,
          mobility: 5
        },
        description: 'Faster reload speed',
        unlockLevel: 8,
        cost: 1800,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical', 'spas_12']
      },
      // Stocks
      {
        id: 'tactical_stock',
        name: 'Tactical Stock',
        type: 'stock',
        rarity: 'common',
        stats: {
          recoilControl: 8,
          stability: 8,
          mobility: -3
        },
        description: 'Improved recoil control and stability',
        unlockLevel: 2,
        cost: 600,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical']
      },
      {
        id: 'lightweight_stock',
        name: 'Lightweight Stock',
        type: 'stock',
        rarity: 'uncommon',
        stats: {
          mobility: 15,
          aimSpeed: 10,
          stability: -5
        },
        description: 'Improved mobility and aiming speed',
        unlockLevel: 6,
        cost: 1100,
        isUnlocked: false,
        equipped: false,
        weaponCompatibility: ['ak74_enhanced', 'm4a1_tactical']
      }
    ]

    attachments.forEach(attachment => {
      this.weaponAttachments.set(attachment.id, attachment)
    })
  }

  private initializeSkins(): void {
    const skins: WeaponSkin[] = [
      {
        id: 'carbon_fiber',
        name: 'Carbon Fiber',
        rarity: 'uncommon',
        texture: '/textures/weapons/carbon_fiber.jpg',
        normalMap: '/textures/weapons/carbon_fiber_normal.jpg',
        roughnessMap: '/textures/weapons/carbon_fiber_roughness.jpg',
        unlockLevel: 3,
        cost: 800,
        isUnlocked: false,
        isEquipped: false
      },
      {
        id: 'digital_camo',
        name: 'Digital Camo',
        rarity: 'rare',
        texture: '/textures/weapons/digital_camo.jpg',
        normalMap: '/textures/weapons/digital_camo_normal.jpg',
        unlockLevel: 7,
        cost: 1500,
        isUnlocked: false,
        isEquipped: false
      },
      {
        id: 'dragon_breath',
        name: 'Dragon Breath',
        rarity: 'epic',
        texture: '/textures/weapons/dragon_breath.jpg',
        normalMap: '/textures/weapons/dragon_breath_normal.jpg',
        emissiveMap: '/textures/weapons/dragon_breath_emissive.jpg',
        particleEffects: ['fire_particles', 'smoke_trail'],
        killEffect: 'dragon_fire',
        inspectAnimation: 'dragon_inspect',
        unlockLevel: 12,
        cost: 3000,
        isUnlocked: false,
        isEquipped: false
      },
      {
        id: 'golden_eagle',
        name: 'Golden Eagle',
        rarity: 'legendary',
        texture: '/textures/weapons/golden_eagle.jpg',
        normalMap: '/textures/weapons/golden_eagle_normal.jpg',
        metallicMap: '/textures/weapons/golden_eagle_metallic.jpg',
        roughnessMap: '/textures/weapons/golden_eagle_roughness.jpg',
        particleEffects: ['golden_sparkles'],
        soundEffects: ['golden_shoot', 'golden_reload'],
        killEffect: 'golden_explosion',
        inspectAnimation: 'golden_inspect',
        unlockLevel: 20,
        cost: 8000,
        isUnlocked: false,
        isEquipped: false
      },
      {
        id: 'void_touched',
        name: 'Void Touched',
        rarity: 'mythic',
        texture: '/textures/weapons/void_touched.jpg',
        normalMap: '/textures/weapons/void_touched_normal.jpg',
        emissiveMap: '/textures/weapons/void_touched_emissive.jpg',
        particleEffects: ['void_particles', 'purple_energy'],
        soundEffects: ['void_shoot', 'void_reload'],
        killEffect: 'void_implosion',
        inspectAnimation: 'void_inspect',
        unlockLevel: 30,
        cost: 15000,
        isUnlocked: false,
        isEquipped: false
      }
    ]

    skins.forEach(skin => {
      this.weaponSkins.set(skin.id, skin)
    })
  }

  private initializeBallisticsData(): void {
    // Ballistics data for each weapon type
    const ballistics: [string, BallisticsData][] = [
      ['ak74_enhanced', {
        bullet: {
          mass: 0.008, // 8 grams
          diameter: 5.56, // 5.56mm
          velocity: 900, // m/s
          energy: 3240, // Joules
          ballisticCoefficient: 0.285
        },
        trajectory: {
          points: [],
          drop: 0,
          drift: 0,
          velocity: []
        },
        penetration: {
          wood: 150,
          steel: 8,
          concrete: 5,
          body: 30
        },
        damage: {
          base: 32,
          falloffStart: 40,
          falloffEnd: 80,
          minDamage: 18,
          multiplier: {
            head: 2.5,
            chest: 1.2,
            stomach: 1.1,
            limbs: 0.8
          }
        }
      }],
      ['m4a1_tactical', {
        bullet: {
          mass: 0.004, // 4 grams
          diameter: 5.56, // 5.56mm
          velocity: 880, // m/s
          energy: 1548, // Joules
          ballisticCoefficient: 0.274
        },
        trajectory: {
          points: [],
          drop: 0,
          drift: 0,
          velocity: []
        },
        penetration: {
          wood: 120,
          steel: 6,
          concrete: 4,
          body: 25
        },
        damage: {
          base: 28,
          falloffStart: 35,
          falloffEnd: 75,
          minDamage: 16,
          multiplier: {
            head: 2.5,
            chest: 1.2,
            stomach: 1.1,
            limbs: 0.8
          }
        }
      }],
      ['awp_intervention', {
        bullet: {
          mass: 0.010, // 10 grams
          diameter: 7.62, // 7.62mm
          velocity: 1200, // m/s
          energy: 7200, // Joules
          ballisticCoefficient: 0.495
        },
        trajectory: {
          points: [],
          drop: 0,
          drift: 0,
          velocity: []
        },
        penetration: {
          wood: 300,
          steel: 25,
          concrete: 15,
          body: 80
        },
        damage: {
          base: 120,
          falloffStart: 75,
          falloffEnd: 100,
          minDamage: 80,
          multiplier: {
            head: 4.0,
            chest: 2.0,
            stomach: 1.5,
            limbs: 1.0
          }
        }
      }]
    ]

    ballistics.forEach(([weaponId, data]) => {
      this.ballisticsData.set(weaponId, data)
    })
  }

  private initializeRecoilPatterns(): void {
    // Generate realistic recoil patterns for each weapon
    const recoilPatterns: [string, RecoilPattern][] = [
      ['ak74_enhanced', {
        type: 'complex',
        points: this.generateRecoilPattern('ak74'),
        recoverySpeed: 0.7,
        influenceFactors: {
          movement: 0.3,
          stance: { standing: 1.0, crouching: 0.7, proning: 0.4 },
          attachments: new Map([
            ['compensator', 0.2],
            ['vertical_grip', 0.15],
            ['tactical_stock', 0.1]
          ])
        }
      }],
      ['m4a1_tactical', {
        type: 'linear',
        points: this.generateRecoilPattern('m4a1'),
        recoverySpeed: 0.8,
        influenceFactors: {
          movement: 0.2,
          stance: { standing: 1.0, crouching: 0.6, proning: 0.3 },
          attachments: new Map([
            ['compensator', 0.15],
            ['vertical_grip', 0.1],
            ['tactical_stock', 0.1]
          ])
        }
      }],
      ['awp_intervention', {
        type: 'linear',
        points: this.generateRecoilPattern('awp'),
        recoverySpeed: 0.5,
        influenceFactors: {
          movement: 0.4,
          stance: { standing: 1.2, crouching: 1.0, proning: 0.8 },
          attachments: new Map([
            ['sniper_12x', 0.1],
            ['tactical_stock', 0.05]
          ])
        }
      }]
    ]

    recoilPatterns.forEach(([weaponId, pattern]) => {
      this.recoilPatterns.set(weaponId, pattern)
    })
  }

  private generateRecoilPattern(weaponType: string): { x: number; y: number; time: number }[] {
    const points: { x: number; y: number; time: number }[] = []

    switch (weaponType) {
      case 'ak74':
        // AK-74 has a distinctive 7-shaped pattern
        for (let i = 0; i < 30; i++) {
          const time = i * 0.1
          const y = Math.min(2.5 + i * 0.3, 8)
          const x = (Math.sin(i * 0.3) + Math.random() * 0.2) * 0.8
          points.push({ x, y, time })
        }
        break

      case 'm4a1':
        // M4A1 has a more vertical pattern
        for (let i = 0; i < 30; i++) {
          const time = i * 0.08
          const y = Math.min(1.8 + i * 0.25, 6)
          const x = (Math.sin(i * 0.2) + Math.random() * 0.15) * 0.5
          points.push({ x, y, time })
        }
        break

      case 'awp':
        // AWP has a strong vertical kick
        for (let i = 0; i < 5; i++) {
          const time = i * 0.5
          const y = 4 + i * 1.5
          const x = (Math.random() - 0.5) * 0.3
          points.push({ x, y, time })
        }
        break

      default:
        // Default linear pattern
        for (let i = 0; i < 20; i++) {
          const time = i * 0.1
          const y = i * 0.2
          const x = (Math.random() - 0.5) * 0.2
          points.push({ x, y, time })
        }
    }

    return points
  }

  // Public API Methods
  public getWeapon(weaponId: string): AdvancedWeaponConfig | null {
    return this.weapons.get(weaponId) || null
  }

  public getAllWeapons(): AdvancedWeaponConfig[] {
    return Array.from(this.weapons.values())
  }

  public getUnlockedWeapons(): AdvancedWeaponConfig[] {
    return Array.from(this.weapons.values()).filter(w => w.isUnlocked)
  }

  public getWeaponCategory(category: string): AdvancedWeaponConfig[] {
    return Array.from(this.weapons.values()).filter(w => w.category === category)
  }

  public unlockWeapon(weaponId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    if (!weapon || weapon.isUnlocked) return false

    weapon.isUnlocked = true
    return true
  }

  public selectWeapon(weaponId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    if (!weapon || !weapon.isUnlocked) return false

    this.currentWeaponId = weaponId
    return true
  }

  public getCurrentWeapon(): AdvancedWeaponConfig | null {
    return this.currentWeaponId ? this.weapons.get(this.currentWeaponId) || null : null
  }

  // Attachment Management
  public getAvailableAttachments(weaponId: string): WeaponAttachment[] {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return []

    return Array.from(this.weaponAttachments.values()).filter(
      attachment => attachment.weaponCompatibility.includes(weaponId)
    )
  }

  public equipAttachment(weaponId: string, attachmentId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const attachment = this.weaponAttachments.get(attachmentId)

    if (!weapon || !attachment || !attachment.isUnlocked) return false
    if (!attachment.weaponCompatibility.includes(weaponId)) return false

    // Remove existing attachment of same type
    const existingAttachment = weapon.equippedAttachments.get(attachment.type)
    if (existingAttachment) {
      existingAttachment.equipped = false
    }

    // Equip new attachment
    attachment.equipped = true
    weapon.equippedAttachments.set(attachment.type, attachment)

    // Update weapon stats based on attachment
    this.updateWeaponStats(weapon)

    return true
  }

  public unequipAttachment(weaponId: string, attachmentType: string): boolean {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return false

    const attachment = weapon.equippedAttachments.get(attachmentType)
    if (!attachment) return false

    attachment.equipped = false
    weapon.equippedAttachments.delete(attachmentType)

    // Update weapon stats
    this.updateWeaponStats(weapon)

    return true
  }

  private updateWeaponStats(weapon: AdvancedWeaponConfig): void {
    // Reset to base stats
    const baseStats = { ...weapon.baseStats }

    // Apply attachment bonuses
    if (weapon.equippedAttachments) {
      weapon.equippedAttachments.forEach((attachment, attachmentType) => {
      if (attachment.stats.accuracy) {
        baseStats.accuracy += attachment.stats.accuracy
      }
      if (attachment.stats.damage) {
        baseStats.damage += attachment.stats.damage
      }
      if (attachment.stats.range) {
        baseStats.range += attachment.stats.range
      }
      if (attachment.stats.fireRate) {
        baseStats.fireRate += attachment.stats.fireRate
      }
      if (attachment.stats.reloadSpeed) {
        baseStats.reloadTime *= (1 - attachment.stats.reloadSpeed / 100)
      }
      if (attachment.stats.magazineSize) {
        baseStats.magazineSize = Math.floor(baseStats.magazineSize * (1 + attachment.stats.magazineSize / 100))
      }
      if (attachment.stats.mobility) {
        baseStats.mobility += attachment.stats.mobility
      }
      if (attachment.stats.recoilControl) {
        baseStats.recoil.horizontal *= (1 - attachment.stats.recoilControl / 100)
        baseStats.recoil.vertical *= (1 - attachment.stats.recoilControl / 100)
      }
    })
    }

    // Store calculated stats (you might want to add this as a property to the weapon)
    (weapon as any).calculatedStats = baseStats
  }

  // Skin Management
  public getAvailableSkins(weaponId: string): WeaponSkin[] {
    // In a real implementation, you'd filter skins by weapon compatibility
    return Array.from(this.weaponSkins.values())
  }

  public equipSkin(weaponId: string, skinId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const skin = this.weaponSkins.get(skinId)

    if (!weapon || !skin || !skin.isUnlocked) return false

    // Remove current skin
    if (weapon.equippedSkin) {
      weapon.equippedSkin.isEquipped = false
    }

    // Equip new skin
    skin.isEquipped = true
    weapon.equippedSkin = skin

    return true
  }

  // Weapon Mastery and Progression
  public addWeaponExperience(weaponId: string, experience: number): void {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return

    weapon.experience += experience

    // Check for level up
    const requiredExp = this.getExperienceForLevel(weapon.weaponLevel + 1)
    if (weapon.experience >= requiredExp) {
      weapon.weaponLevel++
      weapon.experience -= requiredExp

      // Unlock rewards
      this.checkWeaponLevelRewards(weapon)
    }
  }

  public getExperienceForLevel(level: number): number {
    return Math.floor(1000 * Math.pow(1.5, level - 1))
  }

  private checkWeaponLevelRewards(weapon: AdvancedWeaponConfig): void {
    // Unlock attachments at certain levels
    this.weaponAttachments.forEach(attachment => {
      if (attachment.unlockLevel === weapon.weaponLevel && !attachment.isUnlocked) {
        attachment.isUnlocked = true
      }
    })

    // Unlock skins at certain levels
    this.weaponSkins.forEach(skin => {
      if (skin.unlockLevel === weapon.weaponLevel && !skin.isUnlocked) {
        skin.isUnlocked = true
      }
    })
  }

  public addWeaponKill(weaponId: string, isHeadshot: boolean): void {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return

    weapon.killCount++
    if (isHeadshot) {
      weapon.headshotCount++
    }

    // Add experience
    const expGained = isHeadshot ? 50 : 25
    this.addWeaponExperience(weaponId, expGained)

    // Check for mastery level up
    this.checkMasteryProgression(weapon)
  }

  private checkMasteryProgression(weapon: AdvancedWeaponConfig): void {
    const masteryThresholds = [100, 500, 1000, 2500, 5000, 10000]

    for (let i = masteryThresholds.length - 1; i >= 0; i--) {
      if (weapon.killCount >= masteryThresholds[i]) {
        const newLevel = i + 1
        if (newLevel > weapon.masteryLevel) {
          weapon.masteryLevel = newLevel
          // Grant mastery rewards
          this.grantMasteryRewards(weapon, newLevel)
        }
        break
      }
    }
  }

  private grantMasteryRewards(weapon: AdvancedWeaponConfig, masteryLevel: number): void {
    // Grant exclusive skins, attachments, or other rewards
    console.log(`Weapon ${weapon.name} reached mastery level ${masteryLevel}!`)
  }

  // Loadout Management
  public createLoadout(name: string, weaponId: string): WeaponLoadout {
    const loadout: WeaponLoadout = {
      id: `loadout_${Date.now()}`,
      name,
      weaponId,
      attachments: new Map(),
      skin: null,
      stats: {
        kills: 0,
        deaths: 0,
        kd: 0,
        headshots: 0,
        accuracy: 0,
        damageDealt: 0,
        timeUsed: 0
      },
      isActive: false,
      isDefault: false
    }

    this.loadouts.set(loadout.id, loadout)
    return loadout
  }

  public getLoadout(loadoutId: string): WeaponLoadout | null {
    return this.loadouts.get(loadoutId) || null
  }

  public getAllLoadouts(): WeaponLoadout[] {
    return Array.from(this.loadouts.values())
  }

  public setActiveLoadout(loadoutId: string): boolean {
    const loadout = this.loadouts.get(loadoutId)
    if (!loadout) return false

    // Deactivate all other loadouts
    this.loadouts.forEach(l => l.isActive = false)

    // Activate selected loadout
    loadout.isActive = true
    this.activeLoadoutId = loadoutId

    // Apply loadout to current weapon
    this.applyLoadoutToWeapon(loadout)

    return true
  }

  private applyLoadoutToWeapon(loadout: WeaponLoadout): void {
    const weapon = this.weapons.get(loadout.weaponId)
    if (!weapon) return

    // Clear current attachments
    weapon.equippedAttachments.clear()

    // Apply loadout attachments
    loadout.attachments.forEach((attachmentId, type) => {
      this.equipAttachment(loadout.weaponId, attachmentId)
    })

    // Apply loadout skin
    if (loadout.skin) {
      this.equipSkin(loadout.weaponId, loadout.skin)
    }
  }

  // Weapon Comparison System
  public compareWeapons(weaponIds: string[]): WeaponComparison {
    const categories: ('damage' | 'fireRate' | 'accuracy' | 'range' | 'mobility' | 'control')[] = [
      'damage', 'fireRate', 'accuracy', 'range', 'mobility', 'control'
    ]

    const weights = new Map([
      ['damage', 0.2],
      ['fireRate', 0.15],
      ['accuracy', 0.2],
      ['range', 0.15],
      ['mobility', 0.15],
      ['control', 0.15]
    ])

    const scores = new Map<string, number>()

    weaponIds.forEach(weaponId => {
      const weapon = this.weapons.get(weaponId)
      if (!weapon) return

      let score = 0
      categories.forEach(category => {
        const categoryScore = this.getWeaponCategoryScore(weapon, category)
        score += categoryScore * (weights.get(category) || 0)
      })

      scores.set(weaponId, score)
    })

    // Find best weapons for different scenarios
    const bestOverall = weaponIds.reduce((best, current) =>
      (scores.get(current) || 0) > (scores.get(best) || 0) ? current : best
    )

    const recommendation = {
      bestOverall,
      bestFor: {
        closeRange: this.getBestWeaponForScenario(weaponIds, 'closeRange'),
        mediumRange: this.getBestWeaponForScenario(weaponIds, 'mediumRange'),
        longRange: this.getBestWeaponForScenario(weaponIds, 'longRange'),
        beginners: this.getBestWeaponForScenario(weaponIds, 'beginners'),
        aggressive: this.getBestWeaponForScenario(weaponIds, 'aggressive'),
        defensive: this.getBestWeaponForScenario(weaponIds, 'defensive')
      }
    }

    return {
      weapons: weaponIds,
      categories,
      weights,
      scores,
      recommendation
    }
  }

  private getWeaponCategoryScore(weapon: AdvancedWeaponConfig, category: string): number {
    const stats = (weapon as any).calculatedStats || weapon.baseStats

    switch (category) {
      case 'damage':
        return stats.damage / 120 // Normalize to max damage
      case 'fireRate':
        return stats.fireRate / 1000 // Normalize to max fire rate
      case 'accuracy':
        return stats.accuracy / 100
      case 'range':
        return stats.range / 100
      case 'mobility':
        return stats.mobility / 100
      case 'control':
        // Control is inverse of recoil
        const recoilScore = 1 - ((stats.recoil.horizontal + stats.recoil.vertical) / 10)
        return Math.max(0, recoilScore)
      default:
        return 0
    }
  }

  private getBestWeaponForScenario(weaponIds: string[], scenario: string): string {
    const scenarioWeights = {
      closeRange: { damage: 0.3, fireRate: 0.3, mobility: 0.2, accuracy: 0.1, range: 0.05, control: 0.05 },
      mediumRange: { damage: 0.2, fireRate: 0.2, mobility: 0.15, accuracy: 0.25, range: 0.15, control: 0.05 },
      longRange: { damage: 0.25, fireRate: 0.1, mobility: 0.1, accuracy: 0.3, range: 0.2, control: 0.05 },
      beginners: { damage: 0.15, fireRate: 0.15, mobility: 0.2, accuracy: 0.25, range: 0.15, control: 0.1 },
      aggressive: { damage: 0.25, fireRate: 0.3, mobility: 0.25, accuracy: 0.1, range: 0.05, control: 0.05 },
      defensive: { damage: 0.2, fireRate: 0.15, mobility: 0.15, accuracy: 0.25, range: 0.2, control: 0.05 }
    }

    const weights = scenarioWeights[scenario as keyof typeof scenarioWeights]
    let bestWeapon = weaponIds[0]
    let bestScore = 0

    weaponIds.forEach(weaponId => {
      const weapon = this.weapons.get(weaponId)
      if (!weapon) return

      let score = 0
      Object.entries(weights).forEach(([category, weight]) => {
        const categoryScore = this.getWeaponCategoryScore(weapon, category)
        score += categoryScore * weight
      })

      if (score > bestScore) {
        bestScore = score
        bestWeapon = weaponId
      }
    })

    return bestWeapon
  }

  // Ballistics Calculations
  public calculateBallistics(weaponId: string, distance: number): BallisticsData | null {
    const weapon = this.weapons.get(weaponId)
    const baseBallistics = this.ballisticsData.get(weaponId)

    if (!weapon || !baseBallistics) return null

    // Calculate trajectory points
    const points: { x: number; y: number; z: number; time: number }[] = []
    const bullet = baseBallistics.bullet
    const gravity = 9.81
    const timeStep = 0.01

    let x = 0, y = 0, z = 0, time = 0
    let vx = bullet.velocity, vy = 0, vz = 0

    while (z < distance && y > -10) {
      points.push({ x, y, z, time })

      // Update velocity (gravity effect)
      vy -= gravity * timeStep

      // Update position
      x += vx * timeStep
      y += vy * timeStep
      z += vz * timeStep

      time += timeStep
    }

    // Calculate damage at distance
    const damage = this.calculateDamageAtDistance(baseBallistics.damage, distance)

    return {
      bullet,
      trajectory: {
        points,
        drop: -y,
        drift: x,
        velocity: [vx, vy, vz]
      },
      penetration: baseBallistics.penetration,
      damage
    }
  }

  private calculateDamageAtDistance(baseDamage: any, distance: number): any {
    const falloffStart = baseDamage.falloffStart
    const falloffEnd = baseDamage.falloffEnd
    const minDamage = baseDamage.minDamage

    if (distance <= falloffStart) {
      return baseDamage
    } else if (distance >= falloffEnd) {
      return { ...baseDamage, base: minDamage }
    } else {
      const falloffRatio = (distance - falloffStart) / (falloffEnd - falloffStart)
      const damage = baseDamage.base - (baseDamage.base - minDamage) * falloffRatio
      return { ...baseDamage, base: Math.max(minDamage, damage) }
    }
  }

  // Getters for UI
  public getWeaponLevel(weaponId: string): number {
    const weapon = this.weapons.get(weaponId)
    return weapon?.weaponLevel || 1
  }

  public getWeaponMasteryLevel(weaponId: string): number {
    const weapon = this.weapons.get(weaponId)
    return weapon?.masteryLevel || 1
  }

  public getWeaponStats(weaponId: string): any {
    const weapon = this.weapons.get(weaponId)
    return (weapon as any)?.calculatedStats || weapon?.baseStats || null
  }

  public isWeaponFavorite(weaponId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    return weapon?.isFavorite || false
  }

  public toggleWeaponFavorite(weaponId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return false

    weapon.isFavorite = !weapon.isFavorite
    return weapon.isFavorite
  }
}

// React Component for Weapon System UI
export function GLXYAdvancedWeaponUI() {
  const [weaponSystem] = useState(() => new GLXYAdvancedWeaponSystem())
  const [selectedWeapon, setSelectedWeapon] = useState<AdvancedWeaponConfig | null>(null)
  const [activeTab, setActiveTab] = useState('weapons')
  const [comparisonWeapons, setComparisonWeapons] = useState<string[]>([])

  useEffect(() => {
    // Initialize with first unlocked weapon
    const unlockedWeapons = weaponSystem.getUnlockedWeapons()
    if (unlockedWeapons.length > 0) {
      setSelectedWeapon(unlockedWeapons[0])
      weaponSystem.selectWeapon(unlockedWeapons[0].id)
    }
  }, [weaponSystem])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500'
      case 'uncommon': return 'bg-green-500'
      case 'rare': return 'bg-blue-500'
      case 'epic': return 'bg-purple-500'
      case 'legendary': return 'bg-orange-500'
      case 'mythic': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">GLXY Advanced Weapon System</h1>
        <p className="text-gray-300">Customize your weapons with attachments, skins, and master your arsenal</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="weapons">Weapons</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="skins">Skins</TabsTrigger>
          <TabsTrigger value="loadouts">Loadouts</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="weapons" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weapon List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Weapon Arsenal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weaponSystem.getAllWeapons().map(weapon => (
                  <motion.div
                    key={weapon.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all ${
                        selectedWeapon?.id === weapon.id ? 'ring-2 ring-blue-500' : ''
                      } ${!weapon.isUnlocked ? 'opacity-50' : ''}`}
                      onClick={() => {
                        if (weapon.isUnlocked) {
                          setSelectedWeapon(weapon)
                          weaponSystem.selectWeapon(weapon.id)
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{weapon.name}</h3>
                          {!weapon.isUnlocked && <Lock className="h-4 w-4 text-gray-400" />}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {weapon.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Lv. {weapon.weaponLevel}
                          </Badge>
                          {weapon.isFavorite && <Star className="h-3 w-3 text-yellow-400" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                          <div>Damage: {weapon.baseStats.damage}</div>
                          <div>Fire Rate: {weapon.baseStats.fireRate}</div>
                          <div>Accuracy: {weapon.baseStats.accuracy}%</div>
                          <div>Range: {weapon.baseStats.range}m</div>
                        </div>
                        <div className="mt-2">
                          <Progress value={(weapon.experience / weaponSystem.getExperienceForLevel(weapon.weaponLevel + 1)) * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Weapon Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Weapon Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedWeapon ? (
                  <div className="space-y-6">
                    {/* Weapon Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedWeapon.name}</h2>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline">{selectedWeapon.category}</Badge>
                          <Badge variant="outline">Level {selectedWeapon.weaponLevel}</Badge>
                          <Badge variant="outline">Mastery {selectedWeapon.masteryLevel}</Badge>
                          <Badge variant="outline">Kills: {selectedWeapon.killCount}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => weaponSystem.toggleWeaponFavorite(selectedWeapon.id)}
                      >
                        <Star className={`h-4 w-4 ${selectedWeapon.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                    </div>

                    {/* Weapon Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gray-800/50">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-400">{selectedWeapon.baseStats.damage}</div>
                          <div className="text-sm text-gray-400">Damage</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800/50">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">{selectedWeapon.baseStats.fireRate}</div>
                          <div className="text-sm text-gray-400">Fire Rate</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800/50">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">{selectedWeapon.baseStats.accuracy}%</div>
                          <div className="text-sm text-gray-400">Accuracy</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800/50">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400">{selectedWeapon.baseStats.range}m</div>
                          <div className="text-sm text-gray-400">Range</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Equipped Attachments */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Equipped Attachments</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['sight', 'barrel', 'grip', 'stock', 'magazine', 'muzzle'].map(type => {
                          const attachment = selectedWeapon.equippedAttachments.get(type)
                          return (
                            <Card key={type} className="bg-gray-800/50">
                              <CardContent className="p-3">
                                <div className="text-sm font-medium text-gray-400 mb-1">{type}</div>
                                <div className="text-sm text-white">
                                  {attachment ? attachment.name : 'None'}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>

                    {/* Weapon Skin */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Equipped Skin</h3>
                      <Card className="bg-gray-800/50">
                        <CardContent className="p-4">
                          {selectedWeapon.equippedSkin ? (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded ${getRarityColor(selectedWeapon.equippedSkin.rarity)}`} />
                              <div>
                                <div className="font-medium text-white">{selectedWeapon.equippedSkin.name}</div>
                                <div className="text-sm text-gray-400 capitalize">{selectedWeapon.equippedSkin.rarity}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">No skin equipped</div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Select a weapon to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          {selectedWeapon && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weaponSystem.getAvailableAttachments(selectedWeapon.id).map(attachment => (
                <Card key={attachment.id} className="bg-gray-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{attachment.name}</h3>
                      <Badge className={`${getRarityColor(attachment.rarity)} text-white`}>
                        {attachment.rarity}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-400 mb-3">{attachment.description}</div>

                    <div className="space-y-2 mb-4">
                      {Object.entries(attachment.stats).map(([stat, value]) => (
                        <div key={stat} className="flex justify-between text-sm">
                          <span className="text-gray-400 capitalize">{stat}:</span>
                          <span className={value > 0 ? 'text-green-400' : 'text-red-400'}>
                            {value > 0 ? '+' : ''}{value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {!attachment.isUnlocked ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Unlock Level:</span>
                          <span className="text-yellow-400">{attachment.unlockLevel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Cost:</span>
                          <span className="text-yellow-400">{attachment.cost} credits</span>
                        </div>
                        <Button disabled className="w-full">
                          <Lock className="h-4 w-4 mr-2" />
                          Locked
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className={`w-full ${attachment.equipped ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => {
                          if (attachment.equipped) {
                            weaponSystem.unequipAttachment(selectedWeapon.id, attachment.type)
                          } else {
                            weaponSystem.equipAttachment(selectedWeapon.id, attachment.id)
                          }
                        }}
                      >
                        {attachment.equipped ? 'Unequip' : 'Equip'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skins" className="space-y-4">
          {selectedWeapon && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weaponSystem.getAvailableSkins(selectedWeapon.id).map(skin => (
                <Card key={skin.id} className="bg-gray-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{skin.name}</h3>
                      <Badge className={`${getRarityColor(skin.rarity)} text-white`}>
                        {skin.rarity}
                      </Badge>
                    </div>

                    <div className={`w-full h-32 rounded mb-3 ${getRarityColor(skin.rarity)} bg-opacity-20`} />

                    {!skin.isUnlocked ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Unlock Level:</span>
                          <span className="text-yellow-400">{skin.unlockLevel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Cost:</span>
                          <span className="text-yellow-400">{skin.cost} credits</span>
                        </div>
                        <Button disabled className="w-full">
                          <Lock className="h-4 w-4 mr-2" />
                          Locked
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className={`w-full ${skin.isEquipped ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => {
                          if (skin.isEquipped) {
                            // Unequip skin
                          } else {
                            weaponSystem.equipSkin(selectedWeapon.id, skin.id)
                          }
                        }}
                      >
                        {skin.isEquipped ? 'Equipped' : 'Equip'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="loadouts" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Weapon Loadouts</h2>
            <Button onClick={() => {
              if (selectedWeapon) {
                weaponSystem.createLoadout(`Custom Loadout ${weaponSystem.getAllLoadouts().length + 1}`, selectedWeapon.id)
              }
            }}>
              <Package className="h-4 w-4 mr-2" />
              Create Loadout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weaponSystem.getAllLoadouts().map(loadout => (
              <Card key={loadout.id} className={`bg-gray-800/50 ${loadout.isActive ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{loadout.name}</h3>
                    <div className="flex items-center gap-2">
                      {loadout.isDefault && <Badge variant="outline">Default</Badge>}
                      {loadout.isActive && <Badge className="bg-blue-600">Active</Badge>}
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-3">
                    Weapon: {weaponSystem.getWeapon(loadout.weaponId)?.name}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">K/D:</span>
                      <span className="text-white ml-1">{loadout.stats.kd.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Accuracy:</span>
                      <span className="text-white ml-1">{loadout.stats.accuracy.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Kills:</span>
                      <span className="text-white ml-1">{loadout.stats.kills}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => weaponSystem.setActiveLoadout(loadout.id)}
                  >
                    {loadout.isActive ? 'Active' : 'Activate'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Weapon Comparison</h2>
            <p className="text-gray-400">Select weapons to compare their stats and performance</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weapon Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Weapons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weaponSystem.getUnlockedWeapons().map(weapon => (
                  <div key={weapon.id} className="flex items-center justify-between">
                    <span className="text-white">{weapon.name}</span>
                    <Button
                      size="sm"
                      variant={comparisonWeapons.includes(weapon.id) ? "default" : "outline"}
                      onClick={() => {
                        if (comparisonWeapons.includes(weapon.id)) {
                          setComparisonWeapons(prev => prev.filter(id => id !== weapon.id))
                        } else if (comparisonWeapons.length < 4) {
                          setComparisonWeapons(prev => [...prev, weapon.id])
                        }
                      }}
                    >
                      {comparisonWeapons.includes(weapon.id) ? 'Remove' : 'Add'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Comparison Results */}
            {comparisonWeapons.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const comparison = weaponSystem.compareWeapons(comparisonWeapons)
                    return (
                      <div className="space-y-4">
                        {/* Overall Scores */}
                        <div>
                          <h3 className="font-semibold text-white mb-2">Overall Score</h3>
                          <div className="space-y-2">
                            {comparison.weapons.map(weaponId => {
                              const weapon = weaponSystem.getWeapon(weaponId)
                              const score = comparison.scores.get(weaponId) || 0
                              return (
                                <div key={weaponId} className="flex items-center gap-3">
                                  <span className="text-white w-32">{weapon?.name}</span>
                                  <div className="flex-1">
                                    <Progress value={score * 100} className="h-2" />
                                  </div>
                                  <span className="text-gray-400 w-12 text-right">{(score * 100).toFixed(0)}%</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h3 className="font-semibold text-white mb-2">Recommendations</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-400">Best Overall:</div>
                            <div className="text-white">
                              {weaponSystem.getWeapon(comparison.recommendation.bestOverall)?.name}
                            </div>
                            <div className="text-gray-400">Close Range:</div>
                            <div className="text-white">
                              {weaponSystem.getWeapon(comparison.recommendation.bestFor.closeRange)?.name}
                            </div>
                            <div className="text-gray-400">Long Range:</div>
                            <div className="text-white">
                              {weaponSystem.getWeapon(comparison.recommendation.bestFor.longRange)?.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GLXYAdvancedWeaponUI