/**
 * Game Mode Manager Interface
 * 
 * @module IGameModeManager
 * @description Interface for managing game modes and configurations
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { GameMode, GameConfig, GameState, GameEventPayload } from '../../types/GameTypes'

/**
 * Interface for Game Mode Management
 * 
 * @interface IGameModeManager
 * @description Defines the contract for managing game modes, configurations, and state
 * 
 * @remarks
 * This interface ensures loose coupling between the game engine and mode management,
 * allowing for easy testing, mocking, and future implementations.
 * 
 * @example
 * ```typescript
 * class GameModeManager implements IGameModeManager {
 *   // Implementation...
 * }
 * ```
 */
export interface IGameModeManager {
  // ============================================================================
  // PROPERTIES
  // ============================================================================
  
  /**
   * Get the current game mode
   * @readonly
   */
  readonly currentMode: GameMode
  
  /**
   * Get the current game state
   * @readonly
   */
  readonly gameState: GameState
  
  /**
   * Get available game modes
   * @readonly
   */
  readonly availableModes: GameMode[]
  
  // ============================================================================
  // MODE MANAGEMENT
  // ============================================================================
  
  /**
   * Change the game mode
   * 
   * @param mode - The new game mode to switch to
   * @throws {Error} If mode is invalid or transition is not allowed
   * 
   * @remarks
   * Changing modes will:
   * 1. Validate the new mode
   * 2. Clean up current mode state
   * 3. Notify all listeners
   * 4. Initialize the new mode
   * 
   * @example
   * ```typescript
   * manager.changeMode('team-deathmatch')
   * ```
   */
  changeMode(mode: GameMode): void
  
  /**
   * Get configuration for current or specific mode
   * 
   * @param mode - Optional mode to get config for (defaults to current)
   * @returns Game configuration (copy, not reference!)
   * 
   * @example
   * ```typescript
   * const config = manager.getModeConfig()
   * console.log(config.maxPlayers) // 16
   * ```
   */
  getModeConfig(mode?: GameMode): GameConfig
  
  /**
   * Update configuration for a mode
   * 
   * @param mode - Mode to update
   * @param config - Partial configuration to merge
   * 
   * @example
   * ```typescript
   * manager.updateModeConfig('team-deathmatch', {
   *   scoreLimit: 150,
   *   timeLimit: 900
   * })
   * ```
   */
  updateModeConfig(mode: GameMode, config: Partial<GameConfig>): void
  
  // ============================================================================
  // GAME STATE
  // ============================================================================
  
  /**
   * Start the game
   * 
   * @throws {Error} If game cannot be started (e.g., not enough players)
   */
  startGame(): void
  
  /**
   * Pause the game
   */
  pauseGame(): void
  
  /**
   * Resume the game
   * 
   * @throws {Error} If game is not paused
   */
  resumeGame(): void
  
  /**
   * End the game
   * 
   * @param winner - Optional winner (team ID or player ID)
   */
  endGame(winner?: string | number): void
  
  /**
   * Reset the game state
   */
  resetGame(): void
  
  // ============================================================================
  // EVENTS & LISTENERS
  // ============================================================================
  
  /**
   * Register a listener for mode changes
   * 
   * @param callback - Function to call when mode changes
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = manager.onModeChange((mode) => {
   *   console.log(`Mode changed to: ${mode}`)
   * })
   * 
   * // Later...
   * unsubscribe()
   * ```
   */
  onModeChange(callback: (mode: GameMode) => void): () => void
  
  /**
   * Register a listener for game state changes
   * 
   * @param callback - Function to call when state changes
   * @returns Unsubscribe function
   */
  onStateChange(callback: (state: GameState) => void): () => void
  
  /**
   * Register a listener for game events
   * 
   * @param callback - Function to call when event occurs
   * @returns Unsubscribe function
   */
  onGameEvent(callback: (event: GameEventPayload) => void): () => void
  
  /**
   * Emit a game event
   * 
   * @param event - Event payload to emit
   */
  emitEvent(event: GameEventPayload): void
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  /**
   * Check if a mode is valid
   * 
   * @param mode - Mode to validate
   * @returns True if mode is valid
   */
  isValidMode(mode: GameMode): boolean
  
  /**
   * Check if game can be started
   * 
   * @returns True if game can start
   */
  canStartGame(): boolean
  
  // ============================================================================
  // UTILITIES
  // ============================================================================
  
  /**
   * Get mode metadata (for UI display)
   * 
   * @param mode - Mode to get metadata for
   * @returns Mode metadata
   */
  getModeMetadata(mode: GameMode): {
    name: string
    description: string
    icon: string
    minPlayers: number
    maxPlayers: number
  }
  
  /**
   * Cleanup resources
   * 
   * @remarks
   * Should be called when manager is no longer needed
   */
  destroy(): void
}

