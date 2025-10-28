import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CacheManager } from '@/lib/redis-server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const roomId = String(body?.roomId || '').trim()
  const targetUserId = String(body?.targetUserId || '').trim()
  if (!roomId || !targetUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const room = await prisma.gameRoom.findUnique({ where: { id: roomId } })
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.hostId !== session.user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const key = `invites:room:${roomId}`
  await CacheManager.sadd(key, targetUserId)
  // TODO: Set TTL for invites (requires Redis setup)

  // Notify via Socket.IO (best effort)
  try {
    const io = (global as any).__glxy_io
    if (io) {
      io.emit('invite:received', { roomId, from: session.user.id, targetUserId })
    }
  } catch (error) { console.error('Socket.IO error:', error) }

  return NextResponse.json({ status: 'invited' })
}
