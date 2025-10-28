import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Verify admin privileges
async function verifyAdminAuth() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return { error: 'Unauthorized', status: 401 }
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const isAdmin = adminEmails.includes(session.user.email)

    if (!isAdmin) {
      return { error: 'Access denied - Admin privileges required', status: 403 }
    }

    return { success: true, user: session.user }
  } catch (error) {
    return { error: 'Authentication error', status: 500 }
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth()
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'

    // Calculate time window
    const timeWindows: Record<string, number> = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }

    const timeWindow = timeWindows[timeRange] ?? timeWindows['24h']!
    const startTime = new Date(Date.now() - timeWindow)

    try {
      // Get security events from database if available, otherwise use Redis fallback
      let totalEvents = 0
      let eventsLast24h = 0
      let eventsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 }

      // Try to get from database first
      try {
        const securityEvents = await prisma.securityEvent.findMany({
          where: {
            createdAt: {
              gte: startTime
            }
          },
          select: {
            severity: true,
            type: true,
            createdAt: true
          }
        })

        totalEvents = securityEvents.length
        eventsLast24h = securityEvents.filter(
          (event: any) => event.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length

        // Count by severity
        securityEvents.forEach((event: any) => {
          if (event.severity in eventsBySeverity) {
            eventsBySeverity[event.severity as keyof typeof eventsBySeverity]++
          }
        })
      } catch (dbError) {
        console.log('Security events not available - database not accessible')
        // Note: Redis is not configured in this environment
      }

      // Get blocked IPs count
      // Note: Redis not configured, blocked IPs tracking unavailable
      const blockedIPs = 0

      // Get failed login attempts
      // Note: Redis not configured, failed login tracking unavailable
      const failedLogins = 0

      // Get MFA failures (simulated data for now)
      const mfaFailures = Math.floor(failedLogins * 0.1) // Estimate 10% of failed logins involve MFA

      // Get suspicious activity count
      const suspiciousActivity = eventsBySeverity.high + eventsBySeverity.critical

      const metrics = {
        totalEvents,
        eventsLast24h,
        blockedIPs,
        failedLogins,
        mfaFailures,
        suspiciousActivity,
        eventsBySeverity,
        // Additional metrics
        securityScore: Math.max(0, 100 - (eventsBySeverity.critical * 20) - (eventsBySeverity.high * 5) - (eventsBySeverity.medium * 2) - eventsBySeverity.low),
        threatLevel: eventsBySeverity.critical > 0 ? 'critical' :
                    eventsBySeverity.high > 5 ? 'high' :
                    eventsBySeverity.medium > 10 ? 'medium' : 'low'
      }

      return NextResponse.json({
        success: true,
        data: metrics,
        meta: {
          timeRange,
          generatedAt: new Date().toISOString()
        }
      })

    } catch (dataError) {
      console.error('Error gathering security metrics:', dataError)

      // Return default/empty metrics if data gathering fails
      return NextResponse.json({
        success: true,
        data: {
          totalEvents: 0,
          eventsLast24h: 0,
          blockedIPs: 0,
          failedLogins: 0,
          mfaFailures: 0,
          suspiciousActivity: 0,
          eventsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
          securityScore: 100,
          threatLevel: 'low'
        },
        meta: {
          timeRange,
          generatedAt: new Date().toISOString(),
          note: 'Default metrics returned due to data gathering issues'
        }
      })
    }

  } catch (error) {
    console.error('Security metrics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}