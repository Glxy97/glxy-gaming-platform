/**
 * ⚛️ PHYSICS DATA SYSTEM
 * Data-Driven Architecture for FPS Physics Engine
 *
 * @remarks
 * Integrated from GLXYPhysicsEngine.tsx (Oct 29, 2025)
 * Realistic physics simulation with collisions, explosions, and ballistics
 */

import * as THREE from 'three'

// ============================================================
// ENUMS
// ============================================================

export enum PhysicsObjectType {
  STATIC = 'static',           // Immovable (terrain, buildings)
  KINEMATIC = 'kinematic',     // Controlled by animation/code
  DYNAMIC = 'dynamic'          // Affected by forces
}

export enum CollisionLayer {
  DEFAULT = 'default',
  PLAYER = 'player',
  ENEMY = 'enemy',
  BULLET = 'bullet',
  EXPLOSION = 'explosion',
  ENVIRONMENT = 'environment',
  TRIGGER = 'trigger',
  DEBRIS = 'debris'
}

export enum ForceMode {
  FORCE = 'force',           // Continuous force (affected by mass)
  IMPULSE = 'impulse',       // Instant velocity change (affected by mass)
  VELOCITY = 'velocity',     // Set velocity directly
  ACCELERATION = 'acceleration' // Set acceleration directly
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * Physics Object Definition
 */
export interface PhysicsObjectData {
  id: string
  mesh: THREE.Mesh

  // Physics Properties
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  angularVelocity: THREE.Vector3

  // Material Properties
  mass: number                 // kg
  friction: number             // 0-1 (0 = no friction, 1 = max friction)
  restitution: number          // 0-1 (0 = no bounce, 1 = perfect bounce)
  drag: number                 // Air resistance (0 = no drag)

  // Object Type & Behavior
  type: PhysicsObjectType
  useGravity: boolean
  collisionLayers: CollisionLayer[]

  // Callbacks
  onCollision?: (collision: CollisionData) => void
  onTriggerEnter?: (other: PhysicsObjectData) => void
  onTriggerExit?: (other: PhysicsObjectData) => void
  onUpdate?: (obj: PhysicsObjectData, deltaTime: number) => void

  // Metadata
  userData?: Record<string, any>
}

/**
 * Collision Data
 */
export interface CollisionData {
  object1: PhysicsObjectData
  object2: PhysicsObjectData
  contactPoint: THREE.Vector3
  normal: THREE.Vector3
  penetrationDepth: number
  impulse: THREE.Vector3
  relativeVelocity: THREE.Vector3
  damage: number
  timestamp: number
}

/**
 * Bullet Physics Data
 */
export interface BulletPhysicsData {
  id: string
  mesh: THREE.Mesh

  // Ballistics
  velocity: THREE.Vector3
  initialVelocity: number      // m/s
  drag: number                 // Air resistance
  gravity: boolean             // Bullet drop

  // Damage & Penetration
  damage: number
  penetrationPower: number     // How many objects can penetrate
  ricochetChance: number       // 0-1 chance to ricochet

  // Lifetime
  maxDistance: number          // meters
  lifetime: number             // milliseconds
  created: number              // timestamp
  distanceTraveled: number

  // Trail & Effects
  trail: THREE.Vector3[]
  maxTrailLength: number

  // Penetration & Ricochet State
  penetrationsRemaining: number
  richochetsRemaining: number

  // Hit Tracking
  hitObjects: string[]         // IDs of hit objects
}

/**
 * Explosion Data
 */
export interface ExplosionData {
  center: THREE.Vector3
  radius: number               // meters
  force: number                // Newtons
  damage: number
  falloffType: 'linear' | 'quadratic' | 'cubic'
  layers: CollisionLayer[]     // Which layers are affected

  // Visual Effects
  particleCount: number
  particleSpeed: number
  particleLifetime: number
  lightIntensity: number
  lightColor: THREE.Color
  shakeIntensity: number
}

/**
 * Ragdoll Physics Data
 */
export interface RagdollData {
  id: string
  bones: RagdollBone[]
  constraints: RagdollConstraint[]
  blendWeight: number          // 0-1 (0 = animation, 1 = physics)
}

export interface RagdollBone {
  name: string
  mesh: THREE.Mesh
  physicsObject: PhysicsObjectData
  parentBone: string | null
}

export interface RagdollConstraint {
  boneA: string
  boneB: string
  type: 'hinge' | 'ball-socket' | 'fixed'
  limits: {
    min: THREE.Vector3
    max: THREE.Vector3
  }
}

/**
 * Physics World Settings
 */
export interface PhysicsWorldSettings {
  // Gravity
  gravity: THREE.Vector3       // Default: (0, -9.81, 0)

  // Simulation
  timeStep: number             // Fixed timestep (1/60 = 0.0166)
  maxSubSteps: number          // Max physics updates per frame
  velocityIterations: number   // Collision resolution accuracy
  positionIterations: number   // Position correction accuracy

  // Performance
  sleepThreshold: number       // Objects below this velocity sleep
  sleepTimeout: number         // Time before sleeping (seconds)
  maxActiveObjects: number     // Max simulated objects

