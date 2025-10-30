import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useRef, useEffect } from 'react'

// IMPORTS - Annahme: Diese Module existieren bereits
import { WeaponManager } from '../weapons/WeaponManager'
import { MovementController } from '../movement/MovementController'
import { AudioManager } from '../audio/AudioManager'
import { PhysicsEngine } from '../physics/PhysicsEngine'
import { NetworkManager } from '../networking/NetworkManager'
import { ProgressionManager } from '../progression/ProgressionManager'
import { EffectsManager } from '../effects/EffectsManager'
import { MapManager } from '../maps/MapManager'
import { AIController } from '../ai/AIController'
import { UIManager } from '../ui/UIManager'
import { GameModeManager } from './GameModeManager'
import { CollisionLayer } from '../physics/data/PhysicsData'

/**
 * 🎮 ULTIMATE FPS ENGINE V6 - VOLLSTÄNDIG INTEGRIERT 🔥
 * 
 * FEATURES:
 * ✅ Raycasting statt Projektile
 * ✅ AI Enemies die schießen
 * ✅ Vollständige Integration aller Manager
 * ✅ Dopamin-System für Kills
 */

export class UltimateFPSEngineV6 {
  // MANAGER
  private weaponManager: WeaponManager
  private movementController: MovementController
  private audioManager: AudioManager
  private physicsEngine: PhysicsEngine
  private networkManager: NetworkManager
  private progressionManager: ProgressionManager
  private effectsManager: EffectsManager
  private mapManager: MapManager
  private uiManager: UIManager
  private gameModeManager: GameModeManager
  
  // AI ENEMIES
  private aiEnemies: AIController[] = []
  private maxEnemies: number = 10
  
  // PLAYER STATE
  private playerHealth: number = 100
  private maxPlayerHealth: number = 100
  
  // ADDICTION LAYER
  private killStreak: number = 0
  private comboMultiplier: number = 1
  private lastKillTime: number = 0
  private dopamineEvents: DopamineEvent[] = []
  
  // SCENE
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  
  constructor() {
    // Initialisiere Manager
    this.weaponManager = new WeaponManager()
    this.movementController = new MovementController()
    this.audioManager = new AudioManager()
    this.physicsEngine = new PhysicsEngine()
    this.networkManager = new NetworkManager()
    this.progressionManager = new ProgressionManager()
    this.effectsManager = new EffectsManager()
    this.mapManager = new MapManager()
    this.uiManager = new UIManager()
    this.gameModeManager = new GameModeManager()
    
    // Scene Setup
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    
    this.setupIntegrations()
    this.setupAddictionHooks()
  }
  
  // ============================================================
  // INTEGRATION SETUP
  // ============================================================
  
  private setupIntegrations(): void {
    // Scene und Camera an Manager weitergeben
    this.weaponManager.setScene(this.scene)
    this.weaponManager.setCamera(this.camera)
    this.weaponManager.setPhysicsEngine(this.physicsEngine)
    
    this.physicsEngine.setScene(this.scene)
    
    // Weapon Manager Events mit Raycasting
    this.weaponManager.onWeaponSwitch((event) => {
      this.audioManager.playWeaponSwitch(event.to.getType())
      this.uiManager.updateWeaponDisplay(event.to)
    })
    
    this.weaponManager.onFire((shootResult) => {
      this.audioManager.playFireSound(shootResult.weapon.getType())
      this.effectsManager.showMuzzleFlash(shootResult.origin)
      
      // Recoil
      const recoilForce = shootResult.weapon.getRecoil()
      this.movementController.applyRecoil(recoilForce)
      
      // Raycasting Hit Detection
      const rayResult = this.physicsEngine.raycast(
        shootResult.origin,
        shootResult.direction,
        shootResult.weapon.getData().range,
        [CollisionLayer.ENEMY, CollisionLayer.WORLD]
      )
      
      if (rayResult.hit) {
        this.handleBulletHit({
          point: rayResult.point,
          normal: rayResult.normal,
          object: rayResult.object,
          damage: shootResult.damage,
          weapon: shootResult.weapon
        })
      }
    })
    
    // Movement Controller Events
    this.movementController.onMovementStateChange((state) => {
      if (state === 'SPRINTING') {
        this.audioManager.setFootstepSpeed(1.5)
      } else if (state === 'CROUCHING') {
        this.audioManager.setFootstepSpeed(0.5)
      }
      this.uiManager.updateMovementIndicator(state)
    })
    
    // Network Events
    this.networkManager.onPlayerKilled((killData) => {
      this.handleKill(killData)
    })
    
    // Map Manager
    this.mapManager.onMapLoaded((mapData) => {
      this.physicsEngine.loadCollisionMesh(mapData.collision)
      this.audioManager.setReverbZones(mapData.audioZones)
      
      // Spawn AI Enemies
      this.spawnAIEnemies(mapData.enemySpawnPoints || this.generateRandomSpawnPoints())
    })
  }
  
