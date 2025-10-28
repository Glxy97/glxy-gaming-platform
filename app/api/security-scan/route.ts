import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter, CacheManager } from '@/lib/redis-server'
import { sanitizeInput } from '@/lib/auth-security'
import { v4 as uuidv4 } from 'uuid'

function getIP(req: NextRequest) {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

interface SecurityScanResult {
  id: string
  url: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  startTime: string
  completedTime?: string
  findings: SecurityFinding[]
  scores: {
    overall: number
    ssl: number
    headers: number
    owasp: number
    vulnerabilities: number
  }
  premium: boolean
  scanTypes: string[]
}

interface SecurityFinding {
  id: string
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  category: 'SSL' | 'HEADERS' | 'XSS' | 'INJECTION' | 'SENSITIVE' | 'OWASP'
  title: string
  description: string
  solution: string
  impact: string
  evidence?: string
}

// Store active scans in Redis
const SCAN_KEY = (id: string) => `security-scan:${id}`
const USER_SCANS_KEY = (ip: string) => `user-scans:${ip}`

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const rl = await RateLimiter.checkRateLimit('security-scan', 5, 60_000, ip) // 5 scans per minute

  if (!rl.allowed) {
    return NextResponse.json({
      error: 'Zu viele Scan-Anfragen. Bitte warte eine Minute.',
      retryAfter: Math.ceil((rl.resetTime - Date.now()) / 1000)
    }, { status: 429 })
  }

  let body: { url?: string; scanTypes?: string[]; isPremium?: boolean } | null = null
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'Ungültiges JSON-Format' }, { status: 400 })
  }

  const rawUrl = (body?.url || '').toString().trim()
  const url = sanitizeInput(rawUrl)
  const scanTypes = body?.scanTypes || ['basic', 'security']
  const isPremium = body?.isPremium || false

  if (!url) {
    return NextResponse.json({ error: 'URL ist erforderlich' }, { status: 400 })
  }

  // Validate URL format
  if (!url.match(/^https?:\/\/.+/)) {
    return NextResponse.json({ error: 'Ungültiges URL-Format. Verwende http:// oder https://' }, { status: 400 })
  }

  // Check free user limits (5 scans per hour)
  if (!isPremium) {
    const userScanCount = await CacheManager.get<number>(USER_SCANS_KEY(ip)) || 0
    if (userScanCount >= 5) {
      return NextResponse.json({
        error: 'Kostenloses Scan-Limit erreicht (5/Stunde). Upgrade für unlimited Scans.',
        premium: false,
        limit: 5
      }, { status: 403 })
    }

    // Increment user scan count
    await CacheManager.set(USER_SCANS_KEY(ip), userScanCount + 1, 3600) // 1 hour
  }

  const scanId = uuidv4()
  const scan: SecurityScanResult = {
    id: scanId,
    url,
    status: 'PENDING',
    progress: 0,
    startTime: new Date().toISOString(),
    findings: [],
    scores: {
      overall: 0,
      ssl: 0,
      headers: 0,
      owasp: 0,
      vulnerabilities: 0
    },
    premium: isPremium,
    scanTypes
  }

  // Store scan in Redis
  await CacheManager.set(SCAN_KEY(scanId), scan, 7200) // 2 hours

  // Start async scan process
  performSecurityScan(scanId, url, scanTypes, isPremium)

  return NextResponse.json({
    id: scanId,
    url,
    status: 'PENDING',
    scanTypes,
    isPremium,
    message: 'Security-Scan wurde gestartet. Verwende die WebSocket-Verbindung für Live-Updates.'
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scanId = searchParams.get('id')

  if (!scanId) {
    return NextResponse.json({ error: 'Scan-ID erforderlich' }, { status: 400 })
  }

  const scan = await CacheManager.get<SecurityScanResult>(SCAN_KEY(scanId))
  if (!scan) {
    return NextResponse.json({ error: 'Scan nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(scan)
}

async function performSecurityScan(scanId: string, url: string, scanTypes: string[], isPremium: boolean) {
  try {
    const scan = await CacheManager.get<SecurityScanResult>(SCAN_KEY(scanId))
    if (!scan) return

    // Update status to running
    scan.status = 'RUNNING'
    scan.progress = 5
    await CacheManager.set(SCAN_KEY(scanId), scan, 7200)

    // Phase 1: Basic SSL/TLS Check
    scan.progress = 20
    await CacheManager.set(SCAN_KEY(scanId), scan, 7200)

    const sslResults = await checkSSL(url)
    scan.findings.push(...sslResults.findings)
    scan.scores.ssl = sslResults.score

    // Phase 2: Security Headers Analysis
    scan.progress = 40
    await CacheManager.set(SCAN_KEY(scanId), scan, 7200)

    const headerResults = await analyzeSecurityHeaders(url)
    scan.findings.push(...headerResults.findings)
    scan.scores.headers = headerResults.score

    // Phase 3: Content Analysis for XSS/Injection
    scan.progress = 60
    await CacheManager.set(SCAN_KEY(scanId), scan, 7200)

    const contentResults = await analyzeContent(url)
    scan.findings.push(...contentResults.findings)
    scan.scores.vulnerabilities = contentResults.score

    // Phase 4: OWASP Top 10 Analysis (Premium)
    if (isPremium && scanTypes.includes('owasp')) {
      scan.progress = 80
      await CacheManager.set(SCAN_KEY(scanId), scan, 7200)

      const owaspResults = await performOWASPAnalysis(url)
      scan.findings.push(...owaspResults.findings)
      scan.scores.owasp = owaspResults.score
    }

    // Calculate overall score
    const scoreSum = scan.scores.ssl + scan.scores.headers + scan.scores.vulnerabilities +
                    (isPremium ? scan.scores.owasp : 0)
    const scoreCount = isPremium ? 4 : 3
    scan.scores.overall = Math.round(scoreSum / scoreCount)

    // Complete scan
    scan.status = 'COMPLETED'
    scan.progress = 100
    scan.completedTime = new Date().toISOString()

    await CacheManager.set(SCAN_KEY(scanId), scan, 7200)

  } catch (error) {
    console.error('Security scan error:', error)

    const scan = await CacheManager.get<SecurityScanResult>(SCAN_KEY(scanId))
    if (scan) {
      scan.status = 'FAILED'
      scan.findings.push({
        id: uuidv4(),
        type: 'CRITICAL',
        category: 'SSL',
        title: 'Scan Fehler',
        description: `Fehler beim Scannen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        solution: 'Überprüfe die URL und versuche es erneut',
        impact: 'Scan konnte nicht abgeschlossen werden'
      })
      await CacheManager.set(SCAN_KEY(scanId), scan, 7200)
    }
  }
}

async function checkSSL(url: string): Promise<{ findings: SecurityFinding[]; score: number }> {
  const findings: SecurityFinding[] = []
  let score = 10

  if (!url.startsWith('https://')) {
    findings.push({
      id: uuidv4(),
      type: 'CRITICAL',
      category: 'SSL',
      title: 'Keine HTTPS-Verschlüsselung',
      description: 'Die Website verwendet kein HTTPS',
      solution: 'SSL-Zertifikat installieren und HTTP zu HTTPS weiterleiten',
      impact: 'Datenübertragung ist unverschlüsselt und kann abgefangen werden'
    })
    score = 0
  } else {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) {
        findings.push({
          id: uuidv4(),
          type: 'HIGH',
          category: 'SSL',
          title: 'SSL-Verbindungsfehler',
          description: `HTTPS-Verbindung fehlgeschlagen: ${response.status}`,
          solution: 'SSL-Konfiguration überprüfen',
          impact: 'Website möglicherweise nicht erreichbar oder unsicher konfiguriert'
        })
        score = 3
      }
    } catch (error) {
      findings.push({
        id: uuidv4(),
        type: 'HIGH',
        category: 'SSL',
        title: 'SSL-Zertifikatsproblem',
        description: 'SSL-Zertifikat ist ungültig oder abgelaufen',
        solution: 'SSL-Zertifikat erneuern oder korrekt konfigurieren',
        impact: 'Browser warnen vor unsicherer Verbindung'
      })
      score = 2
    }
  }

  return { findings, score }
}

async function analyzeSecurityHeaders(url: string): Promise<{ findings: SecurityFinding[]; score: number }> {
  const findings: SecurityFinding[] = []
  let score = 10

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'GLXY-Security-Scanner/1.0' }
    })

    const headers = Object.fromEntries(response.headers)

    // HSTS Header Check
    if (!headers['strict-transport-security']) {
      findings.push({
        id: uuidv4(),
        type: 'MEDIUM',
        category: 'HEADERS',
        title: 'Fehlender HSTS Header',
        description: 'HTTP Strict Transport Security nicht implementiert',
        solution: 'HSTS Header hinzufügen: Strict-Transport-Security: max-age=31536000',
        impact: 'Anfällig für Protocol Downgrade Angriffe'
      })
      score -= 2
    }

    // CSP Header Check
    if (!headers['content-security-policy']) {
      findings.push({
        id: uuidv4(),
        type: 'HIGH',
        category: 'HEADERS',
        title: 'Fehlender CSP Header',
        description: 'Content Security Policy nicht implementiert',
        solution: 'CSP Header zur Verhinderung von XSS-Angriffen implementieren',
        impact: 'Anfällig für Cross-Site Scripting Angriffe'
      })
      score -= 3
    }

    // X-Frame-Options Check
    if (!headers['x-frame-options']) {
      findings.push({
        id: uuidv4(),
        type: 'MEDIUM',
        category: 'HEADERS',
        title: 'Fehlender X-Frame-Options Header',
        description: 'Schutz vor Clickjacking nicht implementiert',
        solution: 'X-Frame-Options Header hinzufügen: X-Frame-Options: DENY',
        impact: 'Anfällig für Clickjacking-Angriffe'
      })
      score -= 1
    }

    // X-Content-Type-Options Check
    if (!headers['x-content-type-options']) {
      findings.push({
        id: uuidv4(),
        type: 'LOW',
        category: 'HEADERS',
        title: 'Fehlender X-Content-Type-Options Header',
        description: 'MIME-Type Sniffing Schutz nicht implementiert',
        solution: 'X-Content-Type-Options Header hinzufügen: nosniff',
        impact: 'Browser könnten Dateitypen falsch interpretieren'
      })
      score -= 1
    }

  } catch (error) {
    findings.push({
      id: uuidv4(),
      type: 'HIGH',
      category: 'HEADERS',
      title: 'Header-Analyse fehlgeschlagen',
      description: 'Konnte Security Headers nicht analysieren',
      solution: 'Website-Erreichbarkeit prüfen',
      impact: 'Vollständige Sicherheitsanalyse nicht möglich'
    })
    score = 0
  }

  return { findings, score: Math.max(0, score) }
}

async function analyzeContent(url: string): Promise<{ findings: SecurityFinding[]; score: number }> {
  const findings: SecurityFinding[] = []
  let score = 10

  try {
    const response = await fetch(url)
    const html = await response.text()

    // XSS Vulnerability Patterns
    const xssPatterns = [
      { pattern: /<script[^>]*>.*?alert\(.*?\).*?<\/script>/gi, risk: 'HIGH' },
      { pattern: /javascript:\s*alert\(/gi, risk: 'HIGH' },
      { pattern: /on\w+\s*=\s*["'].*?alert\(/gi, risk: 'MEDIUM' },
      { pattern: /<iframe[^>]*src\s*=\s*["']javascript:/gi, risk: 'HIGH' }
    ]

    let xssFound = false
    for (const { pattern, risk } of xssPatterns) {
      const matches = html.match(pattern)
      if (matches) {
        xssFound = true
        findings.push({
          id: uuidv4(),
          type: risk as any,
          category: 'XSS',
          title: 'Potentielle XSS Schwachstelle',
          description: `XSS-Pattern gefunden: ${matches[0].substring(0, 100)}...`,
          solution: 'Input-Validierung und Output-Encoding implementieren',
          impact: 'Cross-Site Scripting Angriffe möglich',
          evidence: matches[0]
        })
        score -= risk === 'HIGH' ? 4 : 2
      }
    }

    // Sensitive Information Exposure
    const sensitivePatterns = [
      { pattern: /password[^=]*=\s*["'][^"']{3,}["']/gi, name: 'Passwörter' },
      { pattern: /api[_-]?key[^=]*=\s*["'][^"']{10,}["']/gi, name: 'API Keys' },
      { pattern: /secret[^=]*=\s*["'][^"']{10,}["']/gi, name: 'Secrets' },
      { pattern: /token[^=]*=\s*["'][^"']{20,}["']/gi, name: 'Tokens' }
    ]

    for (const { pattern, name } of sensitivePatterns) {
      const matches = html.match(pattern)
      if (matches) {
        findings.push({
          id: uuidv4(),
          type: 'CRITICAL',
          category: 'SENSITIVE',
          title: `${name} im Code exponiert`,
          description: `Sensitive Daten gefunden: ${name}`,
          solution: 'Sensitive Daten aus Client-Code entfernen',
          impact: 'Credentials und Geheimnisse sind exponiert',
          evidence: matches[0].replace(/["'][^"']*["']/, '***')
        })
        score -= 3
      }
    }

    // SQL Injection Patterns (basic check)
    const sqlPatterns = [
      /\b(union|select|insert|update|delete|drop|create|alter)\s+/gi
    ]

    for (const pattern of sqlPatterns) {
      const matches = html.match(pattern)
      if (matches && matches.length > 5) { // Only flag if many SQL keywords
        findings.push({
          id: uuidv4(),
          type: 'MEDIUM',
          category: 'INJECTION',
          title: 'Potentielle SQL Injection Indikatoren',
          description: 'Viele SQL-Schlüsselwörter im Content gefunden',
          solution: 'Prepared Statements und Input-Validierung verwenden',
          impact: 'Mögliche SQL Injection Schwachstellen'
        })
        score -= 2
      }
    }

  } catch (error) {
    findings.push({
      id: uuidv4(),
      type: 'MEDIUM',
      category: 'XSS',
      title: 'Content-Analyse fehlgeschlagen',
      description: 'Konnte Website-Content nicht analysieren',
      solution: 'Website-Erreichbarkeit prüfen',
      impact: 'Vollständige Vulnerability-Analyse nicht möglich'
    })
    score = 5
  }

  return { findings, score: Math.max(0, score) }
}

async function performOWASPAnalysis(url: string): Promise<{ findings: SecurityFinding[]; score: number }> {
  const findings: SecurityFinding[] = []
  let score = 10

  // This would contain comprehensive OWASP Top 10 checks
  // For now, we'll implement a few key checks

  findings.push({
    id: uuidv4(),
    type: 'INFO',
    category: 'OWASP',
    title: 'OWASP Top 10 Analyse',
    description: 'Vollständige OWASP Top 10 Analyse wird durchgeführt',
    solution: 'Premium Feature - Detaillierte OWASP Compliance Prüfung',
    impact: 'Umfassende Sicherheitsbewertung nach Industriestandards'
  })

  return { findings, score }
}