// @ts-nocheck
import * as THREE from 'three'

export interface LevelData {
  id: string
  name: string
  description: string
  author: string
  size: { width: number; height: number; depth: number }
  spawnPoints: SpawnPoint[]
  objectives: Objective[]
  environment: EnvironmentData
  lighting: LightingData
  navigationMesh: NavigationMesh
}

export interface SpawnPoint {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  team: 'red' | 'blue' | 'neutral' | 'enemy'
  type: 'player' | 'enemy' | 'flag' | 'objective'
}

export interface Objective {
  id: string
  type: 'capture_point' | 'flag' | 'bomb_site' | 'king_of_the_hill'
  position: THREE.Vector3
  radius: number
  captureTime: number
  team: 'red' | 'blue' | 'neutral'
}

export interface EnvironmentData {
  terrain: TerrainData[]
  structures: StructureData[]
  props: PropData[]
  particles: ParticleData[]
  sounds: SoundData[]
}

export interface TerrainData {
  type: 'ground' | 'wall' | 'water' | 'lava'
  geometry: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  material: MaterialData
  collision: boolean
}

export interface StructureData {
  type: 'building' | 'bridge' | 'tower' | 'bunker'
  geometry: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  material: MaterialData
  collision: boolean
  destructible: boolean
}

export interface PropData {
  type: 'crate' | 'barrel' | 'vehicle' | 'weapon_pickup' | 'health_pack'
  geometry: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  material: MaterialData
  collision: boolean
  interactive: boolean
}

export interface MaterialData {
  color: number
  roughness?: number
  metalness?: number
  transparent?: boolean
  opacity?: number
  texture?: string
  normalMap?: string
}

export interface ParticleData {
  type: 'smoke' | 'fire' | 'steam' | 'dust'
  position: THREE.Vector3
  scale: THREE.Vector3
  color: number
  intensity: number
}

export interface SoundData {
  type: 'ambient' | 'music' | 'effect'
  position: THREE.Vector3
  radius: number
  volume: number
  loop: boolean
  file: string
}

export interface LightingData {
  ambient: {
    color: number
    intensity: number
  }
  directional: {
    color: number
    intensity: number
    position: THREE.Vector3
    castShadow: boolean
  }
  pointLights: PointLightData[]
}

export interface PointLightData {
  color: number
  intensity: number
  position: THREE.Vector3
  distance: number
  castShadow: boolean
}

export interface NavigationMesh {
  nodes: NavigationNode[]
  connections: Connection[]
}

export interface NavigationNode {
  id: string
  position: THREE.Vector3
  type: 'ground' | 'cover' | 'high_ground' | 'choke_point'
  radius: number
}

export interface Connection {
  from: string
  to: string
  weight: number
  type: 'walk' | 'jump' | 'climb'
}

export class LevelManager {
  private levels: Map<string, LevelData> = new Map()
  private currentLevel: LevelData | null = null
  private scene: THREE.Scene | null = null
  private levelObjects: THREE.Object3D[] = []

  constructor() {
    this.initializeLevels()
  }

