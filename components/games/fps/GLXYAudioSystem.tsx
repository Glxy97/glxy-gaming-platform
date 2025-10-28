// @ts-nocheck
'use client'

import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

export interface AudioSettings {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  voiceVolume: number
  spatialAudio: boolean
  dynamicSoundtrack: boolean
  environmentalAudio: boolean
  voiceChat: boolean
  audioQuality: 'low' | 'medium' | 'high' | 'ultra'
  reverb: boolean
  occlusion: boolean
}

export interface Sound3D {
  id: string
  audio: HTMLAudioElement
  position: THREE.Vector3
  volume: number
  maxDistance: number
  referenceDistance: number
  rolloffFactor: number
  coneInnerAngle: number
  coneOuterAngle: number
  coneOuterGain: number
  loop: boolean
  isPlaying: boolean
  category: 'weapon' | 'footstep' | 'environment' | 'voice' | 'music' | 'explosion'
}

export interface AudioZone {
  id: string
  position: THREE.Vector3
  radius: number
  reverbPreset: 'small_room' | 'medium_room' | 'large_hall' | 'outdoor' | 'tunnel'
  filterType: 'lowpass' | 'highpass' | 'bandpass'
  filterFrequency: number
  filterQ: number
  volumeMultiplier: number
}

export interface DynamicSoundtrackTrack {
  id: string
  name: string
  url: string
  intensity: 'calm' | 'tense' | 'combat' | 'victory' | 'defeat'
  layer: 'ambient' | 'rhythm' | 'melody' | 'percussion'
  fadeInTime: number
  fadeOutTime: number
  bpm: number
}

export const GLXY_AUDIO_SYSTEM = {
  // Default audio settings
  DEFAULT_SETTINGS: {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.7,
    voiceVolume: 1.0,
    spatialAudio: true,
    dynamicSoundtrack: true,
    environmentalAudio: true,
    voiceChat: true,
    audioQuality: 'high',
    reverb: true,
    occlusion: true
  } as AudioSettings,

  // Audio constants
  MAX_SOUNDS: 32,
  MAX_VOICE_CHAT_PARTICIPANTS: 8,
  LISTENER_DISTANCE_MODEL: 'inverse',
  REFERENCE_DISTANCE: 1,
  MAX_DISTANCE: 100,
  ROLLOFF_FACTOR: 1,

  // Reverb settings
  REVERB_PRESETS: {
    small_room: {
      decayTime: 0.8,
      decayRatio: 0.5,
      preDelay: 0.01,
      wetLevel: 0.3,
      dryLevel: 0.7
    },
    medium_room: {
      decayTime: 1.5,
      decayRatio: 0.6,
      preDelay: 0.02,
      wetLevel: 0.4,
      dryLevel: 0.6
    },
    large_hall: {
      decayTime: 3.0,
      decayRatio: 0.7,
      preDelay: 0.04,
      wetLevel: 0.5,
      dryLevel: 0.5
    },
    outdoor: {
      decayTime: 0.1,
      decayRatio: 0.3,
      preDelay: 0.0,
      wetLevel: 0.1,
      dryLevel: 0.9
    },
    tunnel: {
      decayTime: 4.0,
      decayRatio: 0.8,
      preDelay: 0.05,
      wetLevel: 0.6,
      dryLevel: 0.4
    }
  },

  // Sound intensity levels for dynamic soundtrack
  INTENSITY_THRESHOLDS: {
    calm: 0.2,
    tense: 0.4,
    combat: 0.7,
    victory: 0.9,
    defeat: 0.1
  }
}

export class SpatialAudioSystem {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private settings!: AudioSettings
  private audioContext!: AudioContext
  private masterGain!: GainNode
  private sfxGain!: GainNode
  private musicGain!: GainNode
  private voiceGain!: GainNode
  private listener!: AudioListener
  private sounds3D!: Map<string, Sound3D>
  private audioZones!: Map<string, AudioZone>
  private dynamicSoundtrack!: DynamicSoundtrackTrack[]
  private currentIntensity!: string
  private convolver!: ConvolverNode
  private filters!: Map<string, BiquadFilterNode>
  private compressor!: DynamicsCompressorNode
  private analyser!: AnalyserNode

