"use client"
import { motion } from 'framer-motion'

export function AuroraBackground({ className = '' }: { className?: string }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Soft aurora ribbons using brand tokens */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[120%] h-[40%] -left-10 rounded-full blur-3xl opacity-30"
          style={{
            top: `${10 + i * 25}%`,
            background:
              i === 0
                ? 'linear-gradient(90deg, hsl(var(--primary)/0.35), hsl(var(--secondary)/0.35))'
                : i === 1
                ? 'linear-gradient(90deg, hsl(var(--secondary)/0.35), hsl(var(--accent)/0.35))'
                : 'linear-gradient(90deg, hsl(var(--accent)/0.3), hsl(var(--primary)/0.3))',
            transform: 'rotate(-8deg)'
          }}
          animate={reduceMotion ? undefined : { x: [-30, 30, -30], opacity: [0.25, 0.35, 0.25] }}
          transition={{ duration: 24 + i * 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

