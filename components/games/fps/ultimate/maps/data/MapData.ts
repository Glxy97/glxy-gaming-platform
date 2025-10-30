/**
 * GLXY Ultimate FPS - Map Data
 *
 * PROFESSIONAL MAP SYSTEM ARCHITECTURE
 * Complete data-driven map definitions for AAA-quality environments
 *
 * @module MapData
 * @category Data
 *
 * Architecture: Data-Driven Design, ScriptableObject Pattern
 * Quality: PRODUCTION-READY, COMPLETE
 *
 * Features:
 * - Complete map definitions (geometry, spawns, objectives)
 * - Environment system (lighting, weather, time of day)
 * - Cover system (high/low cover, destructible)
 * - Interactive elements (doors, elevators, switches)
 * - Sound zones (ambient, reverb)
 * - Visual effects zones (particles, lighting)
 * - Boundary system (playable area, kill zones)
 * - AI navigation data (nav mesh, cover points)
 *
 * Phase 8: Advanced Map System
 */

import * as THREE from 'three'

// =============================================================================
// ENUMERATIONS
// =============================================================================

/**
 * Map Theme
 */
export enum MapTheme {
  URBAN = 'urban',
  DESERT = 'desert',
  FOREST = 'forest',
  INDUSTRIAL = 'industrial',
  ARCTIC = 'arctic',
  TROPICAL = 'tropical',
  FUTURISTIC = 'futuristic',
  UNDERGROUND = 'underground'
}

/**
 * Map Size Category
 */
export enum MapSize {
  SMALL = 'small',      // 2-6 players (close quarters)
  MEDIUM = 'medium',    // 6-12 players
  LARGE = 'large',      // 12-24 players
  HUGE = 'huge'         // 24+ players (open world)
}

/**
 * Time of Day
 */
export enum TimeOfDay {
  DAWN = 'dawn',        // 5:00-7:00
  MORNING = 'morning',  // 7:00-12:00
  NOON = 'noon',        // 12:00-14:00
  AFTERNOON = 'afternoon', // 14:00-17:00
  DUSK = 'dusk',        // 17:00-19:00
  NIGHT = 'night',      // 19:00-5:00
  CUSTOM = 'custom'
}

/**
 * Weather Condition
 */
export enum WeatherType {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy',
  FOGGY = 'foggy',
  SNOWY = 'snowy',
  SANDSTORM = 'sandstorm',
  NONE = 'none'
}

/**
 * Spawn Type
 */
export enum SpawnType {
  TEAM_A = 'team_a',
  TEAM_B = 'team_b',
  NEUTRAL = 'neutral',
  FFA = 'ffa',          // Free-for-all
  RANDOM = 'random'
}

/**
 * Objective Type
 */
export enum ObjectiveType {
  CAPTURE_POINT = 'capture_point',
  BOMB_SITE = 'bomb_site',
  FLAG = 'flag',
  EXTRACTION_POINT = 'extraction_point',
  CONTROL_POINT = 'control_point',
  DOMINATION_POINT = 'domination_point',
  HARDPOINT = 'hardpoint',
  HEADQUARTERS = 'headquarters'
}

/**
 * Cover Type
 */
export enum CoverType {
  HIGH = 'high',        // Full body cover (walls, barriers)
  LOW = 'low',          // Crouch cover (crates, sandbags)
  PARTIAL = 'partial',  // Partial cover (pillars, corners)
  NONE = 'none'
}

/**
 * Geometry Type
 */
export enum GeometryType {
  FLOOR = 'floor',
  WALL = 'wall',
  CEILING = 'ceiling',
  RAMP = 'ramp',
  STAIRS = 'stairs',
  PLATFORM = 'platform',
  OBSTACLE = 'obstacle',
  PROP = 'prop',
  COVER = 'cover',
  INTERACTIVE = 'interactive'
}

/**
 * Material Type
 */
