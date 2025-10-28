"use client"

import React from 'react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Paintbrush } from 'lucide-react'

const labels: Record<string, string> = {
  gaming: 'Gaming',
  galaxy: 'Galaxy',
  cyberpunk: 'Cyberpunk',
  grid: 'Grid',
  none: 'Aus'
}

export function BackgroundToggleButton() {
  const { backgroundTheme, toggleBackgroundTheme } = useTheme()
  return (
    <Button size="sm" variant="outline" onClick={toggleBackgroundTheme} className="ml-2">
      <Paintbrush className="w-4 h-4 mr-2" />
      Hintergrund: {labels[backgroundTheme] || 'Auto'}
    </Button>
  )
}

