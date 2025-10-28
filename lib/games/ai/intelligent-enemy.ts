import * as THREE from 'three'

export interface EnemyState {
  health: number
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'cover'
  target: THREE.Vector3 | null
  lastSeenPlayer: number
  attackCooldown: number
  inCover: boolean
  morale: number
  accuracy: number
  aggressiveness: number
}

export class IntelligentEnemy {
  private state: EnemyState
  public mesh: THREE.Mesh
  private scene: THREE.Scene
  private playerRef: THREE.Object3D
  private waypoints: THREE.Vector3[] = []
  private currentWaypointIndex: number = 0
  private lastStateChange: number = 0
  private behaviorTree: BehaviorNode | null = null
  private sensoryData: SensoryData
  public healthBar: THREE.Mesh | null = null

  constructor(
    scene: THREE.Scene, 
    position: THREE.Vector3, 
    playerRef: THREE.Object3D,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ) {
    this.scene = scene
    this.playerRef = playerRef
    
    // Initialize enemy state based on difficulty
    const difficultySettings = {
      easy: { health: 50, accuracy: 0.3, aggressiveness: 0.4, speed: 4.0 },
      medium: { health: 100, accuracy: 0.6, aggressiveness: 0.7, speed: 6.0 },
      hard: { health: 150, accuracy: 0.9, aggressiveness: 0.9, speed: 8.0 }
    }

    const settings = difficultySettings[difficulty]
    
    this.state = {
      health: settings.health,
      position: position.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'idle',
      target: null,
      lastSeenPlayer: 0,
      attackCooldown: 0,
      inCover: false,
      morale: 1.0,
      accuracy: settings.accuracy,
      aggressiveness: settings.aggressiveness
    }

    // Create enemy mesh
    const geometry = new THREE.CapsuleGeometry(0.3, 1.8, 4, 8)
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(position)
    this.mesh.castShadow = true
    scene.add(this.mesh)

    // Create health bar
    const healthBarGeometry = new THREE.PlaneGeometry(1, 0.1)
    const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial)
    this.healthBar.position.copy(position)
    this.healthBar.position.y += 1.2
    scene.add(this.healthBar)

    // Initialize sensory system
    this.sensoryData = new SensoryData()
    
    // Initialize behavior tree
    this.initializeBehaviorTree()
    