export enum MaterialType {
  CONCRETE = 'concrete',
  METAL = 'metal',
  WOOD = 'wood',
  GLASS = 'glass',
  DIRT = 'dirt',
  GRASS = 'grass',
  SAND = 'sand',
  SNOW = 'snow',
  WATER = 'water',
  TILE = 'tile',
  FABRIC = 'fabric',
  PLASTIC = 'plastic'
}

// =============================================================================
// CORE DATA STRUCTURES
// =============================================================================

/**
 * 3D Vector
 */
export interface Vector3Data {
  x: number
  y: number
  z: number
}

/**
 * Color (RGB)
 */
export interface ColorData {
  r: number
  g: number
  b: number
}

/**
 * Bounding Box
 */
export interface BoundingBoxData {
  min: Vector3Data
  max: Vector3Data
}

// =============================================================================
// ENVIRONMENT SYSTEM
// =============================================================================

/**
 * Lighting Configuration
 */
export interface LightingData {
  // Ambient light
  ambientColor: ColorData
  ambientIntensity: number

  // Directional light (sun/moon)
  sunColor: ColorData
  sunIntensity: number
  sunPosition: Vector3Data
  sunCastsShadow: boolean

  // Shadow settings
  shadowMapSize: number
  shadowRadius: number
  shadowBias: number

  // Additional lights
  pointLights: PointLightData[]
  spotLights: SpotLightData[]

  // Sky
  skyColor: ColorData
  groundColor: ColorData
  fogColor: ColorData
}

/**
 * Point Light
 */
export interface PointLightData {
  position: Vector3Data
  color: ColorData
  intensity: number
  distance: number
  decay: number
  castsShadow: boolean
}

/**
 * Spot Light
 */
export interface SpotLightData {
  position: Vector3Data
  target: Vector3Data
  color: ColorData
  intensity: number
  distance: number
  angle: number
  penumbra: number
  decay: number
  castsShadow: boolean
}

/**
 * Weather Configuration
 */
export interface WeatherData {
  type: WeatherType
  intensity: number // 0.0 - 1.0

  // Wind
  windDirection: Vector3Data
  windSpeed: number

  // Rain/Snow
  precipitationDensity: number
  precipitationSize: number

  // Thunder/Lightning (for storms)
  lightningFrequency: number // Flashes per minute
  thunderVolume: number

  // Visibility
  visibility: number // meters
}

/**
 * Fog Configuration
 */
export interface FogData {
  enabled: boolean
  color: ColorData
  near: number
  far: number
  density: number // For exponential fog
}

/**
 * Environment Configuration
 */
export interface EnvironmentData {
  theme: MapTheme
  timeOfDay: TimeOfDay
  lighting: LightingData
  weather: WeatherData
  fog: FogData

  // Skybox
  skyboxTexture?: string
  skyboxRotation: number

  // Ambient sounds
  ambientSounds: AmbientSoundData[]

  // Gravity
  gravity: number // Default: -9.8
}

/**
 * Ambient Sound
 */
export interface AmbientSoundData {
  id: string
  soundFile: string
  volume: number
  loop: boolean
  position?: Vector3Data // Positional audio
  radius?: number // For positional audio
}

// =============================================================================
// SPAWN SYSTEM
// =============================================================================

/**
 * Spawn Point
 */
export interface SpawnPointData {
  id: string
  type: SpawnType
  position: Vector3Data
  rotation: Vector3Data // Euler angles
  enabled: boolean
  priority: number // Higher = more likely to spawn here
  radius: number // Safe spawn radius

  // Conditions
  minPlayers?: number
  maxPlayers?: number
  gameMode?: string[] // Which game modes use this spawn
}

// =============================================================================
// OBJECTIVE SYSTEM
// =============================================================================

/**
 * Objective
 */
export interface ObjectiveData {
  id: string
  type: ObjectiveType
  name: string
  description: string
  position: Vector3Data
  radius: number

  // Visual
  icon: string
  color: ColorData
  glowEffect: boolean

