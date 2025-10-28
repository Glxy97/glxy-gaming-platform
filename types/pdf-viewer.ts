/**
 * PDF Viewer Type Definitions
 * Comprehensive type system for interactive PDF viewing and form field manipulation
 *
 * NOTE: Local type aliases used for SSR compatibility (pdfjs-dist removed)
 */

// Local type aliases (pdfjs-dist removed for SSR compatibility)
type PDFDocumentProxy = any
type PDFPageProxy = any

// ============================================================================
// Core PDF Types
// ============================================================================

export interface PdfDocument {
  /** PDF.js Document Proxy */
  proxy: PDFDocumentProxy
  /** Dokument-URL oder Data-URL */
  url: string
  /** Dateiname */
  fileName: string
  /** Dateigröße in Bytes */
  fileSize: number
  /** Gesamtseitenanzahl */
  totalPages: number
  /** Metadaten */
  metadata?: PdfMetadata
  /** Erkannte Formularfelder */
  fields: FormField[]
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
  version?: string
  encrypted: boolean
  hasFormFields: boolean
}

// ============================================================================
// Form Field Types
// ============================================================================

export type FormFieldType =
  | 'text'      // Text input (/Tx)
  | 'checkbox'  // Checkbox (/Btn with checkmark)
  | 'radio'     // Radio button (/Btn)
  | 'dropdown'  // Dropdown select (/Ch)
  | 'signature' // Signature field
  | 'button'    // Push button

export type FormFieldSubtype =
  | 'string'
  | 'multiline'
  | 'password'
  | 'fileselect'
  | 'date'
  | 'time'

export interface FormField {
  /** Eindeutige ID (generiert oder aus PDF-Feld-Name) */
  id: string
  /** Systemname (aus PDF /T Key) */
  name: string
  /** Anzeigename für dataPad App */
  displayName: string
  /** Feldtyp */
  type: FormFieldType
  /** Subtyp (für Textfelder) */
  subtype?: FormFieldSubtype
  /** Aktueller Wert */
  value: string | boolean | null
  /** Standardwert */
  defaultValue?: string | boolean
  /** Seite (1-basiert) */
  page: number
  /** Position und Größe auf der Seite */
  rect: FieldRect
  /** Tab-Reihenfolge */
  tabIndex?: number
  /** Pflichtfeld */
  required: boolean
  /** Schreibgeschützt */
  readOnly: boolean
  /** Multiline (nur für Text) */
  multiline: boolean
  /** Maximale Zeichenlänge */
  maxLength?: number
  /** Optionen für Dropdown/Radio */
  options?: FieldOption[]
  /** Validierungsregeln */
  validation?: ValidationRule
  /** Zusätzliche Metadaten */
  metadata: FieldMetadata
}

export interface FieldRect {
  /** X-Koordinate (links) */
  x: number
  /** Y-Koordinate (oben, PDF-Koordinatensystem) */
  y: number
  /** Breite */
  width: number
  /** Höhe */
  height: number
}

export interface FieldOption {
  label: string
  value: string
  selected?: boolean
}

export interface ValidationRule {
  pattern?: string
  min?: number
  max?: number
  message?: string
  custom?: (value: any) => boolean
}

export interface FieldMetadata {
  /** Original PDF-Feldname */
  pdfFieldName: string
  /** Font-Name */
  fontName?: string
  /** Font-Größe */
  fontSize?: number
  /** Textfarbe (RGB) */
  textColor?: [number, number, number]
  /** Hintergrundfarbe (RGB) */
  backgroundColor?: [number, number, number]
  /** Rahmenfarbe (RGB) */
  borderColor?: [number, number, number]
  /** Rahmenbreite */
  borderWidth?: number
  /** Text-Ausrichtung */
  alignment?: 'left' | 'center' | 'right'
  /** Checkbox-Status (für /Btn) */
  checkboxState?: 'Off' | 'Yes' | 'Ja' | string
  /** Tooltip */
  tooltip?: string
}

// ============================================================================
// Viewer State Types
// ============================================================================

export type ViewMode =
  | 'single'      // Einzelseite
  | 'continuous'  // Durchgehend scrollen
  | 'two-page'    // Zwei Seiten nebeneinander
  | 'book'        // Buchmodus (mit Lücke in der Mitte)

export type ZoomMode =
  | 'custom'      // Benutzerdefiniert
  | 'fit-width'   // Breite anpassen
  | 'fit-page'    // Ganze Seite
  | 'auto'        // Automatisch

export interface ViewerState {
  /** Aktuelles Dokument */
  document: PdfDocument | null
  /** Aktuelle Seite (1-basiert) */
  currentPage: number
  /** Zoom-Faktor (1.0 = 100%) */
  zoom: number
  /** Zoom-Modus */
  zoomMode: ZoomMode
  /** Rotation in Grad (0, 90, 180, 270) */
  rotation: number
  /** View-Modus */
  viewMode: ViewMode
  /** Ausgewählte Feld-IDs */
  selectedFieldIds: string[]
  /** Formularfeld-Overlay anzeigen */
  showFieldOverlay: boolean
  /** Ladevorgang aktiv */
  isLoading: boolean
  /** Fehler */
  error: string | null
}

// ============================================================================
// Interaction Types
// ============================================================================

export interface FieldSelection {
  fieldIds: string[]
  /** Auswahlrechteck (für Multi-Select via Drag) */
  selectionRect?: SelectionRect
}

export interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
  page: number
}

export interface FieldDragState {
  fieldId: string
  /** Ursprüngliche Position */
  originalRect: FieldRect
  /** Aktuelle Maus-Position */
  currentX: number
  currentY: number
  /** Offset von Feld-Origin */
  offsetX: number
  offsetY: number
}

