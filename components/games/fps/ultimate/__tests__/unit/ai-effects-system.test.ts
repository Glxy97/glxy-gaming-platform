/**
 * 🧪 AI & EFFECTS SYSTEM TESTS
 * Comprehensive unit tests for AI and Visual Effects Data
 *
 * @remarks
 * Tests for AIData.ts and EffectsData.ts (Phase 3)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'

// AI Data Imports
import {
  AIState,
  AIPersonalityData,
  AIDifficultyData,
  AIBotStateData,
  MovementPattern,
  CombatStyle,
  AI_PERSONALITIES,
  AI_DIFFICULTIES,
  AI_VOICE_PROFILES,
  DEFAULT_AI_SETTINGS,
  calculateEffectiveAccuracy,
  calculateEffectiveReactionTime,
  calculateTacticalScore,
  selectBestCover,
  shouldTakeCover,
  shouldReload,
  shouldCallForBackup,
  shouldFlank,
  predictPlayerPosition,
  calculateThreatLevel,
  getPersonalityById,
  getDifficultyById,
  validateAISettings
} from '../../ai/data/AIData'

// Effects Data Imports
import {
  EffectType,
  ParticleShape,
  EmitterShape,
  ParticleBlendMode,
  EffectQuality,
  ParticleSystemData,
  VisualEffectData,
  ParticleInstance,
  MUZZLE_FLASH_EFFECT,
  BLOOD_SPLATTER_EFFECT,
  EXPLOSION_EFFECT,
  EFFECT_CATALOG,
  DEFAULT_EFFECT_QUALITY,
  DEFAULT_PARTICLE_SETTINGS,
  getEffectById,
  getEffectsByType,
  getEffectsByCategory,
  calculateParticleCount,
  calculateLODLevel,
  shouldCullEffect,
  interpolateColor,
  interpolateValue,
  applyEasing,
  createParticle,
  updateParticle,
  validateEffectData
} from '../../effects/data/EffectsData'

// ============================================================
// AI DATA TESTS
// ============================================================

describe('AI Personalities Catalog', () => {
  it('should have 6 AI personalities defined', () => {
    expect(AI_PERSONALITIES).toHaveLength(6)
  })

  it('should have unique personality IDs', () => {
    const ids = AI_PERSONALITIES.map(p => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have all personalities with valid stats (0-100)', () => {
    AI_PERSONALITIES.forEach(personality => {
      expect(personality.aggressiveness).toBeGreaterThanOrEqual(0)
      expect(personality.aggressiveness).toBeLessThanOrEqual(100)
      expect(personality.accuracy).toBeGreaterThanOrEqual(0)
      expect(personality.accuracy).toBeLessThanOrEqual(100)
      expect(personality.tacticalThinking).toBeGreaterThanOrEqual(0)
      expect(personality.tacticalThinking).toBeLessThanOrEqual(100)
      expect(personality.teamCoordination).toBeGreaterThanOrEqual(0)
      expect(personality.teamCoordination).toBeLessThanOrEqual(100)
      expect(personality.learningRate).toBeGreaterThanOrEqual(0)
      expect(personality.learningRate).toBeLessThanOrEqual(100)
    })
  })

  it('should have aggressive assault personality with high aggressiveness', () => {
    const aggressive = getPersonalityById('aggressive_assault')
    expect(aggressive).toBeDefined()
    expect(aggressive!.aggressiveness).toBeGreaterThan(80)
  })

  it('should have tactical sniper personality with high accuracy', () => {
    const sniper = getPersonalityById('tactical_sniper')
    expect(sniper).toBeDefined()
    expect(sniper!.accuracy).toBeGreaterThan(85)
  })

  it('should have support medic personality with high team coordination', () => {
    const medic = getPersonalityById('support_medic')
    expect(medic).toBeDefined()
    expect(medic!.teamCoordination).toBeGreaterThan(85)
  })
})

describe('AI Difficulties', () => {
  it('should have 5 difficulty levels defined', () => {
    expect(AI_DIFFICULTIES).toHaveLength(5)
  })

  it('should have unique difficulty IDs', () => {
    const ids = AI_DIFFICULTIES.map(d => d.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have difficulties ordered from easiest to hardest', () => {
    expect(AI_DIFFICULTIES[0].id).toBe('recruit')
    expect(AI_DIFFICULTIES[4].id).toBe('nightmare')
  })

  it('should have nightmare difficulty with highest multipliers', () => {
    const nightmare = getDifficultyById('nightmare')
    expect(nightmare).toBeDefined()
    expect(nightmare!.healthMultiplier).toBeGreaterThan(1.0)
    expect(nightmare!.damageMultiplier).toBeGreaterThan(1.0)
    expect(nightmare!.accuracyBonus).toBeGreaterThan(0)
  })

  it('should have recruit difficulty with reduced multipliers', () => {
    const recruit = getDifficultyById('recruit')
    expect(recruit).toBeDefined()
    expect(recruit!.healthMultiplier).toBeLessThan(1.0)
    expect(recruit!.damageMultiplier).toBeLessThan(1.0)
    expect(recruit!.accuracyBonus).toBeLessThan(0)
  })
})

describe('calculateEffectiveAccuracy', () => {
  it('should increase accuracy with difficulty bonus', () => {
    const baseAccuracy = 50
    const difficulty = getDifficultyById('veteran')!
    const effectiveAccuracy = calculateEffectiveAccuracy(baseAccuracy, difficulty)
    expect(effectiveAccuracy).toBeGreaterThan(baseAccuracy)
  })

  it('should decrease accuracy with difficulty penalty', () => {
    const baseAccuracy = 50
    const difficulty = getDifficultyById('recruit')!
    const effectiveAccuracy = calculateEffectiveAccuracy(baseAccuracy, difficulty)
    expect(effectiveAccuracy).toBeLessThan(baseAccuracy)
  })

  it('should clamp accuracy between 0 and 100', () => {
    const difficulty = getDifficultyById('nightmare')!
    const lowAccuracy = calculateEffectiveAccuracy(0, difficulty)
    const highAccuracy = calculateEffectiveAccuracy(100, difficulty)
    expect(lowAccuracy).toBeGreaterThanOrEqual(0)
    expect(highAccuracy).toBeLessThanOrEqual(100)
  })
})

describe('calculateEffectiveReactionTime', () => {
  it('should increase reaction time for easier difficulties', () => {
    const baseReactionTime = 200
    const difficulty = getDifficultyById('recruit')!
    const effectiveReactionTime = calculateEffectiveReactionTime(baseReactionTime, difficulty)
    expect(effectiveReactionTime).toBeGreaterThan(baseReactionTime)
  })

  it('should decrease reaction time for harder difficulties', () => {
    const baseReactionTime = 200
    const difficulty = getDifficultyById('nightmare')!
    const effectiveReactionTime = calculateEffectiveReactionTime(baseReactionTime, difficulty)
    expect(effectiveReactionTime).toBeLessThan(baseReactionTime)
  })
})

describe('calculateTacticalScore', () => {
  it('should give higher score for positions closer to cover', () => {
    const position = new THREE.Vector3(0, 0, 0)
    const enemyPosition = new THREE.Vector3(10, 0, 0)
    const coverPositions = [
      new THREE.Vector3(2, 0, 0),
      new THREE.Vector3(20, 0, 0)
    ]

    const score = calculateTacticalScore(position, enemyPosition, coverPositions)
    expect(score).toBeGreaterThan(0)
  })

  it('should give higher score for elevated positions', () => {
    const lowPosition = new THREE.Vector3(0, 0, 0)
    const highPosition = new THREE.Vector3(0, 5, 0)
    const enemyPosition = new THREE.Vector3(10, 0, 0)
    const coverPositions: THREE.Vector3[] = []

    const lowScore = calculateTacticalScore(lowPosition, enemyPosition, coverPositions)
    const highScore = calculateTacticalScore(highPosition, enemyPosition, coverPositions)
    expect(highScore).toBeGreaterThan(lowScore)
  })
})

describe('selectBestCover', () => {
  it('should select cover closest to bot position', () => {
    const botPosition = new THREE.Vector3(0, 0, 0)
    const enemyPosition = new THREE.Vector3(10, 0, 0)
    const coverPositions = [
      new THREE.Vector3(2, 0, 0),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(8, 0, 0)
    ]

    const bestCover = selectBestCover(botPosition, enemyPosition, coverPositions)
    expect(bestCover).toBeDefined()
    expect(bestCover!.distanceTo(botPosition)).toBeLessThan(3)
  })

  it('should return null if no cover positions provided', () => {
    const botPosition = new THREE.Vector3(0, 0, 0)
    const enemyPosition = new THREE.Vector3(10, 0, 0)
    const coverPositions: THREE.Vector3[] = []

    const bestCover = selectBestCover(botPosition, enemyPosition, coverPositions)
    expect(bestCover).toBeNull()
  })
})

describe('shouldTakeCover', () => {
  it('should take cover when health is low', () => {
    expect(shouldTakeCover(20, 100, true, 10)).toBe(true)
  })

  it('should take cover when under fire', () => {
    expect(shouldTakeCover(80, 100, true, 10)).toBe(true)
  })

  it('should not take cover when health is high and not under fire', () => {
    expect(shouldTakeCover(90, 100, false, 10)).toBe(false)
  })
})

describe('shouldReload', () => {
  it('should reload when ammo is low', () => {
    expect(shouldReload(2, 30, false)).toBe(true)
  })

  it('should reload when ammo is zero', () => {
    expect(shouldReload(0, 30, false)).toBe(true)
  })

  it('should not reload when in combat with sufficient ammo', () => {
    expect(shouldReload(20, 30, true)).toBe(false)
  })
})

describe('shouldCallForBackup', () => {
  it('should call for backup when outnumbered', () => {
    expect(shouldCallForBackup(50, 100, 1, 3, 2)).toBe(true)
  })

  it('should call for backup when health is critical', () => {
    expect(shouldCallForBackup(15, 100, 2, 2, 2)).toBe(true)
  })

  it('should not call for backup when advantage is clear', () => {
    expect(shouldCallForBackup(90, 100, 3, 1, 2)).toBe(false)
  })
})

describe('shouldFlank', () => {
  it('should flank when enemy is stationary', () => {
    const personality = getPersonalityById('flanker_assassin')!
    expect(shouldFlank(personality, 3000, true, true)).toBe(true)
  })

  it('should not flank with low tactical thinking', () => {
    const personality = getPersonalityById('aggressive_assault')!
    expect(shouldFlank(personality, 3000, true, true)).toBe(false)
  })

  it('should not flank when enemy is mobile', () => {
    const personality = getPersonalityById('flanker_assassin')!
    expect(shouldFlank(personality, 1000, false, true)).toBe(false)
  })
})

describe('predictPlayerPosition', () => {
  it('should predict position based on velocity', () => {
    const currentPosition = new THREE.Vector3(0, 0, 0)
    const velocity = new THREE.Vector3(5, 0, 0)
    const predictedPosition = predictPlayerPosition(currentPosition, velocity, 1.0)

    expect(predictedPosition.x).toBeCloseTo(5.0)
    expect(predictedPosition.y).toBeCloseTo(0.0)
    expect(predictedPosition.z).toBeCloseTo(0.0)
  })

  it('should account for time in prediction', () => {
    const currentPosition = new THREE.Vector3(0, 0, 0)
    const velocity = new THREE.Vector3(5, 0, 0)
    const predictedPosition = predictPlayerPosition(currentPosition, velocity, 2.0)

    expect(predictedPosition.x).toBeCloseTo(10.0)
  })
})

describe('calculateThreatLevel', () => {
  it('should calculate higher threat for close distance', () => {
    const threat1 = calculateThreatLevel(5, 100, true, 'shotgun')
    const threat2 = calculateThreatLevel(50, 100, true, 'shotgun')
    expect(threat1).toBeGreaterThan(threat2)
  })

  it('should calculate higher threat when enemy is aiming', () => {
    const threatAiming = calculateThreatLevel(20, 100, true, 'rifle')
    const threatNotAiming = calculateThreatLevel(20, 100, false, 'rifle')
    expect(threatAiming).toBeGreaterThan(threatNotAiming)
  })

  it('should calculate higher threat for high-damage weapons', () => {
    const sniperThreat = calculateThreatLevel(30, 100, true, 'sniper')
    const pistolThreat = calculateThreatLevel(30, 100, true, 'pistol')
    expect(sniperThreat).toBeGreaterThan(pistolThreat)
  })
})

describe('AI Voice Profiles', () => {
  it('should have voice profiles defined', () => {
    expect(AI_VOICE_PROFILES.length).toBeGreaterThan(0)
  })

  it('should have male soldier voice profile', () => {
    const maleSoldier = AI_VOICE_PROFILES.find(v => v.id === 'male_soldier')
    expect(maleSoldier).toBeDefined()
    expect(maleSoldier!.gender).toBe('male')
  })

  it('should have responses for key events', () => {
    const maleSoldier = AI_VOICE_PROFILES.find(v => v.id === 'male_soldier')
    expect(maleSoldier!.responses.enemy_spotted).toBeDefined()
    expect(maleSoldier!.responses.taking_damage).toBeDefined()
    expect(maleSoldier!.responses.reloading).toBeDefined()
  })
})

describe('validateAISettings', () => {
  it('should validate correct settings', () => {
    expect(validateAISettings(DEFAULT_AI_SETTINGS)).toBe(true)
  })

  it('should reject invalid update rate', () => {
    const invalidSettings = { ...DEFAULT_AI_SETTINGS, updateRate: 0 }
    expect(validateAISettings(invalidSettings)).toBe(false)
  })

  it('should reject invalid max active bots', () => {
    const invalidSettings = { ...DEFAULT_AI_SETTINGS, maxActiveBots: -1 }
    expect(validateAISettings(invalidSettings)).toBe(false)
  })
})

// ============================================================
// EFFECTS DATA TESTS
// ============================================================

describe('Effect Catalog', () => {
  it('should have effect presets defined', () => {
    expect(EFFECT_CATALOG.length).toBeGreaterThan(0)
  })

  it('should have muzzle flash effect', () => {
    const effect = getEffectById('muzzle_flash')
    expect(effect).toBeDefined()
    expect(effect!.effectType).toBe(EffectType.MUZZLE_FLASH)
  })

  it('should have blood splatter effect', () => {
    const effect = getEffectById('blood_splatter')
    expect(effect).toBeDefined()
    expect(effect!.effectType).toBe(EffectType.BLOOD_SPLATTER)
  })

  it('should have explosion effect', () => {
    const effect = getEffectById('explosion')
    expect(effect).toBeDefined()
    expect(effect!.effectType).toBe(EffectType.EXPLOSION)
  })
})

describe('Muzzle Flash Effect', () => {
  it('should have correct particle systems', () => {
    expect(MUZZLE_FLASH_EFFECT.particleSystems.length).toBeGreaterThan(0)
  })

  it('should have core flash particles', () => {
    const coreSystem = MUZZLE_FLASH_EFFECT.particleSystems.find(
      ps => ps.id === 'muzzle_flash_core'
    )
    expect(coreSystem).toBeDefined()
    expect(coreSystem!.blendMode).toBe(ParticleBlendMode.ADDITIVE)
  })

  it('should have smoke particles', () => {
    const smokeSystem = MUZZLE_FLASH_EFFECT.particleSystems.find(
      ps => ps.id === 'muzzle_smoke'
    )
    expect(smokeSystem).toBeDefined()
  })

  it('should have light effect', () => {
    expect(MUZZLE_FLASH_EFFECT.lights.length).toBeGreaterThan(0)
  })

  it('should have short duration', () => {
    expect(MUZZLE_FLASH_EFFECT.duration).toBeLessThan(1000)
  })
})

describe('Blood Splatter Effect', () => {
  it('should have particle system with gravity', () => {
    const bloodSystem = BLOOD_SPLATTER_EFFECT.particleSystems[0]
    expect(bloodSystem.gravity.y).toBeLessThan(0)
  })

  it('should have collision enabled', () => {
    const bloodSystem = BLOOD_SPLATTER_EFFECT.particleSystems[0]
    expect(bloodSystem.collisionEnabled).toBe(true)
  })

  it('should use red color', () => {
    const bloodSystem = BLOOD_SPLATTER_EFFECT.particleSystems[0]
    expect(bloodSystem.startColor.r).toBeGreaterThan(0.5)
    expect(bloodSystem.startColor.g).toBeLessThan(0.1)
  })
})

describe('Explosion Effect', () => {
  it('should have multiple particle systems', () => {
    expect(EXPLOSION_EFFECT.particleSystems.length).toBeGreaterThanOrEqual(3)
  })

  it('should have fireball particles', () => {
    const fireball = EXPLOSION_EFFECT.particleSystems.find(
      ps => ps.id === 'explosion_fireball'
    )
    expect(fireball).toBeDefined()
    expect(fireball!.lightEmission).toBeGreaterThan(0)
  })

  it('should have smoke particles', () => {
    const smoke = EXPLOSION_EFFECT.particleSystems.find(
      ps => ps.id === 'explosion_smoke'
    )
    expect(smoke).toBeDefined()
  })

  it('should have debris particles', () => {
    const debris = EXPLOSION_EFFECT.particleSystems.find(
      ps => ps.id === 'explosion_debris'
    )
    expect(debris).toBeDefined()
    expect(debris!.castShadows).toBe(true)
  })

  it('should have camera shake', () => {
    expect(EXPLOSION_EFFECT.cameraShake).toBeDefined()
    expect(EXPLOSION_EFFECT.cameraShake!.intensity).toBeGreaterThan(0)
  })

  it('should have post-processing effects', () => {
    expect(EXPLOSION_EFFECT.postProcessing.length).toBeGreaterThan(0)
  })

  it('should have mesh effects (shockwave)', () => {
    expect(EXPLOSION_EFFECT.meshEffects.length).toBeGreaterThan(0)
    const shockwave = EXPLOSION_EFFECT.meshEffects.find(m => m.type === 'shockwave')
    expect(shockwave).toBeDefined()
  })
})

describe('getEffectsByType', () => {
  it('should return effects by type', () => {
    const explosions = getEffectsByType(EffectType.EXPLOSION)
    expect(explosions.length).toBeGreaterThan(0)
    explosions.forEach(effect => {
      expect(effect.effectType).toBe(EffectType.EXPLOSION)
    })
  })
})

describe('getEffectsByCategory', () => {
  it('should return effects by category', () => {
    const weaponEffects = getEffectsByCategory('weapon')
    expect(weaponEffects.length).toBeGreaterThan(0)
    weaponEffects.forEach(effect => {
      expect(effect.category).toBe('weapon')
    })
  })
})

describe('calculateParticleCount', () => {
  it('should reduce particle count for low quality', () => {
    const baseCount = 100
    const lowCount = calculateParticleCount(baseCount, EffectQuality.LOW)
    expect(lowCount).toBeLessThan(baseCount)
  })

  it('should maintain particle count for high quality', () => {
    const baseCount = 100
    const highCount = calculateParticleCount(baseCount, EffectQuality.HIGH)
    expect(highCount).toBe(baseCount)
  })

  it('should increase particle count for ultra quality', () => {
    const baseCount = 100
    const ultraCount = calculateParticleCount(baseCount, EffectQuality.ULTRA)
    expect(ultraCount).toBeGreaterThan(baseCount)
  })
})

describe('calculateLODLevel', () => {
  it('should return LOD 0 for close distance', () => {
    const lod = calculateLODLevel(10, [25, 50, 75])
    expect(lod).toBe(0)
  })

  it('should return higher LOD for far distance', () => {
    const lod = calculateLODLevel(60, [25, 50, 75])
    expect(lod).toBe(2)
  })

  it('should return max LOD for very far distance', () => {
    const lod = calculateLODLevel(100, [25, 50, 75])
    expect(lod).toBe(3)
  })
})

describe('shouldCullEffect', () => {
  it('should cull effect beyond max distance', () => {
    const effectPos = new THREE.Vector3(0, 0, 0)
    const cameraPos = new THREE.Vector3(150, 0, 0)
    expect(shouldCullEffect(effectPos, cameraPos, 100)).toBe(true)
  })

  it('should not cull effect within max distance', () => {
    const effectPos = new THREE.Vector3(0, 0, 0)
    const cameraPos = new THREE.Vector3(50, 0, 0)
    expect(shouldCullEffect(effectPos, cameraPos, 100)).toBe(false)
  })
})

describe('interpolateColor', () => {
  it('should interpolate between two colors', () => {
    const colors = [
      new THREE.Color(1, 0, 0),
      new THREE.Color(0, 1, 0)
    ]
    const result = interpolateColor(colors, 0.5)
    expect(result.r).toBeCloseTo(0.5)
    expect(result.g).toBeCloseTo(0.5)
    expect(result.b).toBeCloseTo(0.0)
  })

  it('should return start color at 0', () => {
    const colors = [
      new THREE.Color(1, 0, 0),
      new THREE.Color(0, 1, 0)
    ]
    const result = interpolateColor(colors, 0)
    expect(result.r).toBeCloseTo(1.0)
    expect(result.g).toBeCloseTo(0.0)
  })

  it('should return end color at 1', () => {
    const colors = [
      new THREE.Color(1, 0, 0),
      new THREE.Color(0, 1, 0)
    ]
    const result = interpolateColor(colors, 1)
    expect(result.g).toBeGreaterThan(0.5)
  })
})

describe('interpolateValue', () => {
  it('should interpolate between values', () => {
    const values = [0, 100]
    expect(interpolateValue(values, 0.5)).toBeCloseTo(50)
  })

  it('should return start value at 0', () => {
    const values = [10, 20]
    expect(interpolateValue(values, 0)).toBeCloseTo(10)
  })

  it('should return end value at 1', () => {
    const values = [10, 20]
    expect(interpolateValue(values, 1)).toBeCloseTo(20)
  })

  it('should handle multiple keyframes', () => {
    const values = [0, 50, 100]
    expect(interpolateValue(values, 0.5)).toBeCloseTo(50)
  })
})

describe('applyEasing', () => {
  it('should apply linear easing', () => {
    expect(applyEasing(0.5, 'linear')).toBeCloseTo(0.5)
  })

  it('should apply ease-in', () => {
    const result = applyEasing(0.5, 'ease-in')
    expect(result).toBeLessThan(0.5)
  })

  it('should apply ease-out', () => {
    const result = applyEasing(0.5, 'ease-out')
    expect(result).toBeGreaterThan(0.5)
  })

  it('should return 0 at start and 1 at end for all easings', () => {
    const easings: Array<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'> =
      ['linear', 'ease-in', 'ease-out', 'ease-in-out']

    easings.forEach(easing => {
      expect(applyEasing(0, easing)).toBeCloseTo(0)
      expect(applyEasing(1, easing)).toBeCloseTo(1)
    })
  })
})

describe('createParticle', () => {
  it('should create particle with system properties', () => {
    const system = MUZZLE_FLASH_EFFECT.particleSystems[0]
    const position = new THREE.Vector3(0, 0, 0)
    const particle = createParticle(system, position)

    expect(particle.isAlive).toBe(true)
    expect(particle.age).toBe(0)
    expect(particle.position).toBeDefined()
    expect(particle.velocity).toBeDefined()
    expect(particle.color).toBeDefined()
  })

  it('should apply size variation', () => {
    const system = MUZZLE_FLASH_EFFECT.particleSystems[0]
    const position = new THREE.Vector3(0, 0, 0)

    const particles = Array.from({ length: 10 }, () => createParticle(system, position))
    const sizes = particles.map(p => p.size)
    const uniqueSizes = new Set(sizes)

    // Should have some variation
    expect(uniqueSizes.size).toBeGreaterThan(1)
  })
})

describe('updateParticle', () => {
  let particle: ParticleInstance
  let system: ParticleSystemData

  beforeEach(() => {
    system = MUZZLE_FLASH_EFFECT.particleSystems[0]
    const position = new THREE.Vector3(0, 0, 0)
    particle = createParticle(system, position)
  })

  it('should update particle age', () => {
    const initialAge = particle.age
    updateParticle(particle, system, 0.016)
    expect(particle.age).toBeGreaterThan(initialAge)
  })

  it('should update particle position based on velocity', () => {
    const initialPos = particle.position.clone()
    updateParticle(particle, system, 0.016)
    expect(particle.position.distanceTo(initialPos)).toBeGreaterThan(0)
  })

  it('should kill particle after lifetime', () => {
    particle.age = particle.lifetime - 1
    updateParticle(particle, system, 0.002)
    expect(particle.isAlive).toBe(false)
  })

  it('should update particle color over lifetime', () => {
    const initialColor = particle.color.clone()
    particle.age = particle.lifetime * 0.5
    updateParticle(particle, system, 0.016)
    // Color should change towards end color
    expect(particle.color.equals(initialColor)).toBe(false)
  })

  it('should update particle opacity over lifetime', () => {
    const initialOpacity = particle.opacity
    particle.age = particle.lifetime * 0.5
    updateParticle(particle, system, 0.016)
    expect(particle.opacity).not.toBe(initialOpacity)
  })
})

describe('validateEffectData', () => {
  it('should validate correct effect data', () => {
    expect(validateEffectData(MUZZLE_FLASH_EFFECT)).toBe(true)
    expect(validateEffectData(EXPLOSION_EFFECT)).toBe(true)
  })

  it('should reject effect without ID', () => {
    const invalidEffect = { ...MUZZLE_FLASH_EFFECT, id: '' }
    expect(validateEffectData(invalidEffect)).toBe(false)
  })

  it('should reject effect with invalid duration', () => {
    const invalidEffect = { ...MUZZLE_FLASH_EFFECT, duration: 0 }
    expect(validateEffectData(invalidEffect)).toBe(false)
  })
})

describe('Effect Quality Settings', () => {
  it('should have quality settings for all levels', () => {
    const qualities: EffectQuality[] = [
      EffectQuality.LOW,
      EffectQuality.MEDIUM,
      EffectQuality.HIGH,
      EffectQuality.ULTRA
    ]

    qualities.forEach(quality => {
      expect(EXPLOSION_EFFECT.qualitySettings[quality]).toBeDefined()
    })
  })

  it('should scale particle count by quality', () => {
    const lowSettings = EXPLOSION_EFFECT.qualitySettings[EffectQuality.LOW]
    const ultraSettings = EXPLOSION_EFFECT.qualitySettings[EffectQuality.ULTRA]

    expect(ultraSettings.particleMultiplier).toBeGreaterThan(lowSettings.particleMultiplier)
    expect(ultraSettings.maxParticlesPerSystem).toBeGreaterThan(lowSettings.maxParticlesPerSystem)
  })

  it('should disable features for low quality', () => {
    const lowSettings = EXPLOSION_EFFECT.qualitySettings[EffectQuality.LOW]
    expect(lowSettings.enablePostProcessing).toBe(false)
  })

  it('should enable all features for ultra quality', () => {
    const ultraSettings = EXPLOSION_EFFECT.qualitySettings[EffectQuality.ULTRA]
    expect(ultraSettings.enableLights).toBe(true)
    expect(ultraSettings.enablePostProcessing).toBe(true)
    expect(ultraSettings.enableMeshEffects).toBe(true)
  })
})
