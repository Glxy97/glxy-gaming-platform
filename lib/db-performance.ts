// @ts-nocheck
import { PrismaClient } from '@prisma/client'
import { prisma } from './db'

/**
 * Database Performance Monitoring and Optimization Utilities
 * GLXY Gaming Platform - PostgreSQL Performance Analysis
 */

export interface QueryPerformanceMetric {
  queryId: string
  query: string
  calls: number
  totalTime: number
  avgTime: number
  maxTime: number
  minTime: number
  rows: number
  hitRatio?: number
}

export interface DatabaseHealthStatus {
  isHealthy: boolean
  connectionCount: number
  activeConnections: number
  slowQueries: QueryPerformanceMetric[]
  cacheHitRatio: number
  diskUsage: {
    total: string
    used: string
    available: string
    percentage: number
  }
  indexUsage: IndexUsageStats[]
  tableStats: TableStatistics[]
  recommendations: string[]
}

export interface IndexUsageStats {
  schemaName: string
  tableName: string
  indexName: string
  timesUsed: number
  sizeBytes: number
  reltuples: number
  isUnique: boolean
  definition: string
  efficiency: 'high' | 'medium' | 'low' | 'unused'
}

export interface TableStatistics {
  tableName: string
  rowCount: number
  sizeBytes: number
  indexSizeBytes: number
  totalSizeBytes: number
  vacuumCount: number
  analyzeCount: number
  lastVacuum?: Date
  lastAnalyze?: Date
  bloatRatio?: number
}

export class DatabasePerformanceMonitor {

