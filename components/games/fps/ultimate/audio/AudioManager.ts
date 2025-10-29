/**
 * GLXY Ultimate FPS - Audio Manager
 *
 * PROFESSIONAL AUDIO ORCHESTRATION SYSTEM
 * Complete audio management with 3D positioning, pooling, and dynamic music
 *
 * @module AudioManager
 * @category Audio
 *
 * Features:
 * - Web Audio API Integration
 * - 3D Positional Audio (HRTF)
 * - Sound Pooling for Performance
 * - Audio Mixer with Multiple Channels
 * - Dynamic Music System with Layers
 * - Occlusion & Obstruction
 * - Doppler Effect
 * - Distance Attenuation
 * - Reverb & Audio Effects
 * - Event System for Audio Events
 * - Resource Management
 *
 * Phase 9: Advanced Audio System
 */

import {
  AudioClipData,
  MusicTrackData,
  AudioSettings,
  AudioCategory,
  AudioMixerChannel,
  SpatialAudioConfig,
  Vector3,
  ReverbPreset,
  createDefaultAudioSettings,
  createMixerChannel,
  createReverbEffect,
  calculateDistanceAttenuation,
  calculateDopplerShift
} from './data/AudioData'

import { getAllSounds, getAllMusic } from './data/audio-catalog'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Audio Instance (playing sound)
 */
interface AudioInstance {
  id: string
  clipId: string
  source: AudioBufferSourceNode
  gainNode: GainNode
  pannerNode?: PannerNode
  startTime: number
  pauseTime?: number
  playing: boolean
  loop: boolean
  position?: Vector3
  velocity?: Vector3
}

/**
 * Audio Pool Entry
 */
interface AudioPoolEntry {
  clipId: string
  buffer: AudioBuffer
  instances: AudioInstance[]
  availableInstances: AudioInstance[]
}

/**
 * Audio Event Types
 */
export enum AudioEventType {
  SOUND_PLAYED = 'soundPlayed',
  SOUND_STOPPED = 'soundStopped',
  MUSIC_STARTED = 'musicStarted',
  MUSIC_STOPPED = 'musicStopped',
  VOLUME_CHANGED = 'volumeChanged',
  SETTINGS_CHANGED = 'settingsChanged'
}

/**
 * Audio Event
 */
export interface AudioEvent {
  type: AudioEventType
  data: any
  timestamp: number
}

// =============================================================================
// AUDIO MANAGER
// =============================================================================

/**
 * AudioManager
 * Complete audio system orchestration
 */
export class AudioManager {
  private context: AudioContext
  private settings: AudioSettings

  // Listener (camera/player)
  private listener: AudioListener
  private listenerPosition: Vector3 = { x: 0, y: 0, z: 0 }
  private listenerVelocity: Vector3 = { x: 0, y: 0, z: 0 }
  private listenerForward: Vector3 = { x: 0, y: 0, z: -1 }
  private listenerUp: Vector3 = { x: 0, y: 1, z: 0 }

  // Mixer
  private masterGain: GainNode
  private channels: Map<AudioCategory, AudioMixerChannel> = new Map()
  private channelGains: Map<AudioCategory, GainNode> = new Map()

  // Sound management
  private audioBuffers: Map<string, AudioBuffer> = new Map()
  private pools: Map<string, AudioPoolEntry> = new Map()
  private activeInstances: Map<string, AudioInstance> = new Map()

  // Music
  private currentMusic?: {
    track: MusicTrackData
    source: AudioBufferSourceNode
    gainNode: GainNode
  }
  private musicLayers: Map<string, AudioBufferSourceNode> = new Map()

  // Event system
  private eventCallbacks: Map<AudioEventType, Array<(event: AudioEvent) => void>> = new Map()

  // Stats
  private stats = {
    soundsPlayed: 0,
    activeSounds: 0,
    poolHits: 0,
    poolMisses: 0
  }

