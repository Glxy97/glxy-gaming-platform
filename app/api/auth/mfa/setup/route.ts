import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { authenticator } from 'otplib'
import { encrypt } from '@/lib/crypto-util'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Generate new secret for TOTP
    const secret = authenticator.generateSecret()

    // Create service name and account info for QR code
    const serviceName = 'GLXY Gaming'
    const accountName = session.user.email

    // Generate QR code URL
    const qrCodeUrl = authenticator.keyuri(accountName, serviceName, secret)

    // Generate backup codes
    const backupCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const backupCode = crypto.randomInt(10000000, 99999999).toString()
      backupCodes.push(backupCode)
    }

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCodeUrl,
        backupCodes
      }
    })

  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}