import { CacheScheduler, CacheStrategyManager } from './cache-strategies'
import { redis } from './redis-server'

let isInitialized = false
let initPromise: Promise<void> | null = null

export async function initializeCaching(): Promise<void> {
  if (isInitialized) {
    return
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = doInitialize()
  return initPromise
}

async function doInitialize(): Promise<void> {
  try {
    console.log('🚀 Initializing GLXY Gaming Cache System...')

    // Check Redis connection
    const isRedisHealthy = await checkRedisConnection()
    if (!isRedisHealthy) {
      console.warn('⚠️ Redis connection failed - running without cache')
      return
    }

    // Start cache warming for critical data
    console.log('🔥 Starting cache warming...')
    await CacheStrategyManager.warmCriticalData()

    // Start scheduled cache tasks
    console.log('⏰ Starting cache scheduler...')
    CacheScheduler.startScheduledTasks()

    // Set up graceful shutdown handlers
    setupGracefulShutdown()

    isInitialized = true
    console.log('✅ Cache system initialized successfully')

  } catch (error) {
    console.error('❌ Failed to initialize cache system:', error)
    // Don't throw - allow app to continue without caching
  }
}

async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis connection check failed:', error)
    return false
  }
}

function setupGracefulShutdown(): void {
  const gracefulShutdown = async (signal: string) => {
    console.log(`📤 Received ${signal}, gracefully shutting down cache system...`)

    try {
      // Stop scheduled tasks
      CacheScheduler.stopScheduledTasks()

      // Perform final cache maintenance
      await CacheStrategyManager.performMaintenance()

      // Close Redis connection
      await redis.quit()

      console.log('✅ Cache system shutdown completed')
    } catch (error) {
      console.error('❌ Error during cache shutdown:', error)
    }
  }

  // Handle different signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in cache system:', error)
    gracefulShutdown('uncaughtException')
  })
}

// Auto-initialize when this module is imported
if (typeof window === 'undefined') { // Server-side only
  initializeCaching().catch(error => {
    console.error('Auto cache initialization failed:', error)
  })
}

export { isInitialized }