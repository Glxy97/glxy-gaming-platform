/**
 * GLXY Ultimate FPS - UI Manager
 *
 * Professional UI orchestration system
 * Manages all UI components, layouts, themes, and interactions
 *
 * @module UIManager
 * @category UI
 *
 * Architecture: Event-Driven, Data-Driven, Interface-Driven
 * Pattern: Manager Pattern, Observer Pattern
 *
 * Phase 6: UI Enhancements & Polish
 */

import * as THREE from 'three'
import {
  UIPosition,
  UIElementType,
  UITheme,
  UIAnimationType,
  NotificationType,
  CrosshairStyle,
  KillFeedType,
  UIElementData,
  HUDLayoutData,
  UIThemeData,
  CrosshairData,
  MinimapData,
  NotificationTemplate,
  KillFeedTemplate,
  KillFeedEntry,
  PerformanceDisplayData,
  GLXY_THEME,
  DEFAULT_CROSSHAIR,
  DEFAULT_MINIMAP,
  DEFAULT_HUD_LAYOUT,
  DEFAULT_PERFORMANCE_DISPLAY,
  getUITheme,
  getCrosshair,
  getNotificationTemplate,
  getKillFeedTemplate,
  getHUDLayout,
  createNotificationTemplate,
  createKillFeedEntry,
  formatKillFeedEntry
} from './data/UIData'

/**
 * UI Manager Configuration
 */
export interface UIManagerConfig {
  // Initial settings
  theme: string // Theme ID
  layout: string // Layout ID
  crosshair: string // Crosshair ID

  // Features
  enableNotifications: boolean
  enableKillFeed: boolean
  enableMinimap: boolean
  enablePerformanceDisplay: boolean

  // Quality settings
  animationsEnabled: boolean
  blurEnabled: boolean
  shadowsEnabled: boolean

  // Accessibility
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean

  // Performance
  updateRate: number // Hz
}

/**
 * UI Update Data (from game engine)
 */
export interface UIUpdateData {
  // Player stats
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  stamina: number
  maxStamina: number

  // Weapon
  ammo: {
    current: number
    reserve: number
    max: number
    type: string
  }
  weaponName: string
  isReloading: boolean

  // Combat
  kills: number
  deaths: number
  assists: number
  score: number
  streak: number

  // Game state
  time: number
  round: number
  team: string
  gameMode: string

  // Position
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3

  // Minimap
  enemies: Array<{
    id: string
    position: THREE.Vector3
    health: number
  }>
  allies: Array<{
    id: string
    position: THREE.Vector3
    health: number
  }>
  objectives: Array<{
    id: string
    position: THREE.Vector3
    type: string
  }>

  // Performance
  fps: number
  ping: number
  frameTime: number
  memoryUsage: number
}

/**
 * UI Event Types
 */
export enum UIEventType {
  // Theme events
  THEME_CHANGED = 'theme:changed',
  LAYOUT_CHANGED = 'layout:changed',
  CROSSHAIR_CHANGED = 'crosshair:changed',

  // Notification events
  NOTIFICATION_SHOWN = 'notification:shown',
  NOTIFICATION_HIDDEN = 'notification:hidden',

  // Kill feed events
  KILL_FEED_ENTRY = 'killfeed:entry',

  // HUD events
  HUD_ELEMENT_SHOWN = 'hud:element:shown',
  HUD_ELEMENT_HIDDEN = 'hud:element:hidden',
  HUD_ELEMENT_UPDATED = 'hud:element:updated',

  // Settings events
  SETTINGS_CHANGED = 'settings:changed',

  // Debug events
  DEBUG_TOGGLED = 'debug:toggled'
}

/**
 * UI Event Data
 */
export interface UIEvent {
  type: UIEventType
  data: any
  timestamp: number
}

/**
 * UI Manager - Orchestrates all UI systems
 */
export class UIManager {
  private config: UIManagerConfig
  private theme: UIThemeData
  private layout: HUDLayoutData
  private crosshair: CrosshairData
  private minimap: MinimapData
  private performanceDisplay: PerformanceDisplayData

  // State
  private currentUpdateData: UIUpdateData | null = null
  private killFeedEntries: KillFeedEntry[] = []
  private notificationQueue: NotificationTemplate[] = []
  private activeNotifications: Map<string, NotificationTemplate> = new Map()

