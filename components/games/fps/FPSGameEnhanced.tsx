// @ts-nocheck
'use client';

import React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
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
  Trophy
} from 'lucide-react';

interface GLXYWeapon {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  accuracy: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  icon: string;
  type: 'assault' | 'sniper' | 'pistol' | 'energy' | 'heavy';
}

interface GLXYPlayer {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  ammo: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  streak: number;
  bestStreak: number;
  currentWeapon: string;
  isAlive: boolean;
}

interface GLXYGameInfo {
  gameMode: '1vs1' | '2vs2';
  roundTime: number;
  maxRoundTime: number;
  team1Score: number;
  team2Score: number;
  currentRound: number;
  maxRounds: number;
  isGameActive: boolean;
  mapId: string;
}

interface FPSGameEnhancedProps {
  onGameEnd?: (result: any) => void;
  mapId: string;
  gameMode: '1vs1' | '2vs2';
}

export const FPSGameEnhanced: React.FC<FPSGameEnhancedProps> = ({
  onGameEnd,
  mapId,
  gameMode
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [playerStats, setPlayerStats] = useState<GLXYPlayer>({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    ammo: 30,
    kills: 0,
    deaths: 0,
    assists: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    currentWeapon: 'glxy_m4a1',
    isAlive: true
  });

  const [gameInfo, setGameInfo] = useState<GLXYGameInfo>({
    gameMode,
    roundTime: 0,
    maxRoundTime: 300000, // 5 Minuten
    team1Score: 0,
    team2Score: 0,
    currentRound: 1,
    maxRounds: 5,
    isGameActive: false,
    mapId
  });

  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);
  const [killFeed, setKillFeed] = useState<Array<{
    killer: string;
    victim: string;
    weapon: string;
    isHeadshot: boolean;
    timestamp: number;
  }>>([]);

  // GLXY Weapons with advanced stats
  const glxyWeapons: GLXYWeapon[] = [
    {
      id: 'glxy_m4a1',
      name: 'GLXY M4A1',
      damage: 35,
      fireRate: 750,
      accuracy: 85,
      ammo: 30,
      maxAmmo: 30,
      reloadTime: 2000,
      icon: '🔫',
      type: 'assault'
    },
    {
      id: 'glxy_quantum',
      name: 'GLXY Quantum Rifle',
      damage: 50,
      fireRate: 900,
      accuracy: 95,
      ammo: 40,
      maxAmmo: 40,
      reloadTime: 1500,
      icon: '⚡',
      type: 'energy'
    },
    {
      id: 'glxy_sniper',
      name: 'GLXY AWP Elite',
      damage: 120,
      fireRate: 30,
      accuracy: 98,
      ammo: 5,
      maxAmmo: 5,
      reloadTime: 3500,
      icon: '🎯',
      type: 'sniper'
    },
    {
      id: 'glxy_pistol',
      name: 'GLXY Desert Eagle',
      damage: 65,
      fireRate: 180,
      accuracy: 90,
      ammo: 12,
      maxAmmo: 12,
      reloadTime: 1800,
      icon: '🔫',
      type: 'pistol'
    },
    {
      id: 'glxy_heavy',
      name: 'GLXY Heavy Machine Gun',
      damage: 80,
      fireRate: 600,
      accuracy: 70,
      ammo: 100,
      maxAmmo: 100,
      reloadTime: 4000,
      icon: '💥',
      type: 'heavy'
    }
  ];

  // Simple 3D rendering with Canvas
  const render3DScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw GLXY environment
    ctx.save();

    // Draw ground grid
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.2)'; // GLXY Orange
    ctx.lineWidth = 1;

    for (let i = 0; i <= 20; i++) {
      const x = (width / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, height * 0.7);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let i = 0; i <= 10; i++) {
      const y = height * 0.7 + ((height * 0.3) / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw GLXY obstacles (simple cubes)
    const obstacles = [
      { x: width * 0.2, y: height * 0.6, size: 60 },
      { x: width * 0.7, y: height * 0.5, size: 80 },
      { x: width * 0.4, y: height * 0.4, size: 50 },
      { x: width * 0.85, y: height * 0.65, size: 40 }
    ];

    obstacles.forEach((obstacle, index) => {
      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(
        obstacle.x - obstacle.size/2 + 5,
        obstacle.y - obstacle.size/2 + 5,
        obstacle.size,
        obstacle.size
      );

      // Draw obstacle with GLXY gradient
      const obstacleGradient = ctx.createLinearGradient(
        obstacle.x - obstacle.size/2,
        obstacle.y - obstacle.size/2,
        obstacle.x + obstacle.size/2,
        obstacle.y + obstacle.size/2
      );
      obstacleGradient.addColorStop(0, '#ff9500'); // GLXY Orange
      obstacleGradient.addColorStop(1, '#ff6200');

      ctx.fillStyle = obstacleGradient;
      ctx.fillRect(
        obstacle.x - obstacle.size/2,
        obstacle.y - obstacle.size/2,
        obstacle.size,
        obstacle.size
      );

      // Draw GLXY logo on obstacles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GLXY', obstacle.x, obstacle.y);
    });

    // Draw crosshair
    if (playerStats.isAlive) {
      ctx.strokeStyle = '#ff9500'; // GLXY Orange
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff9500';

      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(width/2 - 15, height/2);
      ctx.lineTo(width/2 - 5, height/2);
      ctx.moveTo(width/2 + 5, height/2);
      ctx.lineTo(width/2 + 15, height/2);
      ctx.moveTo(width/2, height/2 - 15);
      ctx.lineTo(width/2, height/2 - 5);
      ctx.moveTo(width/2, height/2 + 5);
      ctx.lineTo(width/2, height/2 + 15);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = '#ff9500';
      ctx.beginPath();
      ctx.arc(width/2, height/2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    // Draw kill feed
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 300, 20, 280, Math.min(200, killFeed.length * 25 + 20));

    killFeed.slice(0, 8).forEach((kill, index) => {
      const y = 45 + index * 25;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';

      if (kill.killer === 'You') {
        ctx.fillStyle = '#00ff00'; // Green for your kills
        ctx.fillText(`You eliminated`, width - 280, y);
      } else {
        ctx.fillStyle = '#ff0000'; // Red for deaths
        ctx.fillText(`${kill.killer} eliminated`, width - 280, y);
      }

      if (kill.weapon) {
        ctx.fillStyle = '#ff9500';
        ctx.fillText(` [${kill.weapon}]`, width - 120, y);
      }

      if (kill.isHeadshot) {
        ctx.fillStyle = '#ffff00';
        ctx.fillText(' 🎯', width - 60, y);
      }
    });

    ctx.restore();
  }, [playerStats.isAlive, killFeed]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gamePaused) return;

    const gameLoop = () => {
      render3DScene();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, gamePaused, render3DScene]);

  // Start game
  useEffect(() => {
    setGameStarted(true);
    setGameInfo(prev => ({
      ...prev,
      isGameActive: true,
      roundTime: 0
    }));
  }, []);

  // Game timer
  useEffect(() => {
    if (!gameStarted || gamePaused) return;

    const timer = setInterval(() => {
      setGameInfo(prev => {
        const newTime = prev.roundTime + 1000;

        // Simulate game events
        const randomEvent = Math.random();
        let newTeam1Score = prev.team1Score;
        let newTeam2Score = prev.team2Score;

        if (randomEvent < 0.1) { // 10% chance per second
          if (Math.random() < 0.6) {
            newTeam1Score++;
            // Add to kill feed
            setKillFeed(prevFeed => [
              {
                killer: 'You',
                victim: 'GLXY Bot',
                weapon: 'GLXY M4A1',
                isHeadshot: Math.random() < 0.3,
                timestamp: Date.now()
              },
              ...prevFeed.slice(0, 9)
            ]);
          } else {
            newTeam2Score++;
            // Add death to kill feed
            setKillFeed(prevFeed => [
              {
                killer: 'GLXY Bot',
                victim: 'You',
                weapon: 'GLXY Quantum Rifle',
                isHeadshot: Math.random() < 0.2,
                timestamp: Date.now()
              },
              ...prevFeed.slice(0, 9)
            ]);
          }
        }

        if (newTime >= prev.maxRoundTime) {
          // Round ended
          if (onGameEnd) {
            onGameEnd({
              won: newTeam1Score > newTeam2Score,
              kills: playerStats.kills,
              deaths: playerStats.deaths,
              headshots: Math.floor(playerStats.kills * 0.25),
              score: playerStats.score,
              bestStreak: playerStats.bestStreak
            });
          }
          return { ...prev, roundTime: prev.maxRoundTime, isGameActive: false };
        }

        return { ...prev, roundTime: newTime, team1Score: newTeam1Score, team2Score: newTeam2Score };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gamePaused, onGameEnd, playerStats]);

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
        // Respawn player
        setIsDead(false);
        setPlayerStats(prev => ({
          ...prev,
          health: prev.maxHealth,
          isAlive: true
        }));
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

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentWeapon = glxyWeapons.find(w => w.id === playerStats.currentWeapon);

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
                <span className="text-gray-400">/</span>
                <span className="text-gray-400">{playerStats.maxArmor}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-white font-bold text-lg">{currentWeapon?.ammo || 0}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-400">{currentWeapon?.maxAmmo || 0}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Crown className="w-4 h-4 text-orange-500" />
              <span className="text-orange-400 font-semibold">{currentWeapon?.name}</span>
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-green-400 font-bold">Team 1</div>
                <div className="text-white text-2xl">{gameInfo.team1Score}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm">
                  Round {gameInfo.currentRound}/{gameInfo.maxRounds}
                </div>
                <div className="text-white font-bold text-lg">
                  {formatTime(gameInfo.maxRoundTime - gameInfo.roundTime)}
                </div>
                <Badge className="mt-1 bg-orange-500 text-white">
                  {mapId.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold">Team 2</div>
                <div className="text-white text-2xl">{gameInfo.team2Score}</div>
              </div>
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
              {playerStats.streak > 1 && (
                <div className="text-center">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Streak</div>
                  <div className="text-orange-400 font-bold text-xl flex items-center">
                    <Flame className="w-4 h-4 mr-1" />
                    {playerStats.streak}
                  </div>
                </div>
              )}
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
            <Badge className="bg-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              GLXY FPS
            </Badge>
          </div>
        </div>

        {/* Death Overlay */}
        {isDead && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="text-6xl font-bold text-red-500">
                GLXY ELIMINATED
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
                  <span>GLXY FPS PAUSED</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-white">
                  <p>Map: {mapId.replace('_', ' ').toUpperCase()}</p>
                  <p>Mode: {gameMode}</p>
                  <p>Round: {gameInfo.currentRound}/{gameInfo.maxRounds}</p>
                </div>
                <Button
                  onClick={() => setGamePaused(false)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume Game
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
                  <span>GLXY SCOREBOARD</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-orange-400 font-bold">
                    <span>You</span>
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