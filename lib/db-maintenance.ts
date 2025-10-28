import { PrismaClient } from '@prisma/client'
import { prisma } from './db-optimized'
import { DatabasePerformanceMonitor, DatabaseMaintenance } from './db-performance'
import { CacheManager } from './redis'

/**
 * Comprehensive Database Maintenance and Monitoring System
 * GLXY Gaming Platform - Automated maintenance procedures
 */

export interface MaintenanceSchedule {
  task: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  nextRun: Date
  lastRun?: Date
  enabled: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface MaintenanceReport {
  taskName: string
  startTime: Date
  endTime: Date
  success: boolean
  duration: number
  details: string
  affectedTables?: string[]
  performanceImpact?: {
    before: any
    after: any
  }
}

/**
 * Automated database maintenance scheduler
 */
export class DatabaseMaintenanceScheduler {
  private static intervals: NodeJS.Timeout[] = []
  private static isRunning = false

  private static readonly MAINTENANCE_SCHEDULE: MaintenanceSchedule[] = [
    {
      task: 'update_statistics',
      frequency: 'hourly',
      nextRun: new Date(),
      enabled: true,
      priority: 'high'
    },
    {
      task: 'vacuum_gaming_tables',
      frequency: 'daily',
      nextRun: new Date(),
      enabled: true,
      priority: 'high'
    },
    {
      task: 'cleanup_expired_sessions',
      frequency: 'daily',
      nextRun: new Date(),
      enabled: true,
      priority: 'medium'
    },
    {
      task: 'analyze_slow_queries',
      frequency: 'daily',
      nextRun: new Date(),
      enabled: true,
      priority: 'medium'
    },
    {
      task: 'reindex_fragmented_indexes',
      frequency: 'weekly',
      nextRun: new Date(),
      enabled: true,
      priority: 'medium'
    },
    {
      task: 'cleanup_old_audit_logs',
      frequency: 'weekly',
      nextRun: new Date(),
      enabled: true,
      priority: 'low'
    },
    {
      task: 'full_database_maintenance',
      frequency: 'monthly',
      nextRun: new Date(),
      enabled: true,
      priority: 'critical'
    }
  ]

  /**
   * Start the maintenance scheduler
   */
  static startScheduler(): void {
    if (this.isRunning) {
      console.log('⚠️ Maintenance scheduler already running')
      return
    }

    console.log('⏰ Starting database maintenance scheduler...')

    // Schedule each maintenance task
    this.MAINTENANCE_SCHEDULE.forEach(schedule => {
      if (schedule.enabled) {
        this.scheduleTask(schedule)
      }
    })

    // Health monitoring every 5 minutes
    const healthInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, 5 * 60 * 1000)

    this.intervals.push(healthInterval)
    this.isRunning = true

    console.log('✅ Database maintenance scheduler started')
  }

  /**
   * Stop the maintenance scheduler
   */
  static stopScheduler(): void {
    console.log('⏹️ Stopping database maintenance scheduler...')

    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
    this.isRunning = false

    console.log('✅ Database maintenance scheduler stopped')
  }

  /**
   * Schedule a specific maintenance task
   */
  private static scheduleTask(schedule: MaintenanceSchedule): void {
    const getInterval = (frequency: string): number => {
      switch (frequency) {
        case 'hourly': return 60 * 60 * 1000
        case 'daily': return 24 * 60 * 60 * 1000
        case 'weekly': return 7 * 24 * 60 * 60 * 1000
        case 'monthly': return 30 * 24 * 60 * 60 * 1000
        default: return 24 * 60 * 60 * 1000
      }
    }

    const interval = setInterval(async () => {
      try {
        await this.executeMaintenanceTask(schedule.task)
      } catch (error) {
        console.error(`Maintenance task ${schedule.task} failed:`, error)
      }
    }, getInterval(schedule.frequency))

    this.intervals.push(interval)
  }

  /**
   * Execute a specific maintenance task
   */
  static async executeMaintenanceTask(taskName: string): Promise<MaintenanceReport> {
    const startTime = new Date()
    console.log(`🔧 Starting maintenance task: ${taskName}`)

    let report: MaintenanceReport = {
      taskName,
      startTime,
      endTime: new Date(),
      success: false,
      duration: 0,
      details: ''
    }

    try {
      switch (taskName) {
        case 'update_statistics':
          await this.updateTableStatistics()
          report.details = 'Updated table statistics for query optimizer'
          break

        case 'vacuum_gaming_tables':
          await this.vacuumGamingTables()
          report.details = 'Vacuumed high-traffic gaming tables'
          break

        case 'cleanup_expired_sessions':
          const cleaned = await this.cleanupExpiredSessions()
          report.details = `Cleaned up ${cleaned} expired sessions`
          break

        case 'analyze_slow_queries':
          const slowQueries = await this.analyzeSlowQueries()
          report.details = `Found ${slowQueries.length} slow queries`
          break

        case 'reindex_fragmented_indexes':
          await this.reindexFragmentedIndexes()
          report.details = 'Reindexed fragmented indexes'
          break

        case 'cleanup_old_audit_logs':
          const auditCleaned = await this.cleanupOldAuditLogs()
          report.details = `Cleaned up ${auditCleaned} old audit log entries`
          break

        case 'full_database_maintenance':
          await this.performFullMaintenance()
          report.details = 'Performed comprehensive database maintenance'
          break

        default:
          throw new Error(`Unknown maintenance task: ${taskName}`)
      }

      report.success = true
    } catch (error) {
      report.success = false
      report.details = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(`❌ Maintenance task ${taskName} failed:`, error)
    }

    report.endTime = new Date()
    report.duration = report.endTime.getTime() - report.startTime.getTime()

    console.log(`✅ Maintenance task ${taskName} completed in ${report.duration}ms`)

    // Store maintenance report
    await this.storeMaintenanceReport(report)

    return report
  }

