/**
 * PDF Field Analysis Background Worker
 * Processes uploaded PDFs and extracts form fields
 *
 * Features:
 * - Background PDF analysis
 * - Field extraction with bounding boxes
 * - Database persistence (Prisma)
 * - Real-time Socket.IO progress events
 * - Error recovery and logging
 */

import { prisma } from '@/lib/db'
import { publishAnalysisEvent } from '@/lib/socket-handlers/web-adobe'
import {
  extractFieldsFromPdf,
  mergeOverlappingFields,
  type ExtractedField,
} from './pdf-field-extractor'

// ============================================
// = Main Analysis Function
// ============================================

/**
 * Analyze PDF document and extract fields
 * @param documentId - Database ID of the PdfDocument
 */
export async function analyzeDocument(documentId: string): Promise<void> {
  const startTime = Date.now()

  try {
    // Fetch document from database
    const document = await prisma.pdfDocument.findUnique({
      where: { id: documentId },
      include: { user: true },
    })

    if (!document) {
      throw new Error(`Document ${documentId} not found`)
    }

    // Update status to ANALYZING
    await prisma.pdfDocument.update({
      where: { id: documentId },
      data: { status: 'ANALYZING' },
    })

    // Emit start event
    await publishAnalysisEvent(documentId, 'start', {
      documentId,
      fileName: document.filename,
      totalPages: document.pageCount || 0,
      startedAt: Date.now(),
      userId: document.userId,
    })

    // Progress callback for extraction
    const onProgress = async (progress: number, stage: string) => {
      await publishAnalysisEvent(documentId, 'progress', {
        documentId,
        progress,
        currentPage: Math.floor((progress / 100) * (document.pageCount || 1)),
        totalPages: document.pageCount || 1,
        stage: mapStageToSocketStage(stage),
        message: getStageMessage(stage),
      })
    }

    // Extract fields from PDF
    const result = await extractFieldsFromPdf(document.storagePath, onProgress)

    if (!result.success) {
      throw new Error(`Field extraction failed: ${result.errors?.join(', ')}`)
    }

    // Update document with page count if not set
    if (!document.pageCount) {
      await prisma.pdfDocument.update({
        where: { id: documentId },
        data: { pageCount: result.totalPages },
      })
    }

    // Merge overlapping fields (deduplication)
    const uniqueFields = mergeOverlappingFields(result.fields)

    // Save fields to database
    await saveFieldsToDatabase(documentId, uniqueFields)

    // Update document status to REVIEW
    await prisma.pdfDocument.update({
      where: { id: documentId },
      data: { status: 'REVIEW' },
    })

    // Emit complete event
    await publishAnalysisEvent(documentId, 'complete', {
      documentId,
      success: true,
      totalFields: uniqueFields.length,
      extractedPages: result.totalPages,
      duration: Date.now() - startTime,
      completedAt: Date.now(),
    })

    console.log(`✅ Document ${documentId} analyzed successfully: ${uniqueFields.length} fields extracted`)

  } catch (error) {
    console.error(`❌ Document ${documentId} analysis failed:`, error)

    // Update document status to ERROR
    await prisma.pdfDocument.update({
      where: { id: documentId },
      data: { status: 'ERROR' },
    }).catch(err => console.error('Failed to update document status:', err))

    // Emit error event
    await publishAnalysisEvent(documentId, 'error', {
      documentId,
      error: error instanceof Error ? error.message : String(error),
      stage: 'analysis',
      recoverable: true,
      timestamp: Date.now(),
    })

    // Re-throw to let caller handle
    throw error
  }
}

// ============================================
// = Database Operations
// ============================================

/**
 * Save extracted fields to database
 */
async function saveFieldsToDatabase(
  documentId: string,
  fields: ExtractedField[]
): Promise<void> {
  // Delete existing fields (if re-analyzing)
  await prisma.pdfField.deleteMany({
    where: { documentId },
  })

  // Batch create new fields
  const fieldData = fields.map(field => ({
    documentId,
    pdfName: field.name,
    displayLabel: field.label || field.name,
    fieldType: field.type,
    x: field.boundingBox.x,
    y: field.boundingBox.y,
    width: field.boundingBox.width,
    height: field.boundingBox.height,
    pageNumber: field.page,
    status: 'DRAFT' as const,
    suggestions: {
      confidence: field.confidence,
      extractedValue: field.value || null,
    },
  }))

  // Insert in batches of 100 to avoid query size limits
  const batchSize = 100
  for (let i = 0; i < fieldData.length; i += batchSize) {
    const batch = fieldData.slice(i, i + batchSize)
    await prisma.pdfField.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }

  console.log(`✅ Saved ${fieldData.length} fields to database for document ${documentId}`)
}

