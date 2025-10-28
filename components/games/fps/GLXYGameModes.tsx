// @ts-nocheck
'use client'

// ULTIMATE GAME MODES SYSTEM - WAHNSINNIG GOOD!
export interface GameMode {
  id: string
  name: string
  description: string
  type: 'competitive' | 'casual' | 'arcade' | 'hardcore'
  maxPlayers: number
  teamSize: number
  roundTime: number
  livesPerRound: number
  respawnTime: number
  allowAbilities: boolean
  allowMovement: boolean
  allowSpecialWeapons: boolean
  friendlyFire: boolean
  objectives: GameObjective[]
  winConditions: WinCondition[]
  features: string[]
  icon: string
  color: string
  recommendedClasses: string[]
}

export interface GameObjective {
  id: string
  name: string
  description: string
  type: 'elimination' | 'capture' | 'defend' | 'plant' | 'rescue' | 'search' | 'destroy'
  requiredPlayers: number
  timeLimit?: number
  points: number
}

export interface WinCondition {
  type: 'eliminate_all' | 'eliminate_target' | 'score_limit' | 'time_limit' | 'objectives' | 'last_man_standing'
  value: number
  description: string
}

export class GLXYGameModes {
  private modes: GameMode[]

  constructor() {
    this.modes = [
      // REALISTIC MODE - Tactical, No Abilities
      {
        id: 'realistic',
        name: 'REALISTIC',
        description: 'Pure tactical combat. No abilities, no special powers. Just skill.',
        type: 'hardcore',
        maxPlayers: 10,
        teamSize: 5,
        roundTime: 300000, // 5 minutes
        livesPerRound: 1,
        respawnTime: -1, // No respawn until next round
        allowAbilities: false,
        allowMovement: true, // Basic movement only
        allowSpecialWeapons: false,
        friendlyFire: true,
        objectives: [
          {
            id: 'eliminate_opponents',
            name: 'Eliminate Opponents',
            description: 'Eliminate all enemy players',
            type: 'elimination',
            requiredPlayers: 2,
            points: 100
          }
        ],
        winConditions: [
          {
            type: 'eliminate_all',
            value: 1,
            description: 'Eliminate all enemy players'
          },
          {
            type: 'time_limit',
            value: 300000,
            description: 'Team with most players alive wins'
          }
        ],
        features: [
          'Realistic ballistics',
          'Limited ammo',
          'No HUD crosshair',
          'Real weapon damage',
          'Tactical communication',
          'Precision aiming'
        ],
        icon: '🎯',
        color: '#4a5568',
        recommendedClasses: ['assault', 'sharpshooter']
      },

      // ABILITIES MODE - Full Powers
      {
        id: 'abilities',
        name: 'ABILITIES UNLEASHED',
        description: 'All special abilities and powers enabled. Maximum chaos!',
        type: 'arcade',
        maxPlayers: 12,
        teamSize: 6,
        roundTime: 600000, // 10 minutes
        livesPerRound: 3,
        respawnTime: 5000,
        allowAbilities: true,
        allowMovement: true,
        allowSpecialWeapons: true,
        friendlyFire: false,
        objectives: [
          {
            id: 'ability_combos',
            name: 'Ability Combos',
            description: 'Use devastating ability combinations',
            type: 'elimination',
            requiredPlayers: 2,
            points: 150
          },
          {
            id: 'ultimate_elimination',
            name: 'Ultimate Elimination',
            description: 'Eliminate enemies with ultimate abilities',
            type: 'elimination',
            requiredPlayers: 2,
            points: 200
          }
        ],
        winConditions: [
          {
            type: 'score_limit',
            value: 1000,
            description: 'First team to 1000 points'
          },
          {
            type: 'time_limit',
            value: 600000,
            description: 'Team with highest score wins'
          }
        ],
        features: [
          'All special abilities',
          'Ultimate abilities',
          'Ability combos',
          'Enhanced movement',
          'Special weapons',
          'Power-ups',
          'Cinematic effects',
          'Multi-kill streaks'
        ],
        icon: '⚡',
        color: '#9333ea',
        recommendedClasses: ['vanguard', 'medic', 'ghost', 'sharpshooter', 'builder']
      },

      // FAST DEATHMATCH
      {
        id: 'deathmatch',
        name: 'LIGHTNING DEATHMATCH',
        description: 'Instant respawn. Non-stop action. Pure speed and reflexes.',
        type: 'arcade',
        maxPlayers: 16,
        teamSize: 1, // FFA
        roundTime: 300000, // 5 minutes
        livesPerRound: -1, // Unlimited
        respawnTime: 1000, // Instant respawn
        allowAbilities: true,
        allowMovement: true,
        allowSpecialWeapons: true,
        friendlyFire: false,
        objectives: [
          {
            id: 'first_blood',
            name: 'First Blood',
            description: 'Get the first kill of the match',
            type: 'elimination',
            requiredPlayers: 2,
            points: 50
          },
          {
            id: 'kill_streaks',
            name: 'Kill Streaks',
            description: 'Build kill streaks for bonus points',
            type: 'elimination',
            requiredPlayers: 2,
            points: 25
          },
          {
            id: 'domination',
            name: 'Domination',
            description: 'Control power-up locations',
            type: 'capture',
            requiredPlayers: 2,
            points: 75
          }
        ],
        winConditions: [
          {
            type: 'score_limit',
            value: 500,
            description: 'First player to 500 points'
          },
          {
            type: 'time_limit',
            value: 300000,
            description: 'Player with highest score wins'
          }
        ],
        features: [
          'Instant respawn',
          'Fast pacing',
          'Kill notifications',
          'Streak rewards',
          'Power-ups',
          'Leaderboard tracking',
          'Spawn protection'
        ],
        icon: '⚔️',
        color: '#ef4444',
        recommendedClasses: ['vanguard', 'sharpshooter']
      },

      // FREE FOR ALL
      {
        id: 'ffa',
        name: 'FREE FOR ALL CHAOS',
        description: 'Everyone against everyone. No teams. No rules. Survival.',
        type: 'hardcore',
        maxPlayers: 20,
        teamSize: 1,
        roundTime: 600000, // 10 minutes
        livesPerRound: 1,
        respawnTime: 8000,
        allowAbilities: true,
        allowMovement: true,
        allowSpecialWeapons: true,
        friendlyFire: true,
        objectives: [
          {
            id: 'survival',
            name: 'Survive the longest',
            description: 'Be the last player standing',
            type: 'elimination',
            requiredPlayers: 2,
            points: 200
          },
          {
            id: 'hunter_bounty',
            name: 'Hunter Bounty',
            description: 'Eliminate the current bounty target',
            type: 'elimination',
            requiredPlayers: 2,
            points: 100
          },
          {
            id: 'resource_control',
            name: 'Resource Control',
            description: 'Control limited resources and power-ups',
            type: 'capture',
            requiredPlayers: 2,
            points: 50
          }
        ],
        winConditions: [
          {
            type: 'last_man_standing',
            value: 1,
            description: 'Be the last player alive'
          },
          {
            type: 'score_limit',
            value: 300,
            description: 'First player to 300 points'
          }
        ],
        features: [
          'No teams',
          'High tension',
          'Strategic positioning',
          'Limited respawns',
          'Resource scarcity',
          'Bounty system',
          'Survival elements'
        ],
        icon: '👥',
        color: '#f59e0b',
        recommendedClasses: ['ghost', 'sharpshooter', 'vanguard']
      },

      // SEARCH & DESTROY - 1 Life Per Round
      {
        id: 'search_destroy',
        name: 'SEARCH & DESTROY',
        description: 'One life per round. Find and destroy objectives. High stakes.',
        type: 'competitive',
        maxPlayers: 12,
        teamSize: 6,
        roundTime: 900000, // 15 minutes
        livesPerRound: 1,
        respawnTime: -1, // No respawn until next round
        allowAbilities: true,
        allowMovement: true,
        allowSpecialWeapons: true,
        friendlyFire: false,
        objectives: [
          {
            id: 'search_sites',
            name: 'Search Sites',
            description: 'Find hidden objective locations',
            type: 'search',
            requiredPlayers: 1,
            points: 50
          },
          {
            id: 'destroy_objectives',
            name: 'Destroy Objectives',
            description: 'Plant charges to destroy targets',
            type: 'destroy',
            requiredPlayers: 1,
            points: 150
          },
          {
            id: 'defend_sites',
            name: 'Defend Sites',
            description: 'Protect objectives from enemy destruction',
            type: 'defend',
            requiredPlayers: 1,
            points: 100
          }
        ],
        winConditions: [
          {
            type: 'objectives',
            value: 3,
            description: 'Complete all objectives'
          },
          {
            type: 'eliminate_all',
            value: 1,
            description: 'Eliminate all enemy players'
          },
          {
            type: 'time_limit',
            value: 900000,
            description: 'Team with more objectives wins'
          }
        ],
        features: [
          'One life per round',
          'Search mechanics',
          'Destruction system',
          'Objective tracking',
          'High stakes gameplay',
          'Tactical planning',
          'Communication critical',
          'Permadeath consequences'
        ],
        icon: '💣',
        color: '#991b1b',
        recommendedClasses: ['builder', 'ghost', 'sharpshooter']
      },

      // HOUSEFIGHT MODE - Realistic Urban Combat
      {
        id: 'housefight',
        name: 'HÄUSERKAMPF',
        description: 'Intense close-quarters urban combat. Realistic house-to-house fighting.',
        type: 'hardcore',
        maxPlayers: 8,
        teamSize: 4,
        roundTime: 600000, // 10 minutes
        livesPerRound: 1,
        respawnTime: -1, // No respawn until next round
        allowAbilities: false,
        allowMovement: true, // Basic movement only
        allowSpecialWeapons: false,
        friendlyFire: true,
        objectives: [
          {
            id: 'clear_building',
            name: 'Clear Building',
            description: 'Systematically clear buildings of enemy forces',
            type: 'elimination',
            requiredPlayers: 2,
            points: 150
          },
          {
            id: 'secure_position',
            name: 'Secure Position',
            description: 'Capture and hold tactical positions inside buildings',
            type: 'defend',
            requiredPlayers: 1,
            points: 100
          },
          {
            id: 'room_clearing',
            name: 'Room Clearing',
            description: 'Clear individual rooms with tactical precision',
            type: 'elimination',
            requiredPlayers: 1,
            points: 50
          }
        ],
        winConditions: [
          {
            type: 'eliminate_all',
            value: 1,
            description: 'Eliminate all enemy forces'
          },
          {
            type: 'objectives',
            value: 5,
            description: 'Complete 5 building objectives'
          },
          {
            type: 'time_limit',
            value: 600000,
            description: 'Team with most objectives wins'
          }
        ],
        features: [
          'Urban warfare',
          'Close-quarters combat',
          'Tactical room clearing',
          'Realistic ballistics',
          'Limited ammo',
          'No special abilities',
          'Friendly fire enabled',
          'Strategic positioning',
          'Building navigation',
          'Tactical communication required'
        ],
        icon: '🏠',
        color: '#8b4513',
        recommendedClasses: ['vanguard', 'ghost', 'sharpshooter']
      },

      // TACTICAL OPERATIONS MODE - Realistic Special Forces Abilities
      {
        id: 'tactical_operations',
        name: 'TACTICAL OPERATIONS',
        description: 'Modern special forces abilities. No sci-fi, no robots. Real combat tactics.',
        type: 'competitive',
        maxPlayers: 12,
        teamSize: 6,
        roundTime: 600000, // 10 minutes
        livesPerRound: 2,
        respawnTime: 8000,
        allowAbilities: true, // But realistic abilities only
        allowMovement: true,
        allowSpecialWeapons: false, // No futuristic weapons
        friendlyFire: false,
        objectives: [
          {
            id: 'tactical_breach',
            name: 'Tactical Breach',
            description: 'Execute coordinated room clearing operations',
            type: 'elimination',
            requiredPlayers: 2,
            points: 150
          },
          {
            id: 'strategic_positioning',
            name: 'Strategic Positioning',
            description: 'Secure tactical advantages through superior positioning',
            type: 'defend',
            requiredPlayers: 1,
            points: 100
          },
          {
            id: 'suppression_fire',
            name: 'Suppression Fire',
            description: 'Provide covering fire for team advancement',
            type: 'capture',
            requiredPlayers: 2,
            points: 75
          },
          {
            id: 'counter_intelligence',
            name: 'Counter Intelligence',
            description: 'Detect and neutralize enemy tactical equipment',
            type: 'destroy',
            requiredPlayers: 1,
            points: 125
          }
        ],
        winConditions: [
          {
            type: 'score_limit',
            value: 800,
            description: 'First team to 800 tactical points'
          },
          {
            type: 'eliminate_all',
            value: 1,
            description: 'Eliminate all enemy operatives'
          },
          {
            type: 'time_limit',
            value: 600000,
            description: 'Team with highest tactical score wins'
          }
        ],
        features: [
          'Realistic special forces abilities',
          'Tactical equipment only',
          'No sci-fi elements',
          'Modern military gear',
          'Coordinated team tactics',
          'Breaching and clearing',
          'Suppressive fire mechanics',
          'Tactical positioning',
          'Equipment countermeasures',
          'Realistic combat scenarios'
        ],
        icon: '🎖️',
        color: '#1e40af',
        recommendedClasses: ['vanguard', 'ghost', 'sharpshooter']
      },

      // ULTIMATE CHAOS MODE
      {
        id: 'ultimate_chaos',
        name: 'ULTIMATE CHAOS',
        description: 'Everything enabled. Maximum chaos. Unstoppable action.',
        type: 'arcade',
        maxPlayers: 20,
        teamSize: 4,
        roundTime: 1200000, // 20 minutes
        livesPerRound: 5,
        respawnTime: 2000,
        allowAbilities: true,
        allowMovement: true,
        allowSpecialWeapons: true,
        friendlyFire: false,
        objectives: [
          {
            id: 'chaos_points',
            name: 'Chaos Points',
            description: 'Earn points for everything: kills, objectives, abilities, combos',
            type: 'elimination',
            requiredPlayers: 1,
            points: 10
          },
          {
            id: 'environment_destruction',
            name: 'Environment Destruction',
            description: 'Destroy the environment for points and tactical advantage',
            type: 'destroy',
            requiredPlayers: 1,
            points: 75
          },
          {
            id: 'ultimate_combos',
            name: 'Ultimate Combos',
            description: 'Execute legendary ability combinations',
            type: 'elimination',
            requiredPlayers: 2,
            points: 300
          }
        ],
        winConditions: [
          {
            type: 'score_limit',
            value: 2000,
            description: 'First team to 2000 chaos points'
          },
          {
            type: 'time_limit',
            value: 1200000,
            description: 'Team with highest chaos score wins'
          }
        ],
        features: [
          'All features enabled',
          'Maximum chaos',
          'Destructible environment',
          'Weather effects',
          'Dynamic events',
          'Boss enemies',
          'Power-up spawning',
          'Legendary weapons',
          'Insane visual effects',
          'Non-stop action'
        ],
        icon: '🌪️',
        color: '#7c3aed',
        recommendedClasses: ['vanguard', 'medic', 'ghost', 'sharpshooter', 'builder']
      }
    ]
  }

