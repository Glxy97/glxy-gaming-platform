/**
 * 🔭 SCOPE SYSTEM
 * 
 * Weapon scoping/aiming system
 * - RMB to Zoom
 * - Dynamic FOV Reduction
 * - Scope Overlay (for sniper rifles)
 * - Slower Movement when scoped
 * - Crosshair changes
 */

export interface ScopeConfig {
  zoomLevel: number // FOV multiplier (e.g., 0.5 = half FOV)
  hasOverlay: boolean // True for sniper scopes
  movementSpeedMultiplier: number // e.g., 0.5 = half speed
  scopeInTime: number // milliseconds
  scopeOutTime: number // milliseconds
}

export const SCOPE_CONFIGS: Record<string, ScopeConfig> = {
  // No scope (iron sights)
  none: {
    zoomLevel: 1.0,
    hasOverlay: false,
    movementSpeedMultiplier: 1.0,
    scopeInTime: 0,
    scopeOutTime: 0
  },
  
  // Red dot / Holographic
  redDot: {
    zoomLevel: 0.9,
    hasOverlay: false,
    movementSpeedMultiplier: 0.9,
    scopeInTime: 150,
    scopeOutTime: 100
  },
  
  // ACOG (4x)
  acog: {
    zoomLevel: 0.6,
    hasOverlay: false,
    movementSpeedMultiplier: 0.7,
    scopeInTime: 250,
    scopeOutTime: 150
  },
  
  // Sniper Scope (8x)
  sniper: {
    zoomLevel: 0.3,
    hasOverlay: true,
    movementSpeedMultiplier: 0.5,
    scopeInTime: 350,
    scopeOutTime: 200
  },
  
  // High Power Scope (12x)
  highPower: {
    zoomLevel: 0.2,
    hasOverlay: true,
    movementSpeedMultiplier: 0.4,
    scopeInTime: 400,
    scopeOutTime: 250
  }
}

export class ScopeSystem {
  private isScoped: boolean = false
  private currentConfig: ScopeConfig
  private defaultFOV: number = 75
  private currentFOV: number = 75
  private targetFOV: number = 75
  private transitionProgress: number = 0
  private transitionDuration: number = 0
  private isTransitioning: boolean = false

  constructor(scopeType: string = 'none', defaultFOV: number = 75) {
    this.currentConfig = SCOPE_CONFIGS[scopeType] || SCOPE_CONFIGS.none
    this.defaultFOV = defaultFOV
    this.currentFOV = defaultFOV
    this.targetFOV = defaultFOV
  }

  /**
   * Set scope type
   */
  setScopeType(scopeType: string): void {
    this.currentConfig = SCOPE_CONFIGS[scopeType] || SCOPE_CONFIGS.none
  }

  /**
   * Start scoping (RMB pressed)
   */
  scopeIn(): void {
    if (this.isScoped) return

    this.isScoped = true
    this.targetFOV = this.defaultFOV * this.currentConfig.zoomLevel
    this.transitionDuration = this.currentConfig.scopeInTime
    this.transitionProgress = 0
    this.isTransitioning = true
  }

  /**
   * Stop scoping (RMB released)
   */
  scopeOut(): void {
    if (!this.isScoped) return

    this.isScoped = false
    this.targetFOV = this.defaultFOV
    this.transitionDuration = this.currentConfig.scopeOutTime
    this.transitionProgress = 0
    this.isTransitioning = true
  }

  /**
   * Update (smooth FOV transition)
   */
  update(deltaTime: number): number {
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime * 1000 // Convert to ms

      if (this.transitionProgress >= this.transitionDuration) {
        // Transition complete
        this.currentFOV = this.targetFOV
        this.isTransitioning = false
      } else {
        // Interpolate FOV
        const t = this.transitionProgress / this.transitionDuration
        // Ease out cubic for smooth feel
        const eased = 1 - Math.pow(1 - t, 3)
        this.currentFOV = this.defaultFOV + (this.targetFOV - this.defaultFOV) * eased
      }
    }

    return this.currentFOV
  }

  /**
   * Get current FOV
   */
  getFOV(): number {
    return this.currentFOV
  }

  /**
   * Check if scoped
   */
  getIsScoped(): boolean {
    return this.isScoped
  }

  /**
   * Get movement speed multiplier
   */
  getMovementSpeedMultiplier(): number {
    return this.isScoped ? this.currentConfig.movementSpeedMultiplier : 1.0
  }

  /**
   * Check if has overlay
   */
  hasOverlay(): boolean {
    return this.isScoped && this.currentConfig.hasOverlay
  }

  /**
   * Get zoom level
   */
  getZoomLevel(): number {
    return this.currentConfig.zoomLevel
  }
}

// =============================================================================
// SCOPE OVERLAY RENDERER
// =============================================================================

export class ScopeOverlayRenderer {
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Render scope overlay (sniper scope view)
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number, zoomLevel: number): void {
    ctx.save()

    // Black overlay with circular scope
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, width, height)

    // Scope circle
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.4

    // Clear circle for view
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over'

    // Scope reticle
    this.renderReticle(ctx, centerX, centerY, radius)

    // Scope info
    this.renderScopeInfo(ctx, width, height, zoomLevel)

    ctx.restore()
  }

  /**
   * Render scope reticle (crosshair)
   */
  private renderReticle(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number): void {
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2

    // Crosshair lines
    const lineLength = radius * 0.15

    // Horizontal
    ctx.beginPath()
    ctx.moveTo(centerX - lineLength, centerY)
    ctx.lineTo(centerX + lineLength, centerY)
    ctx.stroke()

    // Vertical
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - lineLength)
    ctx.lineTo(centerX, centerY + lineLength)
    ctx.stroke()

    // Center dot
    ctx.fillStyle = '#00ff88'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2)
    ctx.fill()

    // Range marks
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)'
    ctx.lineWidth = 1

    for (let i = 1; i <= 4; i++) {
      const y = centerY + (lineLength * 2 * i)
      ctx.beginPath()
      ctx.moveTo(centerX - 5, y)
      ctx.lineTo(centerX + 5, y)
      ctx.stroke()
    }
  }

  /**
   * Render scope info (zoom level, etc.)
   */
  private renderScopeInfo(ctx: CanvasRenderingContext2D, width: number, height: number, zoomLevel: number): void {
    ctx.fillStyle = '#00ff88'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'

    // Zoom indicator
    const zoomText = `${Math.round(1 / zoomLevel)}x`
    ctx.fillText(zoomText, 20, height - 20)
  }
}

