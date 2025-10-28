/**
 * Document Viewer Client Component
 * Contains all client-side logic for the document viewer
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamicImport from 'next/dynamic'

import { PropertiesPanel } from '@/components/web-adobe/properties-panel'
import { usePropertiesPanel } from '@/hooks/use-properties-panel'
import { useWebAdobeSocket } from '@/hooks/use-web-adobe-socket'
import {
  batchPrismaToViewer,
  viewerToEditorField,
  prismaToViewerField,
} from '@/lib/web-adobe/field-mapper'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAdobeFieldUpdater } from '@/hooks/use-adobe-field-updater'

// Dynamically load AdobePdfViewer to prevent SSR issues
const AdobePdfViewer = dynamicImport(
  () => import('@/components/web-adobe/AdobePdfViewer').then(mod => ({ default: mod.AdobePdfViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">PDF Viewer wird geladen...</p>
        </div>
      </div>
    )
  }
)
import {
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { FormField } from '@/types/pdf-viewer'
import type { PdfField } from '@prisma/client'

// Status Badge Mapping
const STATUS_COLORS = {
  DRAFT: 'bg-gray-500',
  ANALYZING: 'bg-blue-500',
  REVIEW: 'bg-yellow-500',
  SYNCED: 'bg-green-500',
  ERROR: 'bg-red-500',
} as const

const STATUS_LABELS = {
  DRAFT: 'Entwurf',
  ANALYZING: 'Analysiert',
  REVIEW: 'In Prüfung',
  SYNCED: 'Synchronisiert',
  ERROR: 'Fehler',
} as const

interface DocumentData {
  id: string
  title: string
  filename: string
  status: keyof typeof STATUS_COLORS
  pageCount: number | null
  fileSize: number | null
  createdAt: string
  updatedAt: string
  fields: PdfField[]
  _count: {
    fields: number
  }
}

export function DocumentViewerClient({ documentId }: { documentId: string }) {
  const router = useRouter()

  // State
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Store original fields for rollback
  const [originalFields, setOriginalFields] = useState<Map<string, PdfField>>(new Map())

  // Properties Panel
  const { setSelectedFields, openPanel } = usePropertiesPanel()

  // Socket.IO for real-time updates
  const { subscribe, isConnected } = useWebAdobeSocket()

  // Adobe Field Updater Hook
  const { updateField, isUpdating: isUpdatingField } = useAdobeFieldUpdater(documentId)

  /**
   * Load document from API
   */
  useEffect(() => {
    async function loadDocument() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/web-adobe/documents/${documentId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Dokument nicht gefunden')
          } else if (response.status === 403) {
            throw new Error('Zugriff verweigert')
          } else {
            throw new Error('Fehler beim Laden des Dokuments')
          }
        }

        const data = await response.json()
        setDocument(data.document)
        setPdfDataUrl(data.pdfDataUrl)

        // Store original fields for rollback
        const fieldsMap = new Map<string, PdfField>()
        data.document.fields.forEach((field: PdfField) => {
          fieldsMap.set(field.id, field)
        })
        setOriginalFields(fieldsMap)

        console.log('[DocumentViewer] Dokument geladen:', {
          title: data.document.title,
          fields: data.document.fields.length,
          pdfAvailable: !!data.pdfDataUrl,
        })
      } catch (err: any) {
        console.error('[DocumentViewer] Fehler:', err)
        setError(err.message || 'Unbekannter Fehler')
        toast.error(err.message || 'Dokument konnte nicht geladen werden')
      } finally {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [documentId])

  /**
   * Socket.IO: Subscribe to document updates
   */
  useEffect(() => {
    if (!documentId) return

    const cleanup = subscribe(documentId, {
      onFieldUpdated: (data) => {
        console.log('[Socket] Field updated:', data.field)

        // Update field in local state
        setDocument((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            fields: prev.fields.map((f) =>
              f.id === data.field.id ? { ...f, ...data.field } : f
            ),
          }
        })

        // Update original fields map for future rollbacks
        setOriginalFields((prev) => {
          const newMap = new Map(prev)
          newMap.set(data.field.id, data.field as any)
          return newMap
        })

        // Show notification based on who updated
        if (data.updatedBy === 'user') {
          // Don't show toast for own updates (already shown in Properties Panel)
          console.log('[Socket] Own update confirmed')
        } else if (data.updatedBy === 'ai') {
          toast.info(`KI hat Feld "${data.field.label}" aktualisiert`, {
            description: `Confidence: ${(data.field.confidence * 100).toFixed(0)}%`,
          })
        } else {
          toast.info('Feld wurde von anderem Benutzer aktualisiert')
        }

        // Update Properties Panel if field is currently selected
        ;(setSelectedFields as any)((prev: any[]) => {
          return prev.map((f: any) =>
            f.id === data.field.id ? viewerToEditorField(prismaToViewerField(data.field as any)) as any : f
          )
        })
      },

      onComplete: (data) => {
        console.log('[Socket] Analysis complete:', data)
        toast.success(`Analyse abgeschlossen: ${data.totalFields} Felder extrahiert`)

        // Reload document to get all fields
        window.location.reload()
      },

      onError: (data) => {
        console.error('[Socket] Error:', data.error)
        toast.error(`Fehler: ${data.error}`)
      },
    })

    return cleanup
  }, [documentId, subscribe])

  /**
   * Handle field click in PDF Viewer (legacy - for backward compatibility)
   */
  const handleFieldClick = (field: FormField) => {
    console.log('[DocumentViewer] Field clicked:', field.name)

    // Convert PDF Viewer field to Properties Panel format
    const editorField = viewerToEditorField(field)

    setSelectedFields([editorField as any])
    openPanel()
  }

  /**
   * Handle Adobe form field change
   */
  const handleAdobeFormFieldChange = async (fieldName: string, value: any) => {
    console.log('[DocumentViewer] Adobe field changed:', { fieldName, value })

    try {
      // Update via API (with retry logic)
      await updateField(fieldName, value)

      // Find the database field by name
      const dbField = document?.fields.find(f => f.displayLabel === fieldName || f.pdfName === fieldName)

      if (dbField) {
        // Convert to viewer format and update Properties Panel
        const viewerField = prismaToViewerField(dbField)
        const editorField = viewerToEditorField(viewerField)

        // Update Properties Panel with updated field
        setSelectedFields([editorField as any])
      }

      toast.success(`Feld "${fieldName}" aktualisiert`)
    } catch (error: any) {
      console.error('[DocumentViewer] Field update failed:', error)
      toast.error(`Fehler beim Aktualisieren: ${error.message}`)
    }
  }

  /**
   * Handle Adobe PDF save
   */
  const handleAdobeSave = async (pdfBlob: Blob) => {
    console.log('[DocumentViewer] Adobe PDF save triggered', {
      size: pdfBlob.size,
      type: pdfBlob.type,
    })

    try {
      // TODO: Implement PDF save to server
      // For now, trigger download
      const url = URL.createObjectURL(pdfBlob)
      const link = globalThis.document.createElement('a')
      link.href = url
      link.download = document?.filename || 'document.pdf'
      link.click()
      URL.revokeObjectURL(url)

      toast.success('PDF gespeichert')
    } catch (error: any) {
      console.error('[DocumentViewer] PDF save failed:', error)
      toast.error(`Fehler beim Speichern: ${error.message}`)
    }
  }

  /**
   * Handle Adobe field click (for Properties Panel)
   */
  const handleAdobeFieldClick = (field: any) => {
    console.log('[DocumentViewer] Adobe field clicked:', field)

    // Find corresponding database field
    const dbField = document?.fields.find(
      f => f.displayLabel === field.name || f.pdfName === field.name
    )

    if (dbField) {
      const viewerField = prismaToViewerField(dbField)
      const editorField = viewerToEditorField(viewerField)
      setSelectedFields([editorField as any])
      openPanel()
    }
  }

  /**
   * Handle Adobe annotation added
   */
  const handleAdobeAnnotationAdded = (annotation: any) => {
    console.log('[DocumentViewer] Adobe annotation added:', annotation)
    toast.info('Annotation hinzugefügt')
  }

  /**
   * Handle document delete
   */
  const handleDelete = async () => {
    if (!confirm('Dokument wirklich löschen?')) return

    try {
      const response = await fetch(`/api/web-adobe/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen')
      }

      toast.success('Dokument gelöscht')
      router.push('/web-adobe/documents')
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Löschen')
    }
  }

  /**
   * Handle PDF download
   */
  const handleDownload = () => {
    if (!pdfDataUrl || !document) return

    // Create download link
    const link = globalThis.document.createElement('a')
    link.href = pdfDataUrl
    link.download = document.filename
    link.click()

    toast.success('Download gestartet')
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Dokument wird geladen...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error || !document || !pdfDataUrl) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Fehler beim Laden</h2>
            <p className="text-sm text-muted-foreground">{error || 'Dokument nicht verfügbar'}</p>
          </div>
          <Button onClick={() => router.push('/web-adobe/documents')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    )
  }

  // Transform Database Fields to PDF Viewer Format using mapper
  const viewerFields = batchPrismaToViewer(document.fields)

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/web-adobe/documents')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-lg font-semibold">{document.title}</h1>
              <p className="text-xs text-muted-foreground">
                {document._count.fields} Felder · {document.pageCount || '?'} Seiten
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <Badge className={cn('text-white', STATUS_COLORS[document.status])}>
              {STATUS_LABELS[document.status]}
            </Badge>

            {/* Socket Connection Status */}
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse" />
                Live
              </Badge>
            )}

            {/* Actions */}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content: PDF Viewer + Properties Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Adobe PDF Viewer (70%) */}
        <div className="flex-1 w-[70%] relative">
          {process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID ? (
            <AdobePdfViewer
              clientId={process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID}
              pdfUrl={pdfDataUrl}
              fileName={document.filename}
              onFormFieldChange={handleAdobeFormFieldChange}
              onSave={handleAdobeSave}
              onFieldClick={handleAdobeFieldClick}
              onAnnotationAdded={handleAdobeAnnotationAdded}
              className="h-full w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/30">
              <div className="text-center space-y-4 p-8">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Adobe Client ID fehlt</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bitte registrieren Sie sich bei Adobe und fügen Sie die Client ID hinzu.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://developer.adobe.com/console', '_blank')}
                  >
                    Zu Adobe Developer Console
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel (30%) - Fixed width sidebar */}
        <div className="w-[30%] border-l bg-card overflow-hidden">
          <PropertiesPanel />
        </div>
      </div>

      {/* Footer Stats */}
      <footer className="border-t bg-card px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{document._count.fields} Formularfelder</span>
            <span>·</span>
            <span>
              {document.fileSize
                ? `${(document.fileSize / 1024).toFixed(1)} KB`
                : 'Unbekannte Größe'}
            </span>
          </div>
          <div>
            Zuletzt bearbeitet: {new Date(document.updatedAt).toLocaleDateString('de-DE')}
          </div>
        </div>
      </footer>
    </div>
  )
}
