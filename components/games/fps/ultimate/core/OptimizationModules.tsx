/**
 * 🚀 PERFORMANCE OPTIMIZATION MODULES FOR ULTIMATE FPS ENGINE V4
 * 
 * Diese Module können in die UltimateFPSEngineV4 integriert werden,
 * um die Performance-Probleme zu beheben.
 */

import * as THREE from 'three'

// ============================================================
// 🎯 OBJECT POOL FÜR PROJEKTILE - Verhindert Memory Leaks
// ============================================================

export class ProjectilePool {
  private pool: THREE.Mesh[] = []
  private activeProjectiles = new Map<THREE.Mesh, ProjectileData>()
  private scene: THREE.Scene
  private maxPoolSize = 200 // Erhöht für intensive Gefechte
  private projectileGeometry: THREE.SphereGeometry
  private projectileMaterials: {
    player: THREE.MeshStandardMaterial,
    enemy: THREE.MeshStandardMaterial
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.projectileGeometry = new THREE.SphereGeometry(0.05)
    
    // Verschiedene Materialien für Player/Enemy Projektile
    this.projectileMaterials = {
      player: new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.8
      }),
      enemy: new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.6
      })
    }
    
    this.initializePool()
  }

  private initializePool() {
    for (let i = 0; i < this.maxPoolSize; i++) {
      const projectile = new THREE.Mesh(
        this.projectileGeometry, 
        this.projectileMaterials.player.clone()
      )
      projectile.visible = false
      projectile.castShadow = true
      projectile.receiveShadow = false
      this.pool.push(projectile)
    }
    console.log(`[ProjectilePool] Initialized with ${this.maxPoolSize} projectiles`)
  }

  getProjectile(isPlayerProjectile: boolean = true): THREE.Mesh | null {
    let projectile = this.pool.pop()
    
    // Falls Pool leer, erstelle dynamisch neues Projektil (Notfall)
    if (!projectile && this.activeProjectiles.size < this.maxPoolSize * 1.5) {
      projectile = new THREE.Mesh(
        this.projectileGeometry,
        isPlayerProjectile ? 
          this.projectileMaterials.player.clone() : 
          this.projectileMaterials.enemy.clone()
      )
      console.warn('[ProjectilePool] Pool exhausted, creating emergency projectile')
    }
    
    if (projectile) {
      // Setze richtiges Material
      projectile.material = isPlayerProjectile ? 
        this.projectileMaterials.player : 
        this.projectileMaterials.enemy
      
      projectile.visible = true
      this.scene.add(projectile)
      return projectile
    }
    
    return null
  }

  releaseProjectile(projectile: THREE.Mesh) {
    projectile.visible = false
    projectile.position.set(0, -1000, 0) // Verstecke außerhalb der Sichtweite
    this.scene.remove(projectile)
    this.activeProjectiles.delete(projectile)
    
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(projectile)
    } else {
      // Wenn Pool voll, dispose
      projectile.geometry?.dispose()
      if (projectile.material instanceof THREE.Material) {
        projectile.material.dispose()
      }
    }
  }

  setProjectileData(mesh: THREE.Mesh, data: ProjectileData) {
    this.activeProjectiles.set(mesh, data)
  }

  getProjectileData(mesh: THREE.Mesh): ProjectileData | undefined {
    return this.activeProjectiles.get(mesh)
  }

  getActiveCount(): number {
    return this.activeProjectiles.size
  }

  clear() {
    // Release all active projectiles
    this.activeProjectiles.forEach((data, mesh) => {
      this.releaseProjectile(mesh)
    })
    
    // Dispose pool
    this.pool.forEach(projectile => {
      projectile.geometry?.dispose()
      if (projectile.material instanceof THREE.Material) {
        projectile.material.dispose()
      }
    })
    
    this.pool = []
    this.activeProjectiles.clear()
  }
}

// ============================================================
// 🗺️ SPATIAL HASHING - Effiziente Kollisionserkennung
// ============================================================

export class SpatialHashGrid {
  private cellSize: number
  private grid: Map<string, Set<SpatialObject>> = new Map()
  private objectCells: Map<SpatialObject, Set<string>> = new Map()

  constructor(cellSize: number = 5) {
    this.cellSize = cellSize
  }

