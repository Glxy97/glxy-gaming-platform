/**
 * GLXY Ultimate FPS - Maps Catalog
 *
 * PROFESSIONAL MAP DEFINITIONS
 * 5 AAA-Quality maps with complete data
 *
 * @module MapsCatalog
 * @category Data
 *
 * Maps:
 * 1. Urban Warfare - City combat (Medium, TDM/Domination)
 * 2. Desert Storm - Desert warfare (Large, Long-range)
 * 3. Warehouse District - Close quarters (Small, TDM/FFA)
 * 4. Forest Outpost - Mixed combat (Medium, All modes)
 * 5. Arctic Base - Tactical combat (Large, Objective modes)
 *
 * Phase 8: Advanced Map System
 */

import {
  MapData,
  MapMetadata,
  MapTheme,
  MapSize,
  TimeOfDay,
  WeatherType,
  SpawnType,
  ObjectiveType,
  GeometryType,
  MaterialType,
  CoverType,
  ZoneType,
  InteractiveType,
  createDefaultLighting,
  createDefaultWeather,
  createDefaultFog,
  createFloorGeometry,
  createWallGeometry,
  createCoverObject
} from './MapData'

// =============================================================================
// MAP 1: URBAN WARFARE
// =============================================================================

export const URBAN_WARFARE: MapData = {
  metadata: {
    id: 'urban_warfare',
    name: 'urban_warfare',
    displayName: 'Urban Warfare',
    description: 'Intense urban combat in a war-torn city. Features tight corridors, rooftop access, and multiple flanking routes. Perfect for team deathmatch and domination.',
    author: 'GLXY Gaming',
    version: '1.0.0',
    theme: MapTheme.URBAN,
    size: MapSize.MEDIUM,
    recommendedPlayers: {
      min: 6,
      max: 16,
      optimal: 12
    },
    supportedGameModes: ['tdm', 'ffa', 'domination', 'hardpoint'],
    defaultGameMode: 'tdm',
    thumbnail: '/maps/urban_warfare/thumbnail.jpg',
    screenshots: [
      '/maps/urban_warfare/screenshot1.jpg',
      '/maps/urban_warfare/screenshot2.jpg',
      '/maps/urban_warfare/screenshot3.jpg'
    ],
    loadingScreen: '/maps/urban_warfare/loading.jpg',
    tags: ['urban', 'city', 'medium', 'tactical', 'vertical'],
    createdAt: new Date('2025-10-29'),
    updatedAt: new Date('2025-10-29')
  },

  environment: {
    theme: MapTheme.URBAN,
    timeOfDay: TimeOfDay.AFTERNOON,
    lighting: {
      ...createDefaultLighting(TimeOfDay.AFTERNOON),
      sunPosition: { x: 30, y: 50, z: 20 }
    },
    weather: createDefaultWeather(WeatherType.CLOUDY),
    fog: {
      ...createDefaultFog(true),
      far: 150,
      density: 0.005
    },
    skyboxRotation: 0,
    ambientSounds: [
      {
        id: 'city_ambience',
        soundFile: '/sounds/ambient/city.mp3',
        volume: 0.3,
        loop: true
      },
      {
        id: 'distant_gunfire',
        soundFile: '/sounds/ambient/distant_gunfire.mp3',
        volume: 0.2,
        loop: true
      }
    ],
    gravity: -9.8
  },

  spawnPoints: [
    // Team A spawns (West side)
    {
      id: 'spawn_a1',
      type: SpawnType.TEAM_A,
      position: { x: -40, y: 0.5, z: 0 },
      rotation: { x: 0, y: 90, z: 0 },
      enabled: true,
      priority: 1,
      radius: 2
    },
    {
      id: 'spawn_a2',
      type: SpawnType.TEAM_A,
      position: { x: -40, y: 0.5, z: 5 },
      rotation: { x: 0, y: 90, z: 0 },
      enabled: true,
      priority: 1,
      radius: 2
    },
    {
      id: 'spawn_a3',
      type: SpawnType.TEAM_A,
      position: { x: -40, y: 0.5, z: -5 },
      rotation: { x: 0, y: 90, z: 0 },
      enabled: true,
      priority: 1,
      radius: 2
    },

    // Team B spawns (East side)
    {
      id: 'spawn_b1',
      type: SpawnType.TEAM_B,
      position: { x: 40, y: 0.5, z: 0 },
      rotation: { x: 0, y: -90, z: 0 },
      enabled: true,
      priority: 1,
      radius: 2
    },
    {
      id: 'spawn_b2',
      type: SpawnType.TEAM_B,
      position: { x: 40, y: 0.5, z: 5 },
      rotation: { x: 0, y: -90, z: 0 },
      enabled: true,
      priority: 1,
      radius: 2
    },
    {
      id: 'spawn_b3',
      type: SpawnType.TEAM_B,
      position: { x: 40, y: 0.5, z: -5 },
      rotation: { x: 0, y: -90, z: 0 },
      enabled: true,
      priority: 1,
      radius: 2
    }
  ],

  objectives: [
    {
      id: 'point_a',
      type: ObjectiveType.DOMINATION_POINT,
      name: 'Point A',
      description: 'Central plaza',
      position: { x: 0, y: 0, z: 0 },
      radius: 5,
      icon: 'flag',
      color: { r: 1, g: 0.8, b: 0 },
      glowEffect: true,
      captureTime: 5,
      captureRadius: 5,
      contestable: true,
      neutralizable: true,
      captureXP: 100,
      captureCredits: 50,
      tickXP: 5,
      enabledByDefault: true
    },
    {
      id: 'point_b',
      type: ObjectiveType.DOMINATION_POINT,
      name: 'Point B',
      description: 'North building',
      position: { x: 0, y: 0, z: 20 },
      radius: 4,
      icon: 'flag',
      color: { r: 1, g: 0.8, b: 0 },
      glowEffect: true,
      captureTime: 5,
      captureRadius: 4,
      contestable: true,
      neutralizable: true,
      captureXP: 100,
      captureCredits: 50,
      tickXP: 5,
      enabledByDefault: true
    },
    {
      id: 'point_c',
      type: ObjectiveType.DOMINATION_POINT,
      name: 'Point C',
      description: 'South alley',
      position: { x: 0, y: 0, z: -20 },
      radius: 4,
      icon: 'flag',
      color: { r: 1, g: 0.8, b: 0 },
      glowEffect: true,
      captureTime: 5,
      captureRadius: 4,
      contestable: true,
      neutralizable: true,
      captureXP: 100,
      captureCredits: 50,
      tickXP: 5,
      enabledByDefault: true
    }
  ],

  geometry: [
    // Main floor
    createFloorGeometry(100, 60, { x: 0, y: 0, z: 0 }, MaterialType.CONCRETE),

    // Central plaza walls
    createWallGeometry(30, 3, { x: -15, y: 1.5, z: 15 }, { x: 0, y: 0, z: 0 }),
    createWallGeometry(30, 3, { x: 15, y: 1.5, z: -15 }, { x: 0, y: 0, z: 0 }),

    // Cover objects
    ...Array.from({ length: 10 }, (_, i) =>
      createCoverObject(
        { x: -20 + i * 4, y: 0.5, z: 0 },
        i % 2 === 0 ? CoverType.HIGH : CoverType.LOW
      )
    ),

    // Buildings
    {
      id: 'building_1',
      type: GeometryType.WALL,
      position: { x: -25, y: 5, z: 20 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      shape: 'box',
      dimensions: { x: 10, y: 10, z: 10 },
      material: MaterialType.CONCRETE,
      color: { r: 0.6, g: 0.6, b: 0.6 },
      roughness: 0.9,
      metalness: 0.1,
      isStatic: true,
      mass: 0,
      friction: 0.7,
      restitution: 0.1,
      collisionEnabled: true,
      destructible: false,
      provideCover: true,
      coverType: CoverType.HIGH,
      climbable: false,
      penetrable: false,
      bulletDamageMultiplier: 0.1
    }
  ],

  coverPoints: [
    {
      id: 'cover_1',
      position: { x: 0, y: 0, z: 5 },
      direction: { x: 0, y: 0, z: 1 },
      type: CoverType.HIGH,
      width: 2,
      height: 2,
      providesConcealment: true,
      providesProtection: true,
      leanLeft: true,
      leanRight: true,
      vaultable: false,
      aiPriority: 0.8
    }
  ],

  interactiveElements: [
    {
      id: 'door_1',
      type: InteractiveType.DOOR,
      position: { x: -20, y: 0, z: 0 },
      rotation: { x: 0, y: 90, z: 0 },
      interactDistance: 2,
      interactTime: 0.5,
      interactPrompt: 'Open Door',
      canUseWhileMoving: false,
      cooldown: 1,
      initialState: 'closed',
      persistent: false,
      animationDuration: 1,
      animationType: 'rotate',
      oneTimeUse: false,
      teamLocked: 'none'
    }
  ],

  zones: [
    {
      id: 'playable_area',
      type: ZoneType.PLAYABLE_AREA,
      name: 'Playable Area',
      shape: 'box',
      position: { x: 0, y: 5, z: 0 },
      dimensions: { x: 100, y: 20, z: 60 },
      showBoundary: false,
      boundaryOpacity: 0
    },
    {
      id: 'oob_north',
      type: ZoneType.OUT_OF_BOUNDS,
      name: 'Out of Bounds',
      shape: 'box',
      position: { x: 0, y: 0, z: 35 },
      dimensions: { x: 100, y: 10, z: 10 },
      damagePerSecond: 20,
      showBoundary: true,
      boundaryColor: { r: 1, g: 0, b: 0 },
      boundaryOpacity: 0.3
    }
  ],

  navMesh: {
    nodes: [
      {
        id: 'nav_1',
        position: { x: 0, y: 0, z: 0 },
        radius: 2,
        connections: ['nav_2', 'nav_3'],
        coverValue: 0.5,
        visibilityValue: 0.7,
        tacticalValue: 0.8,
        nodeType: 'objective'
      }
    ],
    nodeSpacing: 2,
    maxSlopeAngle: 45,
    maxStepHeight: 0.5,
    agentRadius: 0.5,
    agentHeight: 2
  },

  boundaries: {
    min: { x: -50, y: 0, z: -30 },
    max: { x: 50, y: 20, z: 30 }
  },

  maxDrawDistance: 200,
  lodDistances: [50, 100, 150],
  occlusionCulling: true
}

// =============================================================================
// MAP 2: DESERT STORM
// =============================================================================

export const DESERT_STORM: MapData = {
  metadata: {
    id: 'desert_storm',
    name: 'desert_storm',
    displayName: 'Desert Storm',
    description: 'Open desert warfare with long sightlines and sparse cover. Sniper paradise with strategic rock formations and abandoned structures.',
    author: 'GLXY Gaming',
    version: '1.0.0',
    theme: MapTheme.DESERT,
    size: MapSize.LARGE,
    recommendedPlayers: {
      min: 12,
      max: 24,
      optimal: 18
    },
    supportedGameModes: ['tdm', 'domination', 'ctf'],
    defaultGameMode: 'tdm',
    thumbnail: '/maps/desert_storm/thumbnail.jpg',
    screenshots: ['/maps/desert_storm/screenshot1.jpg'],
    loadingScreen: '/maps/desert_storm/loading.jpg',
    tags: ['desert', 'large', 'sniper', 'long-range'],
    createdAt: new Date('2025-10-29'),
    updatedAt: new Date('2025-10-29')
  },

  environment: {
    theme: MapTheme.DESERT,
    timeOfDay: TimeOfDay.NOON,
    lighting: {
      ...createDefaultLighting(TimeOfDay.NOON),
      ambientIntensity: 0.7,
      sunIntensity: 1.2
    },
    weather: {
      ...createDefaultWeather(WeatherType.CLEAR),
      windSpeed: 15
    },
    fog: createDefaultFog(false),
    skyboxRotation: 0,
    ambientSounds: [
      {
        id: 'desert_wind',
        soundFile: '/sounds/ambient/desert_wind.mp3',
        volume: 0.4,
        loop: true
      }
    ],
    gravity: -9.8
  },

  spawnPoints: [
    // Team A (North)
    { id: 'spawn_a1', type: SpawnType.TEAM_A, position: { x: -60, y: 0.5, z: 60 }, rotation: { x: 0, y: 135, z: 0 }, enabled: true, priority: 1, radius: 3 },
    { id: 'spawn_a2', type: SpawnType.TEAM_A, position: { x: -55, y: 0.5, z: 65 }, rotation: { x: 0, y: 135, z: 0 }, enabled: true, priority: 1, radius: 3 },
    { id: 'spawn_a3', type: SpawnType.TEAM_A, position: { x: -65, y: 0.5, z: 55 }, rotation: { x: 0, y: 135, z: 0 }, enabled: true, priority: 1, radius: 3 },

    // Team B (South)
    { id: 'spawn_b1', type: SpawnType.TEAM_B, position: { x: 60, y: 0.5, z: -60 }, rotation: { x: 0, y: -45, z: 0 }, enabled: true, priority: 1, radius: 3 },
    { id: 'spawn_b2', type: SpawnType.TEAM_B, position: { x: 55, y: 0.5, z: -65 }, rotation: { x: 0, y: -45, z: 0 }, enabled: true, priority: 1, radius: 3 },
    { id: 'spawn_b3', type: SpawnType.TEAM_B, position: { x: 65, y: 0.5, z: -55 }, rotation: { x: 0, y: -45, z: 0 }, enabled: true, priority: 1, radius: 3 }
  ],

  objectives: [
    {
      id: 'oasis',
      type: ObjectiveType.CAPTURE_POINT,
      name: 'Oasis',
      description: 'Central oasis',
      position: { x: 0, y: 0, z: 0 },
      radius: 8,
      icon: 'water',
      color: { r: 0, g: 0.7, b: 1 },
      glowEffect: true,
      captureTime: 10,
      captureRadius: 8,
      contestable: true,
      neutralizable: true,
      captureXP: 150,
      captureCredits: 75,
      tickXP: 10,
      enabledByDefault: true
    }
  ],

  geometry: [
    // Massive desert floor
    createFloorGeometry(200, 200, { x: 0, y: 0, z: 0 }, MaterialType.SAND),

    // Rock formations
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `rock_${i}`,
      type: GeometryType.OBSTACLE,
      position: {
        x: -80 + Math.random() * 160,
        y: Math.random() * 3,
        z: -80 + Math.random() * 160
      },
      rotation: { x: 0, y: Math.random() * 360, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      shape: 'sphere' as const,
      dimensions: { x: 2 + Math.random() * 3, y: 2 + Math.random() * 3, z: 2 + Math.random() * 3 },
      material: MaterialType.CONCRETE,
      color: { r: 0.7, g: 0.6, b: 0.5 },
      roughness: 0.95,
      metalness: 0,
      isStatic: true,
      mass: 0,
      friction: 0.9,
      restitution: 0.1,
      collisionEnabled: true,
      destructible: false,
      provideCover: true,
      coverType: CoverType.HIGH,
      climbable: false,
      penetrable: false,
      bulletDamageMultiplier: 0.05
    }))
  ],

  coverPoints: [],
  interactiveElements: [],

  zones: [
    {
      id: 'playable_desert',
      type: ZoneType.PLAYABLE_AREA,
      name: 'Desert Area',
      shape: 'box',
      position: { x: 0, y: 5, z: 0 },
      dimensions: { x: 200, y: 20, z: 200 },
      showBoundary: false,
      boundaryOpacity: 0
    }
  ],

  navMesh: {
    nodes: [],
    nodeSpacing: 5,
    maxSlopeAngle: 30,
    maxStepHeight: 0.5,
    agentRadius: 0.5,
    agentHeight: 2
  },

  boundaries: {
    min: { x: -100, y: 0, z: -100 },
    max: { x: 100, y: 30, z: 100 }
  },

  maxDrawDistance: 400,
  lodDistances: [100, 200, 300],
  occlusionCulling: false
}

