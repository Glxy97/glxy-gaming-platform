// @ts-nocheck
'use client'

import { useEffect, useRef } from 'react'

/**
 * React Wrapper für GLXY Battle Royale
 * 
 * Da GLXYBattleRoyaleCore eine Canvas-basierte Engine ist,
 * erstellen wir einen einfachen Wrapper
 */
export function GLXYBattleRoyaleGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Dynamisch importieren um SSR-Probleme zu vermeiden
    import('./core/GLXYBattleRoyaleCore').then(({ GLXYBattleRoyaleCore }) => {
      if (canvasRef.current) {
        const engine = new GLXYBattleRoyaleCore(canvasRef.current)
        engine.start()
        
        // Cleanup
        return () => {
          engine.stop?.()
        }
      }
    }).catch(error => {
      console.error('Failed to load Battle Royale:', error)
    })
  }, [])

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 text-white space-y-2 pointer-events-none">
        <div className="bg-black/70 px-4 py-2 rounded backdrop-blur">
          <p className="text-lg font-bold">🎮 GLXY Battle Royale</p>
          <p className="text-xs text-gray-300">WASD: Move | Mouse: Look | Click: Shoot | Space: Jump</p>
          <p className="text-xs text-gray-400">F: Interact | Tab: Inventory | M: Map</p>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black/80 px-8 py-4 rounded-lg backdrop-blur">
          <p className="text-white text-center">Loading Battle Royale...</p>
        </div>
      </div>
    </div>
  )
}

