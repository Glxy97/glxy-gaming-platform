// @ts-nocheck
/**
 * GLXY FPS Enhanced - Performance Optimization System
 * Advanced performance monitoring and optimization for maximum FPS
 */

import * as THREE from 'three'

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  memoryUsage: number
  textureMemory: number
  geometryMemory: number
  renderTime: number
  physicsTime: number
  aiTime: number
  particlesTime: number
  networkLatency: number
  gpuUtilization: number
  cpuUtilization: number
}

export interface OptimizationSettings {
  graphics: {
    quality: 'potato' | 'low' | 'medium' | 'high' | 'ultra' | 'insane'
    shadows: 'off' | 'low' | 'medium' | 'high' | 'ultra'
    antiAliasing: 'off' | 'fxaa' | 'msaa2x' | 'msaa4x' | 'msaa8x'
    textures: 'low' | 'medium' | 'high' | 'ultra'
    particles: 'low' | 'medium' | 'high' | 'extreme'
    postProcessing: 'minimal' | 'basic' | 'advanced' | 'insane'
    renderDistance: number
    lodBias: number
    occlusion: boolean
    frustumCulling: boolean
    instancedRendering: boolean
  }
  physics: {
    quality: 'basic' | 'standard' | 'advanced' | 'simulation'
    substeps: number
    solverIterations: number
    broadphase: 'brute' | 'sweep' | 'dynamic'
    enableCCD: boolean
    enableDeactivation: boolean
    deactivationTime: number
    maxObjects: number
  }
  audio: {
    quality: 'compressed' | 'standard' | 'high' | 'uncompressed'
    maxSounds: number
    spatialAudio: boolean
    reverbQuality: 'basic' | 'convolution' | 'hybrid'
    hrtf: boolean
    dopplerFactor: number
    distanceModel: 'linear' | 'inverse' | 'exponential'
  }
  network: {
    quality: 'fast' | 'balanced' | 'pro'
    interpolation: boolean
    extrapolation: boolean
    compression: boolean
    tickRate: number
    bufferSize: number
    latencyCompensation: boolean
    packetSize: number
    maxRetries: number
  }
  ai: {
    intelligence: 'basic' | 'standard' | 'smart' | 'genius'
    updateRate: number
    perceptionDistance: number
    reactionTime: number
    memoryTime: number
    teamworkLevel: number
    learningEnabled: boolean
    maxConcurrentAI: number
  }
  performance: {
    targetFPS: number
    framePacing: boolean
    adaptiveQuality: boolean
    threadCount: number
    memoryLimit: number
    gpuAcceleration: boolean
    rayTracing: boolean
    vsync: boolean
    tripleBuffering: boolean
  }
}