  // UI Elements (DOM)
  private container: HTMLElement
  private hudLayer: HTMLElement
  private notificationLayer: HTMLElement
  private killFeedLayer: HTMLElement
  private crosshairElement: HTMLElement | null = null
  private minimapCanvas: HTMLCanvasElement | null = null

  // Event system
  private eventCallbacks: Map<UIEventType, Array<(event: UIEvent) => void>> = new Map()

  // Animation
  private animationFrame: number = 0
  private lastUpdateTime: number = 0
  private updateInterval: number // milliseconds

  // Stats
  private stats = {
    notificationsShown: 0,
    killFeedEntries: 0,
    themeChanges: 0,
    layoutChanges: 0,
    eventsDispatched: 0
  }

  constructor(container: HTMLElement, config: Partial<UIManagerConfig> = {}) {
    this.container = container

    // Initialize configuration
    this.config = {
      theme: 'glxy',
      layout: 'default',
      crosshair: 'default',
      enableNotifications: true,
      enableKillFeed: true,
      enableMinimap: true,
      enablePerformanceDisplay: false,
      animationsEnabled: true,
      blurEnabled: true,
      shadowsEnabled: true,
      colorBlindMode: 'none',
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      updateRate: 60,
      ...config
    }

    this.updateInterval = 1000 / this.config.updateRate

    // Load data
    this.theme = getUITheme(this.config.theme) || GLXY_THEME
    this.layout = getHUDLayout(this.config.layout) || DEFAULT_HUD_LAYOUT
    this.crosshair = getCrosshair(this.config.crosshair) || DEFAULT_CROSSHAIR
    this.minimap = DEFAULT_MINIMAP
    this.performanceDisplay = DEFAULT_PERFORMANCE_DISPLAY

    // Create UI layers
    this.hudLayer = this.createLayer('hud')
    this.notificationLayer = this.createLayer('notification')
    this.killFeedLayer = this.createLayer('killfeed')

    this.container.appendChild(this.hudLayer)
    this.container.appendChild(this.notificationLayer)
    this.container.appendChild(this.killFeedLayer)

    // Initialize UI components
    this.initializeHUD()
    this.initializeCrosshair()
    if (this.config.enableMinimap) {
      this.initializeMinimap()
    }

    // Apply theme
    this.applyTheme()

    // Start update loop
    this.startUpdateLoop()

    console.log('🎨 UIManager: Initialized with theme', this.theme.name)
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private createLayer(name: string): HTMLElement {
    const layer = document.createElement('div')
    layer.id = `ui-${name}-layer`
    layer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: ${name === 'notification' ? 2000 : 1000};
    `
    return layer
  }

  private initializeHUD(): void {
    this.layout.elements.forEach(element => {
      this.createHUDElement(element)
    })
  }

  private createHUDElement(elementData: UIElementData): void {
    const element = document.createElement('div')
    element.id = `ui-element-${elementData.id}`
    element.className = `ui-element ui-${elementData.type}`

    // Position
    element.style.position = 'absolute'
    this.applyPosition(element, elementData.position, elementData.offset)

    // Size
    element.style.width = `${elementData.size.width}px`
    element.style.height = `${elementData.size.height}px`

    // Styling
    element.style.opacity = elementData.opacity.toString()
    element.style.zIndex = elementData.zIndex.toString()
    element.style.transform = `scale(${elementData.scale})`
    element.style.pointerEvents = elementData.interactive ? 'auto' : 'none'

    // Visibility
    element.style.display = elementData.visible ? 'block' : 'none'

    // Add to layer
    this.hudLayer.appendChild(element)

    // Render content based on type
    this.renderHUDElement(element, elementData)
  }

  private applyPosition(
    element: HTMLElement,
    position: UIPosition,
    offset: { x: number; y: number }
  ): void {
    // Clear all position properties
    element.style.top = ''
    element.style.bottom = ''
    element.style.left = ''
    element.style.right = ''

    switch (position) {
      case UIPosition.TOP_LEFT:
        element.style.top = `${offset.y}px`
        element.style.left = `${offset.x}px`
        break
      case UIPosition.TOP_CENTER:
        element.style.top = `${offset.y}px`
        element.style.left = '50%'
        element.style.transform = 'translateX(-50%)'
        break
      case UIPosition.TOP_RIGHT:
        element.style.top = `${offset.y}px`
        element.style.right = `${Math.abs(offset.x)}px`
        break
      case UIPosition.CENTER_LEFT:
        element.style.top = '50%'
        element.style.left = `${offset.x}px`
        element.style.transform = 'translateY(-50%)'
        break
      case UIPosition.CENTER:
        element.style.top = '50%'
        element.style.left = '50%'
        element.style.transform = 'translate(-50%, -50%)'
        break
      case UIPosition.CENTER_RIGHT:
        element.style.top = '50%'
        element.style.right = `${Math.abs(offset.x)}px`
        element.style.transform = 'translateY(-50%)'
        break
      case UIPosition.BOTTOM_LEFT:
        element.style.bottom = `${Math.abs(offset.y)}px`
        element.style.left = `${offset.x}px`
        break
      case UIPosition.BOTTOM_CENTER:
        element.style.bottom = `${Math.abs(offset.y)}px`
        element.style.left = '50%'
        element.style.transform = 'translateX(-50%)'
        break
      case UIPosition.BOTTOM_RIGHT:
        element.style.bottom = `${Math.abs(offset.y)}px`
        element.style.right = `${Math.abs(offset.x)}px`
        break
    }
  }

  private renderHUDElement(element: HTMLElement, elementData: UIElementData): void {
    // Apply theme styling
    element.style.backgroundColor = this.theme.colors.background
    element.style.color = this.theme.colors.text
    element.style.fontFamily = this.theme.fontFamily
    element.style.fontSize = `${this.theme.fontSizeBase}px`
    element.style.borderRadius = `${this.theme.borderRadius}px`
    element.style.borderWidth = `${this.theme.borderWidth}px`
    element.style.borderStyle = 'solid'

    if (this.theme.blurEnabled && this.config.blurEnabled) {
      element.style.backdropFilter = `blur(${this.theme.blurAmount}px)`
    }

    // Type-specific styling
    switch (elementData.type) {
      case UIElementType.HEALTH_BAR:
        element.style.borderColor = this.theme.colors.health
        element.innerHTML = this.renderHealthBar()
        break
      case UIElementType.ARMOR_BAR:
        element.style.borderColor = this.theme.colors.armor
        element.innerHTML = this.renderArmorBar()
        break
      case UIElementType.STAMINA_BAR:
        element.style.borderColor = this.theme.colors.stamina
        element.innerHTML = this.renderStaminaBar()
        break
      case UIElementType.AMMO_DISPLAY:
        element.style.borderColor = this.theme.colors.ammo
        element.innerHTML = this.renderAmmoDisplay()
        break
      case UIElementType.KILL_FEED:
        element.style.borderColor = this.theme.colors.border
        element.innerHTML = '<div id="kill-feed-entries"></div>'
        break
      case UIElementType.TIMER:
        element.style.borderColor = this.theme.colors.border
        element.innerHTML = this.renderTimer()
        break
    }

    element.style.padding = `${this.theme.spacingSmall}px`
  }

  private initializeCrosshair(): void {
    this.crosshairElement = document.createElement('div')
    this.crosshairElement.id = 'ui-crosshair'
    this.crosshairElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9999;
    `

    this.renderCrosshair()
    this.hudLayer.appendChild(this.crosshairElement)
  }

  private renderCrosshair(): void {
    if (!this.crosshairElement) return

    const { color, size, thickness, gap, opacity, centerDot, centerDotSize, outlineColor, outlineWidth } = this.crosshair

    let html = '<div style="position: relative; width: 100%; height: 100%;">'

    if (centerDot) {
      html += `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${centerDotSize}px;
          height: ${centerDotSize}px;
          background: ${color};
          border-radius: 50%;
          opacity: ${opacity};
          ${outlineColor ? `box-shadow: 0 0 ${outlineWidth}px ${outlineColor};` : ''}
        "></div>
      `
    }

    if (this.crosshair.style === CrosshairStyle.CROSS) {
      // Horizontal line
      html += `
        <div style="
          position: absolute;
          top: 50%;
          left: ${gap}px;
          width: ${(size - gap * 2) / 2}px;
          height: ${thickness}px;
          background: ${color};
          opacity: ${opacity};
          ${outlineColor ? `box-shadow: 0 0 ${outlineWidth}px ${outlineColor};` : ''}
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          right: ${gap}px;
          width: ${(size - gap * 2) / 2}px;
          height: ${thickness}px;
          background: ${color};
          opacity: ${opacity};
          ${outlineColor ? `box-shadow: 0 0 ${outlineWidth}px ${outlineColor};` : ''}
        "></div>
      `
      // Vertical line
      html += `
        <div style="
          position: absolute;
          left: 50%;
          top: ${gap}px;
          width: ${thickness}px;
          height: ${(size - gap * 2) / 2}px;
          background: ${color};
          opacity: ${opacity};
          ${outlineColor ? `box-shadow: 0 0 ${outlineWidth}px ${outlineColor};` : ''}
        "></div>
        <div style="
          position: absolute;
          left: 50%;
          bottom: ${gap}px;
          width: ${thickness}px;
          height: ${(size - gap * 2) / 2}px;
          background: ${color};
          opacity: ${opacity};
          ${outlineColor ? `box-shadow: 0 0 ${outlineWidth}px ${outlineColor};` : ''}
        "></div>
      `
    } else if (this.crosshair.style === CrosshairStyle.CIRCLE) {
      html += `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          border: ${thickness}px solid ${color};
          border-radius: 50%;
          opacity: ${opacity};
          ${outlineColor ? `box-shadow: 0 0 ${outlineWidth}px ${outlineColor};` : ''}
        "></div>
      `
    }

    html += '</div>'
    this.crosshairElement.innerHTML = html
  }

  private initializeMinimap(): void {
    this.minimapCanvas = document.createElement('canvas')
    this.minimapCanvas.id = 'ui-minimap-canvas'
    this.minimapCanvas.width = this.minimap.size
    this.minimapCanvas.height = this.minimap.size
    this.minimapCanvas.style.cssText = `
      position: absolute;
      top: ${this.minimap.offset.y}px;
      right: ${Math.abs(this.minimap.offset.x)}px;
      border: ${this.minimap.borderWidth}px solid ${this.minimap.borderColor};
      border-radius: ${this.minimap.borderRadius}px;
      background: ${this.minimap.backgroundColor};
      opacity: ${this.minimap.opacity};
      pointer-events: auto;
    `

    this.hudLayer.appendChild(this.minimapCanvas)
  }

  // =============================================================================
  // UPDATE LOOP
  // =============================================================================

  private startUpdateLoop(): void {
    const update = (currentTime: number) => {
      const deltaTime = currentTime - this.lastUpdateTime

      if (deltaTime >= this.updateInterval) {
        this.update(deltaTime / 1000) // Convert to seconds
        this.lastUpdateTime = currentTime
      }

      this.animationFrame = requestAnimationFrame(update)
    }

    this.lastUpdateTime = performance.now()
    this.animationFrame = requestAnimationFrame(update)
  }

  private update(deltaTime: number): void {
    if (!this.currentUpdateData) return

    // Update HUD elements
    this.updateHealthBar()
    this.updateArmorBar()
    this.updateStaminaBar()
    this.updateAmmoDisplay()
    this.updateTimer()

    // Update minimap
    if (this.config.enableMinimap && this.minimapCanvas) {
      this.updateMinimap()
    }

    // Update kill feed
    if (this.config.enableKillFeed) {
      this.updateKillFeed(deltaTime)
    }

    // Update notifications
    if (this.config.enableNotifications) {
      this.updateNotifications(deltaTime)
    }

    // Update performance display
    if (this.config.enablePerformanceDisplay) {
      this.updatePerformanceDisplay()
    }
  }

  // =============================================================================
  // HUD RENDERING
  // =============================================================================

  private renderHealthBar(): string {
    return `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">❤️</span>
        <div style="flex: 1; position: relative; height: 20px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;">
          <div id="health-bar-fill" style="position: absolute; height: 100%; background: ${this.theme.colors.health}; transition: width 0.3s;"></div>
        </div>
        <span id="health-bar-text" style="font-weight: bold; min-width: 60px;">100/100</span>
      </div>
    `
  }

  private renderArmorBar(): string {
    return `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 14px;">🛡️</span>
        <div style="flex: 1; position: relative; height: 16px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;">
          <div id="armor-bar-fill" style="position: absolute; height: 100%; background: ${this.theme.colors.armor}; transition: width 0.3s;"></div>
        </div>
        <span id="armor-bar-text" style="font-size: 12px; min-width: 50px;">50/100</span>
      </div>
    `
  }

  private renderStaminaBar(): string {
    return `
      <div style="position: relative; height: 16px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;">
        <div id="stamina-bar-fill" style="position: absolute; height: 100%; background: ${this.theme.colors.stamina}; transition: width 0.2s;"></div>
      </div>
    `
  }

  private renderAmmoDisplay(): string {
    return `
      <div style="text-align: center;">
        <div style="display: flex; align-items: baseline; justify-content: center; gap: 8px;">
          <span id="ammo-current" style="font-size: 32px; font-weight: bold; color: ${this.theme.colors.ammo};">30</span>
          <span style="font-size: 20px; color: ${this.theme.colors.textSecondary};">/</span>
          <span id="ammo-reserve" style="font-size: 20px; color: ${this.theme.colors.textSecondary};">120</span>
        </div>
        <div id="weapon-name" style="font-size: 12px; color: ${this.theme.colors.textSecondary}; margin-top: 4px;">M4A1</div>
      </div>
    `
  }

  private renderTimer(): string {
    return `
      <div style="text-align: center;">
        <div id="timer-display" style="font-size: 20px; font-weight: bold;">00:00</div>
        <div id="round-display" style="font-size: 12px; color: ${this.theme.colors.textSecondary};">Round 1</div>
      </div>
    `
  }

  // =============================================================================
  // HUD UPDATES
  // =============================================================================

  private updateHealthBar(): void {
    if (!this.currentUpdateData) return

    const { health, maxHealth } = this.currentUpdateData
    const percentage = (health / maxHealth) * 100

    const fill = document.getElementById('health-bar-fill')
    const text = document.getElementById('health-bar-text')

    if (fill) fill.style.width = `${percentage}%`
    if (text) text.textContent = `${Math.round(health)}/${Math.round(maxHealth)}`
  }

  private updateArmorBar(): void {
    if (!this.currentUpdateData) return

    const { armor, maxArmor } = this.currentUpdateData
    const percentage = (armor / maxArmor) * 100

    const fill = document.getElementById('armor-bar-fill')
    const text = document.getElementById('armor-bar-text')

    if (fill) fill.style.width = `${percentage}%`
    if (text) text.textContent = `${Math.round(armor)}/${Math.round(maxArmor)}`
  }

  private updateStaminaBar(): void {
    if (!this.currentUpdateData) return

    const { stamina, maxStamina } = this.currentUpdateData
    const percentage = (stamina / maxStamina) * 100

    const fill = document.getElementById('stamina-bar-fill')
    if (fill) fill.style.width = `${percentage}%`
  }

  private updateAmmoDisplay(): void {
    if (!this.currentUpdateData) return

    const { ammo, weaponName, isReloading } = this.currentUpdateData

    // ✅ DEFENSIVE: Prüfe ob ammo existiert und korrekt strukturiert ist
    if (!ammo || typeof ammo.current === 'undefined') {
      // Fallback: Leere Werte anzeigen
      const current = document.getElementById('ammo-current')
      const reserve = document.getElementById('ammo-reserve')
      const weapon = document.getElementById('weapon-name')
      if (current) current.textContent = '--'
      if (reserve) reserve.textContent = '--'
      if (weapon) weapon.textContent = weaponName || 'None'
      return
    }

    const current = document.getElementById('ammo-current')
    const reserve = document.getElementById('ammo-reserve')
    const weapon = document.getElementById('weapon-name')

    if (current) {
      current.textContent = isReloading ? '--' : ammo.current.toString()
      current.style.color = ammo.current <= 5 ? this.theme.colors.error : this.theme.colors.ammo
    }
    if (reserve) reserve.textContent = ammo.reserve.toString()
    if (weapon) weapon.textContent = weaponName || 'None'
  }

  private updateTimer(): void {
    if (!this.currentUpdateData) return

    const { time, round } = this.currentUpdateData

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    const timerDisplay = document.getElementById('timer-display')
    const roundDisplay = document.getElementById('round-display')

    if (timerDisplay) timerDisplay.textContent = formatted
    if (roundDisplay) roundDisplay.textContent = `Round ${round}`
  }

  private updateMinimap(): void {
    if (!this.minimapCanvas || !this.currentUpdateData) return

    const ctx = this.minimapCanvas.getContext('2d')
    if (!ctx) return

    const { size } = this.minimap
    const { position, enemies, allies, objectives } = this.currentUpdateData

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw grid
    if (this.minimap.showGrid && this.minimap.gridColor) {
      ctx.strokeStyle = this.minimap.gridColor
      ctx.lineWidth = 1
      const gridSpacing = this.minimap.gridSpacing || 50
      for (let i = 0; i < size; i += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, size)
        ctx.moveTo(0, i)
        ctx.lineTo(size, i)
        ctx.stroke()
      }
    }

    // Draw player (center)
    const centerX = size / 2
    const centerY = size / 2
    ctx.fillStyle = this.minimap.playerIcon.color
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - 8)
    ctx.lineTo(centerX - 6, centerY + 6)
    ctx.lineTo(centerX + 6, centerY + 6)
    ctx.closePath()
    ctx.fill()

