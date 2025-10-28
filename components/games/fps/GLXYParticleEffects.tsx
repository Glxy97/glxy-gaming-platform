// @ts-nocheck
import * as THREE from 'three'

// EPIC Particle Effects System for GLXY FPS
export class GLXYParticleEffects {
  private scene: THREE.Scene
  private particles: Array<{
    mesh: THREE.Mesh
    velocity: THREE.Vector3
    acceleration: THREE.Vector3
    life: number
    maxLife: number
    size: number
    color: THREE.Color
    type: 'explosion' | 'blood' | 'muzzle' | 'hit' | 'energy' | 'glxy'
  }> = []

  private emitters: Map<string, THREE.Mesh> = new Map()

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  // GLXY Epic Explosion Effect
  createExplosion(position: THREE.Vector3, intensity: number = 1): void {
    const particleCount = 20 * intensity
    const colors = [0xff4500, 0xff6347, 0xffa500, 0xffff00] // Fire colors

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3)
      const material = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1
      })
      const particle = new THREE.Mesh(geometry, material)

      particle.position.copy(position)

      // Random explosion velocity
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 5 + Math.random() * 15 * intensity

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      )

      this.particles.push({
        mesh: particle,
        velocity: velocity,
        acceleration: new THREE.Vector3(0, -9.8, 0), // Gravity
        life: 2 + Math.random(),
        maxLife: 2 + Math.random(),
        size: 0.2 + Math.random() * 0.3,
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
        type: 'explosion'
      })

      this.scene.add(particle)
    }

    // Add shockwave
    this.createShockwave(position, intensity)
  }

  // GLXY Blood Splatter Effect
  createBloodSplatter(position: THREE.Vector3, intensity: number = 1): void {
    const particleCount = 15 * intensity

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1)
      const material = new THREE.MeshBasicMaterial({
        color: 0x8b0000, // Dark red
        transparent: true,
        opacity: 0.8
      })
      const particle = new THREE.Mesh(geometry, material)

      particle.position.copy(position)

      // Blood splatter velocity (downward and outward)
      const theta = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 8

      const velocity = new THREE.Vector3(
        Math.cos(theta) * speed,
        Math.random() * 5,
        Math.sin(theta) * speed
      )

      this.particles.push({
        mesh: particle,
        velocity: velocity,
        acceleration: new THREE.Vector3(0, -15, 0), // Strong gravity for blood
        life: 1.5,
        maxLife: 1.5,
        size: 0.05 + Math.random() * 0.1,
        color: new THREE.Color(0x8b0000),
        type: 'blood'
      })

      this.scene.add(particle)
    }
  }

  // GLXY Muzzle Flash Effect
  createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3): void {
    const flashGeometry = new THREE.SphereGeometry(0.3)
    const flashMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      transparent: true,
      opacity: 1,
      emissive: 0xffff99,
      emissiveIntensity: 1
    })
    const flash = new THREE.Mesh(flashGeometry, flashMaterial)
    flash.position.copy(position)

    this.particles.push({
      mesh: flash,
      velocity: direction.clone().multiplyScalar(2),
      acceleration: new THREE.Vector3(0, 0, 0),
      life: 0.1,
      maxLife: 0.1,
      size: 0.3,
      color: new THREE.Color(0xffff99),
      type: 'muzzle'
    })

    this.scene.add(flash)

    // Add muzzle smoke
    for (let i = 0; i < 5; i++) {
      const smokeGeometry = new THREE.SphereGeometry(0.1)
      const smokeMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.6
      })
      const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial)
      smoke.position.copy(position)

      const smokeVelocity = direction.clone().multiplyScalar(1 + Math.random() * 2)
      smokeVelocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ))

      this.particles.push({
        mesh: smoke,
        velocity: smokeVelocity,
        acceleration: new THREE.Vector3(0, 0, 0),
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 0.1,
        color: new THREE.Color(0x888888),
        type: 'muzzle'
      })

      this.scene.add(smoke)
    }
  }

  // GLXY Hit Impact Effect
  createHitImpact(position: THREE.Vector3, normal: THREE.Vector3, isCritical: boolean = false): void {
    const impactColor = isCritical ? 0xffd700 : 0xff0000 // Gold for critical, red for normal
    const particleCount = isCritical ? 20 : 10

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1)
      const material = new THREE.MeshStandardMaterial({
        color: impactColor,
        transparent: true,
        opacity: 1,
        emissive: impactColor,
        emissiveIntensity: 0.8
      })
      const particle = new THREE.Mesh(geometry, material)

      particle.position.copy(position)

      // Particles spray in direction of normal
      const spread = 0.5
      const velocity = normal.clone().multiplyScalar(5 + Math.random() * 10)
      velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      ))

      this.particles.push({
        mesh: particle,
        velocity: velocity,
        acceleration: new THREE.Vector3(0, -5, 0),
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 0.05 + Math.random() * 0.1,
        color: new THREE.Color(impactColor),
        type: 'hit'
      })

      this.scene.add(particle)
    }
  }

  // GLXY Energy Beam Effect
  createEnergyBeam(start: THREE.Vector3, end: THREE.Vector3, color: number = 0x00ffff): void {
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, start.distanceTo(end), 8)
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      emissive: color,
      emissiveIntensity: 1
    })
    const beam = new THREE.Mesh(beamGeometry, beamMaterial)

    // Position and orient beam
    beam.position.lerpVectors(start, end, 0.5)
    beam.lookAt(end)

    this.particles.push({
      mesh: beam,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      life: 0.1,
      maxLife: 0.1,
      size: 0.1,
      color: new THREE.Color(color),
      type: 'energy'
    })

    this.scene.add(beam)
  }

  // GLXY Aura Effect (for power-ups or special abilities)
  createGLXYAura(position: THREE.Vector3, radius: number = 2, color: number = 0xff9500): void {
    const auraGeometry = new THREE.SphereGeometry(radius, 16, 16)
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })
    const aura = new THREE.Mesh(auraGeometry, auraMaterial)
    aura.position.copy(position)

    this.particles.push({
      mesh: aura,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      life: 2,
      maxLife: 2,
      size: radius,
      color: new THREE.Color(color),
      type: 'glxy'
    })

    this.scene.add(aura)

    // Add floating particles around aura
    for (let i = 0; i < 10; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1)
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        emissive: color,
        emissiveIntensity: 0.5
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)

      const theta = (i / 10) * Math.PI * 2
      particle.position.set(
        position.x + Math.cos(theta) * radius,
        position.y + Math.sin(Date.now() * 0.001 + i) * 0.5,
        position.z + Math.sin(theta) * radius
      )

      this.particles.push({
        mesh: particle,
        velocity: new THREE.Vector3(
          Math.cos(theta + Math.PI / 2) * 0.5,
          Math.sin(Date.now() * 0.001) * 0.2,
          Math.sin(theta + Math.PI / 2) * 0.5
        ),
        acceleration: new THREE.Vector3(0, 0, 0),
        life: 2,
        maxLife: 2,
        size: 0.1,
        color: new THREE.Color(color),
        type: 'glxy'
      })

      this.scene.add(particle)
    }
  }

  // Shockwave Effect
  private createShockwave(position: THREE.Vector3, intensity: number = 1): void {
    const shockwaveGeometry = new THREE.RingGeometry(0.1, 1, 32)
    const shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial)
    shockwave.position.copy(position)
    shockwave.rotation.x = -Math.PI / 2

    this.particles.push({
      mesh: shockwave,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      life: 1,
      maxLife: 1,
      size: 1,
      color: new THREE.Color(0xff6600),
      type: 'explosion'
    })

    this.scene.add(shockwave)
  }

  // Update all particles
  update(deltaTime: number): void {
    this.particles = this.particles.filter(particle => {
      // Update position
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      // Update life
      particle.life -= deltaTime

      // Update opacity based on life
      if (particle.type === 'muzzle') {
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life / particle.maxLife
      } else if (particle.type === 'blood') {
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life / particle.maxLife * 0.8
      } else if (particle.type === 'hit') {
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life / particle.maxLife
      } else if (particle.type === 'explosion') {
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life / particle.maxLife
      } else if (particle.type === 'energy') {
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life / particle.maxLife
      }

      // Special effects for different types
      if (particle.type === 'explosion') {
        // Explosions grow as they fade
        const scale = 1 + (1 - particle.life / particle.maxLife) * 2
        particle.mesh.scale.setScalar(scale)
      } else if (particle.type === 'glxy') {
        // GLXY particles rotate and pulse
        particle.mesh.rotation.y += deltaTime * 2
        const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.2
        particle.mesh.scale.setScalar(pulse)
      } else if (particle.type === 'blood') {
        // Blood particles stick to surfaces
        if (particle.mesh.position.y <= 0.1) {
          particle.velocity.set(0, 0, 0)
          particle.acceleration.set(0, 0, 0)
        }
      }

      // Remove dead particles
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh)
        return false
      }

      return true
    })
  }

  // Cleanup all particles
  cleanup(): void {
    this.particles.forEach(particle => {
      this.scene.remove(particle.mesh)
    })
    this.particles = []
  }

  // Get particle count for performance monitoring
  getParticleCount(): number {
    return this.particles.length
  }
}

