import { NextRequest, NextResponse } from 'next/server'
import { ErrorReporting } from '@/lib/error-handling'
import { verifyAuth } from '@/lib/auth-security'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit') || '100'
    const errorLimit = Math.min(parseInt(limitParam, 10), 1000)

    const errors = await ErrorReporting.getRecentErrors(errorLimit)
    const processed = errors.map((error) => ({
      ...error,
      stack: error.stack ? `${error.stack.substring(0, 500)}${error.stack.length > 500 ? '...' : ''}` : undefined,
      timestamp: error.context?.timestamp ? new Date(error.context.timestamp).toLocaleString() : undefined
    }))

    return NextResponse.json({
      success: true,
      data: processed,
      count: processed.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Errors API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recent errors',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
