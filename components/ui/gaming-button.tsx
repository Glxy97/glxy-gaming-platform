
'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface GamingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  className?: string
}

export function GamingButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  glow = false,
  className,
  disabled,
  ...props 
}: GamingButtonProps) {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-lg border-2 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed',
    'transform hover:scale-105 active:scale-95',
    glow && 'shadow-lg hover:shadow-2xl',
    className
  )

  const variantClasses = {
    primary: cn(
      'bg-gaming-primary border-gaming-primary text-white hover:bg-gaming-primary/90',
      'focus:ring-green-500',
      glow && 'glow-primary hover:glow-primary'
    ),
    secondary: cn(
      'bg-gaming-secondary border-gaming-secondary text-white hover:bg-gaming-secondary/90',
      'focus:ring-purple-500',
      glow && 'glow-secondary hover:glow-secondary'
    ),
    accent: cn(
      'bg-gaming-accent border-gaming-accent text-black hover:bg-gaming-accent/90',
      'focus:ring-yellow-500',
      glow && 'glow-accent hover:glow-accent'
    ),
    outline: cn(
      'bg-transparent border-gaming-primary text-gaming-primary hover:bg-gaming-primary hover:text-white',
      'focus:ring-green-500'
    ),
    ghost: cn(
      'bg-transparent border-transparent text-gaming-primary hover:bg-gaming-primary/10',
      'focus:ring-green-500'
    )
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
    xl: 'px-8 py-5 text-xl'
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size])}
      disabled={disabled}
      type={props.type || 'button'}
      onClick={props.onClick}
      onSubmit={props.onSubmit}
      form={props.form}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      {glow && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      )}
    </motion.button>
  )
}
