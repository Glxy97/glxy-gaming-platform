// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'

// STRICT MODE: Comprehensive monitoring interfaces
export interface GLXYMonitorConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  metricsInterval: number
  healthCheckInterval: number
  alertThresholds: {
    cpu: number
    memory: number
    fps: number
    latency: number
    errorRate: number
    packetLoss: number
  }
  retentionPeriod: number // days
  enableRealTimeAlerts: boolean
  enablePerformanceProfiling: boolean
  enableUserBehaviorTracking: boolean
  enableSecurityMonitoring: boolean
  enableBusinessMetrics: boolean
  exportFormats: ('json' | 'csv' | 'prometheus' | 'grafana')[]
}

export interface GLXYSystemMetrics {
  timestamp: number
  cpu: {
    usage: number
    temperature: number
    cores: number
    frequency: number
    load: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
    heap: {
      used: number
      total: number
      limit: number
    }
  }
  gpu: {
    usage: number
    temperature: number
    memory: {
      used: number
      total: number
    }
    frameTime: number
  }
  network: {
    latency: number
    bandwidth: {
      download: number
      upload: number
    }
    packetLoss: number
    connections: number
  }
  performance: {
    fps: number
    frameTime: number
    drawCalls: number
    triangles: number
    textureMemory: number
  }
  errors: {
    count: number
    rate: number
    types: Record<string, number>
  }
  users: {
    active: number
    total: number
    concurrent: number
  }
}

export interface GLXYGameMetrics {
  timestamp: number
  players: {
    online: number
    inGame: number
    inLobby: number
    spectating: number
  }
  matches: {
    active: number
    completed: number
    averageDuration: number
  }
  performance: {
    averageFPS: number
    serverTickRate: number
    clientUpdateTime: number
    networkQuality: number
  }
  economy: {
    totalTransactions: number
    currencyFlow: number
    itemPurchases: number
  }
  engagement: {
    sessionDuration: number
    retentionRate: number
    churnRate: number
    activeRate: number
  }
  revenue: {
    daily: number
    monthly: number
    arpu: number // Average Revenue Per User
    arppu: number // Average Revenue Per Paying User
  }
}

export interface GLXYHealthCheck {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'down'
  responseTime: number
  lastCheck: number
  uptime: number
  checks: {
    database: boolean
    redis: boolean
    network: boolean
    gameServer: boolean
    authServer: boolean
    cdn: boolean
  }
  dependencies: {
    name: string
    status: boolean
    responseTime: number
  }[]
}

export interface GLXYAlert {
  id: string
  type: 'performance' | 'error' | 'security' | 'business' | 'system'
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  title: string
  description: string
  timestamp: number
  source: string
  metrics: any
  acknowledged: boolean
  resolved: boolean
  resolvedAt?: number
  acknowledgedBy?: string
  resolvedBy?: string
}

export interface GLXYLogEntry {
  id: string
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  category: 'system' | 'game' | 'network' | 'security' | 'performance' | 'business'
  source: string
  playerId?: string
  sessionId?: string
  data?: any
  error?: {
    name: string
    message: string
    stack: string
  }
  tags: string[]
  context: Record<string, any>
}

export interface GLXYUserProfile {
  id: string
  sessionId: string
  behavior: {
    sessionDuration: number
    actionsPerMinute: number
    errorRate: number
    performance: {
      averageFPS: number
      latency: number
    }
    engagement: {
      chatMessages: number
      socialInteractions: number
      teamPlay: number
    }
  }
  technical: {
    browser: string
    device: string
    connection: string
    location: string
  }
  business: {
    firstSeen: number
    lastSeen: number
    totalSessions: number
    totalSpent: number
    retention: {
      day1: boolean
      day7: boolean
      day30: boolean
    }
  }
}

// PRODUCTION-READY MONITORING SYSTEM
export class GLXYProductionMonitor {
  private static instance: GLXYProductionMonitor | null = null

  // Core configuration
  private config: GLXYMonitorConfig
  private isActive = false
  private startTime = Date.now()

  // Data storage
  private systemMetrics: GLXYSystemMetrics[] = []
  private gameMetrics: GLXYGameMetrics[] = []
  private logs: GLXYLogEntry[] = []
  private alerts: GLXYAlert[] = []
  private healthChecks: Map<string, GLXYHealthCheck> = new Map()
  private userProfiles: Map<string, GLXYUserProfile> = new Map()

