/**
 * PDF Compose API
 * POST /api/pdf/[id]/compose - Fill form fields and generate new PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPdf, storeComposedPdf, getComposedPdfUrl } from '@/lib/pdf/storage'
import { composePdf, type FieldValue } from '@/lib/pdf/composer'

export interface ComposeRequest {
  fields: FieldValue[]
  flatten?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: ComposeRequest = await request.json()

    // Get original PDF
    const originalPdf = await getPdf(id)
    if (!originalPdf) {
      return NextResponse.json(
        { error: 'Original PDF not found' },
        { status: 404 }
      )
    }

    // Compose PDF with field values
    const composedPdf = await composePdf(originalPdf, body.fields, {
      flatten: body.flatten,
    })

    // Store composed PDF
    const composedId = await storeComposedPdf(id, composedPdf, body.flatten)

    return NextResponse.json({
      success: true,
      composed: {
        id: composedId,
        originalId: id,
        flattened: !!body.flatten,
        size: composedPdf.length,
        downloadUrl: `/api/pdf/composed/${composedId}/download`,
        previewUrl: `/api/pdf/composed/${composedId}/preview`,
      },
    })
  } catch (error: any) {
    console.error('[PDF Compose] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Compose failed' },
      { status: 500 }
    )
  }
}
