/**
 * 🤖 AI CONTROLLER - ERWEITERT MIT SHOOT FUNKTIONALITÄT
 */

import * as THREE from 'three'
import { WeaponManager } from '../weapons/WeaponManager'

// ============================================================
// TYPES
// ============================================================

export interface AIShootData {
  origin: THREE.Vector3
  direction: THREE.Vector3
  damage: number
  accuracy: number
}

type AIShootCallback = (data: AIShootData) => void
type AIDeathCallback = () => void

// ============================================================
// AI CONTROLLER - ERWEITERT
// ============================================================

export class AIController {
  // Core Properties
  private id: string
  private mesh: THREE.Object3D
  private health: number = 100
  private maxHealth: number = 100
  private currentState: string = 'IDLE'
  
  // Weapon System
  private weaponManager: WeaponManager | null = null
  private lastShotTime: number = 0
  private shootInterval: number = 2000 // Schießt alle 2 Sekunden
  private burstCount: number = 0
  private maxBurstShots: number = 3
  
  // Target Tracking
  private playerPosition: THREE.Vector3 = new THREE.Vector3()
  private hasLineOfSight: boolean = false
  private targetDistance: number = 0
  
  // Accuracy & Difficulty
  private personality: string
  private difficulty: string
  private baseAccuracy: number = 0.7 // 70% Basis-Genauigkeit
  
  // Scene
  private scene: THREE.Scene | null = null
  
