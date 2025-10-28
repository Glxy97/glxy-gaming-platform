/**
 * Test Script: Verify Redis null-safety implementation
 *
 * Tests:
 * 1. Import from redis-server works
 * 2. Null-safety in auth-security.ts
 * 3. Redis connection status check
 */

import { redis } from './lib/redis-server'
import { checkLoginRateLimit } from './lib/auth-security'

async function testRedisImport() {
  console.log('\n=== TEST 1: Redis Import ===')
  console.log('Redis client:', redis ? 'OK' : 'NULL')
  console.log('Redis status:', redis?.status || 'N/A')
  console.log('Redis constructor:', redis?.constructor.name || 'N/A')
}

async function testNullSafety() {
  console.log('\n=== TEST 2: Null-Safety in checkLoginRateLimit ===')

  try {
    // Test with a mock IP address
    const testIp = '127.0.0.1'
    console.log(`Testing rate limit for IP: ${testIp}`)

    const result = await checkLoginRateLimit(testIp)
    console.log('Result:', JSON.stringify(result, null, 2))

    if (result.allowed) {
      console.log('PASS: Request allowed (expected when Redis is not connected)')
    } else {
      console.log('FAIL: Request blocked unexpectedly')
    }
  } catch (error) {
    console.error('FAIL: Error during rate limit check:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

async function testRedisConnection() {
  console.log('\n=== TEST 3: Redis Connection Status ===')

  if (!redis) {
    console.log('SKIP: Redis client is null')
    return
  }

  try {
    const status = redis.status
    console.log('Redis status:', status)

    if (status === 'ready') {
      console.log('PASS: Redis is ready')

      // Try a ping
      const pong = await redis.ping()
      console.log('PING response:', pong)
    } else if (status === 'connect' || status === 'connecting') {
      console.log('INFO: Redis is connecting...')
    } else {
      console.log('INFO: Redis not ready (status:', status, ')')
      console.log('This is expected if Redis server is not running')
    }
  } catch (error) {
    console.log('INFO: Redis connection error (expected if server not running)')
    console.log('Error:', error instanceof Error ? error.message : String(error))
  }
}

async function runTests() {
  console.log('=================================================')
  console.log('Redis Null-Safety Test Suite')
  console.log('=================================================')

  await testRedisImport()
  await testNullSafety()
  await testRedisConnection()

  console.log('\n=================================================')
  console.log('Test Suite Complete')
  console.log('=================================================\n')
}

// Run tests
runTests().catch(error => {
  console.error('FATAL ERROR:', error)
  process.exit(1)
})
