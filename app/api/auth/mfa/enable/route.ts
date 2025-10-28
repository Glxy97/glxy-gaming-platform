import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
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

    const { secret } = await request.json()

    if (!secret) {
      return NextResponse.json({
        success: false,
        error: 'MFA secret is required'
      }, { status: 400 })
    }

    // Encrypt the secret before storing
    const encryptedSecret = encrypt(secret)

    // Generate backup codes and encrypt them
    const backupCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      const backupCode = crypto.randomInt(10000000, 99999999).toString()
      backupCodes.push(backupCode)
    }

    const encryptedBackupCodes = backupCodes.map(code => encrypt(code))

    // Update user in database
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        mfaEnabled: true,
        mfaSecret: encryptedSecret,
        // You might want to add a backupCodes field to your User model
        // For now, we'll store them in a separate table or JSON field
      }
    })

    // Log security event
    console.log(`MFA enabled for user: ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'MFA successfully enabled',
      data: {
        mfaEnabled: user.mfaEnabled
      }
    })

  } catch (error) {
    console.error('MFA enable error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to enable MFA'
    }, { status: 500 })
  }
}