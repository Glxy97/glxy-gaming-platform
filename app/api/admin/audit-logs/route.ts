import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkAdminAccess } from '@/lib/admin-auth'
import { AuditLogger } from '@/lib/audit-logger'
import { AuditAction, AuditSeverity } from '@prisma/client'

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: adminCheck.reason },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const severity = searchParams.get('severity')
    const resource = searchParams.get('resource')
    const resourceId = searchParams.get('resourceId')
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      )
    }

    // Validate and cast enum types
    const validAction = action && Object.values(AuditAction).includes(action as AuditAction) 
      ? (action as AuditAction) 
      : undefined
    const validSeverity = severity && Object.values(AuditSeverity).includes(severity as AuditSeverity)
      ? (severity as AuditSeverity)
      : undefined

    // Get audit logs
    const result = await AuditLogger.getAuditLogs({
      userId: userId || undefined,
      action: validAction,
      severity: validSeverity,
      resource: resource || undefined,
      resourceId: resourceId || undefined,
      startDate,
      endDate,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.hasMore
      }
    })

  } catch (error) {
    console.error('Audit logs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/audit-stats
 * Get audit statistics
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: adminCheck.reason },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { timeframe = 'day' } = body

    if (!['day', 'week', 'month'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Must be day, week, or month' },
        { status: 400 }
      )
    }

    const stats = await AuditLogger.getAuditStats(timeframe)

    return NextResponse.json({
      success: true,
      data: stats,
      timeframe
    })

  } catch (error) {
    console.error('Audit stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
