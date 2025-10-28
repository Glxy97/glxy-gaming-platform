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
  Trophy,
  Plus,
  Minus
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

interface Enemy {
  id: string
  x: number
  y: number
  z: number
  health: number
  maxHealth: number
  type: 'soldier' | 'tank' | 'sniper' | 'drone'
  distance: number
  angle: number
  isAlive: boolean
  lastShot: number
}

interface Weapon {
  id: string
  name: string
  damage: number
  ammo: number
  maxAmmo: number
  fireRate: number
  accuracy: number
  range: number
  icon: string
}

interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  sensitivity: number
  graphics: 'low' | 'medium' | 'high' | 'ultra'
  fov: number
  soundEnabled: boolean
  showFPS: boolean
}

interface GameStats {
  score: number
  kills: number
  headshots: number
  accuracy: number
  shotsFired: number
  shotsHit: number
  wave: number
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
}

const weapons: Weapon[] = [
  {
    id: 'assault',
    name: 'Assault Rifle',
    damage: 35,
    ammo: 30,
    maxAmmo: 30,
    fireRate: 120,
    accuracy: 85,
    range: 100,
    icon: '🔫'
  },
  {
    id: 'sniper',
    name: 'Sniper Rifle',
    damage: 95,
    ammo: 5,
    maxAmmo: 5,
    fireRate: 30,
    accuracy: 98,
    range: 200,
    icon: '🎯'
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    damage: 80,
    ammo: 8,
    maxAmmo: 8,
    fireRate: 60,
    accuracy: 60,
    range: 40,
    icon: '💥'
  }
]

