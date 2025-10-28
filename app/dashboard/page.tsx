
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Gamepad2, Users, Star, ArrowLeft, Target, Zap } from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { LevelDisplay } from '@/components/ui/level-display'
import { XPCounter } from '@/components/ui/xp-counter'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'

export default function DashboardPage() {
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
        <LoadingSpinner size="lg" text="Lade Dashboard..." />
      </div>
    )
  }

  if (!session) {
    return null
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
              <h1 className="text-2xl font-orbitron font-bold gradient-text">Gaming Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <LevelDisplay
                level={(session.user as any)?.level || 1}
                xp={(session.user as any)?.globalXP || 0}
                size="sm"
              />
              <div className="text-right">
                <p className="font-semibold text-foreground">{session.user?.username}</p>
                <p className="text-sm text-muted-foreground">
                  <XPCounter value={(session.user as any)?.globalXP || 0} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-orbitron font-bold mb-4">
            Willkommen zurück, <span className="gradient-text">{session.user?.username}</span>!
          </h2>
          <p className="text-lg text-muted-foreground">
            Hier ist dein Gaming-Dashboard mit allen wichtigen Statistiken und Features
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GamingCard variant="neon" glow>
              <GamingCardContent className="text-center">
                <Trophy className="w-12 h-12 text-gaming-accent mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold mb-2">Level</h3>
                <div className="text-3xl font-bold gradient-text">
                  {(session.user as any)?.level || 1}
                </div>
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
                <Zap className="w-12 h-12 text-gaming-primary mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold mb-2">Gesamt XP</h3>
                <div className="text-3xl font-bold text-gaming-primary">
                  <XPCounter value={(session.user as any)?.globalXP || 0} suffix="" />
                </div>
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
                <Target className="w-12 h-12 text-gaming-secondary mx-auto mb-4" />
                <h3 className="text-xl font-orbitron font-bold mb-2">Rang</h3>
                <div className="text-3xl font-bold text-gaming-secondary">
                  #{Math.floor(Math.random() * 1000) + 1}
                </div>
              </GamingCardContent>
            </GamingCard>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Link href="/games/chess">
            <GamingCard variant="neon" hover>
              <GamingCardContent className="text-center">
                <div className="text-6xl mb-4">♟️</div>
                <h3 className="text-xl font-orbitron font-bold mb-2">Schach spielen</h3>
                <p className="text-muted-foreground mb-4">Fordere Gegner heraus</p>
                <GamingButton size="sm" className="w-full" glow>
                  Spiel starten
                </GamingButton>
              </GamingCardContent>
            </GamingCard>
          </Link>

          <Link href="/profile">
            <GamingCard variant="glass" hover>
              <GamingCardContent className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-orbitron font-bold mb-2">Mein Profil</h3>
                <p className="text-muted-foreground mb-4">Statistiken ansehen</p>
                <GamingButton variant="secondary" size="sm" className="w-full">
                  Profil öffnen
                </GamingButton>
              </GamingCardContent>
            </GamingCard>
          </Link>

          <Link href="/leaderboards">
            <GamingCard variant="default" hover>
              <GamingCardContent className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-orbitron font-bold mb-2">Bestenlisten</h3>
                <p className="text-muted-foreground mb-4">Ranglisten ansehen</p>
                <GamingButton variant="accent" size="sm" className="w-full">
                  Rankings zeigen
                </GamingButton>
              </GamingCardContent>
            </GamingCard>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
