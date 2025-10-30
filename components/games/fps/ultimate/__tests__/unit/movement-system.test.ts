/**
 * 🏃 MOVEMENT SYSTEM TESTS
 * Comprehensive unit tests for movement data and utilities
 */

import { describe, it, expect } from 'vitest'
import {
  MovementAbilityType,
  MovementState,
  MOVEMENT_ABILITIES,
  DEFAULT_MOVEMENT_SETTINGS,
  getMovementAbilityById,
  getMovementAbilitiesByType,
  getMovementAbilitiesAtLevel,
  calculateMovementSpeed,
  hasEnoughStamina,
  calculateStaminaCost,
  canPerformAction,
  validateMovementSettings,
  createDefaultMovementState
} from '../../movement/data/MovementData'
import * as THREE from 'three'

// ============================================================
// MOVEMENT ABILITIES CATALOG TESTS
// ============================================================

describe('Movement Abilities Catalog', () => {
  it('should have 10 movement abilities defined', () => {
    expect(MOVEMENT_ABILITIES).toHaveLength(10)
  })

  it('should have unique ability IDs', () => {
    const ids = MOVEMENT_ABILITIES.map(a => a.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have abilities for all unlock levels 1-10', () => {
    const levels = MOVEMENT_ABILITIES.map(a => a.unlockLevel).sort((a, b) => a - b)
    expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('should have all required fields for each ability', () => {
    MOVEMENT_ABILITIES.forEach(ability => {
      expect(ability.id).toBeTruthy()
      expect(ability.name).toBeTruthy()
      expect(ability.description).toBeTruthy()
      expect(ability.icon).toBeTruthy()
      expect(ability.staminaCost).toBeGreaterThan(0)
      expect(ability.cooldown).toBeGreaterThan(0)
      expect(ability.duration).toBeGreaterThan(0)
      expect(ability.unlockLevel).toBeGreaterThan(0)
      expect(ability.unlockLevel).toBeLessThanOrEqual(10)
      expect(Object.values(MovementAbilityType)).toContain(ability.type)
    })
  })

  it('should have correct ability type distribution', () => {
    const movementAbilities = MOVEMENT_ABILITIES.filter(a => a.type === MovementAbilityType.MOVEMENT)
    const defensiveAbilities = MOVEMENT_ABILITIES.filter(a => a.type === MovementAbilityType.DEFENSIVE)
    const offensiveAbilities = MOVEMENT_ABILITIES.filter(a => a.type === MovementAbilityType.OFFENSIVE)
    const tacticalAbilities = MOVEMENT_ABILITIES.filter(a => a.type === MovementAbilityType.TACTICAL)

    expect(movementAbilities.length).toBeGreaterThan(0)
    expect(defensiveAbilities.length).toBeGreaterThan(0)
    expect(offensiveAbilities.length).toBeGreaterThan(0)
    expect(tacticalAbilities.length).toBeGreaterThan(0)
  })

  it('should have balanced stamina costs (10-40 range)', () => {
    MOVEMENT_ABILITIES.forEach(ability => {
      expect(ability.staminaCost).toBeGreaterThanOrEqual(10)
      expect(ability.staminaCost).toBeLessThanOrEqual(40)
    })
  })

  it('should have reasonable cooldowns (1-6 seconds)', () => {
    MOVEMENT_ABILITIES.forEach(ability => {
      expect(ability.cooldown).toBeGreaterThanOrEqual(1000)
      expect(ability.cooldown).toBeLessThanOrEqual(6000)
    })
  })
})

// ============================================================
// HELPER FUNCTION TESTS
// ============================================================

describe('getMovementAbilityById', () => {
  it('should return ability when ID exists', () => {
    const ability = getMovementAbilityById('enhanced_sprint')
    expect(ability).toBeDefined()
    expect(ability?.id).toBe('enhanced_sprint')
    expect(ability?.name).toBe('Enhanced Sprint')
  })

  it('should return undefined when ID does not exist', () => {
    const ability = getMovementAbilityById('nonexistent_ability')
    expect(ability).toBeUndefined()
  })

  it('should find all 10 abilities by their IDs', () => {
    const ids = ['enhanced_sprint', 'slide_kick', 'tactical_breacher', 'parkour_master',
                 'wall_runner', 'ghost_runner', 'acrobat_elite', 'power_slide',
                 'super_jump', 'blink_dash']

    ids.forEach(id => {
      const ability = getMovementAbilityById(id)
      expect(ability).toBeDefined()
      expect(ability?.id).toBe(id)
    })
  })
})

describe('getMovementAbilitiesByType', () => {
  it('should return only MOVEMENT type abilities', () => {
    const abilities = getMovementAbilitiesByType(MovementAbilityType.MOVEMENT)
    expect(abilities.length).toBeGreaterThan(0)
    abilities.forEach(ability => {
      expect(ability.type).toBe(MovementAbilityType.MOVEMENT)
    })
  })

  it('should return only DEFENSIVE type abilities', () => {
    const abilities = getMovementAbilitiesByType(MovementAbilityType.DEFENSIVE)
    expect(abilities.length).toBeGreaterThan(0)
    abilities.forEach(ability => {
      expect(ability.type).toBe(MovementAbilityType.DEFENSIVE)
    })
  })

  it('should return only OFFENSIVE type abilities', () => {
    const abilities = getMovementAbilitiesByType(MovementAbilityType.OFFENSIVE)
    expect(abilities.length).toBeGreaterThan(0)
    abilities.forEach(ability => {
      expect(ability.type).toBe(MovementAbilityType.OFFENSIVE)
    })
  })

  it('should return only TACTICAL type abilities', () => {
    const abilities = getMovementAbilitiesByType(MovementAbilityType.TACTICAL)
    expect(abilities.length).toBeGreaterThan(0)
    abilities.forEach(ability => {
      expect(ability.type).toBe(MovementAbilityType.TACTICAL)
    })
  })
})

describe('getMovementAbilitiesAtLevel', () => {
  it('should return 1 ability at level 1', () => {
    const abilities = getMovementAbilitiesAtLevel(1)
    expect(abilities).toHaveLength(1)
  })

  it('should return 5 abilities at level 5', () => {
    const abilities = getMovementAbilitiesAtLevel(5)
    expect(abilities).toHaveLength(5)
  })

  it('should return all 10 abilities at level 10', () => {
    const abilities = getMovementAbilitiesAtLevel(10)
    expect(abilities).toHaveLength(10)
  })

  it('should return 0 abilities at level 0', () => {
    const abilities = getMovementAbilitiesAtLevel(0)
    expect(abilities).toHaveLength(0)
  })

  it('should return abilities in correct unlock order', () => {
    const abilities = getMovementAbilitiesAtLevel(10)
    const unlockLevels = abilities.map(a => a.unlockLevel)

    // All should be <= 10
    unlockLevels.forEach(level => {
      expect(level).toBeLessThanOrEqual(10)
    })
  })
})

// ============================================================
// MOVEMENT CALCULATION TESTS
// ============================================================

describe('calculateMovementSpeed', () => {
  it('should return walk speed when idle', () => {
    const state = createDefaultMovementState()
    state.isGrounded = true
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.walkSpeed)
  })

  it('should return sprint speed when sprinting', () => {
    const state = createDefaultMovementState()
    state.isSprinting = true
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.sprintSpeed)
  })

  it('should return run speed when running', () => {
    const state = createDefaultMovementState()
    state.isRunning = true
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.runSpeed)
  })

  it('should return crouch speed when crouching', () => {
    const state = createDefaultMovementState()
    state.isCrouching = true
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.crouchSpeed)
  })

  it('should return slide speed when sliding', () => {
    const state = createDefaultMovementState()
    state.isSliding = true
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.slideSpeed)
  })

  it('should return wall run speed when wall running', () => {
    const state = createDefaultMovementState()
    state.isWallRunning = true
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.wallRunSpeed)
  })

  it('should apply speed multiplier correctly', () => {
    const state = createDefaultMovementState()
    state.isRunning = true
    const customSettings = { ...DEFAULT_MOVEMENT_SETTINGS, speedMultiplier: 2.0 }
    const speed = calculateMovementSpeed(state, customSettings)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.runSpeed * 2.0)
  })

  it('should apply boost correctly', () => {
    const state = createDefaultMovementState()
    state.currentBoost = 0.5
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.walkSpeed * 1.5)
  })

  it('should apply combo multiplier correctly', () => {
    const state = createDefaultMovementState()
    state.comboMultiplier = 1.0
    const speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.walkSpeed * 1.1) // 1 + 1.0 * 0.1
  })
})

