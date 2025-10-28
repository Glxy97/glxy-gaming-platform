/**
 * PDF Upload API
 * POST /api/pdf/upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { storePdf } from '@/lib/pdf/storage'
import { extractFormFieldInfo } from '@/lib/pdf/composer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Store PDF
    const metadata = await storePdf(buffer, file.name)

    // Extract form fields
    const formFields = await extractFormFieldInfo(buffer)

    return NextResponse.json({
      success: true,
      pdf: {
        id: metadata.id,
        name: metadata.originalName,
        size: metadata.size,
        uploadedAt: metadata.uploadedAt,
        formFields,
        previewUrl: `/api/pdf/${metadata.id}/preview`,
        downloadUrl: `/api/pdf/${metadata.id}`,
      },
    })
  } catch (error: any) {
    console.error('[PDF Upload] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
