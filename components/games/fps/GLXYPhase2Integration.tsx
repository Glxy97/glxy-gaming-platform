// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLXYMobileOptimizer } from './GLXYMobileOptimizer';
import { GLXYAdvancedWeaponSystem } from './GLXYAdvancedWeaponSystem';
import { GLXYBuildingSystem } from './GLXYBuildingSystem';
import { GLXYAIEnemies } from './GLXYAIEnemies';
import { GLXYTournamentMode } from './GLXYTournamentMode';
import { GLXYAdvancedGameMechanics } from './GLXYAdvancedGameMechanics';
import { GLXYSocialFeatures } from './GLXYSocialFeatures';

// Integration System Interfaces
export interface GLXYGameConfig {
  phase2Features: {
    mobileOptimization: boolean;
    advancedWeapons: boolean;
    buildingSystem: boolean;
    aiOpponents: boolean;
    tournamentMode: boolean;
    advancedMechanics: boolean;
    socialFeatures: boolean;
  };
  performance: {
    targetFPS: number;
    qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
    adaptiveQuality: boolean;
  };
  multiplayer: {
    maxPlayers: number;
    spectatorSlots: number;
    voiceChatEnabled: boolean;
  };
}

export interface GLXYPlayerState {
  id: string;
  username: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  health: number;
  weaponId: string;
  stats: {
    kills: number;
    deaths: number;
    buildingPlaced: number;
    accuracy: number;
  };
  socialData: {
    partyId?: string;
    isStreaming: boolean;
    voiceChatActive: boolean;
  };
}

export interface GLXYGameState {
  mode: 'battleRoyale' | 'tournament' | 'custom';
  phase: 'lobby' | 'playing' | 'spectating' | 'ended';
  players: GLXYPlayerState[];
  environment: {
    weather?: string;
    timeOfDay: number;
    zonePosition: THREE.Vector3;
    zoneRadius: number;
  };
  tournament?: {
    id: string;
    round: number;
    bracket: any[];
  };
}

// Main Integration Class
export class GLXYPhase2Integration {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private gameState!: GLXYGameState;
  private config!: GLXYGameConfig;

  // Phase 2 System Instances
  private mobileOptimizer!: GLXYMobileOptimizer;
  private weaponSystem!: GLXYAdvancedWeaponSystem;
  private buildingSystem!: GLXYBuildingSystem;
  private aiSystem!: GLXYAIEnemies;
  private tournamentSystem!: GLXYTournamentMode;
  private mechanicsSystem!: GLXYAdvancedGameMechanics;
  private socialSystem!: GLXYSocialFeatures;

  // Performance Monitoring
  private performanceMonitor: {
    frameCount: number;
    lastTime: number;
    fps: number;
    memoryUsage: number;
    networkLatency: number;
  };

  constructor(config: GLXYGameConfig) {
    this.config = config;
    this.gameState = {
      mode: 'battleRoyale',
      phase: 'lobby',
      players: [],
      environment: {
        timeOfDay: 12,
        zonePosition: new THREE.Vector3(0, 0, 0),
        zoneRadius: 1000
      }
    };

    this.performanceMonitor = {
      frameCount: 0,
      lastTime: performance.now(),
      fps: 60,
      memoryUsage: 0,
      networkLatency: 0
    };

    this.initializeThreeJS();
    this.initializePhase2Systems();
    this.setupEventListeners();
    this.startGameLoop();
  }

  private initializeThreeJS(): void {
    // Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0008);

    // Camera Setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.set(0, 5, 0);

    // Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.performance.qualityLevel !== 'low',
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add renderer to DOM
    document.body.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private initializePhase2Systems(): void {
    // Initialize Mobile Optimization
    if (this.config.phase2Features.mobileOptimization) {
      this.mobileOptimizer = new GLXYMobileOptimizer();
      this.mobileOptimizer.initialize();
      this.setupMobileControls();
    }

    // Initialize Advanced Weapon System
    if (this.config.phase2Features.advancedWeapons) {
      this.weaponSystem = new GLXYAdvancedWeaponSystem();
      (this.weaponSystem as any).loadWeaponData?.();
    }

    // Initialize Building System
    if (this.config.phase2Features.buildingSystem) {
      this.buildingSystem = new GLXYBuildingSystem(
        new THREE.Scene(),
        new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000),
        new THREE.WebGLRenderer()
      );
      this.setupBuildingIntegration();
    }

    // Initialize AI System
    if (this.config.phase2Features.aiOpponents) {
      this.aiSystem = new GLXYAIEnemies(this.scene, this.camera);
      this.setupAIIntegration();
    }

    // Initialize Tournament System
    if (this.config.phase2Features.tournamentMode) {
      this.tournamentSystem = new GLXYTournamentMode();
      (this.tournamentSystem as any).initialize?.();
    }

    // Initialize Advanced Mechanics
    if (this.config.phase2Features.advancedMechanics) {
      this.mechanicsSystem = new GLXYAdvancedGameMechanics(this.scene, this.camera, this.renderer);
    }

    // Initialize Social Features
    if (this.config.phase2Features.socialFeatures) {
      this.socialSystem = new GLXYSocialFeatures('currentPlayer');
      this.setupSocialIntegration();
    }
  }

