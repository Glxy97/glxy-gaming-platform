/**
 * PDF Serve API
 * GET /api/pdf/[id] - Serve original uploaded PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPdf, getPdfMetadata } from '@/lib/pdf/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pdfBuffer = await getPdf(id)
    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      )
    }

    const metadata = await getPdfMetadata(id)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${metadata?.originalName || 'document.pdf'}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error: any) {
    console.error('[PDF Serve] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to serve PDF' },
      { status: 500 }
    )
  }
}
