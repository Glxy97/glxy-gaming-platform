// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, Zap, Shield, Bomb, Heart, Trophy, Target,
  RotateCcw, Play, Pause, Volume2, VolumeX, Users
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

// Game Types
type Player = {
  id: string
  name: string
  x: number
  y: number
  angle: number
  speed: number
  health: number
  shield: number
  ammunition: number
  score: number
  color: string
  isEliminated: boolean
  powerUps: PowerUpType[]
}

type PowerUpType = 'speed' | 'shield' | 'health' | 'bomb' | 'laser'
type PowerUp = {
  id: string
  type: PowerUpType
  x: number
  y: number
  duration?: number
}

type Projectile = {
  id: string
  playerId: string
  x: number
  y: number
  angle: number
  speed: number
  damage: number
  type: 'bullet' | 'laser' | 'bomb'
}

type GameMode = 'solo' | 'multiplayer'
type GameState = 'menu' | 'playing' | 'paused' | 'ended' | 'waiting'

// Game Configuration
const GAME_CONFIG = {
  ARENA_WIDTH: 800,
  ARENA_HEIGHT: 600,
  PLAYER_SIZE: 30,
  MAX_SPEED: 5,
  ACCELERATION: 0.2,
  FRICTION: 0.95,
  TURN_SPEED: 0.15,
  MAX_HEALTH: 100,
  MAX_SHIELD: 50,
  MAX_AMMUNITION: 10,
  PROJECTILE_SPEED: 8,
  POWER_UP_SPAWN_RATE: 0.02,
  SHRINKING_RATE: 0.5,
  SAFE_ZONE_COLOR: '#22c55e',
  DANGER_ZONE_COLOR: '#ef4444'
}

const POWER_UP_EFFECTS = {
  speed: { duration: 5000, multiplier: 1.5, icon: '⚡', color: '#fbbf24' },
  shield: { duration: 8000, amount: 25, icon: '🛡️', color: '#3b82f6' },
  health: { duration: 0, amount: 30, icon: '❤️', color: '#ef4444' },
  bomb: { duration: 0, damage: 50, radius: 80, icon: '💣', color: '#8b5cf6' },
  laser: { duration: 3000, damage: 25, icon: '🔥', color: '#f97316' }
}

interface BattleRoyaleRacingProps {
  gameMode?: GameMode
  roomId?: string
  onLeaveRoom?: () => void
}

