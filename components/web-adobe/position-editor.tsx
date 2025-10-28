/**
 * Position Editor Component
 * Visual position editor with drag support and alignment tools
 */

'use client'

import { useState } from 'react'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Grid3x3,
  Minus,
  Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FieldPosition } from '@/types/web-adobe'
import { cn } from '@/lib/utils'

interface PositionEditorProps {
  position: FieldPosition
  onChange: (position: FieldPosition) => void
  snapToGrid?: boolean
  gridSize?: number
  className?: string
}

export function PositionEditor({
  position,
  onChange,
  snapToGrid = false,
  gridSize = 10,
  className,
}: PositionEditorProps) {
  const [isSnapEnabled, setIsSnapEnabled] = useState(snapToGrid)
  const [currentGridSize, setCurrentGridSize] = useState(gridSize)

  const handlePositionChange = (
    key: keyof FieldPosition,
    value: number
  ) => {
    let newValue = value

    // Apply snap to grid if enabled
    if (isSnapEnabled && (key === 'x' || key === 'y')) {
      newValue = Math.round(value / currentGridSize) * currentGridSize
    }

    onChange({
      ...position,
      [key]: newValue,
    })
  }

  const increment = (key: keyof FieldPosition, amount: number = 1) => {
    handlePositionChange(key, (position[key] ?? 0) + amount)
  }

  const decrement = (key: keyof FieldPosition, amount: number = 1) => {
    handlePositionChange(key, Math.max(0, (position[key] ?? 0) - amount))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mini Preview */}
      <div className="relative h-32 rounded-md border bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Seite {position.page}
        </div>

        {/* Grid pattern when snap is enabled */}
        {isSnapEnabled && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: `${currentGridSize}px ${currentGridSize}px`,
            }}
          />
        )}

        {/* Field representation */}
        <div
          className="absolute bg-primary/20 border-2 border-primary rounded-sm cursor-move"
          style={{
            left: `${(position.x / 600) * 100}%`,
            top: `${(position.y / 800) * 100}%`,
            width: `${(position.width / 600) * 100}%`,
            height: `${(position.height / 800) * 100}%`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Grid3x3 className="h-3 w-3 text-primary" />
          </div>
        </div>
      </div>

      {/* Position Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* X Position */}
        <div className="space-y-1.5">
          <Label htmlFor="pos-x" className="text-xs">
            X Position
          </Label>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => decrement('x', isSnapEnabled ? currentGridSize : 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="pos-x"
              type="number"
              value={position.x}
              onChange={(e) => handlePositionChange('x', Number(e.target.value))}
              className="h-8 text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => increment('x', isSnapEnabled ? currentGridSize : 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Y Position */}
        <div className="space-y-1.5">
          <Label htmlFor="pos-y" className="text-xs">
            Y Position
          </Label>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => decrement('y', isSnapEnabled ? currentGridSize : 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="pos-y"
              type="number"
              value={position.y}
              onChange={(e) => handlePositionChange('y', Number(e.target.value))}
              className="h-8 text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => increment('y', isSnapEnabled ? currentGridSize : 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Width */}
        <div className="space-y-1.5">
          <Label htmlFor="pos-width" className="text-xs">
            Breite
          </Label>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => decrement('width', 10)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="pos-width"
              type="number"
              value={position.width}
              onChange={(e) => handlePositionChange('width', Number(e.target.value))}
              className="h-8 text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => increment('width', 10)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Height */}
        <div className="space-y-1.5">
          <Label htmlFor="pos-height" className="text-xs">
            Höhe
          </Label>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => decrement('height', 10)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="pos-height"
              type="number"
              value={position.height}
              onChange={(e) => handlePositionChange('height', Number(e.target.value))}
              className="h-8 text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => increment('height', 10)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Snap to Grid */}
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="snap-grid" className="text-sm cursor-pointer">
            Raster einrasten
          </Label>
        </div>
        <Switch
          id="snap-grid"
          checked={isSnapEnabled}
          onCheckedChange={setIsSnapEnabled}
        />
      </div>

      {isSnapEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="grid-size" className="text-xs">
            Rastergröße
          </Label>
          <Input
            id="grid-size"
            type="number"
            value={currentGridSize}
            onChange={(e) => setCurrentGridSize(Number(e.target.value))}
            min={5}
            max={50}
            step={5}
            className="h-8 text-xs"
          />
        </div>
      )}

      {/* Alignment Tools */}
      <div className="space-y-2">
        <Label className="text-xs">Ausrichtung</Label>
        <TooltipProvider>
          <div className="grid grid-cols-3 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <AlignLeft className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Links ausrichten</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <AlignCenter className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zentrieren</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <AlignRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rechts ausrichten</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <AlignVerticalSpaceAround className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vertikal verteilen</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <AlignHorizontalSpaceAround className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Horizontal verteilen</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
