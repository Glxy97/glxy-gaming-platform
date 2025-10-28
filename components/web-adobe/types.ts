/**
 * Adobe PDF Embed API TypeScript Definitions
 * Complete type definitions for Adobe DC View SDK
 * @module web-adobe/types
 */

/**
 * Global Window extension for Adobe DC View SDK
 */
declare global {
  interface Window {
    AdobeDC?: {
      View: new (config: AdobeDCViewConfig) => AdobeViewSDK
    }
  }
}

/**
 * Adobe DC View SDK Configuration
 */
export interface AdobeDCViewConfig {
  /** Adobe API Client ID (from Adobe Developer Console) */
  clientId: string
  /** Unique DOM element ID where viewer will be rendered */
  divId: string
}

/**
 * Adobe View SDK Instance
 */
export interface AdobeViewSDK {
  /**
   * Preview a PDF file in the viewer
   * @param filePromise - Promise containing PDF content
   * @param viewerConfig - Configuration for the viewer
   * @returns Promise resolving to AdobeViewer instance
   */
  previewFile: (
    filePromise: FilePromise,
    viewerConfig: ViewerConfig
  ) => Promise<AdobeViewer>

  /**
   * Register callback for SDK events
   * @param type - Callback type (use CallbackType enum)
   * @param handler - Event handler function
   * @param options - Optional configuration
   */
  registerCallback: (
    type: CallbackType | number,
    handler: (event: any) => void,
    options?: Record<string, any>
  ) => void
}

/**
 * Adobe Viewer Instance (returned after previewFile)
 */
export interface AdobeViewer {
  /**
   * Get viewer APIs for advanced functionality
   * @returns Promise resolving to ViewerAPIs
   */
  getAPIs: () => Promise<ViewerAPIs>

  /**
   * Get annotation manager for annotation handling
   * @returns Promise resolving to AnnotationManager
   */
  getAnnotationManager: () => Promise<AnnotationManager>

  /**
   * Enable annotation APIs (required before using annotations)
   * @returns Promise that resolves when APIs are enabled
   */
  enableAnnotationAPIs: () => Promise<void>

  /**
   * Save PDF with modifications
   * @param options - Save options
   * @returns Promise resolving to saved PDF data
   */
  saveAsPDF: (options?: SaveOptions) => Promise<SaveResult>

  /**
   * Get current viewer state
   * @returns Promise resolving to viewer state
   */
  getCurrentState?: () => Promise<ViewerState>
}

/**
 * Viewer APIs for advanced functionality
 */
export interface ViewerAPIs {
  /** Get PDF annotation manager */
  getPDFAnnotationManager: () => Promise<AnnotationManager>

  /** Enable form field editing */
  enableFormFieldEditability: () => Promise<void>

  /** Disable form field editing */
  disableFormFieldEditability: () => Promise<void>

  /** Get current form field data */
  getFormFieldData: () => Promise<FormFieldData>

  /** Set form field data programmatically */
  setFormFieldData?: (data: FormFieldData) => Promise<void>

  /** Get PDF document APIs */
  getDocumentAPIs?: () => Promise<DocumentAPIs>

  /** Get page APIs */
  getPageAPIs?: () => Promise<PageAPIs>
}

/**
 * Document APIs for PDF manipulation
 */
export interface DocumentAPIs {
  /** Get document metadata */
  getMetadata: () => Promise<PdfMetadata>

  /** Get page count */
  getPageCount: () => Promise<number>

  /** Get current page number */
  getCurrentPage: () => Promise<number>

  /** Navigate to specific page */
  gotoPage: (pageNumber: number) => Promise<void>
}

/**
 * Page APIs for page-level operations
 */
export interface PageAPIs {
  /** Get page image as data URL */
  getPageImage: (pageNumber: number, options?: PageImageOptions) => Promise<string>

  /** Get page text content */
  getPageText: (pageNumber: number) => Promise<string>
}

/**
 * Page Image Options
 */
export interface PageImageOptions {
  /** Image format (png, jpeg) */
  format?: 'png' | 'jpeg'

  /** Image quality (0-100) */
  quality?: number

  /** Scale factor */
  scale?: number
}

/**
 * Viewer Configuration Options
 */
export interface ViewerConfig {
  /** Embedding mode for the PDF viewer */
  embedMode: EmbedMode

  /** Show download PDF button */
  showDownloadPDF?: boolean

  /** Show print PDF button */
  showPrintPDF?: boolean

  /** Show left-hand panel with thumbnails and bookmarks */
  showLeftHandPanel?: boolean

  /** Show annotation tools toolbar */
  showAnnotationTools?: boolean

  /** Show page navigation controls */
  showPageControls?: boolean

  /** Enable form filling capabilities */
  enableFormFilling?: boolean

