'use client'

/**
 * Document Status Filter Component
 * Client-side status filtering
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DocumentStatusFilterProps {
  defaultValue?: string
}

export function DocumentStatusFilter({ defaultValue }: DocumentStatusFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    params.delete('page') // Reset to page 1
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select defaultValue={defaultValue || 'all'} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Alle Status</SelectItem>
        <SelectItem value="DRAFT">Entwurf</SelectItem>
        <SelectItem value="ANALYZING">Analysiert</SelectItem>
        <SelectItem value="REVIEW">Überprüfung</SelectItem>
        <SelectItem value="SYNCED">Synchronisiert</SelectItem>
        <SelectItem value="ERROR">Fehler</SelectItem>
      </SelectContent>
    </Select>
  )
}
