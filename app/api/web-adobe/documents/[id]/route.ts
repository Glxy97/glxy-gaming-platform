/**
 * Web-Adobe Document API (Single Document Operations)
 *
 * GET /api/web-adobe/documents/[id]
 * - Returns single document with fields AND PDF data
 *
 * PATCH /api/web-adobe/documents/[id]
 * - Updates document metadata (title, status)
 *
 * DELETE /api/web-adobe/documents/[id]
 * - Deletes document and associated file
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { unlink, readFile } from 'fs/promises'
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
    const document = await prisma.pdfDocument.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { pageNumber: 'asc' },
        },
        _count: {
          select: { fields: true },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Security: Verify user owns document
    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Load PDF file and convert to Base64 data URL
    let pdfDataUrl: string | null = null
    try {
      if (existsSync(document.storagePath)) {
        const pdfBuffer = await readFile(document.storagePath)
        const pdfBase64 = pdfBuffer.toString('base64')
        pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`
      } else {
        console.error('[API] PDF file not found:', document.storagePath)
      }
    } catch (fileError) {
      console.error('[API] Failed to load PDF file:', fileError)
      // Continue without PDF data - frontend can handle missing file
    }

    return NextResponse.json({
      document,
      pdfDataUrl, // Base64 data URL for PDF viewer
    })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: Update document metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { title, status } = body

    // Verify ownership
    const document = await prisma.pdfDocument.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update
    const updated = await prisma.pdfDocument.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove document and file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Fetch document first to verify ownership and get file path
    const document = await prisma.pdfDocument.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        storagePath: true,
        title: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Security: Verify user owns document
    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from database (cascade deletes fields automatically)
    await prisma.pdfDocument.delete({
      where: { id },
    })

    // Delete file from filesystem
    try {
      if (existsSync(document.storagePath)) {
        await unlink(document.storagePath)
        console.log(`Deleted file: ${document.storagePath}`)
      }
    } catch (fileError) {
      console.error('Failed to delete file:', fileError)
      // Continue even if file deletion fails - database is already clean
    }

    return NextResponse.json({
      success: true,
      message: `Document "${document.title}" deleted successfully`,
    })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
