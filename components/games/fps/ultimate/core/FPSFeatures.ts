/**
 * 🎮 FPS FEATURES - Utility Functions
 * Hit Markers, Damage Indicators, Health Bars, etc.
 */

import * as THREE from 'three'

// ============================================================
// HIT MARKER SYSTEM
// ============================================================

export interface HitMarkerData {
  position: THREE.Vector2
  isHeadshot: boolean
  isKill: boolean
  timestamp: number
}

export class HitMarkerSystem {
  private markers: HitMarkerData[] = []
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D context not available')
    this.ctx = context
  }

  addHitMarker(isHeadshot: boolean = false, isKill: boolean = false): void {
    this.markers.push({
      position: new THREE.Vector2(this.canvas.width / 2, this.canvas.height / 2),
      isHeadshot,
      isKill,
      timestamp: Date.now()
    })
  }

  update(deltaTime: number): void {
    const now = Date.now()
    this.markers = this.markers.filter(marker => {
      const age = now - marker.timestamp
      return age < 300 // 300ms display time
    })
  }

  render(): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2

    this.markers.forEach(marker => {
      const age = Date.now() - marker.timestamp
      const alpha = 1 - (age / 300)
      const size = 20 + (age / 300) * 10 // Grow over time

      this.ctx.strokeStyle = marker.isKill 
        ? `rgba(255, 0, 0, ${alpha})` // Red for kill
        : marker.isHeadshot
        ? `rgba(255, 255, 0, ${alpha})` // Yellow for headshot
        : `rgba(255, 255, 255, ${alpha})` // White for hit

      this.ctx.lineWidth = 2
      this.ctx.beginPath()

      // Draw X marker
      this.ctx.moveTo(centerX - size, centerY - size)
      this.ctx.lineTo(centerX + size, centerY + size)
      this.ctx.moveTo(centerX + size, centerY - size)
      this.ctx.lineTo(centerX - size, centerY + size)
      this.ctx.stroke()
    })
  }
}

// ============================================================
// DAMAGE INDICATOR SYSTEM
// ============================================================

export interface DamageIndicatorData {
  direction: THREE.Vector3 // Direction from player
  damage: number
  timestamp: number
}

export class DamageIndicatorSystem {
  private indicators: DamageIndicatorData[] = []
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: THREE.Camera

  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D context not available')
    this.ctx = context
    this.camera = camera
  }

  addDamageIndicator(direction: THREE.Vector3, damage: number): void {
    this.indicators.push({
      direction: direction.clone().normalize(),
      damage,
      timestamp: Date.now()
    })
  }

  update(deltaTime: number): void {
    const now = Date.now()
    this.indicators = this.indicators.filter(indicator => {
      const age = now - indicator.timestamp
      return age < 2000 // 2 seconds display time
    })
  }

  render(): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3

    this.indicators.forEach(indicator => {
      const age = Date.now() - indicator.timestamp
      const alpha = 1 - (age / 2000)
      const fadeAlpha = Math.max(0, alpha - 0.5) // Fade out faster

      // Convert 3D direction to 2D screen position
      const screenDir = new THREE.Vector2(
        indicator.direction.x,
        indicator.direction.z
      ).normalize()

      const x = centerX + screenDir.x * radius
      const y = centerY + screenDir.y * radius

      // Draw direction indicator (arrow)
      this.ctx.strokeStyle = `rgba(255, 0, 0, ${fadeAlpha})`
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(
        x - screenDir.x * 20 - screenDir.y * 10,
        y - screenDir.y * 20 + screenDir.x * 10
      )
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(
        x - screenDir.x * 20 + screenDir.y * 10,
        y - screenDir.y * 20 - screenDir.x * 10
      )
      this.ctx.stroke()

      // Draw damage number
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.font = 'bold 16px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`${indicator.damage}`, x, y - 30)
    })
  }
}

// ============================================================
// HEALTH BAR SYSTEM (3D)
// ============================================================

export function createHealthBar(maxHealth: number): THREE.Group {
  const group = new THREE.Group()
  
  // Background bar
  const bgGeometry = new THREE.PlaneGeometry(1, 0.1)
  const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
  const bgBar = new THREE.Mesh(bgGeometry, bgMaterial)
  bgBar.position.y = 0.05
  
  // Health bar
  const healthGeometry = new THREE.PlaneGeometry(1, 0.08)
  const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const healthBar = new THREE.Mesh(healthGeometry, healthMaterial)
  healthBar.position.y = 0.05
  healthBar.name = 'healthBar'
  
  group.add(bgBar)
  group.add(healthBar)
  group.position.y = 2 // Above enemy head
  
  return group
}

export function updateHealthBar(healthBar: THREE.Group, currentHealth: number, maxHealth: number): void {
  const bar = healthBar.children.find(child => child.name === 'healthBar') as THREE.Mesh
  if (!bar) return
  
  const healthPercent = Math.max(0, Math.min(1, currentHealth / maxHealth))
  
  // Update scale
  const scaleX = healthPercent
  bar.scale.x = scaleX
  
  // Update color (green -> yellow -> red)
  const material = bar.material as THREE.MeshBasicMaterial
  if (healthPercent > 0.5) {
    material.color.setHex(0x00ff00) // Green
  } else if (healthPercent > 0.25) {
    material.color.setHex(0xffff00) // Yellow
  } else {
    material.color.setHex(0xff0000) // Red
  }
}