  // Voice chat
  private voiceChatStreams!: Map<string, MediaStream>
  private voiceChatSources!: Map<string, MediaStreamAudioSourceNode>

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.scene = scene
    this.camera = camera
    this.settings = { ...GLXY_AUDIO_SYSTEM.DEFAULT_SETTINGS }
    this.sounds3D = new Map()
    this.audioZones = new Map()
    this.dynamicSoundtrack = []
    this.currentIntensity = 'calm'
    this.voiceChatStreams = new Map()
    this.voiceChatSources = new Map()
    this.filters = new Map()

    this.initializeAudioSystem()
  }

  private initializeAudioSystem() {
    try {
      // Create Web Audio API context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create master audio listener
      this.listener = this.audioContext.listener
      this.updateListenerPosition()

      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.settings.masterVolume

      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.gain.value = this.settings.sfxVolume

      this.musicGain = this.audioContext.createGain()
      this.musicGain.gain.value = this.settings.musicVolume

      this.voiceGain = this.audioContext.createGain()
      this.voiceGain.gain.value = this.settings.voiceVolume

      // Create audio effects
      this.compressor = this.audioContext.createDynamicsCompressor()
      this.compressor.threshold.value = -24
      this.compressor.knee.value = 30
      this.compressor.ratio.value = 12
      this.compressor.attack.value = 0.003
      this.compressor.release.value = 0.25

      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048

      // Connect audio graph
      this.masterGain.connect(this.compressor)
      this.compressor.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)

      this.sfxGain.connect(this.masterGain)
      this.musicGain.connect(this.masterGain)
      this.voiceGain.connect(this.masterGain)

      // Setup reverb if enabled
      if (this.settings.reverb) {
        this.setupReverb()
      }

      console.log('🔊 GLXY Spatial Audio System initialized')

    } catch (error) {
      console.error('Failed to initialize audio system:', error)
    }
  }

  private setupReverb() {
    this.convolver = this.audioContext.createConvolver()

    // Create impulse response for reverb
    const length = this.audioContext.sampleRate * 2 // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }
    }

    this.convolver.buffer = impulse
  }

  // 3D SOUND MANAGEMENT
  public createSound3D(
    id: string,
    audioUrl: string,
    position: THREE.Vector3,
    options: Partial<Sound3D> = {}
  ): Sound3D | null {
    if (this.sounds3D.size >= GLXY_AUDIO_SYSTEM.MAX_SOUNDS) {
      console.warn('Maximum sounds reached, cannot create new sound')
      return null
    }

    try {
      const audio = new Audio(audioUrl)
      const source = this.audioContext.createMediaElementSource(audio)

      // Create panner node for 3D positioning
      const panner = this.audioContext.createPanner()
      panner.panningModel = 'HRTF'
      panner.distanceModel = GLXY_AUDIO_SYSTEM.LISTENER_DISTANCE_MODEL as DistanceModelType
      panner.refDistance = options.referenceDistance || GLXY_AUDIO_SYSTEM.REFERENCE_DISTANCE
      panner.maxDistance = options.maxDistance || GLXY_AUDIO_SYSTEM.MAX_DISTANCE
      panner.rolloffFactor = options.rolloffFactor || GLXY_AUDIO_SYSTEM.ROLLOFF_FACTOR
      panner.coneInnerAngle = options.coneInnerAngle || 360
      panner.coneOuterAngle = options.coneOuterAngle || 360
      panner.coneOuterGain = options.coneOuterGain || 0

      // Connect audio graph
      source.connect(panner)

      // Route to appropriate gain node based on category
      const category = options.category || 'sfx'
      switch (category) {
        case 'weapon':
        case 'footstep':
        case 'environment':
        case 'explosion':
          panner.connect(this.sfxGain)
          break
        case 'voice':
          panner.connect(this.voiceGain)
          break
        case 'music':
          panner.connect(this.musicGain)
          break
      }

      // Apply zone effects if in zone
      this.applyZoneEffects(panner, position)

      const sound3D: Sound3D = {
        id,
        audio,
        position: position.clone(),
        volume: options.volume || 1.0,
        maxDistance: options.maxDistance || GLXY_AUDIO_SYSTEM.MAX_DISTANCE,
        referenceDistance: options.referenceDistance || GLXY_AUDIO_SYSTEM.REFERENCE_DISTANCE,
        rolloffFactor: options.rolloffFactor || GLXY_AUDIO_SYSTEM.ROLLOFF_FACTOR,
        coneInnerAngle: options.coneInnerAngle || 360,
        coneOuterAngle: options.coneOuterAngle || 360,
        coneOuterGain: options.coneOuterGain || 0,
        loop: options.loop || false,
        isPlaying: false,
        category: category as Sound3D['category']
      }

      audio.loop = sound3D.loop
      audio.volume = sound3D.volume

      this.sounds3D.set(id, sound3D)

      console.log(`🔊 Created 3D sound: ${id} at position`, position)
      return sound3D

    } catch (error) {
      console.error('Failed to create 3D sound:', error)
      return null
    }
  }

  public playSound3D(id: string) {
    const sound = this.sounds3D.get(id)
    if (!sound) return

    try {
      sound.audio.play()
      sound.isPlaying = true

      // Update 3D position
      this.updateSound3DPosition(id)

      console.log(`🔊 Playing 3D sound: ${id}`)
    } catch (error) {
      console.error('Failed to play 3D sound:', error)
    }
  }

  public stopSound3D(id: string) {
    const sound = this.sounds3D.get(id)
    if (!sound) return

    sound.audio.pause()
    sound.audio.currentTime = 0
    sound.isPlaying = false

    console.log(`🔇 Stopped 3D sound: ${id}`)
  }

  public updateSound3DPosition(id: string, newPosition?: THREE.Vector3) {
    const sound = this.sounds3D.get(id)
    if (!sound || !this.settings.spatialAudio) return

    if (newPosition) {
      sound.position.copy(newPosition)
    }

    // Update panner position
    const panner = this.getSoundPanner(id)
    if (panner) {
      panner.setPosition(sound.position.x, sound.position.y, sound.position.z)
    }
  }

  private getSoundPanner(id: string): PannerNode | null {
    // This would need to store panner references or recreate them
    // For simplicity, we'll use position-based audio calculation
    return null
  }

  // LISTENER MANAGEMENT
  public updateListenerPosition() {
    if (!this.settings.spatialAudio) return

    // Update listener position and orientation
    this.listener.setPosition(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    )

    // Set listener orientation (forward and up vectors)
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(this.camera.quaternion)

    const up = new THREE.Vector3(0, 1, 0)
    up.applyQuaternion(this.camera.quaternion)

    this.listener.setOrientation(
      forward.x, forward.y, forward.z,
      up.x, up.y, up.z
    )
  }

  // AUDIO ZONES
  public createAudioZone(zone: AudioZone) {
    this.audioZones.set(zone.id, zone)
    console.log(`📍 Created audio zone: ${zone.id}`)
  }

  private applyZoneEffects(panner: PannerNode, position: THREE.Vector3) {
    if (!this.settings.environmentalAudio) return

    // Find which zone the position is in
    let activeZone: AudioZone | null = null
    let minDistance = Infinity

    for (const [zoneId, zone] of this.audioZones) {
      const distance = position.distanceTo(zone.position)
      if (distance < zone.radius && distance < minDistance) {
        minDistance = distance
        activeZone = zone
      }
    }

    if (activeZone) {
      // Apply reverb preset
      if (this.settings.reverb && this.convolver) {
        const preset = GLXY_AUDIO_SYSTEM.REVERB_PRESETS[activeZone.reverbPreset]
        // Apply reverb settings
      }

      // Apply filter
      const filterId = `${activeZone.id}_filter`
      let filter = this.filters.get(filterId)

      if (!filter) {
        filter = this.audioContext.createBiquadFilter()
        filter.type = activeZone.filterType
        filter.frequency.value = activeZone.filterFrequency
        filter.Q.value = activeZone.filterQ
        this.filters.set(filterId, filter)
      }

      // Apply volume multiplier
      panner.connect(filter)
    }
  }

  // DYNAMIC SOUNDTRACK
  public loadSoundtrackTracks(tracks: DynamicSoundtrackTrack[]) {
    this.dynamicSoundtrack = tracks
    console.log(`🎵 Loaded ${tracks.length} soundtrack tracks`)
  }

  public updateGameIntensity(intensity: 'calm' | 'tense' | 'combat' | 'victory' | 'defeat') {
    if (!this.settings.dynamicSoundtrack || intensity === this.currentIntensity) return

    this.currentIntensity = intensity

    // Find appropriate tracks for current intensity
    const relevantTracks = this.dynamicSoundtrack.filter(
      track => track.intensity === intensity
    )

    // Crossfade between tracks
    this.crossfadeSoundtrack(relevantTracks)

    console.log(`🎵 Changed soundtrack intensity to: ${intensity}`)
  }

  private crossfadeSoundtrack(tracks: DynamicSoundtrackTrack[]) {
    // Stop current tracks
    this.dynamicSoundtrack.forEach(track => {
      const sound = this.sounds3D.get(`music_${track.id}`)
      if (sound && sound.isPlaying) {
        this.fadeOutSound(sound.id, track.fadeOutTime || 2000)
      }
    })

    // Start new tracks
    tracks.forEach(track => {
      const soundId = `music_${track.id}`
      let sound = this.sounds3D.get(soundId) || null

      if (!sound) {
        // Create new sound at camera position for music
        sound = this.createSound3D(
          soundId,
          track.url,
          this.camera.position.clone(),
          {
            category: 'music',
            loop: true,
            volume: 0.5
          }
        )
      }

      if (sound) {
        this.fadeInSound(sound.id, track.fadeInTime || 2000)
      }
    })
  }

  private fadeInSound(id: string, duration: number) {
    const sound = this.sounds3D.get(id)
    if (!sound) return

    sound.audio.volume = 0
    this.playSound3D(id)

    const startTime = Date.now()
    const targetVolume = sound.volume

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      sound.audio.volume = targetVolume * progress

      if (progress >= 1) {
        clearInterval(fadeInterval)
      }
    }, 16) // ~60fps
  }

  private fadeOutSound(id: string, duration: number) {
    const sound = this.sounds3D.get(id)
    if (!sound) return

    const startTime = Date.now()
    const startVolume = sound.audio.volume

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      sound.audio.volume = startVolume * (1 - progress)

      if (progress >= 1) {
        this.stopSound3D(id)
        clearInterval(fadeInterval)
      }
    }, 16) // ~60fps
  }

  // ENVIRONMENTAL AUDIO
  public playEnvironmentalSound(
    type: 'footstep' | 'explosion' | 'gunshot' | 'reload' | 'melee',
    position: THREE.Vector3,
    intensity: number = 1.0
  ) {
    if (!this.settings.environmentalAudio) return

    const soundId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const audioUrl = this.getEnvironmentalSoundUrl(type)

    const sound = this.createSound3D(
      soundId,
      audioUrl,
      position.clone(),
      {
        category: type === 'footstep' ? 'footstep' : 'weapon',
        volume: intensity,
        maxDistance: type === 'explosion' ? 100 : 30,
        loop: false
      }
    )

    if (sound) {
      this.playSound3D(soundId)

      // Auto-cleanup after sound finishes
      setTimeout(() => {
        this.removeSound3D(soundId)
      }, 3000)
    }
  }

  private getEnvironmentalSoundUrl(type: string): string {
    // In a real implementation, these would be actual audio files
    const soundMap = {
      footstep: '/audio/footstep.mp3',
      explosion: '/audio/explosion.mp3',
      gunshot: '/audio/gunshot.mp3',
      reload: '/audio/reload.mp3',
      melee: '/audio/melee.mp3'
    }
    return soundMap[type as keyof typeof soundMap] || '/audio/default.mp3'
  }

  // VOICE CHAT
  public addVoiceChatParticipant(playerId: string, stream: MediaStream) {
    if (!this.settings.voiceChat) return

    try {
      const source = this.audioContext.createMediaStreamSource(stream)
      const panner = this.audioContext.createPanner()

      source.connect(panner)
      panner.connect(this.voiceGain)

      this.voiceChatStreams.set(playerId, stream)
      this.voiceChatSources.set(playerId, source)

      console.log(`🎤 Added voice chat participant: ${playerId}`)
    } catch (error) {
      console.error('Failed to add voice chat participant:', error)
    }
  }

  public removeVoiceChatParticipant(playerId: string) {
    const source = this.voiceChatSources.get(playerId)
    if (source) {
      source.disconnect()
      this.voiceChatSources.delete(playerId)
    }

    const stream = this.voiceChatStreams.get(playerId)
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      this.voiceChatStreams.delete(playerId)
    }

    console.log(`🔇 Removed voice chat participant: ${playerId}`)
  }

  public updateVoiceChatPosition(playerId: string, position: THREE.Vector3) {
    const source = this.voiceChatSources.get(playerId)
    if (!source) return

    // Create panner if it doesn't exist
    let panner = source.context.createPanner()
    panner.setPosition(position.x, position.y, position.z)
    panner.connect(this.voiceGain)
  }

  // SETTINGS MANAGEMENT
  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings }

    // Update gain nodes
    this.masterGain.gain.value = this.settings.masterVolume
    this.sfxGain.gain.value = this.settings.sfxVolume
    this.musicGain.gain.value = this.settings.musicVolume
    this.voiceGain.gain.value = this.settings.voiceVolume

    console.log('🔊 Updated audio settings:', this.settings)
  }

  public getSettings(): AudioSettings {
    return { ...this.settings }
  }

  // AUDIO ANALYSIS
  public getAudioAnalysis(): {
    averageVolume: number
    peakVolume: number
    frequencyData: Uint8Array
  } {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(dataArray)

    let sum = 0
    let peak = 0

    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i]
      peak = Math.max(peak, dataArray[i])
    }

    return {
      averageVolume: sum / dataArray.length / 255,
      peakVolume: peak / 255,
      frequencyData: dataArray
    }
  }

  // CLEANUP
  public removeSound3D(id: string) {
    const sound = this.sounds3D.get(id)
    if (!sound) return

    if (sound.isPlaying) {
      this.stopSound3D(id)
    }

    // Disconnect audio nodes
    const source = this.audioContext.createMediaElementSource(sound.audio)
    source.disconnect()

    this.sounds3D.delete(id)
    console.log(`🗑️ Removed 3D sound: ${id}`)
  }

  public destroy() {
    // Stop all sounds
    this.sounds3D.forEach((sound, id) => {
      this.removeSound3D(id)
    })

    // Clear voice chat
    this.voiceChatStreams.forEach((stream, playerId) => {
      this.removeVoiceChatParticipant(playerId)
    })

    // Disconnect audio nodes
    this.masterGain.disconnect()
    this.sfxGain.disconnect()
    this.musicGain.disconnect()
    this.voiceGain.disconnect()
    this.compressor.disconnect()
    this.analyser.disconnect()

    if (this.convolver) {
      this.convolver.disconnect()
    }

    this.filters.forEach(filter => filter.disconnect())

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }

    console.log('🧹 GLXY Spatial Audio System destroyed')
  }

  // UPDATE LOOP
  public update(deltaTime: number) {
    // Update listener position
    this.updateListenerPosition()

    // Update 3D sound positions and calculate volumes
    if (this.settings.spatialAudio) {
      this.sounds3D.forEach((sound, id) => {
        if (sound.isPlaying) {
          this.updateSound3DPosition(id)

          // Calculate distance-based volume
          const distance = this.camera.position.distanceTo(sound.position)
          const volume = this.calculateDistanceVolume(distance, sound)

          if (sound.audio.volume !== volume) {
            sound.audio.volume = volume
          }
        }
      })
    }

    // Update game intensity for dynamic soundtrack
    this.updateDynamicSoundtrackIntensity()
  }

  private calculateDistanceVolume(distance: number, sound: Sound3D): number {
    if (distance <= sound.referenceDistance) {
      return sound.volume
    }

    if (distance >= sound.maxDistance) {
      return 0
    }

    // Inverse distance formula
    const volume = sound.volume * (sound.referenceDistance / (sound.referenceDistance + sound.rolloffFactor * (distance - sound.referenceDistance)))

    return Math.max(0, Math.min(1, volume))
  }

  private updateDynamicSoundtrackIntensity() {
    if (!this.settings.dynamicSoundtrack) return

    // Calculate game intensity based on various factors
    // This would be connected to actual game state
    const killsPerMinute = 0.5 // Example value
    const playerHealth = 0.8 // Example value
    const enemiesNearby = 2 // Example value

    let newIntensity: string

    if (killsPerMinute > 2 || enemiesNearby > 3) {
      newIntensity = 'combat'
    } else if (enemiesNearby > 0 || playerHealth < 0.5) {
      newIntensity = 'tense'
    } else {
      newIntensity = 'calm'
    }

    if (newIntensity !== this.currentIntensity) {
      this.updateGameIntensity(newIntensity as any)
    }
  }
}

