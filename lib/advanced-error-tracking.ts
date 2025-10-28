// @ts-nocheck
/**
 * GLXY Gaming Platform - Advanced Error Tracking
 * Enterprise-grade error monitoring and reporting
 */

import React from 'react'
// import { ErrorContext, ErrorSeverity, ErrorReport, Breadcrumb, UserContext } from './types/error-tracking'

export interface ErrorConfig {
  enabled: boolean
  environment: 'development' | 'staging' | 'production'
  release: string
  dsn?: string // Sentry DSN
  sampleRate: number
  debug: boolean
  maxErrors: number
  beforeSend?: (error: ErrorReport) => ErrorReport | null
  ignoreErrors: (string | RegExp)[]
  ignoreUrls: (string | RegExp)[]
  allowUrls: (string | RegExp)[]
}



/**
 * Advanced Error Tracking System
 */
export class AdvancedErrorTracker {
  private static instance: AdvancedErrorTracker
  private config: ErrorConfig
  private errors: Map<string, ErrorReport> = new Map()
  private breadcrumbs: Breadcrumb[] = []
  private user: UserContext = {}
  private session: string
  private reportQueue: ErrorReport[] = []
  private isReporting = false

  private constructor(config: Partial<ErrorConfig> = {}) {
    this.config = {
      enabled: true,
      environment: (process.env.NODE_ENV as any) || 'development',
      release: process.env.npm_package_version || '1.0.0',
      sampleRate: 1.0,
      debug: false,
      maxErrors: 100,
      ignoreErrors: [
        'Script error.',
        'Javascript error: Script error on line 0',
        'Non-Error promise rejection captured'
      ],
      ignoreUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i
      ],
      allowUrls: [],
      ...config
    }

