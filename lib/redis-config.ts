/**
 * Redis Configuration for Socket.IO Adapter
 * Enables horizontal scaling across multiple server instances
 */

import { createClient, RedisClientType } from 'redis'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db?: number
  retryStrategy?: (times: number) => number
}

// Redis connection configuration
const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times: number) => {
    // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, then cap at 3000ms
    const delay = Math.min(50 * Math.pow(2, times), 3000)
    console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${times})`)
    return delay
  }
}

let pubClient: RedisClientType | null = null
let subClient: RedisClientType | null = null

/**
 * Create Redis clients for Socket.IO adapter
 * Returns { pubClient, subClient } for use with @socket.io/redis-adapter
 */
export async function createRedisClients(): Promise<{
  pubClient: RedisClientType
  subClient: RedisClientType
} | null> {
  try {
    // Create publisher client
    pubClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        reconnectStrategy: redisConfig.retryStrategy
      },
      password: redisConfig.password,
      database: redisConfig.db
    }) as RedisClientType

    // Create subscriber client (must be separate instance)
    subClient = pubClient.duplicate() as RedisClientType

    // Error handlers
    pubClient.on('error', (err) => {
      console.error('❌ Redis Pub Client Error:', err.message)
    })

    subClient.on('error', (err) => {
      console.error('❌ Redis Sub Client Error:', err.message)
    })

    // Connection handlers
    pubClient.on('connect', () => {
      console.log('✅ Redis Pub Client connected')
    })

    subClient.on('connect', () => {
      console.log('✅ Redis Sub Client connected')
    })

    pubClient.on('ready', () => {
      console.log('🟢 Redis Pub Client ready')
    })

    subClient.on('ready', () => {
      console.log('🟢 Redis Sub Client ready')
    })

    pubClient.on('reconnecting', () => {
      console.log('🔄 Redis Pub Client reconnecting...')
    })

    subClient.on('reconnecting', () => {
      console.log('🔄 Redis Sub Client reconnecting...')
    })

    // Connect both clients
    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ])

    console.log('✅ Redis Adapter clients initialized successfully')
    console.log(`📡 Redis Server: ${redisConfig.host}:${redisConfig.port}`)

    return { pubClient, subClient }
  } catch (error) {
    console.error('❌ Failed to create Redis clients:', error)
    
    // Cleanup on failure
    if (pubClient) {
      try {
        await pubClient.quit()
      } catch (e) {
        console.error('Error closing pub client:', e)
      }
    }
    
    if (subClient) {
      try {
        await subClient.quit()
      } catch (e) {
        console.error('Error closing sub client:', e)
      }
    }
    
    return null
  }
}

/**
 * Gracefully close Redis connections
 */
export async function closeRedisClients(): Promise<void> {
  try {
    if (pubClient) {
      await pubClient.quit()
      console.log('✅ Redis Pub Client closed')
    }
    
    if (subClient) {
      await subClient.quit()
      console.log('✅ Redis Sub Client closed')
    }
  } catch (error) {
    console.error('❌ Error closing Redis clients:', error)
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const testClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: 2000
      },
      password: redisConfig.password,
      database: redisConfig.db
    })

    await testClient.connect()
    await testClient.ping()
    await testClient.quit()
    
    return true
  } catch (error) {
    console.warn('⚠️  Redis not available:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

/**
 * Get current Redis configuration
 */
export function getRedisConfig(): RedisConfig {
  return { ...redisConfig }
}

