import * as THREE from 'three'

export interface LevelTile {
  type: 'floor' | 'wall' | 'door' | 'window' | 'cover' | 'spawn' | 'objective' | 'hazard'
  position: THREE.Vector3
  rotation: THREE.Euler
  size: THREE.Vector3
  health?: number
  destructible?: boolean
  interactive?: boolean
  data?: any
}

export interface Room {
  id: string
  type: 'spawn' | 'combat' | 'objective' | 'boss' | 'treasure' | 'trap' | 'corridor'
  position: THREE.Vector3
  size: THREE.Vector3
  tiles: LevelTile[]
  connections: string[]
  difficulty: number
  enemyCount: number
  loot: string[]
  objectives: string[]
}

export interface LevelLayout {
  id: string
  name: string
  theme: 'urban' | 'forest' | 'desert' | 'snow' | 'facility' | 'underground'
  size: THREE.Vector3
  rooms: Room[]
  corridors: Room[]
  spawnPoints: SpawnPoint[]
  objectives: Objective[]
  environment: EnvironmentSettings
  difficulty: number
  estimatedPlayTime: number
}

export interface SpawnPoint {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  team: 'player' | 'enemy' | 'neutral'
  type: 'spawn' | 'reinforcement' | 'boss'
}

export interface Objective {
  id: string
  type: 'eliminate' | 'collect' | 'defend' | 'hack' | 'rescue' | 'destroy'
  position: THREE.Vector3
  radius: number
  data: any
  completed: boolean
}

export interface EnvironmentSettings {
  lighting: {
    ambient: number
    directional: number
    color: THREE.Color
    timeOfDay: 'day' | 'night' | 'dawn' | 'dusk'
  }
  weather: {
    type: 'clear' | 'rain' | 'snow' | 'fog' | 'storm'
    intensity: number
    effects: string[]
  }
  hazards: {
    type: 'none' | 'fire' | 'gas' | 'radiation' | 'electric' | 'explosive'
    positions: THREE.Vector3[]
    intensity: number
  }
  atmosphere: {
    fog: {
      enabled: boolean
      density: number
      color: THREE.Color
    }
    particles: {
      enabled: boolean
      type: string
      density: number
    }
  }
}

export class SimpleLevelGenerator {
  constructor() {
    console.log('SimpleLevelGenerator initialized')
  }
  
  public generateLevel(
    difficulty: number, 
    playerSkill: number, 
    playStyle: string,
    estimatedTime: number = 600
  ): LevelLayout {
    console.log(`Generating simple level with difficulty: ${difficulty}, player skill: ${playerSkill}`)
    
    // Create a simple but functional level layout
    const level: LevelLayout = {
      id: `level_${Date.now()}`,
      name: 'Training Facility',
      theme: 'facility',
      size: new THREE.Vector3(60, 6, 60),
      rooms: this.createRooms(),
      corridors: [],
      spawnPoints: this.createSpawnPoints(),
      objectives: this.createObjectives(),
      environment: this.createEnvironment(),
      difficulty,
      estimatedPlayTime: estimatedTime
    }
    
    console.log('Simple level generated successfully:', level.name)
    return level
  }
  
  private createRooms(): Room[] {
    const rooms: Room[] = []
    
    // Central arena room
    const centralRoom: Room = {
      id: 'central_arena',
      type: 'combat',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(30, 6, 30),
      tiles: this.createRoomTiles(new THREE.Vector3(0, 0, 0), new THREE.Vector3(30, 6, 30)),
      connections: ['room1', 'room2', 'room3', 'room4'],
      difficulty: 1.0,
      enemyCount: 4,
      loot: ['health_pack', 'ammo'],
      objectives: []
    }
    rooms.push(centralRoom)
    
    // Four surrounding rooms
    const roomPositions = [
      { pos: new THREE.Vector3(-20, 0, 0), id: 'room1' },
      { pos: new THREE.Vector3(20, 0, 0), id: 'room2' },
      { pos: new THREE.Vector3(0, 0, -20), id: 'room3' },
      { pos: new THREE.Vector3(0, 0, 20), id: 'room4' }
    ]
    
    roomPositions.forEach(roomPos => {
      const room: Room = {
        id: roomPos.id,
        type: 'combat',
        position: roomPos.pos,
        size: new THREE.Vector3(15, 4, 15),
        tiles: this.createRoomTiles(roomPos.pos, new THREE.Vector3(15, 4, 15)),
        connections: ['central_arena'],
        difficulty: 0.8,
        enemyCount: 2,
        loot: ['ammo'],
        objectives: []
      }
      rooms.push(room)
    })
    
    return rooms
  }
  
