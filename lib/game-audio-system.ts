/**
 * GLXY Gaming Platform - Universal Game Audio System
 *
 * Professional Web Audio API-based sound system for all games
 * Features:
 * - Procedural sound generation (no external files needed!)
 * - 3D positional audio for FPS/Racing
 * - Dynamic music system
 * - Sound effects for all game actions
 * - Volume control & mixing
 * - Reverb, delay, and other effects
 */

export type SoundType =
  // UI Sounds
  | 'ui_click' | 'ui_hover' | 'ui_confirm' | 'ui_cancel' | 'ui_error' | 'ui_success'
  // Game Events
  | 'game_start' | 'game_over' | 'game_win' | 'game_lose' | 'game_pause' | 'game_resume'
  // Tetris
  | 'tetris_move' | 'tetris_rotate' | 'tetris_drop' | 'tetris_line_clear'
  | 'tetris_combo' | 'tetris_attack' | 'tetris_ko'
  // Connect4 & TicTacToe
  | 'piece_drop' | 'piece_place' | 'victory' | 'draw'
  // Chess
  | 'chess_move' | 'chess_capture' | 'chess_check' | 'chess_checkmate' | 'chess_castle'
  // UNO
  | 'card_shuffle' | 'card_draw' | 'card_play' | 'uno_call' | 'uno_penalty'
  // FPS
  | 'weapon_fire' | 'weapon_reload' | 'explosion' | 'footstep' | 'hit_marker' | 'enemy_death'
  // Racing
  | 'engine_idle' | 'engine_rev' | 'tire_screech' | 'crash' | 'checkpoint' | 'race_finish'
  // General
  | 'countdown_321' | 'countdown_go' | 'achievement' | 'level_up'

export interface AudioSettings {
  masterVolume: number // 0-1
  sfxVolume: number // 0-1
  musicVolume: number // 0-1
  enabled: boolean
  spatial3D: boolean // Enable 3D audio for FPS/Racing
}

export class GameAudioSystem {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private settings: AudioSettings
  private isInitialized = false
  private currentMusic: OscillatorNode[] = []
  private listenerPosition = { x: 0, y: 0, z: 0 }

  constructor(settings?: Partial<AudioSettings>) {
    this.settings = {
      masterVolume: settings?.masterVolume ?? 0.7,
      sfxVolume: settings?.sfxVolume ?? 0.8,
      musicVolume: settings?.musicVolume ?? 0.5,
      enabled: settings?.enabled ?? true,
      spatial3D: settings?.spatial3D ?? false
    }
  }