    this.session = this.generateSessionId()
    this.initialize()
  }

  static getInstance(config?: Partial<ErrorConfig>): AdvancedErrorTracker {
    if (!AdvancedErrorTracker.instance) {
      AdvancedErrorTracker.instance = new AdvancedErrorTracker(config)
    }
    return AdvancedErrorTracker.instance
  }

  private initialize(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', this.handleGlobalError.bind(this))
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))

      // Page visibility tracking
      document.addEventListener('visibilitychange', this.trackPageVisibility.bind(this))

      // Performance tracking
      if ('PerformanceObserver' in window) {
        this.observePerformance()
      }

      // Cleanup old errors periodically
      setInterval(() => this.cleanupOldErrors(), 5 * 60 * 1000) // 5 minutes

      // Report queued errors
      setInterval(() => this.flushReportQueue(), 10000) // 10 seconds
    }
  }

  /**
   * Track an error
   */
  trackError(error: Error | string, context?: Partial<ErrorContext>): void {
    if (!this.config.enabled) return

    try {
      const errorReport = this.createErrorReport(error, context)

      if (this.shouldIgnoreError(errorReport)) return

      this.processErrorReport(errorReport)
    } catch (err) {
      console.error('Failed to track error:', err)
    }
  }

  /**
   * Track a message
   */
  trackMessage(message: string, level: Breadcrumb['level'] = 'info', data?: Record<string, any>): void {
    this.addBreadcrumb(message, 'custom', level, data)
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, data?: Record<string, any>): void {
    this.addBreadcrumb(action, 'user', 'info', data)
  }

  /**
   * Track navigation
   */
  trackNavigation(from: string, to: string): void {
    this.addBreadcrumb(`Navigation from ${from} to ${to}`, 'navigation', 'info', { from, to })
  }

  /**
   * Set user context
   */
  setUser(user: UserContext): void {
    this.user = { ...this.user, ...user }
  }

  /**
   * Add tag
   */
  setTag(key: string, value: string): void {
    // Tags will be added to future error reports
  }

  /**
   * Add extra context
   */
  setExtra(key: string, value: any): void {
    // Extra context will be added to future error reports
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category: string, level: Breadcrumb['level'], data?: Record<string, any>): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      message,
      category,
      level,
      data
    }

    this.breadcrumbs.push(breadcrumb)

    // Keep only last 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs = this.breadcrumbs.slice(-100)
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<ErrorSeverity, number>
    byUrl: Record<string, number>
    recent: number
  } {
    const errors = Array.from(this.errors.values())
    const oneHourAgo = Date.now() - 60 * 60 * 1000

    return {
      total: errors.length,
      byType: errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      bySeverity: errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1
        return acc
      }, {} as Record<ErrorSeverity, number>),
      byUrl: errors.reduce((acc, error) => {
        acc[error.url] = (acc[error.url] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recent: errors.filter(error => error.timestamp > oneHourAgo).length
    }
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.clear()
    this.breadcrumbs = []
  }

  /**
   * Create error report
   */
  private createErrorReport(error: Error | string, context?: Partial<ErrorContext>): ErrorReport {
    const timestamp = Date.now()
    const isString = typeof error === 'string'

    const errorObj = isString ? new Error(error) : error

    const fingerprint = this.generateFingerprint(errorObj, context)
    const existing = this.errors.get(fingerprint)

    const report: ErrorReport = {
      id: existing?.id || this.generateId(),
      timestamp,
      message: errorObj.message || (isString ? error : 'Unknown error'),
      stack: errorObj.stack,
      type: errorObj.constructor.name || 'Error',
      severity: this.determineSeverity(errorObj, context),
      context: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        ...context
      },
      breadcrumbs: this.breadcrumbs.slice(-20), // Last 20 breadcrumbs
      user: this.user,
      fingerprint,
      tags: {},
      extra: {},
      count: existing ? existing.count + 1 : 1,
      firstSeen: existing?.firstSeen || timestamp,
      lastSeen: timestamp,
      url: context?.url || (typeof window !== 'undefined' ? window.location.href : ''),
      release: this.config.release,
      environment: this.config.environment
    }

    return report
  }

  /**
   * Process error report
   */
  private processErrorReport(report: ErrorReport): void {
    // Apply beforeSend filter
    if (this.config.beforeSend) {
      const filtered = this.config.beforeSend(report)
      if (!filtered) return
      Object.assign(report, filtered)
    }

    // Store error
    this.errors.set(report.fingerprint, report)

    // Limit number of stored errors
    if (this.errors.size > this.config.maxErrors) {
      const oldest = Array.from(this.errors.entries())
        .sort(([, a], [, b]) => a.firstSeen - b.firstSeen)[0]

      if (oldest) {
        this.errors.delete(oldest[0])
      }
    }

    // Add to report queue
    this.reportQueue.push(report)

    // Log in development
    if (this.config.debug || this.config.environment === 'development') {
      console.error('🚨 Error tracked:', report)
    }

    // Send immediately for critical errors
    if (report.severity === 'critical') {
      this.flushReportQueue()
    }
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnoreError(report: ErrorReport): boolean {
    // Check ignore patterns
    for (const pattern of this.config.ignoreErrors) {
      if (typeof pattern === 'string' && report.message.includes(pattern)) {
        return true
      }
      if (pattern instanceof RegExp && pattern.test(report.message)) {
        return true
      }
    }

    // Check ignore URLs
    for (const pattern of this.config.ignoreUrls) {
      if (pattern instanceof RegExp && pattern.test(report.url)) {
        return true
      }
    }

    // Check allow URLs (if specified)
    if (this.config.allowUrls.length > 0) {
      const allowed = this.config.allowUrls.some(pattern =>
        pattern instanceof RegExp ? pattern.test(report.url) : report.url.includes(pattern)
      )
      if (!allowed) return true
    }

    // Sample rate
    if (Math.random() > this.config.sampleRate) {
      return true
    }

    return false
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context?: Partial<ErrorContext>): ErrorSeverity {
    // Check for critical patterns
    if (error.message.includes('ChunkLoadError') ||
        error.message.includes('Loading chunk') ||
        error.message.includes('Network error')) {
      return 'critical'
    }

    // Check for security-related errors
    if (error.message.includes('SecurityError') ||
        error.message.includes('CORS') ||
        error.message.includes('CSP')) {
      return 'high'
    }

    // Check for performance-related errors
    if (error.message.includes('timeout') ||
        error.message.includes('Timeout')) {
      return 'medium'
    }

    // Default based on context
    return context?.severity || 'low'
  }

  /**
   * Generate fingerprint for error grouping
   */
  private generateFingerprint(error: Error, context?: Partial<ErrorContext>): string {
    const stack = error.stack || ''
    const message = error.message || ''
    const url = context?.url || ''

    // Create a normalized fingerprint
    const normalized = [
      error.constructor.name,
      message.split('\n')[0], // First line only
      stack.split('\n')[1] || '', // First stack frame
      url.split('?')[0] // URL without query params
    ].join('|')

    return this.hashString(normalized)
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Hash string for fingerprinting
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Handle global errors
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    this.trackError(event.error || event.message, {
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      severity: 'medium'
    })
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.trackError(event.reason || 'Unhandled promise rejection', {
      severity: 'high'
    })
  }

  /**
   * Track page visibility
   */
  private trackPageVisibility = (): void => {
    const isVisible = !document.hidden
    this.addBreadcrumb(
      `Page ${isVisible ? 'visible' : 'hidden'}`,
      'ui',
      'info',
      { visible: isVisible }
    )
  }

  /**
   * Observe performance metrics
   */
  private observePerformance(): void {
    try {
      // Long tasks observer
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            this.trackUserAction('Long Task', {
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        }
      })

      observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      // PerformanceObserver not supported
    }
  }

  /**
   * Cleanup old errors
   */
  private cleanupOldErrors(): void {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    for (const [key, error] of this.errors.entries()) {
      if (error.lastSeen < oneWeekAgo) {
        this.errors.delete(key)
      }
    }

    // Cleanup old breadcrumbs
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.breadcrumbs = this.breadcrumbs.filter(breadcrumb =>
      breadcrumb.timestamp > oneHourAgo
    )
  }

  /**
   * Flush report queue
   */
  private async flushReportQueue(): Promise<void> {
    if (this.isReporting || this.reportQueue.length === 0) return

    this.isReporting = true
    const reports = [...this.reportQueue]
    this.reportQueue = []

    try {
      // Send to error tracking service (Sentry, etc.)
      for (const report of reports) {
        await this.sendErrorReport(report)
      }
    } catch (error) {
      console.error('Failed to send error reports:', error)
      // Re-queue failed reports
      this.reportQueue.unshift(...reports)
    } finally {
      this.isReporting = false
    }
  }

  /**
   * Send error report to service
   */
  private async sendErrorReport(report: ErrorReport): Promise<void> {
    // This would integrate with Sentry, LogRocket, or similar service
    if (this.config.debug) {
      console.log('Sending error report:', report)
    }

    // Example: Send to your API endpoint
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      })
    } catch (error) {
      // Network error, will be retried
      throw error
    }
  }
}

// Export singleton instance
export const errorTracker = AdvancedErrorTracker.getInstance()

// Convenience functions
export const trackError = (error: Error | string, context?: Partial<ErrorContext>) => {
  errorTracker.trackError(error, context)
}

export const trackMessage = (message: string, level?: Breadcrumb['level'], data?: Record<string, any>) => {
  errorTracker.trackMessage(message, level, data)
}

export const trackUserAction = (action: string, data?: Record<string, any>) => {
  errorTracker.trackUserAction(action, data)
}

export const setUser = (user: UserContext) => {
  errorTracker.setUser(user)
}

// React hook for error tracking
export function useErrorTracking() {
  const [errors, setErrors] = React.useState<ErrorReport[]>([])
  const [stats, setStats] = React.useState(errorTracker.getErrorStats())

  React.useEffect(() => {
    const updateData = () => {
      setErrors(errorTracker.getRecentErrors(5))
      setStats(errorTracker.getErrorStats())
    }

    // Initial update
    updateData()

    // Update every 30 seconds
    const interval = setInterval(updateData, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    errors,
    stats,
    trackError,
    trackMessage,
    trackUserAction,
    setUser,
    clearErrors: () => errorTracker.clearErrors()
  }
}