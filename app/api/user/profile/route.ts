import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(200).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        globalXP: true,
        level: true,
        createdAt: true,
        lastLogin: true,
        gameStats: {
          select: {
            gameType: true,
            wins: true,
            losses: true,
            draws: true,
            xp: true,
            level: true,
            stats: true
          }
        },
        achievements: {
          select: {
            achievement: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true
              }
            },
            unlockedAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate win rate and other statistics
    const totalGames = user.gameStats.reduce((sum, stat) => sum + stat.wins + stat.losses + stat.draws, 0)
    const totalWins = user.gameStats.reduce((sum, stat) => sum + stat.wins, 0)
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        stats: {
          totalGames,
          totalWins,
          winRate,
          level: user.level || 1,
          xp: user.globalXP || 0,
          nextLevelXp: ((user.level || 1) * 1000) + 500 // Simple progression formula
        }
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 })
    }

    const { name, avatar, bio } = validation.data

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
        ...(bio && { bio })
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true
      }
    })

    return NextResponse.json({
      success: true,
      profile: updatedUser
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}