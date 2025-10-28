// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'

export interface WeaponStats {
  damage: number
  fireRate: number
  range: number
  accuracy: number
  recoil: number
  reloadTime: number
  magazineSize: number
  reserveAmmo: number
  penetration: number
  bulletVelocity: number
  bulletDrop: number
  spread: number
  hipFireSpread: number
  aimDownSightsSpread: number
  movementSpread: number
  jumpSpread: number
  damageFalloffStart: number
  damageFalloffEnd: number
  minimumDamage: number
  headshotMultiplier: number
  limbDamageMultiplier: number
  armorPenetration: number
  wallBangPenetration: number
  suppressionEffect: number
  fireModes: ('semi' | 'burst' | 'auto')[]
  burstCount: number
  chamberTime: number
  equipTime: number
  unequipTime: number
  adsTime: number
  adsOutTime: number
  sprintToFireTime: number
  weight: number
  price: number
  killReward: number
}

export interface BallisticData {
  bulletType: 'ball' | 'hollow_point' | 'armor_piercing' | 'tracer' | 'explosive' | 'incendiary'
  caliber: number
  grain: number
  muzzleVelocity: number
  ballisticCoefficient: number
  dragCoefficient: number
  windResistance: number
  gravityEffect: number
  temperatureEffect: number
  humidityEffect: number
  altitudeEffect: number
  ricochetChance: number
  ricochetDamage: number
  ricochetAngle: number
  penetrationDepth: number
  fragmentationChance: number
  fragmentDamage: number
  explosionRadius?: number
  incendiaryRadius?: number
  incendiaryDuration?: number
  tracerColor?: THREE.Color
  trailEffect?: 'none' | 'smoke' | 'spark' | 'energy' | 'plasma'
}

export interface RecoilPattern {
  type: 'realistic' | 'predictable' | 'random' | 'adaptive'
  horizontalPattern: number[]
  verticalPattern: number[]
  kickbackForce: number
  cameraShake: number
  screenShake: number
  viewPunch: THREE.Vector3
  muzzleClimb: number
  recoveryTime: number
  compensationDifficulty: number
  learningRate: number
  adaptationEnabled: boolean
  playerHistory: Array<{ timestamp: number; pattern: number[]; compensated: boolean }>
}

export interface WeaponAttachment {
  id: string
  type: 'barrel' | 'muzzle' | 'optic' | 'stock' | 'grip' | 'magazine' | 'underbarrel' | 'laser' | 'skin'
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  price: number
  unlockLevel: number
  statsModification: Partial<WeaponStats>
  ballisticsModification: Partial<BallisticData>
  recoilModification: Partial<RecoilPattern>
  visualModel?: string
  soundEffect?: string
  particleEffect?: string
  compatibility: string[]
  pros: string[]
  cons: string[]
}

export interface WeaponConfiguration {
  weaponId: string
  attachments: WeaponAttachment[]
  customName?: string
  customSkin?: string
  loadoutSlot?: number
  favorite?: boolean
  killCount: number
  accuracy: number
  headshotRate: number
  damageDealt: number
  shotsFired: number
  shotsHit: number
  playtime: number
  unlockedAt?: number
  masteryLevel: number
}

export interface WeaponState {
  currentAmmo: number
  reserveAmmo: number
  isReloading: boolean
  isAiming: boolean
  isSprinting: boolean
  isJumping: boolean
  isSliding: boolean
  isFiring: boolean
  fireMode: string
  lastFireTime: number
  reloadStartTime: number
  adsStartTime: number
  equipStartTime: number
  jamChance: number
  durability: number
  temperature: number
  cleanliness: number
  modifications: WeaponAttachment[]
}

export interface HitMarker {
  type: 'hit' | 'critical' | 'headshot' | 'limb' | 'wallbang' | 'kill' | 'multi_kill'
  damage: number
  distance: number
  position: THREE.Vector3
  time: number
  sound?: string
  visual?: string
  intensity: number
}

export interface WeaponFireEffect {
  muzzleFlash: {
    color: THREE.Color
    intensity: number
    duration: number
    size: number
    pattern: 'cone' | 'sphere' | 'directional'
    particleCount: number
  }
  smoke: {
    color: THREE.Color
    density: number
    duration: number
    dissipationRate: number
    windEffect: number
  }
  sparks: {
    count: number
    color: THREE.Color
    lifetime: number
    velocity: number
    spread: number
  }
  shellEjection: {
    enabled: boolean
    ejectionPort: THREE.Vector3
    ejectionForce: number
    spinRate: number
    arcHeight: number
    bounceCount: number
    materialType: 'brass' | 'steel' | 'aluminum'
  }
  heatWave: {
    enabled: boolean
    intensity: number
    duration: number
    distortionAmount: number
    color: THREE.Color
  }
}

export class GLXYPerfectWeaponSystem {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private weapons: Map<string, WeaponConfiguration> = new Map()
  private weaponStates: Map<string, WeaponState> = new Map()
  private ballistics: Map<string, BallisticData> = new Map()
  private recoilPatterns: Map<string, RecoilPattern> = new Map()
  private fireEffects: Map<string, WeaponFireEffect> = new Map()
  private hitMarkers: HitMarker[] = []

  private currentTime = 0
  private deltaTime = 0
  private windVector = new THREE.Vector3(0, 0, 0)
  private gravity = new THREE.Vector3(0, -9.81, 0)
  private airDensity = 1.225
  private temperature = 20
  private humidity = 0.5
  private altitude = 0

