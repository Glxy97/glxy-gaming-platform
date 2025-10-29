// @ts-nocheck
'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamischer Import für Client-Side Only (default export!)
const UltimateFPSGame = dynamic(
  () => import('@/components/games/fps/ultimate/UltimateFPSGame'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎮</div>
          <div className="text-white text-2xl font-bold animate-pulse">
            Loading Ultimate FPS...
          </div>
        </div>
      </div>
    )
  }
)

export default function UltimateFPSPage() {
  return (
    <Suspense fallback={null}>
      <UltimateFPSGame />
    </Suspense>
  )
}

