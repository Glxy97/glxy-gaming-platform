/**
 * ===================================================
 * Advanced Monitoring and Error Handling for GLXY Gaming
 * Real-time metrics and alerting system
 * ===================================================
 */

import { CacheManager, CACHE_KEYS } from './redis'
import * as Sentry from '@sentry/nextjs'

export interface MetricData {
  timestamp: number
  value: number
  tags?: Record<string, string>
  metadata?: Record<string, any>
}

export interface HealthMetrics {
  cpu: number
  memory: number
  activeConnections: number
  redisLatency: number
  dbLatency: number
  errorRate: number
}

export class MonitoringService {
  
  /**
   * Real-time metrics collection for gaming platform
   */
  static async recordMetric(metricName: string, value: number, tags: Record<string, string> = {}) {
    const timestamp = Date.now()
    const metricKey = `metrics:${metricName}:${Math.floor(timestamp / 60000)}` // 1-minute buckets
    
    try {
      // Store metric with tags
      const metricData: MetricData = {
        timestamp,
        value,
        tags,
        metadata: {
          host: process.env.HOSTNAME || 'unknown',
          version: process.env.npm_package_version || '1.0.0'
        }
      }
      
      // Use Redis for fast metric storage
      await CacheManager.lpush(metricKey, metricData)
      // Note: Expiry is handled by CacheManager implementation
      
      // Update aggregated metrics
      await this.updateAggregatedMetrics(metricName, value, tags)
      
    } catch (error) {
      console.error('Failed to record metric:', error)
      Sentry.captureException(error)
    }
  }

  /**
   * Socket.IO specific metrics
   */
  static async recordSocketMetric(event: 'connection' | 'disconnection' | 'message' | 'error', metadata?: any) {
    const key = CACHE_KEYS.SOCKET_METRICS
    const timestamp = Date.now()
    
    await CacheManager.lpush(key, {
      event,
      timestamp,
      metadata: metadata || {}
    })

    // Note: List trimming is handled by CacheManager implementation
    
    // Update counters
    await CacheManager.incr(`socket:${event}:count`, 300) // 5-minute TTL
  }

  /**
   * API performance monitoring
   */
  static async recordAPICall(
    endpoint: string, 
    method: string, 
    statusCode: number,
    responseTime: number,
    userId?: string
  ) {
    const metricKey = CACHE_KEYS.API_METRICS(endpoint)
    
    // Record individual call
    await CacheManager.lpush(metricKey, {
      method,
      statusCode,
      responseTime,
      timestamp: Date.now(),
      userId: userId || 'anonymous'
    })

    // Note: List trimming is handled by CacheManager implementation

    // Update performance counters
    await this.recordMetric('api.response_time', responseTime, {
      endpoint,
      method,
      status: statusCode.toString()
    })
    
    // Track error rates
    if (statusCode >= 400) {
      await this.recordMetric('api.errors', 1, {
        endpoint,
        method,
        status: statusCode.toString()
      })
    }
  }

  /**
   * Game-specific metrics for real-time monitoring
   */
  static async recordGameEvent(
    gameType: string,
    event: 'game_start' | 'game_end' | 'move' | 'timeout' | 'disconnect',
    metadata: Record<string, any> = {}
  ) {
    await this.recordMetric(`game.${event}`, 1, {
      game_type: gameType,
      ...metadata
    })
    
    // Special handling for game duration
    if (event === 'game_end' && metadata.duration) {
      await this.recordMetric('game.duration', metadata.duration, {
        game_type: gameType,
        result: metadata.result || 'unknown'
      })
    }
  }

  /**
   * Real-time health check with detailed metrics
   */
  static async getHealthMetrics(): Promise<HealthMetrics> {
    const memoryUsage = process.memoryUsage()
    
    // CPU usage (approximation)
    const cpuUsage = process.cpuUsage()
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / process.uptime() * 100
    
    // Cache latency test
    const redisStart = Date.now()
    await CacheManager.get('monitoring:ping:test')
    const redisLatency = Date.now() - redisStart
    
    // Active Socket.IO connections
    const activeConnections = await CacheManager.get<number>('socket:active:count') || 0
    
    // Error rate (last 5 minutes)
    const errorCount = await CacheManager.get<number>('api:errors:5m') || 0
    const totalRequests = await CacheManager.get<number>('api:requests:5m') || 1
    const errorRate = (errorCount / totalRequests) * 100
    
    const metrics: HealthMetrics = {
      cpu: Math.round(cpuPercent * 100) / 100,
      memory: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100 * 100) / 100,
      activeConnections,
      redisLatency,
      dbLatency: 0, // To be measured by caller
      errorRate: Math.round(errorRate * 100) / 100
    }
    
