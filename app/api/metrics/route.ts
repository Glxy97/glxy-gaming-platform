import { NextRequest, NextResponse } from 'next/server'
import { APIMonitoring } from '@/lib/api-monitoring'
import { verifyAuth, type AuthenticatedUser } from '@/lib/auth-security'

export async function GET(request: NextRequest) {
  try {
    const result = await verifyAuth(request)
    const user: AuthenticatedUser | null = result.user
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || undefined
    const type = searchParams.get('type') || 'summary'

    if (type === 'summary') {
      const summary = await APIMonitoring.getMetricsSummary()
      return NextResponse.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      })
    }

    if (type === 'endpoints') {
      const endpointStats = await APIMonitoring.getEndpointStats(endpoint)
      return NextResponse.json({
        success: true,
        data: endpointStats,
        timestamp: new Date().toISOString()
      })
    }

    if (type === 'errors') {
      const limit = parseInt(searchParams.get('limit') || '50', 10)
      const errors = await APIMonitoring.getRecentErrors(limit)
      return NextResponse.json({
        success: true,
        data: errors,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid metrics type'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch API metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
