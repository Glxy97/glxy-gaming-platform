'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

type GameType = 'chess' | 'racing' | 'uno' | 'fps'

type FormState = {
  name: string
  gameType: GameType
  isPublic: boolean
  maxPlayers: number
  password: string
  submitting: boolean
}

export function CreateRoomForm() {
  const router = useRouter()
  // useToast is already in repo; fallback to console if unavailable
  // @ts-ignore
  const toastApi = typeof useToast === 'function' ? useToast() : { toast: (m: any) => console.log(m) }
  const [state, setState] = useState<FormState>({
    name: '',
    gameType: 'chess',
    isPublic: true,
    maxPlayers: 2,
    password: '',
    submitting: false,
  })

  const canSubmit = useMemo(() => {
    if (!state.gameType) return false
    if (!state.isPublic && state.maxPlayers < 2) return false
    return !state.submitting
  }, [state])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setState(s => ({ ...s, submitting: true }))
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          gameType: state.gameType,
          isPublic: state.isPublic,
          maxPlayers: state.maxPlayers,
          password: state.isPublic ? '' : state.password,
        })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const roomId = data?.room?.id
      if (!roomId) throw new Error('Room creation failed')
      // Navigate to game page with roomId
      router.push(`/games/${state.gameType}?roomId=${encodeURIComponent(roomId)}`)
    } catch (err: any) {
      // @ts-ignore
      toastApi?.toast?.({ title: 'Raum konnte nicht erstellt werden', description: err?.message || 'Unbekannter Fehler' })
      setState(s => ({ ...s, submitting: false }))
    }
  }, [state, canSubmit, router])

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-border bg-card text-foreground rounded-md p-4">
      <h3 className="font-semibold">Neuen Raum erstellen</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Raumname (optional)</span>
          <input
            className="border border-border bg-background text-foreground rounded px-2 py-1"
            value={state.name}
            onChange={(e) => setState(s => ({ ...s, name: e.target.value }))}
            placeholder="z.B. Chess Duel"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Spiel</span>
          <select
            className="border border-border bg-background text-foreground rounded px-2 py-1"
            value={state.gameType}
            onChange={(e) => setState(s => ({ ...s, gameType: e.target.value as GameType }))}
          >
            <option value="chess">Chess</option>
            <option value="racing">Racing</option>
            <option value="uno">UNO</option>
            <option value="fps">FPS</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.isPublic}
            onChange={(e) => setState(s => ({ ...s, isPublic: e.target.checked }))}
          />
          <span>Öffentlich sichtbar</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Spieleranzahl (max)</span>
          <input
            type="number"
            min={2}
            max={16}
            className="border border-border bg-background text-foreground rounded px-2 py-1"
            value={state.maxPlayers}
            onChange={(e) => setState(s => ({ ...s, maxPlayers: Math.max(2, Math.min(16, Number(e.target.value)||2)) }))}
          />
        </label>
        {!state.isPublic && (
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm text-muted-foreground">Passwort (optional)</span>
            <input
              className="border border-border bg-background text-foreground rounded px-2 py-1"
              value={state.password}
              onChange={(e) => setState(s => ({ ...s, password: e.target.value }))}
              placeholder="Passwort für privaten Raum"
            />
          </label>
        )}
      </div>
      <div>
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
          disabled={!canSubmit}
        >
          {state.submitting ? 'Erstelle…' : 'Raum erstellen'}
        </button>
      </div>
    </form>
  )
}
