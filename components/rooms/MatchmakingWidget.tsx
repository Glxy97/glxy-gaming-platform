'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useMatchmaking } from '@/lib/hooks/useMatchmaking'

export function MatchmakingWidget() {
  const [gameType, setGameType] = useState<'chess'|'racing'|'uno'|'fps'>('chess')
  const { status, queue, cancel } = useMatchmaking(gameType)
  const waiting = status === 'queued'

  const start = useCallback(() => { queue() }, [queue])
  const stop = useCallback(() => { cancel() }, [cancel])

  const label = useMemo(() => {
    if (status === 'idle') return 'Bereit'
    if (status === 'queued') return 'Warte auf Gegner…'
    if (status === 'matched') return 'Match gefunden!'
    if (status === 'error') return 'Fehler'
    return ''
  }, [status])

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center gap-2">
        <select className="border rounded px-2 py-1" value={gameType} onChange={(e) => setGameType(e.target.value as any)}>
          <option value="chess">Chess</option>
          <option value="racing">Racing</option>
          <option value="uno">UNO</option>
          <option value="fps">FPS</option>
        </select>
        {!waiting ? (
          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={start}>Matchmaking starten</button>
        ) : (
          <button className="border px-3 py-1 rounded" onClick={stop}>Abbrechen</button>
        )}
        <span className="text-sm text-muted-foreground ml-2">{label}</span>
      </div>
      {waiting && (
        <div className="text-sm text-muted-foreground">Du wirst automatisch verbunden, sobald ein Gegner verfügbar ist.</div>
      )}
    </div>
  )}