  /**
   * Get comprehensive database health status
   */
  static async getDatabaseHealth(): Promise<DatabaseHealthStatus> {
    try {
      const [
        connectionStats,
        slowQueries,
        cacheStats,
        diskUsage,
        indexUsage,
        tableStats
      ] = await Promise.all([
        this.getConnectionStats(),
        this.getSlowQueries(),
        this.getCacheHitRatio(),
        this.getDiskUsage(),
        this.getIndexUsageStats(),
        this.getTableStatistics()
      ])

      const recommendations = this.generateRecommendations({
        connectionStats,
        slowQueries,
        cacheStats,
        indexUsage,
        tableStats
      })

      return {
        isHealthy: slowQueries.length < 5 && cacheStats > 0.9 && connectionStats.active < 80,
        connectionCount: connectionStats.total,
        activeConnections: connectionStats.active,
        slowQueries,
        cacheHitRatio: cacheStats,
        diskUsage,
        indexUsage,
        tableStats,
        recommendations
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      return {
        isHealthy: false,
        connectionCount: 0,
        activeConnections: 0,
        slowQueries: [],
        cacheHitRatio: 0,
        diskUsage: { total: '0', used: '0', available: '0', percentage: 0 },
        indexUsage: [],
        tableStats: [],
        recommendations: ['Database health check failed - check connection']
      }
    }
  }

  /**
   * Get current connection statistics
   */
  static async getConnectionStats(): Promise<{ total: number; active: number; idle: number }> {
    const result = await prisma.$queryRaw<Array<{
      total_connections: bigint
      active_connections: bigint
      idle_connections: bigint
    }>>`
      SELECT
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `

    const stats = result[0]
    return {
      total: Number(stats.total_connections),
      active: Number(stats.active_connections),
      idle: Number(stats.idle_connections)
    }
  }

  /**
   * Identify slow queries using pg_stat_statements
   */
  static async getSlowQueries(limit: number = 10): Promise<QueryPerformanceMetric[]> {
    try {
      // First, ensure pg_stat_statements extension is available
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`

      const slowQueries = await prisma.$queryRaw<Array<{
        queryid: bigint
        query: string
        calls: bigint
        total_exec_time: number
        mean_exec_time: number
        max_exec_time: number
        min_exec_time: number
        rows: bigint
      }>>`
        SELECT
          queryid,
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time,
          min_exec_time,
          rows
        FROM pg_stat_statements
        WHERE mean_exec_time > 100  -- Queries taking more than 100ms on average
        ORDER BY mean_exec_time DESC
        LIMIT ${limit}
      `

      return slowQueries.map(q => ({
        queryId: q.queryid.toString(),
        query: q.query,
        calls: Number(q.calls),
        totalTime: q.total_exec_time,
        avgTime: q.mean_exec_time,
        maxTime: q.max_exec_time,
        minTime: q.min_exec_time,
        rows: Number(q.rows)
      }))
    } catch (error) {
      console.warn('pg_stat_statements not available, using basic slow query detection')
      return []
    }
  }

  /**
   * Get cache hit ratio for buffer cache
   */
  static async getCacheHitRatio(): Promise<number> {
    const result = await prisma.$queryRaw<Array<{
      hit_ratio: number
    }>>`
      SELECT
        round(
          100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read) + 1), 2
        ) as hit_ratio
      FROM pg_stat_database
      WHERE datname = current_database()
    `

    return result[0]?.hit_ratio || 0
  }

  /**
   * Get disk usage statistics
   */
  static async getDiskUsage() {
    const result = await prisma.$queryRaw<Array<{
      database_size: string
      total_size: bigint
    }>>`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_database_size(current_database()) as total_size
    `

    const dbSize = result[0]

    // Note: Getting actual disk usage requires filesystem access
    // This is a simplified version showing database size
    return {
      total: dbSize.database_size,
      used: dbSize.database_size,
      available: 'N/A',
      percentage: 0 // Would need filesystem access to calculate
    }
  }

  /**
   * Analyze index usage efficiency
   */
  static async getIndexUsageStats(): Promise<IndexUsageStats[]> {
    const indexStats = await prisma.$queryRaw<Array<{
      schemaname: string
      tablename: string
      indexname: string
      idx_tup_read: bigint
      idx_tup_fetch: bigint
      size_bytes: bigint
      reltuples: number
      indisunique: boolean
      indexdef: string
    }>>`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        pg_relation_size(indexrelname::regclass) as size_bytes,
        c.reltuples,
        i.indisunique,
        pg_get_indexdef(i.indexrelid) as indexdef
      FROM pg_stat_user_indexes s
      JOIN pg_index i ON s.indexrelid = i.indexrelid
      JOIN pg_class c ON i.indrelid = c.oid
      ORDER BY idx_tup_read DESC
    `

    return indexStats.map(stat => {
      const timesUsed = Number(stat.idx_tup_read)
      let efficiency: 'high' | 'medium' | 'low' | 'unused'

      if (timesUsed === 0) efficiency = 'unused'
      else if (timesUsed > 10000) efficiency = 'high'
      else if (timesUsed > 1000) efficiency = 'medium'
      else efficiency = 'low'

      return {
        schemaName: stat.schemaname,
        tableName: stat.tablename,
        indexName: stat.indexname,
        timesUsed,
        sizeBytes: Number(stat.size_bytes),
        reltuples: stat.reltuples,
        isUnique: stat.indisunique,
        definition: stat.indexdef,
        efficiency
      }
    })
  }

  /**
   * Get comprehensive table statistics
   */
  static async getTableStatistics(): Promise<TableStatistics[]> {
    const tableStats = await prisma.$queryRaw<Array<{
      tablename: string
      row_count: bigint
      table_size: bigint
      index_size: bigint
      total_size: bigint
      vacuum_count: bigint
      analyze_count: bigint
      last_vacuum?: Date
      last_analyze?: Date
    }>>`
      SELECT
        schemaname || '.' || tablename as tablename,
        n_tup_ins + n_tup_upd + n_tup_del as row_count,
        pg_relation_size(schemaname||'.'||tablename) as table_size,
        pg_indexes_size(schemaname||'.'||tablename) as index_size,
        pg_total_relation_size(schemaname||'.'||tablename) as total_size,
        vacuum_count,
        analyze_count,
        last_vacuum,
        last_analyze
      FROM pg_stat_user_tables
      ORDER BY total_size DESC
    `

    return tableStats.map(stat => ({
      tableName: stat.tablename,
      rowCount: Number(stat.row_count),
      sizeBytes: Number(stat.table_size),
      indexSizeBytes: Number(stat.index_size),
      totalSizeBytes: Number(stat.total_size),
      vacuumCount: Number(stat.vacuum_count),
      analyzeCount: Number(stat.analyze_count),
      lastVacuum: stat.last_vacuum,
      lastAnalyze: stat.last_analyze
    }))
  }

  /**
   * Generate optimization recommendations
   */
  static generateRecommendations(data: any): string[] {
    const recommendations: string[] = []

    // Connection pool analysis
    if (data.connectionStats.active > 50) {
      recommendations.push('High number of active connections detected. Consider optimizing connection pooling.')
    }

    // Cache hit ratio analysis
    if (data.cacheStats < 0.95) {
      recommendations.push(`Cache hit ratio is ${data.cacheStats}%. Consider increasing shared_buffers or analyzing query patterns.`)
    }

    // Slow query analysis
    if (data.slowQueries.length > 0) {
      recommendations.push(`${data.slowQueries.length} slow queries detected. Review query optimization and indexing.`)
    }

    // Index usage analysis
    const unusedIndexes = data.indexUsage.filter((idx: IndexUsageStats) => idx.efficiency === 'unused')
    if (unusedIndexes.length > 0) {
      recommendations.push(`${unusedIndexes.length} unused indexes found. Consider dropping them to save space.`)
    }

    // Table maintenance analysis
    const tablesNeedingMaintenance = data.tableStats.filter((table: TableStatistics) => {
      const daysSinceVacuum = table.lastVacuum
        ? (Date.now() - table.lastVacuum.getTime()) / (1000 * 60 * 60 * 24)
        : 999
      return daysSinceVacuum > 7
    })

    if (tablesNeedingMaintenance.length > 0) {
      recommendations.push(`${tablesNeedingMaintenance.length} tables need maintenance (VACUUM/ANALYZE).`)
    }

    return recommendations
  }

  /**
   * Run EXPLAIN ANALYZE on a query
   */
  static async explainQuery(query: string): Promise<any[]> {
    try {
      const result = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`)
      return result as any[]
    } catch (error) {
      console.error('Error running EXPLAIN ANALYZE:', error)
      throw error
    }
  }

  /**
   * Get lock information
   */
  static async getLockInformation() {
    return await prisma.$queryRaw`
      SELECT
        pg_class.relname,
        pg_locks.transactionid,
        pg_locks.mode,
        pg_locks.granted,
        pg_stat_activity.query,
        pg_stat_activity.query_start,
        pg_stat_activity.state
      FROM pg_locks
      LEFT JOIN pg_class ON pg_locks.relation = pg_class.oid
      LEFT JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
      WHERE NOT pg_locks.granted
      ORDER BY pg_locks.granted, pg_class.relname
    `
  }

  /**
   * Monitor real-time query performance
   */
  static async getCurrentActiveQueries() {
    return await prisma.$queryRaw`
      SELECT
        pid,
        now() - pg_stat_activity.query_start AS duration,
        query,
        state,
        client_addr,
        application_name
      FROM pg_stat_activity
      WHERE (now() - pg_stat_activity.query_start) > interval '30 seconds'
        AND state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY duration DESC
    `
  }
}

