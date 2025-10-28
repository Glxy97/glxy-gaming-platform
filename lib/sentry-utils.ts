// @ts-nocheck
/**
 * Sentry Utilities
 * Custom error tracking and performance monitoring utilities
 */

import * as Sentry from '@sentry/nextjs'
import { AuditLogger } from '@/lib/audit-logger'

export interface ErrorContext {
  userId?: string
  gameId?: string
  roomId?: string
  action?: string
  metadata?: Record<string, any>
}

export interface PerformanceContext {
  operation: string
  userId?: string
  gameId?: string
  metadata?: Record<string, any>
}

/**
 * Custom error tracking with context
 */
export class SentryErrorTracker {
  /**
   * Track authentication errors
   */
  static trackAuthError(error: Error, context: ErrorContext = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'authentication')
      scope.setTag('component', 'auth')
      
      if (context.userId) {
        scope.setUser({ id: context.userId })
      }
      
      if (context.metadata) {
        scope.setContext('auth_context', context.metadata)
      }
      
      Sentry.captureException(error)
    })

    // Also log to audit system
    AuditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
      userId: context.userId,
      sessionId: undefined,
      ipAddress: undefined,
      userAgent: undefined
    }, {
      error: error.message,
      action: context.action
    })
  }

  /**
   * Track game-related errors
   */
  static trackGameError(error: Error, context: ErrorContext = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'game')
      scope.setTag('component', 'game_engine')
      
      if (context.userId) {
        scope.setUser({ id: context.userId })
      }
      
      if (context.gameId) {
        scope.setTag('game_id', context.gameId)
      }
      
      if (context.roomId) {
        scope.setTag('room_id', context.roomId)
      }
      
      if (context.metadata) {
        scope.setContext('game_context', context.metadata)
      }
      
      Sentry.captureException(error)
    })
  }

  /**
   * Track anti-cheat violations
   */
  static trackCheatDetection(context: ErrorContext & { cheatScore: number, reasons: string[] }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'cheat_detection')
      scope.setTag('component', 'anti_cheat')
      scope.setLevel('warning')
      
      if (context.userId) {
        scope.setUser({ id: context.userId })
      }
      
      if (context.gameId) {
        scope.setTag('game_id', context.gameId)
      }
      
      scope.setContext('cheat_context', {
        cheatScore: context.cheatScore,
        reasons: context.reasons,
        action: context.action,
        ...context.metadata
      })
      
      Sentry.captureMessage(`Cheat detection: ${context.reasons.join(', ')}`, 'warning')
    })
  }

  /**
   * Track database errors
   */
  static trackDatabaseError(error: Error, context: ErrorContext = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'database')
      scope.setTag('component', 'database')
      scope.setLevel('error')
      
      if (context.userId) {
        scope.setUser({ id: context.userId })
      }
      
      if (context.metadata) {
        scope.setContext('database_context', context.metadata)
      }
      
      Sentry.captureException(error)
    })
  }

  /**
   * Track API errors
   */
  static trackAPIError(error: Error, context: ErrorContext & { endpoint: string, method: string }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api')
      scope.setTag('component', 'api')
      scope.setTag('endpoint', context.endpoint)
      scope.setTag('method', context.method)
      
      if (context.userId) {
        scope.setUser({ id: context.userId })
      }
      
      if (context.metadata) {
        scope.setContext('api_context', context.metadata)
      }
      
      Sentry.captureException(error)
    })
  }

  /**
   * Track security violations
   */
  static trackSecurityViolation(violation: string, context: ErrorContext = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'security_violation')
      scope.setTag('component', 'security')
      scope.setLevel('error')
      
      if (context.userId) {
        scope.setUser({ id: context.userId })
      }
      
      if (context.metadata) {
        scope.setContext('security_context', context.metadata)
      }
      
      Sentry.captureMessage(`Security violation: ${violation}`, 'error')
    })

    // Also log to audit system
    AuditLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      userId: context.userId,
      sessionId: undefined,
      ipAddress: undefined,
      userAgent: undefined
    }, {
      violation,
      action: context.action,
      ...context.metadata
    })
  }
}

/**
 * Performance monitoring utilities
 */
