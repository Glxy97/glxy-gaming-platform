/**
 * 🗺️ MAP INTERACTION SYSTEM
 * 
 * Interaktive Objekte in der Map
 * - Doors (öffnen/schließen)
 * - Breakables (zerstörbare Objekte)
 * - Interactive Objects
 * - Destructible Cover
 */

import * as THREE from 'three'

// =============================================================================
// INTERACTIVE OBJECT TYPES
// =============================================================================

export enum InteractiveObjectType {
  DOOR = 'door',
  BREAKABLE = 'breakable',
  BUTTON = 'button',
  COVER = 'cover',
  PICKUP = 'pickup'
}

export interface InteractiveObject {
  id: string
  type: InteractiveObjectType
  mesh: THREE.Object3D
  position: THREE.Vector3
  isActive: boolean
  health?: number
  maxHealth?: number
  canInteract: boolean
  interactRadius: number
  onInteract?: () => void
  onDestroy?: () => void
}

// =============================================================================
// DOOR SYSTEM
// =============================================================================

export interface Door extends InteractiveObject {
  type: InteractiveObjectType.DOOR
  isOpen: boolean
  openRotation: number
  closedRotation: number
  animationSpeed: number
  isLocked: boolean
}

export class DoorManager {
  private doors: Map<string, Door> = new Map()
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  /**
   * Create a door
   */
  createDoor(position: THREE.Vector3, rotation: number = 0): Door {
    const id = `door_${Date.now()}_${Math.random()}`
    
    // Door geometry
    const doorGeometry = new THREE.BoxGeometry(1, 2.5, 0.1)
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    })
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial)
    doorMesh.position.copy(position)
    doorMesh.rotation.y = rotation
    doorMesh.castShadow = true
    doorMesh.receiveShadow = true
    doorMesh.userData.type = 'DOOR'
    doorMesh.userData.id = id
    
    this.scene.add(doorMesh)
    
    const door: Door = {
      id,
      type: InteractiveObjectType.DOOR,
      mesh: doorMesh,
      position: position.clone(),
      isActive: true,
      canInteract: true,
      interactRadius: 3,
      isOpen: false,
      openRotation: rotation + Math.PI / 2,
      closedRotation: rotation,
      animationSpeed: 2,
      isLocked: false
    }
    
    this.doors.set(id, door)
    return door
  }

  /**
   * Toggle door (open/close)
   */
  toggleDoor(doorId: string): boolean {
    const door = this.doors.get(doorId)
    if (!door || door.isLocked) return false
    
    door.isOpen = !door.isOpen
    console.log(`🚪 Door ${door.isOpen ? 'opened' : 'closed'}`)
    return true
  }

  /**
   * Update doors (animate)
   */
  update(deltaTime: number): void {
    this.doors.forEach(door => {
      const targetRotation = door.isOpen ? door.openRotation : door.closedRotation
      const currentRotation = door.mesh.rotation.y
      
      if (Math.abs(currentRotation - targetRotation) > 0.01) {
        const diff = targetRotation - currentRotation
        const step = Math.sign(diff) * Math.min(Math.abs(diff), door.animationSpeed * deltaTime)
        door.mesh.rotation.y += step
      }
    })
  }

  /**
   * Find nearest door
   */
  findNearestDoor(position: THREE.Vector3): Door | null {
    let nearest: Door | null = null
    let minDistance = Infinity
    
    this.doors.forEach(door => {
      if (!door.canInteract) return
      
      const distance = door.position.distanceTo(position)
      if (distance < door.interactRadius && distance < minDistance) {
        nearest = door
        minDistance = distance
      }
    })
    
    return nearest
  }

  /**
   * Remove door
   */
  removeDoor(doorId: string): void {
    const door = this.doors.get(doorId)
    if (!door) return
    
    this.scene.remove(door.mesh)
    door.mesh.geometry.dispose()
    ;(door.mesh as THREE.Mesh).material.dispose()
    this.doors.delete(doorId)
  }
}

// =============================================================================
// BREAKABLE OBJECTS
// =============================================================================

export interface Breakable extends InteractiveObject {
  type: InteractiveObjectType.BREAKABLE
  health: number
  maxHealth: number
  fragments?: THREE.Object3D[]
}