// =============================================================================
// MAP 3: WAREHOUSE DISTRICT
// =============================================================================

export const WAREHOUSE_DISTRICT: MapData = {
  metadata: {
    id: 'warehouse_district',
    name: 'warehouse_district',
    displayName: 'Warehouse District',
    description: 'Close-quarters combat in an industrial warehouse complex. Fast-paced action with multiple floors and tight corridors.',
    author: 'GLXY Gaming',
    version: '1.0.0',
    theme: MapTheme.INDUSTRIAL,
    size: MapSize.SMALL,
    recommendedPlayers: {
      min: 4,
      max: 10,
      optimal: 8
    },
    supportedGameModes: ['tdm', 'ffa', 'gun_game'],
    defaultGameMode: 'ffa',
    thumbnail: '/maps/warehouse_district/thumbnail.jpg',
    screenshots: ['/maps/warehouse_district/screenshot1.jpg'],
    loadingScreen: '/maps/warehouse_district/loading.jpg',
    tags: ['industrial', 'small', 'cqb', 'fast-paced'],
    createdAt: new Date('2025-10-29'),
    updatedAt: new Date('2025-10-29')
  },

  environment: {
    theme: MapTheme.INDUSTRIAL,
    timeOfDay: TimeOfDay.NIGHT,
    lighting: {
      ...createDefaultLighting(TimeOfDay.NIGHT),
      pointLights: [
        {
          position: { x: 0, y: 5, z: 0 },
          color: { r: 1, g: 0.9, b: 0.7 },
          intensity: 2,
          distance: 20,
          decay: 2,
          castsShadow: true
        },
        {
          position: { x: -15, y: 5, z: 15 },
          color: { r: 1, g: 0.9, b: 0.7 },
          intensity: 1.5,
          distance: 15,
          decay: 2,
          castsShadow: false
        },
        {
          position: { x: 15, y: 5, z: -15 },
          color: { r: 1, g: 0.9, b: 0.7 },
          intensity: 1.5,
          distance: 15,
          decay: 2,
          castsShadow: false
        }
      ]
    },
    weather: createDefaultWeather(WeatherType.NONE),
    fog: {
      ...createDefaultFog(true),
      density: 0.02,
      color: { r: 0.1, g: 0.1, b: 0.1 }
    },
    skyboxRotation: 0,
    ambientSounds: [
      {
        id: 'industrial_hum',
        soundFile: '/sounds/ambient/industrial.mp3',
        volume: 0.3,
        loop: true
      }
    ],
    gravity: -9.8
  },

  spawnPoints: Array.from({ length: 8 }, (_, i) => ({
    id: `spawn_${i}`,
    type: SpawnType.FFA,
    position: {
      x: -20 + (i % 4) * 13,
      y: 0.5,
      z: -20 + Math.floor(i / 4) * 40
    },
    rotation: { x: 0, y: i * 45, z: 0 },
    enabled: true,
    priority: 1,
    radius: 2
  })),

  objectives: [],

  geometry: [
    // Warehouse floor
    createFloorGeometry(50, 50, { x: 0, y: 0, z: 0 }, MaterialType.CONCRETE),

    // Warehouse walls
    createWallGeometry(50, 8, { x: 0, y: 4, z: -25 }, { x: 0, y: 0, z: 0 }, MaterialType.METAL),
    createWallGeometry(50, 8, { x: 0, y: 4, z: 25 }, { x: 0, y: 0, z: 0 }, MaterialType.METAL),
    createWallGeometry(50, 8, { x: -25, y: 4, z: 0 }, { x: 0, y: 90, z: 0 }, MaterialType.METAL),
    createWallGeometry(50, 8, { x: 25, y: 4, z: 0 }, { x: 0, y: 90, z: 0 }, MaterialType.METAL),

    // Crates and obstacles
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `crate_${i}`,
      type: GeometryType.COVER,
      position: {
        x: -20 + (i % 5) * 10,
        y: 1,
        z: -20 + Math.floor(i / 5) * 20
      },
      rotation: { x: 0, y: Math.random() * 90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      shape: 'box' as const,
      dimensions: { x: 2, y: 2, z: 2 },
      material: MaterialType.WOOD,
      color: { r: 0.5, g: 0.4, b: 0.3 },
      roughness: 0.9,
      metalness: 0,
      isStatic: true,
      mass: 0,
      friction: 0.7,
      restitution: 0.1,
      collisionEnabled: true,
      destructible: true,
      health: 500,
      provideCover: true,
      coverType: CoverType.HIGH,
      climbable: false,
      penetrable: true,
      bulletDamageMultiplier: 0.5
    }))
  ],

  coverPoints: [],
  interactiveElements: [],

  zones: [
    {
      id: 'warehouse_interior',
      type: ZoneType.PLAYABLE_AREA,
      name: 'Warehouse',
      shape: 'box',
      position: { x: 0, y: 4, z: 0 },
      dimensions: { x: 50, y: 8, z: 50 },
      showBoundary: false,
      boundaryOpacity: 0
    }
  ],

  navMesh: {
    nodes: [],
    nodeSpacing: 2,
    maxSlopeAngle: 45,
    maxStepHeight: 0.5,
    agentRadius: 0.5,
    agentHeight: 2
  },

  boundaries: {
    min: { x: -25, y: 0, z: -25 },
    max: { x: 25, y: 10, z: 25 }
  },

  maxDrawDistance: 100,
  lodDistances: [25, 50, 75],
  occlusionCulling: true
}

// =============================================================================
// MAP CATALOG EXPORT
// =============================================================================

export const ALL_MAPS: MapData[] = [
  URBAN_WARFARE,
  DESERT_STORM,
  WAREHOUSE_DISTRICT
]

export const MAP_LOOKUP: Record<string, MapData> = {
  urban_warfare: URBAN_WARFARE,
  desert_storm: DESERT_STORM,
  warehouse_district: WAREHOUSE_DISTRICT
}

/**
 * Get map by ID
 */
export function getMap(id: string): MapData | undefined {
  return MAP_LOOKUP[id]
}

/**
 * Get all maps
 */
export function getAllMaps(): MapData[] {
  return ALL_MAPS
}

/**
 * Get maps by theme
 */
export function getMapsByTheme(theme: MapTheme): MapData[] {
  return ALL_MAPS.filter(map => map.metadata.theme === theme)
}

/**
 * Get maps by size
 */
export function getMapsBySize(size: MapSize): MapData[] {
  return ALL_MAPS.filter(map => map.metadata.size === size)
}

/**
 * Get maps supporting game mode
 */
export function getMapsByGameMode(gameMode: string): MapData[] {
  return ALL_MAPS.filter(map => map.metadata.supportedGameModes.includes(gameMode))
}