  // Get all available modes
  getAllModes(): GameMode[] {
    return this.modes
  }

  // Get mode by ID
  getMode(modeId: string): GameMode | undefined {
    return this.modes.find(mode => mode.id === modeId)
  }

  // Get modes by type
  getModesByType(type: 'competitive' | 'casual' | 'arcade' | 'hardcore'): GameMode[] {
    return this.modes.filter(mode => mode.type === type)
  }

  // Get recommended modes for player count
  getRecommendedModes(playerCount: number): GameMode[] {
    return this.modes.filter(mode =>
      mode.maxPlayers >= playerCount &&
      mode.teamSize <= Math.floor(playerCount / 2)
    )
  }

  // Validate mode settings
  validateModeSettings(modeId: string, playerCount: number): {
    valid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const mode = this.getMode(modeId)
    if (!mode) {
      return {
        valid: false,
        issues: ['Mode not found'],
        recommendations: []
      }
    }

    const issues: string[] = []
    const recommendations: string[] = []

    // Check player count
    if (playerCount < mode.teamSize) {
      issues.push(`Minimum ${mode.teamSize} players required`)
      recommendations.push(`Need ${mode.teamSize - playerCount} more players`)
    }

    if (playerCount > mode.maxPlayers) {
      issues.push(`Maximum ${mode.maxPlayers} players allowed`)
      recommendations.push(`Remove ${playerCount - mode.maxPlayers} players`)
    }

    // Check team balance
    if (playerCount % mode.teamSize !== 0 && mode.teamSize > 1) {
      issues.push('Teams will be unbalanced')
      recommendations.push(`Add or remove ${playerCount % mode.teamSize} player(s) for balanced teams`)
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    }
  }

