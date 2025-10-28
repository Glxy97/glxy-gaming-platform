import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Tetris game score submission schema
const tetrisScoreSchema = z.object({
  score: z.number().min(0),
  level: z.number().min(1),
  lines: z.number().min(0),
  time: z.number().min(0),
  gameMode: z.enum(['classic', 'sprint', 'marathon']).default('classic')
})

/**
 * @swagger
 * /api/games/tetris:
 *   get:
 *     summary: Get Tetris leaderboard and personal stats
 *     description: Fetches the top Tetris scores for leaderboard and personal best scores for authenticated users
 *     tags: [Games]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top scores to return
 *       - in: query
 *         name: gameMode
 *         schema:
 *           type: string
 *           enum: [classic, sprint, marathon]
 *           default: classic
 *         description: Game mode filter
 *     responses:
 *       200:
 *         description: Leaderboard and stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       score:
 *                         type: integer
 *                       level:
 *                         type: integer
 *                       lines:
 *                         type: integer
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                             nullable: true
 *                 personalBest:
 *                   type: object
 *                   nullable: true
 *                 personalStats:
 *                   type: object
 *                   nullable: true
 *       500:
 *         $ref: '#/components/responses/ValidationError'
 */
// GET - Fetch Tetris leaderboard and personal stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const gameMode = searchParams.get('gameMode') || 'classic'

    // Get top scores for leaderboard
    const topScores = await prisma.gameScore.findMany({
      where: {
        game: 'TETRIS',
        gameMode,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit
    })

    // Get session for personal stats
    const session = await auth()
    let personalBest: any = null
    let personalStats: any = null

    if (session?.user?.id) {
      // Get personal best score
      personalBest = await prisma.gameScore.findFirst({
        where: {
          userId: session.user.id,
          game: 'TETRIS',
          gameMode,
        },
        orderBy: { score: 'desc' }
      })

      // Get personal statistics
      const userScores = await prisma.gameScore.findMany({
        where: {
          userId: session.user.id,
          game: 'TETRIS',
          gameMode,
        },
        orderBy: { createdAt: 'desc' }
      })

      if (userScores.length > 0) {
        personalStats = {
          gamesPlayed: userScores.length,
          bestScore: Math.max(...userScores.map(s => s.score)),
          averageScore: Math.round(userScores.reduce((sum, s) => sum + s.score, 0) / userScores.length),
          totalLines: userScores.reduce((sum, s) => sum + ((s.metadata as any)?.lines || 0), 0),
          totalTime: userScores.reduce((sum, s) => sum + ((s.metadata as any)?.time || 0), 0),
          bestLevel: Math.max(...userScores.map(s => (s.metadata as any)?.level || 1)),
          recentGames: userScores.slice(0, 5).map(score => ({
            score: score.score,
            level: (score.metadata as any)?.level || 1,
            lines: (score.metadata as any)?.lines || 0,
            time: (score.metadata as any)?.time || 0,
            createdAt: score.createdAt
          }))
        }
      }
    }

    // Get global statistics
    const globalStats = await prisma.gameScore.aggregate({
      where: {
        game: 'TETRIS',
        gameMode,
      },
      _count: { id: true },
      _max: { score: true },
      _avg: { score: true }
    })

    return NextResponse.json({
      leaderboard: topScores.map((score, index) => ({
        rank: index + 1,
        user: score.user,
        score: score.score,
        level: (score.metadata as any)?.level || 1,
        lines: (score.metadata as any)?.lines || 0,
        time: (score.metadata as any)?.time || 0,
        createdAt: score.createdAt
      })),
      personalBest,
      personalStats,
      globalStats: {
        totalGames: globalStats._count.id,
        highestScore: globalStats._max.score || 0,
        averageScore: Math.round(globalStats._avg.score || 0)
      }
    })

  } catch (error) {
    console.error('Error fetching Tetris leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/games/tetris:
 *   post:
 *     summary: Submit a new Tetris score
 *     description: Records a new Tetris game score for the authenticated user
 *     tags: [Games]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *               - level
 *               - lines
 *               - time
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 0
 *                 example: 15000
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *               lines:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *               time:
 *                 type: integer
 *                 minimum: 0
 *                 description: Time in milliseconds
 *                 example: 180000
 *               gameMode:
 *                 type: string
 *                 enum: [classic, sprint, marathon]
 *                 default: classic
 *     responses:
 *       201:
 *         description: Score submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 score:
 *                   type: object
 *                 isPersonalBest:
 *                   type: boolean
 *                 rank:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST - Submit new Tetris score
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const gameData = tetrisScoreSchema.parse(body)

    // Validate score authenticity (basic checks)
    const { score, level, lines, time } = gameData

    // Basic validation rules for Tetris scoring
    const maxPossibleScore = lines * level * 1200 // Theoretical maximum
    const minTimePerLevel = level * 30 // Minimum seconds per level

    if (score > maxPossibleScore || (time > 0 && time < minTimePerLevel && level > 1)) {
      return NextResponse.json(
        { error: 'Invalid score detected' },
        { status: 400 }
      )
    }

    // Save the score
    const gameScore = await prisma.gameScore.create({
      data: {
        userId: session.user.id,
        game: 'TETRIS',
        gameMode: gameData.gameMode,
        score: gameData.score,
        metadata: {
          level: gameData.level,
          lines: gameData.lines,
          time: gameData.time,
          linesPerMinute: time > 0 ? Math.round((lines * 60) / time) : 0,
          scorePerSecond: time > 0 ? Math.round(score / time) : 0
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    })

    // Check if this is a new personal best
    const personalBest = await prisma.gameScore.findFirst({
      where: {
        userId: session.user.id,
        game: 'TETRIS',
        gameMode: gameData.gameMode,
        score: { gt: gameData.score }
      }
    })

    const isPersonalBest = !personalBest

    // Check leaderboard position
    const betterScores = await prisma.gameScore.count({
      where: {
        game: 'TETRIS',
        gameMode: gameData.gameMode,
        score: { gt: gameData.score }
      }
    })

    const leaderboardPosition = betterScores + 1

    // Update user statistics
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalGamesPlayed: { increment: 1 },
        totalScore: { increment: gameData.score }
      }
    })

    return NextResponse.json({
      success: true,
      gameScore,
      isPersonalBest,
      leaderboardPosition,
      message: isPersonalBest ? 'New personal best!' : 'Score saved successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid game data', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Error saving Tetris score:', error)
    return NextResponse.json(
      { error: 'Failed to save score' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific score (for user's own scores only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const scoreId = searchParams.get('scoreId')

    if (!scoreId) {
      return NextResponse.json(
        { error: 'Score ID required' },
        { status: 400 }
      )
    }

    // Verify the score belongs to the user
    const score = await prisma.gameScore.findFirst({
      where: {
        id: scoreId,
        userId: session.user.id,
        game: 'TETRIS'
      }
    })

    if (!score) {
      return NextResponse.json(
        { error: 'Score not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the score
    await prisma.gameScore.delete({
      where: { id: scoreId }
    })

    // Update user statistics
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalGamesPlayed: { decrement: 1 },
        totalScore: { decrement: score.score }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Score deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting Tetris score:', error)
    return NextResponse.json(
      { error: 'Failed to delete score' },
      { status: 500 }
    )
  }
}