  private setupMobileControls(): void {
    if (!this.mobileOptimizer) return;

    // Connect mobile controls to game systems
    (this.mobileOptimizer as any).on?.('joystickMove', (data: any) => {
      // Update player movement based on joystick input
      this.updatePlayerMovement(data);
    });

    (this.mobileOptimizer as any).on?.('gesture', (gesture: string) => {
      // Handle mobile gestures
      this.handleMobileGesture(gesture);
    });

    (this.mobileOptimizer as any).on?.('gyroscope', (data: any) => {
      // Update camera rotation based on gyroscope
      this.updateCameraRotation(data);
    });
  }

  private setupBuildingIntegration(): void {
    if (!this.buildingSystem) return;

    // Connect building system to game state
    (this.buildingSystem as any).on?.('structurePlaced', (structure: any) => {
      this.addStructureToScene(structure);
      this.updateGameStats('buildingPlaced', 1);
    });

    (this.buildingSystem as any).on?.('structureDestroyed', (debris: any) => {
      this.handleStructureDestruction(debris);
    });
  }

  private setupAIIntegration(): void {
    if (!this.aiSystem) return;

    // Connect AI system to game loop
    (this.aiSystem as any).on?.('action', (action: any) => {
      this.executeAIAction(action);
    });

    (this.aiSystem as any).on?.('targetAcquired', (target: any) => {
      this.handleAITargetAcquired(target);
    });
  }

  private setupSocialIntegration(): void {
    if (!this.socialSystem) return;

    // Connect social features to game state
    (this.socialSystem as any).on?.('voiceChatConnected', (peerId: string) => {
      this.updatePlayerSocialState('voiceChatActive', true);
    });

    (this.socialSystem as any).on?.('streamStarted', (streamId: string) => {
      this.updatePlayerSocialState('isStreaming', true);
    });

    (this.socialSystem as any).on?.('partyJoined', (partyId: string) => {
      this.updatePlayerSocialState('partyId', partyId);
    });
  }

