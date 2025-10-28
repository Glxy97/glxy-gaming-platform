import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { DatabasePerformanceMonitor, DatabaseMaintenance } from '@/lib/db-performance'
import { DatabaseConnectionMonitor } from '@/lib/db-optimized'
import { MaintenanceScheduler, PerformanceAlerting } from '@/lib/db-maintenance'
import { z } from 'zod'

/**
 * Database Performance Monitoring API
 * Admin-only endpoint for monitoring database health and performance
 */

const querySchema = z.object({
  action: z.enum(['health', 'metrics', 'maintenance', 'alerts', 'analyze']).optional(),
  table: z.string().optional(),
  query: z.string().optional(),
  limit: z.number().min(1).max(100).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Admin-only access
    if (!session?.user?.email || !process.env.ADMIN_EMAILS?.split(',').includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validation = querySchema.safeParse({
      action: searchParams.get('action') || 'health',
      table: searchParams.get('table') || undefined,
      query: searchParams.get('query') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    })

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid parameters',
        details: validation.error.errors
      }, { status: 400 })
    }

    const { action, table, query, limit } = validation.data

    let result: any = {}

    switch (action) {
      case 'health':
        result = await getDatabaseHealth()
        break

      case 'metrics':
        result = await getPerformanceMetrics()
        break

      case 'maintenance':
        result = await getMaintenanceStatus()
        break

      case 'alerts':
        result = await getPerformanceAlerts()
        break

      case 'analyze':
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required for analyze action' }, { status: 400 })
        }
        result = await analyzeQuery(query)
        break

      default:
        result = await getDatabaseHealth()
    }

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      data: result
    })

  } catch (error) {
    console.error('Database performance API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Admin-only access
    if (!session?.user?.email || !process.env.ADMIN_EMAILS?.split(',').includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { action, parameters } = body

    let result: any = {}

    switch (action) {
      case 'run_maintenance':
        result = await runMaintenanceTask(parameters?.task || 'update_statistics')
        break

      case 'vacuum_table':
        if (!parameters?.table) {
          return NextResponse.json({ error: 'Table parameter required' }, { status: 400 })
        }
        result = await runTableMaintenance(parameters.table)
        break

      case 'analyze_slow_queries':
        result = await analyzeSlowQueries(parameters?.limit || 10)
        break

      case 'restart_maintenance_scheduler':
        result = await restartMaintenanceScheduler()
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      data: result
    })

  } catch (error) {
    console.error('Database maintenance API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get comprehensive database health status
 */
async function getDatabaseHealth() {
  const [
    generalHealth,
    connectionHealth,
    cacheStats
  ] = await Promise.all([
    DatabasePerformanceMonitor.getDatabaseHealth(),
    DatabaseConnectionMonitor.checkHealth(),
    getCacheStatistics()
  ])

  return {
    overall: {
      status: generalHealth.isHealthy && connectionHealth.isHealthy ? 'healthy' : 'degraded',
      score: calculateHealthScore(generalHealth, connectionHealth),
      lastChecked: new Date().toISOString()
    },
    database: {
      isHealthy: generalHealth.isHealthy,
      connectionCount: generalHealth.connectionCount,
      activeConnections: generalHealth.activeConnections,
      cacheHitRatio: generalHealth.cacheHitRatio,
      diskUsage: generalHealth.diskUsage,
      slowQueryCount: generalHealth.slowQueries.length,
      recommendations: generalHealth.recommendations
    },
    connections: {
      isHealthy: connectionHealth.isHealthy,
      metrics: connectionHealth.metrics,
      poolInfo: connectionHealth.poolInfo
    },
    cache: cacheStats,
    indexes: {
      total: generalHealth.indexUsage.length,
      unused: generalHealth.indexUsage.filter(idx => idx.efficiency === 'unused').length,
      lowEfficiency: generalHealth.indexUsage.filter(idx => idx.efficiency === 'low').length
    },
    tables: {
      total: generalHealth.tableStats.length,
      needingMaintenance: generalHealth.tableStats.filter(table => {
        const daysSinceVacuum = table.lastVacuum
          ? (Date.now() - table.lastVacuum.getTime()) / (1000 * 60 * 60 * 24)
          : 999
        return daysSinceVacuum > 7
      }).length
    }
  }
}

/**
 * Get detailed performance metrics
 */
async function getPerformanceMetrics() {
  const [
    slowQueries,
    indexUsage,
    tableStats,
    connectionStats
  ] = await Promise.all([
    DatabasePerformanceMonitor.getSlowQueries(20),
    DatabasePerformanceMonitor.getIndexUsageStats(),
    DatabasePerformanceMonitor.getTableStatistics(),
    DatabaseConnectionMonitor.getMetrics()
  ])

  return {
    queries: {
      slow: slowQueries,
      avgResponseTime: calculateAverageResponseTime(slowQueries),
      totalExecutions: connectionStats.totalQueries,
      errorRate: connectionStats.errorCount / Math.max(connectionStats.totalQueries, 1)
    },
    indexes: {
      usage: indexUsage,
      efficiency: calculateIndexEfficiency(indexUsage),
      suggestions: generateIndexSuggestions(indexUsage)
    },
    tables: {
      statistics: tableStats,
      sizes: tableStats.map(table => ({
        name: table.tableName,
        size: formatBytes(table.totalSizeBytes),
        rowCount: table.rowCount
      })),
      maintenance: tableStats.map(table => ({
        name: table.tableName,
        lastVacuum: table.lastVacuum,
        lastAnalyze: table.lastAnalyze,
        needsMaintenance: checkMaintenanceNeeded(table)
      }))
    },
    connections: connectionStats
  }
}

/**
 * Get maintenance status and reports
 */
async function getMaintenanceStatus() {
  const reports = await MaintenanceScheduler.getMaintenanceReports(20)

  return {
    scheduler: {
      isRunning: true, // Would check actual scheduler status
      lastRun: reports[0]?.endTime || null,
      nextScheduledTasks: getNextScheduledTasks()
    },
    recentReports: reports,
    summary: {
      successRate: calculateSuccessRate(reports),
      averageDuration: calculateAverageDuration(reports),
      failedTasks: reports.filter(r => !r.success).length
    }
  }
}

/**
 * Get performance alerts
 */
async function getPerformanceAlerts() {
  const alerts = await PerformanceAlerting.checkAlerts()

  return {
    active: alerts,
    count: alerts.length,
    severity: determineSeverity(alerts),
    timestamp: new Date().toISOString()
  }
}

/**
 * Analyze a specific query
 */
async function analyzeQuery(query: string) {
  try {
    const analysis = await DatabasePerformanceMonitor.explainQuery(query)

    return {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      executionPlan: analysis,
      suggestions: generateQuerySuggestions(analysis),
      estimatedCost: extractEstimatedCost(analysis),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Query analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Run a maintenance task
 */
async function runMaintenanceTask(taskName: string) {
  const report = await MaintenanceScheduler.executeMaintenanceTask(taskName)

  return {
    task: taskName,
    report,
    status: report.success ? 'completed' : 'failed'
  }
}

/**
 * Run maintenance on a specific table
 */
async function runTableMaintenance(tableName: string) {
  try {
    await DatabaseMaintenance.runMaintenanceTable(tableName)

    return {
      table: tableName,
      status: 'completed',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Table maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Analyze slow queries
 */
async function analyzeSlowQueries(limit: number = 10) {
  const slowQueries = await DatabasePerformanceMonitor.getSlowQueries(limit)

  return {
    queries: slowQueries,
    analysis: {
      totalSlowQueries: slowQueries.length,
      averageTime: slowQueries.reduce((sum, q) => sum + q.avgTime, 0) / Math.max(slowQueries.length, 1),
      mostExpensive: slowQueries[0] || null,
      patterns: identifyQueryPatterns(slowQueries)
    },
    recommendations: generateSlowQueryRecommendations(slowQueries)
  }
}

/**
 * Restart maintenance scheduler
 */
async function restartMaintenanceScheduler() {
  try {
    MaintenanceScheduler.stopScheduler()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    MaintenanceScheduler.startScheduler()

    return {
      status: 'restarted',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Scheduler restart failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper functions
function calculateHealthScore(dbHealth: any, connHealth: any): number {
  let score = 100

  // Deduct points for issues
  if (!dbHealth.isHealthy) score -= 30
  if (!connHealth.isHealthy) score -= 20
  if (dbHealth.cacheHitRatio < 0.9) score -= 15
  if (dbHealth.slowQueries.length > 5) score -= 10
  if (dbHealth.recommendations.length > 3) score -= 10

  return Math.max(0, score)
}

function calculateAverageResponseTime(slowQueries: any[]): number {
  if (slowQueries.length === 0) return 0
  return slowQueries.reduce((sum, q) => sum + q.avgTime, 0) / slowQueries.length
}

function calculateIndexEfficiency(indexes: any[]): number {
  if (indexes.length === 0) return 100

  const efficient = indexes.filter(idx => idx.efficiency === 'high').length
  return (efficient / indexes.length) * 100
}

function generateIndexSuggestions(indexes: any[]): string[] {
  const suggestions: string[] = []

  const unused = indexes.filter(idx => idx.efficiency === 'unused')
  if (unused.length > 0) {
    suggestions.push(`Consider dropping ${unused.length} unused indexes to save space`)
  }

  const lowEfficiency = indexes.filter(idx => idx.efficiency === 'low')
  if (lowEfficiency.length > 0) {
    suggestions.push(`Review ${lowEfficiency.length} low-efficiency indexes for optimization`)
  }

  return suggestions
}

function checkMaintenanceNeeded(table: any): boolean {
  if (!table.lastVacuum) return true

  const daysSinceVacuum = (Date.now() - table.lastVacuum.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceVacuum > 7
}

function getNextScheduledTasks(): any[] {
  // This would return actual scheduled tasks
  return [
    { task: 'update_statistics', nextRun: new Date(Date.now() + 60 * 60 * 1000) },
    { task: 'vacuum_gaming_tables', nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  ]
}

function calculateSuccessRate(reports: any[]): number {
  if (reports.length === 0) return 100

  const successful = reports.filter(r => r.success).length
  return (successful / reports.length) * 100
}

function calculateAverageDuration(reports: any[]): number {
  if (reports.length === 0) return 0

  return reports.reduce((sum, r) => sum + r.duration, 0) / reports.length
}

function determineSeverity(alerts: string[]): 'low' | 'medium' | 'high' | 'critical' {
  if (alerts.some(alert => alert.includes('CRITICAL'))) return 'critical'
  if (alerts.some(alert => alert.includes('HIGH'))) return 'high'
  if (alerts.length > 3) return 'medium'
  return 'low'
}

function generateQuerySuggestions(analysis: any[]): string[] {
  // Analyze execution plan and generate suggestions
  const suggestions: string[] = []

  const planStr = JSON.stringify(analysis)

  if (planStr.includes('Seq Scan')) {
    suggestions.push('Consider adding indexes to avoid sequential scans')
  }

  if (planStr.includes('Sort')) {
    suggestions.push('Consider adding indexes for ORDER BY clauses')
  }

  if (planStr.includes('Hash Join')) {
    suggestions.push('Review join conditions and indexes')
  }

  return suggestions
}

function extractEstimatedCost(analysis: any[]): number {
  try {
    const plan = analysis[0]?.['QUERY PLAN']?.[0]
    return plan?.['Total Cost'] || 0
  } catch {
    return 0
  }
}

function identifyQueryPatterns(queries: any[]): string[] {
  const patterns: string[] = []

  const hasSelectQueries = queries.some(q => q.query.toLowerCase().includes('select'))
  const hasUpdateQueries = queries.some(q => q.query.toLowerCase().includes('update'))
  const hasJoins = queries.some(q => q.query.toLowerCase().includes('join'))

  if (hasSelectQueries) patterns.push('Heavy SELECT operations')
  if (hasUpdateQueries) patterns.push('Slow UPDATE operations')
  if (hasJoins) patterns.push('Complex JOIN queries')

  return patterns
}

function generateSlowQueryRecommendations(queries: any[]): string[] {
  const recommendations: string[] = []

  if (queries.length > 10) {
    recommendations.push('High number of slow queries detected - review indexing strategy')
  }

  const avgTime = queries.reduce((sum, q) => sum + q.avgTime, 0) / Math.max(queries.length, 1)
  if (avgTime > 5000) {
    recommendations.push('Very high average query time - consider query optimization')
  }

  return recommendations
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function getCacheStatistics() {
  // This would integrate with your cache monitoring
  return {
    hitRatio: 92.5,
    totalKeys: 1234,
    memoryUsage: '256 MB',
    status: 'healthy'
  }
}