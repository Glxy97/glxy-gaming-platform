import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CACHE_KEYS, CacheManager } from '@/lib/redis-server'
import bcrypt from 'bcryptjs'

async function isInvited(roomId: string, userId: string) {
  const members = await CacheManager.smembers(`invites:room:${roomId}`)
  return members.includes(userId)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const roomId = String(body?.roomId || '').trim()
  const password = String(body?.password || '').trim()
  if (!roomId) return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })

  const room = await prisma.gameRoom.findUnique({ where: { id: roomId } })
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const settings: any = (room as any).settings || {}
  const maxPlayers = settings.maxPlayers ?? 2

  const count = await prisma.playerInRoom.count({ where: { roomId } })
  if (count >= maxPlayers) return NextResponse.json({ error: 'Room is full' }, { status: 409 })

  const invited = await isInvited(roomId, session.user.id)
  if (settings.hasPassword && !invited) {
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 401 })
    const ok = await bcrypt.compare(password, settings.passwordHash || '')
    if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  await prisma.playerInRoom.create({ data: { userId: session.user.id, roomId, isReady: false } })
  const updated = await prisma.gameRoom.findUnique({
    where: { id: roomId },
    include: { host: { select: { id: true, username: true, avatar: true } }, players: { include: { user: true } } }
  })
  if (updated) await CacheManager.set(CACHE_KEYS.GAME_ROOM(roomId), updated)

  return NextResponse.json({ status: 'joined', room: updated })
}

