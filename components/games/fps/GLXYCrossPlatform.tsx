// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Monitor,
  Gamepad2,
  Tablet,
  Tv,
  Download,
  Upload,
  Cloud,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Users,
  Shield,
  Zap,
  Database,
  Server,
  Router,
  Smartphone as Mobile,
  Chrome,
  Apple,
  Cpu,
  Smartphone as Android,
  X
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'console' | 'vr' | 'web';
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  capabilities: string[];
  lastSync: number;
  version: string;
  deviceInfo: {
    model: string;
    os: string;
    memory: string;
    storage: string;
  };
}

interface CrossPlatformSettings {
  autoSync: boolean;
  syncFrequency: number; // minutes
  syncWifiOnly: boolean;
  cloudSaveEnabled: boolean;
  crossPlatformPlay: boolean;
  inputRemapping: boolean;
  graphicsAdaptation: boolean;
  progressSync: boolean;
  settingsSync: boolean;
  inventorySync: boolean;
}

interface CloudSyncData {
  totalSize: number;
  usedSpace: number;
  lastBackup: number;
  syncProgress: number;
  isSyncing: boolean;
  conflicts: Array<{
    id: string;
    type: 'save' | 'settings' | 'inventory';
    platform: string;
    timestamp: number;
    resolved: boolean;
  }>;
}

interface GameSession {
  id: string;
  platform: string;
  startTime: number;
  endTime?: number;
  progress: {
    level: number;
    experience: number;
    achievements: string[];
    inventory: string[];
    settings: any;
  };
  networkInfo: {
    ping: number;
    bandwidth: number;
    connectionType: 'wifi' | 'cellular' | 'ethernet';
    signalStrength: number;
  };
}

interface CrossPlatformPlaySession {
  sessionId: string;
  players: Array<{
    id: string;
    username: string;
    platform: string;
    isHost: boolean;
    ping: number;
    status: 'connected' | 'connecting' | 'disconnected';
  }>;
  gameMode: string;
  maxPlayers: number;
  inviteCode: string;
  isPrivate: boolean;
  crossPlatformEnabled: boolean;
}

interface GLXYCrossPlatformProps {
  userId: string;
  username: string;
  onPlatformConnected?: (platform: string) => void;
  onCloudSyncComplete?: (data: CloudSyncData) => void;
  gameMode: 'battle-royale' | 'fps' | 'racing';
}

