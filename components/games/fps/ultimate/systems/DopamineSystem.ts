/**
 * 🎮 DOPAMINE SYSTEM
 * 
 * Separates Modul für Dopamin-Mechaniken
 * Arbeitet MIT bestehenden Managern zusammen
 */

import { ProgressionManager } from '../progression/ProgressionManager'
import { UIManager } from '../ui/UIManager'
import { AudioManager } from '../audio/AudioManager'
import { EffectsManager } from '../effects/EffectsManager'

export interface DopamineEvent {
  type: 'KILL' | 'HEADSHOT' | 'STREAK' | 'LEVELUP' | 'UNLOCK'
  value: number
  multiplier: number
  message: string
  intensity: number // 0-1 für Effect-Stärke
}

export class DopamineSystem {
  private progressionManager: ProgressionManager
  private uiManager: UIManager
  private audioManager: AudioManager
  private effectsManager: EffectsManager
  
  private eventQueue: DopamineEvent[] = []
  private comboMultiplier: number = 1
  private lastEventTime: number = 0
  
  constructor(
    progression: ProgressionManager,
    ui: UIManager,
    audio: AudioManager,
    effects: EffectsManager
  ) {
    this.progressionManager = progression
    this.uiManager = ui
    this.audioManager = audio
    this.effectsManager = effects
  }
  
  public triggerEvent(event: DopamineEvent): void {
    const now = Date.now()
    const timeSinceLastEvent = now - this.lastEventTime
    
    // Combo System
    if (timeSinceLastEvent < 3000) {
      this.comboMultiplier = Math.min(this.comboMultiplier + 0.2, 3)
      event.multiplier = this.comboMultiplier
    } else {
      this.comboMultiplier = 1
    }
    
    // Apply multiplier
    event.value = Math.floor(event.value * event.multiplier)
    
    // Queue event
    this.eventQueue.push(event)
    this.lastEventTime = now
    
    // Process immediately
    this.processEvent(event)
  }
  
  private processEvent(event: DopamineEvent): void {
    // 1. Visual Feedback über EffectsManager
    this.effectsManager.triggerDopamineEffect({
      intensity: event.intensity,
      duration: 500 + (event.intensity * 500)
    })
    
    // 2. Audio Feedback
    switch(event.type) {
      case 'HEADSHOT':
        this.audioManager.playSound('headshot_ding')
        break
      case 'STREAK':
        this.audioManager.playSound(`streak_${Math.min(event.value, 10)}`)
        break
      case 'LEVELUP':
        this.audioManager.playSound('level_up')
        break
    }
    
    // 3. UI Feedback
    this.uiManager.showDopaminePopup({
      text: event.message,
      points: `+${event.value}`,
      multiplier: event.multiplier > 1 ? `x${event.multiplier.toFixed(1)}` : undefined
    })
    
    // 4. Progression Update
    this.progressionManager.addExperience(event.value)
  }
  
  public getComboMultiplier(): number {
    return this.comboMultiplier
  }
  
  public resetCombo(): void {
    this.comboMultiplier = 1
  }
}

/**
 * KILL STREAK TRACKER
 */
export class KillStreakTracker {
  private currentStreak: number = 0
  private bestStreak: number = 0
  private streakRewards = [
    { count: 3, name: "TRIPLE KILL", xp: 50 },
    { count: 5, name: "KILLING SPREE", xp: 100 },
    { count: 7, name: "RAMPAGE", xp: 150 },
    { count: 10, name: "UNSTOPPABLE", xp: 250 },
    { count: 15, name: "GODLIKE", xp: 500 },
    { count: 20, name: "LEGENDARY", xp: 1000 }
  ]
  
  public addKill(): { streak: number, reward?: any } {
    this.currentStreak++
    
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak
    }
    
    const reward = this.streakRewards.find(r => r.count === this.currentStreak)
    
    return {
      streak: this.currentStreak,
      reward
    }
  }
  
  public reset(): void {
    this.currentStreak = 0
  }
  
  public getCurrentStreak(): number {
    return this.currentStreak
  }
  
  public getBestStreak(): number {
    return this.bestStreak
  }
}