    // Draw enemies
    if (enemies && enemies.length > 0) {
      enemies.forEach(enemy => {
        const relX = (enemy.position.x - position.x) * 2 + centerX
        const relZ = (enemy.position.z - position.z) * 2 + centerY

        if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
          ctx.fillStyle = this.minimap.enemyIcon.color
          ctx.fillRect(relX - 3, relZ - 3, 6, 6)
        }
      })
    }

    // Draw allies
    if (allies && allies.length > 0) {
      allies.forEach(ally => {
        const relX = (ally.position.x - position.x) * 2 + centerX
        const relZ = (ally.position.z - position.z) * 2 + centerY

        if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
          ctx.fillStyle = this.minimap.allyIcon.color
          ctx.beginPath()
          ctx.arc(relX, relZ, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }

    // Draw compass
    if (this.minimap.showCompass && this.minimap.compassColor) {
      ctx.strokeStyle = this.minimap.compassColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX, 10)
      ctx.lineTo(centerX - 5, 20)
      ctx.moveTo(centerX, 10)
      ctx.lineTo(centerX + 5, 20)
      ctx.stroke()
    }
  }

  private updateKillFeed(deltaTime: number): void {
    // Remove expired entries
    const now = Date.now()
    this.killFeedEntries = this.killFeedEntries.filter(
      entry => now - entry.timestamp < 5000 // 5 seconds
    )

    // Render kill feed
    const killFeedContainer = document.getElementById('kill-feed-entries')
    if (killFeedContainer) {
      killFeedContainer.innerHTML = this.killFeedEntries
        .map(entry => {
          const template = getKillFeedTemplate(entry.type) || getKillFeedTemplate(KillFeedType.KILL)!
          const formatted = formatKillFeedEntry(entry, template)
          return `
            <div style="
              padding: 6px 12px;
              margin-bottom: 4px;
              background: rgba(0, 0, 0, 0.7);
              border-left: 3px solid ${template.color};
              border-radius: 4px;
              font-size: 13px;
              animation: slideIn 0.3s ease-out;
            ">${formatted}</div>
          `
        })
        .join('')
    }
  }

  private updateNotifications(deltaTime: number): void {
    // Process notification queue
    if (this.notificationQueue.length > 0 && this.activeNotifications.size < 3) {
      const notification = this.notificationQueue.shift()
      if (notification) {
        this.showNotification(notification)
      }
    }

    // Update active notifications (handled by CSS animations)
  }

  private updatePerformanceDisplay(): void {
    if (!this.currentUpdateData) return

    const { fps, ping, frameTime, memoryUsage } = this.currentUpdateData

    // Implementation for performance display
    // Could be a separate overlay element
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Update UI with new game data
   */
  public updateUI(data: Partial<UIUpdateData>): void {
    this.currentUpdateData = {
      ...this.currentUpdateData,
      ...data
    } as UIUpdateData
  }

  /**
   * Add kill feed entry
   */
  public addKillFeedEntry(killer: string, victim: string, weapon: string, options: Partial<KillFeedEntry> = {}): void {
    const entry = createKillFeedEntry(killer, victim, weapon, options)
    this.killFeedEntries.unshift(entry) // Add to beginning
    this.stats.killFeedEntries++

    this.dispatchEvent({
      type: UIEventType.KILL_FEED_ENTRY,
      data: entry,
      timestamp: Date.now()
    })
  }

  /**
   * Show notification
   */
  public showNotification(template: NotificationTemplate): void {
    if (!this.config.enableNotifications) return

    this.notificationQueue.push(template)
  }

  private showNotificationImmediate(template: NotificationTemplate): void {
    const id = `notification-${Date.now()}`
    this.activeNotifications.set(id, template)
    this.stats.notificationsShown++

    const element = document.createElement('div')
    element.id = id
    element.style.cssText = `
      position: absolute;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 24px;
      background: ${template.color};
      color: white;
      border-radius: ${this.theme.borderRadius}px;
      font-weight: bold;
      font-size: ${this.theme.fontSizeLarge}px;
      z-index: 10000;
      animation: slideDown 0.3s ease-out, fadeOut 0.5s ease-in ${template.duration - 0.5}s forwards;
      pointer-events: none;
    `

    element.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">${template.icon}</span>
        <div>
          <div style="font-size: ${this.theme.fontSizeLarge}px;">${template.title}</div>
          <div style="font-size: ${this.theme.fontSizeSmall}px; opacity: 0.9;">${template.message}</div>
        </div>
      </div>
    `

    this.notificationLayer.appendChild(element)

    // Auto-remove after duration
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
      this.activeNotifications.delete(id)
    }, template.duration * 1000)

    this.dispatchEvent({
      type: UIEventType.NOTIFICATION_SHOWN,
      data: template,
      timestamp: Date.now()
    })
  }

  /**
   * Set theme
   */
  public setTheme(themeId: string): void {
    const theme = getUITheme(themeId)
    if (!theme) return

    this.theme = theme
    this.config.theme = themeId
    this.applyTheme()
    this.stats.themeChanges++

    this.dispatchEvent({
      type: UIEventType.THEME_CHANGED,
      data: theme,
      timestamp: Date.now()
    })
  }

  /**
   * Set layout
   */
  public setLayout(layoutId: string): void {
    const layout = getHUDLayout(layoutId)
    if (!layout) return

    this.layout = layout
    this.config.layout = layoutId

    // Rebuild HUD
    this.hudLayer.innerHTML = ''
    this.initializeHUD()
    this.stats.layoutChanges++

    this.dispatchEvent({
      type: UIEventType.LAYOUT_CHANGED,
      data: layout,
      timestamp: Date.now()
    })
  }

  /**
   * Set crosshair
   */
  public setCrosshair(crosshairId: string): void {
    const crosshair = getCrosshair(crosshairId)
    if (!crosshair) return

    this.crosshair = crosshair
    this.config.crosshair = crosshairId
    this.renderCrosshair()

    this.dispatchEvent({
      type: UIEventType.CROSSHAIR_CHANGED,
      data: crosshair,
      timestamp: Date.now()
    })
  }

  /**
   * Toggle HUD element visibility
   */
  public toggleHUDElement(elementId: string, visible: boolean): void {
    const element = document.getElementById(`ui-element-${elementId}`)
    if (element) {
      element.style.display = visible ? 'block' : 'none'

      this.dispatchEvent({
        type: visible ? UIEventType.HUD_ELEMENT_SHOWN : UIEventType.HUD_ELEMENT_HIDDEN,
        data: { elementId },
        timestamp: Date.now()
      })
    }
  }

  /**
   * Subscribe to UI events
   */
  public on(eventType: UIEventType, callback: (event: UIEvent) => void): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, [])
    }
    this.eventCallbacks.get(eventType)!.push(callback)
  }

  /**
   * Unsubscribe from UI events
   */
  public off(eventType: UIEventType, callback: (event: UIEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private dispatchEvent(event: UIEvent): void {
    this.stats.eventsDispatched++
    const callbacks = this.eventCallbacks.get(event.type)
    if (callbacks) {
      callbacks.forEach(cb => cb(event))
    }
  }

  private applyTheme(): void {
    // Apply theme colors to existing elements
    this.layout.elements.forEach(elementData => {
      const element = document.getElementById(`ui-element-${elementData.id}`)
      if (element) {
        this.renderHUDElement(element, elementData)
      }
    })

    if (this.crosshairElement) {
      this.renderCrosshair()
    }
  }

  /**
   * Get statistics
   */
  public getStats() {
    return { ...this.stats }
  }

  /**
   * Get current configuration
   */
  public getConfig(): UIManagerConfig {
    return { ...this.config }
  }

  /**
   * Dispose and cleanup
   */
  public dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    this.eventCallbacks.clear()
    this.activeNotifications.clear()
    this.notificationQueue = []
    this.killFeedEntries = []

    // Remove DOM elements
    this.hudLayer.remove()
    this.notificationLayer.remove()
    this.killFeedLayer.remove()

    console.log('🗑️ UIManager: Disposed')
  }
}
