// @ts-nocheck
'use client'

import * as THREE from 'three'
import GLXYPhysicsEngine from './GLXYPhysicsEngine'

// ULTIMATE GLXY AI Enemy System - Shooter des Jahres!
export class GLXYAIEnemy {
  public mesh: THREE.Group
  public physicsObject: any
  public ai: AIController

  private health: number
  private maxHealth: number
  private armor: number
  private isAlive: boolean
  private lastShot: number
  private target: THREE.Vector3 | null
  private patrolPath: THREE.Vector3[]
  private currentPatrolIndex: number
  private state: AIState
  private stats: EnemyStats
  private weapons: AIWeapon[]
  private currentWeaponIndex: number

  constructor(
    position: THREE.Vector3,
    enemyType: 'soldier' | 'elite' | 'boss' | 'sniper' = 'soldier',
    physicsEngine: GLXYPhysicsEngine
  ) {
    // Create enemy mesh based on type
    this.mesh = this.createEnemyMesh(enemyType)
    this.mesh.position.copy(position)

    // Initialize stats based on type
    this.stats = this.getEnemyStats(enemyType)
    this.health = this.stats.maxHealth
    this.maxHealth = this.stats.maxHealth
    this.armor = this.stats.armor
    this.isAlive = true
    this.lastShot = 0

    // AI properties
    this.target = null
    this.patrolPath = this.generatePatrolPath(position)
    this.currentPatrolIndex = 0
    this.state = 'patrol'

    // Weapons
    this.weapons = this.getEnemyWeapons(enemyType)
    this.currentWeaponIndex = 0

    // Create physics object
    this.physicsObject = physicsEngine.addPhysicsObject(this.mesh.children[0] as THREE.Mesh, {
      mass: this.stats.mass,
      friction: 0.8,
      restitution: 0.1,
      useGravity: true,
      collisionLayers: ['enemy']
    })

    // Initialize AI controller
    this.ai = new AIController(this, physicsEngine)
  }