  private activeBulletTrajectories: Array<{
    bullet: THREE.Mesh
    velocity: THREE.Vector3
    position: THREE.Vector3
    data: BallisticData
    trail: THREE.Points[]
    timeAlive: number
  }> = []

  private suppressedSounds: Map<string, HTMLAudioElement> = new Map()
  private unsuppressedSounds: Map<string, HTMLAudioElement> = new Map()
  private ricochetSounds: Map<string, HTMLAudioElement> = new Map()

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene
    this.camera = camera
    this.initializeWeapons()
    this.setupEnvironmentalEffects()
  }

  private initializeWeapons(): void {
    // Assault Rifles
    this.createWeapon('glxy_m4a1_elite', {
      damage: 33,
      fireRate: 666,
      range: 75,
      accuracy: 0.85,
      recoil: 0.65,
      reloadTime: 2.4,
      magazineSize: 30,
      reserveAmmo: 150,
      penetration: 0.7,
      bulletVelocity: 880,
      bulletDrop: 9.81,
      spread: 0.02,
      hipFireSpread: 0.08,
      aimDownSightsSpread: 0.015,
      movementSpread: 0.12,
      jumpSpread: 0.25,
      damageFalloffStart: 30,
      damageFalloffEnd: 75,
      minimumDamage: 18,
      headshotMultiplier: 2.0,
      limbDamageMultiplier: 0.8,
      armorPenetration: 0.6,
      wallBangPenetration: 0.3,
      suppressionEffect: 0.4,
      fireModes: ['semi', 'burst', 'auto'],
      burstCount: 3,
      chamberTime: 0.15,
      equipTime: 0.8,
      unequipTime: 0.6,
      adsTime: 0.25,
      adsOutTime: 0.25,
      sprintToFireTime: 0.4,
      weight: 3.1,
      price: 3100,
      killReward: 300
    }, {
      bulletType: 'ball',
      caliber: 5.56,
      grain: 62,
      muzzleVelocity: 880,
      ballisticCoefficient: 0.301,
      dragCoefficient: 0.295,
      windResistance: 0.02,
      gravityEffect: 1.0,
      temperatureEffect: 0.001,
      humidityEffect: 0.0005,
      altitudeEffect: 0.0002,
      ricochetChance: 0.15,
      ricochetDamage: 0.3,
      ricochetAngle: 30,
      penetrationDepth: 0.4,
      fragmentationChance: 0.05,
      fragmentDamage: 0.1,
      trailEffect: 'smoke'
    }, {
      type: 'realistic',
      horizontalPattern: [2, -3, 1, -2, 3, -1, 2, -2, 1, -1],
      verticalPattern: [8, 12, 15, 18, 20, 21, 22, 22, 23, 23],
      kickbackForce: 450,
      cameraShake: 0.15,
      screenShake: 0.12,
      viewPunch: new THREE.Vector3(0.02, 0.08, 0),
      muzzleClimb: 0.65,
      recoveryTime: 0.3,
      compensationDifficulty: 0.7,
      learningRate: 0.02,
      adaptationEnabled: true,
      playerHistory: []
    }, {
      muzzleFlash: {
        color: new THREE.Color(0xffffff),
        intensity: 1.2,
        duration: 0.1,
        size: 0.3,
        pattern: 'cone',
        particleCount: 15
      },
      smoke: {
        color: new THREE.Color(0x888888),
        density: 0.3,
        duration: 1.5,
        dissipationRate: 0.8,
        windEffect: 0.5
      },
      sparks: {
        count: 8,
        color: new THREE.Color(0xffaa00),
        lifetime: 0.8,
        velocity: 25,
        spread: 0.4
      },
      shellEjection: {
        enabled: true,
        ejectionPort: new THREE.Vector3(0.15, 0.05, 0.05),
        ejectionForce: 8,
        spinRate: 720,
        arcHeight: 0.3,
        bounceCount: 3,
        materialType: 'brass'
      },
      heatWave: {
        enabled: true,
        intensity: 0.3,
        duration: 0.4,
        distortionAmount: 0.15,
        color: new THREE.Color(0xffdddd)
      }
    })

    // Sniper Rifles
    this.createWeapon('glxy_awp_omega', {
      damage: 115,
      fireRate: 41,
      range: 150,
      accuracy: 0.98,
      recoil: 0.95,
      reloadTime: 3.7,
      magazineSize: 10,
      reserveAmmo: 30,
      penetration: 0.95,
      bulletVelocity: 980,
      bulletDrop: 9.81,
      spread: 0.001,
      hipFireSpread: 0.25,
      aimDownSightsSpread: 0.0005,
      movementSpread: 0.15,
      jumpSpread: 0.5,
      damageFalloffStart: 50,
      damageFalloffEnd: 150,
      minimumDamage: 95,
      headshotMultiplier: 4.0,
      limbDamageMultiplier: 0.6,
      armorPenetration: 0.9,
      wallBangPenetration: 0.7,
      suppressionEffect: 0.8,
      fireModes: ['semi'],
      burstCount: 1,
      chamberTime: 0.6,
      equipTime: 1.2,
      unequipTime: 0.9,
      adsTime: 0.45,
      adsOutTime: 0.45,
      sprintToFireTime: 0.8,
      weight: 6.5,
      price: 4750,
      killReward: 50
    }, {
      bulletType: 'armor_piercing',
      caliber: 12.7,
      grain: 750,
      muzzleVelocity: 980,
      ballisticCoefficient: 0.65,
      dragCoefficient: 0.25,
      windResistance: 0.008,
      gravityEffect: 0.95,
      temperatureEffect: 0.0005,
      humidityEffect: 0.0002,
      altitudeEffect: 0.0001,
      ricochetChance: 0.25,
      ricochetDamage: 0.6,
      ricochetAngle: 20,
      penetrationDepth: 0.9,
      fragmentationChance: 0.15,
      fragmentDamage: 0.3,
      trailEffect: 'energy',
      tracerColor: new THREE.Color(0x00ffff)
    }, {
      type: 'predictable',
      horizontalPattern: [0],
      verticalPattern: [45],
      kickbackForce: 1200,
      cameraShake: 0.35,
      screenShake: 0.28,
      viewPunch: new THREE.Vector3(0.05, 0.15, 0),
      muzzleClimb: 0.9,
      recoveryTime: 1.2,
      compensationDifficulty: 0.3,
      learningRate: 0.05,
      adaptationEnabled: false,
      playerHistory: []
    }, {
      muzzleFlash: {
        color: new THREE.Color(0xffffff),
        intensity: 2.5,
        duration: 0.15,
        size: 0.6,
        pattern: 'directional',
        particleCount: 30
      },
      smoke: {
        color: new THREE.Color(0xaaaaaa),
        density: 0.8,
        duration: 3.0,
        dissipationRate: 0.4,
        windEffect: 0.2
      },
      sparks: {
        count: 20,
        color: new THREE.Color(0xffffff),
        lifetime: 1.5,
        velocity: 40,
        spread: 0.2
      },
      shellEjection: {
        enabled: true,
        ejectionPort: new THREE.Vector3(0.2, 0.08, 0.08),
        ejectionForce: 12,
        spinRate: 540,
        arcHeight: 0.5,
        bounceCount: 4,
        materialType: 'brass'
      },
      heatWave: {
        enabled: true,
        intensity: 0.6,
        duration: 0.8,
        distortionAmount: 0.25,
        color: new THREE.Color(0xffeeff)
      }
    })

    // SMGs
    this.createWeapon('glxy_mp9_tactical', {
      damage: 26,
      fireRate: 857,
      range: 40,
      accuracy: 0.75,
      recoil: 0.45,
      reloadTime: 2.1,
      magazineSize: 30,
      reserveAmmo: 120,
      penetration: 0.4,
      bulletVelocity: 400,
      bulletDrop: 9.81,
      spread: 0.04,
      hipFireSpread: 0.06,
      aimDownSightsSpread: 0.025,
      movementSpread: 0.08,
      jumpSpread: 0.18,
      damageFalloffStart: 15,
      damageFalloffEnd: 40,
      minimumDamage: 14,
      headshotMultiplier: 1.8,
      limbDamageMultiplier: 0.85,
      armorPenetration: 0.3,
      wallBangPenetration: 0.15,
      suppressionEffect: 0.2,
      fireModes: ['semi', 'auto'],
      burstCount: 1,
      chamberTime: 0.08,
      equipTime: 0.6,
      unequipTime: 0.4,
      adsTime: 0.18,
      adsOutTime: 0.18,
      sprintToFireTime: 0.3,
      weight: 2.8,
      price: 1250,
      killReward: 600
    }, {
      bulletType: 'hollow_point',
      caliber: 9,
      grain: 124,
      muzzleVelocity: 400,
      ballisticCoefficient: 0.15,
      dragCoefficient: 0.35,
      windResistance: 0.04,
      gravityEffect: 1.1,
      temperatureEffect: 0.002,
      humidityEffect: 0.001,
      altitudeEffect: 0.0003,
      ricochetChance: 0.08,
      ricochetDamage: 0.2,
      ricochetAngle: 45,
      penetrationDepth: 0.15,
      fragmentationChance: 0.25,
      fragmentDamage: 0.15,
      trailEffect: 'none'
    }, {
      type: 'random',
      horizontalPattern: [4, -5, 3, -4, 5, -3, 4, -4, 3, -3],
      verticalPattern: [6, 9, 12, 14, 16, 17, 18, 19, 19, 20],
      kickbackForce: 280,
      cameraShake: 0.08,
      screenShake: 0.06,
      viewPunch: new THREE.Vector3(0.015, 0.05, 0),
      muzzleClimb: 0.35,
      recoveryTime: 0.2,
      compensationDifficulty: 0.8,
      learningRate: 0.03,
      adaptationEnabled: true,
      playerHistory: []
    }, {
      muzzleFlash: {
        color: new THREE.Color(0xffffaa),
        intensity: 0.8,
        duration: 0.08,
        size: 0.2,
        pattern: 'cone',
        particleCount: 10
      },
      smoke: {
        color: new THREE.Color(0xaaaa88),
        density: 0.2,
        duration: 1.0,
        dissipationRate: 1.0,
        windEffect: 0.7
      },
      sparks: {
        count: 5,
        color: new THREE.Color(0xff8800),
        lifetime: 0.6,
        velocity: 20,
        spread: 0.6
      },
      shellEjection: {
        enabled: true,
        ejectionPort: new THREE.Vector3(0.12, 0.04, 0.04),
        ejectionForce: 6,
        spinRate: 900,
        arcHeight: 0.2,
        bounceCount: 2,
        materialType: 'aluminum'
      },
      heatWave: {
        enabled: true,
        intensity: 0.2,
        duration: 0.3,
        distortionAmount: 0.1,
        color: new THREE.Color(0xffffdd)
      }
    })

    // Shotguns
    this.createWeapon('glxy_m870_destruction', {
      damage: 18,
      fireRate: 68,
      range: 25,
      accuracy: 0.6,
      recoil: 0.85,
      reloadTime: 4.0,
      magazineSize: 8,
      reserveAmmo: 32,
      penetration: 0.2,
      bulletVelocity: 380,
      bulletDrop: 9.81,
      spread: 0.15,
      hipFireSpread: 0.12,
      aimDownSightsSpread: 0.08,
      movementSpread: 0.18,
      jumpSpread: 0.3,
      damageFalloffStart: 8,
      damageFalloffEnd: 25,
      minimumDamage: 4,
      headshotMultiplier: 1.2,
      limbDamageMultiplier: 0.9,
      armorPenetration: 0.1,
      wallBangPenetration: 0.05,
      suppressionEffect: 0.3,
      fireModes: ['semi'],
      burstCount: 1,
      chamberTime: 0.7,
      equipTime: 0.9,
      unequipTime: 0.7,
      adsTime: 0.35,
      adsOutTime: 0.35,
      sprintToFireTime: 0.6,
      weight: 3.6,
      price: 2000,
      killReward: 900
    }, {
      bulletType: 'ball',
      caliber: 12,
      grain: 1, // Per pellet
      muzzleVelocity: 380,
      ballisticCoefficient: 0.08,
      dragCoefficient: 0.45,
      windResistance: 0.08,
      gravityEffect: 1.3,
      temperatureEffect: 0.003,
      humidityEffect: 0.0015,
      altitudeEffect: 0.0005,
      ricochetChance: 0.05,
      ricochetDamage: 0.1,
      ricochetAngle: 60,
      penetrationDepth: 0.05,
      fragmentationChance: 0.4,
      fragmentDamage: 0.2,
      trailEffect: 'none'
    }, {
      type: 'realistic',
      horizontalPattern: [8, -10, 6, -8, 7, -6, 5, -5],
      verticalPattern: [25, 32, 38, 42, 45, 47, 48, 48],
      kickbackForce: 680,
      cameraShake: 0.28,
      screenShake: 0.22,
      viewPunch: new THREE.Vector3(0.04, 0.12, 0),
      muzzleClimb: 0.8,
      recoveryTime: 0.6,
      compensationDifficulty: 0.6,
      learningRate: 0.04,
      adaptationEnabled: true,
      playerHistory: []
    }, {
      muzzleFlash: {
        color: new THREE.Color(0xffaa44),
        intensity: 1.8,
        duration: 0.12,
        size: 0.8,
        pattern: 'sphere',
        particleCount: 25
      },
      smoke: {
        color: new THREE.Color(0xaa8844),
        density: 0.6,
        duration: 2.5,
        dissipationRate: 0.5,
        windEffect: 0.4
      },
      sparks: {
        count: 15,
        color: new THREE.Color(0xff6600),
        lifetime: 1.2,
        velocity: 30,
        spread: 0.8
      },
      shellEjection: {
        enabled: true,
        ejectionPort: new THREE.Vector3(0.18, 0.06, 0.06),
        ejectionForce: 10,
        spinRate: 600,
        arcHeight: 0.4,
        bounceCount: 3,
        materialType: 'steel'
      },
      heatWave: {
        enabled: true,
        intensity: 0.4,
        duration: 0.6,
        distortionAmount: 0.18,
        color: new THREE.Color(0xffddaa)
      }
    })

    // Pistols
    this.createWeapon('glxy_deagle_x', {
      damage: 63,
      fireRate: 267,
      range: 35,
      accuracy: 0.82,
      recoil: 0.75,
      reloadTime: 2.2,
      magazineSize: 7,
      reserveAmmo: 35,
      penetration: 0.6,
      bulletVelocity: 425,
      bulletDrop: 9.81,
      spread: 0.015,
      hipFireSpread: 0.08,
      aimDownSightsSpread: 0.01,
      movementSpread: 0.12,
      jumpSpread: 0.22,
      damageFalloffStart: 15,
      damageFalloffEnd: 35,
      minimumDamage: 45,
      headshotMultiplier: 2.5,
      limbDamageMultiplier: 0.75,
      armorPenetration: 0.5,
      wallBangPenetration: 0.25,
      suppressionEffect: 0.25,
      fireModes: ['semi'],
      burstCount: 1,
      chamberTime: 0.2,
      equipTime: 0.4,
      unequipTime: 0.3,
      adsTime: 0.2,
      adsOutTime: 0.2,
      sprintToFireTime: 0.25,
      weight: 1.8,
      price: 700,
      killReward: 175
    }, {
      bulletType: 'hollow_point',
      caliber: 12.7,
      grain: 300,
      muzzleVelocity: 425,
      ballisticCoefficient: 0.18,
      dragCoefficient: 0.32,
      windResistance: 0.035,
      gravityEffect: 1.05,
      temperatureEffect: 0.0025,
      humidityEffect: 0.0012,
      altitudeEffect: 0.0004,
      ricochetChance: 0.12,
      ricochetDamage: 0.25,
      ricochetAngle: 35,
      penetrationDepth: 0.25,
      fragmentationChance: 0.3,
      fragmentDamage: 0.2,
      trailEffect: 'spark'
    }, {
      type: 'predictable',
      horizontalPattern: [0],
      verticalPattern: [22],
      kickbackForce: 320,
      cameraShake: 0.18,
      screenShake: 0.14,
      viewPunch: new THREE.Vector3(0.03, 0.09, 0),
      muzzleClimb: 0.55,
      recoveryTime: 0.4,
      compensationDifficulty: 0.4,
      learningRate: 0.06,
      adaptationEnabled: false,
      playerHistory: []
    }, {
      muzzleFlash: {
        color: new THREE.Color(0xffffff),
        intensity: 1.5,
        duration: 0.1,
        size: 0.25,
        pattern: 'cone',
        particleCount: 12
      },
      smoke: {
        color: new THREE.Color(0x999999),
        density: 0.25,
        duration: 1.2,
        dissipationRate: 0.9,
        windEffect: 0.6
      },
      sparks: {
        count: 8,
        color: new THREE.Color(0xffaa00),
        lifetime: 0.9,
        velocity: 28,
        spread: 0.5
      },
      shellEjection: {
        enabled: true,
        ejectionPort: new THREE.Vector3(0.1, 0.03, 0.03),
        ejectionForce: 7,
        spinRate: 800,
        arcHeight: 0.25,
        bounceCount: 2,
        materialType: 'brass'
      },
      heatWave: {
        enabled: true,
        intensity: 0.25,
        duration: 0.35,
        distortionAmount: 0.12,
        color: new THREE.Color(0xffffee)
      }
    })
  }

  private createWeapon(
    id: string,
    stats: WeaponStats,
    ballistics: BallisticData,
    recoilPattern: RecoilPattern,
    fireEffect: WeaponFireEffect
  ): void {
    const weapon: WeaponConfiguration = {
      weaponId: id,
      attachments: [],
      killCount: 0,
      accuracy: 0,
      headshotRate: 0,
      damageDealt: 0,
      shotsFired: 0,
      shotsHit: 0,
      playtime: 0,
      masteryLevel: 1
    }

    const state: WeaponState = {
      currentAmmo: stats.magazineSize,
      reserveAmmo: stats.reserveAmmo,
      isReloading: false,
      isAiming: false,
      isSprinting: false,
      isJumping: false,
      isSliding: false,
      isFiring: false,
      fireMode: stats.fireModes[0],
      lastFireTime: 0,
      reloadStartTime: 0,
      adsStartTime: 0,
      equipStartTime: 0,
      jamChance: 0.001,
      durability: 100,
      temperature: 20,
      cleanliness: 100,
      modifications: []
    }

    this.weapons.set(id, weapon)
    this.weaponStates.set(id, state)
    this.ballistics.set(id, ballistics)
    this.recoilPatterns.set(id, recoilPattern)
    this.fireEffects.set(id, fireEffect)
  }

  private setupEnvironmentalEffects(): void {
    // Initialize environmental conditions
    this.updateWindVector()
    this.updateAirDensity()
  }

  private updateWindVector(): void {
    // Simulate wind changes
    const windSpeed = 5 + Math.sin(Date.now() * 0.0001) * 3
    const windDirection = Date.now() * 0.00005
    this.windVector.set(
      Math.cos(windDirection) * windSpeed,
      0,
      Math.sin(windDirection) * windSpeed
    )
  }

  private updateAirDensity(): void {
    // Calculate air density based on altitude, temperature, and humidity
    const pressure = 101325 * Math.pow(1 - 0.0065 * this.altitude / 288.15, 5.255)
    const temperatureKelvin = this.temperature + 273.15
    this.airDensity = (pressure * 0.0289644) / (8.31446 * temperatureKelvin) * (1 - this.humidity * 0.01)
  }

  public fireWeapon(weaponId: string, origin: THREE.Vector3, direction: THREE.Vector3): boolean {
    const weapon = this.weapons.get(weaponId)
    const state = this.weaponStates.get(weaponId)
    const stats = weapon ? this.getWeaponStats(weaponId) : null

    if (!weapon || !state || !stats) return false

    // Check if can fire
    if (state.isReloading || state.currentAmmo <= 0) return false

    const currentTime = this.currentTime
    const fireInterval = 1000 / stats.fireRate

    if (currentTime - state.lastFireTime < fireInterval) return false

    // Check for jam
    if (Math.random() < state.jamChance) {
      this.handleWeaponJam(weaponId)
      return false
    }

    // Calculate accuracy based on conditions
    const accuracy = this.calculateAccuracy(weaponId, state)

    // Apply recoil pattern
    this.applyRecoil(weaponId, direction)

    // Create fire effects
    this.createFireEffects(weaponId, origin, direction)

    // Calculate bullet trajectory
    const pelletCount = weaponId.includes('m870') ? 8 : 1
    const bullets: THREE.Vector3[][] = []

    for (let i = 0; i < pelletCount; i++) {
      const spread = this.calculateSpread(weaponId, state, i, pelletCount)
      const bulletDirection = direction.clone().add(spread).normalize()

      const trajectory = this.calculateBallisticTrajectory(
        origin,
        bulletDirection,
        this.ballistics.get(weaponId)!
      )

      bullets.push(trajectory)
      this.createBulletVisualization(trajectory)
    }

    // Update weapon state
    state.currentAmmo--
    state.lastFireTime = currentTime
    state.isFiring = true
    state.temperature = Math.min(100, state.temperature + 2)

    // Update weapon stats
    weapon.shotsFired += pelletCount

    // Play sound
    this.playWeaponSound(weaponId, origin)

    // Check for empty magazine
    if (state.currentAmmo === 0) {
      this.autoReload(weaponId)
    }

    return true
  }

  private calculateAccuracy(weaponId: string, state: WeaponState): number {
    const stats = this.getWeaponStats(weaponId)
    if (!stats) return 0.5

    let accuracy = stats.accuracy

    // Apply penalties
    if (!state.isAiming) {
      accuracy *= 0.7
    }
    if (state.isSprinting) {
      accuracy *= 0.3
    }
    if (state.isJumping) {
      accuracy *= 0.2
    }
    if (state.isSliding) {
      accuracy *= 0.4
    }

    // Apply bonuses
    if (state.isAiming) {
      accuracy *= 1.3
    }

    // Temperature affects accuracy
    if (state.temperature > 80) {
      accuracy *= 0.9
    }

    // Cleanliness affects accuracy
    accuracy *= 0.8 + (state.cleanliness / 100) * 0.2

    return Math.max(0.1, Math.min(1.0, accuracy))
  }

  private calculateSpread(weaponId: string, state: WeaponState, pelletIndex: number, pelletCount: number): THREE.Vector3 {
    const stats = this.getWeaponStats(weaponId)
    if (!stats) return new THREE.Vector3(0, 0, 0)

    let spread = stats.spread

    // Apply situational spread
    if (!state.isAiming) {
      spread = stats.hipFireSpread
    }
    if (state.isSprinting) {
      spread = Math.max(spread, stats.movementSpread)
    }
    if (state.isJumping) {
      spread = Math.max(spread, stats.jumpSpread)
    }

    // Apply movement penalties
    if (state.isSliding) {
      spread *= 1.2
    }

    // Temperature affects spread
    if (state.temperature > 60) {
      spread *= 1 + (state.temperature - 60) / 100
    }

    // Calculate spread vector
    const angle = (pelletIndex / pelletCount) * Math.PI * 2
    const radius = spread * (Math.random() * 0.5 + 0.5)

    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    )
  }

  private applyRecoil(weaponId: string, direction: THREE.Vector3): void {
    const recoilPattern = this.recoilPatterns.get(weaponId)
    const state = this.weaponStates.get(weaponId)
    if (!recoilPattern || !state) return

    // Get recoil from pattern
    const shotIndex = this.weapons.get(weaponId)!.shotsFired % recoilPattern.verticalPattern.length
    const verticalRecoil = recoilPattern.verticalPattern[shotIndex] || 0
    const horizontalRecoil = recoilPattern.horizontalPattern[shotIndex] || 0

    // Apply recoil to direction
    const recoilVector = new THREE.Vector3(
      horizontalRecoil * 0.01,
      verticalRecoil * 0.01,
      0
    )

    // Add camera shake
    this.applyCameraShake(recoilPattern.cameraShake)

    // Record in player history for adaptive patterns
    if (recoilPattern.adaptationEnabled) {
      recoilPattern.playerHistory.push({
        timestamp: this.currentTime,
        pattern: [horizontalRecoil, verticalRecoil],
        compensated: false
      })

      // Keep history limited
      if (recoilPattern.playerHistory.length > 100) {
        recoilPattern.playerHistory.shift()
      }
    }
  }

  private applyCameraShake(intensity: number): void {
    // This would interface with the camera system to apply shake
    console.log(`Camera shake intensity: ${intensity}`)
  }

  private calculateBallisticTrajectory(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    ballistics: BallisticData
  ): THREE.Vector3[] {
    const trajectory: THREE.Vector3[] = []
    const timeStep = 0.016 // ~60 FPS
    const maxTime = 5.0 // 5 seconds max flight time

    let position = origin.clone()
    let velocity = direction.clone().multiplyScalar(ballistics.muzzleVelocity)

    // Apply environmental effects
    const gravityEffect = this.gravity.clone().multiplyScalar(ballistics.gravityEffect)
    const windEffect = this.windVector.clone().multiplyScalar(ballistics.windResistance)

    for (let t = 0; t < maxTime; t += timeStep) {
      trajectory.push(position.clone())

      // Apply forces
      velocity.add(gravityEffect.clone().multiplyScalar(timeStep))
      velocity.add(windEffect.clone().multiplyScalar(timeStep))

      // Apply drag
      const speed = velocity.length()
      const dragForce = velocity.clone().normalize()
        .multiplyScalar(-0.5 * this.airDensity * ballistics.dragCoefficient * speed * speed * 0.0001)
      velocity.add(dragForce.multiplyScalar(timeStep))

      // Update position
      position.add(velocity.clone().multiplyScalar(timeStep))

      // Check if bullet hit ground or exceeded range
      if (position.y < 0 || position.distanceTo(origin) > 500) {
        break
      }
    }

    return trajectory
  }

  private createBulletVisualization(trajectory: THREE.Vector3[]): void {
    if (trajectory.length < 2) return

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(trajectory.length * 3)

    trajectory.forEach((point, index) => {
      positions[index * 3] = point.x
      positions[index * 3 + 1] = point.y
      positions[index * 3 + 2] = point.z
    })

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    })

    const line = new THREE.Line(geometry, material)
    this.scene.add(line)

    // Remove after short time
    setTimeout(() => {
      this.scene.remove(line)
    }, 500)
  }

  private createFireEffects(weaponId: string, origin: THREE.Vector3, direction: THREE.Vector3): void {
    const fireEffect = this.fireEffects.get(weaponId)
    if (!fireEffect) return

    // Create muzzle flash
    this.createMuzzleFlash(origin, direction, fireEffect.muzzleFlash)

    // Create smoke
    this.createSmoke(origin, direction, fireEffect.smoke)

    // Create sparks
    this.createSparks(origin, direction, fireEffect.sparks)

    // Create shell ejection
    this.createShellEjection(weaponId, origin, fireEffect.shellEjection)

    // Create heat wave
    this.createHeatWave(origin, fireEffect.heatWave)
  }

  private createMuzzleFlash(origin: THREE.Vector3, direction: THREE.Vector3, flash: any): void {
    const geometry = new THREE.SphereGeometry(flash.size, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: flash.color,
      transparent: true,
      opacity: flash.intensity
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(origin)
    this.scene.add(mesh)

    // Animate and remove
    let opacity = flash.intensity
    const animate = () => {
      opacity -= 0.05
      if (opacity <= 0) {
        this.scene.remove(mesh)
        return
      }
      material.opacity = opacity
      requestAnimationFrame(animate)
    }
    animate()
  }

  private createSmoke(origin: THREE.Vector3, direction: THREE.Vector3, smoke: any): void {
    const particleCount = 20
    const particles: THREE.Mesh[] = []

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4)
      const material = new THREE.MeshBasicMaterial({
        color: smoke.color,
        transparent: true,
        opacity: smoke.density
      })

      const particle = new THREE.Mesh(geometry, material)
      particle.position.copy(origin).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )
      )
      particles.push(particle)
      this.scene.add(particle)
    }

    // Animate smoke dissipation
    let time = 0
    const animate = () => {
      time += 0.016
      if (time > smoke.duration) {
        particles.forEach(p => this.scene.remove(p))
        return
      }

      particles.forEach(particle => {
        particle.position.y += 0.05
        particle.position.x += (Math.random() - 0.5) * 0.02
        particle.position.z += (Math.random() - 0.5) * 0.02
        particle.scale.multiplyScalar(1.02)

        const material = particle.material as THREE.MeshBasicMaterial
        material.opacity *= smoke.dissipationRate
      })

      requestAnimationFrame(animate)
    }
    animate()
  }

  private createSparks(origin: THREE.Vector3, direction: THREE.Vector3, sparks: any): void {
    for (let i = 0; i < sparks.count; i++) {
      const geometry = new THREE.SphereGeometry(0.02, 4, 4)
      const material = new THREE.MeshBasicMaterial({
        color: sparks.color,
        transparent: true,
        opacity: 1
      })

      const spark = new THREE.Mesh(geometry, material)
      spark.position.copy(origin)

      const velocity = direction.clone().multiplyScalar(sparks.velocity).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * sparks.spread,
          (Math.random() - 0.5) * sparks.spread,
          (Math.random() - 0.5) * sparks.spread
        )
      )

      this.scene.add(spark)

      // Animate spark
      let time = 0
      const animate = () => {
        time += 0.016
        if (time > sparks.lifetime) {
          this.scene.remove(spark)
          return
        }

        spark.position.add(velocity.clone().multiplyScalar(0.016))
        velocity.y -= 9.81 * 0.016

        const material = spark.material as THREE.MeshBasicMaterial
        material.opacity = 1 - (time / sparks.lifetime)

        requestAnimationFrame(animate)
      }
      animate()
    }
  }

  private createShellEjection(weaponId: string, origin: THREE.Vector3, shell: any): void {
    if (!shell.enabled) return

    const geometry = new THREE.CylinderGeometry(0.02, 0.025, 0.05, 8)
    const material = new THREE.MeshStandardMaterial({
      color: shell.materialType === 'brass' ? 0xffd700 :
             shell.materialType === 'steel' ? 0x888888 : 0xcccccc,
      metalness: 0.9,
      roughness: 0.3
    })

    const shellMesh = new THREE.Mesh(geometry, material)
    shellMesh.position.copy(origin).add(shell.ejectionPort)
    this.scene.add(shellMesh)

    // Apply ejection physics
    const ejectionDirection = new THREE.Vector3(1, 0.5, 0.3).normalize()
    const velocity = ejectionDirection.multiplyScalar(shell.ejectionForce)

    let angularVelocity = shell.spinRate * Math.PI / 180
    let bounces = 0

    // Animate shell
    const animate = () => {
      shellMesh.position.add(velocity.clone().multiplyScalar(0.016))
      velocity.y -= 9.81 * 0.016
      shellMesh.rotation.x += angularVelocity * 0.016
      shellMesh.rotation.z += angularVelocity * 0.016

      // Simple ground collision
      if (shellMesh.position.y <= 0 && bounces < shell.bounceCount) {
        shellMesh.position.y = 0
        velocity.y *= -0.3
        velocity.x *= 0.8
        velocity.z *= 0.8
        bounces++
      }

      if (shellMesh.position.y < -1 || bounces >= shell.bounceCount) {
        setTimeout(() => {
          this.scene.remove(shellMesh)
        }, 5000)
        return
      }

      requestAnimationFrame(animate)
    }
    animate()
  }

  private createHeatWave(origin: THREE.Vector3, heatWave: any): void {
    if (!heatWave.enabled) return

    // This would create a heat distortion effect
    console.log(`Heat wave effect: intensity ${heatWave.intensity}`)
  }

  private playWeaponSound(weaponId: string, position: THREE.Vector3): void {
    const sound = this.unsuppressedSounds.get(weaponId)
    if (sound) {
      sound.currentTime = 0
      sound.play()
    }
  }

  private handleWeaponJam(weaponId: string): void {
    const state = this.weaponStates.get(weaponId)
    if (!state) return

    state.isFiring = false
    state.jamChance = Math.min(0.1, state.jamChance * 2)

    console.log(`Weapon ${weaponId} jammed!`)
  }

  private autoReload(weaponId: string): void {
    setTimeout(() => {
      this.reloadWeapon(weaponId)
    }, 500)
  }

  public reloadWeapon(weaponId: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const state = this.weaponStates.get(weaponId)
    const stats = weapon ? this.getWeaponStats(weaponId) : null

    if (!weapon || !state || !stats) return false

    if (state.currentAmmo === stats.magazineSize || state.reserveAmmo === 0) return false

    state.isReloading = true
    state.reloadStartTime = this.currentTime

    setTimeout(() => {
      const ammoNeeded = stats.magazineSize - state.currentAmmo
      const ammoToLoad = Math.min(ammoNeeded, state.reserveAmmo)

      state.currentAmmo += ammoToLoad
      state.reserveAmmo -= ammoToLoad
      state.isReloading = false

      // Cleanliness affects reload speed
      state.cleanliness = Math.max(0, state.cleanliness - 2)
    }, stats.reloadTime * 1000)

    return true
  }

  public startAiming(weaponId: string): void {
    const state = this.weaponStates.get(weaponId)
    if (state && !state.isReloading) {
      state.isAiming = true
      state.adsStartTime = this.currentTime
    }
  }

  public stopAiming(weaponId: string): void {
    const state = this.weaponStates.get(weaponId)
    if (state) {
      state.isAiming = false
    }
  }

  public setFireMode(weaponId: string, mode: string): boolean {
    const weapon = this.weapons.get(weaponId)
    const state = this.weaponStates.get(weaponId)
    const stats = weapon ? this.getWeaponStats(weaponId) : null

    if (!weapon || !state || !stats) return false

    if (stats.fireModes.includes(mode as any)) {
      state.fireMode = mode
      return true
    }

    return false
  }

  public getWeaponStats(weaponId: string): WeaponStats | null {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return null

    // This would return the base stats modified by attachments
    return {} as WeaponStats // Placeholder
  }

  public addAttachment(weaponId: string, attachment: WeaponAttachment): boolean {
    const weapon = this.weapons.get(weaponId)
    if (!weapon) return false

    // Check compatibility
    if (!attachment.compatibility.includes(weaponId)) return false

    // Remove existing attachment of same type
    weapon.attachments = weapon.attachments.filter(a => a.type !== attachment.type)

    // Add new attachment
    weapon.attachments.push(attachment)

    // Apply attachment effects
    this.applyAttachmentEffects(weaponId, attachment)

    return true
  }

  private applyAttachmentEffects(weaponId: string, attachment: WeaponAttachment): void {
    // Apply stat modifications
    if (attachment.statsModification) {
      // Modify weapon stats
    }

    if (attachment.ballisticsModification) {
      // Modify ballistic data
    }

    if (attachment.recoilModification) {
      // Modify recoil pattern
    }
  }

  public update(deltaTime: number): void {
    this.deltaTime = deltaTime
    this.currentTime += deltaTime

    // Update environmental effects
    this.updateEnvironmentalEffects()

    // Update active bullet trajectories
    this.updateBulletTrajectories(deltaTime)

    // Update hit markers
    this.updateHitMarkers(deltaTime)

    // Update weapon states
    this.updateWeaponStates(deltaTime)

    // Update active effects
    this.updateActiveEffects(deltaTime)
  }

  private updateEnvironmentalEffects(): void {
    this.updateWindVector()
    this.updateAirDensity()
  }

  private updateBulletTrajectories(deltaTime: number): void {
    this.activeBulletTrajectories = this.activeBulletTrajectories.filter(trajectory => {
      trajectory.timeAlive += deltaTime

      if (trajectory.timeAlive > 5) {
        this.scene.remove(trajectory.bullet)
        return false
      }

      // Update bullet position
      trajectory.position.add(trajectory.velocity.clone().multiplyScalar(deltaTime))

      // Apply forces
      trajectory.velocity.y -= 9.81 * trajectory.data.gravityEffect * deltaTime

      // Update visual
      trajectory.bullet.position.copy(trajectory.position)

      return true
    })
  }

  private updateHitMarkers(deltaTime: number): void {
    this.hitMarkers = this.hitMarkers.filter(marker => {
      marker.time += deltaTime
      return marker.time < 2 // Show for 2 seconds
    })
  }

  private updateWeaponStates(deltaTime: number): void {
    this.weaponStates.forEach((state, weaponId) => {
      // Cool down weapon
      if (state.temperature > 20) {
        state.temperature = Math.max(20, state.temperature - deltaTime * 5)
      }

      // Clean weapon slowly over time
      if (state.cleanliness < 100) {
        state.cleanliness = Math.min(100, state.cleanliness + deltaTime * 0.1)
      }

      // Reduce jam chance over time
      if (state.jamChance > 0.001) {
        state.jamChance = Math.max(0.001, state.jamChance - deltaTime * 0.0001)
      }
    })
  }

  private updateActiveEffects(deltaTime: number): void {
    // Update visual effects
  }

  public getHitMarkers(): HitMarker[] {
    return [...this.hitMarkers]
  }

  public getWeaponState(weaponId: string): WeaponState | null {
    return this.weaponStates.get(weaponId) || null
  }

  public getWeaponConfiguration(weaponId: string): WeaponConfiguration | null {
    return this.weapons.get(weaponId) || null
  }

  public dispose(): void {
    // Clean up all resources
    this.activeBulletTrajectories.forEach(trajectory => {
      this.scene.remove(trajectory.bullet)
    })
    this.activeBulletTrajectories = []

    this.hitMarkers = []
    this.weapons.clear()
    this.weaponStates.clear()
    this.ballistics.clear()
    this.recoilPatterns.clear()
    this.fireEffects.clear()
  }
}

export default GLXYPerfectWeaponSystem