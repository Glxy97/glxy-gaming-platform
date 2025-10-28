/**
 * Web-Adobe PDF Upload Dialog
 * Multi-file drag & drop with real-time progress tracking via Socket.IO
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useWebAdobeSocket } from '@/hooks/use-web-adobe-socket'
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// File Upload Types
interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error'
  progress: number
  error?: string
  documentId?: string
  analysisStage?: 'preprocessing' | 'ocr' | 'field-extraction' | 'validation'
  analysisMessage?: string
}

interface UploadDialogProps {
  onUploadComplete?: (documentIds: string[]) => void
  trigger?: React.ReactNode
  maxFiles?: number
  maxSizeBytes?: number
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['application/pdf']
const DEFAULT_MAX_FILES = 5

export function UploadDialog({
  onUploadComplete,
  trigger,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeBytes = MAX_FILE_SIZE,
}: UploadDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const { subscribe, isConnected } = useWebAdobeSocket()

  // File validation
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return 'Nur PDF-Dateien sind erlaubt'
      }
      if (file.size > maxSizeBytes) {
        return `Datei zu groß (max. ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`
      }
      return null
    },
    [maxSizeBytes]
  )

  // Add files to upload queue
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const validatedFiles: UploadFile[] = []

      for (const file of fileArray) {
        const error = validateFile(file)
        validatedFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          status: error ? 'error' : 'pending',
          progress: 0,
          error: error || undefined,
        })
      }

      setFiles((prev) => {
        const combined = [...prev, ...validatedFiles]
        return combined.slice(0, maxFiles)
      })
    },
    [validateFile, maxFiles]
  )

  // Remove file from queue
  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  // Upload single file
  const uploadFile = useCallback(
    async (uploadFile: UploadFile) => {
      const fileId = uploadFile.id

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f
          )
        )

        // Create FormData
        const formData = new FormData()
        formData.append('file', uploadFile.file)

        // Upload to API
        const response = await fetch('/api/web-adobe/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload fehlgeschlagen')
        }

        const result = await response.json()
        const documentId = result.document.id

        // Update with documentId and switch to analyzing status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  documentId,
                  status: 'analyzing',
                  progress: 10,
                  analysisStage: 'preprocessing',
                  analysisMessage: 'Analyse wird vorbereitet...',
                }
              : f
          )
        )

        // Subscribe to Socket.IO events for this document
        const cleanup = subscribe(documentId, {
          onStart: (data) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.documentId === documentId
                  ? {
                      ...f,
                      analysisStage: 'preprocessing',
                      analysisMessage: `Analyse gestartet (${data.totalPages} Seiten)`,
                      progress: 15,
                    }
                  : f
              )
            )
          },
          onProgress: (data) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.documentId === documentId
                  ? {
                      ...f,
                      analysisStage: data.stage,
                      analysisMessage:
                        data.message || `${data.stage} (Seite ${data.currentPage}/${data.totalPages})`,
                      progress: Math.min(15 + data.progress * 0.8, 95),
                    }
                  : f
              )
            )
          },
          onComplete: (data) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.documentId === documentId
                  ? {
                      ...f,
                      status: 'success',
                      progress: 100,
                      analysisMessage: `${data.totalFields} Felder extrahiert`,
                    }
                  : f
              )
            )
            cleanup()
          },
          onError: (data) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.documentId === documentId
                  ? {
                      ...f,
                      status: 'error',
                      error: data.error,
                      analysisMessage: `Fehler: ${data.error}`,
                    }
                  : f
              )
            )
            cleanup()
          },
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload fehlgeschlagen'
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'error', error: errorMessage } : f
          )
        )
      }
    },
    [subscribe]
  )

  // Upload all pending files
  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')

    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }, [files, uploadFile])

  // Check if all uploads are complete
  const allComplete = files.length > 0 && files.every((f) => f.status === 'success')
  const hasErrors = files.some((f) => f.status === 'error')
  const isUploading = files.some(
    (f) => f.status === 'uploading' || f.status === 'analyzing'
  )

  // Handle successful completion
  const handleComplete = useCallback(() => {
    const documentIds = files
      .filter((f) => f.documentId)
      .map((f) => f.documentId!)

    if (onUploadComplete) {
      onUploadComplete(documentIds)
    } else {
      // Default: redirect to first document
      if (documentIds.length > 0) {
        router.push(`/web-adobe/documents/${documentIds[0]}`)
      }
    }

    setOpen(false)
    setFiles([])
  }, [files, onUploadComplete, router])

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles)
      }
    },
    [addFiles]
  )

  // File input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
      // Reset input
      e.target.value = ''
    },
    [addFiles]
  )

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setFiles([])
      setIsDragging(false)
      dragCounterRef.current = 0
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Datei auswählen
          </Button>
        )}
      </DialogTrigger>

      <DialogOverlay />

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF-Dateien hochladen</DialogTitle>
          <DialogDescription>
            Laden Sie bis zu {maxFiles} PDF-Formulare hoch (max.{' '}
            {Math.round(maxSizeBytes / 1024 / 1024)}MB pro Datei)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Connection Status */}
          {!isConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verbindung getrennt</AlertTitle>
              <AlertDescription>
                Echtzeit-Updates sind nicht verfügbar. Upload funktioniert weiterhin.
              </AlertDescription>
            </Alert>
          )}

          {/* Drag & Drop Zone */}
          {files.length < maxFiles && !isUploading && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                Dateien hierher ziehen oder klicken
              </p>
              <p className="text-xs text-muted-foreground">
                PDF-Dateien, max. {Math.round(maxSizeBytes / 1024 / 1024)}MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Dateien ({files.length}/{maxFiles})
                </h3>
                {files.some((f) => f.status === 'pending') && !isUploading && (
                  <Button onClick={uploadAll} size="sm">
                    <Upload className="mr-2 h-3 w-3" />
                    Alle hochladen
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {files.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    {/* File Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {uploadFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {uploadFile.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {(uploadFile.status === 'uploading' ||
                          uploadFile.status === 'analyzing') && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                        {uploadFile.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(uploadFile.status === 'uploading' ||
                      uploadFile.status === 'analyzing') && (
                      <div className="space-y-1">
                        <Progress value={uploadFile.progress} />
                        <p className="text-xs text-muted-foreground">
                          {uploadFile.analysisMessage || 'Wird hochgeladen...'}
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {uploadFile.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Success Message */}
                    {uploadFile.status === 'success' && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>{uploadFile.analysisMessage || 'Erfolgreich'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {files.length > 0 && (
            <div className="flex gap-2 pt-4 border-t">
              {allComplete ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiles([])
                      setOpen(false)
                    }}
                    className="flex-1"
                  >
                    Schließen
                  </Button>
                  <Button onClick={handleComplete} className="flex-1">
                    Zu den Dokumenten
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setFiles([])}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Alle entfernen
                  </Button>
                  {hasErrors && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFiles((prev) => prev.filter((f) => f.status !== 'error'))
                      }
                      disabled={isUploading}
                    >
                      Fehler entfernen
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
