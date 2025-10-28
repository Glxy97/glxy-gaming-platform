import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-security'
import { auth } from '@/lib/auth'
import { validateAndSanitizeInput } from '@/lib/auth-security'
import { AuditLogger } from '@/lib/audit-logger'

// Verify admin privileges
async function verifyAdminAuth(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return { error: 'Unauthorized', status: 401 }
    }

    // Check if user is admin (you can implement your own admin logic here)
    // For now, checking against environment variable or database
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

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(request)
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    let whereCondition: any = {}

    // Search filter with input sanitization
    if (search) {
      const sanitizedSearch = validateAndSanitizeInput.search(search)
      if (sanitizedSearch) {
        whereCondition.OR = [
          { email: { contains: sanitizedSearch, mode: 'insensitive' } },
          { username: { contains: sanitizedSearch, mode: 'insensitive' } },
          { id: { contains: sanitizedSearch } }
        ]
      }
    }

    // Status filter
    if (status === 'active') {
      whereCondition.emailVerified = true
      whereCondition.lockedUntil = null
    } else if (status === 'locked') {
      whereCondition.lockedUntil = { not: null }
    } else if (status === 'unverified') {
      whereCondition.emailVerified = false
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          email: true,
          username: true,
          level: true,
          globalXP: true,
          coins: true,
          emailVerified: true,
          mfaEnabled: true,
          loginAttempts: true,
          lockedUntil: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          totalGamesPlayed: true,
          totalScore: true,
          // Exclude sensitive data
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where: whereCondition })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(request)
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const body = await request.json()
    const { action, email, data } = body

    switch (action) {
      case 'create_admin_user':
        // Log bulk operation
        await AuditLogger.logAdminAction(
          'BULK_OPERATION',
          {
            userId: authCheck.user.id,
            sessionId: undefined,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined
          },
          {
            operation: 'create_admin_user',
            targetEmail: email,
            adminUserId: authCheck.user.id
          }
        )
        
        // Create admin user logic here
        return NextResponse.json(
          { success: false, error: 'Not implemented' },
          { status: 501 }
        )

      case 'bulk_update':
        // Log bulk operation
        await AuditLogger.logAdminAction(
          'BULK_OPERATION',
          {
            userId: authCheck.user.id,
            sessionId: undefined,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined
          },
          {
            operation: 'bulk_update',
            updateData: data,
            adminUserId: authCheck.user.id
          }
        )
        
        // Bulk update logic here
        return NextResponse.json(
          { success: false, error: 'Not implemented' },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Admin users POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}