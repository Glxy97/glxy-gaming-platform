
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, ArrowLeft, Star, Zap, Target } from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { LevelDisplay } from '@/components/ui/level-display'
import { XPCounter } from '@/components/ui/xp-counter'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Image from 'next/image'
import Link from 'next/link'

export default function LeaderboardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Lade Bestenlisten..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Mock leaderboard data
  const topPlayers = [
    {
      rank: 1,
      username: 'ChessKing',
      level: 52,
      xp: 78450,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      wins: 342,
      rating: 2150
    },
    {
      rank: 2,
      username: 'GameMaster',
      level: 45,
      xp: 63200,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      wins: 287,
      rating: 1980
    },
    {
      rank: 3,
      username: 'StrategicMind',
      level: 41,
      xp: 56800,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      wins: 256,
      rating: 1850
    },
    {
      rank: 4,
      username: 'TacticPro',
      level: 38,
      xp: 52100,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      wins: 234,
      rating: 1720
    },
    {
      rank: 5,
      username: 'BoardMaster',
      level: 35,
      xp: 48900,
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face',
      wins: 198,
      rating: 1680
    },
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-gaming-accent" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <GamingButton variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </GamingButton>
              </Link>
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-gaming-accent" />
                <h1 className="text-2xl font-orbitron font-bold gradient-text">Bestenlisten</h1>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-foreground">{session.user?.username}</p>
              <p className="text-sm text-muted-foreground">Level {(session.user as any)?.level || 1}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-orbitron font-bold gradient-text mb-4">
            Hall of Fame
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Entdecke die besten Spieler der GLXY Gaming-Community. 
            Kämpfe dich an die Spitze und sichere dir deinen Platz unter den Legenden!
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GamingCard variant="neon" glow>
              <GamingCardContent className="text-center">
                <Zap className="w-12 h-12 text-gaming-primary mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold mb-2">Aktive Spieler</h3>
                <div className="text-3xl font-bold gradient-text">
                  8,934
                </div>
                <p className="text-sm text-muted-foreground mt-2">Online jetzt</p>
              </GamingCardContent>
            </GamingCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GamingCard variant="glass" glow>
              <GamingCardContent className="text-center">
                <Target className="w-12 h-12 text-gaming-secondary mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold mb-2">Dein Rang</h3>
                <div className="text-3xl font-bold text-gaming-secondary">
                  #{Math.floor(Math.random() * 1000) + 100}
                </div>
                <p className="text-sm text-muted-foreground mt-2">von 10,847</p>
              </GamingCardContent>
            </GamingCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GamingCard variant="default" glow>
              <GamingCardContent className="text-center">
                <Star className="w-12 h-12 text-gaming-accent mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold mb-2">Deine XP</h3>
                <div className="text-3xl font-bold text-gaming-accent">
                  <XPCounter value={(session.user as any)?.globalXP || 0} suffix="" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Gesamt gesammelt</p>
              </GamingCardContent>
            </GamingCard>
          </motion.div>
        </div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-orbitron font-bold mb-8 text-center gradient-text">
            🏆 Top 3 Champions 🏆
          </h3>
          
          <div className="flex flex-col md:flex-row items-end justify-center gap-8">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="order-2 md:order-1"
            >
              <GamingCard variant="glass" className="p-6 text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-gray-400">
                    <Image
                      src={topPlayers[1]?.avatar || '/default-avatar.png'}
                      alt={topPlayers[1]?.username || 'Player 2'}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <h4 className="font-orbitron font-bold text-lg mb-2">{topPlayers[1]?.username || 'Player 2'}</h4>
                <LevelDisplay level={topPlayers[1]?.level || 1} xp={topPlayers[1]?.xp || 0} size="sm" className="mb-3" />
                <div className="text-sm text-muted-foreground">
                  <XPCounter value={topPlayers[1]?.xp || 0} />
                </div>
              </GamingCard>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="order-1 md:order-2"
            >
              <GamingCard variant="neon" className="p-8 text-center" glow>
                <div className="relative mb-6">
                  <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-gaming-accent glow-accent">
                    <Image
                      src={topPlayers[0]?.avatar || '/default-avatar.png'}
                      alt={topPlayers[0]?.username || 'Champion'}
                      width={112}
                      height={112}
                      className="object-cover"
                    />
                  </div>
                  <Crown className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 text-gaming-accent animate-bounce" />
                </div>
                <h4 className="font-orbitron font-bold text-xl mb-3 gradient-text">{topPlayers[0]?.username || 'Champion'}</h4>
                <LevelDisplay level={topPlayers[0]?.level || 1} xp={topPlayers[0]?.xp || 0} size="md" className="mb-4" />
                <div className="text-lg font-bold text-gaming-primary">
                  <XPCounter value={topPlayers[0]?.xp || 0} />
                </div>
                <div className="mt-2 text-sm text-gaming-accent">
                  👑 Champion
                </div>
              </GamingCard>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="order-3"
            >
              <GamingCard variant="default" className="p-6 text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-amber-600">
                    <Image
                      src={topPlayers[2]?.avatar || '/default-avatar.png'}
                      alt={topPlayers[2]?.username || 'Player 3'}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <h4 className="font-orbitron font-bold text-lg mb-2">{topPlayers[2]?.username || 'Player 3'}</h4>
                <LevelDisplay level={topPlayers[2]?.level || 1} xp={topPlayers[2]?.xp || 0} size="sm" className="mb-3" />
                <div className="text-sm text-muted-foreground">
                  <XPCounter value={topPlayers[2]?.xp || 0} />
                </div>
              </GamingCard>
            </motion.div>
          </div>
        </motion.div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h3 className="text-2xl font-orbitron font-bold mb-6 gradient-text">Vollständige Rangliste</h3>
          <GamingCard variant="glass">
            <GamingCardContent className="p-0">
              <div className="space-y-2">
                {topPlayers.map((player, index) => (
                  <motion.div
                    key={player.username}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(player.rank)}
                    </div>

                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gaming-primary">
                      <Image
                        src={player.avatar}
                        alt={player.username}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{player.username}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Level {player.level}</span>
                        <span>{player.wins} Siege</span>
                        <span>Rating: {player.rating}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-gaming-primary">
                        <XPCounter value={player.xp} suffix="" />
                      </div>
                      <div className="text-sm text-muted-foreground">XP</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GamingCardContent>
          </GamingCard>
        </motion.div>
      </main>
    </div>
  )
}
