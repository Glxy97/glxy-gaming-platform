// @ts-nocheck
'use client'

import * as THREE from 'three'

// ULTIMATE GLXY Physics Engine - Shooter des Jahres!
export class GLXYPhysicsEngine {
  private scene: THREE.Scene
  private world: {
    gravity: THREE.Vector3
    objects: PhysicsObject[]
    collisions: Collision[]
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.world = {
      gravity: new THREE.Vector3(0, -9.81, 0),
      objects: [],
      collisions: []
    }
  }

  // Add physics object
  addPhysicsObject(mesh: THREE.Mesh, options: PhysicsOptions = {}): PhysicsObject {
    const physicsObject: PhysicsObject = {
      id: `physics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mesh,
      velocity: options.velocity || new THREE.Vector3(),
      acceleration: options.acceleration || new THREE.Vector3(),
      mass: options.mass || 1,
      friction: options.friction || 0.1,
      restitution: options.restitution || 0.3,
      isStatic: options.isStatic || false,
      isKinematic: options.isKinematic || false,
      useGravity: options.useGravity !== false,
      collisionLayers: options.collisionLayers || ['default'],
      onCollision: options.onCollision,
      onUpdate: options.onUpdate
    }

    this.world.objects.push(physicsObject)
    return physicsObject
  }

  // Remove physics object
  removePhysicsObject(id: string): void {
    const index = this.world.objects.findIndex(obj => obj.id === id)
    if (index !== -1) {
      this.world.objects.splice(index, 1)
    }
  }

  // Apply force to object
  applyForce(objectId: string, force: THREE.Vector3): void {
    const obj = this.world.objects.find(o => o.id === objectId)
    if (obj && !obj.isStatic) {
      const acceleration = force.clone().divideScalar(obj.mass)
      obj.velocity.add(acceleration)
    }
  }

  // Apply impulse to object (instant velocity change)
  applyImpulse(objectId: string, impulse: THREE.Vector3): void {
    const obj = this.world.objects.find(o => o.id === objectId)
    if (obj && !obj.isStatic) {
      obj.velocity.add(impulse.clone().divideScalar(obj.mass))
    }
  }

  // Explosion effect
  createExplosion(center: THREE.Vector3, radius: number, force: number): void {
    this.world.objects.forEach(obj => {
      if (obj.isStatic) return

      const distance = obj.mesh.position.distanceTo(center)
      if (distance < radius) {
        const direction = new THREE.Vector3().subVectors(obj.mesh.position, center).normalize()
        const forceMagnitude = force * (1 - distance / radius) // Falloff
        const explosionForce = direction.multiplyScalar(forceMagnitude)

        this.applyImpulse(obj.id, explosionForce)

        // Trigger collision callback
        if (obj.onCollision) {
          // Create a dummy object for explosion collision
          const dummyObject: PhysicsObject = {
            id: 'explosion_dummy',
            mesh: obj.mesh, // Use same mesh temporarily
            velocity: new THREE.Vector3(),
            acceleration: new THREE.Vector3(),
            mass: 1000,
            friction: 0,
            restitution: 0,
            isStatic: true,
            isKinematic: true,
            useGravity: false,
            collisionLayers: ['explosion']
          }

          obj.onCollision({
            object1: obj,
            object2: dummyObject,
            contactPoint: center,
            normal: direction,
            impulse: explosionForce,
            damage: forceMagnitude * 10
          })
        }
      }
    })

    // Create visual explosion effect
    this.createExplosionParticles(center, radius)
  }

  // Bullet physics with realistic ballistics
  createBullet(startPos: THREE.Vector3, direction: THREE.Vector3, speed: number, damage: number): BulletPhysics {
    const bulletGeometry = new THREE.SphereGeometry(0.05)
    const bulletMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1
    })
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
    bulletMesh.position.copy(startPos)
    this.scene.add(bulletMesh)

    const bullet: BulletPhysics = {
      id: `bullet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mesh: bulletMesh,
      velocity: direction.clone().multiplyScalar(speed),
      damage,
      trail: [],
      lifetime: 3000,
      created: Date.now(),
      penetration: 1,
      ricochetCount: 0
    }

    // Add physics object for bullet
    this.addPhysicsObject(bulletMesh, {
      velocity: bullet.velocity,
      mass: 0.01,
      friction: 0,
      restitution: 0.1,
      useGravity: true // Bullet drop
    })

    return bullet
  }