  // Callbacks
  private onShootCallbacks: AIShootCallback[] = []
  private onDeathCallbacks: AIDeathCallback[] = []
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(
    personality: string = 'aggressive',
    difficulty: string = 'regular',
    botMesh: THREE.Object3D
  ) {
    this.personality = personality
    this.difficulty = difficulty
    this.mesh = botMesh
    this.id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Difficulty affects accuracy
    switch(difficulty) {
      case 'easy':
        this.baseAccuracy = 0.4
        this.shootInterval = 3000
        break
      case 'regular':
        this.baseAccuracy = 0.6
        this.shootInterval = 2000
        break
      case 'hard':
        this.baseAccuracy = 0.8
        this.shootInterval = 1500
        break
      case 'nightmare':
        this.baseAccuracy = 0.95
        this.shootInterval = 1000
        break
    }
  }
  
  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }
  
  setWeaponManager(weaponManager: WeaponManager): void {
    this.weaponManager = weaponManager
    // Gebe AI eine Standard-Waffe
    this.weaponManager.addWeapon('ai_rifle')
  }
  
  setPlayerPosition(position: THREE.Vector3): void {
    this.playerPosition.copy(position)
    this.targetDistance = this.mesh.position.distanceTo(position)
    this.checkLineOfSight()
  }
  
  setNavMesh(navmesh: any): void {
    // Navigation mesh for pathfinding
  }
  
  // ============================================================
  // LINE OF SIGHT CHECK
  // ============================================================
  
  private checkLineOfSight(): void {
    if (!this.scene) {
      this.hasLineOfSight = false
      return
    }
    
    const direction = this.playerPosition.clone()
      .sub(this.mesh.position)
      .normalize()
    
    const raycaster = new THREE.Raycaster(
      this.mesh.position,
      direction,
      0,
      this.targetDistance
    )
    
    const intersects = raycaster.intersectObjects(this.scene.children, true)
    
    // Hat Sichtlinie wenn keine Hindernisse oder nur der Spieler getroffen wird
    this.hasLineOfSight = intersects.length === 0 || 
      (intersects[0].object.userData?.type === 'PLAYER')
  }
  
  // ============================================================
  // SHOOTING SYSTEM - NEU
  // ============================================================
  
  /**
   * NEU: Methode zum Schießen auf den Spieler
   */
  public shootAtPlayer(): void {
    if (!this.canShoot()) {
      return
    }
    
    const now = Date.now()
    this.lastShotTime = now
    
    // Berechne Schussrichtung mit Genauigkeit
    const aimDirection = this.calculateAimDirection()
    
    // Schussposition (etwas vor dem AI)
    const shootOrigin = this.mesh.position.clone()
    shootOrigin.y += 1.5 // Schulterhöhe
    
    // Schaden basiert auf Distanz
    const damage = this.calculateDamage()
    
    // Fire callback
    const shootData: AIShootData = {
      origin: shootOrigin,
      direction: aimDirection,
      damage,
      accuracy: this.baseAccuracy
    }
    
    this.onShootCallbacks.forEach(cb => cb(shootData))
    
    // Burst Fire Logic
    this.burstCount++
    if (this.burstCount >= this.maxBurstShots) {
      this.burstCount = 0
      this.lastShotTime = now + 500 // Pause zwischen Bursts
    }
  }
  
  private canShoot(): boolean {
    const now = Date.now()
    
    // Check cooldown
    if (now - this.lastShotTime < this.shootInterval / this.maxBurstShots) {
      return false
    }
    
    // Check line of sight
    if (!this.hasLineOfSight) {
      return false
    }
    
    // Check distance (max 100m)
    if (this.targetDistance > 100) {
      return false
    }
    
    // Check state
    if (this.currentState === 'DEAD' || this.currentState === 'RELOADING') {
      return false
    }
    
    return true
  }
  
  private calculateAimDirection(): THREE.Vector3 {
    // Basis-Richtung zum Spieler
    const perfectDirection = this.playerPosition.clone()
      .sub(this.mesh.position)
      .normalize()
    
    // Genauigkeit anwenden (Streuung)
    const spread = (1 - this.baseAccuracy) * 0.1
    const offsetX = (Math.random() - 0.5) * spread
    const offsetY = (Math.random() - 0.5) * spread
    const offsetZ = (Math.random() - 0.5) * spread
    
    perfectDirection.x += offsetX
    perfectDirection.y += offsetY
    perfectDirection.z += offsetZ
    
    return perfectDirection.normalize()
  }
  
  private calculateDamage(): number {
    let baseDamage = 15
    
    // Distanz-Falloff
    if (this.targetDistance > 50) {
      baseDamage *= 0.7
    } else if (this.targetDistance > 30) {
      baseDamage *= 0.85
    }
    
    // Difficulty Multiplier
    switch(this.difficulty) {
      case 'easy':
        baseDamage *= 0.7
        break
      case 'hard':
        baseDamage *= 1.2
        break
      case 'nightmare':
        baseDamage *= 1.5
        break
    }
    
    return Math.round(baseDamage)
  }
  
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  public getCurrentState(): string {
    return this.currentState
  }
  
  private changeState(newState: string): void {
    this.currentState = newState
    
    switch(newState) {
      case 'ENGAGING':
        // Bereit zum Schießen
        break
      case 'DEAD':
        this.handleDeath()
        break
    }
  }
  
  // ============================================================
  // DAMAGE & HEALTH
  // ============================================================
  
  public takeDamage(damage: number, source: THREE.Vector3): void {
    this.health = Math.max(0, this.health - damage)
    
    if (this.health <= 0) {
      this.changeState('DEAD')
    }
  }
  
  private handleDeath(): void {
    // Fire death callbacks
    this.onDeathCallbacks.forEach(cb => cb())
    
    // Remove from scene
    if (this.scene && this.mesh) {
      this.scene.remove(this.mesh)
    }
  }
  
  public isAlive(): boolean {
    return this.health > 0
  }
  
  // ============================================================
  // UPDATE LOOP
  // ============================================================
  
  public update(deltaTime: number): void {
    if (!this.isAlive()) {
      return
    }
    
    // Update Sichtlinie
    this.checkLineOfSight()
    
    // State Machine
    if (this.hasLineOfSight && this.targetDistance < 50) {
      this.currentState = 'ENGAGING'
      
      // Auto-Shoot wenn engaged
      const now = Date.now()
      if (now - this.lastShotTime > this.shootInterval) {
        this.shootAtPlayer()
      }
    } else if (this.targetDistance < 100) {
      this.currentState = 'SEARCHING'
    } else {
      this.currentState = 'PATROLLING'
    }
    
    // Rotate towards player wenn in Reichweite
    if (this.targetDistance < 50) {
      this.mesh.lookAt(this.playerPosition)
    }
  }
  
  // ============================================================
  // EVENTS
  // ============================================================
  
  /**
   * NEU: Event wenn AI schießt
   */
  public onShoot(callback: AIShootCallback): void {
    this.onShootCallbacks.push(callback)
  }
  
  public onDeath(callback: AIDeathCallback): void {
    this.onDeathCallbacks.push(callback)
  }
  
  // ============================================================
  // GETTERS
  // ============================================================
  
  public getBotState(): any {
    return {
      id: this.id,
      position: this.mesh.position,
      health: this.health,
      maxHealth: this.maxHealth,
      currentState: this.currentState,
      hasLineOfSight: this.hasLineOfSight,
      targetDistance: this.targetDistance
    }
  }
}

export default AIController
