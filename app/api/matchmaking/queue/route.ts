import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import redis, { CACHE_KEYS, CacheManager } from '@/lib/redis-server'

function queueKey(gameType: string) {
  return `mm:queue:${gameType}`
}

async function popOpponent(gameType: string, excludeUserId: string): Promise<string | null> {
  // Pop until we find a valid different user or queue is empty
  const key = queueKey(gameType)
  for (let i = 0; i < 10; i++) {
    const opponent = await redis.rpop(key)
    if (!opponent) return null
    if (opponent === excludeUserId) continue
    const present = await redis.exists(`mm:present:${gameType}:${opponent}`)
    if (present === 1) return opponent
    // stale entry, skip
  }
  return null
}

async function notifyUser(userId: string, event: string, payload: any) {
  try {
    const sockets = await CacheManager.smembers(CACHE_KEYS.USER_SOCKETS(userId))
    const io = (global as any).__glxy_io
    if (io && sockets.length) {
      sockets.forEach(sid => io.to(sid).emit(event as any, payload))
    }
  } catch (e) {
    console.error('notifyUser error', e)
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const gameType = String(body?.gameType || '').trim()
  if (!gameType) {
    return NextResponse.json({ error: 'Invalid game type' }, { status: 400 })
  }

  const userId = session.user.id
  const key = queueKey(gameType)

  // De-dupe then enqueue and set presence TTL (2 min)
  try { await redis.lrem(key, 0, userId) } catch {}
  await redis.lpush(key, userId)
  await redis.set(`mm:present:${gameType}:${userId}`, '1', 'EX', 120)

  // Try to match with simple lock to avoid race
  const lockKey = `mm:lock:${gameType}`
  let opponentId: string | null = null
  try {
    const locked = await redis.set(lockKey, userId, 'PX', 2000, 'NX')
    if (locked) {
      opponentId = await popOpponent(gameType, userId)
    }
  } finally {
    // let lock auto-expire; no explicit del to avoid deleting other's lock
  }
  if (!opponentId) {
    return NextResponse.json({ status: 'queued' })
  }

  // Create room
  const room = await prisma.gameRoom.create({
    data: {
      name: `${gameType} Match`,
      gameType,
      hostId: userId,
      settings: {}
    }
  })
  // Add players
  await prisma.playerInRoom.createMany({ data: [
    { userId, roomId: room.id, isReady: false },
    { userId: opponentId, roomId: room.id, isReady: false },
  ]})

  // Cache room for quick retrieval
  await CacheManager.set(CACHE_KEYS.GAME_ROOM(room.id), room)

  // Notify both players via Socket.IO
  const payload = { roomId: room.id, gameType, opponentId }
  await Promise.all([
    notifyUser(userId, 'match:found', payload),
    notifyUser(opponentId, 'match:found', { ...payload, opponentId: userId })
  ])

  return NextResponse.json({ status: 'matched', room })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse(null, { status: 204 })
  const { searchParams } = new URL(req.url)
  const gameType = String(searchParams.get('gameType') || '').trim()
  if (!gameType) return new NextResponse(null, { status: 204 })
  const key = queueKey(gameType)
  try { await redis.lrem(key, 0, session.user.id) } catch {}
  try { await redis.del(`mm:present:${gameType}:${session.user.id}`) } catch {}
  return new NextResponse(null, { status: 204 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gameType = String(searchParams.get('gameType') || '').trim()
  if (!gameType) return NextResponse.json({ length: 0 })
  const len = await redis.llen(queueKey(gameType)).catch(() => 0 as any)
  return NextResponse.json({ length: Number(len) || 0 })
}
