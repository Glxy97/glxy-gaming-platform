// @ts-nocheck
/**
 * Game Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing game engine performance including:
 * - Frame rate limiting
 * - Memory leak prevention
 * - WebSocket reconnection logic
 * - Performance monitoring
 */

import { Server as ServerIO, Socket } from 'socket.io'
import { CacheManager } from './cache-manager'

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Frame rate limiting
  MAX_FPS: 60,
  FRAME_TIME_MS: 1000 / 60, // ~16.67ms per frame
  
  // Memory management
  MAX_MEMORY_USAGE_MB: 512,
  GARBAGE_COLLECTION_INTERVAL_MS: 30000, // 30 seconds
  MAX_CACHE_SIZE_MB: 100,
  
  // WebSocket optimization
  PING_TIMEOUT_MS: 30000,
  PING_INTERVAL_MS: 25000,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 1000,
  
  // Game state optimization
  MAX_GAME_STATES_CACHED: 100,
  GAME_STATE_CLEANUP_INTERVAL_MS: 60000, // 1 minute
}

// Frame rate limiter
export class FrameRateLimiter {
  private lastFrameTime = 0
  private frameCount = 0
  private fps = 0
  private lastFpsUpdate = 0

  /**
   * Check if enough time has passed for the next frame
   */
  canRender(): boolean {
    const now = Date.now()
    const deltaTime = now - this.lastFrameTime
    
    if (deltaTime >= PERFORMANCE_CONFIG.FRAME_TIME_MS) {
      this.lastFrameTime = now
      this.updateFPS()
      return true
    }
    
    return false
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * Update FPS calculation
   */
  private updateFPS(): void {
    this.frameCount++
    const now = Date.now()
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFpsUpdate = now
    }
  }

  /**
   * Force frame rate limit by sleeping if necessary
   */
  async enforceFrameRate(): Promise<void> {
    const now = Date.now()
    const deltaTime = now - this.lastFrameTime
    
    if (deltaTime < PERFORMANCE_CONFIG.FRAME_TIME_MS) {
      const sleepTime = PERFORMANCE_CONFIG.FRAME_TIME_MS - deltaTime
      await new Promise(resolve => setTimeout(resolve, sleepTime))
    }
  }
}

// Memory leak prevention
export class MemoryManager {
  private static instance: MemoryManager
  private cleanupInterval: NodeJS.Timeout | null = null
  private memoryUsage: NodeJS.MemoryUsage | null = null

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  /**
   * Start memory monitoring and cleanup
   */
  startMonitoring(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, PERFORMANCE_CONFIG.GARBAGE_COLLECTION_INTERVAL_MS)
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): NodeJS.MemoryUsage {
    this.memoryUsage = process.memoryUsage()
    return this.memoryUsage
  }

  /**
   * Check if memory usage is too high
   */
  isMemoryUsageHigh(): boolean {
    const usage = this.getMemoryUsage()
    const usageMB = usage.heapUsed / 1024 / 1024
    return usageMB > PERFORMANCE_CONFIG.MAX_MEMORY_USAGE_MB
  }

  /**
   * Perform memory cleanup
   */
  private async performCleanup(): Promise<void> {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      // Clean up old game states
      await this.cleanupOldGameStates()

      // Clean up cache if memory usage is high
      if (this.isMemoryUsageHigh()) {
        await this.cleanupCache()
      }

      console.log('Memory cleanup completed')
    } catch (error) {
      console.error('Memory cleanup failed:', error)
    }
  }

  /**
   * Clean up old game states from cache
   */
  private async cleanupOldGameStates(): Promise<void> {
    try {
      // This would need to be implemented based on your cache structure
      // For now, we'll just log that cleanup would happen
      console.log('Cleaning up old game states...')
    } catch (error) {
      console.error('Failed to cleanup old game states:', error)
    }
  }

  /**
   * Clean up cache to reduce memory usage
   */
  private async cleanupCache(): Promise<void> {
    try {
      // Clear least recently used items from cache
      console.log('Cleaning up cache due to high memory usage...')
      // Implementation would depend on your cache structure
    } catch (error) {
      console.error('Failed to cleanup cache:', error)
    }
  }
}

// WebSocket reconnection manager
export class WebSocketReconnectionManager {
  private reconnectAttempts = new Map<string, number>()
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnection(socketId: string, socket: Socket): void {
    const attempts = this.reconnectAttempts.get(socketId) || 0
    
    if (attempts < PERFORMANCE_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      const delay = PERFORMANCE_CONFIG.RECONNECT_DELAY_MS * Math.pow(2, attempts)
      
      console.log(`Scheduling reconnection for socket ${socketId} in ${delay}ms (attempt ${attempts + 1})`)
      
      const timeout = setTimeout(() => {
        this.attemptReconnection(socketId, socket)
      }, delay)
      
      this.reconnectTimeouts.set(socketId, timeout)
      this.reconnectAttempts.set(socketId, attempts + 1)
    } else {
      console.log(`Max reconnection attempts reached for socket ${socketId}`)
      this.cleanup(socketId)
    }
  }