  // Advanced collision detection
  private checkCollisions(): void {
    this.world.collisions = []

    for (let i = 0; i < this.world.objects.length; i++) {
      for (let j = i + 1; j < this.world.objects.length; j++) {
        const obj1 = this.world.objects[i]
        const obj2 = this.world.objects[j]

        // Skip static-static collisions
        if (obj1.isStatic && obj2.isStatic) continue

        // Check layer collision
        if (!this.canLayersCollide(obj1.collisionLayers, obj2.collisionLayers)) continue

        // Bounding box collision
        const box1 = new THREE.Box3().setFromObject(obj1.mesh)
        const box2 = new THREE.Box3().setFromObject(obj2.mesh)

        if (box1.intersectsBox(box2)) {
          const collision = this.resolveCollision(obj1, obj2)
          if (collision) {
            this.world.collisions.push(collision)

            // Trigger callbacks
            if (obj1.onCollision) obj1.onCollision(collision)
            if (obj2.onCollision) obj2.onCollision({
              ...collision,
              object1: collision.object2,
              object2: collision.object1
            })
          }
        }
      }
    }
  }

  // Resolve collision with realistic physics
  private resolveCollision(obj1: PhysicsObject, obj2: PhysicsObject): Collision | null {
    // Calculate collision normal
    const normal = new THREE.Vector3().subVectors(obj2.mesh.position, obj1.mesh.position).normalize()

    // Relative velocity
    const relativeVelocity = new THREE.Vector3().subVectors(obj2.velocity, obj1.velocity)
    const velocityAlongNormal = relativeVelocity.dot(normal)

    // Don't resolve if objects are separating
    if (velocityAlongNormal > 0) return null

    // Calculate restitution (bounciness)
    const restitution = Math.min(obj1.restitution, obj2.restitution)

    // Calculate impulse scalar
    const impulseScalar = -(1 + restitution) * velocityAlongNormal
    const totalMass = obj1.mass + obj2.mass
    const impulse = normal.multiplyScalar(impulseScalar)

    // Apply impulse to objects
    if (!obj1.isStatic && !obj1.isKinematic) {
      obj1.velocity.add(impulse.clone().multiplyScalar(obj2.mass / totalMass).divideScalar(obj1.mass))
    }
    if (!obj2.isStatic && !obj2.isKinematic) {
      obj2.velocity.sub(impulse.clone().multiplyScalar(obj1.mass / totalMass).divideScalar(obj2.mass))
    }

    // Calculate contact point (simplified)
    const contactPoint = new THREE.Vector3().lerpVectors(obj1.mesh.position, obj2.mesh.position, 0.5)

    return {
      object1: obj1,
      object2: obj2,
      contactPoint,
      normal,
      impulse,
      damage: impulse.length() * 5
    }
  }

