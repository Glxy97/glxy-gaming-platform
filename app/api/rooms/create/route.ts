import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CACHE_KEYS, CacheManager } from '@/lib/redis-server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = String(body?.name || '').trim() || `Room ${Date.now()}`
  const gameType = String(body?.gameType || '').trim()
  const isPublic = body?.isPublic !== false
  const maxPlayers = Math.max(2, Math.min(Number(body?.maxPlayers) || 2, 16))
  const password = String(body?.password || '').trim()

  if (!gameType) return NextResponse.json({ error: 'Game type is required' }, { status: 400 })

  const settings: any = { maxPlayers, isPublic }
  if (password) {
    settings.hasPassword = true
    settings.passwordHash = await bcrypt.hash(password, 10)
  }

  const room = await prisma.gameRoom.create({
    data: {
      name,
      gameType,
      hostId: session.user.id,
      isPublic,
      settings
    },
    include: {
      host: { select: { id: true, username: true, avatar: true } },
      players: { include: { user: { select: { id: true, username: true, avatar: true } } } }
    }
  })

  await CacheManager.set(CACHE_KEYS.GAME_ROOM(room.id), room)
  return NextResponse.json({ room })
}

