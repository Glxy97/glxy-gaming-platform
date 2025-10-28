import * as THREE from 'three'
import { Enemy, EnemyState } from './enemy'

export interface EnemySpawn {
  id: string
  position: THREE.Vector3
  patrolPoints: THREE.Vector3[]
  type: 'basic' | 'heavy' | 'fast' | 'sniper'
}

export interface EnemyWave {
  waveNumber: number
  enemies: EnemySpawn[]
  spawnDelay: number
  difficulty: number
}

export class EnemyManager {
  private enemies: Map<string, Enemy> = new Map()
  private scene: THREE.Scene
  private waves: EnemyWave[] = []
  private currentWave: number = 0
  private waveActive: boolean = false
  private lastSpawnTime: number = 0
  private playerPosition: THREE.Vector3 = new THREE.Vector3()

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initializeWaves()
  }

  private initializeWaves(): void {
    // Define enemy waves with increasing difficulty
    this.waves = [
      {
        waveNumber: 1,
        enemies: [
          {
            id: 'enemy_1_1',
            position: new THREE.Vector3(10, 0, 10),
            patrolPoints: [
              new THREE.Vector3(10, 0, 10),
              new THREE.Vector3(15, 0, 10),
              new THREE.Vector3(15, 0, 15),
              new THREE.Vector3(10, 0, 15)
            ],
            type: 'basic'
          },
          {
            id: 'enemy_1_2',
            position: new THREE.Vector3(-10, 0, -10),
            patrolPoints: [
              new THREE.Vector3(-10, 0, -10),
              new THREE.Vector3(-15, 0, -10),
              new THREE.Vector3(-15, 0, -15),
              new THREE.Vector3(-10, 0, -15)
            ],
            type: 'basic'
          }
        ],
        spawnDelay: 2000,
        difficulty: 1.0
      },
      {
        waveNumber: 2,
        enemies: [
          {
            id: 'enemy_2_1',
            position: new THREE.Vector3(20, 0, 0),
            patrolPoints: [
              new THREE.Vector3(20, 0, 0),
              new THREE.Vector3(20, 0, 10),
              new THREE.Vector3(20, 0, -10)
            ],
            type: 'fast'
          },
          {
            id: 'enemy_2_2',
            position: new THREE.Vector3(-20, 0, 0),
            patrolPoints: [
              new THREE.Vector3(-20, 0, 0),
              new THREE.Vector3(-20, 0, 10),
              new THREE.Vector3(-20, 0, -10)
            ],
            type: 'heavy'
          },
          {
            id: 'enemy_2_3',
            position: new THREE.Vector3(0, 0, 20),
            patrolPoints: [
              new THREE.Vector3(0, 0, 20),
              new THREE.Vector3(10, 0, 20),
              new THREE.Vector3(-10, 0, 20)
            ],
            type: 'basic'
          }
        ],
        spawnDelay: 1500,
        difficulty: 1.5
      },
      {
        waveNumber: 3,
        enemies: [
          {
            id: 'enemy_3_1',
            position: new THREE.Vector3(15, 0, 15),
            patrolPoints: [
              new THREE.Vector3(15, 0, 15),
              new THREE.Vector3(20, 0, 20),
              new THREE.Vector3(10, 0, 20),
              new THREE.Vector3(10, 0, 10)
            ],
            type: 'sniper'
          },
          {
            id: 'enemy_3_2',
            position: new THREE.Vector3(-15, 0, -15),
            patrolPoints: [
              new THREE.Vector3(-15, 0, -15),
              new THREE.Vector3(-20, 0, -20),
              new THREE.Vector3(-10, 0, -20),
              new THREE.Vector3(-10, 0, -10)
            ],
            type: 'heavy'
          },
          {
            id: 'enemy_3_3',
            position: new THREE.Vector3(25, 0, 0),
            patrolPoints: [
              new THREE.Vector3(25, 0, 0),
              new THREE.Vector3(30, 0, 5),
              new THREE.Vector3(30, 0, -5)
            ],
            type: 'fast'
          },
          {
            id: 'enemy_3_4',
            position: new THREE.Vector3(-25, 0, 0),
            patrolPoints: [
              new THREE.Vector3(-25, 0, 0),
              new THREE.Vector3(-30, 0, 5),
              new THREE.Vector3(-30, 0, -5)
            ],
            type: 'basic'
          }
        ],
        spawnDelay: 1000,
        difficulty: 2.0
      }
    ]
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    this.playerPosition = playerPosition

    // Update all enemies
    this.enemies.forEach((enemy, id) => {
      enemy.update(deltaTime, playerPosition, this.scene)
      
      // Remove dead enemies
      if (!enemy.isAlive()) {
        this.removeEnemy(id)
      }
    })

    // Handle wave spawning
    if (this.waveActive) {
      this.handleWaveSpawning()
    }

    // Check if current wave is complete
    if (this.waveActive && this.enemies.size === 0) {
      this.completeWave()
    }
  }

  private handleWaveSpawning(): void {
    if (this.currentWave >= this.waves.length) return

    const wave = this.waves[this.currentWave]
    const currentTime = Date.now()

    if (currentTime - this.lastSpawnTime > wave.spawnDelay) {
      const remainingEnemies = wave.enemies.filter(spawn => 
        !this.enemies.has(spawn.id)
      )

      if (remainingEnemies.length > 0) {
        const spawn = remainingEnemies[0]
        this.spawnEnemy(spawn)
        this.lastSpawnTime = currentTime
      }
    }
  }

  private spawnEnemy(spawn: EnemySpawn): void {
    const enemy = this.createEnemyByType(spawn)
    this.enemies.set(spawn.id, enemy)
    enemy.addToScene(this.scene)
    
    console.log(`Spawned enemy: ${spawn.id} (${spawn.type})`)
  }

  private createEnemyByType(spawn: EnemySpawn): Enemy {
    const enemy = new Enemy(spawn.id, spawn.position, spawn.patrolPoints)

    // Configure enemy based on type
    switch (spawn.type) {
      case 'basic':
        enemy.state.health = 100
        enemy.state.maxHealth = 100
        enemy.state.speed = 2.0
        enemy.state.damage = 10
        enemy.state.attackRange = 5.0
        enemy.state.detectionRange = 20.0
        enemy.state.attackCooldown = 1000
        break

      case 'heavy':
        enemy.state.health = 200
        enemy.state.maxHealth = 200
        enemy.state.speed = 1.5
        enemy.state.damage = 20
        enemy.state.attackRange = 3.0
        enemy.state.detectionRange = 15.0
        enemy.state.attackCooldown = 1500
        // Change color for heavy enemy
        ;(enemy.mesh.material as THREE.MeshLambertMaterial).color.setHex(0x8B0000)
        break

      case 'fast':
        enemy.state.health = 60
        enemy.state.maxHealth = 60
        enemy.state.speed = 4.0
        enemy.state.damage = 8
        enemy.state.attackRange = 3.0
        enemy.state.detectionRange = 25.0
        enemy.state.attackCooldown = 800
        // Change color for fast enemy
        ;(enemy.mesh.material as THREE.MeshLambertMaterial).color.setHex(0xFF4500)
        break

      case 'sniper':
        enemy.state.health = 80
        enemy.state.maxHealth = 80
        enemy.state.speed = 1.0
        enemy.state.damage = 30
        enemy.state.attackRange = 30.0
        enemy.state.detectionRange = 40.0
        enemy.state.attackCooldown = 2000
        // Change color for sniper enemy
        ;(enemy.mesh.material as THREE.MeshLambertMaterial).color.setHex(0x4B0082)
        break
    }

    return enemy
  }

  private removeEnemy(id: string): void {
    const enemy = this.enemies.get(id)
    if (enemy) {
      enemy.removeFromScene(this.scene)
      this.enemies.delete(id)
      
      // Notify about enemy death (for scoring, etc.)
      this.onEnemyDeath(enemy)
    }
  }

  private onEnemyDeath(enemy: Enemy): void {
    console.log(`Enemy ${enemy.state.id} defeated!`)
    // TODO: Add score, trigger effects, etc.
  }

  private completeWave(): void {
    this.waveActive = false
    console.log(`Wave ${this.currentWave + 1} completed!`)
    
    // TODO: Show wave completion UI, give rewards, etc.
  }

  public startWave(waveNumber: number = 1): void {
    this.currentWave = waveNumber - 1
    this.waveActive = true
    this.lastSpawnTime = Date.now()
    
    // Clear existing enemies
    this.clearAllEnemies()
    
    console.log(`Starting wave ${waveNumber}`)
  }

  public clearAllEnemies(): void {
    this.enemies.forEach((enemy, id) => {
      enemy.removeFromScene(this.scene)
    })
    this.enemies.clear()
  }

  public getEnemyCount(): number {
    return this.enemies.size
  }

  public getAliveEnemies(): Enemy[] {
    return Array.from(this.enemies.values()).filter(enemy => enemy.isAlive())
  }

  public getEnemyStates(): EnemyState[] {
    return Array.from(this.enemies.values()).map(enemy => enemy.getState())
  }

  public getCurrentWave(): number {
    return this.currentWave + 1
  }

  public getTotalWaves(): number {
    return this.waves.length
  }

  public isWaveActive(): boolean {
    return this.waveActive
  }

  public getNearestEnemy(position: THREE.Vector3): Enemy | null {
    let nearest: Enemy | null = null
    let minDistance = Infinity

    this.enemies.forEach(enemy => {
      if (enemy.isAlive()) {
        const distance = enemy.getPosition().distanceTo(position)
        if (distance < minDistance) {
          minDistance = distance
          nearest = enemy
        }
      }
    })

    return nearest
  }

  public damageEnemyAtPosition(position: THREE.Vector3, damage: number, radius: number = 2.0): boolean {
    let hit = false
    
    this.enemies.forEach(enemy => {
      if (enemy.isAlive()) {
        const distance = enemy.getPosition().distanceTo(position)
        if (distance <= radius) {
          const died = enemy.takeDamage(damage)
          hit = true
          
          if (died) {
            console.log(`Enemy killed at position: ${position.x}, ${position.y}, ${position.z}`)
          }
        }
      }
    })

    return hit
  }

  public dispose(): void {
    this.clearAllEnemies()
    this.waves = []
    this.waveActive = false
  }
}