// @ts-nocheck
'use client'

import * as THREE from 'three'

// DESTRUCTIBLE ENVIRONMENT SYSTEM - EPIC DESTRUCTION!
export interface DestructibleObject {
  id: string
  mesh: THREE.Mesh
  health: number
  maxHealth: number
  destructionLevel: 0 | 1 | 2 | 3 // 0=Intact, 1=Damaged, 2=Heavily Damaged, 3=Destroyed
  material: 'concrete' | 'wood' | 'metal' | 'glass' | 'brick'
  debrisParticles: THREE.Points[]
  coverValue: number // How much cover this provides
  isExplosive: boolean
  explosionRadius?: number
  explosionDamage?: number
  originalPosition: THREE.Vector3
  originalRotation: THREE.Euler
  rigidBody?: any // Physics body
}

export interface CoverSystem {
  position: THREE.Vector3
  radius: number
  strength: number
  isActive: boolean
  visualIndicator?: THREE.Mesh
}

export interface DestructionEffect {
  type: 'explosion' | 'crack' | 'shatter' | 'collapse'
  position: THREE.Vector3
  intensity: number
  particles: number
  sound?: string
  screenShake: number
}

export class GLXYDestructibleEnvironment {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private destructibleObjects: Map<string, DestructibleObject>
  private coverSystems: CoverSystem[]
  private destructionEffects: DestructionEffect[]
  private activeDebris: THREE.Mesh[]
  private physicsEngine: any
  private particleSystem: any

