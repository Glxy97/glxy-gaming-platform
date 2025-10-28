/**
 * PDF Services Type Definitions
 * Comprehensive type system for PDF processing and generation
 */

// ============================================================================
// Form Field Types
// ============================================================================

export type FormFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'signature'

export interface FormField {
  id: string
  name: string
  type: FormFieldType
  label: string
  value: string | number | boolean | Date
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  options?: Array<{ label: string; value: string }>
}

// ============================================================================
// PDF Settings & Configuration
// ============================================================================

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5' | 'Tabloid'
export type PageOrientation = 'Portrait' | 'Landscape'

export interface PdfSettings {
  pageSize: PageSize
  orientation: PageOrientation
  fillable: boolean
  encrypted: boolean
  password?: string
  permissions?: {
    printing?: boolean
    modifying?: boolean
    copying?: boolean
    annotating?: boolean
  }
  metadata?: {
    title?: string
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
  }
}

export interface PdfGenerationOptions extends PdfSettings {
  template: string
  fields: FormField[]
  watermark?: {
    text: string
    opacity: number
    fontSize: number
    rotation: number
  }
  header?: {
    text: string
    alignment: 'left' | 'center' | 'right'
  }
  footer?: {
    text: string
    pageNumbers: boolean
    alignment: 'left' | 'center' | 'right'
  }
}

// ============================================================================
// PDF Processing Types
// ============================================================================

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ProcessedPdfResult {
  success: boolean
  fileId: string
  fileName: string
  fileSize: number
  pageCount: number
  extractedText?: string
  formFields?: ExtractedFormField[]
  metadata?: PdfMetadata
  processingTime: number
  downloadUrl?: string
  error?: string
}

export interface ExtractedFormField {
  name: string
  type: FormFieldType
  value: string | boolean
  x: number
  y: number
  width: number
  height: number
  page: number
  required: boolean
}

export interface PdfMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  pageCount: number
  fileSize: number
  version?: string
  encrypted: boolean
  hasFormFields: boolean
}

// ============================================================================
// PDF Analysis Types
// ============================================================================

export interface PdfAnalysisResult {
  isValid: boolean
  isPdf: boolean
  isEncrypted: boolean
  isCorrupted: boolean
  pageCount: number
  fileSize: number
  hasFormFields: boolean
  hasSignatures: boolean
  hasAttachments: boolean
  isScanned: boolean
  needsOcr: boolean
  metadata?: PdfMetadata
  warnings?: string[]
  errors?: string[]
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ProcessPdfRequest {
  extractText?: boolean
  extractFormFields?: boolean
  analyzeStructure?: boolean
  performOcr?: boolean
  compressOutput?: boolean
}

export interface GeneratePdfRequest {
  fields: FormField[]
  template: string
  settings: PdfSettings
}

export interface ProcessPdfResponse {
  success: boolean
  data?: ProcessedPdfResult
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface GeneratePdfResponse {
  success: boolean
  fileId: string
  fileName: string
  fileSize: number
  downloadUrl: string
  expiresAt: Date
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

// ============================================================================
// Adobe API Response Types (Mock Structure)
// ============================================================================

export interface AdobeApiResponse<T = unknown> {
  status: 'success' | 'error'
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  metadata?: {
    requestId: string
    timestamp: Date
    processingTime: number
  }
}

export interface AdobeTextExtractionResult {
  text: string
  pages: Array<{
    pageNumber: number
    text: string
    wordCount: number
  }>
  language?: string
  confidence?: number
}

export interface AdobeFormFieldResult {
  fields: ExtractedFormField[]
  totalFields: number
  fillableFields: number
  requiredFields: number
}

export interface AdobeOcrResult {
  text: string
  confidence: number
  language: string
  pages: Array<{
    pageNumber: number
    text: string
    boundingBoxes: Array<{
      text: string
      x: number
      y: number
      width: number
      height: number
    }>
  }>
}

// ============================================================================
// Error Types
// ============================================================================

export enum PdfServiceErrorCode {
  INVALID_FILE = 'INVALID_FILE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  ENCRYPTED_PDF = 'ENCRYPTED_PDF',
  CORRUPTED_PDF = 'CORRUPTED_PDF',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  GENERATION_FAILED = 'GENERATION_FAILED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

export class PdfServiceError extends Error {
  constructor(
    public code: PdfServiceErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'PdfServiceError'
  }
}

// ============================================================================
// Upload Types
// ============================================================================

export interface PdfUploadOptions {
  maxSize?: number
  allowedMimeTypes?: string[]
  validateContent?: boolean
  generateThumbnail?: boolean
}

export interface PdfUploadResult {
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
  storagePath: string
  thumbnailUrl?: string
}

// ============================================================================
// Template Types
// ============================================================================

export interface PdfTemplate {
  id: string
  name: string
  description: string
  category: string
  fields: FormField[]
  settings: PdfSettings
  previewUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type TemplateCategory =
  | 'invoice'
  | 'contract'
  | 'form'
  | 'certificate'
  | 'report'
  | 'letter'
  | 'custom'
