// @ts-nocheck
'use client'

import React, { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import GLXYBattleRoyaleCore from './core/GLXYBattleRoyaleCore'

/**
 * React Wrapper für GLXYBattleRoyaleCore Class
 * Konvertiert die Class-basierte Engine in eine React-Komponente
 */
export default function BattleRoyaleWrapper() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<GLXYBattleRoyaleCore | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    if (!containerRef.current || !session) return

    // Initialisiere Game Engine
    const initGame = async () => {
      try {
        const config = {
          renderDistance: 500,
          maxPlayers: 100,
          tickRate: 60,
          antiCheat: {
            enabled: true,
            validationLevel: 'medium' as const,
            clientPrediction: true,
            serverReconciliation: true,
          },
          network: {
            updateRate: 20,
            bufferSize: 3,
            compressionEnabled: true,
            encryptionEnabled: true,
          },
          graphics: {
            quality: 'high' as const,
            shadowQuality: 'medium' as const,
            particleQuality: 'medium' as const,
            postProcessing: true,
          },
          audio: {
            masterVolume: 0.8,
            musicVolume: 0.6,
            sfxVolume: 1.0,
            voiceVolume: 1.0,
          },
        }

        const gameInstance = new GLXYBattleRoyaleCore(
          containerRef.current,
          session.user.id,
          session.user.username || 'Player',
          config
        )

        gameInstanceRef.current = gameInstance

        // Auto-start
        await gameInstance.initialize()
      } catch (error) {
        console.error('❌ Battle Royale Initialization Error:', error)
      }
    }

    initGame()

    // Cleanup
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.dispose()
        gameInstanceRef.current = null
      }
    }
  }, [session])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Loading Overlay */}
      {!gameInstanceRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gaming-primary mb-4 mx-auto"></div>
            <p className="text-gaming-primary font-orbitron text-xl">
              Lade Battle Royale...
            </p>
            <p className="text-gray-400 mt-2">
              Initialisiere 3D Engine und Server-Verbindung
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

