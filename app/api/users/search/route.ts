import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ users: [] }, { status: 200 })
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] }, { status: 200 })

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
      NOT: { id: session.user.id },
    },
    select: { id: true, username: true, avatar: true },
    take: 10,
    orderBy: { username: 'asc' }
  })

  return NextResponse.json({ users })
}

