// @ts-nocheck
'use client'

import * as THREE from 'three'

// LEGENDARY SPECIAL ABILITIES COMBO SYSTEM - MAKING IT INSANELY EPIC!
export interface SpecialAbility {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  type: 'offensive' | 'defensive' | 'utility' | 'ultimate'
  cooldown: number
  duration: number
  energyCost: number
  maxCharges: number
  currentCharges: number
  unlockLevel: number
  effects: AbilityEffect[]
  combos: string[]
}

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'crowd_control' | 'environmental'
  value: number
  radius?: number
  duration?: number
  target?: 'self' | 'enemy' | 'ally' | 'area'
  conditions?: string[]
}

export interface AbilityCombo {
  id: string
  name: string
  description: string
  icon: string
  requiredAbilities: string[]
  combinedEffect: AbilityEffect[]
  cooldown: number
  rarity: 'epic' | 'legendary' | 'mythic'
  unlockLevel: number
}

export class GLXYSpecialAbilities {
  private abilities: SpecialAbility[]
  private combos: AbilityCombo[]
  private activeEffects: Array<{
    id: string
    effect: AbilityEffect
    startTime: number
    endTime: number
    source: THREE.Vector3
  }>
  private energy: number
  private maxEnergy: number
  private comboChain: string[]
  private lastComboTime: number
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.energy = 100
    this.maxEnergy = 100
    this.activeEffects = []
    this.comboChain = []
    this.lastComboTime = 0