  // Gameplay
  captureTime: number // seconds
  captureRadius: number // meters
  contestable: boolean // Can both teams contest?
  neutralizable: boolean // Can return to neutral?

  // Rewards
  captureXP: number
  captureCredits: number
  tickXP: number // XP per second while holding

  // Conditions
  enabledByDefault: boolean
  requiresObjective?: string // Must capture another objective first
  gameMode?: string[] // Which game modes use this objective
}

// =============================================================================
// GEOMETRY SYSTEM
// =============================================================================

/**
 * Geometry Object
 */
export interface GeometryObjectData {
  id: string
  type: GeometryType

  // Transform
  position: Vector3Data
  rotation: Vector3Data
  scale: Vector3Data

  // Geometry
  shape: 'box' | 'sphere' | 'cylinder' | 'plane' | 'custom'
  dimensions: Vector3Data // width, height, depth (or radius for sphere/cylinder)

  // Material
  material: MaterialType
  color: ColorData
  texture?: string
  normalMap?: string
  roughness: number
  metalness: number

  // Physics
  isStatic: boolean
  mass: number
  friction: number
  restitution: number // Bounciness
  collisionEnabled: boolean

  // Gameplay
  destructible: boolean
  health?: number
  provideCover: boolean
  coverType?: CoverType
  climbable: boolean
  penetrable: boolean // Can bullets go through?
  bulletDamageMultiplier: number // 1.0 = normal, <1 = reduced damage through material
}

// =============================================================================
// COVER SYSTEM
// =============================================================================

/**
 * Cover Point
 */
export interface CoverPointData {
  id: string
  position: Vector3Data
  direction: Vector3Data // Direction player faces when in cover
  type: CoverType

  // Dimensions
  width: number
  height: number

  // Gameplay
  providesConcealment: boolean // Hides from view
  providesProtection: boolean // Blocks bullets
  leanLeft: boolean
  leanRight: boolean
  vaultable: boolean

  // AI
  aiPriority: number // How much AI values this cover spot
}

// =============================================================================
// INTERACTIVE ELEMENTS
// =============================================================================

/**
 * Interactive Element Type
 */
export enum InteractiveType {
  DOOR = 'door',
  ELEVATOR = 'elevator',
  SWITCH = 'switch',
  BUTTON = 'button',
  LADDER = 'ladder',
  ZIPLINE = 'zipline',
  VEHICLE = 'vehicle',
  WEAPON_RACK = 'weapon_rack',
  AMMO_CRATE = 'ammo_crate',
  HEALTH_PACK = 'health_pack'
}

/**
 * Interactive Element
 */
export interface InteractiveElementData {
  id: string
  type: InteractiveType
  position: Vector3Data
  rotation: Vector3Data

  // Interaction
  interactDistance: number
  interactTime: number // seconds to interact
  interactPrompt: string
  canUseWhileMoving: boolean
  cooldown: number // seconds between uses

  // State
  initialState: 'open' | 'closed' | 'active' | 'inactive'
  persistent: boolean // State persists across rounds

  // Animation
  animationDuration: number
  animationType: 'slide' | 'rotate' | 'fade' | 'custom'

  // Gameplay
  oneTimeUse: boolean
  requiresKey?: string
  teamLocked?: 'team_a' | 'team_b' | 'none'

  // Effects
  soundEffect?: string
  particleEffect?: string
}

// =============================================================================
// ZONE SYSTEM
// =============================================================================

/**
 * Zone Type
 */
export enum ZoneType {
  PLAYABLE_AREA = 'playable_area',
  OUT_OF_BOUNDS = 'out_of_bounds',
  KILL_ZONE = 'kill_zone',
  DAMAGE_ZONE = 'damage_zone',
  HEALING_ZONE = 'healing_zone',
  SPEED_BOOST_ZONE = 'speed_boost_zone',
  NO_WEAPONS_ZONE = 'no_weapons_zone',
  SOUND_ZONE = 'sound_zone',
  REVERB_ZONE = 'reverb_zone',
  VISUAL_EFFECT_ZONE = 'visual_effect_zone'
}

