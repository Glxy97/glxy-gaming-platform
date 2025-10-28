// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Target,
  Crosshair,
  Zap,
  Shield,
  Heart,
  Trophy,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Maximize,
  RotateCw,
  Move,
  Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

// 3D Vector and Matrix utilities
class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  static add(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z)
  }

  static subtract(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z)
  }

  static multiply(v: Vector3, scalar: number): Vector3 {
    return new Vector3(v.x * scalar, v.y * scalar, v.z * scalar)
  }

  static normalize(v: Vector3): Vector3 {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    if (length === 0) return new Vector3()
    return new Vector3(v.x / length, v.y / length, v.z / length)
  }

  static distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

// 3D Camera class
class Camera {
  position: Vector3
  rotation: { yaw: number; pitch: number }
  fov: number

  constructor() {
    this.position = new Vector3(0, 1.6, 0) // Eye level
    this.rotation = { yaw: 0, pitch: 0 }
    this.fov = 90
  }

  getForwardVector(): Vector3 {
    const yawRad = (this.rotation.yaw * Math.PI) / 180
    const pitchRad = (this.rotation.pitch * Math.PI) / 180

    return new Vector3(
      Math.sin(yawRad) * Math.cos(pitchRad),
      -Math.sin(pitchRad),
      Math.cos(yawRad) * Math.cos(pitchRad)
    )
  }

  getRightVector(): Vector3 {
    const yawRad = (this.rotation.yaw * Math.PI) / 180
    return new Vector3(Math.cos(yawRad), 0, -Math.sin(yawRad))
  }
}

// 3D GameObject
interface GameObject {
  id: string
  position: Vector3
  rotation: Vector3
  scale: Vector3
  type: 'enemy' | 'pickup' | 'wall' | 'projectile' | 'particle'
  health?: number
  maxHealth?: number
  isAlive?: boolean
  color: string
  size: number
}

// Enhanced Enemy AI
interface Enemy extends GameObject {
  type: 'enemy'
  aiType: 'aggressive' | 'defensive' | 'sniper' | 'berserker'
  speed: number
  damage: number
  attackCooldown: number
  lastAttack: number
  pathfinding: Vector3[]
  state: 'idle' | 'searching' | 'attacking' | 'taking_cover' | 'dead'
  alertLevel: number
  lastSeenPlayer: Vector3 | null
}

// Advanced Weapon System
interface Weapon {
  id: string
  name: string
  type: 'assault' | 'sniper' | 'shotgun' | 'pistol' | 'explosive'
  damage: number
  ammo: number
  maxAmmo: number
  fireRate: number // shots per second
  accuracy: number
  range: number
  reloadTime: number
  penetration: number
  recoil: { horizontal: number; vertical: number }
  icon: string
  sound: string
  muzzleFlash: boolean
  tracers: boolean
}

// Particle System
interface Particle {
  position: Vector3
  velocity: Vector3
  color: string
  life: number
  maxLife: number
  size: number
  gravity: boolean
}

// Game Settings
interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare'
  sensitivity: number
  fov: number
  graphics: 'low' | 'medium' | 'high' | 'ultra'
  antiAliasing: boolean
  shadows: boolean
  particles: boolean
  soundEnabled: boolean
  musicVolume: number
  sfxVolume: number
  showFPS: boolean
  crosshairType: 'dot' | 'cross' | 'circle' | 'custom'
  hudOpacity: number
  autoReload: boolean
  mouseInvert: boolean
}

// Game Statistics
interface GameStats {
  score: number
  kills: number
  headshots: number
  accuracy: number
  shotsFired: number
  shotsHit: number
  damageDealt: number
  damageTaken: number
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  level: number
  experience: number
  wave: number
  timeAlive: number
  streak: number
  bestStreak: number
}

const defaultSettings: GameSettings = {
  difficulty: 'medium',
  sensitivity: 50,
  fov: 90,
  graphics: 'high',
  antiAliasing: true,
  shadows: true,
  particles: true,
  soundEnabled: true,
  musicVolume: 70,
  sfxVolume: 80,
  showFPS: true,
  crosshairType: 'cross',
  hudOpacity: 80,
  autoReload: true,
  mouseInvert: false
}