// GLXY Weapon Trail Effect
export class GLXYWeaponTrails {
  private scene: THREE.Scene
  private trails: Array<{
    mesh: THREE.Mesh
    life: number
    maxLife: number
    velocity: THREE.Vector3
  }> = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  createBulletTrail(start: THREE.Vector3, end: THREE.Vector3, color: number = 0xffff00): void {
    const trailGeometry = new THREE.CylinderGeometry(0.02, 0.02, start.distanceTo(end), 8)
    const trailMaterial = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      emissive: color,
      emissiveIntensity: 0.8
    })
    const trail = new THREE.Mesh(trailGeometry, trailMaterial)

    // Position and orient trail
    trail.position.lerpVectors(start, end, 0.5)
    trail.lookAt(end)
    trail.rotation.x += Math.PI / 2

    this.trails.push({
      mesh: trail,
      life: 0.5,
      maxLife: 0.5,
      velocity: new THREE.Vector3(0, -0.5, 0) // Slight fall
    })

    this.scene.add(trail)
  }

  update(deltaTime: number): void {
    this.trails = this.trails.filter(trail => {
      trail.life -= deltaTime

      // Simple position update
      if (trail.mesh && trail.mesh.position) {
        trail.mesh.position.y -= 0.5 * deltaTime
      }

      // Fade out
      if (trail.mesh && trail.mesh.material) {
        const material = trail.mesh.material as any
        if (material.opacity !== undefined) {
          material.opacity = trail.life / trail.maxLife * 0.6
        }
      }

      if (trail.life <= 0) {
        this.scene.remove(trail.mesh)
        return false
      }

      return true
    })
  }

  cleanup(): void {
    this.trails.forEach(trail => {
      this.scene.remove(trail.mesh)
    })
    this.trails = []
  }
}

export default GLXYParticleEffects