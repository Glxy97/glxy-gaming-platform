// @ts-nocheck
'use client'

import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

export interface EnhancedGraphicsSettings {
  rayTracing: boolean
  dynamicShadows: boolean
  bloodEffects: boolean
  particleQuality: 'low' | 'medium' | 'high' | 'ultra'
  textureQuality: 'low' | 'medium' | 'high' | 'ultra'
  shadowResolution: 512 | 1024 | 2048 | 4096
  antiAliasing: boolean
  ambientOcclusion: boolean
  bloom: boolean
  motionBlur: boolean
  depthOfField: boolean
  screenSpaceReflections: boolean
  volumetricFog: boolean
  lensFlare: boolean
}

export interface BloodEffect {
  id: string
  position: THREE.Vector3
  direction: THREE.Vector3
  intensity: number
  type: 'bullet_hit' | 'explosion' | 'melee' | 'headshot'
  particles: BloodParticle[]
  decal?: THREE.Mesh
  lifetime: number
  maxLifetime: number
}

export interface BloodParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  size: number
  color: THREE.Color
  lifetime: number
}

export interface RayTracedReflection {
  surface: THREE.Mesh
  reflectivity: number
  roughness: number
  metalness: number
  normalMap?: THREE.Texture
}

export const GLXY_ENHANCED_GRAPHICS = {
  // Default graphics settings
  DEFAULT_SETTINGS: {
    rayTracing: false, // Requires WebGL 2.0
    dynamicShadows: true,
    bloodEffects: true,
    particleQuality: 'high',
    textureQuality: 'high',
    shadowResolution: 2048,
    antiAliasing: true,
    ambientOcclusion: true,
    bloom: true,
    motionBlur: false,
    depthOfField: false,
    screenSpaceReflections: true,
    volumetricFog: true,
    lensFlare: true
  } as EnhancedGraphicsSettings,

  // Blood effect settings
  BLOOD_PARTICLE_COUNT: 50,
  BLOOD_LIFETIME: 5000, // 5 seconds
  BLOOD_DECAL_SIZE: 0.5,
  BLOOD_SPLATTER_RADIUS: 2,
  BLOOD_COLOR: new THREE.Color(0.8, 0.1, 0.1),

  // Ray tracing settings
  RAY_TRACING_SAMPLES: 4,
  MAX_REFLECTION_BOUNCES: 3,
  RAY_TRACING_MAX_DISTANCE: 100,

  // Shadow settings
  SHADOW_CAMERA_NEAR: 0.1,
  SHADOW_CAMERA_FAR: 200,
  SHADOW_CAMERA_LEFT: -50,
  SHADOW_CAMERA_RIGHT: 50,
  SHADOW_CAMERA_TOP: 50,
  SHADOW_CAMERA_BOTTOM: -50,

  // Visual effect settings
  BLOOM_STRENGTH: 0.5,
  BLOOM_RADIUS: 0.4,
  BLOOM_THRESHOLD: 0.85,
  AMBIENT_OCCLUSION_RADIUS: 0.3,
  MOTION_BLUR_STRENGTH: 0.3,
  DEPTH_OF_FIELD_FOCUS_DISTANCE: 10,
  VOLUMETRIC_FOG_DENSITY: 0.02
}

export class EnhancedGraphicsSystem {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private settings!: EnhancedGraphicsSettings
  private bloodEffects!: Map<string, BloodEffect>
  private rayTracedSurfaces!: RayTracedReflection[]
  private postProcessingStack!: any[]
  private renderTarget!: THREE.WebGLRenderTarget
  private composer!: any // EffectComposer

  // Shadow mapping
  private directionalLights!: THREE.DirectionalLight[]
  private spotLights!: THREE.SpotLight[]
  private pointLights!: THREE.PointLight[]

  // Blood effect geometry
  private bloodParticleGeometry!: THREE.BufferGeometry
  private bloodParticleMaterial!: THREE.PointsMaterial
  private bloodDecalMaterial!: THREE.MeshStandardMaterial

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.settings = { ...GLXY_ENHANCED_GRAPHICS.DEFAULT_SETTINGS }
    this.bloodEffects = new Map()
    this.rayTracedSurfaces = []
    this.postProcessingStack = []
    this.directionalLights = []
    this.spotLights = []
    this.pointLights = []

