/**
 * 🧭 AI PATHFINDING SYSTEM
 * 
 * A* Navigation, NavMesh, Obstacle Avoidance
 * Enemies gehen nicht mehr durch Wände!
 */

import * as THREE from 'three'

// =============================================================================
// NAVMESH NODE
// =============================================================================

export interface NavNode {
  id: string
  position: THREE.Vector3
  neighbors: string[] // IDs of connected nodes
  cost: number // Cost to traverse (default: 1)
  walkable: boolean
}

// =============================================================================
// A* PATHFINDING
// =============================================================================

interface AStarNode {
  id: string
  g: number // Cost from start
  h: number // Heuristic to goal
  f: number // g + h
  parent: string | null
}

export class AStarPathfinder {
  private nodes: Map<string, NavNode> = new Map()

  /**
   * Add a navigation node
   */
  addNode(node: NavNode): void {
    this.nodes.set(node.id, node)
  }

  /**
   * Remove a navigation node
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId)
    
    // Remove references from neighbors
    this.nodes.forEach(node => {
      node.neighbors = node.neighbors.filter(id => id !== nodeId)
    })
  }

  /**
   * Connect two nodes (bidirectional)
   */
  connectNodes(nodeAId: string, nodeBId: string): void {
    const nodeA = this.nodes.get(nodeAId)
    const nodeB = this.nodes.get(nodeBId)
    
    if (!nodeA || !nodeB) return
    
    if (!nodeA.neighbors.includes(nodeBId)) {
      nodeA.neighbors.push(nodeBId)
    }
    
    if (!nodeB.neighbors.includes(nodeAId)) {
      nodeB.neighbors.push(nodeAId)
    }
  }

  /**
   * Find path from start to goal using A*
   */
  findPath(startPos: THREE.Vector3, goalPos: THREE.Vector3): THREE.Vector3[] {
    // Find closest nodes to start and goal
    const startNode = this.findClosestNode(startPos)
    const goalNode = this.findClosestNode(goalPos)
    
    if (!startNode || !goalNode) {
      console.warn('⚠️ No valid path nodes found')
      return []
    }

    if (startNode.id === goalNode.id) {
      return [goalPos]
    }

    // A* Algorithm
    const openSet = new Set<string>([startNode.id])
    const closedSet = new Set<string>()
    
    const gScore = new Map<string, number>([[startNode.id, 0]])
    const fScore = new Map<string, number>([[startNode.id, this.heuristic(startNode.position, goalNode.position)]])
    const cameFrom = new Map<string, string>()

    while (openSet.size > 0) {
      // Get node with lowest f score
      let current: string | null = null
      let lowestF = Infinity
      
      openSet.forEach(nodeId => {
        const f = fScore.get(nodeId) || Infinity
        if (f < lowestF) {
          lowestF = f
          current = nodeId
        }
      })

      if (!current) break

      // Goal reached
      if (current === goalNode.id) {
        return this.reconstructPath(cameFrom, current, goalPos)
      }

      openSet.delete(current)
      closedSet.add(current)

      const currentNode = this.nodes.get(current)
      if (!currentNode) continue

      // Check neighbors
      for (const neighborId of currentNode.neighbors) {
        if (closedSet.has(neighborId)) continue
        
        const neighbor = this.nodes.get(neighborId)
        if (!neighbor || !neighbor.walkable) continue

        const tentativeG = (gScore.get(current) || 0) + neighbor.cost

        if (!openSet.has(neighborId)) {
          openSet.add(neighborId)
        } else if (tentativeG >= (gScore.get(neighborId) || Infinity)) {
          continue
        }

        cameFrom.set(neighborId, current)
        gScore.set(neighborId, tentativeG)
        fScore.set(neighborId, tentativeG + this.heuristic(neighbor.position, goalNode.position))
      }
    }

    // No path found
    console.warn('⚠️ No path found')
    return []
  }

  /**
   * Heuristic: Euclidean distance
   */
  private heuristic(a: THREE.Vector3, b: THREE.Vector3): number {
    return a.distanceTo(b)
  }

