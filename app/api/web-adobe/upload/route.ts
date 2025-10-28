/**
 * Web-Adobe Upload API
 * Handles PDF file uploads with multipart/form-data
 * Automatically triggers background field analysis
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { analyzeDocument } from '@/lib/web-adobe/field-analysis-worker'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileId = randomUUID()
    const filename = `${fileId}-${file.name}`
    const uploadDir = join(process.cwd(), 'uploads', 'pdfs')

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true })

    const filepath = join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Create database entry
    const document = await prisma.pdfDocument.create({
      data: {
        userId: session.user.id,
        title: file.name.replace('.pdf', ''),
        filename: filename,
        storagePath: filepath,
        fileSize: file.size,
        status: 'DRAFT',
      },
    })

    console.log(`✅ PDF uploaded: ${document.id} - ${document.filename}`)

    // Start background analysis (don't await)
    analyzeDocument(document.id).catch(err => {
      console.error(`❌ Analysis failed for document ${document.id}:`, err)
    })

    return NextResponse.json({
      success: true,
      document,
      message: 'File uploaded successfully. Analysis started in background.',
    }, { status: 201 })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    endpoint: '/api/web-adobe/upload',
    method: 'POST',
    accepts: 'multipart/form-data',
    field: 'file',
    maxSize: '10MB',
    allowedTypes: ['application/pdf'],
  })
}
