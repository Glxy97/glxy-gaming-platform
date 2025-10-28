// @ts-nocheck
/**
 * GLXY Gaming Platform - Advanced 3D Rendering Engine
 * High-performance WebGL2 renderer with optimized pipeline
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

export interface RendererConfig {
  antialias?: boolean
  shadows?: boolean
  pixelRatio?: number
  backgroundColor?: number
  fog?: boolean
  toneMapping?: THREE.ToneMapping
}

export interface SceneConfig {
  lighting?: {
    ambient?: {
      color?: number
      intensity?: number
    }
    directional?: {
      color?: number
      intensity?: number
      position?: [number, number, number]
      castShadow?: boolean
    }
    point?: {
      color?: number
      intensity?: number
      position?: [number, number, number]
      distance?: number
    }
  }
  environment?: {
    skybox?: string
    fog?: {
      color?: number
      near?: number
      far?: number
    }
  }
}

export class GLXYRenderer3D {
  protected canvas!: HTMLCanvasElement
  protected scene!: THREE.Scene
  protected camera!: THREE.PerspectiveCamera
  protected renderer!: THREE.WebGLRenderer
  protected controls!: OrbitControls
  protected animationId?: number
  protected objects: Map<string, THREE.Object3D> = new Map()
  protected lights: Map<string, THREE.Light> = new Map()
  protected mixers: Map<string, THREE.AnimationMixer> = new Map()
  protected clock = new THREE.Clock()
  protected frameCount = 0
  private lastFrameTime = performance.now()
  private fps = 60

  constructor(canvas: HTMLCanvasElement, config: RendererConfig = {}) {
    this.canvas = canvas
    this.initRenderer(config)
    this.initScene()
    this.initCamera()
    this.initControls()
    this.setupEventListeners()
  }

  private initRenderer(config: RendererConfig) {
    // High-performance WebGL2 renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: config.antialias ?? true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: true
    })

    // Optimize renderer settings
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.pixelRatio ?? 2))
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false)
    this.renderer.setClearColor(config.backgroundColor ?? 0x000000)

    // Enable advanced features
    this.renderer.shadowMap.enabled = config.shadows ?? true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = config.toneMapping ?? THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    // Optimization settings
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.info.autoReset = false
  }

  private initScene(config: SceneConfig = {}) {
    this.scene = new THREE.Scene()

    // Add fog for depth
    if (config.environment?.fog) {
      const fogConfig = config.environment.fog
      this.scene.fog = new THREE.Fog(
        fogConfig?.color ?? 0x000000,
        fogConfig?.near ?? 10,
        fogConfig?.far ?? 1000
      )
    }

    this.setupLighting(config.lighting)
  }

  private initCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)
  }

  private initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.enableZoom = true
    this.controls.enableRotate = true
    this.controls.enablePan = true
    this.controls.maxPolarAngle = Math.PI * 0.9
    this.controls.minDistance = 1
    this.controls.maxDistance = 100
  }

  private setupLighting(lightingConfig: SceneConfig['lighting'] = {}) {
    const config = lightingConfig

    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      config.ambient?.color ?? 0x404040,
      config.ambient?.intensity ?? 0.4
    )
    this.scene.add(ambientLight)
    this.lights.set('ambient', ambientLight)

    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(
      config.directional?.color ?? 0xffffff,
      config.directional?.intensity ?? 1.0
    )
    directionalLight.position.set(...(config.directional?.position ?? [10, 10, 5]))
    directionalLight.castShadow = config.directional?.castShadow ?? true

    // Optimize shadow settings
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    directionalLight.shadow.bias = -0.0001

    this.scene.add(directionalLight)
    this.lights.set('directional', directionalLight)

    // Optional point light
    if (config.point) {
      const pointLight = new THREE.PointLight(
        config.point.color ?? 0xff6600,
        config.point.intensity ?? 0.5,
        config.point.distance ?? 100
      )
      pointLight.position.set(...(config.point.position ?? [0, 5, 0]))
      pointLight.castShadow = true
      this.scene.add(pointLight)
      this.lights.set('point', pointLight)
    }
  }

  private setupEventListeners() {
    // Handle window resize
    const handleResize = () => {
      const width = this.canvas.clientWidth
      const height = this.canvas.clientHeight
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height, false)
    }

    window.addEventListener('resize', handleResize, { passive: true })

    // Handle canvas resize
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(this.canvas)
  }

  // Public API
  public loadModel(url: string, id: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()

      // Setup Draco loader for compressed models
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/')
      loader.setDRACOLoader(dracoLoader)

      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
              child.receiveShadow = true

              // Optimize materials
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.envMapIntensity = 1
                child.material.needsUpdate = true
              }
            }
          })

          this.scene.add(model)
          this.objects.set(id, model)

          // Setup animation mixer
          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)
            gltf.animations.forEach((clip) => {
              mixer.clipAction(clip).play()
            })
            this.mixers.set(id, mixer)
          }

          resolve(model)
        },
        (progress) => {
          console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(1)}%`)
        },
        (error) => {
          console.error('Error loading model:', error)
          reject(error)
        }
      )
    })
  }

  public createGeometry(type: 'box' | 'sphere' | 'plane' | 'cylinder', params: any = {}): THREE.Mesh {
    let geometry: THREE.BufferGeometry

    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          params.width ?? 1,
          params.height ?? 1,
          params.depth ?? 1
        )
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          params.radius ?? 0.5,
          params.widthSegments ?? 32,
          params.heightSegments ?? 16
        )
        break
      case 'plane':
        geometry = new THREE.PlaneGeometry(
          params.width ?? 1,
          params.height ?? 1
        )
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          params.radiusTop ?? 0.5,
          params.radiusBottom ?? 0.5,
          params.height ?? 1,
          params.radialSegments ?? 8
        )
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }

    const material = new THREE.MeshStandardMaterial({
      color: params.color ?? 0x00ff00,
      metalness: params.metalness ?? 0.3,
      roughness: params.roughness ?? 0.4,
      envMapIntensity: params.envMapIntensity ?? 1
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    if (params.position && Array.isArray(params.position)) {
      mesh.position.set(...params.position as [number, number, number])
    }

    if (params.rotation && Array.isArray(params.rotation)) {
      mesh.rotation.set(...params.rotation as [number, number, number])
    }

    this.scene.add(mesh)
    return mesh
  }

  public removeObject(id: string): boolean {
    const object = this.objects.get(id)
    if (object) {
      this.scene.remove(object)
      this.objects.delete(id)

      // Clean up mixer if exists
      const mixer = this.mixers.get(id)
      if (mixer) {
        mixer.stopAllAction()
        this.mixers.delete(id)
      }
      return true
    }
    return false
  }

  public updateObject(id: string, updates: Partial<THREE.Object3D>): boolean {
    const object = this.objects.get(id)
    if (object) {
      Object.assign(object, updates)
      return true
    }
    return false
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  public getFPS(): number {
    return this.fps
  }

  public getFrameCount(): number {
    return this.frameCount
  }

  public animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate())

    // Calculate FPS
    const currentTime = performance.now()
    const delta = currentTime - this.lastFrameTime
    this.fps = Math.round(1000 / delta)
    this.lastFrameTime = currentTime

    // Update controls
    this.controls.update()

    // Update animations
    const deltaClock = this.clock.getDelta()
    this.mixers.forEach(mixer => mixer.update(deltaClock))

    // Render scene
    this.renderer.render(this.scene, this.camera)
    this.frameCount++

    // Reset renderer info periodically
    if (this.frameCount % 300 === 0) {
      this.renderer.info.reset()
    }
  }

  public start(): void {
    if (!this.animationId) {
      this.animate()
    }
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = undefined
    }
  }

  public dispose(): void {
    this.stop()

    // Dispose all objects
    this.objects.forEach(object => {
      object.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    })

    // Dispose renderers
    this.renderer.dispose()
    this.controls.dispose()

    // Clear references
    this.objects.clear()
    this.lights.clear()
    this.mixers.clear()
  }

  // Performance optimization methods
  public optimizeForPerformance(): void {
    // Reduce shadow map size for better performance
    this.lights.get('directional')?.shadow && (
      (this.lights.get('directional') as THREE.DirectionalLight).shadow.mapSize.set(1024, 1024)
    )

    // Reduce pixel ratio for mobile
    if (window.innerWidth < 768) {
      this.renderer.setPixelRatio(1)
    }
  }

  public setQuality(quality: 'low' | 'medium' | 'high'): void {
    switch (quality) {
      case 'low':
        this.renderer.setPixelRatio(1)
        this.renderer.shadowMap.enabled = false
        this.renderer.toneMapping = THREE.LinearToneMapping
        break
      case 'medium':
        this.renderer.setPixelRatio(1.5)
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.BasicShadowMap
        break
      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        break
    }
  }
}

export default GLXYRenderer3D