'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Gamepad2,
  Crown,
  Users,
  Zap,
  ArrowLeft,
  Play,
  Trophy,
  Star,
  Target,
  Bot,
  Sword,
  Timer,
  Medal
} from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { GAMES_REGISTRY, getFeaturedGames, getGamesByCategory } from '@/lib/games-registry'

// Direkter Game Launch Button
function QuickPlayButton({ game, variant = 'multiplayer' }: {
  game: any;
  variant?: 'multiplayer' | 'ai' | 'practice'
}) {
  const getVariantConfig = () => {
    switch (variant) {
      case 'ai':
        return {
          icon: <Bot className="h-4 w-4" />,
          label: 'vs KI',
          className: 'bg-blue-600 hover:bg-blue-700 text-white',
          href: `${game.href}?mode=ai&difficulty=medium`
        }
      case 'practice':
        return {
          icon: <Target className="h-4 w-4" />,
          label: 'Üben',
          className: 'bg-green-600 hover:bg-green-700 text-white',
          href: `${game.href}?mode=practice`
        }
      default:
        return {
          icon: <Users className="h-4 w-4" />,
          label: 'Online',
          className: 'bg-gaming-primary hover:bg-gaming-primary/90 text-white',
          href: `${game.href}?mode=online`
        }
    }
  }

  const config = getVariantConfig()

  return (
    <Link href={config.href}>
      <GamingButton
        variant="primary"
        size="sm"
        className={config.className}
      >
        {config.icon}
        {config.label}
      </GamingButton>
    </Link>
  )
}

// Enhanced Game Card mit direkten Play-Buttons
function EnhancedGameCard({ game, index, delay }: {
  game: any;
  index: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <GamingCard className="border-2 border-gaming-primary/20 hover:border-gaming-primary/60 transition-all duration-300 h-full">
        <GamingCardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{game.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-gaming-primary">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </div>
            </div>
            {game.isNew && (
              <Badge className="bg-gaming-accent text-white">NEU</Badge>
            )}
          </div>
        </GamingCardHeader>

        <GamingCardContent>
          <div className="space-y-4">
            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-background/50 rounded-lg p-2">
                <Users className="h-4 w-4 mx-auto mb-1 text-gaming-primary" />
                <span className="font-medium">{game.players}</span>
              </div>
              <div className="bg-background/50 rounded-lg p-2">
                <Timer className="h-4 w-4 mx-auto mb-1 text-gaming-secondary" />
                <span className="font-medium">{game.duration}</span>
              </div>
              <div className="bg-background/50 rounded-lg p-2">
                <Star className="h-4 w-4 mx-auto mb-1 text-gaming-accent" />
                <span className="font-medium">{game.difficulty}</span>
              </div>
            </div>

            {/* Quick Play Buttons */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <QuickPlayButton game={game} variant="multiplayer" />
                <QuickPlayButton game={game} variant="ai" />
              </div>
              {game.hasPractice && (
                <div className="w-full">
                  <QuickPlayButton game={game} variant="practice" />
                </div>
              )}
            </div>

            {/* Game Features */}
            {game.features && (
              <div className="flex flex-wrap gap-1">
                {game.features.map((feature: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </GamingCardContent>
      </GamingCard>
    </motion.div>
  )
}

export default function GamesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin?callbackUrl=/games')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Hole ALLE Spiele aus dem Registry
  const featuredGames = getFeaturedGames()
  const allGames = GAMES_REGISTRY
  const fpsGames = getGamesByCategory('fps')
  const racingGames = getGamesByCategory('racing')
  const boardGames = getGamesByCategory('board')
  const puzzleGames = getGamesByCategory('puzzle')

  const quickAccessGames = [
    {
      name: 'Schnelles Schach',
      description: '5-Minuten Blitz',
      icon: '⚡',
      href: '/games/chess?mode=online&time=5',
      className: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    },
    {
      name: 'Racing Liga',
      description: 'Ranked Rennen',
      icon: '🏆',
      href: '/games/racing?mode=ranked',
      className: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      name: 'UNO Party',
      description: '4-Spieler Chaos',
      icon: '🎉',
      href: '/games/uno?mode=party&players=4',
      className: 'bg-gradient-to-r from-green-500 to-blue-500'
    },
    {
      name: 'FPS Deathmatch',
      description: 'Free for All',
      icon: '💥',
      href: '/games/fps?mode=deathmatch',
      className: 'bg-gradient-to-r from-red-500 to-orange-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark via-background to-gaming-dark/50">
      {/* Navigation Header */}
      <div className="border-b border-gaming-primary/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <GamingButton variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </GamingButton>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gaming-primary">
                  Gaming Arena
                </h1>
                <p className="text-sm text-muted-foreground">
                  Wähle dein Spiel und starte sofort
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Level {(session.user as any)?.level || 1}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {(session.user as any)?.globalXP || 0} XP
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Quick Access Bar */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gaming-primary mb-2">
              ⚡ Schnellstart
            </h2>
            <p className="text-muted-foreground">
              Direkt ins Spiel - kein Warten, pure Action!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickAccessGames.map((game, index) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group"
              >
                <Link href={game.href}>
                  <div className={`
                    ${game.className} text-white p-6 rounded-xl
                    shadow-lg hover:shadow-xl transition-all duration-300
                    border border-white/20 group-hover:border-white/40
                  `}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">{game.icon}</div>
                      <h3 className="font-bold text-lg mb-1">{game.name}</h3>
                      <p className="text-sm opacity-90">{game.description}</p>
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                          <Play className="h-3 w-3" />
                          Jetzt spielen
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Main Games Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gaming-primary mb-2">
              🎮 Alle Spiele
            </h2>
            <p className="text-muted-foreground">
              Wähle zwischen Multiplayer, KI-Training oder Übungsmodus
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredGames.map((game, index) => (
              <EnhancedGameCard
                key={game.id}
                game={game}
                index={index}
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.section>

        {/* Gaming Stats & Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-gaming-primary/10 to-gaming-primary/5 border border-gaming-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-8 w-8 text-gaming-primary" />
              <h3 className="text-xl font-bold">Turniere</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Nimm an wöchentlichen Turnieren teil und gewinne exklusive Belohnungen.
            </p>
            <Link href="/tournaments">
              <GamingButton variant="outline" size="sm">
                Turniere ansehen
              </GamingButton>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-gaming-secondary/10 to-gaming-secondary/5 border border-gaming-secondary/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Medal className="h-8 w-8 text-gaming-secondary" />
              <h3 className="text-xl font-bold">Ranglisten</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Vergleiche dich mit den besten Spielern und klettere die Rangliste hoch.
            </p>
            <Link href="/leaderboards">
              <GamingButton variant="outline" size="sm">
                Rankings sehen
              </GamingButton>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-gaming-accent/10 to-gaming-accent/5 border border-gaming-accent/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sword className="h-8 w-8 text-gaming-accent" />
              <h3 className="text-xl font-bold">Erfolge</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Schalte Achievements frei und sammle XP für jeden Meilenstein.
            </p>
            <Link href="/profile?tab=achievements">
              <GamingButton variant="outline" size="sm">
                Erfolge sehen
              </GamingButton>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  )
}