    // Store for trend analysis
    await CacheManager.set('health:current', metrics, 300) // 5-minute TTL
    
    return metrics
  }

  /**
   * Alert system for critical events
   */
  static async checkAlerts() {
    const metrics = await this.getHealthMetrics()
    const alerts: Array<{ level: string; message: string; metric: string; value: number }> = []
    
    // High error rate
    if (metrics.errorRate > 5) {
      alerts.push({
        level: 'critical',
        message: `High error rate: ${metrics.errorRate}%`,
        metric: 'error_rate',
        value: metrics.errorRate
      })
    }
    
    // High memory usage
    if (metrics.memory > 85) {
      alerts.push({
        level: 'warning',
        message: `High memory usage: ${metrics.memory}%`,
        metric: 'memory',
        value: metrics.memory
      })
    }
    
    // High Redis latency
    if (metrics.redisLatency > 100) {
      alerts.push({
        level: 'warning',
        message: `High Redis latency: ${metrics.redisLatency}ms`,
        metric: 'redis_latency',
        value: metrics.redisLatency
      })
    }
    
    // Too many active connections
    if (metrics.activeConnections > 1000) {
      alerts.push({
        level: 'warning',
        message: `Too many connections: ${metrics.activeConnections}`,
        metric: 'connections',
        value: metrics.activeConnections
      })
    }
    
    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(alerts)
    }
    
    return alerts
  }

  /**
   * Performance analytics for game optimization
   */
  static async getGameAnalytics(gameType: string, timeRange: '1h' | '24h' | '7d') {
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeRange]
    
    const since = Date.now() - timeRangeMs
    
    // Get metrics from Redis
    const gamesStarted = await this.getMetricSum(`game.game_start`, since, { game_type: gameType })
    const gamesCompleted = await this.getMetricSum(`game.game_end`, since, { game_type: gameType })
    const avgDuration = await this.getMetricAvg(`game.duration`, since, { game_type: gameType })
    const disconnections = await this.getMetricSum(`game.disconnect`, since, { game_type: gameType })
    
    return {
      gamesStarted,
      gamesCompleted,
      completionRate: gamesStarted > 0 ? Math.round((gamesCompleted / gamesStarted) * 100) : 0,
      avgDuration: Math.round(avgDuration || 0),
      disconnectionRate: gamesCompleted > 0 ? Math.round((disconnections / gamesCompleted) * 100) : 0,
      timeRange
    }
  }

  private static async updateAggregatedMetrics(metricName: string, value: number, tags: Record<string, string>) {
    const now = Date.now()
    const hour = Math.floor(now / 3600000) // 1-hour buckets
    const day = Math.floor(now / 86400000) // 1-day buckets
    
    // Hourly aggregation
    await CacheManager.incr(`agg:${metricName}:1h:${hour}:count`, 3600)
    await CacheManager.incr(`agg:${metricName}:1h:${hour}:sum`, 3600)
    
    // Daily aggregation
    await CacheManager.incr(`agg:${metricName}:1d:${day}:count`, 86400)
    await CacheManager.incr(`agg:${metricName}:1d:${day}:sum`, 86400)
  }

  private static async getMetricSum(metricName: string, since: number, tags: Record<string, string> = {}): Promise<number> {
    // Implementation would aggregate from stored metrics
    // This is a simplified version
    return 0
  }

  private static async getMetricAvg(metricName: string, since: number, tags: Record<string, string> = {}): Promise<number> {
    // Implementation would calculate average from stored metrics
    // This is a simplified version
    return 0
  }

  private static async sendAlerts(alerts: any[]) {
    // Send to Sentry
    alerts.forEach(alert => {
      Sentry.captureMessage(`Gaming Platform Alert: ${alert.message}`, alert.level as any)
    })
    
    // Store in Redis for dashboard
    await CacheManager.lpush('alerts:recent', {
      timestamp: Date.now(),
      alerts
    })

    // Note: List trimming is handled by CacheManager implementation
    
    console.warn('🚨 Alerts triggered:', alerts)
  }
}

/**
 * Middleware for automatic API monitoring
 */
export function withMonitoring() {
  return async (req: any, res: any, next: any) => {
    const start = Date.now()
    const originalSend = res.send
    
    res.send = function(data: any) {
      const responseTime = Date.now() - start
      const endpoint = req.route?.path || req.url || 'unknown'
      
      // Record the API call
      MonitoringService.recordAPICall(
        endpoint,
        req.method,
        res.statusCode,
        responseTime,
        req.user?.id
      ).catch(console.error)
      
      return originalSend.call(this, data)
    }
    
    next()
  }
}

export default MonitoringService