/**
 * PDF Services - Zod Validation Schemas
 * Comprehensive validation for all PDF-related API requests
 */

import { z } from 'zod'

// ============================================================================
// Form Field Validation
// ============================================================================

export const FormFieldTypeSchema = z.enum([
  'text',
  'number',
  'email',
  'date',
  'checkbox',
  'radio',
  'select',
  'textarea',
  'signature',
])

export const FieldValidationSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
  })
  .optional()

export const FieldOptionSchema = z.object({
  label: z.string().min(1, 'Option label is required'),
  value: z.string().min(1, 'Option value is required'),
})

export const FormFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  name: z.string().min(1, 'Field name is required').regex(
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    'Field name must start with a letter and contain only letters, numbers, and underscores'
  ),
  type: FormFieldTypeSchema,
  label: z.string().min(1, 'Field label is required'),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
  ]),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  readOnly: z.boolean().default(false),
  validation: FieldValidationSchema,
  options: z.array(FieldOptionSchema).optional(),
})

// ============================================================================
// PDF Settings Validation
// ============================================================================

export const PageSizeSchema = z.enum([
  'A4',
  'Letter',
  'Legal',
  'A3',
  'A5',
  'Tabloid',
])

export const PageOrientationSchema = z.enum(['Portrait', 'Landscape'])

export const PdfPermissionsSchema = z.object({
  printing: z.boolean().default(true),
  modifying: z.boolean().default(false),
  copying: z.boolean().default(true),
  annotating: z.boolean().default(true),
})

export const PdfMetadataSchema = z.object({
  title: z.string().max(500, 'Title too long').optional(),
  author: z.string().max(200, 'Author name too long').optional(),
  subject: z.string().max(500, 'Subject too long').optional(),
  keywords: z.array(z.string()).max(20, 'Too many keywords').optional(),
  creator: z.string().max(200, 'Creator name too long').optional(),
})

export const PdfSettingsSchema = z.object({
  pageSize: PageSizeSchema.default('A4'),
  orientation: PageOrientationSchema.default('Portrait'),
  fillable: z.boolean().default(false),
  encrypted: z.boolean().default(false),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .optional(),
  permissions: PdfPermissionsSchema.optional(),
  metadata: PdfMetadataSchema.optional(),
})

// Password validation when encryption is enabled
export const PdfSettingsWithEncryptionSchema = PdfSettingsSchema.refine(
  (data) => {
    if (data.encrypted && !data.password) {
      return false
    }
    return true
  },
  {
    message: 'Password is required when encryption is enabled',
    path: ['password'],
  }
)

// ============================================================================
// API Request Validation
// ============================================================================

export const ProcessPdfRequestSchema = z.object({
  extractText: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('false'),
  extractFormFields: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('false'),
  analyzeStructure: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('true'),
  performOcr: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('false'),
  compressOutput: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('false'),
})

export const GeneratePdfRequestSchema = z.object({
  fields: z
    .array(FormFieldSchema)
    .min(1, 'At least one field is required')
    .max(100, 'Too many fields (max 100)'),
  template: z
    .string()
    .min(1, 'Template is required')
    .max(100, 'Template name too long')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Template name can only contain letters, numbers, hyphens, and underscores'
    ),
  settings: PdfSettingsWithEncryptionSchema,
})

// ============================================================================
// File Upload Validation
// ============================================================================

export const FileUploadSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z
    .number()
    .max(10 * 1024 * 1024, 'File size must not exceed 10MB')
    .positive('File size must be positive'),
  type: z.literal('application/pdf', {
    errorMap: () => ({ message: 'Only PDF files are allowed' }),
  }),
})

// ============================================================================
// Advanced Validation Options
// ============================================================================

export const WatermarkSchema = z.object({
  text: z.string().min(1, 'Watermark text required').max(200, 'Watermark text too long'),
  opacity: z.number().min(0).max(1),
  fontSize: z.number().min(8).max(72),
  rotation: z.number().min(-180).max(180),
})

export const HeaderFooterSchema = z.object({
  text: z.string().max(500, 'Text too long'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
})

export const PdfGenerationOptionsSchema = PdfSettingsSchema.extend({
  template: z.string().min(1),
  fields: z.array(FormFieldSchema).min(1).max(100),
  watermark: WatermarkSchema.optional(),
  header: HeaderFooterSchema.optional(),
  footer: HeaderFooterSchema.extend({
    pageNumbers: z.boolean().default(false),
  }).optional(),
}).refine(
  (data) => {
    if (data.encrypted && !data.password) {
      return false
    }
    return true
  },
  {
    message: 'Password is required when encryption is enabled',
    path: ['password'],
  }
)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate file upload from FormData
 */
export function validateFileUpload(file: File): { success: boolean; error?: string } {
  try {
    FileUploadSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      }
    }
    return { success: false, error: 'File validation failed' }
  }
}

/**
 * Validate PDF settings with encryption
 */
export function validatePdfSettings(
  settings: unknown
): { success: boolean; data?: z.infer<typeof PdfSettingsWithEncryptionSchema>; error?: string } {
  try {
    const validated = PdfSettingsWithEncryptionSchema.parse(settings)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return { success: false, error: 'Settings validation failed' }
  }
}

/**
 * Validate form fields array
 */
export function validateFormFields(
  fields: unknown
): { success: boolean; data?: z.infer<typeof FormFieldSchema>[]; error?: string } {
  try {
    const validated = z.array(FormFieldSchema).parse(fields)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return { success: false, error: 'Form fields validation failed' }
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200)
}

/**
 * Validate file extension
 */
export function isValidPdfExtension(filename: string): boolean {
  return /\.pdf$/i.test(filename)
}

/**
 * Validate PDF magic bytes
 */
export function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  const magicBytes = buffer.subarray(0, 4)
  const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF
  return magicBytes.equals(pdfMagic)
}

// ============================================================================
// Type Exports
// ============================================================================

export type FormFieldType = z.infer<typeof FormFieldTypeSchema>
export type PageSize = z.infer<typeof PageSizeSchema>
export type PageOrientation = z.infer<typeof PageOrientationSchema>
export type PdfSettings = z.infer<typeof PdfSettingsSchema>
export type ProcessPdfRequest = z.infer<typeof ProcessPdfRequestSchema>
export type GeneratePdfRequest = z.infer<typeof GeneratePdfRequestSchema>
export type PdfGenerationOptions = z.infer<typeof PdfGenerationOptionsSchema>
