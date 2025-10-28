/**
 * Adobe PDF Viewer Module
 *
 * Production-ready Adobe PDF Embed API integration for Next.js 15
 *
 * @module web-adobe
 *
 * @example Basic usage
 * ```tsx
 * import { AdobePdfViewer } from '@/components/web-adobe'
 *
 * export default function PdfPage() {
 *   return (
 *     <AdobePdfViewer
 *       clientId={process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID!}
 *       pdfUrl="https://example.com/document.pdf"
 *       fileName="document.pdf"
 *     />
 *   )
 * }
 * ```
 *
 * @example With form field editing
 * ```tsx
 * import { AdobePdfViewer } from '@/components/web-adobe'
 * import type { AdobePdfViewerProps } from '@/components/web-adobe'
 *
 * export default function FormPdfPage() {
 *   const handleFieldChange = (fieldName: string, value: any) => {
 *     console.log(`Field ${fieldName} changed to:`, value)
 *   }
 *
 *   return (
 *     <AdobePdfViewer
 *       clientId={process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID!}
 *       pdfUrl="/forms/application.pdf"
 *       fileName="application.pdf"
 *       enableFormFilling
 *       onFormFieldChange={handleFieldChange}
 *     />
 *   )
 * }
 * ```
 *
 * @example With annotations
 * ```tsx
 * import { AdobePdfViewer } from '@/components/web-adobe'
 * import type { AnnotationEventData } from '@/components/web-adobe'
 *
 * export default function AnnotatedPdfPage() {
 *   const handleAnnotationAdded = (annotation: AnnotationEventData) => {
 *     console.log('Annotation added:', annotation)
 *   }
 *
 *   return (
 *     <AdobePdfViewer
 *       clientId={process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID!}
 *       pdfUrl="/documents/review.pdf"
 *       fileName="review.pdf"
 *       showAnnotationTools
 *       onAnnotationAdded={handleAnnotationAdded}
 *     />
 *   )
 * }
 * ```
 *
 * @example With save functionality
 * ```tsx
 * import { AdobePdfViewer } from '@/components/web-adobe'
 *
 * export default function EditablePdfPage() {
 *   const handleSave = async (pdfBlob: Blob) => {
 *     const formData = new FormData()
 *     formData.append('pdf', pdfBlob, 'document.pdf')
 *
 *     await fetch('/api/pdf/save', {
 *       method: 'POST',
 *       body: formData,
 *     })
 *   }
 *
 *   return (
 *     <AdobePdfViewer
 *       clientId={process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID!}
 *       pdfUrl="/documents/editable.pdf"
 *       fileName="editable.pdf"
 *       enableFormFilling
 *       onSave={handleSave}
 *     />
 *   )
 * }
 * ```
 */

// Component exports
export { AdobePdfViewer, default } from './AdobePdfViewer'

// Type exports
export type {
  // Core SDK types
  AdobeDCViewConfig,
  AdobeViewSDK,
  AdobeViewer,
  ViewerAPIs,
  ViewerConfig,
  ViewerState,

  // Configuration types
  EmbedMode,
  ViewMode,
  FilePromise,
  SaveOptions,
  SaveResult,

  // Form types
  FormFieldData,
  FormFieldType,
  FieldClickEvent,

  // Annotation types
  AnnotationManager,
  AnnotationEventType,
  AnnotationEventData,
  Annotation,
  AnnotationType,
  AnnotationPosition,

  // Document types
  DocumentAPIs,
  PageAPIs,
  PageImageOptions,
  PdfMetadata,

  // Utility types
  CallbackType,
  LoadingState,
  AdobePdfError,
} from './types'
