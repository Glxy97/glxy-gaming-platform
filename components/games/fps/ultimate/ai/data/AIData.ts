/**
 * 🤖 AI DATA SYSTEM
 * Data-Driven Architecture for Enemy AI
 *
 * @remarks
 * Integrated from GLXYAIEnemies.tsx (Oct 29, 2025)
 * Professional AI system with personalities, learning, and team coordination
 */

import * as THREE from 'three'

// ============================================================
// ENUMS
// ============================================================

export enum AIState {
  IDLE = 'idle',
  PATROLLING = 'patrolling',
  INVESTIGATING = 'investigating',
  SEARCHING = 'searching',
  ENGAGING = 'engaging',
  TAKING_COVER = 'taking_cover',
  COVERING = 'covering',
  RELOADING = 'reloading',
  RETREATING = 'retreating',
  FLANKING = 'flanking',
  SUPPORTING = 'supporting',
  PLANTING = 'planting',
  DEFUSING = 'defusing',
  REVIVING = 'reviving',
  DEAD = 'dead',
  RESPAWNING = 'respawning'
}

export enum AIMovementPattern {
  AGGRESSIVE = 'aggressive',
  CAUTIOUS = 'cautious',
  TACTICAL = 'tactical',
  FLANKING = 'flanking',
  DEFENSIVE = 'defensive'
}

export enum AICombatStyle {
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  TACTICAL = 'tactical'
}

export enum AISquadPosition {
  LEADER = 'leader',
  MEMBER = 'member',
  LONE_WOLF = 'lone_wolf'
}

export enum AIOrderType {
  ATTACK = 'attack',
  DEFEND = 'defend',
  PATROL = 'patrol',
  SUPPORT = 'support',
  REGROUP = 'regroup',
  FLANK = 'flank',
  CAMP = 'camp'
}

export enum AIVoicePersonality {
  CALM = 'calm',
  AGGRESSIVE = 'aggressive',
  TACTICAL = 'tactical',
  CASUAL = 'casual'
}

export enum PlayerMovementStyle {
  AGGRESSIVE = 'aggressive',
  CAUTIOUS = 'cautious',
  UNPREDICTABLE = 'unpredictable'
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * AI Personality Definition
 */
export interface AIPersonalityData {
  id: string
  name: string
  description: string

  // Stats (0-100)
  aggressiveness: number
  accuracy: number
  reactionTime: number           // milliseconds
  tacticalThinking: number
  teamCoordination: number
  learningRate: number

  // Preferences
  preferredWeapons: string[]
  behaviorTraits: string[]
  movementPattern: AIMovementPattern

  // Visual
  icon: string
  color: string
}

/**
 * AI Difficulty Definition
 */
export interface AIDifficultyData {
  id: string
  name: string
  description: string

  // Multipliers
  healthMultiplier: number
  damageMultiplier: number
  accuracyBonus: number
  reactionTimeMultiplier: number

  // Detection
  visionRange: number            // meters
  hearingRange: number           // meters

  // Progression
  equipmentLevel: number         // 1-5
  teamworkLevel: number          // 0-100

  // Visual
  color: string
}

/**
 * AI Voice Profile
 */
export interface AIVoiceProfileData {
  id: string
  name: string

  // Voice Settings
  language: string
  accent: string
  pitch: number                  // 0.5-2.0
  speed: number                  // 0.5-2.0
  volume: number                 // 0-1

  // Personality
  personality: AIVoicePersonality

  // Responses
  responses: Map<string, string[]>
}

/**
 * AI Bot State Data
 */
export interface AIBotStateData {
  // Current State
  currentState: AIState
  previousState: AIState

  // Awareness
  alertLevel: number             // 0-100
  morale: number                 // 0-100
  stamina: number                // 0-100

  // Targets & Memory
  target: THREE.Vector3 | null
  lastKnownPlayerPosition: THREE.Vector3 | null
  lastSeenTimestamp: number

  // Combat
  isAiming: boolean
  isFiring: boolean
  lastShotTime: number
  burstFireCount: number
  reloadTime: number
  combatStyle: AICombatStyle
  engagementRange: number

  // Movement & Pathfinding
  pathNodes: PathfindingNode[]
  currentPathIndex: number
  coverPositions: THREE.Vector3[]
  currentCover: THREE.Vector3 | null

