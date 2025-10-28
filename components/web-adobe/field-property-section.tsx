/**
 * Field Property Section Component
 * Collapsible accordion section for organizing field properties
 */

'use client'

import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface FieldPropertySectionProps {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  onToggle?: (isOpen: boolean) => void
  className?: string
}

export function FieldPropertySection({
  title,
  icon,
  defaultOpen = false,
  children,
  onToggle,
  className,
}: FieldPropertySectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      onOpenChange={onToggle}
      className={cn('border-b border-border last:border-b-0', className)}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span>{title}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 py-3 space-y-3 animate-accordion-down">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Property Row Component
 * Standardized row layout for property inputs
 */
interface PropertyRowProps {
  label: string
  children: ReactNode
  description?: string
  required?: boolean
}

export function PropertyRow({
  label,
  children,
  description,
  required,
}: PropertyRowProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
