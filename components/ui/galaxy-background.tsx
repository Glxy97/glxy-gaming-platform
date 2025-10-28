'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/theme-context'

interface Star {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  color: string
}

interface GalaxyBackgroundProps {
  density?: number
  speed?: number
  className?: string
  intensity?: number
}

export function GalaxyBackground({ 
  density = 200, 
  speed = 1,
  className = "",
  intensity = 1
}: GalaxyBackgroundProps) {
  const [stars, setStars] = useState<Star[]>([])
  const [mounted, setMounted] = useState(false)
  const { bgIntensity } = useTheme()
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // Calculate actual intensity based on user preference
  const actualIntensity = bgIntensity === 'low' ? 0.6 : 
                         bgIntensity === 'high' ? 1.5 : 
                         bgIntensity === 'standard' ? 1.0 : 
                         reduceMotion ? 0.5 : 
                         (typeof window !== 'undefined' && window.innerWidth < 768) ? 0.7 : 1.0

  useEffect(() => {
    setMounted(true)
    
    const generateStars = () => {
      const colors = [
        'hsl(var(--foreground))',
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--accent))'
      ]

      const starCount = Math.floor((reduceMotion ? density * 0.35 : density) * actualIntensity)
      const newStars: Star[] = Array.from({ length: starCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        speed: (Math.random() * 2 + 0.5) * (reduceMotion ? 0.3 : 1) * actualIntensity,
        opacity: Math.random() * 0.8 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)] || 'hsl(var(--foreground))'
      }))

      setStars(newStars)
    }

    generateStars()
  }, [density, actualIntensity, bgIntensity])

  if (!mounted) return null

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>
      {/* Schwarzer Galaxie-Hintergrund */}
      <div className="absolute inset-0 bg-black">
        {/* Galaxie-Nebel-Effekte */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-30 galaxy-bg-animation"
            style={{
              background: `
                radial-gradient(ellipse at 20% 30%, hsl(var(--primary)/0.35) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 60%, hsl(var(--secondary)/0.30) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, hsl(var(--accent)/0.25) 0%, transparent 60%),
                radial-gradient(ellipse at 90% 20%, hsl(var(--primary)/0.30) 0%, transparent 40%)
              `
            }}
          />
        </div>

        {/* Animierte Sterne */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full star-animation"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
              animationDuration: `${star.speed * 3}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}

        {/* Schwebende Galaxie-Partikel */}
        {Array.from({ length: Math.min(40, Math.floor(80 * actualIntensity)) }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full opacity-40 particle-animation"
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
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}

        {/* Shooting Stars */}
        {Array.from({ length: Math.min(3, Math.floor(5 * actualIntensity)) }).map((_, i) => (
          <div
            key={`shooting-star-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-60 shooting-star-animation"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              transform: 'rotate(-30deg)',
              animationDuration: `${Math.random() * 3 + 1}s`,
              animationDelay: `${Math.random() * 10 + 5}s`
            }}
          />
        ))}

        {/* Milchstraßen-Effekt */}
        <div
          className="absolute inset-0 opacity-20 milkyway-animation"
          style={{
            background: `
              linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, rgba(147, 51, 234, 0.1) 50%, transparent 60%)
            `
          }}
        />

        {/* Planetare Ringe */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 border border-white/10 rounded-full ring-animation" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 border border-purple-400/20 rounded-full ring-animation-reverse" />

        {/* Pulsende Galaxie-Zentren */}
        {Array.from({ length: Math.min(2, Math.floor(3 * actualIntensity)) }).map((_, i) => (
          <div
            key={`galaxy-center-${i}`}
            className="absolute rounded-full galaxy-center-animation"
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
              width: `${100 + Math.random() * 50}px`,
              height: `${100 + Math.random() * 50}px`,
              background: `radial-gradient(circle, rgba(${i === 0 ? '147, 51, 234' : i === 1 ? '59, 130, 246' : '6, 182, 212'}, 0.3) 0%, transparent 70%)`,
              animationDuration: `${8 + i * 2}s`,
              animationDelay: `${i * 1.5}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}