export type ContextMenuAction =
  | 'edit'
  | 'delete'
  | 'duplicate'
  | 'copy'
  | 'paste'
  | 'properties'
  | 'move'
  | 'resize'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'bring-to-front'
  | 'send-to-back'

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  fieldId: string | null
  actions: ContextMenuAction[]
}

// ============================================================================
// Rendering Types
// ============================================================================

export interface RenderOptions {
  /** Canvas-Element für Rendering */
  canvas: HTMLCanvasElement
  /** Seite (PDF.js Proxy) */
  page: PDFPageProxy
  /** Skalierung */
  scale: number
  /** Rotation */
  rotation: number
  /** Viewport-Transform */
  transform?: number[]
  /** Hintergrundfarbe */
  background?: string
}

export interface PageRenderState {
  page: number
  rendering: boolean
  rendered: boolean
  error: string | null
  canvas?: HTMLCanvasElement
  timestamp: number
}

// ============================================================================
// Event Types
// ============================================================================

export interface FieldEvent {
  type: 'click' | 'dblclick' | 'contextmenu' | 'drag' | 'drop'
  fieldId: string
  field: FormField
  event: MouseEvent | DragEvent
}

export interface ViewerEvent {
  type: 'zoom' | 'pan' | 'rotate' | 'page-change' | 'scroll'
  data: unknown
  event?: Event
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceMetrics {
  /** PDF-Ladezeit (ms) */
  loadTime: number
  /** Rendering-Zeit pro Seite (ms) */
  renderTimes: Map<number, number>
  /** Formularfeld-Parsing-Zeit (ms) */
  parseTime: number
  /** Speichernutzung (MB) */
  memoryUsage?: number
  /** Frames pro Sekunde (bei Scroll) */
  fps?: number
}

// ============================================================================
// Export/Import Types
// ============================================================================

export interface FieldDataExport {
  /** Dokument-Kontext */
  documentName: string
  /** Exportzeitpunkt */
  exportedAt: Date
  /** Version des Export-Formats */
  version: string
  /** Formularfelder */
  fields: FormField[]
  /** Zusätzliche Metadaten */
  metadata?: Record<string, unknown>
}

export interface FdfImportOptions {
  /** Felder überschreiben, die bereits Werte haben */
  overwrite: boolean
  /** Nur angegebene Felder importieren */
  fieldNames?: string[]
  /** Validierung vor Import */
  validate: boolean
}

// ============================================================================
// Error Types
// ============================================================================

export enum PdfViewerErrorCode {
  LOAD_FAILED = 'LOAD_FAILED',
  INVALID_PDF = 'INVALID_PDF',
  RENDER_FAILED = 'RENDER_FAILED',
  FIELD_PARSE_FAILED = 'FIELD_PARSE_FAILED',
  UNSUPPORTED_FEATURE = 'UNSUPPORTED_FEATURE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
}

export class PdfViewerError extends Error {
  constructor(
    public code: PdfViewerErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'PdfViewerError'
  }
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface PdfViewerProps {
  /** Dokument-URL oder Blob */
  documentUrl: string | Blob
  /** Initiale Seite */
  initialPage?: number
  /** Initialer Zoom */
  initialZoom?: number
  /** Formularfeld-Overlay anzeigen */
  showFieldOverlay?: boolean
  /** Toolbar anzeigen */
  showToolbar?: boolean
  /** Callbacks */
  onDocumentLoad?: (doc: PdfDocument) => void
  onFieldClick?: (field: FormField) => void
  onFieldUpdate?: (field: FormField) => void
  onFieldsChange?: (fields: FormField[]) => void
  onError?: (error: PdfViewerError) => void
  /** CSS-Klasse */
  className?: string
  /** Höhe (wenn fixiert) */
  height?: string | number
}

export interface FieldOverlayProps {
  /** Seite */
  page: number
  /** Felder auf dieser Seite */
  fields: FormField[]
  /** Ausgewählte Feld-IDs */
  selectedFieldIds: string[]
  /** Zoom-Faktor */
  scale: number
  /** Rotation */
  rotation: number
  /** Overlay sichtbar */
  visible: boolean
  /** Callbacks */
  onFieldClick: (field: FormField, event: MouseEvent) => void
  onFieldDoubleClick: (field: FormField, event: MouseEvent) => void
  onFieldContextMenu: (field: FormField, event: MouseEvent) => void
  onFieldDragStart?: (field: FormField, event: DragEvent) => void
  onFieldDragEnd?: (field: FormField, event: DragEvent) => void
}

export interface ContextMenuProps {
  /** Sichtbar */
  visible: boolean
  /** Position */
  x: number
  y: number
  /** Aktionen */
  actions: Array<{
    action: ContextMenuAction
    label: string
    icon?: React.ReactNode
    shortcut?: string
    onClick: () => void
    disabled?: boolean
  }>
  /** Schließen-Callback */
  onClose: () => void
}

export interface ViewerControlsProps {
  /** Aktuelle Seite */
  currentPage: number
  /** Gesamtseiten */
  totalPages: number
  /** Zoom */
  zoom: number
  /** Zoom-Modus */
  zoomMode: ZoomMode
  /** Rotation */
  rotation: number
  /** View-Modus */
  viewMode: ViewMode
  /** Callbacks */
  onPageChange: (page: number) => void
  onZoomChange: (zoom: number, mode?: ZoomMode) => void
  onRotationChange: (rotation: number) => void
  onViewModeChange: (mode: ViewMode) => void
  onToggleOverlay?: () => void
  /** Overlay-Status */
  overlayVisible?: boolean
}