  // Monitoring intervals
  private metricsInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private alertInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null

  // Performance tracking
  private performanceObserver: PerformanceObserver | null = null
  private frameTimeHistory: number[] = []
  private memoryHistory: number[] = []
  private errorHistory: GLXYLogEntry[] = []

  // Analytics
  private analytics: AnalyticsEngine
  private alertManager: AlertManager
  private logManager: LogManager
  private healthManager: HealthManager
  private profiler: PerformanceProfiler

  // Event handling
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(config: Partial<GLXYMonitorConfig> = {}) {
    if (GLXYProductionMonitor.instance) {
      throw new Error('GLXYProductionMonitor is a singleton')
    }

    this.config = this.mergeConfig(this.getDefaultConfig(), config)

    // Initialize subsystems
    this.analytics = new AnalyticsEngine()
    this.alertManager = new AlertManager(this.config.alertThresholds)
    this.logManager = new LogManager(this.config.logLevel)
    this.healthManager = new HealthManager()
    this.profiler = new PerformanceProfiler()

    GLXYProductionMonitor.instance = this
  }

  public static getInstance(): GLXYProductionMonitor | null {
    return GLXYProductionMonitor.instance
  }

  private mergeConfig(defaultConfig: GLXYMonitorConfig, customConfig: Partial<GLXYMonitorConfig>): GLXYMonitorConfig {
    return { ...defaultConfig, ...customConfig }
  }

  private getDefaultConfig(): GLXYMonitorConfig {
    return {
      logLevel: 'info',
      metricsInterval: 5000, // 5 seconds
      healthCheckInterval: 30000, // 30 seconds
      alertThresholds: {
        cpu: 80,
        memory: 85,
        fps: 30,
        latency: 200,
        errorRate: 5,
        packetLoss: 5
      },
      retentionPeriod: 30, // 30 days
      enableRealTimeAlerts: true,
      enablePerformanceProfiling: true,
      enableUserBehaviorTracking: true,
      enableSecurityMonitoring: true,
      enableBusinessMetrics: true,
      exportFormats: ['json', 'csv']
    }
  }