  private getKeys(position: THREE.Vector3, radius: number = 0): string[] {
    const keys: string[] = []
    const minX = Math.floor((position.x - radius) / this.cellSize)
    const maxX = Math.floor((position.x + radius) / this.cellSize)
    const minZ = Math.floor((position.z - radius) / this.cellSize)
    const maxZ = Math.floor((position.z + radius) / this.cellSize)

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        keys.push(`${x},${z}`)
      }
    }
    return keys
  }

  insert(obj: SpatialObject) {
    // Entferne aus alten Zellen
    this.remove(obj)
    
    const keys = this.getKeys(obj.position, obj.radius)
    const cellSet = new Set<string>()
    
    keys.forEach(key => {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set())
      }
      this.grid.get(key)!.add(obj)
      cellSet.add(key)
    })
    
    this.objectCells.set(obj, cellSet)
  }

  remove(obj: SpatialObject) {
    const cells = this.objectCells.get(obj)
    if (cells) {
      cells.forEach(key => {
        const cell = this.grid.get(key)
        if (cell) {
          cell.delete(obj)
          if (cell.size === 0) {
            this.grid.delete(key)
          }
        }
      })
      this.objectCells.delete(obj)
    }
  }

  update(obj: SpatialObject) {
    // Effizientes Update nur wenn sich Position signifikant ändert
    this.insert(obj)
  }

  getNearby(position: THREE.Vector3, radius: number): SpatialObject[] {
    const nearby = new Set<SpatialObject>()
    const keys = this.getKeys(position, radius)
    
    keys.forEach(key => {
      const cell = this.grid.get(key)
      if (cell) {
        cell.forEach(obj => nearby.add(obj))
      }
    })
    
    // Filtere nach tatsächlicher Distanz
    return Array.from(nearby).filter(obj => {
      const distance = obj.position.distanceTo(position)
      return distance <= radius + obj.radius
    })
  }

  clear() {
    this.grid.clear()
    this.objectCells.clear()
  }

  getDebugInfo(): { cellCount: number, objectCount: number } {
    return {
      cellCount: this.grid.size,
      objectCount: this.objectCells.size
    }
  }
}

// ============================================================
// 📦 BOUNDING BOX SYSTEM - Präzise Kollisionserkennung
// ============================================================

export class BoundingBoxSystem {
  private boxes: Map<string, THREE.Box3> = new Map()
  private helpers: Map<string, THREE.Box3Helper> = new Map()
  private showDebug: boolean = false

  createBox(id: string, object: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3().setFromObject(object)
    this.boxes.set(id, box)
    
    if (this.showDebug) {
      const helper = new THREE.Box3Helper(box, 0x00ff00)
      this.helpers.set(id, helper)
    }
    
    return box
  }

  updateBox(id: string, object: THREE.Object3D) {
    const box = this.boxes.get(id)
    if (box) {
      box.setFromObject(object)
      
      const helper = this.helpers.get(id)
      if (helper && this.showDebug) {
        helper.box = box
      }
    }
  }

  checkCollision(id1: string, id2: string): boolean {
    const box1 = this.boxes.get(id1)
    const box2 = this.boxes.get(id2)
    
    if (box1 && box2) {
      return box1.intersectsBox(box2)
    }
    
    return false
  }

  checkRayIntersection(id: string, raycaster: THREE.Raycaster): THREE.Vector3 | null {
    const box = this.boxes.get(id)
    if (box) {
      const intersectionPoint = new THREE.Vector3()
      const ray = raycaster.ray
      
      if (ray.intersectBox(box, intersectionPoint)) {
        return intersectionPoint
      }
    }
    return null
  }

  removeBox(id: string) {
    this.boxes.delete(id)
    
    const helper = this.helpers.get(id)
    if (helper) {
      helper.dispose()
      this.helpers.delete(id)
    }
  }

  setDebug(enabled: boolean, scene?: THREE.Scene) {
    this.showDebug = enabled
    
    if (!enabled && scene) {
      // Entferne alle Helper
      this.helpers.forEach(helper => {
        scene.remove(helper)
        helper.dispose()
      })
      this.helpers.clear()
    }
  }

  clear() {
    this.boxes.clear()
    this.helpers.forEach(helper => helper.dispose())
    this.helpers.clear()
  }
}

// ============================================================
// 🎲 SPAWN ZONE SYSTEM - Bessere Enemy Spawns
// ============================================================

export class SpawnZoneSystem {
  private zones: SpawnZone[] = []
  private recentSpawns: { position: THREE.Vector3, time: number }[] = []
  private minSpawnDistance = 20
  private maxRecentSpawns = 10
  
  constructor() {
    this.initializeDefaultZones()
  }

  private initializeDefaultZones() {
    // Erstelle strategisch platzierte Spawn-Zonen
    const zoneConfigs = [
      // Ecken der Map
      { center: new THREE.Vector3(60, 0, 60), radius: 15, weight: 1 },
      { center: new THREE.Vector3(-60, 0, 60), radius: 15, weight: 1 },
      { center: new THREE.Vector3(60, 0, -60), radius: 15, weight: 1 },
      { center: new THREE.Vector3(-60, 0, -60), radius: 15, weight: 1 },
      
      // Seiten der Map
      { center: new THREE.Vector3(80, 0, 0), radius: 20, weight: 1.5 },
      { center: new THREE.Vector3(-80, 0, 0), radius: 20, weight: 1.5 },
      { center: new THREE.Vector3(0, 0, 80), radius: 20, weight: 1.5 },
      { center: new THREE.Vector3(0, 0, -80), radius: 20, weight: 1.5 },
      
      // Mid-range Zonen
      { center: new THREE.Vector3(40, 0, 40), radius: 10, weight: 0.8 },
      { center: new THREE.Vector3(-40, 0, 40), radius: 10, weight: 0.8 },
      { center: new THREE.Vector3(40, 0, -40), radius: 10, weight: 0.8 },
      { center: new THREE.Vector3(-40, 0, -40), radius: 10, weight: 0.8 }
    ]
    
    zoneConfigs.forEach(config => {
      this.addZone({
        id: `zone-${this.zones.length}`,
        center: config.center,
        radius: config.radius,
        minDistance: this.minSpawnDistance,
        weight: config.weight,
        isActive: true
      })
    })
  }

