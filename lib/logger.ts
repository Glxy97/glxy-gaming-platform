/**
 * ===================================================
 * GLXY Gaming Platform - Structured Logger
 * Production-ready logging with context enrichment
 * ===================================================
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      return this.formatDevelopment(entry);
    } else {
      // JSON format for production (log aggregation)
      return this.formatProduction(entry);
    }
  }

  private formatDevelopment(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;

    let output = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack) {
        output += `\n  Stack: ${error.stack}`;
      }
    }

    return output;
  }

  private formatProduction(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }

    // In production, you might want to send logs to external service
    if (this.isProduction) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // Implement external logging service integration here
    // Examples: Sentry, Datadog, CloudWatch, etc.
    
    // Only send errors and warnings to reduce costs
    if (entry.level === 'error' || entry.level === 'warn') {
      // Example: Sentry integration
      // if (typeof window !== 'undefined' && window.Sentry) {
      //   window.Sentry.captureMessage(entry.message, {
      //     level: entry.level,
      //     extra: entry.context,
      //   });
      // }
      
      // Performance alerting for critical errors
      if (entry.level === 'error') {
        this.checkPerformanceAlerts(entry);
      }
    }
  }
  
  private checkPerformanceAlerts(entry: LogEntry): void {
    // Check for performance degradation patterns
    const now = Date.now();
    const alertKey = `perf_alert_${entry.context?.userId || 'anonymous'}`;
    
    // Get recent error count for this user/session
    const recentErrorsKey = `recent_errors_${entry.context?.userId || 'anonymous'}`;
    const recentErrors = this.getRecentErrors(recentErrorsKey);
    
    // Trigger alert if too many errors in short time
    if (recentErrors.length >= 5) {
      this.triggerPerformanceAlert(alertKey, 'high_error_rate', {
        message: 'Hohe Fehlerrate detektiert',
        errorCount: recentErrors.length,
        timeWindow: '5 Minuten',
        userId: entry.context?.userId
      });
    }
  }
  
  private getRecentErrors(key: string): Array<{timestamp: number; message: string}> {
    // In a real implementation, this would use Redis or another cache
    // For now, return empty array
    return [];
  }
  
  private triggerPerformanceAlert(alertKey: string, alertType: string, data: any): void {
    // Send alert to monitoring system
    this.warn(`Performance Alert: ${alertType}`, {
      alertKey,
      alertType,
      data,
      timestamp: new Date().toISOString()
    });
    
    // In production, this would integrate with alerting systems
    // Examples: PagerDuty, Slack, Discord, Email, etc.
    if (this.isProduction) {
      // this.sendToAlertingSystem(alertKey, alertType, data);
    }
  }
  
  // Performance monitoring methods
  startPerformanceTimer(operation: string, context?: LogContext): string {
    const timerId = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.debug(`Performance Timer Started: ${operation}`, {
      timerId,
      operation,
      ...context
    });
    return timerId;
  }
  
  endPerformanceTimer(timerId: string, context?: LogContext): void {
    this.debug(`Performance Timer Ended: ${timerId}`, {
      timerId,
      ...context
    });
    // In a real implementation, this would calculate and log the duration
  }
  
  // Resource usage monitoring
  logResourceUsage(usage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  }, context?: LogContext): void {
    this.performanceMetric('resource_usage', usage.cpu, '%', {
      memory_usage_mb: usage.memory,
      disk_usage_gb: usage.disk,
      network_usage_mbps: usage.network,
      ...context
    });
    
    // Alert on high resource usage
    if (usage.cpu > 80 || usage.memory > 80 || usage.disk > 90) {
      this.triggerPerformanceAlert('resource_high', 'high_resource_usage', {
        message: 'Hohe Ressourcennutzung detektiert',
        ...usage,
        ...context
      });
    }
  }
  
  // API performance monitoring
  logAPIPerformance(method: string, path: string, duration: number, statusCode: number, context?: LogContext): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, `API Performance: ${method} ${path} - ${statusCode} (${duration}ms)`, {
      method,
      path,
      duration,
      status_code: statusCode,
      performance_tier: this.getPerformanceTier(duration),
      ...context
    });
    
    // Alert on slow API calls
    if (duration > 5000) { // 5 seconds
      this.triggerPerformanceAlert('api_slow', 'slow_api_response', {
        message: 'Langsame API-Antwort detektiert',
        method,
        path,
        duration,
        status_code: statusCode,
        ...context
      });
    }
  }
  
  private getPerformanceTier(duration: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (duration < 100) return 'excellent';
    if (duration < 300) return 'good';
    if (duration < 1000) return 'acceptable';
    return 'poor';
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  // Convenience methods for common scenarios

  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      ...context,
    });
  }

  apiResponse(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this.log(level, `API Response: ${method} ${path} - ${status} (${duration}ms)`, {
      method,
      path,
      status,
      duration,
      ...context,
    });
  }

  databaseQuery(query: string, duration: number, context?: LogContext): void {
    this.debug(`Database Query: ${duration}ms`, {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      ...context,
    });
  }

  socketEvent(event: string, roomId?: string, context?: LogContext): void {
    this.info(`Socket Event: ${event}`, {
      event,
      roomId,
      ...context,
    });
  }

  authEvent(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth Event: ${event}`, {
      event,
      userId,
      ...context,
    });
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.log(level, `Security Event: ${event}`, {
      event,
      severity,
      ...context,
    });
  }

  performanceMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance Metric: ${metric} = ${value}${unit}`, {
      metric,
      value,
      unit,
      ...context,
    });
  }
}

// Singleton instance
export const logger = new Logger();

// Export type for use in other modules
export type { LogContext, LogLevel };