  // Create enemy mesh based on type
  private createEnemyMesh(type: string): THREE.Group {
    const group = new THREE.Group()

    // Body
    const bodyGeometry = new THREE.BoxGeometry(
      this.stats.width,
      this.stats.height,
      this.stats.depth
    )
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.stats.color,
      roughness: 0.7,
      metalness: 0.3
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = this.stats.height / 2
    group.add(body)

    // Head
    const headGeometry = new THREE.SphereGeometry(this.stats.width * 0.4)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: this.stats.color,
      roughness: 0.5
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = this.stats.height + 0.4
    group.add(head)

    // Eyes (glowing for effect)
    const eyeGeometry = new THREE.SphereGeometry(0.05)
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1,
      roughness: 0.2,
      metalness: 0.8
    })

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.1, this.stats.height + 0.4, 0.35)
    group.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.1, this.stats.height + 0.4, 0.35)
    group.add(rightEye)

    // Weapon
    const weapon = this.createEnemyWeapon(type)
    weapon.position.set(0.3, this.stats.height - 0.3, 0.2)
    group.add(weapon)

    return group
  }

  // Create weapon for enemy
  private createEnemyWeapon(type: string): THREE.Mesh {
    const weaponGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.1)
    const weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.5
    })
    return new THREE.Mesh(weaponGeometry, weaponMaterial)
  }

  // Get enemy stats based on type
  private getEnemyStats(type: string): EnemyStats {
    const baseStats = {
      soldier: {
        maxHealth: 100,
        armor: 0,
        speed: 3,
        damage: 20,
        fireRate: 1500,
        accuracy: 0.7,
        detectionRange: 30,
        attackRange: 25,
        mass: 1,
        width: 0.8,
        height: 1.8,
        depth: 0.6,
        color: 0xff4444,
        xp: 100
      },
      elite: {
        maxHealth: 150,
        armor: 50,
        speed: 4,
        damage: 35,
        fireRate: 1200,
        accuracy: 0.8,
        detectionRange: 40,
        attackRange: 35,
        mass: 1.2,
        width: 0.9,
        height: 2,
        depth: 0.7,
        color: 0xff8844,
        xp: 200
      },
      boss: {
        maxHealth: 500,
        armor: 100,
        speed: 2,
        damage: 80,
        fireRate: 800,
        accuracy: 0.9,
        detectionRange: 60,
        attackRange: 50,
        mass: 2,
        width: 1.5,
        height: 2.5,
        depth: 1,
        color: 0xff00ff,
        xp: 1000
      },
      sniper: {
        maxHealth: 80,
        armor: 0,
        speed: 2.5,
        damage: 100,
        fireRate: 3000,
        accuracy: 0.95,
        detectionRange: 80,
        attackRange: 70,
        mass: 0.8,
        width: 0.7,
        height: 1.7,
        depth: 0.5,
        color: 0x8844ff,
        xp: 250
      }
    }

    return baseStats[type as keyof typeof baseStats] || baseStats.soldier
  }

  // Get enemy weapons based on type
  private getEnemyWeapons(type: string): AIWeapon[] {
    const weaponSets = {
      soldier: [
        { name: 'Assault Rifle', damage: 20, fireRate: 1500, range: 30, ammo: 30 },
        { name: 'Pistol', damage: 15, fireRate: 600, range: 20, ammo: 12 }
      ],
      elite: [
        { name: 'Plasma Rifle', damage: 35, fireRate: 1200, range: 40, ammo: 40 },
        { name: 'SMG', damage: 25, fireRate: 800, range: 25, ammo: 50 }
      ],
      boss: [
        { name: 'Minigun', damage: 80, fireRate: 800, range: 50, ammo: 200 },
        { name: 'Rocket Launcher', damage: 150, fireRate: 2000, range: 40, ammo: 5 }
      ],
      sniper: [
        { name: 'Sniper Rifle', damage: 100, fireRate: 3000, range: 80, ammo: 10 },
        { name: 'Pistol', damage: 15, fireRate: 600, range: 20, ammo: 12 }
      ]
    }

    return weaponSets[type as keyof typeof weaponSets] || weaponSets.soldier
  }

  // Generate patrol path
  private generatePatrolPath(center: THREE.Vector3): THREE.Vector3[] {
    const path: THREE.Vector3[] = []
    const radius = 15
    const points = 4

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const x = center.x + Math.cos(angle) * radius
      const z = center.z + Math.sin(angle) * radius
      path.push(new THREE.Vector3(x, center.y, z))
    }

    return path
  }

  // Update enemy AI
  update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    if (!this.isAlive) return

    // Update AI state
    this.ai.update(deltaTime, playerPosition)

    // Update animation
    this.updateAnimation(deltaTime)
  }

  // Update animation
  private updateAnimation(deltaTime: number): void {
    // Simple idle/breathing animation
    if (this.state === 'idle' || this.state === 'patrol') {
      const time = Date.now() * 0.001
      this.mesh.children[1].position.y = this.stats.height + 0.4 + Math.sin(time * 2) * 0.02
    }

    // Update eye glow based on state
    let eyeIntensity = 1
    if (this.state === 'combat') {
      eyeIntensity = 1.5
    }
    // Temporarily commented out due to TypeScript issues
    // ((this.mesh.children[2] as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity
    // ((this.mesh.children[3] as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity
  }

  // Take damage
  takeDamage(damage: number, damageType: 'bullet' | 'explosion' | 'melee' = 'bullet'): void {
    if (!this.isAlive) return

    // Apply armor reduction
    let actualDamage = damage
    if (this.armor > 0) {
      const armorDamage = Math.min(damage * 0.5, this.armor)
      this.armor -= armorDamage
      actualDamage = damage - armorDamage
    }

    this.health -= actualDamage
    this.health = Math.max(0, this.health)

    // Enter combat state
    if (this.state !== 'combat') {
      this.state = 'combat'
      this.ai.enterCombat()
    }

    // Death
    if (this.health <= 0) {
      this.die()
    }
  }

  // Death
  private die(): void {
    this.isAlive = false
    this.state = 'dead'

    // Death animation
    this.mesh.rotation.x = Math.PI / 2
    this.mesh.position.y = 0.2

    // Remove physics
    if (this.physicsObject) {
      // Physics cleanup would go here
    }
  }

  // Shoot at target
  shoot(target: THREE.Vector3): boolean {
    if (!this.isAlive || !target) return false

    const now = Date.now()
    const weapon = this.weapons[this.currentWeaponIndex]

    if (now - this.lastShot < weapon.fireRate) return false

    // Calculate accuracy
    const baseAccuracy = this.stats.accuracy
    const distance = this.mesh.position.distanceTo(target)
    const accuracyModifier = Math.max(0.3, 1 - distance / weapon.range)
    const finalAccuracy = baseAccuracy * accuracyModifier

    // Add random spread
    const spread = (1 - finalAccuracy) * 0.5
    const spreadX = (Math.random() - 0.5) * spread
    const spreadY = (Math.random() - 0.5) * spread

    const direction = new THREE.Vector3()
    direction.subVectors(target, this.mesh.position).normalize()
    direction.x += spreadX
    direction.y += spreadY
    direction.normalize()

    this.lastShot = now

    // Create bullet
    return this.ai.shoot(direction, weapon)
  }

  // Get current weapon
  getCurrentWeapon(): AIWeapon {
    return this.weapons[this.currentWeaponIndex]
  }

  // Get state
  getState(): AIState {
    return this.state
  }

  // Get health percentage
  getHealthPercentage(): number {
    return (this.health + this.armor) / (this.maxHealth + this.stats.armor) * 100
  }

  // Get enemy height
  getHeight(): number {
    return this.stats.height
  }

  // Get attack range
  getAttackRange(): number {
    return this.stats.attackRange
  }

  // Get speed
  getSpeed(): number {
    return this.stats.speed
  }

  // Set state
  setState(newState: AIState): void {
    this.state = newState
  }

  // Check if alive
  getIsAlive(): boolean {
    return this.isAlive
  }

  // Cleanup
  cleanup(): void {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh)
    }
  }
}