export function BattleRoyaleRacing({
  gameMode = 'solo',
  roomId,
  onLeaveRoom
}: BattleRoyaleRacingProps) {
  // Game State
  const [gameState, setGameState] = useState<GameState>('menu')
  const [players, setPlayers] = useState<Player[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [safeZoneRadius, setSafeZoneRadius] = useState(GAME_CONFIG.ARENA_WIDTH / 2)
  const [playersAlive, setPlayersAlive] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [winner, setWinner] = useState<Player | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Refs
  const gameLoopRef = useRef<ReturnType<typeof setInterval>>()
  const keysRef = useRef<Set<string>>(new Set())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Socket for multiplayer
  const socket = useSocket()

  // Player Colors
  const PLAYER_COLORS = [
    '#ef4444', '#3b82f6', '#22c55e', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  // Initialize Game
  const initializeGame = useCallback(() => {
    const initialPlayers: Player[] = []
    const playerCount = gameMode === 'solo' ? 8 : 1 // In multiplayer, other players join via socket

    for (let i = 0; i < playerCount; i++) {
      const angle = (Math.PI * 2 * i) / playerCount
      const startRadius = 200
      const player: Player = {
        id: gameMode === 'solo' ? `bot-${i}` : `player-${Date.now()}`,
        name: gameMode === 'solo' ? `Bot ${i + 1}` : 'You',
        x: GAME_CONFIG.ARENA_WIDTH / 2 + Math.cos(angle) * startRadius,
        y: GAME_CONFIG.ARENA_HEIGHT / 2 + Math.sin(angle) * startRadius,
        angle: angle + Math.PI,
        speed: 0,
        health: GAME_CONFIG.MAX_HEALTH,
        shield: 0,
        ammunition: GAME_CONFIG.MAX_AMMUNITION,
        score: 0,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        isEliminated: false,
        powerUps: []
      }
      initialPlayers.push(player)
    }

    setPlayers(initialPlayers)
    setPlayersAlive(initialPlayers.length)
    setPowerUps([])
    setProjectiles([])
    setSafeZoneRadius(GAME_CONFIG.ARENA_WIDTH / 2)
    setGameTime(0)
    setWinner(null)
  }, [gameMode])

  // Bot AI Logic
  const updateBotAI = useCallback((bot: Player, players: Player[], powerUps: PowerUp[]) => {
    const centerX = GAME_CONFIG.ARENA_WIDTH / 2
    const centerY = GAME_CONFIG.ARENA_HEIGHT / 2
    const distanceToCenter = Math.sqrt((bot.x - centerX) ** 2 + (bot.y - centerY) ** 2)

    let targetX = centerX
    let targetY = centerY

    // Find nearest power-up
    const nearestPowerUp = powerUps.reduce((nearest, powerUp) => {
      const dist = Math.sqrt((bot.x - powerUp.x) ** 2 + (bot.y - powerUp.y) ** 2)
      return !nearest || dist < nearest.distance ? { powerUp, distance: dist } : nearest
    }, null as { powerUp: PowerUp, distance: number } | null)

    if (nearestPowerUp && nearestPowerUp.distance < 150) {
      targetX = nearestPowerUp.powerUp.x
      targetY = nearestPowerUp.powerUp.y
    }

    // Stay within safe zone
    if (distanceToCenter > safeZoneRadius - 50) {
      targetX = centerX
      targetY = centerY
    }

    // Calculate desired angle
    const desiredAngle = Math.atan2(targetY - bot.y, targetX - bot.x)
    let angleDiff = desiredAngle - bot.angle

    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    return {
      turnLeft: angleDiff < -0.1,
      turnRight: angleDiff > 0.1,
      accelerate: Math.abs(angleDiff) < 1,
      brake: bot.speed > 3,
      shoot: Math.random() < 0.05 && bot.ammunition > 0
    }
  }, [safeZoneRadius])

  // Game Loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    setGameTime(prev => prev + 1)

    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.isEliminated) return player

        let newPlayer = { ...player }

        // Bot AI or Player Controls
        let controls = { turnLeft: false, turnRight: false, accelerate: false, brake: false, shoot: false }

        if (player.id.startsWith('bot-')) {
          controls = updateBotAI(player, prevPlayers, powerUps)
        } else {
          controls = {
            turnLeft: keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA'),
            turnRight: keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD'),
            accelerate: keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW'),
            brake: keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS'),
            shoot: keysRef.current.has('Space')
          }
        }

        // Apply controls
        if (controls.turnLeft) newPlayer.angle -= GAME_CONFIG.TURN_SPEED
        if (controls.turnRight) newPlayer.angle += GAME_CONFIG.TURN_SPEED

        if (controls.accelerate) {
          newPlayer.speed = Math.min(newPlayer.speed + GAME_CONFIG.ACCELERATION, GAME_CONFIG.MAX_SPEED)
        }
        if (controls.brake) {
          newPlayer.speed = Math.max(newPlayer.speed - GAME_CONFIG.ACCELERATION * 2, 0)
        }

        // Apply friction
        newPlayer.speed *= GAME_CONFIG.FRICTION

        // Update position
        newPlayer.x += Math.cos(newPlayer.angle) * newPlayer.speed
        newPlayer.y += Math.sin(newPlayer.angle) * newPlayer.speed

        // Boundary collision
        newPlayer.x = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(GAME_CONFIG.ARENA_WIDTH - GAME_CONFIG.PLAYER_SIZE, newPlayer.x))
        newPlayer.y = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(GAME_CONFIG.ARENA_HEIGHT - GAME_CONFIG.PLAYER_SIZE, newPlayer.y))

        // Check safe zone damage
        const centerX = GAME_CONFIG.ARENA_WIDTH / 2
        const centerY = GAME_CONFIG.ARENA_HEIGHT / 2
        const distanceToCenter = Math.sqrt((newPlayer.x - centerX) ** 2 + (newPlayer.y - centerY) ** 2)

        if (distanceToCenter > safeZoneRadius) {
          newPlayer.health = Math.max(0, newPlayer.health - 2)
        }

        // Shooting
        if (controls.shoot && newPlayer.ammunition > 0) {
          setProjectiles(prev => [...prev, {
            id: `projectile-${Date.now()}-${Math.random()}`,
            playerId: newPlayer.id,
            x: newPlayer.x,
            y: newPlayer.y,
            angle: newPlayer.angle,
            speed: GAME_CONFIG.PROJECTILE_SPEED,
            damage: 15,
            type: 'bullet'
          }])
          newPlayer.ammunition--
        }

        // Check elimination
        if (newPlayer.health <= 0) {
          newPlayer.isEliminated = true
        }

        return newPlayer
      })
    })

    // Update projectiles
    setProjectiles(prev => {
      return prev.filter(projectile => {
        projectile.x += Math.cos(projectile.angle) * projectile.speed
        projectile.y += Math.sin(projectile.angle) * projectile.speed

        return projectile.x > 0 && projectile.x < GAME_CONFIG.ARENA_WIDTH &&
               projectile.y > 0 && projectile.y < GAME_CONFIG.ARENA_HEIGHT
      })
    })

    // Spawn power-ups
    if (Math.random() < GAME_CONFIG.POWER_UP_SPAWN_RATE) {
      const powerUpTypes: PowerUpType[] = ['speed', 'shield', 'health', 'bomb', 'laser']
      const newPowerUp: PowerUp = {
        id: `powerup-${Date.now()}`,
        type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
        x: Math.random() * (GAME_CONFIG.ARENA_WIDTH - 60) + 30,
        y: Math.random() * (GAME_CONFIG.ARENA_HEIGHT - 60) + 30
      }
      setPowerUps(prev => [...prev, newPowerUp])
    }

    // Shrink safe zone
    setSafeZoneRadius(prev => Math.max(100, prev - GAME_CONFIG.SHRINKING_RATE))
  }, [gameState, powerUps, updateBotAI, safeZoneRadius])

  // Render Game
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, GAME_CONFIG.ARENA_WIDTH, GAME_CONFIG.ARENA_HEIGHT)

    // Draw safe zone
    const centerX = GAME_CONFIG.ARENA_WIDTH / 2
    const centerY = GAME_CONFIG.ARENA_HEIGHT / 2

    // Danger zone
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'
    ctx.fillRect(0, 0, GAME_CONFIG.ARENA_WIDTH, GAME_CONFIG.ARENA_HEIGHT)

    // Safe zone
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, safeZoneRadius, 0, Math.PI * 2)
    ctx.fill()

    // Safe zone border
    ctx.strokeStyle = GAME_CONFIG.SAFE_ZONE_COLOR
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(centerX, centerY, safeZoneRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const effect = POWER_UP_EFFECTS[powerUp.type]
      ctx.fillStyle = effect.color
      ctx.fillRect(powerUp.x - 15, powerUp.y - 15, 30, 30)
      ctx.fillStyle = 'white'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(effect.icon, powerUp.x, powerUp.y + 7)
    })

    // Draw projectiles
    projectiles.forEach(projectile => {
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw players
    players.forEach(player => {
      if (player.isEliminated) return

      ctx.save()
      ctx.translate(player.x, player.y)
      ctx.rotate(player.angle)

      // Car body
      ctx.fillStyle = player.color
      ctx.fillRect(-15, -8, 30, 16)

      // Car details
      ctx.fillStyle = 'white'
      ctx.fillRect(8, -6, 6, 4)
      ctx.fillRect(8, 2, 6, 4)

      ctx.restore()

      // Health bar
      const barWidth = 40
      const barHeight = 6
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(player.x - barWidth/2, player.y - 25, barWidth, barHeight)
      ctx.fillStyle = player.health > 50 ? '#22c55e' : player.health > 25 ? '#f59e0b' : '#ef4444'
      ctx.fillRect(player.x - barWidth/2, player.y - 25, (player.health / 100) * barWidth, barHeight)

      // Shield bar
      if (player.shield > 0) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'
        ctx.fillRect(player.x - barWidth/2, player.y - 35, (player.shield / 50) * barWidth, 4)
      }

      // Player name
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(player.name, player.x, player.y - 40)
    })
  }, [players, powerUps, projectiles, safeZoneRadius])

  // Event Handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game Loop Effect
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        gameLoop()
        renderGame()
      }, 1000/60) // 60 FPS

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current)
        }
      }
    }
    // Explicit return for TypeScript compliance
    return undefined
  }, [gameState, gameLoop, renderGame])

  // Check game end condition
  useEffect(() => {
    const alivePlayers = players.filter(p => !p.isEliminated)
    setPlayersAlive(alivePlayers.length)

    if (alivePlayers.length <= 1 && gameState === 'playing' && players.length > 0) {
      setWinner(alivePlayers[0] || null)
      setGameState('ended')
    }
  }, [players, gameState])

  // Game Controls
  const startGame = () => {
    initializeGame()
    setGameState('playing')
  }

  const pauseGame = () => {
    setGameState(gameState === 'playing' ? 'paused' : 'playing')
  }

  const resetGame = () => {
    setGameState('menu')
    setPlayers([])
    setPowerUps([])
    setProjectiles([])
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }
  }

  // Leaderboard
  const leaderboard = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1
        if (!a.isEliminated && b.isEliminated) return -1
        return b.score - a.score
      })
      .slice(0, 8)
  }, [players])

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 p-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              🏁 Battle Royale Racing
            </h1>
            <p className="text-xl text-orange-200">
              Race, Fight, Survive - Last Car Standing Wins!
            </p>
          </motion.div>

          <motion.div
            className="bg-black/40 backdrop-blur rounded-xl p-8 border border-orange-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-4">🎮 Controls</h3>
                <div className="space-y-2">
                  <p><span className="font-bold">↑/W:</span> Accelerate</p>
                  <p><span className="font-bold">↓/S:</span> Brake</p>
                  <p><span className="font-bold">←/A:</span> Turn Left</p>
                  <p><span className="font-bold">→/D:</span> Turn Right</p>
                  <p><span className="font-bold">SPACE:</span> Shoot</p>
                </div>
              </div>

              <div className="text-white">
                <h3 className="text-2xl font-bold mb-4">🎯 Game Rules</h3>
                <div className="space-y-2 text-sm">
                  <p>• Stay within the shrinking safe zone</p>
                  <p>• Collect power-ups for advantages</p>
                  <p>• Shoot other players to eliminate them</p>
                  <p>• Last player standing wins!</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-yellow-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl">⚡</div>
                <div className="text-white text-sm font-bold">Speed Boost</div>
              </div>
              <div className="bg-blue-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl">🛡️</div>
                <div className="text-white text-sm font-bold">Shield</div>
              </div>
              <div className="bg-red-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl">❤️</div>
                <div className="text-white text-sm font-bold">Health Pack</div>
              </div>
              <div className="bg-purple-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl">💣</div>
                <div className="text-white text-sm font-bold">Bomb</div>
              </div>
              <div className="bg-orange-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl">🔥</div>
                <div className="text-white text-sm font-bold">Laser</div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={startGame}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-xl"
              >
                <Play className="h-6 w-6 mr-2" />
                Start Battle Royale
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="container mx-auto max-w-7xl">
        {/* HUD */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-900 text-green-100">
              <Users className="h-4 w-4 mr-1" />
              Alive: {playersAlive}
            </Badge>
            <Badge variant="outline" className="bg-blue-900 text-blue-100">
              Time: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}
            </Badge>
            <Badge variant="outline" className="bg-orange-900 text-orange-100">
              Safe Zone: {Math.floor(safeZoneRadius)}m
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pauseGame}
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Canvas */}
          <div className="lg:col-span-3">
            <Card className="bg-black border-gray-700">
              <CardContent className="p-4">
                <canvas
                  ref={canvasRef}
                  width={GAME_CONFIG.ARENA_WIDTH}
                  height={GAME_CONFIG.ARENA_HEIGHT}
                  className="border-2 border-gray-600 rounded-lg w-full max-w-full h-auto"
                  style={{ aspectRatio: `${GAME_CONFIG.ARENA_WIDTH}/${GAME_CONFIG.ARENA_HEIGHT}` }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Player Stats */}
            {!players.find(p => p.id.startsWith('player-'))?.isEliminated && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="text-white">
                  {(() => {
                    const player = players.find(p => p.id.startsWith('player-'))
                    if (!player) return null

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Health:</span>
                          <span>{player.health}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shield:</span>
                          <span>{player.shield}/50</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ammo:</span>
                          <span>{player.ammunition}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span>{player.score}</span>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        player.isEliminated ? 'bg-red-900/30' : 'bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">#{index + 1}</span>
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className={player.isEliminated ? 'text-gray-500 line-through' : 'text-white'}>
                          {player.name}
                        </span>
                      </div>
                      <span className="text-white">{player.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game End Modal */}
        <AnimatePresence>
          {gameState === 'ended' && (
            <motion.div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-900 rounded-xl p-8 border border-gray-700 text-center"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
              >
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {winner ? `${winner.name} Wins!` : 'Game Over'}
                </h2>
                <div className="text-gray-300 mb-6">
                  {winner && (
                    <>
                      <p>Score: {winner.score}</p>
                      <p>Survived: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={startGame} className="bg-orange-600 hover:bg-orange-700">
                    <Play className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                  <Button onClick={resetGame} variant="outline">
                    Back to Menu
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}