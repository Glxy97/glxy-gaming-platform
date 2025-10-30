// NO @ts-nocheck - Type-safe map setup
'use client'

import * as THREE from 'three'
import { PhysicsEngine } from '../physics/PhysicsEngine'
import { PathfindingManager } from '../ai/PathfindingSystem'
import { createPhysicsObject, PhysicsObjectType, CollisionLayer } from '../physics/data/PhysicsData'

/**
 * 🗺️ MAP SETUP MANAGER
 *
 * Centralized map loading and environment setup.
 * Extracted from UltimateFPSEngineV4 (~150 LOC)
 *
 * Responsibilities:
 * - Map scene construction
 * - Physics object creation
 * - Lighting setup
 * - Nav mesh initialization
 */
export class MapSetupManager {
  private scene: THREE.Scene
  private physicsEngine: PhysicsEngine
  private pathfindingManager: PathfindingManager

  constructor(deps: {
    scene: THREE.Scene
    physicsEngine: PhysicsEngine
    pathfindingManager: PathfindingManager
  }) {
    this.scene = deps.scene
    this.physicsEngine = deps.physicsEngine
    this.pathfindingManager = deps.pathfindingManager
  }

  /**
   * Setup map in scene from map data
   */
  public setupMapInScene(mapData: any): void {
    console.log('🗺️ Setting up map in scene:', mapData.id)

    // Create floor
    if (mapData.floor) {
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(mapData.floor.width || 200, mapData.floor.depth || 200),
        new THREE.MeshStandardMaterial({ color: 0x404040 })
      )
      floor.rotation.x = -Math.PI / 2
      floor.receiveShadow = true
      floor.userData = { type: 'floor', material: 'concrete' }
      this.scene.add(floor)

      // Add physics
      const floorPhysics = createPhysicsObject(
        PhysicsObjectType.STATIC,
        floor.position,
        { width: mapData.floor.width || 200, height: 0.1, depth: mapData.floor.depth || 200 },
        CollisionLayer.DEFAULT
      )
      this.physicsEngine.addObject(floorPhysics, floor)
    }

    // Create walls
    if (mapData.walls) {
      mapData.walls.forEach((wall: any) => {
        const wallMesh = new THREE.Mesh(
          new THREE.BoxGeometry(wall.width, wall.height, wall.depth),
          new THREE.MeshStandardMaterial({ color: 0x808080 })
        )
        wallMesh.position.set(wall.x, wall.y, wall.z)
        wallMesh.castShadow = true
        wallMesh.receiveShadow = true
        wallMesh.userData = { type: 'wall', material: 'concrete' }
        this.scene.add(wallMesh)

        // Add physics
        const wallPhysics = createPhysicsObject(
          PhysicsObjectType.STATIC,
          wallMesh.position,
          { width: wall.width, height: wall.height, depth: wall.depth },
          CollisionLayer.DEFAULT
        )
        this.physicsEngine.addObject(wallPhysics, wallMesh)
      })
    }

    // Create obstacles
    if (mapData.obstacles) {
      mapData.obstacles.forEach((obstacle: any) => {
        const obstacleMesh = new THREE.Mesh(
          new THREE.BoxGeometry(obstacle.width, obstacle.height, obstacle.depth),
          new THREE.MeshStandardMaterial({ color: 0x606060 })
        )
        obstacleMesh.position.set(obstacle.x, obstacle.y, obstacle.z)
        obstacleMesh.castShadow = true
        obstacleMesh.receiveShadow = true
        obstacleMesh.userData = { type: 'obstacle', material: 'concrete' }
        this.scene.add(obstacleMesh)

        // Add physics
        const obstaclePhysics = createPhysicsObject(
          PhysicsObjectType.STATIC,
          obstacleMesh.position,
          { width: obstacle.width, height: obstacle.height, depth: obstacle.depth },
          CollisionLayer.DEFAULT
        )
        this.physicsEngine.addObject(obstaclePhysics, obstacleMesh)
      })
    }

    // Setup lighting based on environment
    if (mapData.environment) {
      this.updateEnvironmentLighting(mapData.environment)
    }

    // Initialize nav mesh
    this.initializeNavMesh()
  }

  /**
   * Update environment lighting
   */
  private updateEnvironmentLighting(environment: any): void {
    // Remove old lights
    this.scene.children.filter(c => c instanceof THREE.Light).forEach(light => {
      this.scene.remove(light)
    })

    // Add new lights based on environment
    const ambientIntensity = environment.ambientLight || 0.4
    const directionalIntensity = environment.directionalLight || 0.8

    const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity)
    this.scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xffffff, directionalIntensity)
    directional.position.set(50, 100, 50)
    directional.castShadow = true
    this.scene.add(directional)
  }

  /**
   * Initialize navigation mesh for pathfinding
   */
  private initializeNavMesh(): void {
    // Create simple grid nav mesh
    const gridSize = 200
    const cellSize = 2
    const navNodes: THREE.Vector3[] = []

    for (let x = -gridSize / 2; x < gridSize / 2; x += cellSize) {
      for (let z = -gridSize / 2; z < gridSize / 2; z += cellSize) {
        navNodes.push(new THREE.Vector3(x, 0, z))
      }
    }

    this.pathfindingManager.setNavMesh(navNodes)
    console.log(`✅ Nav mesh initialized with ${navNodes.length} nodes`)
  }

  /**
   * Setup basic default map
   */
  public setupBasicMap(): void {
    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x404040 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.userData = { type: 'ground', material: 'concrete' }
    this.scene.add(ground)

    // Physics for ground
    const groundPhysics = createPhysicsObject(
      PhysicsObjectType.STATIC,
      new THREE.Vector3(0, 0, 0),
      { width: 200, height: 0.1, depth: 200 },
      CollisionLayer.DEFAULT
    )
    this.physicsEngine.addObject(groundPhysics, ground)

    // Basic lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xffffff, 0.8)
    directional.position.set(50, 100, 50)
    directional.castShadow = true
    directional.shadow.mapSize.width = 2048
    directional.shadow.mapSize.height = 2048
    this.scene.add(directional)

    // Nav mesh
    this.initializeNavMesh()

    console.log('✅ Basic map setup complete')
  }
}
