/**
 * 🏃 MOVEMENT DATA SYSTEM
 * Data-Driven Architecture for Advanced FPS Movement
 *
 * @remarks
 * Integrated from GLXYAdvancedMovement.tsx and GLXYAdvancedMovement2.tsx
 * Combines best features from both systems (Oct 29, 2025)
 */

import * as THREE from 'three'

// ============================================================
// ENUMS
// ============================================================

export enum MovementAbilityType {
  MOVEMENT = 'movement',
  DEFENSIVE = 'defensive',
  OFFENSIVE = 'offensive',
  TACTICAL = 'tactical'
}

export enum MovementState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  SPRINTING = 'sprinting',
  CROUCHING = 'crouching',
  SLIDING = 'sliding',
  JUMPING = 'jumping',
  FALLING = 'falling',
  WALL_RUNNING = 'wall_running',
  WALL_CLIMBING = 'wall_climbing',
  MANTLING = 'mantling',
  VAULTING = 'vaulting',
  GLIDING = 'gliding',
  DODGING = 'dodging'
}

export enum WallRunDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up'
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * Movement Ability Definition
 */
export interface MovementAbilityData {
  // Identification
  id: string
  name: string
  description: string
  icon: string

  // Costs & Requirements
  staminaCost: number
  cooldown: number          // milliseconds
  duration: number          // milliseconds
  unlockLevel: number
  type: MovementAbilityType

  // Settings Override
  speedMultiplier?: number
  staminaCostMultiplier?: number
  airControlMultiplier?: number

  // Flags
  enableParkour?: boolean
  enableWallClimbing?: boolean
  enableMantling?: boolean
  enableVaulting?: boolean
  enableSlideToCover?: boolean
  enableBreaching?: boolean
  enableDoubleJump?: boolean
  enableGliding?: boolean
}

/**
 * Movement Settings Configuration
 */
export interface MovementSettings {
  // Base Movement
  walkSpeed: number              // m/s
  runSpeed: number               // m/s
  sprintSpeed: number            // m/s
  crouchSpeed: number            // m/s

  // Advanced Movement
  slideSpeed: number             // m/s
  slideDuration: number          // seconds
  wallRunSpeed: number           // m/s
  wallRunMinSpeed: number        // m/s (minimum speed to initiate)
  climbSpeed: number             // m/s

  // Jump Settings
  jumpForce: number              // Initial jump velocity
  doubleJumpForce: number        // Second jump velocity
  wallJumpForce: number          // Wall jump velocity

  // Air Control
  airControlMultiplier: number   // How much control in air (0-1)
  glideFallSpeed: number         // Descent speed when gliding

  // Stamina System
  maxStamina: number
  staminaRegenRate: number       // per second
  sprintStaminaCost: number      // per second
  jumpStaminaCost: number
  slideStaminaCost: number
  wallRunStaminaCost: number     // per second
  climbStaminaCost: number       // per second

  // Parkour Settings
  autoMantleHeight: number       // meters (auto mantle if obstacle below this)
  vaultHeightMax: number         // meters (max vaultable height)
  mantleDuration: number         // seconds
  vaultDuration: number          // seconds

  // Cover System
  coverDetectionRange: number    // meters
  slideToCoverEnabled: boolean

  // Multipliers
  speedMultiplier: number
  staminaCostMultiplier: number

  // Flags
  enableParkour: boolean
  enableWallRunning: boolean
  enableWallClimbing: boolean
  enableMantling: boolean
  enableVaulting: boolean
  enableDoubleJump: boolean
  enableGliding: boolean
  enableBreaching: boolean
}

/**
 * Active Movement State
 */
export interface MovementStateData {
  // Current State
  currentState: MovementState
  previousState: MovementState

  // Boolean Flags
  isGrounded: boolean
  isRunning: boolean
  isSprinting: boolean
  isCrouching: boolean
  isSliding: boolean
  isJumping: boolean
  isDoubleJumping: boolean
  isWallRunning: boolean
  isWallClimbing: boolean
  isMantling: boolean
  isVaulting: boolean
  isGliding: boolean
  isDodging: boolean
  isSlidingToCover: boolean
  isBreaching: boolean
  isParkourRunning: boolean

