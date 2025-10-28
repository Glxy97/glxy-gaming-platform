/**
 * /api/generate-pdf/download/[fileId] - Download Generated PDF
 *
 * Serves generated PDF files for download
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

const OUTPUT_DIR = join(process.cwd(), 'uploads', 'pdfs', 'generated')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
): Promise<NextResponse> {
  try {
    const { fileId } = await params

    if (!fileId || fileId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid file ID' },
        { status: 400 }
      )
    }

    // Find file with matching ID
    const files = await import('fs/promises').then(fs => fs.readdir(OUTPUT_DIR))
    const matchingFile = files.find(file => file.includes(fileId))

    if (!matchingFile) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      )
    }

    const filePath = join(OUTPUT_DIR, matchingFile)

    // Check file exists and is readable
    try {
      await access(filePath, constants.R_OK)
    } catch {
      return NextResponse.json(
        { error: 'File not accessible' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${matchingFile}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
