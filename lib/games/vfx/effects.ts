import * as THREE from 'three'

export class EffectsManager {
  private scene: THREE.Scene
  private effects: Map<string, THREE.Object3D[]> = new Map()
  private particleSystems: Map<string, THREE.Points> = new Map()

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initializeEffectPools()
  }

  private initializeEffectPools(): void {
    // Initialize pools for different effect types
    this.effects.set('muzzleFlash', [])
    this.effects.set('impact', [])
    this.effects.set('tracer', [])
  }

  createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3): void {
    const flash = this.getMuzzleFlashEffect()
    if (!flash) return

    flash.position.copy(position)
    flash.lookAt(position.clone().add(direction))
    
    this.scene.add(flash)

    // Remove after short duration
    setTimeout(() => {
      this.scene.remove(flash)
      this.returnEffectToPool('muzzleFlash', flash)
    }, 100)
  }

  createImpactEffect(position: THREE.Vector3, normal: THREE.Vector3, material: string): void {
    const impact = this.getImpactEffect()
    if (!impact) return

    impact.position.copy(position)
    impact.lookAt(position.clone().add(normal))
    
    // Adjust color based on material
    const materialColors = {
      concrete: 0x888888,
      metal: 0xcccccc,
      wood: 0x8b4513,
      vegetation: 0x228b22,
      water: 0x4169e1,
      glass: 0x87ceeb
    }
    
    const color = materialColors[material as keyof typeof materialColors] || 0x888888
    this.setEffectColor(impact, color)
    
    this.scene.add(impact)

    // Remove after short duration
    setTimeout(() => {
      this.scene.remove(impact)
      this.returnEffectToPool('impact', impact)
    }, 200)
  }

  createTracerEffect(start: THREE.Vector3, end: THREE.Vector3): void {
    const tracer = this.getTracerEffect()
    if (!tracer) return

    // Create line from start to end
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffff00, 
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    })
    
    const line = new THREE.Line(geometry, material)
    this.scene.add(line)

    // Remove after short duration
    setTimeout(() => {
      this.scene.remove(line)
      geometry.dispose()
      material.dispose()
    }, 50)
  }

  private getMuzzleFlashEffect(): THREE.Object3D | null {
    let effect = this.effects.get('muzzleFlash')?.pop()
    
    if (!effect) {
      // Create new muzzle flash effect
      const geometry = new THREE.ConeGeometry(0.1, 0.3, 8)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8
      })
      effect = new THREE.Mesh(geometry, material)
    }
    
    return effect
  }

  private getImpactEffect(): THREE.Object3D | null {
    let effect = this.effects.get('impact')?.pop()
    
    if (!effect) {
      // Create new impact effect
      const geometry = new THREE.RingGeometry(0.05, 0.15, 8)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x888888,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
      effect = new THREE.Mesh(geometry, material)
    }
    
    return effect
  }

  private getTracerEffect(): THREE.Object3D | null {
    let effect = this.effects.get('tracer')?.pop()
    
    if (!effect) {
      // Create new tracer effect (simplified)
      const geometry = new THREE.SphereGeometry(0.02, 4, 4)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.6
      })
      effect = new THREE.Mesh(geometry, material)
    }
    
    return effect
  }

  private returnEffectToPool(type: string, effect: THREE.Object3D): void {
    const pool = this.effects.get(type)
    if (pool) {
      pool.push(effect)
    }
  }

  private setEffectColor(effect: THREE.Object3D, color: number): void {
    if (effect instanceof THREE.Mesh) {
      const material = effect.material as THREE.MeshBasicMaterial
      material.color.setHex(color)
    }
  }

  createParticleExplosion(position: THREE.Vector3, count: number = 20): void {
    const particles: THREE.Vector3[] = []
    const velocities: THREE.Vector3[] = []

    for (let i = 0; i < count; i++) {
      const particle = position.clone()
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      )
      
      particles.push(particle)
      velocities.push(velocity)
    }

    // Create particle system
    const geometry = new THREE.BufferGeometry().setFromPoints(particles)
    const material = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    })

    const particleSystem = new THREE.Points(geometry, material)
    this.scene.add(particleSystem)

    // Animate particles
    const startTime = Date.now()
    const duration = 1000 // 1 second

    const animateParticles = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      if (progress >= 1) {
        this.scene.remove(particleSystem)
        geometry.dispose()
        material.dispose()
        return
      }

      // Update particle positions
      const positions = geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particles.length; i++) {
        positions[i * 3] += velocities[i].x * 0.016
        positions[i * 3 + 1] += velocities[i].y * 0.016
        positions[i * 3 + 2] += velocities[i].z * 0.016
      }
      geometry.attributes.position.needsUpdate = true

      // Fade out
      material.opacity = 0.8 * (1 - progress)

      requestAnimationFrame(animateParticles)
    }

    animateParticles()
  }

  update(deltaTime: number): void {
    // Update any ongoing effects
    // This method is called by the game loop
  }

  dispose(): void {
    // Clean up all effects
    this.effects.forEach((pool, type) => {
      pool.forEach(effect => {
        this.scene.remove(effect)
        if (effect instanceof THREE.Mesh) {
          effect.geometry.dispose()
          if (Array.isArray(effect.material)) {
            effect.material.forEach(material => material.dispose())
          } else {
            effect.material.dispose()
          }
        }
      })
    })
    this.effects.clear()
  }
}