  // Numeric Values
  stamina: number
  maxStamina: number
  speed: number
  baseSpeed: number
  currentBoost: number

  // Timers
  airTime: number                // seconds in air
  lastJumpTime: number           // timestamp
  lastAction: number             // timestamp

  // Combo System
  comboCount: number
  comboMultiplier: number

  // Direction & Position
  wallRunDirection: WallRunDirection | null
  moveDirection: THREE.Vector3
  velocity: THREE.Vector3

  // Progress Indicators
  mantleProgress: number         // 0-1
  vaultProgress: number          // 0-1

  // Targets
  coverTarget: THREE.Vector3 | null
  breachTarget: THREE.Vector3 | null
  wallTarget: THREE.Vector3 | null
}

/**
 * Wall Detection Result
 */
export interface WallInfo {
  normal: THREE.Vector3
  direction: WallRunDirection
  isClimbable: boolean
  distance: number
  contactPoint: THREE.Vector3
}

/**
 * Mantle/Vault Target
 */
export interface ObstacleTarget {
  position: THREE.Vector3
  height: number
  edge: THREE.Vector3
  normal: THREE.Vector3
}

/**
 * Movement Animation Data
 */
export interface MovementAnimationData {
  name: string
  duration: number
  loop: boolean
  speed: number
  blendTime: number
  priority: number
}

// ============================================================
// MOVEMENT ABILITIES CATALOG
// ============================================================

export const MOVEMENT_ABILITIES: MovementAbilityData[] = [
  // Basic Abilities (Unlock Level 1-3)
  {
    id: 'enhanced_sprint',
    name: 'Enhanced Sprint',
    description: 'Faster sprint with auto-mantling capabilities',
    icon: '⚡',
    staminaCost: 15,
    cooldown: 1000,
    duration: 3000,
    unlockLevel: 1,
    type: MovementAbilityType.MOVEMENT,
    speedMultiplier: 1.8,
    enableMantling: true
  },
  {
    id: 'slide_kick',
    name: 'Slide Kick',
    description: 'Slide and kick enemies for knockback',
    icon: '🦵',
    staminaCost: 15,
    cooldown: 2000,
    duration: 1000,
    unlockLevel: 2,
    type: MovementAbilityType.OFFENSIVE
  },
  {
    id: 'tactical_breacher',
    name: 'Tactical Breacher',
    description: 'Break through doors and create tactical advantages',
    icon: '🚪',
    staminaCost: 30,
    cooldown: 4000,
    duration: 1000,
    unlockLevel: 3,
    type: MovementAbilityType.TACTICAL,
    enableBreaching: true,
    speedMultiplier: 2.0
  },

  // Advanced Abilities (Unlock Level 4-6)
  {
    id: 'parkour_master',
    name: 'Parkour Master',
    description: 'Advanced parkour with fluid movement chains',
    icon: '🏃',
    staminaCost: 25,
    cooldown: 2000,
    duration: 5000,
    unlockLevel: 4,
    type: MovementAbilityType.MOVEMENT,
    speedMultiplier: 1.3,
    staminaCostMultiplier: 0.8,
    enableParkour: true,
    enableWallClimbing: true,
    enableMantling: true,
    enableVaulting: true
  },
  {
    id: 'wall_runner',
    name: 'Wall Runner',
    description: 'Run on walls for tactical repositioning',
    icon: '🏃',
    staminaCost: 25,
    cooldown: 4000,
    duration: 3000,
    unlockLevel: 5,
    type: MovementAbilityType.MOVEMENT,
    enableWallClimbing: true
  },
  {
    id: 'ghost_runner',
    name: 'Ghost Runner',
    description: 'Silent movement with enhanced cover abilities',
    icon: '👻',
    staminaCost: 20,
    cooldown: 3000,
    duration: 4000,
    unlockLevel: 6,
    type: MovementAbilityType.DEFENSIVE,
    staminaCostMultiplier: 0.7,
    enableSlideToCover: true,
    enableGliding: true
  },

  // Elite Abilities (Unlock Level 7-10)
  {
    id: 'acrobat_elite',
    name: 'Acrobat Elite',
    description: 'Master of aerial movement and advanced maneuvers',
    icon: '🤸',
    staminaCost: 35,
    cooldown: 5000,
    duration: 6000,
    unlockLevel: 7,
    type: MovementAbilityType.MOVEMENT,
    airControlMultiplier: 1.5,
    enableDoubleJump: true,
    enableWallClimbing: true
  },
  {
    id: 'power_slide',
    name: 'Power Slide',
    description: 'Long slide with speed boost at end',
    icon: '💨',
    staminaCost: 30,
    cooldown: 4000,
    duration: 2000,
    unlockLevel: 8,
    type: MovementAbilityType.MOVEMENT,
    speedMultiplier: 2.2
  },
  {
    id: 'super_jump',
    name: 'Super Jump',
    description: 'Massive vertical jump with damage on landing',
    icon: '🚀',
    staminaCost: 35,
    cooldown: 6000,
    duration: 1000,
    unlockLevel: 9,
    type: MovementAbilityType.OFFENSIVE
  },
  {
    id: 'blink_dash',
    name: 'Blink Dash',
    description: 'Teleport short distance instantly',
    icon: '✨',
    staminaCost: 40,
    cooldown: 4000,
    duration: 200,
    unlockLevel: 10,
    type: MovementAbilityType.MOVEMENT,
    speedMultiplier: 3.0
  }
]

