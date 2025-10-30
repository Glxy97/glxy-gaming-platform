/**
 * GLXY Ultimate FPS - Map Loader
 *
 * PROFESSIONAL ASYNC MAP LOADING SYSTEM
 * Handles map loading, resource management, and instantiation
 *
 * @module MapLoader
 * @category Maps
 *
 * Features:
 * - Async map loading with progress tracking
 * - Resource management (textures, models, sounds)
 * - Geometry instantiation (Three.js)
 * - Validation and error handling
 * - Loading screen integration
 * - Memory management
 *
 * Phase 8: Advanced Map System
 */

import * as THREE from 'three'
import {
  MapData,
  GeometryObjectData,
  GeometryType,
  MaterialType,
  Vector3Data,
  ColorData,
  validateMapData,
  PointLightData,
  SpotLightData
} from './data/MapData'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Loading Progress
 */
export interface LoadingProgress {
  stage: string
  progress: number // 0-1
  message: string
}

/**
 * Loaded Map Resources
 */
export interface LoadedMapResources {
  scene: THREE.Scene
  geometry: Map<string, THREE.Mesh>
  lights: Map<string, THREE.Light>
  sounds: Map<string, HTMLAudioElement>
  textures: Map<string, THREE.Texture>
}

/**
 * Map Loader Configuration
 */
export interface MapLoaderConfig {
  enableShadows: boolean
  enableLOD: boolean
  textureQuality: 'low' | 'medium' | 'high'
  maxDrawDistance: number
  enableOcclusionCulling: boolean
}

// =============================================================================
// MAP LOADER
// =============================================================================

/**
 * MapLoader
 * Handles async loading and instantiation of maps
 */
export class MapLoader {
  private config: MapLoaderConfig
  private textureLoader: THREE.TextureLoader
  private loadingManager: THREE.LoadingManager

  // Progress tracking
  private onProgress?: (progress: LoadingProgress) => void
  private currentProgress: number = 0

  constructor(config: Partial<MapLoaderConfig> = {}) {
    this.config = {
      enableShadows: true,
      enableLOD: true,
      textureQuality: 'high',
      maxDrawDistance: 200,
      enableOcclusionCulling: true,
      ...config
    }

    this.loadingManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)

