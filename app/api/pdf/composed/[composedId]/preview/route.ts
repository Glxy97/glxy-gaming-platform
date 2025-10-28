/**
 * Composed PDF Preview API
 * GET /api/pdf/composed/[composedId]/preview?page=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { getComposedPdf } from '@/lib/pdf/storage'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ composedId: string }> }
) {
  try {
    const { composedId } = await params
    const { searchParams } = new URL(request.url)

    // Param guards: clamp page (≥1) and scale (0.5-3)
    const pageParam = parseInt(searchParams.get('page') || '1')
    const scaleParam = parseFloat(searchParams.get('scale') || '2')

    const pdfBuffer = await getComposedPdf(composedId)
    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Composed PDF not found' },
        { status: 404 }
      )
    }

    // Lazy import renderer to avoid build-time pdfjs loading
    const { renderPdfPage, getPdfPageCount } = await import('@/lib/pdf/renderer')

    // Get page count and clamp page parameter
    const pageCount = await getPdfPageCount(pdfBuffer)
    const page = Math.max(1, Math.min(pageParam, pageCount))
    const scale = Math.max(0.5, Math.min(scaleParam, 3))

    // Render PDF page to image
    const imageBuffer = await renderPdfPage(pdfBuffer, { page, scale })

    // Generate ETag from buffer hash
    const etag = `"${crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16)}"`

    // Check If-None-Match for 304 response
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
      },
    })
  } catch (error: any) {
    console.error('[Composed PDF Preview] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}
