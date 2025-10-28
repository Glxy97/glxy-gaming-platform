
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LevelDisplayProps {
  level: number
  xp: number
  maxXp?: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  className?: string
}

export function LevelDisplay({ 
  level, 
  xp, 
  maxXp = 1000, 
  size = 'md', 
  showProgress = true,
  className 
}: LevelDisplayProps) {
  // Calculate XP needed for current level
  const currentLevelXP = (level - 1) * 1000
  const nextLevelXP = level * 1000
  const progressXP = xp - currentLevelXP
  const levelMaxXP = nextLevelXP - currentLevelXP
  const progress = Math.min((progressXP / levelMaxXP) * 100, 100)

  const sizeClasses = {
    sm: {
      container: 'w-16 h-16',
      text: 'text-lg',
      progress: 'stroke-[6]'
    },
    md: {
      container: 'w-20 h-20',
      text: 'text-xl',
      progress: 'stroke-[4]'
    },
    lg: {
      container: 'w-24 h-24',
      text: 'text-2xl',
      progress: 'stroke-[3]'
    }
  }

  const size_config = sizeClasses[size]
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', size_config.container, className)}>
      {showProgress && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/20"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="url(#levelGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
          />
          <defs>
            <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className="text-gaming-primary" stopColor="currentColor" />
              <stop offset="100%" className="text-gaming-secondary" stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
      )}
      
      {/* Level number */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <span className={cn('font-bold font-orbitron gradient-text', size_config.text)}>
          {level}
        </span>
        {showProgress && size !== 'sm' && (
          <span className="text-xs text-muted-foreground mt-1">
            LVL
          </span>
        )}
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gaming-primary/5 blur-lg animate-pulse" />
    </div>
  )
}
