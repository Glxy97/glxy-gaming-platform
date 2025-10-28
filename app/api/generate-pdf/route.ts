/**
 * /api/generate-pdf - PDF Generation from Form Data API
 *
 * Features:
 * - Generate PDF from JSON form data
 * - Customizable page settings (size, orientation)
 * - Fillable form fields
 * - Password protection & encryption
 * - Metadata configuration
 * - Watermarks and headers/footers
 *
 * Authentication: Optional (configurable)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import {
  generatePdfFromData,
  PdfServiceError,
  PdfServiceErrorCode,
} from '@/lib/adobe-pdf-services'
import type {
  GeneratePdfRequest,
  GeneratePdfResponse,
  FormField,
  PdfSettings,
} from '@/types/pdf-services'

// ============================================================================
// Configuration
// ============================================================================

const REQUIRE_AUTH = false // Set to true to require authentication
const OUTPUT_DIR = join(process.cwd(), 'uploads', 'pdfs', 'generated')
const DOWNLOAD_EXPIRY_HOURS = 24

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const FormFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required'),
  type: z.enum([
    'text',
    'number',
    'email',
    'date',
    'checkbox',
    'radio',
    'select',
    'textarea',
    'signature',
  ]),
  label: z.string().min(1, 'Field label is required'),
  value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
})

const PdfSettingsSchema = z.object({
  pageSize: z.enum(['A4', 'Letter', 'Legal', 'A3', 'A5', 'Tabloid']).default('A4'),
  orientation: z.enum(['Portrait', 'Landscape']).default('Portrait'),
  fillable: z.boolean().default(false),
  encrypted: z.boolean().default(false),
  password: z.string().optional(),
  permissions: z
    .object({
      printing: z.boolean().optional(),
      modifying: z.boolean().optional(),
      copying: z.boolean().optional(),
      annotating: z.boolean().optional(),
    })
    .optional(),
  metadata: z
    .object({
      title: z.string().optional(),
      author: z.string().optional(),
      subject: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      creator: z.string().optional(),
    })
    .optional(),
})

const GeneratePdfRequestSchema = z.object({
  fields: z.array(FormFieldSchema).min(1, 'At least one field is required'),
  template: z.string().min(1, 'Template is required'),
  settings: PdfSettingsSchema,
})

// ============================================================================
// POST /api/generate-pdf
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<GeneratePdfResponse>> {
  const startTime = Date.now()

  try {
    // Authentication check (optional)
    if (REQUIRE_AUTH) {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            fileId: '',
            fileName: '',
            fileSize: 0,
            downloadUrl: '',
            expiresAt: new Date(),
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

    // Parse and validate request body
    let body: GeneratePdfRequest
    try {
      const rawBody = await request.json()
      body = GeneratePdfRequestSchema.parse(rawBody)
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          fileId: '',
          fileName: '',
          fileSize: 0,
          downloadUrl: '',
          expiresAt: new Date(),
          error: {
            code: PdfServiceErrorCode.VALIDATION_FAILED,
            message: 'Invalid request data',
            details: validationError instanceof z.ZodError ? validationError.errors : validationError,
          },
        },
        { status: 400 }
      )
    }

    // Extract and validate data
    const { fields, template, settings } = body

    // Validate password requirement for encrypted PDFs
    if (settings.encrypted && !settings.password) {
      return NextResponse.json(
        {
          success: false,
          fileId: '',
          fileName: '',
          fileSize: 0,
          downloadUrl: '',
          expiresAt: new Date(),
          error: {
            code: PdfServiceErrorCode.VALIDATION_FAILED,
            message: 'Password is required for encrypted PDFs',
          },
        },
        { status: 400 }
      )
    }

    // Validate password strength
    if (settings.encrypted && settings.password && settings.password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          fileId: '',
          fileName: '',
          fileSize: 0,
          downloadUrl: '',
          expiresAt: new Date(),
          error: {
            code: PdfServiceErrorCode.VALIDATION_FAILED,
            message: 'Password must be at least 8 characters long',
          },
        },
        { status: 400 }
      )
    }

    // Ensure output directory exists
    await mkdir(OUTPUT_DIR, { recursive: true })

    // Generate PDF from data
    const pdfBuffer = await generatePdfFromData(fields, settings)

    // Generate unique file ID and name
    const fileId = randomUUID()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const templateName = template.replace(/[^a-zA-Z0-9-]/g, '_')
    const fileName = `${templateName}_${timestamp}_${fileId.substring(0, 8)}.pdf`
    const filePath = join(OUTPUT_DIR, fileName)

    // Save generated PDF
    await writeFile(filePath, pdfBuffer)

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + DOWNLOAD_EXPIRY_HOURS)

    // Save to database (if user is authenticated)
    if (userId) {
      try {
        await prisma.pdfDocument.create({
          data: {
            userId,
            title: settings.metadata?.title || template,
            filename: fileName,
            storagePath: filePath,
            fileSize: pdfBuffer.length,
            pageCount: 1, // Default, would need calculation for multi-page
            status: 'SYNCED',
          },
        })
      } catch (dbError) {
        console.error('Database save failed:', dbError)
        // Continue anyway - file is generated
      }
    }

    // Generate download URL
    const downloadUrl = `/api/generate-pdf/download/${fileId}`

    // Calculate processing time
    const processingTime = Date.now() - startTime

    console.log(`PDF generated successfully in ${processingTime}ms: ${fileName} (${pdfBuffer.length} bytes)`)

    return NextResponse.json(
      {
        success: true,
        fileId,
        fileName,
        fileSize: pdfBuffer.length,
        downloadUrl,
        expiresAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('PDF generation error:', error)

    // Handle PdfServiceError
    if (error instanceof PdfServiceError) {
      return NextResponse.json(
        {
          success: false,
          fileId: '',
          fileName: '',
          fileSize: 0,
          downloadUrl: '',
          expiresAt: new Date(),
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
        fileId: '',
        fileName: '',
        fileSize: 0,
        downloadUrl: '',
        expiresAt: new Date(),
        error: {
          code: PdfServiceErrorCode.GENERATION_FAILED,
          message: 'Failed to generate PDF',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/generate-pdf - API Documentation
// ============================================================================

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      endpoint: '/api/generate-pdf',
      description: 'Generate PDF documents from form data with customizable settings',
      methods: ['POST'],
      authentication: REQUIRE_AUTH ? 'required' : 'optional',
      requestFormat: 'application/json',
      schema: {
        fields: {
          type: 'array',
          description: 'Form fields to include in the PDF',
          items: {
            id: 'string',
            name: 'string (required)',
            type: 'enum: text|number|email|date|checkbox|radio|select|textarea|signature',
            label: 'string (required)',
            value: 'string|number|boolean|Date',
            placeholder: 'string (optional)',
            required: 'boolean (optional)',
            readOnly: 'boolean (optional)',
            validation: {
              min: 'number (optional)',
              max: 'number (optional)',
              pattern: 'string (optional)',
              message: 'string (optional)',
            },
            options: 'array<{label: string, value: string}> (optional)',
          },
        },
        template: {
          type: 'string',
          description: 'Template identifier or name',
          required: true,
        },
        settings: {
          pageSize: {
            type: 'enum',
            values: ['A4', 'Letter', 'Legal', 'A3', 'A5', 'Tabloid'],
            default: 'A4',
          },
          orientation: {
            type: 'enum',
            values: ['Portrait', 'Landscape'],
            default: 'Portrait',
          },
          fillable: {
            type: 'boolean',
            description: 'Generate fillable form fields',
            default: false,
          },
          encrypted: {
            type: 'boolean',
            description: 'Enable password protection',
            default: false,
          },
          password: {
            type: 'string',
            description: 'Password for encrypted PDF (min 8 characters)',
            required: 'if encrypted=true',
          },
          permissions: {
            printing: 'boolean',
            modifying: 'boolean',
            copying: 'boolean',
            annotating: 'boolean',
          },
        },
        metadata: {
          type: 'object',
          description: 'PDF metadata (title, author, subject, keywords)',
        },
      },
      examples: [
        {
          description: 'Basic PDF generation',
          request: {
            fields: [
              {
                name: 'fullName',
                type: 'text',
                label: 'Full Name',
                value: 'John Doe',
                required: true,
              },
            ],
            template: 'default',
          },
        },
      ],
    },
    { status: 200 }
  )
}
