// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'

export interface EnvironmentSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra' | 'cinematic'
  enableFoliage: boolean
  enableWeather: boolean
  enableDynamicLighting: boolean
  enablePostProcessing: boolean
  enablePhysics: boolean
  lodDistance: number
  renderDistance: number
}

export interface EnvironmentZone {
  id: string
  type: 'urban' | 'industrial' | 'residential' | 'commercial' | 'park' | 'rooftop'
  position: THREE.Vector3
  size: THREE.Vector3
  buildings: BuildingData[]
  environmentObjects: EnvironmentObject[]
  lightingPreset: LightingPreset
  weatherZone?: WeatherZone
}

export interface BuildingData {
  id: string
  position: THREE.Vector3
  rotation: number
  scale: THREE.Vector3
  buildingType: 'skyscraper' | 'apartment' | 'office' | 'shop' | 'warehouse' | 'house'
  floors: number
  hasInterior: boolean
  isDestructible: boolean
  hasRooftop: boolean
  windows: WindowData[]
  doors: DoorData[]
  interiorRooms: RoomData[]
}

export interface WindowData {
  position: THREE.Vector3
  size: THREE.Vector3
  isBreakable: boolean
  hasLight: boolean
  glassMaterial: 'clear' | 'tinted' | 'frosted' | 'bulletproof'
  curtainState: 'open' | 'closed' | 'partial'
}

export interface DoorData {
  position: THREE.Vector3
  size: THREE.Vector3
  type: 'wooden' | 'metal' | 'glass' | 'security'
  isOpen: boolean
  isLocked: boolean
  isBreakable: boolean
  hasPeephole: boolean
}

export interface RoomData {
  id: string
  type: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'storage' | 'hallway'
  size: THREE.Vector3
  position: THREE.Vector3
  furniture: FurnitureData[]
  lighting: RoomLighting
  hasWindows: boolean
  hasDoors: boolean
}

export interface FurnitureData {
  id: string
  type: 'sofa' | 'table' | 'chair' | 'bed' | 'desk' | 'cabinet' | 'tv' | 'computer' | 'plant' | 'lamp'
  position: THREE.Vector3
  rotation: number
  isDestructible: boolean
  isMovable: boolean
  material: 'wood' | 'metal' | 'plastic' | 'glass' | 'fabric'
  physicsProperties: {
    mass: number
    friction: number
    restitution: number
  }
}

export interface EnvironmentObject {
  id: string
  type: 'street_light' | 'bench' | 'trash_can' | 'mailbox' | 'fire_hydrant' | 'traffic_light' | 'tree' | 'bush' | 'flower_bed' | 'fountain' | 'statue' | 'vehicle' | 'bicycle' | 'construction_barrier' | 'road_block' | 'scaffolding'
  position: THREE.Vector3
  rotation: number
  scale: THREE.Vector3
  isDestructible: boolean
  isMovable: boolean
  hasCollision: boolean
  mesh?: THREE.Mesh
  physicsBody?: any
  interactable: boolean
  interactionType: 'use' | 'destroy' | 'move' | 'activate' | 'climb'
}

export interface LightingPreset {
  id: string
  name: string
  ambientLight: {
    color: THREE.Color
    intensity: number
  }
  directionalLight: {
    color: THREE.Color
    intensity: number
    position: THREE.Vector3
    castShadow: boolean
    shadowMapSize: number
  }
  pointLights: PointLightData[]
  spotLights: SpotLightData[]
  fog: {
    color: THREE.Color
    near: number
    far: number
    density: number
  }
  postProcessing: PostProcessingSettings
}

export interface PointLightData {
  position: THREE.Vector3
  color: THREE.Color
  intensity: number
  distance: number
  decay: number
  isAnimated: boolean
  animationType: 'flicker' | 'pulse' | 'color_cycle' | 'random'
}

export interface SpotLightData {
  position: THREE.Vector3
  target: THREE.Vector3
  color: THREE.Color
  intensity: number
  angle: number
  penumbra: number
  distance: number
  decay: number
  isAnimated: boolean
  animationType: 'scan' | 'flicker' | 'alert'
}

export interface PostProcessingSettings {
  bloom: {
    enabled: boolean
    strength: number
    radius: number
    threshold: number
  }
  colorCorrection: {
    enabled: boolean
    contrast: number
    brightness: number
    saturation: number
    hue: number
  }
  ambientOcclusion: {
    enabled: boolean
    intensity: number
    radius: number
    bias: number
  }
  depthOfField: {
    enabled: boolean
    focusDistance: number
    focusRange: number
    bokehStrength: number
  }
  motionBlur: {
    enabled: boolean
    strength: number
  }
  filmGrain: {
    enabled: boolean
    intensity: number
  }
}

export interface WeatherZone {
  id: string
  type: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy' | 'sandy'
  position: THREE.Vector3
  size: THREE.Vector3
  intensity: number
  particleSystem: THREE.Points
  particleCount: number
  windDirection: THREE.Vector3
  windStrength: number
  effects: WeatherEffect[]
  audioLoop?: string
}

export interface WeatherEffect {
  type: 'rain' | 'snow' | 'fog' | 'wind' | 'lightning' | 'thunder' | 'hail' | 'dust'
  intensity: number
  particles: THREE.Points
  material: THREE.Material
  animationParams: {
    speed: number
    direction: THREE.Vector3
    turbulence: number
    lifetime: number
  }
}

interface FoliageSystem {
  trees: FoliageInstance[]
  bushes: FoliageInstance[]
  grass: FoliageInstance[]
  flowers: FoliageInstance[]
  season: 'spring' | 'summer' | 'autumn' | 'winter'
}

export interface FoliageInstance {
  id: string
  type: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  variant: number
  isDestructible: boolean
  physicsBody?: any
  lodLevels: LODLevel[]
}

export interface LODLevel {
  distance: number
  mesh: THREE.Mesh
  material: THREE.Material
  shadowEnabled: boolean
}

export interface WindSimulation {
  enabled: boolean
  strength: number
  direction: THREE.Vector3
  turbulence: number
  gustFrequency: number
  gustStrength: number
  animationSpeed: number
}

export interface AudioZone {
  id: string
  type: 'street' | 'interior' | 'rooftop' | 'basement' | 'park' | 'industrial'
  position: THREE.Vector3
  size: THREE.Vector3
  ambientSounds: AudioAsset[]
  reverbPreset: ReverbPreset
  volume: number
  transitionZones: AudioTransitionZone[]
}

export interface AudioAsset {
  id: string
  name: string
  audio: HTMLAudioElement
  volume: number
  pitch: number
  loop: boolean
  fadeInTime: number
  fadeOutTime: number
  category: 'ambient' | 'weather' | 'traffic' | 'crowd' | 'indoor' | 'nature'
}

export interface ReverbPreset {
  name: string
  decayTime: number
  earlyDelay: number
  lateDelay: number
  roomSize: number
  damping: number
  wetLevel: number
  dryLevel: number
}

export interface AudioTransitionZone {
  fromZone: string
  toZone: string
  position: THREE.Vector3
  size: THREE.Vector3
  transitionType: 'fade' | 'crossfade' | 'instant'
  transitionDuration: number
}

export class PathfindingSystem {
  public navMesh: THREE.Mesh | null = null
  public walkableSurfaces: THREE.Mesh[] = []
  public obstacles: THREE.Mesh[] = []
  public waypoints: Waypoint[] = []
  public zones: NavigationZone[] = []

  constructor() {
    // Initialize pathfinding system
  }
}

export interface Waypoint {
  id: string
  position: THREE.Vector3
  connections: string[]
  isCover: boolean
  isCrouchable: boolean
  isVaultable: boolean
  priority: number
}

export interface NavigationZone {
  id: string
  type: 'open_area' | 'corridor' | 'room' | 'staircase' | 'elevator' | 'rooftop' | 'alley'
  bounds: THREE.Box3
  waypoints: string[]
  isAccessible: boolean
  requiresSpecialMovement: boolean
}

export class GLXYEnhancedEnvironment {
  private scene!: THREE.Scene
  private renderer!: THREE.WebGLRenderer
  private camera!: THREE.Camera
  private settings!: EnvironmentSettings

  private zones: Map<string, EnvironmentZone> = new Map()
  private buildings: Map<string, BuildingData> = new Map()
  private objects: Map<string, EnvironmentObject> = new Map()
  private audioZones: Map<string, AudioZone> = new Map()
  private weatherZones: Map<string, WeatherZone> = new Map()

  private foliageSystem!: FoliageSystem
  private pathfindingSystem!: PathfindingSystem
  private lightingManager!: LightingManager
  private physicsEngine!: EnvironmentPhysics
  private audioManager!: EnvironmentAudio
  private lodManager!: LODManager

  private currentZone: string | null = null
  private previousZone: string | null = null
  private timeOfDay: number = 12
  private season: 'spring' | 'summer' | 'autumn' | 'winter' = 'summer'
  private weatherIntensity: number = 0

