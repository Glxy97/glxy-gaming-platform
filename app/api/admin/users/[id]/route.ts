import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminAuth()
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            type: true
          }
        },
        gameStats: {
          select: {
            id: true,
            gameType: true,
            xp: true,
            level: true,
            wins: true,
            losses: true,
            draws: true
          }
        },
        achievements: {
          include: {
            achievement: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                xpReward: true
              }
            }
          }
        },
        gameScores: {
          select: {
            id: true,
            game: true,
            gameMode: true,
            score: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove sensitive data
    const { password, verificationToken, mfaSecret, ...safeUser } = user

    return NextResponse.json({
      success: true,
      data: safeUser
    })

  } catch (error) {
    console.error('Admin user detail fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminAuth()
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = await params
    const updateData = await request.json()

    // Validate and sanitize update data
    const allowedFields = ['username', 'level', 'globalXP', 'coins', 'bio']
    const sanitizedData: any = {}

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field]
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: sanitizedData,
      select: {
        id: true,
        email: true,
        username: true,
        level: true,
        globalXP: true,
        coins: true,
        bio: true,
        updatedAt: true
      }
    })

    // Log admin action
    console.log(`Admin ${authCheck.user.email} updated user ${id}:`, sanitizedData)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}