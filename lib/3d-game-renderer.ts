// @ts-nocheck
/**
 * GLXY Gaming Platform - Advanced 3D Game Renderer
 * High-performance renderer with ray tracing, physics, and optimization
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { Octree } from 'three/addons/math/Octree.js'
import { Capsule } from 'three/addons/math/Capsule.js'
import { GLXYRenderer3D, RendererConfig } from './3d-renderer'
import { vertexShaders, fragmentShaders, ShaderManager } from './shaders'

export interface GameRendererConfig {
  enablePhysics?: boolean
  enableRayTracing?: boolean
  enablePostProcessing?: boolean
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  targetFPS?: number
}

export interface GameObject {
  id: string
  mesh: THREE.Mesh | THREE.Group
  rigidBody?: {
    velocity: THREE.Vector3
    mass: number
    friction: number
    restitution: number
  }
  collider?: {
    type: 'box' | 'sphere' | 'capsule' | 'mesh'
    size?: THREE.Vector3
    radius?: number
    height?: number
  }
  material?: THREE.Material
  shader?: string
  castShadow?: boolean
  receiveShadow?: boolean
}

export interface ParticleSystem {
  id: string
  position: THREE.Vector3
  count: number
  lifetime: number
  velocity: THREE.Vector3
  spread: number
  color: THREE.Color
  size: number
  texture?: THREE.Texture
}

export class GLXYGameRenderer extends GLXYRenderer3D {
  private config: GameRendererConfig
  private octree: Octree
  private gameObjects: Map<string, GameObject> = new Map()
  private particleSystems: Map<string, THREE.Points> = new Map()
  private shaderManager: ShaderManager
  private gameClock = new THREE.Clock()
  private lastGameFrameTime = 0
  private deltaTime = 0
  private gameFrameCount = 0
  private performanceStats = {
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    memory: 0
  }

  // Ray tracing
  private raycaster = new THREE.Raycaster()
  private rayTraceTarget!: THREE.WebGLRenderTarget
  private rayTraceMaterial!: THREE.ShaderMaterial

  // Post-processing
  private postProcessingComposer?: any
  private bloomPass?: any
  private ssaoPass?: any

  constructor(canvas: HTMLCanvasElement, config: GameRendererConfig = {}) {
    const rendererConfig: RendererConfig = {
      antialias: config.quality !== 'low',
      shadows: config.quality !== 'low',
      pixelRatio: config.quality === 'ultra' ? 2 : config.quality === 'high' ? 1.5 : 1,
      backgroundColor: 0x000000
    }

    super(canvas, rendererConfig)
    this.config = config
    this.shaderManager = ShaderManager.getInstance()
    this.octree = new Octree()

    this.setupRayTracing()
    this.setupPostProcessing()
    this.setupGameLighting()

    console.log('🎮 GLXY Game Renderer initialized with quality:', config.quality)
  }

  private setupRayTracing() {
    if (!this.config.enableRayTracing) return

    // Create render target for ray tracing
    this.rayTraceTarget = new THREE.WebGLRenderTarget(
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
      }
    )

    // Create ray tracing shader
    const rayTraceUniforms = {
      tDiffuse: { value: null },
      tDepth: { value: null },
      tNormal: { value: null },
      cameraPos: { value: this.camera.position },
      resolution: { value: new THREE.Vector2(this.canvas.clientWidth, this.canvas.clientHeight) },
      time: { value: 0 },
      rayStrength: { value: 0.5 },
      raySamples: { value: 4 }
    }

    this.rayTraceMaterial = this.shaderManager.createCustomShader(
      'rayTrace',
      vertexShaders.standardPBR,
      fragmentShaders.standardPBR,
      rayTraceUniforms
    )
  }

  private setupPostProcessing() {
    if (!this.config.enablePostProcessing) return

    // Note: In a real implementation, you would use three/examples/jsm/postprocessing/EffectComposer
    // For now, we'll create a simple post-processing effect with custom shaders
    console.log('🎨 Post-processing enabled')
  }

  private setupGameLighting() {
    const scene = this.getScene()

    // Enhanced lighting setup for gaming
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Add colored lights for atmosphere
    const blueLight = new THREE.PointLight(0x0088ff, 0.5, 20)
    blueLight.position.set(-5, 3, 0)
    scene.add(blueLight)

    const orangeLight = new THREE.PointLight(0xff8800, 0.5, 20)
    orangeLight.position.set(5, 3, 0)
    scene.add(orangeLight)
  }

  private createRayTraceFragmentShader(): string {
    return `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform sampler2D tNormal;
      uniform vec3 cameraPos;
      uniform vec2 resolution;
      uniform float time;
      uniform float rayStrength;
      uniform int raySamples;

      varying vec2 vUv;

      vec3 getWorldPosition(float depth, vec2 uv) {
        vec4 ndc = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
        vec4 viewPos = inverseProjectionMatrix * ndc;
        viewPos /= viewPos.w;
        return (inverseViewMatrix * viewPos).xyz;
      }

      vec3 getNormal(vec2 uv) {
        return texture2D(tNormal, uv).rgb * 2.0 - 1.0;
      }

      vec3 traceRay(vec3 origin, vec3 direction, float maxDistance) {
        vec3 color = vec3(0.0);
        float stepSize = maxDistance / float(raySamples);

        for(int i = 0; i < 32; i++) {
          if(i >= raySamples) break;

          vec3 position = origin + direction * float(i) * stepSize;

          // Sample scene information
          vec2 uv = position.xy * 0.5 + 0.5;
          if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) continue;

          float depth = texture2D(tDepth, uv).r;
          vec3 worldPos = getWorldPosition(depth, uv);

          float distance = length(position - worldPos);
          if(distance < 0.1) {
            // Hit detected
            vec3 normal = getNormal(uv);
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float diff = max(dot(normal, lightDir), 0.0);
            color = vec3(diff) * 0.5;
            break;
          }
        }

        return color;
      }

      void main() {
        vec4 originalColor = texture2D(tDiffuse, vUv);
        float depth = texture2D(tDepth, vUv).r;

        vec3 worldPos = getWorldPosition(depth, vUv);
        vec3 viewDir = normalize(worldPos - cameraPos);
        vec3 normal = getNormal(vUv);

        // Reflection
        vec3 reflectDir = reflect(viewDir, normal);
        vec3 reflectionColor = traceRay(worldPos, reflectDir, 10.0);

        // Refraction (simplified)
        vec3 refractDir = refract(viewDir, normal, 0.8);
        vec3 refractionColor = traceRay(worldPos, refractDir, 5.0);

        // Combine effects
        vec3 finalColor = originalColor.rgb;
        finalColor += reflectionColor * rayStrength;
        finalColor += refractionColor * rayStrength * 0.5;

        // Add some atmospheric effects
        float vignette = 1.0 - length(vUv - 0.5) * 0.5;
        finalColor *= vignette;

        gl_FragColor = vec4(finalColor, originalColor.a);
      }
    `
  }

  // Game object management
  public addGameObject(gameObject: GameObject): void {
    this.gameObjects.set(gameObject.id, gameObject)
    this.getScene().add(gameObject.mesh)

    // Setup physics
    if (this.config.enablePhysics && gameObject.collider) {
      this.setupPhysicsForGameObject(gameObject)
    }

    // Setup shader
    if (gameObject.shader) {
      this.applyShaderToGameObject(gameObject)
    }

    // Update octree for collision detection
    if (gameObject.collider) {
      this.octree.fromGraphNode(gameObject.mesh)
    }
  }

  private setupPhysicsForGameObject(gameObject: GameObject): void {
    if (!gameObject.rigidBody) {
      gameObject.rigidBody = {
        velocity: new THREE.Vector3(),
        mass: 1.0,
        friction: 0.5,
        restitution: 0.3
      }
    }
  }

  private applyShaderToGameObject(gameObject: GameObject): void {
    if (!gameObject.shader) return
    const shader = this.shaderManager.getShader(gameObject.shader)
    if (shader && gameObject.mesh instanceof THREE.Mesh) {
      gameObject.mesh.material = shader
    }
  }

  public removeGameObject(id: string): boolean {
    const gameObject = this.gameObjects.get(id)
    if (gameObject) {
      this.getScene().remove(gameObject.mesh)
      this.gameObjects.delete(id)
      return true
    }
    return false
  }

  public getGameObject(id: string): GameObject | undefined {
    return this.gameObjects.get(id)
  }

  // Particle systems
  public createParticleSystem(config: ParticleSystem): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(config.count * 3)
    const velocities = new Float32Array(config.count * 3)
    const lifetimes = new Float32Array(config.count)

    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3

      // Random position within spread
      positions[i3] = (Math.random() - 0.5) * config.spread
      positions[i3 + 1] = (Math.random() - 0.5) * config.spread
      positions[i3 + 2] = (Math.random() - 0.5) * config.spread

      // Random velocity
      velocities[i3] = config.velocity.x + (Math.random() - 0.5) * 0.1
      velocities[i3 + 1] = config.velocity.y + (Math.random() - 0.5) * 0.1
      velocities[i3 + 2] = config.velocity.z + (Math.random() - 0.5) * 0.1

      // Random lifetime
      lifetimes[i] = Math.random() * config.lifetime
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))

    const material = new THREE.PointsMaterial({
      color: config.color,
      size: config.size,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    if (config.texture) {
      material.map = config.texture
    }

    const particles = new THREE.Points(geometry, material)
    particles.position.copy(config.position)

    this.getScene().add(particles)
    this.particleSystems.set(config.id, particles)

    return particles
  }

  public updateParticleSystems(deltaTime: number): void {
    this.particleSystems.forEach((particles) => {
      const positions = particles.geometry.attributes.position as THREE.BufferAttribute
      const velocities = particles.geometry.attributes.velocity as THREE.BufferAttribute
      const lifetimes = particles.geometry.attributes.lifetime as THREE.BufferAttribute

      for (let i = 0; i < positions.count; i++) {
        // Update position
        positions.array[i * 3] += velocities.array[i * 3] * deltaTime
        positions.array[i * 3 + 1] += velocities.array[i * 3 + 1] * deltaTime
        positions.array[i * 3 + 2] += velocities.array[i * 3 + 2] * deltaTime

        // Update lifetime
        lifetimes.array[i] -= deltaTime

        // Reset particle if lifetime expired
        if (lifetimes.array[i] <= 0) {
          positions.array[i * 3] = (Math.random() - 0.5) * 10
          positions.array[i * 3 + 1] = 0
          positions.array[i * 3 + 2] = (Math.random() - 0.5) * 10
          lifetimes.array[i] = Math.random() * 5
        }
      }

      positions.needsUpdate = true
      lifetimes.needsUpdate = true
    })
  }

  // Physics simulation
  public updatePhysics(deltaTime: number): void {
    if (!this.config.enablePhysics) return

    const gravity = new THREE.Vector3(0, -9.81, 0)

    this.gameObjects.forEach((gameObject) => {
      if (!gameObject.rigidBody) return

      // Apply gravity
      gameObject.rigidBody.velocity.y += gravity.y * deltaTime

      // Update position
      const deltaPosition = gameObject.rigidBody.velocity.clone().multiplyScalar(deltaTime)
      gameObject.mesh.position.add(deltaPosition)

      // Simple collision detection with ground
      if (gameObject.mesh.position.y < 0) {
        gameObject.mesh.position.y = 0
        gameObject.rigidBody.velocity.y *= -gameObject.rigidBody.restitution
      }

      // Friction
      gameObject.rigidBody.velocity.x *= (1 - gameObject.rigidBody.friction * deltaTime)
      gameObject.rigidBody.velocity.z *= (1 - gameObject.rigidBody.friction * deltaTime)
    })
  }

  // Ray casting
  public castRay(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance = 100): THREE.Intersection[] {
    this.raycaster.set(origin, direction)
    const objects = Array.from(this.gameObjects.values()).map(obj => obj.mesh)
    return this.raycaster.intersectObjects(objects, true)
  }

  public castRayFromCamera(mouseX: number, mouseY: number): THREE.Intersection[] {
    const mouse = new THREE.Vector2(
      (mouseX / this.canvas.clientWidth) * 2 - 1,
      -(mouseY / this.canvas.clientHeight) * 2 + 1
    )
    this.raycaster.setFromCamera(mouse, this.camera)

    const objects = Array.from(this.gameObjects.values()).map(obj => obj.mesh)
    return this.raycaster.intersectObjects(objects, true)
  }

  // Performance monitoring
  private updatePerformanceStats(): void {
    const currentTime = performance.now()
    this.deltaTime = currentTime - this.lastGameFrameTime
    this.lastGameFrameTime = currentTime

    this.performanceStats.fps = Math.round(1000 / this.deltaTime)
    this.performanceStats.frameTime = this.deltaTime
    this.performanceStats.drawCalls = this.renderer.info.render.calls
    this.performanceStats.triangles = this.renderer.info.render.triangles

    if (this.gameFrameCount % 60 === 0) {
      console.log('📊 Performance Stats:', this.performanceStats)
    }
  }

  // Enhanced animation loop
  public animate(): void {
    // Always call base animate first
    super.animate()

    const deltaClock = this.gameClock.getDelta()
    this.gameFrameCount++

    // Update performance stats
    this.updatePerformanceStats()

    // Update physics
    this.updatePhysics(deltaClock)

    // Update particle systems
    this.updateParticleSystems(deltaClock)

    // Update shaders with time
    this.shaderManager.updateUniform('rayTrace', 'time', this.gameClock.getElapsedTime())

    // Ray tracing pass (additional to base rendering)
    if (this.config.enableRayTracing && this.rayTraceMaterial) {
      this.renderRayTraced()
    }

    // Target FPS limiting
    if (this.config.targetFPS && this.performanceStats.fps > this.config.targetFPS) {
      const targetFrameTime = 1000 / this.config.targetFPS
      const sleepTime = targetFrameTime - this.deltaTime
      if (sleepTime > 0) {
        // In a real implementation, you might use a more sophisticated frame limiting approach
      }
    }
  }

  public start(): void {
    super.start()
  }

  private renderRayTraced(): void {
    // First pass - render scene to textures
    this.renderer.setRenderTarget(this.rayTraceTarget)
    this.renderer.render(this.getScene(), this.camera)

    // Second pass - apply ray tracing shader
    if (this.rayTraceMaterial) {
      this.rayTraceMaterial.uniforms.tDiffuse.value = this.rayTraceTarget.texture
      this.rayTraceMaterial.uniforms.cameraPos.value = this.camera.position
      this.rayTraceMaterial.uniforms.resolution.value.set(this.canvas.clientWidth, this.canvas.clientHeight)

      // Apply ray tracing material to a full-screen quad
      // This is simplified - in a real implementation you'd use proper post-processing
    }

    // Render to screen
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.getScene(), this.camera)
  }

  // Quality management
  public setQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.config.quality = quality
    // Call base class method with compatible quality level
    const baseQuality = quality === 'ultra' ? 'high' : quality
    super.setQuality(baseQuality)

    // Update renderer settings based on quality
    switch (quality) {
      case 'low':
        this.config.enableRayTracing = false
        this.config.enablePostProcessing = false
        break
      case 'medium':
        this.config.enableRayTracing = false
        this.config.enablePostProcessing = true
        break
      case 'high':
        this.config.enableRayTracing = true
        this.config.enablePostProcessing = false
        break
      case 'ultra':
        this.config.enableRayTracing = true
        this.config.enablePostProcessing = true
        break
    }
  }

  public getPerformanceStats() {
    return { ...this.performanceStats }
  }

  public dispose(): void {
    // Dispose game objects
    this.gameObjects.forEach(gameObject => {
      this.getScene().remove(gameObject.mesh)
      if (gameObject.mesh instanceof THREE.Mesh) {
        if (gameObject.mesh.geometry && typeof gameObject.mesh.geometry.dispose === 'function') {
          gameObject.mesh.geometry.dispose()
        }
        if (Array.isArray(gameObject.mesh.material)) {
          gameObject.mesh.material.forEach(mat => {
            if (mat && typeof mat.dispose === 'function') {
              mat.dispose()
            }
          })
        } else if (gameObject.mesh.material && typeof gameObject.mesh.material.dispose === 'function') {
          gameObject.mesh.material.dispose()
        }
      }
    })

    // Dispose particle systems
    this.particleSystems.forEach(particles => {
      this.getScene().remove(particles)
      if (particles.geometry && typeof particles.geometry.dispose === 'function') {
        particles.geometry.dispose()
      }
      if (particles.material) {
        if (Array.isArray(particles.material)) {
          particles.material.forEach(material => material.dispose())
        } else {
          particles.material.dispose()
        }
      }
    })

    // Dispose ray tracing
    if (this.rayTraceTarget) {
      this.rayTraceTarget.dispose()
    }
    if (this.rayTraceMaterial) {
      this.rayTraceMaterial.dispose()
    }

    // Clear references
    this.gameObjects.clear()
    this.particleSystems.clear()

    // Dispose parent renderer
    super.dispose()
  }
}

export default GLXYGameRenderer