    this.abilities = [
      // OFFENSIVE ABILITIES
      {
        id: 'arcane_blast',
        name: 'Arcane Blast',
        description: 'Devastating energy explosion that pierces through enemies',
        icon: '⚡',
        rarity: 'epic',
        type: 'offensive',
        cooldown: 8000,
        duration: 1000,
        energyCost: 30,
        maxCharges: 3,
        currentCharges: 3,
        unlockLevel: 1,
        effects: [
          {
            type: 'damage',
            value: 150,
            radius: 8,
            target: 'area'
          },
          {
            type: 'crowd_control',
            value: 2,
            duration: 3000,
            target: 'enemy'
          }
        ],
        combos: ['time_warp', 'chain_lightning']
      },
      {
        id: 'shadow_strike',
        name: 'Shadow Strike',
        description: 'Teleport behind enemy and perform deadly assassination',
        icon: '🗡️',
        rarity: 'legendary',
        type: 'offensive',
        cooldown: 12000,
        duration: 1500,
        energyCost: 50,
        maxCharges: 2,
        currentCharges: 2,
        unlockLevel: 5,
        effects: [
          {
            type: 'damage',
            value: 300,
            target: 'enemy'
          },
          {
            type: 'buff',
            value: 2,
            duration: 5000,
            target: 'self'
          }
        ],
        combos: ['bloodlust', 'vanish']
      },
      {
        id: 'meteor_shower',
        name: 'Meteor Shower',
        description: 'Call down devastating meteors from the sky',
        icon: '☄️',
        rarity: 'mythic',
        type: 'offensive',
        cooldown: 20000,
        duration: 8000,
        energyCost: 80,
        maxCharges: 1,
        currentCharges: 1,
        unlockLevel: 10,
        effects: [
          {
            type: 'damage',
            value: 500,
            radius: 15,
            target: 'area'
          },
          {
            type: 'environmental',
            value: 1,
            duration: 10000,
            target: 'area'
          }
        ],
        combos: ['earthquake', 'storm_call']
      },

      // DEFENSIVE ABILITIES
      {
        id: 'divine_shield',
        name: 'Divine Shield',
        description: 'Invincible barrier that reflects incoming damage',
        icon: '🛡️',
        rarity: 'epic',
        type: 'defensive',
        cooldown: 15000,
        duration: 5000,
        energyCost: 40,
        maxCharges: 2,
        currentCharges: 2,
        unlockLevel: 3,
        effects: [
          {
            type: 'buff',
            value: 100,
            duration: 5000,
            target: 'self'
          }
        ],
        combos: ['healing_aura', 'time_freeze']
      },
      {
        id: 'phoenix_rise',
        name: 'Phoenix Rise',
        description: 'Resurrect with full health and temporary invincibility',
        icon: '🔥',
        rarity: 'legendary',
        type: 'defensive',
        cooldown: 30000,
        duration: 3000,
        energyCost: 60,
        maxCharges: 1,
        currentCharges: 1,
        unlockLevel: 8,
        effects: [
          {
            type: 'heal',
            value: 999,
            target: 'self'
          },
          {
            type: 'buff',
            value: 50,
            duration: 3000,
            target: 'self'
          }
        ],
        combos: ['divine_shield', 'rebirth']
      },

      // UTILITY ABILITIES
      {
        id: 'time_warp',
        name: 'Time Warp',
        description: 'Slow down time for everyone except yourself',
        icon: '⏰',
        rarity: 'legendary',
        type: 'utility',
        cooldown: 18000,
        duration: 4000,
        energyCost: 45,
        maxCharges: 1,
        currentCharges: 1,
        unlockLevel: 6,
        effects: [
          {
            type: 'buff',
            value: 3,
            duration: 4000,
            target: 'self'
          },
          {
            type: 'debuff',
            value: 0.3,
            duration: 4000,
            target: 'enemy'
          }
        ],
        combos: ['shadow_strike', 'lightning_speed']
      },
      {
        id: 'gravity_well',
        name: 'Gravity Well',
        description: 'Create gravity field that pulls and damages enemies',
        icon: '🌀',
        rarity: 'epic',
        type: 'utility',
        cooldown: 10000,
        duration: 6000,
        energyCost: 35,
        maxCharges: 2,
        currentCharges: 2,
        unlockLevel: 4,
        effects: [
          {
            type: 'crowd_control',
            value: 1,
            duration: 6000,
            radius: 10,
            target: 'area'
          },
          {
            type: 'damage',
            value: 25,
            duration: 6000,
            radius: 10,
            target: 'area'
          }
        ],
        combos: ['meteor_shower', 'black_hole']
      },

      // ULTIMATE ABILITIES
      {
        id: 'god_mode',
        name: 'GOD MODE',
        description: 'Become invincible with unlimited abilities and enhanced damage',
        icon: '👑',
        rarity: 'mythic',
        type: 'ultimate',
        cooldown: 60000,
        duration: 10000,
        energyCost: 100,
        maxCharges: 1,
        currentCharges: 1,
        unlockLevel: 15,
        effects: [
          {
            type: 'buff',
            value: 1000,
            duration: 10000,
            target: 'self'
          },
          {
            type: 'damage',
            value: 500,
            duration: 10000,
            target: 'enemy'
          }
        ],
        combos: []
      }
    ]

