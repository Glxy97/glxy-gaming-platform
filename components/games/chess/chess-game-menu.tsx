// @ts-nocheck

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bot, Users, Shuffle, Settings, Trophy, Zap, Crown, Gamepad2 } from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ChessGameMenuProps {
  onStartGame: (mode: 'computer' | 'online' | 'random') => void
  isLoading: boolean
}

export function ChessGameMenu({ onStartGame, isLoading }: ChessGameMenuProps) {
  const gameOptions = [
    {
      mode: 'computer' as const,
      title: 'Gegen Computer',
      description: 'Spiele gegen unsere KI und verbessere deine Fähigkeiten',
      icon: Bot,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      difficulty: 'Einstellbar',
      xpReward: '+10 XP pro Zug'
    },
    {
      mode: 'online' as const,
      title: 'Online-Multiplayer',
      description: 'Fordere andere Spieler zu spannenden Duellen heraus',
      icon: Users,
      color: 'text-gaming-primary',
      bgColor: 'bg-gaming-primary/20',
      difficulty: 'Variiert',
      xpReward: '+50 XP bei Sieg'
    },
    {
      mode: 'random' as const,
      title: 'Zufälliger Gegner',
      description: 'Finde schnell einen Gegner mit ähnlichem Skill-Level',
      icon: Shuffle,
      color: 'text-gaming-secondary',
      bgColor: 'bg-gaming-secondary/20',
      difficulty: 'Ausgeglichen',
      xpReward: '+25 XP + Bonus'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <Crown className="w-12 h-12 text-gaming-accent animate-float" />
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold gradient-text">
            GLXY Schach
          </h1>
          <Crown className="w-12 h-12 text-gaming-accent animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Beweise dein strategisches Können in unserem beeindruckenden Schach-Erlebnis. 
          Sammle XP, steige in Leveln auf und werde zum Schachmeister!
        </p>
      </motion.div>

      {/* Game Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {gameOptions.map((option, index) => (
          <motion.div
            key={option.mode}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <GamingCard variant="neon" hover glow className="h-full">
              <GamingCardHeader className="text-center">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${option.bgColor} glow-primary`}>
                  {React.createElement(option.icon, {
                      className: `w-10 h-10 ${option.color}`
                    })}
                </div>
                <h3 className="text-xl font-orbitron font-bold mb-2">{option.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {option.description}
                </p>
              </GamingCardHeader>

              <GamingCardContent className="text-center">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Schwierigkeit:</span>
                    <span className="font-semibold text-foreground">{option.difficulty}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Belohnung:</span>
                    <span className="font-semibold text-gaming-primary">{option.xpReward}</span>
                  </div>
                </div>

                <GamingButton
                  onClick={() => onStartGame(option.mode)}
                  disabled={isLoading}
                  variant="primary"
                  size="lg"
                  glow
                  className="w-full"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Gamepad2 className="w-5 h-5 mr-2" />
                      Spiel starten
                    </>
                  )}
                </GamingButton>
              </GamingCardContent>
            </GamingCard>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GamingCard variant="glass" className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <Trophy className="w-8 h-8 text-gaming-accent mx-auto" />
              <div className="text-2xl font-orbitron font-bold text-foreground">1,247</div>
              <div className="text-sm text-muted-foreground">Aktive Spiele</div>
            </div>
            <div className="space-y-2">
              <Users className="w-8 h-8 text-gaming-primary mx-auto" />
              <div className="text-2xl font-orbitron font-bold text-foreground">8,934</div>
              <div className="text-sm text-muted-foreground">Online Spieler</div>
            </div>
            <div className="space-y-2">
              <Zap className="w-8 h-8 text-gaming-secondary mx-auto" />
              <div className="text-2xl font-orbitron font-bold text-foreground">45,621</div>
              <div className="text-sm text-muted-foreground">Spiele heute</div>
            </div>
            <div className="space-y-2">
              <Crown className="w-8 h-8 text-gaming-accent mx-auto" />
              <div className="text-2xl font-orbitron font-bold text-foreground">156</div>
              <div className="text-sm text-muted-foreground">Turniere</div>
            </div>
          </div>
        </GamingCard>
      </motion.div>
    </div>
  )
}
