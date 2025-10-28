"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import GameLobbyEnhanced from '@/components/multiplayer/game-lobby-enhanced'

export default function MultiplayerPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect to auth if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/multiplayer')
    }
  }, [status, router])

  // Loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Lade...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show auth required if not logged in
  if (!session?.user) {
    return null // Redirect is handled by useEffect
  }

  return <GameLobbyEnhanced />
}