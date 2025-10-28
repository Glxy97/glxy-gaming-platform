import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { CacheStrategyManager } from '@/lib/cache-strategies'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin access
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, allow all authenticated users - in production, check for admin role
    // if (!session.user.roles?.includes('admin')) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    let stats

    if (endpoint) {
      // Get metrics for specific endpoint
      stats = await CacheStrategyManager.getEndpointCacheMetrics(endpoint)
    } else {
      // Get overall cache statistics
      stats = await CacheStrategyManager.getCacheStatistics()
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cache stats error:', error)
    return NextResponse.json({
      error: 'Failed to retrieve cache statistics'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, gameType, roomId } = body

    let result

    switch (action) {
      case 'warm_cache':
        await CacheStrategyManager.warmCriticalData()
        result = { message: 'Cache warming initiated' }
        break

      case 'invalidate_user':
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const userInvalidated = await CacheStrategyManager.invalidateUserRelatedData(userId)
        result = { message: `Invalidated ${userInvalidated} user cache entries` }
        break

      case 'invalidate_game':
        if (!gameType) {
          return NextResponse.json({ error: 'gameType required' }, { status: 400 })
        }
        const gameInvalidated = await CacheStrategyManager.invalidateGameRelatedData(gameType, roomId)
        result = { message: `Invalidated ${gameInvalidated} game cache entries` }
        break

      case 'maintenance':
        await CacheStrategyManager.performMaintenance()
        result = { message: 'Cache maintenance completed' }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cache management error:', error)
    return NextResponse.json({
      error: 'Cache management operation failed'
    }, { status: 500 })
  }
}