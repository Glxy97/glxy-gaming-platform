// @ts-nocheck
import * as THREE from 'three'

export interface EnemyState {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  health: number
  maxHealth: number
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'dead'
  target: THREE.Vector3 | null
  lastSeenPlayer: number
  patrolPoints: THREE.Vector3[]
  currentPatrolIndex: number
  speed: number
  damage: number
  attackRange: number
  detectionRange: number
  attackCooldown: number
  lastAttackTime: number
}

export class Enemy {
  public state: EnemyState
  public mesh: THREE.Mesh
  public healthBar: THREE.Mesh | null = null
  private path: THREE.Vector3[] = []
  private currentPathIndex: number = 0
  private navigationMesh: THREE.Mesh | null = null

  constructor(
    id: string,
    position: THREE.Vector3,
    patrolPoints: THREE.Vector3[] = []
  ) {
    this.state = {
      id,
      position: position.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      health: 100,
      maxHealth: 100,
      state: 'idle',
      target: null,
      lastSeenPlayer: 0,
      patrolPoints: patrolPoints.map(p => p.clone()),
      currentPatrolIndex: 0,
      speed: 2.0,
      damage: 10,
      attackRange: 5.0,
      detectionRange: 20.0,
      attackCooldown: 1000,
      lastAttackTime: 0
    }

    // Create enemy mesh
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8)
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(position)
    this.mesh.castShadow = true