// ============================================================
// STAMINA TESTS
// ============================================================

describe('hasEnoughStamina', () => {
  it('should return true when stamina is sufficient', () => {
    const result = hasEnoughStamina(50, 30, DEFAULT_MOVEMENT_SETTINGS)
    expect(result).toBe(true)
  })

  it('should return false when stamina is insufficient', () => {
    const result = hasEnoughStamina(20, 30, DEFAULT_MOVEMENT_SETTINGS)
    expect(result).toBe(false)
  })

  it('should account for stamina cost multiplier', () => {
    const customSettings = { ...DEFAULT_MOVEMENT_SETTINGS, staminaCostMultiplier: 2.0 }
    const result = hasEnoughStamina(50, 30, customSettings)
    expect(result).toBe(false) // 30 * 2.0 = 60, 50 < 60
  })

  it('should return true when stamina exactly matches cost', () => {
    const result = hasEnoughStamina(30, 30, DEFAULT_MOVEMENT_SETTINGS)
    expect(result).toBe(true)
  })
})

describe('calculateStaminaCost', () => {
  it('should return base cost with default multiplier', () => {
    const cost = calculateStaminaCost(30, DEFAULT_MOVEMENT_SETTINGS)
    expect(cost).toBe(30)
  })

  it('should apply stamina cost multiplier', () => {
    const customSettings = { ...DEFAULT_MOVEMENT_SETTINGS, staminaCostMultiplier: 0.5 }
    const cost = calculateStaminaCost(30, customSettings)
    expect(cost).toBe(15)
  })

  it('should handle zero cost', () => {
    const cost = calculateStaminaCost(0, DEFAULT_MOVEMENT_SETTINGS)
    expect(cost).toBe(0)
  })
})