  addZone(zone: SpawnZone) {
    this.zones.push(zone)
  }

  removeZone(id: string) {
    this.zones = this.zones.filter(z => z.id !== id)
  }

  getSpawnPosition(playerPosition: THREE.Vector3, avoidPositions: THREE.Vector3[] = []): THREE.Vector3 | null {
    // Filtere aktive Zonen, die weit genug vom Spieler entfernt sind
    const validZones = this.zones.filter(zone => {
      if (!zone.isActive) return false
      
      const distanceToPlayer = zone.center.distanceTo(playerPosition)
      return distanceToPlayer >= zone.minDistance
    })
    
    if (validZones.length === 0) return null
    
    // Wähle Zone basierend auf Gewichtung
    const totalWeight = validZones.reduce((sum, z) => sum + z.weight, 0)
    let randomWeight = Math.random() * totalWeight
    let selectedZone: SpawnZone | null = null
    
    for (const zone of validZones) {
      randomWeight -= zone.weight
      if (randomWeight <= 0) {
        selectedZone = zone
        break
      }
    }
    
    if (!selectedZone) selectedZone = validZones[0]
    
    // Generiere zufällige Position innerhalb der Zone
    let attempts = 0
    const maxAttempts = 20
    
    while (attempts < maxAttempts) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * selectedZone.radius
      
      const spawnPos = new THREE.Vector3(
        selectedZone.center.x + Math.cos(angle) * distance,
        1, // Spawn height
        selectedZone.center.z + Math.sin(angle) * distance
      )
      
      // Prüfe ob Position valide ist
      let isValid = true
      
      // Prüfe Distanz zum Spieler
      if (spawnPos.distanceTo(playerPosition) < this.minSpawnDistance) {
        isValid = false
      }
      
      // Prüfe Distanz zu anderen zu vermeidenden Positionen
      for (const avoidPos of avoidPositions) {
        if (spawnPos.distanceTo(avoidPos) < 10) {
          isValid = false
          break
        }
      }
      
      // Prüfe Distanz zu kürzlichen Spawns
      for (const recent of this.recentSpawns) {
        if (spawnPos.distanceTo(recent.position) < 15) {
          isValid = false
          break
        }
      }
      
      if (isValid) {
        // Füge zu kürzlichen Spawns hinzu
        this.recentSpawns.push({ position: spawnPos.clone(), time: Date.now() })
        
        // Limitiere Anzahl der gespeicherten Spawns
        if (this.recentSpawns.length > this.maxRecentSpawns) {
          this.recentSpawns.shift()
        }
        
        return spawnPos
      }
      
      attempts++
    }
    
    // Fallback: Zufällige Position wenn keine valide gefunden
    console.warn('[SpawnZoneSystem] Could not find valid spawn position')
    return null
  }

  cleanOldSpawns(maxAge: number = 30000) {
    const now = Date.now()
    this.recentSpawns = this.recentSpawns.filter(spawn => now - spawn.time < maxAge)
  }

  setZoneActive(id: string, active: boolean) {
    const zone = this.zones.find(z => z.id === id)
    if (zone) {
      zone.isActive = active
    }
  }

  getDebugInfo() {
    return {
      totalZones: this.zones.length,
      activeZones: this.zones.filter(z => z.isActive).length,
      recentSpawns: this.recentSpawns.length
    }
  }
}

// ============================================================
// INTERFACES & TYPES
// ============================================================

interface ProjectileData {
  direction: THREE.Vector3
  speed: number
  damage: number
  owner: string // 'player' | enemy ID
  type: 'bullet' | 'rocket' | 'grenade'
  lifeTime: number
  maxLifeTime: number
  boundingBox?: THREE.Box3
}

interface SpatialObject {
  id: string
  position: THREE.Vector3
  radius: number
  type: 'enemy' | 'player' | 'projectile' | 'obstacle'
  data?: any
}

interface SpawnZone {
  id: string
  center: THREE.Vector3
  radius: number
  minDistance: number
  weight: number // Wahrscheinlichkeit dass diese Zone gewählt wird
  isActive: boolean
}

// ============================================================
// EXPORT OPTIMIZED SYSTEMS
// ============================================================

export const OptimizationSystems = {
  ProjectilePool,
  SpatialHashGrid,
  BoundingBoxSystem,
  SpawnZoneSystem
}

export type { ProjectileData, SpatialObject, SpawnZone }
