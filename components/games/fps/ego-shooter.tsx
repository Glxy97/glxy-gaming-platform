// @ts-nocheck

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Crosshair, 
  Settings, 
  Volume2, 
  VolumeX, 
  Users, 
  Bot, 
  Target, 
  Zap, 
  Shield,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Trophy
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

interface GameSettings {
  mode: 'single' | 'online' | '1v1' | 'deathmatch' | 'team'
  difficulty: 'easy' | 'medium' | 'hard' | 'insane'
  map: 'arena' | 'warehouse' | 'rooftop' | 'desert' | 'space'
  timeLimit: number // minutes
  scoreLimit: number
  powerUpsEnabled: boolean
  soundEnabled: boolean
  sensitivity: number
  crosshairStyle: 'dot' | 'cross' | 'circle' | 'triangle'
  fov: number // field of view
}

interface Player {
  id: string
  username: string
  position: { x: number, y: number, z: number }
  rotation: { x: number, y: number }
  health: number
  armor: number
  score: number
  kills: number
  deaths: number
  powerUps: string[]
  weapon: string
}

interface PowerUp {
  id: string
  type: 'health' | 'armor' | 'speed' | 'damage' | 'ammo' | 'shield'
  position: { x: number, y: number, z: number }
  active: boolean
  respawnTime: number
}

interface Projectile {
  id: string
  position: { x: number, y: number, z: number }
  velocity: { x: number, y: number, z: number }
  damage: number
  playerId: string
}

const defaultSettings: GameSettings = {
  mode: 'single',
  difficulty: 'medium',
  map: 'arena',
  timeLimit: 10,
  scoreLimit: 25,
  powerUpsEnabled: true,
  soundEnabled: true,
  sensitivity: 50,
  crosshairStyle: 'cross',
  fov: 90
}

