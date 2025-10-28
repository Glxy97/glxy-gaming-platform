import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditLogger } from '@/lib/audit-logger'

/**
 * Security utility to check admin access
 * Verifies user authentication and admin privileges using database roles
 */
export async function checkAdminAccess(): Promise<{
  hasAccess: boolean
  user?: {
    id: string
    email: string
    username?: string
    role?: string
  }
  reason?: string
}> {
  try {
    const session = await auth()

    if (!session?.user) {
      return {
        hasAccess: false,
        reason: 'No active session'
      }
    }

    const email = session.user.email
    const id = (session as any)?.user?.id

    if (!email || !id) {
      return {
        hasAccess: false,
        reason: 'Invalid session data'
      }
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true,
        email: true,
        username: true,
        role: true
      }
    })

    if (!user) {
      return {
        hasAccess: false,
        reason: 'User not found in database'
      }
    }

    // Check if user has admin or moderator privileges
    const hasAccess = user.role === 'ADMIN' || user.role === 'MODERATOR'

    // Log admin access attempt
    await AuditLogger.logAdminAction(
      hasAccess ? 'ADMIN_ACCESS_GRANTED' : 'ADMIN_ACCESS_DENIED',
      {
        userId: user.id,
        sessionId: (session as any)?.sessionId,
        ipAddress: undefined, // Would need to be passed from request context
        userAgent: undefined  // Would need to be passed from request context
      },
      {
        requestedRole: user.role,
        hasAccess,
        reason: hasAccess ? undefined : `Insufficient privileges - user role: ${user.role}`
      }
    )

    if (!hasAccess) {
      return {
        hasAccess: false,
        reason: `Insufficient privileges - user role: ${user.role}`
      }
    }

    return {
      hasAccess: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Admin access check error:', error)
    return {
      hasAccess: false,
      reason: 'System error during access check'
    }
  }
}

/**
 * Higher-order function to protect API routes requiring admin access
 */
export function withAdminAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const accessCheck = await checkAdminAccess()

    if (!accessCheck.hasAccess) {
      return new Response(
        JSON.stringify({
          error: 'Access denied',
          reason: accessCheck.reason
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(...args)
  }
}

/**
 * Verify admin authentication for Next.js API routes
 * Returns either the authenticated user or an error response
 */
export async function verifyAdminAuth(request: Request): Promise<
  | { user: { id: string; email: string; username?: string; role?: string }; error?: never; status?: never }
  | { error: string; status: number; user?: never }
> {
  const accessCheck = await checkAdminAccess()

  if (!accessCheck.hasAccess) {
    return {
      error: accessCheck.reason || 'Access denied',
      status: 403
    }
  }

  return {
    user: accessCheck.user!
  }
}