// ============================================================
// DEFAULT MOVEMENT SETTINGS
// ============================================================

export const DEFAULT_MOVEMENT_SETTINGS: MovementSettings = {
  // Base Movement (Call of Duty / Titanfall inspired)
  walkSpeed: 3.0,
  runSpeed: 5.5,
  sprintSpeed: 8.0,
  crouchSpeed: 2.0,

  // Advanced Movement
  slideSpeed: 9.0,
  slideDuration: 1.5,
  wallRunSpeed: 7.0,
  wallRunMinSpeed: 3.0,
  climbSpeed: 2.5,

  // Jump Settings
  jumpForce: 8.0,
  doubleJumpForce: 12.0,
  wallJumpForce: 10.0,

  // Air Control
  airControlMultiplier: 0.8,
  glideFallSpeed: 2.0,

  // Stamina System
  maxStamina: 100,
  staminaRegenRate: 15,       // 15 stamina/second
  sprintStaminaCost: 10,      // 10 stamina/second
  jumpStaminaCost: 10,
  slideStaminaCost: 20,
  wallRunStaminaCost: 15,     // 15 stamina/second
  climbStaminaCost: 20,       // 20 stamina/second

  // Parkour Settings
  autoMantleHeight: 1.2,
  vaultHeightMax: 2.0,
  mantleDuration: 0.8,
  vaultDuration: 0.6,

  // Cover System
  coverDetectionRange: 5.0,
  slideToCoverEnabled: true,

  // Multipliers
  speedMultiplier: 1.0,
  staminaCostMultiplier: 1.0,

  // Flags
  enableParkour: true,
  enableWallRunning: true,
  enableWallClimbing: true,
  enableMantling: true,
  enableVaulting: true,
  enableDoubleJump: true,
  enableGliding: true,
  enableBreaching: true
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get ability by ID
 */
export function getMovementAbilityById(id: string): MovementAbilityData | undefined {
  return MOVEMENT_ABILITIES.find(ability => ability.id === id)
}

/**
 * Get abilities by type
 */
export function getMovementAbilitiesByType(type: MovementAbilityType): MovementAbilityData[] {
  return MOVEMENT_ABILITIES.filter(ability => ability.type === type)
}

/**
 * Get abilities unlocked at level
 */
export function getMovementAbilitiesAtLevel(level: number): MovementAbilityData[] {
  return MOVEMENT_ABILITIES.filter(ability => ability.unlockLevel <= level)
}

/**
 * Calculate movement speed based on state and settings
 */
export function calculateMovementSpeed(
  state: MovementStateData,
  settings: MovementSettings
): number {
  let speed = settings.walkSpeed

  if (state.isSprinting) {
    speed = settings.sprintSpeed
  } else if (state.isRunning) {
    speed = settings.runSpeed
  } else if (state.isCrouching) {
    speed = settings.crouchSpeed
  } else if (state.isSliding) {
    speed = settings.slideSpeed
  } else if (state.isWallRunning) {
    speed = settings.wallRunSpeed
  }

  // Apply multipliers
  speed *= settings.speedMultiplier
  speed *= (1 + state.currentBoost)
  speed *= (1 + state.comboMultiplier * 0.1)

  return speed
}

/**
 * Check if player has enough stamina for action
 */
export function hasEnoughStamina(
  currentStamina: number,
  cost: number,
  settings: MovementSettings
): boolean {
  const adjustedCost = cost * settings.staminaCostMultiplier
  return currentStamina >= adjustedCost
}

/**
 * Calculate stamina cost with multipliers
 */
export function calculateStaminaCost(
  baseCost: number,
  settings: MovementSettings
): number {
  return baseCost * settings.staminaCostMultiplier
}

/**
 * Check if movement state allows another action
 */
export function canPerformAction(state: MovementStateData, actionType: string): boolean {
  // Can't perform actions while mantling or vaulting
  if (state.isMantling || state.isVaulting) {
    return false
  }

  // Can perform most actions while grounded
  if (state.isGrounded) {
    return true
  }

  // Special cases for air actions
  if (actionType === 'double_jump') {
    return state.isJumping && !state.isDoubleJumping
  }

  if (actionType === 'glide') {
    return state.airTime > 0.5
  }

  if (actionType === 'wall_run' || actionType === 'wall_climb') {
    return true // Can always attempt
  }

  return false
}

/**
 * Validate movement settings
 */
export function validateMovementSettings(settings: MovementSettings): boolean {
  if (settings.walkSpeed <= 0 || settings.runSpeed <= settings.walkSpeed) {
    console.error('❌ Invalid movement speeds')
    return false
  }

  if (settings.maxStamina <= 0 || settings.staminaRegenRate < 0) {
    console.error('❌ Invalid stamina values')
    return false
  }

  if (settings.jumpForce <= 0) {
    console.error('❌ Invalid jump force')
    return false
  }

  return true
}

/**
 * Create default movement state
 */
export function createDefaultMovementState(): MovementStateData {
  return {
    currentState: MovementState.IDLE,
    previousState: MovementState.IDLE,

    isGrounded: true,
    isRunning: false,
    isSprinting: false,
    isCrouching: false,
    isSliding: false,
    isJumping: false,
    isDoubleJumping: false,
    isWallRunning: false,
    isWallClimbing: false,
    isMantling: false,
    isVaulting: false,
    isGliding: false,
    isDodging: false,
    isSlidingToCover: false,
    isBreaching: false,
    isParkourRunning: false,

    stamina: DEFAULT_MOVEMENT_SETTINGS.maxStamina,
    maxStamina: DEFAULT_MOVEMENT_SETTINGS.maxStamina,
    speed: DEFAULT_MOVEMENT_SETTINGS.walkSpeed,
    baseSpeed: DEFAULT_MOVEMENT_SETTINGS.walkSpeed,
    currentBoost: 0,

    airTime: 0,
    lastJumpTime: 0,
    lastAction: 0,

    comboCount: 0,
    comboMultiplier: 0,

    wallRunDirection: null,
    moveDirection: new THREE.Vector3(),
    velocity: new THREE.Vector3(),

    mantleProgress: 0,
    vaultProgress: 0,

    coverTarget: null,
    breachTarget: null,
    wallTarget: null
  }
}
