import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email-service'

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

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth()
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { action, userIds } = await request.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs are required' },
        { status: 400 }
      )
    }

    let result: any

    switch (action) {
      case 'lock':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            lockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        })
        break

      case 'unlock':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            lockedUntil: null,
            loginAttempts: 0
          }
        })
        break

      case 'verify':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            emailVerified: new Date(),
            verificationToken: null,
            tokenExpires: null
          }
        })
        break

      case 'disable_mfa':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            mfaEnabled: false,
            mfaSecret: null
          }
        })
        break

      case 'reset_login_attempts':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            loginAttempts: 0,
            lockedUntil: null
          }
        })
        break

      case 'send_verification_email':
        // Get users to send emails to
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            emailVerified: null
          },
          select: { id: true, email: true, username: true }
        })

        let emailsSent = 0
        for (const user of users) {
          try {
            // Generate new verification token
            const verificationToken = crypto.randomUUID()
            const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

            await prisma.user.update({
              where: { id: user.id },
              data: { verificationToken, tokenExpires }
            })

            // Send verification email (implement your email service)
            const emailSent = await sendVerificationEmail(user.email, user.username || 'Benutzer', verificationToken)
            if (emailSent) emailsSent++

          } catch (error) {
            console.error(`Error sending email to ${user.email}:`, error)
          }
        }

        return NextResponse.json({
          success: true,
          message: `${emailsSent} von ${users.length} E-Mails erfolgreich gesendet`,
          data: { emailsSent, totalUsers: users.length }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: { affected: result.count }
    })

  } catch (error) {
    console.error('Bulk user action error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}