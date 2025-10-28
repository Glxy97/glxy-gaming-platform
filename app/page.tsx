
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { 
  ChevronRight,
  Trophy,
  Users,
  Gamepad2,
  Zap,
  Crown,
  Star,
  Target,
  Swords,
  Menu,
  X,
  Home,
  User,
  Settings,
  LogOut,
  MessageCircle,
  Bell,
  Search
} from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent } from '@/components/ui/gaming-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function HomePage() {
  const { data: session } = useSession() || {}
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-gaming-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gaming-primary font-orbitron text-lg">Lade GLXY Gaming Platform...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-blue-900 text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gaming-primary/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="text-3xl transition-transform hover:rotate-12 hover:scale-110 duration-300">
                🎮
              </div>
              <span className="font-orbitron font-bold text-2xl bg-gradient-to-r from-gaming-primary to-gaming-secondary bg-clip-text text-transparent transition-transform hover:scale-105 duration-200">
                GLXY.AT
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="flex items-center gap-2 text-gaming-primary hover:text-gaming-secondary transition-colors">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link href="/games" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors">
                <Gamepad2 className="w-4 h-4" />
                Spiele
              </Link>
              <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors">
                <Zap className="w-4 h-4" />
                Tools
              </Link>
              <Link href="/chatbot" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
                Chatbot
              </Link>
              <Link href="/leaderboards" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors">
                <Trophy className="w-4 h-4" />
                Rangliste
              </Link>
              <Link href="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors">
                <User className="w-4 h-4" />
                Profil
              </Link>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden lg:flex relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Spiele suchen..." 
                  className="pl-10 w-48 bg-muted/20 border-gaming-primary/20 focus:border-gaming-primary"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-muted-foreground hover:text-gaming-primary transition-all hover:scale-110 active:scale-95 duration-150">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gaming-secondary rounded-full text-xs flex items-center justify-center">3</span>
              </button>

              {/* Messages */}
              <button className="relative p-2 text-muted-foreground hover:text-gaming-primary transition-all hover:scale-110 active:scale-95 duration-150">
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* User Avatar */}
              {session?.user ? (
                <Link href="/profile">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gaming-primary/10 hover:bg-gaming-primary/20 transition-all cursor-pointer border border-gaming-primary/20 hover:scale-105 active:scale-95 duration-150">
                    <div className="relative">
                      {session.user.image ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gaming-primary">
                          <Image
                            src={session.user.image}
                            alt={session.user.username || 'Player'}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gaming-primary/20 border-2 border-gaming-primary flex items-center justify-center text-gaming-primary font-bold text-sm">
                          {(session.user.username || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-background" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-semibold">{session.user.username}</div>
                      <div className="text-xs text-muted-foreground">Level {(session.user as any).level || 1}</div>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button className="bg-gaming-primary hover:bg-gaming-primary/90">
                    Anmelden
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden p-2 text-muted-foreground hover:text-gaming-primary transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 border-t border-gaming-primary/20"
            >
              <div className="px-4 py-6 space-y-4">
                <Link href="/" className="flex items-center gap-3 text-gaming-primary">
                  <Home className="w-5 h-5" />
                  Home
                </Link>
                <Link href="/games" className="flex items-center gap-3 text-muted-foreground">
                  <Gamepad2 className="w-5 h-5" />
                  Spiele
                </Link>
                <Link href="/tools" className="flex items-center gap-3 text-muted-foreground">
                  <Zap className="w-5 h-5" />
                  Tools
                </Link>
                <Link href="/chatbot" className="flex items-center gap-3 text-muted-foreground">
                  <MessageCircle className="w-5 h-5" />
                  Chatbot
                </Link>
                <Link href="/leaderboards" className="flex items-center gap-3 text-muted-foreground">
                  <Trophy className="w-5 h-5" />
                  Rangliste
                </Link>
                <Link href="/profile" className="flex items-center gap-3 text-muted-foreground">
                  <User className="w-5 h-5" />
                  Profil
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section mit atemberaubenden Animationen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* PERFORMANCE-OPTIMIERTER Hintergrund - 90% weniger Animationen! */}
        <div className="absolute inset-0 z-0">
          {/* Statischer Gradient - keine Animation mehr */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/20 to-black/40" />

          {/* NUR 2 Matrix Rain Linien statt 8 */}
          {mounted && Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={`matrix-${i}`}
              className="absolute w-px bg-gradient-to-b from-transparent via-gaming-primary/60 to-transparent will-change-transform"
              style={{
                left: `${(i + 1) * 33}%`,
                height: "100vh"
              }}
              animate={{
                y: ["-100vh", "100vh"],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: i * 3,
                ease: "linear"
              }}
            />
          ))}

          {/* NUR 3 Gaming Icons statt 6 - mit CSS animation */}
          {mounted && Array.from({ length: 3 }).map((_, i) => {
            const icons = ['🎮', '🏆', '⚡']
            return (
              <div
                key={`icon-${i}`}
                className="absolute text-3xl opacity-10 animate-pulse"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${30 + i * 20}%`,
                  animationDelay: `${i * 2}s`,
                  animationDuration: '8s'
                }}
              >
                {icons[i]}
              </div>
            )
          })}

          {/* NUR 1 Neon Circle statt 2 - mit CSS */}
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 border border-gaming-primary/10 rounded-full animate-spin"
            style={{ animationDuration: '30s' }}
          />

          {/* KEINE Energy Cores mehr - zu performance-intensiv */}
          {mounted && Array.from({ length: 0 }).map((_, i) => (
            <motion.div
              key={`energy-${i}`}
              className="absolute rounded-full"
              style={{
                width: 120 + i * 30,
                height: 120 + i * 30,
                left: `${25 + i * 25}%`,
                top: `${30 + i * 20}%`,
                background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(147, 51, 234, 0.2)' : 'rgba(59, 130, 246, 0.2)'} 0%, transparent 70%)`
              }}
              animate={{
                scale: [0.9, 1.1, 0.9],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                delay: i * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* Haupt-Logo */}
            <motion.h1
              className="text-6xl sm:text-8xl md:text-9xl font-orbitron font-black mb-8 relative"
              style={{
                background: "linear-gradient(45deg, #9333ea, #3b82f6, #06b6d4)",
                backgroundSize: "200% 200%",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                textShadow: "0 0 30px rgba(147, 51, 234, 0.8), 0 0 60px rgba(59, 130, 246, 0.6)"
              }}
            >
              GLXY.AT
              
              {/* Animierte Effekte um das Logo */}
              <motion.span
                className="absolute -top-8 -right-8 text-6xl"
                animate={{ 
                  rotate: 360, 
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <motion.span
                className="absolute -bottom-8 -left-8 text-6xl"
                animate={{ 
                  rotate: -360, 
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                🚀
              </motion.span>
              <motion.span
                className="absolute top-1/2 -right-12 text-5xl"
                animate={{ 
                  y: [-20, 20, -20],
                  x: [0, 30, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ⚡
              </motion.span>
            </motion.h1>

            {/* Untertitel */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-6 mb-12"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gaming-primary mb-6">
                🎮 Die ultimative KI-Gaming-Plattform
              </h2>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Erlebe die Zukunft des Gaming! Spiele gegen fortschrittliche KI, fordere Freunde online heraus und dominiere die Bestenlisten!
              </p>
            </motion.div>

            {/* Game Mode Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto"
            >
              {/* Multiplayer Mode */}
              <motion.div
                className="relative p-8 rounded-2xl bg-gradient-to-br from-gaming-primary/20 to-purple-600/20 border border-gaming-primary/30 backdrop-blur-sm overflow-hidden group"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gaming-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-6xl">👥</div>
                    <div>
                      <h3 className="text-2xl font-orbitron font-bold text-gaming-primary mb-2">Multiplayer Arena</h3>
                      <p className="text-muted-foreground">Fordere Spieler weltweit heraus</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gaming-primary rounded-full" />
                      <span className="text-sm">Echtzeit-Matches gegen echte Gegner</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gaming-primary rounded-full" />
                      <span className="text-sm">ELO-Rating und Ranglisten</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gaming-primary rounded-full" />
                      <span className="text-sm">Live-Turniere und Events</span>
                    </div>
                  </div>
                  <Link href="/games?mode=multiplayer">
                    <GamingButton className="w-full group-hover:bg-gaming-primary group-hover:text-white">
                      <Users className="w-5 h-5 mr-2" />
                      Multiplayer starten
                    </GamingButton>
                  </Link>
                </div>
              </motion.div>

              {/* AI/Singleplayer Mode */}
              <motion.div
                className="relative p-8 rounded-2xl bg-gradient-to-br from-gaming-secondary/20 to-blue-600/20 border border-gaming-secondary/30 backdrop-blur-sm overflow-hidden group"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gaming-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-6xl">🤖</div>
                    <div>
                      <h3 className="text-2xl font-orbitron font-bold text-gaming-secondary mb-2">KI-Herausforderungen</h3>
                      <p className="text-muted-foreground">Trainiere gegen intelligente Bots</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gaming-secondary rounded-full" />
                      <span className="text-sm">Adaptive KI-Schwierigkeitsstufen</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gaming-secondary rounded-full" />
                      <span className="text-sm">Trainingsmodi und Tutorials</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gaming-secondary rounded-full" />
                      <span className="text-sm">Offline-Spiel möglich</span>
                    </div>
                  </div>
                  <Link href="/games?mode=ai">
                    <GamingButton variant="secondary" className="w-full group-hover:bg-gaming-secondary group-hover:text-white">
                      <Zap className="w-5 h-5 mr-2" />
                      KI-Training starten
                    </GamingButton>
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link href="/games">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <GamingButton size="lg" className="gap-3 text-xl px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl shadow-purple-500/50">
                    <Gamepad2 className="w-7 h-7" />
                    Jetzt Spielen
                  </GamingButton>
                </motion.div>
              </Link>
              
              <Link href="/leaderboards">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <GamingButton variant="outline" size="lg" className="gap-3 text-xl px-12 py-6 border-2 border-gaming-primary hover:bg-gaming-primary/10">
                    <Trophy className="w-7 h-7" />
                    Bestenlisten
                  </GamingButton>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Games Showcase Section */}
      <section className="relative py-24 bg-gradient-to-br from-black/90 to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-orbitron font-bold mb-6 gradient-text">
              🎮 Epische Spiele-Auswahl
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Von strategischem Schach bis hin zu actionreichen Shootern - entdecke Spiele für jeden Geschmack!
            </p>
          </motion.div>

          {/* Quick Game Access */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                game: 'chess',
                name: 'Schach',
                emoji: '♟️',
                modes: ['vs KI', 'Online'],
                color: 'from-purple-600 to-blue-600'
              },
              {
                game: 'fps',
                name: 'FPS Arena',
                emoji: '🎯',
                modes: ['Training', 'Multiplayer'],
                color: 'from-red-600 to-orange-600'
              },
              {
                game: 'racing',
                name: 'Racing',
                emoji: '🏎️',
                modes: ['Zeitfahrt', 'Online'],
                color: 'from-blue-600 to-cyan-600'
              },
              {
                game: 'uno',
                name: 'UNO',
                emoji: '🃏',
                modes: ['KI-Spiel', 'Lobby'],
                color: 'from-green-600 to-teal-600'
              }
            ].map((game, i) => (
              <motion.div
                key={game.game}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className="group"
              >
                <GamingCard variant="glass" hover className="h-full cursor-pointer">
                  <GamingCardContent className="text-center relative overflow-hidden p-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <motion.div
                      className="text-6xl mb-4 relative z-10"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      {game.emoji}
                    </motion.div>
                    <h3 className="text-xl font-orbitron font-bold mb-3 relative z-10 group-hover:text-gaming-primary transition-colors">{game.name}</h3>
                    <div className="space-y-2 mb-4 relative z-10">
                      {game.modes.map((mode, idx) => (
                        <Link key={idx} href={`/games/${game.game}?mode=${mode.toLowerCase().replace(' ', '-')}`}>
                          <GamingButton
                            size="sm"
                            variant={idx === 0 ? 'primary' : 'outline'}
                            className="w-full text-xs"
                          >
                            {mode}
                          </GamingButton>
                        </Link>
                      ))}
                    </div>
                  </GamingCardContent>
                </GamingCard>
              </motion.div>
            ))}
          </div>

          {/* Popular Games Showcase */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-orbitron font-bold mb-8 gradient-text">
              🎆 Beliebte Spiele-Modi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <GamingCard variant="neon" className="p-6">
                <div className="text-center">
                  <div className="text-5xl mb-4">🏆</div>
                  <h4 className="text-xl font-orbitron font-bold mb-3 text-gaming-primary">Ranglisten-Kämpfe</h4>
                  <p className="text-muted-foreground mb-4">Steige in den globalen Bestenlisten auf und beweise dein Können!</p>
                  <Link href="/leaderboards">
                    <GamingButton className="w-full">
                      <Trophy className="w-4 h-4 mr-2" />
                      Ranglisten ansehen
                    </GamingButton>
                  </Link>
                </div>
              </GamingCard>

              <GamingCard variant="glass" className="p-6">
                <div className="text-center">
                  <div className="text-5xl mb-4">🎓</div>
                  <h4 className="text-xl font-orbitron font-bold mb-3 text-gaming-secondary">KI-Training</h4>
                  <p className="text-muted-foreground mb-4">Perfektioniere deine Fähigkeiten gegen adaptive KI-Gegner!</p>
                  <Link href="/games?mode=ai">
                    <GamingButton variant="secondary" className="w-full">
                      <Zap className="w-4 h-4 mr-2" />
                      Training starten
                    </GamingButton>
                  </Link>
                </div>
              </GamingCard>

              <GamingCard variant="glass" className="p-6">
                <div className="text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h4 className="text-xl font-orbitron font-bold mb-3 text-gaming-accent">Live-Events</h4>
                  <p className="text-muted-foreground mb-4">Nimm an spannenden Turnieren und Community-Events teil!</p>
                  <Link href="/events">
                    <GamingButton variant="accent" className="w-full">
                      <Star className="w-4 h-4 mr-2" />
                      Events entdecken
                    </GamingButton>
                  </Link>
                </div>
              </GamingCard>
            </div>
          </div>

          {/* Coming Soon - Mega Games */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16"
          >
            <div className="text-center mb-12">
              <h3 className="text-4xl font-orbitron font-bold mb-4 gradient-text">
                🎆 Kommende Gaming-Revolution
              </h3>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Bereite dich auf die nächste Generation von Gaming vor - mit KI-gestützten
                Welten und bahnbrechenden Multiplayer-Erlebnissen!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Battle Royale - Big Feature */}
              <motion.div
                className="lg:col-span-2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <GamingCard variant="neon" className="p-8 h-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-orange-600/20" />
                  <div className="relative z-10">
                    <div className="flex items-start gap-6 mb-6">
                      <div className="text-8xl">👑</div>
                      <div>
                        <h4 className="text-3xl font-orbitron font-bold mb-3 text-gaming-primary">GLXY Battle Royale</h4>
                        <p className="text-lg text-muted-foreground mb-4">
                          100 Spieler, eine Insel, ein Überlebender. Das ultimative Survival-Erlebnis
                          mit KI-Unterstützung und dynamischen Events.
                        </p>
                        <div className="flex flex-wrap gap-3 mb-6">
                          <Badge className="bg-red-600/20 text-red-400 border-red-600/50">100 Spieler</Badge>
                          <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/50">KI-Events</Badge>
                          <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/50">Cross-Platform</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge variant="secondary" className="text-lg px-6 py-2">Q2 2025 - Early Access</Badge>
                    </div>
                  </div>
                </GamingCard>
              </motion.div>

              <div className="space-y-6">
                {/* MMO RPG */}
                <motion.div whileHover={{ scale: 1.02 }}>
                  <GamingCard variant="glass" className="p-6">
                    <div className="text-center">
                      <div className="text-6xl mb-4">⚔️</div>
                      <h4 className="text-xl font-orbitron font-bold mb-3">GLXY Universe</h4>
                      <p className="text-muted-foreground mb-4">Persistent MMO-Welt mit KI-NPCs</p>
                      <Badge variant="secondary">In Entwicklung</Badge>
                    </div>
                  </GamingCard>
                </motion.div>

                {/* Soccer */}
                <motion.div whileHover={{ scale: 1.02 }}>
                  <GamingCard variant="glass" className="p-6">
                    <div className="text-center">
                      <div className="text-6xl mb-4">⚽</div>
                      <h4 className="text-xl font-orbitron font-bold mb-3">Soccer Stars</h4>
                      <p className="text-muted-foreground mb-4">Realistische Fußball-Simulation</p>
                      <Badge variant="secondary">Beta Q1 2025</Badge>
                    </div>
                  </GamingCard>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 bg-gradient-to-br from-purple-900/20 to-black/90">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-orbitron font-bold mb-16 gradient-text">
              📊 Plattform Statistiken
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "10K+", label: "Aktive Spieler", icon: "👥" },
                { number: "50K+", label: "Spiele gespielt", icon: "🎮" },
                { number: "99.9%", label: "Uptime", icon: "⚡" },
                { number: "24/7", label: "Support", icon: "🔧" }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="p-6 rounded-xl bg-gaming-primary/10 border border-gaming-primary/20"
                >
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-orbitron font-bold text-gaming-primary mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black/90 border-t border-gaming-primary/20 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎮</span>
                <span className="font-orbitron font-bold text-xl gradient-text">GLXY.AT</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Die ultimative Gaming-Plattform für KI-basierte Spiele und Online-Multiplayer.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gaming-primary">Spiele</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/games/chess" className="hover:text-gaming-primary transition-colors">Schach</Link></li>
                <li><Link href="/games/fps" className="hover:text-gaming-primary transition-colors">3D Shooter</Link></li>
                <li><Link href="/games/racing" className="hover:text-gaming-primary transition-colors">Drift Racing</Link></li>
                <li><Link href="/games/uno" className="hover:text-gaming-primary transition-colors">UNO Online</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gaming-primary">Community</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/leaderboards" className="hover:text-gaming-primary transition-colors">Bestenlisten</Link></li>
                <li><Link href="/profile" className="hover:text-gaming-primary transition-colors">Profil</Link></li>
                <li><Link href="/dashboard" className="hover:text-gaming-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gaming-primary">Kontakt</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>📧 info@glxy.at</li>
                <li>🌐 www.glxy.at</li>
                <li>🚀 Made with AI</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gaming-primary/20 mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 GLXY.AT - All rights reserved. Made with ❤️ and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
