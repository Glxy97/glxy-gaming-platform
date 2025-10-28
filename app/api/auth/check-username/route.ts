import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Validate username format (only letters and numbers - no special characters for security)
    if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username muss 3-20 Zeichen lang sein und darf nur Buchstaben und Zahlen enthalten'
      }, { status: 400 })
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    return NextResponse.json({
      available: !existingUser,
      username
    })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}