'use client'

/**
 * Document Refresh Button Component
 * Client-side refresh functionality
 */

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function DocumentRefreshButton() {
  const router = useRouter()

  return (
    <Button variant="outline" onClick={() => router.refresh()} size="icon">
      <RefreshCw className="h-4 w-4" />
    </Button>
  )
}