  /** Enable search APIs */
  enableSearchAPIs?: boolean

  /** Show disabled save button (requires save callback) */
  showDisabledSaveButton?: boolean

  /** Default view mode for the PDF */
  defaultViewMode?: ViewMode

  /** Dock page controls at bottom */
  dockPageControls?: boolean

  /** Focus on rendering when viewer loads */
  focusOnRendering?: boolean

  /** Include PDF annotations in saved PDF */
  includePDFAnnotations?: boolean

  /** Linear loading (for faster initial render) */
  enableLinearization?: boolean

  /** Exit PDF full screen mode on ESC key */
  exitPDFFullScreen?: boolean
}

/**
 * Embed Modes
 */
export type EmbedMode =
  | 'FULL_WINDOW'      // Full browser window
  | 'SIZED_CONTAINER'  // Fits to container size
  | 'IN_LINE'          // Inline display
  | 'LIGHT_BOX'        // Modal/overlay display

/**
 * View Modes
 */
export type ViewMode =
  | 'FIT_PAGE'        // Fit entire page in view
  | 'FIT_WIDTH'       // Fit page width
  | 'SINGLE_PAGE'     // Single page view
  | 'TWO_COLUMN'      // Two column view
  | 'TWO_COLUMN_FIT'  // Two column fit width

/**
 * File Promise for Adobe API
 */
export interface FilePromise {
  /** PDF content as Promise of ArrayBuffer, Uint8Array, or Blob */
  content: Promise<ArrayBuffer | Uint8Array | Blob>

  /** File metadata */
  metaData: {
    /** Name of the PDF file */
    fileName: string

    /** Optional unique identifier */
    id?: string

    /** Optional MIME type */
    mimeType?: string
  }
}

/**
 * Save Options
 */
export interface SaveOptions {
  /** Enable auto-save */
  autoSave?: boolean

  /** Enable form filling in saved PDF */
  enableFormFilling?: boolean

  /** Flatten form fields and annotations */
  flatten?: boolean

  /** Include comments in saved PDF */
  includeComments?: boolean
}

/**
 * Save Result
 */
export interface SaveResult {
  /** PDF data as ArrayBuffer */
  data: ArrayBuffer

  /** Filename */
  filename: string

  /** File size in bytes */
  size?: number
}

/**
 * Form Field Data (key-value pairs)
 */
export type FormFieldData = Record<string, any>

/**
 * Annotation Manager
 */
export interface AnnotationManager {
  /**
   * Add event listener for annotation events
   * @param eventName - Event type to listen for
   * @param handler - Event handler function
   */
  addEventListener: (
    eventName: AnnotationEventType,
    handler: (event: AnnotationEventData) => void
  ) => void

  /**
   * Remove event listener
   * @param eventName - Event type to stop listening for
   * @param handler - Event handler function to remove
   */
  removeEventListener: (
    eventName: AnnotationEventType,
    handler: (event: AnnotationEventData) => void
  ) => void

  /**
   * Get all annotations
   * @returns Promise resolving to array of annotations
   */
  getAnnotations?: () => Promise<Annotation[]>

  /**
   * Add annotation programmatically
   * @param annotation - Annotation to add
   * @returns Promise resolving when annotation is added
   */
  addAnnotation?: (annotation: Annotation) => Promise<void>

  /**
   * Update annotation
   * @param annotationId - ID of annotation to update
   * @param updates - Properties to update
   * @returns Promise resolving when annotation is updated
   */
  updateAnnotation?: (annotationId: string, updates: Partial<Annotation>) => Promise<void>

  /**
   * Delete annotation
   * @param annotationId - ID of annotation to delete
   * @returns Promise resolving when annotation is deleted
   */
  deleteAnnotation?: (annotationId: string) => Promise<void>
}

/**
 * Annotation Event Types
 */
export type AnnotationEventType =
  | 'ANNOTATION_ADDED'
  | 'ANNOTATION_UPDATED'
  | 'ANNOTATION_DELETED'
  | 'ANNOTATION_CLICKED'
  | 'ANNOTATION_SELECTED'
  | 'ANNOTATION_DESELECTED'

/**
 * Annotation Event Data
 */
export interface AnnotationEventData {
  /** Annotation ID */
  id?: string

  /** Annotation type */
  type?: AnnotationType

  /** Annotation content/text */
  content?: string

  /** Page number (1-indexed) */
  pageNumber?: number

  /** Position on page */
  position?: AnnotationPosition

  /** Author/creator */
  author?: string

  /** Creation timestamp */
  createdAt?: string

  /** Modification timestamp */
  modifiedAt?: string

  /** Annotation color */
  color?: string

  /** Additional properties */
  [key: string]: any
}

/**
 * Annotation
 */
export interface Annotation {
  /** Unique annotation ID */
  id: string

