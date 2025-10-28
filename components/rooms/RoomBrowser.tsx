'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'

type RoomRow = {
  id: string
  name: string
  gameType: string
  isPublic: boolean
  hasPassword: boolean
  players: number
  maxPlayers: number
  createdAt?: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function RoomBrowser() {
  const router = useRouter()
  const [gameType, setGameType] = useState<string>('')
  const [q, setQ] = useState<string>('')
  const qs = useMemo(() => {
    const params = new URLSearchParams()
    if (gameType) params.set('gameType', gameType)
    if (q) params.set('q', q)
    return params.toString()
  }, [gameType, q])

  const { data, isLoading, mutate } = useSWR<{ rooms: RoomRow[] }>(`/api/rooms/list${qs ? `?${qs}` : ''}`, fetcher, {
    refreshInterval: 5000
  })

  const [joinTarget, setJoinTarget] = useState<RoomRow | null>(null)
  const [joinPassword, setJoinPassword] = useState('')
  const [joining, setJoining] = useState(false)

  const doJoin = useCallback(async (room: RoomRow, password?: string) => {
    setJoining(true)
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, password })
      })
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        alert(t?.error || 'Beitritt fehlgeschlagen')
        return
      }
      const game = room.gameType || 'chess'
      router.push(`/games/${game}?roomId=${encodeURIComponent(room.id)}`)
    } finally {
      setJoining(false)
      setJoinTarget(null)
      setJoinPassword('')
    }
  }, [router])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className="border rounded px-2 py-1" value={gameType} onChange={e => setGameType(e.target.value)}>
          <option value="">Alle Spiele</option>
          <option value="chess">Chess</option>
          <option value="racing">Racing</option>
          <option value="uno">UNO</option>
          <option value="fps">FPS</option>
        </select>
        <input className="border rounded px-2 py-1" placeholder="Suche…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="border rounded px-3 py-1" onClick={() => mutate()}>Aktualisieren</button>
      </div>
      <div className="border rounded">
        <div className="grid grid-cols-6 gap-2 px-3 py-2 text-xs text-muted-foreground border-b">
          <div>Name</div><div>Spiel</div><div>Spieler</div><div>Öffentlich</div><div>Passwort</div><div>Aktion</div>
        </div>
        {isLoading && <div className="px-3 py-4 text-sm">Lade…</div>}
        {!isLoading && (data?.rooms?.length ? data.rooms.map(r => (
          <div key={r.id} className="grid grid-cols-6 gap-2 px-3 py-2 items-center border-b last:border-b-0 text-sm">
            <div className="truncate" title={r.name}>{r.name || '(ohne Namen)'}</div>
            <div className="capitalize">{r.gameType}</div>
            <div>{r.players}/{r.maxPlayers}</div>
            <div>{r.isPublic ? 'Ja' : 'Nein'}</div>
            <div>{r.hasPassword ? 'Ja' : 'Nein'}</div>
            <div className="flex items-center gap-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => (r.hasPassword ? setJoinTarget(r) : doJoin(r))}>Beitreten</button>
              <button className="border px-2 py-1 rounded" onClick={() => navigator.clipboard.writeText(r.id)}>Kopieren</button>
            </div>
          </div>
        )) : <div className="px-3 py-4 text-sm">Keine Räume gefunden</div>)}
      </div>
      <Dialog open={!!joinTarget} onOpenChange={(o) => { if (!o) { setJoinTarget(null); setJoinPassword('') } }}>
        <DialogOverlay />
        <DialogContent>
            <DialogTitle className="font-semibold mb-2">Passwort erforderlich</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-2">
              Raum: {joinTarget?.name || joinTarget?.id}
            </DialogDescription>
            <input className="border border-border bg-background text-foreground rounded w-full px-2 py-1 mb-3" autoFocus value={joinPassword} onChange={e => setJoinPassword(e.target.value)} placeholder="Passwort" />
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <button className="border border-border px-3 py-1 rounded">Abbrechen</button>
              </DialogClose>
              <button className="bg-primary text-primary-foreground px-3 py-1 rounded disabled:opacity-50" disabled={!joinPassword || joining} onClick={() => joinTarget && doJoin(joinTarget, joinPassword)}>
                {joining ? 'Beitreten…' : 'Beitreten'}
              </button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
