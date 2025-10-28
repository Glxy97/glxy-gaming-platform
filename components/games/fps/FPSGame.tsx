// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { SimpleFPSCore } from '@/lib/games/fps-core-simple';
import { BotSystem } from '@/lib/games/bots/bot-system';
import { Scoreboard } from './Scoreboard';
import { OptionsMenu } from './OptionsMenu';
import { KillLog } from './KillLog';
import { DamageDisplay } from './DamageDisplay';
import { HealthBar } from './HealthBar';
import { BloodEffects } from './BloodEffects';
import { Minimap } from './Minimap';
import { WeaponDisplay } from './WeaponDisplay';
import { KillLogEntry } from '@/lib/games/bots/bot-system';

interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  ammo: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
}

interface GameInfo {
  gameMode: '1vs1' | '2vs2';
  roundTime: number;
  maxRoundTime: number;
  team1Score: number;
  team2Score: number;
  currentRound: number;
  maxRounds: number;
  isGameActive: boolean;
}

export const FPSGame: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 0,
    maxArmor: 50,
    ammo: 30,
    kills: 0,
    deaths: 0,
    assists: 0,
    score: 0
  });
  const [gameInfo, setGameInfo] = useState<GameInfo>({
    gameMode: '1vs1',
    roundTime: 0,
    maxRoundTime: 120000,
    team1Score: 0,
    team2Score: 0,
    currentRound: 1,
    maxRounds: 5,
    isGameActive: false
  });
  const [currentWeapon, setCurrentWeapon] = useState('Assault Rifle');
  const [isReloading, setIsReloading] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [killLog, setKillLog] = useState<KillLogEntry[]>([]);
  const cameraRef = useRef<any>(null);
  const [isDead, setIsDead] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);
  const [respawnInterval, setRespawnInterval] = useState<NodeJS.Timeout | null>(null);

  // Weapon mapping for display
  const weaponDisplayNames: { [key: string]: string } = {
    'rifle': 'Assault Rifle',
    'pistol': 'Pistol',
    'melee': 'Schwert'
  };

  // Game settings
  const [gameSettings, setGameSettings] = useState({
    mouseSensitivity: 1.0,
    masterVolume: 80,
    musicVolume: 60,
    sfxVolume: 90,
    vsync: true,
    fullscreen: false,
    crosshairEnabled: true,
    keyBindings: {
      forward: 'W',
      backward: 'S',
      left: 'A',
      right: 'D',
      jump: 'SPACE',
      crouch: 'CTRL',
      slide: 'C',
      sprint: 'SHIFT',
      reload: 'R',
      melee: 'V'
    }
  });

  // Bot configuration
  const [botConfig, setBotConfig] = useState({
    team1Bots: 0,
    team2Bots: 2,
    botDifficulty: 'medium' as 'easy' | 'medium' | 'hard',
    botNames: [
      'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
      'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
      'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu'
    ]
  });

  // Dynamic scoreboard data based on actual game state
  const [team1Data, setTeam1Data] = useState({
    name: 'Team Alpha',
    color: 'text-blue-400',
    totalScore: 0,
    players: [
      { username: 'Du', score: 0, kills: 0, deaths: 0, assists: 0, ping: 15, isAlive: true },
    ]
  });

  const [team2Data, setTeam2Data] = useState({
    name: 'Team Bravo',
    color: 'text-red-400',
    totalScore: 0,
    players: [] as any[] // Will be populated with bots
  });

  // Bot system reference
  const botSystemRef = useRef<any>(null);

  useEffect(() => {
    // Update scoreboard data when player stats change
    const team1Players = [
      { 
        username: 'Du', 
        score: playerStats.score, 
        kills: playerStats.kills, 
        deaths: playerStats.deaths, 
        assists: playerStats.assists, 
        ping: 15, 
        isAlive: playerStats.health > 0 
      }
    ];

    // Add team 1 bots to scoreboard
    if (botSystemRef.current) {
      const team1Bots = botSystemRef.current.getTeamBots('team1');
      team1Bots.forEach((bot: any) => {
        team1Players.push({
          username: bot.name,
          score: bot.score,
          kills: bot.kills,
          deaths: bot.deaths,
          assists: 0,
          ping: 20 + Math.floor(Math.random() * 10),
          isAlive: bot.isAlive
        });
      });
    }

    setTeam1Data(prev => ({
      ...prev,
      totalScore: gameInfo.team1Score,
      players: team1Players
    }));
    
    // Update team 2 with bots
    const team2Players: any[] = [];
    if (botSystemRef.current) {
      const team2Bots = botSystemRef.current.getTeamBots('team2');
      team2Bots.forEach((bot: any) => {
        team2Players.push({
          username: bot.name,
          score: bot.score,
          kills: bot.kills,
          deaths: bot.deaths,
          assists: 0,
          ping: 20 + Math.floor(Math.random() * 10),
          isAlive: bot.isAlive
        });
      });
    }

    setTeam2Data(prev => ({
      ...prev,
      totalScore: gameInfo.team2Score,
      players: team2Players
    }));
  }, [playerStats, gameInfo.team1Score, gameInfo.team2Score]);
  useEffect(() => {
    const handleWeaponChanged = (event: CustomEvent) => {
      console.log('Weapon changed:', event.detail);
      const weaponName = event.detail.weapon === 'rifle' ? 'Assault Rifle' : 
                        event.detail.weapon === 'pistol' ? 'Pistol' : 'Schwert';
      setCurrentWeapon(weaponName);
      setPlayerStats(prev => ({
        ...prev,
        ammo: event.detail.ammo
      }));
    };

    const handleWeaponFired = (event: CustomEvent) => {
      console.log('Weapon fired:', event.detail);
      setPlayerStats(prev => ({
        ...prev,
        ammo: event.detail.ammo
      }));
    };

    const handleWeaponReloaded = (event: CustomEvent) => {
      console.log('Weapon reloaded:', event.detail);
      setPlayerStats(prev => ({
        ...prev,
        ammo: event.detail.ammo
      }));
      setIsReloading(false);
    };

    const handleAimStateChanged = (event: CustomEvent) => {
      console.log('Aim state changed:', event.detail);
      setIsAiming(event.detail.isAiming);
    };

    const handlePlayerHit = (event: CustomEvent) => {
      console.log('Player hit:', event.detail);
      const { damage, isHeadshot, isCritical, position } = event.detail;
      
      // Trigger blood splatter effect
      if (position && gameInstanceRef.current) {
        const bloodEvent = new CustomEvent('bloodSplatter', {
          detail: {
            position: position,
            intensity: isHeadshot ? 2 : (isCritical ? 1.5 : 1)
          }
        });
        window.dispatchEvent(bloodEvent);
      }
      
      setPlayerStats(prev => {
        let newHealth = prev.health;
        let newArmor = prev.armor;
        
        // Apply damage to armor first, then to health
        if (prev.armor > 0) {
          const armorDamage = Math.min(damage, prev.armor);
          newArmor -= armorDamage;
          const remainingDamage = damage - armorDamage;
          newHealth -= remainingDamage;
        } else {
          newHealth -= damage;
        }
        
        // Ensure values don't go below 0
        newHealth = Math.max(0, newHealth);
        newArmor = Math.max(0, newArmor);
        
        console.log(`Damage applied: ${damage}, Health: ${newHealth}, Armor: ${newArmor}`);
        
        // Check if player died
        if (newHealth <= 0 && !isDead) {
          setIsDead(true);
          setRespawnTimer(5); // 5 seconds respawn time for FPS Arena
          
          // Start respawn countdown
          const interval = setInterval(() => {
            setRespawnTimer(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                respawnPlayer();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          setRespawnInterval(interval);
          
          // Update death count
          return {
            ...prev,
            health: 0,
            armor: newArmor,
            deaths: prev.deaths + 1
          };
        }
        
        return {
          ...prev,
          health: newHealth,
          armor: newArmor
        };
      });
    };

    // Tab key scoreboard toggle
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        setShowScoreboard(true);
      }
      
      // ESC key for options menu
      if (event.code === 'Escape') {
        event.preventDefault();
        setShowOptionsMenu(true);
        setGamePaused(true);
      }
      
      // Space key for next round (only when game is not active) or instant respawn
      if (event.code === 'Space') {
        event.preventDefault();
        if (!gameInfo.isGameActive) {
          nextRound();
        } else if (isDead) {
          // Instant respawn with space
          respawnPlayer();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        setShowScoreboard(false);
      }
      
      // ESC key for options menu
      if (event.code === 'Escape') {
        event.preventDefault();
        setShowOptionsMenu(!showOptionsMenu);
      }
    };

    window.addEventListener('weaponChanged', handleWeaponChanged as EventListener);
    window.addEventListener('weaponFired', handleWeaponFired as EventListener);
    window.addEventListener('weaponReloaded', handleWeaponReloaded as EventListener);
    window.addEventListener('aimStateChanged', handleAimStateChanged as EventListener);
    window.addEventListener('playerHit', handlePlayerHit as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('weaponChanged', handleWeaponChanged as EventListener);
      window.removeEventListener('weaponFired', handleWeaponFired as EventListener);
      window.removeEventListener('weaponReloaded', handleWeaponReloaded as EventListener);
      window.removeEventListener('aimStateChanged', handleAimStateChanged as EventListener);
      window.removeEventListener('playerHit', handlePlayerHit as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameStarted && gameContainerRef.current && !gamePaused) {
      // Initialize game
      try {
        console.log('Initializing game with container:', gameContainerRef.current);
        console.log('Container dimensions:', {
          width: gameContainerRef.current.offsetWidth,
          height: gameContainerRef.current.offsetHeight,
          clientWidth: gameContainerRef.current.clientWidth,
          clientHeight: gameContainerRef.current.clientHeight
        });
        
        // Ensure container has dimensions
        if (gameContainerRef.current.offsetWidth === 0 || gameContainerRef.current.offsetHeight === 0) {
          console.warn('Container has zero dimensions, waiting...');
          setTimeout(() => {
            if (gameContainerRef.current) {
              console.log('Retrying initialization with container dimensions:', {
                width: gameContainerRef.current.offsetWidth,
                height: gameContainerRef.current.offsetHeight
              });
              const game = new SimpleFPSCore(gameContainerRef.current);
              gameInstanceRef.current = game;
              
              // Initialize bot system
              if (game && game.getScene && game.getCollidableObjects) {
                const scene = game.getScene();
                const collidableObjects = game.getCollidableObjects();
                botSystemRef.current = new BotSystem(scene, botConfig, collidableObjects);
                
                // Set up kill log callback
                botSystemRef.current.setKillLogCallback((logEntries: KillLogEntry[]) => {
                  setKillLog(logEntries);
                });
                
                // Store camera reference for damage display
                // Note: getCamera method may not be available on SimpleFPSCore
                // cameraRef will be set when available
                
                console.log('Bot system initialized');
              }
              
              setGameInfo(prev => ({
                ...prev,
                isGameActive: true
              }));
              
              console.log('Game initialized successfully');
            }
          }, 100);
          return;
        }
        
        const game = new SimpleFPSCore(gameContainerRef.current);
        gameInstanceRef.current = game;
        
        // Initialize bot system
        if (game && game.getScene && game.getCollidableObjects) {
          const scene = game.getScene();
          const collidableObjects = game.getCollidableObjects();
          botSystemRef.current = new BotSystem(scene, botConfig, collidableObjects);
          
          // Set up kill log callback
          botSystemRef.current.setKillLogCallback((logEntries: KillLogEntry[]) => {
            setKillLog(logEntries);
          });
          
          // Store camera reference for damage display
          // Note: getCamera method may not be available on SimpleFPSCore
          // cameraRef will be set when available
          
          console.log('Bot system initialized');
        }
        
        // Update game info
        setGameInfo(prev => ({
          ...prev,
          isGameActive: true
        }));
        
        console.log('Game initialized successfully');
      } catch (error) {
        console.error('Failed to initialize game:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
      }
    }
    
    // Cleanup function
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, [gameStarted, gamePaused]);

  useEffect(() => {
    let gameTimer: NodeJS.Timeout;
    
    if (gameStarted && gameInfo.isGameActive && !gamePaused) {
      gameTimer = setInterval(() => {
        // Update bot system more frequently for smooth movement
        if (botSystemRef.current && gameInstanceRef.current) {
          const playerPosition = gameInstanceRef.current.getPlayerPosition();
          if (playerPosition) {
            botSystemRef.current.update(16, playerPosition); // 60 FPS update rate
          }
        }
        
        setGameInfo(prev => {
          const newTime = prev.roundTime + 1000;
          
          // Simulate some game progress - add random events
          const shouldAddScore = Math.random() < 0.15; // 15% chance per second
          const team1Scores = shouldAddScore && Math.random() < 0.6; // 60% of the time team 1 scores
          const team2Scores = shouldAddScore && !team1Scores; // 40% of the time team 2 scores
          
          if (newTime >= prev.maxRoundTime) {
            // Round ended - determine winner based on current scores
            const newGameState = {
              ...prev,
              roundTime: prev.maxRoundTime,
              isGameActive: false,
              team1Score: team1Scores ? prev.team1Score + 1 : prev.team1Score,
              team2Score: team2Scores ? prev.team2Score + 1 : prev.team2Score
            };
            
            // Set game as inactive in SimpleFPSCore
            if (gameInstanceRef.current && gameInstanceRef.current.setGameActive) {
              gameInstanceRef.current.setGameActive(false);
            }
            
            return newGameState;
          }
          
          // Update scores during the round
          return { 
            ...prev, 
            roundTime: newTime,
            team1Score: team1Scores ? prev.team1Score + 1 : prev.team1Score,
            team2Score: team2Scores ? prev.team2Score + 1 : prev.team2Score
          };
        });
      }, 1000);
    }
    
    return () => {
      if (gameTimer) clearInterval(gameTimer);
    };
  }, [gameStarted, gameInfo.isGameActive, gamePaused]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
      if (respawnInterval) {
        clearInterval(respawnInterval);
      }
    };
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setGamePaused(false);
    setPlayerStats({
      health: 100,
      maxHealth: 100,
      armor: 0,
      maxArmor: 50,
      ammo: 30,
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0
    });
    setGameInfo(prev => ({
      ...prev,
      roundTime: 0,
      isGameActive: true
    }));
  };

  const pauseGame = () => {
    setGamePaused(!gamePaused);
  };

  const respawnPlayer = () => {
    setIsDead(false);
    setRespawnTimer(0);
    if (respawnInterval) {
      clearInterval(respawnInterval);
      setRespawnInterval(null);
    }
    
    // Reset player stats for respawn
    setPlayerStats(prev => ({
      ...prev,
      health: prev.maxHealth,
      armor: 0,
      ammo: 30
    }));
    
    // Reset weapon to rifle
    setCurrentWeapon('Assault Rifle');
    setIsReloading(false);
    setIsAiming(false);
    
    // Reset weapon in game instance
    if (gameInstanceRef.current) {
      gameInstanceRef.current.switchWeaponPublic('rifle');
    }
    
    console.log('Player respawned');
  };

  const nextRound = () => {
    // Determine winner and update player stats accordingly
    const isWinner = gameInfo.team1Score > gameInfo.team2Score;
    
    setGameInfo(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      roundTime: 0,
      isGameActive: true
    }));
    
    // Set game as active in SimpleFPSCore
    if (gameInstanceRef.current && gameInstanceRef.current.setGameActive) {
      gameInstanceRef.current.setGameActive(true);
    }
    
    // Update player stats based on round result and reset for new round
    setPlayerStats(prev => ({
      ...prev,
      score: isWinner ? prev.score + 10 : prev.score + 5, // Winner gets more points
      kills: isWinner ? prev.kills + Math.floor(Math.random() * 3) + 1 : prev.kills + Math.floor(Math.random() * 2),
      deaths: !isWinner ? prev.deaths + Math.floor(Math.random() * 2) + 1 : prev.deaths + Math.floor(Math.random() * 1),
      health: 100, // Reset health
      maxHealth: 100, // Reset max health
      armor: 0,    // Reset armor
      maxArmor: 50, // Reset max armor
      ammo: 30     // Reset ammo
    }));
    
    // Reset weapon to rifle
    setCurrentWeapon('Assault Rifle');
    setIsReloading(false);
    setIsAiming(false);
    
    // If game instance exists, reset weapon state
    if (gameInstanceRef.current) {
      gameInstanceRef.current.switchWeaponPublic('rifle');
    }
  };

  const exitGame = () => {
    // Clean up existing game instance
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }
    
    setGameStarted(false);
    setGamePaused(false);
    setShowOptionsMenu(false);
  };

  const handleSettingsChange = (newSettings: typeof gameSettings) => {
    setGameSettings(newSettings);
    
    // Apply mouse sensitivity to game instance if available
    if (gameInstanceRef.current) {
      // Assuming the game instance has a method to update mouse sensitivity
      // This would need to be implemented in the game core
      console.log('Updating game settings:', newSettings);
    }
  };

  const restartGame = () => {
    // Clean up existing game instance
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }
    
    setGameStarted(false);
    setGamePaused(false);
    setShowOptionsMenu(false);
    setTimeout(startGame, 100);
  };

  const switchWeapon = (weapon: string) => {
    if (gameInstanceRef.current) {
      const weaponName = weapon === 'Assault Rifle' ? 'rifle' : 
                        weapon === 'Pistol' ? 'pistol' : 'melee';
      gameInstanceRef.current.switchWeaponPublic(weaponName);
    }
  };

  const reloadWeapon = () => {
    if (isReloading) return;
    
    setIsReloading(true);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.reloadWeaponPublic();
    } else {
      // Fallback timeout if game instance is not available
      setTimeout(() => {
        setIsReloading(false);
        setPlayerStats(prev => ({
          ...prev,
          ammo: currentWeapon === 'Assault Rifle' ? 30 : 12
        }));
      }, currentWeapon === 'Assault Rifle' ? 2000 : 1500);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Options menu handlers
  const handleSaveSettings = (settings: any) => {
    setGameSettings(settings);
    // Apply settings to game instance if available
    if (gameInstanceRef.current) {
      // Apply mouse sensitivity
      gameInstanceRef.current.setMouseSensitivity(settings.mouseSensitivity);
    }
    console.log('Settings saved:', settings);
  };

  const handleCloseOptionsMenu = () => {
    setShowOptionsMenu(false);
    setGamePaused(false);
  };

  const handleExitGame = () => {
    // Clean up game instance
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }
    setGameStarted(false);
    setGamePaused(false);
    setShowOptionsMenu(false);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center space-x-2">
              <Crosshair className="w-6 h-6 text-red-500" />
              <span>Tactical FPS</span>
            </CardTitle>
            <p className="text-gray-400">Modern First-Person Shooter</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Game Modes</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={gameInfo.gameMode === '1vs1' ? 'default' : 'outline'}
                  onClick={() => setGameInfo(prev => ({ ...prev, gameMode: '1vs1' }))}
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>1vs1</span>
                </Button>
                <Button
                  variant={gameInfo.gameMode === '2vs2' ? 'default' : 'outline'}
                  onClick={() => setGameInfo(prev => ({ ...prev, gameMode: '2vs2' }))}
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>2vs2</span>
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Bot Configuration</h3>
              
              {/* Team 1 Bots */}
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Team Alpha Bots: {botConfig.team1Bots}</label>
                <div className="flex space-x-1">
                  {[0, 1, 2, 3].map(num => (
                    <Button
                      key={`team1-${num}`}
                      variant={botConfig.team1Bots === num ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBotConfig(prev => ({ ...prev, team1Bots: num }))}
                      className="flex-1"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Team 2 Bots */}
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Team Bravo Bots: {botConfig.team2Bots}</label>
                <div className="flex space-x-1">
                  {[0, 1, 2, 3].map(num => (
                    <Button
                      key={`team2-${num}`}
                      variant={botConfig.team2Bots === num ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBotConfig(prev => ({ ...prev, team2Bots: num }))}
                      className="flex-1"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Bot Difficulty */}
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Bot Difficulty</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                    <Button
                      key={difficulty}
                      variant={botConfig.botDifficulty === difficulty ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBotConfig(prev => ({ ...prev, botDifficulty: difficulty }))}
                      className="capitalize"
                    >
                      {difficulty}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Controls</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Movement:</span>
                  <span>WASD</span>
                </div>
                <div className="flex justify-between">
                  <span>Jump:</span>
                  <span>Space</span>
                </div>
                <div className="flex justify-between">
                  <span>Fire:</span>
                  <span>Left Click</span>
                </div>
                <div className="flex justify-between">
                  <span>Aim:</span>
                  <span>Right Click</span>
                </div>
                <div className="flex justify-between">
                  <span>Reload:</span>
                  <span>R</span>
                </div>
                <div className="flex justify-between">
                  <span>Jump:</span>
                  <span>Space</span>
                </div>
                <div className="flex justify-between">
                  <span>Melee:</span>
                  <span>V + Left Click</span>
                </div>
                <div className="flex justify-between">
                  <span>Scoreboard:</span>
                  <span>Tab</span>
                </div>
                <div className="flex justify-between">
                  <span>Switch Weapons:</span>
                  <span>1, 2, 3</span>
                </div>
                <div className="flex justify-between">
                  <span>Crouch:</span>
                  <span>Ctrl</span>
                </div>
                <div className="flex justify-between">
                  <span>Slide:</span>
                  <span>C</span>
                </div>
                <div className="flex justify-between">
                  <span>Sprint:</span>
                  <span>Shift</span>
                </div>
                <div className="flex justify-between">
                  <span>Melee:</span>
                  <span>V + Click</span>
                </div>
                <div className="flex justify-between">
                  <span>Scoreboard:</span>
                  <span>Tab</span>
                </div>
                <div className="flex justify-between">
                  <span>Weapons:</span>
                  <span>1, 2, 3</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={startGame}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Death Overlay - Enhanced Battlefield-style death screen */}
      {isDead && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-black/80 to-gray-900/90 backdrop-blur-md z-50 transition-all duration-700">
          {/* Animated background overlay */}
          <div className="absolute inset-0 bg-black/20 animate-pulse"></div>
          
          {/* Death message with battlefield-style styling */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
            {/* Main death message */}
            <div className="text-center space-y-4">
              <div className="text-white text-5xl font-bold mb-6 animate-pulse tracking-wide">
                NIEMALS AUFGEBEN IST DER SCHLÜSSEL ZUM ERFOLG
              </div>
              
              {/* Death stats */}
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 border border-gray-600">
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-red-400">{playerStats.kills}</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">KILLS</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">{playerStats.deaths}</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">DEATHS</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">{playerStats.assists}</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">ASSISTS</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Respawn timer with battlefield-style countdown */}
            <div className="text-center space-y-2">
              <div className="text-white text-xl font-semibold">
                RESPAWN IN
              </div>
              <div className="text-6xl font-mono font-bold text-red-500 animate-bounce">
                {respawnTimer}
              </div>
              <div className="text-gray-400 text-sm">
                Drücke SPACE zum sofortigen Respawn
              </div>
            </div>
            
            {/* Battlefield-style progress bar */}
            <div className="w-80 bg-gray-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${((5 - respawnTimer) / 5) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Battlefield-style corner elements */}
          <div className="absolute top-4 left-4 text-red-500 text-sm font-bold opacity-60">
            K.O.
          </div>
          <div className="absolute top-4 right-4 text-red-500 text-sm font-bold opacity-60">
            ELIMINIERT
          </div>
        </div>
      )}
      
      {/* Game Container */}
      <div 
        ref={gameContainerRef}
        className={`w-full h-screen relative ${isDead ? 'pointer-events-none' : ''}`}
        style={{ cursor: gamePaused ? 'default' : 'none' }}
      >
        {/* Game UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Health Bar */}
          <HealthBar
            health={playerStats.health}
            maxHealth={playerStats.maxHealth}
            armor={playerStats.armor}
            maxArmor={playerStats.maxArmor}
          />
          
          {/* Top HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {/* Player Stats */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 pointer-events-auto">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-white font-mono">{playerStats.health}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-white font-mono">{playerStats.armor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-white font-mono">{currentWeapon === 'Schwert' ? '∞' : playerStats.ammo}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-300">
                {currentWeapon} {isReloading && '(Reloading...)'} {currentWeapon === 'Schwert' && '(∞)'}
              </div>
            </div>

            {/* Game Info */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 pointer-events-auto">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-blue-400 font-bold">Team 1</div>
                  <div className="text-white text-xl">{gameInfo.team1Score}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-sm">
                    Round {gameInfo.currentRound}/{gameInfo.maxRounds}
                  </div>
                  <div className="text-white font-mono">
                    {formatTime(gameInfo.maxRoundTime - gameInfo.roundTime)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-bold">Team 2</div>
                  <div className="text-white text-xl">{gameInfo.team2Score}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            {/* Score/Stats */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 pointer-events-auto">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-gray-400 text-xs">KILLS</div>
                  <div className="text-white font-bold">{playerStats.kills}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">DEATHS</div>
                  <div className="text-white font-bold">{playerStats.deaths}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">SCORE</div>
                  <div className="text-white font-bold">{playerStats.score}</div>
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="flex space-x-2 pointer-events-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={pauseGame}
                className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
              >
                {gamePaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={restartGame}
                className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchWeapon('Assault Rifle')}
                className={`bg-black/50 border-gray-600 text-white hover:bg-black/70 ${
                  currentWeapon === 'Assault Rifle' ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                AR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchWeapon('Pistol')}
                className={`bg-black/50 border-gray-600 text-white hover:bg-black/70 ${
                  currentWeapon === 'Pistol' ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                Pistol
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchWeapon('Schwert')}
                className={`bg-black/50 border-gray-600 text-white hover:bg-black/70 ${
                  currentWeapon === 'Schwert' ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                🗡️
              </Button>
            </div>
          </div>

          {/* Pause Overlay */}
          {gamePaused && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="text-center">
                  <CardTitle className="text-white">Game Paused</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-gray-400 text-sm">Game Mode</div>
                      <div className="text-white font-bold">{gameInfo.gameMode}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-gray-400 text-sm">Round</div>
                      <div className="text-white font-bold">
                        {gameInfo.currentRound}/{gameInfo.maxRounds}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setGamePaused(false)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume Game
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Round End Overlay */}
          {!gameInfo.isGameActive && gameInfo.roundTime >= gameInfo.maxRoundTime && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="text-center">
                  <CardTitle className="text-white">Runde Beendet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {gameInfo.team1Score > gameInfo.team2Score ? 'Team 1 Gewinnt!' : 
                       gameInfo.team2Score > gameInfo.team1Score ? 'Team 2 Gewinnt!' : 'Unentschieden!'}
                    </div>
                    <div className="text-gray-400">
                      {gameInfo.team1Score} - {gameInfo.team2Score}
                    </div>
                  </div>
                  <Button
                    onClick={nextRound}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Nächste Runde
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Scoreboard Overlay */}
      <Scoreboard 
        isVisible={showScoreboard}
        team1={team1Data}
        team2={team2Data}
      />
      
      {/* Options Menu Overlay */}
      <OptionsMenu
        isOpen={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        settings={gameSettings}
        onSettingsChange={handleSettingsChange}
        onExitGame={exitGame}
        onRestartGame={restartGame}
      />
      
      {/* Kill Log Overlay */}
      <div className="absolute top-4 right-4 pointer-events-none z-20">
        <KillLog killLog={killLog} />
      </div>
      
      {/* Damage Display Overlay */}
      {gameContainerRef.current && (
        <DamageDisplay 
          camera={cameraRef.current}
          container={gameContainerRef.current}
        />
      )}
      
      {/* Blood Effects */}
      <BloodEffects 
        isVisible={!isDead}
      />
      
      {/* Minimap */}
      <Minimap 
        isVisible={!isDead && gameInfo.isGameActive}
      />
      
      {/* Weapon Display */}
      <WeaponDisplay
        currentWeapon={currentWeapon}
        ammo={playerStats.ammo}
        maxAmmo={currentWeapon === 'Assault Rifle' ? 30 : currentWeapon === 'Pistol' ? 12 : 0}
        isReloading={isReloading}
        weapons={['Assault Rifle', 'Pistol', 'Schwert']}
      />
    </div>
  );
};