/**
 * 🔊 SOUND GENERATOR
 * 
 * Generates sounds using Web Audio API (no MP3 files needed!)
 */

export class SoundGenerator {
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /**
   * Play generated sound by ID
   */
  playSound(soundId: string, volume: number = 0.5): void {
    if (!this.audioContext) return

    switch (soundId) {
      // Weapon Sounds
      case 'pistol_fire':
      case 'glock_17_fire':
        this.generateGunshot(0.15, 150, volume)
        break
      
      case 'ar_fire':
      case 'm4a1_fire':
      case 'ak47_fire':
        this.generateGunshot(0.12, 120, volume * 0.8)
        break
      
      case 'sniper_fire':
      case 'awp_fire':
        this.generateGunshot(0.25, 80, volume * 1.2)
        break
      
      case 'shotgun_fire':
        this.generateShotgun(volume)
        break
      
      case 'smg_fire':
      case 'mp5_fire':
        this.generateGunshot(0.08, 180, volume * 0.6)
        break

      // Reload Sounds
      case 'pistol_reload':
      case 'ar_reload':
      case 'smg_reload':
      case 'sniper_reload':
      case 'shotgun_reload':
        this.generateReload(volume)
        break

      // Empty Click
      case 'pistol_empty':
      case 'ar_empty':
        this.generateClick(volume)
        break

      // Impact Sounds
      case 'impact_concrete':
      case 'bullet_impact_concrete':
        this.generateImpact(0.08, 200, volume * 0.5)
        break
      
      case 'impact_metal':
        this.generateMetalImpact(volume * 0.6)
        break
      
      case 'impact_wood':
        this.generateImpact(0.1, 150, volume * 0.4)
        break
      
      case 'impact_flesh':
      case 'bullet_hit_body':
        this.generateFleshImpact(volume * 0.4)
        break

      // Player Sounds
      case 'footstep_concrete':
      case 'footstep_metal':
      case 'footstep_wood':
      case 'footstep_grass':
        this.generateFootstep(volume * 0.4)
        break
      
      case 'jump':
        this.generateJump(volume * 0.5)
        break
      
      case 'land':
        this.generateLand(volume * 0.6)
        break
      
      case 'damage_light':
        this.generateDamage(200, volume * 0.6)
        break
      
      case 'damage_heavy':
        this.generateDamage(100, volume * 0.8)
        break

      // UI Sounds
      case 'ui_click':
        this.generateClick(volume * 0.5)
        break
      
      case 'ui_hover':
        this.generateHover(volume * 0.3)
        break
      
      case 'notification':
      case 'level_up':
      case 'achievement':
        this.generateNotification(volume * 0.7)
        break
      
      case 'kill':
        this.generateKillSound(volume * 0.6)
        break

      // Weapon Switch
      case 'weapon_switch':
        this.generateWeaponSwitch(volume * 0.5)
        break

      // Enemy Spawn
      case 'enemy_spawn':
        this.generateEnemySpawn(volume * 0.5)
        break

      // Explosion
      case 'explosion':
        this.generateExplosion(volume * 1.0)
        break

      default:
        // Fallback: Simple beep
        this.generateBeep(440, 0.1, volume * 0.3)
    }
  }

  /**
   * Generate gunshot sound
   */
  private generateGunshot(duration: number, frequency: number, volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    // Noise for gunshot
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    // Filter to shape the sound
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(frequency, currentTime)
    filter.frequency.exponentialRampToValueAtTime(50, currentTime + duration)

    // Gain envelope
    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration)

    // Connect
    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // Play
    noise.start(currentTime)
    noise.stop(currentTime + duration)
  }

  /**
   * Generate shotgun sound (multiple pellets)
   */
  private generateShotgun(volume: number): void {
    // Multiple gunshots in quick succession
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.generateGunshot(0.15, 100 + Math.random() * 50, volume * 0.4)
      }, i * 10)
    }
  }

  /**
   * Generate reload sound
   */
  private generateReload(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    // Metallic click
    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(300, currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, currentTime + 0.1)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.3, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.1)
  }

  /**
   * Generate click sound
   */
  private generateClick(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(1000, currentTime)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.3, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.05)
  }

  /**
   * Generate impact sound
   */
  private generateImpact(duration: number, frequency: number, volume: number): void {
    this.generateGunshot(duration, frequency, volume * 0.5)
  }

  /**
   * Generate metal impact
   */
  private generateMetalImpact(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(800, currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.15)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.4, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.15)
  }

  /**
   * Generate flesh impact
   */
  private generateFleshImpact(volume: number): void {
    this.generateImpact(0.12, 100, volume)
  }

  /**
   * Generate footstep
   */
  private generateFootstep(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(60, currentTime)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.3, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.08)
  }

  /**
   * Generate jump sound
   */
  private generateJump(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(200, currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, currentTime + 0.1)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.4, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.1)
  }

  /**
   * Generate land sound
   */
  private generateLand(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(150, currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, currentTime + 0.15)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.5, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.15)
  }

  /**
   * Generate damage sound
   */
  private generateDamage(frequency: number, volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(frequency, currentTime)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.5, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.2)
  }

  /**
   * Generate hover sound
   */
  private generateHover(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(600, currentTime)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.2, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.03)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.03)
  }

  /**
   * Generate notification sound
   */
  private generateNotification(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    // Two-tone notification
    const osc1 = this.audioContext.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(800, currentTime)

    const osc2 = this.audioContext.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1000, currentTime + 0.1)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.4, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    osc1.start(currentTime)
    osc1.stop(currentTime + 0.1)
    osc2.start(currentTime + 0.1)
    osc2.stop(currentTime + 0.3)
  }

  /**
   * Generate kill sound
   */
  private generateKillSound(volume: number): void {
    // Satisfying "ding" sound
    this.generateBeep(1200, 0.15, volume)
    setTimeout(() => this.generateBeep(1400, 0.1, volume * 0.8), 50)
  }

  /**
   * Generate weapon switch sound
   */
  private generateWeaponSwitch(volume: number): void {
    this.generateReload(volume)
    setTimeout(() => this.generateClick(volume * 0.8), 100)
  }

  /**
   * Generate enemy spawn sound
   */
  private generateEnemySpawn(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(100, currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, currentTime + 0.3)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume * 0.4, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + 0.3)
  }

  /**
   * Generate explosion sound
   */
  private generateExplosion(volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    // Create noise buffer for explosion
    const bufferSize = this.audioContext.sampleRate * 0.5
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(300, currentTime)
    filter.frequency.exponentialRampToValueAtTime(30, currentTime + 0.5)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.5)

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    noise.start(currentTime)
    noise.stop(currentTime + 0.5)
  }

  /**
   * Generate simple beep
   */
  private generateBeep(frequency: number, duration: number, volume: number): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, currentTime)

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(volume, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + duration)
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export default SoundGenerator

