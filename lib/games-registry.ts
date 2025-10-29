// @ts-nocheck
/**
 * GLXY Gaming Platform - Games Registry
 * 
 * Zentrales Registry für alle verfügbaren Spiele
 * Reduziert auf 7 Hauptspiele für Clean Structure
 */

export interface Game {
  id: string
  name: string
  description: string
  category: 'board' | 'card' | 'fps' | 'racing' | 'puzzle' | 'strategy' | 'action'
  icon: string
  href: string
  componentPath: string
  players: string
  duration: string
  difficulty: '★' | '★★' | '★★★' | '★★★★' | '★★★★★'
  isNew: boolean
  isBeta: boolean
  isFeatured: boolean
  hasPractice: boolean
  hasMultiplayer: boolean
  hasAI: boolean
  features: string[]
  tags: string[]
  minPlayers: number
  maxPlayers: number
}

/**
 * Spiele-Registry - 7 Hauptspiele
 */
export const GAMES_REGISTRY: Game[] = [
  // ========================================
  // 1. SCHACH
  // ========================================
  {
    id: 'chess',
    name: '♔ Schach Meister',
    description: 'Strategisches Brettspiel für echte Denker',
    category: 'board',
    icon: '♔',
    href: '/games/chess',
    componentPath: 'components/games/chess/enhanced-chess-game.tsx',
    players: '1v1',
    duration: '15-45m',
    difficulty: '★★★★',
    isNew: false,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['ELO Rating', 'KI Gegner', 'Analyse', 'Turniere'],
    tags: ['strategie', 'klassiker', 'denksport'],
    minPlayers: 2,
    maxPlayers: 2
  },

  // ========================================
  // 2. RACING
  // ========================================
  {
    id: 'racing',
    name: '🏎️ Racing 3D Ultimate',
    description: 'Hochgeschwindigkeits-Rennen mit Style',
    category: 'racing',
    icon: '🏎️',
    href: '/games/racing',
    componentPath: 'components/games/racing/ultimate-racing-3d.tsx',
    players: '1-12',
    duration: '10-20m',
    difficulty: '★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Realistische Physik', 'Wetterbedingungen', 'Karriere-Modus', 'Drift Points'],
    tags: ['racing', 'action', 'simulation', 'realisti'],
    minPlayers: 1,
    maxPlayers: 12
  },

  // ========================================
  // 3. UNO
  // ========================================
  {
    id: 'uno',
    name: '🃏 UNO Championship',
    description: 'Das klassische Kartenspiel neu erfunden',
    category: 'card',
    icon: '🃏',
    href: '/games/uno',
    componentPath: 'components/games/card/uno-online.tsx',
    players: '2-8',
    duration: '10-30m',
    difficulty: '★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Power-Ups', 'Teams', 'Challenges', 'Events'],
    tags: ['party', 'karten', 'spaß'],
    minPlayers: 2,
    maxPlayers: 8
  },

  // ========================================
  // 4. CONNECT 4
  // ========================================
  {
    id: 'connect4',
    name: '🔴 Connect 4 Ultimate',
    description: '4 Gewinnt mit modernem Twist',
    category: 'board',
    icon: '🔴',
    href: '/games/connect4',
    componentPath: 'components/games/board/connect4-2025.tsx',
    players: '1v1',
    duration: '5-15m',
    difficulty: '★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Schnelles Spiel', 'KI', 'Online'],
    tags: ['puzzle', 'schnell', 'familie'],
    minPlayers: 2,
    maxPlayers: 2
  },

  // ========================================
  // 5. TETRIS
  // ========================================
  {
    id: 'tetris',
    name: '🧱 Tetris Battle 2025',
    description: 'Kompetitives Tetris mit Power-Ups',
    category: 'puzzle',
    icon: '🧱',
    href: '/games/tetris',
    componentPath: 'components/games/tetris/tetris-battle-2025.tsx',
    players: '1-4',
    duration: '5-15m',
    difficulty: '★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: false,
    features: ['Battle Mode', 'Marathon', 'Sprint', 'Multiplayer'],
    tags: ['puzzle', 'arcade', 'klassiker'],
    minPlayers: 1,
    maxPlayers: 4
  },

  // ========================================
  // 6. BATTLE ROYALE
  // ========================================
  {
    id: 'battle-royale',
    name: '👑 GLXY Battle Royale',
    description: '100 Spieler, 1 Gewinner',
    category: 'fps',
    icon: '👑',
    href: '/games/battle-royale',
    componentPath: 'components/games/fps/battle-royale/GLXYBattleRoyaleGame.tsx',
    players: '1-100',
    duration: '20-45m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: true,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: false,
    features: ['100 Spieler', 'Shrinking Zone', 'Loot System', 'Squad Mode'],
    tags: ['battle-royale', 'survival', 'hardcore'],
    minPlayers: 1,
    maxPlayers: 100
  },

  // ========================================
  // 7. FPS
  // ========================================
  {
    id: 'fps',
    name: '💎 GLXY Ultimate FPS',
    description: 'Das süchtig machendste Browser-FPS',
    category: 'fps',
    icon: '💎',
    href: '/games/fps',
    componentPath: 'components/games/fps/ultimate/UltimateFPSGame.tsx',
    players: '1-16',
    duration: '10-30m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: false,
    hasAI: true,
    features: ['Three.js 3D', 'Smart AI', 'Cinematic Effects', '3 Waffen', 'Progression', 'Stats Tracking'],
    tags: ['fps', '3d', 'action', 'shooter', 'ultimate'],
    minPlayers: 1,
    maxPlayers: 16
  }
]

/**
 * Filtert Spiele nach Kategorie
 */
export function getGamesByCategory(category: Game['category']): Game[] {
  return GAMES_REGISTRY.filter(game => game.category === category)
}

/**
 * Filtert neue Spiele
 */
export function getNewGames(): Game[] {
  return GAMES_REGISTRY.filter(game => game.isNew)
}

/**
 * Filtert Featured Spiele
 */
export function getFeaturedGames(): Game[] {
  return GAMES_REGISTRY.filter(game => game.isFeatured)
}

/**
 * Filtert Multiplayer-Spiele
 */
export function getMultiplayerGames(): Game[] {
  return GAMES_REGISTRY.filter(game => game.hasMultiplayer)
}

/**
 * Sucht Spiele nach Name oder Tag
 */
export function searchGames(query: string): Game[] {
  const lowerQuery = query.toLowerCase()
  return GAMES_REGISTRY.filter(game => 
    game.name.toLowerCase().includes(lowerQuery) ||
    game.description.toLowerCase().includes(lowerQuery) ||
    game.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Holt ein einzelnes Spiel nach ID
 */
export function getGameById(id: string): Game | undefined {
  return GAMES_REGISTRY.find(game => game.id === id)
}

/**
 * Kategorien mit Anzahl
 */
export function getCategoryStats() {
  const stats = {
    board: 0,
    card: 0,
    fps: 0,
    racing: 0,
    puzzle: 0,
    strategy: 0,
    action: 0
  }
  
  GAMES_REGISTRY.forEach(game => {
    stats[game.category]++
  })
  
  return stats
}

/**
 * Gesamtanzahl Spiele
 */
export function getTotalGamesCount(): number {
  return GAMES_REGISTRY.length
}