/**
 * Zone
 */
export interface ZoneData {
  id: string
  type: ZoneType
  name: string

  // Shape
  shape: 'box' | 'sphere' | 'cylinder'
  position: Vector3Data
  dimensions: Vector3Data // For box: width, height, depth. For sphere: radius. For cylinder: radius, height

  // Gameplay effects
  damagePerSecond?: number
  healingPerSecond?: number
  speedMultiplier?: number

  // Visual
  showBoundary: boolean
  boundaryColor?: ColorData
  boundaryOpacity: number

  // Audio
  ambientSound?: string
  reverbPreset?: string

  // Effects
  particleEffect?: string
  postProcessingEffect?: string
}

// =============================================================================
// AI NAVIGATION
// =============================================================================

/**
 * Navigation Mesh Node
 */
export interface NavMeshNodeData {
  id: string
  position: Vector3Data
  radius: number

  // Connections
  connections: string[] // IDs of connected nodes

  // Properties
  coverValue: number // 0-1, how good for cover
  visibilityValue: number // 0-1, how visible from common angles
  tacticalValue: number // 0-1, overall tactical importance

  // Type
  nodeType: 'normal' | 'cover' | 'sniper' | 'objective' | 'chokepoint'
}

/**
 * Navigation Mesh
 */
export interface NavMeshData {
  nodes: NavMeshNodeData[]

  // Settings
  nodeSpacing: number
  maxSlopeAngle: number
  maxStepHeight: number
  agentRadius: number
  agentHeight: number
}

// =============================================================================
// MAP METADATA
// =============================================================================

/**
 * Map Metadata
 */
export interface MapMetadata {
  id: string
  name: string
  displayName: string
  description: string
  author: string
  version: string

  // Categorization
  theme: MapTheme
  size: MapSize
  recommendedPlayers: {
    min: number
    max: number
    optimal: number
  }

  // Game modes
  supportedGameModes: string[]
  defaultGameMode: string

  // Preview
  thumbnail: string
  screenshots: string[]
  loadingScreen: string

  // Tags
  tags: string[]

  // Dates
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// COMPLETE MAP DATA
// =============================================================================

/**
 * Complete Map Definition
 */
export interface MapData {
  // Metadata
  metadata: MapMetadata

  // Environment
  environment: EnvironmentData

  // Spawns
  spawnPoints: SpawnPointData[]

  // Objectives
  objectives: ObjectiveData[]

  // Geometry
  geometry: GeometryObjectData[]

  // Cover
  coverPoints: CoverPointData[]

  // Interactive elements
  interactiveElements: InteractiveElementData[]

  // Zones
  zones: ZoneData[]

  // AI Navigation
  navMesh: NavMeshData

  // Boundaries
  boundaries: BoundingBoxData