  // Get mode configuration for UI
  getModeConfiguration(modeId: string): {
    mode: GameMode
    settings: {
      roundTime: number
      livesPerPlayer: number
      respawnTime: number
      friendlyFire: boolean
      objectives: GameObjective[]
      winConditions: WinCondition[]
      features: string[]
    }
  } | null {
    const mode = this.getMode(modeId)
    if (!mode) return null

    return {
      mode,
      settings: {
        roundTime: mode.roundTime,
        livesPerPlayer: mode.livesPerRound,
        respawnTime: mode.respawnTime,
        friendlyFire: mode.friendlyFire,
        objectives: mode.objectives,
        winConditions: mode.winConditions,
        features: mode.features
      }
    }
  }

  // Get mode statistics
  getModeStats(modeId: string): {
    avgRoundTime: number
    avgKillsPerRound: number
    avgDeathsPerRound: number
    winRateRequired: number
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'
    intensity: 'low' | 'medium' | 'high' | 'extreme' | 'chaos'
  } {
    const mode = this.getMode(modeId)
    if (!mode) {
      return {
        avgRoundTime: 300,
        avgKillsPerRound: 5,
        avgDeathsPerRound: 4,
        winRateRequired: 50,
        skillLevel: 'intermediate',
        intensity: 'medium'
      }
    }

    // Calculate intensity based on features
    const intensityScore =
      (mode.allowAbilities ? 2 : 0) +
      (mode.allowSpecialWeapons ? 1 : 0) +
      (mode.livesPerRound === 1 ? 2 : 0) +
      (mode.friendlyFire ? 1 : 0) +
      (mode.objectives.length > 2 ? 1 : 0)

    let intensity: 'low' | 'medium' | 'high' | 'extreme' | 'chaos' = 'medium'
    if (intensityScore <= 2) intensity = 'low'
    else if (intensityScore <= 4) intensity = 'medium'
    else if (intensityScore <= 6) intensity = 'high'
    else if (intensityScore <= 8) intensity = 'extreme'
    else intensity = 'chaos'

    // Calculate skill level based on mode complexity
    const complexityScore =
      (mode.type === 'competitive' ? 3 : 0) +
      (mode.type === 'hardcore' ? 2 : 0) +
      (mode.livesPerRound === 1 ? 2 : 0) +
      (mode.objectives.length * 1) +
      (mode.features.length * 0.5)

    let skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master' = 'intermediate'
    if (complexityScore <= 3) skillLevel = 'beginner'
    else if (complexityScore <= 6) skillLevel = 'intermediate'
    else if (complexityScore <= 9) skillLevel = 'advanced'
    else if (complexityScore <= 12) skillLevel = 'expert'
    else skillLevel = 'master'

    return {
      avgRoundTime: mode.roundTime / 1000, // Convert to seconds
      avgKillsPerRound: Math.round(mode.maxPlayers * 0.6),
      avgDeathsPerRound: Math.round(mode.maxPlayers * 0.5),
      winRateRequired: 55 + (complexityScore * 2),
      skillLevel,
      intensity
    }
  }

  // Create mode description for UI
  createModeDescription(modeId: string): {
    title: string
    subtitle: string
    features: string[]
    warnings: string[]
    tips: string[]
  } {
    const mode = this.getMode(modeId)
    if (!mode) {
      return {
        title: 'Unknown Mode',
        subtitle: 'Mode not found',
        features: [],
        warnings: [],
        tips: []
      }
    }

    const stats = this.getModeStats(modeId)

    return {
      title: `${mode.name} MODE`,
      subtitle: mode.description,
      features: mode.features.slice(0, 4),
      warnings: mode.livesPerRound === 1 ? ['Permadeath - One life per round!'] : [],
      tips: [
        `Average round time: ${Math.floor(stats.avgRoundTime / 60)}:${(stats.avgRoundTime % 60).toString().padStart(2, '0')}`,
        `Recommended for ${stats.skillLevel} players`,
        `Intensity: ${stats.intensity.toUpperCase()}`
      ]
    }
  }
}

export default GLXYGameModes