export class GLXYPerformanceOptimization {
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private camera: THREE.Camera
  private settings: OptimizationSettings
  private metrics: PerformanceMetrics
  private frameCount: number = 0
  private lastTime: number = 0
  private frameTimeHistory: number[] = []
  private fpsHistory: number[] = []
  private adaptiveQualityEnabled: boolean = false
  private performanceProfiles: Map<string, OptimizationSettings> = new Map()
  private resourcePool: Map<string, any[]> = new Map()
  private disposedObjects: Set<THREE.Object3D> = new Set()
  private lodLevels: Map<THREE.Object3D, THREE.Mesh[]> = new Map()
  private occlusionBoxes: Map<THREE.Object3D, THREE.Box3> = new Map()
  private frustumCullingEnabled: boolean = true
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map()
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map()
  private textureCache: Map<string, THREE.Texture> = new Map()
  private materialCache: Map<string, THREE.Material> = new Map()

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera, settings?: Partial<OptimizationSettings>) {
    this.scene = scene
    this.renderer = renderer
    this.camera = camera
    this.settings = this.createDefaultSettings()
    this.metrics = this.initializeMetrics()

    if (settings) {
      this.applySettings(settings)
    }

    this.initializePerformanceProfiles()
    this.setupPerformanceMonitoring()
    this.initializeResourcePools()
    this.enableOptimizations()
  }

  private createDefaultSettings(): OptimizationSettings {
    return {
      graphics: {
        quality: 'high',
        shadows: 'high',
        antiAliasing: 'msaa4x',
        textures: 'high',
        particles: 'high',
        postProcessing: 'advanced',
        renderDistance: 200,
        lodBias: 1.0,
        occlusion: true,
        frustumCulling: true,
        instancedRendering: true
      },
      physics: {
        quality: 'standard',
        substeps: 2,
        solverIterations: 10,
        broadphase: 'dynamic',
        enableCCD: false,
        enableDeactivation: true,
        deactivationTime: 0.5,
        maxObjects: 1000
      },
      audio: {
        quality: 'high',
        maxSounds: 32,
        spatialAudio: true,
        reverbQuality: 'convolution',
        hrtf: true,
        dopplerFactor: 1.0,
        distanceModel: 'inverse'
      },
      network: {
        quality: 'pro',
        interpolation: true,
        extrapolation: true,
        compression: true,
        tickRate: 60,
        bufferSize: 3,
        latencyCompensation: true,
        packetSize: 1024,
        maxRetries: 3
      },
      ai: {
        intelligence: 'smart',
        updateRate: 30,
        perceptionDistance: 50,
        reactionTime: 200,
        memoryTime: 30000,
        teamworkLevel: 0.7,
        learningEnabled: true,
        maxConcurrentAI: 20
      },
      performance: {
        targetFPS: 60,
        framePacing: true,
        adaptiveQuality: true,
        threadCount: navigator.hardwareConcurrency || 4,
        memoryLimit: 4096,
        gpuAcceleration: true,
        rayTracing: false,
        vsync: true,
        tripleBuffering: true
      }
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      textureMemory: 0,
      geometryMemory: 0,
      renderTime: 0,
      physicsTime: 0,
      aiTime: 0,
      particlesTime: 0,
      networkLatency: 0,
      gpuUtilization: 0,
      cpuUtilization: 0
    }
  }

  private initializePerformanceProfiles(): void {
    // Potato Profile - Maximum performance for low-end devices
    this.performanceProfiles.set('potato', {
      graphics: {
        quality: 'potato',
        shadows: 'off',
        antiAliasing: 'off',
        textures: 'low',
        particles: 'low',
        postProcessing: 'minimal',
        renderDistance: 50,
        lodBias: 0.5,
        occlusion: false,
        frustumCulling: true,
        instancedRendering: true
      },
      physics: {
        quality: 'basic',
        substeps: 1,
        solverIterations: 4,
        broadphase: 'brute',
        enableCCD: false,
        enableDeactivation: true,
        deactivationTime: 0.2,
        maxObjects: 100
      },
      audio: {
        quality: 'compressed',
        maxSounds: 8,
        spatialAudio: false,
        reverbQuality: 'basic',
        hrtf: false,
        dopplerFactor: 0.5,
        distanceModel: 'linear'
      },
      network: {
        quality: 'fast',
        interpolation: false,
        extrapolation: false,
        compression: true,
        tickRate: 20,
        bufferSize: 2,
        latencyCompensation: false,
        packetSize: 512,
        maxRetries: 1
      },
      ai: {
        intelligence: 'basic',
        updateRate: 10,
        perceptionDistance: 20,
        reactionTime: 500,
        memoryTime: 5000,
        teamworkLevel: 0.2,
        learningEnabled: false,
        maxConcurrentAI: 5
      },
      performance: {
        targetFPS: 30,
        framePacing: false,
        adaptiveQuality: false,
        threadCount: 1,
        memoryLimit: 1024,
        gpuAcceleration: false,
        rayTracing: false,
        vsync: false,
        tripleBuffering: false
      }
    })

    // Low Profile - Balanced performance for budget devices
    this.performanceProfiles.set('low', {
      graphics: {
        quality: 'low',
        shadows: 'low',
        antiAliasing: 'fxaa',
        textures: 'low',
        particles: 'low',
        postProcessing: 'basic',
        renderDistance: 100,
        lodBias: 0.7,
        occlusion: true,
        frustumCulling: true,
        instancedRendering: true
      },
      physics: {
        quality: 'standard',
        substeps: 1,
        solverIterations: 6,
        broadphase: 'sweep',
        enableCCD: false,
        enableDeactivation: true,
        deactivationTime: 0.3,
        maxObjects: 300
      },
      audio: {
        quality: 'standard',
        maxSounds: 16,
        spatialAudio: true,
        reverbQuality: 'basic',
        hrtf: false,
        dopplerFactor: 0.7,
        distanceModel: 'inverse'
      },
      network: {
        quality: 'fast',
        interpolation: true,
        extrapolation: false,
        compression: true,
        tickRate: 30,
        bufferSize: 2,
        latencyCompensation: true,
        packetSize: 768,
        maxRetries: 2
      },
      ai: {
        intelligence: 'standard',
        updateRate: 20,
        perceptionDistance: 35,
        reactionTime: 350,
        memoryTime: 15000,
        teamworkLevel: 0.5,
        learningEnabled: false,
        maxConcurrentAI: 10
      },
      performance: {
        targetFPS: 45,
        framePacing: true,
        adaptiveQuality: true,
        threadCount: 2,
        memoryLimit: 2048,
        gpuAcceleration: true,
        rayTracing: false,
        vsync: true,
        tripleBuffering: false
      }
    })

    // Ultra Profile - Maximum quality for high-end devices
    this.performanceProfiles.set('ultra', {
      graphics: {
        quality: 'ultra',
        shadows: 'ultra',
        antiAliasing: 'msaa8x',
        textures: 'ultra',
        particles: 'extreme',
        postProcessing: 'insane',
        renderDistance: 500,
        lodBias: 2.0,
        occlusion: true,
        frustumCulling: true,
        instancedRendering: true
      },
      physics: {
        quality: 'simulation',
        substeps: 4,
        solverIterations: 16,
        broadphase: 'dynamic',
        enableCCD: true,
        enableDeactivation: true,
        deactivationTime: 1.0,
        maxObjects: 2000
      },
      audio: {
        quality: 'uncompressed',
        maxSounds: 64,
        spatialAudio: true,
        reverbQuality: 'convolution',
        hrtf: true,
        dopplerFactor: 1.2,
        distanceModel: 'exponential'
      },
      network: {
        quality: 'pro',
        interpolation: true,
        extrapolation: true,
        compression: false,
        tickRate: 128,
        bufferSize: 5,
        latencyCompensation: true,
        packetSize: 2048,
        maxRetries: 5
      },
      ai: {
        intelligence: 'genius',
        updateRate: 60,
        perceptionDistance: 100,
        reactionTime: 50,
        memoryTime: 120000,
        teamworkLevel: 1.0,
        learningEnabled: true,
        maxConcurrentAI: 50
      },
      performance: {
        targetFPS: 144,
        framePacing: true,
        adaptiveQuality: true,
        threadCount: navigator.hardwareConcurrency || 8,
        memoryLimit: 16384,
        gpuAcceleration: true,
        rayTracing: true,
        vsync: false,
        tripleBuffering: true
      }
    })
  }

  private setupPerformanceMonitoring(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      }, 1000)
    }

    // Monitor FPS and frame time
    this.frameCount = 0
    this.lastTime = performance.now()
  }

  private initializeResourcePools(): void {
    // Initialize object pools for common resources
    this.resourcePool.set('bullets', [])
    this.resourcePool.set('explosions', [])
    this.resourcePool.set('shellCasings', [])
    this.resourcePool.set('bloodParticles', [])
    this.resourcePool.set('muzzleFlashes', [])
  }

  private enableOptimizations(): void {
    // Enable renderer optimizations
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // Note: powerPreference and antialias are set in constructor options only
    // this.renderer.powerPreference = 'high-performance' // Not available as property
    // this.renderer.antialias = this.settings.graphics.antiAliasing !== 'off' // Not available as property

    // Enable shadow optimizations
    if (this.settings.graphics.shadows !== 'off') {
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = this.getShadowMapType()
    }

    // Enable instanced rendering
    if (this.settings.graphics.instancedRendering) {
      this.setupInstancedRendering()
    }

    // Enable frustum culling
    if (this.settings.graphics.frustumCulling) {
      this.setupFrustumCulling()
    }

    // Enable occlusion culling
    if (this.settings.graphics.occlusion) {
      this.setupOcclusionCulling()
    }

    // Enable adaptive quality
    if (this.settings.performance.adaptiveQuality) {
      this.adaptiveQualityEnabled = true
    }
  }

  private getShadowMapType(): THREE.ShadowMapType {
    switch (this.settings.graphics.shadows) {
      case 'low': return THREE.BasicShadowMap
      case 'medium': return THREE.PCFShadowMap
      case 'high': return THREE.PCFSoftShadowMap
      case 'ultra': return THREE.VSMShadowMap
      default: return THREE.PCFSoftShadowMap
    }
  }

  private setupInstancedRendering(): void {
    // Create instanced meshes for common objects
    this.createInstancedMesh('bullets', new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffff00 }))
    this.createInstancedMesh('shellCasings', new THREE.CylinderGeometry(0.02, 0.03, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 }))
  }

  private createInstancedMesh(key: string, geometry: THREE.BufferGeometry, material: THREE.Material): void {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000)
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.scene.add(instancedMesh)
    this.instancedMeshes.set(key, instancedMesh)
  }

  private setupFrustumCulling(): void {
    // Frustum culling is handled by Three.js automatically, but we can optimize it
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.frustumCulled = true
      }
    })
  }

  private setupOcclusionCulling(): void {
    // Simple occlusion culling using bounding boxes
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        object.geometry.computeBoundingBox()
        if (object.geometry.boundingBox) {
          this.occlusionBoxes.set(object, object.geometry.boundingBox.clone())
        }
      }
    })
  }

  public update(deltaTime: number): void {
    this.updateMetrics()
    this.updatePerformanceOptimizations(deltaTime)

    if (this.adaptiveQualityEnabled) {
      this.updateAdaptiveQuality()
    }
  }

  private updateMetrics(): void {
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Calculate FPS
    this.frameCount++
    if (this.frameCount % 30 === 0) {
      this.metrics.fps = Math.round(1000 / deltaTime)
      this.metrics.frameTime = deltaTime

      // Update history
      this.fpsHistory.push(this.metrics.fps)
      this.frameTimeHistory.push(deltaTime)

      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift()
        this.frameTimeHistory.shift()
      }
    }

    // Update renderer info
    if (this.renderer.info) {
      this.metrics.drawCalls = this.renderer.info.render.calls
      this.metrics.triangles = this.renderer.info.render.triangles
    }
  }

  private updatePerformanceOptimizations(deltaTime: number): void {
    // Update LOD levels
    this.updateLOD()

    // Perform frustum culling
    if (this.frustumCullingEnabled) {
      this.performFrustumCulling()
    }

    // Perform occlusion culling
    if (this.settings.graphics.occlusion) {
      this.performOcclusionCulling()
    }

    // Clean up disposed objects
    this.cleanupDisposedObjects()

    // Update instanced meshes
    this.updateInstancedMeshes()
  }

  private updateLOD(): void {
    const cameraPosition = this.camera.position

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.lodLevels) {
        const distance = cameraPosition.distanceTo(object.position)
        const lodLevels = object.userData.lodLevels

        for (let i = 0; i < lodLevels.length; i++) {
          if (distance < lodLevels[i].distance) {
            if (object.geometry !== lodLevels[i].geometry) {
              object.geometry = lodLevels[i].geometry
            }
            break
          }
        }
      }
    })
  }

  private performFrustumCulling(): void {
    // Custom frustum culling for better performance
    const frustum = new THREE.Frustum()
    const cameraMatrix = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(cameraMatrix)

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry.boundingBox) {
        if (!frustum.intersectsBox(object.geometry.boundingBox)) {
          object.visible = false
        } else {
          object.visible = true
        }
      }
    })
  }

  private performOcclusionCulling(): void {
    // Simple occlusion culling - hide objects behind other objects
    const cameraPosition = this.camera.position

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.visible) {
        const boundingBox = this.occlusionBoxes.get(object)
        if (boundingBox) {
          const direction = new THREE.Vector3().subVectors(object.position, cameraPosition).normalize()
          const raycaster = new THREE.Raycaster(cameraPosition, direction)
          const intersects = raycaster.intersectObject(object, true)

          // If there are intersections before this object, hide it
          if (intersects.length > 0 && intersects[0].object !== object) {
            object.visible = false
          }
        }
      }
    })
  }

  private cleanupDisposedObjects(): void {
    // Clean up objects marked for disposal
    this.disposedObjects.forEach((object) => {
      this.scene.remove(object)

      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        } else if (object.material) {
          object.material.dispose()
        }
      }
    })

    this.disposedObjects.clear()
  }

  private updateInstancedMeshes(): void {
    // Update instanced meshes for better performance
    this.instancedMeshes.forEach((instancedMesh, key) => {
      const pool = this.resourcePool.get(key) || []

      // Update instance matrices for active objects
      let instanceIndex = 0
      pool.forEach((object, index) => {
        if (object.active) {
          const matrix = new THREE.Matrix4()
          matrix.setPosition(object.position)
          instancedMesh.setMatrixAt(instanceIndex++, matrix)
        }
      })

      // Update only the active instances
      instancedMesh.instanceMatrix.needsUpdate = true
      instancedMesh.count = instanceIndex
    })
  }

  private updateAdaptiveQuality(): void {
    const averageFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 60

    const targetFPS = this.settings.performance.targetFPS

    if (averageFPS < targetFPS * 0.8) {
      // Performance is too low, reduce quality
      this.reduceQuality()
    } else if (averageFPS > targetFPS * 1.2) {
      // Performance is good, can increase quality
      this.increaseQuality()
    }
  }

  private reduceQuality(): void {
    // Gradually reduce quality settings
    const currentQuality = this.settings.graphics.quality
    const qualityLevels = ['insane', 'ultra', 'high', 'medium', 'low', 'potato']
    const currentIndex = qualityLevels.indexOf(currentQuality)

    if (currentIndex < qualityLevels.length - 1) {
      const newQuality = qualityLevels[currentIndex + 1]
      this.setGraphicsQuality(newQuality as any)
      console.log(`🔽 Reduced graphics quality to: ${newQuality}`)
    }
  }

  private increaseQuality(): void {
    // Gradually increase quality settings
    const currentQuality = this.settings.graphics.quality
    const qualityLevels = ['insane', 'ultra', 'high', 'medium', 'low', 'potato']
    const currentIndex = qualityLevels.indexOf(currentQuality)

    if (currentIndex > 0) {
      const newQuality = qualityLevels[currentIndex - 1]
      this.setGraphicsQuality(newQuality as any)
      console.log(`🔼 Increased graphics quality to: ${newQuality}`)
    }
  }

  public setGraphicsQuality(quality: OptimizationSettings['graphics']['quality']): void {
    const profile = this.performanceProfiles.get(quality)
    if (profile) {
      this.applySettings({ graphics: profile.graphics })
    }
  }

  public applySettings(settings: Partial<OptimizationSettings>): void {
    // Deep merge settings
    this.settings = this.deepMerge(this.settings, settings)

    // Apply graphics settings
    if (settings.graphics) {
      this.applyGraphicsSettings(settings.graphics)
    }

    // Apply performance settings
    if (settings.performance) {
      this.applyPerformanceSettings(settings.performance)
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target }

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }

    return result
  }

  private applyGraphicsSettings(graphics: OptimizationSettings['graphics']): void {
    // Apply renderer settings
    this.renderer.setPixelRatio(graphics.quality === 'insane' ? window.devicePixelRatio : Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = graphics.shadows !== 'off'

    if (graphics.shadows !== 'off') {
      this.renderer.shadowMap.type = this.getShadowMapType()
    }

    // Apply texture quality
    this.updateTextureQuality(graphics.textures)
  }

  private applyPerformanceSettings(performance: OptimizationSettings['performance']): void {
    // Enable/disable adaptive quality
    this.adaptiveQualityEnabled = performance.adaptiveQuality

    // Set target FPS
    this.settings.performance.targetFPS = performance.targetFPS
  }

  private updateTextureQuality(quality: OptimizationSettings['graphics']['textures']): void {
    const maxAnisotropy = {
      'low': 1,
      'medium': 4,
      'high': 8,
      'ultra': 16
    }[quality] || 8

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => {
          if (material.map) {
            material.map.anisotropy = maxAnisotropy
          }
        })
      }
    })
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public getSettings(): OptimizationSettings {
    return { ...this.settings }
  }

  public getResourceFromPool(type: string): any {
    const pool = this.resourcePool.get(type) || []
    const resource = pool.find(obj => !obj.active)

    if (resource) {
      resource.active = true
      return resource
    }

    // Create new resource if pool is empty
    return this.createResource(type)
  }

  public returnResourceToPool(type: string, resource: any): void {
    resource.active = false
    const pool = this.resourcePool.get(type) || []
    pool.push(resource)
    this.resourcePool.set(type, pool)
  }

  private createResource(type: string): any {
    // Create new resource based on type
    switch (type) {
      case 'bullets':
        return {
          active: true,
          position: new THREE.Vector3(),
          velocity: new THREE.Vector3(),
          lifetime: 2.0
        }
      case 'explosions':
        return {
          active: true,
          position: new THREE.Vector3(),
          radius: 1.0,
          lifetime: 1.0
        }
      default:
        return { active: true }
    }
  }

  public createLOD(object: THREE.Mesh, distances: number[], geometries: THREE.BufferGeometry[]): void {
    const lodLevels = distances.map((distance, index) => ({
      distance,
      geometry: [geometries[index]]
    }))

    object.userData.lodLevels = lodLevels
    this.lodLevels.set(object, object instanceof THREE.Mesh ? [object] : [])
  }

  public disposeObject(object: THREE.Object3D): void {
    this.disposedObjects.add(object)
  }

  public optimizeForDevice(deviceInfo: any): void {
    // Automatically optimize settings based on device capabilities
    const memory = deviceInfo.deviceMemory || 4
    const cores = deviceInfo.hardwareConcurrency || 4
    const gpu = deviceInfo.gpu || 'unknown'

    let profile = 'medium'

    if (memory < 4 || cores < 4) {
      profile = 'low'
    } else if (memory > 8 && cores > 8) {
      profile = 'high'
    }

    this.setGraphicsQuality(profile as any)
    console.log(`🎯 Auto-optimized for device: ${profile} quality`)
  }

  public forceGarbageCollection(): void {
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc()
    }

    // Clean up resources
    this.cleanupDisposedObjects()

    // Clear caches
    this.geometryCache.clear()
    this.textureCache.clear()
    this.materialCache.clear()
  }

  public dispose(): void {
    // Dispose all resources
    this.instancedMeshes.forEach((mesh) => {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose())
      } else {
        mesh.material.dispose()
      }
    })

    this.instancedMeshes.clear()
    this.resourcePool.clear()
    this.disposedObjects.clear()
    this.lodLevels.clear()
    this.occlusionBoxes.clear()
    this.geometryCache.clear()
    this.textureCache.clear()
    this.materialCache.clear()
  }
}

export default GLXYPerformanceOptimization