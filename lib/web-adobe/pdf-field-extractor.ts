// @ts-nocheck
/**
 * PDF Field Extraction Library (pdf-lib only)
 * Automatic form field detection with bounding box calculation
 *
 * Features:
 * - Text field detection from PDF forms
 * - Checkbox detection
 * - Dropdown detection
 * - Signature field detection
 * - Native PDF form field extraction (no SSR issues)
 *
 * NOTE: This version uses pdf-lib exclusively for server-side compatibility.
 * Text-based field detection has been removed to eliminate pdfjs-dist dependency.
 */

import { PDFDocument } from 'pdf-lib'
import { readFile } from 'fs/promises'

// ============================================
// = Type Definitions
// ============================================

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export type FieldType = 'text' | 'checkbox' | 'dropdown' | 'signature' | 'number' | 'date'

export interface ExtractedField {
  name: string
  type: FieldType
  page: number
  boundingBox: BoundingBox
  value?: string
  confidence: number // 0-1
  label?: string
}

export interface ExtractionResult {
  success: boolean
  totalPages: number
  fields: ExtractedField[]
  duration: number
  errors?: string[]
}

// TextItem interface removed (was used for pdfjs-dist text analysis)

// ============================================
// = Field Detection Keywords
// ============================================

const FIELD_KEYWORDS = {
  text: [
    'name', 'address', 'city', 'state', 'zip', 'email', 'phone',
    'company', 'title', 'notes', 'comments', 'description'
  ],
  number: ['age', 'quantity', 'amount', 'total', 'count', 'number'],
  date: ['date', 'dob', 'birth', 'expires', 'expiration', 'year'],
  checkbox: ['agree', 'accept', 'confirm', 'yes', 'no', 'check'],
  signature: ['signature', 'sign', 'signed', 'initial'],
}

// ============================================
// = Main Extraction Function
// ============================================

export async function extractFieldsFromPdf(
  pdfPath: string,
  onProgress?: (progress: number, stage: string) => void
): Promise<ExtractionResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const allFields: ExtractedField[] = []

  try {
    onProgress?.(5, 'loading')

    // Load PDF with pdf-lib for form field detection
    const pdfBuffer = await readFile(pdfPath)
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const totalPages = pdfDoc.getPageCount()

    onProgress?.(10, 'preprocessing')

    // Try to extract existing form fields
    const form = pdfDoc.getForm()
    const formFields = form.getFields()

    if (formFields.length > 0) {
      // PDF has interactive form fields
      onProgress?.(30, 'extracting-form-fields')
      const extractedFormFields = await extractFormFields(pdfDoc, onProgress)
      allFields.push(...extractedFormFields)
    } else {
      // No form fields found
      onProgress?.(90, 'no-fields')
      console.warn('PDF has no interactive form fields. Text-based detection disabled for SSR compatibility.')
      // NOTE: Text-based field detection removed to eliminate pdfjs-dist dependency
      // For PDFs without form fields, consider:
      // 1. Using Adobe PDF Embed API for client-side viewing
      // 2. Adding form fields to the PDF template
      // 3. Using OCR services for field detection
    }

    onProgress?.(100, 'complete')

    return {
      success: true,
      totalPages,
      fields: allFields,
      duration: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    }

  } catch (error) {
    console.error('PDF extraction error:', error)
    errors.push(error instanceof Error ? error.message : String(error))

    return {
      success: false,
      totalPages: 0,
      fields: [],
      duration: Date.now() - startTime,
      errors,
    }
  }
}

// ============================================
// = Form Field Extraction (pdf-lib)
// ============================================

