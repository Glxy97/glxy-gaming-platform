// @ts-nocheck

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Car, 
  Settings, 
  Volume2, 
  VolumeX, 
  Users, 
  Bot, 
  Zap, 
  Timer,
  Trophy,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Gauge,
  Fuel,
  Wind,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface PlayerCar {
  x: number
  y: number
  angle: number
  speed: number
  maxSpeed: number
  drift: number
  nitro: number
  health: number
}

interface RoadSegment {
  x: number
  y: number
  width: number
  curve: number
}

interface Opponent {
  id: string
  x: number
  y: number
  angle: number
  speed: number
  lap: number
  color: string
  name: string
}

interface GameSettings {
  mode: 'drift' | 'circuit' | 'timeAttack'
  track: 'city' | 'mountain' | 'desert' | 'highway' | 'night'
  difficulty: 'easy' | 'medium' | 'hard' | 'pro'
  laps: number
  soundEnabled: boolean
  controlScheme: 'wasd' | 'arrows'
}

interface GameStats {
  score: number
  lap: number
  position: number
  speed: number
  driftPoints: number
  totalDistance: number
  bestLapTime: number
  currentLapTime: number
  nitroLevel: number
  health: number
}

export function EnhancedDriftRacer() {
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'drift',
    track: 'city',
    difficulty: 'medium',
    laps: 3,
    soundEnabled: true,
    controlScheme: 'wasd'
  })
  
  const [gameStarted, setGameStarted] = useState(false)
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'finished'>('menu')
  
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    lap: 1,
    position: 1,
    speed: 0,
    driftPoints: 0,
    totalDistance: 0,
    bestLapTime: 0,
    currentLapTime: 0,
    nitroLevel: 100,
    health: 100
  })
  
  const [playerCar, setPlayerCar] = useState<PlayerCar>({
    x: 400,
    y: 500,
    angle: 0,
    speed: 0,
    maxSpeed: 8,
    drift: 0,
    nitro: 100,
    health: 100
  })
  
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>([])
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false, space: false })
  const [gameTime, setGameTime] = useState(0)
  const [isDrifting, setIsDrifting] = useState(false)
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const gameAreaSize = { width: 800, height: 600 }

  // Initialize road segments (creates a track)
  useEffect(() => {
    const segments: RoadSegment[] = []
    for (let i = 0; i < 100; i++) {
      segments.push({
        x: 400 + Math.sin(i * 0.1) * 150,
        y: i * 50,
        width: 120 + Math.sin(i * 0.05) * 30,
        curve: Math.sin(i * 0.02) * 0.5
      })
    }
    setRoadSegments(segments)
  }, [settings.track])

  // Initialize opponent cars
  useEffect(() => {
    const opponentData: Opponent[] = [
      { id: 'cpu1', x: 350, y: 450, angle: 0, speed: 3, lap: 1, color: '#ff4444', name: 'Racer Red' },
      { id: 'cpu2', x: 450, y: 400, angle: 0, speed: 3.5, lap: 1, color: '#44ff44', name: 'Speed Green' },
      { id: 'cpu3', x: 380, y: 350, angle: 0, speed: 2.8, lap: 1, color: '#4444ff', name: 'Drift Blue' }
    ]
    setOpponents(opponentData)
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (settings.controlScheme === 'wasd') {
        switch (key) {
          case 'w': setKeys(prev => ({ ...prev, w: true })); break
          case 'a': setKeys(prev => ({ ...prev, a: true })); break
          case 's': setKeys(prev => ({ ...prev, s: true })); break
          case 'd': setKeys(prev => ({ ...prev, d: true })); break
          case ' ': setKeys(prev => ({ ...prev, space: true })); e.preventDefault(); break
        }
      } else {
        switch (key) {
          case 'arrowup': setKeys(prev => ({ ...prev, w: true })); e.preventDefault(); break
          case 'arrowleft': setKeys(prev => ({ ...prev, a: true })); e.preventDefault(); break
          case 'arrowdown': setKeys(prev => ({ ...prev, s: true })); e.preventDefault(); break
          case 'arrowright': setKeys(prev => ({ ...prev, d: true })); e.preventDefault(); break
          case ' ': setKeys(prev => ({ ...prev, space: true })); e.preventDefault(); break
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (settings.controlScheme === 'wasd') {
        switch (key) {
          case 'w': setKeys(prev => ({ ...prev, w: false })); break
          case 'a': setKeys(prev => ({ ...prev, a: false })); break
          case 's': setKeys(prev => ({ ...prev, s: false })); break
          case 'd': setKeys(prev => ({ ...prev, d: false })); break
          case ' ': setKeys(prev => ({ ...prev, space: false })); break
        }
      } else {
        switch (key) {
          case 'arrowup': setKeys(prev => ({ ...prev, w: false })); break
          case 'arrowleft': setKeys(prev => ({ ...prev, a: false })); break
          case 'arrowdown': setKeys(prev => ({ ...prev, s: false })); break
          case 'arrowright': setKeys(prev => ({ ...prev, d: false })); break
          case ' ': setKeys(prev => ({ ...prev, space: false })); break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [settings.controlScheme])

  // Game physics and logic
  const updateGame = useCallback(() => {
    if (gameStatus !== 'playing') return

    setGameTime(prev => prev + 1/60)

    setPlayerCar(prev => {
      let newCar = { ...prev }

      // Acceleration/Deceleration
      if (keys.w) {
        newCar.speed = Math.min(newCar.maxSpeed, newCar.speed + 0.3)
      } else if (keys.s) {
        newCar.speed = Math.max(-newCar.maxSpeed / 2, newCar.speed - 0.3)
      } else {
        newCar.speed *= 0.95 // Natural deceleration
      }

      // Steering
      const steerAmount = 0.05
      if (keys.a && Math.abs(newCar.speed) > 0.1) {
        newCar.angle -= steerAmount * Math.abs(newCar.speed)
      }
      if (keys.d && Math.abs(newCar.speed) > 0.1) {
        newCar.angle += steerAmount * Math.abs(newCar.speed)
      }

      // Nitro boost
      if (keys.space && newCar.nitro > 0) {
        newCar.speed = Math.min(newCar.maxSpeed * 1.5, newCar.speed + 0.5)
        newCar.nitro = Math.max(0, newCar.nitro - 2)
      } else {
        newCar.nitro = Math.min(100, newCar.nitro + 0.1)
      }

      // Movement
      const radians = (newCar.angle * Math.PI) / 180
      newCar.x += Math.sin(radians) * newCar.speed
      newCar.y -= Math.cos(radians) * newCar.speed

      // Keep car on screen
      newCar.x = Math.max(50, Math.min(gameAreaSize.width - 50, newCar.x))
      newCar.y = Math.max(50, Math.min(gameAreaSize.height - 50, newCar.y))

      // Drift detection
      const lateralVelocity = Math.abs(newCar.speed * Math.sin((newCar.angle - (Math.atan2(newCar.speed, 1) * 180 / Math.PI)) * Math.PI / 180))
      if (lateralVelocity > 1 && Math.abs(newCar.speed) > 2) {
        setIsDrifting(true)
        setStats(prevStats => ({
          ...prevStats,
          driftPoints: prevStats.driftPoints + Math.floor(lateralVelocity * 10),
          score: prevStats.score + Math.floor(lateralVelocity * 5)
        }))
      } else {
        setIsDrifting(false)
      }

      return newCar
    })

    // Update opponents
    setOpponents(prev => prev.map(opponent => {
      // Simple AI movement
      opponent.y -= opponent.speed
      if (opponent.y < -100) {
        opponent.y = gameAreaSize.height + 100
        opponent.x = 300 + Math.random() * 200
      }
      
      // Add some steering variation
      opponent.angle += (Math.random() - 0.5) * 2
      opponent.x += Math.sin((opponent.angle * Math.PI) / 180) * 1
      
      // Keep opponents on track
      opponent.x = Math.max(250, Math.min(550, opponent.x))
      
      return opponent
    }))

    // Update stats
    setStats(prev => ({
      ...prev,
      speed: Math.round(Math.abs(playerCar.speed * 20)), // Convert to "km/h"
      currentLapTime: gameTime,
      nitroLevel: playerCar.nitro,
      totalDistance: prev.totalDistance + Math.abs(playerCar.speed)
    }))

    animationFrameRef.current = requestAnimationFrame(updateGame)
  }, [gameStatus, keys, playerCar, gameTime])

  useEffect(() => {
    if (gameStatus === 'playing') {
      updateGame()
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateGame, gameStatus])

  const startGame = () => {
    setGameStarted(true)
    setGameStatus('playing')
    setStats({
      score: 0,
      lap: 1,
      position: 1,
      speed: 0,
      driftPoints: 0,
      totalDistance: 0,
      bestLapTime: 0,
      currentLapTime: 0,
      nitroLevel: 100,
      health: 100
    })
    setPlayerCar({
      x: 400,
      y: 500,
      angle: 0,
      speed: 0,
      maxSpeed: 8,
      drift: 0,
      nitro: 100,
      health: 100
    })
    setGameTime(0)
    toast.success('Rennen gestartet!', { description: 'Zeige deine Drift-Skills!' })
  }

  const pauseGame = () => {
    setGameStatus(gameStatus === 'paused' ? 'playing' : 'paused')
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameStatus('menu')
    setGameTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      <div className="max-w-full mx-auto">
        {/* Game Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold gradient-text mb-2">
              🏎️ GLXY Drift Racer
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={gameStatus === 'playing' ? 'default' : 'secondary'}>
                {gameStatus === 'playing' ? 'Racing' : gameStatus === 'paused' ? 'Pausiert' : gameStatus === 'finished' ? 'Finished' : 'Bereit'}
              </Badge>
              {gameStarted && (
                <>
                  <span>Lap: {stats.lap}/{settings.laps}</span>
                  <span>Score: {stats.score.toLocaleString()}</span>
                  <span>Zeit: {formatTime(gameTime)}</span>
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
                  <DialogTitle>Racing Einstellungen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Spielmodus</Label>
                    <Select value={settings.mode} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, mode: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drift">Drift Challenge</SelectItem>
                        <SelectItem value="circuit">Circuit Race</SelectItem>
                        <SelectItem value="timeAttack">Time Attack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Strecke</Label>
                    <Select value={settings.track} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, track: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">Stadt</SelectItem>
                        <SelectItem value="mountain">Berg</SelectItem>
                        <SelectItem value="desert">Wüste</SelectItem>
                        <SelectItem value="highway">Autobahn</SelectItem>
                        <SelectItem value="night">Nacht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Steuerung</Label>
                    <Select value={settings.controlScheme} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, controlScheme: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wasd">WASD Tasten</SelectItem>
                        <SelectItem value="arrows">Pfeiltasten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Sound</Label>
                    <Switch 
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, soundEnabled: checked }))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {!gameStarted || gameStatus === 'finished' ? (
              <Button onClick={startGame} className="gap-2">
                <Play className="w-4 h-4" />
                {gameStatus === 'finished' ? 'Neu starten' : 'Race starten'}
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
              <Card className="bg-black/50 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🏎️</div>
                      <div className="text-2xl font-orbitron font-bold text-blue-400">{stats.speed}</div>
                      <div className="text-xs text-muted-foreground">km/h</div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          Nitro
                        </span>
                        <span className="text-yellow-400">{Math.round(stats.nitroLevel)}%</span>
                      </div>
                      <Progress value={stats.nitroLevel} className="h-2 bg-yellow-900" />
                    </div>

                    <div>
                      <div className="text-sm text-center">
                        <span className={`font-bold ${isDrifting ? 'text-orange-400' : 'text-muted-foreground'}`}>
                          {isDrifting ? 'DRIFT!' : 'NORMAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-gaming-primary/20">
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="text-gaming-primary font-bold">{stats.score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Position:</span>
                    <span className="text-green-400">{stats.position}/4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drift Punkte:</span>
                    <span className="text-orange-400">{stats.driftPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distanz:</span>
                    <span className="text-blue-400">{Math.round(stats.totalDistance)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zeit:</span>
                    <span className="text-yellow-400">{formatTime(stats.currentLapTime)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-sm text-yellow-400">Steuerung</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  {settings.controlScheme === 'wasd' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span>W</span>
                        <span>Gas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>S</span>
                        <span>Bremse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>A/D</span>
                        <span>Lenken</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Space</span>
                        <span>Nitro</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-3 h-3" />
                        <span>Gas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-3 h-3" />
                        <span>Bremse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowLeft className="w-3 h-3" />
                        <ArrowRight className="w-3 h-3" />
                        <span>Lenken</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Space</span>
                        <span>Nitro</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Game Area */}
            <div className="lg:col-span-8">
              <Card className="relative overflow-hidden bg-gradient-to-b from-sky-800 via-green-800 to-gray-900 border-gaming-primary/30">
                <CardContent className="p-0">
                  <div 
                    ref={gameAreaRef}
                    className="relative"
                    style={{ 
                      width: gameAreaSize.width, 
                      height: gameAreaSize.height,
                    }}
                  >
                    {/* Road */}
                    <div className="absolute inset-0 bg-gradient-to-b from-green-600/20 via-gray-600/30 to-green-700/20">
                      {/* Road surface */}
                      <div 
                        className="absolute bg-gray-700"
                        style={{
                          left: '25%',
                          right: '25%',
                          top: 0,
                          bottom: 0,
                          backgroundImage: `
                            linear-gradient(to bottom, transparent 48%, white 50%, transparent 52%),
                            linear-gradient(to bottom, yellow 0%, yellow 100%)
                          `,
                          backgroundSize: '100% 60px, 4px 60px',
                          backgroundPosition: 'center, 50% center'
                        }}
                      />
                      
                      {/* Road edges */}
                      <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-white" />
                      <div className="absolute right-1/4 top-0 bottom-0 w-1 bg-white" />
                      
                      {/* Road stripes */}
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 bg-white opacity-80"
                          style={{
                            left: '50%',
                            top: `${i * 8}%`,
                            height: '4%',
                            transform: 'translateX(-50%)',
                            animation: gameStatus === 'playing' ? `roadMove 1s linear infinite` : 'none'
                          }}
                        />
                      ))}
                    </div>

                    {/* Player Car */}
                    <motion.div
                      className="absolute z-20"
                      style={{
                        left: playerCar.x - 15,
                        top: playerCar.y - 15,
                        transform: `rotate(${playerCar.angle}deg)`
                      }}
                      animate={isDrifting ? {
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="relative">
                        <div className="w-8 h-12 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg rounded-b-sm border-2 border-blue-300 shadow-lg">
                          {/* Car details */}
                          <div className="absolute top-1 left-1 right-1 h-2 bg-sky-200 rounded" />
                          <div className="absolute bottom-1 left-0 w-2 h-1 bg-gray-800 rounded" />
                          <div className="absolute bottom-1 right-0 w-2 h-1 bg-gray-800 rounded" />
                        </div>
                        
                        {/* Drift smoke */}
                        {isDrifting && (
                          <motion.div
                            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                              scale: [0, 1.5, 0],
                              opacity: [0, 0.7, 0]
                            }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            <div className="w-6 h-3 bg-gray-400 rounded-full blur-sm" />
                          </motion.div>
                        )}
                        
                        {/* Nitro flames */}
                        {keys.space && stats.nitroLevel > 0 && (
                          <motion.div
                            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                            animate={{ 
                              scale: [0.8, 1.2, 0.8],
                              opacity: [0.8, 1, 0.8]
                            }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                          >
                            <div className="w-3 h-4 bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Opponent Cars */}
                    <AnimatePresence>
                      {opponents.map((opponent) => (
                        <motion.div
                          key={opponent.id}
                          className="absolute z-10"
                          style={{
                            left: opponent.x - 12,
                            top: opponent.y - 12,
                            transform: `rotate(${opponent.angle}deg)`
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <div 
                            className="w-6 h-10 rounded-t-lg rounded-b-sm border border-white/30 shadow-md"
                            style={{ backgroundColor: opponent.color }}
                          >
                            {/* Simple car details */}
                            <div className="absolute top-0.5 left-0.5 right-0.5 h-1 bg-white/50 rounded" />
                            <div className="absolute bottom-0.5 left-0 w-1 h-0.5 bg-gray-800 rounded" />
                            <div className="absolute bottom-0.5 right-0 w-1 h-0.5 bg-gray-800 rounded" />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Game Status Overlays */}
                    {gameStatus === 'paused' && (
                      <motion.div
                        className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-center">
                          <Pause className="w-16 h-16 mx-auto mb-4 text-gaming-primary" />
                          <h3 className="text-2xl font-bold mb-4">Rennen pausiert</h3>
                          <Button onClick={pauseGame}>
                            <Play className="w-4 h-4 mr-2" />
                            Fortsetzen
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {gameStatus === 'finished' && (
                      <motion.div
                        className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-center">
                          <div className="text-6xl mb-4">🏁</div>
                          <h3 className="text-3xl font-bold mb-4 text-gaming-primary">RENNEN BEENDET!</h3>
                          <div className="space-y-2 mb-6">
                            <p>Final Score: <span className="text-gaming-primary font-bold">{stats.score.toLocaleString()}</span></p>
                            <p>Position: <span className="text-green-400 font-bold">{stats.position}/4</span></p>
                            <p>Drift Punkte: <span className="text-orange-400 font-bold">{stats.driftPoints.toLocaleString()}</span></p>
                            <p>Endzeit: <span className="text-yellow-400 font-bold">{formatTime(stats.currentLapTime)}</span></p>
                          </div>
                          <div className="flex gap-4 justify-center">
                            <Button onClick={startGame} className="gap-2">
                              <Play className="w-4 h-4" />
                              Nochmal fahren
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

              <div className="mt-2 text-center text-xs text-muted-foreground">
                🏎️ {settings.controlScheme === 'wasd' ? 'WASD' : 'Pfeiltasten'}: Fahren | Space: Nitro | ESC: Pause
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
                    <span>2. Speed Demon</span>
                    <span>25,430</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>3. Drift King</span>
                    <span>22,180</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>4. Racer X</span>
                    <span>19,850</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-sm text-orange-400">Drift Tipps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>• Halte die Geschwindigkeit hoch</div>
                  <div>• Nutze sanfte Lenkbewegungen</div>
                  <div>• Timing ist entscheidend</div>
                  <div>• Nutze Nitro in Kurven</div>
                  <div>• Vermeide Kollisionen</div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-sm text-green-400">Track Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Strecke:</span>
                    <span className="text-green-400">{settings.track === 'city' ? 'Stadt' : settings.track === 'mountain' ? 'Berg' : settings.track === 'desert' ? 'Wüste' : settings.track === 'highway' ? 'Autobahn' : 'Nacht'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modus:</span>
                    <span className="text-blue-400">{settings.mode === 'drift' ? 'Drift' : settings.mode === 'circuit' ? 'Circuit' : 'Time Attack'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Runden:</span>
                    <span className="text-yellow-400">{stats.lap}/{settings.laps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schwierigkeit:</span>
                    <span className="text-red-400">{settings.difficulty === 'easy' ? 'Einfach' : settings.difficulty === 'medium' ? 'Mittel' : settings.difficulty === 'hard' ? 'Schwer' : 'Pro'}</span>
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
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                🏎️
              </motion.div>
              
              <motion.h2 
                className="text-5xl font-orbitron font-bold mb-6 gradient-text"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Drift Racing
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground mb-12 text-2xl leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Meistere die Kunst des Driftens! Fahre durch herausfordernde Strecken, sammle Punkte und werde zum Drift King!
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
                    className="gap-3 text-2xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-blue-500/40 border-2 border-blue-500/30"
                  >
                    <Car className="w-8 h-8" />
                    Race starten
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
                  className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-4xl mb-3">🏁</div>
                  <div className="font-semibold text-blue-400">Racing</div>
                  <div className="text-sm text-muted-foreground mt-1">Geschwindigkeit zählt</div>
                </motion.div>
                <motion.div 
                  className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-4xl mb-3">🌀</div>
                  <div className="font-semibold text-orange-400">Drifting</div>
                  <div className="text-sm text-muted-foreground mt-1">Style-Punkte sammeln</div>
                </motion.div>
                <motion.div 
                  className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className="text-4xl mb-3">⚡</div>
                  <div className="font-semibold text-purple-400">Nitro</div>
                  <div className="text-sm text-muted-foreground mt-1">Turbo Boost</div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="mt-8 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                🏎️ WASD/Pfeiltasten zum Fahren • Space für Nitro • Drift für Punkte
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes roadMove {
          from { transform: translateX(-50%) translateY(0%); }
          to { transform: translateX(-50%) translateY(100%); }
        }
      `}</style>
    </div>
  )
}