export const GLXYCrossPlatform: React.FC<GLXYCrossPlatformProps> = ({
  userId,
  username,
  onPlatformConnected,
  onCloudSyncComplete,
  gameMode
}) => {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'windows_pc',
      name: 'Windows PC',
      type: 'desktop',
      icon: <Monitor className="w-5 h-5" />,
      status: 'connected',
      capabilities: ['full_graphics', 'mod_support', 'mouse_keyboard', 'controller'],
      lastSync: Date.now(),
      version: '1.0.0',
      deviceInfo: {
        model: 'Custom Build',
        os: 'Windows 11',
        memory: '32GB',
        storage: '2TB SSD'
      }
    },
    {
      id: 'android_mobile',
      name: 'Android Mobile',
      type: 'mobile',
      icon: <Android className="w-5 h-5" />,
      status: 'disconnected',
      capabilities: ['touch_controls', 'gyro_controls', 'adapted_graphics'],
      lastSync: Date.now() - 3600000,
      version: '1.0.0',
      deviceInfo: {
        model: 'Samsung Galaxy S24',
        os: 'Android 14',
        memory: '12GB',
        storage: '256GB'
      }
    },
    {
      id: 'ios_mobile',
      name: 'iPhone/iPad',
      type: 'mobile',
      icon: <Apple className="w-5 h-5" />,
      status: 'connected',
      capabilities: ['touch_controls', 'gyro_controls', 'haptic_feedback'],
      lastSync: Date.now() - 1800000,
      version: '1.0.0',
      deviceInfo: {
        model: 'iPhone 15 Pro',
        os: 'iOS 17',
        memory: '8GB',
        storage: '256GB'
      }
    },
    {
      id: 'web_browser',
      name: 'Web Browser',
      type: 'web',
      icon: <Chrome className="w-5 h-5" />,
      status: 'connected',
      capabilities: ['streaming', 'lower_graphics', 'web_controls'],
      lastSync: Date.now(),
      version: '1.0.0',
      deviceInfo: {
        model: 'Chrome Browser',
        os: 'Windows 11',
        memory: 'System RAM',
        storage: 'Cloud'
      }
    },
    {
      id: 'vr_headset',
      name: 'VR Headset',
      type: 'vr',
      icon: <Gamepad2 className="w-5 h-5" />,
      status: 'disconnected',
      capabilities: ['vr_controls', 'hand_tracking', 'immersive_graphics'],
      lastSync: Date.now() - 7200000,
      version: '1.0.0',
      deviceInfo: {
        model: 'Meta Quest 3',
        os: 'Quest OS',
        memory: '8GB',
        storage: '128GB'
      }
    }
  ]);

  const [settings, setSettings] = useState<CrossPlatformSettings>({
    autoSync: true,
    syncFrequency: 15,
    syncWifiOnly: true,
    cloudSaveEnabled: true,
    crossPlatformPlay: true,
    inputRemapping: true,
    graphicsAdaptation: true,
    progressSync: true,
    settingsSync: true,
    inventorySync: true
  });

  const [cloudSyncData, setCloudSyncData] = useState<CloudSyncData>({
    totalSize: 1024 * 1024 * 1024, // 1GB
    usedSpace: 512 * 1024 * 1024, // 512MB
    lastBackup: Date.now() - 3600000,
    syncProgress: 100,
    isSyncing: false,
    conflicts: []
  });

  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [crossPlatformSessions, setCrossPlatformSessions] = useState<CrossPlatformPlaySession[]>([]);

  const [networkStatus, setNetworkStatus] = useState({
    isConnected: true,
    connectionType: 'wifi' as 'wifi' | 'cellular' | 'ethernet',
    speed: 150, // Mbps
    latency: 25, // ms
    strength: 85 // %
  });

  const [syncInProgress, setSyncInProgress] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCloudDetails, setShowCloudDetails] = useState(false);

  // Initialize cross-platform features
  useEffect(() => {
    initializeCrossPlatform();
    return () => {
      // Cleanup
    };
  }, []);

  const initializeCrossPlatform = () => {
    // Check for connected platforms
    detectPlatforms();

    // Start cloud sync if enabled
    if (settings.autoSync) {
      startCloudSync();
    }

    // Monitor network status
    monitorNetworkStatus();

    // Initialize cross-platform sessions
    initializeSessions();
  };

  const detectPlatforms = () => {
    // Simulate platform detection
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android/i.test(userAgent) && window.innerWidth > 768;

    // Update platform statuses based on current device
    setPlatforms(prev => prev.map(platform => {
      if (platform.type === 'web') {
        return { ...platform, status: 'connected', lastSync: Date.now() };
      }
      if (isMobile && platform.type === 'mobile') {
        return { ...platform, status: 'connected', lastSync: Date.now() };
      }
      return platform;
    }));
  };

  const startCloudSync = () => {
    if (!settings.cloudSaveEnabled) return;

    setSyncInProgress(true);
    setCloudSyncData(prev => ({ ...prev, isSyncing: true, syncProgress: 0 }));

    // Simulate sync progress
    const syncInterval = setInterval(() => {
      setCloudSyncData(prev => {
        const newProgress = Math.min(prev.syncProgress + 10, 100);
        if (newProgress >= 100) {
          clearInterval(syncInterval);
          setSyncInProgress(false);
          onCloudSyncComplete?.({ ...prev, isSyncing: false, syncProgress: 100, lastBackup: Date.now() });
        }
        return { ...prev, syncProgress: newProgress };
      });
    }, 200);
  };

  const monitorNetworkStatus = () => {
    const updateNetworkStatus = () => {
      // Simulate network monitoring
      setNetworkStatus({
        isConnected: navigator.onLine,
        connectionType: 'wifi',
        speed: Math.floor(Math.random() * 200) + 50,
        latency: Math.floor(Math.random() * 50) + 10,
        strength: Math.floor(Math.random() * 30) + 70
      });
    };

    updateNetworkStatus();
    setInterval(updateNetworkStatus, 5000);
  };

  const initializeSessions = () => {
    // Mock cross-platform sessions
    const mockSessions: CrossPlatformPlaySession[] = [
      {
        sessionId: 'session1',
        players: [
          {
            id: userId,
            username,
            platform: 'windows_pc',
            isHost: true,
            ping: 25,
            status: 'connected'
          },
          {
            id: 'player2',
            username: 'MobilePlayer',
            platform: 'android_mobile',
            isHost: false,
            ping: 45,
            status: 'connected'
          },
          {
            id: 'player3',
            username: 'WebGamer',
            platform: 'web_browser',
            isHost: false,
            ping: 35,
            status: 'connected'
          }
        ],
        gameMode: gameMode,
        maxPlayers: 100,
        inviteCode: 'GLXY-2025-ABC',
        isPrivate: false,
        crossPlatformEnabled: true
      }
    ];

    setCrossPlatformSessions(mockSessions);
  };

  const connectPlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(platform => {
      if (platform.id === platformId) {
        const updatedPlatform = { ...platform, status: 'syncing' as const };

        // Simulate connection process
        setTimeout(() => {
          setPlatforms(p => p.map(p =>
            p.id === platformId
              ? { ...p, status: 'connected' as const, lastSync: Date.now() }
              : p
          ));
          onPlatformConnected?.(platformId);
        }, 2000);

        return updatedPlatform;
      }
      return platform;
    }));
  };

  const disconnectPlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(platform => {
      if (platform.id === platformId) {
        return { ...platform, status: 'disconnected' as const };
      }
      return platform;
    }));
  };

  const createCrossPlatformSession = () => {
    const newSession: CrossPlatformPlaySession = {
      sessionId: Date.now().toString(),
      players: [
        {
          id: userId,
          username,
          platform: 'web_browser',
          isHost: true,
          ping: networkStatus.latency,
          status: 'connected'
        }
      ],
      gameMode,
      maxPlayers: gameMode === 'battle-royale' ? 100 : 16,
      inviteCode: generateInviteCode(),
      isPrivate: false,
      crossPlatformEnabled: settings.crossPlatformPlay
    };

    setCrossPlatformSessions(prev => [newSession, ...prev]);
  };

  const generateInviteCode = () => {
    return 'GLXY-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const joinCrossPlatformSession = (sessionId: string) => {
    // Simulate joining session
    setCrossPlatformSessions(prev => prev.map(session => {
      if (session.sessionId === sessionId) {
        return {
          ...session,
          players: [
            ...session.players,
            {
              id: userId,
              username,
              platform: 'web_browser',
              isHost: false,
              ping: networkStatus.latency,
              status: 'connected'
            }
          ]
        };
      }
      return session;
    }));
  };

  const resolveSyncConflict = (conflictId: string, resolution: 'local' | 'cloud') => {
    setCloudSyncData(prev => ({
      ...prev,
      conflicts: prev.conflicts.map(conflict =>
        conflict.id === conflictId ? { ...conflict, resolved: true } : conflict
      )
    }));
  };

  const getPlatformIcon = (platformType: string) => {
    switch (platformType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'console': return <Gamepad2 className="w-4 h-4" />;
      case 'vr': return <Gamepad2 className="w-4 h-4" />;
      case 'web': return <Globe className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'syncing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-600';
      case 'disconnected': return 'bg-red-600';
      case 'syncing': return 'bg-yellow-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Globe className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-blue-400">GLXY CROSS-PLATFORM</h1>
          <Badge className="bg-blue-600">{gameMode.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center space-x-4">
          {/* Network Status */}
          <div className="flex items-center space-x-2">
            {networkStatus.isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-300">
              {networkStatus.speed} Mbps • {networkStatus.latency}ms
            </span>
          </div>

          {/* Cloud Sync Status */}
          <div className="flex items-center space-x-2">
            {cloudSyncData.isSyncing ? (
              <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
            ) : (
              <Cloud className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm text-gray-300">
              {formatBytes(cloudSyncData.usedSpace)} / {formatBytes(cloudSyncData.totalSize)}
            </span>
          </div>

          {/* Settings */}
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="border-gray-600"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Platforms */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gray-900 border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Connected Platforms</span>
                </CardTitle>
                <Button
                  onClick={startCloudSync}
                  disabled={syncInProgress}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                >
                  {syncInProgress ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map(platform => (
                  <div key={platform.id} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center`}>
                          {platform.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{platform.name}</h3>
                          <p className="text-xs text-gray-400">{platform.deviceInfo.model}</p>
                        </div>
                      </div>
                      <Badge className={getStatusBadgeColor(platform.status)}>
                        {platform.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Version:</span>
                        <span className="text-white">{platform.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">OS:</span>
                        <span className="text-white">{platform.deviceInfo.os}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Sync:</span>
                        <span className="text-white">
                          {new Date(platform.lastSync).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {platform.capabilities.slice(0, 3).map(capability => (
                        <Badge key={capability} variant="outline" className="text-xs border-gray-600">
                          {capability.replace('_', ' ')}
                        </Badge>
                      ))}
                      {platform.capabilities.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-600">
                          +{platform.capabilities.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex space-x-2">
                      {platform.status === 'connected' ? (
                        <Button
                          size="sm"
                          onClick={() => disconnectPlatform(platform.id)}
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-900/20"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => connectPlatform(platform.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Connect
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600"
                      >
                        Settings
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cross-Platform Sessions */}
          <Card className="bg-gray-900 border-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-400 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Cross-Platform Sessions</span>
                </CardTitle>
                <Button
                  onClick={createCrossPlatformSession}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crossPlatformSessions.length > 0 ? (
                  crossPlatformSessions.map(session => (
                    <div key={session.sessionId} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{gameMode} Session</h4>
                          <p className="text-sm text-gray-400">Code: {session.inviteCode}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-600">
                            {session.players.length}/{session.maxPlayers}
                          </Badge>
                          {session.crossPlatformEnabled && (
                            <Badge className="bg-blue-600">Cross-Platform</Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-gray-400 mb-2">Players:</div>
                        <div className="space-y-2">
                          {session.players.map(player => (
                            <div key={player.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getPlatformIcon(player.platform)}
                                <span className="text-sm text-white">{player.username}</span>
                                {player.isHost && (
                                  <Badge className="bg-purple-600 text-xs">HOST</Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">{player.ping}ms</span>
                                <div className={`w-2 h-2 rounded-full ${
                                  player.status === 'connected' ? 'bg-green-500' :
                                  player.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => joinCrossPlatformSession(session.sessionId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Join Session
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600">
                          Copy Invite Code
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No active sessions</p>
                    <Button
                      onClick={createCrossPlatformSession}
                      className="mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Create New Session
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cloud Storage */}
          <Card className="bg-gray-900 border-purple-500">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5" />
                  <span>Cloud Storage</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCloudDetails(!showCloudDetails)}
                  className="text-gray-400 hover:text-white"
                >
                  <Settings className="w-3 h-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-white">
                      {formatBytes(cloudSyncData.usedSpace)} / {formatBytes(cloudSyncData.totalSize)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(cloudSyncData.usedSpace / cloudSyncData.totalSize) * 100}%` }}
                    />
                  </div>
                </div>

                {cloudSyncData.isSyncing && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Sync Progress</span>
                      <span className="text-white">{cloudSyncData.syncProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cloudSyncData.syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Last backup: {new Date(cloudSyncData.lastBackup).toLocaleString()}
                </div>

                {cloudSyncData.conflicts.length > 0 && (
                  <div className="p-2 bg-red-900/30 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-sm text-red-400">
                        {cloudSyncData.conflicts.length} Sync Conflicts
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400"
                      onClick={() => setShowCloudDetails(true)}
                    >
                      Resolve Conflicts
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-400 text-sm">Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Auto Sync</span>
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                  className="rounded"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Cross-Platform Play</span>
                <input
                  type="checkbox"
                  checked={settings.crossPlatformPlay}
                  onChange={(e) => setSettings(prev => ({ ...prev, crossPlatformPlay: e.target.checked }))}
                  className="rounded"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Graphics Adaptation</span>
                <input
                  type="checkbox"
                  checked={settings.graphicsAdaptation}
                  onChange={(e) => setSettings(prev => ({ ...prev, graphicsAdaptation: e.target.checked }))}
                  className="rounded"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Cloud Save</span>
                <input
                  type="checkbox"
                  checked={settings.cloudSaveEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, cloudSaveEnabled: e.target.checked }))}
                  className="rounded"
                />
              </label>
            </CardContent>
          </Card>

          {/* Network Info */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-400 text-sm">Network Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Connection</span>
                <span className={`font-medium ${networkStatus.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {networkStatus.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="text-white capitalize">{networkStatus.connectionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Speed</span>
                <span className="text-white">{networkStatus.speed} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Latency</span>
                <span className={`font-medium ${
                  networkStatus.latency < 30 ? 'text-green-400' :
                  networkStatus.latency < 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {networkStatus.latency}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Signal</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4].map(bar => (
                    <div
                      key={bar}
                      className={`w-1 h-3 ${
                        bar <= (networkStatus.strength / 25) ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-blue-500 w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-400">Cross-Platform Settings</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Settings */}
              <div>
                <h3 className="text-white font-semibold mb-3">Synchronization</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.autoSync}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Auto Sync</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.syncWifiOnly}
                      onChange={(e) => setSettings(prev => ({ ...prev, syncWifiOnly: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">WiFi Only</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.progressSync}
                      onChange={(e) => setSettings(prev => ({ ...prev, progressSync: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Sync Progress</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.settingsSync}
                      onChange={(e) => setSettings(prev => ({ ...prev, settingsSync: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Sync Settings</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.inventorySync}
                      onChange={(e) => setSettings(prev => ({ ...prev, inventorySync: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Sync Inventory</span>
                  </label>
                </div>
              </div>

              {/* Platform Settings */}
              <div>
                <h3 className="text-white font-semibold mb-3">Platform Features</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.crossPlatformPlay}
                      onChange={(e) => setSettings(prev => ({ ...prev, crossPlatformPlay: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Cross-Platform Play</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.inputRemapping}
                      onChange={(e) => setSettings(prev => ({ ...prev, inputRemapping: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Input Remapping</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.graphicsAdaptation}
                      onChange={(e) => setSettings(prev => ({ ...prev, graphicsAdaptation: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Graphics Adaptation</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.cloudSaveEnabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, cloudSaveEnabled: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Cloud Save</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cloud Details Modal */}
      {showCloudDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-purple-500 w-full max-w-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-400">Cloud Storage Details</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowCloudDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Storage Breakdown */}
              <div>
                <h3 className="text-white font-semibold mb-3">Storage Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Game Saves</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }} />
                      </div>
                      <span className="text-sm text-white">200 MB</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Settings</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '5%' }} />
                      </div>
                      <span className="text-sm text-white">25 MB</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Inventory & Items</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '35%' }} />
                      </div>
                      <span className="text-sm text-white">175 MB</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Replays & Clips</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '20%' }} />
                      </div>
                      <span className="text-sm text-white">100 MB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync Conflicts */}
              {cloudSyncData.conflicts.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3">Sync Conflicts</h3>
                  <div className="space-y-2">
                    {cloudSyncData.conflicts.map(conflict => (
                      <div key={conflict.id} className="p-3 bg-red-900/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">
                            {conflict.type} Conflict
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(conflict.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 mb-2">
                          Platform: {conflict.platform}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => resolveSyncConflict(conflict.id, 'local')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Use Local
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => resolveSyncConflict(conflict.id, 'cloud')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Use Cloud
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={startCloudSync}
                  disabled={syncInProgress}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                >
                  {syncInProgress ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Now
                </Button>
                <Button
                  onClick={() => setShowCloudDetails(false)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};