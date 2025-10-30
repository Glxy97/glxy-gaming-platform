/**
 * 🎨 ULTIMATE ASSET DATABASE
 * 
 * Vollständige Inventur aller verfügbaren Assets mit Qualitäts-Ranking
 * Auto-Selection der BESTEN Assets für optimale Performance & Qualität
 */

export interface AssetMetadata {
  id: string
  name: string
  path: string
  category: 'character' | 'weapon' | 'map' | 'prop'
  quality: 'ultra' | 'high' | 'medium' | 'low'
  textureResolution?: '8k' | '4k' | '2k' | '1k'
  polyCount?: 'ultra' | 'high' | 'medium' | 'low'
  hasPBR?: boolean
  hasAnimations?: boolean
  source?: string
  license?: string
  fileSize?: string
  usage: 'player' | 'enemy' | 'both'
  performance: number // 1-10 (10 = beste Performance)
  visual: number // 1-10 (10 = beste Visuals)
  score: number // Gesamtscore (Performance + Visual)
}

// ============================================================================
// 🏆 CHARACTER MODELS - Ranked by Quality
// ============================================================================

export const CHARACTER_ASSETS: AssetMetadata[] = [
  // ⭐⭐⭐⭐⭐ TIER S - Absolute Best (Professional Folder)
  {
    id: 'tactical_operator_4k',
    name: 'Tactical Operator (4K)',
    path: '/models/professional/tactical_game_ready_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    polyCount: 'medium',
    hasPBR: true,
    hasAnimations: true,
    source: 'Sketchfab - DanlyVostok',
    license: 'CC-BY-4.0',
    usage: 'player',
    performance: 7,
    visual: 10,
    score: 17
  },
  {
    id: 'tactical_operator_1k',
    name: 'Tactical Operator (1K Optimized)',
    path: '/models/professional/tactical_game_ready_1k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '1k',
    polyCount: 'medium',
    hasPBR: true,
    hasAnimations: true,
    usage: 'both',
    performance: 9,
    visual: 8,
    score: 17
  },

  // ⭐⭐⭐⭐ TIER A - CoD World at War HD Characters
  {
    id: 'comoff_4k',
    name: 'Comoff Marine (CoD WaW HD 4K)',
    path: '/models/professional/Comoff_military_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    polyCount: 'high',
    hasPBR: true,
    usage: 'player',
    performance: 6,
    visual: 9,
    score: 15
  },
  {
    id: 'comoff_1k',
    name: 'Comoff Marine (CoD WaW HD 1K)',
    path: '/models/professional/Comoff_military_1k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '1k',
    polyCount: 'high',
    hasPBR: true,
    usage: 'enemy',
    performance: 9,
    visual: 7,
    score: 16
  },
  {
    id: 'reznov_4k',
    name: 'Reznov (Russian Soldier 4K)',
    path: '/models/professional/reznov_russian_soldier_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    polyCount: 'high',
    hasPBR: true,
    usage: 'player',
    performance: 6,
    visual: 9,
    score: 15
  },
  {
    id: 'reznov_1k',
    name: 'Reznov (Russian Soldier 1K)',
    path: '/models/professional/reznov_russian_soldier_1k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '1k',
    polyCount: 'high',
    hasPBR: true,
    usage: 'enemy',
    performance: 9,
    visual: 7,
    score: 16
  },
  {
    id: 'polonsky_4k',
    name: 'Polonsky (US Marine 4K)',
    path: '/models/professional/Polonsky_military_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    hasPBR: true,
    usage: 'player',
    performance: 6,
    visual: 9,
    score: 15
  },
  {
    id: 'sullivan_4k',
    name: 'Sullivan (US Marine 4K)',
    path: '/models/professional/Sullivan_military_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    hasPBR: true,
    usage: 'player',
    performance: 6,
    visual: 9,
    score: 15
  },

  // ⭐⭐⭐ TIER B - Specialized Characters
  {
    id: 'ghost_4k',
    name: 'Ghost Operator (4K)',
    path: '/models/professional/ghost_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    hasPBR: true,
    usage: 'both',
    performance: 6,
    visual: 9,
    score: 15
  },
  {
    id: 'ghost_1k',
    name: 'Ghost Operator (1K)',
    path: '/models/professional/ghost_1k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '1k',
    hasPBR: true,
    usage: 'enemy',
    performance: 9,
    visual: 7,
    score: 16
  },
  {
    id: 'criminal_8k',
    name: 'Criminal (8K Ultra)',
    path: '/models/professional/criminal_8k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '8k',
    hasPBR: true,
    usage: 'player',
    performance: 4,
    visual: 10,
    score: 14
  },
  {
    id: 'criminal_4k',
    name: 'Criminal (4K)',
    path: '/models/professional/criminal_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    hasPBR: true,
    usage: 'player',
    performance: 6,
    visual: 9,
    score: 15
  },
  {
    id: 'criminal_1k',
    name: 'Criminal (1K)',
    path: '/models/professional/criminal_1k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '1k',
    hasPBR: true,
    usage: 'enemy',
    performance: 9,
    visual: 7,
    score: 16
  },
  {
    id: 'police_suit_8k',
    name: 'Police Officer (8K Ultra)',
    path: '/models/professional/police_suit_8k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '8k',
    hasPBR: true,
    usage: 'player',
    performance: 4,
    visual: 10,
    score: 14
  },
  {
    id: 'police_suit_4k',
    name: 'Police Officer (4K)',
    path: '/models/professional/police_suit_4k.glb',
    category: 'character',
    quality: 'ultra',
    textureResolution: '4k',
    hasPBR: true,
    usage: 'both',
    performance: 6,
    visual: 9,
    score: 15
  },
  {
    id: 'police_suit_1k',
    name: 'Police Officer (1K)',
    path: '/models/professional/police_suit_1k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '1k',
    hasPBR: true,
    usage: 'enemy',
    performance: 9,
    visual: 7,
    score: 16
  },
  {
    id: 'terrorist_2k',
    name: 'Terrorist (2K)',
    path: '/models/professional/terrorist_2k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '2k',
    hasPBR: true,
    usage: 'enemy',
    performance: 8,
    visual: 7,
    score: 15
  },
  {
    id: 'terrorist_1k',
    name: 'Terrorist (1K)',
    path: '/models/professional/terrorist_1k.glb',
    category: 'character',
    quality: 'high',
    textureResolution: '1k',
    hasPBR: true,
    usage: 'enemy',
    performance: 9,
    visual: 6,
    score: 15
  },

  // ⭐⭐ TIER C - Simple Characters (Fallback)
  {
    id: 'soldier_basic',
    name: 'Soldier (Basic)',
    path: '/models/characters/soldier.glb',
    category: 'character',
    quality: 'medium',
    polyCount: 'low',
    usage: 'enemy',
    performance: 10,
    visual: 5,
    score: 15
  },
  {
    id: 'military_basic',
    name: 'Military (Basic)',
    path: '/models/characters/military.glb',
    category: 'character',
    quality: 'medium',
    polyCount: 'low',
    usage: 'enemy',
    performance: 10,
    visual: 5,
    score: 15
  }
]

