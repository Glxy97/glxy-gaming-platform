'use client'

/**
 * Document Search Component
 * Client-side search with debouncing
 */

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'

interface DocumentSearchProps {
  defaultValue?: string
}

export function DocumentSearch({ defaultValue }: DocumentSearchProps) {
  const [query, setQuery] = useState(defaultValue || '')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (query) {
        params.set('search', query)
      } else {
        params.delete('search')
      }
      params.delete('page') // Reset to page 1
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, pathname, router, searchParams])

  return (
    <Input
      type="search"
      placeholder="Dokumente durchsuchen..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-full"
    />
  )
}
