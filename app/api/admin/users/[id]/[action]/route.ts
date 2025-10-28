import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email-service'
import { generateVerificationToken } from '@/lib/email-service'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const authCheck = await verifyAdminAuth()
    if ('error' in authCheck) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id, action } = await params

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        emailVerified: true,
        mfaEnabled: true,
        lockedUntil: true,
        loginAttempts: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    let result: any

    switch (action) {
      case 'lock':
        result = await prisma.user.update({
          where: { id },
          data: {
            lockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            loginAttempts: 5 // Set to max attempts
          }
        })
        break

      case 'unlock':
        result = await prisma.user.update({
          where: { id },
          data: {
            lockedUntil: null,
            loginAttempts: 0
          }
        })
        break

      case 'verify-email':
        if (user.emailVerified) {
          return NextResponse.json({
            success: true,
            message: 'E-Mail bereits verifiziert'
          })
        }

        result = await prisma.user.update({
          where: { id },
          data: {
            emailVerified: new Date(),
            verificationToken: null,
            tokenExpires: null
          }
        })
        break

      case 'reset-mfa':
        if (!user.mfaEnabled) {
          return NextResponse.json({
            success: true,
            message: 'MFA ist bereits deaktiviert'
          })
        }

        result = await prisma.user.update({
          where: { id },
          data: {
            mfaEnabled: false,
            mfaSecret: null
          }
        })
        break

      case 'reset-password':
        // Generate password reset token
        const resetToken = generateVerificationToken()
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // For this demo, we'll store it in the verification fields
        // In production, you might want separate password reset fields
        await prisma.user.update({
          where: { id },
          data: {
            verificationToken: resetToken,
            tokenExpires: resetExpires
          }
        })

        // Send password reset email
        try {
          const emailSent = await sendPasswordResetEmail(
            user.email,
            user.username || 'Benutzer',
            resetToken
          )

          if (emailSent) {
            return NextResponse.json({
              success: true,
              message: 'Password-Reset-E-Mail wurde gesendet'
            })
          } else {
            return NextResponse.json({
              success: false,
              error: 'E-Mail konnte nicht gesendet werden'
            }, { status: 500 })
          }
        } catch (error) {
          console.error('Error sending password reset email:', error)
          return NextResponse.json({
            success: false,
            error: 'Fehler beim Senden der E-Mail'
          }, { status: 500 })
        }

      case 'send-verification':
        if (user.emailVerified) {
          return NextResponse.json({
            success: true,
            message: 'E-Mail bereits verifiziert'
          })
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken()
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

        await prisma.user.update({
          where: { id },
          data: { verificationToken, tokenExpires }
        })

        try {
          const emailSent = await sendVerificationEmail(
            user.email,
            user.username || 'Benutzer',
            verificationToken
          )

          if (emailSent) {
            return NextResponse.json({
              success: true,
              message: 'Verifikations-E-Mail wurde gesendet'
            })
          } else {
            return NextResponse.json({
              success: false,
              error: 'E-Mail konnte nicht gesendet werden'
            }, { status: 500 })
          }
        } catch (error) {
          console.error('Error sending verification email:', error)
          return NextResponse.json({
            success: false,
            error: 'Fehler beim Senden der E-Mail'
          }, { status: 500 })
        }

      case 'reset-attempts':
        result = await prisma.user.update({
          where: { id },
          data: {
            loginAttempts: 0,
            lockedUntil: null
          }
        })
        break

      case 'delete':
        // Soft delete or hard delete based on your requirements
        // For gaming platform, you might want to keep user data for analytics
        result = await prisma.user.update({
          where: { id },
          data: {
            email: `deleted_${Date.now()}@deleted.local`,
            username: null,
            password: 'DELETED',
            emailVerified: null,
            mfaEnabled: false,
            mfaSecret: null,
            verificationToken: null,
            tokenExpires: null,
            lockedUntil: new Date('2099-12-31') // Permanently locked
          }
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Log admin action for audit trail
    console.log(`Admin ${authCheck.user.email} performed ${action} on user ${user.email} (${id})`)

    return NextResponse.json({
      success: true,
      message: `User ${action} completed successfully`,
      data: result ? { id: result.id, email: result.email } : null
    })

  } catch (error) {
    console.error('User action error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}