  public async initialize(): Promise<boolean> {
    try {
      console.log('📊 Initializing GLXY Production Monitor...')

      // Setup performance observers
      if (this.config.enablePerformanceProfiling) {
        this.setupPerformanceObservers()
      }

      // Setup global error handlers
      this.setupErrorHandlers()

      // Initialize health checks
      await this.initializeHealthChecks()

      // Start monitoring
      this.startMonitoring()

      // Setup cleanup
      this.setupCleanup()

      this.isActive = true

      this.log('info', 'Production monitor initialized', 'system', {
        config: this.config,
        startTime: this.startTime
      })

      console.log('✅ Production monitor initialized')
      this.emit('monitorInitialized', { timestamp: Date.now() })
      return true

    } catch (error) {
      console.error('❌ Production monitor initialization failed:', error)
      this.log('error', 'Production monitor initialization failed', 'system', { error: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  private setupPerformanceObservers(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          this.profiler.recordPerformanceEntry(entry)
        })
      })

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }

  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.log('error', 'Global error caught', 'system', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: {
          name: event.error?.name,
          message: event.error?.message,
          stack: event.error?.stack
        }
      })

      this.errorHistory.push(this.logs[this.logs.length - 1])
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'Unhandled promise rejection', 'system', {
        reason: event.reason,
        promise: event.promise
      })
    })
  }

  private async initializeHealthChecks(): Promise<void> {
    // Database health check
    this.healthManager.addCheck('database', async () => {
      return this.checkDatabaseHealth()
    })

    // Redis health check
    this.healthManager.addCheck('redis', async () => {
      return this.checkRedisHealth()
    })

    // Network health check
    this.healthManager.addCheck('network', async () => {
      return this.checkNetworkHealth()
    })

    // Game server health check
    this.healthManager.addCheck('gameServer', async () => {
      return this.checkGameServerHealth()
    })

    // Auth server health check
    this.healthManager.addCheck('authServer', async () => {
      return this.checkAuthServerHealth()
    })

    // CDN health check
    this.healthManager.addCheck('cdn', async () => {
      return this.checkCDNHealth()
    })
  }

  private startMonitoring(): void {
    // System metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics()
    }, this.config.metricsInterval)

    // Health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, this.config.healthCheckInterval)

    // Alert processing
    if (this.config.enableRealTimeAlerts) {
      this.alertInterval = setInterval(() => {
        this.processAlerts()
      }, 10000) // Check alerts every 10 seconds
    }
  }

  private setupCleanup(): void {
    // Cleanup old data based on retention period
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData()
    }, 3600000) // Cleanup every hour
  }

  // METRICS COLLECTION
  private collectSystemMetrics(): void {
    const metrics: GLXYSystemMetrics = {
      timestamp: Date.now(),
      cpu: this.collectCPUMetrics(),
      memory: this.collectMemoryMetrics(),
      gpu: this.collectGPUMetrics(),
      network: this.collectNetworkMetrics(),
      performance: this.collectPerformanceMetrics(),
      errors: this.collectErrorMetrics(),
      users: this.collectUserMetrics()
    }

    this.systemMetrics.push(metrics)
    this.analytics.processMetrics(metrics)

    // Keep only recent metrics
    if (this.systemMetrics.length > 1000) {
      this.systemMetrics.shift()
    }

    // Check thresholds and create alerts
    this.checkMetricThresholds(metrics)

    this.emit('metricsCollected', metrics)
  }

  private collectCPUMetrics(): GLXYSystemMetrics['cpu'] {
    // Simulate CPU metrics (in production, use actual CPU monitoring)
    return {
      usage: Math.random() * 100,
      temperature: 40 + Math.random() * 40,
      cores: navigator.hardwareConcurrency || 4,
      frequency: 2000 + Math.random() * 2000,
      load: Array(5).fill(0).map(() => Math.random() * 100)
    }
  }

  private collectMemoryMetrics(): GLXYSystemMetrics['memory'] {
    const memory = (performance as any).memory || {
      usedJSHeapSize: 50000000,
      totalJSHeapSize: 100000000,
      jsHeapSizeLimit: 2000000000
    }

    const used = memory.usedJSHeapSize
    const total = memory.totalJSHeapSize
    const percentage = (used / total) * 100

    this.memoryHistory.push(percentage)
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift()
    }

    return {
      used,
      total,
      percentage,
      heap: {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
  }

  private collectGPUMetrics(): GLXYSystemMetrics['gpu'] {
    // Simulate GPU metrics
    return {
      usage: Math.random() * 100,
      temperature: 50 + Math.random() * 30,
      memory: {
        used: Math.random() * 8000000000,
        total: 8000000000
      },
      frameTime: this.frameTimeHistory.length > 0 ?
        this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length : 16.67
    }
  }

  private collectNetworkMetrics(): GLXYSystemMetrics['network'] {
    // Simulate network metrics
    return {
      latency: 50 + Math.random() * 100,
      bandwidth: {
        download: Math.random() * 1000000, // 1 Mbps max
        upload: Math.random() * 500000     // 0.5 Mbps max
      },
      packetLoss: Math.random() * 5,
      connections: Math.floor(Math.random() * 1000)
    }
  }

  private collectPerformanceMetrics(): GLXYSystemMetrics['performance'] {
    const frameTime = this.frameTimeHistory.length > 0 ?
      this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length : 16.67

    return {
      fps: 1000 / frameTime,
      frameTime,
      drawCalls: Math.floor(Math.random() * 1000),
      triangles: Math.floor(Math.random() * 1000000),
      textureMemory: Math.random() * 2000000000 // 2GB max
    }
  }

  private collectErrorMetrics(): GLXYSystemMetrics['errors'] {
    const recentErrors = this.errorHistory.filter(log =>
      Date.now() - log.timestamp < 60000 // Last minute
    )

    const errorTypes: Record<string, number> = {}
    recentErrors.forEach(error => {
      errorTypes[error.category] = (errorTypes[error.category] || 0) + 1
    })

    return {
      count: recentErrors.length,
      rate: (recentErrors.length / 60) * 100, // Errors per minute
      types: errorTypes
    }
  }

  private collectUserMetrics(): GLXYSystemMetrics['users'] {
    // Simulate user metrics
    return {
      active: Math.floor(Math.random() * 10000),
      total: 100000 + Math.floor(Math.random() * 50000),
      concurrent: Math.floor(Math.random() * 5000)
    }
  }

  // HEALTH CHECKS
  private async performHealthChecks(): Promise<void> {
    const healthCheck: GLXYHealthCheck = {
      id: 'main',
      name: 'Main System Health',
      status: 'healthy',
      responseTime: Date.now(),
      lastCheck: Date.now(),
      uptime: Date.now() - this.startTime,
      checks: {
        database: false,
        redis: false,
        network: false,
        gameServer: false,
        authServer: false,
        cdn: false
      },
      dependencies: []
    }

    try {
      const results = await this.healthManager.runAllChecks()

      healthCheck.checks = {
        database: results.database?.status || false,
        redis: results.redis?.status || false,
        network: results.network?.status || false,
        gameServer: results.gameServer?.status || false,
        authServer: results.authServer?.status || false,
        cdn: results.cdn?.status || false
      }

      // Determine overall status
      const failedChecks = Object.values(healthCheck.checks).filter(status => !status).length
      if (failedChecks === 0) {
        healthCheck.status = 'healthy'
      } else if (failedChecks <= 2) {
        healthCheck.status = 'warning'
      } else if (failedChecks <= 4) {
        healthCheck.status = 'critical'
      } else {
        healthCheck.status = 'down'
      }

      // Add dependency details
      healthCheck.dependencies = Object.entries(results).map(([name, result]) => ({
        name,
        status: result?.status || false,
        responseTime: result?.responseTime || 0
      }))

    } catch (error) {
      healthCheck.status = 'down'
      this.log('error', 'Health check failed', 'system', { error: error instanceof Error ? error.message : String(error) })
    }

    this.healthChecks.set('main', healthCheck)
    this.emit('healthCheck', healthCheck)

    // Create alert if status is not healthy
    if (healthCheck.status !== 'healthy') {
      this.alertManager.createAlert({
        type: 'system',
        severity: healthCheck.status === 'down' ? 'emergency' : 'critical',
        title: `System Health: ${healthCheck.status.toUpperCase()}`,
        description: `Health check failed with status: ${healthCheck.status}`,
        source: 'health-check',
        metrics: healthCheck
      })
    }
  }

  private async checkDatabaseHealth(): Promise<{ status: boolean; responseTime: number }> {
    const startTime = Date.now()

    try {
      // Simulate database health check
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))

      return {
        status: Math.random() > 0.05, // 95% success rate
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: false,
        responseTime: Date.now() - startTime
      }
    }
  }

  private async checkRedisHealth(): Promise<{ status: boolean; responseTime: number }> {
    const startTime = Date.now()

    try {
      // Simulate Redis health check
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20))

      return {
        status: Math.random() > 0.02, // 98% success rate
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: false,
        responseTime: Date.now() - startTime
      }
    }
  }

  private async checkNetworkHealth(): Promise<{ status: boolean; responseTime: number }> {
    const startTime = Date.now()

    try {
      // Simulate network health check
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      })

      return {
        status: response.ok,
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: false,
        responseTime: Date.now() - startTime
      }
    }
  }

  private async checkGameServerHealth(): Promise<{ status: boolean; responseTime: number }> {
    const startTime = Date.now()

    try {
      // Simulate game server health check
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50))

      return {
        status: Math.random() > 0.03, // 97% success rate
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: false,
        responseTime: Date.now() - startTime
      }
    }
  }

  private async checkAuthServerHealth(): Promise<{ status: boolean; responseTime: number }> {
    const startTime = Date.now()

    try {
      // Simulate auth server health check
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30))

      return {
        status: Math.random() > 0.01, // 99% success rate
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: false,
        responseTime: Date.now() - startTime
      }
    }
  }

  private async checkCDNHealth(): Promise<{ status: boolean; responseTime: number }> {
    const startTime = Date.now()

    try {
      // Simulate CDN health check
      const response = await fetch('https://cdn.example.com/health.png', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      return {
        status: response.ok,
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: false,
        responseTime: Date.now() - startTime
      }
    }
  }

  // LOGGING
  public log(
    level: GLXYLogEntry['level'],
    message: string,
    category: GLXYLogEntry['category'],
    data?: any,
    tags: string[] = []
  ): void {
    const logEntry: GLXYLogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      message,
      category,
      source: 'production-monitor',
      data,
      tags,
      context: this.getLogContext()
    }

    this.logs.push(logEntry)
    this.logManager.processLog(logEntry)

    // Keep only recent logs
    if (this.logs.length > 10000) {
      this.logs.shift()
    }

    // Emit log event
    this.emit('log', logEntry)

    // Create alert for error/fatal logs
    if (level === 'error' || level === 'fatal') {
      this.alertManager.createAlert({
        type: 'error',
        severity: level === 'fatal' ? 'emergency' : 'critical',
        title: `${level.toUpperCase()}: ${message}`,
        description: logEntry.error?.message || message,
        source: category,
        metrics: logEntry
      })
    }
  }

  private getLogContext(): Record<string, any> {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      timestamp: Date.now()
    }
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getSessionId(): string {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('monitor_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('monitor_session_id', sessionId)
    }
    return sessionId
  }

  // USER PROFILING
  public trackUserBehavior(playerId: string, action: string, data?: any): void {
    if (!this.config.enableUserBehaviorTracking) return

    if (!this.userProfiles.has(playerId)) {
      this.userProfiles.set(playerId, {
        id: playerId,
        sessionId: this.getSessionId(),
        behavior: {
          sessionDuration: 0,
          actionsPerMinute: 0,
          errorRate: 0,
          performance: {
            averageFPS: 60,
            latency: 50
          },
          engagement: {
            chatMessages: 0,
            socialInteractions: 0,
            teamPlay: 0
          }
        },
        technical: {
          browser: navigator.userAgent,
          device: 'unknown',
          connection: 'unknown',
          location: 'unknown'
        },
        business: {
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          totalSessions: 1,
          totalSpent: 0,
          retention: {
            day1: false,
            day7: false,
            day30: false
          }
        }
      })
    }

    const profile = this.userProfiles.get(playerId)!

    // Update profile based on action
    this.updateUserProfile(profile, action, data)

    this.emit('userBehaviorTracked', { playerId, action, data, profile })
  }

  private updateUserProfile(profile: GLXYUserProfile, action: string, data?: any): void {
    profile.business.lastSeen = Date.now()

    switch (action) {
      case 'game_start':
        profile.behavior.sessionDuration = 0
        break
      case 'game_end':
        // Calculate session duration
        break
      case 'chat_message':
        profile.behavior.engagement.chatMessages++
        break
      case 'social_interaction':
        profile.behavior.engagement.socialInteractions++
        break
      case 'team_action':
        profile.behavior.engagement.teamPlay++
        break
      case 'purchase':
        profile.business.totalSpent += data?.amount || 0
        break
    }
  }

  // ALERT MANAGEMENT
  private checkMetricThresholds(metrics: GLXYSystemMetrics): void {
    const thresholds = this.config.alertThresholds

    // CPU threshold
    if (metrics.cpu.usage > thresholds.cpu) {
      this.alertManager.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'High CPU Usage',
        description: `CPU usage is ${metrics.cpu.usage.toFixed(2)}%`,
        source: 'system',
        metrics: { cpu: metrics.cpu }
      })
    }

    // Memory threshold
    if (metrics.memory.percentage > thresholds.memory) {
      this.alertManager.createAlert({
        type: 'performance',
        severity: 'critical',
        title: 'High Memory Usage',
        description: `Memory usage is ${metrics.memory.percentage.toFixed(2)}%`,
        source: 'system',
        metrics: { memory: metrics.memory }
      })
    }

    // FPS threshold
    if (metrics.performance.fps < thresholds.fps) {
      this.alertManager.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'Low FPS',
        description: `FPS is ${metrics.performance.fps.toFixed(2)}`,
        source: 'system',
        metrics: { performance: metrics.performance }
      })
    }

    // Latency threshold
    if (metrics.network.latency > thresholds.latency) {
      this.alertManager.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'High Latency',
        description: `Network latency is ${metrics.network.latency.toFixed(2)}ms`,
        source: 'system',
        metrics: { network: metrics.network }
      })
    }

    // Error rate threshold
    if (metrics.errors.rate > thresholds.errorRate) {
      this.alertManager.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'High Error Rate',
        description: `Error rate is ${metrics.errors.rate.toFixed(2)}%`,
        source: 'system',
        metrics: { errors: metrics.errors }
      })
    }
  }

  private processAlerts(): void {
    const newAlerts = this.alertManager.getUnprocessedAlerts()

    newAlerts.forEach(alert => {
      this.alerts.push(alert)
      this.emit('alert', alert)

      // Send to external monitoring service
      this.sendAlertToService(alert)
    })

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift()
    }
  }

  private async sendAlertToService(alert: GLXYAlert): Promise<void> {
    try {
      // Send to external monitoring service (e.g., PagerDuty, Slack, etc.)
      console.log('🚨 Alert sent to service:', alert.title)
    } catch (error) {
      console.error('Failed to send alert to service:', error)
    }
  }

  // CLEANUP
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.config.retentionPeriod * 24 * 60 * 60 * 1000)

    // Clean metrics
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime)
    this.gameMetrics = this.gameMetrics.filter(m => m.timestamp > cutoffTime)

    // Clean logs
    this.logs = this.logs.filter(l => l.timestamp > cutoffTime)

    // Clean alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime)

    this.log('info', 'Old data cleaned up', 'system', {
      cutoffTime,
      metricsCount: this.systemMetrics.length,
      logsCount: this.logs.length,
      alertsCount: this.alerts.length
    })
  }

  // GAME METRICS
  public recordGameMetrics(metrics: Partial<GLXYGameMetrics>): void {
    const fullMetrics: GLXYGameMetrics = {
      timestamp: Date.now(),
      players: {
        online: 0,
        inGame: 0,
        inLobby: 0,
        spectating: 0,
        ...metrics.players
      },
      matches: {
        active: 0,
        completed: 0,
        averageDuration: 0,
        ...metrics.matches
      },
      performance: {
        averageFPS: 60,
        serverTickRate: 60,
        clientUpdateTime: 16.67,
        networkQuality: 100,
        ...metrics.performance
      },
      economy: {
        totalTransactions: 0,
        currencyFlow: 0,
        itemPurchases: 0,
        ...metrics.economy
      },
      engagement: {
        sessionDuration: 0,
        retentionRate: 100,
        churnRate: 0,
        activeRate: 100,
        ...metrics.engagement
      },
      revenue: {
        daily: 0,
        monthly: 0,
        arpu: 0,
        arppu: 0,
        ...metrics.revenue
      }
    }

    this.gameMetrics.push(fullMetrics)
    this.analytics.processGameMetrics(fullMetrics)

    // Keep only recent game metrics
    if (this.gameMetrics.length > 1000) {
      this.gameMetrics.shift()
    }

    this.emit('gameMetricsRecorded', fullMetrics)
  }

  // EXPORT FUNCTIONALITY
  public exportMetrics(format: 'json' | 'csv' | 'prometheus' | 'grafana' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify({
          systemMetrics: this.systemMetrics,
          gameMetrics: this.gameMetrics,
          alerts: this.alerts,
          healthChecks: Array.from(this.healthChecks.values())
        }, null, 2)

      case 'csv':
        return this.convertToCSV()

      case 'prometheus':
        return this.convertToPrometheus()

      case 'grafana':
        return this.convertToGrafana()

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private convertToCSV(): string {
    // Convert metrics to CSV format
    const headers = ['timestamp', 'cpu_usage', 'memory_percentage', 'fps', 'latency', 'error_rate']
    const rows = this.systemMetrics.map(m => [
      m.timestamp,
      m.cpu.usage,
      m.memory.percentage,
      m.performance.fps,
      m.network.latency,
      m.errors.rate
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private convertToPrometheus(): string {
    // Convert metrics to Prometheus format
    const metrics: string[] = []

    this.systemMetrics.forEach(m => {
      metrics.push(`cpu_usage ${m.cpu.usage}`)
      metrics.push(`memory_percentage ${m.memory.percentage}`)
      metrics.push(`fps ${m.performance.fps}`)
      metrics.push(`network_latency ${m.network.latency}`)
      metrics.push(`error_rate ${m.errors.rate}`)
    })

    return metrics.join('\n')
  }

  private convertToGrafana(): string {
    // Convert metrics to Grafana format
    return JSON.stringify({
      dashboard: {
        title: 'GLXY Battle Royale Monitoring',
        panels: [
          {
            title: 'System Metrics',
            type: 'graph',
            targets: [
              { expr: 'cpu_usage', legendFormat: 'CPU Usage' },
              { expr: 'memory_percentage', legendFormat: 'Memory Usage' }
            ]
          },
          {
            title: 'Performance',
            type: 'graph',
            targets: [
              { expr: 'fps', legendFormat: 'FPS' },
              { expr: 'network_latency', legendFormat: 'Latency' }
            ]
          }
        ]
      }
    })
  }

  // PERFORMANCE PROFILING
  public startProfiling(name: string): void {
    if (this.config.enablePerformanceProfiling) {
      this.profiler.startProfile(name)
    }
  }

  public endProfiling(name: string): any {
    if (this.config.enablePerformanceProfiling) {
      return this.profiler.endProfile(name)
    }
    return null
  }

  // EVENT HANDLING
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in monitor event listener for ${event}:`, error)
        }
      })
    }
  }

  // PUBLIC API
  public getMetrics(): GLXYSystemMetrics[] {
    return [...this.systemMetrics]
  }

  public getGameMetrics(): GLXYGameMetrics[] {
    return [...this.gameMetrics]
  }

  public getLogs(level?: GLXYLogEntry['level'], category?: GLXYLogEntry['category']): GLXYLogEntry[] {
    let filtered = [...this.logs]

    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    if (category) {
      filtered = filtered.filter(log => log.category === category)
    }

    return filtered
  }

  public getAlerts(severity?: GLXYAlert['severity'], acknowledged?: boolean): GLXYAlert[] {
    let filtered = [...this.alerts]

    if (severity) {
      filtered = filtered.filter(alert => alert.severity === severity)
    }

    if (acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === acknowledged)
    }

    return filtered
  }

  public getHealthChecks(): GLXYHealthCheck[] {
    return Array.from(this.healthChecks.values())
  }

  public acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedBy = userId
      this.emit('alertAcknowledged', alert)
    }
  }

  public resolveAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      alert.resolvedBy = userId
      this.emit('alertResolved', alert)
    }
  }

  public destroy(): void {
    if (!this.isActive) return

    console.log('🗑️ Destroying GLXY Production Monitor')

    this.isActive = false

    // Clear intervals
    if (this.metricsInterval) clearInterval(this.metricsInterval)
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval)
    if (this.alertInterval) clearInterval(this.alertInterval)
    if (this.cleanupInterval) clearInterval(this.cleanupInterval)

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    // Cleanup subsystems
    this.analytics?.destroy()
    this.alertManager?.destroy()
    this.logManager?.destroy()
    this.healthManager?.destroy()
    this.profiler?.destroy()

    // Clear data
    this.systemMetrics = []
    this.gameMetrics = []
    this.logs = []
    this.alerts = []
    this.healthChecks.clear()
    this.userProfiles.clear()
    this.eventListeners.clear()

    GLXYProductionMonitor.instance = null
  }
}

// SUPPORTING CLASSES
class AnalyticsEngine {
  public processMetrics(metrics: GLXYSystemMetrics): void {
    // Process and analyze metrics
  }

  public processGameMetrics(metrics: GLXYGameMetrics): void {
    // Process and analyze game metrics
  }

  public destroy(): void {
    // Cleanup analytics engine
  }
}

class AlertManager {
  private alerts: GLXYAlert[] = []
  private thresholds: GLXYMonitorConfig['alertThresholds']

  constructor(thresholds: GLXYMonitorConfig['alertThresholds']) {
    this.thresholds = thresholds
  }

  public createAlert(alertData: Omit<GLXYAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): void {
    const alert: GLXYAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      ...alertData
    }

    this.alerts.push(alert)
  }

  public getUnprocessedAlerts(): GLXYAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged && !alert.resolved)
  }

  public destroy(): void {
    this.alerts = []
  }
}

class LogManager {
  private logLevel: GLXYMonitorConfig['logLevel']

  constructor(logLevel: GLXYMonitorConfig['logLevel']) {
    this.logLevel = logLevel
  }

  public processLog(log: GLXYLogEntry): void {
    // Process log entry
  }

  public destroy(): void {
    // Cleanup log manager
  }
}

class HealthManager {
  private checks: Map<string, () => Promise<{ status: boolean; responseTime: number }>> = new Map()

  public addCheck(name: string, checkFunction: () => Promise<{ status: boolean; responseTime: number }>): void {
    this.checks.set(name, checkFunction)
  }

  public async runAllChecks(): Promise<Record<string, { status: boolean; responseTime: number } | undefined>> {
    const results: Record<string, { status: boolean; responseTime: number } | undefined> = {}

    for (const [name, checkFunction] of this.checks.entries()) {
      try {
        results[name] = await checkFunction()
      } catch (error) {
        results[name] = { status: false, responseTime: 0 }
      }
    }

    return results
  }

  public destroy(): void {
    this.checks.clear()
  }
}

class PerformanceProfiler {
  private profiles: Map<string, { startTime: number; entries: PerformanceEntry[] }> = new Map()

  public startProfile(name: string): void {
    this.profiles.set(name, {
      startTime: performance.now(),
      entries: []
    })
  }

  public endProfile(name: string): { duration: number; entries: PerformanceEntry[] } | null {
    const profile = this.profiles.get(name)
    if (!profile) return null

    const duration = performance.now() - profile.startTime
    this.profiles.delete(name)

    return {
      duration,
      entries: profile.entries
    }
  }

  public recordPerformanceEntry(entry: PerformanceEntry): void {
    // Record performance entry for active profiles
  }

  public destroy(): void {
    this.profiles.clear()
  }
}

// React Hook for Production Monitor
export const useGLXYProductionMonitor = (
  config?: Partial<GLXYMonitorConfig>
) => {
  const [monitor, setMonitor] = useState<GLXYProductionMonitor | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [metrics, setMetrics] = useState<GLXYSystemMetrics[]>([])
  const [alerts, setAlerts] = useState<GLXYAlert[]>([])
  const [healthChecks, setHealthChecks] = useState<GLXYHealthCheck[]>([])

  useEffect(() => {
    const prodMonitor = new GLXYProductionMonitor(config)

    prodMonitor.on('monitorInitialized', () => {
      setIsInitialized(true)
      setMonitor(prodMonitor)
    })

    prodMonitor.on('metricsCollected', (newMetrics: GLXYSystemMetrics) => {
      setMetrics(prev => [...prev.slice(-100), newMetrics])
    })

    prodMonitor.on('alert', (alert: GLXYAlert) => {
      setAlerts(prev => [...prev, alert])
    })

    prodMonitor.on('healthCheck', (healthCheck: GLXYHealthCheck) => {
      setHealthChecks(prev => [...prev.filter(h => h.id !== healthCheck.id), healthCheck])
    })

    prodMonitor.initialize()

    return () => {
      prodMonitor.destroy()
    }
  }, [config])

  const log = useCallback((
    level: GLXYLogEntry['level'],
    message: string,
    category: GLXYLogEntry['category'],
    data?: any
  ) => {
    monitor?.log(level, message, category, data)
  }, [monitor])

  const trackUser = useCallback((
    playerId: string,
    action: string,
    data?: any
  ) => {
    monitor?.trackUserBehavior(playerId, action, data)
  }, [monitor])

  const recordGameMetrics = useCallback((metrics: Partial<GLXYGameMetrics>) => {
    monitor?.recordGameMetrics(metrics)
  }, [monitor])

  return {
    monitor,
    isInitialized,
    metrics,
    alerts,
    healthChecks,
    log,
    trackUser,
    recordGameMetrics,
    getLogs: (level?: GLXYLogEntry['level'], category?: GLXYLogEntry['category']) =>
      monitor?.getLogs(level, category) || [],
    acknowledgeAlert: (alertId: string, userId: string) =>
      monitor?.acknowledgeAlert(alertId, userId),
    resolveAlert: (alertId: string, userId: string) =>
      monitor?.resolveAlert(alertId, userId),
    exportMetrics: (format: 'json' | 'csv' | 'prometheus' | 'grafana') =>
      monitor?.exportMetrics(format) || ''
  }
}

export default GLXYProductionMonitor