
'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-gaming-primary border-t-transparent', sizeClasses[size])} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('loading-dots', className)}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}
