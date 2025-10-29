/**
 * Game Types for GLXY Ultimate FPS
 * 
 * @module GameTypes
 * @description Comprehensive type definitions for game modes, configurations, and state
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { Vector3, Euler } from 'three'

// ============================================================================
// GAME MODES
// ============================================================================

/**
 * Available game modes in Ultimate FPS
 */
export type GameMode = 
  | 'zombie'           // Current: Survive waves of zombies
  | 'team-deathmatch'  // NEW: 2 teams fight to score limit
  | 'free-for-all'     // NEW: Every player for themselves
  | 'gun-game'         // NEW: Progress through weapons
  | 'search-destroy'   // NEW: Plant/defuse bomb
  | 'capture-flag'     // NEW: Capture enemy flag

/**
 * Game mode metadata for UI display
 */
export interface GameModeMetadata {
  id: GameMode
  name: string
  description: string
  icon: string
  minPlayers: number
  maxPlayers: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  tags: string[]
}

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

/**
 * Configuration for a specific game mode
 */
export interface GameConfig {
  /** Current game mode */
  mode: GameMode
  
  /** Maximum number of players */
  maxPlayers: number
  
  /** Time limit in seconds (0 = no limit) */
  timeLimit: number
  
  /** Score required to win (0 = no limit) */
  scoreLimit: number
  
  /** Whether players can respawn */
  respawn: boolean
  
  /** Number of teams (0 = FFA) */
  teams: number
  
  /** Whether team damage is enabled */
  friendlyFire: boolean
  
  /** Starting health for players */
  startingHealth: number
  
  /** Starting armor for players */
  startingArmor: number
  
  /** Custom rules for this mode */
  customRules?: Record<string, any>
}

// ============================================================================
// GAME STATE
// ============================================================================

/**
 * Current state of the game
 */
export interface GameState {
  /** Current game mode */
  mode: GameMode
  
  /** Whether game is currently running */
  isRunning: boolean
  
  /** Whether game is paused */
  isPaused: boolean
  
  /** Time elapsed since game start (seconds) */
  elapsedTime: number
  
  /** Time remaining (seconds, -1 = no limit) */
  timeRemaining: number
  
  /** Current round/wave number */
  round: number
  
  /** Game phase (warmup, active, overtime, ended) */
  phase: GamePhase
  
  /** Team scores (if teams enabled) */
  teamScores: Map<number, number>
  
  /** Individual player scores */
  playerScores: Map<string, number>
  
  /** Winner (team ID or player ID) */
  winner?: string | number
}

/**
 * Game phase enum
 */
export type GamePhase = 
  | 'warmup'    // Waiting for players
  | 'active'    // Game in progress
  | 'overtime'  // Overtime period
  | 'ended'     // Game finished

// ============================================================================
// TEAM
// ============================================================================

/**
 * Team definition
 */
export interface Team {
  /** Team ID (1, 2, 3...) */
  id: number
  
  /** Team display name */
  name: string
  
  /** Team color (hex) */
  color: number
  
  /** Team score */
  score: number
  
  /** Players on this team */
  players: string[] // Player IDs
  
  /** Team spawn points */
  spawnPoints: Vector3[]
}

// ============================================================================
// SCORE
// ============================================================================

/**
 * Score tracking for a player or team
 */
export interface Score {
  /** Kills */
  kills: number
  
  /** Deaths */
  deaths: number
  
  /** Assists */
  assists: number
  
  /** K/D Ratio */
  kd: number
  
  /** Total score points */
  score: number
  
  /** Kill streak */
  streak: number
  
  /** Best streak in this game */
  bestStreak: number
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Game events that can be emitted
 */
export type GameEvent = 
  | 'mode-changed'
  | 'game-started'
  | 'game-paused'
  | 'game-resumed'
  | 'game-ended'
  | 'round-started'
  | 'round-ended'
  | 'player-joined'
  | 'player-left'
  | 'player-killed'
  | 'player-respawned'
  | 'team-scored'
  | 'score-updated'

/**
 * Event payload interface
 */
export interface GameEventPayload {
  type: GameEvent
  timestamp: number
  data: any
}

// ============================================================================
// GAME MODE SPECIFIC TYPES
// ============================================================================

/**
 * Zombie mode specific state
 */
export interface ZombieState {
  currentWave: number
  zombiesRemaining: number
  zombiesKilled: number
  nextWaveTime: number
  difficulty: number
}

/**
 * Gun Game specific state
 */
export interface GunGameState {
  weaponProgression: string[]
  playerLevels: Map<string, number>
  maxLevel: number
}

/**
 * Search & Destroy specific state
 */
export interface SearchDestroyState {
  bombPlanted: boolean
  bombDefused: boolean
  bombTimer: number
  attackingTeam: number
  defendingTeam: number
}

/**
 * Capture the Flag specific state
 */
export interface CaptureTheFlagState {
  flags: Map<number, FlagState>
  capturePoints: number
}

export interface FlagState {
  teamId: number
  isHome: boolean
  carriedBy?: string // Player ID
  position: Vector3
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  Vector3,
  Euler
}