  private setupEventListeners(): void {
    // Game state events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('click', this.handleClick.bind(this));

    // Network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleNetworkOnline.bind(this));
      window.addEventListener('offline', this.handleNetworkOffline.bind(this));
    }
  }

  private startGameLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);

      // Update performance monitoring
      this.updatePerformanceMonitor();

      // Update game systems
      this.updateGameSystems();

      // Render scene
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  private updateGameSystems(): void {
    // Update mobile optimization
    if (this.mobileOptimizer) {
      (this.mobileOptimizer as any).update?.();
    }

    // Update weapon system
    if (this.weaponSystem) {
      (this.weaponSystem as any).update?.();
    }

    // Update building system
    if (this.buildingSystem) {
      (this.buildingSystem as any).update?.();
    }

    // Update AI system
    if (this.aiSystem) {
      (this.aiSystem as any).update?.();
    }

    // Update advanced mechanics
    if (this.mechanicsSystem) {
      (this.mechanicsSystem as any).update?.();

      // Sync weather with game state
      const weatherData = (this.mechanicsSystem as any).getCurrentWeather?.();
      if (weatherData?.type !== this.gameState.environment.weather) {
        this.gameState.environment.weather = weatherData?.type;
      }

      // Sync time of day
      this.gameState.environment.timeOfDay = (this.mechanicsSystem as any).getTimeOfDay?.();
    }

    // Update social system
    if (this.socialSystem) {
      (this.socialSystem as any).update?.();
    }
  }

  private updatePerformanceMonitor(): void {
    this.performanceMonitor.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.performanceMonitor.lastTime >= 1000) {
      this.performanceMonitor.fps = this.performanceMonitor.frameCount;
      this.performanceMonitor.frameCount = 0;
      this.performanceMonitor.lastTime = currentTime;

      // Adaptive quality adjustment
      if (this.config.performance.adaptiveQuality) {
        this.adjustQualityBasedOnPerformance();
      }
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.performanceMonitor.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
  }

  private adjustQualityBasedOnPerformance(): void {
    const { fps, memoryUsage } = this.performanceMonitor;

    if (fps < 30 || memoryUsage > 0.85) {
      // Reduce quality
      this.reduceQuality();
    } else if (fps > 50 && memoryUsage < 0.6) {
      // Increase quality
      this.increaseQuality();
    }
  }

  private reduceQuality(): void {
    // Implement quality reduction logic
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.enabled = false;
    }

    if (this.renderer.getPixelRatio() > 1) {
      this.renderer.setPixelRatio(1);
    }
  }

  private increaseQuality(): void {
    // Implement quality increase logic
    if (!this.renderer.shadowMap.enabled && this.config.performance.qualityLevel !== 'low') {
      this.renderer.shadowMap.enabled = true;
    }

    if (this.renderer.getPixelRatio() === 1 && window.devicePixelRatio <= 2) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }

  // Event Handlers
  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Handle keyboard input based on active systems
    switch (event.code) {
      case 'KeyB':
        if (this.buildingSystem) {
          if (this.buildingSystem.isInBuildingMode()) {
            this.buildingSystem.exitBuildingMode();
          } else {
            this.buildingSystem.enterBuildingMode();
          }
        }
        break;
      case 'KeyV':
        if (this.socialSystem && this.config.multiplayer.voiceChatEnabled) {
          if (this.socialSystem.getVoiceChatStatus().isEnabled) {
            this.socialSystem.disableVoiceChat();
          } else {
            this.socialSystem.enableVoiceChat();
          }
        }
        break;
      case 'KeyR':
        if (this.socialSystem) {
          this.socialSystem.startRecording();
        }
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Handle key release events
  }

  private handleClick(event: MouseEvent): void {
    // Handle mouse clicks for different systems
    if (this.buildingSystem && this.buildingSystem.isInBuildingMode()) {
      // Get mouse position and convert to 3D world coordinates
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      // Create a plane at y=0 for building placement
      const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
      const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;

      const intersects = raycaster.intersectObject(plane);
      if (intersects.length > 0) {
        this.buildingSystem.placeStructure(intersects[0].point);
      }
    } else if (this.weaponSystem) {
      (this.weaponSystem as any).fire?.();
    }
  }

  private handleNetworkOnline(): void {
    console.log('Network connection restored');
    // Reconnect to multiplayer services
  }

  private handleNetworkOffline(): void {
    console.log('Network connection lost');
    // Switch to offline mode
  }

  // Game Action Methods
  private updatePlayerMovement(data: any): void {
    // Update player movement based on input
    // This would integrate with the player controller
  }

  private handleMobileGesture(gesture: string): void {
    switch (gesture) {
      case 'swipe_up':
        // Jump or climb
        break;
      case 'swipe_down':
        // Crouch or slide
        break;
      case 'pinch':
        // Zoom or switch weapon
        break;
    }
  }

  private updateCameraRotation(data: any): void {
    // Update camera based on gyroscope data
    this.camera.rotation.set(data.pitch, data.yaw, data.roll);
  }

  private addStructureToScene(structure: any): void {
    // Add building structure to 3D scene
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(structure.width, structure.height, structure.depth),
      new THREE.MeshLambertMaterial({ color: structure.color })
    );
    mesh.position.copy(structure.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  private handleStructureDestruction(debris: any): void {
    // Create particle effects for destroyed structures
    if (this.mechanicsSystem) {
      (this.mechanicsSystem as any).createDebrisParticles?.(debris.position, debris.material);
    }
  }

  private executeAIAction(action: any): void {
    // Execute AI actions in the game world
    switch (action.type) {
      case 'move':
        // Move AI character
        break;
      case 'shoot':
        // AI shoots weapon
        break;
      case 'build':
        // AI builds structure
        break;
    }
  }

  private handleAITargetAcquired(target: any): void {
    // Handle AI targeting system
  }

  private updatePlayerSocialState(key: string, value: any): void {
    // Update player's social state
    const currentPlayer = this.gameState.players.find(p => p.id === 'currentPlayer');
    if (currentPlayer) {
      (currentPlayer.socialData as any)[key] = value;
    }
  }

  private updateGameStats(stat: string, value: number): void {
    // Update game statistics
    const currentPlayer = this.gameState.players.find(p => p.id === 'currentPlayer');
    if (currentPlayer) {
      (currentPlayer.stats as any)[stat] += value;
    }
  }

  // Public API Methods
  public startGame(mode: 'battleRoyale' | 'tournament' | 'custom'): void {
    this.gameState.mode = mode;
    this.gameState.phase = 'playing';

    if (mode === 'tournament' && this.tournamentSystem) {
      (this.tournamentSystem as any).createTournament?.({
        type: 'bracket',
        name: 'Tournament',
        maxParticipants: this.config.multiplayer.maxPlayers,
        prizePool: 10000
      });
    }
  }

  public joinTournament(tournamentId: string): void {
    if (this.tournamentSystem) {
      (this.tournamentSystem as any).joinTournament?.(tournamentId);
      this.gameState.tournament = {
        id: tournamentId,
        round: 1,
        bracket: []
      };
    }
  }

  public getPerformanceMetrics() {
    return {
      ...this.performanceMonitor,
      qualityLevel: this.config.performance.qualityLevel,
      adaptiveQuality: this.config.performance.adaptiveQuality
    };
  }

  public getGameState(): GLXYGameState {
    return this.gameState;
  }

  public cleanup(): void {
    // Cleanup all systems
    if (this.mobileOptimizer) (this.mobileOptimizer as any).cleanup?.();
    if (this.weaponSystem) (this.weaponSystem as any).cleanup?.();
    if (this.buildingSystem) (this.buildingSystem as any).cleanup?.();
    if (this.aiSystem) (this.aiSystem as any).cleanup?.();
    if (this.tournamentSystem) (this.tournamentSystem as any).cleanup?.();
    if (this.mechanicsSystem) (this.mechanicsSystem as any).cleanup?.();
    if (this.socialSystem) this.socialSystem.destroy?.();

    // Cleanup Three.js
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    // Remove event listeners
    const handleResizeRef = this.handleResize.bind(this);
    const handleKeyDownRef = this.handleKeyDown.bind(this);
    const handleKeyUpRef = this.handleKeyUp.bind(this);
    const handleClickRef = this.handleClick.bind(this);

    window.removeEventListener('resize', handleResizeRef);
    window.removeEventListener('keydown', handleKeyDownRef);
    window.removeEventListener('keyup', handleKeyUpRef);
    window.removeEventListener('click', handleClickRef);
  }
}

