/**
 * Test API Route for Web-Adobe Socket.IO Integration
 * Simulates FastAPI worker publishing analysis events
 */

import { NextRequest, NextResponse } from 'next/server'
import { publishAnalysisEvent } from '@/lib/socket-handlers/web-adobe'

/**
 * POST /api/web-adobe/test-analysis
 *
 * Simulates document analysis progress by publishing events
 *
 * Body:
 * {
 *   "documentId": "doc-123",
 *   "fileName": "test.pdf",
 *   "totalPages": 10
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, fileName, totalPages = 10 } = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      )
    }

    // Simulate analysis start
    await publishAnalysisEvent(documentId, 'start', {
      documentId,
      fileName: fileName || 'test-document.pdf',
      totalPages,
      startedAt: Date.now(),
      userId: 'test-user',
    })

    // Simulate progress updates
    const progressUpdates = [
      { progress: 10, currentPage: 1, stage: 'preprocessing', message: 'Analyzing document structure...' },
      { progress: 30, currentPage: 3, stage: 'ocr', message: 'Extracting text from pages...' },
      { progress: 60, currentPage: 6, stage: 'field-extraction', message: 'Identifying form fields...' },
      { progress: 90, currentPage: 9, stage: 'validation', message: 'Validating extracted data...' },
    ]

    for (const update of progressUpdates) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Delay for demo

      await publishAnalysisEvent(documentId, 'progress', {
        documentId,
        ...update,
        totalPages,
      })
    }

    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 500))

    await publishAnalysisEvent(documentId, 'complete', {
      documentId,
      success: true,
      totalFields: 25,
      extractedPages: totalPages,
      duration: 2500,
      completedAt: Date.now(),
    })

    return NextResponse.json({
      success: true,
      message: 'Analysis simulation completed',
      documentId,
    })
  } catch (error) {
    console.error('Test analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/web-adobe/test-analysis
 *
 * Returns test instructions
 */
export async function GET() {
  return NextResponse.json({
    message: 'Web-Adobe Socket.IO Test API',
    usage: {
      method: 'POST',
      endpoint: '/api/web-adobe/test-analysis',
      body: {
        documentId: 'string (required)',
        fileName: 'string (optional)',
        totalPages: 'number (optional, default: 10)',
      },
      example: {
        documentId: 'doc-123',
        fileName: 'invoice-2024.pdf',
        totalPages: 5,
      },
    },
    steps: [
      '1. Connect to Socket.IO namespace: /web-adobe',
      '2. Subscribe to document: socket.emit("document:subscribe", { documentId: "doc-123" })',
      '3. Listen to events: analysis:start, analysis:progress, analysis:complete',
      '4. POST to this endpoint with documentId to simulate analysis',
    ],
  })
}