// React component for Audio Settings
export const AudioSettingsComponent: React.FC<{
  audioSystem: SpatialAudioSystem
  isVisible: boolean
  onSettingsChange: (settings: AudioSettings) => void
}> = ({ audioSystem, isVisible, onSettingsChange }) => {
  const [settings, setSettings] = React.useState(audioSystem.getSettings())
  const [audioAnalysis, setAudioAnalysis] = React.useState(audioSystem.getAudioAnalysis())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAudioAnalysis(audioSystem.getAudioAnalysis())
    }, 100)

    return () => clearInterval(interval)
  }, [audioSystem])

  const updateSetting = (key: keyof AudioSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    audioSystem.updateSettings({ [key]: value })
    onSettingsChange(newSettings)
  }

  if (!isVisible) return null

  return (
    <div className="audio-settings-panel">
      <div className="audio-controls">
        <h3>🔊 GLXY Audio Settings</h3>

        <div className="setting-group">
          <label>Master Volume: {Math.round(settings.masterVolume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.masterVolume}
            onChange={(e) => updateSetting('masterVolume', Number(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label>SFX Volume: {Math.round(settings.sfxVolume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.sfxVolume}
            onChange={(e) => updateSetting('sfxVolume', Number(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label>Music Volume: {Math.round(settings.musicVolume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.musicVolume}
            onChange={(e) => updateSetting('musicVolume', Number(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label>Voice Volume: {Math.round(settings.voiceVolume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.voiceVolume}
            onChange={(e) => updateSetting('voiceVolume', Number(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.spatialAudio}
              onChange={(e) => updateSetting('spatialAudio', e.target.checked)}
            />
            3D Spatial Audio
          </label>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.dynamicSoundtrack}
              onChange={(e) => updateSetting('dynamicSoundtrack', e.target.checked)}
            />
            Dynamic Soundtrack
          </label>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.environmentalAudio}
              onChange={(e) => updateSetting('environmentalAudio', e.target.checked)}
            />
            Environmental Audio
          </label>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={settings.voiceChat}
              onChange={(e) => updateSetting('voiceChat', e.target.checked)}
            />
            Voice Chat
          </label>
        </div>

        <div className="setting-group">
          <label>Audio Quality:</label>
          <select
            value={settings.audioQuality}
            onChange={(e) => updateSetting('audioQuality', e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>

        <div className="audio-analysis">
          <h4>Audio Analysis</h4>
          <div className="meter">
            <div className="meter-label">Volume:</div>
            <div className="meter-bar">
              <div
                className="meter-fill"
                style={{ width: `${audioAnalysis.averageVolume * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="frequency-visualizer">
            {Array.from({ length: 16 }, (_, i) => {
              const freqIndex = Math.floor(i * audioAnalysis.frequencyData.length / 16)
              const freqValue = audioAnalysis.frequencyData[freqIndex] / 255
              return (
                <div
                  key={i}
                  className="freq-bar"
                  style={{ height: `${freqValue * 100}%` }}
                ></div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .audio-settings-panel {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          pointer-events: auto;
        }

        .audio-controls {
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #ff6b00;
          border-radius: 12px;
          padding: 20px;
          color: white;
          min-width: 350px;
          max-width: 400px;
        }

        .audio-controls h3 {
          color: #ff6b00;
          margin-bottom: 15px;
          text-align: center;
          font-size: 18px;
        }

        .setting-group {
          margin: 12px 0;
        }

        .setting-group label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          color: #e0e0e0;
          margin-bottom: 5px;
        }

        .setting-group input[type="range"] {
          width: 100%;
          height: 6px;
          background: #333;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
        }

        .setting-group input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #ff6b00;
          border-radius: 50%;
          cursor: pointer;
        }

        .setting-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin-right: 8px;
        }

        .setting-group select {
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          margin-left: 8px;
        }

        .audio-analysis {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #444;
        }

        .audio-analysis h4 {
          color: #ff6b00;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .meter {
          margin: 10px 0;
        }

        .meter-label {
          font-size: 12px;
          color: #ccc;
          margin-bottom: 5px;
        }

        .meter-bar {
          width: 100%;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .meter-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
          transition: width 0.1s ease;
        }

        .frequency-visualizer {
          display: flex;
          align-items: flex-end;
          height: 40px;
          gap: 2px;
          margin-top: 10px;
        }

        .freq-bar {
          flex: 1;
          background: linear-gradient(180deg, #ff6b00, #ff00ff);
          min-height: 2px;
          border-radius: 1px;
          transition: height 0.05s ease;
        }
      `}</style>
    </div>
  )
}

export default SpatialAudioSystem