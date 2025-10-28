import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      avatar: true,
      level: true,
      globalXP: true,
      createdAt: true,
      lastLogin: true,
      image: true,
      name: true,
    }
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ user })
}