  /**
   * Reconstruct path from A* result
   */
  private reconstructPath(cameFrom: Map<string, string>, current: string, goalPos: THREE.Vector3): THREE.Vector3[] {
    const path: THREE.Vector3[] = [goalPos]
    
    while (cameFrom.has(current)) {
      const node = this.nodes.get(current)
      if (node) {
        path.unshift(node.position.clone())
      }
      current = cameFrom.get(current)!
    }

    return path
  }

  /**
   * Find closest walkable node to a position
   */
  private findClosestNode(position: THREE.Vector3): NavNode | null {
    let closest: NavNode | null = null
    let minDist = Infinity

    this.nodes.forEach(node => {
      if (!node.walkable) return
      
      const dist = node.position.distanceTo(position)
      if (dist < minDist) {
        minDist = dist
        closest = node
      }
    })

    return closest
  }

  /**
   * Get all nodes
   */
  getNodes(): NavNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * Clear all nodes
   */
  clear(): void {
    this.nodes.clear()
  }
}

// =============================================================================
// NAVMESH GENERATOR
// =============================================================================

export class NavMeshGenerator {
  /**
   * Generate a grid-based navigation mesh
   */
  generateGridNavMesh(
    bounds: { min: THREE.Vector3; max: THREE.Vector3 },
    gridSize: number,
    obstacles: THREE.Object3D[]
  ): NavNode[] {
    const nodes: NavNode[] = []
    const raycaster = new THREE.Raycaster()
    
    // Generate grid nodes
    for (let x = bounds.min.x; x <= bounds.max.x; x += gridSize) {
      for (let z = bounds.min.z; z <= bounds.max.z; z += gridSize) {
        const position = new THREE.Vector3(x, 0, z)
        
        // Raycast down to find ground
        raycaster.set(
          new THREE.Vector3(x, 50, z),
          new THREE.Vector3(0, -1, 0)
        )
        
        const intersects = raycaster.intersectObjects(obstacles, true)
        if (intersects.length > 0) {
          position.y = intersects[0].point.y + 0.1 // Slightly above ground
        }
        
        // Check if node is walkable (not inside obstacle)
        const isWalkable = this.isPositionWalkable(position, obstacles)
        
        const node: NavNode = {
          id: `node_${x}_${z}`,
          position,
          neighbors: [],
          cost: 1,
          walkable: isWalkable
        }
        
        nodes.push(node)
      }
    }
    
    // Connect neighboring nodes
    nodes.forEach(node => {
      if (!node.walkable) return
      
      nodes.forEach(other => {
        if (other.id === node.id || !other.walkable) return
        
        const dist = node.position.distanceTo(other.position)
        
        // Connect if close enough (diagonal or cardinal)
        if (dist <= gridSize * 1.5) {
          // Check line of sight
          if (this.hasLineOfSight(node.position, other.position, obstacles)) {
            node.neighbors.push(other.id)
          }
        }
      })
    })
    
    return nodes
  }

  /**
   * Check if position is walkable (not inside obstacle)
   */
  private isPositionWalkable(position: THREE.Vector3, obstacles: THREE.Object3D[]): boolean {
    const raycaster = new THREE.Raycaster()
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    ]
    
    // Check if there's a wall very close in any direction
    for (const dir of directions) {
      raycaster.set(position, dir)
      const intersects = raycaster.intersectObjects(obstacles, true)
      
      if (intersects.length > 0 && intersects[0].distance < 0.5) {
        return false // Too close to wall
      }
    }
    
    return true
  }

  /**
   * Check if there's line of sight between two positions
   */
  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3, obstacles: THREE.Object3D[]): boolean {
    const raycaster = new THREE.Raycaster()
    const direction = new THREE.Vector3().subVectors(to, from).normalize()
    const distance = from.distanceTo(to)
    
    raycaster.set(from, direction)
    raycaster.far = distance
    
    const intersects = raycaster.intersectObjects(obstacles, true)
    
    // No obstacles in the way
    return intersects.length === 0 || intersects[0].distance > distance
  }
}

// =============================================================================
// PATHFINDING MANAGER
// =============================================================================

export class PathfindingManager {
  private pathfinder: AStarPathfinder
  private navMeshGenerator: NavMeshGenerator
  private isInitialized: boolean = false

