'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Zap,
  Gauge,
  MapPin,
  Users,
  Clock,
  Shield,
  Target,
  Wind,
  Activity,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Sun,
  Layers
} from 'lucide-react'

interface HUDStats {
  position: { x: number; y: number; z: number }
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  speed: number
  isGrounded: boolean
  isSprinting: boolean
  isDashing: boolean
  fps: number
  objects: number
  quests: number
}

interface VehicleStats {
  position: { x: number; y: number; z: number }
  speed: number
  maxSpeed: number
  health: number
  maxHealth: number
  isDrifting: boolean
  gear: number
  rpm: number
}

interface EnhancedHUDProps {
  playerStats: HUDStats
  vehicleStats: VehicleStats
  gameConfig: any
  onTerrainChange: (terrain: string) => void
  onTimeOfDayChange: (time: string) => void
  onWeatherChange: (weather: string) => void
  controls: any
}

export default function EnhancedHUD({
  playerStats,
  vehicleStats,
  gameConfig,
  onTerrainChange,
  onTimeOfDayChange,
  onWeatherChange,
  controls
}: EnhancedHUDProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'player' | 'vehicle' | 'settings' | 'graphics'>('player')
  const [notifications, setNotifications] = useState<string[]>([])
  const [graphicsSettings, setGraphicsSettings] = useState({
    enableDynamicShadows: true,
    enableScreenSpaceReflections: true,
    enableVolumetricLighting: true,
    enableAmbientOcclusion: true,
    enableBloom: true,
    shadowQuality: 'high' as const,
    reflectionQuality: 'high' as const
  })

  // Add notifications for important events
  useEffect(() => {
    const newNotifications: string[] = []

    if (playerStats.stamina < 20 && !notifications.includes('Low Stamina')) {
      newNotifications.push('Low Stamina')
    }
    if (playerStats.health < 30 && !notifications.includes('Low Health')) {
      newNotifications.push('Low Health')
    }
    if (playerStats.isDashing && !notifications.includes('Dashing!')) {
      newNotifications.push('Dashing!')
    }
    if (vehicleStats.isDrifting && !notifications.includes('Drifting!')) {
      newNotifications.push('Drifting!')
    }

    setNotifications(newNotifications)
  }, [playerStats, vehicleStats, notifications])

  // Remove notifications after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => !['Low Stamina', 'Dashing!', 'Drifting!'].includes(n)))
    }, 3000)

    return () => clearTimeout(timer)
  }, [notifications])

  const getHealthColor = () => {
    const percentage = (playerStats.health / playerStats.maxHealth) * 100
    if (percentage > 60) return 'bg-green-500'
    if (percentage > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStaminaColor = () => {
    const percentage = (playerStats.stamina / playerStats.maxStamina) * 100
    if (percentage > 60) return 'bg-blue-500'
    if (percentage > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusIcon = () => {
    if (playerStats.isDashing) return <Wind className="w-4 h-4 text-purple-400 animate-pulse" />
    if (playerStats.isSprinting) return <Zap className="w-4 h-4 text-blue-400" />
    if (!playerStats.isGrounded) return <Activity className="w-4 h-4 text-yellow-400" />
    return <CheckCircle className="w-4 h-4 text-green-400" />
  }

  return (
    <>
      {/* Main HUD Container */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className={`absolute top-4 left-4 z-10 transition-all duration-300 ${
          isMinimized ? 'w-auto' : 'max-w-sm'
        }`}
      >
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-bold text-white">GLXY HUD</h2>
                {getStatusIcon()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700/50">
                  {['player', 'vehicle', 'settings', 'graphics'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-gaming-primary/20 text-gaming-primary border-b-2 border-gaming-primary'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab === 'player' && <Heart className="w-4 h-4 inline mr-2" />}
                      {tab === 'vehicle' && <Gauge className="w-4 h-4 inline mr-2" />}
                      {tab === 'settings' && <Settings className="w-4 h-4 inline mr-2" />}
                      {tab === 'graphics' && <Eye className="w-4 h-4 inline mr-2" />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-4">
                  {/* Player Tab */}
                  {activeTab === 'player' && (
                    <>
                      {/* Vital Stats */}
                      <div className="space-y-3">
                        {/* Health */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-red-400" />
                              <span className="text-sm font-medium text-white">Health</span>
                            </div>
                            <span className="text-xs text-gray-300">
                              {playerStats.health}/{playerStats.maxHealth}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className={`h-full transition-all duration-300 ${getHealthColor()}`}
                              style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Stamina */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-white">Stamina</span>
                            </div>
                            <span className="text-xs text-gray-300">
                              {playerStats.stamina}/{playerStats.maxStamina}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className={`h-full transition-all duration-300 ${getStaminaColor()}`}
                              style={{ width: `${(playerStats.stamina / playerStats.maxStamina) * 100}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(playerStats.stamina / playerStats.maxStamina) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Speed & Status */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>Speed</span>
                            </div>
                            <div className="text-lg font-bold text-white">
                              {playerStats.speed.toFixed(1)} m/s
                            </div>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Activity className="w-3 h-3" />
                              <span>Status</span>
                            </div>
                            <div className="text-sm font-medium">
                              <span className={playerStats.isGrounded ? 'text-green-400' : 'text-yellow-400'}>
                                {playerStats.isGrounded ? 'Grounded' : 'Airborne'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Position */}
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">Position</span>
                          </div>
                          <div className="text-xs font-mono text-white">
                            ({playerStats.position.x.toFixed(1)}, {playerStats.position.y.toFixed(1)}, {playerStats.position.z.toFixed(1)})
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Vehicle Tab */}
                  {activeTab === 'vehicle' && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-300 mb-3">
                        🚗 Vehicle Status
                      </div>

                      {/* Vehicle Health */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Health</span>
                          <span className="text-xs text-gray-300">
                            {vehicleStats.health}/{vehicleStats.maxHealth}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            className={`h-full transition-all duration-300 ${
                              vehicleStats.isDrifting ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(vehicleStats.health / vehicleStats.maxHealth) * 100}%` }}
                          />
                        </div>
                        {vehicleStats.isDrifting && (
                          <div className="text-orange-400 font-bold text-xs animate-pulse">
                            🔥 DRIFTING!
                          </div>
                        )}
                      </div>

                      {/* Vehicle Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-400 mb-1">Speed</div>
                          <div className="font-bold text-white">
                            {vehicleStats.speed.toFixed(1)} / {vehicleStats.maxSpeed}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-400 mb-1">Gear</div>
                          <div className="font-bold text-white">{vehicleStats.gear}</div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-400 mb-1">RPM</div>
                          <div className="font-bold text-white">{vehicleStats.rpm}</div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-400 mb-1">Position</div>
                          <div className="font-mono text-white">
                            ({vehicleStats.position.x.toFixed(0)}, {vehicleStats.position.z.toFixed(0)})
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-300 mb-3">
                        ⚙️ World Settings
                      </div>

                      {/* Terrain Type */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Terrain</label>
                        <select
                          value={gameConfig.terrainType}
                          onChange={(e) => onTerrainChange(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 focus:border-gaming-primary focus:outline-none"
                        >
                          <option value="grassland">🌿 Grassland</option>
                          <option value="desert">🏜️ Desert</option>
                          <option value="snow">❄️ Snow</option>
                          <option value="forest">🌲 Forest</option>
                          <option value="city">🏙️ City</option>
                        </select>
                      </div>

                      {/* Time of Day */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Time</label>
                        <select
                          value={gameConfig.timeOfDay}
                          onChange={(e) => onTimeOfDayChange(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 focus:border-gaming-primary focus:outline-none"
                        >
                          <option value="day">☀️ Day</option>
                          <option value="sunset">🌅 Sunset</option>
                          <option value="night">🌙 Night</option>
                          <option value="dawn">🌄 Dawn</option>
                        </select>
                      </div>

                      {/* Weather */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Weather</label>
                        <select
                          value={gameConfig.weather}
                          onChange={(e) => onWeatherChange(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 focus:border-gaming-primary focus:outline-none"
                        >
                          <option value="clear">☀️ Clear</option>
                          <option value="rain">🌧️ Rain</option>
                          <option value="snow">❄️ Snow</option>
                          <option value="fog">🌫️ Fog</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Graphics Tab */}
                  {activeTab === 'graphics' && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-300 mb-3">
                        🎨 Advanced Graphics
                      </div>

                      {/* Graphics Toggles */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-gray-300">Dynamic Shadows</span>
                          </div>
                          <button
                            onClick={() => {
                              const newValue = !graphicsSettings.enableDynamicShadows
                              setGraphicsSettings(prev => ({ ...prev, enableDynamicShadows: newValue }))
                              // Trigger global graphics update
                              window.dispatchEvent(new CustomEvent('graphicsUpdate', {
                                detail: { enableDynamicShadows: newValue }
                              }))
                            }}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              graphicsSettings.enableDynamicShadows ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              graphicsSettings.enableDynamicShadows ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-300">Screen Space Reflections</span>
                          </div>
                          <button
                            onClick={() => {
                              const newValue = !graphicsSettings.enableScreenSpaceReflections
                              setGraphicsSettings(prev => ({ ...prev, enableScreenSpaceReflections: newValue }))
                              window.dispatchEvent(new CustomEvent('graphicsUpdate', {
                                detail: { enableScreenSpaceReflections: newValue }
                              }))
                            }}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              graphicsSettings.enableScreenSpaceReflections ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              graphicsSettings.enableScreenSpaceReflections ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-gray-300">Volumetric Lighting</span>
                          </div>
                          <button
                            onClick={() => {
                              const newValue = !graphicsSettings.enableVolumetricLighting
                              setGraphicsSettings(prev => ({ ...prev, enableVolumetricLighting: newValue }))
                              window.dispatchEvent(new CustomEvent('graphicsUpdate', {
                                detail: { enableVolumetricLighting: newValue }
                              }))
                            }}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              graphicsSettings.enableVolumetricLighting ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              graphicsSettings.enableVolumetricLighting ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-gray-300">Ambient Occlusion</span>
                          </div>
                          <button
                            onClick={() => {
                              const newValue = !graphicsSettings.enableAmbientOcclusion
                              setGraphicsSettings(prev => ({ ...prev, enableAmbientOcclusion: newValue }))
                              window.dispatchEvent(new CustomEvent('graphicsUpdate', {
                                detail: { enableAmbientOcclusion: newValue }
                              }))
                            }}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              graphicsSettings.enableAmbientOcclusion ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              graphicsSettings.enableAmbientOcclusion ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-pink-400" />
                            <span className="text-sm text-gray-300">Bloom Effect</span>
                          </div>
                          <button
                            onClick={() => {
                              const newValue = !graphicsSettings.enableBloom
                              setGraphicsSettings(prev => ({ ...prev, enableBloom: newValue }))
                              window.dispatchEvent(new CustomEvent('graphicsUpdate', {
                                detail: { enableBloom: newValue }
                              }))
                            }}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              graphicsSettings.enableBloom ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              graphicsSettings.enableBloom ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Quality Settings */}
                      <div className="space-y-2 pt-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Shadow Quality</label>
                          <select
                            value={graphicsSettings.shadowQuality}
                            onChange={(e) => {
                              const newValue = e.target.value as any
                              setGraphicsSettings(prev => ({ ...prev, shadowQuality: newValue }))
                              window.dispatchEvent(new CustomEvent('graphicsUpdate', {
                                detail: { shadowQuality: newValue }
                              }))
                            }}
                            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 focus:border-gaming-primary focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="ultra">Ultra</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Reflection Quality</label>
                          <select
                            value={graphicsSettings.reflectionQuality}
                            onChange={(e) => {
                              const newValue = e.target.value as any
                              setGraphicsSettings(prev => ({ ...prev, reflectionQuality: newValue }))
                              window.dispatchEvent(new CustomEvent('graphicsUpdate', {
                                detail: { reflectionQuality: newValue }
                              }))
                            }}
                            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 focus:border-gaming-primary focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      {/* Graphics Info */}
                      <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-300">
                        <p className="font-medium text-white mb-1">Graphics Controls:</p>
                        <div className="space-y-1">
                          <div>G - Toggle all graphics</div>
                          <div>1 - Toggle shadows</div>
                          <div>2 - Toggle reflections</div>
                          <div>3 - Toggle volumetric lighting</div>
                          <div>4 - Toggle bloom</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Notifications */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={`${notification}-${index}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50"
            >
              <div className="flex items-center gap-2">
                {notification === 'Low Stamina' && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                {notification === 'Low Health' && <AlertCircle className="w-4 h-4 text-red-400" />}
                {notification === 'Dashing!' && <Wind className="w-4 h-4 text-purple-400 animate-pulse" />}
                {notification === 'Drifting!' && <Zap className="w-4 h-4 text-orange-400 animate-pulse" />}
                <span className="text-sm text-white font-medium">{notification}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Performance Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute bottom-4 left-4 z-10"
      >
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50">
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                playerStats.fps >= 50 ? 'bg-green-500' :
                playerStats.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-gray-300">FPS:</span>
              <span className="text-white font-medium">{playerStats.fps}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-gray-300">Objects:</span>
              <span className="text-white font-medium">{playerStats.objects}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-gray-300">Quests:</span>
              <span className="text-white font-medium">{playerStats.quests}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls Help - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-4 right-4 z-10"
      >
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50 max-w-xs">
          <div className="text-center">
            <p className="text-gaming-primary font-bold text-sm mb-2">🎮 Enhanced Controls</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
              <div>W/↑ - Forward</div>
              <div>S/↓ - Back</div>
              <div>A/← - Left</div>
              <div>D/→ - Right</div>
              <div>Space - Jump</div>
              <div>Shift - Run</div>
              <div>Ctrl - Sprint</div>
              <div>Q - Dash</div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}