  private onZoneChangeCallbacks: ((zone: string) => void)[] = []
  private onWeatherChangeCallbacks: ((weather: WeatherZone) => void)[] = []

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera, settings: EnvironmentSettings) {
    this.scene = scene
    this.renderer = renderer
    this.camera = camera
    this.settings = settings

    this.initializeSubSystems()
    this.createInitialEnvironment()
    this.setupEventListeners()
  }

  private initializeSubSystems(): void {
    this.foliageSystem = new FoliageSystem(this.scene, this.settings)
    this.pathfindingSystem = new PathfindingSystem()
    this.lightingManager = new LightingManager(this.scene, this.renderer)
    this.physicsEngine = new EnvironmentPhysics()
    this.audioManager = new EnvironmentAudio()
    this.lodManager = new LODManager(this.camera, this.settings)
  }

  private createInitialEnvironment(): void {
    // Create main urban combat zone
    const urbanZone = this.createUrbanZone()
    this.addZone(urbanZone)

    // Create industrial zone
    const industrialZone = this.createIndustrialZone()
    this.addZone(industrialZone)

    // Create residential zone
    const residentialZone = this.createResidentialZone()
    this.addZone(residentialZone)

    // Create rooftop combat zone
    const rooftopZone = this.createRooftopZone()
    this.addZone(rooftopZone)

    // Connect zones with transitions
    this.setupZoneTransitions()

    // Initialize lighting for all zones
    this.lightingManager.initializeZoneLighting(Array.from(this.zones.values()))

    // Create weather systems
    this.initializeWeatherSystems()

    // Setup audio zones
    this.initializeAudioZones()

    // Generate pathfinding network
    this.generatePathfindingNetwork()

    // Populate with detail objects
    this.populateEnvironmentDetails()
  }

  private createUrbanZone(): EnvironmentZone {
    const buildings: BuildingData[] = []
    const objects: EnvironmentObject[] = []

    // Create skyscrapers
    for (let i = 0; i < 8; i++) {
      const skyscraper = this.generateSkyscraper(new THREE.Vector3(
        (i - 4) * 40,
        0,
        (Math.random() - 0.5) * 60
      ))
      buildings.push(skyscraper)
    }

    // Create office buildings
    for (let i = 0; i < 12; i++) {
      const office = this.generateOfficeBuilding(new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      ))
      buildings.push(office)
    }

    // Create shops and restaurants
    for (let i = 0; i < 20; i++) {
      const shop = this.generateShop(new THREE.Vector3(
        (Math.random() - 0.5) * 240,
        0,
        (Math.random() - 0.5) * 240
      ))
      buildings.push(shop)
    }

    // Street objects
    objects.push(...this.generateStreetObjects())

    return {
      id: 'urban_combat',
      type: 'urban',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(300, 150, 300),
      buildings,
      environmentObjects: objects,
      lightingPreset: this.getUrbanLightingPreset(),
      weatherZone: this.createWeatherZone('urban')
    }
  }

  private createIndustrialZone(): EnvironmentZone {
    const buildings: BuildingData[] = []
    const objects: EnvironmentObject[] = []

    // Create warehouses
    for (let i = 0; i < 6; i++) {
      const warehouse = this.generateWarehouse(new THREE.Vector3(
        (i - 3) * 60,
        0,
        (Math.random() - 0.5) * 100
      ))
      buildings.push(warehouse)
    }

    // Create factories
    for (let i = 0; i < 4; i++) {
      const factory = this.generateFactory(new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      ))
      buildings.push(factory)
    }

    // Industrial objects
    objects.push(...this.generateIndustrialObjects())

    return {
      id: 'industrial_complex',
      type: 'industrial',
      position: new THREE.Vector3(200, 0, 0),
      size: new THREE.Vector3(250, 80, 250),
      buildings,
      environmentObjects: objects,
      lightingPreset: this.getIndustrialLightingPreset(),
      weatherZone: this.createWeatherZone('industrial')
    }
  }

  private createResidentialZone(): EnvironmentZone {
    const buildings: BuildingData[] = []
    const objects: EnvironmentObject[] = []

    // Create apartment buildings
    for (let i = 0; i < 10; i++) {
      const apartment = this.generateApartmentBuilding(new THREE.Vector3(
        (i - 5) * 30,
        0,
        (Math.random() - 0.5) * 80
      ))
      buildings.push(apartment)
    }

    // Create houses
    for (let i = 0; i < 15; i++) {
      const house = this.generateHouse(new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      ))
      buildings.push(house)
    }

    // Residential objects
    objects.push(...this.generateResidentialObjects())

    return {
      id: 'residential_area',
      type: 'residential',
      position: new THREE.Vector3(-200, 0, 0),
      size: new THREE.Vector3(200, 60, 200),
      buildings,
      environmentObjects: objects,
      lightingPreset: this.getResidentialLightingPreset(),
      weatherZone: this.createWeatherZone('residential')
    }
  }

  private createRooftopZone(): EnvironmentZone {
    const buildings: BuildingData[] = []
    const objects: EnvironmentObject[] = []

    // Create rooftop-accessible buildings
    for (let i = 0; i < 6; i++) {
      const rooftop = this.generateRooftopBuilding(new THREE.Vector3(
        (i - 3) * 50,
        80,
        (Math.random() - 0.5) * 100
      ))
      buildings.push(rooftop)
    }

    // Rooftop objects
    objects.push(...this.generateRooftopObjects())

    return {
      id: 'rooftop_combat',
      type: 'rooftop',
      position: new THREE.Vector3(0, 0, 200),
      size: new THREE.Vector3(200, 50, 200),
      buildings,
      environmentObjects: objects,
      lightingPreset: this.getRooftopLightingPreset(),
      weatherZone: this.createWeatherZone('rooftop')
    }
  }

  private generateSkyscraper(position: THREE.Vector3): BuildingData {
    const floors = Math.floor(Math.random() * 30) + 40
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // Generate windows for each floor
    for (let floor = 0; floor < floors; floor++) {
      for (let side = 0; side < 4; side++) {
        for (let window = 0; window < 8; window++) {
          windows.push({
            position: new THREE.Vector3(
              (side % 2 === 0 ? -20 : 20) + (window - 3.5) * 5,
              floor * 4 + 2,
              (side < 2 ? -20 : 20)
            ),
            size: new THREE.Vector3(3, 3, 0.2),
            isBreakable: true,
            hasLight: Math.random() > 0.3,
            glassMaterial: ['clear', 'tinted', 'frosted', 'bulletproof'][Math.floor(Math.random() * 4)] as any,
            curtainState: ['open', 'closed', 'partial'][Math.floor(Math.random() * 3)] as any
          })
        }
      }

      // Generate interior rooms for some floors
      if (floor % 3 === 0) {
        const roomTypes: RoomData['type'][] = ['office', 'storage', 'storage', 'storage']
        for (let room = 0; room < 4; room++) {
          interiorRooms.push({
            id: `floor_${floor}_room_${room}`,
            type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
            size: new THREE.Vector3(15, 4, 15),
            position: new THREE.Vector3(
              (room % 2 === 0 ? -15 : 15),
              floor * 4,
              (room < 2 ? -15 : 15)
            ),
            furniture: this.generateRoomFurniture(roomTypes[Math.floor(Math.random() * roomTypes.length)]),
            lighting: this.generateRoomLighting(),
            hasWindows: true,
            hasDoors: true
          })
        }
      }
    }

    return {
      id: `skyscraper_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'skyscraper',
      floors,
      hasInterior: true,
      isDestructible: false,
      hasRooftop: true,
      windows,
      doors: this.generateBuildingDoors('skyscraper'),
      interiorRooms
    }
  }

  private generateOfficeBuilding(position: THREE.Vector3): BuildingData {
    const floors = Math.floor(Math.random() * 15) + 10
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // Similar window generation for office buildings
    for (let floor = 0; floor < floors; floor++) {
      for (let side = 0; side < 4; side++) {
        for (let window = 0; window < 6; window++) {
          windows.push({
            position: new THREE.Vector3(
              (side % 2 === 0 ? -15 : 15) + (window - 2.5) * 5,
              floor * 3.5 + 1.8,
              (side < 2 ? -15 : 15)
            ),
            size: new THREE.Vector3(3, 2.5, 0.2),
            isBreakable: true,
            hasLight: Math.random() > 0.2,
            glassMaterial: 'clear',
            curtainState: 'open'
          })
        }
      }

      // Office interiors
      if (floor % 2 === 0) {
        interiorRooms.push({
          id: `office_floor_${floor}`,
          type: 'office',
          size: new THREE.Vector3(25, 3.5, 25),
          position: new THREE.Vector3(0, floor * 3.5, 0),
          furniture: this.generateOfficeFurniture(),
          lighting: this.generateOfficeLighting(),
          hasWindows: true,
          hasDoors: true
        })
      }
    }

    return {
      id: `office_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'office',
      floors,
      hasInterior: true,
      isDestructible: true,
      hasRooftop: true,
      windows,
      doors: this.generateBuildingDoors('office'),
      interiorRooms
    }
  }

  private generateShop(position: THREE.Vector3): BuildingData {
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // Shop windows (ground floor)
    for (let side = 0; side < 2; side++) {
      for (let window = 0; window < 3; window++) {
        windows.push({
          position: new THREE.Vector3(
            (side === 0 ? -8 : 8),
            2,
            (window - 1) * 6
          ),
          size: new THREE.Vector3(0.2, 3, 4),
          isBreakable: true,
          hasLight: true,
          glassMaterial: 'clear',
          curtainState: 'open'
        })
      }
    }

    // Shop interior
    interiorRooms.push({
      id: `shop_${position.x}_${position.z}`,
      type: 'office',
      size: new THREE.Vector3(15, 4, 15),
      position: new THREE.Vector3(0, 0, 0),
      furniture: this.generateShopFurniture(),
      lighting: this.generateShopLighting(),
      hasWindows: true,
      hasDoors: true
    })

    return {
      id: `shop_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'shop',
      floors: 2,
      hasInterior: true,
      isDestructible: true,
      hasRooftop: false,
      windows,
      doors: this.generateBuildingDoors('shop'),
      interiorRooms
    }
  }

  private generateWarehouse(position: THREE.Vector3): BuildingData {
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // Limited windows for warehouse
    for (let i = 0; i < 8; i++) {
      windows.push({
        position: new THREE.Vector3(
          (i % 2 === 0 ? -25 : 25),
          8,
          (Math.floor(i / 2) - 1.5) * 10
        ),
        size: new THREE.Vector3(0.3, 4, 3),
        isBreakable: false,
        hasLight: false,
        glassMaterial: 'frosted',
        curtainState: 'open'
      })
    }

    // Large open interior space
    interiorRooms.push({
      id: `warehouse_${position.x}_${position.z}`,
      type: 'storage',
      size: new THREE.Vector3(45, 12, 45),
      position: new THREE.Vector3(0, 0, 0),
      furniture: this.generateWarehouseFurniture(),
      lighting: this.generateWarehouseLighting(),
      hasWindows: true,
      hasDoors: true
    })

    return {
      id: `warehouse_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'warehouse',
      floors: 1,
      hasInterior: true,
      isDestructible: true,
      hasRooftop: true,
      windows,
      doors: this.generateWarehouseDoors(),
      interiorRooms
    }
  }

  private generateFactory(position: THREE.Vector3): BuildingData {
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // Factory windows
    for (let i = 0; i < 12; i++) {
      windows.push({
        position: new THREE.Vector3(
          (i % 2 === 0 ? -30 : 30),
          6 + Math.floor(i / 2) * 4,
          (Math.floor(i / 2) - 2.5) * 8
        ),
        size: new THREE.Vector3(0.3, 3, 2.5),
        isBreakable: false,
        hasLight: false,
        glassMaterial: 'tinted',
        curtainState: 'open'
      })
    }

    // Factory interior with machinery
    for (let section = 0; section < 4; section++) {
      interiorRooms.push({
        id: `factory_section_${section}`,
        type: 'storage',
        size: new THREE.Vector3(25, 15, 20),
        position: new THREE.Vector3(
          (section % 2 === 0 ? -20 : 20),
          0,
          (section < 2 ? -15 : 15)
        ),
        furniture: this.generateFactoryMachinery(),
        lighting: this.generateFactoryLighting(),
        hasWindows: true,
        hasDoors: true
      })
    }

    return {
      id: `factory_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'warehouse',
      floors: 1,
      hasInterior: true,
      isDestructible: true,
      hasRooftop: true,
      windows,
      doors: this.generateFactoryDoors(),
      interiorRooms
    }
  }

  private generateApartmentBuilding(position: THREE.Vector3): BuildingData {
    const floors = Math.floor(Math.random() * 8) + 6
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // Generate apartment windows and rooms
    for (let floor = 0; floor < floors; floor++) {
      for (let side = 0; side < 4; side++) {
        for (let window = 0; window < 3; window++) {
          windows.push({
            position: new THREE.Vector3(
              (side % 2 === 0 ? -10 : 10),
              floor * 3 + 1.5,
              (window - 1) * 6
            ),
            size: new THREE.Vector3(0.2, 2, 2.5),
            isBreakable: true,
            hasLight: Math.random() > 0.4,
            glassMaterial: 'clear',
            curtainState: ['open', 'closed', 'partial'][Math.floor(Math.random() * 3)] as any
          })
        }
      }

      // Generate apartment interiors
      for (let apt = 0; apt < 4; apt++) {
        const roomTypes: RoomData['type'][] = ['living_room', 'bedroom', 'kitchen', 'bathroom']
        roomTypes.forEach((roomType, index) => {
          interiorRooms.push({
            id: `apt_${floor}_${apt}_${roomType}`,
            type: roomType,
            size: new THREE.Vector3(6, 3, 6),
            position: new THREE.Vector3(
              (apt % 2 === 0 ? -7 : 7),
              floor * 3,
              (index < 2 ? -7 : 7)
            ),
            furniture: this.generateApartmentFurniture(roomType),
            lighting: this.generateApartmentLighting(roomType),
            hasWindows: true,
            hasDoors: true
          })
        })
      }
    }

    return {
      id: `apartment_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'apartment',
      floors,
      hasInterior: true,
      isDestructible: true,
      hasRooftop: true,
      windows,
      doors: this.generateApartmentDoors(),
      interiorRooms
    }
  }

  private generateHouse(position: THREE.Vector3): BuildingData {
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // House windows
    const windowPositions = [
      { x: -6, y: 1.5, z: 0 },
      { x: 6, y: 1.5, z: 0 },
      { x: 0, y: 1.5, z: -6 },
      { x: -3, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 }
    ]

    windowPositions.forEach((pos, i) => {
      windows.push({
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        size: new THREE.Vector3(1.5, 1.5, 0.2),
        isBreakable: true,
        hasLight: Math.random() > 0.3,
        glassMaterial: 'clear',
        curtainState: ['open', 'closed'][Math.floor(Math.random() * 2)] as any
      })
    })

    // House rooms
    const roomTypes: RoomData['type'][] = ['living_room', 'kitchen', 'bedroom', 'bathroom']
    roomTypes.forEach((roomType, index) => {
      interiorRooms.push({
        id: `house_${position.x}_${position.z}_${roomType}`,
        type: roomType,
        size: new THREE.Vector3(5, 3, 5),
        position: new THREE.Vector3(
          (index % 2 === 0 ? -4 : 4),
          index < 2 ? 0 : 3,
          (index < 2 ? -4 : 4)
        ),
        furniture: this.generateHouseFurniture(roomType),
        lighting: this.generateHouseLighting(roomType),
        hasWindows: true,
        hasDoors: true
      })
    })

    return {
      id: `house_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'house',
      floors: 2,
      hasInterior: true,
      isDestructible: true,
      hasRooftop: true,
      windows,
      doors: this.generateHouseDoors(),
      interiorRooms
    }
  }

  private generateRooftopBuilding(position: THREE.Vector3): BuildingData {
    const windows: WindowData[] = []
    const interiorRooms: RoomData[] = []

    // Limited windows for rooftop buildings
    for (let i = 0; i < 4; i++) {
      windows.push({
        position: new THREE.Vector3(
          (i % 2 === 0 ? -15 : 15),
          position.y + 5,
          (Math.floor(i / 2) - 0.5) * 20
        ),
        size: new THREE.Vector3(0.3, 3, 2),
        isBreakable: true,
        hasLight: false,
        glassMaterial: 'tinted',
        curtainState: 'open'
      })
    }

    // Rooftop access room
    interiorRooms.push({
      id: `rooftop_access_${position.x}_${position.z}`,
      type: 'hallway',
      size: new THREE.Vector3(20, 3, 20),
      position: new THREE.Vector3(0, position.y - 1.5, 0),
      furniture: this.generateRooftopAccessFurniture(),
      lighting: this.generateRooftopLighting(),
      hasWindows: true,
      hasDoors: true
    })

    return {
      id: `rooftop_${position.x}_${position.z}`,
      position,
      rotation: Math.random() * Math.PI * 2,
      scale: new THREE.Vector3(1, 1, 1),
      buildingType: 'office',
      floors: position.y / 4,
      hasInterior: true,
      isDestructible: false,
      hasRooftop: true,
      windows,
      doors: this.generateRooftopDoors(),
      interiorRooms
    }
  }

  private generateStreetObjects(): EnvironmentObject[] {
    const objects: EnvironmentObject[] = []

    // Street lights
    for (let i = 0; i < 30; i++) {
      objects.push({
        id: `street_light_${i}`,
        type: 'street_light',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          0,
          (Math.random() - 0.5) * 280
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: false,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'activate'
      })
    }

    // Benches
    for (let i = 0; i < 15; i++) {
      objects.push({
        id: `bench_${i}`,
        type: 'bench',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          0,
          (Math.random() - 0.5) * 280
        ),
        rotation: Math.random() * Math.PI * 2,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'use'
      })
    }

    // Trash cans
    for (let i = 0; i < 20; i++) {
      objects.push({
        id: `trash_can_${i}`,
        type: 'trash_can',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          0,
          (Math.random() - 0.5) * 280
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: true,
        hasCollision: true,
        interactable: true,
        interactionType: 'destroy'
      })
    }

    // Traffic lights
    for (let i = 0; i < 12; i++) {
      objects.push({
        id: `traffic_light_${i}`,
        type: 'traffic_light',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          0,
          (Math.random() - 0.5) * 280
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'destroy'
      })
    }

    // Vehicles (parked cars)
    for (let i = 0; i < 10; i++) {
      objects.push({
        id: `vehicle_${i}`,
        type: 'vehicle',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          0,
          (Math.random() - 0.5) * 280
        ),
        rotation: Math.random() * Math.PI * 2,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'destroy'
      })
    }

    return objects
  }

  private generateIndustrialObjects(): EnvironmentObject[] {
    const objects: EnvironmentObject[] = []

    // Construction barriers
    for (let i = 0; i < 25; i++) {
      objects.push({
        id: `barrier_${i}`,
        type: 'construction_barrier',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 240,
          0,
          (Math.random() - 0.5) * 240
        ),
        rotation: Math.random() * Math.PI,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: true,
        hasCollision: true,
        interactable: true,
        interactionType: 'move'
      })
    }

    // Scaffolding
    for (let i = 0; i < 8; i++) {
      objects.push({
        id: `scaffolding_${i}`,
        type: 'scaffolding',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 240,
          0,
          (Math.random() - 0.5) * 240
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'climb'
      })
    }

    // Road blocks
    for (let i = 0; i < 15; i++) {
      objects.push({
        id: `road_block_${i}`,
        type: 'road_block',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 240,
          0,
          (Math.random() - 0.5) * 240
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: true,
        hasCollision: true,
        interactable: true,
        interactionType: 'move'
      })
    }

    return objects
  }

  private generateResidentialObjects(): EnvironmentObject[] {
    const objects: EnvironmentObject[] = []

    // Mailboxes
    for (let i = 0; i < 12; i++) {
      objects.push({
        id: `mailbox_${i}`,
        type: 'mailbox',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          0,
          (Math.random() - 0.5) * 180
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'use'
      })
    }

    // Bicycles
    for (let i = 0; i < 8; i++) {
      objects.push({
        id: `bicycle_${i}`,
        type: 'bicycle',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          0,
          (Math.random() - 0.5) * 180
        ),
        rotation: Math.random() * Math.PI * 2,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: true,
        isMovable: true,
        hasCollision: false,
        interactable: true,
        interactionType: 'move'
      })
    }

    // Trees and bushes
    for (let i = 0; i < 20; i++) {
      objects.push({
        id: `tree_${i}`,
        type: 'tree',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          0,
          (Math.random() - 0.5) * 180
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: false,
        isMovable: false,
        hasCollision: true,
        interactable: false,
        interactionType: 'use'
      })
    }

    for (let i = 0; i < 15; i++) {
      objects.push({
        id: `bush_${i}`,
        type: 'bush',
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          0,
          (Math.random() - 0.5) * 180
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 1, 1),
        isDestructible: false,
        isMovable: false,
        hasCollision: false,
        interactable: false,
        interactionType: 'use'
      })
    }

    return objects
  }

  private generateRooftopObjects(): EnvironmentObject[] {
    const objects: EnvironmentObject[] = []

    // Rooftop HVAC units
    for (let i = 0; i < 10; i++) {
      objects.push({
        id: `hvac_${i}`,
        type: 'construction_barrier', // Using existing type
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          80,
          (Math.random() - 0.5) * 180
        ),
        rotation: 0,
        scale: new THREE.Vector3(2, 1, 2),
        isDestructible: true,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'destroy'
      })
    }

    // Rooftop access ladders
    for (let i = 0; i < 6; i++) {
      objects.push({
        id: `ladder_${i}`,
        type: 'scaffolding', // Using existing type
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          80,
          (Math.random() - 0.5) * 180
        ),
        rotation: 0,
        scale: new THREE.Vector3(1, 2, 1),
        isDestructible: false,
        isMovable: false,
        hasCollision: true,
        interactable: true,
        interactionType: 'climb'
      })
    }

    return objects
  }

  private generateBuildingDoors(buildingType: string): DoorData[] {
    const doors: DoorData[] = []

    switch (buildingType) {
      case 'skyscraper':
        // Main entrance and service doors
        doors.push({
          position: new THREE.Vector3(0, 0, 20),
          size: new THREE.Vector3(4, 8, 0.3),
          type: 'glass',
          isOpen: false,
          isLocked: false,
          isBreakable: false,
          hasPeephole: false
        })
        doors.push({
          position: new THREE.Vector3(-15, 0, 20),
          size: new THREE.Vector3(3, 7, 0.3),
          type: 'metal',
          isOpen: false,
          isLocked: true,
          isBreakable: false,
          hasPeephole: false
        })
        break

      case 'office':
        // Office doors
        doors.push({
          position: new THREE.Vector3(0, 0, 15),
          size: new THREE.Vector3(3, 6, 0.3),
          type: 'glass',
          isOpen: false,
          isLocked: false,
          isBreakable: true,
          hasPeephole: false
        })
        break

      case 'shop':
        // Shop doors
        doors.push({
          position: new THREE.Vector3(0, 0, 15),
          size: new THREE.Vector3(3, 6, 0.3),
          type: 'glass',
          isOpen: false,
          isLocked: false,
          isBreakable: true,
          hasPeephole: false
        })
        break

      default:
        // Standard doors
        doors.push({
          position: new THREE.Vector3(0, 0, 10),
          size: new THREE.Vector3(2.5, 6, 0.3),
          type: 'wooden',
          isOpen: false,
          isLocked: false,
          isBreakable: true,
          hasPeephole: false
        })
    }

    return doors
  }

  private generateWarehouseDoors(): DoorData[] {
    return [
      {
        position: new THREE.Vector3(0, 0, 25),
        size: new THREE.Vector3(8, 10, 0.5),
        type: 'metal',
        isOpen: false,
        isLocked: false,
        isBreakable: false,
        hasPeephole: false
      },
      {
        position: new THREE.Vector3(-20, 0, 25),
        size: new THREE.Vector3(4, 7, 0.3),
        type: 'metal',
        isOpen: false,
        isLocked: true,
        isBreakable: false,
        hasPeephole: false
      }
    ]
  }

  private generateFactoryDoors(): DoorData[] {
    return [
      {
        position: new THREE.Vector3(0, 0, 30),
        size: new THREE.Vector3(10, 12, 0.5),
        type: 'metal',
        isOpen: false,
        isLocked: false,
        isBreakable: false,
        hasPeephole: false
      },
      {
        position: new THREE.Vector3(-25, 0, 30),
        size: new THREE.Vector3(3, 6, 0.3),
        type: 'metal',
        isOpen: false,
        isLocked: true,
        isBreakable: false,
        hasPeephole: false
      }
    ]
  }

  private generateApartmentDoors(): DoorData[] {
    const doors: DoorData[] = []

    // Main entrance
    doors.push({
      position: new THREE.Vector3(0, 0, 10),
      size: new THREE.Vector3(3, 6, 0.3),
      type: 'metal',
      isOpen: false,
      isLocked: true,
      isBreakable: false,
      hasPeephole: true
    })

    // Individual apartment doors would be generated per floor
    for (let floor = 0; floor < 8; floor++) {
      for (let apt = 0; apt < 4; apt++) {
        doors.push({
          position: new THREE.Vector3(
            (apt % 2 === 0 ? -8 : 8),
            floor * 3,
            (apt < 2 ? -8 : 8)
          ),
          size: new THREE.Vector3(2, 6, 0.3),
          type: 'wooden',
          isOpen: false,
          isLocked: true,
          isBreakable: true,
          hasPeephole: true
        })
      }
    }

    return doors
  }

  private generateHouseDoors(): DoorData[] {
    return [
      {
        position: new THREE.Vector3(0, 0, 6),
        size: new THREE.Vector3(2.5, 6, 0.3),
        type: 'wooden',
        isOpen: false,
        isLocked: false,
        isBreakable: true,
        hasPeephole: true
      },
      {
        position: new THREE.Vector3(0, 3, -6),
        size: new THREE.Vector3(2, 5, 0.3),
        type: 'wooden',
        isOpen: false,
        isLocked: false,
        isBreakable: true,
        hasPeephole: false
      }
    ]
  }

  private generateRooftopDoors(): DoorData[] {
    return [
      {
        position: new THREE.Vector3(0, 75, 10),
        size: new THREE.Vector3(3, 6, 0.3),
        type: 'metal',
        isOpen: false,
        isLocked: false,
        isBreakable: false,
        hasPeephole: false
      }
    ]
  }

  private generateRoomFurniture(roomType: string): FurnitureData[] {
    const furniture: FurnitureData[] = []

    switch (roomType) {
      case 'office':
        furniture.push(
          {
            id: 'desk_1',
            type: 'desk',
            position: new THREE.Vector3(-3, 0, -3),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'wood',
            physicsProperties: { mass: 20, friction: 0.8, restitution: 0.2 }
          },
          {
            id: 'chair_1',
            type: 'chair',
            position: new THREE.Vector3(-3, 0, -1),
            rotation: 0,
            isDestructible: true,
            isMovable: true,
            material: 'fabric',
            physicsProperties: { mass: 5, friction: 0.6, restitution: 0.3 }
          },
          {
            id: 'computer_1',
            type: 'computer',
            position: new THREE.Vector3(-3, 1, -3),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'plastic',
            physicsProperties: { mass: 2, friction: 0.4, restitution: 0.5 }
          }
        )
        break

      case 'living_room':
        furniture.push(
          {
            id: 'sofa_1',
            type: 'sofa',
            position: new THREE.Vector3(0, 0, 0),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'fabric',
            physicsProperties: { mass: 30, friction: 0.7, restitution: 0.3 }
          },
          {
            id: 'table_1',
            type: 'table',
            position: new THREE.Vector3(0, 0, 2),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'wood',
            physicsProperties: { mass: 15, friction: 0.8, restitution: 0.2 }
          },
          {
            id: 'tv_1',
            type: 'tv',
            position: new THREE.Vector3(0, 1.5, -3),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'plastic',
            physicsProperties: { mass: 8, friction: 0.5, restitution: 0.4 }
          }
        )
        break

      case 'bedroom':
        furniture.push(
          {
            id: 'bed_1',
            type: 'bed',
            position: new THREE.Vector3(0, 0, 0),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'fabric',
            physicsProperties: { mass: 40, friction: 0.6, restitution: 0.2 }
          },
          {
            id: 'cabinet_1',
            type: 'cabinet',
            position: new THREE.Vector3(-2, 0, -3),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'wood',
            physicsProperties: { mass: 25, friction: 0.8, restitution: 0.1 }
          }
        )
        break

      case 'kitchen':
        furniture.push(
          {
            id: 'table_2',
            type: 'table',
            position: new THREE.Vector3(0, 0, 0),
            rotation: 0,
            isDestructible: true,
            isMovable: false,
            material: 'wood',
            physicsProperties: { mass: 20, friction: 0.8, restitution: 0.2 }
          },
          {
            id: 'chair_2',
            type: 'chair',
            position: new THREE.Vector3(-1.5, 0, 1),
            rotation: Math.PI / 4,
            isDestructible: true,
            isMovable: true,
            material: 'wood',
            physicsProperties: { mass: 4, friction: 0.7, restitution: 0.3 }
          }
        )
        break
    }

    return furniture
  }

  private generateOfficeFurniture(): FurnitureData[] {
    return this.generateRoomFurniture('office')
  }

  private generateShopFurniture(): FurnitureData[] {
    return [
      {
        id: 'counter_1',
        type: 'table',
        position: new THREE.Vector3(0, 0, 0),
        rotation: 0,
        isDestructible: true,
        isMovable: false,
        material: 'wood',
        physicsProperties: { mass: 25, friction: 0.8, restitution: 0.2 }
      },
      {
        id: 'shelf_1',
        type: 'cabinet',
        position: new THREE.Vector3(-3, 0, -3),
        rotation: 0,
        isDestructible: true,
        isMovable: false,
        material: 'metal',
        physicsProperties: { mass: 30, friction: 0.7, restitution: 0.2 }
      }
    ]
  }

  private generateWarehouseFurniture(): FurnitureData[] {
    return [
      {
        id: 'pallet_1',
        type: 'table',
        position: new THREE.Vector3(-10, 0, -10),
        rotation: 0,
        isDestructible: true,
        isMovable: true,
        material: 'wood',
        physicsProperties: { mass: 15, friction: 0.8, restitution: 0.3 }
      },
      {
        id: 'shelf_warehouse_1',
        type: 'cabinet',
        position: new THREE.Vector3(10, 0, 10),
        rotation: Math.PI / 2,
        isDestructible: true,
        isMovable: false,
        material: 'metal',
        physicsProperties: { mass: 50, friction: 0.7, restitution: 0.2 }
      }
    ]
  }

  private generateFactoryMachinery(): FurnitureData[] {
    return [
      {
        id: 'machine_1',
        type: 'table',
        position: new THREE.Vector3(0, 0, 0),
        rotation: 0,
        isDestructible: true,
        isMovable: false,
        material: 'metal',
        physicsProperties: { mass: 200, friction: 0.6, restitution: 0.2 }
      },
      {
        id: 'conveyor_1',
        type: 'table',
        position: new THREE.Vector3(5, 0, 0),
        rotation: Math.PI / 2,
        isDestructible: true,
        isMovable: false,
        material: 'metal',
        physicsProperties: { mass: 150, friction: 0.5, restitution: 0.3 }
      }
    ]
  }

  private generateApartmentFurniture(roomType: string): FurnitureData[] {
    return this.generateRoomFurniture(roomType)
  }

  private generateHouseFurniture(roomType: string): FurnitureData[] {
    return this.generateRoomFurniture(roomType)
  }

  private generateRooftopAccessFurniture(): FurnitureData[] {
    return [
      {
        id: 'stairs_rooftop',
        type: 'table',
        position: new THREE.Vector3(0, 0, 0),
        rotation: 0,
        isDestructible: false,
        isMovable: false,
        material: 'metal',
        physicsProperties: { mass: 100, friction: 0.8, restitution: 0.1 }
      }
    ]
  }

  private generateRoomLighting(): RoomLighting {
    return {
      ambientIntensity: 0.3,
      pointLights: [
        {
          position: new THREE.Vector3(0, 3, 0),
          color: new THREE.Color(0xffffff),
          intensity: 0.8,
          distance: 8,
          decay: 2
        }
      ],
      hasCeilingLight: true,
      hasDeskLamp: Math.random() > 0.5
    }
  }

  private generateOfficeLighting(): RoomLighting {
    return {
      ambientIntensity: 0.4,
      pointLights: [
        {
          position: new THREE.Vector3(0, 3.5, 0),
          color: new THREE.Color(0xffffff),
          intensity: 1.0,
          distance: 10,
          decay: 2
        }
      ],
      hasCeilingLight: true,
      hasDeskLamp: true
    }
  }

  private generateShopLighting(): RoomLighting {
    return {
      ambientIntensity: 0.5,
      pointLights: [
        {
          position: new THREE.Vector3(0, 3.8, 0),
          color: new THREE.Color(0xffffff),
          intensity: 1.2,
          distance: 12,
          decay: 1.5
        }
      ],
      hasCeilingLight: true,
      hasDeskLamp: false
    }
  }

  private generateWarehouseLighting(): RoomLighting {
    return {
      ambientIntensity: 0.2,
      pointLights: [
        {
          position: new THREE.Vector3(0, 10, 0),
          color: new THREE.Color(0xffffcc),
          intensity: 0.6,
          distance: 20,
          decay: 2
        }
      ],
      hasCeilingLight: true,
      hasDeskLamp: false
    }
  }

  private generateFactoryLighting(): RoomLighting {
    return {
      ambientIntensity: 0.25,
      pointLights: [
        {
          position: new THREE.Vector3(0, 12, 0),
          color: new THREE.Color(0xffffff),
          intensity: 0.8,
          distance: 25,
          decay: 2
        }
      ],
      hasCeilingLight: true,
      hasDeskLamp: false
    }
  }

  private generateApartmentLighting(roomType: string): RoomLighting {
    return this.generateRoomLighting()
  }

  private generateHouseLighting(roomType: string): RoomLighting {
    return {
      ambientIntensity: 0.35,
      pointLights: [
        {
          position: new THREE.Vector3(0, 2.8, 0),
          color: new THREE.Color(0xffffff),
          intensity: 0.9,
          distance: 8,
          decay: 2
        }
      ],
      hasCeilingLight: true,
      hasDeskLamp: roomType === 'bedroom' || roomType === 'office'
    }
  }

  private generateRooftopLighting(): RoomLighting {
    return {
      ambientIntensity: 0.1,
      pointLights: [
        {
          position: new THREE.Vector3(0, 2, 0),
          color: new THREE.Color(0xffffff),
          intensity: 0.5,
          distance: 6,
          decay: 2
        }
      ],
      hasCeilingLight: true,
      hasDeskLamp: false
    }
  }

  private getUrbanLightingPreset(): LightingPreset {
    return {
      id: 'urban_lighting',
      name: 'Urban Combat Lighting',
      ambientLight: {
        color: new THREE.Color(0x404050),
        intensity: 0.3
      },
      directionalLight: {
        color: new THREE.Color(0xffffff),
        intensity: 1.0,
        position: new THREE.Vector3(50, 100, 50),
        castShadow: true,
        shadowMapSize: 2048
      },
      pointLights: this.generateStreetLights(),
      spotLights: this.generateSpotLights(),
      fog: {
        color: new THREE.Color(0x888888),
        near: 50,
        far: 300,
        density: 0.01
      },
      postProcessing: this.getCinematicPostProcessing()
    }
  }

  private getIndustrialLightingPreset(): LightingPreset {
    return {
      id: 'industrial_lighting',
      name: 'Industrial Complex Lighting',
      ambientLight: {
        color: new THREE.Color(0x303040),
        intensity: 0.25
      },
      directionalLight: {
        color: new THREE.Color(0xffffff),
        intensity: 0.8,
        position: new THREE.Vector3(50, 100, 50),
        castShadow: true,
        shadowMapSize: 2048
      },
      pointLights: this.generateIndustrialLights(),
      spotLights: this.generateSecurityLights(),
      fog: {
        color: new THREE.Color(0x666666),
        near: 40,
        far: 250,
        density: 0.015
      },
      postProcessing: this.getIndustrialPostProcessing()
    }
  }

  private getResidentialLightingPreset(): LightingPreset {
    return {
      id: 'residential_lighting',
      name: 'Residential Area Lighting',
      ambientLight: {
        color: new THREE.Color(0x505060),
        intensity: 0.35
      },
      directionalLight: {
        color: new THREE.Color(0xffffff),
        intensity: 1.1,
        position: new THREE.Vector3(50, 100, 50),
        castShadow: true,
        shadowMapSize: 2048
      },
      pointLights: this.generateResidentialLights(),
      spotLights: [],
      fog: {
        color: new THREE.Color(0xaaaaaa),
        near: 60,
        far: 350,
        density: 0.008
      },
      postProcessing: this.getWarmPostProcessing()
    }
  }

  private getRooftopLightingPreset(): LightingPreset {
    return {
      id: 'rooftop_lighting',
      name: 'Rooftop Combat Lighting',
      ambientLight: {
        color: new THREE.Color(0x606070),
        intensity: 0.4
      },
      directionalLight: {
        color: new THREE.Color(0xffffff),
        intensity: 1.2,
        position: new THREE.Vector3(50, 100, 50),
        castShadow: true,
        shadowMapSize: 2048
      },
      pointLights: this.generateRooftopLights(),
      spotLights: this.generateHelipadLights(),
      fog: {
        color: new THREE.Color(0x9999aa),
        near: 80,
        far: 400,
        density: 0.005
      },
      postProcessing: this.getAtmosphericPostProcessing()
    }
  }

  private generateStreetLights(): PointLightData[] {
    const lights: PointLightData[] = []

    for (let i = 0; i < 30; i++) {
      lights.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          8,
          (Math.random() - 0.5) * 280
        ),
        color: new THREE.Color(0xffcc88),
        intensity: 0.8,
        distance: 15,
        decay: 2,
        isAnimated: false,
        animationType: 'flicker'
      })
    }

    return lights
  }

  private generateSpotLights(): SpotLightData[] {
    const spotlights: SpotLightData[] = []

    for (let i = 0; i < 10; i++) {
      spotlights.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          20,
          (Math.random() - 0.5) * 280
        ),
        target: new THREE.Vector3(
          (Math.random() - 0.5) * 280,
          0,
          (Math.random() - 0.5) * 280
        ),
        color: new THREE.Color(0xffffff),
        intensity: 0.6,
        angle: Math.PI / 6,
        penumbra: 0.2,
        distance: 30,
        decay: 2,
        isAnimated: false,
        animationType: 'scan'
      })
    }

    return spotlights
  }

  private generateIndustrialLights(): PointLightData[] {
    const lights: PointLightData[] = []

    for (let i = 0; i < 20; i++) {
      lights.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 240,
          12,
          (Math.random() - 0.5) * 240
        ),
        color: new THREE.Color(0xccffcc),
        intensity: 0.6,
        distance: 20,
        decay: 2,
        isAnimated: true,
        animationType: 'flicker'
      })
    }

    return lights
  }

  private generateSecurityLights(): SpotLightData[] {
    const spotlights: SpotLightData[] = []

    for (let i = 0; i < 15; i++) {
      spotlights.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 240,
          15,
          (Math.random() - 0.5) * 240
        ),
        target: new THREE.Vector3(
          (Math.random() - 0.5) * 240,
          0,
          (Math.random() - 0.5) * 240
        ),
        color: new THREE.Color(0xffffff),
        intensity: 0.8,
        angle: Math.PI / 8,
        penumbra: 0.1,
        distance: 40,
        decay: 2,
        isAnimated: true,
        animationType: 'scan'
      })
    }

    return spotlights
  }

  private generateResidentialLights(): PointLightData[] {
    const lights: PointLightData[] = []

    for (let i = 0; i < 25; i++) {
      lights.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          6,
          (Math.random() - 0.5) * 180
        ),
        color: new THREE.Color(0xffddaa),
        intensity: 0.7,
        distance: 12,
        decay: 2,
        isAnimated: false,
        animationType: 'flicker'
      })
    }

    return lights
  }

  private generateRooftopLights(): PointLightData[] {
    const lights: PointLightData[] = []

    for (let i = 0; i < 15; i++) {
      lights.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          85,
          (Math.random() - 0.5) * 180
        ),
        color: new THREE.Color(0xffffff),
        intensity: 0.9,
        distance: 18,
        decay: 2,
        isAnimated: false,
        animationType: 'pulse'
      })
    }

    return lights
  }

  private generateHelipadLights(): SpotLightData[] {
    const spotlights: SpotLightData[] = []

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2
      spotlights.push({
        position: new THREE.Vector3(
          Math.cos(angle) * 10,
          85,
          Math.sin(angle) * 10
        ),
        target: new THREE.Vector3(0, 80, 0),
        color: new THREE.Color(0x00ff00),
        intensity: 1.0,
        angle: Math.PI / 4,
        penumbra: 0.3,
        distance: 25,
        decay: 2,
        isAnimated: true,
        animationType: 'alert'
      })
    }

    return spotlights
  }

  private getCinematicPostProcessing(): PostProcessingSettings {
    return {
      bloom: {
        enabled: true,
        strength: 0.3,
        radius: 1.0,
        threshold: 0.85
      },
      colorCorrection: {
        enabled: true,
        contrast: 1.1,
        brightness: 0.95,
        saturation: 1.0,
        hue: 0
      },
      ambientOcclusion: {
        enabled: true,
        intensity: 0.8,
        radius: 4,
        bias: 0.001
      },
      depthOfField: {
        enabled: true,
        focusDistance: 50,
        focusRange: 20,
        bokehStrength: 0.6
      },
      motionBlur: {
        enabled: true,
        strength: 0.3
      },
      filmGrain: {
        enabled: true,
        intensity: 0.15
      }
    }
  }

  private getIndustrialPostProcessing(): PostProcessingSettings {
    return {
      bloom: {
        enabled: true,
        strength: 0.2,
        radius: 0.8,
        threshold: 0.8
      },
      colorCorrection: {
        enabled: true,
        contrast: 1.2,
        brightness: 0.9,
        saturation: 0.8,
        hue: -0.1
      },
      ambientOcclusion: {
        enabled: true,
        intensity: 1.0,
        radius: 5,
        bias: 0.001
      },
      depthOfField: {
        enabled: false,
        focusDistance: 50,
        focusRange: 20,
        bokehStrength: 0.4
      },
      motionBlur: {
        enabled: false,
        strength: 0.2
      },
      filmGrain: {
        enabled: true,
        intensity: 0.2
      }
    }
  }

  private getWarmPostProcessing(): PostProcessingSettings {
    return {
      bloom: {
        enabled: true,
        strength: 0.25,
        radius: 1.2,
        threshold: 0.9
      },
      colorCorrection: {
        enabled: true,
        contrast: 1.05,
        brightness: 1.0,
        saturation: 1.1,
        hue: 0.05
      },
      ambientOcclusion: {
        enabled: true,
        intensity: 0.6,
        radius: 3,
        bias: 0.001
      },
      depthOfField: {
        enabled: true,
        focusDistance: 40,
        focusRange: 15,
        bokehStrength: 0.4
      },
      motionBlur: {
        enabled: true,
        strength: 0.25
      },
      filmGrain: {
        enabled: false,
        intensity: 0.1
      }
    }
  }

  private getAtmosphericPostProcessing(): PostProcessingSettings {
    return {
      bloom: {
        enabled: true,
        strength: 0.35,
        radius: 1.5,
        threshold: 0.88
      },
      colorCorrection: {
        enabled: true,
        contrast: 1.15,
        brightness: 1.05,
        saturation: 1.05,
        hue: 0.02
      },
      ambientOcclusion: {
        enabled: true,
        intensity: 0.7,
        radius: 6,
        bias: 0.001
      },
      depthOfField: {
        enabled: true,
        focusDistance: 80,
        focusRange: 30,
        bokehStrength: 0.8
      },
      motionBlur: {
        enabled: true,
        strength: 0.4
      },
      filmGrain: {
        enabled: false,
        intensity: 0.08
      }
    }
  }

  private createWeatherZone(zoneType: string): WeatherZone {
    const types: WeatherZone['type'][] = ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy', 'sandy']
    const weatherType = types[Math.floor(Math.random() * types.length)]

    return {
      id: `weather_${zoneType}`,
      type: weatherType,
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(500, 200, 500),
      intensity: Math.random() * 0.7 + 0.3,
      particleSystem: new THREE.Points(),
      particleCount: 1000,
      windDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
      windStrength: Math.random() * 5 + 2,
      effects: this.generateWeatherEffects(weatherType),
      audioLoop: this.getWeatherAudioLoop(weatherType)
    }
  }

  private generateWeatherEffects(weatherType: WeatherZone['type']): WeatherEffect[] {
    const effects: WeatherEffect[] = []

    switch (weatherType) {
      case 'rainy':
        effects.push({
          type: 'rain',
          intensity: 0.7,
          particles: new THREE.Points(),
          material: new THREE.PointsMaterial(),
          animationParams: {
            speed: 15,
            direction: new THREE.Vector3(0, -1, 0.2),
            turbulence: 0.1,
            lifetime: 2
          }
        })
        break

      case 'stormy':
        effects.push(
          {
            type: 'rain',
            intensity: 1.0,
            particles: new THREE.Points(),
            material: new THREE.PointsMaterial(),
            animationParams: {
              speed: 25,
              direction: new THREE.Vector3(0.3, -1, 0.4),
              turbulence: 0.3,
              lifetime: 1.5
            }
          },
          {
            type: 'lightning',
            intensity: 0.8,
            particles: new THREE.Points(),
            material: new THREE.PointsMaterial(),
            animationParams: {
              speed: 100,
              direction: new THREE.Vector3(0, -1, 0),
              turbulence: 0,
              lifetime: 0.2
            }
          },
          {
            type: 'wind',
            intensity: 0.9,
            particles: new THREE.Points(),
            material: new THREE.PointsMaterial(),
            animationParams: {
              speed: 30,
              direction: new THREE.Vector3(1, 0, 0.5),
              turbulence: 0.5,
              lifetime: 5
            }
          }
        )
        break

      case 'foggy':
        effects.push({
          type: 'fog',
          intensity: 0.8,
          particles: new THREE.Points(),
          material: new THREE.PointsMaterial(),
          animationParams: {
            speed: 2,
            direction: new THREE.Vector3(0.2, 0, 0.1),
            turbulence: 0.2,
            lifetime: 10
          }
        })
        break

      case 'cloudy':
        effects.push({
          type: 'wind',
          intensity: 0.4,
          particles: new THREE.Points(),
          material: new THREE.PointsMaterial(),
          animationParams: {
            speed: 8,
            direction: new THREE.Vector3(0.5, 0, 0.2),
            turbulence: 0.3,
            lifetime: 8
          }
        })
        break
    }

    return effects
  }

  private getWeatherAudioLoop(weatherType: WeatherZone['type']): string {
    switch (weatherType) {
      case 'rainy':
        return '/audio/weather/rain.mp3'
      case 'stormy':
        return '/audio/weather/storm.mp3'
      case 'cloudy':
        return '/audio/weather/wind.mp3'
      case 'snowy':
        return '/audio/weather/snow.mp3'
      case 'sandy':
        return '/audio/weather/wind.mp3'
      default:
        return ''
    }
  }

  private setupZoneTransitions(): void {
    // Define transition zones between different areas
    // This would handle seamless transitions when players move between zones
  }

  private initializeWeatherSystems(): void {
    // Initialize weather systems for all zones
    this.weatherZones.forEach((zone) => {
      this.setupWeatherSystem(zone)
    })
  }

  private setupWeatherSystem(zone: WeatherZone): void {
    // Create particle systems and animations for weather effects
    zone.effects.forEach((effect) => {
      this.createWeatherParticles(effect)
    })
  }

  private createWeatherParticles(effect: WeatherEffect): void {
    // Create particle geometry and materials for weather effects
    const particleCount = 500
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200

      velocities[i * 3] = effect.animationParams.direction.x * effect.animationParams.speed
      velocities[i * 3 + 1] = effect.animationParams.direction.y * effect.animationParams.speed
      velocities[i * 3 + 2] = effect.animationParams.direction.z * effect.animationParams.speed
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    const material = new THREE.PointsMaterial({
      color: effect.type === 'rain' ? 0x88ccff : 0xffffff,
      size: effect.type === 'rain' ? 0.1 : 1,
      transparent: true,
      opacity: effect.type === 'fog' ? 0.3 : 0.6,
      blending: THREE.AdditiveBlending
    })

    effect.particles = new THREE.Points(geometry, material)
    this.scene.add(effect.particles)
  }

  private initializeAudioZones(): void {
    // Create audio zones for different environments
    const urbanAudio = this.createUrbanAudioZone()
    this.audioZones.set('urban_audio', urbanAudio)

    const industrialAudio = this.createIndustrialAudioZone()
    this.audioZones.set('industrial_audio', industrialAudio)

    const residentialAudio = this.createResidentialAudioZone()
    this.audioZones.set('residential_audio', residentialAudio)

    const rooftopAudio = this.createRooftopAudioZone()
    this.audioZones.set('rooftop_audio', rooftopAudio)
  }

  private createUrbanAudioZone(): AudioZone {
    return {
      id: 'urban_audio',
      type: 'street',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(300, 50, 300),
      ambientSounds: this.generateUrbanAmbientSounds(),
      reverbPreset: {
        name: 'urban_street',
        decayTime: 2.5,
        earlyDelay: 0.02,
        lateDelay: 0.03,
        roomSize: 0.8,
        damping: 0.7,
        wetLevel: 0.3,
        dryLevel: 0.7
      },
      volume: 0.7,
      transitionZones: []
    }
  }

  private createIndustrialAudioZone(): AudioZone {
    return {
      id: 'industrial_audio',
      type: 'industrial',
      position: new THREE.Vector3(200, 0, 0),
      size: new THREE.Vector3(250, 50, 250),
      ambientSounds: this.generateIndustrialAmbientSounds(),
      reverbPreset: {
        name: 'industrial_hall',
        decayTime: 4.0,
        earlyDelay: 0.03,
        lateDelay: 0.05,
        roomSize: 1.2,
        damping: 0.6,
        wetLevel: 0.4,
        dryLevel: 0.6
      },
      volume: 0.8,
      transitionZones: []
    }
  }

  private createResidentialAudioZone(): AudioZone {
    return {
      id: 'residential_audio',
      type: 'interior',
      position: new THREE.Vector3(-200, 0, 0),
      size: new THREE.Vector3(200, 30, 200),
      ambientSounds: this.generateResidentialAmbientSounds(),
      reverbPreset: {
        name: 'residential_room',
        decayTime: 1.8,
        earlyDelay: 0.015,
        lateDelay: 0.02,
        roomSize: 0.4,
        damping: 0.8,
        wetLevel: 0.2,
        dryLevel: 0.8
      },
      volume: 0.6,
      transitionZones: []
    }
  }

  private createRooftopAudioZone(): AudioZone {
    return {
      id: 'rooftop_audio',
      type: 'rooftop',
      position: new THREE.Vector3(0, 0, 200),
      size: new THREE.Vector3(200, 30, 200),
      ambientSounds: this.generateRooftopAmbientSounds(),
      reverbPreset: {
        name: 'rooftop_open',
        decayTime: 3.5,
        earlyDelay: 0.04,
        lateDelay: 0.06,
        roomSize: 1.5,
        damping: 0.5,
        wetLevel: 0.5,
        dryLevel: 0.5
      },
      volume: 0.5,
      transitionZones: []
    }
  }

  private generateUrbanAmbientSounds(): AudioAsset[] {
    const sounds: AudioAsset[] = []

    const soundTypes = [
      { name: 'traffic', category: 'traffic' as const, volume: 0.4 },
      { name: 'crowd', category: 'crowd' as const, volume: 0.3 },
      { name: 'sirens', category: 'ambient' as const, volume: 0.2 },
      { name: 'city_hum', category: 'ambient' as const, volume: 0.5 }
    ]

    soundTypes.forEach((type) => {
      const audio = new Audio()
      audio.src = `/audio/ambient/${type.name}.mp3`
      audio.loop = true
      audio.volume = type.volume

      sounds.push({
        id: `urban_${type.name}`,
        name: type.name,
        audio,
        volume: type.volume,
        pitch: 1.0,
        loop: true,
        fadeInTime: 2.0,
        fadeOutTime: 2.0,
        category: type.category
      })
    })

    return sounds
  }

  private generateIndustrialAmbientSounds(): AudioAsset[] {
    const sounds: AudioAsset[] = []

    const soundTypes = [
      { name: 'machinery', category: 'indoor' as const, volume: 0.6 },
      { name: 'factory_hum', category: 'indoor' as const, volume: 0.5 },
      { name: 'metal_clank', category: 'indoor' as const, volume: 0.3 },
      { name: 'construction', category: 'ambient' as const, volume: 0.4 }
    ]

    soundTypes.forEach((type) => {
      const audio = new Audio()
      audio.src = `/audio/ambient/${type.name}.mp3`
      audio.loop = true
      audio.volume = type.volume

      sounds.push({
        id: `industrial_${type.name}`,
        name: type.name,
        audio,
        volume: type.volume,
        pitch: 1.0,
        loop: true,
        fadeInTime: 2.0,
        fadeOutTime: 2.0,
        category: type.category
      })
    })

    return sounds
  }

  private generateResidentialAmbientSounds(): AudioAsset[] {
    const sounds: AudioAsset[] = []

    const soundTypes = [
      { name: 'home_ambience', category: 'indoor' as const, volume: 0.4 },
      { name: 'birds', category: 'nature' as const, volume: 0.3 },
      { name: 'wind_gentle', category: 'weather' as const, volume: 0.2 },
      { name: 'distant_traffic', category: 'traffic' as const, volume: 0.2 }
    ]

    soundTypes.forEach((type) => {
      const audio = new Audio()
      audio.src = `/audio/ambient/${type.name}.mp3`
      audio.loop = true
      audio.volume = type.volume

      sounds.push({
        id: `residential_${type.name}`,
        name: type.name,
        audio,
        volume: type.volume,
        pitch: 1.0,
        loop: true,
        fadeInTime: 2.0,
        fadeOutTime: 2.0,
        category: type.category
      })
    })

    return sounds
  }

  private generateRooftopAmbientSounds(): AudioAsset[] {
    const sounds: AudioAsset[] = []

    const soundTypes = [
      { name: 'wind_rooftop', category: 'weather' as const, volume: 0.5 },
      { name: 'city_distant', category: 'ambient' as const, volume: 0.3 },
      { name: 'helicopter', category: 'ambient' as const, volume: 0.2 },
      { name: 'hvac_units', category: 'indoor' as const, volume: 0.4 }
    ]

    soundTypes.forEach((type) => {
      const audio = new Audio()
      audio.src = `/audio/ambient/${type.name}.mp3`
      audio.loop = true
      audio.volume = type.volume

      sounds.push({
        id: `rooftop_${type.name}`,
        name: type.name,
        audio,
        volume: type.volume,
        pitch: 1.0,
        loop: true,
        fadeInTime: 2.0,
        fadeOutTime: 2.0,
        category: type.category
      })
    })

    return sounds
  }

  private generatePathfindingNetwork(): void {
    // Generate navigation mesh and waypoints for AI pathfinding
    const waypoints: Waypoint[] = []

    // Generate waypoints for urban zone
    for (let x = -140; x <= 140; x += 20) {
      for (let z = -140; z <= 140; z += 20) {
        waypoints.push({
          id: `waypoint_${x}_${z}`,
          position: new THREE.Vector3(x, 0, z),
          connections: [],
          isCover: Math.random() > 0.7,
          isCrouchable: false,
          isVaultable: Math.random() > 0.9,
          priority: Math.floor(Math.random() * 10)
        })
      }
    }

    // Connect waypoints
    waypoints.forEach((waypoint) => {
      waypoints.forEach((other) => {
        if (waypoint.id !== other.id) {
          const distance = waypoint.position.distanceTo(other.position)
          if (distance < 30) {
            waypoint.connections.push(other.id)
          }
        }
      })
    })

    this.pathfindingSystem.waypoints = waypoints
  }

  private populateEnvironmentDetails(): void {
    // Add detailed objects and decorations throughout the environment
    this.populateUrbanDetails()
    this.populateIndustrialDetails()
    this.populateResidentialDetails()
    this.populateRooftopDetails()
  }

  private populateUrbanDetails(): void {
    const urbanZone = this.zones.get('urban_combat')
    if (!urbanZone) return

    // Add graffiti, posters, trash, debris, signs, etc.
    const details = [
      { type: 'poster', count: 15 },
      { type: 'graffiti', count: 25 },
      { type: 'trash', count: 30 },
      { type: 'debris', count: 20 },
      { type: 'sign', count: 12 }
    ]

    details.forEach((detail) => {
      for (let i = 0; i < detail.count; i++) {
        const object: EnvironmentObject = {
          id: `${detail.type}_${i}`,
          type: detail.type as EnvironmentObject['type'],
          position: new THREE.Vector3(
            (Math.random() - 0.5) * urbanZone.size.x,
            Math.random() * 10,
            (Math.random() - 0.5) * urbanZone.size.z
          ),
          rotation: Math.random() * Math.PI * 2,
          scale: new THREE.Vector3(1, 1, 1),
          isDestructible: true,
          isMovable: detail.type === 'trash' || detail.type === 'debris',
          hasCollision: detail.type !== 'poster' && detail.type !== 'graffiti',
          interactable: false,
          interactionType: 'destroy'
        }

        urbanZone.environmentObjects.push(object)
        this.objects.set(object.id, object)
      }
    })
  }

  private populateIndustrialDetails(): void {
    const industrialZone = this.zones.get('industrial_complex')
    if (!industrialZone) return

    // Add industrial debris, tools, equipment, warning signs
    const details = [
      { type: 'tool', count: 20 },
      { type: 'equipment', count: 15 },
      { type: 'warning_sign', count: 18 },
      { type: 'industrial_debris', count: 35 },
      { type: 'spill', count: 12 }
    ]

    details.forEach((detail) => {
      for (let i = 0; i < detail.count; i++) {
        const object: EnvironmentObject = {
          id: `industrial_${detail.type}_${i}`,
          type: detail.type as EnvironmentObject['type'],
          position: new THREE.Vector3(
            (Math.random() - 0.5) * industrialZone.size.x,
            Math.random() * 5,
            (Math.random() - 0.5) * industrialZone.size.z
          ),
          rotation: Math.random() * Math.PI * 2,
          scale: new THREE.Vector3(1, 1, 1),
          isDestructible: true,
          isMovable: detail.type === 'tool' || detail.type === 'industrial_debris',
          hasCollision: detail.type !== 'spill',
          interactable: false,
          interactionType: 'destroy'
        }

        industrialZone.environmentObjects.push(object)
        this.objects.set(object.id, object)
      }
    })
  }

  private populateResidentialDetails(): void {
    const residentialZone = this.zones.get('residential_area')
    if (!residentialZone) return

    // Add residential details like potted plants, decorations, etc.
    const details = [
      { type: 'plant', count: 25 },
      { type: 'decoration', count: 20 },
      { type: 'outdoor_furniture', count: 15 },
      { type: 'garden_item', count: 18 },
      { type: 'personal_item', count: 30 }
    ]

    details.forEach((detail) => {
      for (let i = 0; i < detail.count; i++) {
        const object: EnvironmentObject = {
          id: `residential_${detail.type}_${i}`,
          type: detail.type as EnvironmentObject['type'],
          position: new THREE.Vector3(
            (Math.random() - 0.5) * residentialZone.size.x,
            Math.random() * 3,
            (Math.random() - 0.5) * residentialZone.size.z
          ),
          rotation: Math.random() * Math.PI * 2,
          scale: new THREE.Vector3(1, 1, 1),
          isDestructible: true,
          isMovable: detail.type !== 'plant',
          hasCollision: detail.type === 'outdoor_furniture',
          interactable: false,
          interactionType: 'destroy'
        }

        residentialZone.environmentObjects.push(object)
        this.objects.set(object.id, object)
      }
    })
  }

  private populateRooftopDetails(): void {
    const rooftopZone = this.zones.get('rooftop_combat')
    if (!rooftopZone) return

    // Add rooftop details like HVAC equipment, antennas, etc.
    const details = [
      { type: 'hvac_equipment', count: 12 },
      { type: 'antenna', count: 8 },
      { type: 'rooftop_furniture', count: 6 },
      { type: 'solar_panel', count: 15 },
      { type: 'maintenance_equipment', count: 10 }
    ]

    details.forEach((detail) => {
      for (let i = 0; i < detail.count; i++) {
        const object: EnvironmentObject = {
          id: `rooftop_${detail.type}_${i}`,
          type: detail.type as EnvironmentObject['type'],
          position: new THREE.Vector3(
            (Math.random() - 0.5) * rooftopZone.size.x,
            rooftopZone.position.y + Math.random() * 5,
            (Math.random() - 0.5) * rooftopZone.size.z
          ),
          rotation: Math.random() * Math.PI * 2,
          scale: new THREE.Vector3(1, 1, 1),
          isDestructible: detail.type !== 'solar_panel',
          isMovable: false,
          hasCollision: true,
          interactable: false,
          interactionType: 'destroy'
        }

        rooftopZone.environmentObjects.push(object)
        this.objects.set(object.id, object)
      }
    })
  }

  private setupEventListeners(): void {
    // Setup event listeners for zone changes, weather updates, etc.
  }

  public addZone(zone: EnvironmentZone): void {
    this.zones.set(zone.id, zone)

    // Add buildings to buildings map
    zone.buildings.forEach((building) => {
      this.buildings.set(building.id, building)
    })

    // Add objects to objects map
    zone.environmentObjects.forEach((object) => {
      this.objects.set(object.id, object)
    })

    // Initialize zone systems
    this.lightingManager.initializeZone(zone)
    this.physicsEngine.initializeZone(zone)

    if (zone.weatherZone) {
      this.weatherZones.set(zone.weatherZone.id, zone.weatherZone)
    }
  }

  public update(deltaTime: number): void {
    // Update all environment systems
    this.lightingManager.update(deltaTime)
    this.physicsEngine.update(deltaTime)
    this.audioManager.update(deltaTime)
    this.lodManager.update(deltaTime)

    // Update weather effects
    this.weatherZones.forEach((zone) => {
      this.updateWeatherZone(zone, deltaTime)
    })

    // Update foliage
    if (this.settings.enableFoliage) {
      this.foliageSystem.update(deltaTime)
    }

    // Check zone transitions
    this.checkZoneTransitions()
  }

  private updateWeatherZone(zone: WeatherZone, deltaTime: number): void {
    zone.effects.forEach((effect) => {
      if (effect.particles && effect.particles.geometry) {
        const positions = effect.particles.geometry.attributes.position.array as Float32Array
        const velocities = effect.particles.geometry.attributes.velocity.array as Float32Array

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * deltaTime
          positions[i + 1] += velocities[i + 1] * deltaTime
          positions[i + 2] += velocities[i + 2] * deltaTime

          // Add turbulence
          positions[i] += (Math.random() - 0.5) * effect.animationParams.turbulence * deltaTime
          positions[i + 2] += (Math.random() - 0.5) * effect.animationParams.turbulence * deltaTime

          // Reset particles that go out of bounds
          if (positions[i + 1] < 0) {
            positions[i] = (Math.random() - 0.5) * zone.size.x
            positions[i + 1] = Math.random() * zone.size.y
            positions[i + 2] = (Math.random() - 0.5) * zone.size.z
          }
        }

        effect.particles.geometry.attributes.position.needsUpdate = true
      }
    })
  }

  private checkZoneTransitions(): void {
    // Check if player has moved to a different zone and trigger transitions
    const playerPosition = new THREE.Vector3() // This should come from player object

    let newZone: string | null = null

    this.zones.forEach((zone) => {
      const distance = playerPosition.distanceTo(zone.position)
      if (distance < zone.size.x / 2) {
        newZone = zone.id
      }
    })

    if (newZone && newZone !== this.currentZone) {
      this.previousZone = this.currentZone
      this.currentZone = newZone
      this.handleZoneChange(newZone)
    }
  }

  private handleZoneChange(newZone: string): void {
    // Handle zone change logic
    this.lightingManager.transitionToZone(newZone)
    this.audioManager.transitionToZone(newZone)

    // Notify callbacks
    this.onZoneChangeCallbacks.forEach((callback) => {
      callback(newZone)
    })
  }

  public destroyWindow(windowId: string): void {
    // Handle window destruction with particles and sound
    const particleCount = 50
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2

      velocities[i * 3] = (Math.random() - 0.5) * 10
      velocities[i * 3 + 1] = Math.random() * 5
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 10
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    const material = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    })

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)

    // Play glass breaking sound
    this.audioManager.playSound('glass_break', particles.position)

    // Remove particles after animation
    setTimeout(() => {
      this.scene.remove(particles)
    }, 2000)
  }

  public destroyObject(objectId: string): void {
    const object = this.objects.get(objectId)
    if (!object || !object.isDestructible) return

    // Create destruction particles
    this.createDestructionParticles(object)

    // Play destruction sound
    this.audioManager.playSound('destruction', object.position)

    // Remove object from scene
    if (object.mesh) {
      this.scene.remove(object.mesh)
    }

    // Remove from objects map
    this.objects.delete(objectId)
  }

  private createDestructionParticles(object: EnvironmentObject): void {
    const particleCount = 30
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = object.position.x + (Math.random() - 0.5) * object.scale.x
      positions[i * 3 + 1] = object.position.y + (Math.random() - 0.5) * object.scale.y
      positions[i * 3 + 2] = object.position.z + (Math.random() - 0.5) * object.scale.z

      velocities[i * 3] = (Math.random() - 0.5) * 8
      velocities[i * 3 + 1] = Math.random() * 6
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 8
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    const material = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.2,
      transparent: true,
      opacity: 0.7
    })

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)

    // Remove particles after animation
    setTimeout(() => {
      this.scene.remove(particles)
    }, 3000)
  }

  public onZoneChange(callback: (zone: string) => void): void {
    this.onZoneChangeCallbacks.push(callback)
  }

  public onWeatherChange(callback: (weather: WeatherZone) => void): void {
    this.onWeatherChangeCallbacks.push(callback)
  }

  public getCurrentZone(): EnvironmentZone | null {
    return this.currentZone ? this.zones.get(this.currentZone) || null : null
  }

  public getZone(id: string): EnvironmentZone | null {
    return this.zones.get(id) || null
  }

  public getBuilding(id: string): BuildingData | null {
    return this.buildings.get(id) || null
  }

  public getObject(id: string): EnvironmentObject | null {
    return this.objects.get(id) || null
  }

  public setQuality(quality: EnvironmentSettings['quality']): void {
    this.settings.quality = quality
    this.lodManager.updateQuality(quality)
    this.lightingManager.updateQuality(quality)
    this.physicsEngine.updateQuality(quality)
  }

  public setWeatherIntensity(intensity: number): void {
    this.weatherIntensity = intensity
    this.weatherZones.forEach((zone) => {
      zone.intensity = intensity
      zone.effects.forEach((effect) => {
        effect.intensity = intensity
      })
    })
  }

  public setTimeOfDay(time: number): void {
    this.timeOfDay = time
    this.lightingManager.setTimeOfDay(time)
  }

  public setSeason(season: 'spring' | 'summer' | 'autumn' | 'winter'): void {
    this.season = season
    this.foliageSystem.setSeason(season)
  }

  public dispose(): void {
    // Clean up all resources
    this.zones.clear()
    this.buildings.clear()
    this.objects.clear()
    this.audioZones.clear()
    this.weatherZones.clear()

    this.lightingManager.dispose()
    this.physicsEngine.dispose()
    this.audioManager.dispose()
    this.lodManager.dispose()
    this.foliageSystem.dispose()
  }
}

class LightingManager {
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private currentLightingPreset: LightingPreset | null = null
  private ambientLight: THREE.AmbientLight | null = null
  private directionalLight: THREE.DirectionalLight | null = null
  private pointLights: Map<string, THREE.PointLight> = new Map()
  private spotLights: Map<string, THREE.SpotLight> = new Map()

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.renderer = renderer
  }

  public initializeZone(zone: EnvironmentZone): void {
    this.applyLightingPreset(zone.lightingPreset)
  }

  public initializeZoneLighting(zones: EnvironmentZone[]): void {
    zones.forEach((zone) => {
      this.initializeZone(zone)
    })
  }

  public applyLightingPreset(preset: LightingPreset): void {
    // Remove existing lights
    this.clearLights()

    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(preset.ambientLight.color, preset.ambientLight.intensity)
    this.scene.add(this.ambientLight)

    // Create directional light
    this.directionalLight = new THREE.DirectionalLight(
      preset.directionalLight.color,
      preset.directionalLight.intensity
    )
    this.directionalLight.position.copy(preset.directionalLight.position)

    if (preset.directionalLight.castShadow) {
      this.directionalLight.castShadow = true
      this.directionalLight.shadow.mapSize.width = preset.directionalLight.shadowMapSize
      this.directionalLight.shadow.mapSize.height = preset.directionalLight.shadowMapSize
      this.directionalLight.shadow.camera.near = 0.1
      this.directionalLight.shadow.camera.far = 500
      this.directionalLight.shadow.camera.left = -200
      this.directionalLight.shadow.camera.right = 200
      this.directionalLight.shadow.camera.top = 200
      this.directionalLight.shadow.camera.bottom = -200
    }

    this.scene.add(this.directionalLight)

    // Create point lights
    preset.pointLights.forEach((lightData, index) => {
      const light = new THREE.PointLight(
        lightData.color,
        lightData.intensity,
        lightData.distance,
        lightData.decay
      )
      light.position.copy(lightData.position)
      light.userData.isAnimated = lightData.isAnimated
      light.userData.animationType = lightData.animationType

      this.pointLights.set(`point_${index}`, light)
      this.scene.add(light)
    })

    // Create spot lights
    preset.spotLights.forEach((lightData, index) => {
      const light = new THREE.SpotLight(
        lightData.color,
        lightData.intensity,
        lightData.distance,
        lightData.angle,
        lightData.penumbra,
        lightData.decay
      )
      light.position.copy(lightData.position)
      light.target.position.copy(lightData.target)
      light.userData.isAnimated = lightData.isAnimated
      light.userData.animationType = lightData.animationType

      this.spotLights.set(`spot_${index}`, light)
      this.scene.add(light)
      this.scene.add(light.target)
    })

    // Apply fog
    this.scene.fog = new THREE.Fog(
      preset.fog.color,
      preset.fog.near,
      preset.fog.far
    )

    this.currentLightingPreset = preset
  }

  public transitionToZone(zoneId: string): void {
    // Handle smooth lighting transitions between zones
  }

  public update(deltaTime: number): void {
    // Update animated lights
    this.pointLights.forEach((light) => {
      if (light.userData.isAnimated) {
        this.updateAnimatedLight(light, deltaTime)
      }
    })

    this.spotLights.forEach((light) => {
      if (light.userData.isAnimated) {
        this.updateAnimatedLight(light, deltaTime)
      }
    })
  }

  private updateAnimatedLight(light: THREE.Light | THREE.PointLight | THREE.SpotLight, deltaTime: number): void {
    const animationType = light.userData.animationType

    switch (animationType) {
      case 'flicker':
        light.intensity = light.intensity * (0.8 + Math.random() * 0.4)
        break

      case 'pulse':
        const time = Date.now() * 0.001
        light.intensity = light.intensity * (0.8 + Math.sin(time * 2) * 0.2)
        break

      case 'scan':
        if (light instanceof THREE.SpotLight) {
          const time = Date.now() * 0.001
          const angle = Math.sin(time * 0.5) * Math.PI * 0.25
          light.target.position.x = Math.cos(angle) * 10
          light.target.position.z = Math.sin(angle) * 10
        }
        break

      case 'alert':
        const alertTime = Date.now() * 0.001
        light.intensity = light.intensity * (0.5 + Math.sin(alertTime * 4) * 0.5)
        break
    }
  }

  public updateQuality(quality: EnvironmentSettings['quality']): void {
    // Adjust lighting quality based on settings
    switch (quality) {
      case 'low':
        this.renderer.shadowMap.enabled = false
        break
      case 'medium':
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.BasicShadowMap
        break
      case 'high':
      case 'ultra':
      case 'cinematic':
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        break
    }
  }

  public setTimeOfDay(time: number): void {
    if (this.directionalLight) {
      const angle = (time / 24) * Math.PI * 2 - Math.PI / 2
      this.directionalLight.position.x = Math.cos(angle) * 100
      this.directionalLight.position.y = Math.sin(angle) * 100

      // Adjust light color and intensity based on time
      if (time >= 6 && time <= 18) {
        // Daytime
        this.directionalLight.color.setHex(0xffffff)
        this.directionalLight.intensity = 1.0
      } else {
        // Nighttime
        this.directionalLight.color.setHex(0x4444ff)
        this.directionalLight.intensity = 0.3
      }
    }
  }

  private clearLights(): void {
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight)
      this.ambientLight = null
    }

    if (this.directionalLight) {
      this.scene.remove(this.directionalLight)
      this.directionalLight = null
    }

    this.pointLights.forEach((light) => {
      this.scene.remove(light)
    })
    this.pointLights.clear()

    this.spotLights.forEach((light) => {
      this.scene.remove(light)
      this.scene.remove(light.target)
    })
    this.spotLights.clear()
  }

  public dispose(): void {
    this.clearLights()
  }
}

class EnvironmentPhysics {
  private objects: Map<string, any> = new Map()
  private quality: EnvironmentSettings['quality'] = 'high'

  public initializeZone(zone: EnvironmentZone): void {
    // Initialize physics for zone objects
    zone.environmentObjects.forEach((object) => {
      if (object.hasCollision) {
        this.createObjectPhysics(object)
      }
    })
  }

  private createObjectPhysics(object: EnvironmentObject): void {
    // Create physics body for object
    const physicsBody = {
      position: object.position.clone(),
      velocity: new THREE.Vector3(),
      mass: object.isMovable ? 10 : 0,
      friction: 0.8,
      restitution: 0.3,
      isStatic: !object.isMovable
    }

    this.objects.set(object.id, physicsBody)
  }

  public update(deltaTime: number): void {
    // Update physics simulation
    this.objects.forEach((body, id) => {
      if (!body.isStatic) {
        // Apply gravity
        body.velocity.y -= 9.8 * deltaTime

        // Update position
        body.position.add(body.velocity.clone().multiplyScalar(deltaTime))

        // Ground collision
        if (body.position.y < 0) {
          body.position.y = 0
          body.velocity.y = 0
        }

        // Apply friction
        body.velocity.x *= 0.98
        body.velocity.z *= 0.98
      }
    })
  }

  public updateQuality(quality: EnvironmentSettings['quality']): void {
    this.quality = quality
  }

  public dispose(): void {
    this.objects.clear()
  }
}

class EnvironmentAudio {
  private currentZone: string | null = null
  private audioContext: AudioContext
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map()

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  public initializeZone(zone: AudioZone): void {
    // Initialize audio zone
  }

  public transitionToZone(zoneId: string): void {
    // Handle audio zone transitions
    this.currentZone = zoneId
  }

  public update(deltaTime: number): void {
    // Update audio system
  }

  public playSound(soundId: string, position: THREE.Vector3): void {
    // Play 3D positioned sound
    const sound = new Audio()
    sound.src = `/audio/sfx/${soundId}.mp3`
    sound.volume = 0.5
    sound.play()

    this.activeSounds.set(soundId + Date.now(), sound as any)
  }

  public dispose(): void {
    this.activeSounds.forEach((sound) => {
      sound.stop()
    })
    this.activeSounds.clear()
    this.audioContext.close()
  }
}

class LODManager {
  private camera: THREE.Camera
  private settings: EnvironmentSettings
  private lodObjects: Map<string, THREE.Mesh[]> = new Map()

  constructor(camera: THREE.Camera, settings: EnvironmentSettings) {
    this.camera = camera
    this.settings = settings
  }

  public update(deltaTime: number): void {
    // Update LOD based on camera distance
    this.lodObjects.forEach((lodLevels, objectId) => {
      lodLevels.forEach((mesh, index) => {
        const distance = this.camera.position.distanceTo(mesh.position)
        const lodDistance = index * this.settings.lodDistance

        if (distance < lodDistance) {
          mesh.visible = true
        } else {
          mesh.visible = false
        }
      })
    })
  }

  public updateQuality(quality: EnvironmentSettings['quality']): void {
    this.settings.quality = quality

    // Adjust LOD distances based on quality
    switch (quality) {
      case 'low':
        this.settings.lodDistance = 20
        break
      case 'medium':
        this.settings.lodDistance = 40
        break
      case 'high':
        this.settings.lodDistance = 60
        break
      case 'ultra':
        this.settings.lodDistance = 80
        break
      case 'cinematic':
        this.settings.lodDistance = 100
        break
    }
  }

  public dispose(): void {
    this.lodObjects.clear()
  }
}

interface RoomLighting {
  ambientIntensity: number
  pointLights: Array<{
    position: THREE.Vector3
    color: THREE.Color
    intensity: number
    distance: number
    decay: number
  }>
  hasCeilingLight: boolean
  hasDeskLamp: boolean
}

class FoliageSystem {
  private scene: THREE.Scene
  private settings: EnvironmentSettings
  private foliage: Map<string, FoliageInstance> = new Map()
  private windSimulation: WindSimulation

  constructor(scene: THREE.Scene, settings: EnvironmentSettings) {
    this.scene = scene
    this.settings = settings
    this.windSimulation = {
      enabled: true,
      strength: 5,
      direction: new THREE.Vector3(1, 0, 0.5).normalize(),
      turbulence: 0.3,
      gustFrequency: 2,
      gustStrength: 2,
      animationSpeed: 1
    }
  }

  public update(deltaTime: number): void {
    if (!this.settings.enableFoliage) return

    this.foliage.forEach((instance) => {
      this.updateFoliageInstance(instance, deltaTime)
    })
  }

  private updateFoliageInstance(instance: FoliageInstance, deltaTime: number): void {
    if (!this.windSimulation.enabled) return

    const time = Date.now() * 0.001 * this.windSimulation.animationSpeed
    const windStrength = this.windSimulation.strength * (1 + Math.sin(time * this.windSimulation.gustFrequency) * 0.5)

    // Apply wind animation
    instance.rotation.y += Math.sin(time + instance.position.x) * windStrength * 0.01 * deltaTime
    instance.rotation.z += Math.cos(time + instance.position.z) * windStrength * 0.005 * deltaTime
  }

  public setSeason(season: 'spring' | 'summer' | 'autumn' | 'winter'): void {
    // Update foliage appearance based on season
    this.foliage.forEach((instance) => {
      // Update materials and colors based on season
    })
  }

  public dispose(): void {
    this.foliage.clear()
  }
}

export default GLXYEnhancedEnvironment