  private initializeLevels(): void {
    // Level 1: Training Facility
    const trainingFacility: LevelData = {
      id: 'training_facility',
      name: 'Trainingsanlage',
      description: 'Eine moderne Trainingsanlage mit verschiedenen Hindernissen und Schießständen.',
      author: 'SHOOTINGSTAR Team',
      size: { width: 50, height: 10, depth: 50 },
      spawnPoints: [
        { id: 'spawn_1', position: new THREE.Vector3(0, 1, 0), rotation: new THREE.Euler(0, 0, 0), team: 'neutral', type: 'player' },
        { id: 'spawn_2', position: new THREE.Vector3(10, 1, 10), rotation: new THREE.Euler(0, Math.PI / 2, 0), team: 'neutral', type: 'enemy' },
        { id: 'spawn_3', position: new THREE.Vector3(-10, 1, -10), rotation: new THREE.Euler(0, -Math.PI / 2, 0), team: 'neutral', type: 'enemy' }
      ],
      objectives: [
        {
          id: 'obj_1',
          type: 'capture_point',
          position: new THREE.Vector3(0, 0, 20),
          radius: 5,
          captureTime: 10,
          team: 'neutral'
        }
      ],
      environment: {
        terrain: [
          {
            type: 'ground',
            geometry: 'plane',
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector3(50, 50, 1),
            material: { color: 0x90EE90, roughness: 0.8 },
            collision: true
          }
        ],
        structures: [
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(15, 2.5, 15),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(5, 5, 5),
            material: { color: 0x8B4513, roughness: 0.7 },
            collision: true,
            destructible: false
          },
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(-15, 2.5, -15),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(5, 5, 5),
            material: { color: 0x8B4513, roughness: 0.7 },
            collision: true,
            destructible: false
          },
          {
            type: 'tower',
            geometry: 'cylinder',
            position: new THREE.Vector3(0, 5, 0),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(2, 10, 2),
            material: { color: 0x696969, roughness: 0.6 },
            collision: true,
            destructible: false
          }
        ],
        props: [
          {
            type: 'crate',
            geometry: 'box',
            position: new THREE.Vector3(5, 0.5, 5),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            material: { color: 0xDEB887, roughness: 0.9 },
            collision: true,
            interactive: false
          },
          {
            type: 'crate',
            geometry: 'box',
            position: new THREE.Vector3(-5, 0.5, -5),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            material: { color: 0xDEB887, roughness: 0.9 },
            collision: true,
            interactive: false
          },
          {
            type: 'barrel',
            geometry: 'cylinder',
            position: new THREE.Vector3(10, 0.5, 0),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(0.5, 1, 0.5),
            material: { color: 0x8B0000, roughness: 0.5 },
            collision: true,
            interactive: true
          }
        ],
        particles: [
          {
            type: 'smoke',
            position: new THREE.Vector3(0, 3, 0),
            scale: new THREE.Vector3(1, 1, 1),
            color: 0x808080,
            intensity: 0.5
          }
        ],
        sounds: [
          {
            type: 'ambient',
            position: new THREE.Vector3(0, 5, 0),
            radius: 50,
            volume: 0.3,
            loop: true,
            file: '/sounds/ambient/training_facility.mp3'
          }
        ]
      },
      lighting: {
        ambient: {
          color: 0x404040,
          intensity: 0.6
        },
        directional: {
          color: 0xffffff,
          intensity: 0.8,
          position: new THREE.Vector3(10, 20, 5),
          castShadow: true
        },
        pointLights: [
          {
            color: 0xffffff,
            intensity: 0.5,
            position: new THREE.Vector3(0, 8, 0),
            distance: 20,
            castShadow: false
          }
        ]
      },
      navigationMesh: {
        nodes: [
          { id: 'node_1', position: new THREE.Vector3(0, 0, 0), type: 'ground', radius: 2 },
          { id: 'node_2', position: new THREE.Vector3(10, 0, 10), type: 'ground', radius: 2 },
          { id: 'node_3', position: new THREE.Vector3(-10, 0, -10), type: 'ground', radius: 2 },
          { id: 'node_4', position: new THREE.Vector3(15, 0, 15), type: 'cover', radius: 2 },
          { id: 'node_5', position: new THREE.Vector3(-15, 0, -15), type: 'cover', radius: 2 }
        ],
        connections: [
          { from: 'node_1', to: 'node_2', weight: 1, type: 'walk' },
          { from: 'node_1', to: 'node_3', weight: 1, type: 'walk' },
          { from: 'node_2', to: 'node_4', weight: 1, type: 'walk' },
          { from: 'node_3', to: 'node_5', weight: 1, type: 'walk' }
        ]
      }
    }

    // Level 2: Urban Combat
    const urbanCombat: LevelData = {
      id: 'urban_combat',
      name: 'Stadtgefecht',
      description: 'Ein städtisches Umfeld mit Gebäuden, engen Gassen und strategischen Positionen.',
      author: 'SHOOTINGSTAR Team',
      size: { width: 80, height: 15, depth: 80 },
      spawnPoints: [
        { id: 'spawn_red_1', position: new THREE.Vector3(-30, 1, -30), rotation: new THREE.Euler(0, Math.PI / 4, 0), team: 'red', type: 'player' },
        { id: 'spawn_red_2', position: new THREE.Vector3(-25, 1, -35), rotation: new THREE.Euler(0, Math.PI / 4, 0), team: 'red', type: 'player' },
        { id: 'spawn_blue_1', position: new THREE.Vector3(30, 1, 30), rotation: new THREE.Euler(0, -3 * Math.PI / 4, 0), team: 'blue', type: 'player' },
        { id: 'spawn_blue_2', position: new THREE.Vector3(25, 1, 35), rotation: new THREE.Euler(0, -3 * Math.PI / 4, 0), team: 'blue', type: 'player' }
      ],
      objectives: [
        {
          id: 'flag_red',
          type: 'flag',
          position: new THREE.Vector3(-30, 1, -30),
          radius: 3,
          captureTime: 0,
          team: 'red'
        },
        {
          id: 'flag_blue',
          type: 'flag',
          position: new THREE.Vector3(30, 1, 30),
          radius: 3,
          captureTime: 0,
          team: 'blue'
        }
      ],
      environment: {
        terrain: [
          {
            type: 'ground',
            geometry: 'plane',
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector3(80, 80, 1),
            material: { color: 0x696969, roughness: 0.9 },
            collision: true
          }
        ],
        structures: [
          // Buildings
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(-20, 4, -20),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(8, 8, 8),
            material: { color: 0x808080, roughness: 0.7 },
            collision: true,
            destructible: false
          },
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(20, 4, 20),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(8, 8, 8),
            material: { color: 0x808080, roughness: 0.7 },
            collision: true,
            destructible: false
          },
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(0, 3, -30),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(6, 6, 10),
            material: { color: 0x696969, roughness: 0.8 },
            collision: true,
            destructible: false
          },
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(0, 3, 30),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(6, 6, 10),
            material: { color: 0x696969, roughness: 0.8 },
            collision: true,
            destructible: false
          }
        ],
        props: [
          // Urban props
          {
            type: 'vehicle',
            geometry: 'box',
            position: new THREE.Vector3(-10, 1, 0),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),
            scale: new THREE.Vector3(4, 2, 2),
            material: { color: 0x000080, roughness: 0.6 },
            collision: true,
            interactive: false
          },
          {
            type: 'crate',
            geometry: 'box',
            position: new THREE.Vector3(10, 0.5, 10),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            material: { color: 0xDEB887, roughness: 0.9 },
            collision: true,
            interactive: false
          },
          {
            type: 'barrel',
            geometry: 'cylinder',
            position: new THREE.Vector3(-15, 0.5, 15),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(0.5, 1, 0.5),
            material: { color: 0x8B0000, roughness: 0.5 },
            collision: true,
            interactive: true
          }
        ],
        particles: [
          {
            type: 'smoke',
            position: new THREE.Vector3(0, 5, 0),
            scale: new THREE.Vector3(2, 2, 2),
            color: 0x696969,
            intensity: 0.3
          }
        ],
        sounds: [
          {
            type: 'ambient',
            position: new THREE.Vector3(0, 10, 0),
            radius: 80,
            volume: 0.4,
            loop: true,
            file: '/sounds/ambient/urban_combat.mp3'
          }
        ]
      },
      lighting: {
        ambient: {
          color: 0x303030,
          intensity: 0.5
        },
        directional: {
          color: 0xffffff,
          intensity: 0.6,
          position: new THREE.Vector3(15, 30, 10),
          castShadow: true
        },
        pointLights: [
          {
            color: 0xffffff,
            intensity: 0.3,
            position: new THREE.Vector3(-20, 6, -20),
            distance: 15,
            castShadow: false
          },
          {
            color: 0xffffff,
            intensity: 0.3,
            position: new THREE.Vector3(20, 6, 20),
            distance: 15,
            castShadow: false
          }
        ]
      },
      navigationMesh: {
        nodes: [
          { id: 'node_red_base', position: new THREE.Vector3(-30, 0, -30), type: 'ground', radius: 3 },
          { id: 'node_blue_base', position: new THREE.Vector3(30, 0, 30), type: 'ground', radius: 3 },
          { id: 'node_center', position: new THREE.Vector3(0, 0, 0), type: 'ground', radius: 3 },
          { id: 'node_north', position: new THREE.Vector3(0, 0, -30), type: 'cover', radius: 2 },
          { id: 'node_south', position: new THREE.Vector3(0, 0, 30), type: 'cover', radius: 2 },
          { id: 'node_east', position: new THREE.Vector3(30, 0, 0), type: 'cover', radius: 2 },
          { id: 'node_west', position: new THREE.Vector3(-30, 0, 0), type: 'cover', radius: 2 }
        ],
        connections: [
          { from: 'node_red_base', to: 'node_west', weight: 1, type: 'walk' },
          { from: 'node_blue_base', to: 'node_east', weight: 1, type: 'walk' },
          { from: 'node_center', to: 'node_north', weight: 1, type: 'walk' },
          { from: 'node_center', to: 'node_south', weight: 1, type: 'walk' },
          { from: 'node_center', to: 'node_east', weight: 1, type: 'walk' },
          { from: 'node_center', to: 'node_west', weight: 1, type: 'walk' },
          { from: 'node_north', to: 'node_west', weight: 1.2, type: 'walk' },
          { from: 'node_south', to: 'node_east', weight: 1.2, type: 'walk' }
        ]
      }
    }

    // Level 3: Industrial Complex
    const industrialComplex: LevelData = {
      id: 'industrial_complex',
      name: 'Industriekomplex',
      description: 'Ein riesiges Industriegelände mit Fabrikhallen, Rohren und Maschinen.',
      author: 'SHOOTINGSTAR Team',
      size: { width: 100, height: 20, depth: 100 },
      spawnPoints: [
        { id: 'spawn_alpha', position: new THREE.Vector3(-40, 1, 0), rotation: new THREE.Euler(0, 0, 0), team: 'neutral', type: 'player' },
        { id: 'spawn_bravo', position: new THREE.Vector3(40, 1, 0), rotation: new THREE.Euler(0, Math.PI, 0), team: 'neutral', type: 'enemy' },
        { id: 'spawn_charlie', position: new THREE.Vector3(0, 1, -40), rotation: new THREE.Euler(0, Math.PI / 2, 0), team: 'neutral', type: 'enemy' },
        { id: 'spawn_delta', position: new THREE.Vector3(0, 1, 40), rotation: new THREE.Euler(0, -Math.PI / 2, 0), team: 'neutral', type: 'enemy' }
      ],
      objectives: [
        {
          id: 'obj_center',
          type: 'king_of_the_hill',
          position: new THREE.Vector3(0, 0, 0),
          radius: 10,
          captureTime: 5,
          team: 'neutral'
        }
      ],
      environment: {
        terrain: [
          {
            type: 'ground',
            geometry: 'plane',
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector3(100, 100, 1),
            material: { color: 0x2F4F4F, roughness: 0.8 },
            collision: true
          }
        ],
        structures: [
          // Factory buildings
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(-30, 6, -30),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(15, 12, 15),
            material: { color: 0x708090, roughness: 0.7 },
            collision: true,
            destructible: false
          },
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(30, 6, 30),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(15, 12, 15),
            material: { color: 0x708090, roughness: 0.7 },
            collision: true,
            destructible: false
          },
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(-30, 6, 30),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(15, 12, 15),
            material: { color: 0x708090, roughness: 0.7 },
            collision: true,
            destructible: false
          },
          {
            type: 'building',
            geometry: 'box',
            position: new THREE.Vector3(30, 6, -30),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(15, 12, 15),
            material: { color: 0x708090, roughness: 0.7 },
            collision: true,
            destructible: false
          }
        ],
        props: [
          // Industrial props
          {
            type: 'crate',
            geometry: 'box',
            position: new THREE.Vector3(-20, 1, -20),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(2, 2, 2),
            material: { color: 0xDEB887, roughness: 0.9 },
            collision: true,
            interactive: false
          },
          {
            type: 'barrel',
            geometry: 'cylinder',
            position: new THREE.Vector3(20, 1, 20),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 2, 1),
            material: { color: 0x8B0000, roughness: 0.5 },
            collision: true,
            interactive: true
          },
          {
            type: 'vehicle',
            geometry: 'box',
            position: new THREE.Vector3(0, 1, -20),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(6, 3, 3),
            material: { color: 0xFFD700, roughness: 0.6 },
            collision: true,
            interactive: false
          }
        ],
        particles: [
          {
            type: 'steam',
            position: new THREE.Vector3(-30, 8, -30),
            scale: new THREE.Vector3(3, 3, 3),
            color: 0xFFFFFF,
            intensity: 0.6
          },
          {
            type: 'steam',
            position: new THREE.Vector3(30, 8, 30),
            scale: new THREE.Vector3(3, 3, 3),
            color: 0xFFFFFF,
            intensity: 0.6
          }
        ],
        sounds: [
          {
            type: 'ambient',
            position: new THREE.Vector3(0, 15, 0),
            radius: 100,
            volume: 0.5,
            loop: true,
            file: '/sounds/ambient/industrial_complex.mp3'
          }
        ]
      },
      lighting: {
        ambient: {
          color: 0x202020,
          intensity: 0.4
        },
        directional: {
          color: 0xffffff,
          intensity: 0.5,
          position: new THREE.Vector3(20, 40, 15),
          castShadow: true
        },
        pointLights: [
          {
            color: 0xFFFFFF,
            intensity: 0.4,
            position: new THREE.Vector3(-30, 10, -30),
            distance: 25,
            castShadow: false
          },
          {
            color: 0xFFFFFF,
            intensity: 0.4,
            position: new THREE.Vector3(30, 10, 30),
            distance: 25,
            castShadow: false
          },
          {
            color: 0xFFFFFF,
            intensity: 0.4,
            position: new THREE.Vector3(-30, 10, 30),
            distance: 25,
            castShadow: false
          },
          {
            color: 0xFFFFFF,
            intensity: 0.4,
            position: new THREE.Vector3(30, 10, -30),
            distance: 25,
            castShadow: false
          }
        ]
      },
      navigationMesh: {
        nodes: [
          { id: 'node_alpha', position: new THREE.Vector3(-40, 0, 0), type: 'ground', radius: 3 },
          { id: 'node_bravo', position: new THREE.Vector3(40, 0, 0), type: 'ground', radius: 3 },
          { id: 'node_charlie', position: new THREE.Vector3(0, 0, -40), type: 'ground', radius: 3 },
          { id: 'node_delta', position: new THREE.Vector3(0, 0, 40), type: 'ground', radius: 3 },
          { id: 'node_center', position: new THREE.Vector3(0, 0, 0), type: 'ground', radius: 5 },
          { id: 'node_nw', position: new THREE.Vector3(-30, 0, -30), type: 'cover', radius: 3 },
          { id: 'node_ne', position: new THREE.Vector3(30, 0, -30), type: 'cover', radius: 3 },
          { id: 'node_sw', position: new THREE.Vector3(-30, 0, 30), type: 'cover', radius: 3 },
          { id: 'node_se', position: new THREE.Vector3(30, 0, 30), type: 'cover', radius: 3 }
        ],
        connections: [
          { from: 'node_alpha', to: 'node_nw', weight: 1, type: 'walk' },
          { from: 'node_bravo', to: 'node_se', weight: 1, type: 'walk' },
          { from: 'node_charlie', to: 'node_ne', weight: 1, type: 'walk' },
          { from: 'node_delta', to: 'node_sw', weight: 1, type: 'walk' },
          { from: 'node_center', to: 'node_nw', weight: 1.2, type: 'walk' },
          { from: 'node_center', to: 'node_ne', weight: 1.2, type: 'walk' },
          { from: 'node_center', to: 'node_sw', weight: 1.2, type: 'walk' },
          { from: 'node_center', to: 'node_se', weight: 1.2, type: 'walk' },
          { from: 'node_nw', to: 'node_ne', weight: 1.5, type: 'walk' },
          { from: 'node_sw', to: 'node_se', weight: 1.5, type: 'walk' }
        ]
      }
    }

    this.levels.set('training_facility', trainingFacility)
    this.levels.set('urban_combat', urbanCombat)
    this.levels.set('industrial_complex', industrialComplex)
  }

  public loadLevel(levelId: string, scene: THREE.Scene): boolean {
    const levelData = this.levels.get(levelId)
    if (!levelData) {
      console.error(`Level ${levelId} not found`)
      return false
    }

    this.currentLevel = levelData
    this.scene = scene
    this.levelObjects = []

    // Clear previous level objects
    this.clearLevel()

    // Create level environment
    this.createEnvironment(levelData.environment)
    
    // Create lighting
    this.createLighting(levelData.lighting)

    console.log(`Level loaded: ${levelData.name}`)
    return true
  }

  private createEnvironment(environment: EnvironmentData): void {
    if (!this.scene) return

    // Create terrain
    environment.terrain.forEach(terrain => {
      const mesh = this.createMeshFromData(terrain)
      if (mesh) {
        this.scene!.add(mesh)
        this.levelObjects.push(mesh)
      }
    })

    // Create structures
    environment.structures.forEach(structure => {
      const mesh = this.createMeshFromData(structure)
      if (mesh) {
        this.scene!.add(mesh)
        this.levelObjects.push(mesh)
      }
    })

    // Create props
    environment.props.forEach(prop => {
      const mesh = this.createMeshFromData(prop)
      if (mesh) {
        this.scene!.add(mesh)
        this.levelObjects.push(mesh)
      }
    })

    // Create particle effects (placeholder)
    environment.particles.forEach(particle => {
      // TODO: Implement particle system
      console.log(`Particle effect at position:`, particle.position)
    })

    // Create sound sources (placeholder)
    environment.sounds.forEach(sound => {
      // TODO: Implement 3D audio system
      console.log(`Sound source at position:`, sound.position)
    })
  }

  private createMeshFromData(data: TerrainData | StructureData | PropData): THREE.Mesh | null {
    let geometry: THREE.BufferGeometry

    switch (data.geometry) {
      case 'plane':
        geometry = new THREE.PlaneGeometry(1, 1)
        break
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1)
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8)
        break
      default:
        console.warn(`Unknown geometry type: ${data.geometry}`)
        return null
    }

    const material = new THREE.MeshLambertMaterial({
      color: data.material.color,
      transparent: data.material.transparent || false,
      opacity: data.material.opacity || 1
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(data.position)
    mesh.rotation.copy(data.rotation)
    mesh.scale.copy(data.scale)

    if (data.collision) {
      mesh.userData.collision = true
    }

    if ('destructible' in data) {
      mesh.userData.destructible = data.destructible
    }

    if ('interactive' in data) {
      mesh.userData.interactive = data.interactive
    }

    return mesh
  }

  private createLighting(lighting: LightingData): void {
    if (!this.scene) return

    // Ambient light
    const ambientLight = new THREE.AmbientLight(lighting.ambient.color, lighting.ambient.intensity)
    this.scene.add(ambientLight)
    this.levelObjects.push(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight(
      lighting.directional.color,
      lighting.directional.intensity
    )
    directionalLight.position.copy(lighting.directional.position)
    directionalLight.castShadow = lighting.directional.castShadow
    this.scene.add(directionalLight)
    this.levelObjects.push(directionalLight)

    // Point lights
    lighting.pointLights.forEach(pointLightData => {
      const pointLight = new THREE.PointLight(
        pointLightData.color,
        pointLightData.intensity,
        pointLightData.distance
      )
      pointLight.position.copy(pointLightData.position)
      pointLight.castShadow = pointLightData.castShadow
      if (this.scene) {
        this.scene.add(pointLight)
      }
      this.levelObjects.push(pointLight)
    })
  }

  private clearLevel(): void {
    if (!this.scene) return

    this.levelObjects.forEach(object => {
      this.scene!.remove(object)
    })
    this.levelObjects = []
  }

  public getCurrentLevel(): LevelData | null {
    return this.currentLevel
  }

  public getLevels(): LevelData[] {
    return Array.from(this.levels.values())
  }

  public getSpawnPoints(team: string = 'neutral', type: string = 'player'): SpawnPoint[] {
    if (!this.currentLevel) return []

    return this.currentLevel.spawnPoints.filter(spawn => 
      spawn.team === team && spawn.type === type
    )
  }

  public getRandomSpawnPoint(team: string = 'neutral', type: string = 'player'): SpawnPoint | null {
    const spawnPoints = this.getSpawnPoints(team, type)
    if (spawnPoints.length === 0) return null

    const randomIndex = Math.floor(Math.random() * spawnPoints.length)
    return spawnPoints[randomIndex]
  }

  public getObjectives(): Objective[] {
    return this.currentLevel?.objectives || []
  }

  public getNavigationMesh(): NavigationMesh | null {
    return this.currentLevel?.navigationMesh || null
  }

  public getLevelBounds(): { width: number; height: number; depth: number } {
    return this.currentLevel?.size || { width: 100, height: 20, depth: 100 }
  }

  public dispose(): void {
    this.clearLevel()
    this.currentLevel = null
    this.scene = null
    this.levelObjects = []
  }
}