// AI Controller Class
export class AIController {
  private enemy: GLXYAIEnemy
  private physicsEngine: GLXYPhysicsEngine
  private behaviorTree: AIBehaviorNode
  private memory: AIMemory

  constructor(enemy: GLXYAIEnemy, physicsEngine: GLXYPhysicsEngine) {
    this.enemy = enemy
    this.physicsEngine = physicsEngine
    this.memory = new AIMemory()
    this.behaviorTree = this.createBehaviorTree()
  }

  // Create behavior tree
  private createBehaviorTree(): AIBehaviorNode {
    return new SelectorNode([
      new SequenceNode([
        new IsAliveCondition(),
        new InCombatCondition(),
        new CombatAction()
      ]),
      new SequenceNode([
        new IsAliveCondition(),
        new HasTargetCondition(),
        new InvestigateAction()
      ]),
      new SequenceNode([
        new IsAliveCondition(),
        new PatrolAction()
      ]),
      new IdleAction()
    ])
  }

  // Update AI
  update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    // Update memory
    this.memory.update(deltaTime, playerPosition)

    // Execute behavior tree
    this.behaviorTree.execute(this.enemy, this.memory, this.physicsEngine, deltaTime)
  }

  // Enter combat
  enterCombat(): void {
    this.memory.setState('combat')
    this.memory.setCombatStartTime(Date.now())
  }

  // Shoot
  shoot(direction: THREE.Vector3, weapon: AIWeapon): boolean {
    // Create bullet physics object
    const bulletPos = this.enemy.mesh.position.clone()
    bulletPos.y += this.enemy.getHeight() - 0.3

    // This would integrate with the game's bullet system
    return true
  }
}

// Behavior Tree Nodes
abstract class AIBehaviorNode {
  abstract execute(
    enemy: GLXYAIEnemy,
    memory: AIMemory,
    physicsEngine: GLXYPhysicsEngine,
    deltaTime: number
  ): boolean
}

class SelectorNode extends AIBehaviorNode {
  constructor(private children: AIBehaviorNode[]) {
    super()
  }

  execute(enemy: GLXYAIEnemy, memory: AIMemory, physicsEngine: GLXYPhysicsEngine, deltaTime: number): boolean {
    for (const child of this.children) {
      if (child.execute(enemy, memory, physicsEngine, deltaTime)) {
        return true
      }
    }
    return false
  }
}

class SequenceNode extends AIBehaviorNode {
  constructor(private children: AIBehaviorNode[]) {
    super()
  }

  execute(enemy: GLXYAIEnemy, memory: AIMemory, physicsEngine: GLXYPhysicsEngine, deltaTime: number): boolean {
    for (const child of this.children) {
      if (!child.execute(enemy, memory, physicsEngine, deltaTime)) {
        return false
      }
    }
    return true
  }
}

class IsAliveCondition extends AIBehaviorNode {
  execute(enemy: GLXYAIEnemy): boolean {
    return enemy.getIsAlive()
  }
}

class InCombatCondition extends AIBehaviorNode {
  execute(enemy: GLXYAIEnemy, memory: AIMemory): boolean {
    return memory.getState() === 'combat'
  }
}

class HasTargetCondition extends AIBehaviorNode {
  execute(enemy: GLXYAIEnemy, memory: AIMemory): boolean {
    return memory.getTargetPosition() !== null
  }
}

