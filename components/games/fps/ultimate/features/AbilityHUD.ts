/**
 * ⚡ ABILITY HUD
 * 
 * HUD für Character Abilities (Active & Ultimate)
 * - Cooldown Display
 * - Ultimate Charge Bar
 * - Key Bindings
 */

import * as THREE from 'three'

// =============================================================================
// ABILITY HUD RENDERER
// =============================================================================

export interface AbilityHUDData {
  // Active Ability (E)
  activeName: string
  activeCooldown: number // Remaining cooldown (seconds)
  activeMaxCooldown: number // Max cooldown
  activeCharges: number
  activeKey: string // 'E'
  
  // Ultimate Ability (Q)
  ultimateName: string
  ultimateCharge: number // 0-100%
  ultimateKey: string // 'Q'
  ultimateReady: boolean
}

export class AbilityHUDRenderer {
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Render Ability HUD
   */
  render(ctx: CanvasRenderingContext2D, data: AbilityHUDData): void {
    const width = this.canvas.width
    const height = this.canvas.height
    
    // Position: Bottom center
    const centerX = width / 2
    const bottomY = height - 120
    
    // Active Ability (E) - Left
    this.renderActiveAbility(ctx, centerX - 120, bottomY, data)
    
    // Ultimate Ability (Q) - Right
    this.renderUltimateAbility(ctx, centerX + 20, bottomY, data)
  }

  /**
   * Render Active Ability (E)
   */
  private renderActiveAbility(ctx: CanvasRenderingContext2D, x: number, y: number, data: AbilityHUDData): void {
    const size = 80
    const isOnCooldown = data.activeCooldown > 0
    
    // Background
    ctx.fillStyle = isOnCooldown ? 'rgba(0, 0, 0, 0.7)' : 'rgba(30, 144, 255, 0.3)'
    ctx.strokeStyle = isOnCooldown ? '#666666' : '#1E90FF'
    ctx.lineWidth = 3
    
    ctx.fillRect(x, y, size, size)
    ctx.strokeRect(x, y, size, size)
    
    // Cooldown Overlay
    if (isOnCooldown) {
      const progress = 1 - (data.activeCooldown / data.activeMaxCooldown)
      const overlayHeight = size * (1 - progress)
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(x, y, size, overlayHeight)
      
      // Cooldown Text
      ctx.font = 'bold 28px Arial'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(Math.ceil(data.activeCooldown).toString(), x + size / 2, y + size / 2)
    } else {
      // Ready - Show Key
      ctx.font = 'bold 32px Arial'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(data.activeKey, x + size / 2, y + size / 2)
    }
    
    // Charges
    if (data.activeCharges > 1) {
      ctx.font = 'bold 16px Arial'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`×${data.activeCharges}`, x + size - 5, y + size - 5)
    }
    
    // Ability Name
    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(data.activeName, x + size / 2, y + size + 5)
  }

  /**
   * Render Ultimate Ability (Q)
   */
  private renderUltimateAbility(ctx: CanvasRenderingContext2D, x: number, y: number, data: AbilityHUDData): void {
    const size = 80
    const isReady = data.ultimateReady
    
    // Background
    ctx.fillStyle = isReady ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.7)'
    ctx.strokeStyle = isReady ? '#FFD700' : '#666666'
    ctx.lineWidth = 3
    
    ctx.fillRect(x, y, size, size)
    ctx.strokeRect(x, y, size, size)
    
    // Charge Bar (Bottom to Top)
    if (!isReady) {
      const chargeHeight = size * (data.ultimateCharge / 100)
      
      // Charge Bar Background
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'
      ctx.fillRect(x, y + size - chargeHeight, size, chargeHeight)
      
      // Charge Percentage
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${Math.floor(data.ultimateCharge)}%`, x + size / 2, y + size / 2)
    } else {
      // Ready - Pulsing Effect
      const pulse = 0.5 + Math.abs(Math.sin(Date.now() / 500)) * 0.5
      
      ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`
      ctx.fillRect(x, y, size, size)
      
      // Key
      ctx.font = 'bold 32px Arial'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(data.ultimateKey, x + size / 2, y + size / 2)
    }
    
    // Ability Name
    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = isReady ? '#FFD700' : '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(data.ultimateName, x + size / 2, y + size + 5)
  }
}

// =============================================================================
// MINIMAP RENDERER
// =============================================================================

export interface MinimapData {
  playerPosition: THREE.Vector3
  playerRotation: number // Radians
  enemies: Array<{ position: THREE.Vector3; distance: number }>
  mapSize: { width: number; height: number }
}

export class MinimapRenderer {
  private canvas: HTMLCanvasElement
  private size: number = 150 // Minimap size in pixels
  private zoom: number = 50 // Map units per minimap size

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Render Minimap
   */
  render(ctx: CanvasRenderingContext2D, data: MinimapData): void {
    const width = this.canvas.width
    const x = width - this.size - 20 // Top right corner
    const y = 20
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(x, y, this.size, this.size)
    
    // Border
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, this.size, this.size)
    
    // Center (Player)
    const centerX = x + this.size / 2
    const centerY = y + this.size / 2
    
    // Draw Enemies
    data.enemies.forEach(enemy => {
      // Calculate relative position
      const relX = enemy.position.x - data.playerPosition.x
      const relZ = enemy.position.z - data.playerPosition.z
      
      // Scale to minimap
      const mapX = centerX + (relX / this.zoom) * this.size
      const mapY = centerY + (relZ / this.zoom) * this.size
      
      // Only draw if within minimap bounds
      if (mapX >= x && mapX <= x + this.size && mapY >= y && mapY <= y + this.size) {
        // Enemy dot (red)
        ctx.fillStyle = '#FF0000'
        ctx.beginPath()
        ctx.arc(mapX, mapY, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    
    // Draw Player (blue arrow)
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(data.playerRotation)
    
    // Arrow shape
    ctx.fillStyle = '#00BFFF'
    ctx.beginPath()
    ctx.moveTo(0, -8) // Top
    ctx.lineTo(-5, 5) // Bottom left
    ctx.lineTo(0, 3) // Bottom center
    ctx.lineTo(5, 5) // Bottom right
    ctx.closePath()
    ctx.fill()
    
    ctx.restore()
  }
}

