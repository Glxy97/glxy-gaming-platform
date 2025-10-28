"use client"
import React, { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/theme-context'

export function CyberpunkBackground({ className = '', intensity = 1 }: { className?: string, intensity?: number }) {
  const { bgIntensity } = useTheme()
  const [mounted, setMounted] = useState(false)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // Calculate actual intensity based on user preference
  const actualIntensity = bgIntensity === 'low' ? 0.6 : 
                         bgIntensity === 'high' ? 1.5 : 
                         bgIntensity === 'standard' ? 1.0 : 
                         reduceMotion ? 0.5 : 
                         (typeof window !== 'undefined' && window.innerWidth < 768) ? 0.7 : 1.0
  
  const lineCount = Math.floor((reduceMotion ? 8 : 12) * actualIntensity)
  const particles = Array.from({ length: Math.min(40, Math.floor(80 * actualIntensity)) })
  const shootingStars = Array.from({ length: Math.min(3, Math.floor(5 * actualIntensity)) })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Neon gradient wash using tokens */}
      <div
        className="absolute inset-0 opacity-30 cyberpunk-bg-animation"
        style={{
          background:
            'radial-gradient(60% 60% at 20% 20%, hsl(var(--primary)/0.35) 0%, transparent 70%),\
             radial-gradient(50% 50% at 80% 30%, hsl(var(--secondary)/0.35) 0%, transparent 70%),\
             radial-gradient(40% 40% at 50% 80%, hsl(var(--accent)/0.25) 0%, transparent 70%)'
        }}
      />
      
      {/* Diagonal neon lines */}
      {Array.from({ length: lineCount }).map((_, i) => (
        <div
          key={i}
          className="absolute h-px cyberpunk-line-animation"
          style={{
            top: `${(i * 8) + 5}%`,
            left: '-20%',
            right: '-20%',
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary)/0.5), transparent)',
            animationDuration: `${(30 + i) / actualIntensity}s`,
            animationDelay: `${i % 10 * 0.2}s`
          }}
        />
      ))}
      
      {/* Glow corners */}
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full" style={{ boxShadow: '0 0 120px 40px hsl(var(--primary)/0.25)' }} />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full" style={{ boxShadow: '0 0 120px 40px hsl(var(--secondary)/0.25)' }} />
      
      {/* Floating particles */}
      {particles.map((_, i) => (
        <div
          key={`cyberpunk-particle-${i}`}
          className="absolute rounded-full opacity-40 cyberpunk-particle-animation"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            background: i % 5 === 0 ? 
              `radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, transparent 70%)` :
              i % 3 === 0 ?
              `radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)` :
              `radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)`,
            animationDuration: `${(Math.random() * 10 + 5) / actualIntensity}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
      
      {/* Shooting stars */}
      {shootingStars.map((_, i) => (
        <div
          key={`cyberpunk-shooting-star-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-60 cyberpunk-shooting-star-animation"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 100 + 50}px`,
            transform: 'rotate(-30deg)',
            animationDuration: `${(Math.random() * 3 + 1) / actualIntensity}s`,
            animationDelay: `${Math.random() * 10 + 5}s`
          }}
        />
      ))}
    </div>
  )
}