  private createRoomTiles(position: THREE.Vector3, size: THREE.Vector3): LevelTile[] {
    const tiles: LevelTile[] = []
    
    // Floor
    tiles.push({
      type: 'floor',
      position: position.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      size: size.clone(),
      data: { material: 'concrete' }
    })
    
    // Walls
    const wallHeight = 4
    const wallThickness = 0.5
    
    const wallPositions = [
      { pos: new THREE.Vector3(0, wallHeight/2, size.z / 2), size: new THREE.Vector3(size.x, wallHeight, wallThickness) },
      { pos: new THREE.Vector3(0, wallHeight/2, -size.z / 2), size: new THREE.Vector3(size.x, wallHeight, wallThickness) },
      { pos: new THREE.Vector3(size.x / 2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, size.z) },
      { pos: new THREE.Vector3(-size.x / 2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, size.z) }
    ]
    
    wallPositions.forEach(wallPos => {
      tiles.push({
        type: 'wall',
        position: position.clone().add(wallPos.pos),
        rotation: new THREE.Euler(0, 0, 0),
        size: wallPos.size,
        data: { material: 'concrete' }
      })
    })
    
    // Add some cover objects
    for (let i = 0; i < 3; i++) {
      tiles.push({
        type: 'cover',
        position: new THREE.Vector3(
          position.x + (Math.random() - 0.5) * size.x * 0.8,
          position.y + 1,
          position.z + (Math.random() - 0.5) * size.z * 0.8
        ),
        rotation: new THREE.Euler(0, Math.random() * Math.PI, 0),
        size: new THREE.Vector3(2, 2, 1),
        data: { material: 'metal' }
      })
    }
    
    return tiles
  }
  
  private createSpawnPoints(): SpawnPoint[] {
    return [
      {
        id: 'player_spawn',
        position: new THREE.Vector3(0, 1.8, -10),
        rotation: new THREE.Euler(0, 0, 0),
        team: 'player',
        type: 'spawn'
      },
      {
        id: 'enemy_spawn_1',
        position: new THREE.Vector3(-10, 1.8, 10),
        rotation: new THREE.Euler(0, Math.PI, 0),
        team: 'enemy',
        type: 'spawn'
      },
      {
        id: 'enemy_spawn_2',
        position: new THREE.Vector3(10, 1.8, 10),
        rotation: new THREE.Euler(0, Math.PI, 0),
        team: 'enemy',
        type: 'spawn'
      },
      {
        id: 'enemy_spawn_3',
        position: new THREE.Vector3(-15, 1.8, -5),
        rotation: new THREE.Euler(0, Math.PI/2, 0),
        team: 'enemy',
        type: 'spawn'
      },
      {
        id: 'enemy_spawn_4',
        position: new THREE.Vector3(15, 1.8, -5),
        rotation: new THREE.Euler(0, -Math.PI/2, 0),
        team: 'enemy',
        type: 'spawn'
      }
    ]
  }
  
  private createObjectives(): Objective[] {
    return [
      {
        id: 'objective_1',
        type: 'eliminate',
        position: new THREE.Vector3(0, 0, 0),
        radius: 5,
        data: { targetCount: 5 },
        completed: false
      }
    ]
  }
  
  private createEnvironment(): EnvironmentSettings {
    return {
      lighting: {
        ambient: 0.6,
        directional: 0.8,
        color: new THREE.Color(0xffffff),
        timeOfDay: 'day'
      },
      weather: {
        type: 'clear',
        intensity: 0.1,
        effects: []
      },
      hazards: {
        type: 'none',
        positions: [],
        intensity: 0
      },
      atmosphere: {
        fog: {
          enabled: false,
          density: 0,
          color: new THREE.Color(0xcccccc)
        },
        particles: {
          enabled: false,
          type: '',
          density: 0
        }
      }
    }
  }
}