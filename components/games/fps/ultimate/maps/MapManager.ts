/**
 * GLXY Ultimate FPS - Map Manager
 *
 * PROFESSIONAL MAP ORCHESTRATION SYSTEM
 * Complete map management with loading, spawning, objectives, and environment control
 *
 * @module MapManager
 * @category Maps
 *
 * Features:
 * - Map loading and switching
 * - Spawn point management
 * - Objective management
 * - Zone management (playable area, kill zones, etc.)
 * - Environment control (weather, time of day, lighting)
 * - Event system for map events
 * - Performance optimization
 *
 * Phase 8: Advanced Map System
 */

import * as THREE from 'three'
import {
  MapData,
  SpawnPointData,
  SpawnType,
  ObjectiveData,
  ZoneData,
  ZoneType,
  Vector3Data,
  isWithinBoundaries,
  calculateMapCenter
} from './data/MapData'
import { MapLoader, LoadedMapResources, LoadingProgress } from './MapLoader'
import { getAllMaps, getMap } from './data/maps-catalog'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Map Manager Configuration
 */
export interface MapManagerConfig {
  autoLoadMaps: boolean
  enableDynamicWeather: boolean
  enableDynamicTimeOfDay: boolean
  outOfBoundsDamage: number // Damage per second
  outOfBoundsWarningTime: number // Seconds before damage starts
}

/**
 * Map Event Types
 */
export enum MapEventType {
  MAP_LOADING = 'mapLoading',
  MAP_LOADED = 'mapLoaded',
  MAP_UNLOADED = 'mapUnloaded',
  OBJECTIVE_CAPTURED = 'objectiveCaptured',
  PLAYER_OUT_OF_BOUNDS = 'playerOutOfBounds',
  ZONE_ENTERED = 'zoneEntered',
  ZONE_EXITED = 'zoneExited',
  WEATHER_CHANGED = 'weatherChanged',
  TIME_CHANGED = 'timeChanged'
}

/**
 * Map Event
 */
export interface MapEvent {
  type: MapEventType
  data: any
  timestamp: number
}

/**
 * Spawn Request
 */
export interface SpawnRequest {
  team?: 'team_a' | 'team_b'
  preferredSpawnId?: string
  avoidEnemies?: boolean
}

/**
 * Spawn Result
 */
export interface SpawnResult {
  position: Vector3Data
  rotation: Vector3Data
  spawnPoint: SpawnPointData
}

// =============================================================================
// MAP MANAGER
// =============================================================================

/**
 * MapManager
 * Orchestrates all map-related systems
 */
export class MapManager {
  private config: MapManagerConfig
  private loader: MapLoader

  // Current state
  private currentMap?: MapData
  private currentResources?: LoadedMapResources
  private isLoading: boolean = false

  // Event system
  private eventCallbacks: Map<MapEventType, Array<(event: MapEvent) => void>> = new Map()

  // Active objectives
  private activeObjectives: Map<string, ObjectiveData> = new Map()

  // Zone tracking
  private playerZones: Map<string, Set<string>> = new Map() // playerId -> zoneIds

  constructor(config: Partial<MapManagerConfig> = {}) {
    this.config = {
      autoLoadMaps: false,
      enableDynamicWeather: false,
      enableDynamicTimeOfDay: false,
      outOfBoundsDamage: 20,
      outOfBoundsWarningTime: 3,
      ...config
    }

    this.loader = new MapLoader()

    console.log('🗺️  MapManager: Initialized')
  }

  // =============================================================================
  // MAP LOADING & SWITCHING
  // =============================================================================

