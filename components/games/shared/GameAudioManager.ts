/**
 * 🎵 GAME AUDIO MANAGER
 *
 * Universal audio system for all games
 * - Keyboard blocking sounds
 * Game state transitions
 * UI interactions
 * Debug audio feedback
 */

export type GameSound =
  | 'gameStart'          // When game starts
  | 'gamePause'          // When game is paused
  | 'gameResume'         // When game resumes
  | 'gameEnd'            // When game ends
  | 'error'              // Error occurred
  | 'success'            // Success action
  | 'click'              // UI click
  | 'hover'              // UI hover
  | 'notification'       // General notification
  | 'shoot'              // Weapon shooting
  | 'reload'             // Weapon reload
  | 'hit'                // Player/enemy hit
  | 'explosion'          // Explosion effect
  | 'powerup'            // Power-up collected
  | 'levelUp'            // Level completed
  | 'gameOver'           // Game over
  | 'footstep'           // Player footsteps
  | 'jump'               // Player jump
  | 'land'               // Player landing

export interface GameAudioConfig {
  enabled?: boolean
  volume?: number
  debugMode?: boolean
  useWebAudio?: boolean
}

export class GameAudioManager {
  private static instance: GameAudioManager | null = null
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private volume: number = 0.5
  private debugMode: boolean = false
  private sounds: Map<GameSound, AudioBuffer> = new Map()
  private loadedSounds: Set<string> = new Set()

