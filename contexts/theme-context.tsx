'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type BackgroundTheme = 'gaming' | 'galaxy' | 'cyberpunk' | 'grid' | 'aurora' | 'matrix' | 'none'
export type BackgroundIntensity = 'auto' | 'low' | 'standard' | 'high'

interface ThemeContextType {
  backgroundTheme: BackgroundTheme
  setBackgroundTheme: (theme: BackgroundTheme) => void
  toggleBackgroundTheme: () => void
  bgIntensity: BackgroundIntensity
  setBgIntensity: (v: BackgroundIntensity) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>('gaming')
  const [bgIntensity, setBgIntensity] = useState<BackgroundIntensity>('auto')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('glxy-background-theme') as BackgroundTheme
    const allowed: BackgroundTheme[] = ['gaming','galaxy','cyberpunk','grid','aurora','matrix','none']
    if (savedTheme && allowed.includes(savedTheme)) {
      setBackgroundTheme(savedTheme)
    }
    const savedIntensity = localStorage.getItem('glxy-background-intensity') as BackgroundIntensity
    const allowedI: BackgroundIntensity[] = ['auto','low','standard','high']
    if (savedIntensity && allowedI.includes(savedIntensity)) {
      setBgIntensity(savedIntensity)
    }
  }, [])

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('glxy-background-theme', backgroundTheme)
  }, [backgroundTheme])

  useEffect(() => {
    localStorage.setItem('glxy-background-intensity', bgIntensity)
  }, [bgIntensity])

  const toggleBackgroundTheme = () => {
    // Cycle through a set of backgrounds
    const order: BackgroundTheme[] = ['gaming','galaxy','cyberpunk','aurora','matrix','grid','none']
    setBackgroundTheme(prev => {
      const idx = order.indexOf(prev)
      const next = order[(idx + 1) % order.length]
      return next! // Non-null assertion: modulo guarantees valid index
    })
  }

  return (
    <ThemeContext.Provider value={{
      backgroundTheme,
      setBackgroundTheme,
      toggleBackgroundTheme,
      bgIntensity,
      setBgIntensity
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
