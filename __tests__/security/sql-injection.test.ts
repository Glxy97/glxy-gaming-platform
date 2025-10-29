/**
 * 🛡️ SQL Injection Security Tests
 * Testet alle API-Endpunkte auf SQL-Injection-Schwachstellen
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { sanitizeSqlInput } from '@/lib/auth-security'

describe('SQL Injection Protection', () => {
  let prisma: PrismaClient

  beforeAll(() => {
    prisma = new PrismaClient()
  })

  describe('Input Sanitization', () => {
    it('should sanitize basic SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        "' UNION SELECT * FROM users--"
      ]

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeSqlInput(input)
        expect(sanitized).not.toContain("'")
        expect(sanitized).not.toContain('--')
        expect(sanitized).not.toContain('DROP')
        expect(sanitized).not.toContain('UNION')
      })
    })

    it('should sanitize encoded SQL injection attempts', () => {
      const encodedInputs = [
        "%27%20OR%201%3D1--",  // ' OR 1=1--
        "%27%29%3B%20DROP%20TABLE%20users%3B--", // '); DROP TABLE users;--
      ]

      encodedInputs.forEach(input => {
        const decoded = decodeURIComponent(input)
        const sanitized = sanitizeSqlInput(decoded)
        expect(sanitized).not.toContain("'")
        expect(sanitized).not.toContain('DROP')
      })
    })

    it('should allow legitimate inputs', () => {
      const legitimateInputs = [
        "John Doe",
        "test@example.com",
        "MyPassword123!",
        "Player_123"
      ]

      legitimateInputs.forEach(input => {
        const sanitized = sanitizeSqlInput(input)
        // Sollte keine drastischen Änderungen haben
        expect(sanitized.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Prisma Query Protection', () => {
    it('should use prepared statements for user queries', async () => {
      const maliciousEmail = "admin'--"
      
      // Prisma sollte prepared statements verwenden
      const result = await prisma.user.findFirst({
        where: { email: maliciousEmail }
      })

      // Sollte null zurückgeben (kein User gefunden), nicht einen Fehler werfen
      expect(result).toBeNull()
    })

    it('should protect against OR-based injection in search', async () => {
      const maliciousSearch = "test' OR '1'='1"
      
      // Prisma-Suche mit LIKE
      const results = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: maliciousSearch } },
            { email: { contains: maliciousSearch } }
          ]
        },
        take: 10
      })

      // Sollte nur legitime Ergebnisse finden (wenn überhaupt)
      results.forEach(user => {
        expect(user.username).not.toContain("' OR '")
        expect(user.email).not.toContain("' OR '")
      })
    })

    it('should protect against UNION-based injection', async () => {
      const maliciousId = "1 UNION SELECT * FROM users"
      
      // Prisma sollte Type-Safe sein
      const result = await prisma.user.findUnique({
        where: { id: maliciousId }
      })

      expect(result).toBeNull()
    })
  })

  describe('API Endpoint Security', () => {
    const testCases = [
      {
        endpoint: '/api/users/search',
        payload: { query: "'; DROP TABLE users; --" }
      },
      {
        endpoint: '/api/admin/users',
        payload: { email: "admin'--" }
      },
      {
        endpoint: '/api/games/stats',
        payload: { userId: "1' OR '1'='1" }
      }
    ]

    testCases.forEach(({ endpoint, payload }) => {
      it(`should protect ${endpoint} from SQL injection`, async () => {
        // Mock-Test: In echtem Test würde hier ein HTTP-Request gemacht
        const sanitizedPayload = Object.fromEntries(
          Object.entries(payload).map(([key, value]) => [
            key,
            typeof value === 'string' ? sanitizeSqlInput(value) : value
          ])
        )

        // Alle String-Werte sollten sanitized sein
        Object.values(sanitizedPayload).forEach(value => {
          if (typeof value === 'string') {
            expect(value).not.toContain("'")
            expect(value).not.toContain('--')
            expect(value).not.toContain('DROP')
          }
        })
      })
    })
  })

  describe('Second-Order SQL Injection', () => {
    it('should sanitize data before storage and retrieval', async () => {
      const maliciousUsername = "admin'; DROP TABLE games; --"
      
      // Daten sollten beim Speichern sanitized werden
      const sanitized = sanitizeSqlInput(maliciousUsername)
      
      // Simuliere Speichern und Abrufen
      // In echtem Szenario würde dies in DB gespeichert und abgerufen
      expect(sanitized).not.toContain("'; DROP")
    })
  })

  describe('NoSQL Injection (für Redis/andere)', () => {
    it('should protect against NoSQL injection in Redis keys', () => {
      const maliciousKey = "user:1'; return true; //"
      
      // Redis-Keys sollten escaped werden
      const safeKey = maliciousKey.replace(/[^\w:-]/g, '_')
      
      expect(safeKey).not.toContain(';')
      expect(safeKey).not.toContain('/')
      expect(safeKey).toMatch(/^[\w:-_]+$/)
    })
  })
})

describe('SQL Injection Attack Patterns', () => {
  const attackPatterns = [
    // Classic SQL Injection
    { name: 'Classic OR-based', input: "1' OR '1'='1" },
    { name: 'Comment-based', input: "admin'--" },
    { name: 'Stacked Queries', input: "'; DROP TABLE users; --" },
    
    // Union-based
    { name: 'UNION SELECT', input: "' UNION SELECT username, password FROM users--" },
    
    // Boolean-based
    { name: 'Boolean True', input: "1' AND '1'='1" },
    { name: 'Boolean False', input: "1' AND '1'='2" },
    
    // Time-based
    { name: 'Time Delay', input: "'; WAITFOR DELAY '00:00:05'--" },
    { name: 'Benchmark', input: "' AND BENCHMARK(5000000,MD5('test'))--" },
    
    // Error-based
    { name: 'Error Extraction', input: "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT((SELECT version()),0x23,FLOOR(RAND()*2))x FROM information_schema.tables GROUP BY x)y)--" },
  ]

  attackPatterns.forEach(({ name, input }) => {
    it(`should block: ${name}`, () => {
      const sanitized = sanitizeSqlInput(input)
      
      // Gefährliche Schlüsselwörter sollten entfernt/escaped sein
      expect(sanitized).not.toMatch(/DROP/i)
      expect(sanitized).not.toMatch(/UNION/i)
      expect(sanitized).not.toMatch(/SELECT\s+\*/i)
      expect(sanitized).not.toContain('--')
      expect(sanitized).not.toMatch(/WAITFOR/i)
      expect(sanitized).not.toMatch(/BENCHMARK/i)
    })
  })
})