// ============================================
// = Utility Functions
// ============================================

/**
 * Map internal stage names to Socket.IO stage types
 */
function mapStageToSocketStage(stage: string): 'preprocessing' | 'ocr' | 'field-extraction' | 'validation' {
  const stageMap: Record<string, 'preprocessing' | 'ocr' | 'field-extraction' | 'validation'> = {
    loading: 'preprocessing',
    preprocessing: 'preprocessing',
    'text-analysis': 'field-extraction',
    'extracting-form-fields': 'field-extraction',
    validation: 'validation',
    complete: 'validation',
  }

  return stageMap[stage] || 'field-extraction'
}

/**
 * Get user-friendly message for stage
 */
function getStageMessage(stage: string): string {
  const messages: Record<string, string> = {
    loading: 'Loading PDF document...',
    preprocessing: 'Preparing PDF for analysis...',
    'text-analysis': 'Analyzing text content...',
    'extracting-form-fields': 'Extracting form fields...',
    validation: 'Validating extracted fields...',
    complete: 'Analysis complete',
  }

  return messages[stage] || 'Processing...'
}

// ============================================
// = Batch Analysis
// ============================================

/**
 * Analyze multiple documents in sequence
 * @param documentIds - Array of document IDs to analyze
 * @returns Array of results with success/failure status
 */
export async function analyzeDocumentBatch(
  documentIds: string[]
): Promise<Array<{ documentId: string; success: boolean; error?: string }>> {
  const results: Array<{ documentId: string; success: boolean; error?: string }> = []

  for (const documentId of documentIds) {
    try {
      await analyzeDocument(documentId)
      results.push({ documentId, success: true })
    } catch (error) {
      results.push({
        documentId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

// ============================================
// = Re-Analysis
// ============================================

/**
 * Re-analyze a document (useful after manual field corrections)
 * @param documentId - Database ID of the PdfDocument
 */
export async function reanalyzeDocument(documentId: string): Promise<void> {
  console.log(`🔄 Re-analyzing document ${documentId}...`)

  // Clear existing fields
  await prisma.pdfField.deleteMany({
    where: { documentId },
  })

  // Reset status
  await prisma.pdfDocument.update({
    where: { id: documentId },
    data: { status: 'DRAFT' },
  })

  // Run analysis again
  await analyzeDocument(documentId)
}

// ============================================
// = Document Status Check
// ============================================

/**
 * Check if document is ready for analysis
 */
export async function isDocumentReady(documentId: string): Promise<boolean> {
  const document = await prisma.pdfDocument.findUnique({
    where: { id: documentId },
    select: { status: true, storagePath: true },
  })

  if (!document) {
    return false
  }

  // Check if file exists
  try {
    const fs = await import('fs/promises')
    await fs.access(document.storagePath)
    return true
  } catch {
    return false
  }
}

// ============================================
// = Analysis Queue (Optional - for future use)
// ============================================

interface QueueItem {
  documentId: string
  priority: number
  addedAt: number
}

const analysisQueue: QueueItem[] = []
let isProcessing = false

/**
 * Add document to analysis queue
 */
export function queueDocumentAnalysis(documentId: string, priority: number = 0): void {
  analysisQueue.push({
    documentId,
    priority,
    addedAt: Date.now(),
  })

  // Sort by priority (higher first) and then by addedAt
  analysisQueue.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }
    return a.addedAt - b.addedAt
  })

  // Start processing if not already running
  if (!isProcessing) {
    processQueue().catch(err => {
      console.error('Queue processing error:', err)
    })
  }
}

/**
 * Process analysis queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || analysisQueue.length === 0) {
    return
  }

  isProcessing = true

  while (analysisQueue.length > 0) {
    const item = analysisQueue.shift()
    if (!item) break

    try {
      await analyzeDocument(item.documentId)
    } catch (error) {
      console.error(`Queue processing failed for ${item.documentId}:`, error)
    }
  }

  isProcessing = false
}

/**
 * Get queue status
 */
export function getQueueStatus(): { pending: number; isProcessing: boolean } {
  return {
    pending: analysisQueue.length,
    isProcessing,
  }
}