export function EgoShooter() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setPaused] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 50, y: 50 })
  const [showChat, setShowChat] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'starting' | 'playing' | 'ended'>('waiting')
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMouseLocked, setMouseLocked] = useState(false)

  // Initialize player
  useEffect(() => {
    if (gameStarted && !currentPlayer) {
      const newPlayer: Player = {
        id: 'player-1',
        username: 'Player',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0 },
        health: 100,
        armor: 0,
        score: 0,
        kills: 0,
        deaths: 0,
        powerUps: [],
        weapon: 'rifle'
      }
      setCurrentPlayer(newPlayer)
      setPlayers([newPlayer])
    }
  }, [gameStarted, currentPlayer])

  // Game timer
  useEffect(() => {
    if (gameStatus === 'playing' && !isPaused) {
      const timer = setInterval(() => {
        setGameTime(prev => {
          if (prev >= settings.timeLimit * 60) {
            setGameStatus('ended')
            return prev
          }
          return prev + 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }

    return () => {} // Return empty cleanup function for else case
  }, [gameStatus, isPaused, settings.timeLimit])

  // Mouse movement handling
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseLocked || !gameAreaRef.current) return
    
    const sensitivity = settings.sensitivity / 100
    const deltaX = e.movementX * sensitivity
    const deltaY = e.movementY * sensitivity
    
    setCrosshairPosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x + deltaX)),
      y: Math.max(0, Math.min(100, prev.y + deltaY))
    }))
  }, [isMouseLocked, settings.sensitivity])

  useEffect(() => {
    if (isMouseLocked) {
      document.addEventListener('mousemove', handleMouseMove)
      return () => document.removeEventListener('mousemove', handleMouseMove)
    }

    return () => {} // Return empty cleanup function for else case
  }, [isMouseLocked, handleMouseMove])

  // Mouse lock handling
  const requestPointerLock = () => {
    if (gameAreaRef.current && gameStatus === 'playing') {
      try {
        gameAreaRef.current.requestPointerLock()
      } catch (error) {
        console.warn('Pointer lock not supported in this environment')
        setMouseLocked(false)
      }
    }
  }

  useEffect(() => {
    const handlePointerLockChange = () => {
      setMouseLocked(document.pointerLockElement === gameAreaRef.current)
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange)
  }, [])

  const startGame = () => {
    setGameStarted(true)
    setGameStatus('starting')
    setTimeout(() => setGameStatus('playing'), 3000)
    setGameTime(0)
    generatePowerUps()
  }

  const pauseGame = () => {
    setPaused(!isPaused)
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameStatus('waiting')
    setGameTime(0)
    setCurrentPlayer(null)
    setPlayers([])
    setPowerUps([])
    setProjectiles([])
    setCrosshairPosition({ x: 50, y: 50 })
    setMouseLocked(false)
  }

  const generatePowerUps = () => {
    const powerUpTypes: PowerUp['type'][] = ['health', 'armor', 'speed', 'damage', 'ammo', 'shield']
    const newPowerUps: PowerUp[] = []
    
    for (let i = 0; i < 8; i++) {
      newPowerUps.push({
        id: `powerup-${i}`,
        type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
        position: {
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          z: 0
        },
        active: true,
        respawnTime: 30
      })
    }
    
    setPowerUps(newPowerUps)
  }

  const handleShoot = () => {
    if (!currentPlayer || gameStatus !== 'playing' || isPaused) return
    
    const newProjectile: Projectile = {
      id: `projectile-${Date.now()}`,
      position: { ...currentPlayer.position },
      velocity: {
        x: (crosshairPosition.x - 50) / 10,
        y: (crosshairPosition.y - 50) / 10,
        z: 10
      },
      damage: 25,
      playerId: currentPlayer.id
    }
    
    setProjectiles(prev => [...prev, newProjectile])
    
    // Remove projectile after 2 seconds
    setTimeout(() => {
      setProjectiles(prev => prev.filter(p => p.id !== newProjectile.id))
    }, 2000)
    
    if (settings.soundEnabled) {
      // Add sound effect here
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const powerUpColors = {
    health: 'text-red-500',
    armor: 'text-blue-500',
    speed: 'text-green-500',
    damage: 'text-orange-500',
    ammo: 'text-yellow-500',
    shield: 'text-purple-500'
  }

  const powerUpIcons = {
    health: '❤️',
    armor: '🛡️',
    speed: '⚡',
    damage: '💥',
    ammo: '🔫',
    shield: '🔷'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-full mx-auto">
        {/* Game Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 bg-black/50 backdrop-blur-md">
          <div>
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold gradient-text mb-2">
              🎯 GLXY Ego-Shooter
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={gameStatus === 'playing' ? 'default' : 'secondary'}>
                {gameStatus === 'playing' ? 'Spiel läuft' : gameStatus === 'waiting' ? 'Warten' : 'Beendet'}
              </Badge>
              <span>Modus: {settings.mode}</span>
              <span>Map: {settings.map}</span>
              {gameStatus === 'playing' && (
                <span>Zeit: {formatTime(gameTime)}/{settings.timeLimit}m</span>
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
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Spiel Einstellungen
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="game" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="game">Spiel</TabsTrigger>
                    <TabsTrigger value="controls">Steuerung</TabsTrigger>
                    <TabsTrigger value="graphics">Grafik</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="game" className="space-y-4">
                    <div>
                      <Label>Spiel Modus</Label>
                      <Select value={settings.mode} onValueChange={(value: any) => 
                        setSettings(prev => ({ ...prev, mode: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Singleplayer</SelectItem>
                          <SelectItem value="online">Online Multiplayer</SelectItem>
                          <SelectItem value="1v1">1vs1 Duell</SelectItem>
                          <SelectItem value="deathmatch">Deathmatch</SelectItem>
                          <SelectItem value="team">Team Battle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Map</Label>
                      <Select value={settings.map} onValueChange={(value: any) => 
                        setSettings(prev => ({ ...prev, map: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arena">Arena</SelectItem>
                          <SelectItem value="warehouse">Lagerhaus</SelectItem>
                          <SelectItem value="rooftop">Dach</SelectItem>
                          <SelectItem value="desert">Wüste</SelectItem>
                          <SelectItem value="space">Weltraum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
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
                          <SelectItem value="insane">Wahnsinn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Zeit Limit (Minuten): {settings.timeLimit}</Label>
                      <Slider
                        value={[settings.timeLimit]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, timeLimit: value }))}
                        max={30}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Score Limit: {settings.scoreLimit}</Label>
                      <Slider
                        value={[settings.scoreLimit]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, scoreLimit: value }))}
                        max={100}
                        min={5}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>PowerUps aktivieren</Label>
                      <Switch 
                        checked={settings.powerUpsEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, powerUpsEnabled: checked }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="controls" className="space-y-4">
                    <div>
                      <Label>Maus Empfindlichkeit: {settings.sensitivity}%</Label>
                      <Slider
                        value={[settings.sensitivity]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, sensitivity: value }))}
                        max={200}
                        min={10}
                        step={5}
                        className="mt-2"
                      />
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
                          <SelectItem value="triangle">Dreieck</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="graphics" className="space-y-4">
                    <div>
                      <Label>Sichtfeld (FOV): {settings.fov}°</Label>
                      <Slider
                        value={[settings.fov]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, fov: value }))}
                        max={120}
                        min={60}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="audio" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Sound Effekte</Label>
                      <Switch 
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, soundEnabled: checked }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Game Controls */}
            {!gameStarted ? (
              <Button onClick={startGame} className="gap-2">
                <Play className="w-4 h-4" />
                Spiel starten
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={pauseGame} size="sm">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={resetGame} size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Button variant="outline" onClick={() => setShowChat(!showChat)} size="sm">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-4">
          {/* Left HUD */}
          <div className="lg:col-span-1 space-y-4">
            {currentPlayer && (
              <>
                {/* Health & Armor */}
                <Card className="bg-black/50 border-gaming-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Gesundheit</span>
                        <span className="text-red-400">{currentPlayer.health}%</span>
                      </div>
                      <Progress value={currentPlayer.health} className="h-3 bg-red-900" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Rüstung</span>
                        <span className="text-blue-400">{currentPlayer.armor}%</span>
                      </div>
                      <Progress value={currentPlayer.armor} className="h-3 bg-blue-900" />
                    </div>
                  </CardContent>
                </Card>

                {/* Score & Stats */}
                <Card className="bg-black/50 border-gaming-secondary/20">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gaming-primary">{currentPlayer.kills}</div>
                        <div className="text-xs text-muted-foreground">Kills</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-400">{currentPlayer.deaths}</div>
                        <div className="text-xs text-muted-foreground">Deaths</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-3xl font-bold text-gaming-secondary">{currentPlayer.score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active PowerUps */}
                {currentPlayer.powerUps.length > 0 && (
                  <Card className="bg-black/50 border-gaming-accent/20">
                    <CardHeader>
                      <CardTitle className="text-sm">PowerUps</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {currentPlayer.powerUps.map((powerUp, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {powerUpIcons[powerUp as keyof typeof powerUpIcons]} {powerUp}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Game Area */}
          <div className="lg:col-span-4">
            <Card className="relative overflow-hidden bg-black border-gaming-primary/30">
              <CardContent className="p-0">
                <div 
                  ref={gameAreaRef}
                  className="relative aspect-[16/9] bg-gradient-to-b from-gray-800 to-gray-900 cursor-crosshair"
                  onClick={requestPointerLock}
                >
                  {/* Game Background */}
                  <div className="absolute inset-0">
                    {/* Map-specific background */}
                    {settings.map === 'arena' && (
                      <div className="absolute inset-0 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900">
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNDQ0IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                        </div>
                      </div>
                    )}

                    {/* PowerUps */}
                    <AnimatePresence>
                      {settings.powerUpsEnabled && powerUps.filter(p => p.active).map((powerUp) => (
                        <motion.div
                          key={powerUp.id}
                          className={`absolute w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border-2 ${powerUpColors[powerUp.type]} border-current`}
                          style={{
                            left: `${powerUp.position.x}%`,
                            top: `${powerUp.position.y}%`
                          }}
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: 360
                          }}
                          exit={{ scale: 0 }}
                          transition={{ 
                            scale: { duration: 2, repeat: Infinity },
                            rotate: { duration: 4, repeat: Infinity, ease: "linear" }
                          }}
                        >
                          <span className="text-lg">
                            {powerUpIcons[powerUp.type]}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Projectiles */}
                    <AnimatePresence>
                      {projectiles.map((projectile) => (
                        <motion.div
                          key={projectile.id}
                          className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
                          initial={{ 
                            left: '50%',
                            top: '50%',
                            scale: 0
                          }}
                          animate={{
                            left: `${50 + projectile.velocity.x * 5}%`,
                            top: `${50 + projectile.velocity.y * 5}%`,
                            scale: 1
                          }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 2, ease: "linear" }}
                        />
                      ))}
                    </AnimatePresence>

                    {/* Crosshair */}
                    <motion.div
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${crosshairPosition.x}%`,
                        top: `${crosshairPosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {settings.crosshairStyle === 'cross' && (
                        <Crosshair className="w-8 h-8 text-gaming-primary drop-shadow-glow" />
                      )}
                      {settings.crosshairStyle === 'dot' && (
                        <div className="w-2 h-2 bg-gaming-primary rounded-full shadow-lg shadow-gaming-primary/50" />
                      )}
                      {settings.crosshairStyle === 'circle' && (
                        <div className="w-6 h-6 border-2 border-gaming-primary rounded-full shadow-lg shadow-gaming-primary/50" />
                      )}
                      {settings.crosshairStyle === 'triangle' && (
                        <div className="w-0 h-0 border-l-3 border-r-3 border-b-4 border-l-transparent border-r-transparent border-b-gaming-primary" />
                      )}
                    </motion.div>

                    {/* Click to shoot instruction */}
                    {!isMouseLocked && gameStatus === 'playing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center text-white">
                          <Target className="w-16 h-16 mx-auto mb-4 text-gaming-primary" />
                          <h3 className="text-xl font-bold mb-2">Klicken zum Spielen</h3>
                          <p className="text-sm text-muted-foreground">
                            Klicke um die Maus zu sperren und zu spielen
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Game starting countdown */}
                    {gameStatus === 'starting' && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-black/80"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          className="text-8xl font-orbitron font-bold text-gaming-primary"
                          animate={{ scale: [0.8, 1.2, 1] }}
                          transition={{ duration: 1, repeat: 2 }}
                        >
                          3
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Pause overlay */}
                    {isPaused && (
                      <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-center text-white">
                          <Pause className="w-16 h-16 mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Spiel pausiert</h3>
                          <Button onClick={pauseGame} variant="outline">
                            <Play className="w-4 h-4 mr-2" />
                            Fortsetzen
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Click handler for shooting */}
                  {isMouseLocked && gameStatus === 'playing' && !isPaused && (
                    <div 
                      className="absolute inset-0 cursor-none"
                      onClick={handleShoot}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls hint */}
            <div className="mt-2 text-center text-xs text-muted-foreground">
              WASD: Bewegen | Maus: Zielen | Klick: Schießen | ESC: Pause | {isMouseLocked ? 'ESC: Maus entsperren' : 'Klick: Maus sperren'}
            </div>
          </div>

          {/* Right Panel - Leaderboard & Chat */}
          <div className="lg:col-span-1 space-y-4">
            {/* Mini Leaderboard */}
            <Card className="bg-black/50 border-gaming-secondary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Bestenliste
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {players.sort((a, b) => b.score - a.score).slice(0, 5).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'secondary'} className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className={`${player.id === currentPlayer?.id ? 'text-gaming-primary font-bold' : ''}`}>
                          {player.username}
                        </span>
                      </div>
                      <span>{player.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            {showChat && (
              <Card className="bg-black/50 border-gaming-accent/20 h-64">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-center text-muted-foreground text-xs">
                    Chat wird in Multiplayer-Spielen verfügbar sein
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
