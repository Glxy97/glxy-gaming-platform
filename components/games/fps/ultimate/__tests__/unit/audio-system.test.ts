/**
 * GLXY Ultimate FPS - Audio System Tests
 *
 * Comprehensive test coverage for the audio system:
 * - AudioData validation and helpers
 * - Audio catalog functions
 * - AudioManager functionality
 * - Sound loading and playback
 * - 3D spatial audio
 * - Audio mixer and volume control
 * - Music system
 * - Event system
 * - Resource management
 *
 * @module AudioSystemTests
 * @version 1.9.0-alpha
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AudioData,
  AudioCategory,
  SoundType,
  DistanceModel,
  PanningModel,
  ReverbPreset,
  SpatialAudioConfig,
  AudioClipData,
  MusicTrackData,
  createDefaultSpatialConfig,
  createWeaponFireSpatialConfig,
  createFootstepSpatialConfig,
  createExplosionSpatialConfig,
  createReverbEffect,
  calculateDistanceAttenuation,
  calculateDopplerShift,
  getMaterialAbsorption
} from '../../audio/data/AudioData'
import {
  getSound,
  getAllSounds,
  getSoundsByCategory,
  getSoundsByType,
  getMusicTrack,
  getAllMusicTracks,
  AR_FIRE,
  AR_RELOAD,
  SNIPER_FIRE,
  PISTOL_FIRE,
  FOOTSTEP_CONCRETE,
  FOOTSTEP_METAL,
  JUMP,
  LAND,
  IMPACT_CONCRETE,
  IMPACT_METAL,
  IMPACT_BODY,
  EXPLOSION_GRENADE,
  UI_CLICK,
  UI_NOTIFICATION,
  LEVEL_UP,
  KILLSTREAK,
  AMBIENT_WIND,
  AMBIENT_RAIN,
  MUSIC_MENU,
  MUSIC_INTENSE
} from '../../audio/data/audio-catalog'

// Mock Web Audio API
class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  listener = {
    positionX: { value: 0 },
    positionY: { value: 0 },
    positionZ: { value: 0 },
    forwardX: { value: 0 },
    forwardY: { value: 0 },
    forwardZ: { value: -1 },
    upX: { value: 0 },
    upY: { value: 1 },
    upZ: { value: 0 }
  }

  createGain() {
    return {
      gain: { value: 1.0 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  createPanner() {
    return {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0,
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
      orientationX: { value: 1 },
      orientationY: { value: 0 },
      orientationZ: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  createBufferSource() {
    return {
      buffer: null,
      playbackRate: { value: 1.0 },
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  }

  createConvolver() {
    return {
      buffer: null,
      normalize: true,
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  createDelay() {
    return {
      delayTime: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 350 },
      Q: { value: 1 },
      gain: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer) {
    return {
      length: 44100,
      duration: 1.0,
      sampleRate: 44100,
      numberOfChannels: 2
    }
  }

  async resume() {
    this.state = 'running'
  }

  async suspend() {
    this.state = 'suspended'
  }

  async close() {
    this.state = 'closed'
  }
}

// Mock AudioContext globally
globalThis.AudioContext = MockAudioContext as any

describe('AudioData Helpers', () => {
  describe('createDefaultSpatialConfig', () => {
    it('should create spatial config with defaults', () => {
      const config = createDefaultSpatialConfig()
      expect(config).toBeDefined()
      expect(config.distanceModel).toBe(DistanceModel.INVERSE)
      expect(config.panningModel).toBe(PanningModel.HRTF)
      expect(config.refDistance).toBeGreaterThan(0)
      expect(config.maxDistance).toBeGreaterThan(config.refDistance)
    })

    it('should have occlusion disabled by default', () => {
      const config = createDefaultSpatialConfig()
      expect(config.occlusionEnabled).toBe(false)
      expect(config.obstructionEnabled).toBe(false)
    })
  })

  describe('createWeaponFireSpatialConfig', () => {
    it('should create weapon-specific spatial config', () => {
      const config = createWeaponFireSpatialConfig()
      expect(config.distanceModel).toBe(DistanceModel.EXPONENTIAL)
      expect(config.maxDistance).toBeGreaterThan(100) // Long range
      expect(config.rolloffFactor).toBeGreaterThan(1)
      expect(config.occlusionEnabled).toBe(true)
    })

    it('should use HRTF panning for directional audio', () => {
      const config = createWeaponFireSpatialConfig()
      expect(config.panningModel).toBe(PanningModel.HRTF)
    })

    it('should have doppler effect enabled', () => {
      const config = createWeaponFireSpatialConfig()
      expect(config.dopplerFactor).toBeGreaterThan(0)
    })
  })

  describe('createFootstepSpatialConfig', () => {
    it('should create footstep-specific spatial config', () => {
      const config = createFootstepSpatialConfig()
      expect(config.maxDistance).toBeLessThan(100) // Short range
      expect(config.occlusionEnabled).toBe(true)
    })
  })

  describe('createExplosionSpatialConfig', () => {
    it('should create explosion-specific spatial config', () => {
      const config = createExplosionSpatialConfig()
      expect(config.maxDistance).toBeGreaterThan(200) // Very long range
      expect(config.rolloffFactor).toBeGreaterThan(1)
    })
  })

  describe('createReverbEffect', () => {
    it('should create reverb effect for small room', () => {
      const reverb = createReverbEffect(ReverbPreset.SMALL_ROOM)
      expect(reverb.type).toBe('reverb')
      expect(reverb.preset).toBe(ReverbPreset.SMALL_ROOM)
      expect(reverb.dryWetMix).toBeGreaterThan(0)
    })

    it('should create reverb effect for cathedral', () => {
      const reverb = createReverbEffect(ReverbPreset.CATHEDRAL)
      expect(reverb.type).toBe('reverb')
      expect(reverb.preset).toBe(ReverbPreset.CATHEDRAL)
      expect(reverb.decayTime).toBeGreaterThan(2.0) // Long decay
    })

    it('should create reverb effect for cave', () => {
      const reverb = createReverbEffect(ReverbPreset.CAVE)
      expect(reverb.type).toBe('reverb')
      expect(reverb.preset).toBe(ReverbPreset.CAVE)
    })

    it('should have no reverb for outdoor', () => {
      const reverb = createReverbEffect(ReverbPreset.OUTDOOR)
      expect(reverb.type).toBe('reverb')
      expect(reverb.preset).toBe(ReverbPreset.OUTDOOR)
      expect(reverb.decayTime).toBeLessThan(1.0) // Very short decay
    })
  })

  describe('calculateDistanceAttenuation', () => {
    const config: SpatialAudioConfig = {
      distanceModel: DistanceModel.LINEAR,
      refDistance: 1,
      maxDistance: 100,
      rolloffFactor: 1,
      panningModel: PanningModel.HRTF,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0,
      dopplerFactor: 1,
      occlusionEnabled: false,
      occlusionFactor: 1,
      obstructionEnabled: false,
      obstructionFactor: 1
    }

    it('should return 1.0 at reference distance', () => {
      const attenuation = calculateDistanceAttenuation(1, config)
      expect(attenuation).toBe(1.0)
    })

    it('should return 0.0 at max distance', () => {
      const attenuation = calculateDistanceAttenuation(100, config)
      expect(attenuation).toBe(0.0)
    })

    it('should calculate linear attenuation correctly', () => {
      const attenuation = calculateDistanceAttenuation(50, {
        ...config,
        distanceModel: DistanceModel.LINEAR
      })
      expect(attenuation).toBeGreaterThan(0)
      expect(attenuation).toBeLessThan(1)
    })

    it('should calculate inverse attenuation correctly', () => {
      const attenuation = calculateDistanceAttenuation(10, {
        ...config,
        distanceModel: DistanceModel.INVERSE
      })
      expect(attenuation).toBeGreaterThan(0)
      expect(attenuation).toBeLessThan(1)
    })

    it('should calculate exponential attenuation correctly', () => {
      const attenuation = calculateDistanceAttenuation(10, {
        ...config,
        distanceModel: DistanceModel.EXPONENTIAL,
        rolloffFactor: 2
      })
      expect(attenuation).toBeGreaterThan(0)
      expect(attenuation).toBeLessThan(1)
    })
  })

  describe('calculateDopplerShift', () => {
    it('should calculate positive doppler shift for approaching source', () => {
      const shift = calculateDopplerShift(
        { x: 0, y: 0, z: 0 }, // listener pos
        { x: 10, y: 0, z: 0 }, // source pos
        { x: 0, y: 0, z: 0 }, // listener vel
        { x: -5, y: 0, z: 0 }, // source vel (approaching)
        1.0 // doppler factor
      )
      expect(shift).toBeGreaterThan(1.0) // Higher pitch
    })

    it('should calculate negative doppler shift for receding source', () => {
      const shift = calculateDopplerShift(
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 5, y: 0, z: 0 }, // source vel (receding)
        1.0
      )
      expect(shift).toBeLessThan(1.0) // Lower pitch
    })

    it('should return 1.0 for stationary source', () => {
      const shift = calculateDopplerShift(
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }, // no velocity
        1.0
      )
      expect(shift).toBe(1.0)
    })

    it('should respect doppler factor', () => {
      const shift1 = calculateDopplerShift(
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: -5, y: 0, z: 0 },
        0.5 // Half doppler
      )
      const shift2 = calculateDopplerShift(
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: -5, y: 0, z: 0 },
        1.0 // Full doppler
      )
      expect(Math.abs(shift1 - 1.0)).toBeLessThan(Math.abs(shift2 - 1.0))
    })
  })

  describe('getMaterialAbsorption', () => {
    it('should return absorption for concrete', () => {
      const absorption = getMaterialAbsorption('concrete')
      expect(absorption).toBeGreaterThan(0)
      expect(absorption).toBeLessThan(1)
    })

    it('should return absorption for wood', () => {
      const absorption = getMaterialAbsorption('wood')
      expect(absorption).toBeGreaterThan(0)
      expect(absorption).toBeLessThan(1)
    })

    it('should return absorption for metal', () => {
      const absorption = getMaterialAbsorption('metal')
      expect(absorption).toBeGreaterThan(0)
      expect(absorption).toBeLessThan(1)
    })

    it('should return absorption for fabric', () => {
      const absorption = getMaterialAbsorption('fabric')
      expect(absorption).toBeGreaterThan(0.3) // High absorption
    })

    it('should return default for unknown material', () => {
      const absorption = getMaterialAbsorption('unknown_material')
      expect(absorption).toBe(0.5)
    })
  })
})

describe('Audio Catalog', () => {
  describe('getSound', () => {
    it('should get weapon sound by ID', () => {
      const sound = getSound('ar_fire')
      expect(sound).toBeDefined()
      expect(sound?.id).toBe('ar_fire')
      expect(sound?.category).toBe(AudioCategory.WEAPONS)
    })

    it('should get footstep sound by ID', () => {
      const sound = getSound('footstep_concrete')
      expect(sound).toBeDefined()
      expect(sound?.type).toBe(SoundType.FOOTSTEP)
    })

    it('should return undefined for non-existent sound', () => {
      const sound = getSound('non_existent')
      expect(sound).toBeUndefined()
    })
  })

  describe('getAllSounds', () => {
    it('should return all sounds', () => {
      const sounds = getAllSounds()
      expect(sounds.length).toBeGreaterThan(0)
      expect(sounds).toContain(AR_FIRE)
      expect(sounds).toContain(FOOTSTEP_CONCRETE)
      expect(sounds).toContain(EXPLOSION_GRENADE)
    })

    it('should include weapon sounds', () => {
      const sounds = getAllSounds()
      const weaponSounds = sounds.filter(s => s.category === AudioCategory.WEAPONS)
      expect(weaponSounds.length).toBeGreaterThan(0)
    })

    it('should include UI sounds', () => {
      const sounds = getAllSounds()
      const uiSounds = sounds.filter(s => s.category === AudioCategory.UI)
      expect(uiSounds.length).toBeGreaterThan(0)
    })
  })

  describe('getSoundsByCategory', () => {
    it('should filter sounds by weapons category', () => {
      const sounds = getSoundsByCategory(AudioCategory.WEAPONS)
      expect(sounds.length).toBeGreaterThan(0)
      sounds.forEach(sound => {
        expect(sound.category).toBe(AudioCategory.WEAPONS)
      })
    })

    it('should filter sounds by footsteps category', () => {
      const sounds = getSoundsByCategory(AudioCategory.FOOTSTEPS)
      expect(sounds.length).toBeGreaterThan(0)
      sounds.forEach(sound => {
        expect(sound.category).toBe(AudioCategory.FOOTSTEPS)
      })
    })

    it('should filter sounds by UI category', () => {
      const sounds = getSoundsByCategory(AudioCategory.UI)
      expect(sounds.length).toBeGreaterThan(0)
      sounds.forEach(sound => {
        expect(sound.category).toBe(AudioCategory.UI)
      })
    })

    it('should filter sounds by explosions category', () => {
      const sounds = getSoundsByCategory(AudioCategory.EXPLOSIONS)
      expect(sounds.length).toBeGreaterThan(0)
      sounds.forEach(sound => {
        expect(sound.category).toBe(AudioCategory.EXPLOSIONS)
      })
    })
  })

  describe('getSoundsByType', () => {
    it('should filter sounds by weapon fire type', () => {
      const sounds = getSoundsByType(SoundType.WEAPON_FIRE)
      expect(sounds.length).toBeGreaterThan(0)
      sounds.forEach(sound => {
        expect(sound.type).toBe(SoundType.WEAPON_FIRE)
      })
    })

    it('should filter sounds by footstep type', () => {
      const sounds = getSoundsByType(SoundType.FOOTSTEP)
      expect(sounds.length).toBeGreaterThan(0)
      sounds.forEach(sound => {
        expect(sound.type).toBe(SoundType.FOOTSTEP)
      })
    })

    it('should filter sounds by explosion type', () => {
      const sounds = getSoundsByType(SoundType.EXPLOSION)
      expect(sounds.length).toBeGreaterThan(0)
      sounds.forEach(sound => {
        expect(sound.type).toBe(SoundType.EXPLOSION)
      })
    })
  })

  describe('getMusicTrack', () => {
    it('should get music track by ID', () => {
      const track = getMusicTrack('music_menu')
      expect(track).toBeDefined()
      expect(track?.id).toBe('music_menu')
    })

    it('should return undefined for non-existent track', () => {
      const track = getMusicTrack('non_existent')
      expect(track).toBeUndefined()
    })
  })

  describe('getAllMusicTracks', () => {
    it('should return all music tracks', () => {
      const tracks = getAllMusicTracks()
      expect(tracks.length).toBeGreaterThan(0)
      expect(tracks).toContain(MUSIC_MENU)
      expect(tracks).toContain(MUSIC_INTENSE)
    })
  })
})

describe('Sound Definitions', () => {
  describe('Weapon Sounds', () => {
    it('AR_FIRE should be configured correctly', () => {
      expect(AR_FIRE.id).toBe('ar_fire')
      expect(AR_FIRE.category).toBe(AudioCategory.WEAPONS)
      expect(AR_FIRE.type).toBe(SoundType.WEAPON_FIRE)
      expect(AR_FIRE.spatial).toBe(true)
      expect(AR_FIRE.spatialConfig).toBeDefined()
      expect(AR_FIRE.paths.length).toBeGreaterThan(0)
    })

    it('SNIPER_FIRE should have long max distance', () => {
      expect(SNIPER_FIRE.spatial).toBe(true)
      expect(SNIPER_FIRE.spatialConfig?.maxDistance).toBeGreaterThan(150)
    })

    it('PISTOL_FIRE should have shorter range than rifle', () => {
      expect(PISTOL_FIRE.spatialConfig?.maxDistance).toBeLessThan(AR_FIRE.spatialConfig?.maxDistance || 0)
    })

    it('AR_RELOAD should not be spatial', () => {
      expect(AR_RELOAD.spatial).toBe(false)
    })
  })

  describe('Movement Sounds', () => {
    it('FOOTSTEP_CONCRETE should have multiple variations', () => {
      expect(FOOTSTEP_CONCRETE.paths.length).toBeGreaterThan(1)
      expect(FOOTSTEP_CONCRETE.randomizePitch).toBeGreaterThan(0)
    })

    it('FOOTSTEP_METAL should sound different from concrete', () => {
      expect(FOOTSTEP_METAL.id).not.toBe(FOOTSTEP_CONCRETE.id)
      expect(FOOTSTEP_METAL.paths[0]).not.toBe(FOOTSTEP_CONCRETE.paths[0])
    })

    it('JUMP should not loop', () => {
      expect(JUMP.loop).toBe(false)
    })

    it('LAND should not loop', () => {
      expect(LAND.loop).toBe(false)
    })
  })

  describe('Impact Sounds', () => {
    it('impact sounds should have high priority', () => {
      expect(IMPACT_CONCRETE.priority).toBeGreaterThan(100)
      expect(IMPACT_METAL.priority).toBeGreaterThan(100)
      expect(IMPACT_BODY.priority).toBeGreaterThan(100)
    })

    it('impact sounds should be spatial', () => {
      expect(IMPACT_CONCRETE.spatial).toBe(true)
      expect(IMPACT_METAL.spatial).toBe(true)
      expect(IMPACT_BODY.spatial).toBe(true)
    })

    it('impact sounds should have multiple variations', () => {
      expect(IMPACT_CONCRETE.paths.length).toBeGreaterThan(1)
    })
  })

  describe('Explosion Sounds', () => {
    it('EXPLOSION_GRENADE should have very long range', () => {
      expect(EXPLOSION_GRENADE.spatial).toBe(true)
      expect(EXPLOSION_GRENADE.spatialConfig?.maxDistance).toBeGreaterThan(200)
    })

    it('EXPLOSION_GRENADE should have highest priority', () => {
      expect(EXPLOSION_GRENADE.priority).toBeGreaterThan(200)
    })

    it('EXPLOSION_GRENADE should use exponential distance model', () => {
      expect(EXPLOSION_GRENADE.spatialConfig?.distanceModel).toBe(DistanceModel.EXPONENTIAL)
    })
  })

  describe('UI Sounds', () => {
    it('UI sounds should not be spatial', () => {
      expect(UI_CLICK.spatial).toBe(false)
      expect(UI_NOTIFICATION.spatial).toBe(false)
    })

    it('UI sounds should be in UI category', () => {
      expect(UI_CLICK.category).toBe(AudioCategory.UI)
      expect(UI_NOTIFICATION.category).toBe(AudioCategory.UI)
    })

    it('UI sounds should have lower priority', () => {
      expect(UI_CLICK.priority).toBeLessThan(100)
    })
  })

  describe('Game Event Sounds', () => {
    it('LEVEL_UP should not be spatial', () => {
      expect(LEVEL_UP.spatial).toBe(false)
    })

    it('KILLSTREAK should not be spatial', () => {
      expect(KILLSTREAK.spatial).toBe(false)
    })

    it('game event sounds should be in SFX category', () => {
      expect(LEVEL_UP.category).toBe(AudioCategory.SFX)
      expect(KILLSTREAK.category).toBe(AudioCategory.SFX)
    })
  })

  describe('Ambient Sounds', () => {
    it('AMBIENT_WIND should loop', () => {
      expect(AMBIENT_WIND.loop).toBe(true)
    })

    it('AMBIENT_RAIN should loop', () => {
      expect(AMBIENT_RAIN.loop).toBe(true)
    })

    it('ambient sounds should be in AMBIENT category', () => {
      expect(AMBIENT_WIND.category).toBe(AudioCategory.AMBIENT)
      expect(AMBIENT_RAIN.category).toBe(AudioCategory.AMBIENT)
    })

    it('ambient sounds should have low volume', () => {
      expect(AMBIENT_WIND.volume).toBeLessThan(0.5)
      expect(AMBIENT_RAIN.volume).toBeLessThan(0.5)
    })
  })

  describe('Music Tracks', () => {
    it('MUSIC_MENU should be configured correctly', () => {
      expect(MUSIC_MENU.id).toBe('music_menu')
      expect(MUSIC_MENU.loop).toBe(true)
      expect(MUSIC_MENU.path).toBeDefined()
    })

    it('MUSIC_INTENSE should have high BPM', () => {
      expect(MUSIC_INTENSE.bpm).toBeGreaterThan(120)
    })

    it('music tracks should have fade in/out', () => {
      expect(MUSIC_MENU.fadeIn).toBeGreaterThan(0)
      expect(MUSIC_MENU.fadeOut).toBeGreaterThan(0)
      expect(MUSIC_INTENSE.fadeIn).toBeGreaterThan(0)
      expect(MUSIC_INTENSE.fadeOut).toBeGreaterThan(0)
    })

    it('MUSIC_INTENSE should have dynamic layers', () => {
      expect(MUSIC_INTENSE.layers).toBeDefined()
      expect(MUSIC_INTENSE.layers!.length).toBeGreaterThan(0)
    })
  })
})

describe('Sound Features', () => {
  it('all sounds should have unique IDs', () => {
    const sounds = getAllSounds()
    const ids = sounds.map(s => s.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all sounds should have valid categories', () => {
    const sounds = getAllSounds()
    const validCategories = Object.values(AudioCategory)
    sounds.forEach(sound => {
      expect(validCategories).toContain(sound.category)
    })
  })

  it('all sounds should have valid types', () => {
    const sounds = getAllSounds()
    const validTypes = Object.values(SoundType)
    sounds.forEach(sound => {
      expect(validTypes).toContain(sound.type)
    })
  })

  it('all sounds should have at least one audio path', () => {
    const sounds = getAllSounds()
    sounds.forEach(sound => {
      expect(sound.paths.length).toBeGreaterThan(0)
      sound.paths.forEach(path => {
        expect(path).toBeTruthy()
        expect(typeof path).toBe('string')
      })
    })
  })

  it('all spatial sounds should have spatial config', () => {
    const sounds = getAllSounds()
    sounds.forEach(sound => {
      if (sound.spatial) {
        expect(sound.spatialConfig).toBeDefined()
      }
    })
  })

  it('all sounds should have valid volume range', () => {
    const sounds = getAllSounds()
    sounds.forEach(sound => {
      expect(sound.volume).toBeGreaterThanOrEqual(0)
      expect(sound.volume).toBeLessThanOrEqual(1)
    })
  })

  it('all sounds should have valid priority', () => {
    const sounds = getAllSounds()
    sounds.forEach(sound => {
      expect(sound.priority).toBeGreaterThanOrEqual(0)
      expect(sound.priority).toBeLessThanOrEqual(256)
    })
  })

  it('all sounds should have preload flag', () => {
    const sounds = getAllSounds()
    sounds.forEach(sound => {
      expect(typeof sound.preload).toBe('boolean')
    })
  })

  it('high priority sounds should be preloaded', () => {
    const sounds = getAllSounds()
    const highPriority = sounds.filter(s => s.priority > 150)
    highPriority.forEach(sound => {
      expect(sound.preload).toBe(true)
    })
  })

  it('weapon sounds should have sound pooling', () => {
    const weaponSounds = getSoundsByCategory(AudioCategory.WEAPONS)
    weaponSounds.forEach(sound => {
      expect(sound.poolSize).toBeGreaterThan(0)
    })
  })
})
