/**
 * GLXY Gaming Platform - Advanced Input Validation
 * Enterprise-grade input sanitization and validation
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Common validation patterns
export const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  gameId: /^[a-zA-Z0-9_-]{1,50}$/,
  roomId: /^[a-zA-Z0-9_-]{1,50}$/,
  sessionId: /^[a-zA-Z0-9_-]{20,100}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  jwt: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  float: /^[+-]?\d+(\.\d+)?$/,
  phone: /^\+?[\d\s\-\(\)]{10,20}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  filename: /^[a-zA-Z0-9._-]+$/,
  safeHtml: /^[\s\S]*$/ // Will be validated by DOMPurify
}

// SQL Injection patterns
export const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WHERE|FROM|INTO|TABLE|DATABASE)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bOR\b.*=.*\bOR\b)/i,
  /(\bAND\b.*=.*\bAND\b)/i,
  /(\bXOR\b.*=.*\bXOR\b)/i,
  /(1\s*=\s*1|1\s*=\s*0)/i,
  /(\bTRUE\b|\bFALSE\b)/i,
  /(\bNULL\b)/i,
  /(;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER))/i,
  /(\bWAITFOR\s+DELAY\b)/i,
  /(\bBENCHMARK\b)/i,
  /(\bSLEEP\b)/i,
  /(\bPG_SLEEP\b)/i
]

// XSS patterns
export const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<form[^>]*>.*?<\/form>/gi,
  /<input[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<style[^>]*>.*?<\/style>/gi,
  /on\w+\s*=/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:(?!image\/)/gi,
  /<\s*script/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /expression\s*\(/gi
]

// Command injection patterns
export const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]+/,
  /\b(cmd|bash|sh|powershell|eval|exec|system)\b/i,
  /\b(curl|wget|nc|netcat|telnet)\b/i,
  /\b(rm|mv|cp|cat|ls|ps|kill|chmod|chown)\b/i,
  /\b(grep|sed|awk|sort|uniq|wc)\b/i,
  /\b(python|perl|ruby|php|node)\b/i,
  /\b(ping|traceroute|nslookup|dig)\b/i,
  /(\.\.|\/|\|\\)/,
  /(\${|#|%|`)/
]

/**
 * Advanced input sanitization
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(input: string, options?: {
    allowedTags?: string[]
    allowedAttributes?: Record<string, string[]>
  }): string {
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span',
        'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code',
        'pre', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id',
        'style', 'target', 'rel', 'data-*'
      ],
      ...options
    }

    return DOMPurify.sanitize(input, config)
  }

  /**
   * Sanitize user input for general use
   */
  static sanitize(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 10000) // Limit length
  }

  /**
   * Sanitize for SQL queries (use parameterized queries when possible)
   */
  static sanitizeForSQL(input: string): string {
    return input
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove comments
      .replace(/\/\*|\*\//g, '') // Remove block comments
      .trim()
      .substring(0, 255)
  }

  /**
   * Sanitize for file names
   */
  static sanitizeFileName(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase()
      .substring(0, 255)
  }

  /**
   * Sanitize for URLs
   */
  static sanitizeURL(input: string): string {
    try {
      // Basic validation
      if (!PATTERNS.url.test(input)) {
        return ''
      }

      const url = new URL(input)

      // Only allow http/https
      if (!['http:', 'https:'].includes(url.protocol)) {
        return ''
      }

      // Remove potentially dangerous parts
      url.hash = ''
      url.username = ''
      url.password = ''

      return url.toString()
    } catch {
      return ''
    }
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJSON(input: any): any {
    try {
      const str = typeof input === 'string' ? input : JSON.stringify(input)
      const parsed = JSON.parse(str)

      // Recursively sanitize string values
      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          return this.sanitize(obj)
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject)
        }
        if (obj && typeof obj === 'object') {
          const result: any = {}
          for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = this.sanitize(key)
            if (sanitizedKey) {
              result[sanitizedKey] = sanitizeObject(value)
            }
          }
          return result
        }
        return obj
      }

      return sanitizeObject(parsed)
    } catch {
      return null
    }
  }
}

/**
 * Advanced input validation schemas
 */
