
'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface XPCounterProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
  duration?: number
}

export function XPCounter({ 
  value, 
  className, 
  prefix = '', 
  suffix = ' XP',
  duration = 2 
}: XPCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, latest => Math.round(latest))

  useEffect(() => {
    const controls = animate(count, value, { duration })
    return controls.stop
  }, [count, value, duration])

  return (
    <motion.span 
      className={cn('font-mono font-bold text-gaming-primary', className)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}
