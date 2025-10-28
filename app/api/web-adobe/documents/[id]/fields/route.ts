/**
 * Web-Adobe Field Update API
 * PUT /api/web-adobe/documents/[id]/fields
 *
 * Handles form field updates from Adobe PDF Embed API
 * - Updates PdfField records in database
 * - Emits Socket.IO events for real-time updates
 * - Validates field data and ownership
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-server'
import { z } from 'zod'

// Request validation schema
const fieldUpdateSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  value: z.union([z.string(), z.number(), z.boolean()]),
  position: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  }).optional(),
  confidence: z.number().min(0).max(1).optional(),
})

type FieldUpdateRequest = z.infer<typeof fieldUpdateSchema>

interface FieldUpdateResponse {
  success: boolean
  field: {
    id: string
    pdfName: string
    displayLabel: string | null
    fieldType: string
    x: number
    y: number
    width: number
    height: number
    pageNumber: number
    status: string
    updatedAt: Date
  }
  updatedBy: 'user' | 'adobe'
  timestamp: number
}

/**
 * PUT: Update field value and properties
 * Adobe PDF Embed API sends field updates here
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    )
  }

  const { id: documentId } = await params

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = fieldUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid field update data',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const { fieldName, value, position, confidence } = validation.data

    // Verify document ownership
    const document = await prisma.pdfDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this document' },
        { status: 403 }
      )
    }

    // Find or create field
    let field = await prisma.pdfField.findFirst({
      where: {
        documentId,
        pdfName: fieldName,
      },
    })

    const updateData: any = {
      ...(position && {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      }),
      updatedAt: new Date(),
    }

    // Store value in suggestions JSON field
    if (value !== undefined) {
      const currentSuggestions = field?.suggestions || {}
      updateData.suggestions = {
        ...(typeof currentSuggestions === 'object' ? currentSuggestions : {}),
        adobe_value: value,
        adobe_confidence: confidence || 1.0,
        adobe_updated_at: new Date().toISOString(),
      }
    }

    if (field) {
      // Update existing field
      field = await prisma.pdfField.update({
        where: { id: field.id },
        data: updateData,
      })
    } else {
      // Create new field if it doesn't exist
      field = await prisma.pdfField.create({
        data: {
          documentId,
          pdfName: fieldName,
          displayLabel: fieldName,
          fieldType: inferFieldType(value),
          required: false,
          x: position?.x || 0,
          y: position?.y || 0,
          width: position?.width || 0.1,
          height: position?.height || 0.02,
          pageNumber: 1,
          status: 'DRAFT',
          suggestions: {
            adobe_value: value,
            adobe_confidence: confidence || 1.0,
            adobe_updated_at: new Date().toISOString(),
          },
        },
      })
    }

    // Update document status if needed
    if (document.status === 'DRAFT') {
      await prisma.pdfDocument.update({
        where: { id: documentId },
        data: { status: 'REVIEW' },
      })
    }

    // Emit Socket.IO event for real-time updates
    try {
      await emitFieldUpdateEvent(documentId, field, value, session.user.id)
    } catch (socketError) {
      console.error('Failed to emit Socket.IO event:', socketError)
      // Continue even if Socket.IO fails
    }

    // Build response
    const response: FieldUpdateResponse = {
      success: true,
      field: {
        id: field.id,
        pdfName: field.pdfName,
        displayLabel: field.displayLabel,
        fieldType: field.fieldType,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        pageNumber: field.pageNumber,
        status: field.status,
        updatedAt: field.updatedAt,
      },
      updatedBy: 'adobe',
      timestamp: Date.now(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Field update error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update field',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Emit Socket.IO event via Redis Pub/Sub
 */
async function emitFieldUpdateEvent(
  documentId: string,
  field: any,
  value: any,
  userId: string
) {
  const eventChannel = `web-adobe:field:update:${documentId}`

  const eventData = {
    documentId,
    field: {
      id: field.id,
      type: mapFieldTypeToViewer(field.fieldType),
      label: field.displayLabel || field.pdfName,
      value,
      confidence: 1.0,
      pageNumber: field.pageNumber,
      boundingBox: {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
      },
    },
    updatedBy: 'adobe' as const,
    timestamp: Date.now(),
  }

  try {
    // Check if Redis is available
    const isRedisConnected = redis.status === 'ready' || redis.status === 'connect'

    if (isRedisConnected) {
      await redis.publish(eventChannel, JSON.stringify(eventData))
      console.log(`✅ Published field:updated event for field ${field.id}`)
    } else {
      // Attempt to connect if not connected
      if (redis.status === 'wait' || redis.status === 'close') {
        await redis.connect()
        await redis.publish(eventChannel, JSON.stringify(eventData))
        console.log(`✅ Published field:updated event for field ${field.id} (reconnected)`)
      } else {
        console.warn('⚠️ Redis not available, skipping Socket.IO event')
      }
    }
  } catch (redisError) {
    console.error('❌ Redis publish failed:', redisError)
    throw redisError
  }
}

/**
 * Infer field type from value
 */
function inferFieldType(value: string | number | boolean): string {
  if (typeof value === 'boolean') return 'checkbox'
  if (typeof value === 'number') return 'number'

  const strValue = String(value).toLowerCase()

  // Email detection
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) return 'email'

  // Date detection (ISO format, MM/DD/YYYY, DD.MM.YYYY)
  if (
    /^\d{4}-\d{2}-\d{2}/.test(strValue) ||
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(strValue)
  ) {
    return 'date'
  }

  return 'text'
}

/**
 * Map Prisma field type to Socket.IO event field type
 */
function mapFieldTypeToViewer(
  fieldType: string
): 'text' | 'number' | 'date' | 'checkbox' | 'signature' {
  const typeMap: Record<string, any> = {
    text: 'text',
    number: 'number',
    email: 'text',
    date: 'date',
    checkbox: 'checkbox',
    radio: 'checkbox',
    signature: 'signature',
  }

  return typeMap[fieldType] || 'text'
}
