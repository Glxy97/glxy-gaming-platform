import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { redis } from '@/lib/redis-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const session = await auth()

    // NULL-SAFETY: Check Redis availability
    if (!redis) {
      console.error('[SPECTATE] Redis client unavailable')
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Get room data from Redis
    const roomData = await redis.hgetall(`room:${roomId}`)

    if (!roomData || Object.keys(roomData).length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Parse room data
    const room = {
      id: roomData.id,
      name: roomData.name,
      gameType: roomData.gameType,
      status: roomData.status,
      playerCount: parseInt(roomData.playerCount || '0'),
      maxPlayers: parseInt(roomData.maxPlayers || '2'),
      isPrivate: roomData.isPrivate === 'true',
      createdAt: roomData.createdAt,
      gameState: roomData.gameState ? JSON.parse(roomData.gameState) : null,
      players: roomData.players ? JSON.parse(roomData.players) : [],
      spectators: roomData.spectators ? JSON.parse(roomData.spectators) : []
    }

    // Check if spectating is allowed
    if (room.isPrivate && !session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required for private rooms' }, { status: 401 })
    }

    // Add current user as spectator if authenticated
    if (session?.user?.id) {
      const currentSpectators = room.spectators || []
      const isAlreadySpectating = currentSpectators.some((spec: any) => spec.id === session.user.id)
      const isPlayer = room.players.some((player: any) => player.id === session.user.id)

      if (!isAlreadySpectating && !isPlayer) {
        const newSpectator = {
          id: session.user.id,
          username: session.user.username || session.user.email?.split('@')[0],
          joinedAt: new Date().toISOString()
        }

        currentSpectators.push(newSpectator)

        // Update Redis
        await redis.hset(`room:${roomId}`, 'spectators', JSON.stringify(currentSpectators))

        room.spectators = currentSpectators
      }
    }

    // Sanitize sensitive data for spectators
    const spectatorView = {
      ...room,
      gameState: room.gameState ? {
        ...room.gameState,
        // Remove any player-specific hidden information
        players: room.gameState.players?.map((player: any) => ({
          id: player.id,
          username: player.username,
          score: player.score,
          position: player.position,
          isActive: player.isActive,
          // Hide private data like cards in hand for card games
          ...(room.gameType !== 'chess' && { cardsCount: player.cards?.length })
        }))
      } : null
    }

    return NextResponse.json({
      success: true,
      room: spectatorView,
      isSpectator: session?.user?.id ? !room.players.some((p: any) => p.id === session.user.id) : true
    })
  } catch (error) {
    console.error('Spectate room error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // NULL-SAFETY: Check Redis availability
    if (!redis) {
      console.error('[SPECTATE] Redis client unavailable')
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Remove user from spectators
    const roomData = await redis.hgetall(`room:${roomId}`)

    if (roomData.spectators) {
      const spectators = JSON.parse(roomData.spectators)
      const updatedSpectators = spectators.filter((spec: any) => spec.id !== session.user.id)

      await redis.hset(`room:${roomId}`, 'spectators', JSON.stringify(updatedSpectators))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave spectate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
