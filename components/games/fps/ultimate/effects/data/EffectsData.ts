/**
 * ✨ EFFECTS DATA SYSTEM
 * Data-Driven Architecture for Visual Effects Engine
 *
 * @remarks
 * Integrated from GLXYParticleEffects.tsx and GLXYVisualEffects.tsx (Oct 29, 2025)
 * Complete particle systems, visual effects, and post-processing
 */

import * as THREE from 'three'

// ============================================================
// ENUMS
// ============================================================

export enum EffectType {
  BLOOD_SPLATTER = 'blood_splatter',
  MUZZLE_FLASH = 'muzzle_flash',
  EXPLOSION = 'explosion',
  SPARKS = 'sparks',
  ENERGY_BLAST = 'energy_blast',
  SMOKE = 'smoke',
  FIRE = 'fire',
  ICE_CRYSTALS = 'ice_crystals',
  ELECTRICITY = 'electricity',
  HEALING = 'healing',
  IMPACT = 'impact',
  TRACER = 'tracer',
  SHOCKWAVE = 'shockwave',
  DEBRIS = 'debris',
  DUST = 'dust'
}

export enum ParticleShape {
  SPHERE = 'sphere',
  CUBE = 'cube',
  CONE = 'cone',
  RING = 'ring',
  BEAM = 'beam',
  SPRITE = 'sprite'
}

export enum EmitterShape {
  POINT = 'point',
  SPHERE = 'sphere',
  BOX = 'box',
  CONE = 'cone',
  RING = 'ring',
  MESH = 'mesh'
}

export enum ParticleBlendMode {
  NORMAL = 'normal',
  ADDITIVE = 'additive',
  SUBTRACTIVE = 'subtractive',
  MULTIPLY = 'multiply'
}

export enum EffectQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export enum PostProcessingEffect {
  BLOOM = 'bloom',
  MOTION_BLUR = 'motion_blur',
  CHROMATIC_ABERRATION = 'chromatic_aberration',
  VIGNETTE = 'vignette',
  FILM_GRAIN = 'film_grain',
  COLOR_GRADING = 'color_grading',
  DEPTH_OF_FIELD = 'depth_of_field',
  SCREEN_SPACE_REFLECTIONS = 'screen_space_reflections'
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * Particle System Configuration
 */
export interface ParticleSystemData {
  // Identification
  id: string
  name: string
  effectType: EffectType

  // Emitter Properties
  emitterShape: EmitterShape
  emitterSize: THREE.Vector3
  emissionRate: number              // particles per second
  burstCount: number                // particles per burst
  duration: number                  // milliseconds (0 = infinite)
  looping: boolean

  // Particle Properties
  particleShape: ParticleShape
  particleSize: number              // base size
  particleSizeVariation: number     // 0-1 random variation
  particleLifetime: number          // milliseconds
  particleLifetimeVariation: number // 0-1 random variation

  // Visual Properties
  startColor: THREE.Color
  endColor: THREE.Color
  colorOverLifetime: THREE.Color[]  // Color gradient keyframes
  startOpacity: number              // 0-1
  endOpacity: number                // 0-1
  blendMode: ParticleBlendMode

  // Physics Properties
  velocity: THREE.Vector3
  velocityVariation: THREE.Vector3
  acceleration: THREE.Vector3
  gravity: THREE.Vector3
  drag: number                      // Air resistance
  angularVelocity: THREE.Vector3
  turbulence: number                // Random movement strength

  // Rendering
  texture?: string                  // Texture path
  useWorldSpace: boolean
  alignToVelocity: boolean
  billboarding: boolean
  castShadows: boolean
  receiveShadows: boolean

  // Collision
  collisionEnabled: boolean
  collisionDamping: number          // Bounce dampening
  collisionLifetimeLoss: number     // Life lost on collision

  // Advanced
  sizeOverLifetime: number[]        // Size multiplier keyframes
  lightEmission: number             // 0-1 emissive strength
  distortionStrength: number        // Heat distortion effect
  maxParticles: number
}

/**
 * Visual Effect Data
 */
export interface VisualEffectData {
  // Identification
  id: string
  name: string
  effectType: EffectType
  category: 'weapon' | 'impact' | 'environmental' | 'ability' | 'ui'

