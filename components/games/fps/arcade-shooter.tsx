// @ts-nocheck

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Trophy
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

// Game Types
interface Enemy {
  id: string
  x: number
  y: number
  health: number
  maxHealth: number
  speed: number
  size: number
  type: 'basic' | 'fast' | 'tank' | 'boss'
  color: string
  direction: number
  lastShot: number
}

interface Bullet {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  isPlayerBullet: boolean
  color: string
  size: number
}

interface PowerUp {
  id: string
  x: number
  y: number
  type: 'health' | 'ammo' | 'shield' | 'rapid' | 'damage'
  icon: string
  color: string
}

interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare'
  soundEnabled: boolean
  crosshairStyle: 'dot' | 'cross' | 'circle' | 'target'
  sensitivity: number
  autoFire: boolean
  showFPS: boolean
}

interface GameStats {
  score: number
  kills: number
  accuracy: number
  shotsFired: number
  shotsHit: number
  level: number
  health: number
  maxHealth: number
  shield: number
  ammo: number
  maxAmmo: number
}

const defaultSettings: GameSettings = {
  difficulty: 'medium',
  soundEnabled: true,
  crosshairStyle: 'cross',
  sensitivity: 50,
  autoFire: false,
  showFPS: true
}

const enemyTypes = {
  basic: { health: 30, speed: 1, color: '#ef4444', size: 25, score: 10 },
  fast: { health: 20, speed: 2.5, color: '#f59e0b', size: 20, score: 15 },
  tank: { health: 80, speed: 0.8, color: '#6366f1', size: 35, score: 25 },
  boss: { health: 200, speed: 1.2, color: '#dc2626', size: 50, score: 100 }
}

