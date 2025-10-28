'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { useDebounce } from '@/lib/hooks/useDebounce'

type Props = { roomId: string }

type UserLite = { id: string; username: string; avatar: string | null }
const fetcher = (url: string) => fetch(url).then(r => r.json())

export function InviteUserForm({ roomId }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<UserLite | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  const q = useMemo(() => query.trim(), [query])
  const dq = useDebounce(q, 300)
  const { data } = useSWR<{ users: UserLite[] }>(dq.length >= 2 ? `/api/users/search?q=${encodeURIComponent(dq)}` : null, fetcher)

  // Close dropdown when selection is made
  useEffect(() => { if (selected) setOpen(false) }, [selected])

  const invite = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected?.id) return
    setBusy(true)
    try {
      const res = await fetch('/api/rooms/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, targetUserId: selected.id })
      })
      if (!res.ok) throw new Error(await res.text())
      alert(`Einladung an ${selected.username} gesendet`)
      setSelected(null)
      setQuery('')
    } catch (e: any) {
      alert('Einladung fehlgeschlagen: ' + (e?.message || 'Unbekannter Fehler'))
    } finally {
      setBusy(false)
    }
  }, [roomId, selected])

  // keyboard navigation
  const [hoverIdx, setHoverIdx] = useState<number>(-1)
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = data?.users || []
    if (!open || list.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHoverIdx((i) => (i + 1) % list.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHoverIdx((i) => (i <= 0 ? list.length - 1 : i - 1))
    } else if (e.key === 'Enter' && hoverIdx >= 0) {
      e.preventDefault()
      const user = list[hoverIdx]
      if (user) setSelected(user)
    }
  }

  return (
    <form onSubmit={invite} className="flex items-center gap-2 relative">
      {!selected ? (
        <div className="relative">
          <input
            className="border border-border bg-background text-foreground rounded px-2 py-1"
            placeholder="Username suchen…"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            style={{ minWidth: 200 }}
            onKeyDownCapture={(e) => { if (e.key === 'Escape') setOpen(false) }}
          />
          {open && q.length >= 2 && (
            <div className="absolute z-50 bg-card text-foreground border border-border rounded shadow mt-1 w-full max-h-60 overflow-auto">
              {!data?.users?.length && <div className="px-2 py-1 text-sm text-muted-foreground">Keine Treffer</div>}
              {data?.users?.map((u, idx) => (
                <button type="button" key={u.id} onClick={() => setSelected(u)}
                  className={`flex items-center gap-2 w-full px-2 py-1 text-left ${hoverIdx===idx?'bg-gray-100':'hover:bg-gray-50'}`}
                  onMouseEnter={() => setHoverIdx(idx)}
                >
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt={u.username} className="inline-block w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="inline-block w-6 h-6 bg-gray-200 rounded-full" />
                  )}
                  <span className="text-sm">{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 border border-border rounded px-2 py-1 bg-card text-foreground">
          {selected.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.avatar} alt={selected.username} className="inline-block w-6 h-6 rounded-full object-cover" />
          ) : (
            <span className="inline-block w-6 h-6 bg-gray-200 rounded-full" />
          )}
          <span className="text-sm">{selected.username}</span>
          <button type="button" className="text-xs text-red-600" onClick={() => setSelected(null)}>Entfernen</button>
        </div>
      )}
      <button disabled={busy || !selected} className="bg-purple-600 text-white px-3 py-1 rounded disabled:opacity-50">Einladen</button>
    </form>
  )
}
