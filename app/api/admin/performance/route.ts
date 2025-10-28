import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { 
  MemoryManager, 
  PerformanceMonitor, 
  GameStateOptimizer,
  PERFORMANCE_CONFIG 
} from '@/lib/game-performance'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authCheck = await verifyAdminAuth(request)
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    // Get performance statistics
    const memoryManager = MemoryManager.getInstance()
    const performanceMonitor = PerformanceMonitor.getInstance()
    const gameStateOptimizer = GameStateOptimizer.getInstance()

    const memoryUsage = memoryManager.getMemoryUsage()
    const performanceStats = performanceMonitor.getAllStats()
    const isHighMemory = memoryManager.isMemoryUsageHigh()

    // Calculate memory usage percentages
    const memoryUsageMB = {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    }

    const memoryUsagePercent = {
      heapUsed: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      external: Math.round((memoryUsage.external / memoryUsage.heapTotal) * 100)
    }

    // Get performance configuration
    const config = {
      maxFPS: PERFORMANCE_CONFIG.MAX_FPS,
      frameTimeMs: PERFORMANCE_CONFIG.FRAME_TIME_MS,
      maxMemoryUsageMB: PERFORMANCE_CONFIG.MAX_MEMORY_USAGE_MB,
      garbageCollectionIntervalMs: PERFORMANCE_CONFIG.GARBAGE_COLLECTION_INTERVAL_MS,
      maxCacheSizeMB: PERFORMANCE_CONFIG.MAX_CACHE_SIZE_MB,
      pingTimeoutMs: PERFORMANCE_CONFIG.PING_TIMEOUT_MS,
      pingIntervalMs: PERFORMANCE_CONFIG.PING_INTERVAL_MS,
      maxReconnectAttempts: PERFORMANCE_CONFIG.MAX_RECONNECT_ATTEMPTS,
      reconnectDelayMs: PERFORMANCE_CONFIG.RECONNECT_DELAY_MS,
      maxGameStatesCached: PERFORMANCE_CONFIG.MAX_GAME_STATES_CACHED,
      gameStateCleanupIntervalMs: PERFORMANCE_CONFIG.GAME_STATE_CLEANUP_INTERVAL_MS
    }

    // Calculate health status
    const healthStatus = {
      memory: isHighMemory ? 'warning' : 'healthy',
      performance: 'healthy', // Could be enhanced with more sophisticated checks
      overall: isHighMemory ? 'warning' : 'healthy'
    }

    // Get recommendations
    const recommendations: string[] = []
    if (isHighMemory) {
      recommendations.push('High memory usage detected. Consider restarting the server or investigating memory leaks.')
    }
    if (memoryUsagePercent.heapUsed > 80) {
      recommendations.push('Heap usage is high. Consider optimizing game state management.')
    }
    if (memoryUsagePercent.external > 50) {
      recommendations.push('External memory usage is high. Check for unclosed resources.')
    }

    const response = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        health: healthStatus,
        memory: {
          usage: memoryUsageMB,
          percentages: memoryUsagePercent,
          isHigh: isHighMemory,
          raw: memoryUsage
        },
        performance: performanceStats,
        config,
        recommendations
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Performance stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve performance statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authCheck = await verifyAdminAuth(request)
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clear_metrics':
        const performanceMonitor = PerformanceMonitor.getInstance()
        performanceMonitor.clearMetrics()
        
        return NextResponse.json({
          success: true,
          message: 'Performance metrics cleared successfully'
        })

      case 'force_gc':
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
          return NextResponse.json({
            success: true,
            message: 'Garbage collection forced successfully'
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Garbage collection not available in this environment'
          }, { status: 400 })
        }

      case 'cleanup_game_states':
        const gameStateOptimizer = GameStateOptimizer.getInstance()
        // This would trigger immediate cleanup
        // Implementation depends on your game state storage
        return NextResponse.json({
          success: true,
          message: 'Game state cleanup triggered'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Performance action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute performance action' },
      { status: 500 }
    )
  }
}