// ============================================================================
// 🔫 WEAPON MODELS
// ============================================================================

export const WEAPON_ASSETS: AssetMetadata[] = [
  // ⭐⭐⭐⭐⭐ TIER S - Professional Weapons
  {
    id: 'beretta_m9_4k',
    name: 'Beretta M9 w/ Suppressor (4K)',
    path: '/models/professional/beretta_m9_w_supressor_4k.glb',
    category: 'weapon',
    quality: 'ultra',
    textureResolution: '4k',
    polyCount: 'high',
    hasPBR: true,
    usage: 'both',
    performance: 7,
    visual: 10,
    score: 17
  },
  {
    id: 'beretta_m9_1k',
    name: 'Beretta M9 w/ Suppressor (1K)',
    path: '/models/professional/beretta_m9_w_supressor_1k.glb',
    category: 'weapon',
    quality: 'high',
    textureResolution: '1k',
    polyCount: 'high',
    hasPBR: true,
    usage: 'both',
    performance: 9,
    visual: 8,
    score: 17
  },
  {
    id: 'weapon_pack',
    name: 'Low Poly Weapon Pack (Multi-Weapon)',
    path: '/models/professional/low_poly_gun_pack_-_weapon_pack_assets.glb',
    category: 'weapon',
    quality: 'high',
    polyCount: 'low',
    usage: 'both',
    performance: 10,
    visual: 7,
    score: 17
  },

  // ⭐⭐⭐ TIER B - Basic Weapons (Current)
  {
    id: 'ak47',
    name: 'AK-47',
    path: '/models/weapons/ak47.glb',
    category: 'weapon',
    quality: 'medium',
    polyCount: 'low',
    usage: 'both',
    performance: 10,
    visual: 6,
    score: 16
  },
  {
    id: 'awp',
    name: 'AWP Sniper',
    path: '/models/weapons/awp.glb',
    category: 'weapon',
    quality: 'medium',
    polyCount: 'low',
    usage: 'both',
    performance: 10,
    visual: 6,
    score: 16
  },
  {
    id: 'mac10',
    name: 'MAC-10 SMG',
    path: '/models/weapons/mac10.glb',
    category: 'weapon',
    quality: 'medium',
    polyCount: 'low',
    usage: 'both',
    performance: 10,
    visual: 6,
    score: 16
  },
  {
    id: 'pistol',
    name: 'Pistol',
    path: '/models/weapons/pistol.glb',
    category: 'weapon',
    quality: 'medium',
    polyCount: 'low',
    usage: 'both',
    performance: 10,
    visual: 6,
    score: 16
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    path: '/models/weapons/shotgun.glb',
    category: 'weapon',
    quality: 'medium',
    polyCount: 'low',
    usage: 'both',
    performance: 10,
    visual: 6,
    score: 16
  }
]