export function ModernFPS() {
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'medium',
    sensitivity: 50,
    graphics: 'high',
    fov: 90,
    soundEnabled: true,
    showFPS: true
  })
  
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setPaused] = useState(false)
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu')
  
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    headshots: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    wave: 1,
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100
  })
  
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [currentWeapon, setCurrentWeapon] = useState(0)
  const [weaponData, setWeaponData] = useState(weapons)
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 })
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 })
  const [gameTime, setGameTime] = useState(0)
  const [fps, setFPS] = useState(60)
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const lastFrameTimeRef = useRef(performance.now())
  const gameAreaSize = { width: 1000, height: 600 }

  // FPS Counter
  useEffect(() => {
    const updateFPS = () => {
      const now = performance.now()
      const delta = now - lastFrameTimeRef.current
      const currentFPS = Math.round(1000 / delta)
      setFPS(currentFPS)
      lastFrameTimeRef.current = now
      
      if (gameStarted && gameStatus === 'playing') {
        requestAnimationFrame(updateFPS)
      }
    }
    
    if (gameStarted && gameStatus === 'playing') {
      updateFPS()
    }
  }, [gameStarted, gameStatus])

  // Mouse handling for crosshair
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gameAreaRef.current || gameStatus !== 'playing') return
      
      const rect = gameAreaRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      
      setCrosshairPos({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      })
      
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }

    if (gameAreaRef.current) {
      gameAreaRef.current.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      if (gameAreaRef.current) {
        gameAreaRef.current.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [gameStatus])

  const spawnEnemies = useCallback(() => {
    if (enemies.length >= 8) return
    
    const enemyTypes: Enemy['type'][] = ['soldier', 'tank', 'sniper', 'drone']
    const newEnemies: Enemy[] = []
    
    for (let i = 0; i < 3; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
      const angle = Math.random() * Math.PI * 2
      const distance = 50 + Math.random() * 100
      
      newEnemies.push({
        id: `enemy-${Date.now()}-${i}`,
        x: 50 + Math.cos(angle) * (distance / 2),
        y: 50 + Math.sin(angle) * (distance / 4),
        z: 0,
        health: type === 'tank' ? 150 : type === 'sniper' ? 80 : type === 'drone' ? 60 : 100,
        maxHealth: type === 'tank' ? 150 : type === 'sniper' ? 80 : type === 'drone' ? 60 : 100,
        type,
        distance,
        angle,
        isAlive: true,
        lastShot: Date.now()
      })
    }
    
    setEnemies(prev => [...prev, ...newEnemies])
  }, [enemies.length])

  const handleShoot = useCallback(() => {
    if (gameStatus !== 'playing') return
    
    const weapon = weaponData[currentWeapon]
    if (weapon.ammo <= 0) {
      toast.error('Keine Munition!', { description: 'Waffe nachladen erforderlich' })
      return
    }

    // Update weapon ammo
    setWeaponData(prev => prev.map((w, i) => 
      i === currentWeapon ? { ...w, ammo: w.ammo - 1 } : w
    ))

    // Update stats
    setStats(prev => ({
      ...prev,
      shotsFired: prev.shotsFired + 1
    }))

    // Check for hits
    const hitEnemy = enemies.find(enemy => {
      if (!enemy.isAlive) return false
      
      const enemyScreenX = enemy.x
      const enemyScreenY = enemy.y
      const hitboxRadius = 8 / (enemy.distance / 50) // Closer enemies have bigger hitbox
      
      const distance = Math.sqrt(
        Math.pow(crosshairPos.x - enemyScreenX, 2) + 
        Math.pow(crosshairPos.y - enemyScreenY, 2)
      )
      
      return distance < hitboxRadius
    })

    if (hitEnemy) {
      const damage = weapon.damage + (Math.random() * 20 - 10) // Damage variance
      const isHeadshot = Math.random() < 0.15 // 15% headshot chance
      const finalDamage = isHeadshot ? damage * 2 : damage
      
      setEnemies(prev => prev.map(enemy => 
        enemy.id === hitEnemy.id 
          ? { ...enemy, health: Math.max(0, enemy.health - finalDamage) }
          : enemy
      ))

      setStats(prev => ({
        ...prev,
        shotsHit: prev.shotsHit + 1,
        accuracy: Math.round((prev.shotsHit + 1) / prev.shotsFired * 100),
        score: prev.score + (isHeadshot ? finalDamage * 2 : finalDamage),
        headshots: isHeadshot ? prev.headshots + 1 : prev.headshots
      }))

      if (hitEnemy.health - finalDamage <= 0) {
        setStats(prev => ({
          ...prev,
          kills: prev.kills + 1,
          score: prev.score + 100
        }))
        
        toast.success(isHeadshot ? 'HEADSHOT! 🎯' : 'Kill! 💀', {
          description: `+${isHeadshot ? finalDamage * 2 + 100 : finalDamage + 100} Punkte`
        })
      } else if (isHeadshot) {
        toast.success('HEADSHOT! 🎯')
      }
    }
  }, [crosshairPos, enemies, currentWeapon, weaponData, gameStatus])

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameStatus !== 'playing') return

    setGameTime(prev => prev + 1/60)

    // Remove dead enemies
    setEnemies(prev => prev.filter(enemy => enemy.health > 0))

    // Spawn new enemies
    if (Math.random() < 0.02 * stats.wave) {
      spawnEnemies()
    }

    // Enemy AI and shooting
    setEnemies(prev => prev.map(enemy => {
      if (!enemy.isAlive || enemy.health <= 0) return enemy

      // Simple AI movement
      const newAngle = enemy.angle + (Math.random() - 0.5) * 0.1
      const newDistance = Math.max(30, Math.min(150, enemy.distance + (Math.random() - 0.5) * 2))
      
      return {
        ...enemy,
        angle: newAngle,
        distance: newDistance,
        x: 50 + Math.cos(newAngle) * (newDistance / 2),
        y: 50 + Math.sin(newAngle) * (newDistance / 4)
      }
    }))

    // Wave progression
    if (enemies.length === 0 && stats.kills > 0 && stats.kills % 10 === 0) {
      setStats(prev => ({ ...prev, wave: prev.wave + 1 }))
      toast.success(`Wave ${stats.wave + 1}!`, { description: 'Neue Feinde spawnen' })
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameStatus, stats.wave, stats.kills, enemies.length, spawnEnemies])

  useEffect(() => {
    if (gameStatus === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
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
      headshots: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
      wave: 1,
      health: 100,
      maxHealth: 100,
      armor: 50,
      maxArmor: 100
    })
    setEnemies([])
    setWeaponData(weapons)
    setGameTime(0)
    spawnEnemies()
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
    setWeaponData(weapons)
  }

  const reloadWeapon = () => {
    setWeaponData(prev => prev.map((w, i) => 
      i === currentWeapon ? { ...w, ammo: w.maxAmmo } : w
    ))
    toast.success('Waffe nachgeladen!')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      <div className="max-w-full mx-auto">
        {/* Game Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold gradient-text mb-2">
              🎯 GLXY Modern Warfare
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={gameStatus === 'playing' ? 'default' : 'secondary'}>
                {gameStatus === 'playing' ? 'In Combat' : gameStatus === 'paused' ? 'Pausiert' : gameStatus === 'gameOver' ? 'Game Over' : 'Bereit'}
              </Badge>
              {gameStarted && (
                <>
                  <span>Wave: {stats.wave}</span>
                  <span>Score: {stats.score.toLocaleString()}</span>
                  <span>Zeit: {formatTime(gameTime)}</span>
                  {settings.showFPS && <span>FPS: {fps}</span>}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Einstellungen</DialogTitle>
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
                        <SelectItem value="extreme">Extrem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>FOV: {settings.fov}°</Label>
                    <Slider
                      value={[settings.fov]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, fov: value }))}
                      max={120}
                      min={60}
                      step={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>FPS anzeigen</Label>
                    <Switch 
                      checked={settings.showFPS}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, showFPS: checked }))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {!gameStarted || gameStatus === 'gameOver' ? (
              <Button onClick={startGame} className="gap-2">
                <Play className="w-4 h-4" />
                {gameStatus === 'gameOver' ? 'Neu starten' : 'Mission starten'}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
            {/* Left HUD */}
            <div className="lg:col-span-2 space-y-4">
              {/* Player Health */}
              <Card className="bg-black/50 border-red-500/30">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-500" />
                          Gesundheit
                        </span>
                        <span className="text-red-400">{stats.health}/{stats.maxHealth}</span>
                      </div>
                      <Progress value={(stats.health / stats.maxHealth) * 100} className="h-2 bg-red-900" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-500" />
                          Panzerung
                        </span>
                        <span className="text-blue-400">{stats.armor}/{stats.maxArmor}</span>
                      </div>
                      <Progress value={(stats.armor / stats.maxArmor) * 100} className="h-2 bg-blue-900" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weapon Info */}
              <Card className="bg-black/50 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{weaponData[currentWeapon].icon}</div>
                    <h3 className="font-bold text-yellow-400 mb-2">{weaponData[currentWeapon].name}</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Munition:</span>
                        <span className="text-yellow-400">{weaponData[currentWeapon].ammo}/{weaponData[currentWeapon].maxAmmo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Schaden:</span>
                        <span className="text-red-400">{weaponData[currentWeapon].damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Genauigkeit:</span>
                        <span className="text-green-400">{weaponData[currentWeapon].accuracy}%</span>
                      </div>
                    </div>
                    <Button 
                      onClick={reloadWeapon} 
                      size="sm" 
                      className="w-full mt-3"
                      disabled={weaponData[currentWeapon].ammo === weaponData[currentWeapon].maxAmmo}
                    >
                      Nachladen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="bg-black/50 border-gaming-primary/20">
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="text-gaming-primary font-bold">{stats.score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kills:</span>
                    <span className="text-red-400">{stats.kills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Headshots:</span>
                    <span className="text-yellow-400">{stats.headshots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Genauigkeit:</span>
                    <span className="text-green-400">{stats.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wave:</span>
                    <span className="text-gaming-secondary">{stats.wave}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Game Area */}
            <div className="lg:col-span-8">
              <Card className="relative overflow-hidden bg-gradient-to-b from-sky-900 via-gray-800 to-gray-900 border-gaming-primary/30">
                <CardContent className="p-0">
                  <div 
                    ref={gameAreaRef}
                    className="relative cursor-none"
                    style={{ 
                      width: gameAreaSize.width, 
                      height: gameAreaSize.height,
                      backgroundImage: `
                        linear-gradient(to bottom, 
                          rgba(135, 206, 235, 0.3) 0%, 
                          rgba(70, 130, 180, 0.2) 30%, 
                          rgba(105, 105, 105, 0.4) 70%, 
                          rgba(47, 79, 79, 0.6) 100%
                        ),
                        repeating-linear-gradient(
                          90deg,
                          transparent,
                          transparent 50px,
                          rgba(255,255,255,0.03) 52px
                        )`
                    }}
                    onClick={handleShoot}
                  >
                    {/* 3D Ground Grid */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute border-t border-white/10"
                          style={{
                            bottom: `${i * 5}%`,
                            left: '0',
                            right: '0',
                            transform: `perspective(800px) rotateX(75deg) translateY(${i * 2}px)`,
                            opacity: 0.3 - (i * 0.01)
                          }}
                        />
                      ))}
                    </div>

                    {/* Crosshair */}
                    <motion.div
                      className="absolute z-20 pointer-events-none"
                      style={{
                        left: `${crosshairPos.x}%`,
                        top: `${crosshairPos.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <div className="relative">
                        {/* Dynamic crosshair */}
                        <div className="w-8 h-8 relative">
                          <div className="absolute top-0 left-1/2 w-px h-2 bg-gaming-primary transform -translate-x-1/2" />
                          <div className="absolute bottom-0 left-1/2 w-px h-2 bg-gaming-primary transform -translate-x-1/2" />
                          <div className="absolute left-0 top-1/2 w-2 h-px bg-gaming-primary transform -translate-y-1/2" />
                          <div className="absolute right-0 top-1/2 w-2 h-px bg-gaming-primary transform -translate-y-1/2" />
                          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gaming-primary rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        {/* Hit indicator */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-red-500"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: [0, 1, 0] }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </motion.div>

                    {/* Enemies */}
                    <AnimatePresence>
                      {enemies.map((enemy) => (
                        <motion.div
                          key={enemy.id}
                          className="absolute z-10"
                          style={{
                            left: `${enemy.x}%`,
                            top: `${enemy.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0, rotate: 90 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {/* Enemy 3D representation */}
                          <div
                            className="relative"
                            style={{
                              width: `${Math.max(20, 100 - enemy.distance)}px`,
                              height: `${Math.max(30, 150 - enemy.distance)}px`
                            }}
                          >
                            {/* Enemy body */}
                            <div className={`
                              w-full h-full rounded-t-lg flex items-center justify-center text-2xl font-bold border-2 shadow-2xl
                              ${enemy.type === 'soldier' ? 'bg-green-700 border-green-500 text-green-100' :
                                enemy.type === 'tank' ? 'bg-gray-700 border-gray-500 text-gray-100' :
                                enemy.type === 'sniper' ? 'bg-blue-700 border-blue-500 text-blue-100' :
                                'bg-purple-700 border-purple-500 text-purple-100'}
                            `}>
                              {enemy.type === 'soldier' ? '🪖' :
                               enemy.type === 'tank' ? '🚜' :
                               enemy.type === 'sniper' ? '🎯' : '🚁'}
                            </div>

                            {/* Health bar */}
                            {enemy.health < enemy.maxHealth && (
                              <div className="absolute -top-2 left-0 w-full h-1 bg-red-900 rounded">
                                <div 
                                  className="h-full bg-red-500 rounded transition-all duration-200"
                                  style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                                />
                              </div>
                            )}

                            {/* Distance indicator */}
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/70">
                              {Math.round(enemy.distance)}m
                            </div>

                            {/* Muzzle flash effect */}
                            {Date.now() - enemy.lastShot < 100 && (
                              <motion.div
                                className="absolute top-1/2 -right-2 w-4 h-4 bg-yellow-400 rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1, 0] }}
                                transition={{ duration: 0.1 }}
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Weapon in bottom right */}
                    <div className="absolute bottom-4 right-4 z-15">
                      <motion.div
                        className="text-6xl opacity-80"
                        animate={{ 
                          y: [0, -2, 0],
                          rotate: [0, 1, -1, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {weaponData[currentWeapon].icon}
                      </motion.div>
                    </div>

                    {/* Game Status Overlays */}
                    {gameStatus === 'paused' && (
                      <motion.div
                        className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-center">
                          <Pause className="w-16 h-16 mx-auto mb-4 text-gaming-primary" />
                          <h3 className="text-2xl font-bold mb-4">Mission pausiert</h3>
                          <Button onClick={pauseGame}>
                            <Play className="w-4 h-4 mr-2" />
                            Fortsetzen
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {gameStatus === 'gameOver' && (
                      <motion.div
                        className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-center">
                          <div className="text-6xl mb-4">💀</div>
                          <h3 className="text-3xl font-bold mb-4 text-red-500">MISSION FAILED</h3>
                          <div className="space-y-2 mb-6">
                            <p>Final Score: <span className="text-gaming-primary font-bold">{stats.score.toLocaleString()}</span></p>
                            <p>Kills: <span className="text-red-400 font-bold">{stats.kills}</span></p>
                            <p>Headshots: <span className="text-yellow-400 font-bold">{stats.headshots}</span></p>
                            <p>Accuracy: <span className="text-green-400 font-bold">{stats.accuracy}%</span></p>
                            <p>Waves Survived: <span className="text-gaming-secondary font-bold">{stats.wave}</span></p>
                          </div>
                          <div className="flex gap-4 justify-center">
                            <Button onClick={startGame} className="gap-2">
                              <Play className="w-4 h-4" />
                              Retry Mission
                            </Button>
                            <Button onClick={resetGame} variant="outline">
                              Main Menu
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
                🖱️ Maus: Zielen & Schießen | R: Nachladen | 1-3: Waffen wechseln | ESC: Pause
              </div>
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-2 space-y-4">
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
                    <span className="text-gaming-primary">{stats.score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>2. Ghost</span>
                    <span>45,670</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>3. Sniper</span>
                    <span>38,420</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>4. Reaper</span>
                    <span>31,890</span>
                  </div>
                </CardContent>
              </Card>

              {/* Weapon Selection */}
              <Card className="bg-black/50 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-sm text-yellow-400">Waffen Arsenal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {weaponData.map((weapon, i) => (
                    <button
                      key={weapon.id}
                      onClick={() => setCurrentWeapon(i)}
                      className={`w-full p-2 rounded text-left text-xs transition-colors ${
                        i === currentWeapon 
                          ? 'bg-yellow-500/20 border border-yellow-500/40' 
                          : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{weapon.icon}</span>
                          <span>{weapon.name}</span>
                        </span>
                        <span className="text-yellow-400">{i + 1}</span>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{weapon.ammo}/{weapon.maxAmmo}</span>
                        <span>{weapon.damage} DMG</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Enemy Intel */}
              <Card className="bg-black/50 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-sm text-red-400">Enemy Intel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>🪖</span>
                      <span>Soldiers</span>
                    </span>
                    <span className="text-green-400">{enemies.filter(e => e.type === 'soldier' && e.health > 0).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>🚜</span>
                      <span>Tanks</span>
                    </span>
                    <span className="text-red-400">{enemies.filter(e => e.type === 'tank' && e.health > 0).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>🎯</span>
                      <span>Snipers</span>
                    </span>
                    <span className="text-blue-400">{enemies.filter(e => e.type === 'sniper' && e.health > 0).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>🚁</span>
                      <span>Drones</span>
                    </span>
                    <span className="text-purple-400">{enemies.filter(e => e.type === 'drone' && e.health > 0).length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Start Menu
          <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div 
              className="text-center py-16 px-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="text-9xl mb-8"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 2, -2, 0]
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
                className="text-5xl font-orbitron font-bold mb-6 gradient-text"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Modern Warfare
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground mb-12 text-2xl leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Überlebe gegen endlose Wellen von Feinden in diesem intensiven 3D-Shooter! 
                Nutze verschiedene Waffen und beweise deine Fähigkeiten im Kampf.
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
                    className="gap-3 text-2xl px-12 py-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-xl shadow-red-500/40 border-2 border-red-500/30"
                  >
                    <Target className="w-8 h-8" />
                    Mission starten
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div 
                  className="p-6 rounded-xl bg-red-500/10 border border-red-500/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-4xl mb-3">💥</div>
                  <div className="font-semibold text-red-400">Intensive Action</div>
                  <div className="text-sm text-muted-foreground mt-1">Schnelle Gefechte</div>
                </motion.div>
                <motion.div 
                  className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-4xl mb-3">🎯</div>
                  <div className="font-semibold text-blue-400">Präzision</div>
                  <div className="text-sm text-muted-foreground mt-1">Jeder Schuss zählt</div>
                </motion.div>
                <motion.div 
                  className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-4xl mb-3">🔫</div>
                  <div className="font-semibold text-yellow-400">Arsenal</div>
                  <div className="text-sm text-muted-foreground mt-1">3 verschiedene Waffen</div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="mt-8 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                🖱️ Maus zum Zielen und Schießen • 🎮 Überlebe so lange wie möglich
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
