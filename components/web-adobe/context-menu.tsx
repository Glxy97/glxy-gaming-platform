// @ts-nocheck
/**
 * Context Menu Component
 * Rechtsklick-Kontextmenü für Formularfeld-Operationen (Deutsch)
 */

'use client'

import React, { useEffect, useRef } from 'react'
import {
  Edit,
  Trash2,
  Copy,
  Clipboard,
  Settings,
  Move,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
} from 'lucide-react'
import { usePdfViewerStore } from '@/lib/stores/pdf-viewer-store'
import { cn } from '@/lib/utils'

// ============================================================================
// Menüeintrags-Interface
// ============================================================================

interface MenuItem {
  action: string
  label: string
  icon: React.ElementType
  shortcut?: string
  disabled?: boolean
  dividerAfter?: boolean
  onClick: () => void
}

// ============================================================================
// Context Menu Component
// ============================================================================

export function ContextMenu() {
  const {
    contextMenu,
    closeContextMenu,
    getFieldById,
    updateFieldValue,
    deleteField,
    duplicateField,
    selectedFieldIds,
  } = usePdfViewerStore()

  const menuRef = useRef<HTMLDivElement>(null)

  // Menüeinträge basierend auf selektiertem Feld
  const menuItems = React.useMemo((): MenuItem[] => {
    if (!contextMenu.fieldId) return []

    const field = getFieldById(contextMenu.fieldId)
    if (!field) return []

    return [
      {
        action: 'edit',
        label: 'Bearbeiten',
        icon: Edit,
        shortcut: 'Enter',
        onClick: () => {
          // TODO: Feld-Editor öffnen
          console.log('Bearbeiten:', field.displayName)
        },
      },
      {
        action: 'duplicate',
        label: 'Duplizieren',
        icon: Copy,
        shortcut: 'Strg+D',
        onClick: () => {
          duplicateField(field.id)
        },
        dividerAfter: true,
      },
      {
        action: 'copy',
        label: 'Kopieren',
        icon: Copy,
        shortcut: 'Strg+C',
        onClick: () => {
          // TODO: Feld in Zwischenablage
          console.log('Kopieren:', field.displayName)
        },
      },
      {
        action: 'paste',
        label: 'Einfügen',
        icon: Clipboard,
        shortcut: 'Strg+V',
        disabled: true, // TODO: Wenn Zwischenablage leer
        onClick: () => {
          // TODO: Feld aus Zwischenablage einfügen
          console.log('Einfügen')
        },
        dividerAfter: true,
      },
      {
        action: 'align-left',
        label: 'Links ausrichten',
        icon: AlignLeft,
        disabled: selectedFieldIds.length < 2,
        onClick: () => {
          // TODO: Mehrfachauswahl links ausrichten
          console.log('Links ausrichten')
        },
      },
      {
        action: 'align-center',
        label: 'Zentrieren',
        icon: AlignCenter,
        disabled: selectedFieldIds.length < 2,
        onClick: () => {
          // TODO: Mehrfachauswahl zentrieren
          console.log('Zentrieren')
        },
      },
      {
        action: 'align-right',
        label: 'Rechts ausrichten',
        icon: AlignRight,
        disabled: selectedFieldIds.length < 2,
        onClick: () => {
          // TODO: Mehrfachauswahl rechts ausrichten
          console.log('Rechts ausrichten')
        },
        dividerAfter: true,
      },
      {
        action: 'bring-to-front',
        label: 'In den Vordergrund',
        icon: ArrowUp,
        onClick: () => {
          // TODO: Z-Index erhöhen
          console.log('In den Vordergrund:', field.displayName)
        },
      },
      {
        action: 'send-to-back',
        label: 'In den Hintergrund',
        icon: ArrowDown,
        onClick: () => {
          // TODO: Z-Index verringern
          console.log('In den Hintergrund:', field.displayName)
        },
        dividerAfter: true,
      },
      {
        action: 'properties',
        label: 'Eigenschaften',
        icon: Settings,
        shortcut: 'Alt+Enter',
        onClick: () => {
          // TODO: Eigenschaften-Dialog öffnen
          console.log('Eigenschaften:', field.displayName)
        },
        dividerAfter: true,
      },
      {
        action: 'delete',
        label: 'Löschen',
        icon: Trash2,
        shortcut: 'Entf',
        onClick: () => {
          deleteField(field.id)
        },
      },
    ]
  }, [
    contextMenu.fieldId,
    getFieldById,
    duplicateField,
    deleteField,
    selectedFieldIds.length,
  ])

  // Menü-Position anpassen wenn außerhalb des Viewports
  useEffect(() => {
    if (!contextMenu.visible || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const margin = 8

    // Rechts außerhalb?
    if (rect.right > window.innerWidth - margin) {
      menu.style.left = `${contextMenu.x - rect.width}px`
    } else {
      menu.style.left = `${contextMenu.x}px`
    }

    // Unten außerhalb?
    if (rect.bottom > window.innerHeight - margin) {
      menu.style.top = `${contextMenu.y - rect.height}px`
    } else {
      menu.style.top = `${contextMenu.y}px`
    }
  }, [contextMenu.visible, contextMenu.x, contextMenu.y])

  // Click außerhalb oder ESC schließen
  useEffect(() => {
    if (!contextMenu.visible) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu()
      }
    }

    // Verzögerung damit der initiale Rechtsklick nicht sofort schließt
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu.visible, closeContextMenu])

  if (!contextMenu.visible) return null

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[220px] rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-xl',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1'
      )}
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      {menuItems.map((item, index) => (
        <React.Fragment key={item.action}>
          <button
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                closeContextMenu()
              }
            }}
            disabled={item.disabled}
            className={cn(
              'relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none',
              'transition-colors duration-150',
              !item.disabled &&
                'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              item.disabled && 'pointer-events-none opacity-40 cursor-not-allowed',
              item.action === 'delete' && !item.disabled && 'text-destructive hover:bg-destructive/10 hover:text-destructive'
            )}
          >
            <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {item.shortcut && (
              <span className="ml-auto pl-4 text-xs tracking-wide text-muted-foreground">
                {item.shortcut}
              </span>
            )}
          </button>

          {/* Separator nach bestimmten Items */}
          {item.dividerAfter && index < menuItems.length - 1 && (
            <div className="h-px bg-border my-1.5" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ============================================================================
// Export als FieldContextMenu (Alternative API)
// ============================================================================

interface FieldContextMenuProps {
  visible: boolean
  x: number
  y: number
  fieldId: string | null
  onClose: () => void
}

/**
 * Alternative API für direkten Aufruf ohne Store
 * (für Kompatibilität mit älterem Code)
 */
export function FieldContextMenu({
  visible,
  x,
  y,
  fieldId,
  onClose,
}: FieldContextMenuProps) {
  const {
    getFieldById,
    duplicateField,
    deleteField,
    selectedFieldIds,
  } = usePdfViewerStore()

  const menuRef = useRef<HTMLDivElement>(null)

  const menuItems = React.useMemo((): MenuItem[] => {
    if (!fieldId) return []

    const field = getFieldById(fieldId)
    if (!field) return []

    return [
      {
        action: 'edit',
        label: 'Bearbeiten',
        icon: Edit,
        shortcut: 'Enter',
        onClick: () => console.log('Bearbeiten:', field.displayName),
      },
      {
        action: 'duplicate',
        label: 'Duplizieren',
        icon: Copy,
        shortcut: 'Strg+D',
        onClick: () => duplicateField(field.id),
        dividerAfter: true,
      },
      {
        action: 'properties',
        label: 'Eigenschaften',
        icon: Settings,
        shortcut: 'Alt+Enter',
        onClick: () => console.log('Eigenschaften:', field.displayName),
        dividerAfter: true,
      },
      {
        action: 'delete',
        label: 'Löschen',
        icon: Trash2,
        shortcut: 'Entf',
        onClick: () => deleteField(field.id),
      },
    ]
  }, [fieldId, getFieldById, duplicateField, deleteField])

  useEffect(() => {
    if (!visible || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const margin = 8

    if (rect.right > window.innerWidth - margin) {
      menu.style.left = `${x - rect.width}px`
    } else {
      menu.style.left = `${x}px`
    }

    if (rect.bottom > window.innerHeight - margin) {
      menu.style.top = `${y - rect.height}px`
    } else {
      menu.style.top = `${y}px`
    }
  }, [visible, x, y])

  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[220px] rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-xl',
        'animate-in fade-in-0 zoom-in-95'
      )}
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, index) => (
        <React.Fragment key={item.action}>
          <button
            onClick={() => {
              item.onClick()
              onClose()
            }}
            disabled={item.disabled}
            className={cn(
              'relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none',
              'transition-colors hover:bg-accent hover:text-accent-foreground',
              item.disabled && 'pointer-events-none opacity-40',
              item.action === 'delete' && 'text-destructive hover:bg-destructive/10'
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {item.shortcut && (
              <span className="ml-auto pl-4 text-xs text-muted-foreground">
                {item.shortcut}
              </span>
            )}
          </button>
          {item.dividerAfter && index < menuItems.length - 1 && (
            <div className="h-px bg-border my-1.5" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
