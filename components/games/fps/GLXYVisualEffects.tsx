// @ts-nocheck
'use client'

import * as THREE from 'three'

// WAHNSINNIG VISUAL EFFECTS SYSTEM - CINEMATIC PERFECTION!
export interface VisualEffect {
  id: string
  name: string
  type: 'particle' | 'post_process' | 'environmental' | 'weapon' | 'ability' | 'impact'
  priority: number
  duration: number
  intensity: number
  color: THREE.Color
}

export interface ParticleSystem {
  id?: string
  name: string
  maxParticles: number
  particleCount: number
  particles: Particle[]
  emitter: ParticleEmitter
  updateFunction: (deltaTime: number) => void
}

export interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: THREE.Color
  opacity: number
  rotationSpeed: THREE.Vector3
  scaleSpeed: number
  trail: THREE.Line[]
}

export interface ParticleEmitter {
  position: THREE.Vector3
  velocity: THREE.Vector3
  spread: THREE.Vector3
  rate: number
  lifeTime: number
  isActive: boolean
}

export class GLXYVisualEffects {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private particleSystems: Map<string, ParticleSystem> = new Map()
  private activeEffects: Map<string, VisualEffect> = new Map()
  private postProcessing: PostProcessingEffects
  private environmentalEffects: EnvironmentalEffects
  private impactEffects: ImpactEffects

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene
    this.camera = camera
    this.postProcessing = new PostProcessingEffects(camera)
    this.environmentalEffects = new EnvironmentalEffects(scene)
    this.impactEffects = new ImpactEffects(scene)