const weapons: Weapon[] = [
  {
    id: 'assault_rifle',
    name: 'AK-74 Assault Rifle',
    type: 'assault',
    damage: 32,
    ammo: 30,
    maxAmmo: 30,
    fireRate: 10,
    accuracy: 85,
    range: 150,
    reloadTime: 2.5,
    penetration: 0.3,
    recoil: { horizontal: 0.8, vertical: 1.2 },
    icon: '🔫',
    sound: 'rifle_shot',
    muzzleFlash: true,
    tracers: true
  },
  {
    id: 'sniper_rifle',
    name: 'Barrett M82 Sniper',
    type: 'sniper',
    damage: 120,
    ammo: 5,
    maxAmmo: 5,
    fireRate: 1,
    accuracy: 98,
    range: 300,
    reloadTime: 3.5,
    penetration: 0.8,
    recoil: { horizontal: 0.2, vertical: 3.0 },
    icon: '🎯',
    sound: 'sniper_shot',
    muzzleFlash: true,
    tracers: false
  },
  {
    id: 'shotgun',
    name: 'SPAS-12 Shotgun',
    type: 'shotgun',
    damage: 80,
    ammo: 8,
    maxAmmo: 8,
    fireRate: 2,
    accuracy: 60,
    range: 50,
    reloadTime: 4.0,
    penetration: 0.1,
    recoil: { horizontal: 1.5, vertical: 2.0 },
    icon: '💥',
    sound: 'shotgun_blast',
    muzzleFlash: true,
    tracers: false
  },
  {
    id: 'pistol',
    name: 'Desert Eagle',
    type: 'pistol',
    damage: 45,
    ammo: 12,
    maxAmmo: 12,
    fireRate: 4,
    accuracy: 75,
    range: 80,
    reloadTime: 1.8,
    penetration: 0.2,
    recoil: { horizontal: 0.6, vertical: 1.0 },
    icon: '🔫',
    sound: 'pistol_shot',
    muzzleFlash: true,
    tracers: false
  }
]

