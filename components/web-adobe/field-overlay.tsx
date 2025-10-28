// @ts-nocheck
/**
 * Field Overlay Component
 * Interaktive PDF-Formularfeld-Overlays mit farbcodierten Feldtypen
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePdfViewerStore } from '@/lib/stores/pdf-viewer-store'
import { cn } from '@/lib/utils'
import {
  Type,
  CheckSquare,
  Circle,
  ChevronDown,
  PenTool,
  MousePointer2,
} from 'lucide-react'
import type { FormField, FormFieldType } from '@/types/pdf-viewer'

// ============================================================================
// Feldtyp-Farben (Farbcodierte Typen)
// ============================================================================

const FIELD_COLORS: Record<FormFieldType, string> = {
  text: 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30',
  checkbox: 'bg-green-500/20 border-green-500 hover:bg-green-500/30',
  radio: 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30',
  dropdown: 'bg-orange-500/20 border-orange-500 hover:bg-orange-500/30',
  signature: 'bg-pink-500/20 border-pink-500 hover:bg-pink-500/30',
  button: 'bg-gray-500/20 border-gray-500 hover:bg-gray-500/30',
}

// ============================================================================
// Feldtyp-Icons
// ============================================================================

const FIELD_ICONS: Record<FormFieldType, React.ElementType> = {
  text: Type,
  checkbox: CheckSquare,
  radio: Circle,
  dropdown: ChevronDown,
  signature: PenTool,
  button: MousePointer2,
}

// ============================================================================
// Feldtyp-Labels (Deutsch)
// ============================================================================

const FIELD_LABELS: Record<FormFieldType, string> = {
  text: 'Textfeld',
  checkbox: 'Kontrollkästchen',
  radio: 'Optionsfeld',
  dropdown: 'Auswahlfeld',
  signature: 'Unterschrift',
  button: 'Schaltfläche',
}

// ============================================================================
// Single Field Overlay
// ============================================================================

interface SingleFieldOverlayProps {
  field: FormField
  scale: number
  rotation: number
  isSelected: boolean
  isHovered: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onResizeStart: (e: React.MouseEvent, handle: string) => void
}

function SingleFieldOverlay({
  field,
  scale,
  rotation,
  isSelected,
  isHovered,
  onClick,
  onDoubleClick,
  onContextMenu,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onResizeStart,
}: SingleFieldOverlayProps) {
  const Icon = FIELD_ICONS[field.type]

  const style = React.useMemo(() => {
    return {
      left: `${field.rect.x * scale}px`,
      top: `${field.rect.y * scale}px`,
      width: `${field.rect.width * scale}px`,
      height: `${field.rect.height * scale}px`,
      transform: `rotate(${rotation}deg)`,
    }
  }, [field.rect, scale, rotation])

  return (
    <div
      className={cn(
        'absolute border-2 transition-all duration-200 cursor-move group',
        FIELD_COLORS[field.type],
        isSelected && 'ring-2 ring-blue-600 ring-offset-2 z-10',
        isHovered && 'shadow-lg scale-[1.02]',
        field.required && 'border-dashed'
      )}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`${FIELD_LABELS[field.type]}: ${field.displayName}${
        field.required ? ' (Pflichtfeld)' : ''
      }`}
    >
      {/* Field Icon und Label (Hover-Tooltip) */}
      <div
        className={cn(
          'absolute -top-7 left-0 px-2 py-1 rounded text-xs font-medium',
          'bg-white/95 backdrop-blur border shadow-sm',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'flex items-center gap-1.5 whitespace-nowrap pointer-events-none'
        )}
      >
        <Icon className="h-3 w-3" />
        <span>{field.displayName}</span>
        {field.required && (
          <span className="text-red-500 font-bold">*</span>
        )}
      </div>

      {/* Value Preview (für Text-Felder) */}
      {field.type === 'text' && field.value && (
        <div
          className="absolute inset-0 px-2 py-1 text-xs text-foreground/70 truncate pointer-events-none"
          style={{ fontSize: `${Math.max(10, (field.metadata?.fontSize || 12) * scale)}px` }}
        >
          {field.value}
        </div>
      )}

      {/* Checkbox State */}
      {field.type === 'checkbox' && field.value && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <CheckSquare className="h-full w-full p-1 text-green-600" />
        </div>
      )}

      {/* Pflichtfeld-Indikator */}
      {field.required && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white shadow-sm" />
      )}

      {/* Auswahl-Handles (wenn selektiert) */}
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nw-resize shadow-sm hover:scale-110 transition-transform"
            onMouseDown={(e) => {
              e.stopPropagation()
              onResizeStart(e, 'nw')
            }}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-ne-resize shadow-sm hover:scale-110 transition-transform"
            onMouseDown={(e) => {
              e.stopPropagation()
              onResizeStart(e, 'ne')
            }}
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-sw-resize shadow-sm hover:scale-110 transition-transform"
            onMouseDown={(e) => {
              e.stopPropagation()
              onResizeStart(e, 'sw')
            }}
          />
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-sm hover:scale-110 transition-transform"
            onMouseDown={(e) => {
              e.stopPropagation()
              onResizeStart(e, 'se')
            }}
          />
        </>
      )}
    </div>
  )
}

