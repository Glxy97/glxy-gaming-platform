// @ts-nocheck
/**
 * PDF Field Validation Utilities
 * Validate extracted fields and their values
 */

import type { ExtractedField, FieldType, BoundingBox } from './types'

// ============================================
// = Validation Rules
// ============================================

export interface ValidationRule {
  type: FieldType
  pattern?: RegExp
  minLength?: number
  maxLength?: number
  required?: boolean
  customValidator?: (value: string) => boolean
}

export const DEFAULT_VALIDATION_RULES: Record<FieldType, ValidationRule> = {
  text: {
    type: 'text',
    minLength: 0,
    maxLength: 500,
  },
  number: {
    type: 'number',
    pattern: /^-?\d+(\.\d+)?$/,
    customValidator: (value: string) => !isNaN(parseFloat(value)),
  },
  date: {
    type: 'date',
    pattern: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/,
    customValidator: (value: string) => {
      const date = new Date(value)
      return !isNaN(date.getTime())
    },
  },
  checkbox: {
    type: 'checkbox',
    customValidator: (value: string) => {
      const normalized = value.toLowerCase()
      return ['true', 'false', 'yes', 'no', '1', '0', 'on', 'off'].includes(normalized)
    },
  },
  dropdown: {
    type: 'dropdown',
    minLength: 1,
  },
  signature: {
    type: 'signature',
    required: true,
    minLength: 1,
  },
}

// ============================================
// = Field Validation
// ============================================

export interface FieldValidationError {
  field: string
  error: string
  severity: 'error' | 'warning'
}

export interface FieldValidationResult {
  valid: boolean
  errors: FieldValidationError[]
  warnings: FieldValidationError[]
}

/**
 * Validate a single field value
 */