// ============================================================================
// 🗺️ MAP ASSETS
// ============================================================================

export const MAP_ASSETS: AssetMetadata[] = [
  {
    id: 'warface_neon',
    name: 'Warface Neon Arena (PvP/PvE)',
    path: '/data/map-templates/fps-map-pvp-pve-game-neon/source/Warfacemap .glb',
    category: 'map',
    quality: 'high',
    usage: 'both',
    performance: 7,
    visual: 9,
    score: 16
  },
  {
    id: 'police_office',
    name: 'Police Office (92 Texturen)',
    path: '/data/map-templates/police-office/source/Police_Office.glb',
    category: 'map',
    quality: 'ultra',
    usage: 'both',
    performance: 6,
    visual: 10,
    score: 16
  }
  // Dead City muss erst aus RAR extrahiert werden
]

// ============================================================================
// 🎯 SMART ASSET SELECTION
// ============================================================================

/**
 * Wählt automatisch die BESTE Asset-Variante basiert auf:
 * - Verwendungszweck (Player vs. Enemy)
 * - Verfügbarem VRAM
 * - Qualitäts-Präferenz
 * - Performance-Ziel
 */
export class SmartAssetSelector {
  private vramBudget: 'low' | 'medium' | 'high' | 'ultra' = 'high'
  private qualityPreference: 'performance' | 'balanced' | 'quality' = 'balanced'

  constructor(config?: {
    vramBudget?: 'low' | 'medium' | 'high' | 'ultra'
    qualityPreference?: 'performance' | 'balanced' | 'quality'
  }) {
    if (config) {
      this.vramBudget = config.vramBudget || 'high'
      this.qualityPreference = config.qualityPreference || 'balanced'
    }
  }

