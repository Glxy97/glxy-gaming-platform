'use client'

import React, { useEffect, useRef, useState } from 'react'
import { UltimateFPSEngineV4 } from './core/UltimateFPSEngineV4'
import { GameModeSelector } from './ui/GameModeSelector'
import type { GameMode } from './types/GameTypes'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crosshair, Heart, Shield, Zap, Target, Award, Trophy } from 'lucide-react'

interface GameStats {
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  currentWeapon: {
    name: string
    currentAmmo: number
    magazineSize: number
    reserveAmmo: number
  }
  score: number
  kills: number
  deaths: number
  accuracy: number
  currentStreak: number
  longestStreak: number
  wave: number
  roundTime: number
}

export default function UltimateFPSGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<UltimateFPSEngineV4 | null>(null)

  const [gameStats, setGameStats] = useState<GameStats & { isDead?: boolean, isAiming?: boolean }>({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    currentWeapon: {
      name: 'GLXY M4A1 Tactical',
      currentAmmo: 30,
      magazineSize: 30,
      reserveAmmo: 120
    },
    score: 0,
    kills: 0,
    deaths: 0,
    accuracy: 0,
    currentStreak: 0,
    longestStreak: 0,
    wave: 1,
    roundTime: 0,
    isDead: false,
    isAiming: false
  })

  const [gameStarted, setGameStarted] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [selectedMode, setSelectedMode] = useState<GameMode>('zombie')

  useEffect(() => {
    if (!containerRef.current || !gameStarted) return

    // Initialize Engine V4 (PHASE 11 - Complete System Integration!)
    const engine = new UltimateFPSEngineV4(
      containerRef.current,
      (stats) => setGameStats(stats),
      (result) => console.log('Game End:', result),
      true // Enable multiplayer support (optional)
    )

    engineRef.current = engine

    // Cleanup
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
      }
    }
  }, [gameStarted])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!gameStarted) {
    // PROFESSIONELL: Mode Selector Screen
    if (showModeSelector) {
      return (
        <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* INTELLIGENT: Back Button */}
            <Button
              onClick={() => setShowModeSelector(false)}
              variant="outline"
              className="border-gray-700"
            >
              ← Back to Menu
            </Button>
            
            {/* PROFESSIONELL: Game Mode Selector */}
            <GameModeSelector
              currentMode={selectedMode}
              availableModes={['zombie', 'team-deathmatch', 'free-for-all', 'gun-game']}
              onModeChange={(mode) => {
                setSelectedMode(mode)
                console.log('🎯 Mode selected:', mode)
              }}
            />
            
            {/* KORREKT: Start Button */}
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  // INTELLIGENT: Initialize engine with selected mode
                  if (engineRef.current) {
                    engineRef.current.changeGameMode(selectedMode)
                  }
                  setGameStarted(true)
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 px-12 text-xl"
              >
                🎮 START GAME ({selectedMode.toUpperCase()})
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // LOGISCH: Main Menu Screen
    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="p-8 bg-black/50 backdrop-blur-lg border-purple-500/50 max-w-2xl">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                GLXY ULTIMATE FPS
              </h1>
              <p className="text-gray-400 text-lg">
                Das süchtig machendste Browser-FPS
              </p>
              <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/50 mt-2">
                ✨ V4: Complete System Integration (Phase 0-11)!
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <h3 className="text-purple-400 font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Features
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✅ 4 Game Modes</li>
                  <li>✅ 3D Three.js Engine</li>
                  <li>✅ 3 Waffen-Klassen</li>
                  <li>✅ Smart AI Enemies</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-pink-400 font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" /> Controls
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>WASD: Movement</li>
                  <li>Left Click: Shoot</li>
                  <li>Right Click: ADS (Aim)</li>
                  <li>1-3: Switch Weapon</li>
                  <li>R: Reload</li>
                </ul>
              </div>
            </div>

            {/* INTELLIGENT: Mode Selection Button */}
            <Button 
              onClick={() => setShowModeSelector(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 text-xl mb-2"
            >
              🎮 SELECT GAME MODE
            </Button>

            <Button 
              onClick={() => setGameStarted(true)}
              variant="outline"
              className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10 font-bold py-4 text-lg"
            >
              ⚡ QUICK START ({selectedMode})
            </Button>

            <p className="text-xs text-gray-500">
              Click "SELECT GAME MODE" to choose or "QUICK START" for default mode
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Game Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left - Health & Armor */}
        <div className="absolute top-4 left-4 space-y-2">
          <Card className="bg-black/70 backdrop-blur border-purple-500/30 p-3">
            <div className="space-y-2">
              {/* Health */}
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Health</span>
                    <span className="text-sm font-bold text-white">{Math.round(gameStats.health)}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                      style={{ width: `${(gameStats.health / gameStats.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Armor */}
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Armor</span>
                    <span className="text-sm font-bold text-white">{Math.round(gameStats.armor)}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                      style={{ width: `${(gameStats.armor / gameStats.maxArmor) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="bg-black/70 backdrop-blur border-purple-500/30 p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-green-500" />
                <span className="text-gray-400">Kills:</span>
                <span className="text-white font-bold">{gameStats.kills}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-400">Score:</span>
                <span className="text-white font-bold">{gameStats.score}</span>
              </div>
              <div className="flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-purple-500" />
                <span className="text-gray-400">Accuracy:</span>
                <span className="text-white font-bold">{Math.round(gameStats.accuracy)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-orange-500" />
                <span className="text-gray-400">Streak:</span>
                <span className="text-white font-bold">{gameStats.currentStreak}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Right - Timer & Wave */}
        <div className="absolute top-4 right-4">
          <Card className="bg-black/70 backdrop-blur border-purple-500/30 p-3">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-white font-mono">
                {formatTime(gameStats.roundTime)}
              </div>
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                Wave {gameStats.wave}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Bottom Center - Weapon Info */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <Card className="bg-black/70 backdrop-blur border-purple-500/30 p-4">
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-400">
                {gameStats.currentWeapon.name}
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {gameStats.currentWeapon.currentAmmo} / {gameStats.currentWeapon.magazineSize}
              </div>
              <div className="text-xs text-gray-500">
                Reserve: {gameStats.currentWeapon.reserveAmmo}
              </div>
            </div>
          </Card>
        </div>

        {/* Center - Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {gameStats.isAiming ? (
            <Crosshair className="w-4 h-4 text-red-500 opacity-90" />
          ) : (
            <Crosshair className="w-6 h-6 text-green-500 opacity-70" />
          )}
        </div>

        {/* ADS Indicator */}
        {gameStats.isAiming && !gameStats.isDead && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
            <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/50">
              🎯 ADS ACTIVE
            </Badge>
          </div>
        )}

        {/* Streak Notification */}
        {gameStats.currentStreak >= 5 && !gameStats.isDead && (
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2">
            <Card className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur border-purple-400 p-4 animate-pulse">
              <div className="text-center">
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  {gameStats.currentStreak}X STREAK!
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Death Screen */}
        {gameStats.isDead && (
          <div className="absolute inset-0 bg-red-900/50 backdrop-blur-sm flex items-center justify-center">
            <Card className="bg-black/80 border-red-500 p-8">
              <div className="text-center space-y-4">
                <div className="text-6xl">💀</div>
                <div className="text-4xl font-bold text-red-500">YOU DIED</div>
                <div className="text-xl text-white">Respawning in 3 seconds...</div>
                <div className="text-sm text-gray-400">
                  Kills: {gameStats.kills} | Deaths: {gameStats.deaths}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