// ============================================================
// ACTION VALIDATION TESTS
// ============================================================

describe('canPerformAction', () => {
  it('should allow actions when grounded', () => {
    const state = createDefaultMovementState()
    state.isGrounded = true
    expect(canPerformAction(state, 'jump')).toBe(true)
    expect(canPerformAction(state, 'sprint')).toBe(true)
    expect(canPerformAction(state, 'slide')).toBe(true)
  })

  it('should prevent actions while mantling', () => {
    const state = createDefaultMovementState()
    state.isMantling = true
    expect(canPerformAction(state, 'jump')).toBe(false)
  })

  it('should prevent actions while vaulting', () => {
    const state = createDefaultMovementState()
    state.isVaulting = true
    expect(canPerformAction(state, 'jump')).toBe(false)
  })

  it('should allow double jump when jumping but not already double jumping', () => {
    const state = createDefaultMovementState()
    state.isGrounded = false
    state.isJumping = true
    state.isDoubleJumping = false
    expect(canPerformAction(state, 'double_jump')).toBe(true)
  })

  it('should prevent double jump when already double jumping', () => {
    const state = createDefaultMovementState()
    state.isGrounded = false
    state.isJumping = true
    state.isDoubleJumping = true
    expect(canPerformAction(state, 'double_jump')).toBe(false)
  })

  it('should allow glide when air time is sufficient', () => {
    const state = createDefaultMovementState()
    state.isGrounded = false
    state.airTime = 1.0
    expect(canPerformAction(state, 'glide')).toBe(true)
  })

  it('should prevent glide when air time is insufficient', () => {
    const state = createDefaultMovementState()
    state.isGrounded = false
    state.airTime = 0.3
    expect(canPerformAction(state, 'glide')).toBe(false)
  })

  it('should always allow wall run/climb attempts', () => {
    const state = createDefaultMovementState()
    state.isGrounded = false
    expect(canPerformAction(state, 'wall_run')).toBe(true)
    expect(canPerformAction(state, 'wall_climb')).toBe(true)
  })
})

// ============================================================
// SETTINGS VALIDATION TESTS
// ============================================================

describe('validateMovementSettings', () => {
  it('should validate default settings as correct', () => {
    expect(validateMovementSettings(DEFAULT_MOVEMENT_SETTINGS)).toBe(true)
  })

  it('should reject invalid walk speed (zero or negative)', () => {
    const invalidSettings = { ...DEFAULT_MOVEMENT_SETTINGS, walkSpeed: 0 }
    expect(validateMovementSettings(invalidSettings)).toBe(false)
  })

  it('should reject run speed <= walk speed', () => {
    const invalidSettings = { ...DEFAULT_MOVEMENT_SETTINGS, runSpeed: 2.0, walkSpeed: 3.0 }
    expect(validateMovementSettings(invalidSettings)).toBe(false)
  })

  it('should reject invalid stamina values', () => {
    const invalidSettings = { ...DEFAULT_MOVEMENT_SETTINGS, maxStamina: -10 }
    expect(validateMovementSettings(invalidSettings)).toBe(false)
  })

  it('should reject negative stamina regen rate', () => {
    const invalidSettings = { ...DEFAULT_MOVEMENT_SETTINGS, staminaRegenRate: -5 }
    expect(validateMovementSettings(invalidSettings)).toBe(false)
  })

  it('should reject invalid jump force', () => {
    const invalidSettings = { ...DEFAULT_MOVEMENT_SETTINGS, jumpForce: 0 }
    expect(validateMovementSettings(invalidSettings)).toBe(false)
  })
})

