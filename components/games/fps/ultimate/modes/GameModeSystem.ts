/**
 * 🎮 GAME MODE SYSTEM
 * 
 * Verschiedene Spielmodi für das FPS Game
 * - Free For All (FFA)
 * - Team Deathmatch (TDM)
 * - Gun Game
 */

// =============================================================================
// GAME MODE TYPES
// =============================================================================

export enum FPSGameMode {
  FREE_FOR_ALL = 'ffa',
  TEAM_DEATHMATCH = 'tdm',
  GUN_GAME = 'gun_game'
}

export interface GameModeConfig {
  id: FPSGameMode
  name: string
  description: string
  scoreLimit: number
  timeLimit: number // seconds
  respawnTime: number // seconds
  teamBased: boolean
}

export interface GameModeState {
  mode: FPSGameMode
  score: { [team: string]: number }
  timeRemaining: number
  isActive: boolean
  winnerId?: string
}

// =============================================================================
// GAME MODE CONFIGURATIONS
// =============================================================================

export const GAME_MODE_CONFIGS: Record<FPSGameMode, GameModeConfig> = {
  [FPSGameMode.FREE_FOR_ALL]: {
    id: FPSGameMode.FREE_FOR_ALL,
    name: 'Free For All',
    description: 'Every player for themselves!',
    scoreLimit: 25,
    timeLimit: 600, // 10 minutes
    respawnTime: 3,
    teamBased: false
  },
  [FPSGameMode.TEAM_DEATHMATCH]: {
    id: FPSGameMode.TEAM_DEATHMATCH,
    name: 'Team Deathmatch',
    description: 'Team vs Team combat',
    scoreLimit: 50,
    timeLimit: 600,
    respawnTime: 5,
    teamBased: true
  },
  [FPSGameMode.GUN_GAME]: {
    id: FPSGameMode.GUN_GAME,
    name: 'Gun Game',
    description: 'Progress through weapons with each kill!',
    scoreLimit: 20, // 20 kills = 20 weapons
    timeLimit: 900, // 15 minutes
    respawnTime: 2,
    teamBased: false
  }
}

// =============================================================================
// GUN GAME WEAPON PROGRESSION
// =============================================================================

export const GUN_GAME_WEAPONS = [
  'pistol',
  'smg_1',
  'smg_2',
  'assault_1',
  'assault_2',
  'assault_3',
  'lmg_1',
  'shotgun_1',
  'shotgun_2',
  'sniper_1',
  'sniper_2',
  'assault_4',
  'smg_3',
  'lmg_2',
  'pistol_2',
  'shotgun_3',
  'assault_5',
  'sniper_3',
  'lmg_3',
  'knife' // Final weapon!
]

// =============================================================================
// GAME MODE MANAGER
// =============================================================================

export class FPSGameModeManager {
  private currentMode: FPSGameMode = FPSGameMode.FREE_FOR_ALL
  private config: GameModeConfig
  private state: GameModeState
  private startTime: number = 0
  
  // Gun Game specific
  private gunGameProgress: Map<string, number> = new Map() // playerId -> weapon level
  
  // Callbacks
  private onGameEndCallbacks: Array<(winnerId: string) => void> = []
  private onScoreChangeCallbacks: Array<(team: string, score: number) => void> = []

  constructor(mode: FPSGameMode = FPSGameMode.FREE_FOR_ALL) {
    this.currentMode = mode
    this.config = GAME_MODE_CONFIGS[mode]
    this.state = this.initializeState()
    
    console.log(`🎮 Game Mode: ${this.config.name}`)
  }

  /**
   * Initialize game state
   */
  private initializeState(): GameModeState {
    return {
      mode: this.currentMode,
      score: this.config.teamBased ? { team1: 0, team2: 0 } : { player: 0 },
      timeRemaining: this.config.timeLimit,
      isActive: false
    }
  }

  /**
   * Start game mode
   */
  start(): void {
    this.state.isActive = true
    this.startTime = Date.now() / 1000
    console.log(`🎮 ${this.config.name} started!`)
  }

  /**
   * Update game state
   */
  update(deltaTime: number): void {
    if (!this.state.isActive) return
    
    // Update timer
    this.state.timeRemaining -= deltaTime
    
    // Check time limit
    if (this.state.timeRemaining <= 0) {
      this.endGame('Time limit reached')
    }
  }

