import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required'
      }, { status: 400 })
    }

    // Finde Benutzer mit dem Token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        tokenExpires: {
          gte: new Date() // Token noch nicht abgelaufen
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification token'
      }, { status: 400 })
    }

    // Bereits verifiziert?
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified'
      })
    }

    // Verifiziere E-Mail-Adresse
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        tokenExpires: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      data: {
        username: user.username
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