export class BreakableManager {
  private breakables: Map<string, Breakable> = new Map()
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  /**
   * Create a breakable object (e.g., crate)
   */
  createBreakable(
    position: THREE.Vector3,
    size: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
    health: number = 100
  ): Breakable {
    const id = `breakable_${Date.now()}_${Math.random()}`
    
    // Crate geometry
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const material = new THREE.MeshStandardMaterial({
      color: 0xA0522D,
      roughness: 0.9,
      metalness: 0.1
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.type = 'BREAKABLE'
    mesh.userData.id = id
    
    this.scene.add(mesh)
    
    const breakable: Breakable = {
      id,
      type: InteractiveObjectType.BREAKABLE,
      mesh,
      position: position.clone(),
      isActive: true,
      health,
      maxHealth: health,
      canInteract: false,
      interactRadius: 0
    }
    
    this.breakables.set(id, breakable)
    return breakable
  }

  /**
   * Damage breakable
   */
  damageBreakable(breakableId: string, damage: number): boolean {
    const breakable = this.breakables.get(breakableId)
    if (!breakable || !breakable.isActive) return false
    
    breakable.health -= damage
    
    // Visual feedback (change color based on damage)
    const material = (breakable.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
    const damagePercent = breakable.health / breakable.maxHealth
    material.color.setRGB(damagePercent, damagePercent * 0.3, 0)
    
    // Check if destroyed
    if (breakable.health <= 0) {
      this.destroyBreakable(breakableId)
      return true
    }
    
    return false
  }

  /**
   * Destroy breakable (create fragments)
   */
  private destroyBreakable(breakableId: string): void {
    const breakable = this.breakables.get(breakableId)
    if (!breakable) return
    
    console.log(`💥 Breakable destroyed: ${breakableId}`)
    
    // Create fragments
    this.createFragments(breakable)
    
    // Remove original mesh
    this.scene.remove(breakable.mesh)
    breakable.mesh.geometry.dispose()
    ;(breakable.mesh as THREE.Mesh).material.dispose()
    
    breakable.isActive = false
    
    // Remove after animation
    setTimeout(() => {
      this.breakables.delete(breakableId)
    }, 5000)
  }

  /**
   * Create fragments (simple explosion effect)
   */
  private createFragments(breakable: Breakable): void {
    const fragmentCount = 8
    const size = 0.3
    
    for (let i = 0; i < fragmentCount; i++) {
      const geometry = new THREE.BoxGeometry(size, size, size)
      const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      const fragment = new THREE.Mesh(geometry, material)
      
      fragment.position.copy(breakable.position)
      fragment.castShadow = true
      
      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 5
      )
      
      fragment.userData.velocity = velocity
      fragment.userData.isFragment = true
      fragment.userData.createdAt = Date.now()
      
      this.scene.add(fragment)
      
      // Remove after 5 seconds
      setTimeout(() => {
        this.scene.remove(fragment)
        geometry.dispose()
        material.dispose()
      }, 5000)
    }
  }

  /**
   * Update fragments (physics)
   */
  update(deltaTime: number): void {
    this.scene.traverse((obj) => {
      if (obj.userData.isFragment) {
        const velocity = obj.userData.velocity as THREE.Vector3
        
        // Apply gravity
        velocity.y -= 9.8 * deltaTime
        
        // Move fragment
        obj.position.add(velocity.clone().multiplyScalar(deltaTime))
        
        // Rotation
        obj.rotation.x += deltaTime * 2
        obj.rotation.y += deltaTime * 3
        
        // Stop at ground
        if (obj.position.y < 0) {
          obj.position.y = 0
          velocity.y = 0
          velocity.multiplyScalar(0.5) // Friction
        }
      }
    })
  }

  /**
   * Find breakable by mesh
   */
  findBreakableByMesh(mesh: THREE.Object3D): Breakable | null {
    for (const [id, breakable] of this.breakables) {
      if (breakable.mesh === mesh && breakable.isActive) {
        return breakable
      }
    }
    return null
  }
}

// =============================================================================
// DESTRUCTIBLE COVER
// =============================================================================

export interface DestructibleCover extends InteractiveObject {
  type: InteractiveObjectType.COVER
  health: number
  maxHealth: number
  coverStrength: number // 0-1 (how much protection it provides)
}

export class CoverManager {
  private covers: Map<string, DestructibleCover> = new Map()
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  /**
   * Create destructible cover
   */
  createCover(
    position: THREE.Vector3,
    size: THREE.Vector3 = new THREE.Vector3(2, 1, 0.3),
    health: number = 200
  ): DestructibleCover {
    const id = `cover_${Date.now()}_${Math.random()}`
    
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.3
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.type = 'COVER'
    mesh.userData.id = id
    
    this.scene.add(mesh)
    
    const cover: DestructibleCover = {
      id,
      type: InteractiveObjectType.COVER,
      mesh,
      position: position.clone(),
      isActive: true,
      health,
      maxHealth: health,
      coverStrength: 0.8,
      canInteract: false,
      interactRadius: 0
    }
    
    this.covers.set(id, cover)
    return cover
  }

  /**
   * Damage cover
   */
  damageCover(coverId: string, damage: number): boolean {
    const cover = this.covers.get(coverId)
    if (!cover || !cover.isActive) return false
    
    cover.health -= damage
    
    // Visual feedback
    const material = (cover.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
    const damagePercent = cover.health / cover.maxHealth
    material.opacity = damagePercent
    material.transparent = true
    
    // Check if destroyed
    if (cover.health <= 0) {
      this.destroyCover(coverId)
      return true
    }
    
    return false
  }

  /**
   * Destroy cover
   */
  private destroyCover(coverId: string): void {
    const cover = this.covers.get(coverId)
    if (!cover) return
    
    console.log(`🛡️ Cover destroyed: ${coverId}`)
    
    this.scene.remove(cover.mesh)
    cover.mesh.geometry.dispose()
    ;(cover.mesh as THREE.Mesh).material.dispose()
    
    this.covers.delete(coverId)
  }

  /**
   * Find cover by mesh
   */
  findCoverByMesh(mesh: THREE.Object3D): DestructibleCover | null {
    for (const [id, cover] of this.covers) {
      if (cover.mesh === mesh && cover.isActive) {
        return cover
      }
    }
    return null
  }
}

// =============================================================================
// MAP INTERACTION MANAGER (Main Controller)
// =============================================================================

export class MapInteractionManager {
  private doorManager: DoorManager
  private breakableManager: BreakableManager
  private coverManager: CoverManager
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.doorManager = new DoorManager(scene)
    this.breakableManager = new BreakableManager(scene)
    this.coverManager = new CoverManager(scene)
    
    console.log('🗺️ Map Interaction Manager initialized')
  }

  /**
   * Create sample interactive objects
   */
  createSampleObjects(): void {
    // Create doors
    this.doorManager.createDoor(new THREE.Vector3(10, 1.25, 0), 0)
    this.doorManager.createDoor(new THREE.Vector3(-10, 1.25, 0), Math.PI / 2)
    
    // Create breakables
    this.breakableManager.createBreakable(new THREE.Vector3(5, 0.5, 5))
    this.breakableManager.createBreakable(new THREE.Vector3(-5, 0.5, -5))
    this.breakableManager.createBreakable(new THREE.Vector3(8, 0.5, -3))
    
    // Create covers
    this.coverManager.createCover(new THREE.Vector3(0, 0.5, 10))
    this.coverManager.createCover(new THREE.Vector3(0, 0.5, -10))
    
    console.log('✅ Sample interactive objects created')
  }

  /**
   * Try to interact with nearest door
   */
  interactWithNearestDoor(playerPosition: THREE.Vector3): boolean {
    const door = this.doorManager.findNearestDoor(playerPosition)
    if (door) {
      return this.doorManager.toggleDoor(door.id)
    }
    return false
  }

  /**
   * Handle bullet impact on interactive objects
   */
  handleBulletImpact(hitObject: THREE.Object3D, damage: number): boolean {
    const objectType = hitObject.userData.type
    
    switch (objectType) {
      case 'BREAKABLE': {
        const breakable = this.breakableManager.findBreakableByMesh(hitObject)
        if (breakable) {
          return this.breakableManager.damageBreakable(breakable.id, damage)
        }
        break
      }
      
      case 'COVER': {
        const cover = this.coverManager.findCoverByMesh(hitObject)
        if (cover) {
          return this.coverManager.damageCover(cover.id, damage)
        }
        break
      }
    }
    
    return false
  }

  /**
   * Update all systems
   */
  update(deltaTime: number): void {
    this.doorManager.update(deltaTime)
    this.breakableManager.update(deltaTime)
  }

  /**
   * Get managers
   */
  getDoorManager(): DoorManager {
    return this.doorManager
  }

  getBreakableManager(): BreakableManager {
    return this.breakableManager
  }

  getCoverManager(): CoverManager {
    return this.coverManager
  }
}