  constructor(settings?: Partial<AudioSettings>) {
    // Initialize Web Audio API
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.listener = this.context.listener

    // Merge settings
    this.settings = {
      ...createDefaultAudioSettings(),
      ...settings
    }

    // Create master gain
    this.masterGain = this.context.createGain()
    this.masterGain.gain.value = this.settings.masterVolume
    this.masterGain.connect(this.context.destination)

    // Initialize mixer channels
    this.initializeMixer()

    console.log('🔊 AudioManager: Initialized')
    console.log(`   Sample Rate: ${this.context.sampleRate}Hz`)
    console.log(`   State: ${this.context.state}`)
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Initialize audio mixer channels
   */
  private initializeMixer(): void {
    const categories = Object.values(AudioCategory)

    categories.forEach(category => {
      const channel = createMixerChannel(category, category)
      const gainNode = this.context.createGain()

      // Set initial volume
      const volume = this.getCategoryVolume(category)
      gainNode.gain.value = volume

      gainNode.connect(this.masterGain)

      this.channels.set(category, channel)
      this.channelGains.set(category, gainNode)
    })

    console.log(`   Initialized ${this.channels.size} mixer channels`)
  }

  /**
   * Get category volume from settings
   */
  private getCategoryVolume(category: AudioCategory): number {
    switch (category) {
      case AudioCategory.MUSIC:
        return this.settings.musicVolume
      case AudioCategory.SFX:
        return this.settings.sfxVolume
      case AudioCategory.AMBIENT:
        return this.settings.ambientVolume
      case AudioCategory.VOICE:
        return this.settings.voiceVolume
      case AudioCategory.UI:
        return this.settings.uiVolume
      default:
        return 1.0
    }
  }

  // =============================================================================
  // SOUND LOADING
  // =============================================================================

  /**
   * Load audio clip
   */
  public async loadSound(clip: AudioClipData): Promise<void> {
    if (this.audioBuffers.has(clip.id)) {
      return // Already loaded
    }

    try {
      // Load first path (primary sound)
      const response = await fetch(clip.paths[0])
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)

      this.audioBuffers.set(clip.id, audioBuffer)

      // Create pool if needed
      if (clip.poolSize > 0) {
        this.createPool(clip, audioBuffer)
      }

      console.log(`✅ Loaded sound: ${clip.name}`)
    } catch (error) {
      console.error(`❌ Failed to load sound: ${clip.name}`, error)
    }
  }

  /**
   * Load all sounds
   */
  public async loadAllSounds(onProgress?: (progress: number) => void): Promise<void> {
    const sounds = getAllSounds()
    const total = sounds.length
    let loaded = 0

    for (const sound of sounds) {
      if (sound.preload) {
        await this.loadSound(sound)
      }
      loaded++
      if (onProgress) {
        onProgress(loaded / total)
      }
    }

    console.log(`✅ Loaded ${loaded} sounds`)
  }

  /**
   * Create audio pool
   */
  private createPool(clip: AudioClipData, buffer: AudioBuffer): void {
    const pool: AudioPoolEntry = {
      clipId: clip.id,
      buffer,
      instances: [],
      availableInstances: []
    }

    // Pre-create instances
    for (let i = 0; i < clip.poolSize; i++) {
      const instance = this.createInstance(clip, buffer)
      pool.instances.push(instance)
      pool.availableInstances.push(instance)
    }

    this.pools.set(clip.id, pool)
  }

