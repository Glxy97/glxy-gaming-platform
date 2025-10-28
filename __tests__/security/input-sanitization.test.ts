/**
 * Security Tests - Input Sanitization and XSS Protection
 * Tests for SQL injection prevention and XSS protection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateAndSanitizeInput, sanitizeSqlInput } from '@/lib/auth-security'
import DOMPurify from 'isomorphic-dompurify'

describe('Input Sanitization and XSS Protection', () => {
  describe('sanitizeSqlInput', () => {
    it('should remove dangerous SQL characters', () => {
      const dangerousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "1' UNION SELECT * FROM users --"
      ]

      dangerousInputs.forEach(input => {
        const sanitized = sanitizeSqlInput(input)
        expect(sanitized).not.toContain("'")
        expect(sanitized).not.toContain('"')
        expect(sanitized).not.toContain(';')
        expect(sanitized).not.toContain('--')
        expect(sanitized).not.toContain('/*')
        expect(sanitized).not.toContain('*/')
        expect(sanitized).not.toContain('DROP')
        expect(sanitized).not.toContain('INSERT')
        expect(sanitized).not.toContain('DELETE')
        expect(sanitized).not.toContain('UPDATE')
        expect(sanitized).not.toContain('UNION')
        expect(sanitized).not.toContain('SELECT')
      })
    })

    it('should preserve safe characters', () => {
      const safeInput = 'Hello World 123'
      const sanitized = sanitizeSqlInput(safeInput)
      expect(sanitized).toBe(safeInput)
    })

    it('should handle empty and null inputs', () => {
      expect(sanitizeSqlInput('')).toBe('')
      expect(sanitizeSqlInput(null as any)).toBe('')
      expect(sanitizeSqlInput(undefined as any)).toBe('')
    })

    it('should handle very long inputs', () => {
      const longInput = 'A'.repeat(10000)
      const sanitized = sanitizeSqlInput(longInput)
      expect(sanitized.length).toBeLessThanOrEqual(1000) // Should be truncated
    })
  })

  describe('validateAndSanitizeInput', () => {
    describe('search sanitizer', () => {
      it('should sanitize search queries', () => {
        const maliciousSearch = "'; DROP TABLE users; --"
        const sanitized = validateAndSanitizeInput.search(maliciousSearch)
        
        expect(sanitized).not.toContain("'")
        expect(sanitized).not.toContain(';')
        expect(sanitized).not.toContain('--')
        expect(sanitized.length).toBeLessThanOrEqual(100)
      })

      it('should truncate long search queries', () => {
        const longSearch = 'A'.repeat(200)
        const sanitized = validateAndSanitizeInput.search(longSearch)
        expect(sanitized.length).toBeLessThanOrEqual(100)
      })
    })

    describe('email sanitizer', () => {
      it('should normalize email addresses', () => {
        const email = '  TEST@EXAMPLE.COM  '
        const sanitized = validateAndSanitizeInput.email(email)
        expect(sanitized).toBe('test@example.com')
      })

      it('should truncate long email addresses', () => {
        const longEmail = 'a'.repeat(300) + '@example.com'
        const sanitized = validateAndSanitizeInput.email(longEmail)
        expect(sanitized.length).toBeLessThanOrEqual(254)
      })
    })

    describe('username sanitizer', () => {
      it('should remove special characters from usernames', () => {
        const username = 'user@#$%^&*()name'
        const sanitized = validateAndSanitizeInput.username(username)
        expect(sanitized).toBe('username')
      })

      it('should allow valid username characters', () => {
        const username = 'user_123-name'
        const sanitized = validateAndSanitizeInput.username(username)
        expect(sanitized).toBe('user_123-name')
      })

      it('should truncate long usernames', () => {
        const longUsername = 'a'.repeat(30)
        const sanitized = validateAndSanitizeInput.username(longUsername)
        expect(sanitized.length).toBeLessThanOrEqual(20)
      })
    })

    describe('filename sanitizer', () => {
      it('should remove dangerous characters from filenames', () => {
        const filename = 'file<>:"|?*name.txt'
        const sanitized = validateAndSanitizeInput.filename(filename)
        expect(sanitized).toBe('filename.txt')
      })

      it('should allow safe filename characters', () => {
        const filename = 'my-file_123.pdf'
        const sanitized = validateAndSanitizeInput.filename(filename)
        expect(sanitized).toBe('my-file_123.pdf')
      })
    })

    describe('chatMessage sanitizer', () => {
      it('should sanitize HTML in chat messages', () => {
        const maliciousMessage = '<script>alert("XSS")</script>Hello <b>World</b>'
        const sanitized = validateAndSanitizeInput.chatMessage(maliciousMessage)
        
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('alert')
        expect(sanitized).toContain('Hello')
        expect(sanitized).toContain('<b>World</b>') // Should allow basic formatting
      })

      it('should allow safe HTML tags', () => {
        const message = 'Hello <b>bold</b> and <i>italic</i> text'
        const sanitized = validateAndSanitizeInput.chatMessage(message)
        expect(sanitized).toContain('<b>bold</b>')
        expect(sanitized).toContain('<i>italic</i>')
      })

      it('should truncate long messages', () => {
        const longMessage = 'A'.repeat(600)
        const sanitized = validateAndSanitizeInput.chatMessage(longMessage)
        expect(sanitized.length).toBeLessThanOrEqual(500)
      })
    })

    describe('richText sanitizer', () => {
      it('should allow more HTML tags for rich text', () => {
        const richText = '<p>Paragraph</p><br/><b>Bold</b><u>Underline</u>'
        const sanitized = validateAndSanitizeInput.richText(richText)
        expect(sanitized).toContain('<p>')
        expect(sanitized).toContain('<br/>')
        expect(sanitized).toContain('<b>')
        expect(sanitized).toContain('<u>')
      })

      it('should remove dangerous attributes', () => {
        const richText = '<p onclick="alert(\'XSS\')">Click me</p>'
        const sanitized = validateAndSanitizeInput.richText(richText)
        expect(sanitized).not.toContain('onclick')
        expect(sanitized).toContain('<p>Click me</p>')
      })
    })

    describe('htmlContent sanitizer', () => {
      it('should allow links and lists', () => {
        const htmlContent = '<p>Text with <a href="https://example.com">link</a></p><ul><li>Item</li></ul>'
        const sanitized = validateAndSanitizeInput.htmlContent(htmlContent)
        expect(sanitized).toContain('<a href="https://example.com">link</a>')
        expect(sanitized).toContain('<ul>')
        expect(sanitized).toContain('<li>Item</li>')
      })

      it('should sanitize dangerous links', () => {
        const htmlContent = '<a href="javascript:alert(\'XSS\')">Dangerous link</a>'
        const sanitized = validateAndSanitizeInput.htmlContent(htmlContent)
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).toContain('Dangerous link')
      })
    })

    describe('strict sanitizer', () => {
      it('should remove all HTML tags', () => {
        const htmlContent = '<p>Hello <b>World</b></p><script>alert("XSS")</script>'
        const sanitized = validateAndSanitizeInput.strict(htmlContent)
        expect(sanitized).toBe('Hello World')
        expect(sanitized).not.toContain('<')
        expect(sanitized).not.toContain('>')
      })

      it('should handle complex HTML structures', () => {
        const htmlContent = '<div><span>Nested <em>text</em></span></div>'
        const sanitized = validateAndSanitizeInput.strict(htmlContent)
        expect(sanitized).toBe('Nested text')
      })
    })
  })

  describe('XSS Attack Prevention', () => {
    it('should prevent script injection', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<object data="javascript:alert(\'XSS\')"></object>',
        '<embed src="javascript:alert(\'XSS\')">',
        '<form action="javascript:alert(\'XSS\')">',
        '<input onfocus="alert(\'XSS\')" autofocus>',
        '<select onfocus="alert(\'XSS\')" autofocus>',
        '<textarea onfocus="alert(\'XSS\')" autofocus>',
        '<keygen onfocus="alert(\'XSS\')" autofocus>',
        '<video><source onerror="alert(\'XSS\')">',
        '<audio src="x" onerror="alert(\'XSS\')">',
        '<details open ontoggle="alert(\'XSS\')">',
        '<marquee onstart="alert(\'XSS\')">'
      ]

      xssPayloads.forEach(payload => {
        const chatSanitized = validateAndSanitizeInput.chatMessage(payload)
        const richSanitized = validateAndSanitizeInput.richText(payload)
        const htmlSanitized = validateAndSanitizeInput.htmlContent(payload)
        const strictSanitized = validateAndSanitizeInput.strict(payload)

        // None should contain the dangerous parts
        expect(chatSanitized).not.toContain('<script>')
        expect(chatSanitized).not.toContain('onerror')
        expect(chatSanitized).not.toContain('onload')
        expect(chatSanitized).not.toContain('javascript:')

        expect(richSanitized).not.toContain('<script>')
        expect(richSanitized).not.toContain('onerror')
        expect(richSanitized).not.toContain('onload')
        expect(richSanitized).not.toContain('javascript:')

        expect(htmlSanitized).not.toContain('<script>')
        expect(htmlSanitized).not.toContain('onerror')
        expect(htmlSanitized).not.toContain('onload')
        expect(htmlSanitized).not.toContain('javascript:')

        expect(strictSanitized).not.toContain('<')
        expect(strictSanitized).not.toContain('>')
      })
    })

    it('should prevent CSS injection', () => {
      const cssPayloads = [
        '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',
        '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
        '<div style="background:url(\'javascript:alert(\\\'XSS\\\')\')">',
        '<div style="expression(alert(\'XSS\'))">'
      ]

      cssPayloads.forEach(payload => {
        const sanitized = validateAndSanitizeInput.chatMessage(payload)
        expect(sanitized).not.toContain('<style>')
        expect(sanitized).not.toContain('<link')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('expression(')
      })
    })

    it('should prevent data URI attacks', () => {
      const dataUriPayloads = [
        '<img src="data:text/html,<script>alert(\'XSS\')</script>">',
        '<iframe src="data:text/html,<script>alert(\'XSS\')</script>">',
        '<object data="data:text/html,<script>alert(\'XSS\')</script>">'
      ]

      dataUriPayloads.forEach(payload => {
        const sanitized = validateAndSanitizeInput.chatMessage(payload)
        expect(sanitized).not.toContain('data:text/html')
        expect(sanitized).not.toContain('<script>')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs', () => {
      expect(validateAndSanitizeInput.search(null as any)).toBe('')
      expect(validateAndSanitizeInput.search(undefined as any)).toBe('')
      expect(validateAndSanitizeInput.email(null as any)).toBe('')
      expect(validateAndSanitizeInput.username(undefined as any)).toBe('')
    })

    it('should handle non-string inputs', () => {
      expect(validateAndSanitizeInput.search(123 as any)).toBe('')
      expect(validateAndSanitizeInput.search({} as any)).toBe('')
      expect(validateAndSanitizeInput.search([] as any)).toBe('')
    })

    it('should handle empty strings', () => {
      expect(validateAndSanitizeInput.search('')).toBe('')
      expect(validateAndSanitizeInput.email('')).toBe('')
      expect(validateAndSanitizeInput.username('')).toBe('')
    })

    it('should handle Unicode and special characters', () => {
      const unicodeInput = 'Hello 世界 🌍 café naïve résumé'
      const sanitized = validateAndSanitizeInput.search(unicodeInput)
      expect(sanitized).toContain('Hello')
      expect(sanitized).toContain('世界')
      expect(sanitized).toContain('🌍')
      expect(sanitized).toContain('café')
    })

    it('should handle very long inputs efficiently', () => {
      const longInput = 'A'.repeat(100000)
      const startTime = Date.now()
      const sanitized = validateAndSanitizeInput.search(longInput)
      const endTime = Date.now()

      expect(sanitized.length).toBeLessThanOrEqual(100)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })
  })

  describe('DOMPurify Integration', () => {
    it('should use DOMPurify for HTML sanitization', () => {
      const maliciousHTML = '<script>alert("XSS")</script><p>Safe content</p>'
      
      // Test that our sanitizers use DOMPurify
      const chatSanitized = validateAndSanitizeInput.chatMessage(maliciousHTML)
      const richSanitized = validateAndSanitizeInput.richText(maliciousHTML)
      
      // Both should remove script tags but preserve safe content
      expect(chatSanitized).not.toContain('<script>')
      expect(chatSanitized).toContain('Safe content')
      expect(richSanitized).not.toContain('<script>')
      expect(richSanitized).toContain('<p>Safe content</p>')
    })

    it('should handle DOMPurify configuration correctly', () => {
      const htmlWithAttributes = '<p class="test" onclick="alert(\'XSS\')">Content</p>'
      
      const richSanitized = validateAndSanitizeInput.richText(htmlWithAttributes)
      const htmlSanitized = validateAndSanitizeInput.htmlContent(htmlWithAttributes)
      
      // Rich text should allow class but not onclick
      expect(richSanitized).toContain('class="test"')
      expect(richSanitized).not.toContain('onclick')
      
      // HTML content should allow class but not onclick
      expect(htmlSanitized).toContain('class="test"')
      expect(htmlSanitized).not.toContain('onclick')
    })
  })
})
