/**
 * Composed PDF Download API
 * GET /api/pdf/composed/[composedId]/download
 */

import { NextRequest, NextResponse } from 'next/server'
import { getComposedPdf } from '@/lib/pdf/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ composedId: string }> }
) {
  try {
    const { composedId } = await params

    const pdfBuffer = await getComposedPdf(composedId)
    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Composed PDF not found' },
        { status: 404 }
      )
    }

    // Extract info from ID
    const isFlattened = composedId.includes('flattened')
    const filename = isFlattened ? 'document_flattened.pdf' : 'document_filled.pdf'

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('[PDF Download] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    )
  }
}