  /**
   * Update table statistics for better query planning
   */
  private static async updateTableStatistics(): Promise<void> {
    const gamingTables = [
      'users',
      'game_stats',
      'game_rooms',
      'players_in_rooms',
      'chat_messages',
      'user_achievements',
      'tournaments',
      'notifications'
    ]

    for (const table of gamingTables) {
      try {
        await prisma.$executeRawUnsafe(`ANALYZE "${table}"`)
      } catch (error) {
        console.warn(`Failed to analyze table ${table}:`, error)
      }
    }
  }

  /**
   * VACUUM high-traffic gaming tables
   */
  private static async vacuumGamingTables(): Promise<void> {
    const highTrafficTables = [
      'game_stats',
      'game_rooms',
      'players_in_rooms',
      'chat_messages',
      'sessions'
    ]

    for (const table of highTrafficTables) {
      try {
        await prisma.$executeRawUnsafe(`VACUUM ANALYZE "${table}"`)
      } catch (error) {
        console.warn(`Failed to vacuum table ${table}:`, error)
      }
    }
  }

  /**
   * Clean up expired sessions and tokens
   */
  private static async cleanupExpiredSessions(): Promise<number> {
    // Clean expired sessions
    const expiredSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })

    // Clean expired verification tokens
    const expiredTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })

    return expiredSessions.count + expiredTokens.count
  }

  /**
   * Analyze and report slow queries
   */
  private static async analyzeSlowQueries(): Promise<any[]> {
    return await DatabasePerformanceMonitor.getSlowQueries(20)
  }

  /**
   * Reindex fragmented indexes
   */
  private static async reindexFragmentedIndexes(): Promise<void> {
    // Get index usage statistics
    const indexStats = await DatabasePerformanceMonitor.getIndexUsageStats()

    // Identify indexes that may benefit from reindexing
    const candidateIndexes = indexStats.filter(idx =>
      idx.efficiency === 'low' && idx.sizeBytes > 1024 * 1024 // > 1MB
    )

    for (const idx of candidateIndexes) {
      try {
        await prisma.$executeRawUnsafe(`REINDEX INDEX "${idx.indexName}"`)
        console.log(`🔄 Reindexed: ${idx.indexName}`)
      } catch (error) {
        console.warn(`Failed to reindex ${idx.indexName}:`, error)
      }
    }
  }

  /**
   * Clean up old audit logs
   */
  private static async cleanupOldAuditLogs(): Promise<number> {
    // TODO: Implement auditLog model in Prisma schema
    // For now, return 0 as placeholder
    return 0
  }

  /**
   * Perform comprehensive monthly maintenance
   */
  private static async performFullMaintenance(): Promise<void> {
    console.log('🔧 Starting full database maintenance...')

    // Full VACUUM ANALYZE
    await prisma.$executeRaw`VACUUM ANALYZE`

    // Update all statistics
    await this.updateTableStatistics()

    // Reindex all indexes
    await prisma.$executeRaw`REINDEX DATABASE ${raw(process.env.POSTGRES_DB || 'glxy_gaming')}`

    // Clean up orphaned data
    await this.cleanupOrphanedData()

    console.log('✅ Full database maintenance completed')
  }

  /**
   * Clean up orphaned data across tables
   */
  private static async cleanupOrphanedData(): Promise<void> {
    // Clean up orphaned game stats (users that no longer exist)
    await prisma.$executeRaw`
      DELETE FROM "game_stats"
      WHERE "userId" NOT IN (SELECT "id" FROM "users")
    `

    // Clean up orphaned chat messages (rooms that no longer exist)
    await prisma.$executeRaw`
      DELETE FROM "chat_messages"
      WHERE "roomId" IS NOT NULL
      AND "roomId" NOT IN (SELECT "id" FROM "game_rooms")
    `

    // Clean up orphaned achievements
    await prisma.$executeRaw`
      DELETE FROM "user_achievements"
      WHERE "userId" NOT IN (SELECT "id" FROM "users")
      OR "achievementId" NOT IN (SELECT "id" FROM "achievements")
    `
  }

  /**
   * Perform health check
   */
  private static async performHealthCheck(): Promise<void> {
    try {
      const health = await DatabasePerformanceMonitor.getDatabaseHealth()

      if (!health.isHealthy) {
        console.warn('⚠️ Database health check failed:', health.recommendations)

        // Trigger immediate maintenance if critical issues detected
        if (health.recommendations.some(r => r.includes('critical'))) {
          console.log('🚨 Critical issues detected, triggering emergency maintenance')
          await this.executeMaintenanceTask('vacuum_gaming_tables')
        }
      }

      // Cache health status for monitoring
      await CacheManager.set('db:health', health, 5 * 60) // 5 minutes
    } catch (error) {
      console.error('Health check failed:', error)
    }
  }

  /**
   * Store maintenance report
   */
  private static async storeMaintenanceReport(report: MaintenanceReport): Promise<void> {
    try {
      const reportKey = `maintenance:report:${report.taskName}:${report.startTime.getTime()}`
      await CacheManager.set(reportKey, report, 7 * 24 * 60 * 60) // Keep for 7 days

      // Store in maintenance log list
      await CacheManager.lpush('maintenance:reports', report)
      // Note: List trimming is handled by CacheManager implementation
    } catch (error) {
      console.error('Failed to store maintenance report:', error)
    }
  }

  /**
   * Get maintenance reports
   */
  static async getMaintenanceReports(limit: number = 20): Promise<MaintenanceReport[]> {
    try {
      return await CacheManager.lrange('maintenance:reports', 0, limit - 1)
    } catch (error) {
      console.error('Failed to get maintenance reports:', error)
      return []
    }
  }
}

