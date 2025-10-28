'use client'

import { TetrisBattle2025 } from '@/components/games/tetris/tetris-battle-2025'
import { useSearchParams } from 'next/navigation'
import { RoomMenu } from '@/components/rooms/RoomMenu'
import { Suspense } from 'react'

function TetrisGameContent() {
  const params = useSearchParams()
  const roomId = params?.get('roomId') || params?.get('room')
  const mode = (params?.get('mode') || 'solo') as 'solo' | 'multiplayer'

  return (
    <div className="space-y-4">
      {/* Room Info Bar (Multiplayer) */}
      {roomId && mode === 'multiplayer' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-black/80 backdrop-blur-xl border border-purple-500/50 rounded-lg p-4 shadow-2xl shadow-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="text-purple-400 font-semibold">Room:</span>
                <span className="font-mono font-bold ml-2 text-white">{roomId}</span>
              </div>
              <button
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 rounded text-purple-300 text-xs transition-all"
                onClick={() => navigator.clipboard.writeText(roomId)}
              >
                Copy
              </button>
              <RoomMenu roomId={roomId} />
            </div>
          </div>
        </div>
      )}

      {/* TETRIS BATTLE 2025 */}
      <TetrisBattle2025
        roomId={roomId || undefined}
        mode={mode}
      />
    </div>
  )
}

export default function TetrisGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <div className="text-white text-xl">Loading Tetris Battle...</div>
        </div>
      </div>
    }>
      <TetrisGameContent />
    </Suspense>
  )
}