  /**
   * Load map by ID
   */
  public async loadMap(
    mapId: string,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<void> {
    if (this.isLoading) {
      console.warn('⚠️ MapManager: Already loading a map')
      return
    }

    const mapData = getMap(mapId)
    if (!mapData) {
      throw new Error(`Map not found: ${mapId}`)
    }

    await this.loadMapData(mapData, onProgress)
  }

  /**
   * Load map from data
   */
  public async loadMapData(
    mapData: MapData,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<void> {
    this.isLoading = true

    // Dispatch loading event
    this.dispatchEvent({
      type: MapEventType.MAP_LOADING,
      data: { mapId: mapData.metadata.id, mapName: mapData.metadata.displayName },
      timestamp: Date.now()
    })

    try {
      // Unload current map
      if (this.currentMap) {
        await this.unloadMap()
      }

      // Load new map
      console.log(`🗺️  MapManager: Loading map "${mapData.metadata.displayName}"`)

      const resources = await this.loader.loadMap(mapData, onProgress)

      this.currentMap = mapData
      this.currentResources = resources

      // Initialize objectives
      this.initializeObjectives()

      // Dispatch loaded event
      this.dispatchEvent({
        type: MapEventType.MAP_LOADED,
        data: {
          mapId: mapData.metadata.id,
          mapName: mapData.metadata.displayName,
          resources
        },
        timestamp: Date.now()
      })

      console.log(`✅ MapManager: Map "${mapData.metadata.displayName}" loaded successfully`)
    } catch (error) {
      console.error('❌ MapManager: Failed to load map:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Unload current map
   */
  public async unloadMap(): Promise<void> {
    if (!this.currentMap) return

    console.log(`🗺️  MapManager: Unloading map "${this.currentMap.metadata.displayName}"`)

    // Stop ambient sounds
    if (this.currentResources?.sounds) {
      this.currentResources.sounds.forEach(sound => {
        sound.pause()
        sound.src = ''
      })
    }

    // Dispose geometry
    if (this.currentResources?.geometry) {
      this.currentResources.geometry.forEach(mesh => {
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose())
        } else {
          mesh.material.dispose()
        }
      })
    }

    // Dispose textures
    if (this.currentResources?.textures) {
      this.currentResources.textures.forEach(texture => texture.dispose())
    }

    // Clear scene
    if (this.currentResources?.scene) {
      this.currentResources.scene.clear()
    }

    // Dispatch unloaded event
    this.dispatchEvent({
      type: MapEventType.MAP_UNLOADED,
      data: {
        mapId: this.currentMap.metadata.id,
        mapName: this.currentMap.metadata.displayName
      },
      timestamp: Date.now()
    })

    this.currentMap = undefined
    this.currentResources = undefined
    this.activeObjectives.clear()

    console.log('✅ MapManager: Map unloaded')
  }

  // =============================================================================
  // SPAWN SYSTEM
  // =============================================================================

  /**
   * Get spawn position for player
   */
  public getSpawnPosition(request: SpawnRequest = {}): SpawnResult | null {
    if (!this.currentMap) {
      console.warn('⚠️ MapManager: No map loaded')
      return null
    }

    // Filter valid spawn points
    let validSpawns = this.currentMap.spawnPoints.filter(spawn => spawn.enabled)

    // Filter by team
    if (request.team) {
      const spawnType = request.team === 'team_a' ? SpawnType.TEAM_A : SpawnType.TEAM_B
      validSpawns = validSpawns.filter(
        spawn => spawn.type === spawnType || spawn.type === SpawnType.NEUTRAL || spawn.type === SpawnType.RANDOM
      )
    }

    // Prefer specific spawn
    if (request.preferredSpawnId) {
      const preferred = validSpawns.find(s => s.id === request.preferredSpawnId)
      if (preferred) {
        return this.createSpawnResult(preferred)
      }
    }

    // No valid spawns
    if (validSpawns.length === 0) {
      console.warn('⚠️ MapManager: No valid spawn points')
      return null
    }

    // Select spawn by priority
    validSpawns.sort((a, b) => b.priority - a.priority)
    const spawn = validSpawns[0]

    return this.createSpawnResult(spawn)
  }

  /**
   * Create spawn result from spawn point
   */
  private createSpawnResult(spawn: SpawnPointData): SpawnResult {
    return {
      position: spawn.position,
      rotation: spawn.rotation,
      spawnPoint: spawn
    }
  }

  /**
   * Get all spawn points
   */
  public getSpawnPoints(): SpawnPointData[] {
    return this.currentMap?.spawnPoints || []
  }

  // =============================================================================
  // OBJECTIVE SYSTEM
  // =============================================================================

  /**
   * Initialize objectives
   */
  private initializeObjectives(): void {
    if (!this.currentMap) return

    this.activeObjectives.clear()

    this.currentMap.objectives.forEach(objective => {
      if (objective.enabledByDefault) {
        this.activeObjectives.set(objective.id, objective)
      }
    })

    console.log(`🎯 MapManager: Initialized ${this.activeObjectives.size} objectives`)
  }

  /**
   * Get active objectives
   */
  public getActiveObjectives(): ObjectiveData[] {
    return Array.from(this.activeObjectives.values())
  }

  /**
   * Get objective by ID
   */
  public getObjective(id: string): ObjectiveData | undefined {
    return this.activeObjectives.get(id)
  }

  /**
   * Capture objective
   */
  public captureObjective(objectiveId: string, team: 'team_a' | 'team_b'): boolean {
    const objective = this.activeObjectives.get(objectiveId)
    if (!objective) return false

    // Dispatch capture event
    this.dispatchEvent({
      type: MapEventType.OBJECTIVE_CAPTURED,
      data: {
        objectiveId,
        objective,
        team
      },
      timestamp: Date.now()
    })

    console.log(`🎯 MapManager: Objective "${objective.name}" captured by ${team}`)

    return true
  }

  // =============================================================================
  // ZONE SYSTEM
  // =============================================================================

  /**
   * Check if position is within boundaries
   */
  public isWithinBoundaries(position: Vector3Data): boolean {
    if (!this.currentMap) return true

    return isWithinBoundaries(position, this.currentMap.boundaries)
  }

  /**
   * Check if position is in zone
   */
  public isInZone(position: Vector3Data, zoneId: string): boolean {
    if (!this.currentMap) return false

    const zone = this.currentMap.zones.find(z => z.id === zoneId)
    if (!zone) return false

    const dx = position.x - zone.position.x
    const dy = position.y - zone.position.y
    const dz = position.z - zone.position.z

    switch (zone.shape) {
      case 'box':
        return (
          Math.abs(dx) <= zone.dimensions.x / 2 &&
          Math.abs(dy) <= zone.dimensions.y / 2 &&
          Math.abs(dz) <= zone.dimensions.z / 2
        )

      case 'sphere':
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        return distance <= zone.dimensions.x

      case 'cylinder':
        const distanceXZ = Math.sqrt(dx * dx + dz * dz)
        return distanceXZ <= zone.dimensions.x && Math.abs(dy) <= zone.dimensions.y / 2

      default:
        return false
    }
  }

  /**
   * Update player zone tracking
   */
  public updatePlayerZones(playerId: string, position: Vector3Data): void {
    if (!this.currentMap) return

    const currentZones = this.playerZones.get(playerId) || new Set()
    const newZones = new Set<string>()

    // Check all zones
    this.currentMap.zones.forEach(zone => {
      if (this.isInZone(position, zone.id)) {
        newZones.add(zone.id)

        // Zone entered
        if (!currentZones.has(zone.id)) {
          this.dispatchEvent({
            type: MapEventType.ZONE_ENTERED,
            data: { playerId, zone },
            timestamp: Date.now()
          })
        }
      }
    })

    // Check for zone exits
    currentZones.forEach(zoneId => {
      if (!newZones.has(zoneId)) {
        const zone = this.currentMap!.zones.find(z => z.id === zoneId)
        if (zone) {
          this.dispatchEvent({
            type: MapEventType.ZONE_EXITED,
            data: { playerId, zone },
            timestamp: Date.now()
          })
        }
      }
    })

    this.playerZones.set(playerId, newZones)
  }

  /**
   * Get zones at position
   */
  public getZonesAtPosition(position: Vector3Data): ZoneData[] {
    if (!this.currentMap) return []

    return this.currentMap.zones.filter(zone => this.isInZone(position, zone.id))
  }

  // =============================================================================
  // ENVIRONMENT CONTROL
  // =============================================================================

  /**
   * Get map center
   */
  public getMapCenter(): Vector3Data | null {
    if (!this.currentMap) return null
    return calculateMapCenter(this.currentMap)
  }

  /**
   * Get current weather
   */
  public getCurrentWeather() {
    return this.currentMap?.environment.weather
  }

  /**
   * Get current time of day
   */
  public getCurrentTimeOfDay() {
    return this.currentMap?.environment.timeOfDay
  }

  // =============================================================================
  // EVENT SYSTEM
  // =============================================================================

  /**
   * Subscribe to map events
   */
  public on(eventType: MapEventType, callback: (event: MapEvent) => void): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, [])
    }
    this.eventCallbacks.get(eventType)!.push(callback)
  }

  /**
   * Unsubscribe from map events
   */
  public off(eventType: MapEventType, callback: (event: MapEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Dispatch event
   */
  private dispatchEvent(event: MapEvent): void {
    const callbacks = this.eventCallbacks.get(event.type)
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in map event callback for ${event.type}:`, error)
        }
      })
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get current map
   */
  public getCurrentMap(): MapData | undefined {
    return this.currentMap
  }

  /**
   * Get current map resources
   */
  public getCurrentResources(): LoadedMapResources | undefined {
    return this.currentResources
  }

  /**
   * Get scene
   */
  public getScene(): THREE.Scene | undefined {
    return this.currentResources?.scene
  }

  /**
   * Is map loaded
   */
  public isMapLoaded(): boolean {
    return !!this.currentMap && !!this.currentResources
  }

  /**
   * Is loading
   */
  public isMapLoading(): boolean {
    return this.isLoading
  }

  /**
   * Get all available maps
   */
  public getAvailableMaps(): MapData[] {
    return getAllMaps()
  }

  /**
   * Dispose
   */
  public dispose(): void {
    this.unloadMap()
    this.loader.dispose()
    this.eventCallbacks.clear()
    this.playerZones.clear()

    console.log('🗑️ MapManager: Disposed')
  }
}
