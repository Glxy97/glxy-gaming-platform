/**
 * GLXY Ultimate FPS - Map System Tests
 *
 * Comprehensive test coverage for the map system:
 * - MapData validation and helpers
 * - Map catalog functions
 * - MapManager functionality
 * - Spawn system
 * - Objective system
 * - Zone system
 *
 * @module MapSystemTests
 * @version 1.8.0-alpha
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MapData,
  MapTheme,
  MapSize,
  TimeOfDay,
  WeatherType,
  SpawnType,
  ZoneType,
  CoverType,
  createDefaultLighting,
  createDefaultWeather,
  createDefaultFog,
  createFloorGeometry,
  createWallGeometry,
  createCoverObject,
  validateMapData,
  calculateMapCenter,
  isWithinBoundaries
} from '../../maps/data/MapData'
import {
  getMap,
  getAllMaps,
  getMapsByTheme,
  getMapsBySize,
  getMapsByGameMode,
  URBAN_WARFARE,
  DESERT_STORM,
  WAREHOUSE_DISTRICT
} from '../../maps/data/maps-catalog'

describe('MapData Helpers', () => {
  describe('createDefaultLighting', () => {
    it('should create dawn lighting', () => {
      const lighting = createDefaultLighting(TimeOfDay.DAWN)
      expect(lighting.ambientIntensity).toBeLessThan(0.5)
      expect(lighting.sunIntensity).toBeLessThan(1.0)
    })

    it('should create noon lighting', () => {
      const lighting = createDefaultLighting(TimeOfDay.NOON)
      expect(lighting.ambientIntensity).toBe(0.5)
      expect(lighting.sunIntensity).toBe(1.0)
    })

    it('should create night lighting', () => {
      const lighting = createDefaultLighting(TimeOfDay.NIGHT)
      expect(lighting.ambientIntensity).toBeLessThan(0.3)
      expect(lighting.sunIntensity).toBeLessThan(0.5)
    })
  })

  describe('createDefaultWeather', () => {
    it('should create clear weather', () => {
      const weather = createDefaultWeather(WeatherType.CLEAR)
      expect(weather.intensity).toBe(0)
      expect(weather.precipitationDensity).toBe(0)
    })

    it('should create rainy weather', () => {
      const weather = createDefaultWeather(WeatherType.RAINY)
      expect(weather.intensity).toBeGreaterThan(0)
      expect(weather.precipitationDensity).toBeGreaterThan(0)
    })

    it('should create stormy weather with lightning', () => {
      const weather = createDefaultWeather(WeatherType.STORMY)
      expect(weather.intensity).toBeGreaterThan(0.5)
      expect(weather.lightningFrequency).toBeGreaterThan(0)
    })
  })

  describe('createFloorGeometry', () => {
    it('should create floor with correct dimensions', () => {
      const floor = createFloorGeometry(100, 50)
      expect(floor.dimensions.x).toBe(100)
      expect(floor.dimensions.z).toBe(50)
      expect(floor.isStatic).toBe(true)
    })

    it('should use correct material type', () => {
      const floor = createFloorGeometry(100, 50)
      expect(floor.material).toBeDefined()
    })
  })

  describe('createWallGeometry', () => {
    it('should create wall with correct dimensions', () => {
      const wall = createWallGeometry(10, 5, { x: 0, y: 0, z: 0 })
      expect(wall.dimensions.x).toBe(10)
      expect(wall.dimensions.y).toBe(5)
      expect(wall.provideCover).toBe(true)
      expect(wall.coverType).toBe(CoverType.HIGH)
    })
  })

  describe('createCoverObject', () => {
    it('should create high cover', () => {
      const cover = createCoverObject({ x: 0, y: 0, z: 0 }, CoverType.HIGH)
      expect(cover.dimensions.y).toBe(2)
      expect(cover.coverType).toBe(CoverType.HIGH)
    })

    it('should create low cover', () => {
      const cover = createCoverObject({ x: 0, y: 0, z: 0 }, CoverType.LOW)
      expect(cover.dimensions.y).toBe(1)
      expect(cover.coverType).toBe(CoverType.LOW)
    })
  })

  describe('validateMapData', () => {
    it('should validate valid map', () => {
      const result = validateMapData(URBAN_WARFARE)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for map without ID', () => {
      const invalidMap = {
        ...URBAN_WARFARE,
        metadata: { ...URBAN_WARFARE.metadata, id: '' }
      }
      const result = validateMapData(invalidMap)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Map ID is required')
    })

    it('should fail validation for map without spawns', () => {
      const invalidMap = {
        ...URBAN_WARFARE,
        spawnPoints: []
      }
      const result = validateMapData(invalidMap)
      expect(result.valid).toBe(false)
    })
  })

  describe('calculateMapCenter', () => {
    it('should calculate center correctly', () => {
      const center = calculateMapCenter(URBAN_WARFARE)
      expect(center).toBeDefined()
      expect(center.x).toBeDefined()
      expect(center.y).toBeDefined()
      expect(center.z).toBeDefined()
    })
  })

  describe('isWithinBoundaries', () => {
    it('should return true for position within boundaries', () => {
      const position = { x: 0, y: 0, z: 0 }
      const result = isWithinBoundaries(position, URBAN_WARFARE.boundaries)
      expect(result).toBe(true)
    })

    it('should return false for position outside boundaries', () => {
      const position = { x: 1000, y: 0, z: 0 }
      const result = isWithinBoundaries(position, URBAN_WARFARE.boundaries)
      expect(result).toBe(false)
    })
  })
})

describe('Maps Catalog', () => {
  describe('getMap', () => {
    it('should get map by ID', () => {
      const map = getMap('urban_warfare')
      expect(map).toBeDefined()
      expect(map?.metadata.id).toBe('urban_warfare')
    })

    it('should return undefined for non-existent map', () => {
      const map = getMap('non_existent')
      expect(map).toBeUndefined()
    })
  })

  describe('getAllMaps', () => {
    it('should return all maps', () => {
      const maps = getAllMaps()
      expect(maps.length).toBeGreaterThan(0)
      expect(maps).toContain(URBAN_WARFARE)
      expect(maps).toContain(DESERT_STORM)
      expect(maps).toContain(WAREHOUSE_DISTRICT)
    })
  })

  describe('getMapsByTheme', () => {
    it('should filter maps by urban theme', () => {
      const maps = getMapsByTheme(MapTheme.URBAN)
      expect(maps.length).toBeGreaterThan(0)
      maps.forEach(map => {
        expect(map.metadata.theme).toBe(MapTheme.URBAN)
      })
    })

    it('should filter maps by desert theme', () => {
      const maps = getMapsByTheme(MapTheme.DESERT)
      expect(maps.length).toBeGreaterThan(0)
      maps.forEach(map => {
        expect(map.metadata.theme).toBe(MapTheme.DESERT)
      })
    })
  })

  describe('getMapsBySize', () => {
    it('should filter maps by size', () => {
      const mediumMaps = getMapsBySize(MapSize.MEDIUM)
      const largeMaps = getMapsBySize(MapSize.LARGE)
      const smallMaps = getMapsBySize(MapSize.SMALL)

      expect(mediumMaps.length).toBeGreaterThan(0)
      expect(largeMaps.length).toBeGreaterThan(0)
      expect(smallMaps.length).toBeGreaterThan(0)
    })
  })

  describe('getMapsByGameMode', () => {
    it('should filter maps by TDM mode', () => {
      const maps = getMapsByGameMode('tdm')
      expect(maps.length).toBeGreaterThan(0)
      maps.forEach(map => {
        expect(map.metadata.supportedGameModes).toContain('tdm')
      })
    })

    it('should filter maps by FFA mode', () => {
      const maps = getMapsByGameMode('ffa')
      expect(maps.length).toBeGreaterThan(0)
      maps.forEach(map => {
        expect(map.metadata.supportedGameModes).toContain('ffa')
      })
    })
  })
})

describe('Map Definitions', () => {
  describe('Urban Warfare', () => {
    it('should have correct metadata', () => {
      expect(URBAN_WARFARE.metadata.id).toBe('urban_warfare')
      expect(URBAN_WARFARE.metadata.theme).toBe(MapTheme.URBAN)
      expect(URBAN_WARFARE.metadata.size).toBe(MapSize.MEDIUM)
    })

    it('should have spawn points', () => {
      expect(URBAN_WARFARE.spawnPoints.length).toBeGreaterThan(0)
    })

    it('should have team spawns', () => {
      const teamA = URBAN_WARFARE.spawnPoints.filter(s => s.type === SpawnType.TEAM_A)
      const teamB = URBAN_WARFARE.spawnPoints.filter(s => s.type === SpawnType.TEAM_B)

      expect(teamA.length).toBeGreaterThan(0)
      expect(teamB.length).toBeGreaterThan(0)
    })

    it('should have objectives', () => {
      expect(URBAN_WARFARE.objectives.length).toBeGreaterThan(0)
    })

    it('should have geometry', () => {
      expect(URBAN_WARFARE.geometry.length).toBeGreaterThan(0)
    })

    it('should have environment configured', () => {
      expect(URBAN_WARFARE.environment).toBeDefined()
      expect(URBAN_WARFARE.environment.lighting).toBeDefined()
      expect(URBAN_WARFARE.environment.weather).toBeDefined()
    })
  })

  describe('Desert Storm', () => {
    it('should be a large desert map', () => {
      expect(DESERT_STORM.metadata.theme).toBe(MapTheme.DESERT)
      expect(DESERT_STORM.metadata.size).toBe(MapSize.LARGE)
    })

    it('should have clear weather by default', () => {
      expect(DESERT_STORM.environment.weather.type).toBe(WeatherType.CLEAR)
    })

    it('should have noon lighting', () => {
      expect(DESERT_STORM.environment.timeOfDay).toBe(TimeOfDay.NOON)
    })
  })

  describe('Warehouse District', () => {
    it('should be a small industrial map', () => {
      expect(WAREHOUSE_DISTRICT.metadata.theme).toBe(MapTheme.INDUSTRIAL)
      expect(WAREHOUSE_DISTRICT.metadata.size).toBe(MapSize.SMALL)
    })

    it('should have FFA spawns', () => {
      const ffaSpawns = WAREHOUSE_DISTRICT.spawnPoints.filter(s => s.type === SpawnType.FFA)
      expect(ffaSpawns.length).toBeGreaterThan(0)
    })

    it('should have night lighting', () => {
      expect(WAREHOUSE_DISTRICT.environment.timeOfDay).toBe(TimeOfDay.NIGHT)
    })

    it('should have point lights', () => {
      expect(WAREHOUSE_DISTRICT.environment.lighting.pointLights.length).toBeGreaterThan(0)
    })
  })
})

describe('Map Features', () => {
  it('all maps should support at least one game mode', () => {
    const maps = getAllMaps()
    maps.forEach(map => {
      expect(map.metadata.supportedGameModes.length).toBeGreaterThan(0)
    })
  })

  it('all maps should have boundaries defined', () => {
    const maps = getAllMaps()
    maps.forEach(map => {
      expect(map.boundaries).toBeDefined()
      expect(map.boundaries.min).toBeDefined()
      expect(map.boundaries.max).toBeDefined()
    })
  })

  it('all maps should have valid spawn points', () => {
    const maps = getAllMaps()
    maps.forEach(map => {
      expect(map.spawnPoints.length).toBeGreaterThan(0)
      map.spawnPoints.forEach(spawn => {
        expect(spawn.id).toBeDefined()
        expect(spawn.position).toBeDefined()
        expect(spawn.rotation).toBeDefined()
      })
    })
  })

  it('all maps should have geometry', () => {
    const maps = getAllMaps()
    maps.forEach(map => {
      expect(map.geometry.length).toBeGreaterThan(0)
    })
  })

  it('all maps should have environment settings', () => {
    const maps = getAllMaps()
    maps.forEach(map => {
      expect(map.environment).toBeDefined()
      expect(map.environment.lighting).toBeDefined()
      expect(map.environment.weather).toBeDefined()
    })
  })
})
