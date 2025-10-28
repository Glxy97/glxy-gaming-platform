// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Zap,
  Target,
  Shield,
  Brain,
  Diamond,
  Trophy,
  Users,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Wifi,
  TrendingUp,
  Star,
  Award,
  Globe,
  Radio,
  MessageSquare,
  Home,
  BarChart3,
  Eye,
  Heart,
  Gift,
  Calendar,
  Bell,
  Volume2,
  Maximize2,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Gamepad2
} from 'lucide-react';

// Import Phase 3 Components
import { GLXYVRSystem } from './GLXYVRARSystem';
import { GLXYMLAnalytics } from './GLXYMLAnalytics';
import { GLXYBlockchainNFT } from './GLXYBlockchainNFT';
import { GLXYESportsProfessional } from './GLXYESportsProfessional';
import { GLXYAdvancedSocial } from './GLXYAdvancedSocial';

interface GameState {
  mode: 'menu' | 'playing' | 'spectating' | 'paused' | 'ended';
  mapId: string;
  playerCount: number;
  maxPlayers: number;
  roundTime: number;
  maxRoundTime: number;
  gameMode: 'solo' | 'duo' | 'squad' | 'battle_royale';
  serverRegion: string;
  ping: number;
  fps: number;
}

interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  survivalTime: number;
  placement: number;
  score: number;
  level: number;
  experience: number;
}

interface NextGenSettings {
  vrEnabled: boolean;
  arEnabled: boolean;
  mlAnalytics: boolean;
  blockchainEnabled: boolean;
  esportsMode: boolean;
  socialFeatures: boolean;
  voiceChat: boolean;
  streamingEnabled: boolean;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra' | 'ray_tracing';
  crossPlatform: boolean;
  cloudSync: boolean;
  performanceMode: 'quality' | 'balanced' | 'performance';
}

interface GLXYBattleRoyalePhase3Props {
  userId: string;
  username: string;
  walletConnected?: boolean;
  onWalletConnect?: (address: string) => void;
  initialMode?: string;
}

