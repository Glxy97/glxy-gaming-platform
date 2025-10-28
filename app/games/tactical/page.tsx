
'use client'

import { useState } from 'react'
import { Advanced3DFPS } from '@/components/games/fps/advanced-3d-fps'
import TacticalFPSGame from '@/components/games/fps/TacticalFPSGame'
import { useSearchParams } from 'next/navigation'
import { RoomMenu } from '@/components/rooms/RoomMenu'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Target, Users } from 'lucide-react'

function FPSGameContent() {
  const params = useSearchParams()
  const roomId = params?.get('roomId') || ''
  const [gameMode, setGameMode] = useState<'classic' | 'tactical'>('tactical')
  const [selectedMap, setSelectedMap] = useState('urban_warfare')
  const [gameType, setGameType] = useState<'1vs1' | '2vs2' | '5vs5'>('5vs5')

  return (
    <div className="space-y-4">
      {/* Game Mode Selection */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Crown className="w-6 h-6 text-orange-500" />
            <span>GLXY Tactical Operations</span>
          </h2>
          <Badge className="bg-orange-500 text-white">
            <Target className="w-3 h-3 mr-1" />
            Multiplayer Ready
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex gap-2">
            <Button
              variant={gameMode === 'tactical' ? 'default' : 'outline'}
              onClick={() => setGameMode('tactical')}
              className={gameMode === 'tactical' ? 'bg-orange-600 hover:bg-orange-700' : 'border-gray-600 text-gray-300'}
            >
              <Target className="w-4 h-4 mr-2" />
              Tactical Operations
            </Button>
            <Button
              variant={gameMode === 'classic' ? 'default' : 'outline'}
              onClick={() => setGameMode('classic')}
              className={gameMode === 'classic' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300'}
            >
              <Crown className="w-4 h-4 mr-2" />
              Classic FPS
            </Button>
          </div>

          {gameMode === 'tactical' && (
            <>
              <div className="flex gap-2">
                <select
                  value={selectedMap}
                  onChange={(e) => setSelectedMap(e.target.value)}
                  className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                >
                  <option value="urban_warfare">Urban Warfare</option>
                  <option value="desert_storm">Desert Storm</option>
                  <option value="arctic_base">Arctic Base</option>
                  <option value="jungle_operations">Jungle Operations</option>
                  <option value="mountain_outpost">Mountain Outpost</option>
                </select>

                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as any)}
                  className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                >
                  <option value="1vs1">1 vs 1</option>
                  <option value="2vs2">2 vs 2</option>
                  <option value="5vs5">5 vs 5</option>
                </select>
              </div>
            </>
          )}
        </div>

        {gameMode === 'tactical' && (
          <div className="bg-gray-800 rounded p-3 mb-4">
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Available Tactical Classes:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="bg-orange-900/30 border border-orange-700 rounded p-2 text-center">
                <div className="text-orange-400 font-semibold">Assault</div>
                <div className="text-xs text-gray-400">M4A1 • Breach</div>
              </div>
              <div className="bg-purple-900/30 border border-purple-700 rounded p-2 text-center">
                <div className="text-purple-400 font-semibold">Recon</div>
                <div className="text-xs text-gray-400">M110 SASS • Scout</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-700 rounded p-2 text-center">
                <div className="text-yellow-400 font-semibold">Marksman</div>
                <div className="text-xs text-gray-400">M24 SWS • Sniper</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded p-2 text-center">
                <div className="text-blue-400 font-semibold">Engineer</div>
                <div className="text-xs text-gray-400">SCAR-H • Demo</div>
              </div>
              <div className="bg-green-900/30 border border-green-700 rounded p-2 text-center">
                <div className="text-green-400 font-semibold">Medic</div>
                <div className="text-xs text-gray-400">M4 Carbine • Heal</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {roomId && (
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex flex-wrap items-center gap-3">
          <div className="text-sm text-white">Room ID: <span className="font-mono text-orange-400">{roomId}</span></div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="border-gray-600 text-gray-300"
          >
            Copy
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <RoomMenu roomId={roomId} />
          </div>
        </div>
      )}

      {/* Game Display */}
      <div className="relative">
        {gameMode === 'tactical' ? (
          <TacticalFPSGame
            mapId={selectedMap}
            gameMode={gameType}
            onGameEnd={(result) => {
              console.log('Tactical game ended:', result)
            }}
          />
        ) : (
          <Advanced3DFPS />
        )}
      </div>
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
