/**
 * Web-Adobe TypeScript Types
 * Shared types for PDF document management
 */

import { PdfDocumentStatus, PdfFieldStatus } from '@prisma/client'

// API Response Types
export interface PdfDocumentWithCount {
  id: string
  userId: string
  title: string
  filename: string
  storagePath: string
  status: PdfDocumentStatus
  checksum: string | null
  pageCount: number | null
  fileSize: number | null
  createdAt: Date | string
  updatedAt: Date | string
  _count: {
    fields: number
  }
}

export interface PdfDocumentWithFields extends Omit<PdfDocumentWithCount, '_count'> {
  fields: PdfField[]
}

export interface PdfField {
  id: string
  documentId: string
  pdfName: string
  displayLabel: string | null
  groupName: string | null
  fieldType: string
  required: boolean
  validationPattern: string | null
  datapadFieldId: string | null
  suggestions: Record<string, any> | null
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
  status: PdfFieldStatus
  updatedAt: Date | string
}

export interface DocumentListResponse {
  documents: PdfDocumentWithCount[]
  total: number
  hasMore: boolean
  limit: number
  offset: number
}

export interface DocumentDetailResponse {
  document: PdfDocumentWithFields
  pdfDataUrl: string | null
}

// API Request Types
export interface CreateDocumentRequest {
  title: string
  filename: string
  storagePath: string
  status?: PdfDocumentStatus
  pageCount?: number
  fileSize?: number
}

export interface UpdateDocumentRequest {
  title?: string
  status?: PdfDocumentStatus
}

export interface CreateFieldRequest {
  documentId: string
  pdfName: string
  displayLabel?: string
  groupName?: string
  fieldType?: string
  required?: boolean
  validationPattern?: string
  datapadFieldId?: string
  suggestions?: Record<string, any>
  x?: number
  y?: number
  width?: number
  height?: number
  pageNumber?: number
  status?: PdfFieldStatus
}

export interface UpdateFieldRequest {
  displayLabel?: string
  groupName?: string
  fieldType?: string
  required?: boolean
  validationPattern?: string
  datapadFieldId?: string
  suggestions?: Record<string, any>
  x?: number
  y?: number
  width?: number
  height?: number
  pageNumber?: number
  status?: PdfFieldStatus
}

// Field Type Definition
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'signature'

// Field Position and Size
export interface FieldPosition {
  x: number
  y: number
  width: number
  height: number
  page?: number
}

// Form Field (Editor/Properties Panel)
export interface FormField {
  id: string
  name: string
  displayName: string
  type: FieldType
  position: FieldPosition & { page: number }
  style: {
    fontSize: number
    fontFamily: string
    color: string
    backgroundColor: string
    borderColor: string
    borderWidth: number
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
    textAlign: 'left' | 'center' | 'right'
    padding: number
  }
  validation: {
    required: boolean
    pattern?: string
    customMessage?: string
  }
  behavior: {
    readOnly: boolean
    hidden: boolean
    calculated: boolean
  }
  typeProperties: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Validation Presets
export type ValidationPreset =
  | 'email'
  | 'phone'
  | 'zip'
  | 'date'
  | 'url'
  | 'custom'
  | 'alphanumeric'
  | 'alpha'
  | 'numeric'
  | 'username'
  | 'decimal'
  | 'percentage'
  | 'iban'
  | 'taxId'
  | 'germanName'
  | 'ipv4'
  | 'macAddress'
  | 'hexColor'
  | 'strongPassword'

// DataPad Integration Types
export interface DataPadMapping {
  mappingKey: string
  autoFill?: boolean
  syncDirection?: 'bidirectional' | 'toDataPad' | 'fromDataPad'
}

// Query Parameters
export interface DocumentListParams {
  status?: PdfDocumentStatus
  search?: string
  limit?: number
  offset?: number
}

// UI Helper Types
export type StatusColor = 'gray' | 'blue' | 'yellow' | 'green' | 'red'

export interface StatusBadgeConfig {
  label: string
  color: StatusColor
}

export const STATUS_CONFIG: Record<PdfDocumentStatus, StatusBadgeConfig> = {
  DRAFT: { label: 'Entwurf', color: 'gray' },
  ANALYZING: { label: 'Analysiert', color: 'blue' },
  REVIEW: { label: 'Überprüfung', color: 'yellow' },
  SYNCED: { label: 'Synchronisiert', color: 'green' },
  ERROR: { label: 'Fehler', color: 'red' },
}

export const FIELD_STATUS_CONFIG: Record<PdfFieldStatus, StatusBadgeConfig> = {
  DRAFT: { label: 'Entwurf', color: 'gray' },
  PENDING_REVIEW: { label: 'Prüfung', color: 'yellow' },
  APPROVED: { label: 'Genehmigt', color: 'green' },
  SYNCED: { label: 'Synchronisiert', color: 'blue' },
}

// Adobe PDF Embed API Field Update Types
export interface AdobeFieldUpdateRequest {
  fieldName: string
  value: string | number | boolean
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence?: number
}

export interface AdobeFieldUpdateResponse {
  success: boolean
  field: {
    id: string
    pdfName: string
    displayLabel: string | null
    fieldType: string
    x: number
    y: number
    width: number
    height: number
    pageNumber: number
    status: string
    updatedAt: Date
  }
  updatedBy: 'user' | 'adobe'
  timestamp: number
}
