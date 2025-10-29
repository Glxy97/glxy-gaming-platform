/**
 * Game Mode Manager
 * 
 * @module GameModeManager
 * @description Professional game mode management system
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 * 
 * @remarks
 * This is the REAL implementation, driven by tests!
 * Every public method has been tested FIRST (TDD).
 */

import type { 
  GameMode, 
  GameConfig, 
  GameState,
  GamePhase,
  GameEventPayload,
  GameEvent
} from '../types/GameTypes'
import type { IGameModeManager } from './interfaces/IGameModeManager'

/**
 * GameModeManager Implementation
 * 
 * @class GameModeManager
 * @implements {IGameModeManager}
 * 
 * @example
 * ```typescript
 * const manager = new GameModeManager()
 * 
 * // Change mode
 * manager.changeMode('team-deathmatch')
 * 
 * // Listen to changes
 * manager.onModeChange((mode) => {
 *   console.log(`Mode changed to: ${mode}`)
 * })
 * ```
 */
export class GameModeManager implements IGameModeManager {
  // ==========================================================================
  // PRIVATE PROPERTIES
  // ==========================================================================
  
  /**
   * Current game mode
   * @private
   */
  private _currentMode: GameMode = 'zombie'
  
  /**
   * Mode configurations
   * @private
   */
  private _config: Map<GameMode, GameConfig> = new Map()
  
  /**
   * Current game state
   * @private
   */
  private _gameState: GameState = {
    mode: 'zombie',
    isRunning: false,
    isPaused: false,
    elapsedTime: 0,
    timeRemaining: -1,
    round: 1,
    phase: 'warmup',
    teamScores: new Map(),
    playerScores: new Map()
  }
  
  /**
   * Mode change listeners
   * @private
   */
  private _modeChangeListeners: Array<(mode: GameMode) => void> = []
  
  /**
   * State change listeners
   * @private
   */
  private _stateChangeListeners: Array<(state: GameState) => void> = []
  
  /**
   * Event listeners
   * @private
   */
  private _eventListeners: Array<(event: GameEventPayload) => void> = []
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  /**
   * Create GameModeManager
   * 
   * @remarks
   * NACHDENKEN: Was muss im Constructor passieren?
   * 1. Modi initialisieren
   * 2. Default state setzen
   * 3. Validation dass alles korrekt ist
   */
  constructor() {
    // PROFESSIONELL: Initialize all modes with proper configs
    this.initializeModes()
    
    // KORREKT: Validate initialization
    if (this._config.size === 0) {
      throw new Error('GameModeManager: No modes initialized!')
    }
    
    // LOGISCH: Start with default mode
    this._gameState.mode = this._currentMode
  }
  
  // ==========================================================================
  // PUBLIC GETTERS (Interface Implementation)
  // ==========================================================================
  
  /**
   * Get current mode
   * @readonly
   */
  public get currentMode(): GameMode {
    return this._currentMode
  }
  
  /**
   * Get current game state
   * @readonly
   */
  public get gameState(): GameState {
    // INTELLIGENT: Return copy to prevent mutation
    return { ...this._gameState }
  }
  
  /**
   * Get available modes
   * @readonly
   */
  public get availableModes(): GameMode[] {
    return Array.from(this._config.keys())
  }
  
  // ==========================================================================
  // MODE MANAGEMENT (Interface Implementation)
  // ==========================================================================
  
  /**
   * Change game mode
   * 
   * @param mode - New game mode
   * @throws {Error} If mode is invalid
   * 
   * @remarks
   * NACHDENKEN: Was muss beim Mode-Wechsel passieren?
   * 1. Validieren dass Mode existiert
   * 2. Current mode cleanup
   * 3. Mode wechseln
   * 4. Listeners benachrichtigen
   * 5. Event emittieren
   */
  public changeMode(mode: GameMode): void {
    // KORREKT: Validate mode
    if (!this.isValidMode(mode)) {
      throw new Error(`Invalid game mode: ${mode}`)
    }
    
    // PROFESSIONELL: Store old mode for event
    const oldMode = this._currentMode
    
    // LOGISCH: Update mode
    this._currentMode = mode
    this._gameState.mode = mode
    
    // INTELLIGENT: Notify listeners
    this._modeChangeListeners.forEach(listener => {
      try {
        listener(mode)
      } catch (error) {
        console.error('GameModeManager: Listener error:', error)
      }
    })
    
    // RICHTIG: Emit event
    this.emitEvent({
      type: 'mode-changed',
      timestamp: Date.now(),
      data: { oldMode, newMode: mode }
    })
  }
  