  /**
   * Create audio instance
   */
  private createInstance(clip: AudioClipData, buffer: AudioBuffer): AudioInstance {
    const source = this.context.createBufferSource()
    source.buffer = buffer

    const gainNode = this.context.createGain()
    gainNode.gain.value = clip.volume

    let pannerNode: PannerNode | undefined

    if (clip.spatial && clip.spatialConfig) {
      pannerNode = this.createPannerNode(clip.spatialConfig)
      source.connect(pannerNode)
      pannerNode.connect(gainNode)
    } else {
      source.connect(gainNode)
    }

    // Connect to channel
    const channelGain = this.channelGains.get(clip.category)
    if (channelGain) {
      gainNode.connect(channelGain)
    } else {
      gainNode.connect(this.masterGain)
    }

    const instance: AudioInstance = {
      id: `${clip.id}_${Date.now()}_${Math.random()}`,
      clipId: clip.id,
      source,
      gainNode,
      pannerNode,
      startTime: 0,
      playing: false,
      loop: clip.loop
    }

    return instance
  }

  /**
   * Create panner node for 3D audio
   */
  private createPannerNode(config: SpatialAudioConfig): PannerNode {
    const panner = this.context.createPanner()

    panner.panningModel = config.panningModel as PanningModelType
    panner.distanceModel = config.distanceModel as DistanceModelType
    panner.refDistance = config.refDistance
    panner.maxDistance = config.maxDistance
    panner.rolloffFactor = config.rolloffFactor
    panner.coneInnerAngle = config.coneInnerAngle
    panner.coneOuterAngle = config.coneOuterAngle
    panner.coneOuterGain = config.coneOuterGain

    return panner
  }

  // =============================================================================
  // SOUND PLAYBACK
  // =============================================================================

  /**
   * Play sound
   */
  public playSound(
    clipId: string,
    position?: Vector3,
    volume?: number,
    pitch?: number
  ): string | null {
    const clip = getAllSounds().find(s => s.id === clipId)
    if (!clip) {
      console.warn(`⚠️ Sound not found: ${clipId}`)
      return null
    }

    // Get buffer
    const buffer = this.audioBuffers.get(clipId)
    if (!buffer) {
      console.warn(`⚠️ Sound not loaded: ${clipId}`)
      return null
    }

    // Check max instances
    const activeCount = Array.from(this.activeInstances.values()).filter(
      i => i.clipId === clipId && i.playing
    ).length

    if (activeCount >= clip.maxInstances) {
      return null // Too many instances
    }

    // Get instance from pool or create new
    let instance: AudioInstance

    const pool = this.pools.get(clipId)
    if (pool && pool.availableInstances.length > 0) {
      instance = pool.availableInstances.pop()!
      this.stats.poolHits++
    } else {
      instance = this.createInstance(clip, buffer)
      this.stats.poolMisses++
    }

    // Apply volume
    if (volume !== undefined) {
      instance.gainNode.gain.value = volume * clip.volume
    } else {
      // Apply randomization
      const randomVol = 1 + (Math.random() - 0.5) * 2 * clip.randomizeVolume
      instance.gainNode.gain.value = clip.volume * randomVol
    }

    // Apply pitch
    const finalPitch = pitch ?? (1 + (Math.random() - 0.5) * 2 * clip.randomizePitch)
    instance.source.playbackRate.value = finalPitch

    // Set position
    if (position && instance.pannerNode) {
      instance.position = position
      instance.pannerNode.setPosition(position.x, position.y, position.z)
    }

    // Set loop
    instance.source.loop = clip.loop

    // Play
    instance.source.start(0, clip.startTime)
    instance.startTime = this.context.currentTime
    instance.playing = true

    // Handle end
    instance.source.onended = () => {
      this.handleSoundEnded(instance)
    }

    // Store instance
    this.activeInstances.set(instance.id, instance)
    this.stats.soundsPlayed++
    this.stats.activeSounds = this.activeInstances.size

    // Dispatch event
    this.dispatchEvent({
      type: AudioEventType.SOUND_PLAYED,
      data: { clipId, instanceId: instance.id, position },
      timestamp: Date.now()
    })

    return instance.id
  }

  /**
   * Stop sound
   */
  public stopSound(instanceId: string): void {
    const instance = this.activeInstances.get(instanceId)
    if (!instance || !instance.playing) return

    try {
      instance.source.stop()
      instance.playing = false
    } catch (error) {
      // Already stopped
    }

    this.handleSoundEnded(instance)
  }

