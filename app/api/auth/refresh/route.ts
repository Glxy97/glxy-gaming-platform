/**
 * 🔐 JWT Token Refresh Endpoint
 * Erneuert abgelaufene Access Tokens mit Refresh Token
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtRotation } from '@/lib/jwt-token-rotation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      )
    }

    // Erneuere Token-Paar
    const newTokenPair = await jwtRotation.refreshTokenPair(refreshToken)

    return NextResponse.json({
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
      expiresAt: newTokenPair.accessTokenExpiresAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired refresh token' },
      { status: 401 }
    )
  }
}