  /**
   * Initialize Audio Context (must be called after user interaction!)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.settings.enabled) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create master gain nodes
      this.masterGain = this.audioContext.createGain()
      this.sfxGain = this.audioContext.createGain()
      this.musicGain = this.audioContext.createGain()

      // Set volumes
      this.masterGain.gain.value = this.settings.masterVolume
      this.sfxGain.gain.value = this.settings.sfxVolume
      this.musicGain.gain.value = this.settings.musicVolume

      // Connect gain nodes
      this.sfxGain.connect(this.masterGain)
      this.musicGain.connect(this.masterGain)
      this.masterGain.connect(this.audioContext.destination)

      // Create reverb for 3D audio
      await this.createReverb()

      this.isInitialized = true
      console.log('🔊 Game Audio System initialized')
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  /**
   * Create reverb impulse response
   */
  private async createReverb(): Promise<void> {
    if (!this.audioContext) return

    this.reverb = this.audioContext.createConvolver()

    // Generate simple reverb impulse response
    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * 2 // 2 second reverb
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }
    }

    this.reverb.buffer = impulse
    this.reverb.connect(this.masterGain!)
  }

  /**
   * Play a procedurally generated sound effect
   */
  playSound(type: SoundType, options?: {
    volume?: number
    pitch?: number
    position?: { x: number; y: number; z: number }
    loop?: boolean
  }): void {
    if (!this.audioContext || !this.isInitialized || !this.settings.enabled) {
      this.initialize() // Auto-initialize on first sound
      return
    }

    const sound = this.generateSound(type, options)
    if (sound) {
      sound.start()

      // Auto-cleanup
      if (!options?.loop) {
        setTimeout(() => sound.stop(), 2000)
      }
    }
  }

  /**
   * Generate procedural sound based on type
   */
  private generateSound(type: SoundType, options?: any): OscillatorNode | null {
    if (!this.audioContext || !this.sfxGain) return null

    const ctx = this.audioContext
    const now = ctx.currentTime

    // Create oscillator and gain for this sound
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const volume = (options?.volume ?? 1) * this.settings.sfxVolume

    // Configure sound based on type
    switch (type) {
      case 'ui_click':
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05)
        gain.gain.setValueAtTime(volume * 0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
        osc.type = 'sine'
        break

      case 'ui_hover':
        osc.frequency.value = 600
        gain.gain.setValueAtTime(volume * 0.1, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03)
        osc.type = 'sine'
        break

      case 'tetris_line_clear':
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2)
        gain.gain.setValueAtTime(volume * 0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc.type = 'square'
        break

      case 'tetris_combo':
        osc.frequency.setValueAtTime(880, now)
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3)
        gain.gain.setValueAtTime(volume * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        osc.type = 'sawtooth'
        break

      case 'tetris_attack':
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)
        gain.gain.setValueAtTime(volume * 0.6, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.type = 'sawtooth'
        break

      case 'piece_drop':
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1)
        gain.gain.setValueAtTime(volume * 0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.type = 'triangle'
        break

      case 'victory':
        // Victory fanfare (simplified)
        osc.frequency.setValueAtTime(523.25, now) // C
        osc.frequency.setValueAtTime(659.25, now + 0.15) // E
        osc.frequency.setValueAtTime(783.99, now + 0.3) // G
        osc.frequency.setValueAtTime(1046.50, now + 0.45) // C
        gain.gain.setValueAtTime(volume * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        osc.type = 'sine'
        break

      case 'weapon_fire':
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.05)
        gain.gain.setValueAtTime(volume * 0.8, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
        osc.type = 'sawtooth'
        break

      case 'explosion':
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3)
        gain.gain.setValueAtTime(volume * 1.0, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        osc.type = 'sawtooth'
        break

      case 'engine_idle':
        osc.frequency.value = 80 + (Math.random() * 10)
        gain.gain.value = volume * 0.3
        osc.type = 'sawtooth'
        // Note: OscillatorNode does not support looping like AudioBufferSourceNode
        break

      case 'tire_screech':
        osc.frequency.value = 400 + (Math.random() * 200)
        gain.gain.setValueAtTime(volume * 0.6, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
        osc.type = 'sawtooth'
        break

      case 'card_shuffle':
        osc.frequency.setValueAtTime(200, now)
        for (let i = 0; i < 10; i++) {
          const time = now + (i * 0.02)
          osc.frequency.setValueAtTime(200 + (Math.random() * 200), time)
        }
        gain.gain.setValueAtTime(volume * 0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc.type = 'triangle'
        break

      case 'achievement':
        osc.frequency.setValueAtTime(523.25, now) // C
        osc.frequency.setValueAtTime(659.25, now + 0.1) // E
        osc.frequency.setValueAtTime(783.99, now + 0.2) // G
        osc.frequency.setValueAtTime(1046.50, now + 0.3) // High C
        gain.gain.setValueAtTime(volume * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
        osc.type = 'sine'
        break

      default:
        // Generic beep
        osc.frequency.value = 440
        gain.gain.setValueAtTime(volume * 0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.type = 'sine'
    }

    // Connect audio graph
    osc.connect(gain)

    // Add 3D positioning if enabled
    if (this.settings.spatial3D && options?.position) {
      const panner = ctx.createPanner()
      panner.setPosition(options.position.x, options.position.y, options.position.z)
      panner.panningModel = 'HRTF'
      panner.distanceModel = 'inverse'
      panner.refDistance = 1
      panner.maxDistance = 100
      panner.rolloffFactor = 1

      gain.connect(panner)
      panner.connect(this.sfxGain)
    } else {
      gain.connect(this.sfxGain)
    }

    return osc
  }

  /**
   * Start background music (procedural loop)
   */
  startMusic(tempo: number = 120, key: 'major' | 'minor' = 'major'): void {
    if (!this.audioContext || !this.musicGain || !this.isInitialized) return

    this.stopMusic() // Stop existing music

    const ctx = this.audioContext
    const now = ctx.currentTime

    // Simple chord progression
    const chords = key === 'major'
      ? [
          [261.63, 329.63, 392.00], // C major
          [293.66, 369.99, 440.00], // D minor
          [329.63, 415.30, 493.88], // E minor
          [349.23, 440.00, 523.25]  // F major
        ]
      : [
          [220.00, 261.63, 329.63], // A minor
          [246.94, 293.66, 369.99], // B diminished
          [261.63, 329.63, 392.00], // C major
          [293.66, 349.23, 440.00]  // D minor
        ]

    const beatDuration = 60 / tempo

    // Create oscillators for background ambience
    chords.forEach((chord, index) => {
      chord.forEach((freq, noteIndex) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.frequency.value = freq
        osc.type = 'sine'

        const startTime = now + (index * beatDuration * 4)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(this.settings.musicVolume * 0.1, startTime + 0.1)
        gain.gain.setValueAtTime(this.settings.musicVolume * 0.1, startTime + beatDuration * 3.5)
        gain.gain.linearRampToValueAtTime(0, startTime + beatDuration * 4)

        osc.connect(gain)
        gain.connect(this.musicGain!)

        osc.start(startTime)
        osc.stop(startTime + beatDuration * 4)

        this.currentMusic.push(osc)
      })
    })
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    this.currentMusic.forEach(osc => {
      try {
        osc.stop()
      } catch (e) {
        // Already stopped
      }
    })
    this.currentMusic = []
  }

  /**
   * Update listener position for 3D audio (FPS/Racing)
   */
  updateListenerPosition(x: number, y: number, z: number, forward?: { x: number; y: number; z: number }): void {
    if (!this.audioContext || !this.settings.spatial3D) return

    const listener = this.audioContext.listener

    if (listener.positionX) {
      listener.positionX.value = x
      listener.positionY.value = y
      listener.positionZ.value = z

      if (forward && listener.forwardX) {
        listener.forwardX.value = forward.x
        listener.forwardY.value = forward.y
        listener.forwardZ.value = forward.z
      }
    } else {
      // Fallback for older browsers
      listener.setPosition(x, y, z)
      if (forward) {
        listener.setOrientation(forward.x, forward.y, forward.z, 0, 1, 0)
      }
    }

    this.listenerPosition = { x, y, z }
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings }

    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.masterVolume
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.settings.sfxVolume
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.settings.musicVolume
    }
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.stopMusic()

    if (this.audioContext) {
      this.audioContext.close()
    }

    this.audioContext = null
    this.masterGain = null
    this.sfxGain = null
    this.musicGain = null
    this.reverb = null
    this.isInitialized = false
  }
}

// Global singleton instance
let globalAudioSystem: GameAudioSystem | null = null

/**
 * Get or create global audio system instance
 */
export function getAudioSystem(settings?: Partial<AudioSettings>): GameAudioSystem {
  if (!globalAudioSystem) {
    globalAudioSystem = new GameAudioSystem(settings)
  }
  return globalAudioSystem
}

/**
 * React Hook for using audio system
 */
export function useGameAudio(settings?: Partial<AudioSettings>) {
  const audioSystem = getAudioSystem(settings)

  // Auto-initialize on mount
  React.useEffect(() => {
    const handleClick = () => {
      audioSystem.initialize()
      document.removeEventListener('click', handleClick)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return {
    playSound: (type: SoundType, options?: any) => audioSystem.playSound(type, options),
    startMusic: (tempo?: number, key?: 'major' | 'minor') => audioSystem.startMusic(tempo, key),
    stopMusic: () => audioSystem.stopMusic(),
    updateSettings: (newSettings: Partial<AudioSettings>) => audioSystem.updateSettings(newSettings),
    updateListenerPosition: (x: number, y: number, z: number, forward?: any) =>
      audioSystem.updateListenerPosition(x, y, z, forward),
    getSettings: () => audioSystem.getSettings()
  }
}

// React import for hook
import React from 'react'