  // Collision Detection
  broadPhaseType: 'naive' | 'spatial-hash' | 'bvh'
  narrowPhaseType: 'aabb' | 'obb' | 'sphere' | 'mesh'

  // World Bounds
  worldMin: THREE.Vector3
  worldMax: THREE.Vector3
  boundsRestitution: number    // Bounce off bounds

  // Debug
  showDebugInfo: boolean
  showCollisionShapes: boolean
  showContactPoints: boolean
}

/**
 * Physics Material Preset
 */
export interface PhysicsMaterial {
  name: string
  friction: number
  restitution: number
  density: number              // kg/m³
  drag: number
}

/**
 * Raycast Result
 */
export interface RaycastResult {
  hit: boolean
  point: THREE.Vector3
  normal: THREE.Vector3
  distance: number
  object: PhysicsObjectData | null
  userData?: Record<string, any>
}

/**
 * Physics Stats
 */
export interface PhysicsStats {
  // Object Counts
  totalObjects: number
  activeObjects: number
  sleepingObjects: number
  staticObjects: number

  // Collision Stats
  collisionChecks: number
  activeCollisions: number
  triggerEvents: number

  // Performance
  updateTime: number           // milliseconds
  fps: number
  memoryUsage: number          // KB
}

// ============================================================
// PHYSICS MATERIAL PRESETS
// ============================================================

export const PHYSICS_MATERIALS: Record<string, PhysicsMaterial> = {
  // Ground Materials
  CONCRETE: {
    name: 'Concrete',
    friction: 0.8,
    restitution: 0.2,
    density: 2400,
    drag: 0.0
  },
  WOOD: {
    name: 'Wood',
    friction: 0.6,
    restitution: 0.4,
    density: 700,
    drag: 0.0
  },
  METAL: {
    name: 'Metal',
    friction: 0.4,
    restitution: 0.3,
    density: 7800,
    drag: 0.0
  },
  ICE: {
    name: 'Ice',
    friction: 0.05,
    restitution: 0.1,
    density: 920,
    drag: 0.0
  },
  RUBBER: {
    name: 'Rubber',
    friction: 0.9,
    restitution: 0.8,
    density: 1100,
    drag: 0.0
  },

  // Character/Object Materials
  PLAYER: {
    name: 'Player',
    friction: 0.6,
    restitution: 0.0,
    density: 1000,
    drag: 0.1
  },
  RAGDOLL: {
    name: 'Ragdoll',
    friction: 0.5,
    restitution: 0.1,
    density: 1000,
    drag: 0.3
  },
  DEBRIS: {
    name: 'Debris',
    friction: 0.7,
    restitution: 0.3,
    density: 500,
    drag: 0.2
  },

  // Projectiles
  BULLET: {
    name: 'Bullet',
    friction: 0.0,
    restitution: 0.1,
    density: 11340,         // Lead
    drag: 0.05
  },
  GRENADE: {
    name: 'Grenade',
    friction: 0.6,
    restitution: 0.4,
    density: 1500,
    drag: 0.1
  }
}

// ============================================================
// DEFAULT PHYSICS SETTINGS
// ============================================================

export const DEFAULT_PHYSICS_SETTINGS: PhysicsWorldSettings = {
  // Gravity (Earth standard)
  gravity: new THREE.Vector3(0, -9.81, 0),

  // Simulation (60 FPS physics)
  timeStep: 1 / 60,
  maxSubSteps: 3,
  velocityIterations: 8,
  positionIterations: 3,

  // Performance
  sleepThreshold: 0.1,
  sleepTimeout: 0.5,
  maxActiveObjects: 500,

  // Collision Detection
  broadPhaseType: 'spatial-hash',
  narrowPhaseType: 'aabb',

  // World Bounds (100m x 100m x 100m)
  worldMin: new THREE.Vector3(-100, -10, -100),
  worldMax: new THREE.Vector3(100, 100, 100),
  boundsRestitution: 0.3,

  // Debug
  showDebugInfo: false,
  showCollisionShapes: false,
  showContactPoints: false
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create physics object from mesh
 */
export function createPhysicsObject(
  mesh: THREE.Mesh,
  type: PhysicsObjectType = PhysicsObjectType.DYNAMIC,
  material: PhysicsMaterial = PHYSICS_MATERIALS.CONCRETE
): PhysicsObjectData {
  // Calculate mass from volume and density (simplified)
  const boundingBox = new THREE.Box3().setFromObject(mesh)
  const size = boundingBox.getSize(new THREE.Vector3())
  const volume = size.x * size.y * size.z
  const mass = type === PhysicsObjectType.STATIC ? Infinity : volume * material.density

  return {
    id: `physics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mesh,
    velocity: new THREE.Vector3(),
    acceleration: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    mass,
    friction: material.friction,
    restitution: material.restitution,
    drag: material.drag,
    type,
    useGravity: type === PhysicsObjectType.DYNAMIC,
    collisionLayers: [CollisionLayer.DEFAULT],
    userData: {}
  }
}

/**
 * Create bullet physics object
 */
export function createBulletPhysics(
  startPos: THREE.Vector3,
  direction: THREE.Vector3,
  speed: number,
  damage: number,
  options: Partial<BulletPhysicsData> = {}
): BulletPhysicsData {
  const bulletGeometry = new THREE.SphereGeometry(0.02)
  const bulletMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 1
  })
  const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
  bulletMesh.position.copy(startPos)

  return {
    id: `bullet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mesh: bulletMesh,
    velocity: direction.clone().normalize().multiplyScalar(speed),
    initialVelocity: speed,
    drag: options.drag ?? 0.001,
    gravity: options.gravity ?? true,
    damage,
    penetrationPower: options.penetrationPower ?? 1,
    ricochetChance: options.ricochetChance ?? 0.1,
    maxDistance: options.maxDistance ?? 1000,
    lifetime: options.lifetime ?? 5000,
    created: Date.now(),
    distanceTraveled: 0,
    trail: [],
    maxTrailLength: options.maxTrailLength ?? 10,
    penetrationsRemaining: options.penetrationPower ?? 1,
    richochetsRemaining: Math.floor((options.ricochetChance ?? 0.1) * 3),
    hitObjects: []
  }
}

/**
 * Create explosion data
 */
export function createExplosion(
  center: THREE.Vector3,
  radius: number = 5,
  force: number = 1000,
  damage: number = 100
): ExplosionData {
  return {
    center,
    radius,
    force,
    damage,
    falloffType: 'quadratic',
    layers: [CollisionLayer.DEFAULT, CollisionLayer.PLAYER, CollisionLayer.ENEMY, CollisionLayer.DEBRIS],
    particleCount: 30,
    particleSpeed: 15,
    particleLifetime: 2000,
    lightIntensity: 10,
    lightColor: new THREE.Color(0xff6600),
    shakeIntensity: radius * 0.2
  }
}

/**
 * Calculate explosion force on object
 */
export function calculateExplosionForce(
  explosionCenter: THREE.Vector3,
  objectPosition: THREE.Vector3,
  explosionForce: number,
  explosionRadius: number,
  falloffType: 'linear' | 'quadratic' | 'cubic' = 'quadratic'
): THREE.Vector3 {
  const direction = new THREE.Vector3().subVectors(objectPosition, explosionCenter)
  const distance = direction.length()

  if (distance > explosionRadius) {
    return new THREE.Vector3()
  }

  direction.normalize()

  // Calculate falloff
  let falloff = 1 - (distance / explosionRadius)

  switch (falloffType) {
    case 'linear':
      // falloff stays linear
      break
    case 'quadratic':
      falloff = falloff * falloff
      break
    case 'cubic':
      falloff = falloff * falloff * falloff
      break
  }

  const force = explosionForce * falloff
  return direction.multiplyScalar(force)
}

/**
 * Check if layers can collide
 */
export function canLayersCollide(
  layers1: CollisionLayer[],
  layers2: CollisionLayer[]
): boolean {
  // Triggers don't collide with each other
  if (layers1.includes(CollisionLayer.TRIGGER) && layers2.includes(CollisionLayer.TRIGGER)) {
    return false
  }

  // Check for any overlap
  return layers1.some(layer => layers2.includes(layer))
}

/**
 * Apply damage falloff based on distance
 */
export function calculateDamageFalloff(
  baseDamage: number,
  distance: number,
  maxRange: number,
  falloffStart: number = 0.5
): number {
  if (distance <= maxRange * falloffStart) {
    return baseDamage
  }

  if (distance >= maxRange) {
    return baseDamage * 0.1 // Minimum 10% damage
  }

  const falloffDistance = distance - (maxRange * falloffStart)
  const falloffRange = maxRange - (maxRange * falloffStart)
  const falloffPercent = falloffDistance / falloffRange

  return baseDamage * (1 - falloffPercent * 0.9)
}

/**
 * Calculate bullet drop (gravity effect on projectile)
 */
export function calculateBulletDrop(
  velocity: THREE.Vector3,
  gravity: number,
  time: number
): number {
  return 0.5 * gravity * time * time
}

/**
 * Check if point is within explosion radius
 */
export function isInExplosionRadius(
  point: THREE.Vector3,
  explosionCenter: THREE.Vector3,
  radius: number
): boolean {
  return point.distanceTo(explosionCenter) <= radius
}

/**
 * Validate physics settings
 */
export function validatePhysicsSettings(settings: PhysicsWorldSettings): boolean {
  if (settings.timeStep <= 0 || settings.timeStep > 1) {
    console.error('❌ Invalid physics timestep')
    return false
  }

  if (settings.maxActiveObjects <= 0) {
    console.error('❌ Invalid max active objects')
    return false
  }

  if (settings.gravity.length() < 0) {
    console.error('❌ Invalid gravity vector')
    return false
  }

  return true
}

/**
 * Get physics material by name
 */
export function getPhysicsMaterial(name: string): PhysicsMaterial {
  const material = PHYSICS_MATERIALS[name.toUpperCase()]
  if (!material) {
    console.warn(`⚠️ Physics material "${name}" not found, using CONCRETE`)
    return PHYSICS_MATERIALS.CONCRETE
  }
  return material
}