    // Generate patrol waypoints
    this.generatePatrolWaypoints()
  }

  private initializeBehaviorTree(): void {
    // Create a behavior tree for intelligent decision making
    this.behaviorTree = new SelectorNode([
      new SequenceNode([
        new ConditionNode(() => this.shouldFlee()),
        new ActionNode(() => this.flee())
      ]),
      new SequenceNode([
        new ConditionNode(() => this.shouldAttack()),
        new ActionNode(() => this.attack())
      ]),
      new SequenceNode([
        new ConditionNode(() => this.shouldTakeCover()),
        new ActionNode(() => this.takeCover())
      ]),
      new SequenceNode([
        new ConditionNode(() => this.shouldChase()),
        new ActionNode(() => this.chase())
      ]),
      new SequenceNode([
        new ConditionNode(() => this.shouldPatrol()),
        new ActionNode(() => this.patrol())
      ]),
      new ActionNode(() => this.idle())
    ])
  }

  private generatePatrolWaypoints(): void {
    // Generate intelligent patrol waypoints based on environment
    const radius = 25 // Increased radius for more movement
    const waypointCount = 6 // Increased waypoint count for variety
    
    for (let i = 0; i < waypointCount; i++) {
      const angle = (i / waypointCount) * Math.PI * 2
      const x = this.state.position.x + Math.cos(angle) * radius
      const z = this.state.position.z + Math.sin(angle) * radius
      this.waypoints.push(new THREE.Vector3(x, 0, z))
    }
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Update sensory data
    this.sensoryData.update(this.state.position, playerPosition, this.scene)
    
    // Update state timers
    if (this.state.attackCooldown > 0) {
      this.state.attackCooldown -= deltaTime
    }

    // Execute behavior tree
    if (this.behaviorTree) {
      this.behaviorTree.execute(this)
    }

    // Update physics
    this.updatePhysics(deltaTime)

    // Update morale based on health and combat situation
    this.updateMorale()

    // Update visual representation
    this.mesh.position.copy(this.state.position)
    this.mesh.rotation.copy(this.state.rotation)
    
    // Update health bar
    if (this.healthBar) {
      this.healthBar.position.copy(this.state.position)
      this.healthBar.position.y += 1.2
      this.healthBar.lookAt(playerPosition)
      
      // Update health bar width based on health
      const healthRatio = this.state.health / 150
      this.healthBar.scale.x = Math.max(0.1, healthRatio)
      
      // Update health bar color based on health
      const healthBarMaterial = this.healthBar.material as THREE.MeshBasicMaterial
      if (healthRatio > 0.6) {
        healthBarMaterial.color.setHex(0x00ff00) // Green
      } else if (healthRatio > 0.3) {
        healthBarMaterial.color.setHex(0xffff00) // Yellow
      } else {
        healthBarMaterial.color.setHex(0xff0000) // Red
      }
    }
  }

  private updatePhysics(deltaTime: number): void {
    // Apply velocity with collision detection - deltaTime is already in seconds
    const newPosition = this.state.position.clone().add(
      this.state.velocity.clone().multiplyScalar(deltaTime)
    )

    // Simple collision detection with ground
    if (newPosition.y < 0) {
      newPosition.y = 0
      this.state.velocity.y = 0
    }

    // Check collision with obstacles
    if (!this.checkCollision(newPosition)) {
      this.state.position.copy(newPosition)
    }

    // Apply much less friction to maintain movement
    this.state.velocity.multiplyScalar(0.95)

    // Limit maximum speed - increased for more movement
    const maxSpeed = 8.0
    if (this.state.velocity.length() > maxSpeed) {
      this.state.velocity.normalize().multiplyScalar(maxSpeed)
    }
  }

  private checkCollision(position: THREE.Vector3): boolean {
    // Simple collision detection with obstacles
    // In a real implementation, this would use spatial partitioning
    return false
  }

  private updateMorale(): void {
    // Update morale based on health and combat situation
    const healthRatio = this.state.health / 150
    const timeSinceLastSeen = Date.now() - this.state.lastSeenPlayer
    
    if (healthRatio < 0.3) {
      this.state.morale = Math.max(0, this.state.morale - 0.01)
    } else if (timeSinceLastSeen > 5000) {
      this.state.morale = Math.min(1, this.state.morale + 0.005)
    }
  }

  // Behavior tree conditions
  private shouldFlee(): boolean {
    return this.state.morale < 0.3 && this.state.health < 50
  }

  private shouldAttack(): boolean {
    const distance = this.state.position.distanceTo(this.playerRef.position)
    return distance < 20 && this.state.attackCooldown <= 0 && this.state.morale > 0.5
  }

  private shouldTakeCover(): boolean {
    const canSeePlayer = this.sensoryData.canSeePlayer
    const isUnderFire = this.state.health < 100
    return canSeePlayer && isUnderFire && !this.state.inCover
  }

  private shouldChase(): boolean {
    const distance = this.state.position.distanceTo(this.playerRef.position)
    const canSeePlayer = this.sensoryData.canSeePlayer
    return distance < 30 && distance > 10 && canSeePlayer && this.state.morale > 0.4
  }

  private shouldPatrol(): boolean {
    return !this.sensoryData.canSeePlayer && this.state.morale > 0.6
  }

  // Behavior tree actions
  private flee(): BehaviorStatus {
    // Calculate flee direction (away from player)
    const fleeDirection = this.state.position.clone().sub(this.playerRef.position)
    fleeDirection.normalize()
    fleeDirection.y = 0
    
    // Apply flee velocity - significantly increased speed
    this.state.velocity.copy(fleeDirection.multiplyScalar(12))
    
    this.state.state = 'flee'
    this.state.target = this.state.position.clone().add(fleeDirection.multiplyScalar(20))
    
    return BehaviorStatus.SUCCESS
  }

  private attack(): BehaviorStatus {
    // Calculate attack direction
    const attackDirection = this.playerRef.position.clone().sub(this.state.position)
    attackDirection.normalize()
    
    // Face the player
    this.state.rotation.y = Math.atan2(attackDirection.x, attackDirection.z)
    
    // Simulate attack with accuracy
    const hitChance = this.state.accuracy * (1 - this.state.position.distanceTo(this.playerRef.position) / 50)
    if (Math.random() < hitChance) {
      // Hit the player (in real implementation, this would damage player)
      console.log('Enemy hit player!')
    }
    
    this.state.attackCooldown = 1000 // 1 second cooldown
    this.state.state = 'attack'
    
    return BehaviorStatus.SUCCESS
  }

  private takeCover(): BehaviorStatus {
    // Find nearest cover point
    const coverPoint = this.findNearestCover()
    if (coverPoint) {
      this.state.target = coverPoint
      this.state.inCover = true
      this.state.state = 'cover'
      
      // Move to cover - significantly increased speed
      const moveDirection = coverPoint.clone().sub(this.state.position)
      moveDirection.normalize()
      moveDirection.y = 0
      this.state.velocity.copy(moveDirection.multiplyScalar(10))
      
      return BehaviorStatus.SUCCESS
    }
    
    return BehaviorStatus.FAILURE
  }

  private chase(): BehaviorStatus {
    // Calculate chase direction
    const chaseDirection = this.playerRef.position.clone().sub(this.state.position)
    chaseDirection.normalize()
    chaseDirection.y = 0
    
    // Apply chase velocity - significantly increased speed
    this.state.velocity.copy(chaseDirection.multiplyScalar(10))
    
    this.state.state = 'chase'
    this.state.target = this.playerRef.position.clone()
    
    return BehaviorStatus.SUCCESS
  }

  private patrol(): BehaviorStatus {
    if (this.waypoints.length === 0) return BehaviorStatus.FAILURE
    
    const targetWaypoint = this.waypoints[this.currentWaypointIndex]
    const distance = this.state.position.distanceTo(targetWaypoint)
    
    if (distance < 2) {
      // Reached waypoint, move to next
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length
    }
    
    // Move towards waypoint - significantly increased speed
    const moveDirection = targetWaypoint.clone().sub(this.state.position)
    moveDirection.normalize()
    moveDirection.y = 0
    this.state.velocity.copy(moveDirection.multiplyScalar(6))
    
    this.state.state = 'patrol'
    this.state.target = targetWaypoint
    
    return BehaviorStatus.SUCCESS
  }

  private idle(): BehaviorStatus {
    this.state.state = 'idle'
    this.state.target = null
    
    // Add random movement occasionally
    if (Math.random() < 0.02) { // 2% chance per frame
      const randomDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      )
      randomDirection.normalize()
      this.state.velocity.copy(randomDirection.multiplyScalar(3))
    } else {
      // Gradually stop moving
      this.state.velocity.multiplyScalar(0.9)
    }
    
    // Look around occasionally
    if (Math.random() < 0.01) {
      this.state.rotation.y += (Math.random() - 0.5) * 0.5
    }
    
    return BehaviorStatus.SUCCESS
  }

  private findNearestCover(): THREE.Vector3 | null {
    // Simple cover finding - in real implementation, this would analyze the environment
    const coverPositions = [
      this.state.position.clone().add(new THREE.Vector3(-5, 0, 0)),
      this.state.position.clone().add(new THREE.Vector3(5, 0, 0)),
      this.state.position.clone().add(new THREE.Vector3(0, 0, -5)),
      this.state.position.clone().add(new THREE.Vector3(0, 0, 5))
    ]
    
    // Find cover that blocks line of sight to player
    for (const cover of coverPositions) {
      if (this.hasLineOfSight(cover, this.playerRef.position)) {
        return cover
      }
    }
    
    return null
  }

  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    // Simple line of sight check
    const direction = to.clone().sub(from)
    const distance = direction.length()
    direction.normalize()
    
    // Check for obstacles along the line of sight
    const raycaster = new THREE.Raycaster(from, direction, 0, distance)
    const intersects = raycaster.intersectObjects(this.scene.children)
    
    return intersects.length === 0
  }

  public takeDamage(damage: number): boolean {
    this.state.health -= damage
    this.state.morale -= damage * 0.01
    
    if (this.state.health <= 0) {
      this.destroy()
      return true // Enemy died
    }
    return false // Enemy survived
  }

  public destroy(): void {
    this.scene.remove(this.mesh)
    if (this.healthBar) {
      this.scene.remove(this.healthBar)
    }
    // Add death effects here
  }

  public getState(): EnemyState {
    return { ...this.state }
  }
}

