/**
 * 🎮 GLOBAL GAME KEYBOARD MANAGER
 *
 * Provides universal keyboard blocking for ALL games
 * - FPS (Ultimate, Battle Royale, etc.)
 * - Board (Uno, Connect4, TicTacToe)
 * - Card games
 * - Racing games
 * - Chess, Tetris, etc.
 */

/**
 * Game States that require keyboard blocking
 */
export type GameState =
  | 'inGame'
  | 'paused'
  | 'menu'
  | 'settings'
  | 'characterSelect'
  | 'loading'

// Import audio and visual feedback managers
import { GameAudio } from './GameAudioManager'
import { GameVisualFeedback } from './GameVisualFeedback'

export interface GameKeyboardConfig {
  enabled?: boolean
  debugMode?: boolean
  allowedKeys?: string[] // Keys that should NOT be blocked
  escapeHatchKey?: string // Key to temporarily disable blocking (default: Escape)
}

/**
 * Global keyboard blocking system for all games
 */
export class GlobalGameKeyboardManager {
  private static instance: GlobalGameKeyboardManager | null = null
  private currentGameState: GameState = 'menu'
  private isEnabled: boolean = true
  private debugMode: boolean = false
  private allowedKeys: string[] = []
  private escapeHatchKey: string = 'Escape'
  private isBlockingDisabled: boolean = false
  private blockingDisableTimeout: NodeJS.Timeout | null = null
  private globalHandler: ((e: KeyboardEvent) => void) | null = null