  /**
   * Attempt to reconnect a socket
   */
  private attemptReconnection(socketId: string, socket: Socket): void {
    try {
      // Emit reconnection event to client
      socket.emit('reconnect_attempt', {
        attempt: this.reconnectAttempts.get(socketId) || 0,
        maxAttempts: PERFORMANCE_CONFIG.MAX_RECONNECT_ATTEMPTS
      })
      
      // The actual reconnection logic would be handled by the client
      // This is just for server-side tracking
    } catch (error) {
      console.error(`Reconnection attempt failed for socket ${socketId}:`, error)
      this.handleDisconnection(socketId, socket)
    }
  }

  /**
   * Handle successful reconnection
   */
  handleReconnection(socketId: string): void {
    console.log(`Socket ${socketId} reconnected successfully`)
    this.cleanup(socketId)
  }

  /**
   * Clean up reconnection tracking for a socket
   */
  private cleanup(socketId: string): void {
    const timeout = this.reconnectTimeouts.get(socketId)
    if (timeout) {
      clearTimeout(timeout)
      this.reconnectTimeouts.delete(socketId)
    }
    this.reconnectAttempts.delete(socketId)
  }

  /**
   * Get reconnection status for a socket
   */
  getReconnectionStatus(socketId: string): { attempts: number; maxAttempts: number } {
    return {
      attempts: this.reconnectAttempts.get(socketId) || 0,
      maxAttempts: PERFORMANCE_CONFIG.MAX_RECONNECT_ATTEMPTS
    }
  }
}

// Performance monitor
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics = new Map<string, number[]>()
  private eventTimes = new Map<string, number>()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start timing an event
   */
  startTiming(eventName: string): void {
    this.eventTimes.set(eventName, Date.now())
  }

  /**
   * End timing an event and record the duration
   */
  endTiming(eventName: string): number {
    const startTime = this.eventTimes.get(eventName)
    if (!startTime) {
      console.warn(`No start time found for event: ${eventName}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.recordEvent(eventName, duration)
    this.eventTimes.delete(eventName)
    
    return duration
  }

  /**
   * Record an event with duration
   */
  recordEvent(eventName: string, duration: number): void {
    if (!this.metrics.has(eventName)) {
      this.metrics.set(eventName, [])
    }

    const eventMetrics = this.metrics.get(eventName)!
    eventMetrics.push(duration)

    // Keep only last 100 measurements
    if (eventMetrics.length > 100) {
      eventMetrics.shift()
    }
  }

  /**
   * Get performance statistics for an event
   */
  getStats(eventName: string): {
    count: number
    average: number
    min: number
    max: number
    p95: number
  } | null {
    const eventMetrics = this.metrics.get(eventName)
    if (!eventMetrics || eventMetrics.length === 0) {
      return null
    }

    const sorted = [...eventMetrics].sort((a, b) => a - b)
    const count = sorted.length
    const average = sorted.reduce((sum, val) => sum + val, 0) / count
    const min = sorted[0]
    const max = sorted[count - 1]
    const p95Index = Math.floor(count * 0.95)
    const p95 = sorted[p95Index]

    return { count, average, min, max, p95 }
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [eventName] of this.metrics) {
      stats[eventName] = this.getStats(eventName)
    }
    
    return stats
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear()
    this.eventTimes.clear()
  }
}

// Game state optimizer
export class GameStateOptimizer {
  private static instance: GameStateOptimizer
  private cleanupInterval: NodeJS.Timeout | null = null

  static getInstance(): GameStateOptimizer {
    if (!GameStateOptimizer.instance) {
      GameStateOptimizer.instance = new GameStateOptimizer()
    }
    return GameStateOptimizer.instance
  }

  /**
   * Start game state cleanup
   */
  startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldGameStates()
    }, PERFORMANCE_CONFIG.GAME_STATE_CLEANUP_INTERVAL_MS)
  }

  /**
   * Stop game state cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Clean up old game states
   */
  private async cleanupOldGameStates(): Promise<void> {
    try {
      // This would need to be implemented based on your game state storage
      // For now, we'll just log that cleanup would happen
      console.log('Cleaning up old game states...')
    } catch (error) {
      console.error('Failed to cleanup old game states:', error)
    }
  }

  /**
   * Optimize game state before sending
   */
  optimizeGameState(gameState: any): any {
    // Remove unnecessary data, compress if needed
    // This is a placeholder - implement based on your game state structure
    return gameState
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  const memoryManager = MemoryManager.getInstance()
  const gameStateOptimizer = GameStateOptimizer.getInstance()
  
  memoryManager.startMonitoring()
  gameStateOptimizer.startCleanup()
  
  console.log('Performance monitoring initialized')
}

// Cleanup on process exit
process.on('SIGINT', () => {
  const memoryManager = MemoryManager.getInstance()
  const gameStateOptimizer = GameStateOptimizer.getInstance()
  
  memoryManager.stopMonitoring()
  gameStateOptimizer.stopCleanup()
  
  console.log('Performance monitoring stopped')
})
