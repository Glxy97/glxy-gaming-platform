/**
 * 💡 QUICK WINS - INSTANT GAME FEEL IMPROVEMENTS
 * 
 * 6 kleine Features für großen Impact:
 * 1. Dynamic Crosshair - Expands when shooting
 * 2. Headshot Sound - Satisfying "ding!"
 * 3. Kill Streak Text - "Double Kill!", "Triple Kill!"
 * 4. Low HP Vignette - Red screen at low health
 * 5. Sprint FOV - FOV boost when sprinting
 * 6. Landing Shake - Camera shake on landing
 */

import * as THREE from 'three'

// =============================================================================
// 1. DYNAMIC CROSSHAIR
// =============================================================================

export class DynamicCrosshair {
  private baseSize: number = 4
  private currentSize: number = 4
  private maxSize: number = 12
  private expandRate: number = 2
  private shrinkRate: number = 5

  /**
   * Expand crosshair (when shooting)
   */
  expand(): void {
    this.currentSize = Math.min(this.currentSize + this.expandRate, this.maxSize)
  }

  /**
   * Update crosshair (shrink back to base)
   */
  update(deltaTime: number): void {
    if (this.currentSize > this.baseSize) {
      this.currentSize = Math.max(this.currentSize - this.shrinkRate * deltaTime, this.baseSize)
    }
  }

  /**
   * Get current crosshair size
   */
  getSize(): number {
    return this.currentSize
  }

  /**
   * Render crosshair to canvas
   */
  render(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const size = this.currentSize
    const gap = 2

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2

    // Top line
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - gap - size)
    ctx.lineTo(centerX, centerY - gap)
    ctx.stroke()

    // Bottom line
    ctx.beginPath()
    ctx.moveTo(centerX, centerY + gap)
    ctx.lineTo(centerX, centerY + gap + size)
    ctx.stroke()

    // Left line
    ctx.beginPath()
    ctx.moveTo(centerX - gap - size, centerY)
    ctx.lineTo(centerX - gap, centerY)
    ctx.stroke()

    // Right line
    ctx.beginPath()
    ctx.moveTo(centerX + gap, centerY)
    ctx.lineTo(centerX + gap + size, centerY)
    ctx.stroke()
  }
}

// =============================================================================
// 2. HEADSHOT SOUND
// =============================================================================

export function playHeadshotSound(audioManager: any): void {
  // Play satisfying "ding!" sound at slightly higher pitch
  audioManager?.playSound('headshot_ding', undefined, 0.8)
  
  console.log('🎯 HEADSHOT!')
}

// =============================================================================
// 3. KILL STREAK TEXT
// =============================================================================

export interface KillStreakMessage {
  text: string
  color: string
  scale: number
  duration: number
}

export function getKillStreakMessage(killCount: number): KillStreakMessage | null {
  const messages: Record<number, KillStreakMessage> = {
    2: { text: 'DOUBLE KILL!', color: '#FFD700', scale: 1.5, duration: 2 },
    3: { text: 'TRIPLE KILL!', color: '#FF8C00', scale: 1.8, duration: 2.5 },
    4: { text: 'QUAD KILL!', color: '#FF4500', scale: 2.0, duration: 3 },
    5: { text: 'MEGA KILL!', color: '#FF0000', scale: 2.2, duration: 3.5 },
    6: { text: 'ULTRA KILL!', color: '#8B00FF', scale: 2.5, duration: 4 },
    7: { text: 'MONSTER KILL!', color: '#FF1493', scale: 2.8, duration: 4.5 },
    10: { text: 'UNSTOPPABLE!', color: '#00FFFF', scale: 3.0, duration: 5 },
    15: { text: 'GODLIKE!', color: '#FFFFFF', scale: 3.5, duration: 6 }
  }

  return messages[killCount] || null
}

export class KillStreakDisplay {
  private currentMessage: KillStreakMessage | null = null
  private remainingTime: number = 0
  private currentScale: number = 0

  /**
   * Show kill streak message
   */
  show(message: KillStreakMessage): void {
    this.currentMessage = message
    this.remainingTime = message.duration
    this.currentScale = 0
  }

  /**
   * Update animation
   */
  update(deltaTime: number): void {
    if (!this.currentMessage) return

    this.remainingTime -= deltaTime

    if (this.remainingTime <= 0) {
      this.currentMessage = null
      return
    }

    // Scale animation (pop in)
    if (this.currentScale < this.currentMessage.scale) {
      this.currentScale = Math.min(this.currentScale + deltaTime * 5, this.currentMessage.scale)
    }
  }