  private constructor(config: GameKeyboardConfig = {}) {
    this.isEnabled = config.enabled ?? true
    this.debugMode = config.debugMode ?? false
    this.allowedKeys = config.allowedKeys ?? []
    this.escapeHatchKey = config.escapeHatchKey ?? 'Escape'

    this.setupGlobalKeyboardBlock()

    if (this.debugMode) {
      console.log('🎮 GlobalGameKeyboardManager initialized')
      console.log(`🎮 Escape hatch key: ${this.escapeHatchKey}`)
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: GameKeyboardConfig): GlobalGameKeyboardManager {
    if (!GlobalGameKeyboardManager.instance) {
      GlobalGameKeyboardManager.instance = new GlobalGameKeyboardManager(config)
    }
    return GlobalGameKeyboardManager.instance
  }

  /**
   * Set current game state (triggers keyboard blocking)
   */
  setGameState(state: GameState): void {
    const previousState = this.currentGameState
    this.currentGameState = state

    if (this.debugMode) {
      console.log(`🎮 Game state changed: ${previousState} → ${state}`)
    }

    // Emit state change event for debugging
    this.emitStateChange(state)
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.currentGameState
  }

  /**
   * Check if currently in an active game (keyboard blocking enabled)
   */
  isInGame(): boolean {
    return this.currentGameState === 'inGame' || this.currentGameState === 'paused'
  }

  /**
   * Enable/disable keyboard blocking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled

    if (this.debugMode) {
      console.log(`🎮 Keyboard blocking ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Set allowed keys (keys that won't be blocked)
   */
  setAllowedKeys(keys: string[]): void {
    this.allowedKeys = keys

    if (this.debugMode) {
      console.log('🎮 Allowed keys updated:', keys)
    }
  }

  /**
   * Setup global keyboard blocking
   */
  private setupGlobalKeyboardBlock(): void {
    if (typeof window === 'undefined') {
      console.warn('🎮 GlobalGameKeyboardManager: window not available')
      return
    }

    // Remove existing handlers
    this.removeGlobalKeyboardBlock()

    // Create global handler with capture phase
    this.globalHandler = (e: KeyboardEvent): void => {
      if (!this.isEnabled) return

      // Only block when in game or paused
      if (this.isInGame()) {
        this.handleGameKeyboardInput(e)
      }
    }

    // Add to document with capture phase (highest priority)
    document.addEventListener('keydown', this.globalHandler, true)

    if (this.debugMode) {
      console.log('🎮 Global keyboard blocking setup complete')
    }
  }

  /**
   * Remove global keyboard blocking
   */
  private removeGlobalKeyboardBlock(): void {
    if (this.globalHandler) {
      document.removeEventListener('keydown', this.globalHandler, true)
      this.globalHandler = null
    }
  }

  /**
   * Handle keyboard input during gameplay
   */
  private handleGameKeyboardInput(e: KeyboardEvent): void {
    // Check for escape hatch key (temporary disable)
    if (e.key === this.escapeHatchKey && e.ctrlKey && e.shiftKey) {
      this.toggleBlockingDisable()
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Check if key is explicitly allowed
    if (this.allowedKeys.includes(e.key)) {
      if (this.debugMode) {
        console.log(`🎮 Allowed key: ${e.key}`)
      }
      return
    }

    // Browser-default keys that should be blocked during gameplay
    const browserDefaultKeys = [
      // Navigation/scrolling
      ' ',        // Space (page scroll)
      'ArrowUp',   // Up arrow (page scroll)
      'ArrowDown', // Down arrow (page scroll)
      'ArrowLeft', // Left arrow (browser back)
      'ArrowRight',// Right arrow (browser forward)
      'PageUp',    // Page up
      'PageDown',  // Page down
      'Home',      // Home (page top)
      'End',       // End (page bottom)

      // Tab navigation
      'Tab',       // Tab (focus navigation)

      // Browser functions
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Enter',     // Form submission
      'Backspace'  // Browser back navigation
    ]

    // Check if this key should be blocked
    if (browserDefaultKeys.includes(e.key)) {
      // Skip blocking if temporarily disabled
      if (this.isBlockingDisabled) {
        if (this.debugMode) {
          console.log(`🎮 Key blocking disabled: ${e.key} (temporary override active)`)
        }
        return
      }

      e.preventDefault()
      e.stopPropagation()

      // No audio feedback for blocked keys (as requested)

      // Show visual feedback
      GameVisualFeedback.showKeyboardBlocked(e.key)

      if (this.debugMode) {
        console.log(`🎮 Blocked browser default key: ${e.key} (visual feedback only)`)
      }
    }
  }

  /**
   * Emit state change event for debugging
   */
  private emitStateChange(state: GameState): void {
    // Create custom event for debugging
    const event = new CustomEvent('gameStateChange', {
      detail: { state, previousState: this.currentGameState }
    })
    window.dispatchEvent(event)
  }

  /**
   * Toggle keyboard blocking disable (escape hatch)
   */
  private toggleBlockingDisable(): void {
    this.isBlockingDisabled = !this.isBlockingDisabled

    // Clear existing timeout
    if (this.blockingDisableTimeout) {
      clearTimeout(this.blockingDisableTimeout)
      this.blockingDisableTimeout = null
    }

    if (this.isBlockingDisabled) {
      // Set automatic re-enable after 30 seconds
      this.blockingDisableTimeout = setTimeout(() => {
        this.isBlockingDisabled = false
        this.blockingDisableTimeout = null
        if (this.debugMode) {
          console.log('🎮 Keyboard blocking auto-re-enabled after timeout')
        }
      }, 30000) // 30 seconds

      if (this.debugMode) {
        console.log('🎮 Keyboard blocking temporarily disabled for 30 seconds')
        console.log('🎮 Use Ctrl+Shift+Escape again to re-enable immediately')
      }
    } else {
      if (this.debugMode) {
        console.log('🎮 Keyboard blocking manually re-enabled')
      }
    }

    // Play feedback sound
    GameAudio.playSuccess()
  }

  /**
   * Check if keyboard blocking is currently disabled
   */
  isBlockingCurrentlyDisabled(): boolean {
    return this.isBlockingDisabled
  }

  /**
   * Get remaining disable time in seconds
   */
  getDisableRemainingTime(): number {
    if (!this.blockingDisableTimeout) {
      return 0
    }
    // This would require more complex tracking for exact timing
    return 30 // Placeholder
  }

  /**
   * Destroy the manager (cleanup)
   */
  destroy(): void {
    // Clear any pending timeouts
    if (this.blockingDisableTimeout) {
      clearTimeout(this.blockingDisableTimeout)
      this.blockingDisableTimeout = null
    }

    this.removeGlobalKeyboardBlock()
    GlobalGameKeyboardManager.instance = null

    if (this.debugMode) {
      console.log('🎮 GlobalGameKeyboardManager destroyed')
    }
  }

  /**
   * Get debug info
   */
  getDebugInfo(): {
    currentState: GameState
    isEnabled: boolean
    allowedKeys: string[]
    isInGame: boolean
    escapeHatchKey: string
    isBlockingDisabled: boolean
    disableRemainingTime: number
  } {
    return {
      currentState: this.currentGameState,
      isEnabled: this.isEnabled,
      allowedKeys: [...this.allowedKeys],
      isInGame: this.isInGame(),
      escapeHatchKey: this.escapeHatchKey,
      isBlockingDisabled: this.isBlockingDisabled,
      disableRemainingTime: this.getDisableRemainingTime()
    }
  }
}

/**
 * Global helper functions for easy access
 */
export const GameKeyboard = {
  /**
   * Initialize the global keyboard manager
   */
  init: (config?: GameKeyboardConfig) => GlobalGameKeyboardManager => {
    return GlobalGameKeyboardManager.getInstance(config)
  },

  /**
   * Set game state
   */
  setGameState: (state: GameState): void => {
    const manager = GlobalGameKeyboardManager.getInstance()
    manager.setGameState(state)
  },

  /**
   * Get current game state
   */
  getGameState: (): GameState => {
    const manager = GlobalGameKeyboardManager.getInstance()
    return manager.getGameState()
  },

  /**
   * Check if in game
   */
  isInGame: (): boolean => {
    const manager = GlobalGameKeyboardManager.getInstance()
    return manager.isInGame()
  },

  /**
   * Enable/disable keyboard blocking
   */
  setEnabled: (enabled: boolean): void => {
    const manager = GlobalGameKeyboardManager.getInstance()
    manager.setEnabled(enabled)
  },

  /**
   * Set allowed keys
   */
  setAllowedKeys: (keys: string[]): void => {
    const manager = GlobalGameKeyboardManager.getInstance()
    manager.setAllowedKeys(keys)
  },

  /**
   * Get debug info
   */
  getDebugInfo: (): ReturnType<GlobalGameKeyboardManager['getDebugInfo']> => {
    const manager = GlobalGameKeyboardManager.getInstance()
    return manager.getDebugInfo()
  },

  /**
   * Destroy manager
   */
  destroy: (): void => {
    const manager = GlobalGameKeyboardManager.getInstance()
    manager.destroy()
  },

  /**
   * Check if keyboard blocking is currently disabled
   */
  isBlockingDisabled: (): boolean => {
    const manager = GlobalGameKeyboardManager.getInstance()
    return manager.isBlockingCurrentlyDisabled()
  },

  /**
   * Get remaining disable time in seconds
   */
  getDisableRemainingTime: (): number => {
    const manager = GlobalGameKeyboardManager.getInstance()
    return manager.getDisableRemainingTime()
  }
}

/**
 * React Hook for easy integration
 */
export function useGameKeyboard(initialState: GameState = 'menu') {
  // Initialize on mount
  if (typeof window !== 'undefined') {
    GameKeyboard.init({ debugMode: process.env.NODE_ENV === 'development' })
    GameKeyboard.setGameState(initialState)
  }

  return {
    setGameState: GameKeyboard.setGameState,
    getGameState: GameKeyboard.getGameState,
    isInGame: GameKeyboard.isInGame,
    setEnabled: GameKeyboard.setEnabled,
    setAllowedKeys: GameKeyboard.setAllowedKeys,
    getDebugInfo: GameKeyboard.getDebugInfo,
    isBlockingDisabled: GameKeyboard.isBlockingDisabled,
    getDisableRemainingTime: GameKeyboard.getDisableRemainingTime
  }
}

export default GlobalGameKeyboardManager