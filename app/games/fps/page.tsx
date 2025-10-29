
'use client'

import { GLXYBattleRoyaleCore } from '@/components/games/fps/battle-royale/core/GLXYBattleRoyaleCore'
import { useSearchParams } from 'next/navigation'
import { RoomMenu } from '@/components/rooms/RoomMenu'
import { Suspense } from 'react'

function FPSGameContent() {
  const params = useSearchParams()
  const roomId = params?.get('roomId') || ''
  return (
    <div className="space-y-3">
      {roomId && (
        <div className="border rounded p-3 flex flex-wrap items-center gap-3">
          <div className="text-sm">Room ID: <span className="font-mono">{roomId}</span></div>
          <button className="border px-2 py-1 rounded" onClick={() => navigator.clipboard.writeText(roomId)}>Kopieren</button>
          <div className="ml-auto flex items-center gap-2">
            <RoomMenu roomId={roomId} />
          </div>
        </div>
      )}
      <GLXYBattleRoyaleCore />
    </div>
  )
}

export default function FPSGamePage() {
  return (
    <Suspense fallback={null}>
      <FPSGameContent />
    </Suspense>
  )
}
