// @ts-nocheck
/**
 * Cross-Platform Optimization
 * Plattformübergreifende Optimierung für verschiedene Geräte und Browser
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface DeviceCapabilities {
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  deviceType: 'desktop' | 'mobile' | 'tablet';
  gpu: {
    vendor: string;
    renderer: string;
    maxTextureSize: number;
    maxVertexAttributes: number;
    supportsWebGL2: boolean;
  };
  cpu: {
    cores: number;
    architecture: string;
  };
  memory: {
    estimated: number; // in GB
    lowEndDevice: boolean;
  };
  network: {
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink: number; // Mbps
    rtt: number; // ms
  };
  features: {
    webgl: boolean;
    webgl2: boolean;
    webassembly: boolean;
    serviceworker: boolean;
    indexdb: boolean;
    webaudio: boolean;
    gamepad: boolean;
    touch: boolean;
    pointerlock: boolean;
    fullscreen: boolean;
  };
}

export interface OptimizationConfig {
  enableAutoQuality: boolean;
  performanceProfile: 'low' | 'medium' | 'high' | 'ultra' | 'auto';
  adaptiveResolution: boolean;
  memoryOptimization: boolean;
  networkOptimization: boolean;
}

class CrossPlatformOptimizer {
  private capabilities: DeviceCapabilities;
  private config: OptimizationConfig;
  private performanceProfile: 'low' | 'medium' | 'high' | 'ultra';
  private listeners = new Set<(profile: string) => void>();

  constructor(config: OptimizationConfig) {
    this.config = config;
    this.capabilities = this.detectCapabilities();
    this.performanceProfile = this.determinePerformanceProfile();

    if (config.enableAutoQuality) {
      this.startPerformanceMonitoring();
    }
  }

  // Geräte-Fähigkeiten erkennen
  private detectCapabilities(): DeviceCapabilities {
    const userAgent = navigator.userAgent;
    const platform = this.detectPlatform(userAgent);
    const browser = this.detectBrowser(userAgent);
    const deviceType = this.detectDeviceType(userAgent);

    return {
      platform,
      browser,
      deviceType,
      gpu: this.detectGPUCapabilities(),
      cpu: this.detectCPUCapabilities(),
      memory: this.detectMemoryCapabilities(),
      network: this.detectNetworkCapabilities(),
      features: this.detectFeatures()
    };
  }

  private detectPlatform(userAgent: string): DeviceCapabilities['platform'] {
    if (/Windows/.test(userAgent)) return 'windows';
    if (/Mac/.test(userAgent)) return 'macos';
    if (/Linux/.test(userAgent)) return 'linux';
    if (/Android/.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
    return 'unknown';
  }

  private detectBrowser(userAgent: string): DeviceCapabilities['browser'] {
    if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) return 'chrome';
    if (/Firefox/.test(userAgent)) return 'firefox';
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'safari';
    if (/Edg/.test(userAgent)) return 'edge';
    return 'unknown';
  }

  private detectDeviceType(userAgent: string): DeviceCapabilities['deviceType'] {
    if (/Mobile|Android|iPhone|iPad|iPod/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private detectGPUCapabilities(): DeviceCapabilities['gpu'] {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return {
        vendor: 'unknown',
        renderer: 'unknown',
        maxTextureSize: 0,
        maxVertexAttributes: 0,
        supportsWebGL2: false
      };
    }

    // WebGL Context als RenderingContext casten für diegetParameter-Zugriffe
    const webglContext = gl as any;

    const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');

    return {
      vendor: debugInfo ? webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
      renderer: debugInfo ? webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
      maxTextureSize: webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE) || 0,
      maxVertexAttributes: webglContext.getParameter(webglContext.MAX_VERTEX_ATTRIBS) || 0,
      supportsWebGL2: !!document.createElement('canvas').getContext('webgl2')
    };
  }

  private detectCPUCapabilities(): DeviceCapabilities['cpu'] {
    const cores = navigator.hardwareConcurrency || 4;
    const architecture = 'unknown'; // Nicht zuverlässig detectierbar im Browser

    return {
      cores,
      architecture
    };
  }

  private detectMemoryCapabilities(): DeviceCapabilities['memory'] {
    // Device Memory API
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const lowEndDevice = deviceMemory <= 2 ||
      this.capabilities?.deviceType === 'mobile' ||
      this.capabilities?.cpu?.cores <= 2;

    return {
      estimated: deviceMemory,
      lowEndDevice
    };
  }

  private detectNetworkCapabilities(): DeviceCapabilities['network'] {
    const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100
      };
    }

    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100
    };
  }

  private detectFeatures(): DeviceCapabilities['features'] {
    const canvas = document.createElement('canvas');

    return {
      webgl: !!canvas.getContext('webgl'),
      webgl2: !!canvas.getContext('webgl2'),
      webassembly: typeof WebAssembly === 'object',
      serviceworker: 'serviceWorker' in navigator,
      indexdb: 'indexedDB' in window,
      webaudio: typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
      gamepad: 'getGamepads' in navigator,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pointerlock: 'pointerLockElement' in document,
      fullscreen: 'fullscreenEnabled' in document
    };
  }

  // Performance-Profil bestimmen
  private determinePerformanceProfile(): 'low' | 'medium' | 'high' | 'ultra' {
    const { gpu, cpu, memory, deviceType, network } = this.capabilities;

    // Scoring-System
    let score = 0;

    // GPU Scoring
    if (gpu.maxTextureSize >= 4096) score += 3;
    else if (gpu.maxTextureSize >= 2048) score += 2;
    else if (gpu.maxTextureSize > 0) score += 1;

    if (gpu.supportsWebGL2) score += 2;

    // CPU Scoring
    score += Math.min(cpu.cores / 4, 3);

    // Memory Scoring
    if (!memory.lowEndDevice && memory.estimated >= 8) score += 3;
    else if (!memory.lowEndDevice && memory.estimated >= 4) score += 2;
    else if (memory.estimated >= 2) score += 1;

    // Device Type Scoring
    if (deviceType === 'desktop') score += 2;
    else if (deviceType === 'tablet') score += 1;

    // Network Scoring
    if (network.effectiveType === '4g') score += 1;

    // Profil basierend auf Score
    if (score >= 10) return 'ultra';
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  // Performance-Monitoring starten
  private startPerformanceMonitoring() {
    setInterval(() => {
      const currentProfile = this.determinePerformanceProfile();
      if (currentProfile !== this.performanceProfile) {
        this.performanceProfile = currentProfile;
        this.notifyListeners();
      }
    }, 10000); // Alle 10 Sekunden prüfen
  }

  // Listener für Profil-Änderungen
  addListener(listener: (profile: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.performanceProfile));
  }

  // Optimierungs-Empfehlungen
  getOptimizationRecommendations(): {
    resolution: number;
    shadowQuality: 'low' | 'medium' | 'high';
    textureQuality: 'low' | 'medium' | 'high';
    antialiasing: boolean;
    particleEffects: boolean;
    postProcessing: boolean;
  } {
    const profile = this.performanceProfile;

    switch (profile) {
      case 'ultra':
        return {
          resolution: 1.0,
          shadowQuality: 'high',
          textureQuality: 'high',
          antialiasing: true,
          particleEffects: true,
          postProcessing: true
        };
      case 'high':
        return {
          resolution: 1.0,
          shadowQuality: 'high',
          textureQuality: 'high',
          antialiasing: true,
          particleEffects: true,
          postProcessing: false
        };
      case 'medium':
        return {
          resolution: 0.75,
          shadowQuality: 'medium',
          textureQuality: 'medium',
          antialiasing: false,
          particleEffects: false,
          postProcessing: false
        };
      case 'low':
        return {
          resolution: 0.5,
          shadowQuality: 'low',
          textureQuality: 'low',
          antialiasing: false,
          particleEffects: false,
          postProcessing: false
        };
      default:
        return {
          resolution: 0.75,
          shadowQuality: 'medium',
          textureQuality: 'medium',
          antialiasing: false,
          particleEffects: false,
          postProcessing: false
        };
    }
  }

  // Getter-Methoden
  getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  getPerformanceProfile(): 'low' | 'medium' | 'high' | 'ultra' {
    return this.performanceProfile;
  }

  isLowEndDevice(): boolean {
    return this.capabilities.memory.lowEndDevice ||
           this.performanceProfile === 'low';
  }

  isMobileDevice(): boolean {
    return this.capabilities.deviceType === 'mobile';
  }

  supportsWebGL2(): boolean {
    return this.capabilities.gpu.supportsWebGL2;
  }
}

// React Hook
export function useCrossPlatformOptimization(config: OptimizationConfig) {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [performanceProfile, setPerformanceProfile] = useState<'low' | 'medium' | 'high' | 'ultra'>('medium');
  const [recommendations, setRecommendations] = useState<any>({});

  const optimizerRef = useRef<CrossPlatformOptimizer>();

  useEffect(() => {
    optimizerRef.current = new CrossPlatformOptimizer(config);

    setCapabilities(optimizerRef.current.getCapabilities());
    setPerformanceProfile(optimizerRef.current.getPerformanceProfile());
    setRecommendations(optimizerRef.current.getOptimizationRecommendations());

    const unsubscribe = optimizerRef.current.addListener((profile) => {
      setPerformanceProfile(profile as any);
      setRecommendations(optimizerRef.current!.getOptimizationRecommendations());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getOptimizationRecommendations = useCallback(() => {
    return optimizerRef.current?.getOptimizationRecommendations() || {};
  }, []);

  const isLowEndDevice = useCallback(() => {
    return optimizerRef.current?.isLowEndDevice() || false;
  }, []);

  const isMobileDevice = useCallback(() => {
    return optimizerRef.current?.isMobileDevice() || false;
  }, []);

  return {
    capabilities,
    performanceProfile,
    recommendations,
    getOptimizationRecommendations,
    isLowEndDevice,
    isMobileDevice
  };
}

export default CrossPlatformOptimizer;