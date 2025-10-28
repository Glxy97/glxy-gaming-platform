import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      include: {
        achievement: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            xpReward: true,
            gameType: true,
            conditions: true
          }
        }
      },
      orderBy: { unlockedAt: 'desc' }
    })

    // Get all available achievements to show progress
    const allAchievements = await prisma.achievement.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        xpReward: true,
        gameType: true,
        conditions: true
      }
    })

    // Calculate achievement progress
    const userStats = await prisma.gameStats.findMany({
      where: { userId: session.user.id }
    })

    const achievements = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id)

      let progress = 0
      if (!userAchievement && achievement.conditions) {
        // Calculate progress based on conditions (simplified)
        const conditions = achievement.conditions as any
        if (conditions.gamesPlayed) {
          const totalGames = userStats.reduce((sum, stat) => sum + stat.wins + stat.losses + stat.draws, 0)
          progress = Math.min(100, (totalGames / conditions.gamesPlayed) * 100)
        }
        if (conditions.gamesWon) {
          const totalWins = userStats.reduce((sum, stat) => sum + stat.wins, 0)
          progress = Math.min(100, (totalWins / conditions.gamesWon) * 100)
        }
      }

      return {
        ...achievement,
        isUnlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: userAchievement ? 100 : progress
      }
    })

    return NextResponse.json({
      success: true,
      achievements: achievements.sort((a, b) => {
        // Sort: unlocked first, then by progress, then by XP reward
        if (a.isUnlocked && !b.isUnlocked) return -1
        if (!a.isUnlocked && b.isUnlocked) return 1
        if (a.isUnlocked && b.isUnlocked) return 0
        return b.progress - a.progress
      })
    })
  } catch (error) {
    console.error('Achievements fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { achievementId } = await request.json()

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID required' }, { status: 400 })
    }

    // Check if achievement exists and user doesn't already have it
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    })

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    const existingUserAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: session.user.id,
          achievementId: achievementId
        }
      }
    })

    if (existingUserAchievement) {
      return NextResponse.json({ error: 'Achievement already unlocked' }, { status: 400 })
    }

    // Award achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId: session.user.id,
        achievementId: achievementId,
        unlockedAt: new Date()
      }
    })

    // Award XP
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        globalXP: {
          increment: achievement.xpReward || 0
        }
      }
    })

    return NextResponse.json({
      success: true,
      achievement: userAchievement,
      xpAwarded: achievement.xpReward
    })
  } catch (error) {
    console.error('Achievement unlock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}