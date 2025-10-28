import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Connect 4 game result submission schema
const connect4ResultSchema = z.object({
  gameMode: z.enum(['ai', 'local', 'online']).default('ai'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  result: z.enum(['win', 'loss', 'draw']),
  moves: z.number().min(1),
  duration: z.number().min(1), // in milliseconds
  opponentType: z.enum(['ai', 'human']).default('ai'),
  opponentId: z.string().optional(), // for multiplayer games
  boardState: z.array(z.array(z.number().nullable())).optional(), // final board state
  winningSequence: z.array(z.object({
    row: z.number(),
    col: z.number()
  })).optional()
})

// GET - Fetch Connect 4 leaderboard and personal stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const gameMode = searchParams.get('gameMode') || 'ai'
    const difficulty = searchParams.get('difficulty')

    // Base where clause
    const whereClause: any = {
      game: 'CONNECT4',
      gameMode,
    }

    // Add difficulty filter if specified
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      whereClause.metadata = {
        path: ['difficulty'],
        equals: difficulty
      }
    }

    // Get top performers (by win rate and total games)
    const topPerformers = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(gs.id) as total_games,
        SUM(CASE WHEN gs.metadata->>'result' = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN gs.metadata->>'result' = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN gs.metadata->>'result' = 'draw' THEN 1 ELSE 0 END) as draws,
        ROUND(
          (SUM(CASE WHEN gs.metadata->>'result' = 'win' THEN 1 ELSE 0 END)::float /
           GREATEST(COUNT(gs.id), 1)) * 100, 2
        ) as win_rate,
        AVG((gs.metadata->>'duration')::int) as avg_duration,
        AVG((gs.metadata->>'moves')::int) as avg_moves,
        MIN(CASE WHEN gs.metadata->>'result' = 'win' THEN (gs.metadata->>'duration')::int END) as best_win_time
      FROM users u
      JOIN game_scores gs ON u.id = gs.user_id
      WHERE gs.game = 'CONNECT4'
        AND gs.game_mode = ${gameMode}
        ${difficulty ? `AND gs.metadata->>'difficulty' = ${difficulty}` : ''}
      GROUP BY u.id, u.name, u.image
      HAVING COUNT(gs.id) >= 3
      ORDER BY win_rate DESC, total_games DESC
      LIMIT ${limit}
    `

    // Get session for personal stats
    const session = await auth()
    let personalStats: any = null

    if (session?.user?.id) {
      // Get personal game statistics
      const userGames = await prisma.gameScore.findMany({
        where: {
          userId: session.user.id,
          game: 'CONNECT4',
          gameMode,
          ...(difficulty && {
            metadata: {
              path: ['difficulty'],
              equals: difficulty
            }
          })
        },
        orderBy: { createdAt: 'desc' }
      })

      if (userGames.length > 0) {
        const wins = userGames.filter(g => (g.metadata as any)?.result === 'win').length
        const losses = userGames.filter(g => (g.metadata as any)?.result === 'loss').length
        const draws = userGames.filter(g => (g.metadata as any)?.result === 'draw').length
        const winningGames = userGames.filter(g => (g.metadata as any)?.result === 'win')

        personalStats = {
          totalGames: userGames.length,
          wins,
          losses,
          draws,
          winRate: userGames.length > 0 ? Math.round((wins / userGames.length) * 100) : 0,
          avgMoves: Math.round(userGames.reduce((sum, g) => sum + ((g.metadata as any)?.moves || 0), 0) / userGames.length),
          avgDuration: Math.round(userGames.reduce((sum, g) => sum + ((g.metadata as any)?.duration || 0), 0) / userGames.length),
          bestWinTime: winningGames.length > 0 ? Math.min(...winningGames.map(g => (g.metadata as any)?.duration || Infinity)) : null,
          fastestWin: winningGames.length > 0 ? Math.min(...winningGames.map(g => (g.metadata as any)?.moves || Infinity)) : null,
          currentStreak: calculateWinStreak(userGames),
          recentGames: userGames.slice(0, 10).map(game => ({
            result: (game.metadata as any)?.result,
            moves: (game.metadata as any)?.moves,
            duration: (game.metadata as any)?.duration,
            difficulty: (game.metadata as any)?.difficulty,
            createdAt: game.createdAt
          }))
        }
      }
    }

    // Get global statistics
    const globalStats = await prisma.gameScore.aggregate({
      where: whereClause,
      _count: { id: true }
    })

    const globalResults: any = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_games,
        SUM(CASE WHEN metadata->>'result' = 'win' THEN 1 ELSE 0 END) as total_wins,
        SUM(CASE WHEN metadata->>'result' = 'loss' THEN 1 ELSE 0 END) as total_losses,
        SUM(CASE WHEN metadata->>'result' = 'draw' THEN 1 ELSE 0 END) as total_draws,
        AVG((metadata->>'duration')::int) as avg_duration,
        AVG((metadata->>'moves')::int) as avg_moves
      FROM game_scores
      WHERE game = 'CONNECT4' AND game_mode = ${gameMode}
        ${difficulty ? `AND metadata->>'difficulty' = ${difficulty}` : ''}
    `

    return NextResponse.json({
      leaderboard: (topPerformers as any[]).map((player, index) => ({
        rank: index + 1,
        user: {
          id: player.id,
          name: player.name,
          image: player.image
        },
        stats: {
          totalGames: parseInt(player.total_games),
          wins: parseInt(player.wins),
          losses: parseInt(player.losses),
          draws: parseInt(player.draws),
          winRate: parseFloat(player.win_rate),
          avgDuration: Math.round(parseFloat(player.avg_duration || 0)),
          avgMoves: Math.round(parseFloat(player.avg_moves || 0)),
          bestWinTime: player.best_win_time ? parseInt(player.best_win_time) : null
        }
      })),
      personalStats,
      globalStats: {
        totalGames: globalStats._count.id,
        ...((globalResults as any[])[0] as any)
      }
    })

  } catch (error) {
    console.error('Error fetching Connect 4 leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

// Helper function to calculate current win streak
function calculateWinStreak(games: any[]): number {
  let streak = 0
  for (const game of games) {
    if ((game.metadata as any)?.result === 'win') {
      streak++
    } else if ((game.metadata as any)?.result === 'loss') {
      break
    }
    // Draws don't break the streak but don't count towards it
  }
  return streak
}

// POST - Submit new Connect 4 game result
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
    const gameData = connect4ResultSchema.parse(body)

    // Validate game data for suspicious patterns
    const { moves, duration, result, gameMode, difficulty } = gameData

    // Basic validation rules
    const minMovesForWin = 7 // Theoretical minimum to win Connect 4
    const maxReasonableMoves = 42 // Maximum possible moves in Connect 4
    const minReasonableTime = moves * 1000 // At least 1 second per move
    const maxReasonableTime = moves * 60000 // At most 1 minute per move

    if (
      moves < minMovesForWin ||
      moves > maxReasonableMoves ||
      duration < minReasonableTime ||
      duration > maxReasonableTime ||
      (result === 'win' && moves < minMovesForWin)
    ) {
      return NextResponse.json(
        { error: 'Invalid game data detected' },
        { status: 400 }
      )
    }

    // Calculate score based on performance
    let score = 0
    if (result === 'win') {
      // Base score for winning
      score = 100

      // Bonus for efficiency (fewer moves)
      const moveBonus = Math.max(0, (42 - moves) * 2)
      score += moveBonus

      // Bonus for speed (faster completion)
      const timeBonus = Math.max(0, Math.floor((300000 - duration) / 10000)) // Bonus for sub-5-minute games
      score += timeBonus

      // Difficulty multiplier for AI games
      if (gameMode === 'ai' && difficulty) {
        const difficultyMultiplier = {
          easy: 1.0,
          medium: 1.5,
          hard: 2.0
        }
        score = Math.floor(score * difficultyMultiplier[difficulty])
      }
    } else if (result === 'draw') {
      score = 25 // Small score for achieving a draw
    }
    // No score for losses

    // Save the game result
    const gameScore = await prisma.gameScore.create({
      data: {
        userId: session.user.id,
        game: 'CONNECT4',
        gameMode: gameData.gameMode,
        score,
        metadata: {
          result: gameData.result,
          moves: gameData.moves,
          duration: gameData.duration,
          difficulty: gameData.difficulty,
          opponentType: gameData.opponentType,
          opponentId: gameData.opponentId,
          boardState: gameData.boardState,
          winningSequence: gameData.winningSequence,
          // Performance metrics
          movesPerMinute: Math.round((moves * 60000) / duration),
          efficiency: result === 'win' ? Math.round((score / moves) * 10) / 10 : 0
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

    // Check for achievements
    const achievements = await checkAchievements(session.user.id, gameData, gameScore)

    // Update user statistics
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalGamesPlayed: { increment: 1 },
        totalScore: { increment: score }
      }
    })

    // Get updated personal stats
    const userGames = await prisma.gameScore.findMany({
      where: {
        userId: session.user.id,
        game: 'CONNECT4',
        gameMode: gameData.gameMode
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 games for streak calculation
    })

    const currentStreak = calculateWinStreak(userGames)
    const isPersonalBest = result === 'win' && (
      !userGames.find(g => g.id !== gameScore.id && ((g.metadata as any)?.moves || Infinity) < moves) ||
      !userGames.find(g => g.id !== gameScore.id && ((g.metadata as any)?.duration || Infinity) < duration)
    )

    return NextResponse.json({
      success: true,
      gameScore,
      achievements,
      stats: {
        currentStreak,
        isPersonalBest,
        totalGames: userGames.length,
        rank: await getUserRank(session.user.id, gameData.gameMode)
      },
      message: achievements.length > 0 ? 'New achievements unlocked!' : 'Game result saved'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid game data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving Connect 4 result:', error)
    return NextResponse.json(
      { error: 'Failed to save game result' },
      { status: 500 }
    )
  }
}

// Helper function to check for achievements
async function checkAchievements(userId: string, gameData: any, gameScore: any) {
  const achievements: any[] = []

  // Get user's game history for achievement checking
  const userGames = await prisma.gameScore.findMany({
    where: {
      userId,
      game: 'CONNECT4'
    },
    orderBy: { createdAt: 'desc' }
  })

  const wins = userGames.filter(g => (g.metadata as any)?.result === 'win')

  // First Win Achievement
  if (wins.length === 1) {
    achievements.push({
      type: 'first_win',
      title: 'First Victory',
      description: 'Won your first Connect 4 game'
    })
  }

  // Speed achievements
  if (gameData.result === 'win' && gameData.duration < 60000) { // Under 1 minute
    achievements.push({
      type: 'speed_demon',
      title: 'Speed Demon',
      description: 'Won a game in under 1 minute'
    })
  }

  // Efficiency achievements
  if (gameData.result === 'win' && gameData.moves <= 10) {
    achievements.push({
      type: 'efficient_victory',
      title: 'Efficient Victory',
      description: 'Won a game in 10 moves or less'
    })
  }

  // Win streak achievements
  const currentStreak = calculateWinStreak(userGames)
  if (currentStreak === 5) {
    achievements.push({
      type: 'win_streak_5',
      title: 'On Fire',
      description: 'Won 5 games in a row'
    })
  } else if (currentStreak === 10) {
    achievements.push({
      type: 'win_streak_10',
      title: 'Unstoppable',
      description: 'Won 10 games in a row'
    })
  }

  // AI difficulty achievements
  if (gameData.gameMode === 'ai' && gameData.result === 'win') {
    if (gameData.difficulty === 'hard') {
      const hardWins = wins.filter(g => (g.metadata as any)?.difficulty === 'hard').length
      if (hardWins === 1) {
        achievements.push({
          type: 'ai_hard_first',
          title: 'Giant Slayer',
          description: 'Defeated the Hard AI for the first time'
        })
      } else if (hardWins === 10) {
        achievements.push({
          type: 'ai_hard_master',
          title: 'AI Master',
          description: 'Defeated the Hard AI 10 times'
        })
      }
    }
  }

  // Total games milestones
  const totalGames = userGames.length
  if ([10, 50, 100, 500].includes(totalGames)) {
    achievements.push({
      type: `games_${totalGames}`,
      title: `${totalGames} Games Played`,
      description: `Played ${totalGames} Connect 4 games`
    })
  }

  return achievements
}

// Helper function to get user's current rank
async function getUserRank(userId: string, gameMode: string): Promise<number> {
  try {
    const userStats = await prisma.$queryRaw`
      SELECT
        user_id,
        COUNT(*) as total_games,
        SUM(CASE WHEN metadata->>'result' = 'win' THEN 1 ELSE 0 END) as wins,
        ROUND(
          (SUM(CASE WHEN metadata->>'result' = 'win' THEN 1 ELSE 0 END)::float /
           GREATEST(COUNT(*), 1)) * 100, 2
        ) as win_rate
      FROM game_scores
      WHERE game = 'CONNECT4' AND game_mode = ${gameMode}
      GROUP BY user_id
      HAVING COUNT(*) >= 3
      ORDER BY win_rate DESC, total_games DESC
    `

    const userPosition = (userStats as any[]).findIndex(stat => stat.user_id === userId)
    return userPosition >= 0 ? userPosition + 1 : -1
  } catch (error) {
    console.error('Error calculating user rank:', error)
    return -1
  }
}

// DELETE - Delete a specific game result (for user's own games only)
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
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID required' },
        { status: 400 }
      )
    }

    // Verify the game belongs to the user
    const game = await prisma.gameScore.findFirst({
      where: {
        id: gameId,
        userId: session.user.id,
        game: 'CONNECT4'
      }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the game
    await prisma.gameScore.delete({
      where: { id: gameId }
    })

    // Update user statistics
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalGamesPlayed: { decrement: 1 },
        totalScore: { decrement: game.score }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Game result deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting Connect 4 game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game result' },
      { status: 500 }
    )
  }
}