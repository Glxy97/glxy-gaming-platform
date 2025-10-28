import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateStatsSchema = z.object({
  gameType: z.enum(['chess', 'racing', 'uno', 'fps']),
  result: z.enum(['win', 'loss', 'draw']),
  gameTime: z.number().positive().optional(),
  score: z.number().optional(),
  rating: z.number().optional(),
  metadata: z.record(z.any()).optional()
})

interface GameStatsData {
  gamesPlayed?: number
  totalTime?: number
  bestTime?: number | null
  bestScore?: number
  rating?: number
  [key: string]: any
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gameType = searchParams.get('gameType')

    const whereClause = {
      userId: session.user.id,
      ...(gameType && { gameType })
    }

    const stats = await prisma.gameStats.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    })

    // Calculate aggregated statistics
    const aggregated = stats.reduce((acc, stat) => {
      if (!acc[stat.gameType]) {
        acc[stat.gameType] = {
          gameType: stat.gameType,
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDrawn: 0,
          totalTime: 0,
          bestScore: 0,
          averageRating: 0,
          bestTime: null,
          winStreak: 0,
          currentStreak: 0
        }
      }

      const gameStats = acc[stat.gameType]
      const statsData = (stat.stats as GameStatsData) || {}

      // Calculate games played from wins + losses + draws
      gameStats.gamesPlayed += (stat.wins + stat.losses + stat.draws)
      gameStats.gamesWon += stat.wins
      gameStats.gamesLost += stat.losses
      gameStats.gamesDrawn += stat.draws
      gameStats.totalTime += statsData.totalTime || 0
      gameStats.bestScore = Math.max(gameStats.bestScore, statsData.bestScore || 0)
      gameStats.averageRating = statsData.rating || gameStats.averageRating

      if (statsData.bestTime && (!gameStats.bestTime || statsData.bestTime < gameStats.bestTime)) {
        gameStats.bestTime = statsData.bestTime
      }

      return acc
    }, {} as Record<string, any>)

    // Calculate win rates
    Object.values(aggregated).forEach((gameStats: any) => {
      gameStats.winRate = gameStats.gamesPlayed > 0
        ? Math.round((gameStats.gamesWon / gameStats.gamesPlayed) * 100)
        : 0
    })

    return NextResponse.json({
      success: true,
      stats: Object.values(aggregated),
      detailedStats: stats
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateStatsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 })
    }

    const { gameType, result, gameTime, score, rating, metadata } = validation.data

    // Find or create game stats record
    const existingStats = await prisma.gameStats.findUnique({
      where: {
        userId_gameType: {
          userId: session.user.id,
          gameType: gameType
        }
      }
    })

    const existingStatsData = (existingStats?.stats as GameStatsData) || {}

    // Prepare updated stats data
    const updatedStatsData: GameStatsData = {
      ...existingStatsData,
      gamesPlayed: (existingStatsData.gamesPlayed || 0) + 1,
      ...(gameTime && {
        totalTime: (existingStatsData.totalTime || 0) + gameTime,
        bestTime: !existingStatsData.bestTime || gameTime < existingStatsData.bestTime
          ? gameTime
          : existingStatsData.bestTime
      }),
      ...(score && score > (existingStatsData.bestScore || 0) && { bestScore: score }),
      ...(rating && { rating }),
      ...(metadata && metadata)
    }

    let updatedStats
    if (existingStats) {
      // Update existing stats
      updatedStats = await prisma.gameStats.update({
        where: {
          userId_gameType: {
            userId: session.user.id,
            gameType: gameType
          }
        },
        data: {
          ...(result === 'win' && { wins: { increment: 1 } }),
          ...(result === 'loss' && { losses: { increment: 1 } }),
          ...(result === 'draw' && { draws: { increment: 1 } }),
          stats: updatedStatsData
        }
      })
    } else {
      // Create new stats record
      updatedStats = await prisma.gameStats.create({
        data: {
          userId: session.user.id,
          gameType: gameType,
          wins: result === 'win' ? 1 : 0,
          losses: result === 'loss' ? 1 : 0,
          draws: result === 'draw' ? 1 : 0,
          stats: updatedStatsData
        }
      })
    }

    // Award XP based on result
    let xpGained = 0
    switch (result) {
      case 'win':
        xpGained = 50 + (score ? Math.floor(score / 100) : 0)
        break
      case 'draw':
        xpGained = 25
        break
      case 'loss':
        xpGained = 10
        break
    }

    // Update user XP and potentially level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalXP: true, level: true }
    })

    const newXP = (user?.globalXP || 0) + xpGained
    const newLevel = Math.floor(newXP / 1000) + 1

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        globalXP: newXP,
        level: newLevel
      }
    })

    // Check for achievements
    await checkAndUnlockAchievements(session.user.id, gameType, updatedStats)

    return NextResponse.json({
      success: true,
      stats: updatedStats,
      xpGained,
      newLevel: newLevel > (user?.level || 1)
    })
  } catch (error) {
    console.error('Stats update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function checkAndUnlockAchievements(userId: string, gameType: string, stats: any) {
  const achievements = await prisma.achievement.findMany({
    where: {
      OR: [
        { gameType: null }, // General achievements
        { gameType: gameType } // Game-specific achievements
      ]
    }
  })

  const statsData = (stats.stats as GameStatsData) || {}
  const totalGames = stats.wins + stats.losses + stats.draws

  for (const achievement of achievements) {
    const conditions = achievement.conditions as any
    let shouldUnlock = false

    // Check if user already has this achievement
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id
        }
      }
    })

    if (existing) continue

    // Check conditions
    if (conditions.gamesPlayed && totalGames >= conditions.gamesPlayed) {
      shouldUnlock = true
    }
    if (conditions.gamesWon && stats.wins >= conditions.gamesWon) {
      shouldUnlock = true
    }
    if (conditions.winRate && totalGames > 10) {
      const winRate = (stats.wins / totalGames) * 100
      if (winRate >= conditions.winRate) {
        shouldUnlock = true
      }
    }

    if (shouldUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date()
        }
      })
    }
  }
}
