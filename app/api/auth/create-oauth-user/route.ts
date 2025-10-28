import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/auth-security'

export async function POST(req: Request) {
  try {
    const { email, username, name, image } = await req.json()

    if (!email || !username) {
      return new NextResponse('Missing email or username', { status: 400 })
    }

    const sanitizedUsername = sanitizeInput(username)

    // Check if username is already taken
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: sanitizedUsername },
    })

    if (existingUserByUsername) {
      return new NextResponse('Username is already taken', { status: 409 })
    }
    
    // Check if user with this email already exists (should not happen in this flow, but as a safeguard)
    const existingUserByEmail = await prisma.user.findUnique({
        where: { email: email },
    })

    if (existingUserByEmail) {
        return new NextResponse('A user with this email already exists.', { status: 409 })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username: sanitizedUsername,
        name: name || sanitizedUsername,
        image,
        emailVerified: new Date(), // OAuth emails are considered verified
        level: 1,
        globalXP: 0,
        coins: 100, // Welcome bonus
        lastLogin: new Date(),
      },
    })

    return NextResponse.json({ success: true, userId: user.id })

  } catch (error) {
    console.error('Error creating OAuth user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