  private constructor(config: GameAudioConfig = {}) {
    this.enabled = config.enabled ?? true
    this.volume = config.volume ?? 0.5
    this.debugMode = config.debugMode ?? false

    if (typeof window !== 'undefined') {
      this.initializeAudioContext()
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: GameAudioManager): GameAudioManager {
    if (!GameAudioManager.instance) {
      GameAudioManager.instance = new GameAudioManager(config)
    }
    return GameAudioManager.instance
  }

  /**
   * Initialize Web Audio API
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Resume audio context if suspended (Chrome policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      if (this.debugMode) {
        console.log('🎵 GameAudioManager: Audio context initialized')
      }
    } catch (error) {
      console.warn('🎵 GameAudioManager: Failed to initialize audio context', error)
    }
  }

  /**
   * Play a sound effect
   */
  playSound(soundName: GameSound, options: { volume?: number; pitch?: number } = {}): void {
    if (!this.enabled || !this.audioContext) return

    const soundBuffer = this.sounds.get(soundName)
    if (!soundBuffer) {
      // Create synthesized sound if no audio file exists
      this.createSynthesizedSound(soundName, options)
      return
    }

    try {
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      // Connect nodes
      source.buffer = soundBuffer
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Apply volume and pitch
      const finalVolume = (options.volume ?? 1.0) * this.volume
      gainNode.gain.value = finalVolume

      // Play sound
      source.start(0)

      if (this.debugMode) {
        console.log(`🎵 Playing sound: ${soundName} (volume: ${finalVolume})`)
      }
    } catch (error) {
      console.warn(`🎵 Failed to play sound: ${soundName}`, error)
    }
  }

  /**
   * Create synthesized sound effects
   */
  private createSynthesizedSound(soundName: GameSound, options: { volume?: number; pitch?: number } = {}): void {
    if (!this.audioContext) return

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.1 // Short sound
    const buffer = this.audioContext.createBuffer(1, duration, sampleRate)
    const data = buffer.getChannelData(0)

    const finalVolume = (options.volume ?? 1.0) * this.volume

    switch (soundName) {
      case 'gameStart':
        this.createStartSound(data, sampleRate, finalVolume)
        break
      case 'gamePause':
        this.createPauseSound(data, sampleRate, finalVolume)
        break
      case 'gameResume':
        this.createResumeSound(data, sampleRate, finalVolume)
        break
      case 'success':
        this.createSuccessSound(data, sampleRate, finalVolume)
        break
      case 'error':
        this.createErrorSound(data, sampleRate, finalVolume)
        break
      case 'shoot':
        this.createShootSound(data, sampleRate, finalVolume)
        break
      case 'reload':
        this.createReloadSound(data, sampleRate, finalVolume)
        break
      case 'hit':
        this.createHitSound(data, sampleRate, finalVolume)
        break
      case 'explosion':
        this.createExplosionSound(data, sampleRate, finalVolume)
        break
      case 'powerup':
        this.createPowerupSound(data, sampleRate, finalVolume)
        break
      case 'levelUp':
        this.createLevelUpSound(data, sampleRate, finalVolume)
        break
      case 'footstep':
        this.createFootstepSound(data, sampleRate, finalVolume)
        break
      case 'jump':
        this.createJumpSound(data, sampleRate, finalVolume)
        break
      case 'land':
        this.createLandSound(data, sampleRate, finalVolume)
        break
      default:
        this.createDefaultBeep(data, sampleRate, finalVolume)
    }

    // Store and play the generated sound
    this.sounds.set(soundName, buffer)
    this.playSound(soundName, options)
  }

  
  /**
   * Create a "start" sound (rising tone)
   */
  private createStartSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Rising tone
      const frequency = 200 + t * 400
      data[i] = Math.sin(t * Math.PI * 2 * frequency) * volume * (1 - t)
    }
  }

  /**
   * Create a "pause" sound (descending tone)
   */
  private createPauseSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Descending tone
      const frequency = 800 - t * 400
      data[i] = Math.sin(t * Math.PI * 2 * frequency) * volume * (1 - t)
    }
  }

  /**
   * Create a "resume" sound (ascending tone)
   */
  private createResumeSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Ascending tone with vibrato
      const frequency = 400 + t * 200
      const vibrato = Math.sin(t * Math.PI * 20) * 0.1
      data[i] = Math.sin(t * Math.PI * 2 * frequency * (1 + vibrato)) * volume * t
    }
  }

  /**
   * Create a "success" sound (positive chime)
   */
  private createSuccessSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Two-tone success chime
      const freq1 = 523.25 // C5
      const freq2 = 659.25 // E5
      data[i] = (
        Math.sin(t * Math.PI * 2 * freq1) * 0.5 +
        Math.sin(t * Math.PI * 2 * freq2) * 0.5
      ) * volume * Math.exp(-t * 8)
    }
  }

  /**
   * Create an "error" sound (buzz)
   */
  private createErrorSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Discordant buzz
      const noise = (Math.random() - 0.5) * 0.3
      data[i] = noise * volume * Math.exp(-t * 15)
    }
  }

  /**
   * Create default beep sound
   */
  private createDefaultBeep(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      data[i] = Math.sin(t * Math.PI * 2 * 440) * volume * (1 - t)
    }
  }

  /**
   * Create shooting sound
   */
  private createShootSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Sharp burst with noise
      const noise = (Math.random() - 0.5) * 0.3
      const tone = Math.sin(t * Math.PI * 2 * 200) * 0.7
      data[i] = (tone + noise) * volume * Math.exp(-t * 15)
    }
  }

  /**
   * Create reload sound
   */
  private createReloadSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Mechanical click sounds
      const click1 = Math.sin(t * Math.PI * 2 * 800) * (t < 0.3 ? 1 : 0)
      const click2 = Math.sin(t * Math.PI * 2 * 600) * (t > 0.4 && t < 0.7 ? 1 : 0)
      data[i] = (click1 + click2) * volume * 0.5
    }
  }

  /**
   * Create hit sound
   */
  private createHitSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Impact sound with low frequency thud
      const impact = Math.sin(t * Math.PI * 2 * 80) * Math.exp(-t * 8)
      const crackle = (Math.random() - 0.5) * 0.2 * Math.exp(-t * 20)
      data[i] = (impact + crackle) * volume
    }
  }

  /**
   * Create explosion sound
   */
  private createExplosionSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Low rumble with noise
      const rumble = Math.sin(t * Math.PI * 2 * 40) * Math.exp(-t * 3)
      const noise = (Math.random() - 0.5) * 0.8 * Math.exp(-t * 10)
      data[i] = (rumble + noise) * volume
    }
  }

  /**
   * Create power-up sound
   */
  private createPowerupSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Rising magical chime
      const frequency = 400 + t * 800
      const harmonics = Math.sin(t * Math.PI * 2 * frequency * 2) * 0.3
      data[i] = (Math.sin(t * Math.PI * 2 * frequency) + harmonics) * volume * t
    }
  }

  /**
   * Create level up sound
   */
  private createLevelUpSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Triumphant ascending melody
      const melody = Math.sin(t * Math.PI * 2 * 523.25) * 0.4 + // C5
                   Math.sin(t * Math.PI * 2 * 659.25) * 0.3 +   // E5
                   Math.sin(t * Math.PI * 2 * 783.99) * 0.3      // G5
      data[i] = melody * volume * Math.sin(t * Math.PI) // Envelope
    }
  }

  /**
   * Create footstep sound
   */
  private createFootstepSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Soft thud with texture
      const thud = Math.sin(t * Math.PI * 2 * 60) * Math.exp(-t * 20)
      const texture = (Math.random() - 0.5) * 0.1 * Math.exp(-t * 30)
      data[i] = (thud + texture) * volume * 0.3
    }
  }

  /**
   * Create jump sound
   */
  private createJumpSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Quick whoosh upward
      const whoosh = Math.sin(t * Math.PI * 2 * 300) * (1 - t)
      data[i] = whoosh * volume * 0.6
    }
  }

  /**
   * Create landing sound
   */
  private createLandSound(data: Float32Array, sampleRate: number, volume: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Soft impact
      const impact = Math.sin(t * Math.PI * 2 * 100) * Math.exp(-t * 12)
      data[i] = impact * volume * 0.4
    }
  }

  /**
   * Load external audio files
   */
  async loadAudioFile(soundName: GameSound, url: string): Promise<void> {
    if (!this.audioContext || this.loadedSounds.has(url)) return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.sounds.set(soundName, audioBuffer)
      this.loadedSounds.add(url)

      if (this.debugMode) {
        console.log(`🎵 Loaded audio file: ${soundName} from ${url}`)
      }
    } catch (error) {
      console.warn(`🎵 Failed to load audio: ${soundName} from ${url}`, error)
    }
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Enable/disable audio
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.sounds.clear()
    this.loadedSounds.clear()
    GameAudioManager.instance = null

    if (this.debugMode) {
      console.log('🎵 GameAudioManager destroyed')
    }
  }

  /**
   * Get debug info
   */
  getDebugInfo(): {
    enabled: boolean
    volume: number
    loadedSounds: number
    availableSounds: number
    audioContextState?: string
  } {
    return {
      enabled: this.enabled,
      volume: this.volume,
      loadedSounds: this.loadedSounds.size,
      availableSounds: this.sounds.size,
      audioContextState: this.audioContext?.state
    }
  }
}

