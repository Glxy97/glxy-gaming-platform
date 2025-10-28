/**
 * usePropertiesPanel Hook
 * State management for the Properties Panel
 * Vollständig deutsche Lokalisierung
 */
import { useEffect } from 'react'

import { create } from 'zustand'
import { FormField } from '@/types/pdf-viewer'
import { messages } from '@/lib/web-adobe/de-labels'

// Types
interface PropertiesPanelState {
  isOpen: boolean
  isPinned: boolean
  selectedFields: FormField[]
  activeSection: string | null
  clipboardProperties: Partial<FormField> | null
}

interface FieldPropertyChange {
  fieldId: string
  property: string
  oldValue: any
  newValue: any
  timestamp: Date
}

interface PropertiesPanelStore extends PropertiesPanelState {
  // Actions
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  setPinned: (pinned: boolean) => void
  setSelectedFields: (fields: FormField[]) => void
  setActiveSection: (section: string | null) => void
  copyProperties: (properties: Partial<FormField>) => void
  pasteProperties: () => Partial<FormField> | null
  clearClipboard: () => void

  // History
  history: FieldPropertyChange[]
  addToHistory: (change: FieldPropertyChange) => void
  undo: () => void
  canUndo: () => boolean
}

export const usePropertiesPanel = create<PropertiesPanelStore>((set, get) => ({
  // Initial state
  isOpen: false,
  isPinned: false,
  selectedFields: [],
  activeSection: null,
  clipboardProperties: null,
  history: [],

  // Actions
  openPanel: () => set({ isOpen: true }),

  closePanel: () => set({ isOpen: false }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  setPinned: (pinned) => set({ isPinned: pinned }),

  setSelectedFields: (fields) => {
    set({ selectedFields: fields })
    if (fields.length > 0 && !get().isOpen) {
      set({ isOpen: true })
    }
  },

  setActiveSection: (section) => set({ activeSection: section }),

  copyProperties: (properties) => set({ clipboardProperties: properties }),

  pasteProperties: () => get().clipboardProperties,

  clearClipboard: () => set({ clipboardProperties: null }),

  // History management
  addToHistory: (change) => {
    set((state) => ({
      history: [...state.history, change].slice(-50), // Keep last 50 changes
    }))
  },

  undo: () => {
    const { history } = get()
    if (history.length === 0) return

    const lastChange = history[history.length - 1]
    // Implement undo logic here
    set({ history: history.slice(0, -1) })
  },

  canUndo: () => get().history.length > 0,
}))

/**
 * Hook for managing bulk edit state
 */
interface BulkEditStore {
  isActive: boolean
  selectedFieldIds: string[]
  commonProperties: Partial<FormField>
  mixedProperties: Set<string>

  setActive: (active: boolean) => void
  setSelectedFieldIds: (ids: string[]) => void
  setCommonProperties: (properties: Partial<FormField>) => void
  addMixedProperty: (property: string) => void
  reset: () => void
}

export const useBulkEdit = create<BulkEditStore>((set) => ({
  isActive: false,
  selectedFieldIds: [],
  commonProperties: {},
  mixedProperties: new Set(),

  setActive: (active) => set({ isActive: active }),

  setSelectedFieldIds: (ids) => {
    set({ selectedFieldIds: ids, isActive: ids.length > 1 })
  },

  setCommonProperties: (properties) => set({ commonProperties: properties }),

  addMixedProperty: (property) => {
    set((state) => {
      const newSet = new Set(state.mixedProperties)
      newSet.add(property)
      return { mixedProperties: newSet }
    })
  },

  reset: () => {
    set({
      isActive: false,
      selectedFieldIds: [],
      commonProperties: {},
      mixedProperties: new Set(),
    })
  },
}))

/**
 * Hook for keyboard shortcuts
 */
export function usePropertiesPanelShortcuts() {
  const { togglePanel, closePanel } = usePropertiesPanel()

  const handleKeyPress = (event: KeyboardEvent) => {
    // P - Toggle panel
    if (event.key === 'p' && !event.ctrlKey && !event.metaKey) {
      const target = event.target as HTMLElement
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        event.preventDefault()
        togglePanel()
      }
    }

    // Escape - Close panel
    if (event.key === 'Escape') {
      closePanel()
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [togglePanel, closePanel])
}
