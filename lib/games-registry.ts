// @ts-nocheck
/**
 * GLXY Gaming Platform - Complete Games Registry
 * 
 * Zentrales Registry für alle verfügbaren Spiele
 * Automatisch generiert aus dem Backup
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
 * Komplettes Spiele-Registry
 * Sortiert nach Kategorien
 */
export const GAMES_REGISTRY: Game[] = [
  // ========================================
  // BOARD GAMES
  // ========================================
  {
    id: 'chess',
    name: 'Schach Meister',
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
  {
    id: 'connect4-2025',
    name: 'Connect 4 Ultimate',
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
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe XL',
    description: 'Der Klassiker neu erfunden',
    category: 'board',
    icon: '❌',
    href: '/games/tictactoe',
    componentPath: 'components/games/board/tictactoe-engine.tsx',
    players: '1v1',
    duration: '2-5m',
    difficulty: '★',
    isNew: false,
    isBeta: false,
    isFeatured: false,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Blitz', 'KI', 'Online'],
    tags: ['klassiker', 'schnell', 'casual'],
    minPlayers: 2,
    maxPlayers: 2
  },

  // ========================================
  // CARD GAMES
  // ========================================
  {
    id: 'uno',
    name: 'UNO Championship',
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
  // PUZZLE GAMES
  // ========================================
  {
    id: 'tetris-battle',
    name: 'Tetris Battle 2025',
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
  // RACING GAMES
  // ========================================
  {
    id: 'drift-racing',
    name: 'Drift Racing Ultimate',
    description: 'Hochgeschwindigkeits-Rennen mit Style',
    category: 'racing',
    icon: '🏎️',
    href: '/games/racing',
    componentPath: 'components/games/racing/enhanced-drift-racer.tsx',
    players: '1-8',
    duration: '5-15m',
    difficulty: '★★★',
    isNew: false,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Drift Points', 'Tuning', 'Ligen', 'Bestzeiten'],
    tags: ['racing', 'action', 'arcade'],
    minPlayers: 1,
    maxPlayers: 8
  },
  {
    id: 'racing-3d',
    name: 'Racing 3D Pro',
    description: 'Realistische 3D-Renn-Simulation',
    category: 'racing',
    icon: '🚗',
    href: '/games/racing-3d',
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
    features: ['Realistische Physik', 'Wetterbedingungen', 'Karriere-Modus'],
    tags: ['simulation', 'racing', 'realistisch'],
    minPlayers: 1,
    maxPlayers: 12
  },
  {
    id: 'battle-royale-racing',
    name: 'Battle Royale Racing',
    description: 'Letzter am Ziel gewinnt!',
    category: 'racing',
    icon: '🏁',
    href: '/games/battle-royale-racing',
    componentPath: 'components/games/racing/battle-royale-racing.tsx',
    players: '2-50',
    duration: '15-30m',
    difficulty: '★★★★',
    isNew: true,
    isBeta: true,
    isFeatured: true,
    hasPractice: false,
    hasMultiplayer: true,
    hasAI: false,
    features: ['Battle Royale', 'Elimination', 'Power-Ups'],
    tags: ['battle-royale', 'racing', 'chaos'],
    minPlayers: 2,
    maxPlayers: 50
  },

  // ========================================
  // FPS GAMES (Die 118+ Games!)
  // ========================================
  {
    id: 'glxy-fps-core',
    name: 'GLXY Battle Arena',
    description: 'Taktischer Shooter der nächsten Generation',
    category: 'fps',
    icon: '🎯',
    href: '/games/fps',
    componentPath: 'components/games/fps/GLXYFPSCore.tsx',
    players: '1-16',
    duration: '10-30m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Ranked', 'Clans', 'Waffen', 'Maps', 'Tactical'],
    tags: ['shooter', 'tactical', 'competitive'],
    minPlayers: 1,
    maxPlayers: 16
  },
  {
    id: 'battle-royale',
    name: 'GLXY Battle Royale',
    description: '100 Spieler, 1 Gewinner',
    category: 'fps',
    icon: '👑',
    href: '/games/battle-royale',
    componentPath: 'components/games/fps/battle-royale/core/GLXYBattleRoyaleCore.tsx',
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
  {
    id: 'tactical-fps',
    name: 'Tactical Strike',
    description: 'Militär-Simulation für Profis',
    category: 'fps',
    icon: '🪖',
    href: '/games/tactical-fps',
    componentPath: 'components/games/fps/TacticalFPSGame.tsx',
    players: '1-10',
    duration: '15-45m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Realistische Waffen', 'Teamwork', 'Tactical Equipment'],
    tags: ['tactical', 'realistic', 'military'],
    minPlayers: 1,
    maxPlayers: 10
  },
  {
    id: 'military-demo',
    name: 'Military Operations',
    description: 'Realistische Militär-Operationen',
    category: 'fps',
    icon: '🎖️',
    href: '/games/military',
    componentPath: 'components/games/fps/MilitaryDemo.tsx',
    players: '1-12',
    duration: '20-60m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: false,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Realistische Modelle', 'Taktik', 'Mission Briefings'],
    tags: ['military', 'simulation', 'tactical'],
    minPlayers: 1,
    maxPlayers: 12
  },
  {
    id: 'arcade-shooter',
    name: 'Arcade Shooter',
    description: 'Klassischer Arcade-Action-Shooter',
    category: 'fps',
    icon: '🔫',
    href: '/games/arcade-shooter',
    componentPath: 'components/games/fps/arcade-shooter.tsx',
    players: '1-4',
    duration: '5-15m',
    difficulty: '★★★',
    isNew: false,
    isBeta: false,
    isFeatured: false,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Schnelles Gameplay', 'Power-Ups', 'High Score'],
    tags: ['arcade', 'casual', 'retro'],
    minPlayers: 1,
    maxPlayers: 4
  },
  {
    id: 'modern-fps',
    name: 'Modern Warfare',
    description: 'Moderner militärischer Shooter',
    category: 'fps',
    icon: '⚡',
    href: '/games/modern-fps',
    componentPath: 'components/games/fps/modern-fps.tsx',
    players: '1-16',
    duration: '10-30m',
    difficulty: '★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Moderne Waffen', 'Killstreaks', 'Loadouts'],
    tags: ['modern', 'action', 'fast-paced'],
    minPlayers: 1,
    maxPlayers: 16
  },
  {
    id: 'ego-shooter',
    name: 'First Person Arena',
    description: 'Klassisches FPS-Erlebnis',
    category: 'fps',
    icon: '🎮',
    href: '/games/ego-shooter',
    componentPath: 'components/games/fps/ego-shooter.tsx',
    players: '1-8',
    duration: '10-20m',
    difficulty: '★★★★',
    isNew: false,
    isBeta: false,
    isFeatured: false,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Arena Combat', 'Weapon Pickups', 'Deathmatch'],
    tags: ['classic', 'arena', 'fps'],
    minPlayers: 1,
    maxPlayers: 8
  },
  {
    id: 'advanced-3d-fps',
    name: 'Advanced 3D Shooter',
    description: 'Fortgeschrittener 3D-Shooter mit Ultra-Grafik',
    category: 'fps',
    icon: '💎',
    href: '/games/advanced-3d-fps',
    componentPath: 'components/games/fps/advanced-3d-fps.tsx',
    players: '1-16',
    duration: '15-45m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Ultra Graphics', 'Advanced Physics', 'Dynamic Environment'],
    tags: ['advanced', '3d', 'graphics'],
    minPlayers: 1,
    maxPlayers: 16
  },
  {
    id: 'military-operators',
    name: 'Military Operators',
    description: 'Elite Special Forces Operations',
    category: 'fps',
    icon: '🎖️',
    href: '/games/military-operators',
    componentPath: 'components/games/fps/MilitaryOperators.tsx',
    players: '1-10',
    duration: '20-60m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Realistische Operators', 'Tactical Gear', 'Team Commands'],
    tags: ['military', 'tactical', 'realistic'],
    minPlayers: 1,
    maxPlayers: 10
  },
  {
    id: 'military-tactical-scene',
    name: 'Tactical Combat Zone',
    description: 'Realistische Kampfszenarien',
    category: 'fps',
    icon: '⚔️',
    href: '/games/tactical-scene',
    componentPath: 'components/games/fps/MilitaryTacticalScene.tsx',
    players: '1-12',
    duration: '15-45m',
    difficulty: '★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Realistische Szenen', 'Tactical Movement', 'Cover System'],
    tags: ['tactical', 'combat', 'realistic'],
    minPlayers: 1,
    maxPlayers: 12
  },
  {
    id: 'shootingstar',
    name: 'Shooting Star Arena',
    description: 'Weltraum-Shooter-Action',
    category: 'fps',
    icon: '🌟',
    href: '/games/shootingstar',
    componentPath: 'components/games/fps/ShootingstarGame.tsx',
    players: '1-8',
    duration: '10-25m',
    difficulty: '★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Space Combat', 'Zero Gravity', 'Alien Enemies'],
    tags: ['space', 'scifi', 'arcade'],
    minPlayers: 1,
    maxPlayers: 8
  },
  {
    id: 'realistic-military',
    name: 'Realistic Military Ops',
    description: 'Ultra-realistische Militär-Simulation',
    category: 'fps',
    icon: '🪖',
    href: '/games/realistic-military',
    componentPath: 'components/games/fps/RealisticMilitaryModelsDemo.tsx',
    players: '1-16',
    duration: '30-90m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Ultra Realistic Models', 'Authentic Weapons', 'Mission Briefings'],
    tags: ['realistic', 'simulation', 'hardcore'],
    minPlayers: 1,
    maxPlayers: 16
  },
  {
    id: 'tactical-class-viewer',
    name: 'Tactical Class Selector',
    description: 'Wähle deine Operator-Klasse',
    category: 'fps',
    icon: '👤',
    href: '/games/tactical-classes',
    componentPath: 'components/games/fps/TacticalClassViewer.tsx',
    players: '1-12',
    duration: '15-40m',
    difficulty: '★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: false,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Class System', 'Loadout Customization', 'Abilities'],
    tags: ['tactical', 'classes', 'rpg-elements'],
    minPlayers: 1,
    maxPlayers: 12
  },
  {
    id: 'fps-game-enhanced',
    name: 'FPS Enhanced Edition',
    description: 'Verbessertes FPS-Erlebnis',
    category: 'fps',
    icon: '🔥',
    href: '/games/fps-enhanced',
    componentPath: 'components/games/fps/FPSGameEnhanced.tsx',
    players: '1-16',
    duration: '10-30m',
    difficulty: '★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Enhanced Graphics', 'Better Controls', 'More Weapons'],
    tags: ['enhanced', 'improved', 'action'],
    minPlayers: 1,
    maxPlayers: 16
  },
  {
    id: 'battle-royale-phase3',
    name: 'Battle Royale Phase 3',
    description: 'Die ultimative Battle Royale Experience',
    category: 'fps',
    icon: '👑',
    href: '/games/battle-royale-phase3',
    componentPath: 'components/games/fps/GLXYBattleRoyalePhase3.tsx',
    players: '1-100',
    duration: '20-50m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: true,
    isFeatured: true,
    hasPractice: false,
    hasMultiplayer: true,
    hasAI: false,
    features: ['100 Spieler', 'Dynamic Storm', 'Advanced Loot', 'Squad Mode'],
    tags: ['battle-royale', 'competitive', 'hardcore'],
    minPlayers: 1,
    maxPlayers: 100
  },
  
  // ========================================
  // ADDITIONAL MULTIPLAYER VARIANTS
  // ========================================
  {
    id: 'multiplayer-connect4',
    name: 'Connect 4 Multiplayer',
    description: '4 Gewinnt - Online Battles',
    category: 'board',
    icon: '🔴',
    href: '/games/connect4-multiplayer',
    componentPath: 'components/games/connect4/multiplayer-connect4.tsx',
    players: '2',
    duration: '5-10m',
    difficulty: '★★',
    isNew: true,
    isBeta: false,
    isFeatured: false,
    hasPractice: false,
    hasMultiplayer: true,
    hasAI: false,
    features: ['Real-time Multiplayer', 'Chat', 'Rankings'],
    tags: ['multiplayer', 'quick', 'competitive'],
    minPlayers: 2,
    maxPlayers: 2
  },
  {
    id: 'multiplayer-tictactoe',
    name: 'Tic Tac Toe Online',
    description: 'Der Klassiker - Online',
    category: 'board',
    icon: '⭕',
    href: '/games/tictactoe-multiplayer',
    componentPath: 'components/games/tictactoe/multiplayer-tictactoe.tsx',
    players: '2',
    duration: '2-5m',
    difficulty: '★',
    isNew: false,
    isBeta: false,
    isFeatured: false,
    hasPractice: false,
    hasMultiplayer: true,
    hasAI: false,
    features: ['Instant Matches', 'Quick Rounds', 'Global Opponents'],
    tags: ['multiplayer', 'fast', 'casual'],
    minPlayers: 2,
    maxPlayers: 2
  },
  {
    id: 'multiplayer-tetris',
    name: 'Tetris Battle Multiplayer',
    description: 'Kompetitives Tetris 1v1',
    category: 'puzzle',
    icon: '🎮',
    href: '/games/tetris-multiplayer',
    componentPath: 'components/games/tetris/multiplayer-tetris.tsx',
    players: '1-4',
    duration: '5-15m',
    difficulty: '★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: false,
    hasMultiplayer: true,
    hasAI: false,
    features: ['Battle Mode', 'Attack System', 'Garbage Lines'],
    tags: ['multiplayer', 'competitive', 'puzzle'],
    minPlayers: 2,
    maxPlayers: 4
  },
  {
    id: 'tetris-enhanced',
    name: 'Tetris Enhanced Engine',
    description: 'Modernes Tetris mit Power-Ups',
    category: 'puzzle',
    icon: '🧩',
    href: '/games/tetris-enhanced',
    componentPath: 'components/games/tetris/enhanced-tetris-engine.tsx',
    players: '1',
    duration: '10-∞',
    difficulty: '★★★',
    isNew: true,
    isBeta: false,
    isFeatured: false,
    hasPractice: true,
    hasMultiplayer: false,
    hasAI: false,
    features: ['Modern Graphics', 'Power-Ups', 'Marathon Mode'],
    tags: ['single-player', 'endless', 'arcade'],
    minPlayers: 1,
    maxPlayers: 1
  },
  {
    id: 'chess-ai',
    name: 'Chess AI Engine',
    description: 'Schach gegen fortschrittliche KI',
    category: 'board',
    icon: '♛',
    href: '/games/chess-ai',
    componentPath: 'components/games/chess/ai-chess-engine.tsx',
    players: '1',
    duration: '15-45m',
    difficulty: '★★★★★',
    isNew: false,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: false,
    hasAI: true,
    features: ['Stockfish Engine', 'Multiple Difficulties', 'Analysis Board'],
    tags: ['ai', 'strategy', 'training'],
    minPlayers: 1,
    maxPlayers: 1
  },
  {
    id: 'chess-ultimate',
    name: 'Ultimate Chess Engine',
    description: 'Das ultimative Schacherlebnis',
    category: 'board',
    icon: '♚',
    href: '/games/chess-ultimate',
    componentPath: 'components/games/chess/ultimate-chess-engine.tsx',
    players: '1-2',
    duration: '20-60m',
    difficulty: '★★★★★',
    isNew: true,
    isBeta: false,
    isFeatured: true,
    hasPractice: true,
    hasMultiplayer: true,
    hasAI: true,
    features: ['Advanced AI', 'Online Play', 'Tournaments', 'Analytics'],
    tags: ['ultimate', 'competitive', 'professional'],
    minPlayers: 1,
    maxPlayers: 2
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

