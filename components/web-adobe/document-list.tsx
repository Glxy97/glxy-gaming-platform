'use client'

/**
 * Document List Component
 * Displays paginated list of PDF documents with actions
 *
 * Features:
 * - Tabular layout with sortable columns
 * - Status badges (color-coded)
 * - Action dropdown (View, Edit, Download, Delete)
 * - Pagination
 * - Loading states and error handling
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Eye,
  Edit,
  Download,
  Trash2,
  MoreVertical,
  RefreshCw,
  FileIcon,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PdfDocumentStatus } from '@prisma/client'

interface PdfDocument {
  id: string
  title: string
  filename: string
  status: PdfDocumentStatus
  pageCount?: number | null
  fileSize?: number | null
  createdAt: string
  updatedAt: string
  _count: {
    fields: number
  }
}

interface DocumentListResponse {
  documents: PdfDocument[]
  total: number
  hasMore: boolean
  limit: number
  offset: number
}

interface DocumentListProps {
  initialData?: DocumentListResponse
  statusFilter?: PdfDocumentStatus | null
  searchQuery?: string
}

const STATUS_COLORS: Record<PdfDocumentStatus, string> = {
  DRAFT: 'bg-gray-500',
  ANALYZING: 'bg-blue-500',
  REVIEW: 'bg-yellow-500',
  SYNCED: 'bg-green-500',
  ERROR: 'bg-red-500',
}

const STATUS_LABELS: Record<PdfDocumentStatus, string> = {
  DRAFT: 'Entwurf',
  ANALYZING: 'Analysiert',
  REVIEW: 'Überprüfung',
  SYNCED: 'Synchronisiert',
  ERROR: 'Fehler',
}

export function DocumentList({
  initialData,
  statusFilter = null,
  searchQuery = '',
}: DocumentListProps) {
  const router = useRouter()
  const [data, setData] = useState<DocumentListResponse | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch documents
  const fetchDocuments = async (offset = 0) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/web-adobe/documents?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const result: DocumentListResponse = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast.error('Fehler beim Laden der Dokumente')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount or when filters change
  useEffect(() => {
    if (!initialData) {
      fetchDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery])

  // Handle delete
  const handleDelete = async (doc: PdfDocument) => {
    if (!confirm(`Dokument "${doc.title}" wirklich löschen?`)) {
      return
    }

    setDeletingId(doc.id)

    try {
      const response = await fetch(`/api/web-adobe/documents/${doc.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      toast.success('Dokument erfolgreich gelöscht')

      // Refresh list
      fetchDocuments(data?.offset || 0)
    } catch (err) {
      toast.error('Fehler beim Löschen des Dokuments')
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle download
  const handleDownload = async (doc: PdfDocument) => {
    try {
      const response = await fetch(`/api/web-adobe/documents/${doc.id}/download`)

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download gestartet')
    } catch (err) {
      toast.error('Fehler beim Download')
      console.error('Download error:', err)
    }
  }

  // Format file size
  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">Fehler: {error}</p>
        <Button onClick={() => fetchDocuments()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Erneut versuchen
        </Button>
      </div>
    )
  }

  // Empty state
  if (!data || data.documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Dokumente gefunden</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery || statusFilter
            ? 'Keine Dokumente entsprechen den Filterkriterien.'
            : 'Laden Sie Ihr erstes PDF-Dokument hoch, um zu beginnen.'}
        </p>
        <Button onClick={() => router.push('/web-adobe/upload')} variant="default">
          Dokument hochladen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Felder</TableHead>
              <TableHead className="text-right">Seiten</TableHead>
              <TableHead className="text-right">Größe</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.documents.map((doc) => (
              <TableRow
                key={doc.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/web-adobe/documents/${doc.id}`)}
              >
                <TableCell>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-sm text-muted-foreground">{doc.filename}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${STATUS_COLORS[doc.status]} text-white`}
                  >
                    {STATUS_LABELS[doc.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm">{doc._count.fields}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm">{doc.pageCount || '-'}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm">{formatFileSize(doc.fileSize)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === doc.id}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/web-adobe/documents/${doc.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Anzeigen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/web-adobe/documents/${doc.id}/edit`)
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Felder bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(doc)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(doc)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(data.offset > 0 || data.hasMore) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Zeige {data.offset + 1} bis {data.offset + data.documents.length} von{' '}
            {data.total} Dokumenten
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchDocuments(Math.max(0, data.offset - data.limit))}
              disabled={data.offset === 0 || loading}
            >
              Zurück
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchDocuments(data.offset + data.limit)}
              disabled={!data.hasMore || loading}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