// Behavior tree nodes
export enum BehaviorStatus {
  SUCCESS,
  FAILURE,
  RUNNING
}

export abstract class BehaviorNode {
  abstract execute(enemy: IntelligentEnemy): BehaviorStatus
}

export class SelectorNode extends BehaviorNode {
  private children: BehaviorNode[]
  
  constructor(children: BehaviorNode[]) {
    super()
    this.children = children
  }
  
  execute(enemy: IntelligentEnemy): BehaviorStatus {
    for (const child of this.children) {
      const status = child.execute(enemy)
      if (status !== BehaviorStatus.FAILURE) {
        return status
      }
    }
    return BehaviorStatus.FAILURE
  }
}

export class SequenceNode extends BehaviorNode {
  private children: BehaviorNode[]
  
  constructor(children: BehaviorNode[]) {
    super()
    this.children = children
  }
  
  execute(enemy: IntelligentEnemy): BehaviorStatus {
    for (const child of this.children) {
      const status = child.execute(enemy)
      if (status !== BehaviorStatus.SUCCESS) {
        return status
      }
    }
    return BehaviorStatus.SUCCESS
  }
}

export class ConditionNode extends BehaviorNode {
  private condition: () => boolean
  
  constructor(condition: () => boolean) {
    super()
    this.condition = condition
  }
  
