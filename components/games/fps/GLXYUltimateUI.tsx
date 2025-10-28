// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
  Trophy,
  Zap,
  Shield,
  Heart,
  Star,
  Crown,
  Flame,
  Skull,
  Activity,
  Settings,
  Users,
  Crosshair,
  Timer,
  Award,
  TrendingUp,
  Gauge,
  AlertCircle,
  CheckCircle,
  XCircle,
  Volume2,
  Wifi,
  Battery,
  Thermometer,
  Wind,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  LogOut,
  MessageSquare,
  Bell,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Upload,
  Share2,
  Bookmark,
  Flag,
  MapPin,
  Compass,
  Navigation,
  Radio,
  Satellite,
  Database,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  ZapOff,
  ShieldAlert,
  Target,
  Crosshair as CrosshairIcon,
  Camera,
  Video,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  VolumeX
} from 'lucide-react'

export interface UIComponent {
  id: string
  type: 'hud' | 'menu' | 'dialog' | 'tooltip' | 'notification' | 'minimap' | 'inventory' | 'settings' | 'scoreboard' | 'chat' | 'killfeed' | 'objectives' | 'progress' | 'stats' | 'performance' | 'debug'
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  size: { width: number; height: number }
  visible: boolean
  animated: boolean
  interactive: boolean
  priority: number
  theme: 'default' | 'dark' | 'light' | 'cyberpunk' | 'military' | 'minimal' | 'glxy'
  opacity: number
  blur: boolean
  scale: number
  rotation: number
}

export interface UIAnimation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'elastic' | 'shake' | 'pulse' | 'glow' | 'wave' | 'typewriter'
  duration: number
  delay: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'back' | 'cubic-bezier'
  direction: 'up' | 'down' | 'left' | 'right' | 'center' | 'in' | 'out'
  loop: boolean
  reverse: boolean
  intensity: number
}

export interface UIFeedback {
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'kill' | 'death' | 'damage' | 'heal' | 'levelup' | 'unlock' | 'milestone' | 'streak' | 'combo' | 'critical' | 'headshot' | 'multikill' | 'domination' | 'revenge' | 'comeback'
  message: string
  duration: number
  priority: number
  sound?: string
  haptic?: boolean
  visual?: {
    color: string
    icon: string
    animation: UIAnimation
    position: { x: number; y: number }
    size: { width: number; height: number }
  }
  persistent: boolean
  stackable: boolean
  maxStack: number
}

export interface UIState {
  components: Map<string, UIComponent>
  activeAnimations: Map<string, UIAnimation>
  feedbackQueue: UIFeedback[]
  activeFeedback: Map<string, UIFeedback>
  theme: 'default' | 'dark' | 'light' | 'cyberpunk' | 'military' | 'minimal' | 'glxy'
  scale: number
  language: string
  accessibility: {
    highContrast: boolean
    largeText: boolean
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    screenReader: boolean
    reducedMotion: boolean
    keyboardNavigation: boolean
    subtitles: boolean
    audioCues: boolean
    visualIndicators: boolean
  }
  performance: {
    enabled: boolean
    level: 'low' | 'medium' | 'high' | 'ultra'
    fpsTarget: number
    adaptiveQuality: boolean
    particleEffects: boolean
    animations: boolean
    shadows: boolean
    blur: boolean
    reflections: boolean
  }
  debug: {
    enabled: boolean
    showFPS: boolean
    showPing: boolean
    showMemory: boolean
    showPosition: boolean
    showPerformance: boolean
    showNetwork: boolean
    showRendering: boolean
    showPhysics: boolean
    showAudio: boolean
    showAI: boolean
  }
}

export interface HUDData {
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  energy: number
  maxEnergy: number
  stamina: number
  maxStamina: number
  ammo: {
    current: number
    reserve: number
    max: number
    type: string
  }
  score: number
  kills: number
  deaths: number
  assists: number
  streak: number
  time: number
  round: number
  team: string
  class: string
  level: number
  experience: number
  currency: number
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  status: 'alive' | 'dead' | 'spectating' | 'respawning'
  abilities: Array<{
    id: string
    name: string
    icon: string
    cooldown: number
    maxCooldown: number
    active: boolean
    available: boolean
  }>
  objectives: Array<{
    id: string
    name: string
    description: string
    progress: number
    maxProgress: number
    completed: boolean
    timeLimit?: number
    priority: 'low' | 'medium' | 'high' | 'critical'
  }>
  minimap: {
    enabled: boolean
    zoom: number
    rotation: boolean
    objects: Array<{
      id: string
      type: 'player' | 'enemy' | 'ally' | 'objective' | 'pickup' | 'vehicle' | 'hazard'
      position: THREE.Vector3
      icon: string
      color: string
      visible: boolean
    }>
  }
  crosshair: {
    enabled: boolean
    style: 'dot' | 'cross' | 'circle' | 'diamond' | 'custom'
    size: number
    color: string
    opacity: number
    dynamic: boolean
    spread: boolean
    hitMarker: boolean
    hitMarkerDuration: number
  }
}

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  textures: number
  memoryUsage: number
  gpuTime: number
  cpuTime: number
  networkLatency: number
  packetLoss: number
  bandwidth: number
  serverTick: number
  clientTick: number
  interpolation: number
  extrapolation: number
  predictionError: number
}

class GLXYUltimateUI {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer

  private state!: UIState
  private hudData!: HUDData
  private performanceMetrics!: PerformanceMetrics