  /**
   * Register kill
   */
  registerKill(killerId: string, victimId: string): void {
    if (!this.state.isActive) return
    
    switch (this.currentMode) {
      case FPSGameMode.FREE_FOR_ALL:
        this.handleFFAKill(killerId)
        break
      
      case FPSGameMode.TEAM_DEATHMATCH:
        this.handleTDMKill(killerId)
        break
      
      case FPSGameMode.GUN_GAME:
        this.handleGunGameKill(killerId)
        break
    }
  }

  /**
   * Handle Free For All kill
   */
  private handleFFAKill(killerId: string): void {
    this.state.score.player = (this.state.score.player || 0) + 1
    this.fireScoreChangeEvent('player', this.state.score.player)
    
    // Check score limit
    if (this.state.score.player >= this.config.scoreLimit) {
      this.endGame(killerId)
    }
  }

  /**
   * Handle Team Deathmatch kill
   */
  private handleTDMKill(killerId: string): void {
    // TODO: Determine player's team
    const team = 'team1' // Simplified
    
    this.state.score[team] = (this.state.score[team] || 0) + 1
    this.fireScoreChangeEvent(team, this.state.score[team])
    
    // Check score limit
    if (this.state.score[team] >= this.config.scoreLimit) {
      this.endGame(team)
    }
  }

  /**
   * Handle Gun Game kill
   */
  private handleGunGameKill(killerId: string): void {
    // Increment player's weapon level
    const currentLevel = this.gunGameProgress.get(killerId) || 0
    const newLevel = currentLevel + 1
    this.gunGameProgress.set(killerId, newLevel)
    
    console.log(`🎯 ${killerId} progressed to weapon level ${newLevel}/${GUN_GAME_WEAPONS.length}`)
    
    // Check win condition
    if (newLevel >= GUN_GAME_WEAPONS.length) {
      this.endGame(killerId)
    }
  }

  /**
   * Get Gun Game weapon for player
   */
  getGunGameWeapon(playerId: string): string {
    if (this.currentMode !== FPSGameMode.GUN_GAME) {
      return 'assault' // Default
    }
    
    const level = this.gunGameProgress.get(playerId) || 0
    return GUN_GAME_WEAPONS[Math.min(level, GUN_GAME_WEAPONS.length - 1)]
  }

  /**
   * Get Gun Game progress
   */
  getGunGameProgress(playerId: string): { current: number; total: number } {
    return {
      current: this.gunGameProgress.get(playerId) || 0,
      total: GUN_GAME_WEAPONS.length
    }
  }

  /**
   * End game
   */
  private endGame(winnerId: string): void {
    if (!this.state.isActive) return
    
    this.state.isActive = false
    this.state.winnerId = winnerId
    
    console.log(`🏆 Game ended! Winner: ${winnerId}`)
    this.onGameEndCallbacks.forEach(cb => cb(winnerId))
  }

  /**
   * Get current state
   */
  getState(): GameModeState {
    return { ...this.state }
  }

  /**
   * Get config
   */
  getConfig(): GameModeConfig {
    return { ...this.config }
  }

  /**
   * Get current mode
   */
  getCurrentMode(): FPSGameMode {
    return this.currentMode
  }

  /**
   * Get respawn time
   */
  getRespawnTime(): number {
    return this.config.respawnTime
  }

  /**
   * Event: Game ended
   */
  onGameEnd(callback: (winnerId: string) => void): void {
    this.onGameEndCallbacks.push(callback)
  }

  /**
   * Event: Score changed
   */
  onScoreChange(callback: (team: string, score: number) => void): void {
    this.onScoreChangeCallbacks.push(callback)
  }

  /**
   * Fire score change event
   */
  private fireScoreChangeEvent(team: string, score: number): void {
    this.onScoreChangeCallbacks.forEach(cb => cb(team, score))
  }

  /**
   * Reset game
   */
  reset(): void {
    this.state = this.initializeState()
    this.gunGameProgress.clear()
    console.log(`🔄 Game mode reset: ${this.config.name}`)
  }

  /**
   * Change game mode
   */
  changeMode(mode: FPSGameMode): void {
    this.currentMode = mode
    this.config = GAME_MODE_CONFIGS[mode]
    this.reset()
    console.log(`🎮 Game mode changed to: ${this.config.name}`)
  }
}