  // Performance
  maxDrawDistance: number
  lodDistances: number[] // Level of detail distances
  occlusionCulling: boolean
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create default lighting for time of day
 */
export function createDefaultLighting(timeOfDay: TimeOfDay): LightingData {
  switch (timeOfDay) {
    case TimeOfDay.DAWN:
      return {
        ambientColor: { r: 0.4, g: 0.4, b: 0.5 },
        ambientIntensity: 0.3,
        sunColor: { r: 1.0, g: 0.8, b: 0.6 },
        sunIntensity: 0.5,
        sunPosition: { x: -50, y: 20, z: 0 },
        sunCastsShadow: true,
        shadowMapSize: 2048,
        shadowRadius: 4,
        shadowBias: -0.0001,
        pointLights: [],
        spotLights: [],
        skyColor: { r: 0.5, g: 0.6, b: 0.8 },
        groundColor: { r: 0.2, g: 0.2, b: 0.3 },
        fogColor: { r: 0.6, g: 0.7, b: 0.9 }
      }

    case TimeOfDay.NOON:
      return {
        ambientColor: { r: 0.6, g: 0.6, b: 0.6 },
        ambientIntensity: 0.5,
        sunColor: { r: 1.0, g: 1.0, b: 1.0 },
        sunIntensity: 1.0,
        sunPosition: { x: 0, y: 100, z: 0 },
        sunCastsShadow: true,
        shadowMapSize: 2048,
        shadowRadius: 2,
        shadowBias: -0.0001,
        pointLights: [],
        spotLights: [],
        skyColor: { r: 0.5, g: 0.7, b: 1.0 },
        groundColor: { r: 0.3, g: 0.3, b: 0.3 },
        fogColor: { r: 0.8, g: 0.9, b: 1.0 }
      }

    case TimeOfDay.DUSK:
      return {
        ambientColor: { r: 0.5, g: 0.4, b: 0.4 },
        ambientIntensity: 0.3,
        sunColor: { r: 1.0, g: 0.6, b: 0.4 },
        sunIntensity: 0.6,
        sunPosition: { x: 50, y: 10, z: 0 },
        sunCastsShadow: true,
        shadowMapSize: 2048,
        shadowRadius: 5,
        shadowBias: -0.0001,
        pointLights: [],
        spotLights: [],
        skyColor: { r: 0.8, g: 0.5, b: 0.4 },
        groundColor: { r: 0.2, g: 0.2, b: 0.3 },
        fogColor: { r: 0.7, g: 0.5, b: 0.6 }
      }

    case TimeOfDay.NIGHT:
      return {
        ambientColor: { r: 0.1, g: 0.1, b: 0.2 },
        ambientIntensity: 0.1,
        sunColor: { r: 0.6, g: 0.6, b: 0.8 },
        sunIntensity: 0.2,
        sunPosition: { x: 0, y: 50, z: 0 },
        sunCastsShadow: true,
        shadowMapSize: 2048,
        shadowRadius: 8,
        shadowBias: -0.0001,
        pointLights: [],
        spotLights: [],
        skyColor: { r: 0.05, g: 0.05, b: 0.1 },
        groundColor: { r: 0.05, g: 0.05, b: 0.05 },
        fogColor: { r: 0.1, g: 0.1, b: 0.2 }
      }

    default:
      return createDefaultLighting(TimeOfDay.NOON)
  }
}

/**
 * Create default weather
 */
export function createDefaultWeather(type: WeatherType): WeatherData {
  switch (type) {
    case WeatherType.CLEAR:
      return {
        type,
        intensity: 0,
        windDirection: { x: 1, y: 0, z: 0 },
        windSpeed: 2,
        precipitationDensity: 0,
        precipitationSize: 0,
        lightningFrequency: 0,
        thunderVolume: 0,
        visibility: 1000
      }

    case WeatherType.RAINY:
      return {
        type,
        intensity: 0.6,
        windDirection: { x: 1, y: -0.2, z: 0 },
        windSpeed: 10,
        precipitationDensity: 1000,
        precipitationSize: 0.1,
        lightningFrequency: 0,
        thunderVolume: 0,
        visibility: 500
      }

    case WeatherType.STORMY:
      return {
        type,
        intensity: 0.9,
        windDirection: { x: 1, y: -0.3, z: 0.5 },
        windSpeed: 20,
        precipitationDensity: 2000,
        precipitationSize: 0.15,
        lightningFrequency: 5,
        thunderVolume: 0.8,
        visibility: 300
      }

    case WeatherType.FOGGY:
      return {
        type,
        intensity: 0.7,
        windDirection: { x: 1, y: 0, z: 0 },
        windSpeed: 1,
        precipitationDensity: 0,
        precipitationSize: 0,
        lightningFrequency: 0,
        thunderVolume: 0,
        visibility: 100
      }

    case WeatherType.SNOWY:
      return {
        type,
        intensity: 0.5,
        windDirection: { x: 1, y: -0.1, z: 0 },
        windSpeed: 5,
        precipitationDensity: 500,
        precipitationSize: 0.2,
        lightningFrequency: 0,
        thunderVolume: 0,
        visibility: 400
      }

    default:
      return createDefaultWeather(WeatherType.CLEAR)
  }
}

/**
 * Create default fog
 */
export function createDefaultFog(enabled: boolean = false): FogData {
  return {
    enabled,
    color: { r: 0.7, g: 0.7, b: 0.7 },
    near: 10,
    far: 100,
    density: 0.01
  }
}

/**
 * Create floor geometry
 */
export function createFloorGeometry(
  width: number,
  depth: number,
  position: Vector3Data = { x: 0, y: 0, z: 0 },
  material: MaterialType = MaterialType.CONCRETE
): GeometryObjectData {
  return {
    id: `floor_${Date.now()}`,
    type: GeometryType.FLOOR,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    shape: 'box',
    dimensions: { x: width, y: 0.5, z: depth },
    material,
    color: { r: 0.5, g: 0.5, b: 0.5 },
    roughness: 0.8,
    metalness: 0.2,
    isStatic: true,
    mass: 0,
    friction: 0.8,
    restitution: 0.1,
    collisionEnabled: true,
    destructible: false,
    provideCover: false,
    climbable: false,
    penetrable: false,
    bulletDamageMultiplier: 1.0
  }
}

/**
 * Create wall geometry
 */
export function createWallGeometry(
  width: number,
  height: number,
  position: Vector3Data,
  rotation: Vector3Data = { x: 0, y: 0, z: 0 },
  material: MaterialType = MaterialType.CONCRETE
): GeometryObjectData {
  return {
    id: `wall_${Date.now()}`,
    type: GeometryType.WALL,
    position,
    rotation,
    scale: { x: 1, y: 1, z: 1 },
    shape: 'box',
    dimensions: { x: width, y: height, z: 0.5 },
    material,
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
    bulletDamageMultiplier: 0.2
  }
}

/**
 * Create cover object
 */
export function createCoverObject(
  position: Vector3Data,
  coverType: CoverType,
  width: number = 2,
  material: MaterialType = MaterialType.CONCRETE
): GeometryObjectData {
  const height = coverType === CoverType.HIGH ? 2 : 1

  return {
    id: `cover_${Date.now()}`,
    type: GeometryType.COVER,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    shape: 'box',
    dimensions: { x: width, y: height, z: 0.5 },
    material,
    color: { r: 0.4, g: 0.4, b: 0.4 },
    roughness: 0.8,
    metalness: 0.3,
    isStatic: true,
    mass: 0,
    friction: 0.7,
    restitution: 0.1,
    collisionEnabled: true,
    destructible: false,
    provideCover: true,
    coverType,
    climbable: false,
    penetrable: false,
    bulletDamageMultiplier: 0.3
  }
}

/**
 * Validate map data
 */
export function validateMapData(map: MapData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check metadata
  if (!map.metadata.id) errors.push('Map ID is required')
  if (!map.metadata.name) errors.push('Map name is required')

  // Check spawns
  if (map.spawnPoints.length === 0) {
    errors.push('Map must have at least one spawn point')
  }

  // Check geometry
  if (map.geometry.length === 0) {
    errors.push('Map must have geometry (floor, walls, etc.)')
  }

  // Check boundaries
  if (!map.boundaries) {
    errors.push('Map must define boundaries')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate map center point
 */
export function calculateMapCenter(map: MapData): Vector3Data {
  const bounds = map.boundaries
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2
  }
}

/**
 * Check if position is within map boundaries
 */
export function isWithinBoundaries(position: Vector3Data, boundaries: BoundingBoxData): boolean {
  return (
    position.x >= boundaries.min.x &&
    position.x <= boundaries.max.x &&
    position.y >= boundaries.min.y &&
    position.y <= boundaries.max.y &&
    position.z >= boundaries.min.z &&
    position.z <= boundaries.max.z
  )
}