  // Learning
  experience: number
  kills: number
  deaths: number
  accuracy: number
  survivalTime: number
  learnedPatterns: Map<string, number>

  // Team
  teamId: string
  squadPosition: AISquadPosition
  isFollowingOrders: boolean
  orders: AIOrderData[]

  // Behavior Timer
  behaviorTimer: number
  nextDecisionTime: number
}

/**
 * Pathfinding Node
 */
export interface PathfindingNode {
  position: THREE.Vector3
  cost: number
  neighbors: PathfindingNode[]
  isCover: boolean
  height: number
  isOccupied: boolean
}

/**
 * AI Order Data
 */
export interface AIOrderData {
  id: string
  type: AIOrderType
  priority: number               // 0-10
  target?: THREE.Vector3
  description: string
  issuer: string
  timestamp: number
  isCompleted: boolean
}

/**
 * AI Learning Data
 */
export interface AILearningData {
  playerPatterns: Map<string, PlayerPatternData>
  successfulTactics: Map<string, number>
  failedTactics: Map<string, number>
  mapKnowledge: Map<string, MapKnowledgeData>
  weaponPreferences: Map<string, number>
  timingPatterns: Map<string, number[]>
}

/**
 * Player Pattern Data
 */
export interface PlayerPatternData {
  movementStyle: PlayerMovementStyle
  preferredPositions: THREE.Vector3[]
  reactionTendencies: Map<string, number>
  weaponUsage: Map<string, number>
  accuracyTrend: number[]
  lastEncounters: number[]
}

/**
 * Map Knowledge Data
 */
export interface MapKnowledgeData {
  positions: Map<string, PositionData>
  coverSpots: THREE.Vector3[]
  dangerZones: THREE.Vector3[]
  strategicPoints: THREE.Vector3[]
  spawnPoints: THREE.Vector3[]
  objectives: THREE.Vector3[]
}

/**
 * Position Data
 */
export interface PositionData {
  visits: number
  successRate: number
  dangerLevel: number
  lastVisited: number
  encounters: number
}

/**
 * AI Settings Configuration
 */
export interface AISettingsData {
  enableAdvancedAI: boolean
  enableTeamwork: boolean
  enableLearning: boolean
  difficultyScaling: boolean
  dynamicDifficulty: boolean

  // Bot Behavior
  botReactionTime: number        // milliseconds
  botAccuracy: number            // 0-100
  botVisionRange: number         // meters
  botHearingRange: number        // meters

  // Population
  maxConcurrentBots: number
  spawnRate: number              // milliseconds