    this.initializeSystem()
  }

  private initializeSystem() {
    this.setupRenderer()
    this.createBloodEffectMaterials()
    this.setupShadows()
    this.setupPostProcessing()
  }

  // RENDERER SETUP
  private setupRenderer() {
    // Enable advanced rendering features
    this.renderer.shadowMap.enabled = this.settings.dynamicShadows
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Anti-aliasing
    if (this.settings.antiAliasing) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    // Color space and tone mapping
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    // Physical-based rendering (physicallyCorrectLights property not available in this Three.js version)
    // this.renderer.physicallyCorrectLights = true

    // Create render target for post-processing
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.renderer.domElement.width,
      this.renderer.domElement.height,
      {
        format: THREE.RGBAFormat,
        type: THREE.FloatType
      }
    )
  }

  // SHADOW SYSTEM
  private setupShadows() {
    // Configure shadow map resolution
    this.renderer.shadowMap.enabled = this.settings.dynamicShadows

    // Find and configure all lights in the scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight && object.castShadow) {
        this.configureDirectionalLightShadows(object)
        this.directionalLights.push(object)
      } else if (object instanceof THREE.SpotLight && object.castShadow) {
        this.configureSpotLightShadows(object)
        this.spotLights.push(object)
      } else if (object instanceof THREE.PointLight && object.castShadow) {
        this.configurePointLightShadows(object)
        this.pointLights.push(object)
      }
    })
  }

  private configureDirectionalLightShadows(light: THREE.DirectionalLight) {
    light.shadow.mapSize.width = this.settings.shadowResolution
    light.shadow.mapSize.height = this.settings.shadowResolution
    light.shadow.camera.near = GLXY_ENHANCED_GRAPHICS.SHADOW_CAMERA_NEAR
    light.shadow.camera.far = GLXY_ENHANCED_GRAPHICS.SHADOW_CAMERA_FAR
    light.shadow.camera.left = GLXY_ENHANCED_GRAPHICS.SHADOW_CAMERA_LEFT
    light.shadow.camera.right = GLXY_ENHANCED_GRAPHICS.SHADOW_CAMERA_RIGHT
    light.shadow.camera.top = GLXY_ENHANCED_GRAPHICS.SHADOW_CAMERA_TOP
    light.shadow.camera.bottom = GLXY_ENHANCED_GRAPHICS.SHADOW_CAMERA_BOTTOM
    light.shadow.bias = -0.0001
    light.shadow.normalBias = 0.02
  }

  private configureSpotLightShadows(light: THREE.SpotLight) {
    light.shadow.mapSize.width = this.settings.shadowResolution / 2
    light.shadow.mapSize.height = this.settings.shadowResolution / 2
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 50
    light.shadow.bias = -0.0001
  }

  private configurePointLightShadows(light: THREE.PointLight) {
    light.shadow.mapSize.width = this.settings.shadowResolution / 4
    light.shadow.mapSize.height = this.settings.shadowResolution / 4
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 25
    light.shadow.bias = -0.0001
  }

  // BLOOD EFFECTS SYSTEM
  private createBloodEffectMaterials() {
    // Blood particle material
    this.bloodParticleMaterial = new THREE.PointsMaterial({
      color: GLXY_ENHANCED_GRAPHICS.BLOOD_COLOR,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })

    // Blood decal material
    this.bloodDecalMaterial = new THREE.MeshStandardMaterial({
      color: GLXY_ENHANCED_GRAPHICS.BLOOD_COLOR,
      roughness: 0.8,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
      normalScale: new THREE.Vector2(1, 1)
    })

    // Create blood particle geometry
    const positions = new Float32Array(GLXY_ENHANCED_GRAPHICS.BLOOD_PARTICLE_COUNT * 3)
    const colors = new Float32Array(GLXY_ENHANCED_GRAPHICS.BLOOD_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(GLXY_ENHANCED_GRAPHICS.BLOOD_PARTICLE_COUNT)

    for (let i = 0; i < GLXY_ENHANCED_GRAPHICS.BLOOD_PARTICLE_COUNT; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      colors[i * 3] = 0.8
      colors[i * 3 + 1] = 0.1
      colors[i * 3 + 2] = 0.1

      sizes[i] = Math.random() * 0.05 + 0.02
    }

    this.bloodParticleGeometry = new THREE.BufferGeometry()
    this.bloodParticleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.bloodParticleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.bloodParticleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  }

  public createBloodEffect(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    intensity: number = 1.0,
    type: BloodEffect['type'] = 'bullet_hit'
  ): string {
    if (!this.settings.bloodEffects) return ''

    const id = `blood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const particles: BloodParticle[] = []

    // Create blood particles
    const particleCount = Math.floor(GLXY_ENHANCED_GRAPHICS.BLOOD_PARTICLE_COUNT * intensity)

    for (let i = 0; i < particleCount; i++) {
      const spreadAngle = Math.random() * Math.PI * 2
      const spreadRadius = Math.random() * GLXY_ENHANCED_GRAPHICS.BLOOD_SPLATTER_RADIUS
      const speed = Math.random() * 5 + 2

      const velocity = new THREE.Vector3(
        Math.sin(spreadAngle) * spreadRadius * 0.1,
        Math.random() * 3 + 1,
        Math.cos(spreadAngle) * spreadRadius * 0.1
      ).add(direction.clone().multiplyScalar(speed))

      particles.push({
        position: position.clone(),
        velocity,
        size: Math.random() * 0.03 + 0.01,
        color: new THREE.Color(
          0.6 + Math.random() * 0.4,
          0.05 + Math.random() * 0.1,
          0.05 + Math.random() * 0.1
        ),
        lifetime: GLXY_ENHANCED_GRAPHICS.BLOOD_LIFETIME
      })
    }

    // Create blood decal on nearby surfaces
    this.createBloodDecal(position, direction, intensity, type)

    const bloodEffect: BloodEffect = {
      id,
      position: position.clone(),
      direction: direction.clone(),
      intensity,
      type,
      particles,
      lifetime: 0,
      maxLifetime: GLXY_ENHANCED_GRAPHICS.BLOOD_LIFETIME
    }

    this.bloodEffects.set(id, bloodEffect)

    console.log(`🩸 Created blood effect: ${type} at position`, position)
    return id
  }

  private createBloodDecal(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    intensity: number,
    type: BloodEffect['type']
  ) {
    // Raycast to find surface for decal
    const raycaster = new THREE.Raycaster(position, direction.clone().multiplyScalar(-1))
    const intersects = raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0) {
      const intersection = intersects[0]

      // Create simple blood stain using PlaneGeometry instead of DecalGeometry
      const decalGeometry = new THREE.PlaneGeometry(
        GLXY_ENHANCED_GRAPHICS.BLOOD_DECAL_SIZE * intensity,
        GLXY_ENHANCED_GRAPHICS.BLOOD_DECAL_SIZE * intensity
      )

      const decalMaterial = this.bloodDecalMaterial.clone()
      const decal = new THREE.Mesh(decalGeometry, decalMaterial)

      // Position and orient the decal on the surface
      decal.position.copy(intersection.point)
      decal.lookAt(intersection.point.clone().add(intersection.face!.normal))

      // Move decal slightly away from surface to prevent z-fighting
      decal.translateZ(0.01)

      this.scene.add(decal)

      // Remove decal after lifetime
      setTimeout(() => {
        this.scene.remove(decal)
        decalGeometry.dispose()
        decalMaterial.dispose()
      }, GLXY_ENHANCED_GRAPHICS.BLOOD_LIFETIME)
    }
  }

  // RAY TRACING SYSTEM (Simplified for WebGL)
  public enableRayTracing(surfaces: RayTracedReflection[]) {
    if (!this.settings.rayTracing) return

    this.rayTracedSurfaces = surfaces

    surfaces.forEach(surface => {
      if (surface.surface.material instanceof THREE.MeshStandardMaterial) {
        surface.surface.material.envMapIntensity = surface.reflectivity
        surface.surface.material.roughness = surface.roughness
        surface.surface.material.metalness = surface.metalness
      }
    })

    console.log(`🔮 Enabled ray tracing on ${surfaces.length} surfaces`)
  }

  public renderRayTracedReflections(camera: THREE.PerspectiveCamera) {
    if (!this.settings.rayTracing || this.rayTracedSurfaces.length === 0) return

    // Simplified ray tracing using environment maps
    this.rayTracedSurfaces.forEach(surface => {
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256)
      const reflectCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget)
      reflectCamera.position.copy(surface.surface.position)
      this.scene.add(reflectCamera)

      // Update reflection
      reflectCamera.update(this.renderer, this.scene)

      if (surface.surface.material instanceof THREE.MeshStandardMaterial) {
        surface.surface.material.envMap = cubeRenderTarget.texture
      }

      this.scene.remove(reflectCamera)
    })
  }

  // POST-PROCESSING SYSTEM
  private setupPostProcessing() {
    // This would typically use EffectComposer from three/examples/jsm/postprocessing
    // For now, we'll implement basic effects manually

    this.postProcessingStack = []

    if (this.settings.bloom) {
      this.setupBloomEffect()
    }

    if (this.settings.ambientOcclusion) {
      this.setupAmbientOcclusion()
    }

    if (this.settings.motionBlur) {
      this.setupMotionBlur()
    }

    if (this.settings.depthOfField) {
      this.setupDepthOfField()
    }
  }

  private setupBloomEffect() {
    // Simplified bloom implementation
    this.postProcessingStack.push({
      type: 'bloom',
      strength: GLXY_ENHANCED_GRAPHICS.BLOOM_STRENGTH,
      radius: GLXY_ENHANCED_GRAPHICS.BLOOM_RADIUS,
      threshold: GLXY_ENHANCED_GRAPHICS.BLOOM_THRESHOLD
    })
  }

  private setupAmbientOcclusion() {
    // Simplified AO implementation
    this.postProcessingStack.push({
      type: 'ao',
      radius: GLXY_ENHANCED_GRAPHICS.AMBIENT_OCCLUSION_RADIUS,
      power: 1.0
    })
  }

  private setupMotionBlur() {
    // Simplified motion blur implementation
    this.postProcessingStack.push({
      type: 'motionBlur',
      strength: GLXY_ENHANCED_GRAPHICS.MOTION_BLUR_STRENGTH
    })
  }

  private setupDepthOfField() {
    // Simplified depth of field implementation
    this.postProcessingStack.push({
      type: 'dof',
      focusDistance: GLXY_ENHANCED_GRAPHICS.DEPTH_OF_FIELD_FOCUS_DISTANCE,
      aperture: 0.1
    })
  }

  // UPDATE SYSTEMS
  public update(deltaTime: number) {
    this.updateBloodEffects(deltaTime)
    this.updatePostProcessing(deltaTime)

    if (this.settings.rayTracing) {
      this.renderRayTracedReflections(this.camera)
    }
  }

  private updateBloodEffects(deltaTime: number) {
    const toRemove: string[] = []

    this.bloodEffects.forEach((effect, id) => {
      effect.lifetime += deltaTime

      // Update particles
      effect.particles.forEach(particle => {
        particle.velocity.y -= 9.8 * deltaTime // Gravity
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime))
        particle.lifetime -= deltaTime
      })

      // Remove dead particles
      effect.particles = effect.particles.filter(p => p.lifetime > 0)

      // Mark for removal if lifetime exceeded
      if (effect.lifetime > effect.maxLifetime || effect.particles.length === 0) {
        toRemove.push(id)
      }
    })

    // Remove expired effects
    toRemove.forEach(id => this.bloodEffects.delete(id))
  }

  private updatePostProcessing(deltaTime: number) {
    // Update post-processing effects
    this.postProcessingStack.forEach(effect => {
      switch (effect.type) {
        case 'motionBlur':
          // Update motion blur based on camera movement
          break
        case 'dof':
          // Update depth of field focus
          break
      }
    })
  }

  // RENDER PIPELINE
  public render() {
    // 1. Shadow map rendering
    if (this.settings.dynamicShadows) {
      this.renderShadowMaps()
    }

    // 2. Main scene render
    this.renderer.render(this.scene, this.camera)

    // 3. Post-processing
    if (this.postProcessingStack.length > 0) {
      this.applyPostProcessing()
    }

    // 4. Blood effects overlay
    if (this.settings.bloodEffects) {
      this.renderBloodEffects()
    }
  }

  private renderShadowMaps() {
    // Render shadow maps for all lights
    this.directionalLights.forEach(light => {
      if (light.castShadow) {
        this.renderer.setRenderTarget(light.shadow.map!)
        this.renderer.render(this.scene, light.shadow.camera!)
      }
    })
  }

  private renderBloodEffects() {
    // Render blood particles
    this.bloodEffects.forEach(effect => {
      if (effect.particles.length === 0) return

      const positions = new Float32Array(effect.particles.length * 3)
      const colors = new Float32Array(effect.particles.length * 3)
      const sizes = new Float32Array(effect.particles.length)

      effect.particles.forEach((particle, i) => {
        positions[i * 3] = particle.position.x
        positions[i * 3 + 1] = particle.position.y
        positions[i * 3 + 2] = particle.position.z

        colors[i * 3] = particle.color.r
        colors[i * 3 + 1] = particle.color.g
        colors[i * 3 + 2] = particle.color.b

        sizes[i] = particle.size
      })

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = this.bloodParticleMaterial.clone()
      const opacity = Math.max(0, 1 - effect.lifetime / effect.maxLifetime)
      material.opacity = opacity

      const points = new THREE.Points(geometry, material)
      this.scene.add(points)

      // Remove after render
      this.scene.remove(points)
      geometry.dispose()
      material.dispose()
    })
  }

  private applyPostProcessing() {
    // Apply post-processing effects
    // This would typically use a render pipeline with multiple passes
    // For now, we'll apply basic effects manually
  }

  // SETTINGS MANAGEMENT
  public updateSettings(newSettings: Partial<EnhancedGraphicsSettings>) {
    this.settings = { ...this.settings, ...newSettings }

    // Apply settings immediately
    this.renderer.shadowMap.enabled = this.settings.dynamicShadows

    if (this.settings.antiAliasing) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    } else {
      this.renderer.setPixelRatio(1)
    }

    // Recreate materials if needed
    if (newSettings.bloodEffects !== undefined) {
      this.createBloodEffectMaterials()
    }

    console.log('🎨 Updated enhanced graphics settings:', this.settings)
  }

  public getSettings(): EnhancedGraphicsSettings {
    return { ...this.settings }
  }

  // PERFORMANCE MONITORING
  public getMemoryUsage() {
    const info = this.renderer.info
    return {
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length || 0,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines
    }
  }

  public getPerformanceMetrics() {
    return {
      bloodEffectsCount: this.bloodEffects.size,
      rayTracedSurfaces: this.rayTracedSurfaces.length,
      postProcessingEffects: this.postProcessingStack.length,
      shadowCastingLights: this.directionalLights.length + this.spotLights.length + this.pointLights.length
    }
  }

  // CLEANUP
  public destroy() {
    // Clean up blood effects
    this.bloodEffects.clear()

    // Clean up ray tracing
    this.rayTracedSurfaces = []

    // Clean up post-processing
    this.postProcessingStack = []

    // Clean up render targets
    if (this.renderTarget) {
      this.renderTarget.dispose()
    }

    // Clean up materials
    if (this.bloodParticleMaterial) {
      this.bloodParticleMaterial.dispose()
    }
    if (this.bloodDecalMaterial) {
      this.bloodDecalMaterial.dispose()
    }
    if (this.bloodParticleGeometry) {
      this.bloodParticleGeometry.dispose()
    }

    console.log('🧹 Enhanced graphics system destroyed')
  }
}

// React component for Enhanced Graphics Settings
export const EnhancedGraphicsControls: React.FC<{
  graphicsSystem: EnhancedGraphicsSystem
  isVisible: boolean
  onSettingsChange: (settings: EnhancedGraphicsSettings) => void
}> = ({ graphicsSystem, isVisible, onSettingsChange }) => {
  const [settings, setSettings] = React.useState(graphicsSystem.getSettings())
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const updateSetting = (key: keyof EnhancedGraphicsSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    graphicsSystem.updateSettings({ [key]: value })
    onSettingsChange(newSettings)
  }

  if (!isVisible) return null

  return (
    <div className="enhanced-graphics-controls">
      <div className="graphics-panel">
        <h3>🎨 Enhanced Graphics</h3>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.dynamicShadows}
              onChange={(e) => updateSetting('dynamicShadows', e.target.checked)}
            />
            Dynamic Shadows
          </label>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.bloodEffects}
              onChange={(e) => updateSetting('bloodEffects', e.target.checked)}
            />
            Blood Effects
          </label>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.antiAliasing}
              onChange={(e) => updateSetting('antiAliasing', e.target.checked)}
            />
            Anti-Aliasing
          </label>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.bloom}
              onChange={(e) => updateSetting('bloom', e.target.checked)}
            />
            Bloom Effect
          </label>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.ambientOcclusion}
              onChange={(e) => updateSetting('ambientOcclusion', e.target.checked)}
            />
            Ambient Occlusion
          </label>
        </div>

        <div className="setting-group">
          <label>Shadow Quality:</label>
          <select
            value={settings.shadowResolution}
            onChange={(e) => updateSetting('shadowResolution', Number(e.target.value))}
          >
            <option value={512}>Low</option>
            <option value={1024}>Medium</option>
            <option value={2048}>High</option>
            <option value={4096}>Ultra</option>
          </select>
        </div>

        <div className="setting-group">
          <label>Particle Quality:</label>
          <select
            value={settings.particleQuality}
            onChange={(e) => updateSetting('particleQuality', e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="advanced-toggle"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="advanced-settings">
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.rayTracing}
                  onChange={(e) => updateSetting('rayTracing', e.target.checked)}
                />
                Ray Tracing (Experimental)
              </label>
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.motionBlur}
                  onChange={(e) => updateSetting('motionBlur', e.target.checked)}
                />
                Motion Blur
              </label>
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.depthOfField}
                  onChange={(e) => updateSetting('depthOfField', e.target.checked)}
                />
                Depth of Field
              </label>
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.screenSpaceReflections}
                  onChange={(e) => updateSetting('screenSpaceReflections', e.target.checked)}
                />
                Screen Space Reflections
              </label>
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.volumetricFog}
                  onChange={(e) => updateSetting('volumetricFog', e.target.checked)}
                />
                Volumetric Fog
              </label>
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.lensFlare}
                  onChange={(e) => updateSetting('lensFlare', e.target.checked)}
                />
                Lens Flare
              </label>
            </div>
          </div>
        )}

        <div className="performance-info">
          <h4>Performance Metrics</h4>
          {Object.entries(graphicsSystem.getPerformanceMetrics()).map(([key, value]) => (
            <div key={key} className="metric">
              <span>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .enhanced-graphics-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          pointer-events: auto;
        }

        .graphics-panel {
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #ff6b00;
          border-radius: 12px;
          padding: 20px;
          color: white;
          min-width: 300px;
          max-width: 400px;
        }

        .graphics-panel h3 {
          color: #ff6b00;
          margin-bottom: 15px;
          text-align: center;
          font-size: 18px;
        }

        .setting-group {
          margin: 10px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .setting-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #e0e0e0;
        }

        .setting-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .setting-group select {
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
        }

        .advanced-toggle {
          width: 100%;
          background: #ff6b00;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px;
          margin: 15px 0;
          cursor: pointer;
          font-size: 14px;
        }

        .advanced-toggle:hover {
          background: #ff8533;
        }

        .advanced-settings {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #444;
        }

        .performance-info {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #444;
        }

        .performance-info h4 {
          color: #ff6b00;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin: 5px 0;
          color: #ccc;
        }

        .metric span:first-child {
          text-transform: capitalize;
        }
      `}</style>
    </div>
  )
}

export default EnhancedGraphicsSystem