class CombatAction extends AIBehaviorNode {
  execute(enemy: GLXYAIEnemy, memory: AIMemory, physicsEngine: GLXYPhysicsEngine, deltaTime: number): boolean {
    const target = memory.getTargetPosition()
    if (!target) return false

    const distance = enemy.mesh.position.distanceTo(target)

    // Attack if in range
    if (distance <= enemy.getAttackRange()) {
      enemy.shoot(target)
      return true
    }

    // Move towards target
    const direction = new THREE.Vector3().subVectors(target, enemy.mesh.position).normalize()
    const moveVector = direction.multiplyScalar(enemy.getSpeed() * deltaTime)

    if (enemy.physicsObject) {
      physicsEngine.applyForce(enemy.physicsObject.id, moveVector.multiplyScalar(10))
    }

    return true
  }
}

class InvestigateAction extends AIBehaviorNode {
  execute(enemy: GLXYAIEnemy, memory: AIMemory, physicsEngine: GLXYPhysicsEngine, deltaTime: number): boolean {
    const target = memory.getTargetPosition()
    if (!target) return false

    const distance = enemy.mesh.position.distanceTo(target)

    if (distance > 2) {
      const direction = new THREE.Vector3().subVectors(target, enemy.mesh.position).normalize()
      const moveVector = direction.multiplyScalar(enemy.getSpeed() * deltaTime * 0.7)

      if (enemy.physicsObject) {
        physicsEngine.applyForce(enemy.physicsObject.id, moveVector.multiplyScalar(10))
      }
    } else {
      // Reached investigation point
      memory.setTargetPosition(null)
    }

    return true
  }
}

class PatrolAction extends AIBehaviorNode {
  execute(enemy: GLXYAIEnemy, memory: AIMemory, physicsEngine: GLXYPhysicsEngine, deltaTime: number): boolean {
    const patrolPath = memory.getPatrolPath()
    const currentIndex = memory.getPatrolIndex()

    if (patrolPath.length === 0) return false

    const target = patrolPath[currentIndex]
    const distance = enemy.mesh.position.distanceTo(target)

    if (distance > 1) {
      const direction = new THREE.Vector3().subVectors(target, enemy.mesh.position).normalize()
      const moveVector = direction.multiplyScalar(enemy.getSpeed() * deltaTime * 0.5)

      if (enemy.physicsObject) {
        physicsEngine.applyForce(enemy.physicsObject.id, moveVector.multiplyScalar(10))
      }
    } else {
      // Reached waypoint, move to next
      const nextIndex = (currentIndex + 1) % patrolPath.length
      memory.setPatrolIndex(nextIndex)
    }

    return true
  }
}

class IdleAction extends AIBehaviorNode {
  execute(enemy: GLXYAIEnemy, memory: AIMemory): boolean {
    enemy.setState('idle')
    return true
  }
}

// AI Memory
export class AIMemory {
  private state: AIState = 'idle'
  private targetPosition: THREE.Vector3 | null = null
  private patrolPath: THREE.Vector3[] = []
  private patrolIndex: number = 0
  private combatStartTime: number = 0
  private lastSeenTime: number = 0
  private healthHistory: number[] = []

  update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    // Update target if player is visible
    if (playerPosition) {
      this.targetPosition = playerPosition.clone()
      this.lastSeenTime = Date.now()
    } else if (Date.now() - this.lastSeenTime > 5000) {
      // Forget target after 5 seconds
      this.targetPosition = null
    }
  }

  // Getters and setters
  getState(): AIState { return this.state }
  setState(state: AIState): void { this.state = state }

  getTargetPosition(): THREE.Vector3 | null { return this.targetPosition }
  setTargetPosition(position: THREE.Vector3 | null): void { this.targetPosition = position }

  getPatrolPath(): THREE.Vector3[] { return this.patrolPath }
  setPatrolPath(path: THREE.Vector3[]): void { this.patrolPath = path }

  getPatrolIndex(): number { return this.patrolIndex }
  setPatrolIndex(index: number): void { this.patrolIndex = index }

  getCombatStartTime(): number { return this.combatStartTime }
  setCombatStartTime(time: number): void { this.combatStartTime = time }
}

// Types
export type AIState = 'idle' | 'patrol' | 'investigate' | 'combat' | 'dead' | 'fleeing'

export interface EnemyStats {
  maxHealth: number
  armor: number
  speed: number
  damage: number
  fireRate: number
  accuracy: number
  detectionRange: number
  attackRange: number
  mass: number
  width: number
  height: number
  depth: number
  color: number
  xp: number
}

export interface AIWeapon {
  name: string
  damage: number
  fireRate: number
  range: number
  ammo: number
}

export default GLXYAIEnemy