  // Performance
  aiUpdateRate: number           // Hz (updates per second)
  performanceMode: boolean
}

// ============================================================
// AI PERSONALITIES CATALOG
// ============================================================

export const AI_PERSONALITIES: AIPersonalityData[] = [
  {
    id: 'aggressive_assault',
    name: 'Aggressive Assault',
    description: 'Highly aggressive, rushes enemies with close-range weapons',
    aggressiveness: 90,
    accuracy: 60,
    reactionTime: 200,
    tacticalThinking: 30,
    teamCoordination: 50,
    learningRate: 60,
    preferredWeapons: ['shotgun', 'smg'],
    behaviorTraits: ['rush', 'push', 'close_combat', 'high_risk'],
    movementPattern: AIMovementPattern.AGGRESSIVE,
    icon: '⚔️',
    color: '#ff4444'
  },
  {
    id: 'tactical_sniper',
    name: 'Tactical Sniper',
    description: 'Patient and precise, excels at long-range engagements',
    aggressiveness: 20,
    accuracy: 95,
    reactionTime: 800,
    tacticalThinking: 90,
    teamCoordination: 70,
    learningRate: 80,
    preferredWeapons: ['sniper', 'dmr'],
    behaviorTraits: ['patience', 'precision', 'positioning', 'long_range'],
    movementPattern: AIMovementPattern.TACTICAL,
    icon: '🎯',
    color: '#4444ff'
  },
  {
    id: 'support_medic',
    name: 'Support Medic',
    description: 'Team-oriented, focuses on healing and supporting teammates',
    aggressiveness: 40,
    accuracy: 70,
    reactionTime: 400,
    tacticalThinking: 75,
    teamCoordination: 95,
    learningRate: 70,
    preferredWeapons: ['smg', 'pistol'],
    behaviorTraits: ['teamwork', 'healing', 'support', 'cautious'],
    movementPattern: AIMovementPattern.DEFENSIVE,
    icon: '💊',
    color: '#44ff44'
  },
  {
    id: 'flanker_assassin',
    name: 'Flanker Assassin',
    description: 'Stealthy and deceptive, uses flanking routes and surprise attacks',
    aggressiveness: 60,
    accuracy: 80,
    reactionTime: 300,
    tacticalThinking: 85,
    teamCoordination: 60,
    learningRate: 90,
    preferredWeapons: ['smg', 'pistol', 'knife'],
    behaviorTraits: ['stealth', 'flanking', 'deception', 'surprise'],
    movementPattern: AIMovementPattern.FLANKING,
    icon: '🗡️',
    color: '#ff44ff'
  },
  {
    id: 'defensive_anchor',
    name: 'Defensive Anchor',
    description: 'Defensive-minded, holds positions and provides cover fire',
    aggressiveness: 30,
    accuracy: 75,
    reactionTime: 350,
    tacticalThinking: 80,
    teamCoordination: 85,
    learningRate: 65,
    preferredWeapons: ['assault', 'lmg'],
    behaviorTraits: ['defense', 'covering_fire', 'positioning', 'patience'],
    movementPattern: AIMovementPattern.DEFENSIVE,
    icon: '🛡️',
    color: '#ffff44'
  },
  {
    id: 'adaptive_pro',
    name: 'Adaptive Pro',
    description: 'Learns from player behavior and adapts strategies',
    aggressiveness: 50,
    accuracy: 85,
    reactionTime: 250,
    tacticalThinking: 95,
    teamCoordination: 75,
    learningRate: 100,
    preferredWeapons: ['assault', 'smg', 'sniper'],
    behaviorTraits: ['adaptation', 'learning', 'versatility', 'counter_play'],
    movementPattern: AIMovementPattern.TACTICAL,
    icon: '🧠',
    color: '#ff8844'
  }
]

// ============================================================
// AI DIFFICULTY LEVELS CATALOG
// ============================================================

export const AI_DIFFICULTIES: AIDifficultyData[] = [
  {
    id: 'recruit',
    name: 'Recruit',
    description: 'Beginner-friendly AI with lower accuracy and slower reactions',
    healthMultiplier: 0.8,
    damageMultiplier: 0.7,
    accuracyBonus: -20,
    reactionTimeMultiplier: 1.5,
    visionRange: 20,
    hearingRange: 15,
    equipmentLevel: 1,
    teamworkLevel: 30,
    color: '#90EE90'
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Balanced AI for normal gameplay experience',
    healthMultiplier: 1.0,
    damageMultiplier: 1.0,
    accuracyBonus: 0,
    reactionTimeMultiplier: 1.0,
    visionRange: 30,
    hearingRange: 20,
    equipmentLevel: 2,
    teamworkLevel: 60,
    color: '#87CEEB'
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Experienced AI with better tactics and equipment',
    healthMultiplier: 1.2,
    damageMultiplier: 1.2,
    accuracyBonus: 15,
    reactionTimeMultiplier: 0.8,
    visionRange: 40,
    hearingRange: 25,
    equipmentLevel: 3,
    teamworkLevel: 80,
    color: '#DDA0DD'
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Highly skilled AI with advanced tactics and coordination',
    healthMultiplier: 1.5,
    damageMultiplier: 1.4,
    accuracyBonus: 25,
    reactionTimeMultiplier: 0.6,
    visionRange: 50,
    hearingRange: 30,
    equipmentLevel: 4,
    teamworkLevel: 95,
    color: '#FFB347'
  },
  {
    id: 'nightmare',
    name: 'Nightmare',
    description: 'Extremely challenging AI with perfect accuracy and tactics',
    healthMultiplier: 2.0,
    damageMultiplier: 1.8,
    accuracyBonus: 35,
    reactionTimeMultiplier: 0.4,
    visionRange: 60,
    hearingRange: 40,
    equipmentLevel: 5,
    teamworkLevel: 100,
    color: '#FF6B6B'
  }
]

// ============================================================
// AI VOICE PROFILES CATALOG
// ============================================================

export const AI_VOICE_PROFILES: AIVoiceProfileData[] = [
  {
    id: 'male_soldier',
    name: 'Male Soldier',
    language: 'english',
    accent: 'american',
    pitch: 1.0,
    speed: 1.0,
    volume: 0.8,
    personality: AIVoicePersonality.TACTICAL,
    responses: new Map([
      ['enemy_spotted', ['Enemy spotted!', 'Contact front!', 'Hostiles detected!']],
      ['reloading', ['Reloading!', 'Cover me, reloading!', 'Need to reload!']],
      ['grenade', ['Grenade out!', 'Fire in the hole!', 'Get to cover!']],
      ['under_fire', ['I\'m hit!', 'Under heavy fire!', 'Need backup!']],
      ['kill', ['Target neutralized!', 'Enemy down!', 'Got one!']]
    ])
  },
  {
    id: 'female_soldier',
    name: 'Female Soldier',
    language: 'english',
    accent: 'british',
    pitch: 1.2,
    speed: 0.9,
    volume: 0.7,
    personality: AIVoicePersonality.CALM,
    responses: new Map([
      ['enemy_spotted', ['Visual on enemy.', 'Target acquired.', 'Hostile located.']],
      ['reloading', ['Reloading weapon.', 'Changing magazine.', 'Need to reload.']],
      ['grenade', ['Throwing grenade.', 'Incendiary out.', 'Explosive deployed.']],
      ['under_fire', ['Taking fire!', 'I\'m pinned down!', 'Suppressing fire needed!']],
      ['kill', ['Target eliminated.', 'Threat neutralized.', 'Hostile down.']]
    ])
  }
]

// ============================================================
// DEFAULT AI SETTINGS
// ============================================================

export const DEFAULT_AI_SETTINGS: AISettingsData = {
  enableAdvancedAI: true,
  enableTeamwork: true,
  enableLearning: true,
  difficultyScaling: true,
  dynamicDifficulty: true,

  botReactionTime: 500,
  botAccuracy: 50,
  botVisionRange: 30,
  botHearingRange: 20,

  maxConcurrentBots: 12,
  spawnRate: 2000,

  aiUpdateRate: 10,              // 10 Hz (100ms per update)
  performanceMode: false
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get AI personality by ID
 */
export function getAIPersonalityById(id: string): AIPersonalityData | undefined {
  return AI_PERSONALITIES.find(p => p.id === id)
}

/**
 * Get AI personalities by aggressiveness range
 */
export function getAIPersonalitiesByAggressiveness(
  minAggression: number,
  maxAggression: number
): AIPersonalityData[] {
  return AI_PERSONALITIES.filter(
    p => p.aggressiveness >= minAggression && p.aggressiveness <= maxAggression
  )
}

/**
 * Get AI difficulty by ID
 */
export function getAIDifficultyById(id: string): AIDifficultyData | undefined {
  return AI_DIFFICULTIES.find(d => d.id === id)
}

/**
 * Get AI voice profile by ID
 */
export function getAIVoiceProfileById(id: string): AIVoiceProfileData | undefined {
  return AI_VOICE_PROFILES.find(v => v.id === id)
}

/**
 * Calculate effective accuracy with difficulty bonus
 */
export function calculateEffectiveAccuracy(
  baseAccuracy: number,
  difficulty: AIDifficultyData
): number {
  return Math.min(100, Math.max(0, baseAccuracy + difficulty.accuracyBonus))
}

/**
 * Calculate effective reaction time with difficulty multiplier
 */
export function calculateEffectiveReactionTime(
  baseReactionTime: number,
  difficulty: AIDifficultyData
): number {
  return baseReactionTime * difficulty.reactionTimeMultiplier
}

/**
 * Check if AI can see target
 */
export function canAISeeTarget(
  aiPosition: THREE.Vector3,
  targetPosition: THREE.Vector3,
  visionRange: number,
  accuracy: number
): boolean {
  const distance = aiPosition.distanceTo(targetPosition)

  if (distance > visionRange) {
    return false
  }

  // Accuracy affects detection chance
  const accuracyThreshold = accuracy / 100
  const randomFactor = Math.random()

  return randomFactor < accuracyThreshold
}

/**
 * Calculate tactical score for a position
 */
export function calculateTacticalScore(
  position: THREE.Vector3,
  enemyPosition: THREE.Vector3,
  coverPositions: THREE.Vector3[]
): number {
  let score = 0

  // Distance to enemy (optimal range = 20-30m)
  const distanceToEnemy = position.distanceTo(enemyPosition)
  const optimalDistance = 25
  const distanceScore = 100 - Math.abs(distanceToEnemy - optimalDistance) * 2
  score += distanceScore * 0.4

  // Proximity to cover
  if (coverPositions.length > 0) {
    const nearestCover = coverPositions.reduce((nearest, cover) => {
      const dist = position.distanceTo(cover)
      return dist < position.distanceTo(nearest) ? cover : nearest
    })
    const coverDistance = position.distanceTo(nearestCover)
    const coverScore = Math.max(0, 100 - coverDistance * 10)
    score += coverScore * 0.3
  }

  // Height advantage
  const heightAdvantage = position.y - enemyPosition.y
  const heightScore = Math.max(0, Math.min(100, 50 + heightAdvantage * 10))
  score += heightScore * 0.3

  return score
}

/**
 * Get random voice response
 */
export function getRandomVoiceResponse(
  voiceProfile: AIVoiceProfileData,
  eventType: string
): string | undefined {
  const responses = voiceProfile.responses.get(eventType)
  if (!responses || responses.length === 0) {
    return undefined
  }

  const randomIndex = Math.floor(Math.random() * responses.length)
  return responses[randomIndex]
}

/**
 * Calculate tactic success rate
 */
export function calculateTacticSuccessRate(
  successfulUses: number,
  failedUses: number
): number {
  const total = successfulUses + failedUses
  return total > 0 ? successfulUses / total : 0.5
}

/**
 * Determine optimal engagement range for personality
 */
export function getOptimalEngagementRange(personality: AIPersonalityData): number {
  switch (personality.movementPattern) {
    case AIMovementPattern.AGGRESSIVE:
      return 15
    case AIMovementPattern.DEFENSIVE:
      return 30
    case AIMovementPattern.TACTICAL:
      return 40
    case AIMovementPattern.FLANKING:
      return 20
    default:
      return 25
  }
}

/**
 * Validate AI settings
 */
export function validateAISettings(settings: AISettingsData): boolean {
  if (settings.botReactionTime < 0) {
    console.error('❌ Invalid bot reaction time')
    return false
  }

  if (settings.botAccuracy < 0 || settings.botAccuracy > 100) {
    console.error('❌ Invalid bot accuracy (must be 0-100)')
    return false
  }

  if (settings.maxConcurrentBots <= 0) {
    console.error('❌ Invalid max concurrent bots')
    return false
  }

  if (settings.aiUpdateRate <= 0 || settings.aiUpdateRate > 60) {
    console.error('❌ Invalid AI update rate (must be 1-60 Hz)')
    return false
  }

  return true
}

/**
 * Create default AI bot state
 */
export function createDefaultAIBotState(): AIBotStateData {
  return {
    currentState: AIState.IDLE,
    previousState: AIState.IDLE,

    alertLevel: 0,
    morale: 100,
    stamina: 100,

    target: null,
    lastKnownPlayerPosition: null,
    lastSeenTimestamp: 0,

    isAiming: false,
    isFiring: false,
    lastShotTime: 0,
    burstFireCount: 0,
    reloadTime: 0,
    combatStyle: AICombatStyle.DEFENSIVE,
    engagementRange: 25,

    pathNodes: [],
    currentPathIndex: 0,
    coverPositions: [],
    currentCover: null,

    experience: 0,
    kills: 0,
    deaths: 0,
    accuracy: 0,
    survivalTime: 0,
    learnedPatterns: new Map(),

    teamId: 'bot_team',
    squadPosition: AISquadPosition.LONE_WOLF,
    isFollowingOrders: false,
    orders: [],

    behaviorTimer: 0,
    nextDecisionTime: Date.now() + Math.random() * 2000
  }
}