/**
 * Database maintenance utilities
 */
export class DatabaseMaintenance {

  /**
   * Run VACUUM ANALYZE on all tables
   */
  static async runMaintenanceAll(): Promise<void> {
    console.log('🔧 Starting database maintenance...')

    try {
      await prisma.$executeRaw`VACUUM ANALYZE`
      console.log('✅ Database maintenance completed')
    } catch (error) {
      console.error('❌ Database maintenance failed:', error)
      throw error
    }
  }

  /**
   * Run maintenance on specific table
   */
  static async runMaintenanceTable(tableName: string): Promise<void> {
    console.log(`🔧 Running maintenance on table: ${tableName}`)

    try {
      await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${tableName}`)
      console.log(`✅ Maintenance completed for table: ${tableName}`)
    } catch (error) {
      console.error(`❌ Maintenance failed for table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * Update table statistics
   */
  static async updateStatistics(): Promise<void> {
    try {
      await prisma.$executeRaw`ANALYZE`
      console.log('✅ Statistics updated')
    } catch (error) {
      console.error('❌ Statistics update failed:', error)
      throw error
    }
  }

  /**
   * Reindex specific table
   */
  static async reindexTable(tableName: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`REINDEX TABLE ${tableName}`)
      console.log(`✅ Reindexed table: ${tableName}`)
    } catch (error) {
      console.error(`❌ Reindex failed for table ${tableName}:`, error)
      throw error
    }
  }
}

/**
 * Query optimization utilities
 */
export class QueryOptimizer {

  /**
   * Analyze query performance and suggest optimizations
   */
  static async analyzeQuery(query: string): Promise<{
    executionPlan: any[]
    performance: {
      executionTime: number
      planningTime: number
      bufferHits: number
      bufferReads: number
    }
    suggestions: string[]
  }> {
    try {
      const explainResult = await DatabasePerformanceMonitor.explainQuery(query)
      const plan = explainResult[0]?.['QUERY PLAN']?.[0]

      const suggestions = this.generateQuerySuggestions(plan)

      return {
        executionPlan: explainResult,
        performance: {
          executionTime: plan?.['Execution Time'] || 0,
          planningTime: plan?.['Planning Time'] || 0,
          bufferHits: plan?.['Buffers']?.['Shared Hit Blocks'] || 0,
          bufferReads: plan?.['Buffers']?.['Shared Read Blocks'] || 0
        },
        suggestions
      }
    } catch (error) {
      console.error('Query analysis failed:', error)
      throw error
    }
  }

  /**
   * Generate optimization suggestions based on execution plan
   */
  private static generateQuerySuggestions(plan: any): string[] {
    const suggestions: string[] = []

    if (!plan) return suggestions

    // Check for sequential scans
    if (JSON.stringify(plan).includes('Seq Scan')) {
      suggestions.push('Sequential scan detected. Consider adding appropriate indexes.')
    }

    // Check for high execution time
    if (plan['Execution Time'] > 1000) {
      suggestions.push('High execution time detected. Consider query optimization or indexing.')
    }

    // Check for high buffer reads vs hits
    const bufferHits = plan?.['Buffers']?.['Shared Hit Blocks'] || 0
    const bufferReads = plan?.['Buffers']?.['Shared Read Blocks'] || 0

    if (bufferReads > bufferHits && bufferReads > 100) {
      suggestions.push('High disk I/O detected. Consider increasing shared_buffers or optimizing query.')
    }

    // Check for sorts
    if (JSON.stringify(plan).includes('Sort')) {
      suggestions.push('Sort operation detected. Consider adding index for ORDER BY clauses.')
    }

    return suggestions
  }
}