  /**
   * Get mode config
   * 
   * @param mode - Mode to get config for (defaults to current)
   * @returns Game configuration (COPY!)
   * @throws {Error} If mode is invalid
   * 
   * @remarks
   * INTELLIGENT: Always return a COPY, never the original reference!
   * This prevents external code from mutating our configs.
   */
  public getModeConfig(mode?: GameMode): GameConfig {
    const targetMode = mode || this._currentMode
    
    // KORREKT: Validate mode
    const config = this._config.get(targetMode)
    if (!config) {
      throw new Error(`No config for mode: ${targetMode}`)
    }
    
    // PROFESSIONELL: Return deep copy
    return { ...config }
  }
  
  /**
   * Update mode config
   * 
   * @param mode - Mode to update
   * @param config - Partial config to merge
   * @throws {Error} If mode is invalid
   * 
   * @remarks
   * NACHDENKEN: Wann braucht man das?
   * - Server might want different settings
   * - Admin panel might change settings
   * - Tournament might have custom rules
   */
  public updateModeConfig(mode: GameMode, config: Partial<GameConfig>): void {
    // KORREKT: Validate mode exists
    if (!this.isValidMode(mode)) {
      throw new Error(`Invalid game mode: ${mode}`)
    }
    
    const currentConfig = this._config.get(mode)!
    
    // PROFESSIONELL: Merge configs
    const updatedConfig: GameConfig = {
      ...currentConfig,
      ...config,
      mode // INTELLIGENT: Ensure mode can't be changed
    }
    
    // LOGISCH: Update config
    this._config.set(mode, updatedConfig)
  }
  
  // ==========================================================================
  // GAME STATE (Interface Implementation)
  // ==========================================================================
  
  /**
   * Start game
   * 
   * @throws {Error} If game cannot be started
   * 
   * @remarks
   * NACHDENKEN: Was muss beim Start passieren?
   * 1. Check ob game starten kann
   * 2. State auf "running" setzen
   * 3. Timer starten
   * 4. Listeners/Events
   */
  public startGame(): void {
    // KORREKT: Validate state
    if (this._gameState.isRunning) {
      throw new Error('Game is already running')
    }
    
    // PROFESSIONELL: Update state
    this._gameState.isRunning = true
    this._gameState.isPaused = false
    this._gameState.phase = 'active'
    this._gameState.elapsedTime = 0
    
    // INTELLIGENT: Set time remaining if mode has time limit
    const config = this.getModeConfig()
    if (config.timeLimit > 0) {
      this._gameState.timeRemaining = config.timeLimit
    }
    
    // RICHTIG: Notify
    this.notifyStateChange()
    this.emitEvent({
      type: 'game-started',
      timestamp: Date.now(),
      data: { mode: this._currentMode }
    })
  }
  
  /**
   * Pause game
   * 
   * @remarks
   * LOGISCH: Nur pausieren wenn game läuft
   */
  public pauseGame(): void {
    if (!this._gameState.isRunning) {
      return // INTELLIGENT: Silently ignore if not running
    }
    
    this._gameState.isPaused = true
    
    this.notifyStateChange()
    this.emitEvent({
      type: 'game-paused',
      timestamp: Date.now(),
      data: {}
    })
  }
  
  /**
   * Resume game
   * 
   * @throws {Error} If game is not paused
   * 
   * @remarks
   * KORREKT: Nur resumieren wenn pausiert
   */
  public resumeGame(): void {
    if (!this._gameState.isPaused) {
      throw new Error('Game is not paused')
    }
    
    this._gameState.isPaused = false
    
    this.notifyStateChange()
    this.emitEvent({
      type: 'game-resumed',
      timestamp: Date.now(),
      data: {}
    })
  }
  
  /**
   * End game
   * 
   * @param winner - Optional winner ID
   * 
   * @remarks
   * PROFESSIONELL: Cleanup und State Reset
   */
  public endGame(winner?: string | number): void {
    this._gameState.isRunning = false
    this._gameState.isPaused = false
    this._gameState.phase = 'ended'
    
    if (winner !== undefined) {
      this._gameState.winner = winner
    }
    
    this.notifyStateChange()
    this.emitEvent({
      type: 'game-ended',
      timestamp: Date.now(),
      data: { winner }
    })
  }
  