export const ValidationSchemas = {
  // User-related schemas
  email: z.string().email().max(255),
  username: z.string()
    .min(3)
    .max(20)
    .regex(PATTERNS.username, 'Username must contain only letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8)
    .max(128)
    .regex(PATTERNS.password, 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'),

  // Game-related schemas
  gameId: z.string().regex(PATTERNS.gameId),
  roomId: z.string().regex(PATTERNS.roomId),
  moveData: z.object({
    from: z.string(),
    to: z.string(),
    game: z.string(),
    timestamp: z.number().optional()
  }),

  // API request schemas
  pagination: z.object({
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  // Search schemas
  searchQuery: z.string()
    .min(1)
    .max(100)
    .transform(val => InputSanitizer.sanitize(val)),

  // File upload schemas
  fileUpload: z.object({
    filename: z.string().max(255).transform(val => InputSanitizer.sanitizeFileName(val)),
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/json']),
    size: z.number().max(5 * 1024 * 1024), // 5MB max
    content: z.string().optional()
  }),

  // Configuration schemas
  themeConfig: z.object({
    primaryColor: z.string().regex(PATTERNS.hexColor),
    secondaryColor: z.string().regex(PATTERNS.hexColor),
    darkMode: z.boolean().default(false),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium')
  })
}

/**
 * Security threat detection
 */
export class ThreatDetector {
  /**
   * Detect SQL injection attempts
   */
  static detectSQLInjection(input: string): boolean {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))
  }

  /**
   * Detect XSS attempts
   */
  static detectXSS(input: string): boolean {
    return XSS_PATTERNS.some(pattern => pattern.test(input))
  }

  /**
   * Detect command injection attempts
   */
  static detectCommandInjection(input: string): boolean {
    return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input))
  }

  /**
   * Comprehensive threat detection
   */
  static detectThreats(input: string): {
    isThreat: boolean
    threats: string[]
    sanitized: string
  } {
    const threats: string[] = []

    if (this.detectSQLInjection(input)) {
      threats.push('SQL Injection')
    }

    if (this.detectXSS(input)) {
      threats.push('XSS')
    }

    if (this.detectCommandInjection(input)) {
      threats.push('Command Injection')
    }

    return {
      isThreat: threats.length > 0,
      threats,
      sanitized: InputSanitizer.sanitize(input)
    }
  }

  /**
   * Analyze request for potential threats
   */
  static analyzeRequest(data: Record<string, any>): {
    isThreat: boolean
    threats: string[]
    sanitizedData: Record<string, any>
  } {
    const allThreats: string[] = []
    const sanitizedData: Record<string, any> = {}

    const analyzeValue = (key: string, value: any): void => {
      if (typeof value === 'string') {
        const detection = this.detectThreats(value)
        if (detection.isThreat) {
          allThreats.push(...detection.threats.map(t => `${key}: ${t}`))
        }
        sanitizedData[key] = detection.sanitized
      } else if (Array.isArray(value)) {
        sanitizedData[key] = value.map((item, index) => {
          if (typeof item === 'string') {
            const detection = this.detectThreats(item)
            if (detection.isThreat) {
              allThreats.push(...detection.threats.map(t => `${key}[${index}]: ${t}`))
            }
            return detection.sanitized
          }
          return item
        })
      } else if (value && typeof value === 'object') {
        sanitizedData[key] = {}
        Object.entries(value).forEach(([subKey, subValue]) => {
          analyzeValue(`${key}.${subKey}`, subValue)
        })
      } else {
        sanitizedData[key] = value
      }
    }

    Object.entries(data).forEach(([key, value]) => {
      analyzeValue(key, value)
    })

    return {
      isThreat: allThreats.length > 0,
      threats: allThreats,
      sanitizedData
    }
  }
}

/**
 * Validation middleware helper
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Invalid input'] }
  }
}

/**
 * Rate limiting for validation failures
 */
export class ValidationRateLimit {
  private static failures = new Map<string, { count: number; lastAttempt: number }>()

  static isRateLimited(key: string, windowMs: number = 60000, maxFailures: number = 10): boolean {
    const now = Date.now()
    const record = this.failures.get(key)

    if (!record) {
      this.failures.set(key, { count: 1, lastAttempt: now })
      return false
    }

    if (now - record.lastAttempt > windowMs) {
      // Reset window
      this.failures.set(key, { count: 1, lastAttempt: now })
      return false
    }

    record.count++
    record.lastAttempt = now

    return record.count > maxFailures
  }

  static cleanup(): void {
    const now = Date.now()
    const windowMs = 60000 // 1 minute

    for (const [key, record] of this.failures.entries()) {
      if (now - record.lastAttempt > windowMs) {
        this.failures.delete(key)
      }
    }
  }
}

// Cleanup rate limit records periodically
setInterval(() => ValidationRateLimit.cleanup(), 60000)