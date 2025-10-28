/**
 * Documents Page - Web-Adobe Integration
 * Server Component with client-side interactive list
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { DocumentList } from '@/components/web-adobe/document-list'
import { DocumentSearch } from '@/components/web-adobe/document-search'
import { DocumentStatusFilter } from '@/components/web-adobe/document-status-filter'
import { DocumentRefreshButton } from '@/components/web-adobe/document-refresh-button'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { PdfDocumentStatus } from '@prisma/client'

export const metadata = {
  title: 'Meine Dokumente | Web-Adobe',
  description: 'Verwalten Sie Ihre PDF-Dokumente mit Adobe Integration',
}

async function getDocuments(searchParams: {
  status?: string
  search?: string
  page?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const limit = 20
  const page = parseInt(searchParams.page || '1', 10)
  const offset = (page - 1) * limit
  const status = searchParams.status as PdfDocumentStatus | undefined
  const search = searchParams.search || ''

  try {
    const where = {
      userId: session.user.id,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { filename: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [documents, total] = await Promise.all([
      prisma.pdfDocument.findMany({
        where,
        include: {
          _count: {
            select: { fields: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.pdfDocument.count({ where }),
    ])

    return {
      documents: documents.map(doc => ({
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),
      total,
      hasMore: offset + documents.length < total,
      limit,
      offset,
    }
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return null
  }
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/web-adobe/documents')
  }

  const params = await searchParams
  const initialData = await getDocuments(params)

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meine Dokumente</h1>
          <p className="text-muted-foreground mt-2">
            Verwalten Sie Ihre PDF-Dokumente mit Adobe Integration
          </p>
        </div>
        <Link href="/web-adobe/upload">
          <Button size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Dokument hochladen
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <DocumentSearch defaultValue={params.search} />
        </div>
        <DocumentStatusFilter defaultValue={params.status} />
        <DocumentRefreshButton />
      </div>

      {/* Document Count */}
      {initialData && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {initialData.total} {initialData.total === 1 ? 'Dokument' : 'Dokumente'}{' '}
            gefunden
          </p>
        </div>
      )}

      {/* Document List */}
      <Suspense fallback={<DocumentListSkeleton />}>
        <DocumentList
          initialData={initialData || undefined}
          statusFilter={params.status as PdfDocumentStatus | undefined}
          searchQuery={params.search}
        />
      </Suspense>
    </div>
  )
}

// Loading skeleton
function DocumentListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
