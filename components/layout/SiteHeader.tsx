"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Home, Gamepad2, Zap, MessageCircle, Trophy, User, Menu, X, ChevronDown, Grid3X3, Target, Users, Hash, Crosshair, Car } from 'lucide-react'
import { ConsolidatedThemeSwitcher } from '@/components/ui/consolidated-theme-switcher'

export function SiteHeader() {
  const { data: session } = useSession() || {}
  const [open, setOpen] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gaming-primary/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl">🎮</span>
            <span className="font-orbitron font-bold text-xl bg-gradient-to-r from-gaming-primary to-gaming-secondary bg-clip-text text-transparent">GLXY.AT</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="flex items-center gap-2 text-gaming-primary hover:text-gaming-secondary transition-colors"><Home className="w-4 h-4"/>Home</Link>

            {/* Games Dropdown */}
            <div className="relative"
                 onMouseEnter={() => setGamesOpen(true)}
                 onMouseLeave={() => setGamesOpen(false)}>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors">
                <Gamepad2 className="w-4 h-4"/>
                Spiele
                <ChevronDown className="w-3 h-3"/>
              </button>
              {gamesOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-black/95 backdrop-blur-xl border border-gaming-primary/20 rounded-lg shadow-xl z-[60]">
                  <div className="py-2">
                    <Link href="/games" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-gaming-primary hover:bg-gaming-primary/10 transition-colors">
                      <Gamepad2 className="w-4 h-4"/>
                      Alle Spiele
                    </Link>
                    <div className="border-t border-gaming-primary/10 my-1"></div>

                    {/* Puzzle Games */}
                    <div className="px-4 py-1">
                      <span className="text-xs text-gaming-primary/60 font-medium uppercase tracking-wide">Puzzle</span>
                    </div>
                    <Link href="/games/tetris" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-gaming-primary hover:bg-gaming-primary/10 transition-colors">
                      <Grid3X3 className="w-4 h-4"/>
                      Tetris
                    </Link>
                    <Link href="/games/connect4" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-gaming-primary hover:bg-gaming-primary/10 transition-colors">
                      <Target className="w-4 h-4"/>
                      Connect 4
                    </Link>
                    <Link href="/games/tictactoe" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-gaming-primary hover:bg-gaming-primary/10 transition-colors">
                      <Hash className="w-4 h-4"/>
                      Tic Tac Toe
                    </Link>

                    <div className="border-t border-gaming-primary/10 my-1"></div>

                    {/* Action Games */}
                    <div className="px-4 py-1">
                      <span className="text-xs text-gaming-primary/60 font-medium uppercase tracking-wide">Action</span>
                    </div>
                    <Link href="/games/fps" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-gaming-primary hover:bg-gaming-primary/10 transition-colors">
                      <Crosshair className="w-4 h-4"/>
                      FPS Shooter
                    </Link>
                    <Link href="/games/racing" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-gaming-primary hover:bg-gaming-primary/10 transition-colors">
                      <Car className="w-4 h-4"/>
                      Racing
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/multiplayer" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors"><Users className="w-4 h-4"/>Multiplayer</Link>
            <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors"><Zap className="w-4 h-4"/>Tools</Link>
            <Link href="/chatbot" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors"><MessageCircle className="w-4 h-4"/>Chatbot</Link>
            <Link href="/leaderboards" className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors"><Trophy className="w-4 h-4"/>Rangliste</Link>
            <Link href={session?.user ? '/profile' : '/auth/signin'} className="flex items-center gap-2 text-muted-foreground hover:text-gaming-primary transition-colors"><User className="w-4 h-4"/>{session?.user ? 'Profil' : 'Anmelden'}</Link>
          </div>
          <div className="flex items-center gap-2">
            <ConsolidatedThemeSwitcher />
            <button className="md:hidden p-2 text-muted-foreground hover:text-gaming-primary" onClick={() => setOpen(!open)} aria-label="Toggle menu">
              {open ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-black/95 border-t border-gaming-primary/20 px-4 py-4 space-y-3">
          <Link href="/" className="flex items-center gap-3 text-gaming-primary" onClick={() => setOpen(false)}><Home className="w-5 h-5"/>Home</Link>

          {/* Mobile Games Section */}
          <div className="space-y-2">
            <Link href="/games" className="flex items-center gap-3 text-muted-foreground" onClick={() => setOpen(false)}><Gamepad2 className="w-5 h-5"/>Alle Spiele</Link>
            <div className="pl-8 space-y-2">
              {/* Puzzle Games */}
              <div className="text-xs text-gaming-primary/60 font-medium uppercase tracking-wide py-1">Puzzle</div>
              <Link href="/games/tetris" className="flex items-center gap-3 text-muted-foreground text-sm" onClick={() => setOpen(false)}><Grid3X3 className="w-4 h-4"/>Tetris</Link>
              <Link href="/games/connect4" className="flex items-center gap-3 text-muted-foreground text-sm" onClick={() => setOpen(false)}><Target className="w-4 h-4"/>Connect 4</Link>
              <Link href="/games/tictactoe" className="flex items-center gap-3 text-muted-foreground text-sm" onClick={() => setOpen(false)}><Hash className="w-4 h-4"/>Tic Tac Toe</Link>

              {/* Action Games */}
              <div className="text-xs text-gaming-primary/60 font-medium uppercase tracking-wide py-1 pt-3">Action</div>
              <Link href="/games/fps" className="flex items-center gap-3 text-muted-foreground text-sm" onClick={() => setOpen(false)}><Crosshair className="w-4 h-4"/>FPS Shooter</Link>
              <Link href="/games/racing" className="flex items-center gap-3 text-muted-foreground text-sm" onClick={() => setOpen(false)}><Car className="w-4 h-4"/>Racing</Link>
            </div>
          </div>

          <Link href="/multiplayer" className="flex items-center gap-3 text-muted-foreground" onClick={() => setOpen(false)}><Users className="w-5 h-5"/>Multiplayer</Link>
          <Link href="/tools" className="flex items-center gap-3 text-muted-foreground" onClick={() => setOpen(false)}><Zap className="w-5 h-5"/>Tools</Link>
          <Link href="/chatbot" className="flex items-center gap-3 text-muted-foreground" onClick={() => setOpen(false)}><MessageCircle className="w-5 h-5"/>Chatbot</Link>
          <Link href="/leaderboards" className="flex items-center gap-3 text-muted-foreground" onClick={() => setOpen(false)}><Trophy className="w-5 h-5"/>Rangliste</Link>
          <Link href={session?.user ? '/profile' : '/auth/signin'} className="flex items-center gap-3 text-muted-foreground" onClick={() => setOpen(false)}><User className="w-5 h-5"/>{session?.user ? 'Profil' : 'Anmelden'}</Link>
        </div>
      )}
    </nav>
  )
}

export default SiteHeader

