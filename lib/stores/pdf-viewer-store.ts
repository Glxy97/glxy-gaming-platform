/**
 * PDF Viewer Zustand Store
 * Zentrale State Management für PDF-Viewer
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  PdfDocument,
  FormField,
  ViewerState,
  ViewMode,
  ZoomMode,
  ContextMenuState,
  FieldDragState,
} from '@/types/pdf-viewer'

// ============================================================================
// Store Interface
// ============================================================================

interface PdfViewerStore extends ViewerState {
  // ===== Document Actions =====
  setDocument: (doc: PdfDocument | null) => void
  clearDocument: () => void

  // ===== Navigation Actions =====
  setPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void

  // ===== Zoom Actions =====
  setZoom: (zoom: number) => void
  setZoomMode: (mode: ZoomMode) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitWidth: () => void
  fitPage: () => void

  // ===== Rotation Actions =====
  setRotation: (rotation: number) => void
  rotateClockwise: () => void
  rotateCounterClockwise: () => void

  // ===== View Mode Actions =====
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void

  // ===== Field Selection Actions =====
  selectField: (fieldId: string, multi?: boolean) => void
  selectFields: (fieldIds: string[]) => void
  deselectField: (fieldId: string) => void
  deselectAllFields: () => void
  toggleFieldSelection: (fieldId: string) => void

  // ===== Field Manipulation Actions =====
  updateField: (fieldId: string, updates: Partial<FormField>) => void
  updateFieldValue: (fieldId: string, value: string | boolean) => void
  deleteField: (fieldId: string) => void
  deleteFields: (fieldIds: string[]) => void
  duplicateField: (fieldId: string) => void
  addField: (field: FormField) => void

  // ===== Overlay Actions =====
  toggleOverlay: () => void
  setOverlayVisible: (visible: boolean) => void

  // ===== Context Menu Actions =====
  contextMenu: ContextMenuState
  openContextMenu: (x: number, y: number, fieldId: string) => void
  closeContextMenu: () => void

  // ===== Drag State =====
  dragState: FieldDragState | null
  setDragState: (state: FieldDragState | null) => void

  // ===== Utility Actions =====
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getFieldById: (fieldId: string) => FormField | undefined
  getFieldsByPage: (page: number) => FormField[]
  getSelectedFields: () => FormField[]

  // ===== Batch Actions =====
  batchUpdateFields: (updates: Array<{ id: string; updates: Partial<FormField> }>) => void

  // ===== Reset =====
  reset: () => void
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ViewerState = {
  document: null,
  currentPage: 1,
  zoom: 1.0,
  zoomMode: 'custom',
  rotation: 0,
  viewMode: 'continuous',
  selectedFieldIds: [],
  showFieldOverlay: true,
  isLoading: false,
  error: null,
}

const initialContextMenu: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  fieldId: null,
  actions: [],
}

// ============================================================================
// Store Implementation
// ============================================================================

export const usePdfViewerStore = create<PdfViewerStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        ...initialState,
        contextMenu: initialContextMenu,
        dragState: null,

        // ===== Document Actions =====
        setDocument: (doc) =>
          set((state) => ({
            document: doc,
            currentPage: 1,
            error: null,
            isLoading: false,
            selectedFieldIds: [],
          })),

        clearDocument: () =>
          set({
            document: null,
            currentPage: 1,
            selectedFieldIds: [],
            error: null,
          }),

        // ===== Navigation Actions =====
        setPage: (page) =>
          set((state) => {
            const maxPage = state.document?.totalPages || 1
            const validPage = Math.max(1, Math.min(page, maxPage))
            return { currentPage: validPage }
          }),

        nextPage: () =>
          set((state) => {
            const maxPage = state.document?.totalPages || 1
            if (state.currentPage < maxPage) {
              return { currentPage: state.currentPage + 1 }
            }
            return state
          }),

        previousPage: () =>
          set((state) => {
            if (state.currentPage > 1) {
              return { currentPage: state.currentPage - 1 }
            }
            return state
          }),

        goToPage: (page) => get().setPage(page),

        // ===== Zoom Actions =====
        setZoom: (zoom) =>
          set({
            zoom: Math.max(0.1, Math.min(zoom, 5.0)),
            zoomMode: 'custom',
          }),

        setZoomMode: (mode) => set({ zoomMode: mode }),

        zoomIn: () =>
          set((state) => ({
            zoom: Math.min(state.zoom * 1.2, 5.0),
            zoomMode: 'custom',
          })),

        zoomOut: () =>
          set((state) => ({
            zoom: Math.max(state.zoom / 1.2, 0.1),
            zoomMode: 'custom',
          })),

        resetZoom: () => set({ zoom: 1.0, zoomMode: 'custom' }),

        fitWidth: () => set({ zoomMode: 'fit-width' }),

        fitPage: () => set({ zoomMode: 'fit-page' }),

        // ===== Rotation Actions =====
        setRotation: (rotation) =>
          set({ rotation: rotation % 360 }),

        rotateClockwise: () =>
          set((state) => ({
            rotation: (state.rotation + 90) % 360,
          })),

        rotateCounterClockwise: () =>
          set((state) => ({
            rotation: (state.rotation - 90 + 360) % 360,
          })),

        // ===== View Mode Actions =====
        setViewMode: (mode) => set({ viewMode: mode }),

        toggleViewMode: () =>
          set((state) => {
            const modes: ViewMode[] = ['single', 'continuous', 'two-page']
            const currentIndex = modes.indexOf(state.viewMode)
            const nextIndex = (currentIndex + 1) % modes.length
            return { viewMode: modes[nextIndex] }
          }),

        // ===== Field Selection Actions =====
        selectField: (fieldId, multi = false) =>
          set((state) => {
            if (multi) {
              // Multi-Select: Toggle oder hinzufügen
              if (state.selectedFieldIds.includes(fieldId)) {
                return state
              }
              return {
                selectedFieldIds: [...state.selectedFieldIds, fieldId],
              }
            } else {
              // Single-Select
              return { selectedFieldIds: [fieldId] }
            }
          }),

        selectFields: (fieldIds) => set({ selectedFieldIds: fieldIds }),

        deselectField: (fieldId) =>
          set((state) => ({
            selectedFieldIds: state.selectedFieldIds.filter((id) => id !== fieldId),
          })),

        deselectAllFields: () => set({ selectedFieldIds: [] }),

        toggleFieldSelection: (fieldId) =>
          set((state) => {
            const isSelected = state.selectedFieldIds.includes(fieldId)
            if (isSelected) {
              return {
                selectedFieldIds: state.selectedFieldIds.filter((id) => id !== fieldId),
              }
            } else {
              return {
                selectedFieldIds: [...state.selectedFieldIds, fieldId],
              }
            }
          }),

        // ===== Field Manipulation Actions =====
        updateField: (fieldId, updates) =>
          set((state) => {
            if (!state.document) return state

            const fields = state.document.fields.map((field) =>
              field.id === fieldId ? { ...field, ...updates } : field
            )

            return {
              document: { ...state.document, fields },
            }
          }),

        updateFieldValue: (fieldId, value) =>
          set((state) => {
            if (!state.document) return state

            const fields = state.document.fields.map((field) =>
              field.id === fieldId ? { ...field, value } : field
            )

            return {
              document: { ...state.document, fields },
            }
          }),

        deleteField: (fieldId) =>
          set((state) => {
            if (!state.document) return state

            const fields = state.document.fields.filter((f) => f.id !== fieldId)

            return {
              document: { ...state.document, fields },
              selectedFieldIds: state.selectedFieldIds.filter((id) => id !== fieldId),
            }
          }),

        deleteFields: (fieldIds) =>
          set((state) => {
            if (!state.document) return state

            const fieldIdSet = new Set(fieldIds)
            const fields = state.document.fields.filter((f) => !fieldIdSet.has(f.id))

            return {
              document: { ...state.document, fields },
              selectedFieldIds: state.selectedFieldIds.filter((id) => !fieldIdSet.has(id)),
            }
          }),

        duplicateField: (fieldId) =>
          set((state) => {
            if (!state.document) return state

            const field = state.document.fields.find((f) => f.id === fieldId)
            if (!field) return state

            // Neues Feld mit offset-Position
            const newField: FormField = {
              ...field,
              id: `${field.id}_copy_${Date.now()}`,
              name: `${field.name}_copy`,
              displayName: `${field.displayName} (Kopie)`,
              rect: {
                ...field.rect,
                x: field.rect.x + 10,
                y: field.rect.y + 10,
              },
            }

            return {
              document: {
                ...state.document,
                fields: [...state.document.fields, newField],
              },
              selectedFieldIds: [newField.id],
            }
          }),

        addField: (field) =>
          set((state) => {
            if (!state.document) return state

            return {
              document: {
                ...state.document,
                fields: [...state.document.fields, field],
              },
            }
          }),

        // ===== Overlay Actions =====
        toggleOverlay: () =>
          set((state) => ({
            showFieldOverlay: !state.showFieldOverlay,
          })),

        setOverlayVisible: (visible) =>
          set({ showFieldOverlay: visible }),

        // ===== Context Menu Actions =====
        openContextMenu: (x, y, fieldId) =>
          set({
            contextMenu: {
              visible: true,
              x,
              y,
              fieldId,
              actions: ['edit', 'delete', 'duplicate', 'properties'],
            },
          }),

        closeContextMenu: () =>
          set({
            contextMenu: initialContextMenu,
          }),

        // ===== Drag State =====
        setDragState: (state) => set({ dragState: state }),

        // ===== Utility Actions =====
        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        getFieldById: (fieldId) => {
          const state = get()
          return state.document?.fields.find((f) => f.id === fieldId)
        },

        getFieldsByPage: (page) => {
          const state = get()
          return state.document?.fields.filter((f) => f.page === page) || []
        },

        getSelectedFields: () => {
          const state = get()
          if (!state.document) return []
          return state.document.fields.filter((f) =>
            state.selectedFieldIds.includes(f.id)
          )
        },

        // ===== Batch Actions =====
        batchUpdateFields: (updates) =>
          set((state) => {
            if (!state.document) return state

            const updateMap = new Map(updates.map((u) => [u.id, u.updates]))

            const fields = state.document.fields.map((field) => {
              const fieldUpdates = updateMap.get(field.id)
              return fieldUpdates ? { ...field, ...fieldUpdates } : field
            })

            return {
              document: { ...state.document, fields },
            }
          }),

        // ===== Reset =====
        reset: () =>
          set({
            ...initialState,
            contextMenu: initialContextMenu,
            dragState: null,
          }),
      }),
      {
        name: 'pdf-viewer-store',
        // Nur bestimmte Werte persistieren
        partialize: (state) => ({
          zoom: state.zoom,
          zoomMode: state.zoomMode,
          viewMode: state.viewMode,
          showFieldOverlay: state.showFieldOverlay,
        }),
      }
    )
  )
)

// ============================================================================
// Selectors (für optimierte Re-Renders)
// ============================================================================

export const selectDocument = (state: PdfViewerStore) => state.document
export const selectCurrentPage = (state: PdfViewerStore) => state.currentPage
export const selectZoom = (state: PdfViewerStore) => state.zoom
export const selectSelectedFieldIds = (state: PdfViewerStore) => state.selectedFieldIds
export const selectIsLoading = (state: PdfViewerStore) => state.isLoading
export const selectError = (state: PdfViewerStore) => state.error

/**
 * Hook: Aktuelle Seiten-Felder
 */
export const useCurrentPageFields = () => {
  return usePdfViewerStore((state) => {
    if (!state.document) return []
    return state.document.fields.filter((f) => f.page === state.currentPage)
  })
}

/**
 * Hook: Ausgewählte Felder
 */
export const useSelectedFields = () => {
  return usePdfViewerStore((state) => state.getSelectedFields())
}

/**
 * Hook: Feld nach ID
 */
export const useFieldById = (fieldId: string) => {
  return usePdfViewerStore((state) => state.getFieldById(fieldId))
}
