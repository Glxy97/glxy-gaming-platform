'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAliasPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the actual admin area
    router.replace('/admin')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to admin area...</p>
      </div>
    </div>
  )
}