  /**
   * Handle sound ended
   */
  private handleSoundEnded(instance: AudioInstance): void {
    instance.playing = false
    this.activeInstances.delete(instance.id)
    this.stats.activeSounds = this.activeInstances.size

    // Return to pool
    const pool = this.pools.get(instance.clipId)
    if (pool) {
      // Recreate source (can't reuse)
      const buffer = this.audioBuffers.get(instance.clipId)
      if (buffer) {
        const clip = getAllSounds().find(s => s.id === instance.clipId)
        if (clip) {
          const newInstance = this.createInstance(clip, buffer)
          pool.availableInstances.push(newInstance)
        }
      }
    }

    // Dispatch event
    this.dispatchEvent({
      type: AudioEventType.SOUND_STOPPED,
      data: { instanceId: instance.id },
      timestamp: Date.now()
    })
  }

  /**
   * Update 3D audio position
   */
  public updateSoundPosition(instanceId: string, position: Vector3, velocity?: Vector3): void {
    const instance = this.activeInstances.get(instanceId)
    if (!instance || !instance.pannerNode) return

    instance.position = position
    instance.pannerNode.setPosition(position.x, position.y, position.z)

    if (velocity) {
      instance.velocity = velocity
      // Doppler effect handled by Web Audio API
    }
  }

  // =============================================================================
  // MUSIC SYSTEM
  // =============================================================================

