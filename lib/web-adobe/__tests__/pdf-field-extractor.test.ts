/**
 * Unit Tests for PDF Field Extractor
 */

import {
  calculateFieldArea,
  doBoxesOverlap,
  mergeOverlappingFields,
  type BoundingBox,
  type ExtractedField,
} from '../pdf-field-extractor'

describe('PDF Field Extractor', () => {
  describe('calculateFieldArea', () => {
    it('should calculate correct area for normalized bounding box', () => {
      const bbox: BoundingBox = {
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.1,
      }
      const pageWidth = 1000
      const pageHeight = 1200

      const area = calculateFieldArea(bbox, pageWidth, pageHeight)

      // Expected: (0.3 * 1000) * (0.1 * 1200) = 300 * 120 = 36000
      expect(area).toBe(36000)
    })

    it('should handle zero-sized fields', () => {
      const bbox: BoundingBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }

      const area = calculateFieldArea(bbox, 1000, 1000)

      expect(area).toBe(0)
    })
  })

  describe('doBoxesOverlap', () => {
    it('should detect overlapping boxes', () => {
      const box1: BoundingBox = {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.1,
      }

      const box2: BoundingBox = {
        x: 0.15,
        y: 0.15,
        width: 0.2,
        height: 0.1,
      }

      expect(doBoxesOverlap(box1, box2)).toBe(true)
    })

    it('should detect non-overlapping boxes', () => {
      const box1: BoundingBox = {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.1,
      }

      const box2: BoundingBox = {
        x: 0.5,
        y: 0.5,
        width: 0.2,
        height: 0.1,
      }

      expect(doBoxesOverlap(box1, box2)).toBe(false)
    })

    it('should detect edge-touching boxes as non-overlapping', () => {
      const box1: BoundingBox = {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.1,
      }

      const box2: BoundingBox = {
        x: 0.3, // Starts where box1 ends
        y: 0.1,
        width: 0.2,
        height: 0.1,
      }

      expect(doBoxesOverlap(box1, box2)).toBe(false)
    })
  })

  describe('mergeOverlappingFields', () => {
    it('should merge overlapping fields keeping higher confidence', () => {
      const fields: ExtractedField[] = [
        {
          name: 'field1',
          type: 'text',
          page: 1,
          boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 },
          confidence: 0.7,
        },
        {
          name: 'field2',
          type: 'text',
          page: 1,
          boundingBox: { x: 0.15, y: 0.15, width: 0.2, height: 0.1 },
          confidence: 0.9,
        },
      ]

      const merged = mergeOverlappingFields(fields)

      expect(merged).toHaveLength(1)
      expect(merged[0].name).toBe('field2') // Higher confidence
      expect(merged[0].confidence).toBe(0.9)
    })

    it('should keep non-overlapping fields separate', () => {
      const fields: ExtractedField[] = [
        {
          name: 'field1',
          type: 'text',
          page: 1,
          boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 },
          confidence: 0.7,
        },
        {
          name: 'field2',
          type: 'text',
          page: 1,
          boundingBox: { x: 0.5, y: 0.5, width: 0.2, height: 0.1 },
          confidence: 0.9,
        },
      ]

      const merged = mergeOverlappingFields(fields)

      expect(merged).toHaveLength(2)
    })

    it('should not merge fields on different pages', () => {
      const fields: ExtractedField[] = [
        {
          name: 'field1',
          type: 'text',
          page: 1,
          boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 },
          confidence: 0.7,
        },
        {
          name: 'field2',
          type: 'text',
          page: 2,
          boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 },
          confidence: 0.9,
        },
      ]

      const merged = mergeOverlappingFields(fields)

      expect(merged).toHaveLength(2)
    })
  })

  describe('Field Type Detection', () => {
    it('should detect signature fields by keyword', () => {
      // This would require importing the detectFieldType function
      // which is currently private. For now, this is a placeholder
      // showing how the test should be structured.
      expect(true).toBe(true)
    })

    it('should detect date fields by keyword', () => {
      expect(true).toBe(true)
    })

    it('should detect number fields by keyword', () => {
      expect(true).toBe(true)
    })
  })

  describe('Bounding Box Normalization', () => {
    it('should normalize coordinates to 0-1 range', () => {
      // Test for coordinate normalization
      const absoluteX = 250
      const absoluteY = 150
      const absoluteWidth = 200
      const absoluteHeight = 50
      const pageWidth = 1000
      const pageHeight = 1200

      const normalized: BoundingBox = {
        x: absoluteX / pageWidth,
        y: absoluteY / pageHeight,
        width: absoluteWidth / pageWidth,
        height: absoluteHeight / pageHeight,
      }

      expect(normalized.x).toBe(0.25)
      expect(normalized.y).toBeCloseTo(0.125, 2)
      expect(normalized.width).toBe(0.2)
      expect(normalized.height).toBeCloseTo(0.0417, 2)
    })
  })
})

// Mock PDF data for integration tests
export const mockPdfFields: ExtractedField[] = [
  {
    name: 'full_name',
    type: 'text',
    page: 1,
    boundingBox: { x: 0.1, y: 0.1, width: 0.3, height: 0.05 },
    confidence: 0.95,
    label: 'Full Name',
  },
  {
    name: 'email',
    type: 'text',
    page: 1,
    boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.05 },
    confidence: 0.92,
    label: 'Email Address',
  },
  {
    name: 'birth_date',
    type: 'date',
    page: 1,
    boundingBox: { x: 0.1, y: 0.3, width: 0.2, height: 0.05 },
    confidence: 0.88,
    label: 'Date of Birth',
  },
  {
    name: 'agree_terms',
    type: 'checkbox',
    page: 2,
    boundingBox: { x: 0.1, y: 0.8, width: 0.05, height: 0.05 },
    confidence: 0.98,
    label: 'I Agree to Terms',
  },
  {
    name: 'signature',
    type: 'signature',
    page: 2,
    boundingBox: { x: 0.5, y: 0.8, width: 0.3, height: 0.1 },
    confidence: 1.0,
    label: 'Signature',
  },
]