  // Materials for different destruction states
  private materials: {
    concrete: { intact: THREE.Material; damaged: THREE.Material; destroyed: THREE.Material }
    wood: { intact: THREE.Material; damaged: THREE.Material; destroyed: THREE.Material }
    metal: { intact: THREE.Material; damaged: THREE.Material; destroyed: THREE.Material }
    glass: { intact: THREE.Material; damaged: THREE.Material; destroyed: THREE.Material }
    brick: { intact: THREE.Material; damaged: THREE.Material; destroyed: THREE.Material }
  }

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, physicsEngine?: any) {
    this.scene = scene
    this.camera = camera
    this.physicsEngine = physicsEngine
    this.destructibleObjects = new Map()
    this.coverSystems = []
    this.destructionEffects = []
    this.activeDebris = []

    // Initialize destruction materials
    this.materials = this.createDestructionMaterials()

    // Create particle system for debris
    this.particleSystem = this.createParticleSystem()
  }

  // Create materials for different destruction states
  private createDestructionMaterials() {
    const materials = {
      concrete: {
        intact: new THREE.MeshLambertMaterial({ color: 0x888888 }),
        damaged: new THREE.MeshLambertMaterial({ color: 0x777777, transparent: true, opacity: 0.9 }),
        destroyed: new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 0.7 })
      },
      wood: {
        intact: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
        damaged: new THREE.MeshLambertMaterial({ color: 0x654321, transparent: true, opacity: 0.9 }),
        destroyed: new THREE.MeshLambertMaterial({ color: 0x3E2723, transparent: true, opacity: 0.7 })
      },
      metal: {
        intact: new THREE.MeshStandardMaterial({ color: 0x708090, metalness: 0.8, roughness: 0.2 }),
        damaged: new THREE.MeshStandardMaterial({ color: 0x607080, metalness: 0.6, roughness: 0.4 }),
        destroyed: new THREE.MeshStandardMaterial({ color: 0x405060, metalness: 0.4, roughness: 0.6 })
      },
      glass: {
        intact: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, transmission: 0.9 }),
        damaged: new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, transmission: 0.7 }),
        destroyed: new THREE.MeshPhysicalMaterial({ color: 0xdddddd, transparent: true, opacity: 0.3, transmission: 0.5 })
      },
      brick: {
        intact: new THREE.MeshLambertMaterial({ color: 0xB22222 }),
        damaged: new THREE.MeshLambertMaterial({ color: 0x8B1A1A, transparent: true, opacity: 0.9 }),
        destroyed: new THREE.MeshLambertMaterial({ color: 0x5C1010, transparent: true, opacity: 0.7 })
      }
    }

    // Add normal maps for more realistic damage
    Object.values(materials).forEach(materialSet => {
      // Add damage textures
      Object.values(materialSet).forEach(material => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.roughnessMap = this.createDamageTexture()
          material.normalMap = this.createNormalTexture()
        }
      })
    })

    return materials
  }

  // Create damage texture for materials
  private createDamageTexture(): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')!

    // Create noise pattern for damage
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const size = Math.random() * 3
      const opacity = Math.random() * 0.5

      context.fillStyle = `rgba(0, 0, 0, ${opacity})`
      context.fillRect(x, y, size, size)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)

    return texture
  }

  // Create normal texture for materials
  private createNormalTexture(): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')!

    // Create normal map pattern
    const imageData = context.createImageData(256, 256)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128 + Math.random() * 20 - 10     // Red
      data[i + 1] = 128 + Math.random() * 20 - 10 // Green
      data[i + 2] = 255                           // Blue
      data[i + 3] = 255                           // Alpha
    }

    context.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)

    return texture
  }

  // Create particle system for debris
  private createParticleSystem() {
    const particleCount = 1000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      velocities[i * 3] = (Math.random() - 0.5) * 10
      velocities[i * 3 + 1] = Math.random() * 10
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 10

      lifetimes[i] = 0
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.5,
      color: 0x888888,
      transparent: true,
      opacity: 0.8,
      vertexColors: false
    })

    return new THREE.Points(geometry, material)
  }

  // Create destructible wall
  createDestructibleWall(position: THREE.Vector3, width: number, height: number, depth: number, material: 'concrete' | 'brick' = 'concrete'): string {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const wallMaterial = this.materials[material].intact

    const wall = new THREE.Mesh(geometry, wallMaterial)
    wall.position.copy(position)
    wall.castShadow = true
    wall.receiveShadow = true

    const wallId = `wall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const destructibleWall: DestructibleObject = {
      id: wallId,
      mesh: wall,
      health: 100,
      maxHealth: 100,
      destructionLevel: 0,
      material,
      debrisParticles: [],
      coverValue: 0.8, // Walls provide good cover
      isExplosive: false,
      originalPosition: position.clone(),
      originalRotation: wall.rotation.clone()
    }

    this.destructibleObjects.set(wallId, destructibleWall)
    this.scene.add(wall)

    // Add physics body if physics engine is available
    if (this.physicsEngine) {
      destructibleWall.rigidBody = this.physicsEngine.createBoxBody(
        position,
        { x: width, y: height, z: depth },
        { mass: 0, isStatic: true }
      )
    }

    return wallId
  }

  // Create destructible door
  createDestructibleDoor(position: THREE.Vector3, material: 'wood' | 'metal' = 'wood'): string {
    const geometry = new THREE.BoxGeometry(2, 3, 0.1)
    const doorMaterial = this.materials[material].intact

    const door = new THREE.Mesh(geometry, doorMaterial)
    door.position.copy(position)
    door.castShadow = true
    door.receiveShadow = true

    const doorId = `door_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const destructibleDoor: DestructibleObject = {
      id: doorId,
      mesh: door,
      health: 50,
      maxHealth: 50,
      destructionLevel: 0,
      material,
      debrisParticles: [],
      coverValue: 0.3, // Doors provide minimal cover
      isExplosive: false,
      originalPosition: position.clone(),
      originalRotation: door.rotation.clone()
    }

    this.destructibleObjects.set(doorId, destructibleDoor)
    this.scene.add(door)

    return doorId
  }

  // Create destructible window
  createDestructibleWindow(position: THREE.Vector3, width: number = 2, height: number = 2): string {
    const geometry = new THREE.BoxGeometry(width, height, 0.05)
    const windowMaterial = this.materials.glass.intact

    const window = new THREE.Mesh(geometry, windowMaterial)
    window.position.copy(position)

    const windowId = `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const destructibleWindow: DestructibleObject = {
      id: windowId,
      mesh: window,
      health: 20,
      maxHealth: 20,
      destructionLevel: 0,
      material: 'glass',
      debrisParticles: [],
      coverValue: 0.1, // Glass provides minimal cover
      isExplosive: false,
      originalPosition: position.clone(),
      originalRotation: window.rotation.clone()
    }

    this.destructibleObjects.set(windowId, destructibleWindow)
    this.scene.add(window)

    return windowId
  }

  // Create explosive barrel
  createExplosiveBarrel(position: THREE.Vector3): string {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8)
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 })

    const barrel = new THREE.Mesh(geometry, barrelMaterial)
    barrel.position.copy(position)
    barrel.castShadow = true
    barrel.receiveShadow = true

    const barrelId = `barrel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const explosiveBarrel: DestructibleObject = {
      id: barrelId,
      mesh: barrel,
      health: 30,
      maxHealth: 30,
      destructionLevel: 0,
      material: 'metal',
      debrisParticles: [],
      coverValue: 0.4,
      isExplosive: true,
      explosionRadius: 8,
      explosionDamage: 75,
      originalPosition: position.clone(),
      originalRotation: barrel.rotation.clone()
    }

    this.destructibleObjects.set(barrelId, explosiveBarrel)
    this.scene.add(barrel)

    return barrelId
  }

  // Create procedural cover system
  createProceduralCover(position: THREE.Vector3, radius: number = 3, strength: number = 0.6): string {
    const coverId = `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create visual indicator for cover (optional)
    const coverGeometry = new THREE.CylinderGeometry(radius, radius, 0.1, 8)
    const coverMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF00,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    })
    const coverIndicator = new THREE.Mesh(coverGeometry, coverMaterial)
    coverIndicator.position.copy(position)
    coverIndicator.position.y -= 0.5

    const coverSystem: CoverSystem = {
      position: position.clone(),
      radius,
      strength,
      isActive: true,
      visualIndicator: coverIndicator
    }

    this.coverSystems.push(coverSystem)

    // Only add visual indicator in debug mode
    // this.scene.add(coverIndicator)

    return coverId
  }

  // Apply damage to destructible object
  applyDamage(objectId: string, damage: number, hitPosition?: THREE.Vector3, forceDirection?: THREE.Vector3): boolean {
    const object = this.destructibleObjects.get(objectId)
    if (!object) return false

    object.health -= damage

    // Create hit effect
    if (hitPosition) {
      this.createHitEffect(hitPosition, object.material, damage)
    }

    // Check for destruction level change
    const healthPercentage = object.health / object.maxHealth
    let newDestructionLevel: 0 | 1 | 2 | 3 = 0

    if (healthPercentage <= 0) {
      newDestructionLevel = 3 // Destroyed
    } else if (healthPercentage <= 0.33) {
      newDestructionLevel = 2 // Heavily damaged
    } else if (healthPercentage <= 0.66) {
      newDestructionLevel = 1 // Damaged
    }

    if (newDestructionLevel !== object.destructionLevel) {
      object.destructionLevel = newDestructionLevel
      this.updateObjectAppearance(object)

      // Create destruction effect
      if (hitPosition) {
        this.createDestructionEffect(hitPosition, object.material, newDestructionLevel)
      }
    }

    // Handle destruction
    if (object.health <= 0) {
      this.destroyObject(object, hitPosition, forceDirection)
      return true
    }

    // Handle explosion for explosive objects
    if (object.isExplosive && object.health <= 0) {
      this.triggerExplosion(object)
    }

    return false
  }

  // Update object appearance based on destruction level
  private updateObjectAppearance(object: DestructibleObject) {
    const material = this.materials[object.material]
    let newMaterial: THREE.Material

    switch (object.destructionLevel) {
      case 0:
        newMaterial = material.intact
        break
      case 1:
        newMaterial = material.damaged
        break
      case 2:
        newMaterial = material.damaged
        break
      case 3:
        newMaterial = material.destroyed
        break
      default:
        newMaterial = material.intact
    }

    object.mesh.material = newMaterial

    // Add visual damage based on destruction level
    if (object.destructionLevel >= 1) {
      this.addCracksToMesh(object.mesh, object.destructionLevel)
    }

    // Deform mesh for heavily damaged objects
    if (object.destructionLevel >= 2) {
      this.deformMesh(object.mesh, object.destructionLevel)
    }
  }

  // Add cracks to mesh
  private addCracksToMesh(mesh: THREE.Mesh, destructionLevel: number) {
    // Create crack geometry
    const crackGeometry = new THREE.BufferGeometry()
    const crackPoints: THREE.Vector3[] = []

    const numCracks = destructionLevel * 3
    for (let i = 0; i < numCracks; i++) {
      const startPoint = mesh.position.clone()
      const endPoint = new THREE.Vector3(
        startPoint.x + (Math.random() - 0.5) * mesh.geometry.boundingSphere!.radius * 2,
        startPoint.y + (Math.random() - 0.5) * mesh.geometry.boundingSphere!.radius * 2,
        startPoint.z + (Math.random() - 0.5) * mesh.geometry.boundingSphere!.radius * 2
      )

      crackPoints.push(startPoint, endPoint)
    }

    crackGeometry.setFromPoints(crackPoints)
    const crackMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7 - destructionLevel * 0.1
    })

    const cracks = new THREE.LineSegments(crackGeometry, crackMaterial)
    mesh.add(cracks)
  }

  // Deform mesh for damage
  private deformMesh(mesh: THREE.Mesh, destructionLevel: number) {
    const geometry = mesh.geometry as THREE.BufferGeometry
    const positions = geometry.attributes.position.array as Float32Array

    const deformationStrength = destructionLevel * 0.1
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += (Math.random() - 0.5) * deformationStrength
      positions[i + 1] += (Math.random() - 0.5) * deformationStrength
      positions[i + 2] += (Math.random() - 0.5) * deformationStrength
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  }

  // Create hit effect
  private createHitEffect(position: THREE.Vector3, material: string, damage: number) {
    const particleCount = Math.min(damage * 2, 50)
    const particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, lifetime: number }[] = []

    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05)
      const particleColor = this.getParticleColor(material)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: particleColor,
        transparent: true,
        opacity: 0.8
      })

      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.copy(position)

      // Add random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      )

      particles.push({ mesh: particle, velocity, lifetime: 1.0 })
      this.scene.add(particle)
    }

    // Animate particles
    this.animateParticles(particles)
  }

  // Get particle color based on material
  private getParticleColor(material: string): number {
    switch (material) {
      case 'concrete': return 0x888888
      case 'wood': return 0x8B4513
      case 'metal': return 0x708090
      case 'glass': return 0x87CEEB
      case 'brick': return 0xB22222
      default: return 0x888888
    }
  }

  // Create destruction effect
  private createDestructionEffect(position: THREE.Vector3, material: string, destructionLevel: number) {
    const effect: DestructionEffect = {
      type: destructionLevel >= 3 ? 'collapse' : 'crack',
      position: position.clone(),
      intensity: destructionLevel,
      particles: destructionLevel * 20,
      screenShake: destructionLevel * 0.5
    }

    this.destructionEffects.push(effect)
    this.processDestructionEffect(effect)
  }

  // Process destruction effect
  private processDestructionEffect(effect: DestructionEffect) {
    // Create debris
    this.createDebris(effect.position, effect.particles, effect.intensity)

    // Add screen shake
    if (effect.screenShake > 0) {
      this.addScreenShake(effect.screenShake)
    }

    // Play sound effect
    this.playDestructionSound(effect.type)
  }

  // Create debris
  private createDebris(position: THREE.Vector3, count: number, intensity: number) {
    for (let i = 0; i < count; i++) {
      const debrisGeometry = new THREE.BoxGeometry(
        0.1 + Math.random() * 0.2,
        0.1 + Math.random() * 0.2,
        0.1 + Math.random() * 0.2
      )

      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.8
      })

      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial)
      debris.position.copy(position)

      // Add physics to debris
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10 * intensity,
        Math.random() * 8 * intensity,
        (Math.random() - 0.5) * 10 * intensity
      )

      debris.userData.velocity = velocity
      debris.userData.angularVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      )
      debris.userData.lifetime = 3.0 + Math.random() * 2.0

      this.activeDebris.push(debris)
      this.scene.add(debris)
    }
  }

  // Destroy object completely
  private destroyObject(object: DestructibleObject, hitPosition?: THREE.Vector3, forceDirection?: THREE.Vector3) {
    // Create large debris field
    const debrisCount = object.material === 'glass' ? 30 : 20
    this.createDebris(object.mesh.position, debrisCount, 3)

    // Remove from scene
    this.scene.remove(object.mesh)

    // Remove from physics
    if (object.rigidBody && this.physicsEngine) {
      this.physicsEngine.removeBody(object.rigidBody)
    }

    // Remove from destructible objects
    this.destructibleObjects.delete(object.id)

    // Update cover systems
    this.updateCoverSystems()
  }

  // Trigger explosion
  private triggerExplosion(object: DestructibleObject) {
    if (!object.explosionRadius || !object.explosionDamage) return

    const explosionPosition = object.mesh.position

    // Create explosion effect
    this.createExplosionEffect(explosionPosition, object.explosionRadius)

    // Apply damage to nearby objects
    this.destructibleObjects.forEach((nearbyObject, id) => {
      if (id === object.id) return

      const distance = explosionPosition.distanceTo(nearbyObject.mesh.position)
      if (distance <= object.explosionRadius!) {
        const damage = object.explosionDamage! * (1 - distance / object.explosionRadius!)
        const direction = nearbyObject.mesh.position.clone().sub(explosionPosition).normalize()
        this.applyDamage(id, damage, nearbyObject.mesh.position, direction)
      }
    })
  }

  // Create explosion effect
  private createExplosionEffect(position: THREE.Vector3, radius: number) {
    // Visual explosion
    const explosionGeometry = new THREE.SphereGeometry(radius, 16, 16)
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF4500,
      transparent: true,
      opacity: 0.8
    })

    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial)
    explosion.position.copy(position)
    this.scene.add(explosion)

    // Animate explosion
    const startTime = Date.now()
    const animateExplosion = () => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 0.5) {
        this.scene.remove(explosion)
        return
      }

      const scale = 1 + elapsed * 2
      explosion.scale.set(scale, scale, scale)
      explosion.material.opacity = 0.8 * (1 - elapsed * 2)

      requestAnimationFrame(animateExplosion)
    }
    animateExplosion()

    // Add screen shake
    this.addScreenShake(1.0)

    // Play explosion sound
    this.playDestructionSound('explosion')
  }

  // Animate particles
  private animateParticles(particles: any[]) {
    const animate = () => {
      particles.forEach((particle, index) => {
        particle.mesh.position.add(particle.velocity.clone().multiplyScalar(0.016))
        particle.velocity.y -= 9.8 * 0.016 // Gravity
        particle.lifetime -= 0.016

        if (particle.lifetime <= 0) {
          this.scene.remove(particle.mesh)
          particles.splice(index, 1)
        }
      })

      if (particles.length > 0) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  // Add screen shake
  private addScreenShake(intensity: number) {
    const originalPosition = this.camera.position.clone()
    const startTime = Date.now()
    const duration = 500 * intensity // milliseconds

    const shake = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > duration) {
        this.camera.position.copy(originalPosition)
        return
      }

      const progress = elapsed / duration
      const shakeIntensity = intensity * (1 - progress)

      this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity
      this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity

      requestAnimationFrame(shake)
    }
    shake()
  }

  // Play destruction sound
  private playDestructionSound(type: string) {
    // In a real implementation, you would play actual sound files
    console.log(`Playing ${type} sound effect`)
  }

  // Update active debris
  update(deltaTime: number) {
    // Update debris physics
    this.activeDebris.forEach((debris, index) => {
      if (debris.userData.velocity) {
        debris.position.add(debris.userData.velocity.clone().multiplyScalar(deltaTime))
        debris.userData.velocity.y -= 9.8 * deltaTime // Gravity

        if (debris.userData.angularVelocity) {
          debris.rotation.x += debris.userData.angularVelocity.x
          debris.rotation.y += debris.userData.angularVelocity.y
          debris.rotation.z += debris.userData.angularVelocity.z
        }

        debris.userData.lifetime -= deltaTime

        if (debris.userData.lifetime <= 0) {
          this.scene.remove(debris)
          this.activeDebris.splice(index, 1)
        }
      }
    })

    // Update destruction effects
    this.destructionEffects.forEach((effect, index) => {
      effect.intensity -= deltaTime * 2
      if (effect.intensity <= 0) {
        this.destructionEffects.splice(index, 1)
      }
    })
  }

  // Update cover systems
  private updateCoverSystems() {
    this.coverSystems = this.coverSystems.filter(cover => {
      // Check if cover is still valid (not destroyed by nearby destruction)
      let isValid = true

      this.destructibleObjects.forEach(object => {
        const distance = cover.position.distanceTo(object.mesh.position)
        if (distance < cover.radius && object.destructionLevel >= 2) {
          isValid = false
        }
      })

      return isValid
    })
  }

  // Get cover value at position
  getCoverValue(position: THREE.Vector3): number {
    let totalCover = 0

    // Check cover from destructible objects
    this.destructibleObjects.forEach(object => {
      const distance = position.distanceTo(object.mesh.position)
      if (distance < 3) { // Within cover range
        const coverFactor = 1 - (distance / 3)
        totalCover += object.coverValue * coverFactor * (1 - object.destructionLevel * 0.3)
      }
    })

    // Check procedural cover systems
    this.coverSystems.forEach(cover => {
      if (cover.isActive) {
        const distance = position.distanceTo(cover.position)
        if (distance < cover.radius) {
          const coverFactor = 1 - (distance / cover.radius)
          totalCover += cover.strength * coverFactor
        }
      }
    })

    return Math.min(totalCover, 0.9) // Max 90% cover
  }

  // Check if position has line of sight to another position
  hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const direction = to.clone().sub(from).normalize()
    const distance = from.distanceTo(to)
    const steps = Math.ceil(distance / 0.5) // Check every 0.5 units

    for (let i = 1; i < steps; i++) {
      const checkPos = from.clone().add(direction.clone().multiplyScalar(i * 0.5))
      const coverValue = this.getCoverValue(checkPos)

      if (coverValue > 0.7) { // 70%+ cover blocks line of sight
        return false
      }
    }

    return true
  }

  // Get all destructible objects
  getDestructibleObjects(): Map<string, DestructibleObject> {
    return new Map(this.destructibleObjects)
  }

  // Get object by ID
  getObject(id: string): DestructibleObject | undefined {
    return this.destructibleObjects.get(id)
  }

  // Clean up destroyed objects
  cleanup() {
    this.activeDebris.forEach(debris => {
      this.scene.remove(debris)
    })
    this.activeDebris = []

    this.destructibleObjects.forEach(object => {
      this.scene.remove(object.mesh)
    })
    this.destructibleObjects.clear()

    this.coverSystems = []
    this.destructionEffects = []
  }
}

export default GLXYDestructibleEnvironment