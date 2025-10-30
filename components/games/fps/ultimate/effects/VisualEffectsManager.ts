/**
 * ✨ VISUAL EFFECTS MANAGER
 * 
 * Muzzle Flashes, Bullet Tracers, Impact Effects
 */

import * as THREE from 'three'

export class VisualEffectsManager {
  private scene: THREE.Scene
  private activeEffects: THREE.Object3D[] = []
  private particlePool: THREE.Points[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initializeParticlePool()
  }

  /**
   * Initialize particle pool for performance
   */
  private initializeParticlePool(): void {
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.BufferGeometry()
      const material = new THREE.PointsMaterial({
        size: 0.1,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
      })
      const particles = new THREE.Points(geometry, material)
      particles.visible = false
      this.particlePool.push(particles)
      this.scene.add(particles)
    }
  }

  /**
   * 💥 Create Muzzle Flash
   */
  createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3): void {
    // Flash Light
    const flashLight = new THREE.PointLight(0xffaa00, 3, 10)
    flashLight.position.copy(position)
    this.scene.add(flashLight)

    // Sprite Effect
    const spriteMaterial = new THREE.SpriteMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.copy(position).add(direction.multiplyScalar(0.5))
    sprite.scale.set(0.5, 0.5, 0.5)
    this.scene.add(sprite)

    // Fade out animation
    let opacity = 1
    const fadeInterval = setInterval(() => {
      opacity -= 0.1
      flashLight.intensity = 3 * opacity
      spriteMaterial.opacity = opacity

      if (opacity <= 0) {
        clearInterval(fadeInterval)
        this.scene.remove(flashLight)
        this.scene.remove(sprite)
        flashLight.dispose()
        spriteMaterial.dispose()
      }
    }, 16) // ~60fps
  }

  /**
   * ➡️ Create Bullet Tracer
   */
  createBulletTracer(start: THREE.Vector3, end: THREE.Vector3, color: number = 0xffff00): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    })
    const line = new THREE.Line(geometry, material)
    this.scene.add(line)
    this.activeEffects.push(line)

    // Fade out
    setTimeout(() => {
      let opacity = 0.8
      const fadeInterval = setInterval(() => {
        opacity -= 0.1
        material.opacity = opacity

        if (opacity <= 0) {
          clearInterval(fadeInterval)
          this.scene.remove(line)
          geometry.dispose()
          material.dispose()
          const index = this.activeEffects.indexOf(line)
          if (index > -1) this.activeEffects.splice(index, 1)
        }
      }, 16)
    }, 50)
  }

  /**
   * 💨 Create Impact Effect (Sparks, Dust)
   */
  createImpactEffect(position: THREE.Vector3, normal: THREE.Vector3, material: 'metal' | 'concrete' | 'wood' = 'concrete'): void {
    const particleCount = material === 'metal' ? 15 : 8
    const color = material === 'metal' ? 0xffaa00 : material === 'concrete' ? 0x888888 : 0x8b4513

    // Get particle from pool
    const particles = this.particlePool.find(p => !p.visible)
    if (!particles) return

    // Setup particles
    const positions: number[] = []
    const velocities: THREE.Vector3[] = []

    for (let i = 0; i < particleCount; i++) {
      positions.push(position.x, position.y, position.z)
      
      // Random velocity away from surface
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ).add(normal.multiplyScalar(2))
      
      velocities.push(velocity)
    }

    particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    ;(particles.material as THREE.PointsMaterial).color.setHex(color)
    ;(particles.material as THREE.PointsMaterial).size = material === 'metal' ? 0.05 : 0.1
    particles.visible = true

    // Animate particles
    let life = 1
    const animateInterval = setInterval(() => {
      life -= 0.05
      ;(particles.material as THREE.PointsMaterial).opacity = life

      // Update positions
      const pos = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i].x * 0.016
        pos[i * 3 + 1] += velocities[i].y * 0.016 - 0.01 // gravity
        pos[i * 3 + 2] += velocities[i].z * 0.016
      }
      particles.geometry.attributes.position.needsUpdate = true

      if (life <= 0) {
        clearInterval(animateInterval)
        particles.visible = false
        ;(particles.material as THREE.PointsMaterial).opacity = 1
      }
    }, 16)
  }

  /**
   * 🩸 Create Blood Effect
   */
  createBloodEffect(position: THREE.Vector3, direction: THREE.Vector3): void {
    const particleCount = 12
    const particles = this.particlePool.find(p => !p.visible)
    if (!particles) return

    const positions: number[] = []
    const velocities: THREE.Vector3[] = []

    for (let i = 0; i < particleCount; i++) {
      positions.push(position.x, position.y, position.z)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      ).add(direction.multiplyScalar(-2))
      
      velocities.push(velocity)
    }

    particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    ;(particles.material as THREE.PointsMaterial).color.setHex(0x8b0000) // Dark red
    ;(particles.material as THREE.PointsMaterial).size = 0.15
    particles.visible = true

    // Animate
    let life = 1
    const animateInterval = setInterval(() => {
      life -= 0.04
      ;(particles.material as THREE.PointsMaterial).opacity = life

      const pos = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i].x * 0.016
        pos[i * 3 + 1] += velocities[i].y * 0.016 - 0.02 // gravity
        pos[i * 3 + 2] += velocities[i].z * 0.016

        // Damping
        velocities[i].multiplyScalar(0.95)
      }
      particles.geometry.attributes.position.needsUpdate = true

      if (life <= 0) {
        clearInterval(animateInterval)
        particles.visible = false
        ;(particles.material as THREE.PointsMaterial).opacity = 1
      }
    }, 16)
  }

  /**
   * 💥 Create Explosion Effect
   */
  createExplosion(position: THREE.Vector3, radius: number = 5): void {
    // Flash
    const flashLight = new THREE.PointLight(0xff4400, 10, radius * 3)
    flashLight.position.copy(position)
    this.scene.add(flashLight)

    // Explosion sphere
    const geometry = new THREE.SphereGeometry(0.5, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 1
    })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(position)
    this.scene.add(sphere)

    // Animate
    let scale = 0.5
    let opacity = 1
    const animateInterval = setInterval(() => {
      scale += 0.5
      opacity -= 0.05
      
      sphere.scale.set(scale, scale, scale)
      material.opacity = opacity
      flashLight.intensity = 10 * opacity

      if (opacity <= 0) {
        clearInterval(animateInterval)
        this.scene.remove(flashLight)
        this.scene.remove(sphere)
        geometry.dispose()
        material.dispose()
        flashLight.dispose()
      }
    }, 16)

    // Particles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createImpactEffect(position, new THREE.Vector3(0, 1, 0), 'metal')
      }, i * 50)
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.activeEffects.forEach(effect => {
      this.scene.remove(effect)
    })
    this.particlePool.forEach(particles => {
      this.scene.remove(particles)
      particles.geometry.dispose()
      ;(particles.material as THREE.Material).dispose()
    })
    this.activeEffects = []
    this.particlePool = []
  }
}

export default VisualEffectsManager

