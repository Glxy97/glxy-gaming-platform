// @ts-nocheck
/**
 * GLXY Advanced Graphics Renderer
 * High-end visual effects including dynamic shadows, reflections, volumetric lighting
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export interface GraphicsConfig {
  enableDynamicShadows: boolean
  enableScreenSpaceReflections: boolean
  enableVolumetricLighting: boolean
  enableAmbientOcclusion: boolean
  enableBloom: boolean
  enableMotionBlur: boolean
  shadowQuality: 'low' | 'medium' | 'high' | 'ultra'
  reflectionQuality: 'low' | 'medium' | 'high'
  lightingQuality: 'low' | 'medium' | 'high' | 'ultra'
  maxShadowLights: number
  volumetricFogDensity: number
  bloomIntensity: number
  aoStrength: number
}

export interface GraphicsStats {
  shadowRenderTime: number
  reflectionRenderTime: number
  lightingRenderTime: number
  postProcessTime: number
  totalRenderTime: number
  shadowMapSize: number
  activeLights: number
  volumetricSamples: number
}

export class AdvancedGraphicsRenderer {
  private config: GraphicsConfig
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private camera: THREE.PerspectiveCamera

  // Shadow mapping
  private shadowLights: THREE.DirectionalLight[] = []
  private shadowCameraNear = 0.1
  private shadowCameraFar = 500
  private shadowCameraLeft = -50
  private shadowCameraRight = 50
  private shadowCameraTop = 50
  private shadowCameraBottom = -50

  // Screen Space Reflections
  private ssrRenderTarget!: THREE.WebGLRenderTarget
  private ssrMaterial!: THREE.ShaderMaterial
  private ssrCamera!: THREE.OrthographicCamera

  // Volumetric Lighting
  private volumetricRenderTarget!: THREE.WebGLRenderTarget
  private volumetricMaterial!: THREE.ShaderMaterial
  private volumetricLightVolumes: THREE.Mesh[] = []

  // Post-processing
  private postProcessingRenderTarget!: THREE.WebGLRenderTarget
  private bloomMaterial!: THREE.ShaderMaterial
  private aoMaterial!: THREE.ShaderMaterial
  private motionBlurMaterial!: THREE.ShaderMaterial
  private postProcessingCamera!: THREE.OrthographicCamera

  // Performance monitoring
  private stats: GraphicsStats = {
    shadowRenderTime: 0,
    reflectionRenderTime: 0,
    lightingRenderTime: 0,
    postProcessTime: 0,
    totalRenderTime: 0,
    shadowMapSize: 2048,
    activeLights: 0,
    volumetricSamples: 64
  }

  // Time-based effects
  private clock = new THREE.Clock()
  private frameCount = 0

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, config: Partial<GraphicsConfig> = {}) {
    this.scene = scene
    this.renderer = renderer
    this.camera = camera

    this.config = {
      enableDynamicShadows: true,
      enableScreenSpaceReflections: true,
      enableVolumetricLighting: true,
      enableAmbientOcclusion: true,
      enableBloom: true,
      enableMotionBlur: false,
      shadowQuality: 'high',
      reflectionQuality: 'high',
      lightingQuality: 'high',
      maxShadowLights: 4,
      volumetricFogDensity: 0.02,
      bloomIntensity: 0.5,
      aoStrength: 1.0,
      ...config
    }

    this.initializeRenderTargets()
    this.initializeMaterials()
    this.setupLighting()
    this.updateShadowQuality()

    console.log('🎨 Advanced Graphics Renderer initialized')
  }

  private initializeRenderTargets(): void {
    const width = this.renderer.domElement.clientWidth
    const height = this.renderer.domElement.clientHeight

    // Screen Space Reflections render target
    this.ssrRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    })

    // Volumetric lighting render target
    this.volumetricRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      type: THREE.HalfFloatType
    })

    // Post-processing render target
    this.postProcessingRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    })

    // Full-screen quad cameras
    this.ssrCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.postProcessingCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  }

  private initializeMaterials(): void {
    // Screen Space Reflections material
    const ssrShader = this.createSSRShader()
    this.ssrMaterial = new THREE.ShaderMaterial({
      uniforms: ssrShader.uniforms,
      vertexShader: ssrShader.vertexShader,
      fragmentShader: ssrShader.fragmentShader
    })

    // Volumetric lighting material
    const volumetricShader = this.createVolumetricShader()
    this.volumetricMaterial = new THREE.ShaderMaterial({
      uniforms: volumetricShader.uniforms,
      vertexShader: volumetricShader.vertexShader,
      fragmentShader: volumetricShader.fragmentShader,
      transparent: true,
      depthWrite: false
    })

    // Bloom material
    const bloomShader = this.createBloomShader()
    this.bloomMaterial = new THREE.ShaderMaterial({
      uniforms: bloomShader.uniforms,
      vertexShader: bloomShader.vertexShader,
      fragmentShader: bloomShader.fragmentShader
    })

    // Ambient Occlusion material
    const aoShader = this.createAOShader()
    this.aoMaterial = new THREE.ShaderMaterial({
      uniforms: aoShader.uniforms,
      vertexShader: aoShader.vertexShader,
      fragmentShader: aoShader.fragmentShader
    })

    // Motion blur material
    const motionBlurShader = this.createMotionBlurShader()
    this.motionBlurMaterial = new THREE.ShaderMaterial({
      uniforms: motionBlurShader.uniforms,
      vertexShader: motionBlurShader.vertexShader,
      fragmentShader: motionBlurShader.fragmentShader
    })
  }

  private createSSRShader() {
    return {
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        tMetalness: { value: null },
        tRoughness: { value: null },
        cameraMatrixWorld: { value: this.camera.matrixWorld },
        projectionMatrixInverse: { value: this.camera.projectionMatrixInverse },
        viewMatrixInverse: { value: this.camera.matrixWorld },
        resolution: { value: new THREE.Vector2(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight) },
        maxRayDistance: { value: 100 },
        maxSteps: { value: 64 },
        pixelStride: { value: 1 },
        pixelStrideZCutoff: { value: 10 },
        screenEdgeFadeStart: { value: 0.9 },
        eyeFadeStart: { value: 0.4 },
        eyeFadeEnd: { value: 0.6 },
        minReflectivity: { value: 0.02 },
        strideBiasCutoff: { value: 30 },
        jitterSpread: { value: 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform sampler2D tNormal;
        uniform sampler2D tMetalness;
        uniform sampler2D tRoughness;
        uniform mat4 cameraMatrixWorld;
        uniform mat4 projectionMatrixInverse;
        uniform mat4 viewMatrixInverse;
        uniform vec2 resolution;
        uniform float maxRayDistance;
        uniform int maxSteps;
        uniform float pixelStride;
        uniform float pixelStrideZCutoff;
        uniform float screenEdgeFadeStart;
        uniform float eyeFadeStart;
        uniform float eyeFadeEnd;
        uniform float minReflectivity;
        uniform float strideBiasCutoff;
        uniform float jitterSpread;
        varying vec2 vUv;

        float getDepth(const vec2 uv) {
          return texture2D(tDepth, uv).r;
        }

        vec3 getViewPosition(const vec2 uv, const float depth) {
          vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
          vec4 viewSpacePosition = projectionMatrixInverse * clipSpacePosition;
          return viewSpacePosition.xyz / viewSpacePosition.w;
        }

        vec3 getViewNormal(const vec2 uv) {
          return normalize(texture2D(tNormal, uv).rgb * 2.0 - 1.0);
        }

        float getMetalness(const vec2 uv) {
          return texture2D(tMetalness, uv).r;
        }

        float getRoughness(const vec2 uv) {
          return texture2D(tRoughness, uv).r;
        }

        vec3 rayMarch(const vec3 rayOrigin, const vec3 rayDirection, const float maxDistance, const int maxSteps) {
          float stepSize = maxDistance / float(maxSteps);
          vec3 currentPosition = rayOrigin;

          for(int i = 0; i < 128; i++) {
            if(i >= maxSteps) break;

            currentPosition += rayDirection * stepSize;

            vec2 screenPos = currentPosition.xy * 0.5 + 0.5;
            if(screenPos.x < 0.0 || screenPos.x > 1.0 || screenPos.y < 0.0 || screenPos.y > 1.0) {
              break;
            }

            float depth = getDepth(screenPos);
            vec3 viewPos = getViewPosition(screenPos, depth);

            float distance = length(currentPosition - viewPos);
            if(distance < 0.1) {
              return viewPos;
            }
          }

          return vec3(0.0);
        }

        void main() {
          float depth = getDepth(vUv);
          vec3 viewPos = getViewPosition(vUv, depth);
          vec3 viewNormal = getViewNormal(vUv);
          vec3 viewDir = normalize(-viewPos);

          float metalness = getMetalness(vUv);
          float roughness = getRoughness(vUv);

          vec3 reflectDir = reflect(viewDir, viewNormal);
          vec3 hitPos = rayMarch(viewPos, reflectDir, maxRayDistance, maxSteps);

          vec4 color = texture2D(tDiffuse, vUv);

          if(length(hitPos) > 0.0) {
            vec2 hitUV = hitPos.xy * 0.5 + 0.5;
            vec4 reflectionColor = texture2D(tDiffuse, hitUV);

            float fresnel = pow(1.0 - dot(viewDir, viewNormal), 2.0);
            float reflectivity = mix(minReflectivity, 1.0, metalness) * (1.0 - roughness);

            color = mix(color, reflectionColor, fresnel * reflectivity);
          }

          gl_FragColor = color;
        }
      `
    }
  }

  private createVolumetricShader() {
    return {
      uniforms: {
        tDepth: { value: null },
        cameraMatrixWorld: { value: this.camera.matrixWorld },
        projectionMatrixInverse: { value: this.camera.projectionMatrixInverse },
        lightPositions: { value: [] },
        lightColors: { value: [] },
        lightIntensities: { value: [] },
        resolution: { value: new THREE.Vector2(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight) },
        density: { value: this.config.volumetricFogDensity },
        samples: { value: 64 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDepth;
        uniform mat4 cameraMatrixWorld;
        uniform mat4 projectionMatrixInverse;
        uniform vec3 lightPositions[4];
        uniform vec3 lightColors[4];
        uniform float lightIntensities[4];
        uniform vec2 resolution;
        uniform float density;
        uniform int samples;
        varying vec2 vUv;

        float getDepth(const vec2 uv) {
          return texture2D(tDepth, uv).r;
        }

        vec3 getWorldPosition(const vec2 uv, const float depth) {
          vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
          vec4 viewSpacePosition = projectionMatrixInverse * clipSpacePosition;
          vec4 worldSpacePosition = cameraMatrixWorld * viewSpacePosition;
          return worldSpacePosition.xyz / worldSpacePosition.w;
        }

        float calculateScattering(const vec3 rayOrigin, const vec3 rayDirection, const vec3 lightPos, const float maxDistance) {
          float stepSize = maxDistance / float(samples);
          float scattering = 0.0;

          for(int i = 0; i < 128; i++) {
            if(i >= samples) break;

            float t = float(i) / float(samples);
            vec3 samplePos = rayOrigin + rayDirection * t * maxDistance;

            float distanceToLight = length(samplePos - lightPos);
            float attenuation = 1.0 / (1.0 + 0.1 * distanceToLight + 0.01 * distanceToLight * distanceToLight);

            scattering += attenuation * density * stepSize;
          }

          return scattering;
        }

        void main() {
          float depth = getDepth(vUv);
          vec3 worldPos = getWorldPosition(vUv, depth);
          vec3 cameraPos = cameraMatrixWorld[3].xyz;

          vec3 rayDirection = normalize(worldPos - cameraPos);
          float maxDistance = length(worldPos - cameraPos);

          vec3 volumetricColor = vec3(0.0);

          for(int i = 0; i < 4; i++) {
            vec3 lightPos = lightPositions[i];
            vec3 lightColor = lightColors[i];
            float lightIntensity = lightIntensities[i];

            if(lightIntensity > 0.0) {
              float scattering = calculateScattering(cameraPos, rayDirection, lightPos, maxDistance);
              volumetricColor += lightColor * lightIntensity * scattering;
            }
          }

          float vignette = 1.0 - length(vUv - 0.5) * 0.5;
          volumetricColor *= vignette;

          gl_FragColor = vec4(volumetricColor, 1.0);
        }
      `
    }
  }

  private createBloomShader() {
    return {
      uniforms: {
        tDiffuse: { value: null },
        threshold: { value: 1.0 },
        intensity: { value: this.config.bloomIntensity },
        blurRadius: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float threshold;
        uniform float intensity;
        uniform float blurRadius;
        varying vec2 vUv;

        vec3 blur(sampler2D tex, vec2 uv, float radius) {
          vec2 texelSize = 1.0 / textureSize(tex, 0);
          vec3 result = vec3(0.0);
          float total = 0.0;

          for(float x = -2.0; x <= 2.0; x += 1.0) {
            for(float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * radius;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              result += texture2D(tex, uv + offset).rgb * weight;
              total += weight;
            }
          }

          return result / total;
        }

        void main() {
          vec3 color = texture2D(tDiffuse, vUv).rgb;
          float brightness = dot(color, vec3(0.299, 0.587, 0.114));

          if(brightness > threshold) {
            vec3 blurred = blur(tDiffuse, vUv, blurRadius);
            gl_FragColor = vec4(blurred * intensity, 1.0);
          } else {
            gl_FragColor = vec4(0.0);
          }
        }
      `
    }
  }

  private createAOShader() {
    return {
      uniforms: {
        tDepth: { value: null },
        tNormal: { value: null },
        projectionMatrix: { value: this.camera.projectionMatrix },
        resolution: { value: new THREE.Vector2(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight) },
        strength: { value: this.config.aoStrength },
        radius: { value: 0.5 },
        bias: { value: 0.025 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDepth;
        uniform sampler2D tNormal;
        uniform mat4 projectionMatrix;
        uniform vec2 resolution;
        uniform float strength;
        uniform float radius;
        uniform float bias;
        varying vec2 vUv;

        float getDepth(const vec2 uv) {
          return texture2D(tDepth, uv).r;
        }

        vec3 getViewNormal(const vec2 uv) {
          return normalize(texture2D(tNormal, uv).rgb * 2.0 - 1.0);
        }

        vec3 getViewPosition(const vec2 uv, const float depth) {
          float z = depth * 2.0 - 1.0;
          vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, z, 1.0);
          vec4 viewSpacePosition = inverse(projectionMatrix) * clipSpacePosition;
          return viewSpacePosition.xyz / viewSpacePosition.w;
        }

        float calculateAO(const vec2 uv, const vec3 viewPos, const vec3 viewNormal) {
          vec2 texelSize = 1.0 / resolution;
          float ao = 0.0;

          for(int x = -2; x <= 2; x++) {
            for(int y = -2; y <= 2; y++) {
              if(x == 0 && y == 0) continue;

              vec2 offset = vec2(float(x), float(y)) * texelSize;
              vec2 sampleUV = uv + offset * radius;

              float sampleDepth = getDepth(sampleUV);
              vec3 sampleViewPos = getViewPosition(sampleUV, sampleDepth);

              vec3 sampleDir = normalize(sampleViewPos - viewPos);
              float distance = length(sampleViewPos - viewPos);

              float dotProduct = max(dot(viewNormal, sampleDir), 0.0);
              float rangeCheck = smoothstep(0.0, 1.0, radius / distance);

              ao += dotProduct * rangeCheck;
            }
          }

          return 1.0 - (ao / 24.0) * strength;
        }

        void main() {
          float depth = getDepth(vUv);
          vec3 viewPos = getViewPosition(vUv, depth);
          vec3 viewNormal = getViewNormal(vUv);

          float ao = calculateAO(vUv, viewPos, viewNormal);

          gl_FragColor = vec4(ao, ao, ao, 1.0);
        }
      `
    }
  }

  private createMotionBlurShader() {
    return {
      uniforms: {
        tDiffuse: { value: null },
        tVelocity: { value: null },
        strength: { value: 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tVelocity;
        uniform float strength;
        varying vec2 vUv;

        void main() {
          vec2 velocity = texture2D(tVelocity, vUv).rg * strength;
          vec3 color = vec3(0.0);
          float total = 0.0;

          for(float i = -5.0; i <= 5.0; i += 1.0) {
            float weight = 1.0 - abs(i) / 5.0;
            vec2 offset = velocity * i * 0.1;
            color += texture2D(tDiffuse, vUv + offset).rgb * weight;
            total += weight;
          }

          gl_FragColor = vec4(color / total, 1.0);
        }
      `
    }
  }

  private setupLighting(): void {
    // Clear existing shadow lights
    this.shadowLights.forEach(light => this.scene.remove(light))
    this.shadowLights = []

    // Setup main directional light with shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0)
    mainLight.position.set(10, 20, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = this.stats.shadowMapSize
    mainLight.shadow.mapSize.height = this.stats.shadowMapSize
    mainLight.shadow.camera.near = this.shadowCameraNear
    mainLight.shadow.camera.far = this.shadowCameraFar
    mainLight.shadow.camera.left = this.shadowCameraLeft
    mainLight.shadow.camera.right = this.shadowCameraRight
    mainLight.shadow.camera.top = this.shadowCameraTop
    mainLight.shadow.camera.bottom = this.shadowCameraBottom
    mainLight.shadow.bias = -0.001
    mainLight.shadow.normalBias = 0.02

    this.scene.add(mainLight)
    this.shadowLights.push(mainLight)

    // Setup additional shadow lights if enabled
    if (this.config.maxShadowLights > 1) {
      const accentLight = new THREE.DirectionalLight(0x88ccff, 0.3)
      accentLight.position.set(-5, 15, -5)
      accentLight.castShadow = true
      accentLight.shadow.mapSize.width = this.stats.shadowMapSize / 2
      accentLight.shadow.mapSize.height = this.stats.shadowMapSize / 2
      accentLight.shadow.camera.near = this.shadowCameraNear
      accentLight.shadow.camera.far = this.shadowCameraFar
      accentLight.shadow.camera.left = this.shadowCameraLeft / 2
      accentLight.shadow.camera.right = this.shadowCameraRight / 2
      accentLight.shadow.camera.top = this.shadowCameraTop / 2
      accentLight.shadow.camera.bottom = this.shadowCameraBottom / 2

      this.scene.add(accentLight)
      this.shadowLights.push(accentLight)
    }

    // Setup volumetric light volumes
    this.setupVolumetricLighting()
  }

  private setupVolumetricLighting(): void {
    // Clear existing volumetric lights
    this.volumetricLightVolumes.forEach(volume => this.scene.remove(volume))
    this.volumetricLightVolumes = []

    if (!this.config.enableVolumetricLighting) return

    // Create volumetric light volumes for each shadow light
    this.shadowLights.forEach(light => {
      const geometry = new THREE.ConeGeometry(2, 8, 8, 1, true)
      const material = new THREE.MeshBasicMaterial({
        color: light.color,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
      })

      const volume = new THREE.Mesh(geometry, material)
      volume.position.copy(light.position)
      volume.lookAt(new THREE.Vector3(0, 0, 0))
      volume.scale.set(5, 5, 5)

      this.scene.add(volume)
      this.volumetricLightVolumes.push(volume)
    })
  }

  private updateShadowQuality(): void {
    const shadowMapSizes = {
      low: 1024,
      medium: 2048,
      high: 4096,
      ultra: 8192
    }

    this.stats.shadowMapSize = shadowMapSizes[this.config.shadowQuality]

    this.shadowLights.forEach((light, index) => {
      const scale = index === 0 ? 1.0 : 0.5
      light.shadow.mapSize.width = this.stats.shadowMapSize * scale
      light.shadow.mapSize.height = this.stats.shadowMapSize * scale
    })
  }

  public render(): void {
    const startTime = performance.now()

    // Shadow pass
    if (this.config.enableDynamicShadows) {
      this.renderShadows()
    }

    // Screen Space Reflections pass
    if (this.config.enableScreenSpaceReflections) {
      this.renderSSR()
    }

    // Volumetric lighting pass
    if (this.config.enableVolumetricLighting) {
      this.renderVolumetricLighting()
    }

    // Post-processing pass
    if (this.config.enableBloom || this.config.enableAmbientOcclusion || this.config.enableMotionBlur) {
      this.renderPostProcessing()
    }

    // Update performance stats
    this.stats.totalRenderTime = performance.now() - startTime
    this.frameCount++

    if (this.frameCount % 60 === 0) {
      console.log('📊 Graphics Stats:', this.stats)
    }
  }

  private renderShadows(): void {
    const startTime = performance.now()

    // Enable shadow rendering
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Render shadow maps for each light
    this.shadowLights.forEach(light => {
      if (light.castShadow) {
        this.renderer.setRenderTarget(light.shadow.map)
        this.renderer.clear()

        // Create shadow scene
        const shadowScene = new THREE.Scene()
        shadowScene.background = null

        // Add shadow casters to shadow scene
        this.scene.traverse(object => {
          if (object.castShadow) {
            shadowScene.add(object.clone())
          }
        })

        this.renderer.render(shadowScene, light.shadow.camera)
      }
    })

    this.renderer.setRenderTarget(null)
    this.stats.shadowRenderTime = performance.now() - startTime
  }

  private renderSSR(): void {
    const startTime = performance.now()

    // Render scene to SSR render target
    this.renderer.setRenderTarget(this.ssrRenderTarget)
    this.renderer.render(this.scene, this.camera)

    // Apply SSR shader
    this.ssrMaterial.uniforms.tDiffuse.value = this.ssrRenderTarget.texture
    this.ssrMaterial.uniforms.tDepth.value = this.ssrRenderTarget.depthTexture
    this.ssrMaterial.uniforms.tNormal.value = (this.scene as any).normalTexture
    this.ssrMaterial.uniforms.resolution.value.set(
      this.renderer.domElement.clientWidth,
      this.renderer.domElement.clientHeight
    )

    this.renderFullscreenQuad(this.ssrMaterial)

    this.renderer.setRenderTarget(null)
    this.stats.reflectionRenderTime = performance.now() - startTime
  }

  private renderVolumetricLighting(): void {
    const startTime = performance.now()

    // Update volumetric light uniforms
    const lightPositions: THREE.Vector3[] = []
    const lightColors: THREE.Color[] = []
    const lightIntensities: number[] = []

    this.shadowLights.forEach(light => {
      lightPositions.push(light.position)
      lightColors.push(light.color)
      lightIntensities.push(light.intensity)
    })

    this.volumetricMaterial.uniforms.lightPositions.value = lightPositions
    this.volumetricMaterial.uniforms.lightColors.value = lightColors
    this.volumetricMaterial.uniforms.lightIntensities.value = lightIntensities

    // Render volumetric lighting
    this.volumetricMaterial.uniforms.tDepth.value = (this.scene as any).depthTexture
    this.volumetricMaterial.uniforms.resolution.value.set(
      this.renderer.domElement.clientWidth,
      this.renderer.domElement.clientHeight
    )

    this.renderer.setRenderTarget(this.volumetricRenderTarget)
    this.renderFullscreenQuad(this.volumetricMaterial)

    this.renderer.setRenderTarget(null)
    this.stats.lightingRenderTime = performance.now() - startTime
  }

  private renderPostProcessing(): void {
    const startTime = performance.now()

    // Apply post-processing effects
    const originalTarget = this.renderer.getRenderTarget()

    // Bloom effect
    if (this.config.enableBloom) {
      this.bloomMaterial.uniforms.tDiffuse.value = originalTarget?.texture || null
      this.bloomMaterial.uniforms.intensity.value = this.config.bloomIntensity

      this.renderer.setRenderTarget(this.postProcessingRenderTarget)
      this.renderFullscreenQuad(this.bloomMaterial)
    }

    // Ambient occlusion
    if (this.config.enableAmbientOcclusion) {
      this.aoMaterial.uniforms.tDepth.value = (this.scene as any).depthTexture
      this.aoMaterial.uniforms.tNormal.value = (this.scene as any).normalTexture
      this.aoMaterial.uniforms.strength.value = this.config.aoStrength

      this.renderer.setRenderTarget(this.postProcessingRenderTarget)
      this.renderFullscreenQuad(this.aoMaterial)
    }

    // Motion blur
    if (this.config.enableMotionBlur) {
      this.motionBlurMaterial.uniforms.tDiffuse.value = this.postProcessingRenderTarget.texture
      this.motionBlurMaterial.uniforms.tVelocity.value = (this.scene as any).velocityTexture

      this.renderer.setRenderTarget(null)
      this.renderFullscreenQuad(this.motionBlurMaterial)
    }

    this.stats.postProcessTime = performance.now() - startTime
  }

  private renderFullscreenQuad(material: THREE.Material): void {
    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)

    const originalScene = this.scene
    const originalCamera = this.camera

    const tempScene = new THREE.Scene()
    tempScene.add(mesh)

    this.renderer.render(tempScene, this.postProcessingCamera)

    // Cleanup
    geometry.dispose()
    if (Array.isArray(material)) {
      material.forEach(mat => mat.dispose())
    } else {
      material.dispose()
    }
  }

  public updateConfig(config: Partial<GraphicsConfig>): void {
    this.config = { ...this.config, ...config }

    if (config.shadowQuality) {
      this.updateShadowQuality()
    }

    if (config.enableVolumetricLighting !== undefined) {
      this.setupVolumetricLighting()
    }

    if (config.enableDynamicShadows !== undefined) {
      this.setupLighting()
    }
  }

  public getStats(): GraphicsStats {
    return { ...this.stats }
  }

  public getLightIntensity(position: THREE.Vector3): number {
    let totalIntensity = 0

    this.shadowLights.forEach(light => {
      const distance = position.distanceTo(light.position)
      const attenuation = light.intensity / (1.0 + 0.1 * distance + 0.01 * distance * distance)
      totalIntensity += attenuation
    })

    return totalIntensity
  }

  public addVolumetricLight(position: THREE.Vector3, color: THREE.Color, intensity: number): void {
    const geometry = new THREE.SphereGeometry(0.5, 8, 6)
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: intensity * 0.1
    })

    const volume = new THREE.Mesh(geometry, material)
    volume.position.copy(position)
    volume.scale.set(intensity, intensity, intensity)

    this.scene.add(volume)
    this.volumetricLightVolumes.push(volume)
  }

  public resize(width: number, height: number): void {
    // Update render targets
    this.ssrRenderTarget.setSize(width, height)
    this.volumetricRenderTarget.setSize(width, height)
    this.postProcessingRenderTarget.setSize(width, height)

    // Update material uniforms
    this.ssrMaterial.uniforms.resolution.value.set(width, height)
    this.volumetricMaterial.uniforms.resolution.value.set(width, height)
    this.aoMaterial.uniforms.resolution.value.set(width, height)
  }

  public dispose(): void {
    // Dispose render targets
    this.ssrRenderTarget.dispose()
    this.volumetricRenderTarget.dispose()
    this.postProcessingRenderTarget.dispose()

    // Dispose materials
    this.ssrMaterial.dispose()
    this.volumetricMaterial.dispose()
    this.bloomMaterial.dispose()
    this.aoMaterial.dispose()
    this.motionBlurMaterial.dispose()

    // Remove volumetric light volumes
    this.volumetricLightVolumes.forEach(volume => this.scene.remove(volume))
    this.volumetricLightVolumes = []

    // Remove shadow lights
    this.shadowLights.forEach(light => this.scene.remove(light))
    this.shadowLights = []
  }
}

export default AdvancedGraphicsRenderer