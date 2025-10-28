import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gameType = searchParams.get('gameType') || undefined
  const q = (searchParams.get('q') || '').trim()

  const rooms = await prisma.gameRoom.findMany({
    where: {
      isPublic: true,
      ...(gameType ? { gameType } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      players: true,
    }
  })

  const available = rooms.filter(r => {
    const maxPlayers = (r as any).settings?.maxPlayers || (r as any).maxPlayers || 2
    return (r.players?.length || 0) < maxPlayers
  })

  return NextResponse.json({ rooms: available.map(r => ({
    id: r.id,
    name: r.name,
    gameType: r.gameType,
    isPublic: r.isPublic,
    hasPassword: Boolean((r as any).settings?.hasPassword),
    players: r.players?.length || 0,
    maxPlayers: (r as any).settings?.maxPlayers || (r as any).maxPlayers || 2,
    createdAt: r.createdAt
  })) })
}