export function ArcadeShooter() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setPaused] = useState(false)
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    level: 1,
    health: 100,
    maxHealth: 100,
    shield: 0,
    ammo: 30,
    maxAmmo: 30
  })
  
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu')
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 })
  const [isMouseDown, setMouseDown] = useState(false)
  const [lastShotTime, setLastShotTime] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const gameAreaSize = { width: 800, height: 600 }

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameStatus !== 'playing') return

    setGameTime(prev => prev + 1/60)

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      // Move towards center (player position)
      const centerX = gameAreaSize.width / 2
      const centerY = gameAreaSize.height / 2
      const dx = centerX - enemy.x
      const dy = centerY - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed
        enemy.y += (dy / distance) * enemy.speed
      }
      
      // Enemy shooting
      if (distance < 200 && Date.now() - enemy.lastShot > 2000) {
        const angle = Math.atan2(dy, dx)
        setBullets(prevBullets => [...prevBullets, {
          id: `enemy-bullet-${Date.now()}-${Math.random()}`,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          damage: 15,
          isPlayerBullet: false,
          color: '#ef4444',
          size: 4
        }])
        enemy.lastShot = Date.now()
      }
      
      return enemy
    }))

    // Update bullets
    setBullets(prev => prev.filter(bullet => {
      bullet.x += bullet.vx
      bullet.y += bullet.vy
      
      // Remove bullets that are out of bounds
      return bullet.x > -50 && bullet.x < gameAreaSize.width + 50 && 
             bullet.y > -50 && bullet.y < gameAreaSize.height + 50
    }))

    // Check collisions
    setBullets(prevBullets => {
      const remainingBullets = [...prevBullets]
      
      setEnemies(prevEnemies => {
        const remainingEnemies = [...prevEnemies]
        
        remainingBullets.forEach((bullet, bulletIndex) => {
          if (!bullet.isPlayerBullet) return
          
          remainingEnemies.forEach((enemy, enemyIndex) => {
            const dx = bullet.x - enemy.x
            const dy = bullet.y - enemy.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < enemy.size / 2) {
              // Hit enemy
              enemy.health -= bullet.damage
              remainingBullets.splice(bulletIndex, 1)
              
              setStats(prev => ({
                ...prev,
                shotsHit: prev.shotsHit + 1,
                accuracy: Math.round((prev.shotsHit + 1) / prev.shotsFired * 100)
              }))
              
              if (enemy.health <= 0) {
                // Enemy killed
                remainingEnemies.splice(enemyIndex, 1)
                setStats(prev => ({
                  ...prev,
                  kills: prev.kills + 1,
                  score: prev.score + enemyTypes[enemy.type].score
                }))
                
                // Random power-up drop
                if (Math.random() < 0.3) {
                  const powerUpTypes = ['health', 'ammo', 'shield', 'rapid', 'damage']
                  const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] as PowerUp['type']
                  
                  setPowerUps(prev => [...prev, {
                    id: `powerup-${Date.now()}`,
                    x: enemy.x,
                    y: enemy.y,
                    type: randomType,
                    icon: randomType === 'health' ? '❤️' : randomType === 'ammo' ? '🔫' : randomType === 'shield' ? '🛡️' : randomType === 'rapid' ? '⚡' : '💥',
                    color: randomType === 'health' ? '#10b981' : randomType === 'ammo' ? '#f59e0b' : randomType === 'shield' ? '#3b82f6' : randomType === 'rapid' ? '#8b5cf6' : '#ef4444'
                  }])
                }
              }
            }
          })
        })
        
        return remainingEnemies
      })
      
      return remainingBullets
    })

    // Check enemy bullets hitting player
    setBullets(prevBullets => {
      return prevBullets.filter(bullet => {
        if (bullet.isPlayerBullet) return true
        
        const centerX = gameAreaSize.width / 2
        const centerY = gameAreaSize.height / 2
        const dx = bullet.x - centerX
        const dy = bullet.y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 20) {
          // Player hit
          setStats(prev => ({
            ...prev,
            health: Math.max(0, prev.health - bullet.damage),
            shield: Math.max(0, prev.shield - Math.floor(bullet.damage / 2))
          }))
          return false
        }
        return true
      })
    })

    // Spawn enemies
    if (Math.random() < 0.02 + stats.level * 0.005) {
      const side = Math.floor(Math.random() * 4)
      let x: number, y: number
      
      switch (side) {
        case 0: x = -30; y = Math.random() * gameAreaSize.height; break
        case 1: x = gameAreaSize.width + 30; y = Math.random() * gameAreaSize.height; break
        case 2: x = Math.random() * gameAreaSize.width; y = -30; break
        default: x = Math.random() * gameAreaSize.width; y = gameAreaSize.height + 30
      }
      
      const types: (keyof typeof enemyTypes)[] = ['basic', 'fast', 'tank']
      if (stats.level > 5 && Math.random() < 0.1) types.push('boss')
      
      const type = types[Math.floor(Math.random() * types.length)]
      const typeData = enemyTypes[type]
      
      setEnemies(prev => [...prev, {
        id: `enemy-${Date.now()}-${Math.random()}`,
        x,
        y,
        health: typeData.health,
        maxHealth: typeData.health,
        speed: typeData.speed,
        size: typeData.size,
        type,
        color: typeData.color,
        direction: Math.random() * Math.PI * 2,
        lastShot: Date.now()
      }])
    }

    // Check power-up collection
    setPowerUps(prev => prev.filter(powerUp => {
      const centerX = gameAreaSize.width / 2
      const centerY = gameAreaSize.height / 2
      const dx = powerUp.x - centerX
      const dy = powerUp.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 30) {
        // Collect power-up
        setStats(prevStats => {
          switch (powerUp.type) {
            case 'health':
              return { ...prevStats, health: Math.min(prevStats.maxHealth, prevStats.health + 30) }
            case 'ammo':
              return { ...prevStats, ammo: Math.min(prevStats.maxAmmo, prevStats.ammo + 15) }
            case 'shield':
              return { ...prevStats, shield: Math.min(100, prevStats.shield + 50) }
            default:
              return prevStats
          }
        })
        return false
      }
      return true
    }))

    // Check game over
    if (stats.health <= 0) {
      setGameStatus('gameOver')
    }

    // Level progression
    if (stats.kills > 0 && stats.kills % 10 === 0 && stats.kills !== stats.level * 10) {
      setStats(prev => ({ ...prev, level: prev.level + 1 }))
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameStatus, stats, gameAreaSize])

  // Mouse handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gameAreaRef.current) return
      
      const rect = gameAreaRef.current.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }

    const handleMouseDown = () => setMouseDown(true)
    const handleMouseUp = () => setMouseDown(false)

    if (gameAreaRef.current) {
      gameAreaRef.current.addEventListener('mousemove', handleMouseMove)
      gameAreaRef.current.addEventListener('mousedown', handleMouseDown)
      gameAreaRef.current.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (gameAreaRef.current) {
        gameAreaRef.current.removeEventListener('mousemove', handleMouseMove)
        gameAreaRef.current.removeEventListener('mousedown', handleMouseDown)
        gameAreaRef.current.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [])

  // Shooting
  useEffect(() => {
    if (!gameStarted || gameStatus !== 'playing') return

    const shoot = () => {
      if (stats.ammo <= 0) return
      if (Date.now() - lastShotTime < (settings.autoFire ? 150 : 200)) return

      const centerX = gameAreaSize.width / 2
      const centerY = gameAreaSize.height / 2
      const angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX)
      
      setBullets(prev => [...prev, {
        id: `bullet-${Date.now()}-${Math.random()}`,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        damage: 25,
        isPlayerBullet: true,
        color: '#00f5ff',
        size: 3
      }])

      setStats(prev => ({
        ...prev,
        ammo: prev.ammo - 1,
        shotsFired: prev.shotsFired + 1
      }))

      setLastShotTime(Date.now())
    }

    const handleClick = () => shoot()
    
    let interval: NodeJS.Timeout
    if (settings.autoFire && isMouseDown) {
      interval = setInterval(shoot, 150)
    }

    if (gameAreaRef.current) {
      gameAreaRef.current.addEventListener('click', handleClick)
    }

    return () => {
      if (gameAreaRef.current) {
        gameAreaRef.current.removeEventListener('click', handleClick)
      }
      if (interval) clearInterval(interval)
    }
  }, [isMouseDown, mousePos, stats.ammo, lastShotTime, settings.autoFire, gameStarted, gameStatus])

  // Game loop
  useEffect(() => {
    if (gameStatus === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameLoop, gameStatus])

  const startGame = () => {
    setGameStarted(true)
    setGameStatus('playing')
    setStats({
      score: 0,
      kills: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
      level: 1,
      health: 100,
      maxHealth: 100,
      shield: 0,
      ammo: 30,
      maxAmmo: 30
    })
    setEnemies([])
    setBullets([])
    setPowerUps([])
    setGameTime(0)
  }

  const pauseGame = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused')
    } else if (gameStatus === 'paused') {
      setGameStatus('playing')
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameStatus('menu')
    setEnemies([])
    setBullets([])
    setPowerUps([])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCrosshairStyle = () => {
    const base = "absolute pointer-events-none z-10 transition-all duration-75"
    switch (settings.crosshairStyle) {
      case 'dot':
        return `${base} w-2 h-2 bg-gaming-primary rounded-full`
      case 'cross':
        return `${base} text-gaming-primary text-xl font-bold`
      case 'circle':
        return `${base} w-6 h-6 border-2 border-gaming-primary rounded-full`
      case 'target':
        return `${base} w-8 h-8 border-2 border-gaming-primary rounded-full`
      default:
        return `${base} text-gaming-primary text-xl`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Game Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold gradient-text mb-2">
              🎯 GLXY Arcade Shooter
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={gameStatus === 'playing' ? 'default' : 'secondary'}>
                {gameStatus === 'playing' ? 'Kampf läuft' : gameStatus === 'paused' ? 'Pausiert' : gameStatus === 'gameOver' ? 'Game Over' : 'Bereit'}
              </Badge>
              {gameStarted && (
                <>
                  <span>Level: {stats.level}</span>
                  <span>Score: {stats.score}</span>
                  <span>Zeit: {formatTime(gameTime)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Shooter Einstellungen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Schwierigkeit</Label>
                    <Select value={settings.difficulty} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, difficulty: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Einfach</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="hard">Schwer</SelectItem>
                        <SelectItem value="nightmare">Alptraum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fadenkreuz Stil</Label>
                    <Select value={settings.crosshairStyle} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, crosshairStyle: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dot">Punkt</SelectItem>
                        <SelectItem value="cross">Kreuz</SelectItem>
                        <SelectItem value="circle">Kreis</SelectItem>
                        <SelectItem value="target">Zielscheibe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Empfindlichkeit: {settings.sensitivity}%</Label>
                    <Slider
                      value={[settings.sensitivity]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, sensitivity: value }))}
                      max={100}
                      min={10}
                      step={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-Feuer</Label>
                    <Switch 
                      checked={settings.autoFire}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, autoFire: checked }))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Game Controls */}
            {!gameStarted || gameStatus === 'gameOver' ? (
              <Button onClick={startGame} className="gap-2">
                <Play className="w-4 h-4" />
                {gameStatus === 'gameOver' ? 'Neu starten' : 'Spiel starten'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={pauseGame} size="sm">
                  {gameStatus === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={resetGame} size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {gameStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left HUD */}
            <div className="lg:col-span-1 space-y-4">
              {/* Player Stats */}
              <Card className="bg-black/50 border-gaming-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Spieler Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        Leben
                      </span>
                      <span className="text-red-400">{stats.health}/{stats.maxHealth}</span>
                    </div>
                    <Progress value={(stats.health / stats.maxHealth) * 100} className="h-2 bg-red-900" />
                  </div>

                  {stats.shield > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Schild
                        </span>
                        <span className="text-blue-400">{stats.shield}/100</span>
                      </div>
                      <Progress value={stats.shield} className="h-2 bg-blue-900" />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Munition</span>
                      <span className="text-yellow-400">{stats.ammo}/{stats.maxAmmo}</span>
                    </div>
                    <Progress value={(stats.ammo / stats.maxAmmo) * 100} className="h-2 bg-yellow-900" />
                  </div>
                </CardContent>
              </Card>

              {/* Game Stats */}
              <Card className="bg-black/50 border-gaming-secondary/20">
                <CardHeader>
                  <CardTitle className="text-sm">Statistiken</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="text-gaming-primary font-bold">{stats.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kills:</span>
                    <span className="text-gaming-secondary">{stats.kills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className="text-gaming-accent">{stats.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Genauigkeit:</span>
                    <span className="text-green-400">{stats.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zeit:</span>
                    <span>{formatTime(gameTime)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Game Area */}
            <div className="lg:col-span-3">
              <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border-gaming-primary/30">
                <CardContent className="p-0">
                  <div 
                    ref={gameAreaRef}
                    className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black cursor-none"
                    style={{ 
                      width: gameAreaSize.width, 
                      height: gameAreaSize.height,
                      backgroundImage: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
                                       radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
                                       radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.2), transparent 50%)`
                    }}
                  >
                    {/* Crosshair */}
                    <div
                      className={getCrosshairStyle()}
                      style={{
                        left: mousePos.x - (settings.crosshairStyle === 'cross' ? 10 : settings.crosshairStyle === 'dot' ? 4 : 16),
                        top: mousePos.y - (settings.crosshairStyle === 'cross' ? 10 : settings.crosshairStyle === 'dot' ? 4 : 16)
                      }}
                    >
                      {settings.crosshairStyle === 'cross' && '+'}
                      {settings.crosshairStyle === 'target' && (
                        <div className="relative w-full h-full">
                          <div className="absolute inset-2 border border-gaming-primary rounded-full" />
                          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gaming-primary rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      )}
                    </div>

                    {/* Player (center) */}
                    <div
                      className="absolute w-6 h-6 bg-gaming-primary rounded-full border-2 border-white shadow-lg"
                      style={{
                        left: gameAreaSize.width / 2 - 12,
                        top: gameAreaSize.height / 2 - 12,
                        boxShadow: '0 0 20px rgba(0, 245, 255, 0.6)'
                      }}
                    />

                    {/* Enemies */}
                    <AnimatePresence>
                      {enemies.map((enemy) => (
                        <motion.div
                          key={enemy.id}
                          className="absolute rounded-full border border-white/30"
                          style={{
                            left: enemy.x - enemy.size / 2,
                            top: enemy.y - enemy.size / 2,
                            width: enemy.size,
                            height: enemy.size,
                            backgroundColor: enemy.color,
                            boxShadow: `0 0 15px ${enemy.color}80`
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          {/* Health bar */}
                          {enemy.health < enemy.maxHealth && (
                            <div className="absolute -top-2 left-0 w-full h-1 bg-red-900 rounded">
                              <div 
                                className="h-full bg-red-500 rounded"
                                style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                              />
                            </div>
                          )}
                          
                          {/* Enemy type indicator */}
                          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                            {enemy.type === 'boss' ? '💀' : enemy.type === 'tank' ? '🛡️' : enemy.type === 'fast' ? '⚡' : '👾'}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Bullets */}
                    <AnimatePresence>
                      {bullets.map((bullet) => (
                        <motion.div
                          key={bullet.id}
                          className="absolute rounded-full"
                          style={{
                            left: bullet.x - bullet.size / 2,
                            top: bullet.y - bullet.size / 2,
                            width: bullet.size * 2,
                            height: bullet.size * 2,
                            backgroundColor: bullet.color,
                            boxShadow: `0 0 10px ${bullet.color}`
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        />
                      ))}
                    </AnimatePresence>

                    {/* Power-ups */}
                    <AnimatePresence>
                      {powerUps.map((powerUp) => (
                        <motion.div
                          key={powerUp.id}
                          className="absolute w-8 h-8 flex items-center justify-center rounded-full border-2 border-white/50"
                          style={{
                            left: powerUp.x - 16,
                            top: powerUp.y - 16,
                            backgroundColor: powerUp.color + '40',
                            borderColor: powerUp.color,
                            boxShadow: `0 0 20px ${powerUp.color}80`
                          }}
                          initial={{ scale: 0, y: -20 }}
                          animate={{ 
                            scale: [1, 1.1, 1],
                            y: [0, -5, 0]
                          }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ 
                            scale: { duration: 1, repeat: Infinity },
                            y: { duration: 2, repeat: Infinity }
                          }}
                        >
                          <span className="text-sm">{powerUp.icon}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Pause Overlay */}
                    {gameStatus === 'paused' && (
                      <motion.div
                        className="absolute inset-0 bg-black/70 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-center">
                          <Pause className="w-16 h-16 mx-auto mb-4 text-gaming-primary" />
                          <h3 className="text-2xl font-bold mb-4">Spiel pausiert</h3>
                          <Button onClick={pauseGame}>
                            <Play className="w-4 h-4 mr-2" />
                            Fortsetzen
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Game Over Overlay */}
                    {gameStatus === 'gameOver' && (
                      <motion.div
                        className="absolute inset-0 bg-black/80 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-center">
                          <div className="text-6xl mb-4">💀</div>
                          <h3 className="text-3xl font-bold mb-4 text-red-500">GAME OVER</h3>
                          <div className="space-y-2 mb-6">
                            <p>Final Score: <span className="text-gaming-primary font-bold">{stats.score}</span></p>
                            <p>Level Reached: <span className="text-gaming-secondary font-bold">{stats.level}</span></p>
                            <p>Kills: <span className="text-gaming-accent font-bold">{stats.kills}</span></p>
                            <p>Accuracy: <span className="text-green-400 font-bold">{stats.accuracy}%</span></p>
                          </div>
                          <div className="flex gap-4 justify-center">
                            <Button onClick={startGame} className="gap-2">
                              <Play className="w-4 h-4" />
                              Noch einmal
                            </Button>
                            <Button onClick={resetGame} variant="outline">
                              Hauptmenü
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="mt-2 text-center text-xs text-muted-foreground">
                🖱️ Maus: Zielen & Schießen | {settings.autoFire ? 'Auto-Feuer aktiviert' : 'Klicken zum Schießen'} | ESC: Pause
              </div>
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-black/50 border-gaming-accent/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>1. Player</span>
                    <span className="text-gaming-primary">{stats.score}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>2. Ghost</span>
                    <span>8,540</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>3. Hunter</span>
                    <span>7,230</span>
                  </div>
                </CardContent>
              </Card>

              {/* Enemy Info */}
              <Card className="bg-black/50 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-sm text-red-400">Feind Typen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Basic
                    </span>
                    <span>10 Punkte</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      Fast
                    </span>
                    <span>15 Punkte</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      Tank
                    </span>
                    <span>25 Punkte</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      Boss
                    </span>
                    <span>100 Punkte</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Start Menu
          <div className="min-h-[70vh] flex items-center justify-center">
            <motion.div 
              className="text-center py-16 px-8 max-w-lg mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="text-9xl mb-8"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                🎯
              </motion.div>
              
              <motion.h2 
                className="text-4xl font-orbitron font-bold mb-6 gradient-text"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Bereit für den Kampf?
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground mb-10 text-xl leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Überlebe gegen endlose Wellen von Feinden! Sammle Power-ups und erreiche den höchsten Score!
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={startGame} 
                    size="lg" 
                    className="gap-3 text-xl px-10 py-5 bg-gradient-to-r from-gaming-primary to-gaming-secondary hover:from-gaming-secondary hover:to-gaming-primary transition-all duration-300 shadow-xl shadow-gaming-primary/40 border-2 border-gaming-primary/30"
                  >
                    <Target className="w-7 h-7" />
                    Kampf beginnen
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="mt-12 grid grid-cols-3 gap-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div 
                  className="p-4 rounded-lg bg-gaming-primary/10 border border-gaming-primary/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-3xl mb-3">💥</div>
                  <div className="font-semibold text-gaming-primary">Action</div>
                  <div className="text-sm text-muted-foreground mt-1">Schnelle Kämpfe</div>
                </motion.div>
                <motion.div 
                  className="p-4 rounded-lg bg-gaming-secondary/10 border border-gaming-secondary/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-3xl mb-3">🏆</div>
                  <div className="font-semibold text-gaming-secondary">Highscore</div>
                  <div className="text-sm text-muted-foreground mt-1">Bestenliste</div>
                </motion.div>
                <motion.div 
                  className="p-4 rounded-lg bg-gaming-accent/10 border border-gaming-accent/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-3xl mb-3">⚡</div>
                  <div className="font-semibold text-gaming-accent">Power-ups</div>
                  <div className="text-sm text-muted-foreground mt-1">Spezielle Waffen</div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="mt-8 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                🖱️ Maus zum Zielen und Schießen • 🎮 Sammle Power-ups für Upgrades
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
