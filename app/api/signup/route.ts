import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { signUpSchema, validateInput } from '@/lib/validations'
import { hashPassword, sanitizeInput, isValidEmail, isValidUsername } from '@/lib/auth-security'
import { checkSignupRateLimit, getClientIP, formatRateLimitError } from '@/lib/rate-limit'
import { generateVerificationToken, sendWelcomeEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkSignupRateLimit(request)

    if (!rateLimit.success) {
      return NextResponse.json({
        success: false,
        error: formatRateLimitError(rateLimit)
      }, { status: 429 })
    }

    let body
    try {
      const rawBody = await request.text()
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format'
      }, { status: 400 })
    }

    // Validate input with Zod
    const validation = validateInput(signUpSchema, body)
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }

    const { email, username, password } = validation.data!

    // Additional sanitization
    const sanitizedEmail = sanitizeInput(email.toLowerCase())
    const sanitizedUsername = sanitizeInput(username)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          { username: sanitizedUsername }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email or username already exists'
      }, { status: 409 })
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password)

    // Generiere Verifikations-Token
    const verificationToken = generateVerificationToken()
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Stunden gültig

    // Create user with verification token
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        username: sanitizedUsername,
        password: hashedPassword,
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&seed=${sanitizedUsername}`,
        emailVerified: null,
        verificationToken,
        tokenExpires,
      }
    })

    // Sende Willkommens-E-Mail mit Verifikation
    const emailSent = await sendWelcomeEmail(sanitizedEmail, sanitizedUsername, verificationToken)

    if (!emailSent) {
      console.warn('⚠️ Willkommens-E-Mail konnte nicht gesendet werden, aber Benutzer wurde erstellt')
    }

    // Create initial game stats
    await prisma.gameStats.create({
      data: {
        userId: user.id,
        gameType: 'chess'
      }
    })

    // Award first achievement
    const firstStepsAchievement = await prisma.achievement.findUnique({
      where: { name: 'First Steps' }
    })

    if (firstStepsAchievement) {
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: firstStepsAchievement.id
        }
      })

      // Update user XP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          globalXP: firstStepsAchievement.xpReward
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified
        },
        emailSent: emailSent
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
