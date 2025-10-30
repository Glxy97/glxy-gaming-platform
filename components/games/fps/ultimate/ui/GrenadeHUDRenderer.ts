/**
 * 💣 GRENADE HUD RENDERER
 * 
 * Displays grenade inventory and current type
 * - Shows all 3 grenade types
 * - Highlights current type
 * - Shows remaining count
 * - Visual grenades icons
 */

import { GrenadeType } from '../weapons/GrenadeSystem'

export interface GrenadeHUDState {
  currentType: GrenadeType
  inventory: Map<GrenadeType, number>
}

export class GrenadeHUDRenderer {
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Render grenade HUD
   */
  render(
    ctx: CanvasRenderingContext2D,
    state: GrenadeHUDState,
    x: number,
    y: number
  ): void {
    ctx.save()

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(x, y, 200, 120)

    // Border
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, 200, 120)

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('GRENADES', x + 10, y + 20)

    // Key hint
    ctx.fillStyle = '#888888'
    ctx.font = '10px Arial'
    ctx.fillText('G - Throw | H - Switch', x + 10, y + 35)

    // Grenade types
    const grenadeY = y + 50
    const spacing = 60

    this.renderGrenadeSlot(
      ctx,
      x + 10,
      grenadeY,
      GrenadeType.FRAG,
      state.inventory.get(GrenadeType.FRAG) || 0,
      state.currentType === GrenadeType.FRAG
    )

    this.renderGrenadeSlot(
      ctx,
      x + 10 + spacing,
      grenadeY,
      GrenadeType.SMOKE,
      state.inventory.get(GrenadeType.SMOKE) || 0,
      state.currentType === GrenadeType.SMOKE
    )

    this.renderGrenadeSlot(
      ctx,
      x + 10 + spacing * 2,
      grenadeY,
      GrenadeType.FLASH,
      state.inventory.get(GrenadeType.FLASH) || 0,
      state.currentType === GrenadeType.FLASH
    )

    ctx.restore()
  }

  /**
   * Render single grenade slot
   */
  private renderGrenadeSlot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: GrenadeType,
    count: number,
    isActive: boolean
  ): void {
    const size = 50

    // Slot background
    if (isActive) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.3)'
      ctx.fillRect(x, y, size, size)
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, size, size)
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(x, y, size, size)
      ctx.strokeStyle = '#666666'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, size, size)
    }

    // Grenade icon (simple circle)
    const iconColor = 
      type === GrenadeType.FRAG ? '#ff4444' :
      type === GrenadeType.SMOKE ? '#aaaaaa' : '#ffff00'

    ctx.fillStyle = iconColor
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2 - 5, 10, 0, Math.PI * 2)
    ctx.fill()

    // Count
    ctx.fillStyle = count > 0 ? '#ffffff' : '#666666'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(count.toString(), x + size / 2, y + size - 5)

    // Type label
    ctx.fillStyle = isActive ? '#00ff88' : '#888888'
    ctx.font = '8px Arial'
    const label = 
      type === GrenadeType.FRAG ? 'FRAG' :
      type === GrenadeType.SMOKE ? 'SMOKE' : 'FLASH'
    ctx.fillText(label, x + size / 2, y - 5)
  }
}