// ============================================================================
// Field Overlay Container
// ============================================================================

interface FieldOverlayProps {
  pageNumber: number
  scale: number
}

export function FieldOverlay({ pageNumber, scale }: FieldOverlayProps) {
  const {
    document: doc,
    showFieldOverlay,
    selectedFieldIds,
    rotation,
    selectField,
    deselectAllFields,
    openContextMenu,
    updateField,
  } = usePdfViewerStore()

  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)

  const dragStartPos = useRef({ x: 0, y: 0 })
  const fieldStartState = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  // Felder für aktuelle Seite filtern
  const pageFields = React.useMemo(() => {
    if (!doc) return []
    return doc.fields.filter((f) => f.page === pageNumber)
  }, [doc, pageNumber])

  // Mouse Move Handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedFieldId) return

      const deltaX = (e.clientX - dragStartPos.current.x) / scale
      const deltaY = (e.clientY - dragStartPos.current.y) / scale

      if (isDragging) {
        // Feld verschieben
        updateField(draggedFieldId, {
          rect: {
            x: fieldStartState.current.x + deltaX,
            y: fieldStartState.current.y + deltaY,
            width: fieldStartState.current.width,
            height: fieldStartState.current.height,
          },
        })
      } else if (isResizing && resizeHandle) {
        // Feld resizen
        const minSize = 20
        let newRect = { ...fieldStartState.current }

        switch (resizeHandle) {
          case 'se':
            newRect.width = Math.max(minSize, fieldStartState.current.width + deltaX)
            newRect.height = Math.max(minSize, fieldStartState.current.height + deltaY)
            break
          case 'sw':
            const newWidthSW = Math.max(minSize, fieldStartState.current.width - deltaX)
            newRect.x = fieldStartState.current.x + (fieldStartState.current.width - newWidthSW)
            newRect.width = newWidthSW
            newRect.height = Math.max(minSize, fieldStartState.current.height + deltaY)
            break
          case 'ne':
            newRect.width = Math.max(minSize, fieldStartState.current.width + deltaX)
            const newHeightNE = Math.max(minSize, fieldStartState.current.height - deltaY)
            newRect.y = fieldStartState.current.y + (fieldStartState.current.height - newHeightNE)
            newRect.height = newHeightNE
            break
          case 'nw':
            const newWidthNW = Math.max(minSize, fieldStartState.current.width - deltaX)
            const newHeightNW = Math.max(minSize, fieldStartState.current.height - deltaY)
            newRect.x = fieldStartState.current.x + (fieldStartState.current.width - newWidthNW)
            newRect.y = fieldStartState.current.y + (fieldStartState.current.height - newHeightNW)
            newRect.width = newWidthNW
            newRect.height = newHeightNW
            break
        }

        updateField(draggedFieldId, { rect: newRect })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
      setDraggedFieldId(null)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, draggedFieldId, resizeHandle, scale, updateField])

  // Click auf Hintergrund -> Deselektieren
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      deselectAllFields()
    }
  }

  if (!showFieldOverlay || pageFields.length === 0) {
    return null
  }

  return (
    <div
      className="absolute inset-0 pointer-events-auto z-10"
      onClick={handleBackgroundClick}
    >
      {pageFields.map((field) => {
        const isSelected = selectedFieldIds.includes(field.id)
        const isHovered = hoveredFieldId === field.id

        const handleFieldClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          selectField(field.id, e.ctrlKey || e.metaKey)
        }

        const handleFieldDoubleClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          // TODO: Feld-Editor öffnen
          console.log('Double-click:', field.displayName)
        }

        const handleFieldContextMenu = (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          selectField(field.id, false)
          openContextMenu(e.clientX, e.clientY, field.id)
        }

        const handleFieldMouseDown = (e: React.MouseEvent) => {
          e.stopPropagation()
          setIsDragging(true)
          setDraggedFieldId(field.id)
          dragStartPos.current = { x: e.clientX, y: e.clientY }
          fieldStartState.current = { ...field.rect }
        }

        const handleResizeStart = (e: React.MouseEvent, handle: string) => {
          e.stopPropagation()
          setIsResizing(true)
          setResizeHandle(handle)
          setDraggedFieldId(field.id)
          dragStartPos.current = { x: e.clientX, y: e.clientY }
          fieldStartState.current = { ...field.rect }
        }

        return (
          <SingleFieldOverlay
            key={field.id}
            field={field}
            scale={scale}
            rotation={rotation}
            isSelected={isSelected}
            isHovered={isHovered}
            onClick={handleFieldClick}
            onDoubleClick={handleFieldDoubleClick}
            onContextMenu={handleFieldContextMenu}
            onMouseDown={handleFieldMouseDown}
            onMouseEnter={() => setHoveredFieldId(field.id)}
            onMouseLeave={() => setHoveredFieldId(null)}
            onResizeStart={handleResizeStart}
          />
        )
      })}
    </div>
  )
}