    this.combos = [
      {
        id: 'elemental_storm',
        name: 'Elemental Storm',
        description: 'Combine meteor shower and lightning for devastating effect',
        icon: '🌪️',
        requiredAbilities: ['meteor_shower', 'chain_lightning'],
        combinedEffect: [
          {
            type: 'damage',
            value: 1000,
            radius: 25,
            target: 'area'
          },
          {
            type: 'environmental',
            value: 2,
            duration: 15000,
            target: 'area'
          }
        ],
        cooldown: 25000,
        rarity: 'mythic',
        unlockLevel: 12
      },
      {
        id: 'chrono_immortality',
        name: 'Chrono Immortality',
        description: 'Combine time control with resurrection for god-like power',
        icon: '⏳',
        requiredAbilities: ['time_warp', 'phoenix_rise'],
        combinedEffect: [
          {
            type: 'heal',
            value: 999,
            target: 'self'
          },
          {
            type: 'buff',
            value: 5,
            duration: 15000,
            target: 'self'
          }
        ],
        cooldown: 45000,
        rarity: 'legendary',
        unlockLevel: 10
      },
      {
        id: 'void_annihilation',
        name: 'Void Annihilation',
        description: 'Ultimate destruction combo that erases everything',
        icon: '🕳️',
        requiredAbilities: ['black_hole', 'meteor_shower'],
        combinedEffect: [
          {
            type: 'damage',
            value: 2000,
            radius: 30,
            target: 'area'
          },
          {
            type: 'crowd_control',
            value: 5,
            duration: 10000,
            target: 'area'
          }
        ],
        cooldown: 30000,
        rarity: 'mythic',
        unlockLevel: 15
      }
    ]
  }

  // Execute special ability
  executeAbility(abilityId: string, targetPosition?: THREE.Vector3): boolean {
    const ability = this.abilities.find(a => a.id === abilityId)
    if (!ability || ability.currentCharges <= 0) {
      return false
    }

    // Check energy cost
    if (this.energy < ability.energyCost) {
      return false
    }

    // Check cooldown
    if (this.isOnCooldown(abilityId)) {
      return false
    }

    // Execute ability
    this.performAbility(ability, targetPosition)

    // Consume resources
    ability.currentCharges--
    this.energy -= ability.energyCost

    // Add to combo chain
    this.addToComboChain(abilityId)

    // Check for combo completion
    this.checkForCombos()

    return true
  }

  private performAbility(ability: SpecialAbility, targetPosition?: THREE.Vector3): void {
    // Create visual effects based on ability type
    switch (ability.id) {
      case 'arcane_blast':
        this.createArcaneBlast(targetPosition || new THREE.Vector3())
        break
      case 'shadow_strike':
        this.createShadowStrike(targetPosition || new THREE.Vector3())
        break
      case 'meteor_shower':
        this.createMeteorShower(targetPosition || new THREE.Vector3())
        break
      case 'divine_shield':
        this.createDivineShield()
        break
      case 'phoenix_rise':
        this.createPhoenixRise()
        break
      case 'time_warp':
        this.createTimeWarp()
        break
      case 'gravity_well':
        this.createGravityWell(targetPosition || new THREE.Vector3())
        break
      case 'god_mode':
        this.createGodMode()
        break
    }

    // Apply effects
    ability.effects.forEach(effect => {
      this.applyEffect(effect, targetPosition)
    })

    // Start cooldown
    this.startCooldown(ability.id)
  }

  // Visual Effects
  private createArcaneBlast(position: THREE.Vector3): void {
    // Create massive energy explosion
    const blastGeometry = new THREE.SphereGeometry(0.1)
    const blastMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2
    })

    for (let i = 0; i < 50; i++) {
      const blast = new THREE.Mesh(blastGeometry, blastMaterial)
      blast.position.copy(position)

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      )

      this.scene.add(blast)

      // Animate expansion
      const animate = () => {
        blast.position.add(velocity.clone().multiplyScalar(0.1))
        blast.scale.multiplyScalar(1.1)
        blast.material.opacity -= 0.02

        if (blast.material.opacity > 0) {
          requestAnimationFrame(animate)
        } else {
          this.scene.remove(blast)
        }
      }

      animate()
    }

    // Create shockwave
    this.createShockwave(position, 15)
  }

  private createShadowStrike(targetPosition: THREE.Vector3): void {
    // Create shadow teleport effect
    const shadowGeometry = new THREE.PlaneGeometry(2, 4)
    const shadowMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8
    })

    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.position.copy(targetPosition)
    shadow.position.y += 0.01
    this.scene.add(shadow)

    // Fade out effect
    setTimeout(() => {
      this.scene.remove(shadow)
    }, 2000)
  }

  private createMeteorShower(targetPosition: THREE.Vector3): void {
    // Create multiple meteors falling from sky
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const meteorGeometry = new THREE.SphereGeometry(1)
        const meteorMaterial = new THREE.MeshStandardMaterial({
          color: 0xff4500,
          emissive: 0xff4500,
          emissiveIntensity: 1
        })

        const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial)
        meteor.position.set(
          targetPosition.x + (Math.random() - 0.5) * 20,
          targetPosition.y + 50,
          targetPosition.z + (Math.random() - 0.5) * 20
        )

        this.scene.add(meteor)

        // Animate falling
        const fallSpeed = 10
        const animate = () => {
          meteor.position.y -= fallSpeed * 0.1

          // Add trail effect
          if (Math.random() < 0.3) {
            this.createMeteorTrail(meteor.position)
          }

          if (meteor.position.y > targetPosition.y) {
            requestAnimationFrame(animate)
          } else {
            // Impact explosion
            this.createExplosion(meteor.position, 8)
            this.scene.remove(meteor)
          }
        }

        animate()
      }, i * 500)
    }
  }

  private createDivineShield(): void {
    // Create golden protective barrier
    const shieldGeometry = new THREE.SphereGeometry(3, 32, 32)
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })

    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial)
    this.scene.add(shield)

    // Pulsing effect
    let scale = 1
    const pulse = () => {
      scale += 0.02
      shield.scale.setScalar(scale)

      if (scale < 1.2) {
        setTimeout(pulse, 50)
      } else {
        scale = 1
        setTimeout(pulse, 100)
      }
    }

    pulse()

    setTimeout(() => {
      this.scene.remove(shield)
    }, 5000)
  }

  private createPhoenixRise(): void {
    // Create phoenix rebirth effect
    for (let i = 0; i < 100; i++) {
      const featherGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.05)
      const featherMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.8),
        transparent: true,
        opacity: 0.9
      })

      const feather = new THREE.Mesh(featherGeometry, featherMaterial)
      feather.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 5,
        (Math.random() - 0.5) * 10
      )

      // Random rotation
      feather.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      this.scene.add(feather)

      // Animate floating up
      const animate = () => {
        feather.position.y += 0.1
        feather.rotation.x += 0.05
        feather.rotation.y += 0.05
        feather.material.opacity -= 0.005

        if (feather.material.opacity > 0) {
          requestAnimationFrame(animate)
        } else {
          this.scene.remove(feather)
        }
      }

      animate()
    }

    // Create central fire pillar
    this.createFirePillar(new THREE.Vector3(0, 0, 0))
  }

  private createTimeWarp(): void {
    // Create time distortion effect
    const warpGeometry = new THREE.SphereGeometry(20, 32, 32)
    const warpMaterial = new THREE.MeshStandardMaterial({
      color: 0x9400d3,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    })

    const warp = new THREE.Mesh(warpGeometry, warpMaterial)
    this.scene.add(warp)

    // Spinning effect
    let rotation = 0
    const spin = () => {
      rotation += 0.05
      warp.rotation.y = rotation
      warp.rotation.x = rotation * 0.5

      if (rotation < Math.PI * 2) {
        requestAnimationFrame(spin)
      } else {
        this.scene.remove(warp)
      }
    }

    spin()
  }

  private createGravityWell(position: THREE.Vector3): void {
    // Create black hole effect
    const blackHoleGeometry = new THREE.SphereGeometry(2, 32, 32)
    const blackHoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x4b0082,
      emissiveIntensity: 1
    })

    const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial)
    blackHole.position.copy(position)
    this.scene.add(blackHole)

    // Create swirling particles
    for (let i = 0; i < 30; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.2)
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0x9400d3,
        emissive: 0x9400d3,
        emissiveIntensity: 0.5
      })

      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      const angle = (i / 30) * Math.PI * 2
      const distance = 5 + Math.random() * 5

      particle.position.set(
        position.x + Math.cos(angle) * distance,
        position.y + Math.random() * 3,
        position.z + Math.sin(angle) * distance
      )

      this.scene.add(particle)

      // Spiral into black hole
      const spiral = () => {
        const currentDistance = particle.position.distanceTo(position)
        if (currentDistance > 0.5) {
          const direction = new THREE.Vector3().subVectors(position, particle.position).normalize()
          particle.position.add(direction.multiplyScalar(0.2))
          particle.position.y += Math.sin(Date.now() * 0.01 + i) * 0.1

          requestAnimationFrame(spiral)
        } else {
          this.scene.remove(particle)
        }
      }

      spiral()
    }

    setTimeout(() => {
      this.scene.remove(blackHole)
    }, 6000)
  }

  private createGodMode(): void {
    // Create divine aura effect
    const auraGeometry = new THREE.SphereGeometry(5, 32, 32)
    const auraMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    })

    const aura = new THREE.Mesh(auraGeometry, auraMaterial)
    this.scene.add(aura)

    // Golden rays
    for (let i = 0; i < 12; i++) {
      const rayGeometry = new THREE.BoxGeometry(0.5, 20, 0.5)
      const rayMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 1
      })

      const ray = new THREE.Mesh(rayGeometry, rayMaterial)
      const angle = (i / 12) * Math.PI * 2
      ray.position.set(
        Math.cos(angle) * 8,
        10,
        Math.sin(angle) * 8
      )
      ray.lookAt(0, 0, 0)

      this.scene.add(ray)
    }

    setTimeout(() => {
      this.scene.remove(aura)
      // Remove rays
      this.scene.children.filter(child => (child as THREE.Mesh).geometry?.type === 'BoxGeometry').forEach(ray => {
        this.scene.remove(ray)
      })
    }, 10000)
  }

  // Helper effects
  private createShockwave(position: THREE.Vector3, radius: number): void {
    const shockwaveGeometry = new THREE.RingGeometry(0.1, radius, 32)
    const shockwaveMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })

    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial)
    shockwave.position.copy(position)
    shockwave.rotation.x = -Math.PI / 2

    this.scene.add(shockwave)

    // Expand and fade
    let scale = 1
    const expand = () => {
      scale += 0.2
      shockwave.scale.setScalar(scale)
      shockwave.material.opacity -= 0.05

      if (shockwave.material.opacity > 0) {
        requestAnimationFrame(expand)
      } else {
        this.scene.remove(shockwave)
      }
    }

    expand()
  }

  private createExplosion(position: THREE.Vector3, intensity: number): void {
    // Similar to particle effects but more intense
    for (let i = 0; i < intensity * 5; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.2)
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.8),
        emissive: 0xff6600,
        emissiveIntensity: 1
      })

      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.copy(position)

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
      )

      this.scene.add(particle)

      const animate = () => {
        particle.position.add(velocity.clone().multiplyScalar(0.1))
        velocity.y -= 0.3 // Gravity
        particle.material.opacity -= 0.02

        if (particle.material.opacity > 0) {
          requestAnimationFrame(animate)
        } else {
          this.scene.remove(particle)
        }
      }

      animate()
    }
  }

  private createMeteorTrail(position: THREE.Vector3): void {
    const trailGeometry = new THREE.SphereGeometry(0.3)
    const trailMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff4500,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6
    })

    const trail = new THREE.Mesh(trailGeometry, trailMaterial)
    trail.position.copy(position)
    this.scene.add(trail)

    setTimeout(() => {
      this.scene.remove(trail)
    }, 500)
  }

  private createFirePillar(position: THREE.Vector3): void {
    // Create column of fire
    for (let i = 0; i < 20; i++) {
      const fireGeometry = new THREE.SphereGeometry(0.5)
      const fireMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.9),
        emissive: 0xff4500,
        emissiveIntensity: 1
      })

      const fire = new THREE.Mesh(fireGeometry, fireMaterial)
      fire.position.set(
        position.x + (Math.random() - 0.5) * 2,
        i * 0.5,
        position.z + (Math.random() - 0.5) * 2
      )

      this.scene.add(fire)

      setTimeout(() => {
        this.scene.remove(fire)
      }, 2000 + Math.random() * 1000)
    }
  }

  // System methods
  private applyEffect(effect: AbilityEffect, targetPosition?: THREE.Vector3): void {
    // Add effect to active effects
    this.activeEffects.push({
      id: `effect_${Date.now()}_${Math.random()}`,
      effect,
      startTime: Date.now(),
      endTime: Date.now() + (effect.duration || 5000),
      source: targetPosition || new THREE.Vector3()
    })
  }

  private addToComboChain(abilityId: string): void {
    const now = Date.now()

    // Reset chain if too much time has passed
    if (now - this.lastComboTime > 3000) {
      this.comboChain = []
    }

    this.comboChain.push(abilityId)
    this.lastComboTime = now

    // Keep chain to reasonable length
    if (this.comboChain.length > 5) {
      this.comboChain.shift()
    }
  }

  private checkForCombos(): void {
    this.combos.forEach(combo => {
      const hasAllAbilities = combo.requiredAbilities.every(abilityId =>
        this.comboChain.includes(abilityId)
      )

      if (hasAllAbilities) {
        this.executeCombo(combo)
        this.comboChain = [] // Reset chain after combo
      }
    })
  }

  private executeCombo(combo: AbilityCombo): void {
    console.log(`🔥 COMBO EXECUTED: ${combo.name}!`)

    // Create combo visual effect
    this.createComboEffect(combo)

    // Apply combined effects
    combo.combinedEffect.forEach(effect => {
      this.applyEffect(effect)
    })

    // Start combo cooldown
    this.startComboCooldown(combo.id)
  }

  private createComboEffect(combo: AbilityCombo): void {
    // Create epic visual indication of combo
    const comboGeometry = new THREE.RingGeometry(0.1, 10, 64)
    const comboMaterial = new THREE.MeshStandardMaterial({
      color: combo.rarity === 'mythic' ? 0xff00ff : combo.rarity === 'legendary' ? 0xffd700 : 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })

    const comboRing = new THREE.Mesh(comboGeometry, comboMaterial)
    comboRing.position.set(0, 2, 0)
    comboRing.rotation.x = -Math.PI / 2
    this.scene.add(comboRing)

    // Expand and fade
    let scale = 0.1
    const expand = () => {
      scale += 0.3
      comboRing.scale.setScalar(scale)
      comboRing.material.opacity -= 0.02

      if (comboRing.material.opacity > 0) {
        requestAnimationFrame(expand)
      } else {
        this.scene.remove(comboRing)
      }
    }

    expand()
  }

  private cooldowns: { [key: string]: number } = {}

  private startCooldown(abilityId: string): void {
    const ability = this.abilities.find(a => a.id === abilityId)
    if (ability) {
      this.cooldowns[abilityId] = Date.now() + ability.cooldown
    }
  }

  private startComboCooldown(comboId: string): void {
    const combo = this.combos.find(c => c.id === comboId)
    if (combo) {
      this.cooldowns[comboId] = Date.now() + combo.cooldown
    }
  }

  private isOnCooldown(abilityId: string): boolean {
    const cooldown = this.cooldowns[abilityId]
    return cooldown ? Date.now() < cooldown : false
  }

  // Update system
  update(deltaTime: number): void {
    // Regenerate energy
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + deltaTime * 5)
    }

    // Update active effects
    const now = Date.now()
    this.activeEffects = this.activeEffects.filter(effect => {
      return now < effect.endTime
    })

    // Regenerate ability charges
    this.abilities.forEach(ability => {
      if (ability.currentCharges < ability.maxCharges) {
        // Regenerate charge based on cooldown
        const lastUsed = this.cooldowns[ability.id]
        if (lastUsed && Date.now() - lastUsed > ability.cooldown * 2) {
          ability.currentCharges = Math.min(ability.maxCharges, ability.currentCharges + 1)
          delete this.cooldowns[ability.id]
        }
      }
    })
  }

  // Get system state
  getEnergy(): number {
    return this.energy
  }

  getAbilities(): SpecialAbility[] {
    return this.abilities
  }

  getCombos(): AbilityCombo[] {
    return this.combos
  }

  getActiveEffects(): Array<any> {
    return this.activeEffects
  }

  getComboChain(): string[] {
    return [...this.comboChain]
  }
}

export default GLXYSpecialAbilities