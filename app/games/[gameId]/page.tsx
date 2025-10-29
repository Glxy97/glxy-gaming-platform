// @ts-nocheck
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { getGameById } from '@/lib/games-registry'
import { GamingButton } from '@/components/ui/gaming-button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { gamePreloader } from '@/lib/game-preloader'

/**
 * Professional Game Component Mapping
 * 
 * Maps game IDs to their respective component imports.
 * Includes URL aliases for backward compatibility.
 * 
 * Convention:
 * - Primary ID: Matches the registry ID exactly
 * - Aliases: For URL compatibility (marked with // ALIAS comment)
 */
const GameComponents = {
  // ========================================
  // FPS GAMES
  // ========================================
  
  // Core FPS Games
  'glxy-fps-core': () => import('@/components/games/fps/GLXYFPSCore'),
  'fps': () => import('@/components/games/fps/GLXYFPSCore'), // ALIAS: URL compatibility
  
  // Battle Royale Games
  'battle-royale': () => import('@/components/games/fps/battle-royale/BattleRoyaleWrapper'),
  'battle-royale-phase3': () => import('@/components/games/fps/GLXYBattleRoyalePhase3'),
  
  // Tactical FPS Games
  'tactical-fps': () => import('@/components/games/fps/TacticalFPSGame'),
  'military-tactical-scene': () => import('@/components/games/fps/MilitaryTacticalScene'),
  'tactical-scene': () => import('@/components/games/fps/MilitaryTacticalScene'), // ALIAS: URL compatibility
  'tactical-class-viewer': () => import('@/components/games/fps/TacticalClassViewer'),
  
  // Military FPS Games
  'military-demo': () => import('@/components/games/fps/MilitaryDemo'),
  'military': () => import('@/components/games/fps/MilitaryDemo'), // ALIAS: URL compatibility
  'military-operators': () => import('@/components/games/fps/MilitaryOperators'),
  'realistic-military': () => import('@/components/games/fps/RealisticMilitaryModelsDemo'),
  
  // Arcade/Casual FPS Games
  'arcade-shooter': () => import('@/components/games/fps/arcade-shooter'),
  'modern-fps': () => import('@/components/games/fps/modern-fps'),
  'ego-shooter': () => import('@/components/games/fps/ego-shooter'),
  'advanced-3d-fps': () => import('@/components/games/fps/advanced-3d-fps'),
  'shootingstar': () => import('@/components/games/fps/ShootingstarGame'),
  'fps-game-enhanced': () => import('@/components/games/fps/FPSGameEnhanced'),
  'fps-enhanced': () => import('@/components/games/fps/FPSGameEnhanced'), // ALIAS: URL compatibility
  
  // ========================================
  // RACING GAMES
  // ========================================
  'drift-racing': () => import('@/components/games/racing/enhanced-drift-racer'),
  'racing': () => import('@/components/games/racing/enhanced-drift-racer'), // ALIAS: URL compatibility
  'racing-3d': () => import('@/components/games/racing/ultimate-racing-3d'),
  'racing-3d-enhanced': () => import('@/components/games/racing/racing-3d-enhanced'),
  'battle-royale-racing': () => import('@/components/games/racing/battle-royale-racing'),
  
  // ========================================
  // BOARD GAMES
  // ========================================
  
  // Chess Variants
  'chess': () => import('@/components/games/chess/enhanced-chess-game'),
  'chess-ai': () => import('@/components/games/chess/ai-chess-engine'),
  'chess-ultimate': () => import('@/components/games/chess/ultimate-chess-engine'),
  
  // Connect4 Variants
  'connect4-2025': () => import('@/components/games/board/connect4-2025'),
  'connect4': () => import('@/components/games/board/connect4-2025'), // ALIAS: URL compatibility
  'multiplayer-connect4': () => import('@/components/games/connect4/multiplayer-connect4'),
  
  // TicTacToe Variants
  'tictactoe': () => import('@/components/games/board/tictactoe-engine'),
  'multiplayer-tictactoe': () => import('@/components/games/tictactoe/multiplayer-tictactoe'),
  
  // ========================================
  // PUZZLE GAMES
  // ========================================
  'tetris-battle': () => import('@/components/games/tetris/tetris-battle-2025'),
  'tetris': () => import('@/components/games/tetris/tetris-battle-2025'), // ALIAS: URL compatibility
  'tetris-enhanced': () => import('@/components/games/tetris/enhanced-tetris-engine'),
  'multiplayer-tetris': () => import('@/components/games/tetris/multiplayer-tetris'),
  
  // ========================================
  // CARD GAMES
  // ========================================
  'uno': () => import('@/components/games/card/uno-online'),
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [GameComponent, setGameComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const gameId = params.gameId as string
  const game = getGameById(gameId)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/games/${gameId}`)
      return
    }

    // Lade Game-Komponente dynamisch mit Preload-Support
    const loadGame = async () => {
      try {
        setLoading(true)
        setError(null)

        const componentLoader = GameComponents[gameId as keyof typeof GameComponents]
        
        if (!componentLoader) {
          setError(`Game "${gameId}" nicht gefunden oder noch nicht implementiert.`)
          setLoading(false)
          return
        }

        // Prüfe ob bereits vorgeladen
        const preloaded = gamePreloader.getPreloaded(gameId)
        if (preloaded) {
          console.log(`[GamePage] ✅ Using preloaded component: ${gameId}`)
          setGameComponent(() => preloaded)
          setLoading(false)
          return
        }

        // Ansonsten normal laden
        const module = await componentLoader()
        const component = module.default || module
        setGameComponent(() => component)
        setLoading(false)
      } catch (err) {
        console.error('Error loading game:', err)
        setError('Fehler beim Laden des Spiels.')
        setLoading(false)
      }
    }

    loadGame()
  }, [session, status, router, gameId])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gaming-dark via-background to-gaming-dark/50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gaming-primary mt-4 font-orbitron">Lade {game?.name || 'Spiel'}...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gaming-dark via-background to-gaming-dark/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="text-6xl mb-6">🎮</div>
          <h1 className="text-3xl font-orbitron font-bold text-gaming-primary mb-4">
            Spiel nicht gefunden
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || `Das Spiel "${gameId}" existiert nicht oder ist noch nicht verfügbar.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/games">
              <GamingButton>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zu Spielen
              </GamingButton>
            </Link>
            <Link href="/">
              <GamingButton variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Startseite
              </GamingButton>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark via-background to-gaming-dark/50">
      {/* Game Header */}
      <div className="border-b border-gaming-primary/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/games">
                <GamingButton variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </GamingButton>
              </Link>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{game.icon}</div>
                <div>
                  <h1 className="text-xl font-bold text-gaming-primary font-orbitron">
                    {game.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {game.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {game.isNew && <Badge className="bg-gaming-accent">NEU</Badge>}
              {game.isBeta && <Badge variant="outline">BETA</Badge>}
              <Badge variant="outline">{game.players}</Badge>
              <Badge variant="outline">{game.difficulty}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="container mx-auto px-4 py-8">
        {GameComponent ? (
          <GameComponent />
        ) : (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </div>
    </div>
  )
}