export class SentryPerformanceTracker {
  /**
   * Track game performance
   */
  static trackGamePerformance(operation: string, fn: () => Promise<any>, context: PerformanceContext = {}) {
    return Sentry.startSpan(
      {
        name: `game.${operation}`,
        op: 'game.operation',
        tags: {
          game_operation: operation,
          game_id: context.gameId,
          user_id: context.userId
        },
        data: context.metadata
      },
      fn
    )
  }

  /**
   * Track API performance
   */
  static trackAPIPerformance(endpoint: string, method: string, fn: () => Promise<any>, context: PerformanceContext = {}) {
    return Sentry.startSpan(
      {
        name: `api.${method} ${endpoint}`,
        op: 'http.server',
        tags: {
          endpoint,
          method,
          user_id: context.userId
        },
        data: context.metadata
      },
      fn
    )
  }

  /**
   * Track database performance
   */
  static trackDatabasePerformance(operation: string, fn: () => Promise<any>, context: PerformanceContext = {}) {
    return Sentry.startSpan(
      {
        name: `db.${operation}`,
        op: 'db.operation',
        tags: {
          db_operation: operation,
          user_id: context.userId
        },
        data: context.metadata
      },
      fn
    )
  }

  /**
   * Track WebSocket performance
   */
  static trackWebSocketPerformance(event: string, fn: () => Promise<any>, context: PerformanceContext = {}) {
    return Sentry.startSpan(
      {
        name: `websocket.${event}`,
        op: 'websocket.operation',
        tags: {
          websocket_event: event,
          game_id: context.gameId,
          user_id: context.userId
        },
        data: context.metadata
      },
      fn
    )
  }
}

/**
 * User context management
 */
export class SentryUserContext {
  /**
   * Set user context for error tracking
   */
  static setUserContext(user: {
    id: string
    email?: string
    username?: string
    role?: string
  }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    })
  }

  /**
   * Clear user context
   */
  static clearUserContext() {
    Sentry.setUser(null)
  }

  /**
   * Set game context
   */
  static setGameContext(gameId: string, roomId?: string) {
    Sentry.setTag('current_game', gameId)
    if (roomId) {
      Sentry.setTag('current_room', roomId)
    }
  }

  /**
   * Clear game context
   */
  static clearGameContext() {
    Sentry.setTag('current_game', undefined)
    Sentry.setTag('current_room', undefined)
  }
}

/**
 * Breadcrumb utilities
 */
export class SentryBreadcrumbs {
  /**
   * Add game action breadcrumb
   */
  static addGameAction(action: string, gameId: string, metadata?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message: `Game action: ${action}`,
      category: 'game',
      level: 'info',
      data: {
        gameId,
        action,
        ...metadata
      }
    })
  }

  /**
   * Add user action breadcrumb
   */
  static addUserAction(action: string, userId: string, metadata?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message: `User action: ${action}`,
      category: 'user',
      level: 'info',
      data: {
        userId,
        action,
        ...metadata
      }
    })
  }

  /**
   * Add API call breadcrumb
   */
  static addAPICall(endpoint: string, method: string, status?: number, metadata?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message: `API call: ${method} ${endpoint}`,
      category: 'api',
      level: status && status >= 400 ? 'error' : 'info',
      data: {
        endpoint,
        method,
        status,
        ...metadata
      }
    })
  }
}

/**
 * Custom metrics
 */
export class SentryMetrics {
  /**
   * Track game metrics
   */
  static trackGameMetric(metric: string, value: number, tags?: Record<string, string>) {
    Sentry.metrics.increment(metric, value, {
      tags: {
        component: 'game',
        ...tags
      }
    })
  }

  /**
   * Track performance metrics
   */
  static trackPerformanceMetric(metric: string, value: number, tags?: Record<string, string>) {
    Sentry.metrics.gauge(metric, value, {
      tags: {
        component: 'performance',
        ...tags
      }
    })
  }

  /**
   * Track error metrics
   */
  static trackErrorMetric(errorType: string, tags?: Record<string, string>) {
    Sentry.metrics.increment('error.count', 1, {
      tags: {
        error_type: errorType,
        component: 'error_tracking',
        ...tags
      }
    })
  }
}
