/**
 * 🎯 SUCHT-FAKTOR #1: SATISFYING KILL-SYSTEM
 * Dopamin-Reward-System für maximale Sucht
 */

import * as THREE from 'three'

// ============================================================
// TYPES
// ============================================================

export interface KillData {
  victim: any
  weapon: any
  distance: number
  isHeadshot: boolean
  isWallbang: boolean
  isMidair: boolean
  isNoScope: boolean
}

export type KillType = 'NORMAL' | 'HEADSHOT' | 'LONGSHOT' | 'WALLBANG' | 
                'MIDAIR' | 'NOSCOPE' | 'LONGSHOT_HEADSHOT'

export interface ScreenEffect {
  type: string
  intensity: number
  duration: number
  color?: THREE.Color
}

export interface DopamineEvent {
  type: KillType
  score: number
  streak: number
  multiplier: number
  timestamp: number
  effects: ScreenEffect[]
  sound: string
  message: string
}

// ============================================================
// KILL REWARD SYSTEM
// ============================================================

export class KillRewardSystem {
  private comboMultiplier = 1
  private lastKillTime = 0
  private killStreak = 0
  private dopamineEvents: DopamineEvent[] = []
  
  // Satisfying Sound-Stack
  private killSounds = [
    'kill_normal',      // 1 Kill
    'kill_double',      // 2 Kills
    'kill_triple',      // 3 Kills  
    'kill_mega',        // 4 Kills
    'kill_monster',     // 5 Kills
    'kill_godlike',     // 6+ Kills
  ]

  // Visual Rewards
  private screenEffects = {
    bloodSplash: { duration: 0.2, intensity: 1.0 },
    screenShake: { duration: 0.3, intensity: 5 },
    chromatic: { duration: 0.1, intensity: 0.01 },
    slowMotion: { duration: 0.5, scale: 0.3 },
    zoomPunch: { duration: 0.2, intensity: 1.1 }
  }

  registerKill(killData: KillData): DopamineEvent {
    const now = Date.now()
    const timeSinceLastKill = now - this.lastKillTime
    
    // COMBO-SYSTEM - Schnelle Kills = Mehr Punkte
    if (timeSinceLastKill < 3000) {
      this.comboMultiplier = Math.min(this.comboMultiplier + 0.5, 10)
      this.killStreak++
    } else {
      this.comboMultiplier = 1
      this.killStreak = 1
    }
    
    this.lastKillTime = now
    
    // Berechne Belohnungen
    const baseScore = 100
    const headshotBonus = killData.isHeadshot ? 50 : 0
    const distanceBonus = Math.floor(killData.distance / 10) * 10
    const comboBonus = Math.floor(baseScore * (this.comboMultiplier - 1))
    
    const totalScore = Math.floor(
      (baseScore + headshotBonus + distanceBonus + comboBonus) * this.comboMultiplier
    )
    
    // DOPAMIN-TRIGGER
    const event: DopamineEvent = {
      type: this.getKillType(killData),
      score: totalScore,
      streak: this.killStreak,
      multiplier: this.comboMultiplier,
      timestamp: now,
      effects: this.calculateEffects(killData, this.killStreak),
      sound: this.killSounds[Math.min(this.killStreak - 1, this.killSounds.length - 1)],
      message: this.getKillMessage(killData, this.killStreak)
    }
    
    this.dopamineEvents.push(event)
    return event
  }

  private getKillType(data: KillData): KillType {
    if (data.isHeadshot && data.distance > 50) return 'LONGSHOT_HEADSHOT'
    if (data.isHeadshot) return 'HEADSHOT'
    if (data.isWallbang) return 'WALLBANG'
    if (data.isMidair) return 'MIDAIR'
    if (data.isNoScope) return 'NOSCOPE'
    if (data.distance > 75) return 'LONGSHOT'
    return 'NORMAL'
  }

  private calculateEffects(data: KillData, streak: number): ScreenEffect[] {
    const effects: ScreenEffect[] = []
    
    // Base Kill Effect
    effects.push({
      type: 'screenShake',
      intensity: 0.1 * Math.min(streak, 5),
      duration: 0.2
    })
    
    // Headshot = Slow Motion
    if (data.isHeadshot) {
      effects.push({
        type: 'slowMotion',
        intensity: 0.3,
        duration: 0.5
      })
      effects.push({
        type: 'chromatic',
        intensity: 0.02,
        duration: 0.15
      })
    }
    
    // Multi-Kill = Screen Flash
    if (streak > 1) {
      effects.push({
        type: 'screenFlash',
        intensity: 0.3 * Math.min(streak / 3, 1),
        duration: 0.1,
        color: this.getStreakColor(streak)
      })
    }
    
    // Ultra Kill = Zoom Punch
    if (streak >= 5) {
      effects.push({
        type: 'zoomPunch',
        intensity: 1.15,
        duration: 0.3
      })
    }
    
    return effects
  }

  private getStreakColor(streak: number): THREE.Color {
    const colors = [
      0xFFFFFF, // 1 - White
      0xFFFF00, // 2 - Yellow  
      0xFF8800, // 3 - Orange
      0xFF0000, // 4 - Red
      0xFF00FF, // 5 - Magenta
      0x00FFFF, // 6+ - Cyan
    ]
    return new THREE.Color(colors[Math.min(streak - 1, colors.length - 1)])
  }

  private getKillMessage(data: KillData, streak: number): string {
    const messages: Record<number, string[]> = {
      1: ['KILL!', 'ELIMINATED!', 'TAKEN DOWN!'],
      2: ['DOUBLE KILL!', 'MULTI-KILL!'],
      3: ['TRIPLE KILL!', 'HAT TRICK!'],
      4: ['MEGA KILL!', 'DOMINATING!'],
      5: ['MONSTER KILL!', 'UNSTOPPABLE!'],
      6: ['GODLIKE!', 'LEGENDARY!'],
      7: ['HOLY SHIT!', 'BEYOND GODLIKE!']
    }
    
    const streakMessages = messages[Math.min(streak, 7)] || messages[7]
    const randomMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)]
    
    // Special Messages
    if (data.isHeadshot && data.distance > 100) return '🎯 INSANE HEADSHOT!'
    if (data.isWallbang) return '💥 WALLBANG!'
    if (data.isMidair) return '🚀 AIRSHOT!'
    if (streak >= 10) return '👑 BOW DOWN TO THE KING!'
    
    return randomMessage
  }

  getKillStreak(): number {
    return this.killStreak
  }

  resetStreak(): void {
    this.killStreak = 0
    this.comboMultiplier = 1
  }
}