/**
 * Global helper functions for easy access
 */
export const GameAudio = {
  /**
   * Initialize the global audio manager
   */
  init: (config?: GameAudioConfig) => GameAudioManager => {
    return GameAudioManager.getInstance(config)
  },

  /**
   * Play a sound
   */
  play: (sound: GameSound, options?: { volume?: number; pitch?: number }): void => {
    const manager = GameAudioManager.getInstance()
    manager.playSound(sound, options)
  },

  /**
   * Play shooting sound
   */
  playShoot: () => GameAudio.play('shoot', { volume: 0.6 }),

  /**
   * Play reload sound
   */
  playReload: () => GameAudio.play('reload', { volume: 0.5 }),

  /**
   * Play hit sound
   */
  playHit: () => GameAudio.play('hit', { volume: 0.7 }),

  /**
   * Play explosion sound
   */
  playExplosion: () => GameAudio.play('explosion', { volume: 0.8 }),

  /**
   * Play power-up sound
   */
  playPowerup: () => GameAudio.play('powerup', { volume: 0.6 }),

  /**
   * Play level up sound
   */
  playLevelUp: () => GameAudio.play('levelUp', { volume: 0.7 }),

  /**
   * Play footstep sound
   */
  playFootstep: () => GameAudio.play('footstep', { volume: 0.2 }),

  /**
   * Play jump sound
   */
  playJump: () => GameAudio.play('jump', { volume: 0.4 }),

  /**
   * Play landing sound
   */
  playLand: () => GameAudio.play('land', { volume: 0.3 }),

  /**
   * Play game start sound
   */
  playGameStart: () => GameAudio.play('gameStart', { volume: 0.5 }),

  /**
   * Play pause sound
   */
  playPause: () => GameAudio.play('gamePause', { volume: 0.4 }),

  /**
   * Play resume sound
   */
  playResume: () => GameAudio.play('gameResume', { volume: 0.4 }),

  /**
   * Play success sound
   */
  playSuccess: () => GameAudio.play('success', { volume: 0.6 }),

  /**
   * Play error sound
   */
  playError: () => GameAudio.play('error', { volume: 0.5 }),

  /**
   * Set volume
   */
  setVolume: (volume: number): void => {
    const manager = GameAudioManager.getInstance()
    manager.setVolume(volume)
  },

  /**
   * Enable/disable audio
   */
  setEnabled: (enabled: boolean): void => {
    const manager = GameAudioManager.getInstance()
    manager.setEnabled(enabled)
  },

  /**
   * Load audio file
   */
  loadFile: (sound: GameSound, url: string): Promise<void> => {
    const manager = GameAudioManager.getInstance()
    return manager.loadAudioFile(sound, url)
  },

  /**
   * Get debug info
   */
  getDebugInfo: (): ReturnType<GameAudioManager['getDebugInfo']> => {
    const manager = GameAudioManager.getInstance()
    return manager.getDebugInfo()
  },

  /**
   * Destroy manager
   */
  destroy: (): void => {
    const manager = GameAudioManager.getInstance()
    manager.destroy()
  }
}

/**
 * React Hook for easy integration
 */
export function useGameAudio(initialVolume: number = 0.5) {
  // Initialize on mount
  if (typeof window !== 'undefined') {
    GameAudio.init({
      debugMode: process.env.NODE_ENV === 'development',
      volume: initialVolume
    })
  }

  return {
    play: GameAudio.play,
    playShoot: GameAudio.playShoot,
    playReload: GameAudio.playReload,
    playHit: GameAudio.playHit,
    playExplosion: GameAudio.playExplosion,
    playPowerup: GameAudio.playPowerup,
    playLevelUp: GameAudio.playLevelUp,
    playFootstep: GameAudio.playFootstep,
    playJump: GameAudio.playJump,
    playLand: GameAudio.playLand,
    playGameStart: GameAudio.playGameStart,
    playPause: GameAudio.playPause,
    playResume: GameAudio.playResume,
    playSuccess: GameAudio.playSuccess,
    playError: GameAudio.playError,
    setVolume: GameAudio.setVolume,
    setEnabled: GameAudio.setEnabled,
    loadFile: GameAudio.loadFile,
    getDebugInfo: GameAudio.getDebugInfo
  }
}

export default GameAudioManager