  constructor() {
    this.pathfinder = new AStarPathfinder()
    this.navMeshGenerator = new NavMeshGenerator()
  }

  /**
   * Initialize navigation mesh
   */
  initialize(scene: THREE.Scene, bounds: { min: THREE.Vector3; max: THREE.Vector3 }, gridSize: number = 2): void {
    console.log('🧭 Initializing PathfindingManager...')
    
    // Find all static obstacles in scene
    const obstacles: THREE.Object3D[] = []
    scene.traverse((child) => {
      if (child.userData.isStatic || child.userData.isObstacle) {
        obstacles.push(child)
      }
    })
    
    // Generate NavMesh
    const nodes = this.navMeshGenerator.generateGridNavMesh(bounds, gridSize, obstacles)
    
    // Add nodes to pathfinder
    nodes.forEach(node => this.pathfinder.addNode(node))
    
    this.isInitialized = true
    console.log(`✅ NavMesh generated: ${nodes.length} nodes`)
  }

  /**
   * Find path between two positions
   */
  findPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
    if (!this.isInitialized) {
      console.warn('⚠️ PathfindingManager not initialized')
      return []
    }
    
    return this.pathfinder.findPath(from, to)
  }

  /**
   * Smooth path (remove unnecessary waypoints)
   */
  smoothPath(path: THREE.Vector3[], obstacles: THREE.Object3D[]): THREE.Vector3[] {
    if (path.length <= 2) return path
    
    const smoothed: THREE.Vector3[] = [path[0]]
    let current = 0
    
    while (current < path.length - 1) {
      // Try to skip to furthest visible waypoint
      let furthest = current + 1
      
      for (let i = path.length - 1; i > current + 1; i--) {
        if (this.hasLineOfSight(path[current], path[i], obstacles)) {
          furthest = i
          break
        }
      }
      
      smoothed.push(path[furthest])
      current = furthest
    }
    
    return smoothed
  }

  /**
   * Check line of sight between two positions
   */
  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3, obstacles: THREE.Object3D[]): boolean {
    const raycaster = new THREE.Raycaster()
    const direction = new THREE.Vector3().subVectors(to, from).normalize()
    const distance = from.distanceTo(to)
    
    raycaster.set(from, direction)
    raycaster.far = distance
    
    const intersects = raycaster.intersectObjects(obstacles, true)
    
    return intersects.length === 0 || intersects[0].distance > distance
  }

  /**
   * Get all navigation nodes (for debugging)
   */
  getNodes(): NavNode[] {
    return this.pathfinder.getNodes()
  }

  /**
   * Visualize navigation mesh (for debugging)
   */
  visualizeNavMesh(scene: THREE.Scene): void {
    const nodes = this.pathfinder.getNodes()
    
    nodes.forEach(node => {
      // Node sphere
      const geometry = new THREE.SphereGeometry(0.2)
      const material = new THREE.MeshBasicMaterial({ 
        color: node.walkable ? 0x00ff00 : 0xff0000,
        transparent: true,
        opacity: 0.5
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.copy(node.position)
      sphere.userData.isDebug = true
      scene.add(sphere)
      
      // Connection lines
      if (node.walkable) {
        node.neighbors.forEach(neighborId => {
          const neighbor = this.pathfinder.getNodes().find(n => n.id === neighborId)
          if (neighbor && neighbor.walkable) {
            const points = [node.position, neighbor.position]
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.3, transparent: true })
            const line = new THREE.Line(lineGeometry, lineMaterial)
            line.userData.isDebug = true
            scene.add(line)
          }
        })
      }
    })
    
    console.log('🔍 NavMesh visualization added')
  }

  /**
   * Clear debug visualization
   */
  clearVisualization(scene: THREE.Scene): void {
    const debugObjects: THREE.Object3D[] = []
    scene.traverse((child) => {
      if (child.userData.isDebug) {
        debugObjects.push(child)
      }
    })
    
    debugObjects.forEach(obj => scene.remove(obj))
  }

  /**
   * Destroy
   */
  destroy(): void {
    this.pathfinder.clear()
    this.isInitialized = false
  }
}

