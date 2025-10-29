/**
 * 🚀 Game Preloader - Intelligent Lazy Loading für Games
 * 
 * Funktionen:
 * - Preload Featured Games on Homepage
 * - Lazy Load on User Interaction
 * - Cache Management
 * - Performance Tracking
 */

type GameLoader = () => Promise<any>

interface PreloadedGame {
  gameId: string
  component: any
  loadedAt: number
}

class GamePreloaderService {
  private preloadedGames: Map<string, PreloadedGame> = new Map()
  private loadingPromises: Map<string, Promise<any>> = new Map()
  private maxCacheSize = 10 // Maximal 10 Games im Speicher
  private maxCacheAge = 5 * 60 * 1000 // 5 Minuten

  /**
   * Lädt ein Game im Hintergrund vor
   */
  async preload(gameId: string, loader: GameLoader): Promise<void> {
    // Bereits geladen?
    if (this.preloadedGames.has(gameId)) {
      const cached = this.preloadedGames.get(gameId)!
      // Cache noch gültig?
      if (Date.now() - cached.loadedAt < this.maxCacheAge) {
        return
      }
    }

    // Bereits am Laden?
    if (this.loadingPromises.has(gameId)) {
      await this.loadingPromises.get(gameId)
      return
    }

    // Lade Game im Hintergrund
    const loadPromise = this.loadGameComponent(gameId, loader)
    this.loadingPromises.set(gameId, loadPromise)

    try {
      await loadPromise
    } finally {
      this.loadingPromises.delete(gameId)
    }
  }

  /**
   * Lädt Game-Komponente
   */
  private async loadGameComponent(gameId: string, loader: GameLoader): Promise<void> {
    try {
      const module = await loader()
      const component = module.default || module

      // Cache verwalten
      this.manageCache()

      // Speichern
      this.preloadedGames.set(gameId, {
        gameId,
        component,
        loadedAt: Date.now()
      })

      console.log(`[GamePreloader] ✅ Preloaded: ${gameId}`)
    } catch (error) {
      console.error(`[GamePreloader] ❌ Failed to preload ${gameId}:`, error)
    }
  }

  /**
   * Hole vorgeladenes Game
   */
  getPreloaded(gameId: string): any | null {
    const cached = this.preloadedGames.get(gameId)
    
    if (!cached) return null

    // Cache abgelaufen?
    if (Date.now() - cached.loadedAt > this.maxCacheAge) {
      this.preloadedGames.delete(gameId)
      return null
    }

    return cached.component
  }

  /**
   * Cache-Management: Entferne älteste Games wenn Limit erreicht
   */
  private manageCache(): void {
    if (this.preloadedGames.size < this.maxCacheSize) return

    // Finde ältestes Game
    let oldestGameId: string | null = null
    let oldestTime = Date.now()

    this.preloadedGames.forEach((game, gameId) => {
      if (game.loadedAt < oldestTime) {
        oldestTime = game.loadedAt
        oldestGameId = gameId
      }
    })

    if (oldestGameId) {
      this.preloadedGames.delete(oldestGameId)
      console.log(`[GamePreloader] 🗑️ Removed from cache: ${oldestGameId}`)
    }
  }

  /**
   * Lösche Cache
   */
  clearCache(): void {
    this.preloadedGames.clear()
    console.log('[GamePreloader] 🗑️ Cache cleared')
  }

  /**
   * Preload mehrere Games auf einmal
   */
  async preloadMultiple(games: { gameId: string; loader: GameLoader }[]): Promise<void> {
    const preloadPromises = games.map(({ gameId, loader }) =>
      this.preload(gameId, loader)
    )

    await Promise.allSettled(preloadPromises)
  }

  /**
   * Cache-Status
   */
  getCacheStatus(): { size: number; maxSize: number; games: string[] } {
    return {
      size: this.preloadedGames.size,
      maxSize: this.maxCacheSize,
      games: Array.from(this.preloadedGames.keys())
    }
  }
}

// Singleton-Instanz
export const gamePreloader = new GamePreloaderService()

/**
 * Hook für Preloading auf Homepage
 */
export function preloadFeaturedGames() {
  if (typeof window === 'undefined') return

  // Preload nach 2 Sekunden (nachdem Homepage geladen ist)
  setTimeout(() => {
    const featuredGames = [
      { gameId: 'tactical-fps', loader: () => import('@/components/games/fps/TacticalFPSGame') },
      { gameId: 'battle-royale', loader: () => import('@/components/games/fps/battle-royale/BattleRoyaleWrapper') },
      { gameId: 'drift-racing', loader: () => import('@/components/games/racing/enhanced-drift-racer') },
    ]

    gamePreloader.preloadMultiple(featuredGames)
  }, 2000)
}

/**
 * Preload Game bei Hover (für Game-Cards)
 */
export function preloadOnHover(gameId: string, loader: GameLoader) {
  if (typeof window === 'undefined') return

  gamePreloader.preload(gameId, loader)
}