export const GLXYBattleRoyalePhase3: React.FC<GLXYBattleRoyalePhase3Props> = ({
  userId,
  username,
  walletConnected = false,
  onWalletConnect,
  initialMode = 'menu'
}) => {
  const [activeModule, setActiveModule] = useState<'game' | 'vr' | 'analytics' | 'blockchain' | 'esports' | 'social'>('game');
  const [gameState, setGameState] = useState<GameState>({
    mode: 'menu',
    mapId: 'glxy_island_2025',
    playerCount: 0,
    maxPlayers: 100,
    roundTime: 0,
    maxRoundTime: 1800000, // 30 minutes
    gameMode: 'battle_royale',
    serverRegion: 'eu-west',
    ping: 0,
    fps: 0
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    kills: 0,
    deaths: 0,
    assists: 0,
    damage: 0,
    survivalTime: 0,
    placement: 1,
    score: 0,
    level: 1,
    experience: 0
  });

  const [nextGenSettings, setNextGenSettings] = useState<NextGenSettings>({
    vrEnabled: false,
    arEnabled: false,
    mlAnalytics: true,
    blockchainEnabled: true,
    esportsMode: false,
    socialFeatures: true,
    voiceChat: true,
    streamingEnabled: false,
    graphicsQuality: 'high',
    crossPlatform: true,
    cloudSync: true,
    performanceMode: 'balanced'
  });

  const [showSidebar, setShowSidebar] = useState(true);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>>([]);

  const [connectedPlayers, setConnectedPlayers] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'ingame' | 'away';
    platform: string;
    vrActive: boolean;
  }>>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Initialize game
  useEffect(() => {
    initializeGame();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initializeGame = () => {
    // Initialize mock connected players
    const mockPlayers = [
      { id: '1', name: 'ProGamer', avatar: '🎮', status: 'ingame' as const, platform: 'PC', vrActive: false },
      { id: '2', name: 'VRPlayer', avatar: '🥽', status: 'online' as const, platform: 'VR', vrActive: true },
      { id: '3', name: 'MobileHero', avatar: '📱', status: 'away' as const, platform: 'Mobile', vrActive: false },
      { id: '4', name: 'ConsoleKing', avatar: '🎯', status: 'online' as const, platform: 'Console', vrActive: false },
      { id: '5', name: 'StreamMaster', avatar: '📺', status: 'ingame' as const, platform: 'PC', vrActive: false }
    ];
    setConnectedPlayers(mockPlayers);

    // Add initial notifications
    addNotification('info', 'Welcome to GLXY Battle Royale Phase 3', 'Experience the next generation of gaming');
    addNotification('success', 'Cross-Platform Play Enabled', 'Connect with players across all devices');

    // Update performance metrics
    startPerformanceMonitoring();
  };

  const startPerformanceMonitoring = () => {
    setInterval(() => {
      setGameState(prev => ({
        ...prev,
        ping: Math.floor(Math.random() * 30) + 10,
        fps: Math.floor(Math.random() * 30) + 120
      }));
    }, 1000);
  };

  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      mode: 'playing',
      playerCount: 100,
      roundTime: 0
    }));

    addNotification('success', 'Game Starting', 'Entering GLXY Battle Royale...');
    startGameLoop();
  };

  const startGameLoop = () => {
    const gameLoop = () => {
      // Update game state
      setGameState(prev => {
        const newTime = prev.mode === 'playing' ? prev.roundTime + 16 : prev.roundTime; // 60 FPS
        const alivePlayers = Math.max(1, prev.playerCount - Math.floor(newTime / 30000)); // 1 player eliminated every 30 seconds

        return {
          ...prev,
          roundTime: newTime,
          playerCount: alivePlayers
        };
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();
  };

  const renderGameView = () => {
    if (activeModule !== 'game') return null;

    return (
      <div className="relative w-full h-full bg-black">
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full"
        />

        {/* Game HUD */}
        {gameState.mode === 'playing' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Top HUD */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{gameState.playerCount}</div>
                    <div className="text-xs text-gray-400">ALIVE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{playerStats.kills}</div>
                    <div className="text-xs text-gray-400">KILLS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{Math.floor(gameState.roundTime / 60000)}:{((gameState.roundTime % 60000) / 1000).toFixed(0).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400">TIME</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-white">{gameState.ping}ms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-blue-500" />
                    <span className="text-white">{gameState.fps} FPS</span>
                  </div>
                  <Badge className="bg-purple-600">{gameState.serverRegion.toUpperCase()}</Badge>
                </div>
              </div>
            </div>

            {/* Minimap */}
            <div className="absolute bottom-4 right-4 w-64 h-64 bg-black/60 backdrop-blur-sm rounded-lg border border-purple-500">
              <div className="p-2">
                <div className="text-xs text-purple-400 mb-1">GLXY ISLAND</div>
                {/* Mock minimap content */}
                <div className="relative w-full h-48 bg-gray-900 rounded">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-600 text-xs">Map View</div>
                  </div>
                  {/* Player positions */}
                  {connectedPlayers.slice(0, 5).map((player, index) => (
                    <div
                      key={player.id}
                      className="absolute w-2 h-2 bg-green-500 rounded-full"
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + index * 10}%`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-4 left-4">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-white">100</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="text-white">50</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-yellow-500" />
                    <span className="text-white">M4A1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-Platform Indicators */}
            <div className="absolute top-20 left-4">
              <div className="flex flex-col space-y-2">
                {connectedPlayers.filter(p => p.vrActive).map(player => (
                  <div key={player.id} className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                    <Gamepad2 className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-white">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState.mode === 'menu' && (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-500">
                  GLXY BATTLE ROYALE
                </h1>
                <p className="text-xl text-gray-300">Phase 3 - Next Generation Gaming</p>
                <div className="flex justify-center space-x-4">
                  <Badge className="bg-purple-600">VR/AR Ready</Badge>
                  <Badge className="bg-blue-600">ML Powered</Badge>
                  <Badge className="bg-green-600">Blockchain</Badge>
                  <Badge className="bg-red-600">E-Sports</Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={startGame}
                  className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-lg px-8 py-4"
                >
                  <Play className="w-6 h-6 mr-2" />
                  SOLO
                </Button>
                <Button
                  onClick={startGame}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
                >
                  <Users className="w-6 h-6 mr-2" />
                  DUO
                </Button>
                <Button
                  onClick={startGame}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg px-8 py-4"
                >
                  <Users className="w-6 h-6 mr-2" />
                  SQUAD
                </Button>
              </div>

              <div className="text-sm text-gray-400">
                <p>Connected Players: {connectedPlayers.length} | Server: {gameState.serverRegion}</p>
                <p>Next-Gen Features: {Object.values(nextGenSettings).filter(Boolean).length} Active</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'game': return <Gamepad2 className="w-5 h-5" />;
      case 'vr': return <Gamepad2 className="w-5 h-5" />;
      case 'analytics': return <Brain className="w-5 h-5" />;
      case 'blockchain': return <Diamond className="w-5 h-5" />;
      case 'esports': return <Trophy className="w-5 h-5" />;
      case 'social': return <Users className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const getModuleTitle = (module: string) => {
    switch (module) {
      case 'game': return 'Battle Royale';
      case 'vr': return 'VR/AR System';
      case 'analytics': return 'ML Analytics';
      case 'blockchain': return 'Blockchain & NFT';
      case 'esports': return 'E-Sports Pro';
      case 'social': return 'Social & Community';
      default: return 'Unknown Module';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-8 h-8 text-purple-500" />
                <span className="text-xl font-bold text-purple-400">GLXY</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{username}</div>
                <div className="text-xs text-gray-400">Level {playerStats.level}</div>
              </div>
              <Badge className="bg-green-600 text-xs">ONLINE</Badge>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 space-y-2">
            {(['game', 'vr', 'analytics', 'blockchain', 'esports', 'social'] as const).map(module => (
              <Button
                key={module}
                onClick={() => setActiveModule(module)}
                variant={activeModule === module ? 'default' : 'ghost'}
                className={`w-full justify-start h-12 ${
                  activeModule === module ? 'bg-purple-600' : 'text-gray-400 hover:text-white'
                }`}
              >
                {getModuleIcon(module)}
                <span className="ml-3">{getModuleTitle(module)}</span>
                {nextGenSettings[`${module}Enabled` as keyof NextGenSettings] && (
                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-gray-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white mt-2"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            {!showSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="text-gray-400 hover:text-white"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-white">{getModuleTitle(activeModule)}</h1>
            {nextGenSettings.crossPlatform && (
              <Badge className="bg-blue-600">
                <Globe className="w-3 h-3 mr-1" />
                Cross-Platform
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Performance Overlay Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
              className={showPerformanceOverlay ? 'text-green-400' : 'text-gray-400'}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-400 hover:text-white"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge className="bg-red-600 text-xs ml-1">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Connected Players */}
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {connectedPlayers.slice(0, 3).map(player => (
                  <div
                    key={player.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 ${
                      player.vrActive ? 'border-purple-500 bg-purple-900' : 'border-gray-600 bg-gray-700'
                    }`}
                    title={player.name}
                  >
                    {player.avatar}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-400">+{connectedPlayers.length - 3}</span>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 relative">
          {activeModule === 'game' && renderGameView()}
          {activeModule === 'vr' && (
            <GLXYVRSystem
              onVRSessionStart={() => addNotification('success', 'VR Session Started', 'Immersive VR experience activated')}
              onVRSessionEnd={() => addNotification('info', 'VR Session Ended', 'Returning to normal view')}
              onHandTrackingUpdate={(tracking: any) => console.log('Hand tracking update:', tracking)}
              gameMode="battle-royale"
            />
          )}
          {activeModule === 'analytics' && (
            <GLXYMLAnalytics
              gameId="glxy_br_phase3"
              playerId={userId}
              gameMode="battle-royale"
              onInsightGenerated={(insight) => addNotification('info', 'ML Insight Generated', insight.prediction)}
              onAntiCheatAlert={(alert) => addNotification('warning', 'Anti-Cheat Alert', `Suspicious activity detected for player ${alert.playerId.slice(-8)}`)}
            />
          )}
          {activeModule === 'blockchain' && (
            <GLXYBlockchainNFT
              playerId={userId}
              walletConnected={walletConnected}
              onWalletConnect={(address) => {
                addNotification('success', 'Wallet Connected', `Connected to ${address}`);
                onWalletConnect?.(address);
              }}
              onWalletDisconnect={() => addNotification('info', 'Wallet Disconnected', 'Wallet disconnected')}
              gameMode="battle-royale"
            />
          )}
          {activeModule === 'esports' && (
            <GLXYESportsProfessional
              userId={userId}
              role="player"
              gameMode="battle-royale"
            />
          )}
          {activeModule === 'social' && (
            <GLXYAdvancedSocial
              userId={userId}
              username={username}
              gameMode="battle-royale"
              onGuildJoin={(guildId) => addNotification('success', 'Guild Joined', `Successfully joined guild`)}
              onVoiceChannelJoin={(channelId) => addNotification('info', 'Voice Channel', `Connected to voice channel`)}
            />
          )}
        </div>
      </div>

      {/* Performance Overlay */}
      {showPerformanceOverlay && (
        <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">FPS</div>
              <div className="text-white font-bold">{gameState.fps}</div>
            </div>
            <div>
              <div className="text-gray-400">Ping</div>
              <div className="text-white font-bold">{gameState.ping}ms</div>
            </div>
            <div>
              <div className="text-gray-400">Players</div>
              <div className="text-white font-bold">{gameState.playerCount}/{gameState.maxPlayers}</div>
            </div>
            <div>
              <div className="text-gray-400">Server</div>
              <div className="text-white font-bold">{gameState.serverRegion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-20 right-6 w-80 max-h-96 bg-black/80 backdrop-blur-sm rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Notifications</h3>
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${
                  !notification.read ? 'bg-purple-900/20' : ''
                }`}
                onClick={() => {
                  setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, read: true } : n
                  ));
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{notification.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Controls (when in game) */}
      {gameState.mode === 'playing' && activeModule === 'game' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGameState(prev => ({ ...prev, mode: 'paused' }))}
            className="bg-black/60 border-gray-600"
          >
            <Pause className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="bg-black/60 border-gray-600"
          >
            <Menu className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModule('social')}
            className="bg-black/60 border-gray-600"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
            className="bg-black/60 border-gray-600"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};