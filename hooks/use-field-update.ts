/**
 * useFieldUpdate Hook
 * Auto-Save hook for PDF field updates with debouncing and optimistic UI
 *
 * Features:
 * - 1 second debounce for auto-save
 * - Optimistic UI updates
 * - Error handling with rollback
 * - Loading states
 * - Last saved timestamp
 */

import { useCallback, useRef, useState } from 'react'
import type { PdfField } from '@prisma/client'
import type { UpdateFieldRequest } from '@/types/web-adobe'

interface UseFieldUpdateOptions {
  documentId: string
  onSuccess?: (field: PdfField) => void
  onError?: (error: Error, fieldId: string, originalData: Partial<PdfField>) => void
}

interface UseFieldUpdateReturn {
  updateField: (fieldId: string, updates: UpdateFieldRequest) => void
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
  manualSave: (fieldId: string, updates: UpdateFieldRequest) => Promise<void>
}

/**
 * Hook for auto-saving field updates with debouncing
 */
export function useFieldUpdate({
  documentId,
  onSuccess,
  onError,
}: UseFieldUpdateOptions): UseFieldUpdateReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Store debounce timers per field
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Store pending updates per field
  const pendingUpdatesRef = useRef<Map<string, UpdateFieldRequest>>(new Map())

  /**
   * Internal save function (used by both debounced and manual save)
   */
  const saveField = useCallback(async (
    fieldId: string,
    updates: UpdateFieldRequest
  ): Promise<PdfField> => {
    const response = await fetch(
      `/api/web-adobe/documents/${documentId}/fields/${fieldId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update field')
    }

    const data = await response.json()
    return data.field
  }, [documentId])

  /**
   * Update field with debouncing (auto-save after 1 second)
   */
  const updateField = useCallback((
    fieldId: string,
    updates: UpdateFieldRequest
  ) => {
    // Store the current update
    const currentUpdates = pendingUpdatesRef.current.get(fieldId) || {}
    const mergedUpdates = { ...currentUpdates, ...updates }
    pendingUpdatesRef.current.set(fieldId, mergedUpdates)

    // Clear existing debounce timer for this field
    const existingTimer = debounceTimersRef.current.get(fieldId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new debounce timer (1 second)
    const newTimer = setTimeout(async () => {
      setIsSaving(true)
      setError(null)

      try {
        const finalUpdates = pendingUpdatesRef.current.get(fieldId)
        if (!finalUpdates) return

        const updatedField = await saveField(fieldId, finalUpdates)

        setLastSaved(new Date())
        pendingUpdatesRef.current.delete(fieldId)

        onSuccess?.(updatedField)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        console.error('[useFieldUpdate] Error:', error)
        setError(error)

        // Call error handler with rollback data
        const originalData = pendingUpdatesRef.current.get(fieldId)
        if (originalData) {
          onError?.(error, fieldId, originalData)
        }
      } finally {
        setIsSaving(false)
        debounceTimersRef.current.delete(fieldId)
      }
    }, 1000)

    debounceTimersRef.current.set(fieldId, newTimer)
  }, [saveField, onSuccess, onError])

  /**
   * Manual save without debounce (e.g., for Ctrl+S)
   */
  const manualSave = useCallback(async (
    fieldId: string,
    updates: UpdateFieldRequest
  ) => {
    // Clear any pending debounce
    const existingTimer = debounceTimersRef.current.get(fieldId)
    if (existingTimer) {
      clearTimeout(existingTimer)
      debounceTimersRef.current.delete(fieldId)
    }

    setIsSaving(true)
    setError(null)

    try {
      // Merge with any pending updates
      const pendingUpdates = pendingUpdatesRef.current.get(fieldId) || {}
      const finalUpdates = { ...pendingUpdates, ...updates }

      const updatedField = await saveField(fieldId, finalUpdates)

      setLastSaved(new Date())
      pendingUpdatesRef.current.delete(fieldId)

      onSuccess?.(updatedField)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      console.error('[useFieldUpdate] Manual save error:', error)
      setError(error)

      onError?.(error, fieldId, updates)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [saveField, onSuccess, onError])

  return {
    updateField,
    isSaving,
    lastSaved,
    error,
    manualSave,
  }
}

/**
 * Format relative time for "Saved X seconds ago"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 5) return 'gerade eben'
  if (diffSec < 60) return `vor ${diffSec} Sekunden`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `vor ${diffMin} Minute${diffMin !== 1 ? 'n' : ''}`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `vor ${diffHour} Stunde${diffHour !== 1 ? 'n' : ''}`

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
