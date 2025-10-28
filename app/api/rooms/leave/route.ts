import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CACHE_KEYS, CacheManager } from '@/lib/redis-server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const roomId = String(body?.roomId || '').trim()
  if (!roomId) return NextResponse.json({ error: 'Room ID required' }, { status: 400 })

  await prisma.playerInRoom.deleteMany({ where: { roomId, userId: session.user.id } })
  const updated = await prisma.gameRoom.findUnique({ where: { id: roomId }, include: { players: { include: { user: true } } } })
  if (updated) await CacheManager.set(CACHE_KEYS.GAME_ROOM(roomId), updated)
  return NextResponse.json({ status: 'left' })
}