  private setupAddictionHooks(): void {
    // Dopamin-System für süchtig machende Mechaniken
    // Wird bei Kills aktiviert
  }
  
  // ============================================================
  // AI ENEMY MANAGEMENT
  // ============================================================
  
  private spawnAIEnemies(spawnPoints: THREE.Vector3[]): void {
    // Spawn AI Enemies
    const enemyCount = Math.min(this.maxEnemies, spawnPoints.length)
    
    for (let i = 0; i < enemyCount; i++) {
      const spawnPoint = spawnPoints[i]
      
      // Enemy Mesh
      const enemyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      )
      enemyMesh.position.copy(spawnPoint)
      enemyMesh.userData = { 
        type: 'ENEMY',
        id: `enemy_${i}`,
        health: 100
      }
      this.scene.add(enemyMesh)
      
      // AI Controller
      const ai = new AIController('aggressive_assault', 'regular', enemyMesh)
      ai.setScene(this.scene)
      ai.setWeaponManager(new WeaponManager()) // Jeder AI hat eigene Waffen
      ai.setPlayerPosition(this.camera.position)
      
      // AI Shoot Event
      ai.onShoot((shootData) => {
        this.handleAIShoot(ai, shootData)
      })
      
      // AI Death Event
      ai.onDeath(() => {
        this.handleEnemyDeath(ai)
      })
      
      this.aiEnemies.push(ai)
    }
  }
  
  private generateRandomSpawnPoints(): THREE.Vector3[] {
    const points: THREE.Vector3[] = []
    for (let i = 0; i < this.maxEnemies; i++) {
      points.push(new THREE.Vector3(
        Math.random() * 100 - 50,
        0,
        Math.random() * 100 - 50
      ))
    }
    return points
  }
  
  private handleAIShoot(ai: AIController, shootData: any): void {
    // AI schießt mit Raycasting
    const rayResult = this.physicsEngine.raycast(
      shootData.origin,
      shootData.direction,
      1000,
      [CollisionLayer.PLAYER]
    )
    
    if (rayResult.hit) {
      // Spieler getroffen
      this.handlePlayerHit(shootData.damage || 10)
      
      // Effekte
      this.effectsManager.createImpactEffect({
        position: rayResult.point,
        normal: rayResult.normal,
        type: 'blood'
      })
    }
    
    // Muzzle Flash für AI
    this.effectsManager.showMuzzleFlash(shootData.origin)
    this.audioManager.playFireSound('rifle')
  }
  
  // ============================================================
  // HIT DETECTION & DAMAGE
  // ============================================================
  
  private handleBulletHit(event: {
    point: THREE.Vector3
    normal: THREE.Vector3
    object: any
    damage: number
    weapon: any
  }): void {
    // Impact Effekte
    this.effectsManager.createImpactEffect({
      position: event.point,
      normal: event.normal,
      type: event.object?.userData?.type === 'ENEMY' ? 'blood' : 'concrete'
    })
    
    // Sound
    this.audioManager.playImpactSound(event.object?.material || 'concrete')
    
    // Damage anwenden
    if (event.object?.userData?.type === 'ENEMY') {
      const enemyId = event.object.userData.id
      const enemy = this.aiEnemies.find(ai => ai.getBotState().id === enemyId)
      
      if (enemy && enemy.isAlive()) {
        // Headshot Check
        const isHeadshot = event.point.y > event.object.position.y + 1.5
        const finalDamage = isHeadshot ? event.damage * 2 : event.damage
        
        enemy.takeDamage(finalDamage, event.point)
        
        if (!enemy.isAlive()) {
          this.handleKill({
            victimId: enemyId,
            victimPosition: event.object.position,
            weapon: event.weapon.getName(),
            distance: event.point.distanceTo(this.camera.position),
            isHeadshot,
            isWallbang: false,
            isMidair: false
          })
        }
      }
    }
  }
  
  private handlePlayerHit(damage: number): void {
    this.playerHealth = Math.max(0, this.playerHealth - damage)
    
    // UI Updates
    this.uiManager.updateHealth(this.playerHealth)
    this.effectsManager.showDamageIndicator()
    this.audioManager.playPlayerHitSound()
    
    // Screen Shake
    this.applyScreenShake(0.3)
    
    if (this.playerHealth <= 0) {
      this.handlePlayerDeath()
    }
  }
  
  private handlePlayerDeath(): void {
    this.audioManager.playDeathSound()
    this.uiManager.showDeathScreen()
    
    // Reset nach 3 Sekunden
    setTimeout(() => {
      this.respawnPlayer()
    }, 3000)
  }
  
  private handleEnemyDeath(ai: AIController): void {
    // Entferne aus Liste
    const index = this.aiEnemies.indexOf(ai)
    if (index > -1) {
      this.aiEnemies.splice(index, 1)
    }
    
    // Spawn neuen Enemy nach 5 Sekunden
    setTimeout(() => {
      this.spawnAIEnemies([this.generateRandomSpawnPoints()[0]])
    }, 5000)
  }
  
  private respawnPlayer(): void {
    this.playerHealth = this.maxPlayerHealth
    this.camera.position.set(0, 1.7, 0)
    this.uiManager.hideDeathScreen()
    this.uiManager.updateHealth(this.playerHealth)
    this.killStreak = 0
    this.comboMultiplier = 1
  }
  
  // ============================================================
  // KILL HANDLING & DOPAMINE SYSTEM
  // ============================================================
  
  private handleKill(killData: KillData): void {
    const dopamineEvent = this.calculateDopamineEvent(killData)
    
    // Visuelle Effekte
    this.effectsManager.triggerKillEffect({
      type: dopamineEvent.type,
      position: killData.victimPosition,
      intensity: dopamineEvent.intensity
    })
    
    // Audio
    if (dopamineEvent.type === 'HEADSHOT') {
      this.audioManager.playHeadshotSound()
    } else if (this.killStreak > 3) {
      this.audioManager.playKillstreakSound(this.killStreak)
    }
    
    // UI
    this.uiManager.showKillNotification({
      type: dopamineEvent.type,
      points: dopamineEvent.points,
      streak: this.killStreak
    })
    
    // Progression
    this.progressionManager.addExperience(dopamineEvent.points)
    
    // Screen Shake
    this.applyScreenShake(dopamineEvent.intensity)
  }
  
  private calculateDopamineEvent(killData: KillData): DopamineEvent {
    const now = Date.now()
    const timeSinceLastKill = now - this.lastKillTime
    
    // Combo Multiplier
    if (timeSinceLastKill < 3000) {
      this.comboMultiplier = Math.min(this.comboMultiplier + 0.5, 5)
    } else {
      this.comboMultiplier = 1
    }
    
    // Kill Streak
    this.killStreak++
    
    // Event Type
    let type: KillEventType = 'NORMAL'
    let basePoints = 100
    
    if (killData.isHeadshot) {
      type = 'HEADSHOT'
      basePoints = 150
    }
    
    if (killData.distance > 50) {
      type = 'LONGSHOT'
      basePoints += 50
    }
    
    const finalPoints = Math.floor(basePoints * this.comboMultiplier)
    this.lastKillTime = now
    
    return {
      type,
      points: finalPoints,
      intensity: this.comboMultiplier / 5,
      multiplier: this.comboMultiplier,
      streak: this.killStreak
    }
  }
  
  private applyScreenShake(intensity: number): void {
    const duration = 200 + (intensity * 100)
    const amplitude = 0.5 * intensity
    let startTime = Date.now()
    
    const shakeLoop = () => {
      const elapsed = Date.now() - startTime
      
      if (elapsed < duration) {
        const decay = 1 - (elapsed / duration)
        const shake = amplitude * decay
        
        this.camera.position.x += (Math.random() - 0.5) * shake
        this.camera.position.y += (Math.random() - 0.5) * shake
        
        requestAnimationFrame(shakeLoop)
      }
    }
    
    shakeLoop()
  }
  
  // ============================================================
  // GAME LOOP
  // ============================================================
  
  public update(deltaTime: number): void {
    // Update Manager
    this.movementController.update(deltaTime)
    this.weaponManager.update(deltaTime)
    this.physicsEngine.update(deltaTime)
    this.effectsManager.update(deltaTime)
    this.networkManager.update(deltaTime)
    
    // Update AI Enemies
    for (const enemy of this.aiEnemies) {
      if (enemy.isAlive()) {
        enemy.setPlayerPosition(this.camera.position)
        enemy.update(deltaTime)
        
        // AI schießt alle 2-3 Sekunden wenn Spieler sichtbar
        if (Math.random() < 0.01 && enemy.getCurrentState() === 'ENGAGING') {
          enemy.shootAtPlayer()
        }
      }
    }
    
    // Combo Decay
    if (Date.now() - this.lastKillTime > 5000) {
      this.comboMultiplier = Math.max(1, this.comboMultiplier - deltaTime * 0.1)
    }
  }
  
  // ============================================================
  // PUBLIC API
  // ============================================================
  
  public async loadMap(mapId: string): Promise<void> {
    await this.mapManager.loadMap(mapId)
  }
  
  public setGameMode(mode: string): void {
    this.gameModeManager.setMode(mode)
  }
  
  public getPlayerStats() {
    return {
      kills: this.progressionManager.getStatistic('kills'),
      deaths: this.progressionManager.getStatistic('deaths'),
      kd: this.progressionManager.getKDRatio(),
      level: this.progressionManager.getLevel(),
      xp: this.progressionManager.getExperience(),
      health: this.playerHealth,
      killStreak: this.killStreak,
      comboMultiplier: this.comboMultiplier
    }
  }
}

// ============================================================
// TYPES
// ============================================================

interface DopamineEvent {
  type: KillEventType
  points: number
  intensity: number
  multiplier: number
  streak: number
}

interface KillData {
  victimId: string
  victimPosition: THREE.Vector3
  weapon: string
  distance: number
  isHeadshot: boolean
  isWallbang: boolean
  isMidair: boolean
}

type KillEventType = 'NORMAL' | 'HEADSHOT' | 'LONGSHOT' | 'WALLBANG'

// ============================================================
// REACT COMPONENT
// ============================================================

export const UltimateFPSGame: React.FC = () => {
  const engineRef = useRef<UltimateFPSEngineV6>()
  
  useEffect(() => {
    engineRef.current = new UltimateFPSEngineV6()
    engineRef.current.loadMap('de_dust2')
    engineRef.current.setGameMode('deathmatch')
    
    const animate = () => {
      engineRef.current?.update(0.016)
      requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      // Cleanup
    }
  }, [])
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <Physics>
          {/* Game rendered by engine */}
        </Physics>
      </Canvas>
    </div>
  )
}

export default UltimateFPSEngineV6