  /**
   * Wählt BESTE Character-Variante
   */
  selectBestCharacter(usage: 'player' | 'enemy', distance?: number): AssetMetadata {
    let filtered = CHARACTER_ASSETS.filter(a => 
      a.usage === usage || a.usage === 'both'
    )

    // Player: Immer beste Qualität
    if (usage === 'player') {
      filtered = filtered.filter(a => 
        a.quality === 'ultra' && 
        (a.textureResolution === '4k' || a.textureResolution === '2k')
      )
      
      // Sortiere nach Score
      filtered.sort((a, b) => b.score - a.score)
      return filtered[0] || CHARACTER_ASSETS[0]
    }

    // Enemy: LOD basiert auf Distanz
    if (distance !== undefined) {
      if (distance < 20) {
        // Nah: High Quality
        filtered = filtered.filter(a => 
          a.textureResolution === '2k' || a.textureResolution === '1k'
        )
      } else if (distance < 50) {
        // Mittel: Medium Quality
        filtered = filtered.filter(a => a.textureResolution === '1k')
      } else {
        // Fern: Low Quality
        filtered = filtered.filter(a => 
          a.quality === 'medium' || 
          (a.quality === 'high' && a.textureResolution === '1k')
        )
      }
    }

    // Sortiere nach Performance-Score für Enemies
    filtered.sort((a, b) => b.performance - a.performance)
    return filtered[0] || CHARACTER_ASSETS[0]
  }

  /**
   * Wählt BESTE Weapon-Variante
   */
  selectBestWeapon(weaponType: string): AssetMetadata {
    // Priorisiere Professional Weapons
    const professional = WEAPON_ASSETS.filter(a => 
      a.quality === 'ultra' || a.quality === 'high'
    )

    if (this.qualityPreference === 'quality') {
      // Beste Visuals
      const sorted = professional.sort((a, b) => b.visual - a.visual)
      return sorted[0] || WEAPON_ASSETS[0]
    } else {
      // Balance oder Performance
      const sorted = professional.sort((a, b) => b.score - a.score)
      return sorted[0] || WEAPON_ASSETS[0]
    }
  }

  /**
   * Wählt BESTE Map
   */
  selectBestMap(): AssetMetadata {
    if (this.qualityPreference === 'quality') {
      // Police Office = höchste Qualität
      return MAP_ASSETS.find(m => m.id === 'police_office') || MAP_ASSETS[0]
    } else {
      // Warface Neon = bessere Performance
      return MAP_ASSETS.find(m => m.id === 'warface_neon') || MAP_ASSETS[0]
    }
  }

  /**
   * Statistiken über verfügbare Assets
   */
  getAssetStats() {
    return {
      characters: {
        total: CHARACTER_ASSETS.length,
        ultra: CHARACTER_ASSETS.filter(a => a.quality === 'ultra').length,
        high: CHARACTER_ASSETS.filter(a => a.quality === 'high').length,
        medium: CHARACTER_ASSETS.filter(a => a.quality === 'medium').length
      },
      weapons: {
        total: WEAPON_ASSETS.length,
        ultra: WEAPON_ASSETS.filter(a => a.quality === 'ultra').length,
        high: WEAPON_ASSETS.filter(a => a.quality === 'high').length
      },
      maps: {
        total: MAP_ASSETS.length
      },
      totalAssets: CHARACTER_ASSETS.length + WEAPON_ASSETS.length + MAP_ASSETS.length
    }
  }

  /**
   * Empfohlene Assets für verschiedene Szenarien
   */
  getRecommendations() {
    return {
      player_best_quality: this.selectBestCharacter('player'),
      enemy_near: this.selectBestCharacter('enemy', 15),
      enemy_mid: this.selectBestCharacter('enemy', 35),
      enemy_far: this.selectBestCharacter('enemy', 75),
      weapon_best: this.selectBestWeapon('rifle'),
      map_best: this.selectBestMap()
    }
  }
}

/**
 * Exportiere vorkonfigurierte Selector
 */
export const PERFORMANCE_SELECTOR = new SmartAssetSelector({
  vramBudget: 'medium',
  qualityPreference: 'performance'
})

export const BALANCED_SELECTOR = new SmartAssetSelector({
  vramBudget: 'high',
  qualityPreference: 'balanced'
})

export const QUALITY_SELECTOR = new SmartAssetSelector({
  vramBudget: 'ultra',
  qualityPreference: 'quality'
})