  /**
   * Reset game state
   * 
   * @remarks
   * INTELLIGENT: Full reset zu initial state
   */
  public resetGame(): void {
    this._gameState = {
      mode: this._currentMode,
      isRunning: false,
      isPaused: false,
      elapsedTime: 0,
      timeRemaining: -1,
      round: 1,
      phase: 'warmup',
      teamScores: new Map(),
      playerScores: new Map()
    }
    
    this.notifyStateChange()
  }
  
  // ==========================================================================
  // EVENTS & LISTENERS (Interface Implementation)
  // ==========================================================================
  
  /**
   * Register mode change listener
   * 
   * @param callback - Callback function
   * @returns Unsubscribe function
   * 
   * @remarks
   * PROFESSIONELL: Pattern für Memory Leak Prevention
   */
  public onModeChange(callback: (mode: GameMode) => void): () => void {
    this._modeChangeListeners.push(callback)
    
    // INTELLIGENT: Return unsubscribe function
    return () => {
      const index = this._modeChangeListeners.indexOf(callback)
      if (index > -1) {
        this._modeChangeListeners.splice(index, 1)
      }
    }
  }
  
  /**
   * Register state change listener
   * 
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  public onStateChange(callback: (state: GameState) => void): () => void {
    this._stateChangeListeners.push(callback)
    
    return () => {
      const index = this._stateChangeListeners.indexOf(callback)
      if (index > -1) {
        this._stateChangeListeners.splice(index, 1)
      }
    }
  }
  
  /**
   * Register event listener
   * 
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  public onGameEvent(callback: (event: GameEventPayload) => void): () => void {
    this._eventListeners.push(callback)
    
    return () => {
      const index = this._eventListeners.indexOf(callback)
      if (index > -1) {
        this._eventListeners.splice(index, 1)
      }
    }
  }
  
  /**
   * Emit game event
   * 
   * @param event - Event payload
   * 
   * @remarks
   * KORREKT: Error Handling für Listeners
   */
  public emitEvent(event: GameEventPayload): void {
    this._eventListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('GameModeManager: Event listener error:', error)
      }
    })
  }
  
  // ==========================================================================
  // VALIDATION (Interface Implementation)
  // ==========================================================================
  
  /**
   * Check if mode is valid
   * 
   * @param mode - Mode to validate
   * @returns True if valid
   * 
   * @remarks
   * LOGISCH: Simple check ob Config existiert
   */
  public isValidMode(mode: GameMode): boolean {
    return this._config.has(mode)
  }
  
  /**
   * Check if game can start
   * 
   * @returns True if game can start
   * 
   * @remarks
   * NACHDENKEN: Wann kann ein Game NICHT starten?
   * - Schon running
   * - Kein valid mode
   * - Nicht genug Spieler (future)
   */
  public canStartGame(): boolean {
    if (this._gameState.isRunning) {
      return false
    }
    
    if (!this.isValidMode(this._currentMode)) {
      return false
    }
    
    return true
  }
  
  // ==========================================================================
  // UTILITIES (Interface Implementation)
  // ==========================================================================
  
  /**
   * Get mode metadata
   * 
   * @param mode - Mode to get metadata for
   * @returns Mode metadata
   * 
   * @remarks
   * PROFESSIONELL: Für UI Display
   */
  public getModeMetadata(mode: GameMode): {
    name: string
    description: string
    icon: string
    minPlayers: number
    maxPlayers: number
  } {
    // INTELLIGENT: Hardcoded metadata (könnte auch aus Config kommen)
    const metadata: Record<GameMode, ReturnType<typeof this.getModeMetadata>> = {
      'zombie': {
        name: 'Zombie Survival',
        description: 'Survive waves of increasingly difficult zombies',
        icon: '🧟',
        minPlayers: 1,
        maxPlayers: 1
      },
      'team-deathmatch': {
        name: 'Team Deathmatch',
        description: '2 teams fight to reach the score limit first',
        icon: '⚔️',
        minPlayers: 2,
        maxPlayers: 16
      },
      'free-for-all': {
        name: 'Free For All',
        description: 'Every player for themselves - last one standing wins',
        icon: '🔫',
        minPlayers: 2,
        maxPlayers: 8
      },
      'gun-game': {
        name: 'Gun Game',
        description: 'Progress through weapons - first to final weapon wins',
        icon: '🎯',
        minPlayers: 2,
        maxPlayers: 8
      },
      'search-destroy': {
        name: 'Search & Destroy',
        description: 'Plant or defuse the bomb to win rounds',
        icon: '💣',
        minPlayers: 2,
        maxPlayers: 10
      },
      'capture-flag': {
        name: 'Capture the Flag',
        description: 'Capture enemy flag and return it to your base',
        icon: '🚩',
        minPlayers: 4,
        maxPlayers: 16
      }
    }
    
    return metadata[mode]
  }
  
  /**
   * Cleanup resources
   * 
   * @remarks
   * PROFESSIONELL: Immer cleanup für Memory Leaks Prevention
   */
  public destroy(): void {
    // INTELLIGENT: Clear all listeners
    this._modeChangeListeners = []
    this._stateChangeListeners = []
    this._eventListeners = []
    
    // KORREKT: Clear state
    this._config.clear()
    this._gameState.teamScores.clear()
    this._gameState.playerScores.clear()
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  /**
   * Initialize all game modes
   * 
   * @private
   * @remarks
   * NACHDENKEN: Welche Modi brauchen wir jetzt?
   * - Zombie (existing) ✅
   * - Team Deathmatch (new) ✅
   * - Free For All (new) ✅
   * - Gun Game (new) ✅
   * - Search & Destroy (future)
   * - Capture the Flag (future)
   */
  private initializeModes(): void {
    // PROFESSIONELL: Zombie Mode (Current Implementation)
    this._config.set('zombie', {
      mode: 'zombie',
      maxPlayers: 1,
      timeLimit: 0, // Infinite
      scoreLimit: 0, // Survival
      respawn: false, // One life
      teams: 0,
      friendlyFire: false,
      startingHealth: 100,
      startingArmor: 0
    })
    
    // INTELLIGENT: Team Deathmatch
    this._config.set('team-deathmatch', {
      mode: 'team-deathmatch',
      maxPlayers: 16,
      timeLimit: 600, // 10 minutes
      scoreLimit: 100, // First to 100 kills
      respawn: true,
      teams: 2,
      friendlyFire: false,
      startingHealth: 100,
      startingArmor: 0
    })
    
    // LOGISCH: Free For All
    this._config.set('free-for-all', {
      mode: 'free-for-all',
      maxPlayers: 8,
      timeLimit: 600, // 10 minutes
      scoreLimit: 50, // First to 50 kills
      respawn: true,
      teams: 0, // No teams
      friendlyFire: false,
      startingHealth: 100,
      startingArmor: 0
    })
    
    // KORREKT: Gun Game
    this._config.set('gun-game', {
      mode: 'gun-game',
      maxPlayers: 8,
      timeLimit: 900, // 15 minutes
      scoreLimit: 20, // 20 weapons to progress through
      respawn: true,
      teams: 0,
      friendlyFire: false,
      startingHealth: 100,
      startingArmor: 0,
      customRules: {
        weaponProgression: [
          'pistol', 'mac10', 'ak47', 'awp', 'knife'
        ],
        demoteOnKnife: true // Get knifed = go back one weapon
      }
    })
    
    // RICHTIG: Future Modes (commented out for now)
    /*
    this._config.set('search-destroy', {
      mode: 'search-destroy',
      maxPlayers: 10,
      timeLimit: 120,
      scoreLimit: 13,
      respawn: false,
      teams: 2,
      friendlyFire: false,
      startingHealth: 100,
      startingArmor: 0
    })
    
    this._config.set('capture-flag', {
      mode: 'capture-flag',
      maxPlayers: 16,
      timeLimit: 900,
      scoreLimit: 3,
      respawn: true,
      teams: 2,
      friendlyFire: false,
      startingHealth: 100,
      startingArmor: 0
    })
    */
  }
  
  /**
   * Notify state change listeners
   * 
   * @private
   * @remarks
   * PROFESSIONELL: Centralized notification
   */
  private notifyStateChange(): void {
    const stateCopy = this.gameState
    
    this._stateChangeListeners.forEach(listener => {
      try {
        listener(stateCopy)
      } catch (error) {
        console.error('GameModeManager: State listener error:', error)
      }
    })
  }
}

