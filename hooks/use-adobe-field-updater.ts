/**
 * React Hook for Adobe Field Updates
 * Provides state management and convenience methods for field updates
 *
 * Usage:
 * ```tsx
 * const { updateField, batchUpdate, isUpdating, error, clearError } = useAdobeFieldUpdater(documentId)
 *
 * const handleFieldChange = async (fieldName: string, value: string) => {
 *   const result = await updateField(fieldName, value)
 *   if (result) {
 *     console.log('Field updated:', result)
 *   }
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { AdobeFieldUpdater, type FieldUpdateOptions } from '@/lib/web-adobe/adobe-field-updater'
import type { AdobeFieldUpdateResponse } from '@/types/web-adobe'

interface UseAdobeFieldUpdaterOptions {
  onSuccess?: (response: AdobeFieldUpdateResponse) => void
  onError?: (error: Error) => void
  autoRetry?: boolean
  maxRetries?: number
}

export function useAdobeFieldUpdater(
  documentId: string,
  options?: UseAdobeFieldUpdaterOptions
) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<AdobeFieldUpdateResponse | null>(null)

  const updaterRef = useRef<AdobeFieldUpdater | null>(null)

  // Initialize updater
  useEffect(() => {
    updaterRef.current = new AdobeFieldUpdater(documentId)
  }, [documentId])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Update single field
   */
  const updateField = useCallback(
    async (
      fieldName: string,
      value: string | number | boolean,
      updateOptions?: FieldUpdateOptions
    ): Promise<AdobeFieldUpdateResponse | null> => {
      if (!updaterRef.current) {
        const err = new Error('Updater not initialized')
        setError(err)
        options?.onError?.(err)
        return null
      }

      setIsUpdating(true)
      setError(null)

      try {
        let result: AdobeFieldUpdateResponse

        if (options?.autoRetry) {
          result = await updaterRef.current.updateFieldWithRetry(
            fieldName,
            value,
            updateOptions,
            options.maxRetries
          )
        } else {
          result = await updaterRef.current.updateField(
            fieldName,
            value,
            updateOptions
          )
        }

        setLastUpdate(result)
        options?.onSuccess?.(result)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        return null
      } finally {
        setIsUpdating(false)
      }
    },
    [options]
  )

  /**
   * Update multiple fields in batch
   */
  const batchUpdate = useCallback(
    async (
      updates: Array<{
        fieldName: string
        value: string | number | boolean
        position?: FieldUpdateOptions['position']
        confidence?: number
      }>
    ) => {
      if (!updaterRef.current) {
        const err = new Error('Updater not initialized')
        setError(err)
        options?.onError?.(err)
        return null
      }

      setIsUpdating(true)
      setError(null)

      try {
        const result = await updaterRef.current.batchUpdate(updates)

        // If any updates failed, set error
        if (result.failed.length > 0) {
          const error = new Error(
            `${result.failed.length} field update(s) failed`
          )
          setError(error)
          options?.onError?.(error)
        }

        // Call onSuccess for each successful update
        result.successful.forEach((update) => {
          options?.onSuccess?.(update)
        })

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        return null
      } finally {
        setIsUpdating(false)
      }
    },
    [options]
  )

  /**
   * Validate field data before updating
   */
  const validateField = useCallback(
    (
      fieldName: string,
      value: string | number | boolean,
      updateOptions?: FieldUpdateOptions
    ) => {
      if (!updaterRef.current) {
        return { valid: false, errors: ['Updater not initialized'] }
      }

      return updaterRef.current.validateFieldUpdate(
        fieldName,
        value,
        updateOptions
      )
    },
    []
  )

  return {
    updateField,
    batchUpdate,
    validateField,
    isUpdating,
    error,
    lastUpdate,
    clearError,
  }
}

/**
 * Hook with optimistic updates and rollback on error
 */
export function useOptimisticFieldUpdater(
  documentId: string,
  initialFields: Record<string, any> = {}
) {
  const [fields, setFields] = useState<Record<string, any>>(initialFields)
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set())

  const { updateField, error } = useAdobeFieldUpdater(documentId)

  /**
   * Update field with optimistic UI
   */
  const updateFieldOptimistic = useCallback(
    async (
      fieldName: string,
      value: string | number | boolean,
      options?: FieldUpdateOptions
    ) => {
      const previousValue = fields[fieldName]

      // Optimistic update
      setFields((prev) => ({ ...prev, [fieldName]: value }))
      setPendingUpdates((prev) => new Set(prev).add(fieldName))

      try {
        const result = await updateField(fieldName, value, options)

        if (!result) {
          // Rollback on error
          setFields((prev) => ({ ...prev, [fieldName]: previousValue }))
        }

        return result
      } finally {
        setPendingUpdates((prev) => {
          const next = new Set(prev)
          next.delete(fieldName)
          return next
        })
      }
    },
    [fields, updateField]
  )

  /**
   * Check if field is currently being updated
   */
  const isFieldPending = useCallback(
    (fieldName: string) => {
      return pendingUpdates.has(fieldName)
    },
    [pendingUpdates]
  )

  return {
    fields,
    updateField: updateFieldOptimistic,
    isFieldPending,
    error,
  }
}