    console.log('🗺️  MapLoader: Initialized')
  }

  /**
   * Load map asynchronously
   */
  public async loadMap(
    mapData: MapData,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<LoadedMapResources> {
    this.onProgress = onProgress
    this.currentProgress = 0

    console.log(`🗺️  MapLoader: Loading map "${mapData.metadata.displayName}"`)

    try {
      // Step 1: Validate map data
      this.updateProgress('validate', 0.05, 'Validating map data...')
      await this.validateMap(mapData)

      // Step 2: Create scene
      this.updateProgress('scene', 0.10, 'Creating scene...')
      const scene = await this.createScene(mapData)

      // Step 3: Load textures
      this.updateProgress('textures', 0.20, 'Loading textures...')
      const textures = await this.loadTextures(mapData)

      // Step 4: Create geometry
      this.updateProgress('geometry', 0.40, 'Creating geometry...')
      const geometry = await this.createGeometry(mapData, scene, textures)

      // Step 5: Setup lighting
      this.updateProgress('lighting', 0.70, 'Setting up lighting...')
      const lights = await this.setupLighting(mapData, scene)

      // Step 6: Load sounds
      this.updateProgress('sounds', 0.85, 'Loading sounds...')
      const sounds = await this.loadSounds(mapData)

      // Step 7: Finalize
      this.updateProgress('finalize', 1.0, 'Finalizing...')
      await this.finalizeScene(scene, mapData)

      console.log(`✅ MapLoader: Map "${mapData.metadata.displayName}" loaded successfully`)

      return {
        scene,
        geometry,
        lights,
        sounds,
        textures
      }
    } catch (error) {
      console.error('❌ MapLoader: Failed to load map:', error)
      throw error
    }
  }

  /**
   * Validate map data
   */
  private async validateMap(mapData: MapData): Promise<void> {
    const validation = validateMapData(mapData)

    if (!validation.valid) {
      throw new Error(`Map validation failed: ${validation.errors.join(', ')}`)
    }
  }

  /**
   * Create Three.js scene
   */
  private async createScene(mapData: MapData): Promise<THREE.Scene> {
    const scene = new THREE.Scene()

    // Set background color
    const skyColor = mapData.environment.lighting.skyColor
    scene.background = new THREE.Color(
      skyColor.r,
      skyColor.g,
      skyColor.b
    )

    // Setup fog
    if (mapData.environment.fog.enabled) {
      const fogColor = mapData.environment.fog.color
      scene.fog = new THREE.Fog(
        new THREE.Color(fogColor.r, fogColor.g, fogColor.b).getHex(),
        mapData.environment.fog.near,
        mapData.environment.fog.far
      )
    }

    return scene
  }

  /**
   * Load textures
   */
  private async loadTextures(mapData: MapData): Promise<Map<string, THREE.Texture>> {
    const textures = new Map<string, THREE.Texture>()

    // Collect unique textures from geometry
    const textureUrls = new Set<string>()
    mapData.geometry.forEach(geo => {
      if (geo.texture) textureUrls.add(geo.texture)
      if (geo.normalMap) textureUrls.add(geo.normalMap)
    })

    // Load textures
    const promises = Array.from(textureUrls).map(async url => {
      try {
        const texture = await this.textureLoader.loadAsync(url)
        textures.set(url, texture)
      } catch (error) {
        console.warn(`Failed to load texture: ${url}`, error)
      }
    })

    await Promise.all(promises)

    return textures
  }

  /**
   * Create geometry
   */
  private async createGeometry(
    mapData: MapData,
    scene: THREE.Scene,
    textures: Map<string, THREE.Texture>
  ): Promise<Map<string, THREE.Mesh>> {
    const geometryMap = new Map<string, THREE.Mesh>()

    for (const geoData of mapData.geometry) {
      try {
        const mesh = this.createMeshFromData(geoData, textures)
        geometryMap.set(geoData.id, mesh)
        scene.add(mesh)
      } catch (error) {
        console.warn(`Failed to create geometry: ${geoData.id}`, error)
      }
    }

    return geometryMap
  }

  /**
   * Create mesh from geometry data
   */
  private createMeshFromData(
    geoData: GeometryObjectData,
    textures: Map<string, THREE.Texture>
  ): THREE.Mesh {
    // Create geometry
    let geometry: THREE.BufferGeometry

    switch (geoData.shape) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          geoData.dimensions.x,
          geoData.dimensions.y,
          geoData.dimensions.z
        )
        break

      case 'sphere':
        geometry = new THREE.SphereGeometry(geoData.dimensions.x, 32, 32)
        break

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          geoData.dimensions.x,
          geoData.dimensions.x,
          geoData.dimensions.y,
          32
        )
        break

      case 'plane':
        geometry = new THREE.PlaneGeometry(
          geoData.dimensions.x,
          geoData.dimensions.z
        )
        break

      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }

    // Create material
    const material = this.createMaterialFromData(geoData, textures)

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)

    // Set position, rotation, scale
    mesh.position.set(geoData.position.x, geoData.position.y, geoData.position.z)
    mesh.rotation.set(
      (geoData.rotation.x * Math.PI) / 180,
      (geoData.rotation.y * Math.PI) / 180,
      (geoData.rotation.z * Math.PI) / 180
    )
    mesh.scale.set(geoData.scale.x, geoData.scale.y, geoData.scale.z)

    // Enable shadows
    if (this.config.enableShadows) {
      mesh.castShadow = !geoData.isStatic
      mesh.receiveShadow = true
    }

    // Set name and userData
    mesh.name = geoData.id
    mesh.userData = {
      type: geoData.type,
      material: geoData.material,
      destructible: geoData.destructible,
      health: geoData.health,
      coverType: geoData.coverType
    }

    return mesh
  }

  /**
   * Create material from geometry data
   */
  private createMaterialFromData(
    geoData: GeometryObjectData,
    textures: Map<string, THREE.Texture>
  ): THREE.Material {
    const materialParams: THREE.MeshStandardMaterialParameters = {
      color: new THREE.Color(geoData.color.r, geoData.color.g, geoData.color.b),
      roughness: geoData.roughness,
      metalness: geoData.metalness
    }

    // Apply texture
    if (geoData.texture && textures.has(geoData.texture)) {
      materialParams.map = textures.get(geoData.texture)
    }

    // Apply normal map
    if (geoData.normalMap && textures.has(geoData.normalMap)) {
      materialParams.normalMap = textures.get(geoData.normalMap)
    }

    return new THREE.MeshStandardMaterial(materialParams)
  }

  /**
   * Setup lighting
   */
  private async setupLighting(
    mapData: MapData,
    scene: THREE.Scene
  ): Promise<Map<string, THREE.Light>> {
    const lights = new Map<string, THREE.Light>()

    // Ambient light
    const ambient = new THREE.AmbientLight(
      new THREE.Color(
        mapData.environment.lighting.ambientColor.r,
        mapData.environment.lighting.ambientColor.g,
        mapData.environment.lighting.ambientColor.b
      ),
      mapData.environment.lighting.ambientIntensity
    )
    scene.add(ambient)
    lights.set('ambient', ambient)

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(
      new THREE.Color(
        mapData.environment.lighting.sunColor.r,
        mapData.environment.lighting.sunColor.g,
        mapData.environment.lighting.sunColor.b
      ),
      mapData.environment.lighting.sunIntensity
    )
    sun.position.set(
      mapData.environment.lighting.sunPosition.x,
      mapData.environment.lighting.sunPosition.y,
      mapData.environment.lighting.sunPosition.z
    )

    if (this.config.enableShadows && mapData.environment.lighting.sunCastsShadow) {
      sun.castShadow = true
      sun.shadow.mapSize.width = mapData.environment.lighting.shadowMapSize
      sun.shadow.mapSize.height = mapData.environment.lighting.shadowMapSize
      sun.shadow.radius = mapData.environment.lighting.shadowRadius
      sun.shadow.bias = mapData.environment.lighting.shadowBias
      sun.shadow.camera.near = 0.5
      sun.shadow.camera.far = 500
      sun.shadow.camera.left = -100
      sun.shadow.camera.right = 100
      sun.shadow.camera.top = 100
      sun.shadow.camera.bottom = -100
    }

    scene.add(sun)
    lights.set('sun', sun)

    // Point lights
    mapData.environment.lighting.pointLights.forEach((lightData, index) => {
      const light = this.createPointLight(lightData)
      scene.add(light)
      lights.set(`point_${index}`, light)
    })

    // Spot lights
    mapData.environment.lighting.spotLights.forEach((lightData, index) => {
      const light = this.createSpotLight(lightData)
      scene.add(light)
      lights.set(`spot_${index}`, light)
    })

    return lights
  }

  /**
   * Create point light
   */
  private createPointLight(data: PointLightData): THREE.PointLight {
    const light = new THREE.PointLight(
      new THREE.Color(data.color.r, data.color.g, data.color.b),
      data.intensity,
      data.distance,
      data.decay
    )
    light.position.set(data.position.x, data.position.y, data.position.z)
    light.castShadow = this.config.enableShadows && data.castsShadow

    return light
  }

  /**
   * Create spot light
   */
  private createSpotLight(data: SpotLightData): THREE.SpotLight {
    const light = new THREE.SpotLight(
      new THREE.Color(data.color.r, data.color.g, data.color.b),
      data.intensity,
      data.distance,
      data.angle,
      data.penumbra,
      data.decay
    )
    light.position.set(data.position.x, data.position.y, data.position.z)
    light.target.position.set(data.target.x, data.target.y, data.target.z)
    light.castShadow = this.config.enableShadows && data.castsShadow

    return light
  }

  /**
   * Load sounds
   */
  private async loadSounds(mapData: MapData): Promise<Map<string, HTMLAudioElement>> {
    const sounds = new Map<string, HTMLAudioElement>()

    for (const soundData of mapData.environment.ambientSounds) {
      try {
        const audio = new Audio(soundData.soundFile)
        audio.volume = soundData.volume
        audio.loop = soundData.loop
        sounds.set(soundData.id, audio)
      } catch (error) {
        console.warn(`Failed to load sound: ${soundData.id}`, error)
      }
    }

    return sounds
  }

  /**
   * Finalize scene
   */
  private async finalizeScene(scene: THREE.Scene, mapData: MapData): Promise<void> {
    // Apply any post-processing or optimization
    scene.updateMatrixWorld(true)
  }

  /**
   * Update loading progress
   */
  private updateProgress(stage: string, progress: number, message: string): void {
    this.currentProgress = progress

    if (this.onProgress) {
      this.onProgress({ stage, progress, message })
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    console.log('🗑️ MapLoader: Disposed')
  }
}