  private rootElement!: HTMLElement
  private hudLayer!: HTMLElement
  private menuLayer!: HTMLElement
  private dialogLayer!: HTMLElement
  private notificationLayer!: HTMLElement
  private debugLayer!: HTMLElement

  private resizeObserver!: ResizeObserver
  private animationFrame!: number
  private lastUpdateTime!: number
  private updateInterval: number = 16.67 // 60 FPS

  private eventListeners: Map<string, Function[]> = new Map()
  private hotkeys: Map<string, Function> = new Map()
  private tooltips: Map<string, HTMLElement> = new Map()

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) {
    this.container = container
    this.canvas = canvas
    this.scene = scene
    this.camera = camera
    this.renderer = renderer

    this.state = this.initializeState()
    this.hudData = this.initializeHUDData()
    this.performanceMetrics = this.initializePerformanceMetrics()

    this.createLayers()
    this.setupEventListeners()
    this.setupHotkeys()
    this.setupResizeObserver()
    this.startAnimationLoop()

    console.log('🎨 GLXY Ultimate UI: Initialized!')
  }

  private initializeState(): UIState {
    return {
      components: new Map(),
      activeAnimations: new Map(),
      feedbackQueue: [],
      activeFeedback: new Map(),
      theme: 'glxy',
      scale: 1.0,
      language: 'en',
      accessibility: {
        highContrast: false,
        largeText: false,
        colorBlindMode: 'none',
        screenReader: false,
        reducedMotion: false,
        keyboardNavigation: true,
        subtitles: true,
        audioCues: true,
        visualIndicators: true
      },
      performance: {
        enabled: true,
        level: 'high',
        fpsTarget: 60,
        adaptiveQuality: true,
        particleEffects: true,
        animations: true,
        shadows: true,
        blur: true,
        reflections: true
      },
      debug: {
        enabled: false,
        showFPS: false,
        showPing: false,
        showMemory: false,
        showPosition: false,
        showPerformance: false,
        showNetwork: false,
        showRendering: false,
        showPhysics: false,
        showAudio: false,
        showAI: false
      }
    }
  }

  private initializeHUDData(): HUDData {
    return {
      health: 100,
      maxHealth: 100,
      armor: 50,
      maxArmor: 100,
      energy: 100,
      maxEnergy: 100,
      stamina: 100,
      maxStamina: 100,
      ammo: {
        current: 30,
        reserve: 120,
        max: 30,
        type: 'glxy_m4a1_elite'
      },
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      streak: 0,
      time: 0,
      round: 1,
      team: 'glxy',
      class: 'vanguard',
      level: 1,
      experience: 0,
      currency: 1000,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      status: 'alive',
      abilities: [],
      objectives: [],
      minimap: {
        enabled: true,
        zoom: 1.0,
        rotation: false,
        objects: []
      },
      crosshair: {
        enabled: true,
        style: 'dot',
        size: 2,
        color: '#00ff00',
        opacity: 0.8,
        dynamic: true,
        spread: true,
        hitMarker: true,
        hitMarkerDuration: 0.3
      }
    }
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      memoryUsage: 0,
      gpuTime: 0,
      cpuTime: 0,
      networkLatency: 0,
      packetLoss: 0,
      bandwidth: 0,
      serverTick: 0,
      clientTick: 0,
      interpolation: 0,
      extrapolation: 0,
      predictionError: 0
    }
  }

  private createLayers(): void {
    // Create main root element
    this.rootElement = document.createElement('div')
    this.rootElement.id = 'glxy-ui-root'
    this.rootElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `

    // Create individual layers
    this.hudLayer = this.createLayer('hud')
    this.menuLayer = this.createLayer('menu')
    this.dialogLayer = this.createLayer('dialog')
    this.notificationLayer = this.createLayer('notification')
    this.debugLayer = this.createLayer('debug')

    this.rootElement.appendChild(this.hudLayer)
    this.rootElement.appendChild(this.menuLayer)
    this.rootElement.appendChild(this.dialogLayer)
    this.rootElement.appendChild(this.notificationLayer)
    this.rootElement.appendChild(this.debugLayer)

    this.container.appendChild(this.rootElement)

    // Apply theme
    this.applyTheme(this.state.theme)
  }

  private createLayer(name: string): HTMLElement {
    const layer = document.createElement('div')
    layer.id = `glxy-ui-${name}-layer`
    layer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `
    return layer
  }

  public addEventListener(event: string, handler: Function): void {
    this.setupEventListener(event, handler)
  }

  private setupEventListener(event: string, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(handler)
  }

  private setupEventListeners(): void {
    // Window events
    window.addEventListener('resize', () => this.handleResize({} as DOMRectReadOnly))
    window.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    window.addEventListener('focus', this.handleFocus.bind(this))
    window.addEventListener('blur', this.handleBlur.bind(this))

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))

    // Mouse events
    window.addEventListener('mousemove', this.handleMouseMove.bind(this))
    window.addEventListener('mousedown', this.handleMouseDown.bind(this))
    window.addEventListener('mouseup', this.handleMouseUp.bind(this))
    window.addEventListener('wheel', this.handleWheel.bind(this))

    // Touch events
    window.addEventListener('touchstart', this.handleTouchStart.bind(this))
    window.addEventListener('touchmove', this.handleTouchMove.bind(this))
    window.addEventListener('touchend', this.handleTouchEnd.bind(this))

    // Game events
    this.setupEventListener('game:stateUpdate', this.handleGameStateUpdate.bind(this))
    this.setupEventListener('game:performanceUpdate', this.handlePerformanceUpdate.bind(this))
    this.setupEventListener('game:feedback', this.handleGameFeedback.bind(this))
  }

  private setupHotkeys(): void {
    // Toggle debug mode
    this.addHotkey('F1', () => {
      this.toggleDebugMode()
    })

    // Toggle HUD
    this.addHotkey('F2', () => {
      this.toggleHUD()
    })

    // Take screenshot
    this.addHotkey('F12', () => {
      this.takeScreenshot()
    })

    // Toggle fullscreen
    this.addHotkey('F11', () => {
      this.toggleFullscreen()
    })

    // Performance monitor
    this.addHotkey('F3', () => {
      this.togglePerformanceMonitor()
    })

    // Network stats
    this.addHotkey('F4', () => {
      this.toggleNetworkStats()
    })
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.handleResize(entry.contentRect)
      }
    })

    this.resizeObserver.observe(this.container)
  }

  private startAnimationLoop(): void {
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastUpdateTime

      if (deltaTime >= this.updateInterval) {
        this.update(deltaTime / 1000)
        this.lastUpdateTime = currentTime
      }

      this.animationFrame = requestAnimationFrame(animate)
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  public update(deltaTime: number): void {
    // Update HUD data
    this.updateHUDData(deltaTime)

    // Update performance metrics
    this.updatePerformanceMetrics(deltaTime)

    // Update components
    this.updateComponents(deltaTime)

    // Update animations
    this.updateAnimations(deltaTime)

    // Update feedback
    this.updateFeedback(deltaTime)

    // Update debug info
    if (this.state.debug.enabled) {
      this.updateDebugInfo(deltaTime)
    }
  }

  private updateHUDData(deltaTime: number): void {
    // Update time
    this.hudData.time += deltaTime

    // Update abilities cooldowns
    this.hudData.abilities.forEach(ability => {
      if (ability.cooldown > 0) {
        ability.cooldown = Math.max(0, ability.cooldown - deltaTime)
        ability.available = ability.cooldown === 0
      }
    })

    // Update objectives
    this.hudData.objectives.forEach(objective => {
      if (objective.timeLimit && !objective.completed) {
        objective.timeLimit = Math.max(0, objective.timeLimit - deltaTime)
      }
    })

    // Update minimap objects
    this.updateMinimapObjects()
  }

  private updatePerformanceMetrics(deltaTime: number): void {
    // Get performance data from renderer
    const info = this.renderer.info

    this.performanceMetrics.drawCalls = info.render.calls
    this.performanceMetrics.triangles = info.render.triangles
    this.performanceMetrics.textures = info.memory.textures

    // Calculate FPS
    this.performanceMetrics.fps = Math.round(1 / deltaTime)
    this.performanceMetrics.frameTime = deltaTime * 1000

    // Get memory usage if available
    if ((performance as any).memory) {
      this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize
    }
  }

  private updateComponents(deltaTime: number): void {
    this.state.components.forEach((component, id) => {
      if (component.visible) {
        this.updateComponent(component, deltaTime)
      }
    })
  }

  private updateComponent(component: UIComponent, deltaTime: number): void {
    const element = document.getElementById(`glxy-ui-component-${component.id}`)
    if (!element) return

    // Apply animations
    const animation = this.state.activeAnimations.get(component.id)
    if (animation && this.state.performance.animations) {
      this.applyAnimation(element, animation, deltaTime)
    }

    // Apply theme and accessibility
    this.applyComponentStyling(element, component)
  }

  private updateAnimations(deltaTime: number): void {
    this.state.activeAnimations.forEach((animation, id) => {
      animation.duration -= deltaTime

      if (animation.duration <= 0) {
        if (animation.loop) {
          animation.duration = animation.duration + (animation.delay || 0)
        } else {
          this.state.activeAnimations.delete(id)
        }
      }
    })
  }

  private updateFeedback(deltaTime: number): void {
    // Process feedback queue
    if (this.state.feedbackQueue.length > 0) {
      const feedback = this.state.feedbackQueue.shift()
      if (feedback) {
        this.showFeedback(feedback)
      }
    }

    // Update active feedback
    this.state.activeFeedback.forEach((feedback, id) => {
      feedback.duration -= deltaTime

      if (feedback.duration <= 0) {
        this.hideFeedback(id)
      }
    })
  }

  private updateDebugInfo(deltaTime: number): void {
    if (!this.state.debug.enabled) return

    let debugInfo = `
      FPS: ${this.performanceMetrics.fps}
      Frame Time: ${this.performanceMetrics.frameTime.toFixed(2)}ms
      Draw Calls: ${this.performanceMetrics.drawCalls}
      Triangles: ${this.performanceMetrics.triangles}
      Memory: ${(this.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
      Position: ${this.hudData.position.x.toFixed(2)}, ${this.hudData.position.y.toFixed(2)}, ${this.hudData.position.z.toFixed(2)}
      Velocity: ${this.hudData.velocity.length().toFixed(2)}
    `

    this.updateDebugDisplay(debugInfo)
  }

  private updateMinimapObjects(): void {
    // This would update minimap objects based on game state
    // For now, we'll keep the existing objects
  }

  public createHUD(): void {
    // Create main HUD components
    this.createHealthBar()
    this.createArmorBar()
    this.createEnergyBar()
    this.createStaminaBar()
    this.createAmmoDisplay()
    this.createCrosshair()
    this.createMinimap()
    this.createScoreDisplay()
    this.createKillFeed()
    this.createObjectiveTracker()
    this.createAbilityBar()
    this.createTimer()
    this.createTeamIndicator()
    this.createClassIndicator()
    this.createPerformanceIndicator()
  }

  private createHealthBar(): void {
    const healthBar = this.createComponent('health-bar', 'hud', 'bottom-left', {
      width: 200,
      height: 30
    })

    healthBar.element.innerHTML = `
      <div class="health-bar-container">
        <div class="health-bar-icon">
          <Heart size={16} color="#ff4444" />
        </div>
        <div class="health-bar-background">
          <div class="health-bar-fill" style="width: ${this.hudData.health}%"></div>
        </div>
        <div class="health-bar-text">${this.hudData.health}/${this.hudData.maxHealth}</div>
      </div>
    `

    healthBar.element.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ff4444;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(healthBar.element)
    this.state.components.set('health-bar', healthBar)
  }

  private createArmorBar(): void {
    const armorBar = this.createComponent('armor-bar', 'hud', 'bottom-left', {
      width: 200,
      height: 20
    })

    armorBar.element.innerHTML = `
      <div class="armor-bar-container">
        <div class="armor-bar-icon">
          <Shield size={14} color="#4444ff" />
        </div>
        <div class="armor-bar-background">
          <div class="armor-bar-fill" style="width: ${this.hudData.armor}%"></div>
        </div>
        <div class="armor-bar-text">${this.hudData.armor}/${this.hudData.maxArmor}</div>
      </div>
    `

    armorBar.element.style.cssText = `
      position: absolute;
      bottom: 55px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #4444ff;
      border-radius: 8px;
      padding: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(armorBar.element)
    this.state.components.set('armor-bar', armorBar)
  }

  private createEnergyBar(): void {
    const energyBar = this.createComponent('energy-bar', 'hud', 'bottom-right', {
      width: 180,
      height: 20
    })

    energyBar.element.innerHTML = `
      <div class="energy-bar-container">
        <div class="energy-bar-background">
          <div class="energy-bar-fill" style="width: ${this.hudData.energy}%"></div>
        </div>
        <div class="energy-bar-text">${Math.round(this.hudData.energy)}%</div>
        <div class="energy-bar-icon">
          <Zap size={14} color="#ffaa00" />
        </div>
      </div>
    `

    energyBar.element.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ffaa00;
      border-radius: 8px;
      padding: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(energyBar.element)
    this.state.components.set('energy-bar', energyBar)
  }

  private createStaminaBar(): void {
    const staminaBar = this.createComponent('stamina-bar', 'hud', 'bottom-right', {
      width: 180,
      height: 16
    })

    staminaBar.element.innerHTML = `
      <div class="stamina-bar-container">
        <div class="stamina-bar-background">
          <div class="stamina-bar-fill" style="width: ${this.hudData.stamina}%"></div>
        </div>
        <div class="stamina-bar-text">${Math.round(this.hudData.stamina)}%</div>
      </div>
    `

    staminaBar.element.style.cssText = `
      position: absolute;
      bottom: 45px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #00ff00;
      border-radius: 6px;
      padding: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(staminaBar.element)
    this.state.components.set('stamina-bar', staminaBar)
  }

  private createAmmoDisplay(): void {
    const ammoDisplay = this.createComponent('ammo-display', 'hud', 'bottom-center', {
      width: 120,
      height: 60
    })

    ammoDisplay.element.innerHTML = `
      <div class="ammo-display-container">
        <div class="ammo-current">${this.hudData.ammo.current}</div>
        <div class="ammo-separator">/</div>
        <div class="ammo-reserve">${this.hudData.ammo.reserve}</div>
        <div class="ammo-type">${this.hudData.ammo.type}</div>
      </div>
    `

    ammoDisplay.element.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #ff8800;
      border-radius: 10px;
      padding: 12px 20px;
      text-align: center;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(ammoDisplay.element)
    this.state.components.set('ammo-display', ammoDisplay)
  }

  private createCrosshair(): void {
    const crosshair = this.createComponent('crosshair', 'hud', 'center', {
      width: 50,
      height: 50
    })

    crosshair.element.innerHTML = `
      <div class="crosshair-container">
        <div class="crosshair-dot"></div>
        <div class="crosshair-lines">
          <div class="crosshair-line horizontal"></div>
          <div class="crosshair-line vertical"></div>
        </div>
      </div>
    `

    crosshair.element.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9999;
    `

    // Add CSS for crosshair styles
    const style = document.createElement('style')
    style.textContent = `
      .crosshair-container {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .crosshair-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 2px;
        height: 2px;
        background: ${this.hudData.crosshair.color};
        border-radius: 50%;
      }
      .crosshair-line {
        position: absolute;
        background: ${this.hudData.crosshair.color};
      }
      .crosshair-line.horizontal {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 1px;
      }
      .crosshair-line.vertical {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 1px;
        height: 20px;
      }
    `
    document.head.appendChild(style)

    this.hudLayer.appendChild(crosshair.element)
    this.state.components.set('crosshair', crosshair)
  }

  private createMinimap(): void {
    const minimap = this.createComponent('minimap', 'hud', 'top-right', {
      width: 200,
      height: 200
    })

    minimap.element.innerHTML = `
      <div class="minimap-container">
        <div class="minimap-background"></div>
        <div class="minimap-objects"></div>
        <div class="minimap-player"></div>
        <div class="minimap-border"></div>
      </div>
    `

    minimap.element.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #00ff00;
      border-radius: 10px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(minimap.element)
    this.state.components.set('minimap', minimap)
  }

  private createScoreDisplay(): void {
    const scoreDisplay = this.createComponent('score-display', 'hud', 'top-center', {
      width: 300,
      height: 60
    })

    scoreDisplay.element.innerHTML = `
      <div class="score-display-container">
        <div class="score-kills">${this.hudData.kills}</div>
        <div class="score-separator">/</div>
        <div class="score-deaths">${this.hudData.deaths}</div>
        <div class="score-score">${this.hudData.score}</div>
        <div class="score-streak">${this.hudData.streak > 0 ? `🔥 ${this.hudData.streak}` : ''}</div>
      </div>
    `

    scoreDisplay.element.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ffaa00;
      border-radius: 10px;
      padding: 12px 20px;
      text-align: center;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(scoreDisplay.element)
    this.state.components.set('score-display', scoreDisplay)
  }

  private createKillFeed(): void {
    const killFeed = this.createComponent('kill-feed', 'hud', 'top-right', {
      width: 300,
      height: 200
    })

    killFeed.element.innerHTML = `
      <div class="kill-feed-container">
        <div class="kill-feed-entries"></div>
      </div>
    `

    killFeed.element.style.cssText = `
      position: absolute;
      top: 230px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #666666;
      border-radius: 8px;
      padding: 8px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
      max-height: 200px;
      overflow-y: auto;
    `

    this.hudLayer.appendChild(killFeed.element)
    this.state.components.set('kill-feed', killFeed)
  }

  private createObjectiveTracker(): void {
    const objectiveTracker = this.createComponent('objective-tracker', 'hud', 'top-left', {
      width: 250,
      height: 100
    })

    objectiveTracker.element.innerHTML = `
      <div class="objective-tracker-container">
        <div class="objective-title">OBJECTIVES</div>
        <div class="objective-list"></div>
      </div>
    `

    objectiveTracker.element.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #00aaff;
      border-radius: 8px;
      padding: 12px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(objectiveTracker.element)
    this.state.components.set('objective-tracker', objectiveTracker)
  }

  private createAbilityBar(): void {
    const abilityBar = this.createComponent('ability-bar', 'hud', 'bottom-center', {
      width: 400,
      height: 80
    })

    abilityBar.element.innerHTML = `
      <div class="ability-bar-container">
        <div class="ability-slots"></div>
      </div>
    `

    abilityBar.element.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #aa00ff;
      border-radius: 10px;
      padding: 10px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
      display: flex;
      gap: 10px;
    `

    this.hudLayer.appendChild(abilityBar.element)
    this.state.components.set('ability-bar', abilityBar)
  }

  private createTimer(): void {
    const timer = this.createComponent('timer', 'hud', 'top-center', {
      width: 120,
      height: 40
    })

    timer.element.innerHTML = `
      <div class="timer-container">
        <div class="timer-display">${this.formatTime(this.hudData.time)}</div>
        <div class="timer-round">Round ${this.hudData.round}</div>
      </div>
    `

    timer.element.style.cssText = `
      position: absolute;
      top: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ffffff;
      border-radius: 8px;
      padding: 8px 16px;
      text-align: center;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(timer.element)
    this.state.components.set('timer', timer)
  }

  private createTeamIndicator(): void {
    const teamIndicator = this.createComponent('team-indicator', 'hud', 'top-left', {
      width: 150,
      height: 40
    })

    teamIndicator.element.innerHTML = `
      <div class="team-indicator-container">
        <div class="team-name">${this.hudData.team.toUpperCase()}</div>
        <div class="team-icon">👥</div>
      </div>
    `

    teamIndicator.element.style.cssText = `
      position: absolute;
      top: 130px;
      left: 20px;
      background: rgba(0, 100, 255, 0.8);
      border: 2px solid #0066ff;
      border-radius: 8px;
      padding: 8px 12px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(teamIndicator.element)
    this.state.components.set('team-indicator', teamIndicator)
  }

  private createClassIndicator(): void {
    const classIndicator = this.createComponent('class-indicator', 'hud', 'top-left', {
      width: 150,
      height: 40
    })

    classIndicator.element.innerHTML = `
      <div class="class-indicator-container">
        <div class="class-name">${this.hudData.class.toUpperCase()}</div>
        <div class="class-level">Lvl ${this.hudData.level}</div>
      </div>
    `

    classIndicator.element.style.cssText = `
      position: absolute;
      top: 180px;
      left: 20px;
      background: rgba(255, 100, 0, 0.8);
      border: 2px solid #ff6400;
      border-radius: 8px;
      padding: 8px 12px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `

    this.hudLayer.appendChild(classIndicator.element)
    this.state.components.set('class-indicator', classIndicator)
  }

  private createPerformanceIndicator(): void {
    const performanceIndicator = this.createComponent('performance-indicator', 'hud', 'top-right', {
      width: 100,
      height: 30
    })

    performanceIndicator.element.innerHTML = `
      <div class="performance-indicator-container">
        <div class="fps-display">${this.performanceMetrics.fps} FPS</div>
        <div class="ping-display">${this.performanceMetrics.networkLatency}ms</div>
      </div>
    `

    performanceIndicator.element.style.cssText = `
      position: absolute;
      top: 230px;
      right: 230px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #666666;
      border-radius: 6px;
      padding: 6px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
      font-size: 12px;
    `

    this.hudLayer.appendChild(performanceIndicator.element)
    this.state.components.set('performance-indicator', performanceIndicator)
  }

  private createComponent(id: string, type: UIComponent['type'], position: UIComponent['position'], size: UIComponent['size']): UIComponent & { element: HTMLElement } {
    const component: UIComponent & { element: HTMLElement } = {
      id,
      type,
      position,
      size,
      visible: true,
      animated: false,
      interactive: false,
      priority: 0,
      theme: this.state.theme,
      opacity: 1,
      blur: false,
      scale: 1,
      rotation: 0,
      element: document.createElement('div')
    }

    component.element.id = `glxy-ui-component-${id}`
    component.element.style.cssText = `
      position: absolute;
      width: ${size.width}px;
      height: ${size.height}px;
      opacity: ${component.opacity};
      transform: scale(${component.scale}) rotate(${component.rotation}deg);
      pointer-events: ${component.interactive ? 'auto' : 'none'};
    `

    return component
  }

  public addFeedback(feedback: UIFeedback): void {
    this.state.feedbackQueue.push(feedback)
  }

  private showFeedback(feedback: UIFeedback): void {
    const id = `feedback-${Date.now()}-${Math.random()}`
    this.state.activeFeedback.set(id, feedback)

    const feedbackElement = document.createElement('div')
    feedbackElement.id = id
    feedbackElement.className = `feedback feedback-${feedback.type}`
    feedbackElement.innerHTML = `
      <div class="feedback-content">
        ${feedback.visual?.icon ? `<div class="feedback-icon">${feedback.visual.icon}</div>` : ''}
        <div class="feedback-message">${feedback.message}</div>
      </div>
    `

    feedbackElement.style.cssText = `
      position: absolute;
      top: ${feedback.visual?.position.y || 50}px;
      left: ${feedback.visual?.position.x || 50}px;
      background: ${feedback.visual?.color || '#000000'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
      pointer-events: none;
    `

    this.notificationLayer.appendChild(feedbackElement)

    // Play sound if specified
    if (feedback.sound) {
      this.playSound(feedback.sound)
    }

    // Apply haptic feedback if specified
    if (feedback.haptic && navigator.vibrate) {
      navigator.vibrate(100)
    }

    // Apply animation
    if (feedback.visual?.animation) {
      this.applyAnimation(feedbackElement, feedback.visual.animation, 0)
    }
  }

  private hideFeedback(id: string): void {
    const feedback = this.state.activeFeedback.get(id)
    if (!feedback) return

    const element = document.getElementById(id)
    if (element) {
      element.style.animation = 'fadeOut 0.3s ease-in'
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      }, 300)
    }

    this.state.activeFeedback.delete(id)
  }

  public showNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.addFeedback({
      type: 'info',
      message: `${title}: ${message}`,
      duration: 5000,
      priority: 1,
      visual: {
        color: type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : type === 'success' ? '#00ff00' : '#0088ff',
        icon: type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️',
        animation: {
          type: 'slide',
          duration: 0.5,
          delay: 0,
          easing: 'ease-out',
          direction: 'down',
          loop: false,
          reverse: false,
          intensity: 1
        },
        position: { x: 50, y: 20 },
        size: { width: 300, height: 80 }
      },
      persistent: false,
      stackable: true,
      maxStack: 3
    })
  }

  public showAchievement(achievement: { name: string; description: string; icon: string }): void {
    this.addFeedback({
      type: 'achievement',
      message: `${achievement.name}: ${achievement.description}`,
      duration: 8000,
      priority: 2,
      sound: 'achievement_unlock',
      haptic: true,
      visual: {
        color: '#ffaa00',
        icon: achievement.icon,
        animation: {
          type: 'bounce',
          duration: 0.8,
          delay: 0,
          easing: 'ease-out',
          direction: 'up',
          loop: false,
          reverse: false,
          intensity: 1.5
        },
        position: { x: 50, y: 50 },
        size: { width: 400, height: 100 }
      },
      persistent: false,
      stackable: false,
      maxStack: 1
    })
  }

  public showKillFeedback(kill: { victim: string; weapon: string; headshot: boolean; distance: number }): void {
    const message = `Eliminated ${kill.victim} with ${kill.weapon}${kill.headshot ? ' (HEADSHOT)' : ''} at ${Math.round(kill.distance)}m`

    this.addFeedback({
      type: 'kill',
      message,
      duration: 3000,
      priority: 1,
      sound: kill.headshot ? 'headshot' : 'kill',
      haptic: true,
      visual: {
        color: kill.headshot ? '#ff0000' : '#ff8800',
        icon: kill.headshot ? '🎯' : '💀',
        animation: {
          type: 'scale',
          duration: 0.3,
          delay: 0,
          easing: 'ease-out',
          direction: 'center',
          loop: false,
          reverse: false,
          intensity: 1.2
        },
        position: { x: 50, y: 30 },
        size: { width: 350, height: 60 }
      },
      persistent: false,
      stackable: true,
      maxStack: 5
    })
  }

  private applyAnimation(element: HTMLElement, animation: UIAnimation, deltaTime: number): void {
    // Apply animation based on type
    switch (animation.type) {
      case 'fade':
        this.applyFadeAnimation(element, animation, deltaTime)
        break
      case 'slide':
        this.applySlideAnimation(element, animation, deltaTime)
        break
      case 'scale':
        this.applyScaleAnimation(element, animation, deltaTime)
        break
      case 'rotate':
        this.applyRotateAnimation(element, animation, deltaTime)
        break
      case 'bounce':
        this.applyBounceAnimation(element, animation, deltaTime)
        break
      case 'pulse':
        this.applyPulseAnimation(element, animation, deltaTime)
        break
    }
  }

  private applyFadeAnimation(element: HTMLElement, animation: UIAnimation, deltaTime: number): void {
    const progress = 1 - (animation.duration / (animation.duration + deltaTime))
    element.style.opacity = progress.toString()
  }

  private applySlideAnimation(element: HTMLElement, animation: UIAnimation, deltaTime: number): void {
    const progress = 1 - (animation.duration / (animation.duration + deltaTime))
    const distance = 100 * animation.intensity

    let transform = ''
    switch (animation.direction) {
      case 'up':
        transform = `translateY(${distance * (1 - progress)}px)`
        break
      case 'down':
        transform = `translateY(-${distance * (1 - progress)}px)`
        break
      case 'left':
        transform = `translateX(${distance * (1 - progress)}px)`
        break
      case 'right':
        transform = `translateX(-${distance * (1 - progress)}px)`
        break
    }

    element.style.transform = transform
  }

  private applyScaleAnimation(element: HTMLElement, animation: UIAnimation, deltaTime: number): void {
    const progress = 1 - (animation.duration / (animation.duration + deltaTime))
    const scale = 0.5 + (0.5 * progress * animation.intensity)
    element.style.transform = `scale(${scale})`
  }

  private applyRotateAnimation(element: HTMLElement, animation: UIAnimation, deltaTime: number): void {
    const progress = 1 - (animation.duration / (animation.duration + deltaTime))
    const rotation = 360 * progress * animation.intensity
    element.style.transform = `rotate(${rotation}deg)`
  }

  private applyBounceAnimation(element: HTMLElement, animation: UIAnimation, deltaTime: number): void {
    const progress = 1 - (animation.duration / (animation.duration + deltaTime))
    const bounce = Math.sin(progress * Math.PI) * 20 * animation.intensity
    element.style.transform = `translateY(${bounce}px)`
  }

  private applyPulseAnimation(element: HTMLElement, animation: UIAnimation, deltaTime: number): void {
    const progress = 1 - (animation.duration / (animation.duration + deltaTime))
    const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1 * animation.intensity
    element.style.transform = `scale(${scale})`
  }

  private applyComponentStyling(element: HTMLElement, component: UIComponent): void {
    // Apply theme styling
    element.className = `glxy-ui-component glxy-ui-${component.theme}`

    // Apply accessibility settings
    if (this.state.accessibility.highContrast) {
      element.classList.add('high-contrast')
    }

    if (this.state.accessibility.largeText) {
      element.classList.add('large-text')
    }

    if (this.state.accessibility.colorBlindMode !== 'none') {
      element.classList.add(`colorblind-${this.state.accessibility.colorBlindMode}`)
    }

    // Apply performance settings
    if (!this.state.performance.animations) {
      element.style.transition = 'none'
    }

    if (!this.state.performance.blur) {
      element.style.backdropFilter = 'none'
    }
  }

  private applyTheme(theme: string): void {
    this.rootElement.className = `glxy-ui-root glxy-ui-theme-${theme}`

    // Apply theme-specific CSS variables
    const themes = {
      default: {
        primary: '#ff8800',
        secondary: '#0088ff',
        background: 'rgba(0, 0, 0, 0.8)',
        text: '#ffffff',
        border: '#666666'
      },
      glxy: {
        primary: '#ff6b35',
        secondary: '#00d4ff',
        background: 'rgba(0, 0, 0, 0.9)',
        text: '#ffffff',
        border: '#ff6b35'
      },
      cyberpunk: {
        primary: '#00ff00',
        secondary: '#ff00ff',
        background: 'rgba(0, 0, 0, 0.95)',
        text: '#00ff00',
        border: '#00ff00'
      },
      military: {
        primary: '#8b7355',
        secondary: '#4a5f4a',
        background: 'rgba(0, 0, 0, 0.85)',
        text: '#d4af37',
        border: '#8b7355'
      },
      minimal: {
        primary: '#333333',
        secondary: '#666666',
        background: 'rgba(255, 255, 255, 0.1)',
        text: '#ffffff',
        border: '#333333'
      }
    }

    const selectedTheme = themes[theme as keyof typeof themes] || themes.default

    Object.entries(selectedTheme).forEach(([key, value]) => {
      this.rootElement.style.setProperty(`--glxy-ui-${key}`, value)
    })
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  private playSound(soundName: string): void {
    // This would play the specified sound
    console.log(`Playing sound: ${soundName}`)
  }

  private updateDebugDisplay(info: string): void {
    let debugDisplay = document.getElementById('glxy-debug-display')

    if (!debugDisplay) {
      debugDisplay = document.createElement('div')
      debugDisplay.id = 'glxy-debug-display'
      debugDisplay.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border: 1px solid #00ff00;
        border-radius: 4px;
        z-index: 10001;
        white-space: pre-line;
        pointer-events: none;
      `
      this.debugLayer.appendChild(debugDisplay)
    }

    debugDisplay.textContent = info
  }

  // Event handlers
  private handleResize(contentRect: DOMRectReadOnly): void {
    // Handle resize
    this.updateLayout()
  }

  private handleVisibilityChange(): void {
    // Handle visibility change
    if (document.hidden) {
      this.pauseAnimations()
    } else {
      this.resumeAnimations()
    }
  }

  private handleFocus(): void {
    // Handle focus
  }

  private handleBlur(): void {
    // Handle blur
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Handle keydown
    const hotkey = this.hotkeys.get(event.code)
    if (hotkey) {
      hotkey(event)
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Handle keyup
  }

  private handleMouseMove(event: MouseEvent): void {
    // Handle mouse move
  }

  private handleMouseDown(event: MouseEvent): void {
    // Handle mouse down
  }

  private handleMouseUp(event: MouseEvent): void {
    // Handle mouse up
  }

  private handleWheel(event: WheelEvent): void {
    // Handle wheel
  }

  private handleTouchStart(event: TouchEvent): void {
    // Handle touch start
  }

  private handleTouchMove(event: TouchEvent): void {
    // Handle touch move
  }

  private handleTouchEnd(event: TouchEvent): void {
    // Handle touch end
  }

  private handleGameStateUpdate(event: CustomEvent): void {
    // Handle game state update
    const data = event.detail
    this.updateHUDDataFromGameState(data)
  }

  private handlePerformanceUpdate(event: CustomEvent): void {
    // Handle performance update
    const data = event.detail
    this.updatePerformanceMetricsFromData(data)
  }

  private handleGameFeedback(event: CustomEvent): void {
    // Handle game feedback
    const feedback = event.detail
    this.addFeedback(feedback)
  }

  private updateHUDDataFromGameState(data: any): void {
    // Update HUD data from game state
    Object.assign(this.hudData, data)
  }

  private updatePerformanceMetricsFromData(data: any): void {
    // Update performance metrics from data
    Object.assign(this.performanceMetrics, data)
  }

  private updateLayout(): void {
    // Update layout based on container size
    const { width, height } = this.container.getBoundingClientRect()

    // Update scale for responsive design
    const scale = Math.min(width / 1920, height / 1080)
    this.state.scale = scale

    this.rootElement.style.transform = `scale(${scale})`
  }

  private pauseAnimations(): void {
    // Pause all animations
    this.state.components.forEach(component => {
      component.animated = false
    })
  }

  private resumeAnimations(): void {
    // Resume all animations
    this.state.components.forEach(component => {
      component.animated = true
    })
  }

  // Public API methods

  public removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  public addHotkey(key: string, callback: Function): void {
    this.hotkeys.set(key, callback)
  }

  public removeHotkey(key: string): void {
    this.hotkeys.delete(key)
  }

  public toggleDebugMode(): void {
    this.state.debug.enabled = !this.state.debug.enabled
    this.showNotification('Debug Mode', this.state.debug.enabled ? 'Enabled' : 'Disabled', 'info')
  }

  public toggleHUD(): void {
    const hudVisible = !this.hudLayer.style.display || this.hudLayer.style.display !== 'none'
    this.hudLayer.style.display = hudVisible ? 'none' : 'block'
    this.showNotification('HUD', hudVisible ? 'Hidden' : 'Shown', 'info')
  }

  public togglePerformanceMonitor(): void {
    this.state.debug.showPerformance = !this.state.debug.showPerformance
    this.showNotification('Performance Monitor', this.state.debug.showPerformance ? 'Enabled' : 'Disabled', 'info')
  }

  public toggleNetworkStats(): void {
    this.state.debug.showNetwork = !this.state.debug.showNetwork
    this.showNotification('Network Stats', this.state.debug.showNetwork ? 'Enabled' : 'Disabled', 'info')
  }

  public takeScreenshot(): void {
    // Take screenshot
    this.canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `glxy-screenshot-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)

        this.showNotification('Screenshot', 'Saved successfully', 'success')
      }
    })
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  public setTheme(theme: 'default' | 'dark' | 'light' | 'cyberpunk' | 'military' | 'minimal' | 'glxy'): void {
    this.state.theme = theme
    this.applyTheme(theme)
  }

  public setScale(scale: number): void {
    this.state.scale = Math.max(0.5, Math.min(2, scale))
    this.updateLayout()
  }

  public setAccessibility(setting: keyof UIState['accessibility'], value: boolean | string): void {
    if (setting === 'colorBlindMode') {
      this.state.accessibility[setting] = value as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    } else {
      this.state.accessibility[setting] = value as boolean
    }
    this.updateAccessibility()
  }

  private updateAccessibility(): void {
    // Update accessibility settings
    this.rootElement.className = `glxy-ui-root glxy-ui-theme-${this.state.theme}`

    if (this.state.accessibility.highContrast) {
      this.rootElement.classList.add('high-contrast')
    }

    if (this.state.accessibility.largeText) {
      this.rootElement.classList.add('large-text')
    }

    if (this.state.accessibility.reducedMotion) {
      this.rootElement.classList.add('reduced-motion')
    }
  }

  public setPerformance(level: UIState['performance']['level']): void {
    this.state.performance.level = level

    // Apply performance settings based on level
    switch (level) {
      case 'low':
        this.state.performance.particleEffects = false
        this.state.performance.animations = false
        this.state.performance.shadows = false
        this.state.performance.blur = false
        this.state.performance.reflections = false
        break
      case 'medium':
        this.state.performance.particleEffects = true
        this.state.performance.animations = true
        this.state.performance.shadows = false
        this.state.performance.blur = false
        this.state.performance.reflections = false
        break
      case 'high':
        this.state.performance.particleEffects = true
        this.state.performance.animations = true
        this.state.performance.shadows = true
        this.state.performance.blur = true
        this.state.performance.reflections = false
        break
      case 'ultra':
        this.state.performance.particleEffects = true
        this.state.performance.animations = true
        this.state.performance.shadows = true
        this.state.performance.blur = true
        this.state.performance.reflections = true
        break
    }
  }

  public getHUDData(): HUDData {
    return { ...this.hudData }
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  public getState(): UIState {
    return { ...this.state }
  }

  public dispose(): void {
    // Clean up
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    this.resizeObserver.disconnect()
    this.eventListeners.clear()
    this.hotkeys.clear()
    this.tooltips.clear()

    // Remove elements
    if (this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement)
    }

    console.log('🗑️ GLXY Ultimate UI: Disposed')
  }
}

export default GLXYUltimateUI