/**
 * Audio Manager Unit Tests
 * Tests: complete audio system including spatial audio, voice chat, and sound effects
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { audioManager } from '@/lib/audio-manager'

// Mock window object for jsdom environment
Object.defineProperty(global, 'window', {
  value: {
    AudioContext: vi.fn(() => mockAudioContext),
    webkitAudioContext: vi.fn(() => mockAudioContext)
  },
  writable: true
})

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: vi.fn(),
    hidden: false
  },
  writable: true
})

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getAudioTracks: () => [{ enabled: true, stop: vi.fn() }] as any
      }) as any
    }
  },
  writable: true
})

// Mock Web Audio API
const mockGainNode = {
  gain: { value: 1.0 },
  connect: vi.fn(),
  disconnect: vi.fn()
}

const mockPannerNode = {
  setPosition: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn()
}

const mockBufferSourceNode = {
  buffer: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  onended: null
}

const mockAudioContext = {
  state: 'running',
  sampleRate: 48000,
  baseLatency: 0,
  destination: {} as any,
  masterGainNode: mockGainNode,
  sfxGainNode: mockGainNode,
  voiceGainNode: mockGainNode,
  musicGainNode: mockGainNode,
  compressor: {
    threshold: { value: -24 },
    knee: { value: 30 },
    ratio: { value: 12 },
    attack: { value: 0.003 },
    release: { value: 0.25 },
    connect: vi.fn(),
    disconnect: vi.fn()
  },
  analyser: {
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    connect: vi.fn(),
    disconnect: vi.fn()
  },
  createGain: vi.fn(() => mockGainNode),
  createBufferSource: vi.fn(() => mockBufferSourceNode),
  createPanner: vi.fn(() => mockPannerNode),
  createDynamicsCompressor: vi.fn(() => mockAudioContext.compressor),
  createAnalyser: vi.fn(() => mockAudioContext.analyser),
  decodeAudioData: vi.fn().mockResolvedValue({
    duration: 1.0,
    length: 8,
    sampleRate: 48000,
    numberOfChannels: 2,
    getChannelData: vi.fn(() => new Float32Array(8)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn()
  } as AudioBuffer),
  close: vi.fn(),
  suspend: vi.fn(),
  resume: vi.fn()
}

const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getAudioTracks: () => [{ enabled: true, stop: vi.fn() }] as any
  }) as any
}

// Update window mocks to use the mock objects
global.window.AudioContext = vi.fn(() => mockAudioContext)
global.window.webkitAudioContext = vi.fn(() => mockAudioContext)
global.navigator.mediaDevices = mockMediaDevices

describe('Audio Manager', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize audio context successfully', async () => {
      await audioManager.initialize()
      expect(window.AudioContext).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4) // master, sfx, voice, music
      expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled()
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled()
    })

    it('should not initialize twice', async () => {
      await audioManager.initialize()
      await audioManager.initialize()
      // Second call should return early without creating new context
      expect(window.AudioContext).toHaveBeenCalledTimes(1)
    })

    it('should handle initialization errors', async () => {
      // Mock AudioContext to throw an error
      window.AudioContext = vi.fn(() => {
        throw new Error('AudioContext not supported')
      })

      await expect(audioManager.initialize()).rejects.toThrow('AudioContext not supported')
    })
  })

  describe('Settings Management', () => {
    it('should update audio settings', async () => {
      await audioManager.initialize()
      
      const newSettings = {
        masterVolume: 0.5,
        sfxVolume: 0.7,
        spatialAudio: false
      }
      
      audioManager.updateSettings(newSettings)
      
      // Verify settings were applied
      expect(mockAudioContext.masterGainNode.gain.value).toBe(0.5)
      expect(mockAudioContext.sfxGainNode.gain.value).toBe(0.7)
    })

    it('should apply default settings on initialization', async () => {
      await audioManager.initialize()
      
      // Verify default settings were applied
      expect(mockAudioContext.masterGainNode.gain.value).toBe(1.0)
      expect(mockAudioContext.sfxGainNode.gain.value).toBe(0.8)
      expect(mockAudioContext.voiceGainNode.gain.value).toBe(0.9)
      expect(mockAudioContext.musicGainNode.gain.value).toBe(0.6)
    })
  })

  describe('Sound Effects', () => {
    it('should load sound effects', async () => {
      await audioManager.initialize()
      
      const effect = {
        id: 'test-sound',
        name: 'Test Sound',
        url: 'https://example.com/sound.mp3',
        volume: 0.8,
        loop: false,
        spatial: false
      }
      
      await audioManager.loadSoundEffect(effect)
      
      expect(fetch).toHaveBeenCalledWith('https://example.com/sound.mp3')
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled()
    })

    it('should play sound effects', async () => {
      await audioManager.initialize()
      
      const effect = {
        id: 'test-sound',
        name: 'Test Sound',
        url: 'https://example.com/sound.mp3',
        volume: 0.8,
        loop: false,
        spatial: false
      }
      
      await audioManager.loadSoundEffect(effect)
      audioManager.playSoundEffect('test-sound')
      
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
      expect(mockAudioContext.createGain().gain.value).toBe(0.8)
    })

    it('should play spatial sound effects', async () => {
      await audioManager.initialize()
      
      const effect = {
        id: 'spatial-sound',
        name: 'Spatial Sound',
        url: 'https://example.com/spatial.mp3',
        volume: 0.8,
        loop: false,
        spatial: true,
        position: { x: 10, y: 5, z: 2 }
      }
      
      await audioManager.loadSoundEffect(effect)
      audioManager.playSoundEffect('spatial-sound', { spatial: true })
      
      expect(mockAudioContext.createPanner).toHaveBeenCalled()
      expect(mockAudioContext.createPanner().setPosition).toHaveBeenCalledWith(10, 5, 2)
    })

    it('should stop sound effects', async () => {
      await audioManager.initialize()
      
      const effect = {
        id: 'test-sound',
        name: 'Test Sound',
        url: 'https://example.com/sound.mp3',
        volume: 0.8,
        loop: false,
        spatial: false
      }
      
      await audioManager.loadSoundEffect(effect)
      audioManager.playSoundEffect('test-sound')
      audioManager.stopSoundEffect('test-sound')
      
      const source = mockAudioContext.createBufferSource()
      expect(source.stop).toHaveBeenCalled()
    })
  })

  describe('Voice Chat', () => {
    it('should add voice chat users', async () => {
      await audioManager.initialize()
      
      const user = {
        id: 'user-123',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false
      }
      
      await audioManager.addVoiceChatUser(user)
      
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      })
    })

    it('should remove voice chat users', async () => {
      await audioManager.initialize()
      
      const user = {
        id: 'user-123',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false
      }
      
      await audioManager.addVoiceChatUser(user)
      audioManager.removeVoiceChatUser('user-123')
      
      const stream = (mockMediaDevices.getUserMedia().mock.results[0]?.value as any)?.getAudioTracks?.()[0]
      expect(stream.stop).toHaveBeenCalled()
    })

    it('should mute/unmute voice chat users', async () => {
      await audioManager.initialize()
      
      const user = {
        id: 'user-123',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false
      }
      
      await audioManager.addVoiceChatUser(user)
      audioManager.setVoiceChatUserMuted('user-123', true)
      
      const track = (mockMediaDevices.getUserMedia().mock.results[0]?.value as any)?.getAudioTracks?.()[0]
      expect(track.enabled).toBe(false)
      
      audioManager.setVoiceChatUserMuted('user-123', false)
      expect(track.enabled).toBe(true)
    })
  })

  describe('Performance Metrics', () => {
    it('should return audio metrics', async () => {
      await audioManager.initialize()
      
      const metrics = audioManager.getAudioMetrics()
      
      expect(metrics).toEqual({
        contextState: 'running',
        activeSounds: 0,
        voiceChatUsers: 0,
        sampleRate: 48000,
        bufferSize: 0,
      })
    })

    it('should return uninitialized metrics when not initialized', () => {
      const metrics = audioManager.getAudioMetrics()
      
      expect(metrics).toEqual({
        contextState: 'uninitialized',
        activeSounds: 0,
        voiceChatUsers: 0,
        sampleRate: 0,
        bufferSize: 0,
      })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup audio resources', async () => {
      await audioManager.initialize()
      
      // Add some active sounds and voice users
      const effect = {
        id: 'test-sound',
        name: 'Test Sound',
        url: 'https://example.com/sound.mp3',
        volume: 0.8,
        loop: false,
        spatial: false
      }
      
      await audioManager.loadSoundEffect(effect)
      audioManager.playSoundEffect('test-sound')
      
      const user = {
        id: 'user-123',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false
      }
      
      await audioManager.addVoiceChatUser(user)
      
      // Cleanup
      audioManager.cleanup()
      
      expect(mockAudioContext.close).toHaveBeenCalled()
      expect(mockAudioContext.masterGainNode.disconnect).toHaveBeenCalled()
      expect(mockAudioContext.sfxGainNode.disconnect).toHaveBeenCalled()
      expect(mockAudioContext.voiceGainNode.disconnect).toHaveBeenCalled()
      expect(mockAudioContext.musicGainNode.disconnect).toHaveBeenCalled()
      expect(mockAudioContext.compressor.disconnect).toHaveBeenCalled()
      expect(mockAudioContext.analyser.disconnect).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing audio context gracefully', () => {
      // Test methods when audio context is not initialized
      expect(() => audioManager.playSoundEffect('non-existent')).not.toThrow()
      expect(() => audioManager.stopSoundEffect('non-existent')).not.toThrow()
    })

    it('should handle fetch errors gracefully', async () => {
      await audioManager.initialize()
      
      // Mock fetch to throw an error
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
      
      const effect = {
        id: 'test-sound',
        name: 'Test Sound',
        url: 'https://example.com/sound.mp3',
        volume: 0.8,
        loop: false,
        spatial: false
      }
      
      await expect(audioManager.loadSoundEffect(effect)).rejects.toThrow()
    })
  })
})