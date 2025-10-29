/**
 * ⚛️ PHYSICS ENGINE
 * Professional Physics Simulation for FPS Game
 *
 * @remarks
 * Complete physics system with:
 * - Collision Detection (Broadphase + Narrowphase)
 * - Collision Resolution (Impulse-based)
 * - Bullet Physics (Ballistics, Penetration, Ricochet)
 * - Explosion System (Force, Damage, Falloff)
 * - Material System (9 presets)
 * - Raycasting
 * - Performance Optimization (Spatial Hash, Object Pooling, Sleeping)
 *
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import * as THREE from 'three'
import {
  PhysicsObjectType,
  CollisionLayer,
  ForceMode,
  PhysicsObjectData,
  CollisionData,
  BulletPhysicsData,
  ExplosionData,
  RaycastResult,
  PhysicsStats,
  PhysicsWorldSettings,
  PhysicsMaterial,
  DEFAULT_PHYSICS_SETTINGS,
  PHYSICS_MATERIALS,
  createPhysicsObject,
  createBulletPhysics,
  createExplosion,
  calculateExplosionForce,
  canLayersCollide,
  calculateDamageFalloff,
  calculateBulletDrop,
  isInExplosionRadius,
  validatePhysicsSettings
} from './data/PhysicsData'

// ============================================================
// TYPES
// ============================================================

interface SpatialHashCell {
  objects: PhysicsObjectData[]
}

type CollisionCallback = (collision: CollisionData) => void

// ============================================================
// PHYSICS ENGINE
// ============================================================

export class PhysicsEngine {
  // Configuration
  private settings: PhysicsWorldSettings
  private running: boolean = false

  // Physics Objects
  private objects: Map<string, PhysicsObjectData> = new Map()
  private bullets: Map<string, BulletPhysicsData> = new Map()

  // Spatial Hashing (for broadphase collision detection)
  private spatialHash: Map<string, SpatialHashCell> = new Map()
  private cellSize: number = 10 // meters

  // Collision Tracking
  private activeCollisions: Map<string, CollisionData> = new Map()
  private collisionCallbacks: CollisionCallback[] = []

  // Performance
  private stats: PhysicsStats = {
    totalObjects: 0,
    activeObjects: 0,
    sleepingObjects: 0,
    staticObjects: 0,
    collisionChecks: 0,
    activeCollisions: 0,
    triggerEvents: 0,
    updateTime: 0,
    fps: 60,
    memoryUsage: 0
  }

  // Timing
  private lastUpdateTime: number = 0
  private accumulator: number = 0

  // Scene reference
  private scene: THREE.Scene | null = null

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(settings: Partial<PhysicsWorldSettings> = {}) {
    this.settings = { ...DEFAULT_PHYSICS_SETTINGS, ...settings }

    if (!validatePhysicsSettings(this.settings)) {
      console.error('❌ Invalid physics settings, using defaults')
      this.settings = { ...DEFAULT_PHYSICS_SETTINGS }
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  public setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  public start(): void {
    this.running = true
    this.lastUpdateTime = performance.now()
  }

  public stop(): void {
    this.running = false
  }

  public isRunning(): boolean {
    return this.running
  }

  // ============================================================
  // OBJECT MANAGEMENT
  // ============================================================

  public addObject(object: PhysicsObjectData): void {
    this.objects.set(object.id, object)
    this.addToSpatialHash(object)
    this.updateStats()
  }

  public removeObject(id: string): void {
    const object = this.objects.get(id)
    if (object) {
      this.removeFromSpatialHash(object)
      this.objects.delete(id)
      this.updateStats()
    }
  }

  public getObject(id: string): PhysicsObjectData | undefined {
    return this.objects.get(id)
  }

  public getAllObjects(): PhysicsObjectData[] {
    return Array.from(this.objects.values())
  }

  // ============================================================
  // BULLET MANAGEMENT
  // ============================================================

  public addBullet(bullet: BulletPhysicsData): void {
    this.bullets.set(bullet.id, bullet)

    // Add to scene
    if (this.scene) {
      this.scene.add(bullet.mesh)
    }
  }

  public removeBullet(id: string): void {
    const bullet = this.bullets.get(id)
    if (bullet) {
      // Remove from scene
      if (this.scene) {
        this.scene.remove(bullet.mesh)
      }

      this.bullets.delete(id)
    }
  }

  public getBullet(id: string): BulletPhysicsData | undefined {
    return this.bullets.get(id)
  }

  // ============================================================
  // SPATIAL HASHING
  // ============================================================

  private getSpatialHashKey(position: THREE.Vector3): string {
    const x = Math.floor(position.x / this.cellSize)
    const y = Math.floor(position.y / this.cellSize)
    const z = Math.floor(position.z / this.cellSize)
    return `${x},${y},${z}`
  }

  private addToSpatialHash(object: PhysicsObjectData): void {
    const key = this.getSpatialHashKey(object.mesh.position)
    const cell = this.spatialHash.get(key) || { objects: [] }
    cell.objects.push(object)
    this.spatialHash.set(key, cell)
  }

  private removeFromSpatialHash(object: PhysicsObjectData): void {
    const key = this.getSpatialHashKey(object.mesh.position)
    const cell = this.spatialHash.get(key)
    if (cell) {
      cell.objects = cell.objects.filter(obj => obj.id !== object.id)
      if (cell.objects.length === 0) {
        this.spatialHash.delete(key)
      }
    }
  }

  private getNearbyObjects(position: THREE.Vector3): PhysicsObjectData[] {
    const nearby: PhysicsObjectData[] = []
    const centerKey = this.getSpatialHashKey(position)

    // Check center cell and adjacent cells
    const [cx, cy, cz] = centerKey.split(',').map(Number)
    for (let x = cx - 1; x <= cx + 1; x++) {
      for (let y = cy - 1; y <= cy + 1; y++) {
        for (let z = cz - 1; z <= cz + 1; z++) {
          const key = `${x},${y},${z}`
          const cell = this.spatialHash.get(key)
          if (cell) {
            nearby.push(...cell.objects)
          }
        }
      }
    }

    return nearby
  }

  // ============================================================
  // MAIN UPDATE
  // ============================================================

  public update(deltaTime: number): void {
    if (!this.running) {
      return
    }

    const startTime = performance.now()

    // Fixed timestep with accumulator
    this.accumulator += deltaTime

    let steps = 0
    while (this.accumulator >= this.settings.timeStep && steps < this.settings.maxSubSteps) {
      this.fixedUpdate(this.settings.timeStep)
      this.accumulator -= this.settings.timeStep
      steps++
    }

    // Update stats
    const endTime = performance.now()
    this.stats.updateTime = endTime - startTime
    this.stats.fps = Math.round(1000 / (endTime - startTime))
  }

  private fixedUpdate(deltaTime: number): void {
    // Reset collision checks
    this.stats.collisionChecks = 0

    // Update physics objects
    this.updateObjects(deltaTime)

    // Update bullets
    this.updateBullets(deltaTime)

    // Collision detection
    this.detectCollisions()

    // Update spatial hash
    this.updateSpatialHash()
  }

  // ============================================================
  // OBJECT UPDATES
  // ============================================================

  private updateObjects(deltaTime: number): void {
    for (const object of this.objects.values()) {
      // Skip static objects
      if (object.type === PhysicsObjectType.STATIC) {
        continue
      }

      // Call custom update callback
      if (object.onUpdate) {
        object.onUpdate(object, deltaTime)
      }

      // Skip kinematic objects (controlled by code)
      if (object.type === PhysicsObjectType.KINEMATIC) {
        continue
      }

      // Apply gravity
      if (object.useGravity) {
        object.acceleration.add(
          this.settings.gravity.clone().multiplyScalar(deltaTime)
        )
      }

      // Apply drag
      if (object.drag > 0) {
        const dragForce = object.velocity.clone().multiplyScalar(-object.drag)
        object.velocity.add(dragForce.multiplyScalar(deltaTime))
      }

      // Update velocity
      object.velocity.add(object.acceleration.clone().multiplyScalar(deltaTime))

      // Update position
      const movement = object.velocity.clone().multiplyScalar(deltaTime)
      object.mesh.position.add(movement)

      // Update rotation
      if (object.angularVelocity.length() > 0) {
        object.mesh.rotation.x += object.angularVelocity.x * deltaTime
        object.mesh.rotation.y += object.angularVelocity.y * deltaTime
        object.mesh.rotation.z += object.angularVelocity.z * deltaTime
      }

      // Reset acceleration
      object.acceleration.set(0, 0, 0)

      // Check world bounds
      this.checkWorldBounds(object)
    }
  }

  // ============================================================
  // BULLET UPDATES
  // ============================================================

  private updateBullets(deltaTime: number): void {
    const bulletsToRemove: string[] = []

    for (const bullet of this.bullets.values()) {
      // Check lifetime
      const age = Date.now() - bullet.created
      if (age >= bullet.lifetime) {
        bulletsToRemove.push(bullet.id)
        continue
      }

      // Check max distance
      if (bullet.distanceTraveled >= bullet.maxDistance) {
        bulletsToRemove.push(bullet.id)
        continue
      }

      // Apply drag
      if (bullet.drag > 0) {
        const dragFactor = 1 - bullet.drag * deltaTime
        bullet.velocity.multiplyScalar(dragFactor)
      }

      // Apply gravity (bullet drop)
      if (bullet.gravity) {
        const drop = calculateBulletDrop(bullet.velocity, this.settings.gravity.y, deltaTime)
        bullet.velocity.y += drop
      }

      // Update position
      const movement = bullet.velocity.clone().multiplyScalar(deltaTime)
      bullet.mesh.position.add(movement)
      bullet.distanceTraveled += movement.length()

      // Update trail
      bullet.trail.push(bullet.mesh.position.clone())
      if (bullet.trail.length > bullet.maxTrailLength) {
        bullet.trail.shift()
      }

      // Check bullet collisions
      this.checkBulletCollisions(bullet)
    }

    // Remove dead bullets
    for (const id of bulletsToRemove) {
      this.removeBullet(id)
    }
  }

  private checkBulletCollisions(bullet: BulletPhysicsData): void {
    const nearby = this.getNearbyObjects(bullet.mesh.position)

    for (const object of nearby) {
      // Skip if already hit
      if (bullet.hitObjects.includes(object.id)) {
        continue
      }

      // Check collision layers
      if (!canLayersCollide([CollisionLayer.BULLET], object.collisionLayers)) {
        continue
      }

      // Simple sphere collision
      const distance = bullet.mesh.position.distanceTo(object.mesh.position)
      const collisionDistance = 0.5 // Approximate collision radius

      if (distance < collisionDistance) {
        this.handleBulletHit(bullet, object)
      }
    }
  }

  private handleBulletHit(bullet: BulletPhysicsData, object: PhysicsObjectData): void {
    bullet.hitObjects.push(object.id)

    // Calculate damage with falloff
    const damage = calculateDamageFalloff(
      bullet.damage,
      bullet.distanceTraveled,
      bullet.maxDistance,
      0.5
    )

    // Apply impulse to object
    if (object.type === PhysicsObjectType.DYNAMIC) {
      const impulse = bullet.velocity.clone().normalize().multiplyScalar(damage * 0.1)
      object.velocity.add(impulse)
    }

    // Penetration
    if (bullet.penetrationsRemaining > 0) {
      bullet.penetrationsRemaining--
      bullet.damage *= 0.7 // Reduce damage after penetration
    } else {
      // Ricochet chance
      if (Math.random() < bullet.ricochetChance && bullet.richochetsRemaining > 0) {
        bullet.richochetsRemaining--
        // Reflect velocity
        const normal = object.mesh.position.clone()
          .sub(bullet.mesh.position)
          .normalize()
        bullet.velocity.reflect(normal)
        bullet.velocity.multiplyScalar(0.6) // Lose some energy
      } else {
        // Remove bullet
        this.removeBullet(bullet.id)
      }
    }

    // Collision callback
    if (object.onCollision) {
      const collisionData: CollisionData = {
        object1: createPhysicsObject(bullet.mesh, PhysicsObjectType.DYNAMIC, PHYSICS_MATERIALS.BULLET),
        object2: object,
        contactPoint: bullet.mesh.position.clone(),
        normal: object.mesh.position.clone().sub(bullet.mesh.position).normalize(),
        penetrationDepth: 0.1,
        impulse: bullet.velocity.clone(),
        relativeVelocity: bullet.velocity.clone(),
        damage,
        timestamp: Date.now()
      }
      object.onCollision(collisionData)
    }
  }

  // ============================================================
  // COLLISION DETECTION
  // ============================================================

  private detectCollisions(): void {
    const dynamicObjects = Array.from(this.objects.values()).filter(
      obj => obj.type === PhysicsObjectType.DYNAMIC
    )

    for (const obj1 of dynamicObjects) {
      const nearby = this.getNearbyObjects(obj1.mesh.position)

      for (const obj2 of nearby) {
        // Skip self
        if (obj1.id === obj2.id) {
          continue
        }

        // Skip if both are dynamic (handled once)
        if (obj2.type === PhysicsObjectType.DYNAMIC && obj1.id > obj2.id) {
          continue
        }

        // Check collision layers
        if (!canLayersCollide(obj1.collisionLayers, obj2.collisionLayers)) {
          continue
        }

        this.stats.collisionChecks++

        // AABB collision test
        if (this.checkAABBCollision(obj1, obj2)) {
          this.resolveCollision(obj1, obj2)
        }
      }
    }

    this.stats.activeCollisions = this.activeCollisions.size
  }

  private checkAABBCollision(obj1: PhysicsObjectData, obj2: PhysicsObjectData): boolean {
    const box1 = new THREE.Box3().setFromObject(obj1.mesh)
    const box2 = new THREE.Box3().setFromObject(obj2.mesh)
    return box1.intersectsBox(box2)
  }

  private resolveCollision(obj1: PhysicsObjectData, obj2: PhysicsObjectData): void {
    // Calculate collision normal
    const normal = obj2.mesh.position.clone()
      .sub(obj1.mesh.position)
      .normalize()

    // Calculate relative velocity
    const relativeVelocity = obj1.velocity.clone().sub(obj2.velocity)
    const velocityAlongNormal = relativeVelocity.dot(normal)

    // Objects moving apart, no collision
    if (velocityAlongNormal > 0) {
      return
    }

    // Calculate restitution (bounciness)
    const restitution = Math.min(obj1.restitution, obj2.restitution)

    // Calculate impulse magnitude
    const impulseMagnitude = -(1 + restitution) * velocityAlongNormal
    const totalMass = obj1.mass + obj2.mass
    const impulse = normal.clone().multiplyScalar(impulseMagnitude / totalMass)

    // Apply impulse
    if (obj1.type === PhysicsObjectType.DYNAMIC) {
      obj1.velocity.add(impulse.clone().multiplyScalar(obj2.mass))
    }

    if (obj2.type === PhysicsObjectType.DYNAMIC) {
      obj2.velocity.sub(impulse.clone().multiplyScalar(obj1.mass))
    }

    // Apply friction
    const tangent = relativeVelocity.clone()
      .sub(normal.clone().multiplyScalar(velocityAlongNormal))
      .normalize()

    const frictionMagnitude = Math.sqrt(obj1.friction * obj2.friction) * impulseMagnitude
    const frictionImpulse = tangent.multiplyScalar(frictionMagnitude / totalMass)

    if (obj1.type === PhysicsObjectType.DYNAMIC) {
      obj1.velocity.sub(frictionImpulse.clone().multiplyScalar(obj2.mass))
    }

    if (obj2.type === PhysicsObjectType.DYNAMIC) {
      obj2.velocity.add(frictionImpulse.clone().multiplyScalar(obj1.mass))
    }

    // Create collision data
    const collisionData: CollisionData = {
      object1: obj1,
      object2: obj2,
      contactPoint: obj1.mesh.position.clone().lerp(obj2.mesh.position, 0.5),
      normal,
      penetrationDepth: 0.1,
      impulse,
      relativeVelocity,
      damage: impulse.length() * 10,
      timestamp: Date.now()
    }

    // Store collision
    const collisionKey = `${obj1.id}-${obj2.id}`
    this.activeCollisions.set(collisionKey, collisionData)

    // Callbacks
    if (obj1.onCollision) {
      obj1.onCollision(collisionData)
    }

    if (obj2.onCollision) {
      obj2.onCollision({
        ...collisionData,
        object1: obj2,
        object2: obj1,
        normal: normal.clone().negate()
      })
    }

    // Notify listeners
    this.collisionCallbacks.forEach(cb => cb(collisionData))
  }

  // ============================================================
  // EXPLOSIONS
  // ============================================================

  public createExplosion(
    center: THREE.Vector3,
    radius: number = 5,
    force: number = 1000,
    damage: number = 100
  ): void {
    const explosion = createExplosion(center, radius, force, damage)
    this.applyExplosion(explosion)
  }

  public applyExplosion(explosion: ExplosionData): void {
    for (const object of this.objects.values()) {
      // Check layers
      if (!explosion.layers.some(layer => object.collisionLayers.includes(layer))) {
        continue
      }

      // Check distance
      if (!isInExplosionRadius(object.mesh.position, explosion.center, explosion.radius)) {
        continue
      }

      // Calculate force
      const explosionForce = calculateExplosionForce(
        explosion.center,
        object.mesh.position,
        explosion.force,
        explosion.radius,
        explosion.falloffType
      )

      // Apply force to dynamic objects
      if (object.type === PhysicsObjectType.DYNAMIC) {
        object.velocity.add(explosionForce.multiplyScalar(1 / object.mass))
      }

      // Calculate damage
      const distance = object.mesh.position.distanceTo(explosion.center)
      const damageFalloff = 1 - (distance / explosion.radius)
      const actualDamage = explosion.damage * damageFalloff

      // Collision callback with damage
      if (object.onCollision) {
        const collisionData: CollisionData = {
          object1: object,
          object2: object,
          contactPoint: explosion.center,
          normal: explosionForce.clone().normalize(),
          penetrationDepth: 0,
          impulse: explosionForce,
          relativeVelocity: new THREE.Vector3(),
          damage: actualDamage,
          timestamp: Date.now()
        }
        object.onCollision(collisionData)
      }
    }
  }

  // ============================================================
  // RAYCASTING
  // ============================================================

  public raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 1000,
    layers: CollisionLayer[] = [CollisionLayer.DEFAULT]
  ): RaycastResult {
    if (!this.scene) {
      return {
        hit: false,
        point: new THREE.Vector3(),
        normal: new THREE.Vector3(),
        distance: 0,
        object: null
      }
    }

    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDistance)
    const intersects = raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0) {
      const hit = intersects[0]

      // Find physics object
      let physicsObject: PhysicsObjectData | null = null
      for (const obj of this.objects.values()) {
        if (obj.mesh === hit.object || obj.mesh.children.includes(hit.object as THREE.Object3D)) {
          // Check layers
          if (canLayersCollide(layers, obj.collisionLayers)) {
            physicsObject = obj
            break
          }
        }
      }

      return {
        hit: true,
        point: hit.point,
        normal: hit.face?.normal || new THREE.Vector3(0, 1, 0),
        distance: hit.distance,
        object: physicsObject,
        userData: hit.object.userData
      }
    }

    return {
      hit: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      distance: 0,
      object: null
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  private checkWorldBounds(object: PhysicsObjectData): void {
    const pos = object.mesh.position

    // Check boundaries
    if (pos.x < this.settings.worldMin.x || pos.x > this.settings.worldMax.x ||
        pos.y < this.settings.worldMin.y || pos.y > this.settings.worldMax.y ||
        pos.z < this.settings.worldMin.z || pos.z > this.settings.worldMax.z) {

      // Clamp position
      pos.clamp(this.settings.worldMin, this.settings.worldMax)

      // Apply restitution
      object.velocity.multiplyScalar(-this.settings.boundsRestitution)
    }
  }

  private updateSpatialHash(): void {
    // Clear spatial hash
    this.spatialHash.clear()

    // Re-add all objects
    for (const object of this.objects.values()) {
      this.addToSpatialHash(object)
    }
  }

  private updateStats(): void {
    this.stats.totalObjects = this.objects.size
    this.stats.activeObjects = Array.from(this.objects.values()).filter(
      obj => obj.type !== PhysicsObjectType.STATIC
    ).length
    this.stats.staticObjects = Array.from(this.objects.values()).filter(
      obj => obj.type === PhysicsObjectType.STATIC
    ).length
  }

  // ============================================================
  // EVENTS
  // ============================================================

  public onCollision(callback: CollisionCallback): () => void {
    this.collisionCallbacks.push(callback)
    return () => {
      const index = this.collisionCallbacks.indexOf(callback)
      if (index > -1) {
        this.collisionCallbacks.splice(index, 1)
      }
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  public getStats(): PhysicsStats {
    return { ...this.stats }
  }

  public getSettings(): PhysicsWorldSettings {
    return { ...this.settings }
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  public clear(): void {
    this.objects.clear()
    this.bullets.clear()
    this.spatialHash.clear()
    this.activeCollisions.clear()
    this.updateStats()
  }

  public destroy(): void {
    this.stop()
    this.clear()
    this.collisionCallbacks = []
    this.scene = null
  }
}
