/**
 * Integration Tests for Adobe Field Update API
 * Tests field updates, validation, authentication, and Socket.IO events
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { PUT } from '../route'

// Mock dependencies
jest.mock('@/lib/auth')
jest.mock('@/lib/db')
jest.mock('@/lib/redis-server')

const mockAuth = require('@/lib/auth').auth as jest.MockedFunction<any>
const mockPrisma = require('@/lib/db').prisma as any
const mockRedis = require('@/lib/redis-server').redis as any

describe('Adobe Field Update API', () => {
  const mockDocumentId = 'test-doc-123'
  const mockUserId = 'test-user-456'

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    })

    // Mock Redis connection
    mockRedis.status = 'ready'
    mockRedis.publish = jest.fn().mockResolvedValue(1)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('PUT /api/web-adobe/documents/[id]/fields', () => {
    it('should update existing field successfully', async () => {
      const mockField = {
        id: 'field-123',
        documentId: mockDocumentId,
        pdfName: 'firstName',
        displayLabel: 'First Name',
        fieldType: 'text',
        required: false,
        x: 0.25,
        y: 0.5,
        width: 0.2,
        height: 0.03,
        pageNumber: 1,
        status: 'DRAFT',
        suggestions: {},
        updatedAt: new Date(),
      }

      mockPrisma.pdfDocument.findUnique.mockResolvedValue({
        id: mockDocumentId,
        userId: mockUserId,
        status: 'DRAFT',
      })

      mockPrisma.pdfField.findFirst.mockResolvedValue(mockField)
      mockPrisma.pdfField.update.mockResolvedValue({
        ...mockField,
        suggestions: {
          adobe_value: 'John',
          adobe_confidence: 1.0,
        },
      })

      mockPrisma.pdfDocument.update.mockResolvedValue({
        status: 'REVIEW',
      })

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'firstName',
          value: 'John',
        }),
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.field.pdfName).toBe('firstName')
      expect(body.updatedBy).toBe('adobe')
    })

    it('should create new field if not exists', async () => {
      mockPrisma.pdfDocument.findUnique.mockResolvedValue({
        id: mockDocumentId,
        userId: mockUserId,
        status: 'DRAFT',
      })

      mockPrisma.pdfField.findFirst.mockResolvedValue(null)

      const newField = {
        id: 'new-field-789',
        documentId: mockDocumentId,
        pdfName: 'newField',
        displayLabel: 'newField',
        fieldType: 'text',
        required: false,
        x: 0.1,
        y: 0.2,
        width: 0.15,
        height: 0.025,
        pageNumber: 1,
        status: 'DRAFT',
        suggestions: {
          adobe_value: 'Test Value',
          adobe_confidence: 1.0,
        },
        updatedAt: new Date(),
      }

      mockPrisma.pdfField.create.mockResolvedValue(newField)

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'newField',
          value: 'Test Value',
          position: { x: 0.1, y: 0.2, width: 0.15, height: 0.025 },
        }),
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(response.status).toBe(200)
      expect(mockPrisma.pdfField.create).toHaveBeenCalled()
    })

    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'test',
          value: 'value',
        }),
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.error).toContain('Unauthorized')
    })

    it('should reject requests from non-owners', async () => {
      mockPrisma.pdfDocument.findUnique.mockResolvedValue({
        id: mockDocumentId,
        userId: 'different-user-id',
        status: 'DRAFT',
      })

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'test',
          value: 'value',
        }),
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(response.status).toBe(403)

      const body = await response.json()
      expect(body.error).toContain('Forbidden')
    })

    it('should validate request body', async () => {
      mockPrisma.pdfDocument.findUnique.mockResolvedValue({
        id: mockDocumentId,
        userId: mockUserId,
        status: 'DRAFT',
      })

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          // Missing fieldName
          value: 'test',
        }),
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('Invalid field update data')
      expect(body.details).toBeDefined()
    })

    it('should return 404 for non-existent document', async () => {
      mockPrisma.pdfDocument.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'test',
          value: 'value',
        }),
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(response.status).toBe(404)

      const body = await response.json()
      expect(body.error).toContain('Document not found')
    })

    it('should publish Socket.IO event', async () => {
      const mockField = {
        id: 'field-123',
        documentId: mockDocumentId,
        pdfName: 'testField',
        displayLabel: 'Test Field',
        fieldType: 'text',
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.03,
        pageNumber: 1,
        status: 'DRAFT',
        updatedAt: new Date(),
      }

      mockPrisma.pdfDocument.findUnique.mockResolvedValue({
        id: mockDocumentId,
        userId: mockUserId,
        status: 'DRAFT',
      })

      mockPrisma.pdfField.findFirst.mockResolvedValue(mockField)
      mockPrisma.pdfField.update.mockResolvedValue(mockField)

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'testField',
          value: 'Updated Value',
        }),
      })

      await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(mockRedis.publish).toHaveBeenCalledWith(
        `web-adobe:field:update:${mockDocumentId}`,
        expect.stringContaining('Updated Value')
      )
    })

    it('should infer field types correctly', async () => {
      const testCases = [
        { value: true, expectedType: 'checkbox' },
        { value: 42, expectedType: 'number' },
        { value: 'test@example.com', expectedType: 'email' },
        { value: '2024-10-07', expectedType: 'date' },
        { value: 'plain text', expectedType: 'text' },
      ]

      for (const testCase of testCases) {
        mockPrisma.pdfDocument.findUnique.mockResolvedValue({
          id: mockDocumentId,
          userId: mockUserId,
          status: 'DRAFT',
        })

        mockPrisma.pdfField.findFirst.mockResolvedValue(null)

        mockPrisma.pdfField.create.mockImplementation((args: any) => {
          return Promise.resolve({
            ...args.data,
            id: 'test-field',
            updatedAt: new Date(),
          })
        })

        const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
          method: 'PUT',
          body: JSON.stringify({
            fieldName: 'testField',
            value: testCase.value,
          }),
        })

        await PUT(request, {
          params: Promise.resolve({ id: mockDocumentId }),
        })

        const createCall = mockPrisma.pdfField.create.mock.calls[0]?.[0]
        expect(createCall?.data?.fieldType).toBe(testCase.expectedType)

        jest.clearAllMocks()
      }
    })

    it('should update document status from DRAFT to REVIEW', async () => {
      mockPrisma.pdfDocument.findUnique.mockResolvedValue({
        id: mockDocumentId,
        userId: mockUserId,
        status: 'DRAFT',
      })

      mockPrisma.pdfField.findFirst.mockResolvedValue({
        id: 'field-123',
        pdfName: 'testField',
      })

      mockPrisma.pdfField.update.mockResolvedValue({
        id: 'field-123',
        updatedAt: new Date(),
      })

      mockPrisma.pdfDocument.update.mockResolvedValue({
        status: 'REVIEW',
      })

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'testField',
          value: 'test',
        }),
      })

      await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      expect(mockPrisma.pdfDocument.update).toHaveBeenCalledWith({
        where: { id: mockDocumentId },
        data: { status: 'REVIEW' },
      })
    })

    it('should handle position updates', async () => {
      const position = { x: 0.5, y: 0.75, width: 0.3, height: 0.05 }

      mockPrisma.pdfDocument.findUnique.mockResolvedValue({
        id: mockDocumentId,
        userId: mockUserId,
        status: 'DRAFT',
      })

      mockPrisma.pdfField.findFirst.mockResolvedValue({
        id: 'field-123',
        pdfName: 'testField',
      })

      mockPrisma.pdfField.update.mockImplementation((args: any) => {
        return Promise.resolve({
          ...args.data,
          id: 'field-123',
          updatedAt: new Date(),
        })
      })

      const request = new NextRequest('http://localhost/api/web-adobe/documents/test-doc-123/fields', {
        method: 'PUT',
        body: JSON.stringify({
          fieldName: 'testField',
          value: 'test',
          position,
        }),
      })

      await PUT(request, {
        params: Promise.resolve({ id: mockDocumentId }),
      })

      const updateCall = mockPrisma.pdfField.update.mock.calls[0]?.[0]
      expect(updateCall?.data?.x).toBe(position.x)
      expect(updateCall?.data?.y).toBe(position.y)
      expect(updateCall?.data?.width).toBe(position.width)
      expect(updateCall?.data?.height).toBe(position.height)
    })
  })
})
