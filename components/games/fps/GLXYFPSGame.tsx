// @ts-nocheck
'use client'

import { useEffect, useRef } from 'react'
import { GLXYFPSCore } from './GLXYFPSCore'

/**
 * React Wrapper für GLXYFPSCore Engine
 */
export function GLXYFPSGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GLXYFPSCore | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize GLXY FPS Engine with container
    const engine = new GLXYFPSCore(containerRef.current)
    engineRef.current = engine

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 text-white space-y-2">
        <div className="bg-black/50 px-4 py-2 rounded">
          <p className="text-sm">🎮 GLXY FPS Core</p>
          <p className="text-xs text-gray-400">WASD: Move | Mouse: Look | Click: Shoot | R: Reload</p>
        </div>
      </div>
    </div>
  )
}
