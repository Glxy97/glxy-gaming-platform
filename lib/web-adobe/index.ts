/**
 * Web-Adobe PDF Field Extraction Service
 * Main entry point for all PDF processing functions
 */

// Core extraction functions
export {
  extractFieldsFromPdf,
  calculateFieldArea,
  doBoxesOverlap,
  mergeOverlappingFields,
} from './pdf-field-extractor'

// Worker functions
export {
  analyzeDocument,
  analyzeDocumentBatch,
  reanalyzeDocument,
  isDocumentReady,
  queueDocumentAnalysis,
  getQueueStatus,
} from './field-analysis-worker'

// Socket.IO event publishing
export { publishAnalysisEvent } from '@/lib/socket-handlers/web-adobe'

// Types
export type {
  BoundingBox,
  FieldType,
  ExtractedField,
  ExtractionResult,
  DocumentUploadResponse,
  AnalysisTriggerResponse,
  AnalysisStatusResponse,
  FieldValidationResult,
  DocumentAnalysisMetrics,
} from './types'

// Socket.IO event types
export type {
  AnalysisStartEvent,
  AnalysisProgressEvent,
  AnalysisCompleteEvent,
  AnalysisErrorEvent,
  FieldUpdatedEvent,
  SyncStartEvent,
  SyncProgressEvent,
  SyncCompleteEvent,
  SyncErrorEvent,
} from '@/lib/socket-handlers/web-adobe'
