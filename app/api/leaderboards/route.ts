import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Leaderboard API - Placeholder
 *
 * TODO: Implement leaderboard logic compatible with current GameStats model
 * Current GameStats schema: { wins, losses, draws, xp, level, stats: Json }
 * Missing fields referenced in old code: rating, gamesPlayed, gamesWon, bestScore, lastPlayed
 */

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const gameType = searchParams.get('gameType')
  const timeframe = searchParams.get('timeframe') || 'all_time'
  const category = searchParams.get('category') || 'wins'

  // Placeholder response - return empty leaderboard
  return NextResponse.json({
    leaderboard: [],
    metadata: {
      gameType,
      timeframe,
      category,
      total: 0,
      lastUpdated: new Date().toISOString()
    },
    userPosition: null
  })
}