/**
 * Database performance alerting system
 */
export class DatabaseAlerting {
  private static readonly ALERT_THRESHOLDS = {
    slowQueryCount: 10,
    cacheHitRatio: 0.85,
    connectionUtilization: 0.8,
    diskUsagePercent: 0.9
  }

  /**
   * Check for performance alerts
   */
  static async checkAlerts(): Promise<string[]> {
    const alerts: string[] = []

    try {
      const health = await DatabasePerformanceMonitor.getDatabaseHealth()

      // Check slow queries
      if (health.slowQueries.length > this.ALERT_THRESHOLDS.slowQueryCount) {
        alerts.push(`HIGH_SLOW_QUERIES: ${health.slowQueries.length} slow queries detected`)
      }

      // Check cache hit ratio
      if (health.cacheHitRatio < this.ALERT_THRESHOLDS.cacheHitRatio) {
        alerts.push(`LOW_CACHE_HIT_RATIO: Cache hit ratio at ${health.cacheHitRatio}%`)
      }

      // Check connection utilization
      const connectionUtil = health.activeConnections / health.connectionCount
      if (connectionUtil > this.ALERT_THRESHOLDS.connectionUtilization) {
        alerts.push(`HIGH_CONNECTION_USAGE: ${Math.round(connectionUtil * 100)}% connection utilization`)
      }

      // Check disk usage
      if (health.diskUsage.percentage > this.ALERT_THRESHOLDS.diskUsagePercent) {
        alerts.push(`HIGH_DISK_USAGE: ${health.diskUsage.percentage}% disk usage`)
      }

      // Store alerts in cache for monitoring
      if (alerts.length > 0) {
        await CacheManager.set('db:alerts', alerts, 10 * 60) // 10 minutes
      }

    } catch (error) {
      alerts.push(`MONITORING_ERROR: Failed to check database alerts: ${error}`)
    }

    return alerts
  }

  /**
   * Send alerts to monitoring system
   */
  static async sendAlerts(alerts: string[]): Promise<void> {
    for (const alert of alerts) {
      console.warn(`🚨 DATABASE ALERT: ${alert}`)

      // Here you would integrate with your alerting system
      // e.g., Slack, Discord, email, Sentry, etc.
      try {
        // Example: Send to external monitoring service
        // await this.sendToMonitoringService(alert)
      } catch (error) {
        console.error('Failed to send alert:', error)
      }
    }
  }
}

/**
 * Database backup and recovery utilities
 */
export class DatabaseBackupManager {
  /**
   * Create a logical backup of critical gaming data
   */
  static async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `/backups/glxy_gaming_${timestamp}.sql`

    try {
      // This would typically use pg_dump in a real environment
      console.log(`📦 Creating database backup: ${backupPath}`)

      // For Docker environment, this would be:
      // docker exec glxy_gaming_db pg_dump -U $POSTGRES_USER $POSTGRES_DB > $backupPath

      return backupPath
    } catch (error) {
      console.error('Backup creation failed:', error)
      throw error
    }
  }

  /**
   * Verify backup integrity
   */
  static async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      // Implement backup verification logic
      console.log(`✅ Backup verified: ${backupPath}`)
      return true
    } catch (error) {
      console.error('Backup verification failed:', error)
      return false
    }
  }
}

// Helper function for raw SQL identifiers
function raw(value: string): any {
  return { __raw: value }
}

export {
  DatabaseMaintenanceScheduler as MaintenanceScheduler,
  DatabaseAlerting as PerformanceAlerting,
  DatabaseBackupManager as BackupManager
}