/**
 * Viewer Controls Component
 * Toolbar mit Navigation, Zoom, Rotation und Overlay-Steuerung (Deutsch)
 */

'use client'

import React from 'react'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Grid,
  Columns,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePdfViewerStore } from '@/lib/stores/pdf-viewer-store'
import { cn } from '@/lib/utils'

export function ViewerControls() {
  const {
    currentPage,
    document: doc,
    zoom,
    zoomMode,
    rotation,
    viewMode,
    showFieldOverlay,
    setPage,
    nextPage,
    previousPage,
    setZoom,
    setZoomMode,
    rotateClockwise,
    setViewMode,
    toggleOverlay,
  } = usePdfViewerStore()

  const [pageInput, setPageInput] = React.useState(currentPage.toString())
  const totalPages = doc?.totalPages || 1

  // Zoom-Presets (Deutsche Labels)
  const zoomPresets = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1.0 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2.0 },
    { label: 'Breite', value: 'fit-width' },
    { label: 'Seite', value: 'fit-page' },
  ]

  // Seiten-Input synchronisieren
  React.useEffect(() => {
    setPageInput(currentPage.toString())
  }, [currentPage])

  // Seiten-Navigation Handler
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setPage(page)
    } else {
      setPageInput(currentPage.toString())
    }
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputBlur()
    }
  }

  // Zoom Handler
  const handleZoomChange = (value: string) => {
    if (value === 'fit-width') {
      setZoomMode('fit-width')
    } else if (value === 'fit-page') {
      setZoomMode('fit-page')
    } else {
      const zoomValue = parseFloat(value)
      setZoom(zoomValue)
    }
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 5.0))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.1))
  }

  // Aktuelles Zoom-Label
  const getCurrentZoomLabel = () => {
    if (zoomMode === 'fit-width') return 'Breite'
    if (zoomMode === 'fit-page') return 'Seite'
    return `${Math.round(zoom * 100)}%`
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-3 py-2 bg-background border-b shadow-sm">
        {/* ===== Seiten-Navigation ===== */}
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={previousPage}
                disabled={currentPage <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vorherige Seite (←)</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1.5 text-sm">
            <Input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="w-14 h-8 text-center px-2"
            />
            <span className="text-muted-foreground font-medium">
              von {totalPages}
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextPage}
                disabled={currentPage >= totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nächste Seite (→)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* ===== Zoom-Steuerung ===== */}
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Verkleinern (Strg + -)</TooltipContent>
          </Tooltip>

          <Select
            value={zoomMode === 'custom' ? zoom.toString() : zoomMode}
            onValueChange={handleZoomChange}
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue>{getCurrentZoomLabel()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {zoomPresets.map((preset) => (
                <SelectItem
                  key={preset.label}
                  value={preset.value.toString()}
                  className="text-sm"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vergrößern (Strg + +)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* ===== Ansichtsmodus ===== */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'single' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('single')}
                className="h-8 w-8"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Einzelseite</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'continuous' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('continuous')}
                className="h-8 w-8"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fortlaufend</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'two-page' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('two-page')}
                className="h-8 w-8"
              >
                <Columns className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zwei Seiten</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* ===== Rotation ===== */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={rotateClockwise}
              className="h-8 w-8"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Drehen (Strg + R)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* ===== Feld-Overlay Toggle ===== */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showFieldOverlay ? 'secondary' : 'ghost'}
              size="icon"
              onClick={toggleOverlay}
              className="h-8 w-8"
            >
              {showFieldOverlay ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showFieldOverlay
              ? 'Formularfelder ausblenden'
              : 'Formularfelder anzeigen'}{' '}
            (Strg + O)
          </TooltipContent>
        </Tooltip>

        {/* ===== Spacer ===== */}
        <div className="flex-1" />

        {/* ===== Dokument-Info ===== */}
        {doc && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Rotation: {rotation}°</span>
            <span>|</span>
            <span>
              {doc.fields.length} Formularfeld{doc.fields.length !== 1 ? 'er' : ''}
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