    // Create health bar
    this.createHealthBar()
  }

  private createHealthBar() {
    const barGeometry = new THREE.PlaneGeometry(1, 0.1)
    const barMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    this.healthBar = new THREE.Mesh(barGeometry, barMaterial)
    this.healthBar.position.copy(this.state.position)
    this.healthBar.position.y += 2
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3, scene: THREE.Scene): void {
    if (this.state.state === 'dead') return

    const currentTime = Date.now()
    const distanceToPlayer = this.state.position.distanceTo(playerPosition)

    // Update AI state based on player proximity
    this.updateAIState(playerPosition, distanceToPlayer, currentTime)

    // Execute behavior based on current state
    switch (this.state.state) {
      case 'idle':
        this.idleBehavior(deltaTime)
        break
      case 'patrol':
        this.patrolBehavior(deltaTime)
        break
      case 'chase':
        this.chaseBehavior(deltaTime, playerPosition)
        break
      case 'attack':
        this.attackBehavior(deltaTime, playerPosition, currentTime)
        break
      case 'flee':
        this.fleeBehavior(deltaTime, playerPosition)
        break
    }

    // Update visual position
    this.mesh.position.copy(this.state.position)
    this.mesh.rotation.copy(this.state.rotation)
    
    // Update health bar
    this.updateHealthBar()
  }

  private updateAIState(playerPosition: THREE.Vector3, distanceToPlayer: number, currentTime: number): void {
    const canSeePlayer = this.canSeePlayer(playerPosition, distanceToPlayer)

    switch (this.state.state) {
      case 'idle':
        if (canSeePlayer && distanceToPlayer <= this.state.detectionRange) {
          this.state.state = 'chase'
          this.state.target = playerPosition.clone()
          this.state.lastSeenPlayer = currentTime
        } else if (this.state.patrolPoints.length > 0) {
          this.state.state = 'patrol'
        }
        break

      case 'patrol':
        if (canSeePlayer && distanceToPlayer <= this.state.detectionRange) {
          this.state.state = 'chase'
          this.state.target = playerPosition.clone()
          this.state.lastSeenPlayer = currentTime
        }
        break

      case 'chase':
        if (canSeePlayer) {
          this.state.target = playerPosition.clone()
          this.state.lastSeenPlayer = currentTime
          
          if (distanceToPlayer <= this.state.attackRange) {
            this.state.state = 'attack'
          }
        } else {
          // Lost sight of player
          if (currentTime - this.state.lastSeenPlayer > 5000) {
            this.state.state = 'patrol'
            this.state.target = null
          }
        }

        // Flee if health is low
        if (this.state.health < 30) {
          this.state.state = 'flee'
        }
        break

      case 'attack':
        if (distanceToPlayer > this.state.attackRange) {
          this.state.state = 'chase'
        } else if (!canSeePlayer) {
          this.state.state = 'chase'
        }
        break

      case 'flee':
        if (this.state.health > 50) {
          this.state.state = 'chase'
        }
        break
    }
  }

  private canSeePlayer(playerPosition: THREE.Vector3, distanceToPlayer: number): boolean {
    if (distanceToPlayer > this.state.detectionRange) return false

    // Simple line of sight check (can be enhanced with raycasting)
    const direction = playerPosition.clone().sub(this.state.position).normalize()
    const enemyDirection = new THREE.Vector3(0, 0, -1)
    enemyDirection.applyEuler(this.state.rotation)
    
    const dot = direction.dot(enemyDirection)
    return dot > 0.5 // 60 degree field of view
  }

  private idleBehavior(deltaTime: number): void {
    // Rotate slowly while idle
    this.state.rotation.y += deltaTime * 0.5
  }

  private patrolBehavior(deltaTime: number): void {
    if (this.state.patrolPoints.length === 0) return

    const targetPoint = this.state.patrolPoints[this.state.currentPatrolIndex]
    const distanceToTarget = this.state.position.distanceTo(targetPoint)

    if (distanceToTarget < 1.0) {
      // Reached patrol point, move to next
      this.state.currentPatrolIndex = (this.state.currentPatrolIndex + 1) % this.state.patrolPoints.length
    } else {
      // Move towards current patrol point
      this.moveTowards(targetPoint, deltaTime)
    }
  }

  private chaseBehavior(deltaTime: number, playerPosition: THREE.Vector3): void {
    this.moveTowards(playerPosition, deltaTime)
  }

  private attackBehavior(deltaTime: number, playerPosition: THREE.Vector3, currentTime: number): void {
    // Face the player
    const direction = playerPosition.clone().sub(this.state.position).normalize()
    this.state.rotation.y = Math.atan2(direction.x, direction.z)

    // Attack if cooldown is over
    if (currentTime - this.state.lastAttackTime > this.state.attackCooldown) {
      this.performAttack(playerPosition)
      this.state.lastAttackTime = currentTime
    }
  }

  private fleeBehavior(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Move away from player
    const fleeDirection = this.state.position.clone().sub(playerPosition).normalize()
    const fleeTarget = this.state.position.clone().add(fleeDirection.multiplyScalar(10))
    this.moveTowards(fleeTarget, deltaTime)
  }

  private moveTowards(target: THREE.Vector3, deltaTime: number): void {
    const direction = target.clone().sub(this.state.position).normalize()
    const movement = direction.multiplyScalar(this.state.speed * deltaTime)
    
    this.state.position.add(movement)
    
    // Face movement direction
    this.state.rotation.y = Math.atan2(direction.x, direction.z)
  }

  private performAttack(playerPosition: THREE.Vector3): void {
    // Create attack effect
    console.log(`Enemy ${this.state.id} attacks player!`)
    
    // TODO: Implement actual damage dealing to player
    // This would involve calling back to the game manager
  }

  private updateHealthBar(): void {
    if (!this.healthBar) return

    this.healthBar.position.copy(this.state.position)
    this.healthBar.position.y += 2
    
    // Update health bar color based on health percentage
    const healthPercentage = this.state.health / this.state.maxHealth
    const color = healthPercentage > 0.5 ? 0x00ff00 : healthPercentage > 0.25 ? 0xffff00 : 0xff0000
    ;(this.healthBar.material as THREE.MeshBasicMaterial).color.setHex(color)
    
    // Update health bar scale
    this.healthBar.scale.x = healthPercentage
  }

  public takeDamage(damage: number): boolean {
    this.state.health -= damage
    
    if (this.state.health <= 0) {
      this.state.health = 0
      this.state.state = 'dead'
      this.onDeath()
      return true // Enemy died
    }
    
    return false // Enemy survived
  }

  private onDeath(): void {
    // Change color to indicate death
    ;(this.mesh.material as THREE.MeshLambertMaterial).color.setHex(0x333333)
    
    // Hide health bar
    if (this.healthBar) {
      this.healthBar.visible = false
    }
    
    console.log(`Enemy ${this.state.id} defeated!`)
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh)
    if (this.healthBar) {
      scene.add(this.healthBar)
    }
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    if (this.healthBar) {
      scene.remove(this.healthBar)
    }
  }

  public getState(): EnemyState {
    return { ...this.state }
  }

  public isAlive(): boolean {
    return this.state.state !== 'dead'
  }

  public getPosition(): THREE.Vector3 {
    return this.state.position.clone()
  }
}