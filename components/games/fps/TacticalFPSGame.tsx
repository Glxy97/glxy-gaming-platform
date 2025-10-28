// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Crosshair,
  Target,
  Shield,
  Zap,
  Users,
  Timer,
  Heart,
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Flame,
  Star,
  Trophy,
  User,
  Eye,
  Wrench,
  HeartHandshake
} from 'lucide-react';

import TacticalModelManager, { TacticalModelConfig } from './TacticalModels3D';
import { GLXYGameRenderer, GameObject } from '@/lib/3d-game-renderer';

interface TacticalPlayer {
  id: string;
  classType: 'assault' | 'recon' | 'marksman' | 'engineer' | 'medic';
  position: THREE.Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  model?: THREE.Group;
}

interface TacticalGameProps {
  onGameEnd?: (result: any) => void;
  mapId: string;
  gameMode: '1vs1' | '2vs2' | '5vs5';
  selectedClass?: 'assault' | 'recon' | 'marksman' | 'engineer' | 'medic';
}

export const TacticalFPSGame: React.FC<TacticalGameProps> = ({
  onGameEnd,
  mapId,
  gameMode,
  selectedClass = 'assault'
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GLXYGameRenderer>();
  const tacticalModelManagerRef = useRef<TacticalModelManager>();
  const playerModelRef = useRef<THREE.Group>();

  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [currentClass, setCurrentClass] = useState<'assault' | 'recon' | 'marksman' | 'engineer' | 'medic'>(selectedClass);
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    maxHealth: 100,
    armor: 50,
    kills: 0,
    deaths: 0,
    score: 0,
    currentWeapon: '',
    isAlive: true
  });

  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showClassSelect, setShowClassSelect] = useState(!selectedClass);
  const [isDead, setIsDead] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);

  // Tactical class information
  const tacticalClasses = [
    {
      id: 'assault',
      name: 'Assault Operator',
      description: 'Point Man / Entry Specialist',
      icon: <Target className="w-6 h-6" />,
      color: '#ff6b35',
      weapons: 'M4A1 Carbine',
      equipment: ['Tactical Helmet', 'Heavy Vest', 'Breach Charge', 'Combat Boots', 'Knee Pads'],
      health: 120,
      speed: 1.0
    },
    {
      id: 'recon',
      name: 'Recon Specialist',
      description: 'Scout / Forward Observer',
      icon: <Eye className="w-6 h-6" />,
      color: '#6c5ce7',
      weapons: 'M110 SASS Sniper',
      equipment: ['Lightweight Helmet', 'Ghillie Suit', 'Comms Headset', 'Binoculars', 'Surveillance Gear'],
      health: 90,
      speed: 1.3
    },
    {
      id: 'marksman',
      name: 'Marksman Operator',
      description: 'Designated Marksman',
      icon: <Crosshair className="w-6 h-6" />,
      color: '#ffd700',
      weapons: 'M24 SWS Sniper',
      equipment: ['Boonie Hat', 'Ghillie Hood', 'Bipod', 'Rangefinder', 'Camouflage Strips'],
      health: 85,
      speed: 1.0
    },
    {
      id: 'engineer',
      name: 'Combat Engineer',
      description: 'Demolitions Specialist',
      icon: <Wrench className="w-6 h-6" />,
      color: '#fdcb6e',
      weapons: 'SCAR-H Rifle',
      equipment: ['Yellow Helmet', 'Tool Belt', 'C4 Explosives', 'Professional Tools', 'Heavy Gear'],
      health: 110,
      speed: 0.9
    },
    {
      id: 'medic',
      name: 'Field Medic',
      description: 'Medical Specialist',
      icon: <HeartHandshake className="w-6 h-6" />,
      color: '#4ecdc4',
      weapons: 'M4 Carbine',
      equipment: ['Blue Helmet', 'Medical Vest', 'Defibrillator', 'Medical Kit', 'Tourniquets'],
      health: 100,
      speed: 1.1
    }
  ];

  // Initialize 3D renderer and tactical models
  useEffect(() => {
    if (!canvasRef.current) return;

    let renderer: GLXYGameRenderer | null = null;
    let tacticalModelManager: TacticalModelManager | null = null;

    const initRenderer = async () => {
      try {
        // Initialize high-performance game renderer
        renderer = new GLXYGameRenderer(canvasRef.current!, {
          enablePhysics: true,
          enableRayTracing: false, // Disable for performance in multiplayer
          enablePostProcessing: true,
          quality: 'high',
          targetFPS: 60
        });

        rendererRef.current = renderer;

        // Initialize tactical model manager
        tacticalModelManager = new TacticalModelManager(renderer.getScene());
        tacticalModelManagerRef.current = tacticalModelManager;

        // Create tactical environment with basic lighting
        const scene = renderer.getScene();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        scene.add(ambientLight);

        // Add directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        scene.add(sunLight);

        // Add hemisphere light for better ambient lighting
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.6);
        scene.add(hemiLight);

        // Create tactical environment
        await tacticalModelManager.createTacticalEnvironment();

        // Load player model
        const playerModel = await tacticalModelManager.loadTacticalModel(currentClass);
        if (playerModel) {
          playerModel.position.set(0, 0, 0);
          scene.add(playerModel);
          playerModelRef.current = playerModel;
        }

        // Set up camera
        const camera = renderer.getCamera();
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);

        // Start renderer
        renderer.start();

        console.log('✅ Tactical FPS Renderer initialized');
      } catch (error) {
        console.error('❌ Error initializing Tactical FPS renderer:', error);
      }
    };

    initRenderer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (tacticalModelManagerRef.current) {
        tacticalModelManagerRef.current.dispose();
      }
    };
  }, [currentClass]);

  // Create player model when class is selected
  useEffect(() => {
    if (!tacticalModelManagerRef.current || showClassSelect) return;

    // Remove existing player model
    if (playerModelRef.current) {
      tacticalModelManagerRef.current.getScene().remove(playerModelRef.current);
    }

    // Create new player model based on selected class
    const config: TacticalModelConfig = {
      classType: currentClass,
      position: new THREE.Vector3(0, 0, 0),
      teamColor: 'blue'
    };

    let playerModel: THREE.Group;

    switch (currentClass) {
      case 'assault':
        playerModel = tacticalModelManagerRef.current.createAssaultOperator(config);
        break;
      case 'recon':
        playerModel = tacticalModelManagerRef.current.createReconSpecialist(config);
        break;
      case 'marksman':
        playerModel = tacticalModelManagerRef.current.createMarksmanOperator(config);
        break;
      case 'engineer':
        playerModel = tacticalModelManagerRef.current.createCombatEngineer(config);
        break;
      case 'medic':
        playerModel = tacticalModelManagerRef.current.createFieldMedic(config);
        break;
      default:
        playerModel = tacticalModelManagerRef.current.createAssaultOperator(config);
    }

    playerModelRef.current = playerModel;

    // Update player stats based on class
    const classInfo = tacticalClasses.find(cls => cls.id === currentClass);
    if (classInfo) {
      setPlayerStats(prev => ({
        ...prev,
        maxHealth: classInfo.health,
        health: classInfo.health,
        currentWeapon: classInfo.weapons
      }));
    }

  }, [currentClass, showClassSelect]);

  // Game loop simulation
  useEffect(() => {
    if (!gameStarted || gamePaused || showClassSelect) return;

    const gameLoop = setInterval(() => {
      // Simulate game events
      if (Math.random() < 0.02) { // 2% chance per interval
        const eventType = Math.random();

        if (eventType < 0.6) {
          // Player eliminated enemy
          setPlayerStats(prev => ({
            ...prev,
            kills: prev.kills + 1,
            score: prev.score + 100
          }));
        } else if (eventType < 0.9) {
          // Player was eliminated
          setPlayerStats(prev => ({
            ...prev,
            deaths: prev.deaths + 1,
            health: 0,
            isAlive: false
          }));
          setIsDead(true);
          setRespawnTimer(5);
        }
      }
    }, 2000);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gamePaused, showClassSelect]);

  // Respawn timer
  useEffect(() => {
    if (!isDead || respawnTimer <= 0) return;

    const respawnInterval = setInterval(() => {
      setRespawnTimer(prev => {
        if (prev <= 1) {
          setIsDead(false);
          setPlayerStats(prev => ({
            ...prev,
            health: prev.maxHealth,
            isAlive: true
          }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(respawnInterval);
  }, [isDead, respawnTimer]);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard(true);
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        setGamePaused(!gamePaused);
      }

      if (e.code === 'Space' && isDead) {
        e.preventDefault();
        // Instant respawn
        setIsDead(false);
        setPlayerStats(prev => ({
          ...prev,
          health: prev.maxHealth,
          isAlive: true
        }));
        setRespawnTimer(0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePaused, isDead]);

  const selectClass = (classId: 'assault' | 'recon' | 'marksman' | 'engineer' | 'medic') => {
    setCurrentClass(classId);
    setShowClassSelect(false);
    setGameStarted(true);
  };

  const selectedClassInfo = tacticalClasses.find(cls => cls.id === currentClass);

  if (showClassSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
              <Crown className="w-12 h-12 text-orange-500" />
              <span>Tactical Operations</span>
            </h1>
            <p className="text-xl text-gray-300">Select Your Special Forces Class</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tacticalClasses.map(tacticalClass => (
              <Card
                key={tacticalClass.id}
                className="bg-gray-800 border-gray-700 hover:border-orange-500 transition-all cursor-pointer transform hover:scale-105"
                onClick={() => selectClass(tacticalClass.id as any)}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2" style={{ color: tacticalClass.color }}>
                    {tacticalClass.icon}
                  </div>
                  <CardTitle className="text-white text-xl">{tacticalClass.name}</CardTitle>
                  <p className="text-gray-400 text-sm">{tacticalClass.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-white font-semibold">{tacticalClass.health}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-white font-semibold">{tacticalClass.speed}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Weapon:</span>
                    <span className="text-white font-semibold">{tacticalClass.weapons}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm font-semibold">Equipment:</p>
                    <div className="flex flex-wrap gap-1">
                      {tacticalClass.equipment.slice(0, 3).map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {item}
                        </Badge>
                      ))}
                      {tacticalClass.equipment.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                          +{tacticalClass.equipment.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    style={{ backgroundColor: tacticalClass.color }}
                    onClick={() => selectClass(tacticalClass.id as any)}
                  >
                    Select Class
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-screen cursor-none"
      />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {/* Player Stats */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-white font-bold text-lg">{playerStats.health}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-400">{playerStats.maxHealth}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="text-white font-bold text-lg">{playerStats.armor}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-yellow-500" />
                <span className="text-white font-bold text-lg">{playerStats.kills}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Crown className="w-4 h-4 text-orange-500" />
              <span className="text-orange-400 font-semibold">{selectedClassInfo?.name}</span>
              <span className="text-gray-400">|</span>
              <span className="text-white">{selectedClassInfo?.weapons}</span>
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-gray-400 text-sm uppercase tracking-wider">Mode</div>
                <div className="text-white font-bold text-lg">{gameMode}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm uppercase tracking-wider">Map</div>
                <div className="text-white font-bold text-lg">{mapId?.replace('_', ' ').toUpperCase() || 'URBAN COMBAT'}</div>
              </div>
              <Badge className="bg-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                TACTICAL OPS
              </Badge>
            </div>
          </div>
        </div>

        {/* Bottom HUD */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          {/* Score/Stats */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase tracking-wider">Kills</div>
                <div className="text-white font-bold text-xl">{playerStats.kills}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase tracking-wider">Deaths</div>
                <div className="text-white font-bold text-xl">{playerStats.deaths}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase tracking-wider">Score</div>
                <div className="text-white font-bold text-xl">{playerStats.score}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase tracking-wider">Class</div>
                <div className="font-bold text-xl flex items-center" style={{ color: selectedClassInfo?.color }}>
                  {selectedClassInfo?.name}
                </div>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex space-x-2 pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGamePaused(!gamePaused)}
              className="bg-black/50 border-orange-500 text-orange-400 hover:bg-black/70"
            >
              {gamePaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClassSelect(true)}
              className="bg-black/50 border-blue-500 text-blue-400 hover:bg-black/70"
            >
              <User className="w-4 h-4 mr-2" />
              Change Class
            </Button>
            <Badge className="bg-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              TACTICAL FPS
            </Badge>
          </div>
        </div>

        {/* Death Overlay */}
        {isDead && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="text-6xl font-bold text-red-500">
                OPERATOR DOWN
              </div>
              <div className="text-white text-xl">
                Respawn in: {respawnTimer}s
              </div>
              <div className="text-gray-400">
                Press SPACE to respawn instantly
              </div>
              <Button
                onClick={() => {
                  setIsDead(false);
                  setPlayerStats(prev => ({
                    ...prev,
                    health: prev.maxHealth,
                    isAlive: true
                  }));
                  setRespawnTimer(0);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Respawn Now
              </Button>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {gamePaused && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <Card className="bg-gray-900 border-orange-500">
              <CardHeader className="text-center">
                <CardTitle className="text-orange-400 text-2xl flex items-center justify-center space-x-2">
                  <Crown className="w-6 h-6" />
                  <span>TACTICAL OPERATIONS PAUSED</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-white">
                  <p>Map: {mapId.replace('_', ' ').toUpperCase()}</p>
                  <p>Mode: {gameMode}</p>
                  <p>Class: {selectedClassInfo?.name}</p>
                  <p>Weapon: {selectedClassInfo?.weapons}</p>
                </div>
                <Button
                  onClick={() => setGamePaused(false)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume Mission
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scoreboard */}
        {showScoreboard && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <Card className="bg-gray-900 border-orange-500 w-96">
              <CardHeader>
                <CardTitle className="text-orange-400 text-center flex items-center justify-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>TACTICAL SCOREBOARD</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-orange-400 font-bold">
                    <span>You ({selectedClassInfo?.name})</span>
                    <span>{playerStats.kills}/{playerStats.deaths}</span>
                    <span>{playerStats.score}</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    Press TAB to close scoreboard
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticalFPSGame;