// @ts-nocheck
/**
 * GLXY Mobile Optimization System - Phase 2 Implementation
 * Advanced Touch Controls, Gyroscope Support, and Mobile Performance
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Maximize2,
  Minimize2,
  Settings,
  Battery,
  Zap,
  Wifi,
  WifiOff,
  Smartphone,
  Gamepad2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  RotateCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

// Mobile Device Detection
export interface DeviceCapabilities {
  isMobile: boolean
  isTablet: boolean
  hasTouch: boolean
  hasGyroscope: boolean
  hasAccelerometer: boolean
  devicePixelRatio: number
  maxTouchPoints: number
  userAgent: string
  platform: string
  memory: number
  cores: number
  batteryLevel?: number
  isCharging?: boolean
  connectionType?: string
}

// Touch Control Configuration
export interface TouchControlsConfig {
  enabled: boolean
  sensitivity: number
  deadzone: number
  vibration: boolean
  hapticFeedback: boolean
  autoHide: boolean
  hideDelay: number
  opacity: number
  size: 'small' | 'medium' | 'large'
  layout: 'default' | 'legacy' | 'minimal'
  leftHanded: boolean
}

// Gyroscope Configuration
export interface GyroscopeConfig {
  enabled: boolean
  sensitivity: number
  deadzone: number
  smoothing: number
  invertAxes: { x: boolean; y: boolean }
  calibration: { x: number; y: number; z: number }
  autoCalibrate: boolean
}

// Performance Settings
export interface MobilePerformanceSettings {
  quality: 'auto' | 'low' | 'medium' | 'high' | 'ultra'
  targetFPS: 30 | 60 | 90 | 120
  adaptiveQuality: boolean
  batterySaver: boolean
  reduceEffects: boolean
  lodDistance: number
  shadowQuality: 'off' | 'low' | 'medium' | 'high'
  particleCount: 'minimal' | 'low' | 'medium' | 'high'
  renderScale: number
  anisotropicFiltering: boolean
}

// Mobile Game State
export interface MobileGameState {
  isActive: boolean
  orientation: 'portrait' | 'landscape'
  viewport: { width: number; height: number }
  safeArea: { top: number; right: number; bottom: number; left: number }
  isFullscreen: boolean
  performance: {
    currentFPS: number
    averageFPS: number
    frameTime: number
    memoryUsage: number
    batteryDrain: number
    thermalState: 'nominal' | 'fair' | 'serious' | 'critical'
  }
}

export class GLXYMobileOptimizer {
  private deviceCapabilities!: DeviceCapabilities
  private touchControlsConfig!: TouchControlsConfig
  private gyroscopeConfig!: GyroscopeConfig
  private performanceSettings!: MobilePerformanceSettings
  private mobileGameState!: MobileGameState

  // Touch controls
  private touchJoysticks: Map<string, HTMLDivElement> = new Map()
  private touchButtons: Map<string, HTMLDivElement> = new Map()
  private touchZones: Map<string, HTMLDivElement> = new Map()
  private activeTouches: Map<number, Touch> = new Map()
  private gestureState: any = {}

  // Gyroscope
  private gyroscopeActive = false
  private gyroscopeData = { x: 0, y: 0, z: 0 }
  private accelerometerData = { x: 0, y: 0, z: 0 }

  // Performance monitoring
  private performanceMonitor: any = null
  private frameTimeHistory: number[] = []
  private lastFrameTime = 0

  // Event handlers
  private eventListeners: Map<string, EventListener> = new Map()

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities()
    this.initializeDefaultConfigs()
    this.mobileGameState = this.initializeMobileGameState()

    console.log('GLXY Mobile Optimizer initialized:', this.deviceCapabilities)
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const hasGyroscope = 'DeviceOrientationEvent' in window
    const hasAccelerometer = 'DeviceMotionEvent' in window

    return {
      isMobile,
      isTablet,
      hasTouch,
      hasGyroscope,
      hasAccelerometer,
      devicePixelRatio: window.devicePixelRatio || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      memory: (navigator as any).deviceMemory || 4,
      cores: navigator.hardwareConcurrency || 4,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    }
  }

  private initializeDefaultConfigs(): void {
    this.touchControlsConfig = {
      enabled: this.deviceCapabilities.hasTouch,
      sensitivity: 50,
      deadzone: 15,
      vibration: 'vibrate' in navigator,
      hapticFeedback: true,
      autoHide: true,
      hideDelay: 3000,
      opacity: 80,
      size: this.deviceCapabilities.isTablet ? 'large' : 'medium',
      layout: 'default',
      leftHanded: false
    }

    this.gyroscopeConfig = {
      enabled: this.deviceCapabilities.hasGyroscope,
      sensitivity: 50,
      deadzone: 5,
      smoothing: 0.8,
      invertAxes: { x: false, y: false },
      calibration: { x: 0, y: 0, z: 0 },
      autoCalibrate: true
    }

    // Auto-adjust performance based on device capabilities
    const baseQuality = this.deviceCapabilities.memory > 4 ? 'high' :
                       this.deviceCapabilities.memory > 2 ? 'medium' : 'low'

    this.performanceSettings = {
      quality: baseQuality as any,
      targetFPS: this.deviceCapabilities.cores > 4 ? 60 : 30,
      adaptiveQuality: true,
      batterySaver: false,
      reduceEffects: this.deviceCapabilities.memory < 4,
      lodDistance: this.deviceCapabilities.memory > 4 ? 100 : 50,
      shadowQuality: this.deviceCapabilities.memory > 4 ? 'medium' : 'low',
      particleCount: this.deviceCapabilities.memory > 4 ? 'medium' : 'low',
      renderScale: this.deviceCapabilities.devicePixelRatio > 2 ? 0.8 : 1,
      anisotropicFiltering: this.deviceCapabilities.memory > 4
    }
  }

  private initializeMobileGameState(): MobileGameState {
    return {
      isActive: false,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      viewport: { width: window.innerWidth, height: window.innerHeight },
      safeArea: this.getSafeAreaInsets(),
      isFullscreen: document.fullscreenElement !== null,
      performance: {
        currentFPS: 60,
        averageFPS: 60,
        frameTime: 16.67,
        memoryUsage: 0,
        batteryDrain: 0,
        thermalState: 'nominal'
      }
    }
  }

  private getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('safe-area-inset-left') || '0')
    }
  }

  // Public API Methods
  public async initialize(): Promise<void> {
    if (!this.deviceCapabilities.isMobile) {
      console.log('Not a mobile device, skipping mobile optimization')
      return
    }

    this.mobileGameState.isActive = true
    this.setupEventListeners()
    this.createTouchControls()
    this.initializeGyroscope()
    this.startPerformanceMonitoring()

    // Request permissions for iOS 13+
    if (this.deviceCapabilities.hasGyroscope && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        await (DeviceOrientationEvent as any).requestPermission()
        await (DeviceMotionEvent as any).requestPermission()
        console.log('Device motion permissions granted')
      } catch (error) {
        console.warn('Could not request device motion permissions:', error)
      }
    }

    console.log('GLXY Mobile Optimizer initialized successfully')
  }

  private setupEventListeners(): void {
    // Touch events
    const touchStart = this.handleTouchStart.bind(this)
    const touchMove = this.handleTouchMove.bind(this)
    const touchEnd = this.handleTouchEnd.bind(this)
    const touchCancel = this.handleTouchCancel.bind(this)

    document.addEventListener('touchstart', touchStart, { passive: false })
    document.addEventListener('touchmove', touchMove, { passive: false })
    document.addEventListener('touchend', touchEnd, { passive: false })
    document.addEventListener('touchcancel', touchCancel, { passive: false })

    this.eventListeners.set('touchstart', touchStart as EventListener)
    this.eventListeners.set('touchmove', touchMove as EventListener)
    this.eventListeners.set('touchend', touchEnd as EventListener)
    this.eventListeners.set('touchcancel', touchCancel as EventListener)

    // Orientation change
    const orientationChange = this.handleOrientationChange.bind(this)
    window.addEventListener('orientationchange', orientationChange)
    window.addEventListener('resize', orientationChange)

    this.eventListeners.set('orientationchange', orientationChange)
    this.eventListeners.set('resize', orientationChange)

    // Device orientation (gyroscope)
    if (this.deviceCapabilities.hasGyroscope) {
      const deviceOrientation = this.handleDeviceOrientation.bind(this)
      window.addEventListener('deviceorientation', deviceOrientation)

      this.eventListeners.set('deviceorientation', deviceOrientation as EventListener)
    }

    // Device motion (accelerometer)
    if (this.deviceCapabilities.hasAccelerometer) {
      const deviceMotion = this.handleDeviceMotion.bind(this)
      window.addEventListener('devicemotion', deviceMotion)

      this.eventListeners.set('devicemotion', deviceMotion as EventListener)
    }

    // Visibility change (pause/resume)
    const visibilityChange = this.handleVisibilityChange.bind(this)
    document.addEventListener('visibilitychange', visibilityChange)

    this.eventListeners.set('visibilitychange', visibilityChange)

    // Battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const batteryChange = () => this.updateBatteryStatus(battery)
        battery.addEventListener('levelchange', batteryChange)
        battery.addEventListener('chargingchange', batteryChange)
        this.updateBatteryStatus(battery)
      })
    }
  }

  private createTouchControls(): void {
    if (!this.touchControlsConfig.enabled) return

    this.createVirtualJoystick('move', { x: 100, y: window.innerHeight - 150 })
    this.createVirtualJoystick('look', { x: window.innerWidth - 150, y: window.innerHeight - 150 })
    this.createTouchButtons()
  }

  private createVirtualJoystick(id: string, position: { x: number; y: number }): void {
    const joystick = document.createElement('div')
    joystick.id = `joystick-${id}`
    joystick.style.position = 'fixed'
    joystick.style.left = `${position.x}px`
    joystick.style.top = `${position.y}px`
    joystick.style.width = '120px'
    joystick.style.height = '120px'
    joystick.style.borderRadius = '50%'
    joystick.style.background = 'rgba(255, 255, 255, 0.1)'
    joystick.style.border = '2px solid rgba(255, 255, 255, 0.3)'
    joystick.style.touchAction = 'none'
    joystick.style.zIndex = '1000'
    joystick.style.opacity = `${this.touchControlsConfig.opacity / 100}`

    const knob = document.createElement('div')
    knob.style.position = 'absolute'
    knob.style.width = '40px'
    knob.style.height = '40px'
    knob.style.borderRadius = '50%'
    knob.style.background = 'rgba(255, 255, 255, 0.8)'
    knob.style.left = '40px'
    knob.style.top = '40px'
    knob.style.transition = 'none'

    joystick.appendChild(knob)
    document.body.appendChild(joystick)

    this.touchJoysticks.set(id, joystick)
  }

  private createTouchButtons(): void {
    const buttonConfigs = [
      { id: 'fire', x: window.innerWidth - 100, y: window.innerHeight - 250, size: 60, icon: '🔫' },
      { id: 'jump', x: window.innerWidth - 100, y: window.innerHeight - 350, size: 50, icon: '⬆️' },
      { id: 'crouch', x: window.innerWidth - 100, y: window.innerHeight - 450, size: 50, icon: '⬇️' },
      { id: 'reload', x: 100, y: window.innerHeight - 250, size: 50, icon: '🔄' },
      { id: 'switch', x: 180, y: window.innerHeight - 250, size: 50, icon: '🔀' }
    ]

    buttonConfigs.forEach(config => {
      const button = document.createElement('div')
      button.id = `button-${config.id}`
      button.style.position = 'fixed'
      button.style.left = `${config.x}px`
      button.style.top = `${config.y}px`
      button.style.width = `${config.size}px`
      button.style.height = `${config.size}px`
      button.style.borderRadius = '50%'
      button.style.background = 'rgba(255, 255, 255, 0.2)'
      button.style.border = '2px solid rgba(255, 255, 255, 0.4)'
      button.style.display = 'flex'
      button.style.alignItems = 'center'
      button.style.justifyContent = 'center'
      button.style.fontSize = `${config.size * 0.4}px`
      button.style.touchAction = 'none'
      button.style.zIndex = '1000'
      button.style.opacity = `${this.touchControlsConfig.opacity / 100}`
      button.textContent = config.icon

      document.body.appendChild(button)
      this.touchButtons.set(config.id, button)
    })
  }

  private async initializeGyroscope(): Promise<void> {
    if (!this.gyroscopeConfig.enabled || !this.deviceCapabilities.hasGyroscope) {
      return
    }

    try {
      // Calibrate gyroscope
      if (this.gyroscopeConfig.autoCalibrate) {
        await this.calibrateGyroscope()
      }

      this.gyroscopeActive = true
      console.log('Gyroscope initialized successfully')
    } catch (error) {
      console.warn('Failed to initialize gyroscope:', error)
      this.gyroscopeConfig.enabled = false
    }
  }

  public async calibrateGyroscope(): Promise<void> {
    return new Promise((resolve) => {
      let samples = 0
      const calibrationData = { x: 0, y: 0, z: 0 }
      const maxSamples = 100

      const calibrate = (event: DeviceOrientationEvent) => {
        if (event.beta !== null && event.gamma !== null) {
          calibrationData.x += event.gamma
          calibrationData.y += event.beta
          calibrationData.z += event.alpha || 0
          samples++

          if (samples >= maxSamples) {
            window.removeEventListener('deviceorientation', calibrate)

            this.gyroscopeConfig.calibration = {
              x: calibrationData.x / samples,
              y: calibrationData.y / samples,
              z: calibrationData.z / samples
            }

            console.log('Gyroscope calibrated:', this.gyroscopeConfig.calibration)
            resolve()
          }
        }
      }

      window.addEventListener('deviceorientation', calibrate)
    })
  }

  private startPerformanceMonitoring(): void {
    this.performanceMonitor = setInterval(() => {
      const currentTime = performance.now()
      const frameTime = currentTime - this.lastFrameTime
      this.lastFrameTime = currentTime

      if (frameTime > 0) {
        const fps = 1000 / frameTime
        this.frameTimeHistory.push(frameTime)

        if (this.frameTimeHistory.length > 60) {
          this.frameTimeHistory.shift()
        }

        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length

        this.mobileGameState.performance = {
          currentFPS: Math.round(fps),
          averageFPS: Math.round(1000 / avgFrameTime),
          frameTime: Math.round(frameTime * 100) / 100,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          batteryDrain: 0, // Calculate based on battery level over time
          thermalState: 'nominal' // Get from performance API if available
        }

        // Adaptive quality adjustment
        if (this.performanceSettings.adaptiveQuality) {
          this.adjustQualityBasedOnPerformance(fps)
        }
      }
    }, 1000)
  }

  private adjustQualityBasedOnPerformance(currentFPS: number): void {
    const targetFPS = this.performanceSettings.targetFPS
    const threshold = targetFPS * 0.8

    if (currentFPS < threshold) {
      // Reduce quality
      if (this.performanceSettings.quality === 'ultra') {
        this.performanceSettings.quality = 'high'
      } else if (this.performanceSettings.quality === 'high') {
        this.performanceSettings.quality = 'medium'
      } else if (this.performanceSettings.quality === 'medium') {
        this.performanceSettings.quality = 'low'
      }
    } else if (currentFPS > targetFPS * 1.2) {
      // Increase quality
      if (this.performanceSettings.quality === 'low') {
        this.performanceSettings.quality = 'medium'
      } else if (this.performanceSettings.quality === 'medium') {
        this.performanceSettings.quality = 'high'
      }
    }
  }

  // Touch Event Handlers
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault()

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      this.activeTouches.set(touch.identifier, touch)

      // Handle different touch zones
      const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement

      if (element?.id.startsWith('joystick-')) {
        this.handleJoystickTouch(touch, 'start')
      } else if (element?.id.startsWith('button-')) {
        this.handleButtonTouch(touch, 'start')
      } else {
        this.handleScreenTouch(touch, 'start')
      }
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault()

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      this.activeTouches.set(touch.identifier, touch)

      const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement

      if (element?.id.startsWith('joystick-')) {
        this.handleJoystickTouch(touch, 'move')
      } else if (element?.id.startsWith('button-')) {
        this.handleButtonTouch(touch, 'move')
      } else {
        this.handleScreenTouch(touch, 'move')
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault()

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      this.activeTouches.delete(touch.identifier)

      const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement

      if (element?.id.startsWith('joystick-')) {
        this.handleJoystickTouch(touch, 'end')
      } else if (element?.id.startsWith('button-')) {
        this.handleButtonTouch(touch, 'end')
      } else {
        this.handleScreenTouch(touch, 'end')
      }
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    this.handleTouchEnd(event)
  }

  private handleJoystickTouch(touch: Touch, action: 'start' | 'move' | 'end'): void {
    const joystickElement = touch.target as HTMLElement
    const joystickId = joystickElement.id.replace('joystick-', '')
    const joystick = this.touchJoysticks.get(joystickId)

    if (!joystick) return

    const rect = joystick.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    if (action === 'start' || action === 'move') {
      const deltaX = touch.clientX - centerX
      const deltaY = touch.clientY - centerY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDistance = rect.width / 2 - 20

      let x = deltaX
      let y = deltaY

      if (distance > maxDistance) {
        x = (deltaX / distance) * maxDistance
        y = (deltaY / distance) * maxDistance
      }

      const knob = joystick.querySelector('div') as HTMLElement
      if (knob) {
        knob.style.transform = `translate(${x + 20}px, ${y + 20}px)`
      }

      // Convert to game input (-1 to 1)
      const normalizedX = x / maxDistance
      const normalizedY = y / maxDistance

      this.emitJoystickInput(joystickId, normalizedX, normalizedY)
    } else if (action === 'end') {
      const knob = joystick.querySelector('div') as HTMLElement
      if (knob) {
        knob.style.transform = 'translate(40px, 40px)'
      }

      this.emitJoystickInput(joystickId, 0, 0)
    }
  }

  private handleButtonTouch(touch: Touch, action: 'start' | 'move' | 'end'): void {
    const buttonElement = touch.target as HTMLElement
    const buttonId = buttonElement.id.replace('button-', '')

    if (action === 'start' || action === 'move') {
      buttonElement.style.background = 'rgba(255, 255, 255, 0.4)'
      this.emitButtonInput(buttonId, true)

      // Haptic feedback
      if (this.touchControlsConfig.hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
    } else if (action === 'end') {
      buttonElement.style.background = 'rgba(255, 255, 255, 0.2)'
      this.emitButtonInput(buttonId, false)
    }
  }

  private handleScreenTouch(touch: Touch, action: 'start' | 'move' | 'end'): void {
    // Handle gestures for camera control, firing, etc.
    if (action === 'start') {
      this.gestureState.startTouch = touch
      this.gestureState.startTime = Date.now()
    } else if (action === 'move') {
      if (this.gestureState.startTouch) {
        const deltaX = touch.clientX - this.gestureState.startTouch.clientX
        const deltaY = touch.clientY - this.gestureState.startTouch.clientY

        // Emit camera movement if not using gyroscope
        if (!this.gyroscopeActive) {
          this.emitCameraMovement(deltaX * 0.1, deltaY * 0.1)
        }
      }
    } else if (action === 'end') {
      const duration = Date.now() - this.gestureState.startTime

      // Detect tap gesture
      if (duration < 200) {
        this.emitTapGesture(touch.clientX, touch.clientY)
      }

      this.gestureState = {}
    }
  }

  // Device Orientation Handlers
  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    if (!this.gyroscopeActive || event.beta === null || event.gamma === null) return

    // Apply calibration and smoothing
    const rawX = event.gamma - this.gyroscopeConfig.calibration.x
    const rawY = event.beta - this.gyroscopeConfig.calibration.y

    // Apply inversion if configured
    const x = this.gyroscopeConfig.invertAxes.x ? -rawX : rawX
    const y = this.gyroscopeConfig.invertAxes.y ? -rawY : rawY

    // Apply smoothing
    this.gyroscopeData.x = this.gyroscopeData.x * this.gyroscopeConfig.smoothing +
                           x * (1 - this.gyroscopeConfig.smoothing)
    this.gyroscopeData.y = this.gyroscopeData.y * this.gyroscopeConfig.smoothing +
                           y * (1 - this.gyroscopeConfig.smoothing)

    // Apply deadzone
    if (Math.abs(this.gyroscopeData.x) < this.gyroscopeConfig.deadzone) {
      this.gyroscopeData.x = 0
    }
    if (Math.abs(this.gyroscopeData.y) < this.gyroscopeConfig.deadzone) {
      this.gyroscopeData.y = 0
    }

    // Apply sensitivity and emit
    const sensitivity = this.gyroscopeConfig.sensitivity / 50
    this.emitGyroscopeInput(
      this.gyroscopeData.x * sensitivity,
      this.gyroscopeData.y * sensitivity
    )
  }

  private handleDeviceMotion(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) return

    this.accelerometerData = {
      x: event.accelerationIncludingGravity.x || 0,
      y: event.accelerationIncludingGravity.y || 0,
      z: event.accelerationIncludingGravity.z || 0
    }

    // Use for device shake detection, etc.
  }

  private handleOrientationChange(): void {
    this.mobileGameState.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    this.mobileGameState.viewport = { width: window.innerWidth, height: window.innerHeight }
    this.mobileGameState.safeArea = this.getSafeAreaInsets()

    // Reposition touch controls
    this.repositionTouchControls()
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Pause game when tab is not visible
      this.pause()
    } else {
      // Resume game when tab becomes visible
      this.resume()
    }
  }

  private updateBatteryStatus(battery: any): void {
    this.deviceCapabilities.batteryLevel = battery.level
    this.deviceCapabilities.isCharging = battery.charging

    // Enable battery saver if battery is low
    if (battery.level < 0.2 && !battery.charging) {
      this.enableBatterySaver()
    }
  }

  private repositionTouchControls(): void {
    // Update positions based on new orientation
    const moveJoystick = this.touchJoysticks.get('move')
    const lookJoystick = this.touchJoysticks.get('look')

    if (moveJoystick) {
      moveJoystick.style.left = '100px'
      moveJoystick.style.top = `${window.innerHeight - 150}px`
    }

    if (lookJoystick) {
      lookJoystick.style.left = `${window.innerWidth - 150}px`
      lookJoystick.style.top = `${window.innerHeight - 150}px`
    }

    // Reposition buttons
    this.touchButtons.forEach((button, id) => {
      // Update button positions based on orientation
      // This would be more sophisticated in a real implementation
    })
  }

  private enableBatterySaver(): void {
    this.performanceSettings.batterySaver = true
    this.performanceSettings.targetFPS = 30
    this.performanceSettings.quality = 'low'
    this.performanceSettings.reduceEffects = true
    this.performanceSettings.shadowQuality = 'off'
    this.performanceSettings.particleCount = 'minimal'
  }

  // Input Emitters (these would connect to the game engine)
  private emitJoystickInput(joystickId: string, x: number, y: number): void {
    // Emit to game engine
    const event = new CustomEvent('joystickInput', {
      detail: { joystickId, x, y }
    })
    document.dispatchEvent(event)
  }

  private emitButtonInput(buttonId: string, pressed: boolean): void {
    // Emit to game engine
    const event = new CustomEvent('buttonInput', {
      detail: { buttonId, pressed }
    })
    document.dispatchEvent(event)
  }

  private emitCameraMovement(deltaX: number, deltaY: number): void {
    // Emit to game engine
    const event = new CustomEvent('cameraMovement', {
      detail: { deltaX, deltaY }
    })
    document.dispatchEvent(event)
  }

  private emitTapGesture(x: number, y: number): void {
    // Emit to game engine
    const event = new CustomEvent('tapGesture', {
      detail: { x, y }
    })
    document.dispatchEvent(event)
  }

  private emitGyroscopeInput(x: number, y: number): void {
    // Emit to game engine
    const event = new CustomEvent('gyroscopeInput', {
      detail: { x, y }
    })
    document.dispatchEvent(event)
  }

  // Public Control Methods
  public pause(): void {
    // Stop performance monitoring
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor)
      this.performanceMonitor = null
    }

    // Disable gyroscope
    this.gyroscopeActive = false

    // Hide touch controls
    this.touchJoysticks.forEach(joystick => {
      joystick.style.display = 'none'
    })
    this.touchButtons.forEach(button => {
      button.style.display = 'none'
    })
  }

  public resume(): void {
    // Restart performance monitoring
    this.startPerformanceMonitoring()

    // Re-enable gyroscope
    if (this.gyroscopeConfig.enabled) {
      this.gyroscopeActive = true
    }

    // Show touch controls
    this.touchJoysticks.forEach(joystick => {
      joystick.style.display = 'block'
    })
    this.touchButtons.forEach(button => {
      button.style.display = 'block'
    })
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      this.mobileGameState.isFullscreen = true
    } else {
      document.exitFullscreen()
      this.mobileGameState.isFullscreen = false
    }
  }

  // Getters
  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities }
  }

  public getTouchControlsConfig(): TouchControlsConfig {
    return { ...this.touchControlsConfig }
  }

  public getGyroscopeConfig(): GyroscopeConfig {
    return { ...this.gyroscopeConfig }
  }

  public getPerformanceSettings(): MobilePerformanceSettings {
    return { ...this.performanceSettings }
  }

  public getMobileGameState(): MobileGameState {
    return { ...this.mobileGameState }
  }

  // Setters
  public updateTouchControlsConfig(config: Partial<TouchControlsConfig>): void {
    this.touchControlsConfig = { ...this.touchControlsConfig, ...config }
  }

  public updateGyroscopeConfig(config: Partial<GyroscopeConfig>): void {
    this.gyroscopeConfig = { ...this.gyroscopeConfig, ...config }
  }

  public updatePerformanceSettings(settings: Partial<MobilePerformanceSettings>): void {
    this.performanceSettings = { ...this.performanceSettings, ...settings }
  }

  // Cleanup
  public destroy(): void {
    // Remove event listeners
    this.eventListeners.forEach((listener, event) => {
      if (event === 'resize' || event === 'orientationchange') {
        window.removeEventListener(event, listener)
      } else {
        document.removeEventListener(event, listener)
      }
    })

    // Remove touch controls
    this.touchJoysticks.forEach(joystick => {
      document.body.removeChild(joystick)
    })
    this.touchButtons.forEach(button => {
      document.body.removeChild(button)
    })

    // Clear performance monitor
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor)
    }

    // Clear maps
    this.touchJoysticks.clear()
    this.touchButtons.clear()
    this.touchZones.clear()
    this.activeTouches.clear()
    this.eventListeners.clear()

    this.mobileGameState.isActive = false
  }
}

// React Hook for Mobile Optimization
export function useGLXYMobileOptimizer() {
  const [optimizer, setOptimizer] = useState<GLXYMobileOptimizer | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const mobileOptimizer = new GLXYMobileOptimizer()
    setOptimizer(mobileOptimizer)

    mobileOptimizer.initialize().then(() => {
      setIsInitialized(true)
    }).catch(console.error)

    return () => {
      mobileOptimizer.destroy()
    }
  }, [])

  return { optimizer, isInitialized }
}

// Mobile Settings UI Component
export function GLXYMobileSettings({ optimizer }: { optimizer: GLXYMobileOptimizer | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [touchConfig, setTouchConfig] = useState<TouchControlsConfig | null>(null)
  const [gyroConfig, setGyroConfig] = useState<GyroscopeConfig | null>(null)
  const [perfSettings, setPerfSettings] = useState<MobilePerformanceSettings | null>(null)
  const [deviceCaps, setDeviceCaps] = useState<DeviceCapabilities | null>(null)

  useEffect(() => {
    if (optimizer) {
      setTouchConfig(optimizer.getTouchControlsConfig())
      setGyroConfig(optimizer.getGyroscopeConfig())
      setPerfSettings(optimizer.getPerformanceSettings())
      setDeviceCaps(optimizer.getDeviceCapabilities())
    }
  }, [optimizer])

  const updateTouchConfig = (updates: Partial<TouchControlsConfig>) => {
    if (optimizer && touchConfig) {
      const newConfig = { ...touchConfig, ...updates }
      setTouchConfig(newConfig)
      optimizer.updateTouchControlsConfig(updates)
    }
  }

  const updateGyroConfig = (updates: Partial<GyroscopeConfig>) => {
    if (optimizer && gyroConfig) {
      const newConfig = { ...gyroConfig, ...updates }
      setGyroConfig(newConfig)
      optimizer.updateGyroscopeConfig(updates)
    }
  }

  const updatePerfSettings = (updates: Partial<MobilePerformanceSettings>) => {
    if (optimizer && perfSettings) {
      const newSettings = { ...perfSettings, ...updates }
      setPerfSettings(newSettings)
      optimizer.updatePerformanceSettings(updates)
    }
  }

  if (!optimizer || !touchConfig || !gyroConfig || !perfSettings || !deviceCaps) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Smartphone className="h-4 w-4 mr-2" />
          Mobile Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            GLXY Mobile Optimization
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Device Type:</span>
                <span className="font-mono">
                  {deviceCaps.isTablet ? 'Tablet' : deviceCaps.isMobile ? 'Mobile' : 'Desktop'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Touch Support:</span>
                <span className={deviceCaps.hasTouch ? 'text-green-500' : 'text-red-500'}>
                  {deviceCaps.hasTouch ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gyroscope:</span>
                <span className={deviceCaps.hasGyroscope ? 'text-green-500' : 'text-red-500'}>
                  {deviceCaps.hasGyroscope ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="font-mono">{deviceCaps.memory} GB</span>
              </div>
              <div className="flex justify-between">
                <span>CPU Cores:</span>
                <span className="font-mono">{deviceCaps.cores}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className="font-mono">{deviceCaps.connectionType}</span>
              </div>
            </CardContent>
          </Card>

          {/* Touch Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Touch Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Touch Controls</Label>
                <Switch
                  checked={touchConfig.enabled}
                  onCheckedChange={(enabled) => updateTouchConfig({ enabled })}
                />
              </div>

              <div className="space-y-2">
                <Label>Sensitivity: {touchConfig.sensitivity}</Label>
                <Slider
                  value={[touchConfig.sensitivity]}
                  onValueChange={([sensitivity]) => updateTouchConfig({ sensitivity })}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Deadzone: {touchConfig.deadzone}</Label>
                <Slider
                  value={[touchConfig.deadzone]}
                  onValueChange={([deadzone]) => updateTouchConfig({ deadzone })}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Haptic Feedback</Label>
                <Switch
                  checked={touchConfig.hapticFeedback}
                  onCheckedChange={(hapticFeedback) => updateTouchConfig({ hapticFeedback })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Auto-hide Controls</Label>
                <Switch
                  checked={touchConfig.autoHide}
                  onCheckedChange={(autoHide) => updateTouchConfig({ autoHide })}
                />
              </div>

              <div className="space-y-2">
                <Label>Control Size</Label>
                <Select
                  value={touchConfig.size}
                  onValueChange={(size: any) => updateTouchConfig({ size })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Gyroscope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gyroscope Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Gyroscope</Label>
                <Switch
                  checked={gyroConfig.enabled}
                  onCheckedChange={(enabled) => updateGyroConfig({ enabled })}
                />
              </div>

              <div className="space-y-2">
                <Label>Sensitivity: {gyroConfig.sensitivity}</Label>
                <Slider
                  value={[gyroConfig.sensitivity]}
                  onValueChange={([sensitivity]) => updateGyroConfig({ sensitivity })}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Deadzone: {gyroConfig.deadzone}</Label>
                <Slider
                  value={[gyroConfig.deadzone]}
                  onValueChange={([deadzone]) => updateGyroConfig({ deadzone })}
                  min={0}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Smoothing: {gyroConfig.smoothing}</Label>
                <Slider
                  value={[gyroConfig.smoothing]}
                  onValueChange={([smoothing]) => updateGyroConfig({ smoothing })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Auto-calibrate</Label>
                <Switch
                  checked={gyroConfig.autoCalibrate}
                  onCheckedChange={(autoCalibrate) => updateGyroConfig({ autoCalibrate })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Graphics Quality</Label>
                <Select
                  value={perfSettings.quality}
                  onValueChange={(quality: any) => updatePerfSettings({ quality })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="ultra">Ultra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target FPS</Label>
                <Select
                  value={perfSettings.targetFPS.toString()}
                  onValueChange={(value) => updatePerfSettings({ targetFPS: parseInt(value) as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 FPS</SelectItem>
                    <SelectItem value="60">60 FPS</SelectItem>
                    <SelectItem value="90">90 FPS</SelectItem>
                    <SelectItem value="120">120 FPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Adaptive Quality</Label>
                <Switch
                  checked={perfSettings.adaptiveQuality}
                  onCheckedChange={(adaptiveQuality) => updatePerfSettings({ adaptiveQuality })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Battery Saver</Label>
                <Switch
                  checked={perfSettings.batterySaver}
                  onCheckedChange={(batterySaver) => updatePerfSettings({ batterySaver })}
                />
              </div>

              <div className="space-y-2">
                <Label>Shadow Quality</Label>
                <Select
                  value={perfSettings.shadowQuality}
                  onValueChange={(shadowQuality: any) => updatePerfSettings({ shadowQuality })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Particle Count</Label>
                <Select
                  value={perfSettings.particleCount}
                  onValueChange={(particleCount: any) => updatePerfSettings({ particleCount })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mt-6">
          <Button onClick={() => optimizer.toggleFullscreen()}>
            {optimizer.getMobileGameState().isFullscreen ? (
              <Minimize2 className="h-4 w-4 mr-2" />
            ) : (
              <Maximize2 className="h-4 w-4 mr-2" />
            )}
            {optimizer.getMobileGameState().isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>

          <Button variant="outline" onClick={() => optimizer.calibrateGyroscope()}>
            <RotateCw className="h-4 w-4 mr-2" />
            Recalibrate Gyroscope
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GLXYMobileOptimizer