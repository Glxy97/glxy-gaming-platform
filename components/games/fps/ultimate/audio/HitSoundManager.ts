/**
 * 🎵 HIT SOUND MANAGER
 * 
 * Professional audio feedback for hits
 * - Body Hit Sound
 * - Headshot Sound (distinct ping)
 * - Kill Confirmation Sound
 * - Shield Break Sound
 * - Volume based on damage
 */

import * as THREE from 'three'
import { AudioManager } from './AudioManager'

export enum HitSoundType {
  BODY = 'body',
  HEADSHOT = 'headshot',
  KILL = 'kill',
  SHIELD_BREAK = 'shield_break',
  ARMOR_HIT = 'armor_hit'
}

export interface HitSoundConfig {
  type: HitSoundType
  volume: number
  pitch?: number
  damage?: number
}

export class HitSoundManager {
  private audioManager: AudioManager | null = null
  private enabled: boolean = true
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)

  // Volume settings
  private baseVolume = 0.6
  private headshotVolume = 0.8
  private killVolume = 0.9

  constructor(audioManager?: AudioManager) {
    this.audioManager = audioManager || null
    console.log('🎵 Hit Sound Manager initialized')
  }

  /**
   * Set Audio Manager
   */
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }

  /**
   * Play hit sound
   */
  playHitSound(config: HitSoundConfig): void {
    if (!this.enabled || !this.audioManager) return

    switch (config.type) {
      case HitSoundType.BODY:
        this.playBodyHit(config.volume, config.damage)
        break

      case HitSoundType.HEADSHOT:
        this.playHeadshot(config.volume)
        break

      case HitSoundType.KILL:
        this.playKillConfirm(config.volume)
        break

      case HitSoundType.SHIELD_BREAK:
        this.playShieldBreak(config.volume)
        break

      case HitSoundType.ARMOR_HIT:
        this.playArmorHit(config.volume)
        break
    }
  }

  /**
   * Play body hit sound (thunk)
   */
  private playBodyHit(volume: number, damage?: number): void {
    if (!this.audioManager) return

    // Volume based on damage
    let adjustedVolume = this.baseVolume * volume
    if (damage) {
      adjustedVolume *= Math.min(1 + damage / 100, 1.5)
    }

    // Try to play registered sound, fallback to generated
    const soundPlayed = this.audioManager.playSound('hit_body', this.position, adjustedVolume)
    
    if (!soundPlayed) {
      // Generate body hit sound (low thunk)
      this.generateBodyHitSound(adjustedVolume)
    }
  }

  /**
   * Play headshot sound (distinct ping)
   */
  private playHeadshot(volume: number): void {
    if (!this.audioManager) return

    const adjustedVolume = this.headshotVolume * volume

    // Try to play registered sound, fallback to generated
    const soundPlayed = this.audioManager.playSound('hit_headshot', this.position, adjustedVolume)
    
    if (!soundPlayed) {
      // Generate headshot sound (high ping)
      this.generateHeadshotSound(adjustedVolume)
    }
  }

  /**
   * Play kill confirmation sound (satisfying ding)
   */
  private playKillConfirm(volume: number): void {
    if (!this.audioManager) return

    const adjustedVolume = this.killVolume * volume

    // Try to play registered sound, fallback to generated
    const soundPlayed = this.audioManager.playSound('hit_kill', this.position, adjustedVolume)
    
    if (!soundPlayed) {
      // Generate kill confirm sound (ding)
      this.generateKillSound(adjustedVolume)
    }
  }

  /**
   * Play shield break sound (glass shatter)
   */
  private playShieldBreak(volume: number): void {
    if (!this.audioManager) return

    const adjustedVolume = this.baseVolume * volume

    // Try to play registered sound, fallback to generated
    const soundPlayed = this.audioManager.playSound('shield_break', adjustedVolume)
    
    if (!soundPlayed) {
      // Generate shield break sound (glass)
      this.generateShieldBreakSound(adjustedVolume)
    }
  }

  /**
   * Play armor hit sound (metallic)
   */
  private playArmorHit(volume: number): void {
    if (!this.audioManager) return

    const adjustedVolume = this.baseVolume * volume

    // Try to play registered sound, fallback to generated
    const soundPlayed = this.audioManager.playSound('armor_hit', adjustedVolume)
    
    if (!soundPlayed) {
      // Generate armor hit sound (metallic)
      this.generateArmorHitSound(adjustedVolume)
    }
  }

  // ==========================================================================
  // GENERATED SOUNDS (Web Audio API Fallback)
  // ==========================================================================

  /**
   * Generate body hit sound (low frequency thunk)
   */
  private generateBodyHitSound(volume: number): void {
    try {
      const audioContext = new AudioContext()
      const gainNode = audioContext.createGain()
      const oscillator = audioContext.createOscillator()

      // Low frequency for body hit
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.1)

      // Envelope
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.15)
    } catch (error) {
      // Ignore if Web Audio API not available
    }
  }

  /**
   * Generate headshot sound (high frequency ping)
   */
  private generateHeadshotSound(volume: number): void {
    try {
      const audioContext = new AudioContext()
      const gainNode = audioContext.createGain()
      const oscillator = audioContext.createOscillator()

      // High frequency for headshot
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.08)

      // Sharp envelope
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Generate kill confirmation sound (satisfying ding)
   */
  private generateKillSound(volume: number): void {
    try {
      const audioContext = new AudioContext()
      const gainNode = audioContext.createGain()
      const oscillator = audioContext.createOscillator()

      // Bell-like sound
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.05)

      // Long sustain
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Generate shield break sound (glass shatter)
   */
  private generateShieldBreakSound(volume: number): void {
    try {
      const audioContext = new AudioContext()
      
      // Multiple frequencies for glass shatter effect
      for (let i = 0; i < 5; i++) {
        const gainNode = audioContext.createGain()
        const oscillator = audioContext.createOscillator()

        oscillator.type = 'square'
        const freq = 2000 + Math.random() * 3000
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)

        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime + i * 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1 + i * 0.02)

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.start(audioContext.currentTime + i * 0.02)
        oscillator.stop(audioContext.currentTime + 0.15 + i * 0.02)
      }
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Generate armor hit sound (metallic)
   */
  private generateArmorHitSound(volume: number): void {
    try {
      const audioContext = new AudioContext()
      const gainNode = audioContext.createGain()
      const oscillator = audioContext.createOscillator()

      // Metallic sound
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1)

      // Sharp attack, quick decay
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.12)
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Enable/Disable hit sounds
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
}

