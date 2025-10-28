/**
 * Web-Adobe Documents API
 * Handles PDF document management with Prisma
 *
 * GET /api/web-adobe/documents
 * - Query params: status, search, limit, offset
 * - Returns paginated document list with field counts
 *
 * POST /api/web-adobe/documents
 * - Creates new PDF document
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { validateAndSanitizeInput } from '@/lib/auth-security'
import { AuditLogger } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const status = searchParams.get('status') as string | null
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build where clause with input sanitization
    const where: any = {
      userId: session.user.id,
    }

    // Status filter with validation
    if (status && ['DRAFT', 'ANALYZING', 'REVIEW', 'SYNCED', 'ERROR'].includes(status)) {
      where.status = status
    }

    // Search filter with sanitization
    if (search) {
      const sanitizedSearch = validateAndSanitizeInput.search(search)
      if (sanitizedSearch) {
        where.OR = [
          { title: { contains: sanitizedSearch, mode: 'insensitive' as const } },
          { filename: { contains: sanitizedSearch, mode: 'insensitive' as const } },
        ]
      }
    }

    // Fetch documents with field count
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

    return NextResponse.json({
      documents,
      total,
      hasMore: offset + documents.length < total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, filename, storagePath, status, pageCount, fileSize } = body

    // Validate and sanitize input
    const sanitizedTitle = validateAndSanitizeInput.search(title || '')
    const sanitizedFilename = validateAndSanitizeInput.filename(filename || '')
    
    if (!sanitizedTitle || !sanitizedFilename) {
      return NextResponse.json(
        { error: 'Invalid title or filename' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['DRAFT', 'ANALYZING', 'REVIEW', 'SYNCED', 'ERROR']
    const finalStatus = validStatuses.includes(status) ? status : 'DRAFT'

    const document = await prisma.pdfDocument.create({
      data: {
        userId: session.user.id,
        title: sanitizedTitle,
        filename: sanitizedFilename,
        storagePath,
        status: finalStatus,
        pageCount,
        fileSize,
      },
      include: {
        _count: {
          select: { fields: true },
        },
      },
    })

    // Log PDF upload
    await AuditLogger.logPDFAction(
      'PDF_UPLOADED',
      {
        userId: session.user.id,
        sessionId: undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      },
      document.id,
      {
        title: sanitizedTitle,
        filename: sanitizedFilename,
        pageCount,
        fileSize,
        status: finalStatus
      }
    )

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
