/**
 * TypeScript Type Definitions for Web-Adobe PDF Field Extraction
 */

// Re-export types from pdf-field-extractor
export type {
  BoundingBox,
  FieldType,
  ExtractedField,
  ExtractionResult,
} from './pdf-field-extractor'

// Additional types for API responses

export interface DocumentUploadResponse {
  success: boolean
  document: {
    id: string
    userId: string
    title: string
    filename: string
    storagePath: string
    status: string
    fileSize: number | null
    pageCount: number | null
    createdAt: Date
    updatedAt: Date
  }
  message: string
}

export interface AnalysisTriggerResponse {
  success: boolean
  message: string
  documentId: string
  isReanalysis: boolean
  socketNamespace: string
  socketEvent: string
}

export interface AnalysisStatusResponse {
  documentId: string
  status: string
  filename: string
  pageCount: number | null
  fieldCount: number
  fileReady: boolean
  canAnalyze: boolean
  lastUpdated: Date
}

export interface FieldValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

export interface DocumentAnalysisMetrics {
  documentId: string
  totalPages: number
  totalFields: number
  fieldsByType: Record<string, number>
  averageConfidence: number
  duration: number
  analyzedAt: Date
}