// React Component for Integration UI
export const GLXYPhase2IntegrationUI: React.FC<{
  config: GLXYGameConfig;
  onGameStart?: (mode: string) => void;
}> = ({ config, onGameStart }) => {
  const [integrationInstance, setIntegrationInstance] = useState<GLXYPhase2Integration | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    // Initialize integration system
    const instance = new GLXYPhase2Integration(config);
    setIntegrationInstance(instance);

    // Start performance monitoring
    const interval = setInterval(() => {
      setPerformanceMetrics(instance.getPerformanceMetrics());
    }, 1000);

    return () => {
      clearInterval(interval);
      instance.cleanup();
    };
  }, [config]);

  const handleStartGame = (mode: 'battleRoyale' | 'tournament' | 'custom') => {
    integrationInstance?.startGame(mode);
    onGameStart?.(mode);
  };

  if (!integrationInstance) return null;

  return (
    <div className="relative w-full h-screen">
      {/* Performance Monitor */}
      {performanceMetrics && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm z-50"
        >
          <h3 className="text-sm font-bold mb-2">Performance</h3>
          <div className="text-xs space-y-1">
            <div>FPS: {performanceMetrics.fps}</div>
            <div>Memory: {(performanceMetrics.memoryUsage * 100).toFixed(1)}%</div>
            <div>Quality: {performanceMetrics.qualityLevel}</div>
            <div>Adaptive: {performanceMetrics.adaptiveQuality ? 'On' : 'Off'}</div>
          </div>
        </motion.div>
      )}

      {/* Game Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 right-4 flex justify-center z-50"
      >
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <div className="flex gap-4">
            <button
              onClick={() => handleStartGame('battleRoyale')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Battle Royale
            </button>
            {config.phase2Features.tournamentMode && (
              <button
                onClick={() => handleStartGame('tournament')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                Tournament
              </button>
            )}
            <button
              onClick={() => handleStartGame('custom')}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Custom Game
            </button>
          </div>
        </div>
      </motion.div>

      {/* Feature Status */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm z-50"
      >
        <h3 className="text-sm font-bold mb-2">Phase 2 Features</h3>
        <div className="text-xs space-y-1">
          {Object.entries(config.phase2Features).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Controls Toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-20 right-4 bg-black/50 text-white p-2 rounded-lg backdrop-blur-sm z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Advanced Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-20 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 z-50 w-80"
          >
            <h3 className="text-white font-bold mb-4">Advanced Controls</h3>
            <div className="space-y-3 text-sm text-white">
              <div className="flex justify-between">
                <span>Building Mode</span>
                <kbd className="bg-white/20 px-2 py-1 rounded">B</kbd>
              </div>
              {config.multiplayer.voiceChatEnabled && (
                <div className="flex justify-between">
                  <span>Voice Chat</span>
                  <kbd className="bg-white/20 px-2 py-1 rounded">V</kbd>
                </div>
              )}
              <div className="flex justify-between">
                <span>Start Recording</span>
                <kbd className="bg-white/20 px-2 py-1 rounded">R</kbd>
              </div>
              {config.phase2Features.mobileOptimization && (
                <div className="pt-2 border-t border-white/20">
                  <p className="text-xs opacity-75">Mobile gestures available:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Swipe up - Jump/Climb</li>
                    <li>• Swipe down - Crouch/Slide</li>
                    <li>• Pinch - Zoom/Weapon</li>
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GLXYPhase2IntegrationUI;