  execute(enemy: IntelligentEnemy): BehaviorStatus {
    return this.condition() ? BehaviorStatus.SUCCESS : BehaviorStatus.FAILURE
  }
}

export class ActionNode extends BehaviorNode {
  private action: () => BehaviorStatus
  
  constructor(action: () => BehaviorStatus) {
    super()
    this.action = action
  }
  
  execute(enemy: IntelligentEnemy): BehaviorStatus {
    return this.action()
  }
}

// Sensory system for enemy perception
export class SensoryData {
  public canSeePlayer: boolean = false
  public canHearPlayer: boolean = false
  public playerDistance: number = 0
  public lastPlayerPosition: THREE.Vector3 | null = null
  private lastUpdateTime: number = 0

  update(enemyPosition: THREE.Vector3, playerPosition: THREE.Vector3, scene: THREE.Scene): void {
    const currentTime = Date.now()
    
    // Update sensory data every 100ms
    if (currentTime - this.lastUpdateTime < 100) return
    
    this.lastUpdateTime = currentTime
    this.playerDistance = enemyPosition.distanceTo(playerPosition)
    
    // Check line of sight
    this.canSeePlayer = this.checkLineOfSight(enemyPosition, playerPosition, scene)
    
    // Check if player is within hearing range
    this.canHearPlayer = this.playerDistance < 15
    
    if (this.canSeePlayer || this.canHearPlayer) {
      this.lastPlayerPosition = playerPosition.clone()
    }
  }

  private checkLineOfSight(from: THREE.Vector3, to: THREE.Vector3, scene: THREE.Scene): boolean {
    // Simple line of sight check
    const direction = to.clone().sub(from)
    const distance = direction.length()
    
    if (distance > 50) return false // Maximum sight range
    
    direction.normalize()
    
    const raycaster = new THREE.Raycaster(from, direction, 0, distance)
    const intersects = raycaster.intersectObjects(scene.children)
    
    // Filter out small objects that don't block line of sight
    const blockingObjects = intersects.filter(intersect =>
      intersect.object instanceof THREE.Mesh &&
      (intersect.object as THREE.Mesh).geometry &&
      (intersect.object as THREE.Mesh).geometry!.boundingBox &&
      (intersect.object as THREE.Mesh).geometry!.boundingBox!.getSize(new THREE.Vector3()).length() > 1
    )
    
    return blockingObjects.length === 0
  }
}