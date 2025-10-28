/**
 * Web-Adobe Document Download API
 *
 * GET /api/web-adobe/documents/[id]/download
 * - Streams PDF file with proper headers
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Fetch document
    const document = await prisma.pdfDocument.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        filename: true,
        storagePath: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Security: Verify user owns document
    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if file exists
    if (!existsSync(document.storagePath)) {
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(document.storagePath)

    // Return file with proper headers
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          document.filename
        )}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download document error:', error)
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    )
  }
}
