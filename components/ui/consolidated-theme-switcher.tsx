"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Palette, Stars, Grid3X3, Sparkles, Zap, X } from 'lucide-react'
import { useTheme, BackgroundTheme } from '@/contexts/theme-context'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'

const labels: Record<BackgroundTheme, string> = {
  gaming: 'Gaming Grid',
  galaxy: 'Galaxy',
  cyberpunk: 'Cyberpunk',
  grid: 'Grid',
  aurora: 'Aurora',
  matrix: 'Matrix',
  none: 'Kein Hintergrund'
}

export function ConsolidatedThemeSwitcher() {
  const { backgroundTheme, setBackgroundTheme, toggleBackgroundTheme, bgIntensity, setBgIntensity } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  
  const options: { key: BackgroundTheme; label: string; icon: React.ReactNode }[] = [
    { key: 'gaming', label: 'Gaming Grid', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'galaxy', label: 'Galaxy', icon: <Stars className="w-4 h-4" /> },
    { key: 'cyberpunk', label: 'Cyberpunk', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'aurora', label: 'Aurora', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'matrix', label: 'Matrix', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'grid', label: 'Grid', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'none', label: 'Aus', icon: <X className="w-4 h-4" /> },
  ]

  const intensityOptions = [
    { key: 'auto', label: 'Auto' },
    { key: 'low', label: 'Niedrig' },
    { key: 'standard', label: 'Standard' },
    { key: 'high', label: 'Hoch' }
  ]

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2 bg-background/50 backdrop-blur-sm border-gaming-primary/30 hover:bg-gaming-primary/10"
          >
            <motion.div
              animate={{ rotate: backgroundTheme === 'galaxy' ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              {backgroundTheme === 'galaxy' ? <Stars className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
            </motion.div>
            <span className="hidden sm:inline">Design</span>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white/20"
              style={{ 
                background: 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)))' 
              }}
              animate={{
                boxShadow: [
                  '0 0 0 rgba(255,255,255,0)',
                  '0 0 8px rgba(255,255,255,0.3)',
                  '0 0 0 rgba(255,255,255,0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </Button>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="bg-card text-foreground border border-border rounded shadow p-1 min-w-[200px] z-50"
            sideOffset={5}
          >
            {/* Theme Options */}
            <DropdownMenu.Label className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hintergrunddesign
            </DropdownMenu.Label>
            
            {options.map((opt) => (
              <DropdownMenu.Item 
                key={opt.key} 
                className={`px-2 py-1.5 text-sm rounded hover:bg-gray-50 flex items-center gap-2 cursor-pointer ${
                  backgroundTheme === opt.key ? 'bg-primary/10' : ''
                }`}
                onSelect={() => {
                  setBackgroundTheme(opt.key)
                  setIsOpen(false)
                }}
              >
                <span className={`${backgroundTheme === opt.key ? 'text-primary' : 'text-muted-foreground'}`}>
                  {opt.icon}
                </span>
                <span>{opt.label}</span>
                {backgroundTheme === opt.key && (
                  <span className="ml-auto text-primary">
                    <Zap className="w-3 h-3" />
                  </span>
                )}
              </DropdownMenu.Item>
            ))}
            
            <DropdownMenu.Separator className="h-px bg-border my-1" />
            
            {/* Intensity Options */}
            <DropdownMenu.Label className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Detailgrad
            </DropdownMenu.Label>
            
            {intensityOptions.map((opt) => (
              <DropdownMenu.Item 
                key={opt.key} 
                className={`px-2 py-1.5 text-sm rounded hover:bg-gray-50 flex items-center gap-2 cursor-pointer ${
                  bgIntensity === opt.key ? 'bg-primary/10' : ''
                }`}
                onSelect={() => {
                  setBgIntensity(opt.key as any)
                  setIsOpen(false)
                }}
              >
                <span>{opt.label}</span>
                {bgIntensity === opt.key && (
                  <span className="ml-auto text-primary">
                    <Zap className="w-3 h-3" />
                  </span>
                )}
              </DropdownMenu.Item>
            ))}
            
            <DropdownMenu.Separator className="h-px bg-border my-1" />
            
            {/* Quick Actions */}
            <DropdownMenu.Item 
              className="px-2 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
              onSelect={() => {
                toggleBackgroundTheme()
                setIsOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span>Weiter schalten</span>
              </div>
            </DropdownMenu.Item>
            
            <DropdownMenu.Item 
              className="px-2 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
              onSelect={() => {
                setBackgroundTheme('none')
                setIsOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-muted-foreground" />
                <span>Kein Hintergrund</span>
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </motion.div>
  )
}