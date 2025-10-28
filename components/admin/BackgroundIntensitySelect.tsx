"use client"
import React from 'react'
import { useTheme, BackgroundIntensity } from '@/contexts/theme-context'

export function BackgroundIntensitySelect() {
  const { bgIntensity, setBgIntensity } = useTheme()
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Intensität:</span>
      <select
        className="border border-border bg-background text-foreground rounded px-2 py-1"
        value={bgIntensity}
        onChange={(e) => setBgIntensity(e.target.value as BackgroundIntensity)}
      >
        <option value="auto">Auto</option>
        <option value="low">Niedrig</option>
        <option value="standard">Standard</option>
        <option value="high">Hoch</option>
      </select>
    </div>
  )
}

