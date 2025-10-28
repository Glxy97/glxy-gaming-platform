/**
 * GLXY Gaming Platform - Audio Manager
 * Comprehensive audio system for gaming with Web Audio API
 * Supports spatial audio, voice chat, and game sound effects
 */

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  musicVolume: number;
  spatialAudio: boolean;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface VoiceChatUser {
  id: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioStream?: MediaStream;
}

export interface SoundEffect {
  id: string;
  name: string;
  url: string;
  volume: number;
  loop: boolean;
  spatial?: boolean;
  position?: { x: number; y: number; z: number };
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private voiceGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  private settings: AudioSettings = {
    masterVolume: 1.0,
    sfxVolume: 0.8,
    voiceVolume: 0.9,
    musicVolume: 0.6,
    spatialAudio: true,
    echoCancellation: true,
    noiseSuppression: true,
  };
  
  private voiceChatUsers: Map<string, VoiceChatUser> = new Map();
  private soundEffects: Map<string, AudioBuffer> = new Map();
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();
  private backgroundMusic: AudioBufferSourceNode | null = null;
  
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.bindEventHandlers();
  }

  /**
   * Initialize the audio system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Create audio context with fallback options
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Create audio nodes
      this.masterGainNode = this.audioContext.createGain();
      this.sfxGainNode = this.audioContext.createGain();
      this.voiceGainNode = this.audioContext.createGain();
      this.musicGainNode = this.audioContext.createGain();
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.analyser = this.audioContext.createAnalyser();

      // Configure audio nodes
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect audio nodes
      this.masterGainNode.connect(this.audioContext.destination);
      this.compressor.connect(this.masterGainNode);
      this.analyser.connect(this.compressor);

      // Apply initial settings
      this.applySettings();

      this.isInitialized = true;
      console.log('Audio Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Audio Manager:', error);
      throw error;
    }
  }

  /**
   * Update audio settings
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }

  private applySettings(): void {
    if (!this.audioContext || !this.masterGainNode) return;

    this.masterGainNode.gain.value = this.settings.masterVolume;
    if (this.sfxGainNode) this.sfxGainNode.gain.value = this.settings.sfxVolume;
    if (this.voiceGainNode) this.voiceGainNode.gain.value = this.settings.voiceVolume;
    if (this.musicGainNode) this.musicGainNode.gain.value = this.settings.musicVolume;
  }

  /**
   * Load and cache sound effects
   */
  async loadSoundEffect(effect: SoundEffect): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      const response = await fetch(effect.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      this.soundEffects.set(effect.id, audioBuffer);
      console.log(`Loaded sound effect: ${effect.name}`);
    } catch (error) {
      console.error(`Failed to load sound effect ${effect.name}:`, error);
    }
  }

  /**
   * Get the appropriate gain node for sound effects
   */
  private getSfxDestination(): GainNode {
    return this.sfxGainNode || this.masterGainNode || this.audioContext!.createGain();
  }

  /**
   * Play a sound effect
   */
  playSoundEffect(effectId: string, options: { volume?: number; spatial?: boolean; position?: { x: number; y: number; z: number } } = {}): void {
    const audioBuffer = this.soundEffects.get(effectId);
    if (!audioBuffer || !this.audioContext) return;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume ?? 1.0;
      
      // Connect nodes
      source.connect(gainNode);
      
      if (options.spatial && this.settings.spatialAudio) {
        this.setupSpatialAudio(source, gainNode, options.position || { x: 0, y: 0, z: 0 });
      } else {
        gainNode.connect(this.getSfxDestination());
      }
      
      source.start(0);
      
      // Track active sound
      this.activeSounds.set(effectId, source);
      
      // Clean up when sound finishes
      source.onended = () => {
        this.activeSounds.delete(effectId);
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error(`Failed to play sound effect ${effectId}:`, error);
    }
  }

  /**
   * Setup spatial audio for 3D positioning
   */
  private setupSpatialAudio(source: AudioBufferSourceNode, gainNode: GainNode, position: { x: number; y: number; z: number }): void {
    if (!this.audioContext) return;

    try {
      const pannerNode = this.audioContext.createPanner();
      pannerNode.setPosition(position.x, position.y, position.z);
      pannerNode.panningModel = 'HRTF';
      pannerNode.distanceModel = 'inverse';
      pannerNode.refDistance = 1;
      pannerNode.maxDistance = 100;
      
      gainNode.connect(pannerNode);
      pannerNode.connect(this.getSfxDestination());
    } catch (error) {
      console.error('Failed to setup spatial audio:', error);
      // Fallback to non-spatial
      gainNode.connect(this.getSfxDestination());
    }
  }

  /**
   * Stop a sound effect
   */
  stopSoundEffect(effectId: string): void {
    const source = this.activeSounds.get(effectId);
    if (source) {
      try {
        source.stop();
        this.activeSounds.delete(effectId);
      } catch (error) {
        console.error(`Failed to stop sound effect ${effectId}:`, error);
      }
    }
  }

  /**
   * Add user to voice chat
   */
  async addVoiceChatUser(user: Omit<VoiceChatUser, 'audioStream'>): Promise<void> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.settings.echoCancellation,
          noiseSuppression: this.settings.noiseSuppression,
          sampleRate: 48000,
        },
      });

      const voiceUser: VoiceChatUser = {
        ...user,
        audioStream: stream,
      };

      this.voiceChatUsers.set(user.id, voiceUser);
      console.log(`Added voice chat user: ${user.name}`);
    } catch (error) {
      console.error(`Failed to add voice chat user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Remove user from voice chat
   */
  removeVoiceChatUser(userId: string): void {
    const user = this.voiceChatUsers.get(userId);
    if (user) {
      // Stop audio stream
      if (user.audioStream) {
        user.audioStream.getTracks().forEach(track => track.stop());
      }
      
      this.voiceChatUsers.delete(userId);
      console.log(`Removed voice chat user: ${user.name}`);
    }
  }

  /**
   * Mute/unmute user in voice chat
   */
  setVoiceChatUserMuted(userId: string, muted: boolean): void {
    const user = this.voiceChatUsers.get(userId);
    if (user) {
      user.isMuted = muted;
      
      if (user.audioStream) {
        user.audioStream.getAudioTracks().forEach(track => {
          track.enabled = !muted;
        });
      }
    }
  }

  /**
   * Get audio performance metrics
   */
  getAudioMetrics(): {
    contextState: string;
    activeSounds: number;
    voiceChatUsers: number;
    sampleRate: number;
    bufferSize: number;
  } {
    if (!this.audioContext) {
      return {
        contextState: 'uninitialized',
        activeSounds: 0,
        voiceChatUsers: 0,
        sampleRate: 0,
        bufferSize: 0,
      };
    }

    return {
      contextState: this.audioContext.state,
      activeSounds: this.activeSounds.size,
      voiceChatUsers: this.voiceChatUsers.size,
      sampleRate: this.audioContext.sampleRate,
      bufferSize: this.audioContext.baseLatency,
    };
  }

  /**
   * Bind event handlers for audio context state changes
   */
  private bindEventHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.audioContext?.state === 'running') {
          // Suspend audio context when page is hidden to save resources
          this.audioContext.suspend();
        } else if (!document.hidden && this.audioContext?.state === 'suspended') {
          // Resume audio context when page is visible
          this.audioContext.resume();
        }
      });

      // Handle user interaction for audio context activation (required by some browsers)
      document.addEventListener('click', () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
      }, { once: true });
    }
  }

  /**
   * Cleanup audio resources
   */
  cleanup(): void {
    // Stop all active sounds
    this.activeSounds.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (error) {
        console.error('Error stopping sound source:', error);
      }
    });
    this.activeSounds.clear();

    // Stop all voice chat streams
    this.voiceChatUsers.forEach(user => {
      if (user.audioStream) {
        user.audioStream.getTracks().forEach(track => track.stop());
      }
    });
    this.voiceChatUsers.clear();

    // Stop background music
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.stop();
        this.backgroundMusic.disconnect();
      } catch (error) {
        console.error('Error stopping background music:', error);
      }
      this.backgroundMusic = null;
    }

    // Disconnect audio nodes
    try {
      if (this.masterGainNode) this.masterGainNode.disconnect();
      if (this.sfxGainNode) this.sfxGainNode.disconnect();
      if (this.voiceGainNode) this.voiceGainNode.disconnect();
      if (this.musicGainNode) this.musicGainNode.disconnect();
      if (this.compressor) this.compressor.disconnect();
      if (this.analyser) this.analyser.disconnect();
    } catch (error) {
      console.error('Error disconnecting audio nodes:', error);
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.isInitialized = false;
    console.log('Audio Manager cleaned up');
  }
}

// Singleton instance
export const audioManager = new AudioManager();