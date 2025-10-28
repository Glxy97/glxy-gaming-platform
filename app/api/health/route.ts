
/**
 * ===================================================
 * GLXY Gaming Platform - Health Check API
 * Provides comprehensive health status for monitoring
 * ===================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis, CACHE_KEYS } from '@/lib/redis-server';

async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
}

export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now();

    // Check database connectivity
    let dbStatus = 'unknown';
    let dbResponseTime = 0;

    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStartTime;
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check Redis connectivity
    let redisStatus = 'unknown';
    try {
      redisStatus = await checkRedisHealth() ? 'healthy' : 'unhealthy';
    } catch (error) {
      redisStatus = 'unhealthy';
      console.error('Redis health check failed:', error);
    }
    
    // Check Socket.IO status
    let socketIoStatus = 'healthy';
    let activeRooms = 0;
    let activePlayers = 0;
    try {
      // Count cached rooms and online users via Redis
      const roomKeys = await redis.keys('room:v2:*');
      activeRooms = roomKeys.length;
      const online = await redis.smembers(CACHE_KEYS.ONLINE_USERS);
      activePlayers = online.length;
    } catch (error) {
      socketIoStatus = 'unhealthy';
      console.error('Socket.IO/Redis metrics error:', error);
    }
    
    // System information
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const totalResponseTime = Date.now() - startTime;
    
    // Health status
    const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy' && socketIoStatus === 'healthy';
    const status = isHealthy ? 'healthy' : 'unhealthy';
    
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: `${process.uptime()}s`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`
        },
        redis: {
          status: redisStatus
        },
        socketio: {
          status: socketIoStatus,
          activeRooms: activeRooms,
          activePlayers: activePlayers
        },
        application: {
          status: 'healthy',
          responseTime: `${totalResponseTime}ms`
        }
      },
      system: {
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        uptime: `${process.uptime()}s`,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    return NextResponse.json(
      healthData,
      { 
        status: isHealthy ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': status
        }
      }
    );
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        _error: error,
        services: {
          database: { status: 'error' },
          redis: { status: 'unknown' },
          application: { status: 'error' }
        }
      },
      { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Health-Check': 'unhealthy'
        }
      }
    );
  }
}

// Simple HEAD request for basic health check
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisHealthy = await checkRedisHealth();
    return new NextResponse(null, { status: redisHealthy ? 200 : 503 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