export function validateFieldValue(
  field: ExtractedField,
  value: string | undefined,
  rule?: ValidationRule
): FieldValidationResult {
  const errors: FieldValidationError[] = []
  const warnings: FieldValidationError[] = []

  const validationRule = rule || DEFAULT_VALIDATION_RULES[field.type]

  // Check required
  if (validationRule.required && (!value || value.trim().length === 0)) {
    errors.push({
      field: field.name,
      error: 'Field is required',
      severity: 'error',
    })
  }

  // Check if value exists
  if (!value || value.trim().length === 0) {
    return { valid: errors.length === 0, errors, warnings }
  }

  // Check min length
  if (validationRule.minLength !== undefined && value.length < validationRule.minLength) {
    errors.push({
      field: field.name,
      error: `Value must be at least ${validationRule.minLength} characters`,
      severity: 'error',
    })
  }

  // Check max length
  if (validationRule.maxLength !== undefined && value.length > validationRule.maxLength) {
    errors.push({
      field: field.name,
      error: `Value must not exceed ${validationRule.maxLength} characters`,
      severity: 'error',
    })
  }

  // Check pattern
  if (validationRule.pattern && !validationRule.pattern.test(value)) {
    errors.push({
      field: field.name,
      error: `Value does not match expected format for ${field.type}`,
      severity: 'error',
    })
  }

  // Check custom validator
  if (validationRule.customValidator && !validationRule.customValidator(value)) {
    errors.push({
      field: field.name,
      error: `Invalid ${field.type} value`,
      severity: 'error',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate all fields in a document
 */
export function validateFields(
  fields: ExtractedField[],
  values: Record<string, string>
): FieldValidationResult {
  const allErrors: FieldValidationError[] = []
  const allWarnings: FieldValidationError[] = []

  for (const field of fields) {
    const value = values[field.name]
    const result = validateFieldValue(field, value)

    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

// ============================================
// = Bounding Box Validation
// ============================================

export interface BoundingBoxValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate bounding box coordinates
 */
export function validateBoundingBox(bbox: BoundingBox): BoundingBoxValidationResult {
  const errors: string[] = []

  // Check if coordinates are in valid range (0-1)
  if (bbox.x < 0 || bbox.x > 1) {
    errors.push(`X coordinate ${bbox.x} is out of range (0-1)`)
  }

  if (bbox.y < 0 || bbox.y > 1) {
    errors.push(`Y coordinate ${bbox.y} is out of range (0-1)`)
  }

  if (bbox.width < 0 || bbox.width > 1) {
    errors.push(`Width ${bbox.width} is out of range (0-1)`)
  }

  if (bbox.height < 0 || bbox.height > 1) {
    errors.push(`Height ${bbox.height} is out of range (0-1)`)
  }

  // Check if field is not out of page bounds
  if (bbox.x + bbox.width > 1) {
    errors.push(`Field extends beyond page right edge (x + width = ${bbox.x + bbox.width})`)
  }

  if (bbox.y + bbox.height > 1) {
    errors.push(`Field extends beyond page bottom edge (y + height = ${bbox.y + bbox.height})`)
  }

  // Check minimum size
  const minSize = 0.01 // 1% of page
  if (bbox.width < minSize || bbox.height < minSize) {
    errors.push(`Field is too small (min size: ${minSize * 100}%)`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// = Field Confidence Validation
// ============================================

export interface ConfidenceCheck {
  field: string
  confidence: number
  status: 'high' | 'medium' | 'low'
  requiresReview: boolean
}

/**
 * Check field confidence and suggest review
 */
export function checkFieldConfidence(field: ExtractedField): ConfidenceCheck {
  const { confidence, name } = field

  let status: 'high' | 'medium' | 'low'
  let requiresReview: boolean

  if (confidence >= 0.9) {
    status = 'high'
    requiresReview = false
  } else if (confidence >= 0.7) {
    status = 'medium'
    requiresReview = true
  } else {
    status = 'low'
    requiresReview = true
  }

  return {
    field: name,
    confidence,
    status,
    requiresReview,
  }
}

/**
 * Get fields that require manual review
 */
export function getFieldsRequiringReview(
  fields: ExtractedField[],
  threshold: number = 0.9
): ExtractedField[] {
  return fields.filter(field => field.confidence < threshold)
}

// ============================================
// = Field Completeness Check
// ============================================

export interface CompletenessReport {
  totalFields: number
  filledFields: number
  emptyFields: number
  completeness: number // 0-1
  missingRequiredFields: string[]
}

/**
 * Check document completeness
 */
export function checkDocumentCompleteness(
  fields: ExtractedField[],
  values: Record<string, string>,
  requiredFields: string[] = []
): CompletenessReport {
  let filledCount = 0
  const missingRequired: string[] = []

  for (const field of fields) {
    const value = values[field.name]
    const isFilled = value && value.trim().length > 0

    if (isFilled) {
      filledCount++
    }

    if (requiredFields.includes(field.name) && !isFilled) {
      missingRequired.push(field.name)
    }
  }

  return {
    totalFields: fields.length,
    filledFields: filledCount,
    emptyFields: fields.length - filledCount,
    completeness: fields.length > 0 ? filledCount / fields.length : 0,
    missingRequiredFields: missingRequired,
  }
}

// ============================================
// = Email/Phone Validators
// ============================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/
export const ZIP_REGEX = /^\d{5}(-\d{4})?$/
export const SSN_REGEX = /^\d{3}-\d{2}-\d{4}$/

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return cleaned.length >= 10 && PHONE_REGEX.test(phone)
}

/**
 * Validate US ZIP code
 */
export function isValidZipCode(zip: string): boolean {
  return ZIP_REGEX.test(zip)
}

/**
 * Validate US Social Security Number
 */
export function isValidSSN(ssn: string): boolean {
  return SSN_REGEX.test(ssn)
}

// ============================================
// = Field Sanitization
// ============================================

/**
 * Sanitize field value based on type
 */
export function sanitizeFieldValue(value: string, type: FieldType): string {
  switch (type) {
    case 'text':
      return value.trim()

    case 'number':
      return value.replace(/[^\d\.\-]/g, '')

    case 'date':
      // Normalize to YYYY-MM-DD
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
      return value.trim()

    case 'checkbox':
      const normalized = value.toLowerCase().trim()
      if (['true', 'yes', '1', 'on'].includes(normalized)) {
        return 'true'
      }
      if (['false', 'no', '0', 'off'].includes(normalized)) {
        return 'false'
      }
      return value

    default:
      return value.trim()
  }
}

/**
 * Sanitize all field values
 */
export function sanitizeFieldValues(
  fields: ExtractedField[],
  values: Record<string, string>
): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const field of fields) {
    const value = values[field.name]
    if (value) {
      sanitized[field.name] = sanitizeFieldValue(value, field.type)
    }
  }

  return sanitized
}
