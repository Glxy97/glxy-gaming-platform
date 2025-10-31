/**
 * 🎮 GAME FLOW MANAGER
 * 
 * Orchestrates all UI states and game flow
 */

import { EventEmitter } from 'events'
import type { PlayableCharacter } from '../types/CharacterTypes'
import type { GameSettings } from '../ui/SettingsMenuUI'

export type GameState =
  | 'mainMenu'
  | 'characterSelect'
  | 'inGame'
  | 'paused'
  | 'matchSummary'
  | 'loadout'
  | 'leaderboards'
  | 'settings'

export interface GameFlowState {
  currentState: GameState
  previousState: GameState | null
  selectedCharacter: PlayableCharacter | null
  settings: GameSettings
  isPaused: boolean
}

export class GameFlowManager extends EventEmitter {
  private state: GameFlowState
  private stateHistory: GameState[] = []
  private globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor() {
    super()

    // Default State
    this.state = {
      currentState: 'mainMenu',
      previousState: null,
      selectedCharacter: null,
      settings: this.getDefaultSettings(),
      isPaused: false
    }

    // Setup global keyboard blocking for all games
    this.setupGlobalKeyboardBlock()
  }

  /**
   * Get current state
   */
  getState(): GameFlowState {
    return { ...this.state }
  }

  /**
   * Get current game state
   */
  getCurrentState(): GameState {
    return this.state.currentState
  }

  /**
   * Check if game is paused
   */
  isPaused(): boolean {
    return this.state.isPaused
  }

  /**
   * Transition to new state
   */
  setState(newState: GameState): void {
    const oldState = this.state.currentState

    // Save previous state
    this.state.previousState = oldState
    this.stateHistory.push(oldState)

    // Update state
    this.state.currentState = newState

    // Update pause status
    this.state.isPaused = newState === 'paused' || newState === 'settings' || newState === 'loadout' || newState === 'leaderboards'

    console.log(`🎮 GameFlow: ${oldState} → ${newState}`)

    // Emit state change event
    this.emit('stateChange', {
      from: oldState,
      to: newState,
      isPaused: this.state.isPaused
    })
  }

  /**
   * Go back to previous state
   */
  goBack(): void {
    if (this.state.previousState) {
      this.setState(this.state.previousState)
    }
  }

  /**
   * Show Main Menu
   */
  showMainMenu(): void {
    this.setState('mainMenu')
  }

  /**
   * Show Character Selection
   */
  showCharacterSelect(): void {
    this.setState('characterSelect')
  }

  /**
   * Start Game
   */
  startGame(character?: PlayableCharacter): void {
    if (character) {
      this.state.selectedCharacter = character
    }
    this.setState('inGame')
  }

  /**
   * Pause Game
   */
  pauseGame(): void {
    if (this.state.currentState === 'inGame') {
      this.setState('paused')
    }
  }

  /**
   * Resume Game
   */
  resumeGame(): void {
    if (this.state.currentState === 'paused' || this.state.isPaused) {
      this.setState('inGame')
    }
  }

  /**
   * Show Match Summary
   */
  showMatchSummary(): void {
    this.setState('matchSummary')
  }

  /**
   * Show Loadout (can be called from menu or in-game)
   */
  showLoadout(): void {
    this.setState('loadout')
  }

  /**
   * Show Leaderboards
   */
  showLeaderboards(): void {
    this.setState('leaderboards')
  }

  /**
   * Show Settings
   */
  showSettings(): void {
    this.setState('settings')
  }

  /**
   * Update Settings
   */
  updateSettings(newSettings: GameSettings): void {
    this.state.settings = newSettings
    this.emit('settingsChanged', newSettings)
    console.log('⚙️ Settings updated:', newSettings)
  }

  /**
   * Get Settings
   */
  getSettings(): GameSettings {
    return { ...this.state.settings }
  }

  /**
   * Select Character
   */
  selectCharacter(character: PlayableCharacter): void {
    this.state.selectedCharacter = character
    this.emit('characterSelected', character)
    console.log(`👤 Character selected: ${character.displayName}`)
  }

  /**
   * Get Selected Character
   */
  getSelectedCharacter(): PlayableCharacter | null {
    return this.state.selectedCharacter
  }

  /**
   * Leave Match (return to main menu)
   */
  leaveMatch(): void {
    this.setState('mainMenu')
  }

  /**
   * Get Default Settings
   */
  private getDefaultSettings(): GameSettings {
    return {
      graphics: {
        resolution: '1920x1080',
        quality: 'high',
        fov: 90,
        vsync: true,
        antialiasing: true,
        shadows: true,
        showFPS: false
      },
      audio: {
        masterVolume: 100,
        musicVolume: 70,
        sfxVolume: 85,
        voiceVolume: 80
      },
      controls: {
        mouseSensitivity: 1.0,
        invertMouse: false,
        crosshairColor: '#00ff00',
        crosshairSize: 4,
        showDamageNumbers: true,
        showHitmarkers: true
      },
      gameplay: {
        autoReload: false,
        showKillfeed: true,
        fieldOfView: 90
      }
    }
  }

  /**
   * Reset State
   */
  reset(): void {
    this.state = {
      currentState: 'mainMenu',
      previousState: null,
      selectedCharacter: null,
      settings: this.getDefaultSettings(),
      isPaused: false
    }
    this.stateHistory = []
    this.emit('stateReset')
  }

  /**
   * Check if currently in an active game state
   */
  isInGame(): boolean {
    return this.state.currentState === 'inGame' || this.state.currentState === 'paused'
  }

  /**
   * Setup global keyboard blocking for all games
   */
  setupGlobalKeyboardBlock(): void {
    if (typeof window === 'undefined') return

    // Remove existing listeners to prevent duplicates
    this.removeGlobalKeyboardBlock()

    // Create global keydown handler
    this.globalKeydownHandler = (e: KeyboardEvent): void => {
      if (this.isInGame()) {
        this.preventBrowserDefaults(e)
      }
    }

    // Add to document
    document.addEventListener('keydown', this.globalKeydownHandler, true)

    console.log('🎮 Global keyboard blocking enabled for all games')
  }

  /**
   * Remove global keyboard blocking
   */
  removeGlobalKeyboardBlock(): void {
    if (typeof window === 'undefined') return

    if (this.globalKeydownHandler) {
      document.removeEventListener('keydown', this.globalKeydownHandler, true)
      this.globalKeydownHandler = null
    }
  }

  /**
   * Prevent browser default behaviors during gameplay
   */
  private preventBrowserDefaults(e: KeyboardEvent): void {
    // Navigation keys that cause page scrolling/interaction
    const navigationKeys = [
      ' ',        // Space (page scroll)
      'ArrowUp',   // Up arrow
      'ArrowDown', // Down arrow
      'ArrowLeft', // Left arrow
      'ArrowRight',// Right arrow
      'PageUp',    // Page up
      'PageDown',  // Page down
      'Home',      // Home
      'End',       // End
      'Tab'        // Tab (focus navigation)
    ]

    // Function keys that trigger browser actions
    const functionKeys = [
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ]

    // Other problematic keys
    const otherKeys = [
      'Enter',     // Form submission
      'Backspace'  // Browser back navigation
    ]

    // Check if key should be prevented
    const shouldPrevent = [
      ...navigationKeys,
      ...functionKeys,
      ...otherKeys
    ].includes(e.key)

    if (shouldPrevent) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.removeAllListeners()
    this.stateHistory = []
    this.removeGlobalKeyboardBlock()
  }
}

export default GameFlowManager