// ============================================================
// DEFAULT STATE TESTS
// ============================================================

describe('createDefaultMovementState', () => {
  it('should create state with correct initial values', () => {
    const state = createDefaultMovementState()

    expect(state.currentState).toBe(MovementState.IDLE)
    expect(state.previousState).toBe(MovementState.IDLE)
    expect(state.isGrounded).toBe(true)
    expect(state.stamina).toBe(DEFAULT_MOVEMENT_SETTINGS.maxStamina)
    expect(state.maxStamina).toBe(DEFAULT_MOVEMENT_SETTINGS.maxStamina)
  })

  it('should initialize all boolean flags as false except isGrounded', () => {
    const state = createDefaultMovementState()

    expect(state.isRunning).toBe(false)
    expect(state.isSprinting).toBe(false)
    expect(state.isCrouching).toBe(false)
    expect(state.isSliding).toBe(false)
    expect(state.isJumping).toBe(false)
    expect(state.isDoubleJumping).toBe(false)
    expect(state.isWallRunning).toBe(false)
    expect(state.isWallClimbing).toBe(false)
    expect(state.isMantling).toBe(false)
    expect(state.isVaulting).toBe(false)
    expect(state.isGliding).toBe(false)
  })

  it('should initialize vectors correctly', () => {
    const state = createDefaultMovementState()

    expect(state.moveDirection).toBeInstanceOf(THREE.Vector3)
    expect(state.velocity).toBeInstanceOf(THREE.Vector3)
    expect(state.moveDirection.length()).toBe(0)
    expect(state.velocity.length()).toBe(0)
  })

  it('should initialize progress indicators to 0', () => {
    const state = createDefaultMovementState()

    expect(state.mantleProgress).toBe(0)
    expect(state.vaultProgress).toBe(0)
  })

  it('should initialize targets as null', () => {
    const state = createDefaultMovementState()

    expect(state.coverTarget).toBeNull()
    expect(state.breachTarget).toBeNull()
    expect(state.wallTarget).toBeNull()
  })
})

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('Movement System Integration', () => {
  it('should handle sprint to slide transition', () => {
    const state = createDefaultMovementState()
    state.isSprinting = true
    state.stamina = 100

    // Check sprint speed
    let speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.sprintSpeed)

    // Transition to slide
    state.isSprinting = false
    state.isSliding = true

    // Check slide speed
    speed = calculateMovementSpeed(state, DEFAULT_MOVEMENT_SETTINGS)
    expect(speed).toBe(DEFAULT_MOVEMENT_SETTINGS.slideSpeed)

    // Verify stamina was consumed
    const slideCost = calculateStaminaCost(
      DEFAULT_MOVEMENT_SETTINGS.slideStaminaCost,
      DEFAULT_MOVEMENT_SETTINGS
    )
    expect(slideCost).toBe(DEFAULT_MOVEMENT_SETTINGS.slideStaminaCost)
  })

  it('should handle ability unlock progression', () => {
    // Level 1 player
    let abilities = getMovementAbilitiesAtLevel(1)
    expect(abilities).toHaveLength(1)
    expect(abilities[0].id).toBe('enhanced_sprint')

    // Level 5 player
    abilities = getMovementAbilitiesAtLevel(5)
    expect(abilities).toHaveLength(5)

    // Level 10 player (max)
    abilities = getMovementAbilitiesAtLevel(10)
    expect(abilities).toHaveLength(10)
  })

  it('should handle stamina depletion and regeneration', () => {
    const state = createDefaultMovementState()
    const initialStamina = state.stamina

    // Sprint for 5 seconds
    const sprintCost = DEFAULT_MOVEMENT_SETTINGS.sprintStaminaCost * 5
    state.stamina -= sprintCost

    expect(state.stamina).toBeLessThan(initialStamina)
    expect(state.stamina).toBeGreaterThanOrEqual(0)

    // Regenerate for 5 seconds
    const regenAmount = DEFAULT_MOVEMENT_SETTINGS.staminaRegenRate * 5
    state.stamina = Math.min(state.maxStamina, state.stamina + regenAmount)

    expect(state.stamina).toBeLessThanOrEqual(state.maxStamina)
  })
})
