"use client"
import { motion } from 'framer-motion'

export function MatrixBackground({ className = '', intensity = 1 }: { className?: string, intensity?: number }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const columns = Math.floor((reduceMotion ? 15 : 30) * intensity)
  const items = Array.from({ length: columns })
  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`} aria-hidden>
      {items.map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 w-px opacity-40"
          style={{
            left: `${(i + 1) * (100 / (columns + 1))}%`,
            height: '120%',
            background: 'linear-gradient(180deg, transparent, hsl(var(--primary)), transparent)'
          }}
          animate={reduceMotion ? undefined : { y: ['-20%', '0%'] }}
          transition={{ duration: 5 + (i % 10), repeat: Infinity, ease: 'linear', delay: (i % 10) * 0.2 }}
        />)
      )}
    </div>
  )
}
