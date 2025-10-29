/**
 * 🔐 JWT Token Revocation Endpoint
 * Widerruft Access Tokens (Logout)
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtRotation, extractTokenFromRequest } from '@/lib/jwt-token-rotation'

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 400 }
      )
    }

    // Widerrufe Token
    await jwtRotation.revokeAccessToken(token)

    return NextResponse.json({ message: 'Token revoked successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to revoke token' },
      { status: 500 }
    )
  }
}

