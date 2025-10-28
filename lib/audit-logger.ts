import { prisma } from '@/lib/db'
import { AuditAction, AuditSeverity } from '@prisma/client'

export interface AuditLogData {
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  action: AuditAction
  resource?: string
  resourceId?: string
  description: string
  severity?: AuditSeverity
  metadata?: Record<string, any>
}

export interface AuditContext {
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Centralized audit logging system for tracking all critical actions
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          description: data.description,
          severity: data.severity || 'MEDIUM',
          metadata: data.metadata || {}
        }
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE',
    context: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      LOGIN: 'User logged in successfully',
      LOGOUT: 'User logged out',
      LOGIN_FAILED: 'Failed login attempt',
      PASSWORD_CHANGE: 'User changed password'
    }

    await this.log({
      ...context,
      action,
      resource: 'auth',
      description: descriptions[action],
      severity: action === 'LOGIN_FAILED' ? 'HIGH' : 'MEDIUM',
      metadata: details
    })
  }

  /**
   * Log role and permission changes
   */
  static async logRoleChange(
    context: AuditContext,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    adminUserId: string
  ): Promise<void> {
    await this.log({
      ...context,
      userId: adminUserId,
      action: 'ROLE_CHANGE',
      resource: 'user',
      resourceId: targetUserId,
      description: `Role changed from ${oldRole} to ${newRole}`,
      severity: 'HIGH',
      metadata: { targetUserId, oldRole, newRole }
    })
  }

  /**
   * Log user management actions
   */
  static async logUserAction(
    action: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_BANNED' | 'USER_UNBANNED',
    context: AuditContext,
    targetUserId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      USER_CREATED: 'New user account created',
      USER_UPDATED: 'User account updated',
      USER_DELETED: 'User account deleted',
      USER_BANNED: 'User account banned',
      USER_UNBANNED: 'User account unbanned'
    }

    await this.log({
      ...context,
      action,
      resource: 'user',
      resourceId: targetUserId,
      description: descriptions[action],
      severity: action === 'USER_DELETED' || action === 'USER_BANNED' ? 'HIGH' : 'MEDIUM',
      metadata: { targetUserId, ...details }
    })
  }

  /**
   * Log game-related events
   */
  static async logGameAction(
    action: 'GAME_STARTED' | 'GAME_JOINED' | 'GAME_LEFT' | 'GAME_FINISHED' | 'CHEAT_DETECTED' | 'MOVE_VALIDATED' | 'MOVE_REJECTED',
    context: AuditContext,
    gameId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      GAME_STARTED: 'Game started',
      GAME_JOINED: 'Player joined game',
      GAME_LEFT: 'Player left game',
      GAME_FINISHED: 'Game finished',
      CHEAT_DETECTED: 'Cheating behavior detected',
      MOVE_VALIDATED: 'Game move validated',
      MOVE_REJECTED: 'Game move rejected'
    }

    const severity = action === 'CHEAT_DETECTED' ? 'CRITICAL' : 
                   action === 'MOVE_REJECTED' ? 'HIGH' : 'LOW'

    await this.log({
      ...context,
      action,
      resource: 'game',
      resourceId: gameId,
      description: descriptions[action],
      severity,
      metadata: { gameId, ...details }
    })
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(
    action: 'ADMIN_ACCESS_GRANTED' | 'ADMIN_ACCESS_DENIED' | 'SYSTEM_CONFIG_CHANGED' | 'BULK_OPERATION',
    context: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      ADMIN_ACCESS_GRANTED: 'Admin access granted',
      ADMIN_ACCESS_DENIED: 'Admin access denied',
      SYSTEM_CONFIG_CHANGED: 'System configuration changed',
      BULK_OPERATION: 'Bulk operation performed'
    }

    await this.log({
      ...context,
      action,
      resource: 'admin',
      description: descriptions[action],
      severity: 'HIGH',
      metadata: details
    })
  }

  /**
   * Log PDF operations
   */
  static async logPDFAction(
    action: 'PDF_UPLOADED' | 'PDF_PROCESSED' | 'PDF_DELETED' | 'FIELD_EXTRACTED' | 'FIELD_UPDATED',
    context: AuditContext,
    documentId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      PDF_UPLOADED: 'PDF document uploaded',
      PDF_PROCESSED: 'PDF document processed',
      PDF_DELETED: 'PDF document deleted',
      FIELD_EXTRACTED: 'Field extracted from PDF',
      FIELD_UPDATED: 'PDF field updated'
    }

    await this.log({
      ...context,
      action,
      resource: 'pdf',
      resourceId: documentId,
      description: descriptions[action],
      severity: 'MEDIUM',
      metadata: { documentId, ...details }
    })
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    action: 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_REQUEST' | 'UNAUTHORIZED_ACCESS',
    context: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      SUSPICIOUS_ACTIVITY: 'Suspicious activity detected',
      RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
      INVALID_REQUEST: 'Invalid request received',
      UNAUTHORIZED_ACCESS: 'Unauthorized access attempt'
    }

    const severity = action === 'SUSPICIOUS_ACTIVITY' || action === 'UNAUTHORIZED_ACCESS' ? 'CRITICAL' : 'HIGH'

    await this.log({
      ...context,
      action,
      resource: 'security',
      description: descriptions[action],
      severity,
      metadata: details
    })
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(options: {
    userId?: string
    action?: AuditAction
    severity?: AuditSeverity
    resource?: string
    resourceId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {}) {
    const {
      userId,
      action,
      severity,
      resource,
      resourceId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = options

    const where: any = {}

    if (userId) where.userId = userId
    if (action) where.action = action
    if (severity) where.severity = severity
    if (resource) where.resource = resource
    if (resourceId) where.resourceId = resourceId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])

    return {
      logs,
      total,
      hasMore: offset + limit < total
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const [totalLogs, severityStats, actionStats] = await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        where: { createdAt: { gte: startDate } },
        _count: { severity: true }
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      })
    ])

    return {
      totalLogs,
      severityStats: severityStats.reduce((acc, stat) => {
        acc[stat.severity] = stat._count.severity
        return acc
      }, {} as Record<string, number>),
      topActions: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.action
      }))
    }
  }
}