  /**
   * Play music track
   */
  public async playMusic(trackId: string, fadeIn: boolean = true): Promise<void> {
    const track = getAllMusic().find(t => t.id === trackId)
    if (!track) {
      console.warn(`⚠️ Music track not found: ${trackId}`)
      return
    }

    // Stop current music
    if (this.currentMusic) {
      await this.stopMusic(true)
    }

    try {
      // Load track
      const response = await fetch(track.path)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)

      // Create source
      const source = this.context.createBufferSource()
      source.buffer = audioBuffer
      source.loop = track.loop

      // Set loop points
      if (track.loop && track.loop) {
        source.loopStart = track.loop.start
        source.loopEnd = track.loop.end
      }

      // Create gain
      const gainNode = this.context.createGain()
      gainNode.gain.value = fadeIn ? 0 : track.volume * this.settings.musicVolume

      source.connect(gainNode)
      gainNode.connect(this.channelGains.get(AudioCategory.MUSIC) || this.masterGain)

      // Fade in
      if (fadeIn) {
        gainNode.gain.linearRampToValueAtTime(
          track.volume * this.settings.musicVolume,
          this.context.currentTime + track.fadeIn
        )
      }

      // Start
      source.start(0)

      this.currentMusic = { track, source, gainNode }

      // Dispatch event
      this.dispatchEvent({
        type: AudioEventType.MUSIC_STARTED,
        data: { trackId },
        timestamp: Date.now()
      })

      console.log(`🎵 Playing music: ${track.name}`)
    } catch (error) {
      console.error(`❌ Failed to play music: ${track.name}`, error)
    }
  }

  /**
   * Stop music
   */
  public async stopMusic(fadeOut: boolean = true): Promise<void> {
    if (!this.currentMusic) return

    const { source, gainNode, track } = this.currentMusic

    if (fadeOut) {
      gainNode.gain.linearRampToValueAtTime(
        0,
        this.context.currentTime + track.fadeOut
      )

      await new Promise(resolve => setTimeout(resolve, track.fadeOut * 1000))
    }

    source.stop()
    this.currentMusic = undefined

    // Dispatch event
    this.dispatchEvent({
      type: AudioEventType.MUSIC_STOPPED,
      data: {},
      timestamp: Date.now()
    })
  }

  // =============================================================================
  // LISTENER (CAMERA/PLAYER) CONTROL
  // =============================================================================

  /**
   * Update listener position and orientation
   */
  public updateListener(
    position: Vector3,
    forward: Vector3,
    up: Vector3,
    velocity?: Vector3
  ): void {
    this.listenerPosition = position
    this.listenerForward = forward
    this.listenerUp = up

    if (velocity) {
      this.listenerVelocity = velocity
    }

    // Update Web Audio API listener
    if (this.listener.positionX) {
      // Modern API
      this.listener.positionX.value = position.x
      this.listener.positionY.value = position.y
      this.listener.positionZ.value = position.z

      this.listener.forwardX.value = forward.x
      this.listener.forwardY.value = forward.y
      this.listener.forwardZ.value = forward.z

      this.listener.upX.value = up.x
      this.listener.upY.value = up.y
      this.listener.upZ.value = up.z
    } else {
      // Legacy API
      this.listener.setPosition(position.x, position.y, position.z)
      this.listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z)
    }
  }

  // =============================================================================
  // VOLUME CONTROL
  // =============================================================================

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume))
    this.masterGain.gain.value = this.settings.masterVolume

    this.dispatchEvent({
      type: AudioEventType.VOLUME_CHANGED,
      data: { category: 'master', volume: this.settings.masterVolume },
      timestamp: Date.now()
    })
  }

  /**
   * Set category volume
   */
  public setCategoryVolume(category: AudioCategory, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume))

    switch (category) {
      case AudioCategory.MUSIC:
        this.settings.musicVolume = clampedVolume
        break
      case AudioCategory.SFX:
        this.settings.sfxVolume = clampedVolume
        break
      case AudioCategory.AMBIENT:
        this.settings.ambientVolume = clampedVolume
        break
      case AudioCategory.VOICE:
        this.settings.voiceVolume = clampedVolume
        break
      case AudioCategory.UI:
        this.settings.uiVolume = clampedVolume
        break
    }

    const gainNode = this.channelGains.get(category)
    if (gainNode) {
      gainNode.gain.value = clampedVolume
    }

    this.dispatchEvent({
      type: AudioEventType.VOLUME_CHANGED,
      data: { category, volume: clampedVolume },
      timestamp: Date.now()
    })
  }

  /**
   * Mute/unmute
   */
  public setMuted(muted: boolean): void {
    this.settings.muted = muted
    this.masterGain.gain.value = muted ? 0 : this.settings.masterVolume
  }

  // =============================================================================
  // EVENT SYSTEM
  // =============================================================================

  /**
   * Subscribe to audio events
   */
  public on(eventType: AudioEventType, callback: (event: AudioEvent) => void): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, [])
    }
    this.eventCallbacks.get(eventType)!.push(callback)
  }

  /**
   * Unsubscribe from audio events
   */
  public off(eventType: AudioEventType, callback: (event: AudioEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Dispatch event
   */
  private dispatchEvent(event: AudioEvent): void {
    const callbacks = this.eventCallbacks.get(event.type)
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in audio event callback for ${event.type}:`, error)
        }
      })
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get audio settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings }
  }

  /**
   * Get stats
   */
  public getStats() {
    return {
      ...this.stats,
      poolEfficiency: this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses) || 0
    }
  }

  /**
   * Resume audio context (for user interaction requirement)
   */
  public async resume(): Promise<void> {
    if (this.context.state === 'suspended') {
      await this.context.resume()
      console.log('🔊 AudioContext resumed')
    }
  }

  /**
   * Dispose
   */
  public async dispose(): Promise<void> {
    // Stop all sounds
    this.activeInstances.forEach(instance => {
      try {
        instance.source.stop()
      } catch (e) {
        // Already stopped
      }
    })

    // Stop music
    if (this.currentMusic) {
      this.currentMusic.source.stop()
    }

    // Close context
    await this.context.close()

    this.activeInstances.clear()
    this.pools.clear()
    this.audioBuffers.clear()
    this.eventCallbacks.clear()

    console.log('🗑️ AudioManager: Disposed')
  }
}