  // Update physics simulation
  update(deltaTime: number): void {
    // Update each physics object
    this.world.objects.forEach(obj => {
      if (obj.isStatic || obj.isKinematic) return

      // Apply gravity
      if (obj.useGravity) {
        obj.velocity.add(this.world.gravity.clone().multiplyScalar(deltaTime))
      }

      // Apply friction
      if (obj.friction > 0) {
        const friction = obj.velocity.clone().multiplyScalar(-obj.friction * deltaTime)
        obj.velocity.add(friction)
      }

      // Update position
      const deltaPos = obj.velocity.clone().multiplyScalar(deltaTime)
      obj.mesh.position.add(deltaPos)

      // Ground collision
      if (obj.mesh.position.y < 0.5) {
        obj.mesh.position.y = 0.5
        obj.velocity.y = Math.abs(obj.velocity.y) * obj.restitution
        obj.velocity.x *= (1 - obj.friction)
        obj.velocity.z *= (1 - obj.friction)
      }

      // Boundary collision
      const boundary = 100
      if (Math.abs(obj.mesh.position.x) > boundary) {
        obj.mesh.position.x = Math.sign(obj.mesh.position.x) * boundary
        obj.velocity.x *= -obj.restitution
      }
      if (Math.abs(obj.mesh.position.z) > boundary) {
        obj.mesh.position.z = Math.sign(obj.mesh.position.z) * boundary
        obj.velocity.z *= -obj.restitution
      }

      // Update callback
      if (obj.onUpdate) {
        obj.onUpdate(obj, deltaTime)
      }
    })

    // Check collisions
    this.checkCollisions()
  }

  // Helper methods
  private canLayersCollide(layers1: string[], layers2: string[]): boolean {
    return layers1.some(layer => layers2.includes(layer))
  }

  private createExplosionParticles(center: THREE.Vector3, radius: number): void {
    const particleCount = 20
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.2)
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.5),
        emissive: 0xff6600,
        emissiveIntensity: 0.8
      })
      const particle = new THREE.Mesh(geometry, material)
      particle.position.copy(center)

      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ).normalize()

      this.addPhysicsObject(particle, {
        velocity: direction.multiplyScalar(10 + Math.random() * 20),
        mass: 0.1,
        friction: 0.5,
        restitution: 0.2,
        useGravity: true
      })

      this.scene.add(particle)

      // Remove particle after 2 seconds
      setTimeout(() => {
        this.scene.remove(particle)
        this.removePhysicsObject(particle.uuid)
      }, 2000)
    }
  }

  // Get physics stats
  getPhysicsStats(): PhysicsStats {
    return {
      totalObjects: this.world.objects.length,
      activeObjects: this.world.objects.filter(obj => !obj.isStatic).length,
      collisionCount: this.world.collisions.length,
      performance: {
        updateRate: 60, // Target FPS
        memoryUsage: this.world.objects.length * 64 // Estimated KB
      }
    }
  }

  // Cleanup
  cleanup(): void {
    this.world.objects.forEach(obj => {
      if (obj.mesh.parent) {
        obj.mesh.parent.remove(obj.mesh)
      }
    })
    this.world.objects = []
    this.world.collisions = []
  }
}

// Types
export interface PhysicsObject {
  id: string
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  mass: number
  friction: number
  restitution: number
  isStatic: boolean
  isKinematic: boolean
  useGravity: boolean
  collisionLayers: string[]
  onCollision?: (collision: Collision) => void
  onUpdate?: (obj: PhysicsObject, deltaTime: number) => void
}

export interface Collision {
  object1: PhysicsObject
  object2: PhysicsObject
  contactPoint: THREE.Vector3
  normal: THREE.Vector3
  impulse: THREE.Vector3
  damage: number
}

export interface PhysicsOptions {
  velocity?: THREE.Vector3
  acceleration?: THREE.Vector3
  mass?: number
  friction?: number
  restitution?: number
  isStatic?: boolean
  isKinematic?: boolean
  useGravity?: boolean
  collisionLayers?: string[]
  onCollision?: (collision: Collision) => void
  onUpdate?: (obj: PhysicsObject, deltaTime: number) => void
}

export interface BulletPhysics {
  id: string
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  damage: number
  trail: THREE.Vector3[]
  lifetime: number
  created: number
  penetration: number
  ricochetCount: number
}

export interface PhysicsStats {
  totalObjects: number
  activeObjects: number
  collisionCount: number
  performance: {
    updateRate: number
    memoryUsage: number
  }
}

export default GLXYPhysicsEngine