/**
 * Web-Adobe Manual Analysis API
 * Trigger or re-trigger field analysis for a specific document
 *
 * POST /api/web-adobe/analyze/[documentId]
 * - Starts analysis in background
 * - Returns 202 Accepted (Background Job)
 * - Use Socket.IO to receive progress updates
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  analyzeDocument,
  reanalyzeDocument,
  isDocumentReady,
} from '@/lib/web-adobe/field-analysis-worker'

interface RouteContext {
  params: Promise<{
    documentId: string
  }>
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { documentId } = await context.params

    // Verify document exists and belongs to user
    const document = await prisma.pdfDocument.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        filename: true,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Check if document file exists
    const isReady = await isDocumentReady(documentId)
    if (!isReady) {
      return NextResponse.json(
        { error: 'Document file not found on disk' },
        { status: 400 }
      )
    }

    // Check if already analyzing
    if (document.status === 'ANALYZING') {
      return NextResponse.json(
        {
          message: 'Document is already being analyzed',
          documentId,
          status: document.status,
        },
        { status: 409 }
      )
    }

    // Determine if this is a re-analysis
    const existingFields = await prisma.pdfField.count({
      where: { documentId },
    })

    const isReanalysis = existingFields > 0

    // Start background analysis
    if (isReanalysis) {
      console.log(`🔄 Re-analyzing document ${documentId}...`)
      reanalyzeDocument(documentId).catch(err => {
        console.error(`❌ Re-analysis failed for document ${documentId}:`, err)
      })
    } else {
      console.log(`🚀 Starting analysis for document ${documentId}...`)
      analyzeDocument(documentId).catch(err => {
        console.error(`❌ Analysis failed for document ${documentId}:`, err)
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: isReanalysis
          ? 'Re-analysis started. Connect to Socket.IO for progress updates.'
          : 'Analysis started. Connect to Socket.IO for progress updates.',
        documentId,
        isReanalysis,
        socketNamespace: '/web-adobe',
        socketEvent: 'document:subscribe',
      },
      { status: 202 } // 202 Accepted (Background job)
    )

  } catch (error) {
    console.error('Analysis trigger error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start analysis',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Check analysis status
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { documentId } = await context.params

    // Get document with field count
    const document = await prisma.pdfDocument.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { fields: true },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    const isReady = await isDocumentReady(documentId)

    return NextResponse.json({
      documentId,
      status: document.status,
      filename: document.filename,
      pageCount: document.pageCount,
      fieldCount: document._count.fields,
      fileReady: isReady,
      canAnalyze: isReady && document.status !== 'ANALYZING',
      lastUpdated: document.updatedAt,
    })

  } catch (error) {
    console.error('Analysis status error:', error)
    return NextResponse.json(
      { error: 'Failed to get analysis status' },
      { status: 500 }
    )
  }
}
