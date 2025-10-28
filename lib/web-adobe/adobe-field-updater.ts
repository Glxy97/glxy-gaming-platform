/**
 * Adobe Field Updater Client Utility
 * Simplifies communication with Adobe PDF Embed API field update endpoint
 *
 * Usage:
 * ```tsx
 * import { AdobeFieldUpdater } from '@/lib/web-adobe/adobe-field-updater'
 *
 * const updater = new AdobeFieldUpdater(documentId)
 *
 * // Update single field
 * await updater.updateField('firstName', 'John')
 *
 * // Update field with position
 * await updater.updateField('signature', signatureData, {
 *   position: { x: 0.5, y: 0.8, width: 0.2, height: 0.05 },
 *   confidence: 0.95
 * })
 *
 * // Batch update multiple fields
 * await updater.batchUpdate([
 *   { fieldName: 'firstName', value: 'John' },
 *   { fieldName: 'lastName', value: 'Doe' }
 * ])
 * ```
 */

import type {
  AdobeFieldUpdateRequest,
  AdobeFieldUpdateResponse,
} from '@/types/web-adobe'

export interface FieldUpdateOptions {
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence?: number
}

export interface BatchUpdateResult {
  successful: AdobeFieldUpdateResponse[]
  failed: Array<{
    fieldName: string
    error: string
  }>
}

export class AdobeFieldUpdater {
  private readonly documentId: string
  private readonly baseUrl: string

  constructor(documentId: string, baseUrl?: string) {
    this.documentId = documentId
    this.baseUrl = baseUrl || '/api/web-adobe/documents'
  }

  /**
   * Update a single field
   */
  async updateField(
    fieldName: string,
    value: string | number | boolean,
    options?: FieldUpdateOptions
  ): Promise<AdobeFieldUpdateResponse> {
    const requestBody: AdobeFieldUpdateRequest = {
      fieldName,
      value,
      ...(options?.position && { position: options.position }),
      ...(options?.confidence !== undefined && { confidence: options.confidence }),
    }

    const response = await fetch(
      `${this.baseUrl}/${this.documentId}/fields`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
      }))
      throw new Error(
        error.error || `Failed to update field: ${response.statusText}`
      )
    }

    return response.json()
  }

  /**
   * Update multiple fields in batch
   * Returns both successful and failed updates
   */
  async batchUpdate(
    updates: Array<{
      fieldName: string
      value: string | number | boolean
      position?: FieldUpdateOptions['position']
      confidence?: number
    }>
  ): Promise<BatchUpdateResult> {
    const results: BatchUpdateResult = {
      successful: [],
      failed: [],
    }

    // Execute updates in parallel
    const promises = updates.map(async (update) => {
      try {
        const result = await this.updateField(
          update.fieldName,
          update.value,
          {
            position: update.position,
            confidence: update.confidence,
          }
        )
        results.successful.push(result)
      } catch (error) {
        results.failed.push({
          fieldName: update.fieldName,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    await Promise.all(promises)

    return results
  }

  /**
   * Update field with retry logic
   */
  async updateFieldWithRetry(
    fieldName: string,
    value: string | number | boolean,
    options?: FieldUpdateOptions,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<AdobeFieldUpdateResponse> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.updateField(fieldName, value, options)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (attempt < maxRetries - 1) {
          // Wait before retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('All retry attempts failed')
  }

  /**
   * Validate field data before sending
   */
  validateFieldUpdate(
    fieldName: string,
    value: string | number | boolean,
    options?: FieldUpdateOptions
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!fieldName || fieldName.trim().length === 0) {
      errors.push('Field name is required')
    }

    if (value === undefined || value === null) {
      errors.push('Field value is required')
    }

    if (options?.position) {
      const { x, y, width, height } = options.position

      if (x < 0 || x > 1) errors.push('Position x must be between 0 and 1')
      if (y < 0 || y > 1) errors.push('Position y must be between 0 and 1')
      if (width < 0 || width > 1)
        errors.push('Position width must be between 0 and 1')
      if (height < 0 || height > 1)
        errors.push('Position height must be between 0 and 1')
    }

    if (
      options?.confidence !== undefined &&
      (options.confidence < 0 || options.confidence > 1)
    ) {
      errors.push('Confidence must be between 0 and 1')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get document ID
   */
  getDocumentId(): string {
    return this.documentId
  }
}

/**
 * Factory function for creating updater instances
 */
export function createFieldUpdater(
  documentId: string,
  baseUrl?: string
): AdobeFieldUpdater {
  return new AdobeFieldUpdater(documentId, baseUrl)
}

/**
 * Quick utility function for single field updates
 */
export async function updateDocumentField(
  documentId: string,
  fieldName: string,
  value: string | number | boolean,
  options?: FieldUpdateOptions
): Promise<AdobeFieldUpdateResponse> {
  const updater = new AdobeFieldUpdater(documentId)
  return updater.updateField(fieldName, value, options)
}
