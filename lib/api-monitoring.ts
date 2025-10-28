import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from './redis';

interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

interface EndpointStats {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastError?: {
    timestamp: string;
    error: string;
    statusCode: number;
  };
}

export class APIMonitoring {
  private static readonly METRICS_KEY_PREFIX = 'api_metrics:';
  private static readonly STATS_KEY_PREFIX = 'api_stats:';
  private static readonly ERROR_KEY_PREFIX = 'api_errors:';
  private static readonly RETENTION_DAYS = 7;

  static async recordMetric(_req: NextApiRequest, res: NextApiResponse, responseTime: number) {
    const metric: APIMetrics = {
      endpoint: _req.url || '',
      method: _req.method || '',
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      userAgent: _req.headers['user-agent'],
      ip: this.getClientIP(_req),
      userId: (_req as any).user?.id
    };

    try {
      // Store individual metric
      const metricKey = `${this.METRICS_KEY_PREFIX}${Date.now()}:${Math.random()}`;
      await redis?.setex(metricKey, 60 * 60 * 24 * this.RETENTION_DAYS, JSON.stringify(metric));

      // Update endpoint statistics
      await this.updateEndpointStats(metric);

      // Record errors separately for faster access
      if (res.statusCode >= 400) {
        await this.recordError(metric);
      }
    } catch (error) {
      console.error('Failed to record API metric:', error);
    }
  }

  private static async updateEndpointStats(metric: APIMetrics) {
    const statsKey = `${this.STATS_KEY_PREFIX}${metric.method}:${metric.endpoint}`;
    
    try {
      const existingStats = await redis?.get(statsKey);
      const stats: EndpointStats = existingStats ? JSON.parse(existingStats) : {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        errorCount: 0
      };

      stats.totalRequests++;
      
      if (metric.statusCode >= 400) {
        stats.errorCount++;
      }
      
      stats.successRate = ((stats.totalRequests - stats.errorCount) / stats.totalRequests) * 100;
      stats.averageResponseTime = (stats.averageResponseTime + metric.responseTime) / 2;

      await redis?.setex(statsKey, 60 * 60 * 24 * this.RETENTION_DAYS, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to update endpoint stats:', error);
    }
  }

  private static async recordError(metric: APIMetrics) {
    const errorKey = `${this.ERROR_KEY_PREFIX}${Date.now()}`;
    const errorData = {
      endpoint: metric.endpoint,
      method: metric.method,
      statusCode: metric.statusCode || 500,
      timestamp: metric.timestamp,
      ip: metric.ip,
      userAgent: metric.userAgent,
      userId: metric.userId
    };

    try {
      await redis?.setex(errorKey, 60 * 60 * 24 * this.RETENTION_DAYS, JSON.stringify(errorData));
    } catch (error) {
      console.error('Failed to record API error:', error);
    }
  }

  static async getEndpointStats(endpoint?: string): Promise<Record<string, EndpointStats>> {
    try {
      const pattern = endpoint ? 
        `${this.STATS_KEY_PREFIX}*:${endpoint}` : 
        `${this.STATS_KEY_PREFIX}*`;
      
      const keys = await redis?.keys(pattern);
      const stats: Record<string, EndpointStats> = {};

      for (const key of keys) {
        const data = await redis?.get(key);
        if (data) {
          const endpointPath = key.replace(this.STATS_KEY_PREFIX, '');
          stats[endpointPath] = JSON.parse(data);
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get endpoint stats:', error);
      return {};
    }
  }

  static async getRecentErrors(limit: number = 50): Promise<any[]> {
    try {
      const keys = await redis?.keys(`${this.ERROR_KEY_PREFIX}*`);
      const sortedKeys = (keys || []).sort().reverse().slice(0, limit);

      const errors: any[] = [];
      for (const key of sortedKeys) {
        const data = await redis?.get(key);
        if (data) {
          errors.push(JSON.parse(data as string));
        }
      }

      return errors;
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      return [];
    }
  }

  static async getMetricsSummary(): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    topErrors: Array<{ statusCode: number; count: number }>;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number }>;
  }> {
    try {
      const stats = await this.getEndpointStats();
      
      let totalRequests = 0;
      let totalErrors = 0;
      let totalResponseTime = 0;
      let endpointCount = 0;
      
      const errorCounts: Record<number, number> = {};
      const endpointTimes: Array<{ endpoint: string; averageTime: number }> = [];

      for (const [endpoint, stat] of Object.entries(stats)) {
        totalRequests += stat.totalRequests;
        totalErrors += stat.errorCount;
        totalResponseTime += stat.averageResponseTime;
        endpointCount++;

        endpointTimes.push({
          endpoint,
          averageTime: stat.averageResponseTime
        });

        if (stat.lastError) {
          const code = stat.lastError.statusCode;
          errorCounts[code] = (errorCounts[code] || 0) + 1;
        }
      }

      const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100;
      const averageResponseTime = endpointCount > 0 ? totalResponseTime / endpointCount : 0;

      const topErrors = Object.entries(errorCounts)
        .map(([code, count]) => ({ statusCode: parseInt(code), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const slowestEndpoints = endpointTimes
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 5);

      return {
        totalRequests,
        successRate,
        averageResponseTime,
        topErrors,
        slowestEndpoints
      };
    } catch (error) {
      console.error('Failed to get metrics summary:', error);
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        topErrors: [],
        slowestEndpoints: []
      };
    }
  }

  private static getClientIP(req: any): string {
    const forwarded = req.headers?.['x-forwarded-for'];
    const ip = forwarded ?
      (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) :
      req.socket?.remoteAddress;
    return ip || 'unknown';
  }

  static createMiddleware() {
    return (req: any, res: NextApiResponse, next: () => void) => {
      const startTime = Date.now();
      
      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const responseTime = Date.now() - startTime;
        
        // Record metric asynchronously
        APIMonitoring.recordMetric(req, res, responseTime).catch(console.error);
        
        // Call original end method and return the result
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }
}

// Utility function to format metrics for display
export const formatMetrics = {
  responseTime: (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  },
  
  successRate: (rate: number): string => {
    return `${rate.toFixed(1)}%`;
  },
  
  requestCount: (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }
};