export function Advanced3DFPS() {
  // Game State
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'game_over'>('menu')
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    headshots: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    damageDealt: 0,
    damageTaken: 0,
    health: 100,
    maxHealth: 100,
    armor: 0,
    maxArmor: 100,
    level: 1,
    experience: 0,
    wave: 1,
    timeAlive: 0,
    streak: 0,
    bestStreak: 0
  })

  // 3D Engine State
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const camera = useRef(new Camera())
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [projectiles, setProjectiles] = useState<GameObject[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [currentWeapon, setCurrentWeapon] = useState<Weapon>(weapons[0])
  const [isReloading, setIsReloading] = useState(false)
  const [muzzleFlash, setMuzzleFlash] = useState(false)
  const [lastShotTime, setLastShotTime] = useState(0)

  // Input State
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMouseLocked, setIsMouseLocked] = useState(false)

  // Performance monitoring
  const [fps, setFps] = useState(60)
  const lastFrameTime = useRef(performance.now())
  const frameCount = useRef(0)

  // 3D Rendering Engine
  const render3D = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas

    // Clear canvas with gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f172a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw ground plane with perspective grid
    ctx.save()
    ctx.translate(width / 2, height * 0.7)

    // Perspective grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.lineWidth = 1

    for (let i = -10; i <= 10; i++) {
      const perspective = 1 / (1 + Math.abs(i) * 0.1)
      const y = i * 30 * perspective
      const lineWidth = 200 * perspective

      ctx.beginPath()
      ctx.moveTo(-lineWidth, y)
      ctx.lineTo(lineWidth, y)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(i * 30, -200)
      ctx.lineTo(i * 30 * perspective, 200)
      ctx.stroke()
    }

    ctx.restore()

    // Draw 3D objects (enemies, projectiles, etc.)
    enemies.forEach(enemy => {
      if (!enemy.isAlive) return

      // Calculate screen position from 3D position
      const screenPos = project3DToScreen(enemy.position, camera.current, width, height)
      if (!screenPos) return

      const { x, y, z } = screenPos
      const size = Math.max(10, enemy.size / z * 100) // Perspective scaling

      // Draw enemy with 3D effect
      ctx.save()
      ctx.translate(x, y)

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(-size/2 + 2, -size/2 + 2, size, size)

      // Main body
      ctx.fillStyle = enemy.color
      ctx.fillRect(-size/2, -size/2, size, size)

      // Health bar
      if (enemy.health && enemy.maxHealth) {
        const healthPercent = enemy.health / enemy.maxHealth
        const barWidth = size
        const barHeight = 4

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillRect(-barWidth/2, -size/2 - 10, barWidth, barHeight)

        ctx.fillStyle = healthPercent > 0.6 ? '#10b981' : healthPercent > 0.3 ? '#f59e0b' : '#ef4444'
        ctx.fillRect(-barWidth/2, -size/2 - 10, barWidth * healthPercent, barHeight)
      }

      // AI state indicator
      const stateColor = {
        idle: '#6b7280',
        searching: '#f59e0b',
        attacking: '#ef4444',
        taking_cover: '#3b82f6',
        dead: '#374151'
      }[enemy.state]

      ctx.fillStyle = stateColor
      ctx.beginPath()
      ctx.arc(size/2 - 5, -size/2 + 5, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })

    // Draw projectiles with trails
    projectiles.forEach(projectile => {
      const screenPos = project3DToScreen(projectile.position, camera.current, width, height)
      if (!screenPos) return

      const { x, y, z } = screenPos
      const size = Math.max(2, projectile.size / z * 50)

      ctx.save()
      ctx.translate(x, y)

      // Projectile trail
      ctx.strokeStyle = projectile.color
      ctx.lineWidth = size
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-10, 0) // Trail effect
      ctx.stroke()

      // Projectile core
      ctx.fillStyle = projectile.color
      ctx.beginPath()
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })

    // Draw particles
    particles.forEach(particle => {
      const screenPos = project3DToScreen(particle.position, camera.current, width, height)
      if (!screenPos) return

      const { x, y, z } = screenPos
      const alpha = particle.life / particle.maxLife
      const size = particle.size / z * 20

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

  }, [enemies, projectiles, particles])

  // Project 3D coordinates to 2D screen coordinates
  const project3DToScreen = (worldPos: Vector3, camera: Camera, screenWidth: number, screenHeight: number) => {
    // Simple perspective projection
    const relativePos = Vector3.subtract(worldPos, camera.position)

    // Rotate by camera rotation
    const yawRad = (camera.rotation.yaw * Math.PI) / 180
    const pitchRad = (camera.rotation.pitch * Math.PI) / 180

    // Apply yaw rotation
    const rotatedX = relativePos.x * Math.cos(yawRad) - relativePos.z * Math.sin(yawRad)
    const rotatedZ = relativePos.x * Math.sin(yawRad) + relativePos.z * Math.cos(yawRad)
    const rotatedY = relativePos.y

    // Apply pitch rotation
    const finalY = rotatedY * Math.cos(pitchRad) - rotatedZ * Math.sin(pitchRad)
    const finalZ = rotatedY * Math.sin(pitchRad) + rotatedZ * Math.cos(pitchRad)

    // Perspective projection
    if (finalZ <= 0.1) return null // Behind camera

    const fovScale = Math.tan((camera.fov * Math.PI) / 360)
    const projectedX = (rotatedX / finalZ) / fovScale
    const projectedY = (finalY / finalZ) / fovScale

    return {
      x: screenWidth / 2 + projectedX * screenWidth / 2,
      y: screenHeight / 2 - projectedY * screenHeight / 2,
      z: finalZ
    }
  }

  // Crosshair component
  const renderCrosshair = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas
    const centerX = width / 2
    const centerY = height / 2
    const size = 20

    ctx.save()
    ctx.strokeStyle = muzzleFlash ? '#ff6b35' : '#00ff88'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.8

    switch (settings.crosshairType) {
      case 'cross':
        ctx.beginPath()
        ctx.moveTo(centerX - size, centerY)
        ctx.lineTo(centerX + size, centerY)
        ctx.moveTo(centerX, centerY - size)
        ctx.lineTo(centerX, centerY + size)
        ctx.stroke()
        break

      case 'dot':
        ctx.fillStyle = ctx.strokeStyle
        ctx.beginPath()
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'circle':
        ctx.beginPath()
        ctx.arc(centerX, centerY, size, 0, Math.PI * 2)
        ctx.stroke()
        break
    }

    ctx.restore()
  }

  // HUD rendering
  const renderHUD = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas

    ctx.save()
    ctx.globalAlpha = settings.hudOpacity / 100

    // Health bar
    const healthBarWidth = 200
    const healthBarHeight = 20
    const healthX = 20
    const healthY = height - 80

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(healthX - 5, healthY - 5, healthBarWidth + 10, healthBarHeight + 10)

    const healthPercent = stats.health / stats.maxHealth
    ctx.fillStyle = healthPercent > 0.6 ? '#10b981' : healthPercent > 0.3 ? '#f59e0b' : '#ef4444'
    ctx.fillRect(healthX, healthY, healthBarWidth * healthPercent, healthBarHeight)

    ctx.fillStyle = 'white'
    ctx.font = '14px monospace'
    ctx.fillText(`Health: ${stats.health}/${stats.maxHealth}`, healthX, healthY - 10)

    // Armor bar
    if (stats.armor > 0) {
      const armorY = healthY - 35
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(healthX - 5, armorY - 5, healthBarWidth + 10, healthBarHeight + 10)

      const armorPercent = stats.armor / stats.maxArmor
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(healthX, armorY, healthBarWidth * armorPercent, healthBarHeight)

      ctx.fillStyle = 'white'
      ctx.fillText(`Armor: ${stats.armor}/${stats.maxArmor}`, healthX, armorY - 10)
    }

    // Weapon info
    const weaponX = width - 250
    const weaponY = height - 80

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(weaponX - 10, weaponY - 40, 240, 70)

    ctx.fillStyle = 'white'
    ctx.font = '18px monospace'
    ctx.fillText(currentWeapon.name, weaponX, weaponY - 20)

    ctx.font = '24px monospace'
    ctx.fillText(`${currentWeapon.ammo} / ${currentWeapon.maxAmmo}`, weaponX, weaponY)

    if (isReloading) {
      ctx.fillStyle = '#f59e0b'
      ctx.fillText('RELOADING...', weaponX, weaponY + 20)
    }

    // Score and stats
    const statsX = 20
    const statsY = 50

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(statsX - 10, statsY - 30, 200, 120)

    ctx.fillStyle = 'white'
    ctx.font = '16px monospace'
    ctx.fillText(`Score: ${stats.score.toLocaleString()}`, statsX, statsY)
    ctx.fillText(`Kills: ${stats.kills}`, statsX, statsY + 20)
    ctx.fillText(`Wave: ${stats.wave}`, statsX, statsY + 40)
    ctx.fillText(`Accuracy: ${stats.accuracy.toFixed(1)}%`, statsX, statsY + 60)

    if (stats.streak > 1) {
      ctx.fillStyle = '#ff6b35'
      ctx.font = 'bold 18px monospace'
      ctx.fillText(`${stats.streak}x STREAK!`, statsX, statsY + 80)
    }

    // FPS counter
    if (settings.showFPS) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(width - 80, 10, 70, 30)

      ctx.fillStyle = fps < 30 ? '#ef4444' : fps < 50 ? '#f59e0b' : '#10b981'
      ctx.font = '16px monospace'
      ctx.fillText(`FPS: ${fps}`, width - 75, 30)
    }

    // Mini-map
    const minimapSize = 120
    const minimapX = width - minimapSize - 20
    const minimapY = 20

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize)

    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize)

    // Player position on minimap
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(minimapX + minimapSize / 2, minimapY + minimapSize / 2, 3, 0, Math.PI * 2)
    ctx.fill()

    // Enemies on minimap
    enemies.forEach(enemy => {
      if (!enemy.isAlive) return

      const relativeX = (enemy.position.x - camera.current.position.x) / 50
      const relativeZ = (enemy.position.z - camera.current.position.z) / 50

      const mapX = minimapX + minimapSize / 2 + relativeX * minimapSize / 4
      const mapY = minimapY + minimapSize / 2 + relativeZ * minimapSize / 4

      if (mapX >= minimapX && mapX <= minimapX + minimapSize &&
          mapY >= minimapY && mapY <= minimapY + minimapSize) {
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(mapX, mapY, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    ctx.restore()
  }

  // Main game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Update FPS
    const currentTime = performance.now()
    frameCount.current++
    if (currentTime - lastFrameTime.current >= 1000) {
      setFps(Math.round((frameCount.current * 1000) / (currentTime - lastFrameTime.current)))
      frameCount.current = 0
      lastFrameTime.current = currentTime
    }

    // Clear muzzle flash
    if (muzzleFlash && currentTime - lastShotTime > 100) {
      setMuzzleFlash(false)
    }

    // Render 3D scene
    render3D(ctx, canvas)

    // Render crosshair
    renderCrosshair(ctx, canvas)

    // Render HUD
    renderHUD(ctx, canvas)

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [render3D, muzzleFlash, lastShotTime, fps, stats, currentWeapon, isReloading, settings, enemies])

  // Initialize game
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoop()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Handle mouse lock
  const requestPointerLock = () => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.requestPointerLock()
    }
  }

  // Spawn enemies
  const spawnEnemies = useCallback(() => {
    const newEnemies: Enemy[] = []
    const enemyCount = Math.min(5 + stats.wave, 20)

    for (let i = 0; i < enemyCount; i++) {
      const angle = (i / enemyCount) * Math.PI * 2
      const distance = 20 + Math.random() * 30

      const enemy: Enemy = {
        id: `enemy-${i}-${Date.now()}`,
        position: new Vector3(
          Math.cos(angle) * distance,
          0,
          Math.sin(angle) * distance
        ),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        type: 'enemy',
        health: 100 + stats.wave * 20,
        maxHealth: 100 + stats.wave * 20,
        isAlive: true,
        color: '#ef4444',
        size: 1,
        aiType: ['aggressive', 'defensive', 'sniper', 'berserker'][Math.floor(Math.random() * 4)] as any,
        speed: 2 + Math.random() * 2,
        damage: 20 + stats.wave * 5,
        attackCooldown: 1000 + Math.random() * 1000,
        lastAttack: 0,
        pathfinding: [],
        state: 'idle',
        alertLevel: 0,
        lastSeenPlayer: null
      }

      newEnemies.push(enemy)
    }

    setEnemies(newEnemies)
  }, [stats.wave])

  // Start game
  const startGame = () => {
    setGameState('playing')
    setStats(prev => ({ ...prev, health: 100, armor: 0, wave: 1, timeAlive: 0 }))
    spawnEnemies()
    requestPointerLock()
  }

  // Settings panel
  const SettingsPanel = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {/* Graphics Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Graphics</h3>

            <div className="space-y-2">
              <Label>Graphics Quality</Label>
              <Select value={settings.graphics} onValueChange={(value: any) =>
                setSettings(prev => ({ ...prev, graphics: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Field of View: {settings.fov}°</Label>
              <Slider
                value={[settings.fov]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, fov: value }))}
                min={60}
                max={120}
                step={5}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.antiAliasing}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, antiAliasing: checked }))}
              />
              <Label>Anti-Aliasing</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.shadows}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, shadows: checked }))}
              />
              <Label>Shadows</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.particles}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, particles: checked }))}
              />
              <Label>Particle Effects</Label>
            </div>
          </div>

          {/* Gameplay Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Gameplay</h3>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={settings.difficulty} onValueChange={(value: any) =>
                setSettings(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="nightmare">Nightmare</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mouse Sensitivity: {settings.sensitivity}</Label>
              <Slider
                value={[settings.sensitivity]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, sensitivity: value }))}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Crosshair Type</Label>
              <Select value={settings.crosshairType} onValueChange={(value: any) =>
                setSettings(prev => ({ ...prev, crosshairType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dot">Dot</SelectItem>
                  <SelectItem value="cross">Cross</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>HUD Opacity: {settings.hudOpacity}%</Label>
              <Slider
                value={[settings.hudOpacity]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, hudOpacity: value }))}
                min={20}
                max={100}
                step={5}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.autoReload}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoReload: checked }))}
              />
              <Label>Auto Reload</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.mouseInvert}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, mouseInvert: checked }))}
              />
              <Label>Invert Mouse Y</Label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          <motion.h1
            className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
          >
            BATTLE ARENA 3D
          </motion.h1>

          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Immersive 3D First-Person Shooter mit fortschrittlicher KI, realistischer Physik und epischen Battles
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-3 text-lg"
              onClick={startGame}
            >
              <Play className="h-5 w-5 mr-2" />
              SPIEL STARTEN
            </Button>

            <SettingsPanel />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Präzision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Fortschrittliches Ballistiksystem mit realistischem Rückstoß und Penetration
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  KI-Gegner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Intelligente Feinde mit verschiedenen Kampfstilen und Taktiken
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Progression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Levelsystem mit Achievements, Streaks und globalen Ranglisten
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full cursor-none"
        onClick={requestPointerLock}
      />

      {gameState === 'paused' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/75 flex items-center justify-center"
        >
          <Card className="bg-gray-900 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-center">Game Paused</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 justify-center">
              <Button
                onClick={() => setGameState('playing')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <SettingsPanel />
              <Button
                variant="outline"
                onClick={() => setGameState('menu')}
              >
                Main Menu
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {gameState === 'game_over' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/90 flex items-center justify-center"
        >
          <Card className="bg-gray-900 border-red-500/20 max-w-md">
            <CardHeader>
              <CardTitle className="text-red-400 text-center text-2xl">GAME OVER</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-lg">Final Score: <span className="text-cyan-400 font-bold">{stats.score.toLocaleString()}</span></p>
                <p>Kills: {stats.kills}</p>
                <p>Wave Reached: {stats.wave}</p>
                <p>Best Streak: {stats.bestStreak}</p>
                <p>Accuracy: {stats.accuracy.toFixed(1)}%</p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setGameState('menu')}
                >
                  Main Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Game controls info */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded text-sm">
          WASD: Move | Mouse: Look | Click: Shoot | R: Reload | ESC: Pause
        </div>
      )}
    </div>
  )
}