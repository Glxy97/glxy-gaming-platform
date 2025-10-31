// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { GameKeyboard } from './shared/GlobalGameKeyboardManager'
import { motion } from 'framer-motion'
import {
  Users,
  Bot,
  Settings,
  Play,
  Trophy,
  Star,
  Target,
  Gamepad2,
  Crown,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface GameStartMenuProps {
  gameType: string
  gameName: string
  gameIcon: string
  onStartGame: (mode: 'singleplayer' | 'multiplayer', config?: any) => void
  onClose?: () => void
}

export function GameStartMenu({
  gameType,
  gameName,
  gameIcon,
  onStartGame,
  onClose
}: GameStartMenuProps) {
  const [showSettings, setShowSettings] = useState(false)

  // Initialize global keyboard manager
  useEffect(() => {
    // Initialize with debug mode in development
    GameKeyboard.init({ debugMode: process.env.NODE_ENV === 'development' })

    // Set initial state to menu
    GameKeyboard.setGameState('menu')

    console.log(`🎮 GameStartMenu initialized for ${gameName} with global keyboard blocking`)

    // Cleanup on unmount
    return () => {
      GameKeyboard.setGameState('menu')
    }
  }, [gameName])
  const [selectedMode, setSelectedMode] = useState<'singleplayer' | 'multiplayer' | null>(null)
  const [singleplayerConfig, setSingleplayerConfig] = useState({
    difficulty: 'medium',
    aiPersonality: 'balanced',
    gameTime: 15
  })
  const [multiplayerConfig, setMultiplayerConfig] = useState({
    roomType: 'public',
    maxPlayers: 2,
    gameTime: 15,
    ranked: true
  })

  const handleStartGame = (mode: 'singleplayer' | 'multiplayer') => {
    const config = mode === 'singleplayer' ? singleplayerConfig : multiplayerConfig

    // Set game state to inGame before starting
    GameKeyboard.setGameState('inGame')

    console.log(`🎮 Starting ${gameName} in ${mode} mode with keyboard blocking enabled`)

    onStartGame(mode, config)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'hard': return 'text-orange-500'
      case 'expert': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '★☆☆☆'
      case 'medium': return '★★☆☆'
      case 'hard': return '★★★☆'
      case 'expert': return '★★★★'
      default: return '★☆☆☆'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-gaming-primary/30 shadow-2xl bg-background/95 backdrop-blur">
          <CardHeader className="text-center pb-6">
            <div className="text-6xl mb-4">{gameIcon}</div>
            <CardTitle className="text-3xl font-bold text-gaming-primary mb-2">
              {gameName}
            </CardTitle>
            <p className="text-muted-foreground">
              Wähle deinen Spielmodus und starte das Abenteuer
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {!selectedMode ? (
              // Main Menu
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Singleplayer */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMode('singleplayer')}
                  className="cursor-pointer"
                >
                  <Card className="border-2 border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                    <CardContent className="p-6 text-center">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-xl font-bold mb-2">Singleplayer</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Spiele gegen intelligente KI-Gegner
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Target className="h-3 w-3" />
                          <span>4 Schwierigkeitsgrade</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-3 w-3" />
                          <span>Verschiedene KI-Persönlichkeiten</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="h-3 w-3" />
                          <span>Offline verfügbar</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                        <Bot className="h-4 w-4 mr-2" />
                        Singleplayer starten
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Multiplayer */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMode('multiplayer')}
                  className="cursor-pointer"
                >
                  <Card className="border-2 border-gaming-primary/30 hover:border-gaming-primary/60 transition-all duration-300 bg-gradient-to-br from-gaming-primary/10 to-gaming-primary/5">
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gaming-primary" />
                      <h3 className="text-xl font-bold mb-2">Multiplayer</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Tritt gegen echte Spieler an
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="h-3 w-3" />
                          <span>Ranked & Casual Modi</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="h-3 w-3" />
                          <span>Real-time Gaming</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="h-3 w-3" />
                          <span>ELO Rating System</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-gaming-primary hover:bg-gaming-primary/90">
                        <Users className="h-4 w-4 mr-2" />
                        Multiplayer starten
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            ) : selectedMode === 'singleplayer' ? (
              // Singleplayer Configuration
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Bot className="h-6 w-6 text-blue-500" />
                  <h3 className="text-xl font-bold">Singleplayer Einstellungen</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Schwierigkeit</Label>
                      <Select
                        value={singleplayerConfig.difficulty}
                        onValueChange={(value) => setSingleplayerConfig(prev => ({ ...prev, difficulty: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">
                            <div className="flex items-center gap-2">
                              <span className={getDifficultyColor('easy')}>
                                {getDifficultyStars('easy')}
                              </span>
                              Anfänger
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <span className={getDifficultyColor('medium')}>
                                {getDifficultyStars('medium')}
                              </span>
                              Fortgeschritten
                            </div>
                          </SelectItem>
                          <SelectItem value="hard">
                            <div className="flex items-center gap-2">
                              <span className={getDifficultyColor('hard')}>
                                {getDifficultyStars('hard')}
                              </span>
                              Experte
                            </div>
                          </SelectItem>
                          <SelectItem value="expert">
                            <div className="flex items-center gap-2">
                              <span className={getDifficultyColor('expert')}>
                                {getDifficultyStars('expert')}
                              </span>
                              Meister
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">KI Persönlichkeit</Label>
                      <Select
                        value={singleplayerConfig.aiPersonality}
                        onValueChange={(value) => setSingleplayerConfig(prev => ({ ...prev, aiPersonality: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aggressive">🔥 Aggressiv - Risikoreiche Züge</SelectItem>
                          <SelectItem value="balanced">⚖️ Ausgewogen - Klassische Strategie</SelectItem>
                          <SelectItem value="defensive">🛡️ Defensiv - Sicherheit zuerst</SelectItem>
                          <SelectItem value="creative">🎨 Kreativ - Unvorhersehbare Züge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Spielzeit: {singleplayerConfig.gameTime} Minuten
                      </Label>
                      <Slider
                        value={[singleplayerConfig.gameTime]}
                        onValueChange={([value]) => setSingleplayerConfig(prev => ({ ...prev, gameTime: value }))}
                        min={5}
                        max={60}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>5m</span>
                        <span>60m</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2">KI Vorschau:</h4>
                      <div className="text-xs space-y-1">
                        <p><strong>Schwierigkeit:</strong> {singleplayerConfig.difficulty}</p>
                        <p><strong>Rating:</strong> ~{
                          singleplayerConfig.difficulty === 'easy' ? '800-1200' :
                          singleplayerConfig.difficulty === 'medium' ? '1200-1600' :
                          singleplayerConfig.difficulty === 'hard' ? '1600-2000' :
                          '2000+'
                        }</p>
                        <p><strong>Spielstil:</strong> {
                          singleplayerConfig.aiPersonality === 'aggressive' ? 'Angriffsorientiert' :
                          singleplayerConfig.aiPersonality === 'defensive' ? 'Positionsspiel' :
                          singleplayerConfig.aiPersonality === 'creative' ? 'Unkonventionell' :
                          'Ausgewogen'
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMode(null)}
                    className="flex-1"
                  >
                    Zurück
                  </Button>
                  <Button
                    onClick={() => handleStartGame('singleplayer')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Spiel starten
                  </Button>
                </div>
              </motion.div>
            ) : (
              // Multiplayer Configuration
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-gaming-primary" />
                  <h3 className="text-xl font-bold">Multiplayer Einstellungen</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Raum-Typ</Label>
                      <Select
                        value={multiplayerConfig.roomType}
                        onValueChange={(value) => setMultiplayerConfig(prev => ({ ...prev, roomType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">🌐 Öffentlich - Für alle sichtbar</SelectItem>
                          <SelectItem value="private">🔒 Privat - Nur mit Code</SelectItem>
                          <SelectItem value="friends">👥 Freunde - Nur Freunde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Max. Spieler</Label>
                      <Select
                        value={multiplayerConfig.maxPlayers.toString()}
                        onValueChange={(value) => setMultiplayerConfig(prev => ({ ...prev, maxPlayers: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Spieler</SelectItem>
                          <SelectItem value="4">4 Spieler</SelectItem>
                          <SelectItem value="6">6 Spieler</SelectItem>
                          <SelectItem value="8">8 Spieler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Spielzeit: {multiplayerConfig.gameTime} Minuten
                      </Label>
                      <Slider
                        value={[multiplayerConfig.gameTime]}
                        onValueChange={([value]) => setMultiplayerConfig(prev => ({ ...prev, gameTime: value }))}
                        min={5}
                        max={60}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="ranked" className="text-sm font-medium">
                        Ranked Match
                      </Label>
                      <Switch
                        id="ranked"
                        checked={multiplayerConfig.ranked}
                        onCheckedChange={(checked) => setMultiplayerConfig(prev => ({ ...prev, ranked: checked }))}
                      />
                    </div>

                    <div className="bg-gaming-primary/10 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2">Match Info:</h4>
                      <div className="text-xs space-y-1">
                        <p><strong>Typ:</strong> {multiplayerConfig.ranked ? 'Ranked' : 'Casual'}</p>
                        <p><strong>Rating:</strong> {multiplayerConfig.ranked ? 'Betrifft ELO' : 'Nur Spaß'}</p>
                        <p><strong>Belohnungen:</strong> {multiplayerConfig.ranked ? 'XP + Rating' : 'Nur XP'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMode(null)}
                    className="flex-1"
                  >
                    Zurück
                  </Button>
                  <Button
                    onClick={() => handleStartGame('multiplayer')}
                    className="flex-1 bg-gaming-primary hover:bg-gaming-primary/90"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Match suchen
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Settings & Close Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Einstellungen
              </Button>

              {onClose && (
                <Button
                  variant="ghost"
                  onClick={onClose}
                >
                  Schließen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Spiel Einstellungen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Sound-Effekte</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Musik</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Benachrichtigungen</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Animationen</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}