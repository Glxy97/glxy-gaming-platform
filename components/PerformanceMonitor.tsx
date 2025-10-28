'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface PerformanceStats {
  gameStats: Record<string, any>
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
  }
  fps: number
  reconnectionStatus: {
    attempts: number
    maxAttempts: number
  }
}

interface PerformanceMonitorProps {
  socket?: Socket
  showDetails?: boolean
  className?: string
}

export default function PerformanceMonitor({ 
  socket, 
  showDetails = false, 
  className = '' 
}: PerformanceMonitorProps) {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!socket) return

    // Request performance stats every 5 seconds
    const requestStats = () => {
      socket.emit('get_performance_stats')
    }

    // Listen for performance stats
    const handlePerformanceStats = (data: PerformanceStats) => {
      setStats(data)
      setLastUpdate(new Date())
    }

    // Listen for pong responses
    const handlePong = (data: any) => {
      setStats(prev => prev ? {
        ...prev,
        memoryUsage: data.memoryUsage,
        fps: data.fps
      } : null)
    }

    socket.on('performance_stats', handlePerformanceStats)
    socket.on('pong', handlePong)

    // Start requesting stats
    intervalRef.current = setInterval(requestStats, 5000)
    requestStats() // Initial request

    return () => {
      socket.off('performance_stats', handlePerformanceStats)
      socket.off('pong', handlePong)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [socket])

  // Ping the server periodically
  useEffect(() => {
    if (!socket) return

    const pingInterval = setInterval(() => {
      socket.emit('ping')
    }, 10000) // Ping every 10 seconds

    return () => clearInterval(pingInterval)
  }, [socket])

  if (!stats) {
    return null
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatMemoryUsage = (usage: number) => {
    return formatBytes(usage)
  }

  const getMemoryColor = (usage: number, total: number) => {
    const percentage = (usage / total) * 100
    if (percentage > 90) return 'text-red-500'
    if (percentage > 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getFPSColor = (fps: number) => {
    if (fps < 30) return 'text-red-500'
    if (fps < 50) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg transition-colors"
        title="Performance Monitor"
      >
        📊 {stats.fps} FPS
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-gray-900 text-white p-4 rounded-lg shadow-xl min-w-80 max-w-96">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* FPS Display */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">FPS</span>
              <span className={`text-lg font-bold ${getFPSColor(stats.fps)}`}>
                {stats.fps}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((stats.fps / 60) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Heap Used</span>
                <span className={getMemoryColor(stats.memoryUsage.heapUsed, stats.memoryUsage.heapTotal)}>
                  {formatMemoryUsage(stats.memoryUsage.heapUsed)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Heap Total</span>
                <span>{formatMemoryUsage(stats.memoryUsage.heapTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>External</span>
                <span>{formatMemoryUsage(stats.memoryUsage.external)}</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((stats.memoryUsage.heapUsed / stats.memoryUsage.heapTotal) * 100, 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Reconnection Status */}
          {stats.reconnectionStatus.attempts > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Connection Status</h4>
              <div className="text-xs text-yellow-400">
                Reconnecting... ({stats.reconnectionStatus.attempts}/{stats.reconnectionStatus.maxAttempts})
              </div>
            </div>
          )}

          {/* Game Stats */}
          {showDetails && Object.keys(stats.gameStats).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Game Performance</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(stats.gameStats).map(([eventName, eventStats]) => (
                  <div key={eventName} className="text-xs">
                    <div className="flex justify-between">
                      <span className="truncate">{eventName}</span>
                      <span>{eventStats?.average?.toFixed(1)}ms</span>
                    </div>
                    <div className="text-gray-400">
                      Count: {eventStats?.count} | P95: {eventStats?.p95?.toFixed(1)}ms
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-xs text-gray-400 text-center">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
