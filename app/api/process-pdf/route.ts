/**
 * /api/process-pdf - PDF Upload, Analysis & Processing API
 *
 * Features:
 * - Multipart form upload (PDF files)
 * - File validation (type, size, content)
 * - PDF analysis (metadata, structure)
 * - Text extraction
 * - Form field detection
 * - Optional OCR for scanned PDFs
 * - Processed PDF download
 *
 * Authentication: Optional (configurable)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import {
  extractTextFromPdf,
  extractFormFields,
  analyzePdf,
  performOcr,
  compressPdf,
  validatePdfBuffer,
  PdfServiceError,
  PdfServiceErrorCode,
} from '@/lib/adobe-pdf-services'
import type {
  ProcessPdfRequest,
  ProcessPdfResponse,
  ProcessedPdfResult,
} from '@/types/pdf-services'

// ============================================================================
// Configuration
// ============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf']
const REQUIRE_AUTH = false // Set to true to require authentication
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'pdfs', 'processed')
const TEMP_DIR = join(process.cwd(), 'uploads', 'pdfs', 'temp')

// ============================================================================
// POST /api/process-pdf
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ProcessPdfResponse>> {
  const startTime = Date.now()

  try {
    // Authentication check (optional)
    if (REQUIRE_AUTH) {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: PdfServiceErrorCode.PERMISSION_DENIED,
              message: 'Authentication required',
            },
          },
          { status: 401 }
        )
      }
    }

    // Extract session (even if not required, for logging)
    const session = await auth()
    const userId = session?.user?.id

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Parse processing options
    const options: ProcessPdfRequest = {
      extractText: formData.get('extractText') === 'true',
      extractFormFields: formData.get('extractFormFields') === 'true',
      analyzeStructure: formData.get('analyzeStructure') === 'true',
      performOcr: formData.get('performOcr') === 'true',
      compressOutput: formData.get('compressOutput') === 'true',
    }

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: PdfServiceErrorCode.INVALID_FILE,
            message: 'No file provided in form data',
          },
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: PdfServiceErrorCode.UNSUPPORTED_FORMAT,
            message: `Invalid file type: ${file.type}. Only PDF files are allowed.`,
          },
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: PdfServiceErrorCode.FILE_TOO_LARGE,
            message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate PDF content
    const isValidPdf = await validatePdfBuffer(buffer)
    if (!isValidPdf) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: PdfServiceErrorCode.INVALID_FILE,
            message: 'File is not a valid PDF document',
          },
        },
        { status: 400 }
      )
    }

    // Generate unique file ID
    const fileId = randomUUID()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${fileId}-${sanitizedFilename}`

    // Ensure directories exist
    await mkdir(UPLOAD_DIR, { recursive: true })
    await mkdir(TEMP_DIR, { recursive: true })

    // Save file temporarily for processing
    const tempPath = join(TEMP_DIR, filename)
    await writeFile(tempPath, buffer)

    // Initialize result object
    const result: ProcessedPdfResult = {
      success: true,
      fileId,
      fileName: sanitizedFilename,
      fileSize: file.size,
      pageCount: 0,
      processingTime: 0,
    }

    // Analyze PDF structure
    if (options.analyzeStructure !== false) {
      const analysis = await analyzePdf(buffer)
      result.pageCount = analysis.pageCount
      result.metadata = analysis.metadata
    }

    // Extract text content
    if (options.extractText) {
      try {
        result.extractedText = await extractTextFromPdf(buffer)
      } catch (error) {
        console.error('Text extraction failed:', error)
        // Continue processing even if text extraction fails
      }
    }

    // Extract form fields
    if (options.extractFormFields) {
      try {
        result.formFields = await extractFormFields(buffer)
      } catch (error) {
        console.error('Form field extraction failed:', error)
        // Continue processing
      }
    }

    // Perform OCR if requested
    if (options.performOcr) {
      try {
        const ocrText = await performOcr(buffer)
        result.extractedText = (result.extractedText || '') + '\n\n--- OCR Text ---\n' + ocrText
      } catch (error) {
        console.error('OCR processing failed:', error)
        // Continue processing
      }
    }

    // Compress output if requested
    let outputBuffer: Buffer = buffer
    if (options.compressOutput) {
      try {
        outputBuffer = await compressPdf(buffer, 'medium') as Buffer
      } catch (error) {
        console.error('Compression failed:', error)
        // Use original buffer
      }
    }

    // Save processed file
    const outputPath = join(UPLOAD_DIR, filename)
    await writeFile(outputPath, outputBuffer)

    // Clean up temp file
    try {
      await unlink(tempPath)
    } catch (error) {
      console.error('Failed to delete temp file:', error)
    }

    // Generate download URL
    result.downloadUrl = `/api/process-pdf/download/${fileId}`

    // Save to database (if user is authenticated)
    if (userId) {
      try {
        await prisma.pdfDocument.create({
          data: {
            userId,
            title: sanitizedFilename.replace('.pdf', ''),
            filename,
            storagePath: outputPath,
            fileSize: outputBuffer.length,
            pageCount: result.pageCount,
            status: 'REVIEW',
          },
        })
      } catch (dbError) {
        console.error('Database save failed:', dbError)
        // Continue anyway - file is processed
      }
    }

    // Calculate processing time
    result.processingTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('PDF processing error:', error)

    // Handle PdfServiceError
    if (error instanceof PdfServiceError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: PdfServiceErrorCode.PROCESSING_FAILED,
          message: 'Failed to process PDF file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/process-pdf - API Documentation
// ============================================================================

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      endpoint: '/api/process-pdf',
      description: 'Upload and process PDF files with advanced features',
      methods: ['POST'],
      authentication: REQUIRE_AUTH ? 'required' : 'optional',
      requestFormat: 'multipart/form-data',
      fields: {
        file: {
          type: 'File',
          required: true,
          description: 'PDF file to process',
          maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
          allowedTypes: ALLOWED_MIME_TYPES,
        },
        extractText: {
          type: 'boolean',
          required: false,
          default: false,
          description: 'Extract text content from PDF',
        },
        extractFormFields: {
          type: 'boolean',
          required: false,
          default: false,
          description: 'Extract form fields from PDF',
        },
        analyzeStructure: {
          type: 'boolean',
          required: false,
          default: true,
          description: 'Analyze PDF structure and metadata',
        },
        performOcr: {
          type: 'boolean',
          required: false,
          default: false,
          description: 'Perform OCR on scanned PDFs',
        },
        compressOutput: {
          type: 'boolean',
          required: false,
          default: false,
          description: 'Compress output PDF',
        },
      },
      response: {
        success: 'boolean',
        data: {
          fileId: 'string',
          fileName: 'string',
          fileSize: 'number',
          pageCount: 'number',
          extractedText: 'string (optional)',
          formFields: 'array (optional)',
          metadata: 'object (optional)',
          processingTime: 'number',
          downloadUrl: 'string',
        },
        error: {
          code: 'string',
          message: 'string',
          details: 'any (optional)',
        },
      },
      examples: {
        curl: `curl -X POST http://localhost:3000/api/process-pdf \\
  -F "file=@document.pdf" \\
  -F "extractText=true" \\
  -F "extractFormFields=true"`,
        javascript: `const formData = new FormData()
formData.append('file', pdfFile)
formData.append('extractText', 'true')
formData.append('extractFormFields', 'true')

const response = await fetch('/api/process-pdf', {
  method: 'POST',
  body: formData
})

const result = await response.json()`,
      },
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

// ============================================================================
// OPTIONS /api/process-pdf - CORS Preflight
// ============================================================================

export async function OPTIONS(_request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
