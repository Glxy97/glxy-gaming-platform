'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function JoinById() {
  const [roomId, setRoomId] = React.useState('')
  const [game, setGame] = React.useState<'chess'|'racing'|'uno'|'fps'>('chess')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const router = useRouter()

  const doJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId) return
    setBusy(true)
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password: password || undefined })
      })
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        alert(t?.error || 'Beitritt fehlgeschlagen')
        return
      }
      router.push(`/games/${game}?roomId=${encodeURIComponent(roomId)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={doJoin} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col">
        <label className="text-sm text-muted-foreground">Raum-ID</label>
        <input className="border rounded px-2 py-1" value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="z.B. r_abc123" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm text-muted-foreground">Spiel</label>
        <select className="border rounded px-2 py-1" value={game} onChange={e => setGame(e.target.value as any)}>
          <option value="chess">Chess</option>
          <option value="racing">Racing</option>
          <option value="uno">UNO</option>
          <option value="fps">FPS</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-sm text-muted-foreground">Passwort (falls nötig)</label>
        <input className="border rounded px-2 py-1" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <button className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50" disabled={!roomId || busy}>Beitreten</button>
    </form>
  )
}

