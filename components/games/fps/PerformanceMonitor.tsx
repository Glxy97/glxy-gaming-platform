// @ts-nocheck
'use client'

import React, { useEffect, useState } from 'react'
// import { PerformanceMonitor, PerformanceMetrics } from '@/lib/game/performance-monitor'

// Define interfaces locally since the import is missing
interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  entities: number;
  timestamp: number;
}

interface PerformanceMonitor {
  getMetrics(): PerformanceMetrics;
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

interface PerformanceMonitorComponentProps {
  monitor: PerformanceMonitor
  visible: boolean
  className?: string
}

export function PerformanceMonitorComponent({ 
  monitor, 
  visible, 
  className 
}: PerformanceMonitorComponentProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(monitor.getMetrics())

  useEffect(() => {
    if (!visible) return

    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics())
    }, 100)

    return () => clearInterval(interval)
  }, [monitor, visible])

  if (!visible) return null

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  
  return (
    <div className={`fixed top-4 left-4 z-20 ${className}`}>
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-gray-600 font-mono text-xs">
        <div className="text-white space-y-1">
          <div className="text-yellow-400 font-bold mb-2">PERFORMANCE MONITOR</div>
          
          <div className="flex justify-between">
            <span>FPS:</span>
            <span className={getFPSColor(metrics.fps)}>{metrics.fps}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Frame Time:</span>
            <span className={metrics.frameTime > 33 ? 'text-yellow-400' : 'text-green-400'}>
              {metrics.frameTime}ms
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className="text-gray-300">
              {metrics.memoryUsage}MB
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Draw Calls:</span>
            <span className="text-gray-300">{metrics.drawCalls}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Triangles:</span>
            <span className="text-gray-300">{metrics.triangles.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Entities:</span>
            <span className="text-gray-300">{metrics.entities}</span>
          </div>
        </div>
      </div>
    </div>
  )
}