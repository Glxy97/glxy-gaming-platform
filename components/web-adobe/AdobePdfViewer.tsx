'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type {
  AdobePdfViewerProps,
  AdobeViewer,
  AdobeViewSDK,
  ViewerConfig,
  FilePromise,
  AnnotationManager,
  ViewerAPIs,
  AnnotationEventData,
  AdobePdfError,
} from './types'

/**
 * Production-ready Adobe PDF Embed API Component for Next.js 15
 *
 * Features:
 * - Client-side only rendering (Next.js 15 compatible)
 * - Full TypeScript support with comprehensive types
 * - Data URL and HTTP URL support
 * - Form field editing with real-time callbacks
 * - Annotation support with event handlers
 * - PDF save functionality
 * - Proper error handling and loading states
 * - Automatic cleanup on unmount
 * - Memory-efficient viewer initialization
 *
 * @example
 * ```tsx
 * <AdobePdfViewer
 *   clientId={process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID!}
 *   pdfUrl="https://example.com/document.pdf"
 *   fileName="document.pdf"
 *   onFormFieldChange={(field, value) => console.log(field, value)}
 *   onSave={async (blob) => await uploadPdf(blob)}
 * />
 * ```
 */
export const AdobePdfViewer: React.FC<AdobePdfViewerProps> = ({
  pdfUrl,
  clientId,
  fileName,
  onFormFieldChange,
  onSave,
  onFieldClick,
  onAnnotationAdded,
  onAnnotationUpdated,
  onAnnotationDeleted,
  onReady,
  onError,
  embedMode = 'SIZED_CONTAINER',
  showDownloadPDF = true,
  showPrintPDF = true,
  showAnnotationTools = false,
  enableFormFilling = true,
  defaultViewMode = 'FIT_WIDTH',
  className = '',
  loadingComponent,
  errorComponent,
  minHeight = '600px',
}) => {
  // Refs
  const viewerRef = useRef<HTMLDivElement>(null)
  const adobeViewRef = useRef<AdobeViewer | null>(null)
  const scriptLoadedRef = useRef(false)
  const mountedRef = useRef(true)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const annotationHandlersRef = useRef<Map<string, (event: any) => void>>(new Map())

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [viewerReady, setViewerReady] = useState(false)

  /**
   * Load Adobe PDF Embed API Script
   * Uses ref to ensure script is only loaded once globally
   */
  useEffect(() => {
    // Check if script already loaded
    if (scriptLoadedRef.current || document.querySelector('script[src*="documentservices.adobe.com"]')) {
      scriptLoadedRef.current = true
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js'
    script.async = true

    script.onload = () => {
      if (mountedRef.current) {
        scriptLoadedRef.current = true
        setIsScriptLoaded(true)
      }
    }

    script.onerror = () => {
      if (mountedRef.current) {
        const err: AdobePdfError = {
          code: 'SCRIPT_LOAD_ERROR',
          message: 'Failed to load Adobe PDF Embed API script',
        }
        setError(err.message)
        setIsLoading(false)
        onError?.(err)
      }
    }

    document.body.appendChild(script)

    return () => {
      // Keep script for reuse across component instances
    }
  }, [onError])

  /**
   * Convert URL to ArrayBuffer for Adobe API
   * Supports both data URLs (base64) and HTTP/HTTPS URLs
   */
  const fetchPdfAsArrayBuffer = useCallback(async (url: string): Promise<ArrayBuffer> => {
    try {
      // Handle data URLs (base64)
      if (url.startsWith('data:')) {
        const base64Data = url.split(',')[1]
        if (!base64Data) {
          throw new Error('Invalid data URL format')
        }

        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes.buffer
      }

      // Handle HTTP/HTTPS URLs
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('pdf')) {
        console.warn(`Unexpected content-type: ${contentType}`)
      }

      return await response.arrayBuffer()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      throw new Error(`Failed to load PDF: ${message}`)
    }
  }, [])

  /**
   * Setup form field change polling
   * Adobe SDK doesn't have real-time form field events, so we poll
   */
  const setupFormFieldPolling = useCallback(
    (apis: ViewerAPIs) => {
      if (!enableFormFilling || !onFormFieldChange) {
        return
      }

      // Clear existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      pollIntervalRef.current = setInterval(async () => {
        if (!mountedRef.current || !adobeViewRef.current) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          return
        }

        try {
          const formData = await apis.getFormFieldData()
          if (formData && onFormFieldChange) {
            Object.entries(formData).forEach(([fieldName, value]) => {
              onFormFieldChange(fieldName, value)
            })
          }
        } catch (err) {
          console.error('Error polling form data:', err)
        }
      }, 1000)
    },
    [enableFormFilling, onFormFieldChange]
  )

  /**
   * Setup annotation event handlers
   */
  const setupAnnotationHandlers = useCallback(
    async (viewer: AdobeViewer) => {
      if (!showAnnotationTools) {
        return
      }

      try {
        await viewer.enableAnnotationAPIs()
        const annotationManager = await viewer.getAnnotationManager()

        // Clear existing handlers
        annotationHandlersRef.current.forEach((handler, eventName) => {
          annotationManager.removeEventListener(eventName as any, handler)
        })
        annotationHandlersRef.current.clear()

        // Setup annotation added handler
        if (onAnnotationAdded) {
          const handler = (event: AnnotationEventData) => {
            if (mountedRef.current) {
              onAnnotationAdded(event)
            }
          }
          annotationManager.addEventListener('ANNOTATION_ADDED', handler)
          annotationHandlersRef.current.set('ANNOTATION_ADDED', handler)
        }

        // Setup annotation updated handler
        if (onAnnotationUpdated) {
          const handler = (event: AnnotationEventData) => {
            if (mountedRef.current) {
              onAnnotationUpdated(event)
            }
          }
          annotationManager.addEventListener('ANNOTATION_UPDATED', handler)
          annotationHandlersRef.current.set('ANNOTATION_UPDATED', handler)
        }

        // Setup annotation deleted handler
        if (onAnnotationDeleted) {
          const handler = (event: AnnotationEventData) => {
            if (mountedRef.current) {
              onAnnotationDeleted(event)
            }
          }
          annotationManager.addEventListener('ANNOTATION_DELETED', handler)
          annotationHandlersRef.current.set('ANNOTATION_DELETED', handler)
        }
      } catch (err) {
        console.error('Error setting up annotation handlers:', err)
      }
    },
    [showAnnotationTools, onAnnotationAdded, onAnnotationUpdated, onAnnotationDeleted]
  )

  /**
   * Initialize Adobe PDF Viewer
   * Main initialization logic with comprehensive error handling
   */
  useEffect(() => {
    if (!isScriptLoaded || !viewerRef.current || !clientId || !pdfUrl) {
      return
    }

    mountedRef.current = true

    const initializeViewer = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setViewerReady(false)

        // Wait for Adobe DC View to be available with timeout
        const maxRetries = 50 // 5 seconds
        let retries = 0
        while (!window.AdobeDC && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          retries++
        }

        if (!window.AdobeDC) {
          throw new Error('Adobe DC View SDK not available after timeout')
        }

        // Generate unique div ID
        const divId = `adobe-dc-view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        if (viewerRef.current) {
          viewerRef.current.id = divId
        }

        // Initialize Adobe DC View
        const adobeDCView: AdobeViewSDK = new window.AdobeDC.View({
          clientId,
          divId,
        })

        // Fetch PDF content
        const pdfArrayBuffer = await fetchPdfAsArrayBuffer(pdfUrl)

        if (!mountedRef.current) return

        // Configure viewer
        const viewerConfig: ViewerConfig = {
          embedMode,
          showDownloadPDF,
          showPrintPDF,
          showLeftHandPanel: true,
          showAnnotationTools,
          showPageControls: true,
          enableFormFilling,
          enableSearchAPIs: true,
          showDisabledSaveButton: !!onSave,
          defaultViewMode,
          dockPageControls: embedMode !== 'FULL_WINDOW',
          focusOnRendering: false,
        }

        // Create file promise
        const filePromise: FilePromise = {
          content: Promise.resolve(pdfArrayBuffer),
          metaData: {
            fileName,
            id: `pdf-${Date.now()}`,
          },
        }

        // Preview file
        const adobeViewer = await adobeDCView.previewFile(filePromise, viewerConfig)

        if (!mountedRef.current) return

        adobeViewRef.current = adobeViewer

        // Get APIs
        const apis = await adobeViewer.getAPIs()

        // Enable form filling
        if (enableFormFilling) {
          await apis.enableFormFieldEditability()
          setupFormFieldPolling(apis)
        }

        // Setup annotation handlers
        await setupAnnotationHandlers(adobeViewer)

        if (!mountedRef.current) return

        setIsLoading(false)
        setViewerReady(true)
        onReady?.()
      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize PDF viewer'
          const pdfError: AdobePdfError = {
            code: 'INIT_ERROR',
            message: errorMessage,
            details: err,
          }
          setError(errorMessage)
          setIsLoading(false)
          console.error('Adobe PDF Viewer Error:', err)
          onError?.(pdfError)
        }
      }
    }

    initializeViewer()

    return () => {
      mountedRef.current = false

      // Clear polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }

      // Clear annotation handlers
      annotationHandlersRef.current.clear()

      // Clear viewer reference
      adobeViewRef.current = null
    }
  }, [
    isScriptLoaded,
    clientId,
    pdfUrl,
    fileName,
    embedMode,
    showDownloadPDF,
    showPrintPDF,
    showAnnotationTools,
    enableFormFilling,
    defaultViewMode,
    onSave,
    onReady,
    onError,
    fetchPdfAsArrayBuffer,
    setupFormFieldPolling,
    setupAnnotationHandlers,
  ])

  /**
   * Handle Save PDF
   * Allows external components to trigger PDF save
   */
  const handleSavePdf = useCallback(async () => {
    if (!adobeViewRef.current || !onSave) {
      console.warn('Cannot save: viewer not ready or no save callback provided')
      return
    }

    try {
      const result = await adobeViewRef.current.saveAsPDF({
        enableFormFilling: true,
        flatten: false,
      })

      const pdfBlob = new Blob([result.data], { type: 'application/pdf' })
      await onSave(pdfBlob)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save PDF'
      const pdfError: AdobePdfError = {
        code: 'SAVE_ERROR',
        message: errorMessage,
        details: err,
      }
      setError(errorMessage)
      console.error('Error saving PDF:', err)
      onError?.(pdfError)
    }
  }, [onSave, onError])

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ minHeight }}
      >
        {loadingComponent || (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Loading PDF viewer...
            </p>
          </div>
        )}
      </div>
    )
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ minHeight }}
      >
        {errorComponent || (
          <div className="flex flex-col items-center gap-4 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              PDF Viewer Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 text-center">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              type="button"
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    )
  }

  /**
   * Render PDF viewer
   */
  return (
    <div
      className={`adobe-pdf-viewer-container ${className}`}
      style={{
        width: '100%',
        minHeight: embedMode === 'FULL_WINDOW' ? '100vh' : minHeight,
      }}
    >
      <div
        ref={viewerRef}
        className="adobe-dc-view"
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Hidden save button for programmatic access */}
      {onSave && (
        <button
          onClick={handleSavePdf}
          className="hidden"
          aria-label="Save PDF"
          type="button"
          disabled={!viewerReady}
        />
      )}
    </div>
  )
}

export default AdobePdfViewer
