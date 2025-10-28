'use client'

import { motion } from 'framer-motion'
import { Palette, Stars, Grid3X3, Sparkles } from 'lucide-react'
import { useTheme, BackgroundTheme } from '@/contexts/theme-context'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'

export function ThemeSwitch() {
  const { backgroundTheme, setBackgroundTheme, toggleBackgroundTheme } = useTheme()
  const options: { key: BackgroundTheme; label: string; icon: React.ReactNode }[] = [
    { key: 'gaming', label: 'Gaming Grid', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'grid', label: 'Grid', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'galaxy', label: 'Galaxy', icon: <Stars className="w-4 h-4" /> },
    { key: 'aurora', label: 'Aurora', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'cyberpunk', label: 'Cyberpunk', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'matrix', label: 'Matrix', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'none', label: 'Aus', icon: <Palette className="w-4 h-4" /> },
  ]

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <DropdownMenu.Root>
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
            <span className="hidden sm:inline">Hintergrund</span>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white/20"
              style={{ background: 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
              animate={{ boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 8px rgba(255,255,255,0.3)', '0 0 0 rgba(255,255,255,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="bg-card text-foreground border border-border rounded shadow p-1 min-w-[180px]">
            {options.map(opt => (
              <DropdownMenu.Item key={opt.key} className="px-2 py-1 text-sm rounded hover:bg-gray-50 flex items-center gap-2" onSelect={() => setBackgroundTheme(opt.key)}>
                {opt.icon}
                <span>{opt.label}</span>
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="h-px bg-border my-1" />
            <DropdownMenu.Item className="px-2 py-1 text-sm rounded hover:bg-gray-50" onSelect={() => toggleBackgroundTheme()}>Weiter schalten</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </motion.div>
  )
}
