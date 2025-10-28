"use client"

import React from 'react'
import { ThemeProvider as BackgroundThemeProvider, useTheme } from '@/contexts/theme-context'
import { GalaxyBackground } from '@/components/ui/galaxy-background'
import { CyberpunkBackground } from '@/components/ui/cyberpunk-background'
import { GridBackground } from '@/components/ui/grid-background'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { MatrixBackground } from '@/components/ui/matrix-background'

function BackgroundLayer() {
  const { backgroundTheme, bgIntensity } = useTheme()
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const factor = bgIntensity === 'low' ? 0.6 : 
                 bgIntensity === 'high' ? 1.5 : 
                 bgIntensity === 'standard' ? 1.0 : 
                 reduceMotion ? 0.5 : 
                 (typeof window !== 'undefined' && window.innerWidth < 768) ? 0.7 : 1.0
  
  switch(backgroundTheme) {
    case 'galaxy':
      return <GalaxyBackground className="pointer-events-none -z-10" density={200} speed={1} intensity={factor} />
    case 'cyberpunk':
      return <CyberpunkBackground className="pointer-events-none -z-10" intensity={factor} />
    case 'aurora':
      return <AuroraBackground className="pointer-events-none -z-10" />
    case 'matrix':
      return <MatrixBackground className="pointer-events-none -z-10" intensity={factor} />
    case 'grid':
    case 'gaming':
      return <GridBackground className="pointer-events-none -z-10" />
    default:
      return null
  }
}

export function BackgroundShell({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundThemeProvider>
      <BackgroundLayer />
      {children}
    </BackgroundThemeProvider>
  )
}