    this.initializeDefaultEffects()
  }

  private setMaterialOpacity(mesh: THREE.Mesh, opacity: number): void {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => {
        if ('opacity' in mat) {
          mat.opacity = opacity
        }
      })
    } else if ('opacity' in mesh.material) {
      mesh.material.opacity = opacity
    }
  }

  private setMaterialEmissiveIntensity(mesh: THREE.Mesh, intensity: number): void {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => {
        if ('emissiveIntensity' in mat) {
          mat.emissiveIntensity = intensity
        }
      })
    } else if ('emissiveIntensity' in mesh.material) {
      mesh.material.emissiveIntensity = intensity
    }
  }

  private getMaterialColor(mesh: THREE.Mesh): THREE.Color {
    if (Array.isArray(mesh.material)) {
      const material = mesh.material[0]
      if ('color' in material) {
        return material.color as THREE.Color
      } else {
        const color = new THREE.Color()
        color.setHex(0xffffff)
        return color
      }
    } else {
      if ('color' in mesh.material) {
        return mesh.material.color as THREE.Color
      } else {
        const color = new THREE.Color()
        color.setHex(0xffffff)
        return color
      }
    }
  }

  private initializeDefaultEffects(): void {
    // BLOOD SPLATTER
    this.createParticleSystem('blood_splatter', {
      name: 'Blood Splatter',
      maxParticles: 100,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.5, 0.5, 0.5),
        rate: 20,
        lifeTime: 2000,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateBloodSplatter(deltaTime)
    })

    // MUZZLE FLASH
    this.createParticleSystem('muzzle_flash', {
      name: 'Muzzle Flash',
      maxParticles: 10,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.1, 0.1, 0.1),
        rate: 5,
        lifeTime: 100,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateMuzzleFlash(deltaTime)
    })

    // EXPLOSION
    this.createParticleSystem('explosion', {
      name: 'Explosion',
      maxParticles: 200,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(1, 1, 1),
        rate: 50,
        lifeTime: 3000,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateExplosion(deltaTime)
    })

    // SPARKS
    this.createParticleSystem('sparks', {
      name: 'Metal Sparks',
      maxParticles: 50,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.3, 0.3, 0.3),
        rate: 15,
        lifeTime: 1500,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateSparks(deltaTime)
    })

    // ENERGY BLAST
    this.createParticleSystem('energy_blast', {
      name: 'Energy Blast',
      maxParticles: 150,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.8, 0.8, 0.8),
        rate: 30,
        lifeTime: 2500,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateEnergyBlast(deltaTime)
    })

    // SMOKE
    this.createParticleSystem('smoke', {
      name: 'Smoke',
      maxParticles: 80,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.4, 0.2, 0.4),
        rate: 10,
        lifeTime: 5000,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateSmoke(deltaTime)
    })

    // FIRE
    this.createParticleSystem('fire', {
      name: 'Fire',
      maxParticles: 60,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.3, 0.6, 0.3),
        rate: 20,
        lifeTime: 2000,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateFire(deltaTime)
    })

    // ICE CRYSTALS
    this.createParticleSystem('ice_crystals', {
      name: 'Ice Crystals',
      maxParticles: 40,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.5, 0.2, 0.5),
        rate: 12,
        lifeTime: 3000,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateIceCrystals(deltaTime)
    })

    // ELECTRICITY
    this.createParticleSystem('electricity', {
      name: 'Electricity Arcs',
      maxParticles: 30,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.2, 0.2, 0.2),
        rate: 8,
        lifeTime: 1000,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateElectricity(deltaTime)
    })

    // HEALING PARTICLES
    this.createParticleSystem('healing', {
      name: 'Healing Particles',
      maxParticles: 50,
      particleCount: 0,
      particles: [],
      emitter: {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spread: new THREE.Vector3(0.6, 0.6, 0.6),
        rate: 15,
        lifeTime: 2000,
        isActive: false
      },
      updateFunction: (deltaTime) => this.updateHealing(deltaTime)
    })
  }

  private createParticleSystem(id: string, config: ParticleSystem): void {
    this.particleSystems.set(id, config)
  }

  // EFFECT TRIGGERS
  triggerBloodSplatter(position: THREE.Vector3, intensity: number = 1): void {
    const system = this.particleSystems.get('blood_splatter')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true
    system.emitter.rate = 20 * intensity

    for (let i = 0; i < 10 * intensity; i++) {
      this.createBloodParticle(system, position)
    }

    setTimeout(() => {
      system.emitter.isActive = false
    }, 500)
  }

  triggerMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3): void {
    const system = this.particleSystems.get('muzzle_flash')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.velocity = direction.clone().multiplyScalar(2)
    system.emitter.isActive = true

    // Create flash
    this.createFlashParticle(position, direction)

    setTimeout(() => {
      system.emitter.isActive = false
    }, 100)
  }

  triggerExplosion(position: THREE.Vector3, intensity: number = 1): void {
    const system = this.particleSystems.get('explosion')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true
    system.emitter.rate = 50 * intensity

    // Create explosion particles
    for (let i = 0; i < 50 * intensity; i++) {
      this.createExplosionParticle(system, position)
    }

    // Create shockwave
    this.createShockwave(position, 5 * intensity)

    // Screen shake
    this.screenShake(0.5 * intensity, 500)

    setTimeout(() => {
      system.emitter.isActive = false
    }, 1000)
  }

  triggerSparks(position: THREE.Vector3, count: number = 20): void {
    const system = this.particleSystems.get('sparks')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true

    for (let i = 0; i < count; i++) {
      this.createSparkParticle(system, position)
    }

    setTimeout(() => {
      system.emitter.isActive = false
    }, 200)
  }

  triggerEnergyBlast(position: THREE.Vector3, radius: number = 3): void {
    const system = this.particleSystems.get('energy_blast')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true

    // Create energy particles
    for (let i = 0; i < 30; i++) {
      this.createEnergyParticle(system, position, radius)
    }

    // Energy ring effect
    this.createEnergyRing(position, radius)

    setTimeout(() => {
      system.emitter.isActive = false
    }, 800)
  }

  triggerSmoke(position: THREE.Vector3, duration: number = 3000): void {
    const system = this.particleSystems.get('smoke')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true

    const endTime = Date.now() + duration

    const interval = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(interval)
        system.emitter.isActive = false
        return
      }
      this.createSmokeParticle(system, position)
    }, 200)
  }

  triggerFire(position: THREE.Vector3, intensity: number = 1): void {
    const system = this.particleSystems.get('fire')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true
    system.emitter.rate = 20 * intensity

    const endTime = Date.now() + 3000 * intensity

    const interval = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(interval)
        system.emitter.isActive = false
        return
      }
      this.createFireParticle(system, position)
    }, 150)
  }

  triggerIceEffect(position: THREE.Vector3, radius: number = 2): void {
    const system = this.particleSystems.get('ice_crystals')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true

    // Create ice crystals
    for (let i = 0; i < 20; i++) {
      this.createIceParticle(system, position, radius)
    }

    // Ice ground effect
    this.createIceGround(position, radius)

    setTimeout(() => {
      system.emitter.isActive = false
    }, 2000)
  }

  triggerElectricEffect(startPos: THREE.Vector3, endPos: THREE.Vector3): void {
    const system = this.particleSystems.get('electricity')
    if (!system) return

    // Create lightning bolt
    this.createLightningBolt(startPos, endPos)

    // Electric particles along bolt
    const segments = 10
    for (let i = 0; i < segments; i++) {
      const t = i / segments
      const position = new THREE.Vector3().lerpVectors(startPos, endPos, t)
      this.createElectricParticle(system, position)
    }

    setTimeout(() => {
      system.emitter.isActive = false
    }, 500)
  }

  triggerHealingEffect(position: THREE.Vector3, amount: number = 50): void {
    const system = this.particleSystems.get('healing')
    if (!system) return

    system.emitter.position.copy(position)
    system.emitter.isActive = true

    // Create healing particles
    for (let i = 0; i < amount; i++) {
      this.createHealingParticle(system, position)
    }

    setTimeout(() => {
      system.emitter.isActive = false
    }, 1000)
  }

  // PARTICLE CREATION METHODS
  private createBloodParticle(system: ParticleSystem, position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      transparent: true,
      opacity: 0.9
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      Math.random() * 8,
      (Math.random() - 0.5) * 10
    )

    const bloodParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, -15, 0),
      life: 2 + Math.random(),
      maxLife: 2 + Math.random(),
      size: 0.05 + Math.random() * 0.1,
      color: new THREE.Color(0x8b0000),
      opacity: 0.9,
      rotationSpeed: new THREE.Vector3(
        Math.random() * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.1
      ),
      scaleSpeed: 0.02,
      trail: []
    }

    system.particles.push(bloodParticle)
    this.scene.add(particle)
  }

  private createFlashParticle(position: THREE.Vector3, direction: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.3)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const flashParticle: Particle = {
      mesh: particle,
      velocity: direction.clone().multiplyScalar(5),
      acceleration: new THREE.Vector3(0, 0, 0),
      life: 0.1,
      maxLife: 0.1,
      size: 0.3,
      color: new THREE.Color(0xffffff),
      opacity: 1,
      rotationSpeed: new THREE.Vector3(0, 0, 0),
      scaleSpeed: 0.5,
      trail: []
    }

    // Create a temporary particle system for this
    const tempSystem: ParticleSystem = {
      ...this.particleSystems.get('muzzle_flash')!,
      particles: [flashParticle]
    }

    setTimeout(() => {
      this.scene.remove(particle)
    }, 100)
  }

  private createExplosionParticle(system: ParticleSystem, position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.3)
    const hue = 0.05 + Math.random() * 0.15
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 1, 0.8),
      emissive: new THREE.Color().setHSL(hue, 1, 0.3),
      emissiveIntensity: 1
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 15,
      Math.random() * 12,
      (Math.random() - 0.5) * 15
    )

    const explosionParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, -8, 0),
      life: 3 + Math.random() * 2,
      maxLife: 3 + Math.random() * 2,
      size: 0.1 + Math.random() * 0.3,
      color: this.getMaterialColor(particle),
      opacity: 1,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ),
      scaleSpeed: 0.1,
      trail: []
    }

    system.particles.push(explosionParticle)
    this.scene.add(particle)
  }

  private createSparkParticle(system: ParticleSystem, position: THREE.Vector3): void {
    const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.02)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 1
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      Math.random() * 6,
      (Math.random() - 0.5) * 8
    )

    const sparkParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, -20, 0),
      life: 1.5,
      maxLife: 1.5,
      size: 0.02,
      color: this.getMaterialColor(particle),
      opacity: 1,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ),
      scaleSpeed: -0.05,
      trail: []
    }

    system.particles.push(sparkParticle)
    this.scene.add(particle)
  }

  private createEnergyParticle(system: ParticleSystem, position: THREE.Vector3, radius: number): void {
    const geometry = new THREE.OctahedronGeometry(0.2)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * radius
    const height = Math.random() * 2

    particle.position.x += Math.cos(angle) * distance
    particle.position.y += height
    particle.position.z += Math.sin(angle) * distance

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      Math.random() * 3,
      (Math.random() - 0.5) * 5
    )

    const energyParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, -2, 0),
      life: 2.5,
      maxLife: 2.5,
      size: 0.2,
      color: this.getMaterialColor(particle),
      opacity: 0.8,
      rotationSpeed: new THREE.Vector3(0.05, 0.05, 0.05),
      scaleSpeed: 0,
      trail: []
    }

    system.particles.push(energyParticle)
    this.scene.add(particle)
  }

  private createSmokeParticle(system: ParticleSystem, position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.2)
    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.6
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)
    particle.position.y += Math.random() * 0.5

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      1 + Math.random() * 2,
      (Math.random() - 0.5) * 2
    )

    const smokeParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, 0.1, 0),
      life: 5,
      maxLife: 5,
      size: 0.2,
      color: this.getMaterialColor(particle),
      opacity: 0.6,
      rotationSpeed: new THREE.Vector3(0.01, 0.01, 0.01),
      scaleSpeed: 0.02,
      trail: []
    }

    system.particles.push(smokeParticle)
    this.scene.add(particle)
  }

  private createFireParticle(system: ParticleSystem, position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.15)
    const hue = 0.05 + Math.random() * 0.1
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 1, 0.9),
      emissive: new THREE.Color().setHSL(hue, 1, 0.5),
      emissiveIntensity: 1
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)
    particle.position.y += Math.random() * 0.5

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      2 + Math.random() * 3,
      (Math.random() - 0.5) * 3
    )

    const fireParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, -0.5, 0),
      life: 2,
      maxLife: 2,
      size: 0.15,
      color: this.getMaterialColor(particle),
      opacity: 0.9,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ),
      scaleSpeed: 0.05,
      trail: []
    }

    system.particles.push(fireParticle)
    this.scene.add(particle)
  }

  private createIceParticle(system: ParticleSystem, position: THREE.Vector3, radius: number): void {
    const geometry = new THREE.OctahedronGeometry(0.1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      emissive: 0x87ceeb,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
      metalness: 0.9,
      roughness: 0.1
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * radius

    particle.position.x += Math.cos(angle) * distance
    particle.position.y += Math.random() * 1
    particle.position.z += Math.sin(angle) * distance

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      Math.random() * 2,
      (Math.random() - 0.5) * 3
    )

    const iceParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, -1, 0),
      life: 3,
      maxLife: 3,
      size: 0.1,
      color: this.getMaterialColor(particle),
      opacity: 0.9,
      rotationSpeed: new THREE.Vector3(0.05, 0.05, 0.05),
      scaleSpeed: -0.01,
      trail: []
    }

    system.particles.push(iceParticle)
    this.scene.add(particle)
  }

  private createElectricParticle(system: ParticleSystem, position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.05)
    const material = new THREE.MeshStandardMaterial({
      color: 0x9966ff,
      emissive: 0x9966ff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    )

    const electricParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, 0, 0),
      life: 1,
      maxLife: 1,
      size: 0.05,
      color: this.getMaterialColor(particle),
      opacity: 0.8,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      scaleSpeed: 0,
      trail: []
    }

    system.particles.push(electricParticle)
    this.scene.add(particle)
  }

  private createHealingParticle(system: ParticleSystem, position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8
    })

    const particle = new THREE.Mesh(geometry, material)
    particle.position.copy(position)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      2 + Math.random() * 3,
      (Math.random() - 0.5) * 4
    )

    const healingParticle: Particle = {
      mesh: particle,
      velocity,
      acceleration: new THREE.Vector3(0, 1, 0),
      life: 2,
      maxLife: 2,
      size: 0.1,
      color: this.getMaterialColor(particle),
      opacity: 0.8,
      rotationSpeed: new THREE.Vector3(0.02, 0.02, 0.02),
      scaleSpeed: -0.02,
      trail: []
    }

    system.particles.push(healingParticle)
    this.scene.add(particle)
  }

  // UPDATE METHODS
  private updateBloodSplatter(deltaTime: number): void {
    const system = this.particleSystems.get('blood_splatter')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime

      // Blood sticks to surfaces
      if (particle.mesh.position.y <= 0.5) {
        particle.velocity.set(0, 0, 0)
        particle.acceleration.set(0, 0, 0)
        particle.size *= 0.95
      }

      particle.mesh.scale.setScalar(particle.size)
      this.setMaterialOpacity(particle.mesh, (particle.life / particle.maxLife) * 0.8)

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateMuzzleFlash(deltaTime: number): void {
    const system = this.particleSystems.get('muzzle_flash')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime
      this.setMaterialOpacity(particle.mesh, particle.life / particle.maxLife)

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateExplosion(deltaTime: number): void {
    const system = this.particleSystems.get('explosion')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime

      // Explosions grow as they fade
      const scale = 1 + (1 - particle.life / particle.maxLife) * 3
      particle.mesh.scale.setScalar(scale)
      this.setMaterialOpacity(particle.mesh, particle.life / particle.maxLife)

      // Add rotation
      particle.mesh.rotation.x += particle.rotationSpeed.x * deltaTime
      particle.mesh.rotation.y += particle.rotationSpeed.y * deltaTime
      particle.mesh.rotation.z += particle.rotationSpeed.z * deltaTime

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateSparks(deltaTime: number): void {
    const system = this.particleSystems.get('sparks')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime
      particle.size += particle.scaleSpeed * deltaTime

      // Sparks shrink as they fade
      particle.mesh.scale.setScalar(particle.size)
      this.setMaterialOpacity(particle.mesh, particle.life / particle.maxLife)

      // Add rotation
      particle.mesh.rotation.x += particle.rotationSpeed.x * deltaTime
      particle.mesh.rotation.y += particle.rotationSpeed.y * deltaTime
      particle.mesh.rotation.z += particle.rotationSpeed.z * deltaTime

      if (particle.life <= 0 || particle.size <= 0.01) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateEnergyBlast(deltaTime: number): void {
    const system = this.particleSystems.get('energy_blast')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime

      // Energy particles pulse
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.3
      particle.mesh.scale.setScalar(particle.size * pulse)
      this.setMaterialOpacity(particle.mesh, (particle.life / particle.maxLife) * 0.8)

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateSmoke(deltaTime: number): void {
    const system = this.particleSystems.get('smoke')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime
      particle.size += particle.scaleSpeed * deltaTime

      // Smoke spreads as it rises
      particle.mesh.scale.setScalar(particle.size)
      this.setMaterialOpacity(particle.mesh, (particle.life / particle.maxLife) * 0.4)

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateFire(deltaTime: number): void {
    const system = this.particleSystems.get('fire')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime
      particle.size += particle.scaleSpeed * deltaTime

      // Fire flickers
      this.setMaterialEmissiveIntensity(particle.mesh, 0.5 + Math.random() * 0.5)
      this.setMaterialOpacity(particle.mesh, (particle.life / particle.maxLife) * 0.9)

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateIceCrystals(deltaTime: number): void {
    const system = this.particleSystems.get('ice_crystals')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime
      particle.size += particle.scaleSpeed * deltaTime

      // Ice crystals shrink and reflect
      particle.mesh.scale.setScalar(particle.size)
      this.setMaterialOpacity(particle.mesh, (particle.life / particle.maxLife) * 0.9)

      // Add slow rotation
      particle.mesh.rotation.x += particle.rotationSpeed.x * deltaTime
      particle.mesh.rotation.y += particle.rotationSpeed.y * deltaTime
      particle.mesh.rotation.z += particle.rotationSpeed.z * deltaTime

      if (particle.life <= 0 || particle.size <= 0.01) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateElectricity(deltaTime: number): void {
    const system = this.particleSystems.get('electricity')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime

      // Electric particles flicker
      this.setMaterialEmissiveIntensity(particle.mesh, 1 + Math.sin(Date.now() * 0.02) * 0.5)
      this.setMaterialOpacity(particle.mesh, (particle.life / particle.maxLife) * 0.8)

      // Random zaps
      if (Math.random() < 0.1) {
        this.setMaterialOpacity(particle.mesh, 1)
      }

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  private updateHealing(deltaTime: number): void {
    const system = this.particleSystems.get('healing')!
    system.particles = system.particles.filter(particle => {
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      particle.life -= deltaTime
      particle.size += particle.scaleSpeed * deltaTime

      // Healing particles rise and shrink
      particle.mesh.scale.setScalar(particle.size)
      this.setMaterialOpacity(particle.mesh, (particle.life / particle.maxLife) * 0.7)

      // Healing glow
      this.setMaterialEmissiveIntensity(particle.mesh, 0.5 + Math.sin(Date.now() * 0.01) * 0.3)

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  // VISUAL EFFECTS
  private createShockwave(position: THREE.Vector3, radius: number): void {
    const geometry = new THREE.RingGeometry(0.1, radius, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })

    const shockwave = new THREE.Mesh(geometry, material)
    shockwave.position.copy(position)
    shockwave.rotation.x = -Math.PI / 2

    this.scene.add(shockwave)

    // Expand and fade
    let scale = 1
    const expand = () => {
      scale += 0.3
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

  private screenShake(intensity: number, duration: number): void {
    // Screen shake effect would be implemented in the main camera system
    // This would involve temporary camera displacement
  }

  private createEnergyRing(position: THREE.Vector3, radius: number): void {
    const geometry = new THREE.TorusGeometry(radius, 0.2, 16)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6
    })

    const ring = new THREE.Mesh(geometry, material)
    ring.position.copy(position)
    ring.rotation.x = -Math.PI / 2

    this.scene.add(ring)

    // Pulse effect
    let scale = 1
    const pulse = () => {
      scale += 0.1
      ring.scale.setScalar(scale)
      ring.material.opacity = 0.6 * (2 - scale)

      if (scale < 2) {
        requestAnimationFrame(pulse)
      } else {
        this.scene.remove(ring)
      }
    }

    pulse()
  }

  private createIceGround(position: THREE.Vector3, radius: number): void {
    const geometry = new THREE.CylinderGeometry(radius, 0.1, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      emissive: 0x87ceeb,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.3
    })

    const iceGround = new THREE.Mesh(geometry, material)
    iceGround.position.copy(position)
    iceGround.position.y = 0.05

    this.scene.add(iceGround)

    setTimeout(() => {
      this.scene.remove(iceGround)
    }, 3000)
  }

  private createLightningBolt(startPos: THREE.Vector3, endPos: THREE.Vector3): void {
    const points = []
    const segments = 10

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const position = startPos.clone().lerp(endPos, t)

      // Add random lightning offset
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      )
      position.add(offset)

      points.push(position)
    }

    // Create lightning geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0x9966ff
    })

    const lightning = new THREE.Line(geometry, material)
    this.scene.add(lightning)

    // Flash effect
    if ('emissiveIntensity' in lightning.material) {
      (lightning.material as any).emissiveIntensity = 3
    }
    setTimeout(() => {
      if ('emissiveIntensity' in lightning.material) {
        (lightning.material as any).emissiveIntensity = 1
      }
    }, 100)

    setTimeout(() => {
      this.scene.remove(lightning)
    }, 500)
  }

  // Update all effects
  update(deltaTime: number): void {
    // Update all particle systems
    this.particleSystems.forEach(system => {
      system.updateFunction(deltaTime)
    })

    // Update post-processing effects
    this.postProcessing.update(deltaTime)

    // Update environmental effects
    this.environmentalEffects.update(deltaTime)

    // Update impact effects
    this.impactEffects.update(deltaTime)
  }

  // Cleanup
  cleanup(): void {
    this.particleSystems.forEach(system => {
      system.particles.forEach(particle => {
        this.scene.remove(particle.mesh)
      })
    })

    this.postProcessing.cleanup()
    this.environmentalEffects.cleanup()
    this.impactEffects.cleanup()
    this.particleSystems.clear()
    this.activeEffects.clear()
  }

  // Get performance stats
  getPerformanceStats(): {
    totalParticles: number
    activeEffects: number
    memoryUsage: number
  } {
    const totalParticles = Array.from(this.particleSystems.values())
      .reduce((sum, system) => sum + system.particles.length, 0)

    return {
      totalParticles,
      activeEffects: this.activeEffects.size,
      memoryUsage: totalParticles * 64 // Estimate
    }
  }
}

// Additional effect classes
class PostProcessingEffects {
  private camera: THREE.PerspectiveCamera
  private composer: any
  private effects: any[] = []

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    // Initialize post-processing composer
  }

  update(deltaTime: number): void {
    // Update post-processing effects
  }

  cleanup(): void {
    // Cleanup post-processing resources
  }
}

class EnvironmentalEffects {
  private scene: THREE.Scene
  private effects: any[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    // Initialize environmental effects
  }

  update(deltaTime: number): void {
    // Update environmental effects (weather, etc.)
  }

  cleanup(): void {
    this.effects.forEach(effect => {
      if (effect.parent) {
        this.scene.remove(effect)
      }
    })
    this.effects = []
  }
}

class ImpactEffects {
  private scene: THREE.Scene
  private effects: any[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    // Initialize impact effects
  }

  update(deltaTime: number): void {
    // Update impact effects
  }

  cleanup(): void {
    this.effects.forEach(effect => {
      if (effect.parent) {
        this.scene.remove(effect)
      }
    })
    this.effects = []
  }
}

export default GLXYVisualEffects