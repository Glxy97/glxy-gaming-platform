import * as THREE from 'three'
import { EffectsManager } from './vfx/effects'

export interface Impact {
  position: THREE.Vector3
  normal: THREE.Vector3
  distance: number
  material: string
  damage: number
}

export class ShootingSystem {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private effectsManager: EffectsManager
  private raycaster: THREE.Raycaster

  constructor(scene: THREE.Scene, camera: THREE.Camera, effectsManager: EffectsManager) {
    this.scene = scene
    this.camera = camera
    this.effectsManager = effectsManager
    this.raycaster = new THREE.Raycaster()
  }

  shoot(direction: THREE.Vector3, spread: number, recoil: { horizontal: number; vertical: number }): Impact[] {
    const impacts: Impact[] = []
    
    // Apply spread to direction
    const spreadAngle = spread * 0.1 // Convert spread to angle
    const horizontalSpread = (Math.random() - 0.5) * spreadAngle
    const verticalSpread = (Math.random() - 0.5) * spreadAngle
    
    // Apply recoil
    direction.x += recoil.horizontal + horizontalSpread
    direction.y += recoil.vertical + verticalSpread
    direction.normalize()

    // Set up raycaster
    this.raycaster.set(this.camera.position, direction)

    // Check for intersections
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0) {
      const hit = intersects[0]
      
      const impact: Impact = {
        position: hit.point,
        normal: hit.face?.normal || new THREE.Vector3(0, 1, 0),
        distance: hit.distance,
        material: this.getMaterialType(hit.object),
        damage: this.calculateDamage(hit.distance)
      }

      impacts.push(impact)

      // Create visual effects
      this.effectsManager.createImpactEffect(impact.position, impact.normal, impact.material)
      
      // Create tracer effect
      this.effectsManager.createTracerEffect(this.camera.position, impact.position)
    }

    return impacts
  }

  private getMaterialType(object: THREE.Object3D): string {
    // Simple material detection based on object properties
    if (object.userData.material) {
      return object.userData.material
    }
    
    if (object instanceof THREE.Mesh) {
      const material = object.material as THREE.Material
      if (material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial) {
        const color = material.color
        if (color.r > 0.8 && color.g > 0.8 && color.b > 0.8) return 'metal'
        if (color.r > 0.6 && color.g > 0.4 && color.b < 0.3) return 'wood'
        if (color.g > 0.6 && color.r < 0.4 && color.b < 0.4) return 'vegetation'
      }
    }
    
    return 'concrete' // Default material
  }

  private calculateDamage(distance: number): number {
    // Simple damage falloff calculation
    const baseDamage = 25
    const maxRange = 100
    const minDamage = 5
    
    if (distance <= 10) return baseDamage
    if (distance >= maxRange) return minDamage
    
    const falloff = (distance - 10) / (maxRange - 10)
    return Math.round(baseDamage - (baseDamage - minDamage) * falloff)
  }

  update(deltaTime: number): void {
    // Update any ongoing shooting effects
  }

  dispose(): void {
    // Clean up shooting system resources
    this.raycaster = {} as THREE.Raycaster
  }
}