  // Particle Systems
  particleSystems: ParticleSystemData[]

  // Lighting
  lights: EffectLightData[]

  // Audio (reference)
  soundId?: string
  soundVolume: number
  sound3D: boolean

  // Post-Processing
  postProcessing: PostProcessingData[]

  // Camera Effects
  cameraShake?: CameraShakeData
  cameraFlash?: CameraFlashData

  // Mesh Effects
  meshEffects: MeshEffectData[]

  // Timing
  duration: number                  // Total effect duration (ms)
  fadeInTime: number
  fadeOutTime: number
  delay: number

  // Quality Scaling
  qualitySettings: Record<EffectQuality, EffectQualitySettings>

  // Performance
  maxDistance: number               // Max render distance
  lodDistances: number[]            // LOD thresholds
  poolSize: number                  // Object pool size
}

/**
 * Effect Light Data
 */
export interface EffectLightData {
  type: 'point' | 'spot' | 'directional'
  color: THREE.Color
  intensity: number
  range: number
  decay: number
  position: THREE.Vector3
  direction?: THREE.Vector3
  angle?: number                    // For spotlights
  lifetime: number                  // milliseconds
  intensityOverLifetime: number[]   // Intensity curve
  flickerFrequency?: number
  flickerAmount?: number
}

/**
 * Post-Processing Effect Data
 */
export interface PostProcessingData {
  type: PostProcessingEffect
  intensity: number
  duration: number
  fadeIn: number
  fadeOut: number
  parameters: Record<string, any>
}

/**
 * Camera Shake Data
 */
export interface CameraShakeData {
  intensity: number
  duration: number
  frequency: number
  falloff: 'linear' | 'exponential'
  axes: {
    x: boolean
    y: boolean
    z: boolean
    rotation: boolean
  }
}

/**
 * Camera Flash Data
 */
export interface CameraFlashData {
  color: THREE.Color
  intensity: number
  duration: number
  fadeOut: number
}

/**
 * Mesh Effect Data
 */
export interface MeshEffectData {
  type: 'shockwave' | 'energy_ring' | 'beam' | 'debris' | 'decal'
  geometry: 'sphere' | 'cylinder' | 'plane' | 'custom'
  material: {
    color: THREE.Color
    opacity: number
    emissive?: THREE.Color
    emissiveIntensity?: number
    transparent: boolean
    blending: THREE.Blending
  }
  animation: {
    scale: { start: number; end: number }
    rotation: { start: THREE.Vector3; end: THREE.Vector3 }
    position: { start: THREE.Vector3; end: THREE.Vector3 }
    opacity: { start: number; end: number }
  }
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * Effect Quality Settings
 */
export interface EffectQualitySettings {
  particleMultiplier: number        // Particle count multiplier
  resolutionScale: number           // Effect resolution scale
  enableLights: boolean
  enablePostProcessing: boolean
  enableMeshEffects: boolean
  maxParticlesPerSystem: number
  updateRate: number                // Updates per second
}

/**
 * Effect Instance
 */
export interface EffectInstance {
  id: string
  effectData: VisualEffectData
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  startTime: number
  isPlaying: boolean
  isPaused: boolean
  timeScale: number
  userData: Record<string, any>
}

/**
 * Particle Instance
 */
export interface ParticleInstance {
  position: THREE.Vector3
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  rotation: THREE.Euler
  angularVelocity: THREE.Vector3
  size: number
  color: THREE.Color
  opacity: number
  lifetime: number                  // milliseconds
  age: number                       // milliseconds
  isAlive: boolean
}

/**
 * Tracer Effect Data
 */
export interface TracerData {
  startPosition: THREE.Vector3
  endPosition: THREE.Vector3
  color: THREE.Color
  width: number
  lifetime: number
  speed: number
  glowIntensity: number
}

/**
 * Decal Data
 */
export interface DecalData {
  position: THREE.Vector3
  normal: THREE.Vector3
  size: THREE.Vector2
  texture: string
  color: THREE.Color
  opacity: number
  rotation: number
  lifetime: number                  // milliseconds (0 = permanent)
  fadeInTime: number
  fadeOutTime: number
}

// ============================================================
// EFFECT PRESETS CATALOG
// ============================================================

/**
 * Muzzle Flash Effect
 */
export const MUZZLE_FLASH_EFFECT: VisualEffectData = {
  id: 'muzzle_flash',
  name: 'Muzzle Flash',
  effectType: EffectType.MUZZLE_FLASH,
  category: 'weapon',

  particleSystems: [
    {
      id: 'muzzle_flash_core',
      name: 'Muzzle Flash Core',
      effectType: EffectType.MUZZLE_FLASH,
      emitterShape: EmitterShape.POINT,
      emitterSize: new THREE.Vector3(0.1, 0.1, 0.1),
      emissionRate: 0,
      burstCount: 5,
      duration: 100,
      looping: false,
      particleShape: ParticleShape.SPRITE,
      particleSize: 0.3,
      particleSizeVariation: 0.2,
      particleLifetime: 100,
      particleLifetimeVariation: 0.3,
      startColor: new THREE.Color(1.0, 0.9, 0.4),
      endColor: new THREE.Color(1.0, 0.3, 0.0),
      colorOverLifetime: [],
      startOpacity: 1.0,
      endOpacity: 0.0,
      blendMode: ParticleBlendMode.ADDITIVE,
      velocity: new THREE.Vector3(0, 0, 2),
      velocityVariation: new THREE.Vector3(0.5, 0.5, 1),
      acceleration: new THREE.Vector3(0, 0, 0),
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.5,
      angularVelocity: new THREE.Vector3(0, 0, 10),
      turbulence: 0.3,
      useWorldSpace: false,
      alignToVelocity: false,
      billboarding: true,
      castShadows: false,
      receiveShadows: false,
      collisionEnabled: false,
      collisionDamping: 0.5,
      collisionLifetimeLoss: 0.0,
      sizeOverLifetime: [1.0, 1.5, 0.5, 0.0],
      lightEmission: 1.0,
      distortionStrength: 0.2,
      maxParticles: 10
    },
    {
      id: 'muzzle_smoke',
      name: 'Muzzle Smoke',
      effectType: EffectType.SMOKE,
      emitterShape: EmitterShape.CONE,
      emitterSize: new THREE.Vector3(0.2, 0.2, 0.5),
      emissionRate: 0,
      burstCount: 3,
      duration: 100,
      looping: false,
      particleShape: ParticleShape.SPRITE,
      particleSize: 0.2,
      particleSizeVariation: 0.3,
      particleLifetime: 500,
      particleLifetimeVariation: 0.2,
      startColor: new THREE.Color(0.3, 0.3, 0.3),
      endColor: new THREE.Color(0.15, 0.15, 0.15),
      colorOverLifetime: [],
      startOpacity: 0.6,
      endOpacity: 0.0,
      blendMode: ParticleBlendMode.NORMAL,
      velocity: new THREE.Vector3(0, 0.5, 1),
      velocityVariation: new THREE.Vector3(0.3, 0.3, 0.5),
      acceleration: new THREE.Vector3(0, 0.5, 0),
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.3,
      angularVelocity: new THREE.Vector3(0, 0, 5),
      turbulence: 0.5,
      useWorldSpace: true,
      alignToVelocity: false,
      billboarding: true,
      castShadows: false,
      receiveShadows: false,
      collisionEnabled: false,
      collisionDamping: 0.5,
      collisionLifetimeLoss: 0.0,
      sizeOverLifetime: [1.0, 2.0, 3.0],
      lightEmission: 0.0,
      distortionStrength: 0.1,
      maxParticles: 10
    }
  ],

  lights: [
    {
      type: 'point',
      color: new THREE.Color(1.0, 0.8, 0.3),
      intensity: 2.0,
      range: 5.0,
      decay: 2,
      position: new THREE.Vector3(0, 0, 0.3),
      lifetime: 100,
      intensityOverLifetime: [1.0, 0.5, 0.0],
      flickerFrequency: 60,
      flickerAmount: 0.3
    }
  ],

  soundVolume: 1.0,
  sound3D: true,

  postProcessing: [],

  cameraShake: undefined,
  cameraFlash: {
    color: new THREE.Color(1.0, 0.9, 0.5),
    intensity: 0.1,
    duration: 50,
    fadeOut: 50
  },

  meshEffects: [],

  duration: 500,
  fadeInTime: 0,
  fadeOutTime: 100,
  delay: 0,

  qualitySettings: {
    [EffectQuality.LOW]: {
      particleMultiplier: 0.5,
      resolutionScale: 0.5,
      enableLights: false,
      enablePostProcessing: false,
      enableMeshEffects: true,
      maxParticlesPerSystem: 5,
      updateRate: 30
    },
    [EffectQuality.MEDIUM]: {
      particleMultiplier: 0.75,
      resolutionScale: 0.75,
      enableLights: true,
      enablePostProcessing: false,
      enableMeshEffects: true,
      maxParticlesPerSystem: 8,
      updateRate: 45
    },
    [EffectQuality.HIGH]: {
      particleMultiplier: 1.0,
      resolutionScale: 1.0,
      enableLights: true,
      enablePostProcessing: true,
      enableMeshEffects: true,
      maxParticlesPerSystem: 10,
      updateRate: 60
    },
    [EffectQuality.ULTRA]: {
      particleMultiplier: 1.5,
      resolutionScale: 1.0,
      enableLights: true,
      enablePostProcessing: true,
      enableMeshEffects: true,
      maxParticlesPerSystem: 15,
      updateRate: 60
    }
  },

  maxDistance: 100,
  lodDistances: [25, 50, 75],
  poolSize: 20
}

/**
 * Blood Splatter Effect
 */
export const BLOOD_SPLATTER_EFFECT: VisualEffectData = {
  id: 'blood_splatter',
  name: 'Blood Splatter',
  effectType: EffectType.BLOOD_SPLATTER,
  category: 'impact',

  particleSystems: [
    {
      id: 'blood_particles',
      name: 'Blood Particles',
      effectType: EffectType.BLOOD_SPLATTER,
      emitterShape: EmitterShape.SPHERE,
      emitterSize: new THREE.Vector3(0.1, 0.1, 0.1),
      emissionRate: 0,
      burstCount: 15,
      duration: 100,
      looping: false,
      particleShape: ParticleShape.SPHERE,
      particleSize: 0.05,
      particleSizeVariation: 0.5,
      particleLifetime: 1000,
      particleLifetimeVariation: 0.3,
      startColor: new THREE.Color(0.6, 0.0, 0.0),
      endColor: new THREE.Color(0.3, 0.0, 0.0),
      colorOverLifetime: [],
      startOpacity: 1.0,
      endOpacity: 0.8,
      blendMode: ParticleBlendMode.NORMAL,
      velocity: new THREE.Vector3(0, 0, 0),
      velocityVariation: new THREE.Vector3(3, 3, 3),
      acceleration: new THREE.Vector3(0, -9.81, 0),
      gravity: new THREE.Vector3(0, -9.81, 0),
      drag: 0.1,
      angularVelocity: new THREE.Vector3(0, 0, 0),
      turbulence: 0.0,
      useWorldSpace: true,
      alignToVelocity: false,
      billboarding: false,
      castShadows: false,
      receiveShadows: true,
      collisionEnabled: true,
      collisionDamping: 0.3,
      collisionLifetimeLoss: 0.5,
      sizeOverLifetime: [1.0, 0.8, 0.5],
      lightEmission: 0.0,
      distortionStrength: 0.0,
      maxParticles: 30
    }
  ],

  lights: [],
  soundVolume: 0.5,
  sound3D: true,
  postProcessing: [],
  meshEffects: [],

  duration: 1000,
  fadeInTime: 0,
  fadeOutTime: 200,
  delay: 0,

  qualitySettings: {
    [EffectQuality.LOW]: {
      particleMultiplier: 0.3,
      resolutionScale: 1.0,
      enableLights: false,
      enablePostProcessing: false,
      enableMeshEffects: false,
      maxParticlesPerSystem: 10,
      updateRate: 30
    },
    [EffectQuality.MEDIUM]: {
      particleMultiplier: 0.6,
      resolutionScale: 1.0,
      enableLights: false,
      enablePostProcessing: false,
      enableMeshEffects: true,
      maxParticlesPerSystem: 15,
      updateRate: 45
    },
    [EffectQuality.HIGH]: {
      particleMultiplier: 1.0,
      resolutionScale: 1.0,
      enableLights: false,
      enablePostProcessing: false,
      enableMeshEffects: true,
      maxParticlesPerSystem: 30,
      updateRate: 60
    },
    [EffectQuality.ULTRA]: {
      particleMultiplier: 1.5,
      resolutionScale: 1.0,
      enableLights: false,
      enablePostProcessing: false,
      enableMeshEffects: true,
      maxParticlesPerSystem: 45,
      updateRate: 60
    }
  },

  maxDistance: 50,
  lodDistances: [15, 30, 45],
  poolSize: 30
}

/**
 * Explosion Effect
 */
export const EXPLOSION_EFFECT: VisualEffectData = {
  id: 'explosion',
  name: 'Explosion',
  effectType: EffectType.EXPLOSION,
  category: 'weapon',

  particleSystems: [
    {
      id: 'explosion_fireball',
      name: 'Explosion Fireball',
      effectType: EffectType.FIRE,
      emitterShape: EmitterShape.SPHERE,
      emitterSize: new THREE.Vector3(1, 1, 1),
      emissionRate: 0,
      burstCount: 30,
      duration: 200,
      looping: false,
      particleShape: ParticleShape.SPRITE,
      particleSize: 0.8,
      particleSizeVariation: 0.3,
      particleLifetime: 800,
      particleLifetimeVariation: 0.2,
      startColor: new THREE.Color(1.0, 0.9, 0.3),
      endColor: new THREE.Color(0.3, 0.1, 0.0),
      colorOverLifetime: [
        new THREE.Color(1.0, 1.0, 0.8),
        new THREE.Color(1.0, 0.5, 0.0),
        new THREE.Color(0.5, 0.1, 0.0),
        new THREE.Color(0.1, 0.1, 0.1)
      ],
      startOpacity: 1.0,
      endOpacity: 0.0,
      blendMode: ParticleBlendMode.ADDITIVE,
      velocity: new THREE.Vector3(0, 0, 0),
      velocityVariation: new THREE.Vector3(5, 5, 5),
      acceleration: new THREE.Vector3(0, 2, 0),
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.3,
      angularVelocity: new THREE.Vector3(0, 0, 10),
      turbulence: 0.5,
      useWorldSpace: true,
      alignToVelocity: false,
      billboarding: true,
      castShadows: false,
      receiveShadows: false,
      collisionEnabled: false,
      collisionDamping: 0.5,
      collisionLifetimeLoss: 0.0,
      sizeOverLifetime: [1.0, 2.0, 3.0, 2.5, 1.0],
      lightEmission: 1.0,
      distortionStrength: 0.5,
      maxParticles: 50
    },
    {
      id: 'explosion_smoke',
      name: 'Explosion Smoke',
      effectType: EffectType.SMOKE,
      emitterShape: EmitterShape.SPHERE,
      emitterSize: new THREE.Vector3(1.5, 1.5, 1.5),
      emissionRate: 50,
      burstCount: 20,
      duration: 500,
      looping: false,
      particleShape: ParticleShape.SPRITE,
      particleSize: 1.2,
      particleSizeVariation: 0.4,
      particleLifetime: 2000,
      particleLifetimeVariation: 0.3,
      startColor: new THREE.Color(0.2, 0.2, 0.2),
      endColor: new THREE.Color(0.4, 0.4, 0.4),
      colorOverLifetime: [],
      startOpacity: 0.8,
      endOpacity: 0.0,
      blendMode: ParticleBlendMode.NORMAL,
      velocity: new THREE.Vector3(0, 3, 0),
      velocityVariation: new THREE.Vector3(2, 2, 2),
      acceleration: new THREE.Vector3(0, 1, 0),
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.2,
      angularVelocity: new THREE.Vector3(0, 0, 3),
      turbulence: 0.7,
      useWorldSpace: true,
      alignToVelocity: false,
      billboarding: true,
      castShadows: false,
      receiveShadows: false,
      collisionEnabled: false,
      collisionDamping: 0.5,
      collisionLifetimeLoss: 0.0,
      sizeOverLifetime: [1.0, 2.0, 3.5, 4.0],
      lightEmission: 0.0,
      distortionStrength: 0.3,
      maxParticles: 100
    },
    {
      id: 'explosion_debris',
      name: 'Explosion Debris',
      effectType: EffectType.DEBRIS,
      emitterShape: EmitterShape.SPHERE,
      emitterSize: new THREE.Vector3(0.5, 0.5, 0.5),
      emissionRate: 0,
      burstCount: 25,
      duration: 100,
      looping: false,
      particleShape: ParticleShape.CUBE,
      particleSize: 0.1,
      particleSizeVariation: 0.5,
      particleLifetime: 1500,
      particleLifetimeVariation: 0.3,
      startColor: new THREE.Color(0.3, 0.3, 0.3),
      endColor: new THREE.Color(0.2, 0.2, 0.2),
      colorOverLifetime: [],
      startOpacity: 1.0,
      endOpacity: 0.5,
      blendMode: ParticleBlendMode.NORMAL,
      velocity: new THREE.Vector3(0, 0, 0),
      velocityVariation: new THREE.Vector3(8, 8, 8),
      acceleration: new THREE.Vector3(0, -9.81, 0),
      gravity: new THREE.Vector3(0, -9.81, 0),
      drag: 0.05,
      angularVelocity: new THREE.Vector3(10, 10, 10),
      turbulence: 0.2,
      useWorldSpace: true,
      alignToVelocity: false,
      billboarding: false,
      castShadows: true,
      receiveShadows: true,
      collisionEnabled: true,
      collisionDamping: 0.4,
      collisionLifetimeLoss: 0.3,
      sizeOverLifetime: [1.0, 1.0, 0.5],
      lightEmission: 0.0,
      distortionStrength: 0.0,
      maxParticles: 50
    }
  ],

  lights: [
    {
      type: 'point',
      color: new THREE.Color(1.0, 0.6, 0.2),
      intensity: 10.0,
      range: 20.0,
      decay: 2,
      position: new THREE.Vector3(0, 0, 0),
      lifetime: 500,
      intensityOverLifetime: [1.0, 1.2, 0.8, 0.3, 0.0],
      flickerFrequency: 30,
      flickerAmount: 0.2
    }
  ],

  soundVolume: 1.0,
  sound3D: true,

  postProcessing: [
    {
      type: PostProcessingEffect.BLOOM,
      intensity: 2.0,
      duration: 500,
      fadeIn: 50,
      fadeOut: 300,
      parameters: {
        threshold: 0.5,
        strength: 2.0,
        radius: 1.0
      }
    },
    {
      type: PostProcessingEffect.CHROMATIC_ABERRATION,
      intensity: 0.5,
      duration: 200,
      fadeIn: 0,
      fadeOut: 200,
      parameters: {
        offset: 0.005
      }
    }
  ],

  cameraShake: {
    intensity: 0.5,
    duration: 500,
    frequency: 30,
    falloff: 'exponential',
    axes: {
      x: true,
      y: true,
      z: true,
      rotation: true
    }
  },

  cameraFlash: {
    color: new THREE.Color(1.0, 0.8, 0.4),
    intensity: 0.3,
    duration: 100,
    fadeOut: 200
  },

  meshEffects: [
    {
      type: 'shockwave',
      geometry: 'sphere',
      material: {
        color: new THREE.Color(0.8, 0.6, 0.3),
        opacity: 0.5,
        emissive: new THREE.Color(1.0, 0.7, 0.3),
        emissiveIntensity: 2.0,
        transparent: true,
        blending: THREE.AdditiveBlending
      },
      animation: {
        scale: { start: 0.1, end: 10.0 },
        rotation: { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(0, 0, 0) },
        position: { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(0, 0, 0) },
        opacity: { start: 0.8, end: 0.0 }
      },
      duration: 600,
      easing: 'ease-out'
    }
  ],

  duration: 2000,
  fadeInTime: 0,
  fadeOutTime: 500,
  delay: 0,

  qualitySettings: {
    [EffectQuality.LOW]: {
      particleMultiplier: 0.3,
      resolutionScale: 0.5,
      enableLights: true,
      enablePostProcessing: false,
      enableMeshEffects: true,
      maxParticlesPerSystem: 20,
      updateRate: 30
    },
    [EffectQuality.MEDIUM]: {
      particleMultiplier: 0.6,
      resolutionScale: 0.75,
      enableLights: true,
      enablePostProcessing: true,
      enableMeshEffects: true,
      maxParticlesPerSystem: 40,
      updateRate: 45
    },
    [EffectQuality.HIGH]: {
      particleMultiplier: 1.0,
      resolutionScale: 1.0,
      enableLights: true,
      enablePostProcessing: true,
      enableMeshEffects: true,
      maxParticlesPerSystem: 100,
      updateRate: 60
    },
    [EffectQuality.ULTRA]: {
      particleMultiplier: 1.5,
      resolutionScale: 1.0,
      enableLights: true,
      enablePostProcessing: true,
      enableMeshEffects: true,
      maxParticlesPerSystem: 150,
      updateRate: 60
    }
  },

  maxDistance: 200,
  lodDistances: [50, 100, 150],
  poolSize: 10
}

/**
 * All Effect Presets
 */
export const EFFECT_CATALOG: VisualEffectData[] = [
  MUZZLE_FLASH_EFFECT,
  BLOOD_SPLATTER_EFFECT,
  EXPLOSION_EFFECT
]

// ============================================================
// DEFAULT SETTINGS
// ============================================================

export const DEFAULT_EFFECT_QUALITY = EffectQuality.HIGH

export const DEFAULT_PARTICLE_SETTINGS = {
  maxGlobalParticles: 10000,
  particleUpdateBatches: 100,
  enableCulling: true,
  cullingDistance: 100,
  enableSorting: true,
  enableCollisions: true,
  collisionLayers: ['environment', 'player', 'enemy'],
  poolingEnabled: true,
  asyncLoading: true
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get effect by ID
 */
export function getEffectById(id: string): VisualEffectData | undefined {
  return EFFECT_CATALOG.find(effect => effect.id === id)
}

/**
 * Get effects by type
 */
export function getEffectsByType(type: EffectType): VisualEffectData[] {
  return EFFECT_CATALOG.filter(effect => effect.effectType === type)
}

/**
 * Get effects by category
 */
export function getEffectsByCategory(category: string): VisualEffectData[] {
  return EFFECT_CATALOG.filter(effect => effect.category === category)
}

/**
 * Calculate particle count for quality
 */
export function calculateParticleCount(
  baseCount: number,
  quality: EffectQuality
): number {
  const qualityMultipliers = {
    [EffectQuality.LOW]: 0.3,
    [EffectQuality.MEDIUM]: 0.6,
    [EffectQuality.HIGH]: 1.0,
    [EffectQuality.ULTRA]: 1.5
  }

  return Math.floor(baseCount * qualityMultipliers[quality])
}

/**
 * Calculate LOD level based on distance
 */
export function calculateLODLevel(
  distance: number,
  lodDistances: number[]
): number {
  for (let i = 0; i < lodDistances.length; i++) {
    if (distance < lodDistances[i]) {
      return i
    }
  }
  return lodDistances.length
}

/**
 * Check if effect should be culled
 */
export function shouldCullEffect(
  effectPosition: THREE.Vector3,
  cameraPosition: THREE.Vector3,
  maxDistance: number
): boolean {
  return effectPosition.distanceTo(cameraPosition) > maxDistance
}

/**
 * Interpolate color over lifetime
 */
export function interpolateColor(
  colors: THREE.Color[],
  normalizedAge: number
): THREE.Color {
  if (colors.length === 0) {
    return new THREE.Color(1, 1, 1)
  }

  if (colors.length === 1) {
    return colors[0].clone()
  }

  const segmentCount = colors.length - 1
  const segment = Math.floor(normalizedAge * segmentCount)
  const segmentProgress = (normalizedAge * segmentCount) - segment

  const startColor = colors[Math.min(segment, colors.length - 1)]
  const endColor = colors[Math.min(segment + 1, colors.length - 1)]

  return new THREE.Color().lerpColors(startColor, endColor, segmentProgress)
}

/**
 * Interpolate value over lifetime
 */
export function interpolateValue(
  values: number[],
  normalizedAge: number
): number {
  if (values.length === 0) {
    return 1.0
  }

  if (values.length === 1) {
    return values[0]
  }

  const segmentCount = values.length - 1
  const segment = Math.floor(normalizedAge * segmentCount)
  const segmentProgress = (normalizedAge * segmentCount) - segment

  const startValue = values[Math.min(segment, values.length - 1)]
  const endValue = values[Math.min(segment + 1, values.length - 1)]

  return startValue + (endValue - startValue) * segmentProgress
}

/**
 * Apply easing function
 */
export function applyEasing(
  progress: number,
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
): number {
  switch (easing) {
    case 'linear':
      return progress
    case 'ease-in':
      return progress * progress
    case 'ease-out':
      return 1 - (1 - progress) * (1 - progress)
    case 'ease-in-out':
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
    default:
      return progress
  }
}

/**
 * Create particle instance
 */
export function createParticle(
  system: ParticleSystemData,
  position: THREE.Vector3
): ParticleInstance {
  // Random variations
  const sizeVariation = 1 + (Math.random() - 0.5) * 2 * system.particleSizeVariation
  const lifetimeVariation = 1 + (Math.random() - 0.5) * 2 * system.particleLifetimeVariation

  const velocity = new THREE.Vector3(
    system.velocity.x + (Math.random() - 0.5) * 2 * system.velocityVariation.x,
    system.velocity.y + (Math.random() - 0.5) * 2 * system.velocityVariation.y,
    system.velocity.z + (Math.random() - 0.5) * 2 * system.velocityVariation.z
  )

  return {
    position: position.clone(),
    velocity,
    acceleration: system.acceleration.clone(),
    rotation: new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ),
    angularVelocity: system.angularVelocity.clone(),
    size: system.particleSize * sizeVariation,
    color: system.startColor.clone(),
    opacity: system.startOpacity,
    lifetime: system.particleLifetime * lifetimeVariation,
    age: 0,
    isAlive: true
  }
}

/**
 * Update particle
 */
export function updateParticle(
  particle: ParticleInstance,
  system: ParticleSystemData,
  deltaTime: number
): void {
  if (!particle.isAlive) return

  // Update age
  particle.age += deltaTime * 1000 // Convert to milliseconds

  if (particle.age >= particle.lifetime) {
    particle.isAlive = false
    return
  }

  const normalizedAge = particle.age / particle.lifetime

  // Update physics
  particle.velocity.add(
    particle.acceleration.clone().multiplyScalar(deltaTime)
  )

  // Apply gravity
  if (system.gravity.length() > 0) {
    particle.velocity.add(
      system.gravity.clone().multiplyScalar(deltaTime)
    )
  }

  // Apply drag
  particle.velocity.multiplyScalar(1 - system.drag * deltaTime)

  // Apply turbulence
  if (system.turbulence > 0) {
    particle.velocity.add(new THREE.Vector3(
      (Math.random() - 0.5) * system.turbulence * deltaTime,
      (Math.random() - 0.5) * system.turbulence * deltaTime,
      (Math.random() - 0.5) * system.turbulence * deltaTime
    ))
  }

  // Update position
  particle.position.add(
    particle.velocity.clone().multiplyScalar(deltaTime)
  )

  // Update rotation
  particle.rotation.x += particle.angularVelocity.x * deltaTime
  particle.rotation.y += particle.angularVelocity.y * deltaTime
  particle.rotation.z += particle.angularVelocity.z * deltaTime

  // Update visual properties
  if (system.colorOverLifetime.length > 0) {
    particle.color = interpolateColor(system.colorOverLifetime, normalizedAge)
  } else {
    particle.color.lerpColors(system.startColor, system.endColor, normalizedAge)
  }

  particle.opacity = system.startOpacity + (system.endOpacity - system.startOpacity) * normalizedAge

  if (system.sizeOverLifetime.length > 0) {
    const sizeMultiplier = interpolateValue(system.sizeOverLifetime, normalizedAge)
    particle.size = system.particleSize * sizeMultiplier
  }
}

/**
 * Validate effect data
 */
export function validateEffectData(effect: VisualEffectData): boolean {
  if (!effect.id || !effect.name) {
    console.error('❌ Effect missing ID or name')
    return false
  }

  if (effect.particleSystems.length === 0) {
    console.warn('⚠️ Effect has no particle systems')
  }

  if (effect.duration <= 0) {
    console.error('❌ Invalid effect duration')
    return false
  }

  return true
}