async function extractFormFields(
  pdfDoc: PDFDocument,
  onProgress?: (progress: number, stage: string) => void
): Promise<ExtractedField[]> {
  const fields: ExtractedField[] = []
  const form = pdfDoc.getForm()
  const formFields = form.getFields()
  const totalFields = formFields.length

  for (let i = 0; i < totalFields; i++) {
    const field = formFields[i]
    const progress = 30 + Math.floor((i / totalFields) * 40)
    onProgress?.(progress, 'extracting-form-fields')

    try {
      const fieldName = field.getName()
      const widgets = field.acroField.getWidgets()

      for (const widget of widgets) {
        const rect = widget.getRectangle()
        const page = findPageForWidget(pdfDoc, widget)

        if (rect && page !== undefined) {
          const pageObj = pdfDoc.getPage(page)
          const { width: pageWidth, height: pageHeight } = pageObj.getSize()

          // Normalize coordinates (0-1)
          const normalizedBoundingBox: BoundingBox = {
            x: rect.x / pageWidth,
            y: rect.y / pageHeight,
            width: rect.width / pageWidth,
            height: rect.height / pageHeight,
          }

          const fieldType = determineFieldType(field, fieldName)

          fields.push({
            name: fieldName,
            type: fieldType,
            page: page + 1, // 1-indexed
            boundingBox: normalizedBoundingBox,
            confidence: 1.0, // Native form fields have 100% confidence
            label: extractLabel(fieldName),
          })
        }
      }
    } catch (err) {
      console.error(`Error extracting field ${i}:`, err)
    }
  }

  return fields
}

function findPageForWidget(pdfDoc: PDFDocument, widget: any): number | undefined {
  const pages = pdfDoc.getPages()

  for (let i = 0; i < pages.length; i++) {
    try {
      const page = pages[i]
      const pageDict = page.node
      const widgetPage = widget.P()

      if (widgetPage && widgetPage === pageDict) {
        return i
      }
    } catch {
      // Continue searching
    }
  }

  return 0 // Default to first page if not found
}

function determineFieldType(field: any, fieldName: string): FieldType {
  const name = fieldName.toLowerCase()

  // Check field type from PDF structure
  try {
    if (field.constructor.name.includes('Checkbox') || field.constructor.name.includes('Button')) {
      return 'checkbox'
    }
    if (field.constructor.name.includes('Dropdown')) {
      return 'dropdown'
    }
  } catch {
    // Fallback to keyword detection
  }

  // Keyword-based detection
  if (FIELD_KEYWORDS.signature.some(kw => name.includes(kw))) {
    return 'signature'
  }
  if (FIELD_KEYWORDS.date.some(kw => name.includes(kw))) {
    return 'date'
  }
  if (FIELD_KEYWORDS.number.some(kw => name.includes(kw))) {
    return 'number'
  }
  if (FIELD_KEYWORDS.checkbox.some(kw => name.includes(kw))) {
    return 'checkbox'
  }

  return 'text'
}

// ============================================
// = Text-Based Field Detection
// ============================================
// NOTE: Text-based field detection removed to eliminate pdfjs-dist dependency.
// This eliminates "self is not defined" SSR errors during Next.js production build.
//
// For PDFs without interactive form fields, consider:
// 1. Client-side viewing with Adobe PDF Embed API (already integrated)
// 2. Adding form fields to PDF templates using Adobe Acrobat
// 3. External OCR/field detection services (if needed)

function extractLabel(fieldName: string): string {
  // Convert field_name or fieldName to "Field Name"
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ============================================
// = Utility Functions
// ============================================

/**
 * Calculate field area in square pixels
 */
export function calculateFieldArea(bbox: BoundingBox, pageWidth: number, pageHeight: number): number {
  return (bbox.width * pageWidth) * (bbox.height * pageHeight)
}

/**
 * Check if two bounding boxes overlap
 */
export function doBoxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  )
}

/**
 * Merge overlapping fields (deduplication)
 */
export function mergeOverlappingFields(fields: ExtractedField[]): ExtractedField[] {
  const merged: ExtractedField[] = []

  for (const field of fields) {
    const overlapping = merged.find(
      f => f.page === field.page && doBoxesOverlap(f.boundingBox, field.boundingBox)
    )

    if (overlapping) {
      // Keep field with higher confidence
      if (field.confidence > overlapping.confidence) {
        const index = merged.indexOf(overlapping)
        merged[index] = field
      }
    } else {
      merged.push(field)
    }
  }

  return merged
}
