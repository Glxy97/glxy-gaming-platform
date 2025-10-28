import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getRedisConfig, isRedisAvailable } from '@/lib/redis-config'

/**
 * @swagger
 * /api/admin/scaling:
 *   get:
 *     summary: Get Socket.IO scaling status and metrics
 *     description: Returns information about Redis adapter status, connected servers, and room distribution
 *     tags: [Admin, Scaling]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Scaling status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redis:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                     config:
 *                       type: object
 *                 scalingMode:
 *                   type: string
 *                   enum: [single-server, multi-server]
 *                 timestamp:
 *                   type: string
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Internal server error
 */
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

    // Check Redis availability
    const redisAvailable = await isRedisAvailable()
    const redisConfig = getRedisConfig()

    // Sanitize config (remove password)
    const sanitizedConfig = {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
      hasPassword: !!redisConfig.password
    }

    return NextResponse.json({
      success: true,
      data: {
        redis: {
          available: redisAvailable,
          config: sanitizedConfig,
          status: redisAvailable ? 'connected' : 'disconnected'
        },
        scalingMode: redisAvailable ? 'multi-server' : 'single-server',
        capabilities: {
          horizontalScaling: redisAvailable,
          roomSynchronization: redisAvailable,
          crossServerMessaging: redisAvailable,
          stickySessionsRequired: !redisAvailable
        },
        recommendations: redisAvailable
          ? [
              'Redis adapter is active',
              'System can scale horizontally',
              'Use load balancer for multiple instances'
            ]
          : [
              'Configure Redis for horizontal scaling',
              'Set REDIS_HOST and REDIS_PORT environment variables',
              'Restart server after Redis configuration'
            ],
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Admin scaling status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve scaling status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

