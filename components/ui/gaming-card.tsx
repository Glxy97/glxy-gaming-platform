
'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GamingCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'neon'
  hover?: boolean
  glow?: boolean
}

export function GamingCard({ 
  children, 
  className, 
  variant = 'default', 
  hover = true,
  glow = false 
}: GamingCardProps) {
  const baseClasses = cn(
    'rounded-xl overflow-hidden transition-all duration-300',
    hover && 'hover:shadow-2xl hover:-translate-y-1',
    glow && 'shadow-lg',
    className
  )

  const variantClasses = {
    default: 'bg-card border border-border shadow-md',
    glass: 'glass shadow-xl',
    neon: 'gaming-card shadow-2xl border-gaming-primary/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(baseClasses, variantClasses[variant])}
      whileHover={hover ? { y: -4 } : {}}
    >
      {children}
    </motion.div>
  )
}

interface GamingCardHeaderProps {
  children: ReactNode
  className?: string
}

export function GamingCardHeader({ children, className }: GamingCardHeaderProps) {
  return (
    <div className={cn('p-6 pb-0', className)}>
      {children}
    </div>
  )
}

interface GamingCardContentProps {
  children: ReactNode
  className?: string
}

export function GamingCardContent({ children, className }: GamingCardContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

interface GamingCardFooterProps {
  children: ReactNode
  className?: string
}

export function GamingCardFooter({ children, className }: GamingCardFooterProps) {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  )
}