  /**
   * Render to canvas
   */
  render(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    if (!this.currentMessage) return

    ctx.save()
    ctx.translate(centerX, centerY - 100)
    ctx.scale(this.currentScale, this.currentScale)

    // Shadow
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Text
    ctx.fillStyle = this.currentMessage.color
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.currentMessage.text, 0, 0)

    ctx.restore()
  }

  /**
   * Check if currently showing
   */
  isShowing(): boolean {
    return this.currentMessage !== null
  }
}

// =============================================================================
// 4. LOW HP VIGNETTE
// =============================================================================

export class LowHealthVignette {
  private intensity: number = 0
  private pulseTimer: number = 0

  /**
   * Update vignette based on health
   */
  update(healthPercent: number, deltaTime: number): void {
    // Calculate target intensity (0-1)
    const targetIntensity = healthPercent < 0.3 
      ? Math.max(0, (0.3 - healthPercent) / 0.3) 
      : 0

    // Smooth lerp to target
    this.intensity = THREE.MathUtils.lerp(this.intensity, targetIntensity, deltaTime * 2)

    // Pulse effect at very low health
    if (healthPercent < 0.2) {
      this.pulseTimer += deltaTime * 3
    }
  }

  /**
   * Render vignette to canvas
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.intensity <= 0) return

    const pulseIntensity = Math.sin(this.pulseTimer) * 0.2 + 0.8
    const alpha = this.intensity * pulseIntensity

    // Radial gradient (red vignette)
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.max(width, height) / 2

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, `rgba(139, 0, 0, 0)`)
    gradient.addColorStop(0.7, `rgba(139, 0, 0, ${alpha * 0.3})`)
    gradient.addColorStop(1, `rgba(139, 0, 0, ${alpha * 0.7})`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Red border pulse
    if (alpha > 0.5) {
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha * 0.8})`
      ctx.lineWidth = 5
      ctx.strokeRect(2, 2, width - 4, height - 4)
    }
  }
}

// =============================================================================
// 5. SPRINT FOV BOOST
// =============================================================================

export class SprintFOV {
  private baseFOV: number = 75
  private targetFOV: number = 75
  private currentFOV: number = 75
  private sprintFOVBoost: number = 10 // +10 FOV when sprinting

  constructor(baseFOV: number = 75) {
    this.baseFOV = baseFOV
    this.currentFOV = baseFOV
    this.targetFOV = baseFOV
  }

  /**
   * Set sprint state
   */
  setSprinting(isSprinting: boolean): void {
    this.targetFOV = isSprinting 
      ? this.baseFOV + this.sprintFOVBoost 
      : this.baseFOV
  }

  /**
   * Update FOV (smooth transition)
   */
  update(deltaTime: number): number {
    this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, this.targetFOV, deltaTime * 5)
    return this.currentFOV
  }

  /**
   * Set base FOV (from settings)
   */
  setBaseFOV(fov: number): void {
    this.baseFOV = fov
    this.targetFOV = fov
  }
}

// =============================================================================
// 6. LANDING SHAKE
// =============================================================================

export class LandingShake {
  private shakeIntensity: number = 0
  private shakeDuration: number = 0
  private shakeTimer: number = 0

  /**
   * Trigger landing shake
   */
  trigger(fallVelocity: number): void {
    // Scale shake intensity by fall velocity
    const intensity = Math.min(Math.abs(fallVelocity) / 10, 1)
    
    if (intensity > 0.2) { // Only shake on significant falls
      this.shakeIntensity = intensity * 0.1
      this.shakeDuration = 0.3
      this.shakeTimer = 0
    }
  }

  /**
   * Update shake
   */
  update(deltaTime: number): void {
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += deltaTime
    } else {
      this.shakeIntensity = 0
    }
  }

  /**
   * Get shake offset for camera
   */
  getShakeOffset(): { x: number; y: number } {
    if (this.shakeIntensity <= 0) {
      return { x: 0, y: 0 }
    }

    const progress = this.shakeTimer / this.shakeDuration
    const damping = 1 - progress // Fade out over time

    return {
      x: (Math.random() - 0.5) * this.shakeIntensity * damping,
      y: (Math.random() - 0.5) * this.shakeIntensity * damping
    }
  }

  /**
   * Check if currently shaking
   */
  isShaking(): boolean {
    return this.shakeIntensity > 0 && this.shakeTimer < this.shakeDuration
  }
}

// =============================================================================
// EXPORT ALL
// =============================================================================

export const QuickFeatures = {
  DynamicCrosshair,
  playHeadshotSound,
  getKillStreakMessage,
  KillStreakDisplay,
  LowHealthVignette,
  SprintFOV,
  LandingShake
}

export default QuickFeatures

