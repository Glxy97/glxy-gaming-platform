"use client"
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSocket } from '@/components/providers/socket-provider'

type MatchPayload = { roomId: string; gameType: string; opponentId: string }

export function useMatchmaking(gameType: string) {
  const { socket } = useSocket()
  const [status, setStatus] = useState<'idle'|'queued'|'matched'|'error'>('idle')
  const [lastMatch, setLastMatch] = useState<MatchPayload | null>(null)
  const cbRef = useRef<((p: MatchPayload) => void) | null>(null)

  useEffect(() => {
    if (!socket) return
    const onMatch = (p: MatchPayload) => {
      setStatus('matched')
      setLastMatch(p)
      cbRef.current?.(p)
    }
    socket.on('match:found' as any, onMatch)
    return () => { socket.off('match:found' as any, onMatch) }
  }, [socket])

  const queue = useCallback(async () => {
    setStatus('idle')
    const res = await fetch('/api/matchmaking/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameType }) })
    if (!res.ok) { setStatus('error'); return }
    const data = await res.json()
    if (data.status === 'queued') setStatus('queued')
    if (data.status === 'matched') { setStatus('matched'); setLastMatch({ roomId: data.room.id, gameType, opponentId: 'unknown' }) }
  }, [gameType])

  const cancel = useCallback(async () => {
    await fetch(`/api/matchmaking/queue?gameType=${encodeURIComponent(gameType)}`, { method: 'DELETE' })
    setStatus('idle')
  }, [gameType])

  const onMatch = useCallback((cb: (p: MatchPayload) => void) => { cbRef.current = cb }, [])

  return { status, lastMatch, queue, cancel, onMatch }
}

