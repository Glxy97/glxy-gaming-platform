export class SoundManager {
  private audioContext: AudioContext;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private masterVolume: number = 0.7;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  async loadSound(name: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(name, audioBuffer);
      console.log(`Sound loaded: ${name}`);
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
    }
  }
  
  playSound(name: string, volume: number = 1.0, playbackRate: number = 1.0): void {
    const buffer = this.soundBuffers.get(name);
    if (!buffer) {
      console.warn(`Sound not found: ${name}`);
      return;
    }
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    
    gainNode.gain.value = volume * this.masterVolume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
  }
  
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  // Generate hit sounds programmatically
  generateHitSounds(): void {
    // Generate hit sound
    this.generateHitSound('hit', 0.3, 0.1);
    
    // Generate headshot sound
    this.generateHeadshotSound('headshot', 0.4, 0.15);
    
    // Generate critical hit sound
    this.generateCriticalSound('critical', 0.5, 0.2);
  }
  
  private generateHitSound(name: string, duration: number, frequency: number): void {
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Create a punchy hit sound with quick decay
      const envelope = Math.exp(-t * 20);
      const wave = Math.sin(2 * Math.PI * frequency * t) * envelope;
      // Add some noise for impact
      const noise = (Math.random() - 0.5) * 0.3 * envelope;
      data[i] = (wave + noise) * 0.3;
    }
    
    this.soundBuffers.set(name, buffer);
  }
  
  private generateHeadshotSound(name: string, duration: number, frequency: number): void {
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Create a distinctive headshot sound
      const envelope = Math.exp(-t * 15);
      const wave = Math.sin(2 * Math.PI * frequency * t) * envelope;
      // Add higher frequency component for "crack"
      const highFreq = Math.sin(2 * Math.PI * frequency * 2 * t) * envelope * 0.5;
      data[i] = (wave + highFreq) * 0.4;
    }
    
    this.soundBuffers.set(name, buffer);
  }
  
  private generateCriticalSound(name: string, duration: number, frequency: number): void {
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Create a critical hit sound with multiple layers
      const envelope = Math.exp(-t * 10);
      const wave = Math.sin(2 * Math.PI * frequency * t) * envelope;
      // Add lower frequency component for impact
      const lowFreq = Math.sin(2 * Math.PI * frequency * 0.5 * t) * envelope * 0.7;
      // Add some harmonics
      const harmonics = Math.sin(2 * Math.PI * frequency * 3 * t) * envelope * 0.3;
      data[i] = (wave + lowFreq + harmonics) * 0.5;
    }
    
    this.soundBuffers.set(name, buffer);
  }
}