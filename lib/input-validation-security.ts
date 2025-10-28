/**
 * Comprehensive Input Validation & Sanitization Security Layer
 * Enterprise-grade input validation for GLXY Gaming Platform
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Security-focused validation schemas
export const securitySchemas = {
  // User input schemas
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .refine(email => validator.isEmail(email), 'Invalid email format'),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .refine(username => !username.toLowerCase().includes('admin'), 'Username cannot contain admin')
    .refine(username => !username.toLowerCase().includes('glxy'), 'Username cannot contain platform name')
    .refine(username => !/^\d+$/.test(username), 'Username cannot be only numbers'),

  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),

  // Game and content schemas
  gameRoomName: z.string()
    .min(1, 'Room name required')
    .max(50, 'Room name too long')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Invalid characters in room name'),

  chatMessage: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .refine(msg => !containsProfanity(msg), 'Message contains inappropriate content'),

  // File upload validation
  fileName: z.string()
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid characters in filename')
    .refine(name => !name.startsWith('.'), 'Filename cannot start with dot')
    .refine(name => isAllowedFileExtension(name), 'File type not allowed'),

  // API parameter validation
  userId: z.string()
    .uuid('Invalid user ID format'),

  gameId: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid game ID format')
    .max(50, 'Game ID too long'),

  // Security-sensitive inputs
  mfaToken: z.string()
    .length(6, 'MFA token must be 6 digits')
    .regex(/^\d{6}$/, 'MFA token must be numeric'),

  ipAddress: z.string()
    .refine(ip => validator.isIP(ip), 'Invalid IP address format'),

  // Search and filter inputs
  searchQuery: z.string()
    .max(100, 'Search query too long')
    .refine(query => !containsXSSPatterns(query), 'Invalid search query'),

  // Pagination and sorting
  page: z.number().int().positive().max(1000, 'Page number too high'),
  limit: z.number().int().positive().max(100, 'Limit too high'),
  sortBy: z.enum(['name', 'date', 'level', 'score', 'username']),
  sortOrder: z.enum(['asc', 'desc']),

  // JSON data validation
  gameSettings: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard']),
    timeLimit: z.number().int().positive().max(7200), // Max 2 hours
    maxPlayers: z.number().int().positive().max(10),
    isPublic: z.boolean()
  }),

  userProfile: z.object({
    bio: z.string().max(500, 'Bio too long').optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'auto']),
      notifications: z.boolean(),
      language: z.enum(['en', 'de', 'fr', 'es'])
    }).optional()
  })
}

// Advanced sanitization functions
export class InputSanitizer {

  static sanitizeHtml(input: string, allowedTags: string[] = []): string {
    const config = {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['href', 'title', 'alt'],
      FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'iframe'],
      KEEP_CONTENT: true
    }

    return DOMPurify.sanitize(input, config)
  }

  static sanitizeText(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .trim()
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255) // Limit length
  }

  static sanitizeSearchQuery(query: string): string {
    return query
      .replace(/[<>'"]/g, '') // Remove potential XSS chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100) // Limit length
  }

  static sanitizeUserInput(input: string): string {
    return validator.escape(input) // HTML encode
      .replace(/javascript:/gi, '') // Remove javascript URLs
      .trim()
  }
}

// Content filtering
function containsProfanity(text: string): boolean {
  const profanityList = [
    // Add your profanity filter list here
    // This is a simplified implementation
    'badword1', 'badword2', 'spam', 'scam'
  ]

  const lowerText = text.toLowerCase()
  return profanityList.some(word => lowerText.includes(word))
}

function containsXSSPatterns(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onclick=/i,
    /onerror=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

function isAllowedFileExtension(filename: string): boolean {
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', // Images
    '.pdf', '.txt', '.doc', '.docx', // Documents
    '.mp3', '.wav', '.ogg' // Audio (for game sounds)
  ]

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return allowedExtensions.includes(extension)
}

// Request validation middleware
export class RequestValidator {

  static validateApiRequest(schema: z.ZodSchema, data: any) {
    try {
      return {
        success: true,
        data: schema.parse(data),
        errors: null
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          data: null,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      }

      return {
        success: false,
        data: null,
        errors: [{ field: 'unknown', message: 'Validation failed', code: 'unknown' }]
      }
    }
  }

  static sanitizeAndValidate<T>(
    schema: z.ZodSchema<T>,
    data: any,
    sanitizers?: Record<string, (value: any) => any>
  ) {
    // Apply sanitizers first
    let sanitizedData = { ...data }

    if (sanitizers) {
      for (const [field, sanitizer] of Object.entries(sanitizers)) {
        if (sanitizedData[field] !== undefined) {
          sanitizedData[field] = sanitizer(sanitizedData[field])
        }
      }
    }

    // Then validate
    return this.validateApiRequest(schema, sanitizedData)
  }
}

// SQL injection prevention helpers
export class SQLSecurityValidator {

  static validateTableName(tableName: string): boolean {
    // Only allow alphanumeric and underscores for table names
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(tableName)
  }

  static validateColumnName(columnName: string): boolean {
    // Only allow alphanumeric and underscores for column names
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(columnName)
  }

  static validateOrderBy(orderBy: string): boolean {
    const allowedValues = ['ASC', 'DESC', 'asc', 'desc']
    return allowedValues.includes(orderBy)
  }

  static validateLimit(limit: number): boolean {
    return Number.isInteger(limit) && limit > 0 && limit <= 1000
  }
}

// File upload security
export class FileUploadValidator {

  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  static validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes
  }

  static validateImageFile(file: File): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      errors.push('File size too large. Maximum 5MB allowed.')
    }

    // Check filename
    if (!isAllowedFileExtension(file.name)) {
      errors.push('Invalid file extension.')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static async scanFileForMalware(file: File): Promise<boolean> {
    // In production, integrate with antivirus API
    // This is a placeholder implementation

    try {
      // Basic checks for suspicious content
      const buffer = await file.arrayBuffer()
      const content = new Uint8Array(buffer)

      // Check for common malware signatures (simplified)
      const suspiciousPatterns = [
        [0x4D, 0x5A], // PE executable header
        [0x7F, 0x45, 0x4C, 0x46], // ELF header
      ]

      for (const pattern of suspiciousPatterns) {
        if (content.length >= pattern.length) {
          const matches = pattern.every((byte, index) => content[index] === byte)
          if (matches) {
            return false // Suspicious file detected
          }
        }
      }

      return true // File appears safe
    } catch (error) {
      console.error('File scanning error:', error)
      return false // Fail closed - reject if scanning fails
    }
  }
}

// Rate limiting for input validation
export class ValidationRateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>()

  static checkValidationRate(identifier: string, maxAttempts: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  static resetValidationAttempts(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

export default {
  securitySchemas,
  InputSanitizer,
  RequestValidator,
  SQLSecurityValidator,
  FileUploadValidator,
  ValidationRateLimiter
}