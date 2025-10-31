/**
 * 👣 FOOTSTEP SOUND MANAGER
 * 
 * Dynamic footstep sounds based on:
 * - Surface type (metal, concrete, grass, wood, water)
 * - Movement speed (walk, sprint, crouch)
 * - 3D Spatial Audio
 * - Player and Enemy footsteps
 */

import * as THREE from 'three'
import type { AudioManager } from './AudioManager'

export enum SurfaceType {
  METAL = 'metal',
  CONCRETE = 'concrete',
  GRASS = 'grass',
  WOOD = 'wood',
  WATER = 'water',
  DIRT = 'dirt'
}

export enum MovementType {
  WALK = 'walk',
  SPRINT = 'sprint',
  CROUCH = 'crouch',
  JUMP = 'jump',
  LAND = 'land'
}

export interface FootstepConfig {
  surface: SurfaceType
  movementType: MovementType
  volume: number
  position?: THREE.Vector3
}

export class FootstepManager {
  private audioManager: AudioManager | null = null
  private lastFootstepTime: number = 0
  private footstepInterval: number = 500 // milliseconds
  private enabled: boolean = true
  private currentSurface: SurfaceType = SurfaceType.CONCRETE

  // Footstep intervals based on movement type (ms)
  private intervals: Record<MovementType, number> = {
    [MovementType.WALK]: 500,
    [MovementType.SPRINT]: 350,
    [MovementType.CROUCH]: 700,
    [MovementType.JUMP]: 0, // Instant
    [MovementType.LAND]: 0  // Instant
  }

  // Volume modifiers based on movement type
  private volumeModifiers: Record<MovementType, number> = {
    [MovementType.WALK]: 0.6,
    [MovementType.SPRINT]: 1.0,
    [MovementType.CROUCH]: 0.3,
    [MovementType.JUMP]: 0.5,
    [MovementType.LAND]: 0.8
  }

  constructor(audioManager?: AudioManager) {
    this.audioManager = audioManager || null
    console.log('👣 Footstep Manager initialized')
  }

  /**
   * Set Audio Manager
   */
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }

  /**
   * Play footstep sound
   */
  playFootstep(config: FootstepConfig): void {
    if (!this.enabled || !this.audioManager) return

    const now = Date.now()
    const interval = this.intervals[config.movementType]

    // Check if enough time has passed (except for jump/land)
    if (config.movementType !== MovementType.JUMP && 
        config.movementType !== MovementType.LAND &&
        now - this.lastFootstepTime < interval) {
      return
    }

    this.lastFootstepTime = now

    // Calculate volume
    const volumeModifier = this.volumeModifiers[config.movementType]
    const finalVolume = config.volume * volumeModifier

    // Sound ID based on surface and movement
    const soundId = `footstep_${config.surface}_${config.movementType}`

    // Try to play registered sound
    const played = this.audioManager.playSound(soundId, config.position || new THREE.Vector3(), finalVolume)

    if (!played) {
      // Fallback to generic surface sound
      const genericSoundId = `footstep_${config.surface}`
      const playedGeneric = this.audioManager.playSound(genericSoundId, config.position || new THREE.Vector3(), finalVolume)

      if (!playedGeneric) {
        // Generate footstep sound
        this.generateFootstepSound(config.surface, finalVolume)
      }
    }
  }

  /**
   * Update footstep (call in game loop)
   */
  update(
    isMoving: boolean,
    movementType: MovementType,
    surface: SurfaceType,
    position: THREE.Vector3,
    volume: number = 0.5
  ): void {
    if (!isMoving || movementType === MovementType.JUMP || movementType === MovementType.LAND) {
      return
    }

    this.playFootstep({
      surface,
      movementType,
      volume,
      position
    })
  }

  /**
   * Play jump sound
   */
  playJump(surface: SurfaceType, position: THREE.Vector3, volume: number = 0.5): void {
    this.playFootstep({
      surface,
      movementType: MovementType.JUMP,
      volume,
      position
    })
  }

  /**
   * Play land sound
   */
  playLand(surface: SurfaceType, position: THREE.Vector3, volume: number = 0.8): void {
    this.playFootstep({
      surface,
      movementType: MovementType.LAND,
      volume,
      position
    })
  }

  /**
   * Detect surface type from position (raycast down)
   */
  detectSurface(position: THREE.Vector3, scene: THREE.Scene): SurfaceType {
    const raycaster = new THREE.Raycaster(
      position.clone().add(new THREE.Vector3(0, 0.5, 0)),
      new THREE.Vector3(0, -1, 0),
      0,
      2
    )

    // Safety check: Ensure scene.children exists and is an array
    if (!scene || !scene.children || !Array.isArray(scene.children) || scene.children.length === 0) {
      return this.currentSurface // Return current surface if scene not ready
    }

    // Try-catch for raycasting (objects might have invalid geometry)
    let intersects: THREE.Intersection[] = []
    try {
      intersects = raycaster.intersectObjects(scene.children, true)
    } catch (error) {
      // Invalid geometry in scene, return current surface
      return this.currentSurface
    }

    if (intersects.length > 0) {
      const object = intersects[0].object
      const surfaceMaterial = object.userData?.surface || object.userData?.material

      // Map material to surface type
      if (surfaceMaterial) {
        switch (surfaceMaterial) {
          case 'metal': return SurfaceType.METAL
          case 'concrete': return SurfaceType.CONCRETE
          case 'grass': return SurfaceType.GRASS
          case 'wood': return SurfaceType.WOOD
          case 'water': return SurfaceType.WATER
          case 'dirt': return SurfaceType.DIRT
          default: return SurfaceType.CONCRETE
        }
      }
    }

    // Default surface
    return SurfaceType.CONCRETE
  }

  /**
   * Generate footstep sound (Web Audio API fallback)
   */
  private generateFootstepSound(surface: SurfaceType, volume: number): void {
    try {
      const audioContext = new AudioContext()
      const gainNode = audioContext.createGain()

      // Different frequencies for different surfaces
      let frequency = 100
      let duration = 0.1

      switch (surface) {
        case SurfaceType.METAL:
          frequency = 200
          duration = 0.15
          break
        case SurfaceType.CONCRETE:
          frequency = 120
          duration = 0.12
          break
        case SurfaceType.GRASS:
          frequency = 80
          duration = 0.08
          break
        case SurfaceType.WOOD:
          frequency = 150
          duration = 0.1
          break
        case SurfaceType.WATER:
          frequency = 100
          duration = 0.2
          break
        case SurfaceType.DIRT:
          frequency = 90
          duration = 0.09
          break
      }

      // Create noise for footstep effect
      const bufferSize = audioContext.sampleRate * duration
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
      }

      const noise = audioContext.createBufferSource()
      noise.buffer = buffer

      // Filter for surface character
      const filter = audioContext.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = frequency

      // Envelope
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      noise.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContext.destination)

      noise.start(audioContext.currentTime)
      noise.stop(audioContext.currentTime + duration)
    } catch (error) {
      // Ignore if Web Audio API not available
    }
  }

  /**
   * Enable/Disable footsteps
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Reset footstep timer
   */
  reset(): void {
    this.lastFootstepTime = 0
  }
}