  /** Annotation type */
  type: AnnotationType

  /** Page number (1-indexed) */
  pageNumber: number

  /** Position and dimensions */
  position: AnnotationPosition

  /** Annotation content/text */
  content?: string

  /** Author */
  author?: string

  /** Color (hex or rgb) */
  color?: string

  /** Creation date */
  createdAt?: string

  /** Modification date */
  modifiedAt?: string

  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Annotation Types
 */
export type AnnotationType =
  | 'text'
  | 'highlight'
  | 'strikethrough'
  | 'underline'
  | 'freetext'
  | 'note'
  | 'stamp'
  | 'ink'
  | 'shape'
  | 'line'
  | 'arrow'

/**
 * Annotation Position
 */
export interface AnnotationPosition {
  /** X coordinate */
  x: number

  /** Y coordinate */
  y: number

  /** Width */
  width: number

  /** Height */
  height: number
}

/**
 * Field Click Event
 */
export interface FieldClickEvent {
  /** Field name/ID */
  fieldName: string

  /** Field type */
  fieldType: FormFieldType

  /** Current field value */
  value: any

  /** Page number */
  pageNumber?: number

  /** Field position */
  position?: AnnotationPosition

  /** Additional properties */
  [key: string]: any
}

/**
 * Form Field Types
 */
export type FormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'listbox'
  | 'signature'
  | 'button'

/**
 * Callback Types (for registerCallback)
 */
export enum CallbackType {
  /** Save operation callback */
  SAVE_API = 0,

  /** Print operation callback */
  PRINT_API = 1,

  /** File preview callback */
  FILE_PREVIEW_API = 2,
}

/**
 * Error Types
 */
export interface AdobePdfError {
  /** Error code */
  code: string | number

  /** Error message */
  message: string

  /** Error details */
  details?: any

  /** Stack trace (if available) */
  stack?: string
}

/**
 * PDF Metadata
 */
export interface PdfMetadata {
  /** File name */
  fileName: string

  /** File size in bytes */
  fileSize?: number

  /** Number of pages */
  pageCount?: number

  /** PDF version */
  version?: string

  /** Creation date */
  createdAt?: string

  /** Modification date */
  modifiedAt?: string

  /** Author */
  author?: string

  /** Title */
  title?: string

  /** Subject */
  subject?: string

  /** Keywords */
  keywords?: string[]

  /** Creator application */
  creator?: string

  /** Producer */
  producer?: string
}

/**
 * Loading State
 */
export type LoadingState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

/**
 * Viewer State
 */
export interface ViewerState {
  /** Current loading state */
  loadingState: LoadingState

  /** Current page number (1-indexed) */
  currentPage?: number

  /** Total pages */
  totalPages?: number

  /** Zoom level percentage */
  zoomLevel?: number

  /** Current view mode */
  viewMode?: ViewMode

  /** Current embed mode */
  embedMode?: EmbedMode

  /** Error if any */
  error?: AdobePdfError

  /** Is viewer ready */
  isReady?: boolean

  /** Is saving */
  isSaving?: boolean
}

/**
 * Component Props for AdobePdfViewer
 */
export interface AdobePdfViewerProps {
  /** Adobe API Client ID from Adobe Developer Console */
  clientId: string

  /** PDF URL (data URL or HTTP/HTTPS URL) */
  pdfUrl: string

  /** Display name for the PDF */
  fileName: string

  /** Callback when form field changes */
  onFormFieldChange?: (fieldName: string, value: any) => void

  /** Callback when PDF is saved */
  onSave?: (pdfBlob: Blob) => Promise<void>

  /** Callback when form field is clicked */
  onFieldClick?: (field: FieldClickEvent) => void

  /** Callback when annotation is added */
  onAnnotationAdded?: (annotation: AnnotationEventData) => void

  /** Callback when annotation is updated */
  onAnnotationUpdated?: (annotation: AnnotationEventData) => void

  /** Callback when annotation is deleted */
  onAnnotationDeleted?: (annotation: AnnotationEventData) => void

  /** Callback when viewer is ready */
  onReady?: () => void

  /** Callback when error occurs */
  onError?: (error: AdobePdfError) => void

  /** Embed mode */
  embedMode?: EmbedMode

  /** Show download PDF button */
  showDownloadPDF?: boolean

  /** Show print PDF button */
  showPrintPDF?: boolean

  /** Show annotation tools */
  showAnnotationTools?: boolean

  /** Enable form filling */
  enableFormFilling?: boolean

  /** Default view mode */
  defaultViewMode?: ViewMode

  /** Custom CSS class */
  className?: string

  /** Custom loading component */
  loadingComponent?: React.ReactNode

  /** Custom error component */
  errorComponent?: React.ReactNode

  /** Minimum height for container */
  minHeight?: string | number
}
