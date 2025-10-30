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
   * Cleanup
   */
  destroy(): void {
    this.removeAllListeners()
    this.stateHistory = []
  }
}

export default GameFlowManager

